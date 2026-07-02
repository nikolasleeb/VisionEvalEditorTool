#!/usr/bin/env python3
import csv
import html
import json
import os
import re
import shutil
import subprocess
import sys
import zipfile
from functools import lru_cache
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from xml.etree import ElementTree as ET


APP_ROOT = Path(sys.executable).resolve().parent if getattr(sys, "frozen", False) else Path(__file__).resolve().parent
RESOURCE_ROOT = Path(getattr(sys, "_MEIPASS", APP_ROOT)).resolve()
PUBLIC_ROOT = RESOURCE_ROOT / "public"
GUIDE_PATH = RESOURCE_ROOT / "UserGuide.md"
WORKSPACE_ROOT = Path(os.environ["VISIONEVAL_WORKSPACE_ROOT"]).expanduser().resolve() if os.environ.get("VISIONEVAL_WORKSPACE_ROOT") else None
INSTALL_ROOT = Path(os.environ.get("VE_TOOLS_ROOT", WORKSPACE_ROOT or APP_ROOT.parent)).expanduser().resolve()
CONFIG_PATH = Path(os.environ.get("VE_TOOLS_CONFIG", (WORKSPACE_ROOT or INSTALL_ROOT) / "config.json")).expanduser()


def load_portable_config():
    if not CONFIG_PATH.exists():
        return {}
    try:
        return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


PORTABLE_CONFIG = load_portable_config()


def config_path(key, fallback):
    value = os.environ.get(key.upper()) or PORTABLE_CONFIG.get(key)
    return Path(value).expanduser() if value else Path(fallback).expanduser()


DEFAULT_EXTERNAL_ROOT = config_path("installRoot", WORKSPACE_ROOT or APP_ROOT)
INPUT_LIBRARY_ROOT = config_path("inputLibraryRoot", (WORKSPACE_ROOT / "InputLibrary") if WORKSPACE_ROOT else RESOURCE_ROOT / "InputLibrary")
SCENARIOS_ROOT = config_path("scenariosRoot", (WORKSPACE_ROOT / "Scenarios") if WORKSPACE_ROOT else APP_ROOT / "Scenarios")
LOCAL_METADATA_PATH = config_path("metadataPath", (WORKSPACE_ROOT / "Metadata" / "metadata.json") if WORKSPACE_ROOT else RESOURCE_ROOT / "Metadata" / "metadata.json")
COMPARISON_ROOT = config_path("comparisonRoot", (WORKSPACE_ROOT.parent / "VisionEvalComparison") if WORKSPACE_ROOT else RESOURCE_ROOT / "ComparisonReference")
CLEAN_EXPLANATIONS_ROOT = config_path("cleanExplanationsRoot", (WORKSPACE_ROOT / "Clean Explanations" / "DOCX") if WORKSPACE_ROOT else RESOURCE_ROOT / "Clean Explanations" / "DOCX")
EXPLANATIONS_ROOT = CLEAN_EXPLANATIONS_ROOT.parent if CLEAN_EXPLANATIONS_ROOT.name.lower() == "docx" else CLEAN_EXPLANATIONS_ROOT
R_HELPER = COMPARISON_ROOT / "rda_reader.R"
RSCRIPT_PATH = os.environ.get("RSCRIPT") or PORTABLE_CONFIG.get("rscriptPath", "")


def seed_dir(source, target):
    source = Path(source)
    target = Path(target)
    if not source.exists() or target.exists():
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(source, target)


def seed_file(source, target):
    source = Path(source)
    target = Path(target)
    if not source.exists() or target.exists():
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)


def seed_workspace_assets():
    if not WORKSPACE_ROOT:
        return
    seed_dir(RESOURCE_ROOT / "InputLibrary", WORKSPACE_ROOT / "InputLibrary")
    seed_dir(RESOURCE_ROOT / "Metadata", WORKSPACE_ROOT / "Metadata")
    seed_dir(RESOURCE_ROOT / "Clean Explanations" / "PlanRVA", WORKSPACE_ROOT / "Clean Explanations" / "PlanRVA")
    seed_dir(RESOURCE_ROOT / "Clean Explanations" / "DOCX", WORKSPACE_ROOT / "Clean Explanations" / "PlanRVA")
    seed_file(RESOURCE_ROOT / "UserGuide.md", WORKSPACE_ROOT / "UserGuide.md")

