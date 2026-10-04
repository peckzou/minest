import crypto from 'node:crypto';

export const config = { runtime: 'nodejs' };

const ISE_HOST = 'ise-api.xfyun.cn';
const ISE_PATH = '/v2/open-ise';
const ISE_URL = `wss://${ISE_HOST}${ISE_PATH}`;
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function decodeAudio(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('audio is required');
  const match = value.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/);
  const encoded = match ? match[2] : value;
  if (!/^[A-Za-z0-9+/=\s]+$/.test(encoded)) throw new Error('audio must be base64 PCM audio');
  const audio = Buffer.from(encoded.replace(/\s/g, ''), 'base64');
  if (!audio.length) throw new Error('audio is empty');
  if (audio.length > MAX_AUDIO_BYTES) throw new Error('audio exceeds 8 MB');
  return audio;
}

function authUrl() {
  const appId = process.env.XFYUN_APP_ID;
  const apiKey = process.env.XFYUN_API_KEY;
  const apiSecret = process.env.XFYUN_API_SECRET;
  if (!appId || !apiKey || !apiSecret) throw new Error('XFYUN credentials are not configured');
  const date = new Date().toUTCString();
  const origin = `host: ${ISE_HOST}\ndate: ${date}\nGET ${ISE_PATH} HTTP/1.1`;
  const signature = crypto.createHmac('sha256', apiSecret).update(origin).digest('base64');
  const authorization = Buffer.from(`api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`).toString('base64');
  return `${ISE_URL}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(ISE_HOST)}`;
}

function parseNumber(xml, names) {
  for (const name of names) {
    const match = xml.match(new RegExp(`<${name}[^>]*>\\s*([^<]+)\\s*</${name}>`, 'i'));
    if (match && Number.isFinite(Number(match[1]))) return Number(match[1]);
    const attr = xml.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i'));
    if (attr && Number.isFinite(Number(attr[1]))) return Number(attr[1]);
  }
  return null;
}

function parseBoolean(xml, names) {
  for (const name of names) {
    const match = xml.match(new RegExp(`<${name}[^>]*>\\s*([^<]+)\\s*</${name}>`, 'i')) || xml.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i'));
    if (match) return /^(1|true|yes|rejected)$/i.test(match[1].trim());
  }
  return false;
}

function parseAssessment(payload) {
  let xml = '';
  try { xml = Buffer.from(payload.data || '', 'base64').toString('utf8'); } catch {}
  if (!xml) throw new Error('empty assessment result');
  const rejected = parseBoolean(xml, ['is_rejected', 'isRejected', 'reject', 'rejected']) || /reject|invalid|error/i.test(xml.match(/<err_msg[^>]*>([^<]*)/i)?.[1] || '');
  const score = parseNumber(xml, ['total_score', 'overall_score', 'overall', 'score']);
  const accuracy = parseNumber(xml, ['accuracy_score', 'accuracy']);
  if (rejected) return { score: null, accuracy: null, isRejected: true };
  if (score === null || accuracy === null) throw new Error('assessment result did not contain usable scores');
  return { score: Math.round(score), accuracy: Math.round(accuracy), isRejected: false };
}

async function assess(targetWord, audio) {
  const url = authUrl();
  const socket = new WebSocket(url);
  const result = await new Promise((resolve, reject) => {
    let settled = false;
    let assessmentData = '';
    const finish = (fn, value) => { if (!settled) { settled = true; clearTimeout(timer); try { socket.close(); } catch {} fn(value); } };
    const timer = setTimeout(() => finish(reject, new Error('讯飞评测超时')), 30000);
    socket.addEventListener('open', async () => {
      socket.send(JSON.stringify({ common: { app_id: process.env.XFYUN_APP_ID }, business: { language: 'en_us', category: 'read_word', group: 'adult', ent: 'en_vip', cmd: 'ssb', textmode: 'normal', aue: 'raw', auf: 'audio/L16;rate=16000', rstcd: 'utf8' }, data: { status: 0, data: Buffer.from(targetWord, 'utf8').toString('base64'), data_type: 1, encoding: 'utf8' } }));
      const frameBytes = 1280;
      for (let offset = 0; offset < audio.length; offset += frameBytes) {
        socket.send(JSON.stringify({ data: { status: 1, data: audio.subarray(offset, offset + frameBytes).toString('base64'), data_type: 1, encoding: 'raw' } }));
        await new Promise(resolve => setTimeout(resolve, 40));
      }
      socket.send(JSON.stringify({ data: { status: 2, data: '', data_type: 1, encoding: 'raw' } }));
    });
    socket.addEventListener('message', event => {
      let packet;
      try { packet = JSON.parse(String(event.data)); } catch { return finish(reject, new Error('invalid response from 讯飞')); }
      if (packet.code && Number(packet.code) !== 0) return finish(reject, new Error(`讯飞错误 ${packet.code}`));
      if (typeof packet.data?.data === 'string') assessmentData += packet.data.data;
      if (packet.status === 2 || packet.data?.status === 2) {
        try { finish(resolve, parseAssessment({ data: assessmentData })); } catch (error) { finish(reject, error); }
      }
    });
    socket.addEventListener('error', () => finish(reject, new Error('讯飞 WebSocket connection failed')));
    socket.addEventListener('close', () => { if (!settled) finish(reject, new Error('讯飞 WebSocket closed before final result')); });
  });
  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST required' });
  try {
    const body = req.body || {};
    const word = String(body.targetWord || '').trim();
    if (!/^[A-Za-z][A-Za-z' -]{0,99}$/.test(word)) return json(res, 400, { error: 'targetWord must be an English word' });
    const result = await assess(word, decodeAudio(body.audio));
    return json(res, 200, { word, ...result });
  } catch (error) {
    const status = /credentials|audio is required|audio is empty|base64|exceeds|targetWord/.test(error.message) ? 400 : 502;
    return json(res, status, { error: error.message });
  }
}
