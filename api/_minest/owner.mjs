// Who owns an island or a public page (ids are hashes, never the token or the email itself):
//   the site owner — the app token, or a Google account on MINEST_AI_EMAILS — is one owner on every device;
//   anyone else signed in with Google is their Firebase uid. No sign-in → null.
import { createHash } from 'node:crypto';
import { firebaseUser, allowedEmails } from './auth.mjs';

const hash = (s) => createHash('sha256').update(String(s)).digest('hex').slice(0, 24);

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
