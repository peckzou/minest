"""Refresh the integrated image-view module in Minest's actual web/native entries."""
from pathlib import Path
import argparse

parser=argparse.ArgumentParser()
parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[3])
args=parser.parse_args();root=args.root;source=Path(__file__).resolve().parent
module=(source/'image-views.js').read_text().rstrip();css=(source/'image-views.css').read_text().rstrip()
entries=['iphone.html','index.html','ipad.html','iPhoneDuo.html','iPhone53.8241.html','ios/Minest/Minest/iphone.html','ios/Minest/Minest/iphone18.0.html','ios/Minest/Minest/ipad.html']
for name in entries:
 path=root/name;text=path.read_text()
 start=text.index('/* Minest Image Views & Cover Flow Integration V1.0.')
 finish=text.index('window.MinestImageViews = MinestImageViews;',start)+len('window.MinestImageViews = MinestImageViews;')
 text=text[:start]+module+text[finish:]
 start=text.index('<style id="minest-image-views-v1">')+len('<style id="minest-image-views-v1">');finish=text.index('</style>',start)
 text=text[:start]+'\n'+css+'\n'+text[finish:]
 anchor='board: activeBoard, mode: viewMode, selectedColFilter: selectedColFilter, searchTerm: searchTerm,'
 if 'onUpdateBoard: function(updater) { updateActiveBoard(updater); }' not in text:
  if text.count(anchor)!=1:raise RuntimeError('Photo router changed: '+name)
  text=text.replace(anchor,anchor+'\n            onSearchChange: setSearchTerm, onOpenCloudSync: function() { setIsCloudModalOpen(true); },\n            onUpdateBoard: function(updater) { updateActiveBoard(updater); },')
 if 'photoAlbums: Array.isArray(b.photoAlbums)' not in text:
  marker='        linkedBoardIds: Array.isArray(b.linkedBoardIds) ? b.linkedBoardIds : [],'
  if text.count(marker)!=1:raise RuntimeError('Board sanitizer changed: '+name)
  text=text.replace(marker,marker+'\n        photoAlbums: Array.isArray(b.photoAlbums) ? b.photoAlbums.filter(function(a) { return a && typeof a.id === "string" && typeof a.title === "string" && Array.isArray(a.cardIds); }) : undefined,')
 text=text.replace("!el.closest('.miv-view')", "!el.closest('.miv-view,.miv-viewer')")
 text=text.replace("!e.target.closest('.miv-view')", "!e.target.closest('.miv-view,.miv-viewer')")
 head,flow=text.split('var Oe = function(props) {',1)
 if "window.addEventListener('minest:image-assets', refresh)" not in flow:
  flow=flow.replace("window.addEventListener('minest:image-filters', refresh);", "window.addEventListener('minest:image-filters', refresh);\n    window.addEventListener('minest:image-assets', refresh);",1)
  flow=flow.replace("window.removeEventListener('minest:image-filters', refresh);", "window.removeEventListener('minest:image-filters', refresh); window.removeEventListener('minest:image-assets', refresh);",1)
 if '// Photo cloud thumbnails use the visible Cover Flow window.' not in flow:
  anchor='  var reconcilingImageSelection = (0, _.useRef)(false);'
  hook="""  // Photo cloud thumbnails use the visible Cover Flow window.
  (0, _.useEffect)(function() {
    cards.slice(Math.max(0, activeIdx - 3), activeIdx + 4).forEach(function(card) {
      var im = MinestImageViews.image(card);
      if (im.asset) MinestImageViews.cloudAsset(im.asset, false).catch(function() {});
    });
  }, [cards, activeIdx]);
"""
  if flow.count(anchor)!=1:raise RuntimeError('Cover Flow selection changed: '+name)
  flow=flow.replace(anchor,hook+anchor,1)
 flow=flow.replace('card: cards[activeIdx], canPrev:', 'card: cards[activeIdx], cards: cards, onGo: setActiveIdx, canPrev:',1)
 text=head+'var Oe = function(props) {'+flow
 path.write_text(text);print('Updated:',name)
