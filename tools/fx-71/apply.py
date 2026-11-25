#!/usr/bin/env python3
"""Minest · FX 71/72 — Light FX (aurora, meteor, disco, gallery) and board Card FX (holo, float, wave).

    python3 tools/fx-71/apply.py           # patches the phone pages (safe to run again)
    python3 tools/fx-71/apply.py --check   # exit 1 if a page lacks the current version

light-modes.js goes inside the Light FX engine (it draws on the engine's canvas); card-fx.js and fx.css go
before </body>. The rest is anchored edits: the mode lists, the engine's hooks, the board's card-mode cycle.
iPhoneDuo70.html is built from iphone.html: run tools/duo-70/build.py afterwards.
"""
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PAGES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
BLOCKS = [('style', 'mn-fx71-css', 'fx.css'), ('script', 'mn-fx71-cardfx-js', 'card-fx.js')]
ENGINE_START = '  // ---------------------------------------------------------------- 71: aurora'
ENGINE_END = '  function drawHint(c) {\n'

MODES_5 = "['none', 'lasers', 'firework', 'spotlight', 'neon']"
MODES_8 = "['none', 'lasers', 'firework', 'spotlight', 'neon', 'aurora', 'meteor', 'disco']"
NEW_MODES = "['none', 'lasers', 'firework', 'spotlight', 'neon', 'aurora', 'meteor', 'disco', 'gallery']"