COUNTY_PREFIXES = {
    "51001": "Accomack County",
    "51003": "Albemarle County",
    "51005": "Alleghany County",
    "51007": "Amelia County",
    "51009": "Amherst County",
    "51011": "Appomattox County",
    "51013": "Arlington County",
    "51015": "Augusta County",
    "51017": "Bath County",
    "51019": "Bedford County",
    "51021": "Bland County",
    "51023": "Botetourt County",
    "51025": "Brunswick County",
    "51027": "Buchanan County",
    "51029": "Buckingham County",
    "51031": "Campbell County",
    "51033": "Caroline County",
    "51035": "Carroll County",
    "51036": "Charles City County",
    "51037": "Charlotte County",
    "51041": "Chesterfield County",
    "51043": "Clarke County",
    "51045": "Craig County",
    "51047": "Culpeper County",
    "51049": "Cumberland County",
    "51051": "Dickenson County",
    "51053": "Dinwiddie County",
    "51057": "Essex County",
    "51059": "Fairfax County",
    "51061": "Fauquier County",
    "51063": "Floyd County",
    "51065": "Fluvanna County",
    "51067": "Franklin County",
    "51069": "Frederick County",
    "51071": "Giles County",
    "51073": "Gloucester County",
    "51075": "Goochland County",
    "51077": "Grayson County",
    "51079": "Greene County",
    "51081": "Greensville County",
    "51083": "Halifax County",
    "51085": "Hanover County",
    "51087": "Henrico County",
    "51089": "Henry County",
    "51091": "Highland County",
    "51093": "Isle of Wight County",
    "51095": "James City County",
    "51097": "King and Queen County",
    "51099": "King George County",
    "51101": "King William County",
    "51103": "Lancaster County",
    "51105": "Lee County",
    "51107": "Loudoun County",
    "51109": "Louisa County",
    "51111": "Lunenburg County",
    "51113": "Madison County",
    "51115": "Mathews County",
    "51117": "Mecklenburg County",
    "51119": "Middlesex County",
    "51121": "Montgomery County",
    "51125": "Nelson County",
    "51127": "New Kent County",
    "51131": "Northampton County",
    "51133": "Northumberland County",
    "51135": "Nottoway County",
    "51137": "Orange County",
    "51139": "Page County",
    "51141": "Patrick County",
    "51143": "Pittsylvania County",
    "51145": "Powhatan County",
    "51147": "Prince Edward County",
    "51149": "Prince George County",
    "51153": "Prince William County",
    "51155": "Pulaski County",
    "51157": "Rappahannock County",
    "51159": "Richmond County",
    "51161": "Roanoke County",
    "51163": "Rockbridge County",
    "51165": "Rockingham County",
    "51167": "Russell County",
    "51169": "Scott County",
    "51171": "Shenandoah County",
    "51173": "Smyth County",
    "51175": "Southampton County",
    "51177": "Spotsylvania County",
    "51179": "Stafford County",
    "51181": "Surry County",
    "51183": "Sussex County",
    "51185": "Tazewell County",
    "51187": "Warren County",
    "51191": "Washington County",
    "51193": "Westmoreland County",
    "51195": "Wise County",
    "51197": "Wythe County",
    "51199": "York County",
    "51510": "Alexandria City",
    "51515": "Bedford City",
    "51520": "Bristol City",
    "51530": "Buena Vista City",
    "51540": "Charlottesville City",
    "51550": "Chesapeake City",
    "51570": "Colonial Heights City",
    "51580": "Covington City",
    "51590": "Danville City",
    "51595": "Emporia City",
    "51600": "Fairfax City",
    "51610": "Falls Church City",
    "51620": "Franklin City",
    "51630": "Fredericksburg City",
    "51640": "Galax City",
    "51650": "Hampton City",
    "51660": "Harrisonburg City",
    "51670": "Hopewell City",
    "51678": "Lexington City",
    "51680": "Lynchburg City",
    "51683": "Manassas City",
    "51685": "Manassas Park City",
    "51690": "Martinsville City",
    "51700": "Newport News City",
    "51710": "Norfolk City",
    "51720": "Norton City",
    "51730": "Petersburg City",
    "51735": "Poquoson City",
    "51740": "Portsmouth City",
    "51750": "Radford City",
    "51760": "Richmond City",
    "51770": "Roanoke City",
    "51775": "Salem City",
    "51790": "Staunton City",
    "51800": "Suffolk City",
    "51810": "Virginia Beach City",
    "51820": "Waynesboro City",
    "51830": "Williamsburg City",
    "51840": "Winchester City",
}

VIRGINIA_MPOS = [
    {
        "value": "bristol-mpo",
        "label": "Bristol Metropolitan Planning Organization",
        "prefixes": ["51520", "51191"],
    },
    {
        "value": "central-virginia-tpo",
        "label": "Central Virginia Transportation Planning Organization",
        "prefixes": ["51680", "51009", "51019", "51031"],
    },
    {
        "value": "charlottesville-albemarle-mpo",
        "label": "Charlottesville-Albemarle Metropolitan Planning Organization",
        "prefixes": ["51540", "51003"],
    },
    {
        "value": "danville-pittsylvania-mpo",
        "label": "Danville-Pittsylvania Metropolitan Planning Organization",
        "prefixes": ["51590", "51143"],
    },
    {
        "value": "fredericksburg-area-mpo",
        "label": "Fredericksburg Area Metropolitan Planning Organization",
        "prefixes": ["51630", "51177", "51179"],
    },
    {
        "value": "hampton-roads-tpo",
        "label": "Hampton Roads Transportation Planning Organization",
        "prefixes": ["51550", "51650", "51700", "51710", "51740", "51735", "51800", "51810", "51830", "51093", "51095", "51199", "51620", "51073", "51175"],
    },
    {
        "value": "harrisonburg-rockingham-mpo",
        "label": "Harrisonburg-Rockingham Metropolitan Planning Organization",
        "prefixes": ["51660", "51165"],
    },
    {
        "value": "kingsport-tn-va-mpo",
        "label": "Kingsport, TN-VA Metropolitan Planning Organization",
        "prefixes": ["51169"],
    },
    {
        "value": "national-capital-region-tpb",
        "label": "National Capital Region Transportation Planning Board",
        "prefixes": ["51510", "51600", "51610", "51683", "51685", "51013", "51059", "51107", "51153", "51061"],
    },
    {
        "value": "new-river-valley-mpo",
        "label": "New River Valley Metropolitan Planning Organization",
        "prefixes": ["51750", "51121", "51155"],
    },
    {
        "value": "richmond-regional-tpo-planrva",
        "label": "Richmond Regional Transportation Planning Organization (PlanRVA)",
        "prefixes": ["51760", "51085", "51087", "51041", "51036", "51075", "51127", "51145"],
    },
    {
        "value": "roanoke-valley-tpo",
        "label": "Roanoke Valley Transportation Planning Organization",
        "prefixes": ["51770", "51775", "51019", "51023", "51161", "51121"],
    },
    {
        "value": "staunton-augusta-waynesboro-mpo",
        "label": "Staunton-Augusta-Waynesboro Metropolitan Planning Organization",
        "prefixes": ["51790", "51820", "51015"],
    },
    {
        "value": "tri-cities-mpo",
        "label": "Tri-Cities Metropolitan Planning Organization",
        "prefixes": ["51570", "51670", "51730", "51041", "51053", "51149"],
    },
    {
        "value": "winchester-frederick-county-mpo",
        "label": "Winchester-Frederick County Metropolitan Planning Organization",
        "prefixes": ["51840", "51069"],
    },
]


