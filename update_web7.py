import re
import json

with open("web7.0.html", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Define IconSettings
icon_palette_target = """var IconPalette = E('palette', [
  ['circle', { cx: '13.5', cy: '6.5', r: '.5', fill: 'currentColor', key: 'pal1' }],
  ['circle', { cx: '17.5', cy: '10.5', r: '.5', fill: 'currentColor', key: 'pal2' }],
  ['circle', { cx: '8.5', cy: '7.5', r: '.5', fill: 'currentColor', key: 'pal3' }],
  ['circle', { cx: '6.5', cy: '12.5', r: '.5', fill: 'currentColor', key: 'pal4' }],
  ['path', { d: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z', key: 'pal5' }]
]);"""

icon_settings_def = """var IconPalette = E('palette', [
  ['circle', { cx: '13.5', cy: '6.5', r: '.5', fill: 'currentColor', key: 'pal1' }],
  ['circle', { cx: '17.5', cy: '10.5', r: '.5', fill: 'currentColor', key: 'pal2' }],
  ['circle', { cx: '8.5', cy: '7.5', r: '.5', fill: 'currentColor', key: 'pal3' }],
  ['circle', { cx: '6.5', cy: '12.5', r: '.5', fill: 'currentColor', key: 'pal4' }],
  ['path', { d: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z', key: 'pal5' }]
]);
var IconSettings = E('settings', [
  ['path', { d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z', key: 's1' }],
  ['circle', { cx: '12', cy: '12', r: '3', key: 's2' }]
]);"""

assert icon_palette_target in text, "Could not find IconPalette"
text = text.replace(icon_palette_target, icon_settings_def, 1)

# 2. Replace broken j icons
text = text.replace(
    'children: (0, P.jsx)(j, { className: "w-4 h-4 text-purple-300" })',
    'children: (0, P.jsx)(IconSettings, { className: "w-4 h-4 text-purple-300" })',
    1
)
text = text.replace(
    'children: (0, P.jsx)(j, { className: "w-4 h-4" })',
    'children: (0, P.jsx)(IconSettings, { className: "w-4 h-4" })'
)

print("IconSettings and j replacements done")

with open("web7.0.html", "w", encoding="utf-8") as f:
    f.write(text)
