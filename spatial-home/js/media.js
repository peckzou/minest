/* Minest · Spatial Home — the gramophone's music and the film projector's screening (window.SpatialMedia).
   Music: everything is synthesised live with Web Audio — no recordings are downloaded or bundled.
     · Ambience per environment: Santorini waves and gulls, Manhattan city hum, Alpine wind and birds, the train's rails.
     · Classical: public-domain compositions (J. S. Bach circle: Minuet in G, BWV Anh. 114; Beethoven: Für Elise, WoO 59)
       played by a small piano-like synth through a soft "gramophone" filter with a little crackle.
     · Mute. Play / pause, volume. The state is the user's setting (app.js keeps it with the room's settings).
   Screening: a slide show of what the user really has — Type Workshop works (their real 3D models, rendered), display
   machines placed in the rooms, My World things (their own pictures) — with play / pause / previous / next / choose, and a
   detail card that opens the 3D preview in the backpack or places the thing with the backpack. No sample content. */
(function (root) {
  'use strict';
  var BP = function () { return root.MinestBackpack; };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ================================================================ audio */
  var AC = null, OUT = null, BUS = null, nodes = [], timers = [], st = { mode: 'ambient', vol: 0.55, playing: false, piece: 0 }, env = 'santorini', duck = 1, onState = null;
  function ac() {
    if (AC) return AC; var C = root.AudioContext || root.webkitAudioContext; if (!C) return null;
    AC = new C(); OUT = AC.createGain(); OUT.gain.value = 0; OUT.connect(AC.destination);
    BUS = AC.createGain(); BUS.connect(OUT); return AC;
  }
  /* browsers start audio only from a gesture: the first touch / click / key after a "playing" state resumes it */
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (t) { root.addEventListener(t, function () { if (st.playing && AC && AC.state === 'suspended') AC.resume(); }, true); });
  var NB = {};
  function noise(kind) {
    if (NB[kind]) return NB[kind];
    var n = AC.sampleRate * 4, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0), last = 0, b0 = 0, b1 = 0, b2 = 0;
    for (var i = 0; i < n; i++) {
      var w = Math.random() * 2 - 1;
      if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else if (kind === 'pink') { b0 = 0.997 * b0 + w * 0.029591; b1 = 0.985 * b1 + w * 0.032534; b2 = 0.95 * b2 + w * 0.048056; d[i] = (b0 + b1 + b2 + w * 0.1) * 0.6; }
      else d[i] = w * 0.5;
    }
    return (NB[kind] = b);
  }
  function src(kind) { var s = AC.createBufferSource(); s.buffer = noise(kind); s.loop = true; s.start(); nodes.push(s); return s; }
  function filt(type, f, q) { var x = AC.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q; nodes.push(x); return x; }
  function gain(v) { var g = AC.createGain(); g.gain.value = v; nodes.push(g); return g; }
  function lfo(rate, depth, param, offset) { var o = AC.createOscillator(), g = gain(depth); o.frequency.value = rate; o.connect(g); g.connect(param); if (offset != null) param.value = offset; o.start(); nodes.push(o); }
  function every(ms, fn, jitter) { var id = { t: 0 }; (function next() { id.t = setTimeout(function () { try { fn(); } catch (e) {} next(); }, ms + Math.random() * (jitter || 0)); })(); timers.push(id); }
  function chirp(f0, f1, dur, vol, type) {
    var t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(BUS); o.start(t); o.stop(t + dur + 0.05);
  }
  function burst(fc, dur, vol) {
    var t = AC.currentTime, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = noise('white'); f.type = 'bandpass'; f.frequency.value = fc; f.Q.value = 1.2;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(BUS); s.start(t, Math.random() * 3); s.stop(t + dur + 0.05);
  }
  var AMB = {
    santorini: { label: '海浪与海鸥', build: function () {
      var w = src('brown'), lp = filt('lowpass', 520), g = gain(0.5); w.connect(lp); lp.connect(g); g.connect(BUS); lfo(0.11, 0.35, g.gain, 0.45);
      var f = src('pink'), hp = filt('highpass', 1800), g2 = gain(0.04); f.connect(hp); hp.connect(g2); g2.connect(BUS); lfo(0.11, 0.035, g2.gain, 0.04);
      every(6500, function () { chirp(1700, 1200, 0.35, 0.05, 'triangle'); setTimeout(function () { chirp(1650, 1150, 0.3, 0.04, 'triangle'); }, 380); }, 9000);
    } },
    manhattan: { label: '城市低鸣与远处车流', build: function () {
      var c = src('brown'), lp = filt('lowpass', 260), g = gain(0.55); c.connect(lp); lp.connect(g); g.connect(BUS);
      var t = src('pink'), bp = filt('bandpass', 900, 0.7), g2 = gain(0.05); t.connect(bp); bp.connect(g2); g2.connect(BUS); lfo(0.05, 0.03, g2.gain, 0.05);
      every(14000, function () { chirp(392, 392, 0.4, 0.015, 'square'); setTimeout(function () { chirp(330, 330, 0.5, 0.012, 'square'); }, 420); }, 16000);
    } },
    alpine: { label: '山风、鸟鸣与远处牛铃', build: function () {
      var w = src('white'), bp = filt('bandpass', 600, 0.8), g = gain(0.18); w.connect(bp); bp.connect(g); g.connect(BUS); lfo(0.07, 260, bp.frequency, 620); lfo(0.09, 0.1, g.gain, 0.16);
      every(5200, function () { var f = 2600 + Math.random() * 1400; chirp(f, f * 1.3, 0.12, 0.03); setTimeout(function () { chirp(f * 1.1, f * 0.9, 0.14, 0.025); }, 160); }, 7000);
      every(16000, function () { [523, 1046, 1568].forEach(function (f, i) { chirp(f, f * 0.995, 1.6, 0.012 / (i + 1), 'triangle'); }); }, 12000);
    } },
    train: { label: '车轮与铁轨', build: function () {
      var r = src('brown'), lp = filt('lowpass', 140), g = gain(0.7); r.connect(lp); lp.connect(g); g.connect(BUS);
      var hiss = src('pink'), bp = filt('bandpass', 2400, 0.6), g2 = gain(0.02); hiss.connect(bp); bp.connect(g2); g2.connect(BUS);
      every(1150, function () { burst(320, 0.09, 0.28); setTimeout(function () { burst(300, 0.1, 0.24); }, 170); }, 90);
    } }
  };
  /* public-domain pieces: [midi, beats] (0 = rest); bass under the melody */
  var PIECES = [
    { name: '巴赫圈 · G 大调小步舞曲（BWV Anh. 114）', beat: 0.52,
      mel: [[74,1],[67,.5],[69,.5],[71,.5],[72,.5],[74,1],[67,1],[67,1],[76,1],[72,.5],[74,.5],[76,.5],[78,.5],[79,1],[67,1],[67,1],[72,1],[74,.5],[72,.5],[71,.5],[69,.5],[71,1],[72,.5],[71,.5],[69,.5],[67,.5],[66,1],[67,.5],[69,.5],[71,.5],[67,.5],[69,3],
            [74,1],[67,.5],[69,.5],[71,.5],[72,.5],[74,1],[67,1],[67,1],[76,1],[72,.5],[74,.5],[76,.5],[78,.5],[79,1],[67,1],[67,1],[72,1],[74,.5],[72,.5],[71,.5],[69,.5],[71,1],[72,.5],[71,.5],[69,.5],[67,.5],[69,1],[71,.5],[69,.5],[67,.5],[66,.5],[67,3]],
      bass: [[55,2],[57,1],[59,3],[60,3],[59,3],[57,3],[55,3],[62,2],[59,1],[62,1],[50,1],[54,1],[55,2],[57,1],[59,3],[60,3],[59,3],[57,3],[55,3],[60,1],[62,1],[50,1],[55,2],[43,1]] },
    { name: '贝多芬 · 致爱丽丝（WoO 59）', beat: 0.42,
      mel: [[76,.25],[75,.25],[76,.25],[75,.25],[76,.25],[71,.25],[74,.25],[72,.25],[69,.5],[0,.25],[60,.25],[64,.25],[69,.25],[71,.5],[0,.25],[64,.25],[68,.25],[71,.25],[72,.5],[0,.25],[64,.25],[76,.25],[75,.25],
            [76,.25],[75,.25],[76,.25],[71,.25],[74,.25],[72,.25],[69,.5],[0,.25],[60,.25],[64,.25],[69,.25],[71,.5],[0,.25],[64,.25],[72,.25],[71,.25],[69,1.25]],
      bass: [[0,1.5],[45,.25],[52,.25],[57,.25],[0,.75],[40,.25],[52,.25],[56,.25],[0,.75],[45,.25],[52,.25],[57,.25],[0,1.5],[45,.25],[52,.25],[57,.25],[0,.75],[40,.25],[52,.25],[56,.25],[0,.75],[45,1.5]] }
  ];
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function note(m, t, dur, vol) {
    if (!m) return;
    var o1 = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain(), f = hz(m);
    o1.type = 'triangle'; o2.type = 'sine'; o1.frequency.value = f; o2.frequency.value = f * 2;
    var g2 = AC.createGain(); g2.gain.value = 0.25; o2.connect(g2); g2.connect(g); o1.connect(g); g.connect(PIANO);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.3, dur * 1.6));
    o1.start(t); o2.start(t); o1.stop(t + dur * 1.7 + 0.1); o2.stop(t + dur * 1.7 + 0.1);
  }
  var PIANO = null;
  function classical() {
    PIANO = filt('bandpass', 1300, 0.35); var tone = gain(0.9); PIANO.connect(tone); tone.connect(BUS);
    var cr = src('white'), hp = filt('highpass', 3000), cg = gain(0.012); cr.connect(hp); hp.connect(cg); cg.connect(BUS);   // the record's crackle
    every(700, function () { if (Math.random() < 0.5) burst(4200, 0.02, 0.02); }, 900);
    var P = PIECES[st.piece % PIECES.length], tm = { mel: 0, bass: 0, mi: 0, bi: 0, t0: AC.currentTime + 0.15 };
    var id = { t: setInterval(function () {
      var ahead = AC.currentTime + 0.4, len = P.mel.reduce(function (a, n) { return a + n[1]; }, 0) * P.beat;
      while (tm.t0 + tm.mel * P.beat < ahead) { var n = P.mel[tm.mi]; note(n[0], tm.t0 + tm.mel * P.beat, n[1] * P.beat, 0.16); tm.mel += n[1]; tm.mi++; if (tm.mi >= P.mel.length) { tm.mi = 0; tm.t0 += len + P.beat * 2; tm.mel = 0; tm.bass = 0; tm.bi = 0; break; } }
      while (tm.bi < P.bass.length && tm.t0 + tm.bass * P.beat < ahead) { var b = P.bass[tm.bi]; note(b[0], tm.t0 + tm.bass * P.beat, b[1] * P.beat, 0.1); tm.bass += b[1]; tm.bi++; }
    }, 100) };
    timers.push({ t: id.t, iv: true });
  }
  function stopAll() {
    nodes.forEach(function (n) { try { if (n.stop) n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} }); nodes = [];
    timers.forEach(function (t) { clearTimeout(t.t); clearInterval(t.t); }); timers = [];
  }
  function level() { return st.playing && st.mode !== 'mute' ? st.vol * duck : 0; }
  function apply() {
    if (!ac()) return;
    var want = st.playing && st.mode !== 'mute';
    stopAll();
    if (want) { if (AC.state === 'suspended') AC.resume(); if (st.mode === 'classical') classical(); else (AMB[env] || AMB.santorini).build(); }
    OUT.gain.cancelScheduledValues(AC.currentTime); OUT.gain.setTargetAtTime(level(), AC.currentTime, 0.25);
    if (onState) onState(st);
  }
  var audio = {
    state: function () { return JSON.parse(JSON.stringify(st)); },
    load: function (s) { if (s && typeof s === 'object') ['mode', 'vol', 'playing', 'piece'].forEach(function (k) { if (s[k] !== undefined) st[k] = s[k]; }); },
    set: function (p) { Object.keys(p).forEach(function (k) { st[k] = p[k]; }); apply(); },
    setVolume: function (v) { st.vol = Math.max(0, Math.min(1, v)); if (AC) OUT.gain.setTargetAtTime(level(), AC.currentTime, 0.1); if (onState) onState(st); },
    setEnv: function (id) { var changed = env !== id; env = id; if (changed && st.playing && st.mode === 'ambient') apply(); },
    duck: function (on) { duck = on ? 0.25 : 1; if (AC) OUT.gain.setTargetAtTime(level(), AC.currentTime, 0.3); },
    suspend: function () { if (AC) { stopAll(); OUT.gain.value = 0; } },
    resume: function () { if (st.playing) apply(); },
    onState: function (fn) { onState = fn; },
    ambience: function () { return (AMB[env] || AMB.santorini).label; }, pieces: function () { return PIECES.map(function (p) { return p.name; }); }
  };

  /* ================================================================ the gramophone's panel */
  function css() {
    if (document.getElementById('sh-media-css')) return;
    var s = document.createElement('style'); s.id = 'sh-media-css';
    s.textContent = [
      '#sh-music{position:fixed;z-index:2147483646;left:50%;bottom:calc(20px + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(380px,calc(100vw - 24px));padding:14px;border-radius:20px;background:linear-gradient(180deg,#5e3b26,#43291a);color:#f6ead2;font:14px/1.4 -apple-system,"PingFang SC",sans-serif;box-shadow:0 20px 50px rgba(30,15,5,.45),inset 0 0 0 2px #d8a94a}',
      '#sh-music h4{margin:0 0 8px;font-size:15px;display:flex;justify-content:space-between;align-items:center}#sh-music small{opacity:.75}',
      '#sh-music .seg{display:flex;gap:4px;margin:6px 0}#sh-music .seg button,#sh-music .row button{flex:1;border:0;border-radius:10px;padding:8px 6px;font:inherit;font-weight:700;background:#74503a;color:#f6ead2;cursor:pointer}#sh-music .seg button.on{background:#d8a94a;color:#3a2412}',
      '#sh-music .row{display:flex;gap:8px;align-items:center;margin-top:8px}#sh-music input[type=range]{flex:2;accent-color:#d8a94a}#sh-music select{width:100%;margin-top:6px;padding:7px;border-radius:9px;border:0;background:#f6ead2;color:#3a2412;font:inherit}',
      '#sh-music .x{border:0;background:none;color:#f6ead2;font-size:18px;cursor:pointer}',
      '#sh-cinema{position:fixed;inset:0;z-index:2147483646;background:#0d0b09;color:#f1e6cf;font:14px/1.4 -apple-system,"PingFang SC",sans-serif;display:flex;flex-direction:column}',
      '#sh-cinema .film{position:relative;flex:1;min-height:0;margin:14px 46px 8px;border-radius:6px;overflow:hidden;background:#1a1612;box-shadow:0 0 60px rgba(255,220,150,.08)}',
      '#sh-cinema .sprk{position:absolute;top:0;bottom:0;width:30px;background:repeating-linear-gradient(180deg,#0d0b09 0 10px,#e9dcc0 10px 22px,#0d0b09 22px 34px);opacity:.75}#sh-cinema .sprk.l{left:10px}#sh-cinema .sprk.r{right:10px}',
      '#sh-cinema .frame{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px 40px 80px;animation:shFlick .14s infinite}',
      '@keyframes shFlick{0%{opacity:.96}50%{opacity:1}100%{opacity:.93}}',
      '#sh-cinema .frame img{max-width:100%;max-height:100%;object-fit:contain;filter:sepia(.35) contrast(1.05);border-radius:4px;box-shadow:0 10px 40px rgba(0,0,0,.5)}',
      '#sh-cinema .frame .word{font:italic 700 clamp(28px,8vw,72px) Georgia,serif;color:#f6e7c2;text-shadow:0 0 18px rgba(255,190,90,.5)}',
      '#sh-cinema .grain{position:absolute;inset:-50%;pointer-events:none;opacity:.14;background-image:radial-gradient(rgba(255,255,255,.6) 1px,transparent 1px),radial-gradient(rgba(0,0,0,.7) 1px,transparent 1px);background-size:3px 3px,5px 5px;animation:shGrain .4s steps(4) infinite}',
      '@keyframes shGrain{0%{transform:translate(0,0)}25%{transform:translate(-3%,2%)}50%{transform:translate(2%,-3%)}75%{transform:translate(-2%,-1%)}}',
      '#sh-cinema .vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 55%,rgba(0,0,0,.6) 100%)}',
      '#sh-cinema .cap{position:absolute;left:0;right:0;bottom:0;padding:14px 50px 16px;background:linear-gradient(transparent,rgba(0,0,0,.75));text-align:center}#sh-cinema .cap b{font-size:18px}#sh-cinema .cap small{display:block;opacity:.75}',
      '#sh-cinema .cap button{margin-top:6px;border:1px solid rgba(241,230,207,.5);background:rgba(241,230,207,.12);color:#f1e6cf;border-radius:999px;padding:5px 12px;font:inherit;cursor:pointer}',
      '#sh-cinema footer{display:flex;gap:8px;justify-content:center;align-items:center;padding:8px 12px calc(12px + env(safe-area-inset-bottom))}#sh-cinema footer button{border:0;border-radius:12px;padding:9px 14px;background:#2e2720;color:#f1e6cf;font:inherit;font-weight:700;cursor:pointer}#sh-cinema footer span{opacity:.7;min-width:64px;text-align:center}',
      '#sh-cinema .grid{position:absolute;inset:0;overflow:auto;padding:20px 50px;background:rgba(13,11,9,.94);display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px;align-content:start}#sh-cinema .grid[hidden]{display:none}',
      '#sh-cinema .grid button{border:1px solid #3a3128;background:#1a1612;color:#f1e6cf;border-radius:10px;padding:6px;font:inherit;font-size:12px;cursor:pointer}#sh-cinema .grid img{width:100%;height:80px;object-fit:contain;display:block;filter:sepia(.3)}',
      '#sh-cinema .detail{position:absolute;right:16px;top:16px;width:min(320px,calc(100% - 32px));padding:14px;border-radius:16px;background:#f1e6cf;color:#2b1d12}#sh-cinema .detail[hidden]{display:none}#sh-cinema .detail img{width:100%;max-height:200px;object-fit:contain;border-radius:8px;background:#e5d6b6}',
      '#sh-cinema .detail .acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}#sh-cinema .detail .acts button{flex:1 1 45%;border:0;border-radius:10px;padding:9px 6px;font:inherit;font-weight:700;background:#e0cfa8;color:#2b1d12;cursor:pointer}#sh-cinema .detail .acts button.pri{background:#2f6fd6;color:#fff}',
      '@media (max-width:600px){#sh-cinema .film{margin:10px 34px 6px}#sh-cinema .sprk{width:20px}#sh-cinema .frame{padding:16px 22px 90px}}'
    ].join('\n');
    document.head.appendChild(s);
  }
  var panel = null;
  function music(ctx) {
    css(); if (panel) panel.remove();
    panel = document.createElement('div'); panel.id = 'sh-music'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', '留声机');
    function draw() {
      var s = st;
      panel.innerHTML = '<h4><span>🎶 留声机</span><button type="button" class="x" data-m="close" aria-label="关上">✕</button></h4>' +
        '<div class="seg"><button type="button" data-m="mode" data-v="ambient" class="' + (s.mode === 'ambient' ? 'on' : '') + '">环境音</button><button type="button" data-m="mode" data-v="classical" class="' + (s.mode === 'classical' ? 'on' : '') + '">古典音乐</button><button type="button" data-m="mode" data-v="mute" class="' + (s.mode === 'mute' ? 'on' : '') + '">静音</button></div>' +
        (s.mode === 'ambient' ? '<small>这里的氛围：' + esc(audio.ambience()) + '（实时合成）</small>' : '') +
        (s.mode === 'classical' ? '<select data-m="piece">' + PIECES.map(function (p, i) { return '<option value="' + i + '"' + (i === s.piece ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') + '</select><small>公共领域乐曲，合成演奏</small>' : '') +
        '<div class="row"><button type="button" data-m="play">' + (s.playing ? '⏸ 暂停' : '▶ 播放') + '</button><input type="range" min="0" max="100" value="' + Math.round(s.vol * 100) + '" data-m="vol" aria-label="音量"></div>';
    }
    draw();
    panel.addEventListener('click', function (e) {
      var b = e.target.closest('[data-m]'); if (!b) return; var a = b.dataset.m;
      if (a === 'close') { close(); return; }
      if (a === 'mode') { audio.set({ mode: b.dataset.v, playing: b.dataset.v === 'mute' ? st.playing : true }); draw(); }
      if (a === 'play') { audio.set({ playing: !st.playing }); draw(); }
    });
    panel.addEventListener('input', function (e) { if (e.target.dataset.m === 'vol') audio.setVolume(e.target.value / 100); });
    panel.addEventListener('change', function (e) { if (e.target.dataset.m === 'piece') { audio.set({ piece: +e.target.value, playing: true }); draw(); } });
    document.body.appendChild(panel);
    function close() { if (!panel) return; panel.remove(); panel = null; if (ctx.onClose) ctx.onClose(); }
    music.close = close;
  }

  /* ================================================================ the screening */
  var cin = null;
  function reels(ctx) {
    var B = BP(); if (!B) return [];
    var T = root.THREE, all = B.catalog({ functionObjects: function () { return []; } }), out = [];
    all.filter(function (it) { return it.cat === 'creations'; }).forEach(function (it) { out.push({ item: it, kind: 'Type Workshop 作品', title: it.name, sub: it.note, img: B.thumb(T, it) }); });
    /* display machines standing in the rooms (any environment) */
    (root.SpatialRoom ? root.SpatialRoom.envs() : []).forEach(function (en) {
      var L = B.store.get('bp:home:' + en.id); ((L && L.extras) || []).forEach(function (e) {
        if (e.kind !== 'machine' || !e.mx) return;
        var it = all.filter(function (x) { return x.key === 'mc:' + e.mx.type; })[0]; if (!it) return;
        out.push({ item: it, kind: '陈列装置', title: it.name + (e.mx.title ? ' · ' + e.mx.title : ''), sub: '摆在 ' + en.name + (e.mx.title ? ' · 装着「' + e.mx.title + '」' : ''), img: B.thumb(T, it) });
      });
    });
    all.filter(function (it) { return it.cat === 'collections'; }).slice(0, 60).forEach(function (it) { out.push({ item: it, kind: 'My World 收藏', title: it.name, sub: it.note, img: B.thingPic ? B.thingPic(it.ref) : '' }); });
    return out;
  }
  function cinema(ctx) {
    css(); if (cin) cin.el.remove();
    var list = reels(ctx), el = document.createElement('div'); el.id = 'sh-cinema'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', '收藏放映');
    el.innerHTML = '<div class="film"><div class="sprk l"></div><div class="sprk r"></div><div class="frame"></div><div class="grain"></div><div class="vig"></div><div class="cap"></div><div class="grid" hidden></div><div class="detail" hidden></div></div>' +
      '<footer><button type="button" data-c="prev" aria-label="上一个">◀</button><button type="button" data-c="play"></button><button type="button" data-c="next" aria-label="下一个">▶</button><span class="n"></span><button type="button" data-c="grid">▦ 选择</button><button type="button" data-c="close">✕ 关闭</button></footer>';
    document.body.appendChild(el);
    cin = { el: el, list: list, i: 0, playing: true, timer: 0 };
    function show() {
      var fr = el.querySelector('.frame'), cap = el.querySelector('.cap');
      el.querySelector('[data-c="play"]').textContent = cin.playing ? '⏸ 暂停' : '▶ 播放';
      if (!list.length) { fr.innerHTML = '<div class="word">空</div>'; cap.innerHTML = '<b>还没有可以放映的收藏</b><small>Type Workshop 作品、摆好的陈列装置和 My World 里的东西会出现在这里</small>'; el.querySelector('.n').textContent = '0 / 0'; return; }
      var r = list[cin.i];
      fr.innerHTML = r.img ? '<img alt="" src="' + esc(r.img) + '">' : '<div class="word">' + esc(r.title) + '</div>';
      cap.innerHTML = '<b>' + esc(r.title) + '</b><small>' + esc(r.kind) + (r.sub ? ' · ' + esc(r.sub) : '') + '</small><button type="button" data-c="detail">查看 · 3D 预览 · 放置</button>';
      el.querySelector('.n').textContent = (cin.i + 1) + ' / ' + list.length;
    }
    function tick() { clearTimeout(cin.timer); if (cin.playing && list.length > 1) cin.timer = setTimeout(function () { cin.i = (cin.i + 1) % list.length; show(); tick(); }, 4200); }
    function detail(r) {
      var d = el.querySelector('.detail'); cin.playing = false; tick(); show();
      d.innerHTML = (r.img ? '<img alt="" src="' + esc(r.img) + '">' : '') + '<h4 style="margin:8px 0 2px">' + esc(r.title) + '</h4><small>' + esc(r.kind) + (r.sub ? ' · ' + esc(r.sub) : '') + '</small>' +
        '<div class="acts"><button type="button" class="pri" data-c="d-preview">🎒 3D 预览</button><button type="button" data-c="d-place">放进房间</button><button type="button" data-c="d-close">返回放映</button></div>';
      d.hidden = false; d._r = r;
    }
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-c]'); if (!b) return; var a = b.dataset.c, r = list[cin.i];
      if (a === 'close') return close();
      if (a === 'prev' && list.length) { cin.i = (cin.i - 1 + list.length) % list.length; show(); tick(); }
      if (a === 'next' && list.length) { cin.i = (cin.i + 1) % list.length; show(); tick(); }
      if (a === 'play') { cin.playing = !cin.playing; show(); tick(); }
      if (a === 'grid') { var g = el.querySelector('.grid'); g.hidden = !g.hidden; if (!g.hidden) g.innerHTML = list.map(function (q, i) { return '<button type="button" data-c="pick" data-i="' + i + '">' + (q.img ? '<img alt="" src="' + esc(q.img) + '">' : '') + esc(q.title) + '</button>'; }).join('') || '<p>还没有可以放映的收藏</p>'; }
      if (a === 'pick') { cin.i = +b.dataset.i; el.querySelector('.grid').hidden = true; show(); detail(list[cin.i]); }
      if (a === 'detail' && r) detail(r);
      if (a === 'd-close') { el.querySelector('.detail').hidden = true; cin.playing = true; show(); tick(); }
      if (a === 'd-preview') { var it = el.querySelector('.detail')._r.item; close(true); if (ctx.preview) ctx.preview(it); }
      if (a === 'd-place') { var it2 = el.querySelector('.detail')._r.item; close(true); if (ctx.place) ctx.place(it2); }
    });
    function close(quiet) { if (!cin) return; clearTimeout(cin.timer); cin.el.remove(); cin = null; if (ctx.onClose) ctx.onClose(!!quiet); }
    cinema.close = close;
    show(); tick();
  }
  root.SpatialMedia = { audio: audio, music: music, cinema: cinema, reels: reels, isOpen: function () { return !!(panel || cin); } };
})(window);
