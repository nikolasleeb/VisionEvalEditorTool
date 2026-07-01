# VisionEval Data Editor User Guide

Use this tool to build and preview VisionEval input scenario edits before creating scenario folders. The editor is organized around an input library, one or more scenarios, and one or more file edits inside each scenario.

## Important Refresh Notice

Refreshing the browser page resets the current browser session. Unsaved draft changes, previews, selected filters, and in-progress edits can be cleared and returned to the starting state. Save or create your scenario before refreshing if you need to keep your work.

## Folder Layout

- `InputLibrary` contains the source VisionEval input libraries that appear in Scenario Setup.
- `Scenarios` stores saved scenario drafts and generated scenario outputs.
- `UserGuide.md` is this guide. Edit this Markdown file to update the User Guide tab.
- `public` contains the browser interface.
- `app.py` runs the local Python server and provides the API used by the interface.

## File Explanations

The File Explanations tab helps connect input CSV files to their documentation.

- Choose an input library in Scenario Setup first.
- Use search to narrow the CSV list.
- The Variables column shows variables detected for each CSV.
- The Description column uses metadata bundled in the editor under `Metadata/metadata.json`.
- The Open Explanation column opens the linked Word explanation for that CSV when one exists.

Word explanations are loaded from the editor-local `Clean Explanations/DOCX` folder. If that folder is missing, the rest of the editor still works, but Word explanation buttons may be unavailable.

## Scenario Setup

Use Scenario Setup to start a new scenario draft or reopen a saved scenario.

1. Enter a project name.
2. Choose an input library.
3. Select Start New Scenario to initialize the editor.

The Load Existing Scenario block restores a saved draft from the local `Scenarios` folder. Loading a scenario restores scenario variants, file edits, filters, selected columns, operations, values, notes, and preview state where available.

## Scenario/File Editor

This is the main editing workspace.

- Use the left sidebar to add, duplicate, remove, and switch between scenarios.
- Each scenario can contain multiple file edits.
- Select the arrow beside a scenario name to open the scenario tools page.
- Select the arrow beside a file edit to open the single-file editor.
- Drag the divider beside the scenarios sidebar to make the sidebar wider or skinnier.
- Drag the move handle beside a file edit to reorder file edits within the same scenario.
- Choose an input file for the active file edit.
- Keep Use input file name checked when the output edit should keep the same CSV filename.
- Uncheck it when you need to rename the output file edit.

### Scenario Tools Page

The scenario tools page contains settings and batch previews that apply only to the active scenario.

- Check Preselect default locations for new file edits to open Default Locations.
- Default Locations sets the starting location selection for new file edits created inside that scenario.
- Select all locations selects every location at the chosen location level, even when search text is filtering the visible list.
- Individual locations can then be unchecked, which is useful for editing all counties except one.
- Duplicating a scenario also duplicates its default location selection.
- Batch Change Active Scenario applies one operation/value/year across selected files and selected numeric columns in the active scenario.
- Select all columns checks every editable numeric column for the currently selected batch files.
- Batch column choices exclude `Year`, `Geo`, and geography/id-style columns so those identifiers are not edited by mistake.

Batch changes are previews only. They create or update normal file-edit entries inside the active scenario, so they appear in Overview/Submit the same way as single-file edits. Select files first, then check one or more numeric columns for each selected file, or use Select all columns. The first batch-created file edit opens automatically after Apply Batch Preview.

### Filters

Filters determine which rows the change function targets.

- Location level controls the geographic level used for filtering.
- Location search narrows long location lists.
- Locations selects one or more areas.
- MPO is available for Virginia input libraries when the loaded files contain matching Virginia locality FIPS codes. MPO selections match numeric Bzone-style rows by FIPS prefix and Azone/name-style rows by locality name.
- MPO entries that are partial in the source list, such as urbanized area or most of a county, are treated as the whole locality because the editor currently filters by county/city and zone IDs rather than MPO boundary geometry.
- Target year limits the preview and change to the selected year when a Year column exists. The year list is read from the selected file, so a file with `2020` and `2050` rows shows those years.
- Files with a Year column sort later years first by default, so 2045 or 2050 rows appear above earlier years.

