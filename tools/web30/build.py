#!/usr/bin/env python3
"""Build web30.0.html: web18.0's desktop board (Kanban / list) unchanged + the iPhone build's 3D Cover
mode and everything around it (AI board builder, AI Analyze, voice, Pet Raising, Mini Pet, read-aloud
and pronunciation scoring, Learning Path, Study Arcade, desktop-pet link), with the iPhone's cloud format.

Both files come from the same React codebase (identical vendor prelude, all app symbols are top-level
globals in one script), so whole blocks move by name. Every edit asserts that it matched exactly once.

    python3 tools/web30/build.py [iPhoneX.Y.html]      →  web30.0.html
"""
import glob, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))


def latest_iphone():
    def ver(p):
        m = re.match(r'iPhone(\d+)\.(\d+)\.html$', os.path.basename(p))
        return (int(m.group(1)), int(m.group(2))) if m else (-1, -1)
    return max([p for p in glob.glob(os.path.join(REPO, 'iPhone*.html')) if ver(p)[0] >= 0], key=ver)


def read(p):
    return open(p, encoding='utf-8').read()


DEF = re.compile(r'^(?:var|function|const|let|class) ([A-Za-z_$][\w$]*)', re.M)


def defs(text, start=0, end=None):
    """top-level definitions in the app bundle: [(offset, name)]"""
    end = len(text) if end is None else end
    return [(m.start(), m.group(1)) for m in DEF.finditer(text, start, end)]


class Src:
    def __init__(self, text):
        self.text = text
        a = text.index('<div id="root">')
        b = text.index('createRoot', a)
        b = text.index('</script>', b)
        self.bundle = (a, b)
        self.defs = defs(text, a, b)

    def span(self, first, last=None):
        """from the definition of `first` up to (not including) the definition after `last`"""
        names = [n for _, n in self.defs]
        i = names.index(first)
        j = names.index(last or first)
        start = self.defs[i][0]
        end = self.defs[j + 1][0] if j + 1 < len(self.defs) else self.bundle[1]
        return start, end

    def block(self, first, last=None):
        a, b = self.span(first, last)
        return self.text[a:b]


def once(text, old, new, what):
    n = text.count(old)
    if n != 1:
        sys.exit('✗ %s: expected 1 match, found %d' % (what, n))
    return text.replace(old, new)


PORTED_BLOCKS = [('IconCloud', 'IconMonitor'), ('minestLocalBoardFromPrompt', 'MinestAIBoardBuilder'),
                 ('minestAIHeaders', 'MinestPronunciationPreview'), ('Oe', 'FlashcardDrillView'), ('StudyArcade', None)]


def head_css(text):
    return '\n'.join(re.findall(r'<style[^>]*>(.*?)</style>', text[:text.index('<div id="root">')], re.S))


def css_statements(css):
    """top-level statements: ('rule', selector, body) / ('at', prelude, inner) — enough for these files"""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    out, i, n = [], 0, len(css)
    while i < n:
        j = css.find('{', i)
        if j < 0:
            break
        prelude = css[i:j].strip()
        depth, k = 1, j + 1
        while k < n and depth:
            if css[k] == '{':
                depth += 1
            elif css[k] == '}':
                depth -= 1
            k += 1
        body = css[j + 1:k - 1]
        if prelude.startswith('@'):
            out.append(('at', prelude, body))
        elif prelude:
            out.append(('rule', prelude, body))
        i = k
    return out


