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
    # Minest Live + the Blooket look of the Arcade's games in a live game
    return open(os.path.join(HERE, 'minest-live.js'), encoding='utf-8').read() + '\n' + open(os.path.join(HERE, 'arcade-toon.js'), encoding='utf-8').read()


def arcade_patches(out):
    """The Study Arcade / 3D Cover changes Minest Live needs (also for the iPhone / iPad pages: tools/mobile/live_mobile.py)."""
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
    # Students: no read-aloud and no recording on cards (window.__mnNoVoice is set by the play page, the study
    # room and a student's live session) — the Arcade's auto read-aloud and the 3D Cover's tap-to-read / hold-to-record
    out = once(out, """    say: function(text) {
      if (!arRead.on || !window.speechSynthesis) return;""", """    say: function(text) {
      if (window.__mnNoVoice) return;   // web31: students
      if (!arRead.on || !window.speechSynthesis) return;""", 'Arcade: no read-aloud for students')
    out = once(out, """    button: function(parent, current) {
      var b = el('button', 'ar-btn ar-read' + (arRead.on ? ' on' : ''), parent);""", """    button: function(parent, current) {
      if (window.__mnNoVoice) return null;   // web31: students
      var b = el('button', 'ar-btn ar-read' + (arRead.on ? ' on' : ''), parent);""", 'Arcade: no read-aloud button for students')
    out = once(out, """  var coverSpeak = function(card, el) {""", """  var coverSpeak = function(card, el) {
    if (window.__mnNoVoice) return;   // web31: students""", '3D Cover: no tap-to-read for students')
    out = once(out, """        if (window.MinestPron && window.MinestPron.openCard) window.MinestPron.openCard(card, el, { hold: true });""", """        if (!window.__mnNoVoice && window.MinestPron && window.MinestPron.openCard) window.MinestPron.openCard(card, el, { hold: true });""", '3D Cover: no hold-to-record for students')
    return card_back(no_board_preview(toon_patches(out)))


def no_board_preview(out):
    """Wallpaper & Tint Studio (also opened from Settings): no "Live Board Preview" mock board — only the
    Reset to Default Theme link stays, on the right."""
    out = once(out, """              (0, P.jsx)('span', { className: "text-xs font-bold uppercase tracking-wider opacity-70", children: "Live Board Preview" }),""",
               """              (0, P.jsx)('span', {}),   // web31: no Live Board Preview""", 'no board preview: label')
    out = once(out, """          (0, P.jsxs)('div', {
            className: "h-32 w-full rounded-2xl overflow-hidden relative border shadow-inner transition-all flex flex-col p-3 " +""",
               """          false && (0, P.jsxs)('div', {   // web31: no Live Board Preview
            className: "h-32 w-full rounded-2xl overflow-hidden relative border shadow-inner transition-all flex flex-col p-3 " +""", 'no board preview: board')
    return out


def card_back(out):
    """A flipped card's back: just the meaning (no "Meaning" label, no ↩ Back button — a tap flips it back)."""
    if "title: 'Flip back'," not in out:   # the desktop page has no such card back
        return out
    out = once(out, """                                      (0, P.jsxs)('div', {
                                        className: "text-[10px] font-semibold uppercase tracking-wider opacity-60 mb-1 flex items-center justify-between",
                                        children: [
                                          (0, P.jsx)('span', { children: "Meaning" }),""", """                                      card.phonetic && (0, P.jsxs)('div', {   // web31: no "Meaning" label
                                        className: "text-[10px] font-semibold uppercase tracking-wider opacity-60 mb-1 flex items-center justify-between",
                                        children: [
                                          (0, P.jsx)('span', {}),""", 'card back: no Meaning')
    out = once(out, """                                      (0, P.jsxs)('button', {
                                        type: 'button',
                                        title: 'Flip back',""", """                                      (0, P.jsx)('span', {}),   // web31: no Back button
                                      false && (0, P.jsxs)('button', {
                                        type: 'button',
                                        title: 'Flip back',""", 'card back: no Back')
    return out