def mpo_filter_values(prefixes):
    available = set(prefixes.keys() if isinstance(prefixes, dict) else prefixes)
    values = []
    for mpo in VIRGINIA_MPOS:
        matched = [prefix for prefix in mpo["prefixes"] if prefix in available]
        if not matched:
            continue
        values.append(
            {
                "value": mpo["value"],
                "label": mpo["label"],
                "prefixes": matched,
                "localities": [COUNTY_PREFIXES.get(prefix, f"County FIPS {prefix}") for prefix in matched],
            }
        )
    return values


def json_response(handler, payload, status=200):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def bad_request(handler, message, status=400):
    json_response(handler, {"error": message}, status)


def parse_body(handler):
    length = int(handler.headers.get("Content-Length", "0") or "0")
    if length <= 0:
        return {}
    raw = handler.rfile.read(length).decode("utf-8")
    return json.loads(raw or "{}")


def render_inline_markdown(value):
    escaped = html.escape(value, quote=False)
    return re.sub(r"`([^`]+)`", r"<code>\1</code>", escaped)


def markdown_to_html(markdown):
    parts = []
    list_type = None

    def close_list():
        nonlocal list_type
        if list_type:
            parts.append(f"</{list_type}>")
            list_type = None

    for raw_line in markdown.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()
        if not stripped:
            close_list()
            continue

        unordered = re.match(r"^-\s+(.+)$", stripped)
        ordered = re.match(r"^\d+\.\s+(.+)$", stripped)
        if unordered or ordered:
            target_list = "ul" if unordered else "ol"
            if list_type != target_list:
                close_list()
                parts.append(f"<{target_list}>")
                list_type = target_list
            item = unordered.group(1) if unordered else ordered.group(1)
            parts.append(f"<li>{render_inline_markdown(item)}</li>")
            continue

        close_list()
        if stripped.startswith("### "):
            parts.append(f"<h3>{render_inline_markdown(stripped[4:])}</h3>")
        elif stripped.startswith("## "):
            parts.append(f"<h2>{render_inline_markdown(stripped[3:])}</h2>")
        elif stripped.startswith("# "):
            parts.append(f"<h1>{render_inline_markdown(stripped[2:])}</h1>")
        else:
            parts.append(f"<p>{render_inline_markdown(stripped)}</p>")

    close_list()
    return "\n".join(parts)


def load_user_guide():
    if GUIDE_PATH.exists():
        markdown = GUIDE_PATH.read_text(encoding="utf-8")
    else:
        markdown = "# VisionEval Data Editor User Guide\n\nCreate `UserGuide.md` in the editor folder to customize this guide."
    return {"path": str(GUIDE_PATH), "markdown": markdown, "html": markdown_to_html(markdown)}


def rscript_command():
    if RSCRIPT_PATH and Path(RSCRIPT_PATH).expanduser().exists():
        return str(Path(RSCRIPT_PATH).expanduser())
    return RSCRIPT_PATH or "Rscript"


def allowed_roots():
    roots = [APP_ROOT, RESOURCE_ROOT]
    if WORKSPACE_ROOT:
        roots.append(WORKSPACE_ROOT)
    for configured_root in [DEFAULT_EXTERNAL_ROOT, INPUT_LIBRARY_ROOT, SCENARIOS_ROOT, LOCAL_METADATA_PATH.parent, COMPARISON_ROOT, CLEAN_EXPLANATIONS_ROOT]:
        if configured_root.exists():
            roots.append(configured_root)
    extra = os.environ.get("VE_EDITOR_ALLOWED_ROOTS", "")
    for value in extra.split(os.pathsep):
        if value.strip():
            roots.append(Path(value).expanduser())
    return [root.resolve() for root in roots if root.exists()]


def resolve_allowed_path(value):
    path = Path(value).expanduser().resolve()
    for root in allowed_roots():
        try:
            path.relative_to(root)
            return path
        except ValueError:
            continue
    raise ValueError(f"Path is outside allowed roots: {path}")


def read_csv(path):
    path = resolve_allowed_path(path)
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = [dict(row) for row in reader]
        return list(reader.fieldnames or []), rows


