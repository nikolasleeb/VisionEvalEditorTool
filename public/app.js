const state = {
  inputLibraries: [],
  scenarios: [],
  metadata: {},
  setupLocationLevels: [],
  simFiles: [],
  fileExplanations: [],
  simDefinitions: [
    { name: "Sim1", locationDefaults: [], locationDefaultsEnabled: false, iterations: [createIteration(defaultIterationName(1))] },
    { name: "Sim2", locationDefaults: [], locationDefaultsEnabled: false, iterations: [createIteration(defaultIterationName(1))] },
  ],
  nextSimNumber: 3,
  activeSimIndex: 0,
  activeIterationIndex: 0,
  editorMode: "file",
  batchFilterValue: [],
  batchColumnSelection: {},
  batchFileCache: {},
  workspace: "",
  sidebarWidth: 280,
};

const el = {
  workspaceLabel: document.getElementById("workspaceLabel"),
  guideContent: document.getElementById("guideContent"),
  themeToggleButton: document.getElementById("themeToggleButton"),
  tabButtons: document.querySelectorAll(".tabButton"),
  tabPanels: document.querySelectorAll(".tab-panel"),
  simProjectName: document.getElementById("simProjectName"),
  simProjectSelect: document.getElementById("simProjectSelect"),
  startNewScenarioButton: document.getElementById("startNewScenarioButton"),
  scenarioProjectSelect: document.getElementById("scenarioProjectSelect"),
  loadScenarioButton: document.getElementById("loadScenarioButton"),
  simOutputRoot: document.getElementById("simOutputRoot"),
  inputLibraryRootLabel: document.getElementById("inputLibraryRootLabel"),
  simFilesBody: document.getElementById("simFilesBody"),
  fileExplanationSearch: document.getElementById("fileExplanationSearch"),
  explanationsLibraryLabel: document.getElementById("explanationsLibraryLabel"),
  explanationViewer: document.getElementById("explanationViewer"),
  explanationViewerTitle: document.getElementById("explanationViewerTitle"),
  explanationContent: document.getElementById("explanationContent"),
  closeExplanationButton: document.getElementById("closeExplanationButton"),
  iterationWorkspace: document.getElementById("iterationWorkspace"),
  iterationSidebar: document.getElementById("iterationSidebar"),
  toggleSidebarButton: document.getElementById("toggleSidebarButton"),
  sidebarResizeHandle: document.getElementById("sidebarResizeHandle"),
  iterationTree: document.getElementById("iterationTree"),
  addSidebarSimButton: document.getElementById("addSidebarSimButton"),
  duplicateSimButton: document.getElementById("duplicateSimButton"),
  simToolsPage: document.getElementById("simToolsPage"),
  fileEditorPage: document.getElementById("fileEditorPage"),
  activeSimToolsTitle: document.getElementById("activeSimToolsTitle"),
  simDefaultLocationToggle: document.getElementById("simDefaultLocationToggle"),
  simDefaultLocationBody: document.getElementById("simDefaultLocationBody"),
  simDefaultLocationLevelSelect: document.getElementById("simDefaultLocationLevelSelect"),
  simDefaultLocationSearchInput: document.getElementById("simDefaultLocationSearchInput"),
  simDefaultLocationValueSelect: document.getElementById("simDefaultLocationValueSelect"),
  simDefaultLocationDropdown: document.getElementById("simDefaultLocationDropdown"),
  simDefaultLocationSummary: document.getElementById("simDefaultLocationSummary"),
  batchFileChecklist: document.getElementById("batchFileChecklist"),
  batchColumnChecklist: document.getElementById("batchColumnChecklist"),
  batchLocationLevelSelect: document.getElementById("batchLocationLevelSelect"),
  batchLocationSearchInput: document.getElementById("batchLocationSearchInput"),
  batchFilterSelect: document.getElementById("batchFilterSelect"),
  batchFilterDropdown: document.getElementById("batchFilterDropdown"),
  batchYearSelect: document.getElementById("batchYearSelect"),
  batchOperationSelect: document.getElementById("batchOperationSelect"),
  batchValueInput: document.getElementById("batchValueInput"),
  applyBatchPreviewButton: document.getElementById("applyBatchPreviewButton"),
  activeIterationTitle: document.getElementById("activeIterationTitle"),
  iterationFileSelect: document.getElementById("iterationFileSelect"),
  iterationUseFileNameCheckbox: document.getElementById("iterationUseFileNameCheckbox"),
  iterationLocationLevelSelect: document.getElementById("iterationLocationLevelSelect"),
  iterationLocationSearchInput: document.getElementById("iterationLocationSearchInput"),
  iterationFilterSelect: document.getElementById("iterationFilterSelect"),
  iterationFilterDropdown: document.getElementById("iterationFilterDropdown"),
  iterationColumnSelect: document.getElementById("iterationColumnSelect"),
  iterationColumnDropdown: document.getElementById("iterationColumnDropdown"),
  iterationYearSelect: document.getElementById("iterationYearSelect"),
  iterationOperationSelect: document.getElementById("iterationOperationSelect"),
  iterationValueInput: document.getElementById("iterationValueInput"),
  applyIterationPreviewButton: document.getElementById("applyIterationPreviewButton"),
  undoIterationPreviewButton: document.getElementById("undoIterationPreviewButton"),
  redoIterationPreviewButton: document.getElementById("redoIterationPreviewButton"),
  resetIterationButton: document.getElementById("resetIterationButton"),
  resetConfirmDialog: document.getElementById("resetConfirmDialog"),
  confirmResetButton: document.getElementById("confirmResetButton"),
  iterationTableHead: document.getElementById("iterationTableHead"),
  iterationTableBody: document.getElementById("iterationTableBody"),
  iterationNotesInput: document.getElementById("iterationNotesInput"),
  previewScenarioButton: document.getElementById("previewScenarioButton"),
  createPreviewButton: document.getElementById("createPreviewButton"),
  previewErrors: document.getElementById("previewErrors"),
  folderPreview: document.getElementById("folderPreview"),
  logPreview: document.getElementById("logPreview"),
  status: document.getElementById("status"),
};

function createIteration(name, filterValue = []) {
  return {
    filePath: "",
    filterValue: normalizeFilterValues(filterValue),
    useInputFileName: true,
    column: "",
    columns: [],
    year: "2045",
    operation: "set",
    value: "",
    dataType: "match",
    notes: "",
    loaded: null,
    rows: [],
    originalRows: [],
    undoStack: [],
    redoStack: [],
    appliedChanges: [],
    visibleIndexes: [],
    sortColumn: "",
    sortDirection: "",
  };
}

function defaultIterationName(index) {
  return `file ${index}`;
}

