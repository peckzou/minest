/* Minest · My World input — the system-level search / build bar, with the five Cognitive Toolkit cards (window.MinestOmni)
   Opened from the Dock's ✦ key, ⌘K / Ctrl+K anywhere, or My World's Cognitive Toolkit entry.
     · type → your worlds, lists and things that match (open them), and ✦ Build a world about it (MinestNewWorld 'gen')
     · under the bar, five cards travel with it — Thought Compass · Framework · Thinking Models · Thinking Lab ·
       Knowledge Graph. Each is a button with its own living icon; while you type each shows what it would do with the
       text (worked out by the toolkit's local engine, nothing is saved). Press one: the card opens into its tool right
       there (the toolkit in panel mode, one card only — never a separate page); the five shrink into a switcher.
   The toolkit runs in one hidden frame (toolkit.html#embed=1&panel=1), answered by tools/toolkit/host.js. */
(function () {
  'use strict';
  if (window.MinestOmni) return;
  var PAGE = 'toolkit.html';
  var CARDS = [
    { id: 'compass', zh: '思想罗盘', en: 'Thought Compass', c: '#9b5de5', c2: '#d4b8ff', line: '找到它属于哪里' },
    { id: 'framework', zh: '知识框架', en: 'Framework', c: '#5e9cff', c2: '#bcd6ff', line: '把它组织成结构' },
    { id: 'models', zh: '思维模型', en: 'Thinking Models', c: '#1f9d55', c2: '#a9efc6', line: '一步步分析它' },
    { id: 'lab', zh: '思维实验室', en: 'Thinking Lab', c: '#f08c3a', c2: '#ffd2a8', line: '亲手试一试' },
    { id: 'graph', zh: '知识图谱', en: 'Knowledge Graph', c: '#00a6a6', c2: '#a6f0ef', line: '看它连向哪里' }
  ];
  /* living icons: each one moves in its own way (CSS below) */
  var ICON = {
    compass: '<svg viewBox="0 0 64 64" class="oi oi-compass"><circle cx="32" cy="32" r="26" class="ring"/><circle cx="32" cy="32" r="19" class="ring2"/><g class="ticks">' + [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) { return '<line x1="32" y1="5" x2="32" y2="' + (a % 90 ? 9 : 11) + '" transform="rotate(' + a + ' 32 32)"/>'; }).join('') + '</g><g class="needle"><path d="M32 13 L37 32 L32 51 L27 32 Z" class="n2"/><path d="M32 13 L37 32 L27 32 Z" class="n1"/></g><circle cx="32" cy="32" r="3" class="hub"/></svg>',
    framework: '<svg viewBox="0 0 64 64" class="oi oi-framework"><path class="br b1" d="M32 18 V28 M32 28 H16 V38 M32 28 H48 V38 M32 28 V38"/><path class="br b2" d="M16 46 V52 M48 46 V52"/><rect class="nd n0" x="24" y="8" width="16" height="10" rx="3"/><rect class="nd n1" x="8" y="38" width="16" height="9" rx="3"/><rect class="nd n2" x="24" y="38" width="16" height="9" rx="3"/><rect class="nd n3" x="40" y="38" width="16" height="9" rx="3"/><circle class="nd n4" cx="16" cy="55" r="3"/><circle class="nd n5" cx="48" cy="55" r="3"/></svg>',
    models: '<svg viewBox="0 0 64 64" class="oi oi-models"><g class="row r1"><circle cx="13" cy="16" r="5"/><rect x="22" y="13" width="32" height="6" rx="3" class="tr"/><rect x="22" y="13" width="32" height="6" rx="3" class="fl"/></g><g class="row r2"><circle cx="13" cy="32" r="5"/><rect x="22" y="29" width="32" height="6" rx="3" class="tr"/><rect x="22" y="29" width="32" height="6" rx="3" class="fl"/></g><g class="row r3"><circle cx="13" cy="48" r="5"/><rect x="22" y="45" width="32" height="6" rx="3" class="tr"/><rect x="22" y="45" width="32" height="6" rx="3" class="fl"/></g><path class="ck" d="M10 32 l2.5 2.5 L17 29.5"/></svg>',
    lab: '<svg viewBox="0 0 64 64" class="oi oi-lab"><defs><clipPath id="omniFlask"><path d="M26 8 H38 V24 L52 50 A6 6 0 0 1 47 58 H17 A6 6 0 0 1 12 50 L26 24 Z"/></clipPath></defs><g clip-path="url(#omniFlask)"><path class="liq" d="M0 40 Q8 36 16 40 T32 40 T48 40 T64 40 T80 40 V64 H0 Z"/><circle class="bub b1" cx="26" cy="54" r="2.2"/><circle class="bub b2" cx="36" cy="56" r="1.6"/><circle class="bub b3" cx="31" cy="55" r="2.6"/></g><path class="gl" d="M26 8 H38 V24 L52 50 A6 6 0 0 1 47 58 H17 A6 6 0 0 1 12 50 L26 24 Z"/><path class="gl" d="M23 8 H41"/></svg>',
    graph: '<svg viewBox="0 0 64 64" class="oi oi-graph"><g class="ln"><path class="l1" d="M32 32 L14 16"/><path class="l2" d="M32 32 L52 20"/><path class="l3" d="M32 32 L18 50"/><path class="l4" d="M32 32 L50 48"/><path class="l5" d="M14 16 L52 20"/></g><circle class="nd c0" cx="32" cy="32" r="6"/><circle class="nd c1" cx="14" cy="16" r="4"/><circle class="nd c2" cx="52" cy="20" r="4.5"/><circle class="nd c3" cx="18" cy="50" r="4"/><circle class="nd c4" cx="50" cy="48" r="3.5"/></svg>'
  };
  var reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hap() { try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic('light'); } catch (e) {} }

  var root = null, input, results, cardsEl, panel, frame = null, frameReady = false, queue = [], active = null, sel = -1, items = [], pvSeq = 0, pvT = 0;

  // ---------------------------------------------------------------- the toolkit frame (one, hidden until a card opens)
  function ensureFrame() {
    if (frame) return frame;
    frame = document.createElement('iframe'); frame.title = 'Cognitive Toolkit'; frame.className = 'mo-frame';
    frame.src = PAGE + '#embed=1&panel=1';
    panel.appendChild(frame);
    if (window.MinestToolkitHost && MinestToolkitHost.adopt) MinestToolkitHost.adopt(frame);
    frame.addEventListener('tk-ready', function () { frameReady = true; var q = queue; queue = []; q.forEach(send); preview(); });
    frame.addEventListener('tk-close', function () { closeCard(); });
    frame.addEventListener('tk-capture', function () { close(); });
    frame.addEventListener('tk-holo', function (e) { var w = e.detail && e.detail.wiki; close(); setTimeout(function () { if (MinestToolkitHost && MinestToolkitHost.constellation) MinestToolkitHost.constellation(w); }, 220); });
    return frame;
  }
  function send(m) { if (!frame || !frameReady) { queue.push(m); ensureFrame(); return; } try { frame.contentWindow.postMessage(Object.assign({ type: 'minest-toolkit-cmd' }, m), '*'); } catch (e) {} }
  window.addEventListener('message', function (e) {
    var m = e.data; if (!m || m.type !== 'minest-toolkit-preview' || !frame || e.source !== frame.contentWindow || m.id !== pvSeq) return;
    paintPreview(m.data);
  });

  // ---------------------------------------------------------------- build
  function build() {
    root = document.createElement('div'); root.className = 'mo-root'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'My World');
    root.innerHTML = '<div class="mo-backdrop"></div><div class="mo-box">' +
      '<div class="mo-bar"><span class="mo-glow" aria-hidden="true"></span><svg class="mo-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.6-4.6"/><path class="sp" d="M18.5 3.5v3M17 5h3"/></svg>' +
      '<input class="mo-in" type="text" autocomplete="off" spellcheck="false" placeholder="搜索或搭建你的世界 · Search or build a world" aria-label="搜索或搭建你的世界"><kbd>esc</kbd></div>' +
      '<div class="mo-res" role="listbox"></div>' +
      '<div class="mo-cards" role="toolbar" aria-label="Cognitive Toolkit">' + CARDS.map(function (c, i) {
        return '<button type="button" class="mo-card" data-card="' + c.id + '" style="--c:' + c.c + ';--c2:' + c.c2 + ';--i:' + i + '"><span class="mo-shine"></span><span class="mo-icon">' + ICON[c.id] + '</span>' +
          '<span class="mo-names"><b>' + c.zh + '</b><em>' + c.en + '</em></span><span class="mo-pv">' + c.line + '</span></button>';
      }).join('') + '</div>' +
      '<div class="mo-panel"><div class="mo-panel-top"><span class="mo-panel-t"></span><button type="button" class="mo-pclose" aria-label="收起 Close">⌄</button></div></div></div>';
    document.body.appendChild(root);
    input = root.querySelector('.mo-in'); results = root.querySelector('.mo-res'); cardsEl = root.querySelector('.mo-cards'); panel = root.querySelector('.mo-panel');
    root.querySelector('.mo-backdrop').addEventListener('click', close);
    input.addEventListener('input', function () { search(); clearTimeout(pvT); pvT = setTimeout(preview, 160); root.classList.toggle('dirty', !!active); });   // an open tool changes only on Enter (no half-typed objects)
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); } else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); if (active) { var b = cardsEl.querySelector('[data-card="' + active + '"]'); root.classList.remove('dirty'); openCard(active, b); } else go(items[sel >= 0 ? sel : 0]); }
    });
    results.addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (b) go(items[+b.getAttribute('data-k')]); });
    cardsEl.addEventListener('click', function (e) { var b = e.target.closest('[data-card]'); if (b) openCard(b.getAttribute('data-card'), b); });
    cardsEl.addEventListener('pointermove', function (e) { if (reduce) return; var b = e.target.closest('.mo-card'); if (!b) return; var r = b.getBoundingClientRect(); b.style.setProperty('--rx', (((e.clientY - r.top) / r.height - 0.5) * -14).toFixed(1) + 'deg'); b.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 16).toFixed(1) + 'deg'); b.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(0) + '%'); });
    cardsEl.addEventListener('pointerleave', function () { [].forEach.call(cardsEl.children, function (b) { b.style.removeProperty('--rx'); b.style.removeProperty('--ry'); }); }, true);
    root.querySelector('.mo-pclose').addEventListener('click', closeCard);
    ['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach(function (t) { root.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });
  }

  // ---------------------------------------------------------------- search your worlds + build
  function worlds() { try { return (window.MinestWorld && MinestWorld.worlds ? MinestWorld.worlds() : []).map(function (x) { return x.b || x; }); } catch (e) { return []; } }
  function search() {
    var q = input.value.trim(), ql = q.toLowerCase(); items = [];
    if (q) {
      var K = window.MinestKnowledge;
      worlds().forEach(function (b) {
        if ((b.title || '').toLowerCase().indexOf(ql) >= 0) items.push({ k: 'w', t: b.title, s: '世界 World', b: b });
        (b.columns || []).forEach(function (c) {
          if ((c.title || '').toLowerCase().indexOf(ql) >= 0) items.push({ k: 'l', t: c.title, s: b.title + ' · 列表 List', b: b, c: c });
          (c.cards || []).forEach(function (k) { if (!k || !k.title || (K && K.isHeading && K.isHeading(k.id))) return; if (k.title.toLowerCase().indexOf(ql) >= 0) items.push({ k: 'c', t: k.title, s: b.title + ' › ' + (c.title || ''), b: b, c: c, card: k }); });
        });
      });
      items = items.slice(0, 6);
      items.push({ k: 'build', t: '✦ 搭建世界「' + q + '」', s: 'Build a world about it' });
    } else {
      items = worlds().slice(0, 4).map(function (b) { return { k: 'w', t: b.title, s: '世界 World', b: b }; });
      items.push({ k: 'home', t: '打开 My World', s: 'All my worlds' });
    }
    sel = items.length ? 0 : -1;
    results.innerHTML = items.map(function (it, i) { return '<button type="button" role="option" class="mo-r k-' + it.k + (i === sel ? ' on' : '') + '" data-k="' + i + '"><b>' + esc(it.t) + '</b><small>' + esc(it.s) + '</small></button>'; }).join('');
  }
  function move(d) { if (!items.length) return; sel = (sel + d + items.length) % items.length; [].forEach.call(results.children, function (b, i) { b.classList.toggle('on', i === sel); }); }
  function go(it) {
    if (!it) return; var q = input.value.trim();
    close();
    setTimeout(function () {
      try {
        if (it.k === 'build') { if (window.MinestNewWorld) MinestNewWorld.open('gen', q); else if (window.MinestMyWorld) MinestMyWorld.gallery(); }
        else if (it.k === 'home') { if (window.MinestMyWorld) MinestMyWorld.open(); }
        else if (it.k === 'w') { if (window.MinestMyWorld && MinestMyWorld.world) MinestMyWorld.world(it.b.id); else if (window.MinestAI) MinestAI.selectBoard(it.b.id); }
        else if (it.k === 'l') { if (window.MinestAI && MinestAI.showList) MinestAI.showList(it.b.id, it.c.id); }
        else if (it.k === 'c') { if (window.MinestAI && MinestAI.openCardIn) MinestAI.openCardIn(it.b.id, it.c.id, it.card.id); }
      } catch (e) {}
    }, 220);
  }

  // ---------------------------------------------------------------- live previews on the cards
  function preview() {
    var q = input.value.trim();
    if (!q) { paintPreview(null); return; }
    pvSeq++; send({ cmd: 'preview', input: q, id: pvSeq });
  }
  function paintPreview(d) {
    CARDS.forEach(function (c) {
      var el = cardsEl.querySelector('[data-card="' + c.id + '"] .mo-pv'), t = c.line;
      if (d) t = c.id === 'compass' ? (d.place || '还不确定 · uncertain') : c.id === 'framework' ? (d.framework || t) : c.id === 'models' ? (d.model || t) : c.id === 'lab' ? (d.lab || '选一个实验') : (d.saved ? d.concepts + ' 个概念 · ' + d.links + ' 条连线' : (d.related && d.related.length ? '连向 ' + d.related.slice(0, 2).join('、') : t));
      if (el.textContent === t) return;
      el.classList.remove('in'); void el.offsetWidth; el.textContent = t; el.classList.add('in');
    });
    root.classList.toggle('has-text', !!d);
  }

  // ---------------------------------------------------------------- a card opens into its tool (FLIP from the card)
  function openCard(id, btn) {
    hap(); var q = input.value.trim(), first = !active; active = id;
    [].forEach.call(cardsEl.children, function (b) { b.classList.toggle('on', b.getAttribute('data-card') === id); b.setAttribute('aria-pressed', String(b.getAttribute('data-card') === id)); });
    var c = CARDS.filter(function (x) { return x.id === id; })[0]; root.querySelector('.mo-panel-t').innerHTML = '<i style="background:' + c.c + '"></i>' + c.zh + ' · ' + c.en + (q ? ' — ' + esc(q) : '');
    panel.style.setProperty('--c', c.c);
    ensureFrame(); send({ cmd: 'open', card: id, input: q });
    if (first) {
      var from = btn.getBoundingClientRect();
      root.classList.add('has-panel');
      var to = panel.getBoundingClientRect();
      if (!reduce && to.width) {
        panel.style.transformOrigin = '0 0';
        panel.style.transform = 'translate(' + (from.left - to.left) + 'px,' + (from.top - to.top) + 'px) scale(' + (from.width / to.width) + ',' + (from.height / to.height) + ')';
        panel.style.opacity = '0.4'; panel.getBoundingClientRect();
        panel.style.transition = 'transform .5s cubic-bezier(.2,.9,.25,1), opacity .35s'; panel.style.transform = ''; panel.style.opacity = '';
        setTimeout(function () { panel.style.transition = ''; }, 520);
      }
    }
  }
  function closeCard() {
    if (!active) return; var b = cardsEl.querySelector('[data-card="' + active + '"]'); active = null;
    [].forEach.call(cardsEl.children, function (x) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
    if (!reduce && b) {
      var from = panel.getBoundingClientRect();
      root.classList.remove('has-panel'); var to = b.getBoundingClientRect(); root.classList.add('has-panel', 'folding');
      panel.style.transformOrigin = '0 0'; panel.style.transition = 'transform .38s cubic-bezier(.5,0,.75,0), opacity .3s';
      panel.style.transform = 'translate(' + (to.left - from.left) + 'px,' + (to.top - from.top) + 'px) scale(' + (to.width / from.width) + ',' + (to.height / from.height) + ')'; panel.style.opacity = '0';
      setTimeout(function () { root.classList.remove('has-panel', 'folding'); panel.style.transition = panel.style.transform = panel.style.opacity = ''; }, 380);
    } else root.classList.remove('has-panel');
    setTimeout(function () { input.focus(); }, 60);
  }

  // ---------------------------------------------------------------- open / close
  function open(o) {
    o = o || {}; if (document.documentElement.classList.contains('student-mode')) return;   // students see only their activity
    if (!root) build();
    root.classList.remove('out'); root.classList.add('on'); document.documentElement.classList.add('mo-open');
    if (o.input != null) input.value = o.input;
    search(); ensureFrame(); preview();
    setTimeout(function () { input.focus(); if (o.input == null) input.select(); }, 30);
    if (o.card) { var b = cardsEl.querySelector('[data-card="' + o.card + '"]'); if (b) setTimeout(function () { openCard(o.card, b); }, reduce ? 0 : 380); }
  }
  function close() {
    if (!root || !root.classList.contains('on')) return;
    if (active) { root.classList.remove('has-panel'); active = null; [].forEach.call(cardsEl.children, function (x) { x.classList.remove('on'); }); }
    root.classList.add('out'); document.documentElement.classList.remove('mo-open');
    setTimeout(function () { root.classList.remove('on', 'out'); }, reduce ? 0 : 260);
  }
  function isOpen() { return !!(root && root.classList.contains('on')); }
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if (isOpen()) close(); else open(); return; }
    // a philosophy model on top (host.js .mn-phil) takes Esc first
    if (e.key === 'Escape' && isOpen() && !document.querySelector('.mn-phil')) { e.preventDefault(); e.stopPropagation(); if (active) closeCard(); else close(); }
  }, true);

  // ---------------------------------------------------------------- style
  var css = document.createElement('style'); css.id = 'mo-css';
  css.textContent = [
    '.mo-root{position:fixed;inset:0;z-index:2147483640;display:none;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Segoe UI",sans-serif;color:#f2f4ff}',
    '.mo-root.on{display:block}',
    '.mo-backdrop{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 18%,rgba(60,50,120,.42),rgba(6,6,16,.62));-webkit-backdrop-filter:blur(14px) saturate(1.2);backdrop-filter:blur(14px) saturate(1.2);animation:moFade .25s both}',
    '.mo-root.out .mo-backdrop{animation:moFadeOut .25s both}.mo-root.out .mo-box{animation:moDrop .25s reverse both}',
    '.mo-box{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + max(14px,7vh));transform:translateX(-50%);width:min(760px,calc(100vw - 24px));display:grid;gap:12px;animation:moDrop .42s cubic-bezier(.2,1.2,.3,1) both}',
    /* the bar: glass with a slowly turning aurora edge */
    '.mo-bar{position:relative;display:flex;align-items:center;gap:12px;height:60px;padding:0 16px;border-radius:20px;background:rgba(22,20,40,.78);-webkit-backdrop-filter:blur(30px);backdrop-filter:blur(30px);box-shadow:0 20px 50px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.12);isolation:isolate}',
    '.mo-glow{position:absolute;inset:-1.5px;border-radius:21.5px;z-index:-1;background:conic-gradient(from var(--moa,0deg),#9b5de5,#5e9cff,#1fbf75,#f08c3a,#00a6a6,#9b5de5);animation:moAura 6s linear infinite;opacity:.85}',
    '.mo-glow::after{content:"";position:absolute;inset:1.5px;border-radius:20px;background:rgba(22,20,40,.96)}',
    '@property --moa{syntax:"<angle>";inherits:false;initial-value:0deg}',
    '.mo-ic{width:24px;height:24px;flex:none;fill:none;stroke:#cfd6ff;stroke-width:2;stroke-linecap:round}.mo-ic .sp{stroke:#ffe28a;animation:moTw 2.4s ease-in-out infinite}',
    '.mo-in{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;color:#fff;font:500 19px/1 inherit;font-family:inherit}.mo-in::placeholder{color:rgba(220,225,255,.5)}',
    '.mo-bar kbd{font:600 11px/1 ui-monospace,monospace;padding:5px 7px;border-radius:7px;background:rgba(255,255,255,.08);color:rgba(230,235,255,.6)}',
    '.mo-res{display:grid;gap:4px;padding:6px;border-radius:18px;background:rgba(22,20,40,.7);-webkit-backdrop-filter:blur(26px);backdrop-filter:blur(26px);box-shadow:0 12px 30px rgba(0,0,0,.3);max-height:34vh;overflow:auto;animation:moRise .35s .05s both}',
    '.mo-res:empty{display:none}',
    '.mo-r{display:flex;align-items:baseline;gap:10px;width:100%;text-align:left;border:0;background:transparent;color:inherit;padding:10px 12px;border-radius:12px;font:inherit;cursor:pointer}',
    '.mo-r b{font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mo-r small{color:rgba(210,215,245,.6);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.mo-r.on,.mo-r:hover{background:rgba(255,255,255,.09)}.mo-r.k-build b{color:#ffe28a}.mo-r.k-build.on{background:rgba(255,226,138,.13)}',
    /* the five cards */
    '.mo-cards{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;perspective:900px}',
    '.mo-card{position:relative;display:grid;justify-items:start;align-content:start;gap:6px;min-height:150px;padding:14px 12px 12px;border-radius:20px;border:1px solid color-mix(in srgb,var(--c) 45%,rgba(255,255,255,.12));cursor:pointer;color:#fff;text-align:left;overflow:hidden;font:inherit;',
    '  background:linear-gradient(155deg,color-mix(in srgb,var(--c) 34%,rgba(24,22,44,.9)),rgba(20,18,38,.88) 62%);-webkit-backdrop-filter:blur(24px);backdrop-filter:blur(24px);',
    '  box-shadow:0 14px 30px -14px color-mix(in srgb,var(--c) 80%,transparent),inset 0 1px 0 rgba(255,255,255,.14);transform:rotateX(var(--rx,0)) rotateY(var(--ry,0)) translateZ(0);transition:transform .25s ease-out,box-shadow .25s,min-height .4s cubic-bezier(.2,.9,.3,1),padding .4s;animation:moCard .55s cubic-bezier(.2,1.35,.35,1) both;animation-delay:calc(.06s + var(--i) * 55ms)}',
    '.mo-card:hover{box-shadow:0 22px 40px -14px color-mix(in srgb,var(--c) 95%,transparent),inset 0 1px 0 rgba(255,255,255,.2)}',
    '.mo-card:active{transform:rotateX(var(--rx,0)) rotateY(var(--ry,0)) scale(.96)}',
    '.mo-card:focus-visible{outline:2px solid var(--c2);outline-offset:3px}',
    '.mo-shine{position:absolute;inset:0;background:radial-gradient(circle at var(--mx,30%) 0%,rgba(255,255,255,.22),transparent 55%);opacity:0;transition:opacity .25s;pointer-events:none}.mo-card:hover .mo-shine{opacity:1}',
    '.mo-icon{width:46px;height:46px;display:block}.mo-icon svg{width:100%;height:100%;overflow:visible}',
    '.mo-names{display:grid;line-height:1.15}.mo-names b{font-size:15px;font-weight:700}.mo-names em{font-style:normal;font-size:11px;letter-spacing:.04em;color:color-mix(in srgb,var(--c2) 80%,#fff)}',
    '.mo-pv{font-size:12px;line-height:1.3;color:rgba(235,238,255,.78);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.6em}',
    '.mo-pv.in{animation:moPv .35s ease-out}.mo-root.has-text .mo-pv{color:#fff}',
    '.mo-card.on{border-color:var(--c2);box-shadow:0 0 0 2px color-mix(in srgb,var(--c2) 70%,transparent),0 16px 34px -12px var(--c)}',
    /* living icons */
    '.oi *{vector-effect:non-scaling-stroke}',
    '.oi-compass .ring{fill:rgba(255,255,255,.06);stroke:var(--c2);stroke-width:2}.oi-compass .ring2{fill:none;stroke:rgba(255,255,255,.35);stroke-width:1;stroke-dasharray:3 4;transform-origin:32px 32px;animation:moSpin 14s linear infinite reverse}',
    '.oi-compass .ticks line{stroke:#fff;stroke-width:1.6;stroke-linecap:round}.oi-compass .needle{transform-origin:32px 32px;animation:moNeedle 3.6s ease-in-out infinite}.oi-compass .n1{fill:#ff6b8b}.oi-compass .n2{fill:#fff}.oi-compass .hub{fill:#1d1838;stroke:#fff;stroke-width:1.5}',
    '.mo-card:hover .oi-compass .needle{animation:moNeedleFind .9s cubic-bezier(.3,1.6,.5,1) both}',
    '.oi-framework .br{fill:none;stroke:var(--c2);stroke-width:2;stroke-linecap:round;stroke-dasharray:80;stroke-dashoffset:80;animation:moDraw 3.2s ease-in-out infinite}.oi-framework .b2{animation-delay:.35s}',
    '.oi-framework .nd{fill:rgba(255,255,255,.12);stroke:#fff;stroke-width:1.6;transform-box:fill-box;transform-origin:center;animation:moPop 3.2s ease-in-out infinite}',
    '.oi-framework .n0{fill:var(--c2);animation-delay:0s}.oi-framework .n1{animation-delay:.45s}.oi-framework .n2{animation-delay:.6s}.oi-framework .n3{animation-delay:.75s}.oi-framework .n4{animation-delay:1s}.oi-framework .n5{animation-delay:1.1s}',
    '.oi-models circle{fill:none;stroke:#fff;stroke-width:1.6}.oi-models .tr{fill:rgba(255,255,255,.12)}.oi-models .fl{fill:var(--c2);transform-box:fill-box;transform-origin:left center;transform:scaleX(0);animation:moFill 3.6s ease-in-out infinite}',
    '.oi-models .r2 .fl{animation-delay:.5s}.oi-models .r3 .fl{animation-delay:1s}.oi-models .r1 circle{animation:moDot 3.6s infinite}.oi-models .r2 circle{animation:moDot 3.6s .5s infinite}.oi-models .r3 circle{animation:moDot 3.6s 1s infinite}',
    '.oi-models .ck{fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;opacity:0}',
    '.oi-lab .gl{fill:none;stroke:#fff;stroke-width:1.8;stroke-linejoin:round}.oi-lab .liq{fill:var(--c2);opacity:.85;animation:moWave 2.4s linear infinite}',
    '.oi-lab .bub{fill:#fff;opacity:0;animation:moBub 2.6s ease-in infinite}.oi-lab .b2{animation-delay:.8s}.oi-lab .b3{animation-delay:1.5s}',
    '.mo-card:hover .oi-lab .bub{animation-duration:1.2s}',
    '.oi-graph .ln path{fill:none;stroke:var(--c2);stroke-width:1.8;stroke-linecap:round;stroke-dasharray:40;stroke-dashoffset:40;animation:moDraw 3.4s ease-in-out infinite}',
    '.oi-graph .l2{animation-delay:.2s}.oi-graph .l3{animation-delay:.4s}.oi-graph .l4{animation-delay:.6s}.oi-graph .l5{animation-delay:.9s}',
    '.oi-graph .nd{fill:#fff;transform-box:fill-box;transform-origin:center;animation:moPulse 3.4s ease-in-out infinite}.oi-graph .c0{fill:var(--c2)}.oi-graph .c1{animation-delay:.3s}.oi-graph .c2{animation-delay:.5s}.oi-graph .c3{animation-delay:.7s}.oi-graph .c4{animation-delay:.9s}',
    /* a card open: the five become a switcher, the tool opens below */
    '.mo-panel{display:none;position:relative;border-radius:22px;overflow:hidden;background:rgba(18,16,34,.94);border:1px solid color-mix(in srgb,var(--c,#9b5de5) 50%,rgba(255,255,255,.12));box-shadow:0 30px 60px rgba(0,0,0,.5);height:min(66vh,680px)}',
    '.mo-root.has-panel .mo-panel{display:flex;flex-direction:column}',
    '.mo-root.has-panel .mo-res{display:none}',
    '.mo-root.has-panel .mo-card{min-height:52px;padding:8px 10px;grid-template-columns:30px 1fr;align-items:center;column-gap:8px;animation:none}',
    '.mo-root.has-panel .mo-icon{width:30px;height:30px;grid-row:span 2}.mo-root.has-panel .mo-pv{display:none}.mo-root.has-panel .mo-names b{font-size:13px}.mo-root.has-panel .mo-names em{font-size:10px}',
    '.mo-panel-top{display:flex;align-items:center;justify-content:space-between;padding:8px 10px 8px 16px;font-size:13px;font-weight:600;border-bottom:1px solid rgba(255,255,255,.08)}',
    '.mo-panel-t{display:flex;align-items:center;gap:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mo-panel-t i{width:9px;height:9px;border-radius:50%;flex:none}',
    '.mo-pclose{width:32px;height:32px;border-radius:10px;border:0;background:rgba(255,255,255,.08);color:#fff;font-size:18px;cursor:pointer}',
    '.mo-frame{flex:1;width:100%;border:0;background:transparent}',
    '.mo-panel .mo-frame{display:block}',
    /* phones */
    '@media (max-width:640px){.mo-box{top:calc(env(safe-area-inset-top,0px) + 10px);gap:10px}.mo-bar{height:54px}.mo-in{font-size:17px}.mo-bar kbd{display:none}',
    '  .mo-cards{grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}.mo-card{min-height:104px;padding:12px 3px 10px;border-radius:16px;justify-items:center;text-align:center}.mo-icon{width:36px;height:36px}.mo-names b{font-size:11px;white-space:nowrap;letter-spacing:-.02em}.mo-names em,.mo-pv{display:none}',
    '  .mo-root.has-panel .mo-card{grid-template-columns:1fr;justify-items:center;min-height:46px;padding:6px 2px}.mo-root.has-panel .mo-names{display:none}.mo-panel{height:calc(100vh - 210px)}}',
    '@keyframes moFade{from{opacity:0}}@keyframes moFadeOut{to{opacity:0}}',
    '@keyframes moDrop{from{opacity:0;transform:translateX(-50%) translateY(-14px) scale(.97)}}',
    '@keyframes moRise{from{opacity:0;transform:translateY(-6px)}}',
    '@keyframes moCard{0%{opacity:0;transform:translateY(-26px) rotateX(28deg) scale(.86)}100%{opacity:1}}',
    '@keyframes moSpin{to{transform:rotate(360deg)}}',
    '@keyframes moAura{to{--moa:360deg}}',   /* only the colours turn round the edge, never the box */
    '@keyframes moTw{0%,100%{opacity:.3}50%{opacity:1}}',
    '@keyframes moNeedle{0%,100%{transform:rotate(-22deg)}45%{transform:rotate(18deg)}70%{transform:rotate(8deg)}}',
    '@keyframes moNeedleFind{0%{transform:rotate(-30deg)}60%{transform:rotate(200deg)}100%{transform:rotate(180deg)}}',
    '@keyframes moDraw{0%{stroke-dashoffset:80}40%,75%{stroke-dashoffset:0}100%{stroke-dashoffset:-80}}',
    '@keyframes moPop{0%,8%{transform:scale(.4);opacity:.2}22%,80%{transform:scale(1);opacity:1}100%{transform:scale(.4);opacity:.2}}',
    '@keyframes moFill{0%,10%{transform:scaleX(0)}40%,85%{transform:scaleX(1)}100%{transform:scaleX(0)}}',
    '@keyframes moDot{0%,30%{fill:none}40%,85%{fill:var(--c2)}100%{fill:none}}',
    '@keyframes moWave{from{transform:translateX(0)}to{transform:translateX(-32px)}}',
    '@keyframes moBub{0%{opacity:0;transform:translateY(0)}20%{opacity:.9}100%{opacity:0;transform:translateY(-26px)}}',
    '@keyframes moPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.35)}}',
    '@keyframes moPv{from{opacity:0;transform:translateY(4px)}}',
    'html.mo-open .mn-bdock{opacity:.35!important;transition:opacity .25s}',
    '@media (prefers-reduced-motion:reduce){.mo-root *,.mo-root *::after{animation:none!important;transition:none!important}.oi-models .fl{transform:scaleX(1)}.oi-framework .br,.oi-graph .ln path{stroke-dashoffset:0}}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(css);

  window.MinestOmni = { open: open, close: close, toggle: function () { if (isOpen()) close(); else open(); }, isOpen: isOpen, openCard: function (id, q) { open({ input: q, card: id }); } };
})();
