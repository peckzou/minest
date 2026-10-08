(function () {
  'use strict';

  // The catchlights are native Three.js children of the imported avatar. This
  // controller only owns the small control surface and smooths its values.
  var state = { targetX: 0, targetY: -0.22, currentX: 0, currentY: -0.22, targetSize: 1, currentSize: 1, preset: 'upper-center', enabled: true };
  var section = null;
  var raf = 0;
  var capturedAvatar = null;
  var presets = { center: [0, 0], 'upper-center': [0, -0.22], left: [-0.24, -0.04], right: [0.24, -0.04], upper: [0, -0.28], lower: [0, 0.22] };

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function addStyle() {
    if (document.querySelector('[data-v6-eye-style]')) return;
    var style = document.createElement('style');
    style.dataset.v6EyeStyle = 'true';
    style.textContent = [
      '[data-v6-eye-section]{margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1)}',
      '[data-v6-eye-section] > span{display:block;color:#bda3f8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px;font-size:11px}',
      '[data-v6-eye-row]{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin-top:5px}',
      '[data-v6-eye-row] button{min-height:30px;padding:0 6px;font-size:10px;text-align:center}',
      '[data-v6-eye-row] button[data-active="true"]{color:#fff;background:#49316d;border-color:#bda3f8;box-shadow:0 0 0 1px rgba(189,163,248,.2) inset}',
      '[data-v6-eye-toggle]{width:100%;margin-top:5px}',
      '[data-v6-eye-toggle][data-active="false"]{color:#c6b9d4;border-color:rgba(198,185,212,.38);background:rgba(255,255,255,.04)}',
      '[data-v6-eye-note]{display:block;color:#9c93ad;margin-top:7px;font-size:10px;line-height:1.35}'
    ].join('');
    document.head.appendChild(style);
  }

  try {
    Object.defineProperty(window, '__octopusAvatar', {
      configurable: true,
      get: function () { return capturedAvatar; },
      set: function (value) {
        if (value) {
          capturedAvatar = value;
          window.__v6AvatarInstance = value;
        }
      }
    });
  } catch (error) {}

  function getAvatar() { return capturedAvatar || window.__v6AvatarInstance || window.__octopusAvatarPersistent || null; }

  function installOnAvatar(avatar) {
    var model = avatar && avatar.importedModel;
    if (!model || model.userData.v6EyeHighlightGroup) return;
    var mesh = avatar.character && avatar.character.leftEyeMesh;
    var Group = avatar.avatarGestureGroup && avatar.avatarGestureGroup.constructor;
    var Mesh = mesh && mesh.constructor;
    var Material = mesh && mesh.material && mesh.material.constructor;
    if (!Group || !Mesh || !Material || !mesh.geometry) return;
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    model.traverse(function (node) {
      var position = node.geometry && node.geometry.attributes && node.geometry.attributes.position;
      if (!position) return;
      for (var index = 0; index < position.count; index += 1) {
        minX = Math.min(minX, position.getX(index)); maxX = Math.max(maxX, position.getX(index));
        minY = Math.min(minY, position.getY(index)); maxY = Math.max(maxY, position.getY(index));
        minZ = Math.min(minZ, position.getZ(index)); maxZ = Math.max(maxZ, position.getZ(index));
      }
    });
    if (!isFinite(minX) || !isFinite(minZ)) return;
    var width = maxX - minX, height = maxY - minY, depth = maxZ - minZ;
    var group = new Group();
    group.name = 'v6-eye-catchlights';
    group.userData.v6EyeHighlight = { x: 0, y: -.22, size: 1 };
    // The v23 face looks toward +Z. Keep the catchlights just in front of the
    // baked eye surface so depth sorting cannot hide them inside the mesh.
    group.position.set(0, minY + height * .61, maxZ + .012);
    group.renderOrder = 20;
    var material = new Material({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.1, roughness: .12, metalness: 0, transparent: true, opacity: .98, depthWrite: false });
    material.toneMapped = false;
    material.depthTest = false;
    [-1, 1].forEach(function (side) {
      var dot = new Mesh(mesh.geometry.clone(), material.clone ? material.clone() : material);
      dot.name = side < 0 ? 'v6-eye-catchlight-left' : 'v6-eye-catchlight-right';
      dot.scale.setScalar(.075);
      dot.position.x = side * width * .14;
      dot.renderOrder = 20;
      group.add(dot);
    });
    model.add(group);
    model.userData.v6EyeHighlightGroup = group;
    avatar.setV6EyeHighlightVisible = function (visible) { group.visible = Boolean(visible); };
    avatar.setV6EyeHighlight = function (x, y, size) {
      var data = group.userData.v6EyeHighlight;
      data.x = clamp(Number(x) || 0, -.34, .34);
      data.y = clamp(Number(y) || 0, -.34, .34);
      data.size = clamp(Number(size) || 1, .72, 1.42);
      group.position.x = data.x * width * .16;
      group.position.y = minY + height * .61 - data.y * height * .09;
      group.position.z = maxZ + .012;
      group.scale.setScalar(data.size);
    };
    avatar.setV6EyeHighlight(0, -.22, 1);
  }

  function syncAvatar() {
    var avatar = getAvatar();
    installOnAvatar(avatar);
    if (!avatar || typeof avatar.setV6EyeHighlight !== 'function') return;
    avatar.setV6EyeHighlight(state.currentX, state.currentY, state.currentSize);
    if (typeof avatar.setV6EyeHighlightVisible === 'function') avatar.setV6EyeHighlightVisible(state.enabled);
  }

  function tick() {
    state.currentX += (state.targetX - state.currentX) * .13;
    state.currentY += (state.targetY - state.currentY) * .13;
    state.currentSize += (state.targetSize - state.currentSize) * .13;
    syncAvatar();
    raf = window.requestAnimationFrame(tick);
  }

  function syncButtons() {
    if (!section) return;
    section.querySelectorAll('button[data-v6-eye-preset]').forEach(function (button) { button.dataset.active = String(button.dataset.v6EyePreset === state.preset); });
    section.querySelectorAll('button[data-v6-eye-size]').forEach(function (button) { button.dataset.active = String(Number(button.dataset.v6EyeSize) === state.targetSize); });
    var toggle = section.querySelector('[data-v6-eye-toggle]');
    if (toggle) {
      toggle.dataset.active = String(state.enabled);
      toggle.textContent = state.enabled ? 'Hide highlight' : 'Show highlight';
      toggle.setAttribute('aria-label', state.enabled ? 'Hide eye highlight' : 'Show eye highlight');
    }
  }

  function setPreset(name) {
    var point = presets[name];
    if (!point) return;
    state.targetX = point[0];
    state.targetY = point[1];
    state.preset = name;
    syncButtons();
  }

  function setSize(size) { state.targetSize = clamp(Number(size) || 1, .72, 1.42); syncButtons(); }

  function setEnabled(enabled) { state.enabled = Boolean(enabled); syncButtons(); }

  function makeButton(label, attribute, value, action) {
    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset[attribute] = value;
    button.setAttribute('aria-label', label + ' eye highlight');
    button.addEventListener('click', function (event) { event.preventDefault(); event.stopPropagation(); action(value); });
    return button;
  }

  function addControls(panel) {
    if (!panel || panel.querySelector('[data-v6-eye-section]')) return;
    section = document.createElement('div');
    section.dataset.v6EyeSection = 'true';
    var title = document.createElement('span');
    title.textContent = 'Eye highlight';
    section.appendChild(title);
    var positionRow = document.createElement('div');
    positionRow.dataset.v6EyeRow = 'position';
    [['Center', 'center'], ['Left', 'left'], ['Right', 'right'], ['Upper', 'upper'], ['Lower', 'lower'], ['Reset', 'upper-center']].forEach(function (item) { positionRow.appendChild(makeButton(item[0], 'v6EyePreset', item[1], setPreset)); });
    var sizeRow = document.createElement('div');
    sizeRow.dataset.v6EyeRow = 'size';
    [['Small', '.78'], ['Default', '1'], ['Large', '1.3']].forEach(function (item) { sizeRow.appendChild(makeButton(item[0], 'v6EyeSize', item[1], setSize)); });
    section.appendChild(positionRow);
    section.appendChild(sizeRow);
    var toggle = makeButton('Hide highlight', 'v6EyeToggle', 'true', function () { setEnabled(!state.enabled); });
    section.appendChild(toggle);
    var note = document.createElement('small');
    note.dataset.v6EyeNote = 'true';
    note.textContent = 'Stitch-style white catchlight · follows the avatar';
    section.appendChild(note);
    panel.appendChild(section);
    syncButtons();
  }

  function scan() { var panel = document.querySelector('.avatar-control-panel'); if (panel) addControls(panel); }

  function boot() {
    addStyle();
    scan();
    if (!raf) raf = window.requestAnimationFrame(tick);
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', scan, { passive: true });
    window.__v6EyeHighlight = { setPreset: setPreset, setSize: setSize, setEnabled: setEnabled, getState: function () { return { x: state.targetX, y: state.targetY, size: state.targetSize, preset: state.preset, enabled: state.enabled }; } };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
