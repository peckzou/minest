/* Minest · motion polish (2026-11-26, the user: apply the installed motion / UI skills to Minest).
   Two fixes the page's own style sheets need, made on the live CSS object model so the hundreds of rules behind them
   (most of them in this one 22MB page) need not be edited one by one. Each rule touched is touched once.

   1. Sticky hover, on a touch screen (Emil Kowalski's mobile-native / animation audit: "gate hover motion behind
      (hover: hover) and (pointer: fine)"). A phone has no hover; WebKit fakes one on the first tap and keeps it until
      the next tap elsewhere — so a board card that lifts 2px on hover stays lifted after it is tapped, a button that
      grows 10% stays grown. On a screen that cannot hover, the movement of the hovered element itself is taken out of
      its :hover rule. What a hover *reveals* stays: a rule whose hovered element is an ancestor (a card's action
      capsule shown when the card is hovered), a rule that also shows something (opacity, visibility…), and a move
      back to rest (scale(1), translateY(0)) — on a phone a tap is how those are reached.
   2. "transition: all" (the same audit: it animates properties nobody meant to animate, off the compositor). Each is
      narrowed to the properties that paint — colour, shadow, opacity, transform… — keeping its duration, curve and
      delay. Rules whose element animates its size or place on purpose keep "all" (KEEP_ALL below, found by reading
      the state rules of all 51: the device frame, the board card's side padding, the priority dot, the card-style
      preview, two game targets). */
