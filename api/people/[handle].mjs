// A person's public page in My World: /api/people/<handle>  (shown at …/iphone#@<handle>)
//   GET  → { handle, name, avatar, center, islands: [{ code, title, perm, n, pics, skin, slot, lists }] }  (the owner's home sky)  (404 when there is none or it is off)
//   PUT  → claim / update your page (owner only): { name, avatar, islands, public }
// One handle per owner: claiming a new one frees the old. A page that is off keeps its handle but shows nothing.
// Stored in the private Blob store "minest-islands": people/<handle>.json and owners/<owner>.json = { handle }.
// Islands themselves stay behind their own codes (/api/islands/<code>), so a private island never shows anyway.
import { put, get, del } from '@vercel/blob';
import { ownerOf } from '../_minest/owner.mjs';

export const config = { runtime: 'nodejs' };
const RESERVED = new Set(['admin', 'api', 'minest', 'iphone', 'ipad', 'web', 'play', 'help', 'support', 'root', 'system', 'me', 'world', 'island', 'islands', 'people', 'peck-team']);
const writes = new Map();
const send = (res, status, body) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); };
export const cleanHandle = (h) => String(h || '').trim().replace(/^@/, '').toLowerCase();
export const okHandle = (h) => /^[a-z0-9][a-z0-9_-]{2,19}$/.test(h) && !RESERVED.has(h);
const opts = { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 };

async function read(blob, path) { const r = await blob.get(path, { access: 'private', useCache: false }); if (!r || r.statusCode !== 200) return null; return JSON.parse(await new Response(r.stream).text()); }
const https = (u) => typeof u === 'string' && /^https:\/\//.test(u) && u.length < 500;
export function cleanPage(b) {
  const islands = (Array.isArray(b.islands) ? b.islands : []).slice(0, 40).filter((x) => x && /^[A-Z0-9]{4,12}$/.test(String(x.code || ''))).map((x) => ({
    code: String(x.code), title: String(x.title || '').slice(0, 80), perm: x.perm === 'clone' ? 'clone' : 'view', n: Math.max(0, Math.min(9999, +x.n || 0)),
    pics: (Array.isArray(x.pics) ? x.pics : []).filter(https).slice(0, 3), scene: /^(island|room|museum)$/.test(x.scene) ? x.scene : 'island',
    skin: /^[a-z0-9_]{2,60}$/.test(String(x.skin || '')) ? String(x.skin) : '', slot: Math.max(0, Math.min(29, Math.round(+x.slot || 0))), lists: Math.max(0, Math.min(999, +x.lists || 0)) }));
  const center = /^[a-z0-9_]{2,60}$/.test(String(b.center || '')) ? String(b.center) : 'center_castle';
  const av = b.avatar && typeof b.avatar === 'object' ? Object.fromEntries(Object.entries(b.avatar).filter(([k, v]) => /^[a-z]{2,10}$/.test(k) && (typeof v === 'boolean' || (typeof v === 'string' && /^(#[0-9a-f]{6}|[a-z]{2,10})$/i.test(v)))).slice(0, 10)) : null;
  return { name: String(b.name || '').trim().slice(0, 40), avatar: av, center, islands };
}

export function makeHandler(blob = { put, get, del }, env = process.env) {
  return async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Minest-Token, X-Minest-Id-Token, Content-Type');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
    const handle = cleanHandle(req.query && req.query.handle);
    try {
      if (req.method === 'GET') {
        const me = (req.headers['x-minest-token'] || req.headers['x-minest-id-token']) ? await ownerOf(req, env) : null;
        if (handle === 'me') {   // the page that belongs to whoever asks (to fill in Settings)
          if (!me) return send(res, 401, { error: 'Sign in first' });
          const o = await read(blob, 'owners/' + me + '.json'); if (!o) return send(res, 404, { error: 'No page yet' });
          const p = await read(blob, 'people/' + o.handle + '.json'); return p ? send(res, 200, { handle: p.handle, name: p.name, public: p.public !== false, islands: p.islands || [], mine: true }) : send(res, 404, { error: 'No page yet' });
        }
        if (!okHandle(handle)) return send(res, 404, { error: 'No one by that name' });
        const p = await read(blob, 'people/' + handle + '.json');
        const mine = !!me && !!p && p.owner === me;
        if (!p || (p.public === false && !mine)) return send(res, 404, { error: 'No one by that name' });
        return send(res, 200, { handle, name: p.name || handle, avatar: p.avatar || null, center: p.center || 'center_castle', islands: p.islands || [], public: p.public !== false, mine, at: p.at });
      }
      if (req.method !== 'PUT') return send(res, 405, { error: 'GET or PUT' });
      const owner = await ownerOf(req, env);
      if (!owner) return send(res, 401, { error: 'Sign in to make your page' });
      if (!okHandle(handle)) return send(res, 400, { error: 'A name of 3–20 letters, numbers, - or _' });
      const who = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim(), now = Date.now();
      const w = writes.get(who) || { at: now, n: 0 }; if (now - w.at > 60000) { w.at = now; w.n = 0; }
      if (w.n >= 30) return send(res, 429, { error: 'Too many changes — wait a minute' });
      w.n++; writes.set(who, w); if (writes.size > 500) writes.clear();
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      if (JSON.stringify(body).length > 64 * 1024) return send(res, 413, { error: 'Too big' });
      const cur = await read(blob, 'people/' + handle + '.json');
      if (cur && cur.owner !== owner) return send(res, 409, { error: 'That name is taken' });
      const mineBefore = await read(blob, 'owners/' + owner + '.json');
      if (mineBefore && mineBefore.handle && mineBefore.handle !== handle) await blob.del('people/' + mineBefore.handle + '.json').catch(() => {});   // one name each: the old one is free again
      const page = cleanPage(body), pub = body.public !== false;
      await blob.put('people/' + handle + '.json', JSON.stringify(Object.assign({ handle, owner, public: pub, at: now }, pub ? page : { name: '', avatar: null, islands: [] })), opts);
      await blob.put('owners/' + owner + '.json', JSON.stringify({ handle, at: now }), opts);
      return send(res, 200, { handle, public: pub, islands: pub ? page.islands.length : 0 });
    } catch (e) {
      return send(res, 502, { error: 'People service unavailable', detail: String(e && e.message || e).slice(0, 200) });
    }
  };
}
export default makeHandler();