def write_csv(path, fieldnames, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def safe_folder_name(value, fallback="Scenario"):
    cleaned = "".join(char if char.isalnum() or char in {" ", "-", "_", "(", ")"} else "_" for char in str(value or "").strip())
    cleaned = " ".join(cleaned.split())
    return cleaned or fallback


def copy_input_files(files, target_inputs):
    target_inputs.mkdir(parents=True, exist_ok=True)
    copied = []
    for item in files:
        source = resolve_allowed_path(item.get("path", ""))
        if source.suffix.lower() != ".csv" or not source.is_file():
            continue
        target = target_inputs / source.name
        shutil.copy2(source, target)
        copied.append(target)
    return copied


def create_scenario(payload):
    project_name = safe_folder_name(payload.get("projectName"), "Scenario")
    target_root = SCENARIOS_ROOT / project_name
    if target_root.exists() and not payload.get("overwrite"):
        raise ValueError("Scenario already exists. Confirm overwrite to update it.")
    target_root.mkdir(parents=True, exist_ok=True)

    files = payload.get("files") or []
    log_lines = [f"Scenario: {project_name}", f"Location: {target_root}", ""]
    sim_outputs = []

    for sim_index, sim in enumerate(payload.get("sims") or []):
        if sim_index:
            log_lines.extend(["", ""])
        sim_name = safe_folder_name(sim.get("name"), "Sim")
        separator = "=" * 48 if sim_index == 0 else "-" * 48
        log_lines.extend([separator, sim_name, "", ""])
        sim_root = target_root / sim_name
        inputs_root = sim_root / "inputs"
        copied = copy_input_files(files, inputs_root)
        sim_outputs.append(str(sim_root))

        edits = sim.get("fileEdits") or []
        if not edits:
            log_lines.append(f"{sim_name}: no file edits")
        else:
            for edit in edits:
                source = resolve_allowed_path(edit.get("filePath", ""))
                target = inputs_root / source.name
                columns = edit.get("columns") or []
                rows = edit.get("rows") or []
                if columns and rows:
                    write_csv(target, columns, rows)
                summary_lines = edit.get("summaryLines") if isinstance(edit.get("summaryLines"), list) else []
                if summary_lines:
                    log_lines.extend(str(line) for line in summary_lines if str(line).strip())
                else:
                    summary = edit.get("summary") or f"{sim_name}: updated {source.name}"
                    log_lines.extend(str(summary).splitlines())
                    notes = str(edit.get("notes", "")).strip()
                    if notes:
                        log_lines.append(f"{sim_name}: note - {notes}")

        if copied:
            log_lines.append(f"{sim_name}: wrote {len(copied)} input files")
        log_lines.extend(sim_log_r_code(sim_name))

    if sim_outputs:
        log_lines.extend(["", "", "-" * 48])

    log_path = target_root / "scenario_log.txt"
    log_path.write_text("\n".join(log_lines).strip() + "\n", encoding="utf-8")
    manifest_path = target_root / "scenario_manifest.json"
    manifest_path.write_text(json.dumps(scenario_manifest(payload), indent=2), encoding="utf-8")
    return {
        "path": str(target_root),
        "label": relative_label(target_root),
        "logPath": str(log_path),
        "manifestPath": str(manifest_path),
        "simOutputs": sim_outputs,
        "logLines": log_lines,
    }


def sim_log_r_code(sim_name):
    model_name = safe_folder_name(sim_name, "Sim").lower()
    return [
        "",
        "",
        f'newMod <- openModel("{model_name}")',
        "newMod$run()",
        "results <- newMod$results()",
        "results$export()",
    ]


def scenario_manifest(payload):
    return {
        "version": 2,
        "projectName": payload.get("projectName", ""),
        "inputLibraryPath": payload.get("inputLibraryPath", ""),
        "files": [
            {"name": item.get("name", ""), "path": item.get("path", ""), "columns": item.get("columns", []), "rows": item.get("rows", 0)}
            for item in payload.get("files") or []
        ],
        "sims": [
            {
                "name": sim.get("name", ""),
                "locationDefaults": sim.get("locationDefaults", []),
                "fileEdits": [
                    {
                        "name": edit.get("name", ""),
                        "filePath": edit.get("filePath", ""),
                        "fileName": Path(edit.get("filePath", "")).name,
                        "useInputFileName": bool(edit.get("useInputFileName", False)),
                        "filterValue": edit.get("filterValue", ""),
                        "column": edit.get("column", ""),
                        "year": edit.get("year", ""),
                        "operation": edit.get("operation", ""),
                        "value": edit.get("value", ""),
                        "sortColumn": edit.get("sortColumn", ""),
                        "sortDirection": edit.get("sortDirection", ""),
                        "locationFilter": edit.get("locationFilter", ""),
                        "directCellEdits": edit.get("directCellEdits", 0),
                        "notes": edit.get("notes", ""),
                        "appliedChanges": edit.get("appliedChanges", []),
                        "summary": edit.get("summary", ""),
                        "summaryLines": edit.get("summaryLines", []),
                        "loaded": edit.get("loaded", None),
                        "rows": edit.get("rows", []),
                        "originalRows": edit.get("originalRows", []),
                    }
                    for edit in sim.get("fileEdits") or []
                ],
            }
            for sim in payload.get("sims") or []
        ],
    }


def list_scenarios():
    if not SCENARIOS_ROOT.exists():
        return []
    scenarios = []
    for path in sorted((item for item in SCENARIOS_ROOT.iterdir() if item.is_dir()), key=lambda item: item.stat().st_mtime, reverse=True):
        sims = [child.name for child in sorted(path.iterdir(), key=lambda item: item.name.lower()) if child.is_dir() and (child / "inputs").exists()]
        scenarios.append(
            {
                "name": path.name,
                "path": str(path),
                "label": relative_label(path),
                "hasManifest": (path / "scenario_manifest.json").exists(),
                "sims": sims,
            }
        )
    return scenarios


def load_scenario(path_value):
    scenario_path = resolve_allowed_path(path_value)
    scenario_path.relative_to(SCENARIOS_ROOT.resolve())
    manifest_path = scenario_path / "scenario_manifest.json"
    manifest = {}
    has_manifest = manifest_path.exists()
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    sim_dirs = [child for child in sorted(scenario_path.iterdir(), key=lambda item: item.name.lower()) if child.is_dir() and (child / "inputs").exists()]
    first_inputs = sim_dirs[0] / "inputs" if sim_dirs else scenario_path
    files = list_input_files(str(first_inputs)) if first_inputs.exists() else []

    manifest_sims = manifest.get("sims") or []
    sims = manifest_sims if manifest_sims else [{"name": sim_dir.name, "fileEdits": []} for sim_dir in sim_dirs]
    return {
        "name": scenario_path.name,
        "path": str(scenario_path),
        "hasManifest": has_manifest,
        "warning": "" if has_manifest else "Loaded basic scenario folders. Detailed edit state is unavailable because this scenario has no manifest.",
        "projectName": manifest.get("projectName") or scenario_path.name,
        "inputLibraryPath": manifest.get("inputLibraryPath", ""),
        "files": files,
        "sims": sims,
    }


def relative_label(path):
    path = Path(path)
    home = Path.home()
    try:
        return "~/" + str(path.relative_to(home))
    except ValueError:
        return str(path)


def find_input_libraries():
    libraries = []
    if not INPUT_LIBRARY_ROOT.exists():
        return libraries
    for path in sorted((child for child in INPUT_LIBRARY_ROOT.iterdir() if child.is_dir()), key=lambda p: p.name.lower()):
        geo = path / "geo.csv"
        libraries.append(
            {
                "name": path.name,
                "path": str(path),
                "inputsPath": str(path),
                "geoPath": str(geo) if geo.exists() else "",
                "kind": "input-folder",
            }
        )
    return libraries


def list_input_files(inputs_path):
    root = resolve_allowed_path(inputs_path)
    if not root.is_dir():
        raise ValueError("Inputs path is not a folder")
    files = []
    for path in sorted(root.glob("*.csv"), key=lambda p: p.name.lower()):
        try:
            fieldnames, rows = read_csv(path)
        except Exception:
            continue
        files.append({"name": path.name, "path": str(path), "columns": fieldnames, "rows": len(rows)})
    return files


def input_library_root_payload():
    INPUT_LIBRARY_ROOT.mkdir(parents=True, exist_ok=True)
    return {"path": str(INPUT_LIBRARY_ROOT)}


def scenarios_root_payload():
    SCENARIOS_ROOT.mkdir(parents=True, exist_ok=True)
    return {"path": str(SCENARIOS_ROOT)}


def reveal_path(payload):
    path = resolve_allowed_path(payload.get("path", ""))
    if not path.exists():
        raise ValueError("Path does not exist")
    command = ["open", "-R", str(path)] if path.is_file() else ["open", str(path)]
    subprocess.run(command, check=False)
    return {"path": str(path)}


def scenario_folder_from_payload(payload):
    scenario_path = resolve_allowed_path(payload.get("path", ""))
    scenarios_root = SCENARIOS_ROOT.resolve()
    try:
        scenario_path.relative_to(scenarios_root)
    except ValueError as exc:
        raise ValueError("Path is not inside the scenario root") from exc
    if scenario_path == scenarios_root:
        raise ValueError("Choose a specific scenario folder")
    if not scenario_path.is_dir():
        raise ValueError("Scenario path is not a folder")
    return scenario_path


def prompt_for_zip_path(default_name):
    default_name = safe_folder_name(default_name, "Scenario") + ".zip"
    script = (
        'set chosenFile to choose file name with prompt "Save scenario ZIP as:" '
        f'default name "{default_name}"\n'
        "POSIX path of chosenFile"
    )
    result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, check=False)
    if result.returncode != 0:
        return None
    path = Path(result.stdout.strip()).expanduser()
    if path.suffix.lower() != ".zip":
        path = path.with_suffix(".zip")
    return path


