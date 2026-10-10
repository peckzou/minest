(function () {
  'use strict';

  var CROWN = 'small_crown';
  var RENDER_KEY = 'minest.source-render.v1';
  var RENDER_DEFAULTS = { exposure: 1.28, ambient: .85, hemi: .85, key: 2.6, rim: 2, ground: .75 };
  var renderSettings = readRenderSettings();
  var stateReady = false;
  var overlayHideTimer = 0;
  var miniVisible = true;

  function readRenderSettings() {
    try {
      var stored = JSON.parse(localStorage.getItem(RENDER_KEY) || 'null');
      return Object.assign({}, RENDER_DEFAULTS, stored || {});
    } catch (error) { return Object.assign({}, RENDER_DEFAULTS); }
  }

  function persistRenderSettings() {
    try { localStorage.setItem(RENDER_KEY, JSON.stringify(renderSettings)); } catch (error) {}
  }

  function applyRenderSettings() {
    var avatar = window.__octopusAvatar;
    if (!avatar || !avatar.renderer) return false;
    var renderer = avatar.renderer;
    // Three.js ACES Filmic tone mapping is the same pipeline used by the
    // cosmetics studio; only exposure and light energy are changed here.
    renderer.toneMapping = 4;
    renderer.toneMappingExposure = Number(renderSettings.exposure) || RENDER_DEFAULTS.exposure;
    [['ambientLight', 'ambient'], ['hemiLight', 'hemi'], ['keyLight', 'key'], ['rimLight', 'rim'], ['groundLight', 'ground']].forEach(function (entry) {
      if (avatar[entry[0]]) avatar[entry[0]].intensity = Number(renderSettings[entry[1]]) || 0;
    });
    return true;
  }

  function ensureCrownState(equip) {
    if (!window.MinestCosmetics) return false;
    if (!window.MinestCosmetics.isUnlocked(CROWN)) window.MinestCosmetics.unlock(CROWN);
    if (equip) {
      var state = window.MinestCosmetics.getState();
      // 44.0: only when nothing is on the head — the user may have chosen headphones
      if (!state.equippedBySlot || !state.equippedBySlot.head) window.MinestCosmetics.equipAccessory(CROWN);
    }
    stateReady = true;
    return true;
  }

  function addControl() {
    if (document.querySelector('[data-v4-crown-toggle]')) return;
    var style = document.createElement('style');
    style.textContent = [
      '[data-v4-crown-toggle],[data-v4-render-toggle],[data-v4-mini-toggle]{position:fixed;right:14px;z-index:30;border:1px solid rgba(191,239,247,.3);border-radius:999px;padding:8px 12px;background:rgba(10,26,43,.62);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:rgba(232,252,255,.92);font:600 11px/1 -apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif;letter-spacing:.02em;box-shadow:0 8px 20px rgba(0,0,0,.18);cursor:pointer;transition:opacity .28s ease,visibility .28s ease,transform .28s ease,background .2s ease,border-color .2s ease}',
      '[data-v4-crown-toggle]{top:calc(14px + env(safe-area-inset-top));border-color:rgba(255,220,130,.38);color:#fff2c4}',
      '[data-v4-render-toggle]{top:calc(54px + env(safe-area-inset-top));padding:7px 11px;font-size:10px}',
      '[data-v4-mini-toggle]{top:calc(92px + env(safe-area-inset-top));padding:7px 11px;font-size:10px}',
      '.v4-overlay-controls-hidden [data-v4-overlay-control]{opacity:0;visibility:hidden;pointer-events:none;transform:translateY(-7px)}',
      '.v4-overlay-controls-visible [data-v4-overlay-control]{opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0)}',
      '[data-v4-crown-toggle]:active{transform:scale(.96)}',
      '[data-v4-crown-toggle][aria-pressed="false"],[data-v4-mini-toggle][aria-pressed="false"]{opacity:.72;border-color:rgba(191,239,247,.28);color:rgba(232,252,255,.82)}',
      '[data-v4-mini-toggle][aria-pressed="true"]{border-color:rgba(159,231,213,.4);color:#d5fff4}'
    ].join('');
    document.head.appendChild(style);
    var button = document.createElement('button');
    button.type = 'button';
    button.dataset.v4CrownToggle = 'true';
    button.dataset.v4OverlayControl = 'true';
    button.setAttribute('aria-label', 'Toggle crown accessory');
    button.addEventListener('pointerdown', function (event) { event.stopPropagation(); }, { capture: true });
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (!ensureCrownState(false)) return;
      // 44.0: cycle the head accessory — Crown → Headphones → none
      var C = window.MinestCosmetics, head = C.getState().equippedBySlot.head;
      if (!C.isUnlocked('headphones')) C.unlock('headphones');
      if (head === CROWN) C.equipAccessory('headphones');
      else if (head === 'headphones') C.clearSlot('head');
      else C.equipAccessory(CROWN);
      syncControl();
    });
    document.body.appendChild(button);
    function syncControl() {
      var head = stateReady ? window.MinestCosmetics.getState().equippedBySlot.head : null;
      button.setAttribute('aria-pressed', String(!!head));
      button.setAttribute('aria-label', 'Head accessory: ' + (head || 'none') + ' (tap to change)');
      button.textContent = head === CROWN ? '♕ Crown' : head === 'headphones' ? '🎧 Headphones' : '○ No hat';
    }
    window.addEventListener('minest-cosmetics-changed', syncControl);
    syncControl();
  }

  function sendMiniMessage(action, value) {
    try {
      if (window.parent && window.parent !== window) window.parent.postMessage({ channel: 'minest-mini-pet', action: action, visible: value }, '*');
    } catch (error) {}
  }

  function addMiniControl() {
    if (document.querySelector('[data-v4-mini-toggle]')) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.dataset.v4MiniToggle = 'true';
    button.dataset.v4OverlayControl = 'true';
    button.setAttribute('aria-label', 'Show or hide mini pet');
    button.addEventListener('pointerdown', function (event) { event.stopPropagation(); showOverlayControls(); }, { capture: true });
    button.addEventListener('click', function (event) {
      event.preventDefault(); event.stopPropagation();
      miniVisible = !miniVisible;
      sendMiniMessage('set-visible', miniVisible);
      syncMiniControl();
      showOverlayControls();
    });
    document.body.appendChild(button);
    function syncMiniControl() {
      button.setAttribute('aria-pressed', String(miniVisible));
      button.textContent = miniVisible ? 'Hide mini' : 'Show mini';
      button.setAttribute('aria-label', miniVisible ? 'Hide mini pet' : 'Show mini pet');
    }
    window.addEventListener('message', function (event) {
      var message = event && event.data;
      if (message && message.channel === 'minest-mini-pet' && message.action === 'state') {
        miniVisible = Boolean(message.visible); syncMiniControl();
      }
    });
    syncMiniControl();
    sendMiniMessage('get-state');
  }

  function hideOverlayControls() {
    var panel = document.querySelector('[data-v4-render-panel]');
    var toggle = document.querySelector('[data-v4-render-toggle]');

    // The controls are transient chrome. Close the render drawer with them so
    // an open drawer cannot keep the top-right buttons pinned on screen.
    if (panel) panel.hidden = true;
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('v4-overlay-controls-visible');
    document.documentElement.classList.add('v4-overlay-controls-hidden');
  }

  function showOverlayControls() {
    document.documentElement.classList.remove('v4-overlay-controls-hidden');
    document.documentElement.classList.add('v4-overlay-controls-visible');
    window.clearTimeout(overlayHideTimer);
    overlayHideTimer = window.setTimeout(hideOverlayControls, 3500);
  }

  function installOverlayAutoHide() {
    ['pointermove', 'pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(function (eventName) {
      document.addEventListener(eventName, showOverlayControls, { passive: eventName !== 'wheel', capture: true });
    });
    showOverlayControls();
  }

  function addRenderControls() {
    if (document.querySelector('[data-v4-render-toggle]')) return;
    var style = document.createElement('style');
    style.textContent = [
      '[data-v4-render-toggle]{position:fixed;right:14px;top:calc(54px + env(safe-area-inset-top));z-index:30;border:1px solid rgba(191,239,247,.3);border-radius:999px;padding:7px 11px;background:rgba(10,26,43,.56);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:rgba(232,252,255,.9);font:600 10px/1 -apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.16)}',
      '[data-v4-render-panel]{position:fixed;right:14px;bottom:calc(58px + env(safe-area-inset-bottom));z-index:29;width:224px;padding:11px 12px;border:1px solid rgba(191,239,247,.25);border-radius:14px;background:rgba(5,24,39,.76);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 14px 34px rgba(0,0,0,.24);color:rgba(232,252,255,.9);font:500 10px/1.2 -apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif}',
      '[data-v4-render-panel][hidden]{display:none}',
      '[data-v4-render-panel] h3{margin:0 0 8px;color:#fff2c4;font-size:10px;letter-spacing:.08em;text-transform:uppercase}',
      '[data-v4-render-row]{display:grid;grid-template-columns:74px 1fr 34px;gap:7px;align-items:center;margin:6px 0}',
      '[data-v4-render-row] label{color:rgba(232,252,255,.78)}',
      '[data-v4-render-row] input{width:100%;accent-color:#f3c45b}',
      '[data-v4-render-row] output{text-align:right;color:#fff2c4;font-variant-numeric:tabular-nums}'
    ].join('');
    document.head.appendChild(style);
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.dataset.v4RenderToggle = 'true';
    toggle.dataset.v4OverlayControl = 'true';
    toggle.textContent = 'Render';
    toggle.setAttribute('aria-expanded', 'false');
    var panel = document.createElement('section');
    panel.dataset.v4RenderPanel = 'true';
    panel.hidden = true;
    panel.innerHTML = '<h3>Source file render</h3>';
    var fields = [
      ['exposure', 'Exposure', .6, 2, .01],
      ['ambient', 'Ambient', 0, 1.5, .01],
      ['hemi', 'Hemisphere', 0, 1.5, .01],
      ['key', 'Key light', 0, 4, .01],
      ['rim', 'Rim light', 0, 4, .01],
      ['ground', 'Ground bounce', 0, 2, .01]
    ];
    fields.forEach(function (field) {
      var row = document.createElement('div');
      row.dataset.v4RenderRow = field[0];
      row.innerHTML = '<label for="v4-render-' + field[0] + '">' + field[1] + '</label><input id="v4-render-' + field[0] + '" type="range" min="' + field[2] + '" max="' + field[3] + '" step="' + field[4] + '"><output></output>';
      var input = row.querySelector('input');
      var output = row.querySelector('output');
      input.value = renderSettings[field[0]];
      output.value = Number(renderSettings[field[0]]).toFixed(2);
      input.addEventListener('input', function () {
        renderSettings[field[0]] = Number(input.value);
        output.value = Number(input.value).toFixed(2);
        persistRenderSettings();
        applyRenderSettings();
      });
      panel.appendChild(row);
    });
    function stop(event) { event.stopPropagation(); }
    toggle.addEventListener('pointerdown', stop, { capture: true });
    panel.addEventListener('pointerdown', stop, { capture: true });
    toggle.addEventListener('click', function (event) {
      event.preventDefault(); event.stopPropagation();
      panel.hidden = !panel.hidden;
      toggle.setAttribute('aria-expanded', String(!panel.hidden));
      showOverlayControls();
    });
    document.body.appendChild(toggle);
    document.body.appendChild(panel);
    applyRenderSettings();
  }

  function boot() {
    ensureCrownState(true);
    addControl();
    addRenderControls();
    addMiniControl();
    installOverlayAutoHide();
    applyRenderSettings();
    if (!window.__v4RenderSyncTimer) window.__v4RenderSyncTimer = window.setInterval(applyRenderSettings, 400);
    if (!stateReady) window.setTimeout(boot, 120);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
