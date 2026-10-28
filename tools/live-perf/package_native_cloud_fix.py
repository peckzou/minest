"""Refresh bundled Web resources in the previously built, signed native baseline.

The cloud fix changes no Swift, entitlement, extension or provisioning settings.
Clone the known app, replace only repository HTML resources, then sign the outer
bundle again. Does not remove or replace the device's app data container.
"""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess

root = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--source-app', required=True, type=Path)
parser.add_argument('--output-app', required=True, type=Path)
parser.add_argument('--identity', required=True)
args = parser.parse_args()
source = args.source_app.resolve()
output = args.output_app.resolve()
if not (source/'Minest').is_file() or output.exists() or source == output:
    raise SystemExit('A valid original app and a fresh output path are required')
subprocess.run(['codesign', '--verify', '--deep', '--strict', str(source)], check=True)
output.parent.mkdir(parents=True, exist_ok=True)
subprocess.run(['cp', '-cR', str(source), str(output)], check=True)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
records = {}
for name in ['iphone.html', 'iphone18.0.html', 'ipad.html']:
    destination = output/name
    if not destination.exists():
        continue
    data = (root/'ios/Minest/Minest'/name).read_bytes()
    if b'mn-workspace-cloud-v2' not in data:
        raise SystemExit('Missing cloud fix in '+name)
    destination.write_bytes(data)
    records[name] = sha(destination)
if sha(source/'Minest') != sha(output/'Minest'):
    raise SystemExit('Unexpected native executable change')
subprocess.run(['codesign', '--force', '--sign', args.identity,
                '--preserve-metadata=identifier,entitlements,requirements,flags,runtime',
                '--generate-entitlement-der', str(output)], check=True)
subprocess.run(['codesign', '--verify', '--deep', '--strict', str(output)], check=True)
receipt = {'nativeExecutableUnchanged': True, 'htmlSHA256': records,
           'commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip(),
           'app': str(output)}
(output.parent/'cloud-resources-receipt.json').write_text(json.dumps(receipt, indent=2)+'\n')
print(json.dumps(receipt, indent=2))