def export_scenario(payload):
    scenario_path = scenario_folder_from_payload(payload)
    target_value = payload.get("targetPath", "")
    zip_path = Path(target_value).expanduser() if target_value else prompt_for_zip_path(scenario_path.name)
    if not zip_path:
        return {"scenarioPath": str(scenario_path), "zipPath": "", "canceled": True}
    if zip_path.suffix.lower() != ".zip":
        zip_path = zip_path.with_suffix(".zip")
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    archive_base = zip_path.with_suffix("")
    created_path = Path(shutil.make_archive(str(archive_base), "zip", root_dir=scenario_path.parent, base_dir=scenario_path.name))
    if created_path != zip_path:
        if zip_path.exists():
            zip_path.unlink()
        created_path.rename(zip_path)
    if payload.get("reveal", True):
        subprocess.run(["open", "-R", str(zip_path)], check=False)
    return {"scenarioPath": str(scenario_path), "zipPath": str(zip_path), "canceled": False}


def delete_scenario(payload):
    scenario_path = scenario_folder_from_payload(payload)
    shutil.rmtree(scenario_path)
    return {"deleted": str(scenario_path), "scenarios": list_scenarios()}


def empty_scenarios():
    SCENARIOS_ROOT.mkdir(parents=True, exist_ok=True)
    deleted = []
    for child in SCENARIOS_ROOT.iterdir():
        if child.is_dir():
            shutil.rmtree(child)
            deleted.append(str(child))
    return {"deleted": deleted, "scenarios": list_scenarios()}


def explanations_root_payload():
    EXPLANATIONS_ROOT.mkdir(parents=True, exist_ok=True)
    return {"path": str(EXPLANATIONS_ROOT)}


EXPLANATION_ALIASES = {
    "azone_hh_av_veh_per_driver": "azone_hh_ave_veh_per_driver",
    "bzone_travel_demand_mgt": "bzone_travel_demand_management",
}
W_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def clean_explanation_stem(path):
    stem = re.sub(r"^\d+_\s*", "", path.stem).strip()
    if stem.lower().endswith(".csv"):
        stem = stem[:-4]
    return stem.strip().lower()


def csv_explanation_key(csv_name):
    stem = Path(csv_name).stem.strip()
    if re.search(r"\s-\s*copy$|\scopy$", stem, re.IGNORECASE):
        return ""
    key = stem.lower()
    return EXPLANATION_ALIASES.get(key, key)


def safe_set_id(value):
    return re.sub(r"[^a-z0-9_-]+", "-", str(value or "").strip().lower()).strip("-")


