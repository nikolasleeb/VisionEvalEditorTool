# Desktop Release Notes

VisionEval Editor is packaged as a separate Tauri desktop app.

## Build

```bash
cd desktop
npm install
npm run tauri:build
```

The Tauri build runs `packaging/build-backend.sh`, which builds the Python backend with PyInstaller and stages it as a Tauri sidecar binary.

## macOS

Build on macOS to produce the `.app` and `.dmg` artifacts. Code signing and notarization can be added later when an Apple Developer ID is available.

## Windows

Build on Windows or a Windows GitHub Actions runner to produce the NSIS installer. Windows builds require Rust, Node, Python, PyInstaller, and the Tauri Windows prerequisites.

## Release Assets

Attach the platform installer artifacts to GitHub Releases. Do not attach local workspaces or generated scenario outputs.