# Each entry: (list_of_accepted_olds, new, count_requirement)
EDITS = [
    ([MODES_8, MODES_5], NEW_MODES, None),
    (["var LABEL = { none: 'Light FX', lasers: 'lasers', firework: 'firework', spotlight: 'spotlight', neon: 'neon', aurora: 'aurora', meteor: 'meteor', disco: 'disco' };",
      "var LABEL = { none: 'Light FX', lasers: 'lasers', firework: 'firework', spotlight: 'spotlight', neon: 'neon' };"],
     "var LABEL = { none: 'Light FX', lasers: 'lasers', firework: 'firework', spotlight: 'spotlight', neon: 'neon', aurora: 'aurora', meteor: 'meteor', disco: 'disco', gallery: 'gallery' };", 1),
    (["var GLYPH = { none: '✦', lasers: '⟡', firework: '✺', spotlight: '◎', neon: '◈', aurora: '≈', meteor: '☄', disco: '❖' };",
      "var GLYPH = { none: '✦', lasers: '⟡', firework: '✺', spotlight: '◎', neon: '◈' };"],
     "var GLYPH = { none: '✦', lasers: '⟡', firework: '✺', spotlight: '◎', neon: '◈', aurora: '≈', meteor: '☄', disco: '❖', gallery: '◒' };", 1),
    (["      else if (mode === 'firework') drawFireworks(ctx, dt);\n"
      "      else if (mode === 'aurora') drawAurora(ctx, dt);\n"
      "      else if (mode === 'meteor') drawMeteor(ctx, dt);\n"
      "      else if (mode === 'disco') drawDisco(ctx, dt);\n",
      "      else if (mode === 'firework') drawFireworks(ctx, dt);\n"],
     "      else if (mode === 'firework') drawFireworks(ctx, dt);\n"
     "      else if (mode === 'aurora') drawAurora(ctx, dt);\n"
     "      else if (mode === 'meteor') drawMeteor(ctx, dt);\n"
     "      else if (mode === 'disco') drawDisco(ctx, dt);\n"
     "      else if (mode === 'gallery') drawGallery(ctx, dt);\n", 1),
    (["    if (intro && intro.kind === 'love' && intro.extra.pos) { var hp = intro.extra.pos;"],
     "    if (ambient) xfxLights(Ls);\n"
     "    if (intro && intro.kind === 'love' && intro.extra.pos) { var hp = intro.extra.pos;", 1),
    (["    clearTrail();\n    xfxReset();\n    hintUntil = 0;\n    if (m !== 'spotlight' && m !== 'lasers')",
      "    clearTrail();\n    hintUntil = 0;\n    if (m !== 'spotlight' && m !== 'lasers')"],
     "    clearTrail();\n    xfxReset();\n    hintUntil = 0;\n    if (m !== 'spotlight' && m !== 'lasers')", 1),
    # Clean up gallery DOM when stage turns off / idle
    (["      lastT = 0; placeHandle(); clearAllLit(); return;"],
     "      lastT = 0; placeHandle(); clearAllLit(); xfxReset(); return;", 1),
    # Whitelist interactive gallery UI controls (.fbfx-gal-ui) from double-tap & click-outside auto-exit
    (['.fbfx-btn, .fbfx-neon-ctl\')) { dtap.t = 0; return; }'],
     '.fbfx-btn, .fbfx-neon-ctl, .fbfx-gal-ui\')) { dtap.t = 0; return; }', 1),
    (['if (b.closest(\'.dock-fx-tab, .bar-fx-btn, .fbfx-btn, .fbfx-neon-ctl,'],
     'if (b.closest(\'.dock-fx-tab, .bar-fx-btn, .fbfx-btn, .fbfx-neon-ctl, .fbfx-gal-ui,', 1),
    # a tap on empty space: a rocket (firework) or a shooting star (meteor)
    (["    if (!stageOn || mode !== 'firework' || !W) return;"],
     "    if (!stageOn || (mode !== 'firework' && mode !== 'meteor') || !W) return;", 1),
    (["    launch(ex, ey, clamp(ex + rnd(-40, 40), 10, W - 10));\n    kick();"],
     "    if (mode === 'meteor') meteorTo(ex, ey); else launch(ex, ey, clamp(ex + rnd(-40, 40), 10, W - 10));\n    kick();", 1),
    # the buttons' hints
    (["' — click to cycle (off ➔ lasers ➔ firework ➔ spotlight ➔ neon ➔ aurora ➔ meteor ➔ disco) · Shift+click",
      "' — click to cycle (off ➔ lasers ➔ firework ➔ spotlight) · Shift+click"],
     "' — click to cycle (off ➔ lasers ➔ firework ➔ spotlight ➔ neon ➔ aurora ➔ meteor ➔ disco ➔ gallery) · Shift+click", 1),
    (['" — tap to cycle (off → lasers → firework → spotlight → neon → aurora → meteor → disco)",',
      '" — tap to cycle (off → lasers → firework → spotlight)",'],
     '" — tap to cycle (off → lasers → firework → spotlight → neon → aurora → meteor → disco → gallery)",', 1),
    (['title: "Light FX — tap to cycle (off → lasers → firework → spotlight → neon → aurora → meteor → disco)",',
      'title: "Light FX — tap to cycle (off → lasers → firework → spotlight → neon)",'],
     'title: "Light FX — tap to cycle (off → lasers → firework → spotlight → neon → aurora → meteor → disco → gallery)",', 1),
    # the 3D Cover's bar
    (["spotlight: '聚光灯', neon: '霓虹', aurora: '极光', meteor: '流星', disco: '迪斯科' })[nx]",
      "spotlight: '聚光灯', neon: '霓虹' })[nx]"],
     "spotlight: '聚光灯', neon: '霓虹', aurora: '极光', meteor: '流星', disco: '迪斯科', gallery: '画廊' })[nx]", None),
    # the Mini Pet has a word for each room
    (["    else if (fxMode === 'disco') { p.play('bounce'); p.say('Disco time!'); }\n",
      "    else if (fxMode === 'neon') { p.play('happy'); p.say('So glowy ✨'); }\n"],
     "    else if (fxMode === 'neon') { p.play('happy'); p.say('So glowy ✨'); }\n"
     "    else if (fxMode === 'aurora') { p.play('look'); p.lookAt(innerWidth / 2, innerHeight * .15, 2400); p.say('Northern lights…'); }\n"
     "    else if (fxMode === 'meteor') { p.play('look'); p.lookAt(innerWidth / 2, innerHeight * .2, 2200); p.say('Make a wish!'); }\n"
     "    else if (fxMode === 'disco') { p.play('bounce'); p.say('Disco time!'); }\n"
     "    else if (fxMode === 'gallery') { p.play('look'); p.lookAt(innerWidth * .16, innerHeight * .82, 2400); p.say('Pepper wanted tuna! 🔦'); }\n", 1),

    # ---- the board's card-mode switch
    (["    var next = boardCardMode === 'none' ? 'liq' : (boardCardMode === 'liq' ? 'smash' : (boardCardMode === 'smash' ? 'ink' : (boardCardMode === 'ink' ? 'ripple' : (boardCardMode === 'ripple' ? 'list-wallet' : 'none'))));"],
     "    var CYCLE = ['none', 'liq', 'smash', 'ink', 'ripple', 'holo', 'float', 'wave', 'list-wallet'];\n"
     "    var next = CYCLE[(CYCLE.indexOf(boardCardMode) + 1) % CYCLE.length];", 1),
    (["      'list-wallet': '▣', ripple: '≋'\n"], "      'list-wallet': '▣', ripple: '≋', holo: '◇', float: '⇡', wave: '∿'\n", 1),
    (["    var LABEL = { none: 'Card FX', liq: 'liq', smash: 'smash', ink: 'ink', ripple: 'ripple', 'list-wallet': 'List Wallet' };"],
     "    var LABEL = { none: 'Card FX', liq: 'liq', smash: 'smash', ink: 'ink', ripple: 'ripple', holo: 'holo', float: 'float', wave: 'wave', 'list-wallet': 'List Wallet' };", 1),
    (['    var modeTitle = m === \'liq\' ? "liq (Liquid Glass cards with ripples)" : '],
     '    var modeTitle = m === \'holo\' ? "holo (Holographic foil; the card under your finger tilts)" : m === \'float\' ? "float (Cards hover)" : m === \'wave\' ? "wave (A wave of light crosses the lists; tap a card to send one)" : m === \'liq\' ? "liq (Liquid Glass cards with ripples)" : ', 1),
    (['(Card FX ➔ liq ➔ smash ➔ ink ➔ ripple ➔ List Wallet)";'], '(Card FX ➔ liq ➔ smash ➔ ink ➔ ripple ➔ holo ➔ float ➔ wave ➔ List Wallet)";', 1),
    (["    document.documentElement.classList.toggle('fb-cardfx-on', m !== 'none');\n"],
     "    document.documentElement.classList.toggle('fb-cardfx-on', m !== 'none');\n"
     "    try { document.documentElement.setAttribute('data-cfx', m); window.dispatchEvent(new Event('minest:cardfx')); } catch (err) {}\n", 1),
    (["  (0, _.useEffect)(function() { return function() { document.documentElement.classList.remove('fb-cardfx-on'); }; }, []);"],
     "  (0, _.useEffect)(function() { return function() { document.documentElement.classList.remove('fb-cardfx-on'); try { document.documentElement.removeAttribute('data-cfx'); window.dispatchEvent(new Event('minest:cardfx')); } catch (err) {} }; }, []);", 1),
]


