// RV World (/rv-world/) data proxy: wraps the app's own Express API (api/_rv-world/api.mjs).
// vercel.json rewrites /rv-world/api/<path> to /api/rv-world?rvpath=<path>.
import express from 'express';

process.env.RVWORLD_CACHE_DIR ||= '/tmp/rvworld-cache';
process.env.RVWORLD_USER_AGENT ||= 'RVWorld/0.1 (https://minest-app.vercel.app/rv-world/; personal travel simulator) node';

let app;
async function getApp() {
  if (app) return app;
  const { createApi } = await import('./_rv-world/api.mjs');
  app = express();
  app.disable('x-powered-by');
  app.use('/api', createApi());
  return app;
}

export default async function handler(req, res) {
  const u = new URL(req.url, 'http://local');
  const p = (u.searchParams.get('rvpath') || '').replace(/^\/+/, '');
  u.searchParams.delete('rvpath');
  req.url = `/api/${p}${u.search}`;
  (await getApp())(req, res);
}