(function () {
  'use strict';
  if (window.MinestMotionPolish) return;
  var touch = !matchMedia('(hover: hover) and (pointer: fine)').matches;

  var KEEP_ALL = /\.(iphone-frame|liquid-glass-card|card-front-priority-dot|cs-prev|il-target|solo-en-toggle)\b/;
  var PAINT = ['color', 'background-color', 'background-position', 'border-color', 'border-radius', 'outline-color', 'fill', 'stroke',
    'opacity', 'visibility', 'box-shadow', 'text-shadow', 'transform', 'translate', 'scale', 'rotate', 'filter',
    'backdrop-filter', '-webkit-backdrop-filter', 'clip-path', 'stroke-dashoffset'];
  var MOVE = ['transform', 'translate', 'scale', 'rotate'];
  var SHOWS = /^(opacity|visibility|display|pointer-events|max-height|max-width|height|width|clip-path|z-index)$/;

  /* top-level commas only (cubic-bezier(…), :is(…) carry their own) */
  function split(s) { var out = [], d = 0, cur = ''; for (var i = 0; i < s.length; i++) { var c = s[i]; if (c === '(') d++; else if (c === ')') d--; if (c === ',' && !d) { out.push(cur.trim()); cur = ''; } else cur += c; } if (cur.trim()) out.push(cur.trim()); return out; }

  /* a probe to tell a move from a return to rest */
  var probe = null;
  function atRest(prop, v) {
    if (!v || v === 'none') return true;
    if (!probe) { probe = document.createElement('div'); probe.style.cssText = 'position:absolute;left:-9999px;top:0;width:10px;height:10px;visibility:hidden;pointer-events:none'; (document.body || document.documentElement).appendChild(probe); }
    probe.style.setProperty(prop, v);
    var c = getComputedStyle(probe).getPropertyValue(prop).trim();
    probe.style.removeProperty(prop);
    return c === 'none' || c === '' || c === 'matrix(1, 0, 0, 1, 0, 0)' || c === '1' || c === '0px' || c === '0deg' || c === '0px 0px';
  }
  /* the hovered element is the one the rule styles: ":hover" in the last compound of every selector in the list */
  function subjectHover(sel) {
    return split(sel).every(function (one) {
      var parts = one.split(/\s+|\s*[>+~]\s*/).filter(Boolean), last = parts[parts.length - 1] || '';
      return last.indexOf(':hover') >= 0 && parts.slice(0, -1).every(function (p) { return p.indexOf(':hover') < 0; });
    });
  }

  var done = new WeakSet(), stats = { hover: 0, all: 0 };
  /* the moves to take out of one rule. It only reads: atRest() asks the engine for a computed value, and a computed
     value costs a style pass over the whole page whenever a style sheet has changed since the last one, so every
     change to the style sheets waits until all the reading is done (see pass). Reading and writing in turn here cost
     about 30 s of frozen page on a phone (one full style pass per hover rule, 2026-11-26 perf trace). */
  function moves(r) {
    var st = r.style;
    if (!r.selectorText || r.selectorText.indexOf(':hover') < 0 || !subjectHover(r.selectorText)) return null;
    for (var i = 0; i < st.length; i++) if (SHOWS.test(st[i])) return null;   // it reveals something: keep it whole
    var out = MOVE.filter(function (p) { var v = st.getPropertyValue(p); return v && !atRest(p, v); });
    return out.length ? out : null;
  }
  function narrow(r) {
    var st = r.style, tp = st.getPropertyValue('transition-property');
    if (!tp || !/(^|,)\s*all\s*(,|$)/.test(tp) || KEEP_ALL.test(r.selectorText || '')) return;
    var props = split(tp), durs = split(st.getPropertyValue('transition-duration') || '0s'), fns = split(st.getPropertyValue('transition-timing-function') || 'ease'),
        dels = split(st.getPropertyValue('transition-delay') || '0s'), pri = st.getPropertyPriority('transition-property');
    if (!props.some(function (p, i) { return p === 'all' && parseFloat(durs[i % durs.length]) > 0; })) return;
    var P = [], D = [], F = [], L = [];
    props.forEach(function (p, i) {
      var d = durs[i % durs.length], f = fns[i % fns.length], l = dels[i % dels.length];
      (p === 'all' ? PAINT : [p]).forEach(function (q) { P.push(q); D.push(d); F.push(f); L.push(l); });
    });
    st.setProperty('transition-property', P.join(', '), pri); st.setProperty('transition-duration', D.join(', '), pri);
    st.setProperty('transition-timing-function', F.join(', '), pri); st.setProperty('transition-delay', L.join(', '), pri);
    stats.all++;
  }
  /* the rules not seen yet, each with the moves to take out of it (reads only) */
  function walk(list, todo) {
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (r.cssRules && !r.selectorText) {   // @media / @supports / @layer: in; a reduced-motion block is left as written
        if (r.media && /reduced-motion/.test(r.media.mediaText)) continue;
        walk(r.cssRules, todo); continue;
      }
      if (!r.style || done.has(r)) continue;
      done.add(r);
      var m = null; try { if (touch) m = moves(r); } catch (e) {}
      todo.push([r, m]);
    }
  }
  var sheetsSeen = -1;
  function pass(force) {
    var ss = document.styleSheets; if (!force && ss.length === sheetsSeen) return; sheetsSeen = ss.length;
    var todo = [];
    for (var i = 0; i < ss.length; i++) { var s = ss[i]; if (s.ownerNode && s.ownerNode.id === 'mn-motion-polish-css') continue; try { walk(s.cssRules, todo); } catch (e) {} }
    /* then all the writing, with no reads in between */
    todo.forEach(function (t) {
      try { if (t[1]) t[1].forEach(function (p) { t[0].style.removeProperty(p); stats.hover++; }); narrow(t[0]); } catch (e) {}
    });
  }
  /* style sheets keep arriving (a page's own CSS when it first opens): look again a moment after one is added */
  var t = 0;
  function soon() { clearTimeout(t); t = setTimeout(function () { pass(true); }, 350); }
  try {
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) { var n = ms[i].addedNodes[j]; if (n.nodeName === 'STYLE' || n.nodeName === 'LINK') { soon(); return; } }
    }).observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { pass(true); }); else pass(true);
  window.addEventListener('load', function () { pass(true); });
  setInterval(function () { pass(false); }, 4000);

  window.MinestMotionPolish = { pass: function () { pass(true); return stats; }, stats: stats, touch: touch };
})();
