"""Board switcher (Switch or Manage Boards) → a liquid-glass Workspace panel.
Applied in place to iPhone53.8241.html, then copied to iphone.html, index.html and the two iOS copies.

- The green "📁 <group>" tag on every board row is gone. Moving a board to another group stays in each row's ⋯ menu.
- The look:
  - Glass panel: stronger blur, a deeper tint so the board behind no longer shows through, a top rim light and a soft shadow.
  - Group tabs: a glass segmented control — 全部 / each group / ＋ 新建分组 — with a bright selected pill instead of green.
  - Boards: a grid of glass tiles. Each tile has a letter avatar in its first list's colour, a row of list-colour dots and
    "N lists · N cards"; the current board has a blue ring.
  - New board, export and import share the same glass. A light-theme version is included.
Only class names, the title and the row markup change; every action (select, ⋯ options, groups, archive, paste,
create, export / import, reset) is the original code.
"""
from pathlib import Path
import shutil, sys, re

ROOT = Path('/Users/cece/Documents/minest')
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html']
s = SRC.read_text(encoding='utf-8')
if 'mn-ws-panel' in s:
    sys.exit('already patched')

def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (a[:110], c, n); s = s.replace(a, b)

rep('''className: "board-picker-popover absolute left-0 top-full mt-2 w-80 sm:w-96 ''',
    '''className: "board-picker-popover mn-ws-panel" + (isDark ? "" : " mn-ws-light") + " absolute left-0 top-full mt-2 w-80 sm:w-96 ''')
rep('''(0, P.jsx)('h3', { className: "font-bold text-sm", children: "Switch or Manage Boards" })''',
    '''(0, P.jsxs)('h3', { className: "mn-ws-title font-bold text-sm", children: ["Workspace", (0, P.jsx)('small', { className: "mn-ws-sub", children: visibleBoards.length + " boards" })] })''')
rep('''className: "flex items-center gap-1.5 overflow-x-auto pb-1 custom-scroll shrink-0",''',
    '''className: "mn-ws-tabs flex items-center gap-1.5 overflow-x-auto pb-1 custom-scroll shrink-0",''')
rep('''className: "px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 border " +
                (isSel''',
    '''className: "mn-ws-tab" + (isSel ? " mn-ws-tab-on" : "") + " px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 border " +
                (isSel''')
rep('''className: "px-2 py-1 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1 border border-dashed border-emerald-500/50 hover:bg-emerald-500/15 text-emerald-400 transition-all cursor-pointer",''',
    '''className: "mn-ws-newfolder px-2 py-1 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1 border border-dashed border-emerald-500/50 hover:bg-emerald-500/15 text-emerald-400 transition-all cursor-pointer",''')
rep('''className: "flex items-center justify-between px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs shrink-0",''',
    '''className: "mn-ws-folderbar flex items-center justify-between px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs shrink-0",''')
rep('''className: "space-y-2 max-h-[58vh] flex-1 overflow-y-auto pr-1.5 custom-scroll",''',
    '''className: "mn-ws-grid space-y-2 max-h-[58vh] flex-1 overflow-y-auto pr-1.5 custom-scroll",''')
rep('''          return (0, P.jsxs)('div', {
            key: b.id,
            onClick: function() { if (isActionsExpanded) return; onSelectBoard(b.id); SoundEngine.play('click'); onClose(); },
            className: "group w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all " +''',
    '''          return (0, P.jsxs)('div', {
            key: b.id,
            style: { '--c': ((b.columns || [])[0] || {}).color || '#64748b' },
            onClick: function() { if (isActionsExpanded) return; onSelectBoard(b.id); SoundEngine.play('click'); onClose(); },
            className: "mn-ws-card" + (isCurrent ? " mn-ws-card-on" : "") + (isActionsExpanded ? " mn-ws-card-open" : "") + " group w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all " +''')
