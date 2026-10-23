"""Solo map home (Minest Live · Solo play): one tidy screen.
Applied in place to iPhone53.8241.html, then copied to iphone.html, index.html and the iOS copies.

- Header: only 教师端 · 词表管理 and ✕ (the 英文 toggle lives once, in the toolbar).
- Toolbar: one white row — the word list (big), 英文, Badges, 词表与备课同步; the always-zero coin / pts / streak pills go.
- Levels: a grid of white cards (two or three per row on a big screen, one on a phone) instead of the long zigzag trail;
  the stage pills head each group; dark readable text, gold stars, a compact ▶.
"""
from pathlib import Path
import shutil, sys

ROOT = Path('/Users/cece/Documents/minest')
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
s = SRC.read_text(encoding='utf-8')
if 'id="teaching-solo-home"' in s:
    sys.exit('already patched')
H = '#mn-templates.tt-quest824[data-ten-view="home"]'
CSS = H.join(["""<style id="teaching-solo-home">
""", """ > header .solo-en-toggle { display: none !important; }
""", """ .solo-home-view { max-width: 1120px; margin: 0 auto; }
""", """ .solo-dashboard-capsule { display: flex !important; align-items: center !important; gap: 10px !important; flex-wrap: wrap; padding: 12px 14px !important; border-radius: 22px !important; background: #fff !important; box-shadow: 0 6px 0 rgba(0,0,0,.18) !important; }
""", """ .solo-dash-left { display: none !important; }
""", """ .solo-dash-right { display: flex !important; flex: 1; align-items: center; gap: 10px !important; flex-wrap: wrap; justify-content: flex-start !important; }
""", """ .solo-dash-right > * { margin: 0 !important; min-height: 46px; border-radius: 14px !important; font-size: 15px !important; box-shadow: none !important; }
""", """ .solo-dash-right > label.solo-pill-btn { order: -1; flex: 1 1 260px; flex-direction: row !important; justify-content: flex-start !important; gap: 8px !important; padding: 6px 14px !important; background: #f3f0fa !important; border: 2px solid #ddd6fe !important; }
""", """ .solo-dash-right > label.solo-pill-btn select { flex: 1; min-width: 0; font-size: 17px !important; padding: 6px 0 !important; }
""", """ .solo-dash-right > .solo-pill-btn.shop { background: #7c3aed !important; color: #fff !important; border: 0 !important; }
""", """ .solo-trail-map { max-width: none !important; display: grid !important; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px !important; margin: 18px 0 20px !important; padding: 0 !important; }
""", """ .solo-trail-map::before { display: none !important; }
""", """ .solo-trail-map > .solo-stage-pill { grid-column: 1 / -1; justify-self: start; align-self: auto !important; margin: 10px 0 0 !important; font-size: 15px !important; }
""", """ .solo-trail-map > .solo-level-card { width: 100% !important; align-self: stretch !important; margin: 0 !important; grid-template-columns: 56px 1fr 46px !important; gap: 12px !important; padding: 12px 14px !important;
  background: #fff !important; border: 0 !important; border-radius: 20px !important; box-shadow: 0 6px 0 rgba(46,16,101,.35) !important; transform: none; }
""", """ .solo-trail-map > .solo-level-card:hover { transform: translateY(-3px) !important; }
""", """ .solo-trail-map > .solo-level-card .solo-card-icon { width: 56px !important; height: 56px !important; border-radius: 16px !important; font-size: 28px !important; }
""", """ .solo-trail-map > .solo-level-card .solo-card-info b { color: #2e1065 !important; font-size: 16px !important; line-height: 1.2; }
""", """ .solo-trail-map > .solo-level-card .solo-card-info small { color: #6b7280 !important; opacity: 1 !important; font-size: 13px !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
""", """ .solo-trail-map > .solo-level-card .solo-card-stars { color: #f59e0b !important; opacity: 1 !important; font-size: 15px !important; }
""", """ .solo-trail-map > .solo-level-card .solo-card-play { width: 46px !important; height: 46px !important; border-radius: 14px !important; font-size: 18px !important; }
""", """ .solo-trail-map > .solo-level-card.needs-data { opacity: .6; }
@media (max-width: 560px) { """, """ .solo-trail-map { grid-template-columns: 1fr; } """, """ .solo-dash-right > * { flex: 1 1 auto; justify-content: center; } """, """ > header .solo-top-brand { font-size: 16px !important; } """, """ > header .solo-btn-teaching { font-size: 0 !important; padding: 8px 12px !important; } """, """ > header .solo-btn-teaching::before { content: "📖 词表"; font-size: 14px; } """, """ > header .solo-btn-close { padding: 8px 10px !important; } """, """ > header .solo-top-actions { gap: 6px !important; } }
</style>
"""])
assert s.count('</head>') == 1
s = s.replace('</head>', CSS + '</head>')
SRC.write_text(s, encoding='utf-8')
for c in COPIES:
    shutil.copyfile(SRC, ROOT / c)
print('patched Solo home')
