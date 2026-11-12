/* Trinity College - student life UI/interaction layer (pairs with student.js).
 * TrinityLifeUI.attach(life, ctx) -> { destroy, cancelAll, target, open... }
 * ctx = { camera, player, S, world, toast, teleport, exitLock, requestLock, clearInput, isTouch, built, collect(id,on), isCollected(id), THREE, root }
 * Every interaction has enter / in-progress / cancel / exit states; while a panel is open S.ui = true (the app freezes movement and look).
 */
(function (root) {
  'use strict';
  const CSS = `
.trl-hint{position:fixed;left:50%;top:calc(64px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:30;display:none;padding:10px 18px;border-radius:22px;border:1px solid rgba(255,230,160,.5);background:rgba(30,22,12,.82);color:#f6e8c0;font:600 14px system-ui,sans-serif;cursor:pointer;backdrop-filter:blur(6px);white-space:nowrap}
.trl-hint.on{display:block}
.trl-route-btn{position:fixed;top:calc(10px + env(safe-area-inset-top,0px));right:10px;z-index:31;padding:8px 12px;border-radius:18px;border:1px solid rgba(255,230,160,.45);background:rgba(30,22,12,.8);color:#f6e8c0;font:600 13px system-ui,sans-serif;cursor:pointer}
.trl-ov{position:fixed;inset:0;z-index:40;display:none;align-items:flex-end;justify-content:center;background:rgba(10,8,4,.35)}
.trl-ov.on{display:flex}
.trl-sheet{width:min(520px,100%);max-height:78vh;overflow:auto;background:#fbf4e2;color:#2a2012;border-radius:16px 16px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));font:14px/1.5 system-ui,sans-serif;box-shadow:0 -8px 30px rgba(0,0,0,.35)}
@media(min-width:700px){.trl-ov{align-items:center}.trl-sheet{border-radius:16px}}
.trl-sheet h3{margin:0 0 4px;font:700 18px Georgia,serif}.trl-sheet .sub{color:#7a6a4a;font-size:12px;margin-bottom:8px}
.trl-sheet p{margin:8px 0}.trl-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.trl-b{flex:1 1 auto;min-width:72px;padding:11px 12px;border-radius:10px;border:1px solid #c9b88a;background:#f1e5c4;color:#2a2012;font:600 14px system-ui;cursor:pointer}
.trl-b.pri{background:#7a2a2a;border-color:#5a1a1a;color:#fff}.trl-b.dng{color:#8a1a1a}.trl-b[disabled]{opacity:.4}
.trl-list{display:grid;gap:6px;margin-top:8px}.trl-it{display:flex;justify-content:space-between;gap:8px;padding:10px;border-radius:10px;border:1px solid #d8c9a0;background:#fff8e6;cursor:pointer}
.trl-it small{color:#7a6a4a}.trl-tag{font-size:11px;color:#9a5a1a}`;

  function attach(life, ctx) {
    const { camera, player, S, THREE } = ctx, doc = document;
    const st = doc.createElement('style'); st.textContent = CSS; doc.head.appendChild(st);
    const hint = doc.createElement('button'); hint.className = 'trl-hint'; doc.body.appendChild(hint);
    const routeBtn = doc.createElement('button'); routeBtn.className = 'trl-route-btn'; routeBtn.textContent = '🧭 路线'; doc.body.appendChild(routeBtn);
    const ov = doc.createElement('div'); ov.className = 'trl-ov'; ov.innerHTML = '<div class="trl-sheet"></div>'; doc.body.appendChild(ov);
    const sheet = ov.firstChild;
    let cur = null, tgt = null, active = null;      // active = { kind, onClose }
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    /* ---------- panel plumbing ---------- */
    function openPanel(kind, html, onClose) {
      closePanel(true); active = { kind, onClose }; S.ui = true; ctx.clearInput(); ctx.exitLock();
      sheet.innerHTML = html; ov.classList.add('on'); hint.classList.remove('on'); sheet.scrollTop = 0;
    }
    function closePanel(silent) {
      if (!active) return; const a = active; active = null; ov.classList.remove('on'); S.ui = false; ctx.clearInput();
      if (a.onClose) a.onClose();
      if (!silent && !ctx.isTouch && S.mode !== 'tour') ctx.requestLock();
    }
    ov.addEventListener('click', (e) => { if (e.target === ov) closePanel(); });
    const onKey = (e) => { if (active && e.code === 'Escape') { e.preventDefault(); closePanel(); } };
    doc.addEventListener('keydown', onKey);
    const bind = (sel, fn) => { const el = sheet.querySelector(sel); if (el) el.addEventListener('click', fn); };

    /* ---------- books (study shelf + Wren presses) ---------- */
    const tmpM = new THREE.Matrix4(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
    function readBook(mesh, i, id) {
      const home = new THREE.Matrix4(); mesh.getMatrixAt(i, home);
      mesh.setMatrixAt(i, ZERO); mesh.instanceMatrix.needsUpdate = true;      // the book is in the reader's hand
      const info = life.bookInfo(id), wren = String(id)[0] === 'W' || String(id)[0] === 'E';
      const col = wren && ctx.isCollected(id);
      openPanel('book', `<h3>📖 ${esc(info.title)}</h3><div class="sub">${esc(info.author)} · 编号 ${esc(id)} · <span class="trl-tag">示例条目（非馆藏真实书目）</span></div>
        <p>这是一本放在${wren ? '雷恩图书馆书架' : '宿舍书架'}上的书。取出后书架上的位置会留空；关闭或归还后它回到原位。</p>
        <div class="trl-row">${wren ? `<button class="trl-b" data-a="col">${col ? '取消收藏' : '⭐ 收藏'}</button>` : ''}<button class="trl-b pri" data-a="ret">归还原位</button><button class="trl-b" data-a="x">取消</button></div>`,
      () => { mesh.setMatrixAt(i, home); mesh.instanceMatrix.needsUpdate = true; });
      bind('[data-a=ret]', () => { closePanel(); ctx.toast('📚 已归还'); }); bind('[data-a=x]', () => closePanel());
      bind('[data-a=col]', () => { ctx.collect(id); closePanel(); });
    }

    /* ---------- display slots ---------- */
    function items() {
      const br = root.__trItems;
      if (br && br.list) { try { const l = br.list(); if (l && l.length) return { list: l, demo: false }; } catch (e) { /* fall through */ } }
      return { list: [{ id: 'demo-book', title: '示例书籍', kind: 'book' }, { id: 'demo-photo', title: '示例照片', kind: 'photo' }, { id: 'demo-card', title: '示例卡片', kind: 'card' }, { id: 'demo-item', title: '示例收藏品', kind: 'item' }], demo: true };
    }
    function slotPanel(sl) {
      const rec = life.state.slots[sl.id];
      if (!rec) return pickPanel(sl);
      const it = rec.item;
      openPanel('slot', `<h3>${esc(sl.label)}</h3><div class="sub">${esc(it.title || '未命名')} · ${esc(it.kind)} ${it.missing ? '<span class="trl-tag">原内容已不存在</span>' : ''}<br>Item ID：${esc(it.id)} · 展位 ${esc(sl.id)} · 偏移 ${(rec.dx || 0).toFixed(2)} m</div>
        <div class="trl-row"><button class="trl-b pri" data-a="view">查看原内容</button><button class="trl-b" data-a="rep">更换</button></div>
        <div class="trl-row"><button class="trl-b" data-a="l">◀ 左移</button><button class="trl-b" data-a="r">右移 ▶</button><button class="trl-b" data-a="rl">⟲ 转</button><button class="trl-b" data-a="rr">转 ⟳</button></div>
        <div class="trl-row"><button class="trl-b dng" data-a="rm">移除</button><button class="trl-b" data-a="un" ${'disabled'}>撤销</button><button class="trl-b" data-a="x">关闭</button></div>`);
      const un = sheet.querySelector('[data-a=un]'); un.disabled = false;
      bind('[data-a=view]', () => { const br = root.__trItems; if (br && br.open && !String(it.id).startsWith('demo-')) { closePanel(); br.open(it.id); } else ctx.toast('示例条目没有原始内容；接入 My World 的真实 Item 后可打开'); });
      bind('[data-a=rep]', () => pickPanel(sl));
      const adj = (a, b) => () => { life.adjust(sl.id, a, b); slotPanel(sl); };
      bind('[data-a=l]', adj(-0.08, 0)); bind('[data-a=r]', adj(0.08, 0)); bind('[data-a=rl]', adj(0, 0.15)); bind('[data-a=rr]', adj(0, -0.15));
      bind('[data-a=rm]', () => { life.remove(sl.id); closePanel(); ctx.toast('已移除（可撤销）'); lastRemoved = true; });
      bind('[data-a=un]', () => { life.undo(); slotPanel(sl); }); bind('[data-a=x]', () => closePanel());
    }
    let lastRemoved = false;
    function pickPanel(sl) {
      const it = items(), rec = life.state.slots[sl.id];
      openPanel('pick', `<h3>${esc(sl.label)} · 选择要陈列的内容</h3><div class="sub">${it.demo ? '<span class="trl-tag">未接入 My World 看板，显示的是示例条目</span>' : '来自你的看板 Item'}</div>
        <div class="trl-list">${it.list.map((x, n) => `<div class="trl-it" data-n="${n}"><span>${esc(x.title || x.id)}</span><small>${esc(x.kind || 'item')}</small></div>`).join('')}</div>
        <div class="trl-row">${life.hasUndo && life.hasUndo() ? '<button class="trl-b" data-a="un">撤销</button>' : ''}<button class="trl-b" data-a="x">取消</button></div>`);
      sheet.querySelectorAll('.trl-it').forEach((el) => el.addEventListener('click', () => { const x = it.list[+el.dataset.n]; life.place(sl.id, Object.assign({ source: it.demo ? 'demo' : 'myworld' }, x)); closePanel(); ctx.toast('已摆放：' + (x.title || x.id)); }));
      bind('[data-a=un]', () => { life.undo(); closePanel(); }); bind('[data-a=x]', () => closePanel());
      void rec;
    }

    /* ---------- route ---------- */
    const FL = 3.7, W = ctx.world, H = W.hall, L = W.wren, B = W.backs;
    const ROUTE = [
      { n: '① 大庭院 · 宿舍入口', t: { p: [-26, 0, 38.5], t: [-26, 1.6, 47], mode: 'walk' } },
      { n: '② 宿舍楼梯厅', t: { p: [-26, 0, 43.9], t: [-26, 3.6, 49], mode: 'walk' } },
      { n: '③ 学生房间（起居兼书房）', t: { p: [-23.0, FL, 46.4], t: [-19.5, FL + 1.1, 48.6], mode: 'walk' } },
      { n: '④ 大礼堂', t: { p: [H.x, 0, H.z0 + 9], t: [H.x, 2.2, H.z0 + 1], mode: 'walk' } },
      { n: '⑤ 雷恩图书馆', t: { p: [L.x, L.floorY, L.z0 + 4], t: [L.x, L.floorY + 2, L.z1], mode: 'walk' } },
      { n: '⑥ 剑河后园', t: { p: [B.x1 - 8, 0, 4], t: [B.x1 - 40, 3, 0], mode: 'walk' } },
      { n: '⑦ 返回住处', t: { p: [-23.0, FL, 46.4], t: [-19.5, FL + 1.1, 48.6], mode: 'walk' } }
    ];
    function routePanel() {
      openPanel('route', `<h3>🧭 校园路线</h3><div class="sub">也可步行：大庭院 → 南侧宿舍门（楼梯 K，约 x=-26）→ 台阶 → 平台 → 书房/卧室。以下为快速传送。</div>
        <div class="trl-list">${ROUTE.map((r, i) => `<div class="trl-it" data-i="${i}"><span>${r.n}</span></div>`).join('')}</div>
        <p class="sub">尚未开放：礼拜堂内部、其他楼梯与宿舍房间、雷恩图书馆楼上之外的区域。所有尺寸与陈设均为设计近似，非实测。</p>
        <div class="trl-row"><button class="trl-b" data-a="x">关闭</button></div>`);
      sheet.querySelectorAll('.trl-it').forEach((el) => el.addEventListener('click', () => { const r = ROUTE[+el.dataset.i]; closePanel(true); ctx.teleport(r.t); ctx.toast(r.n); }));
      bind('[data-a=x]', () => closePanel());
    }
    routeBtn.addEventListener('click', () => { if (active && active.kind === 'route') closePanel(); else routePanel(); });

    /* ---------- targeting ---------- */
    const ray = new THREE.Raycaster(); ray.far = 3.2;
    const dir = new THREE.Vector3(), tv = new THREE.Vector3();
    function findTarget() {
      if (S.sit || S.ui || (S.mode !== 'walk' && S.mode !== 'fly')) return null;
      camera.getWorldDirection(dir); let best = null, bs = 0.9;
      const cand = [];
      for (const sl of life.slots) cand.push({ type: 'slot', ref: sl, x: sl.x + sl.nx * 0.1, y: sl.y + 0.12, z: sl.z + sl.nz * 0.1, label: life.state.slots[sl.id] ? '🖼 ' + sl.label + ' · 查看/调整' : '＋ ' + sl.label + ' · 摆放内容' });
      for (const id in life.lamps) { const l = life.lamps[id]; cand.push({ type: 'lamp', ref: l, x: l.pos[0], y: l.pos[1], z: l.pos[2], label: (l.on ? '💡 关闭' : '💡 打开') + l.label }); }
      for (const c of cand) {
        tv.set(c.x - camera.position.x, c.y - camera.position.y, c.z - camera.position.z); const d = tv.length(); if (d > 2.8) continue; tv.divideScalar(d);
        const s = tv.dot(dir) - d * 0.01; if (s > bs) { bs = s; best = c; }
      }
      const seat = ctx.nearSeat(1.6);
      if (seat && (!best || bs < 0.97)) return { type: 'seat', ref: seat, label: '🪑 坐下' };
      if (best) return best;
      ray.setFromCamera({ x: 0, y: 0 }, camera);
      const meshes = [life.bookMesh, ctx.built.books.mesh].filter((m) => m && m.isInstancedMesh);
      const hit = ray.intersectObjects(meshes, false)[0];
      if (hit && hit.instanceId != null) {
        const ids = hit.object === life.bookMesh ? life.bookIds : ctx.built.books.ids;
        return { type: 'book', mesh: hit.object, i: hit.instanceId, id: ids[hit.instanceId], label: '📖 取书阅读' };
      }
      return null;
    }
    function act(t) {
      if (!t) return false;
      if (t.type === 'lamp') { life.setLamp(t.ref.id); ctx.toast(t.ref.label + (t.ref.on ? '：已打开' : '：已关闭')); return true; }
      if (t.type === 'seat') { ctx.sitOn(t.ref); return true; }
      if (t.type === 'slot') { slotPanel(t.ref); return true; }
      if (t.type === 'book') { readBook(t.mesh, t.i, t.id); return true; }
      return false;
    }
    hint.addEventListener('click', (e) => { e.stopPropagation(); act(findTarget()); });
    hint.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    let acc = 0;
    function update(dt) {
      acc += dt; if (acc < 0.1) return; acc = 0;
      const t = findTarget(); tgt = t;
      if (t) { hint.textContent = t.label + (ctx.isTouch ? '' : '（E）'); hint.classList.add('on'); } else hint.classList.remove('on');
      routeBtn.style.display = S.mode === 'tour' ? 'none' : 'block';
    }
    function interact() { if (S.ui) return true; const t = findTarget(); return act(t); }
    function cancelAll() { closePanel(true); hint.classList.remove('on'); }
    function destroy() { cancelAll(); doc.removeEventListener('keydown', onKey); [st, hint, routeBtn, ov].forEach((n) => n.remove()); }
    return { update, interact, cancelAll, destroy, closePanel, route: ROUTE, readBook, slotPanel, pickPanel, routePanel, target: () => tgt || findTarget(), get active() { return active && active.kind; } };
  }

  root.TrinityLifeUI = { attach };
  if (typeof module !== 'undefined') module.exports = root.TrinityLifeUI;
})(typeof window !== 'undefined' ? window : globalThis);
