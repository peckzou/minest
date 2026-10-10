// OpenAI Realtime WebRTC session bridge.
// The browser sends only an SDP offer and the device token. The standard
// OPENAI_API_KEY stays in Vercel and is never returned to the client.
import { createHash } from 'node:crypto';
import { authorize } from '../_minest/auth.mjs';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Minest-Token, X-Minest-Id-Token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store'
};

const reply = (res, status, body, type = 'application/json; charset=utf-8') => {
  res.statusCode = status;
  Object.entries({ ...cors, 'Content-Type': type }).forEach(([key, value]) => res.setHeader(key, value));
  res.end(body);
};

// Vercel only pre-parses JSON / text / form bodies; an application/sdp body has to be read from the stream.
async function rawBody(req) {
  let body;
  try { body = req.body; } catch (error) { body = undefined; }   // the body getter can throw on unknown types
  if (Buffer.isBuffer(body)) return body.toString('utf8');
  if (typeof body === 'string' && body) return body;
  if (body && typeof body === 'object' && (body.sdp || body.offer)) return String(body.sdp || body.offer);
  if (req.readableEnded) return '';
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function safetyIdentifier(token) {
  return createHash('sha256').update(String(token || '')).digest('hex').slice(0, 64);
}

export const config = { runtime: 'nodejs', maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return reply(res, 204, '');
  if (req.method !== 'POST') return reply(res, 405, JSON.stringify({ error: 'POST required' }));

  // the app's token, or a Google sign-in on the allowed list (api/_minest/auth.mjs)
  const auth = await authorize(req, process.env.MINEST_AI_TOKEN);
  if (!auth.ok) return reply(res, auth.status, JSON.stringify({ error: auth.error }));

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return reply(res, 503, JSON.stringify({ error: 'OPENAI_API_KEY is not configured on the server' }));

  const sdp = (await rawBody(req)).trim();
  if (!sdp || !/^v=0\s/m.test(sdp)) return reply(res, 400, JSON.stringify({ error: 'Invalid WebRTC SDP offer' }));

  // 44.4: the voice the user picked in the voice orb (one of the Realtime voices), else the default
  const VOICES = ['marin', 'cedar', 'coral', 'shimmer', 'sage', 'ballad', 'verse', 'alloy', 'ash', 'echo'];
  let picked = '';
  try { picked = String((req.query && req.query.voice) || new URL(req.url, 'http://x').searchParams.get('voice') || '').toLowerCase(); } catch (error) {}
  const voice = VOICES.includes(picked) ? picked : (process.env.OPENAI_REALTIME_VOICE || 'marin');
  const base = (process.env.OPENAI_REALTIME_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const session = {
    type: 'realtime',
    model: process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime-2.1',
    instructions: 'You are Minest AI Pet, a warm and concise voice companion. Reply naturally in the user language. Keep answers short unless the user asks for detail. Listen for interruptions and yield immediately.',
    audio: {
      input: {
        transcription: { model: process.env.OPENAI_REALTIME_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe' },
        turn_detection: {
          type: process.env.OPENAI_REALTIME_VAD || 'semantic_vad',
          eagerness: process.env.OPENAI_REALTIME_VAD_EAGERNESS || 'high',
          create_response: true,
          interrupt_response: true
        }
      },
      output: { voice }
    }
  };
  const form = new FormData();
  form.set('sdp', sdp);
  form.set('session', JSON.stringify(session));

  try {
    const upstream = await fetch(base + '/realtime/calls', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'OpenAI-Safety-Identifier': safetyIdentifier(deviceToken)
      },
      body: form
    });
    const answer = await upstream.text();
    if (!upstream.ok) {
      let message = answer.slice(0, 1000);
      try { message = JSON.parse(answer)?.error?.message || message; } catch (error) {}
      return reply(res, upstream.status, JSON.stringify({ error: 'Realtime session failed: ' + message }));
    }
    return reply(res, 200, answer, 'application/sdp');
  } catch (error) {
    return reply(res, 502, JSON.stringify({ error: 'Realtime session network error: ' + (error.message || 'unknown') }));
  }
}
