/* Worlds that are not on the Santorini engine (Hobbiton's own engine; the AI Studio React worlds Giethoorn and
   Lauterbrunnen): the same console and Walk in, wired to what they already have — their own walk / view modes, their
   landmarks, their light and season presets — while their own shell stays hidden. Movement goes in as the keys they
   already read; nothing in their scene is changed. */
(function () {
  'use strict';
  var me = document.currentScript, KIND = (me && me.getAttribute('data-kind')) || 'react';
  document.documentElement.classList.add('mvs-proxy', 'mvs-' + KIND);
  var mode = 'view', keysDown = {}, look = { x: 0, y: 0 }, last = 0;
  function txt(b) { return (b.textContent || '').replace(/\s+/g, ' ').trim(); }
  function buttons() { return Array.prototype.slice.call(document.querySelectorAll(KIND === 'react' ? '#root button' : '#mn-hb-console button, #overlay button')); }
  function find(re) { return buttons().filter(function (b) { return re.test(txt(b)); })[0] || null; }
  function press(b) { if (b) { b.click(); return true; } return false; }
  function key(code, on) {
    if (!!keysDown[code] === on) return; keysDown[code] = on;
    var k = { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', KeyQ: 'q', KeyR: 'r', Space: ' ', ShiftLeft: 'Shift', KeyE: 'e' }[code] || code;
    var ev = new KeyboardEvent(on ? 'keydown' : 'keyup', { code: code, key: k, bubbles: true, cancelable: true });
    if (KIND === 'react') (document.body || document).dispatchEvent(ev); else window.dispatchEvent(ev);
  }
  function tap(code) { key(code, true); setTimeout(function () { key(code, false); }, 60); }
  var R = {   // the React worlds: their buttons, by what they say
    walk: /第三人称/, first: /第一人称/, view: /自由鸟瞰|自由环视/,
    light: /晨曦|正午|晚霞|星夜|云雾/, season: /盛夏|金秋|Summer|Autumn/, look: /智能内景|完整外观|室内透视/, door: /木门/, sound: /音效/
  };
  function hobbit() { return window.__game; }
  var P = {
    kind: KIND,
    ready: function () { return KIND === 'react' ? !!find(R.walk) : !!(hobbit() && hobbit().player); },
    overview: function () {
      mode = 'view';
      if (KIND === 'react') press(find(R.view));
      else press(document.getElementById('mn-hb-panorama-start'));
    },
    setMode: function (m) {
      mode = m === 'fly' ? 'fly' : 'walk';
      if (KIND === 'react') press(find(m === 'fly' ? R.first : R.walk));
      else press(document.querySelector('[data-hb="' + (m === 'fly' ? 'fly' : 'walk') + '"]'));
    },
    places: function () {
      if (KIND !== 'react') {
        var g = hobbit(), L = (g && g.info && g.info.pois) || [];
        return L.map(function (p) { var n = String(p.name || ''), i = n.search(/[A-Za-z]/); return { name: i > 0 ? n.slice(0, i).trim() : n, en: i > 0 ? n.slice(i) : '', go: function () { goPoi(p); } }; });
      }
      var first = buttons().filter(function (b) { return /机位/.test(txt(b)); })[0]; if (!first) return [];
      var box = first.parentElement; while (box && box.querySelectorAll('button').length < 3) box = box.parentElement;
      return Array.prototype.slice.call(box ? box.querySelectorAll('button') : []).filter(function (b) { return !/\(\d+\)$/.test(txt(b)) && !/实景|收起|展开/.test(txt(b)); })
        .map(function (b) { return { name: txt(b), go: function () { press(b); } }; });
    },
    extras: function () {
      if (KIND !== 'react') return [];
      var groups = [['光照', R.light], ['季节', R.season], ['视图', R.look], ['其它', /木门|音效/]];
      return groups.map(function (g) { return { name: g[0], items: buttons().filter(function (b) { return g[1].test(txt(b)); }).map(function (b) { return { name: txt(b), go: function () { press(b); } }; }) }; }).filter(function (g) { return g.items.length; });
    },
    door: function () { if (KIND === 'react') { if (!press(find(R.door))) tap('KeyE'); } else tap('KeyE'); }
  };
  function goPoi(p) {
    var g = hobbit(); if (!g) return;
    P.setMode('walk');
    setTimeout(function () { g.player.pos.set(p.pos[0], p.pos[1], p.pos[2]); if (g.player.vel) g.player.vel.set(0, 0, 0); g.camera.position.set(p.pos[0], p.pos[1] + 1.62, p.pos[2]); g.camera.lookAt(p.look[0], p.look[1], p.look[2]); }, 60);
  }
  function pos() {
    if (KIND !== 'react') { var g = hobbit(); return g && g.player ? g.player.pos : { x: 0, y: 0, z: 0 }; }
    var m = (((document.getElementById('root') || document.body).textContent || '').match(/X:\s*(-?[\d.]+)\s*Y:\s*(-?[\d.]+)\s*Z:\s*(-?[\d.]+)/) || []);
    return { x: +m[1] || 0, y: +m[2] || 0, z: +m[3] || 0 };
  }
  var controls = {
    input: function (n) {
      var my = n.moveY || 0, mx = n.moveX || 0;
      key('KeyW', !!(n.forward || my > .3)); key('KeyS', !!(n.back || my < -.3)); key('KeyA', !!(n.left || mx < -.3)); key('KeyD', !!(n.right || mx > .3));
      key('Space', !!n.up); key('ShiftLeft', !!(n.fast || n.down));
      look.x = (n.lookX || 0) + (n.lookRight ? 1 : 0) - (n.lookLeft ? 1 : 0); look.y = (n.lookY || 0) + (n.lookUp ? 1 : 0) - (n.lookDown ? 1 : 0);
      if (KIND === 'react') { key('KeyQ', look.x < -.3); key('KeyR', look.x > .3); }   // Lauterbrunnen turns with Q / R
    },
    stop: function () { Object.keys(keysDown).forEach(function (c) { key(c, false); }); look.x = look.y = 0; }
  };
  function turn(t) {   // Hobbiton: the look stick turns its camera as a drag would
    requestAnimationFrame(turn); var dt = Math.min(.05, (t - last) / 1000 || 0); last = t;
    var g = hobbit(); if (KIND === 'react' || !g || !g.camera || (!look.x && !look.y)) return;
    g.camera.rotation.reorder('YXZ'); g.camera.rotation.y -= look.x * dt * 1.6; g.camera.rotation.x = Math.max(-1.4, Math.min(1.4, g.camera.rotation.x + look.y * dt * 1.2));
  }
  requestAnimationFrame(turn);
  window.__voxelProxy = P;
  window.__voxel = { S: { get mode() { return mode; } }, player: { get pos() { return pos(); } }, controls: controls, world: { get landmarks() { return []; } } };
  var E = { active: true, ready: true, daylight: false, target: { x: 0, y: 0, z: 0 }, distance: 1,
    explore: function (m) { if (m === 'edit') { E.active = true; controls.stop(); P.overview(); } else if (m === 'walk' || m === 'fly') { E.active = false; P.setMode(m); } },
    fit: function () { E.explore('edit'); }, zoom: function () {}, focus: function () {}, walk: function () { E.explore('walk'); }, frame: function () { return false; }, pickBuilding: function () { return null; }, ensureContext: function () { return false; } };
  window.MinestOiaEditor = E;
  // start in the overview, as Santorini does, once the world is there
  var tries = 0, iv = setInterval(function () { if (P.ready()) { clearInterval(iv); setTimeout(P.overview, 300); } else if (++tries > 240) clearInterval(iv); }, 250);
})();