def read(name):
    return (HERE / name).read_text(encoding='utf-8')


def block():
    out = ''
    for tag, id_, f in BLOCKS:
        src = read(f).strip('\n')
        if ('</' + tag) in src.lower():
            raise SystemExit('fx-71: %s must not contain </%s' % (f, tag))
        out += '<%s id="%s">\n%s\n</%s>\n' % (tag, id_, src, tag)
    return out


def patch(html, rel):
    """Returns the patched page, or raises ValueError naming the anchor that is not there."""
    engine = read('light-modes.js')
    if ENGINE_START in html:      # an older copy of the engine block goes
        a = html.index(ENGINE_START)
        b = html.index(ENGINE_END, a)
        html = html[:a] + html[b:]
    if html.count(ENGINE_END) != 1:
        raise ValueError('the Light FX engine (drawHint) is not there once')
    html = html.replace(ENGINE_END, engine + ENGINE_END, 1)

    # Collapse existing 4-line Mini Pet block if upgrading from 8-mode fx-71
    old_pet_block = (
        "    else if (fxMode === 'neon') { p.play('happy'); p.say('So glowy ✨'); }\n"
        "    else if (fxMode === 'aurora') { p.play('look'); p.lookAt(innerWidth / 2, innerHeight * .15, 2400); p.say('Northern lights…'); }\n"
        "    else if (fxMode === 'meteor') { p.play('look'); p.lookAt(innerWidth / 2, innerHeight * .2, 2200); p.say('Make a wish!'); }\n"
        "    else if (fxMode === 'disco') { p.play('bounce'); p.say('Disco time!'); }\n"
    )
    new_pet_block = old_pet_block + "    else if (fxMode === 'gallery') { p.play('look'); p.lookAt(innerWidth * .16, innerHeight * .82, 2400); p.say('Pepper wanted tuna! 🔦'); }\n"
    if new_pet_block not in html and old_pet_block in html:
        html = html.replace(old_pet_block, new_pet_block, 1)

    for olds, new, n in EDITS:
        if new in html:
            continue
        matched = False
        for old in olds:
            have = html.count(old)
            if have > 0 and (n is None or have == n):
                html = html.replace(old, new)
                matched = True
                break
        if not matched:
            raise ValueError('anchor not matched for: %r' % (olds[0][:70],))
    for tag, id_, f in BLOCKS:
        html = re.sub(r'<%s id="%s">\n.*?\n</%s>\n' % (tag, id_, tag), '', html, count=1, flags=re.S)
    end = html.find('<script id="mn-v2-routes">')
    if end < 0:
        end = html.rfind('</body>')
    if end < 0:
        raise ValueError('no </body>')
    return html[:end] + block() + html[end:]


