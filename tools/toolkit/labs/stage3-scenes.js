/* Scenes for Plato’s Cave, Aristotle’s Four Causes and Hegel: Being, Nothing, Becoming — plus two generic scenes
   ('apply-fields', 'save-generic') any micro-interaction can use. Rendering only: state changes go through ctx.act().
   'judge' and 'layers' come from tools/compass/micro/kant-scenes.js. */
(function () {
  'use strict';
  var M = window.MinestMicro; if (!M) return;
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function tr(s) { return window.MinestI18n ? MinestI18n.t(s) : s; }

  // ================================================================== generic: apply-fields + save-generic
  M.scene('apply-fields', function (c) {
    var F = c.content.apply_fields || [], pre = c.st.apply || {};
    var w = h('form', 'kl-apply', F.map(function (f) { return '<label>' + esc(f.label) + (f.required ? '' : ' <small>(optional)</small>') + '<input name="' + f.id + '" maxlength="200" placeholder="' + esc(f.placeholder || '') + '" value="' + esc(pre[f.id] || '') + '"></label>'; }).join('') +
      '<button type="submit" class="kl-go">Use this</button><p class="kl-ok"></p>');
    c.el.appendChild(w);
    w.addEventListener('submit', function (e) {
      e.preventDefault();
      var rec = {}; F.forEach(function (f) { rec[f.id] = String(w.querySelector('[name="' + f.id + '"]').value || '').trim(); });
      if (F.some(function (f) { return f.required && !rec[f.id]; })) { w.querySelector('.kl-ok').textContent = tr('Fill in the fields that are not optional.'); return; }
      if (c.content.apply_case) rec.case = rec[c.content.apply_case];
      c.act('apply', rec);
      w.querySelector('.kl-ok').textContent = tr(c.content.apply_ok || 'Kept.');
    });
  });
  M.scene('save-generic', function (c) {
    var st = c.st, w = h('div', 'kl-save');
    function opt(step, v) { var o = (step.options || []).filter(function (x) { return x[0] === v; })[0]; return o ? o[1] : (v || '—'); }
    function body() {
      var s = c.saved(), js = c.def.steps.filter(function (x) { return x.field; });
      w.innerHTML = '<dl>' + js.map(function (x) { return '<dt>' + esc(x.prompt) + '</dt><dd>' + esc(opt(x, st[x.field])) + '</dd>'; }).join('') +
        (st.apply ? '<dt>' + esc(tr('Your example')) + '</dt><dd>' + esc((c.content.apply_fields || []).map(function (f) { return st.apply[f.id]; }).filter(Boolean).join(' · ')) + '</dd>' : '') + '</dl>' +
        (s ? '<p class="kl-ok">Saved to this knowledge object. You can see it in the Framework and the Graph.</p>' :
          '<label>What I understood<textarea name="note" rows="3" maxlength="600" placeholder="In my own words…"></textarea></label>' +
          '<label>A question I still have<textarea name="question" rows="2" maxlength="400"></textarea></label><button type="button" class="kl-go">Save to my knowledge</button>');
      var go = w.querySelector('.kl-go');
      if (go) go.onclick = function () { c.act('note', { note: w.querySelector('[name=note]').value.trim(), question: w.querySelector('[name=question]').value.trim() }); c.save(); body(); };
    }
    c.el.appendChild(w); body();
  });

  // ================================================================== Plato’s Cave
  // Real projection: each point of the puppet is projected from the fire onto the wall (x = WALL).
  var WALL = 34, HORSE = [[0, 0], [10, -14], [22, -16], [30, -26], [36, -24], [33, -14], [40, -10], [40, 18], [34, 18], [33, 2], [12, 2], [10, 18], [4, 18], [4, 2], [-6, -4]];
  function shadowPts(fx, fy, ox, oy, k) {
    return HORSE.map(function (p) { var px = ox + p[0] * k, py = oy + p[1] * k, t = (WALL - fx) / (px - fx); return [WALL, fy + (py - fy) * t]; });
  }
  function cave(st, mode) {
    var fx = st.fireX || 380, fy = st.fireY || 120, ox = st.objX || 240, oy = 112, k = 0.9;
    var sp = shadowPts(fx, fy, ox, oy, k), ys = sp.map(function (p) { return p[1]; }), y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys);
    // the shadow is drawn as the horse outline squashed onto the wall's height range, seen face-on on the wall panel
    var hgt = y1 - y0, scale = hgt / (44 * k);
    var face = HORSE.map(function (p) { return [80 + p[0] * scale * k, y0 + (p[1] + 26) * scale * k]; });
    var s = '<svg viewBox="0 0 440 240" class="pc-svg"><defs><radialGradient id="pcFire" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd76a"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient></defs>';
    if (mode === 'outside') {
      return s + '<rect width="440" height="240" fill="#bfe3ff"/><circle cx="380" cy="50" r="26" fill="#ffe27a"/><rect y="180" width="440" height="60" fill="#8cc56b"/>' +
        '<g transform="translate(170 110) scale(2.2)"><polygon points="' + HORSE.map(function (p) { return p.join(','); }).join(' ') + '" fill="#8a5a3c" stroke="#4a2f1f"/><circle cx="33" cy="-21" r="1.4" fill="#111"/></g>' +
        '<text x="20" y="30" class="pc-cap">' + esc(tr('Outside: the real horse, in sunlight')) + '</text></svg>';
    }
    s += '<rect width="440" height="240" fill="#2a2230"/><rect x="0" y="0" width="' + WALL + '" height="240" fill="#4a3d4f"/>';
    s += '<rect x="' + WALL + '" y="0" width="150" height="240" fill="#3a3040" opacity=".7"/>';
    s += '<polygon class="pc-shadow" points="' + face.map(function (p) { return p.join(','); }).join(' ') + '"/>';
    if (mode !== 'wall') {
      s += '<rect x="196" y="130" width="70" height="60" fill="#5a4a5e"/><text x="200" y="205" class="pc-lab">' + esc(tr('low wall')) + '</text>';
      s += '<g transform="translate(' + ox + ' ' + oy + ') scale(' + k + ')"><polygon points="' + HORSE.map(function (p) { return p.join(','); }).join(' ') + '" fill="#b98a5a" stroke="#6a4a2f"/><line x1="20" y1="18" x2="20" y2="40" stroke="#6a4a2f" stroke-width="2"/></g>';
      s += '<circle cx="' + fx + '" cy="' + fy + '" r="46" fill="url(#pcFire)"/><path d="M' + (fx - 9) + ' ' + (fy + 14) + ' q9 -34 18 0 z" fill="#ffb13b"/>';
      s += '<line class="pc-ray" x1="' + fx + '" y1="' + fy + '" x2="' + WALL + '" y2="' + y0 + '"/><line class="pc-ray" x1="' + fx + '" y1="' + fy + '" x2="' + WALL + '" y2="' + y1 + '"/>';
    }
    var px = mode === 'fire' ? 150 : 120;
    s += '<g transform="translate(' + px + ' 196)"><circle r="9" cy="-26" fill="#c9b7d6"/><rect x="-8" y="-17" width="16" height="22" rx="6" fill="#9c86ad"/>' + (mode === 'fire' ? '' : '<path d="M-14 6 h28" stroke="#888" stroke-width="3" stroke-dasharray="3 2"/>') + '</g>';
    s += '<text x="40" y="22" class="pc-cap">' + esc(tr(mode === 'wall' ? 'What the prisoner sees: the wall' : 'Turned around: the fire and the puppets')) + '</text>';
    return s + '</svg>';
  }
  M.scene('cave', function (c) {
    var w = h('div', 'pc-room'); c.el.appendChild(w);
    var st = { fireX: 380, fireY: 120, objX: 200 }, t0 = performance.now(), live = true;
    function frame() { if (!live) return; st.objX = 230 + Math.sin((performance.now() - t0) / 900) * 40; w.innerHTML = cave(st, 'wall'); setTimeout(frame, 60); }
    frame();
    var b = h('button', 'kl-go', 'I’ve watched the wall'); b.type = 'button'; c.el.appendChild(b);
    b.onclick = function () { c.act('seen'); b.disabled = true; };
    if (c.st.seen) b.disabled = true;
    return { destroy: function () { live = false; } };
  });
  M.scene('cave-probe', function (c) {
    var w = h('div', 'pc-room'); c.el.appendChild(w);
    var ctl = h('div', 'pc-ctl',
      '<label>Fire height<input type="range" min="40" max="200" data-r="fire"></label><label>Puppet: nearer the wall ↔ nearer the fire<input type="range" min="205" max="300" data-r="obj"></label>' +
      '<div class="row"><button type="button" data-v="face-wall">Face the wall</button><button type="button" data-v="turn-around">Turn around</button><button type="button" data-v="go-outside">Go outside</button></div><p class="lr-tried"></p>');
    c.el.appendChild(ctl);
    ctl.querySelector('[data-r=fire]').value = c.st.fireY; ctl.querySelector('[data-r=obj]').value = c.st.objX;
    function note(k) { var t = (c.st.tried || []).slice(); if (t.indexOf(k) < 0) { t.push(k); c.act('record', t); } }
    ctl.addEventListener('input', function (e) {
      if (e.target.matches('[data-r=fire]')) { c.act('move-fire', +e.target.value); note('fire'); }
      if (e.target.matches('[data-r=obj]')) { c.act('move-object', +e.target.value); note('object'); }
    });
    ctl.addEventListener('click', function (e) { var b = e.target.closest('[data-v]'); if (!b) return; var v = b.getAttribute('data-v'); c.act(v); if (v !== 'face-wall') note(v === 'turn-around' ? 'turn' : 'outside'); });
    function upd(s) {
      w.innerHTML = cave(s, s.view);
      [].forEach.call(ctl.querySelectorAll('[data-v]'), function (b) { b.classList.toggle('on', ({ 'face-wall': 'wall', 'turn-around': 'fire', 'go-outside': 'outside' })[b.getAttribute('data-v')] === s.view); });
      ctl.querySelector('.lr-tried').textContent = tr('Things tried') + ': ' + (s.tried || []).length + ' / 4' + ((s.tried || []).length < 3 ? ' — ' + tr('try at least 3') : '');
    }
    upd(c.st);
    return { update: upd };
  });

  // ================================================================== Aristotle’s Four Causes
  M.scene('causes-pick', function (c) {
    var O = c.content.objects, w = h('div', 'ac-pick', Object.keys(O).map(function (k) { return '<button type="button" data-o="' + k + '" class="ac-obj"><span class="ac-ic ic-' + k + '"></span><b>' + esc(O[k].label) + '</b>' + (O[k].note ? '<small>' + esc(O[k].note) + '</small>' : '') + '</button>'; }).join(''));
    c.el.appendChild(w);
    w.addEventListener('click', function (e) { var b = e.target.closest('[data-o]'); if (b) c.act('pick', b.getAttribute('data-o')); });
    function upd(s) { [].forEach.call(w.querySelectorAll('[data-o]'), function (b) { b.classList.toggle('on', b.getAttribute('data-o') === s.obj); }); }
    upd(c.st); return { update: upd };
  });
  M.scene('causes-bench', function (c) {
    var obj = c.content.objects[c.st.obj], S = c.content.slots, sel = null, msg = '';
    var cards = obj.cards.slice().sort(function (a, b) { return (a.id < b.id ? -1 : 1); });
    var w = h('div', 'ac-bench'); c.el.appendChild(w);
    function paint(s) {
      var placed = s.placed || {}, used = {}; Object.keys(placed).forEach(function (k) { used[placed[k]] = k; });
      w.innerHTML = '<p class="ac-thing">' + esc(obj.label) + '</p><div class="ac-slots">' + S.map(function (sl) {
        var cid = placed[sl.id], cd = cards.filter(function (x) { return x.id === cid; })[0];
        return '<button type="button" class="ac-slot' + (cd ? ' full' : '') + '" data-slot="' + sl.id + '"><b>' + esc(sl.label) + '</b><small>' + esc(sl.q) + '</small><span>' + (cd ? esc(cd.text) : '…') + '</span></button>';
      }).join('') + '</div><div class="ac-cards">' + cards.filter(function (x) { return !used[x.id]; }).map(function (x) { return '<button type="button" class="ac-card' + (sel === x.id ? ' sel' : '') + '" data-card="' + x.id + '">' + esc(x.text) + '</button>'; }).join('') + '</div>' +
        '<p class="ac-msg">' + esc(msg) + '</p><p class="lr-tried">' + esc(tr('Correct')) + ': ' + (s.correct || 0) + ' / 4</p>';
    }
    w.addEventListener('click', function (e) {
      var cb = e.target.closest('[data-card]'), sb = e.target.closest('[data-slot]');
      if (cb) { sel = cb.getAttribute('data-card'); msg = ''; return paint(c.st); }
      if (sb && sel) {
        var cd = cards.filter(function (x) { return x.id === sel; })[0], slot = sb.getAttribute('data-slot'), placed = Object.assign({}, c.st.placed || {}), res;
        if (cd.slot === 'none') { res = 'none'; msg = tr(cd.why || ''); }
        else if (cd.slot === slot) { res = 'right'; placed[slot] = cd.id; msg = ''; }
        else { res = 'wrong'; msg = ''; }
        var correct = Object.keys(placed).filter(function (k) { var x = cards.filter(function (y) { return y.id === placed[k]; })[0]; return x && x.slot === k; }).length;
        sel = null; c.act('place', { placed: placed, lastResult: res, correct: correct, wrongs: (c.st.wrongs || 0) + (res === 'right' ? 0 : 1) });
      }
    });
    paint(c.st);
    return { update: paint };
  });

  // ================================================================== Hegel: being, nothing, becoming
  M.scene('hegel-strip', function (c) {
    var F = c.content.features, w = h('div', 'hg-strip'); c.el.appendChild(w);
    var gone = {}; if (c.st.left === 0) F.forEach(function (f) { gone[f] = 1; });
    function paint() {
      var left = F.filter(function (f) { return !gone[f]; });
      w.innerHTML = '<div class="hg-thing" style="--k:' + (left.length / F.length) + '"><span>' + esc(left.length ? tr('something') : tr('pure being')) + '</span></div>' +
        '<div class="hg-feats">' + F.map(function (f) { return '<button type="button" class="chip' + (gone[f] ? ' gone' : '') + '" data-f="' + esc(f) + '"' + (gone[f] ? ' disabled' : '') + '>' + esc(f) + (gone[f] ? '' : ' ×') + '</button>'; }).join('') + '</div>' +
        '<p class="lr-tried">' + (left.length ? esc(tr('Features left')) + ': ' + left.length : esc(tr('No feature left — no ‘what’ at all.'))) + '</p>';
    }
    w.addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (!b) return; gone[b.getAttribute('data-f')] = 1; paint(); c.act('strip', { left: F.filter(function (f) { return !gone[f]; }).length }); });
    paint(); return {};
  });
  M.scene('hegel-compare', function (c) {
    var D = c.content.differences, w = h('div', 'hg-cmp'), reply = ''; c.el.appendChild(w);
    var live = true;
    function paint(s) {
      w.innerHTML = '<div class="hg-pair' + (s.watched ? ' moving' : '') + '"><span class="hg-b">' + esc(tr('Being')) + '</span><span class="hg-arrows"><i>→ ' + esc(tr('ceasing-to-be')) + '</i><i>← ' + esc(tr('coming-to-be')) + '</i></span><span class="hg-n">' + esc(tr('Nothing')) + '</span></div>' +
        (s.watched ? '<p class="hg-becoming">' + esc(tr('Becoming')) + '</p>' : '') +
        '<p class="dim">' + esc(tr('How does pure being differ from pure nothing? Try one:')) + '</p><div class="hg-diffs">' + D.map(function (d) { return '<button type="button" class="hg-d' + ((s.tried || []).indexOf(d.id) >= 0 ? ' tried' : '') + '" data-d="' + d.id + '">' + esc(d.text) + '</button>'; }).join('') + '</div>' +
        (reply ? '<p class="hg-reply">' + esc(reply) + '</p>' : '') +
        '<div class="row"><button type="button" class="kl-go" data-watch>' + esc(tr(s.watched ? 'Watch again' : 'Watch the two')) + '</button></div>' +
        '<p class="lr-tried">' + esc(tr('Differences tried')) + ': ' + (s.tried || []).length + ' / ' + D.length + ((s.tried || []).length < 2 ? ' — ' + esc(tr('try at least 2')) : '') + '</p>';
    }
    w.addEventListener('click', function (e) {
      var b = e.target.closest('[data-d]');
      if (b) { var d = D.filter(function (x) { return x.id === b.getAttribute('data-d'); })[0], t = (c.st.tried || []).slice(); reply = tr(d.reply); if (t.indexOf(d.id) < 0) t.push(d.id); c.act('try-diff', { tried: t, last: 'diff' }); return; }
      if (e.target.closest('[data-watch]')) { var p = w.querySelector('.hg-pair'); if (p) { p.classList.remove('moving'); void p.offsetWidth; } c.act('watch'); }
    });
    paint(c.st);
    return { update: paint, destroy: function () { live = false; } };
  });
})();