def ported_css(I, web_text):
    ported = ''.join(I.block(a, b) for a, b in PORTED_BLOCKS)
    used = set()
    for m in re.finditer(r'className:\s*("([^"]*)"|\'([^\']*)\')', ported):
        used.update((m.group(2) or m.group(3) or '').split())
    for m in re.finditer(r'class(?:Name)?=\\?"([^"\\]*)', ported):
        used.update(m.group(1).split())
    used = {c for c in used if re.match(r'^[a-z][\w-]*$', c)}
    wcss, icss = head_css(web_text), head_css(I.text)

    def defined(c, txt):
        return re.search(r'\.' + re.escape(c) + r'(?![\w-])', txt) is not None
    only = {c for c in used if not defined(c, wcss) and defined(c, icss)}
    # message roles (user / assistant / system / sent) only count inside the AI builder's own rules
    generic = {'assistant', 'sent', 'system', 'user'}
    keys = only - generic
    pat = re.compile(r'\.(' + '|'.join(sorted(map(re.escape, keys), key=len, reverse=True)) + r')(?![\w-])')
    keep, frames = [], set()

    def take_rule(sel, body):
        if pat.search(sel):
            frames.update(re.findall(r'animation(?:-name)?\s*:\s*([\w-]+)', body))
            return '%s{%s}' % (sel, body)
        return None
    for kind, pre, body in css_statements(icss):
        if kind == 'rule':
            r = take_rule(pre, body)
            if r:
                keep.append(r)
        elif pre.startswith('@media') or pre.startswith('@supports'):
            inner = [x for x in (take_rule(p2, b2) for k2, p2, b2 in css_statements(body) if k2 == 'rule') if x]
            if inner:
                keep.append('%s{%s}' % (pre, '\n'.join(inner)))
    for kind, pre, body in css_statements(icss):
        if kind == 'at' and re.match(r'@(-webkit-)?keyframes\s+([\w-]+)', pre):
            name = re.match(r'@(?:-webkit-)?keyframes\s+([\w-]+)', pre).group(1)
            if name in frames and not re.search(r'@keyframes\s+' + re.escape(name) + r'\b', wcss):
                keep.append('%s{%s}' % (pre, body))
    return '/* web30: CSS for the ported iPhone components (%d classes) */\n' % len(keys) + '\n'.join(keep)


def resolve_iphone(arg=None):
    p = arg or latest_iphone()
    return p if os.path.isabs(p) else os.path.join(REPO, p)


