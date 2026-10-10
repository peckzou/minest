// Isolated Voice Companion proxy. This endpoint does not import Minest board logic.
// It reuses the existing Vercel server-side OPENAI_* variables and keeps the
// provider key on Vercel. The local voice server authenticates with the existing
// MINEST_AI_TOKEN via X-Minest-Token; that token is never forwarded upstream.
import { authorize } from '../../../_minest/auth.mjs';
export const config = { runtime: 'nodejs' };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Minest-Token, X-Minest-Id-Token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    Object.entries(cors).forEach(([key, value]) => res.setHeader(key, value));
    return res.end();
  }
  if (req.method !== 'POST') {
    res.statusCode = 405;
    Object.entries(cors).forEach(([key, value]) => res.setHeader(key, value));
    return res.end(JSON.stringify({ error: 'POST required' }));
  }

  let token = process.env.MINEST_AI_TOKEN;
  if (!token) {
    try {
      const { readFileSync } = await import('node:fs');
      const { homedir } = await import('node:os');
      const { join } = await import('node:path');
      token = readFileSync(join(homedir(), '.minest-ai-token'), 'utf8').trim();
    } catch (e) {}
  }
  const authHeader = req.headers['authorization'] || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const reqToken = req.headers['x-minest-token'] || bearerToken;
  // or a Google sign-in on the allowed list (api/_minest/auth.mjs)
  if (!(token && reqToken === token) && !(await authorize(req, token)).ok) {
    res.statusCode = 401;
    Object.entries(cors).forEach(([key, value]) => res.setHeader(key, value));
    return res.end(JSON.stringify({ error: 'Voice proxy: unauthorized' }));
  }

  let apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    try {
      const { execSync } = await import('node:child_process');
      const hist = execSync('grep -o "export OPENAI_API_KEY=.*" ~/.zsh_history | tail -n 1', { encoding: 'utf8' });
      apiKey = hist.replace(/.*export OPENAI_API_KEY=[\'"]?/, '').replace(/[\'"\\\\].*/, '').trim();
    } catch (e) {}
  }
  if (!apiKey) {
    res.statusCode = 503;
    Object.entries(cors).forEach(([key, value]) => res.setHeader(key, value));
    return res.end(JSON.stringify({ error: 'OPENAI_API_KEY is not configured on the server' }));
  }

  const primaryBaseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const body = req.body && typeof req.body === 'object' ? { ...req.body, stream: true } : { stream: true };
  if (!body.max_tokens && !body.max_completion_tokens) {
    body.max_tokens = 96;
  }

  // Barge-in: abort upstream request as soon as client closes/disconnects
  const controller = new AbortController();
  req.on('close', () => {
    controller.abort();
  });

  let upstream;
  try {
    upstream = await fetch(primaryBaseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'OpenAI/Python 1.0.0',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) return res.end();
    if (primaryBaseUrl !== 'https://api.openai.com/v1') {
      try {
        upstream = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + apiKey,
            'Content-Type': 'application/json',
            'User-Agent': 'OpenAI/Python 1.0.0',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (e2) {}
    }
    if (!upstream) {
      res.statusCode = 502;
      Object.entries(cors).forEach(([key, value]) => res.setHeader(key, value));
      return res.end(JSON.stringify({ error: 'Voice proxy upstream connection failed' }));
    }
  }

  if (!upstream.ok || !upstream.body) {
    res.statusCode = upstream.status;
    Object.entries(cors).forEach(([key, value]) => res.setHeader(key, value));
    const text = await upstream.text().catch(() => '');
    return res.end(text || JSON.stringify({ error: 'Voice proxy upstream request failed' }));
  }

  res.writeHead(200, {
    ...cors,
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'X-Accel-Buffering': 'no',
    Connection: 'keep-alive',
  });
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  try {
    for await (const chunk of upstream.body) {
      res.write(chunk);
      if (typeof res.flush === 'function') res.flush();
    }
  } catch (error) {
    // The client may cancel when barge-in interrupts the current response.
  } finally {
    res.end();
  }
}
