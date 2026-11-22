/* Scenes for the "locke-room" micro-interaction (The Locked Room). Rendering only — state goes through ctx.act().
   Reuses the 'judge' and 'layers' scenes from tools/compass/micro/kant-scenes.js. */
(function () {
  'use strict';
  var M = window.MinestMicro; if (!M) return;
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // the room: a door with a lock, a man with a thought bubble, two gauges
  function room(host, st, interactive) {
    var el = h('div', 'lr-room' + (interactive ? ' live' : ''),
      '<svg viewBox="0 0 360 200" class="lr-svg" aria-hidden="true">' +
      '<rect x="10" y="10" width="340" height="180" rx="14" class="lr-wall"/><rect x="10" y="150" width="340" height="40" class="lr-floor"/>' +
      '<rect x="270" y="52" width="58" height="98" rx="4" class="lr-door"/><circle cx="317" cy="104" r="4" class="lr-knob"/>' +
      '<g class="lr-lock"><rect x="296" y="82" width="20" height="16" rx="3"/><path d="M300 82 v-6 a6 6 0 0 1 12 0 v6" class="lr-shackle"/></g>' +
      '<g class="lr-friend"><circle cx="70" cy="96" r="12"/><rect x="58" y="110" width="24" height="38" rx="9"/></g>' +
      '<g class="lr-man"><circle cx="160" cy="96" r="13"/><rect x="147" y="111" width="26" height="40" rx="9"/></g>' +
      '<g class="lr-bubble"><ellipse cx="205" cy="52" rx="44" ry="22"/><circle cx="181" cy="78" r="4"/><circle cx="174" cy="86" r="2.5"/><text x="205" y="57" class="lr-wish"></text></g>' +
      '</svg>' +
      '<div class="lr-gauges"><div class="lr-g" data-g="vol"><span>Does what he wants</span><b><i></i></b></div><div class="lr-g" data-g="lib"><span>Could do otherwise</span><b><i></i></b></div></div>');
    host.appendChild(el);
    function paint(s) {
      el.classList.toggle('locked', !!s.locked); el.classList.toggle('knows', !!s.knows); el.classList.toggle('leaving', s.wish === 'leave' && !s.locked);
      el.querySelector('.lr-wish').textContent = s.wish === 'stay' ? 'I’d like to stay' : 'I want to leave';
      var vol = s.wish === 'stay' || !s.locked, lib = !s.locked;
      el.querySelector('[data-g=vol]').classList.toggle('full', vol); el.querySelector('[data-g=lib]').classList.toggle('full', lib);
    }
    paint(st);
    return { el: el, paint: paint };
  }

  M.scene('room', function (c) {
    var r = room(c.el, c.st, false);
    var b = h('button', 'kl-go', 'He wakes up →'); b.type = 'button'; c.el.appendChild(b);
    b.onclick = function () { r.el.classList.add('awake'); c.act('seen'); b.disabled = true; b.textContent = 'He wakes and wants to stay'; };
    if (c.st.seen) { r.el.classList.add('awake'); b.disabled = true; }
    return {};
  });

  M.scene('room-probe', function (c) {
    var r = room(c.el, c.st, true);
    var ctl = h('div', 'lr-ctl',
      '<button type="button" data-t="lock"></button><button type="button" data-t="wish"></button><button type="button" data-t="knows"></button>' +
      '<p class="lr-tried"></p>');
    c.el.appendChild(ctl);
    function combo(s) { return (s.locked ? 'locked' : 'open') + '/' + s.wish; }
    function rec() { var t = (c.st.tried || []).slice(), k = combo(c.st); if (t.indexOf(k) < 0) { t.push(k); c.act('record', t); } }
    ctl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-t]'); if (!b) return; var t = b.getAttribute('data-t');
      if (t === 'lock') c.act('toggle-lock', !c.st.locked);
      if (t === 'wish') c.act('toggle-wish', c.st.wish === 'stay' ? 'leave' : 'stay');
      if (t === 'knows') c.act('toggle-knows', !c.st.knows);
      rec();
    });
    r.el.querySelector('.lr-door').addEventListener('click', function () { c.act('toggle-lock', !c.st.locked); rec(); });
    r.el.querySelector('.lr-bubble').addEventListener('click', function () { c.act('toggle-wish', c.st.wish === 'stay' ? 'leave' : 'stay'); rec(); });
    function upd(s) {
      r.paint(s);
      ctl.querySelector('[data-t=lock]').textContent = s.locked ? '🔓 Unlock the door' : '🔒 Lock the door';
      ctl.querySelector('[data-t=wish]').textContent = s.wish === 'stay' ? 'Make him want to leave' : 'Make him want to stay';
      ctl.querySelector('[data-t=knows]').textContent = s.knows ? 'He doesn’t know about the lock' : 'He knows about the lock';
      var n = (s.tried || []).length;
      ctl.querySelector('.lr-tried').textContent = 'Situations tried: ' + n + ' of 4' + (n < 3 ? ' (try at least 3)' : '');
    }
    upd(c.st); setTimeout(rec, 0);   // record the starting situation once the scene is in place
    return { update: upd };
  });

  M.scene('apply-free', function (c) {
    var pre = c.st.apply || {};
    var w = h('form', 'kl-apply',
      '<label>A situation from your life<input name="s" maxlength="160" placeholder="e.g. I stay at school until 3 pm" value="' + esc(pre.situation || '') + '"></label>' +
      '<fieldset><legend>Do you do it because you want to?</legend><label class="kl-chk"><input type="radio" name="v" value="yes"' + (pre.voluntary === 'yes' ? ' checked' : '') + '> Yes</label><label class="kl-chk"><input type="radio" name="v" value="no"' + (pre.voluntary === 'no' ? ' checked' : '') + '> No</label></fieldset>' +
      '<fieldset><legend>Could you do otherwise if you wanted?</legend><label class="kl-chk"><input type="radio" name="o" value="yes"' + (pre.couldOtherwise === 'yes' ? ' checked' : '') + '> Yes</label><label class="kl-chk"><input type="radio" name="o" value="no"' + (pre.couldOtherwise === 'no' ? ' checked' : '') + '> No</label></fieldset>' +
      '<label>Why (optional)<textarea name="note" rows="2" maxlength="400">' + esc(pre.note || '') + '</textarea></label>' +
      '<button type="submit" class="kl-go">Use this example</button><p class="kl-ok"></p>');
    c.el.appendChild(w);
    var KIND = { 'yes/yes': 'Voluntary and free to do otherwise', 'yes/no': 'Voluntary, but not free to do otherwise — like the locked room', 'no/yes': 'Free to do otherwise, but not what you want', 'no/no': 'Neither voluntary nor free to do otherwise' };
    w.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(w), s = String(fd.get('s') || '').trim(), v = fd.get('v'), o = fd.get('o');
      if (!s || !v || !o) { w.querySelector('.kl-ok').textContent = 'Fill in the situation and both questions.'; return; }
      var rec = { situation: s, voluntary: v, couldOtherwise: o, kind: KIND[v + '/' + o], note: String(fd.get('note') || '').trim() };
      c.act('apply', rec);
      w.querySelector('.kl-ok').textContent = rec.kind + '. Kept as your own judgment.';
    });
  });

  M.scene('save-free', function (c) {
    var st = c.st, w = h('div', 'kl-save'), L = { yes: 'free', no: 'not free', unsure: 'partly' };
    function body() {
      var s = c.saved();
      w.innerHTML = '<dl><dt>Your judgment</dt><dd>' + esc(L[st.judge1] || '—') + ' → ' + esc(L[st.judge2] || '—') + (st.judge1 && st.judge2 && st.judge1 !== st.judge2 ? ' <em>(changed)</em>' : '') + '</dd>' +
        '<dt>Situations tried</dt><dd>' + esc((st.tried || []).join(' · ') || '—') + '</dd>' +
        (st.apply ? '<dt>Your example</dt><dd>' + esc(st.apply.situation) + ' — ' + esc(st.apply.kind) + '</dd>' : '') + '</dl>' +
        (s ? '<p class="kl-ok">Saved to this knowledge object. You can see it in the Framework and the Graph.</p>' :
          '<label>What I understood<textarea name="note" rows="3" maxlength="600" placeholder="In my own words…"></textarea></label>' +
          '<label>A question I still have<textarea name="question" rows="2" maxlength="400"></textarea></label><button type="button" class="kl-go">Save to my knowledge</button>');
      var go = w.querySelector('.kl-go');
      if (go) go.onclick = function () { c.act('note', { note: w.querySelector('[name=note]').value.trim(), question: w.querySelector('[name=question]').value.trim() }); c.save(); body(); };
    }
    c.el.appendChild(w); body();
  });
})();