def knowledge_patches(out):
    """Minest Knowledge (Contents): the synced `knowledge` field rides in the cloud doc beside `learning`
    (tools/knowledge/contents.js keeps it outside the boards, so the boards' field lists never drop it)."""
    if 'window.MinestKnowledge._cloud' in out:
        return out
    out = once(out, "try { if (window.MinestLearn && window.MinestLearn._cloud) base.learning = JSON.parse(JSON.stringify(window.MinestLearn._cloud())); } catch (e) {}",
               "try { if (window.MinestLearn && window.MinestLearn._cloud) base.learning = JSON.parse(JSON.stringify(window.MinestLearn._cloud())); } catch (e) {}\n"
               "  try { if (window.MinestKnowledge && window.MinestKnowledge._cloud) base.knowledge = JSON.parse(JSON.stringify(window.MinestKnowledge._cloud())); } catch (e) {}   // Minest Knowledge", 'knowledge: payload')
    tail = "window.MinestLearn._mergeCloud(data.learning); } catch (e) {}"
    n = out.count(tail)
    if n < 1:
        raise SystemExit('knowledge: no learning merge found')
    out = out.replace(tail, tail + " try { if (data && data.knowledge && window.MinestKnowledge) window.MinestKnowledge._mergeCloud(data.knowledge); } catch (e) {}")
    # Endless (Phase 2) edits a board in place and opens a stacked card's details on its own board
    out = once(out, "      rateCard: function(cardId, level) {",
               "      // Minest Knowledge · Endless: change one board; open a card's (or a stacked card's) details on its board\n"
               "      updateBoard: function(boardId, fn) { setBoards(function(list) { return list.map(function(b) { return b.id === boardId ? fn(b) : b; }); }); },\n"
               "      removeBoard: function(boardId) { setBoards(function(list) { var left = list.filter(function(b) { return b.id !== boardId; }); return left.length ? left : list; }); },\n"
               "      addBoard: function(board, select) { setBoards(function(list) { return list.concat([board]); }); if (select) setTimeout(function() { setActiveBoardId(board.id); }, 30); },\n"
               "      openCardIn: function(boardId, colId, cardId) { if (boardId) setActiveBoardId(boardId); setTimeout(function() { setCardModal({ isOpen: true, columnId: colId, cardId: cardId }); }, 60); },\n"
               "      rateCard: function(cardId, level) {", 'knowledge: updateBoard / openCardIn')
    # Stacks as on web31.0 (the Apple notification look): an old iPhone portrait rule hid the folded deck plates and the
    # open group's "N cards · Show less · ✕" header everywhere — keep it only for Clear mode
    if '/* Global removal of card folding / stacking / collapsing controls */\n.card-stack-deck,' in out:
        out = out.replace('/* Global removal of card folding / stacking / collapsing controls */\n.card-stack-deck,\n.stack-chevron-pill,\n.ios-show-less-pill,\n.ios-close-circle-btn,\n.ios-group-header,\n.ios-folded-stack-badge,\n.liquid-glass-deck-step1,\n.liquid-glass-deck-step2 {',
                          '/* Card folding / stacking controls: hidden in Clear mode only (Minest web31: stacks as on the web) */\n.clear-mode .card-stack-deck,\n.clear-mode .stack-chevron-pill,\n.clear-mode .ios-show-less-pill,\n.clear-mode .ios-close-circle-btn,\n.clear-mode .ios-group-header,\n.clear-mode .ios-folded-stack-badge,\n.clear-mode .liquid-glass-deck-step1,\n.clear-mode .liquid-glass-deck-step2 {', 1)
    # … and the stacks themselves as on web31.0: its group header (a "N cards" chip, Show less, ✕; tap to fold) and its
    # stack styles (tools/mobile/stacks-web31*, taken from web31.0.html), placed last so they win
    hdr_old_a = out.find('                          // iOS Notification Center Group Header (Expanded Stack)')
    if hdr_old_a >= 0 and 'ios-group-header-left' not in out[hdr_old_a:hdr_old_a + 6000]:
        hdr_old_b = out.index('                          // Base Card Front', hdr_old_a)
        out = out[:hdr_old_a] + open(os.path.join(REPO, 'tools', 'mobile', 'stacks-web31-header.jsx'), encoding='utf-8').read() + out[hdr_old_b:]
    if 'id="mn-stacks-web31"' not in out:
        css = open(os.path.join(REPO, 'tools', 'mobile', 'stacks-web31.css'), encoding='utf-8').read()
        k = out.rfind('</body>')
        out = out[:k] + '<style id="mn-stacks-web31">\n' + css + '</style>\n' + out[k:]
    # Show less / ✕ also fold a stack kept open in the card itself (isStackExpanded, e.g. left by an older jump)
    out = once(out, """  var toggleStackExpand = function(colId, cardId) {
    setExpandedStacks(function(prev) {""", """  var toggleStackExpand = function(colId, cardId) {
    try {
      var kept = null, ab = window.MinestAI && window.MinestAI.board && window.MinestAI.board();
      ((ab && ab.columns) || []).some(function(cl) { return (cl.cards || []).some(function(x) { if (x.id === cardId) { kept = x; return true; } return false; }); });
      if (kept && kept.isStackExpanded && window.MinestAI.patchCard) {
        window.MinestAI.patchCard(cardId, { isStackExpanded: false });
        setExpandedStacks(function(prev) { var n = Object.assign({}, prev); delete n[cardId]; return n; });
        SoundEngine.play('click');
        return;
      }
    } catch (e) {}
    setExpandedStacks(function(prev) {""", 'stacks: fold a kept-open stack')
    # the pinned Contents column is a resting place for the lane like any list: the snap-back after a swipe and both
    # swipe pagers count it (they listed only real lists and "Add list", so a swipe onto Contents was pulled back)
    out = out.replace("'.kanban-column-wrapper, .board-add-list-btn, .mn-addlist'", "'.mn-tocol, .kanban-column-wrapper, .board-add-list-btn, .mn-addlist'")
    out = out.replace("'.kanban-column-wrapper[data-col-id], .board-add-list-btn, .mn-addlist'", "'.mn-tocol, .kanban-column-wrapper[data-col-id], .board-add-list-btn, .mn-addlist'")
    # Portal: tell the knowledge views when a card's details open (marks it "viewed" — never mastered)
    out = once(out, "  var setCardModal = cardModalState[1];\n",
               "  var setCardModal = cardModalState[1];\n"
               "  (0, _.useEffect)(function() { if (cardModal.isOpen && cardModal.cardId) { try { window.dispatchEvent(new CustomEvent('minest:card-open', { detail: { cardId: cardModal.cardId, columnId: cardModal.columnId } })); } catch (e) {} } }, [cardModal.isOpen, cardModal.cardId]);   // Minest Knowledge\n", 'knowledge: card-open event')
    return out