def build(iphone_path):
    """web30.0's text (web31 and later start from it)"""
    W = Src(read(os.path.join(REPO, 'web18.0.html')))
    I = Src(read(iphone_path))
    iname = os.path.basename(iphone_path)
    out = W.text

    # ------------------------------------------------------------------ 1. React blocks
    # the iPhone's 3D Cover (Oe), Physical Card, Drill (learn scope) replace web18's Oe + Drill
    ported = '\n'.join([
        '// ---- web30: from %s — icons, AI board builder, AI Analyze, pronunciation, 3D Cover, Physical Card, Drill ----' % iname,
        I.block('IconCloud', 'IconMonitor'),
        I.block('minestLocalBoardFromPrompt', 'MinestAIBoardBuilder'),
        I.block('minestAIHeaders', 'MinestPronunciationPreview'),
        I.block('Oe', 'FlashcardDrillView'),
    ])
    out = once(out, W.block('Oe'), ported, 'web Oe → iPhone blocks')
    out = once(out, W.block('FlashcardDrillView'), '', 'remove web Drill')
    # Study Arcade with Learning Path hooks (learn(), study-activity events)
    out = once(out, W.block('StudyArcade'), '// ---- web30: Study Arcade from %s ----\n' % iname + I.block('StudyArcade'), 'Study Arcade')
    # the iPhone's compressed cloud format (boardsGz) — shared with the phone
    gz = I.block('MINEST_CLOUD_GZ_LIMIT', 'minestCloudPayload')
    out = once(out, 'function sanitizeLoadedBoards(', '// ---- web30: cloud format from %s ----\n' % iname + gz + 'function sanitizeLoadedBoards(', 'cloud helpers')

    # ------------------------------------------------------------------ 2. cards keep the phone's fields
    out = once(out, """          checklistItems: checklistItems,
          inkMode: (card.inkMode === 'on' || card.inkMode === 'off' ? card.inkMode : 'inherit')
        };""", """          checklistItems: checklistItems,
          inkMode: (card.inkMode === 'on' || card.inkMode === 'off' ? card.inkMode : 'inherit'),
          // web30: pronunciation score, Learning Path record (kept, so a web save never strips them)
          pron: card.pron && typeof card.pron === 'object' && typeof card.pron.latest === 'number' ? card.pron : null,
          lastReviewed: typeof card.lastReviewed === 'number' ? card.lastReviewed : 0,
          learn: card.learn && typeof card.learn === 'object' ? card.learn : null
        };""", 'sanitize: card fields')
    out = once(out, """      archivedCards: Array.isArray(b.archivedCards) ? b.archivedCards : [],""",
               """      archivedCards: Array.isArray(b.archivedCards) ? b.archivedCards : [],
      layoutMode: b.layoutMode === 'grid' ? 'grid' : 'swimlane',""", 'sanitize: board layout')

    # ------------------------------------------------------------------ 3. the root component (Be)
    ib = I.text[I.span('Be')[0]:I.span('Be')[1]]
    ai_fns = ib[ib.index("  // 41.0: send only the user's request to the configured server."):]
    ai_end = ai_fns.index("  }, [importBoardsData]);\n", ai_fns.index("  var confirmAIBoard = (0, _.useCallback)")) + len("  }, [importBoardsData]);\n")
    ai_fns = ai_fns[:ai_end]
    api = ib[ib.index("  // 44.5: one AI entry for the Mini Pet and voice commands"):ib.index("  // Sync selected list to Apple Watch")]
    out = once(out, "  var setViewMode = viewModeState[1];", "  var setViewMode = viewModeState[1];\n  window.__setViewMode = setViewMode;   // web30: Learning Path / Mini Pet", 'Be: __setViewMode')
    out = once(out, "var setAiAssistant = aiAssistantState[1];", """var setAiAssistant = aiAssistantState[1];

  // web30: AI board builder + pronunciation preview (from the iPhone build)
  var aiBoardState = (0, _.useState)({ isOpen: false, initialPrompt: '' });
  var aiBoard = aiBoardState[0];
  var setAiBoard = aiBoardState[1];
  var pronunciationState = (0, _.useState)({ isOpen: false });
  var pronunciation = pronunciationState[0];
  var setPronunciation = pronunciationState[1];""", 'Be: AI states')
    out = once(out, "  var boardClipboardState = (0, _.useState)(function() {", ai_fns + "\n  var boardClipboardState = (0, _.useState)(function() {", 'Be: AI functions')
    out = once(out, """  var activeBoard = (0, _.useMemo)(function() {
    return boards.find(function(b) { return b.id === activeBoardId; }) || boards[0] || y[0];
  }, [boards, activeBoardId]);
""", """  var activeBoard = (0, _.useMemo)(function() {
    return boards.find(function(b) { return b.id === activeBoardId; }) || boards[0] || y[0];
  }, [boards, activeBoardId]);

""" + api, 'Be: window.MinestAI')
    out = once(out, """            isZenMode: isZenMode,
            onToggleZenMode: function() { setIsZenMode(!isZenMode); }
          }) }) : null
        ] : (""", """            isZenMode: isZenMode,
            onToggleZenMode: function() { setIsZenMode(!isZenMode); },
            isLandscape: false,
            onMoveCard: moveCard
          }) }) : null
        ] : (""", 'Be: 3D Cover props')
    out = once(out, "      // AI Assistant Drawer", """      // web30: pronunciation preview + AI board builder
      pronunciation.isOpen ? (0, P.jsx)(MinestPronunciationPreview, { themeMode: themeMode, initialWord: pronunciation.word, onClose: function() { setPronunciation({ isOpen: false }); } }) : null,
      aiBoard.isOpen ? (0, P.jsx)(MinestAIBoardBuilder, {
        board: activeBoard,
        themeMode: themeMode,
        initialPrompt: aiBoard.initialPrompt,
        onClose: function() { setAiBoard({ isOpen: false, initialPrompt: '' }); },
        onCreate: createBoardFromAI,
        onConfirm: confirmAIBoard,
        onChat: chatWithAI,
        onBuild: buildBoardFromPlan,
        onDiagnose: diagnoseAI
      }) : null,

      // AI Assistant Drawer""", 'Be: AI renders')
    # rewards: a ticked card / checklist item reaches the pets
    out = once(out, """          var updatedCard = Object.assign({}, targetCard, { complete: nextComplete });""",
               """          var updatedCard = Object.assign({}, targetCard, { complete: nextComplete });
          if (nextComplete && window.MinestRewards) window.MinestRewards.emit('tick', { source: 'card', cardId: cardId, title: targetCard.title || '' });   // web30""", 'Be: card tick reward')
    out = once(out, """            return item.id === itemId ? Object.assign({}, item, { done: !item.done }) : item;""",
               """            if (item.id === itemId && !item.done && window.MinestRewards) window.MinestRewards.emit('tick', { source: 'checklist', cardId: cardId, itemId: itemId });   // web30
            return item.id === itemId ? Object.assign({}, item, { done: !item.done }) : item;""", 'Be: checklist tick reward')

    # ------------------------------------------------------------------ 4. cloud: the phone's compressed format
    out = once(out, """            if (data && Array.isArray(data.boards) && data.boards.length > 0 && !isOwnPendingEcho && !hasUnconfirmedLocalChange) {
              isRemoteUpdateRef.current = true;
              rawSetBoards(sanitizeLoadedBoards(data.boards));""", """            // web30: boards may be compressed (boardsGz, written by the phone); the study log rides along
            try { if (data && data.learning && window.MinestLearn && window.MinestLearn._mergeCloud) window.MinestLearn._mergeCloud(data.learning); } catch (e) {}
            var seqAtSnapshot = localBoardsSeqRef.current;
            if (data && !isOwnPendingEcho && !hasUnconfirmedLocalChange) minestCloudBoards(data).then(function(remoteBoards) {
              if (!remoteBoards || !remoteBoards.length) return;
              // web30: unpacking is async — a local edit made meanwhile (a list dragged, a card moved) wins
              if (localBoardsSeqRef.current !== seqAtSnapshot || localBoardsSeqRef.current !== confirmedBoardsSeqRef.current) return;
              isRemoteUpdateRef.current = true;
              rawSetBoards(sanitizeLoadedBoards(remoteBoards));""", 'cloud: snapshot read')
    out = once(out, """              if (['dark', 'white'].includes(data.themeMode)) setThemeMode(data.themeMode);
              setTimeout(function() { isRemoteUpdateRef.current = false; }, 300);
            }
            setLastSyncTime(new Date());""", """              if (['dark', 'white'].includes(data.themeMode)) setThemeMode(data.themeMode);
              setTimeout(function() { isRemoteUpdateRef.current = false; }, 300);
            });
            setLastSyncTime(new Date());""", 'cloud: snapshot read (end)')
    out = once(out, """            docRef.set({
              boards: boards,
              activeBoardId: activeBoardId,
              viewMode: viewMode,
              themeMode: themeMode,
              userEmail: user.email,
              clientUpdatedAt: Date.now(),
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(function() {""", """            minestCloudPayload(boards, {
              activeBoardId: activeBoardId,
              viewMode: viewMode,
              themeMode: themeMode,
              userEmail: user.email
            }).then(function(payload) { return docRef.set(payload, { merge: true }); }).then(function() {""", 'cloud: first write')
    out = once(out, """          db.collection("users").doc(firebaseUser.uid).collection("focusboard").doc("data").set({
            boards: boards,
            activeBoardId: activeBoardId,
            viewMode: viewMode,
            themeMode: themeMode,
            userEmail: firebaseUser.email,
            clientUpdatedAt: Date.now(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true }).then(function() {""", """          minestCloudPayload(boards, {
            activeBoardId: activeBoardId,
            viewMode: viewMode,
            themeMode: themeMode,
            userEmail: firebaseUser.email
          }).then(function(payload) {
            return db.collection("users").doc(firebaseUser.uid).collection("focusboard").doc("data").set(payload, { merge: true });
          }).then(function() {""", 'cloud: debounced save')
    out = once(out, """      await db.collection("users").doc(firebaseUser.uid).collection("focusboard").doc("data").set({
        boards: boards,
        activeBoardId: activeBoardId,
        viewMode: viewMode,
        themeMode: themeMode,
        userEmail: firebaseUser.email,
        clientUpdatedAt: Date.now(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });""", """      var pushPayload = await minestCloudPayload(boards, {
        activeBoardId: activeBoardId,
        viewMode: viewMode,
        themeMode: themeMode,
        userEmail: firebaseUser.email
      });
      await db.collection("users").doc(firebaseUser.uid).collection("focusboard").doc("data").set(pushPayload, { merge: true });""", 'cloud: force push')
    out = once(out, """        var data = doc.data();
        if (data && Array.isArray(data.boards) && data.boards.length > 0) {
          isRemoteUpdateRef.current = true;""", """        var data = doc.data();
        try { if (data && data.learning && window.MinestLearn && window.MinestLearn._mergeCloud) window.MinestLearn._mergeCloud(data.learning); } catch (e) {}
        var pulled = data ? await minestCloudBoards(data) : null;   // web30: compressed boards too
        if (pulled && pulled.length > 0) {
          data = Object.assign({}, data, { boards: pulled });
          isRemoteUpdateRef.current = true;""", 'cloud: force pull')

    # ------------------------------------------------------------------ 4b. Settings → 🐙 Pets: the Mac desktop pet + the Mini Pet
    pets_panel = r"""
// web30: Settings → 🐙 Pets. The Mac desktop pet is a separate native app (macos/MinestDesktopPet): its own
// link minest-desktop-pet://show|hide starts / shows / hides it; the page links to it over ws://127.0.0.1:47321
// (MinestDesktopLink) so it mirrors this page's Mini Pet. The Mini Pet is this page's own 3D pet.
var Web30PetsPanel = function(props) {
  var isDark = props.isDark;
  var tick = (0, _.useState)(0), setTick = tick[1];
  (0, _.useEffect)(function() { var t = setInterval(function() { setTick(function(n) { return n + 1; }); }, 1000); return function() { clearInterval(t); }; }, []);
  var L = window.MinestDesktopLink, M = window.MinestMiniPet;
  var KEY = 'minest.desktopPet.webVisible.v1';
  var linked = !!(L && L.connected);
  var deskOn = (function() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } })();
  var miniOn = !!(M && M.isVisible && M.isVisible());
  // on: start / show the app and link it to this page · off: hide it
  var setDesk = function(on) {
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
    // linked: tell the app directly (no browser prompt); otherwise its link starts / shows / hides it
    if (L && L.connected && L.pet) L.pet(on);
    else { try { window.location.href = 'minest-desktop-pet://' + (on ? 'show' : 'hide'); } catch (e) {} }
    if (on && L && L.enable) setTimeout(function() { L.enable(true); }, 1200);
    SoundEngine.play('click'); setTick(function(n) { return n + 1; });
  };
  var sw = function(on, onChange, label) {
    return (0, P.jsx)('button', { type: "button", role: "switch", 'aria-checked': on ? "true" : "false", 'aria-label': label, onClick: function() { onChange(!on); },
      className: "web30-switch",
      // inline styles: web18's prebuilt CSS has no sizes for a switch
      style: { position: 'relative', flex: '0 0 auto', width: 50, height: 30, borderRadius: 999, padding: 0, cursor: 'pointer', transition: 'background .2s, border-color .2s',
        background: on ? '#10b981' : (isDark ? 'rgba(255,255,255,.12)' : '#e2e8f0'), border: '1px solid ' + (on ? '#34d399' : (isDark ? 'rgba(255,255,255,.22)' : '#cbd5e1')) },
      children: (0, P.jsx)('span', { style: { position: 'absolute', top: 2, left: on ? 22 : 2, width: 24, height: 24, borderRadius: 999, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.3)', transition: 'left .2s' } }) });
  };
  var card = "rounded-2xl border p-4 space-y-2 " + (isDark ? "bg-white/[0.03] border-white/10" : "bg-white/70 border-slate-200");
  var status = !deskOn ? "Off" : linked ? "On · linked to this page" : "On · waiting for the app";
  return (0, P.jsxs)('div', { className: "space-y-4 pt-1 web30-pets", children: [
    (0, P.jsxs)('div', { className: card, children: [
      (0, P.jsxs)('div', { className: "flex items-center justify-between gap-4", children: [
        (0, P.jsxs)('div', { children: [
          (0, P.jsx)('div', { className: "font-bold text-sm", children: "🐙 Mac Desktop Pet" }),
          (0, P.jsx)('div', { className: "text-xs opacity-70", children: "The Mini Pet on your Mac desktop — same look and moves as here, tips while Minest is in the background." }),
          (0, P.jsx)('div', { className: "text-xs font-semibold mt-1 web30-desk-status " + (deskOn && linked ? "text-emerald-400" : "opacity-60"), children: status })
        ] }),
        sw(deskOn, setDesk, "Mac Desktop Pet")
      ] }),
      (0, P.jsx)('div', { className: "text-[11px] opacity-60 leading-relaxed", children: "Needs the Minest Desktop Pet app on this Mac (macos/MinestDesktopPet → build.sh install). The first time, the browser asks to open the app and to allow local network access — allow both." })
    ] }),
    (0, P.jsx)('div', { className: card, children: (0, P.jsxs)('div', { className: "flex items-center justify-between gap-4", children: [
      (0, P.jsxs)('div', { children: [
        (0, P.jsx)('div', { className: "font-bold text-sm", children: "Mini Pet on this page" }),
        (0, P.jsx)('div', { className: "text-xs opacity-70", children: "Tap it for the menu (Study, Talk, Build…), hold to talk, double-tap for Octo." })
      ] }),
      sw(miniOn, function(on) { if (M) { on ? M.show() : M.hide(); } SoundEngine.play('click'); setTick(function(n) { return n + 1; }); }, "Mini Pet on this page")
    ] }) })
  ] });
};
"""
    out = once(out, '// Board Settings Studio (Ne) - Apple Liquid Glass 4-Tab Studio', pets_panel + '\n// Board Settings Studio (Ne) - Apple Liquid Glass 4-Tab Studio', 'Pets panel component')
    out = once(out, """              { id: 'data', label: 'Data' }
            ].map(function(tab) {""", """              { id: 'data', label: 'Data' },
              { id: 'pets', label: '🐙 Pets' }
            ].map(function(tab) {""", 'Settings: Pets tab')
    out = once(out, "            activeTab === 'general' ? (", "            activeTab === 'pets' ? (0, P.jsx)(Web30PetsPanel, { isDark: isDark }) : null,\n            activeTab === 'general' ? (", 'Settings: Pets panel')

    # ------------------------------------------------------------------ 4c. fixes for web18 behaviour
    # Sign-in: the Firebase SDK scripts are `defer`, so the auth effect ran before `firebase` existed,
    # returned early and never re-ran: a sign-in then never reached the app. Wait for the SDK.
    out = once(out, """  // Firebase Auth & Firestore Listener
  (0, _.useEffect)(function() {
    if (typeof firebase === 'undefined') return;""", """  // web30: wait for the deferred Firebase SDK, then (re)run the auth listener
  var fbReadyState = (0, _.useState)(function() { return typeof firebase !== 'undefined' && !!firebase.auth; });
  var fbReady = fbReadyState[0];
  var setFbReady = fbReadyState[1];
  (0, _.useEffect)(function() {
    if (fbReady) return;
    var iv = setInterval(function() { if (typeof firebase !== 'undefined' && firebase.auth) { clearInterval(iv); setFbReady(true); } }, 150);
    return function() { clearInterval(iv); };
  }, [fbReady]);

  // Firebase Auth & Firestore Listener
  (0, _.useEffect)(function() {
    if (typeof firebase === 'undefined') return;""", 'Be: wait for Firebase SDK')
    out = once(out, "  }, [firebaseConfig]);\n\n  // Firestore Debounced Save", "  }, [firebaseConfig, fbReady]);\n\n  // Firestore Debounced Save", 'Be: auth effect deps')
    # List reorder: the header and its list wrapper both start a drag on the same press (the event
    # bubbles), so a drop reordered twice and the list jumped back. One drag per press.
    out = once(out, """  var handleSafariColumnPointerDown = function(e, colId, cIdx) {
    // Only handle primary button (left click) or single touch
    if (e.button !== 0) return;""", """  var handleSafariColumnPointerDown = function(e, colId, cIdx) {
    // Only handle primary button (left click) or single touch
    if (e.button !== 0) return;
    var ne = e.nativeEvent || e;
    if (ne.__mnColDrag || safariColDragActiveRef.current) return;   // web30: one drag per press (header + wrapper both listen)
    ne.__mnColDrag = true;""", 'board: one column drag per press')

    # ------------------------------------------------------------------ 5. the top bar: entries next to Arcade
    arcade_end = """              (0, P.jsx)('span', { className: "hidden lg:inline", children: "Arcade" })
            ]
          }),
"""
    entries = """
          // web30: the iPhone build's tools — AI board builder, Analyze, Learning Path, read-aloud scoring, Octo, voice
          (function() {
            var cls = "flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 " + (isDark ? "bg-white/8 border-white/15 text-white/85 hover:text-white hover:bg-white/15" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200");
            var item = function(key, glyph, label, title, run) {
              return (0, P.jsxs)('button', { key: key, type: "button", className: cls + " mn30-entry", title: title,
                onClick: function() { SoundEngine.play('click'); try { run(); } catch (e) {} },
                children: [(0, P.jsx)('span', { 'aria-hidden': "true", children: glyph }), (0, P.jsx)('span', { className: "hidden xl:inline", children: label })] });
            };
            return (0, P.jsxs)('div', { className: "mn30-entries flex items-center gap-1.5", children: [
              item('ai', '✨', 'AI Build', 'Build a board with AI', function() { window.MinestAI.openBuilder(''); }),
              item('an', '🔍', 'Analyze', 'AI Analyze this board', function() { window.MinestAI.analyze(); }),
              item('lp', '📚', 'Learn', 'Learning Path — study with the coach', function() { window.MinestLearn.start(); }),
              item('pr', '🗣', 'Speak', 'Read aloud · pronunciation score', function() { window.MinestAI.openPronunciation(''); }),
              item('oc', '🐙', 'Octo', 'Pet Raising', function() { window.MinestPetRaising.open(); }),
              item('vo', '🎙', 'Voice', 'Talk to Minest', function() { var V = window.MinestRealtimeVoice43; if (V) { V.open(); if (!V.active) V.start(); } })
            ] });
          })(),
"""
    out = once(out, arcade_end, arcade_end + entries, 'top bar entries')

    # ------------------------------------------------------------------ 6. scripts after the bundle
    def script_at(text, marker):
        """the whole <script>…</script> element whose code starts with `marker`"""
        i = text.index(marker)
        return text.rindex('<script', 0, i), text.index('</script>', i) + len('</script>')
    # screen effects: the iPhone's (the 3D Cover and the Mini Pet use the newer FBFX)
    wa, wb = script_at(out, 'Screen effects for 3D Cover Fl')
    ia, ib2 = script_at(I.text, 'Screen effects for 3D Cover Fl')
    out = out[:wa] + I.text[ia:ib2] + out[wb:]
    # Pet Raising … realtime voice (incl. three.js loaders, Mini Pet, rewards/tips, Copy Cat bridge, style)
    a1 = script_at(I.text, '/* 41.377 Pet Raising V6:')[0]
    a2 = script_at(I.text, "// ≡ menu: the dock column continues under the top-bar tiles")[0]   # iPhone top bar only: not taken
    # Learning Path engine + runner + Mac desktop pet link
    b1 = script_at(I.text, '/* 44.7 Learning Path 2.0 · Engine')[0]
    b2 = script_at(I.text, '/* 44.6 Mac desktop pet link.')[1]
    addons = ('\n<!-- ---- web30: add-ons from %s (Pet Raising, Mini Pet, rewards & tips, voice, Learning Path, desktop pet link) ---- -->\n' % iname
              + I.text[a1:a2] + '\n' + I.text[b1:b2] + '\n')
    # the desktop page's Mini Pet starts bottom-left (top-left covered the first list's title); dragging still moves it
    addons = once(addons, "left:14px;top:calc(88px + env(safe-area-inset-top))", "left:18px;top:calc(100vh - 200px)", 'Mini Pet start position')
    tail = out.rindex('</body>')
    out = out[:tail] + addons + out[tail:]

    # ------------------------------------------------------------------ 7. CSS the ported components need
    # rules (and their @media / @keyframes) for classes the ported blocks use that web18's CSS doesn't
    # define at all — board classes are never touched
    out = once(out, '</head>', '<style id="mn30-ported">\n' + ported_css(I, W.text) + '\n</style>\n</head>', 'ported CSS')

    # ------------------------------------------------------------------ 8. name + version
    out = once(out, '<title>Focusboard Studio 18.0 · Board Light FX & Card Modes</title>', '<title>Minest Web 30.0 · Board + 3D Cover · Learning Path</title>', 'title')

    out = once(out, 'className: "studio-version w-7 h-7 flex items-center justify-center font-bold text-xs", children: "18.0" }', 'className: "studio-version w-7 h-7 flex items-center justify-center font-bold text-xs", children: "30.0" }', 'version badge')

    return out


def main():
    iphone_path = resolve_iphone(sys.argv[1] if len(sys.argv) > 1 else None)
    out = build(iphone_path)
    open(os.path.join(REPO, 'web30.0.html'), 'w', encoding='utf-8').write(out)
    print('web30.0.html ← web18.0.html + %s (%d KB)' % (os.path.basename(iphone_path), len(out) // 1024))


if __name__ == '__main__':
    main()
