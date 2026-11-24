/* Minest · Disney World Imagineer Dream Builder (`minest-imagineer-park.js`).
 * Turns My World's live Walt Disney World (`theme-park-island`) into an interactive dream canvas where kids & families can:
 *  1. Place 3D animated models (castles, princesses, dinosaurs, unicorns, rockets, carousels, ferris wheels, treasure chests…)
 *     anywhere across Magic Kingdom, Fantasyland, Tomorrowland, Star Wars Batuu, EPCOT, Hollywood Studios & Pandora!
 *  2. Place Immersive IP World Portals (8 built-in IP worlds + any custom Dream Workshop creation + 1-sentence instant AI/Voice IP creator!)
 *     right onto the park plaza, walk up to the glowing miniature pavilion, and step straight inside the 3D IP world!
 *  3. Sync all placed creations durability across devices via `MinestHomeStore` (`sh:tp:placed`). */
(function (root) {
  'use strict';

  var STORE_KEY = 'sh:tp:placed';
  var WORK_PFX = 'sh:dw:work:';
  var S = root.MinestHomeStore;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var uid = function (p) { return (p || 'tp') + Math.random().toString(36).slice(2, 9); };

  function sget(k) {
    if (S) { var v = S.get(k); if (v != null) return v; }
    try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; }
  }
  function sset(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
    if (S) S.set(k, v);
  }
  function skeys(pfx) {
    var set = {};
    if (S && S.keys) { try { S.keys(pfx).forEach(function (k) { set[k] = 1; }); } catch (e) {} }
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(pfx) === 0) set[k] = 1;
      }
    } catch (e) {}
    return Object.keys(set);
  }

  /* 7 Golden Dream Plots across Disney World where kids can teleport and build immediately! */
  var DREAM_PLOTS = [
    { id: 'castle_hub', icon: '🏰', name: '星光城堡中央广场', desc: '正对童话城堡中轴线的黄金展位', p: [192.5, 40, 224], t: [192.5, 46, 176] },
    { id: 'main_street', icon: '🎈', name: '梦幻主街迎宾广场', desc: '一进乐园就能看见你的作品', p: [192.5, 40, 312], t: [192.5, 45, 266] },
    { id: 'fantasyland', icon: '🎠', name: '梦幻世界童话花园', desc: '旋转木马与小小世界旁的童话空地', p: [176, 40, 126], t: [192.5, 45, 114] },
    { id: 'tomorrowland', icon: '🚀', name: '明日世界星际广场', desc: '太空山与轨道飞行器前的科幻展区', p: [252, 40, 206], t: [270, 46, 194] },
    { id: 'star_wars', icon: '🛸', name: '星球大战千年隼停机坪', desc: '巴图星黑尖塔前哨站宽阔广场', p: [126, 40, 96], t: [116, 46, 78] },
    { id: 'epcot', icon: '🌐', name: '奥兰多 EPCOT 未来广场', desc: '银色巨球未来地球前的世界橱窗', p: [438, 40, 242], t: [438, 54, 196] },
    { id: 'hollywood', icon: '🎬', name: '好莱坞星光大道广场', desc: '中国大剧院与玩具总动员园区旁', p: [414, 40, 434], t: [424, 52, 396] },
    { id: 'pandora', icon: '🌿', name: '阿凡达潘多拉秘境', desc: '动物王国生命之树与悬浮山瀑布前', p: [176, 40, 476], t: [148, 52, 442] }
  ];

  /* Curated Standalone 3D Models kids love placing in Disney World */
  var PARK_MODELS = [
    { kind: 'castle', icon: '🏰', name: '梦幻童话城堡', color: '#fce7f3', hello: '欢迎来到我建造的童话城堡！愿你美梦成真！', scale: 1.0 },
    { kind: 'carousel', icon: '🎠', name: '皇家旋转木马', color: '#ec4899', hello: '叮叮当！旋转木马为你欢快转起来啦！', scale: 1.05 },
    { kind: 'ferris', icon: '🎡', name: '彩虹摩天轮', color: '#38bdf8', hello: '坐上彩虹摩天轮，俯瞰整座迪士尼乐园吧！', scale: 1.1 },
    { kind: 'princess', icon: '👑', name: '童话公主迎宾', color: '#f472b6', hello: '你好呀小王子小公主！欢迎来到快乐梦想乐园！', scale: 1.25 },
    { kind: 'wizard', icon: '🧙', name: '奇幻小魔法师', color: '#7c3aed', hello: '挥动魔杖，为你变出漫天星光与烟花！', scale: 1.25 },
    { kind: 'dino', icon: '🦕', name: '快乐小恐龙', color: '#22c55e', hello: '嗷呜～我是最喜欢和小朋友玩的小暴龙！', scale: 1.35 },
    { kind: 'unicorn', icon: '🦄', name: '彩虹独角兽', color: '#fdf4ff', hello: '咴咴～骑上彩虹独角兽一起去云端探险吧！', scale: 1.3 },
    { kind: 'astronaut', icon: '🧑‍🚀', name: '星际宇航员', color: '#f8fafc', hello: '飞向宇宙，浩瀚无垠！欢迎来到太空基地！', scale: 1.25 },
    { kind: 'robot', icon: '🤖', name: '聪明机器人伙伴', color: '#38bdf8', hello: '哔哔啵啵！检测到一百分的快乐微笑！', scale: 1.3 },
    { kind: 'rocket', icon: '🚀', name: '银河探索号火箭', color: '#ef4444', hello: '三、二、一，火箭点火发射庆典礼花！', scale: 1.15 },
    { kind: 'crystal', icon: '💎', name: '极光魔法水晶', color: '#38bdf8', hello: '叮！冰雪魔法水晶为你绽放奇幻光芒！', scale: 1.2 },
    { kind: 'rainbow', icon: '🌈', name: '七彩迎宾拱门', color: '#f472b6', hello: '穿过这道七彩彩虹门，好运和快乐永远伴随你！', scale: 1.1 },
    { kind: 'mushroom', icon: '🍄', name: '精灵蘑菇小屋', color: '#ef4444', hello: '咚咚咚！森林小精灵邀请你来蘑菇屋做客！', scale: 1.15 },
    { kind: 'treasure', icon: '🎁', name: '黄金惊喜宝箱', color: '#92400e', hello: '哇！宝箱打开啦，满满都是闪耀的宝石和快乐！', scale: 1.3 },
    { kind: 'firework', icon: '🎆', name: '庆典烟花发射台', color: '#ec4899', hello: '嘭！五彩斑斓的烟花在乐园夜空绽放啦！', scale: 1.25 },
    { kind: 'book', icon: '📖', name: '巨型立体魔法书', color: '#2f5d8a', hello: '魔法故事书翻开了奇妙的新篇章！', scale: 1.1 },
    { kind: 'musicbox', icon: '🎶', name: '华尔兹八音盒', color: '#be185d', hello: '听，八音盒的小舞者正在为你跳华尔兹呢！', scale: 1.15 },
    { kind: 'windmill', icon: '🌬️', name: '童话大风车', color: '#e9dcc0', hello: '微风吹过，大风车带着满满的祝福转动起来！', scale: 1.0 },
    { kind: 'star', icon: '⭐', name: '漂浮许愿星', color: '#fde047', hello: '对着闪亮的许愿星许个愿吧，一定会实现的！', scale: 1.25 },
    { kind: 'sprout', icon: '🌱', name: '奇思妙想魔法花', color: '#34d399', hello: '你的每一个好主意，都会在这里开花结果！', scale: 1.25 }
  ];

  var API = null;
  var placed = [];         // persisted array of { id, type: 'world'|'model', workId?, kind, title, badge, color, icon, hello, x, y, z, ry, s }
  var meshMap = {};        // id -> { group, portalRing?, innerIcon?, bobBase?, item }
  var holder = null;
  var drawerOpen = false, drawerTab = 'worlds';
  var placing = null;      // active placement spec + preview group
  var selectedId = null;
  var clock = 0;
  var raycaster = null, ndc = null;
  var speechBubbleTimer = 0;

  function loadPlaced() {
    var arr = sget(STORE_KEY);
    if (!Array.isArray(arr)) arr = [];
    placed = arr.filter(function (x) { return x && x.id && isFinite(x.x) && isFinite(x.z); });
  }
  function savePlaced() {
    sset(STORE_KEY, placed);
  }

  /* Fetch all user Dream Workshop works + 8 built-in IP worlds */
  function allIPWorlds() {
    var userWorks = skeys(WORK_PFX).map(function (k) { return sget(k); })
      .filter(function (w) { return w && w.id && !w.deleted; })
      .sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); });
    var builtIns = (root.DWIPWorlds && root.DWIPWorlds.list) || [];
    var seen = {};
    var list = [];
    userWorks.forEach(function (w) {
      seen[w.id] = 1;
      var ip = w.ipTheme || {};
      var leadKind = pickPreviewKind(w);
      list.push({
        workId: w.id,
        title: w.title || '我的奇想世界',
        icon: ip.icon || '🎬',
        badge: ip.badge || '我的创作',
        color: ip.color || '#fbbf24',
        note: (w.imagineer && w.imagineer.summary ? w.imagineer.summary.slice(0, 42) : ((w.objects || []).length + ' 个互动模型 · 点击放置到乐园')),
        previewKind: leadKind,
        isUser: true
      });
    });
    builtIns.forEach(function (t) {
      if (seen[t.id]) return;
      list.push({
        workId: t.id,
        title: t.name,
        icon: t.icon,
        badge: t.badge || '热门 IP',
        color: t.color || '#38bdf8',
        note: t.note,
        previewKind: previewKindForTemplate(t.id),
        isBuiltIn: true
      });
    });
    return list;
  }

  function previewKindForTemplate(tid) {
    return ({
      ice_kingdom: 'castle',
      wizard_school: 'wizard',
      space_station: 'rocket',
      dino_valley: 'dino',
      unicorn_island: 'unicorn',
      fairy_cruise: 'boat',
      robot_lab: 'robot',
      castle_concert: 'castle'
    })[tid] || 'castle';
  }
  function pickPreviewKind(w) {
    if (!w || !Array.isArray(w.objects)) return 'castle';
    var pri = ['castle', 'rocket', 'dino', 'unicorn', 'carousel', 'ferris', 'princess', 'wizard', 'astronaut', 'robot', 'book', 'musicbox', 'crystal'];
    for (var i = 0; i < pri.length; i++) {
      if (w.objects.some(function (o) { return o.kind === pri[i]; })) return pri[i];
    }
    return (w.objects[0] && w.objects[0].kind) || 'castle';
  }

  /* Ensure built-in IP world is materialized in store when placed so user can also edit it anytime */
  function ensureWorkStored(workId) {
    var existing = sget(WORK_PFX + workId);
    if (existing && !existing.deleted) return existing;
    var TP = root.DWTemplates;
    if (TP && TP.list) {
      var tpl = TP.list.filter(function (t) { return t.id === workId; })[0];
      if (tpl) {
        var w = tpl.make();
        w.id = workId; w.created = Date.now(); w.updated = Date.now(); w.shelf = true;
        sset(WORK_PFX + w.id, w);
        return w;
      }
    }
    return null;
  }

  /* ---------------------------------------------------------------- 3D Mesh Builders for Placed Items in Disney World */
  function makeLabelSprite(T, icon, title, sub, borderCol) {
    var cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
    var cx = cv.getContext('2d');
    cx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    cx.beginPath();
    if (cx.roundRect) cx.roundRect(12, 12, 488, 104, 52);
    else cx.rect(12, 12, 488, 104);
    cx.fill();
    cx.strokeStyle = borderCol || '#fbbf24';
    cx.lineWidth = 5;
    cx.stroke();
    cx.fillStyle = '#fef08a';
    cx.font = '800 34px -apple-system,"PingFang SC",sans-serif';
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';
    cx.fillText((icon ? icon + ' ' : '') + String(title || '').slice(0, 14), 256, sub ? 48 : 64);
    if (sub) {
      cx.fillStyle = '#bae6fd';
      cx.font = '700 22px -apple-system,"PingFang SC",sans-serif';
      cx.fillText(sub, 256, 86);
    }
    var tex = new T.CanvasTexture(cv);
    if (T.sRGBEncoding !== undefined) tex.encoding = T.sRGBEncoding;
    var sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.set(2.75, 0.68, 1);
    return sp;
  }

  function buildPlacedNode(item, isGhost) {
    var T = API.THREE, g = new T.Group();
    var col = item.color || '#fbbf24';
    var scale = item.s || 1;
    var portalRing = null, centerShowcase = null;

    if (item.type === 'world') {
      /* Gorgeous 3D Disney IP World Portal Pavilion! */
      var baseMat = new T.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5, metalness: 0.3 });
      var goldMat = new T.MeshStandardMaterial({ color: '#fbbf24', roughness: 0.25, metalness: 0.7 });
      var accentMat = new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.45, roughness: 0.3 });

      var p1 = new T.Mesh(new T.CylinderGeometry(2.7, 3.0, 0.28, 32), baseMat); p1.position.y = 0.14; g.add(p1);
      var p2 = new T.Mesh(new T.CylinderGeometry(2.55, 2.65, 0.1, 32), goldMat); p2.position.y = 0.31; g.add(p2);

      /* Glowing Starlight Archway */
      var arch = new T.Mesh(new T.TorusGeometry(2.15, 0.14, 14, 42, Math.PI), goldMat);
      arch.position.set(0, 0.35, -0.35); g.add(arch);
      portalRing = new T.Mesh(new T.TorusGeometry(1.92, 0.08, 12, 40), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.88 }));
      portalRing.position.set(0, 2.1, -0.35); g.add(portalRing);

      var vortex = new T.Mesh(new T.CircleGeometry(1.85, 36), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.22, side: T.DoubleSide, depthWrite: false }));
      vortex.position.set(0, 2.1, -0.36); g.add(vortex);

      /* Miniature 3D IP Landmark Showcase standing on the Pavilion Pedestal! */
      if (root.DWModels) {
        centerShowcase = root.DWModels.build({ kind: item.kind || 'castle', color: col });
        var box = new T.Box3().setFromObject(centerShowcase), sz = box.getSize(new T.Vector3());
        var fit = 2.6 / Math.max(sz.x, sz.y, sz.z, 1);
        centerShowcase.scale.setScalar(fit);
        centerShowcase.position.set(0, 0.36, 0.15);
        g.add(centerShowcase);
      }

      if (!isGhost) {
        var lbl = makeLabelSprite(T, item.icon || '🌟', item.title, '✨ 走近按 E 或点击 · 走进沉浸世界', col);
        lbl.position.set(0, 4.55, 0);
        g.add(lbl);
        var ptLight = new T.PointLight(col, 1.1, 12, 2);
        ptLight.position.set(0, 2.6, 0.8);
        g.add(ptLight);
      }
    } else {
      /* Standalone 3D Animated Park Model */
      var pedestal = new T.Mesh(new T.CylinderGeometry(1.25, 1.4, 0.16, 24), new T.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.6 }));
      pedestal.position.y = 0.08; g.add(pedestal);
      var trim = new T.Mesh(new T.TorusGeometry(1.28, 0.04, 8, 28), new T.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.6, roughness: 0.3 }));
      trim.rotation.x = Math.PI / 2; trim.position.y = 0.16; g.add(trim);

      if (root.DWModels) {
        centerShowcase = root.DWModels.build({ kind: item.kind || 'castle', color: item.color, text: item.title });
        centerShowcase.position.y = 0.16;
        g.add(centerShowcase);
      }
      if (!isGhost) {
        var box2 = new T.Box3().setFromObject(g), topY = Math.max(2.6, box2.max.y + 0.65);
        var lbl2 = makeLabelSprite(T, item.icon || '✨', item.title, '👆 点击互动', col);
        lbl2.position.set(0, topY, 0);
        g.add(lbl2);
      }
    }

    if (isGhost) {
      g.traverse(function (m) {
        if (m.isMesh && m.material) {
          m.material = m.material.clone();
          m.material.transparent = true;
          m.material.opacity = Math.min(m.material.opacity || 1, 0.72);
        }
      });
      var ghostRing = new T.Mesh(new T.RingGeometry(2.1, 2.45, 48), new T.MeshBasicMaterial({ color: '#fde047', side: T.DoubleSide, transparent: true, opacity: 0.92, depthWrite: false }));
      ghostRing.rotation.x = -Math.PI / 2;
      ghostRing.position.y = 0.06;
      g.add(ghostRing);
    }

    g.position.set(item.x || 0, item.y || 40, item.z || 0);
    g.rotation.y = item.ry || 0;
    g.scale.setScalar(scale);
    g.userData.tpItemId = item.id;
    return { group: g, portalRing: portalRing, showcase: centerShowcase, item: item, jump: 0 };
  }

  function syncSceneMeshes() {
    if (!API || !holder) return;
    while (holder.children.length) holder.remove(holder.children[0]);
    meshMap = {};
    placed.forEach(function (it) {
      var node = buildPlacedNode(it, false);
      holder.add(node.group);
      meshMap[it.id] = node;
    });
    syncParkInteractables();
    updateCountBadge();
  }

  /* Register placed items into Disney World's own proximity system (`props.interactables`) too! */
  function syncParkInteractables() {
    if (!API) return;
    var pr = API.getProps();
    if (!pr || !Array.isArray(pr.interactables)) return;
    pr.interactables = pr.interactables.filter(function (x) { return !x._imagineer; });
    placed.forEach(function (it) {
      pr.interactables.push({
        _imagineer: true,
        id: it.id,
        name: (it.type === 'world' ? '走进 IP 世界 · ' : '') + it.title,
        x: it.x,
        z: it.z,
        msg: it.hello || ('✨ 欢迎体验「' + it.title + '」！')
      });
    });
  }

  /* ---------------------------------------------------------------- Speaking & Celebration FX in Disney World */
  var burstList = [];
  function spawnMiniCelebration(x, y, z, color) {
    if (!API) return;
    var T = API.THREE, N = 56, pos = new Float32Array(N * 3), vels = [];
    for (var i = 0; i < N; i++) {
      var th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), sp = 2.2 + Math.random() * 3.6;
      vels.push([Math.sin(ph) * Math.cos(th) * sp, Math.abs(Math.cos(ph) * sp) + 2.2, Math.sin(ph) * Math.sin(th) * sp]);
    }
    var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    var mat = new T.PointsMaterial({ color: color || '#fbbf24', size: 0.28, transparent: true, opacity: 1, depthWrite: false, blending: T.AdditiveBlending });
    var pts = new T.Points(geo, mat); pts.position.set(x, y + 2.2, z); pts.frustumCulled = false;
    API.scene.add(pts);
    burstList.push({ pts: pts, geo: geo, mat: mat, vels: vels, age: 0, life: 1.5 });
    var portals = API.getPortals();
    if (portals && portals.playFanfare) portals.playFanfare();
  }

  function speakHello(text) {
    if (!text || !root.speechSynthesis) return;
    try {
      root.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(String(text));
      u.lang = 'zh-CN'; u.rate = 1.02; u.pitch = 1.1;
      root.speechSynthesis.speak(u);
    } catch (e) {}
  }

  function interactWithPlaced(it) {
    if (!it) return;
    if (it.type === 'world') {
      ensureWorkStored(it.workId);
      API.toast('🌟 正在穿越进入「' + it.title + '」沉浸式 IP 世界…');
      spawnMiniCelebration(it.x, it.y, it.z, it.color);
      setTimeout(function () {
        if (root.MinestPavilion && root.MinestPavilion.playWorld) {
          root.MinestPavilion.playWorld(it.workId);
        } else {
          location.href = '../dream-workshop/index.html?play=' + encodeURIComponent(it.workId) + '&from=park';
        }
      }, 240);
      return;
    }
    /* Standalone 3D Model interaction: joyful speech + jump + celebration sparkles (+ fireworks if firework/castle/crystal)! */
    var node = meshMap[it.id];
    if (node) node.jump = 1.0;
    spawnMiniCelebration(it.x, it.y, it.z, it.color);
    if (it.kind === 'firework' || it.kind === 'castle' || it.kind === 'rocket') {
      var pr = API.getProps(); if (pr && pr.triggerFireworks) pr.triggerFireworks();
    }
    var line = it.hello || ('你好呀！欢迎来到「' + it.title + '」！');
    speakHello(line);
    showSpeechBanner(it.icon || '✨', it.title, line);
  }

  function showSpeechBanner(icon, title, line) {
    var el = document.getElementById('mip-speech');
    if (!el) return;
    el.innerHTML = '<b>' + esc(icon) + ' ' + esc(title) + '</b><span>“' + esc(line) + '”</span>';
    el.classList.add('show');
    clearTimeout(speechBubbleTimer);
    speechBubbleTimer = setTimeout(function () { el.classList.remove('show'); }, 4200);
  }

  /* ---------------------------------------------------------------- Placement Mode on Disney World Ground */
  function frontSpot(dist) {
    var p = API.player, d = dist || 8.5;
    var tx = p.pos.x - Math.sin(p.yaw) * d;
    var tz = p.pos.z - Math.cos(p.yaw) * d;
    var w = API.getWorld();
    tx = Math.max(16, Math.min(w.W - 16, tx));
    tz = Math.max(16, Math.min(w.D - 16, tz));
    var ty = API.groundY(tx, tz, Math.floor(p.pos.y + 8));
    return { x: +tx.toFixed(2), y: ty, z: +tz.toFixed(2), ry: p.yaw };
  }

  function startPlacement(spec, movingExistingId) {
    closeDrawer();
    cancelPlacement(false);
    var spot = frontSpot(spec.type === 'world' ? 10 : 7.5);
    var item = {
      id: movingExistingId || uid('m'),
      type: spec.type || 'model',
      workId: spec.workId || '',
      kind: spec.kind || 'castle',
      title: spec.title || '奇想模型',
      badge: spec.badge || '',
      icon: spec.icon || '✨',
      color: spec.color || '#fbbf24',
      hello: spec.hello || ('欢迎来到「' + (spec.title || '梦想世界') + '」！'),
      x: spot.x, y: spot.y, z: spot.z,
      ry: spec.ry != null ? spec.ry : spot.ry,
      s: spec.s || spec.scale || 1.0
    };
    if (movingExistingId) {
      placed = placed.filter(function (x) { return x.id !== movingExistingId; });
      syncSceneMeshes();
    }
    var ghostNode = buildPlacedNode(item, true);
    API.scene.add(ghostNode.group);
    placing = { item: item, ghost: ghostNode };
    API.exitLock();
    renderPlaceBar();
    API.toast('👆 移动鼠标或点击地面选择位置，点「✅ 放在这里」完成建造！');
  }

  function confirmPlacement() {
    if (!placing) return;
    var it = placing.item;
    API.scene.remove(placing.ghost.group);
    placing = null;
    if (it.type === 'world' && it.workId) ensureWorkStored(it.workId);
    placed.push(it);
    savePlaced();
    syncSceneMeshes();
    selectedId = it.id;
    renderPlaceBar();
    renderSelectedBar();
    spawnMiniCelebration(it.x, it.y, it.z, it.color);
    API.toast(it.type === 'world'
      ? ('🎉 「' + it.title + '」已建在迪士尼乐园！走近或点「🌟 走进世界」即可沉浸体验！')
      : ('🎉 「' + it.title + '」已摆放到乐园！点它试试互动吧！'));
  }

  function cancelPlacement(notify) {
    if (!placing) return;
    API.scene.remove(placing.ghost.group);
    placing = null;
    renderPlaceBar();
    if (notify) API.toast('已取消放置');
  }

  /* Raycast ground point under screen coordinates in Disney World */
  function groundPointFromClient(cx, cy) {
    if (!API) return null;
    var rect = API.canvas.getBoundingClientRect();
    ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, API.camera);
    var dir = raycaster.ray.direction, orig = raycaster.ray.origin;
    if (dir.y >= -0.02) return null;
    var basePlaneY = API.player.pos.y;
    var t = (basePlaneY - orig.y) / dir.y;
    if (t < 1.5 || t > 85) return null;
    var hitX = orig.x + dir.x * t, hitZ = orig.z + dir.z * t;
    var w = API.getWorld();
    hitX = Math.max(14, Math.min(w.W - 14, hitX));
    hitZ = Math.max(14, Math.min(w.D - 14, hitZ));
    var gy = API.groundY(hitX, hitZ, Math.floor(basePlaneY + 12));
    return { x: +hitX.toFixed(2), y: gy, z: +hitZ.toFixed(2) };
  }

  function pickPlacedFromClient(cx, cy) {
    if (!API || !holder || !holder.children.length) return null;
    var rect = API.canvas.getBoundingClientRect();
    ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, API.camera);
    var hits = raycaster.intersectObjects(holder.children, true);
    if (!hits.length) return null;
    var obj = hits[0].object;
    while (obj && !obj.userData.tpItemId) obj = obj.parent;
    return obj ? obj.userData.tpItemId : null;
  }

  /* ---------------------------------------------------------------- UI: Toybox Drawer + Floating Placement & Selection Bars */
  var inlineIdea = '';
  function injectUI() {
    var css = document.createElement('style');
    css.textContent = [
      '#mip-fab{position:fixed;right:14px;bottom:12px;z-index:35;border:1.5px solid rgba(255,255,255,.4);border-radius:999px;padding:10px 18px;background:linear-gradient(135deg,#fbbf24,#ec4899,#8b5cf6);color:#fff;font:900 14px/1 -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;cursor:pointer;box-shadow:0 8px 26px rgba(236,72,153,.5);display:flex;align-items:center;gap:7px;pointer-events:auto}',
      '#mip-fab b{background:rgba(15,23,42,.55);padding:2px 7px;border-radius:999px;font-size:11.5px}',
      '@media (max-width:760px){#mip-fab{bottom:14px;right:10px;padding:9px 14px;font-size:12.5px}}',
      '#mip-drawer{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);width:min(920px,96vw);max-height:72dvh;z-index:85;background:linear-gradient(170deg,rgba(15,23,42,.96),rgba(30,27,75,.96));border:1.5px solid rgba(251,191,36,.6);border-radius:22px;box-shadow:0 20px 60px rgba(0,0,0,.65);backdrop-filter:blur(14px);display:none;flex-direction:column;overflow:hidden;pointer-events:auto;color:#f8fafc}',
      '#mip-drawer.open{display:flex;animation:mipUp .22s ease}',
      '@keyframes mipUp{from{opacity:0;transform:translate(-50%,20px)}to{opacity:1;transform:translate(-50%,0)}}',
      '.mip-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.12);flex-shrink:0}',
      '.mip-hd h3{margin:0;font-size:15.5px;color:#fde68a;display:flex;align-items:center;gap:8px}',
      '.mip-tabs{display:flex;gap:6px;flex-wrap:wrap;padding:8px 14px;border-bottom:1px solid rgba(255,255,255,.1);flex-shrink:0}',
      '.mip-tabs button{flex:1 1 auto;border:1px solid rgba(255,255,255,.16);background:rgba(30,41,59,.85);color:#cbd5e1;border-radius:999px;padding:7px 12px;font:800 12.5px/1.1 -apple-system,"PingFang SC",sans-serif;cursor:pointer;white-space:nowrap;text-align:center}',
      '.mip-tabs button.on{background:linear-gradient(135deg,#fbbf24,#f97316);color:#1e1204;border-color:transparent}',
      '.mip-body{padding:12px 16px 18px;overflow-y:auto;flex:1}',
      '.mip-ai{background:linear-gradient(145deg,rgba(56,189,248,.14),rgba(236,72,153,.14));border:1.5px solid rgba(56,189,248,.45);border-radius:16px;padding:11px 13px;margin-bottom:12px}',
      '.mip-ai-row{display:flex;gap:8px;margin-top:6px;flex-wrap:wrap}',
      '.mip-ai-row input{flex:1;min-width:180px;background:#0f172a;border:1px solid rgba(255,255,255,.2);border-radius:11px;padding:9px 12px;color:#fff;font-size:13.5px}',
      '.mip-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}',
      '.mip-chip{border:1px solid rgba(255,255,255,.16);background:rgba(15,23,42,.75);color:#e2e8f0;border-radius:999px;padding:4px 10px;font-size:11.5px;cursor:pointer}',
      '.mip-chip:hover{border-color:#fbbf24;color:#fde68a}',
      '.mip-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(205px,1fr));gap:9px}',
      '.mip-mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(122px,1fr));gap:8px}',
      '.mip-card{background:rgba(15,23,42,.82);border:1.5px solid rgba(255,255,255,.14);border-radius:14px;padding:11px;display:flex;flex-direction:column;gap:5px;transition:all .14s}',
      '.mip-card:hover{border-color:#fbbf24;transform:translateY(-2px)}',
      '.mip-card-top{display:flex;justify-content:space-between;align-items:center;gap:6px}',
      '.mip-card-ic{font-size:26px}',
      '.mip-card-bdg{font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:999px;background:rgba(255,255,255,.08)}',
      '.mip-card b{font-size:14px;color:#fff}',
      '.mip-card small{font-size:11.5px;color:#94a3b8;line-height:1.4}',
      '.mip-card-btns{display:flex;gap:6px;margin-top:auto;padding-top:4px}',
      '.mip-mbtn{background:rgba(15,23,42,.82);border:1.5px solid rgba(255,255,255,.14);border-radius:14px;padding:10px 6px;display:flex;flex-direction:column;align-items:center;gap:4px;color:#fff;cursor:pointer;transition:all .12s}',
      '.mip-mbtn:hover{border-color:#fbbf24;transform:translateY(-2px)}',
      '.mip-mbtn span{font-size:28px}',
      '.mip-mbtn b{font-size:12.5px}',
      '#mip-placebar{position:fixed;left:50%;bottom:64px;transform:translateX(-50%);z-index:55;display:none;align-items:center;gap:7px;flex-wrap:wrap;justify-content:center;background:rgba(15,23,42,.95);border:2px solid #fbbf24;border-radius:999px;padding:8px 14px;box-shadow:0 12px 36px rgba(0,0,0,.6);pointer-events:auto;max-width:96vw}',
      '#mip-selbar{position:fixed;left:50%;bottom:112px;transform:translateX(-50%);z-index:55;display:none;align-items:center;gap:7px;flex-wrap:wrap;justify-content:center;background:rgba(15,23,42,.95);border:2px solid #fbbf24;border-radius:999px;padding:7px 13px;box-shadow:0 12px 36px rgba(0,0,0,.6);pointer-events:auto;max-width:96vw}',
      '#mip-placebar.on,#mip-selbar.on{display:flex}',
      'body.mip-placing #tp-action-prompt{display:none!important}',
      '#mip-placebar b,#mip-selbar b{font-size:13px;color:#fde68a;padding:0 6px}',
      '#mip-speech{position:fixed;left:50%;top:62px;transform:translate(-50%,-12px);opacity:0;transition:.25s;z-index:60;background:rgba(15,23,42,.94);border:2px solid #f472b6;border-radius:18px;padding:10px 18px;display:flex;flex-direction:column;align-items:center;gap:3px;pointer-events:none;box-shadow:0 10px 30px rgba(0,0,0,.45);max-width:90vw;text-align:center}',
      '#mip-speech.show{opacity:1;transform:translate(-50%,0)}',
      '#mip-speech b{font-size:13px;color:#fde68a}',
      '#mip-speech span{font-size:14.5px;font-weight:700;color:#fff}'
    ].join('\n');
    document.head.appendChild(css);

    var fab = document.createElement('button');
    fab.type = 'button'; fab.id = 'mip-fab';
    fab.innerHTML = '✨ 放模型 · 造梦 <b id="mip-cnt">0</b>';
    fab.onclick = function (e) { e.stopPropagation(); toggleDrawer(); };
    document.body.appendChild(fab);

    var dr = document.createElement('div');
    dr.id = 'mip-drawer';
    dr.addEventListener('mousedown', function (e) { e.stopPropagation(); });
    dr.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true });
    document.body.appendChild(dr);

    var pb = document.createElement('div'); pb.id = 'mip-placebar';
    pb.addEventListener('mousedown', function (e) { e.stopPropagation(); });
    document.body.appendChild(pb);

    var sb = document.createElement('div'); sb.id = 'mip-selbar';
    sb.addEventListener('mousedown', function (e) { e.stopPropagation(); });
    document.body.appendChild(sb);

    var sp = document.createElement('div'); sp.id = 'mip-speech';
    document.body.appendChild(sp);
  }

  function updateCountBadge() {
    var b = document.getElementById('mip-cnt');
    if (b) b.textContent = String(placed.length);
  }

  function openDrawer(tab) {
    if (tab) drawerTab = tab;
    cancelPlacement(false);
    selectedId = null; renderSelectedBar();
    drawerOpen = true;
    if (API) API.setUI(true);
    var dr = document.getElementById('mip-drawer');
    if (dr) { dr.classList.add('open'); renderDrawer(); }
  }
  function closeDrawer() {
    drawerOpen = false;
    var dr = document.getElementById('mip-drawer');
    if (dr) dr.classList.remove('open');
    if (API && !placing) API.setUI(false);
  }
  function toggleDrawer() { if (drawerOpen) closeDrawer(); else openDrawer(); }

  /* Quick 1-sentence IP world generator right inside Disney World! */
  function createInstantWorldInPark(ideaText) {
    var idea = String(ideaText || '').trim();
    if (idea.length < 2) { if (API) API.toast('先输入或说出你的梦想主题吧！'); return; }
    var TP = root.DWTemplates;
    var w = null;
    if (root.DWImagineer && root.DWImagineer.smartDraft) {
      w = root.DWImagineer.smartDraft(idea);
    } else if (TP && TP.list && TP.list.length) {
      w = TP.list[0].make();
      w.title = idea.slice(0, 18);
    }
    if (!w) return;
    w.id = uid('w'); w.created = Date.now(); w.updated = Date.now(); w.shelf = true;
    sset(WORK_PFX + w.id, w);
    inlineIdea = '';
    var ip = w.ipTheme || {};
    startPlacement({
      type: 'world',
      workId: w.id,
      kind: pickPreviewKind(w),
      title: w.title,
      badge: ip.badge || '原创梦想 IP',
      icon: ip.icon || '🌟',
      color: ip.color || '#fbbf24',
      hello: '欢迎走进我创造的「' + w.title + '」世界！',
      scale: 1.0
    });
  }

  function renderDrawer() {
    var dr = document.getElementById('mip-drawer'); if (!dr) return;
    var worlds = allIPWorlds();
    var h = '<div class="mip-hd"><h3>✨ 迪士尼奇想造梦百宝箱 · 把你的梦想放进乐园</h3>' +
      '<div style="display:flex;gap:8px;align-items:center">' +
      '<button type="button" class="tp-btn cyan" id="mip-open-ws">🎬 打开造梦工坊深度创作</button>' +
      '<button type="button" class="tp-m-close" id="mip-close">✕</button></div></div>';

    h += '<div class="mip-tabs">' +
      [['worlds', '🌍 IP 主题世界 (' + worlds.length + ')'],
       ['models', '🧸 3D 欢乐模型 (' + PARK_MODELS.length + ')'],
       ['plots', '📍 黄金展位'],
       ['mine', '🗺️ 我的乐园 (' + placed.length + ')']].map(function (t) {
        return '<button type="button" class="' + (drawerTab === t[0] ? 'on' : '') + '" data-mtab="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div>';

    h += '<div class="mip-body">';
    if (drawerTab === 'worlds') {
      h += '<div class="mip-ai"><b style="color:#fde68a;font-size:13.5px">🪄 一句话直接变出全新 IP 世界放到眼前！</b>' +
        '<div class="mip-ai-row">' +
        '<input id="mip-idea" value="' + esc(inlineIdea) + '" placeholder="如：冰雪公主与独角兽放烟花">' +
        '<button type="button" class="tp-btn" id="mip-mic" title="语音说出梦想">🎤 语音</button>' +
        '<button type="button" class="tp-btn gold" id="mip-idea-go">✨ 变出并放置到乐园</button></div>' +
        '<div class="mip-chips">' +
        ['冰雪城堡艾莎与独角兽飘雪放烟花', '小恐龙森林黄金宝箱大冒险', '太空火箭基地宇航员与机器人派对', '坐小船穿过彩虹桥去星光城堡'].map(function (s) {
          return '<button type="button" class="mip-chip" data-mex="' + esc(s) + '">✨ ' + esc(s) + '</button>';
        }).join('') + '</div></div>';

      h += '<div class="mip-grid">' + worlds.map(function (w, idx) {
        return '<div class="mip-card">' +
          '<div class="mip-card-top"><span class="mip-card-ic">' + w.icon + '</span><span class="mip-card-bdg" style="color:' + w.color + '">' + esc(w.badge) + '</span></div>' +
          '<b>' + esc(w.title) + '</b><small>' + esc(w.note) + '</small>' +
          '<div class="mip-card-btns">' +
          '<button type="button" class="tp-btn gold" data-placew="' + idx + '">📍 放到乐园</button>' +
          '<button type="button" class="tp-btn cyan" data-enterw="' + esc(w.workId) + '">🌟 直接进入</button>' +
          '<button type="button" class="tp-btn" data-editw="' + esc(w.workId) + '">✏️ 改造</button>' +
          '</div></div>';
      }).join('') + '</div>';
    } else if (drawerTab === 'models') {
      h += '<p style="margin:0 0 10px;font-size:12.5px;color:#cbd5e1">点选任意 3D 模型即可摆放到迪士尼乐园地面上，所有模型都会动、会发光、会开口和小朋友互动！</p>';
      h += '<div class="mip-mgrid">' + PARK_MODELS.map(function (m, idx) {
        return '<button type="button" class="mip-mbtn" data-placem="' + idx + '"><span>' + m.icon + '</span><b>' + esc(m.name) + '</b></button>';
      }).join('') + '</div>';
    } else if (drawerTab === 'plots') {
      h += '<p style="margin:0 0 10px;font-size:12.5px;color:#cbd5e1">挑选迪士尼乐园最宽敞漂亮的黄金广场，一键瞬移过去摆放你的城堡和 IP 世界！</p>';
      h += '<div class="mip-grid">' + DREAM_PLOTS.map(function (p) {
        return '<div class="mip-card"><div class="mip-card-top"><span class="mip-card-ic">' + p.icon + '</span><span class="mip-card-bdg" style="color:#fbbf24">黄金展位</span></div>' +
          '<b>' + esc(p.name) + '</b><small>' + esc(p.desc) + '</small>' +
          '<div class="mip-card-btns"><button type="button" class="tp-btn gold" data-gotoplot="' + p.id + '">🚶 瞬移到这里建造</button></div></div>';
      }).join('') + '</div>';
    } else {
      if (!placed.length) {
        h += '<p style="padding:20px 0;text-align:center;color:#94a3b8">乐园里还没有摆放你的专属模型，快去「🌍 放置沉浸 IP 世界」或「🧸 放置 3D 欢乐模型」挑一个吧！</p>';
      } else {
        h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span style="font-size:12.5px;color:#cbd5e1">你在迪士尼乐园建造的全部作品（自动云同步）：</span><button type="button" class="tp-btn pink" id="mip-clear-all">🗑 清空重摆</button></div>';
        h += '<div class="mip-grid">' + placed.map(function (it) {
          return '<div class="mip-card"><div class="mip-card-top"><span class="mip-card-ic">' + (it.icon || '✨') + '</span><span class="mip-card-bdg" style="color:' + (it.color || '#fbbf24') + '">' + (it.type === 'world' ? '沉浸 IP 世界' : '3D 互动模型') + '</span></div>' +
            '<b>' + esc(it.title) + '</b><small>坐标 (' + Math.round(it.x) + ', ' + Math.round(it.z) + ')</small>' +
            '<div class="mip-card-btns">' +
            '<button type="button" class="tp-btn gold" data-tpitem="' + it.id + '">🚶 过去看</button>' +
            (it.type === 'world' ? '<button type="button" class="tp-btn cyan" data-enterw="' + esc(it.workId) + '">🌟 走进</button>' : '') +
            '<button type="button" class="tp-btn" data-delitem="' + it.id + '">🗑 收起</button>' +
            '</div></div>';
        }).join('') + '</div>';
      }
    }
    h += '</div>';
    dr.innerHTML = h;

    var inp = document.getElementById('mip-idea');
    if (inp) {
      inp.oninput = function () { inlineIdea = this.value; };
      inp.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); createInstantWorldInPark(this.value); } };
    }
    dr.querySelector('#mip-close').onclick = closeDrawer;
    dr.querySelector('#mip-open-ws').onclick = function () { closeDrawer(); if (root.MinestPavilion) root.MinestPavilion.workshop('?from=park'); };
    var micBtn = dr.querySelector('#mip-mic');
    if (micBtn) micBtn.onclick = function () {
      var SR = root.SpeechRecognition || root.webkitSpeechRecognition;
      if (!SR) { if (API) API.toast('当前浏览器暂不支持语音识别，请直接输入文字'); return; }
      var rec = new SR(); rec.lang = 'zh-CN'; rec.interimResults = true;
      micBtn.textContent = '🔴 请说话…';
      rec.onresult = function (ev) {
        var t = ''; for (var i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript;
        inlineIdea = t; var el = document.getElementById('mip-idea'); if (el) el.value = t;
      };
      rec.onend = function () { micBtn.textContent = '🎤 语音'; };
      try { rec.start(); } catch (e) { micBtn.textContent = '🎤 语音'; }
    };
    var goBtn = dr.querySelector('#mip-idea-go');
    if (goBtn) goBtn.onclick = function () { var el = document.getElementById('mip-idea'); createInstantWorldInPark(el ? el.value : inlineIdea); };
    [].forEach.call(dr.querySelectorAll('[data-mex]'), function (b) {
      b.onclick = function () { inlineIdea = b.dataset.mex; var el = document.getElementById('mip-idea'); if (el) el.value = inlineIdea; };
    });
    [].forEach.call(dr.querySelectorAll('[data-mtab]'), function (b) {
      b.onclick = function () { drawerTab = b.dataset.mtab; renderDrawer(); };
    });
    [].forEach.call(dr.querySelectorAll('[data-placew]'), function (b) {
      b.onclick = function () {
        var w = worlds[+b.dataset.placew]; if (!w) return;
        startPlacement({ type: 'world', workId: w.workId, kind: w.previewKind, title: w.title, badge: w.badge, icon: w.icon, color: w.color, scale: 1.0 });
      };
    });
    [].forEach.call(dr.querySelectorAll('[data-enterw]'), function (b) {
      b.onclick = function () {
        var wid = b.dataset.enterw; ensureWorkStored(wid); closeDrawer();
        if (root.MinestPavilion) root.MinestPavilion.playWorld(wid);
      };
    });
    [].forEach.call(dr.querySelectorAll('[data-editw]'), function (b) {
      b.onclick = function () {
        var wid = b.dataset.editw; ensureWorkStored(wid); closeDrawer();
        if (root.MinestPavilion) root.MinestPavilion.editWorld(wid);
      };
    });
    [].forEach.call(dr.querySelectorAll('[data-placem]'), function (b) {
      b.onclick = function () {
        var m = PARK_MODELS[+b.dataset.placem]; if (!m) return;
        startPlacement({ type: 'model', kind: m.kind, title: m.name, icon: m.icon, color: m.color, hello: m.hello, scale: m.scale });
      };
    });
    [].forEach.call(dr.querySelectorAll('[data-gotoplot]'), function (b) {
      b.onclick = function () {
        var pl = DREAM_PLOTS.filter(function (x) { return x.id === b.dataset.gotoplot; })[0];
        if (pl && API) { API.teleport({ mode: 'walk', p: pl.p, t: pl.t }); drawerTab = 'worlds'; renderDrawer(); API.toast('📍 已抵达「' + pl.name + '」· 挑选一个模型或 IP 世界放下吧！'); }
      };
    });
    [].forEach.call(dr.querySelectorAll('[data-tpitem]'), function (b) {
      b.onclick = function () {
        var it = placed.filter(function (x) { return x.id === b.dataset.tpitem; })[0];
        if (it && API) {
          closeDrawer();
          API.teleport({ mode: 'walk', p: [it.x + Math.sin(it.ry || 0) * 7.5, it.y, it.z + Math.cos(it.ry || 0) * 7.5], t: [it.x, it.y + 2, it.z] });
          selectedId = it.id; renderSelectedBar();
        }
      };
    });
    [].forEach.call(dr.querySelectorAll('[data-delitem]'), function (b) {
      b.onclick = function () {
        placed = placed.filter(function (x) { return x.id !== b.dataset.delitem; });
        savePlaced(); syncSceneMeshes(); renderDrawer();
      };
    });
    var clr = dr.querySelector('#mip-clear-all');
    if (clr) clr.onclick = function () {
      if (confirm('确定收起乐园里摆放的全部自定义模型吗？（造梦工坊里的世界存档不会丢失）')) {
        placed = []; savePlaced(); syncSceneMeshes(); renderDrawer();
      }
    };
  }

  function renderPlaceBar() {
    var pb = document.getElementById('mip-placebar'); if (!pb) return;
    document.body.classList.toggle('mip-placing', !!placing);
    if (!placing) { pb.classList.remove('on'); return; }
    var it = placing.item;
    pb.classList.add('on');
    pb.innerHTML = '<b>📍 正在放置：' + esc(it.icon) + ' ' + esc(it.title) + '</b>' +
      '<button type="button" class="tp-btn gold" id="mip-p-ok">✅ 放在这里</button>' +
      '<button type="button" class="tp-btn" id="mip-p-rotl">↺ 左转</button>' +
      '<button type="button" class="tp-btn" id="mip-p-rotr">↻ 右转</button>' +
      '<button type="button" class="tp-btn" id="mip-p-big">＋ 放大</button>' +
      '<button type="button" class="tp-btn" id="mip-p-small">－ 缩小</button>' +
      '<button type="button" class="tp-btn pink" id="mip-p-cancel">✕ 取消</button>';
    pb.querySelector('#mip-p-ok').onclick = confirmPlacement;
    pb.querySelector('#mip-p-rotl').onclick = function () { it.ry -= Math.PI / 6; placing.ghost.group.rotation.y = it.ry; };
    pb.querySelector('#mip-p-rotr').onclick = function () { it.ry += Math.PI / 6; placing.ghost.group.rotation.y = it.ry; };
    pb.querySelector('#mip-p-big').onclick = function () { it.s = Math.min(2.8, +(it.s * 1.18).toFixed(2)); placing.ghost.group.scale.setScalar(it.s); };
    pb.querySelector('#mip-p-small').onclick = function () { it.s = Math.max(0.45, +(it.s * 0.85).toFixed(2)); placing.ghost.group.scale.setScalar(it.s); };
    pb.querySelector('#mip-p-cancel').onclick = function () { cancelPlacement(true); };
  }

  function renderSelectedBar() {
    var sb = document.getElementById('mip-selbar'); if (!sb) return;
    var it = selectedId && placed.filter(function (x) { return x.id === selectedId; })[0];
    if (!it || placing || drawerOpen) { sb.classList.remove('on'); return; }
    sb.classList.add('on');
    sb.innerHTML = '<b>' + esc(it.icon || '✨') + ' ' + esc(it.title) + '</b>' +
      (it.type === 'world'
        ? '<button type="button" class="tp-btn gold" id="mip-s-go">🌟 走进世界体验</button><button type="button" class="tp-btn cyan" id="mip-s-edit">🎬 改造世界</button>'
        : '<button type="button" class="tp-btn gold" id="mip-s-go">✨ 互动庆祝</button><button type="button" class="tp-btn cyan" id="mip-s-say">💬 改名字与欢迎词</button>') +
      '<button type="button" class="tp-btn" id="mip-s-move">📍 换位置</button>' +
      '<button type="button" class="tp-btn pink" id="mip-s-del">🗑 收起</button>' +
      '<button type="button" class="tp-btn" id="mip-s-x">✕</button>';
    sb.querySelector('#mip-s-go').onclick = function () { interactWithPlaced(it); };
    if (sb.querySelector('#mip-s-edit')) {
      sb.querySelector('#mip-s-edit').onclick = function () { ensureWorkStored(it.workId); if (root.MinestPavilion) root.MinestPavilion.editWorld(it.workId); };
    }
    if (sb.querySelector('#mip-s-say')) {
      sb.querySelector('#mip-s-say').onclick = function () {
        var nm = prompt('给这个模型起个新名字：', it.title);
        if (nm != null && nm.trim()) it.title = nm.trim().slice(0, 24);
        var hl = prompt('当小朋友走近点击它时，它说什么欢迎词？', it.hello || '');
        if (hl != null) it.hello = hl.trim().slice(0, 140);
        savePlaced(); syncSceneMeshes(); renderSelectedBar();
        interactWithPlaced(it);
      };
    }
    sb.querySelector('#mip-s-move').onclick = function () { startPlacement(it, it.id); };
    sb.querySelector('#mip-s-del').onclick = function () {
      placed = placed.filter(function (x) { return x.id !== it.id; });
      selectedId = null; savePlaced(); syncSceneMeshes(); renderSelectedBar();
      API.toast('已收起「' + it.title + '」');
    };
    sb.querySelector('#mip-s-x').onclick = function () { selectedId = null; renderSelectedBar(); };
  }

  /* ---------------------------------------------------------------- Animation & Input Hooks in Disney World */
  function attachToPark(api) {
    if (API) return;
    API = api;
    var T = API.THREE;
    raycaster = new T.Raycaster();
    ndc = new T.Vector2();
    holder = new T.Group(); holder.name = 'imagineer-placed';
    API.scene.add(holder);

    injectUI();
    loadPlaced();

    /* Add starter fairytale portal on Castle Hub if completely empty? Wait—let's keep user's park clean unless they place, OR check ?place= query! */
    syncSceneMeshes();

    /* Check if redirected from Dream Workshop with ?place=<workId> or localStorage pendingPlaceWork */
    var qs = new URLSearchParams(location.search);
    var pendingWorkId = qs.get('place') || '';
    try {
      var lsPending = localStorage.getItem('tp.pendingPlaceWork');
      if (lsPending) { pendingWorkId = lsPending; localStorage.removeItem('tp.pendingPlaceWork'); }
    } catch (e) {}
    if (pendingWorkId) {
      setTimeout(function () {
        var w = ensureWorkStored(pendingWorkId) || sget(WORK_PFX + pendingWorkId);
        if (w) placeDreamWork(w);
      }, 450);
    }

    /* Listen for postMessage from embedded Dream Workshop iframe ("🏰 放到迪士尼乐园") */
    root.addEventListener('message', function (ev) {
      var d = ev.data;
      if (d && d.type === 'minest-place-in-park' && (d.work || d.workId)) {
        var w = d.work || sget(WORK_PFX + d.workId);
        if (w) { sset(WORK_PFX + w.id, w); placeDreamWork(w); }
      }
    });

    /* Intercept pointer move & click on Disney World canvas for Placement Mode & Direct Clicking Placed Models */
    API.canvas.addEventListener('mousemove', function (e) {
      if (!placing) return;
      var pt = groundPointFromClient(e.clientX, e.clientY);
      if (pt) {
        placing.item.x = pt.x; placing.item.y = pt.y; placing.item.z = pt.z;
        placing.ghost.group.position.set(pt.x, pt.y, pt.z);
      }
    });

    var downPos = null;
    API.canvas.addEventListener('pointerdown', function (e) {
      downPos = { x: e.clientX, y: e.clientY };
      if (placing) {
        var pt = groundPointFromClient(e.clientX, e.clientY);
        if (pt) {
          placing.item.x = pt.x; placing.item.y = pt.y; placing.item.z = pt.z;
          placing.ghost.group.position.set(pt.x, pt.y, pt.z);
        }
      }
    }, true);

    API.canvas.addEventListener('pointerup', function (e) {
      if (!downPos || Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 8) return;
      if (placing) {
        e.stopPropagation();
        confirmPlacement();
        return;
      }
      if (drawerOpen || API.state.activeRide) return;
      /* If pointer is unlocked, clicking a placed model selects & triggers it! */
      if (!document.pointerLockElement) {
        var hitId = pickPlacedFromClient(e.clientX, e.clientY);
        if (hitId) {
          var hitItem = placed.filter(function (x) { return x.id === hitId; })[0];
          if (hitItem) {
            selectedId = hitId; renderSelectedBar();
            interactWithPlaced(hitItem);
          }
        }
      }
    }, true);

    /* Hook KeyE / `#tp-action-prompt` when nearest action is one of our placed IP worlds or models! */
    function tryActivateNearestPlaced() {
      if (placing || drawerOpen || API.state.activeRide) return false;
      var pp = API.player.pos, best = null, bestD = 9.0;
      placed.forEach(function (it) {
        var d = Math.hypot(pp.x - it.x, pp.z - it.z);
        if (d < bestD) { bestD = d; best = it; }
      });
      if (!best) return false;
      selectedId = best.id; renderSelectedBar();
      interactWithPlaced(best);
      return true;
    }

    root.addEventListener('keydown', function (e) {
      if (placing) {
        if (e.code === 'Enter') { e.preventDefault(); e.stopPropagation(); confirmPlacement(); return; }
        if (e.code === 'KeyR') { placing.item.ry += Math.PI / 6; placing.ghost.group.rotation.y = placing.item.ry; return; }
        if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); cancelPlacement(true); return; }
      }
      if (e.code === 'KeyB' && !/INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) {
        toggleDrawer();
        return;
      }
      if (e.code === 'KeyE' && !placing && !drawerOpen) {
        if (tryActivateNearestPlaced()) {
          e.stopImmediatePropagation();
        }
      }
    }, true);

    var actBtn = document.getElementById('tp-action-prompt');
    if (actBtn) {
      actBtn.addEventListener('click', function (e) {
        if (tryActivateNearestPlaced()) {
          e.stopImmediatePropagation();
        }
      }, true);
    }

    /* Cloud sync listener */
    if (S && S.onChange) {
      S.onChange(function () {
        var remote = sget(STORE_KEY);
        if (Array.isArray(remote) && JSON.stringify(remote) !== JSON.stringify(placed)) {
          placed = remote;
          syncSceneMeshes();
        }
      });
    }

    /* Animation loop for placed 3D models, portal rings, and celebration particles */
    var lastT = performance.now();
    (function animatePlaced(now) {
      requestAnimationFrame(animatePlaced);
      var dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; clock += dt;

      if (placing && document.pointerLockElement) {
        var fp = frontSpot(placing.item.type === 'world' ? 10 : 7.5);
        placing.item.x = fp.x; placing.item.y = fp.y; placing.item.z = fp.z;
        placing.ghost.group.position.set(fp.x, fp.y, fp.z);
      }

      Object.keys(meshMap).forEach(function (id) {
        var n = meshMap[id], it = n.item;
        if (n.portalRing) {
          n.portalRing.rotation.z += dt * 1.1;
        }
        if (n.jump > 0) {
          n.jump = Math.max(0, n.jump - dt * 1.8);
          n.group.position.y = it.y + Math.sin(n.jump * Math.PI) * 0.85;
        } else {
          n.group.position.y = it.y;
        }
        if (n.showcase) {
          var u = n.showcase.userData || {}, rig = u.rig;
          if (u.spin && u.spin.obj) u.spin.obj.rotation.z += dt * u.spin.speed;
          if (rig) {
            if (rig.prop === 'carousel') {
              rig.spin.rotation.y += dt * 0.75;
              rig.horses.forEach(function (h) { h.position.y = 0.95 + Math.sin(clock * 2.8 + h.userData.phase) * 0.14; });
            } else if (rig.prop === 'ferris') {
              rig.wheel.rotation.z += dt * 0.35;
              rig.cars.forEach(function (cg) { cg.rotation.z = -rig.wheel.rotation.z; });
            } else if (rig.prop === 'crystal') {
              rig.gem.rotation.y += dt * 1.1;
              rig.gem.position.y = 1.65 + Math.sin(clock * 2.2) * 0.12;
            } else if (rig.prop === 'rocket') {
              rig.ship.position.y = Math.sin(clock * 2.4) * 0.1;
            } else if (rig.prop === 'treasure') {
              rig.lid.rotation.x = -0.65 - Math.sin(clock * 2) * 0.35;
            } else if (rig.prop === 'book') {
              rig.cover.rotation.z = -Math.PI * 0.85;
              rig.pop.rotation.x = 0;
            } else if (rig.prop === 'musicbox') {
              rig.lid.rotation.x = -1.6;
              rig.plat.rotation.y += dt * 1.1;
            } else if (rig.head && it.type === 'model') {
              /* Friendly characters gently wave & turn head toward the child when close! */
              var dist = Math.hypot(API.player.pos.x - it.x, API.player.pos.z - it.z);
              if (dist < 14) {
                var ang = Math.atan2(API.player.pos.x - it.x, API.player.pos.z - it.z) - (it.ry || 0);
                ang = Math.atan2(Math.sin(ang), Math.cos(ang));
                rig.head.rotation.y = Math.max(-0.7, Math.min(0.7, ang));
                if (rig.armR) rig.armR.rotation.z = 0.06 + Math.max(0, Math.sin(clock * 4)) * 0.85;
              }
            }
          }
        }
      });

      for (var i = burstList.length - 1; i >= 0; i--) {
        var b = burstList[i]; b.age += dt;
        if (b.age >= b.life) { API.scene.remove(b.pts); b.geo.dispose(); b.mat.dispose(); burstList.splice(i, 1); continue; }
        var arr = b.geo.attributes.position.array, p = b.age / b.life;
        for (var k = 0; k < b.vels.length; k++) {
          var v = b.vels[k];
          arr[k * 3] = v[0] * b.age;
          arr[k * 3 + 1] = v[1] * b.age - 3.8 * b.age * b.age;
          arr[k * 3 + 2] = v[2] * b.age;
        }
        b.geo.attributes.position.needsUpdate = true;
        b.mat.opacity = 1 - p * p;
      }
    })(lastT);
  }

  function placeDreamWork(work) {
    if (!work || !work.id) return;
    sset(WORK_PFX + work.id, work);
    var ip = work.ipTheme || {};
    startPlacement({
      type: 'world',
      workId: work.id,
      kind: pickPreviewKind(work),
      title: work.title || '我的奇想世界',
      badge: ip.badge || '我的创作',
      icon: ip.icon || '🎬',
      color: ip.color || '#fbbf24',
      scale: 1.0
    });
  }

  if (root.TPParkAPI) attachToPark(root.TPParkAPI);
  else root.addEventListener('tp:park-ready', function (e) { attachToPark(e.detail || root.TPParkAPI); });

  root.MinestImagineerPark = {
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
    toggleDrawer: toggleDrawer,
    placeDreamWork: placeDreamWork,
    startPlacement: startPlacement,
    placed: function () { return placed.slice(); }
  };
})(window);
