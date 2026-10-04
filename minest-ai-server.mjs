import http from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { homedir, networkInterfaces, hostname } from 'node:os';
import { headers, readBody, handle, streamChat } from './api/_minest/core.mjs';

// Minest AI server on this Mac (for development and Wi-Fi use). The same logic runs on Vercel
// at /api/minest/<op>; this file only adds the local HTTP server, Wi-Fi access and its token.
const port = Number(process.env.MINest_AI_PORT || 8787);

// 41.32: the phone reaches this server over Wi-Fi. Requests from other devices must carry the
// private token (kept in ~/.minest-ai-token, outside the project) — otherwise anyone on the same
// network could spend the API key. Requests from this Mac itself need no token.
const tokenFile = join(homedir(), '.minest-ai-token');
const TOKEN = (() => { try { return readFileSync(tokenFile, 'utf8').trim(); } catch (e) { const t = randomBytes(18).toString('base64url'); try { writeFileSync(tokenFile, t, { mode: 0o600 }); } catch (err) {} return t; } })();
const isLocal = (ip) => /^(127\.0\.0\.1|::1|::ffff:127\.0\.0\.1)$/.test(String(ip || ''));
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, headers); return res.end(); }
  if (!isLocal(req.socket.remoteAddress) && req.headers['x-minest-token'] !== TOKEN) { res.writeHead(401, headers); return res.end(JSON.stringify({ error: 'Minest AI: 设备未授权（缺少 token）' })); }
  if (req.method !== 'POST') { res.writeHead(405, headers); return res.end(JSON.stringify({ error: 'POST required' })); }
  let input;
  try { input = await readBody(req); } catch (error) { res.writeHead(error.statusCode || 400, headers); return res.end(JSON.stringify({ error: error.message })); }
  if (String(req.url || '').endsWith('/ai-chat-stream')) {
    try { const r = await handle(req.url, input); return await streamChat(res, input, r.__stream); }
    catch (error) { try { res.end('data: ' + JSON.stringify({ error: error.message }) + '\n\n'); } catch (e) {} return; }
  }
  // same as on Vercel: answer at once, a space every 8 s, then the JSON (errors as 200 + { error })
  res.writeHead(200, headers); res.write(' ');
  const beat = setInterval(() => { try { res.write(' '); } catch (e) {} }, 8000);
  try { const result = await handle(req.url || '', input); clearInterval(beat); res.end(JSON.stringify(result)); }
  catch (error) { clearInterval(beat); res.end(JSON.stringify({ error: error.message })); }
});
server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the existing Minest AI server or set MINest_AI_PORT to another port.`);
    process.exit(1);
  }
  throw error;
});
const host = process.env.MINEST_AI_HOST || '0.0.0.0';
server.listen(port, host, () => {
  console.log(`Minest AI server listening on http://127.0.0.1:${port}`);
  if (host === '0.0.0.0') {
    const lan = Object.values(networkInterfaces()).flat().filter(a => a && a.family === 'IPv4' && !a.internal).map(a => a.address);
    console.log(`  phone (same Wi-Fi): http://${hostname().replace(/\.local$/, '')}.local:${port}  ${lan.map(a => '· http://' + a + ':' + port).join(' ')}  (token in ~/.minest-ai-token)`);
  }
});
