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

    function renderGuide() {
      if (!modalContent) return;
      const filtered = world.LANDS.filter((l) => {
        if (activeFilter === 'disneyland') return l.park !== 'resort' && l.park !== 'paris';
        if (activeFilter === 'paris') return l.park === 'paris';
        if (activeFilter === 'rides') return !!l.rideId;
        if (activeFilter === 'resort') return l.park === 'resort';
        return true;
      });
      const quickRides = [
        ['paris_space_mountain', '🚀 巴黎太空山 · 巨炮弹射', 'cyan'],
        ['paris_big_thunder', '⛏️ 巴黎巨雷山 · 河心岛矿车', 'gold'],
        ['paris_indiana', '🗿 危险神殿 360° 回环', 'gold'],
        ['paris_railroad', '🚂 巴黎迪士尼铁路', 'cyan'],
        ['railroad_tour', '🚂 蒸汽火车 4 站环游', 'gold'],
        ['pirates_ride', '🏴‍☠️ 加勒比海盗游船', 'cyan'],
        ['space_mountain', '🌌 太空山深空过山车', 'cyan'],
        ['big_thunder', '🏜️ 巨雷山失控矿车', 'gold'],
        ['matterhorn_bobsleds', '🏔️ 马特宏峰雪橇', 'cyan'],
        ['small_world_boat', '⛵ 小小世界游船', 'gold'],
        ['falcon_flight', '🛸 驾驶千年隼号', 'gold'],
        ['river_boat', '🌴 丛林探险船', 'cyan'],
        ['carousel', '🎠 皇家旋转木马', 'gold'],
        ['starjet', '🚀 星际轨道飞行器', 'cyan']
      ];
      modalContent.innerHTML = `
        <div class="tp-m-head">
          <div>
            <h2>🏰 奇想迪士尼乐园 · 1:1 真实全境导览图 (Disneyland 1:1 Master Edition)</h2>
            <p class="tp-m-sub">224m 完整美国小镇大街 · 小镇广场（市政厅 & 华特公寓永恒台灯）· 新奥尔良广场 & 加勒比海盗 · 米奇卡通城 · 汤姆索亚岛 · 16 大分区 · 12 大可乘坐设施</p>
          </div>
          <button class="tp-m-close" id="tp-close-guide">✕</button>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
          ${[
            ['all', `🗺️ 全部园区 (${world.LANDS.length})`],
            ['disneyland', '🏰 1:1 迪士尼主园 (13 大经典分区)'],
            ['paris', '🇫🇷 巴黎迪士尼乐园 (5 大主题区)'],
            ['rides', '🎢 可乘坐游乐设施专区'],
            ['resort', '🌐 度假区扩建园 (EPCOT / 影城 / 潘多拉)']
          ].map(([k, lbl]) => `<button class="tp-btn ${activeFilter === k ? 'pink' : ''}" data-gfilter="${k}">${lbl}</button>`).join('')}
          <button class="tp-btn pink" id="tp-go-fireworks" style="margin-left:auto">🎆 开启城堡夜空烟花秀</button>
        </div>
        <div class="tp-quick-bar">
          ${quickRides.map(([id, lbl, cls]) => `<button class="tp-btn ${cls}" data-qride="${id}">${lbl}</button>`).join('')}
        </div>
        <div class="tp-grid">
          ${filtered.map((l) => `
            <div class="tp-card">
              <div class="tp-card-top">
                <span class="tp-badge" style="border-color:${l.color};color:${l.color}">${l.badge}</span>
                <span class="tp-en">${l.en}</span>
              </div>
              <div class="tp-card-name">${l.name}</div>
              <ul class="tp-hl">${l.highlights.map((h) => `<li>${h}</li>`).join('')}</ul>
              <div class="tp-card-btns">
                <button class="tp-btn gold" data-tp="${l.id}">🚶 传送抵达</button>
                ${l.rideId ? `<button class="tp-btn cyan" data-ride="${l.rideId}">🎢 直接乘坐</button>` : ''}
                ${l.id === 'tomorrowland' ? `<button class="tp-btn" data-ride="starjet">🚀 轨道飞行器</button>` : ''}
                ${l.tpInside ? `<button class="tp-btn cyan" data-in="${l.id}">🏰 步入长廊</button>` : ''}
                <button class="tp-btn" data-talk="${l.id}">💬 向导</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      modalContent.querySelector('#tp-close-guide').onclick = closeModal;
      modalContent.querySelector('#tp-go-fireworks').onclick = () => { closeModal(); launchFireworks(); };
      modalContent.querySelectorAll('[data-gfilter]').forEach((b) => {
        b.onclick = () => { activeFilter = b.dataset.gfilter; renderGuide(); };
      });
      modalContent.querySelectorAll('[data-qride]').forEach((b) => {
        b.onclick = () => { closeModal(); playRideAudio(b.dataset.qride); boardRide(b.dataset.qride); };
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
