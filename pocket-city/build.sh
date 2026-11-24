#!/usr/bin/env bash
# Rebuild a Pocket City page from its sources:  pocket-city/build.sh staubbach
# Needs python3 with shapely only when scene.json is regenerated (see .claude/skills/pocket-city/SKILL.md); this step needs none.
set -euo pipefail
cd "$(dirname "$0")/.."
name="${1:?usage: pocket-city/build.sh <place>}"
src="pocket-city/$name"
python3 .claude/skills/pocket-city/scripts/build.py --scene "$src/scene.json" --city "$src/city.json" --landmarks "$src/landmarks.js" --out "$name.html"
# Inside Minest's 3D world overlay the "回到 My World" pill sits over the top-left corner: move the page's own header clear of it.
# (?framed=1: the host shows its own bar above the page, so nothing needs moving.)
python3 - "$name.html" <<'PY'
import sys
path = sys.argv[1]
html = open(path, encoding='utf-8').read()
embed = "<script>if(window.self!==window.top&&!/[?&]framed=1/.test(location.search))document.documentElement.classList.add('in-minest')</script><style>.in-minest .top{padding-left:236px}@media(max-width:760px){.in-minest .top{padding-left:12px;padding-top:54px;height:102px}.in-minest .workspace{height:calc(100% - 102px - 28px)}}</style>"
html = html.replace('<html lang="en">', '<html lang="zh-CN">', 1).replace('</head>', embed + '</head>', 1)
open(path, 'w', encoding='utf-8').write(html)
PY
echo "Built $name.html"