# the row: avatar, title (no group tag), list-colour dots
rep('''            children: [
              (0, P.jsxs)('div', {
                className: "flex flex-col min-w-0 pr-2",
                children: [''',
    '''            children: [
              (0, P.jsx)('div', { className: "mn-ws-avatar", 'aria-hidden': "true", children: String(b.title || '?').trim().charAt(0).toUpperCase() }),
              (0, P.jsxs)('div', {
                className: "mn-ws-info flex flex-col min-w-0 pr-2",
                children: [''')
m = re.search(r''',\n\s*\(0, P\.jsxs\)\('button', \{\n\s*type: "button",\n\s*onClick: function\(e\) \{\n\s*e\.stopPropagation\(\);\n\s*handleMoveBoard\(b\.id, b\.workspace\);\n\s*\},\n\s*className: "px-1\.5 py-0\.2 rounded text-\[9px\][^\n]*\n\s*title: "点击移动至其他分组 / Click to change folder",\n\s*children: \[\n\s*\(0, P\.jsx\)\('span', \{ children: "📁" \}\),\n\s*\(0, P\.jsx\)\('span', \{ children: b\.workspace \|\| 'General' \}\)\n\s*\]\n\s*\}\)''', s)
assert m, 'group tag not found'
s = s[:m.start()] + '   /* the group tag is gone: ⋯ → 移动分组 moves a board */' + s[m.end():]
rep('''(0, P.jsxs)('span', { className: "text-[10px] opacity-60", children: [(b.columns || []).length, " lists · ", totalC, " cards"] })''',
    '''(0, P.jsxs)('span', { className: "mn-ws-meta text-[10px] opacity-60", children: [(b.columns || []).length, " lists · ", totalC, " cards"] }),
                  (0, P.jsx)('span', { className: "mn-ws-dots", 'aria-hidden': "true", children: (b.columns || []).slice(0, 10).map(function(c, i) { return (0, P.jsx)('i', { style: { background: c.color || '#94a3b8' } }, c.id || i); }) })''')
rep('''className: "flex items-center gap-2 pt-2 border-t border-white/10",
        children: [
          (0, P.jsx)('input', {
            type: "text",
            value: newTitle,''',
    '''className: "mn-ws-form flex items-center gap-2 pt-2 border-t border-white/10",
        children: [
          (0, P.jsx)('input', {
            type: "text",
            value: newTitle,''')
rep('''className: "flex items-center justify-between gap-2 pt-2.5 border-t border-white/10 text-[11px] flex-wrap",''',
    '''className: "mn-ws-foot flex items-center justify-between gap-2 pt-2.5 border-t border-white/10 text-[11px] flex-wrap",''')

