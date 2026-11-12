"""Reject a native package that cannot send words to the CarPlay widget.
Usage: python3 tools/carplay/check_bundle.py /path/to/Minest.app
Reads only the signed bundle, never device/user playlist data.
"""
import pathlib
import plistlib
import subprocess
import sys

app = pathlib.Path(sys.argv[1]).resolve()
widget = app / 'PlugIns/MinestWidget.appex'

def check(condition, message):
    if not condition:
        raise SystemExit('FAIL: ' + message)
    print('PASS: ' + message)

def binary_strings(bundle):
    info = plistlib.loads((bundle / 'Info.plist').read_bytes())
    executable = bundle / info['CFBundleExecutable']
    debug = executable.with_name(executable.name + '.debug.dylib')
    return subprocess.check_output(['strings', str(debug if debug.exists() else executable)]).decode(errors='replace')

def entitlements(bundle):
    output = subprocess.check_output(['codesign', '-d', '--entitlements', ':-', str(bundle)], stderr=subprocess.DEVNULL)
    return plistlib.loads(output)

check(widget.is_dir(), 'widget extension embedded')
main_strings = binary_strings(app)
widget_strings = binary_strings(widget)
for symbol in ['carFlashStart', 'carFlashState', 'CarFlashController', 'minest.carflash.playlist.v1']:
    check(symbol in main_strings, 'app contains ' + symbol)
for symbol in ['MinestCarFlashWidget', 'minest.carflash.playlist.v1']:
    check(symbol in widget_strings, 'widget contains ' + symbol)
for bundle in [app, widget]:
    check('group.com.zouminmin.minest' in entitlements(bundle).get('com.apple.security.application-groups', []), bundle.name + ' signed for the shared playlist App Group')
subprocess.run(['codesign', '--verify', '--deep', '--strict', str(app)], check=True)
print('PASS: complete bundle signature verified')
