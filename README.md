# VisionEval Editor

VisionEval Editor is a macOS desktop app for previewing and creating VisionEval input scenario edits before writing scenario folders.

For V1, the desktop app is the supported release. The older local browser workflow remains available for development and fallback use.

## What It Does

- Draft multiple scenario variants and file edits in one project.
- Filter edits by geography and target year.
- Filter Virginia inputs by county, zone, or MPO preset where matching locality codes are available.
- Apply single-file edits or batch changes across selected files and columns, including select-all editable columns for batch work.
- Preview changes in the browser before any files are written.
- Create scenario folders, edited input files, and change logs.
- Open bundled PlanRVA file explanations for supported VisionEval input files.
- Export created scenarios as ZIP files for moving to another computer to run VisionEval.

## Quick Start

Download the latest macOS DMG from the GitHub Releases page, open it, and install **VisionEval Editor.app**.

On first launch, the app creates a workspace under Application Support unless you choose a different workspace. The workspace contains:

- `InputLibrary` for input-library folders.
- `Scenarios` for generated scenario folders and saved drafts.
- `Clean Explanations/PlanRVA` for Word explanation files.

Use **Open InputLibrary Folder** to add or remove whole input-library folders. Use **Create Scenario** or **Export Scenario ZIP** to produce scenario outputs that can be moved to the computer where VisionEval will run.

## Local Development / Legacy Web Mode

Requirements for local development:

- Python 3
- A modern web browser
- No web framework install is required for the local server.

Run the editor:

```bash
cd /path/to/VisionEvalEditor
python3 app.py
```

Then open:

```text
http://127.0.0.1:3000
```

## Desktop App Packaging

The editor can also be packaged as a standalone desktop app with Tauri.

- The desktop app opens in its own window instead of a browser tab.
- Tauri starts a bundled PyInstaller backend sidecar automatically.
- On first launch, the app creates or resolves a workspace for generated scenarios and local configuration.
- The bundled app includes `InputLibrary`, `Metadata`, PlanRVA explanations, `public`, and `UserGuide.md`.
- No personal paths are baked into the app; packaged mode reads the chosen workspace from app config.

Build requirements:

- Rust and Cargo
- Node.js and npm
- Python 3
- PyInstaller
- Tauri build prerequisites for macOS or Windows

Build from the desktop folder:

```bash
cd desktop
npm install
npm run tauri:build
```

macOS builds produce a `.app`/`.dmg`. Windows builds should be produced on Windows or in a Windows CI runner and produce an NSIS installer.

## Repository Contents

- `app.py`: local Python server and API.
- `public/`: browser interface files.
- `InputLibrary/`: bundled VisionEval input CSV libraries.
- `Metadata/`: variable descriptions, units, and helper metadata.
- `Clean Explanations/DOCX/`: bundled PlanRVA Word explanation files shown in the UI and seeded into desktop workspaces.
- `UserGuide.md`: detailed user guide shown inside the app.
- `Scenarios/`: local generated scenario outputs; intentionally ignored by git.

## Basic Workflow

1. Start a new scenario.
2. Choose an input library.
3. Add scenarios and file edits.
4. Select locations, years, columns, operations, and values.
5. Preview changes in the browser.
6. Review the planned output in Overview/Submit.
7. Create the scenario folder and log.

## Important Notes

- Edits are preview-only until `Create Scenario` is selected.
- Refreshing the browser can clear unsaved in-browser draft state.
- The editor automatically preserves original value formatting where possible, including rounding integer-looking values back to integers.
- Very small percentage changes may not visibly change integer cells if the calculated value rounds back to the original integer.
- Virginia MPO presets select whole localities from the MPO listing; partial or urbanized-area MPO entries are treated as the whole county/city because this editor does not include MPO boundary geometry.
- Scenario outputs are local and are not committed to this repository.

## Upcoming/Planned Features

- Input file variable tagging and grouping.
- Custom region builder for creating user-defined regions similar to MPO filters from Virginia data.

## Developed By

Nikolas Lee-Bishop, VDOT intern at the Virginia Transportation Research Council, Summer 2026.

## Contact

## Detailed Guide

See [UserGuide.md](UserGuide.md) for the full workflow, interface notes, and troubleshooting guidance.

## Development Notes

The current app uses a Python standard-library HTTP server and plain browser assets.

Main files:

- `app.py`
- `public/app.js`
- `public/index.html`
- `public/styles.css`
- `UserGuide.md`
- `desktop/`
- `packaging/`

Recommended checks:

```bash
python3 -m py_compile app.py
node --check public/app.js
```
