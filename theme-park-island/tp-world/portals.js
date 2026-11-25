/* Minest Imagineering Theme Park · 1:1 Disneyland Park Guide Modal, 12 Rideable Attractions HUD,
 * Cast Member Dialogue & Synthesized Web Audio Soundscape (`portals.js`). */
(function (root) {
  'use strict';

  let audioCtx = null;
  function getAudio() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
  }

  function playNote(freq, dur, type, vol, delay) {
    const ctx = getAudio(); if (!ctx) return;
    const now = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type || 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0008, now + (dur || 0.6));
    osc.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now + (dur || 0.6) + 0.05);
  }

  function playFanfare() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => playNote(f, 0.75, 'triangle', 0.12, i * 0.13));
  }

  function playFireworkBoom() {
    const ctx = getAudio(); if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.55);
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.7);
  }

  function playRideAudio(rideId) {
    if (rideId === 'railroad_tour') {
      // Authentic Brass Steam Train Chord Whistle ("Choo-Choooo!")
      [349.23, 440.0, 523.25].forEach((f) => { playNote(f, 0.55, 'sawtooth', 0.055, 0); playNote(f, 0.85, 'sawtooth', 0.06, 0.65); });
    } else if (rideId === 'pirates_ride') {
      // "Yo Ho, Yo Ho, A Pirate's Life for Me" sea-shanty motif!
      [392.0, 440.0, 493.88, 587.33, 493.88, 440.0, 392.0].forEach((f, i) => playNote(f, 0.36, 'triangle', 0.10, i * 0.17));
    } else if (rideId === 'space_mountain') {
      // Sci-fi galactic launch arpeggio!
      [220, 330, 440, 659.25, 880, 1318.5].forEach((f, i) => playNote(f, 0.4, 'sawtooth', 0.075, i * 0.08));
    } else if (rideId === 'big_thunder') {
      // Wild West runaway mine whistle & gallop!
      [293.66, 369.99, 440.0, 587.33, 440.0, 587.33].forEach((f, i) => playNote(f, 0.32, 'triangle', 0.10, i * 0.13));
    } else if (rideId === 'matterhorn_bobsleds') {
      // Swiss Alpine horn call!
      [261.63, 392.0, 523.25, 659.25, 523.25].forEach((f, i) => playNote(f, 0.5, 'sine', 0.10, i * 0.18));
    } else if (rideId === 'carousel') {
      [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880.0].forEach((f, i) => playNote(f, 0.45, 'triangle', 0.10, i * 0.22));
    } else if (rideId === 'river_boat') {
      playNote(196, 0.8, 'sawtooth', 0.07, 0);
      playNote(146.8, 0.9, 'sawtooth', 0.07, 0.25);
    } else if (rideId === 'starjet' || rideId === 'everest_ride') {
      [330, 440, 587.33, 880, 1174.6].forEach((f, i) => playNote(f, 0.5, 'sine', 0.09, i * 0.09));
    } else if (rideId === 'small_world_boat') {
      [523.25, 587.33, 659.25, 1046.5, 880.0, 987.77, 880.0, 783.99].forEach((f, i) => playNote(f, 0.42, 'sine', 0.09, i * 0.16));
    } else if (rideId === 'falcon_flight') {
      [392.0, 523.25, 659.25].forEach((f, i) => playNote(f, 0.3, 'sine', 0.07, i * 0.09)); // comm chirp only: the ride carries its own score (falcon-audio.js)
    } else {
      playFanfare();
    }
  }

  function attach(ctx) {
    const { world, props, player, teleport, toast, exitLock, setUI, boardRide, launchFireworks } = ctx;
    const overlay = document.getElementById('tp-modal-overlay');
    const modalContent = document.getElementById('tp-modal-content');
    const rpgDock = document.getElementById('tp-rpg-dialogue');
    let nearestAction = null;
    let activeFilter = 'all';

    function isModalOpen() { return !!(overlay && overlay.style.display === 'flex'); }
    function isDialogueOpen() { return !!(rpgDock && rpgDock.classList.contains('open')); }

    function closeModal() {
      if (overlay) overlay.style.display = 'none';
      setUI(isDialogueOpen());
    }
    function closeDialogue() {
      if (rpgDock) rpgDock.classList.remove('open');
      setUI(isModalOpen());
    }

    function checkProximity(activeRideId) {
      const btn = document.getElementById('tp-action-prompt');
      if (activeRideId || isModalOpen() || isDialogueOpen()) {
        if (btn) btn.style.display = 'none';
        nearestAction = null;
        return null;
      }
      const pp = player.pos;
      let best = null, bestD = 13.5;

      // 1. Check All 12 Rideable Attractions first!
      Object.values(props.rides).forEach((r) => {
        const d = Math.hypot(pp.x - r.boardPos.x, pp.z - r.boardPos.z);
        if (d < bestD) { bestD = d; best = { type: 'ride', ride: r, label: `🎢 [按 E 或点击] 乘坐「${r.name}」` }; }
      });

      // 2. Check Interactive Magic Props & Placed Imagineer Creations
      (props.interactables || []).forEach((it) => {
        const d = Math.hypot(pp.x - it.x, pp.z - it.z);
        if (d < 8.8 && d < bestD) { bestD = d; best = { type: 'prop', prop: it, label: `✨ [按 E 或点击] 触发「${it.name}」` }; }
      });

      // 3. Check Cast Member Hosts
      world.LANDS.forEach((land) => {
        const d = Math.hypot(pp.x - (land.x + 3.5), pp.z - (land.z + 6.5));
        if (d < 7.8 && d < bestD) { bestD = d; best = { type: 'talk', land, label: `💬 [按 E 或点击] 与「${land.host.split('·')[0].trim()}」对话` }; }
      });

      nearestAction = best;
      if (btn) {
        if (best) {
          btn.style.display = 'flex';
          btn.querySelector('.tp-ap-title').textContent = best.label;
        } else {
          btn.style.display = 'none';
        }
      }
      return best;
    }

    function activateNearest() {
      if (!nearestAction) return false;
      if (nearestAction.type === 'ride') {
        playRideAudio(nearestAction.ride.id);
        boardRide(nearestAction.ride.id);
        return true;
      }
      if (nearestAction.type === 'prop') {
        playFanfare();
        toast(nearestAction.prop.msg);
        return true;
      }
      if (nearestAction.type === 'talk') {
        openDialogue(nearestAction.land);
        return true;
      }
      return false;
    }

    /* The guide: three quiet tabs — 乘坐 (every ride the park has registered, read live from props.rides so a new ride
       shows up on its own, newest first), 建筑 (the walk-in buildings and workshops, opened through their own HUD keys)
       and 园区 (the lands, one short line each). Drawn in the park's Zelda-style cream-on-dark look. */
    const RIDE_GROUPS = [
      ['new', '新开放', ['center_earth', 'pirates_treasure', 'leagues', 'rise_resistance', 'flight_of_passage', 'cosmic_rewind', 'falcon_flight']],
      ['dl', '迪士尼乐园', ['railroad_tour', 'monorail', 'pirates_ride', 'space_mountain', 'big_thunder', 'matterhorn_bobsleds', 'small_world_boat', 'river_boat', 'carousel', 'starjet']],
      ['paris', '巴黎迪士尼', ['paris_space_mountain', 'paris_big_thunder', 'paris_indiana', 'paris_railroad']],
      ['resort', '度假区', ['test_track', 'friendship_boat', 'skyliner_ride', 'tower_of_terror', 'slinky_dog', 'everest_ride', 'safari_ride']]
    ];
    const RIDE_ICON = { center_earth: '🌋', pirates_treasure: '🏴‍☠️', leagues: '🐙', rise_resistance: '⭐', flight_of_passage: '🪽', cosmic_rewind: '🌌', falcon_flight: '🛸',
      railroad_tour: '🚂', monorail: '🚝', pirates_ride: '🏴‍☠️', space_mountain: '🚀', big_thunder: '⛏️', matterhorn_bobsleds: '🏔️', small_world_boat: '⛵', river_boat: '🌴', carousel: '🎠', starjet: '🪐',
      paris_space_mountain: '🚀', paris_big_thunder: '⛏️', paris_indiana: '🗿', paris_railroad: '🚂',
      test_track: '🏎️', friendship_boat: '🚤', skyliner_ride: '🚡', tower_of_terror: '🏨', slinky_dog: '🐕', everest_ride: '🏔️', safari_ride: '🦒' };
    const NEW_RIDES = { center_earth: 1, pirates_treasure: 1, leagues: 1, rise_resistance: 1, flight_of_passage: 1 };
    /* [HUD key id, icon, name, line] — shown only when that key exists in this build of the park */
    const BUILDINGS = [
      ['mn-bld-btn', '🏢', '造梦大楼', '幻想工程师的学徒课，五堂课，自己的作品'],
      ['ror-btn', '⭐', '抵抗组织崛起 · 候场大楼', '走进排队区，从第一幕开始'],
      ['fop-btn', '🪽', '飞越潘多拉 · 候场', '连接阿凡达，88 秒的飞行'],
      ['sw-go-btn', '⚔️', '萨维光剑工坊', '四条道路，亲手组一把光剑'],
      ['sw-go-btn2', '🤖', '机器人工坊', 'Droid Depot，拼一台自己的机器人'],
      ['mn-pav-btn', '🏛️', '幻想工程展馆', '乐园设计的展厅'],
      ['mn-pb-btn', '🛠', '造乐园', '自己搭一座乐园'],
      ['mn-build-btn', '✨', '放模型', '在乐园里摆模型、建 IP 世界']
    ];
    let activeTab = 'ride';
    const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const shortName = (n) => String(n || '').split(/[（(]/)[0].split(' · ')[0].trim();
    const sub = (n) => { const m = String(n || '').match(/[（(]([^）)]+)[）)]/); return m ? m[1] : (String(n).split(' · ')[1] || ''); };

    function guideCss() {
      if (document.getElementById('tpg-css')) return;
      const C = '#f3ecd6', st = document.createElement('style'); st.id = 'tpg-css';
      st.textContent =
        '#tp-modal-overlay.tpg{z-index:98;background:rgba(4,6,8,.62);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}' +
        '#tp-modal-content.tpg{width:min(860px,94vw);max-height:84dvh;padding:18px 20px 20px;background:rgba(8,10,12,.9);border:1px solid rgba(243,236,214,.32);border-radius:16px;box-shadow:0 18px 60px rgba(0,0,0,.6);overflow-x:hidden;color:' + C + ';font-family:"Avenir Next","Helvetica Neue","PingFang SC",sans-serif}' +
        '.tpg-head{display:flex;align-items:flex-start;gap:12px}.tpg-head h2{margin:0;font-size:19px;font-weight:600;letter-spacing:.1em;color:' + C + '}.tpg-head p{margin:3px 0 0;font-size:12px;opacity:.6;letter-spacing:.04em}.tpg-head .sp{flex:1}' +
        '.tpg-x,.tpg-key{border:1px solid rgba(243,236,214,.5);background:rgba(243,236,214,.04);color:' + C + ';border-radius:999px;font:500 12.5px "Avenir Next","PingFang SC",sans-serif;cursor:pointer;padding:6px 13px;white-space:nowrap}.tpg-x{width:32px;height:32px;padding:0;font-size:14px}' +
        '.tpg-x:hover,.tpg-key:hover{border-color:' + C + ';background:rgba(243,236,214,.12)}' +
        '.tpg-tabs{display:flex;gap:30px;margin:14px 0 4px;border-bottom:1px solid rgba(243,236,214,.18)}.tpg-tabs span{cursor:pointer;opacity:.5;padding:6px 2px 9px;font-size:14.5px;letter-spacing:.12em}.tpg-tabs span.on{opacity:1;border-bottom:2px solid ' + C + '}.tpg-tabs span:hover{opacity:.85}' +
        '.tpg-sec{margin:16px 0 7px;font-size:11.5px;letter-spacing:.2em;opacity:.55}' +
        '.tpg-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(232px,1fr));gap:4px 10px}' +
        '.tpg-row{position:relative;display:flex;align-items:center;gap:11px;padding:9px 12px;border:1px solid transparent;border-radius:8px;cursor:pointer;text-align:left;background:none;color:' + C + ';font:inherit;width:100%;min-width:0;overflow:hidden}' +
        '.tpg-row:hover{border-color:rgba(243,236,214,.7);background:rgba(243,236,214,.08)}.tpg-row:hover:before{content:"▶";position:absolute;left:-12px;color:#e23a2e;font-size:10px}' +
        '.tpg-row .ic{font-size:19px;width:24px;text-align:center;flex:none}.tpg-row .tx{min-width:0;flex:1}.tpg-row b{display:block;font-weight:500;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tpg-row small{display:block;font-size:11.5px;opacity:.55;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
        '.tpg-new{flex:none;font-size:10.5px;letter-spacing:.1em;border:1px solid #e9c46a;color:#e9c46a;border-radius:4px;padding:0 5px}' +
        '.tpg-chips{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.tpg-chips .tpg-key.on{background:rgba(243,236,214,.16);border-color:' + C + '}' +
        '.tpg-lands{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;margin-top:12px}' +
        '.tpg-land{border:1px solid rgba(243,236,214,.18);border-radius:10px;padding:11px 13px;display:flex;flex-direction:column;gap:5px}.tpg-land b{font-weight:500;font-size:14px}.tpg-land small{font-size:11px;opacity:.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
        '.tpg-land p{margin:0;font-size:12px;line-height:1.55;opacity:.72;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.tpg-land .r{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}.tpg-land .tpg-key{padding:4px 11px;font-size:12px}' +
        '@media (max-width:560px){#tp-modal-content.tpg{padding:14px}.tpg-tabs{gap:20px}.tpg-list{grid-template-columns:repeat(2,minmax(0,1fr))}.tpg-row{padding:8px 6px;gap:7px}.tpg-row small{display:none}}';
      document.head.appendChild(st);
    }

    function renderGuide() {
      if (!modalContent) return;
      guideCss();
      modalContent.classList.add('tpg'); if (overlay) overlay.classList.add('tpg');
      const R = (props && props.rides) || {};
      const seen = {}, groups = RIDE_GROUPS.map(([k, label, ids]) => [label, ids.filter((id) => R[id] && !seen[id] && (seen[id] = 1))]);
      const rest = Object.keys(R).filter((id) => !seen[id] && R[id].name && id !== 'sw_workshop');
      if (rest.length) groups[0][1] = rest.concat(groups[0][1]);   /* a ride added later lands under 新开放 */
      const nRides = groups.reduce((n, g) => n + g[1].length, 0);
      const builds = BUILDINGS.filter((b) => document.getElementById(b[0]));
      const castle = world.LANDS.find((l) => l.tpInside);
      const row = (attr, ic, name, line, isNew) => `<button class="tpg-row" ${attr}><span class="ic">${ic}</span><span class="tx"><b>${esc(name)}</b>${line ? `<small>${esc(line)}</small>` : ''}</span>${isNew ? '<span class="tpg-new">新</span>' : ''}</button>`;
      let body = '';
      if (activeTab === 'ride') {
        body = groups.filter((g) => g[1].length).map(([label, ids]) => `<div class="tpg-sec">${label}</div><div class="tpg-list">${
          ids.map((id) => row(`data-ride="${id}"`, RIDE_ICON[id] || '🎢', shortName(R[id].name), sub(R[id].name), NEW_RIDES[id] || rest.indexOf(id) >= 0)).join('')}</div>`).join('');
      } else if (activeTab === 'build') {
        body = `<div class="tpg-sec">可以走进去的地方</div><div class="tpg-list">${
          builds.map((b) => row(`data-hud="${b[0]}"`, b[1], b[2], b[3], b[0] === 'ror-btn' || b[0] === 'fop-btn')).join('') +
          (castle ? row(`data-in="${castle.id}"`, '🏰', '城堡马赛克长廊', '步入童话城堡') : '')}</div>`;
      } else {
        const filtered = world.LANDS.filter((l) => activeFilter === 'all' || (activeFilter === 'disneyland' ? (l.park !== 'resort' && l.park !== 'paris') : l.park === activeFilter));
        body = `<div class="tpg-chips">${[['all', '全部'], ['disneyland', '迪士尼乐园'], ['paris', '巴黎'], ['resort', '度假区']].map(([k, lbl]) =>
          `<button class="tpg-key ${activeFilter === k ? 'on' : ''}" data-gfilter="${k}">${lbl}</button>`).join('')}</div>
          <div class="tpg-lands">${filtered.map((l) => `<div class="tpg-land"><b>${esc(shortName(l.name))}</b><small>${esc(l.en)}</small><p>${esc(String(l.highlights[0] || '').replace(/^【[^】]*】/, ''))}</p>
            <div class="r"><button class="tpg-key" data-tp="${l.id}">传送</button>${l.rideId ? `<button class="tpg-key" data-ride="${l.rideId}">乘坐</button>` : ''}<button class="tpg-key" data-talk="${l.id}">向导</button></div></div>`).join('')}</div>`;
      }
      modalContent.innerHTML = `
        <div class="tpg-head"><div><h2>乐园导览</h2><p>${nRides} 个可乘坐设施 · ${builds.length + (castle ? 1 : 0)} 处可进入的建筑 · ${world.LANDS.length} 个园区</p></div><span class="sp"></span>
          <button class="tpg-key" id="tp-go-fireworks">🎆 烟花</button><button class="tpg-x" id="tp-close-guide" aria-label="关闭">✕</button></div>
        <div class="tpg-tabs">${[['ride', '乘坐'], ['build', '建筑'], ['land', '园区']].map(([k, l]) => `<span data-gtab="${k}" class="${activeTab === k ? 'on' : ''}">${l}</span>`).join('')}</div>
        ${body}`;
      modalContent.querySelector('#tp-close-guide').onclick = closeModal;
      modalContent.querySelector('#tp-go-fireworks').onclick = () => { closeModal(); launchFireworks(); };
      modalContent.querySelectorAll('[data-gtab]').forEach((b) => { b.onclick = () => { activeTab = b.dataset.gtab; renderGuide(); modalContent.scrollTop = 0; }; });
      modalContent.querySelectorAll('[data-gfilter]').forEach((b) => { b.onclick = () => { activeFilter = b.dataset.gfilter; renderGuide(); }; });
      modalContent.querySelectorAll('[data-hud]').forEach((b) => {
        b.onclick = () => { const k = document.getElementById(b.dataset.hud); closeModal(); if (k) k.click(); };
      });
      modalContent.querySelectorAll('[data-tp]').forEach((b) => {
        b.onclick = () => {
          const l = world.LANDS.find((x) => x.id === b.dataset.tp);
          if (l) { closeModal(); teleport(l.tp); toast(`🎡 已抵达「${l.name}」`); }
        };
      });
      modalContent.querySelectorAll('[data-in]').forEach((b) => {
        b.onclick = () => {
          const l = world.LANDS.find((x) => x.id === b.dataset.in);
          if (l && l.tpInside) { closeModal(); teleport(l.tpInside); toast('🏰 已步入童话城堡皇家马赛克长廊'); }
        };
      });
      modalContent.querySelectorAll('[data-ride]').forEach((b) => {
        b.onclick = () => { closeModal(); playRideAudio(b.dataset.ride); boardRide(b.dataset.ride); };
      });
      modalContent.querySelectorAll('[data-talk]').forEach((b) => {
        b.onclick = () => {
          const l = world.LANDS.find((x) => x.id === b.dataset.talk);
          if (l) { closeModal(); openDialogue(l); }
        };
      });
    }

    function openGuideModal() {
      exitLock(); closeDialogue();
      if (!overlay || !modalContent) return;
      renderGuide();
      overlay.style.display = 'flex';
      setUI(true);
    }

    function openDialogue(land) {
      exitLock();
      if (!rpgDock) return;
      document.getElementById('tp-rpg-name').textContent = land.host;
      document.getElementById('tp-rpg-sub').textContent = `${land.badge} · ${land.name}`;
      document.getElementById('tp-rpg-text').textContent = `“${land.quote}”`;
      const actRow = document.getElementById('tp-rpg-acts');
      actRow.innerHTML = '';
      if (land.rideId) {
        const rb = document.createElement('button');
        rb.className = 'tp-btn gold'; rb.textContent = '🎢 立即乘坐该区游乐设施';
        rb.onclick = () => { closeDialogue(); playRideAudio(land.rideId); boardRide(land.rideId); };
        actRow.appendChild(rb);
      }
      const fb = document.createElement('button');
      fb.className = 'tp-btn pink'; fb.textContent = '🎆 开启城堡烟花秀';
      fb.onclick = () => { closeDialogue(); launchFireworks(); };
      actRow.appendChild(fb);
      const cb = document.createElement('button');
      cb.className = 'tp-btn'; cb.textContent = '✕ 关闭';
      cb.onclick = closeDialogue;
      actRow.appendChild(cb);
      rpgDock.classList.add('open');
      setUI(true);
    }

    const promptBtn = document.getElementById('tp-action-prompt');
    if (promptBtn) promptBtn.onclick = () => activateNearest();
    if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

    return {
      checkProximity, activateNearest, openGuideModal, closeModal, closeDialogue,
      isModalOpen, isDialogueOpen, playFanfare, playFireworkBoom, playRideAudio
    };
  }

  root.TPPortals = { attach };
})(window);
