const base = String(process.env.FIREBASE_DATABASE_URL || 'https://minest-33761-default-rtdb.firebaseio.com').replace(/\/$/, '');

function headers() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json'
  };
}

export default async function handler(req, res) {
  Object.entries(headers()).forEach(([key, value]) => res.setHeader(key, value));
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  const code = String((req.query && req.query.code) || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  if (!code) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'Invalid room code' })); }
  const url = `${base}/minest-rooms/${encodeURIComponent(code)}.json`;
  try {
    if (req.method === 'GET') {
      const r = await fetch(url);
      const body = await r.text();
      res.statusCode = r.ok ? 200 : r.status;
      return res.end(body || 'null');
    }
    if (req.method === 'PUT') {
      const payload = req.body && typeof req.body === 'object' ? req.body : {};
      const r = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await r.text();
      res.statusCode = r.ok ? 200 : r.status;
      return res.end(body || '{}');
    }
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'GET or PUT required' }));
  } catch (error) {
    res.statusCode = 502;
    return res.end(JSON.stringify({ error: 'Room service unavailable', detail: error.message }));
  }
}
