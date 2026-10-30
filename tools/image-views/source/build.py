"""Build a reviewable HTML copy; never edits the supplied source checkout."""
from pathlib import Path
import argparse, hashlib, json, difflib

HERE = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('base', type=Path)
parser.add_argument('output', type=Path)
parser.add_argument('--app-entry', action='store_true', help='Preserve the app title; skip example and alternate entries.')
args = parser.parse_args()
original = args.base.read_text()
s = original
def replace(old, new, count=1):
    global s
    found = s.count(old)
    if found != count:
        raise RuntimeError(f'Integration anchor expected {count}, found {found}: {old[:100]}')
    s = s.replace(old, new)

replace('var Oe = function(props) {', (HERE / 'image-views.js').read_text() + '\nvar Oe = function(props) {')
replace('</head>', '<style id="minest-image-views-v1">\n' + (HERE / 'image-views.css').read_text() + '\n</style>\n</head>')
# Photo grid pinch owns its gesture; do not also open the legacy Duo menu.
replace("pinch0 = on && e.touches.length === 2 ? pinchDist(e.touches) : 0;", "pinch0 = on && !e.target.closest('.miv-view') && e.touches.length === 2 ? pinchDist(e.touches) : 0;")
replace("return el && el.closest && el.closest('main') && !document.body.classList.contains('clear-mode');", "return el && el.closest && el.closest('main') && !el.closest('.miv-view') && !document.body.classList.contains('clear-mode');")
# Every entry point, cloud restore and backup restore accepts the same modes.
s = s.replace("['coverflow', 'board', 'drill']", "['coverflow', 'board', 'drill', 'photos', 'pins']")
replace("if (['coverflow', 'board', 'drill', 'photos', 'pins'].includes(vm)) return 'board';", "if (['coverflow', 'board', 'drill', 'photos', 'pins'].includes(vm)) return vm;")
replace('    rawSetViewMode(next);', '''    MinestImageViews.closeSwitcher();
    if (next !== 'board' && next !== 'coverflow' && window.SpatialFold) SpatialFold.dual(false);
    rawSetViewMode(next);''')
replace("  var requestViewMode = function(m) { if (window.isStudentMode && window.isStudentMode() && m === 'board') m = 'coverflow'; SpatialFold.request(m); };", """  var requestViewMode = function(m) {
    if (window.isStudentMode && window.isStudentMode() && m === 'board') m = 'coverflow';
    if (m === 'photos' || m === 'pins' || viewMode === 'photos' || viewMode === 'pins') {
      MinestImageViews.transition(activeBoard.id, function() { SpatialFold.request(m); });
    } else SpatialFold.request(m);
  };""")
