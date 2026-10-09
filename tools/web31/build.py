#!/usr/bin/env python3
"""Minest Web 31.0 = Web 30.0 + Minest Live (a live class game played through the Study Arcade, Gimkit-style economy) + the teacher room entry.

    python3 tools/web31/build.py                  # latest iPhoneX.Y.html
    python3 tools/web31/build.py iPhone44.8.html

Writes web31.0.html (the desktop app) and web31.play.html (the student join page: the live game only).
The game code is tools/web31/minest-live.js — edit that, not the generated pages.
"""
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'web30'))
import build as web30   # noqa: E402

REPO = web30.REPO
once = web30.once


def live_js():
    return open(os.path.join(HERE, 'minest-live.js'), encoding='utf-8').read()


def build(iphone_path):
    out = web30.build(iphone_path)
    # Study Arcade: Minest Live opens one game straight away (a level) and hears when the player leaves it
    out = once(out, "window.dispatchEvent(new CustomEvent('minest:arcade-done', { detail: { mode: S.modeKey, cleared: !!cleared, res: outRes } }));",
                "window.dispatchEvent(new CustomEvent('minest:arcade-done', { detail: { mode: S.modeKey, cleared: !!cleared, res: outRes, score: Math.round(S.score || 0), combo: S.bestCombo || 0 } }));   // web31: score for Minest Live",
                'Arcade: score in arcade-done')
    out = once(out, """    document.documentElement.classList.remove('arcade-open');
    a.root.remove();
  };""", """    document.documentElement.classList.remove('arcade-open');
    a.root.remove();
    try { window.dispatchEvent(new CustomEvent('minest:arcade-closed')); } catch (e) {}   // web31: Minest Live
  };""", 'Arcade: closed event')
    out = once(out, """  return {
    open: open, close: close, learn: learn, isOpen: function() { return !!A; },""", """  // web31 · Minest Live: open straight into one game — a level of a live class game — on the whole deck
  var level = function(board, modeKey, o) {
    o = o || {};
    if (!MODE_INFO[modeKey]) return false;
    var deck = buildDeck(board, null, true), dir = o.dir || 'mix';
    var playable = modeKey === 'blast' ? deck.filter(function(it) { return it.back; }) : deck;
    if (MODE_INFO[modeKey].recall) {
      playable = playable.filter(function(it) {
        var ok = function(d) { return modeKey === 'missing' ? (d === 'def2term' || !!it.zh) : DIRS[d].ok(it); };
        return dir === 'mix' ? Object.keys(DIRS).some(ok) : ok(dir);
      });
    }
    if (!playable.length) return false;
    open(board);
    if (!A) return false;
    play(modeKey, playable, { speed: o.speed || 1.5, flip: true, find: false, pool: deck, poolAll: deck, dir: dir, level: o.level || 'normal', run: o.run || 'short' });
    return true;
  };
  return {
    open: open, close: close, learn: learn, level: level, isOpen: function() { return !!A; },""", 'Arcade: level()')
    # Student 3D Cover study room: web31.0.html?learn=CODE mounts only the 3D Cover (the iPhone build's Oe) on
    # the live game's cards — the board app (its storage, sync) never starts, so nothing of the student's changes.
    # Only two buttons: Light FX (FBFX's own, it appears by itself on the stage) and the thick-glass switch.
    out = once(out, """(0, v.createRoot)(document.getElementById('root')).render(
  (0, P.jsx)(_.StrictMode, {
    children: (0, P.jsx)(Ve, {
      children: (0, P.jsx)(Be, {})""", """// ---- web31: the student 3D Cover study room (Minest Live) ----
var CoverKiosk = function() {
  var code = (new URLSearchParams(location.search).get('learn') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  var bs = (0, _.useState)(null), board = bs[0], setBoard = bs[1];
  var es = (0, _.useState)(''), err = es[0], setErr = es[1];
  var gs = (0, _.useState)(false), glass = gs[0], setGlass = gs[1];
  var noop = function() {};
  // thick glass is for looking only (no tap-to-read / flip / record), so the study room starts without it
  (0, _.useEffect)(function() { var t = setTimeout(function() { if (window.FBGlass && window.FBGlass.on) window.FBGlass.setOn(false); }, 60); return function() { clearTimeout(t); }; }, []);
  (0, _.useEffect)(function() {
    fetch('https://minest-33761-default-rtdb.firebaseio.com/minest-live/' + code + '/host.json', { cache: 'no-store' }).then(function(r) { return r.json(); }).then(function(h) {
      if (!h || !h.board) throw new Error('no game');
      var b = h.board;
      var full = { id: 'live-' + code, title: h.title || b.title || 'Cards', labelDefinitions: [], columns: (b.columns || []).map(function(c) {
        return { id: String(c.id), title: c.title || 'List', color: c.color || '', cards: (c.cards || []).map(function(k) {
          return { id: String(k.id), title: k.title || '', desc: k.desc || '', labels: [], complete: false, mastery: 0, checklistItems: (k.checklistItems || []).map(function(it, i) { return { id: 'ci' + i, text: it.text || '', done: false }; }), stack: [], hasStack: false };
        }) };
      }) };
      var clean = (typeof sanitizeLoadedBoards === 'function' && sanitizeLoadedBoards([full])[0]) || full;
      document.title = (clean.title || 'Cards') + ' · 3D Cover';
      setBoard(clean);
    }).catch(function() { setErr('These cards could not load. Close and try again.'); });
  }, []);
  var close = function() { try { window.parent.postMessage({ type: 'minest-live:cover-close' }, '*'); } catch (e) {} };
  if (!board) return (0, P.jsx)('div', { className: 'mlk-load', children: err || 'Loading cards…' });
  return (0, P.jsxs)('div', { className: 'mlk min-h-screen w-full flex flex-col', children: [
    (0, P.jsxs)('header', { className: 'mlk-top', children: [
      (0, P.jsx)('b', { children: '📖 ' + board.title }),
      (0, P.jsx)('span', { className: 'mlk-sp' }),
      (0, P.jsx)('button', { type: 'button', className: 'mlk-btn' + (glass ? ' on' : ''), title: 'Thick glass (for looking — tap, flip and record pause while it is on)', onClick: function() { if (window.FBGlass) { window.FBGlass.toggle(); setGlass(!!window.FBGlass.on); } }, children: '🧊 Glass' }),
      (0, P.jsx)('button', { type: 'button', className: 'mlk-btn', title: 'Back to the game', onClick: close, children: '✕' })
    ] }),
    (0, P.jsx)('div', { className: 'flex-1 flex flex-col w-full relative', children: (0, P.jsx)(Oe, {
      board: board, themeMode: 'dark', searchTerm: '', selectedColFilter: 'all', onSelectColFilter: noop,
      onOpenCardModal: noop, onToggleCardComplete: noop, onToggleChecklistItem: noop, onUpdateCardMastery: noop, onUpdateCardPriority: noop,
      onOpenAIAssistant: noop, isZenMode: false, onToggleZenMode: noop, isLandscape: false, onMoveCard: noop
    }) })
  ] });
};

(0, v.createRoot)(document.getElementById('root')).render(
  (0, P.jsx)(_.StrictMode, {
    children: (0, P.jsx)(Ve, {
      children: (0, P.jsx)(window.__mnKiosk ? CoverKiosk : Be, {})""", 'Cover study room (kiosk)')
    out = once(out, '</head>', """<script>/* web31: the student 3D Cover study room */ if (/[?&]learn=/.test(location.search)) { window.__mnKiosk = true; document.documentElement.classList.add('mn-kiosk'); }</script>
<style id="mn31-kiosk">
.mn-kiosk body{background:radial-gradient(1000px 700px at 20% -10%,rgba(124,92,255,.28),transparent 60%),#0b0f1c!important;color:#f1f5f9}
.mn-kiosk #minest-mini-pet-p0,.mn-kiosk .mpet-menu,.mn-kiosk .mpet-tip,.mn-kiosk .mpet-say{display:none!important}
.mlk-top{position:sticky;top:0;z-index:40;display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(11,15,28,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.08);color:#fff;font:700 15px Inter,system-ui,sans-serif}
.mlk-top b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mlk-sp{flex:1}
.mlk-btn{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#fff;border-radius:11px;padding:8px 13px;font:700 13px Inter,system-ui,sans-serif;cursor:pointer}.mlk-btn.on{background:rgba(125,211,252,.22);border-color:rgba(125,211,252,.6)}
.mlk-load{min-height:100vh;display:grid;place-items:center;color:#c7cdf5;font:600 16px Inter,system-ui,sans-serif;background:#0b0f1c}
/* only flip, read aloud and record — the board's own tools stay closed */
.mlk .cf-study-open,.mlk [title="Deconstruct & Practice with AI Tutor"],.mlk [title="Mark as Complete"],.mlk [title^="Tap to increase mastery"],.mlk [aria-label="Pronunciation: record each card"],.mlk [title="Create new card"],.mlk .coverflow-card-item:has(.border-dashed){display:none!important}
</style>
</head>""", 'kiosk flag + CSS')
    # the top bar no longer pushes the page sideways on a narrower window (web31 added two buttons)
    out = once(out, '</head>', """<style id="mn31-topbar">html,body{overflow-x:hidden}.mn30-entries{min-width:0;max-width:30vw;overflow-x:auto;scrollbar-width:none}.mn30-entries::-webkit-scrollbar{display:none}</style>
</head>""", 'top bar fits')

    # top bar: 🎓 Teacher (host a live Arcade game, publish a course room) and 🎮 Join next to the web30 entries
    vo = "              item('vo', '🎙', 'Voice', 'Talk to Minest', function() { var V = window.MinestRealtimeVoice43; if (V) { V.open(); if (!V.active) V.start(); } })\n"
    out = once(out, vo, vo.rstrip('\n') + """,
              item('te', '🎓', 'Teacher', 'Teacher · host a live Arcade game or publish a course room', function() { window.MinestLive.openTeacher(); }),
              item('jo', '🎮', 'Join', 'Join a live Arcade game with a code', function() { window.MinestLive.openJoin(''); })
""", 'top bar: Teacher + Join')
    tail = out.rindex('</body>')
    out = out[:tail] + '\n<!-- ---- web31: Minest Live (tools/web31/minest-live.js) ---- -->\n<script>\n' + live_js() + '\n</script>\n' + out[tail:]
    out = once(out, '<title>Minest Web 30.0 · Board + 3D Cover · Learning Path</title>', '<title>Minest Web 31.0 · Board + Live Arcade Class Game</title>', 'title')
    out = once(out, 'className: "studio-version w-7 h-7 flex items-center justify-center font-bold text-xs", children: "30.0" }', 'className: "studio-version w-7 h-7 flex items-center justify-center font-bold text-xs", children: "31.0" }', 'version badge')
    return out


