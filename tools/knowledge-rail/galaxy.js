/* ==========================================================================
   Minest My World — Dynamic Presentation Phase 3 · PART II
   Knowledge Galaxy — Explorer Cockpit & Interplanetary Journey (galaxy.js)
   --------------------------------------------------------------------------
   - Original Minest Explorer cockpit: solid hull with one arched panoramic
     windshield, fanned mullions, side bulkheads, overhead switch arch,
     four-lever drive throttle, twin yokes and a holographic nav globe.
   - Living 3D Star System: ALL Kanban Boards are rendered in 3D space as
     distinct Planets (Forest, Desert, Ocean, Ice) with crisp, glowing 3D
     Title Banners mounted directly on/above each planet, rotating cloud
     layers, atmosphere halos, rings, moons, 3D asteroid belt, and streaming
     space dust.
   - Four-stage hyperspace jump (skippable; shortened with Reduced Motion):
     1) Throttle lever pull & FOV spool-up
     2) Radial star-streak elongation (1,100+ 3D vectors)
     3) Swirling blue-cyan hyperspace plasma vortex tunnel
     4) Snap exit with destination planet booming in from deep space
   - Atmospheric entry dive & planetary surface exploration with 3D titled
     Region Beacons and Card Monuments + KShow.reader 3D card flip.
   ========================================================================== */
