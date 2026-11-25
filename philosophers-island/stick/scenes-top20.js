// 哲学家小岛 · 火柴人小剧场 — one short stick-figure scene for the core idea of each of the first twenty halls.
// Written with the stick-scene skill (github.com/nilbuild/stick-scene, MIT); load after stick.js.
// Use as <stick-scene scene="<philosopher id>" play="click"></stick-scene>.
(function () {
  const SC = (window.SCENES = window.SCENES || {});
  const R = window.RIG;
  const { C, E, P, mix, legs, walkSeg, fig, inkFill, rr, ln, text, seg, breathe, pulse, lp, sparks, tickBadge, bubble, pill, arrow, circle, poly, lerp, arcPt, clamp } = R;
  const TAU = Math.PI * 2, W = 420;
  const REST = { hF: [12, -60], hB: [-4, -52] };
  const CHIN = P({ hF: [10, -96], head: [7, -116], hB: [-4, -54] });
  const POINT = P({ hF: [40, -100], hB: [-4, -54], head: [10, -116] });
  const UP = P({ hF: [22, -128], hB: [-4, -54], head: [6, -117] });
  const CHEER = P({ hF: [14, -132], hB: [-10, -130], head: [3, -118] });
  const BOW = P({ chest: [10, -86], head: [22, -104], hF: [14, -58], hB: [2, -54] });
  const NOD = P({ head: [5, -112], chest: [2, -89] });
  const ORANGE = { ink: '#d97757', far: '#e8b7a3' }, TEAL = { ink: '#3d7a8c', far: '#a9c9d1' };
  const bump = (T, a, b, c, d) => E.soft(seg(T, a, b)) * (1 - E.soft(seg(T, c, d)));
  const pop = (T, a, b, c, d) => E.back(seg(T, a, b)) * (1 - E.soft(seg(T, c, d)));
  const say = (T, a, b) => seg(T, a, a + 0.2) * (1 - seg(T, b - 0.2, b));
  // walk along [[t0, t1, x0, x1, faceAfter]…]: always walks forwards, then turns to face `faceAfter`
  function route(T, segs, face) {
    let ws = { x: segs[0][2], ph: 0, amp: 0, stride: 1 }, sx = face || 1;
    for (const s of segs) if (T >= s[0]) { ws = walkSeg(T, s[0], s[1], s[2], s[3]); sx = T < s[1] ? (s[3] >= s[2] ? 1 : -1) : (s[4] || face || 1); }
    return { ws, sx };
  }
  // one figure: rest pose + breathing + blended poses + legs
  function man(g, t, x, sx, ws, mixes, opt) {
    let pose = breathe(P(REST), t);
    (mixes || []).forEach((m) => { if (m[1] > 0) pose = mix(pose, m[0], m[1]); });
    pose = legs(pose, ws ? ws.ph : 0, ws ? ws.amp : 0, { arms: false, stride: ws ? ws.stride : 1 });
    return fig(g, pose, x, 0, Object.assign({ sx }, opt || {}));
  }
  const box = (g, x, y, w, h, fill, r, lw) => { rr(g, x, y, w, h, r == null ? 4 : r); inkFill(g, fill || C.paper, lw || 1.6); };
  const alpha = (g, a, fn) => { if (a <= 0.01) return; g.save(); g.globalAlpha *= clamp(a, 0, 1); fn(); g.restore(); };
  const sign = (g, cx, cy, label, fill, ink, size) => { const s = size || 10; g.font = R.FONT(s); const w = g.measureText(label).width + 14; box(g, cx - w / 2, cy - s / 2 - 5, w, s + 10, fill || C.paper, 4, 1.4); text(g, label, cx, cy + s * 0.36, s, ink || C.ink); return w; };
  const def = (id, dur, label, draw) => { SC[id] = { dur, width: W, label, draw(g, S) { draw.call(this, g, S, S.on ? S.u * dur : -1, S.t, S.on ? 1 - seg(S.u * dur, dur - 0.5, dur) : 0); } }; };

  /* 1 苏格拉底 · 产婆术 */
  def('socrates', 7.4, '少年自信地说“我知道”，苏格拉底只是追问；少年被问住，想了一会儿，自己想出了更好的答案。', function (g, S, T, t, fade) {
    const A = -110, B = 80, doubt = bump(T, 2.9, 3.3, 4.5, 4.8), got = pop(T, 4.8, 5.2, 6.5, 6.9);
    alpha(g, doubt, () => text(g, '?', B - 2, -128 - doubt * 6, 26, C.amber));
    man(g, t, A, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : 0], [POINT, bump(T, 1.7, 2.0, 2.8, 3.1)], [NOD, bump(T, 5.0, 5.3, 6.4, 6.8)]], { wave: S.wave, wt: S.wt });
    man(g, t, B, -1, null, [[POINT, bump(T, 0.3, 0.6, 1.5, 1.8)], [CHIN, doubt], [CHEER, got]], ORANGE);
    bubble(g, B - 48, -128, '我知道什么是勇敢！', say(T, 0.4, 1.7), { tail: 26 });
    bubble(g, A + 44, -128, '那……它是什么？', say(T, 1.8, 3.0), { tail: -24 });
    bubble(g, B - 44, -134, '啊，我自己想到了！', say(T, 5.0, 6.6), { tail: 24 });
    sparks(g, B, -140, seg(T, 4.8, 5.5), 18, 7, C.amber);
  });

  /* 2 柏拉图 · 洞穴 */
  def('plato', 7.6, '囚徒把墙上的影子当成真马；他转过身，看见火和木偶，再往外看见了太阳。', function (g, S, T, t, fade) {
    const X = 40, turn = T >= 2.0 && T < 6.6, sun = pop(T, 4.0, 4.6, 6.4, 6.9);
    // the wall and the shadow on it
    box(g, 128, -150, 66, 150, '#efefef', 2); alpha(g, 0.55, () => { g.fillStyle = '#555'; g.beginPath(); g.ellipse(160, -84, 18, 10, 0, 0, TAU); g.fill(); g.fillRect(170, -104, 6, 16); g.fillRect(148, -78, 4, 18); g.fillRect(168, -78, 4, 18); });
    // the fire and the puppet behind the prisoner
    for (let i = 0; i < 3; i++) { const h = 26 + Math.sin(t * 7 + i * 2) * 5; poly(g, [[-150 + i * 9, 0], [-145 + i * 9, -h], [-140 + i * 9, 0]], true); inkFill(g, i === 1 ? C.butterHi : '#f6a35c', 1.3); }
    ln(g, -84, 0, -84, -74, 2); box(g, -100, -92, 32, 16, C.wood, 5); box(g, -72, -104, 8, 14, C.wood, 3);
    alpha(g, sun, () => { circle(g, -172, -150, 15 * sun); inkFill(g, C.butterHi, 1.6); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 0.4; ln(g, -172 + Math.cos(a) * 21, -150 + Math.sin(a) * 21, -172 + Math.cos(a) * 28, -150 + Math.sin(a) * 28, 1.6, C.amber); } });
    man(g, t, X, turn ? -1 : 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : bump(T, 2.2, 2.5, 3.8, 4.1)], [POINT, bump(T, 0.3, 0.6, 1.5, 1.8)], [CHEER, pop(T, 4.5, 4.9, 6.0, 6.4)]], { wave: S.wave, wt: S.wt });
    bubble(g, X + 30, -132, '看，一匹马！', say(T, 0.4, 1.7), { tail: -18 });
    bubble(g, X - 46, -132, '原来只是影子……', say(T, 2.5, 4.0), { tail: 26 });
  });

  /* 3 亚里士多德 · 中道 */
  def('aristotle', 8, '他先缩在“怯懦”一头，又冲到“鲁莽”一头，最后站到两者之间的“勇敢”上。', function (g, S, T, t, fade) {
    const r = route(T, [[0.3, 1.5, -150, 130, -1], [2.6, 3.6, 130, 0, 1], [6.6, 7.5, 0, -150, 1]], 1), x = r.ws.x, mid = seg(T, 3.6, 4.0) * fade;
    ln(g, -170, -22, 170, -22, 2); ln(g, 0, -22, 0, -8, 2); poly(g, [[-10, 0], [0, -8], [10, 0]], true); inkFill(g, C.wood, 1.5);
    sign(g, -140, -160, '怯懦', C.red, C.redInk); sign(g, 140, -160, '鲁莽', C.red, C.redInk); sign(g, 0, -160, '勇敢', mid > 0.5 ? C.green : C.paper, mid > 0.5 ? C.greenInk : C.muted);
    g.save(); g.translate(0, -22); man(g, t, x, r.sx, r.ws, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : 0], [UP, bump(T, 1.5, 1.7, 2.4, 2.7)], [CHEER, pop(T, 4.0, 4.4, 5.6, 6.0)]], { wave: S.wave, wt: S.wt }); g.restore();
    bubble(g, 96, -150, '冲过头了！', say(T, 1.6, 2.6), { tail: 22 });
    tickBadge(g, 26, -142, mid);
  });

  /* 4 芝诺与斯多葛 · 控制二分 */
  def('zeno', 7.4, '他先冲着乌云喊“别下了”，雨照下；然后撑开自己手里的伞。', function (g, S, T, t, fade) {
    const X = -10, rain = bump(T, 0.2, 0.7, 6.6, 7.1), um = pop(T, 3.3, 3.7, 6.5, 6.9);
    alpha(g, 0.5 + rain * 0.5, () => { [[-18, 0, 12], [0, -6, 15], [19, 0, 12]].forEach((c) => { circle(g, X + c[0], -172 + c[1], c[2]); inkFill(g, rain > 0.3 ? '#cfd4da' : '#f3f3f3', 1.5); }); });
    alpha(g, rain, () => { for (let i = 0; i < 9; i++) { const rx = X - 36 + i * 9, k = (t * 1.6 + i * 0.37) % 1, y0 = -152 + k * 126; if (um > 0.5 && Math.abs(rx - X - 14) < 28 && y0 > -128) continue; ln(g, rx, y0, rx - 3, y0 + 9, 1.3, '#7fa6c9'); } });
    const J = man(g, t, X, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : bump(T, 2.1, 2.4, 3.1, 3.4)], [UP, bump(T, 0.5, 0.8, 1.8, 2.1)], [P({ hF: [16, -100], hB: [-4, -54] }), um]], { wave: S.wave, wt: S.wt });
    alpha(g, um, () => { const h = J.w.handF; ln(g, h[0], h[1], h[0], h[1] - 30, 2); g.beginPath(); g.arc(h[0], h[1] - 30, 28 * um, Math.PI, 0); g.closePath(); inkFill(g, C.butter, 1.7); R.frontArm(g, J); });
    bubble(g, X + 50, -124, '别下了！', say(T, 0.6, 1.9), { tail: -26 });
    bubble(g, X + 66, -96, '伞，归我管', say(T, 4.0, 5.8), { tail: -34 });
    tickBadge(g, X - 44, -100, seg(T, 3.8, 4.2) * fade);
  });

  /* 5 孔子 · 己所不欲，勿施于人 */
  def('confucius', 7.6, '他想把一块重石头推给别人，转念一想“换作我也不想背”，于是放下，两人互相行礼。', function (g, S, T, t, fade) {
    const A = -110, B = 100, want = bump(T, 0.5, 0.9, 2.0, 2.4), think = bump(T, 2.0, 2.4, 3.8, 4.1), bow = bump(T, 4.3, 4.8, 5.8, 6.3);
    poly(g, [[-66, 0], [-72, -22], [-52, -36], [-28, -30], [-22, 0]], true); inkFill(g, '#cfcfcf', 1.7); text(g, '重', -47, -10, 11, C.muted);
    arrow(g, [[-18, -40], [20, -70], [66, -52]], { k: want * (1 - seg(T, 2.6, 2.9)), lw: 1.8, col: C.redInk });
    alpha(g, seg(T, 2.5, 2.8) * (1 - seg(T, 3.6, 3.9)), () => { ln(g, 14, -78, 30, -62, 2.6, C.redInk); ln(g, 30, -78, 14, -62, 2.6, C.redInk); });
    man(g, t, A, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : think], [P({ hF: lp([-70, -34], A, 0, 1), hB: [-4, -54], chest: [4, -89], head: [10, -113] }), want], [BOW, bow]], { wave: S.wave, wt: S.wt });
    man(g, t, B, -1, null, [[UP, bump(T, 1.2, 1.5, 2.2, 2.6)], [BOW, bow]], ORANGE);
    bubble(g, B - 30, -134, '别给我！', say(T, 1.3, 2.4), { tail: 18 });
    bubble(g, A + 54, -132, '换作我，也不想背', say(T, 2.4, 4.0), { tail: -36 });
    tickBadge(g, -4, -96, seg(T, 4.8, 5.2) * fade);
  });

  /* 6 老子 · 无为 */
  def('laozi', 8, '他去拔一棵苗想让它快长，苗蔫了；他退开等着，另外两棵自己长高了。', function (g, S, T, t, fade) {
    const r = route(T, [[0.3, 1.0, -120, -26, 1], [2.9, 3.6, -26, -120, 1]], 1), x = r.ws.x;
    const pull = bump(T, 1.0, 1.4, 6.9, 7.4), droop = seg(T, 1.9, 2.6) * fade, grow = E.soft(seg(T, 3.8, 5.6)) * fade, sunK = seg(T, 3.6, 5.8);
    alpha(g, say(T, 3.6, 6.2), () => { const p = arcPt([-60, -120], [170, -120], 46, sunK); circle(g, p[0], p[1], 11); inkFill(g, C.butterHi, 1.5); });
    const plant = (px, h, lean) => { g.save(); g.translate(px, 0); g.rotate(lean); ln(g, 0, 0, 0, -h, 2.2, C.greenInk); g.beginPath(); g.ellipse(6, -h * 0.6, 7, 3.5, -0.5, 0, TAU); inkFill(g, C.green, 1.2, C.greenInk); g.beginPath(); g.ellipse(-6, -h * 0.82, 7, 3.5, 0.5, 0, TAU); inkFill(g, C.green, 1.2, C.greenInk); g.restore(); };
    plant(14, 22 + pull * 20, droop * 1.1); plant(70, 22 + grow * 44, 0); plant(126, 22 + grow * 52, 0);
    man(g, t, x, r.sx, r.ws, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : bump(T, 3.8, 4.1, 5.4, 5.7)], [P({ hF: lp([12, -30 - pull * 14], x, 0, 1), hB: [-4, -54], chest: [6, -84], head: [14, -106] }), bump(T, 1.0, 1.3, 2.0, 2.4)], [CHEER, pop(T, 5.7, 6.1, 6.8, 7.2)]], { wave: S.wave, wt: S.wt });
    bubble(g, x + 8, -134, '快点长！', say(T, 1.1, 2.1), { tail: -4 });
    bubble(g, -86, -134, '不拔，它自己长', say(T, 5.0, 6.8), { tail: -22 });
    tickBadge(g, 98, -92, seg(T, 5.6, 6.0) * fade);
  });

  /* 7 庄子 · 梦蝶 */
  def('zhuangzi', 7.6, '他打起瞌睡，一只蝴蝶从他头上飞出去，落在花上；蝴蝶的梦里是一个小人。', function (g, S, T, t, fade) {
    const X = -90, doze = bump(T, 0.3, 1.0, 6.6, 7.2), fly = E.soft(seg(T, 1.3, 3.8)), bk = say(T, 1.2, 7.2), dream = pop(T, 4.2, 4.7, 6.6, 7.0);
    ln(g, 120, 0, 120, -46, 2, C.greenInk); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; circle(g, 120 + Math.cos(a) * 7, -50 + Math.sin(a) * 7, 5); inkFill(g, '#f7c6d9', 1.2); } circle(g, 120, -50, 3.5); inkFill(g, C.butterHi, 1.2);
    man(g, t, X, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : 0], [P({ head: [9, -108], chest: [3, -88], hF: [10, -58] }), doze]], { wave: S.wave, wt: S.wt });
    alpha(g, doze * (1 - seg(T, 5.8, 6.4)), () => { for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; alpha(g, 1 - k, () => text(g, 'z', X + 20 + k * 16, -124 - k * 26, 8 + i * 2, C.muted)); } });
    const p = fly < 1 ? [lerp(X + 8, 120, fly) + Math.sin(fly * TAU * 2) * 14, lerp(-118, -62, fly) - Math.sin(fly * Math.PI) * 44 + Math.sin(fly * TAU * 3) * 8] : [120, -62];
    alpha(g, bk, () => { const f = fly < 1 ? Math.abs(Math.sin(t * 16)) : 0.55 + 0.25 * Math.sin(t * 3); g.save(); g.translate(p[0], p[1]); [-1, 1].forEach((s) => { g.beginPath(); g.ellipse(s * 6 * f, -3, 6 * f + 0.5, 8, s * 0.4, 0, TAU); inkFill(g, C.butter, 1.3); }); ln(g, 0, -7, 0, 4, 1.8); g.restore(); });
    alpha(g, dream, () => { g.save(); g.translate(150, -118); g.scale(dream, dream); circle(g, 0, 0, 24); inkFill(g, C.paper, 1.5); circle(g, 0, -8, 5); inkFill(g, C.paper, 1.4); ln(g, 0, -3, 0, 9, 1.5); ln(g, 0, 2, -6, 7, 1.4); ln(g, 0, 2, 6, 7, 1.4); ln(g, 0, 9, -5, 17, 1.4); ln(g, 0, 9, 5, 17, 1.4); g.restore(); circle(g, 132, -88, 3.5); inkFill(g, C.paper, 1.2); circle(g, 126, -78, 2); inkFill(g, C.paper, 1.1); });
    bubble(g, 20, -150, '谁梦见了谁？', say(T, 4.8, 6.6), { tail: 30 });
  });

  /* 8 笛卡尔 · 我思故我在 */
  def('descartes', 7.6, '他把“感官”“世界”“数学”三块牌子一一打上问号；最后发现：正在怀疑的这个“我”抹不掉。', function (g, S, T, t, fade) {
    const X = -110, cards = [['感官', 30], ['世界', 92], ['数学', 154]], lit = pop(T, 4.9, 5.3, 6.8, 7.2);
    alpha(g, lit, () => { circle(g, X + 2, -102, 22 + lit * 4); g.fillStyle = C.butterSoft; g.fill(); });
    cards.forEach((c, i) => { const d = seg(T, 0.7 + i * 0.9, 1.1 + i * 0.9) * fade; ln(g, c[1] - 10, -60, c[1] - 14, 0, 1.8); ln(g, c[1] + 10, -60, c[1] + 14, 0, 1.8); box(g, c[1] - 24, -112, 48, 54, d > 0.5 ? '#ececec' : C.paper, 4); text(g, c[0], c[1], -80, 11, d > 0.5 ? C.soft : C.ink); alpha(g, d, () => text(g, '?', c[1] + 14, -96, 16, C.redInk)); });
    man(g, t, X, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : bump(T, 3.5, 3.8, 4.8, 5.0)], [POINT, bump(T, 0.5, 0.8, 3.2, 3.5)], [CHEER, lit]], { wave: S.wave, wt: S.wt });
    bubble(g, X + 56, -136, '我在怀疑……', say(T, 3.7, 5.0), { tail: -36 });
    bubble(g, X + 56, -136, '所以，我在！', say(T, 5.1, 6.9), { tail: -36 });
    sparks(g, X + 2, -128, seg(T, 4.9, 5.6), 18, 7, C.amber);
  });

  /* 9 斯宾诺莎 · 一片海 */
  def('spinoza', 7.4, '一朵浪花高高跃起说“我是独立的”，落回去才发现：它和别的浪是同一片海。', function (g, S, T, t, fade) {
    const X = -160, jump = bump(T, 0.5, 1.2, 2.2, 3.0), brace = E.soft(seg(T, 3.3, 4.0)) * fade;
    box(g, -190, -30, 70, 30, C.wood, 2);
    const yAt = (x) => -34 + Math.sin(x * 0.07 + t * 1.6) * 4 - (Math.abs(x - 20) < 26 ? jump * 46 * Math.cos((x - 20) / 26 * Math.PI / 2) : 0) - (Math.abs(x - 110) < 22 ? 9 * Math.cos((x - 110) / 22 * Math.PI / 2) : 0);
    g.beginPath(); g.moveTo(-120, 0); for (let x = -120; x <= 200; x += 5) g.lineTo(x, yAt(x)); g.lineTo(200, 0); g.closePath(); inkFill(g, '#dbeaf7', 1.7);
    text(g, '我', 20, yAt(20) - 6, 10, C.ink); text(g, '你', 110, yAt(110) - 6, 10, C.muted);
    alpha(g, brace, () => { ln(g, -116, 14, 196 - (1 - brace) * 300, 14, 2, C.amber); ln(g, -116, 8, -116, 20, 2, C.amber); if (brace > 0.9) ln(g, 196, 8, 196, 20, 2, C.amber); text(g, '同一片海', 40, 30, 11, C.amber); });
    g.save(); g.translate(0, -30); man(g, t, X, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : 0], [POINT, bump(T, 3.4, 3.8, 5.4, 5.8)]], { wave: S.wave, wt: S.wt }); g.restore();
    bubble(g, 56, -112, '我是独立的！', say(T, 0.9, 2.3), { tail: -30 });
    bubble(g, -104, -168, '浪，是海的样子', say(T, 4.0, 6.0), { tail: -40 });
  });

  /* 10 莱布尼茨 · 充足理由律 */
  def('leibniz', 7.6, '他推倒第一块骨牌，一块接一块倒下去，最后敲响了铃：每一下都有前一下作理由。', function (g, S, T, t, fade) {
    const r = route(T, [[0.3, 0.8, -150, -92, 1], [6.5, 7.2, -92, -150, 1]], 1), x = r.ws.x, N = 6, ring = seg(T, 3.0, 3.6);
    for (let i = 0; i < N; i++) { const k = E.in(seg(T, 1.2 + i * 0.28, 1.6 + i * 0.28)) * fade; g.save(); g.translate(-52 + i * 28, 0); g.rotate(k * 1.05); box(g, -4, -44, 8, 44, i % 2 ? C.butter : C.paper, 2); g.restore(); alpha(g, seg(T, 4.0 + (N - 1 - i) * 0.18, 4.3 + (N - 1 - i) * 0.18) * fade, () => text(g, '∵', -40 + i * 28, -62, 11, C.amber)); }
    ln(g, 140, 0, 140, -96, 2.2); ln(g, 140, -96, 116, -96, 2.2); g.save(); g.translate(116, -92); g.rotate(Math.sin(t * 22) * 0.3 * (ring > 0 && ring < 1 ? 1 : 0)); poly(g, [[-11, 22], [-8, 2], [8, 2], [11, 22]], true); inkFill(g, C.butterHi, 1.6); circle(g, 0, 25, 3); inkFill(g, C.ink, 1); g.restore();
    sparks(g, 116, -80, ring, 18, 7, C.amber);
    man(g, t, x, r.sx, r.ws, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : bump(T, 4.0, 4.3, 5.6, 5.9)], [P({ hF: lp([-56, -40], x, 0, 1), hB: [-4, -54], chest: [4, -89], head: [10, -113] }), bump(T, 0.8, 1.1, 1.6, 2.0)]], { wave: S.wave, wt: S.wt });
    bubble(g, -100, -138, '每一下，都有原因', say(T, 4.3, 6.3), { tail: -20 });
  });

  /* 11 洛克 · 白板 */
  def('locke', 7.4, '一块空白的板子；“红”“圆”“甜”从苹果那边一个个飞来落在板上，板上才有了苹果。', function (g, S, T, t, fade) {
    const X = -50, B = { x: 40, y: -150, w: 130, h: 96 }, items = [['红', '#fbc4c4'], ['圆', C.butter], ['甜', C.green]], done = pop(T, 3.6, 4.0, 6.6, 7.0);
    box(g, -168, -30, 36, 30, C.wood, 3); circle(g, -150, -42, 12); inkFill(g, '#f28b82', 1.6); ln(g, -150, -54, -147, -61, 1.6, C.umber);
    ln(g, B.x + 20, B.y + B.h, B.x + 10, 0, 2.2); ln(g, B.x + B.w - 20, B.y + B.h, B.x + B.w - 10, 0, 2.2); box(g, B.x, B.y, B.w, B.h, C.paper, 6, 1.7);
    alpha(g, 1 - seg(T, 0.8, 1.4) * fade, () => text(g, '（空白）', B.x + B.w / 2, B.y + B.h / 2 + 4, 10, C.faint));
    alpha(g, done, () => { circle(g, B.x + 96, B.y + 56, 17 * done); inkFill(g, '#f28b82', 1.6); ln(g, B.x + 96, B.y + 39, B.x + 100, B.y + 30, 1.6, C.umber); });
    man(g, t, X, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : 0], [P({ head: [4, -117] }), bump(T, 0.5, 0.8, 3.2, 3.5)], [POINT, bump(T, 3.7, 4.0, 5.6, 6.0)]], { wave: S.wave, wt: S.wt });
    items.forEach((it, i) => { const k = E.soft(seg(T, 0.6 + i * 0.85, 1.6 + i * 0.85)), p = arcPt([-150, -60], [B.x + 26, B.y + 24 + i * 24], 70, k); alpha(g, seg(T, 0.6 + i * 0.85, 0.8 + i * 0.85) * fade, () => pill(g, p[0], p[1], it[0], it[1], C.ink, 10)); });
    bubble(g, X - 6, -138, '都是经验写上去的', say(T, 4.2, 6.2), { tail: 8 });
  });

  /* 12 休谟 · 因果 */
  def('hume', 7.8, '白球撞红球，红球滚走，一连三次。他数着次数，却找不到那条叫“必然”的线。', function (g, S, T, t, fade) {
    const X = 150, c = T < 0 ? 0 : clamp((T - 0.3) / 1.4, 0, 3), n = Math.min(3, Math.floor(c)), u = c - Math.floor(c), run = T >= 0.3 && c < 3;
    box(g, -170, -44, 250, 8, '#cfe8d6', 2); ln(g, -160, -36, -164, 0, 2.2); ln(g, 70, -36, 74, 0, 2.2);
    const ax = run ? lerp(-150, -62, E.in(Math.min(1, u / 0.45))) : -150, bx = run && u > 0.45 ? lerp(-44, 50, E.out3((u - 0.45) / 0.55)) : -44;
    circle(g, ax, -53, 9); inkFill(g, C.paper, 1.7); circle(g, bx, -53, 9); inkFill(g, '#f28b82', 1.7);
    sparks(g, -53, -56, run ? seg(u, 0.45, 0.7) : 0, 12, 5, C.amber);
    alpha(g, say(T, 0.4, 7.3), () => sign(g, -50, -150, '见过 ' + Math.min(3, n + (run && u > 0.45 ? 1 : 0)) + ' 次', C.butterSoft, C.umber));
    alpha(g, bump(T, 4.8, 5.2, 6.8, 7.2), () => { g.save(); g.setLineDash([4, 4]); ln(g, -130, -84, 30, -84, 1.6, C.redInk); g.restore(); text(g, '必然？', -50, -92, 11, C.redInk); });
    man(g, t, X, -1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : bump(T, 4.6, 4.9, 6.6, 7.0)], [POINT, bump(T, 0.4, 0.7, 4.3, 4.6)]], { wave: S.wave, wt: S.wt });
    bubble(g, X - 62, -134, '只见相继，不见必然', say(T, 5.0, 7.0), { tail: 44 });
  });

  /* 13 霍布斯与卢梭 · 社会契约 */
  def('hobbes_rousseau', 7.6, '两个人举着棍子对峙；他们把棍子交到中间的架子上，立下一纸契约，然后握手。', function (g, S, T, t, fade) {
    const ra = route(T, [[3.0, 3.6, -120, -30, 1], [6.3, 7.0, -30, -120, 1]], 1), rb = route(T, [[3.0, 3.6, 120, 30, -1], [6.3, 7.0, 30, 120, -1]], -1);
    const fight = bump(T, 0.3, 0.7, 1.7, 2.1), rack = seg(T, 2.2, 2.6) * fade, scroll = pop(T, 2.8, 3.2, 6.4, 6.9), shake = bump(T, 3.6, 3.9, 5.4, 5.8);
    ln(g, -8, 0, -8, -52, 2); ln(g, 8, 0, 8, -52, 2); ln(g, -12, -52, 12, -52, 2);
    alpha(g, rack, () => { ln(g, -14, -8, 10, -84, 3, C.umber); ln(g, 14, -8, -10, -84, 3, '#a8553a'); });
    alpha(g, scroll, () => { box(g, -26, -158, 52, 30, C.butterSoft, 3); text(g, '契约', 0, -138, 11, C.umber); });
    const stick = (col) => (gg, J) => R.held(gg, J, (h) => alpha(gg, 1 - rack, () => ln(gg, h[0], h[1] + 6, h[0] + J.sx * (6 + fight * 4), h[1] - 40, 3, col)));
    man(g, t, ra.ws.x, ra.sx, ra.ws, [[UP, fight], [P({ hF: lp([-4, -70], ra.ws.x, 0, 1), hB: [-4, -54] }), shake]], { wave: S.wave, wt: S.wt, held: stick(C.umber) });
    man(g, t, rb.ws.x, rb.sx, rb.ws, [[UP, fight], [P({ hF: lp([4, -70], rb.ws.x, 0, -1), hB: [-4, -54] }), shake]], Object.assign({ held: stick('#a8553a') }, ORANGE));
    alpha(g, fight, () => { text(g, '!', -92, -136, 20, C.redInk); text(g, '!', 92, -136, 20, C.redInk); });
    sparks(g, 0, -76, seg(T, 3.9, 4.5), 14, 6, C.amber);
    bubble(g, 96, -128, '各让一步，都安全', say(T, 4.2, 6.0), { tail: -40 });
  });

  /* 14 康德 · 认识的框架 */
  def('kant', 7.6, '他面前是一团乱麻；他在眼前架起一个带格子的框，透过它，那团东西成了整齐的方块。', function (g, S, T, t, fade) {
    const X = -120, fr = pop(T, 0.9, 1.4, 6.6, 7.1), tidy = E.soft(seg(T, 1.8, 3.0)) * fade;
    alpha(g, 1 - tidy * 0.85, () => { g.beginPath(); for (let i = 0; i <= 70; i++) { const a = i * 0.9, rr2 = 10 + (i * 37 % 23); const px = 130 + Math.cos(a) * rr2 + Math.sin(i * 2.3 + t) * 2, py = -72 + Math.sin(a * 1.3) * rr2 * 0.9; if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.strokeStyle = C.muted; g.lineWidth = 1.4; g.stroke(); });
    alpha(g, tidy, () => { box(g, 104, -98, 52, 52, C.butterSoft, 2, 1.7); for (let i = 1; i < 3; i++) { ln(g, 104 + i * 17.3, -98, 104 + i * 17.3, -46, 1.1, C.amber); ln(g, 104, -98 + i * 17.3, 156, -98 + i * 17.3, 1.1, C.amber); } });
    text(g, tidy > 0.5 ? '现象' : '?', 130, -112, 11, tidy > 0.5 ? C.umber : C.muted);
    alpha(g, fr, () => { g.save(); g.translate(0, -84); g.scale(fr, fr); ln(g, 0, 40, 0, 84, 2.2); rr(g, -30, -40, 60, 80, 4); inkFill(g, 'rgba(238,242,246,.55)', 1.8); for (let i = 1; i < 3; i++) { ln(g, -30 + i * 20, -40, -30 + i * 20, 40, 1.1, '#7fa6c9'); ln(g, -30, -40 + i * 26.6, 30, -40 + i * 26.6, 1.1, '#7fa6c9'); } text(g, '时间 · 空间 · 因果', 0, -48, 8.5, '#52708c'); g.restore(); });
    man(g, t, X, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : bump(T, 0.3, 0.5, 0.9, 1.1)], [POINT, bump(T, 1.0, 1.3, 3.4, 3.8)], [CHEER, pop(T, 3.9, 4.3, 5.2, 5.6)]], { wave: S.wave, wt: S.wt });
    bubble(g, X + 20, -140, '世界进来，先过我的框', say(T, 3.4, 5.8), { tail: -10 });
  });

  /* 15 黑格尔 · 正反合 */
  def('hegel', 7.8, '两个人各推一块方块撞在一起；两块没有碎，而是合成更高处的一块新的。', function (g, S, T, t, fade) {
    const ra = route(T, [[0.3, 1.5, -160, -64, 1], [6.5, 7.3, -64, -160, 1]], 1), rb = route(T, [[0.3, 1.5, 160, 64, -1], [6.5, 7.3, 64, 160, -1]], -1);
    const merge = E.soft(seg(T, 1.7, 2.4)) * (1 - seg(T, 6.0, 6.5)), rise = E.out3(seg(T, 2.4, 3.4)), push = bump(T, 0.3, 0.6, 1.6, 2.0) + bump(T, 6.5, 6.7, 7.2, 7.4);
    const blk = (x, lab, fill) => alpha(g, 1 - merge, () => { box(g, x - 20, -40, 40, 40, fill, 4, 1.7); text(g, lab, x, -15, 14, C.ink); });
    blk(ra.ws.x + 40, '正', C.butter); blk(rb.ws.x - 40, '反', '#f6c7b8');
    alpha(g, merge, () => { const y = -52 - rise * 62; ln(g, -30, 0, -30, y + 52, 1.6, C.faint); ln(g, 30, 0, 30, y + 52, 1.6, C.faint); box(g, -28, y, 56, 52, C.green, 5, 1.8); text(g, '合', 0, y + 33, 17, C.greenInk); });
    arrow(g, [[46, -44], [46, -112]], { k: seg(T, 2.5, 3.3) * fade, lw: 1.8, col: C.amber });
    sparks(g, 0, -24, seg(T, 1.5, 2.1), 20, 8, C.amber);
    const pp = (x, sx) => P({ hF: lp([x + sx * 22, -30], x, 0, sx), hB: lp([x + sx * 20, -16], x, 0, sx), chest: [5, -88], head: [12, -112] });
    man(g, t, ra.ws.x, ra.sx, ra.ws, [[pp(ra.ws.x, 1), push], [CHEER, pop(T, 3.5, 3.9, 5.2, 5.6)]], { wave: S.wave, wt: S.wt });
    man(g, t, rb.ws.x, rb.sx, rb.ws, [[pp(rb.ws.x, -1), push], [CHEER, pop(T, 3.6, 4.0, 5.2, 5.6)]], ORANGE);
    bubble(g, -120, -140, '冲突没有消失，被带上去了', say(T, 4.0, 6.0), { tail: 20 });
  });

  /* 16 马克思 · 基础与上层 */
  def('marx', 7.8, '他把“手推磨”那块底座换成“蒸汽机”，底座上面的房子跟着换了模样。', function (g, S, T, t, fade) {
    const k = E.soft(seg(T, 0.9, 2.4)) * fade, r = route(T, [[0.9, 2.4, -170, -42, 1], [6.6, 7.4, -42, -170, 1]], 1), x = T >= 6.6 ? r.ws.x : lerp(-170, -42, k), nb = lerp(-98, 60, k), flip = seg(T, 2.5, 3.1) * fade;
    alpha(g, 1 - k, () => { box(g, lerp(5, 120, k), -30, 110, 30, C.wood, 3, 1.7); text(g, '手推磨', lerp(60, 175, k), -11, 11, C.umber); });
    alpha(g, Math.max(k, 0.001) > 0.02 ? 1 : 0, () => { box(g, nb - 55, -30, 110, 30, C.steel, 3, 1.7); text(g, '蒸汽机', nb, -11, 11, C.ink); });
    g.save(); g.translate(60, -30); g.scale(1, 1 - Math.sin(flip * Math.PI) * 0.75); box(g, -34, -52, 68, 52, flip > 0.5 ? '#eef2f6' : C.butterSoft, 3, 1.7);
    if (flip > 0.5) { box(g, 14, -78, 10, 26, '#eef2f6', 1, 1.5); text(g, '工厂主的法', 0, -22, 10, C.ink); } else { poly(g, [[-40, -52], [0, -80], [40, -52]], true); inkFill(g, C.butter, 1.7); text(g, '领主的法', 0, -22, 10, C.umber); } g.restore();
    text(g, '上层建筑', 60, -166, 9, C.muted); text(g, '经济基础', 60, 16, 9, C.muted);
    man(g, t, x, T >= 6.6 ? r.sx : 1, T >= 6.6 || (T >= 0.9 && T < 2.4) ? r.ws : null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : 0], [P({ hF: lp([x + 26, -22], x, 0, 1), hB: lp([x + 24, -12], x, 0, 1), chest: [5, -88], head: [12, -112] }), bump(T, 0.6, 0.9, 2.4, 2.8)], [POINT, bump(T, 3.2, 3.5, 5.4, 5.8)]], { wave: S.wave, wt: S.wt });
    sparks(g, 60, -100, seg(T, 2.8, 3.4), 20, 7, C.amber);
    bubble(g, -110, -140, '底座一换，上面跟着变', say(T, 3.4, 5.8), { tail: 24 });
  });

  /* 17 叔本华与克尔凯郭尔 · 钟摆 */
  def('schopenhauer_kierkegaard', 7.8, '钟摆在“想要的痛苦”和“得到后的无聊”之间来回；响起音乐的那一刻，它停了一会儿。', function (g, S, T, t, fade) {
    const X = -150, still = E.soft(seg(T, 4.2, 4.9)) * (1 - seg(T, 6.8, 7.3)), amp = (T < 0 ? 0.22 : lerp(0.22, 0.62, seg(T, 0.2, 0.9) * fade)) * (1 - still), a = Math.sin(t * 2.4) * amp, px = 30 + Math.sin(a) * 104, py = -168 + Math.cos(a) * 104;
    ln(g, -40, -168, 100, -168, 2.4); ln(g, 30, -168, px, py, 1.8); circle(g, px, py, 11); inkFill(g, still > 0.5 ? C.green : C.butterHi, 1.7);
    sign(g, -52, -22, '痛苦 · 想要', a < -0.25 ? C.red : C.paper, a < -0.25 ? C.redInk : C.muted, 9.5); sign(g, 116, -22, '无聊 · 得到', a > 0.25 ? '#e4e6e9' : C.paper, C.muted, 9.5);
    alpha(g, pop(T, 4.0, 4.4, 6.6, 7.0), () => { for (let i = 0; i < 3; i++) { const k = (t * 0.45 + i / 3) % 1; alpha(g, 1 - k, () => text(g, i % 2 ? '♪' : '♫', X + 26 + k * 30 + i * 6, -122 - k * 34, 15, C.amber)); } });
    man(g, t, X, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : bump(T, 1.2, 1.5, 3.6, 4.0)], [P({ head: [3, -119], hF: [16, -70], hB: [-10, -66] }), still]], { wave: S.wave, wt: S.wt });
    bubble(g, X + 74, -132, '要不到，苦；要到了，腻', say(T, 1.4, 3.8), { tail: -60 });
    bubble(g, X + 60, -132, '这一刻，它停了', say(T, 4.9, 6.8), { tail: -46 });
  });

  /* 18 尼采 · 精神三变 */
  def('nietzsche', 8, '他先驮着写有“你应当”的箱子走（骆驼），再把它摔在地上喊“不”（狮子），最后自己玩起一个球（孩子）。', function (g, S, T, t, fade) {
    const r = route(T, [[0.3, 1.9, -150, -20, 1], [7.0, 7.7, -20, -150, 1]], 1), x = r.ws.x, drop = E.in(seg(T, 2.1, 2.5)), gone = seg(T, 3.6, 4.2), stage = T < 0 ? -1 : T < 2.1 ? 0 : T < 3.8 ? 1 : T < 7 ? 2 : -1;
    ['骆驼', '狮子', '孩子'].forEach((n, i) => sign(g, -80 + i * 80, -170, n, stage === i ? C.butter : C.paper, stage === i ? C.umber : C.soft, 10));
    const carry = bump(T, 0.2, 0.5, 2.0, 2.2), J = man(g, t, x, r.sx, r.ws, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : 0], [P({ chest: [8, -84], head: [18, -104], hF: [-8, -70], hB: [-12, -72] }), carry], [UP, bump(T, 2.3, 2.5, 3.2, 3.6)], [CHEER, pop(T, 4.3, 4.7, 6.2, 6.6)]], { wave: S.wave, wt: S.wt });
    const bx = lerp(x - 30, 44, drop), by = lerp(-104, -30, drop);
    alpha(g, (T < 0 ? 0 : seg(T, 0.2, 0.5)) * (1 - gone), () => { g.save(); g.translate(bx, by); g.rotate(drop * 0.22); box(g, -24, 0, 48, 30, C.steel, 3, 1.7); text(g, '你应当', 0, 19, 10, C.ink); if (drop >= 1) { ln(g, -4, 0, 2, 10, 1.6); ln(g, 2, 10, -6, 20, 1.6); ln(g, -6, 20, 0, 30, 1.6); } g.restore(); });
    sparks(g, 44, -6, seg(T, 2.5, 3.0), 18, 7, C.muted);
    alpha(g, pop(T, 4.2, 4.6, 6.6, 7.0), () => { const k = (t * 1.1) % 1, y = -14 - Math.abs(Math.sin(k * Math.PI)) * 70; circle(g, 46, y, 12); inkFill(g, C.butterHi, 1.7); text(g, '我要', 46, y + 4, 8.5, C.umber); });
    bubble(g, x - 34, -128, '不！', say(T, 2.4, 3.6), { tail: 20 });
  });

  /* 19 维特根斯坦 · 语言游戏 */
  def('wittgenstein', 8, '工头喊“石板！”，助手就搬来一块；工头换个语气问“石板？”，助手答的却是“还剩两块”。同一个词，两种用法。', function (g, S, T, t, fade) {
    const A = -150, rb = route(T, [[1.6, 2.7, 110, -52, -1], [6.8, 7.6, -52, 110, -1]], -1), bx = rb.ws.x, laid = seg(T, 2.9, 3.2) * fade, carry = T >= 1.3 && T < 3.0 ? bump(T, 1.3, 1.6, 2.8, 3.0) : 0;
    const slab = (x, y, a) => alpha(g, a, () => box(g, x - 18, y - 6, 36, 6, '#d9d9d9', 1.5, 1.5));
    slab(-86, 0, 1); slab(-86, -6, 1); slab(-86, -12, laid); slab(150, 0, 1); slab(150, -6, 1); slab(150, -12, 1 - (T >= 1.5 ? fade : 0));
    man(g, t, A, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : bump(T, 3.8, 4.1, 5.0, 5.3)], [POINT, bump(T, 0.3, 0.6, 1.4, 1.7)]], { wave: S.wave, wt: S.wt });
    const J = man(g, t, bx, rb.sx, rb.ws, [[P({ hF: [22, -66], hB: [14, -62] }), carry], [P({ hF: lp([-80, -18], bx, 0, -1), hB: [-4, -54], chest: [6, -86], head: [14, -108] }), bump(T, 2.7, 2.9, 3.2, 3.5)], [POINT, bump(T, 5.1, 5.4, 6.4, 6.7)]], ORANGE);
    alpha(g, carry * (1 - laid), () => { const h = J.w.handF; box(g, h[0] - 18, h[1] - 4, 36, 6, '#d9d9d9', 1.5, 1.5); R.frontArm(g, J); });
    bubble(g, A + 40, -134, '石板！', say(T, 0.4, 1.6), { tail: -20 }); tickBadge(g, -112, -30, seg(T, 3.1, 3.5) * (1 - seg(T, 4.2, 4.6)));
    bubble(g, A + 40, -134, '石板？', say(T, 3.9, 5.1), { tail: -20 });
    bubble(g, bx + 44, -134, '还剩两块', say(T, 5.2, 6.7), { tail: -24 });
  });

  /* 20 海德格尔与萨特 · 存在先于本质 */
  def('heidegger_sartre', 7.8, '裁纸刀是先有图纸、后有刀；人身边的牌子却是空的——他提起笔，自己写上了字。', function (g, S, T, t, fade) {
    const X = 40, look = bump(T, 0.3, 0.6, 2.0, 2.3), write = bump(T, 3.0, 3.4, 4.8, 5.2), wk = seg(T, 3.4, 4.6) * fade, TG = { x: X + 28, y: -124, w: 78, h: 26 };
    box(g, -150, -40, 60, 40, C.wood, 3, 1.7); poly(g, [[-140, -44], [-104, -54], [-100, -48], [-140, -40]], true); inkFill(g, C.steel, 1.5);
    box(g, -160, -128, 80, 34, '#eef2f6', 3, 1.5); text(g, '图纸：用来裁纸', -120, -107, 9, '#52708c'); arrow(g, [[-120, -92], [-120, -62]], { k: seg(T, 0.6, 1.2) * fade + (T < 0 ? 1 : 0), lw: 1.6, col: '#52708c' });
    text(g, '先有用途，才有刀', -120, 18, 9, C.muted);
    const J = man(g, t, X, T >= 0.3 && T < 2.2 ? -1 : 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : bump(T, 2.2, 2.5, 3.0, 3.2)], [POINT, look], [P({ hF: lp([TG.x + 4 + wk * 30, TG.y + 16], X, 0, 1), hB: [-4, -54], head: [6, -117] }), write], [CHEER, pop(T, 5.0, 5.4, 6.6, 7.0)]], { wave: S.wave, wt: S.wt });
    g.save(); g.setLineDash(wk > 0.95 ? [] : [4, 3]); rr(g, TG.x, TG.y, TG.w, TG.h, 4); inkFill(g, wk > 0.95 ? C.butter : C.paper, 1.5, wk > 0.95 ? C.ink : C.soft); g.restore();
    if (wk <= 0) text(g, '？', TG.x + TG.w / 2, TG.y + 18, 12, C.soft);
    else { g.save(); g.beginPath(); g.rect(TG.x, TG.y, TG.w * wk, TG.h); g.clip(); text(g, '我来决定', TG.x + TG.w / 2, TG.y + 18, 11.5, C.umber); g.restore(); }
    R.frontArm(g, J);
    sparks(g, TG.x + TG.w / 2, TG.y - 6, seg(T, 4.7, 5.3), 18, 7, C.amber);
    bubble(g, X - 62, -150, '没人给我图纸', say(T, 2.2, 3.4), { tail: 40 });
  });
})();
