from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[2]
FILES=['iPhone53.8241.html','iphone.html','index.html','iPhoneDuo.html','ipad.html','ios/Minest/Minest/iphone.html','ios/Minest/Minest/iphone18.0.html','ios/Minest/Minest/ipad.html','ios/MinestProject/MyApp/iphone.html']
css='<style id="mn-board-center-css">\n'+(ROOT/'tools/live-perf/board_center.css').read_text()+'\n</style>'
for name in FILES:
 p=ROOT/name;t=p.read_text()
 if 'id="mn-board-center-css"' in t:
  t=re.sub(r'<style id="mn-board-center-css">[\s\S]*?</style>',lambda _:css,t);p.write_text(t);continue
 a=t.index('var Me = function(props) {');b=t.index('// 41.0: Natural language',a);end=t.rfind('// =========================================================================',a,b)
 part=t[a:end]
 def sub(old,new,count=1):
  global part
  if part.count(old)!=count:raise ValueError(f'{name}: {part.count(old)} matches: {old[:80]}')
  part=part.replace(old,new)
 sub('  var onCreateBoard = props.onCreateBoard;', '  var onCreateBoard = props.onCreateBoard;\n  var onUpdateBoard = props.onUpdateBoard;')
 sub('        bFound.workspace = ren;\n', '')
 sub('                          b.workspace = ren;\n', '')
 sub("                          b.workspace = 'General';\n", '')
 sub("  var isDark = themeMode === 'dark';",'''  var isDark = themeMode === 'dark';
  var hubRef = (0, _.useRef)(null);
  var hubFullState = (0, _.useState)(false), hubFull = hubFullState[0], setHubFull = hubFullState[1];
  var hubSearchState = (0, _.useState)(''), hubSearch = hubSearchState[0], setHubSearch = hubSearchState[1];
  var hubScopeState = (0, _.useState)('all'), hubScope = hubScopeState[0], setHubScope = hubScopeState[1];
  var hubRecentsState = (0, _.useState)(function() { try { var r = JSON.parse(localStorage.getItem('minest.boardRecents.v1') || '[]'); return Array.isArray(r) ? r : []; } catch(e) { return []; } }), hubRecents = hubRecentsState[0];
  var openHubBoard = function(b) {
    try { localStorage.setItem('minest.boardRecents.v1', JSON.stringify([b.id].concat(hubRecents.filter(function(id) { return id !== b.id; })).slice(0,24))); } catch(e) {}
    onSelectBoard(b.id); SoundEngine.play('click'); onClose();
  };
  (0, _.useEffect)(function() {
    var previous = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    var input = hubRef.current && hubRef.current.querySelector('[data-hub-search]'); if(input) input.focus();
    var keys = function(e) {
      if(e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); return; }
      if(e.key !== 'Tab' || !hubRef.current) return;
      var nodes = Array.from(hubRef.current.querySelectorAll('button:not([disabled]),input:not([disabled]),select,a[href]')).filter(function(n) {return n.getClientRects().length && n.type !== 'hidden';});
      var first = nodes[0], last = nodes[nodes.length-1];
      if(e.shiftKey && (document.activeElement === first || !hubRef.current.contains(document.activeElement))) {e.preventDefault();if(last)last.focus();}
      else if(!e.shiftKey && (document.activeElement === last || !hubRef.current.contains(document.activeElement))) {e.preventDefault();if(first)first.focus();}
    };
    document.addEventListener('keydown', keys, true);
    return function() {document.body.style.overflow = overflow;document.removeEventListener('keydown',keys,true);if(previous && previous.isConnected)previous.focus({preventScroll:true});};
  }, []);''')
 sub('  var activeBoard = boards.find', '''  var displayedBoards = filteredBoards.filter(function(b) {
    return (!hubSearch.trim() || ((b.title || '') + ' ' + (b.workspace || 'General')).toLowerCase().includes(hubSearch.trim().toLowerCase())) && (hubScope !== 'starred' || !!b.starred) && (hubScope !== 'recent' || b.id === activeBoardId || hubRecents.includes(b.id));
  });
  if(hubScope === 'recent') displayedBoards.sort(function(a,b) {var order=[activeBoardId].concat(hubRecents);return order.indexOf(a.id)-order.indexOf(b.id);});
  var activeBoard = boards.find''')
 sub("  return (0, P.jsxs)('div', {\n    onClick:", "  var hub = (0, P.jsxs)('div', {\n    ref: hubRef, role: 'dialog', 'aria-modal': true, 'aria-label': 'Board Center',\n    onClick:")
 sub('children: ["Workspace",', 'children: ["Boards",')
 sub('          // ☁️ Sync now:', "          (0, P.jsx)('button', {type:'button',className:'mn-hub-full',title:hubFull?'Exit fullscreen':'Expand to fullscreen','aria-label':hubFull?'Exit fullscreen':'Expand to fullscreen',onClick:function(){setHubFull(!hubFull);},children:hubFull?'↙':'⛶'}),\n          // ☁️ Sync now:")
 sub('            onClick: onClose,\n            className:', "            onClick: onClose, 'aria-label': 'Close Board Center',\n            className:")
 sub('      // Workspace Filter Tabs & New Folder Button', '''      (0, P.jsxs)('div', {className:'mn-hub-tools',children:[
        (0, P.jsx)('input', {'data-hub-search':true,type:'search',value:hubSearch,'aria-label':'Search boards',placeholder:'Search boards or workspaces...',onChange:function(e){setHubSearch(e.target.value);}}),
        (0, P.jsx)('div', {className:'mn-hub-scopes',children:[['all','All boards'],['starred','★ Starred'],['recent','◷ Recent']].map(function(s){return (0,P.jsx)('button',{type:'button','aria-pressed':hubScope===s[0],onClick:function(){setHubScope(s[0]);},children:s[1]},s[0]);})})
      ]}),
      // Workspace Filter Tabs & New Folder Button''')
 sub('children: filteredBoards.map(function(b) {', 'children: displayedBoards.length ? displayedBoards.map(function(b) {')
 sub("onClick: function() { if (isActionsExpanded) return; onSelectBoard(b.id); SoundEngine.play('click'); onClose(); },", "onClick: function() { if (isActionsExpanded) return; openHubBoard(b); },")
 # The helper itself must still delegate directly rather than recurse.
 sub('    openHubBoard(b);\n  };', "    onSelectBoard(b.id); SoundEngine.play('click'); onClose();\n  };") if '    openHubBoard(b);\n  };' in part else None
 old="              (0, P.jsx)('div', { className: \"mn-ws-avatar\", 'aria-hidden': \"true\", children: String(b.title || '?').trim().charAt(0).toUpperCase() }),"
 sub(old,'''              (0, P.jsxs)('button', {type:'button',className:'mn-ws-avatar mn-hub-cover','aria-label':'Open '+b.title,'aria-current':isCurrent?'page':undefined,onClick:function(e){e.stopPropagation();openHubBoard(b);},children:[
                String(b.title || '?').trim().charAt(0).toUpperCase(),
                typeof b.wallpaper === 'string' && /^(https?:|data:image\\/|blob:)/i.test(b.wallpaper) ? (0,P.jsx)('img',{src:b.wallpaper,alt:'',loading:'lazy',decoding:'async',onError:function(e){e.currentTarget.style.display='none';}}) : null
              ]}),
              (0,P.jsx)('button',{type:'button',className:'mn-hub-star','aria-label':(b.starred?'Unstar ':'Star ')+b.title,'aria-pressed':!!b.starred,onClick:function(e){e.stopPropagation();if(onUpdateBoard)onUpdateBoard(Object.assign({},b,{starred:!b.starred}));},children:b.starred?'★':'☆'}),''')
 sub('        })\n      }),\n\n      // Archived Boards', "        }) : (0,P.jsx)('div',{className:'mn-hub-empty',role:'status',children:hubSearch?'No boards match this search.':hubScope==='starred'?'Star a board to keep it here.':hubScope==='recent'?'Boards you open appear here.':'No boards in this workspace yet. Create one below.'})\n      }),\n\n      // Archived Boards")
 sub('        className: "space-y-2",\n        children: [\n          (0, P.jsxs)(\'button\'', '        className: "mn-hub-archive space-y-2",\n        children: [\n          (0, P.jsxs)(\'button\'')
 sub('          className: "w-full flex items-center gap-1.5",', '          className: "mn-hub-clipboard w-full flex items-center gap-1.5",')
 sub('onCreateBoard(newTitle.trim());', "onCreateBoard(newTitle.trim(), activeWorkspace === 'all' ? 'General' : activeWorkspace);")
 # Change only the final component return boundary.
 old='    ]\n  });\n};\n\n'
 sub(old,"    ]\n  });\n  return m().createPortal((0,P.jsx)('div',{className:'mn-board-hub'+(hubFull?' is-full':''),onClick:function(e){if(e.target===e.currentTarget)onClose();},children:hub}),document.body);\n};\n\n")
 t=t[:a]+part+t[end:]
 old="if (boardPickerRef.current && !boardPickerRef.current.contains(e.target)) {"
 assert t.count(old)==1;t=t.replace(old,"if (boardPickerRef.current && !boardPickerRef.current.contains(e.target) && !(e.target.closest && e.target.closest('.mn-board-hub'))) {")
 old='  var createNewBoard = (0, _.useCallback)(function(title) {';assert t.count(old)==1;t=t.replace(old,'  var createNewBoard = (0, _.useCallback)(function(title, workspace) {')
 old='      title: title,\n      columns: [\n        { id: "col-" + Date.now()';assert t.count(old)==1;t=t.replace(old,'      title: title,\n      workspace: workspace || \'General\',\n      columns: [\n        { id: "col-" + Date.now()')
 old='  var onOpenBoardPicker = props.onOpenBoardPicker;';assert t.count(old)==1;t=t.replace(old,old+'\n  var onManageBoard = props.onManageBoard;')
 old='                onSelectBoard: onSelectBoard,\n                onCreateBoard: onCreateBoard,';assert t.count(old)==1;t=t.replace(old,old+'\n                onUpdateBoard: onManageBoard,')
 old='        onSelectBoard: setActiveBoardId,\n        onCreateBoard: createNewBoard,';assert t.count(old)==1;t=t.replace(old,old+'\n        onManageBoard: function(updatedBoard) { setBoards(function(list) { var next = list.map(function(b) { return b.id === updatedBoard.id ? Object.assign({}, b, updatedBoard) : b; }); pushHistory(next); return next; }); },')
 # Route a small desktop launcher to the existing picker state, with no new content store.
 old="  var boardColorOpenState = (0, _.useState)(false);";assert t.count(old)==1;t=t.replace(old,"  (0, _.useEffect)(function() { var open=function(){setIsBoardPickerOpen(true);};window.addEventListener('minest:open-boards',open);return function(){window.removeEventListener('minest:open-boards',open);};}, []);\n"+old)
 launcher='''<script id="mn-board-center-launcher">(function(){function ready(){var b=document.createElement('button');b.type='button';b.className='mn-board-launcher';b.textContent='▦ Boards';b.title='Manage boards and workspaces';b.addEventListener('click',function(){window.dispatchEvent(new Event('minest:open-boards'));});document.body.appendChild(b);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();})();</script>'''
 t=t.replace('</body>',css+'\n'+launcher+'\n</body>')
 p.write_text(t);print(name)