# Reuse the original button and its existing Dock proxy; student-mode game behavior stays intact.
replace("              var nextMode = viewMode === 'coverflow' ? 'board' : 'coverflow';\n              if (onViewModeChange) onViewModeChange(nextMode);", "              MinestImageViews.openSwitcher(document.querySelector('.sf-mode-toggle-btn'), viewMode, onViewModeChange);")
replace("title: (window.isStudentMode && window.isStudentMode()) ? \"Play Game (Arcade)\" : (viewMode === 'coverflow' ? \"Board view (Kanban)\" : \"3D view (3D Cover)\"),", "title: (window.isStudentMode && window.isStudentMode()) ? \"Play Game (Arcade)\" : \"Views — Kanban, Photos, Masonry Pins, 3D Cover Flow\",\n            'aria-haspopup': 'menu',")
replace("'aria-label': (window.isStudentMode && window.isStudentMode()) ? \"Play Game\" : (viewMode === 'coverflow' ? \"Board view\" : \"3D view\"),", "'aria-label': (window.isStudentMode && window.isStudentMode()) ? \"Play Game\" : \"Views\",")
replace("        children: (viewMode === 'board' || viewMode === 'coverflow') ? [", """        onClickCapture: function(e) {
          var el = e.target.closest('[data-card-id]');
          if (viewMode === 'board' && el) MinestImageViews.select(activeBoard.id, el.getAttribute('data-card-id'), 'board');
        },
        children: (viewMode === 'photos' || viewMode === 'pins') ? [
          (0, P.jsx)('div', { className: 'miv-pane', style: { position: 'relative', flex: 1, minHeight: 0 }, children: (0, P.jsx)(MinestImageViews.View, {
            board: activeBoard, mode: viewMode, selectedColFilter: selectedColFilter, searchTerm: searchTerm,
            onOpenCardModal: function(colId, cardId) { setCardModal({ isOpen: true, columnId: colId, cardId: cardId }); }
          }) }),
          (foldSlots && foldSlots.coverflow) ? (0, P.jsx)('div', { className: 'sf-slot', 'data-sf-view': 'coverflow', children: (0, P.jsx)(Oe, {
            board: activeBoard, sharedImageCollection: true, themeMode: themeMode, searchTerm: searchTerm, selectedColFilter: selectedColFilter,
            onSelectColFilter: setSelectedColFilter, isLandscape: isLandscape, isZenMode: isZenMode,
            onToggleZenMode: function() { setIsZenMode(!isZenMode); }, onMoveCard: moveCard,
            onOpenCardModal: function(colId, cardId) { setCardModal({ isOpen: true, columnId: colId, cardId: cardId }); },
            onToggleCardComplete: toggleCardComplete, onToggleChecklistItem: toggleChecklistItem,
            onUpdateCardMastery: updateCardMastery, onUpdateCardPriority: updateCardPriority,
            onOpenAIAssistant: function(card) { setAiAssistant({ isOpen: true, card: card }); }
          }) }) : null
        ] : (viewMode === 'board' || viewMode === 'coverflow') ? [""")
replace("  (0, _.useEffect)(function() { SpatialFold.modeChanged(viewMode); }, [viewMode]);", """  (0, _.useEffect)(function() {
    SpatialFold.modeChanged(viewMode);
    if ((viewMode === 'photos' || viewMode === 'pins') && document.documentElement.classList.contains('duo-cover')) SpatialFold.dual(true);
  }, [viewMode]);""")
replace("  // 44.5: one AI entry", """  (0, _.useEffect)(function() { MinestImageViews.cancel(); }, [activeBoardId]);
  // 44.5: one AI entry""")
# Cover Flow receives the shared projection. Engine, transform math, physics and gestures are untouched.
a = s.index('  var cards = (0, _.useMemo)', s.index('var Oe = function(props)'))
b = s.index('  // 40.8:', a)
s = s[:a] + """  var cards = (0, _.useMemo)(function() {
    return MinestImageViews.cards(board, props.sharedImageCollection ? selectedColFilter : (duoCol || selectedColFilter), searchTerm);
  }, [board, selectedColFilter, searchTerm, duoCol, imageRevision[0]]);

  var reconcilingImageSelection = (0, _.useRef)(false);
  (0, _.useLayoutEffect)(function() {
    var id = MinestImageViews.state(board.id).selected;
    var seed = SpatialFold.takeSeed();
    if (id == null) id = seed;
    var i = cards.findIndex(function(c) { return String(c.id) === String(id); });
    if (i < 0) i = Math.max(0, Math.min(activeIdx, cards.length - 1));
    reconcilingImageSelection.current = i !== activeIdx;
    MinestImageViews.select(board.id, cards[i] ? cards[i].id : null, 'coverflow');
    if (i !== activeIdx) setActiveIdx(i);
  }, [cards, board.id]);
  (0, _.useEffect)(function() {
    if (reconcilingImageSelection.current && cards[activeIdx] && String(cards[activeIdx].id) !== MinestImageViews.state(board.id).selected) return;
    reconcilingImageSelection.current = false;
    MinestImageViews.select(board.id, cards[activeIdx] ? cards[activeIdx].id : null, 'coverflow');
  }, [cards, activeIdx, board.id]);
  (0, _.useEffect)(function() {
    function sync(e) {
      if (e.detail.boardId !== board.id || e.detail.source === 'coverflow') return;
      var i = cards.findIndex(function(c) { return String(c.id) === String(e.detail.cardId); });
      if (i >= 0) setActiveIdx(i);
    }
    window.addEventListener('minest:image-selection', sync);
    return function() { window.removeEventListener('minest:image-selection', sync); };
  }, [cards, board.id]);

""" + s[b:]
a = s.index('  // Spatial Fold: open centred', s.index('var Oe ='))
b = s.index('  (0, _.useEffect)(function() {\n    SpatialFold.setCoverFlowActive', a)
s = s[:a] + s[b:]
replace("    setActiveIdx(0);\n    setFlippedMap({});", "    setFlippedMap({});")
replace("  var activeIdxState = (0, _.useState)(0);", """  var imageRevision = (0, _.useState)(0);
  var imageViewer = (0, _.useState)(false);
  (0, _.useEffect)(function() {
    function refresh() { imageRevision[1](function(n) { return n + 1; }); }
    window.addEventListener('minest:image-filters', refresh);
    return function() { window.removeEventListener('minest:image-filters', refresh); };
  }, []);
  (0, _.useEffect)(function() { imageViewer[1](false); }, [board.id]);
  var activeIdxState = (0, _.useState)(0);""")
