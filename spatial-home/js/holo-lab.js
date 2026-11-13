/* Minest · Holographic Typography Lab — the Minest side (2026-11-13).
   holo-lab/index.html is the lab itself (full screen, its own three.js scene). This file opens it — from the console
   object in Spatial Home, or from the ◈ button in My World's console — and is its only link to Minest's data:
   · lists      the vocabulary lists on the Kanban (boards titled vocab / word / 单词 / 词汇), and the list the board's
                Today's Words uses, with the GPT Study "learned" marks
   · charts     every card of the EC–6 Anchor Charts board (subject = its column), today's picks first
   · knowledge  cards of boards titled knowledge / 知识
   · works      Type Workshop works (MinestBackpack.works)
   · layout     the lab's own layout, kept in MinestKnowledge 'holo:layout' (and this device as a copy)
   Messages ({holo:1}): ready → content · save → keep the layout · edit → MinestAI.patchCard on the real card ·
   open → close the lab and open the original · close. Nothing here invents data; an edit is written only to the card
   whose id the lab sends back. */
(function (root) {
  'use strict';
  if (root.SpatialHoloLab) return;
  var WEB = 'https://minest-app.vercel.app/holo-lab/index.html', LKEY = 'minest.holoLab.layout.v1';
  function HW() { var B = root.SpatialBridge; try { var w = B && B.hostWindow && B.hostWindow(); if (w && w.MinestAI) return w; } catch (e) {} return root; }
  function AI() { var w = HW(); return w && w.MinestAI && w.MinestAI.boards ? w.MinestAI : null; }
  function KN() { var w = HW(); return (w && w.MinestKnowledge) || root.MinestKnowledge || null; }
  function boards() { var a = AI(); try { return a ? (a.boards() || []) : []; } catch (e) { return []; } }
  function plain(s) { return String(s || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#*_`>|~]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function clip(s, n) { s = plain(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  var FIELD = {};                                                       // card id → the field its text came from (for edits)
  function textOf(k) { var f = k.meaning ? 'meaning' : k.titleZh ? 'titleZh' : k.desc ? 'desc' : 'meaning'; FIELD[k.id] = f; return clip(k[f] || '', 220); }
  function tagsOf(k) { return (k.labels || k.tags || []).map(function (t) { return typeof t === 'string' ? t : (t && (t.name || t.label || t.title)) || ''; }).filter(Boolean).slice(0, 6); }
  var SUBS = [['ela', /language\s*arts|\bela\b|英语语言|reading|writing/i, 'Language Arts', '#2f6fd6'], ['math', /math/i, 'Math', '#d9463e'], ['sci', /science|科学/i, 'Science', '#2f9a5a'], ['ss', /social\s*studies|社会|history|geograph/i, 'Social Studies', '#b8862b']];
  function subOf(title) { for (var i = 0; i < SUBS.length; i++) if (SUBS[i][1].test(title || '')) return SUBS[i]; return ['other', null, 'Other', '#8a5ad0']; }

  function snapshot() {
    var out = { lists: [], charts: [], knowledge: [], works: [], layout: null, demo: false }, B = boards(), E = root.SpatialEC6 && root.SpatialEC6._;
    /* lists */
    var gs = null; try { gs = JSON.parse(localStorage.getItem('minest.gptstudy.v1') || 'null'); } catch (e) {}
    var seen = {}, addList = function (b, c) {
      var key = 'b:' + b.id + ':' + c.id; if (seen[key] || out.lists.length >= 10) return; seen[key] = 1;
      var rec = gs && gs.lists && gs.lists[key], items = (c.cards || []).filter(function (k) { return k && k.title; }).slice(0, 80).map(function (k) {
        return { id: k.id, title: clip(k.title, 60), text: textOf(k), learned: !!(rec && rec.cards && rec.cards[k.id] && rec.cards[k.id].learned), tags: tagsOf(k) }; });
      if (items.length) out.lists.push({ key: key, title: clip((c.title || '') + (b.title ? ' · ' + b.title : ''), 60), source: rec ? 'gptstudy' : 'kanban', items: items });
    };
    try { var ws = E && E.wordState(); if (ws && ws.L) addList(ws.L.b, ws.L.c); } catch (e) {}
    B.forEach(function (b) { if (/vocab|word|单词|词汇/i.test(b.title || '')) (b.columns || []).forEach(function (c) { addList(b, c); }); });
    /* Anchor Charts: today's picks first, then the rest of the board */
    var cb = null; try { cb = E && E.chartsBoard && E.chartsBoard(); } catch (e) {}
    if (!cb) cb = B.filter(function (b) { return /anchor/i.test(b.title || ''); })[0] || null;
    var picked = {}; ['ela', 'math', 'sci', 'ss', 'other'].forEach(function (s) { try { var h = E && E.pick(s); if (h && h.k) picked[h.k.id] = 1; } catch (e) {} });
    var S = null; try { S = E && E.S(); } catch (e) {}
    if (cb) (cb.columns || []).forEach(function (c) {
      var sub = subOf(c.title);
      (c.cards || []).forEach(function (k) { if (!k || !k.title || out.charts.length >= 120) return;
        out.charts.push({ id: k.id, sub: sub[0], subName: sub[2], ink: sub[3], title: clip(k.title, 80), text: textOf(k), today: !!picked[k.id],
          mastered: !!(S && (S.mastered || []).some(function (m) { return m.id === k.id && !m.undone; })) }); });
    });
    out.charts.sort(function (a, b) { return (b.today ? 1 : 0) - (a.today ? 1 : 0); });
    /* knowledge */
    /* knowledge: the Knowledge tree is the Kanban itself (MinestKnowledge keeps each card's parents) — every board that is
       not a vocabulary list or the Anchor Charts board, boards titled knowledge / 知识 first */
    var K = KN(), kb = B.filter(function (b) { return !(cb && b.id === cb.id) && !/vocab|word|单词|词汇/i.test(b.title || ''); });
    kb.sort(function (a, b) { return (/knowledge|知识/i.test(b.title || '') ? 1 : 0) - (/knowledge|知识/i.test(a.title || '') ? 1 : 0); });
    kb.forEach(function (b) { (b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (!k || !k.title || out.knowledge.length >= 150) return;
      var par = []; try { par = (K && K.parentOf && K.parentOf(k.id)) || []; if (!Array.isArray(par)) par = par ? [par] : []; } catch (e) {}
      out.knowledge.push({ id: k.id, title: clip(k.title, 80), text: textOf(k), tags: tagsOf(k).concat([plain(c.title)]).filter(Boolean), board: clip(b.title, 40), parents: par.slice(0, 6) }); }); }); });
    /* 3D Type works */
    try { var BP = root.MinestBackpack; if (BP && BP.works) out.works = BP.works().slice(-60).reverse().map(function (it) { return { id: it.id, word: clip(it.word, 40), mode: it.mode || 'neon', look: (it.look && it.look.gas) || it.gas || 'neon' }; }); } catch (e) {}
    out.layout = loadLayout();
    return out;
  }
  function loadLayout() { var K = KN(); try { var v = K && K.get && K.get('holo:layout'); if (v) return v; } catch (e) {} try { return JSON.parse(localStorage.getItem(LKEY) || 'null'); } catch (e) { return null; } }
  function saveLayout(l) { try { localStorage.setItem(LKEY, JSON.stringify(l)); } catch (e) {} var K = KN(); try { if (K && K.set) K.set('holo:layout', l); } catch (e) {} }

  function src() {
    if (/^https?:$/.test(location.protocol)) return /\/spatial-home\//.test(location.pathname) ? '../holo-lab/index.html' : 'holo-lab/index.html';
    return WEB;
  }
  var el = null, frame = null, done = null, saveT = 0;
  function post(m) { try { frame.contentWindow.postMessage(m, '*'); } catch (e) {} }
  function finish(r) {
    if (!el) return; root.removeEventListener('message', onMsg);
    var e0 = el; el = null; frame = null; e0.style.opacity = '0'; setTimeout(function () { e0.remove(); }, 320);
    var f = done; done = null; if (f) f(r || null);
  }
  function onMsg(e) {
    var m = e.data; if (!el || !m || m.holo !== 1 || !frame || e.source !== frame.contentWindow) return;
    if (m.op === 'ready') post({ holo: 1, op: 'content', data: snapshot() });
    else if (m.op === 'close') finish(null);
    else if (m.op === 'save' && m.layout && typeof m.layout === 'object') { clearTimeout(saveT); var l = m.layout; saveT = setTimeout(function () { saveLayout(l); }, 400); }
    else if (m.op === 'edit' && m.id) {
      var a = AI(); if (!a || !a.patchCard) { post({ holo: 1, op: 'toast', text: 'Minest 还没准备好，没有保存' }); return; }
      var patch = {}; if (typeof m.title === 'string' && m.title.trim()) patch.title = m.title.trim().slice(0, 200);
      if (typeof m.text === 'string') patch[FIELD[m.id] || 'meaning'] = m.text.slice(0, 2000);
      try { a.patchCard(m.id, patch); post({ holo: 1, op: 'toast', text: '已写回原卡片' }); } catch (er) { post({ holo: 1, op: 'toast', text: '没能写回：' + (er && er.message || er) }); return; }
      setTimeout(function () { if (el) post({ holo: 1, op: 'content', data: snapshot() }); }, 400);
    }
    else if (m.op === 'open') {
      var id = m.id;
      if (m.kind === 'work') finish({ feature: 'type3d' });
      else if (m.kind === 'list' && m.key) { var p = String(m.key).split(':'); finish({ feature: 'kanban', after: function (w) { setTimeout(function () { try { w.MinestAI.showList(p[1], p[2]); } catch (er) {} }, 120); } }); }
      else finish({ feature: 'kanban', after: id ? function (w) { setTimeout(function () { try { w.MinestAI.openCard(id); } catch (er) {} }, 120); } : null });
    }
  }
  /** open the lab; cb(null) = back where you were, cb({feature, after}) = open that in Minest */
  function open(cb) {
    if (el) return; done = cb || null;
    el = document.createElement('div'); el.id = 'mn-holo-lab';
    el.style.cssText = 'position:fixed;inset:0;z-index:2147483600;background:#02060a;opacity:0;transition:opacity .3s';
    frame = document.createElement('iframe'); frame.title = '全息文字操作台 · Holographic Typography Lab'; frame.setAttribute('allow', 'fullscreen; autoplay; clipboard-write');
    frame.style.cssText = 'border:0;width:100%;height:100%;display:block'; frame.src = src(); el.appendChild(frame); document.body.appendChild(el);
    ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(function (t) { el.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
    root.addEventListener('message', onMsg);
    requestAnimationFrame(function () { if (el) el.style.opacity = '1'; });
  }

  /* My World: a ◈ 全息操作台 button in the console (the room has the console object itself) */
  function fromMyWorld(r) {
    if (!r) return; var a = root.MinestAI;
    try { if (root.MinestUniverse && root.MinestUniverse.close) root.MinestUniverse.close(); } catch (e) {}
    if (r.feature === 'type3d' && root.MinestType3D) { root.MinestType3D.open(); return; }
    if (r.after && a) setTimeout(function () { r.after(root); }, 200);
  }
  setInterval(function () {
    var acts = document.querySelector('aside.wf .wf-acts'); if (!acts || acts.querySelector('[data-holo-lab]')) return;
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-holo-lab', ''); b.title = '全息文字操作台 · Holographic Typography Lab';
    b.innerHTML = '<i>◈</i>全息操作台'; b.addEventListener('click', function (e) { e.stopPropagation(); open(fromMyWorld); });
    acts.appendChild(b);
  }, 900);

  root.SpatialHoloLab = { open: open, close: function () { finish(null); }, isOpen: function () { return !!el; }, snapshot: snapshot, version: '1.0' };
})(window);