(function () {
  'use strict';
  var K = window.KRail, X = window.KShow, T = window.THREE;
  if (!K || !X || !T || window.MinestGalaxy) return;

  var DB = X.store('minest-galaxy-v2');
  var clamp = K.clamp, lerp = K.lerp, ease = K.ease;
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function trunc(s, n) {
    s = String(s || '');
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }
  function mat(c, rough, metal, extra) {
    return X.M(c, Object.assign({ roughness: rough != null ? rough : 0.65, metalness: metal != null ? metal : 0.2 }, extra || {}));
  }
  function flat(c, extra) {
    return new T.MeshBasicMaterial(Object.assign({ color: c }, extra || {}));
  }
  function makeCanvasTex(w, h, drawFn) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var g = c.getContext('2d');
    drawFn(g, w, h);
    var tx = new T.CanvasTexture(c);
    tx.anisotropy = 4;
    if ('colorSpace' in tx && T.SRGBColorSpace) tx.colorSpace = T.SRGBColorSpace;
    return tx;
  }

  // Helper to build a 3D strut beam connecting two 3D points p1 -> p2
  function makeStrutBetween(p1, p2, thickness, material) {
    var diff = new T.Vector3().subVectors(p2, p1);
    var len = diff.length();
    var geo = new T.BoxGeometry(thickness, thickness * 1.15, len);
    var mesh = new T.Mesh(geo, material);
    mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
    mesh.lookAt(p2);
    return mesh;
  }

  // ---------------- Four Planetary Biome Themes ----------------
  var BIOMES = [
    {
      id: 'forest',
      name: '🌲 Forest Planet',
      zh: '森之星 · 翠林生态',
      icon: '🌲',
      sea: 0x164a5b,
      land: 0x2f9e66,
      land2: 0x68d391,
      cloud: '#dcffe8',
      atmo: 0x4ade80,
      ring: 0x86efac,
      skyTop: '#04131c',
      skyBot: '#134e4a',
      fog: 0x0f3b39,
      ground: 0x1d4d38,
      accent: '#4ade80'
    },
    {
      id: 'desert',
      name: '🏜 Desert Planet',
      zh: '沙之星 · 赤金沙海',
      icon: '🏜',
      sea: 0x7c2d12,
      land: 0xd97706,
      land2: 0xfbbf24,
      cloud: '#fef3c7',
      atmo: 0xf59e0b,
      ring: 0xfcd34d,
      skyTop: '#1c0d06',
      skyBot: '#7c2d12',
      fog: 0x451a03,
      ground: 0x92400e,
      accent: '#fbbf24'
    },
    {
      id: 'ocean',
      name: '🌊 Ocean Planet',
      zh: '海之星 · 蔚蓝深洋',
      icon: '🌊',
      sea: 0x0c4a6e,
      land: 0x0284c7,
      land2: 0x38bdf8,
      cloud: '#e0f2fe',
      atmo: 0x38bdf8,
      ring: 0x7dd3fc,
      skyTop: '#041022',
      skyBot: '#075985',
      fog: 0x082f49,
      ground: 0x0c4a6e,
      accent: '#38bdf8'
    },
    {
      id: 'ice',
      name: '❄️ Ice Planet',
      zh: '冰之星 · 极光冰原',
      icon: '❄️',
      sea: 0x1e3a8a,
      land: 0x93c5fd,
      land2: 0xeff6ff,
      cloud: '#ffffff',
      atmo: 0xa5f3fc,
      ring: 0xc4b5fd,
      skyTop: '#060b1e',
      skyBot: '#1e3a8a',
      fog: 0x172554,
      ground: 0xbfdbfe,
      accent: '#a5f3fc'
    }
  ];

  // ---------------- Curated Demo Planets (fallback if workspace has < 4 boards) ----------------
  var DEMO_PLANETS = [
    {
      id: 'planet-science',
      title: 'Science Planet',
      biome: 0,
      regions: [
        {
          title: 'Astrophysics & Relativity',
          items: [
            { title: 'General Relativity', zh: '广义相对论与时空曲率', back: 'Gravity is the geometric curvature of four-dimensional spacetime caused by mass and energy.' },
            { title: 'Event Horizon Telescope', zh: '事件视界望远镜', back: 'Interferometric array that captured the first direct shadow image of supermassive black hole M87*.' },
            { title: 'Exoplanet Transit Method', zh: '系外行星凌日探测法', back: 'Detects periodic dips in stellar brightness as an orbiting planet crosses in front of its host star.' }
          ]
        },
        {
          title: 'Quantum & Molecular Lab',
          items: [
            { title: 'Wave-Particle Duality', zh: '波粒二象性', back: 'Quantum entities exhibit both wave-like interference and localized particle behavior.' },
            { title: 'CRISPR Gene Editing', zh: 'CRISPR 基因编辑', back: 'Guide RNA directs Cas9 endonuclease to make targeted double-stranded DNA cuts.' }
          ]
        }
      ]
    },
    {
      id: 'planet-literature',
      title: 'Literature Planet',
      biome: 1,
      regions: [
        {
          title: 'World Epics & Classics',
          items: [
            { title: 'The Odyssey', zh: '《奥德赛》荷马史诗', back: 'Odysseus journeys ten years across mythical seas to return home to Ithaca.' },
            { title: 'One Hundred Years of Solitude', zh: '《百年孤独》魔幻现实主义', back: 'Multi-generational chronicle of the Buendía family in the mythical town of Macondo.' },
            { title: 'Invisible Cities', zh: '《看不见的城市》卡尔维诺', back: 'Poetic dialogues between Marco Polo and Kublai Khan imagining fifty-five fantastical cities.' }
          ]
        },
        {
          title: 'Poetics & Narrative Craft',
          items: [
            { title: 'Hero with a Thousand Faces', zh: '千面英雄叙事母题', back: 'Joseph Campbell monomyth: Departure, Initiation, and Return.' },
            { title: 'Stream of Consciousness', zh: '意识流文学技法', back: 'Continuous flow of interior perceptions, memories, and associations.' }
          ]
        }
      ]
    },
    {
      id: 'planet-history',
      title: 'History Planet',
      biome: 2,
      regions: [
        {
          title: 'Ancient Civilizations & Trade',
          items: [
            { title: 'Library of Alexandria', zh: '亚历山大图书馆', back: 'Ancient hub of Hellenistic scholarship housing hundreds of thousands of papyrus scrolls.' },
            { title: 'Maritime Silk Road', zh: '海上丝绸之路', back: 'Oceanic trade routes linking East Asia, Southeast Asia, India, Arabia, and the Mediterranean.' },
            { title: 'Antikythera Mechanism', zh: '安提基特拉机械装置', back: 'Ancient Greek hand-powered bronze astronomical computer predicting eclipses and planetary cycles.' }
          ]
        },
        {
          title: 'Renaissance & Scientific Revolution',
          items: [
            { title: 'Gutenberg Printing Press', zh: '古腾堡活字印刷术', back: 'Movable metal type catalyzed the rapid democratization of knowledge across Europe.' },
            { title: 'Age of Celestial Navigation', zh: '天文航海与星盘时代', back: 'Astrolabes, sextants, and marine chronometers unlocked accurate global longitude.' }
          ]
        }
      ]
    },
    {
      id: 'planet-philosophy',
      title: 'Philosophy Planet',
      biome: 3,
      regions: [
        {
          title: 'Epistemology & Mind',
          items: [
            { title: 'Allegory of the Cave', zh: '柏拉图洞穴隐喻', back: 'Prisoners mistake shadows cast on a cave wall for ultimate reality until ascending into sunlight.' },
            { title: 'Ship of Theseus', zh: '忒修斯之船悖论', back: 'If every timber of a ship is gradually replaced, does it remain the same vessel?' },
            { title: 'Cartesian Cogito', zh: '我思故我在 · 笛卡尔', back: 'Methodic doubt establishes the thinking self as an indubitable foundation of knowledge.' }
          ]
        },
        {
          title: 'Ethics & Wisdom',
          items: [
            { title: 'Aristotelian Eudaimonia', zh: '亚里士多德幸福论与德性', back: 'Human flourishing achieved through rational activity in accordance with virtue.' },
            { title: 'Stoic Dichotomy of Control', zh: '斯多葛控制二分法', back: 'Distinguish clearly between what is up to us (judgments, actions) and externals.' }
          ]
        }
      ]
    }
  ];

  // ---------------- Build Galaxy Planets from Kanban Workspace ----------------
  var ROUTE_GAP = 150, ROUTE_SPEED = 22;
  function buildGalaxyData(P) {
    var boards = (P && P.boards && P.boards()) || (P && P.getBoards && P.getBoards()) || [];
    var planets = [];

    boards.forEach(function (b, bi) {
      var C = null;
      try { C = X.collect(P, { type: 'board', bid: b.id }); } catch (e) {}
      if (!C || !C.all || !C.all.length) return;
      var regions = (C.groups || []).filter(function (g) { return g.items && g.items.length; }).slice(0, 6);
      if (!regions.length) regions = [{ id: b.id + '-r0', title: b.title || 'Core Region', items: C.all.slice(0, 12) }];
      var cleanTitle = String(b.title || ('Planet ' + (bi + 1))).replace(/^[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD10-\uDDFF]\s*/g, '').trim() || b.title;
      planets.push({
        id: b.id || ('board-' + bi),
        title: cleanTitle,
        rawTitle: b.title || cleanTitle,
        biome: BIOMES[planets.length % BIOMES.length].id,
        biomeIdx: planets.length % BIOMES.length,
        regions: regions.map(function (r) {
          return { id: r.id, title: r.title, color: r.color, items: r.items.slice(0, 6) };
        }),
        all: C.all.slice(0, 18)
      });
    });

    var dIdx = 0;
    while (planets.length < 4 && dIdx < DEMO_PLANETS.length) {
      var dp = DEMO_PLANETS[dIdx++];
      var bIdx = dp.biome % BIOMES.length;
      var all = [];
      var regs = dp.regions.map(function (rg, ri) {
        var gObj = { id: dp.id + '-r' + ri, title: rg.title, color: K.PAL[(bIdx + ri) % K.PAL.length] };
        var items = rg.items.map(function (c, ci) {
          var ref = { bid: dp.id, col: gObj.id, id: gObj.id + '-c' + ci };
          var it = {
            ref: ref,
            g: gObj,
            I: {
              ref: ref,
              card: { title: c.title, desc: c.back },
              list: { title: rg.title },
              board: { title: dp.title },
              title: c.title,
              zh: c.zh,
              sub: c.zh,
              back: c.back,
              desc: c.back,
              notes: '',
              checklist: [],
              labels: [BIOMES[bIdx].name],
              type: (ci % 3 === 0) ? 'book' : (ci % 3 === 1) ? 'poster' : 'concept',
              sig: K.hash(dp.title + '|' + c.title)
            }
          };
          all.push(it);
          return it;
        });
        return { id: gObj.id, title: rg.title, color: gObj.color, items: items };
      });
      planets.push({
        id: dp.id,
        title: dp.title,
        rawTitle: dp.title,
        biome: BIOMES[bIdx].id,
        biomeIdx: bIdx,
        regions: regs,
        all: all
      });
    }

    // Highway route: one planet every ROUTE_GAP units, alternating left/right of
    // the flight line, so they pass by one at a time like roadside billboards.
    planets.forEach(function (pl, pi) {
      pl.pi = pi;
      pl.pos = {
        x: (pi % 2 ? 1 : -1) * (24 + (pi % 3) * 3),
        y: ((pi % 3) - 1) * 3,
        z: -ROUTE_GAP * (pi + 1)
      };
      pl.radius = 5.5 + (pi % 3) * 0.6;
    });

    return planets;
  }

  // ---------------- Procedural Textures: Planet Surface, 3D Planet Title Banner, Plaque ----------------
  var planetTexCache = new Map();
  function makePlanetTexture(B, seed) {
    var key = B.id + ':' + seed;
    if (planetTexCache.has(key)) return planetTexCache.get(key);
    var hex = function (n) { return '#' + ('000000' + n.toString(16)).slice(-6); };
    var tex = makeCanvasTex(512, 256, function (g) {
      var baseGrad = g.createLinearGradient(0, 0, 0, 256);
      baseGrad.addColorStop(0, hex(B.land2));
      baseGrad.addColorStop(0.18, hex(B.sea));
      baseGrad.addColorStop(0.5, hex(B.sea));
      baseGrad.addColorStop(0.82, hex(B.sea));
      baseGrad.addColorStop(1, hex(B.land2));
      g.fillStyle = baseGrad;
      g.fillRect(0, 0, 512, 256);

      for (var b = 0; b < 14; b++) {
        g.fillStyle = (b % 2 === 0) ? hex(B.land) : hex(B.land2);
        g.globalAlpha = 0.16;
        g.fillRect(0, b * 18, 512, 8);
      }

      var rng = K.rng(seed || 101);
      for (var i = 0; i < 38; i++) {
        var x = rng() * 512, y = 28 + rng() * 200;
        var rx = 18 + rng() * 68, ry = 10 + rng() * 34;
        g.fillStyle = i % 3 === 0 ? hex(B.land2) : hex(B.land);
        g.globalAlpha = 0.65 + rng() * 0.3;
        g.beginPath();
        g.ellipse(x, y, rx, ry, (rng() - 0.5) * 0.6, 0, Math.PI * 2);
        g.fill();
      }

      g.globalAlpha = 0.32;
      g.fillStyle = B.cloud;
      for (var k = 0; k < 18; k++) {
        var cx = rng() * 512, cy = 16 + rng() * 224;
        g.beginPath();
        g.ellipse(cx, cy, 34 + rng() * 70, 3 + rng() * 7, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    });
    planetTexCache.set(key, tex);
    return tex;
  }

  // Crisp 3D Floating Title Banner directly on/above each Planet!
  var bannerTexCache = new Map();
  function makePlanetTitleBanner(pl, B, isTarget) {
    var key = pl.id + '|' + (isTarget ? '1' : '0');
    if (bannerTexCache.has(key)) return bannerTexCache.get(key);
    var tex = makeCanvasTex(1024, 260, function (g, w, h) {
      g.clearRect(0, 0, w, h);

      var pad = 14;
      g.fillStyle = isTarget ? 'rgba(6, 22, 46, 0.92)' : 'rgba(6, 15, 32, 0.86)';
      g.strokeStyle = isTarget ? '#f2c13d' : B.accent;
      g.lineWidth = isTarget ? 7 : 5;
      K.rr(g, pad, pad, w - pad * 2, h - pad * 2 - 30, 28);
      g.fill();
      g.stroke();

      // Inner targeting corner brackets
      g.strokeStyle = isTarget ? '#fff3b0' : '#ffffff';
      g.lineWidth = 4;
      var bLen = 26;
      g.beginPath(); g.moveTo(pad + 14, pad + 14 + bLen); g.lineTo(pad + 14, pad + 14); g.lineTo(pad + 14 + bLen, pad + 14); g.stroke();
      g.beginPath(); g.moveTo(w - pad - 14 - bLen, pad + 14); g.lineTo(w - pad - 14, pad + 14); g.lineTo(w - pad - 14, pad + 14 + bLen); g.stroke();

      // Biome badge pill on left
      g.fillStyle = B.accent;
      K.rr(g, pad + 30, pad + 26, 168, 44, 22);
      g.fill();
      g.fillStyle = '#04101e';
      g.font = '800 24px ' + K.FONT;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('PLANET #' + (pl.pi + 1), pad + 30 + 84, pad + 48);

      // Target lock tag on right
      g.fillStyle = isTarget ? '#f2c13d' : 'rgba(148, 210, 255, 0.92)';
      g.font = '700 22px "SF Mono", Menlo, monospace';
      g.textAlign = 'right';
      g.fillText(isTarget ? '[ TARGET LOCKED · TAP TO LAND ]' : '[ TAP TO WARP ]', w - pad - 32, pad + 48);

      // Large Planet Title (Board Name)
      g.fillStyle = '#ffffff';
      g.shadowColor = isTarget ? 'rgba(242, 193, 61, 0.8)' : 'rgba(56, 189, 248, 0.8)';
      g.shadowBlur = 14;
      g.font = '800 54px ' + K.FONT;
      g.textAlign = 'center';
      g.fillText(trunc(pl.title, 25), w / 2, pad + 118);
      g.shadowBlur = 0;

      // Subtitle: Biome + Regions + Cards count
      g.fillStyle = isTarget ? '#fde68a' : '#93c5fd';
      g.font = '600 28px ' + K.FONT;
      g.fillText(B.name + '  ·  ' + pl.regions.length + ' Regions  ·  ' + pl.all.length + ' Cards', w / 2, pad + 174);

      // Downward pointer arrow toward planet north pole
      g.fillStyle = isTarget ? '#f2c13d' : B.accent;
      g.beginPath();
      g.moveTo(w / 2 - 22, h - pad - 28);
      g.lineTo(w / 2 + 22, h - pad - 28);
      g.lineTo(w / 2, h - 4);
      g.closePath();
      g.fill();
    });
    bannerTexCache.set(key, tex);
    return tex;
  }

  // Equatorial Orbital Ring Nameband Texture (wraps Planet Title right onto the planet's glowing hologram band!)
  var titleTexCache = new Map();
  function makeTitleOnlyTex(pl, B) {
    if (titleTexCache.has(pl.id)) return titleTexCache.get(pl.id);
    var tex = makeCanvasTex(1024, 260, function (g, w, h) {
      g.clearRect(0, 0, w, h);
      g.font = '800 92px ' + K.FONT;
      var t = trunc(pl.title, 22), tw = Math.min(w - 60, g.measureText(t).width + 150);
      g.fillStyle = 'rgba(4, 12, 28, 0.78)';
      K.rr(g, (w - tw) / 2, 50, tw, 150, 75); g.fill();
      g.strokeStyle = B.accent; g.lineWidth = 6; g.stroke();
      g.fillStyle = '#f8fafc'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(t, w / 2, 128);
    });
    titleTexCache.set(pl.id, tex);
    return tex;
  }
  function makeOrbitalTitleBandTex(pl, B) {
    return makeCanvasTex(1024, 96, function (g, w, h) {
      g.fillStyle = 'rgba(4, 14, 30, 0.78)';
      g.fillRect(0, 12, w, h - 24);
      g.strokeStyle = B.accent;
      g.lineWidth = 4;
      g.beginPath(); g.moveTo(0, 14); g.lineTo(w, 14); g.moveTo(0, h - 14); g.lineTo(w, h - 14); g.stroke();
      g.fillStyle = '#ffffff';
      g.font = '800 38px ' + K.FONT;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      var label = '★ ' + pl.title.toUpperCase() + '  ·  ' + B.name.toUpperCase() + ' ★';
      g.fillText(label, w / 2, h / 2);
    });
  }

  function makePlaqueTex(title, sub, accent) {
    return makeCanvasTex(512, 148, function (g, w, h) {
      g.fillStyle = 'rgba(6, 14, 28, 0.92)';
      g.strokeStyle = accent || '#38bdf8';
      g.lineWidth = 5;
      K.rr(g, 6, 6, w - 12, h - 12, 22);
      g.fill();
      g.stroke();

      g.fillStyle = '#ffffff';
      g.font = '800 32px ' + K.FONT;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(trunc(title, 22), w / 2, 54);

      g.fillStyle = accent || '#7dd3fc';
      g.font = '600 22px ' + K.FONT;
      g.fillText(trunc(sub || '', 28), w / 2, 102);
    });
  }

  function makeCockpitScreenTex(kind) {
    return makeCanvasTex(256, 160, function (g, w, h) {
      g.fillStyle = '#040c18';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = kind === 'radar' ? '#38bdf8' : kind === 'nav' ? '#4ade80' : '#f59e0b';
      g.lineWidth = 3;
      g.strokeRect(5, 5, w - 10, h - 10);

      if (kind === 'radar') {
        var cx = w / 2, cy = h / 2, r = 56;
        g.strokeStyle = 'rgba(56, 189, 248, 0.48)';
        g.lineWidth = 2;
        [r, r * 0.66, r * 0.33].forEach(function (rad) {
          g.beginPath(); g.arc(cx, cy, rad, 0, Math.PI * 2); g.stroke();
        });
        g.beginPath(); g.moveTo(cx - r, cy); g.lineTo(cx + r, cy); g.stroke();
        g.beginPath(); g.moveTo(cx, cy - r); g.lineTo(cx, cy + r); g.stroke();
        g.fillStyle = '#4ade80';
        [[cx + 22, cy - 18], [cx - 30, cy - 12], [cx + 10, cy + 26], [cx - 12, cy + 32]].forEach(function (pt) {
          g.beginPath(); g.arc(pt[0], pt[1], 5, 0, Math.PI * 2); g.fill();
        });
      } else if (kind === 'nav') {
        // Targeting grid
        g.strokeStyle = '#4ade80';
        g.lineWidth = 2;
        for (var i = 1; i <= 4; i++) {
          var s = i * 16;
          g.strokeRect(w / 2 - s * 1.4, h / 2 - s, s * 2.8, s * 2);
        }
        g.beginPath();
        g.moveTo(16, 16); g.lineTo(w - 16, h - 16);
        g.moveTo(w - 16, 16); g.lineTo(16, h - 16);
        g.stroke();
        g.fillStyle = '#f2c13d';
        g.font = '700 16px monospace';
        g.textAlign = 'center';
        g.fillText('LOCK 042.8', w / 2, h - 16);
      } else {
        var colors = ['#ef4444', '#f59e0b', '#38bdf8', '#4ade80', '#f59e0b'];
        for (var row = 0; row < 5; row++) {
          g.fillStyle = colors[row];
          var bw = 50 + ((row * 37) % 120);
          g.fillRect(18, 20 + row * 24, bw, 14);
          g.fillStyle = 'rgba(255,255,255,0.2)';
          g.fillRect(18 + bw + 8, 20 + row * 24, w - 44 - bw, 14);
        }
      }
    });
  }

  // ---------------- Main Galaxy Class ----------------
  function Galaxy(opts) {
    opts = opts || {};
    var self = this;
    var P = opts.provider || K.defaultProvider();
    var planets = buildGalaxyData(P);
    var saved = DB.get('galaxy') || {};
    var reducedMotion = false;
    try { reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    var st = {
      phase: 'cockpit', // 'cockpit' | 'hyperspace' | 'approach' | 'landing' | 'surface'
      pi: clamp(saved.pi || 0, 0, Math.max(0, planets.length - 1)),
      visited: saved.visited || { 0: true },
      phaseT: 0,
      warpDur: reducedMotion ? 1.0 : 2.5,
      cruise: true,        // Continuous space flight in cockpit
      cockpitFrame: true,  // legacy flag (kept for saved state)
      view: ['cockpit', 'chase', 'open'].indexOf(saved.view) >= 0 ? saved.view : 'cockpit',
      autoExplore: false,
      focusIdx: -1,
      yaw: 0,
      pitch: 0.02,
      bank: 0,
      shipPos: { x: 0, y: 0, z: 24 }
    };

    function persist() {
      DB.set('galaxy', { pi: st.pi, visited: st.visited, view: st.view });
    }
    function curPlanet() { return planets[st.pi] || planets[0]; }
    function curBiome() { return BIOMES[curPlanet().biomeIdx || 0]; }

    // Overview pose: parked well back from the system so every planet is a small
    // titled globe across the windshield; tapping one flies there and lands.
    // Route pose: on the flight line, either well before the current planet
    // (start) or just past it (resuming after a visit).
    function overviewPose(resume) {
      var pl = curPlanet();
      st.shipPos.x = 0; st.shipPos.y = 1.5; st.shipPos.z = pl.pos.z + (resume ? 12 : 118);
      st.yaw = 0; st.pitch = -0.02;
    }
    overviewPose();

    var cur = { x: 0, y: 1.75, z: 16, yaw: 0, pitch: -0.04 };
    var tgt = { x: 0, y: 1.75, z: 16, yaw: 0, pitch: -0.04 };

    var S = X.stage({
      cls: 'kg-root',
      container: opts.container,
      onExit: opts.onExit,
      hFov: 74,
      maxFov: 88,
      far: 380,
      hint: 'Tap card to flip · tap outside to return',
      html:
        '<div class="kx-top">' +
          '<div class="kx-pill"><i></i><span><b></b><small></small></span></div>' +
          '<div class="kx-tr">' +
            '<button type="button" class="kx-b" data-kx="map">🌌 <span>Galaxy Map (' + planets.length + ')</span></button>' +
            '<button type="button" class="kx-b" data-kx="exit" aria-label="Exit">✕</button>' +
          '</div>' +
        '</div>' +
        '<div class="kg-status"></div>' +
        '<div class="kx-bar">' +
          '<button type="button" class="kx-b" data-kx="map">🌌 <span>Planets</span></button>' +
          '<button type="button" class="kx-b kg-b-warp" data-kx="warp">⚡ <span>Hyperspace</span></button>' +
          '<button type="button" class="kx-b" data-kx="land">🛬 <span>Land</span></button>' +
          '<button type="button" class="kx-b kg-b-cruise" data-kx="cruise">🚀 <span>Cruise</span></button>' +
          '<button type="button" class="kx-b kg-b-cockpit" data-kx="cockpit">🪟 <span>Cockpit</span></button>' +
        '</div>' +
        '<div class="kx-sheet" hidden>' +
          '<div class="kx-card">' +
            '<div class="kx-head"><b>🌌 3D Galaxy Navigation Chart · ' + planets.length + ' Planets</b><button type="button" class="kx-b" data-kx="map">✕</button></div>' +
            '<div class="kx-list kg-map-body"></div>' +
          '</div>' +
        '</div>'
    });

    var scene = S.scene, cam = S.cam, RD = X.reader(S);
    var statusEl = S.$('.kg-status');
    statusEl.addEventListener('click', function () {
      if (st.phase === 'hyperspace') finishHyperspace();
      else if (st.phase === 'approach') landOnPlanet();
      else if (st.phase === 'cockpit') startHyperspace();
    });

    var hitMap = new Map();
    var hitObjects = [];
    function clearHits() {
      hitMap.clear();
      hitObjects.length = 0;
    }
    function addHit(obj, fn) {
      hitMap.set(obj, fn);
      hitObjects.push(obj);
    }

    // Sky sphere + lighting
    var skyGeo = new T.SphereGeometry(340, 20, 12);
    var skyMat = new T.MeshBasicMaterial({ color: '#020612', side: T.BackSide, fog: false, depthWrite: false });
    var skyMesh = new T.Mesh(skyGeo, skyMat);
    skyMesh.renderOrder = -10;
    scene.add(skyMesh);
    scene.fog = new T.Fog('#030816', 75, 320);

    var hemi = new T.HemisphereLight('#dbeafe', '#0f172a', 0.9);
    var sun = new T.DirectionalLight('#ffffff', 1.25);
    sun.position.set(35, 50, 30);
    var fill = new T.DirectionalLight('#38bdf8', 0.45);
    fill.position.set(-25, 15, 20);
    scene.add(hemi, sun, fill);

    // =========================================================================
    // 1. DEEP SPACE ENVIRONMENT (Starfield + Asteroids + Hyperspace Tunnel)
    // =========================================================================
    var spaceGroup = new T.Group();
    scene.add(spaceGroup);

    // 1A. 1,600 Pinpoint Stars around the ship
    var starCount = 1600;
    var starPos = new Float32Array(starCount * 3);
    for (var i = 0; i < starCount; i++) {
      var r = 95 + Math.random() * 170;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);
    }
    var starGeo = new T.BufferGeometry();
    starGeo.setAttribute('position', new T.BufferAttribute(starPos, 3));
    var starMat = new T.PointsMaterial({ color: 0xf8fafc, size: 0.72, transparent: true, opacity: 0.95 });
    var starPoints = new T.Points(starGeo, starMat);
    spaceGroup.add(starPoints);

    // 1B. Streaming Space Dust & Micro-Meteoroids
    var dustCount = 360;
    var dustGeo = new T.BufferGeometry();
    var dustPos = new Float32Array(dustCount * 6);
    var dustSeeds = [];
    for (var d = 0; d < dustCount; d++) {
      var dx = (Math.random() - 0.5) * 44;
      var dy = (Math.random() - 0.5) * 28;
      var dz = -Math.random() * 90;
      dustSeeds.push({ x: dx, y: dy, z: dz, spd: 22 + Math.random() * 28 });
      dustPos[d * 6] = dx; dustPos[d * 6 + 1] = dy; dustPos[d * 6 + 2] = dz;
      dustPos[d * 6 + 3] = dx; dustPos[d * 6 + 4] = dy; dustPos[d * 6 + 5] = dz + 2.2;
    }
    dustGeo.setAttribute('position', new T.BufferAttribute(dustPos, 3));
    var dustMat = new T.LineBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.52 });
    var dustLines = new T.LineSegments(dustGeo, dustMat);
    cam.add(dustLines);

    // 1C. Passing 3D Low-Poly Asteroids outside the cockpit window (for true 3D motion parallax!)
    var asteroidGroup = new T.Group();
    cam.add(asteroidGroup);
    var asteroids = [];
    var astMat = mat(0x475569, 0.85, 0.15);
    for (var ai = 0; ai < 28; ai++) {
      var aRad = 0.22 + Math.random() * 0.65;
      var aMesh = new T.Mesh(new T.DodecahedronGeometry(aRad, 0), astMat);
      var ax = (Math.random() < 0.5 ? -1 : 1) * (4.5 + Math.random() * 22);
      var ay = (Math.random() - 0.5) * 18;
      var az = -10 - Math.random() * 95;
      aMesh.position.set(ax, ay, az);
      aMesh.scale.set(1, 0.7 + Math.random() * 0.5, 0.8 + Math.random() * 0.5);
      asteroidGroup.add(aMesh);
      asteroids.push({
        mesh: aMesh,
        spd: 9 + Math.random() * 14,
        rx: (Math.random() - 0.5) * 2,
        ry: (Math.random() - 0.5) * 2
      });
    }

    // 1D. Hyperspace star streaks (1,100 radial light beams)
    var warpCount = 1100;
    var warpPos = new Float32Array(warpCount * 6);
    var warpBase = [];
    for (var w = 0; w < warpCount; w++) {
      var rad = 1.6 + Math.random() * 28;
      var ang = Math.random() * Math.PI * 2;
      var wx = Math.cos(ang) * rad;
      var wy = Math.sin(ang) * rad;
      var wz = -4 - Math.random() * 120;
      warpBase.push({ x: wx, y: wy, z: wz, spd: 85 + Math.random() * 75 });
      warpPos[w * 6] = wx; warpPos[w * 6 + 1] = wy; warpPos[w * 6 + 2] = wz;
      warpPos[w * 6 + 3] = wx; warpPos[w * 6 + 4] = wy; warpPos[w * 6 + 5] = wz - 0.5;
    }
    var warpGeo = new T.BufferGeometry();
    warpGeo.setAttribute('position', new T.BufferAttribute(warpPos, 3));
    var warpMat = new T.LineBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0 });
    var warpLines = new T.LineSegments(warpGeo, warpMat);
    warpLines.visible = false;
    cam.add(warpLines);

    // 1E. Swirling Blue-Cyan Hyperspace Plasma Tunnel
    var tunnelGroup = new T.Group();
    tunnelGroup.visible = false;
    var tunnelRings = [];
    var ringGeo = new T.TorusGeometry(8.5, 0.16, 8, 40);
    for (var tr = 0; tr < 22; tr++) {
      var rMat = new T.MeshBasicMaterial({
        color: tr % 3 === 0 ? 0xe0f2fe : tr % 2 === 0 ? 0x38bdf8 : 0x60a5fa,
        transparent: true,
        opacity: 0
      });
      var rMesh = new T.Mesh(ringGeo, rMat);
      rMesh.position.z = -tr * 5.5 - 4;
      rMesh.rotation.z = tr * 0.35;
      tunnelGroup.add(rMesh);
      tunnelRings.push({ mesh: rMesh, mat: rMat });
    }
    function makeWarpTex() {
      return makeCanvasTex(1024, 1024, function (g, w, h) {
        var cx = w / 2, cy = h / 2, rg = g.createRadialGradient(cx, cy, 0, cx, cy, w * 0.7);
        rg.addColorStop(0, '#0a2348'); rg.addColorStop(0.25, '#123d78'); rg.addColorStop(1, '#5d9ee8');
        g.fillStyle = rg; g.fillRect(0, 0, w, h);
        g.lineCap = 'round';
        for (var n = 0; n < 2200; n++) {
          var an = Math.random() * Math.PI * 2, r0 = 40 + Math.pow(Math.random(), 0.7) * w * 0.62, len = (0.15 + Math.random() * 0.6) * r0;
          var lw = 1 + Math.random() * (r0 / w) * 9, a = 0.25 + Math.random() * 0.6;
          g.strokeStyle = Math.random() < 0.6 ? 'rgba(235,245,255,' + a + ')' : 'rgba(120,180,255,' + a + ')';
          g.lineWidth = lw; g.beginPath();
          g.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0);
          g.lineTo(cx + Math.cos(an) * (r0 + len), cy + Math.sin(an) * (r0 + len)); g.stroke();
        }
        for (var m = 0; m < 160; m++) {             // speckled core
          var ma = Math.random() * Math.PI * 2, mr = Math.random() * 70;
          g.fillStyle = 'rgba(200,225,255,' + (0.3 + Math.random() * 0.6) + ')';
          g.fillRect(cx + Math.cos(ma) * mr, cy + Math.sin(ma) * mr, 2 + Math.random() * 3, 2 + Math.random() * 3);
        }
      });
    }
    var warpWallMat = new T.MeshBasicMaterial({ map: makeWarpTex(), transparent: true, opacity: 0, depthWrite: false, fog: false });
    var warpWall = new T.Mesh(new T.PlaneGeometry(150, 150), warpWallMat);
    warpWall.position.z = -60; warpWall.renderOrder = -5;
    tunnelGroup.add(warpWall);
    cam.add(tunnelGroup);
    scene.add(cam);

    // =========================================================================
    // 2. FREIGHTER COCKPIT (attached to the camera)
    //    Classic space-opera greenhouse: a round pane dead ahead, two glazing
    //    rings stepping back toward the pilot, heavy radial mullions between
    //    them, and a solid hull collar around everything.
    // =========================================================================
    var cockpitGroup = new T.Group();
    cam.add(cockpitGroup);

    var cockpitBlueLight = new T.PointLight(0x7cc4ff, 0.7, 4, 1.5);
    cockpitBlueLight.position.set(0, 0.2, -1.6);
    cockpitGroup.add(cockpitBlueLight);

    var cockpitAmberLight = new T.PointLight(0xffb15c, 0.15, 3, 1.5);
    cockpitAmberLight.position.set(0, 1.15, -1.1);
    cockpitGroup.add(cockpitAmberLight);

    // Dark freighter interior: almost black, lit by what is outside the glass
    var hullDarkMat = mat(0x0c0f14, 0.9, 0.2);
    var hullMidMat = mat(0x262c35, 0.7, 0.4);
    var strutMat = mat(0x4a5562, 0.55, 0.5);
    var panelMat = mat(0x171b21, 0.85, 0.2);
    var seatMat = flat(0x05070a);
    var chromeMat = mat(0xcbd5e1, 0.22, 0.85);
    var glowCyanMat = flat(0x38bdf8);
    var glowAmberMat = flat(0xf59e0b);

    // 2A. Arched fan windshield: a flat sill on the dash, a half-round inner
    //     pane, and two stepped arches; heavy riveted mullions between them.
    var ARCH = [                       // [z, radius, frame thickness]
      [-2.2, 0.5, 0.045],
      [-1.9, 1.05, 0.06],
      [-1.5, 1.32, 0.1]
    ];
    function archC(k) { return new T.Vector3(0, -0.5 * (-ARCH[k][0]) / 2.2, ARCH[k][0]); }   // same sill line on screen
    function archPt(k, ang) { var c = archC(k); return new T.Vector3(Math.cos(ang) * ARCH[k][1], c.y + Math.sin(ang) * ARCH[k][1], c.z); }
    ARCH.forEach(function (A, k) {
      var ring = new T.Mesh(new T.TorusGeometry(A[1], A[2], 8, 40, Math.PI), k === 2 ? hullMidMat : strutMat);
      ring.position.copy(archC(k)); cockpitGroup.add(ring);
      var lip = new T.Mesh(new T.TorusGeometry(A[1] - A[2] * 0.9, A[2] * 0.25, 4, 40, Math.PI), flat(0x8fb4d8));
      lip.position.copy(archC(k)); lip.position.z += 0.01; cockpitGroup.add(lip);   // window-lit inner edge
    });
    // Hull around the outer arch (shape with a half-disc window cut out)
    var oc = archC(2), hullShape = new T.Shape();
    hullShape.moveTo(-9, -9); hullShape.lineTo(9, -9); hullShape.lineTo(9, 9); hullShape.lineTo(-9, 9); hullShape.lineTo(-9, -9);
    var winHole = new T.Path(); winHole.moveTo(ARCH[2][1], oc.y); winHole.absarc(0, oc.y, ARCH[2][1], 0, Math.PI, false); winHole.lineTo(ARCH[2][1], oc.y);
    hullShape.holes.push(winHole);
    var hullPlate = new T.Mesh(new T.ShapeGeometry(hullShape, 24), hullDarkMat);
    hullPlate.position.z = oc.z - 0.02; cockpitGroup.add(hullPlate);
    // Sill: the flat bottom edge of every pane
    cockpitGroup.add(makeStrutBetween(archPt(2, Math.PI), archPt(2, 0), 0.09, hullMidMat));

    // 2B. Mullions: inner->mid at two angles, mid->outer at four, plus the sill ends
    var D = Math.PI / 180, rv = K.rng(5);
    function mullion(k, ang, th) {
      var p1 = archPt(k, ang), p2 = archPt(k + 1, ang);
      cockpitGroup.add(makeStrutBetween(p1, p2, th, k ? hullMidMat : strutMat));
      if (k) for (var r = 1; r < 4; r++) {           // rivet blocks on the heavy outer frames
        var q = p1.clone().lerp(p2, r / 4), rb = new T.Mesh(new T.BoxGeometry(th * 0.7, th * 0.5, th * 0.4), strutMat);
        q.z += 0.03; rb.position.copy(q); rb.rotation.z = ang + rv() * 0.2; cockpitGroup.add(rb);
      }
    }
    [0, 62, 118, 180].forEach(function (d) { mullion(0, d * D, 0.055); });
    [0, 30, 62, 118, 150, 180].forEach(function (d) { mullion(1, d * D, 0.085); });

    // Seat backs in the foreground (silhouettes, as from the jump seats behind the pilots)
    [[-0.66, 0.5], [0.7, 0.46]].forEach(function (sp) {
      var seat = new T.Group();
      var back = new T.Mesh(new T.BoxGeometry(sp[1], 0.5, 0.1), seatMat); back.position.y = -0.25; seat.add(back);
      var head = new T.Mesh(new T.CylinderGeometry(sp[1] / 2, sp[1] / 2, 0.1, 20), seatMat);
      head.rotation.x = Math.PI / 2; seat.add(head);
      seat.position.set(sp[0], -0.5, -0.82); seat.rotation.z = -sp[0] * 0.08;
      cockpitGroup.add(seat);
    });

    // 2C. Ribbed Side Bulkhead Panels & Fiber-Optic Diagnostic Light Columns (Left & Right walls)
    [-1, 1].forEach(function (side) {
      for (var rb = 0; rb < 4; rb++) {
        var rib = new T.Mesh(new T.BoxGeometry(0.16, 1.65, 0.14), hullDarkMat);
        rib.position.set(side * (1.82 + rb * 0.12), -0.05, -1.25 - rb * 0.22);
        rib.rotation.z = side * 0.12;
        cockpitGroup.add(rib);
      }
    });

    // 2D. Overhead Cockpit Switch Arch & Illuminated Warning Strip
    var overheadArch = new T.Mesh(new T.BoxGeometry(3.6, 0.34, 0.85), hullDarkMat);
    overheadArch.position.set(0, 1.38, -1.48);
    overheadArch.rotation.x = 0.28;
    cockpitGroup.add(overheadArch);

    var overheadBezel = new T.Mesh(new T.BoxGeometry(2.6, 0.08, 0.18), hullMidMat);
    overheadBezel.position.set(0, 1.21, -1.35);
    overheadBezel.rotation.x = 0.28;
    cockpitGroup.add(overheadBezel);

    var switchColors = [0xef4444, 0xf59e0b, 0x38bdf8, 0x4ade80, 0xf8fafc, 0xf59e0b, 0xef4444, 0x38bdf8, 0x4ade80, 0xf59e0b];
    for (var sw = 0; sw < 10; sw++) {
      var swLight = new T.Mesh(new T.BoxGeometry(0.11, 0.042, 0.03), flat(switchColors[sw]));
      swLight.position.set(-1.08 + sw * 0.24, 1.21, -1.25);
      swLight.rotation.x = 0.28;
      cockpitGroup.add(swLight);
    }

    // 2E. Multi-Tiered Wrap-Around Pilot & Co-Pilot Instrument Console
    var mainDash = new T.Mesh(new T.BoxGeometry(4.4, 0.76, 1.45), hullDarkMat);
    mainDash.position.set(0, -1.08, -1.62);
    mainDash.rotation.x = -0.24;
    cockpitGroup.add(mainDash);

    var dashGlareShield = new T.Mesh(new T.BoxGeometry(3.5, 0.09, 0.58), hullMidMat);
    dashGlareShield.position.set(0, -0.68, -1.58);
    dashGlareShield.rotation.x = -0.1;
    cockpitGroup.add(dashGlareShield);

    // 3 Angled Glowing Instrument Screens (Left Radar, Left-Center Targeting Grid, Right Telemetry)
    var radarScreen = new T.Mesh(new T.PlaneGeometry(0.52, 0.32), new T.MeshBasicMaterial({ map: makeCockpitScreenTex('radar') }));
    radarScreen.position.set(-1.02, -0.62, -1.38);
    radarScreen.rotation.x = -0.42;
    radarScreen.rotation.y = 0.24;
    cockpitGroup.add(radarScreen);

    var navScreen = new T.Mesh(new T.PlaneGeometry(0.44, 0.28), new T.MeshBasicMaterial({ map: makeCockpitScreenTex('nav') }));
    navScreen.position.set(-0.48, -0.63, -1.44);
    navScreen.rotation.x = -0.42;
    navScreen.rotation.y = 0.08;
    cockpitGroup.add(navScreen);

    var diagScreen = new T.Mesh(new T.PlaneGeometry(0.52, 0.32), new T.MeshBasicMaterial({ map: makeCockpitScreenTex('diag') }));
    diagScreen.position.set(1.02, -0.62, -1.38);
    diagScreen.rotation.x = -0.42;
    diagScreen.rotation.y = -0.24;
    cockpitGroup.add(diagScreen);

    // 2F. Four-lever drive throttle
    var throttleGroup = new T.Group();
    throttleGroup.position.set(0.16, -0.6, -1.3);
    var throttleBox = new T.Mesh(new T.BoxGeometry(0.32, 0.06, 0.28), hullMidMat);
    throttleGroup.add(throttleBox);

    var leverPivot = new T.Group();
    throttleGroup.add(leverPivot);
    [-0.09, -0.03, 0.03, 0.09].forEach(function (lx, li) {
      var stem = new T.Mesh(new T.CylinderGeometry(0.011, 0.011, 0.22, 8), chromeMat);
      stem.position.set(lx, 0.11, 0);
      leverPivot.add(stem);
      var grip = new T.Mesh(new T.BoxGeometry(0.042, 0.035, 0.045), li % 2 === 0 ? glowCyanMat : flat(0xf8fafc));
      grip.position.set(lx, 0.22, 0);
      leverPivot.add(grip);
    });
    cockpitGroup.add(throttleGroup);

    var slotPanel = new T.Mesh(new T.BoxGeometry(0.34, 0.03, 0.2), panelMat);
    slotPanel.position.set(0.16, -0.635, -1.24); slotPanel.rotation.x = 0.5; cockpitGroup.add(slotPanel);
    [-0.105, -0.035, 0.035, 0.105].forEach(function (sx) {
      var sl = new T.Mesh(new T.BoxGeometry(0.03, 0.005, 0.15), flat(0xcbd5e1));
      sl.position.set(0.16 + sx, -0.615, -1.235); sl.rotation.x = 0.5; cockpitGroup.add(sl);
    });
    [[0.42, -0.6], [0.42, -0.66]].forEach(function (rp) {
      var rb = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.012, 12), flat(0xef4444));
      rb.rotation.x = Math.PI / 2 - 0.5; rb.position.set(rp[0], rp[1], -1.3); cockpitGroup.add(rb);
    });
    var miniScreen = new T.Mesh(new T.PlaneGeometry(0.1, 0.08), new T.MeshBasicMaterial({ map: makeCockpitScreenTex('nav') }));
    miniScreen.position.set(-0.2, -0.59, -1.36); miniScreen.rotation.x = -0.3; cockpitGroup.add(miniScreen);

    // 2G. Dual Pilot & Co-Pilot Steering Yokes (Tilt when banking!)
    var yokes = [];
    [-0.58, 0.76].forEach(function (yx) {
      var yg = new T.Group();
      yg.position.set(yx, -0.74, -1.18);
      var shaft = new T.Mesh(new T.CylinderGeometry(0.024, 0.03, 0.28, 10), hullMidMat);
      shaft.rotation.x = Math.PI / 3;
      yg.add(shaft);
      var wheel = new T.Mesh(new T.TorusGeometry(0.125, 0.018, 8, 20, Math.PI * 1.35), strutMat);
      wheel.position.set(0, 0.11, 0.1);
      wheel.rotation.z = Math.PI * 0.82;
      yg.add(wheel);
      cockpitGroup.add(yg);
      yokes.push(wheel);
    });

    // 2H. Center 3D Holographic Navicomputer Projector
    var holoBase = new T.Mesh(new T.CylinderGeometry(0.21, 0.25, 0.06, 20), hullMidMat);
    holoBase.position.set(0, -0.64, -1.38);
    cockpitGroup.add(holoBase);
    var holoRing = new T.Mesh(new T.TorusGeometry(0.19, 0.012, 8, 24), glowCyanMat);
    holoRing.rotation.x = Math.PI / 2;
    holoRing.position.set(0, -0.60, -1.38);
    cockpitGroup.add(holoRing);
    var holoGlobe = new T.Mesh(
      new T.IcosahedronGeometry(0.135, 1),
      new T.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.72 })
    );
    holoGlobe.position.set(0, -0.44, -1.38);
    cockpitGroup.add(holoGlobe);
    holoBase.visible = holoRing.visible = holoGlobe.visible = false;

    // 2H2. Button-dense consoles (dash wings, side consoles, overhead). Every button
    //      lives in one InstancedMesh per panel; a few blink to keep the ship alive.
    var BTN_COLS = [0x6b665c, 0x3f3c37, 0x2a2e35, 0x2a2e35, 0x3f3c37, 0xe2e8f0, 0x60a5fa, 0xef4444];   // mostly dark keys, a few lit
    var blinkers = [];
    function buttonPanel(w, d, cols, rows, pos, rot, seed, toggles) {
      var g = new T.Group();
      g.position.copy(pos); g.rotation.set(rot[0], rot[1], rot[2] || 0, 'YXZ');
      var slab = new T.Mesh(new T.BoxGeometry(w, 0.04, d), panelMat); g.add(slab);
      var bg = toggles ? new T.CylinderGeometry(0.006, 0.006, 0.05, 5) : new T.BoxGeometry(w / cols * 0.62, 0.014, d / rows * 0.6);
      var im = new T.InstancedMesh(bg, new T.MeshBasicMaterial(), cols * rows);
      var r = K.rng(seed), m4 = new T.Matrix4(), q = new T.Quaternion(), c = new T.Color(), n = 0, lit = [];
      for (var a = 0; a < cols; a++) for (var b = 0; b < rows; b++) {
        var y = toggles ? 0.04 : 0.027;
        q.setFromEuler(new T.Euler(toggles ? (r() < 0.5 ? 0.5 : -0.5) : 0, 0, 0));
        m4.compose(new T.Vector3(-w / 2 + (a + 0.5) * w / cols, y, -d / 2 + (b + 0.5) * d / rows), q, new T.Vector3(1, 1, 1));
        im.setMatrixAt(n, m4);
        var col = toggles ? 0xd6d3d1 : BTN_COLS[Math.floor(r() * BTN_COLS.length)];
        im.setColorAt(n, c.setHex(col));
        if (!toggles && (col === 0xe2e8f0 || col === 0x60a5fa || col === 0xef4444) && r() < 0.5) lit.push({ i: n, col: col });
        n++;
      }
      g.add(im);
      if (lit.length) blinkers.push({ im: im, lit: lit, r: r });
      cockpitGroup.add(g);
      return g;
    }
    // dash wings either side of the nav globe
    buttonPanel(0.62, 0.24, 14, 5, new T.Vector3(-0.78, -0.6, -1.32), [0.42, 0.18], 11);
    buttonPanel(0.62, 0.24, 14, 5, new T.Vector3(0.78, -0.6, -1.32), [0.42, -0.18], 12);
    // side consoles angled toward the pilot
    // overhead switch panel (toggles), facing down at the pilot
    var blinkT = 0;
    function blinkButtons(dt) {
      blinkT += dt; if (blinkT < 0.35) return; blinkT = 0;
      var c = new T.Color();
      blinkers.forEach(function (bk) {
        for (var k = 0; k < 2; k++) {
          var L = bk.lit[Math.floor(bk.r() * bk.lit.length)];
          L.on = !L.on;
          bk.im.setColorAt(L.i, c.setHex(L.on ? 0x2a2e35 : L.col));
        }
        bk.im.instanceColor.needsUpdate = true;
      });
    }

    // =========================================================================
    // 2I. EXTERIOR FREIGHTER (chase view): saucer hull, forward mandibles,
    //     offset cockpit tube, sensor dish, top turret, glowing engine arc.
    // =========================================================================
    var shipGroup = new T.Group();
    (function buildFreighter() {
      // Light-freighter silhouette: flat lens saucer, twin forward mandibles,
      // starboard cockpit on an angled corridor, wide stern engine glow.
      // Hull plating texture. On a cylinder side u runs round the hull and v up it,
      // so vertical bands become radial ribs and rows become concentric rings.
      function hullTex(seed, hatches) {
        var r = K.rng(seed);
        var tx = makeCanvasTex(1024, 256, function (g, w, h) {
          g.fillStyle = '#8e8a83'; g.fillRect(0, 0, w, h);
          for (var n = 0; n < 420; n++) {                       // plates
            var pw = 16 + r() * 70, ph = 10 + r() * 50, px = r() * w, py = r() * h, v = 112 + Math.floor(r() * 60);
            g.fillStyle = 'rgb(' + v + ',' + (v - 3) + ',' + (v - 8) + ')'; g.fillRect(px, py, pw, ph);
            g.strokeStyle = 'rgba(30,28,25,.45)'; g.lineWidth = 1; g.strokeRect(px + 0.5, py + 0.5, pw, ph);
          }
          for (var k = 0; k < 6; k++) {                         // a few rust-red panels
            g.fillStyle = 'rgba(122,59,46,' + (0.5 + r() * 0.4) + ')'; g.fillRect(r() * w, r() * h, 18 + r() * 40, 8 + r() * 26);
          }
          for (var rb = 0; rb < 12; rb++) {                     // radial ribs
            var x = (rb + 0.5) * w / 12;
            g.fillStyle = 'rgba(40,38,35,.85)'; g.fillRect(x - 7, 0, 14, h);
            g.fillStyle = 'rgba(210,206,198,.55)'; g.fillRect(x - 9, 0, 2, h);
          }
          if (hatches) for (var hc = 0; hc < 9; hc++) {         // round hatches near the rim
            var hx = (hc + 0.15 + r() * 0.5) * w / 9, hy = h * (0.18 + r() * 0.3), hr = 12 + r() * 9;
            g.fillStyle = '#5d5a54'; g.beginPath(); g.arc(hx, hy, hr, 0, Math.PI * 2); g.fill();
            g.strokeStyle = '#2a2825'; g.lineWidth = 3; g.stroke();
            g.fillStyle = '#9b978f'; g.beginPath(); g.arc(hx, hy, hr * 0.55, 0, Math.PI * 2); g.fill();
          }
          for (var gm = 0; gm < 60; gm++) {                     // grime
            var gx = r() * w, gy = r() * h, gr2 = g.createRadialGradient(gx, gy, 0, gx, gy, 10 + r() * 40);
            gr2.addColorStop(0, 'rgba(25,22,18,' + (0.12 + r() * 0.2) + ')'); gr2.addColorStop(1, 'rgba(25,22,18,0)');
            g.fillStyle = gr2; g.fillRect(gx - 50, gy - 50, 100, 100);
          }
        });
        tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.anisotropy = 4;
        return tx;
      }
      var topTex = hullTex(3, true), botTex = hullTex(9, true), plateTex = hullTex(5, false);
      plateTex.repeat.set(0.45, 0.9);
      var hullL = mat(0xc9c5bd, 0.85, 0.15, { map: plateTex }), hullD = mat(0x8a867f, 0.9, 0.1), dark = mat(0x2b2925, 0.75, 0.25), rust = mat(0x7a3b2e, 0.85, 0.1);
      var lensTop = mat(0xc9c5bd, 0.85, 0.15, { map: topTex }), lensBot = mat(0x9a968e, 0.9, 0.1, { map: botTex }), tubeMat = mat(0xa9a59d, 0.85, 0.15);
      function tube(p1, p2, r1, r2, m) {
        var d = new T.Vector3().subVectors(p2, p1), g = new T.CylinderGeometry(r2, r1, d.length(), 16);
        var me = new T.Mesh(g, m); me.position.copy(p1).add(p2).multiplyScalar(0.5);
        me.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return me;
      }
      // 1. Saucer + mandibles as one extruded top-view outline (x, z), forward = -z
      var R0 = 1.6, MX = 0.6, GAP = 0.13, TIP = -2.62, ROOT = -1.5;
      var sh = new T.Shape(), a0 = Math.atan2(-Math.sqrt(R0 * R0 - MX * MX), MX);
      sh.moveTo(MX, -Math.sqrt(R0 * R0 - MX * MX));
      // walk the circle from the right mandible root, round the stern, to the left root
      var start = Math.atan2(-Math.sqrt(R0 * R0 - MX * MX), MX), end = Math.atan2(-Math.sqrt(R0 * R0 - MX * MX), -MX) + Math.PI * 2;
      for (var k = 1; k <= 56; k++) { var t = start + (end - start) * k / 56; sh.lineTo(Math.cos(t) * R0, Math.sin(t) * R0); }
      sh.lineTo(-MX, TIP + 0.16); sh.lineTo(-MX + 0.12, TIP); sh.lineTo(-GAP, TIP);
      sh.lineTo(-GAP, ROOT); sh.lineTo(GAP, ROOT);
      sh.lineTo(GAP, TIP); sh.lineTo(MX - 0.12, TIP); sh.lineTo(MX, TIP + 0.16);
      var sg = new T.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.1, bevelSegments: 2, curveSegments: 4 });
      sg.rotateX(Math.PI / 2); sg.translate(0, 0.06, 0);
      shipGroup.add(new T.Mesh(sg, hullL));
      // lens domes top and bottom
      var top = new T.Mesh(new T.CylinderGeometry(0.95, 1.42, 0.17, 40), lensTop); top.position.y = 0.21; shipGroup.add(top);
      var topCap = new T.Mesh(new T.CylinderGeometry(0.62, 0.95, 0.06, 40), lensBot); topCap.position.y = 0.32; shipGroup.add(topCap);
      var bot = new T.Mesh(new T.CylinderGeometry(1.42, 0.95, 0.15, 40), lensBot); bot.position.y = -0.2; shipGroup.add(bot);
      // 2. Radial trenches + panel patches on the upper hull
      function slopeY(r) { return 0.295 - (r - 0.95) / 0.47 * 0.17; }   // upper lens surface
      for (var rt = 0; rt < 10; rt++) {
        var ra = rt / 10 * Math.PI * 2 + 0.31;
        var tr = new T.Mesh(new T.BoxGeometry(0.035, 0.03, 0.7), dark);
        tr.position.set(Math.cos(ra) * 1.18, slopeY(1.18) + 0.01, Math.sin(ra) * 1.18);
        tr.rotation.set(0.35, -ra + Math.PI / 2, 0, 'YXZ'); shipGroup.add(tr);
      }
      var gr = K.rng(7);
      for (var gi = 0; gi < 16; gi++) {
        var ga = gr() * Math.PI * 2, gd = 1.0 + gr() * 0.38;
        if (Math.sin(ga) < -0.75) continue;                     // keep the mandible root clean
        var gb = new T.Mesh(new T.BoxGeometry(0.12 + gr() * 0.2, 0.025, 0.1 + gr() * 0.16), gi % 7 === 0 ? rust : gi % 2 ? hullD : mat(0x4a4843, 0.85, 0.2));
        gb.position.set(Math.cos(ga) * gd, slopeY(gd) + 0.008, Math.sin(ga) * gd);
        gb.rotation.y = -ga; gb.rotation.z = -0.35; shipGroup.add(gb);
      }
      // mandible deck plates + loading slot shadow
      [-1, 1].forEach(function (sx) {
        var plate = new T.Mesh(new T.BoxGeometry(0.34, 0.03, 0.9), hullD);
        plate.position.set(sx * (MX + GAP) / 2, 0.14, -2.05); shipGroup.add(plate);
        // port / starboard docking rings
        var dock = tube(new T.Vector3(sx * 1.55, 0.02, 0.15), new T.Vector3(sx * 1.78, 0.02, 0.15), 0.13, 0.13, hullD); shipGroup.add(dock);
        var ring = tube(new T.Vector3(sx * 1.78, 0.02, 0.15), new T.Vector3(sx * 1.82, 0.02, 0.15), 0.16, 0.16, dark); shipGroup.add(ring);
      });
      // 3. Starboard cockpit: angled corridor -> cone -> round glazed nose
      var c0 = new T.Vector3(1.2, 0.08, -0.55), c1 = new T.Vector3(1.86, 0.1, -1.38);
      shipGroup.add(tube(c0, c1, 0.15, 0.15, tubeMat));
      var c2 = new T.Vector3(1.9, 0.11, -1.86);
      shipGroup.add(tube(c1, c2, 0.24, 0.13, tubeMat));
      var noseGlass = new T.Mesh(new T.CircleGeometry(0.12, 16), flat(0x7dd3fc));
      noseGlass.position.copy(c2).add(new T.Vector3(0, 0, -0.003)); noseGlass.rotation.y = Math.PI; shipGroup.add(noseGlass);
      for (var pn = 0; pn < 6; pn++) {               // window mullions round the cone
        var pa = pn / 6 * Math.PI * 2;
        var m1 = new T.Vector3(c2.x + Math.cos(pa) * 0.12, c2.y + Math.sin(pa) * 0.12, c2.z);
        var m2 = new T.Vector3(c1.x + Math.cos(pa) * 0.2, c1.y + Math.sin(pa) * 0.2, c1.z + 0.12);
        shipGroup.add(makeStrutBetween(m1, m2, 0.018, dark));
      }
      // 4. Top turret + front-starboard sensor dish
      var turret = new T.Mesh(new T.CylinderGeometry(0.24, 0.28, 0.08, 20), dark); turret.position.y = 0.38; shipGroup.add(turret);
      var dome = new T.Mesh(new T.SphereGeometry(0.15, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), flat(0x9fd4ff, { transparent: true, opacity: 0.75 }));
      dome.position.y = 0.42; shipGroup.add(dome);
      [-0.08, 0.08].forEach(function (bx) {
        var barrel = tube(new T.Vector3(bx, 0.48, 0), new T.Vector3(bx, 0.5, -0.32), 0.012, 0.012, dark); shipGroup.add(barrel);
      });
      var mast = tube(new T.Vector3(0.62, 0.3, -0.62), new T.Vector3(0.66, 0.48, -0.66), 0.03, 0.03, dark); shipGroup.add(mast);
      var dish = new T.Mesh(new T.CylinderGeometry(0.26, 0.04, 0.1, 20, 1, true), mat(0xc9c5bc, 0.6, 0.25, { side: T.DoubleSide }));
      dish.position.set(0.66, 0.52, -0.66); dish.rotation.set(-0.7, 0, 0.3); shipGroup.add(dish);
      // 5. Stern engine: a thick rim wall with a recessed slot; inside it a row
      //    of separate glowing vent cells (white core, cyan edge) behind dark
      //    dividers, under two additive glow layers and a line of bloom sprites.
      var ARC = 2.75, RW = 1.7;                          // arc centred on the stern (+z)
      function ribbon(r, h, tex, m, start, len) {
        var g = new T.CylinderGeometry(r, r, h, 72, 1, true, start, len);
        return new T.Mesh(g, m || new T.MeshBasicMaterial({ map: tex, toneMapped: false, side: T.DoubleSide }));
      }
      // rim wall all the way round (panelled), the engine sits in it
      var wallTex = hullTex(21, false); wallTex.repeat.set(3, 1);
      var wall = ribbon(RW - 0.01, 0.24, null, mat(0x8a867f, 0.85, 0.15, { map: wallTex, side: T.DoubleSide }), 0, Math.PI * 2);
      wall.position.y = 0.03; shipGroup.add(wall);
      var CELLS = 44;
      var ventTex = makeCanvasTex(2048, 64, function (g, w, h) {
        g.fillStyle = '#05080c'; g.fillRect(0, 0, w, h);
        var cw = w / CELLS;
        for (var c = 0; c < CELLS; c++) {
          var x0 = c * cw + cw * 0.12, ww = cw * 0.76;
          var gr = g.createLinearGradient(0, 6, 0, h - 6);
          gr.addColorStop(0, '#1479ff'); gr.addColorStop(0.3, '#7fd8ff'); gr.addColorStop(0.5, '#e6fbff'); gr.addColorStop(0.7, '#7fd8ff'); gr.addColorStop(1, '#1479ff');
          g.fillStyle = gr; K.rr(g, x0, 7, ww, h - 14, 6); g.fill();
          g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(x0 + ww * 0.25, h * 0.45, ww * 0.5, h * 0.1);
        }
      });
      var vents = ribbon(RW + 0.004, 0.11, ventTex, null, -ARC / 2, ARC); vents.position.y = 0.035; shipGroup.add(vents);
      // slot lips above and below the vents
      [0.1, -0.03].forEach(function (ly) {
        var lip = ribbon(RW + 0.03, 0.025, null, mat(0x3a3834, 0.6, 0.5, { side: T.DoubleSide }), -ARC / 2 - 0.02, ARC + 0.04);
        lip.position.y = ly; shipGroup.add(lip);
      });
      // exhaust grille boxes on the upper hull just ahead of the vents
      for (var gx = 0; gx < 9; gx++) {
        var ga2 = -ARC / 2 + (gx + 0.5) * ARC / 9, gbx = new T.Mesh(new T.BoxGeometry(0.22, 0.035, 0.12), dark);
        gbx.position.set(Math.sin(ga2) * 1.5, 0.15, Math.cos(ga2) * 1.5); gbx.rotation.y = ga2; shipGroup.add(gbx);
      }
      // glow layers: soft vertical falloff, additive
      function glowTex(core) {
        return makeCanvasTex(256, 128, function (g, w, h) {
          var gr = g.createLinearGradient(0, 0, 0, h);
          gr.addColorStop(0, 'rgba(20,110,255,0)'); gr.addColorStop(0.5 - core, 'rgba(40,160,255,.6)');
          gr.addColorStop(0.5, 'rgba(150,225,255,.95)'); gr.addColorStop(0.5 + core, 'rgba(40,160,255,.6)'); gr.addColorStop(1, 'rgba(20,110,255,0)');
          g.fillStyle = gr; g.fillRect(0, 0, w, h);
        });
      }
      function glowMat(tex, op) { return new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: op, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, toneMapped: false }); }
      var glowIn = ribbon(RW + 0.02, 0.26, null, glowMat(glowTex(0.12), 0.9), -ARC / 2, ARC); glowIn.position.y = 0.035; shipGroup.add(glowIn);
      var halo = ribbon(RW + 0.07, 0.62, null, glowMat(glowTex(0.2), 0.6), -ARC / 2 - 0.05, ARC + 0.1); halo.position.y = 0.035; shipGroup.add(halo);
      // bloom sprites along the arc
      var bloomTex = makeCanvasTex(64, 64, function (g, w, h) {
        var rg = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        rg.addColorStop(0, 'rgba(170,230,255,.9)'); rg.addColorStop(0.3, 'rgba(40,150,255,.5)'); rg.addColorStop(1, 'rgba(20,110,255,0)');
        g.fillStyle = rg; g.fillRect(0, 0, w, h);
      });
      var bloomMat = new T.SpriteMaterial({ map: bloomTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.7 });
      for (var bs = 0; bs < 14; bs++) {
        var ba = -ARC / 2 + (bs + 0.5) * ARC / 14, sp = new T.Sprite(bloomMat);
        sp.position.set(Math.sin(ba) * (RW + 0.12), 0.035, Math.cos(ba) * (RW + 0.12)); sp.scale.set(1.0, 0.55, 1);
        shipGroup.add(sp);
      }
      var engMat = glowIn.material;
      var engLight = new T.PointLight(0x7dd3fc, 1.2, 3, 2); engLight.position.set(0, 0.05, 2.1); shipGroup.add(engLight);
      // raised round hatches on the upper lens
      for (var hh = 0; hh < 6; hh++) {
        var ha = hh / 6 * Math.PI * 2 + 0.5;
        if (Math.cos(ha) > 0.8) continue;
        var hatch = new T.Mesh(new T.CylinderGeometry(0.11, 0.12, 0.03, 16), mat(0x5c5953, 0.8, 0.3));
        hatch.position.set(Math.cos(ha) * 1.12, slopeY(1.12) + 0.012, Math.sin(ha) * 1.12);
        hatch.rotation.set(0, -ha, -0.35, 'YXZ'); shipGroup.add(hatch);
      }
      var bounce = new T.PointLight(0xff8a3d, 1.1, 7, 1.6); bounce.position.set(0.6, -2.4, 0.4); shipGroup.add(bounce);
      shipGroup.userData = { engMat: engMat, halo: halo, bloom: bloomMat };
    })();
    shipGroup.position.set(0, -1.3, -7.2);
    shipGroup.scale.setScalar(1);
    shipGroup.visible = false;
    cam.add(shipGroup);

    // view: 'cockpit' | 'chase' | 'open' (cycled by the view button)
    var VIEWS = ['cockpit', 'chase', 'open'];
    var VIEW_LABEL = { cockpit: '🪟 <span>Cockpit</span>', chase: '🛸 <span>Chase</span>', open: '✨ <span>Open View</span>' };
    function applyView() {
      var inSpace = st.phase !== 'surface';
      cockpitGroup.visible = inSpace && st.view === 'cockpit';
      shipGroup.visible = inSpace && st.view === 'chase' && st.phase !== 'landing';
    }

    // =========================================================================
    // 3. MULTI-PLANET 3D STAR SYSTEM WITH FLOATING 3D PLANET TITLES
    // =========================================================================
    var systemGroup = new T.Group();
    scene.add(systemGroup);
    var planetNodes = [];

    function buildStarSystem() {
      planets.forEach(function (pl, pi) {
        var B = BIOMES[pl.biomeIdx || 0];
        var pGroup = new T.Group();
        pGroup.position.set(pl.pos.x, pl.pos.y, pl.pos.z);

        // 1. Textured Low-Poly Planet Sphere
        var pGeo = new T.IcosahedronGeometry(pl.radius, 3);
        var pMat = new T.MeshStandardMaterial({
          map: makePlanetTexture(B, 100 + pi * 37),
          roughness: 0.7,
          metalness: 0.08,
          flatShading: true
        });
        var pMesh = new T.Mesh(pGeo, pMat);
        pGroup.add(pMesh);

        // 2. Atmosphere Rim Halo
        var atmoMat = new T.MeshBasicMaterial({
          color: B.atmo,
          transparent: true,
          opacity: 0.2,
          side: T.BackSide
        });
        var atmoMesh = new T.Mesh(new T.IcosahedronGeometry(pl.radius * 1.13, 2), atmoMat);
        pGroup.add(atmoMesh);

        // 3. Planetary Ring
        var ringMat = new T.MeshBasicMaterial({
          color: B.ring,
          transparent: true,
          opacity: (pi % 2 === 0) ? 0.36 : 0.18,
          side: T.DoubleSide
        });
        var ringMesh = new T.Mesh(new T.RingGeometry(pl.radius * 1.36, pl.radius * 1.92, 40), ringMat);
        ringMesh.rotation.x = Math.PI * 0.42;
        ringMesh.rotation.y = (pi % 3 - 1) * 0.25;
        pGroup.add(ringMesh);

        // 4. Nameplate strip floating just below the planet (kept off its face)
        var eqMat = new T.MeshBasicMaterial({
          map: makeOrbitalTitleBandTex(pl, B),
          transparent: true
        });
        var eqBand = new T.Mesh(new T.PlaneGeometry(pl.radius * 2.15, pl.radius * 0.24), eqMat);
        eqBand.position.set(0, -pl.radius * 0.15, pl.radius * 1.06);
        pGroup.add(eqBand);

        // 5. Orbiting Moon
        var moonMesh = new T.Mesh(new T.IcosahedronGeometry(pl.radius * 0.18, 1), mat(0xdbeafe, 0.85, 0.05));
        moonMesh.position.set(pl.radius * 2.2, pl.radius * 0.45, pl.radius * 0.8);
        pGroup.add(moonMesh);

        // 6. Crisp Floating 3D Title Banner directly above the Planet North Pole (proportioned to never clip!)
        var isTarget = (pi === st.pi);
        var bannerMat = new T.MeshBasicMaterial({
          map: makePlanetTitleBanner(pl, B, isTarget),
          transparent: true,
          depthTest: true
        });
        var bannerW = pl.radius * 2.35;
        var bannerH = bannerW * (260 / 1024);
        var bannerMesh = new T.Mesh(new T.PlaneGeometry(bannerW, bannerH), bannerMat);
        bannerMesh.position.set(0, pl.radius * 1.6, 0);
        pGroup.add(bannerMesh);

        addHit(pMesh, function () { onPlanetClicked(pi); });
        addHit(bannerMesh, function () { onPlanetClicked(pi); });
        addHit(eqBand, function () { onPlanetClicked(pi); });

        systemGroup.add(pGroup);
        planetNodes.push({
          pi: pi,
          pl: pl,
          B: B,
          group: pGroup,
          sphere: pMesh,
          ring: ringMesh,
          eqBand: eqBand,
          moon: moonMesh,
          banner: bannerMesh,
          bannerMat: bannerMat,
          homePos: new T.Vector3(pl.pos.x, pl.pos.y, pl.pos.z)
        });
      });
    }
    buildStarSystem();

    function refreshPlanetBanners() {
      planetNodes.forEach(function (node) {
        var full = node.pi === st.pi && st.phase !== 'cockpit';
        node.bannerMat.map = full ? makePlanetTitleBanner(node.pl, node.B, true) : makeTitleOnlyTex(node.pl, node.B);
        node.bannerMat.needsUpdate = true;
        node.eqBand.visible = full;
        node.banner.scale.setScalar(full ? 1 : 1.9);
      });
    }

    function onPlanetClicked(pi) {
      if (st.phase === 'surface' || st.phase === 'hyperspace' || st.phase === 'landing') return;
      if (!planetNodes[pi] || !planetNodes[pi].group.visible) return;
      if (pi === st.pi && st.phase === 'approach') { landOnPlanet(); return; }
      if (st.phase === 'cockpit') {          // the planet passing by right now
        st.pi = pi; st.visited[pi] = true; persist();
        st.fromRoute = true; st.autoLandNear = true;
        setPhase('approach');
        S.toast('🛬 Heading down to ' + curPlanet().title);
        return;
      }
      st.autoLand = true; selectPlanet(pi);
    }

    // =========================================================================
    // 4. PLANETARY SURFACE EXPLORATION SCENE (4 Biomes + Titled Monuments)
    // =========================================================================
    var surfaceGroup = new T.Group();
    surfaceGroup.visible = false;
    scene.add(surfaceGroup);
    var landmarkList = [];

    function rebuildSurface() {
      while (surfaceGroup.children.length) surfaceGroup.remove(surfaceGroup.children[0]);
      clearHits();
      planetNodes.forEach(function (node) {
        addHit(node.sphere, function () { onPlanetClicked(node.pi); });
        addHit(node.banner, function () { onPlanetClicked(node.pi); });
        addHit(node.eqBand, function () { onPlanetClicked(node.pi); });
      });

      landmarkList = [];
      var pl = curPlanet(), B = curBiome();

      var ground = new T.Mesh(new T.CylinderGeometry(80, 80, 0.6, 48), mat(B.ground, 0.9, 0.05));
      ground.position.y = -0.3;
      surfaceGroup.add(ground);

      var padRing = new T.Mesh(new T.RingGeometry(3.2, 3.6, 36), flat(B.atmo));
      padRing.rotation.x = -Math.PI / 2;
      padRing.position.set(0, 0.02, 15.5);
      surfaceGroup.add(padRing);

      // Giant Planet Title Sky Arch on the Horizon
      var skyTitleMat = new T.MeshBasicMaterial({
        map: makePlanetTitleBanner(pl, B, true),
        transparent: true
      });
      var skyBanner = new T.Mesh(new T.PlaneGeometry(20, 5.1), skyTitleMat);
      skyBanner.position.set(0, 11.2, -26);
      surfaceGroup.add(skyBanner);

      var rng = K.rng(K.hash(pl.id) + 17);
      for (var p = 0; p < 34; p++) {
        var ang = rng() * Math.PI * 2;
        var dist = 16 + rng() * 36;
        var px = Math.cos(ang) * dist, pz = Math.sin(ang) * dist - 4;
        if (Math.abs(px) < 9 && pz > -50) continue;   // keep the trail clear
        if (B.id === 'forest') {
          var trunk = new T.Mesh(new T.CylinderGeometry(0.18, 0.26, 1.3, 6), mat(0x5c3a21, 0.9, 0));
          trunk.position.set(px, 0.65, pz);
          surfaceGroup.add(trunk);
          var crown = new T.Mesh(new T.ConeGeometry(1.25, 3.2, 6), mat(B.land2, 0.8, 0.05));
          crown.position.set(px, 2.5, pz);
          surfaceGroup.add(crown);
        } else if (B.id === 'desert') {
          var dune = new T.Mesh(new T.ConeGeometry(2.6 + rng() * 2, 1.8 + rng() * 2.2, 5), mat(B.land, 0.9, 0.05));
          dune.position.set(px, 0.9, pz);
          surfaceGroup.add(dune);
        } else if (B.id === 'ocean') {
          var spire = new T.Mesh(new T.CylinderGeometry(0.25, 0.85, 2.8 + rng() * 2, 7), mat(B.land2, 0.45, 0.25));
          spire.position.set(px, 1.4, pz);
          surfaceGroup.add(spire);
        } else {
          var crystal = new T.Mesh(new T.OctahedronGeometry(1.3 + rng() * 1.3, 0), mat(0xe0f2fe, 0.2, 0.55));
          crystal.position.set(px, 1.3, pz);
          surfaceGroup.add(crystal);
        }
      }

      // Exploration trail: monuments alternate left/right of a winding path that
      // leads away from the landing pad; each region opens with a beacon arch.
      var regs = pl.regions;
      var globalIdx = 0, step = 0;
      function trailX(z) { return Math.sin((15 - z) * 0.11) * 2.4; }
      var stoneMat = flat(B.atmo, { transparent: true, opacity: 0.55 });
      for (var sz = 13; sz > -6 - 4.6 * 20; sz -= 1.5) {
        var stone = new T.Mesh(new T.CircleGeometry(0.32, 7), stoneMat);
        stone.rotation.x = -Math.PI / 2;
        stone.position.set(trailX(sz) + (rng() - 0.5) * 0.4, 0.03, sz);
        surfaceGroup.add(stone);
      }
      var baseMat = {
        forest: mat(0x6b4a2e, 0.85, 0.05),
        desert: mat(0xc9955a, 0.95, 0.02),
        ocean: mat(0x0e7490, 0.35, 0.3, { transparent: true, opacity: 0.85 }),
        ice: mat(0xdbeafe, 0.15, 0.4, { transparent: true, opacity: 0.9 })
      }[B.id] || mat(0x162238, 0.65, 0.35);
      function monumentBase(g) {
        var m;
        if (B.id === 'forest') {           // tree stump lectern
          m = new T.Mesh(new T.CylinderGeometry(0.62, 0.78, 0.95, 9), baseMat);
          m.position.y = 0.475;
          var lamp = new T.Mesh(new T.SphereGeometry(0.09, 8, 6), flat(0xfde68a));
          lamp.position.set(0.75, 1.5, 0); g.add(lamp);
          var post = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 1.5, 5), baseMat);
          post.position.set(0.75, 0.75, 0); g.add(post);
        } else if (B.id === 'desert') {    // sandstone obelisk stub
          m = new T.Mesh(new T.CylinderGeometry(0.5, 0.82, 1.05, 4), baseMat);
          m.rotation.y = Math.PI / 4; m.position.y = 0.525;
        } else if (B.id === 'ocean') {     // glass coral column with a ring
          m = new T.Mesh(new T.CylinderGeometry(0.55, 0.7, 1.0, 12), baseMat);
          m.position.y = 0.5;
          var ring = new T.Mesh(new T.TorusGeometry(0.66, 0.03, 6, 24), flat(B.atmo));
          ring.rotation.x = Math.PI / 2; ring.position.y = 1.02; g.add(ring);
        } else {                           // hexagonal ice plinth with shards
          m = new T.Mesh(new T.CylinderGeometry(0.62, 0.7, 1.0, 6), baseMat);
          m.position.y = 0.5;
          [-0.7, 0.7].forEach(function (sx) {
            var shard = new T.Mesh(new T.OctahedronGeometry(0.28, 0), baseMat);
            shard.scale.y = 2.2; shard.position.set(sx, 0.55, -0.15); g.add(shard);
          });
        }
        g.add(m);
        return m;
      }
      var KIND_SCALE = { orb: 2.1, badge: 2.4, book: 1.9, frame: 1 };

      regs.forEach(function (reg, ri) {
        var bz = 12 - step * 4.6;
        var arch = new T.Group();
        arch.position.set(trailX(bz), 0, bz);
        [-1, 1].forEach(function (side) {
          var pole = new T.Mesh(new T.CylinderGeometry(0.1, 0.12, 4.2, 8), flat(B.atmo));
          pole.position.set(side * 2.1, 2.1, 0); arch.add(pole);
        });
        var rSign = new T.Mesh(
          new T.PlaneGeometry(4.0, 1.15),
          new T.MeshBasicMaterial({ map: makePlaqueTex(reg.title, 'Region ' + (ri + 1) + ' · ' + reg.items.length + ' cards', B.accent), transparent: true })
        );
        rSign.position.set(0, 4.25, 0);
        arch.add(rSign);
        surfaceGroup.add(arch);
        step += 0.6;

        reg.items.forEach(function (it, ii) {
          var idx = globalIdx++;
          var mz = 12 - step * 4.6;
          step += 1;
          var side = idx % 2 ? 1 : -1;
          var mx = trailX(mz) + side * 2.6;

          var mGroup = new T.Group();
          mGroup.position.set(mx, 0, mz);
          mGroup.rotation.y = -side * 0.55;   // turn toward the path

          var plinth = monumentBase(mGroup);

          var kinds = ['frame', 'orb', 'book', 'badge'];
          var kind = kinds[idx % kinds.length];
          var cMesh = X.carriers[kind](it, { w: 1.3, h: 0.84 });
          cMesh.scale.setScalar(KIND_SCALE[kind]);
          cMesh.position.set(0, kind === 'frame' ? 1.62 : 1.0, 0);
          mGroup.add(cMesh);

          var titlePlaque = new T.Mesh(
            new T.PlaneGeometry(2.1, 0.6),
            new T.MeshBasicMaterial({ map: makePlaqueTex(it.I.title, it.I.zh || reg.title, B.accent), transparent: true })
          );
          titlePlaque.position.set(0, kind === 'frame' ? 2.5 : 2.75, 0);
          mGroup.add(titlePlaque);

          surfaceGroup.add(mGroup);

          var tx = trailX(mz);
          var lm = {
            idx: idx, it: it, reg: reg, mesh: cMesh, plinth: plinth, titlePlaque: titlePlaque,
            x: mx, z: mz,
            ax: tx + side * 0.2, az: mz + 2.2      // stand on the path, just before it
          };
          landmarkList.push(lm);

          var onTap = (function (landmarkIdx) {
            return function () {
              if (st.focusIdx === landmarkIdx && !RD.open) pullLandmark(landmarkIdx);
              else focusLandmark(landmarkIdx, true);
            };
          })(idx);
          addHit(cMesh, onTap);
          addHit(plinth, onTap);
          addHit(titlePlaque, onTap);
        });
        step += 0.3;
      });
    }

    // =========================================================================
    // 5. FLIGHT & EXPLORATION TRANSITIONS (Cockpit -> Hyperspace -> Approach -> Land)
    // =========================================================================
    function setPhase(ph) {
      st.phase = ph;
      st.phaseT = 0;
      var B = curBiome();
      var pl = curPlanet();

      // Restore all planet home positions
      planetNodes.forEach(function (n) { n.group.position.copy(n.homePos); n.group.visible = ph !== 'cockpit' && n.pi === st.pi; n.group.scale.setScalar(1); });

      if (ph === 'cockpit' || ph === 'hyperspace' || ph === 'approach' || ph === 'landing') {
        surfaceGroup.visible = false;
        systemGroup.visible = true;
        applyView();
        skyMat.color.set('#020612');
        scene.fog.color.set('#030816');
      }

      if (ph === 'cockpit') {
        overviewPose(st.started);
        st.started = true;
        st.routeCur = -1;
        warpLines.visible = false;
        tunnelGroup.visible = false;
        dustLines.visible = true;
        asteroidGroup.visible = true;
        cam.fov = 62;
        cam.updateProjectionMatrix();
        statusEl.style.display = '';
        statusEl.textContent = '🪐 Cruising · planets pass by one at a time';
      } else if (ph === 'hyperspace') {
        warpLines.visible = true;
        tunnelGroup.visible = true;
        dustLines.visible = false;
        asteroidGroup.visible = false;
        statusEl.style.display = '';
        statusEl.textContent = '⚡ HYPERDRIVE → ' + pl.title.toUpperCase() + ' · TAP TO SKIP';
      } else if (ph === 'approach' && st.fromRoute) {
        st.fromRoute = false;
        warpLines.visible = false; tunnelGroup.visible = false;
        dustLines.visible = true; asteroidGroup.visible = true;
        statusEl.style.display = '';
        statusEl.textContent = '🪐 Approaching ' + pl.title + ' · descending…';
      } else if (ph === 'approach') {
        warpLines.visible = false;
        tunnelGroup.visible = false;
        dustLines.visible = true;
        asteroidGroup.visible = true;
        cam.fov = 60;
        cam.updateProjectionMatrix();
        var dirX = pl.pos.x, dirZ = pl.pos.z;
        var len = Math.hypot(dirX, dirZ) || 1;
        var stopDist = pl.radius * 4.4;
        st.shipPos.x = pl.pos.x - (dirX / len) * stopDist;
        st.shipPos.y = pl.pos.y - pl.radius * 0.05;
        st.shipPos.z = pl.pos.z - (dirZ / len) * stopDist;
        st.yaw = Math.atan2(-(pl.pos.x - st.shipPos.x), -(pl.pos.z - st.shipPos.z));
        st.pitch = 0.02;
        statusEl.style.display = '';
        statusEl.textContent = '🪐 Orbiting ' + pl.title + ' · tap the planet or 🛬 Land to descend';
      } else if (ph === 'landing') {
        warpLines.visible = false;
        tunnelGroup.visible = false;
        dustLines.visible = true;
        asteroidGroup.visible = false;
        statusEl.style.display = '';
        statusEl.textContent = '🛬 Atmospheric Entry into ' + pl.title + ' (' + B.name + ')…';
      } else if (ph === 'surface') {
        warpLines.visible = false;
        tunnelGroup.visible = false;
        dustLines.visible = false;
        asteroidGroup.visible = false;
        applyView();
        systemGroup.visible = false;
        surfaceGroup.visible = true;
        cam.fov = 58;
        cam.rotation.z = 0;
        cam.updateProjectionMatrix();
        statusEl.style.display = 'none';
        skyMat.color.set(B.skyBot);
        scene.fog.color.setHex(B.fog);
        rebuildSurface();
        cur.x = 0; cur.y = 1.75; cur.z = 16.5; cur.yaw = 0; cur.pitch = -0.03;
        tgt.x = 0; tgt.y = 1.75; tgt.z = 14.5; tgt.yaw = 0; tgt.pitch = -0.03;
      }
      refreshPlanetBanners();
      ui();
    }

    function selectPlanet(pi) {
      pi = clamp(pi, 0, planets.length - 1);
      if (RD.open) RD.back(true);
      st.pi = pi;
      st.visited[pi] = true;
      persist();
      startHyperspace();
    }

    function startHyperspace() {
      if (RD.open) RD.back(true);
      var pl = curPlanet();
      st.yaw = Math.atan2(-(pl.pos.x - st.shipPos.x), -(pl.pos.z - st.shipPos.z));
      st.pitch = 0;
      setPhase('hyperspace');
      S.toast('⚡ Hyperdrive Engaged · Jumping to ' + pl.title);
    }

    function finishHyperspace() {
      setPhase('approach');
      if (st.autoLand) {
        st.autoLand = false;
        clearTimeout(st.landT);
        st.landT = setTimeout(function () { if (st.phase === 'approach' && S.alive) landOnPlanet(); }, reducedMotion ? 500 : 1500);
      }
      S.toast('🪐 Arrived in orbit around ' + curPlanet().title);
    }

    function approachPlanet() {
      if (st.phase === 'surface') returnToShip();
      setPhase('approach');
    }

    function landOnPlanet() {
      if (RD.open) RD.back(true);
      if (st.phase === 'cockpit') { onPlanetClicked(st.pi); return; }   // the planet passing by
      if (st.phase === 'surface') {
        S.toast('🧑‍🚀 Already on ' + curPlanet().title + ' · Tap any monument to inspect');
        return;
      }
      setPhase('landing');
    }

    function returnToShip() {
      if (RD.open) RD.back(true);
      st.autoExplore = false;
      st.focusIdx = -1;
      setPhase('approach');
      S.toast('🚀 Back in the cockpit, orbiting ' + curPlanet().title);
    }

    function focusLandmark(idx, openAfter) {
      var lm = landmarkList[idx];
      if (!lm) return;
      if (RD.open) RD.back(true);
      st.focusIdx = idx;
      st.autoExplore = false;
      tgt.x = lm.ax;
      tgt.z = lm.az;
      tgt.y = 1.72;
      tgt.yaw = Math.atan2(tgt.x - lm.x, tgt.z - lm.z);
      tgt.pitch = 0.04;
      st.onArrive = openAfter ? function () { pullLandmark(idx); } : null;
      ui();
    }

    function pullLandmark(idx) {
      var lm = landmarkList[idx != null ? idx : st.focusIdx];
      if (!lm) return;
      st.focusIdx = lm.idx;
      RD.pull(lm.mesh, lm.it, { dist: 1.55 });
      ui();
    }

    // =========================================================================
    // 6. HUD & INTERACTIVE 3D GALAXY STAR CHART
    // =========================================================================
    function ui() {
      var pl = curPlanet(), B = curBiome();
      var phaseTitle =
        st.phase === 'cockpit' ? ('🚀 Cockpit · ' + pl.title) :
        st.phase === 'hyperspace' ? ('⚡ Hyperspace → ' + pl.title) :
        st.phase === 'approach' ? ('🪐 Orbiting ' + pl.title) :
        st.phase === 'landing' ? ('🛬 Landing on ' + pl.title) :
        (B.icon + ' ' + pl.title + ' Surface');

      S.$('.kx-pill i').style.background = B.accent;
      S.$('.kx-pill b').textContent = RD.open && RD.item() ? RD.item().I.title : phaseTitle;
      S.$('.kx-pill small').textContent = B.name + ' · ' + pl.regions.length + ' regions · ' + pl.all.length + ' cards';

      var bWarp = S.$('.kg-b-warp');
      if (bWarp) bWarp.innerHTML = (st.phase === 'approach' || st.phase === 'surface') ? '🛣 <span>Back to Route</span>' : '⚡ <span>Jump Ahead</span>';
      var bCruise = S.$('.kg-b-cruise');
      if (bCruise) {
        if (st.phase === 'surface') {
          bCruise.classList.toggle('on', st.autoExplore);
          bCruise.innerHTML = (st.autoExplore ? '⏸ <span>Pause</span>' : '🚶 <span>Explore</span>');
        } else {
          bCruise.classList.toggle('on', st.cruise);
          bCruise.innerHTML = (st.cruise ? '🚀 <span>Cruising</span>' : '⏸ <span>Paused</span>');
        }
      }

      var bCockpit = S.$('.kg-b-cockpit');
      if (bCockpit) {
        if (st.phase === 'surface') {
          bCockpit.classList.remove('on');
          bCockpit.innerHTML = '🚀 <span>Return Ship</span>';
        } else {
          bCockpit.classList.toggle('on', st.view !== 'open');
          bCockpit.innerHTML = VIEW_LABEL[st.view];
        }
      }
    }

    function toggleGalaxyMap() {
      var sh = S.$('.kx-sheet');
      if (!sh.hidden) { sh.hidden = true; return; }
      var body = S.$('.kg-map-body');
      body.innerHTML = '<div class="kg-starmap"></div>';
      var grid = body.querySelector('.kg-starmap');

      planets.forEach(function (pl, pi) {
        var B = BIOMES[pl.biomeIdx || 0];
        var isCur = pi === st.pi;
        var isVis = !!st.visited[pi];
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'kg-planet-card' + (isCur ? ' on' : '');
        card.innerHTML =
          '<div class="kg-planet-top">' +
            '<div class="kg-planet-orb" style="background:radial-gradient(circle at 32% 30%, ' + B.accent + ', #0b192e);--orb-glow:' + B.accent + '66">' + B.icon + '</div>' +
            '<div class="kg-planet-meta"><b>' + K.esc(pl.title) + '</b><small>' + K.esc(B.name) + ' · ' + pl.regions.length + ' regions</small></div>' +
          '</div>' +
          '<div class="kg-planet-foot">' +
            '<span>' + (isVis ? '✓ Visited' : '○ Uncharted') + ' · ' + pl.all.length + ' cards</span>' +
            '<span style="color:#f2c13d;font-weight:700">' + (isCur ? (st.phase === 'surface' ? 'On Surface' : 'Current Orbit') : '⚡ Hyperspace ›') + '</span>' +
          '</div>';
        card.addEventListener('click', function () {
          sh.hidden = true;
          selectPlanet(pi);
        });
        grid.appendChild(card);
      });
      sh.hidden = false;
    }

    S.onAct = function (k) {
      if (k === 'exit') { self.close(); return; }
      if (k === 'map') toggleGalaxyMap();
      else if (k === 'warp') {
        if (st.phase === 'approach' || st.phase === 'surface') { if (RD.open) RD.back(true); clearTimeout(st.landT); setPhase('cockpit'); S.toast('🛣 Back on the route'); }
        else selectPlanet((st.pi + 1) % planets.length);   // jump ahead to the next planet
      } else if (k === 'land') {
        landOnPlanet();
      } else if (k === 'cruise' || k === 'auto') {
        if (st.phase === 'surface') {
          st.autoExplore = !st.autoExplore;
          if (st.autoExplore && landmarkList.length) {
            var nx = (st.focusIdx + 1) % landmarkList.length;
            focusLandmark(nx, false);
          }
        } else {
          st.cruise = !st.cruise;
          S.toast(st.cruise ? '🚀 Cruise resumed · drag to steer' : '⏸ Space Cruise Paused');
        }
        ui();
      } else if (k === 'cockpit' || k === 'return') {
        if (st.phase === 'surface') {
          returnToShip();
        } else {
          st.view = VIEWS[(VIEWS.indexOf(st.view) + 1) % VIEWS.length];
          applyView(); persist();
          S.toast({ cockpit: '🪟 Cockpit view', chase: '🛸 Chase view · watch the ship fly', open: '✨ Open view' }[st.view]);
          ui();
        }
      } else if (k === 'prev' && st.phase === 'surface' && landmarkList.length) {
        var pIdx = (Math.max(0, st.focusIdx) - 1 + landmarkList.length) % landmarkList.length;
        focusLandmark(pIdx, false);
      } else if (k === 'next' && st.phase === 'surface' && landmarkList.length) {
        var nIdx = (st.focusIdx + 1) % landmarkList.length;
        focusLandmark(nIdx, false);
      }
    };

    S.onTap = function (e) {
      if (RD.open) {
        var rh = S.pick(e.clientX, e.clientY, RD.meshes);
        if (RD.hit(rh)) RD.flip();
        else RD.back();
        return;
      }
      var h = S.pick(e.clientX, e.clientY, hitObjects);
      if (h && h.object) {
        var curObj = h.object;
        while (curObj) {
          if (hitMap.has(curObj)) {
            hitMap.get(curObj)();
            return;
          }
          curObj = curObj.parent;
        }
      }
    };

    S.onDrag = function (dx, dy) {
      if (RD.open) return;
      if (st.phase === 'surface') {
        st.autoExplore = false;
        tgt.yaw += dx * 0.0045;
        tgt.pitch = clamp(tgt.pitch + dy * 0.003, -0.35, 0.45);
      } else if (st.phase === 'cockpit' || st.phase === 'approach') {
        st.yaw += dx * 0.0042;
        st.pitch = clamp(st.pitch + dy * 0.0028, -0.42, 0.45);
        st.bank = clamp(st.bank - dx * 0.0025, -0.28, 0.28);
      }
    };

    S.onWheel = function (d) {
      if (RD.open) return;
      if (st.phase === 'surface') {
        st.autoExplore = false;
        tgt.x -= Math.sin(tgt.yaw) * d * 0.012;
        tgt.z -= Math.cos(tgt.yaw) * d * 0.012;
      } else if (st.phase === 'cockpit' || st.phase === 'approach') {
        var step = -d * 0.035;
        st.shipPos.x -= Math.sin(st.yaw) * step;
        st.shipPos.z -= Math.cos(st.yaw) * step;
      }
    };

    S.onKey = function (e) {
      if (RD.open) {
        if (e.key === 'f' || e.key === 'F' || e.key === ' ') { e.preventDefault(); RD.flip(); }
        else if (e.key === 'Escape') { e.preventDefault(); RD.back(); }
        return;
      }
      if (e.key === 'm' || e.key === 'M') toggleGalaxyMap();
      else if (e.key === 'h' || e.key === 'H') S.onAct('warp');
      else if (e.key === 'l' || e.key === 'L') landOnPlanet();
      else if (e.key === 'r' || e.key === 'R') returnToShip();
      else if (e.key === 'ArrowRight') {
        if (st.phase === 'surface') S.onAct('next');
        else selectPlanet((st.pi + 1) % planets.length);
      } else if (e.key === 'ArrowLeft') {
        if (st.phase === 'surface') S.onAct('prev');
        else selectPlanet((st.pi - 1 + planets.length) % planets.length);
      }
    };

    // =========================================================================
    // 7. MAIN ANIMATION LOOP (Space Flight, Hyperspace Vortex, Planet Titles)
    // =========================================================================
    var lookV = new T.Vector3();
    var hudT = 0;

    // One planet at a time: the nearest one ahead (or just alongside) is shown,
    // grows in from the distance, slides past, and the next one takes its place.
    // Passed planets move to the back of the queue so the road never ends.
    function routeTick(dt) {
      // ease off while a planet is close so it can be read and tapped
      var curN = planetNodes[st.routeCur], relC = curN ? curN.homePos.z - st.shipPos.z : -999;
      var slow = relC > -95 && relC < 30 ? 0.35 + 0.65 * clamp((-relC - 20) / 75, 0, 1) : 1;
      if (st.cruise) st.shipPos.z -= ROUTE_SPEED * slow * dt;
      st.yaw = lerp(st.yaw, 0, 1 - Math.exp(-dt * 0.5));
      st.pitch = lerp(st.pitch, -0.02, 1 - Math.exp(-dt * 0.5));
      st.shipPos.x = lerp(st.shipPos.x, 0, 1 - Math.exp(-dt * 0.5));
      var cur = null, best = -Infinity, N = planetNodes.length;
      planetNodes.forEach(function (n) {
        var rel = n.homePos.z - st.shipPos.z;          // < 0: ahead
        if (rel > 45) {
          n.homePos.z -= N * ROUTE_GAP; n.pl.pos.z = n.homePos.z; n.group.position.z = n.homePos.z;
          rel = n.homePos.z - st.shipPos.z;
        }
        if (rel < 30 && rel > best) { best = rel; cur = n; }
      });
      planetNodes.forEach(function (n) { n.group.visible = n === cur; });
      if (!cur) return;
      if (st.routeCur !== cur.pi) {
        st.routeCur = cur.pi; st.pi = cur.pi; cur.appear = 0;
        refreshPlanetBanners();
        statusEl.textContent = '🪐 ' + cur.pl.title + ' ahead · tap it to land';
        ui();
      }
      cur.appear = Math.min(1, (cur.appear || 0) + dt * 0.7);
      cur.group.scale.setScalar(0.2 + 0.8 * easeOutCubic(cur.appear));
    }

    S.tick(function (dt, now) {
      st.phaseT += dt;
      spaceGroup.position.copy(cam.position);      // stars and sky stay at infinity
      skyMesh.position.copy(cam.position);

      // Animate cockpit holographic globe & steering yokes
      holoGlobe.rotation.y += dt * 0.85;
      if (cockpitGroup.visible) blinkButtons(dt);
      holoGlobe.rotation.x = Math.sin(now * 0.0016) * 0.22;
      st.bank = lerp(st.bank, 0, 1 - Math.exp(-dt * 4));
      yokes.forEach(function (yk) {
        yk.rotation.z = Math.PI * 0.82 + st.bank * 1.65;
      });
      if (shipGroup.visible) {        // chase view: bob, bank, hyperspace lunge
        var hp = st.phase === 'hyperspace' ? clamp(st.phaseT / st.warpDur, 0, 1) : 0;
        var lunge = hp ? Math.sin(hp * Math.PI) * (reducedMotion ? 0.6 : 2.4) : 0;
        shipGroup.position.set(Math.sin(now * 0.0007) * 0.06, -1.2 + Math.sin(now * 0.0011) * 0.04, -5.9 - lunge);
        shipGroup.rotation.set(0.2, 0, -st.bank * 1.6);   // level, nose straight down the flight line; banks only when steering
        var pulse = 0.75 + Math.sin(now * 0.012) * 0.08 + (hp ? 0.5 : 0);
        var U = shipGroup.userData;
        U.halo.material.opacity = 0.5 * pulse + (hp ? 0.35 : 0);
        U.halo.scale.y = 1 + (hp ? 0.6 : 0);
        U.bloom.opacity = 0.6 * pulse + (hp ? 0.4 : 0);
        U.engMat.opacity = 0.85 + (hp ? 0.15 : 0);
      }

      // Rotate all planets & moons in the 3D star system, and billboard their 3D Title Banners + Equatorial Namebands toward camera!
      planetNodes.forEach(function (node, i) {
        node.sphere.rotation.y += dt * (0.14 + (i % 3) * 0.04);
        node.ring.rotation.z += dt * 0.05;
        var mAng = now * 0.00055 * (1 + (i % 2) * 0.4) + i;
        var mDist = node.pl.radius * 2.25;
        node.moon.position.set(
          Math.cos(mAng) * mDist,
          Math.sin(mAng * 0.7) * (node.pl.radius * 0.45),
          Math.sin(mAng) * mDist
        );
        var dxC = cam.position.x - node.group.position.x;
        var dzC = cam.position.z - node.group.position.z;
        var dLenC = Math.hypot(dxC, dzC) || 1;
        node.eqBand.position.set(
          (dxC / dLenC) * (node.pl.radius * 1.15),
          -node.pl.radius * 1.3,
          (dzC / dLenC) * (node.pl.radius * 0.6)
        );
        node.banner.lookAt(cam.position);
        node.eqBand.lookAt(cam.position);
      });

      // Stream space dust & 3D asteroids past the cockpit window during flight
      if (dustLines.visible) {
        var dAttr = dustGeo.getAttribute('position');
        var dArr = dAttr.array;
        var dustSpeedMult = (st.phase === 'landing') ? 3.2 : (st.cruise ? 1.25 : 0.25);
        for (var d = 0; d < dustCount; d++) {
          var ds = dustSeeds[d];
          ds.z += ds.spd * dt * dustSpeedMult;
          if (ds.z > 2) {
            ds.z = -85 - Math.random() * 20;
            ds.x = (Math.random() - 0.5) * 44;
            ds.y = (Math.random() - 0.5) * 28;
          }
          var streakLen = 0.9 + dustSpeedMult * 1.5;
          dArr[d * 6] = ds.x;     dArr[d * 6 + 1] = ds.y;     dArr[d * 6 + 2] = ds.z;
          dArr[d * 6 + 3] = ds.x; dArr[d * 6 + 4] = ds.y;     dArr[d * 6 + 5] = ds.z - streakLen;
        }
        dAttr.needsUpdate = true;
      }

      if (asteroidGroup.visible) {
        var astMult = st.cruise ? 1.15 : 0.2;
        asteroids.forEach(function (a) {
          a.mesh.position.z += a.spd * dt * astMult;
          a.mesh.rotation.x += a.rx * dt;
          a.mesh.rotation.y += a.ry * dt;
          if (a.mesh.position.z > 3) {
            a.mesh.position.z = -95 - Math.random() * 25;
            a.mesh.position.x = (Math.random() < 0.5 ? -1 : 1) * (4.5 + Math.random() * 22);
            a.mesh.position.y = (Math.random() - 0.5) * 18;
          }
        });
      }

      if (st.phase === 'cockpit' || st.phase === 'approach') {
        leverPivot.rotation.x = lerp(leverPivot.rotation.x, 0, 1 - Math.exp(-dt * 6));
        var pl = curPlanet();

        if ((st.cruise || st.autoLandNear) && st.phase === 'approach') {
          var toX = pl.pos.x - st.shipPos.x;
          var toZ = pl.pos.z - st.shipPos.z;
          var dist = Math.hypot(toX, toZ) || 1;
          var desiredYaw = Math.atan2(-toX, -toZ);
          var dyaw = ((desiredYaw - st.yaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
          st.yaw += dyaw * Math.min(1, dt * 1.8);
          st.bank = clamp(-dyaw * 0.35, -0.22, 0.22);

          var minOrbitDist = pl.radius * 4.4;
          if (st.autoLandNear && dist <= minOrbitDist + 2) { st.autoLandNear = false; landOnPlanet(); }
          if (dist > minOrbitDist + 1.2) {
            var cruiseSpd = clamp((dist - minOrbitDist) * 0.75, 4.0, 16);
            st.shipPos.x -= Math.sin(st.yaw) * cruiseSpd * dt;
            st.shipPos.z -= Math.cos(st.yaw) * cruiseSpd * dt;
            st.shipPos.y = lerp(st.shipPos.y, pl.pos.y - pl.radius * 0.05, dt * 1.5);
          } else {
            var tangX = -toZ / dist, tangZ = toX / dist;
            st.shipPos.x += tangX * 2.2 * dt;
            st.shipPos.z += tangZ * 2.2 * dt;
          }
        }

        if (st.phase === 'cockpit') routeTick(dt);

        var swayX = Math.sin(now * 0.0015) * 0.08;
        var swayY = Math.cos(now * 0.0021) * 0.06;
        cam.position.set(st.shipPos.x + swayX, st.shipPos.y + swayY, st.shipPos.z);
        lookV.set(
          cam.position.x - Math.sin(st.yaw) * Math.cos(st.pitch),
          cam.position.y + Math.sin(st.pitch),
          cam.position.z - Math.cos(st.yaw) * Math.cos(st.pitch)
        );
        cam.lookAt(lookV);
        cam.rotation.z = st.bank + Math.sin(now * 0.0011) * 0.012;

      } else if (st.phase === 'hyperspace') {
        var p = clamp(st.phaseT / st.warpDur, 0, 1);
        var pl2 = curPlanet();

        // 1. Pull the throttle levers back
        leverPivot.rotation.x = lerp(0, -0.72, clamp(p * 3.5, 0, 1));

        // 2. FOV Warp Stretch
        if (!reducedMotion) {
          var fovPeak = st.view === 'cockpit' ? 68 : 86;   // keep the window big in the cockpit
          var fovCurve = p < 0.2 ? lerp(62, fovPeak, p / 0.2) : p < 0.8 ? fovPeak : lerp(fovPeak, 60, (p - 0.8) / 0.2);
          cam.fov = fovCurve;
          cam.updateProjectionMatrix();
        }

        // 3. During deep hyperspace tunnel (0.16 < p < 0.76), hide external planets so only the hyperspace vortex fills the windshield; at p >= 0.76, boom the destination planet in from deep space!
        var dirX2 = pl2.pos.x, dirZ2 = pl2.pos.z;
        var dLen = Math.hypot(dirX2, dirZ2) || 1;
        var stopDist2 = pl2.radius * 4.4;
        var destX = pl2.pos.x - (dirX2 / dLen) * stopDist2;
        var destY = pl2.pos.y - pl2.radius * 0.05;
        var destZ = pl2.pos.z - (dirZ2 / dLen) * stopDist2;

        if (p < 0.74) {
          systemGroup.visible = false;
        } else {
          systemGroup.visible = true;
          var exitT = easeOutCubic((p - 0.74) / 0.26);
          st.shipPos.x = destX;
          st.shipPos.y = destY;
          st.shipPos.z = destZ;
          st.yaw = Math.atan2(-(pl2.pos.x - st.shipPos.x), -(pl2.pos.z - st.shipPos.z));
          // Boom target planet in from 130m ahead along sightline!
          var targetNode = planetNodes[st.pi];
          if (targetNode) {
            var fwdX = -Math.sin(st.yaw), fwdZ = -Math.cos(st.yaw);
            var boomDist = lerp(135, stopDist2, exitT);
            targetNode.group.position.set(
              st.shipPos.x + fwdX * boomDist,
              pl2.pos.y,
              st.shipPos.z + fwdZ * boomDist
            );
          }
        }

        // 4. Stretch 1,100 Star Vectors into radial light streaks
        var wAttr = warpGeo.getAttribute('position');
        var wArr = wAttr.array;
        var stretch = reducedMotion ? 8 : (p < 0.22 ? lerp(1, 48, p / 0.22) : p < 0.8 ? 48 : lerp(48, 1.5, (p - 0.8) / 0.2));
        warpMat.opacity = p < 0.12 ? (p / 0.12) : p > 0.88 ? (1 - p) / 0.12 : 0.98;

        for (var w = 0; w < warpCount; w++) {
          var wb = warpBase[w];
          wb.z += wb.spd * dt * (p < 0.2 ? 0.7 : 2.1);
          if (wb.z > -1.5) wb.z = -115 - Math.random() * 20;
          wArr[w * 6] = wb.x;     wArr[w * 6 + 1] = wb.y;     wArr[w * 6 + 2] = wb.z;
          wArr[w * 6 + 3] = wb.x; wArr[w * 6 + 4] = wb.y;     wArr[w * 6 + 5] = wb.z - stretch;
        }
        wAttr.needsUpdate = true;

        // 5. Swirling Blue-Cyan Hyperspace Plasma Tunnel Rings
        var tunnelAlpha = (p > 0.12 && p < 0.84 && !reducedMotion) ? Math.sin(((p - 0.12) / 0.72) * Math.PI) * 0.65 : 0;
        var wallA = Math.sin(clamp((p - 0.1) / 0.8, 0, 1) * Math.PI);
        warpWallMat.opacity = Math.min(1, wallA * 1.25);
        warpWall.rotation.z += dt * (reducedMotion ? 0 : 0.35);
        warpWall.scale.setScalar(reducedMotion ? 1 : 1 + Math.sin(p * Math.PI) * 0.25);
        tunnelRings.forEach(function (tr, idx) {
          tr.mat.opacity = tunnelAlpha * 0.5;
          tr.mesh.position.z += dt * 88;
          if (tr.mesh.position.z > -2) tr.mesh.position.z -= 22 * 5.5;
          tr.mesh.rotation.z += dt * (idx % 2 === 0 ? 2.1 : -2.1);
        });

        var shake = reducedMotion ? 0 : Math.sin(p * Math.PI) * 0.04;
        cam.position.set(
          st.shipPos.x + (Math.random() - 0.5) * shake,
          st.shipPos.y + (Math.random() - 0.5) * shake,
          st.shipPos.z
        );
        lookV.set(
          cam.position.x - Math.sin(st.yaw),
          cam.position.y,
          cam.position.z - Math.cos(st.yaw)
        );
        cam.lookAt(lookV);

        if (p >= 1) finishHyperspace();

      } else if (st.phase === 'landing') {
        var pl3 = curPlanet();
        var plDur = reducedMotion ? 0.7 : 1.55;
        var plProg = clamp(st.phaseT / plDur, 0, 1), el = ease(plProg);

        var targetSurfX = pl3.pos.x;
        var targetSurfY = pl3.pos.y + pl3.radius * 0.45;
        var targetSurfZ = pl3.pos.z;

        cam.position.set(
          lerp(st.shipPos.x, targetSurfX, el * 0.68),
          lerp(st.shipPos.y, targetSurfY, el),
          lerp(st.shipPos.z, targetSurfZ, el * 0.68)
        );
        var divePitch = lerp(0.02, -0.28, Math.sin(plProg * Math.PI));
        lookV.set(
          cam.position.x - Math.sin(st.yaw) * Math.cos(divePitch),
          cam.position.y + Math.sin(divePitch),
          cam.position.z - Math.cos(st.yaw) * Math.cos(divePitch)
        );
        cam.lookAt(lookV);

        if (plProg >= 1) {
          setPhase('surface');
          S.toast('🧑‍🚀 Touchdown on ' + pl3.title + ' · Tap any monument to inspect');
        }

      } else if (st.phase === 'surface') {
        landmarkList.forEach(function (lm, idx) {
          lm.mesh.position.y = 1.32 + Math.sin(now * 0.0022 + idx) * 0.06;
        });

        if (st.autoExplore && !RD.open && landmarkList.length) {
          if (st.phaseT > 3.2) {
            st.phaseT = 0;
            var nx = (st.focusIdx + 1) % landmarkList.length;
            focusLandmark(nx, false);
            st.autoExplore = true;
          }
        }
        var a = 1 - Math.exp(-dt * 4.8);
        cur.x = lerp(cur.x, tgt.x, a);
        cur.y = lerp(cur.y, tgt.y, a);
        cur.z = lerp(cur.z, tgt.z, a);
        cur.pitch = lerp(cur.pitch, tgt.pitch, a);
        var dy = ((tgt.yaw - cur.yaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
        cur.yaw += dy * a;

        cam.position.set(cur.x, cur.y, cur.z);
        lookV.set(
          cur.x - Math.sin(cur.yaw) * Math.cos(cur.pitch),
          cur.y + Math.sin(cur.pitch),
          cur.z - Math.cos(cur.yaw) * Math.cos(cur.pitch)
        );
        cam.lookAt(lookV);

        if (st.onArrive && Math.abs(cur.x - tgt.x) < 0.1 && Math.abs(cur.z - tgt.z) < 0.1) {
          var fn = st.onArrive;
          st.onArrive = null;
          fn();
        }
      }

      hudT += dt;
      if (hudT > 0.35 && !RD.open) { hudT = 0; ui(); }
    });

    setPhase(st.phase);
    S.start();
    S.toast('🚀 Explorer cockpit ready · flying toward ' + curPlanet().title);

    this.close = function () { persist(); S.close(); if (CUR === self) CUR = null; };
    this.state = function () {
      var pl = curPlanet(), B = curBiome();
      var lm = st.focusIdx >= 0 ? landmarkList[st.focusIdx] : null;
      return {
        mode: 'galaxy',
        phase: st.phase,
        planetIdx: st.pi,
        planet: pl.title,
        biome: B.id,
        biomeName: B.name,
        cruise: st.cruise,
        cockpitFrame: st.cockpitFrame,
        regionsCount: pl.regions.length,
        itemsCount: pl.all.length,
        autoExplore: st.autoExplore,
        focusIdx: st.focusIdx,
        focus: lm ? lm.it.I.title : null,
        reading: RD.item() ? RD.item().I.title : null,
        planets: planets.map(function (p) { return p.title; })
      };
    };
    this.planets = function () { return planets; };
    this.landmarks = function () { return landmarkList; };
    this.selectPlanet = selectPlanet;
    this.openMap = toggleGalaxyMap;
    this.hyperspace = startHyperspace;
    this.approach = approachPlanet;
    this.approachPlanet = approachPlanet;
    this.land = landOnPlanet;
    this.landOnPlanet = landOnPlanet;
    this.returnToShip = returnToShip;
    this.focusLandmark = focusLandmark;
    this.pullLandmark = pullLandmark;
    this.flip = RD.flip;
    this.back = function () { RD.back(); };
    this.act = S.onAct;
  }

  var CUR = null;
  window.MinestGalaxy = {
    open: function (o) { if (CUR) CUR.close(); CUR = new Galaxy(o || {}); return CUR; },
    current: function () { return CUR; },
    biomes: BIOMES
  };
})();
