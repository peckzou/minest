/* External 3D model integration:
 *  1. Sketchfab Data API v3 (public search, no key needed) → browse Hallstatt / alpine models, preview with the Sketchfab embed viewer.
 *  2. glTF/GLB import (file picker, drag & drop, ?glb=<url>) → drops the model into the live Three.js scene.
 */
(function (root) {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const API = 'https://api.sketchfab.com/v3/search';
  const CHIPS = ['hallstatt', 'alpine village', 'alpine church', 'alpine chalet', 'wooden boat', 'pine tree', 'mountain lake', 'austria'];
  const hooks = { loadGLB: null, clearGLB: null, setGLBScale: null, toast: null, onOpen: null, onClose: null };
  let nextUrl = null, busy = false, firstOpen = true;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function status(msg) { $('mstat').textContent = msg || ''; }

  function thumb(m) {
    const imgs = (m.thumbnails && m.thumbnails.images) || [];
    const pick = imgs.filter((i) => i.width >= 200).sort((a, b) => a.width - b.width)[0] || imgs[0];
    return pick ? pick.url : '';
  }

  async function search(q, append) {
    if (busy) return;
    busy = true;
    const grid = $('mgrid');
    if (!append) { grid.innerHTML = ''; nextUrl = null; }
    status('正在连接 Sketchfab API…');
    try {
      let url = append && nextUrl ? nextUrl : API + '?type=models&count=24&sort_by=-likeCount&q=' + encodeURIComponent(q || 'hallstatt');
      if (!append || !nextUrl) {
        if ($('mDl').checked) url += '&downloadable=true';
        if ($('mAnim').checked) url += '&animated=true';
      }
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      nextUrl = data.next || null;
      const list = data.results || [];
      list.forEach((m) => {
        const card = document.createElement('div');
        card.className = 'mcard';
        card.innerHTML = '<img loading="lazy" alt="" src="' + esc(thumb(m)) + '"><div><b>' + esc(m.name) + '</b><span>' + esc(m.user && m.user.displayName) +
          ' · ♥ ' + (m.likeCount || 0) + '</span><span>' + esc((m.license && m.license.label) || '标准许可') + (m.isDownloadable ? ' · 可下载' : '') + '</span></div>';
        card.onclick = () => openModel(m);
        grid.appendChild(card);
      });
      if (nextUrl) {
        const more = document.createElement('button');
        more.className = 'mbtn'; more.textContent = '加载更多…'; more.style.gridColumn = '1/-1';
        more.onclick = () => { more.remove(); search(q, true); };
        grid.appendChild(more);
      }
      status(list.length ? '共显示 ' + grid.querySelectorAll('.mcard').length + ' 个结果 · 数据来自 Sketchfab' : '没有找到结果，换个关键词试试');
    } catch (e) {
      status('无法访问 Sketchfab API（离线或被拦截）：' + e.message);
    } finally { busy = false; }
  }

  function openModel(m) {
    const uid = m.uid || m;
    const embed = (m.embedUrl || 'https://sketchfab.com/models/' + uid + '/embed') + '?autostart=1&ui_theme=dark&ui_infos=1&ui_hint=1&dnt=1';
    $('mTitle').textContent = m.name || uid;
    $('mFrame').src = embed;
    const lic = m.license && m.license.label ? m.license.label : '见模型页面';
    const author = m.user ? '<a target="_blank" rel="noopener" href="' + esc(m.user.profileUrl) + '">' + esc(m.user.displayName) + '</a>' : '';
    $('mCap').innerHTML = '作者：' + author + ' · 许可：' + esc(lic) + ' · <a target="_blank" rel="noopener" href="' + esc(m.viewerUrl || ('https://sketchfab.com/models/' + uid)) + '">在 Sketchfab 打开 / 下载</a>' +
      '<br>' + (m.faceCount ? '面数 ' + m.faceCount.toLocaleString() + ' · ' : '') + '使用 CC 模型请按许可署名；下载后的 .glb 可用下方“导入”放进场景。';
    $('mgrid').style.display = 'none'; $('mstat').style.display = 'none'; $('mchips').style.display = 'none';
    $('mview').classList.add('open');
  }
  function closeModel() {
    $('mFrame').src = 'about:blank';
    $('mview').classList.remove('open');
    $('mgrid').style.display = ''; $('mstat').style.display = ''; $('mchips').style.display = '';
  }

  function open() {
    $('mpanel').classList.add('open');
    if (hooks.onOpen) hooks.onOpen();
    if (firstOpen) { firstOpen = false; search($('mq').value); }
  }
  function close() {
    $('mpanel').classList.remove('open');
    closeModel();
    if (hooks.onClose) hooks.onClose();
  }
  function toggle() { $('mpanel').classList.contains('open') ? close() : open(); }

  function init(h) {
    Object.assign(hooks, h || {});
    const chips = $('mchips');
    CHIPS.forEach((c) => {
      const b = document.createElement('button'); b.textContent = c;
      b.onclick = () => { $('mq').value = c; closeModel(); search(c); };
      chips.appendChild(b);
    });
    $('mGo').onclick = () => { closeModel(); search($('mq').value); };
    $('mq').addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { closeModel(); search($('mq').value); } });
    ['glbUrl'].forEach((id) => $(id).addEventListener('keydown', (e) => e.stopPropagation()));
    $('mClose').onclick = close;
    $('mBack').onclick = closeModel;
    $('mDl').onchange = $('mAnim').onchange = () => { closeModel(); search($('mq').value); };
    $('glbFile').onchange = (e) => { const f = e.target.files[0]; if (f) importFile(f); e.target.value = ''; };
    $('glbGo').onclick = () => { const u = $('glbUrl').value.trim(); if (u) loadURL(u, u.split('/').pop()); };
    $('glbClear').onclick = () => hooks.clearGLB && hooks.clearGLB();
    $('glbScale').oninput = (e) => hooks.setGLBScale && hooks.setGLBScale(parseFloat(e.target.value));

    // drag & drop anywhere
    let dragDepth = 0;
    window.addEventListener('dragenter', (e) => { if (e.dataTransfer && [].includes.call(e.dataTransfer.types, 'Files')) { dragDepth++; document.body.classList.add('dragging'); } });
    window.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) document.body.classList.remove('dragging'); });
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault(); dragDepth = 0; document.body.classList.remove('dragging');
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) importFile(f);
    });

    const qs = new URLSearchParams(location.search);
    if (qs.get('glb')) loadURL(qs.get('glb'), 'URL 模型');
    if (qs.get('sketchfab')) { open(); openModel({ uid: qs.get('sketchfab'), name: 'Sketchfab ' + qs.get('sketchfab') }); }
  }

  function importFile(file) {
    if (!/\.(glb|gltf)$/i.test(file.name)) { hooks.toast && hooks.toast('请选择 .glb / .gltf 文件'); return; }
    loadURL(URL.createObjectURL(file), file.name);
  }
  function loadURL(url, name) {
    if (!hooks.loadGLB) return;
    hooks.toast && hooks.toast('正在加载 ' + name + ' …');
    hooks.loadGLB(url, name).then(
      () => hooks.toast && hooks.toast('已放入场景：' + name + '（在面前约 50 格）'),
      (e) => hooks.toast && hooks.toast('加载失败：' + (e && e.message ? e.message : e))
    );
  }

  root.HallstattModels = { init, open, close, toggle, isOpen: () => $('mpanel').classList.contains('open') };
})(window);
