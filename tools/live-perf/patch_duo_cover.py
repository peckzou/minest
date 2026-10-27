"""Duo · board | 3D Cover side by side (2026-10-26). Two small hooks in the app itself:
- SpatialFold.dual(on): keep the Board and Cover Flow slots mounted together (the same two slots a fold animation uses),
  so duo.js can lay them out side by side on the iPhone Fold's inner screen; a running fold is left alone.
- Cover Flow listens for 'minest:cf-goto' {cardId} and turns to that card (a card picked on the board beside it), and
  for 'minest:cf-list' {colId}: it then shows only that list (the one on screen in the board pane).
Run before patch_duo.py (which copies the page to every copy)."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]; SRC = ROOT / 'iPhone53.8241.html'
s = SRC.read_text(encoding='utf-8')
def rep(a, b):
    global s
    if b in s: return
    assert s.count(a) == 1, (a[:70], s.count(a)); s = s.replace(a, b)
rep("""    isFolding: function() { return !!f; },
    takeSeed: function() { var s = seedId; seedId = null; return s; },""",
    """    isFolding: function() { return !!f; },
    // 53.85 Duo: both views mounted side by side (board | 3D Cover) on a folding phone's inner screen
    dual: function(on) { if (host && !f) host.setSlots(on ? { board: true, coverflow: true } : null); },
    takeSeed: function() { var s = seedId; seedId = null; return s; },""")
rep("""  (0, _.useEffect)(function() {
    SpatialFold.setCoverFlowActive(cards[activeIdx] ? cards[activeIdx].id : null);
  }, [activeIdx, cards]);""",
    """  (0, _.useEffect)(function() {
    SpatialFold.setCoverFlowActive(cards[activeIdx] ? cards[activeIdx].id : null);
  }, [activeIdx, cards]);
  // 53.85 Duo: the board beside it turns Cover Flow to the card picked there
  (0, _.useEffect)(function() {
    var go = function(e) { var id = e.detail && e.detail.cardId; if (id == null) return; var i = cards.findIndex(function(c) { return String(c.id) === String(id); }); if (i >= 0) setActiveIdx(i); };
    window.addEventListener('minest:cf-goto', go);
    return function() { window.removeEventListener('minest:cf-goto', go); };
  }, [cards]);""")
rep("""  var cards = (0, _.useMemo)(function() {
    var list = [];
    (board.columns || []).forEach(function(col) {
      if (selectedColFilter === 'all' || selectedColFilter === col.id) {""",
    """  // 53.85 Duo: the board beside it says which list is on screen; the Cover shows that list's cards
  var duoColState = (0, _.useState)(null), duoCol = duoColState[0], setDuoCol = duoColState[1];
  (0, _.useEffect)(function() {
    var on = function(e) { setDuoCol((e.detail && e.detail.colId) || null); setActiveIdx(0); };
    window.addEventListener('minest:cf-list', on);
    return function() { window.removeEventListener('minest:cf-list', on); };
  }, []);
  var cards = (0, _.useMemo)(function() {
    var list = [], flt = duoCol || selectedColFilter;
    (board.columns || []).forEach(function(col) {
      if (flt === 'all' || flt === col.id) {""")
rep("""    return list;
  }, [board, selectedColFilter, searchTerm]);""", """    return list;
  }, [board, selectedColFilter, searchTerm, duoCol]);""")
rep("""  var onToggleZenMode = props.onToggleZenMode;
  var isLandscape = props.isLandscape;
  var onMoveCard = props.onMoveCard;""",
    """  // 53.85 Duo: beside the board (board | 3D Cover) the Cover's pane is taller than wide — lay it out as the upright
  // Cover Flow (big cards, two neighbours each side, easy to swipe), whatever way the phone is held
  var onToggleZenMode = props.onToggleZenMode;
  var isLandscape = props.isLandscape && !(typeof document !== 'undefined' && document.documentElement.classList.contains('duo-cover'));
  var onMoveCard = props.onMoveCard;""")
SRC.write_text(s, encoding='utf-8'); print('patched Duo cover hooks')