If no location levels appear, confirm the selected input library includes usable geography files or metadata. If rows still display in the table, the file can still be inspected even when location filtering is limited.

### Columns

The Columns dropdown lists editable numeric columns from the selected input file.

- `Geo` is intentionally excluded.
- `Year` and geography/id-style columns are intentionally excluded.
- Numeric columns are detected from the CSV data, including columns that contain blanks or `NA` values in some rows.
- Proportion-style columns are marked with `(max 1)`.
- Select one or more columns to apply the same preview operation to each selected column.

If the dropdown only shows Choose columns, reload the input file or refresh the page. If the table shows numeric columns but the dropdown remains empty, the file may contain values that cannot be parsed as numbers in the sampled rows.

### Automatic Data Type Matching

Change previews automatically keep edited values in the same basic format as the original cell. Integer-looking source values stay integers, so an original value of `5` increased by 10% becomes `6`, while a 5% increase stays `5` because `5.25` rounds back down to `5`.

This automatic rounding helps avoid VisionEval problems where an integer column is accidentally written as a decimal or float. It also means very small changes may not visibly change integer cells until the calculated value rounds to a different whole number. Decimal-looking source values can still keep decimal results.

### Operations

Operations use the value entered in the Value field.

- Set to replaces the selected column value with the entered number.
- Increase by adds the entered number.
- Decrease by subtracts the entered number.
- Multiply by multiplies by the entered number.
- Increase by % increases by the entered percent.
- Decrease by % decreases by the entered percent.

Increase by and Decrease by use plain numbers, not percentages. Use the percent operations when the value should be treated as a percent.

### Preview and Undo

Select Apply Preview to preview the change in the table. The preview updates only the current draft state in the browser and does not write files immediately.

Select Undo to step backward through file-edit previews, batch previews, and confirmed resets for the active file edit. Keep selecting Undo to move back through earlier changes in that file edit.

Select Redo to reapply a change that was just undone. Starting a new preview, batch preview, or reset clears the redo history for that file edit.

Select Reset File to restore the active file edit to the original loaded CSV values. Reset File opens a confirmation box before changing the preview, clears the recorded changes for that file edit, and does not write files immediately. Direct table edits can also be made when a cell is editable.

## Overview/Submit

Use Overview/Submit to review the scenario structure before creating outputs.

- Preview Scenario checks the current draft and shows the planned folder and log output.
- Create Scenario writes the scenario files and logs to the local `Scenarios` folder.

The log output lists each change made to each file, including separate entries when a scenario changes more than one column or file. Notes entered for scenarios or file edits are saved with the scenario draft and included in the generated log so the reason for a change stays with the output.

Review errors and warnings before creating a scenario. Missing input files, empty project names, or incomplete file edits should be corrected first.

## Interface Notes

Night mode is off by default. The bottom of the page shows the last update date for the tool.

## Upcoming/Planned Features

- Input file variable tagging and grouping.

## Developed By

## Contact

## Portability

The editor is designed to run independently from the comparison tool. Move the full `VisionEvalEditor` folder to another device to keep the same editor features.

Required for normal editor use:

- `app.py`
- `public`
- `InputLibrary`
- `Metadata/metadata.json` for variable descriptions and units
- `Clean Explanations/DOCX` for Word explanation files
- `Scenarios` if you want existing saved drafts

The comparison tool is not required for the editor to start, load input libraries, show file explanations, display descriptions, draft scenarios, preview edits, or create scenario folders. Advanced users can still point the editor at external metadata or explanation folders through configuration, but the default setup uses the local bundled copies.

## Troubleshooting

- If no input libraries appear, confirm CSV libraries exist under `InputLibrary`.
- If a CSV loads but no editable columns appear, confirm the data columns contain numeric values.
- If Word explanations do not open, confirm the explanation DOCX folder exists and the CSV has a matching explanation document.
- If the browser shows old behavior after an update, refresh the page. The app includes cache-busting version strings, but a hard refresh can still help.
- If the server is not running, start it with `python3 app.py` from the VisionEvalEditor folder and open `http://127.0.0.1:3000`.
