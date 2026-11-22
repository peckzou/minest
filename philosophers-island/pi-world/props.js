/* Philosophers' Island V3.0 — High-Craft Architectural Mesh Props, Smooth Pitched Roofs, Gable Infills,
 * Roadside Fingerpost Wayfinding Network (路标系统), Hanging House Nameplates (房子标牌),
 * Chandeliers, Ivy/Rose/Wisteria Climbers, 6,200 Wildflower Tufts, Distant Wolds & Plato's Cave Shadow Engine.
 * Exposes PIProps = { build(world, THREE, scene, opts) -> { update(dt, time, cam, night), stats(), caveControl } }. */
(function (root) {
  'use strict';
  function rng(seed) { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ============================================================================
  // PROCEDURAL OIL PAINTING & CLASSICAL ARTWORK RENDERER FOR ALL 20 PHILOSOPHERS
  // ============================================================================
  function paintMasterpiece(x, x0, y0, w, h, phil) {
    x.save();
    x.beginPath(); x.rect(x0, y0, w, h); x.clip();
    const theme = phil.artTheme || 'school_of_athens';
    const cx = x0 + w * 0.5, cy = y0 + h * 0.5;
    const isEastern = theme === 'apricot_altar' || theme === 'laozi_ox_water' || theme === 'zhuangzi_butterfly';

    // 1. Base Oil Canvas / Classical Silk Scroll Background Gradient
    const bg = x.createLinearGradient(x0, y0, x0, y0 + h);
    if (isEastern) {
      bg.addColorStop(0, '#e8dcc2'); bg.addColorStop(0.55, '#dcd0b4'); bg.addColorStop(1, '#c5b494');
    } else if (theme === 'rembrandt_aristotle' || theme === 'locke_obscura' || theme === 'socrates_death') {
      bg.addColorStop(0, '#1c120c'); bg.addColorStop(0.6, '#2b1b10'); bg.addColorStop(1, '#120b07');
    } else if (theme === 'kant_starry' || theme === 'leibniz_monads') {
      bg.addColorStop(0, '#09132c'); bg.addColorStop(0.6, '#172554'); bg.addColorStop(1, '#0f172a');
    } else if (theme === 'hegel_owl' || theme === 'munch_sun') {
      bg.addColorStop(0, '#451a03'); bg.addColorStop(0.45, '#9a3412'); bg.addColorStop(1, '#1e1b4b');
    } else if (theme === 'mondrian_duckrabbit') {
      bg.addColorStop(0, '#f8fafc'); bg.addColorStop(1, '#e2e8f0');
    } else {
      bg.addColorStop(0, '#1e3a5f'); bg.addColorStop(0.55, '#3b526b'); bg.addColorStop(1, '#1f2937');
    }
    x.fillStyle = bg; x.fillRect(x0, y0, w, h);

    // Subtle canvas weave / brushstroke texture
    const r = rng((phil.num || 1) * 97 + 13);
    for (let i = 0; i < 160; i++) {
      x.fillStyle = isEastern ? 'rgba(120,95,60,0.06)' : 'rgba(255,240,200,0.04)';
      x.fillRect(x0 + r() * w, y0 + r() * h, 8 + r() * 26, 2 + r() * 5);
    }

    // 2. Theme-Specific Iconic Artwork Composition
    if (theme === 'socrates_death') {
      // Jacques-Louis David: The Death of Socrates (1787) — Prison stone arch, Socrates pointing skyward, golden hemlock cup
      x.fillStyle = '#292018'; x.fillRect(x0, y0, w, h * 0.85);
      x.fillStyle = '#18120d'; x.beginPath(); x.arc(cx - 40, cy, 125, Math.PI, 0); x.fill();
      // Sunbeam from high prison window
      const ray = x.createLinearGradient(x0 + 30, y0, cx + 60, y0 + h);
      ray.addColorStop(0, 'rgba(254,240,138,0.38)'); ray.addColorStop(1, 'rgba(254,240,138,0)');
      x.fillStyle = ray; x.beginPath(); x.moveTo(x0 + 20, y0); x.lineTo(x0 + 130, y0); x.lineTo(cx + 120, y0 + h); x.lineTo(cx - 60, y0 + h); x.fill();
      // Stone bed & white-robed Socrates pointing to the heavens
      x.fillStyle = '#57534e'; x.fillRect(cx - 130, cy + 48, 260, 36);
      x.fillStyle = '#f8fafc'; x.fillRect(cx - 28, cy - 18, 52, 68);
      x.fillStyle = '#e2c2a0'; x.beginPath(); x.arc(cx - 2, cy - 36, 20, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#e5e7eb'; x.beginPath(); x.arc(cx - 2, cy - 32, 16, 0, Math.PI); x.fill();
      // Left arm raised high pointing to Eternal Truth
      x.strokeStyle = '#e2c2a0'; x.lineWidth = 10;
      x.beginPath(); x.moveTo(cx - 18, cy - 8); x.lineTo(cx - 42, cy - 78); x.stroke();
      // Right arm reaching for the Golden Hemlock Goblet
      x.beginPath(); x.moveTo(cx + 18, cy - 4); x.lineTo(cx + 68, cy + 6); x.stroke();
      x.fillStyle = '#fbbf24'; x.beginPath(); x.arc(cx + 76, cy + 4, 11, 0, Math.PI); x.fill();
      x.fillRect(cx + 73, cy + 12, 6, 14);
      // Grieving disciples in crimson & blue togas
      x.fillStyle = '#991b1b'; x.fillRect(cx - 115, cy - 8, 46, 62);
      x.fillStyle = '#1d4ed8'; x.fillRect(cx + 88, cy - 6, 48, 60);
    }
    else if (theme === 'school_of_athens') {
      // Raphael: The School of Athens (1509) — Coffered Renaissance vault, Plato in red pointing up, Aristotle in blue
      x.fillStyle = '#7dd3fc'; x.fillRect(x0, y0, w, h);
      x.strokeStyle = '#d6c7a8'; x.lineWidth = 28;
      x.beginPath(); x.arc(cx, cy + 50, 175, Math.PI, 0); x.stroke();
      x.strokeStyle = '#b49b6c'; x.lineWidth = 14;
      x.beginPath(); x.arc(cx, cy + 50, 135, Math.PI, 0); x.stroke();
      // Marble steps
      x.fillStyle = '#e7e5e4'; x.fillRect(x0 + 20, cy + 55, w - 40, 50);
      // Plato (crimson & rose robe, pointing up to the Form of the Good)
      x.fillStyle = '#dc2626'; x.fillRect(cx - 52, cy - 22, 44, 78);
      x.fillStyle = '#f5d0a9'; x.beginPath(); x.arc(cx - 30, cy - 40, 17, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#f5d0a9'; x.lineWidth = 8;
      x.beginPath(); x.moveTo(cx - 30, cy - 16); x.lineTo(cx - 30, cy - 75); x.stroke();
      // Golden Sun of Forms above Plato's finger
      x.fillStyle = '#fde047'; x.beginPath(); x.arc(cx - 30, cy - 92, 16, 0, Math.PI * 2); x.fill();
      // Aristotle beside him in azure robe gesturing outward
      x.fillStyle = '#2563eb'; x.fillRect(cx + 8, cy - 20, 44, 76);
      x.fillStyle = '#f5d0a9'; x.beginPath(); x.arc(cx + 30, cy - 38, 17, 0, Math.PI * 2); x.fill();
    }
    else if (theme === 'rembrandt_aristotle') {
      // Rembrandt: Aristotle with a Bust of Homer (1653) — Golden chiaroscuro, white bust of Homer, gold chain
      const glow = x.createRadialGradient(cx + 35, cy - 15, 10, cx + 20, cy, 175);
      glow.addColorStop(0, 'rgba(251,191,36,0.52)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = glow; x.fillRect(x0, y0, w, h);
      // Aristotle in dark velvet mantle, cream billowing sleeves & golden medallion chain
      x.fillStyle = '#f5f5f4'; x.fillRect(cx - 85, cy - 15, 86, 85);
      x.fillStyle = '#1c1917'; x.fillRect(cx - 72, cy - 15, 60, 85);
      x.strokeStyle = '#fbbf24'; x.lineWidth = 8;
      x.beginPath(); x.arc(cx - 42, cy + 5, 36, 0.2, Math.PI - 0.2); x.stroke();
      x.fillStyle = '#e2c2a0'; x.beginPath(); x.arc(cx - 42, cy - 42, 22, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#1c1917'; x.fillRect(cx - 68, cy - 68, 52, 16);
      // Marble Bust of Homer on right pedestal
      x.fillStyle = '#78350f'; x.fillRect(cx + 42, cy + 32, 74, 55);
      x.fillStyle = '#f8fafc'; x.fillRect(cx + 55, cy - 4, 48, 38);
      x.beginPath(); x.arc(cx + 79, cy - 22, 22, 0, Math.PI * 2); x.fill();
      // Aristotle's hand resting on Homer's head
      x.strokeStyle = '#f5f5f4'; x.lineWidth = 12;
      x.beginPath(); x.moveTo(cx - 10, cy + 5); x.lineTo(cx + 68, cy - 38); x.stroke();
    }
    else if (theme === 'stoa_lighthouse') {
      // Stoa Poikile & Stoic Citadel amidst tempest waves
      x.fillStyle = '#0c4a6e'; x.fillRect(x0, cy + 20, w, h * 0.5);
      for (let k = 0; k < 5; k++) {
        x.fillStyle = '#38bdf8'; x.beginPath(); x.arc(x0 + 45 + k * 65, cy + 45 + (k % 2) * 12, 32, Math.PI, 0); x.fill();
      }
      // Marble Stoa Colonnade on right cliff
      x.fillStyle = '#f8fafc'; x.fillRect(cx - 10, cy - 55, 180, 14);
      for (let c = 0; c < 5; c++) x.fillRect(cx + c * 38, cy - 40, 14, 72);
      // Golden Equestrian Marcus Aurelius & Logos Sun
      x.fillStyle = '#fbbf24'; x.beginPath(); x.arc(x0 + 95, cy - 45, 36, 0, Math.PI * 2); x.fill();
    }
    else if (theme === 'apricot_altar') {
      // Qiu Ying: Apricot Altar Lecture Scroll (杏坛礼乐讲学图卷)
      x.fillStyle = '#84a98c'; x.beginPath(); x.arc(x0 + 90, cy + 40, 110, Math.PI, 0); x.fill();
      x.fillStyle = '#52796f'; x.beginPath(); x.arc(cx + 80, cy + 50, 130, Math.PI, 0); x.fill();
      // Vermilion Apricot Altar Pavilion & Golden Roof
      x.fillStyle = '#f8fafc'; x.fillRect(cx - 110, cy + 38, 220, 26);
      x.fillStyle = '#991b1b'; x.fillRect(cx - 80, cy - 28, 14, 66); x.fillRect(cx + 66, cy - 28, 14, 66);
      x.fillStyle = '#eab308';
      x.beginPath(); x.moveTo(cx - 115, cy - 25); x.quadraticCurveTo(cx, cy - 75, cx + 115, cy - 25); x.closePath(); x.fill();
      // Golden Apricot Blossoms & Confucius in Red Robe with Bronze Bianzhong Bells
      for (let i = 0; i < 18; i++) {
        x.fillStyle = i % 2 === 0 ? '#f59e0b' : '#fef08a';
        x.beginPath(); x.arc(x0 + 40 + (i * 27) % (w - 80), y0 + 28 + (i * 19) % 70, 9, 0, Math.PI * 2); x.fill();
      }
      x.fillStyle = '#7f1d1d'; x.fillRect(cx - 18, cy - 5, 36, 44);
      x.fillStyle = '#fde68a'; x.beginPath(); x.arc(cx, cy - 18, 13, 0, Math.PI * 2); x.fill();
      // Red Seal Stamp
      x.fillStyle = '#b91c1c'; x.fillRect(x0 + w - 54, y0 + 24, 28, 42);
    }
    else if (theme === 'laozi_ox_water') {
      // Ma Yuan: Laozi Riding the Azure Ox through Hangu Pass & Water Scroll
      x.fillStyle = '#475569'; x.beginPath(); x.moveTo(x0, cy + 60); x.lineTo(x0 + 95, y0 + 35); x.lineTo(x0 + 210, cy + 60); x.fill();
      x.fillStyle = '#64748b'; x.beginPath(); x.moveTo(cx + 30, cy + 60); x.lineTo(cx + 135, y0 + 48); x.lineTo(x0 + w, cy + 60); x.fill();
      // Swirling Water Waves (上善若水)
      x.strokeStyle = '#334155'; x.lineWidth = 2.5;
      for (let wy = cy + 45; wy < y0 + h - 10; wy += 12) {
        x.beginPath(); x.moveTo(x0 + 20, wy); x.quadraticCurveTo(cx - 50, wy - 10, cx, wy); x.quadraticCurveTo(cx + 50, wy + 10, x0 + w - 20, wy); x.stroke();
      }
      // Azure Ox & White-Bearded Laozi
      x.fillStyle = '#334155'; x.beginPath(); x.ellipse(cx, cy + 18, 42, 24, 0, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.arc(cx - 44, cy + 8, 16, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#f8fafc'; x.fillRect(cx - 14, cy - 26, 28, 34);
      x.beginPath(); x.arc(cx, cy - 38, 13, 0, Math.PI * 2); x.fill();
      // Taiji Symbol in the sky
      x.fillStyle = '#1e293b'; x.beginPath(); x.arc(cx + 95, y0 + 56, 26, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#f8fafc'; x.beginPath(); x.arc(cx + 95, y0 + 56, 26, -Math.PI / 2, Math.PI / 2); x.fill();
      x.fillStyle = '#b91c1c'; x.fillRect(x0 + 26, y0 + 24, 28, 44);
    }
    else if (theme === 'zhuangzi_butterfly') {
      // Zhuangzi Dreaming of a Butterfly & Haoliang Lotus Pond
      x.fillStyle = '#0f766e'; x.fillRect(x0, cy + 25, w, h * 0.45);
      // Green lily pads & pink lotus blossoms
      for (let i = 0; i < 5; i++) {
        const lx = x0 + 55 + i * 85, ly = cy + 52 + (i % 2) * 16;
        x.fillStyle = '#15803d'; x.beginPath(); x.ellipse(lx, ly, 26, 12, 0, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#f472b6'; x.beginPath(); x.arc(lx, ly - 8, 11, Math.PI, 0); x.fill();
      }
      // Reclining Zhuangzi & 3 Luminous Butterflies ascending into the mist
      x.fillStyle = '#1e293b'; x.fillRect(x0 + 48, cy - 8, 65, 34);
      x.fillStyle = '#f5d0a9'; x.beginPath(); x.arc(x0 + 65, cy - 22, 15, 0, Math.PI * 2); x.fill();
      [[cx - 10, cy - 35, 1.0], [cx + 55, cy - 68, 1.25], [cx + 125, cy - 42, 0.9]].forEach(([bx, by, sc]) => {
        x.fillStyle = '#38bdf8';
        x.beginPath(); x.ellipse(bx - 12 * sc, by, 14 * sc, 20 * sc, -0.4, 0, Math.PI * 2); x.fill();
        x.beginPath(); x.ellipse(bx + 12 * sc, by, 14 * sc, 20 * sc, 0.4, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#fde047'; x.beginPath(); x.arc(bx, by, 5 * sc, 0, Math.PI * 2); x.fill();
      });
    }
    else if (theme === 'descartes_optics') {
      // Frans Hals Portrait of Descartes + 3D X-Y-Z Coordinate Grid & Refracting Prism
      x.strokeStyle = 'rgba(125,211,252,0.35)'; x.lineWidth = 2;
      for (let gx = x0 + 30; gx < x0 + w; gx += 36) { x.beginPath(); x.moveTo(gx, y0); x.lineTo(gx, y0 + h); x.stroke(); }
      for (let gy = y0 + 25; gy < y0 + h; gy += 36) { x.beginPath(); x.moveTo(x0, gy); x.lineTo(x0 + w, gy); x.stroke(); }
      // Golden X-Y-Z Axes & Optical Prism on right
      x.strokeStyle = '#fbbf24'; x.lineWidth = 4;
      x.beginPath(); x.moveTo(cx + 40, y0 + 30); x.lineTo(cx + 40, cy + 50); x.lineTo(x0 + w - 30, cy + 50); x.stroke();
      x.beginPath(); x.moveTo(cx + 40, cy + 50); x.lineTo(cx - 25, y0 + h - 25); x.stroke();
      // Portrait on left
      x.fillStyle = '#0f172a'; x.fillRect(x0 + 48, cy - 15, 92, 95);
      x.fillStyle = '#f8fafc'; x.fillRect(x0 + 70, cy - 18, 48, 16);
      x.fillStyle = '#e2c2a0'; x.beginPath(); x.arc(x0 + 94, cy - 42, 26, 0, Math.PI * 2); x.fill();
    }
    else if (theme === 'vermeer_spinoza') {
      // Vermeer: The Astronomer & Spinoza's Optical Lens Studio
      // Golden sunlight streaming from left window
      const sun = x.createLinearGradient(x0, y0, cx + 80, cy + 80);
      sun.addColorStop(0, 'rgba(254,240,138,0.65)'); sun.addColorStop(1, 'rgba(254,240,138,0.0)');
      x.fillStyle = sun; x.fillRect(x0, y0, w, h);
      x.strokeStyle = '#fbbf24'; x.lineWidth = 3;
      x.beginPath(); x.arc(cx - 35, cy + 10, 46, 0, Math.PI * 2); x.stroke();
      x.beginPath(); x.ellipse(cx - 35, cy + 10, 46, 18, 0.35, 0, Math.PI * 2); x.stroke();
      // Spinoza in Vermeer blue robe examining optical lens
      x.fillStyle = '#1d4ed8'; x.fillRect(cx + 35, cy - 20, 75, 95);
      x.fillStyle = '#e2c2a0'; x.beginPath(); x.arc(cx + 68, cy - 42, 22, 0, Math.PI * 2); x.fill();
    }
    else if (theme === 'leibniz_monads') {
      // Leibniz: Windowless Monads Mirror Hall & Binary 1 / 0 Creation Medal
      x.strokeStyle = '#fbbf24'; x.lineWidth = 5;
      x.beginPath(); x.arc(cx, cy, 82, 0, Math.PI * 2); x.stroke();
      x.fillStyle = '#fde047'; x.font = '900 32px Georgia, serif'; x.textAlign = 'center';
      x.fillText('1   0   1   0', cx, cy - 12);
      x.fillText('0   1   0   1', cx, cy + 28);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        x.fillStyle = '#38bdf8'; x.beginPath(); x.arc(cx + Math.cos(a) * 125, cy + Math.sin(a) * 85, 16, 0, Math.PI * 2); x.fill();
        x.strokeStyle = '#fde68a'; x.lineWidth = 2; x.stroke();
      }
    }
    else if (theme === 'locke_obscura') {
      // Locke: Camera Obscura & Tabula Rasa White Canvas
      x.fillStyle = '#fde047'; x.beginPath(); x.arc(x0 + 24, cy - 20, 10, 0, Math.PI * 2); x.fill();
      const beam = x.createLinearGradient(x0 + 24, cy - 20, cx + 65, cy);
      beam.addColorStop(0, 'rgba(253,224,71,0.75)'); beam.addColorStop(1, 'rgba(56,189,248,0.22)');
      x.fillStyle = beam;
      x.beginPath(); x.moveTo(x0 + 24, cy - 20); x.lineTo(cx + 15, cy - 68); x.lineTo(cx + 15, cy + 68); x.closePath(); x.fill();
      // Pure White Tabula Rasa Canvas receiving the sensory projection
      x.fillStyle = '#ffffff'; x.fillRect(cx + 15, cy - 68, 110, 136);
      x.strokeStyle = '#d97706'; x.lineWidth = 6; x.strokeRect(cx + 15, cy - 68, 110, 136);
      x.fillStyle = '#22c55e'; x.fillRect(cx + 22, cy + 10, 96, 52);
      x.fillStyle = '#38bdf8'; x.fillRect(cx + 22, cy - 62, 96, 72);
      x.fillStyle = '#fbbf24'; x.beginPath(); x.arc(cx + 75, cy - 26, 16, 0, Math.PI * 2); x.fill();
    }
    else if (theme === 'hume_billiards') {
      // Allan Ramsay Hume Portrait + Green Baize Billiard Causality Table
      x.fillStyle = '#065f46'; x.fillRect(x0 + 28, y0 + 28, w - 56, h - 56);
      x.strokeStyle = '#78350f'; x.lineWidth = 14; x.strokeRect(x0 + 28, y0 + 28, w - 56, h - 56);
      // Colliding Cue Ball & Red Object Ball with Golden Vector Arrows
      x.strokeStyle = '#fde047'; x.lineWidth = 4; x.setLineDash([8, 6]);
      x.beginPath(); x.moveTo(x0 + 75, cy + 35); x.lineTo(cx, cy); x.lineTo(x0 + w - 85, cy - 42); x.stroke();
      x.setLineDash([]);
      x.fillStyle = '#f8fafc'; x.beginPath(); x.arc(cx - 22, cy + 6, 24, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#dc2626'; x.beginPath(); x.arc(cx + 24, cy - 6, 24, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#fbbf24'; x.beginPath(); x.arc(cx + 2, cy, 12, 0, Math.PI * 2); x.fill();
    }
    else if (theme === 'leviathan_forest') {
      // Bosse's Crowned Leviathan Sovereign (left) & Rousseau's Lush Jungle (right)
      x.fillStyle = '#064e3b'; x.fillRect(cx, y0, w * 0.5, h);
      for (let i = 0; i < 12; i++) {
        x.fillStyle = i % 2 === 0 ? '#15803d' : '#22c55e';
        x.beginPath(); x.ellipse(cx + 40 + (i * 23) % 160, cy + 35 - (i % 3) * 28, 22, 55, (i - 5) * 0.1, 0, Math.PI * 2); x.fill();
      }
      // Crowned Golden Leviathan Sovereign with Sword & Crosier on left
      x.fillStyle = '#d97706'; x.fillRect(x0 + 78, cy - 22, 74, 88);
      x.fillStyle = '#fde68a'; x.beginPath(); x.arc(x0 + 115, cy - 45, 22, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#fbbf24'; x.fillRect(x0 + 96, cy - 75, 38, 16);
      x.strokeStyle = '#f8fafc'; x.lineWidth = 6;
      x.beginPath(); x.moveTo(x0 + 75, cy - 10); x.lineTo(x0 + 38, cy - 75); x.stroke();
      x.strokeStyle = '#fbbf24';
      x.beginPath(); x.moveTo(x0 + 155, cy - 10); x.lineTo(x0 + 185, cy - 75); x.stroke();
    }
    else if (theme === 'kant_starry') {
      // Kant: Starry Heavens above Königsberg & Golden Moral Law Compass
      for (let i = 0; i < 45; i++) {
        x.fillStyle = i % 3 === 0 ? '#fde047' : '#e0f2fe';
        x.beginPath(); x.arc(x0 + (i * 53) % w, y0 + (i * 31) % (h * 0.7), (i % 3) + 1.5, 0, Math.PI * 2); x.fill();
      }
      x.strokeStyle = '#fbbf24'; x.lineWidth = 3.5;
      x.beginPath(); x.arc(cx, cy - 18, 66, 0, Math.PI * 2); x.stroke();
      x.beginPath(); x.ellipse(cx, cy - 18, 66, 26, 0.45, 0, Math.PI * 2); x.stroke();
      x.beginPath(); x.ellipse(cx, cy - 18, 66, 26, -0.45, 0, Math.PI * 2); x.stroke();
      // Königsberg skyline silhouette at bottom
      x.fillStyle = '#090d16'; x.fillRect(x0, y0 + h - 48, w, 48);
      x.beginPath(); x.moveTo(cx - 22, y0 + h - 48); x.lineTo(cx, y0 + h - 105); x.lineTo(cx + 22, y0 + h - 48); x.fill();
    }
    else if (theme === 'hegel_owl') {
      // Hegel: The Owl of Minerva Flying at Dusk
      x.fillStyle = '#fbbf24'; x.beginPath(); x.arc(cx, cy + 25, 52, Math.PI, 0); x.fill();
      // Soaring Golden-Brown Owl of Minerva with spread wings
      x.fillStyle = '#d97706';
      x.beginPath(); x.ellipse(cx - 65, cy - 18, 62, 20, -0.25, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.ellipse(cx + 65, cy - 18, 62, 20, 0.25, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#b45309'; x.beginPath(); x.ellipse(cx, cy - 10, 28, 38, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#fde047';
      x.beginPath(); x.arc(cx - 10, cy - 26, 7, 0, Math.PI * 2); x.arc(cx + 10, cy - 26, 7, 0, Math.PI * 2); x.fill();
    }
    else if (theme === 'marx_steam_iron') {
      // Menzel & Rivera: Industrial Steam Gears & Glowing Iron Furnace
      const fire = x.createRadialGradient(cx, cy + 30, 15, cx, cy, 180);
      fire.addColorStop(0, '#fde047'); fire.addColorStop(0.5, '#ea580c'); fire.addColorStop(1, '#18181b');
      x.fillStyle = fire; x.fillRect(x0, y0, w, h);
      // Giant Interlocking Brass Gears
      [[cx - 58, cy + 8, 52], [cx + 52, cy - 14, 44]].forEach(([gx, gy, gr]) => {
        x.strokeStyle = '#fbbf24'; x.lineWidth = 12;
        x.beginPath(); x.arc(gx, gy, gr, 0, Math.PI * 2); x.stroke();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx + Math.cos(a) * (gr + 12), gy + Math.sin(a) * (gr + 12)); x.stroke();
        }
      });
    }
    else if (theme === 'friedrich_wanderer') {
      // Caspar David Friedrich: Wanderer above the Sea of Fog (1818)
      const sky = x.createLinearGradient(x0, y0, x0, y0 + h);
      sky.addColorStop(0, '#64748b'); sky.addColorStop(0.55, '#cbd5e1'); sky.addColorStop(1, '#94a3b8');
      x.fillStyle = sky; x.fillRect(x0, y0, w, h);
      // Swirling sea of white-silver mountain fog
      for (let k = 0; k < 7; k++) {
        x.fillStyle = 'rgba(248,250,252,0.65)';
        x.beginPath(); x.ellipse(x0 + 60 + k * 55, cy + 15 + (k % 2) * 18, 70, 22, 0, 0, Math.PI * 2); x.fill();
      }
      // Jagged dark rocky peak & lone dark-coated Wanderer in center
      x.fillStyle = '#1e293b';
      x.beginPath(); x.moveTo(cx - 110, y0 + h); x.lineTo(cx, cy + 28); x.lineTo(cx + 110, y0 + h); x.closePath(); x.fill();
      x.fillStyle = '#0f172a'; x.fillRect(cx - 18, cy - 38, 36, 70);
      x.fillStyle = '#451a03'; x.beginPath(); x.arc(cx, cy - 52, 14, 0, Math.PI * 2); x.fill();
    }
    else if (theme === 'munch_sun') {
      // Edvard Munch: The Sun (1911) — Blazing Alpine Sun radiating colorful rays
      const cols = ['#fde047', '#f97316', '#ef4444', '#38bdf8', '#a855f7'];
      for (let i = 0; i < 24; i++) {
        const a0 = (i / 24) * Math.PI * 2, a1 = ((i + 0.6) / 24) * Math.PI * 2;
        x.fillStyle = cols[i % cols.length];
        x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a0) * 280, cy + Math.sin(a0) * 280); x.lineTo(cx + Math.cos(a1) * 280, cy + Math.sin(a1) * 280); x.closePath(); x.fill();
      }
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(cx, cy, 46, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#fde047'; x.lineWidth = 10; x.stroke();
      // Alpine cliff shoulders on left & right
      x.fillStyle = '#1e293b';
      x.beginPath(); x.moveTo(x0, y0 + h); x.lineTo(x0, cy + 10); x.lineTo(cx - 75, y0 + h); x.fill();
      x.beginPath(); x.moveTo(x0 + w, y0 + h); x.lineTo(x0 + w, cy + 10); x.lineTo(cx + 75, y0 + h); x.fill();
    }
    else if (theme === 'mondrian_duckrabbit') {
      // Mondrian Composition with Red, Yellow, Blue (left) + Wittgenstein's Duck-Rabbit (right)
      x.fillStyle = '#dc2626'; x.fillRect(x0 + 18, y0 + 18, 115, 115);
      x.fillStyle = '#2563eb'; x.fillRect(x0 + 18, cy + 35, 75, 75);
      x.fillStyle = '#eab308'; x.fillRect(x0 + 145, cy + 45, 55, 65);
      x.strokeStyle = '#090d16'; x.lineWidth = 9;
      x.strokeRect(x0 + 18, y0 + 18, w - 36, h - 36);
      x.beginPath();
      x.moveTo(x0 + 135, y0 + 18); x.lineTo(x0 + 135, y0 + h - 18);
      x.moveTo(x0 + 18, cy + 35); x.lineTo(x0 + 210, cy + 35);
      x.moveTo(x0 + 210, y0 + 18); x.lineTo(x0 + 210, y0 + h - 18);
      x.stroke();
      // Jastrow Duck-Rabbit figure on right white square
      x.fillStyle = '#1e293b';
      x.beginPath(); x.arc(cx + 105, cy + 10, 36, 0, Math.PI * 2); x.fill();
      // Duck bill / Rabbit ears extending left
      x.beginPath(); x.ellipse(cx + 45, cy - 8, 34, 10, 0.15, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.ellipse(cx + 45, cy + 14, 34, 9, -0.1, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(cx + 98, cy - 2, 6, 0, Math.PI * 2); x.fill();
    }
    else {
      // Van Gogh: A Pair of Shoes (left) & Parisian Left-Bank Night Café (right)
      x.fillStyle = '#b45309'; x.fillRect(x0, y0, w * 0.52, h);
      // Pair of weathered peasant boots (Van Gogh 1886)
      x.fillStyle = '#291d12';
      x.fillRect(x0 + 48, cy - 25, 38, 65); x.fillRect(x0 + 38, cy + 25, 62, 28);
      x.fillRect(x0 + 112, cy - 20, 38, 62); x.fillRect(x0 + 112, cy + 28, 64, 26);
      x.strokeStyle = '#fbbf24'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(x0 + 65, cy + 5); x.lineTo(x0 + 95, cy + 38); x.stroke();
      // Right half: Parisian Left-Bank Night Café under stars
      x.fillStyle = '#0f172a'; x.fillRect(cx + 10, y0, w * 0.48, h);
      x.fillStyle = '#f59e0b'; x.fillRect(cx + 35, cy - 25, 135, 95);
      x.fillStyle = '#dc2626'; x.fillRect(cx + 28, cy - 42, 148, 22);
    }

    x.restore();
  }

  function build(world, T, scene, opts) {
    opts = opts || {};
    const group = new T.Group(); group.name = 'pi-props'; scene.add(group);
    const P = world.props, made = { meshes: 0, textures: 0 };

    const goldMat = new T.MeshPhongMaterial({ color: 0xc9a353, specular: 0xead9ad, shininess: 46, emissive: 0x160f03 });
    const goldDarkMat = new T.MeshPhongMaterial({ color: 0x8a6c32, specular: 0xd6c08c, shininess: 34, emissive: 0x0e0a02 });
    const bronzeMat = new T.MeshPhongMaterial({ color: 0x7d623c, specular: 0xc8b288, shininess: 36, emissive: 0x0c0904 });
    const crystalMat = new T.MeshPhongMaterial({ color: 0x7dd3fc, specular: 0xffffff, shininess: 110, transparent: true, opacity: 0.82, emissive: 0x123a4a });
    const marbleMat = new T.MeshLambertMaterial({ color: 0xf4efe4 });
    const oakPostMat = new T.MeshLambertMaterial({ color: 0x4c3522 });
    const waxMat = new T.MeshLambertMaterial({ color: 0xf6efdc, emissive: 0x221c10 });
    const flameMat = new T.MeshBasicMaterial({ color: 0xffd47a });
    const darkShadowMat = new T.MeshBasicMaterial({ color: 0x090b10, transparent: true, opacity: 0.86, side: T.DoubleSide });

    // Procedural High-Craft Ribbed Architectural Roof Tile Texture (Glazed Chinese Ceramic / Mediterranean Terracotta)
    function makeRibbedTileTex(baseHex, ribDarkHex, ribLightHex, seed) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const x = c.getContext('2d'), r = rng(seed || 101);
      x.fillStyle = baseHex; x.fillRect(0, 0, 256, 256);
      const cols = 12, cw = 256 / cols;
      for (let i = 0; i < cols; i++) {
        const x0 = i * cw;
        const g = x.createLinearGradient(x0, 0, x0 + cw, 0);
        g.addColorStop(0.0, ribDarkHex);
        g.addColorStop(0.28, baseHex);
        g.addColorStop(0.55, ribLightHex);
        g.addColorStop(0.82, baseHex);
        g.addColorStop(1.0, ribDarkHex);
        x.fillStyle = g;
        x.fillRect(x0, 0, cw + 0.5, 256);
      }
      // Horizontal overlapping tile courses & subtle weathering
      for (let y = 0; y < 256; y += 32) {
        x.fillStyle = 'rgba(0,0,0,0.22)';
        x.fillRect(0, y, 256, 3);
        x.fillStyle = 'rgba(255,255,255,0.08)';
        x.fillRect(0, y + 3, 256, 2);
      }
      for (let i = 0; i < 420; i++) {
        x.fillStyle = r() > 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
        x.fillRect(r() * 256, r() * 256, 2 + r() * 6, 4 + r() * 10);
      }
      const t = new T.CanvasTexture(c);
      t.wrapS = t.wrapT = T.RepeatWrapping;
      if (T.sRGBEncoding !== undefined) t.encoding = T.sRGBEncoding;
      made.textures++;
      return t;
    }

    // Helper: Paint subtle weathered woodgrain background on plaque canvases
    function paintWoodGrain(x, w, h, c0, c1, seed) {
      const r = rng(seed || 42);
      const g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, c0); g.addColorStop(1, c1);
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 95; i++) {
        const yy = r() * h;
        x.strokeStyle = r() > 0.45 ? 'rgba(0,0,0,0.14)' : 'rgba(255,235,200,0.05)';
        x.lineWidth = 1 + r() * 2.2;
        x.beginPath();
        x.moveTo(0, yy);
        x.bezierCurveTo(w * 0.33, yy + (r() - 0.5) * 8, w * 0.66, yy + (r() - 0.5) * 8, w, yy + (r() - 0.5) * 4);
        x.stroke();
      }
    }

    /* ---------------- Merge Helper (1 draw call per material) ---------------- */
    function Merger() { this.list = []; }
    Merger.prototype.add = function (geo, m) { const g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(m); this.list.push(g); };
    Merger.prototype.mesh = function (mat) {
      if (!this.list.length) return null;
      let n = 0; this.list.forEach((g) => { n += g.attributes.position.count; });
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
      let o = 0;
      this.list.forEach((g) => {
        pos.set(g.attributes.position.array, o * 3);
        nor.set(g.attributes.normal.array, o * 3);
        if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
        o += g.attributes.position.count;
        g.dispose();
      });
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      geo.setAttribute('normal', new T.BufferAttribute(nor, 3));
      geo.setAttribute('uv', new T.BufferAttribute(uv, 2));
      geo.computeBoundingSphere();
      const me = new T.Mesh(geo, mat); group.add(me); made.meshes++; return me;
    };
    const M = (x, y, z, rx, ry, rz, sx, sy, sz) => new T.Matrix4().compose(
      new T.Vector3(x, y, z),
      new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0)),
      new T.Vector3(sx || 1, sy || 1, sz || 1)
    );
    const torus = (r, t) => new T.TorusGeometry(r, t, 6, Math.max(16, Math.round(r * 18)));
    const cyl = (r0, r1, h, s) => new T.CylinderGeometry(r0, r1, h, s || 8);
    const sph = (r) => new T.SphereGeometry(r, 10, 8);

    /* ---------------- 1. SMOOTH PITCHED ROOFS, GABLES, CHIMNEY POTS & CLIMBERS ---------------- */
    const PT = root.PITex;
    const hf2 = (a, b) => { const h = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return h - Math.floor(h); };
    function tileTex(name) {
      const t = new T.CanvasTexture(PT.tile(name));
      t.wrapS = t.wrapT = T.RepeatWrapping;
      t.magFilter = T.NearestFilter;
      t.minFilter = T.LinearMipmapLinearFilter;
      made.textures++;
      return t;
    }
    function Geo() { this.p = []; this.u = []; this.c = []; }
    Geo.prototype.tri = function (a, b, c, ua, ub, uc, col) {
      this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      this.u.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1]);
      for (let k = 0; k < 3; k++) this.c.push(col[0], col[1], col[2]);
    };
    Geo.prototype.quad = function (a, b, c, d, ua, ub, uc, ud, col) {
      this.tri(a, b, c, ua, ub, uc, col);
      this.tri(a, c, d, ua, uc, ud, col);
    };
    Geo.prototype.mesh = function (mat, up) {
      if (!this.p.length) return null;
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(this.p, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(this.u, 2));
      g.setAttribute('color', new T.Float32BufferAttribute(this.c, 3));
      if (up) {
        const n = new Float32Array(this.p.length);
        for (let i = 1; i < n.length; i += 3) n[i] = 1;
        g.setAttribute('normal', new T.BufferAttribute(n, 3));
      } else g.computeVertexNormals();
      g.computeBoundingSphere();
      const m = new T.Mesh(g, mat); m.receiveShadow = true; group.add(m); made.meshes++; return m;
    };

    const roofG = new Geo(), gableG = {}, LIFT = 0.03;
    (P.roofs || []).forEach((R) => {
      const ax = R.axis === 'x', s = R.s;
      const A0 = (ax ? R.x0 : R.z0) - R.og - R.e0, A1 = (ax ? R.x1 : R.z1) + 1 + R.og + R.e1;
      const b0 = ax ? R.z0 : R.x0, b1 = (ax ? R.z1 : R.x1) + 1, bM = (b0 + b1) / 2;
      const yE = R.y0 - s * R.ov + LIFT, yR = R.y0 + s * (bM - b0) + LIFT;
      const P3 = (a, y, b) => (ax ? [a, y, b] : [b, y, a]);
      const k = 0.94 + hf2(R.x0, R.z0) * 0.09;
      const col = [R.c[0] * k, R.c[1] * k, R.c[2] * k], dark = [col[0] * 0.62, col[1] * 0.62, col[2] * 0.62], rc = [col[0] * 0.82, col[1] * 0.82, col[2] * 0.82];
      const SL = Math.hypot(bM - b0 + R.ov, yR - yE), th = 0.14;
      for (const be of [b0 - R.ov, b1 + R.ov]) {
        roofG.quad(P3(A0, yE, be), P3(A1, yE, be), P3(A1, yR, bM), P3(A0, yR, bM), [A0, 0], [A1, 0], [A1, SL], [A0, SL], col);
        roofG.quad(P3(A0, yE - th, be), P3(A1, yE - th, be), P3(A1, yE, be), P3(A0, yE, be), [A0, 0], [A1, 0], [A1, th], [A0, th], dark);
        for (const [a, on] of [[A0, R.g0], [A1, R.g1]]) if (on) roofG.quad(P3(a, yE - th, be), P3(a, yE, be), P3(a, yR, bM), P3(a, yR - th, bM), [0, 0], [th, 0], [th, SL], [0, SL], dark);
      }
      for (const sg of [-1, 1]) {
        roofG.quad(P3(A0, yR - 0.08, bM + sg * 0.2), P3(A1, yR - 0.08, bM + sg * 0.2), P3(A1, yR + 0.12, bM), P3(A0, yR + 0.12, bM), [A0, 0], [A1, 0], [A1, 0.25], [A0, 0.25], rc);
      }
      const gg = gableG[R.gt] || (gableG[R.gt] = new Geo()), gc = R.gc;
      for (const [end, on] of [[0, R.g0], [1, R.g1]]) {
        if (!on) continue;
        const aw = end === 0 ? (ax ? R.x0 : R.z0) : (ax ? R.x1 : R.z1) + 1, sh = ax ? 0.9 : 0.84, c3 = [gc[0] * sh, gc[1] * sh, gc[2] * sh];
        const flip = (ax && end === 1) || (!ax && end === 0), uu = (z) => (flip ? -z : z), Pz = (bb) => R.y0 + s * Math.min(bb - b0, b1 - bb);
        for (let b = b0; b < b1; b++) {
          const d = Math.min(b - b0, b1 - 1 - b), top = R.y0 + Math.floor(s * d + 1e-6), cuts = bM > b && bM < b + 1 ? [b, bM, b + 1] : [b, b + 1];
          for (let q = 0; q < cuts.length - 1; q++) {
            const za = cuts[q], zb = cuts[q + 1], ya = Pz(za) + LIFT, yb = Pz(zb) + LIFT;
            if (ya - top < 0.02 && yb - top < 0.02) continue;
            gg.quad(P3(aw, top, za), P3(aw, top, zb), P3(aw, yb, zb), P3(aw, ya, za), [uu(za), top], [uu(zb), top], [uu(zb), yb], [uu(za), ya], c3);
          }
        }
      }
    });
    { const m = roofG.mesh(new T.MeshLambertMaterial({ map: tileTex('slates'), vertexColors: true, side: T.DoubleSide })); if (m) m.castShadow = true; }
    for (const n in gableG) gableG[n].mesh(new T.MeshLambertMaterial({ map: tileTex(n), vertexColors: true, side: T.DoubleSide }));

    // Clay Chimney Pots & Flagpoles
    const mPot = new Merger();
    (P.pots || []).forEach((p) => {
      mPot.add(cyl(0.16, 0.2, 0.55, 8), M(p[0], p[1] + 0.27, p[2]));
      mPot.add(cyl(0.2, 0.2, 0.08, 8), M(p[0], p[1] + 0.56, p[2]));
    });
    mPot.mesh(new T.MeshLambertMaterial({ color: 0xb2643c }));

    // Chandeliers & Candles inside Philosopher Residences
    const mGold = new Merger(), mGoldD = new Merger(), candleXf = [];
    (P.chandeliers || []).forEach((c) => {
      const { x, y, z, r } = c, top = c.top != null ? c.top : y + 2.5;
      mGoldD.add(cyl(0.025, 0.025, top - y, 6), M(x, (top + y) / 2, z));
      const tiers = c.kind === 'ring' ? [[0, r], [0.45, r * 0.6]] : [[0, r]];
      tiers.forEach(([ry, rr]) => mGold.add(torus(rr, 0.045), M(x, y + ry, z, Math.PI / 2)));
      mGold.add(sph(0.12), M(x, y - 0.14, z));
      tiers.forEach(([ry, rr]) => {
        for (let i = 0; i < 6; i++) {
          const a = (i + 0.5) / 6 * Math.PI * 2;
          candleXf.push([x + Math.cos(a) * rr, y + ry + 0.05, z + Math.sin(a) * rr, 0.12]);
        }
      });
    });
    (P.candles || []).forEach((c) => {
      if (c.one) {
        mGoldD.add(cyl(0.07, 0.09, 0.05, 8), M(c.x, c.y + 0.025, c.z));
        candleXf.push([c.x, c.y + 0.05, c.z, 0.18]);
      }
    });
    mGold.mesh(goldMat); mGoldD.mesh(goldDarkMat);

    let flames = null;
    if (candleXf.length) {
      const cg = cyl(0.025, 0.025, 1, 6); cg.translate(0, 0.5, 0);
      const fg = new T.ConeGeometry(0.035, 0.11, 6); fg.translate(0, 0.055, 0);
      const candlesMesh = new T.InstancedMesh(cg, waxMat, candleXf.length);
      flames = new T.InstancedMesh(fg, flameMat, candleXf.length);
      const m = new T.Matrix4();
      candleXf.forEach((c, i) => {
        m.makeScale(1, c[3], 1).setPosition(c[0], c[1], c[2]); candlesMesh.setMatrixAt(i, m);
        m.makeTranslation(c[0], c[1] + c[3], c[2]); flames.setMatrixAt(i, m);
      });
      group.add(candlesMesh, flames); made.meshes += 2;
    }

    // Wall Climbers: Ivy, Roses, Wisteria
    function creeperTex(kind) {
      const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d'), r = rng(kind.length * 31 + 7);
      const leaf = ['#2c4a22', '#3a5e2a', '#24401c', '#46702f', '#335526'];
      x.strokeStyle = '#5a4630'; x.lineWidth = 2;
      for (let i = 0; i < 6; i++) { let px = r() * 128, py = 128; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 7; k++) { px += (r() - 0.5) * 28; py -= 18; x.lineTo(px, py); } x.stroke(); }
      for (let i = 0; i < 800; i++) { const px = r() * 128, py = r() * 128, sz = 2 + r() * 3.5; x.fillStyle = leaf[(r() * leaf.length) | 0]; x.beginPath(); x.ellipse(px, py, sz, sz * 0.72, r() * 3, 0, 7); x.fill(); }
      if (kind === 'rose') for (let i = 0; i < 95; i++) { x.fillStyle = ['#e04a6a', '#f08aa0', '#fff0f0'][(r() * 3) | 0]; x.beginPath(); x.arc(r() * 128, r() * 128, 2.2 + r() * 2, 0, 7); x.fill(); }
      if (kind === 'wisteria') for (let i = 0; i < 45; i++) { const px = r() * 128, py = r() * 100; for (let k = 0; k < 7; k++) { x.fillStyle = k < 3 ? '#9c84d0' : '#c4b0ea'; x.beginPath(); x.arc(px + (r() - 0.5) * 3, py + k * 3, 2.6 - k * 0.22, 0, 7); x.fill(); } }
      const t = new T.CanvasTexture(c); made.textures++; return t;
    }
    const crG = {};
    (P.creepers || []).forEach((m, ci) => {
      const g = crG[m.kind] || (crG[m.kind] = new Geo()), o = 0.05, c = [1, 1, 1];
      for (let i = 0; i < m.w; i++) for (let j = 0; j < Math.ceil(m.h); j++) {
        const hh = Math.min(1, m.h - j), ju = hf2(i + ci, j) * 0.5, jv = hf2(j + ci, i) * 0.5;
        const x0 = i, x1 = i + 1, y0 = m.y + j, y1 = m.y + j + hh;
        const uv = [[ju, jv], [ju + 0.5, jv], [ju + 0.5, jv + 0.5 * hh], [ju, jv + 0.5 * hh]];
        const z = m.z + (m.face === '-z' ? -o : o);
        g.quad([m.x + x0, y0, z], [m.x + x1, y0, z], [m.x + x1, y1, z], [m.x + x0, y1, z], uv[0], uv[1], uv[2], uv[3], c);
      }
    });
    for (const k in crG) crG[k].mesh(new T.MeshLambertMaterial({ map: creeperTex(k), alphaTest: 0.5, side: T.DoubleSide, vertexColors: true }));

    // 6,200 Wildflower & Reed Tufts
    function tuftTex() {
      const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'), r = rng(5);
      for (let k = 0; k < 4; k++) {
        const ox = k * 64, n = 24;
        for (let i = 0; i < n; i++) {
          const bx = ox + 6 + r() * 52, top = 12 + r() * 28, lean = (r() - 0.5) * 14;
          x.strokeStyle = ['#5a9038', '#6aa042', '#4e8032', '#7ab04a'][(r() * 4) | 0]; x.lineWidth = 1.8;
          x.beginPath(); x.moveTo(bx, 64); x.quadraticCurveTo(bx + lean * 0.3, (64 + top) / 2, bx + lean, top); x.stroke();
          if (k >= 2 && r() < 0.55) { x.fillStyle = ['#f2d22a', '#e8607a', '#ffffff', '#b07ad8'][(r() * 4) | 0]; x.beginPath(); x.arc(bx + lean, top, 2.5, 0, 7); x.fill(); }
        }
      }
      const t = new T.CanvasTexture(c); made.textures++; return t;
    }
    if (P.tufts && P.tufts.length) {
      const tg = new Geo(), HT = [0.55, 1.35, 1.0, 0.65], WD = [0.9, 0.85, 0.9, 0.85], white = [1, 1, 1];
      P.tufts.forEach(([x, y, z, k, sc]) => {
        const h = HT[k] * sc, w = WD[k] * sc * 0.5, a = hf2(x, z) * 3.14, u0 = k * 0.25 + 0.004, u1 = (k + 1) * 0.25 - 0.004;
        for (const aa of [a, a + Math.PI / 2]) {
          const dx = Math.cos(aa) * w, dz = Math.sin(aa) * w;
          const A = [x - dx, y, z - dz], Bq = [x + dx, y, z + dz], Cq = [x + dx, y + h, z + dz], Dq = [x - dx, y + h, z - dz];
          tg.quad(A, Bq, Cq, Dq, [u0, 0], [u1, 0], [u1, 1], [u0, 1], white);
          tg.quad(Bq, A, Dq, Cq, [u1, 0], [u0, 0], [u0, 1], [u1, 1], white);
        }
      });
      tg.mesh(new T.MeshLambertMaterial({ map: tuftTex(), alphaTest: 0.45, vertexColors: true }), true);
    }

    /* ---------------- 2. ARCHITECTURAL 3D CARVED WALNUT & CAST-BRONZE HOUSE PLAQUES ---------------- */
    function makeHouseNameplateTex(phil) {
      const c = document.createElement('canvas'); c.width = 512; c.height = 136;
      const x = c.getContext('2d');
      // Aged dark walnut & patinated bronze architectural surface
      paintWoodGrain(x, 512, 136, '#2e2219', '#1e1510', (phil.num || 1) * 17);
      // Recessed subtle antique-brass hairline molding (no garish bright yellow borders)
      x.strokeStyle = 'rgba(196, 164, 102, 0.58)'; x.lineWidth = 2.5; x.strokeRect(14, 14, 484, 108);
      // Corner brass rivets
      [[24, 24], [488, 24], [24, 112], [488, 112]].forEach(([rx, ry]) => {
        x.fillStyle = '#b49252'; x.beginPath(); x.arc(rx, ry, 3.5, 0, Math.PI * 2); x.fill();
      });

      // Embossed antique-ivory / gold-leaf lettering with subtle engraved drop shadow
      const shortEn = (phil.en || '').split('(')[0].trim().split(' ').pop() || '';
      x.textAlign = 'center';
      x.shadowColor = 'rgba(0,0,0,0.65)'; x.shadowBlur = 2; x.shadowOffsetY = 2;
      x.fillStyle = '#ead8b1';
      x.font = '700 33px "Songti SC", "STSong", Georgia, serif';
      x.fillText(`${phil.name}  ·  ${shortEn.toUpperCase()}`, 256, 62);

      const shortHouse = (phil.houseTitle || '').split('&')[0].split('·').pop().trim();
      x.fillStyle = '#bba885';
      x.font = '500 19px "PingFang SC", Georgia, serif';
      x.fillText(shortHouse.length > 14 ? shortHouse.slice(0, 14) : shortHouse, 256, 102);

      const tex = new T.CanvasTexture(c);
      if (T.sRGBEncoding !== undefined) tex.encoding = T.sRGBEncoding;
      made.textures++;
      return tex;
    }

    const mBrackets = new Merger();
    const mPlaqueWood = new Merger();
    (P.houseSigns || []).forEach((hs) => {
      const { x, y, z, phil } = hs;
      const py = y + 0.44;
      const pw = 1.62, ph = 0.44, pd = 0.09;
      // 3D Carved Timber/Bronze Backing Slab + Stepped Molded Frame + Wrought-Iron Mounting Straps
      mPlaqueWood.add(new T.BoxGeometry(pw + 0.14, ph + 0.12, pd), M(x, py, z - 0.04));
      mBrackets.add(new T.BoxGeometry(pw + 0.18, 0.045, pd + 0.03), M(x, py + ph / 2 + 0.05, z - 0.03));
      mBrackets.add(new T.BoxGeometry(pw + 0.18, 0.045, pd + 0.03), M(x, py - ph / 2 - 0.05, z - 0.03));
      mBrackets.add(cyl(0.022, 0.022, 0.22, 6), M(x - 0.62, py + ph / 2 + 0.14, z - 0.04));
      mBrackets.add(cyl(0.022, 0.022, 0.22, 6), M(x + 0.62, py + ph / 2 + 0.14, z - 0.04));

      // Lit Lambert faceplate with subtle warm emissiveMap so calligraphy stays crisp even on shadowed facades
      const tex = makeHouseNameplateTex(phil);
      const signMesh = new T.Mesh(
        new T.PlaneGeometry(pw, ph),
        new T.MeshLambertMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.34 })
      );
      signMesh.position.set(x, py, z + 0.012);
      group.add(signMesh);
      made.meshes++;
    });

    /* ---------------- 3. 3D CARVED OAK GARDEN FINGERPOSTS (实木立体指路牌) ---------------- */
    function makeFingerSlatTex(label, seed) {
      const c = document.createElement('canvas'); c.width = 320; c.height = 64;
      const x = c.getContext('2d');
      paintWoodGrain(x, 320, 64, '#5a3f28', '#3e2a19', seed || 9);
      x.strokeStyle = 'rgba(218, 196, 152, 0.45)'; x.lineWidth = 2; x.strokeRect(5, 5, 310, 54);
      x.fillStyle = '#f2e6cc';
      x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = 2; x.shadowOffsetY = 1;
      x.font = '700 23px "Songti SC", "PingFang SC", Georgia, serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(label, 156, 33);
      const tex = new T.CanvasTexture(c);
      if (T.sRGBEncoding !== undefined) tex.encoding = T.sRGBEncoding;
      made.textures++;
      return tex;
    }

    const mPosts = new Merger();
    const mPostLantern = new Merger();
    (P.wayposts || []).forEach((wp, wIdx) => {
      const { x, y, z } = wp;
      mPosts.add(new T.BoxGeometry(0.46, 0.34, 0.46), M(x, y + 0.17, z));
      mPosts.add(cyl(0.085, 0.10, 3.05, 8), M(x, y + 1.65, z));
      mBrackets.add(new T.BoxGeometry(0.24, 0.05, 0.24), M(x, y + 3.22, z));
      mPostLantern.add(new T.BoxGeometry(0.16, 0.22, 0.16), M(x, y + 3.35, z));
      mBrackets.add(new T.ConeGeometry(0.19, 0.16, 4), M(x, y + 3.53, z, 0, Math.PI / 4, 0));

      (wp.arms || []).slice(0, 3).forEach((arm, idx) => {
        const cleanLabel = (arm.label || '').replace(/#\d+\s*/g, '').split('·')[0].split('(')[0].trim().slice(0, 7);
        const sy = y + 2.75 - idx * 0.34;
        const ang = (arm.angle != null ? arm.angle : idx * 1.6);
        const slatLen = 1.24;
        const dx = Math.sin(ang) * (slatLen * 0.5 + 0.06);
        const dz = Math.cos(ang) * (slatLen * 0.5 + 0.06);
        // Real 3D Wooden Fingerpost Board + Tapered Pointer Tip
        mPosts.add(new T.BoxGeometry(slatLen, 0.24, 0.06), M(x + dx, sy, z + dz, 0, ang + Math.PI / 2, 0));
        const tipX = x + Math.sin(ang) * (slatLen + 0.12), tipZ = z + Math.cos(ang) * (slatLen + 0.12);
        mPosts.add(new T.ConeGeometry(0.12, 0.18, 4), M(tipX, sy, tipZ, Math.PI / 2, ang, 0));

        const slatTex = makeFingerSlatTex(cleanLabel, wIdx * 13 + idx);
        const slatMat = new T.MeshLambertMaterial({ map: slatTex, emissiveMap: slatTex, emissive: 0xffffff, emissiveIntensity: 0.28 });
        const nx = Math.cos(ang) * 0.034, nz = -Math.sin(ang) * 0.034;
        const f1 = new T.Mesh(new T.PlaneGeometry(slatLen - 0.04, 0.21), slatMat);
        f1.position.set(x + dx + nx, sy, z + dz + nz);
        f1.rotation.y = ang + Math.PI / 2;
        const f2 = new T.Mesh(new T.PlaneGeometry(slatLen - 0.04, 0.21), slatMat);
        f2.position.set(x + dx - nx, sy, z + dz - nz);
        f2.rotation.y = ang - Math.PI / 2;
        group.add(f1, f2);
        made.meshes += 2;
      });
    });
    mPosts.mesh(oakPostMat);
    mPlaqueWood.mesh(new T.MeshLambertMaterial({ color: 0x2c1e14 }));
    mBrackets.mesh(bronzeMat);
    mPostLantern.mesh(new T.MeshBasicMaterial({ color: 0xffe49e }));

    /* ---------------- 3B. ANCIENT GREEK CLASSICAL TEMPLES: PARTHENON, THOLOS, PROPYLAEA & STOA ---------------- */
    function flutedMarbleTex() {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const x = c.getContext('2d');
      // 20 classical Doric/Ionic vertical concave flutes with warm Pentelic marble shading
      const flutes = 20, fw = 256 / flutes;
      for (let i = 0; i < flutes; i++) {
        const x0 = i * fw;
        const g = x.createLinearGradient(x0, 0, x0 + fw, 0);
        g.addColorStop(0.0, '#fcfaf2');
        g.addColorStop(0.22, '#e4dccb');
        g.addColorStop(0.5, '#cec3ae');
        g.addColorStop(0.78, '#ebe4d4');
        g.addColorStop(1.0, '#fcfaf2');
        x.fillStyle = g;
        x.fillRect(x0, 0, fw + 0.5, 256);
      }
      // Subtle horizontal ashlar drum joints
      x.strokeStyle = 'rgba(150, 138, 118, 0.35)';
      x.lineWidth = 1.5;
      for (let y = 32; y < 256; y += 32) {
        x.beginPath(); x.moveTo(0, y); x.lineTo(256, y); x.stroke();
      }
      const t = new T.CanvasTexture(c);
      t.wrapS = t.wrapT = T.RepeatWrapping;
      made.textures++;
      return t;
    }

    function makeGreekArchitraveTex(text) {
      const c = document.createElement('canvas'); c.width = 1024; c.height = 72;
      const x = c.getContext('2d');
      // Subtle veined Pentelic marble incised inscription (proper 14:1 architrave proportion, no squishing)
      const g = x.createLinearGradient(0, 0, 0, 72);
      g.addColorStop(0, '#f3ede0'); g.addColorStop(1, '#e6ddca');
      x.fillStyle = g; x.fillRect(0, 0, 1024, 72);
      x.strokeStyle = 'rgba(138, 124, 102, 0.35)'; x.lineWidth = 2; x.strokeRect(5, 5, 1014, 62);
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.font = '700 28px "Songti SC", Georgia, serif';
      const shortTxt = text.length > 34 ? text.slice(0, 34) : text;
      x.fillStyle = 'rgba(255, 255, 255, 0.72)';
      x.fillText(shortTxt, 512, 38);
      x.fillStyle = '#3f362c';
      x.fillText(shortTxt, 512, 36);
      const tex = new T.CanvasTexture(c);
      if (T.sRGBEncoding !== undefined) tex.encoding = T.sRGBEncoding;
      made.textures++;
      return tex;
    }

    const flutedMat = new T.MeshLambertMaterial({ map: flutedMarbleTex() });
    const pentelicMat = new T.MeshLambertMaterial({ color: 0xf4efe4 });
    const lapisMat = new T.MeshLambertMaterial({ color: 0x26416b });
    const greekTileTex = makeRibbedTileTex('#be6244', '#8a3e28', '#d67e5c', 301);
    greekTileTex.repeat.set(6, 3);
    const terracottaRoofMat = new T.MeshLambertMaterial({ map: greekTileTex });
    const mFluted = new Merger(), mPentelic = new Merger(), mGreekGold = new Merger(), mLapis = new Merger(), mGreekBronze = new Merger(), mGreekFlame = new Merger();

    function addGreekColumn(cx, cy, cz, h, r, order) {
      // 1. 3-Tier Attic Marble Base
      mPentelic.add(new T.BoxGeometry(r * 2.35, 0.22, r * 2.35), M(cx, cy + 0.11, cz));
      mPentelic.add(cyl(r * 1.16, r * 1.24, 0.16, 16), M(cx, cy + 0.30, cz));
      mPentelic.add(cyl(r * 1.04, r * 1.12, 0.12, 16), M(cx, cy + 0.44, cz));

      // 2. 20-Fluted Marble Shaft with Classical Entasis (subtle lower curve + upper taper)
      const shaftH = h - 1.02;
      const h1 = shaftH * 0.38, h2 = shaftH * 0.62;
      mFluted.add(cyl(r * 0.98, r * 1.0, h1, 20), M(cx, cy + 0.50 + h1 / 2, cz));
      mFluted.add(cyl(r * 0.82, r * 0.98, h2, 20), M(cx, cy + 0.50 + h1 + h2 / 2, cz));

      // 3. Golden Necking Astragal Ring
      const yCap = cy + h - 0.52;
      mGreekGold.add(torus(r * 0.84, 0.042), M(cx, yCap, cz, Math.PI / 2));

      // 4. Classical Capital (Doric Echinus/Abacus or Ionic Spiral Volutes)
      if (order === 'ionic') {
        mPentelic.add(cyl(r * 1.12, r * 0.84, 0.22, 16), M(cx, yCap + 0.11, cz));
        // Four Ionic Volute Scrolls with golden eyes
        mPentelic.add(cyl(0.20, 0.20, r * 2.35, 12), M(cx - r * 0.88, yCap + 0.24, cz, Math.PI / 2, 0, 0));
        mPentelic.add(cyl(0.20, 0.20, r * 2.35, 12), M(cx + r * 0.88, yCap + 0.24, cz, Math.PI / 2, 0, 0));
        mGreekGold.add(cyl(0.08, 0.08, r * 2.42, 8), M(cx - r * 0.88, yCap + 0.24, cz, Math.PI / 2, 0, 0));
        mGreekGold.add(cyl(0.08, 0.08, r * 2.42, 8), M(cx + r * 0.88, yCap + 0.24, cz, Math.PI / 2, 0, 0));
        mPentelic.add(new T.BoxGeometry(r * 2.35, 0.18, r * 2.35), M(cx, cy + h - 0.09, cz));
      } else {
        // Doric flaring Echinus & sturdy square Abacus
        mPentelic.add(cyl(r * 1.24, r * 0.84, 0.28, 20), M(cx, yCap + 0.14, cz));
        mPentelic.add(new T.BoxGeometry(r * 2.52, 0.24, r * 2.52), M(cx, cy + h - 0.12, cz));
      }
    }

    (P.greekColumns || []).forEach((col) => {
      addGreekColumn(col.x, col.y, col.z, col.h, col.r || 0.46, col.order || 'doric');
    });

    // Helper: Add Monumental Chryselephantine (Gold & Ivory) Classical Deity Statue (Athena Sophia / Apollo)
    function addClassicalStatue(sx, sy, sz, deity) {
      // Stepped Pentelic Marble & Gold Plinth
      mPentelic.add(new T.BoxGeometry(2.1, 0.45, 2.1), M(sx, sy + 0.22, sz));
      mGreekGold.add(new T.BoxGeometry(1.85, 0.12, 1.85), M(sx, sy + 0.50, sz));
      mPentelic.add(new T.BoxGeometry(1.6, 0.7, 1.6), M(sx, sy + 0.90, sz));
      mGreekGold.add(new T.BoxGeometry(1.72, 0.12, 1.72), M(sx, sy + 1.30, sz));

      const by = sy + 1.36;
      // Draped Chiton / Peplos Robe & Torso
      mFluted.add(cyl(0.36, 0.52, 1.85, 16), M(sx, by + 0.92, sz));
      mGreekGold.add(cyl(0.40, 0.34, 0.85, 14), M(sx, by + 2.15, sz));
      // Shoulders & Head
      mGreekGold.add(new T.BoxGeometry(0.95, 0.24, 0.45), M(sx, by + 2.55, sz));
      mPentelic.add(sph(0.28), M(sx, by + 2.95, sz));

      if (deity === 'apollo') {
        // Solar Halo & Golden Lyre
        mGreekGold.add(torus(0.52, 0.045), M(sx, by + 3.05, sz - 0.12));
        mGreekGold.add(torus(0.32, 0.045), M(sx - 0.58, by + 2.25, sz + 0.2));
      } else {
        // Athena's Crested Corinthian Helmet, Aegis Shield & Tall Golden Spear
        mGreekGold.add(cyl(0.22, 0.30, 0.28, 12), M(sx, by + 3.16, sz));
        mGreekGold.add(new T.BoxGeometry(0.10, 0.45, 0.62), M(sx, by + 3.45, sz));
        // Golden Aegis Shield on Left Arm
        mGreekGold.add(cyl(0.62, 0.62, 0.10, 20), M(sx + 0.65, by + 1.95, sz + 0.15, 0, 0, Math.PI / 2));
        // Tall Golden Spear in Right Hand
        mGreekGold.add(cyl(0.038, 0.038, 3.8, 8), M(sx - 0.62, by + 1.9, sz + 0.2));
      }
    }

    // Build Peripteral Entablatures, Lapis-Blue & Gold Triglyph-Metope Friezes, Tympanum Pediment Sculptures & Golden Acroteria!
    (P.greekTemples || []).forEach((TPL) => {
      const { x0, z0, x1, z1, gy, colH, slope } = TPL;
      const Wt = x1 - x0 + 1, Dt = z1 - z0 + 1;
      const cx = (x0 + x1 + 1) / 2, cz = (z0 + z1 + 1) / 2;
      const yE = gy + colH;

      // 1. Lower Architrave Taenia & Upper Geison Projecting Cornices around all 4 sides
      mPentelic.add(new T.BoxGeometry(Wt + 0.6, 0.22, Dt + 0.6), M(cx, yE + 0.11, cz));
      mGreekGold.add(new T.BoxGeometry(Wt + 0.68, 0.08, Dt + 0.68), M(cx, yE + 0.25, cz));
      mLapis.add(new T.BoxGeometry(Wt + 0.42, 0.56, Dt + 0.42), M(cx, yE + 0.56, cz));
      mPentelic.add(new T.BoxGeometry(Wt + 0.9, 0.22, Dt + 0.9), M(cx, yE + 0.94, cz));

      // 2. White Marble Triglyphs & Golden Metope Relief Medallions around Front, Back & Sides
      const plaqueHalfW = TPL.inscription ? Math.min(Wt * 0.64, 10.6) / 2 + 0.45 : 0;
      for (let x = x0 + 0.5; x <= x1 + 0.5; x += 2.0) {
        for (const [fi, fz] of [[0, z0 - 0.24], [1, z1 + 1.24]]) {
          if (fi === 1 && Math.abs(x - cx) < plaqueHalfW) continue;
          mPentelic.add(new T.BoxGeometry(0.42, 0.54, 0.12), M(x, yE + 0.56, fz));
          if (x + 1.0 <= x1 + 0.5 && !(fi === 1 && Math.abs(x + 1.0 - cx) < plaqueHalfW)) {
            mGreekGold.add(cyl(0.22, 0.22, 0.10, 12), M(x + 1.0, yE + 0.56, fz, Math.PI / 2, 0, 0));
          }
        }
      }
      for (let z = z0 + 0.5; z <= z1 + 0.5; z += 2.0) {
        for (const fx of [x0 - 0.24, x1 + 1.24]) {
          mPentelic.add(new T.BoxGeometry(0.12, 0.54, 0.42), M(fx, yE + 0.56, z));
          if (z + 1.0 <= z1 + 0.5) {
            mGreekGold.add(cyl(0.22, 0.22, 0.10, 12), M(fx, yE + 0.56, z + 1.0, 0, 0, Math.PI / 2));
          }
          // Carved Pentelic Marble Eave Antefixes (古典大理石棕叶瓦当) along lateral roof eaves
          mPentelic.add(new T.BoxGeometry(0.14, 0.28, 0.24), M(fx < cx ? x0 - 0.42 : x1 + 1.42, yE + 1.12, z));
        }
      }

      // 3. Triangular Pediment Tympanum Sculptural Reliefs (山花三角楣浮雕群) & Carved Marble Acroteria
      const yBase = yE + 1.05;
      const peakH = slope * (Wt / 2);
      const yApex = yBase + peakH;
      for (const fz of [z1 + 1.12, z0 - 0.12]) {
        // Central Standing Deity / Philosopher Relief Statue inside Tympanum
        const cH = Math.min(2.0, Math.max(1.15, peakH * 0.56));
        mPentelic.add(new T.BoxGeometry(1.05, 0.20, 0.32), M(cx, yBase + 0.10, fz));
        mPentelic.add(cyl(0.26, 0.38, cH * 0.65, 12), M(cx, yBase + 0.20 + cH * 0.32, fz));
        mPentelic.add(new T.BoxGeometry(0.72, cH * 0.34, 0.26), M(cx, yBase + 0.20 + cH * 0.78, fz));
        mPentelic.add(sph(0.22), M(cx, yBase + cH + 0.34, fz));
        // Subtle Antique-Bronze Shield Accent
        mGreekBronze.add(cyl(0.32, 0.32, 0.06, 16), M(cx + 0.48, yBase + cH * 0.68, fz + 0.05, Math.PI / 2, 0, 0));

        // Flanking Pediment Relief Figures (Sculpted Pentelic Marble Muses/Philosophers)
        for (const side of [-1, 1]) {
          for (let k = 1; k <= 3; k++) {
            const dx = side * k * (Wt * 0.105);
            const figH = Math.min(1.45, Math.max(0.45, (1 - (Math.abs(dx) / (Wt * 0.46))) * peakH * 0.52));
            mPentelic.add(new T.BoxGeometry(0.68, 0.14, 0.26), M(cx + dx, yBase + 0.07, fz));
            mPentelic.add(cyl(0.20, 0.32, figH * 0.72, 10), M(cx + dx, yBase + 0.14 + figH * 0.36, fz));
            mPentelic.add(new T.BoxGeometry(0.50, figH * 0.28, 0.20), M(cx + dx, yBase + 0.14 + figH * 0.80, fz));
            mPentelic.add(sph(0.16), M(cx + dx, yBase + figH + 0.24, fz));
          }
        }

        // Proportioned Carved Pentelic Marble Apex Palmette Acroterion (山花大理石棕叶顶饰)
        mPentelic.add(new T.BoxGeometry(0.68, 0.22, 0.32), M(cx, yApex + 0.12, fz));
        mPentelic.add(new T.BoxGeometry(0.48, 0.46, 0.22), M(cx, yApex + 0.42, fz));
        mPentelic.add(cyl(0.24, 0.24, 0.18, 12), M(cx, yApex + 0.68, fz, Math.PI / 2, 0, 0));

        // Left & Right Eave Corner Marble Acroteria Plinths
        for (const ex of [x0 - 0.32, x1 + 1.32]) {
          mPentelic.add(new T.BoxGeometry(0.42, 0.24, 0.28), M(ex, yBase + 0.12, fz));
          mPentelic.add(cyl(0.16, 0.16, 0.18, 10), M(ex, yBase + 0.32, fz, Math.PI / 2, 0, 0));
        }
      }

      // 4. Incised Carved Pentelic Marble Architrave Inscription (lit Lambert, flush with stone entablature)
      if (TPL.inscription) {
        const pTex = makeGreekArchitraveTex(TPL.inscription);
        const pw = Math.min(Wt * 0.64, 10.6);
        mPentelic.add(new T.BoxGeometry(pw + 0.12, 0.58, 0.12), M(cx, yE + 0.56, z1 + 1.24));
        const pMesh = new T.Mesh(
          new T.PlaneGeometry(pw, 0.52),
          new T.MeshLambertMaterial({ map: pTex })
        );
        pMesh.position.set(cx, yE + 0.56, z1 + 1.31);
        group.add(pMesh);
        made.meshes++;
      }

      // 5. Inner Naos Monumental Chryselephantine Statue
      if (TPL.hasStatue) {
        addClassicalStatue(TPL.statueX, gy, TPL.statueZ, TPL.deity);
      }
    });

    // Build Socrates' Classical Delphi Tholos Rotunda Temple (雅典阿哥拉 · 德尔斐二十柱大理石圆亭神庙)
    (P.greekTholos || []).forEach((TH) => {
      const { x, y, z, rOuter, rInner, colH } = TH;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        addGreekColumn(x + Math.cos(a) * rOuter, y, z + Math.sin(a) * rOuter, colH, 0.46, 'doric');
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        addGreekColumn(x + Math.cos(a) * rInner, y, z + Math.sin(a) * rInner, colH, 0.40, 'ionic');
      }
      // Circular Pentelic Marble Entablature Ring + Lapis Frieze + Marble Antefixes
      const yE = y + colH;
      mPentelic.add(cyl(rOuter + 0.55, rOuter + 0.55, 0.36, 32), M(x, yE + 0.18, z));
      mLapis.add(cyl(rOuter + 0.48, rOuter + 0.48, 0.48, 32), M(x, yE + 0.60, z));
      mPentelic.add(cyl(rOuter + 0.78, rOuter + 0.58, 0.26, 32), M(x, yE + 0.96, z));
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        const rx = x + Math.cos(a) * (rOuter + 0.52), rz = z + Math.sin(a) * (rOuter + 0.52);
        mPentelic.add(new T.BoxGeometry(0.18, 0.44, 0.08), M(rx, yE + 0.60, rz, 0, -a + Math.PI / 2, 0));
        if (i % 2 === 0) {
          mPentelic.add(new T.BoxGeometry(0.22, 0.28, 0.12), M(x + Math.cos(a) * (rOuter + 0.74), yE + 1.16, z + Math.sin(a) * (rOuter + 0.74), 0, -a + Math.PI / 2, 0));
        }
      }
      // Classical Low-Pitched Ribbed-Terracotta Conical Tholos Roof + Carved Marble Acanthus Finial
      const cone = new T.Mesh(new T.ConeGeometry(rOuter + 0.95, 3.0, 36), terracottaRoofMat);
      cone.position.set(x, yE + 2.55, z);
      cone.castShadow = true;
      cone.receiveShadow = true;
      group.add(cone);
      made.meshes++;

      const yApex = yE + 4.02;
      mPentelic.add(cyl(0.55, 0.78, 0.32, 20), M(x, yApex + 0.12, z));
      mPentelic.add(cyl(0.28, 0.44, 0.55, 16), M(x, yApex + 0.50, z));
      mPentelic.add(cyl(0.14, 0.24, 0.42, 12), M(x, yApex + 0.94, z));
    });

    // Build Classical Bronze Tripod Sacred Fire Braziers (古希腊青铜三足圣火鼎)
    (P.greekBraziers || []).forEach((br) => {
      const { x, y, z } = br;
      mPentelic.add(cyl(0.52, 0.62, 0.28, 12), M(x, y + 0.14, z));
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        mGreekBronze.add(cyl(0.055, 0.07, 1.15, 8), M(x + Math.cos(a) * 0.32, y + 0.75, z + Math.sin(a) * 0.32));
      }
      mGreekBronze.add(cyl(0.56, 0.32, 0.38, 14), M(x, y + 1.35, z));
      mGreekGold.add(torus(0.56, 0.045), M(x, y + 1.52, z, Math.PI / 2));
      mGreekFlame.add(new T.ConeGeometry(0.36, 0.75, 8), M(x, y + 1.85, z));
    });

    mFluted.mesh(flutedMat);
    mPentelic.mesh(pentelicMat);
    mGreekGold.mesh(goldMat);
    mLapis.mesh(lapisMat);
    mGreekBronze.mesh(bronzeMat);
    mGreekFlame.mesh(flameMat);

    /* ---------------- 3B-2. RAPHAEL'S THE SCHOOL OF ATHENS (拉斐尔《雅典学院》高度还原大殿) ---------------- */
    if (P.schoolOfAthens) {
      const SA = P.schoolOfAthens;
      const cx = SA.x, gy = SA.y, cz = SA.z, x0 = SA.x0, z0 = SA.z0, x1 = SA.x1, z1 = SA.z1;

      // High-Craft Coffered Renaissance Barrel-Vault Texture (罗马式藻井拱顶贴图 — 仿布拉曼特圣彼得大教堂)
      function makeCofferedVaultTex() {
        const c = document.createElement('canvas'); c.width = 256; c.height = 256;
        const x = c.getContext('2d');
        x.fillStyle = '#e7ddc8'; x.fillRect(0, 0, 256, 256);
        // 2x2 Recessed Renaissance Octagonal/Square Coffers with Rosettes
        for (let r = 0; r < 2; r++) for (let col = 0; col < 2; col++) {
          const ox = col * 128, oy = r * 128;
          x.strokeStyle = '#c4b596'; x.lineWidth = 8; x.strokeRect(ox + 6, oy + 6, 116, 116);
          x.fillStyle = '#d3c4a5'; x.fillRect(ox + 16, oy + 16, 96, 96);
          x.strokeStyle = '#9c8b6c'; x.lineWidth = 5; x.strokeRect(ox + 22, oy + 22, 84, 84);
          x.fillStyle = '#b9a684'; x.fillRect(ox + 32, oy + 32, 64, 64);
          // Central carved rosette medallion
          x.fillStyle = '#c8a862'; x.beginPath(); x.arc(ox + 64, oy + 64, 15, 0, Math.PI * 2); x.fill();
          x.strokeStyle = '#8a7346'; x.lineWidth = 2.5; x.stroke();
        }
        const t = new T.CanvasTexture(c);
        t.wrapS = t.wrapT = T.RepeatWrapping;
        t.repeat.set(6, 2);
        if (T.sRGBEncoding !== undefined) t.encoding = T.sRGBEncoding;
        made.textures++;
        return t;
      }

      // Carved Marble Bas-Relief Panel Texture (尼奇壁龛下方古典大理石浅浮雕)
      function makeBasReliefTex() {
        const c = document.createElement('canvas'); c.width = 256; c.height = 128;
        const x = c.getContext('2d');
        x.fillStyle = '#e8dfc9'; x.fillRect(0, 0, 256, 128);
        x.strokeStyle = '#b8a88a'; x.lineWidth = 6; x.strokeRect(6, 6, 244, 116);
        // Classical sculpted figures silhouette in shallow stone relief
        for (let i = 0; i < 4; i++) {
          const fx = 44 + i * 56;
          x.fillStyle = '#d4c6a8';
          x.beginPath(); x.arc(fx, 44, 11, 0, Math.PI * 2); x.fill();
          x.fillRect(fx - 13, 56, 26, 48);
          x.fillStyle = '#f5efe0';
          x.beginPath(); x.arc(fx - 2, 42, 9, 0, Math.PI * 2); x.fill();
          x.fillRect(fx - 11, 56, 18, 44);
        }
        const t = new T.CanvasTexture(c);
        if (T.sRGBEncoding !== undefined) t.encoding = T.sRGBEncoding;
        made.textures++;
        return t;
      }

      const travertineMat = new T.MeshLambertMaterial({ color: 0xede5d4 });
      const travertineDarkMat = new T.MeshLambertMaterial({ color: 0xd4c7ad });
      const cofferedMat = new T.MeshLambertMaterial({ map: makeCofferedVaultTex(), side: T.DoubleSide });
      const reliefMat = new T.MeshLambertMaterial({ map: makeBasReliefTex() });
      const mTrav = new Merger(), mTravD = new Merger(), mSaMarble = new Merger(), mSaBronze = new Merger(), mSaGold = new Merger();
      const mPlatoRed = new Merger(), mAristBlue = new Merger(), mOchre = new Merger(), mSkin = new Merger(), mSlate = new Merger(), mHairW = new Merger(), mHairB = new Merger();

      // Helper: Build a Monumental Coffered Semicircular Barrel-Vault Triumphal Arch!
      function addTriumphalBarrelArch(az, rInner, depth, springY, addPediment) {
        const segs = 24;
        const rOuter = rInner + 1.35;
        const gVault = new Geo();
        const white = [1, 1, 1];
        for (let i = 0; i < segs; i++) {
          const a0 = (i / segs) * Math.PI, a1 = ((i + 1) / segs) * Math.PI;
          const xA0 = cx + Math.cos(a0) * rInner, yA0 = springY + Math.sin(a0) * rInner;
          const xA1 = cx + Math.cos(a1) * rInner, yA1 = springY + Math.sin(a1) * rInner;
          const xB0 = cx + Math.cos(a0) * rOuter, yB0 = springY + Math.sin(a0) * rOuter;
          const xB1 = cx + Math.cos(a1) * rOuter, yB1 = springY + Math.sin(a1) * rOuter;
          const zF = az + depth / 2, zB = az - depth / 2;
          // Inner coffered barrel vault soffit
          gVault.quad([xA0, yA0, zF], [xA1, yA1, zF], [xA1, yA1, zB], [xA0, yA0, zB], [i / segs, 0], [(i + 1) / segs, 0], [(i + 1) / segs, 1], [i / segs, 1], white);
          // Front & back curved stone archivolt rings
          const xm = (xA0 + xA1 + xB0 + xB1) * 0.25, ym = (yA0 + yA1 + yB0 + yB1) * 0.25;
          const ang = (a0 + a1) * 0.5 - Math.PI / 2;
          const chord = Math.hypot(xB1 - xB0, yB1 - yB0) * 1.06;
          mTrav.add(new T.BoxGeometry(chord, 1.38, depth + 0.16), M(xm, ym, az, 0, 0, ang));
        }
        const vMesh = gVault.mesh(cofferedMat);
        if (vMesh) vMesh.castShadow = true;

        // Flanking Massive Monumental Travertine Piers + Paired Fluted Pilasters + Molded Cornice Capitals
        const pierH = springY - gy;
        for (const sx of [-1, 1]) {
          const px = cx + sx * (rInner + 1.55);
          mTrav.add(new T.BoxGeometry(3.1, pierH, depth + 0.3), M(px, gy + pierH / 2, az));
          // Base Plinth & Springing Cornice Impost Molding
          mTravD.add(new T.BoxGeometry(3.55, 0.55, depth + 0.72), M(px, gy + 0.28, az));
          mTravD.add(new T.BoxGeometry(3.65, 0.48, depth + 0.85), M(px, springY - 0.12, az));
          // Paired Fluted Pilasters on Front & Back Pier Faces
          for (const pf of [-depth / 2 - 0.14, depth / 2 + 0.14]) {
            mSaMarble.add(new T.BoxGeometry(0.62, pierH - 0.8, 0.22), M(px - 0.85, gy + pierH / 2, az + pf));
            mSaMarble.add(new T.BoxGeometry(0.62, pierH - 0.8, 0.22), M(px + 0.85, gy + pierH / 2, az + pf));
          }
        }

        // Upper Spandrel Wall & Molded Attic Entablature Cornice above the Arch
        const crownY = springY + rOuter;
        const totalW = (rInner + 3.1) * 2;
        mTrav.add(new T.BoxGeometry(totalW, 1.15, depth + 0.2), M(cx, crownY + 0.45, az));
        mTravD.add(new T.BoxGeometry(totalW + 0.9, 0.38, depth + 0.95), M(cx, crownY + 1.12, az));
        // Keystone at Arch Apex
        mSaMarble.add(new T.BoxGeometry(0.78, 1.55, depth + 0.42), M(cx, springY + rInner + 0.65, az));

        // Front Facade Classical Incised Stone Frieze ("SCHOLA ATHENIENSIS · 雅典学院")
        if (addPediment) {
          const inscTex = makeGreekArchitraveTex('SCHOLA ATHENIENSIS  ·  雅 典 学 院  ·  ΜΗΔΕΙΣ ΑΓΕΩΜΕΤΡΗΤΟΣ ΕΙΣΙΤΩ');
          const inscMesh = new T.Mesh(
            new T.PlaneGeometry(11.6, 0.82),
            new T.MeshLambertMaterial({ map: inscTex, emissiveMap: inscTex, emissive: 0xffffff, emissiveIntensity: 0.25 })
          );
          inscMesh.position.set(cx, crownY + 0.46, az + depth / 2 + 0.14);
          group.add(inscMesh); made.meshes++;
        }
      }

      // 1. THREE RECEDING COFFERED BARREL-VAULT TRIUMPHAL ARCHES (Raphael's Exact Perspective Axis!)
      addTriumphalBarrelArch(z1 - 0.6, 5.8, 3.4, gy + 5.6, true);   // Arch 1: Grand Foreground Triumphal Arch
      addTriumphalBarrelArch(cz + 0.2, 5.8, 4.0, gy + 5.6, false);  // Arch 2: Central Crossing Vault (with Apollo & Athena Niches)
      addTriumphalBarrelArch(z0 + 1.4, 5.2, 3.0, gy + 5.4, false);  // Arch 3: Rear Sky-Framed Arch opening to bright Aegean sky!

      // Connecting Ribbed Terracotta Barrel Roof Shell on Top of the Nave (realistic exterior crown)
      const naveRoof = new T.Mesh(
        new T.CylinderGeometry(7.2, 7.2, z1 - z0 + 2.2, 24, 1, true, -Math.PI / 2, Math.PI),
        terracottaRoofMat
      );
      naveRoof.rotation.x = Math.PI / 2;
      naveRoof.position.set(cx, gy + 5.75, cz);
      naveRoof.castShadow = true;
      group.add(naveRoof); made.meshes++;

      // 2. GRAND 4-STEP FULL-WIDTH PENTELIC MARBLE STAIRCASE (The Iconic Steps of The School of Athens!)
      for (let st = 0; st < 4; st++) {
        const sy = gy + st * 0.22 + 0.11;
        const sz = cz + 2.6 - st * 0.55;
        mSaMarble.add(new T.BoxGeometry(11.8, 0.22, 0.62), M(cx, sy, sz));
      }
      // Raised Upper Philosophical Sanctuary Dais behind the 4 steps (y = gy + 0.88)
      const daisY = gy + 0.88;
      mSaMarble.add(new T.BoxGeometry(11.8, 0.88, cz - z0 + 1.4), M(cx, gy + 0.44, (cz + 0.5 + z0) * 0.5));

      // 3. TWO ICONIC WALL NICHES WITH FULL-SCALE MARBLE STATUES OF APOLLO (LEFT) & ATHENA (RIGHT)
      for (const [side, deity] of [[-1, 'apollo'], [1, 'athena']]) {
        const nx = cx + side * 6.85;
        const nz = cz + 2.4;
        const ny = gy + 2.85;
        // Semicircular Recessed Niche Frame & Shell Half-Dome
        mTravD.add(new T.BoxGeometry(2.35, 3.65, 0.42), M(nx, ny + 1.4, nz));
        mTrav.add(new T.BoxGeometry(1.75, 3.05, 0.25), M(nx, ny + 1.35, nz + 0.14));
        mTravD.add(new T.BoxGeometry(2.55, 0.24, 0.62), M(nx, ny - 0.42, nz + 0.15));
        // Classical Carved Bas-Relief Panel Directly Below Each Niche
        const relMesh = new T.Mesh(new T.PlaneGeometry(2.15, 1.05), reliefMat);
        relMesh.position.set(nx, gy + 1.55, nz + 0.28);
        group.add(relMesh); made.meshes++;

        // Sculpted White-Marble Deity Statue inside Niche
        mSaMarble.add(cyl(0.28, 0.40, 1.45, 14), M(nx, ny + 0.42, nz + 0.32));
        mSaMarble.add(cyl(0.32, 0.28, 0.68, 12), M(nx, ny + 1.42, nz + 0.32));
        mSaMarble.add(sph(0.22), M(nx, ny + 2.02, nz + 0.32));
        if (deity === 'apollo') {
          // Apollo's Golden-Bronze Lyre on Left Arm
          mSaBronze.add(torus(0.26, 0.035), M(nx - 0.34, ny + 1.52, nz + 0.45));
        } else {
          // Athena's Crested Corinthian Helmet, Tall Spear & Aegis Shield
          mSaMarble.add(new T.BoxGeometry(0.08, 0.36, 0.45), M(nx, ny + 2.34, nz + 0.32));
          mSaBronze.add(cyl(0.025, 0.025, 2.85, 8), M(nx + 0.42, ny + 1.35, nz + 0.42));
          mSaBronze.add(cyl(0.42, 0.42, 0.06, 16), M(nx - 0.42, ny + 1.25, nz + 0.45, Math.PI / 2, 0, 0));
        }
      }

      // 4. LIVING 3D SCULPTURAL TABLEAU OF RAPHAEL'S ICONIC FIGURES!
      // Helper to sculpt a recognizable classical draped figure
      function addClassicalFigure(fx, fy, fz, ry, cloakM, tunicM, hairM, pose) {
        const s = Math.sin(ry), c = Math.cos(ry);
        const loc = (lx, ly, lz) => [fx + lx * c + lz * s, fy + ly, fz - lx * s + lz * c];
        let q;
        // Draped lower robe & torso
        q = loc(0, 0.56, 0); tunicM.add(cyl(0.24, 0.34, 1.12, 12), M(q[0], q[1], q[2]));
        q = loc(0, 1.26, 0); cloakM.add(cyl(0.28, 0.26, 0.62, 12), M(q[0], q[1], q[2]));
        q = loc(0, 1.72, 0); mSkin.add(sph(0.18), M(q[0], q[1], q[2]));
        q = loc(0, 1.80, -0.02); hairM.add(sph(0.19), M(q[0], q[1], q[2], 0, 0, 0, 1.0, 0.72, 1.0));
        q = loc(0, 1.62, 0.14); hairM.add(new T.BoxGeometry(0.18, 0.16, 0.10), M(q[0], q[1], q[2], 0, ry, 0));

        if (pose === 'plato_up') {
          // PLATO: Right arm pointing straight UP to the Heavens (Realm of Forms), left hand holding Timaeus!
          q = loc(-0.32, 1.65, 0.08); cloakM.add(cyl(0.08, 0.09, 0.65, 8), M(q[0], q[1], q[2], 0, ry, 0.12));
          q = loc(-0.36, 2.04, 0.08); mSkin.add(cyl(0.035, 0.05, 0.24, 6), M(q[0], q[1], q[2]));
          q = loc(0.32, 1.18, 0.22); mSaGold.add(new T.BoxGeometry(0.14, 0.42, 0.32), M(q[0], q[1], q[2], 0.15, ry, 0));
        } else if (pose === 'aristotle_out') {
          // ARISTOTLE: Right arm extending palm-down forward toward the empirical earth, left holding Ethics!
          q = loc(-0.28, 1.26, 0.36); cloakM.add(cyl(0.08, 0.09, 0.62, 8), M(q[0], q[1], q[2], Math.PI / 2 - 0.15, ry, 0));
          q = loc(-0.28, 1.22, 0.68); mSkin.add(new T.BoxGeometry(0.14, 0.05, 0.18), M(q[0], q[1], q[2], 0, ry, 0));
          q = loc(0.30, 1.16, 0.22); mSlate.add(new T.BoxGeometry(0.14, 0.40, 0.30), M(q[0], q[1], q[2], 0.2, ry, 0));
        } else if (pose === 'zoroaster_sphere') {
          // ZOROASTER: Holding the Golden Celestial Sphere (天球仪)
          q = loc(0, 1.32, 0.46); mSaGold.add(sph(0.26), M(q[0], q[1], q[2]));
          mSaBronze.add(torus(0.30, 0.025), M(q[0], q[1], q[2], 0.5, 0.3, 0));
        } else if (pose === 'ptolemy_globe') {
          // PTOLEMY: Crowned, holding the Terrestrial Globe (地球仪)
          q = loc(0, 1.92, 0); mSaGold.add(cyl(0.17, 0.15, 0.10, 10), M(q[0], q[1], q[2]));
          q = loc(0, 1.32, 0.46); mAristBlue.add(sph(0.26), M(q[0], q[1], q[2]));
        }
      }

      // (A) TOP OF GRAND STEPS — CENTER FOCAL POINT: PLATO (pointing UP) & ARISTOTLE (gesturing OUTWARD) framed against the sky!
      addClassicalFigure(cx - 0.85, daisY, cz - 2.2, 0, mPlatoRed, mOchre, mHairW, 'plato_up');
      addClassicalFigure(cx + 0.85, daisY, cz - 2.2, 0, mAristBlue, mOchre, mHairB, 'aristotle_out');

      // (B) ON THE MARBLE STEPS — DIOGENES THE CYNIC lounging diagonally with his wooden bowl!
      mAristBlue.add(cyl(0.22, 0.28, 1.15, 10), M(cx + 2.4, gy + 0.58, cz + 1.35, 0.2, 0.5, 1.18));
      mSkin.add(sph(0.17), M(cx + 1.92, gy + 0.88, cz + 1.05));
      mSaBronze.add(cyl(0.16, 0.10, 0.12, 10), M(cx + 3.15, gy + 0.28, cz + 1.85));

      // (C) FOREGROUND LEFT — HERACLITUS (MICHELANGELO) leaning on his carved marble block + PYTHAGORAS with Tetraktys slate!
      mTrav.add(new T.BoxGeometry(1.15, 0.92, 0.85), M(cx - 2.6, gy + 0.46, cz + 4.4));
      mSaMarble.add(new T.BoxGeometry(0.45, 0.04, 0.35), M(cx - 2.55, gy + 0.95, cz + 4.35, 0, 0.18, 0));
      addClassicalFigure(cx - 3.35, gy - 0.35, cz + 4.5, 0.9, mPlatoRed, mSlate, mHairB, 'seated');

      // Pythagoras & Carved Marble Harmonic-Scale Tablet (DIAPASON / TETRAKTYS)
      mTravD.add(new T.BoxGeometry(0.75, 0.95, 0.08), M(cx - 4.8, gy + 0.52, cz + 5.3, -0.18, 0.45, 0));
      mSaGold.add(new T.ConeGeometry(0.24, 0.38, 3), M(cx - 4.76, gy + 0.56, cz + 5.34, 0, 0.45, 0));
      addClassicalFigure(cx - 5.5, gy - 0.25, cz + 4.9, 1.1, mOchre, mSaMarble, mHairW, 'seated');

      // (D) FOREGROUND RIGHT — EUCLID bending over geometric slate + ZOROASTER (Celestial Sphere) & PTOLEMY (Terrestrial Globe)!
      mSlate.add(new T.BoxGeometry(1.25, 0.08, 0.95), M(cx + 3.8, gy + 0.06, cz + 4.8, 0, -0.22, 0));
      mSaGold.add(new T.BoxGeometry(0.04, 0.42, 0.04), M(cx + 3.75, gy + 0.28, cz + 4.82, 0, 0, 0.25));
      mSaGold.add(new T.BoxGeometry(0.04, 0.42, 0.04), M(cx + 3.92, gy + 0.28, cz + 4.82, 0, 0, -0.25));
      addClassicalFigure(cx + 4.9, gy, cz + 4.2, -0.8, mOchre, mPlatoRed, mHairW, 'zoroaster_sphere');
      addClassicalFigure(cx + 6.0, gy, cz + 4.9, -2.2, mOchre, mAristBlue, mHairB, 'ptolemy_globe');

      mTrav.mesh(travertineMat);
      mTravD.mesh(travertineDarkMat);
      mSaMarble.mesh(pentelicMat);
      mSaBronze.mesh(bronzeMat);
      mSaGold.mesh(goldMat);
      mPlatoRed.mesh(new T.MeshLambertMaterial({ color: 0xa83232 }));
      mAristBlue.mesh(new T.MeshLambertMaterial({ color: 0x2c5e8a }));
      mOchre.mesh(new T.MeshLambertMaterial({ color: 0xc99648 }));
      mSkin.mesh(new T.MeshLambertMaterial({ color: 0xe8c39e }));
      mSlate.mesh(new T.MeshLambertMaterial({ color: 0x2c3540 }));
      mHairW.mesh(new T.MeshLambertMaterial({ color: 0xdedad0 }));
      mHairB.mesh(new T.MeshLambertMaterial({ color: 0x4a3525 }));
    }

    /* ---------------- 3C. EASTERN CLASSICAL ARCHITECTURE: RIBBED GLAZED TILE ROOFS, CARVED LACQUER PLAQUES & PAGODA ---------------- */
    const vermilionMat = new T.MeshLambertMaterial({ color: 0x9b241d });
    const imperialTileTex = makeRibbedTileTex('#d49e2a', '#966b14', '#ecd078', 401);
    const cyanTileTex = makeRibbedTileTex('#1e6b66', '#10423f', '#3c968e', 402);
    const jiangnanTileTex = makeRibbedTileTex('#363f4a', '#1e242c', '#525e6d', 403);
    const imperialTileMat = new T.MeshPhongMaterial({ map: imperialTileTex, specular: 0xead79c, shininess: 42, side: T.DoubleSide });
    const cyanTileMat = new T.MeshPhongMaterial({ map: cyanTileTex, specular: 0x9ad8cf, shininess: 38, side: T.DoubleSide });
    const jiangnanTileMat = new T.MeshLambertMaterial({ map: jiangnanTileTex, side: T.DoubleSide });
    const imperialRidgeMat = new T.MeshPhongMaterial({ color: 0xc89226, specular: 0xe6d08e, shininess: 40 });
    const cyanRidgeMat = new T.MeshPhongMaterial({ color: 0x1a5e59, specular: 0x8cc9c0, shininess: 36 });
    const jiangnanRidgeMat = new T.MeshLambertMaterial({ color: 0x2a323b });
    const lanternRedMat = new T.MeshLambertMaterial({ color: 0xc22828, emissive: 0x4a0c0c });
    const jadeWhiteMat = new T.MeshLambertMaterial({ color: 0xf2eee4 });
    const lotusPinkMat = new T.MeshLambertMaterial({ color: 0xe879a8 });
    const lilyGreenMat = new T.MeshLambertMaterial({ color: 0x246b3a });

    const mVermilion = new Merger(), mOrGold = new Merger(), mJade = new Merger(), mLanternRed = new Merger(), mJiangnanSlate = new Merger();
    const mRidgeGold = new Merger(), mRidgeCyan = new Merger(), mRidgeSlate = new Merger(), mPlaqueFrame = new Merger();

    function makeOrientalPlaqueTex(text) {
      const c = document.createElement('canvas'); c.width = 512; c.height = 152;
      const x = c.getContext('2d');
      // Authentic Ming/Qing aged black-lacquer cedar woodgrain (黑漆描金古建匾额)
      paintWoodGrain(x, 512, 152, '#231711', '#140c08', text.length * 29 + 7);
      // Traditional recessed antique-gold fretwork inner border (回纹边饰)
      x.strokeStyle = '#b9934c'; x.lineWidth = 4; x.strokeRect(12, 12, 488, 128);
      x.strokeStyle = 'rgba(185,147,76,0.48)'; x.lineWidth = 1.5; x.strokeRect(20, 20, 472, 112);
      // Corner Cloud-Fret Motifs
      [[20, 20], [472, 20], [20, 112], [472, 112]].forEach(([cx0, cy0]) => {
        x.strokeStyle = '#b9934c'; x.lineWidth = 2; x.strokeRect(cx0, cy0, 20, 20);
      });
      // Antique Gold-Leaf Calligraphy with carved depth shadow
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.shadowColor = 'rgba(0,0,0,0.75)'; x.shadowBlur = 3; x.shadowOffsetY = 2;
      x.fillStyle = '#dec07c';
      x.font = '700 40px "Kaiti SC", "STKaiti", "Songti SC", serif';
      x.fillText(text, 256, 78);
      const tex = new T.CanvasTexture(c);
      if (T.sRGBEncoding !== undefined) tex.encoding = T.sRGBEncoding;
      made.textures++;
      return tex;
    }

    function makeCoupletTex(text) {
      const c = document.createElement('canvas'); c.width = 96; c.height = 512;
      const x = c.getContext('2d');
      // Aged rosewood-cinnabar woodgrain pillar couplet (暗红木雕楹联)
      paintWoodGrain(x, 96, 512, '#4f1814', '#330e0b', text.length * 19 + 3);
      x.strokeStyle = 'rgba(196,158,86,0.62)'; x.lineWidth = 3; x.strokeRect(7, 7, 82, 498);
      x.fillStyle = '#dec07c';
      x.shadowColor = 'rgba(0,0,0,0.65)'; x.shadowBlur = 2; x.shadowOffsetY = 2;
      x.font = '700 36px "Kaiti SC", "STKaiti", "Songti SC", serif';
      x.textAlign = 'center';
      const chars = Array.from(text);
      const step = 430 / Math.max(1, chars.length);
      chars.forEach((ch, idx) => {
        x.fillText(ch, 48, 66 + idx * step);
      });
      const tex = new T.CanvasTexture(c);
      if (T.sRGBEncoding !== undefined) tex.encoding = T.sRGBEncoding;
      made.textures++;
      return tex;
    }

    function addRedLantern(lx, ly, lz) {
      mOrGold.add(cyl(0.018, 0.018, 0.42, 6), M(lx, ly - 0.20, lz));
      mOrGold.add(cyl(0.14, 0.17, 0.06, 10), M(lx, ly - 0.40, lz));
      mLanternRed.add(sph(0.24), M(lx, ly - 0.64, lz, 0, 0, 0, 1.0, 1.22, 1.0));
      mOrGold.add(cyl(0.15, 0.12, 0.06, 10), M(lx, ly - 0.88, lz));
      mOrGold.add(cyl(0.022, 0.01, 0.28, 6), M(lx, ly - 1.04, lz));
    }

    // Build Curved Sweeping Chinese Roof Mesh with real ribbed tile UVs, curved ceramic hip ridges & authentic Chiwei finials!
    function addSweepingOrientalRoof(cx, cz, wHalf, dHalf, yBase, roofH, tileMat, isTopTier, isPagoda, ridgeMerger, skipLanterns) {
      const rm = ridgeMerger || mRidgeGold;
      const geo = new Geo();
      const segU = 8, segV = 10;
      const ridgeHalfX = isPagoda ? 0.35 : Math.max(0.8, wHalf - dHalf * 0.72);
      const pt = (u, v, side) => {
        const curveY = Math.pow(u, 1.52) * roofH;
        const cornerDist = Math.max(0, (Math.abs(v) - 0.58) / 0.42);
        const cornerFlipY = (1 - u * 0.85) * Math.pow(cornerDist, 2) * 0.82;
        const flareOut = (1 - u) * Math.pow(cornerDist, 2) * 0.52;
        const y = yBase + curveY + cornerFlipY;
        if (side === '+z' || side === '-z') {
          const sgn = side === '+z' ? 1 : -1;
          const xSpan = (1 - u) * (wHalf + flareOut) + u * ridgeHalfX;
          const zPos = sgn * ((1 - u) * (dHalf + flareOut));
          return [cx + v * xSpan, y, cz + zPos];
        } else {
          const sgn = side === '+x' ? 1 : -1;
          const zSpan = (1 - u) * (dHalf + flareOut);
          const xPos = sgn * ((1 - u) * (wHalf + flareOut) + u * ridgeHalfX);
          return [cx + xPos, y, cz + v * zSpan];
        }
      };
      const white = [1, 1, 1];
      ['+z', '-z', '+x', '-x'].forEach((side) => {
        const uRepeat = (side === '+z' || side === '-z') ? Math.max(2, wHalf * 0.55) : Math.max(2, dHalf * 0.55);
        const vRepeat = Math.max(1.2, roofH * 0.65);
        for (let iu = 0; iu < segU; iu++) {
          const u0 = iu / segU, u1 = (iu + 1) / segU;
          for (let iv = 0; iv < segV; iv++) {
            const v0 = -1 + (iv / segV) * 2, v1 = -1 + ((iv + 1) / segV) * 2;
            const A = pt(u0, v0, side), Bq = pt(u0, v1, side), Cq = pt(u1, v1, side), Dq = pt(u1, v0, side);
            const tv0 = (iv / segV) * uRepeat, tv1 = ((iv + 1) / segV) * uRepeat;
            geo.quad(A, Bq, Cq, Dq, [tv0, u0 * vRepeat], [tv1, u0 * vRepeat], [tv1, u1 * vRepeat], [tv0, u1 * vRepeat], white);
          }
        }
      });
      const m = geo.mesh(tileMat);
      if (m) m.castShadow = true;

      // 4 Authentic Curved Ceramic Hip Ridges (垂脊/戗脊) following the roof sweep + delicate eave lanterns
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          for (let s = 0; s < 5; s++) {
            const u = s / 5;
            const pA = pt(u, sx, sz > 0 ? '+z' : '-z');
            const pB = pt((s + 1) / 5, sx, sz > 0 ? '+z' : '-z');
            const mx = (pA[0] + pB[0]) * 0.5, my = (pA[1] + pB[1]) * 0.5 + 0.08, mz = (pA[2] + pB[2]) * 0.5;
            const segLen = Math.hypot(pB[0] - pA[0], pB[1] - pA[1], pB[2] - pA[2]);
            rm.add(new T.BoxGeometry(0.18, 0.16, segLen * 1.05), M(mx, my, mz, 0, Math.atan2(pB[0] - pA[0], pB[2] - pA[2]), 0));
          }
          // Subtle Upturned Ceramic Corner Eave Tip (翘角吻兽，与瓦色统一)
          const cTip = pt(0, sx, sz > 0 ? '+z' : '-z');
          rm.add(new T.BoxGeometry(0.16, 0.24, 0.28), M(cTip[0], cTip[1] + 0.14, cTip[2], 0, Math.atan2(sx, sz), 0));
          if (!skipLanterns) addRedLantern(cTip[0] - sx * 0.24, yBase + 0.35, cTip[2] - sz * 0.24);
        }
      }

      // Authentic Main Ridge (正脊) & Sculpted Matching-Ceramic Chiwei Finials (鸱尾) or Lathe Bronze Baoding Spire!
      if (isTopTier) {
        const yTop = yBase + roofH;
        if (isPagoda) {
          // Smooth LatheGeometry Classical Bronze Baoding Pagoda Finial (宝顶刹柱)
          const pts = [
            new T.Vector2(0.0, 0.0), new T.Vector2(0.58, 0.0), new T.Vector2(0.46, 0.26),
            new T.Vector2(0.24, 0.42), new T.Vector2(0.36, 0.68), new T.Vector2(0.28, 0.96),
            new T.Vector2(0.14, 1.18), new T.Vector2(0.22, 1.42), new T.Vector2(0.08, 1.85), new T.Vector2(0.0, 2.35)
          ];
          const spireMesh = new T.Mesh(new T.LatheGeometry(pts, 18), bronzeMat);
          spireMesh.position.set(cx, yTop - 0.05, cz);
          group.add(spireMesh);
          made.meshes++;
        } else {
          // Layered Ceramic Main Ridge (正脊) matching the roof tile color
          rm.add(new T.BoxGeometry(ridgeHalfX * 2 + 0.55, 0.28, 0.30), M(cx, yTop + 0.12, cz));
          rm.add(new T.BoxGeometry(ridgeHalfX * 2 + 0.68, 0.10, 0.38), M(cx, yTop + 0.29, cz));
          // Left & Right Sculpted Stepped Ceramic Chiwei Owl-Tail Finials (陶釉鸱尾)
          for (const sx of [-1, 1]) {
            const rx = cx + sx * (ridgeHalfX + 0.26);
            rm.add(new T.BoxGeometry(0.34, 0.52, 0.24), M(rx, yTop + 0.42, cz));
            rm.add(new T.BoxGeometry(0.24, 0.36, 0.20), M(rx - sx * 0.08, yTop + 0.74, cz, 0, 0, sx * 0.25));
          }
        }
      }
    }

    // Helper: Mount a Real 3D Framed Carved-Lacquer Oriental Plaque (立体红木框牌匾)
    function mountOrientalPlaque(px, py, pz, pw, ph, text) {
      const pd = 0.12;
      // Dark carved timber backing & 4 stepped outer moldings
      mPlaqueFrame.add(new T.BoxGeometry(pw + 0.22, ph + 0.20, pd), M(px, py, pz - pd * 0.5));
      mOrGold.add(new T.BoxGeometry(pw + 0.26, 0.07, pd + 0.04), M(px, py + ph / 2 + 0.10, pz - pd * 0.4));
      mOrGold.add(new T.BoxGeometry(pw + 0.26, 0.07, pd + 0.04), M(px, py - ph / 2 - 0.10, pz - pd * 0.4));
      const pTex = makeOrientalPlaqueTex(text);
      const pMesh = new T.Mesh(
        new T.PlaneGeometry(pw, ph),
        new T.MeshLambertMaterial({ map: pTex, emissiveMap: pTex, emissive: 0xffffff, emissiveIntensity: 0.38 })
      );
      pMesh.position.set(px, py, pz + 0.015);
      group.add(pMesh);
      made.meshes++;
    }

    (P.orientalBuildings || []).forEach((OB) => {
      const { x0, z0, x1, z1, gy, wallH, tiers, tileStyle, isPagoda, hasMoonGate, plaque, coupletL, coupletR } = OB;
      const cx = (x0 + x1 + 1) / 2, cz = (z0 + z1 + 1) / 2;
      const wHalf0 = (x1 - x0 + 1) / 2 + 1.45;
      const dHalf0 = (z1 - z0 + 1) / 2 + 1.45;
      const tileMat = tileStyle === 'gold' ? imperialTileMat : tileStyle === 'cyan' ? cyanTileMat : jiangnanTileMat;
      const ridgeM = tileStyle === 'gold' ? mRidgeGold : tileStyle === 'cyan' ? mRidgeCyan : mRidgeSlate;

      // 1. Round Vermilion Lacquered Perimeter Columns & Carved Dougong Bracket Sets
      for (let x = x0 + 0.5; x <= x1 + 0.5; x += 3.0) {
        for (const pz of [z0 - 0.3, z1 + 1.3]) {
          if (pz > cz && Math.abs(x - cx) < 1.8) continue;
          mJade.add(cyl(0.40, 0.46, 0.30, 14), M(x, gy + 0.15, pz));
          mVermilion.add(cyl(0.30, 0.33, wallH - 0.35, 16), M(x, gy + 0.30 + (wallH - 0.35) / 2, pz));
          mOrGold.add(new T.BoxGeometry(0.88, 0.24, 0.88), M(x, gy + wallH - 0.34, pz));
          mVermilion.add(new T.BoxGeometry(1.18, 0.22, 1.18), M(x, gy + wallH - 0.12, pz));
        }
      }

      // 2. Multi-Tiered Sweeping Upturned-Eave Ribbed-Tile Roofs
      for (let t = 0; t < (tiers || 2); t++) {
        const shrink = isPagoda ? t * 1.65 : t * 1.55;
        const tierY = gy + wallH - 0.15 + (isPagoda ? t * 3.15 : t * 2.15);
        const tierH = isPagoda ? 2.15 : (t === 0 ? 1.55 : 2.45);
        if (t > 0) {
          const bw = (wHalf0 - shrink - 0.85) * 2, bd = (dHalf0 - shrink - 0.85) * 2;
          const bh = isPagoda ? 1.9 : 1.15;
          mVermilion.add(new T.BoxGeometry(bw, bh, bd), M(cx, tierY - bh / 2 + 0.25, cz));
          mOrGold.add(new T.BoxGeometry(bw + 0.20, 0.18, bd + 0.20), M(cx, tierY + 0.10, cz));
        }
        addSweepingOrientalRoof(cx, cz, wHalf0 - shrink, dHalf0 - shrink, tierY, tierH, tileMat, t === (tiers || 2) - 1, isPagoda, ridgeM);
      }

      // 3. Real 3D Framed Carved-Lacquer Calligraphy Plaque & Lit Wooden Pillar Couplets
      if (plaque) {
        mountOrientalPlaque(cx, gy + wallH + 0.48, z1 + 1.72, 3.6, 1.05, plaque);
      }
      if (coupletL && coupletR) {
        for (const [side, txt] of [[-1, coupletL], [1, coupletR]]) {
          const cpx = cx + side * 2.35;
          mPlaqueFrame.add(new T.BoxGeometry(0.62, 3.35, 0.08), M(cpx, gy + 2.35, z1 + 1.58));
          const cTex = makeCoupletTex(txt);
          const cMesh = new T.Mesh(new T.PlaneGeometry(0.56, 3.25), new T.MeshLambertMaterial({ map: cTex, emissiveMap: cTex, emissive: 0xffffff, emissiveIntensity: 0.35 }));
          cMesh.position.set(cpx, gy + 2.35, z1 + 1.63);
          group.add(cMesh);
          made.meshes++;
        }
      }

      // 4. Jiangnan Whitewashed Courtyard Wall with Circular Moon Gate & Curved Red Bridge Arch
      if (hasMoonGate) {
        const mz = z1 + 7.2;
        mJade.add(new T.TorusGeometry(2.15, 0.48, 12, 28), M(cx, gy + 2.15, mz));
        mOrGold.add(new T.TorusGeometry(1.72, 0.06, 8, 28), M(cx, gy + 2.15, mz));
        for (const sx of [-1, 1]) {
          mJade.add(new T.BoxGeometry(4.2, 3.4, 0.55), M(cx + sx * 4.2, gy + 1.7, mz));
          mJiangnanSlate.add(new T.BoxGeometry(4.6, 0.35, 0.85), M(cx + sx * 4.2, gy + 3.55, mz));
          addRedLantern(cx + sx * 2.5, gy + 3.35, mz + 0.35);
        }
        for (const sx of [-1.35, 1.35]) {
          mVermilion.add(new T.BoxGeometry(0.18, 0.85, 4.8), M(cx + sx, gy + 0.45, z1 + 4.2));
          mJade.add(sph(0.14), M(cx + sx, gy + 0.98, z1 + 1.8));
          mJade.add(sph(0.14), M(cx + sx, gy + 0.98, z1 + 6.6));
        }
      }
    });

    // Build 4-Pillar 3-Bay Classical Chinese Memorial Archway (棂星门牌坊)
    (P.orientalPaifang || []).forEach((PF) => {
      const { x, y, z, w, title } = PF;
      const postsX = [x - w * 0.44, x - w * 0.17, x + w * 0.17, x + w * 0.44];
      postsX.forEach((px, idx) => {
        const isCenter = idx === 1 || idx === 2;
        const ph = isCenter ? 6.6 : 5.4;
        mJade.add(cyl(0.45, 0.55, 0.75, 14), M(px, y + 0.38, z));
        mJade.add(cyl(0.42, 0.42, 0.24, 12), M(px, y + 0.65, z + 0.45, Math.PI / 2, 0, 0));
        mVermilion.add(cyl(0.28, 0.32, ph, 16), M(px, y + ph / 2, z));
        mOrGold.add(cyl(0.35, 0.35, 0.40, 14), M(px, y + ph + 0.15, z));
      });
      mVermilion.add(new T.BoxGeometry(w * 0.92, 0.42, 0.45), M(x, y + 4.6, z));
      mOrGold.add(new T.BoxGeometry(w * 0.94, 0.16, 0.50), M(x, y + 4.9, z));
      mVermilion.add(new T.BoxGeometry(w * 0.42, 0.45, 0.48), M(x, y + 5.8, z));
      addSweepingOrientalRoof(x, z, w * 0.24, 1.35, y + 6.15, 1.15, imperialTileMat, true, false, mRidgeGold, true);
      addSweepingOrientalRoof(x - w * 0.31, z, w * 0.18, 1.15, y + 5.05, 0.95, imperialTileMat, true, false, mRidgeGold);
      addSweepingOrientalRoof(x + w * 0.31, z, w * 0.18, 1.15, y + 5.05, 0.95, imperialTileMat, true, false, mRidgeGold);
      mountOrientalPlaque(x, y + 5.32, z + 0.28, 3.1, 0.92, title);
    });

    // 3D Lotus Blossoms & Green Lily Pads in Zhuangzi's Pond
    const mLotus = new Merger(), mLily = new Merger();
    (P.lotusFlowers || []).forEach((lf) => {
      mLily.add(cyl(0.45, 0.45, 0.04, 14), M(lf.x, lf.y, lf.z));
      if (lf.bloom) {
        mLotus.add(new T.ConeGeometry(0.24, 0.32, 8), M(lf.x, lf.y + 0.16, lf.z, Math.PI, 0, 0));
        mOrGold.add(sph(0.08), M(lf.x, lf.y + 0.22, lf.z));
      }
    });
    mLotus.mesh(lotusPinkMat);
    mLily.mesh(lilyGreenMat);
    mVermilion.mesh(vermilionMat);
    mOrGold.mesh(goldMat);
    mJade.mesh(jadeWhiteMat);
    mLanternRed.mesh(lanternRedMat);
    mJiangnanSlate.mesh(jiangnanTileMat);
    mRidgeGold.mesh(imperialRidgeMat);
    mRidgeCyan.mesh(cyanRidgeMat);
    mRidgeSlate.mesh(jiangnanRidgeMat);
    mPlaqueFrame.mesh(new T.MeshLambertMaterial({ color: 0x261710 }));

    /* ---------------- 3D. ERA-SPECIFIC REGIONAL ARCHITECTURAL LANDMARKS (17TH–20TH CENTURY EUROPE) ---------------- */
    const copperPatinaMat = new T.MeshPhongMaterial({ color: 0x4b8779, specular: 0x9ecbc0, shininess: 32, emissive: 0x05120f });
    const darkTimberMat = new T.MeshLambertMaterial({ color: 0x2d2016 });
    const lighthouseRedMat = new T.MeshLambertMaterial({ color: 0xb5332a });
    const bauhausBlueMat = new T.MeshLambertMaterial({ color: 0x1d4ed8 });

    const mCopper = new Merger(), mDarkTimber = new Merger(), mEraGold = new Merger(), mEraWhite = new Merger(), mEraRed = new Merger(), mEraGlass = new Merger();
    const rotatingSunWheels = [], rotatingBeaconBeams = [];

    // Smooth LatheGeometry Helper for Authentic Architectural Domes (Baroque Onion / Classical Hemispherical)
    function makeOnionDomeGeo(rMax, hTotal) {
      const pts = [];
      for (let i = 0; i <= 18; i++) {
        const t = i / 18;
        let r;
        if (t < 0.25) r = rMax * (0.72 + 0.28 * Math.sin((t / 0.25) * Math.PI * 0.5));
        else if (t < 0.65) r = rMax * Math.cos(((t - 0.25) / 0.40) * Math.PI * 0.42);
        else r = rMax * 0.24 * Math.pow(1 - (t - 0.65) / 0.35, 1.45);
        pts.push(new T.Vector2(Math.max(0.01, r), t * hTotal));
      }
      pts.push(new T.Vector2(0, hTotal));
      return new T.LatheGeometry(pts, 28);
    }

    function makeRibbedDomeGeo(radius, height) {
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * (Math.PI * 0.5);
        pts.push(new T.Vector2(Math.cos(a) * radius, Math.sin(a) * height));
      }
      return new T.LatheGeometry(pts, 32);
    }

    // Authentic Gothic Stained-Glass Rose Window Texture (Deep Cobalt, Ruby & Amber Cathedral Tracery)
    function makeRoseWindowTex() {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const x = c.getContext('2d');
      x.fillStyle = '#0f172a'; x.beginPath(); x.arc(128, 128, 126, 0, Math.PI * 2); x.fill();
      const petals = ['#1d4ed8', '#991b1b', '#b45309', '#1e3a8a', '#7c2d12', '#312e81'];
      for (let i = 0; i < 12; i++) {
        const a0 = (i / 12) * Math.PI * 2, a1 = ((i + 1) / 12) * Math.PI * 2;
        x.fillStyle = petals[i % petals.length];
        x.beginPath(); x.moveTo(128, 128); x.arc(128, 128, 114, a0, a1); x.closePath(); x.fill();
        x.strokeStyle = '#1f2937'; x.lineWidth = 4; x.stroke();
        // Outer lancet trefoil
        const am = (a0 + a1) * 0.5;
        x.fillStyle = i % 2 === 0 ? '#d97706' : '#38bdf8';
        x.beginPath(); x.arc(128 + Math.cos(am) * 84, 128 + Math.sin(am) * 84, 13, 0, Math.PI * 2); x.fill();
        x.strokeStyle = '#111827'; x.lineWidth = 2.5; x.stroke();
      }
      x.fillStyle = '#991b1b'; x.beginPath(); x.arc(128, 128, 34, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#c9a353'; x.lineWidth = 4; x.stroke();
      x.fillStyle = '#e2b857'; x.beginPath(); x.arc(128, 128, 14, 0, Math.PI * 2); x.fill();
      const t = new T.CanvasTexture(c);
      if (T.sRGBEncoding !== undefined) t.encoding = T.sRGBEncoding;
      made.textures++;
      return t;
    }
    const roseGlassMat = new T.MeshLambertMaterial({ map: makeRoseWindowTex(), emissive: 0x221018, side: T.DoubleSide });

    function makeClockFaceTex() {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256;
      const x = c.getContext('2d');
      x.fillStyle = '#141d2e'; x.beginPath(); x.arc(128, 128, 120, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#b9934c'; x.lineWidth = 9; x.beginPath(); x.arc(128, 128, 114, 0, Math.PI * 2); x.stroke();
      x.strokeStyle = 'rgba(218,192,132,0.55)'; x.lineWidth = 2.5; x.beginPath(); x.arc(128, 128, 84, 0, Math.PI * 2); x.stroke();
      x.fillStyle = '#dec07c'; x.font = 'bold 19px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      const labels = ['1100', '0001', '0010', '0011', '0100', '0101', '0110', '0111', '1000', '1001', '1010', '1011'];
      labels.forEach((lb, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        x.fillText(lb, 128 + Math.cos(a) * 98, 128 + Math.sin(a) * 98);
      });
      x.strokeStyle = '#dec07c'; x.lineWidth = 6;
      x.beginPath(); x.moveTo(128, 128); x.lineTo(128, 54); x.stroke();
      x.beginPath(); x.moveTo(128, 128); x.lineTo(182, 128); x.stroke();
      const t = new T.CanvasTexture(c);
      if (T.sRGBEncoding !== undefined) t.encoding = T.sRGBEncoding;
      made.textures++;
      return t;
    }

    function makeCafeSignTex() {
      const c = document.createElement('canvas'); c.width = 512; c.height = 104;
      const x = c.getContext('2d');
      // Authentic Parisian Left-Bank Forest-Green Enamel Fascia (no emoji!)
      const g = x.createLinearGradient(0, 0, 0, 104);
      g.addColorStop(0, '#163b29'); g.addColorStop(1, '#0e281b');
      x.fillStyle = g; x.fillRect(0, 0, 512, 104);
      x.strokeStyle = '#c5a15a'; x.lineWidth = 3.5; x.strokeRect(8, 8, 496, 88);
      x.fillStyle = '#e8d29c';
      x.font = '700 34px Georgia, "Times New Roman", serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText('CAFÉ DE FLORE', 256, 44);
      x.fillStyle = '#a8c2b2';
      x.font = '500 15px Georgia, "Songti SC", serif';
      x.fillText('SAINT-GERMAIN-DES-PRÉS · PARIS', 256, 76);
      const t = new T.CanvasTexture(c);
      if (T.sRGBEncoding !== undefined) t.encoding = T.sRGBEncoding;
      made.textures++;
      return t;
    }

    const clockMat = new T.MeshLambertMaterial({ map: makeClockFaceTex(), transparent: true });

    (P.eraLandmarks || []).forEach((EL) => {
      if (EL.kind === 'french_baroque') {
        // #8 Descartes: 17th-Century French Baroque Limestone Pediment Frontispiece & Wrought-Iron Juliette Balcony
        const { x, y, z } = EL;
        mEraWhite.add(new T.BoxGeometry(4.4, 1.8, 0.36), M(x, y + 7.1, z + 0.18));
        mEraWhite.add(new T.BoxGeometry(4.8, 0.22, 0.48), M(x, y + 8.1, z + 0.22));
        // Carved Baroque Stone Oeil-de-Boeuf Medallion
        mEraWhite.add(torus(0.62, 0.12), M(x, y + 7.15, z + 0.38));
        mEraGold.add(torus(0.46, 0.045), M(x, y + 7.15, z + 0.42));
        // Wrought-Iron Juliette Balcony with slender vertical balusters
        mDarkTimber.add(new T.BoxGeometry(4.8, 0.08, 0.65), M(x, y + 3.92, z + 0.42));
        mDarkTimber.add(new T.BoxGeometry(4.8, 0.07, 0.07), M(x, y + 4.72, z + 0.72));
        for (let bx = -2.2; bx <= 2.2; bx += 0.44) {
          mDarkTimber.add(cyl(0.025, 0.025, 0.80, 6), M(x + bx, y + 4.32, z + 0.72));
        }
      }

      else if (EL.kind === 'dutch_gable') {
        // #9 Spinoza: 17th-Century Dutch Canal House Timber Hoist Beam (Hijsbalk) & Wrought-Iron Wall Anchors
        const { x, y, z } = EL;
        mDarkTimber.add(new T.BoxGeometry(0.28, 0.28, 2.2), M(x, y + 10.5, z + 0.75));
        mDarkTimber.add(torus(0.18, 0.04), M(x, y + 10.12, z + 1.65));
        mEraWhite.add(new T.BoxGeometry(1.4, 0.24, 0.48), M(x, y + 11.1, z - 0.45));
        for (const sx of [-3.5, 3.5]) {
          mDarkTimber.add(new T.BoxGeometry(0.10, 0.95, 0.10), M(x + sx, y + 5.2, z + 0.10, 0, 0, 0.45));
          mDarkTimber.add(new T.BoxGeometry(0.10, 0.95, 0.10), M(x + sx, y + 5.2, z + 0.10, 0, 0, -0.45));
        }
      }

      else if (EL.kind === 'baroque_onion_clock') {
        // #10 Leibniz: Authentic Smooth LatheGeometry German Baroque Copper Onion Dome & Belfry Spire
        const { x, y, z } = EL;
        mEraWhite.add(cyl(2.45, 2.55, 0.55, 16), M(x, y + 0.28, z));
        const mainOnion = new T.Mesh(makeOnionDomeGeo(2.55, 4.4), copperPatinaMat);
        mainOnion.position.set(x, y + 0.52, z);
        mainOnion.castShadow = true;
        group.add(mainOnion); made.meshes++;
        // Open Arched Lantern Belfry + Upper Mini Onion Cupola + Slender Iron Finial
        mEraWhite.add(cyl(0.82, 0.88, 1.35, 12), M(x, y + 5.2, z));
        const topOnion = new T.Mesh(makeOnionDomeGeo(0.95, 1.75), copperPatinaMat);
        topOnion.position.set(x, y + 5.85, z);
        group.add(topOnion); made.meshes++;
        mDarkTimber.add(cyl(0.035, 0.06, 1.6, 8), M(x, y + 8.15, z));
        // 4 Lit Binary Clock Faces on the Tower
        [[0, 0, 2.62, 0], [0, 0, -2.62, Math.PI], [2.62, 0, 0, Math.PI / 2], [-2.62, 0, 0, -Math.PI / 2]].forEach(([dx, dy, dz, ry]) => {
          const cf = new T.Mesh(new T.PlaneGeometry(2.4, 2.4), clockMat);
          cf.position.set(x + dx, y - 2.2 + dy, z + dz);
          cf.rotation.y = ry;
          group.add(cf);
          made.meshes++;
        });
      }

      else if (EL.kind === 'tudor_timbers') {
        // #11 Locke: English Tudor Black-Oak Half-Timbered Studs & Diagonal Herringbone Bracing
        const { x0, z0, x1, z1, gy } = EL;
        for (let x = x0 + 1; x <= x1 - 1; x += 3) {
          for (const fz of [z0 - 0.08, z1 + 1.08]) {
            mDarkTimber.add(new T.BoxGeometry(0.22, 3.8, 0.14), M(x + 0.5, gy + 4.1, fz));
            mDarkTimber.add(new T.BoxGeometry(0.18, 2.4, 0.14), M(x + 1.5, gy + 4.1, fz, 0, 0, 0.62));
            mDarkTimber.add(new T.BoxGeometry(0.18, 2.4, 0.14), M(x + 1.5, gy + 4.1, fz, 0, 0, -0.62));
          }
        }
        mDarkTimber.add(new T.BoxGeometry(x1 - x0 + 1.35, 0.24, z1 - z0 + 1.35), M((x0 + x1 + 1) / 2, gy + 2.2, (z0 + z1 + 1) / 2));
        mDarkTimber.add(new T.BoxGeometry(x1 - x0 + 1.35, 0.24, z1 - z0 + 1.35), M((x0 + x1 + 1) / 2, gy + 5.85, (z0 + z1 + 1) / 2));
      }

      else if (EL.kind === 'georgian_dome') {
        // #12 Hume: 18th-C Edinburgh Georgian Smooth Ribbed Copper Rotunda Dome & Stone Cupola
        const { x, y, z } = EL;
        mEraWhite.add(cyl(3.6, 3.75, 1.35, 28), M(x, y + 0.68, z));
        mEraWhite.add(cyl(3.85, 3.85, 0.22, 28), M(x, y + 1.38, z));
        const dome = new T.Mesh(makeRibbedDomeGeo(3.55, 2.95), copperPatinaMat);
        dome.position.set(x, y + 1.42, z);
        dome.castShadow = true;
        group.add(dome); made.meshes++;
        // Georgian Stone Lantern Cupola & Slender Weathervane Finial
        mEraWhite.add(cyl(0.76, 0.84, 1.15, 16), M(x, y + 4.75, z));
        const cap = new T.Mesh(makeRibbedDomeGeo(0.86, 0.72), copperPatinaMat);
        cap.position.set(x, y + 5.30, z);
        group.add(cap); made.meshes++;
        mDarkTimber.add(cyl(0.03, 0.05, 0.95, 8), M(x, y + 6.45, z));
      }

      else if (EL.kind === 'leviathan_lighthouse') {
        // #13 Hobbes & Rousseau: 17m Maritime Lighthouse with Smooth Copper Lantern Dome & Beacon
        const { x, y, z } = EL;
        mEraWhite.add(cyl(2.2, 2.6, 1.6, 24), M(x, y + 0.8, z));
        for (let band = 0; band < 6; band++) {
          const r0 = 2.05 - band * 0.11, r1 = 2.16 - band * 0.11;
          const by = y + 1.6 + band * 2.1;
          (band % 2 === 0 ? mEraRed : mEraWhite).add(cyl(r0, r1, 2.1, 24), M(x, by + 1.05, z));
        }
        const topY = y + 14.2;
        mDarkTimber.add(cyl(2.15, 1.95, 0.32, 24), M(x, topY + 0.16, z));
        mEraGlass.add(cyl(1.32, 1.32, 2.0, 20), M(x, topY + 1.32, z));
        const lDome = new T.Mesh(makeRibbedDomeGeo(1.52, 1.25), copperPatinaMat);
        lDome.position.set(x, topY + 2.30, z);
        group.add(lDome); made.meshes++;
        mDarkTimber.add(cyl(0.04, 0.06, 0.85, 8), M(x, topY + 3.92, z));
        const beamGroup = new T.Group();
        beamGroup.position.set(x, topY + 1.35, z);
        const coneGeo = new T.ConeGeometry(1.8, 12.0, 12, 1, true);
        coneGeo.rotateX(Math.PI / 2);
        coneGeo.translate(0, 0, 6.2);
        const beamMat = new T.MeshBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.22, side: T.DoubleSide, depthWrite: false });
        beamGroup.add(new T.Mesh(coneGeo, beamMat));
        group.add(beamGroup);
        rotatingBeaconBeams.push(beamGroup);
        made.meshes++;
      }

      else if (EL.kind === 'kant_observatory') {
        // #14 Kant: Smooth Ribbed Copper Astronomical Observatory Dome with Dark Shutter Slit & Brass Telescope
        const { x, y, z } = EL;
        mEraWhite.add(cyl(3.2, 3.35, 1.1, 28), M(x, y + 0.55, z));
        mEraWhite.add(cyl(3.45, 3.45, 0.18, 28), M(x, y + 1.12, z));
        const obsDome = new T.Mesh(makeRibbedDomeGeo(3.15, 2.85), copperPatinaMat);
        obsDome.position.set(x, y + 1.16, z);
        obsDome.castShadow = true;
        group.add(obsDome); made.meshes++;
        // Dark-Iron Observatory Shutter Arch Slit
        mDarkTimber.add(new T.BoxGeometry(0.68, 2.65, 2.85), M(x, y + 2.55, z + 0.65));
        // Slender Realistic Brass Refracting Telescope Tube
        mEraGold.add(cyl(0.18, 0.28, 3.8, 14), M(x, y + 2.65, z + 1.75, 0.68, 0, 0));
        mEraGlass.add(cyl(0.19, 0.19, 0.08, 14), M(x, y + 3.95, z + 3.15, 0.68, 0, 0));
      }

      else if (EL.kind === 'hegel_gothic_cathedral') {
        // #15 Hegel: Berlin Twin-Spire Gothic Cathedral with Octagonal Copper Spires, Stone Pinnacles & Stained-Glass Rose Window
        const { x, y, z1, x0, x1, z0, spireBaseY } = EL;
        for (const tx of [x0 + 2.5, x1 - 1.5]) {
          const tz = z0 + 2.5, ty = spireBaseY || (y + 16.5);
          mCopper.add(new T.ConeGeometry(2.35, 8.6, 8), M(tx, ty + 4.3, tz));
          // 4 Corner Stone Gothic Pinnacle Spirelets
          for (const sx of [-1.75, 1.75]) for (const sz of [-1.75, 1.75]) {
            mEraWhite.add(new T.ConeGeometry(0.32, 2.2, 4), M(tx + sx, ty + 1.1, tz + sz));
          }
          // Crisp Slender Wrought-Iron Spire Finial Cross
          mDarkTimber.add(cyl(0.04, 0.06, 1.5, 8), M(tx, ty + 9.25, tz));
          mDarkTimber.add(new T.BoxGeometry(0.75, 0.08, 0.08), M(tx, ty + 9.55, tz));
        }
        // Detailed Stained-Glass Rose Window with Carved Stone Wheel Tracery
        const rz = z1 + 1.15, ry = y + 6.8;
        mEraWhite.add(torus(1.98, 0.16), M(x, ry, rz));
        mEraWhite.add(torus(1.12, 0.08), M(x, ry, rz));
        const roseDisk = new T.Mesh(new T.CircleGeometry(1.90, 28), roseGlassMat);
        roseDisk.position.set(x, ry, rz - 0.03);
        group.add(roseDisk);
        made.meshes++;
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          mEraWhite.add(new T.BoxGeometry(0.06, 3.7, 0.10), M(x, ry, rz + 0.02, 0, 0, a));
        }
      }

      else if (EL.kind === 'marx_industrial_dome') {
        // #16 Marx: British Museum Smooth Cast-Iron & Glass Reading Room Dome with Structural Ribs
        const { x, y, z } = EL;
        mDarkTimber.add(cyl(3.8, 4.0, 0.85, 24), M(x, y + 0.42, z));
        const gDome = new T.Mesh(makeRibbedDomeGeo(3.72, 3.1), crystalMat);
        gDome.position.set(x, y + 0.85, z);
        group.add(gDome); made.meshes++;
        for (let i = 0; i < 8; i++) {
          mDarkTimber.add(torus(3.74, 0.055), M(x, y + 0.85, z, 0, (i / 8) * Math.PI, 0));
        }
        mDarkTimber.add(cyl(0.65, 0.78, 0.85, 16), M(x, y + 4.15, z));
        const capM = new T.Mesh(makeRibbedDomeGeo(0.72, 0.45), copperPatinaMat);
        capM.position.set(x, y + 4.55, z);
        group.add(capM); made.meshes++;
      }

      else if (EL.kind === 'nordic_stave') {
        // #17 Schopenhauer & Kierkegaard: Authentic Dark-Timber Nordic Stave-Church Ridge Turret & Carved Wood Gable Finials
        const { x, y, z, z0, z1 } = EL;
        mDarkTimber.add(cyl(0.95, 1.15, 2.2, 8), M(x, y + 0.75, z));
        mDarkTimber.add(new T.ConeGeometry(1.22, 4.2, 8), M(x, y + 3.95, z));
        mDarkTimber.add(cyl(0.04, 0.06, 1.1, 6), M(x, y + 6.5, z));
        // Carved Weathered Dark-Timber Crossed Gable Bargeboards (authentic Norwegian stave church silhouette, no yellow cones!)
        for (const fz of [z0, z1 + 1]) {
          mDarkTimber.add(new T.BoxGeometry(0.16, 1.65, 0.14), M(x - 0.36, y + 0.55, fz, 0, 0, 0.52));
          mDarkTimber.add(new T.BoxGeometry(0.16, 1.65, 0.14), M(x + 0.36, y + 0.55, fz, 0, 0, -0.52));
        }
      }

      else if (EL.kind === 'nietzsche_sun_wheel') {
        // #18 Nietzsche: Refined Patinated-Bronze Alpine Armillary Astrolabe Monument on Carved Stone Plinth
        const { x, y, z } = EL;
        mEraWhite.add(cyl(1.15, 1.45, 1.25, 16), M(x, y + 0.62, z));
        const sunWheel = new T.Group();
        sunWheel.position.set(x, y + 2.75, z);
        sunWheel.add(new T.Mesh(torus(1.42, 0.075), bronzeMat));
        const ring2 = new T.Mesh(torus(1.25, 0.055), goldMat);
        ring2.rotation.y = Math.PI / 3;
        const ring3 = new T.Mesh(torus(1.08, 0.055), bronzeMat);
        ring3.rotation.x = Math.PI / 3;
        const core = new T.Mesh(sph(0.24), goldMat);
        const axis = new T.Mesh(cyl(0.035, 0.035, 3.2, 8), bronzeMat);
        axis.rotation.z = 0.42;
        sunWheel.add(ring2, ring3, core, axis);
        group.add(sunWheel);
        rotatingSunWheels.push(sunWheel);
        made.meshes += 5;
      }

      else if (EL.kind === 'bauhaus_modernist') {
        // #19 Wittgenstein: 20th-Century Vienna Haus Wittgenstein Bauhaus Steel-Mullion Frames & Primary-Color Geometric Constructivist Sculpture
        const { x, y, x0, z0, x1, z1 } = EL;
        // Crisp Black Steel Bauhaus Roof Fascia & Window Mullions
        mDarkTimber.add(new T.BoxGeometry(x1 - x0 + 1.35, 0.26, z1 - z0 + 1.35), M(x, y + 6.65, (z0 + z1 + 1) / 2));
        mDarkTimber.add(new T.BoxGeometry(9.4, 0.26, 8.4), M(x0 + 4.5, y + 10.65, z0 + 4.0));
        // Bauhaus / De Stijl Red-Yellow-Blue Constructivist Sculpture in the Front Courtyard
        const sx = x + 5.8, sz = z1 + 3.2;
        mEraWhite.add(new T.BoxGeometry(1.8, 0.3, 1.8), M(sx, y + 0.15, sz));
        mEraRed.add(new T.BoxGeometry(0.85, 2.4, 0.28), M(sx - 0.3, y + 1.35, sz));
        mEraGold.add(new T.BoxGeometry(1.45, 0.85, 0.28), M(sx + 0.25, y + 2.1, sz + 0.25));
        const blueCube = new T.Mesh(new T.BoxGeometry(0.75, 0.75, 0.75), bauhausBlueMat);
        blueCube.position.set(sx + 0.35, y + 0.85, sz - 0.25);
        group.add(blueCube);
        made.meshes++;
      }

      else if (EL.kind === 'paris_cafe_awning') {
        // #20 Heidegger & Sartre: Parisian Left-Bank Red-and-White Striped Café de Flore Awning & 3D Framed Bistro Fascia
        const { x, y, z, w } = EL;
        const stripes = 12, sw = (w - 2) / stripes;
        for (let i = 0; i < stripes; i++) {
          const sx = (x - (w - 2) / 2) + (i + 0.5) * sw;
          (i % 2 === 0 ? mEraRed : mEraWhite).add(new T.BoxGeometry(sw + 0.04, 0.14, 2.85), M(sx, y + 3.25, z + 1.15, 0.32, 0, 0));
        }
        mDarkTimber.add(new T.BoxGeometry(4.65, 1.02, 0.14), M(x, y + 4.78, z + 0.14));
        const cfTex = makeCafeSignTex();
        const cafeSign = new T.Mesh(new T.PlaneGeometry(4.45, 0.90), new T.MeshLambertMaterial({ map: cfTex, emissiveMap: cfTex, emissive: 0xffffff, emissiveIntensity: 0.34 }));
        cafeSign.position.set(x, y + 4.78, z + 0.22);
        group.add(cafeSign);
        made.meshes++;
      }
    });

    mCopper.mesh(copperPatinaMat);
    mDarkTimber.mesh(darkTimberMat);
    mEraGold.mesh(goldMat);
    mEraWhite.mesh(pentelicMat);
    mEraRed.mesh(lighthouseRedMat);
    mEraGlass.mesh(crystalMat);

    /* ---------------- 3E. ARCHITECTURAL WALL-MOUNTED MUSEUM GALLERIES & VARIED SCULPTURAL EXHIBITS (博物馆壁挂式多元陈列) ---------------- */
    const mMusWood = new Merger(), mMusGold = new Merger(), mMusVelvet = new Merger(), mMusMarble = new Merger(), mMusPage = new Merger();
    const mMusDark = new Merger(), mMusBlue = new Merger(), mMusEmerald = new Merger(), mMusBronze = new Merger(), mMusLamp = new Merger();
    const velvetMat = new T.MeshLambertMaterial({ color: 0x8b1d24 });
    const parchmentMat = new T.MeshLambertMaterial({ color: 0xfef8e6 });
    const bookNavyMat = new T.MeshLambertMaterial({ color: 0x1e3a5f });
    const bookEmeraldMat = new T.MeshLambertMaterial({ color: 0x14532d });
    const museumLampMat = new T.MeshBasicMaterial({ color: 0xfff3c4 });
    const texLoader = new T.TextureLoader();

    function loadMuseumPhotoTex(url, fallbackCanvasFn) {
      const tex = texLoader.load(url, () => {}, undefined, () => {
        // Fallback to procedural canvas if image fails to load
        if (fallbackCanvasFn) fallbackCanvasFn();
      });
      if (T.sRGBEncoding !== undefined) tex.encoding = T.sRGBEncoding;
      made.textures++;
      return tex;
    }

    // 1. Pure Masterpiece Texture: Loads REAL Museum Oil Painting / Historical Artwork from assets/artworks/<id>.jpg!
    function makePureArtTex(phil, isEastern) {
      const url = 'assets/artworks/' + phil.id + '.jpg';
      return loadMuseumPhotoTex(url);
    }

    // 1B. Real Historical Portrait Texture from assets/portraits/<id>.jpg!
    function makeRealPortraitTex(phil) {
      const url = 'assets/portraits/' + phil.id + '.jpg';
      return loadMuseumPhotoTex(url);
    }

    // 1C. Mount a REAL Historical Portrait of the Philosopher in an Ornate Museum Frame on the Wall!
    function mountWallPortrait(px, py, pz, ry, phil, style) {
      const nX = Math.sin(ry), nZ = Math.cos(ry);
      const tX = Math.cos(ry), tZ = -Math.sin(ry);
      const pw = 1.45, ph = 1.85;
      const portMesh = new T.Mesh(
        new T.PlaneGeometry(pw, ph),
        new T.MeshBasicMaterial({ map: makeRealPortraitTex(phil), side: T.DoubleSide })
      );
      portMesh.position.set(px + nX * 0.08, py, pz + nZ * 0.08);
      portMesh.rotation.y = ry;
      group.add(portMesh); made.meshes++;

      const fr = 0.11;
      const frameM = style === 'modern' ? mMusDark : style === 'marble' ? mMusMarble : mMusGold;
      frameM.add(new T.BoxGeometry(pw + fr * 2, fr, 0.12), M(px + nX * 0.06, py + ph / 2 + fr / 2, pz + nZ * 0.06, 0, ry, 0));
      frameM.add(new T.BoxGeometry(pw + fr * 2, fr, 0.12), M(px + nX * 0.06, py - ph / 2 - fr / 2, pz + nZ * 0.06, 0, ry, 0));
      frameM.add(new T.BoxGeometry(fr, ph, 0.12), M(px - tX * (pw / 2 + fr / 2) + nX * 0.06, py, pz - tZ * (pw / 2 + fr / 2) + nZ * 0.06, 0, ry, 0));
      frameM.add(new T.BoxGeometry(fr, ph, 0.12), M(px + tX * (pw / 2 + fr / 2) + nX * 0.06, py, pz + tZ * (pw / 2 + fr / 2) + nZ * 0.06, 0, ry, 0));
      // Overhead Brass Portrait Lamp
      mMusGold.add(cyl(0.028, 0.028, 0.72, 8), M(px + nX * 0.28, py + ph / 2 + 0.25, pz + nZ * 0.28, 0, ry, Math.PI / 2));
      mMusLamp.add(new T.BoxGeometry(0.64, 0.035, 0.04), M(px + nX * 0.27, py + ph / 2 + 0.22, pz + nZ * 0.27, 0, ry, 0));
    }

    // 2. Minimalist Museum Wall Placard beside/below the Painting (like Louvre / MoMA / Palace Museum)
    function makeArtPlacardTex(phil, style) {
      const c = document.createElement('canvas'); c.width = 512; c.height = 128;
      const x = c.getContext('2d');
      if (style === 'modern') {
        x.fillStyle = '#f8fafc'; x.fillRect(0, 0, 512, 128);
        x.strokeStyle = '#0f172a'; x.lineWidth = 3; x.strokeRect(2, 2, 508, 124);
        x.fillStyle = '#0f172a'; x.font = '900 22px "PingFang SC", sans-serif'; x.textAlign = 'left';
        x.fillText(phil.artTitle || '', 20, 40);
        x.fillStyle = '#475569'; x.font = 'bold 16px "PingFang SC", sans-serif';
        x.fillText((phil.artArtist || '').slice(0, 34), 20, 72);
        x.fillStyle = '#334155'; x.font = '14px "PingFang SC", sans-serif';
        x.fillText((phil.artDesc || '').slice(0, 34) + '…', 20, 102);
      } else if (style === 'marble') {
        x.fillStyle = '#f5f2e8'; x.fillRect(0, 0, 512, 128);
        x.strokeStyle = '#c89d3c'; x.lineWidth = 6; x.strokeRect(4, 4, 504, 120);
        x.fillStyle = '#1e293b'; x.font = '900 22px "PingFang SC", Georgia, serif'; x.textAlign = 'center';
        x.fillText(phil.artTitle || '', 256, 44);
        x.fillStyle = '#78350f'; x.font = 'bold 16px "PingFang SC", serif';
        x.fillText((phil.artArtist || '').slice(0, 34), 256, 76);
        x.fillStyle = '#475569'; x.font = '14px "PingFang SC", serif';
        x.fillText((phil.artDesc || '').slice(0, 34) + '…', 256, 106);
      } else {
        // Brushed Brass Museum Placard
        const g = x.createLinearGradient(0, 0, 512, 128);
        g.addColorStop(0, '#2a1f10'); g.addColorStop(1, '#1a1209');
        x.fillStyle = g; x.fillRect(0, 0, 512, 128);
        x.strokeStyle = '#d4a33b'; x.lineWidth = 5; x.strokeRect(4, 4, 504, 120);
        x.fillStyle = '#fef08a'; x.font = '900 22px "PingFang SC", Georgia, serif'; x.textAlign = 'center';
        x.fillText(phil.artTitle || '', 256, 44);
        x.fillStyle = '#cbd5e1'; x.font = 'bold 15px "PingFang SC", sans-serif';
        x.fillText((phil.artArtist || '').slice(0, 36), 256, 76);
        x.fillStyle = '#94a3b8'; x.font = '14px "PingFang SC", sans-serif';
        x.fillText((phil.artDesc || '').slice(0, 36) + '…', 256, 106);
      }
      const tex = new T.CanvasTexture(c);
      if (T.sRGBEncoding !== undefined) tex.encoding = T.sRGBEncoding;
      made.textures++;
      return tex;
    }

    // 3. West Wall Wikipedia-Grade Encyclopedia Biography, Timeline & Quote Panel
    function makeWallQuoteTex(phil, style) {
      const c = document.createElement('canvas'); c.width = 760; c.height = 420;
      const x = c.getContext('2d');
      const wiki = root.PIWiki ? root.PIWiki.get(phil.id) : null;
      const isLight = style === 'marble' || style === 'modern';
      if (style === 'marble') {
        const g = x.createLinearGradient(0, 0, 760, 420);
        g.addColorStop(0, '#faf7f0'); g.addColorStop(1, '#ebe4d4');
        x.fillStyle = g; x.fillRect(0, 0, 760, 420);
        x.strokeStyle = '#b48a3c'; x.lineWidth = 8; x.strokeRect(8, 8, 744, 404);
      } else if (style === 'lacquer') {
        x.fillStyle = '#180c08'; x.fillRect(0, 0, 760, 420);
        x.strokeStyle = '#eab308'; x.lineWidth = 8; x.strokeRect(8, 8, 744, 404);
      } else if (style === 'modern') {
        x.fillStyle = '#ffffff'; x.fillRect(0, 0, 760, 420);
        x.fillStyle = '#0f172a'; x.fillRect(24, 28, 7, 364);
      } else {
        x.fillStyle = '#1a1216'; x.fillRect(0, 0, 760, 420);
        x.strokeStyle = '#d4a33b'; x.lineWidth = 5; x.strokeRect(10, 10, 740, 400);
      }

      x.textAlign = 'left';
      const lx = 44;
      x.fillStyle = isLight ? '#92400e' : '#fbbf24';
      x.font = '900 26px "PingFang SC", Georgia, serif';
      x.fillText(`📚 ${phil.name} (${phil.en}) · 百科档案与生平年表`, lx, 52);

      if (wiki) {
        x.fillStyle = isLight ? '#1e3a8a' : '#93c5fd';
        x.font = 'bold 16px "PingFang SC", sans-serif';
        x.fillText(`生卒：${wiki.born.split('·')[0].trim()} — ${wiki.died.split('·')[0].trim()}  |  流派：${wiki.school}`, lx, 86);
        x.fillStyle = isLight ? '#334155' : '#cbd5e1';
        x.font = '15px "PingFang SC", sans-serif';
        x.fillText(`师承与影响：受 ${wiki.influencedBy} 启发 → 深刻影响 ${wiki.influenced.slice(0, 26)}`, lx, 114);

        // 4-point Historical Life Timeline
        x.fillStyle = isLight ? '#0f172a' : '#fef08a';
        x.font = 'bold 16px "PingFang SC", sans-serif';
        x.fillText('【历史生平年表 · BIOGRAPHY TIMELINE】', lx, 150);
        (wiki.timeline || []).slice(0, 4).forEach(([yr, ev], i) => {
          const ty = 180 + i * 32;
          x.fillStyle = isLight ? '#b45309' : '#f59e0b';
          x.font = 'bold 15px "PingFang SC", sans-serif';
          x.fillText(`● ${yr}`, lx, ty);
          x.fillStyle = isLight ? '#1e293b' : '#e2e8f0';
          x.font = '15px "PingFang SC", sans-serif';
          x.fillText(ev.slice(0, 36), lx + 128, ty);
        });
      }

      // Bottom Canonical Quote Bar
      x.fillStyle = isLight ? 'rgba(180,138,60,0.14)' : 'rgba(245,158,11,0.14)';
      x.fillRect(lx, 310, 672, 82);
      x.fillStyle = isLight ? '#1e3a8a' : '#7dd3fc';
      x.font = 'italic bold 15px Georgia, "PingFang SC", serif';
      x.fillText(`“ ${(phil.quoteOrig || '').slice(0, 56)} ”`, lx + 14, 336);
      x.fillStyle = isLight ? '#0f172a' : '#fef9c3';
      x.font = 'bold 19px "PingFang SC", Georgia, serif';
      x.fillText(`“${(phil.quote || '').slice(0, 32)}”`, lx + 14, 372);

      const tex = new T.CanvasTexture(c);
      if (T.sRGBEncoding !== undefined) tex.encoding = T.sRGBEncoding;
      made.textures++;
      return tex;
    }

    // 4. East Wall Floating Bookshelf Rail Labels (clean strip identifying the physical 3D books on the shelf!)
    function makeShelfRailTex(phil, booksSlice, isLight) {
      const c = document.createElement('canvas'); c.width = 512; c.height = 76;
      const x = c.getContext('2d');
      x.fillStyle = isLight ? '#f5f2e8' : '#1a120b'; x.fillRect(0, 0, 512, 76);
      x.strokeStyle = '#c89d3c'; x.lineWidth = 4; x.strokeRect(2, 2, 508, 72);
      x.fillStyle = isLight ? '#0f172a' : '#fef08a';
      x.font = 'bold 20px "PingFang SC", Georgia, serif';
      x.textAlign = 'center';
      x.fillText(booksSlice.map((b) => b.split('(')[0].trim()).join('   |   '), 256, 46);
      const tex = new T.CanvasTexture(c);
      if (T.sRGBEncoding !== undefined) tex.encoding = T.sRGBEncoding;
      made.textures++;
      return tex;
    }

    // Helper: Mount a 3D Wall-Mounted Art Frame with Real Beveled Moldings, Wall Picture Lamp & Minimalist Placard
    function mountWallPainting(px, py, pz, ry, phil, style) {
      const nX = Math.sin(ry), nZ = Math.cos(ry); // Outward wall normal
      const tX = Math.cos(ry), tZ = -Math.sin(ry); // Tangent along wall

      if (style === 'eastern') {
        // Traditional Chinese Hanging Silk Scroll (立轴卷轴画) with Rosewood & White-Jade Rollers!
        const sw = 2.35, sh = 2.75;
        const scMesh = new T.Mesh(
          new T.PlaneGeometry(sw, sh),
          new T.MeshBasicMaterial({ map: makePureArtTex(phil, true), side: T.DoubleSide })
        );
        scMesh.position.set(px + nX * 0.05, py, pz + nZ * 0.05);
        scMesh.rotation.y = ry;
        group.add(scMesh); made.meshes++;

        // Top & Bottom Rosewood Scroll Rollers + White Jade Roller Caps (紫檀轴杆 + 汉白玉轴头)
        for (const dy of [-sh / 2 - 0.03, sh / 2 + 0.03]) {
          mMusDark.add(cyl(0.055, 0.055, sw + 0.24, 12), M(px + nX * 0.06, py + dy, pz + nZ * 0.06, 0, ry, Math.PI / 2));
          for (const sx of [-(sw / 2 + 0.16), (sw / 2 + 0.16)]) {
            mMusMarble.add(cyl(0.065, 0.065, 0.12, 12), M(px + tX * sx + nX * 0.06, py + dy, pz + tZ * sx + nZ * 0.06, 0, ry, Math.PI / 2));
          }
        }
        // Golden Hanging Cord & Brass Wall Pin
        mMusGold.add(sph(0.06), M(px + nX * 0.06, py + sh / 2 + 0.36, pz + nZ * 0.06));
        mMusGold.add(cyl(0.015, 0.015, 0.72, 6), M(px - tX * 0.28 + nX * 0.05, py + sh / 2 + 0.20, pz - tZ * 0.28 + nZ * 0.05, 0, ry, -0.95));
        mMusGold.add(cyl(0.015, 0.015, 0.72, 6), M(px + tX * 0.28 + nX * 0.05, py + sh / 2 + 0.20, pz + tZ * 0.28 + nZ * 0.05, 0, ry, 0.95));
      } else {
        const pw = 3.15, ph = 1.96;
        const artMesh = new T.Mesh(
          new T.PlaneGeometry(pw, ph),
          new T.MeshBasicMaterial({ map: makePureArtTex(phil, false), side: T.DoubleSide })
        );
        artMesh.position.set(px + nX * 0.09, py, pz + nZ * 0.09);
        artMesh.rotation.y = ry;
        group.add(artMesh); made.meshes++;

        if (style === 'modern') {
          // MoMA / Bauhaus Floating Shadow-Gap Frame (sleek matte-black aluminum edges + ceiling track lights)
          mMusDark.add(new T.BoxGeometry(pw + 0.10, ph + 0.10, 0.06), M(px + nX * 0.04, py, pz + nZ * 0.04, 0, ry, 0));
          for (const sx of [-0.95, 0, 0.95]) {
            mMusDark.add(cyl(0.06, 0.06, 0.22, 10), M(px + tX * sx + nX * 0.55, py + ph / 2 + 0.52, pz + tZ * sx + nZ * 0.55, 0.55, ry, 0));
          }
        } else if (style === 'marble') {
          // Classical Greek Pentelic Marble Architectural Niche with Fluted Pilasters & Pediment Molding
          for (const sx of [-(pw / 2 + 0.16), (pw / 2 + 0.16)]) {
            mMusMarble.add(new T.BoxGeometry(0.24, ph + 0.36, 0.16), M(px + tX * sx + nX * 0.08, py, pz + tZ * sx + nZ * 0.08, 0, ry, 0));
          }
          mMusMarble.add(new T.BoxGeometry(pw + 0.62, 0.20, 0.22), M(px + nX * 0.10, py + ph / 2 + 0.16, pz + nZ * 0.10, 0, ry, 0));
          mMusGold.add(new T.BoxGeometry(pw + 0.52, 0.07, 0.24), M(px + nX * 0.11, py + ph / 2 + 0.04, pz + nZ * 0.11, 0, ry, 0));
          mMusMarble.add(new T.BoxGeometry(pw + 0.58, 0.16, 0.20), M(px + nX * 0.09, py - ph / 2 - 0.12, pz + nZ * 0.09, 0, ry, 0));
        } else {
          // Louvre / European 3D Layered Carved Gilded Museum Frame + Articulated Wall Brass Picture Lamp!
          const fr = 0.14;
          mMusGold.add(new T.BoxGeometry(pw + fr * 2, fr, 0.14), M(px + nX * 0.08, py + ph / 2 + fr / 2, pz + nZ * 0.08, 0, ry, 0));
          mMusGold.add(new T.BoxGeometry(pw + fr * 2, fr, 0.14), M(px + nX * 0.08, py - ph / 2 - fr / 2, pz + nZ * 0.08, 0, ry, 0));
          mMusGold.add(new T.BoxGeometry(fr, ph, 0.14), M(px - tX * (pw / 2 + fr / 2) + nX * 0.08, py, pz - tZ * (pw / 2 + fr / 2) + nZ * 0.08, 0, ry, 0));
          mMusGold.add(new T.BoxGeometry(fr, ph, 0.14), M(px + tX * (pw / 2 + fr / 2) + nX * 0.08, py, pz + tZ * (pw / 2 + fr / 2) + nZ * 0.08, 0, ry, 0));
          // Corner Rosette Medallions
          for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
            mMusGold.add(sph(0.09), M(px + tX * sx * (pw / 2 + fr / 2) + nX * 0.13, py + sy * (ph / 2 + fr / 2), pz + tZ * sx * (pw / 2 + fr / 2) + nZ * 0.13));
          }
          // Articulated Brass Museum Picture Lamp mounted on the wall above the painting!
          mMusGold.add(cyl(0.035, 0.035, 1.45, 10), M(px + nX * 0.36, py + ph / 2 + 0.34, pz + nZ * 0.36, 0, ry, Math.PI / 2));
          mMusLamp.add(new T.BoxGeometry(1.32, 0.04, 0.05), M(px + nX * 0.34, py + ph / 2 + 0.30, pz + nZ * 0.34, 0, ry, 0));
          for (const sx of [-0.45, 0.45]) {
            mMusGold.add(cyl(0.02, 0.02, 0.36, 6), M(px + tX * sx + nX * 0.18, py + ph / 2 + 0.34, pz + tZ * sx + nZ * 0.18, Math.PI / 2, ry, 0));
          }
        }

        // Minimalist Wall-Mounted Curator Placard cleanly underneath the painting!
        const placMesh = new T.Mesh(
          new T.PlaneGeometry(1.95, 0.48),
          new T.MeshBasicMaterial({ map: makeArtPlacardTex(phil, style), side: T.DoubleSide })
        );
        placMesh.position.set(px + nX * 0.06, py - ph / 2 - 0.44, pz + nZ * 0.06);
        placMesh.rotation.y = ry;
        group.add(placMesh); made.meshes++;
      }
    }

    // Helper: Mount a 3D Floating Museum Bookshelf Wall-Niche with Physical 3D Leather-Bound Magnum Opus Books!
    function mountWallBookNiche(px, py, pz, ry, phil, isLight) {
      const nX = Math.sin(ry), nZ = Math.cos(ry);
      const tX = Math.cos(ry), tZ = -Math.sin(ry);
      const works = phil.works || ['《哲学代表作》'];
      const shelfM = isLight ? mMusMarble : mMusWood;
      const bookMergers = [mMusVelvet, mMusBlue, mMusEmerald, mMusDark];

      for (let row = 0; row < 2; row++) {
        const sy = py + (row === 0 ? 1.05 : 0.0);
        // Floating Architectural Wall Shelf & Slender Brass Brackets
        shelfM.add(new T.BoxGeometry(3.2, 0.10, 0.38), M(px + nX * 0.19, sy, pz + nZ * 0.19, 0, ry, 0));
        for (const sx of [-1.2, 1.2]) {
          mMusGold.add(new T.BoxGeometry(0.06, 0.24, 0.32), M(px + tX * sx + nX * 0.16, sy - 0.14, pz + tZ * sx + nZ * 0.16, 0, ry, 0));
        }

        // Physical 3D Leather-Bound Magnum Opus Books displayed standing & tilted on the shelf!
        for (let b = 0; b < 5; b++) {
          const bx = -1.25 + b * 0.62;
          const isFeatured = b === 1 || b === 3;
          const bm = bookMergers[(b + row * 2 + phil.num) % bookMergers.length];
          if (isFeatured) {
            // Angled Front-Facing Featured Hardcover Book on a Brass Easel!
            bm.add(new T.BoxGeometry(0.36, 0.48, 0.08), M(px + tX * bx + nX * 0.20, sy + 0.29, pz + tZ * bx + nZ * 0.20, -0.18, ry, 0));
            mMusGold.add(new T.BoxGeometry(0.28, 0.06, 0.09), M(px + tX * bx + nX * 0.21, sy + 0.38, pz + tZ * bx + nZ * 0.21, -0.18, ry, 0));
            mMusPage.add(new T.BoxGeometry(0.32, 0.44, 0.05), M(px + tX * bx + nX * 0.18, sy + 0.29, pz + tZ * bx + nZ * 0.18, -0.18, ry, 0));
          } else {
            // Upright Stacked Classical Volumes with Golden Spine Bands
            for (let k = 0; k < 2; k++) {
              const ox = bx + (k - 0.5) * 0.14;
              bm.add(new T.BoxGeometry(0.11, 0.42 + (k % 2) * 0.06, 0.28), M(px + tX * ox + nX * 0.20, sy + 0.26, pz + tZ * ox + nZ * 0.20, 0, ry, 0));
              mMusGold.add(new T.BoxGeometry(0.12, 0.04, 0.29), M(px + tX * ox + nX * 0.20, sy + 0.36, pz + tZ * ox + nZ * 0.20, 0, ry, 0));
            }
          }
        }

        // Clean Brass-Framed Book Title Rail mounted directly below the shelf!
        const slice = works.slice(row * 2, row * 2 + 2);
        if (slice.length) {
          const railMesh = new T.Mesh(
            new T.PlaneGeometry(3.0, 0.36),
            new T.MeshBasicMaterial({ map: makeShelfRailTex(phil, slice, isLight), side: T.DoubleSide })
          );
          railMesh.position.set(px + nX * 0.06, sy - 0.26, pz + nZ * 0.06);
          railMesh.rotation.y = ry;
          group.add(railMesh); made.meshes++;
        }
      }
    }

    // Helper: Sculpt a Real 3D Classical Marble / Antique Bronze Philosopher Portrait Bust on a Fluted Museum Pedestal!
    function buildPhilosopherBust(sx, sy, sz, isBronze) {
      const matM = isBronze ? mMusBronze : mMusMarble;
      // Fluted Museum Pedestal & Moulded Base/Capital
      mMusMarble.add(new T.BoxGeometry(0.76, 0.16, 0.76), M(sx, sy + 0.08, sz));
      mMusMarble.add(cyl(0.28, 0.32, 0.96, 16), M(sx, sy + 0.64, sz));
      mMusGold.add(new T.BoxGeometry(0.68, 0.07, 0.68), M(sx, sy + 1.14, sz));
      // Classical Turned Bust Socle Base
      matM.add(cyl(0.14, 0.22, 0.18, 16), M(sx, sy + 1.26, sz));
      // Sculpted Draped Shoulders & Classical Toga / Coat Collar
      matM.add(sph(0.32), M(sx, sy + 1.48, sz, 0, 0, 0, 1.25, 0.62, 0.75));
      matM.add(torus(0.22, 0.055), M(sx, sy + 1.56, sz + 0.04, 1.2, 0, 0));
      // Sculpted Neck & Classical Head
      matM.add(cyl(0.10, 0.12, 0.22, 14), M(sx, sy + 1.72, sz));
      matM.add(sph(0.21), M(sx, sy + 1.94, sz, 0, 0, 0, 0.92, 1.12, 0.98));
      // Classical Brow Ridge, Nose & Hair/Beard Massing
      matM.add(new T.BoxGeometry(0.06, 0.10, 0.09), M(sx, sy + 1.93, sz + 0.19));
      matM.add(sph(0.215), M(sx, sy + 2.02, sz - 0.03, 0, 0, 0, 1.0, 0.82, 1.0));
      matM.add(sph(0.14), M(sx, sy + 1.78, sz + 0.12, 0, 0, 0, 0.95, 0.95, 0.72));
    }

    (P.museumExhibits || []).forEach((ME) => {
      const { x, y, z, nZ, wX, eX, isGreekTemple, isTholos, isEastern, isModern, phil } = ME;
      const artStyle = isEastern ? 'eastern' : (isGreekTemple || isTholos) ? 'marble' : isModern ? 'modern' : 'louvre';
      const quoteStyle = isEastern ? 'lacquer' : (isGreekTemple || isTholos) ? 'marble' : isModern ? 'modern' : 'velvet';

      // For Socrates' Open Circular Tholos: build a sleek Pentelic Marble Curved/Segmented Gallery Screen Wall on the North arc!
      if (ME.isSchoolOfAthens) {
        // Raphael's The School of Athens: Mount the real Vatican fresco & portrait cleanly on the West flanking wall,
        // and the 3D Magnum Opus bookshelf on the East flanking wall, keeping the central triumphal arch & marble steps 100% pure!
        mountWallPainting(wX, y + 2.55, z + 3.2, Math.PI / 2, phil, 'marble');
        mountWallPortrait(wX, y + 2.55, z - 3.6, Math.PI / 2, phil, 'marble');
        mountWallBookNiche(eX, y + 1.65, z + 3.2, -Math.PI / 2, phil, true);
        const qMesh = new T.Mesh(new T.PlaneGeometry(3.6, 1.98), new T.MeshBasicMaterial({ map: makeWallQuoteTex(phil, 'marble'), side: T.DoubleSide }));
        qMesh.position.set(eX - 0.06, y + 2.55, z - 3.6);
        qMesh.rotation.y = -Math.PI / 2;
        group.add(qMesh); made.meshes++;
        return;
      } else if (isTholos) {
        mMusMarble.add(new T.BoxGeometry(7.8, 3.8, 0.32), M(x, y + 1.9, nZ - 0.18));
        mMusGold.add(new T.BoxGeometry(8.0, 0.12, 0.38), M(x, y + 3.84, nZ - 0.18));
        mountWallPainting(x - 1.1, y + 2.15, nZ, 0, phil, 'marble');
        mountWallPortrait(x + 2.35, y + 2.15, nZ, 0, phil, 'marble');
        // Side Marble Wikipedia Biography & Timeline Stele on West Wing of Tholos
        mMusMarble.add(new T.BoxGeometry(0.28, 3.0, 3.6), M(wX - 0.15, y + 1.5, z - 0.5));
        const qMesh = new T.Mesh(new T.PlaneGeometry(3.35, 1.85), new T.MeshBasicMaterial({ map: makeWallQuoteTex(phil, 'marble'), side: T.DoubleSide }));
        qMesh.position.set(wX + 0.04, y + 1.88, z - 0.5);
        qMesh.rotation.y = Math.PI / 2;
        group.add(qMesh); made.meshes++;
      } else if (isGreekTemple) {
        // Greek Peripteral Temples: West Naos Wall = Real Masterpiece Painting + Real Portrait; East Naos Wall = 3D Floating Book Niche; North Wall = Wikipedia Biography Stele!
        mountWallPainting(wX, y + 2.45, z - 0.85, Math.PI / 2, phil, 'marble');
        mountWallPortrait(wX, y + 2.45, z + 2.15, Math.PI / 2, phil, 'marble');
        mountWallBookNiche(eX, y + 1.55, z - 0.3, -Math.PI / 2, phil, true);
        const qMesh = new T.Mesh(new T.PlaneGeometry(3.8, 2.05), new T.MeshBasicMaterial({ map: makeWallQuoteTex(phil, 'marble'), side: T.DoubleSide }));
        qMesh.position.set(x, y + 3.95, nZ + 0.06);
        group.add(qMesh); made.meshes++;
      } else {
        // 1. NORTH FOCAL WALL: Real Museum Oil Painting (left-center) + Real Historical Philosopher Portrait (right)!
        mountWallPainting(x - 1.05, y + 2.38, nZ, 0, phil, artStyle);
        mountWallPortrait(x + 2.05, y + 2.38, nZ, 0, phil, artStyle);

        // 2. WEST INTERIOR WALL: Wikipedia-Grade Museum Biography, Life Timeline & Canonical Quote Wall Panel!
        const qMesh = new T.Mesh(
          new T.PlaneGeometry(3.65, 2.02),
          new T.MeshBasicMaterial({ map: makeWallQuoteTex(phil, quoteStyle), side: T.DoubleSide })
        );
        qMesh.position.set(wX + 0.05, y + 2.25, z - 0.2);
        qMesh.rotation.y = Math.PI / 2;
        group.add(qMesh); made.meshes++;
        mMusGold.add(cyl(0.03, 0.03, 1.6, 8), M(wX + 0.28, y + 3.45, z - 0.2, Math.PI / 2, 0, 0));

        // 3. EAST INTERIOR WALL: Wall-Mounted 3D Floating Magnum Opus Bookshelf with Physical Leather-Bound 3D Books!
        mountWallBookNiche(eX, y + 1.50, z - 0.2, -Math.PI / 2, phil, isModern);
      }

      // 4. VARIED OPEN-FLOOR SCULPTURAL EXHIBITS:
      // (A) Left-Side Sleek Tilted Museum Manuscript Lectern with Open 3D Gold-Leaf Tome
      const xL = x - 2.35, zL = z + 1.15;
      (isEastern ? mMusDark : mMusMarble).add(cyl(0.14, 0.22, 0.96, 12), M(xL, y + 0.48, zL));
      mMusGold.add(cyl(0.32, 0.36, 0.08, 12), M(xL, y + 0.04, zL));
      mMusWood.add(new T.BoxGeometry(0.76, 0.06, 0.56), M(xL, y + 1.02, zL, 0.34, 0, 0));
      mMusGold.add(new T.BoxGeometry(0.64, 0.03, 0.44), M(xL, y + 1.06, zL, 0.34, 0, 0));
      mMusPage.add(new T.BoxGeometry(0.28, 0.05, 0.40), M(xL - 0.14, y + 1.10, zL, 0.34, 0, 0.12));
      mMusPage.add(new T.BoxGeometry(0.28, 0.05, 0.40), M(xL + 0.14, y + 1.10, zL, 0.34, 0, -0.12));
      mMusVelvet.add(new T.BoxGeometry(0.035, 0.055, 0.45), M(xL, y + 1.11, zL + 0.02, 0.34, 0, 0));

      // (B) Right-Side Real Sculpted 3D Classical Marble / Antique Bronze Philosopher Portrait Bust on a Fluted Museum Pedestal!
      buildPhilosopherBust(x + 2.35, y, z + 1.15, isEastern || isModern);
    });

    mMusWood.mesh(oakPostMat);
    mMusGold.mesh(goldMat);
    mMusVelvet.mesh(velvetMat);
    mMusMarble.mesh(pentelicMat);
    mMusPage.mesh(parchmentMat);
    mMusDark.mesh(darkTimberMat);
    mMusBlue.mesh(bookNavyMat);
    mMusEmerald.mesh(bookEmeraldMat);
    mMusBronze.mesh(bronzeMat);
    mMusLamp.mesh(museumLampMat);

    /* ---------------- 4. FLOATING PORTAL CRYSTALS & WATERWHEELS ---------------- */
    const floatingCrystals = [];
    const octGeo = new T.OctahedronGeometry(0.45, 0);
    const ringGeo = new T.TorusGeometry(0.66, 0.045, 8, 24);
    (P.philosopherPlaques || []).forEach((item) => {
      const { x, y, z, phil } = item;
      const crystal = new T.Mesh(octGeo, crystalMat);
      crystal.position.set(x, y + 1.15, z);
      const halo = new T.Mesh(ringGeo, goldMat);
      halo.position.set(x, y + 1.15, z);
      group.add(crystal, halo);
      floatingCrystals.push({ crystal, halo, baseY: y + 1.15, phase: phil.num * 0.7 });
      made.meshes += 2;
    });

    const rotatingWheels = [];
    (P.waterwheels || []).forEach((ww) => {
      const wheelGroup = new T.Group();
      wheelGroup.position.set(ww.x, ww.y, ww.z);
      const mat = ww.brass ? bronzeMat : oakPostMat;
      const rim = new T.Mesh(new T.TorusGeometry(ww.r, 0.14, 8, 24), mat);
      rim.rotation.y = Math.PI / 2;
      wheelGroup.add(rim);
      for (let i = 0; i < 8; i++) {
        const spoke = new T.Mesh(new T.BoxGeometry(0.12, ww.r * 2, 0.28), mat);
        spoke.rotation.x = (i / 8) * Math.PI;
        wheelGroup.add(spoke);
      }
      group.add(wheelGroup);
      rotatingWheels.push(wheelGroup);
      made.meshes += 9;
    });

    /* ---------------- 5. PLATO'S 5 SOLIDS & UNDERGROUND CAVE LIVE SHADOW ENGINE ---------------- */
    const plato = world.PHILOSOPHERS.find((p) => p.id === 'plato');
    const platonicSolids = [];
    if (plato) {
      const solids = [
        new T.TetrahedronGeometry(0.6),
        new T.BoxGeometry(0.8, 0.8, 0.8),
        new T.OctahedronGeometry(0.62),
        new T.DodecahedronGeometry(0.62),
        new T.IcosahedronGeometry(0.62)
      ];
      solids.forEach((geo, idx) => {
        const px = plato.x - 8 + idx * 4;
        const pz = plato.z + Math.floor(plato.d / 2) + 3.5;
        const ped = new T.Mesh(cyl(0.38, 0.48, 1.2, 10), marbleMat);
        ped.position.set(px, plato.gy + 0.6, pz);
        const mesh = new T.Mesh(geo, goldMat);
        mesh.position.set(px, plato.gy + 1.75, pz);
        group.add(ped, mesh);
        platonicSolids.push(mesh);
        made.meshes += 2;
      });
    }

    const caveControl = {
      puppetIndex: 0,
      fireDistance: 1.0,
      puppetOffsetX: 0,
      autoOscillate: true,
      setPuppet(idx) { this.puppetIndex = idx % 3; updateCaveShadowMeshes(); },
      setFireDist(d) { this.fireDistance = d; }
    };

    const cavePuppets = [], caveShadows = [];
    if (P.caveStage) {
      const cs = P.caveStage;
      const puppetGeos = [
        cyl(0.28, 0.45, 1.15, 12),
        new T.ConeGeometry(0.58, 1.25, 4),
        new T.TorusGeometry(0.5, 0.17, 10, 24)
      ];
      puppetGeos.forEach((g, idx) => {
        const pMesh = new T.Mesh(g, bronzeMat);
        pMesh.position.set(cs.x, cs.y + 1.6, cs.zPuppet);
        pMesh.visible = idx === 0;
        const sMesh = new T.Mesh(g.clone(), darkShadowMat);
        sMesh.position.set(cs.x, cs.y + 2.1, cs.zWall);
        sMesh.scale.set(2.2, 2.2, 0.05);
        sMesh.visible = idx === 0;
        group.add(pMesh, sMesh);
        cavePuppets.push(pMesh);
        caveShadows.push(sMesh);
        made.meshes += 2;
      });
    }
    function updateCaveShadowMeshes() {
      cavePuppets.forEach((m, i) => { m.visible = i === caveControl.puppetIndex; });
      caveShadows.forEach((m, i) => { m.visible = i === caveControl.puppetIndex; });
    }

    // Kant's 2F Armillary Sphere
    const rotatingRings = [];
    const kant = world.PHILOSOPHERS.find((p) => p.id === 'kant');
    if (kant) {
      for (let r = 0; r < 3; r++) {
        const ring = new T.Mesh(new T.TorusGeometry(0.95 - r * 0.2, 0.05, 8, 28), goldMat);
        ring.position.set(kant.x + 0.5, kant.gy + 6.9, kant.z + 0.5);
        group.add(ring);
        rotatingRings.push({ mesh: ring, speedX: 0.6 + r * 0.4, speedY: 0.8 - r * 0.3 });
        made.meshes++;
      }
    }

    // Swans & Ducks on the Stream of Experience
    const mWhite = new Merger(), mBeak = new Merger(), mDuck = new Merger();
    (P.swans || []).forEach((o) => {
      mWhite.add(sph(0.34), M(o.x, o.y + 0.22, o.z, 0, o.r, 0, 0.8, 0.62, 1.35));
      mWhite.add(sph(0.12), M(o.x + Math.sin(o.r) * 0.4, o.y + 0.85, o.z + Math.cos(o.r) * 0.4));
      mBeak.add(new T.BoxGeometry(0.08, 0.05, 0.2), M(o.x + Math.sin(o.r) * 0.55, o.y + 0.82, o.z + Math.cos(o.r) * 0.55, 0, o.r, 0));
    });
    (P.ducks || []).forEach((o) => {
      mDuck.add(sph(0.22), M(o.x, o.y + 0.14, o.z, 0, o.r, 0, 0.75, 0.6, 1.3));
    });
    mWhite.mesh(new T.MeshLambertMaterial({ color: 0xf6f6f2 }));
    mBeak.mesh(new T.MeshLambertMaterial({ color: 0xe8862a }));
    mDuck.mesh(new T.MeshLambertMaterial({ color: 0x7e6a50 }));

    // Distant Rolling Wolds Horizon Ring
    const farGroup = new T.Group();
    {
      const r = rng(1781), cx = world.W / 2, cz = world.D / 2, pos = [], col = [];
      const cGrass = [0.48, 0.66, 0.32], cWood = [0.28, 0.42, 0.24], cTop = [0.58, 0.72, 0.38];
      function down(px, pz, base, top, rad, sides) {
        const rings = [[1, 0], [0.76, 0.44], [0.48, 0.8], [0.2, 0.96]].map(([fr, fy]) => {
          const out = [];
          for (let i = 0; i < sides; i++) {
            const a = i / sides * Math.PI * 2, rr = rad * fr * (0.9 + 0.2 * Math.sin(a * 3 + px));
            out.push([px + Math.cos(a) * rr, base + (top - base) * fy, pz + Math.sin(a) * rr]);
          }
          return out;
        });
        const apex = [px, top, pz];
        const shade = (y) => { const t = (y - base) / (top - base); return t < 0.32 && r() < 0.7 ? cWood : t > 0.8 ? cTop : cGrass; };
        const tri = (a, b, c) => {
          const s = shade((a[1] + b[1] + c[1]) / 3), k = 0.9 + r() * 0.1;
          [a, b, c].forEach((p) => { pos.push(p[0], p[1], p[2]); col.push(s[0] * k, s[1] * k, s[2] * k); });
        };
        for (let q = 0; q < rings.length - 1; q++) {
          const A = rings[q], Bq = rings[q + 1];
          for (let i = 0; i < sides; i++) { const j = (i + 1) % sides; tri(A[i], Bq[i], Bq[j]); tri(A[i], Bq[j], A[j]); }
        }
        const L = rings[rings.length - 1];
        for (let i = 0; i < sides; i++) tri(L[i], apex, L[(i + 1) % sides]);
      }
      for (let i = 0; i < 56; i++) {
        const a = r() * Math.PI * 2, d = 520 + r() * 780;
        down(cx + Math.cos(a) * d, cz + Math.sin(a) * d, 34, 52 + r() * 34, Math.min(260 + r() * 240, d - 320), 12);
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      g.computeVertexNormals();
      farGroup.add(new T.Mesh(g, new T.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
      scene.add(farGroup);
      made.meshes++;
    }

    /* ---------------- 3F. HIGH-CRAFT ARCHITECTURAL HOUSE DETAILS & ISLAND EXTERIOR POLISH ---------------- */
    const mTrimStone = new Merger();
    const mTrimIron = new Merger();
    const mTrimShutter = new Merger();
    const mTrimTerracotta = new Merger();
    const mTrimLeaf = new Merger();
    const mTrimFlowerRed = new Merger();
    const mTrimFlowerGold = new Merger();
    const mTrimFlowerLav = new Merger();
    const mTrimLantern = new Merger();
    const mTrimRedSilk = new Merger();
    const mTrimSailWood = new Merger();
    const mTrimSailCanvas = new Merger();
    const bobbingBoats = [];

    (world.PHILOSOPHERS || []).forEach((p) => {
      const hw = Math.floor((p.w || 16) / 2), hd = Math.floor((p.d || 14) / 2);
      const x0 = p.x - hw, x1 = p.x + hw, z0 = p.z - hd, z1 = p.z + hd;
      const gy = p.gy || 38;
      const isGreek = p.id === 'socrates' || p.id === 'plato' || p.id === 'aristotle' || p.id === 'zeno';
      const isEastern = p.id === 'confucius' || p.id === 'laozi' || p.id === 'zhuangzi';
      const isBauhaus = p.id === 'wittgenstein';

      if (isGreek) {
        // Ancient Greek Temples: Flanking Terracotta Olive Amphorae & Carved Marble Laurel Planters at Entrance Steps
        const stepZ = p.id === 'socrates' ? p.z + 9.2 : z1 + 2.8;
        for (const side of [-1, 1]) {
          const ax = p.x + 0.5 + side * 2.6;
          // Fluted Marble Urn Pedestal + Terracotta Amphora
          mTrimStone.add(new T.BoxGeometry(0.72, 0.42, 0.72), M(ax, gy + 0.21, stepZ));
          mTrimTerracotta.add(cyl(0.28, 0.16, 0.56, 12), M(ax, gy + 0.70, stepZ));
          mTrimTerracotta.add(cyl(0.16, 0.26, 0.26, 12), M(ax, gy + 1.08, stepZ));
          mTrimTerracotta.add(torus(0.18, 0.04), M(ax, gy + 1.22, stepZ, Math.PI / 2));
          // Sculpted Olive / Laurel Shrub Crown
          mTrimLeaf.add(sph(0.36), M(ax, gy + 1.52, stepZ, 0, 0, 0, 1.0, 1.15, 1.0));
        }
      } else if (isEastern) {
        // Eastern Palaces & Pavilions: Carved White-Marble Drum Gate Pedestals (抱鼓石), Hanging Red Silk Lanterns & Taihu Rocks!
        for (const side of [-1, 1]) {
          const gx = p.x + 0.5 + side * 2.45;
          // Drum Stone (抱鼓石)
          mTrimStone.add(new T.BoxGeometry(0.68, 0.42, 0.85), M(gx, gy + 0.21, z1 + 1.55));
          mTrimStone.add(cyl(0.32, 0.32, 0.36, 14), M(gx, gy + 0.68, z1 + 1.55, 0, 0, Math.PI / 2));
          // Hanging Red Silk Palace Lanterns under Front Eaves
          const lx = p.x + 0.5 + side * 3.8;
          mTrimIron.add(cyl(0.02, 0.02, 0.75, 6), M(lx, gy + 5.2, z1 + 1.45));
          mTrimRedSilk.add(sph(0.34), M(lx, gy + 4.65, z1 + 1.45, 0, 0, 0, 1.0, 1.25, 1.0));
          mTrimLantern.add(cyl(0.14, 0.14, 0.10, 10), M(lx, gy + 5.05, z1 + 1.45));
          mTrimLantern.add(cyl(0.12, 0.12, 0.10, 10), M(lx, gy + 4.24, z1 + 1.45));
        }
        // Sculptural Taihu Scholar's Rock (太湖石) in side garden
        const rx = x0 - 2.4, rz = z1 + 2.4;
        mTrimStone.add(sph(0.65), M(rx, gy + 0.55, rz, 0.2, 0.5, 0.1, 0.85, 1.45, 0.72));
        mTrimStone.add(sph(0.45), M(rx + 0.38, gy + 1.15, rz - 0.15, -0.3, 0.2, 0.2, 0.75, 1.2, 0.68));
      } else if (isBauhaus) {
        // 20th-C Bauhaus Villa: Sleek Cantilevered Black-Steel Entrance Canopy & Minimalist Architectural Uplights
        mTrimIron.add(new T.BoxGeometry(4.8, 0.14, 2.2), M(p.x + 0.5, gy + 3.45, z1 + 1.15));
        mTrimIron.add(cyl(0.055, 0.055, 3.45, 8), M(p.x - 1.7, gy + 1.72, z1 + 2.05));
        mTrimIron.add(cyl(0.055, 0.055, 3.45, 8), M(p.x + 2.7, gy + 1.72, z1 + 2.05));
        for (const side of [-1, 1]) {
          mTrimStone.add(new T.BoxGeometry(0.42, 0.32, 0.42), M(p.x + 0.5 + side * 2.9, gy + 0.16, z1 + 2.2));
          mTrimLantern.add(new T.BoxGeometry(0.28, 0.08, 0.28), M(p.x + 0.5 + side * 2.9, gy + 0.36, z1 + 2.2));
        }
      } else {
        // European / Western Classical Residences:
        // 1. Twin Wrought-Iron Wall Coach Lanterns + Stone Entry Steps + Molded Porch Pediment
        for (const side of [-1, 1]) {
          const lx = p.x + 0.5 + side * 2.25;
          mTrimIron.add(new T.BoxGeometry(0.10, 0.10, 0.42), M(lx, gy + 2.72, z1 + 1.28));
          mTrimLantern.add(new T.BoxGeometry(0.22, 0.32, 0.22), M(lx, gy + 2.48, z1 + 1.44));
          mTrimIron.add(new T.ConeGeometry(0.20, 0.18, 4), M(lx, gy + 2.72, z1 + 1.44, 0, Math.PI / 4, 0));

          // Terracotta Planters with Trimmed Boxwood Topiary Spheres flanking the front doorway
          const px = p.x + 0.5 + side * 2.85;
          mTrimTerracotta.add(cyl(0.32, 0.22, 0.44, 12), M(px, gy + 0.22, z1 + 1.75));
          mTrimLeaf.add(sph(0.38), M(px, gy + 0.72, z1 + 1.75));
          mTrimLeaf.add(sph(0.24), M(px, gy + 1.16, z1 + 1.75));

          // Stone Courtyard Gateposts topped with Classical Stone Ball Finials at garden wall entrance
          const gpx = p.x + 0.5 + side * 2.9;
          mTrimStone.add(new T.BoxGeometry(0.68, 1.35, 0.68), M(gpx, gy + 0.68, z1 + 3.5));
          mTrimStone.add(new T.BoxGeometry(0.82, 0.14, 0.82), M(gpx, gy + 1.42, z1 + 3.5));
          mTrimStone.add(sph(0.26), M(gpx, gy + 1.72, z1 + 3.5));
        }

        // 2. Front Facade 3D Wooden Shutters, Stone Window Sills & Blooming Flower Window Boxes!
        const flowerMergers = [mTrimFlowerRed, mTrimFlowerGold, mTrimFlowerLav];
        for (let wx = x0 + 2; wx <= x1 - 2; wx += 3) {
          if (Math.abs(wx - p.x) <= 3) continue;
          const fcx = wx + 1.0;
          if (fcx > x1 - 1.5) continue;
          // Stone Sill + Carved Wooden Window Box
          mTrimStone.add(new T.BoxGeometry(1.95, 0.14, 0.36), M(fcx, gy + 1.02, z1 + 1.12));
          mTrimShutter.add(new T.BoxGeometry(1.78, 0.26, 0.30), M(fcx, gy + 1.22, z1 + 1.18));
          // Left & Right Louvered Wooden Shutters flanking the casement window
          mTrimShutter.add(new T.BoxGeometry(0.34, 1.92, 0.08), M(fcx - 1.12, gy + 2.02, z1 + 1.06));
          mTrimShutter.add(new T.BoxGeometry(0.34, 1.92, 0.08), M(fcx + 1.12, gy + 2.02, z1 + 1.06));
          // Lush Foliage & Blooming Geranium/Marigold/Lavender Blossoms inside the Window Box
          const fm = flowerMergers[(wx + p.num) % flowerMergers.length];
          for (let b = -2; b <= 2; b++) {
            mTrimLeaf.add(sph(0.16), M(fcx + b * 0.34, gy + 1.40, z1 + 1.20));
            if (b % 2 === 0) fm.add(sph(0.11), M(fcx + b * 0.34, gy + 1.50, z1 + 1.24));
          }
        }
      }
    });

    // Roadside Wrought-Iron & Warm-Glow Garden Streetlamps along main island avenues
    const streetLamps = [
      [192, 232], [192, 248], [186, 268], [198, 268],
      [168, 200], [150, 212], [134, 224],
      [216, 178], [238, 176], [260, 176],
      [172, 166], [148, 152], [126, 134],
      [192, 146], [190, 118], [218, 138], [244, 124]
    ];
    streetLamps.forEach(([sx, sz]) => {
      const ly = world.topH[sx + world.W * sz];
      if (!ly || ly <= 32) return;
      mTrimStone.add(new T.BoxGeometry(0.46, 0.34, 0.46), M(sx + 0.5, ly + 0.17, sz + 0.5));
      mTrimIron.add(cyl(0.055, 0.085, 3.1, 8), M(sx + 0.5, ly + 1.75, sz + 0.5));
      mTrimIron.add(new T.BoxGeometry(0.34, 0.06, 0.34), M(sx + 0.5, ly + 3.32, sz + 0.5));
      mTrimLantern.add(new T.BoxGeometry(0.24, 0.32, 0.24), M(sx + 0.5, ly + 3.50, sz + 0.5));
      mTrimIron.add(new T.ConeGeometry(0.26, 0.22, 4), M(sx + 0.5, ly + 3.74, sz + 0.5, 0, Math.PI / 4, 0));
    });

    // Anchored Classical Wooden Sailboats gently bobbing on the azure bay around the island!
    const boatSpots = [
      [158, 304, 0.45], [228, 302, -0.55], [102, 274, 0.9], [286, 264, -1.1], [86, 172, 0.25], [308, 160, -0.35]
    ];
    const boatWoodMat = new T.MeshLambertMaterial({ color: 0x6b3e26 });
    const boatSailMat = new T.MeshLambertMaterial({ color: 0xfbf8f1, side: T.DoubleSide });
    const boatMastMat = new T.MeshLambertMaterial({ color: 0x3b2416 });
    boatSpots.forEach(([bx, bz, rot], idx) => {
      const bg = new T.Group();
      bg.position.set(bx, 32.15, bz);
      bg.rotation.y = rot;
      // Curved Hull + Deck
      const hull = new T.Mesh(new T.BoxGeometry(2.2, 0.85, 5.4), boatWoodMat);
      hull.position.y = 0.25;
      const bow = new T.Mesh(new T.ConeGeometry(1.12, 1.9, 4), boatWoodMat);
      bow.rotation.set(Math.PI / 2, Math.PI / 4, 0);
      bow.position.set(0, 0.30, 3.6);
      const mast = new T.Mesh(cyl(0.09, 0.12, 6.2, 8), boatMastMat);
      mast.position.set(0, 3.4, 0.2);
      const boom = new T.Mesh(cyl(0.06, 0.06, 3.8, 6), boatMastMat);
      boom.rotation.x = Math.PI / 2;
      boom.position.set(0, 1.65, -1.5);
      // Graceful Billowing Lateen / Mainsail
      const sail = new T.Mesh(new T.PlaneGeometry(3.4, 4.4), boatSailMat);
      sail.position.set(0.18, 3.7, -1.35);
      sail.rotation.y = Math.PI / 2 + 0.18;
      const jib = new T.Mesh(new T.PlaneGeometry(2.1, 3.4), boatSailMat);
      jib.position.set(-0.12, 3.1, 1.65);
      jib.rotation.y = Math.PI / 2 - 0.16;
      bg.add(hull, bow, mast, boom, sail, jib);
      group.add(bg);
      bobbingBoats.push({ grp: bg, baseY: 32.15, baseRot: rot, phase: idx * 1.15 });
      made.meshes += 6;
    });

    mTrimStone.mesh(pentelicMat);
    mTrimIron.mesh(new T.MeshLambertMaterial({ color: 0x1e242b }));
    mTrimShutter.mesh(new T.MeshLambertMaterial({ color: 0x2f5241 })); // Classical European Sage-Green Shutters
    mTrimTerracotta.mesh(new T.MeshLambertMaterial({ color: 0xb85636 }));
    mTrimLeaf.mesh(new T.MeshLambertMaterial({ color: 0x2d6a36 }));
    mTrimFlowerRed.mesh(new T.MeshLambertMaterial({ color: 0xe11d48 }));
    mTrimFlowerGold.mesh(new T.MeshLambertMaterial({ color: 0xf59e0b }));
    mTrimFlowerLav.mesh(new T.MeshLambertMaterial({ color: 0x8b5cf6 }));
    mTrimLantern.mesh(new T.MeshBasicMaterial({ color: 0xffe6a3 }));
    mTrimRedSilk.mesh(new T.MeshLambertMaterial({ color: 0xdc2626 }));

    function update(dt, time) {
      for (const b of bobbingBoats) {
        b.grp.position.y = b.baseY + Math.sin(time * 1.3 + b.phase) * 0.12;
        b.grp.rotation.z = Math.sin(time * 0.95 + b.phase) * 0.045;
        b.grp.rotation.x = Math.cos(time * 0.8 + b.phase) * 0.03;
      }
      if (flames) {
        const f = 0.86 + Math.sin(time * 13.1) * 0.06 + Math.sin(time * 7.3) * 0.05;
        flameMat.color.setRGB(1, 0.82 * f, 0.46 * f);
      }
      for (const fc of floatingCrystals) {
        const bob = Math.sin(time * 2.2 + fc.phase) * 0.16;
        fc.crystal.position.y = fc.baseY + bob;
        fc.crystal.rotation.y = time * 1.4 + fc.phase;
        fc.halo.position.y = fc.baseY + bob;
        fc.halo.rotation.x = Math.sin(time * 1.5 + fc.phase) * 0.6;
        fc.halo.rotation.y = time * 0.9;
      }
      for (const w of rotatingWheels) {
        w.rotation.x += dt * 0.85;
      }
      platonicSolids.forEach((m, idx) => {
        m.rotation.y = time * (0.7 + idx * 0.15);
        m.rotation.x = Math.sin(time * 0.8 + idx) * 0.35;
      });
      for (const rr of rotatingRings) {
        rr.mesh.rotation.x += dt * rr.speedX;
        rr.mesh.rotation.y += dt * rr.speedY;
      }
      for (const sw of rotatingSunWheels) {
        sw.rotation.z += dt * 0.45;
      }
      for (const bb of rotatingBeaconBeams) {
        bb.rotation.y += dt * 0.85;
      }
      if (P.caveStage && cavePuppets.length) {
        const cs = P.caveStage;
        if (caveControl.autoOscillate) caveControl.puppetOffsetX = Math.sin(time * 1.3) * 1.8;
        const px = cs.x + caveControl.puppetOffsetX;
        const mag = 1.4 + (2.0 - caveControl.fireDistance) * 1.35 + Math.sin(time * 7) * 0.06;
        const activeP = cavePuppets[caveControl.puppetIndex];
        const activeS = caveShadows[caveControl.puppetIndex];
        if (activeP && activeS) {
          activeP.position.x = px;
          activeP.rotation.y = time * 1.1;
          activeS.position.x = cs.x + caveControl.puppetOffsetX * (mag * 0.72);
          activeS.position.y = cs.y + 1.8 + (mag - 1.5) * 0.35;
          activeS.scale.set(mag, mag, 0.06);
          activeS.rotation.y = activeP.rotation.y;
        }
      }
    }

    return { update, caveControl, stats: () => made };
  }

  root.PIProps = { build, paintMasterpiece };
})(window);
