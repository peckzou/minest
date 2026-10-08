(function () {
  'use strict';

  var STORAGE_KEY = 'minest.cosmetics.v1';
  var CHANNEL_NAME = 'minest-cosmetics-v1';
  var DEFAULT_STATE = {
    unlockedItems: ['default_purple', 'blue_lavender', 'headphones'],
    equippedSkin: 'default_purple',
    equippedBySlot: { head: null, hair: null, face: null, neck: null },
    skinAdjustments: { hue: 0, saturation: 1, brightness: 1 },
    renderMode: 'source'
  };
  var SKINS = {
    default_purple: { label: 'Default Purple', color: 0xffffff, accent: 0x8c6bd9, requirement: 'Base' },
    blue_lavender: { label: 'Blue Lavender', color: 0x6d9dff, accent: 0x667eea, requirement: 'Growth Level 2' },
    pearl_pink: { label: 'Pearl Pink', color: 0xff91bd, accent: 0xf06f9d, requirement: 'Badge milestone' },
    // 44.2 wardrobe
    mint_green: { label: 'Mint Green', color: 0x7fe3c4, accent: 0x3fbf98, requirement: 'Bond Lv 2', level: 2 },
    peach_pink: { label: 'Peach Pink', color: 0xffa98f, accent: 0xff8a6a, requirement: 'Bond Lv 3', level: 3 },
    starry_night: { label: 'Starry Night', color: 0x4a4fb0, accent: 0x2b2f7a, requirement: 'Bond Lv 6', level: 6, starry: true }
  };
  var ACCESSORIES = {
    headphones: { label: 'Headphones', slot: 'head', accent: 0x9a7bd3, requirement: 'Growth Level 3' },
    small_crown: { label: 'Small Crown', slot: 'head', accent: 0xffd76a, requirement: 'Badge milestone' },
    scarf: { label: 'Scarf', slot: 'neck', accent: 0xff7c91e8, requirement: 'Streak milestone' },
    // 44.2 wardrobe
    bow: { label: 'Bow', slot: 'head', accent: 0xff7aa8, requirement: 'Bond Lv 2', level: 2 },
    glasses: { label: 'Round Glasses', slot: 'face', accent: 0x3a2b4a, requirement: 'Bond Lv 3', level: 3 },
    straw_hat: { label: 'Straw Hat', slot: 'head', accent: 0xe8c77a, requirement: 'Bond Lv 4', level: 4 },
    starfish_clip: { label: 'Starfish Clip', slot: 'hair', accent: 0xff9f43, requirement: 'Bond Lv 5', level: 5 },
    pearl_necklace: { label: 'Pearl Necklace', slot: 'neck', accent: 0xf6f1ea, requirement: 'Bond Lv 7', level: 7 }
  };
  var SLOTS = ['head', 'hair', 'face', 'neck'];
  var listeners = [];
  var channel = null;
  try { channel = new BroadcastChannel(CHANNEL_NAME); } catch (error) {}

  function cloneState(state) {
    var adjustments = Object.assign({}, DEFAULT_STATE.skinAdjustments, state && state.skinAdjustments || {});
    return {
      unlockedItems: Array.from(new Set((state.unlockedItems || []).filter(Boolean))),
      equippedSkin: state.equippedSkin || DEFAULT_STATE.equippedSkin,
      equippedBySlot: Object.assign({ head: null, hair: null, face: null, neck: null }, state.equippedBySlot || {}),
      skinAdjustments: {
        hue: Math.max(-.5, Math.min(.5, Number(adjustments.hue) || 0)),
        saturation: Math.max(0, Math.min(2, Number(adjustments.saturation) || 0)),
        brightness: Math.max(.5, Math.min(1.5, Number(adjustments.brightness) || 0))
      },
      renderMode: state.renderMode === 'tinted' ? 'tinted' : 'source'
    };
  }
  function readState() {
    try {
      var value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return cloneState(value || DEFAULT_STATE);
    } catch (error) { return cloneState(DEFAULT_STATE); }
  }
  var state = readState();
  function notify() {
    var snapshot = cloneState(state);
    listeners.slice().forEach(function (listener) { listener(snapshot); });
    window.dispatchEvent(new CustomEvent('minest-cosmetics-changed', { detail: snapshot }));
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) {}
    try { if (channel) channel.postMessage(state); } catch (error) {}
    notify();
  }
  if (channel) channel.addEventListener('message', function (event) { if (event.data) { state = cloneState(event.data); notify(); } });
  window.addEventListener('storage', function (event) { if (event.key === STORAGE_KEY) { state = readState(); notify(); } });

  function isUnlocked(itemId) { return state.unlockedItems.indexOf(itemId) >= 0; }
  function unlock(itemId) {
    if (!SKINS[itemId] && !ACCESSORIES[itemId]) return false;
    if (isUnlocked(itemId)) return false;
    state.unlockedItems.push(itemId); persist(); return true;
  }
  function equipSkin(itemId) {
    if (!SKINS[itemId] || !isUnlocked(itemId)) return false;
    state.equippedSkin = itemId;
    // 44.2: the original look is the untouched GLB; any other skin needs the tint shader
    state.renderMode = itemId === 'default_purple' ? 'source' : 'tinted';
    persist(); return true;
  }
  function equipAccessory(itemId) {
    var item = ACCESSORIES[itemId];
    if (!item || !isUnlocked(itemId)) return false;
    state.equippedBySlot[item.slot] = itemId; persist(); return true;
  }
  function clearSlot(slot) {
    if (!(slot in state.equippedBySlot)) return false;
    state.equippedBySlot[slot] = null; persist(); return true;
  }
  function setSkinAdjustments(next) {
    state.skinAdjustments = Object.assign({}, state.skinAdjustments, next || {});
    state = cloneState(state); persist(); return cloneState(state.skinAdjustments);
  }
  function setRenderMode(mode) {
    state.renderMode = mode === 'tinted' ? 'tinted' : 'source'; persist(); return state.renderMode;
  }
  function rewardUnlock(kind) {
    var key = String(kind || '').toLowerCase();
    var item = key.indexOf('growth') >= 0 || key.indexOf('level') >= 0 ? 'blue_lavender' : key.indexOf('badge') >= 0 ? 'small_crown' : key.indexOf('streak') >= 0 ? 'scarf' : key.indexOf('celebr') >= 0 ? 'pearl_pink' : null;
    return item ? unlock(item) : false;
  }
  window.addEventListener('reward-event-received', function (event) { rewardUnlock(event.detail && (event.detail.kind || event.detail.type)); });
  window.addEventListener('ocean-world-event', function (event) { var detail = event.detail || {}; if (detail.type === 'REWARD_EVENT_RECEIVED') rewardUnlock(detail.detail && detail.detail.kind); });

  function makeMaterial(THREE, color, roughness, metalness) {
    return new THREE.MeshStandardMaterial({ color: color, roughness: roughness == null ? .72 : roughness, metalness: metalness == null ? .05 : metalness });
  }
  function makeAccessory(THREE, id) {
    // The v3 avatar loader passes a focused constructor adapter. Keep the
    // accessory usable with that adapter even when it does not expose every
    // primitive from the full Three.js namespace.
    var makeCone = function (radius, height, segments) {
      return THREE.ConeGeometry ? new THREE.ConeGeometry(radius, height, segments) : new THREE.CylinderGeometry(0, radius, height, segments);
    };
    var makeSphere = function (radius, widthSegments, heightSegments) {
      return THREE.SphereGeometry ? new THREE.SphereGeometry(radius, widthSegments, heightSegments) : new THREE.CylinderGeometry(radius, radius, radius, widthSegments, heightSegments);
    };
    var group = new THREE.Group();
    group.name = 'cosmetic:' + id;
    var item = ACCESSORIES[id];
    if (!item) return group;
    var material = makeMaterial(THREE, item.accent, .38, .18);
    // Keep the lightweight props on the camera-facing side of the plush
    // surface. The v23 head/body bones sit inside the mesh volume.
    if (item.slot === 'head') group.position.z = .32;
    if (item.slot === 'neck') group.position.z = .28;
    if (id === 'headphones') {
      // 44.0: plush over-ear headphones fitted to the v23 head (measured in head-bone space: top of the
      // head y≈.64, widest ±.50 at y≈.30, front z≈.35, back z≈-.62). A thick padded band arcs over the
      // top into two big round cups on the sides; soft fuzzy lavender like the octopus itself.
      var furTex = null;
      try {
        if (THREE.CanvasTexture) {
          var fc = document.createElement('canvas'); fc.width = fc.height = 128;
          var fx = fc.getContext('2d'); fx.fillStyle = '#ffffff'; fx.fillRect(0, 0, 128, 128);
          for (var f = 0; f < 900; f++) {           // short soft fur strokes
            var gx = Math.random() * 128, gy = Math.random() * 128, ga = Math.random() * Math.PI * 2, gl = 3 + Math.random() * 5, gv = 205 + Math.random() * 50;
            fx.strokeStyle = 'rgba(' + gv + ',' + gv + ',' + gv + ',.55)'; fx.lineWidth = 1 + Math.random();
            fx.beginPath(); fx.moveTo(gx, gy); fx.lineTo(gx + Math.cos(ga) * gl, gy + Math.sin(ga) * gl); fx.stroke();
          }
          furTex = new THREE.CanvasTexture(fc);
          if (THREE.RepeatWrapping) { furTex.wrapS = furTex.wrapT = THREE.RepeatWrapping; furTex.repeat.set(3, 3); }
          if (THREE.SRGBColorSpace) furTex.colorSpace = THREE.SRGBColorSpace;
        }
      } catch (e) { furTex = null; }
      var plush = function (hex, glow) {
        var m = new THREE.MeshStandardMaterial({ color: hex, roughness: .96, metalness: 0, map: furTex || null });
        if (m.emissive) { m.emissive.setHex(hex); m.emissiveIntensity = glow == null ? .16 : glow; }
        return m;
      };
      var shell = plush(0xa88de2, .1), shellDeep = plush(0x8f72d0, .08), cushion = plush(0xc9b8f3, .14), capRing = plush(0xbba5ee, .12);
      var cy = .27, cz = -.03, side = .53;
      // band: elliptical arc over the head (torus scaled in y), resting just above the plush
      var a = .56, b = .44;
      var band = new THREE.Mesh(new THREE.TorusGeometry(a, .07, 16, 48, Math.PI), shell);
      band.scale.set(1, (b + .03) / a, 1.35); band.position.set(0, cy, cz - .03); group.add(band);
      [-1, 1].forEach(function (sd) {
        var cup = new THREE.Group(); cup.position.set(sd * side, cy, cz); cup.rotation.y = sd * .12; group.add(cup);
        // outer shell: a fat rounded puck
        // big puffy cup: a rounded pillow shape
        var body = new THREE.Mesh(makeSphere(.24, 32, 24), shell); body.scale.set(.62, 1, 1); body.position.x = sd * .07; cup.add(body);
        // fat ear cushion against the head
        var ring = new THREE.Mesh(new THREE.TorusGeometry(.16, .065, 16, 36), cushion); ring.rotation.y = Math.PI / 2; ring.position.x = -sd * .005; cup.add(ring);
        // outer cap: a soft dome with a deeper rim
        var cap = new THREE.Mesh(makeSphere(.15, 28, 20), capRing); cap.scale.set(.32, 1, 1); cap.position.x = sd * .2; cup.add(cap);
        var rim = new THREE.Mesh(new THREE.TorusGeometry(.155, .022, 10, 36), shellDeep); rim.rotation.y = Math.PI / 2; rim.position.x = sd * .19; cup.add(rim);
        // yoke where the band meets the cup
        var yoke = new THREE.Mesh(new THREE.CylinderGeometry(.05, .058, .12, 16), shellDeep); yoke.position.set(sd * .03, .24, 0); cup.add(yoke);
      });
      group.position.set(0, 0, 0);
      group.scale.setScalar(1);
    } else if (id === 'small_crown') {
      // Cartoon 3D crown: a thick gold base, five stepped points, round tips,
      // and a purple center jewel matching the supplied reference.
      var crownGold = new THREE.MeshStandardMaterial({ color: 0xf3b52f, roughness: .3, metalness: .24 });
      var crownBase = new THREE.Mesh(new THREE.CylinderGeometry(.28, .31, .13, 24), crownGold);
      crownBase.position.y = .46; group.add(crownBase);
      var crownBand = new THREE.Mesh(new THREE.TorusGeometry(.285, .025, 8, 24), crownGold);
      crownBand.rotation.x = Math.PI / 2; crownBand.position.set(0, .52, .015); group.add(crownBand);
      var points = [-.245, -.122, 0, .122, .245];
      var heights = [.18, .27, .37, .27, .18];
      points.forEach(function (x, index) {
        var height = heights[index];
        var point = new THREE.Mesh(makeCone(.078, height, 4), crownGold);
        point.position.set(x, .55 + height / 2, .01); point.rotation.y = Math.PI / 4; group.add(point);
        var tip = new THREE.Mesh(makeSphere(.047, 14, 10), crownGold);
        tip.position.set(x, .55 + height + .025, .01); group.add(tip);
      });
      var jewelMaterial = new THREE.MeshStandardMaterial({ color: 0x7136a5, roughness: .22, metalness: .12 });
      var jewel = new THREE.Mesh(makeSphere(.07, 18, 12), jewelMaterial);
      jewel.scale.z = .55; jewel.position.set(0, .57, .18); group.add(jewel);
      // Sit ON the head, centred: measured on the v23 mesh in head-bone space, the crown of the
      // head is at y≈.63 (z≈0) and the surface under the base ring (r≈.33) at y≈.617. The base
      // bottom is .395×.72 = .284 above this group's origin, so the origin goes to .316 — the
      // ring rests just inside the plush. (Was y .18 / z .32: low and out on the forehead.)
      group.position.set(0, .316, -.01);
      group.scale.set(1.05, .72, 1.05);
    } else if (id === 'scarf') {
      var ring = new THREE.Mesh(new THREE.TorusGeometry(.205, .052, 8, 18), material);
      ring.rotation.x = Math.PI / 2; ring.position.y = .12; group.add(ring);
      var tail = new THREE.Mesh(new THREE.BoxGeometry(.075, .25, .035), material);
      tail.position.set(.19, -.01, .02); tail.rotation.z = -.16; group.add(tail);
      group.scale.setScalar(1.1);
    } else if (id === 'bow') {
      // 44.2: a satin bow perched on the top-right of the head (head-bone space; top of head y≈.64)
      var satin = new THREE.MeshStandardMaterial({ color: 0xff7aa8, roughness: .35, metalness: .05 });
      if (satin.emissive) { satin.emissive.setHex(0xff7aa8); satin.emissiveIntensity = .12; }
      var bowG = new THREE.Group(); bowG.position.set(.2, .6, .12); bowG.rotation.set(-.25, 0, -.35); group.add(bowG);
      [-1, 1].forEach(function (sd) {
        var loop = new THREE.Mesh(makeSphere(.11, 20, 14), satin); loop.scale.set(1.15, .72, .45); loop.position.x = sd * .105; loop.rotation.z = sd * .25; bowG.add(loop);
        var tail = new THREE.Mesh(new THREE.BoxGeometry(.05, .13, .02), satin); tail.position.set(sd * .05, -.1, 0); tail.rotation.z = sd * .35; bowG.add(tail);
      });
      var knot = new THREE.Mesh(makeSphere(.05, 16, 12), new THREE.MeshStandardMaterial({ color: 0xff5a90, roughness: .3 })); knot.scale.z = .7; bowG.add(knot);
      group.position.set(0, 0, 0);
    } else if (id === 'straw_hat') {
      // a sun hat: wide brim, low crown and a ribbon band, tipped a little
      var straw = new THREE.MeshStandardMaterial({ color: 0xe9c97c, roughness: .9, metalness: 0 });
      if (straw.emissive) { straw.emissive.setHex(0xe9c97c); straw.emissiveIntensity = .1; }
      var hatG = new THREE.Group(); hatG.position.set(0, .6, -.06); hatG.rotation.set(-.12, 0, .1); group.add(hatG);
      var brim = new THREE.Mesh(new THREE.CylinderGeometry(.62, .66, .028, 40), straw); hatG.add(brim);
      var crownM = new THREE.Mesh(new THREE.CylinderGeometry(.27, .32, .2, 32), straw); crownM.position.y = .11; hatG.add(crownM);
      var top = new THREE.Mesh(makeSphere(.27, 24, 12), straw); top.scale.y = .35; top.position.y = .21; hatG.add(top);
      var ribbon = new THREE.Mesh(new THREE.CylinderGeometry(.325, .325, .06, 32), new THREE.MeshStandardMaterial({ color: 0xff8fb1, roughness: .5 })); ribbon.position.y = .045; hatG.add(ribbon);
      var flower = new THREE.Mesh(makeSphere(.055, 14, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .5 })); flower.position.set(.24, .06, .18); hatG.add(flower);
      group.position.set(0, 0, 0);
    } else if (id === 'starfish_clip') {
      // a little orange starfish hair clip on the left side of the head
      var orange = new THREE.MeshStandardMaterial({ color: 0xff9f43, roughness: .55 });
      if (orange.emissive) { orange.emissive.setHex(0xff9f43); orange.emissiveIntensity = .14; }
      var star = new THREE.Group(); star.position.set(-.34, .5, .26); star.rotation.set(-.4, -.45, .2); group.add(star);
      for (var a5 = 0; a5 < 5; a5++) {
        var arm = new THREE.Mesh(makeCone(.04, .12, 8), orange);
        var ang = a5 / 5 * Math.PI * 2;
        arm.position.set(Math.sin(ang) * .06, Math.cos(ang) * .06, 0); arm.rotation.z = -ang; star.add(arm);
      }
      var mid = new THREE.Mesh(makeSphere(.045, 14, 10), orange); mid.scale.z = .6; star.add(mid);
      group.position.set(0, 0, 0);
    } else if (id === 'glasses') {
      // round glasses in front of the eyes (measured eye centres in head-bone space: x ±.23, y .164,
      // z .30, eye radius ≈ .083)
      var frame = new THREE.MeshStandardMaterial({ color: 0x3a2b4a, roughness: .35, metalness: .3 });
      var glass = new THREE.MeshStandardMaterial({ color: 0xcfe9ff, roughness: .05, metalness: 0, transparent: true, opacity: .18 });
      [-1, 1].forEach(function (sd) {
        var ring = new THREE.Mesh(new THREE.TorusGeometry(.115, .016, 10, 32), frame); ring.position.set(sd * .232, .166, .37); ring.rotation.y = sd * .22; group.add(ring);
        var lens = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .006, 28), glass); lens.rotation.x = Math.PI / 2; lens.rotation.z = 0; lens.position.copy(ring.position); lens.rotation.y = sd * .22; group.add(lens);
        var temple = new THREE.Mesh(new THREE.CylinderGeometry(.011, .011, .3, 8), frame); temple.rotation.x = Math.PI / 2; temple.position.set(sd * .4, .18, .2); temple.rotation.y = sd * .5; group.add(temple);
      });
      var bridge = new THREE.Mesh(new THREE.TorusGeometry(.05, .013, 8, 16, Math.PI), frame); bridge.position.set(0, .2, .4); group.add(bridge);
      group.position.set(0, 0, 0);
    } else if (id === 'pearl_necklace') {
      // 44.2: draped in a U across the front just below the mouth (head-bone space; the face ends near
      // y≈.08, its front surface z≈.37), so it is visible — the neck slot sits inside the plush
      var pearl = new THREE.MeshStandardMaterial({ color: 0xfbf6ee, roughness: .18, metalness: .12 });
      if (pearl.emissive) { pearl.emissive.setHex(0xfff3e8); pearl.emissiveIntensity = .14; }
      var n = 17;
      for (var k = 0; k < n; k++) {
        var a = (k / (n - 1) - .5) * 2.3, big = k === (n - 1) / 2 ? 1.5 : 1;
        var p = new THREE.Mesh(makeSphere(.036 * big, 12, 10), pearl);
        p.position.set(Math.sin(a) * .37, -.19 + (1 - Math.cos(a)) * .1, .24 + Math.cos(a) * .24); group.add(p);
      }
      group.position.set(0, 0, 0); group.scale.setScalar(1);
      group.userData.minestHeadAnchored = true;
    }
    return group;
  }
  function findBone(model, names) {
    var found = null;
    model.traverse(function (node) { if (!found && names.indexOf(node.name) >= 0) found = node; });
    return found;
  }
  function skinTint(skin, adjustments) {
    var hex = skin.color >>> 0;
    var r = ((hex >> 16) & 255) / 255, g = ((hex >> 8) & 255) / 255, b = (hex & 255) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min; s = l > .5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    } else if (hex === SKINS.default_purple.color) { h = .76; s = .42; l = .64; }
    h = (h + adjustments.hue + 1) % 1; s = Math.max(0, Math.min(1, s * adjustments.saturation)); l = Math.max(.05, Math.min(.9, l * adjustments.brightness));
    function hue2rgb(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }
    if (!s) r = g = b = l; else { var q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3); }
    return { r: r, g: g, b: b };
  }
  function ensurePlushAttribute(geometry, THREE, texture) {
    if (!geometry || !THREE || geometry.getAttribute('minestPlushPart')) return;
    var position = geometry.getAttribute('position');
    if (!position) return;
    var count = position.count;
    var index = geometry.index;
    // The GLB has one material, but loose mesh islands separate the plush
    // tentacle shafts from the small suction-cup islands. Keep the larger
    // islands eligible for tinting and leave the small islands untouched.
    if (!index || !index.count) {
      var fallback = new Float32Array(count);
      fallback.fill(1);
      geometry.setAttribute('minestPlushPart', new (THREE.BufferAttribute || geometry.getAttribute('position').constructor)(fallback, 1));
      return;
    }
    var parent = new Int32Array(count);
    var size = new Int32Array(count);
    var i;
    for (i = 0; i < count; i += 1) { parent[i] = i; size[i] = 1; }
    function find(value) {
      var root = value;
      while (parent[root] !== root) root = parent[root];
      while (parent[value] !== value) { var next = parent[value]; parent[value] = root; value = next; }
      return root;
    }
    function union(a, b) {
      var rootA = find(a), rootB = find(b);
      if (rootA === rootB) return;
      if (size[rootA] < size[rootB]) { var swap = rootA; rootA = rootB; rootB = swap; }
      parent[rootB] = rootA;
      size[rootA] += size[rootB];
    }
    for (i = 0; i + 2 < index.count; i += 3) {
      var a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
      union(a, b); union(b, c); union(c, a);
    }
    var mask = new Float32Array(count);
    var minimumIslandSize = 400;
    for (i = 0; i < count; i += 1) {
      mask[i] = size[find(i)] >= minimumIslandSize ? 1 : 0;
      var vx = position.getX(i), vy = position.getY(i), vz = position.getZ(i);
      // Preserve the face inserts without leaving square source-texture patches.
      function edge(value, start, end) {
        var t = Math.max(0, Math.min(1, (value - start) / (end - start)));
        return t * t * (3 - 2 * t);
      }
      if (vz > .20) {
        var eyeLeft = Math.sqrt(Math.pow((vx + .235) / .09, 2) + Math.pow((vy - .76) / .105, 2));
        var eyeRight = Math.sqrt(Math.pow((vx - .235) / .09, 2) + Math.pow((vy - .76) / .105, 2));
        var mouth = Math.sqrt(Math.pow(vx / .055, 2) + Math.pow((vy - .70) / .038, 2));
        mask[i] *= Math.min(edge(eyeLeft, .88, 1.18), edge(eyeRight, .88, 1.18), edge(mouth, .82, 1.16));
      }
    }
    // The large connected islands include the eyes, so refine them with the
    // baked texture. Purple/cool fur remains eligible; dark eyes and warm
    // inner skin/suckers stay on the source material.
    var uv = geometry.getAttribute('uv');
    var image = texture && texture.image;
    var width = image && (image.width || image.naturalWidth);
    var height = image && (image.height || image.naturalHeight);
    if (uv && width && height && typeof document !== 'undefined') {
      try {
        var canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        var context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0, width, height);
        var pixels = context.getImageData(0, 0, width, height).data;
        for (i = 0; i < count; i += 1) {
          var u = uv.getX(i) - Math.floor(uv.getX(i));
          var v = uv.getY(i) - Math.floor(uv.getY(i));
          var px = Math.min(width - 1, Math.max(0, Math.floor(u * width)));
          var py = Math.min(height - 1, Math.max(0, Math.floor(v * height)));
          var offset = (py * width + px) * 4;
          var red = pixels[offset] / 255;
          var green = pixels[offset + 1] / 255;
          var blue = pixels[offset + 2] / 255;
          var luma = red * .299 + green * .587 + blue * .114;
          // The baked atlas is softly lit, so bright fur can be nearly
          // neutral while inner skin is consistently warmer. Exclude only
          // dark inserts and clearly warm inner-skin pixels; keep the full
          // light/dark range of the plush fur tintable.
          var darkInsert = Math.max(0, Math.min(1, (.16 - luma) / .10));
          var warmInner = Math.max(0, Math.min(1, (red - blue - .035) / .07));
          mask[i] *= (1 - darkInsert) * (1 - warmInner);
        }
      } catch (error) {}
    }
    geometry.setAttribute('minestPlushPart', new (THREE.BufferAttribute || geometry.getAttribute('position').constructor)(mask, 1));
  }
  var TINTED = [];
  (function tick(t) { requestAnimationFrame(tick); for (var i = TINTED.length - 1; i >= 0; i--) { var sh = TINTED[i].userData.minestShader; if (sh && sh.uniforms.minestTime) sh.uniforms.minestTime.value = t / 1000; } if (TINTED.length > 40) TINTED.splice(0, TINTED.length - 40); })(0);
  function installSurfaceTint(material, rgb, THREE) {
    if (!material || !material.onBeforeCompile) return;
    material.userData = material.userData || {};
    material.userData.minestSurfaceTint = rgb;
    material.onBeforeCompile = function (shader) {
      // WebGL uniforms need a Three.js color/vector instance. A plain
      // `{r,g,b}` object is silently ignored by WebGLUniforms.
      shader.uniforms.minestSkinTint = { value: new THREE.Color(rgb.r, rgb.g, rgb.b) };
      shader.vertexShader = 'attribute float minestPlushPart;\nvarying float minestPlushPartV;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  minestPlushPartV = minestPlushPart;');
      shader.fragmentShader = 'varying float minestPlushPartV;\nuniform vec3 minestSkinTint;\n' + shader.fragmentShader;
      var mask = 'float minestSurfaceMask = minestPlushPartV;';
      // Blend the selected color into the original fur instead of multiplying
      // it. Multiplication gets washed out by the pale baked texture and made
      // the controls appear unresponsive while still leaving texture detail.
      var tintBlend = 'vec3 minestFurTint = minestSkinTint;';
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n  ' + mask + '\n  ' + tintBlend + '\n  diffuseColor.rgb = mix(diffuseColor.rgb, minestFurTint * .18, minestSurfaceMask);');
      // 44.2: recolour the baked fur by its brightness (keeps shading and fur detail; dark pixels such
      // as the eyes stay as they are); the starry skin adds twinkling stars
      shader.uniforms.minestTime = { value: 0 };
      shader.uniforms.minestStarry = { value: material.userData.minestStarry ? 1 : 0 };
      material.userData.minestShader = shader; TINTED.push(material);
      shader.fragmentShader = 'uniform float minestTime;\nuniform float minestStarry;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', [
        '#include <emissivemap_fragment>',
        '  { vec3 e = totalEmissiveRadiance; float lum = dot(e, vec3(.299,.587,.114));',
        '    float keep = smoothstep(.1, .3, lum);',
        '    vec3 fur = minestSkinTint * (.06 + .6 * lum);',
        '    totalEmissiveRadiance = mix(e, fur, minestSurfaceMask * keep * .95);',
        '    #ifdef USE_EMISSIVEMAP',
        '    if (minestStarry > .5) { vec2 g = vEmissiveMapUv * 420.0; vec2 c = floor(g); float h = fract(sin(dot(c, vec2(12.9898,78.233))) * 43758.5453);',
        '      float star = step(.985, h) * smoothstep(.45, .0, length(fract(g) - .5)) * (.55 + .45 * sin(minestTime * 2.5 + h * 60.0));',
        '      totalEmissiveRadiance += vec3(1., .95, .8) * star * 1.4 * minestSurfaceMask * keep; }',
        '    #endif',
        '  }'
      ].join('\n'));
    };
    material.customProgramCacheKey = function () {
      return 'minest-surface-tint-v7-' + (material.userData.minestStarry ? 's-' : '') + [rgb.r, rgb.g, rgb.b].map(function (value) { return Math.round(value * 1000); }).join('-');
    };
    material.needsUpdate = true;
  }
  function applyModel(model, THREE, binding) {
    if (!model || !THREE) return;
    THREE = completeTHREE(THREE, model);
    binding = binding || {};
    var viewState = binding.previewState || state;
    var skin = SKINS[viewState.equippedSkin] || SKINS.default_purple;
    var adjustments = viewState.skinAdjustments || DEFAULT_STATE.skinAdjustments;
    var tinted = viewState.renderMode === 'tinted';
    var rgb = skinTint(skin, adjustments);
    model.traverse(function (node) {
      if (!node.isMesh || !node.material) return;
      if (tinted) {
        var sourceMaterial = Array.isArray(node.material) ? node.material[0] : node.material;
        ensurePlushAttribute(node.geometry, THREE, sourceMaterial && (sourceMaterial.map || sourceMaterial.emissiveMap));
      }
      if (!node.userData.minestCosmeticsBaseMaterial) node.userData.minestCosmeticsBaseMaterial = node.material;
      var base = node.userData.minestCosmeticsBaseMaterial;
      // Source file is a true original-material mode. Restore the exact GLB
      // material object so no tint shader or presentation override survives.
      if (!tinted) {
        node.material = base;
        return;
      }
      var material = Array.isArray(base) ? base.map(function (item) { return item.clone(); }) : base.clone();
      var apply = function (item) {
        if (!item) return;
        item.userData = item.userData || {}; item.userData.minestStarry = !!skin.starry;
        installSurfaceTint(item, rgb, THREE);
        item.needsUpdate = true;
      };
      Array.isArray(material) ? material.forEach(apply) : apply(material);
      node.material = material;
    });
    SLOTS.forEach(function (slot) {
      var useHead = slot !== 'neck' || viewState.equippedBySlot[slot] === 'pearl_necklace';
      var anchor = useHead ? findBone(model, ['head', 'Head']) : findBone(model, ['body', 'Body', 'neck', 'Neck']);
      if (!anchor) return;
      var marker = 'minestCosmetic:' + slot;
      [findBone(model, ['head', 'Head']), findBone(model, ['body', 'Body', 'neck', 'Neck'])].forEach(function (bone) { if (bone) bone.children.slice().forEach(function (child) { if (child.userData && child.userData.minestCosmeticSlot === marker) bone.remove(child); }); });
      var itemId = viewState.equippedBySlot[slot];
      if (!itemId) return;
      var accessory = makeAccessory(THREE, itemId);
      accessory.userData.minestCosmeticSlot = marker;
      anchor.add(accessory);
      if (slot === 'neck') accessory.scale.setScalar(.82);
    });
    if (binding.onApplied) binding.onApplied(cloneState(viewState));
  }
  // 44.2: Pet Raising hands over a trimmed Three.js adapter (no Color / BufferAttribute …), which made
  // every non-default skin throw. Fill the gaps from the model's own objects.
  function completeTHREE(THREE, model) {
    if (!THREE || THREE.__completed) return THREE;
    var T = Object.create(THREE), mesh = null;
    model.traverse(function (n) { if (!mesh && n.isMesh && n.material && n.geometry) mesh = n; });
    var mat = mesh && (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material);
    if (!THREE.Color && mat && mat.color) T.Color = mat.color.constructor;
    if (!THREE.BufferAttribute && mesh) T.BufferAttribute = mesh.geometry.getAttribute('position').constructor;
    if (!THREE.Vector3) T.Vector3 = model.position.constructor;
    T.__completed = true;
    return T;
  }
  function watchModel(model, THREE, binding) {
    THREE = completeTHREE(THREE, model);
    if (!binding || !binding.previewState) { window.__minestCosmeticsModel = model; window.__minestCosmeticsTHREE = THREE; }   // 44.2: wardrobe try-on
    var apply = function () { applyModel(model, THREE, binding); };
    apply(); listeners.push(apply);
    return function () { listeners = listeners.filter(function (item) { return item !== apply; }); };
  }
  window.MinestCosmetics = {
    version: '1.0', skins: SKINS, accessories: ACCESSORIES,
    getState: function () { return cloneState(state); },
    exportState: function () { return cloneState(state); },
    importState: function (nextState, options) {
      if (!nextState || typeof nextState !== 'object') return false;
      state = cloneState(Object.assign({}, DEFAULT_STATE, nextState));
      if (!(options && options.persist === false)) persist(); else notify();
      return true;
    },
    isUnlocked: isUnlocked, unlock: unlock, equipSkin: equipSkin, equipAccessory: equipAccessory, clearSlot: clearSlot, setSkinAdjustments: setSkinAdjustments, setRenderMode: setRenderMode,
    rewardUnlock: rewardUnlock, onChange: function (listener) { listeners.push(listener); return function () { listeners = listeners.filter(function (item) { return item !== listener; }); }; },
    watchModel: watchModel, applyModel: applyModel,
    previewModel: function (model, THREE, previewState, binding) {
      binding = Object.assign({}, binding || {}, { previewState: cloneState(Object.assign({}, state, previewState || {})) });
      applyModel(model, THREE, binding);
    },
    reset: function () { state = cloneState(DEFAULT_STATE); persist(); }
  };
}());
