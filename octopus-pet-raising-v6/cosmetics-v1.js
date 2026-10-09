(function () {
  'use strict';

  var STORAGE_KEY = 'minest.cosmetics.v1';
  var CHANNEL_NAME = 'minest-cosmetics-v1';
  var DEFAULT_STATE = {
    unlockedItems: ['default_purple', 'blue_lavender', 'headphones'],
    equippedSkin: 'default_purple',
    equippedBySlot: { head: null, hair: null, face: null, neck: null, hand: null },
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
    pearl_necklace: { label: 'Pearl Necklace', slot: 'neck', accent: 0xf6f1ea, requirement: 'Bond Lv 7', level: 7 },
    // 44.5: Octo holds your newest badge in a tentacle and plays with it
    badge_held: { label: 'Badge in Hand', slot: 'hand', accent: 0xffd76a, requirement: 'Earn a badge' },
    // 44.5: ten toys and decorations
    bubble_wand: { label: 'Bubble Wand', slot: 'hand', accent: 0x7fd6ff, requirement: 'Bond Lv 2', level: 2, toy: true },
    lollipop: { label: 'Lollipop', slot: 'hand', accent: 0xff7ab8, requirement: 'Bond Lv 3', level: 3, toy: true },
    party_hat: { label: 'Party Hat', slot: 'head', accent: 0xff6fa8, requirement: 'Bond Lv 3', level: 3 },
    sunglasses: { label: 'Sunglasses', slot: 'face', accent: 0x1d1b2e, requirement: 'Bond Lv 4', level: 4 },
    pencil: { label: 'Pencil', slot: 'hand', accent: 0xffc93c, requirement: 'Bond Lv 4', level: 4, toy: true },
    magnifier: { label: 'Magnifier', slot: 'hand', accent: 0xd8a24a, requirement: 'Bond Lv 5', level: 5, toy: true },
    flower_lei: { label: 'Flower Lei', slot: 'neck', accent: 0xff8fc0, requirement: 'Bond Lv 5', level: 5 },
    beach_ball: { label: 'Beach Ball', slot: 'hand', accent: 0xff5a5a, requirement: 'Bond Lv 6', level: 6, toy: true },
    ukulele: { label: 'Ukulele', slot: 'hand', accent: 0xc98a4b, requirement: 'Bond Lv 7', level: 7, toy: true },
    pirate_hat: { label: 'Pirate Hat', slot: 'head', accent: 0x2a2433, requirement: 'Treasure chest' }
  };
  var SLOTS = ['head', 'hair', 'face', 'neck', 'hand'];
  var listeners = [];
  var channel = null;
  try { channel = new BroadcastChannel(CHANNEL_NAME); } catch (error) {}

  function cloneState(state) {
    var adjustments = Object.assign({}, DEFAULT_STATE.skinAdjustments, state && state.skinAdjustments || {});
    return {
      unlockedItems: Array.from(new Set((state.unlockedItems || []).filter(Boolean))),
      equippedSkin: state.equippedSkin || DEFAULT_STATE.equippedSkin,
      equippedBySlot: Object.assign({ head: null, hair: null, face: null, neck: null, hand: null }, state.equippedBySlot || {}),
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
    } else if (id === 'party_hat') {
      // 44.5: a striped party cone with a pom-pom, perched on the top-left of the head
      var hatP = new THREE.Group(); hatP.position.set(-.12, .6, .02); hatP.rotation.set(-.1, 0, .32); group.add(hatP);
      var cols = [0xff6fa8, 0xffd84d, 0x6fd6ff, 0xff6fa8, 0xffd84d];
      cols.forEach(function (col, i) {
        var r0 = .2 * (1 - i / 5), r1 = .2 * (1 - (i + 1) / 5), hh = .44 / 5;
        var m = new THREE.MeshStandardMaterial({ color: col, roughness: .45 }); if (m.emissive) { m.emissive.setHex(col); m.emissiveIntensity = .16; }
        var seg = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, hh, 24), m); seg.position.y = hh * (i + .5); hatP.add(seg);
      });
      var pom = new THREE.Mesh(makeSphere(.06, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .9 })); pom.position.y = .47; hatP.add(pom);
      var rim = new THREE.Mesh(new THREE.TorusGeometry(.2, .02, 8, 28), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .8 })); rim.rotation.x = Math.PI / 2; hatP.add(rim);
      group.position.set(0, 0, 0);
    } else if (id === 'sunglasses') {
      // 44.5: round dark shades with a gold rim, over the eyes (eye centres x ±.23, y .164, z .30)
      var gold = new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: .25, metalness: .6 });
      var shade = new THREE.MeshStandardMaterial({ color: 0x15131f, roughness: .08, metalness: .4 });
      [-1, 1].forEach(function (sd) {
        var lensS = new THREE.Mesh(new THREE.CylinderGeometry(.122, .122, .02, 28), shade); lensS.rotation.x = Math.PI / 2; lensS.position.set(sd * .232, .166, .375); lensS.rotation.y = sd * .22; group.add(lensS);
        var ringS = new THREE.Mesh(new THREE.TorusGeometry(.124, .016, 10, 32), gold); ringS.position.copy(lensS.position); ringS.rotation.y = sd * .22; group.add(ringS);
        var shine = new THREE.Mesh(makeSphere(.022, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .1 })); shine.scale.z = .3; shine.position.set(sd * .232 - .05, .21, .39); group.add(shine);
        var templeS = new THREE.Mesh(new THREE.CylinderGeometry(.011, .011, .3, 8), gold); templeS.rotation.x = Math.PI / 2; templeS.position.set(sd * .4, .18, .2); templeS.rotation.y = sd * .5; group.add(templeS);
      });
      var bridgeS = new THREE.Mesh(new THREE.TorusGeometry(.05, .013, 8, 16, Math.PI), gold); bridgeS.position.set(0, .2, .4); group.add(bridgeS);
      group.position.set(0, 0, 0);
    } else if (id === 'flower_lei') {
      // 44.5: a Hawaiian lei of little pink / yellow / white flowers, draped like the pearl necklace
      var petalCols = [0xff7ab8, 0xffd84d, 0xffffff, 0xff9f43];
      var nF = 11;
      for (var fi = 0; fi < nF; fi++) {
        var aF = (fi / (nF - 1) - .5) * 2.4, col2 = petalCols[fi % petalCols.length];
        var fl = new THREE.Group(); fl.position.set(Math.sin(aF) * .38, -.2 + (1 - Math.cos(aF)) * .1, .25 + Math.cos(aF) * .25); fl.rotation.y = aF * .9; group.add(fl);
        var pm = new THREE.MeshStandardMaterial({ color: col2, roughness: .5 }); if (pm.emissive) { pm.emissive.setHex(col2); pm.emissiveIntensity = .18; }
        for (var pe = 0; pe < 5; pe++) { var pa = pe / 5 * Math.PI * 2, pt = new THREE.Mesh(makeSphere(.032, 10, 8), pm); pt.scale.z = .45; pt.position.set(Math.cos(pa) * .036, Math.sin(pa) * .036, 0); fl.add(pt); }
        var ctr = new THREE.Mesh(makeSphere(.02, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffc23c, roughness: .4 })); ctr.position.z = .012; fl.add(ctr);
      }
      group.position.set(0, 0, 0); group.userData.minestHeadAnchored = true;
    } else if (id === 'pirate_hat') {
      // 44.5: a tricorn pirate hat with gold trim and a little skull (goes with the treasure chest)
      var felt = new THREE.MeshStandardMaterial({ color: 0x2a2433, roughness: .85 }); if (felt.emissive) { felt.emissive.setHex(0x3a3046); felt.emissiveIntensity = .12; }
      var trim = new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: .3, metalness: .5 });
      var hatT = new THREE.Group(); hatT.position.set(0, .6, -.02); hatT.rotation.set(-.12, 0, 0); group.add(hatT);
      var crownT = new THREE.Mesh(new THREE.CylinderGeometry(.27, .33, .26, 28), felt); crownT.position.y = .13; hatT.add(crownT);
      var topT = new THREE.Mesh(makeSphere(.27, 20, 10), felt); topT.scale.y = .32; topT.position.y = .26; hatT.add(topT);
      // three up-turned flaps (a point at the front, between two of them), each edged in gold
      [Math.PI / 3, Math.PI, -Math.PI / 3].forEach(function (ang) {
        var flap = new THREE.Group(); flap.rotation.y = ang; hatT.add(flap);
        var f = new THREE.Mesh(new THREE.BoxGeometry(.56, .2, .035), felt); f.position.set(0, .1, .3); f.rotation.x = -.42; flap.add(f);
        var e = new THREE.Mesh(new THREE.BoxGeometry(.58, .03, .045), trim); e.position.set(0, .2, .26); e.rotation.x = -.42; flap.add(e);
      });
      var skull = new THREE.Mesh(makeSphere(.055, 14, 10), new THREE.MeshStandardMaterial({ color: 0xf6f1e8, roughness: .6 })); skull.scale.z = .5; skull.position.set(.17, .2, .3); hatT.add(skull);
      [-1, 1].forEach(function (sd) { var bone2 = new THREE.Mesh(new THREE.BoxGeometry(.15, .022, .02), new THREE.MeshStandardMaterial({ color: 0xf6f1e8, roughness: .6 })); bone2.position.set(.17, .14, .3); bone2.rotation.z = sd * .6; hatT.add(bone2); });
      group.position.set(0, 0, 0);
    }
    return group;
  }


  // ---- 44.5 toys Octo holds and plays with ---------------------------------------------------------
  function toyMat(THREE, col, rough, metal, glow) {
    var m = new THREE.MeshStandardMaterial({ color: col, roughness: rough == null ? .5 : rough, metalness: metal || 0 });
    if (m.emissive) { m.emissive.setHex(col); m.emissiveIntensity = glow == null ? .18 : glow; }
    return m;
  }
  function sph(THREE, r) { return THREE.SphereGeometry ? new THREE.SphereGeometry(r, 18, 12) : new THREE.CylinderGeometry(r, r, r * 1.6, 12); }
  function buildToy(THREE, id, g) {
    var M = function (c, r, m, e) { return toyMat(THREE, c, r, m, e); };
    if (id === 'bubble_wand') {
      var stick = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .42, 10), M(0x7fd6ff, .4)); stick.position.y = -.08; g.add(stick);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(.1, .018, 10, 28), M(0xff9fd0, .3)); ring.position.y = .2; g.add(ring);
      var film = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .004, 24), new THREE.MeshStandardMaterial({ color: 0xcff4ff, roughness: .05, transparent: true, opacity: .35 })); film.rotation.x = Math.PI / 2; film.position.y = .2; g.add(film);
    } else if (id === 'lollipop') {
      var st2 = new THREE.Mesh(new THREE.CylinderGeometry(.014, .014, .38, 8), M(0xffffff, .6, 0, .1)); st2.position.y = -.08; g.add(st2);
      [0xff5aa0, 0xffffff, 0x7fd6ff, 0xffffff, 0xffd84d].forEach(function (col, i) {
        var tr = new THREE.Mesh(new THREE.TorusGeometry(.03 + i * .028, .016, 8, 28), M(col, .35)); tr.position.y = .2; g.add(tr);
      });
      var dot = new THREE.Mesh(sph(THREE, .03), M(0xff5aa0, .35)); dot.scale.z = .5; dot.position.y = .2; g.add(dot);
    } else if (id === 'pencil') {
      var body = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .38, 6), M(0xffc93c, .45)); g.add(body);
      var tip = new THREE.Mesh(new THREE.CylinderGeometry(0, .04, .1, 6), M(0xf2d2a2, .7)); tip.position.y = -.24; tip.rotation.x = Math.PI; g.add(tip);
      var lead = new THREE.Mesh(new THREE.CylinderGeometry(0, .012, .03, 6), M(0x333333, .5, 0, .05)); lead.position.y = -.29; lead.rotation.x = Math.PI; g.add(lead);
      var band = new THREE.Mesh(new THREE.CylinderGeometry(.042, .042, .04, 12), M(0xc0c4cc, .3, .6, .1)); band.position.y = .21; g.add(band);
      var eraser = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .06, 12), M(0xff8fb1, .7)); eraser.position.y = .26; g.add(eraser);
      g.rotation.z = -.35;
    } else if (id === 'magnifier') {
      var rim = new THREE.Mesh(new THREE.TorusGeometry(.12, .022, 10, 32), M(0xd8a24a, .3, .5)); rim.position.y = .14; g.add(rim);
      var glass = new THREE.Mesh(new THREE.CylinderGeometry(.115, .115, .01, 28), new THREE.MeshStandardMaterial({ color: 0xdff4ff, roughness: .02, transparent: true, opacity: .32 })); glass.rotation.x = Math.PI / 2; glass.position.y = .14; g.add(glass);
      var handle = new THREE.Mesh(new THREE.CylinderGeometry(.026, .03, .22, 12), M(0x7a4a24, .6)); handle.position.y = -.08; g.add(handle);
    } else if (id === 'beach_ball') {
      var cols = [0xff5a5a, 0xffffff, 0x4aa8ff, 0xffffff, 0xffd84d, 0xffffff];
      cols.forEach(function (col, i) {   // six coloured wedges: slim spheres turned around the axis
        var w = new THREE.Mesh(sph(THREE, .16), M(col, .35, 0, .14)); w.scale.set(.52, 1, 1); w.rotation.y = i / cols.length * Math.PI; g.add(w);
      });
      var cap = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .33, 12), M(0xffffff, .4)); g.add(cap);
    } else if (id === 'ukulele') {
      var wood = M(0xc98a4b, .55, 0, .14), dark = M(0x5a3418, .6, 0, .08);
      var lower = new THREE.Mesh(sph(THREE, .13), wood); lower.scale.set(1, 1.05, .32); lower.position.y = -.1; g.add(lower);
      var upper = new THREE.Mesh(sph(THREE, .1), wood); upper.scale.set(1, 1, .32); upper.position.y = .06; g.add(upper);
      var hole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .01, 20), dark); hole.rotation.x = Math.PI / 2; hole.position.set(0, -.02, .045); g.add(hole);
      var neck = new THREE.Mesh(new THREE.BoxGeometry(.05, .3, .03), dark); neck.position.y = .27; g.add(neck);
      var head = new THREE.Mesh(new THREE.BoxGeometry(.075, .08, .035), wood); head.position.y = .45; g.add(head);
      for (var k = 0; k < 4; k++) { var str = new THREE.Mesh(new THREE.BoxGeometry(.003, .5, .003), M(0xf6f1e8, .3, .3, .3)); str.position.set((k - 1.5) * .011, .12, .05); g.add(str); }
      g.rotation.z = -.5;
    }
    return g;
  }
  // what each toy does now and then (called from heldTick); returns extra motion for the frame
  function toyPlay(h, t, dt) {
    var out = { spin: 0, lift: 0, tilt: 0, rx: 0, toward: 0 };
    var X = window.__octoExpression, Mo = window.__octoMouth;
    if (!h.act && t > h.next) h.act = { t: 0 };
    var u = h.act ? Math.min(1, (h.act.t += dt) / 1.4) : 0, wave = h.act ? Math.sin(u * Math.PI) : 0;
    if (h.kind === 'bubble_wand') {
      out.tilt = Math.sin(t * 2) * .15 + wave * .5; out.toward = wave * .6;
      if (h.act && !h.act.done && u > .45) { h.act.done = true; if (Mo && Mo.bubbles) Mo.bubbles(7); if (Mo && Mo.play) Mo.play('puff', 0); }
    } else if (h.kind === 'lollipop') {
      out.tilt = Math.sin(t * 1.5) * .12; out.toward = wave * .8; out.lift = wave * .05;
      if (h.act && !h.act.done && u > .5) { h.act.done = true; if (Mo && Mo.play) Mo.play('munch', 0); if (X && X.set) X.set('happy', 1500); }
    } else if (h.kind === 'pencil') {
      out.tilt = Math.sin(t * 18) * .08 * (h.act ? 1 : .2); out.lift = Math.sin(t * 9) * .012 * (h.act ? 1 : 0);
      if (h.act && !h.act.done && u > .3) { h.act.done = true; if (X && X.set) X.set('curious', 1600); }
    } else if (h.kind === 'magnifier') {
      out.toward = wave * .9; out.lift = wave * .12; out.spin = Math.sin(t * .8) * .25;
      if (h.act && !h.act.done && u > .4) { h.act.done = true; if (X && X.set) X.set('curious', 2200); var L = window.__octoLids; if (L && L.play) L.play('focus', 0); }
    } else if (h.kind === 'beach_ball') {
      out.spin = t * 1.2 + (h.act ? u * Math.PI * 6 : 0); out.lift = wave * .32; out.rx = t * .7;
      if (h.act && !h.act.done && u > .9) { h.act.done = true; if (X && X.set) X.set('happy', 1500); if (Mo && Mo.play) Mo.play('giggle', 0); }
    } else if (h.kind === 'ukulele') {
      out.tilt = Math.sin(t * 3.2) * .12; out.lift = Math.abs(Math.sin(t * 3.2)) * .015;
      if (h.act && !h.act.done) { h.act.done = true; if (Mo && Mo.play) Mo.play('hum', 0); }
    }
    if (h.act && u >= 1) { h.act = null; h.next = t + 4 + Math.random() * 4; }
    return out;
  }

  // ---- 44.5 the badge in Octo's tentacle ----------------------------------------------------------
  // The newest badge (localStorage 'minest.octo.latestBadge' = {id, icon, color}) is shown as a little
  // 3D medal: the badge-wall render on both faces, darker layers in between for thickness. It follows a
  // front tentacle tip every frame (not parented to the bone, so it stays upright) and Octo plays with it:
  // it turns slowly, now and then flips over or gets tossed up and caught.
  var HELD = [], badgeImgs = {};
  function latestBadge() { try { return JSON.parse(localStorage.getItem('minest.octo.latestBadge') || 'null'); } catch (e) { return null; } }
  function badgeURL(id) {
    var m = /^strike-(\d+)-days$/.exec(id || ''), file = m ? 'strike-' + m[1] : id;
    var base = location.protocol === 'file:' ? 'https://minest-app.vercel.app/' : location.origin + '/';
    return base + 'badge-index/thumbs/' + file + '.webp';
  }
  function drawFallback(ctx, b) {   // badges without a wall render: a gold hexagon with their icon
    var S = 256, col = (b && b.color) || '#f5c542';
    ctx.clearRect(0, 0, S, S);
    ctx.beginPath();
    for (var i = 0; i < 6; i++) { var a = Math.PI / 3 * i - Math.PI / 2; ctx[i ? 'lineTo' : 'moveTo'](S / 2 + Math.cos(a) * 118, S / 2 + Math.sin(a) * 118); }
    ctx.closePath();
    var g = ctx.createLinearGradient(0, 0, S, S); g.addColorStop(0, '#fff6d0'); g.addColorStop(.45, col); g.addColorStop(1, '#6b4a10');
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.stroke();
    ctx.font = '112px system-ui, "Apple Color Emoji", "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText((b && b.icon) || '🏅', S / 2, S / 2 + 6);
  }
  function badgeCanvas(b, done) {
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var ctx = c.getContext('2d');
    drawFallback(ctx, b); done(c);
    if (!b || !b.id) return;
    var url = badgeURL(b.id), img = badgeImgs[url];
    var paint = function () { if (img.naturalWidth) { ctx.clearRect(0, 0, 256, 256); ctx.drawImage(img, 0, 0, 256, 256); done(c, true); } };
    if (img) { if (img.complete) paint(); else img.addEventListener('load', paint); return; }
    img = badgeImgs[url] = new Image(); img.crossOrigin = 'anonymous';
    img.onload = paint; img.src = url;
  }
  function holdBadge(model, THREE, itemId) {
    var old = model.userData.minestHeldBadge;
    if (old) { if (old.parent) old.parent.remove(old); model.userData.minestHeldBadge = null; }
    HELD = HELD.filter(function (h) { return h.model !== model; });
    var isToy = !!(ACCESSORIES[itemId] && ACCESSORIES[itemId].toy);
    if ((itemId !== 'badge_held' && !isToy) || !THREE.Mesh || !THREE.BoxGeometry || !THREE.MeshStandardMaterial) return;
    var bone = null;
    ['tentacle_2_10', 'tentacle_2_9', 'tentacle_2_8', 'tentacle_1_10', 'tentacle_1_9'].some(function (n) { bone = findBone(model, [n]); return !!bone; });
    if (!bone) return;
    var src = null; model.traverse(function (n) { if (!src && n.isMesh && n.material) { var m0 = Array.isArray(n.material) ? n.material[0] : n.material; if (m0 && (m0.emissiveMap || m0.map)) src = m0.emissiveMap || m0.map; } });
    if (!src && !isToy) return;
    var group = new THREE.Group(); group.name = 'cosmetic:' + itemId;
    var inner = new THREE.Group(); group.add(inner);
    if (isToy) {
      buildToy(THREE, itemId, inner);
      model.add(group); model.userData.minestHeldBadge = group;
      HELD.push({ kind: itemId, body: findBone(model, ['body', 'Body', 'root']), model: model, bone: bone, group: group, inner: inner, t0: performance.now(), next: 3 + Math.random() * 3, act: null, V: model.position.constructor });
      return;
    }
    var size = .42, mats = [];
    var b = latestBadge(), tex = null;
    badgeCanvas(b, function (canvas) {
      if (!tex) {
        tex = new src.constructor(canvas);
        // the badge art is sRGB (three r151+: colorSpace; older builds such as the board's r128: encoding)
        if ('colorSpace' in src) tex.colorSpace = 'srgb';
        if (src.encoding !== undefined) tex.encoding = (THREE && THREE.sRGBEncoding) || 3001;
        tex.flipY = true;
      }
      tex.image = canvas; tex.needsUpdate = true;
    });
    // faces + 4 darker layers in between = a medal with some thickness
    [-2, -1, 0, 1, 2].forEach(function (k) {
      var face = k === -2 || k === 2;
      var mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, transparent: true, alphaTest: .5, roughness: .35, metalness: face ? .25 : .6 });
      mat.color.setRGB(face ? .82 : .45, face ? .82 : .4, face ? .82 : .32);
      if (mat.emissive) mat.emissive.setRGB(face ? .26 : .08, face ? .26 : .07, face ? .26 : .05);
      var mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, .0006), mat);
      mesh.position.z = k * .0035; mesh.renderOrder = 3;
      inner.add(mesh); mats.push(mat);
    });
    model.add(group);
    model.userData.minestHeldBadge = group;
    HELD.push({ kind: 'badge', body: findBone(model, ['body', 'Body', 'root']), model: model, bone: bone, group: group, inner: inner, t0: performance.now(), next: 4 + Math.random() * 3, act: null, V: model.position.constructor });
  }
  function refreshHeld() {   // a new badge was earned: repaint the medals
    HELD.forEach(function (h) {
      if (h.kind !== 'badge') return;
      var mat = h.inner.children[0] && h.inner.children[0].material, tex = mat && mat.map;
      if (!tex) return;
      badgeCanvas(latestBadge(), function (canvas) { tex.image = canvas; tex.needsUpdate = true; });
      h.act = { kind: 'toss', t: 0 };   // show it off
    });
  }
  window.addEventListener('minest-latest-badge', refreshHeld);
  window.addEventListener('storage', function (e) { if (e.key === 'minest.octo.latestBadge') refreshHeld(); });
  var lastHeldT = 0;
  (function heldTick(now) {
    requestAnimationFrame(heldTick);
    var dt = Math.min(.05, (now - (lastHeldT || now)) / 1000); lastHeldT = now;
    for (var i = HELD.length - 1; i >= 0; i--) {
      var h = HELD[i];
      if (!h.group.parent) { HELD.splice(i, 1); continue; }
      var t = (now - h.t0) / 1000, v = new h.V();
      h.bone.getWorldPosition(v); h.model.worldToLocal(v);
      // hold it out from the body along the tentacle (centre → tip), a little raised: never in front of the face
      var c = new h.V(); if (h.body) { h.body.getWorldPosition(c); h.model.worldToLocal(c); }
      var dx = v.x - c.x, dz = v.z - c.z, dl = Math.sqrt(dx * dx + dz * dz) || 1;
      h.group.position.set(v.x + dx / dl * .2, v.y + .22, v.z + dz / dl * .2);
      if (h.kind !== 'badge') {
        var o = toyPlay(h, t, dt);
        // "toward" brings the toy in front of the face (to look through, lick, blow…)
        if (o.toward) { var fx = c.x, fy = c.y + .55, fz = c.z + .45; h.group.position.x += (fx - h.group.position.x) * o.toward * .7; h.group.position.y += (fy - h.group.position.y) * o.toward * .5; h.group.position.z += (fz - h.group.position.z) * o.toward * .7; }
        h.group.position.y += o.lift;
        h.inner.rotation.set(o.rx, o.spin, o.tilt);
        continue;
      }
      var spin = t * 1.4, flip = 0, lift = 0;
      if (!h.act && t > h.next) { h.act = { kind: Math.random() < .5 ? 'flip' : 'toss', t: 0 }; }
      if (h.act) {
        h.act.t += dt;
        var u = Math.min(1, h.act.t / (h.act.kind === 'toss' ? 1.1 : .9));
        var e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        if (h.act.kind === 'flip') flip = e * Math.PI * 2;
        else { lift = Math.sin(u * Math.PI) * .28; spin += e * Math.PI * 4; }
        if (u >= 1) {
          if (h.act.kind === 'toss') { var X = window.__octoExpression; if (X && X.set) X.set('happy', 1800); var M = window.__octoMouth; if (M && M.play) M.play('giggle', 40); }
          h.act = null; h.next = t + 5 + Math.random() * 5;
        }
      }
      h.inner.rotation.set(flip, spin, Math.sin(t * 1.7) * .12);
      h.group.position.y += lift + Math.sin(t * 2.2) * .008;
    }
  })(0);

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
    // 44.5: three r151+ names the emissive-map UV varying vEmissiveMapUv; older builds (the board's Mini Pet
    // runs r128) only have vUv — the wrong name broke the shader and the Mini Pet's body vanished
    var rev = parseInt(THREE && THREE.REVISION, 10), emUv = rev && rev < 151 ? 'vUv' : 'vEmissiveMapUv';
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
        '    if (minestStarry > .5) { vec2 g = ' + emUv + ' * 420.0; vec2 c = floor(g); float h = fract(sin(dot(c, vec2(12.9898,78.233))) * 43758.5453);',
        '      float star = step(.985, h) * smoothstep(.45, .0, length(fract(g) - .5)) * (.55 + .45 * sin(minestTime * 2.5 + h * 60.0));',
        '      totalEmissiveRadiance += vec3(1., .95, .8) * star * 1.4 * minestSurfaceMask * keep; }',
        '    #endif',
        '  }'
      ].join('\n'));
    };
    material.customProgramCacheKey = function () {
      return 'minest-surface-tint-v8-' + emUv + '-' + (material.userData.minestStarry ? 's-' : '') + [rgb.r, rgb.g, rgb.b].map(function (value) { return Math.round(value * 1000); }).join('-');
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
      if (slot === 'hand') { holdBadge(model, THREE, viewState.equippedBySlot.hand); return; }
      var useHead = slot !== 'neck' || viewState.equippedBySlot[slot] === 'pearl_necklace' || viewState.equippedBySlot[slot] === 'flower_lei';
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
    // 44.5: Pet Raising's adapter has no SphereGeometry (spheres fell back to little cylinders): build one
    if (!THREE.SphereGeometry && mesh && T.BufferAttribute) {
      var Geo = mesh.geometry.constructor, BA = T.BufferAttribute;
      T.SphereGeometry = function (r, ws, hs) {
        r = r || 1; ws = Math.max(3, ws || 16); hs = Math.max(2, hs || 12);
        var pos = [], nor = [], uv = [], idx = [];
        for (var iy = 0; iy <= hs; iy++) {
          var v = iy / hs, th = v * Math.PI;
          for (var ix = 0; ix <= ws; ix++) {
            var u = ix / ws, ph = u * Math.PI * 2;
            var x = -Math.cos(ph) * Math.sin(th), y = Math.cos(th), z = Math.sin(ph) * Math.sin(th);
            pos.push(x * r, y * r, z * r); nor.push(x, y, z); uv.push(u, 1 - v);
          }
        }
        for (iy = 0; iy < hs; iy++) for (var jx = 0; jx < ws; jx++) {
          var a = iy * (ws + 1) + jx, b = a + ws + 1;
          if (iy !== 0) idx.push(a, b, a + 1);
          if (iy !== hs - 1) idx.push(b, b + 1, a + 1);
        }
        var g = new Geo();
        g.setAttribute('position', new BA(new Float32Array(pos), 3));
        g.setAttribute('normal', new BA(new Float32Array(nor), 3));
        g.setAttribute('uv', new BA(new Float32Array(uv), 2));
        g.setIndex(new BA(new Uint16Array(idx), 1));
        return g;
      };
    }
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