P = 'html body .board-picker-popover.mn-ws-panel.mn-ws-panel'
css = f"""<style id="mn-workspace-glass">
/* Workspace · liquid glass (the board switcher) */
/* the panel sits inside the top bar; a blurred ancestor is a backdrop root, so while the panel is open the bar drops its
   own blur (a near-solid tint instead) and the panel's glass can blur the board behind it. :has() here only watches the bar. */
html body header.iphone-topbar:has(.mn-ws-panel) { -webkit-backdrop-filter: none !important; backdrop-filter: none !important; background: rgba(14,20,27,.94) !important; }
html body .theme-white header.iphone-topbar:has(.mn-ws-panel), html body header.iphone-topbar:has(.mn-ws-light) { background: rgba(246,248,251,.96) !important; }
{P} {{ width: min(94vw, 700px) !important; max-width: calc(100vw - 16px) !important; padding: 16px !important; border-radius: 30px !important; color: #f5f7fb !important;
  background: radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,.16), transparent 55%), radial-gradient(90% 70% at 100% 100%, rgba(120,170,255,.12), transparent 60%), rgba(16,22,32,.80) !important;
  -webkit-backdrop-filter: blur(42px) saturate(190%) !important; backdrop-filter: blur(42px) saturate(190%) !important;
  border: 1px solid rgba(255,255,255,.2) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.38), inset 0 -1px 0 rgba(255,255,255,.05), 0 30px 80px rgba(0,0,0,.55), 0 6px 18px rgba(0,0,0,.25) !important; gap: 12px; }}
{P} > * + * {{ margin-top: 0 !important; }}
{P} > :first-child {{ border-bottom: 0 !important; padding-bottom: 2px !important; }}
{P} .mn-ws-title {{ display: flex; align-items: baseline; gap: 8px; font-size: 19px !important; font-weight: 800 !important; letter-spacing: -.3px; }}
{P} .mn-ws-sub {{ font-size: 12px; font-weight: 600; opacity: .55; letter-spacing: 0; }}
{P} > :first-child svg {{ color: rgba(255,255,255,.85) !important; }}
{P} .mn-ws-tabs {{ padding: 4px !important; gap: 4px !important; border-radius: 16px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); box-shadow: inset 0 1px 0 rgba(255,255,255,.06); scrollbar-width: none; }}
{P} .mn-ws-tabs::-webkit-scrollbar {{ display: none; }}
{P} .mn-ws-tab {{ background: transparent !important; border-color: transparent !important; color: rgba(255,255,255,.68) !important; border-radius: 12px !important; padding: 7px 12px !important; font-size: 13px !important; transform: none !important; box-shadow: none !important; }}
{P} .mn-ws-tab:hover {{ background: rgba(255,255,255,.07) !important; color: #fff !important; }}
{P} .mn-ws-tab.mn-ws-tab-on {{ background: linear-gradient(180deg, rgba(255,255,255,.26), rgba(255,255,255,.14)) !important; color: #fff !important; font-weight: 700 !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.45), 0 4px 12px rgba(0,0,0,.25) !important; }}
{P} .mn-ws-newfolder {{ border: 1px dashed rgba(255,255,255,.28) !important; color: rgba(255,255,255,.75) !important; background: transparent !important; border-radius: 12px !important; padding: 7px 12px !important; font-size: 13px !important; }}
{P} .mn-ws-folderbar {{ background: rgba(255,255,255,.05) !important; border-color: rgba(255,255,255,.1) !important; border-radius: 14px !important; padding: 8px 12px !important; }}
{P} .mn-ws-grid {{ display: grid !important; grid-template-columns: repeat(auto-fill, minmax(min(232px, 100%), 1fr)); width: 100%; min-width: 0; gap: 10px !important; padding: 2px 4px 2px 2px !important; align-content: start; }}
{P} .mn-ws-grid > * {{ margin: 0 !important; }}
{P} .mn-ws-card {{ display: flex !important; align-items: center !important; gap: 12px; padding: 12px !important; border-radius: 20px !important; color: #f5f7fb !important; font-weight: 500 !important;
  background: linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.04)) !important; border: 1px solid rgba(255,255,255,.12) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.1) !important; transition: transform .18s ease, background .18s ease, box-shadow .18s ease !important; }}
{P} .mn-ws-card:hover {{ background: linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.06)) !important; transform: translateY(-1px); }}
{P} .mn-ws-card.mn-ws-card-on {{ background: linear-gradient(180deg, rgba(10,132,255,.24), rgba(10,132,255,.1)) !important; border-color: rgba(140,195,255,.6) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.22), 0 0 0 1px rgba(140,195,255,.3), 0 10px 26px rgba(10,132,255,.2) !important; }}
{P} .mn-ws-card.mn-ws-card-open {{ flex-wrap: wrap; }}
{P} .mn-ws-avatar {{ flex: none; width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center; font-weight: 800; font-size: 18px; color: #fff;
  background: linear-gradient(135deg, var(--c, #64748b), color-mix(in srgb, var(--c, #64748b) 55%, #000)); box-shadow: inset 0 1px 0 rgba(255,255,255,.4), 0 4px 10px rgba(0,0,0,.25); text-shadow: 0 1px 2px rgba(0,0,0,.3); }}
{P} .mn-ws-info {{ flex: 1 1 auto; gap: 3px; }}
{P} .mn-ws-info .truncate {{ font-size: 14.5px !important; font-weight: 700 !important; color: #fff !important; }}
{P} .mn-ws-meta {{ font-size: 11.5px !important; opacity: .62 !important; }}
{P} .mn-ws-dots {{ display: flex; gap: 3px; flex-wrap: wrap; margin-top: 2px; }}
{P} .mn-ws-dots i {{ width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 0 1px rgba(255,255,255,.18); }}
{P} .mn-ws-card .text-emerald-400 {{ color: #8ecbff !important; }}
{P} .mn-ws-card button {{ color: rgba(255,255,255,.75) !important; }}
{P} .mn-ws-form {{ border-top: 0 !important; padding-top: 4px !important; }}
{P} .mn-ws-form input {{ min-height: 42px; border-radius: 14px !important; background: rgba(255,255,255,.08) !important; border: 1px solid rgba(255,255,255,.14) !important; font-size: 14px !important; color: #fff !important; }}
{P} .mn-ws-form button[type=submit] {{ min-height: 42px; border-radius: 14px !important; padding: 0 16px !important; background: linear-gradient(180deg, #3a9bff, #0a84ff) !important; color: #fff !important; font-size: 14px !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 6px 16px rgba(10,132,255,.35) !important; }}
{P} .mn-ws-foot {{ border-top: 1px solid rgba(255,255,255,.08) !important; }}
{P} .mn-ws-foot .text-emerald-400, {P} .mn-ws-folderbar .text-emerald-400 {{ color: #8ecbff !important; }}
/* light theme */
{P}.mn-ws-light {{ color: #0f172a !important; background: radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,.9), transparent 55%), rgba(244,246,250,.78) !important; border-color: rgba(255,255,255,.75) !important; box-shadow: inset 0 1px 0 #fff, 0 30px 70px rgba(15,23,42,.18), 0 4px 14px rgba(15,23,42,.08) !important; }}
{P}.mn-ws-light .mn-ws-tabs {{ background: rgba(15,23,42,.05); border-color: rgba(15,23,42,.06); }}
{P}.mn-ws-light .mn-ws-tab {{ color: rgba(15,23,42,.6) !important; }}
{P}.mn-ws-light .mn-ws-tab.mn-ws-tab-on {{ background: #fff !important; color: #0f172a !important; box-shadow: 0 2px 8px rgba(15,23,42,.12) !important; }}
{P}.mn-ws-light .mn-ws-newfolder {{ color: rgba(15,23,42,.6) !important; border-color: rgba(15,23,42,.2) !important; }}
{P}.mn-ws-light .mn-ws-card {{ background: rgba(255,255,255,.66) !important; border-color: rgba(15,23,42,.07) !important; color: #0f172a !important; box-shadow: 0 1px 2px rgba(15,23,42,.05) !important; }}
{P}.mn-ws-light .mn-ws-card.mn-ws-card-on {{ background: rgba(10,132,255,.1) !important; border-color: rgba(10,132,255,.45) !important; }}
{P}.mn-ws-light .mn-ws-info .truncate {{ color: #0f172a !important; }}
{P}.mn-ws-light .mn-ws-card button {{ color: rgba(15,23,42,.6) !important; }}
{P}.mn-ws-light .mn-ws-card .text-emerald-400, {P}.mn-ws-light .mn-ws-foot .text-emerald-400 {{ color: #0a6fd6 !important; }}
{P}.mn-ws-light .mn-ws-form input {{ background: rgba(255,255,255,.8) !important; border-color: rgba(15,23,42,.1) !important; color: #0f172a !important; }}
@media (max-width: 520px) {{ {P} .mn-ws-grid {{ grid-template-columns: minmax(0, 1fr); }} }}
{P} .mn-ws-card, {P} .mn-ws-info {{ min-width: 0 !important; }}
@media (prefers-reduced-motion: reduce) {{ {P} .mn-ws-card {{ transition: none !important; }} }}
</style>
"""
assert s.count('</head>') == 1
s = s.replace('</head>', css + '</head>')
SRC.write_text(s, encoding='utf-8')
for c in COPIES:
    shutil.copyfile(SRC, ROOT / c)
print('patched workspace')