def explanation_set_name(path):
    name = path.name.strip()
    if name.lower() == "docx":
        return "PlanRVA"
    return name


def explanation_set_id(path):
    return safe_set_id(explanation_set_name(path))


def folder_has_docx(path):
    return path.is_dir() and any(path.glob("*.docx"))


def explanation_sets():
    EXPLANATIONS_ROOT.mkdir(parents=True, exist_ok=True)
    planrva = EXPLANATIONS_ROOT / "PlanRVA"
    docx = EXPLANATIONS_ROOT / "DOCX"
    if folder_has_docx(planrva):
        path = planrva
    elif folder_has_docx(docx):
        path = docx
    else:
        return []
    return [{"id": "planrva", "name": "PlanRVA", "path": str(path)}]


def explanation_set_path(set_id=""):
    sets = explanation_sets()
    if not sets:
        return CLEAN_EXPLANATIONS_ROOT
    return Path(sets[0]["path"])


def explanation_doc_map(set_id=""):
    docs = {}
    root = explanation_set_path(set_id)
    if not root.exists():
        return docs
    for path in sorted(root.glob("*.docx"), key=lambda item: item.name.lower()):
        docs.setdefault(clean_explanation_stem(path), path)
    return docs


def explanation_for_csv(csv_name, set_id=""):
    key = csv_explanation_key(csv_name)
    if not key:
        return None
    return explanation_doc_map(set_id).get(key)


def table_name_for_file(filename):
    name = str(filename or "").lower()
    if name.startswith("azone"):
        return "Azone"
    if name.startswith("bzone"):
        return "Bzone"
    if name.startswith("marea"):
        return "Marea"
    if name.startswith("region"):
        return "Region"
    if name.startswith("vehicle"):
        return "Vehicle"
    if name.startswith("worker"):
        return "Worker"
    if name.startswith("household"):
        return "Household"
    return ""


def metadata_description_for_file(file_item, metadata_variables):
    table = table_name_for_file(file_item.get("name", ""))
    seen = set()
    descriptions = []
    for column in file_item.get("columns", []):
        entries = metadata_variables.get(str(column or "").lower(), [])
        match = next((entry for entry in entries if entry.get("table") == table), None) or (entries[0] if entries else None)
        description = str((match or {}).get("description") or "").strip()
        if not description or description in seen:
            continue
        seen.add(description)
        descriptions.append(f"{column}: {description}")
        if len(descriptions) >= 4:
            break
    return " | ".join(descriptions)


def list_file_explanations(inputs_path, set_id=""):
    files = []
    metadata_variables = load_metadata().get("variables", {})
    for item in list_input_files(inputs_path):
        doc = explanation_for_csv(item["name"])
        description = metadata_description_for_file(item, metadata_variables)
        files.append(
            {
                **item,
                "hasExplanation": bool(doc),
                "docName": doc.name if doc else "",
                "description": description,
                "descriptionSource": "Metadata",
            }
        )
    return files


def docx_text(element):
    return "".join(node.text or "" for node in element.iter(f"{W_NS}t")).strip()


def paragraph_html(paragraph):
    text = docx_text(paragraph)
    if not text:
        return ""
    style = paragraph.find(f".//{W_NS}pStyle")
    style_value = style.attrib.get(f"{W_NS}val", "") if style is not None else ""
    tag = "h3" if style_value.lower().startswith("heading") else "p"
    return f"<{tag}>{html.escape(text)}</{tag}>"


def table_html(table):
    rows = []
    for tr in table.findall(f"{W_NS}tr"):
        cells = []
        for tc in tr.findall(f"{W_NS}tc"):
            parts = [docx_text(p) for p in tc.findall(f"{W_NS}p")]
            value = " ".join(part for part in parts if part).strip()
            cells.append(f"<td>{html.escape(value)}</td>")
        if cells:
            rows.append(f"<tr>{''.join(cells)}</tr>")
    return f"<table>{''.join(rows)}</table>" if rows else ""


def docx_to_html(doc_path):
    with zipfile.ZipFile(doc_path) as archive:
        xml = archive.read("word/document.xml")
    root = ET.fromstring(xml)
    body = root.find(f"{W_NS}body")
    if body is None:
        return "<p>No readable content found.</p>"
    chunks = []
    for child in body:
        if child.tag == f"{W_NS}p":
            rendered = paragraph_html(child)
        elif child.tag == f"{W_NS}tbl":
            rendered = table_html(child)
        else:
            rendered = ""
        if rendered:
            chunks.append(rendered)
    return "\n".join(chunks) or "<p>No readable content found.</p>"


def load_explanation(csv_name, set_id=""):
    doc = explanation_for_csv(csv_name, set_id)
    if not doc:
        raise ValueError(f"No explanation found for {csv_name}")
    return {"csvName": csv_name, "docName": doc.name, "setId": explanation_set_id(doc.parent), "setName": explanation_set_name(doc.parent), "html": docx_to_html(doc)}


def zone_level_from_filename(filename):
    lower = filename.lower()
    if lower.startswith("azone"):
        return "Azone"
    if lower.startswith("bzone"):
        return "Bzone"
    if lower.startswith("czone"):
        return "Czone"
    if lower.startswith("marea"):
        return "Marea"
    return ""


