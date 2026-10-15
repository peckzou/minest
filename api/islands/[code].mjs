// My World islands shared by code: /api/islands/<code>
//   POST /api/islands/new   publish a snapshot → { code }            (owner: the app token, or any Google sign-in)
//   PUT  /api/islands/<code> replace the snapshot and/or permission   (its owner only)
//   GET  /api/islands/<code> { code, perm, snap }                     (anyone, unless it is private → 403)
// Stored in the private Vercel Blob store "minest-islands" as islands/<code>.json = { code, owner, perm, snap, at }.
// A private island keeps no snapshot at all, so old links and the code stop working at once.
// Owner ids are hashes: the site owner (the app token, or a Google account on MINEST_AI_EMAILS) is one owner on
// every device; anyone else is their Firebase uid.
import { createHash, randomInt } from 'node:crypto';
import { put, get } from '@vercel/blob';
import { firebaseUser, allowedEmails } from '../_minest/auth.mjs';

export const config = { runtime: 'nodejs' };
const ALPHA = '23456789ABCDEFGHJKMNPQRSTUVWXYZ', MAX = 96 * 1024, PERMS = ['private', 'view', 'clone'];
const writes = new Map();

const hash = (s) => createHash('sha256').update(String(s)).digest('hex').slice(0, 24);
const send = (res, status, body) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); };
export const newCode = () => Array.from({ length: 6 }, () => ALPHA[randomInt(ALPHA.length)]).join('');
export const cleanCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^ISL/, '').slice(0, 12);

export async function ownerOf(req, env = process.env) {
  const token = req.headers['x-minest-token'];
  if (token && env.MINEST_AI_TOKEN && token === env.MINEST_AI_TOKEN) return 'p:' + hash('site-owner');
  const id = req.headers['x-minest-id-token'];
  if (!id) return null;
  const u = await firebaseUser(id);
  if (!u) return null;
  if (allowedEmails().includes(u.email)) return 'p:' + hash('site-owner');
  return 'u:' + hash(u.uid);
}

// a snapshot as the app makes it; anything else is refused
export function validSnap(s) {
  if (!s || typeof s !== 'object' || !Array.isArray(s.pc) || !Array.isArray(s.it)) return false;
  if (s.pc.length > 300 || s.it.length > 600) return false;
  return s.pc.every((p) => p && typeof p.k === 'string' && p.k.length < 20 && isFinite(p.x) && isFinite(p.y) && (!p.i || Array.isArray(p.i)))
    && s.it.every((x) => x && typeof x.t === 'string' && x.t.length <= 120 && (!x.p || (typeof x.p === 'string' && /^https:\/\//.test(x.p) && x.p.length < 500)));
}

const path = (code) => 'islands/' + code + '.json';
export async function load(code, blob = { get }) {
  const r = await blob.get(path(code), { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200) return null;
  return JSON.parse(await new Response(r.stream).text());
}
async function store(rec, blob) {
  await blob.put(path(rec.code), JSON.stringify(rec), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 });
}

export function makeHandler(blob = { put, get }, env = process.env) {
  return async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');   // no cookies: writes carry their own token headers
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Minest-Token, X-Minest-Id-Token, Content-Type');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
    const raw = String((req.query && req.query.code) || '');
    try {
      if (req.method === 'GET') {
        const code = cleanCode(raw); if (!code) return send(res, 400, { error: 'A code is needed' });
        const rec = await load(code, blob);
        if (!rec) return send(res, 404, { error: 'No island with that code' });
        const me = (req.headers['x-minest-token'] || req.headers['x-minest-id-token']) ? await ownerOf(req, env) : null, mine = !!me && me === rec.owner;
        if (rec.perm === 'private' && !mine) return send(res, 403, { error: 'This island is private' });
        return send(res, 200, { code, perm: rec.perm, snap: rec.snap, at: rec.at, mine });
      }
      if (req.method !== 'POST' && req.method !== 'PUT') return send(res, 405, { error: 'GET, POST or PUT' });
      const owner = await ownerOf(req, env);
      if (!owner) return send(res, 401, { error: 'Sign in to share an island' });
      const who = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim(), now = Date.now();
      const w = writes.get(who) || { at: now, n: 0 }; if (now - w.at > 60000) { w.at = now; w.n = 0; }
      if (w.n >= 30) return send(res, 429, { error: 'Too many changes — wait a minute' });
      w.n++; writes.set(who, w); if (writes.size > 500) writes.clear();
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      if (JSON.stringify(body).length > MAX) return send(res, 413, { error: 'This island is too big to share' });
      const perm = PERMS.includes(body.perm) ? body.perm : null;
      if (body.snap != null && !validSnap(body.snap)) return send(res, 400, { error: 'Not an island' });
      if (req.method === 'POST') {
        if (!perm || perm === 'private' || !body.snap) return send(res, 400, { error: 'A snapshot and View or Clone are needed' });
        let code = newCode(); for (let i = 0; i < 4 && (await load(code, blob)); i++) code = newCode();
        await store({ code, owner, perm, snap: body.snap, at: now }, blob);
        return send(res, 200, { code, perm });
      }
      const code = cleanCode(raw), rec = code && (await load(code, blob));
      if (!rec) return send(res, 404, { error: 'No island with that code' });
      if (rec.owner !== owner) return send(res, 403, { error: 'Only its owner can change it' });
      const next = perm || rec.perm;
      const snap = next === 'private' ? null : (body.snap || rec.snap);
      if (next !== 'private' && !snap) return send(res, 400, { error: 'A snapshot is needed' });
      await store({ code, owner, perm: next, snap, at: now }, blob);
      return send(res, 200, { code, perm: next });
    } catch (e) {
      return send(res, 502, { error: 'Island service unavailable', detail: String(e && e.message || e).slice(0, 200) });
    }
  };
}
export default makeHandler();
