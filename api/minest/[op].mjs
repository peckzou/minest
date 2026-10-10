// Minest AI on Vercel: /api/minest/<op> — ai-chat, ai-chat-stream, ai-plan, ai-expand, ai-analyze,
// ai-diagnose, ai-board, ai-judge (44.7 voice quiz). Same logic as the Mac server (api/_minest/core.mjs).
// Every request must carry X-Minest-Token = MINEST_AI_TOKEN (the app), or a Google sign-in on the allowed list
// (X-Minest-Id-Token, see api/_minest/auth.mjs), so the API key behind it cannot be used by anyone else.
import { headers, handle, streamChat } from '../_minest/core.mjs';
import { authorize } from '../_minest/auth.mjs';

export const config = { runtime: 'nodejs' };

const send = (res, status, body) => {
  res.statusCode = status;
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.statusCode = 204; Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v)); return res.end(); }
  if (req.method !== 'POST') return send(res, 405, { error: 'POST required' });
  const auth = await authorize(req, process.env.MINEST_AI_TOKEN);
  if (!auth.ok) return send(res, auth.status, { error: auth.error });
  const op = String((req.query && req.query.op) || '').replace(/[^a-z-]/g, '');
  const input = req.body && typeof req.body === 'object' ? req.body : {};
  if (op === 'ai-chat-stream') {
    try { const r = await handle('/' + op, input); return await streamChat(res, input, r.__stream); }
    catch (error) { try { res.end('data: ' + JSON.stringify({ error: error.message }) + '\n\n'); } catch (e) {} return; }
  }
  // Long AI calls (40–80 s) can outlast the phone's idle timeout, so the reply starts at once and a
  // space goes out every 8 s until the JSON is ready (leading whitespace is valid JSON).
  // Errors therefore come back as 200 + { error } — the app checks for that.
  res.statusCode = 200;
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  res.write(' ');
  const beat = setInterval(() => { try { res.write(' '); } catch (e) {} }, 8000);
  try {
    const result = await handle('/' + op, input);
    clearInterval(beat); res.end(JSON.stringify(result));
  } catch (error) {
    clearInterval(beat); res.end(JSON.stringify({ error: error.message }));
  }
}