def setup_location_options(inputs_path):
    root = resolve_allowed_path(inputs_path)
    if not root.is_dir():
        raise ValueError("Inputs path is not a folder")

    levels = []
    prefixes = {}
    zone_values = {}
    for path in sorted(root.glob("*.csv"), key=lambda p: p.name.lower()):
        try:
            _, rows = read_csv(path)
        except Exception:
            continue
        zone_level = zone_level_from_filename(path.name)
        for row in rows:
            geo = str(row.get("Geo", ""))
            if zone_level and geo and geo != "NA":
                zone_values.setdefault(zone_level, set()).add(geo)
            if len(geo) >= 5 and geo[:5].isdigit():
                prefixes.setdefault(geo[:5], COUNTY_PREFIXES.get(geo[:5], f"County FIPS {geo[:5]}"))

    for label in ["Azone", "Bzone", "Czone", "Marea"]:
        values = sorted(zone_values.get(label, set()))
        if values:
            levels.append({"type": "geo", "field": "Geo", "label": label, "values": [{"value": value, "label": value} for value in values]})

    if prefixes:
        mpo_values = mpo_filter_values(prefixes)
        if mpo_values:
            levels.append(
                {
                    "type": "mpo",
                    "field": "MPO",
                    "label": "MPO",
                    "values": mpo_values,
                }
            )
        levels.append(
            {
                "type": "county",
                "field": "County",
                "label": "County",
                "values": [{"value": prefix, "label": name} for prefix, name in sorted(prefixes.items(), key=lambda item: item[1])],
            }
        )

    geo = root / "geo.csv"
    if geo.exists():
        try:
            fields, rows = read_csv(geo)
            for field in fields:
                values = sorted({row.get(field, "") for row in rows if row.get(field, "") not in {"", "NA"}})
                if values:
                    levels.append({"type": "geo", "field": field, "label": field, "values": [{"value": value, "label": value} for value in values]})
        except Exception:
            pass

    return {"levels": levels}


def infer_zone_column(filename, geo_fields):
    lower = filename.lower()
    pairs = [
        ("azone", "Azone"),
        ("bzone", "Bzone"),
        ("czone", "Czone"),
        ("marea", "Marea"),
    ]
    for prefix, column in pairs:
        if lower.startswith(prefix) and column in geo_fields:
            return column
    return ""


def geo_options(geo_path, input_filename, input_rows):
    options = []
    zone_level = zone_level_from_filename(input_filename)
    if zone_level:
        values = sorted({str(row.get("Geo", "")) for row in input_rows if str(row.get("Geo", "")) not in {"", "NA"}})
        if values:
            options.append({"type": "geo", "field": "Geo", "label": zone_level, "values": values, "target": "Geo"})

    if geo_path:
        try:
            fields, geo_rows = read_csv(geo_path)
            target = infer_zone_column(input_filename, fields)
            if target:
                related = [field for field in fields if field != target]
                for field in related:
                    values = sorted({row.get(field, "") for row in geo_rows if row.get(field, "") not in {"", "NA"}})
                    if values:
                        options.append({"type": "geo", "field": field, "label": field, "values": values, "target": target})
        except Exception:
            pass

    prefixes = {}
    for row in input_rows:
        geo = str(row.get("Geo", ""))
        if len(geo) >= 5 and geo[:5].isdigit():
            prefixes.setdefault(geo[:5], COUNTY_PREFIXES.get(geo[:5], f"County FIPS {geo[:5]}"))
    if prefixes:
        mpo_values = mpo_filter_values(prefixes)
        if mpo_values:
            options.append({"type": "mpo", "field": "MPO", "label": "MPO", "values": mpo_values, "target": "Geo"})
        values = [{"value": prefix, "label": name} for prefix, name in sorted(prefixes.items(), key=lambda item: item[1])]
        options.append({"type": "county", "field": "County", "label": "County", "values": values, "target": "Geo"})
    return options


def load_file_payload(path, geo_path=""):
    fieldnames, rows = read_csv(path)
    numeric_columns = []
    for column in fieldnames:
        if column == "Geo":
            continue
        values = [normalize_optional_number(row.get(column, "")) for row in rows]
        non_empty = [value for value in values if value is not None]
        if non_empty and all(is_number(value) for value in non_empty):
            numeric_columns.append(column)

    return {
        "path": str(resolve_allowed_path(path)),
        "label": relative_label(path),
        "columns": fieldnames,
        "numericColumns": numeric_columns,
        "rows": rows,
        "filters": geo_options(geo_path, Path(path).name, rows),
    }


def normalize_optional_number(value):
    text = str(value or "").strip()
    if not text or text.upper() in {"NA", "N/A", "NAN", "NULL"}:
        return None
    return text


def is_number(value):
    try:
        float(str(value).strip())
        return True
    except ValueError:
        return False


def datastore_label(path):
    path = Path(path)
    parts = path.parts
    if len(parts) >= 3 and parts[-2:] == ("results", "Datastore"):
        return parts[-3]
    return path.name


def metadata_listing_path():
    ve_root = COMPARISON_ROOT / "VE"
    candidates = []
    if ve_root.exists():
        candidates.extend(sorted(ve_root.glob("*/results/Datastore/DatastoreListing.Rda"), key=lambda p: p.as_posix().lower()))
    candidates.extend(sorted(COMPARISON_ROOT.glob("RetiredModels/*/results/Datastore/DatastoreListing.Rda"), key=lambda p: p.as_posix().lower()))
    for path in candidates:
        if path.exists():
            return path
    return None


UNIT_LABELS = {
    "PRSN": "People",
    "HH": "Households",
    "VEH": "Vehicles",
    "WKR": "Workers",
    "MI": "Miles",
    "USD": "USD",
    "DOL": "Dollars",
    "PCT": "Percent",
}


def unit_label(units):
    units = (units or "").strip()
    if not units:
        return ""
    return UNIT_LABELS.get(units.upper(), units)


