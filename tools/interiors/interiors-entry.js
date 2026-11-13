/* My World interiors (Codex, 2026-11-02; on main 2026-11-12): three original rooms — the Emerald Manor hall, the Castle
   treasury, the two-storey private library — and Neuschwanstein's outside, Throne Hall and Singers' Hall, opened over My World.
   Loads my-world-interiors/entry.js (window.MinestInteriors); the iOS bundle loads it from the live site.
   A 🏛 Interiors button in the My World console's tool row offers the rooms. */
(function () {
  if (window.__mnInteriorsEntry) return; window.__mnInteriorsEntry = true;
  var BASE = /^https?:$/.test(location.protocol) ? 'my-world-interiors/' : 'https://minest-app.vercel.app/my-world-interiors/';
  function load(cb) {
    if (window.MinestInteriors) return cb();
    var s = document.createElement('script'); s.src = BASE + 'entry.js?v=20261112'; s.onload = function () { cb(); }; s.onerror = function () { try { GlassUI.toast('Interiors could not be loaded'); } catch (e) {} };
    document.head.appendChild(s);
  }
  function chooser() {
    load(function () {
      var I = window.MinestInteriors; if (!I) return;
      var old = document.getElementById('mn-int-pick'); if (old) { old.remove(); return; }
      var el = document.createElement('div'); el.id = 'mn-int-pick';
      el.style.cssText = 'position:fixed;z-index:2147483560;left:50%;top:50%;transform:translate(-50%,-50%);width:min(380px,calc(100vw - 24px));max-height:80vh;overflow:auto;padding:14px;border-radius:18px;background:#183c31;color:#f6f0dc;font:14px system-ui,-apple-system,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.45)';
      el.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><b style="font-size:16px">🏛 Interiors · 室内场景</b><button type="button" data-x style="border:0;background:#f3efd9;color:#193d31;border-radius:12px;padding:6px 10px;font:inherit">✕</button></div>' +
        I.kinds.map(function (k) { return '<button type="button" data-room="' + k[0] + '" style="display:block;width:100%;text-align:left;margin:6px 0;padding:10px 12px;border-radius:12px;border:1px solid rgba(246,240,220,.25);background:rgba(255,255,255,.06);color:inherit;font:inherit;cursor:pointer"><b>' + k[2].replace(/^一键进入/, '') + '</b><br><small style="opacity:.75">' + k[3] + '</small></button>'; }).join('');
      el.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; e.stopPropagation(); el.remove(); if (b.dataset.room) I.open(b.dataset.room); });
      document.body.appendChild(el);
    });
  }
  setInterval(function () {
    var acts = document.querySelector('aside.wf .wf-acts'); if (!acts || acts.querySelector('[data-mnint]')) return;
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-mnint', ''); b.title = 'Interiors — manor hall, castle treasury, private library, Neuschwanstein, the King\'s Hall (Skokloster), the Victorian Study';
    b.innerHTML = '<i>🏛</i>Interiors'; b.addEventListener('click', function (e) { e.stopPropagation(); chooser(); });
    acts.appendChild(b);
  }, 800);
  window.MinestInteriorsEntry = { open: chooser };
})();