def main():
    check = '--check' in sys.argv
    bad = []
    for rel in PAGES:
        p = ROOT / rel
        if not p.exists():
            continue
        html = p.read_text(encoding='utf-8')
        try:
            out = patch(html, rel)
        except ValueError as e:
            print('fx-71: %s skipped — %s' % (rel, e))
            bad.append(rel)
            continue
        if out == html:
            print('fx-71: %s is up to date' % rel)
        elif check:
            print('fx-71: %s is not current' % rel)
            bad.append(rel)
        else:
            p.write_text(out, encoding='utf-8')
            print('fx-71: patched %s' % rel)
    # the 3D Cover's bar is kept in tools/cover-modes too: its source carries the same labels
    cm = ROOT / 'tools/cover-modes/cover-modes.js'
    if cm.exists() and not check:
        src = cm.read_text(encoding='utf-8')
        new = src
        for m_old in (MODES_8, MODES_5):
            if NEW_MODES not in new and m_old in new:
                new = new.replace(m_old, NEW_MODES)
        for l_old in ("spotlight: '聚光灯', neon: '霓虹', aurora: '极光', meteor: '流星', disco: '迪斯科' })[nx]",
                      "spotlight: '聚光灯', neon: '霓虹' })[nx]"):
            target_lbl = "spotlight: '聚光灯', neon: '霓虹', aurora: '极光', meteor: '流星', disco: '迪斯科', gallery: '画廊' })[nx]"
            if target_lbl not in new and l_old in new:
                new = new.replace(l_old, target_lbl)
        if new != src:
            cm.write_text(new, encoding='utf-8')
            print('fx-71: updated tools/cover-modes/cover-modes.js')
    if bad:
        sys.exit(1)


if __name__ == '__main__':
    main()
