// 3D models for My World islands, from Poly Pizza (free low-poly models, CC0 / CC-BY): /api/models/<op>
//   GET /api/models/search?q=tree&cursor=…   → { results: [{ id, title, creator, thumb, glb, licence, tris }], cursor }
//   GET /api/models/popular                  → same shape
//   GET /api/models/model?id=…               → one model
//   GET /api/models/file?url=https://…poly.pizza/….glb → the GLB itself (only Poly Pizza hosts; cached a year)
// The key stays here (POLY_PIZZA_KEY, from poly.pizza/settings/api); nobody else can use it through this route
// beyond a small per-caller rate limit.
export const config = { runtime: 'nodejs' };
const API = 'https://api.poly.pizza/v1/';
const hits = new Map();

const send = (res, status, body, cache) => {
  res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.setHeader('Access-Control-Allow-Origin', '*');
  if (cache) res.setHeader('Cache-Control', cache); res.end(JSON.stringify(body));
};
const pick = (m) => m && ({
  id: String(m.ID || m.id || ''), title: String(m.Title || m.title || 'Model'), creator: String((m.Creator && (m.Creator.Username || m.Creator.username)) || m.creator || ''),
  thumb: String(m.Thumbnail || m.thumbnail || ''), glb: String(m.Download || m.download || ''), licence: String(m.Licence || m.License || m.licence || ''),
  tris: Number(m.TriangleCount || m.triangleCount || 0) || 0, animated: !!(m.Animated || m.animated)
});
const okHost = (u) => { try { const h = new URL(u).hostname; return /(^|\.)poly\.pizza$/.test(h) || /(^|\.)polypizza\./.test(h) || /googleusercontent\.com$/.test(h); } catch (e) { return false; } };

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', '*'); return res.end(); }
  if (req.method !== 'GET') return send(res, 405, { error: 'GET only' });
  const who = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'x').split(',')[0].trim(), now = Date.now();
  const b = hits.get(who) || { at: now, n: 0 }; if (now - b.at > 60000) { b.at = now; b.n = 0; } b.n++; hits.set(who, b); if (hits.size > 2000) hits.clear();
  const op = String((req.query && req.query.op) || '').replace(/[^a-z]/g, ''), q = req.query || {};
  if (op === 'file') {   // the model file, through us (the CDN's CORS is not promised)
    if (b.n > 120) return send(res, 429, { error: 'Too many at once — wait a minute' });
    const url = String(q.url || ''); if (!okHost(url) || !/^https:\/\//.test(url)) return send(res, 400, { error: 'Not a Poly Pizza model' });
    try { const r = await fetch(url); if (!r.ok) return send(res, 502, { error: 'Could not fetch the model' }); const buf = Buffer.from(await r.arrayBuffer()); if (buf.length > 12 * 1024 * 1024) return send(res, 413, { error: 'Model too big' });
      res.statusCode = 200; res.setHeader('Content-Type', 'model/gltf-binary'); res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); return res.end(buf); }
    catch (e) { return send(res, 502, { error: 'Could not fetch the model' }); }
  }
  if (b.n > 40) return send(res, 429, { error: 'Too many searches at once — wait a minute' });
  const key = process.env.POLY_PIZZA_KEY; if (!key) return send(res, 503, { error: 'no-key', message: '3D model search is not set up yet (POLY_PIZZA_KEY)' });
  let path = '';
  if (op === 'search') { const term = String(q.q || '').trim().slice(0, 60); if (!term) return send(res, 400, { error: 'Type something to look for' }); path = 'search/' + encodeURIComponent(term); }
  else if (op === 'popular') path = 'popular';
  else if (op === 'model') { const id = String(q.id || '').replace(/[^A-Za-z0-9_-]/g, ''); if (!id) return send(res, 400, { error: 'id' }); path = 'model/' + id; }
  else return send(res, 404, { error: 'Unknown' });
  const qs = new URLSearchParams({ limit: String(Math.min(32, Math.max(1, +q.limit || 24))), format: 'glb', tricount: '0-30000' }); if (q.cursor) qs.set('cursor', String(q.cursor).slice(0, 200));
  try {
    const r = await fetch(API + path + (op === 'model' ? '' : '?' + qs), { headers: { 'X-Auth-Token': key } });
    if (!r.ok) return send(res, r.status === 404 ? 200 : 502, r.status === 404 ? { results: [], cursor: null } : { error: 'The model library did not answer (' + r.status + ')' });
    const d = await r.json();
    if (op === 'model') return send(res, 200, pick(d), 'public, max-age=86400');
    return send(res, 200, { results: (d.results || d.Results || []).map(pick).filter((m) => m.id && m.glb), cursor: d.cursor || d.Cursor || null }, 'public, max-age=600');
  } catch (e) { return send(res, 502, { error: 'The model library did not answer' }); }
}
