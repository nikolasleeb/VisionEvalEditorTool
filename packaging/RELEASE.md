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

Intel Mac:

```bash
rustup target add x86_64-apple-darwin
cd desktop
npm run tauri:build -- --target x86_64-apple-darwin
```

The Intel build should be produced on an Intel macOS runner or another environment where PyInstaller uses an x86_64 Python runtime. Building a universal Tauri wrapper on Apple Silicon is not enough, because the embedded PyInstaller Python runtime can still be arm64-only.

The Intel build creates:

```text
desktop/src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/VisionEval Editor_0.1.0_x64.dmg
```

## Windows

Build on Windows or a Windows GitHub Actions runner to produce the NSIS installer. Windows builds require Rust, Node, Python, PyInstaller, and the Tauri Windows prerequisites.

The Windows NSIS installer is configured as `currentUser`, so it installs into the user's profile instead of requiring machine-wide admin elevation.

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
  "desktop/src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/VisionEval Editor_0.1.0_aarch64.dmg#VisionEval-Editor-v1.0.0-mac-arm64.dmg"
```

```bash
gh release upload v1.0.0 \
  "desktop/src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/VisionEval Editor_0.1.0_x64.dmg#VisionEval-Editor-v1.0.0-mac-x64.dmg"
```

```powershell
gh release upload v1.0.0 `
  "desktop\src-tauri\target\release\bundle\nsis\VisionEval Editor_0.1.0_x64-setup.exe#VisionEval-Editor-v1.0.0-windows-x64-user.exe"
```
