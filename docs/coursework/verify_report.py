"""Check report structure and record the generated artifact fingerprints."""
from pathlib import Path
from datetime import datetime
import hashlib
import json
import subprocess
import re
from pypdf import PdfReader
from docx import Document

root = Path(__file__).resolve().parents[2]
out = root / 'output/coursework'
docx = out / 'Saan_CPE334_Deliverable_1.docx'
pdf = out / 'Saan_CPE334_Deliverable_1.pdf'
reader = PdfReader(pdf)
structure = json.loads((out / 'report-structure.json').read_text(encoding='utf8'))
assert len(reader.pages) == len(structure['pages']), 'Logical pages must match rendered pages'
text = '\n'.join(p.extract_text() for p in reader.pages)
for expected in ['67070503444', '67070503441', 'Suwiwat Sinsomboon', 'Supanut Sopha']:
    assert expected in text, expected
assert '67070503431' not in text, 'Superseded teammate draft ID'
for number, (_, title) in enumerate(structure['pages']):
    normalized = lambda value: ' '.join(value.split())
    assert normalized(title) in normalized(reader.pages[number].extract_text()), f'Page {number+1}: {title}'
doc = Document(docx)
assert doc.paragraphs[1].style.name == 'Title'
integration_text=(root/'docs/coursework/evidence/integration-expanded-2026-11-05.txt').read_text(encoding='utf-8-sig')
integration={name:int(re.findall(r'# '+name+r' (\d+)',integration_text)[-1]) for name in ['tests','pass','fail','skipped']}
assert integration['fail'] == 0 and integration['pass'] == 69
http=json.loads((root/'docs/coursework/evidence/http-date-after-2026-11-07.json').read_text(encoding='utf8'))
assert len(http['results']) == 13 and all(row['result'] == 'PASS' for row in http['results'])
for name, expected in http.get('sourceFiles', {}).items():
    assert hashlib.sha256((root/name).read_bytes()).hexdigest() == expected, f'Source changed after HTTP verification: {name}'
css_text=(root/'docs/coursework/evidence/css-after-2026-11-05.txt').read_text(encoding='utf-8-sig')
assert 'PASS BLD-AC-01' in css_text
manifest = {
    'checkedAt': datetime.now().astimezone().isoformat(),
    'applicationBaseline': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(),
    'courseReleaseAccepted': False,
    'documentPages': len(reader.pages),
    'rendering': 'Hidden Microsoft Word PDF export and bundled Poppler PNG rasterization',
    'checks': {'integration': {'exitCode': 0, **integration},
               'http': {'passed':13,'failed':0,'skipped':0,'sourceIdentity':http['sourceIdentity']},
               'typecheck': {'exitCode': 0},
               'webpackBuild': {'exitCode': 0, 'details': 'build-date-after-2026-11-07.txt'},
               'defaultBuild': {'exitCode': 1, 'details': 'Fresh 7 November Turbopack PostCSS worker startup failure; Webpack passed'},
               'compiledStyles': {'exitCode':0,'details':'css-after-2026-11-05.txt'}},
    'artifacts': {p.name: {'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
                  for p in [docx, pdf]},
    'remaining': ['Master course specification and reuse decision',
                  'Substantive teammate PR reviews and sprint staging integration',
                  'Browser acceptance on the selected release and recorded personal verification',
                  'Human acceptance of the final release'],
}
(root / 'docs/coursework/evidence/manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf8')
print(f'Verified {len(reader.pages)} pages, navigation, both identities and generated artifact hashes')
