// Who may use the Minest AI endpoints (and so the API key behind them, which never leaves the server):
//   · a device that carries the Minest token — X-Minest-Token = MINEST_AI_TOKEN (the iPhone / iPad app), or
//   · someone signed in with Google on the web whose email is on the list — X-Minest-Id-Token = a Firebase ID
//     token (project minest-33761), checked here against Google's public keys; MINEST_AI_EMAILS is the list
//     (comma-separated, set in the Vercel project). Without that list nobody gets in through Google.
import { createPublicKey, verify } from 'node:crypto';

const PROJECT = process.env.MINEST_FIREBASE_PROJECT || 'minest-33761';
const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let certs = null, certsUntil = 0;

async function googleCerts() {
  if (certs && Date.now() < certsUntil) return certs;
  const r = await fetch(CERTS_URL);
  if (!r.ok) throw new Error('google certs ' + r.status);
  const age = /max-age=(\d+)/.exec(r.headers.get('cache-control') || '');
  certs = await r.json();
  certsUntil = Date.now() + (age ? +age[1] : 3600) * 1000;
  return certs;
}

const b64url = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

// the verified email of a Firebase ID token, or '' (any problem → '')
export async function firebaseEmail(idToken) {
  try {
    const parts = String(idToken || '').split('.');
    if (parts.length !== 3) return '';
    const head = JSON.parse(b64url(parts[0]).toString('utf8'));
    const body = JSON.parse(b64url(parts[1]).toString('utf8'));
    if (head.alg !== 'RS256' || !head.kid) return '';
    const pem = (await googleCerts())[head.kid];
    if (!pem) return '';
    const ok = verify('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]), createPublicKey(pem), b64url(parts[2]));
    if (!ok) return '';
    const now = Math.floor(Date.now() / 1000);
    if (body.aud !== PROJECT || body.iss !== 'https://securetoken.google.com/' + PROJECT) return '';
    if (!(body.exp > now) || !(body.iat <= now + 60) || !body.sub) return '';
    if (!body.email || body.email_verified !== true) return '';
    return String(body.email).toLowerCase();
  } catch (e) {
    return '';
  }
}

function allowedEmails() {
  return String(process.env.MINEST_AI_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

// { ok, status, error } — status 503 when the server has no way to admit anyone
export async function authorize(req, deviceToken) {
  const sent = req.headers['x-minest-token'];
  if (deviceToken && sent && sent === deviceToken) return { ok: true, via: 'token' };
  const idToken = req.headers['x-minest-id-token'];
  const list = allowedEmails();
  if (idToken && list.length) {
    const email = await firebaseEmail(idToken);
    if (email && list.includes(email)) return { ok: true, via: 'google' };
    return { ok: false, status: 403, error: 'Minest AI: this Google account is not allowed' };
  }
  if (!deviceToken && !list.length) return { ok: false, status: 503, error: 'Minest AI: no MINEST_AI_TOKEN or MINEST_AI_EMAILS configured on the server' };
  return { ok: false, status: 401, error: 'Minest AI: 设备未授权（缺少 token）' };
}