function iterationNameOrDefault(iteration, index) {
  return String(iteration?.name || "").trim() || defaultIterationName(index + 1);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function getJson(url) {
  const response = await fetch(url);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

function setStatus(message) {
  el.status.textContent = message;
}

function setTheme(isDark) {
  document.body.classList.toggle("dark-theme", isDark);
  el.themeToggleButton.checked = isDark;
  localStorage.setItem("veEditorTheme", isDark ? "dark" : "light");
}

function selectedSimProject() {
  return state.inputLibraries.find((project) => project.inputsPath === el.simProjectSelect.value);
}

function updateStartNewScenarioButton() {
  el.startNewScenarioButton.disabled = !el.simProjectName.value.trim();
}

function resetBatchState({ keepLocations = false } = {}) {
  state.batchColumnSelection = {};
  state.batchFileCache = {};
  if (!keepLocations) state.batchFilterValue = [];
  if (el.batchLocationSearchInput) el.batchLocationSearchInput.value = "";
  if (el.batchValueInput) el.batchValueInput.value = "";
}

function activeSim() {
  return state.simDefinitions[state.activeSimIndex] || null;
}

function activeIteration() {
  const sim = activeSim();
  return sim ? sim.iterations[state.activeIterationIndex] || null : null;
}

function ensureSimDefaults(sim) {
  if (!sim) return [];
  if (!Array.isArray(sim.locationDefaults)) sim.locationDefaults = [];
  if (typeof sim.locationDefaultsEnabled !== "boolean") {
    sim.locationDefaultsEnabled = sim.locationDefaults.length > 0;
  }
  return sim.locationDefaults;
}

function simLocationDefaults(sim = activeSim()) {
  const defaults = ensureSimDefaults(sim);
  return sim?.locationDefaultsEnabled ? defaults : [];
}

function updateUndoPreviewButton() {
  const iteration = activeIteration();
  el.undoIterationPreviewButton.disabled = !iteration?.undoStack?.length;
  el.redoIterationPreviewButton.disabled = !iteration?.redoStack?.length;
  if (el.resetIterationButton) el.resetIterationButton.disabled = !iteration?.loaded;
}

function iterationSnapshot(iteration) {
  return {
    rows: iteration.rows.map((row) => ({ ...row })),
    appliedChanges: (iteration.appliedChanges || []).map((item) => ({ ...item })),
    column: iteration.column || "",
    columns: selectedIterationColumns(iteration),
  };
}

function applyIterationSnapshot(iteration, snapshot) {
  iteration.rows = snapshot.rows.map((row) => ({ ...row }));
  iteration.appliedChanges = snapshot.appliedChanges ? snapshot.appliedChanges.map((item) => ({ ...item })) : [];
  iteration.column = snapshot.column || "";
  iteration.columns = Array.isArray(snapshot.columns) ? [...snapshot.columns] : snapshot.column ? [snapshot.column] : [];
}

function pushIterationUndo(iteration, clearRedo = true) {
  if (!iteration?.loaded) return;
  iteration.undoStack = Array.isArray(iteration.undoStack) ? iteration.undoStack : [];
  iteration.undoStack.push(iterationSnapshot(iteration));
  if (clearRedo) iteration.redoStack = [];
}

async function loadGuide() {
  if (!el.guideContent) return;
  try {
    const payload = await getJson("/api/guide");
    el.guideContent.innerHTML = payload.html || `<p>${escapeHtml(payload.markdown || "User guide is empty.")}</p>`;
  } catch (error) {
    el.guideContent.innerHTML = `<p>Unable to load user guide: ${escapeHtml(error.message)}</p>`;
  }
}

async function loadConfig() {
  const config = await getJson("/api/config");
  state.inputLibraries = config.inputLibraries || [];
  state.workspace = config.workspace;
  el.workspaceLabel.textContent = `Workspace: ${config.workspace}`;
  el.simOutputRoot.textContent = config.scenariosRoot || `${config.workspace}/Scenarios`;
  if (el.inputLibraryRootLabel) el.inputLibraryRootLabel.textContent = config.inputLibraryRoot || `${config.workspace}/InputLibrary`;

  await loadGuide();

  el.simProjectSelect.innerHTML = state.inputLibraries
    .map((project) => `<option value="${escapeHtml(project.inputsPath)}">${escapeHtml(project.name)}</option>`)
    .join("");

  await loadMetadata();
  await loadScenarios();
  await loadSimFiles();
  await loadSetupLocationOptions();
  updateStartNewScenarioButton();
}

async function loadScenarios() {
  const payload = await getJson("/api/scenarios");
  state.scenarios = payload.scenarios || [];
  el.scenarioProjectSelect.innerHTML = [`<option value="" disabled>Choose saved scenario</option>`]
    .concat(state.scenarios.map((scenario) => `<option value="${escapeHtml(scenario.path)}">${escapeHtml(scenario.name)}</option>`))
    .join("");
  el.scenarioProjectSelect.value = "";
  el.loadScenarioButton.disabled = true;
}

async function loadMetadata() {
  try {
    const payload = await getJson("/api/metadata");
    state.metadata = payload.variables || {};
  } catch {
    state.metadata = {};
  }
}

async function loadSimFiles() {
  const project = selectedSimProject();
  if (!project) return;
  setStatus("Loading simulation input library...");
  const payload = await getJson(`/api/files?inputsPath=${encodeURIComponent(project.inputsPath)}`);
  state.simFiles = payload.files;
  resetBatchState();
  state.simDefinitions.forEach((sim) => {
    sim.iterations.forEach((iteration) => {
      if (iteration.filePath && !fileByPath(iteration.filePath)) {
        iteration.filePath = "";
        clearIterationData(iteration);
      }
    });
  });
  await loadFileExplanations();
  renderIterationEditor();
  clearPreview();
  setStatus(`Loaded ${state.simFiles.length} simulation input files from ${project.name}.`);
}

async function startNewScenario() {
  if (!el.simProjectName.value.trim()) {
    setStatus("Enter a project name before starting a new scenario.");
    updateStartNewScenarioButton();
    return;
  }
  const project = selectedSimProject();
  if (!project) {
    setStatus("Choose an input library first.");
    return;
  }
  setStatus("Starting new scenario draft...");
  const payload = await getJson(`/api/files?inputsPath=${encodeURIComponent(project.inputsPath)}`);
  state.simFiles = payload.files;
  resetBatchState();
  state.simDefinitions = [{ name: "Sim1", locationDefaults: [], locationDefaultsEnabled: false, iterations: [createIteration(defaultIterationName(1))] }];
  state.nextSimNumber = 2;
  state.activeSimIndex = 0;
  state.activeIterationIndex = 0;
  state.batchFilterValue = [...simLocationDefaults(activeSim())];
  renderSimFiles();
  renderIterationEditor();
  clearPreview();
  switchTab("simulationEditorPanel");
  setStatus(`Started new scenario draft from ${project.name}.`);
}

async function loadSelectedScenario() {
  const scenarioPath = el.scenarioProjectSelect.value;
  if (!scenarioPath) {
    setStatus("No saved scenario selected.");
    return;
  }
  setStatus("Loading saved scenario...");
  const payload = await getJson(`/api/scenario?path=${encodeURIComponent(scenarioPath)}`);
  el.simProjectName.value = payload.projectName || payload.name || "";
  updateStartNewScenarioButton();
  state.simFiles = payload.files || [];
  state.simDefinitions = (payload.sims || []).map((sim, simIndex) => {
    const edits = sim.fileEdits && sim.fileEdits.length ? sim.fileEdits : [{ name: defaultIterationName(1) }];
    const locationDefaults = normalizeFilterValues(sim.locationDefaults || sim.defaultLocations || []);
    return {
      name: sim.name || `Sim${simIndex + 1}`,
      locationDefaults,
      locationDefaultsEnabled: typeof sim.locationDefaultsEnabled === "boolean" ? sim.locationDefaultsEnabled : locationDefaults.length > 0,
      iterations: edits.map((edit, index) => scenarioEditToIteration(edit, index)),
    };
  });
  if (!state.simDefinitions.length) {
    state.simDefinitions = [{ name: "Sim1", locationDefaults: [], locationDefaultsEnabled: false, iterations: [createIteration(defaultIterationName(1))] }];
  }
  resetSimCounterAfterNames(state.simDefinitions);
  state.activeSimIndex = 0;
  state.activeIterationIndex = 0;
  state.batchFilterValue = [...simLocationDefaults(activeSim())];
  renderSimFiles();
  renderIterationEditor();
  clearPreview();
  switchTab("simulationEditorPanel");
  setStatus(payload.warning || `Loaded scenario ${payload.name}.`);
}

function scenarioEditToIteration(edit, index) {
  const iteration = createIteration(edit.name || defaultIterationName(index + 1));
  const file = state.simFiles.find((item) => item.name === edit.fileName || item.path === edit.filePath);
  iteration.filePath = file?.path || edit.filePath || "";
  iteration.filterValue = Array.isArray(edit.filterValue) ? edit.filterValue : edit.filterValue || "";
  iteration.useInputFileName = Boolean(edit.useInputFileName) || Boolean(edit.fileName && edit.name === edit.fileName);
  syncIterationNameToInputFile(iteration);
  iteration.column = edit.column || "";
  iteration.columns = Array.isArray(edit.columnsSelected) ? edit.columnsSelected : Array.isArray(edit.columnsToEdit) ? edit.columnsToEdit : edit.column ? [edit.column] : [];
  iteration.year = edit.year || "2045";
  iteration.operation = edit.operation || "set";
  iteration.value = edit.value || "";
  iteration.dataType = edit.dataType || "match";
  iteration.appliedChanges = Array.isArray(edit.appliedChanges) ? edit.appliedChanges.map((item) => ({ ...item })) : [];
  iteration.notes = edit.notes || "";
  iteration.sortColumn = edit.sortColumn || "";
  iteration.sortDirection = edit.sortDirection || "";
  if (edit.loaded && edit.rows && edit.originalRows) {
    iteration.loaded = {
      ...edit.loaded,
      path: iteration.filePath || edit.loaded.path,
      rows: edit.rows.map((row) => ({ ...row })),
    };
    iteration.rows = edit.rows.map((row) => ({ ...row }));
    iteration.originalRows = edit.originalRows.map((row) => ({ ...row }));
    iteration.visibleIndexes = iteration.rows.map((_, rowIndex) => rowIndex);
    if (normalizeFilterValues(iteration.filterValue).length) {
      iteration.visibleIndexes = iteration.rows
        .map((row, rowIndex) => ({ row, rowIndex }))
        .filter(({ row }) => rowMatchesFilterValues(row, iteration.filterValue))
        .map(({ rowIndex }) => rowIndex);
    }
    sortIterationVisibleIndexes(iteration);
  }
  return iteration;
}

function parseFilterValue(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeFilterValues(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function selectedFilterValues(select) {
  return [...select.selectedOptions].map((option) => option.value).filter(Boolean);
}

function setMultiSelectValues(select, values) {
  const selected = new Set(normalizeFilterValues(values));
  [...select.options].forEach((option) => {
    option.selected = option.value ? selected.has(option.value) : selected.size === 0;
  });
}

function rowMatchesFilterValue(row, filterValue) {
  const filter = parseFilterValue(filterValue);
  if (!filter) return true;
  if (filter.type === "county") return String(row.Geo || "").startsWith(filter.value);
  if (filter.field) return String(row[filter.field] ?? "") === String(filter.value);
  return true;
}

function rowMatchesFilterValues(row, filterValues) {
  const selected = normalizeFilterValues(filterValues);
  if (!selected.length) return true;
  return selected.some((filterValue) => rowMatchesFilterValue(row, filterValue));
}

function filterValuesExist(loaded, values) {
  const selected = normalizeFilterValues(values);
  if (!selected.length) return true;
  const options = iterationFilterOptions(loaded.filters || []);
  const wrapper = document.createElement("select");
  wrapper.innerHTML = options;
  const validValues = new Set([...wrapper.options].map((option) => option.value));
  return selected.every((value) => validValues.has(value));
}

function filterLabels(loaded, values) {
  const selected = normalizeFilterValues(values);
  if (!selected.length || !loaded) return "";
  const wrapper = document.createElement("select");
  wrapper.innerHTML = iterationFilterOptions(loaded.filters || []);
  const labels = selected.map((value) => {
    const option = [...wrapper.options].find((item) => item.value === value);
    return option ? option.textContent : value;
  });
  return labels.join(", ");
}

function filterSelectSummary(select) {
  const selected = selectedFilterValues(select);
  if (!selected.length) return "All locations";
  const labels = selected
    .map((value) => [...select.options].find((option) => option.value === value)?.textContent || value)
    .filter(Boolean);
  if (labels.length === 1) return labels[0];
  return `${labels.length} areas selected`;
}

function renderCheckDropdown(container, select, isOpen = false, allCount = null, selectedValues = null) {
  const selected = new Set(selectedValues === null ? selectedFilterValues(select) : normalizeFilterValues(selectedValues));
  const totalCount = Number.isFinite(allCount) ? allCount : [...select.options].filter((option) => option.value).length;
  const optionRows = [...select.options]
    .filter((option) => option.value)
    .map((option) => {
      const checked = selected.has(option.value) ? " checked" : "";
      return `<label class="multi-check-option">
        <input type="checkbox" data-filter-value="${escapeHtml(option.value)}"${checked}>
        <span>${escapeHtml(option.textContent)}</span>
      </label>`;
    })
    .join("");
  const selectAllChecked = selected.size && totalCount && selected.size >= totalCount ? " checked" : "";
  container.classList.toggle("open", isOpen);
  container.innerHTML = `
    <button class="multi-check-toggle" type="button" aria-expanded="${isOpen ? "true" : "false"}">
      <span>${escapeHtml(filterSelectSummary(select))}</span>
      <span aria-hidden="true">▾</span>
    </button>
    <div class="multi-check-menu"${isOpen ? "" : " hidden"}>
      <label class="multi-check-option">
        <input type="checkbox" data-filter-select-all="true"${selectAllChecked}>
        <span>Select all locations</span>
      </label>
      ${optionRows || `<div class="multi-check-empty">No area filters available.</div>`}
    </div>`;
}

function renderIterationFilterDropdown(isOpen = false) {
  const iteration = activeIteration();
  const selectedCount = normalizeFilterValues(iteration?.filterValue || []).length;
  const totalCount = normalizedLocationItems(selectedIterationLocationLevel()).length;
  renderCheckDropdown(el.iterationFilterDropdown, el.iterationFilterSelect, isOpen, totalCount, iteration?.filterValue || []);
  const summary = el.iterationFilterDropdown.querySelector(".multi-check-toggle span:first-child");
  if (summary && selectedCount) {
    summary.textContent = `${selectedCount} locations selected`;
  }
}

function renderIterationColumnDropdown(isOpen = false) {
  const iteration = activeIteration();
  const columns = selectedIterationColumns(iteration);
  renderCheckDropdown(el.iterationColumnDropdown, el.iterationColumnSelect, isOpen, el.iterationColumnSelect.options.length, columns);
  const summary = el.iterationColumnDropdown.querySelector(".multi-check-toggle span:first-child");
  const selectAll = el.iterationColumnDropdown.querySelector("[data-filter-select-all='true'] + span");
  const empty = el.iterationColumnDropdown.querySelector(".multi-check-empty");
  if (summary) {
    if (!columns.length) summary.textContent = "Choose columns";
    else if (columns.length === 1) {
      summary.textContent = [...el.iterationColumnSelect.options].find((option) => option.value === columns[0])?.textContent || columns[0];
    } else {
      summary.textContent = `${columns.length} columns selected`;
    }
  }
  if (selectAll) selectAll.textContent = "Select all columns";
  if (empty) empty.textContent = "No editable numeric columns available.";
}

function updateCheckDropdownSelection(container, select, checkbox) {
  if (checkbox.dataset.filterClear) {
    setMultiSelectValues(select, []);
    return;
  }
  const option = [...select.options].find((item) => item.value === checkbox.dataset.filterValue);
  if (option) option.selected = checkbox.checked;
}

function encodeLocationValue(level, item) {
  if (!level || !item) return "";
  if (level.type === "county") return JSON.stringify({ type: level.type, field: level.field, value: item.value });
  return JSON.stringify({ type: level.type, field: level.field, value: item.value });
}

function locationItemLabel(item) {
  return String(item?.label ?? item?.value ?? item ?? "");
}

function normalizedLocationItems(level) {
  return (level?.values || []).map((item) => {
    if (typeof item === "object" && item !== null) return { value: item.value, label: item.label ?? item.value };
    return { value: item, label: item };
  });
}

function allEncodedLocationValues(level) {
  return normalizedLocationItems(level).map((item) => encodeLocationValue(level, item)).filter(Boolean);
}

function selectedIterationLocationLevelIndex(iteration, filters) {
  const selected = normalizeFilterValues(iteration?.filterValue || []);
  if (selected.length) {
    const index = filters.findIndex((filter) => normalizedLocationItems(filter).some((item) => selected.includes(encodeLocationValue(filter, item))));
    if (index >= 0) return index;
  }
  return filters.length ? 0 : -1;
}

function selectedIterationLocationLevel() {
  const iteration = activeIteration();
  const filters = iteration?.loaded?.filters || [];
  const index = Number(el.iterationLocationLevelSelect.value);
  return Number.isFinite(index) ? filters[index] || null : null;
}

function syncIterationNameToInputFile(iteration = activeIteration()) {
  if (!iteration?.useInputFileName) return;
  const file = fileByPath(iteration.filePath);
  if (file?.name) iteration.name = file.name;
}

function selectedSimDefaultLocationLevel() {
  const index = Number(el.simDefaultLocationLevelSelect.value);
  return Number.isFinite(index) ? state.setupLocationLevels[index] || null : null;
}

function renderSimDefaultLocationLevels() {
  if (!state.setupLocationLevels.length) {
    el.simDefaultLocationLevelSelect.innerHTML = `<option value="">No location levels found</option>`;
    renderSimDefaultLocationValues();
    return;
  }
  const previous = el.simDefaultLocationLevelSelect.value;
  el.simDefaultLocationLevelSelect.innerHTML = state.setupLocationLevels
    .map((level, index) => `<option value="${index}">${escapeHtml(level.label || level.field)}</option>`)
    .join("");
  el.simDefaultLocationLevelSelect.value = previous && state.setupLocationLevels[Number(previous)] ? previous : "0";
  renderSimDefaultLocationValues();
}

function renderSimDefaultLocationValues(isOpen = false) {
  const sim = activeSim();
  const storedDefaults = ensureSimDefaults(sim);
  const defaults = sim?.locationDefaultsEnabled ? storedDefaults : [];
  const level = selectedSimDefaultLocationLevel();
  const query = el.simDefaultLocationSearchInput.value.trim().toLowerCase();
  const values = normalizedLocationItems(level).filter((item) => !query || locationItemLabel(item).toLowerCase().includes(query));
  el.simDefaultLocationValueSelect.innerHTML = values
    .map((item) => {
      const encoded = encodeLocationValue(level, item);
      return `<option value="${escapeHtml(encoded)}">${escapeHtml(locationItemLabel(item))}</option>`;
    })
    .join("");
  setMultiSelectValues(el.simDefaultLocationValueSelect, storedDefaults);
  renderCheckDropdown(el.simDefaultLocationDropdown, el.simDefaultLocationValueSelect, isOpen, normalizedLocationItems(level).length, storedDefaults);
  const summary = el.simDefaultLocationDropdown.querySelector(".multi-check-toggle span:first-child");
  if (summary && storedDefaults.length) {
    summary.textContent = `${storedDefaults.length} locations selected`;
  }
  const name = sim?.name || "Active sim";
  el.simDefaultLocationSummary.textContent = !sim?.locationDefaultsEnabled
    ? `Default location preselection is off for ${name}.`
    : defaults.length
    ? `${defaults.length} default location${defaults.length === 1 ? "" : "s"} selected for new file edits in ${name}.`
    : `All locations selected for new file edits in ${name}.`;
}

async function loadSetupLocationOptions() {
  const project = selectedSimProject();
  state.setupLocationLevels = [];
  if (!project) {
    renderSimDefaultLocationLevels();
    renderBatchLocationLevels();
    return;
  }
  try {
    const payload = await getJson(`/api/location-options?inputsPath=${encodeURIComponent(project.inputsPath)}`);
    state.setupLocationLevels = payload.levels || [];
  } catch {
    state.setupLocationLevels = [];
  }
  renderSimDefaultLocationLevels();
  renderBatchLocationLevels();
}

async function loadFileExplanations() {
  const project = selectedSimProject();
  if (!project) {
    state.fileExplanations = [];
    renderSimFiles();
    return;
  }
  try {
    const payload = await getJson(`/api/explanations?inputsPath=${encodeURIComponent(project.inputsPath)}`);
    state.fileExplanations = payload.files || [];
  } catch {
    state.fileExplanations = [];
  }
  renderSimFiles();
}

function renderSimFiles() {
  const project = selectedSimProject();
  if (el.explanationsLibraryLabel) {
    el.explanationsLibraryLabel.textContent = project
      ? `Linked explanations for ${project.name}.`
      : "Choose an input library in Simulation Setup to view linked file explanations.";
  }
  if (!state.fileExplanations.length) {
    el.simFilesBody.innerHTML = `<tr><td class="empty" colspan="4">No input files found for this library.</td></tr>`;
    return;
  }
  const query = (el.fileExplanationSearch?.value || "").trim().toLowerCase();
  const files = state.fileExplanations.filter((file) => !query || file.name.toLowerCase().includes(query));
  if (!files.length) {
    el.simFilesBody.innerHTML = `<tr><td class="empty" colspan="4">No files match the current search.</td></tr>`;
    return;
  }
  el.simFilesBody.innerHTML = files
    .map((file) => {
      const description = fileDescription(file);
      const hasDescription = description !== "No description available yet.";
      const button = file.hasExplanation
        ? `<button type="button" class="secondary open-explanation-button" data-csv="${escapeHtml(file.name)}">Open</button>`
        : `<button type="button" class="secondary" disabled>Open</button>`;
      return `<tr>
        <td class="file-name-cell">${escapeHtml(file.name)}</td>
        <td class="column-summary explanation-variable-list">${variablePills(file.columns)}</td>
        <td class="description-summary ${hasDescription ? "" : "missing-description"}">${escapeHtml(description)}</td>
        <td class="explanation-action-cell">${button}</td>
      </tr>`;
    })
    .join("");
}

async function openExplanation(csvName) {
  setStatus(`Loading explanation for ${csvName}...`);
  const payload = await getJson(`/api/explanation?csvName=${encodeURIComponent(csvName)}`);
  el.explanationViewerTitle.textContent = `${payload.csvName} — ${payload.docName}`;
  el.explanationContent.innerHTML = payload.html;
  el.explanationViewer.hidden = false;
  setStatus(`Loaded explanation ${payload.docName}.`);
}

function closeExplanation() {
  el.explanationViewer.hidden = true;
  el.explanationViewerTitle.textContent = "Explanation";
  el.explanationContent.innerHTML = "";
}

function columnList(columns) {
  return `<ul>${columns.map((column) => `<li>${escapeHtml(column)}</li>`).join("")}</ul>`;
}

function variablePills(columns) {
  return `<div class="variable-pill-list">${columns.map((column) => `<span class="variable-pill">${escapeHtml(column)}</span>`).join("")}</div>`;
}

function tableNameForFile(file) {
  const name = String(file?.name || "").toLowerCase();
  if (name.startsWith("azone")) return "Azone";
  if (name.startsWith("bzone")) return "Bzone";
  if (name.startsWith("marea")) return "Marea";
  if (name.startsWith("region")) return "Region";
  if (name.startsWith("vehicle")) return "Vehicle";
  if (name.startsWith("worker")) return "Worker";
  if (name.startsWith("household")) return "Household";
  return "";
}

function metadataForColumn(file, column) {
  const entries = state.metadata[String(column || "").toLowerCase()] || [];
  const table = tableNameForFile(file);
  return entries.find((item) => item.table === table) || entries[0] || null;
}

function columnLabel(file, column) {
  const meta = metadataForColumn(file, column);
  return meta?.display || column;
}

function fileDescription(file) {
  const seen = new Set();
  const descriptions = [];
  for (const column of file.columns || []) {
    const description = metadataForColumn(file, column)?.description || "";
    const normalized = description.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    descriptions.push(`${column}: ${normalized}`);
  }
  if (!descriptions.length) return "No description available yet.";
  return descriptions.slice(0, 4).join(" | ");
}

function nextSimName() {
  const name = `Sim${state.nextSimNumber}`;
  state.nextSimNumber += 1;
  return name;
}

function resetSimCounterAfterNames(sims) {
  const highest = (sims || []).reduce((max, sim) => {
    const match = String(sim?.name || "").trim().match(/^Sim(\d+)$/i);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  state.nextSimNumber = highest + 1;
}

function selectedSimFiles() {
  return state.simFiles;
}

function fileByPath(path) {
  return state.simFiles.find((file) => file.path === path);
}

function selectedBatchFilePaths() {
  return [...(el.batchFileChecklist?.querySelectorAll("input[type='checkbox'][data-batch-file-path]:checked") || [])]
    .map((input) => input.dataset.batchFilePath)
    .filter(Boolean);
}

function selectedBatchFiles() {
  const selected = new Set(selectedBatchFilePaths());
  return state.simFiles.filter((file) => selected.has(file.path));
}

function batchColumnKey(filePath, column) {
  return `${filePath}::${column}`;
}

function iterationDisplayName(sim, iteration, iterationIndex = 0) {
  return `${String(sim?.name || "Sim").trim()} ${iterationNameOrDefault(iteration, iterationIndex)}`;
}

function renderIterationTree() {
  el.iterationTree.innerHTML = state.simDefinitions
    .map((sim, simIndex) => {
      ensureSimDefaults(sim);
      const removeSimDisabled = state.simDefinitions.length <= 1 ? " disabled" : "";
      const activeSimClass = simIndex === state.activeSimIndex ? " active-sim" : "";
      return `<div class="sim-tree-group">
      <div class="sim-title-row${activeSimClass}">
        <input class="sim-title-input" data-sim-name="${simIndex}" value="${escapeHtml(sim.name)}" aria-label="Simulation name">
        <button class="sim-tools-button" type="button" data-open-sim-tools="${simIndex}" aria-label="Open tools for ${escapeHtml(sim.name)}" title="Open sim tools">›</button>
        <button class="remove-sim-button" type="button" data-remove-sim="${simIndex}" aria-label="Remove ${escapeHtml(sim.name)}" title="Remove sim"${removeSimDisabled}>×</button>
      </div>
      <div class="iteration-branch">
        ${sim.iterations
          .map((iteration, iterationIndex) => {
            const active = simIndex === state.activeSimIndex && iterationIndex === state.activeIterationIndex ? " active" : "";
            const iterationName = iterationNameOrDefault(iteration, iterationIndex);
            const removeDisabled = sim.iterations.length <= 1 ? " disabled" : "";
            return `<div class="iteration-row${active}" data-sim-index="${simIndex}" data-iteration-index="${iterationIndex}">
              <button class="iteration-drag-handle" type="button" draggable="true" data-drag-sim="${simIndex}" data-drag-iteration="${iterationIndex}" aria-label="Move ${escapeHtml(iterationDisplayName(sim, iteration, iterationIndex))}" title="Drag to reorder file edit">↕</button>
              <input class="iteration-name-input" data-sim-name="${simIndex}" data-iteration-name="${iterationIndex}" value="${escapeHtml(iterationName)}" aria-label="File edit name">
              <button class="iteration-button${active}" type="button" data-sim="${simIndex}" data-iteration="${iterationIndex}" aria-label="Open ${escapeHtml(iterationDisplayName(sim, iteration, iterationIndex))}" title="Open file edit">›</button>
              <button class="remove-iteration-button" type="button" data-remove-sim="${simIndex}" data-remove-iteration="${iterationIndex}" aria-label="Remove ${escapeHtml(iterationDisplayName(sim, iteration, iterationIndex))}" title="Remove file edit"${removeDisabled}>×</button>
            </div>`;
          })
          .join("")}
        <button class="new-iteration-button" type="button" data-add-iteration="${simIndex}">+ New File</button>
      </div>
    </div>`;
    })
    .join("");
}

function renderIterationEditor() {
  renderIterationTree();
  renderActiveSimTools();
  renderBatchControls();
  const sim = activeSim();
  const iteration = activeIteration();
  if (!sim) return;
  el.simToolsPage.hidden = state.editorMode !== "sim";
  el.fileEditorPage.hidden = state.editorMode !== "file";
  if (state.editorMode === "sim") return;
  if (!iteration) return;
  updateUndoPreviewButton();

  el.activeIterationTitle.textContent = iterationDisplayName(sim, iteration, state.activeIterationIndex);
  el.iterationFileSelect.innerHTML = [`<option value="" disabled>Choose input file</option>`]
    .concat(state.simFiles.map((file) => `<option value="${escapeHtml(file.path)}">${escapeHtml(file.name)}</option>`))
    .join("");
  el.iterationFileSelect.value = iteration.filePath;
  el.iterationUseFileNameCheckbox.checked = Boolean(iteration.useInputFileName);
  el.iterationYearSelect.value = iteration.year || "2045";
  el.iterationOperationSelect.value = iteration.operation || "set";
  el.iterationValueInput.value = iteration.value || "";
  el.iterationNotesInput.value = iteration.notes || "";

  if (iteration.filePath && (!iteration.loaded || iteration.loaded.path !== iteration.filePath)) {
    loadIterationFile().catch((error) => setStatus(error.message));
  } else if (iteration.loaded) {
    renderIterationControls();
    applyIterationFilters();
  } else {
    renderIterationControls();
    renderIterationTable();
  }
}

function renderActiveSimTools() {
  const sim = activeSim();
  ensureSimDefaults(sim);
  if (el.activeSimToolsTitle) el.activeSimToolsTitle.textContent = `${sim?.name || "Active Sim"} Tools`;
  if (el.simDefaultLocationToggle) el.simDefaultLocationToggle.checked = Boolean(sim?.locationDefaultsEnabled);
  if (el.simDefaultLocationBody) el.simDefaultLocationBody.hidden = !sim?.locationDefaultsEnabled;
  renderSimDefaultLocationLevels();
}

function renderBatchControls() {
  renderBatchFileChecklist();
  renderBatchLocationLevels();
  renderBatchColumns().catch((error) => {
    el.batchColumnChecklist.innerHTML = `<div class="muted">${escapeHtml(error.message)}</div>`;
  });
}

function renderBatchFileChecklist() {
  const selectedPaths = new Set(selectedBatchFilePaths());
  el.batchFileChecklist.innerHTML = state.simFiles.length
    ? state.simFiles
        .map(
          (file) => `<label class="batch-check-option batch-file-option">
            <input type="checkbox" data-batch-file-path="${escapeHtml(file.path)}"${selectedPaths.has(file.path) ? " checked" : ""}>
            <span class="batch-column-name">${escapeHtml(file.name)}</span>
          </label>`
        )
        .join("")
    : `<div class="muted">Choose an input library first.</div>`;
}

function selectedBatchLocationLevel() {
  const index = Number(el.batchLocationLevelSelect.value);
  return Number.isFinite(index) ? state.setupLocationLevels[index] || null : null;
}

function renderBatchLocationLevels() {
  if (!state.setupLocationLevels.length) {
    el.batchLocationLevelSelect.innerHTML = `<option value="">No location levels found</option>`;
    renderBatchLocationValues();
    return;
  }
  const previous = el.batchLocationLevelSelect.value;
  el.batchLocationLevelSelect.innerHTML = state.setupLocationLevels
    .map((level, index) => `<option value="${index}">${escapeHtml(level.label || level.field)}</option>`)
    .join("");
  el.batchLocationLevelSelect.value = previous && state.setupLocationLevels[Number(previous)] ? previous : "0";
  renderBatchLocationValues();
}

function renderBatchLocationValues(isOpen = false) {
  const level = selectedBatchLocationLevel();
  const query = el.batchLocationSearchInput.value.trim().toLowerCase();
  const values = normalizedLocationItems(level).filter((item) => !query || locationItemLabel(item).toLowerCase().includes(query));
  el.batchFilterSelect.innerHTML = values
    .map((item) => {
      const encoded = encodeLocationValue(level, item);
      return `<option value="${escapeHtml(encoded)}">${escapeHtml(locationItemLabel(item))}</option>`;
    })
    .join("");
  setMultiSelectValues(el.batchFilterSelect, state.batchFilterValue);
  renderCheckDropdown(el.batchFilterDropdown, el.batchFilterSelect, isOpen, normalizedLocationItems(level).length, state.batchFilterValue);
  const summary = el.batchFilterDropdown.querySelector(".multi-check-toggle span:first-child");
  if (summary && state.batchFilterValue.length) {
    summary.textContent = `${state.batchFilterValue.length} locations selected`;
  }
}

async function loadFilePayloadForBatch(file) {
  const project = selectedSimProject();
  if (!project || !file) throw new Error("Choose an input library and file first.");
  const cacheKey = `${file.path}|${project.geoPath || ""}`;
  if (state.batchFileCache[cacheKey]) return state.batchFileCache[cacheKey];
  const geoPath = project.geoPath ? `&geoPath=${encodeURIComponent(project.geoPath)}` : "";
  const payload = await getJson(`/api/load?path=${encodeURIComponent(file.path)}${geoPath}`);
  state.batchFileCache[cacheKey] = payload;
  return payload;
}

async function renderBatchColumns() {
  const files = selectedBatchFiles();
  if (!files.length) {
    el.batchColumnChecklist.innerHTML = `<div class="muted">Select one or more files to choose columns.</div>`;
    return;
  }
  el.batchColumnChecklist.innerHTML = `<div class="muted">Loading columns...</div>`;
  const groups = [];
  const batchYears = new Set();
  for (const file of files) {
    const payload = await loadFilePayloadForBatch(file);
    yearsFromRows(payload.rows || []).forEach((year) => batchYears.add(year));
    const columns = editableBatchColumns(payload);
    groups.push({ file, columns });
  }
  const years = [...batchYears].sort((left, right) => compareSortValues(right, left));
  renderYearSelectOptions(el.batchYearSelect, years, el.batchYearSelect.value || "2045");
  el.batchColumnChecklist.innerHTML = groups
    .map(({ file, columns }) => {
      const rows = columns.map((column) => {
        const key = batchColumnKey(file.path, column);
        const checked = state.batchColumnSelection[key] ? " checked" : "";
        const label = columnLabel(file, column) || column;
        return `<label class="batch-check-option">
          <input type="checkbox" data-batch-file="${escapeHtml(file.path)}" data-batch-column="${escapeHtml(column)}"${checked}>
          <span class="batch-column-name">${escapeHtml(label)}${isProportionColumn(column) ? " (max 1)" : ""}</span>
        </label>`;
      }).join("");
      return `<section class="batch-column-group">
        <strong>${escapeHtml(file.name)}</strong>
        ${rows || `<div class="muted">No numeric columns found.</div>`}
      </section>`;
    })
    .join("");
}

function clearIterationData(iteration) {
  iteration.loaded = null;
  iteration.rows = [];
  iteration.originalRows = [];
  iteration.undoStack = [];
  iteration.redoStack = [];
  iteration.visibleIndexes = [];
}

async function loadIterationFile() {
  const project = selectedSimProject();
  const iteration = activeIteration();
  const file = fileByPath(iteration?.filePath);
  if (!project || !iteration || !file) return;
  const geoPath = project.geoPath ? `&geoPath=${encodeURIComponent(project.geoPath)}` : "";
  const payload = await getJson(`/api/load?path=${encodeURIComponent(file.path)}${geoPath}`);
  iteration.loaded = payload;
  iteration.rows = payload.rows.map((row) => ({ ...row }));
  iteration.originalRows = payload.rows.map((row) => ({ ...row }));
  iteration.undoStack = [];
  iteration.redoStack = [];
  if (!iterationFilterOptionExists(payload, iteration.filterValue)) iteration.filterValue = [];
  const editableColumns = editableIterationColumns(payload, iteration);
  iteration.columns = selectedIterationColumns(iteration).filter((column) => editableColumns.includes(column));
  iteration.column = iteration.columns[0] || "";
  const years = yearsFromRows(iteration.rows);
  iteration.year = preferredYear(years, iteration.year);
  if (!iteration.sortColumn && payload.columns.includes("Year")) {
    iteration.sortColumn = "Year";
    iteration.sortDirection = "desc";
  }
  renderIterationControls();
  applyIterationFilters();
}

function renderIterationControls() {
  const iteration = activeIteration();
  const loaded = iteration?.loaded;
  const file = fileByPath(iteration?.filePath);
  const filters = loaded?.filters || [];
  const columns = editableIterationColumns(loaded, iteration);
  const years = yearsFromRows(iteration?.rows || loaded?.rows || []);

  renderIterationLocationLevels(filters, iteration);
  renderIterationLocationValues();
  iteration.year = preferredYear(years, iteration?.year);
  renderYearSelectOptions(el.iterationYearSelect, years, iteration.year);

  iteration.columns = selectedIterationColumns(iteration).filter((column) => columns.includes(column));
  iteration.column = iteration.columns[0] || "";
  el.iterationColumnSelect.innerHTML = columns
    .map((column) => `<option value="${escapeHtml(column)}">${escapeHtml(columnLabel(file, column))}${isProportionColumn(column) ? " (max 1)" : ""}</option>`)
    .join("");
  setMultiSelectValues(el.iterationColumnSelect, iteration.columns);
  renderIterationColumnDropdown(false);
  updateUndoPreviewButton();
}

function editableNumericColumns(loaded, iteration) {
  const columns = loaded?.columns || [];
  const advertised = (loaded?.numericColumns || []).filter((column) => column !== "Geo" && columns.includes(column));
  if (advertised.length) return advertised;

  const rows = iteration?.rows || loaded?.rows || [];
  return columns.filter((column) => {
    if (column === "Geo") return false;
    const values = rows.map((row) => normalizeOptionalNumber(row?.[column])).filter((value) => value !== null);
    return values.length > 0 && values.every((value) => Number.isFinite(Number(value)));
  });
}

function selectedIterationColumns(iteration = activeIteration()) {
  const columns = Array.isArray(iteration?.columns) ? iteration.columns : [];
  const normalized = normalizeFilterValues(columns);
  if (normalized.length) return normalized;
  return iteration?.column ? [iteration.column] : [];
}

function yearsFromRows(rows = []) {
  const years = [...new Set(rows.map((row) => String(row?.Year ?? "").trim()).filter(Boolean))];
  return years.sort((left, right) => compareSortValues(right, left));
}

function preferredYear(years, currentYear = "") {
  const current = String(currentYear || "");
  if (current && years.includes(current)) return current;
  if (years.includes("2045")) return "2045";
  return years[0] || current || "2045";
}

function renderYearSelectOptions(select, years, selectedYear) {
  const values = years.length ? years : [selectedYear || "2045"];
  select.innerHTML = values.map((year) => `<option value="${escapeHtml(year)}">${escapeHtml(year)}</option>`).join("");
  select.value = preferredYear(values, selectedYear);
}

function editableIterationColumns(loaded, iteration) {
  return editableNumericColumns(loaded, iteration).filter((column) => !isProtectedEditColumn(column, loaded));
}

function editableBatchColumns(loaded) {
  return editableNumericColumns(loaded, { rows: loaded?.rows || [] }).filter((column) => !isProtectedEditColumn(column, loaded));
}

function isProtectedEditColumn(column, loaded) {
  const lower = String(column || "").trim().toLowerCase();
  if (!lower) return true;
  const protectedNames = new Set(["geo", "year", "county", "bzone", "azone", "marea", "zone", "taz", "id"]);
  if (protectedNames.has(lower)) return true;
  const filterFields = new Set((loaded?.filters || []).map((filter) => String(filter.field || "").trim().toLowerCase()).filter(Boolean));
  if (filterFields.has(lower)) return true;
  return lower.endsWith("id") || lower.endsWith("_id") || lower.endsWith("code");
}

function normalizeOptionalNumber(value) {
  const text = String(value ?? "").trim();
  if (!text || ["NA", "N/A", "NAN", "NULL"].includes(text.toUpperCase())) return null;
  return text;
}

function isProportionColumn(column) {
  const lower = String(column || "").toLowerCase();
  return lower.includes("prop") || lower.includes("proportion");
}

function normalizeEditedValue(column, value) {
  if (!isProportionColumn(column) || value === "" || value === "NA") return String(value);
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return String(Math.min(number, 1));
}

function isIntegerFormattedValue(value) {
  const text = String(value ?? "").trim();
  if (!text || ["NA", "N/A", "NAN", "NULL"].includes(text.toUpperCase())) return false;
  if (text.includes(".") || /e/i.test(text)) return false;
  const number = Number(text);
  return Number.isFinite(number) && Number.isInteger(number);
}

function formatPreviewValue(column, value, sourceValue, dataType) {
  const cappedValue = isProportionColumn(column) ? Math.min(value, 1) : value;
  let formatted;
  if (dataType === "integer" || ((!dataType || dataType === "match") && isIntegerFormattedValue(sourceValue))) {
    formatted = String(Math.round(cappedValue));
  } else if (dataType === "double") {
    formatted = String(cappedValue);
  } else {
    formatted = String(cappedValue);
  }
  return {
    value: formatted,
    capped: isProportionColumn(column) && cappedValue < value,
  };
}

function normalizeDataTypeValue(value, dataType) {
  const text = String(value ?? "").trim();
  if (!text || ["NA", "N/A", "NAN", "NULL"].includes(text.toUpperCase())) {
    return { value: text, skipped: false };
  }
  if (dataType === "match") return { value: text, skipped: false };
  if (dataType === "text") return { value: text, skipped: false };

  const number = Number(text);
  if (!Number.isFinite(number)) return { value: text, skipped: true };
  if (dataType === "integer") return { value: String(Math.round(number)), skipped: false };
  if (dataType === "double") {
    const formatted = String(number);
    return { value: Number.isInteger(number) ? `${formatted}.0` : formatted, skipped: false };
  }
  return { value: text, skipped: false };
}

function dataTypeLabel(dataType) {
  if (dataType === "match") return "Match original";
  if (dataType === "integer") return "Integer";
  if (dataType === "double") return "Decimal";
  if (dataType === "text") return "Text";
  return dataType || "Data type";
}

function renderIterationLocationLevels(filters, iteration) {
  if (!filters.length) {
    el.iterationLocationLevelSelect.innerHTML = `<option value="">No location levels found</option>`;
    return;
  }
  el.iterationLocationLevelSelect.innerHTML = filters
    .map((filter, index) => `<option value="${index}">${escapeHtml(filter.label || filter.field || `Level ${index + 1}`)}</option>`)
    .join("");
  const selectedIndex = selectedIterationLocationLevelIndex(iteration, filters);
  el.iterationLocationLevelSelect.value = selectedIndex >= 0 ? String(selectedIndex) : "";
}

function renderIterationLocationValues(isOpen = false) {
  const iteration = activeIteration();
  const level = selectedIterationLocationLevel();
  const query = el.iterationLocationSearchInput.value.trim().toLowerCase();
  const values = normalizedLocationItems(level).filter((item) => !query || locationItemLabel(item).toLowerCase().includes(query));
  el.iterationFilterSelect.innerHTML = values
    .map((item) => {
      const encoded = encodeLocationValue(level, item);
      return `<option value="${escapeHtml(encoded)}">${escapeHtml(locationItemLabel(item))}</option>`;
    })
    .join("");
  setMultiSelectValues(el.iterationFilterSelect, iteration?.filterValue || []);
  renderIterationFilterDropdown(isOpen);
}

function iterationFilterOptions(filters) {
  const options = [`<option value="">All locations</option>`];
  for (const filter of filters) {
    for (const value of filter.values || []) {
      if (filter.type === "county") {
        options.push(
          `<option value="${escapeHtml(JSON.stringify({ type: filter.type, field: filter.field, value: value.value }))}">${escapeHtml(value.label)}</option>`,
        );
      } else {
        options.push(
          `<option value="${escapeHtml(JSON.stringify({ type: filter.type, field: filter.field, value }))}">${escapeHtml(`${filter.label}: ${value}`)}</option>`,
        );
      }
    }
  }
  return options.join("");
}

function iterationFilterOptionExists(loaded, selectedValue) {
  return filterValuesExist(loaded, selectedValue);
}

function currentIterationFilter() {
  return normalizeFilterValues(activeIteration()?.filterValue || []);
}

function iterationFilterLabel(iteration) {
  return filterLabels(iteration?.loaded, iteration?.filterValue || []);
}

function rowMatchesIterationFilter(row) {
  return rowMatchesFilterValues(row, currentIterationFilter());
}

function applyIterationFilters() {
  const iteration = activeIteration();
  if (!iteration) return;
  iteration.visibleIndexes = iteration.rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => rowMatchesIterationFilter(row))
    .map(({ index }) => index);
  sortIterationVisibleIndexes(iteration);
  renderIterationTable();
}

function sortIterationVisibleIndexes(iteration) {
  if (!iteration?.sortColumn || !iteration.sortDirection) return;
  const direction = iteration.sortDirection === "asc" ? 1 : -1;
  const column = iteration.sortColumn;
  iteration.visibleIndexes.sort((leftIndex, rightIndex) => {
    const left = iteration.rows[leftIndex]?.[column];
    const right = iteration.rows[rightIndex]?.[column];
    const compare = compareSortValues(left, right);
    if (compare !== 0) return compare * direction;
    return leftIndex - rightIndex;
  });
}

function compareSortValues(left, right) {
  const leftText = String(left ?? "").trim();
  const rightText = String(right ?? "").trim();
  const leftNumber = Number(leftText);
  const rightNumber = Number(rightText);
  const bothNumeric = leftText !== "" && rightText !== "" && Number.isFinite(leftNumber) && Number.isFinite(rightNumber);
  if (bothNumeric) return leftNumber - rightNumber;
  return leftText.localeCompare(rightText, undefined, { numeric: true, sensitivity: "base" });
}

function toggleIterationSort(column) {
  const iteration = activeIteration();
  if (!iteration) return;
  if (iteration.sortColumn === column) {
    iteration.sortDirection = iteration.sortDirection === "desc" ? "asc" : "desc";
  } else {
    iteration.sortColumn = column;
    iteration.sortDirection = "desc";
  }
  applyIterationFilters();
}

function renderIterationTable() {
  const iteration = activeIteration();
  const loaded = iteration?.loaded;
  if (!loaded) {
    el.iterationTableHead.innerHTML = "";
    el.iterationTableBody.innerHTML = `<tr><td class="empty">Choose an input file to preview rows.</td></tr>`;
    return;
  }
  el.iterationTableHead.innerHTML = `<tr>${loaded.columns.map((column) => sortableHeader(column, iteration)).join("")}</tr>`;
  const visible = iteration.visibleIndexes.slice(0, 500);
  if (!visible.length) {
    el.iterationTableBody.innerHTML = `<tr><td class="empty" colspan="${loaded.columns.length}">No rows match the current filters.</td></tr>`;
    return;
  }
  el.iterationTableBody.innerHTML = visible
    .map((rowIndex) => {
      const row = iteration.rows[rowIndex];
      const original = iteration.originalRows[rowIndex] || {};
      return `<tr>${loaded.columns
        .map((column) => {
          const changed = String(row[column] ?? "") !== String(original[column] ?? "") ? " changed" : "";
          if (column === "Geo") return `<td class="readonly${changed}">${escapeHtml(row[column] ?? "")}</td>`;
          return `<td class="${changed.trim()}"><input data-iteration-row="${rowIndex}" data-iteration-column="${escapeHtml(column)}" value="${escapeHtml(row[column] ?? "")}"></td>`;
        })
        .join("")}</tr>`;
    })
    .join("");
}

function sortableHeader(column, iteration) {
  const active = iteration.sortColumn === column;
  const direction = active ? iteration.sortDirection : "";
  const marker = direction === "desc" ? "▼" : direction === "asc" ? "▲" : "";
  const label = marker ? `${column} ${marker}` : column;
  return `<th><button class="sort-header-button${active ? " active" : ""}" type="button" data-sort-column="${escapeHtml(column)}" aria-label="Sort by ${escapeHtml(column)}">${escapeHtml(label)}</button></th>`;
}

function changedIndexesForFilter(iteration, filterValues) {
  const selected = normalizeFilterValues(filterValues);
  return iteration.rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => rowMatchesFilterValues(row, selected))
    .map(({ index }) => index);
}

function previewNextValue(column, operation, value, current, sourceValue, dataType) {
  let next = value;
  if (operation === "add") next = current + value;
  if (operation === "subtract") next = current - value;
  if (operation === "multiply") next = current * value;
  if (operation === "percent") next = current * (1 + value / 100);
  if (operation === "decrease_percent") next = current * (1 - value / 100);
  return formatPreviewValue(column, next, sourceValue, dataType);
}

function applyPreviewChangeToIteration(iteration, { column, year, operation, value, filterValues, dataType }) {
  const numericValue = Number(value);
  if (!iteration?.loaded || !column || value === "" || !Number.isFinite(numericValue)) {
    return { changedRows: 0, cappedRows: 0 };
  }
  const targetYear = String(year || "");
  let changedRows = 0;
  let cappedRows = 0;
  changedIndexesForFilter(iteration, filterValues).forEach((rowIndex) => {
    const row = iteration.rows[rowIndex];
    if (Object.prototype.hasOwnProperty.call(row, "Year") && String(row.Year ?? "") !== targetYear) return;
    const current = Number(row[column]);
    if (!Number.isFinite(current)) return;
    const result = previewNextValue(column, operation, numericValue, current, row[column], dataType || "match");
    row[column] = result.value;
    changedRows += 1;
    if (result.capped) cappedRows += 1;
  });
  return { changedRows, cappedRows };
}

function applyIterationPreview() {
  const iteration = activeIteration();
  if (!iteration || !iteration.loaded) return;
  iteration.columns = selectedIterationColumns(iteration);
  iteration.column = iteration.columns[0] || "";
  iteration.year = el.iterationYearSelect.value;
  iteration.operation = el.iterationOperationSelect.value;
  iteration.value = el.iterationValueInput.value;
  iteration.dataType = "match";
  applyIterationFilters();
  const value = Number(iteration.value);
  if (!iteration.columns.length || iteration.value === "" || !Number.isFinite(value)) {
    setStatus("Choose one or more columns and enter a numeric value before applying the file edit preview.");
    return;
  }
  pushIterationUndo(iteration);
  let changedRows = 0;
  let cappedRows = 0;
  let changedColumns = 0;
  for (const column of iteration.columns) {
    const result = applyPreviewChangeToIteration(iteration, {
      column,
      year: iteration.year,
      operation: iteration.operation,
      value: iteration.value,
      filterValues: iteration.filterValue,
      dataType: iteration.dataType,
    });
    if (!result.changedRows) continue;
    changedRows += result.changedRows;
    cappedRows += result.cappedRows;
    changedColumns += 1;
    iteration.appliedChanges = iteration.appliedChanges || [];
    iteration.appliedChanges.push({
      column,
      operation: iteration.operation,
      value: iteration.value,
      dataType: iteration.dataType,
      year: iteration.year,
      locationFilter: iterationFilterLabel(iteration) || "",
      changedRows: result.changedRows,
      cappedRows: result.cappedRows,
    });
  }
  renderIterationTable();
  clearPreview();
  updateUndoPreviewButton();
  const capNote = cappedRows ? ` ${cappedRows} proportion values were capped at 1.` : "";
  setStatus(`Preview applied to ${changedColumns} columns and ${changedRows} row values in ${iterationDisplayName(activeSim(), iteration, state.activeIterationIndex)}. No files were written.${capNote}`);
}

function undoIterationPreview() {
  const iteration = activeIteration();
  const snapshot = iteration?.undoStack?.pop();
  if (!snapshot) {
    setStatus("No apply preview change to undo for this file edit.");
    return;
  }
  iteration.redoStack = Array.isArray(iteration.redoStack) ? iteration.redoStack : [];
  iteration.redoStack.push(iterationSnapshot(iteration));
  applyIterationSnapshot(iteration, snapshot);
  applyIterationFilters();
  renderIterationControls();
  clearPreview();
  updateUndoPreviewButton();
  setStatus(`Undid the last change for ${iterationDisplayName(activeSim(), iteration, state.activeIterationIndex)}.`);
}

function redoIterationPreview() {
  const iteration = activeIteration();
  const snapshot = iteration?.redoStack?.pop();
  if (!snapshot) {
    setStatus("No undone change to redo for this file edit.");
    return;
  }
  pushIterationUndo(iteration, false);
  applyIterationSnapshot(iteration, snapshot);
  applyIterationFilters();
  renderIterationControls();
  clearPreview();
  updateUndoPreviewButton();
  setStatus(`Redid the next change for ${iterationDisplayName(activeSim(), iteration, state.activeIterationIndex)}.`);
}

function openResetConfirmation() {
  const iteration = activeIteration();
  if (!iteration?.loaded) {
    setStatus("Choose an input file before resetting.");
    return;
  }
  if (el.resetConfirmDialog?.showModal) {
    el.resetConfirmDialog.showModal();
  } else if (window.confirm("Reset this file edit to its original loaded values?")) {
    resetActiveIterationToOriginal();
  }
}

function resetActiveIterationToOriginal() {
  const iteration = activeIteration();
  if (!iteration?.loaded) return;
  pushIterationUndo(iteration);
  iteration.rows = iteration.originalRows.map((row) => ({ ...row }));
  iteration.appliedChanges = [];
  iteration.column = "";
  iteration.columns = [];
  applyIterationFilters();
  renderIterationControls();
  clearPreview();
  updateUndoPreviewButton();
  setStatus(`Reset ${iterationDisplayName(activeSim(), iteration, state.activeIterationIndex)} to the original loaded values. No files were written.`);
}

function selectedBatchColumnsByFile() {
  const selected = {};
  Object.entries(state.batchColumnSelection).forEach(([key, checked]) => {
    if (!checked) return;
    const splitAt = key.lastIndexOf("::");
    if (splitAt <= 0) return;
    const filePath = key.slice(0, splitAt);
    const column = key.slice(splitAt + 2);
    selected[filePath] = selected[filePath] || [];
    selected[filePath].push(column);
  });
  return selected;
}

async function prepareBatchIteration(sim, file) {
  const name = `Batch - ${file.name}`;
  let iteration = sim.iterations.find((item) => item.filePath === file.path && String(item.name || "").startsWith("Batch - "));
  if (!iteration) {
    iteration = createIteration(name, state.batchFilterValue);
    iteration.filePath = file.path;
    iteration.name = name;
    iteration.useInputFileName = false;
    sim.iterations.push(iteration);
  }
  const payload = await loadFilePayloadForBatch(file);
  if (!iteration.loaded || iteration.loaded.path !== file.path) {
    iteration.loaded = payload;
    iteration.rows = payload.rows.map((row) => ({ ...row }));
    iteration.originalRows = payload.rows.map((row) => ({ ...row }));
    iteration.appliedChanges = [];
  }
  iteration.filterValue = [...state.batchFilterValue];
  iteration.year = el.batchYearSelect.value || "2045";
  iteration.operation = el.batchOperationSelect.value || "set";
  iteration.value = el.batchValueInput.value || "";
  iteration.dataType = "match";
  return iteration;
}

async function applyBatchPreview() {
  const sim = activeSim();
  if (!sim) return;
  const files = selectedBatchFiles();
  const columnsByFile = selectedBatchColumnsByFile();
  const operation = el.batchOperationSelect.value || "set";
  const year = el.batchYearSelect.value || "2045";
  const value = el.batchValueInput.value;
  const dataType = "match";
  const numericValue = Number(value);
  if (!files.length) {
    setStatus("Select one or more files before applying a batch preview.");
    return;
  }
  if (value === "" || !Number.isFinite(numericValue)) {
    setStatus("Enter a numeric value before applying a batch preview.");
    return;
  }
  const selectedColumnCount = Object.values(columnsByFile).reduce((total, columns) => total + columns.length, 0);
  if (!selectedColumnCount) {
    setStatus("Select at least one column before applying a batch preview.");
    return;
  }

  setStatus("Applying batch preview...");
  let firstIteration = null;
  let firstIterationIndex = -1;
  let changedRows = 0;
  let cappedRows = 0;
  let changedFiles = 0;
  let changedColumns = 0;

  for (const file of files) {
    const columns = columnsByFile[file.path] || [];
    if (!columns.length) continue;
    const iteration = await prepareBatchIteration(sim, file);
    pushIterationUndo(iteration);
    let fileChanged = 0;
    for (const column of columns) {
      const result = applyPreviewChangeToIteration(iteration, {
        column,
        year,
        operation,
        value,
        filterValues: state.batchFilterValue,
        dataType,
      });
      if (!result.changedRows) continue;
      fileChanged += result.changedRows;
      changedRows += result.changedRows;
      cappedRows += result.cappedRows;
      changedColumns += 1;
      iteration.appliedChanges = iteration.appliedChanges || [];
      iteration.appliedChanges.push({
        column,
        operation,
        value,
        dataType,
        year,
        locationFilter: filterLabels(iteration.loaded, state.batchFilterValue) || "",
        changedRows: result.changedRows,
        cappedRows: result.cappedRows,
        batch: true,
      });
    }
    if (fileChanged) {
      changedFiles += 1;
      if (!firstIteration) {
        firstIteration = iteration;
        firstIterationIndex = sim.iterations.indexOf(iteration);
      }
    } else {
      iteration.undoStack.pop();
    }
  }

  if (firstIteration) {
    state.activeIterationIndex = firstIterationIndex;
    state.editorMode = "file";
    firstIteration.column = (columnsByFile[firstIteration.filePath] || [])[0] || firstIteration.column;
    firstIteration.year = year;
    firstIteration.operation = operation;
    firstIteration.value = value;
    firstIteration.dataType = dataType;
    applyIterationFilters();
  }
  renderIterationEditor();
  clearPreview();
  updateUndoPreviewButton();
  const capNote = cappedRows ? ` ${cappedRows} proportion values were capped at 1.` : "";
  setStatus(`Batch preview applied to ${changedFiles} files, ${changedColumns} columns, ${changedRows} rows. No files were written.${capNote}`);
}

function editIterationCell(input) {
  const iteration = activeIteration();
  if (!iteration) return;
  const rowIndex = Number(input.dataset.iterationRow);
  const column = input.dataset.iterationColumn;
  if (!Number.isFinite(rowIndex) || !iteration.rows[rowIndex]) return;
  iteration.rows[rowIndex][column] = normalizeEditedValue(column, input.value);
  input.value = iteration.rows[rowIndex][column];
  const changed = iterationCellChanged(iteration, rowIndex, column);
  input.closest("td").classList.toggle("changed", changed);
  clearPreview();
}

function iterationCellChanged(iteration, rowIndex, column) {
  return String(iteration.rows[rowIndex]?.[column] ?? "") !== String(iteration.originalRows[rowIndex]?.[column] ?? "");
}

function iterationChangedCellCount(iteration) {
  if (!iteration.loaded) return 0;
  let count = 0;
  iteration.rows.forEach((row, rowIndex) => {
    for (const column of iteration.loaded.columns) {
      if (String(row[column] ?? "") !== String(iteration.originalRows[rowIndex]?.[column] ?? "")) count += 1;
    }
  });
  return count;
}

function addIteration(simIndex) {
  const sim = state.simDefinitions[simIndex];
  if (!sim) return;
  sim.iterations.push(createIteration(defaultIterationName(sim.iterations.length + 1), simLocationDefaults(sim)));
  state.activeSimIndex = simIndex;
  state.activeIterationIndex = sim.iterations.length - 1;
  state.editorMode = "file";
  renderIterationEditor();
  clearPreview();
}

function removeIteration(simIndex, iterationIndex) {
  const sim = state.simDefinitions[simIndex];
  if (!sim || sim.iterations.length <= 1) return;
  const removed = sim.iterations.splice(iterationIndex, 1)[0];
  if (state.activeSimIndex === simIndex) {
    if (state.activeIterationIndex === iterationIndex) {
      state.activeIterationIndex = Math.min(iterationIndex, sim.iterations.length - 1);
    } else if (state.activeIterationIndex > iterationIndex) {
      state.activeIterationIndex -= 1;
    }
  }
  state.activeSimIndex = Math.min(state.activeSimIndex, state.simDefinitions.length - 1);
  renderIterationEditor();
  clearPreview();
  setStatus(`Removed ${iterationNameOrDefault(removed, iterationIndex)} from ${sim.name}.`);
}

function moveIteration(simIndex, fromIndex, toIndex) {
  const sim = state.simDefinitions[simIndex];
  if (!sim || fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= sim.iterations.length || toIndex >= sim.iterations.length) return;
  const [moved] = sim.iterations.splice(fromIndex, 1);
  sim.iterations.splice(toIndex, 0, moved);
  if (state.activeSimIndex === simIndex) {
    if (state.activeIterationIndex === fromIndex) {
      state.activeIterationIndex = toIndex;
    } else if (fromIndex < state.activeIterationIndex && toIndex >= state.activeIterationIndex) {
      state.activeIterationIndex -= 1;
    } else if (fromIndex > state.activeIterationIndex && toIndex <= state.activeIterationIndex) {
      state.activeIterationIndex += 1;
    }
  }
  renderIterationEditor();
  clearPreview();
  setStatus(`Moved ${iterationNameOrDefault(moved, toIndex)} in ${sim.name}.`);
}

function removeSim(simIndex) {
  if (state.simDefinitions.length <= 1) return;
  const removed = state.simDefinitions[simIndex];
  if (!removed) return;
  state.simDefinitions.splice(simIndex, 1);
  if (state.activeSimIndex === simIndex) {
    state.activeSimIndex = Math.min(simIndex, state.simDefinitions.length - 1);
    state.activeIterationIndex = 0;
  } else if (state.activeSimIndex > simIndex) {
    state.activeSimIndex -= 1;
  }
  const active = activeSim();
  if (active) state.activeIterationIndex = Math.min(state.activeIterationIndex, active.iterations.length - 1);
  renderIterationEditor();
  clearPreview();
  setStatus(`Removed ${removed.name || "sim"}.`);
}

function duplicateActiveSim() {
  const sim = activeSim();
  if (!sim) return;
  const copy = {
    name: nextSimName(),
    locationDefaults: [...ensureSimDefaults(sim)],
    locationDefaultsEnabled: Boolean(sim.locationDefaultsEnabled),
    iterations: sim.iterations.map((iteration) => ({
      ...iteration,
      loaded: iteration.loaded ? { ...iteration.loaded, rows: iteration.loaded.rows.map((row) => ({ ...row })) } : null,
      rows: iteration.rows.map((row) => ({ ...row })),
      originalRows: iteration.originalRows.map((row) => ({ ...row })),
      undoStack: (iteration.undoStack || []).map((snapshot) => ({
        rows: snapshot.rows.map((row) => ({ ...row })),
        appliedChanges: (snapshot.appliedChanges || []).map((item) => ({ ...item })),
        column: snapshot.column || "",
        columns: Array.isArray(snapshot.columns) ? [...snapshot.columns] : [],
      })),
      redoStack: (iteration.redoStack || []).map((snapshot) => ({
        rows: snapshot.rows.map((row) => ({ ...row })),
        appliedChanges: (snapshot.appliedChanges || []).map((item) => ({ ...item })),
        column: snapshot.column || "",
        columns: Array.isArray(snapshot.columns) ? [...snapshot.columns] : [],
      })),
      appliedChanges: (iteration.appliedChanges || []).map((item) => ({ ...item })),
      visibleIndexes: [...iteration.visibleIndexes],
    })),
  };
  state.simDefinitions.push(copy);
  state.activeSimIndex = state.simDefinitions.length - 1;
  state.activeIterationIndex = 0;
  state.editorMode = "sim";
  state.batchFilterValue = [...simLocationDefaults(copy)];
  renderIterationEditor();
  clearPreview();
}

function validatePreview() {
  const errors = [];
  const projectName = el.simProjectName.value.trim();
  const files = selectedSimFiles();
  const sims = state.simDefinitions.filter((sim) => String(sim.name || "").trim());
  const completeIterations = editableIterations();

  if (!projectName) errors.push("Enter a project name.");
  if (!selectedSimProject()) errors.push("Choose an input library.");
  if (!files.length) errors.push("Load an input library with at least one input file.");
  if (!sims.length) errors.push("Add at least one sim.");
  if (!completeIterations.length) errors.push("Add at least one file edit with a bulk change or direct cell edits.");
  sims.forEach((sim) => {
    if (!sim.iterations.length) {
      errors.push(`${sim.name || "Sim"} needs at least one file edit.`);
    }
  });
  state.simDefinitions.forEach((sim) => {
    sim.iterations.forEach((iteration, iterationIndex) => {
      const selectedColumns = selectedIterationColumns(iteration);
      const hasBulk = selectedColumns.length || iteration.value;
      const hasDirectEdits = iterationChangedCellCount(iteration) > 0;
      const hasAny = iteration.filePath || hasBulk || normalizeFilterValues(iteration.filterValue).length || iteration.notes || hasDirectEdits;
      if (!hasAny) return;
      const label = iterationDisplayName(sim, iteration, iterationIndex);
      if (!iteration.filePath) errors.push(`${label}: choose an input file.`);
      if (hasBulk) {
        if (!selectedColumns.length) errors.push(`${label}: choose one or more columns.`);
        if (!iteration.year) errors.push(`${label}: choose a target year.`);
        if (!iteration.operation) errors.push(`${label}: choose an operation.`);
        if (iteration.value === "" || !Number.isFinite(Number(iteration.value))) errors.push(`${label}: enter a numeric value.`);
      }
    });
  });
  return errors;
}

function editableIterations() {
  const rows = [];
  state.simDefinitions.forEach((sim) => {
    sim.iterations.forEach((iteration) => {
      const hasBulk = iteration.filePath && selectedIterationColumns(iteration).length && iteration.year && iteration.operation && iteration.value !== "" && Number.isFinite(Number(iteration.value));
      const hasDirectEdits = iteration.filePath && iterationChangedCellCount(iteration) > 0;
      if (hasBulk || hasDirectEdits) {
        rows.push({ sim, iteration });
      }
    });
  });
  return rows;
}

function createScenarioPayload() {
  return {
    projectName: el.simProjectName.value.trim(),
    inputLibraryPath: selectedSimProject()?.inputsPath || "",
    files: selectedSimFiles().map((file) => ({ name: file.name, path: file.path, columns: file.columns, rows: file.rows })),
    sims: state.simDefinitions.map((sim) => ({
      name: sim.name,
      locationDefaults: [...simLocationDefaults(sim)],
      locationDefaultsEnabled: Boolean(sim.locationDefaultsEnabled),
      fileEdits: sim.iterations
        .map((iteration, iterationIndex) => {
          const selectedColumns = selectedIterationColumns(iteration);
          iteration.column = selectedColumns[0] || "";
          const completeBulk = iteration.filePath && selectedColumns.length && iteration.year && iteration.operation && iteration.value !== "" && Number.isFinite(Number(iteration.value));
          const directEdits = iterationChangedCellCount(iteration);
          if (!iteration.loaded || (!completeBulk && !directEdits)) return null;
          return {
            name: iterationNameOrDefault(iteration, iterationIndex),
            filePath: iteration.filePath,
            useInputFileName: Boolean(iteration.useInputFileName),
            columns: iteration.loaded.columns,
            rows: iteration.rows,
            originalRows: iteration.originalRows,
            loaded: {
              path: iteration.loaded.path,
              label: iteration.loaded.label,
              columns: iteration.loaded.columns,
              numericColumns: iteration.loaded.numericColumns,
              filters: iteration.loaded.filters,
            },
            filterValue: normalizeFilterValues(iteration.filterValue),
            column: iteration.column || "",
            columnsSelected: selectedColumns,
            year: iteration.year || "",
            operation: iteration.operation || "",
            value: iteration.value || "",
            dataType: iteration.dataType || "match",
            sortColumn: iteration.sortColumn || "",
            sortDirection: iteration.sortDirection || "",
            locationFilter: iterationFilterLabel(iteration) || "",
            directCellEdits: directEdits,
            notes: iteration.notes || "",
            appliedChanges: (iteration.appliedChanges || []).map((item) => ({ ...item })),
            summary: fileEditSummary(sim, iteration, iterationIndex, directEdits),
            summaryLines: fileEditSummaryLines(sim, iteration, iterationIndex, directEdits),
          };
        })
        .filter(Boolean),
    })),
  };
}

function fileEditSummary(sim, iteration, iterationIndex, directEdits = iterationChangedCellCount(iteration)) {
  return fileEditSummaryLines(sim, iteration, iterationIndex, directEdits).join("\n");
}

function fileEditSummaryLines(sim, iteration, iterationIndex, directEdits = iterationChangedCellCount(iteration)) {
  const file = fileByPath(iteration.filePath);
  const label = `${sim.name || "Sim"} ${iterationNameOrDefault(iteration, iterationIndex)}`;
  const fileName = file?.name || iteration.filePath || "input file";
  const lines = [];
  const appliedChanges = iteration.appliedChanges || [];

  appliedChanges.forEach((change, index) => {
    if (change.type === "dataType") {
      const parts = [`${label}: change ${index + 1} - ${change.column} data type changed to ${dataTypeLabel(change.dataType)} in ${fileName}`];
      if (change.convertedRows) parts.push(`[${change.convertedRows} rows checked]`);
      if (change.changedRows) parts.push(`[${change.changedRows} values rewritten]`);
      if (change.skippedRows) parts.push(`[${change.skippedRows} non-numeric values skipped]`);
      lines.push(parts.join(" "));
      return;
    }
    const parts = [`${label}: change ${index + 1} - ${change.column} ${operationSummary(change.operation, change.value)}`];
    if (change.year) parts.push(`for ${change.year}`);
    parts.push(`in ${fileName}`);
    if (change.locationFilter) parts.push(`(${change.locationFilter})`);
    if (change.changedRows) parts.push(`[${change.changedRows} rows updated]`);
    if (change.cappedRows) parts.push(`[${change.cappedRows} proportion values capped at 1]`);
    lines.push(parts.join(" "));
  });

  const selectedColumns = selectedIterationColumns(iteration);
  if (!lines.length && selectedColumns.length && iteration.value !== "") {
    const columnText = selectedColumns.length === 1 ? selectedColumns[0] : `${selectedColumns.length} columns`;
    const parts = [`${label}: ${columnText} ${operationSummary(iteration.operation, iteration.value)}`];
    if (iteration.year) parts.push(`for ${iteration.year}`);
    parts.push(`in ${fileName}`);
    const filter = iterationFilterLabel(iteration);
    if (filter) parts.push(`(${filter})`);
    lines.push(parts.join(" "));
  }

  if (directEdits) {
    lines.push(`${label}: ${fileName} has ${directEdits} changed cells from direct table edits`);
  }

  if (!lines.length) {
    lines.push(`${label}: ${fileName} was directly edited`);
  }

  if (iteration.notes) {
    lines.push(`${label}: note - ${iteration.notes}`);
  }
  return lines;
}

function operationSummary(operation, value) {
  if (operation === "set") return `was set to ${value}`;
  if (operation === "add") return `was increased by ${value}`;
  if (operation === "subtract") return `was decreased by ${value}`;
  if (operation === "multiply") return `was multiplied by ${value}`;
  if (operation === "percent") return `was increased by ${value}%`;
  if (operation === "decrease_percent") return `was decreased by ${value}%`;
  return `was changed by ${value}`;
}

function safeFolderName(value, fallback = "Scenario") {
  const cleaned = String(value || "")
    .trim()
    .replace(/[^\p{L}\p{N} _()\-]/gu, "_")
    .replace(/\s+/g, " ");
  return cleaned || fallback;
}

function scenarioRootPath(projectName) {
  const root = el.simOutputRoot.textContent.trim() || `${state.workspace}/Scenarios`;
  return `${root}/${safeFolderName(projectName)}`;
}

function simLogRCode(simName) {
  const modelName = safeFolderName(simName, "Sim").toLowerCase();
  return ["", "", `newMod <- openModel("${modelName}")`, "newMod$run()", "results <- newMod$results()", "results$export()"];
}

function previewScenarioOutput() {
  const errors = validatePreview();
  if (errors.length) {
    el.previewErrors.innerHTML = errors.map((error) => `<div>${escapeHtml(error)}</div>`).join("");
    el.folderPreview.textContent = "";
    el.logPreview.textContent = "";
    setStatus("Scenario preview has validation errors.");
    return;
  }

  const payload = createScenarioPayload();
  const targetRoot = scenarioRootPath(payload.projectName);
  const simOutputs = payload.sims.map((sim) => `${targetRoot}/${safeFolderName(sim.name, "Sim")}`);
  const logLines = [`Scenario: ${safeFolderName(payload.projectName)}`, `Location: ${targetRoot}`, ""];
  payload.sims.forEach((sim, index) => {
    if (index) logLines.push("", "");
    logLines.push(index === 0 ? "=".repeat(48) : "-".repeat(48), safeFolderName(sim.name, "Sim"), "", "");
    if (sim.fileEdits.length) {
      sim.fileEdits.forEach((edit) => {
        const lines = Array.isArray(edit.summaryLines) && edit.summaryLines.length ? edit.summaryLines : [edit.summary || `${sim.name}: updated input file`];
        logLines.push(...lines);
      });
    } else {
      logLines.push(`${safeFolderName(sim.name, "Sim")}: no file edits`);
    }
    logLines.push(`${safeFolderName(sim.name, "Sim")}: wrote ${payload.files.length} input files`);
    logLines.push(...simLogRCode(sim.name));
  });
  if (payload.sims.length) logLines.push("", "", "-".repeat(48));

  el.previewErrors.innerHTML = "";
  el.folderPreview.textContent = `Scenario preview:\n${targetRoot}\n\nSim folders:\n${simOutputs.join("\n")}`;
  el.logPreview.textContent = `Scenario log preview:\n${logLines.join("\n")}`;
  setStatus("Scenario preview generated. No folders or files were written.");
}

async function createPreview() {
  const errors = validatePreview();
  if (errors.length) {
    el.previewErrors.innerHTML = errors.map((error) => `<div>${escapeHtml(error)}</div>`).join("");
    el.folderPreview.textContent = "";
    el.logPreview.textContent = "";
    setStatus("Simulation preview has validation errors.");
    return;
  }

  setStatus("Creating scenario files...");
  const payload = createScenarioPayload();
  const existing = state.scenarios.find((scenario) => scenario.name.toLowerCase() === payload.projectName.toLowerCase());
  if (existing) {
    const ok = window.confirm(`Scenario "${payload.projectName}" already exists. Overwrite it?`);
    if (!ok) {
      setStatus("Scenario was not changed.");
      return;
    }
    payload.overwrite = true;
  }
  const result = await postJson("/api/create-scenario", payload);
  el.previewErrors.innerHTML = "";
  el.folderPreview.textContent = `Scenario created:\n${result.path}\n\nSim folders:\n${(result.simOutputs || []).join("\n")}`;
  el.logPreview.textContent = `Scenario log:\n${(result.logLines || []).join("\n")}`;
  await loadScenarios();
  setStatus(`Scenario created at ${result.label}.`);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function clearPreview() {
  el.previewErrors.innerHTML = "";
  el.folderPreview.textContent = "";
  el.logPreview.textContent = "";
}

function setSidebarWidth(width) {
  const clamped = Math.max(200, Math.min(560, Math.round(width)));
  state.sidebarWidth = clamped;
  el.iterationWorkspace.style.setProperty("--sidebar-width", `${clamped}px`);
}

function switchTab(panelId) {
  el.tabButtons.forEach((button) => button.classList.toggle("active", button.dataset.tab === panelId));
  el.tabPanels.forEach((panel) => panel.classList.toggle("active", panel.id === panelId));
}

el.tabButtons.forEach((button) => button.addEventListener("click", () => switchTab(button.dataset.tab)));
el.themeToggleButton.addEventListener("change", () => setTheme(el.themeToggleButton.checked));
el.simProjectName.addEventListener("input", updateStartNewScenarioButton);
el.simProjectSelect.addEventListener("change", () => {
  loadSimFiles().catch((error) => setStatus(error.message));
  loadSetupLocationOptions().catch((error) => setStatus(error.message));
  closeExplanation();
});
el.fileExplanationSearch.addEventListener("input", renderSimFiles);
el.simFilesBody.addEventListener("click", (event) => {
  const button = event.target.closest(".open-explanation-button");
  if (!button) return;
  openExplanation(button.dataset.csv).catch((error) => setStatus(error.message));
});
el.closeExplanationButton.addEventListener("click", closeExplanation);
el.simDefaultLocationToggle.addEventListener("change", () => {
  const sim = activeSim();
  if (!sim) return;
  ensureSimDefaults(sim);
  sim.locationDefaultsEnabled = el.simDefaultLocationToggle.checked;
  el.simDefaultLocationBody.hidden = !sim.locationDefaultsEnabled;
  state.batchFilterValue = [...simLocationDefaults(sim)];
  renderSimDefaultLocationValues(false);
  clearPreview();
});
el.simDefaultLocationLevelSelect.addEventListener("change", () => {
  const sim = activeSim();
  if (!sim) return;
  sim.locationDefaults = [];
  el.simDefaultLocationSearchInput.value = "";
  renderSimDefaultLocationValues();
  clearPreview();
});
el.simDefaultLocationSearchInput.addEventListener("input", () => renderSimDefaultLocationValues(el.simDefaultLocationDropdown.classList.contains("open")));
el.simDefaultLocationSearchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  renderSimDefaultLocationValues(true);
});
el.simDefaultLocationDropdown.addEventListener("click", (event) => {
  event.stopPropagation();
  const toggle = event.target.closest(".multi-check-toggle");
  if (toggle) {
    renderSimDefaultLocationValues(!el.simDefaultLocationDropdown.classList.contains("open"));
  }
});
el.simDefaultLocationDropdown.addEventListener("change", (event) => {
  event.stopPropagation();
  if (!event.target.matches("input[type='checkbox']")) return;
  const sim = activeSim();
  if (!sim) return;
  if (event.target.dataset.filterSelectAll) {
    sim.locationDefaults = event.target.checked ? allEncodedLocationValues(selectedSimDefaultLocationLevel()) : [];
  } else {
    const selected = new Set(simLocationDefaults(sim));
    if (event.target.checked) selected.add(event.target.dataset.filterValue);
    else selected.delete(event.target.dataset.filterValue);
    sim.locationDefaults = [...selected];
  }
  renderSimDefaultLocationValues(true);
  clearPreview();
});
el.startNewScenarioButton.addEventListener("click", () => startNewScenario().catch((error) => setStatus(error.message)));
el.scenarioProjectSelect.addEventListener("change", () => {
  el.loadScenarioButton.disabled = !el.scenarioProjectSelect.value;
});
el.loadScenarioButton.addEventListener("click", () => loadSelectedScenario().catch((error) => setStatus(error.message)));
el.toggleSidebarButton.addEventListener("click", () => {
  el.iterationWorkspace.classList.toggle("sidebar-collapsed");
  const collapsed = el.iterationWorkspace.classList.contains("sidebar-collapsed");
  el.toggleSidebarButton.setAttribute("aria-label", collapsed ? "Expand simulations sidebar" : "Collapse simulations sidebar");
  el.toggleSidebarButton.title = collapsed ? "Expand sidebar" : "Collapse sidebar";
});
el.sidebarResizeHandle.addEventListener("pointerdown", (event) => {
  if (el.iterationWorkspace.classList.contains("sidebar-collapsed")) return;
  event.preventDefault();
  el.sidebarResizeHandle.setPointerCapture(event.pointerId);
  el.sidebarResizeHandle.classList.add("dragging");
});
el.sidebarResizeHandle.addEventListener("pointermove", (event) => {
  if (!el.sidebarResizeHandle.classList.contains("dragging")) return;
  const bounds = el.iterationWorkspace.getBoundingClientRect();
  setSidebarWidth(event.clientX - bounds.left);
});
el.sidebarResizeHandle.addEventListener("pointerup", (event) => {
  el.sidebarResizeHandle.classList.remove("dragging");
  if (el.sidebarResizeHandle.hasPointerCapture(event.pointerId)) {
    el.sidebarResizeHandle.releasePointerCapture(event.pointerId);
  }
});
el.sidebarResizeHandle.addEventListener("pointercancel", (event) => {
  el.sidebarResizeHandle.classList.remove("dragging");
  if (el.sidebarResizeHandle.hasPointerCapture(event.pointerId)) {
    el.sidebarResizeHandle.releasePointerCapture(event.pointerId);
  }
});
el.addSidebarSimButton.addEventListener("click", () => {
  state.simDefinitions.push({ name: nextSimName(), locationDefaults: [], locationDefaultsEnabled: false, iterations: [createIteration(defaultIterationName(1))] });
  state.activeSimIndex = state.simDefinitions.length - 1;
  state.activeIterationIndex = 0;
  state.batchFilterValue = [];
  renderIterationEditor();
  clearPreview();
});
el.duplicateSimButton.addEventListener("click", duplicateActiveSim);
el.batchFileChecklist.addEventListener("change", (event) => {
  if (!event.target.matches("input[type='checkbox'][data-batch-file-path]")) return;
  const selected = new Set(selectedBatchFilePaths());
  Object.keys(state.batchColumnSelection).forEach((key) => {
    const splitAt = key.lastIndexOf("::");
    const filePath = splitAt > 0 ? key.slice(0, splitAt) : "";
    if (!selected.has(filePath)) delete state.batchColumnSelection[key];
  });
  renderBatchColumns().catch((error) => setStatus(error.message));
  clearPreview();
});
el.batchColumnChecklist.addEventListener("change", (event) => {
  if (!event.target.matches("input[type='checkbox'][data-batch-file]")) return;
  const key = batchColumnKey(event.target.dataset.batchFile, event.target.dataset.batchColumn);
  state.batchColumnSelection[key] = event.target.checked;
  clearPreview();
});
el.batchLocationLevelSelect.addEventListener("change", () => {
  state.batchFilterValue = [];
  el.batchLocationSearchInput.value = "";
  renderBatchLocationValues();
  clearPreview();
});
el.batchLocationSearchInput.addEventListener("input", () => renderBatchLocationValues(el.batchFilterDropdown.classList.contains("open")));
el.batchLocationSearchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  renderBatchLocationValues(true);
});
el.batchFilterDropdown.addEventListener("click", (event) => {
  event.stopPropagation();
  const toggle = event.target.closest(".multi-check-toggle");
  if (toggle) {
    renderBatchLocationValues(!el.batchFilterDropdown.classList.contains("open"));
  }
});
el.batchFilterDropdown.addEventListener("change", (event) => {
  event.stopPropagation();
  if (!event.target.matches("input[type='checkbox']")) return;
  if (event.target.dataset.filterClear) {
    state.batchFilterValue = [];
  } else if (event.target.dataset.filterSelectAll) {
    state.batchFilterValue = event.target.checked ? allEncodedLocationValues(selectedBatchLocationLevel()) : [];
  } else {
    const selected = new Set(normalizeFilterValues(state.batchFilterValue));
    if (event.target.checked) selected.add(event.target.dataset.filterValue);
    else selected.delete(event.target.dataset.filterValue);
    state.batchFilterValue = [...selected];
  }
  renderBatchLocationValues(true);
  clearPreview();
});
el.batchYearSelect.addEventListener("change", clearPreview);
el.batchOperationSelect.addEventListener("change", clearPreview);
el.batchValueInput.addEventListener("input", clearPreview);
el.applyBatchPreviewButton.addEventListener("click", () => applyBatchPreview().catch((error) => setStatus(error.message)));
el.iterationTree.addEventListener("click", (event) => {
  const removeSimButton = event.target.closest(".remove-sim-button");
  const simToolsButton = event.target.closest(".sim-tools-button");
  const removeButton = event.target.closest(".remove-iteration-button");
  const iterationButton = event.target.closest(".iteration-button");
  const addButton = event.target.closest(".new-iteration-button");
  if (removeSimButton) {
    removeSim(Number(removeSimButton.dataset.removeSim));
    return;
  }
  if (simToolsButton) {
    state.activeSimIndex = Number(simToolsButton.dataset.openSimTools);
    state.activeIterationIndex = Math.min(state.activeIterationIndex, activeSim()?.iterations.length - 1 || 0);
    state.editorMode = "sim";
    state.batchFilterValue = [...simLocationDefaults(activeSim())];
    renderIterationEditor();
    clearPreview();
    return;
  }
  if (removeButton) {
    removeIteration(Number(removeButton.dataset.removeSim), Number(removeButton.dataset.removeIteration));
    return;
  }
  if (iterationButton) {
    state.activeSimIndex = Number(iterationButton.dataset.sim);
    state.activeIterationIndex = Number(iterationButton.dataset.iteration);
    state.editorMode = "file";
    state.batchFilterValue = [...simLocationDefaults(activeSim())];
    renderIterationEditor();
  }
  if (addButton) addIteration(Number(addButton.dataset.addIteration));
  clearPreview();
});
el.iterationTree.addEventListener("input", (event) => {
  const simNameIndex = Number(event.target.dataset.simName);
  const iterationNameIndex = Number(event.target.dataset.iterationName);
  if (event.target.classList.contains("sim-title-input") && state.simDefinitions[simNameIndex]) {
    state.simDefinitions[simNameIndex].name = event.target.value;
    if (simNameIndex === state.activeSimIndex) el.activeIterationTitle.textContent = iterationDisplayName(activeSim(), activeIteration(), state.activeIterationIndex);
    clearPreview();
  }
  if (event.target.classList.contains("iteration-name-input") && state.simDefinitions[simNameIndex]?.iterations[iterationNameIndex]) {
    const editedIteration = state.simDefinitions[simNameIndex].iterations[iterationNameIndex];
    editedIteration.name = event.target.value;
    editedIteration.useInputFileName = false;
    if (simNameIndex === state.activeSimIndex && iterationNameIndex === state.activeIterationIndex) {
      el.iterationUseFileNameCheckbox.checked = false;
    }
    if (simNameIndex === state.activeSimIndex && iterationNameIndex === state.activeIterationIndex) {
      el.activeIterationTitle.textContent = iterationDisplayName(activeSim(), activeIteration(), state.activeIterationIndex);
    }
    clearPreview();
  }
});
el.iterationTree.addEventListener("dragstart", (event) => {
  const handle = event.target.closest(".iteration-drag-handle");
  if (!handle) return;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", JSON.stringify({ simIndex: Number(handle.dataset.dragSim), iterationIndex: Number(handle.dataset.dragIteration) }));
});
el.iterationTree.addEventListener("dragover", (event) => {
  const row = event.target.closest(".iteration-row");
  if (!row) return;
  event.preventDefault();
  row.classList.add("drag-over");
});
el.iterationTree.addEventListener("dragleave", (event) => {
  const row = event.target.closest(".iteration-row");
  if (row) row.classList.remove("drag-over");
});
el.iterationTree.addEventListener("drop", (event) => {
  const row = event.target.closest(".iteration-row");
  if (!row) return;
  event.preventDefault();
  row.classList.remove("drag-over");
  let payload = null;
  try {
    payload = JSON.parse(event.dataTransfer.getData("text/plain"));
  } catch {
    payload = null;
  }
  const simIndex = Number(row.dataset.simIndex);
  const toIndex = Number(row.dataset.iterationIndex);
  if (!payload || payload.simIndex !== simIndex) return;
  moveIteration(simIndex, Number(payload.iterationIndex), toIndex);
});
el.iterationTree.addEventListener("dragend", () => {
  el.iterationTree.querySelectorAll(".iteration-row.drag-over").forEach((row) => row.classList.remove("drag-over"));
});
el.iterationFileSelect.addEventListener("change", () => {
  const iteration = activeIteration();
  if (!iteration) return;
  iteration.filePath = el.iterationFileSelect.value;
  syncIterationNameToInputFile(iteration);
  iteration.column = "";
  iteration.columns = [];
  if (!normalizeFilterValues(iteration.filterValue).length) {
    iteration.filterValue = [...simLocationDefaults(activeSim())];
  }
  el.iterationLocationSearchInput.value = "";
  clearIterationData(iteration);
  renderIterationEditor();
  clearPreview();
});
el.iterationUseFileNameCheckbox.addEventListener("change", () => {
  const iteration = activeIteration();
  if (!iteration) return;
  iteration.useInputFileName = el.iterationUseFileNameCheckbox.checked;
  syncIterationNameToInputFile(iteration);
  renderIterationEditor();
  clearPreview();
});
el.iterationLocationLevelSelect.addEventListener("change", () => {
  const iteration = activeIteration();
  if (!iteration) return;
  iteration.filterValue = [];
  el.iterationLocationSearchInput.value = "";
  renderIterationLocationValues();
  applyIterationFilters();
  clearPreview();
});
el.iterationLocationSearchInput.addEventListener("input", () => renderIterationLocationValues(el.iterationFilterDropdown.classList.contains("open")));
el.iterationLocationSearchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  renderIterationLocationValues(true);
});
el.iterationFilterDropdown.addEventListener("click", (event) => {
  event.stopPropagation();
  const toggle = event.target.closest(".multi-check-toggle");
  if (toggle) {
    renderIterationFilterDropdown(!el.iterationFilterDropdown.classList.contains("open"));
  }
});
el.iterationFilterDropdown.addEventListener("change", (event) => {
  event.stopPropagation();
  if (!event.target.matches("input[type='checkbox']")) return;
  const iteration = activeIteration();
  if (!iteration) return;
  if (event.target.dataset.filterClear) {
    iteration.filterValue = [];
  } else if (event.target.dataset.filterSelectAll) {
    iteration.filterValue = event.target.checked ? allEncodedLocationValues(selectedIterationLocationLevel()) : [];
  } else {
    const selected = new Set(normalizeFilterValues(iteration.filterValue));
    if (event.target.checked) selected.add(event.target.dataset.filterValue);
    else selected.delete(event.target.dataset.filterValue);
    iteration.filterValue = [...selected];
  }
  renderIterationLocationValues(true);
  applyIterationFilters();
  clearPreview();
});
el.iterationColumnDropdown.addEventListener("click", (event) => {
  event.stopPropagation();
  const toggle = event.target.closest(".multi-check-toggle");
  if (toggle) {
    renderIterationColumnDropdown(!el.iterationColumnDropdown.classList.contains("open"));
  }
});
el.iterationColumnDropdown.addEventListener("change", (event) => {
  event.stopPropagation();
  if (!event.target.matches("input[type='checkbox']")) return;
  const iteration = activeIteration();
  if (!iteration) return;
  if (event.target.dataset.filterSelectAll) {
    iteration.columns = event.target.checked ? [...el.iterationColumnSelect.options].map((option) => option.value).filter(Boolean) : [];
  } else {
    const selected = new Set(selectedIterationColumns(iteration));
    if (event.target.checked) selected.add(event.target.dataset.filterValue);
    else selected.delete(event.target.dataset.filterValue);
    iteration.columns = [...selected];
  }
  iteration.column = iteration.columns[0] || "";
  setMultiSelectValues(el.iterationColumnSelect, iteration.columns);
  renderIterationColumnDropdown(true);
  clearPreview();
});
el.iterationYearSelect.addEventListener("change", () => {
  const iteration = activeIteration();
  if (!iteration) return;
  iteration.year = el.iterationYearSelect.value;
  clearPreview();
});
el.iterationOperationSelect.addEventListener("change", () => {
  const iteration = activeIteration();
  if (!iteration) return;
  iteration.operation = el.iterationOperationSelect.value;
  clearPreview();
});
el.iterationValueInput.addEventListener("input", () => {
  const iteration = activeIteration();
  if (!iteration) return;
  iteration.value = el.iterationValueInput.value;
  clearPreview();
});
el.applyIterationPreviewButton.addEventListener("click", applyIterationPreview);
el.undoIterationPreviewButton.addEventListener("click", undoIterationPreview);
el.redoIterationPreviewButton.addEventListener("click", redoIterationPreview);
el.resetIterationButton.addEventListener("click", openResetConfirmation);
el.resetConfirmDialog.addEventListener("close", () => {
  if (el.resetConfirmDialog.returnValue === "confirm") resetActiveIterationToOriginal();
  el.resetConfirmDialog.returnValue = "";
});
el.iterationTableHead.addEventListener("click", (event) => {
  const button = event.target.closest("[data-sort-column]");
  if (!button) return;
  toggleIterationSort(button.dataset.sortColumn);
});
el.iterationTableBody.addEventListener("input", (event) => {
  if (event.target.matches("input[data-iteration-row]")) editIterationCell(event.target);
});
el.iterationNotesInput.addEventListener("input", () => {
  const iteration = activeIteration();
  if (!iteration) return;
  iteration.notes = el.iterationNotesInput.value;
  clearPreview();
});
document.addEventListener(
  "pointerdown",
  (event) => {
    if (!el.iterationFilterDropdown.contains(event.target) && el.iterationFilterDropdown.classList.contains("open")) {
      renderIterationLocationValues(false);
    }
    if (!el.iterationColumnDropdown.contains(event.target) && el.iterationColumnDropdown.classList.contains("open")) {
      renderIterationColumnDropdown(false);
    }
    if (!el.simDefaultLocationDropdown.contains(event.target) && el.simDefaultLocationDropdown.classList.contains("open")) {
      renderSimDefaultLocationValues(false);
    }
    if (!el.batchFilterDropdown.contains(event.target) && el.batchFilterDropdown.classList.contains("open")) {
      renderBatchLocationValues(false);
    }
  },
  true,
);
el.previewScenarioButton.addEventListener("click", previewScenarioOutput);
el.createPreviewButton.addEventListener("click", () => createPreview().catch((error) => setStatus(error.message)));

setSidebarWidth(state.sidebarWidth);
setTheme(false);
loadConfig().catch((error) => setStatus(error.message));
