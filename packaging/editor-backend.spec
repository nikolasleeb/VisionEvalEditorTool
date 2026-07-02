# -*- mode: python ; coding: utf-8 -*-
from pathlib import Path

ROOT = Path.cwd()

datas = [
    (str(ROOT / "public"), "public"),
    (str(ROOT / "InputLibrary"), "InputLibrary"),
    (str(ROOT / "Metadata"), "Metadata"),
    (str(ROOT / "Clean Explanations" / "DOCX"), "Clean Explanations/DOCX"),
    (str(ROOT / "UserGuide.md"), "."),
]

a = Analysis(
    [str(ROOT / "app.py")],
    pathex=[str(ROOT)],
    binaries=[],
    datas=datas,
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="vision-eval-editor-backend",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
