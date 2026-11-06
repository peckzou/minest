/* 74 · Minest Live × the ten teaching games: a level of a live class game can be one of the solo teaching games
   (MinestTemplates quest8241). The live game's lists become one list, the game opens on it; when it ends it reports
   right / wrong and its score as minest:arcade-done (so stars, coins and unlocks are Live's own), leaving it early is
   minest:arcade-closed. The teacher switches each one on in the Levels chips. */
(function () {
  'use strict';
  if (window.MinestLiveTeach) return;
  var watch = 0, cur = null;
  function han(s) { return /[㐀-鿿]/.test(String(s || '')); }
  function flat(board) {   // every chosen list as one teaching list (a card's stack items are cards too)
    var cards = [];
    (board.columns || []).forEach(function (c) {
      (c.cards || []).forEach(function (k) {
        if (!k || !k.title) return;
        cards.push({ id: String(k.id), title: k.title, desc: k.desc || '' });
        (k.stack || []).forEach(function (x) { if (x && x.title) cards.push({ id: String(x.id), title: x.title, desc: x.desc || '' }); });
      });
    });
    return { id: 'live-' + (board.id || 'game'), title: board.title || 'Minest Live', columns: [{ id: 'live-all', title: board.title || 'Minest Live', cards: cards }] };
  }
  function stop() { clearInterval(watch); watch = 0; cur = null; }
  function start(board, mode, levelKey) {
    var T = window.MinestTemplates, TT = window.MinestTeachingTen;
    if (!T || !TT || TT.modes.indexOf(mode) < 0) return false;
    var b = flat(board); if (b.columns[0].cards.length < 3) return false;
    stop();
    try { T.open(b, { quest824: true, quest8241: true, liveBoard: true, audience: 'student', col: 'live-all', chinese: b.columns[0].cards.some(function (c) { return han(c.title); }) }); } catch (e) { return false; }
    var root = document.getElementById('mn-templates'), api = root && root.__teaching824;
    if (!api) { try { T.close(); } catch (e) {} return false; }
    api.start(mode);
    root.classList.add('mlv-teach-level');
    cur = { mode: mode, k: levelKey, reported: false };
    watch = setInterval(function () {
      var r = document.getElementById('mn-templates');
      if (!r) { var was = cur; stop(); if (was && !was.reported) window.dispatchEvent(new CustomEvent('minest:arcade-closed')); return; }
      var a = r.__teaching824, info = a && a.info();
      if (!cur.reported && info && info.mode === mode && r.dataset.tenView === 'result') {
        cur.reported = true;
        var v = TT.score ? TT.score(info) : { completed: info.completed, total: info.total, correct: info.correct, xp: info.correct * 10 };
        window.dispatchEvent(new CustomEvent('minest:arcade-done', { detail: { mode: levelKey, cleared: v.total > 0 && v.completed >= v.total, score: (v.xp || 0) * 10, combo: info.streak || 0, c: v.correct || 0, w: Math.max(0, (v.completed || 0) - (v.correct || 0)) } }));
        setTimeout(function () { if (cur && cur.reported) { stop(); try { T.close(); } catch (e) {} } }, 1300);   // Live's own result comes next
      }
    }, 400);
    return true;
  }
  window.MinestLiveTeach = { start: start, stop: stop, active: function () { return !!cur; } };
})();
