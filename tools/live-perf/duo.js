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
function posture(){ try { return navigator.devicePosture && navigator.devicePosture.type || ''; } catch(e){ return ''; } }
function screenKind(){ if (segments() > 1) return 'inner'; var w = innerWidth, h = innerHeight, mn = Math.min(w, h), mx = Math.max(w, h); return mn >= 600 && mx / mn < 1.5 ? 'inner' : 'outer'; }
function apply(){
  var k = screenKind(); if (k === kind) return;
  kind = k; var r = document.documentElement;
  r.classList.toggle('duo-outer', k === 'outer'); r.classList.toggle('duo-inner', k === 'inner');
  var was = r.classList.contains('duo-split');
  r.classList.toggle('duo-split', k === 'inner' && !!prefs().split);
  if (was !== r.classList.contains('duo-split')) relayout();
  var first = !booted; booted = true;
  if (k === 'outer') { if (first && !dismissed) glance(); else { dismissed = true; } }   /* folding keeps what you were doing; Glance is one tap away (⌂) */
  else { closeGlance(); if (prefs().split) openWorld(); }
  document.documentElement.classList.toggle('duo-halfopen', posture() === 'folded');
  splitBtn(); pill(); rightPane();
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
    '<button type="button" class="duo-link" data-duo-car>🚗 车载闪卡 / 换词表</button></section>';
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
    G.act(s.s.id, s.s.title, s.items, b.getAttribute('data-duo-act')); hap(); paint(); return;
  }
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
  if (kind !== 'inner') { if (b) b.remove(); return; }
  if (!b) { b = document.createElement('button'); b.type = 'button'; b.className = 'duo-split-b'; document.body.appendChild(b);
    b.addEventListener('click', function(){ var on = !prefs().split; setPref('split', on); document.documentElement.classList.toggle('duo-split', on); relayout(); splitBtn(); hap(); setTimeout(rightPane, 600);
      if (on) openWorld(); }); }
  var on = !!prefs().split; b.textContent = on ? '▣ 全屏' : '▥ 分栏'; b.setAttribute('aria-label', on ? '取消分栏' : '分栏：左边看板，右边 My World');
  b.classList.toggle('on', on);
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
function splitOn(){ return on && kind === 'inner' && document.documentElement.classList.contains('duo-split'); }
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

/* keep Glance fresh: coming back to the app, a change of the boards (cloud, CarPlay) */
document.addEventListener('visibilitychange', function(){ if (!document.hidden && gl && !gl.hidden) paint(); });
window.addEventListener('minest:cloud-dirty', function(){ if (gl && !gl.hidden) later(); });
window.addEventListener('minestNativeEvent', function(e){ var d = e.detail || {}; if (d.event === 'carFlash' && gl && !gl.hidden) later(); });
window.addEventListener('resize', function(){ if (on) apply(); });
/* only on a folding iPhone: iPhoneDuo.html (window.__MINEST_DUO__), or an iPhone that has once shown a screen no other
   iPhone has (shorter side ≥ 600 pt = unfolded) — remembered, so the folded outer screen gets Glance from then on */
function phone(){ var ua = navigator.userAgent || ''; return /iPhone/.test(ua) && !/iPad/.test(ua); }
function enabled(){
  if (window.__MINEST_DUO__) return true;
  try { if (localStorage.getItem('minest.duo.fold') === '1') return true; } catch(e){}
  if (phone() && Math.min(innerWidth, innerHeight) >= 600) { try { localStorage.setItem('minest.duo.fold', '1'); } catch(e){} return true; }
  return false;
}
var on = false;
function boot(){
  if (!window.MinestAI || !window.MinestAI.boards) { setTimeout(boot, 300); return; }
  if (!enabled()) return;
  on = true; document.documentElement.classList.add('duo'); apply();
}
window.addEventListener('resize', function(){ if (!on && enabled()) { on = true; document.documentElement.classList.add('duo'); } });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(boot, 600); }); else setTimeout(boot, 600);

window.MinestDuo = { screen: function(){ return kind; }, glance: function(){ dismissed = false; glance(); }, refresh: paint, version: '53.84' };
})();