# Add an image face and explicit HD action to the existing cards.
needle = '                        title: isCenter ? "Click to flip card (or press Space)" : undefined,\n                        children: ['
replace(needle, needle + """
                          MinestImageViews.image(card).thumb ? (0, P.jsx)('img', { className: 'miv-cf-image', src: MinestImageViews.image(card).thumb, alt: card.title || '', decoding: 'async', draggable: false }) : null,
                          isCenter && MinestImageViews.image(card).full ? (0, P.jsx)('button', { className: 'miv-cf-open', onPointerDown: function(e) { e.stopPropagation(); }, onClick: function(e) { e.stopPropagation(); imageViewer[1](true); }, children: 'View full image' }) : null,""")
replace('                            className: "relative z-10 text-center px-4 w-full flex flex-col items-center justify-center pointer-events-none",', '                            style: MinestImageViews.image(card).thumb ? { opacity: 0 } : undefined,\n                            className: "relative z-10 text-center px-4 w-full flex flex-col items-center justify-center pointer-events-none",')
a = s.index("  return (0, P.jsxs)('section', {", s.index('var Oe ='))
b = s.index('    children: [', a) + len('    children: [')
s = s[:b] + """
      imageViewer[0] && cards[activeIdx] ? (0, P.jsx)(MinestImageViews.Viewer, {
        card: cards[activeIdx], canPrev: activeIdx > 0, canNext: activeIdx < cards.length - 1,
        onClose: function() { imageViewer[1](false); },
        onDetails: function() { imageViewer[1](false); onOpenCardModal(cards[activeIdx].columnId, cards[activeIdx].id); },
        onStep: function(d) { setActiveIdx(function(i) { return Math.max(0, Math.min(cards.length - 1, i + d)); }); }
      }) : null,
""" + s[b:]
# Keep column-menu priority filters when Kanban unmounts.
replace("  var colPriorityFiltersState = (0, _.useState)({});", "  var colPriorityFiltersState = (0, _.useState)(function() { return MinestImageViews.state(board.id).priorities; });")
replace("        next[colId] = filterVal;\n      }\n      return next;\n    });\n    SoundEngine.play('click');\n  };\n", """        next[colId] = filterVal;
      }
      MinestImageViews.state(board.id).priorities = next;
      queueMicrotask(function() { window.dispatchEvent(new CustomEvent('minest:image-filters')); });
      return next;
    });
    SoundEngine.play('click');
  };
""")
replace("  var setColPriorityFilters = colPriorityFiltersState[1];", """  var setColPriorityFilters = colPriorityFiltersState[1];
  (0, _.useEffect)(function() { setColPriorityFilters(MinestImageViews.state(board.id).priorities); }, [board.id]);""")
# Replace duplicated Kanban filter/sort with the same non-mutating helpers.
a = s.index('            // Filter & sort cards inside column')
b = s.index('            var renderInlineComposer', a)
s = s[:a] + """            // Same filter/sort semantics as Photos, Pins and Cover Flow.
            var filteredCards = MinestImageViews.sorted((col.cards || []).filter(function(card) {
              return MinestImageViews.matches(card, board, searchTerm, colPriorityFilters[col.id]);
            }), sortBy);

""" + s[b:]
args.output.parent.mkdir(parents=True, exist_ok=True)
if not args.app_entry:
    s = s.replace('<title>Minest iPhone 53.8241 · Teaching Games (Solo & Blooket)</title>', '<title>Minest Image Views &amp; Cover Flow V1.0</title>')
