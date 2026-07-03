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

Apple Silicon only:

```bash
cd desktop
npm run tauri:build -- --target aarch64-apple-darwin
```

Universal Mac, for both Apple Silicon and Intel Macs:

```bash
rustup target add x86_64-apple-darwin
cd desktop
npm run tauri:build -- --target universal-apple-darwin
```

The universal build creates:

```text
desktop/src-tauri/target/universal-apple-darwin/release/bundle/dmg/VisionEval Editor_0.1.0_universal.dmg
```

## Windows

Build on Windows or a Windows GitHub Actions runner to produce the NSIS installer. Windows builds require Rust, Node, Python, PyInstaller, and the Tauri Windows prerequisites.

From a Windows checkout:

```powershell
cd desktop
npm install
npm run tauri:build
```

The expected NSIS installer path is:

```text
desktop\src-tauri\target\release\bundle\nsis\VisionEval Editor_0.1.0_x64-setup.exe
```

## Release Assets

Attach the platform installer artifacts to GitHub Releases. Do not attach local workspaces or generated scenario outputs.

Useful V1 upload commands:

```bash
gh release upload v1.0.0 \
  "desktop/src-tauri/target/universal-apple-darwin/release/bundle/dmg/VisionEval Editor_0.1.0_universal.dmg#VisionEval-Editor-v1.0.0-mac-universal.dmg"
```

```powershell
gh release upload v1.0.0 `
  "desktop\src-tauri\target\release\bundle\nsis\VisionEval Editor_0.1.0_x64-setup.exe#VisionEval-Editor-v1.0.0-windows-x64.exe"
```
