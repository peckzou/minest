/* Scenes for the "kant-causality" micro-interaction (Before ≠ Because). Rendering only: every state change goes
   through ctx.act(action, value) → the runner's state machine (tools/compass/micro.js). */
(function () {
  'use strict';
  var M = window.MinestMicro; if (!M) return;
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ------------------------------------------------------------------ the lamp rig: a hidden timer lights A, then B
  // Drawn per frame (rAF) with a timer fallback, so it keeps time even where CSS animations are paused.
  function rig(host, o) {
    var el = h('div', 'kl-rig', '<div class="kl-lamps"><div class="kl-lamp" data-l="a"><i></i><b>A</b></div><div class="kl-lamp" data-l="b"><i></i><b>B</b></div></div>' +
      '<div class="kl-box"><div class="kl-curtain">?</div><div class="kl-timer"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16"/><line class="kl-hand" x1="20" y1="20" x2="20" y2="7"/></svg><span>timer</span></div>' +
      '<svg class="kl-wires" viewBox="0 0 200 60" preserveAspectRatio="none"><path class="kl-w kl-wa" d="M100 58 C100 30 50 30 50 2"/><path class="kl-w kl-wb" d="M100 58 C100 30 150 30 150 2"/></svg></div>');
    host.appendChild(el);
    var A = el.querySelector('[data-l=a]'), B = el.querySelector('[data-l=b]'), hand = el.querySelector('.kl-hand');
    var P = 2400, t0 = performance.now(), lastCycle = 0, raf = 0, fb = 0, dead = false, stopped = false, manualA = 0;
    function frame(now) {
      if (dead) return;
      var t = (now - t0) % P, cyc = Math.floor((now - t0) / P);
      var aOn = !stopped && t > 300 && t < 800, bOn = !stopped && t > 1000 && t < 1500;
      if (manualA && now < manualA) aOn = true;
      A.classList.toggle('on', aOn); B.classList.toggle('on', bOn);
      el.querySelector('.kl-wa').classList.toggle('on', !stopped && t > 250 && t < 800);
      el.querySelector('.kl-wb').classList.toggle('on', !stopped && t > 950 && t < 1500);
      if (!stopped) hand.setAttribute('transform', 'rotate(' + (t / P * 360) + ' 20 20)');
      if (!stopped && cyc > lastCycle) { lastCycle = cyc; if (o.onCycle) o.onCycle(); }
      raf = requestAnimationFrame(frame);
      clearTimeout(fb); fb = setTimeout(function () { frame(performance.now()); }, 120);
    }
    raf = requestAnimationFrame(frame);
    return {
      el: el,
      reveal: function (on) { el.classList.toggle('revealed', !!on); },
      stop: function (on) { stopped = !!on; if (!on) { t0 = performance.now(); lastCycle = 0; } el.classList.toggle('stopped', stopped); },
      pressA: function () { var now = performance.now(), cyc = Math.floor((now - t0) / P); if (!stopped) t0 = now - (cyc * P + 1600); manualA = now + 500;   // move the hidden timer just past B, so B can't coincide with the press
        A.classList.add('pressed'); setTimeout(function () { A.classList.remove('pressed'); }, 500); },
      destroy: function () { dead = true; cancelAnimationFrame(raf); clearTimeout(fb); }
    };
  }

  // ------------------------------------------------------------------ 1 · observe
  M.scene('lamps', function (c) {
    var wrap = h('div', 'kl-solo'); c.el.appendChild(wrap);
    var r = rig(wrap, { onCycle: function () { c.act('cycle'); } });
    var n = h('p', 'kl-count'); wrap.appendChild(n);
    function upd(st) { n.textContent = 'Rounds watched: ' + st.cycles + (st.cycles < 3 ? ' (watch at least 3)' : ''); }
    upd(c.st);
    return { update: upd, destroy: r.destroy };
  });

  // ------------------------------------------------------------------ 2 / 4 · judge
  M.scene('judge', function (c) {
    var f = c.step.field, opts = c.step.options || [['yes', 'Yes, A caused B'], ['no', 'No'], ['unsure', 'Not sure']];
    var w = h('div', 'kl-judge', (f === 'judge2' && c.st.judge1 ? '<p class="kl-was">First you said: <b>' + esc(label(c.st.judge1)) + '</b></p>' : '') +
      '<div class="kl-opts">' + opts.map(function (o) { return '<button type="button" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>');
    c.el.appendChild(w);
    function label(v) { return (opts.filter(function (o) { return o[0] === v; })[0] || [0, v])[1]; }
    w.addEventListener('click', function (e) { var b = e.target.closest('[data-v]'); if (b) c.act('judge', b.getAttribute('data-v')); });
    function upd(st) { [].forEach.call(w.querySelectorAll('[data-v]'), function (b) { b.classList.toggle('on', st[f] === b.getAttribute('data-v')); }); }
    upd(c.st); return { update: upd };
  });

  // ------------------------------------------------------------------ 3 · experiment
  M.scene('probe', function (c) {
    var w = h('div', 'kl-probe');
    w.innerHTML = '<section class="kl-pane"><h4>The lamps</h4><div class="kl-rigslot"></div><div class="kl-ctrl">' +
      '<button type="button" data-a="press-a">Press A yourself</button><button type="button" data-a="open-curtain">Lift the curtain</button><button type="button" data-a="stop-timer">Stop the timer</button></div></section>' +
      '<section class="kl-pane"><div class="kl-tabs"><button type="button" data-tab="house" class="on">The house</button><button type="button" data-tab="ship">The ship</button></div>' +
      '<div class="kl-tab kl-house on"><p class="kl-hint">Look at the three parts in any order you like.</p><div class="kl-hs">' +
      '<button type="button" data-p="roof" class="kl-roof">Roof</button><button type="button" data-p="window" class="kl-win">Window</button><button type="button" data-p="door" class="kl-door">Door</button></div><p class="kl-seq"></p></div>' +
      '<div class="kl-tab kl-ship"><p class="kl-hint">Follow the ship. Tap where you see it — try another order too.</p><div class="kl-river"><span class="kl-flow">downstream →</span>' +
      '<button type="button" data-s="0">Upstream</button><button type="button" data-s="1">Midstream</button><button type="button" data-s="2">Downstream</button><i class="kl-boat">⛵</i></div><p class="kl-seq2"></p></div></section>' +
      '<ul class="kl-todo"><li data-t="press">Intervene on A</li><li data-t="curtain">Look behind the curtain</li><li data-t="house">Look over the house</li><li data-t="ship">Follow the ship</li></ul>';
    c.el.appendChild(w);
    var r = rig(w.querySelector('.kl-rigslot'), {});
    var rigStopped = !!c.st.stopped; r.reveal(c.st.curtain); r.stop(rigStopped);
    w.querySelector('.kl-ctrl').addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return; var a = b.getAttribute('data-a');
      if (a === 'press-a') r.pressA();
      c.act(a === 'stop-timer' && c.st.stopped ? 'start-timer' : a);
    });
    w.querySelector('.kl-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-tab]'); if (!b) return;
      [].forEach.call(w.querySelectorAll('[data-tab]'), function (x) { x.classList.toggle('on', x === b); });
      w.querySelector('.kl-house').classList.toggle('on', b.getAttribute('data-tab') === 'house');
      w.querySelector('.kl-ship').classList.toggle('on', b.getAttribute('data-tab') === 'ship');
    });
    var order = [];
    w.querySelector('.kl-hs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-p]'); if (!b || order.indexOf(b.getAttribute('data-p')) >= 0) return;
      order.push(b.getAttribute('data-p')); b.classList.add('seen');
      w.querySelector('.kl-seq').textContent = 'Your order: ' + order.join(' → ');
      if (order.length === 3) { c.act('house-order', order.slice()); setTimeout(function () { order = []; [].forEach.call(w.querySelectorAll('.kl-hs .seen'), function (x) { x.classList.remove('seen'); }); }, 900); }
    });
    var ship = [], boat = w.querySelector('.kl-boat');
    w.querySelector('.kl-river').addEventListener('click', function (e) {
      var b = e.target.closest('[data-s]'); if (!b) return; var i = +b.getAttribute('data-s');
      if (i !== ship.length) { ship = []; c.act('ship-wrong'); w.querySelector('.kl-river').classList.remove('shake'); void w.offsetWidth; w.querySelector('.kl-river').classList.add('shake'); w.querySelector('.kl-seq2').textContent = 'The ship was not there yet — start again from upstream.'; boat.style.left = '12%'; return; }
      ship.push(i); boat.style.left = (12 + i * 36) + '%';
      w.querySelector('.kl-seq2').textContent = 'Seen: ' + ship.map(function (k) { return ['upstream', 'midstream', 'downstream'][k]; }).join(' → ');
      if (ship.length === 3) { c.act('ship-ok'); ship = []; }
    });
    function upd(st) {
      r.reveal(st.curtain);
      if (!!st.stopped !== rigStopped) { rigStopped = !!st.stopped; r.stop(rigStopped); }
      w.querySelector('[data-a=stop-timer]').textContent = st.stopped ? 'Restart the timer' : 'Stop the timer';
      var done = { press: st.pressA > 0, curtain: st.curtain, house: st.houseOrders > 0, ship: st.shipDone };
      [].forEach.call(w.querySelectorAll('.kl-todo li'), function (li) { li.classList.toggle('done', !!done[li.getAttribute('data-t')]); });
    }
    upd(c.st);
    return { update: upd, destroy: r.destroy };
  });

  // ------------------------------------------------------------------ 5 · explain
  M.scene('layers', function (c) {
    var L = c.content.layers || [], w = h('div', 'kl-layers');
    w.innerHTML = L.map(function (l, i) {
      return '<button type="button" class="kl-layer" data-i="' + i + '"><span class="kl-back">' + esc(l.title) + '<small>tap to turn over</small></span>' +
        '<span class="kl-face"><b>' + esc(l.title) + '</b><em>' + esc(l.tag) + '</em>' + (l.kind ? '<i class="kl-kind k-' + esc(l.kind) + '">' + esc(({ summary: 'Minest summary', interpretation: 'Scholarly interpretation', 'open-question': 'Open question' })[l.kind] || l.kind) + '</i>' : '') + '<span>' + esc(l.body) + '</span>' +
        (l.maps_to ? '<small class="kl-map">In the experiment: ' + esc(l.maps_to) + '</small>' : '') + (l.source ? '<small class="kl-src">Source: ' + esc(l.source) + '</small>' : '') + '</span></button>';
    }).join('') + '<p class="kl-note">' + esc(c.content.map_note || '') + '</p>';
    c.el.appendChild(w);
    w.addEventListener('click', function (e) { var b = e.target.closest('.kl-layer'); if (b && +b.getAttribute('data-i') === c.st.layers) c.act('flip'); });
    function upd(st) { [].forEach.call(w.querySelectorAll('.kl-layer'), function (b, i) { b.classList.toggle('open', i < st.layers); b.classList.toggle('next', i === st.layers); }); w.querySelector('.kl-note').classList.toggle('show', st.layers >= L.length); }
    upd(c.st); return { update: upd };
  });

  // ------------------------------------------------------------------ 6 · apply
  function split(text) {
    var s = String(text || '').trim(), m = s.match(/^(.+?)\s*(之后|以后|后)\s*(.+)$/) || s.match(/^after\s+(.+?),\s*(.+)$/i);
    if (!m) return ['', ''];
    return m.length === 4 ? [m[1], m[3]] : [m[1], m[2]];
  }
  M.scene('apply', function (c) {
    var C = c.content, pre = c.st.apply || {}, guess = split(c.context.text);
    var w = h('form', 'kl-apply');
    w.innerHTML = '<label>What came first (A)<input name="a" maxlength="120" placeholder="e.g. I drank coffee" value="' + esc(pre.a || guess[0]) + '"></label>' +
      '<label>What came after (B)<input name="b" maxlength="120" placeholder="e.g. my test score went up" value="' + esc(pre.b || guess[1]) + '"></label>' +
      '<fieldset><legend>Check it like the lamps</legend>' + C.apply_checks.map(function (x) { return '<label class="kl-chk"><input type="checkbox" name="chk" value="' + x.id + '"' + ((pre.checks || []).indexOf(x.id) >= 0 ? ' checked' : '') + '> ' + esc(x.label) + '</label>'; }).join('') + '</fieldset>' +
      '<fieldset><legend>Your judgment</legend>' + C.apply_verdicts.map(function (x) { return '<label class="kl-chk"><input type="radio" name="v" value="' + x.id + '"' + (pre.verdict === x.id ? ' checked' : '') + '> ' + esc(x.label) + '</label>'; }).join('') + '</fieldset>' +
      '<label>Why (optional)<textarea name="note" rows="2" maxlength="400">' + esc(pre.note || '') + '</textarea></label>' +
      '<button type="submit" class="kl-go">Use this case</button><p class="kl-ok"></p>';
    c.el.appendChild(w);
    w.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(w), rec = { a: String(fd.get('a') || '').trim(), b: String(fd.get('b') || '').trim(), checks: fd.getAll('chk'), verdict: fd.get('v'), note: String(fd.get('note') || '').trim() };
      if (!rec.a || !rec.b || !rec.verdict) { w.querySelector('.kl-ok').textContent = 'Fill in A, B and your judgment.'; return; }
      c.act('apply', rec);
      w.querySelector('.kl-ok').textContent = 'Kept as your own judgment — Minest never decides that one thing caused another.';
    });
  });

  // ------------------------------------------------------------------ 7 · keep
  M.scene('save', function (c) {
    var st = c.st, L = { yes: 'yes', no: 'no', unsure: 'not sure' };
    var w = h('div', 'kl-save');
    function body() {
      var s = c.saved();
      w.innerHTML = '<dl><dt>Your judgment</dt><dd>' + esc(L[st.judge1] || '—') + ' → ' + esc(L[st.judge2] || '—') + (st.judge1 && st.judge2 && st.judge1 !== st.judge2 ? ' <em>(changed)</em>' : '') + '</dd>' +
        '<dt>What you tried</dt><dd>pressed A ×' + st.pressA + ' · curtain ' + (st.curtain ? 'lifted' : 'closed') + ' · timer ' + (st.stopped ? 'stopped' : 'running') + ' · house ×' + st.houseOrders + ' · ship ' + (st.shipDone ? 'followed' : '—') + (st.shipWrong ? ' (tried backwards ×' + st.shipWrong + ')' : '') + '</dd>' +
        (st.apply ? '<dt>Your case</dt><dd>' + esc(st.apply.a) + ' → ' + esc(st.apply.b) + ' · ' + esc(st.apply.verdict) + '</dd>' : '') + '</dl>' +
        (s ? '<p class="kl-ok">Saved to your knowledge log (record ' + esc(s.id) + '). Stored in this browser only — this lab page does not sync.</p>' :
          '<label>What I understood<textarea name="note" rows="3" maxlength="600" placeholder="In my own words…"></textarea></label>' +
          '<label>A question I still have<textarea name="question" rows="2" maxlength="400"></textarea></label><button type="button" class="kl-go">Save to my knowledge log</button>');
      var go = w.querySelector('.kl-go');
      if (go) go.onclick = function () { c.act('note', { note: w.querySelector('[name=note]').value.trim(), question: w.querySelector('[name=question]').value.trim() }); c.save(); body(); };
    }
    c.el.appendChild(w); body();
  });
})();
