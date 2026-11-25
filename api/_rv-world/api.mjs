// RV World API gateway: proxies free/open travel data providers, normalizes payloads,
// and keeps an on-disk cache so we stay polite to community-run services.
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as N from './normalize.mjs';
import { PbfReader as Pbf } from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = process.env.RVWORLD_CACHE_DIR || path.join(ROOT, '.cache');
// Wikimedia/Nominatim ask for a descriptive User-Agent with a URL or contact; set RVWORLD_CONTACT to add your e-mail.
const UA = process.env.RVWORLD_USER_AGENT || `RVWorld/0.1 (http://localhost:5199; local personal travel simulator${process.env.RVWORLD_CONTACT ? `; ${process.env.RVWORLD_CONTACT}` : ''}) node`;
const VALHALLA = process.env.VALHALLA_URL || 'https://valhalla1.openstreetmap.de';
const OSRM = process.env.OSRM_URL || 'https://router.project-osrm.org';
const OVERPASS = (process.env.OVERPASS_URLS || 'https://overpass-api.de/api/interpreter,https://overpass.private.coffee/api/interpreter,https://maps.mail.ru/osm/tools/overpass/api/interpreter,https://overpass.kumi.systems/api/interpreter').split(',').map((s) => s.trim()).filter(Boolean);
const OVERPASS_CH = 'https://overpass.osm.ch/api/interpreter'; // Switzerland-only extract
const TERRAIN = process.env.TERRAIN_TILE_URL || 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
const otmKey = () => process.env.OPENTRIPMAP_API_KEY || '';
const gmKey = () => process.env.GOOGLE_MAPS_API_KEY || '';

const MIN = 60e3, HOUR = 60 * MIN, DAY = 24 * HOUR;

class UpstreamError extends Error {
  constructor(message, status = 502) { super(message); this.status = status; }
}

const keyOf = (s) => crypto.createHash('sha1').update(s).digest('hex');

async function cacheRead(key) {
  try { return JSON.parse(await fs.readFile(path.join(CACHE_DIR, `${key}.json`), 'utf8')); } catch { return null; }
}
async function cacheWrite(key, data) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(path.join(CACHE_DIR, `${key}.json`), JSON.stringify({ ts: Date.now(), data }));
}

/** Cache wrapper: fresh hit → cached; upstream failure with old entry → stale (flagged, never invented). */
async function cached(name, ttl, producer) {
  const key = keyOf(name);
  const hit = await cacheRead(key);
  if (hit && Date.now() - hit.ts < ttl) return { ...hit.data, fetchedAt: hit.ts, cached: true };
  try {
    const data = await producer();
    await cacheWrite(key, data);
    return { ...data, fetchedAt: Date.now(), cached: false };
  } catch (e) {
    if (hit) return { ...hit.data, fetchedAt: hit.ts, cached: true, stale: true, staleReason: String(e.message || e) };
    throw e;
  }
}

async function fetchT(url, opts = {}, timeoutMs = 20000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  const onOuter = () => ctl.abort();
  opts.signal?.addEventListener('abort', onOuter);
  try {
    return await fetch(url, { ...opts, signal: ctl.signal, headers: { 'User-Agent': UA, Accept: 'application/json', ...(opts.headers || {}) } });
  } catch (e) {
    throw new UpstreamError(`${new URL(url).host}: ${e.name === 'AbortError' ? 'timeout' : e.cause?.code || e.message}`);
  } finally { clearTimeout(t); opts.signal?.removeEventListener('abort', onOuter); }
}

// Wikimedia APIs rate-limit anonymous bursts: run those requests one at a time with a small gap.
let wikimediaChain = Promise.resolve();
const isWikimedia = (url) => /\.(wikipedia|wikivoyage|wikidata)\.org\//.test(url);
function wikimediaSlot() {
  const prev = wikimediaChain;
  let release;
  wikimediaChain = new Promise((r) => { release = r; });
  return prev.then(() => () => setTimeout(release, 220));
}

async function getJson(url, opts, timeoutMs, attempt = 0) {
  const done = isWikimedia(url) ? await wikimediaSlot() : null;
  let r;
  try { r = await fetchT(url, opts, timeoutMs); } catch (e) {
    done?.();
    if (attempt < 1) { await new Promise((res) => setTimeout(res, 1200)); return getJson(url, opts, timeoutMs, attempt + 1); }
    throw e;
  }
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    // polite retries on rate-limit / transient upstream errors (honours Retry-After)
    if ((r.status === 429 || r.status >= 500) && attempt < 3) {
      const wait = Math.min(8000, (Number(r.headers.get('retry-after')) || 0) * 1000 || 1500 * (attempt + 1));
      await new Promise((res) => setTimeout(res, wait));
      done?.();
      return getJson(url, opts, timeoutMs, attempt + 1);
    }
    done?.();
    throw new UpstreamError(`${new URL(url).host} HTTP ${r.status}: ${body.slice(0, 160)}`, r.status === 429 ? 429 : 502);
  }
  try { return await r.json(); } finally { done?.(); }
}

// Nominatim usage policy: max 1 request/second.
let nominatimChain = Promise.resolve();
function nominatim(url) {
  const run = nominatimChain.then(() => getJson(url));
  nominatimChain = run.catch(() => {}).then(() => new Promise((r) => setTimeout(r, 1100)));
  return run;
}

const inSwitzerland = (lat, lon) => lat > 45.8 && lat < 47.85 && lon > 5.9 && lon < 10.55;

/** Hedged Overpass query across mirrors: start the next mirror if the current one fails or is slow. */
async function overpass(query, hint) {
  const mirrors = [...OVERPASS];
  if (hint && inSwitzerland(hint[0], hint[1])) mirrors.splice(1, 0, OVERPASS_CH);
  const ctl = new AbortController();
  const errors = [];
  return new Promise((resolve, reject) => {
    let idx = 0, pending = 0, done = false, timer = null;
    const launch = () => {
      if (done || idx >= mirrors.length) return;
      const url = mirrors[idx++];
      pending++;
      clearTimeout(timer);
      timer = setTimeout(launch, 6000);
      fetchT(url, { method: 'POST', body: new URLSearchParams({ data: query }), signal: ctl.signal }, 45000)
        .then(async (r) => {
          if (!r.ok) throw new UpstreamError(`${new URL(url).host} HTTP ${r.status}`);
          const j = await r.json();
          if (j.remark && /error|timed out/i.test(j.remark) && !(j.elements || []).length) throw new UpstreamError(`${new URL(url).host}: ${j.remark.slice(0, 100)}`);
          return j;
        })
        .then((j) => { if (done) return; done = true; clearTimeout(timer); ctl.abort(); resolve({ json: j, mirror: new URL(url).host }); })
        .catch((e) => {
          errors.push(e.message); pending--;
          if (done) return;
          if (idx < mirrors.length) launch();
          else if (pending === 0) { done = true; clearTimeout(timer); reject(new UpstreamError(`Overpass 所有镜像均不可用: ${errors.join(' | ')}`, 503)); }
        });
    };
    launch();
  });
}

const num = (v, name, lo, hi) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < lo || n > hi) throw new UpstreamError(`参数 ${name} 无效`, 400);
  return n;
};
const latlon = (q) => [num(q.lat, 'lat', -90, 90), num(q.lon, 'lon', -180, 180)];
const r4 = (n) => Math.round(n * 1e4) / 1e4;

function polyArg(points, max = 60) {
  if (!Array.isArray(points) || points.length < 1 || points.length > 20000) throw new UpstreamError('points 无效', 400);
  const thin = N.thinPoints(points, max);
  for (const p of thin) { num(p[0], 'lat', -90, 90); num(p[1], 'lon', -180, 180); }
  return thin.map((p) => `${(+p[0]).toFixed(5)},${(+p[1]).toFixed(5)}`).join(',');
}

const POI_FILTERS = (a) => `
  nwr["tourism"~"^(attraction|viewpoint|museum)$"]["name"]${a};
  nwr["natural"~"^(waterfall|cave_entrance|glacier|hot_spring|geyser|arch)$"]["name"]${a};
  nwr["waterway"="waterfall"]["name"]${a};
  nwr["natural"="peak"]["name"]["wikidata"]${a};
  nwr["historic"~"^(castle|monument|ruins|archaeological_site|memorial|fort|church|monastery|city_gate|aqueduct|manor)$"]["name"]${a};`;