args.output.write_text(s)
if args.app_entry:
    print(f'Integrated app entry {args.output}: {len(s):,} characters')
    raise SystemExit(0)
(args.output.parent / 'Minest-Image-Views-Duo-V1.html').write_text(s.replace('<head>', '<head>\n<script>window.__MINEST_DUO__ = true;</script>', 1))
sample_path = args.output.parent / 'sample-board.json'
if sample_path.exists():
    sample = json.loads(sample_path.read_text())
    # This is a first-launch example only; saved browser boards always win.
    for col in sample.get('columns', []):
        for card in col.get('cards', []):
            for k in ('image',):
                if isinstance(card.get(k), str): card[k] = card[k].replace('https://minest-app.vercel.app', '')
            for k in ('value', 'url', 'originalUrl'):
                cover = card.get('cover', {})
                if isinstance(cover.get(k), str): cover[k] = cover[k].replace('https://minest-app.vercel.app', '')
    seed = "      var saved = localStorage.getItem(STORAGE_BOARDS_KEY);"
    if s.count(seed) != 1: raise RuntimeError('Sample initializer anchor changed')
    demo = s.replace(seed, seed + '\n      if (!saved) return [' + json.dumps(sample, ensure_ascii=False).replace('</', '<\\/') + '];')
    (args.output.parent / 'Minest-Image-Views-Demo-V1.html').write_text(demo)
    anchor = demo
    for old, new in [('focusboard_boards_v7_2', 'minest_anchor_preview_boards_v1'), ('focusboard_active_id_v7_2', 'minest_anchor_preview_active_v1'), ('focusboard_view_mode_v7', 'minest_anchor_preview_mode_v1'), ('focusboard_theme_mode_v7', 'minest_anchor_preview_theme_v1')]:
        anchor = anchor.replace(old, new)
    # A dedicated preview must not restore or write the main app's IndexedDB.
    anchor = anchor.replace('var IDB_DB_NAME = "focusboard_idb_v1";', 'var IDB_DB_NAME = "minest_anchor_preview_idb_v1";')
    preview_sample = dict(sample, id='anchor-chart-image-preview-143', title='我的 Anchor Charts · 143 张图片预览')
    preview_json = json.dumps(preview_sample, ensure_ascii=False).replace('</', '<\\/')
    anchor_seed = "      var saved = localStorage.getItem(STORAGE_BOARDS_KEY);"
    anchor = anchor.replace(anchor_seed, anchor_seed + '\n      var previewBoards = []; try { previewBoards = JSON.parse(saved || "[]"); } catch (e) {}\n      if (!Array.isArray(previewBoards)) previewBoards = [];\n      if (!previewBoards.some(function(b) { return b.id === "anchor-chart-image-preview-143"; })) previewBoards.push(' + preview_json + ');\n      return previewBoards;', 1)
    anchor = anchor.replace('      var act = localStorage.getItem(STORAGE_ACTIVE_ID_KEY);', '      if (boards.some(function(b) { return b.id === "anchor-chart-image-preview-143"; })) return "anchor-chart-image-preview-143";\n      var act = localStorage.getItem(STORAGE_ACTIVE_ID_KEY);', 1)
    (args.output.parent / 'Anchor-Charts-Preview.html').write_text(anchor.replace('<title>Minest Image Views &amp; Cover Flow V1.0</title>', '<title>My Anchor Charts · Minest Image Views</title>'))
(args.output.parent / 'integration.patch').write_text(''.join(difflib.unified_diff(original.splitlines(True), s.splitlines(True), fromfile='a/iphone.html', tofile='b/iphone.html')))
(args.output.parent / 'build-info.json').write_text(json.dumps({ 'base': str(args.base.resolve()), 'base_sha256': hashlib.sha256(original.encode()).hexdigest(), 'output_sha256': hashlib.sha256(s.encode()).hexdigest() }, indent=2))
print(f'Built {args.output}: {len(s):,} characters')
