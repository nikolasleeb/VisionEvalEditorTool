# VisionEval Editor Tool

A local browser-based tool for previewing and creating VisionEval input scenario edits before writing scenario folders.

## What It Does

- Draft multiple simulations and file edits in one scenario.
- Filter edits by geography and target year.
- Apply single-file edits or batch changes across selected files and columns.
- Preview changes in the browser before any files are written.
- Create scenario folders, edited input files, and change logs.
- Open bundled file explanations for supported VisionEval input files.

## Quick Start

Requirements:

- Python 3
- A modern web browser
- No web framework install is required for the current local server.

Run the editor:

```bash
cd /path/to/VisionEvalEditor
python3 app.py
```

Then open:

```text
http://127.0.0.1:3000
```

## Repository Contents

- `app.py`: local Python server and API.
- `public/`: browser interface files.
- `InputLibrary/`: bundled VisionEval input CSV libraries.
- `Metadata/`: variable descriptions, units, and helper metadata.
- `Clean Explanations/DOCX/`: Word explanation files shown in the UI.
- `UserGuide.md`: detailed user guide shown inside the app.
- `Scenarios/`: local generated scenario outputs; intentionally ignored by git.

## Basic Workflow

1. Start a new scenario.
2. Choose an input library.
3. Add simulations and file edits.
4. Select locations, years, columns, operations, and values.
5. Preview changes in the browser.
6. Review the planned output in Overview/Submit.
7. Create the scenario folder and log.

## Important Notes

- Edits are preview-only until `Create Scenario` is selected.
- Refreshing the browser can clear unsaved in-browser draft state.
- The editor automatically preserves original value formatting where possible, including rounding integer-looking values back to integers.
- Very small percentage changes may not visibly change integer cells if the calculated value rounds back to the original integer.
- Scenario outputs are local and are not committed to this repository.

## Upcoming/Planned Features

- Input file variable tagging and grouping.

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

Recommended checks:

```bash
python3 -m py_compile app.py
node --check public/app.js
```
