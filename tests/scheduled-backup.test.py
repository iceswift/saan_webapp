"""Isolated Linux test: runner retention, failed backups and safe manual/symlink preservation."""
from pathlib import Path
import json, shutil, subprocess, sys, tempfile
source=Path(sys.argv[1]).resolve()
with tempfile.TemporaryDirectory(prefix='saan-backup-test-') as directory:
 root=Path(directory);deploy=root/'deploy';deploy.mkdir()
 shutil.copyfile(source,deploy/'scheduled-backup.py')
 backups=root/'backups'/'scheduled';backups.mkdir(parents=True)
 for i in range(16):
  p=backups/f'202601{i+1:02d}T030000Z-1';p.mkdir();(p/'.saan-scheduled-complete').write_text('format=1')
 manual=backups/'manual-keep';manual.mkdir();(manual/'evidence').write_text('keep')
 outside=root/'outside';outside.mkdir();(outside/'evidence').write_text('keep');(backups/'symlink-keep').symlink_to(outside,target_is_directory=True)
 (deploy/'backup.sh').write_text('''#!/bin/sh
set -eu
bundle="$1/20261019T030000Z-999"
mkdir "$bundle"
printf dump > "$bundle/database.dump"
printf images > "$bundle/images.json"
printf manifest > "$bundle/manifest.txt"
tar -czf "$bundle/uploads.tar.gz" --files-from /dev/null
(cd "$bundle" && sha256sum database.dump images.json manifest.txt uploads.tar.gz > SHA256SUMS)
''')
 subprocess.run([sys.executable,str(deploy/'scheduled-backup.py')],check=True,stdout=subprocess.DEVNULL)
 completed=[p for p in backups.iterdir() if not p.is_symlink() and (p/'.saan-scheduled-complete').exists()]
 assert len(completed)==14
 assert not (backups/'20260101T030000Z-1').exists()
 assert (manual/'evidence').read_text()=='keep' and (outside/'evidence').read_text()=='keep'
 status=root/'data'/'operations'/'backup.json';before=json.loads(status.read_text());assert before['ok']
 (deploy/'backup.sh').write_text('#!/bin/sh\nexit 7\n')
 result=subprocess.run([sys.executable,str(deploy/'scheduled-backup.py')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 assert result.returncode!=0
 after=json.loads(status.read_text());assert after['ok'] is False and after['lastSuccessAt']==before['lastSuccessAt']
 assert len([p for p in backups.iterdir() if not p.is_symlink() and (p/'.saan-scheduled-complete').exists()])==14
print('PASS: retention keeps 14 successful managed bundles, preserves manual/symlink targets, failed run retains prior success and snapshots.')
