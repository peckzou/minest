// landmarks.js — Staubbach Falls: the valley wall and the fall, built by hand (the map only has a cliff line and a point).
// The engine draws flat ground, so the wall is a model standing on the plot's western edge. It is cut off flat at
// WALL.H metres, like a building the plot edge cuts: the real fall drops 297 m, more than the plot is wide.
const WALL = { H: 80, foot: 99, face: 106, lean: 9, back: 125, half: 125, cols: 26, rows: [0, 8, 20, 35, 51, 66, 80] };
const wallJit = (i, j) => rnd(i * 7.13 + j * 3.71 + 1.9);
const wallX = i => -WALL.half + 2 * WALL.half * i / WALL.cols;
function wallPoint(i, j) {
  const x = wallX(i), z = WALL.rows[j];
  if (j === 0) return [x, WALL.foot + (wallJit(i, 0) - .5) * 3, 0];
  const k = (z - WALL.rows[1]) / (WALL.H - WALL.rows[1]);
  const groove = Math.abs(x) < 9 ? 2.5 : 0, rib = i % 4 === 0 ? -2.2 : 0;
  return [x, WALL.face + k * WALL.lean + (wallJit(i, j) - .5) * 5 + groove + rib, z];
}
const ROCK = ['#bdb5a8', '#b2aa9f', '#c7bba6', '#a9a39b', '#c2b49c'];
const fallFlow = () => SEASON.snow ? .45 : SEASON.id === 'spring' ? 1.25 : SEASON.id === 'autumn' ? .8 : 1;

const LANDMARKS = [
  {
    name: 'Staubbach wall',
    ids: [],
    build() {
      const N = WALL.cols, M = WALL.rows.length - 1, H = WALL.H, B = WALL.back, X = WALL.half;
      const fp = [[-X, 103], [X, 103], [X, B], [-X, B]];
      return obj(fp, H, () => {
        const faces = [], snow = !!SEASON.snow;
        for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
          const pts = [wallPoint(i, j), wallPoint(i + 1, j), wallPoint(i + 1, j + 1), wallPoint(i, j + 1)];
          let n = norm(cross(sub(pts[1], pts[0]), sub(pts[3], pts[0])));
          if (n[1] > 0) n = n.map(v => -v);
          let c;
          if (j === 0) c = snow ? snowy('#cfc6b4', .8) : wallJit(i, 9) > .62 ? '#cfc6b4' : (SEASON.leaves === 'bare' ? '#c9c08e' : SEASON.leaves === 'autumn' ? '#b9c57a' : '#a6cf78');
          else { c = ROCK[Math.floor(wallJit(i, j + 20) * ROCK.length)]; if (snow && wallJit(i, j + 40) > .7) c = snowy(c, .6); }
          faces.push({ pts, n, c: tone(n, soft(c)) });
        }
        const cut = '#dccfb6', cutSide = '#cdbfa4';
        const top = []; for (let i = 0; i <= N; i++) top.push(wallPoint(i, M)); top.push([X, B, H], [-X, B, H]);
        faces.push({ pts: top, n: [0, 0, 1], c: cut, lined: true });
        const side = i => { const p = []; for (let j = 0; j <= M; j++) p.push(wallPoint(i, j)); p.push([wallX(i), B, H], [wallX(i), B, 0]); return p; };
        faces.push({ pts: side(0), n: [-1, 0, 0], c: cutSide, lined: true }, { pts: side(N), n: [1, 0, 0], c: cutSide, lined: true });
        faces.push({ pts: [[-X, B, 0], [X, B, 0], [X, B, H], [-X, B, H]], n: [0, 1, 0], c: cutSide, lined: true });
        let s = faces.filter(q => vis(q.n)).sort((a, b) => depthOf(avg(a.pts)) - depthOf(avg(b.pts)))
          .map(q => q.lined ? shape(q.pts, q.c, .7) : face(pd(q.pts), q.c)).join('');
        if (vis([0, -1, 0])) {
          for (let j = 1; j < M; j++) for (let i = 0; i < N; i++) if (wallJit(i, j + 60) > .45)
            s += edge(wallPoint(i, j), wallPoint(i + 1, j), '#8d877f', .16);
          for (let i = 1; i < N; i++) if (wallJit(i, 77) > .55) {
            const a = wallPoint(i, M), b = wallPoint(i, M - 1 - Math.floor(wallJit(i, 78) * 2));
            s += '<g opacity=".5">' + edge(a, b, '#77726f', .7) + '</g>';
          }
          for (let i = 0; i < N; i++) s += edge(wallPoint(i, M), wallPoint(i + 1, M), '#3a342c', .22);
        }
        return s;
      });
    }
  }
];

// The fall itself moves, so it is drawn every frame: a ribbon that turns to face the reader, falling streaks, spray.
function CITY_EXTRA(t) {
  const H = WALL.H, flow = fallFlow(), ice = !!SEASON.snow;
  const at = z => [0, 102 + (z / H) * 9, z];
  const halfW = z => (1.5 + Math.pow(1 - z / H, 1.5) * 5.5) * flow;
  const draw = time => {
    const steps = 14, L = [], R = [], Li = [], Ri = [];
    for (let k = 0; k <= steps; k++) {
      const z = H - (H - 5) * k / steps, [px, py] = P(...at(z)), w = halfW(z) * CAM_K, sway = Math.sin(time * .7 + k * .6) * .35 * CAM_K * (k / steps);
      L.push([px - w + sway, py]); R.push([px + w + sway, py]); Li.push([px - w * .45 + sway, py]); Ri.push([px + w * .45 + sway, py]);
    }
    const poly = (a, b) => 'M' + a.concat(b.slice().reverse()).map(q => f(q[0]) + ' ' + f(q[1])).join('L') + 'Z';
    const pale = ice ? '#e3eff4' : '#f4f9f8', core = ice ? '#f3f9fb' : '#ffffff';
    let s = '<path d="' + poly(L, R) + '" fill="' + pale + '" opacity="' + (ice ? .9 : .62) + '"/>'
      + '<path d="' + poly(Li, Ri) + '" fill="' + core + '" opacity=".9"/>';
    const streaks = ice ? 4 : Math.round(15 * flow);
    for (let k = 0; k < streaks; k++) {
      const ph = (time * .16 + k / streaks + rnd(k) * .3) % 1, z = H - (H - 8) * Math.pow(ph, 1.35), len = 5 + 9 * ph;
      const a = P(...at(z)), b = P(...at(Math.max(4, z - len))), dx = (rnd(k + 31) - .5) * 1.5 * halfW(z) * CAM_K;
      s += '<path d="M' + f(a[0] + dx) + ' ' + f(a[1]) + 'L' + f(b[0] + dx) + ' ' + f(b[1]) + '" fill="none" stroke="#ffffff" style="stroke-width:' + (.55 * CAM_K).toFixed(2) + '" stroke-linecap="round" opacity=".85"/>';
    }
    if (!ice) for (let k = 0; k < 4; k++) {
      const [mx, my] = P((rnd(k + 5) - .5) * 9 * flow, 100.5, 3 + k * 1.6), r = (4.2 + 1.6 * Math.sin(time * .9 + k * 1.7)) * flow * CAM_K;
      s += '<circle cx="' + f(mx) + '" cy="' + f(my) + '" r="' + f(r) + '" fill="#ffffff" opacity=".3"/>';
    }
    return s;
  };
  return [{ fp: rect(0, 99.6, 20, 5.6), h: H, draw }];
}