@lru_cache(maxsize=8)
def load_metadata_file(listing_path):
    if not listing_path or not R_HELPER.exists():
        return {}
    try:
        result = subprocess.run(
            [rscript_command(), str(R_HELPER), str(listing_path), "--metadata"],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        metadata = json.loads(result.stdout)
    except Exception:
        return {}

    by_variable = {}
    for key, item in metadata.items():
        variable = str(item.get("name", "")).lower()
        units = item.get("units", "")
        display = item.get("name", "")
        label = unit_label(units)
        if label:
            display = f"{display} ({label} ({units}))" if label != units else f"{display} ({units})"
        by_variable.setdefault(variable, []).append(
            {
                "key": key,
                "table": item.get("table", ""),
                "name": item.get("name", ""),
                "display": display,
                "type": item.get("type", ""),
                "units": units,
                "unitLabel": label,
                "description": item.get("description", ""),
            }
        )
    return by_variable


def load_local_metadata():
    if not LOCAL_METADATA_PATH.exists():
        return None
    try:
        payload = json.loads(LOCAL_METADATA_PATH.read_text(encoding="utf-8"))
    except Exception:
        return None
    variables = payload.get("variables", {}) if isinstance(payload, dict) else {}
    return {
        "source": str(LOCAL_METADATA_PATH),
        "sourceLabel": payload.get("sourceLabel") or "Bundled editor metadata",
        "variables": variables,
    }


def load_metadata():
    local_metadata = load_local_metadata()
    if local_metadata is not None:
        return local_metadata
    listing = metadata_listing_path()
    metadata = load_metadata_file(str(listing)) if listing else {}
    return {
        "source": str(listing) if listing else "",
        "sourceLabel": datastore_label(listing.parent) if listing else "",
        "variables": metadata,
    }


def filter_rows_by_request(rows, params, geo_path, input_filename):
    filter_type = params.get("filterType", "")
    filter_field = params.get("filterField", "")
    filter_value = params.get("filterValue", "")
    if not filter_type or not filter_value:
        return rows

    if filter_type == "county":
        return [row for row in rows if str(row.get("Geo", "")).startswith(filter_value)]

    if filter_type == "geo" and geo_path:
        fields, geo_rows = read_csv(geo_path)
        target = infer_zone_column(input_filename, fields)
        allowed = {row.get(target, "") for row in geo_rows if row.get(filter_field, "") == filter_value}
        return [row for row in rows if row.get("Geo", "") in allowed]

    return rows


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC_ROOT), **kwargs)

    def log_message(self, format, *args):
        return

    def do_GET(self):
        parsed = urlparse(self.path)
        params = {key: values[-1] for key, values in parse_qs(parsed.query).items()}
        try:
            if parsed.path == "/api/health":
                json_response(
                    self,
                    {
                        "ok": True,
                        "app": "VisionEval Editor",
                        "workspaceRoot": str(WORKSPACE_ROOT) if WORKSPACE_ROOT else "",
                        "resourceRoot": str(RESOURCE_ROOT),
                    },
                )
            elif parsed.path == "/api/config":
                json_response(
                    self,
                    {
                        "inputLibraries": find_input_libraries(),
                        "workspace": str(WORKSPACE_ROOT or APP_ROOT),
                        "installRoot": str(DEFAULT_EXTERNAL_ROOT),
                        "inputLibraryRoot": str(INPUT_LIBRARY_ROOT),
                        "scenariosRoot": str(SCENARIOS_ROOT),
                        "metadataPath": str(LOCAL_METADATA_PATH),
                        "cleanExplanationsRoot": str(CLEAN_EXPLANATIONS_ROOT),
                        "explanationsRoot": str(EXPLANATIONS_ROOT),
                    },
                )
            elif parsed.path == "/api/files":
                json_response(self, {"files": list_input_files(params.get("inputsPath", ""))})
            elif parsed.path == "/api/explanations":
                json_response(self, {"files": list_file_explanations(params.get("inputsPath", ""), params.get("setId", ""))})
            elif parsed.path == "/api/explanation-sets":
                json_response(self, {"sets": explanation_sets()})
            elif parsed.path == "/api/explanations-root":
                json_response(self, explanations_root_payload())
            elif parsed.path == "/api/guide":
                json_response(self, load_user_guide())
            elif parsed.path == "/api/explanation":
                json_response(self, load_explanation(params.get("csvName", ""), params.get("setId", "")))
            elif parsed.path == "/api/location-options":
                json_response(self, setup_location_options(params.get("inputsPath", "")))
            elif parsed.path == "/api/load":
                json_response(self, load_file_payload(params.get("path", ""), params.get("geoPath", "")))
            elif parsed.path == "/api/metadata":
                json_response(self, load_metadata())
            elif parsed.path == "/api/scenarios":
                json_response(self, {"scenarios": list_scenarios()})
            elif parsed.path == "/api/scenarios-root":
                json_response(self, scenarios_root_payload())
            elif parsed.path == "/api/input-library-root":
                json_response(self, input_library_root_payload())
            elif parsed.path == "/api/scenario":
                json_response(self, load_scenario(params.get("path", "")))
            else:
                super().do_GET()
        except Exception as exc:
            bad_request(self, str(exc))

    def do_POST(self):
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/api/create-scenario":
                payload = parse_body(self)
                json_response(self, create_scenario(payload))
            elif parsed.path == "/api/reveal-path":
                payload = parse_body(self)
                json_response(self, reveal_path(payload))
            elif parsed.path == "/api/export-scenario":
                payload = parse_body(self)
                json_response(self, export_scenario(payload))
            elif parsed.path == "/api/delete-scenario":
                payload = parse_body(self)
                json_response(self, delete_scenario(payload))
            elif parsed.path == "/api/empty-scenarios":
                json_response(self, empty_scenarios())
            else:
                bad_request(self, "Unknown endpoint", 404)
        except Exception as exc:
            bad_request(self, str(exc))


def main():
    seed_workspace_assets()
    port = int(os.environ.get("PORT", "3000"))
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"Vision Eval Data Editor running at http://127.0.0.1:{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
