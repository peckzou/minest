// 哲学家小岛 · 火柴人小剧场（二）— halls 21–43: the modern & contemporary district and the social-science island.
// Same helpers and style as scenes-top20.js; load after stick.js.
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

  const cross = (g, x, y, r, a) => alpha(g, a, () => { ln(g, x - r, y - r, x + r, y + r, 2.6, C.redInk); ln(g, x + r, y - r, x - r, y + r, 2.6, C.redInk); });
  const dot = (g, x, y, r, fill) => { circle(g, x, y, r); inkFill(g, fill || C.paper, 1.4); };
  const coin = (g, x, y) => { circle(g, x, y, 7); inkFill(g, C.butterHi, 1.5); text(g, '¥', x, y + 3.5, 8.5, C.umber); };

  /* 21 培根 · 四假相 */
  def('bacon', 7.6, '他隔着四片有色镜看一颗星，星是糊的；他把镜片一片片摘掉，星才清楚。', function (g, S, T, t, fade) {
    const X = -130, L = [['种族', '#fbc4c4'], ['洞穴', C.butter], ['市场', C.green], ['剧场', '#cfe0f5']], clear = seg(T, 4.2, 4.8) * fade;
    alpha(g, 1 - clear, () => { circle(g, 150, -110, 22); g.fillStyle = '#e3e3e3'; g.fill(); text(g, '?', 150, -104, 16, C.muted); });
    alpha(g, clear, () => { R.star(g, 150, -110, 18, 5); inkFill(g, C.butterHi, 1.6); });
    L.forEach((l, i) => { const off = E.in(seg(T, 1.0 + i * 0.75, 1.5 + i * 0.75)) * fade, x = -50 + i * 38; alpha(g, 1 - off, () => { g.save(); g.translate(x, -98 - off * 70); g.rotate(off * (i % 2 ? 1 : -1)); ln(g, 0, 18, 0, 98, 1.6, C.soft); circle(g, 0, 0, 18); inkFill(g, l[1], 1.6); text(g, l[0], 0, 4, 9, C.ink); g.restore(); }); });
    man(g, t, X, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : 0], [POINT, bump(T, 0.6, 0.9, 4.0, 4.3)], [CHEER, pop(T, 4.7, 5.1, 6.2, 6.6)]], { wave: S.wave, wt: S.wt });
    bubble(g, X + 40, -138, '怎么是糊的？', say(T, 0.3, 1.2), { tail: -24 });
    bubble(g, X + 46, -138, '先摘掉自己的镜片', say(T, 4.9, 6.8), { tail: -30 });
  });

  /* 22 密尔 · 伤害原则 */
  def('mill', 7.6, '他在自己这边怎么跳都行；手一伸过线、快碰到别人，就被叫停。', function (g, S, T, t, fade) {
    const r = route(T, [[2.6, 3.3, -100, -24, 1], [6.6, 7.3, -24, -100, 1]], 1), x = r.ws.x, B = 70, over = bump(T, 3.3, 3.6, 5.6, 6.0);
    g.save(); g.setLineDash([5, 5]); ln(g, 20, 0, 20, -160, 1.8, C.soft); g.restore(); text(g, '我的事', -100, -170, 10, C.muted); text(g, '别人', 100, -170, 10, C.muted);
    man(g, t, x, r.sx, r.ws, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : 0], [CHEER, pop(T, 0.4, 0.8, 2.0, 2.4)], [P({ hF: [44, -96], hB: [-4, -54], head: [10, -116], chest: [4, -90] }), over]], { wave: S.wave, wt: S.wt });
    man(g, t, B, -1, null, [[UP, bump(T, 3.6, 3.9, 5.4, 5.8)]], ORANGE);
    for (let i = 0; i < 3; i++) alpha(g, bump(T, 0.6, 0.9, 1.9, 2.3) * (1 - ((t * 0.6 + i / 3) % 1)), () => text(g, '♪', -128 + i * 26, -128 - ((t * 0.6 + i / 3) % 1) * 24, 13, C.amber));
    tickBadge(g, -140, -96, seg(T, 1.0, 1.4) * (1 - seg(T, 2.4, 2.8)));
    cross(g, 20, -92, 9, over);
    bubble(g, B + 52, -134, '到这儿为止', say(T, 3.8, 5.6), { tail: -40 });
  });

  /* 23 弗雷格 · 意义与指称 */
  def('frege', 7.4, '“晨星”和“暮星”是两块牌子，两条线却指向天上同一颗星。', function (g, S, T, t, fade) {
    const X = 0, k1 = seg(T, 0.8, 1.7) * fade, k2 = seg(T, 2.2, 3.1) * fade, same = pop(T, 3.4, 3.9, 6.4, 6.9);
    R.star(g, 0, -160, 12 + same * 4, 5); inkFill(g, same > 0.5 ? C.butterHi : C.paper, 1.6);
    ln(g, -150, 0, -150, -60, 2); sign(g, -150, -74, '晨星', C.butterSoft, C.umber, 11); ln(g, 150, 0, 150, -60, 2); sign(g, 150, -74, '暮星', '#dfe6f5', '#3a4a6b', 11);
    arrow(g, [[-132, -90], [-80, -140], [-16, -158]], { k: k1, lw: 1.7, col: C.amber }); arrow(g, [[132, -90], [80, -140], [16, -158]], { k: k2, lw: 1.7, col: '#52708c' });
    man(g, t, X, T >= 0.5 && T < 2.0 ? -1 : 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : 0], [POINT, bump(T, 0.6, 0.9, 1.7, 2.0) + bump(T, 2.1, 2.4, 3.1, 3.4)], [CHEER, pop(T, 3.6, 4.0, 5.2, 5.6)]], { wave: S.wave, wt: S.wt });
    sparks(g, 0, -160, seg(T, 3.4, 4.1), 20, 8, C.amber);
    bubble(g, 86, -112, '两个名字，同一颗星', say(T, 4.0, 6.2), { tail: -60 });
  });

  /* 24 罗素 · 摹状词 */
  def('russell', 7.6, '“当今法国国王是秃头”：他把这句话拆成三块，第一块“有一个国王”就是假的。', function (g, S, T, t, fade) {
    const X = -140, sp = E.soft(seg(T, 1.4, 2.2)) * fade, P3 = ['有一个国王', '只有一个', '他是秃头'], bad = seg(T, 3.0, 3.4) * fade;
    alpha(g, 1 - sp, () => { box(g, -70, -150, 220, 30, C.paper, 5, 1.7); text(g, '当今法国国王是秃头', 40, -130, 11.5, C.ink); });
    P3.forEach((p, i) => alpha(g, sp, () => { const y = -150 + i * 38 * sp; box(g, -40, y, 160, 28, i === 0 && bad > 0.5 ? C.red : C.butterSoft, 5, 1.6); text(g, p, 40, y + 19, 11, i === 0 && bad > 0.5 ? C.redInk : C.umber); }));
    cross(g, 140, -136, 8, bad); alpha(g, seg(T, 3.8, 4.2) * fade, () => sign(g, 40, -22, '所以整句：假', C.paper, C.redInk, 11));
    man(g, t, X, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : bump(T, 0.3, 0.6, 1.2, 1.4)], [POINT, bump(T, 1.3, 1.6, 3.6, 4.0)], [NOD, bump(T, 4.2, 4.5, 5.6, 6.0)]], { wave: S.wave, wt: S.wt });
    bubble(g, X + 26, -140, '是真是假？', say(T, 0.3, 1.3), { tail: -14 });
  });

  /* 25 皮尔士与杜威 · 做中学 */
  def('peirce_dewey', 8, '他把积木叠得又高又窄，倒了；想了想，把底座放宽重搭，站住了。', function (g, S, T, t, fade) {
    const r = route(T, [[0.3, 0.9, -150, -70, 1], [7.0, 7.7, -70, -150, 1]], 1), x = r.ws.x, fall = E.in(seg(T, 1.6, 2.1)), re = E.soft(seg(T, 3.8, 5.0)) * fade, gone = seg(T, 3.4, 3.8);
    alpha(g, 1 - gone, () => { g.save(); g.translate(20, 0); g.rotate(fall * 1.5); for (let i = 0; i < 4; i++) box(g, -10, -24 - i * 24, 20, 24, i % 2 ? C.butter : C.paper, 2, 1.6); g.restore(); });
    alpha(g, re, () => { [[0, 0], [24, 0], [48, 0], [12, 1], [36, 1], [24, 2]].forEach((b, i) => alpha(g, seg(re, i / 7, (i + 1) / 7), () => box(g, 60 + b[0], -24 - b[1] * 24, 24, 24, i % 2 ? C.butter : C.paper, 2, 1.6))); });
    man(g, t, x, r.sx, r.ws, [[P({ hF: lp([8, -70], x, 0, 1), hB: [-4, -54], chest: [4, -89], head: [10, -113] }), bump(T, 0.9, 1.2, 1.6, 1.9)], [CHIN, T < 0 ? pulse(t, 6, 2, 2) : bump(T, 2.3, 2.6, 3.6, 3.9)], [POINT, bump(T, 3.9, 4.2, 5.0, 5.3)], [CHEER, pop(T, 5.3, 5.7, 6.5, 6.9)]], { wave: S.wave, wt: S.wt });
    alpha(g, bump(T, 2.2, 2.5, 3.5, 3.8), () => text(g, '?', x + 4, -132, 22, C.amber));
    tickBadge(g, 134, -70, seg(T, 5.1, 5.5) * fade);
    bubble(g, x - 40, -136, '试了，才知道哪里不对', say(T, 5.4, 6.9), { tail: 30 });
  });

  /* 26 波普尔 · 证伪 */
  def('popper', 7.6, '“天鹅都是白的”——白天鹅一只只游来，他数得很高兴；一只黑天鹅出现，牌子就倒了。', function (g, S, T, t, fade) {
    const X = -150, n = Math.min(3, Math.floor(clamp((T - 0.5) / 0.8, 0, 3))), black = E.soft(seg(T, 3.4, 4.2)) * fade, down = E.in(seg(T, 4.3, 4.8)) * fade;
    g.save(); g.translate(-60, 0); g.rotate(down * 0.42); ln(g, 0, 0, 0, -110, 2); box(g, -56, -150, 112, 36, down > 0.5 ? C.red : C.paper, 4, 1.7); text(g, '天鹅都是白的', 0, -127, 11, down > 0.5 ? C.redInk : C.ink); g.restore();
    box(g, 20, -10, 180, 10, '#dbeaf7', 3, 1.4);
    const swan = (x, fill, a) => alpha(g, a, () => { g.beginPath(); g.ellipse(x, -18, 13, 8, 0, 0, TAU); inkFill(g, fill, 1.5); ln(g, x + 9, -22, x + 12, -36, 2.4, fill === C.paper ? C.ink : '#333'); dot(g, x + 14, -38, 3.5, fill); });
    for (let i = 0; i < 3; i++) swan(50 + i * 34, C.paper, T < 0 ? 0 : seg(T, 0.5 + i * 0.8, 0.9 + i * 0.8) * fade);
    swan(lerp(210, 164, black), '#333', black > 0 ? 1 : 0);
    alpha(g, say(T, 0.6, 4.2), () => sign(g, 110, -70, '证实 ×' + Math.max(1, n), C.butterSoft, C.umber, 10));
    man(g, t, X, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : bump(T, 4.9, 5.2, 6.4, 6.8)], [POINT, bump(T, 0.5, 0.8, 3.0, 3.3)], [UP, bump(T, 3.9, 4.1, 4.7, 5.0)]], { wave: S.wave, wt: S.wt });
    bubble(g, X + 60, -96, '一只就够了', say(T, 5.0, 6.8), { tail: -44 });
  });

  /* 27 库恩 · 范式转换 */
  def('kuhn', 7.8, '旧框子装得下原来的点；框外的反常越堆越多，最后他换了一个新框，全都装进去了。', function (g, S, T, t, fade) {
    const X = -150, sh = E.soft(seg(T, 3.6, 4.6)) * fade, bx = lerp(-40, -40, sh), bw = lerp(70, 200, sh);
    rr(g, bx, -140, bw, 80, lerp(4, 40, sh)); inkFill(g, sh > 0.5 ? 'rgba(198,235,201,.5)' : 'rgba(254,243,199,.6)', 1.8, sh > 0.5 ? C.greenInk : C.umber);
    text(g, sh > 0.5 ? '新范式' : '旧范式', bx + bw / 2, -148, 10, sh > 0.5 ? C.greenInk : C.umber);
    [[-22, -110], [-4, -86], [12, -118], [-14, -72]].forEach((p) => dot(g, p[0], p[1], 5, C.paper));
    [[70, -112], [104, -84], [132, -116]].forEach((p, i) => alpha(g, seg(T, 0.8 + i * 0.7, 1.1 + i * 0.7) * fade, () => { dot(g, p[0], p[1], 5, sh > 0.6 ? C.paper : '#f28b82'); if (sh < 0.5) text(g, '!', p[0], p[1] - 9, 10, C.redInk); }));
    man(g, t, X, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : bump(T, 2.6, 2.9, 3.5, 3.8)], [POINT, bump(T, 0.8, 1.1, 2.4, 2.7)], [CHEER, pop(T, 4.6, 5.0, 6.0, 6.4)]], { wave: S.wave, wt: S.wt });
    bubble(g, X + 40, -138, '装不下了……', say(T, 2.0, 3.5), { tail: -24 });
    sparks(g, 60, -150, seg(T, 4.5, 5.1), 20, 8, C.amber);
    bubble(g, X + 46, -138, '换个框看世界', say(T, 4.8, 6.6), { tail: -30 });
  });

  /* 28 罗尔斯 · 无知之幕 */
  def('rawls', 7.8, '他把蛋糕切得一大一小；一道幕落下，他不知道自己会拿到哪块——于是切成一样大。', function (g, S, T, t, fade) {
    const X = -120, veil = E.soft(seg(T, 2.0, 2.8)) * (1 - seg(T, 6.6, 7.2)), cut = lerp(0.24, 0.5, E.soft(seg(T, 3.8, 4.8)) * fade), CX = 10, CW = 150;
    ln(g, CX + 14, -44, CX + 8, 0, 2); ln(g, CX + CW - 14, -44, CX + CW - 8, 0, 2); box(g, CX - 8, -50, CW + 16, 7, C.wood, 2, 1.5);
    box(g, CX, -80, CW, 30, '#f7d9c4', 4, 1.7); ln(g, CX + CW * cut, -84, CX + CW * cut, -48, 2.2, C.redInk); text(g, '小', CX + CW * cut / 2, -60, 10, C.umber); text(g, Math.abs(cut - 0.5) < 0.03 ? '小' : '大', CX + CW * (1 + cut) / 2, -60, 10, C.umber);
    alpha(g, veil, () => { box(g, -170, -176, 330, 20 + veil * 28, 'rgba(60,70,95,.82)', 3, 1.5); text(g, '无知之幕：你会拿到哪一块？', -5, -154 + veil * 4, 10.5, '#fff'); });
    man(g, t, X, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : bump(T, 2.8, 3.1, 3.7, 4.0)], [P({ hF: lp([CX + CW * cut - 4, -84], X, 0, 1), hB: [-4, -54], chest: [5, -88], head: [12, -112] }), bump(T, 0.5, 0.8, 1.5, 1.8) + bump(T, 3.8, 4.0, 4.8, 5.1)], [NOD, bump(T, 5.2, 5.5, 6.2, 6.6)]], { wave: S.wave, wt: S.wt });
    bubble(g, X - 20, -112, '大的归我', say(T, 0.9, 1.9), { tail: 16 });
    tickBadge(g, CX + CW + 14, -92, seg(T, 4.9, 5.3) * fade);
  });

  /* 29 福柯 · 全景敞视 */
  def('foucault', 7.8, '塔上的眼睛睁开，他立刻站直；百叶窗关上了，他不知道还有没有人在看——照样站得笔直。', function (g, S, T, t, fade) {
    const X = -100, eye = bump(T, 0.8, 1.2, 3.2, 3.6), shut = seg(T, 3.4, 3.9) * fade, straight = bump(T, 1.1, 1.5, 6.6, 7.2);
    box(g, 110, -150, 44, 150, C.steel, 3, 1.7); box(g, 100, -176, 64, 28, '#d7dadf', 4, 1.7);
    alpha(g, eye, () => { poly(g, [[112, -162], [-70, -130], [-70, -10]], true); g.fillStyle = 'rgba(253,230,138,.28)'; g.fill(); });
    g.beginPath(); g.ellipse(132, -162, 12, 2 + eye * 6, 0, 0, TAU); inkFill(g, C.paper, 1.5); if (eye > 0.4) dot(g, 129, -162, 3, C.ink);
    alpha(g, shut, () => { for (let i = 0; i < 4; i++) ln(g, 104, -172 + i * 6.5, 160, -172 + i * 6.5, 2.4, '#555'); });
    man(g, t, X, 1, null, [[P({ chest: [-4, -86], head: [-8, -108], hF: [4, -54], hB: [-12, -50] }), T < 0 ? 0.8 : 0.8 * (1 - straight)], [P({ head: [0, -119], chest: [0, -92], hF: [8, -62], hB: [-8, -62] }), straight]], { wave: S.wave, wt: S.wt });
    bubble(g, X - 46, -140, '还在看吗？', say(T, 4.2, 6.2), { tail: 30 });
    alpha(g, say(T, 4.4, 6.4), () => text(g, '？', 132, -186, 12, C.muted));
  });

  /* 30 哈贝马斯 · 交往理性 */
  def('habermas', 7.6, '他先伸手去推对方，对方退开又弹回来；换成讲一句理由，对方点了头。', function (g, S, T, t, fade) {
    const A = -80, push = bump(T, 0.5, 0.8, 1.5, 1.9), bx = 50 + push * 34 - bump(T, 1.9, 2.1, 2.3, 2.6) * 8, agree = seg(T, 4.6, 5.0) * fade;
    man(g, t, A, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : bump(T, 2.4, 2.7, 3.1, 3.4)], [P({ hF: [46, -84], hB: [30, -78], chest: [8, -88], head: [14, -112] }), push], [POINT, bump(T, 3.3, 3.6, 4.6, 5.0)], [P({ hF: lp([-14, -70], A, 0, 1), hB: [-4, -54] }), bump(T, 5.0, 5.3, 6.4, 6.8)]], { wave: S.wave, wt: S.wt });
    man(g, t, bx, -1, null, [[P({ chest: [-8, -88], head: [-12, -112], hF: [-6, -70] }), push], [UP, bump(T, 1.6, 1.8, 2.4, 2.7)], [NOD, bump(T, 4.4, 4.7, 5.0, 5.2)], [P({ hF: lp([-10, -70], bx, 0, -1), hB: [-4, -54] }), bump(T, 5.0, 5.3, 6.4, 6.8)]], ORANGE);
    cross(g, -14, -150, 8, bump(T, 1.6, 1.9, 2.6, 3.0)); text(g, '推', -14, -164, 9, bump(T, 1.6, 1.9, 2.6, 3.0) > 0.3 ? C.redInk : 'rgba(0,0,0,0)');
    bubble(g, bx + 44, -132, '不服！', say(T, 1.7, 2.8), { tail: -30 });
    bubble(g, A - 30, -134, '因为……你看这样行吗？', say(T, 3.4, 4.9), { tail: 22 });
    tickBadge(g, -14, -112, agree); sparks(g, -12, -70, seg(T, 5.2, 5.8), 12, 6, C.amber);
  });

  /* 31 斯密与李嘉图 · 分工 */
  def('smith_ricardo', 7.8, '一个人从头到尾做扣针，一天二十枚；三个人各做一步、手手相传，数字一下子翻了上去。', function (g, S, T, t, fade) {
    const rb = route(T, [[1.6, 2.7, 250, 20, -1], [6.7, 7.6, 20, 250, -1]], -1), rc = route(T, [[1.8, 2.8, 290, 110, -1], [6.7, 7.6, 110, 290, -1]], -1), team = seg(T, 2.9, 3.3) * fade, n = Math.round(lerp(20, 4800, E.out3(seg(T, 3.3, 4.6)) * fade));
    box(g, -110, -40, 250, 7, C.wood, 2, 1.5); ln(g, -100, -33, -104, 0, 2); ln(g, 130, -33, 134, 0, 2);
    sign(g, 15, -160, (team > 0.5 ? '分工：' : '一个人：') + n + ' 枚 / 天', team > 0.5 ? C.green : C.paper, team > 0.5 ? C.greenInk : C.ink, 11);
    const work = (x, sx, ph) => P({ hF: lp([x + sx * 22, -44 + Math.sin(t * 14 + ph) * 3], x, 0, sx), hB: lp([x + sx * 14, -44 - Math.sin(t * 14 + ph) * 3], x, 0, sx), chest: [4, -89], head: [9, -113] });
    man(g, t, -130, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : 0], [work(-130, 1, 0), bump(T, 0.3, 0.6, 6.4, 6.8)]], { wave: S.wave, wt: S.wt });
    man(g, t, rb.ws.x, rb.sx, rb.ws, [[work(rb.ws.x, -1, 1), team]], ORANGE); man(g, t, rc.ws.x, rc.sx, rc.ws, [[work(rc.ws.x, -1, 2), team]], TEAL);
    for (let i = 0; i < 5; i++) alpha(g, team, () => { const k = (t * 0.9 + i / 5) % 1; ln(g, -100 + k * 220, -46, -100 + k * 220, -54, 1.6, C.muted); });
    sparks(g, 15, -150, seg(T, 3.3, 3.9), 26, 8, C.amber);
  });

  /* 32 凯恩斯与弗里德曼 · 乘数 */
  def('keynes_friedman', 7.8, '一枚硬币从甲花到乙、乙再花到丙；每转手一次，总收入的数字就再涨一截。', function (g, S, T, t, fade) {
    const xs = [-130, 0, 130], k1 = E.soft(seg(T, 1.0, 1.9)), k2 = E.soft(seg(T, 3.2, 4.1)), total = Math.round(100 + 80 * seg(T, 1.8, 2.1) + 64 * seg(T, 4.0, 4.3));
    alpha(g, T < 0 ? 0.5 : 1, () => sign(g, 0, -164, '总收入 ' + (T < 0 ? 100 : total), total > 100 ? C.green : C.paper, total > 100 ? C.greenInk : C.ink, 11.5));
    const give = (a, b, c, d) => [P({ hF: [36, -84], hB: [-4, -54] }), bump(T, a, b, c, d)];
    man(g, t, xs[0], 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : 0], give(0.6, 0.9, 1.3, 1.6)], { wave: S.wave, wt: S.wt });
    man(g, t, xs[1], 1, null, [give(2.9, 3.2, 3.5, 3.8), [NOD, bump(T, 1.9, 2.2, 2.5, 2.8)]], ORANGE);
    man(g, t, xs[2], -1, null, [[CHEER, pop(T, 4.1, 4.5, 5.4, 5.8)]], TEAL);
    const p = T < 0 ? [xs[0] + 14, -62] : k2 > 0 ? arcPt([xs[1] + 30, -80], [xs[2] - 16, -80], 46, k2) : arcPt([xs[0] + 30, -80], [xs[1] - 14, -80], 46, k1);
    alpha(g, T < 0 ? 1 : 1 - seg(T, 5.0, 5.4), () => coin(g, p[0], p[1]));
    alpha(g, say(T, 1.9, 3.0), () => text(g, '+80', xs[1], -136, 12, C.greenInk)); alpha(g, say(T, 4.1, 5.4), () => text(g, '+64', xs[2], -136, 12, C.greenInk));
    bubble(g, xs[0] + 60, -132, '一个人花的，是另一个人挣的', say(T, 5.4, 7.2), { tail: -50 });
  });

  /* 33 哈耶克与熊彼特 · 创造性破坏 */
  def('hayek_schumpeter', 7.8, '他拎着一只电灯泡走进来；蜡烛铺沉了下去，旁边升起一家新的电灯铺。', function (g, S, T, t, fade) {
    const r = route(T, [[0.3, 1.5, -180, -60, 1], [6.8, 7.6, -60, -180, 1]], 1), x = r.ws.x, sink = E.soft(seg(T, 2.2, 3.4)) * fade, rise = E.out3(seg(T, 3.0, 4.2)) * fade;
    const stall = (cx, lab, fill, dy, a) => alpha(g, a, () => { g.save(); g.translate(0, dy); box(g, cx - 40, -70, 80, 70, C.paper, 3, 1.7); poly(g, [[cx - 48, -70], [cx - 36, -92], [cx + 36, -92], [cx + 48, -70]], true); inkFill(g, fill, 1.7); text(g, lab, cx, -34, 12, C.ink); g.restore(); });
    g.save(); g.beginPath(); g.rect(-210, -200, 420, 200); g.clip(); stall(30, '蜡烛铺', '#e4e6e9', sink * 96, 1); stall(130, '电灯铺', C.butter, (1 - rise) * 96, rise > 0 ? 1 : 0); g.restore();
    const J = man(g, t, x, r.sx, r.ws, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : 0], [P({ hF: [26, -92], hB: [-4, -54] }), bump(T, 0.2, 0.5, 6.4, 6.8)], [CHEER, pop(T, 4.2, 4.6, 5.6, 6.0)]], { wave: S.wave, wt: S.wt });
    alpha(g, bump(T, 0.2, 0.5, 6.4, 6.8), () => { const h = J.w.handF; ln(g, h[0], h[1] - 4, h[0], h[1] - 9, 2); circle(g, h[0], h[1] - 16, 8); inkFill(g, C.butterHi, 1.6); R.frontArm(g, J); });
    sparks(g, 130, -100, seg(T, 4.0, 4.7), 22, 8, C.amber);
    bubble(g, x - 30, -140, '新的来了，旧的才退场', say(T, 4.4, 6.4), { tail: 24 });
  });

  /* 34 纳什 · 均衡 */
  def('nash', 8, '两人都合作各得 3；一个人反水拿到 5，另一个也跟着反水——停在 1 和 1，谁也不想单独改回去。', function (g, S, T, t, fade) {
    const st = T < 0 ? 0 : T < 1.6 ? 0 : T < 3.4 ? 2 : 3, cells = ['3 , 3', '0 , 5', '5 , 0', '1 , 1'], GX = -56, GY = -150;
    cells.forEach((c, i) => { const cx = GX + (i % 2) * 58, cy = GY + Math.floor(i / 2) * 40, on = i === st && T >= 0; box(g, cx, cy, 54, 36, on ? (i === 3 && T > 4.4 ? C.green : C.butter) : C.paper, 4, on ? 2 : 1.3); text(g, c, cx + 27, cy + 23, 11, on ? C.ink : C.soft); });
    text(g, '合作', GX + 27, GY - 6, 8.5, C.muted); text(g, '反水', GX + 85, GY - 6, 8.5, C.muted);
    man(g, t, -140, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : 0], [POINT, bump(T, 1.3, 1.6, 2.4, 2.8)], [CHIN, bump(T, 4.6, 4.9, 6.4, 6.8)]], { wave: S.wave, wt: S.wt });
    man(g, t, 140, -1, null, [[UP, bump(T, 1.8, 2.0, 2.8, 3.1)], [POINT, bump(T, 3.1, 3.4, 4.2, 4.6)], [CHIN, bump(T, 4.8, 5.1, 6.4, 6.8)]], ORANGE);
    bubble(g, -96, -52, '我拿 5！', say(T, 1.7, 3.0), { tail: -30 });
    bubble(g, 96, -52, '那我也反水', say(T, 3.5, 4.8), { tail: 30 });
    alpha(g, say(T, 5.0, 7.2), () => sign(g, 0, -24, '谁单独改，谁更糟', C.paper, C.greenInk, 10.5));
  });

  /* 35 西蒙与卡尼曼 · 损失厌恶 */
  def('simon_kahneman', 7.8, '捡到一枚硬币，高兴的柱子涨了一点；丢了同样一枚，难过的柱子跌得深一倍。', function (g, S, T, t, fade) {
    const X = -110, gain = bump(T, 0.8, 1.3, 2.8, 3.2), loss = bump(T, 3.8, 4.3, 6.6, 7.2), BX = 110;
    ln(g, BX - 60, -90, BX + 60, -90, 1.8); text(g, '感受', BX, -168, 9.5, C.muted);
    box(g, BX - 40, -90 - gain * 26, 30, Math.max(0.5, gain * 26), C.green, 2, 1.5); box(g, BX + 10, -90, 30, Math.max(0.5, loss * 58), C.red, 2, 1.5);
    alpha(g, gain, () => text(g, '+100', BX - 25, -96 - gain * 26, 10, C.greenInk)); alpha(g, loss, () => text(g, '−100', BX + 25, -78 + loss * 58 + 12, 10, C.redInk));
    const cy = T < 0 ? -200 : T < 3.6 ? lerp(-170, -66, E.in(seg(T, 0.3, 0.9))) : lerp(-66, 24, E.in(seg(T, 3.8, 4.4)));
    alpha(g, T < 0 ? 0 : 1 - seg(T, 4.3, 4.5), () => coin(g, X + 26 + (T > 3.6 ? seg(T, 3.8, 4.4) * 30 : 0), cy));
    man(g, t, X, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : 0], [P({ hF: [28, -74], hB: [-4, -54], head: [6, -117] }), bump(T, 0.7, 1.0, 3.6, 3.9)], [P({ chest: [4, -84], head: [10, -102], hF: [14, -56], hB: [0, -52] }), loss]], { wave: S.wave, wt: S.wt });
    bubble(g, X + 6, -140, '不错', say(T, 1.2, 2.6), { tail: 0 });
    bubble(g, X + 20, -128, '怎么这么难受……', say(T, 4.6, 6.6), { tail: -10 });
  });

  /* 36 涂尔干与韦伯 · 有机团结 */
  def('durkheim_weber', 7.6, '三个人各拿着一块不同形状的零件；拼到一起，轮子才转得起来。', function (g, S, T, t, fade) {
    const xs = [-150, 0, 150], join = E.soft(seg(T, 1.6, 2.8)) * fade, spin = seg(T, 2.9, 3.2) * fade, CX = 0, CY = -150;
    const piece = (i, a) => { const ang = i / 3 * TAU - Math.PI / 2, hx = xs[i] + (i === 2 ? -22 : 22), p = [lerp(hx, CX, join), lerp(-80, CY, join)]; g.save(); g.translate(p[0], p[1]); g.rotate(ang + a); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 22, -TAU / 6, TAU / 6); g.closePath(); inkFill(g, [C.butter, '#f6c7b8', '#cfe0f5'][i], 1.6); g.restore(); };
    for (let i = 0; i < 3; i++) piece(i, spin * t * 2.2);
    man(g, t, xs[0], 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : 0], [P({ hF: [30, -100], hB: [-4, -54] }), bump(T, 0.4, 0.7, 2.6, 3.0)], [CHEER, pop(T, 3.3, 3.7, 5.0, 5.4)]], { wave: S.wave, wt: S.wt });
    man(g, t, xs[1], 1, null, [[P({ hF: [16, -126], hB: [-4, -54], head: [4, -118] }), bump(T, 0.6, 0.9, 2.6, 3.0)], [CHEER, pop(T, 3.4, 3.8, 5.0, 5.4)]], ORANGE);
    man(g, t, xs[2], -1, null, [[P({ hF: [30, -100], hB: [-4, -54] }), bump(T, 0.8, 1.1, 2.6, 3.0)], [CHEER, pop(T, 3.5, 3.9, 5.0, 5.4)]], TEAL);
    sparks(g, CX, CY, seg(T, 2.8, 3.5), 30, 9, C.amber);
    bubble(g, -70, -40, '不一样，才离不开彼此', say(T, 3.8, 6.2), { tail: -50 });
  });

  /* 37 齐美尔与米德 · 镜中我 */
  def('simmel_mead', 7.6, '他照镜子时歪歪扭扭；旁人看过来，他从对方的眼神里看见了自己，站直了。', function (g, S, T, t, fade) {
    const X = -110, look = bump(T, 1.4, 1.8, 6.4, 6.9), fix = bump(T, 3.0, 3.5, 6.4, 6.9), slouch = 0.9 * bump(T, 0.2, 0.7, 3.0, 3.5);
    ln(g, -20, 0, -20, -150, 2); box(g, -40, -150, 40, 120, 'rgba(238,242,246,.9)', 4, 1.7);
    g.save(); g.beginPath(); g.rect(-39, -149, 38, 118); g.clip(); man(g, t, -8, -1, null, [[P({ chest: [-5, -86], head: [-9, -108] }), slouch]], { ink: '#a3a3a3', far: '#d4d4d4', shadow: false, s: 0.7 }); g.restore();
    man(g, t, X, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : 0], [P({ chest: [-5, -86], head: [-9, -108], hF: [4, -54], hB: [-12, -50] }), slouch], [P({ head: [0, -119], chest: [0, -92] }), fix]], { wave: S.wave, wt: S.wt });
    man(g, t, 130, -1, null, [[POINT, bump(T, 1.6, 1.9, 2.8, 3.1)], [NOD, bump(T, 3.6, 3.9, 4.6, 5.0)]], ORANGE);
    g.save(); g.setLineDash([4, 4]); alpha(g, look, () => ln(g, 118, -100, X + 12, -100, 1.5, '#d97757')); g.restore();
    bubble(g, 96, -134, '你有点驼背', say(T, 1.8, 3.0), { tail: 30 });
    bubble(g, X - 40, -138, '我从你眼里看见我', say(T, 4.0, 6.2), { tail: 26 });
  });

  /* 38 格兰诺维特 · 弱关系 */
  def('granovetter', 7.6, '他身边的熟人都不知道哪里招人；一条细细的虚线连到远处另一个圈子，消息从那里传了过来。', function (g, S, T, t, fade) {
    const X = -130, L = [[-70, -150], [-40, -120], [-76, -100], [-36, -160]], Rr = [[110, -150], [150, -130], [124, -100], [160, -160]], tie = seg(T, 2.2, 3.0) * fade, k = E.soft(seg(T, 3.2, 4.4));
    L.forEach((p, i) => L.slice(i + 1).forEach((q) => ln(g, p[0], p[1], q[0], q[1], 1.4, C.soft))); Rr.forEach((p, i) => Rr.slice(i + 1).forEach((q) => ln(g, p[0], p[1], q[0], q[1], 1.4, C.soft)));
    L.forEach((p) => { dot(g, p[0], p[1], 6, C.paper); alpha(g, bump(T, 0.5, 0.9, 1.9, 2.3), () => text(g, '?', p[0], p[1] - 9, 9, C.muted)); }); Rr.forEach((p) => dot(g, p[0], p[1], 6, '#f6c7b8'));
    sign(g, 150, -74, '招人', C.butter, C.umber, 9.5);
    g.save(); g.setLineDash([5, 4]); alpha(g, tie, () => ln(g, -40, -120, lerp(-40, 110, tie), lerp(-120, -150, tie), 1.6, C.amber)); g.restore(); alpha(g, say(T, 2.6, 6.6), () => text(g, '只是点头之交', 36, -146, 9, C.amber));
    const p = k < 0.6 ? [lerp(110, -40, k / 0.6), lerp(-150, -120, k / 0.6)] : arcPt([-40, -120], [X + 26, -78], 20, (k - 0.6) / 0.4);
    alpha(g, say(T, 3.2, 6.4), () => { box(g, p[0] - 8, p[1] - 6, 16, 12, C.paper, 2, 1.4); ln(g, p[0] - 8, p[1] - 6, p[0], p[1], 1.2); ln(g, p[0] + 8, p[1] - 6, p[0], p[1], 1.2); });
    man(g, t, X, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : bump(T, 0.4, 0.7, 2.0, 2.3)], [P({ hF: [28, -80], hB: [-4, -54] }), bump(T, 4.0, 4.3, 5.2, 5.5)], [CHEER, pop(T, 5.3, 5.7, 6.4, 6.8)]], { wave: S.wave, wt: S.wt });
  });

  /* 39 奥尔森与帕特南 · 搭便车 */
  def('olson_putnam', 8, '一个人推车，另两个站着等，车几乎不动；三个人一起推，车才走起来。', function (g, S, T, t, fade) {
    const allAt = (q) => E.soft(seg(q, 3.2, 3.9)) * (1 - E.soft(seg(q, 6.7, 7.5))), goAt = (q) => E.soft(seg(q, 3.9, 5.6)) * (1 - E.soft(seg(q, 6.5, 7.5)));
    const cxAt = (q) => 40 + goAt(q) * 90, xaAt = (q) => cxAt(q) - 66, xbAt = (q) => lerp(-150, cxAt(q) - 100, allAt(q)), xcAt = (q) => lerp(-186, cxAt(q) - 134, allAt(q));
    const all = T < 0 ? 0 : allAt(T), go = T < 0 ? 0 : goAt(T), cx = T < 0 ? 40 : cxAt(T), strain = bump(T, 0.5, 0.9, 6.3, 6.7);
    box(g, cx - 36, -58, 84, 44, C.wood, 3, 1.7); text(g, '公共的事', cx + 6, -30, 10, C.umber); [cx - 16, cx + 30].forEach((w) => { circle(g, w, -9, 9); inkFill(g, C.paper, 1.6); ln(g, w, -9, w + Math.cos(go * 9) * 8, -9 + Math.sin(go * 9) * 8, 1.3); });
    const pushP = (x) => P({ hF: lp([x + 30, -44], x, 0, 1), hB: lp([x + 28, -30], x, 0, 1), chest: [8, -86], head: [16, -108] });
    const wa = T < 0 ? { x: -26 } : R.gait(xaAt, T), wb = T < 0 ? { x: -150 } : R.gait(xbAt, T), wc = T < 0 ? { x: -186 } : R.gait(xcAt, T);
    man(g, t, wc.x, 1, T < 0 ? null : wc, [[pushP(wc.x), all]], TEAL); man(g, t, wb.x, 1, T < 0 ? null : wb, [[CHIN, bump(T, 0.8, 1.1, 2.8, 3.1)], [pushP(wb.x), all]], ORANGE);
    man(g, t, wa.x, 1, T < 0 ? null : wa, [[pushP(wa.x), T < 0 ? 0 : strain]], { wave: S.wave, wt: S.wt });
    bubble(g, -120, -132, '等他推吧', say(T, 1.0, 2.8), { tail: -20 });
    tickBadge(g, cx + 6, -76, seg(T, 5.0, 5.4) * (1 - seg(T, 6.3, 6.6)));
  });

  /* 40 巴甫洛夫与斯金纳 · 条件反射 */
  def('pavlov_skinner', 8, '他摇铃、再放下食物，狗流口水；几次之后只摇铃、没有食物，狗照样流口水。', function (g, S, T, t, fade) {
    const X = -120, ring = (a, b) => bump(T, a, a + 0.2, b - 0.2, b), r1 = ring(0.6, 1.6), r2 = ring(2.4, 3.4), r3 = ring(4.6, 6.2), anyRing = Math.max(r1, r2, r3), food = Math.max(bump(T, 1.0, 1.3, 2.0, 2.3), bump(T, 2.8, 3.1, 3.8, 4.1)), drool = Math.max(bump(T, 1.2, 1.5, 2.0, 2.3), bump(T, 3.0, 3.3, 3.8, 4.1), bump(T, 5.0, 5.3, 6.2, 6.6));
    const BX = -74, BY = -150; ln(g, BX, -176, BX, BY, 1.6); g.save(); g.translate(BX, BY); g.rotate(Math.sin(t * 24) * 0.35 * anyRing); poly(g, [[-10, 20], [-7, 2], [7, 2], [10, 20]], true); inkFill(g, C.butterHi, 1.6); dot(g, 0, 23, 2.6, C.ink); g.restore();
    alpha(g, anyRing, () => { text(g, '叮', BX + 22, BY + 6, 10, C.amber); });
    const DX = 90; box(g, DX - 26, -34, 52, 22, C.wood, 8, 1.7); dot(g, DX - 34, -40, 11, C.wood); ln(g, DX - 40, -50, DX - 44, -58, 2); ln(g, DX - 18, -12, DX - 18, 0, 2.2); ln(g, DX + 18, -12, DX + 18, 0, 2.2); ln(g, DX + 26, -30, DX + 36, -40 - anyRing * 6, 2); dot(g, DX - 38, -42, 1.6, C.ink);
    alpha(g, drool, () => { for (let i = 0; i < 2; i++) { const k = (t * 1.4 + i * 0.5) % 1; alpha(g, 1 - k, () => dot(g, DX - 42, -30 + k * 22, 2, '#bfe0f5')); } });
    alpha(g, food, () => { box(g, 18, -10, 30, 10, C.paper, 4, 1.5); dot(g, 33, -14, 6, '#f28b82'); });
    alpha(g, say(T, 4.7, 6.6), () => { g.save(); g.setLineDash([3, 3]); rr(g, 18, -22, 30, 22, 4); g.strokeStyle = C.soft; g.lineWidth = 1.3; g.stroke(); g.restore(); text(g, '没有食物', 33, 14, 8.5, C.muted); });
    man(g, t, X, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : 0], [P({ hF: lp([BX - 4, BY + 26], X, 0, 1), hB: [-4, -54], head: [6, -117] }), anyRing]], { wave: S.wave, wt: S.wt });
    bubble(g, DX + 40, -92, '铃 = 饭！', say(T, 5.2, 6.8), { tail: -50 });
  });

  /* 41 皮亚杰与维果茨基 · 脚手架 */
  def('piaget_vygotsky', 8, '孩子够不着架子上的苹果；大人推来一只箱子，孩子踩上去就拿到了。', function (g, S, T, t, fade) {
    const KX = 70, ra = route(T, [[1.8, 3.0, -170, -10, 1], [6.9, 7.7, -10, -170, 1]], 1), boxX = T < 1.8 || T < 0 ? -130 : T < 3.0 ? ra.ws.x + 40 : lerp(30, 30, 1), placed = seg(T, 3.0, 3.2) * (1 - seg(T, 6.8, 7.0)), up = E.soft(seg(T, 3.4, 3.9)) * (1 - E.soft(seg(T, 6.2, 6.7))), got = seg(T, 4.4, 4.7) * fade;
    ln(g, 120, 0, 120, -150, 2); box(g, 84, -128, 60, 6, C.wood, 2, 1.5);
    alpha(g, 1 - got, () => { dot(g, 100, -138, 9, '#f28b82'); ln(g, 100, -147, 102, -152, 1.5, C.umber); });
    const bx = T >= 3.0 && T < 6.8 ? 56 : boxX; box(g, bx - 18, -26, 36, 26, C.butter, 3, 1.7); text(g, '支架', bx, -9, 8.5, C.umber);
    man(g, t, ra.ws.x, ra.sx, ra.ws, [[P({ hF: [30, -40], hB: [26, -28], chest: [8, -86], head: [16, -108] }), bump(T, 1.7, 1.9, 3.0, 3.3)], [CHEER, pop(T, 4.8, 5.2, 6.0, 6.4)]], ORANGE);
    const kx = lerp(KX, 56, up), ky = -26 * up;
    g.save(); g.translate(0, ky); const J = man(g, t, kx, 1, null, [[P({ hF: [22, -128], hB: [-4, -54], head: [6, -118] }), Math.max(bump(T, 0.4, 0.7, 1.4, 1.8), bump(T, 4.0, 4.3, 6.0, 6.3))]], { wave: S.wave, wt: S.wt, s: 0.62 }); g.restore();
    alpha(g, got * (1 - seg(T, 6.0, 6.3)), () => { const h = J.w.handF; dot(g, h[0] + 2, h[1] + ky - 6, 9, '#f28b82'); });
    alpha(g, bump(T, 0.6, 0.9, 1.5, 1.9), () => text(g, '够不着…', KX - 34, -92, 9.5, C.muted));
    sparks(g, 100, -140, seg(T, 4.4, 5.0), 16, 7, C.amber);
    bubble(g, -66, -134, '帮一把，他就够得着', say(T, 4.9, 6.6), { tail: 40 });
  });

  /* 42 艾宾浩斯 · 遗忘曲线 */
  def('ebbinghaus', 7.8, '板子上的记忆曲线一开始掉得很陡；他每复习一次，曲线就弹回去，而且掉得越来越慢。', function (g, S, T, t, fade) {
    const X = -150, B = { x: -70, y: -160, w: 250, h: 120 }, prog = T < 0 ? 1 : clamp((T - 0.6) / 4.6, 0, 1), rev = [0.33, 0.66];
    ln(g, B.x + 30, B.y + B.h, B.x + 20, 0, 2.2); ln(g, B.x + B.w - 30, B.y + B.h, B.x + B.w - 20, 0, 2.2); box(g, B.x, B.y, B.w, B.h, C.paper, 6, 1.7);
    ln(g, B.x + 16, B.y + B.h - 14, B.x + B.w - 12, B.y + B.h - 14, 1.3, C.soft); ln(g, B.x + 16, B.y + 12, B.x + 16, B.y + B.h - 14, 1.3, C.soft); text(g, '记得', B.x + 30, B.y + 20, 8.5, C.muted); text(g, '时间', B.x + B.w - 24, B.y + B.h - 4, 8.5, C.muted);
    const f = (u) => { let last = 0, rate = 9; rev.forEach((r, i) => { if (T >= 0 && u >= r) { last = r; rate = 9 / Math.pow(2.6, i + 1); } }); return 0.18 + 0.82 * Math.exp(-(u - last) * rate); };
    g.beginPath(); for (let i = 0; i <= 80 * prog; i++) { const u = i / 80, px = B.x + 16 + u * (B.w - 30), py = B.y + B.h - 14 - f(u) * (B.h - 30); if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.strokeStyle = C.redInk; g.lineWidth = 2.2; g.lineJoin = 'round'; g.stroke();
    rev.forEach((r, i) => alpha(g, seg(prog, r, r + 0.04) * (T < 0 ? 0 : 1), () => { const px = B.x + 16 + r * (B.w - 30); g.save(); g.setLineDash([3, 3]); ln(g, px, B.y + 14, px, B.y + B.h - 14, 1.3, C.greenInk); g.restore(); text(g, '复习', px, B.y + B.h - 4, 8.5, C.greenInk); }));
    man(g, t, X, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : bump(T, 0.6, 0.9, 1.8, 2.1)], [POINT, bump(T, 2.0, 2.2, 2.6, 2.9) + bump(T, 3.5, 3.7, 4.1, 4.4)], [CHEER, pop(T, 5.4, 5.8, 6.6, 7.0)]], { wave: S.wave, wt: S.wt });
    bubble(g, X + 20, -140, '忘得真快', say(T, 0.9, 2.0), { tail: -8 });
    tickBadge(g, B.x + B.w - 20, B.y + 40, seg(T, 5.2, 5.6) * fade);
  });

  /* 43 马斯洛与费斯廷格 · 需要层次 */
  def('maslow_festinger', 7.8, '金字塔从最底下的“吃饱”一层层亮上去，亮到顶，他才抬头看见那颗星。', function (g, S, T, t, fade) {
    const X = -140, L = ['生理', '安全', '归属', '尊重', '自我实现'], CX = 50, top = pop(T, 4.6, 5.0, 6.6, 7.0);
    L.forEach((n, i) => { const w0 = 190 - i * 36, w1 = 190 - (i + 1) * 36, y = -i * 28, on = T < 0 ? 0 : seg(T, 0.6 + i * 0.75, 1.0 + i * 0.75) * fade; poly(g, [[CX - w0 / 2, y], [CX + w0 / 2, y], [CX + w1 / 2, y - 28], [CX - w1 / 2, y - 28]], true); inkFill(g, on > 0.5 ? [C.red, '#fbd5a8', C.butter, C.green, '#d9c8f5'][i] : C.paper, 1.6); text(g, n, CX, y - 9, i === 4 ? 8.5 : 9.5, on > 0.5 ? C.ink : C.soft); });
    alpha(g, top, () => { R.star(g, CX, -160, 11 * top, 5); inkFill(g, C.butterHi, 1.6); });
    sparks(g, CX, -160, seg(T, 4.6, 5.3), 20, 8, C.amber);
    man(g, t, X, 1, null, [[CHIN, T < 0 ? pulse(t, 6, 2, 2) : 0], [POINT, bump(T, 0.6, 0.9, 4.2, 4.5)], [P({ head: [4, -119], hF: [16, -70] }), bump(T, 4.6, 4.9, 5.2, 5.4)], [CHEER, pop(T, 5.2, 5.6, 6.4, 6.8)]], { wave: S.wave, wt: S.wt });
    bubble(g, X + 30, -138, '先吃饱，再谈理想', say(T, 1.0, 3.0), { tail: -16 });
  });
})();
