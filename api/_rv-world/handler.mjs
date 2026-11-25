// RV World (/rv-world/) data proxy: wraps the app's own Express API (./api.mjs). Served through api/minest/[op].mjs (op rv-world)
// so the deployment stays within the plan's function count; vercel.json rewrites /rv-world/api/<path> to /api/minest/rv-world?rvpath=<path>.
import express from 'express';

process.env.RVWORLD_CACHE_DIR ||= '/tmp/rvworld-cache';
process.env.RVWORLD_USER_AGENT ||= 'RVWorld/0.1 (https://minest-app.vercel.app/rv-world/; personal travel simulator) node';

let app;
async function getApp() {
  if (app) return app;
  const { createApi } = await import('./api.mjs');
  app = express();
  app.disable('x-powered-by');
  app.use('/api', createApi());
  return app;
}

export default async function handler(req, res) {
  const u = new URL(req.url, 'http://local');
  const p = (u.searchParams.get('rvpath') || '').replace(/^\/+/, '');
  u.searchParams.delete('rvpath'); u.searchParams.delete('op');
  req.url = `/api/${p}${u.search}`;
  (await getApp())(req, res);
}
