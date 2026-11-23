/* Cathedrals' Island — Top 20 Cathedrals Compass (15 Catholic + 5 Modern),
 * Face-to-Face Master Architect RPG Dialogue Dock, Architectural Encyclopedia & Web Audio Pipe Organ / Bell Engine.
 * Exposes CIPortals = { attach(ctx) -> { checkProximity(), activateNearest(), openCompassModal(), openDialogue(id), closeDialogue(), closeModal(), isModalOpen(), isDialogueOpen() } }. */
(function (root) {
  'use strict';

  const VISITED_KEY = 'ci_cathedrals_visited_v1';

  // Web Audio Cathedral Pipe Organ & Sacred Bell Synthesizer
  let audioCtx = null;
  function getAudio() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
  }

  // Multi-rank Cathedral Pipe Organ single note (16' + 8' + 4' + 2-2/3' ranks)
  function playOrganNote(freq, dur) {
    const ctx = getAudio(); if (!ctx) return;
    const now = ctx.currentTime, d = dur || 1.35;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.001, now);
    master.gain.exponentialRampToValueAtTime(0.14, now + 0.055);
    master.gain.setValueAtTime(0.12, now + Math.max(0.08, d * 0.65));
    master.gain.exponentialRampToValueAtTime(0.0008, now + d);
    master.connect(ctx.destination);
    const ranks = [
      { mult: 0.5, type: 'sine', amp: 0.48 },
      { mult: 1.0, type: 'triangle', amp: 0.72 },
      { mult: 2.0, type: 'sine', amp: 0.34 },
      { mult: 3.0, type: 'sine', amp: 0.14 }
    ];
    ranks.forEach((r) => {
      const osc = ctx.createOscillator();
      osc.type = r.type;
      osc.frequency.setValueAtTime(freq * r.mult, now);
      const g = ctx.createGain();
      g.gain.value = r.amp;
      osc.connect(g); g.connect(master);
      osc.start(now); osc.stop(now + d + 0.05);
    });
  }

  function playPipeOrganChord(freqs) {
    const ctx = getAudio(); if (!ctx) return;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.001, now);
    master.gain.exponentialRampToValueAtTime(0.16, now + 0.35);
    master.gain.exponentialRampToValueAtTime(0.001, now + 3.4);
    master.connect(ctx.destination);
    (freqs || [130.81, 164.81, 196.0, 261.63]).forEach((f, i) => {
      const osc1 = ctx.createOscillator(); osc1.type = 'triangle'; osc1.frequency.setValueAtTime(f, now);
      const osc2 = ctx.createOscillator(); osc2.type = 'sine'; osc2.frequency.setValueAtTime(f * 2, now);
      const osc3 = ctx.createOscillator(); osc3.type = 'sine'; osc3.frequency.setValueAtTime(f * 0.5, now);
      const g2 = ctx.createGain(); g2.gain.value = 0.25;
      const g3 = ctx.createGain(); g3.gain.value = 0.35;
      osc1.connect(master); osc2.connect(g2); g2.connect(master); osc3.connect(g3); g3.connect(master);
      osc1.start(now + i * 0.05); osc2.start(now + i * 0.05); osc3.start(now + i * 0.05);
      osc1.stop(now + 3.5); osc2.stop(now + 3.5); osc3.stop(now + 3.5);
    });
  }

  function playCathedralBell(baseFreq) {
    const ctx = getAudio(); if (!ctx) return;
    const now = ctx.currentTime;
    const f0 = baseFreq || 220;
    [1, 2.0, 2.4, 3.0, 4.2].forEach((ratio, idx) => {
      const osc = ctx.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(f0 * ratio, now);
      const g = ctx.createGain();
      const amp = 0.14 / (idx + 1);
      g.gain.setValueAtTime(amp, now);
      g.gain.exponentialRampToValueAtTime(0.0008, now + 3.2 - idx * 0.35);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(now); osc.stop(now + 3.3);
    });
  }

  const ORGAN_WHITE = [
    { note: 'C4', hz: 261.63 }, { note: 'D4', hz: 293.66 }, { note: 'E4', hz: 329.63 },
    { note: 'F4', hz: 349.23 }, { note: 'G4', hz: 392.00 }, { note: 'A4', hz: 440.00 },
    { note: 'B4', hz: 493.88 }, { note: 'C5', hz: 523.25 }
  ];
  const ORGAN_BLACK = [
    { note: 'C#4', hz: 277.18, left: '8.8%' }, { note: 'D#4', hz: 311.13, left: '21.3%' },
    { note: 'F#4', hz: 369.99, left: '46.3%' }, { note: 'G#4', hz: 415.30, left: '58.8%' },
    { note: 'A#4', hz: 466.16, left: '71.3%' }
  ];
  const SACRED_SONGS = {
    toccata: [
      { note: 'A4', hz: 440.00, t: 0, d: 0.18 }, { note: 'G4', hz: 392.00, t: 160, d: 0.18 },
      { note: 'A4', hz: 440.00, t: 320, d: 0.72 }, { note: 'G4', hz: 392.00, t: 920, d: 0.22 },
      { note: 'F4', hz: 349.23, t: 1120, d: 0.22 }, { note: 'E4', hz: 329.63, t: 1320, d: 0.22 },
      { note: 'D4', hz: 293.66, t: 1520, d: 0.28 }, { note: 'C#4', hz: 277.18, t: 1780, d: 0.45 },
      { note: 'D4', hz: 293.66, t: 2220, d: 1.65 }
    ],
    ave: [
      { note: 'C4', hz: 261.63, t: 0, d: 0.65 }, { note: 'E4', hz: 329.63, t: 420, d: 0.65 },
      { note: 'G4', hz: 392.00, t: 840, d: 0.85 }, { note: 'C5', hz: 523.25, t: 1320, d: 0.95 },
      { note: 'B4', hz: 493.88, t: 1850, d: 0.65 }, { note: 'A4', hz: 440.00, t: 2300, d: 0.85 },
      { note: 'G4', hz: 392.00, t: 2800, d: 1.55 }
    ],
    carillon: [
      { note: 'C5', hz: 523.25, t: 0, bell: true }, { note: 'G4', hz: 392.00, t: 360, bell: true },
      { note: 'A4', hz: 440.00, t: 720, bell: true }, { note: 'E4', hz: 329.63, t: 1080, bell: true },
      { note: 'F4', hz: 349.23, t: 1520, bell: true }, { note: 'C4', hz: 261.63, t: 1920, bell: true }
    ]
  };
  let songTimers = [];
  function clearSongTimers() { songTimers.forEach((id) => clearTimeout(id)); songTimers = []; }

  function buildOrganWidgetHtml() {
    return `
      <div class="ci-organ-box">
        <div class="ci-organ-top">
          <b>🎹 圣殿大管风琴演奏台 · 16' + 8' + 4' 三音栓合成</b>
          <span class="ci-organ-note" id="ci-organ-readout">点击琴键或演奏圣曲</span>
        </div>
        <div class="ci-kbd" id="ci-organ-kbd">
          ${ORGAN_WHITE.map((k) => `<button type="button" class="ci-key-w" data-note="${k.note}" data-hz="${k.hz}">${k.note}</button>`).join('')}
          ${ORGAN_BLACK.map((k) => `<button type="button" class="ci-key-b" style="left:${k.left}" data-note="${k.note}" data-hz="${k.hz}">${k.note.replace('4', '')}</button>`).join('')}
        </div>
        <div class="ci-organ-songs">
          <button type="button" class="ci-btn gold" data-song="toccata">🎼 巴赫 D 小调托卡塔</button>
          <button type="button" class="ci-btn" data-song="ave">🕊️ 圣母颂圣咏</button>
          <button type="button" class="ci-btn" data-song="carillon">🔔 圣殿钟楼齐鸣</button>
        </div>
      </div>
    `;
  }

  function wireOrganWidget(container, toast) {
    const kbd = container.querySelector('#ci-organ-kbd');
    const readout = container.querySelector('#ci-organ-readout');
    if (!kbd) return;
    function flashKey(note, ms) {
      const btn = kbd.querySelector(`[data-note="${note}"]`);
      if (btn) {
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), ms || 320);
      }
      if (readout) readout.textContent = `♪ 正在共鸣：${note}`;
    }
    kbd.querySelectorAll('button[data-hz]').forEach((b) => {
      b.onclick = () => {
        const hz = parseFloat(b.dataset.hz);
        playOrganNote(hz, 1.45);
        flashKey(b.dataset.note, 380);
      };
    });
    container.querySelectorAll('[data-song]').forEach((b) => {
      b.onclick = () => {
        clearSongTimers();
        const key = b.dataset.song;
        const seq = SACRED_SONGS[key] || [];
        const names = { toccata: '巴赫 D 小调托卡塔', ave: '圣母颂圣咏', carillon: '圣殿钟楼齐鸣' };
        if (toast) toast(`🎹 正在自动演奏《${names[key]}》`);
        seq.forEach((step) => {
          const tid = setTimeout(() => {
            if (step.bell) playCathedralBell(step.hz);
            else playOrganNote(step.hz, step.d || 0.7);
            flashKey(step.note, Math.max(220, (step.d || 0.5) * 650));
          }, step.t);
          songTimers.push(tid);
        });
      };
    });
  }

  function attach(ctx) {
    const { world, player, teleport, toast, setUI, exitLock, setTime } = ctx;
    let visited = {};
    try { visited = JSON.parse(localStorage.getItem(VISITED_KEY) || '{}') || {}; } catch (e) {}

    function markVisited(id) {
      visited[id] = Date.now();
      try { localStorage.setItem(VISITED_KEY, JSON.stringify(visited)); } catch (e) {}
      const el = document.getElementById('ci-visited-count');
      if (el) el.textContent = `${Object.keys(visited).length} / 20`;
    }

    let nearestCat = null;
    function checkProximity() {
      const pp = player.pos;
      let best = null, bestD = 7.5;
      for (const c of world.CATHEDRALS) {
        const d = Math.hypot(pp.x - (c.x + 0.5), pp.z - (c.z + 2.5));
        const dFront = Math.hypot(pp.x - (c.x + 0.5), pp.z - (c.z + Math.floor(c.d / 2) + 3.5));
        const dist = Math.min(d, dFront);
        if (dist < bestD && Math.abs(pp.y - c.gy) < 3.5) {
          bestD = dist; best = c;
        }
      }
      nearestCat = best;
      const btn = document.getElementById('ci-portal-prompt');
      if (btn) {
        if (best && !isModalOpen() && !isDialogueOpen()) {
          btn.style.display = 'flex';
          btn.querySelector('.ci-pp-title').textContent = `💬 [按 E 或点击] 与「${best.architect.split('·')[0].trim()}」探讨《${best.name}》`;
        } else {
          btn.style.display = 'none';
        }
      }
      return best;
    }

    const overlay = document.getElementById('ci-modal-overlay');
    const modalContent = document.getElementById('ci-modal-content');
    const rpgDock = document.getElementById('ci-rpg-dialogue');
    let activeCat = null, currentFilter = 'all', streamTimer = null;

    function isModalOpen() { return !!(overlay && overlay.style.display === 'flex'); }
    function isDialogueOpen() { return !!(rpgDock && rpgDock.classList.contains('open')); }

    function closeModal() {
      clearSongTimers();
      if (overlay) overlay.style.display = 'none';
      setUI(isDialogueOpen());
    }
    function closeDialogue() {
      if (streamTimer) { clearInterval(streamTimer); streamTimer = null; }
      if (rpgDock) rpgDock.classList.remove('open');
      setUI(isModalOpen());
    }

    function openCompassModal() {
      exitLock(); closeDialogue();
      if (!overlay || !modalContent) return;
      renderCompass();
      overlay.style.display = 'flex';
      setUI(true);
    }

    function renderCompass() {
      const list = world.CATHEDRALS.filter((c) => currentFilter === 'all' || c.category === currentFilter);
      const countVis = Object.keys(visited).length;
      modalContent.innerHTML = `
        <div class="ci-m-head">
          <div>
            <h2>⛪ 世界 Top 20 教堂罗盘 · Cathedrals Compass</h2>
            <p class="ci-m-sub">15 座传世天主教大教堂 + 5 座现当代新式圣殿 · 已巡礼 <b>${countVis} / 20</b></p>
          </div>
          <button class="ci-m-close" id="ci-close-compass">✕</button>
        </div>
        <div class="ci-filter-bar">
          <button class="ci-fbtn ${currentFilter === 'all' ? 'on' : ''}" data-f="all">🌍 全部 (20)</button>
          <button class="ci-fbtn ${currentFilter === 'catholic' ? 'on' : ''}" data-f="catholic">⛪ 天主教大教堂 (15)</button>
          <button class="ci-fbtn ${currentFilter === 'modern' ? 'on' : ''}" data-f="modern">✨ 现当代新式教堂 (5)</button>
          <button class="ci-fbtn" id="ci-open-organ-studio" style="margin-left:auto;border-color:rgba(245,158,11,.5);color:#fde68a;">🎹 圣殿管风琴台</button>
        </div>
        <div class="ci-grid">
          ${list.map((c) => {
            const lm = world.landmarks.find((l) => l.id === 'cat_' + c.id);
            const isMod = c.category === 'modern';
            return `
              <div class="ci-card ${visited[c.id] ? 'visited' : ''}">
                <div class="ci-card-top">
                  <span class="ci-badge ${isMod ? 'mod' : 'cath'}">${isMod ? '新式教堂' : '天主教'} #${c.num}</span>
                  <span class="ci-city">${c.city.split('·')[0].trim()} · ${c.era}</span>
                </div>
                <div class="ci-card-name">${c.name}</div>
                <div class="ci-card-meta">${c.style} · 高 ${c.height} · ${c.architect}</div>
                <div class="ci-card-btns">
                  <button class="ci-btn gold" data-tp-ext="${c.id}">🚶 外观</button>
                  <button class="ci-btn" data-tp-in="${c.id}">🏛️ 入殿</button>
                  <button class="ci-btn" data-talk="${c.id}">💬 对话</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      modalContent.querySelector('#ci-close-compass').onclick = closeModal;
      const orgBtn = modalContent.querySelector('#ci-open-organ-studio');
      if (orgBtn) orgBtn.onclick = openOrganStudioModal;
      modalContent.querySelectorAll('.ci-fbtn[data-f]').forEach((b) => {
        b.onclick = () => { currentFilter = b.dataset.f; renderCompass(); };
      });
      modalContent.querySelectorAll('[data-tp-ext]').forEach((b) => {
        b.onclick = () => {
          const lm = world.landmarks.find((l) => l.id === 'cat_' + b.dataset.tpExt);
          if (lm) { closeModal(); markVisited(lm.cat.id); teleport(lm.tp); toast(`⛪ 已抵达 ${lm.name} 广场正面`); }
        };
      });
      modalContent.querySelectorAll('[data-tp-in]').forEach((b) => {
        b.onclick = () => {
          const lm = world.landmarks.find((l) => l.id === 'cat_' + b.dataset.tpIn);
          if (lm && lm.tpInside) { closeModal(); markVisited(lm.cat.id); teleport(lm.tpInside); toast(`🏛️ 已步入 ${lm.cat.name} 圣殿内部`); }
        };
      });
      modalContent.querySelectorAll('[data-talk]').forEach((b) => {
        b.onclick = () => {
          const c = world.CATHEDRALS.find((x) => x.id === b.dataset.talk);
          if (c) { closeModal(); openDialogue(c); }
        };
      });
    }

    function openOrganStudioModal() {
      if (!overlay || !modalContent) return;
      exitLock();
      modalContent.innerHTML = `
        <div class="ci-m-head">
          <div>
            <h2>🎹 圣殿管风琴与钟楼声学台 · Grand Pipe Organ Studio</h2>
            <p class="ci-m-sub">实时 Web Audio 三音栓 (16' 低音管 + 8' 主音管 + 4' 高音管) 合成器 · 自由弹奏或聆听传世圣曲</p>
          </div>
          <button class="ci-m-close" id="ci-close-organ">✕</button>
        </div>
        <div class="ci-wiki-body">
          ${buildOrganWidgetHtml()}
          <div class="ci-lab-row" style="margin-top:14px;">
            <button class="ci-btn" id="ci-back-compass">🧭 返回 Top 20 教堂罗盘</button>
            <button class="ci-btn" id="ci-org-dusk">🌇 切换黄昏彩玻圣光</button>
            <button class="ci-btn" id="ci-org-night">🌌 切换圣夜星穹</button>
          </div>
        </div>
      `;
      modalContent.querySelector('#ci-close-organ').onclick = closeModal;
      modalContent.querySelector('#ci-back-compass').onclick = renderCompass;
      modalContent.querySelector('#ci-org-dusk').onclick = () => { setTime(17.7); toast('🌇 已切换至黄昏彩玻圣光'); };
      modalContent.querySelector('#ci-org-night').onclick = () => { setTime(21.8); toast('🌌 已切换至圣夜星穹'); };
      wireOrganWidget(modalContent, toast);
      overlay.style.display = 'flex';
      setUI(true);
    }

    function openEncyclopediaModal(cat) {
      if (!overlay || !modalContent) return;
      exitLock();
      const isMod = cat.category === 'modern';
      modalContent.innerHTML = `
        <div class="ci-m-head">
          <div>
            <h2>${cat.num}. ${cat.name} <small style="font-weight:500;color:#94a3b8">${cat.en}</small></h2>
            <p class="ci-m-sub">${cat.city} · ${cat.era} · ${cat.style} · 高度 ${cat.height} · 建筑师：${cat.architect}</p>
          </div>
          <button class="ci-m-close" id="ci-close-wiki">✕</button>
        </div>
        <div class="ci-wiki-body">
          <div class="ci-quote-box">“${cat.quote}” — <b>${cat.architect}</b></div>
          <h4>📐 建筑核心奇迹</h4>
          <ul class="ci-hl-list">${cat.highlights.map((h) => `<li>${h}</li>`).join('')}</ul>
          <h4>📜 历史与营造档案</h4>
          <p class="ci-hist">${cat.history}</p>
          <h4>🎵 声学与光影互动体验</h4>
          <div class="ci-lab-row">
            <button class="ci-btn gold" id="ci-play-organ">🎵 奏响圣殿专属和弦</button>
            <button class="ci-btn" id="ci-play-bell">🔔 敲响钟楼圣钟</button>
            <button class="ci-btn" id="ci-light-sunset">🌇 黄昏彩玻</button>
            <button class="ci-btn" id="ci-light-night">🌌 圣夜星穹</button>
          </div>
          ${buildOrganWidgetHtml()}
        </div>
      `;
      modalContent.querySelector('#ci-close-wiki').onclick = closeModal;
      modalContent.querySelector('#ci-play-organ').onclick = () => { playPipeOrganChord(cat.organFreq); toast(`🎵 正在演奏《${cat.name}》圣殿管风琴和弦`); };
      modalContent.querySelector('#ci-play-bell').onclick = () => { playCathedralBell(cat.organFreq[0] * 1.5); toast(`🔔 《${cat.name}》钟楼钟声回荡全岛`); };
      modalContent.querySelector('#ci-light-sunset').onclick = () => { setTime(17.7); toast('🌇 已切换至黄昏斜阳，观赏彩绘玻璃光影'); };
      modalContent.querySelector('#ci-light-night').onclick = () => { setTime(21.8); toast('🌌 已切换至圣夜星穹与彩窗灯火'); };
      wireOrganWidget(modalContent, toast);
      overlay.style.display = 'flex';
      setUI(true);
    }

    function generateArchitectReply(cat, question) {
      const q = (question || '').toLowerCase();
      if (q.includes('结构') || q.includes('穹顶') || q.includes('塔') || q.includes('怎么建') || q.includes('建筑')) {
        return `谈到《${cat.name}》的结构巧思，我最引以为傲的是：${cat.highlights[0]}，以及${cat.highlights[1]}。整座建筑高约 ${cat.height}，每一寸石料或混凝土都在对抗重力中寻找向上的秩序。`;
      }
      if (q.includes('光') || q.includes('彩窗') || q.includes('玻璃') || q.includes('美')) {
        return `光影是教堂真正的建筑材料。在《${cat.name}》中，${cat.highlights[2] || cat.highlights[1]}。你可以试着把右上角时间滑块拖到黄昏，看斜阳如何穿透圣殿。`;
      }
      if (q.includes('历史') || q.includes('故事') || q.includes('年代') || q.includes('背景')) {
        return `${cat.history} 建于 ${cat.era} 年，坐落于 ${cat.city}，属于经典的「${cat.style}」代表作。`;
      }
      if (q.includes('管风琴') || q.includes('音乐') || q.includes('钟')) {
        playPipeOrganChord(cat.organFreq);
        return `听！这就是回荡在《${cat.name}》高耸穹顶下的管风琴和声。宏阔的垂直空间让每一个音符都能产生数秒钟的圣殿混响。`;
      }
      return `“${cat.quote}” —— 欢迎来到《${cat.name}》(${cat.style})。你可以随时向我追问它的【结构奇迹】、【光影美学】、【营造历史】，或点击下方按钮直接聆听管风琴与钟声！`;
    }

    function appendMsg(role, text, stream) {
      const log = document.getElementById('ci-rpg-log');
      if (!log) return;
      const div = document.createElement('div');
      div.className = 'ci-msg ' + role;
      log.appendChild(div);
      if (stream) {
        if (streamTimer) clearInterval(streamTimer);
        let idx = 0;
        streamTimer = setInterval(() => {
          idx += 2;
          div.textContent = text.slice(0, idx);
          log.scrollTop = log.scrollHeight;
          if (idx >= text.length) { clearInterval(streamTimer); streamTimer = null; }
        }, 18);
      } else {
        div.textContent = text;
        log.scrollTop = log.scrollHeight;
      }
    }

    function openDialogue(cat) {
      if (!cat || !rpgDock) return;
      exitLock(); closeModal(); markVisited(cat.id);
      activeCat = cat;
      document.getElementById('ci-rpg-name').textContent = cat.architect;
      document.getElementById('ci-rpg-era').textContent = `${cat.name} · ${cat.era}`;
      document.getElementById('ci-rpg-stance').textContent = `${cat.category === 'modern' ? '✨ 现当代新式教堂' : '⛪ 天主教大教堂'} · ${cat.style} · ${cat.city}`;
      const log = document.getElementById('ci-rpg-log');
      log.innerHTML = '';
      appendMsg('npc', `欢迎来到《${cat.name}》！我是建筑师 ${cat.architect}。“${cat.quote}”`, true);

      const chips = document.getElementById('ci-rpg-chips');
      chips.innerHTML = '';
      ['📐 讲解结构奇迹', '✨ 光影与彩窗设计', '📜 营造历史与故事', '🎵 奏响管风琴和弦'].forEach((label) => {
        const b = document.createElement('button');
        b.className = 'ci-chip'; b.textContent = label;
        b.onclick = () => {
          appendMsg('user', label, false);
          appendMsg('npc', generateArchitectReply(cat, label), true);
        };
        chips.appendChild(b);
      });

      document.getElementById('ci-rpg-open-wiki').onclick = () => openEncyclopediaModal(cat);
      document.getElementById('ci-rpg-organ').onclick = () => { playPipeOrganChord(cat.organFreq); toast(`🎵 正在演奏《${cat.name}》管风琴`); };
      document.getElementById('ci-rpg-close').onclick = closeDialogue;

      rpgDock.classList.add('open');
      setUI(true);
    }

    const inputEl = document.getElementById('ci-rpg-input');
    const sendBtn = document.getElementById('ci-rpg-send');
    function sendUserText() {
      if (!activeCat || !inputEl) return;
      const val = inputEl.value.trim(); if (!val) return;
      inputEl.value = '';
      appendMsg('user', val, false);
      appendMsg('npc', generateArchitectReply(activeCat, val), true);
    }
    if (sendBtn) sendBtn.onclick = sendUserText;
    if (inputEl) inputEl.onkeydown = (e) => { if (e.key === 'Enter') sendUserText(); };
    if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

    const promptBtn = document.getElementById('ci-portal-prompt');
    if (promptBtn) promptBtn.onclick = () => { if (nearestCat) openDialogue(nearestCat); };

    const visEl = document.getElementById('ci-visited-count');
    if (visEl) visEl.textContent = `${Object.keys(visited).length} / 20`;

    return {
      checkProximity,
      activateNearest: () => { if (nearestCat) { openDialogue(nearestCat); return true; } return false; },
      openCompassModal, openDialogue, closeDialogue, closeModal, isModalOpen, isDialogueOpen
    };
  }

  root.CIPortals = { attach };
})(window);