def knowledge_js():
    # Phase 1 Contents, Phase 2 Endless, Phase 3 Knowledge Map, Phase 4 Timeline (Contents first: the others use its MinestKnowledge)
    import json, glob
    samples = {}
    for f in sorted(glob.glob(os.path.join(REPO, 'tools', 'knowledge', 'samples', '*.json'))):
        samples[os.path.splitext(os.path.basename(f))[0]] = json.load(open(f, encoding='utf-8'))
    js = 'window.__MINEST_KN_SAMPLES = ' + json.dumps(samples, ensure_ascii=False) + ';\n'
    # List of Mine: the built-in worldview templates (tools/knowledge/templates/*.json)
    worlds = {}
    for f in sorted(glob.glob(os.path.join(REPO, 'tools', 'knowledge', 'templates', '*.json'))):
        t = json.load(open(f, encoding='utf-8')); worlds[t['id']] = t
    js += 'window.__MINEST_WORLD_TEMPLATES = ' + json.dumps(worlds, ensure_ascii=False) + ';\n'
    # Phases 1–4, then JSON import (5–6), the Learning Map, and the one Knowledge Dock icon
    return js + '\n'.join(open(os.path.join(REPO, 'tools', 'knowledge', f), encoding='utf-8').read() for f in ('contents.js', 'look.js', 'kedit.js', 'endless.js', 'map.js', 'timeline.js', 'kjson.js', 'learnmap.js', 'wiki.js', 'world.js', 'hub.js'))