def play_page(out):
    """the student page: the Study Arcade (its CSS + code from web31) and Minest Live — no board app"""
    a = out.index('/* ===== Web 15.0 · Game Mode / Study Arcade ===== */')
    b = out.index('/* ===== end Study Arcade ===== */')
    css = out[a:b]
    p0 = out.index('<style id="mn30-ported">'); p1 = out.index('</style>', p0)
    ported = out[p0 + len('<style id="mn30-ported">'):p1]
    s0 = out.index('var StudyArcade = window.StudyArcade = (function() {')
    s1 = out.index('\n})();', s0) + len('\n})();')
    # Octo: the Mini Pet core (same code as the app and the Mac desktop pet) and three.js to draw it
    c0 = out.index('/* 41.377 Mini Pet P0:')
    octo = out[out.rindex('<script>', 0, c0) + len('<script>'):out.index('</script>', c0)]
    # Google sign-in for students: the page's own Firebase web config (already public in web31.0.html)
    f0 = out.index('window.__FIREBASE_CONFIG__ = {')
    fbcfg = out[f0:out.index('};', f0) + 2]
    a = (PLAY.replace('%FBCFG%', fbcfg, 1).replace('%CSS%', css + '\n' + ported, 1)
              .replace('%OCTO%', octo, 1))
    return (a
                .replace('%ARCADE%', out[s0:s1], 1)
                .replace('%LIVE%', live_js(), 1))


