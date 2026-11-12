/* Trinity College - shared interior materials (wood, plaster, fabric, brass, glass). Procedural canvas textures, no network.
 * One cache per THREE instance so Hall / Wren / the student rooms share the same material objects.
 * Exposes TrinityMats = { get(THREE) -> { oak, oakDark, plaster, floorBoards, fabric(color), brass, glass, paper, leather } }. */
(function (root) {
  'use strict';
  function rng(seed) { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function canvasTex(THREE, w, h, paint, repeat) {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    if (THREE.sRGBEncoding !== undefined) t.encoding = THREE.sRGBEncoding;
    if (repeat) t.repeat.set(repeat, repeat);
    return t;
  }
  // wood grain: long streaks, a few knots; 1 repeat ~ 1 m
  function woodTex(THREE, base, dark, seed) {
    return canvasTex(THREE, 256, 256, (x, w, h) => {
      const r = rng(seed); x.fillStyle = base; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) { const y = r() * h, a = 0.05 + r() * 0.12; x.strokeStyle = 'rgba(' + dark + ',' + a + ')'; x.lineWidth = 0.6 + r() * 1.8; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 8, w * 0.6, y + (r() - 0.5) * 8, w, y + (r() - 0.5) * 4); x.stroke(); }
      for (let i = 0; i < 2; i++) { const kx = r() * w, ky = r() * h; x.strokeStyle = 'rgba(' + dark + ',0.35)'; for (let k = 1; k < 4; k++) { x.lineWidth = 1; x.beginPath(); x.ellipse(kx, ky, 4 * k, 2 * k, 0, 0, 7); x.stroke(); } }
    });
  }
  function boardsTex(THREE) {
    return canvasTex(THREE, 256, 256, (x, w, h) => {
      const r = rng(77); const n = 6, bw = h / n;
      for (let j = 0; j < n; j++) {
        const v = (r() - 0.5) * 22; x.fillStyle = 'rgb(' + (126 + v) + ',' + (88 + v) + ',' + (54 + v) + ')'; x.fillRect(0, j * bw, w, bw);
        for (let i = 0; i < 14; i++) { x.strokeStyle = 'rgba(60,36,18,' + (0.05 + r() * 0.1) + ')'; x.beginPath(); const y = j * bw + r() * bw; x.moveTo(0, y); x.lineTo(w, y + (r() - 0.5) * 3); x.stroke(); }
        const cut = r() * w; x.fillStyle = 'rgba(40,24,12,0.55)'; x.fillRect(cut, j * bw, 1.5, bw);
        x.fillStyle = 'rgba(30,18,8,0.7)'; x.fillRect(0, j * bw, w, 1.5);
      }
    });
  }
  function plasterTex(THREE) {
    return canvasTex(THREE, 128, 128, (x, w, h) => {
      const r = rng(5); x.fillStyle = '#e9e0cb'; x.fillRect(0, 0, w, h);
      const im = x.getImageData(0, 0, w, h), d = im.data; for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 10; d[i] += n; d[i + 1] += n; d[i + 2] += n; } x.putImageData(im, 0, 0);
      for (let i = 0; i < 12; i++) { x.fillStyle = 'rgba(120,100,70,' + (0.02 + r() * 0.03) + ')'; x.beginPath(); x.arc(r() * w, r() * h, 8 + r() * 22, 0, 7); x.fill(); }
    });
  }
  function weaveTex(THREE) {
    return canvasTex(THREE, 64, 64, (x, w, h) => {
      x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < w; i += 2) { x.fillStyle = 'rgba(0,0,0,' + (i % 4 ? 0.1 : 0.04) + ')'; x.fillRect(i, 0, 1, h); }
      for (let j = 0; j < h; j += 2) { x.fillStyle = 'rgba(0,0,0,' + (j % 4 ? 0.08 : 0.03) + ')'; x.fillRect(0, j, w, 1); }
    }, 6);
  }
  const cache = new WeakMap();
  function get(THREE) {
    if (cache.has(THREE)) return cache.get(THREE);
    const std = (o) => new THREE.MeshStandardMaterial(o);
    const weave = weaveTex(THREE);
    const lin = (h) => { const c = new THREE.Color(h); return c.convertSRGBToLinear ? c.convertSRGBToLinear() : c; };
    const fabrics = Object.create(null);
    const m = {
      oak: std({ color: 0xffffff, map: woodTex(THREE, '#7a5634', '40,24,10', 3), roughness: 0.55, envMapIntensity: 0.4 }),
      oakDark: std({ color: 0xffffff, map: woodTex(THREE, '#523620', '24,12,4', 9), roughness: 0.6, envMapIntensity: 0.35 }),
      plaster: std({ color: 0xffffff, map: plasterTex(THREE), roughness: 0.96, envMapIntensity: 0.2 }),
      floorBoards: std({ color: 0xffffff, map: boardsTex(THREE), roughness: 0.5, envMapIntensity: 0.4 }),
      brass: std({ color: lin(0xc9a24a), roughness: 0.32, metalness: 0.9, envMapIntensity: 0.9 }),
      glass: std({ color: lin(0xaac4d8), roughness: 0.05, metalness: 0.0, transparent: true, opacity: 0.22, depthWrite: false, envMapIntensity: 0.9 }),
      paper: std({ color: lin(0xf1e8d2), roughness: 0.9 }),
      leather: std({ color: lin(0x5b2f22), roughness: 0.55, envMapIntensity: 0.4 }),
      fabric(color) { const k = String(color); if (!fabrics[k]) fabrics[k] = std({ color: lin(color), map: weave, roughness: 0.95, envMapIntensity: 0.1 }); return fabrics[k]; }
    };
    for (const k of ['oak', 'oakDark', 'floorBoards']) if (m[k].map) { m[k].map.repeat.set(1, 1); }
    cache.set(THREE, m);
    return m;
  }
  root.TrinityMats = { get };
  if (typeof module !== 'undefined') module.exports = root.TrinityMats;
})(typeof window !== 'undefined' ? window : globalThis);