def toon_patches(out):
    """The Arcade's canvas games in Minest Live (a live game, Solo play): Blooket-style when window.__arToon is on —
    a cartoon background from window.__arToonBg (tools/web31/minest-live.js), solid fruit and rocks with a dark outline,
    and the answers on white plates in dark text. Smash It is left as it is (Minest Live never turns __arToon on for it).
    Also for web31.1.html / web31.1.play.html (tools/web31/toon_sync.py)."""
    if 'window.__arToonBg' in out:
        return out
    # the canvas games read their font once: Nunito in a live game
    n = out.count("    var FONT = (getComputedStyle(root).fontFamily || 'system-ui, sans-serif');")
    if n != 4:
        raise SystemExit('toon: expected 4 canvas fonts, found %d' % n)
    out = out.replace("    var FONT = (getComputedStyle(root).fontFamily || 'system-ui, sans-serif');",
                      "    var FONT = window.__arToon ? \"'Nunito', 'DM Sans', system-ui, sans-serif\" : (getComputedStyle(root).fontFamily || 'system-ui, sans-serif');   // web31: Minest Live")
    # backgrounds
    out = once(out, """    var drawBg = function(dt) {
      g.fillStyle = 'rgba(4,8,22,0.72)'; g.fillRect(0, 0, W, H);""", """    var drawBg = function(dt) {
      if (window.__arToon && window.__arToonBg && window.__arToonBg(g, W, H, clock, 'slice')) return;   // web31: Minest Live
      g.fillStyle = 'rgba(4,8,22,0.72)'; g.fillRect(0, 0, W, H);""", 'toon: slice bg')
    out = once(out, """    var drawSpace = function(dt) {
      g.fillStyle = 'rgba(2,5,16,0.78)'; g.fillRect(0, 0, W, H);""", """    var drawSpace = function(dt) {
      if (window.__arToon && window.__arToonBg && window.__arToonBg(g, W, H, clock, 'blast', playTop)) return;   // web31: Minest Live
      g.fillStyle = 'rgba(2,5,16,0.78)'; g.fillRect(0, 0, W, H);""", 'toon: blast bg')
    out = once(out, """    var drawBg = function(dt) {
      g.fillStyle = 'rgba(4,8,22,0.7)'; g.fillRect(0, 0, W, H);""", """    var drawBg = function(dt) {
      if (window.__arToon && window.__arToonBg && window.__arToonBg(g, W, H, clock, 'whack', (holes.length ? holes[0].cy - holes[0].rx * 1.6 : H * 0.35) + 30)) return;   // web31: Minest Live
      g.fillStyle = 'rgba(4,8,22,0.7)'; g.fillRect(0, 0, W, H);""", 'toon: whack bg')
    # Glass Fruit: a solid fruit with a dark outline, the word on a white plate
    out = once(out, """      g.fillStyle = bg; g.fill();
      g.shadowBlur = 0;
      g.save(); fruitPath(kind, R); g.clip();""", """      g.fillStyle = bg; g.fill();
      if (window.__arToon) { g.fillStyle = col(tint, 1); g.fill(); }   // web31: Minest Live
      g.shadowBlur = 0;
      g.save(); fruitPath(kind, R); g.clip();""", 'toon: fruit body')
    out = once(out, "g.strokeStyle = eg; g.lineWidth = 2.2; g.stroke();",
               "if (window.__arToon) { g.strokeStyle = '#2e1065'; g.lineWidth = 3.5; } else { g.strokeStyle = eg; g.lineWidth = 2.2; } g.stroke();", 'toon: fruit rim')
    out = once(out, """        g.fillStyle = 'rgba(2,6,23,0.36)'; g.fill();
        g.fillStyle = '#fff'; g.font = '800 ' + f.px + 'px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
        if (tier === 0) {""", """        var TN = window.__arToon;   // web31: Minest Live
        g.fillStyle = TN ? '#fff' : 'rgba(2,6,23,0.36)'; g.fill();
        if (TN) { g.strokeStyle = '#2e1065'; g.lineWidth = 2.5; g.stroke(); }
        g.fillStyle = TN ? '#2e1065' : '#fff'; g.font = (TN ? '900 ' : '800 ') + f.px + 'px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
        if (tier === 0 && !TN) {""", 'toon: fruit plate')
    # Glass Blast: solid rocks, white plates
    out = once(out, """      g.fillStyle = bg; g.fill(); g.shadowBlur = 0;
      // crystal facets""", """      g.fillStyle = bg; g.fill(); g.shadowBlur = 0;
      if (window.__arToon) { g.fillStyle = col(rk.col, 1); g.fill(); g.strokeStyle = '#2e1065'; g.lineWidth = 4; g.stroke(); }   // web31: Minest Live
      // crystal facets""", 'toon: rock body')
    out = once(out, """      g.fillStyle = bad ? 'rgba(127,29,29,0.72)' : 'rgba(2,6,23,0.6)'; g.fill();
      g.strokeStyle = bad ? 'rgba(248,113,113,0.8)' : 'rgba(255,255,255,0.35)'; g.lineWidth = 1; g.stroke();
      g.fillStyle = '#fff'; g.font = '800 ' + Math.round(rk.px * sc) + 'px ' + FONT;""", """      var TN = window.__arToon;   // web31: Minest Live
      g.fillStyle = TN ? (bad ? '#fee2e2' : '#fff') : (bad ? 'rgba(127,29,29,0.72)' : 'rgba(2,6,23,0.6)'); g.fill();
      g.strokeStyle = TN ? (bad ? '#dc2626' : '#2e1065') : (bad ? 'rgba(248,113,113,0.8)' : 'rgba(255,255,255,0.35)'); g.lineWidth = TN ? 2.5 : 1; g.stroke();
      g.fillStyle = TN ? '#2e1065' : '#fff'; g.font = (TN ? '900 ' : '800 ') + Math.round(rk.px * sc) + 'px ' + FONT;""", 'toon: rock plate')
    # Whack-a-Term: a solid mole with a dark outline, the sign in white
    out = once(out, "        g.fillStyle = col(tint, 0.5); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1; g.stroke();",
               "        if (window.__arToon) { g.fillStyle = col(tint, 1); g.fill(); g.strokeStyle = '#2e1065'; g.lineWidth = 2.5; } else { g.fillStyle = col(tint, 0.5); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1; } g.stroke();   // web31: Minest Live",
               'toon: mole ears')
    out = once(out, """      g.fillStyle = bg; g.fill();
      g.shadowBlur = 0;
      g.strokeStyle = bad ? 'rgba(248,113,113,0.95)' : 'rgba(255,255,255,0.7)'; g.lineWidth = bad ? 2.5 : 1.5; g.stroke();
      // glass: a highlight""", """      g.fillStyle = bg; g.fill();
      if (window.__arToon) { g.fillStyle = col(tint, 1); g.fill(); }   // web31: Minest Live
      g.shadowBlur = 0;
      g.strokeStyle = bad ? 'rgba(248,113,113,0.95)' : (window.__arToon ? '#2e1065' : 'rgba(255,255,255,0.7)'); g.lineWidth = window.__arToon ? 3.5 : (bad ? 2.5 : 1.5); g.stroke();
      // glass: a highlight""", 'toon: mole body')
    out = once(out, "      g.fillStyle = col(light(tint, 0.6), 0.22); g.fill();\n      // the face",
               "      g.fillStyle = col(light(tint, 0.6), window.__arToon ? 0.6 : 0.22); g.fill();\n      // the face", 'toon: mole belly')
    # Whack-a-Term: the sign in white
    out = once(out, """      g.fillStyle = m.reveal ? 'rgba(6,78,59,0.78)' : 'rgba(15,23,42,0.72)'; g.fill();
      g.strokeStyle = m.reveal || m.hint ? 'rgba(52,211,153,' + (0.7 + 0.3 * Math.sin(clock * 7)).toFixed(3) + ')' : (bad ? 'rgba(248,113,113,0.95)' : 'rgba(255,255,255,0.7)');
      g.lineWidth = m.reveal || m.hint || bad ? 2.2 : 1.3; g.stroke();
      g.fillStyle = '#fff'; g.font = '800 ' + m.px + 'px ' + FONT;""", """      var TN = window.__arToon;   // web31: Minest Live
      g.fillStyle = TN ? (m.reveal ? '#bbf7d0' : '#fff') : (m.reveal ? 'rgba(6,78,59,0.78)' : 'rgba(15,23,42,0.72)'); g.fill();
      g.strokeStyle = m.reveal || m.hint ? 'rgba(' + (TN ? '22,163,74,' : '52,211,153,') + (0.7 + 0.3 * Math.sin(clock * 7)).toFixed(3) + ')' : (bad ? (TN ? '#dc2626' : 'rgba(248,113,113,0.95)') : (TN ? '#2e1065' : 'rgba(255,255,255,0.7)'));
      g.lineWidth = TN ? 3 : (m.reveal || m.hint || bad ? 2.2 : 1.3); g.stroke();
      g.fillStyle = TN ? '#2e1065' : '#fff'; g.font = (TN ? '900 ' : '800 ') + m.px + 'px ' + FONT;""", 'toon: mole sign')
    return out


