#!/usr/bin/env python3
"""Install/update only Saan's marked cron block. Run as the Saan host user."""
import datetime
import os
from pathlib import Path
import shlex
import subprocess

os.umask(0o077)
home = Path(__file__).resolve().parent.parent
log = home / "backup-schedule.log"
with log.open("a"):
    pass
os.chmod(log, 0o600)
if not Path("/etc/localtime").resolve().as_posix().endswith("/Asia/Bangkok"):
    raise SystemExit("Host timezone must be Asia/Bangkok before installing the 03:00 schedule")
result = subprocess.run(["crontab", "-l"], capture_output=True, text=True)
if result.returncode not in (0, 1):
    raise SystemExit("Cannot read current user crontab")
old = result.stdout
begin, end = "# BEGIN SAAN HOME BACKUP", "# END SAAN HOME BACKUP"
if old.count(begin) != old.count(end) or old.count(begin) > 1:
    raise SystemExit("Ambiguous managed cron block; review manually")
remaining = old
if begin in remaining:
    start = remaining.index(begin)
    finish = remaining.index(end, start) + len(end)
    remaining = remaining[:start] + remaining[finish:]
stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
backup = home / f"crontab.before-saan-{stamp}"
with backup.open("x") as stream:
    stream.write(old)
command = "/usr/bin/python3 " + shlex.quote(str(home / "deploy" / "scheduled-backup.py"))
command += " >> " + shlex.quote(str(home / "backup-schedule.log")) + " 2>&1"
block = f"{begin}\n0 3 * * * {command}\n{end}\n"
subprocess.run(["crontab", "-"], input=remaining.rstrip() + "\n" + block, text=True, check=True)
assert block in subprocess.check_output(["crontab", "-l"], text=True)
print("Saan daily 03:00 Bangkok backup configured; other user cron jobs preserved.")