const NOTABLE_FILTERS = (a) => `
  nwr["tourism"~"^(attraction|viewpoint|museum)$"]["name"]["wikidata"]${a};
  nwr["natural"~"^(waterfall|cave_entrance|glacier|hot_spring|geyser|arch|peak)$"]["name"]["wikipedia"]${a};
  nwr["historic"]["name"]["wikidata"]${a};`;
const CAMP_FILTERS = (a) => `nwr["tourism"~"^(camp_site|caravan_site)$"]${a};`;
const PARK_FILTERS = (a) => `nwr["amenity"="parking"]["access"!~"^(private|no|customers)$"]${a};`;

function splitOverpass(json) {
  const camps = [], parking = [], pois = [];
  const seen = new Set();
  for (const el of json.elements || []) {
    const t = el.tags || {};
    if (/^(camp_site|caravan_site)$/.test(t.tourism || '')) { const c = N.normalizeCampsite(el); if (c) camps.push(c); }
    else if (t.amenity === 'parking') { const p = N.normalizeParking(el); if (p) parking.push(p); }
    else { const p = N.normalizeOsmPoi(el); if (p && !seen.has(p.name)) { seen.add(p.name); pois.push(p); } }
  }
  return { camps, parking, pois };
}

async function wikiGeo(lang, lat, lon, radius, limit) {
  const u = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${lat}%7C${lon}&ggsradius=${Math.min(10000, Math.round(radius))}&ggslimit=${limit}&prop=coordinates%7Cpageimages%7Cdescription%7Cpageprops&piprop=thumbnail&pithumbsize=480&ppprop=wikibase_item&colimit=${limit}&pilimit=${limit}&format=json`;
  return N.normalizeWikiGeo(await getJson(u), lang, [lat, lon]);
}

async function routeLeg(a, b, lang) {
  const straight = N.haversineKm([a.lat, a.lon], [b.lat, b.lon]);
  const fail = { ok: false, straightKm: straight, coords: [[a.lat, a.lon], [b.lat, b.lon]] };
  if (straight < 0.02) return { ...fail, error: '起点与终点相同', reason: 'same' };
  const errors = [];
  if (straight < 1450) {
    try {
      const body = { locations: [{ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon }], costing: 'auto', language: lang || 'zh-CN', units: 'kilometers' };
      const r = await fetchT(`${VALHALLA}/route`, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }, 30000);
      const j = await r.json();
      if (r.ok && j.trip) return N.normalizeValhallaLeg(j.trip);
      errors.push(`Valhalla: ${j.error || r.status}${j.error_code ? ` (#${j.error_code})` : ''}`);
      // 170/171 = no suitable edges near location; 442 = no path found.
      if ([170, 171, 442].includes(j.error_code)) return { ...fail, error: errors.join('; '), reason: 'no_road' };
    } catch (e) { errors.push(`Valhalla: ${e.message}`); }
  } else errors.push('Valhalla 公共服务单段上限 1500 km，已改用 OSRM');
  try {
    const j = await getJson(`${OSRM}/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson&steps=true`, {}, 40000);
    if (j.code === 'Ok' && j.routes?.length) {
      // OSRM silently snaps unreachable points to the nearest connected road (possibly on another continent): never present that as a route.
      const snap = Math.max(...(j.waypoints || []).map((w) => w.distance || 0));
      if (snap > 1500) return { ...fail, error: `${errors.join('; ')}; OSRM: 终点/起点无法经道路网络连通（最近可达道路在 ${Math.round(snap / 1000)} km 之外）`, reason: 'no_road' };
      return { ...N.normalizeOsrmLeg(j), notes: errors };
    }
    errors.push(`OSRM: ${j.code}`);
    return { ...fail, error: errors.join('; '), reason: 'no_road' };
  } catch (e) {
    errors.push(`OSRM: ${e.message}`);
    const noRoute = /NoRoute|NoSegment/.test(e.message);
    return { ...fail, error: errors.join('; '), reason: noRoute ? 'no_road' : 'service' };
  }
}

export function createApi() {
  const api = express.Router();
  api.use(express.json({ limit: '4mb' }));
  const h = (fn) => (req, res) => fn(req, res).catch((e) => {
    const status = e.status || 500;
    if (status >= 500 && !(e instanceof UpstreamError)) console.error('[api]', req.path, e);
    res.status(status).json({ error: String(e.message || e) });
  });

  api.get('/status', h(async (_req, res) => {
    res.json({
      app: 'RV World', time: Date.now(),
      providers: {
        search: 'Photon / Nominatim (OpenStreetMap)', routing: `Valhalla (${new URL(VALHALLA).host}) → OSRM 备用`,
        overpass: OVERPASS.map((u) => new URL(u).host),
        weather: 'Open-Meteo', knowledge: 'Wikivoyage + Wikidata + Wikipedia', elevation: 'Mapzen Terrarium (AWS Open Data)',
        openTripMap: otmKey() ? 'configured' : 'missing_key',
        streetView: gmKey() ? 'Google Street View → Panoramax 备用' : 'Panoramax（未配置 GOOGLE_MAPS_API_KEY）', googleStreetView: gmKey() ? 'configured' : 'missing_key',
      },
    });
  }));

  api.get('/search', h(async (req, res) => {
    const q = String(req.query.q || '').trim().slice(0, 120);
    if (q.length < 2) throw new UpstreamError('搜索词太短', 400);
    res.json(await cached(`search:${q.toLowerCase()}`, 7 * DAY, async () => {
      try {
        const results = N.normalizePhoton(await getJson(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en`, {}, 9000));
        if (results.length) return { results, source: 'Photon (OpenStreetMap)' };
      } catch { /* fall through to Nominatim */ }
      const results = N.normalizeNominatim(await nominatim(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=8&addressdetails=1&extratags=1&accept-language=zh,en`));
      return { results, source: 'Nominatim (OpenStreetMap)' };
    }));
  }));

  api.get('/reverse', h(async (req, res) => {
    const [lat, lon] = latlon(req.query);
    const zoom = Math.round(num(req.query.zoom ?? 12, 'zoom', 3, 18));
    res.json(await cached(`reverse:${r4(lat)},${r4(lon)},${zoom}`, 30 * DAY, async () => {
      const place = N.normalizeReverse(await nominatim(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=${zoom}&addressdetails=1&extratags=1&accept-language=zh,en`));
      return { place, source: 'Nominatim (OpenStreetMap)' };
    }));
  }));

  api.get('/weather', h(async (req, res) => {
    const [lat, lon] = latlon(req.query);
    res.json(await cached(`weather:${r4(lat)},${r4(lon)}`, 10 * MIN, async () => N.normalizeWeather(await getJson(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset&forecast_days=4&timezone=auto`))));
  }));

  api.get('/wikivoyage', h(async (req, res) => {
    const title = String(req.query.title || '').trim().slice(0, 150);
    const hasCoord = req.query.lat != null && req.query.lon != null;
    const coord = hasCoord ? latlon(req.query) : null;
    if (!title && !coord) throw new UpstreamError('需要 title 或坐标', 400);
    res.json(await cached(`wikivoyage:${title}:${coord ? coord.map(r4) : ''}`, 7 * DAY, async () => {
      const fetchPage = async (lang, t) => {
        const j = await getJson(`https://${lang}.wikivoyage.org/w/api.php?action=query&prop=extracts%7Ccoordinates%7Cpageimages&explaintext=1&redirects=1&piprop=thumbnail&pithumbsize=640&titles=${encodeURIComponent(t)}&format=json`);
        const p = Object.values(j.query?.pages || {})[0];
        if (!p || p.missing != null || !p.extract) return null;
        const c = p.coordinates?.[0];
        if (coord && c && N.haversineKm(coord, [c.lat, c.lon]) > 150) return null; // same name, different place
        const parsed = N.parseWikiSections(p.extract);
        return { found: true, lang, title: p.title, intro: parsed.intro, sections: parsed.sections, image: p.thumbnail?.source || null,
          url: `https://${lang}.wikivoyage.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`, matchedBy: 'title', source: `Wikivoyage (${lang}) — CC BY-SA` };
      };
      for (const lang of ['en', 'zh']) {
        if (title) { const p = await fetchPage(lang, title); if (p) return p; }
      }
      if (coord) {
        const j = await getJson(`https://en.wikivoyage.org/w/api.php?action=query&list=geosearch&gscoord=${coord[0]}%7C${coord[1]}&gsradius=20000&gslimit=3&format=json`);
        const near = j.query?.geosearch?.[0];
        if (near) { const p = await fetchPage('en', near.title); if (p) return { ...p, matchedBy: 'nearby', nearbyKm: near.dist / 1000 }; }
      }
      return { found: false, source: 'Wikivoyage' };
    }));
  }));

  api.get('/wikidata', h(async (req, res) => {
    const id = String(req.query.id || '').trim();
    const name = String(req.query.name || '').trim().slice(0, 120);
    const coord = req.query.lat != null ? latlon(req.query) : null;
    if (id && !/^Q\d+$/.test(id)) throw new UpstreamError('id 无效', 400);
    if (!id && !name) throw new UpstreamError('需要 id 或 name', 400);
    res.json(await cached(`wikidata:${id}:${name}:${coord ? coord.map(r4) : ''}`, 7 * DAY, async () => {
      const W = 'https://www.wikidata.org/w/api.php?format=json&';
      const getEnts = async (ids, props) => (await getJson(`${W}action=wbgetentities&ids=${ids.join('%7C')}&props=${props}&languages=zh%7Czh-hans%7Cen`)).entities || {};
      let ent = null;
      if (id) ent = (await getEnts([id], 'labels%7Cdescriptions%7Cclaims%7Csitelinks'))[id];
      else {
        const ids = new Set();
        for (const lang of ['en', 'zh']) {
          const s = await getJson(`${W}action=wbsearchentities&search=${encodeURIComponent(name)}&language=${lang}&limit=7`);
          for (const r of s.search || []) ids.add(r.id);
          if (ids.size) break;
        }
        if (!ids.size) return { found: false, source: 'Wikidata' };
        const ents = Object.values(await getEnts([...ids], 'labels%7Cdescriptions%7Cclaims%7Csitelinks'));
        if (coord) {
          // keep search relevance order; accept the first candidate located near the requested point
          const byId = new Map(ents.map((e) => [e.id, e]));
          for (const qid of ids) {
            const c = byId.get(qid)?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
            if (c && N.haversineKm(coord, [c.latitude, c.longitude]) < 40) { ent = byId.get(qid); break; }
          }
        } else ent = ents[0];
      }
      if (!ent || ent.missing != null) return { found: false, source: 'Wikidata' };
      const refs = N.wikidataRefs(ent);
      const labels = {};
      if (refs.length) for (const [k, v] of Object.entries(await getEnts(refs, 'labels'))) labels[k] = v.labels?.zh?.value || v.labels?.['zh-hans']?.value || v.labels?.en?.value || k;
      return { found: true, entity: N.normalizeWikidata(ent, labels), source: 'Wikidata — CC0' };
    }));
  }));

  api.get('/attractions', h(async (req, res) => {
    const [lat, lon] = latlon(req.query);
    const radius = num(req.query.radius ?? 10000, 'radius', 500, 50000);
    const hasKey = !!otmKey();
    res.json(await cached(`attractions:${r4(lat)},${r4(lon)},${radius},${hasKey}`, 3 * DAY, async () => {
      const providers = [];
      const items = [];
      const tasks = [
        (async () => {
          if (!hasKey) { providers.push({ name: 'OpenTripMap', ok: false, skipped: true, note: '未配置 OPENTRIPMAP_API_KEY，已跳过' }); return; }
          try {
            const j = await getJson(`https://api.opentripmap.com/0.1/en/places/radius?radius=${radius}&lon=${lon}&lat=${lat}&kinds=interesting_places&rate=2&format=json&limit=60&apikey=${encodeURIComponent(otmKey())}`);
            const list = N.normalizeOpenTripMap(j);
            items.push(...list); providers.push({ name: 'OpenTripMap', ok: true, count: list.length });
          } catch (e) { providers.push({ name: 'OpenTripMap', ok: false, note: e.message.replace(/apikey=[^&\s]+/g, 'apikey=***') }); }
        })(),
        (async () => {
          try {
            const [en, zh] = await Promise.allSettled([wikiGeo('en', lat, lon, radius, 40), wikiGeo('zh', lat, lon, radius, 20)]);
            if (en.status !== 'fulfilled') throw en.reason;
            const zhBy = new Map((zh.status === 'fulfilled' ? zh.value : []).filter((p) => p.wikidata).map((p) => [p.wikidata, p]));
            for (const p of en.value) { const z = p.wikidata && zhBy.get(p.wikidata); if (z) { p.nameZh = z.name; p.descriptionZh = z.description; } }
            items.push(...en.value); providers.push({ name: 'Wikipedia GeoSearch', ok: true, count: en.value.length });
          } catch (e) { providers.push({ name: 'Wikipedia GeoSearch', ok: false, note: e.message }); }
        })(),
      ];
      await Promise.all(tasks);
      if (!providers.some((p) => p.ok)) throw new UpstreamError(`景点数据源均不可用: ${providers.map((p) => `${p.name}: ${p.note}`).join(' | ')}`);
      // de-duplicate by wikidata id (prefer the entry that has an image)
      const byKey = new Map();
      for (const it of items) {
        const k = it.wikidata || it.id;
        const prev = byKey.get(k);
        if (!prev) byKey.set(k, it);
        else byKey.set(k, { ...prev, image: prev.image || it.image, description: prev.description || it.description, rate: prev.rate ?? it.rate, alsoIn: [...(prev.alsoIn || []), it.source] });
      }
      return { items: [...byKey.values()].sort((a, b) => (a.distKm ?? 99) - (b.distKm ?? 99)), providers, source: providers.filter((p) => p.ok).map((p) => p.name).join(' + ') };
    }));
  }));

  api.get('/attraction', h(async (req, res) => {
    const xid = String(req.query.xid || '');
    if (!/^[A-Za-z0-9]+$/.test(xid)) throw new UpstreamError('xid 无效', 400);
    if (!otmKey()) throw new UpstreamError('未配置 OPENTRIPMAP_API_KEY', 501);
    res.json(await cached(`otm:${xid}`, 14 * DAY, async () => {
      const j = await getJson(`https://api.opentripmap.com/0.1/en/places/xid/${xid}?apikey=${encodeURIComponent(otmKey())}`);
      return { xid, name: j.name, kinds: j.kinds, image: j.preview?.source || j.image || null, description: j.wikipedia_extracts?.text || j.info?.descr || null, wikipedia: j.wikipedia || null, wikidata: j.wikidata || null, address: j.address || null, source: 'OpenTripMap' };
    }));
  }));

  api.get('/osm/nearby', h(async (req, res) => {
    const [lat, lon] = latlon(req.query);
    const radius = num(req.query.radius ?? 8000, 'radius', 300, 40000);
    const what = String(req.query.what || 'camp,poi').split(',').filter((w) => ['camp', 'poi', 'parking'].includes(w)).sort();
    if (!what.length) throw new UpstreamError('what 无效', 400);
    res.json(await cached(`osm-nearby:${r4(lat)},${r4(lon)},${radius},${what}`, 3 * DAY, async () => {
      const a = `(around:${radius},${lat},${lon})`;
      const q = `[out:json][timeout:40];(${what.includes('camp') ? CAMP_FILTERS(a) : ''}${what.includes('poi') ? POI_FILTERS(a) : ''}${what.includes('parking') ? PARK_FILTERS(`(around:${Math.min(radius, 3000)},${lat},${lon})`) : ''});out center tags 400;`;
      const { json, mirror } = await overpass(q, [lat, lon]);
      const out = splitOverpass(json);
      for (const list of Object.values(out)) { for (const x of list) x.distKm = N.haversineKm([lat, lon], [x.lat, x.lon]); list.sort((p, q2) => p.distKm - q2.distKm); }
      return { ...out, osmBase: json.osm3s?.timestamp_osm_base || null, source: `OpenStreetMap via Overpass (${mirror})` };
    }));
  }));

  api.post('/osm/along', h(async (req, res) => {
    const { points, lengthKm } = req.body || {};
    const what = (req.body?.what || ['camp', 'poi']).filter((w) => ['camp', 'poi', 'parking'].includes(w)).sort();
    const long = (lengthKm || 0) > 120;
    const radius = num(req.body?.radius ?? (long ? 6000 : 2500), 'radius', 100, 15000);
    const poly = polyArg(points, long ? 90 : 60);
    res.json(await cached(`osm-along:${poly}:${radius}:${what}`, 3 * DAY, async () => {
      const a = `(around:${radius},${poly})`;
      const q = `[out:json][timeout:60];(${what.includes('camp') ? CAMP_FILTERS(a) : ''}${what.includes('poi') ? (long ? NOTABLE_FILTERS(a) : POI_FILTERS(a)) : ''}${what.includes('parking') ? PARK_FILTERS(`(around:${Math.min(radius, 400)},${poly})`) : ''});out center tags 600;`;
      const { json, mirror } = await overpass(q, points[0]);
      return { ...splitOverpass(json), radius, notableOnly: long, osmBase: json.osm3s?.timestamp_osm_base || null, source: `OpenStreetMap via Overpass (${mirror})` };
    }));
  }));

  api.post('/osm/buildings', h(async (req, res) => {
    const { points } = req.body || {};
    const radius = num(req.body?.radius ?? 140, 'radius', 30, 400);
    const poly = polyArg(points, 80);
    res.json(await cached(`osm-buildings:${poly}:${radius}`, 14 * DAY, async () => {
      const q = `[out:json][timeout:60];(way["building"](around:${radius},${poly});node["place"~"^(city|town|village|hamlet)$"]["name"](around:1500,${poly}););out geom 4000;`;
      const { json, mirror } = await overpass(q, points[0]);
      return { ...N.normalizeBuildings(json), osmBase: json.osm3s?.timestamp_osm_base || null, source: `OpenStreetMap via Overpass (${mirror})` };
    }));
  }));

  api.post('/route', h(async (req, res) => {
    const stops = req.body?.stops;
    if (!Array.isArray(stops) || stops.length < 2 || stops.length > 25) throw new UpstreamError('需要 2–25 个站点', 400);
    const pts = stops.map((s) => ({ lat: num(s.lat, 'lat', -90, 90), lon: num(s.lon, 'lon', -180, 180) }));
    const lang = /^[a-zA-Z-]{2,6}$/.test(req.body?.lang || '') ? req.body.lang : 'zh-CN';
    const legs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const key = `route:${a.lat.toFixed(5)},${a.lon.toFixed(5)}→${b.lat.toFixed(5)},${b.lon.toFixed(5)}:${lang}`;
      const hit = await cacheRead(keyOf(key));
      if (hit && Date.now() - hit.ts < 14 * DAY) { legs.push({ ...hit.data, cached: true, fetchedAt: hit.ts }); continue; }
      const leg = await routeLeg(a, b, lang);
      if (leg.ok || leg.reason === 'no_road') await cacheWrite(keyOf(key), leg);
      legs.push({ ...leg, cached: false, fetchedAt: Date.now() });
    }
    const ok = legs.filter((l) => l.ok);
    res.json({
      legs,
      distanceKm: ok.reduce((s, l) => s + l.distanceKm, 0), durationSec: ok.reduce((s, l) => s + l.durationSec, 0),
      hasFerry: ok.some((l) => l.hasFerry), hasToll: ok.some((l) => l.hasToll), unroutableLegs: legs.filter((l) => !l.ok).length,
      source: [...new Set(ok.map((l) => l.engine))].join(' + ') || null,
    });
  }));

  // Postcard picture for a landmark: Wikipedia page image, verified by coordinates (never a guess by name alone).
  api.get('/landmark-image', h(async (req, res) => {
    const name = String(req.query.name || '').trim().slice(0, 120);
    const [lat, lon] = latlon(req.query);
    if (!name) throw new UpstreamError('需要 name', 400);
    res.json(await cached(`landmark-image2:${name}:${r4(lat)},${r4(lon)}`, 30 * DAY, async () => {
      const mk = (lang, p, matchedBy, distKm) => ({ found: true, image: p.thumbnail.source, title: p.title, description: p.description || null, matchedBy, distKm,
        url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`, source: `Wikipedia (${lang}) / Wikimedia Commons` });
      for (const lang of ['en', 'zh']) {
        const j = await getJson(`https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}&redirects=1&prop=coordinates%7Cpageimages%7Cdescription&piprop=thumbnail&pithumbsize=640&format=json`);
        const p = Object.values(j.query?.pages || {})[0];
        const c = p?.coordinates?.[0];
        if (p?.thumbnail && c) { const d = N.haversineKm([lat, lon], [c.lat, c.lon]); if (d < 60) return mk(lang, p, 'title', d); }
      }
      const g = await getJson(`https://en.wikipedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${lat}%7C${lon}&ggsradius=6000&ggslimit=20&prop=coordinates%7Cpageimages%7Cdescription&piprop=thumbnail&pithumbsize=640&colimit=20&pilimit=20&format=json`);
      const words = name.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2);
      let best = null;
      for (const p of Object.values(g.query?.pages || {})) {
        const c = p.coordinates?.[0];
        if (!p.thumbnail || !c) continue;
        const d = N.haversineKm([lat, lon], [c.lat, c.lon]);
        const t = p.title.toLowerCase();
        const overlap = words.filter((w) => t.includes(w)).length;
        const score = overlap * 10 - d;
        if (!best || score > best.score) best = { p, d, score, overlap };
      }
      if (best && ((best.overlap > 0 && best.d < 3) || best.d < 0.25)) return mk('en', best.p, best.overlap > 0 ? 'name+nearby' : 'nearby', best.d);
      return { found: false, source: 'Wikipedia' };
    }));
  }));

  // Storybook mode: map shapes (water, green, roads, rail) from OpenFreeMap vector tiles (OpenMapTiles schema, © OpenStreetMap contributors).
  api.get('/sketch-map', h(async (req, res) => {
    const [lat, lon] = latlon(req.query);
    const radius = num(req.query.radius ?? 2500, 'radius', 500, 12000);
    res.json(await cached(`sketch-map5:${r4(lat)},${r4(lon)}:${radius}`, 14 * DAY, async () => {
      const tj = await cached('openfreemap-tilejson', DAY, async () => { const r = await fetchT('https://tiles.openfreemap.org/planet'); if (!r.ok) throw new UpstreamError(`tiles.openfreemap.org HTTP ${r.status}`); return { tiles: (await r.json()).tiles }; });
      const z = radius <= 1600 ? 14 : radius <= 3200 ? 13 : radius <= 6500 ? 12 : 11, n = 2 ** z;
      const tx = (lo) => Math.floor(((lo + 180) / 360) * n), ty = (la) => { const r = (la * Math.PI) / 180; return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n); };
      const dLat = radius / 110540, dLon = radius / (111320 * Math.cos((lat * Math.PI) / 180));
      const jobs = [];
      for (let x = tx(lon - dLon); x <= tx(lon + dLon); x++) for (let y = ty(lat + dLat); y <= ty(lat - dLat); y++) jobs.push([x, y]);
      const r5 = (v) => Math.round(v * 1e5) / 1e5;
      const out = { water: [], rivers: [], green: [], roads: [], rails: [], names: [] };
      const zh = (p) => p['name:zh'] || p['name:latin'] || p.name || p['name:en'] || null;
      await Promise.all(jobs.map(async ([x, y]) => {
        const r = await fetchT(tj.tiles[0].replace('{z}', z).replace('{x}', x).replace('{y}', y), { headers: { Accept: '*/*' } }, 25000);
        if (r.status === 204 || r.status === 404) return;
        if (!r.ok) throw new UpstreamError(`tiles.openfreemap.org HTTP ${r.status}`);
        const tile = new VectorTile(new Pbf(new Uint8Array(await r.arrayBuffer())));
        const ll = (pt, ext) => { const X = (x + pt.x / ext) / n, Y = (y + pt.y / ext) / n; return [r5((Math.atan(Math.sinh(Math.PI * (1 - 2 * Y))) * 180) / Math.PI), r5(X * 360 - 180)]; };
        const each = (name, fn) => { const L = tile.layers[name]; if (!L) return; for (let i = 0; i < L.length; i++) { const f = L.feature(i); fn(f, f.properties, f.loadGeometry(), L.extent); } };
        const thin = (g) => { const st = Math.max(1, Math.ceil(g.length / 220)); if (st === 1) return g; const o = []; for (let i = 0; i < g.length; i += st) o.push(g[i]); if ((g.length - 1) % st) o.push(g[g.length - 1]); return o; };
        // polygons are clipped per tile: fill the ring, but only ink the parts of its outline that are not tile edges
        const poly = (rings, ext, target, extra) => {
          for (const ring0 of rings) {
            if (ring0.length < 4) continue;
            let area = 0; for (let i = 0; i + 1 < ring0.length; i++) area += ring0[i].x * ring0[i + 1].y - ring0[i + 1].x * ring0[i].y;
            if (Math.abs(area) / 2 < (ext * ext) / 9000) continue;
            const ring = thin(ring0), hole = area < 0, outline = []; let cur = null;
            const edge = (a, b) => (a.x <= 0 && b.x <= 0) || (a.x >= ext && b.x >= ext) || (a.y <= 0 && b.y <= 0) || (a.y >= ext && b.y >= ext);
            for (let i = 0; i + 1 < ring.length; i++) { if (edge(ring[i], ring[i + 1])) { cur = null; continue; } if (!cur) { cur = [ll(ring[i], ext)]; outline.push(cur); } cur.push(ll(ring[i + 1], ext)); }
            target.push({ ...extra, pts: ring.map((p) => ll(p, ext)), outline, hole });
          }
        };
        each('water', (f, p, g, ext) => { if (f.type === 3 && p.brunnel !== 'tunnel') poly(g, ext, out.water, { name: null, kind: p.class || 'water' }); });
        each('landcover', (f, p, g, ext) => { if (f.type === 3 && /wood|grass|ice|sand|rock|wetland/.test(p.class || '')) poly(g, ext, out.green, { name: null, kind: p.class }); });
        each('park', (f, p, g, ext) => { if (f.type === 3) poly(g, ext, out.green, { name: zh(p), kind: 'park' }); else if (f.type === 1 && zh(p)) out.names.push({ name: zh(p), kind: 'park', lat: ll(g[0][0], ext)[0], lon: ll(g[0][0], ext)[1] }); });
        each('waterway', (f, p, g, ext) => { if (f.type === 2 && p.brunnel !== 'tunnel') for (const l of g) if (l.length > 1) out.rivers.push({ name: zh(p), kind: p.class || 'river', pts: thin(l).map((q) => ll(q, ext)) }); });
        each('water_name', (f, p, g, ext) => { const nm = zh(p); if (!nm) return; const q = g[0][Math.floor(g[0].length / 2)], c = ll(q, ext); out.names.push({ name: nm, kind: p.class === 'ocean' || p.class === 'sea' ? 'sea' : 'water', lat: c[0], lon: c[1] }); });
        const roadNames = [];
        each('transportation_name', (f, p, g, ext) => { const nm = zh(p); if (nm && f.type === 2) roadNames.push({ nm, g: g[0] }); });
        each('transportation', (f, p, g, ext) => {
          if (f.type !== 2 || p.brunnel === 'tunnel') return;
          const c = p.class;
          if (c === 'rail' || c === 'transit') { if (!p.service) for (const l of g) out.rails.push({ pts: thin(l).map((q) => ll(q, ext)) }); return; }
          if (!/^(motorway|trunk|primary|secondary|tertiary|minor)$/.test(c) || p.ramp) return;
          for (const l of g) {
            if (l.length < 2) continue;
            const m = l[Math.floor(l.length / 2)]; let best = null, bd = 60 * 60;
            for (const rn of roadNames) for (let i = 0; i < rn.g.length; i += 3) { const d = (rn.g[i].x - m.x) ** 2 + (rn.g[i].y - m.y) ** 2; if (d < bd) { bd = d; best = rn.nm; } }
            out.roads.push({ name: best, kind: c, pts: thin(l).map((q) => ll(q, ext)) });
          }
        });
      }));
      const la0 = lat - dLat * 1.25, la1 = lat + dLat * 1.25, lo0 = lon - dLon * 1.25, lo1 = lon + dLon * 1.25;
      const inBox = (sh) => { let a = 90, b = -90, c = 180, d = -180; for (const [y, x] of sh.pts) { if (y < a) a = y; if (y > b) b = y; if (x < c) c = x; if (x > d) d = x; } return b >= la0 && a <= la1 && d >= lo0 && c <= lo1; };
      for (const k of ['water', 'rivers', 'green', 'roads', 'rails']) out[k] = out[k].filter(inBox);
      const bigRivers = out.rivers.filter((r) => /^(river|canal)$/.test(r.kind));
      if (out.rivers.length > 150 && bigRivers.length > 3) out.rivers = bigRivers;
      const major = out.roads.filter((r) => r.kind !== 'minor');
      if (major.length > 900) out.roads = major;                      // dense cities: main streets only
      const rank = { motorway: 0, trunk: 1, primary: 2, secondary: 3, tertiary: 4, minor: 5 };
      out.roads.sort((a, b) => rank[a.kind] - rank[b.kind]); out.roads = out.roads.slice(0, 1700); out.rails = out.rails.slice(0, 200);
      const seen = new Set(); out.names = out.names.filter((nm) => { const k = `${nm.name}|${Math.round(nm.lat * 200)}|${Math.round(nm.lon * 200)}`; if (seen.has(k)) return false; seen.add(k); return true; });
      return { lat, lon, radius, zoom: z, ...out, source: 'OpenFreeMap 矢量瓦片 (OpenMapTiles · © OpenStreetMap contributors)' };
    }));
  }));

  // Storybook mode: notable sights around a point, ranked by how many Wikipedias cover them (Wikidata Query Service).
  api.get('/sights', h(async (req, res) => {
    const [lat, lon] = latlon(req.query);
    const radius = num(req.query.radius ?? 3000, 'radius', 500, 15000);
    res.json(await cached(`sights3:${r4(lat)},${r4(lon)}:${radius}`, 14 * DAY, async () => {
      const run = async (minLinks) => {
        const q = `SELECT ?item (SAMPLE(?l) AS ?label) (SAMPLE(?len) AS ?labelEn) (SAMPLE(?lat) AS ?la) (SAMPLE(?lon) AS ?lo) (SAMPLE(?links) AS ?n) (SAMPLE(?image) AS ?img) (SAMPLE(?website) AS ?web) (GROUP_CONCAT(DISTINCT ?instEn; separator="|") AS ?inst) (SAMPLE(?zhT) AS ?zh) (SAMPLE(?enT) AS ?en) (SAMPLE(?inc) AS ?inception) (SAMPLE(?h) AS ?height) (SAMPLE(?vis) AS ?visitors) (SAMPLE(?ele) AS ?elev) WHERE {
  SERVICE wikibase:around { ?item wdt:P625 ?loc. bd:serviceParam wikibase:center "Point(${lon} ${lat})"^^geo:wktLiteral; wikibase:radius "${(radius / 1000).toFixed(2)}". }
  ?item wikibase:sitelinks ?links. FILTER(?links >= ${minLinks})
  FILTER NOT EXISTS { ?item wdt:P585 [] } FILTER NOT EXISTS { ?item wdt:P576 [] }
  ?item p:P625/psv:P625 ?c. ?c wikibase:geoLatitude ?lat; wikibase:geoLongitude ?lon.
  OPTIONAL { ?item wdt:P31 ?i. ?i rdfs:label ?instEn. FILTER(LANG(?instEn) = "en") }
  OPTIONAL { ?item wdt:P18 ?image } OPTIONAL { ?item wdt:P856 ?website } OPTIONAL { ?item wdt:P571 ?inc } OPTIONAL { ?item wdt:P2048 ?h } OPTIONAL { ?item wdt:P1174 ?vis } OPTIONAL { ?item wdt:P2044 ?ele }
  OPTIONAL { ?item rdfs:label ?l. FILTER(LANG(?l) = "zh") } OPTIONAL { ?item rdfs:label ?len. FILTER(LANG(?len) = "en") }
  OPTIONAL { ?za schema:about ?item; schema:isPartOf <https://zh.wikipedia.org/>; schema:name ?zhT } OPTIONAL { ?ea schema:about ?item; schema:isPartOf <https://en.wikipedia.org/>; schema:name ?enT }
} GROUP BY ?item ORDER BY DESC(?n) LIMIT 160`;
        const j = await getJson(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(q)}`, { headers: { Accept: 'application/sparql-results+json' } }, 45000);
        return j.results?.bindings || [];
      };
      let rows = await run(4);
      if (rows.length < 25) rows = await run(1);
      const KEEP = /museum|gallery|church|cathedral|basilica|chapel|abbey|monaster|mosque|temple|shrine|synagogue|pagoda|palace|castle|château|chateau|fort|tower|bridge|park|garden|zoo|aquarium|square|plaza|monument|memorial|mausoleum|statue|triumphal|arch$|fountain|theat|opera|concert|cultural center|building complex|island|mountain|summit|peak|waterfall|lake|glacier|valley|gorge|canyon|beach|landmark|tourist attraction|heritage|historic|cemetery|market|street|avenue|boulevard|lighthouse|observatory|library|stadium|aerial|funicular|cable|rack railway|mountain railway|viewpoint|cave|ruins|archaeological site|city gate|city hall|town hall|seat of local government|passage|skyscraper|amusement|pier|harbor|harbour|obelisk|mill|railway station|pass$|alp|nature reserve|protected area|hill|cliff|spring|river|canal|quay|villa|house|old town|neighborhood|quarter|ski/i;
      const DROP = /artefact|artifact|arrondissement|university|school|grande école|institution|organization|organisation|legislature|assembly|senate|academy|language|rapid transit|metro station|company|business|painting|district|municipality|commune|megacity|metropolis|capital|country|learned society|newspaper|publisher|political|ministry|government agency|embassy|hospital|election|canton|constituency|record label|football club|association|foundation$|bank$|station located underground|tram stop|bus/i;
      const sights = [];
      for (const r of rows) {
        const v = (k) => r[k]?.value ?? null, inst = v('inst') || '';
        const name = v('label') || v('zh') || v('labelEn') || v('en');
        if (!name || !KEEP.test(inst) || DROP.test(inst)) continue;
        const kind = /waterfall/i.test(inst) ? 'waterfall' : /mountain|summit|peak|hill|glacier|alp\b|pass$|cliff/i.test(inst) ? 'peak' : /shrine|pagoda|buddhist|shinto|temple/i.test(inst) ? 'temple' : /church|cathedral|basilica|chapel|abbey|monaster|mosque|synagogue/i.test(inst) ? 'church'
          : /museum|gallery|library/i.test(inst) ? 'museum' : /palace|castle|château|chateau|fort|city hall|town hall|seat of local/i.test(inst) ? 'castle' : /bridge/i.test(inst) ? 'bridge' : /tower|lighthouse|skyscraper|obelisk/i.test(inst) ? 'tower'
          : /park|garden|zoo|nature reserve|protected|cemetery|forest/i.test(inst) ? 'park' : /theat|opera|concert|cultural/i.test(inst) ? 'theatre' : /monument|memorial|mausoleum|statue|triumphal|arch$|fountain|square|plaza/i.test(inst) ? 'monument'
          : /lake|river|canal|island|beach|valley|gorge|canyon|spring/i.test(inst) ? 'nature' : /station|funicular|aerial|cable|railway/i.test(inst) ? 'station' : /market|street|avenue|boulevard|passage|quarter|neighborhood|old town/i.test(inst) ? 'street' : 'sight';
        const img = v('img');
        sights.push({ id: `wd:${v('item').split('/').pop()}`, wikidata: v('item').split('/').pop(), name, nameEn: v('labelEn') || v('en'), lat: +v('la'), lon: +v('lo'), links: +v('n'), kind, type: inst.split('|')[0] || null,
          image: img ? `${img.replace(/^http:/, 'https:')}?width=800` : null, website: v('web'), wikipedia: v('zh') ? `zh:${v('zh')}` : v('en') ? `en:${v('en')}` : null,
          inception: v('inception') ? String(v('inception')).slice(0, 4).replace(/^0+/, '') : null, heightM: v('height') ? +v('height') : null, visitors: v('visitors') ? +v('visitors') : null, elevationM: v('elev') ? +v('elev') : null,
          url: v('item') });
      }
      return { lat, lon, radius, sights: sights.slice(0, 60), source: 'Wikidata Query Service（按收录的维基百科语言版本数排序）' };
    }));
  }));

  // Storybook mode: everything needed to draw an illustrated map of one place (water, green, roads, named sights with their OSM details).
  api.get('/sketch', h(async (req, res) => {
    const [lat, lon] = latlon(req.query);
    const radius = num(req.query.radius ?? 2500, 'radius', 500, 6000);
    const part = req.query.part === 'pois' ? 'pois' : 'geo';
    res.json(await cached(`sketch5:${part}:${r4(lat)},${r4(lon)}:${radius}`, 7 * DAY, async () => {
      const dLat = radius / 110540, dLon = radius / (111320 * Math.cos((lat * Math.PI) / 180));
      const a = `(${(lat - dLat).toFixed(5)},${(lon - dLon).toFixed(5)},${(lat + dLat).toFixed(5)},${(lon + dLon).toFixed(5)})`, ap = a;
      const q = `[out:json][timeout:50];(way["natural"="water"]${a};relation["natural"="water"]${a};way["waterway"~"^(river|canal|stream)$"]${a};way["leisure"~"^(park|garden|nature_reserve)$"]${a};way["landuse"~"^(forest|meadow|grass|vineyard)$"]${a};way["natural"~"^(wood|glacier|scree|bare_rock)$"]${a};way["highway"~"^(motorway|trunk|primary|secondary|tertiary)$"]${a};way["railway"="rail"]["tunnel"!="yes"]${a};);out geom 5000;`;
      const q2 = `[out:json][timeout:50];(nwr["tourism"~"^(attraction|museum|viewpoint|gallery|zoo|theme_park|aquarium|artwork)$"]["name"]${ap};nwr["historic"]["name"]${ap};nwr["amenity"~"^(place_of_worship|theatre|ferry_terminal|marketplace)$"]["name"]["wikidata"]${ap};nwr["amenity"="ferry_terminal"]${ap};nwr["waterway"="waterfall"]["name"]${ap};nwr["natural"="peak"]["name"]${ap};nwr["man_made"~"^(tower|lighthouse|bridge)$"]["name"]["wikidata"]${ap};nwr["tourism"~"^(camp_site|caravan_site)$"]${ap};nwr["railway"="station"]["name"]${ap};nwr["aerialway"="station"]["name"]${ap};);out center tags 700;`;
      const { json, mirror } = await overpass(part === 'pois' ? q2 : q, [lat, lon]);
      const r5 = (n) => Math.round(n * 1e5) / 1e5;
      const line = (g) => { const st = Math.max(1, Math.ceil(g.length / 160)); const o = []; for (let i = 0; i < g.length; i += st) o.push([r5(g[i].lat), r5(g[i].lon)]); const l = g[g.length - 1]; if ((g.length - 1) % st) o.push([r5(l.lat), r5(l.lon)]); return o; };
      const out = { water: [], rivers: [], green: [], roads: [], rails: [], pois: [] };
      const seen = new Set();
      for (const el of json.elements || []) {
        const t = el.tags || {};
        if (el.geometry || el.members) {
          const name = t['name:zh'] || t.name || null;
          const rings = el.geometry ? [el.geometry] : (el.members || []).filter((m) => m.role !== 'inner' && m.geometry?.length > 1).map((m) => m.geometry);
          for (const g of rings) {
            if (!g || g.length < 2) continue;
            const pts = line(g);
            if (!t.highway && !t.railway && !t.waterway) { let a0 = 90, a1 = -90, b0 = 180, b1 = -180; for (const [y, x] of pts) { a0 = Math.min(a0, y); a1 = Math.max(a1, y); b0 = Math.min(b0, x); b1 = Math.max(b1, x); } if (N.haversineKm([a0, b0], [a1, b1]) < 0.07) continue; }
            if (t.natural === 'water') out.water.push({ name, pts, kind: t.water || 'water' });
            else if (t.waterway) out.rivers.push({ name, pts, kind: t.waterway });
            else if (t.highway) out.roads.push({ name, pts, kind: t.highway });
            else if (t.railway) out.rails.push({ pts });
            else out.green.push({ name, pts, kind: t.leisure || t.landuse || t.natural });
          }
          continue;
        }
        const plat = el.lat ?? el.center?.lat, plon = el.lon ?? el.center?.lon;
        if (plat == null) continue;
        const camp = /^(camp_site|caravan_site)$/.test(t.tourism || '');
        const name = t.name || t['name:en'] || (camp ? '露营地' : t.amenity === 'ferry_terminal' ? '码头' : null);
        if (!name) continue;
        const kind = camp ? 'camp' : t.amenity === 'ferry_terminal' ? 'pier' : t.railway === 'station' || t.aerialway === 'station' ? 'station' : t.waterway === 'waterfall' ? 'waterfall' : t.natural === 'peak' ? 'peak'
          : t.tourism === 'viewpoint' ? 'viewpoint' : t.amenity === 'place_of_worship' || /church|cathedral|chapel|monastery|abbey|wayside_shrine/.test(t.historic || t.building || '') ? 'church' : /museum|gallery/.test(t.tourism || '') ? 'museum'
          : /castle|palace|fort|manor|city_gate/.test(t.historic || '') ? 'castle' : /memorial|monument|statue|archaeological_site|ruins|wayside_cross/.test(t.historic || '') || t.tourism === 'artwork' ? 'monument'
          : t.man_made === 'bridge' || t.bridge ? 'bridge' : /tower|lighthouse/.test(t.man_made || '') ? 'tower' : /zoo|theme_park|aquarium/.test(t.tourism || '') ? 'park' : t.amenity === 'theatre' ? 'theatre' : t.amenity === 'marketplace' ? 'market' : 'sight';
        const key = `${name}|${kind}`; if (seen.has(key)) continue; seen.add(key);
        const score = (t.wikidata ? 5 : 0) + (t.wikipedia ? 4 : 0) + (t.tourism === 'attraction' ? 3 : 0) + (t.heritage ? 3 : 0) + (t.website ? 1 : 0) + (t.opening_hours ? 1 : 0) + (/memorial|artwork|wayside/.test(`${t.historic} ${t.tourism}`) ? -3 : 0) + (kind === 'station' ? -2 : 0) + (camp || kind === 'pier' ? 2 : 0)
          - N.haversineKm([lat, lon], [plat, plon]) / (radius / 1000);
        out.pois.push({ id: `osm:${el.type}/${el.id}`, name, nameZh: t['name:zh'] || null, nameEn: t['name:en'] || null, lat: r5(plat), lon: r5(plon), kind, score,
          openingHours: t.opening_hours || null, fee: t.fee || null, charge: t.charge || null, website: t.website || t['contact:website'] || null, phone: t.phone || t['contact:phone'] || null, wheelchair: t.wheelchair || null,
          wikipedia: t.wikipedia || null, wikidata: t.wikidata || null, description: t['description:zh'] || t.description || null, ele: t.ele || null, height: t.height || null, startDate: t.start_date || null, operator: t.operator || null,
          osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}` });
      }
      out.pois.sort((x, y) => y.score - x.score); out.pois = out.pois.slice(0, 70);
      const rank = { motorway: 0, trunk: 1, primary: 2, secondary: 3, tertiary: 4 };
      out.roads.sort((x, y) => rank[x.kind] - rank[y.kind]); out.roads = out.roads.slice(0, 650);
      out.green.sort((x, y) => y.pts.length - x.pts.length); out.green = out.green.slice(0, 350); out.rails = out.rails.slice(0, 120);
      return { lat, lon, radius, part, ...out, osmBase: json.osm3s?.timestamp_osm_base || null, source: `OpenStreetMap via Overpass (${mirror})` };
    }));
  }));

  // Storybook mode: a readable summary (Chinese when Wikipedia has one) for a named thing, verified by coordinates unless OSM links the article explicitly.
  api.get('/wiki-summary', h(async (req, res) => {
    const name = String(req.query.name || '').trim().slice(0, 120), tag = String(req.query.wikipedia || '').trim().slice(0, 160);
    const [lat, lon] = latlon(req.query);
    if (!name && !tag) throw new UpstreamError('需要 name', 400);
    const maxKm = num(req.query.maxKm ?? 40, 'maxKm', 1, 1500);
    res.json(await cached(`wiki-summary3:${tag}:${name}:${r4(lat)},${r4(lon)}:${maxKm}`, 30 * DAY, async () => {
      const q = (lang, title, extra = '') => getJson(`https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&redirects=1&prop=coordinates%7Cpageimages%7Cdescription%7Cextracts%7Clanglinks&exintro=1&explaintext=1&exchars=900&piprop=thumbnail&pithumbsize=800&lllimit=500${extra}&format=json&variant=zh-cn`);
      const page = (j) => { const p = Object.values(j.query?.pages || {})[0]; return p && !('missing' in p) && p.pageid ? p : null; };
      const mk = (lang, p, matchedBy) => ({ found: true, lang, title: p.title, extract: (p.extract || '').trim() || null, description: p.description || null, image: p.thumbnail?.source || null, matchedBy,
        url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`, source: `Wikipedia (${lang})` });
      const preferZh = async (lang, p, matchedBy) => {
        if (lang !== 'zh') { const z = (p.langlinks || []).find((l) => l.lang === 'zh'); if (z) { const zp = page(await q('zh', z['*'])); if (zp?.extract) return { ...mk('zh', zp, matchedBy), image: zp.thumbnail?.source || p.thumbnail?.source || null }; } }
        return mk(lang, p, matchedBy);
      };
      const m = tag.match(/^([a-z-]{2,10}):(.+)$/);
      if (m) { const p = page(await q(m[1], m[2])); if (p) return preferZh(m[1], p, 'osm-tag'); }
      for (const lang of ['zh', 'en']) {
        if (!name) break;
        const p = page(await q(lang, name));
        const c = p?.coordinates?.[0];
        if (p && c && N.haversineKm([lat, lon], [c.lat, c.lon]) < maxKm) return preferZh(lang, p, 'title');
      }
      return { found: false, source: 'Wikipedia' };
    }));
  }));

  // Real-world street-level imagery at a point: Google Street View first (needs GOOGLE_MAPS_API_KEY), Panoramax (open, keyless) as the fallback.
  api.get('/streetview', h(async (req, res) => {
    const [lat, lon] = latlon(req.query);
    const heading = num(req.query.heading ?? 0, 'heading', -360, 720);
    const tried = [];
    if (gmKey()) {
      try {
        const meta = await cached(`gsv-meta:${r4(lat)},${r4(lon)}`, 7 * DAY, async () => {
          const j = await getJson(`https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lon}&radius=120&source=outdoor&key=${gmKey()}`);
          if (j.status !== 'OK' && j.status !== 'ZERO_RESULTS') throw new UpstreamError(`Google Street View: ${j.status}${j.error_message ? ` — ${j.error_message}` : ''}`);
          return { status: j.status, panoId: j.pano_id || null, date: j.date || null, copyright: j.copyright || null, lat: j.location?.lat ?? null, lon: j.location?.lng ?? null };
        });
        if (meta.status === 'OK') {
          const distM = meta.lat != null ? Math.round(N.haversineKm([lat, lon], [meta.lat, meta.lon]) * 1000) : null;
          // pictures come through our own /streetview/image route, so the key never reaches the browser
          res.json({ found: true, provider: 'google', panoId: meta.panoId, heading: Math.round(((heading % 360) + 360) % 360),
            date: meta.date, credit: meta.copyright, distM, lat: meta.lat, lon: meta.lon, source: 'Google Street View', tried });
          return;
        }
        tried.push({ provider: 'google', result: '这里没有 Google 街景' });
      } catch (e) { tried.push({ provider: 'google', result: String(e.message || e).slice(0, 160) }); }
    } else tried.push({ provider: 'google', result: '未配置 GOOGLE_MAPS_API_KEY' });
    try {
      const px = await cached(`panoramax3:${r4(lat)},${r4(lon)}`, DAY, async () => {
        const j = await getJson(`https://api.panoramax.xyz/api/search?place_position=${lon},${lat}&place_distance=0-300&limit=12`, {}, 25000);
        const items = (j.features || []).map((f) => {
          const q = f.properties || {}, c = f.geometry?.coordinates || [];
          return { id: f.id, lat: c[1], lon: c[0], distM: Math.round(N.haversineKm([lat, lon], [c[1], c[0]]) * 1000), fov: q['pers:interior_orientation']?.field_of_view ?? null, azimuth: q['view:azimuth'] ?? null,
            image: f.assets?.sd?.href || f.assets?.hd?.href || null, hd: f.assets?.hd?.href || null, date: (q.datetime || '').slice(0, 10) || null, license: q.license || null, credit: (f.providers || []).map((x) => x.name).filter(Boolean).join(', ') || q['geovisio:producer'] || null,
            url: `https://api.panoramax.xyz/#focus=pic&pic=${f.id}` };
        }).filter((x) => x.image && x.lat != null);
        // a full panorama a little further away beats a flat photo right here
        items.sort((a, b) => (a.distM + (a.fov === 360 ? 0 : 60)) - (b.distM + (b.fov === 360 ? 0 : 60)));
        return { items: items.slice(0, 4) };
      });
      if (px.items.length) { res.json({ found: true, provider: 'panoramax', ...px.items[0], more: px.items.length - 1, source: 'Panoramax（开放街景，© 贡献者）', tried }); return; }
      tried.push({ provider: 'panoramax', result: '300 米内没有照片' });
    } catch (e) { tried.push({ provider: 'panoramax', result: String(e.message || e).slice(0, 160) }); }
    res.json({ found: false, tried });
  }));

  // One Street View picture (Street View Static API). Kept in memory for this run only; headings snap to 30° so looking around re-uses pictures.
  const gsvMem = new Map();
  api.get('/streetview/image', h(async (req, res) => {
    const pano = String(req.query.pano || ''); if (!/^[\w-]{10,80}$/.test(pano) || !gmKey()) throw new UpstreamError('pano 无效或未配置密钥', 400);
    const hd = (Math.round(num(req.query.heading ?? 0, 'heading', -360, 720) / 30) * 30 + 360) % 360, pitch = Math.round(num(req.query.pitch ?? 0, 'pitch', -60, 60) / 15) * 15, k = `${pano}:${hd}:${pitch}`;
    let buf = gsvMem.get(k);
    if (!buf) {
      const r = await fetchT(`https://maps.googleapis.com/maps/api/streetview?size=640x400&scale=2&pano=${encodeURIComponent(pano)}&heading=${hd}&pitch=${pitch}&fov=90&return_error_code=true&key=${gmKey()}`, { headers: { Accept: 'image/*' } }, 25000);
      if (!r.ok) throw new UpstreamError(`Google Street View 图片 HTTP ${r.status}`, 502);
      buf = Buffer.from(await r.arrayBuffer()); gsvMem.set(k, buf); if (gsvMem.size > 240) gsvMem.delete(gsvMem.keys().next().value);
    }
    res.set('Content-Type', 'image/jpeg').set('Cache-Control', 'private, max-age=600').send(buf);
  }));

  // Google Photorealistic 3D Tiles (Map Tiles API), passed through so the key stays on the server. Nothing is stored on disk.
  let g3dSession = '';
  api.use('/g3d', (req, res) => {
    (async () => {
      if (!gmKey()) throw new UpstreamError('未配置 GOOGLE_MAPS_API_KEY', 400);
      if (req.method !== 'GET' || !/^\/v1\/3dtiles\/[\w./-]+(\?.*)?$/.test(req.url)) throw new UpstreamError('路径无效', 400);
      const u = new URL(`https://tile.googleapis.com${req.url}`);
      u.searchParams.set('key', gmKey()); if (!u.searchParams.get('session') && g3dSession && !u.pathname.endsWith('/root.json')) u.searchParams.set('session', g3dSession);
      const r = await fetchT(u.href, { headers: { Accept: '*/*' } }, 30000);
      const type = r.headers.get('content-type') || 'application/octet-stream';
      if (!r.ok) { const body = await r.text().catch(() => ''); let msg = `HTTP ${r.status}`; try { msg = JSON.parse(body).error?.message || msg; } catch { /* not json */ } throw new UpstreamError(`Google Map Tiles: ${msg}`, r.status === 403 ? 403 : 502); }
      if (type.includes('json')) {
        let text = await r.text(); const m = text.match(/[?&]session=([\w-]+)/); if (m) g3dSession = m[1];
        text = text.replace(/"\/v1\/3dtiles\//g, '"/api/g3d/v1/3dtiles/');
        res.set('Content-Type', 'application/json').set('Cache-Control', 'no-store').send(text);
      } else res.set('Content-Type', type).set('Cache-Control', 'private, max-age=900').send(Buffer.from(await r.arrayBuffer()));
    })().catch((e) => res.status(e.status || 500).json({ error: String(e.message || e) }));
  });

  // Image relay (Wikimedia hosts only) so pictures can be used as WebGL textures; cached on disk.
  api.get('/img', h(async (req, res) => {
    let u;
    try { u = new URL(String(req.query.u || '')); } catch { throw new UpstreamError('u 无效', 400); }
    if (u.protocol !== 'https:' || !/(^|\.)(wikimedia\.org|wikipedia\.org)$/.test(u.hostname)) throw new UpstreamError('仅允许 Wikimedia 图片', 400);
    const key = keyOf(`img:${u.href}`);
    const file = path.join(CACHE_DIR, 'img', key);
    let buf = await fs.readFile(file).catch(() => null);
    let type = buf ? await fs.readFile(`${file}.type`, 'utf8').catch(() => 'image/jpeg') : '';
    if (!buf) {
      const done = await wikimediaSlot();
      let r;
      try { r = await fetchT(u.href, { headers: { Accept: 'image/*' } }, 25000); } finally { done(); }
      type = r.headers.get('content-type') || '';
      if (!r.ok || !type.startsWith('image/')) throw new UpstreamError(`图片获取失败 HTTP ${r.status}`);
      buf = Buffer.from(await r.arrayBuffer());
      if (buf.length > 8e6) throw new UpstreamError('图片过大', 413);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, buf); await fs.writeFile(`${file}.type`, type);
    }
    res.set('Content-Type', type).set('Cache-Control', 'public, max-age=2592000').send(buf);
  }));

  api.get('/terrain/:z/:x/:y.png', h(async (req, res) => {
    const z = Math.round(num(req.params.z, 'z', 0, 15));
    const x = Math.round(num(req.params.x, 'x', 0, 2 ** z - 1)), y = Math.round(num(req.params.y, 'y', 0, 2 ** z - 1));
    const file = path.join(CACHE_DIR, 'terrain', `${z}-${x}-${y}.png`);
    let buf = await fs.readFile(file).catch(() => null);
    if (!buf) {
      const r = await fetchT(TERRAIN.replace('{z}', z).replace('{x}', x).replace('{y}', y), { headers: { Accept: 'image/png' } }, 25000);
      if (!r.ok) throw new UpstreamError(`高程瓦片 HTTP ${r.status}`);
      buf = Buffer.from(await r.arrayBuffer());
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, buf);
    }
    res.set('Content-Type', 'image/png').set('Cache-Control', 'public, max-age=604800').send(buf);
  }));

  api.use((_req, res) => res.status(404).json({ error: 'not found' }));
  return api;
}
