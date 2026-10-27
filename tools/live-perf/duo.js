/* 53.84 Duo · Minest on iPhone Fold: the outer screen is light, the inner screen is the whole app.
   On: iPhoneDuo.html, or an iPhone that once unfolded (see enabled()); a normal iPhone or an iPad never sees any of this.
   Which screen: the shorter side ≥ 600 pt and the shape near square (long / short < 1.5) = inner (unfolded); anything
   else = outer (folded, phone shaped). It is checked again on every resize, so folding / unfolding switches live.
   Outer: a Glance page opens over the app — the flashcard on show (CarPlay / GPT Study list: ◀ ▶ ★ ✓, tap to turn),
   Today (cards due today or overdue: tap ✓ to finish, the name to open), Quick add (a card into a list). "Full app"
   hides it until the phone is unfolded and folded again.
   Inner: the whole app; ▥ splits it — My World docks on the right half, the board stays on the left. */
(function(){'use strict';
if (window.MinestDuo) return;
var PK = 'minest.duo.v1';
function prefs(){ try { return JSON.parse(localStorage.getItem(PK) || '{}') || {}; } catch(e){ return {}; } }
function setPref(k, v){ var p = prefs(); p[k] = v; try { localStorage.setItem(PK, JSON.stringify(p)); } catch(e){} }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function plain(s){ var d = document.createElement('div'); d.innerHTML = String(s || ''); return (d.textContent || '').replace(/\s+/g, ' ').trim(); }
function today(){ var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function boards(){ try { return (window.MinestAI && MinestAI.boards && MinestAI.boards()) || []; } catch(e){ return []; } }
function hap(){ try { if (navigator.vibrate) navigator.vibrate(8); } catch(e){} }

var kind = null, gl = null, dismissed = false, back = false, booted = false;
/* fold-aware when the browser can tell (Viewport Segments: two segments = open across the hinge; Device Posture
   'folded' = half-open), responsive otherwise: the shorter side ≥ 600 pt and a near-square shape = the inner screen */
function segments(){ try { if (matchMedia('(horizontal-viewport-segments: 2), (vertical-viewport-segments: 2)').matches) return 2; } catch(e){} try { var v = window.viewport && window.viewport.segments; if (v && v.length > 1) return v.length; } catch(e){} return 1; }
function posture(){ var h = window.__minestHinge; if (h && h.status === 'partial') return 'folded'; try { return navigator.devicePosture && navigator.devicePosture.type || ''; } catch(e){ return ''; } }
/* measured on the real iPhone Fold (2026-10-26): the inner screen is 951 × 669 pt held sideways (1 : 1.42); the outer
   screen is 466 × 678 — almost as square, so the size decides: the inner one is the only one with a short side ≥ 600 */
function screenKind(){ if (segments() > 1) return 'inner'; var w = innerWidth, h = innerHeight, mn = Math.min(w, h), mx = Math.max(w, h); return mn >= 600 && mx / mn < 1.6 ? 'inner' : 'outer'; }
/* two panes need room: the inner screen held upright (466 wide) stays one pane, turned (678+) it can split */
function tall(){ return innerHeight > innerWidth; }
/* held upright the hinge runs across: the two panes go top | bottom (each needs 640 pt along the long side) */
function splitFits(){ return kind === 'inner' && (tall() ? innerHeight >= 640 : innerWidth >= 640); }
function markTall(){
  var R = document.documentElement, v = kind === 'inner' && tall();
  if (R.classList.contains('duo-tall') !== v) { R.classList.toggle('duo-tall', v); relayout(); }
  var m = document.querySelector('#root main'); if (m) R.style.setProperty('--duo-mt', Math.round(m.getBoundingClientRect().top) + 'px');
}
var lastFit = null;
function apply(){
  var k = screenKind(), changed = k !== kind; kind = k; var fit = splitFits(); markTall();
  if (!changed && fit === lastFit) return; lastFit = fit;
  var r = document.documentElement;
  if (!changed) { var w0 = r.classList.contains('duo-split'); r.classList.toggle('duo-split', fit && !!prefs().split); if (w0 !== r.classList.contains('duo-split')) relayout(); splitBtn(); rightPane(); if (fit && prefs().split) openWorld(); return; }
  r.classList.toggle('duo-outer', k === 'outer'); r.classList.toggle('duo-inner', k === 'inner');
  var was = r.classList.contains('duo-split');
  r.classList.toggle('duo-split', fit && !!prefs().split);
  if (was !== r.classList.contains('duo-split')) relayout();
  var first = !booted; booted = true;
  /* the app can be reloaded by the fold itself: the last screen is kept, so a page that wakes up on the inner screen
     right after the outer one still counts as unfolding */
  var last = null; try { last = JSON.parse(localStorage.getItem('minest.duo.kind') || 'null'); } catch(e){}
  var unfolded = k === 'inner' && (!first || (last && last.k === 'outer' && Date.now() - last.at < 30 * 60000));
  try { localStorage.setItem('minest.duo.kind', JSON.stringify({ k: k, at: Date.now() })); } catch(e){}
  if (k === 'outer') {
    coverOn(false);   /* folded: the quick Glance page comes up (what you were doing stays under it — 完整 App › goes back), unless you are in
                           the middle of something: placing a piece, the build library or the study desk */
    var busy = !!(desk || document.querySelector('.mn-bq, .duo-lib') || (window.MinestDuoWorld && MinestDuoWorld.holding && MinestDuoWorld.holding()));
    if (!busy) { dismissed = false; glance(); } else dismissed = true;
  }
  else { closeGlance(); if (!unfolded && fit && prefs().split) openWorld(); }
  document.documentElement.classList.toggle('duo-halfopen', posture() === 'folded');
  splitBtn(); pill(); rightPane(); deskBtn(); dvTag(); rail();
  if (unfolded) onUnfold();
}
/* unfolding, by what you were in: studying folded → the desk; My World → its island on the left, the Builder on the
   right; the board → the board on the left, its 3D Cover on the right (a card picked on the board turns the Cover to it) */
function onUnfold(){
  if (Date.now() - flashAt < 120000 && !desk) return deskOpen();
  if (hingeKnown()) return;   /* with a hinge to read, opening flat stays full screen; the two panes come with a slight fold (onHinge) */
  twoPane();
}
function twoPane(){
  dlog('twoPane desk=' + !!desk + ' dv=' + !!document.querySelector('.dv') + ' vl=' + !!document.querySelector('.pk.vl') + ' world=' + worldOpen() + ' dsp=' + !!document.querySelector('.mn-dsp'));
  if (desk || document.querySelector('.dv, .pk.vl')) return;
  if (worldOpen() || document.querySelector('.mn-dsp')) return autoBuild();
  try { if (MinestAI.viewMode && MinestAI.viewMode() !== 'board') MinestAI.setViewMode('board'); } catch(e){}
  if (prefs().split) { setPref('split', false); document.documentElement.classList.remove('duo-split'); relayout(); }
  setTimeout(function(){ coverOn(true); }, 250);
}

/* ---------- the flashcard on show: the list studied last (GPT Study), else the first list that can play */
function studyList(){
  var CF = window.MinestCarFlash, G = window.MinestGPTStudy; if (!CF) return null;
  var src = CF.sources(); if (!src.length) return null;
  var best = null, bestAt = -1, rec = null;
  try { rec = JSON.parse(localStorage.getItem('minest.gptstudy.v1') || 'null'); } catch(e){}
  src.forEach(function(s){ var L = rec && rec.lists && rec.lists[s.id]; var at = L ? (L.last || 0) : -1; if (at > bestAt) { bestAt = at; best = s; } });
  var s = best || src[0], items = CF.itemsOf(s, 'auto');
  return items.length ? { s: s, items: items, L: G && G.get ? G.get(s.id) : null } : null;
}
function cardOf(s, id){ var c = null; (s.cards || []).some(function(x, i){ if (String(x.id != null ? x.id : 'i' + i) === String(id).replace(/#\d+$/, '')) { c = x; return true; } return false; }); return c; }
function studyHtml(){
  var t = studyList();
  if (!t) return '<section class="duo-c"><h3>🃏 闪卡</h3><p class="duo-m">还没有词表。在看板里加一个 list 就能在这里学。</p></section>';
  var L = t.L, id = L && L.current, it = null;
  t.items.some(function(x){ if (x.id === id) { it = x; return true; } return false; });
  var c = it ? cardOf(t.s, it.id) : null, rc = L && it ? (L.cards || {})[it.id] || {} : {};
  var backText = c ? plain(c.en || c.desc || c.description || c.back || c.meaning || '') : '';
  var pos = it ? t.items.indexOf(it) + 1 : 0;
  return '<section class="duo-c duo-fc"><h3>🃏 闪卡 <small>' + esc(t.s.title) + (pos ? ' · ' + pos + '/' + t.items.length : '') + '</small></h3>' +
    (it ? '<button type="button" class="duo-card" data-duo-turn><b>' + esc(it.word) + '</b>' + (backText ? '<span class="back">' + esc(backText.slice(0, 160)) + '</span>' : '') + '</button>' +
      '<div class="duo-row"><button type="button" data-duo-act="prev" aria-label="上一张">◀</button><button type="button" data-duo-act="star" class="' + (rc.star ? 'on' : '') + '" aria-label="收藏">★</button>' +
      '<button type="button" data-duo-act="learned" class="' + (rc.learned ? 'on' : '') + '" aria-label="学会了">✓</button><button type="button" data-duo-act="next" class="go" aria-label="下一张">▶</button></div>'
      : '<button type="button" class="duo-go" data-duo-act="continue">▶ 开始学「' + esc(t.s.title) + '」</button>') +
    '<div class="duo-row2"><button type="button" class="duo-link" data-duo-desk>📚 学习书桌</button><button type="button" class="duo-link" data-duo-car>🚗 车载闪卡</button></div></section>';
}
/* ---------- Today: cards with a date of today or earlier that are not done */
function dueCards(){
  var d = today(), out = [];
  boards().forEach(function(b){ (b.columns || []).forEach(function(col){ (col.cards || []).forEach(function(c){
    if (c && !c.complete && c.date && String(c.date).slice(0, 10) <= d) out.push({ c: c, b: b, col: col, late: String(c.date).slice(0, 10) < d });
  }); }); });
  return out.sort(function(a, b){ return String(a.c.date).localeCompare(String(b.c.date)); });
}
function todayHtml(){
  var due = dueCards();
  return '<section class="duo-c"><h3>📅 今日任务 <small>' + (due.length ? due.length + ' 项' : '') + '</small></h3>' +
    (due.length ? '<ul class="duo-due">' + due.slice(0, 8).map(function(x){
      return '<li><button type="button" class="ck" data-duo-done="' + esc(x.c.id) + '" aria-label="完成">○</button><button type="button" class="t" data-duo-open="' + esc(x.c.id) + '">' + esc(plain(x.c.title) || '卡片') + '<small>' + esc(x.col.title || '') + (x.late ? ' · 已过期' : '') + '</small></button></li>';
    }).join('') + '</ul>' + (due.length > 8 ? '<p class="duo-m">还有 ' + (due.length - 8) + ' 项，在完整 App 里看。</p>' : '') : '<p class="duo-m">今天没有到期的卡片 🎉</p>') + '</section>';
}
/* ---------- Quick add */
function lists(){ var out = []; boards().forEach(function(b){ (b.columns || []).forEach(function(col){ out.push({ v: b.id + '|' + col.id, n: (b.title || 'Board') + ' › ' + (col.title || 'List') }); }); }); return out; }
function addHtml(){
  var L = lists(), last = prefs().list, cur = null;
  try { var ab = MinestAI.board(); if (ab && ab.columns && ab.columns[0]) cur = ab.id + '|' + ab.columns[0].id; } catch(e){}
  var sel = L.some(function(x){ return x.v === last; }) ? last : cur;
  return '<section class="duo-c"><h3>＋ 快速加卡片</h3><form class="duo-add" data-duo-add><input type="text" name="t" placeholder="写一句，回车加入" autocomplete="off" enterkeyhint="done">' +
    '<select name="l" aria-label="加到哪个 list">' + L.map(function(x){ return '<option value="' + esc(x.v) + '"' + (x.v === sel ? ' selected' : '') + '>' + esc(x.n) + '</option>'; }).join('') + '</select>' +
    '<button type="submit" class="duo-go">加入</button></form></section>';
}

function paint(){
  if (!gl) return;
  gl.querySelector('.duo-body').innerHTML = studyHtml() + todayHtml() + addHtml();
}
function glance(){
  if (!gl) {
    gl = document.createElement('div'); gl.className = 'duo-gl'; gl.setAttribute('role', 'dialog'); gl.setAttribute('aria-label', '速览');
    gl.innerHTML = '<header class="duo-top"><b>Minest · 速览</b><button type="button" class="duo-full" data-duo-full>完整 App ›</button></header><div class="duo-body"></div>';
    document.body.appendChild(gl);
    gl.addEventListener('click', onClick); gl.addEventListener('submit', onAdd);
  }
  gl.hidden = false; back = false; paint();
}
function closeGlance(){ if (gl) gl.hidden = true; }
function later(){ setTimeout(paint, 120); }
function onClick(e){
  var t = e.target, b;
  if (t.closest('[data-duo-full]')) { dismissed = true; closeGlance(); pill(); return; }
  if ((b = t.closest('[data-duo-turn]'))) { b.classList.toggle('show'); return; }
  if ((b = t.closest('[data-duo-act]'))) {
    var s = studyList(), G = window.MinestGPTStudy; if (!s || !G) return;
    G.act(s.s.id, s.s.title, s.items, b.getAttribute('data-duo-act')); flashAt = Date.now(); hap(); paint(); if (desk) deskDraw(); return;
  }
  if (t.closest('[data-duo-desk]')) { var sl = studyList(); deskOpen(sl && sl.s.id); return; }
  if (t.closest('[data-duo-car]')) { dismissed = true; closeGlance(); pill(); try { MinestCarFlash.open(); } catch(x){} return; }
  if ((b = t.closest('[data-duo-done]'))) { var id = b.getAttribute('data-duo-done'); b.textContent = '✓'; hap(); try { MinestAI.patchCard(id, { complete: true }); } catch(x){} setTimeout(paint, 350); return; }
  if ((b = t.closest('[data-duo-open]'))) { dismissed = true; closeGlance(); pill(); try { MinestAI.setViewMode('board'); MinestAI.openCard(b.getAttribute('data-duo-open')); } catch(x){} return; }
}
function onAdd(e){
  e.preventDefault();
  var f = e.target, title = (f.t.value || '').trim(), v = f.l.value || ''; if (!title || !v) { f.t.focus(); return; }
  var p = v.split('|'), bid = p[0], cid = p[1], card = { id: 'c-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: title, desc: '', labels: [], complete: false, checklistItems: [], createdAt: Date.now() };
  setPref('list', v);
  try { MinestAI.updateBoard(bid, function(b){ return Object.assign({}, b, { columns: (b.columns || []).map(function(c){ return c.id === cid ? Object.assign({}, c, { cards: [card].concat(c.cards || []) }) : c; }) }); }); } catch(x){ return; }
  hap(); f.t.value = ''; var n = f.querySelector('.duo-go'); n.textContent = '✓ 已加入'; setTimeout(function(){ if (n.isConnected) n.textContent = '加入'; }, 1400);
}
/* the way back to Glance on the outer screen once it was put away */
function pill(){
  var p = document.querySelector('.duo-back');
  if (kind !== 'outer' || !dismissed) { if (p) p.remove(); return; }
  if (!p) { p = document.createElement('button'); p.type = 'button'; p.className = 'duo-back'; p.textContent = '⌂ 速览'; p.setAttribute('aria-label', '回到速览'); document.body.appendChild(p);
    p.addEventListener('click', function(){ dismissed = false; p.remove(); glance(); }); }
}

/* the panes changed size without the window doing so: let everything that sizes itself on resize (the island camera
   keeps its focus, see world_duo.js) measure again, on the next frame */
function relayout(){ requestAnimationFrame(function(){ try { window.dispatchEvent(new Event('resize')); } catch(e){} }); }

/* ---------- inner screen: ▥ split — My World on the right half, the board on the left */
function splitBtn(){
  var b = document.querySelector('.duo-split-b');
  if (true) { if (b) b.remove(); return; }   /* no floating button any more: split from the rail, or by unfolding */
  if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'duo-split-b'; document.body.appendChild(b);
    b.addEventListener('click', toggleSplit); }
  var on = !!prefs().split; b.textContent = on ? '▣ 全屏' : '▥ 分栏'; b.setAttribute('aria-label', on ? '取消分栏' : '分栏：左边看板，右边 My World');
  b.classList.toggle('on', on);
}

/* the hinge (native UIHingeInteraction → 'minest:hinge'): opened flat and then folded a little ("partial") brings the two
   panes for what you are in — My World: island | Builder, the board: board | 3D Cover; opening it flat again goes back to
   full screen if the fold had made the panes */
var byHinge = false, hingeStatus = '';
/* a short log of what Duo saw and did (localStorage 'minest.duo.log', last 40) — read on the device to see why a fold did nothing */
function dlog(m){ try { var L = JSON.parse(localStorage.getItem('minest.duo.log') || '[]'); L.push(new Date().toTimeString().slice(0, 8) + ' ' + m); localStorage.setItem('minest.duo.log', JSON.stringify(L.slice(-40))); } catch(e){} }
function hingeKnown(){ try { return localStorage.getItem('minest.duo.hinge') === '1'; } catch(e){ return false; } }
function onHinge(h){
  try { localStorage.setItem('minest.duo.hinge', '1'); } catch(e){}
  var st = h && h.status || ''; if (st === hingeStatus) return; var was = hingeStatus; hingeStatus = st;
  dlog('hinge ' + (was || '-') + '→' + (st || 'none') + ' kind=' + kind + ' ' + innerWidth + 'x' + innerHeight + ' world=' + worldOpen() + ' dsp=' + !!document.querySelector('.mn-dsp'));
  document.documentElement.classList.toggle('duo-halfopen', st === 'partial');
  if (!on) return;
  apply();
  if (kind !== 'inner') return;
  if (st === 'partial' && was !== 'partial') {
    var R = document.documentElement; if (R.classList.contains('duo-cover') || R.classList.contains('duo-build')) return;
    byHinge = true; twoPane();
  } else if (st === 'open' && was === 'partial' && byHinge) {
    byHinge = false; coverOn(false);
    try { if (window.MinestDuoWorld && MinestDuoWorld.libOn && MinestDuoWorld.libOn()) document.querySelector('.duo-lib [data-dlx]').click(); } catch(e){}
    if (prefs().split) { setPref('split', false); document.documentElement.classList.remove('duo-split'); relayout(); }
    rail(); rightPane();
  }
}
window.addEventListener('minest:hinge', function(e){ onHinge(e.detail); });

/* board | 3D Cover: both of the app's own views stay mounted side by side (SpatialFold's two slots) */
function coverOn(v){
  var r = document.documentElement; v = !!v && kind === 'inner';
  if (v === r.classList.contains('duo-cover')) { if (v) try { if (!document.querySelector('.sf-slot[data-sf-view="coverflow"]')) SpatialFold.dual(true); } catch(e){} return; }
  r.classList.toggle('duo-cover', v); try { SpatialFold.dual(v); } catch(e){} relayout(); rail();
  if (v) setTimeout(function(){ sentCol = null; var id = visibleList(); if (id) sendList(id); }, 500); else { sentCol = null; window.dispatchEvent(new CustomEvent('minest:cf-list', { detail: { colId: null } })); }
}
document.addEventListener('click', function(e){
  if (!document.documentElement.classList.contains('duo-cover') || !e.target.closest) return;
  var a = e.target.closest('.sf-slot[data-sf-view="board"] article[data-card-id]'); if (!a) return;
  var base = a.closest('.card-stack-base'), top = base && base.querySelector('article.kanban-card'), col = a.closest('[data-col-id]');
  if (col) sendList(col.getAttribute('data-col-id'));
  var id = (top || a).getAttribute('data-card-id');
  setTimeout(function(){ window.dispatchEvent(new CustomEvent('minest:cf-goto', { detail: { cardId: id } })); }, 90);
}, true);
/* the list on screen in the board pane → the Cover shows that list */
var sentCol = null;
function sendList(id){ if (id === sentCol) return; sentCol = id; window.dispatchEvent(new CustomEvent('minest:cf-list', { detail: { colId: id } })); }
function visibleList(){
  var pane = document.querySelector('.sf-slot[data-sf-view="board"]'); if (!pane) return null;
  var pr = pane.getBoundingClientRect(), best = null, bd = 1e9;
  [].forEach.call(pane.querySelectorAll('.kanban-column-wrapper[data-col-id]'), function(c){ var r = c.getBoundingClientRect(); if (r.width < 40) return; var d = Math.abs(r.left - pr.left - 16); if (r.right > pr.left + 40 && r.left < pr.right - 40 && d < bd) { bd = d; best = c; } });
  return best && best.getAttribute('data-col-id');
}
var lsQ = false;
document.addEventListener('scroll', function(){ if (lsQ || !document.documentElement.classList.contains('duo-cover')) return; lsQ = true; setTimeout(function(){ lsQ = false; var id = visibleList(); if (id) sendList(id); }, 160); }, true);
document.addEventListener('visibilitychange', function(){ if (on && !document.hidden) { apply(); rail(); } });
function toggleSplit(){ if (document.documentElement.classList.contains('duo-cover')) { coverOn(false); return rail(); } var on = !prefs().split; setPref('split', on); document.documentElement.classList.toggle('duo-split', on); relayout(); splitBtn(); rail(); hap(); setTimeout(rightPane, 600); if (on) openWorld(); }

/* the tool rail (split view only): held sideways, iOS keeps a column on the right for the clock — the tools live there,
   under it, in a liquid-glass capsule, instead of floating over the content (▥ split, 📚 desk, 🏝 My World, ⌂ Glance). Without that column (upright), the floating
   buttons at the bottom left stay. */
function sarPx(){ var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sar')); if (!(v > 0)) { try { var t = document.createElement('div'); t.style.cssText = 'position:fixed;width:env(safe-area-inset-right);height:0'; document.body.appendChild(t); v = t.getBoundingClientRect().width; t.remove(); } catch(e){ v = 0; } } return v || 0; }
/* full screen (inner sideways, or the outer screen): the Dock lives in the right column under the clock (scrolls when it does not fit),
   and the board stops short of it */
function dockPin(){
  var R0 = document.documentElement, sar = sarPx(), want = on && (kind === 'outer' || !tall()) && sar >= 44 && !['duo-split', 'duo-cover', 'duo-build'].some(function(c){ return R0.classList.contains(c); });
  R0.classList.toggle('duo-dockpin', !!want);
  if (want) R0.style.setProperty('--duo-dock', Math.round(sar) + 'px');
}
/* the Dock's list filter (≡) and wallpaper (🎨) move into Settings Studio: the two icons are hidden (duo.css), two buttons under its tabs */
var DOCK_MOVED = [['lists', /^Filter by list/, '☰', 'Lists'], ['wall', /^Board Wallpaper/, '🎨', 'Wallpaper']];
function appBtn(re){ var all = document.querySelectorAll('.mn-rgroup button, .mn-dockrow button, header.iphone-topbar button'); for (var i = 0; i < all.length; i++) if (re.test(all[i].getAttribute('aria-label') || all[i].title || '')) return all[i]; return null; }
function dockMove(sheet){
  if (!on) return;
  if (!sheet) return;
  var tab = [].find.call(document.querySelectorAll('button'), function(b){ return b.textContent.trim() === 'Labels & Filters'; }), bar = tab && tab.parentElement && tab.parentElement.parentElement;
  if (!bar || (bar.nextElementSibling && bar.nextElementSibling.classList.contains('duo-set-tools'))) return;
  var row = document.createElement('div'); row.className = 'duo-set-tools';
  row.innerHTML = DOCK_MOVED.map(function(m, i){ return '<button type="button" data-duo-st="' + i + '"><span>' + m[2] + '</span>' + m[3] + '</button>'; }).join('');
  row.addEventListener('click', function(e){ var b = e.target.closest('[data-duo-st]'); if (!b) return; var m = DOCK_MOVED[+b.getAttribute('data-duo-st')]; hap();
    var x = [].find.call(document.querySelectorAll('button'), function(y){ return y.textContent.trim() === 'Cancel'; }); if (x) x.click();
    setTimeout(function(){ var o = appBtn(m[1]); if (o) o.click(); }, 260); });
  bar.parentNode.insertBefore(row, bar.nextSibling);
}
/* Settings opens from the Dock's gear or the board's own settings button: add the two buttons once it is up */
document.addEventListener('click', function(e){ if (!on || !e.target.closest) return; var b = e.target.closest('button[aria-label^="Board settings"]'); if (!b) return; [250, 600, 1200].forEach(function(t){ setTimeout(function(){ dockMove(true); }, t); }); }, true);
/* a full-screen sheet (Settings, Activity, Arcade…) is up: the pinned Dock steps aside, as the Dock does elsewhere */
function sheetUp(){
  var R0 = document.documentElement; if (!R0.classList.contains('duo-dockpin')) { R0.classList.remove('duo-sheet'); return; }
  var hit = false, els = document.elementsFromPoint ? document.elementsFromPoint(innerWidth * .35, innerHeight / 2) : [];
  for (var i = 0; i < els.length && !hit; i++) { var e = els[i]; if (e === document.body || e === R0 || e.closest('main, .mn-bdock, header, .duo-rail')) continue;
    var r = e.getBoundingClientRect(); if (getComputedStyle(e).position === 'fixed' && r.width >= innerWidth * .8 && r.height >= innerHeight * .8) hit = true; }
  R0.classList.toggle('duo-sheet', hit);
}
document.addEventListener('click', function(){ if (on) [300, 900].forEach(function(t){ setTimeout(sheetUp, t); }); }, true);
function rail(){
  dockPin(); sheetUp();
  var R0 = document.documentElement, r = document.querySelector('.duo-rail'), want = on && kind === 'inner' && (R0.classList.contains('duo-split') || R0.classList.contains('duo-cover')) && sarPx() >= 44;   /* two panes only: full screen keeps the column clear */
  document.documentElement.classList.toggle('duo-rail-on', !!want);
  if (!want) { if (r) r.remove(); return; }
  if (!r) { r = document.createElement('nav'); r.className = 'duo-rail'; r.setAttribute('aria-label', 'Duo 工具'); document.body.appendChild(r);
    r.addEventListener('click', function(e){ var b = e.target.closest('[data-rail]'); if (!b) return; var w = b.getAttribute('data-rail'); hap();
      if (w === 'split') return toggleSplit();
      if (w === 'desk') { if (desk) { desk.remove(); desk = null; document.documentElement.classList.remove('duo-desk-on'); } else deskOpen(); return rail(); }
      if (w === 'world') { if (desk) { desk.remove(); desk = null; document.documentElement.classList.remove('duo-desk-on'); } if (worldOpen()) { try { MinestUniverse.close(); } catch(x){} } else openWorld(); return setTimeout(rail, 400); }
      if (w === 'glance') { if (gl && !gl.hidden) closeGlance(); else { dismissed = false; glance(); } return rail(); }
    }); }
  var sp = !!prefs().split || R0.classList.contains('duo-cover'), html = (splitFits() ? '<button type="button" data-rail="split" class="' + (sp ? 'on' : '') + '" aria-label="' + (sp ? '取消分栏' : '分栏') + '"><i>' + (sp ? '▣' : '▥') + '</i><small>' + (sp ? '全屏' : '分栏') + '</small></button>' : '') +
    '<button type="button" data-rail="desk" class="' + (desk ? 'on' : '') + '" aria-label="学习书桌"><i>📚</i><small>书桌</small></button>' +
    '<button type="button" data-rail="world" class="' + (worldOpen() ? 'on' : '') + '" aria-label="My World"><i>🏝</i><small>岛屿</small></button>' +
    '<button type="button" data-rail="glance" class="' + (gl && !gl.hidden ? 'on' : '') + '" aria-label="速览"><i>⌂</i><small>速览</small></button>';
  if (r.innerHTML !== html) r.innerHTML = html;
}

function autoBuild(){
  if (!splitFits()) { dlog('autoBuild: no room ' + innerWidth); return; }
  coverOn(false);
  if (!prefs().split) { setPref('split', true); document.documentElement.classList.add('duo-split'); relayout(); }
  var bid = null; try { bid = (window.MinestDuoWorld && MinestDuoWorld.board && MinestDuoWorld.board()) || (MinestAI.board() || {}).id; } catch(e){}
  setTimeout(function(){ var ok = 'n/a'; try { if (window.MinestDuoWorld && MinestDuoWorld.buildHere) ok = MinestDuoWorld.buildHere(bid); } catch(e){ ok = 'error ' + e.message; } dlog('autoBuild bid=' + bid + ' → ' + ok + ' lib=' + !!document.querySelector('.duo-lib')); rail(); rightPane(); }, 350);
}

/* the right half when My World is closed: a way back to it instead of an empty half */
function rightPane(){
  var ph = document.querySelector('.duo-rp'), need = splitOn() && !worldOpen();
  if (!need) { if (ph) ph.remove(); return; }
  if (!ph) { ph = document.createElement('button'); ph.type = 'button'; ph.className = 'duo-rp'; ph.innerHTML = '<span>🏝</span><b>打开 My World</b><small>左边点卡片，这里就找到它在岛上的位置</small>'; document.body.appendChild(ph);
    ph.addEventListener('click', function(){ openWorld(); setTimeout(rightPane, 600); }); }
}
var rpQ = false; new MutationObserver(function(){ if (rpQ || !on) return; rpQ = true; requestAnimationFrame(function(){ rpQ = false; rightPane(); }); }).observe(document.body, { childList: true });

/* ---------- Kanban × Island (split): a card tap shows where it lives on the island (a second tap opens it as always);
   a selection on the island scrolls the board to its card. Only references travel between the panes — nothing moves. */
function worldOpen(){ return !!document.querySelector('.uv'); }
function splitOn(){ return on && splitFits() && document.documentElement.classList.contains('duo-split'); }
function openWorld(){
  if (worldOpen()) return;
  var bid = null; try { var ab = MinestAI.board(); bid = ab && ab.id; } catch(e){}
  try { MinestUniverse.open(bid ? { path: [{ t: 'home' }, { t: 'world', bid: bid }] } : undefined); } catch(e){}
}
function boardOfCard(id){
  var hit = null;
  boards().some(function(b){ return (b.columns || []).some(function(c){ return (c.cards || []).some(function k(x){ return !!x && (x.id === id || (x.stack || []).some(k)); }); }) && (hit = b); });
  return hit;
}
var selCard = null;
function cssId(id){ return window.CSS && CSS.escape ? CSS.escape(id) : String(id).replace(/"/g, '\\"'); }
function markCard(id){
  [].forEach.call(document.querySelectorAll('.duo-sel'), function(x){ x.classList.remove('duo-sel'); });
  selCard = id || null; if (!id) return null;
  var e = document.querySelector('#root [data-card-id="' + cssId(id) + '"]'); if (e) e.classList.add('duo-sel'); return e;
}
function flash(x){ x.classList.remove('duo-flash'); void x.offsetWidth; x.classList.add('duo-flash'); setTimeout(function(){ x.classList.remove('duo-flash'); }, 1600); }
document.addEventListener('click', function(e){
  if (!splitOn() || !worldOpen()) return;
  var t = e.target; if (!t.closest) return;
  var c = t.closest('#root [data-card-id]'); if (!c) return;
  var ctl = t.closest('button, input, select, textarea, a, label, [role=checkbox], [contenteditable=true]'); if (ctl && c.contains(ctl) && ctl !== c) return;   /* the card's own controls work as always */
  var id = c.getAttribute('data-card-id'); if (!id || selCard === id) return;   /* the second tap opens the card */
  e.preventDefault(); e.stopPropagation();
  markCard(id); hap();
  var b = boardOfCard(id); try { if (window.MinestDuoWorld) MinestDuoWorld.locate(id, b && b.id); } catch(x){}
}, true);
window.addEventListener('minest:duo-world-sel', function(e){
  if (!splitOn()) return; var d = e.detail || {}, wait = 30;
  try { var ab = MinestAI.board(); if (d.bid && (!ab || ab.id !== d.bid)) { MinestAI.selectBoard(d.bid); wait = 300; } if (MinestAI.viewMode && MinestAI.viewMode() !== 'board') { MinestAI.setViewMode('board'); wait = 300; } } catch(x){}
  setTimeout(function(){
    var id = d.cardId || d.listId, el = id && document.querySelector('#root [data-card-id="' + cssId(id) + '"]');
    if (!el && d.cardId && d.listId) el = document.querySelector('#root [data-card-id="' + cssId(d.listId) + '"]');   /* inside a closed stack: the stack */
    if (el) { markCard(el.getAttribute('data-card-id')); el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); flash(el); return; }
    var col = d.colId && document.querySelector('#root .kanban-column-wrapper[data-col-id="' + cssId(d.colId) + '"]');
    if (col) { markCard(null); col.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); flash(col); }
  }, wait);
});

/* ---------- 5 · Study Desk: the flashcard of the list you study (GPT Study record, MinestGPTStudy), laid out for the
   screen you have — folded: one column (word, sound, meaning, the buttons under your thumb); unfolded: the card on the
   left (word, pronunciation, example), meaning / notes / Again · Learned · Next on the right; half-open (Device Posture
   "folded"): content up, buttons down. Every step goes through MinestGPTStudy.act, so the word on show, the round and
   what is learned are the same record CarPlay and Glance use; folding only changes the layout. Learned is never
   toggled off by accident (it is set only when not set yet), Again stars the card for the focus review and moves on. */
var desk = null, deskKey = null, flashAt = 0;
function studySource(key){ var CF = window.MinestCarFlash; if (!CF) return null; var src = CF.sources(); var s = (key && src.filter(function(x){ return x.id === key; })[0]) || (studyList() || {}).s; if (!s) return null; return { s: s, items: CF.itemsOf(s, 'auto'), all: src }; }
function fieldText(v){ if (v == null) return ''; if (typeof v === 'string') return plain(v); if (Array.isArray(v)) return v.map(fieldText).filter(Boolean)[0] || ''; if (typeof v === 'object') return fieldText(v.ipa || v.text || v.us || v.uk || v.pinyin || v.value || ''); return String(v); }
function cardFacts(c, word){
  if (!c) return { word: word };
  var meaning = fieldText(c.meaning) || fieldText(c.en) || fieldText(c.back) || fieldText(c.desc) || fieldText(c.description);
  var zh = fieldText(c.titleZh), notes = fieldText(c.notes || c.note);
  if (!notes) { var d = fieldText(c.desc || c.description); if (d && d !== meaning) notes = d; }
  return { word: word, pron: fieldText(c.pron) || fieldText(c.pinyin) || fieldText(c.phonetic), example: fieldText(c.example || c.sentence || c.sentences || c.examples), meaning: meaning, zh: zh && zh !== word ? zh : '', notes: notes };
}
function say(w){ try { if (window.MinestNative && MinestNative.isNative && MinestNative.isNative()) { MinestNative.send('speakText', { text: w }); return; } } catch(e){} try { var u = new SpeechSynthesisUtterance(w); u.lang = /[㐀-鿿]/.test(w) ? 'zh-CN' : 'en-US'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch(e){} }
function deskDraw(){
  if (!desk) return; var G = window.MinestGPTStudy, t = studySource(deskKey); if (!t || !G) { desk.querySelector('.dd-body').innerHTML = '<p class="duo-m">还没有词表。在看板里加一个 list 就能在这里学。</p>'; return; }
  deskKey = t.s.id; setPref('desk', deskKey);
  var L = G.get(deskKey); if (!L || !L.current) { G.act(t.s.id, t.s.title, t.items, 'continue'); L = G.get(deskKey); }
  var id = L && L.current, it = null; t.items.some(function(x){ if (x.id === id) { it = x; return true; } return false; });
  var c = it ? cardOf(t.s, it.id) : null, f = cardFacts(c, it ? it.word : ''), rc = L && it ? (L.cards || {})[it.id] || {} : {}, st = G.stats(t.s.id, t.s.title, t.items) || {};
  desk.querySelector('.dd-list').innerHTML = t.all.map(function(x){ return '<option value="' + esc(x.id) + '"' + (x.id === deskKey ? ' selected' : '') + '>' + esc(x.group + ' › ' + x.title) + '</option>'; }).join('');
  desk.querySelector('.dd-body').innerHTML = !it ? '<div class="dd-done">🎉 这一轮全部学完了<button type="button" class="duo-go" data-dd="restart">再来一轮</button></div>' :
    '<section class="dd-card"><div class="dd-pos">' + (t.items.indexOf(it) + 1) + ' / ' + t.items.length + (rc.star ? ' · ★' : '') + (rc.learned ? ' · ✓ 已学会' : '') + '</div>' +
      '<h2 class="dd-word">' + esc(f.word) + '</h2>' +
      '<div class="dd-pron"><button type="button" data-dd="say" aria-label="朗读">🔊</button>' + (f.pron ? '<span>' + esc(f.pron) + '</span>' : '<span class="dim">点 🔊 听发音</span>') + '</div>' +
      (f.example ? '<p class="dd-ex">“' + esc(f.example) + '”</p>' : '') + '</section>' +
    '<section class="dd-side"><div class="dd-mean"><h3>释义</h3>' + (f.meaning || f.zh ? (f.zh ? '<p class="zh">' + esc(f.zh) + '</p>' : '') + (f.meaning ? '<p>' + esc(f.meaning) + '</p>' : '') : '<p class="dim">这张卡还没有释义</p>') + '</div>' +
      (f.notes ? '<div class="dd-notes"><h3>笔记</h3><p>' + esc(f.notes.slice(0, 400)) + '</p></div>' : '') +
      '<div class="dd-stat">已看 ' + (st.seen || 0) + ' · 学会 ' + (st.learned || 0) + ' · 本轮还剩 ' + (st.remaining != null ? st.remaining : '—') + '</div>' +
      '<div class="dd-acts"><button type="button" data-dd="prev" aria-label="上一张">◀</button><button type="button" data-dd="again" class="ag">🔁 再来</button>' +
      '<button type="button" data-dd="learned" class="ok' + (rc.learned ? ' on' : '') + '">✓ 学会了</button><button type="button" data-dd="next" class="go">下一张 ▶</button></div></section>';
}
function deskOpen(key){
  if (!desk) {
    desk = document.createElement('div'); desk.className = 'duo-desk'; desk.setAttribute('role', 'dialog'); desk.setAttribute('aria-label', '学习书桌');
    desk.innerHTML = '<header class="dd-top"><b>📚 学习书桌</b><select class="dd-list" aria-label="词表"></select><button type="button" class="duo-full" data-dd="close" aria-label="关闭书桌">✕ 关闭</button></header><div class="dd-body"></div>';
    document.body.appendChild(desk); document.documentElement.classList.add('duo-desk-on');
    desk.addEventListener('change', function(e){ if (e.target.matches('.dd-list')) { deskKey = e.target.value; deskDraw(); } });
    desk.addEventListener('click', function(e){
      var b = e.target.closest('[data-dd]'); if (!b) return; var w = b.getAttribute('data-dd'), G = window.MinestGPTStudy, t = studySource(deskKey);
      if (w === 'close') { desk.remove(); desk = null; document.documentElement.classList.remove('duo-desk-on'); return; }
      if (w === 'say') { var h = desk.querySelector('.dd-word'); if (h) say(h.textContent); return; }
      if (!G || !t) return; var L = G.get(t.s.id), rc = L && L.current ? (L.cards || {})[L.current] || {} : {};
      if (w === 'again') { if (!rc.star) G.act(t.s.id, t.s.title, t.items, 'star'); G.act(t.s.id, t.s.title, t.items, 'next'); }
      else if (w === 'learned') { if (!rc.learned) G.act(t.s.id, t.s.title, t.items, 'learned'); G.act(t.s.id, t.s.title, t.items, 'next'); }
      else G.act(t.s.id, t.s.title, t.items, w);
      flashAt = Date.now(); hap(); deskDraw(); if (gl && !gl.hidden) paint();
    });
  }
  if (key) deskKey = key; else if (!deskKey) deskKey = prefs().desk || null;
  deskDraw();
}
function deskBtn(){
  var b = document.querySelector('.duo-desk-b');
  if (true) { if (b) b.remove(); return; }   /* no floating button any more: the desk is on the rail and in Glance */
  if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'duo-desk-b'; b.textContent = '📚 书桌'; b.setAttribute('aria-label', '学习书桌'); document.body.appendChild(b); b.addEventListener('click', function(){ deskOpen(); hap(); }); }
}

/* ---------- 6 · Discover on the open screen: the game views are tagged (vs / tier / sc) and laid out as two pages by CSS —
   This or That and Tournament: one choice per half; Tier List: the unranked pool on the left, the tiers on the right;
   Desert Island: the candidates on the left, your limited places on the right (the kept ones listed there, tap to let
   go). The games' own data, rules, taps and drags are untouched. */
function dvTag(){
  var dv = document.querySelector('.dv'); if (!dv) return; var body = dv.querySelector('.dv-body'); if (!body) return;
  var t = body.querySelector('.dv-vs') ? 'vs' : body.querySelector(':scope > .dv-tiers') ? 'tier' : body.querySelector(':scope > .sc-grid') ? 'sc' : '';
  if (dv.getAttribute('data-duo') !== t) dv.setAttribute('data-duo', t);
  var k = body.querySelector(':scope > .duo-kept');
  if (t !== 'sc' || kind !== 'inner') { if (k) k.remove(); return; }
  var kept = [].slice.call(body.querySelectorAll(':scope > .sc-grid .sc-t.on')), html = '<h3>留在岛上的 · ' + kept.length + '</h3>' + (kept.length ? kept.map(function(x){ var id = x.getAttribute('data-scpv'), nm = (x.querySelector('p') || {}).textContent || (x.querySelector('.sc-sel') || {}).getAttribute && x.querySelector('.sc-sel').getAttribute('aria-label').replace(/^Let go of /, '') || ''; return '<button type="button" data-duokeep="' + esc(id) + '">' + esc(nm) + '<i>✕</i></button>'; }).join('') : '<p>在左边点 ○ 选要留下的</p>');
  if (!k) { k = document.createElement('div'); k.className = 'duo-kept'; body.appendChild(k); }
  if (k.innerHTML !== html) k.innerHTML = html;
}
document.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('.duo-kept [data-duokeep]'); if (!b) return; e.preventDefault(); e.stopPropagation(); var t = document.querySelector('.dv .sc-grid [data-scpv="' + cssId(b.getAttribute('data-duokeep')) + '"] [data-sck]'); if (t) t.click(); }, true);
var dvQ = false; new MutationObserver(function(){ if (dvQ || !on) return; dvQ = true; requestAnimationFrame(function(){ dvQ = false; dvTag(); vlTag(); }); }).observe(document.body, { childList: true, subtree: true });

/* ---------- 7 · Visual Library next to the island: in the split the library keeps the left half (search, filters,
   multi-select and suggestions as they are), My World the right. Saving works as always (to your lists, through
   MinestCapture); the receipt then offers "🧱 Put them on the island": the new cards queue up and each one is placed
   with one tap on the right (Universal Add — the island's Visual Resolver picks a 3D model, a voxel picture or a text
   display). Selection survives fold / unfold because nothing is re-rendered. */
var vlBefore = null, vlQueue = null;
function cardIndex(){ var m = {}; boards().forEach(function(b){ (b.columns || []).forEach(function(col){ (col.cards || []).forEach(function(c){ if (!c) return; m[c.id] = { b: b.id, ref: col.id + '/' + c.id }; (c.stack || []).forEach(function(s){ if (s) m[s.id] = { b: b.id, ref: c.id + '/' + s.id }; }); }); }); }); return m; }
document.addEventListener('click', function(e){ if (e.target.closest && e.target.closest('.pk.vl [data-save]')) vlBefore = cardIndex(); }, true);
function vlTag(){
  var vl = document.querySelector('.pk.vl'); if (!vl) { vlBefore = vlBefore && document.querySelector('.pk.vl') ? vlBefore : vlBefore; return; }
  var rc = vl.querySelector('.vl-stat'), btn = vl.querySelector('[data-duovlq]');
  if (!rc || !vlBefore || btn || kind !== 'inner') return;
  var now = cardIndex(), fresh = Object.keys(now).filter(function(id){ return !vlBefore[id]; }).map(function(id){ return now[id]; });
  if (!fresh.length) return;
  rc.insertAdjacentHTML('afterend', '<button type="button" class="pk-go duo-vlq" data-duovlq>🧱 摆到右边的岛上（' + fresh.length + '）</button>');
  vl.querySelector('[data-duovlq]').addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); vlQueue = { list: fresh, i: 0 }; vlBefore = null; if (!splitOn()) { setPref('split', true); document.documentElement.classList.add('duo-split'); relayout(); splitBtn(); } queueNext(); });
}
function queueBar(html){
  var q = document.querySelector('.duo-queue');
  if (!html) { if (q) q.remove(); return; }
  if (!q) { q = document.createElement('div'); q.className = 'duo-queue'; document.body.appendChild(q);
    q.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; if (b.hasAttribute('data-qskip')) { vlQueue.i++; queueNext(); } else if (b.hasAttribute('data-qend')) { vlQueue = null; queueBar(null); } }); }
  q.innerHTML = html;
}
var qT = 0;
function queueNext(){
  clearTimeout(qT); if (!vlQueue) return;
  var it = vlQueue.list[vlQueue.i]; if (!it) { queueBar('<b>✓ 都摆好了</b><button type="button" data-qend>完成</button>'); vlQueue = null; setTimeout(function(){ queueBar(null); }, 2500); return; }
  var ok = false; try { ok = MinestDisplay.display(it.ref); } catch(e){}
  if (!ok) { vlQueue.i++; return queueNext(); }
  queueBar('<b>待陈列 ' + (vlQueue.i + 1) + ' / ' + vlQueue.list.length + '</b><span>在右边岛上点一个位置，再点 ✓ Place</span><button type="button" data-qskip>跳过</button><button type="button" data-qend>结束</button>');
  (function wait(){ qT = setTimeout(function(){ if (!vlQueue) return; var W = window.MinestDuoWorld; if (W && W.placed && W.placed(it.ref)) { vlQueue.i++; hap(); queueNext(); } else if (W && W.holding && !W.holding()) { vlQueue.i++; queueNext(); } else wait(); }, 500); })();
}

/* keep Glance fresh: coming back to the app, a change of the boards (cloud, CarPlay) */
document.addEventListener('visibilitychange', function(){ if (!document.hidden && gl && !gl.hidden) paint(); });
window.addEventListener('minest:cloud-dirty', function(){ if (gl && !gl.hidden) later(); });
window.addEventListener('minestNativeEvent', function(e){ var d = e.detail || {}; if (d.event === 'carFlash' && gl && !gl.hidden) later(); });
window.addEventListener('resize', function(){ if (on) apply(); });
/* a fold, unfold or turn inside the app does not always fire resize in the web view: look again on every viewport change and once a second */
if (window.visualViewport) visualViewport.addEventListener('resize', function(){ if (on) apply(); });
try { matchMedia('(orientation: portrait)').addEventListener('change', function(){ if (on) apply(); }); } catch(e){}
setInterval(function(){ if (on && !document.hidden) { apply(); rail(); coverOn(document.documentElement.classList.contains('duo-cover')); } }, 1000);
/* only on a folding iPhone: iPhoneDuo.html (window.__MINEST_DUO__), or an iPhone that has once shown a screen no other
   iPhone has (near square: unfolded) — remembered, so the folded outer screen gets Glance from then on */
function phone(){ var ua = navigator.userAgent || ''; return /iPhone/.test(ua) && !/iPad/.test(ua); }
function enabled(){
  if (window.__MINEST_DUO__) return true;
  try { if (localStorage.getItem('minest.duo.fold') === '1') return true; } catch(e){}
  var mn = Math.min(innerWidth, innerHeight), mx = Math.max(innerWidth, innerHeight);
  if (phone() && mn >= 600 && mx / mn < 1.6) { try { localStorage.setItem('minest.duo.fold', '1'); } catch(e){} return true; }   /* no other iPhone has a screen this big */
  return false;
}
var on = false;
function boot(){
  if (!window.MinestAI || !window.MinestAI.boards) { setTimeout(boot, 300); return; }
  if (!enabled()) return;
  on = true; document.documentElement.classList.add('duo'); apply();
  if (window.__minestHinge) onHinge(window.__minestHinge);
}
window.addEventListener('resize', function(){ if (!on && enabled()) { on = true; document.documentElement.classList.add('duo'); } });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(boot, 600); }); else setTimeout(boot, 600);

window.MinestDuo = { screen: function(){ return kind; }, glance: function(){ dismissed = false; glance(); }, refresh: paint, desk: deskOpen, version: '53.85' };
})();