def build(iphone_path):
    out = arcade_patches(web30.build(iphone_path))
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
    out = once(out, '</head>', """<script>/* web31: the student 3D Cover study room */ if (/[?&]learn=/.test(location.search)) { window.__mnKiosk = true; window.__mnNoVoice = true; document.documentElement.classList.add('mn-kiosk'); }</script>
<style id="mn31-kiosk">
.mn-kiosk body{background:radial-gradient(1000px 700px at 20% -10%,rgba(124,92,255,.28),transparent 60%),#0b0f1c!important;color:#f1f5f9}
.mn-kiosk #minest-mini-pet-p0,.mn-kiosk .mpet-menu,.mn-kiosk .mpet-tip,.mn-kiosk .mpet-say{display:none!important}
.mlk-top{position:sticky;top:0;z-index:40;display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(11,15,28,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.08);color:#fff;font:700 15px Inter,system-ui,sans-serif}
.mlk-top b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mlk-sp{flex:1}
.mlk-btn{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#fff;border-radius:11px;padding:8px 13px;font:700 13px Inter,system-ui,sans-serif;cursor:pointer}.mlk-btn.on{background:rgba(125,211,252,.22);border-color:rgba(125,211,252,.6)}
.mlk-load{min-height:100vh;display:grid;place-items:center;color:#c7cdf5;font:600 16px Inter,system-ui,sans-serif;background:#0b0f1c}
/* only flip, read aloud and record — the board's own tools stay closed */
.mlk .cf-study-open,.mlk [title="Deconstruct & Practice with AI Tutor"],.mlk [title="Mark as Complete"],.mlk [title^="Tap to increase mastery"],.mlk [aria-label="Pronunciation: record each card"],.mlk [title="Create new card"],.mlk .cf-study-speak,.mlk .cf-study-rec,.mlk .coverflow-card-item:has(.border-dashed){display:none!important}
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
    # Minest Knowledge · Contents (tools/knowledge/contents.js)
    out = knowledge_patches(out)
    tail = out.rindex('</body>')
    out = out[:tail] + '<script>\n' + knowledge_js() + '\n</script>\n' + out[tail:]
    # the top bar, laid out like iPhone 45.0 (switcher left, the rest right, ≡ column) + Teacher / Join in the Arcade bar
    tail = out.rindex('</body>')
    out = out[:tail] + ''.join('<script>\n' + open(os.path.join(HERE, f), encoding='utf-8').read() + '\n</script>\n' for f in ('dock.js', 'topbar.js', 'settings.js')) + out[tail:]
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
window.__mnNoVoice = true;   // students: no read-aloud, no recording
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
    if '<!-- ---- Minest Live' in open(iphone_path, encoding='utf-8').read():
        raise SystemExit('%s already has Minest Live (tools/mobile/live_mobile.py) — name the page it came from, e.g. iPhone46.3.html' % os.path.basename(iphone_path))
    out = build(iphone_path)
    open(os.path.join(REPO, 'web31.0.html'), 'w', encoding='utf-8').write(out)
    open(os.path.join(REPO, 'web31.play.html'), 'w', encoding='utf-8').write(play_page(out))
    print('web31.0.html ← web30 (%s) + Minest Live (%d KB); web31.play.html' % (os.path.basename(iphone_path), len(out) // 1024))


if __name__ == '__main__':
    main()
