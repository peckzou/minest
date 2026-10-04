// Minest AI on Vercel: /api/minest/<op> — ai-chat, ai-chat-stream, ai-plan, ai-expand, ai-analyze,
// ai-diagnose, ai-board. Same logic as the Mac server (api/_minest/core.mjs).
// Every request must carry X-Minest-Token = MINEST_AI_TOKEN (set in the Vercel project), so the
// API key behind it cannot be used by anyone else. Without a configured token nothing is served.
import { headers, handle, streamChat } from '../_minest/core.mjs';

export const config = { runtime: 'nodejs' };

const send = (res, status, body) => {
  res.statusCode = status;
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { res.statusCode = 204; Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v)); return res.end(); }
  if (req.method !== 'POST') return send(res, 405, { error: 'POST required' });
  const token = process.env.MINEST_AI_TOKEN;
  if (!token) return send(res, 503, { error: 'Minest AI: MINEST_AI_TOKEN is not configured on the server' });
  if (req.headers['x-minest-token'] !== token) return send(res, 401, { error: 'Minest AI: 设备未授权（缺少 token）' });
  const op = String((req.query && req.query.op) || '').replace(/[^a-z-]/g, '');
  const input = req.body && typeof req.body === 'object' ? req.body : {};
  let streaming = false;
  try {
    const result = await handle('/' + op, input);
    if (result && result.__stream) { streaming = true; return await streamChat(res, input, result.__stream); }
    return send(res, 200, result);
  } catch (error) {
    if (streaming) { try { res.end('data: ' + JSON.stringify({ error: error.message }) + '\n\n'); } catch (e) {} return; }
    return send(res, error.statusCode || 500, { error: error.message });
  }
}
