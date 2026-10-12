// CORS for the Visual Library endpoints, so the iOS app (pages loaded from the bundle → Origin "file://" or "null") and the
// web app can call them. Authorization is unchanged: every request still needs a Minest device token or a Firebase
// sign-in (X-Minest-Token / X-Minest-Id-Token headers, never cookies), the same rule as /api/minest.
const DEFAULT = ['null', 'file://', 'https://minest-app.vercel.app', 'https://focusboard-drab.vercel.app'];
export function withCors(handler, env = process.env) {
  const allowed = new Set(DEFAULT.concat(String(env.MINEST_LIBRARY_ALLOWED_ORIGINS || '').split(',').map((x) => x.trim()).filter(Boolean)));
  return async function corsHandler(req, res) {
    const origin = req.headers && req.headers.origin;
    if (origin && allowed.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'X-Minest-Token, X-Minest-Id-Token, Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Max-Age', '600');
    }
    if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
    return handler(req, res);
  };
}
