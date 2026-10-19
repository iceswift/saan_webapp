#!/usr/bin/env python3
"""Home-only backup runner. Retains 14 successful *managed* snapshots; never prunes manual backups."""
import datetime
import fcntl
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

os.umask(0o077)
root = Path(__file__).resolve().parent
home = root.parent
backups = home / "backups" / "scheduled"
operations = home / "data" / "operations"
backups.mkdir(parents=True, exist_ok=True)
operations.mkdir(parents=True, exist_ok=True)

def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

def record(ok):
    target = operations / "backup.json"
    try:
        previous = json.loads(target.read_text())
    except (OSError, ValueError):
        previous = {}
    stamp = now()
    fd, temporary = tempfile.mkstemp(dir=operations)
    with os.fdopen(fd, "w") as stream:
        json.dump({"checkedAt": stamp, "ok": ok, "lastSuccessAt": stamp if ok else previous.get("lastSuccessAt")}, stream)
    os.replace(temporary, target)

with (home / "backup-schedule.lock").open("a") as lock:
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        raise SystemExit("Backup already running")
    try:
        before = set(backups.iterdir())
        subprocess.run(["sh", str(root / "backup.sh"), str(backups)], check=True)
        created = set(backups.iterdir()) - before
        if len(created) != 1:
            raise RuntimeError("Expected one new backup")
        bundle = created.pop()
        subprocess.run(["sha256sum", "-c", "SHA256SUMS"], cwd=bundle, check=True)
        subprocess.run(["tar", "-tzf", str(bundle / "uploads.tar.gz")], stdout=subprocess.DEVNULL, check=True)
        (bundle / ".saan-scheduled-complete").write_text("format=1\n")
        completed = sorted(p for p in backups.iterdir() if not p.is_symlink() and p.is_dir() and (p / ".saan-scheduled-complete").is_file())
        for old in completed[:-14]:
            # Resolve and constrain each target before recursive deletion. Keep manual/failed snapshots.
            if old.resolve().parent != backups.resolve() or old.is_symlink():
                raise RuntimeError("Unsafe retention target")
            shutil.rmtree(old)
        record(True)
    except BaseException:
        record(False)
        raise
