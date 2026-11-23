/* Minest Imagineering Theme Park — Park Guide Map, 3 Rideable Attractions HUD, Cast Member Dialogue & Web Audio Soundscape.
 * Exposes TPPortals = { attach(ctx) -> { checkProximity(), activateNearest(), openGuideModal(), closeModal(), closeDialogue(), isModalOpen(), isDialogueOpen(), playFanfare(), playFireworkBoom(), playRideAudio(id) } }. */
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
    if (rideId === 'carousel') {
      [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880.0].forEach((f, i) => playNote(f, 0.45, 'triangle', 0.10, i * 0.22));
    } else if (rideId === 'river_boat') {
      playNote(196, 0.8, 'sawtooth', 0.07, 0);
      playNote(146.8, 0.9, 'sawtooth', 0.07, 0.25);
    } else if (rideId === 'starjet') {
      [330, 440, 587.33, 880, 1174.6].forEach((f, i) => playNote(f, 0.5, 'sine', 0.09, i * 0.09));
    } else if (rideId === 'small_world_boat') {
      // Bright joyful music-box chimes for "it's a small world"!
      [523.25, 587.33, 659.25, 1046.5, 880.0, 987.77, 880.0, 783.99].forEach((f, i) => playNote(f, 0.42, 'sine', 0.09, i * 0.16));
    } else if (rideId === 'falcon_flight') {
      // Heroic Star Wars brass-inspired fanfare + hyperdrive swoosh!
      [293.66, 440.0, 392.0, 349.23, 329.63, 587.33, 440.0].forEach((f, i) => playNote(f, 0.48, 'sawtooth', 0.08, i * 0.14));
    }
  }

  function attach(ctx) {
    const { world, props, player, teleport, toast, setTime, exitLock, setUI, boardRide, launchFireworks } = ctx;
    const overlay = document.getElementById('tp-modal-overlay');
    const modalContent = document.getElementById('tp-modal-content');
    const rpgDock = document.getElementById('tp-rpg-dialogue');
    let nearestAction = null;

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
      let best = null, bestD = 12.5;

      // 1. Check 3 Rideable Attractions first!
      Object.values(props.rides).forEach((r) => {
        const d = Math.hypot(pp.x - r.boardPos.x, pp.z - r.boardPos.z);
        if (d < bestD) { bestD = d; best = { type: 'ride', ride: r, label: `🎢 [按 E 或点击] 乘坐「${r.name}」` }; }
      });

      // 2. Check Interactive Magic Props
      (props.interactables || []).forEach((it) => {
        const d = Math.hypot(pp.x - it.x, pp.z - it.z);
        if (d < 8.5 && d < bestD) { bestD = d; best = { type: 'prop', prop: it, label: `✨ [按 E 或点击] 触发「${it.name}」` }; }
      });

      // 3. Check Cast Member Hosts
      world.LANDS.forEach((land) => {
        const d = Math.hypot(pp.x - (land.x + 3.5), pp.z - (land.z + 6.5));
        if (d < 7.5 && d < bestD) { bestD = d; best = { type: 'talk', land, label: `💬 [按 E 或点击] 与「${land.host.split('·')[0].trim()}」对话` }; }
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

    function openGuideModal() {
      exitLock(); closeDialogue();
      if (!overlay || !modalContent) return;
      modalContent.innerHTML = `
        <div class="tp-m-head">
          <div>
            <h2>🎡 奥兰多华特迪士尼世界度假区 · Walt Disney World Resort (2× 扩建版)</h2>
            <p class="tp-m-sub">四大奥兰多乐园全收录（神奇王国 · 艾波卡特 EPCOT · 好莱坞影城 · 动物王国 & 阿凡达潘多拉 · 星球大战）· 12 大园区 · 7 大可玩设施</p>
          </div>
          <button class="tp-m-close" id="tp-close-guide">✕</button>
        </div>
        <div class="tp-quick-bar">
          <button class="tp-btn gold" id="tp-go-falcon">🛸 驾驶千年隼号（星战）</button>
          <button class="tp-btn cyan" id="tp-go-skyliner">🚠 高空缆车（奥兰多）</button>
          <button class="tp-btn gold" id="tp-go-everest">🏔️ 珠峰过山车（动物王国）</button>
          <button class="tp-btn cyan" id="tp-go-smallworld">⛵ 小小世界游船（林肯）</button>
          <button class="tp-btn gold" id="tp-go-carousel">🎠 旋转木马</button>
          <button class="tp-btn gold" id="tp-go-boat">🌴 丛林探险船</button>
          <button class="tp-btn gold" id="tp-go-starjet">🚀 未来飞行器</button>
          <button class="tp-btn pink" id="tp-go-fireworks">🎆 城堡烟花秀</button>
        </div>
        <div class="tp-grid">
          ${world.LANDS.map((l) => `
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
                ${l.tpInside ? `<button class="tp-btn cyan" data-in="${l.id}">🏰 步入大厅</button>` : ''}
                <button class="tp-btn" data-talk="${l.id}">💬 向导</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      modalContent.querySelector('#tp-close-guide').onclick = closeModal;
      modalContent.querySelector('#tp-go-falcon').onclick = () => { closeModal(); playRideAudio('falcon_flight'); boardRide('falcon_flight'); };
      modalContent.querySelector('#tp-go-skyliner').onclick = () => { closeModal(); playFanfare(); boardRide('skyliner_ride'); };
      modalContent.querySelector('#tp-go-everest').onclick = () => { closeModal(); playRideAudio('starjet'); boardRide('everest_ride'); };
      modalContent.querySelector('#tp-go-smallworld').onclick = () => { closeModal(); playRideAudio('small_world_boat'); boardRide('small_world_boat'); };
      modalContent.querySelector('#tp-go-carousel').onclick = () => { closeModal(); playRideAudio('carousel'); boardRide('carousel'); };
      modalContent.querySelector('#tp-go-boat').onclick = () => { closeModal(); playRideAudio('river_boat'); boardRide('river_boat'); };
      modalContent.querySelector('#tp-go-starjet').onclick = () => { closeModal(); playRideAudio('starjet'); boardRide('starjet'); };
      modalContent.querySelector('#tp-go-fireworks').onclick = () => { closeModal(); launchFireworks(); };
      modalContent.querySelectorAll('[data-tp]').forEach((b) => {
        b.onclick = () => {
          const l = world.LANDS.find((x) => x.id === b.dataset.tp);
          if (l) { closeModal(); teleport(l.tp); toast(`🎡 已抵达「${l.name}」`); }
        };
      });
      modalContent.querySelectorAll('[data-in]').forEach((b) => {
        b.onclick = () => {
          const l = world.LANDS.find((x) => x.id === b.dataset.in);
          if (l && l.tpInside) { closeModal(); teleport(l.tpInside); toast(`🏰 已步入星光童话城堡皇家大厅`); }
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