PLAY = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0d1020">
<title>Minest Live · Arcade</title>
<style>html,body{margin:0;background:#0d1020;color:#f4f6ff;min-height:100%;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI","PingFang SC",sans-serif}
%CSS%
</style>
</head>
<body>
<script>
/* what the Study Arcade expects from the board app around it */
var SoundEngine = { muted: false, ctx: null, init: function () { try { if (!this.ctx) { var C = window.AudioContext || window.webkitAudioContext; if (C) this.ctx = new C(); } } catch (e) {} }, play: function () {}, toggleMute: function () { this.muted = !this.muted; return this.muted; } };
window.__MINEST_LIVE_STANDALONE = true;
%FBCFG%
</script>
<script>
%ARCADE%
</script>
<script>window.minestPetAsset = function (p) { try { return new URL(p, document.baseURI).href; } catch (e) { return p; } };</script>
<script src="vendor/three.min.js"></script>
<script>if (!window.THREE) document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\\/script>');</script>
<script src="vendor/GLTFLoader.js"></script>
<script>if (!window.THREE || !window.THREE.GLTFLoader) document.write('<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"><\\/script>');</script>
<script>
%OCTO%
</script>
<script>
%LIVE%
</script>
</body>
</html>
"""


def main():
    iphone_path = web30.resolve_iphone(sys.argv[1] if len(sys.argv) > 1 else None)
    out = build(iphone_path)
    open(os.path.join(REPO, 'web31.0.html'), 'w', encoding='utf-8').write(out)
    open(os.path.join(REPO, 'web31.play.html'), 'w', encoding='utf-8').write(play_page(out))
    print('web31.0.html ← web30 (%s) + Minest Live (%d KB); web31.play.html' % (os.path.basename(iphone_path), len(out) // 1024))


if __name__ == '__main__':
    main()
