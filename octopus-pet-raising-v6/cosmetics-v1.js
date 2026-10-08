(function () {
  'use strict';

  var STORAGE_KEY = 'minest.cosmetics.v1';
  var CHANNEL_NAME = 'minest-cosmetics-v1';
  var DEFAULT_STATE = {
    unlockedItems: ['default_purple', 'blue_lavender', 'headphones'],
    equippedSkin: 'default_purple',
    equippedBySlot: { head: null, neck: null },
    skinAdjustments: { hue: 0, saturation: 1, brightness: 1 },
    renderMode: 'source'
  };
  var SKINS = {
    default_purple: { label: 'Default Purple', color: 0xffffff, accent: 0x8c6bd9, requirement: 'Base' },
    blue_lavender: { label: 'Blue Lavender', color: 0x6d9dff, accent: 0x667eea, requirement: 'Growth Level 2' },
    pearl_pink: { label: 'Pearl Pink', color: 0xff91bd, accent: 0xf06f9d, requirement: 'Badge milestone' }
  };
  var ACCESSORIES = {
    headphones: { label: 'Headphones', slot: 'head', accent: 0x9a7bd3, requirement: 'Growth Level 3' },
    small_crown: { label: 'Small Crown', slot: 'head', accent: 0xffd76a, requirement: 'Badge milestone' },
    scarf: { label: 'Scarf', slot: 'neck', accent: 0xff7c91e8, requirement: 'Streak milestone' }
  };
  var listeners = [];
  var channel = null;
  try { channel = new BroadcastChannel(CHANNEL_NAME); } catch (error) {}

  function cloneState(state) {
    var adjustments = Object.assign({}, DEFAULT_STATE.skinAdjustments, state && state.skinAdjustments || {});
    return {
      unlockedItems: Array.from(new Set((state.unlockedItems || []).filter(Boolean))),
      equippedSkin: state.equippedSkin || DEFAULT_STATE.equippedSkin,
      equippedBySlot: Object.assign({ head: null, neck: null }, state.equippedBySlot || {}),
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
    state.equippedSkin = itemId; persist(); return true;
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
      // Reference shape: one continuous over-head band plus two front-facing
      // circular ear cups with a smaller padded inner disc.
      var band = new THREE.Mesh(new THREE.TorusGeometry(.31, .035, 12, 32, Math.PI), material);
      band.position.set(0, .38, -.08); group.add(band);
      var padMaterial = makeMaterial(THREE, 0xcbbcf0, .5, .02);
      [-1, 1].forEach(function (side) {
        var cup = new THREE.Mesh(new THREE.CylinderGeometry(.108, .108, .065, 24), material);
        cup.rotation.x = Math.PI / 2;
        cup.position.set(side * .30, .20, .08);
        group.add(cup);
        var pad = new THREE.Mesh(new THREE.CylinderGeometry(.078, .078, .072, 24), padMaterial);
        pad.rotation.x = Math.PI / 2;
        pad.position.set(side * .30, .20, .125);
        group.add(pad);
        var rim = new THREE.Mesh(new THREE.TorusGeometry(.088, .012, 8, 24), material);
        rim.position.set(side * .30, .20, .165);
        group.add(rim);
      });
      group.scale.setScalar(1.12);
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
      geometry.setAttribute('minestPlushPart', new THREE.BufferAttribute(fallback, 1));
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
    geometry.setAttribute('minestPlushPart', new THREE.BufferAttribute(mask, 1));
  }
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
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n  ' + mask + '\n  ' + tintBlend + '\n  diffuseColor.rgb = mix(diffuseColor.rgb, minestFurTint, minestSurfaceMask);');
      shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance = mix(totalEmissiveRadiance, minestSkinTint, minestSurfaceMask * 0.18);');
    };
    material.customProgramCacheKey = function () {
      return 'minest-surface-tint-v4-' + [rgb.r, rgb.g, rgb.b].map(function (value) { return Math.round(value * 1000); }).join('-');
    };
    material.needsUpdate = true;
  }
  function applyModel(model, THREE, binding) {
    if (!model || !THREE) return;
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
        installSurfaceTint(item, rgb, THREE);
        item.needsUpdate = true;
      };
      Array.isArray(material) ? material.forEach(apply) : apply(material);
      node.material = material;
    });
    ['head', 'neck'].forEach(function (slot) {
      var anchor = slot === 'head' ? findBone(model, ['head', 'Head']) : findBone(model, ['body', 'Body', 'neck', 'Neck']);
      if (!anchor) return;
      var marker = 'minestCosmetic:' + slot;
      anchor.children.slice().forEach(function (child) { if (child.userData && child.userData.minestCosmeticSlot === marker) anchor.remove(child); });
      var itemId = viewState.equippedBySlot[slot];
      if (!itemId) return;
      var accessory = makeAccessory(THREE, itemId);
      accessory.userData.minestCosmeticSlot = marker;
      anchor.add(accessory);
      if (slot === 'neck') accessory.scale.setScalar(.82);
    });
    if (binding.onApplied) binding.onApplied(cloneState(viewState));
  }
  function watchModel(model, THREE, binding) {
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
