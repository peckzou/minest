/* Card FX on the students' 3D 词卡 page (Minest's own card modes live in its board): off → 隐形墨水 (the words hide
   under drifting ink, the card in front or under the pointer shows its word — a self-test) → 液态玻璃 (a liquid
   sheen runs over the glass). window.__cmCardFx = { next(), on() } — the mode bar's Card FX key cycles it. */
(function () {
  var M = ['off', 'ink', 'liq'], NAME = { off: '关', ink: '隐形墨水', liq: '液态玻璃' }, cur = 'off';
  try { cur = localStorage.getItem('minest.vocab3d.cardfx') || 'off'; if (M.indexOf(cur) < 0) cur = 'off'; } catch (e) {}
  function apply() {
    document.documentElement.classList.toggle('cfx-ink', cur === 'ink'); document.documentElement.classList.toggle('cfx-liq', cur === 'liq');
    [].forEach.call(document.querySelectorAll('#cm-ov .cm-c'), function (c) { if (cur !== 'off' && !c.querySelector(':scope > .cfx')) { var i = document.createElement('i'); i.className = 'cfx'; c.appendChild(i); } });
  }
  new MutationObserver(function () { if (cur !== 'off') apply(); }).observe(document.documentElement, { childList: true, subtree: true });
  window.__cmCardFx = { next: function () { cur = M[(M.indexOf(cur) + 1) % M.length]; try { localStorage.setItem('minest.vocab3d.cardfx', cur); } catch (e) {} apply(); return NAME[cur]; }, on: function () { return cur !== 'off'; } };
  if (document.readyState !== 'loading') apply(); else document.addEventListener('DOMContentLoaded', apply);
})();
