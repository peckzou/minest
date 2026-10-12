// Minest Discovery Engine · related movies / TV from TMDB (server side: the TMDB token never reaches the browser).
// GET /api/library/related?kind=recommendations&media=movie|tv&id=N  → { items } "people who liked this also liked"
// GET /api/library/related?kind=person&id=N&job=Director|Acting      → { items } that person's other work
// Same guard as /api/library/tmdb: Minest device / Firebase authorization, strict input, a per-instance rate limit,
// and no upstream body, URL or header is ever returned.
import { authorize } from '../_minest/auth.mjs';
import { withCors } from '../_minest/cors.mjs';
export const config = { runtime: 'nodejs' };

export function createRelatedHandler({ env = process.env, fetchFn = (...a) => fetch(...a), authorizeFn = authorize, now = Date.now } = {}) {
  const limits = new Map();
  const send = (res, code, data) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'private, max-age=600'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.end(JSON.stringify(data)); };
  async function upstream(path, params = {}) {
    const url = new URL('https://api.themoviedb.org/3/' + path);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    const r = await fetchFn(url.href, { headers: { Authorization: 'Bearer ' + String(env.TMDB_READ_ACCESS_TOKEN || '').trim(), Accept: 'application/json' }, signal: AbortSignal.timeout(10000), redirect: 'error' });
    if (!r.ok) { const e = new Error('TMDB request failed'); e.upstream = r.status; throw e; }
    return r.json();
  }
  const poster = (p) => /^\/[A-Za-z0-9_.-]+\.(jpg|png|webp)$/.test(p || '') ? 'https://image.tmdb.org/t/p/w185' + p : '';
  function item(d, type) {
    type = type || d.media_type;
    if (!['movie', 'tv'].includes(type) || !Number.isSafeInteger(d.id) || d.id <= 0 || !(d.title || d.name) || d.adult) return null;
    const date = type === 'movie' ? d.release_date : d.first_air_date, year = /^\d{4}/.test(date || '') ? Number(date.slice(0, 4)) : null;
    return { entityId: 'tmdb:' + type + ':' + d.id, entityType: type, title: String(d.title || d.name), subtitle: type === 'tv' ? 'TV series' : 'Movie', source: { provider: 'tmdb', externalId: String(d.id), url: 'https://www.themoviedb.org/' + type + '/' + d.id },
      image: { url: poster(d.poster_path), attribution: 'Poster via TMDB. Image rights belong to their respective owners.', license: null }, metadata: { year, date: date || '', overview: String(d.overview || '').slice(0, 2000), popularity: Number(d.popularity) || 0 } };
  }
  return async function handler(req, res) {
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return send(res, 405, { error: 'GET required' }); }
    try {
      const auth = await authorizeFn(req, env.MINEST_AI_TOKEN);
      if (!auth.ok) return send(res, auth.status, { error: 'Sign in to Minest or authorize this device.', code: 'MINEST_AUTH_REQUIRED' });
      if (!env.TMDB_READ_ACCESS_TOKEN || /\s/.test(String(env.TMDB_READ_ACCESS_TOKEN).trim())) return send(res, 503, { error: 'Movie suggestions are not configured yet.', code: 'TMDB_NOT_CONFIGURED' });
      const q = req.query || {};
      if (Object.values(q).some(Array.isArray) || !/^\d{1,10}$/.test(String(q.id || '')) || Number(q.id) < 1) return send(res, 400, { error: 'Invalid request' });
      const kind = q.kind, media = q.media || 'movie', job = q.job || 'Director';
      if (!['recommendations', 'person'].includes(kind) || !['movie', 'tv'].includes(media) || !['Director', 'Acting'].includes(job)) return send(res, 400, { error: 'Invalid request' });
      const client = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
      for (const [k, v] of limits) if (now() - v.at > 60000) limits.delete(k);
      const b = limits.get(client) || { at: now(), count: 0 };
      if (b.count >= 40 || (!limits.has(client) && limits.size >= 500)) { res.setHeader('Retry-After', '60'); return send(res, 429, { error: 'Too many requests. Please wait a minute.' }); }
      b.count++; limits.set(client, b);
      if (kind === 'recommendations') {
        const d = await upstream(media + '/' + q.id + '/recommendations', { language: 'en-US', page: 1 });
        return send(res, 200, { items: (d.results || []).map((x) => item(x, media)).filter(Boolean).slice(0, 12) });
      }
      const d = await upstream('person/' + q.id + '/combined_credits', { language: 'en-US' });
      const list = job === 'Director' ? (d.crew || []).filter((x) => x.job === 'Director') : (d.cast || []);
      const seen = new Set(), items = [];
      list.map((x) => item(x)).filter(Boolean).sort((a, z) => z.metadata.popularity - a.metadata.popularity).forEach((x) => { if (!seen.has(x.entityId)) { seen.add(x.entityId); items.push(x); } });
      return send(res, 200, { items: items.slice(0, 12) });
    } catch (e) {
      if (e.upstream === 429) return send(res, 429, { error: 'TMDB is busy. Please try again later.' });
      if (e.upstream === 404) return send(res, 404, { error: 'Not available from TMDB.' });
      return send(res, 502, { error: 'Suggestions are temporarily unavailable.' });
    }
  };
}
export default withCors(createRelatedHandler());
