/* Pet Raising — Wardrobe v1 (44.2)
   Replaces the single Crown toggle with a wardrobe: every skin and accessory, grouped by slot, with its
   unlock condition and a live try-on. Owned items equip / unequip with a tap; locked ones can be tried
   on the octopus for 5 seconds. Items unlock as the Care bond level grows (care-v2), with a toast. */
(function () {
  'use strict';
  if (window.__octoWardrobe) return;
  var ZH = {
    small_crown: ['👑', '小皇冠'], headphones: ['🎧', '毛绒耳机'], scarf: ['🧣', '围巾'], bow: ['🎀', '蝴蝶结'], straw_hat: ['👒', '草帽'],
    starfish_clip: ['⭐', '海星发夹'], glasses: ['👓', '圆框眼镜'], pearl_necklace: ['📿', '珍珠项链'],
    default_purple: ['#c9b3f2', '薰衣草紫'], blue_lavender: ['#7fa8ff', '蓝薰衣草'], pearl_pink: ['#ff9fc6', '珍珠粉'],
    mint_green: ['#7fe3c4', '薄荷绿'], peach_pink: ['#ffb39b', '蜜桃粉'], starry_night: ['linear-gradient(135deg,#2b2f7a,#5a4fc0 60%,#9a8cff)', '星空']
  };
  var SLOT_ZH = { head: '头饰', hair: '发饰', face: '脸部', neck: '颈部' };
  var LEGACY_LEVEL = { scarf: 4, pearl_pink: 5 };          // older items that had no Care level
  var FREE = ['default_purple', 'blue_lavender', 'small_crown', 'headphones'];

  function C() { return window.MinestCosmetics; }
  function careLevel() { var c = window.__octoCare; return c && c.level ? c.level() : 1; }
  function levelOf(id) { var c = C(), it = c.accessories[id] || c.skins[id]; return (it && it.level) || LEGACY_LEVEL[id] || 0; }
  function unlockByLevel(silent) {
    var c = C(); if (!c) return [];
    var got = [];
    FREE.forEach(function (id) { if (!c.isUnlocked(id)) c.unlock(id); });
    Object.keys(c.accessories).concat(Object.keys(c.skins)).forEach(function (id) {
      var lv = levelOf(id);
      if (lv && careLevel() >= lv && !c.isUnlocked(id)) { c.unlock(id); got.push(id); }
    });
    if (got.length && !silent) toast('解锁了新衣服 ' + got.map(function (id) { return (ZH[id] || [''])[0].charAt(0) === '#' || (ZH[id] || [''])[0].indexOf('gradient') >= 0 ? '🎨' : (ZH[id] || ['✨'])[0]; }).join(' '));
    return got;
  }

  // ---- UI ------------------------------------------------------------------------------------------
  var css = [
    '[data-v4-crown-toggle]{display:none!important}',
    '.wd-btn{position:fixed;right:14px;top:calc(14px + env(safe-area-inset-top,0px));z-index:31;border:1px solid rgba(255,200,230,.4);border-radius:999px;padding:8px 12px;background:rgba(10,26,43,.62);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:#ffe9f4;font:700 11px/1 -apple-system,system-ui,sans-serif;box-shadow:0 8px 20px rgba(0,0,0,.18);cursor:pointer}',
    '.wd-sheet{position:fixed;left:0;right:0;bottom:0;z-index:70;max-height:64vh;display:flex;flex-direction:column;border-radius:22px 22px 0 0;background:rgba(250,247,255,.97);box-shadow:0 -12px 40px rgba(0,0,0,.3);transform:translateY(105%);transition:transform .32s cubic-bezier(.2,.9,.25,1);padding-bottom:env(safe-area-inset-bottom,0px);color:#2c2340;font-family:-apple-system,system-ui,sans-serif}',
    '.wd-sheet.open{transform:none}',
    '.wd-head{display:flex;align-items:center;gap:10px;padding:12px 16px 6px}',
    '.wd-head b{font-size:17px}',
    '.wd-head .lv{margin-left:auto;font:700 12px -apple-system,system-ui;color:#7a5fc0;background:#efe8ff;padding:5px 9px;border-radius:999px}',
    '.wd-x{border:0;background:#ece6f7;width:30px;height:30px;border-radius:50%;font:16px/1 system-ui;color:#5a4a7a}',
    '.wd-next{padding:0 16px 8px;font:600 11px -apple-system,system-ui;color:#8a7aa8}',
    '.wd-tabs{display:flex;gap:6px;padding:0 16px 8px}',
    '.wd-tab{flex:1;border:0;border-radius:12px;padding:8px;background:#ece6f7;color:#5a4a7a;font:700 13px -apple-system,system-ui}',
    '.wd-tab.on{background:#8f6bff;color:#fff}',
    '.wd-body{overflow-y:auto;padding:0 12px 14px;-webkit-overflow-scrolling:touch}',
    '.wd-group{font:700 11px -apple-system,system-ui;color:#9a8cb8;margin:8px 4px 6px;text-transform:uppercase;letter-spacing:.06em}',
    '.wd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}',
    '.wd-card{position:relative;border:2px solid transparent;border-radius:16px;background:#fff;padding:10px 6px 8px;display:flex;flex-direction:column;align-items:center;gap:4px;box-shadow:0 2px 8px rgba(80,50,140,.08);cursor:pointer}',
    '.wd-card.on{border-color:#8f6bff;background:#f6f1ff}',
    '.wd-card.locked .ic{filter:grayscale(.85) opacity(.55)}',
    '.wd-card .ic{font:34px/1 system-ui;height:40px;display:flex;align-items:center}',
    '.wd-card .sw{width:38px;height:38px;border-radius:50%;box-shadow:inset 0 -4px 8px rgba(0,0,0,.15),0 2px 6px rgba(0,0,0,.12)}',
    '.wd-card .nm{font:700 12px -apple-system,system-ui;color:#2c2340}',
    '.wd-card .st{font:600 10px -apple-system,system-ui;color:#8a7aa8}',
    '.wd-card.on .st{color:#8f6bff}',
    '.wd-card.locked .st{color:#c08a3a}',
    '.wd-card .try{position:absolute;top:6px;right:6px;font:700 9px -apple-system,system-ui;background:#ffe9b0;color:#8a5a10;border-radius:999px;padding:2px 6px}',
    '.wd-reset{display:block;width:100%;margin:2px 0 10px;padding:10px;border:0;border-radius:14px;background:#efe8ff;color:#6a4fd0;font:800 13px -apple-system,system-ui,sans-serif}',
    '.wd-reset:disabled{opacity:.45}',
    '.wd-toast{position:fixed;left:50%;top:22%;transform:translate(-50%,-50%);z-index:80;padding:11px 16px;border-radius:16px;background:rgba(255,255,255,.95);color:#3a2a5a;font:800 14px -apple-system,system-ui,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.25);pointer-events:none;animation:wdT 2.4s ease forwards}',
    '@keyframes wdT{0%{opacity:0;transform:translate(-50%,-40%)}12%{opacity:1;transform:translate(-50%,-50%)}80%{opacity:1}100%{opacity:0}}'
  ].join('\n');
  var btn, sheet, body, tab = 'acc', tryTimer = 0;
  function toast(t) { var el = document.createElement('div'); el.className = 'wd-toast'; el.textContent = t; document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2500); }
  function build() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    btn = document.createElement('button'); btn.type = 'button'; btn.className = 'wd-btn'; btn.textContent = '👗'; btn.setAttribute('aria-label', 'Wardrobe');
    btn.addEventListener('pointerdown', function (e) { e.stopPropagation(); }, true);
    btn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); open(); });
    document.body.appendChild(btn);
    sheet = document.createElement('div'); sheet.className = 'wd-sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'Wardrobe');
    sheet.innerHTML = '<div class="wd-head"><b>👗 衣柜</b><span class="lv"></span><button class="wd-x" aria-label="Close">✕</button></div><div class="wd-next"></div>' +
      '<div class="wd-tabs"><button class="wd-tab on" data-t="acc">饰品</button><button class="wd-tab" data-t="skin">皮肤</button></div><div class="wd-body"></div>';
    ['pointerdown', 'touchstart', 'click'].forEach(function (ev) { sheet.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    sheet.querySelector('.wd-x').addEventListener('click', close);
    sheet.querySelectorAll('.wd-tab').forEach(function (t) { t.addEventListener('click', function () { tab = t.dataset.t; render(); }); });
    body = sheet.querySelector('.wd-body');
    document.body.appendChild(sheet);
    if (C() && C().onChange) C().onChange(function () { if (sheet.classList.contains('open')) render(); });
  }
  function open() { unlockByLevel(); render(); sheet.classList.add('open'); }
  function close() { sheet.classList.remove('open'); }
  function card(id, kind) {
    var c = C(), st = c.getState(), item = kind === 'skin' ? c.skins[id] : c.accessories[id], zh = ZH[id] || ['✨', item.label];
    var unlocked = c.isUnlocked(id), lv = levelOf(id);
    var on = kind === 'skin' ? st.equippedSkin === id : st.equippedBySlot[item.slot] === id;
    var el = document.createElement('div'); el.className = 'wd-card' + (on ? ' on' : '') + (unlocked ? '' : ' locked');
    var icon = kind === 'skin' ? '<div class="ic"><div class="sw" style="background:' + zh[0] + '"></div></div>' : '<div class="ic">' + zh[0] + '</div>';
    el.innerHTML = icon + '<div class="nm">' + zh[1] + '</div><div class="st">' + (on ? '✓ 穿着' : unlocked ? '点一下穿上' : '🔒 ' + (lv ? '亲密度 Lv ' + lv : item.requirement)) + '</div>' + (unlocked ? '' : '<span class="try">试穿</span>');
    el.addEventListener('click', function () {
      if (!unlocked) return tryOn(id, kind);
      if (kind === 'skin') c.equipSkin(id);
      else if (on) c.clearSlot(item.slot); else c.equipAccessory(id);
      var E = window.__v6EyeHighlight; if (E) E.setExpression('happy', 1800);
      var M = window.__octoMouth; if (M && M.play) M.play('giggle', 100);
      render();
    });
    return el;
  }
  function tryOn(id, kind) {
    var c = C(), model = window.__minestCosmeticsModel, T = window.__minestCosmeticsTHREE;
    if (!model || !T || !c.previewModel) { toast('🔒 亲密度 Lv ' + levelOf(id) + ' 解锁'); return; }
    var st = c.getState();
    if (kind === 'skin') { st.equippedSkin = id; st.renderMode = id === 'default_purple' ? 'source' : 'tinted'; }
    else st.equippedBySlot[c.accessories[id].slot] = id;
    clearTimeout(tryTimer);
    c.previewModel(model, T, st);
    toast('试穿 5 秒 · 亲密度 Lv ' + levelOf(id) + ' 解锁 ' + (ZH[id] || ['', ''])[1]);
    var E = window.__v6EyeHighlight; if (E) E.setExpression('surprised', 1200);
    tryTimer = setTimeout(function () { c.applyModel(model, T); }, 5000);
  }
  function render() {
    var c = C(); if (!c || !body) return;
    var lv = careLevel();
    sheet.querySelector('.lv').textContent = '💜 亲密度 Lv ' + lv;
    var all = Object.keys(c.accessories).concat(Object.keys(c.skins)).filter(function (id) { return !c.isUnlocked(id) && levelOf(id) > lv; })
      .sort(function (a, b) { return levelOf(a) - levelOf(b); });
    sheet.querySelector('.wd-next').textContent = all.length ? '下一个：' + (ZH[all[0]] || ['', all[0]])[1] + '（Lv ' + levelOf(all[0]) + '）· 喂食、洗澡、玩耍、抚摸都能涨亲密度' : '全部解锁啦 ✨';
    sheet.querySelectorAll('.wd-tab').forEach(function (t) { t.classList.toggle('on', t.dataset.t === tab); });
    body.innerHTML = '';
    if (tab === 'skin') {
      // 44.3: back to the original look in one tap (skin + colour adjustments)
      var st0 = c.getState(), isDefault = st0.equippedSkin === 'default_purple' && st0.renderMode !== 'tinted';
      var reset = document.createElement('button'); reset.type = 'button'; reset.className = 'wd-reset'; reset.textContent = '↺ 恢复默认皮肤';
      reset.disabled = isDefault;
      reset.addEventListener('click', function () {
        if (c.setSkinAdjustments) c.setSkinAdjustments({ hue: 0, saturation: 1, brightness: 1 });
        c.equipSkin('default_purple'); if (c.setRenderMode) c.setRenderMode('source');
        var E = window.__v6EyeHighlight; if (E) E.setExpression('happy', 1500);
        toast('已恢复默认皮肤 💜'); render();
      });
      body.appendChild(reset);
      var g = document.createElement('div'); g.className = 'wd-grid';
      Object.keys(c.skins).forEach(function (id) { g.appendChild(card(id, 'skin')); });
      body.appendChild(g);
    } else {
      ['head', 'hair', 'face', 'neck'].forEach(function (slot) {
        var ids = Object.keys(c.accessories).filter(function (id) { return c.accessories[id].slot === slot; });
        if (!ids.length) return;
        var h = document.createElement('div'); h.className = 'wd-group'; h.textContent = SLOT_ZH[slot]; body.appendChild(h);
        var g2 = document.createElement('div'); g2.className = 'wd-grid';
        ids.forEach(function (id) { g2.appendChild(card(id, 'acc')); });
        body.appendChild(g2);
      });
    }
  }
  (function wait(n) {
    if (C() && document.body) { build(); unlockByLevel(true); setInterval(function () { unlockByLevel(false); }, 3000); return; }
    if (n < 400) setTimeout(function () { wait(n + 1); }, 100);
  })(0);
  window.__octoWardrobe = { open: function () { open(); }, close: close, unlockByLevel: unlockByLevel };
})();
