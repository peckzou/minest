// Reuses Minest's existing device/Firebase authorization. This proxy never accepts arbitrary URLs.
import { authorize } from '../_minest/auth.mjs';
import { withCors } from '../_minest/cors.mjs';
export const config = { runtime: 'nodejs' };

export function createTMDBHandler({ env = process.env, fetchFn = (...args) => fetch(...args), authorizeFn = authorize, now = Date.now } = {}) {
  const limits = new Map();
  let images = null, imagesUntil = 0;
  const response = (res, code, data) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.end(JSON.stringify(data)); };
  async function upstream(path, params = {}) {
    const url = new URL('https://api.themoviedb.org/3/' + path);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
    const token = String(env.TMDB_READ_ACCESS_TOKEN || '').trim();
    const r = await fetchFn(url.href, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' }, signal: AbortSignal.timeout(10000), redirect: 'error' });
    if (!r.ok) { const e = new Error('TMDB request failed'); e.upstream = r.status; e.retry = r.headers.get('retry-after'); throw e; }
    return r.json();
  }
  async function imageConfig() {
    if (images && now() < imagesUntil) return images;
    const data = await upstream('configuration');
    const c = data.images || {};
    if (c.secure_base_url !== 'https://image.tmdb.org/t/p/' || !Array.isArray(c.poster_sizes)) throw new Error('Invalid TMDB image configuration');
    images = { base: c.secure_base_url, poster: c.poster_sizes.includes('w185') ? 'w185' : c.poster_sizes.find(x => /^w\d+$/.test(x)), portrait: (c.profile_sizes || []).includes('w185') ? 'w185' : '' }; imagesUntil = now() + 3600000; return images;
  }
  function image(path, settings, portrait = false) {
    const size = portrait ? settings.portrait : settings.poster;
    return size && /^\/[A-Za-z0-9_.-]+\.(jpg|png|webp)$/.test(path || '') ? settings.base + size + path : '';
  }
  function normalize(d, type, settings) {
    if (!['movie', 'tv'].includes(type) || !Number.isSafeInteger(d.id) || d.id <= 0 || !(d.title || d.name)) return null;
    const date = type === 'movie' ? d.release_date : d.first_air_date, year = /^\d{4}/.test(date || '') ? Number(date.slice(0, 4)) : null;
    return { entityId: 'tmdb:' + type + ':' + d.id, entityType: type, title: String(d.title || d.name), subtitle: type === 'tv' ? 'TV series' : 'Movie', source: { provider: 'tmdb', externalId: String(d.id), url: 'https://www.themoviedb.org/' + type + '/' + d.id }, image: { url: image(d.poster_path, settings), attribution: 'Poster via TMDB. Image rights belong to their respective owners.', license: null }, metadata: { year, date: date || '', originalTitle: d.original_title || d.original_name || '', overview: String(d.overview || '').slice(0, 8000), genres: (d.genres || []).map(g => g.name), runtime: d.runtime || null, seasons: d.number_of_seasons || null } };
  }
  return async function handler(req, res) {
    const origin = req.headers.origin;
    const allowed = String(env.MINEST_LIBRARY_ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
    if (origin && allowed.includes(origin)) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); res.setHeader('Access-Control-Allow-Headers', 'X-Minest-Token, X-Minest-Id-Token'); res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); }
    if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET, OPTIONS'); return response(res, 405, { error: 'GET required' }); }
    try {
      const auth = await authorizeFn(req, env.MINEST_AI_TOKEN);
      if (!auth.ok) return response(res, auth.status, { error: auth.status === 503 ? 'Minest authorization is not configured on this server.' : 'Sign in to Minest or authorize this device to search Movies / TV.', code: 'MINEST_AUTH_REQUIRED' });
      if (!env.TMDB_READ_ACCESS_TOKEN || /\s/.test(String(env.TMDB_READ_ACCESS_TOKEN).trim())) return response(res, 503, { error: 'Movie search is not configured yet. Books is available.', code: 'TMDB_NOT_CONFIGURED' });
      const q = req.query || {}, action = q.action || 'search', media = q.media || 'all';
      if (!['search', 'details'].includes(action) || !['all', 'movie', 'tv'].includes(media) || Object.values(q).some(Array.isArray)) return response(res, 400, { error: 'Invalid request' });
      let path, params;
      if (action === 'search') {
        const query = String(q.q || '').trim(), page = Number(q.page || 1);
        if (query.length < 2 || query.length > 160 || !Number.isInteger(page) || page < 1 || page > 10) return response(res, 400, { error: 'Use 2–160 search characters and a page between 1 and 10.' });
        path = 'search/' + (media === 'all' ? 'multi' : media); params = { query, page, include_adult: false, language: 'en-US' };
      } else {
        if (!['movie', 'tv'].includes(media) || !/^\d{1,10}$/.test(String(q.id || '')) || Number(q.id) < 1) return response(res, 400, { error: 'A valid movie or TV ID is required' });
        path = media + '/' + q.id; params = { append_to_response: 'credits', language: 'en-US' };
      }
      // Bounded per-instance protection in addition to existing Minest authentication.
      const client = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
      for (const [key, value] of limits) if (now() - value.at > 60000) limits.delete(key);
      const bucket = limits.get(client) || { at: now(), count: 0 };
      if (bucket.count >= 60 || (!limits.has(client) && limits.size >= 500)) { res.setHeader('Retry-After', '60'); return response(res, 429, { error: 'Too many searches. Please wait a minute.' }); }
      bucket.count++; limits.set(client, bucket);
      const settings = await imageConfig(), data = await upstream(path, params);
      if (action === 'search') {
        if (!Array.isArray(data.results)) throw new Error('Invalid TMDB response');
        return response(res, 200, { items: data.results.filter(x => !x.adult).map(x => normalize(x, media === 'all' ? x.media_type : media, settings)).filter(Boolean).slice(0, 20), more: Number(q.page || 1) < Math.min(10, Number(data.total_pages || 0)) });
      }
      const item = normalize(data, media, settings);
      if (!item) throw new Error('Invalid TMDB details');
      item.description = item.metadata.overview;
      item.metadata.cast = (data.credits?.cast || []).slice(0, 12).map(p => ({ id: 'tmdb:person:' + p.id, name: String(p.name || ''), character: String(p.character || ''), url: 'https://www.themoviedb.org/person/' + p.id, image: image(p.profile_path, settings, true) }));
      item.metadata.directors = (data.credits?.crew || []).filter(p => p.job === 'Director').slice(0, 6).map(p => ({ id: 'tmdb:person:' + p.id, name: p.name, url: 'https://www.themoviedb.org/person/' + p.id }));
      item.metadata.creators = (data.created_by || []).slice(0, 6).map(p => ({ id: 'tmdb:person:' + p.id, name: p.name, url: 'https://www.themoviedb.org/person/' + p.id }));
      return response(res, 200, { item });
    } catch (e) {
      // Never return upstream bodies, URLs, request headers or credentials.
      if (e.upstream === 429) { res.setHeader('Retry-After', /^\d+$/.test(e.retry || '') ? e.retry : '30'); return response(res, 429, { error: 'TMDB is busy. Please try again later.' }); }
      if (e.upstream === 401 || e.upstream === 403) return response(res, 502, { error: 'The server could not authenticate with TMDB. Check its server configuration.', code: 'TMDB_CREDENTIAL_ERROR' });
      if (e.upstream === 404) return response(res, 404, { error: 'This title is no longer available from TMDB.' });
      return response(res, 502, { error: 'TMDB is temporarily unavailable. Please retry.' });
    }
  };
}
export default withCors(createTMDBHandler());
