use serde::{Deserialize, Serialize};
use std::fs;
use std::net::TcpListener;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;

#[derive(Default)]
struct BackendState {
    child: Mutex<Option<Child>>,
    port: Mutex<Option<u16>>,
}

#[derive(Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct DesktopConfig {
    workspace_root: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopState {
    workspace_root: String,
}

fn config_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("desktop-config.json"))
}

fn read_config(app: &AppHandle) -> DesktopConfig {
    let Ok(path) = config_path(app) else {
        return DesktopConfig::default();
    };
    let Ok(text) = fs::read_to_string(path) else {
        return DesktopConfig::default();
    };
    serde_json::from_str(&text).unwrap_or_default()
}

fn write_config(app: &AppHandle, config: &DesktopConfig) -> Result<(), String> {
    let path = config_path(app)?;
    let text = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(path, text).map_err(|e| e.to_string())
}

fn default_workspace(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("Workspace"))
}

fn ensure_config(app: &AppHandle) -> Result<DesktopConfig, String> {
    let mut config = read_config(app);
    if config.workspace_root.trim().is_empty() {
        let workspace_root = default_workspace(app)?;
        fs::create_dir_all(&workspace_root).map_err(|e| e.to_string())?;
        config.workspace_root = workspace_root.to_string_lossy().to_string();
        write_config(app, &config)?;
    }
    Ok(config)
}

fn free_port() -> Result<u16, String> {
    let listener = TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
    Ok(listener.local_addr().map_err(|e| e.to_string())?.port())
}

#[tauri::command]
fn desktop_state(app: AppHandle) -> DesktopState {
    let config = ensure_config(&app).unwrap_or_else(|_| read_config(&app));
    DesktopState {
        workspace_root: config.workspace_root,
    }
}

#[tauri::command]
async fn choose_workspace(app: AppHandle) -> Result<Option<String>, String> {
    let (tx, rx) = std::sync::mpsc::channel();
    app.dialog().file().pick_folder(move |path| {
        let _ = tx.send(path);
    });

    let Some(path) = rx.recv().map_err(|e| e.to_string())? else {
        return Ok(None);
    };
    let workspace_root = path.to_string();
    write_config(
        &app,
        &DesktopConfig {
            workspace_root: workspace_root.clone(),
        },
    )?;
    Ok(Some(workspace_root))
}

#[tauri::command]
fn start_backend(app: AppHandle, state: tauri::State<BackendState>) -> Result<String, String> {
    if let Some(port) = *state.port.lock().map_err(|e| e.to_string())? {
        return Ok(format!("http://127.0.0.1:{port}"));
    }

    let config = ensure_config(&app)?;

    let port = free_port()?;
    let config_file = PathBuf::from(&config.workspace_root).join("config.json");
    let backend_path = std::env::current_exe()
        .map_err(|e| e.to_string())?
        .parent()
        .ok_or_else(|| "Could not resolve app executable directory.".to_string())?
        .join("vision-eval-editor-backend");
    let child = Command::new(&backend_path)
        .env("PORT", port.to_string())
        .env("VISIONEVAL_WORKSPACE_ROOT", &config.workspace_root)
        .env("VE_TOOLS_CONFIG", config_file.to_string_lossy().to_string())
        .spawn()
        .map_err(|e| format!("{}: {}", backend_path.display(), e))?;
    *state.child.lock().map_err(|e| e.to_string())? = Some(child);

    let url = format!("http://127.0.0.1:{port}");
    let health = format!("{url}/api/health");
    let started = Instant::now();
    while started.elapsed() < Duration::from_secs(30) {
        if let Ok(response) = ureq::get(&health).call() {
            if response.status() == 200 {
                *state.port.lock().map_err(|e| e.to_string())? = Some(port);
                return Ok(url);
            }
        }
        std::thread::sleep(Duration::from_millis(250));
    }
    Err("Backend did not become ready within 30 seconds.".to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(BackendState::default())
        .invoke_handler(tauri::generate_handler![
            desktop_state,
            choose_workspace,
            start_backend
        ])
        .on_window_event(|window, event| {
            if matches!(event, tauri::WindowEvent::CloseRequested { .. }) {
                if let Some(state) = window.try_state::<BackendState>() {
                    if let Ok(mut child) = state.child.lock() {
                        if let Some(mut running) = child.take() {
                            let _ = running.kill();
                        }
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running VisionEval Editor");
}
