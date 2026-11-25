// Pure normalizers for upstream API payloads (unit-tested with fixtures).

export function decodePolyline(str, precision = 6) {
  const factor = 10 ** precision;
  const out = [];
  let i = 0, lat = 0, lon = 0;
  while (i < str.length) {
    for (const which of [0, 1]) {
      let shift = 0, result = 0, b;
      do {
        b = str.charCodeAt(i++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (which === 0) lat += d; else lon += d;
    }
    out.push([lat / factor, lon / factor]);
  }
  return out;
}

export function haversineKm(a, b) {
  const R = 6371.0088, toR = Math.PI / 180;
  const dLat = (b[0] - a[0]) * toR, dLon = (b[1] - a[1]) * toR;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * toR) * Math.cos(b[0] * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Reduce a polyline to at most `max` points (uniform by index, endpoints kept). */
export function thinPoints(points, max) {
  if (points.length <= max) return points;
  const out = [];
  const step = (points.length - 1) / (max - 1);
  for (let i = 0; i < max; i++) out.push(points[Math.round(i * step)]);
  return out;
}

export function normalizePhoton(json) {
  return (json.features || []).map((f) => {
    const p = f.properties || {};
    const [lon, lat] = f.geometry.coordinates;
    const parts = [p.name, p.city !== p.name ? p.city : null, p.state, p.country].filter(Boolean);
    return {
      id: `${p.osm_type || 'X'}${p.osm_id || `${lat},${lon}`}`,
      name: p.name || p.city || p.country || '',
      label: [...new Set(parts)].join(', '),
      lat, lon,
      type: p.type || p.osm_value || 'place',
      kind: p.osm_value || '',
      country: p.country || '',
      countryCode: (p.countrycode || '').toUpperCase(),
      state: p.state || '',
      extent: p.extent || null,
    };
  }).filter((r, i, all) => r.name && all.findIndex((o) => o.id === r.id) === i);
}

export function normalizeNominatim(list) {
  return (list || []).map((r) => {
    const a = r.address || {};
    return {
      id: `${(r.osm_type || 'x')[0].toUpperCase()}${r.osm_id}`,
      name: r.name || (r.display_name || '').split(',')[0],
      label: r.display_name || '',
      lat: +r.lat, lon: +r.lon,
      type: r.addresstype || r.type || 'place',
      kind: r.type || '',
      country: a.country || '',
      countryCode: (a.country_code || '').toUpperCase(),
      state: a.state || '',
      extent: r.boundingbox ? [+r.boundingbox[2], +r.boundingbox[1], +r.boundingbox[3], +r.boundingbox[0]] : null,
      wikidata: r.extratags?.wikidata || null,
    };
  });
}

export function normalizeReverse(r) {
  if (!r || r.error) return null;
  const a = r.address || {};
  const city = a.city || a.town || a.village || a.municipality || a.hamlet || a.county || '';
  return {
    name: r.name || city || (r.display_name || '').split(',')[0],
    label: r.display_name || '',
    lat: +r.lat, lon: +r.lon,
    city, state: a.state || '',
    country: a.country || '',
    countryCode: (a.country_code || '').toUpperCase(),
    type: r.addresstype || r.type || 'place',
    wikidata: r.extratags?.wikidata || null,
  };
}

const yn = (v) => (v == null ? null : !/^(no|none)$/i.test(v));

export function normalizeCampsite(el) {
  const t = el.tags || {};
  const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
  if (lat == null) return null;
  const type = t.tourism === 'caravan_site' ? 'caravan_site' : 'camp_site';
  return {
    id: `${el.type}/${el.id}`,
    name: t.name || t['name:en'] || (type === 'caravan_site' ? 'Caravan site (unnamed)' : 'Camp site (unnamed)'),
    unnamed: !t.name,
    lat, lon, type,
    facilities: {
      electricity: yn(t.power_supply),
      drinkingWater: yn(t.drinking_water),
      showers: yn(t.shower),
      toilets: yn(t.toilets),
      dumpStation: yn(t.sanitary_dump_station),
      wifi: yn(t.internet_access),
      laundry: yn(t.washing_machine),
      dogs: yn(t.dog),
    },
    caravans: yn(t.caravans), motorhome: yn(t.motorhome), tents: yn(t.tents),
    fee: t.fee || null, charge: t.charge || null,
    capacity: t.capacity || t['capacity:caravans'] || t['capacity:pitches'] || null,
    openingHours: t.opening_hours || null,
    reservation: t.reservation || null,
    stars: t.stars || null,
    operator: t.operator || null,
    website: t.website || t['contact:website'] || t.url || null,
    phone: t.phone || t['contact:phone'] || null,
    email: t.email || t['contact:email'] || null,
    address: [t['addr:street'], t['addr:housenumber'], t['addr:postcode'], t['addr:city']].filter(Boolean).join(' ') || null,
    backcountry: t.backcountry === 'yes',
    osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    source: 'OpenStreetMap (Overpass)',
  };
}

export function normalizeParking(el) {
  const t = el.tags || {};
  const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
  if (lat == null) return null;
  return {
    id: `${el.type}/${el.id}`, name: t.name || 'Parking', lat, lon,
    fee: t.fee || null, capacity: t.capacity || null, access: t.access || null,
    motorhome: yn(t.motorhome) ?? yn(t.caravans), maxheight: t.maxheight || null,
    parking: t.parking || null, openingHours: t.opening_hours || null,
    osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    source: 'OpenStreetMap (Overpass)',
  };
}

export function categorizeOsmPoi(t) {
  if (t.tourism === 'viewpoint') return 'viewpoint';
  if (t.natural || t.waterway === 'waterfall') return 'nature';
  if (t.historic || t.heritage) return 'historic';
  return 'attraction';
}

export function normalizeOsmPoi(el) {
  const t = el.tags || {};
  const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
  const name = t.name || t['name:en'];
  if (lat == null || !name) return null;
  const kind = t.tourism || (t.waterway === 'waterfall' ? 'waterfall' : null) || t.natural || t.historic || 'poi';
  return {
    id: `osm:${el.type}/${el.id}`, name, nameEn: t['name:en'] || null, lat, lon, kind,
    category: categorizeOsmPoi(t),
    description: t.description || null,
    ele: t.ele ? parseFloat(t.ele) : null,
    wikidata: t.wikidata || null,
    wikipedia: t.wikipedia || null,
    website: t.website || null,
    url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    image: null,
    source: 'OpenStreetMap (Overpass)',
  };
}

const NATURE_RE = /waterfall|mountain|glacier|lake|valley|cave|gorge|peak|river|pass\b|alp|canyon|park|forest|island|volcano|beach|spring|cliff|summit|massif|nature/i;
const HIST_RE = /castle|church|abbey|monastery|cathedral|museum|historic|monument|ruin|palace|fort|temple|chapel|bridge|heritage|tower|memorial|archaeolog|old town|mosque|shrine/i;

export function categorizeText(text) {
  if (!text) return 'attraction';
  if (/viewpoint|observation|lookout|panorama/i.test(text)) return 'viewpoint';
  if (HIST_RE.test(text)) return 'historic';
  if (NATURE_RE.test(text)) return 'nature';
  return 'attraction';
}

export function normalizeWikiGeo(json, lang, origin) {
  const pages = Object.values(json?.query?.pages || {});
  return pages.map((p) => {
    const c = p.coordinates?.[0];
    if (!c) return null;
    return {
      id: `wikipedia:${lang}:${p.pageid}`, name: p.title, lat: c.lat, lon: c.lon,
      kind: 'wikipedia',
      category: categorizeText(`${p.title} ${p.description || ''}`),
      description: p.description || null,
      image: p.thumbnail?.source || null,
      wikidata: p.pageprops?.wikibase_item || null,
      url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
      distKm: origin ? haversineKm(origin, [c.lat, c.lon]) : null,
      source: `Wikipedia (${lang})`,
    };
  }).filter(Boolean).sort((a, b) => (a.distKm ?? 0) - (b.distKm ?? 0));
}

export function normalizeOpenTripMap(list) {
  return (list || []).filter((p) => p.name).map((p) => ({
    id: `otm:${p.xid}`, xid: p.xid, name: p.name, lat: p.point.lat, lon: p.point.lon,
    kind: (p.kinds || '').split(',')[0],
    kinds: p.kinds || '',
    category: /natural/.test(p.kinds) ? 'nature' : /historic|architecture|religion|cultural/.test(p.kinds) ? 'historic' : /view_points/.test(p.kinds) ? 'viewpoint' : 'attraction',
    rate: p.rate ?? null,
    wikidata: p.wikidata || null,
    distKm: p.dist != null ? p.dist / 1000 : null,
    description: null, image: null,
    url: `https://opentripmap.com/en/card/${p.xid}`,
    source: 'OpenTripMap',
  }));
}

/** Parse MediaWiki plain-text extract ("== Heading ==" separated) into sections. */
export function parseWikiSections(text) {
  const out = { intro: '', sections: [] };
  if (!text) return out;
  const parts = text.split(/\n==\s*([^=\n]+?)\s*==\n/);
  out.intro = parts[0].trim();
  for (let i = 1; i < parts.length; i += 2) {
    const body = (parts[i + 1] || '').replace(/\n={3,}\s*([^=\n]+?)\s*={3,}\n/g, '\n\n【$1】\n').replace(/\n{3,}/g, '\n\n').trim();
    if (body) out.sections.push({ title: parts[i], text: body });
  }
  return out;
}

const claimVal = (ent, pid) => ent?.claims?.[pid]?.map((c) => c.mainsnak?.datavalue?.value).filter((v) => v != null) || [];

export function wikidataRefs(ent) {
  const ids = new Set();
  for (const pid of ['P17', 'P131', 'P1435', 'P31', 'P361', 'P206', 'P4552']) for (const v of claimVal(ent, pid).slice(0, 4)) if (v.id) ids.add(v.id);
  return [...ids];
}

export function normalizeWikidata(ent, labels = {}, langs = ['zh', 'en']) {
  if (!ent || ent.missing != null) return null;
  const pick = (o) => { for (const l of [...langs, 'zh-hans', 'zh-cn', 'en', 'de', 'fr']) if (o?.[l]) return o[l].value; return Object.values(o || {})[0]?.value || null; };
  const lab = (pid, n = 3) => claimVal(ent, pid).slice(0, n).map((v) => labels[v.id] || v.id).filter(Boolean);
  const qty = (pid) => { const vals = ent?.claims?.[pid]; if (!vals?.length) return null;
    const best = vals.find((c) => c.rank === 'preferred') || vals[vals.length - 1]; const v = best.mainsnak?.datavalue?.value; return v?.amount != null ? parseFloat(v.amount) : null; };
  const time = (pid) => { const v = claimVal(ent, pid)[0]; if (!v?.time) return null; const m = /^([+-])(\d+)-(\d\d)-(\d\d)/.exec(v.time); if (!m) return null;
    const y = parseInt(m[2], 10) * (m[1] === '-' ? -1 : 1); return v.precision >= 11 ? `${y}-${m[3]}-${m[4]}` : v.precision === 10 ? `${y}-${m[3]}` : v.precision === 7 ? `${Math.floor(y / 100) + 1} 世纪` : `${y}`; };
  const coord = claimVal(ent, 'P625')[0];
  const img = claimVal(ent, 'P18')[0];
  const sl = ent.sitelinks || {};
  return {
    id: ent.id,
    label: pick(ent.labels), labelEn: ent.labels?.en?.value || null,
    description: pick(ent.descriptions),
    instanceOf: lab('P31'), country: lab('P17', 1)[0] || null, locatedIn: lab('P131'),
    heritage: lab('P1435'), partOf: lab('P361'),
    population: qty('P1082'), elevationM: qty('P2044'), areaKm2: qty('P2046'),
    inception: time('P571'),
    website: claimVal(ent, 'P856')[0] || null,
    image: img ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(img)}?width=640` : null,
    coord: coord ? [coord.latitude, coord.longitude] : null,
    wikipedia: { zh: sl.zhwiki?.title || null, en: sl.enwiki?.title || null },
    wikivoyage: { zh: sl.zhwikivoyage?.title || null, en: sl.enwikivoyage?.title || null },
    url: `https://www.wikidata.org/wiki/${ent.id}`,
    source: 'Wikidata',
  };
}

const WMO = {
  0: ['晴', 'clear'], 1: ['大部晴朗', 'clear'], 2: ['局部多云', 'cloudy'], 3: ['阴', 'cloudy'],
  45: ['雾', 'fog'], 48: ['雾凇', 'fog'],
  51: ['小毛毛雨', 'rain'], 53: ['毛毛雨', 'rain'], 55: ['大毛毛雨', 'rain'], 56: ['冻毛毛雨', 'rain'], 57: ['冻毛毛雨', 'rain'],
  61: ['小雨', 'rain'], 63: ['中雨', 'rain'], 65: ['大雨', 'rain'], 66: ['冻雨', 'rain'], 67: ['冻雨', 'rain'],
  71: ['小雪', 'snow'], 73: ['中雪', 'snow'], 75: ['大雪', 'snow'], 77: ['雪粒', 'snow'],
  80: ['阵雨', 'rain'], 81: ['阵雨', 'rain'], 82: ['强阵雨', 'rain'], 85: ['阵雪', 'snow'], 86: ['强阵雪', 'snow'],
  95: ['雷暴', 'rain'], 96: ['雷暴伴冰雹', 'rain'], 99: ['强雷暴伴冰雹', 'rain'],
};
export const wmoInfo = (code) => ({ text: WMO[code]?.[0] ?? `天气代码 ${code}`, sim: WMO[code]?.[1] ?? 'cloudy' });

export function normalizeWeather(j) {
  const c = j.current || {};
  const d = j.daily || {};
  return {
    lat: j.latitude, lon: j.longitude, elevationM: j.elevation, timezone: j.timezone,
    utcOffsetSec: j.utc_offset_seconds ?? 0,
    current: {
      time: c.time, tempC: c.temperature_2m, feelsC: c.apparent_temperature, humidity: c.relative_humidity_2m,
      windKmh: c.wind_speed_10m, windDir: c.wind_direction_10m, precipMm: c.precipitation, cloudPct: c.cloud_cover,
      isDay: c.is_day === 1, code: c.weather_code, ...wmoInfo(c.weather_code),
    },
    daily: (d.time || []).map((t, i) => ({
      date: t, code: d.weather_code?.[i], ...wmoInfo(d.weather_code?.[i]),
      maxC: d.temperature_2m_max?.[i], minC: d.temperature_2m_min?.[i],
      precipMm: d.precipitation_sum?.[i], sunrise: d.sunrise?.[i], sunset: d.sunset?.[i],
    })),
    source: 'Open-Meteo',
  };
}

export function normalizeValhallaLeg(trip) {
  const leg = trip.legs[0];
  const coords = decodePolyline(leg.shape, 6);
  const ferries = [];
  const mans = leg.maneuvers.map((m) => ({
    type: m.type, instruction: m.instruction, lengthKm: m.length, timeSec: m.time,
    i0: m.begin_shape_index, i1: m.end_shape_index, streets: m.street_names || [],
    ferry: m.type === 28 || m.travel_type === 'ferry' || m.travel_mode === 'transit' || undefined,
    toll: m.toll || undefined,
  }));
  mans.forEach((m, i) => {
    if (m.type === 28) {
      const exit = mans.findIndex((n, j) => j > i && n.type === 29);
      ferries.push({ instruction: m.instruction, lengthKm: m.lengthKm, timeSec: m.timeSec, from: coords[m.i0], to: coords[exit > 0 ? mans[exit].i0 : m.i1] });
    }
  });
  return {
    ok: true, engine: 'Valhalla (OSM 数据)',
    distanceKm: trip.summary.length, durationSec: trip.summary.time,
    hasFerry: !!trip.summary.has_ferry || ferries.length > 0, hasToll: !!trip.summary.has_toll, hasHighway: !!trip.summary.has_highway,
    ferries, maneuvers: mans, coords,
  };
}

export function normalizeOsrmLeg(json) {
  const r = json.routes[0];
  const coords = r.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
  const ferries = [];
  const maneuvers = [];
  for (const leg of r.legs) for (const s of leg.steps || []) {
    const isFerry = s.mode === 'ferry';
    const ins = `${s.maneuver?.type || ''} ${s.maneuver?.modifier || ''} ${s.name || ''}`.trim();
    maneuvers.push({ type: isFerry ? 28 : 0, instruction: isFerry ? `Ferry ${s.name || ''}`.trim() : ins, lengthKm: s.distance / 1000, timeSec: s.duration, streets: s.name ? [s.name] : [], ferry: isFerry || undefined });
    if (isFerry) {
      const g = s.geometry?.coordinates || [];
      ferries.push({ instruction: `Ferry ${s.name || ''}`.trim(), lengthKm: s.distance / 1000, timeSec: s.duration, from: g[0] ? [g[0][1], g[0][0]] : null, to: g.length ? [g[g.length - 1][1], g[g.length - 1][0]] : null });
    }
  }
  return {
    ok: true, engine: 'OSRM (OSM 数据)',
    distanceKm: r.distance / 1000, durationSec: r.duration,
    hasFerry: ferries.length > 0, hasToll: false, hasHighway: false, tollUnknown: true,
    ferries, maneuvers, coords,
  };
}

export function normalizeBuildings(json) {
  const buildings = [], places = [];
  for (const el of json.elements || []) {
    const t = el.tags || {};
    if (el.type === 'way' && t.building && el.geometry?.length >= 4) {
      const h = parseFloat(t.height);
      const lv = parseFloat(t['building:levels']);
      buildings.push({
        id: el.id, footprint: el.geometry.map((g) => [g.lat, g.lon]),
        height: Number.isFinite(h) ? h : null, levels: Number.isFinite(lv) ? lv : null,
        type: t.building, name: t.name || null,
      });
    } else if (el.type === 'node' && t.place && t.name) {
      places.push({ id: el.id, name: t.name, place: t.place, lat: el.lat, lon: el.lon, population: t.population ? +t.population : null, ele: t.ele ? parseFloat(t.ele) : null });
    }
  }
  return { buildings, places };
}
