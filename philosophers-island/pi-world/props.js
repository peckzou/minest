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
        new T.MeshLambertMaterial({ map: tex, emissiveMap: tex, emissive: 0xfff4dc, emissiveIntensity: 0.52 })
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

    /* ---------------- 3B-2. RAPHAEL'S THE SCHOOL OF ATHENS — Bramante Basilica Deep Replica (拉斐尔《雅典学院》建筑深度复刻) ---------------- */
    const saClouds = [];
    if (P.schoolOfAthens) {
      const SA = P.schoolOfAthens;
      const cx = SA.x, gy = SA.y, cz = SA.z;
      const zF = cz + 10.7, FT = 0.65;           // Front pier facade face (109.2) & thickness
      const zPro = zF + 1.2;                     // Foreground Gold-and-Black Meander Proscenium Arch (110.4)
      const zV1b = cz + 5.5;                     // Vault 1 back / Crossing south edge (104.0)
      const zXn = cz - 1.1, XW = 0.85;           // Crossing north spandrel wall front face (97.4) & thickness
      const zV2f = zXn - XW;                     // Vault 2 front (96.55)
      const zV2b = cz - 6.7;                     // Vault 2 back (91.8)
      const zA3f = cz - 13.1, zA3b = cz - 14.9;  // Distant 3rd Triumphal Arch (85.4 .. 83.6)
      const zStep = cz + 4.5;                    // Top edge of 4-step white marble staircase (103.0)
      const daisY = gy + 1.02;                   // Raised upper philosophical sanctuary dais
      const R1 = 5.4, S1 = gy + 8.3;             // Vault 1 inner radius & springing Y (apex = gy + 13.7)
      const R2 = 5.1, S2 = gy + 8.05;            // Vault 2 inner radius & springing Y (apex = gy + 13.15)
      const RP = 11.2, SP = gy + 1.8;            // Proscenium Gold-Meander Arch radius & springing Y
      const DR = gy + 14.05;                     // Central Crossing Drum cornice base Y
      const NX = 7.45;                           // Apollo & Athena recessed niche X offset

      /* ---------- A. 6 Bespoke High-Resolution Procedural Renaissance Textures ---------- */
      const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
      function finTex(c, wrap) {
        const t = new T.CanvasTexture(c);
        if (wrap) t.wrapS = t.wrapT = T.RepeatWrapping;
        if (T.sRGBEncoding !== undefined) t.encoding = T.sRGBEncoding;
        t.anisotropy = 4;
        made.textures++;
        return t;
      }

      // 1. Interlocking Octagonal-Lozenge & Diamond Stone Coffers with Recessed Shadow Bevels & Rosettes
      function makeLozengeCofferTex() {
        const S = 512, c = cvs(S, S), x = c.getContext('2d'), r = rng(911);
        x.fillStyle = '#ece3ce'; x.fillRect(0, 0, S, S);
        const oct = (px, py, rr) => {
          x.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = Math.PI / 8 + k * Math.PI / 4;
            const qx = px + Math.cos(a) * rr, qy = py + Math.sin(a) * rr;
            if (k) x.lineTo(qx, qy); else x.moveTo(qx, qy);
          }
          x.closePath();
        };
        const dia = (px, py, rr) => {
          x.beginPath(); x.moveTo(px, py - rr); x.lineTo(px + rr, py); x.lineTo(px, py + rr); x.lineTo(px - rr, py); x.closePath();
        };
        const recess = (shape, px, py, rr, shrink) => {
          const cols = ['#ece3ce', '#d8cab0', '#beae8e', '#978769'];
          for (let i = 0; i < 4; i++) {
            const q = rr - i * shrink;
            shape(px - 2.5, py - 2.5, q); x.fillStyle = 'rgba(255,252,240,0.68)'; x.fill();
            shape(px + 2.8, py + 2.8, q); x.fillStyle = 'rgba(72,58,38,0.42)'; x.fill();
            shape(px, py, q); x.fillStyle = cols[i]; x.fill();
          }
        };
        const ros = (px, py, rr) => {
          x.save(); x.translate(px, py);
          for (let k = 0; k < 8; k++) {
            x.rotate(Math.PI / 4);
            x.fillStyle = '#bc8d3f'; x.beginPath(); x.ellipse(rr * 0.54, 0, rr * 0.46, rr * 0.19, 0, 0, Math.PI * 2); x.fill();
            x.fillStyle = 'rgba(255,235,178,0.62)'; x.beginPath(); x.ellipse(rr * 0.48, -rr * 0.05, rr * 0.30, rr * 0.07, 0, 0, Math.PI * 2); x.fill();
          }
          x.fillStyle = '#e7c572'; x.beginPath(); x.arc(0, 0, rr * 0.23, 0, Math.PI * 2); x.fill();
          x.strokeStyle = '#6d5022'; x.lineWidth = 2; x.stroke();
          x.restore();
        };
        recess(oct, S / 2, S / 2, 236, 20);
        const corners = [[0, 0], [S, 0], [0, S], [S, S]];
        corners.forEach(([qx, qy]) => recess(dia, qx, qy, 102, 15));
        ros(S / 2, S / 2, 66);
        corners.forEach(([qx, qy]) => ros(qx, qy, 24));
        for (let i = 0; i < 1200; i++) {
          x.fillStyle = r() > 0.5 ? 'rgba(90,70,40,0.06)' : 'rgba(255,255,255,0.06)';
          x.fillRect(r() * S, r() * S, 1 + r() * 3, 1 + r() * 2);
        }
        return finTex(c, true);
      }

      // 2. Crisp Gold-and-Obsidian Greek Key / Meander Band (前景金黑回纹框券)
      function makeGreekMeanderTex() {
        const W = 512, H = 128, c = cvs(W, H), x = c.getContext('2d');
        x.fillStyle = '#efe7d4'; x.fillRect(0, 0, W, H);
        x.fillStyle = '#b4a37d'; x.fillRect(0, 17, W, 4); x.fillRect(0, H - 21, W, 4);
        x.fillStyle = '#18130e'; x.fillRect(0, 22, W, H - 44);
        for (let bx = 4; bx < W; bx += 12) {
          x.fillStyle = '#d8ceb4';
          x.beginPath(); x.arc(bx, 9, 3.2, 0, Math.PI * 2); x.fill();
          x.beginPath(); x.arc(bx, H - 9, 3.2, 0, Math.PI * 2); x.fill();
        }
        const top = 32, bot = H - 32, u = 64, hh = bot - top;
        const key = (ox, col, lw, d) => {
          x.strokeStyle = col; x.lineWidth = lw; x.lineJoin = 'miter'; x.lineCap = 'square';
          x.beginPath();
          x.moveTo(ox + d, bot + d); x.lineTo(ox + d, top + d);
          x.lineTo(ox + u * 0.78 + d, top + d); x.lineTo(ox + u * 0.78 + d, top + hh * 0.72 + d);
          x.lineTo(ox + u * 0.30 + d, top + hh * 0.72 + d); x.lineTo(ox + u * 0.30 + d, top + hh * 0.36 + d);
          x.lineTo(ox + u * 0.55 + d, top + hh * 0.36 + d);
          x.stroke();
        };
        for (let ox = 0; ox < W; ox += u) {
          key(ox + 6, '#7a5c1e', 9.5, 1.5);
          key(ox + 6, '#dfb44d', 8, 0);
        }
        x.strokeStyle = '#7a5c1e'; x.lineWidth = 9; x.beginPath(); x.moveTo(0, bot + 1.5); x.lineTo(W, bot + 1.5); x.stroke();
        x.strokeStyle = '#dfb44d'; x.lineWidth = 8; x.beginPath(); x.moveTo(0, bot); x.lineTo(W, bot); x.stroke();
        x.strokeStyle = 'rgba(255,238,176,0.58)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, bot - 3); x.lineTo(W, bot - 3); x.stroke();
        return finTex(c, true);
      }

      // 3. Warm Veined Roman Travertine Ashlar Stonework
      function makeTravertineTex() {
        const S = 256, c = cvs(S, S), x = c.getContext('2d'), r = rng(733);
        x.fillStyle = '#efe7d4'; x.fillRect(0, 0, S, S);
        for (let i = 0; i < 75; i++) {
          const y = r() * S;
          x.strokeStyle = r() > 0.5 ? 'rgba(168,148,110,0.16)' : 'rgba(255,252,242,0.24)';
          x.lineWidth = 0.6 + r() * 1.6;
          x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(S * 0.3, y + (r() - 0.5) * 6, S * 0.7, y + (r() - 0.5) * 6, S, y + (r() - 0.5) * 3); x.stroke();
        }
        for (let i = 0; i < 240; i++) {
          x.fillStyle = 'rgba(118,96,62,' + (0.07 + r() * 0.14) + ')';
          x.beginPath(); x.ellipse(r() * S, r() * S, 0.6 + r() * 2.2, 0.4 + r() * 0.8, 0, 0, Math.PI * 2); x.fill();
        }
        return finTex(c, true);
      }

      // 4. Deep-Grooved Fluted Corinthian Pilaster Texture
      function makeFluteTex() {
        const S = 256, c = cvs(S, S), x = c.getContext('2d');
        x.fillStyle = '#f3edde'; x.fillRect(0, 0, S, S);
        const n = 7, m = 14, fw = (S - m * 2) / n;
        for (let i = 0; i < n; i++) {
          const fx = m + i * fw + 3, w = fw - 6;
          const g = x.createLinearGradient(fx, 0, fx + w, 0);
          g.addColorStop(0, '#847760'); g.addColorStop(0.32, '#b0a286'); g.addColorStop(0.75, '#ebe3d0'); g.addColorStop(1, '#a09378');
          x.fillStyle = g; x.fillRect(fx, 0, w, S);
        }
        return finTex(c, true);
      }

      // 5. Opus Sectile Inlaid Geometric Marble Floor (Serene Luminous Vatican Marble + Muted Porphyry Borders)
      function makeOpusSectileTex() {
        const S = 512, c = cvs(S, S), x = c.getContext('2d'), r = rng(517);
        x.fillStyle = '#f2ede2'; x.fillRect(0, 0, S, S);
        // Subtle muted porphyry-lavender & warm taupe geometric grid bands
        x.fillStyle = '#9e8f9a';
        x.fillRect(0, 0, S, 10); x.fillRect(0, 251, S, 10); x.fillRect(0, S - 10, S, 10);
        x.fillRect(0, 0, 10, S); x.fillRect(251, 0, 10, S); x.fillRect(S - 10, 0, 10, S);
        for (let py = 0; py < 2; py++) for (let px = 0; px < 2; px++) {
          const ox = px * 256, oy = py * 256;
          x.fillStyle = (px + py) % 2 ? '#eae4d8' : '#f6f2e9';
          x.fillRect(ox + 16, oy + 16, 224, 224);
          x.strokeStyle = '#b4a5ad'; x.lineWidth = 3;
          x.strokeRect(ox + 26, oy + 26, 204, 204);
          x.fillStyle = (px + py) % 2 ? '#f3efe6' : '#e4ded2';
          x.fillRect(ox + 34, oy + 34, 188, 188);
          // Delicate central inlaid lozenge accent
          x.strokeStyle = 'rgba(136, 118, 130, 0.45)'; x.lineWidth = 2.5;
          x.beginPath(); x.moveTo(ox + 128, oy + 82); x.lineTo(ox + 174, oy + 128); x.lineTo(ox + 128, oy + 174); x.lineTo(ox + 82, oy + 128); x.closePath(); x.stroke();
        }
        // Fine natural marble veins
        for (let i = 0; i < 48; i++) {
          x.strokeStyle = 'rgba(148,138,126,0.18)'; x.lineWidth = 0.9;
          let px = r() * S, py = r() * S; x.beginPath(); x.moveTo(px, py);
          for (let k = 0; k < 5; k++) { px += (r() - 0.5) * 44; py += (r() - 0.3) * 28; x.lineTo(px, py); }
          x.stroke();
        }
        return finTex(c, true);
      }

      function makeBandFloorTex() {
        const S = 256, c = cvs(S, S), x = c.getContext('2d');
        for (let i = 0; i < 4; i++) { x.fillStyle = i % 2 ? '#c0b7a5' : '#eee8d9'; x.fillRect(0, i * 64, S, 64); }
        x.strokeStyle = 'rgba(110,98,80,0.38)'; x.lineWidth = 2;
        for (let i = 0; i <= 4; i++) {
          x.beginPath(); x.moveTo(0, i * 64); x.lineTo(S, i * 64); x.stroke();
          x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, S); x.stroke();
        }
        return finTex(c, true);
      }

      // 6. Sculpted Classical Bas-Reliefs & Circular Tondo Medallions
      function reliefFigure(x, fx, fy, s, o) {
        const pass = (col, dx, dy) => {
          x.save(); x.translate(fx + dx, fy + dy); if (o.rot) x.rotate(o.rot);
          x.fillStyle = col; x.strokeStyle = col; x.lineCap = 'round'; x.lineJoin = 'round';
          const lean = o.lean || 0, hipY = o.seated ? -0.32 * s : -0.46 * s;
          const nx = lean * s * 0.22, ny = -0.86 * s;
          x.beginPath(); x.arc(nx + lean * s * 0.05, ny - 0.1 * s, 0.085 * s, 0, Math.PI * 2); x.fill();
          x.lineWidth = 0.17 * s; x.beginPath(); x.moveTo(nx, ny); x.lineTo(0, hipY); x.stroke();
          x.lineWidth = 0.065 * s;
          for (const [ang, len] of [[o.armL == null ? 2.4 : o.armL, 0.4], [o.armR == null ? 0.7 : o.armR, 0.4]]) {
            x.beginPath(); x.moveTo(nx, ny + 0.05 * s);
            x.lineTo(nx + Math.cos(ang) * len * s, ny + 0.05 * s - Math.sin(ang) * len * s); x.stroke();
          }
          x.lineWidth = 0.09 * s;
          if (o.seated) {
            x.beginPath(); x.moveTo(0, hipY); x.lineTo(0.3 * s, hipY); x.lineTo(0.32 * s, 0); x.stroke();
            x.beginPath(); x.moveTo(0, hipY); x.lineTo(0.26 * s, hipY + 0.03 * s); x.lineTo(0.22 * s, 0); x.stroke();
          } else {
            const sp = o.spread == null ? 0.14 : o.spread;
            x.beginPath(); x.moveTo(0, hipY); x.lineTo(-sp * s, 0); x.stroke();
            x.beginPath(); x.moveTo(0, hipY); x.lineTo(sp * s, 0); x.stroke();
          }
          if (o.drape !== false) {
            x.beginPath(); x.moveTo(nx - 0.1 * s, ny + 0.04 * s);
            x.bezierCurveTo(-0.26 * s, -0.5 * s, -0.24 * s, -0.25 * s, -0.16 * s, -0.12 * s);
            x.lineTo(0.16 * s, -0.16 * s); x.bezierCurveTo(0.12 * s, -0.4 * s, 0.1 * s, -0.6 * s, nx + 0.08 * s, ny + 0.1 * s); x.closePath(); x.fill();
          }
          x.restore();
        };
        pass('rgba(116,100,72,0.86)', 5, 5);
        pass('#e6dcc4', 0, 0);
        pass('rgba(255,250,238,0.75)', -1.5, -1.5);
        pass('#eee5ce', 0.5, 0.5);
      }

      function makeBasReliefTex(variant) {
        const W = 512, H = 320, c = cvs(W, H), x = c.getContext('2d'), r = rng(variant === 'apollo' ? 41 : 43);
        const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#e3d8be'); g.addColorStop(1, '#cebf9f');
        x.fillStyle = g; x.fillRect(0, 0, W, H);
        for (let i = 0; i < 850; i++) { x.fillStyle = 'rgba(100,84,56,' + (0.04 + r() * 0.08) + ')'; x.fillRect(r() * W, r() * H, 1 + r() * 2, 1); }
        x.fillStyle = 'rgba(88,72,48,0.36)'; x.fillRect(0, 0, W, 10); x.fillRect(0, 0, 10, H);
        x.fillStyle = 'rgba(255,250,236,0.36)'; x.fillRect(0, H - 8, W, 8); x.fillRect(W - 8, 0, 8, H);
        if (variant === 'apollo') {
          reliefFigure(x, 92, 268, 125, { rot: -1.15, armL: 2.0, armR: 0.3, spread: 0.2 });
          reliefFigure(x, 210, 290, 230, { lean: 0.3, armL: 2.6, armR: 1.4, spread: 0.24 });
          reliefFigure(x, 330, 290, 220, { lean: -0.2, armL: 1.9, armR: 0.5, spread: 0.12 });
          reliefFigure(x, 440, 290, 200, { armL: 3.0, armR: 0.2, spread: 0.18 });
        } else {
          x.fillStyle = 'rgba(120,104,76,0.8)'; x.fillRect(214, 188, 96, 104);
          x.fillStyle = '#e6dcc4'; x.fillRect(210, 184, 96, 104);
          reliefFigure(x, 230, 222, 210, { seated: true, armL: 2.2, armR: 0.9 });
          reliefFigure(x, 100, 292, 190, { lean: 0.35, armL: 0.6, armR: 0.2, spread: 0.2 });
          reliefFigure(x, 390, 292, 200, { lean: -0.35, armL: 2.5, armR: 2.9, spread: 0.16 });
          reliefFigure(x, 470, 292, 170, { armL: 2.8, armR: 1.2, spread: 0.12 });
        }
        return finTex(c, false);
      }

      function makeTondoTex(variant) {
        const S = 256, c = cvs(S, S), x = c.getContext('2d');
        const g = x.createRadialGradient(110, 100, 10, 128, 128, 128); g.addColorStop(0, '#f0e7d2'); g.addColorStop(1, '#bfb090');
        x.fillStyle = g; x.fillRect(0, 0, S, S);
        x.strokeStyle = 'rgba(110,94,66,0.62)'; x.lineWidth = 6; x.beginPath(); x.arc(128, 128, 118, 0, Math.PI * 2); x.stroke();
        x.strokeStyle = 'rgba(255,250,236,0.62)'; x.lineWidth = 3; x.beginPath(); x.arc(128, 128, 110, 0, Math.PI * 2); x.stroke();
        if (variant === 'left') reliefFigure(x, 128, 222, 172, { seated: true, armL: 2.4, armR: 1.0 });
        else reliefFigure(x, 128, 226, 180, { lean: 0.2, armL: 2.9, armR: 0.4 });
        return finTex(c, false);
      }

      function makeShellTex() {
        const W = 256, H = 128, c = cvs(W, H), x = c.getContext('2d');
        const n = 9, fw = W / n;
        for (let i = 0; i < n; i++) {
          const g = x.createLinearGradient(i * fw, 0, (i + 1) * fw, 0);
          g.addColorStop(0, '#9c8f73'); g.addColorStop(0.45, '#ebe2cd'); g.addColorStop(0.8, '#d4c8ac'); g.addColorStop(1, '#9f9276');
          x.fillStyle = g; x.fillRect(i * fw, 0, fw + 1, H);
        }
        return finTex(c, false);
      }

      function makeCloudTex(seed) {
        const W = 512, H = 256, c = cvs(W, H), x = c.getContext('2d'), r = rng(seed);
        for (let i = 0; i < 24; i++) {
          const px = 70 + r() * 372, py = 122 + (r() - 0.5) * 68 - Math.sin((px / W) * Math.PI) * 28, rr = 34 + r() * 52;
          const g = x.createRadialGradient(px, py - rr * 0.2, rr * 0.1, px, py, rr);
          g.addColorStop(0, 'rgba(255,255,255,0.92)'); g.addColorStop(0.55, 'rgba(248,250,255,0.56)'); g.addColorStop(1, 'rgba(235,242,252,0)');
          x.fillStyle = g; x.beginPath(); x.arc(px, py, rr, 0, Math.PI * 2); x.fill();
        }
        return finTex(c, false);
      }

      /* ---------- Materials ---------- */
      const travTex = makeTravertineTex();
      const travExTex = travTex.clone(); travExTex.needsUpdate = true; travExTex.repeat.set(0.24, 0.24);
      const cofferTex = makeLozengeCofferTex();
      const meanderTex = makeGreekMeanderTex();
      const fluteTex = makeFluteTex();
      const opusTex = makeOpusSectileTex();
      const bandTex = makeBandFloorTex();

      const travMat = new T.MeshLambertMaterial({ map: travTex, emissive: 0x221c12 });
      const travExMat = new T.MeshLambertMaterial({ map: travExTex, emissive: 0x221c12, side: T.DoubleSide });
      const travDMat = new T.MeshLambertMaterial({ map: travTex, color: 0xc9bb9c, emissive: 0x14100a });
      const nicheMat = new T.MeshLambertMaterial({ map: travTex, color: 0xd6c9ac, emissive: 0x261f14, side: T.DoubleSide });
      const pilMat = new T.MeshLambertMaterial({ map: fluteTex, emissive: 0x1d1810 });
      const capMat = new T.MeshLambertMaterial({ color: 0xf6f1e6, emissive: 0x28231a });
      const cofferMat = new T.MeshLambertMaterial({ map: cofferTex, emissiveMap: cofferTex, emissive: 0xfff0d4, emissiveIntensity: 0.42, side: T.DoubleSide });
      const meanderMat = new T.MeshLambertMaterial({ map: meanderTex, emissiveMap: meanderTex, emissive: 0xfff0d0, emissiveIntensity: 0.26, side: T.DoubleSide });
      const statueMat = new T.MeshLambertMaterial({ color: 0xf6f1e7, emissive: 0x2e2a22, side: T.DoubleSide });
      const shellMat = new T.MeshLambertMaterial({ map: makeShellTex(), emissive: 0x2a2316, side: T.DoubleSide });

      const mTrav = new Merger(), mTravEx = new Merger(), mTravD = new Merger(), mNiche = new Merger();
      const mPil = new Merger(), mCap = new Merger(), mStat = new Merger(), mShell = new Merger(), mBr = new Merger(), mGd = new Merger();
      const figM = {}; const FM = (hex) => figM[hex] || (figM[hex] = new Merger());

      function addMesh(geo, mat, px, py, pz, rx, ry, rz, shadow) {
        const m = new T.Mesh(geo, mat);
        m.position.set(px, py, pz); m.rotation.set(rx || 0, ry || 0, rz || 0);
        m.receiveShadow = true; if (shadow) m.castShadow = true;
        group.add(m); made.meshes++; return m;
      }
      const box = (mg, w, h, d, px, py, pz, ry) => mg.add(new T.BoxGeometry(w, h, d), M(px, py, pz, 0, ry || 0, 0));

      /* ---------- B. ExtrudeGeometry & Architectural Helpers ---------- */
      function archShape(halfW, totalH, archR, springH, holes) {
        const s = new T.Shape();
        s.moveTo(-halfW, 0); s.lineTo(-archR, 0); s.lineTo(-archR, springH);
        s.absarc(0, springH, archR, Math.PI, 0, true);
        s.lineTo(archR, 0); s.lineTo(halfW, 0); s.lineTo(halfW, totalH); s.lineTo(-halfW, totalH); s.closePath();
        if (holes) holes.forEach((h) => s.holes.push(h));
        return s;
      }
      function archHole(hx, y0, w, h) {
        const rr = w / 2, p = new T.Path();
        p.moveTo(hx - rr, y0); p.lineTo(hx + rr, y0); p.lineTo(hx + rr, y0 + h - rr);
        p.absarc(hx, y0 + h - rr, rr, 0, Math.PI, false); p.lineTo(hx - rr, y0);
        return p;
      }
      function ringShape(r0, r1) {
        const s = new T.Shape();
        s.moveTo(r1, 0); s.absarc(0, 0, r1, 0, Math.PI, false);
        s.lineTo(-r0, 0); s.absarc(0, 0, r0, Math.PI, 0, true); s.closePath();
        return s;
      }
      const extrude = (shape, depth, segs) => new T.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: segs || 28 });
      function addArchedWall(mg, px, py, pz, halfW, totalH, archR, springH, depth, holes, ry) {
        mg.add(extrude(archShape(halfW, totalH, archR, springH, holes), depth), M(px, py, pz, 0, ry || 0, 0));
      }
      function addFlatWall(mg, px, py, pz, halfW, totalH, depth, holes, ry) {
        const s = new T.Shape();
        s.moveTo(-halfW, 0); s.lineTo(halfW, 0); s.lineTo(halfW, totalH); s.lineTo(-halfW, totalH); s.closePath();
        (holes || []).forEach((h) => s.holes.push(h));
        mg.add(extrude(s, depth, 16), M(px, py, pz, 0, ry || 0, 0));
      }
      function addRing(mg, px, py, pz, r0, r1, depth) { mg.add(extrude(ringShape(r0, r1), depth, 44), M(px, py, pz)); }

      function addCofferVault(zFront, zBack, rr, springY, uTiles, vTiles) {
        const g = new Geo(), segs = 32, white = [1, 1, 1];
        for (let i = 0; i < segs; i++) {
          const a0 = (i / segs) * Math.PI, a1 = ((i + 1) / segs) * Math.PI;
          const p0 = [cx + Math.cos(a0) * rr, springY + Math.sin(a0) * rr];
          const p1 = [cx + Math.cos(a1) * rr, springY + Math.sin(a1) * rr];
          const u0 = (i / segs) * uTiles, u1 = ((i + 1) / segs) * uTiles;
          g.quad([p0[0], p0[1], zFront], [p1[0], p1[1], zFront], [p1[0], p1[1], zBack], [p0[0], p0[1], zBack], [u0, 0], [u1, 0], [u1, vTiles], [u0, vTiles], white);
        }
        const m = g.mesh(cofferMat); if (m) m.castShadow = true;
      }

      function addPilaster(px, py, pz, h, w, alongX) {
        const d = 0.24, ry = alongX ? 0 : Math.PI / 2;
        box(mCap, w + 0.22, 0.26, d + 0.14, px, py + 0.13, pz, ry);
        box(mCap, w + 0.12, 0.14, d + 0.08, px, py + 0.33, pz, ry);
        const shaftH = Math.max(0.5, h - 1.02);
        box(mPil, w, shaftH, d, px, py + 0.4 + shaftH / 2, pz, ry);
        const yc = py + 0.4 + shaftH;
        box(mCap, w + 0.05, 0.07, d + 0.04, px, yc + 0.035, pz, ry);
        box(mCap, w + 0.04, 0.26, d + 0.05, px, yc + 0.2, pz, ry);
        box(mCap, w + 0.14, 0.11, d + 0.10, px, yc + 0.16, pz, ry);
        box(mCap, w + 0.20, 0.11, d + 0.14, px, yc + 0.34, pz, ry);
        for (const sx of [-1, 1]) {
          const ox = alongX ? sx * (w / 2 + 0.06) : 0, oz = alongX ? 0 : sx * (w / 2 + 0.06);
          mCap.add(cyl(0.06, 0.06, d + 0.12, 8), M(px + ox, yc + 0.44, pz + oz, alongX ? Math.PI / 2 : 0, 0, alongX ? 0 : Math.PI / 2));
        }
        box(mCap, w + 0.30, 0.10, d + 0.20, px, yc + 0.57, pz, ry);
      }

      function addEntablature(e0, e1, facePos, yb, alongX, dirSign) {
        const L = Math.abs(e1 - e0), mid = (e0 + e1) / 2;
        const put = (mg, depth, h, y) => {
          const o = facePos + dirSign * (depth / 2 - 0.02);
          if (alongX) box(mg, L, h, depth, mid, y, o); else box(mg, depth, h, L, o, y, mid);
        };
        put(mTrav, 0.24, 0.24, yb + 0.12);
        put(mTravD, 0.18, 0.20, yb + 0.34);
        for (let t = 0.14; t < L - 0.06; t += 0.26) {
          const pos = Math.min(e0, e1) + t, o = facePos + dirSign * 0.20;
          if (alongX) box(mCap, 0.10, 0.10, 0.12, pos, yb + 0.49, o); else box(mCap, 0.12, 0.10, 0.10, o, yb + 0.49, pos);
        }
        put(mCap, 0.46, 0.16, yb + 0.62);
      }

      /* ---------- C1. Zone 0: Colossal Foreground Proscenium Arch with 3D Curved Gold-and-Black Greek Meander Band ---------- */
      addArchedWall(mTravEx, cx, SP, zF - 0.05, 13.0, 12.6, RP, 0.02, 1.25);
      addRing(mCap, cx, SP, zPro, RP - 0.06, RP + 0.14, 0.12);
      addRing(mCap, cx, SP, zPro, RP + 1.04, RP + 1.52, 0.18);
      {
        const g = new Geo(), segs = 64, ri = RP + 0.14, ro = RP + 1.04, rep = 16, white = [1, 1, 1], zz = zPro + 0.04;
        for (let i = 0; i < segs; i++) {
          const a0 = (i / segs) * Math.PI, a1 = ((i + 1) / segs) * Math.PI;
          const P0 = (rr, a) => [cx + Math.cos(a) * rr, SP + Math.sin(a) * rr, zz];
          g.quad(P0(ri, a0), P0(ro, a0), P0(ro, a1), P0(ri, a1), [(i / segs) * rep, 0], [(i / segs) * rep, 1], [((i + 1) / segs) * rep, 1], [((i + 1) / segs) * rep, 0], white);
        }
        g.mesh(meanderMat);
      }
      for (const sd of [-1, 1]) {
        const px = cx + sd * (RP + 0.9);
        box(mTrav, 1.8, SP - gy, 1.35, px, gy + (SP - gy) / 2, zF + 0.58);
        box(mCap, 2.0, 0.24, 1.55, px, gy + 0.12, zF + 0.58);
      }

      /* ---------- C2. Zone 1: Monumental Apollo & Athena Pier Walls + Recessed Conch-Shell Niches + Fluted Corridor ---------- */
      const nicheY0 = 4.0, nicheW = 2.08, nicheH = 3.85;
      addArchedWall(mTravEx, cx, gy, zF - FT, 12.2, 14.3, R1, S1 - gy, FT,
        [archHole(-NX, nicheY0, nicheW, nicheH), archHole(NX, nicheY0, nicheW, nicheH)]);
      addRing(mCap, cx, S1, zF, R1, R1 + 0.48, 0.14);
      box(mCap, 0.60, 1.05, 0.36, cx, S1 + R1 + 0.24, zF + 0.06);
      box(mTravD, 25.0, 0.36, FT + 0.26, cx, gy + 0.18, zF - FT / 2 + 0.05);

      for (const sd of [-1, 1]) {
        // Front pier pilasters framing Apollo & Athena niches + continuous entablature
        for (const px of [5.85, 9.05, 11.45]) addPilaster(cx + sd * px, gy, zF + 0.12, 7.95, 0.58, true);
        addEntablature(cx + sd * R1, cx + sd * 12.2, zF, gy + 7.95, true, 1);

        const nx = cx + sd * NX, zAx = zF - FT;
        // True deeply recessed semicircular stone niche + ribbed conch-shell half-dome (no z-fighting!)
        mNiche.add(new T.CylinderGeometry(nicheW / 2, nicheW / 2, nicheH - nicheW / 2, 20, 1, true, Math.PI / 2, Math.PI), M(nx, gy + nicheY0 + (nicheH - nicheW / 2) / 2, zAx));
        mShell.add(new T.SphereGeometry(nicheW / 2, 20, 10, Math.PI, Math.PI, 0, Math.PI / 2), M(nx, gy + nicheY0 + nicheH - nicheW / 2, zAx));
        box(mCap, nicheW + 0.48, 0.16, 1.35, nx, gy + nicheY0 - 0.04, zAx - 0.42);
        box(mCap, 1.0, 0.26, 0.80, nx, gy + nicheY0 + 0.17, zAx - 0.32);
        addRing(mCap, nx, gy + nicheY0 + nicheH - nicheW / 2, zF, nicheW / 2, nicheW / 2 + 0.15, 0.08);

        // Classical carved bas-relief panels beneath Apollo/Athena + secondary outer reliefs
        const relief = (rx, ry, w, h, variant) => {
          box(mCap, w + 0.28, h + 0.28, 0.10, rx, ry, zF + 0.04);
          const mt = makeBasReliefTex(variant);
          addMesh(new T.PlaneGeometry(w, h), new T.MeshLambertMaterial({ map: mt, emissiveMap: mt, emissive: 0xfff5df, emissiveIntensity: 0.16 }), rx, ry, zF + 0.11);
        };
        relief(nx, gy + 2.45, 2.15, 1.65, sd < 0 ? 'apollo' : 'athena');
        relief(cx + sd * 10.25, gy + 2.45, 1.65, 1.55, sd < 0 ? 'athena' : 'apollo');

        // Pier masonry mass behind facade + shadowed inner nave wall lined with 5 fluted Corinthian pilasters
        box(mTrav, 5.4, S1 - gy, (zF - FT - 1.15) - zV1b, cx + sd * 8.15, gy + (S1 - gy) / 2, (zF - FT - 1.15 + zV1b) / 2);
        box(mTravD, 0.30, S1 - gy, zF - FT - zV1b, cx + sd * (R1 + 0.15), gy + (S1 - gy) / 2, (zF - FT + zV1b) / 2);
        for (const pz of [zF - FT - 0.45, zF - FT - 1.55, zF - FT - 2.65, zF - FT - 3.75, zV1b + 0.42]) {
          addPilaster(cx + sd * (R1 - 0.12), gy, pz, 7.95, 0.56, false);
        }
        addEntablature(zV1b, zF - FT, cx + sd * R1, gy + 7.95, false, -sd);
      }

      /* ---------- C3. Refined Multi-Part LatheGeometry Marble Statues: Apollo (Left) & Athena (Right) ---------- */
      const _up = new T.Vector3(0, 1, 0);
      function limb(mg, a, b, r0, r1) {
        const va = new T.Vector3(a[0], a[1], a[2]), vb = new T.Vector3(b[0], b[1], b[2]);
        const d = vb.clone().sub(va), L = d.length(); if (L < 1e-4) return;
        const q = new T.Quaternion().setFromUnitVectors(_up, d.normalize());
        mg.add(new T.CylinderGeometry(r1 == null ? r0 : r1, r0, L, 8), new T.Matrix4().compose(va.clone().add(vb).multiplyScalar(0.5), q, new T.Vector3(1, 1, 1)));
        mg.add(new T.SphereGeometry(Math.max(r0, r1 == null ? r0 : r1) * 0.98, 8, 6), new T.Matrix4().makeTranslation(vb.x, vb.y, vb.z));
      }
      const V2 = (pts) => pts.map(([a, b]) => new T.Vector2(a, b));
      function frame(ox, oy, oz, ry, s) {
        const sn = Math.sin(ry), cs = Math.cos(ry);
        const L = (lx, ly, lz) => [ox + (lx * cs + lz * sn) * s, oy + ly * s, oz + (-lx * sn + lz * cs) * s];
        const MR = (lx, ly, lz, rx, rry, rz, sx, sy, sz) => {
          const p = L(lx, ly, lz);
          return new T.Matrix4().compose(
            new T.Vector3(p[0], p[1], p[2]),
            new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry + (rry || 0), rz || 0, 'YXZ')),
            new T.Vector3((sx || 1) * s, (sy || 1) * s, (sz || 1) * s)
          );
        };
        return { L, MR, s };
      }

      function addApollo(ox, oy, oz) {
        const { L, MR, s } = frame(ox, oy, oz, 0, 1.56), m = mStat;
        limb(m, L(0.09, 0.95, 0), L(0.10, 0.50, 0.02), 0.085 * s, 0.07 * s);
        limb(m, L(0.10, 0.50, 0.02), L(0.10, 0.07, 0), 0.065 * s, 0.05 * s);
        limb(m, L(-0.09, 0.95, 0), L(-0.15, 0.52, 0.10), 0.085 * s, 0.07 * s);
        limb(m, L(-0.15, 0.52, 0.10), L(-0.18, 0.08, -0.06), 0.065 * s, 0.05 * s);
        m.add(new T.BoxGeometry(0.10, 0.05, 0.22), MR(0.10, 0.03, 0.05));
        m.add(new T.BoxGeometry(0.10, 0.05, 0.22), MR(-0.18, 0.04, -0.02, 0.28));
        m.add(new T.LatheGeometry(V2([[0.13, 0], [0.16, 0.08], [0.15, 0.20], [0.13, 0.32], [0.155, 0.45], [0.18, 0.55], [0.12, 0.62], [0.05, 0.66], [0, 0.66]]), 14), MR(0, 0.88, 0, 0, 0, 0.05, 1.25, 1, 0.78));
        limb(m, L(0, 1.52, 0), L(0, 1.62, 0.01), 0.05 * s);
        m.add(new T.SphereGeometry(0.10, 12, 10), MR(0, 1.72, 0.01, 0, 0, 0, 0.92, 1.10, 1));
        for (let k = 0; k < 9; k++) {
          const a = (k / 9) * Math.PI * 2;
          m.add(new T.SphereGeometry(0.042, 6, 5), MR(Math.cos(a) * 0.075, 1.79 + Math.sin(a * 2) * 0.01, Math.sin(a) * 0.07 - 0.02));
        }
        m.add(new T.LatheGeometry(V2([[0.20, 0.55], [0.23, 0.90], [0.21, 1.25], [0.19, 1.45], [0.10, 1.53]]), 14, Math.PI * 0.55, Math.PI * 1.05), MR(0, 0, -0.02));
        limb(m, L(-0.22, 1.48, 0), L(-0.28, 1.18, 0.03), 0.05 * s, 0.045 * s);
        limb(m, L(-0.28, 1.18, 0.03), L(-0.25, 0.95, 0.12), 0.042 * s, 0.035 * s);
        limb(m, L(0.22, 1.48, 0), L(0.31, 1.22, 0.08), 0.05 * s, 0.045 * s);
        limb(m, L(0.31, 1.22, 0.08), L(0.25, 1.12, 0.24), 0.042 * s, 0.035 * s);
        // Sculpted Classical Kithara / Lyre
        limb(mBr, L(0.22, 0.98, 0.27), L(0.17, 1.42, 0.27), 0.02 * s);
        limb(mBr, L(0.44, 0.98, 0.27), L(0.49, 1.42, 0.27), 0.02 * s);
        limb(mBr, L(0.15, 1.42, 0.27), L(0.51, 1.42, 0.27), 0.018 * s);
        mBr.add(new T.SphereGeometry(0.16, 12, 8), MR(0.33, 0.98, 0.27, 0, 0, 0, 1, 0.5, 0.3));
        for (let k = 0; k < 5; k++) limb(mGd, L(0.26 + k * 0.035, 1.0, 0.285), L(0.26 + k * 0.035, 1.41, 0.285), 0.004 * s);
      }

      function addAthena(ox, oy, oz) {
        const { L, MR, s } = frame(ox, oy, oz, 0, 1.56), m = mStat;
        m.add(new T.LatheGeometry(V2([[0, 0], [0.27, 0], [0.28, 0.05], [0.25, 0.50], [0.21, 0.95], [0.18, 1.04], [0.215, 1.14], [0.19, 1.24], [0.20, 1.38], [0.215, 1.47], [0.16, 1.55], [0.06, 1.60], [0, 1.60]]), 18), MR(0, 0, 0));
        m.add(new T.LatheGeometry(V2([[0.225, 1.26], [0.235, 1.42], [0.185, 1.53], [0.08, 1.58]]), 16, -Math.PI * 0.6, Math.PI * 1.2), MR(0, 0, 0.005));
        mGd.add(new T.SphereGeometry(0.045, 8, 6), MR(0, 1.38, 0.22));
        limb(m, L(0, 1.58, 0), L(0, 1.66, 0.01), 0.05 * s);
        m.add(new T.SphereGeometry(0.10, 12, 10), MR(0, 1.74, 0.01, 0, 0, 0, 0.92, 1.08, 1));
        m.add(new T.SphereGeometry(0.118, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), MR(0, 1.77, -0.01, 0, 0, 0, 1, 1, 1.08));
        m.add(new T.BoxGeometry(0.035, 0.17, 0.36), MR(0, 1.93, -0.02));
        limb(m, L(-0.12, 1.69, 0.10), L(0.12, 1.69, 0.10), 0.015 * s);
        limb(m, L(-0.22, 1.46, 0), L(-0.37, 1.56, 0.06), 0.05 * s, 0.045 * s);
        limb(m, L(-0.37, 1.56, 0.06), L(-0.42, 1.74, 0.08), 0.042 * s, 0.035 * s);
        // Tall upright antique-bronze spear
        limb(mBr, L(-0.42, 0.02, 0.08), L(-0.42, 2.22, 0.08), 0.014 * s);
        mGd.add(new T.ConeGeometry(0.035, 0.16, 8), MR(-0.42, 2.29, 0.08));
        // Left arm resting on sculpted Medusa Aegis shield
        limb(m, L(0.22, 1.46, 0), L(0.32, 1.15, 0.04), 0.05 * s, 0.045 * s);
        limb(m, L(0.32, 1.15, 0.04), L(0.40, 0.92, 0.10), 0.042 * s, 0.035 * s);
        m.add(new T.CylinderGeometry(0.36, 0.36, 0.05, 24), MR(0.44, 0.52, 0.14, Math.PI / 2, -0.25, 0.08));
        m.add(new T.TorusGeometry(0.33, 0.025, 6, 24), MR(0.44, 0.52, 0.17, 0, -0.25, 0));
        m.add(new T.SphereGeometry(0.10, 10, 8), MR(0.45, 0.52, 0.19, 0, 0, 0, 1, 1, 0.45));
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          limb(m, L(0.45 + Math.cos(a) * 0.08, 0.52 + Math.sin(a) * 0.08, 0.19), L(0.45 + Math.cos(a) * 0.16, 0.52 + Math.sin(a) * 0.16, 0.18), 0.012 * s);
        }
      }
      addApollo(cx - NX, gy + nicheY0 + 0.30, zF - FT - 0.36);
      addAthena(cx + NX, gy + nicheY0 + 0.30, zF - FT - 0.36);

      /* ---------- C4. Vault 1 (Deeply Coffered Lozenge Barrel Vault) ---------- */
      addCofferVault(zF - FT, zV1b, R1, S1, 6, 2.2);
      addRing(mTrav, cx, S1, zV1b - 0.22, R1 - 0.30, R1 + 0.42, 0.62);

      /* ---------- C5. Zone 2: Sunlit Central Crossing, Pendentive Tondo Medallions & Triple Blue-Sky Clerestory Drum ---------- */
      const zXc = (zV1b + zXn) / 2, xLen = zV1b - zXn;
      addArchedWall(mTravEx, cx, gy, zV1b - 0.05, 5.95, DR - gy, R1, S1 - gy, 0.55);
      addArchedWall(mTravEx, cx, gy, zXn - XW, 5.95, DR - gy, R2, S2 - gy, XW);
      addRing(mCap, cx, S2, zXn, R2, R2 + 0.44, 0.14);
      box(mCap, 0.56, 0.98, 0.32, cx, S2 + R2 + 0.22, zXn + 0.06);

      for (const sd of [-1, 1]) {
        // Side transept sunlit opening arches (aligned flush to inner nave x = cx ± 5.45)
        const trX = sd < 0 ? cx - 5.95 : cx + 5.45;
        addArchedWall(mTravEx, trX, gy, zXc, xLen / 2, DR - gy, 2.45, 7.6, 0.50, null, Math.PI / 2);
        addPilaster(cx + sd * (R1 - 0.12), gy, zV1b - 0.55, 7.95, 0.58, false);
        addPilaster(cx + sd * (R1 - 0.12), gy, zXn + 0.55, 7.95, 0.58, false);
        addPilaster(cx + sd * 5.42, gy, zXn + 0.12, 7.65, 0.58, true);
        addEntablature(zXn, zV1b, cx + sd * R1, gy + 7.95, false, -sd);

        // Two Carved Circular Marble Tondo Relief Medallions in the Crossing Pendentive Spandrels
        const tx = cx + sd * 4.35, ty = gy + 12.25;
        mCap.add(new T.TorusGeometry(0.86, 0.11, 8, 28), M(tx, ty, zXn + 0.08));
        const tt = makeTondoTex(sd < 0 ? 'left' : 'right');
        addMesh(new T.CircleGeometry(0.82, 28), new T.MeshLambertMaterial({ map: tt, emissiveMap: tt, emissive: 0xfff5df, emissiveIntensity: 0.18 }), tx, ty, zXn + 0.06);
      }

      // Crossing Drum Cornice Ring + 4 Walls each pierced by TRIPLE ARCHED CLERESTORY WINDOWS (Open Sky Top!)
      box(mCap, 12.4, 0.50, 0.72, cx, DR + 0.25, zXn - 0.05);
      box(mCap, 12.4, 0.50, 0.72, cx, DR + 0.25, zV1b + 0.05);
      box(mCap, 0.72, 0.50, xLen + 0.85, cx - 5.85, DR + 0.25, zXc);
      box(mCap, 0.72, 0.50, xLen + 0.85, cx + 5.85, DR + 0.25, zXc);

      const drumH = 3.85, winHoles = (sp) => [-sp, 0, sp].map((wx) => archHole(wx, 0.35, 1.28, 3.05));
      addFlatWall(mTravEx, cx, DR + 0.50, zXn - 0.55, 6.0, drumH, 0.55, winHoles(1.85));
      addFlatWall(mTravEx, cx, DR + 0.50, zV1b - 0.05, 6.0, drumH, 0.55, winHoles(1.85));
      addFlatWall(mTravEx, cx - 6.05, DR + 0.50, zXc, xLen / 2 + 0.12, drumH, 0.55, winHoles(1.85), Math.PI / 2);
      addFlatWall(mTravEx, cx + 5.50, DR + 0.50, zXc, xLen / 2 + 0.12, drumH, 0.55, winHoles(1.85), Math.PI / 2);

      // Upper Drum Parapet Cornice Rim (leaving center 100% open to real sky!)
      box(mCap, 12.8, 0.42, 0.82, cx, DR + 0.50 + drumH + 0.21, zXn - 0.28);
      box(mCap, 12.8, 0.42, 0.82, cx, DR + 0.50 + drumH + 0.21, zV1b + 0.22);
      box(mCap, 0.82, 0.42, xLen + 1.15, cx - 5.85, DR + 0.50 + drumH + 0.21, zXc);
      box(mCap, 0.82, 0.42, xLen + 1.15, cx + 5.85, DR + 0.50 + drumH + 0.21, zXc);
      for (const [px, pz] of [[-5.85, zXn - 0.28], [5.85, zXn - 0.28], [-5.85, zV1b + 0.22], [5.85, zV1b + 0.22]]) {
        box(mCap, 0.88, drumH, 0.88, cx + px, DR + 0.50 + drumH / 2, pz);
      }

      /* ---------- C6. Zone 3: Middle Receding Coffered Barrel Vault (Vault 2) ---------- */
      addCofferVault(zV2f, zV2b, R2, S2, 6, 2.3);
      addRing(mTrav, cx, S2, zV2b - 0.28, R2 - 0.28, R2 + 0.40, 0.58);
      for (const sd of [-1, 1]) {
        box(mTravD, 0.30, S2 - gy, zV2f - zV2b, cx + sd * (R2 + 0.15), gy + (S2 - gy) / 2, (zV2f + zV2b) / 2);
        for (const pz of [zV2f - 0.55, zV2f - 1.85, zV2f - 3.15, zV2b + 0.42]) {
          addPilaster(cx + sd * (R2 - 0.12), gy + 1.0, pz, 6.75, 0.54, false);
        }
        addEntablature(zV2b, zV2f, cx + sd * R2, gy + 7.55, false, -sd);
      }

      /* ---------- C7. Zone 4: Sunlit Open-Sky Courtyard Gap + Distant 3rd Triumphal Arch ---------- */
      for (const sd of [-1, 1]) {
        const holes = [archHole(-1.6, 1.35, 1.65, 4.4), archHole(1.6, 1.35, 1.65, 4.4)];
        const cwX = sd < 0 ? cx - R2 - 0.42 : cx + R2;
        addFlatWall(mTravEx, cwX, gy, (zV2b + zA3f) / 2, (zV2b - zA3f) / 2, S2 - gy, 0.42, holes, Math.PI / 2);
        box(mCap, 0.70, 0.28, zV2b - zA3f, cx + sd * (R2 + 0.12), S2 + 0.14, (zV2b + zA3f) / 2);
        for (const pz of [zV2b - 0.32, (zV2b + zA3f) / 2, zA3f + 0.32]) addPilaster(cx + sd * (R2 - 0.10), gy + 1.0, pz, S2 - gy - 1.3, 0.46, false);
      }
      // Distant 3rd Triumphal Arch (opening cleanly to pure sunlit Aegean sky!)
      addArchedWall(mTravEx, cx, gy + 1.0, zA3b, 5.70, 9.8, 4.10, 4.75, zA3f - zA3b);
      addRing(mCap, cx, gy + 5.75, zA3f, 4.10, 4.52, 0.14);
      box(mCap, 0.52, 0.92, 0.30, cx, gy + 5.75 + 4.32, zA3f + 0.08);
      for (const px of [-4.85, 4.85]) addPilaster(cx + px, gy + 1.0, zA3f + 0.12, 8.1, 0.54, true);
      addEntablature(cx - 5.7, cx + 5.7, zA3f, gy + 9.2, true, 1);
      box(mCap, 12.1, 0.32, 2.25, cx, gy + 10.95, (zA3f + zA3b) / 2);
      for (let k = -9; k <= 9; k++) mCap.add(cyl(0.07, 0.09, 0.76, 8), M(cx + k * 0.44, daisY + 0.38, zA3b - 1.0));
      box(mCap, 8.6, 0.12, 0.26, cx, daisY + 0.80, zA3b - 1.0);

      /* ---------- C8. Grand 4-Step Full-Width White-Marble Staircase & Inlaid Opus Sectile Floors ---------- */
      for (let k = 1; k <= 4; k++) {
        const h = k * 0.255, front = zStep + (5 - k) * 0.65;
        box(mTravD, 15.8, h, front - zStep, cx, gy + h / 2, (front + zStep) / 2);
        box(mCap, 15.9, 0.06, 0.12, cx, gy + h - 0.03, front + 0.02);
      }
      for (let k = 1; k <= 4; k++) {
        const front = zStep + (5 - k) * 0.65, back = k === 4 ? zA3b - 1.2 : zStep + (4 - k) * 0.65;
        const wFloor = k === 4 ? 11.4 : 15.8;
        const tex = k === 4 ? bandTex.clone() : null;
        if (k === 4) { tex.needsUpdate = true; tex.repeat.set(3.2, (front - back) / 2.2); }
        const mat = k === 4 ? new T.MeshLambertMaterial({ map: tex, emissive: 0x1a160f }) : pentelicMat;
        addMesh(new T.PlaneGeometry(wFloor, front - back), mat, cx, gy + k * 0.255 + 0.008, (front + back) / 2, -Math.PI / 2);
      }
      const floorPlane = (w, d, px, pz) => {
        const t = opusTex.clone(); t.needsUpdate = true; t.repeat.set(w / 2.8, d / 2.8);
        return addMesh(new T.PlaneGeometry(w, d), new T.MeshLambertMaterial({ map: t, emissive: 0x15120d }), px, gy + 0.025, pz, -Math.PI / 2);
      };
      floorPlane(21.6, zF - zStep - 2.6, cx, (zF + zStep + 2.6) / 2);
      floorPlane(28.0, 9.0, cx, zF + 4.5);

      /* ---------- C9. 360° Exterior Basilica Envelope: Side Aisles, Terracotta Vault Roofs & Classical Pediment ---------- */
      const zE0 = zV2b - 0.5, zE1 = zF - FT, eL = zE1 - zE0, eC = (zE0 + zE1) / 2;
      for (const sd of [-1, 1]) {
        const wins = [-5.0, 0, 5.0].map((wx) => archHole(wx, 1.8, 1.7, 5.0));
        const oxWall = sd < 0 ? cx - 11.4 : cx + 10.8;
        addFlatWall(mTravEx, oxWall, gy, eC, eL / 2, 9.6, 0.60, wins, Math.PI / 2);
        for (const wz of [-7.4, -2.5, 2.5, 7.4]) addPilaster(cx + sd * 11.46, gy, eC + wz, 8.9, 0.58, false);
        box(mCap, 1.15, 0.34, eL + 0.9, cx + sd * 11.1, gy + 9.6, eC);
        box(mTrav, 5.8, 0.30, eL, cx + sd * 8.35, gy + 9.65, eC);
        for (let t = 0.3; t < eL; t += 0.52) mCap.add(cyl(0.06, 0.08, 0.55, 8), M(cx + sd * 11.25, gy + 10.1, zE0 + t));
        box(mCap, 0.24, 0.10, eL, cx + sd * 11.25, gy + 10.42, eC);
      }
      addArchedWall(mTravEx, cx, gy, zE0, 11.2, 13.6, R2, S2 - gy, 0.55);

      // Exterior Ribbed Terracotta Barrel Roofs — strictly over Vault 1 & Vault 2 ONLY (Crossing & Courtyard stay 100% open to sky!)
      const roofCyl = (rr, z0r, z1r, sy) => {
        const t = greekTileTex.clone(); t.needsUpdate = true; t.repeat.set(10, (z0r - z1r) / 1.2);
        return addMesh(new T.CylinderGeometry(rr, rr, z0r - z1r, 28, 1, true, -Math.PI / 2, Math.PI), new T.MeshLambertMaterial({ map: t, side: T.DoubleSide }), cx, sy, (z0r + z1r) / 2, -Math.PI / 2, 0, 0, true);
      };
      roofCyl(R1 + 0.78, zF - FT, zV1b - 0.1, S1);
      roofCyl(R2 + 0.74, zV2f + 0.1, zE0, S2);

      // Front Exterior Attic Entablature, Incised Roman Frieze & Classical Pediment Crown (above interior camera view)
      box(mCap, 26.8, 0.40, 1.45, cx, gy + 14.55, zF + 0.55);
      box(mTrav, 21.0, 1.05, 1.15, cx, gy + 15.25, zF + 0.45);
      {
        const it = makeGreekArchitraveTex('SCHOLA ATHENIENSIS  ·  雅 典 学 院  ·  ΜΗΔΕΙΣ ΑΓΕΩΜΕΤΡΗΤΟΣ ΕΙΣΙΤΩ');
        addMesh(new T.PlaneGeometry(14.6, 0.88), new T.MeshLambertMaterial({ map: it, emissiveMap: it, emissive: 0xffffff, emissiveIntensity: 0.22 }), cx, gy + 15.25, zF + 1.06);
        const ps = new T.Shape(); ps.moveTo(-11.2, 0); ps.lineTo(11.2, 0); ps.lineTo(0, 2.55); ps.closePath();
        mTravEx.add(extrude(ps, 1.10, 4), M(cx, gy + 15.80, zF - 0.10));
        box(mCap, 22.8, 0.28, 1.42, cx, gy + 15.90, zF + 0.48);
        const ang = Math.atan2(2.55, 11.2), rl = Math.hypot(11.2, 2.55);
        for (const sd of [-1, 1]) mCap.add(new T.BoxGeometry(rl + 0.4, 0.28, 1.42), M(cx + sd * 5.6, gy + 15.80 + 1.32, zF + 0.48, 0, 0, -sd * ang));
        mCap.add(new T.SphereGeometry(0.38, 12, 8), M(cx, gy + 18.55, zF + 0.45));
        mCap.add(new T.ConeGeometry(0.26, 0.72, 10), M(cx, gy + 19.02, zF + 0.45));
      }

      /* ---------- C10. Soft Painterly Raphael Cumulus Clouds High in the Northern Sky ---------- */
      [[-10, 10, -76, 30, 10, 11], [10, 7, -84, 26, 9, 12], [0, 26, -86, 36, 13, 13], [-18, 30, -72, 28, 11, 14], [18, 22, -90, 32, 11, 15]].forEach(([dx, dy, dz, w, h, sd]) => {
        const mat = new T.MeshBasicMaterial({ map: makeCloudTex(sd), transparent: true, depthWrite: false, fog: false, opacity: 0.82 });
        const m = new T.Mesh(new T.PlaneGeometry(w, h), mat);
        m.position.set(cx + dx, gy + dy, cz + dz); m.renderOrder = -5;
        group.add(m); made.meshes++;
        saClouds.push(mat);
      });

      /* ---------- C11. Refined Sculpted Renaissance Philosopher Tableau (Sightline-Pure!) ---------- */
      const SKIN = 0xe0b48e;
      const TUNIC = V2([[0, 0], [0.20, 0], [0.235, 0.04], [0.225, 0.45], [0.20, 0.85], [0.18, 1.0], [0.20, 1.20], [0.215, 1.33], [0.17, 1.42], [0.07, 1.47], [0, 1.47]]);
      const CLOAK = V2([[0.258, 0.16], [0.258, 0.50], [0.238, 0.90], [0.222, 1.12], [0.242, 1.30], [0.205, 1.43], [0.10, 1.49]]);

      function head(F, hair, beard, longBeard) {
        const { L, MR, s } = F;
        limb(FM(SKIN), L(0, 1.45, 0), L(0, 1.56, 0.01), 0.055 * s);
        FM(SKIN).add(new T.SphereGeometry(0.105, 12, 10), MR(0, 1.63, 0.01, 0, 0, 0, 0.92, 1.08, 1));
        FM(SKIN).add(new T.BoxGeometry(0.03, 0.05, 0.04), MR(0, 1.62, 0.11));
        FM(hair).add(new T.SphereGeometry(0.112, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), MR(0, 1.65, -0.02, -0.25, 0, 0, 1, 1, 1.02));
        if (beard) FM(hair).add(longBeard ? new T.ConeGeometry(0.08, 0.26, 10) : new T.SphereGeometry(0.075, 10, 8), longBeard ? MR(0, 1.45, 0.07, Math.PI, 0, 0) : MR(0, 1.54, 0.065, 0, 0, 0, 1, 1.25, 0.75));
      }
      function arm(F, col, side, el, hand) {
        const { L, s } = F;
        limb(FM(col), L(side * 0.20, 1.36, 0), L(el[0], el[1], el[2]), 0.058 * s, 0.05 * s);
        limb(FM(SKIN), L(el[0], el[1], el[2]), L(hand[0], hand[1], hand[2]), 0.04 * s, 0.035 * s);
      }
      function addFigure(o) {
        const F = frame(o.x, o.y, o.z, o.ry || 0, o.s || 1), { MR, L } = F;
        FM(o.tunic).add(new T.LatheGeometry(TUNIC, 16), MR(0, 0, 0));
        FM(o.cloak).add(new T.LatheGeometry(CLOAK, 16, (o.cloakRot || 0) + Math.PI * 0.3, Math.PI * 1.45), MR(0, 0, 0));
        head(F, o.hair, o.beard !== false, o.longBeard);
        const P = o.pose || 'down';
        if (P === 'up') {
          arm(F, o.tunic, -1, [-0.27, 1.60, 0.06], [-0.24, 1.88, 0.04]);
          limb(FM(SKIN), L(-0.24, 1.90, 0.04), L(-0.24, 2.04, 0.04), 0.014 * F.s);
          arm(F, o.cloak, 1, [0.27, 1.08, 0.08], [0.20, 0.98, 0.18]);
          FM(0x8a5a2c).add(new T.BoxGeometry(0.06, 0.32, 0.22), MR(0.20, 1.02, 0.22, 0, 0, 0.10));
        } else if (P === 'forward') {
          arm(F, o.cloak, -1, [-0.30, 1.28, 0.24], [-0.34, 1.26, 0.52]);
          FM(SKIN).add(new T.BoxGeometry(0.11, 0.025, 0.13), MR(-0.34, 1.25, 0.58));
          arm(F, o.cloak, 1, [0.30, 1.10, 0.10], [0.25, 1.02, 0.20]);
          FM(0x6b4a2a).add(new T.BoxGeometry(0.07, 0.34, 0.24), MR(0.27, 1.00, 0.20, 0.50, 0, 0));
        } else if (P === 'debate') {
          arm(F, o.cloak, -1, [-0.26, 1.12, 0.12], [-0.10, 1.18, 0.32]);
          arm(F, o.tunic, 1, [0.26, 1.12, 0.12], [0.12, 1.20, 0.30]);
        } else if (P === 'globe') {
          arm(F, o.cloak, -1, [-0.26, 1.10, 0.14], [-0.14, 1.12, 0.30]);
          arm(F, o.tunic, 1, [0.26, 1.10, 0.14], [0.14, 1.12, 0.30]);
          FM(o.globe).add(new T.SphereGeometry(0.17, 14, 10), MR(0, 1.20, 0.37));
          mGd.add(new T.TorusGeometry(0.19, 0.012, 6, 24), MR(0, 1.20, 0.37, 0.6, 0, 0.3));
        } else if (P === 'book') {
          arm(F, o.cloak, -1, [-0.26, 1.10, 0.12], [-0.08, 1.20, 0.26]);
          arm(F, o.tunic, 1, [0.26, 1.10, 0.12], [0.10, 1.20, 0.26]);
          FM(0xf1e6c8).add(new T.BoxGeometry(0.30, 0.03, 0.22), MR(0, 1.22, 0.30, -0.5, 0, 0));
        } else {
          arm(F, o.cloak, -1, [-0.27, 1.10, 0.03], [-0.25, 0.88, 0.08]);
          arm(F, o.tunic, 1, [0.27, 1.10, 0.03], [0.25, 0.88, 0.08]);
        }
      }
      function addSeated(o) {
        const F = frame(o.x, o.y, o.z, o.ry || 0, o.s || 1), { MR, L, s } = F;
        FM(o.tunic).add(new T.LatheGeometry(V2([[0.20, 0], [0.22, 0.15], [0.20, 0.50], [0.215, 0.72], [0.17, 0.82], [0.07, 0.87], [0, 0.87]]), 14), MR(0, 0.50, 0.04, 0.18, 0, 0));
        FM(o.cloak).add(new T.LatheGeometry(CLOAK, 14, Math.PI * 0.4, Math.PI * 1.2), MR(0, -0.05, -0.02, 0.18, 0, 0, 1.05, 0.95, 1.05));
        for (const sx of [-1, 1]) {
          limb(FM(o.cloak), L(sx * 0.10, 0.55, 0.05), L(sx * 0.12, 0.55, 0.48), 0.095 * s);
          limb(FM(o.tunic), L(sx * 0.12, 0.55, 0.48), L(sx * 0.13, 0.06, 0.52), 0.07 * s, 0.06 * s);
          FM(SKIN).add(new T.BoxGeometry(0.09, 0.05, 0.20), MR(sx * 0.13, 0.03, 0.60));
        }
        const hF = frame(L(0, 0, 0.18)[0], o.y - 0.12 * s, L(0, 0, 0.18)[2], o.ry || 0, s);
        head(hF, o.hair, true, false);
        arm(F, o.cloak, -1, [-0.18, 0.98, 0.42], [-0.07, 1.34, 0.26]);
        arm(F, o.tunic, 1, [0.27, 0.98, 0.30], [0.20, 0.86, 0.60]);
        if (o.desk) {
          box(mTrav, 0.90, 0.82, 0.60, L(0.10, 0, 0.82)[0], o.y + 0.41 * s, L(0.10, 0, 0.82)[2], o.ry || 0);
          FM(0xf1e6c8).add(new T.BoxGeometry(0.40, 0.03, 0.30), MR(0.12, 0.85, 0.78, 0, 0.2, 0));
        }
        box(mTrav, 0.62, 0.48, 0.55, L(0, 0, -0.02)[0], o.y + 0.24 * s, L(0, 0, -0.02)[2], o.ry || 0);
      }

      // Upper Dais Center Focal Point: Plato (pointing UP) & Aristotle (palm forward) framed against Distant Arch 3 & Blue Sky!
      addFigure({ x: cx - 0.72, y: daisY, z: cz + 2.1, ry: 0.14, cloak: 0xb8493c, tunic: 0x7a6880, hair: 0xe8e4dc, longBeard: true, pose: 'up', s: 1.14 });
      addFigure({ x: cx + 0.72, y: daisY, z: cz + 2.1, ry: -0.14, cloak: 0x3f78b0, tunic: 0xa47a3e, hair: 0x5a4030, pose: 'forward', s: 1.14 });
      // Flanking Scholars on the Dais
      addFigure({ x: cx - 2.4, y: daisY, z: cz + 2.1, ry: 0.55, cloak: 0x5f7d45, tunic: 0xd8c39a, hair: 0x6b5638, pose: 'debate' });
      addFigure({ x: cx - 3.6, y: daisY, z: cz + 1.4, ry: 0.85, cloak: 0x6b7d3a, tunic: 0xcbb98f, hair: 0xb8b2a6, pose: 'down' });
      addFigure({ x: cx + 2.5, y: daisY, z: cz + 2.0, ry: -0.55, cloak: 0xd89224, tunic: 0x9a4a3a, hair: 0xd9d4ca, pose: 'down' });
      addFigure({ x: cx + 3.6, y: daisY, z: cz + 1.2, ry: -0.95, cloak: 0xa8322e, tunic: 0x4a6a8a, hair: 0x4a3a2a, pose: 'debate' });

      // Diogenes reclining diagonally on the White-Marble Steps
      {
        const F = frame(cx + 1.85, gy + 0.51, zStep + 1.35, -0.25, 1), { L, MR, s } = F, col = 0x6b9ad0;
        FM(col).add(new T.SphereGeometry(0.30, 12, 10), MR(0.05, 0.20, 0, 0, 0, 0, 1.3, 0.55, 0.85));
        limb(FM(col), L(0, 0.22, 0), L(-0.55, 0.48, -0.08), 0.17 * s, 0.15 * s);
        FM(SKIN).add(new T.SphereGeometry(0.10, 10, 8), MR(-0.74, 0.60, -0.08));
        FM(0xcfcac0).add(new T.SphereGeometry(0.105, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), MR(-0.75, 0.63, -0.10, 0, 0, 0.4));
        limb(FM(SKIN), L(0.10, 0.22, 0.05), L(0.50, 0.36, 0.15), 0.08 * s);
        limb(FM(SKIN), L(0.50, 0.36, 0.15), L(0.92, 0.0, 0.25), 0.06 * s);
        limb(FM(SKIN), L(0.10, 0.22, -0.05), L(0.55, 0.12, -0.12), 0.08 * s);
        limb(FM(SKIN), L(0.55, 0.12, -0.12), L(0.95, -0.20, -0.10), 0.06 * s);
        limb(FM(SKIN), L(-0.55, 0.46, -0.10), L(-0.48, 0.12, 0.12), 0.045 * s);
        limb(FM(SKIN), L(-0.50, 0.48, 0.05), L(-0.20, 0.50, 0.28), 0.04 * s);
        FM(0xf1e6c8).add(new T.BoxGeometry(0.22, 0.02, 0.30), MR(-0.12, 0.52, 0.32, 0.3, 0, 0));
        mBr.add(new T.CylinderGeometry(0.11, 0.07, 0.08, 12), MR(0.60, -0.22, 0.45));
      }

      // Foreground Left Wing (clear of central sightline!): Heraclitus & Pythagoras
      addSeated({ x: cx - 3.4, y: gy, z: zF - 1.7, ry: 0.38, cloak: 0x8a5a8c, tunic: 0xb98a4a, hair: 0x2c2018, desk: true });
      addSeated({ x: cx - 5.9, y: gy, z: zF - 1.2, ry: 0.78, cloak: 0xc8962e, tunic: 0xe8e0cc, hair: 0xd8d2c6 });
      box(mTravD, 0.70, 0.90, 0.06, cx - 5.0, gy + 0.55, zF - 0.6, 0.75);

      // Foreground Right Wing (clear of central sightline!): Euclid, Zoroaster & Ptolemy
      {
        const F = frame(cx + 4.8, gy, zF - 1.6, -0.45, 1), { L, MR, s } = F;
        FM(0xe2d4b0).add(new T.LatheGeometry(V2([[0, 0], [0.20, 0], [0.22, 0.04], [0.20, 0.50], [0.17, 0.78], [0, 0.80]]), 14), MR(0, 0, 0));
        limb(FM(0xb03a2e), L(0, 0.75, 0), L(0, 1.12, 0.38), 0.18 * s, 0.17 * s);
        FM(SKIN).add(new T.SphereGeometry(0.10, 10, 8), MR(0, 1.20, 0.56));
        FM(0xd8d2c6).add(new T.SphereGeometry(0.105, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), MR(0, 1.23, 0.53, 0.9, 0, 0));
        for (const sx of [-1, 1]) {
          limb(FM(0xb03a2e), L(sx * 0.18, 1.10, 0.36), L(sx * 0.12, 0.60, 0.60), 0.055 * s);
          limb(FM(SKIN), L(sx * 0.12, 0.60, 0.60), L(sx * 0.06, 0.16, 0.74), 0.04 * s);
        }
        FM(0x2c3540).add(new T.BoxGeometry(0.72, 0.04, 0.54), MR(0, 0.02, 0.85));
        limb(mGd, L(0.02, 0.05, 0.80), L(0.12, 0.30, 0.85), 0.008 * s);
        limb(mGd, L(0.22, 0.05, 0.85), L(0.12, 0.30, 0.85), 0.008 * s);
        mGd.add(new T.TorusGeometry(0.14, 0.006, 4, 24), MR(-0.12, 0.045, 0.85, Math.PI / 2, 0, 0));
      }
      addFigure({ x: cx + 6.7, y: gy, z: zF - 1.9, ry: -0.9, cloak: 0x5d6b3a, tunic: 0xe8e0cc, hair: 0x9a9a9a, pose: 'globe', globe: 0x2a4a7a });
      addFigure({ x: cx + 7.6, y: gy, z: zF - 1.1, ry: -2.4, cloak: 0xd4a020, tunic: 0x4a6a3a, hair: 0x3a2a1a, pose: 'globe', globe: 0x6a8a5a, beard: false });
      FM(0xc9a353).add(new T.CylinderGeometry(0.13, 0.12, 0.08, 10), M(cx + 7.6, gy + 1.82, zF - 1.1));

      /* ---------- Flush Merged Basilica Meshes ---------- */
      const sh = (m) => { if (m) { m.castShadow = true; m.receiveShadow = true; } };
      sh(mTrav.mesh(travMat)); sh(mTravEx.mesh(travExMat)); sh(mTravD.mesh(travDMat)); sh(mNiche.mesh(nicheMat));
      sh(mPil.mesh(pilMat)); sh(mCap.mesh(capMat)); sh(mStat.mesh(statueMat)); sh(mShell.mesh(shellMat));
      sh(mBr.mesh(bronzeMat)); sh(mGd.mesh(goldMat));
      for (const hex in figM) {
        sh(figM[hex].mesh(new T.MeshLambertMaterial({ color: +hex, emissive: new T.Color(+hex).multiplyScalar(0.12), side: T.DoubleSide })));
      }
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
      addSweepingOrientalRoof(x - w * 0.31, z, w * 0.18, 1.15, y + 5.05, 0.95, imperialTileMat, true, false, mRidgeGold, true);
      addSweepingOrientalRoof(x + w * 0.31, z, w * 0.18, 1.15, y + 5.05, 0.95, imperialTileMat, true, false, mRidgeGold, true);
      // Hang ceremonial red silk lanterns cleanly on the far outer eaves of the Paifang (zero overlap with calligraphy!)
      for (const lx of [x - w * 0.50, x + w * 0.50]) {
        mVermilion.add(cyl(0.025, 0.025, 0.55, 6), M(lx, y + 4.95, z + 0.55));
        mLanternRed.add(sph(0.28), M(lx, y + 4.50, z + 0.55, 0, 0, 0, 1.0, 1.25, 1.0));
        mOrGold.add(cyl(0.12, 0.12, 0.09, 8), M(lx, y + 4.84, z + 0.55));
        mOrGold.add(cyl(0.10, 0.10, 0.09, 8), M(lx, y + 4.16, z + 0.55));
      }
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

    // ───────── Annex island (社会科学岛): a roof feature and a front-yard landmark for each of the 13 halls ─────────
    (P.eraLandmarks || []).forEach((EL) => {
      if (!/^ax_/.test(EL.kind)) return;
      const { x, y, z, cz, x0, x1, z1 } = EL, id = EL.kind.slice(3), E = x + 5, Wx = x - 5, R = y + 11.6, fz = z1 + 1.2;
      const box = (w, h, d) => new T.BoxGeometry(w, h, d);
      const plinth = (px, pz, r, h) => mEraWhite.add(cyl(r, r * 1.15, h, 16), M(px, y + h / 2, pz));
      const portico = (n) => { for (let i = 0; i < n; i++) { const dx = -3.3 + i * 6.6 / (n - 1); mEraWhite.add(cyl(0.28, 0.32, 5.4, 12), M(x + dx, y + 2.7, fz + 1.2)); } mEraWhite.add(box(8.2, 0.5, 2.2), M(x, y + 5.9, fz + 0.5)); mEraWhite.add(cyl(0.02, 4.4, 1.7, 3), M(x, y + 7.0, fz + 0.5, 0, Math.PI / 2, 0, 0.5, 1, 1)); };
      const belfry = (m) => { mEraWhite.add(box(1.8, 1.4, 1.8), M(x, R + 0.5, cz)); [[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]].forEach(([dx, dz]) => mEraWhite.add(box(0.18, 1.5, 0.18), M(x + dx, R + 1.95, cz + dz))); mEraGold.add(cyl(0.2, 0.5, 0.65, 12), M(x, R + 1.9, cz)); m.add(cyl(0.02, 1.5, 1.5, 4), M(x, R + 3.45, cz, 0, Math.PI / 4, 0)); };
      const lantern = () => { mEraGlass.add(box(11.0, 1.5, 2.6), M(x, R + 0.3, cz)); for (let px = -5; px <= 5; px += 2.5) mEraWhite.add(box(0.14, 1.6, 2.7), M(x + px, R + 0.3, cz)); mEraWhite.add(box(11.3, 0.14, 2.9), M(x, R + 1.1, cz)); };
      const globe = () => { mEraWhite.add(box(3.0, 2.2, 3.0), M(x, R - 0.4, cz)); mEraGold.add(sph(1.5), M(x, R + 2.0, cz)); for (let i = 0; i < 4; i++) mEraGold.add(torus(1.56, 0.05), M(x, R + 2.0, cz, 0, i * Math.PI / 4, 0)); };
      const stepG = () => { [[5.0, 0], [3.6, 1.1], [2.2, 2.2]].forEach(([w, dy]) => mEraWhite.add(box(w, 1.1, 0.5), M(x, y + 6.6 + dy, fz - 0.6))); mEraGold.add(sph(0.22), M(x, y + 10.2, fz - 0.6)); };
      const turrets = () => { [x0 + 0.5, x1 + 0.5].forEach((px) => { mEraWhite.add(cyl(1.0, 1.05, 9.0, 8), M(px, y + 4.5, z1 + 0.5)); mEraRed.add(cyl(0.02, 1.15, 1.6, 8), M(px, y + 9.8, z1 + 0.5)); }); };
      if (id === 'smith_ricardo') { portico(4);        // a pin-maker's bench and a merchant ship: division of labour and trade
        mDarkTimber.add(box(2.6, 0.12, 0.9), M(E, y + 0.9, z)); [[-1.1, -0.35], [1.1, -0.35], [-1.1, 0.35], [1.1, 0.35]].forEach(([dx, dz]) => mDarkTimber.add(box(0.12, 0.9, 0.12), M(E + dx, y + 0.45, z + dz))); for (let i = 0; i < 6; i++) mEraGold.add(cyl(0.02, 0.02, 0.35, 5), M(E - 1 + i * 0.4, y + 1.15, z));
        mDarkTimber.add(box(2.4, 0.5, 0.8), M(Wx, y + 0.9, z)); mDarkTimber.add(cyl(0.05, 0.05, 2.6, 6), M(Wx, y + 2.3, z)); mEraWhite.add(box(1.4, 1.6, 0.05), M(Wx + 0.1, y + 2.6, z)); plinth(Wx, z, 0.7, 0.6);
      } else if (id === 'keynes_friedman') {          // a fountain whose water goes round and round: the circular flow
        mEraWhite.add(cyl(2.4, 2.5, 0.5, 24), M(E - 1, y + 0.25, z)); mEraGlass.add(cyl(2.2, 2.2, 0.1, 24), M(E - 1, y + 0.52, z)); mEraWhite.add(cyl(0.3, 0.4, 1.8, 12), M(E - 1, y + 1.2, z)); mEraWhite.add(cyl(1.0, 0.3, 0.3, 16), M(E - 1, y + 2.2, z)); mEraGlass.add(sph(0.45), M(E - 1, y + 2.7, z));
        plinth(Wx, z, 0.5, 1.0); for (let i = 0; i < 5; i++) mEraGold.add(cyl(0.45, 0.45, 0.09, 16), M(Wx, y + 1.05 + i * 0.1, z));
      } else if (id === 'hayek_schumpeter') { globe();   // a signal mast with a price flag, and a broken old wheel beside a new gear
        mDarkTimber.add(cyl(0.08, 0.12, 5.5, 8), M(E, y + 2.75, z)); mEraRed.add(box(1.2, 0.7, 0.05), M(E + 0.65, y + 5.0, z)); mEraGold.add(sph(0.2), M(E, y + 5.6, z));
        mDarkTimber.add(torus(0.8, 0.08), M(Wx - 0.6, y + 0.5, z, 1.2, 0, 0.3)); mEraGold.add(torus(0.9, 0.12), M(Wx + 0.8, y + 1.2, z)); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; mEraGold.add(box(0.25, 0.25, 0.2), M(Wx + 0.8 + Math.cos(a) * 1.05, y + 1.2 + Math.sin(a) * 1.05, z, 0, 0, a)); }
      } else if (id === 'nash') {                      // a giant chessboard with pieces: strategy
        for (let i = 0; i < 16; i++) ((i + Math.floor(i / 4)) % 2 ? mDarkTimber : mEraWhite).add(box(1.0, 0.12, 1.0), M(E - 2.5 + (i % 4), y + 0.06, z - 1.2 + Math.floor(i / 4)));
        [[0, 0, mEraWhite], [3, 3, mDarkTimber], [1, 2, mEraGold]].forEach(([a, b, m]) => { m.add(cyl(0.18, 0.3, 0.9, 10), M(E - 2.5 + a, y + 0.55, z - 1.2 + b)); m.add(sph(0.2), M(E - 2.5 + a, y + 1.1, z - 1.2 + b)); });
      } else if (id === 'simon_kahneman') { lantern();  // a hedge maze: searching until "good enough"
        for (let i = 0; i < 4; i++) { const r = 0.7 + i * 0.6; mDarkTimber.add(box(r * 2, 0.7, 0.2), M(E - 1, y + 0.35, z - r)); mDarkTimber.add(box(0.2, 0.7, r * 2), M(E - 1 + r, y + 0.35, z)); if (i % 2) mDarkTimber.add(box(r * 2, 0.7, 0.2), M(E - 1, y + 0.35, z + r)); else mDarkTimber.add(box(0.2, 0.7, r * 2), M(E - 1 - r, y + 0.35, z)); } mEraGold.add(sph(0.25), M(E - 1, y + 0.5, z));
      } else if (id === 'durkheim_weber') { turrets();  // a totem pole and an iron cage
        for (let i = 0; i < 4; i++) { (i % 2 ? mEraRed : mEraGold).add(box(0.8, 0.9, 0.8), M(E, y + 0.45 + i * 0.9, z)); } mDarkTimber.add(box(2.0, 0.2, 0.3), M(E, y + 3.0, z));
        for (let i = 0; i < 6; i++) { mDarkTimber.add(cyl(0.04, 0.04, 2.2, 5), M(Wx - 0.9 + i * 0.36, y + 1.1, z + 0.9)); mDarkTimber.add(cyl(0.04, 0.04, 2.2, 5), M(Wx - 0.9 + i * 0.36, y + 1.1, z - 0.9)); mDarkTimber.add(cyl(0.04, 0.04, 2.2, 5), M(Wx - 0.9, y + 1.1, z - 0.9 + i * 0.36)); mDarkTimber.add(cyl(0.04, 0.04, 2.2, 5), M(Wx + 0.9, y + 1.1, z - 0.9 + i * 0.36)); } mDarkTimber.add(box(2.0, 0.1, 2.0), M(Wx, y + 2.25, z));
      } else if (id === 'simmel_mead') { stepG();       // three figures in a triangle, and a standing mirror
        [[0, -1], [-0.9, 0.6], [0.9, 0.6]].forEach(([dx, dz], i) => { [mEraGold, mEraWhite, mEraRed][i].add(cyl(0.12, 0.3, 1.1, 10), M(E + dx, y + 0.55, z + dz)); [mEraGold, mEraWhite, mEraRed][i].add(sph(0.22), M(E + dx, y + 1.3, z + dz)); });
        mDarkTimber.add(box(1.5, 2.6, 0.12), M(Wx, y + 1.5, z)); mEraGlass.add(box(1.25, 2.3, 0.06), M(Wx, y + 1.5, z + 0.08));
      } else if (id === 'granovetter') {               // a little network of poles joined by rope bridges
        const N = [[E - 2.5, z - 1], [E - 0.5, z + 1.2], [E + 1, z - 0.8], [Wx - 1, z + 0.5], [Wx + 1.2, z - 0.6]];
        N.forEach(([px, pz]) => { mDarkTimber.add(cyl(0.07, 0.1, 2.6, 8), M(px, y + 1.3, pz)); mEraGold.add(sph(0.22), M(px, y + 2.7, pz)); });
        [[0, 1], [1, 2], [0, 2], [3, 4], [1, 4]].forEach(([a, b]) => { const dx = N[b][0] - N[a][0], dz = N[b][1] - N[a][1], L = Math.hypot(dx, dz); (a === 1 && b === 4 ? mEraGold : mDarkTimber).add(cyl(0.025, 0.025, L, 5), M((N[a][0] + N[b][0]) / 2, y + 2.6, (N[a][1] + N[b][1]) / 2, 0, -Math.atan2(dz, dx), Math.PI / 2)); });
      } else if (id === 'olson_putnam') { portico(6);   // a bowling lane with ten pins and one lonely ball
        mEraWhite.add(box(1.4, 0.1, 5.0), M(E, y + 0.05, z + 0.5)); for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) mEraWhite.add(cyl(0.08, 0.12, 0.5, 8), M(E - r * 0.16 + i * 0.32, y + 0.35, z - 0.6 - r * 0.3)); mDarkTimber.add(sph(0.26), M(E, y + 0.36, z + 2.4));
      } else if (id === 'pavlov_skinner') { belfry(mDarkTimber);   // a great bell on a frame, and a food bowl
        [E - 1.1, E + 1.1].forEach((px) => mDarkTimber.add(box(0.25, 3.4, 0.25), M(px, y + 1.7, z))); mDarkTimber.add(box(2.7, 0.25, 0.4), M(E, y + 3.4, z)); mEraGold.add(cyl(0.3, 0.9, 1.2, 16), M(E, y + 2.5, z)); mEraGold.add(sph(0.2), M(E, y + 1.8, z));
        mEraWhite.add(cyl(0.7, 0.45, 0.3, 14), M(Wx, y + 0.15, z)); mEraRed.add(cyl(0.55, 0.55, 0.08, 14), M(Wx, y + 0.3, z));
      } else if (id === 'piaget_vygotsky') {            // building blocks, a short wide jar and a tall thin one, and a scaffold
        [[0, 0, mEraRed], [0.8, 0, mEraGold], [0.4, 0.8, mEraWhite], [0.4, 1.6, mEraRed]].forEach(([dx, dy, m]) => m.add(box(0.75, 0.75, 0.75), M(E - 1 + dx, y + 0.38 + dy, z)));
        mEraGlass.add(cyl(0.7, 0.7, 0.6, 16), M(Wx - 0.8, y + 0.3, z)); mEraGlass.add(cyl(0.3, 0.3, 2.2, 14), M(Wx + 0.8, y + 1.1, z));
        [E + 0.6, E + 1.6].forEach((px) => mDarkTimber.add(cyl(0.05, 0.05, 3.0, 6), M(px, y + 1.5, z))); [1.0, 2.0, 2.9].forEach((h) => mDarkTimber.add(box(1.2, 0.08, 0.5), M(E + 1.1, y + h, z)));
      } else if (id === 'ebbinghaus') {                 // a row of posts falling away like the forgetting curve, and a sundial
        for (let i = 0; i < 8; i++) { const h = 0.5 + 2.8 * Math.exp(-i * 0.45); (i ? mEraWhite : mEraGold).add(box(0.4, h, 0.4), M(E - 2.6 + i * 0.75, y + h / 2, z)); }
        plinth(Wx, z, 0.8, 0.9); mEraGold.add(cyl(0.75, 0.75, 0.06, 24), M(Wx, y + 0.95, z)); mDarkTimber.add(box(0.05, 0.7, 0.9), M(Wx, y + 1.25, z, 0.6, 0, 0));
      } else if (id === 'maslow_festinger') { globe();  // a five-step pyramid
        for (let i = 0; i < 5; i++) [mEraRed, mEraGold, mEraWhite, mEraGlass, mEraGold][i].add(box(4.0 - i * 0.8, 0.6, 4.0 - i * 0.8), M(E - 1, y + 0.3 + i * 0.6, z + 0.3));
      }
    });

    // ───────── District VII: what makes each building's own silhouette (on the roof / the front) ─────────
    (P.eraLandmarks || []).forEach((EL) => {
      if (!/^d7roof_/.test(EL.kind)) return;
      const { x, y, z, x0, x1, z1 } = EL, id = EL.kind.slice(7), R = y + 11.6, fz = z1 + 1.2;
      const box = (w, h, d) => new T.BoxGeometry(w, h, d);
      if (id === 'frege') {            // a stepped stone bell-gable with a clock over the door, and a star finial
        [[5.0, 0], [3.6, 1.1], [2.2, 2.2]].forEach(([w, dy]) => mEraWhite.add(box(w, 1.1, 0.5), M(x, y + 6.6 + dy, fz - 0.6)));
        mEraGold.add(cyl(0.62, 0.62, 0.12, 20), M(x, y + 7.7, fz - 0.3, Math.PI / 2, 0, 0)); mDarkTimber.add(box(0.06, 0.5, 0.05), M(x, y + 7.9, fz - 0.2)); mDarkTimber.add(box(0.36, 0.06, 0.05), M(x + 0.16, y + 7.7, fz - 0.2));
        mDarkTimber.add(cyl(0.04, 0.06, 1.6, 6), M(x, y + 10.2, fz - 0.6)); mEraGold.add(sph(0.22), M(x, y + 11.1, fz - 0.6));
      } else if (id === 'russell') {   // battlements along the front eave and two corner turrets
        for (let px = x0 + 1; px <= x1; px += 1.5) mEraWhite.add(box(0.8, 0.8, 0.5), M(px, y + 6.6, z1 + 0.6));
        [x0 + 0.5, x1 + 0.5].forEach((px) => { mEraWhite.add(cyl(1.0, 1.05, 9.0, 8), M(px, y + 4.5, z1 + 0.5)); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; mEraWhite.add(box(0.36, 0.5, 0.36), M(px + Math.cos(a) * 0.9, y + 9.25, z1 + 0.5 + Math.sin(a) * 0.9)); } mEraRed.add(cyl(0.02, 0.06, 1.4, 6), M(px, y + 9.9, z1 + 0.5)); });
      } else if (id === 'peirce_dewey') {  // a white schoolhouse belfry on the ridge
        mEraWhite.add(box(1.8, 1.4, 1.8), M(x, R + 0.5, z)); [[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]].forEach(([dx, dz]) => mEraWhite.add(box(0.18, 1.5, 0.18), M(x + dx, R + 1.95, z + dz)));
        mEraGold.add(cyl(0.2, 0.5, 0.65, 12), M(x, R + 1.9, z)); mEraRed.add(cyl(0.02, 1.5, 1.5, 4), M(x, R + 3.45, z, 0, Math.PI / 4, 0)); mDarkTimber.add(cyl(0.03, 0.03, 0.9, 5), M(x, R + 4.6, z));
      } else if (id === 'popper') {    // the Vienna Secession: a white drum with a golden openwork globe of leaves
        mEraWhite.add(box(3.0, 2.2, 3.0), M(x, R - 0.4, z)); [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].forEach(([dx, dz]) => mEraWhite.add(box(0.7, 3.6, 0.7), M(x + dx, R + 0.3, z + dz)));
        mEraGold.add(sph(1.75), M(x, R + 2.2, z)); for (let i = 0; i < 4; i++) mEraGold.add(torus(1.82, 0.05), M(x, R + 2.2, z, 0, i * Math.PI / 4, 0));
      } else if (id === 'rawls') {     // a Harvard portico: four white columns and a pediment
        [-3.3, -1.1, 1.1, 3.3].forEach((dx) => { mEraWhite.add(cyl(0.3, 0.34, 5.4, 14), M(x + dx, y + 2.7, fz + 1.2)); mEraWhite.add(box(0.85, 0.25, 0.85), M(x + dx, y + 5.5, fz + 1.2)); });
        mEraWhite.add(box(8.2, 0.5, 2.2), M(x, y + 5.9, fz + 0.5)); mEraWhite.add(cyl(0.02, 4.4, 1.7, 3), M(x, y + 7.0, fz + 0.5, 0, Math.PI / 2, 0, 0.5, 1, 1)); mEraWhite.add(box(8.6, 0.25, 2.6), M(x, y + 0.12, fz + 0.5));
      } else if (id === 'foucault') {  // a mansard lantern: a ring of dormer "eyes" round a dark belvedere
        mDarkTimber.add(cyl(1.5, 1.9, 2.2, 12), M(x, R + 0.4, z)); mEraGlass.add(cyl(1.25, 1.25, 1.1, 12), M(x, R + 2.0, z)); mDarkTimber.add(cyl(0.02, 1.5, 1.1, 12), M(x, R + 3.1, z));
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; mEraGold.add(cyl(0.3, 0.3, 0.1, 12), M(x + Math.cos(a) * 1.72, R + 0.6, z + Math.sin(a) * 1.72, Math.PI / 2, 0, a + Math.PI / 2)); }
      } else if (id === 'habermas') {  // a long glass ridge lantern: the debating hall is lit from above
        mEraGlass.add(box(11.0, 1.5, 2.6), M(x, R + 0.3, z)); for (let px = -5; px <= 5; px += 2.5) mEraWhite.add(box(0.14, 1.6, 2.7), M(x + px, R + 0.3, z)); mEraWhite.add(box(11.3, 0.14, 2.9), M(x, R + 1.1, z));
      }
    });

    // ───────── District VII signature landmarks (front yards of halls 21–30) ─────────
    (P.eraLandmarks || []).forEach((EL) => {
      if (!/^d7_/.test(EL.kind)) return;
      const { x, y, z } = EL, id = EL.kind.slice(3), E = x + 5, Wx = x - 5;
      const box = (w, h, d) => new T.BoxGeometry(w, h, d);
      const plinth = (px, pz, r, h) => { mEraWhite.add(cyl(r, r * 1.15, h, 16), M(px, y + h / 2, pz)); };
      if (id === 'bacon') {
        // The Pillars of Hercules from the title page of the Novum Organum, with a ship sailing through
        [Wx, E].forEach((px) => { mEraWhite.add(cyl(0.42, 0.5, 5.4, 16), M(px, y + 2.7, z)); mEraWhite.add(box(1.3, 0.3, 1.3), M(px, y + 5.55, z)); mEraGold.add(sph(0.42), M(px, y + 6.1, z)); mEraWhite.add(box(1.5, 0.4, 1.5), M(px, y + 0.2, z)); });
        mDarkTimber.add(box(1.5, 0.35, 0.5), M(x, y + 2.2, z)); mDarkTimber.add(cyl(0.04, 0.04, 1.5, 6), M(x, y + 3.0, z)); mEraWhite.add(box(0.9, 0.9, 0.04), M(x + 0.1, y + 3.1, z)); mDarkTimber.add(cyl(0.06, 0.06, 2.0, 6), M(x, y + 1.0, z));
      } else if (id === 'mill') {
        // Speakers' Corner: a soapbox platform, a lectern and a ring of listeners' stools
        mEraWhite.add(cyl(1.5, 1.6, 0.5, 20), M(E, y + 0.25, z)); mDarkTimber.add(box(0.7, 1.1, 0.5), M(E, y + 1.05, z + 0.5)); mDarkTimber.add(box(0.9, 0.08, 0.6), M(E, y + 1.64, z + 0.5, -0.3, 0, 0));
        for (let i = 0; i < 6; i++) { const a = Math.PI * (0.15 + i * 0.14); mDarkTimber.add(cyl(0.22, 0.22, 0.45, 10), M(E + Math.cos(a) * 2.7 - 0.6, y + 0.22, z + Math.sin(a) * 2.2 + 1.0)); }
        mDarkTimber.add(cyl(0.07, 0.09, 4.2, 8), M(Wx, y + 2.1, z)); mEraGlass.add(sph(0.36), M(Wx, y + 4.4, z)); mEraGold.add(cyl(0.3, 0.1, 0.25, 8), M(Wx, y + 4.8, z));
      } else if (id === 'frege') {
        // Morning star and evening star: two masts, one planet
        [[Wx, 5.2], [E, 5.2]].forEach(([px, h]) => { mDarkTimber.add(cyl(0.07, 0.11, h, 8), M(px, y + h / 2, z)); mEraGold.add(sph(0.3), M(px, y + h + 0.2, z)); });
        mEraGold.add(sph(0.62), M(x, y + 7.2, z)); mDarkTimber.add(cyl(0.03, 0.03, 5.6, 6), M((Wx + x) / 2, y + 6.3, z, 0, 0, -1.19)); mDarkTimber.add(cyl(0.03, 0.03, 5.6, 6), M((E + x) / 2, y + 6.3, z, 0, 0, 1.19));
        plinth(Wx, z, 0.6, 0.4); plinth(E, z, 0.6, 0.4);
      } else if (id === 'russell') {
        // A Cambridge gatehouse: two crenellated turrets and a pointed arch
        [Wx + 1.5, E - 1.5].forEach((px) => { mEraWhite.add(cyl(0.75, 0.8, 5.0, 8), M(px, y + 2.5, z)); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; mEraWhite.add(box(0.3, 0.45, 0.3), M(px + Math.cos(a) * 0.68, y + 5.2, z + Math.sin(a) * 0.68)); } mEraGold.add(cyl(0.02, 0.12, 0.9, 6), M(px, y + 5.7, z)); });
        mEraWhite.add(box(5.6, 0.6, 0.7), M(x, y + 4.1, z)); mEraWhite.add(box(0.5, 1.0, 0.7), M(x, y + 4.9, z)); mEraGold.add(sph(0.2), M(x, y + 5.55, z));
      } else if (id === 'peirce_dewey') {
        // A New England schoolhouse bell on its frame
        [E - 0.9, E + 0.9].forEach((px) => mEraWhite.add(box(0.22, 3.6, 0.22), M(px, y + 1.8, z)));
        mEraWhite.add(box(2.4, 0.22, 0.4), M(E, y + 3.6, z)); mEraRed.add(cyl(0.02, 1.7, 1.0, 4), M(E, y + 4.2, z, 0, Math.PI / 4, 0));
        mEraGold.add(cyl(0.22, 0.55, 0.7, 14), M(E, y + 2.95, z)); mEraGold.add(sph(0.14), M(E, y + 2.5, z)); mDarkTimber.add(cyl(0.02, 0.02, 2.4, 5), M(E + 0.5, y + 1.3, z));
        // a round of low benches: learning by doing
        for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; mDarkTimber.add(box(0.9, 0.3, 0.35), M(Wx + Math.cos(a) * 1.6, y + 0.15, z + Math.sin(a) * 1.6, 0, -a + Math.PI / 2, 0)); }
      } else if (id === 'popper') {
        // Five white swans and one black swan on a pond
        mEraGlass.add(cyl(3.0, 3.0, 0.08, 28), M(E - 1.2, y + 0.06, z));
        const swan = (m, px, pz, r) => { m.add(sph(0.42), M(px, y + 0.42, pz, 0, 0, 0, 1.3, 0.75, 0.9)); m.add(cyl(0.07, 0.09, 0.8, 6), M(px + Math.cos(r) * 0.42, y + 0.95, pz + Math.sin(r) * 0.42, 0, 0, -0.35 * Math.cos(r))); m.add(sph(0.13), M(px + Math.cos(r) * 0.55, y + 1.38, pz + Math.sin(r) * 0.55)); };
        for (let i = 0; i < 5; i++) swan(mEraWhite, E - 2.8 + i * 0.75, z - 1.0 + (i % 2) * 0.9, 0.3);
        swan(mDarkTimber, E + 0.7, z + 0.9, 2.6);
      } else if (id === 'kuhn') {
        // An observatory dome with an open slit, and an old armillary beside it
        plinth(E, z, 1.9, 1.5);
        const dome = new T.Mesh(makeRibbedDomeGeo(1.85, 1.6), copperPatinaMat); dome.position.set(E, y + 1.5, z); dome.castShadow = true; group.add(dome); made.meshes++;
        mDarkTimber.add(box(0.5, 1.3, 1.9), M(E, y + 2.45, z + 0.75, -0.55, 0, 0)); mEraGold.add(cyl(0.1, 0.14, 1.6, 8), M(E, y + 3.0, z + 0.9, -0.9, 0, 0));
        plinth(Wx, z, 0.5, 1.0); for (let i = 0; i < 3; i++) mEraGold.add(torus(0.75, 0.035), M(Wx, y + 1.9, z, i * 1.05, i * 0.7, 0)); mEraGold.add(sph(0.16), M(Wx, y + 1.9, z));
      } else if (id === 'rawls') {
        // The veil of ignorance: a glass curtain beside the path (not across the door), and the scales of justice
        [x + 1.6, E + 1.4].forEach((px) => { mDarkTimber.add(cyl(0.1, 0.14, 4.4, 8), M(px, y + 2.2, z)); mEraGold.add(sph(0.2), M(px, y + 4.5, z)); });
        for (let i = 0; i < 5; i++) mEraGlass.add(box(0.8, 3.6, 0.06), M(x + 2.2 + i * 0.88, y + 2.3, z + Math.sin(i * 1.3) * 0.18));
        mDarkTimber.add(cyl(0.05, 0.05, 4.9, 6), M(x + 4.0, y + 4.25, z, 0, 0, Math.PI / 2));
        plinth(Wx, z, 0.5, 1.2); mEraGold.add(cyl(0.05, 0.08, 1.5, 6), M(Wx, y + 1.95, z)); mEraGold.add(box(2.2, 0.07, 0.07), M(Wx, y + 2.7, z)); [-1, 1].forEach((k2) => { mEraGold.add(cyl(0.38, 0.1, 0.14, 12), M(Wx + k2 * 1.05, y + 2.15, z)); mDarkTimber.add(cyl(0.012, 0.012, 0.55, 4), M(Wx + k2 * 1.05, y + 2.42, z)); });
      } else if (id === 'foucault') {
        // The Panopticon: a dark inspection tower with a glass lantern, ringed by open cells
        mDarkTimber.add(cyl(0.7, 0.85, 5.2, 12), M(E - 1, y + 2.6, z)); mEraGlass.add(cyl(0.95, 0.95, 0.9, 12), M(E - 1, y + 5.6, z)); mDarkTimber.add(cyl(0.02, 1.05, 0.8, 12), M(E - 1, y + 6.45, z));
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, cx = E - 1 + Math.cos(a) * 3.0, cz = z + Math.sin(a) * 3.0; if (cz < EL.z1 + 1.6) continue; mEraWhite.add(box(1.1, 1.5, 0.16), M(cx + Math.cos(a) * 0.45, y + 0.75, cz + Math.sin(a) * 0.45, 0, -a + Math.PI / 2, 0)); mEraWhite.add(box(0.14, 1.5, 0.9), M(cx - Math.sin(a) * 0.55, y + 0.75, cz + Math.cos(a) * 0.55, 0, -a + Math.PI / 2, 0)); }
      } else if (id === 'habermas') {
        // A round-table pavilion: eight slender columns, a glass roof, one table with no head seat
        const cx = E - 1;
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; mEraWhite.add(cyl(0.11, 0.13, 3.2, 8), M(cx + Math.cos(a) * 2.6, y + 1.6, z + Math.sin(a) * 2.6)); mDarkTimber.add(cyl(0.2, 0.2, 0.5, 8), M(cx + Math.cos(a + 0.39) * 1.75, y + 0.25, z + Math.sin(a + 0.39) * 1.75)); }
        mEraGlass.add(cyl(3.0, 3.0, 0.1, 28), M(cx, y + 3.25, z)); mEraWhite.add(torus(2.95, 0.09), M(cx, y + 3.25, z, Math.PI / 2, 0, 0));
        mEraWhite.add(cyl(1.15, 1.15, 0.1, 24), M(cx, y + 0.8, z)); mEraWhite.add(cyl(0.2, 0.3, 0.75, 10), M(cx, y + 0.38, z));
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
    const mMusGlass = new Merger(), mMusPlaster = new Merger();
    const mMusCeladon = new Merger(), mMusWingA = new Merger(), mMusWingB = new Merger();
    const celadonMat = new T.MeshPhongMaterial({ color: 0x9cc7b4, specular: 0xffffff, shininess: 70 });
    const wingAMat = new T.MeshBasicMaterial({ color: 0xf59e0b, side: T.DoubleSide });
    const wingBMat = new T.MeshBasicMaterial({ color: 0x7dd3fc, side: T.DoubleSide });
    const vitrineGlassMat = new T.MeshPhongMaterial({ color: 0xd6ecf7, specular: 0xffffff, shininess: 120, transparent: true, opacity: 0.2, depthWrite: false });
    const plasterTrimMat = new T.MeshLambertMaterial({ color: 0xefe6d2 });
    const texLoader = new T.TextureLoader();

    function loadMuseumPhotoTex(url) {
      // Composite onto warm archival museum parchment so transparent PNG ink drawings (e.g., Laozi, Wittgenstein) never render black!
      const c = document.createElement('canvas'); c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#f5efe0';
      ctx.fillRect(0, 0, 512, 512);
      const tex = new T.CanvasTexture(c);
      if (T.sRGBEncoding !== undefined) tex.encoding = T.sRGBEncoding;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        c.width = img.naturalWidth || 512;
        c.height = img.naturalHeight || 512;
        ctx.fillStyle = '#f5efe0';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        tex.needsUpdate = true;
      };
      img.src = url;
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
    const F_SERIF = '"Songti SC","STSong","Noto Serif CJK SC","Source Han Serif SC",Georgia,serif';
    const F_SANS = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Helvetica Neue",Arial,sans-serif';
    const NO_HEAD = '，。、；：！？）》」』”’…·';
    // Wrap mixed CJK / Latin text to maxW; at most maxLines, ending with an ellipsis when cut
    function wrapLines(x, text, maxW, maxLines) {
      const toks = String(text || '').match(/[A-Za-z0-9\u00C0-\u024F\u0370-\u03FF\u1F00-\u1FFF'’.\-]+|\s+|[\s\S]/g) || [];
      const out = [];
      let line = '', cut = false;
      for (let i = 0; i < toks.length; i++) {
        const tok = toks[i];
        if (line && x.measureText(line + tok).width > maxW && NO_HEAD.indexOf(tok) < 0) {
          if (out.length === maxLines - 1) { cut = true; break; }
          out.push(line.trim());
          line = tok.trim() ? tok : '';
        } else line += tok;
      }
      line = line.trim();
      if (cut) { while (line && x.measureText(line + '…').width > maxW) line = line.slice(0, -1); line = line.replace(/[，、；：,\s]+$/, '') + '…'; }
      if (line) out.push(line);
      return out;
    }
    function fitFont(x, text, maxW, size, minSize, mk) {
      let sz = size;
      x.font = mk(sz);
      while (sz > minSize && x.measureText(text).width > maxW) { sz -= 2; x.font = mk(sz); }
      return sz;
    }
    function spaced(x, px) { try { x.letterSpacing = px + 'px'; } catch (e) {} }
    function finishTex(c) {
      const tex = new T.CanvasTexture(c);
      if (T.sRGBEncoding !== undefined) tex.encoding = T.sRGBEncoding;
      tex.anisotropy = 8;
      made.textures++;
      return tex;
    }
    const WALL_PAL = {
      marble: { bg0: '#f8f4ea', bg1: '#ece4d1', ink: '#1f2430', sub: '#5b6270', accent: '#9a6b1f', rule: 'rgba(154,107,31,.55)', quote: '#2a2f3c' },
      lacquer: { bg0: '#22130c', bg1: '#140a06', ink: '#f6ead2', sub: '#c7b697', accent: '#e2b354', rule: 'rgba(226,179,84,.55)', quote: '#fbf3df' },
      modern: { bg0: '#fbfbfa', bg1: '#f1f1ee', ink: '#111418', sub: '#5a6068', accent: '#c2410c', rule: 'rgba(17,20,24,.28)', quote: '#111418' },
      velvet: { bg0: '#2a1a20', bg1: '#170e12', ink: '#f4ecdf', sub: '#c5b8aa', accent: '#dcae55', rule: 'rgba(220,174,85,.5)', quote: '#fbf4e4' }
    };
    function paintPanel(x, w, h, pal, style, inset) {
      const g = x.createLinearGradient(0, 0, w * 0.4, h);
      g.addColorStop(0, pal.bg0); g.addColorStop(1, pal.bg1);
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      if (style === 'modern') return;
      x.strokeStyle = pal.accent; x.lineWidth = Math.max(3, inset * 0.22); x.strokeRect(inset * 0.4, inset * 0.4, w - inset * 0.8, h - inset * 0.8);
      x.strokeStyle = pal.rule; x.lineWidth = 1.5; x.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
    }

    function makeArtPlacardTex(phil, style) {
      const W = 1040, H = 256;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d');
      const pal = style === 'modern' ? WALL_PAL.modern : style === 'marble' ? WALL_PAL.marble : style === 'eastern' ? WALL_PAL.lacquer : WALL_PAL.velvet;
      paintPanel(x, W, H, pal, style === 'modern' ? 'modern' : '', 14);
      x.fillStyle = pal.accent; x.fillRect(40, 44, 6, H - 88);
      x.textAlign = 'left'; x.textBaseline = 'alphabetic';
      const lx = 70, mw = W - lx - 44;
      x.fillStyle = pal.ink;
      fitFont(x, phil.artTitle || '', mw, 56, 30, (sz) => `700 ${sz}px ${F_SERIF}`);
      x.fillText(phil.artTitle || '', lx, 96);
      x.fillStyle = pal.accent;
      fitFont(x, phil.artArtist || '', mw, 31, 20, (sz) => `600 ${sz}px ${F_SANS}`);
      x.fillText(phil.artArtist || '', lx, 148);
      x.fillStyle = pal.sub; x.font = `400 27px ${F_SANS}`;
      wrapLines(x, phil.artDesc || '', mw, 1).forEach((ln) => x.fillText(ln, lx, 198));
      return finishTex(c);
    }

    // 3. West Wall Wikipedia-Grade Encyclopedia Biography, Timeline & Quote Panel
    function makeWallQuoteTex(phil, style) {
      const W = 1520, H = 840;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d');
      const wiki = root.PIWiki ? root.PIWiki.get(phil.id) : null;
      const pal = WALL_PAL[style] || WALL_PAL.velvet;
      paintPanel(x, W, H, pal, style, 30);
      x.textAlign = 'left'; x.textBaseline = 'alphabetic';

      // ---- Left column: number, name, dates, quotation
      const lx = 84, lw = 436;
      if (style === 'modern') { x.fillStyle = pal.accent; x.fillRect(lx, 78, 64, 8); }
      x.fillStyle = pal.accent; spaced(x, 6);
      x.font = `700 24px ${F_SANS}`;
      x.fillText(`№ ${String(phil.num || 0).padStart(2, '0')}  ·  PHILOSOPHER`, lx, style === 'modern' ? 128 : 112);
      spaced(x, 0);
      const nm = phil.name || '';
      const cutAt = nm.length > 5 ? nm.indexOf('与') : -1;
      const nameLines = cutAt > 0 ? [nm.slice(0, cutAt), nm.slice(cutAt)] : [nm];
      let ny = style === 'modern' ? 150 : 134;
      x.fillStyle = pal.ink;
      const widest = nameLines.reduce((m, l) => (l.length > m.length ? l : m), '');
      const nsz = fitFont(x, widest, lw, nameLines.length > 1 ? 80 : 136, 48, (sz) => `700 ${sz}px ${F_SERIF}`);
      nameLines.forEach((ln) => { ny += nsz * 1.08; x.fillText(ln, lx - 4, ny); });
      const en = (phil.en || '').split('(')[0].trim(), yrs = ((phil.en || '').match(/\(([^)]*)\)/) || [])[1] || '';
      x.fillStyle = pal.sub;
      fitFont(x, en, lw, 36, 22, (sz) => `italic 500 ${sz}px Georgia,${F_SERIF}`);
      ny += 54; x.fillText(en, lx, ny);
      x.font = `500 28px Georgia,${F_SERIF}`; spaced(x, 2);
      ny += 42; x.fillText(yrs, lx, ny); spaced(x, 0);
      ny += 34; x.fillStyle = pal.accent; x.fillRect(lx, ny, 76, 4);

      const qTop = Math.max(ny + 26, 440);
      x.fillStyle = pal.accent; x.globalAlpha = 0.55;
      x.font = `700 150px Georgia,${F_SERIF}`; x.fillText('“', lx - 10, qTop + 96);
      x.globalAlpha = 1;
      x.fillStyle = pal.quote;
      let qsz = 46, qLines;
      for (;;) {
        x.font = `600 ${qsz}px ${F_SERIF}`;
        qLines = wrapLines(x, phil.quote || '', lw, 9);
        if (qLines.length * qsz * 1.5 <= H - 130 - (qTop + 64) || qsz <= 28) break;
        qsz -= 2;
      }
      let qy = qTop + 64 + qsz;
      qLines.slice(0, 5).forEach((ln) => { x.fillText(ln, lx, qy); qy += qsz * 1.5; });
      x.fillStyle = pal.sub; x.font = `italic 400 24px Georgia,${F_SERIF}`;
      const oLines = wrapLines(x, phil.quoteOrig || '', lw, 2);
      let oy = Math.min(qy + 8, H - 64 - (oLines.length - 1) * 33);
      oLines.forEach((ln) => { x.fillText(ln, lx, oy); oy += 33; });

      // ---- Divider
      x.strokeStyle = pal.rule; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(566, 84); x.lineTo(566, H - 84); x.stroke();

      // ---- Right column: life timeline, lineage
      const rx = 612, rw = W - rx - 78;
      const head = (zh, enLabel, y) => {
        x.fillStyle = pal.ink; x.font = `700 42px ${F_SERIF}`; x.fillText(zh, rx, y);
        const zw = x.measureText(zh).width;
        x.fillStyle = pal.accent; x.font = `700 20px ${F_SANS}`; spaced(x, 5);
        x.fillText(enLabel, rx + zw + 18, y - 4); spaced(x, 0);
        x.strokeStyle = pal.rule; x.lineWidth = 1.5;
        x.beginPath(); x.moveTo(rx, y + 16); x.lineTo(rx + rw, y + 16); x.stroke();
      };
      let y = 114;
      head('生平', 'LIFE', y);
      y += 66;
      const yearW = 212, tx = rx + yearW + 36, tw = rw - yearW - 36;
      const tl = ((wiki && wiki.timeline) || []).slice(0, 4);
      const lineTop = y - 8;
      let lastDot = lineTop;
      tl.forEach((e) => {
        x.fillStyle = pal.accent; x.textAlign = 'right';
        fitFont(x, e[0], yearW, 27, 17, (sz) => `700 ${sz}px ${F_SANS}`);
        x.fillText(e[0], rx + yearW, y);
        x.textAlign = 'left';
        x.beginPath(); x.arc(rx + yearW + 18, y - 9, 6, 0, Math.PI * 2); x.fill();
        lastDot = y - 9;
        x.fillStyle = pal.ink; x.font = `400 29px ${F_SANS}`;
        const lines = wrapLines(x, e[1], tw, 2);
        lines.forEach((ln, i) => x.fillText(ln, tx, y + i * 40));
        y += Math.max(1, lines.length) * 40 + 16;
      });
      x.strokeStyle = pal.rule; x.lineWidth = 2;
      x.beginPath(); x.moveTo(rx + yearW + 18, lineTop); x.lineTo(rx + yearW + 18, lastDot); x.stroke();

      if (wiki) {
        y = Math.max(y + 30, 588);
        head('学脉', 'LINEAGE', y);
        y += 62;
        [['流派', wiki.school], ['师承', wiki.influencedBy], ['影响', wiki.influenced]].forEach((r) => {
          if (!r[1] || y > H - 52) return;
          x.fillStyle = pal.accent; x.font = `700 26px ${F_SANS}`; x.fillText(r[0], rx, y);
          x.fillStyle = pal.ink; x.font = `400 27px ${F_SANS}`;
          const lines = wrapLines(x, r[1], rw - 96, 1);
          lines.forEach((ln, i) => x.fillText(ln, rx + 96, y + i * 38));
          y += lines.length * 38 + 4;
        });
      }
      return finishTex(c);
    }

    // 4. East Wall Floating Bookshelf Rail Labels (clean strip identifying the physical 3D books on the shelf!)
    function makeShelfRailTex(phil, booksSlice, isLight) {
      const W = 1280, H = 154;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d');
      const pal = isLight ? WALL_PAL.marble : WALL_PAL.velvet;
      paintPanel(x, W, H, pal, '', 12);
      const titles = booksSlice.map((b) => (b.match(/^[^《]*《[^》]*》/) || [b.split('(')[0].trim()])[0]);
      const text = titles.join('　·　');
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = pal.ink;
      fitFont(x, text, W - 250, 54, 26, (sz) => `600 ${sz}px ${F_SERIF}`);
      x.fillText(text, W / 2, H / 2 + 2);
      return finishTex(c);
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
          new T.PlaneGeometry(2.1, 0.517),
          new T.MeshBasicMaterial({ map: makeArtPlacardTex(phil, style), side: T.DoubleSide })
        );
        placMesh.position.set(px + nX * 0.06, py - ph / 2 - 0.40, pz + nZ * 0.06);
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
    function makeBustPlateTex(phil) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 112;
      const x = c.getContext('2d');
      x.fillStyle = '#1b140c'; x.fillRect(0, 0, 256, 112);
      x.strokeStyle = '#c9a353'; x.lineWidth = 4; x.strokeRect(6, 6, 244, 100);
      x.textAlign = 'center'; x.fillStyle = '#f1d99a';
      x.font = '700 40px "Songti SC","STSong","PingFang SC",serif';
      x.fillText(phil.name, 128, 56, 228);
      const years = ((phil.en || '').match(/\(([^)]*)\)/) || [])[1] || '';
      x.font = '500 19px Georgia,serif'; x.fillStyle = '#c9a353';
      x.fillText(years, 128, 88, 228);
      const t = new T.CanvasTexture(c); t.anisotropy = 4; return t;
    }

    const BUST_STYLE = {
      socrates: 'bald beard', plato: 'beard long', aristotle: 'beard', zeno: 'beard',
      confucius: 'knot beard long', laozi: 'bald knot beard long', zhuangzi: 'knot beard',
      descartes: 'wig moustache', spinoza: 'wig', leibniz: 'wig big', locke: 'wig', hume: 'wig',
      hobbes_rousseau: 'wig', kant: 'wig', hegel: 'wig', marx: 'beard long big',
      schopenhauer_kierkegaard: 'tufts', nietzsche: 'moustache big', wittgenstein: '', heidegger_sartre: 'moustache'
    };

    if (root.PIExpansion) Object.assign(BUST_STYLE, root.PIExpansion.bust);

    function buildPhilosopherBust(sx, sy, sz, isBronze, phil) {
      const m = isBronze ? mMusBronze : mMusMarble;
      const st = ' ' + ((phil && BUST_STYLE[phil.id]) || '') + ' ';
      const has = (k) => st.indexOf(' ' + k + ' ') >= 0;
      // Stepped plinth, panelled die & moulded cap
      mMusMarble.add(new T.BoxGeometry(0.84, 0.12, 0.84), M(sx, sy + 0.06, sz));
      mMusMarble.add(new T.BoxGeometry(0.70, 0.08, 0.70), M(sx, sy + 0.16, sz));
      mMusMarble.add(new T.BoxGeometry(0.54, 0.86, 0.54), M(sx, sy + 0.63, sz));
      mMusGold.add(new T.BoxGeometry(0.58, 0.03, 0.58), M(sx, sy + 0.215, sz));
      mMusMarble.add(new T.BoxGeometry(0.64, 0.06, 0.64), M(sx, sy + 1.09, sz));
      mMusGold.add(new T.BoxGeometry(0.72, 0.045, 0.72), M(sx, sy + 1.142, sz));
      if (phil) {
        const plate = new T.Mesh(new T.PlaneGeometry(0.44, 0.19), new T.MeshBasicMaterial({ map: makeBustPlateTex(phil) }));
        plate.position.set(sx, sy + 0.78, sz + 0.274);
        group.add(plate); made.meshes++;
      }
      const y0 = sy + 1.165;
      // Socle, tapered chest, sloping shoulders & drapery fold
      m.add(cyl(0.10, 0.17, 0.13, 18), M(sx, y0 + 0.065, sz));
      m.add(cyl(0.31, 0.13, 0.30, 22), M(sx, y0 + 0.28, sz, 0, 0, 0, 1, 1, 0.62));
      m.add(sph(0.31), M(sx, y0 + 0.43, sz, 0, 0, 0, 1.04, 0.34, 0.64));
      m.add(torus(0.20, 0.035), M(sx + 0.03, y0 + 0.38, sz + 0.05, 1.25, 0, 0.5, 1, 0.8, 1));
      // Neck, skull, jaw, brow, nose & ears
      m.add(cyl(0.078, 0.10, 0.20, 14), M(sx, y0 + 0.56, sz));
      m.add(sph(0.17), M(sx, y0 + 0.80, sz, 0, 0, 0, 0.88, 1.12, 1.0));
      m.add(sph(0.12), M(sx, y0 + 0.71, sz + 0.035, 0, 0, 0, 0.92, 0.9, 0.95));
      for (const sd of [-1, 1]) m.add(sph(0.05), M(sx + sd * 0.062, y0 + 0.852, sz + 0.118, 0, 0, sd * -0.18, 1.25, 0.42, 0.8));
      m.add(sph(0.04), M(sx, y0 + 0.795, sz + 0.158, -0.25, 0, 0, 0.62, 1.55, 1.0));
      m.add(sph(0.03), M(sx, y0 + 0.705, sz + 0.142, 0, 0, 0, 1.5, 0.5, 0.8));
      for (const sd of [-1, 1]) m.add(sph(0.04), M(sx + sd * 0.152, y0 + 0.79, sz - 0.01, 0, 0, 0, 0.5, 1.1, 0.8));
      // Hair, wig, top-knot, beard & moustache massing
      const big = has('big') ? 1.18 : 1;
      if (!has('bald')) m.add(sph(0.178), M(sx, y0 + 0.865, sz - 0.03, 0, 0, 0, 0.96 * big, 0.80, 1.04));
      else m.add(torus(0.135, 0.04), M(sx, y0 + 0.80, sz - 0.05, Math.PI / 2, 0, 0, 1, 1.1, 1.3));
      if (has('wig')) {
        for (const sd of [-1, 1]) {
          m.add(sph(0.085), M(sx + sd * 0.145, y0 + 0.74, sz - 0.02, 0, 0, 0, 0.8 * big, 1.5, 1.0));
          m.add(sph(0.075), M(sx + sd * 0.15, y0 + 0.60, sz - 0.02, 0, 0, 0, 0.8 * big, 1.2, 1.0));
        }
        m.add(sph(0.13), M(sx, y0 + 0.70, sz - 0.11, 0, 0, 0, 1.1, 1.5, 0.7));
      }
      if (has('tufts')) for (const sd of [-1, 1]) m.add(sph(0.075), M(sx + sd * 0.16, y0 + 0.86, sz - 0.03, 0, 0, 0, 0.9, 1.0, 1.1));
      if (has('knot')) {
        m.add(cyl(0.05, 0.06, 0.09, 12), M(sx, y0 + 1.03, sz - 0.03));
        mMusGold.add(cyl(0.01, 0.01, 0.2, 6), M(sx, y0 + 1.04, sz - 0.03, 0, 0, Math.PI / 2));
      }
      if (has('beard')) {
        m.add(sph(0.125), M(sx, y0 + 0.655, sz + 0.075, 0, 0, 0, 1.08 * big, 1.2, 0.98));
        for (const sd of [-1, 1]) m.add(sph(0.07), M(sx + sd * 0.115, y0 + 0.72, sz + 0.03, 0, 0, 0, 0.8, 1.5, 1.0));
        if (has('long')) m.add(cyl(0.10 * big, 0.03, 0.26, 12), M(sx, y0 + 0.50, sz + 0.125, 0.14, 0, 0, 1, 1, 0.7));
      }
      if (has('moustache') || has('beard')) for (const sd of [-1, 1]) m.add(sph(0.045), M(sx + sd * 0.045 * big, y0 + 0.738, sz + 0.158, 0, 0, sd * -0.35, 1.5 * big, 0.55 * big, 0.8));
    }

    // Glass museum vitrine with an open manuscript on a velvet pad
    function buildVitrine(vx, vy, vz, baseM) {
      baseM.add(new T.BoxGeometry(0.98, 0.10, 0.70), M(vx, vy + 0.05, vz));
      baseM.add(new T.BoxGeometry(0.90, 0.68, 0.62), M(vx, vy + 0.44, vz));
      mMusGold.add(new T.BoxGeometry(0.96, 0.04, 0.68), M(vx, vy + 0.80, vz));
      mMusVelvet.add(new T.BoxGeometry(0.84, 0.03, 0.56), M(vx, vy + 0.835, vz));
      mMusPage.add(new T.BoxGeometry(0.27, 0.035, 0.38), M(vx - 0.137, vy + 0.875, vz, 0, 0, 0.10));
      mMusPage.add(new T.BoxGeometry(0.27, 0.035, 0.38), M(vx + 0.137, vy + 0.875, vz, 0, 0, -0.10));
      mMusWood.add(new T.BoxGeometry(0.60, 0.02, 0.42), M(vx, vy + 0.856, vz));
      mMusVelvet.add(new T.BoxGeometry(0.03, 0.02, 0.40), M(vx, vy + 0.892, vz));
      mMusGlass.add(new T.BoxGeometry(0.90, 0.42, 0.62), M(vx, vy + 1.03, vz));
      for (const dx of [-0.45, 0.45]) for (const dz of [-0.31, 0.31]) mMusGold.add(new T.BoxGeometry(0.025, 0.42, 0.025), M(vx + dx, vy + 1.03, vz + dz));
      for (const dz of [-0.31, 0.31]) mMusGold.add(new T.BoxGeometry(0.925, 0.025, 0.025), M(vx, vy + 1.24, vz + dz));
      for (const dx of [-0.45, 0.45]) mMusGold.add(new T.BoxGeometry(0.025, 0.025, 0.645), M(vx + dx, vy + 1.24, vz));
      mMusGold.add(new T.BoxGeometry(0.30, 0.10, 0.012), M(vx, vy + 0.56, vz + 0.317));
    }

    // Brass stanchions joined by sagging velvet ropes along X
    function buildRopeLine(xa, xb, ry, rz, posts) {
      const xs = [];
      for (let i = 0; i < posts; i++) xs.push(xa + (xb - xa) * (i / (posts - 1)));
      xs.forEach((px) => {
        mMusGold.add(cyl(0.15, 0.17, 0.04, 16), M(px, ry + 0.02, rz));
        mMusGold.add(cyl(0.028, 0.034, 0.86, 10), M(px, ry + 0.47, rz));
        mMusGold.add(sph(0.058), M(px, ry + 0.93, rz));
      });
      for (let i = 0; i < xs.length - 1; i++) {
        const SEG = 7, span = xs[i + 1] - xs[i];
        const pt = (k) => { const t = k / SEG; return [xs[i] + span * t, ry + 0.84 - 0.2 * 4 * t * (1 - t)]; };
        for (let k = 0; k < SEG; k++) {
          const A = pt(k), Bp = pt(k + 1), dx = Bp[0] - A[0], dy = Bp[1] - A[1];
          mMusVelvet.add(cyl(0.022, 0.022, Math.hypot(dx, dy) + 0.01, 6), M((A[0] + Bp[0]) / 2, (A[1] + Bp[1]) / 2, rz, 0, 0, Math.atan2(dy, dx) - Math.PI / 2));
        }
      }
    }

    function buildTopiary(tx, ty, tz) {
      mMusBronze.add(cyl(0.20, 0.14, 0.30, 12), M(tx, ty + 0.15, tz));
      mMusWood.add(cyl(0.03, 0.03, 0.62, 6), M(tx, ty + 0.60, tz));
      mMusEmerald.add(sph(0.24), M(tx, ty + 0.78, tz));
      mMusEmerald.add(sph(0.17), M(tx, ty + 1.14, tz));
    }

    // Panelled dado, chair rail & plaster crown cornice around a rectangular gallery (inner faces of the voxel walls)
    function buildGalleryTrim(ME) {
      const { x0, z0, x1, z1, y, phil } = ME;
      const xi0 = x0 + 1, xi1 = x1, zi0 = z0 + 1, zi1 = z1, H = ME.trimH || 6, EH = ME.eaveH || 6;
      const runX = (xa, xb, zf, sgn) => {
        const len = xb - xa, cx = (xa + xb) / 2;
        if (len <= 0.05) return;
        mMusWood.add(new T.BoxGeometry(len, 0.90, 0.05), M(cx, y + 0.45, zf + sgn * 0.025));
        mMusDark.add(new T.BoxGeometry(len, 0.12, 0.08), M(cx, y + 0.06, zf + sgn * 0.04));
        mMusGold.add(new T.BoxGeometry(len, 0.045, 0.09), M(cx, y + 0.925, zf + sgn * 0.045));
        for (let px = xa + 0.5; px < xb - 0.2; px += 1) mMusDark.add(new T.BoxGeometry(0.04, 0.62, 0.065), M(px + 0.5, y + 0.50, zf + sgn * 0.033));
      };
      const runZ = (za, zb, xf, sgn) => {
        const len = zb - za, cz = (za + zb) / 2;
        if (len <= 0.05) return;
        mMusWood.add(new T.BoxGeometry(0.05, 0.90, len), M(xf + sgn * 0.025, y + 0.45, cz));
        mMusDark.add(new T.BoxGeometry(0.08, 0.12, len), M(xf + sgn * 0.04, y + 0.06, cz));
        mMusGold.add(new T.BoxGeometry(0.09, 0.045, len), M(xf + sgn * 0.045, y + 0.925, cz));
        for (let pz = za + 0.5; pz < zb - 0.2; pz += 1) mMusDark.add(new T.BoxGeometry(0.065, 0.62, 0.04), M(xf + sgn * 0.033, y + 0.50, pz + 0.5));
      };
      runX(xi0, xi1, zi0, 1);
      runX(xi0, phil.x - 1, zi1, -1);
      runX(phil.x + 2, xi1, zi1, -1);
      runZ(zi0, zi1, xi0, 1);
      runZ(zi0, zi1 - 3.5, xi1, -1);
      // Crown cornice (two stepped plaster mouldings + gilt bead)
      const cx = (xi0 + xi1) / 2, cz = (zi0 + zi1) / 2, lx = xi1 - xi0, lz = zi1 - zi0;
      for (const [zf, sgn] of [[zi0, 1], [zi1, -1]]) {
        mMusPlaster.add(new T.BoxGeometry(lx, 0.14, 0.20), M(cx, y + H - 0.07, zf + sgn * 0.10));
        mMusPlaster.add(new T.BoxGeometry(lx, 0.10, 0.10), M(cx, y + H - 0.19, zf + sgn * 0.05));
        mMusGold.add(new T.BoxGeometry(lx, 0.025, 0.115), M(cx, y + H - 0.255, zf + sgn * 0.057));
      }
      for (const [xf, sgn] of [[xi0, 1], [xi1, -1]]) {
        mMusPlaster.add(new T.BoxGeometry(0.20, 0.14, lz), M(xf + sgn * 0.10, y + H - 0.07, cz));
        mMusPlaster.add(new T.BoxGeometry(0.10, 0.10, lz), M(xf + sgn * 0.05, y + H - 0.19, cz));
        mMusGold.add(new T.BoxGeometry(0.115, 0.025, lz), M(xf + sgn * 0.057, y + H - 0.255, cz));
      }
      // Facade: eaves modillions front & back, brass carriage lanterns on the porch piers
      const eaveM = (phil.id === 'locke' || phil.id === 'schopenhauer_kierkegaard') ? mMusDark : mMusPlaster;
      for (let bx = x0 + 0.5; bx <= x1 + 0.5; bx += 1) {
        eaveM.add(new T.BoxGeometry(0.18, 0.30, 0.24), M(bx, y + EH - 0.25, z1 + 1.12));
        eaveM.add(new T.BoxGeometry(0.18, 0.30, 0.24), M(bx, y + EH - 0.25, z0 - 0.12));
      }
      for (const lx of [phil.x - 1.5, phil.x + 2.5]) {
        const lz = z1 + 2.16, ly = y + 2.45;
        mMusGold.add(new T.BoxGeometry(0.05, 0.05, 0.18), M(lx, ly + 0.2, lz - 0.08));
        mMusDark.add(new T.BoxGeometry(0.22, 0.03, 0.22), M(lx, ly - 0.16, lz));
        mMusDark.add(new T.BoxGeometry(0.22, 0.03, 0.22), M(lx, ly + 0.16, lz));
        for (const ex of [-0.1, 0.1]) for (const ez of [-0.1, 0.1]) mMusDark.add(new T.BoxGeometry(0.025, 0.32, 0.025), M(lx + ex, ly, lz + ez));
        mMusLamp.add(new T.BoxGeometry(0.15, 0.27, 0.15), M(lx, ly, lz));
        mMusDark.add(cyl(0.0, 0.17, 0.13, 4), M(lx, ly + 0.24, lz, 0, Math.PI / 4, 0));
        mMusGold.add(sph(0.03), M(lx, ly + 0.32, lz));
      }
      // Rope line before the north picture wall & topiaries flanking the door
      buildRopeLine(ME.x - 3.3, ME.x + 3.5, y, zi0 + 1.35, 4);
      buildTopiary(phil.x - 2.4, y, zi1 - 0.55);
      buildTopiary(phil.x + 3.4, y, zi1 - 0.55);
    }

    // ---------- Bespoke scholar's-hall furnishings: Confucius, Laozi, Zhuangzi & Kant ----------
    const bx3 = (w, h, d) => new T.BoxGeometry(w, h, d);
    function lowTable(tx, ty, tz, w, d, h, mg) {
      mg.add(bx3(w, 0.06, d), M(tx, ty + h, tz));
      mg.add(bx3(w - 0.16, 0.08, d - 0.16), M(tx, ty + h - 0.07, tz));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) mg.add(bx3(0.07, h, 0.07), M(tx + sx * (w / 2 - 0.07), ty + h / 2, tz + sz * (d / 2 - 0.07)));
    }
    const cushion = (x, y, z, mg) => mg.add(cyl(0.30, 0.33, 0.10, 16), M(x, y + 0.05, z));
    function palaceLantern(lx, top, lz) {
      mMusGold.add(cyl(0.015, 0.015, 0.46, 6), M(lx, top - 0.23, lz));
      mMusGold.add(cyl(0.16, 0.13, 0.06, 12), M(lx, top - 0.47, lz));
      mMusVelvet.add(sph(0.27), M(lx, top - 0.76, lz, 0, 0, 0, 1, 1.15, 1));
      mMusLamp.add(sph(0.08), M(lx, top - 0.76, lz, 0, 0, 0, 3.45, 0.5, 3.45));
      mMusGold.add(cyl(0.13, 0.16, 0.06, 12), M(lx, top - 1.05, lz));
      mMusVelvet.add(cyl(0.03, 0.006, 0.34, 6), M(lx, top - 1.25, lz));
    }
    function wallCanvas(w, h, draw, cw, ch, px, py, pz, ry, lit) {
      const c = document.createElement('canvas'); c.width = cw; c.height = ch;
      draw(c.getContext('2d'), cw, ch);
      const tex = new T.CanvasTexture(c); tex.anisotropy = 4;
      const mat = lit ? new T.MeshLambertMaterial({ map: tex, transparent: true }) : new T.MeshBasicMaterial({ map: tex });
      const me = new T.Mesh(new T.PlaneGeometry(w, h), mat);
      me.position.set(px, py, pz); me.rotation.y = ry || 0;
      group.add(me); made.meshes++; made.textures++;
      return me;
    }
    function standBlock(sx, sy, sz, w, h) {
      mMusDark.add(bx3(w + 0.1, 0.08, w + 0.1), M(sx, sy + 0.04, sz));
      mMusDark.add(bx3(w, h - 0.14, w), M(sx, sy + h / 2 + 0.01, sz));
      mMusGold.add(bx3(w + 0.06, 0.04, w + 0.06), M(sx, sy + h - 0.04, sz));
      mMusGold.add(bx3(0.3, 0.1, 0.012), M(sx, sy + h * 0.55, sz + w / 2 + 0.007));
    }

    function buildThemedInterior(ME) {
      const { x0, z0, x1, z1, y, phil } = ME;
      const id = phil.id, cx = ME.x, cz = ME.z;
      const xi0 = x0 + 1, xi1 = x1, zi0 = z0 + 1, zi1 = z1;

      if (id === 'confucius' || id === 'laozi' || id === 'zhuangzi') {
        const top = y + (ME.hallH || 6);
        for (const lx of [xi0 + 2.2, xi1 - 2.2]) for (const lz of [zi0 + 2.4, zi1 - 2.4]) palaceLantern(lx, top, lz);
      }

      if (id === 'confucius') {
        // Apricot-altar teaching dais with a low table, guqin & bamboo slips
        const dz = zi0 + 1.55, dy = y + 0.16;
        mMusGold.add(bx3(6.3, 0.05, 2.5), M(cx, y + 0.025, dz));
        mMusWood.add(bx3(6.1, 0.16, 2.3), M(cx, y + 0.08, dz));
        lowTable(cx, dy, dz + 0.2, 1.9, 0.62, 0.36, mMusDark);
        mMusDark.add(bx3(1.25, 0.05, 0.21), M(cx - 0.15, dy + 0.445, dz + 0.2));
        mMusGold.add(bx3(1.15, 0.008, 0.13), M(cx - 0.15, dy + 0.474, dz + 0.2));
        for (let k = 0; k < 3; k++) mMusPage.add(cyl(0.045, 0.045, 0.40, 10), M(cx + 0.70, dy + 0.435 + (k === 2 ? 0.078 : 0), dz + 0.12 + (k === 2 ? 0.045 : k * 0.09), 0, 0, Math.PI / 2));
        cushion(cx, dy, dz - 0.55, mMusVelvet);
        for (const rz of [zi0 + 3.7, zi0 + 4.9]) for (const dx of [-2.4, -0.8, 0.8, 2.4]) cushion(cx + dx, y, rz, mMusBronze);
        // Two-tier bronze bianzhong chime rack along the east side
        const bxr = xi1 - 1.35, za = cz + 2.5, zb = cz + 6.1, len = zb - za;
        for (const pz of [za, zb]) {
          mMusBronze.add(bx3(0.46, 0.12, 0.46), M(bxr, y + 0.06, pz));
          mMusVelvet.add(bx3(0.14, 2.05, 0.14), M(bxr, y + 1.08, pz));
          mMusGold.add(sph(0.1), M(bxr, y + 2.16, pz));
        }
        [1.96, 1.14].forEach((by, row) => {
          mMusVelvet.add(bx3(0.12, 0.12, len + 0.5), M(bxr, y + by, (za + zb) / 2));
          for (const ez of [za - 0.27, zb + 0.27]) mMusGold.add(bx3(0.15, 0.15, 0.05), M(bxr, y + by, ez));
          for (let k = 0; k < 6; k++) {
            const sc = (row === 0 ? 0.74 : 1.0) * (1 - k * 0.07), bz = za + (k + 0.5) * len / 6;
            mMusGold.add(cyl(0.012, 0.012, 0.08, 6), M(bxr, y + by - 0.10, bz));
            mMusBronze.add(cyl(0.075 * sc, 0.125 * sc, 0.30 * sc, 12), M(bxr, y + by - 0.14 - 0.15 * sc, bz, 0, 0, 0, 0.72, 1, 1));
          }
        });
      } else if (id === 'laozi') {
        // Taiji & eight-trigram floor medallion
        const tj = wallCanvas(4.2, 4.2, (g, w) => {
          const c = w / 2, R = w * 0.30;
          g.clearRect(0, 0, w, w);
          g.fillStyle = '#f3ead3'; g.beginPath(); g.arc(c, c, w * 0.49, 0, 7); g.fill();
          g.strokeStyle = '#1f2937'; g.lineWidth = 6; g.beginPath(); g.arc(c, c, w * 0.48, 0, 7); g.stroke();
          g.fillStyle = '#f8fafc'; g.beginPath(); g.arc(c, c, R, 0, 7); g.fill();
          g.fillStyle = '#111827'; g.beginPath(); g.arc(c, c, R, -Math.PI / 2, Math.PI / 2); g.fill();
          g.beginPath(); g.arc(c, c - R / 2, R / 2, 0, 7); g.fill();
          g.fillStyle = '#f8fafc'; g.beginPath(); g.arc(c, c + R / 2, R / 2, 0, 7); g.fill();
          g.beginPath(); g.arc(c, c - R / 2, R / 8, 0, 7); g.fill();
          g.fillStyle = '#111827'; g.beginPath(); g.arc(c, c + R / 2, R / 8, 0, 7); g.fill();
          g.strokeStyle = '#111827'; g.lineWidth = 3; g.beginPath(); g.arc(c, c, R, 0, 7); g.stroke();
          const TRI = [[1, 1, 1], [0, 1, 1], [1, 0, 1], [0, 0, 1], [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0]];
          TRI.forEach((bars, k) => {
            g.save(); g.translate(c, c); g.rotate(k * Math.PI / 4); g.fillStyle = '#1f2937';
            bars.forEach((solid, r) => {
              const yy = -w * 0.365 - r * w * 0.03, bw = w * 0.10, bh = w * 0.017;
              if (solid) g.fillRect(-bw / 2, yy, bw, bh);
              else { g.fillRect(-bw / 2, yy, bw * 0.4, bh); g.fillRect(bw * 0.1, yy, bw * 0.4, bh); }
            });
            g.restore();
          });
        }, 512, 512, cx, y + 0.02, cz - 0.2, 0, true);
        tj.rotation.x = -Math.PI / 2;
        tj.material.polygonOffset = true; tj.material.polygonOffsetFactor = -2;
        // Celadon vessel — "当其无，有器之用"
        const vx = xi0 + 1.7, vz = zi0 + 1.7;
        standBlock(vx, y, vz, 0.8, 0.62);
        const prof = [[0.13, 0], [0.30, 0.07], [0.37, 0.30], [0.30, 0.56], [0.13, 0.72], [0.105, 0.84], [0.18, 0.92]].map((p) => new T.Vector2(p[0], p[1]));
        mMusCeladon.add(new T.LatheGeometry(prof, 24), M(vx, y + 0.62, vz));
        // Bronze tripod censer with incense
        const ex = xi1 - 1.7, ez = zi0 + 1.7;
        for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5; mMusBronze.add(cyl(0.05, 0.035, 0.5, 8), M(ex + Math.cos(a) * 0.26, y + 0.25, ez + Math.sin(a) * 0.26)); }
        mMusBronze.add(sph(0.42), M(ex, y + 0.70, ez, 0, 0, 0, 1, 0.62, 1));
        mMusBronze.add(torus(0.39, 0.04), M(ex, y + 0.86, ez, Math.PI / 2, 0, 0));
        for (const sd of [-1, 1]) mMusBronze.add(torus(0.09, 0.025), M(ex + sd * 0.40, y + 0.96, ez, 0, Math.PI / 2, 0));
        for (let k = 0; k < 3; k++) {
          mMusVelvet.add(cyl(0.008, 0.008, 0.36, 5), M(ex - 0.08 + k * 0.08, y + 1.02, ez));
          mMusLamp.add(sph(0.016), M(ex - 0.08 + k * 0.08, y + 1.21, ez));
        }
        // Low table with an unrolled silk manuscript, two cushions
        const tx = xi0 + 1.5, tz = cz + 3.1;
        lowTable(tx, y, tz, 0.66, 1.7, 0.36, mMusDark);
        mMusPage.add(bx3(0.42, 0.012, 1.15), M(tx, y + 0.40, tz));
        for (const sz of [-0.6, 0.6]) mMusPage.add(cyl(0.04, 0.04, 0.48, 10), M(tx, y + 0.43, tz + sz, 0, 0, Math.PI / 2));
        cushion(tx + 0.75, y, tz - 0.4, mMusVelvet); cushion(tx + 0.75, y, tz + 0.4, mMusVelvet);
      } else if (id === 'zhuangzi') {
        // A drift of butterflies under the ceiling
        const wingGeo = (side) => { const g = new T.PlaneGeometry(0.2, 0.17); g.rotateX(-Math.PI / 2); g.translate(side * 0.1, 0, 0); return g; };
        for (let k = 0; k < 12; k++) {
          const a = k * 2.399, rad = 1.1 + (k % 4) * 0.55, bx = cx + Math.cos(a) * rad, bz = cz - 0.3 + Math.sin(a) * rad, by = y + 2.5 + ((k * 7) % 5) * 0.32;
          const mg = k % 2 ? mMusWingB : mMusWingA, heading = a * 1.7, dih = 0.35 + (k % 3) * 0.25;
          mg.add(wingGeo(1), M(bx, by, bz, 0, heading, dih));
          mg.add(wingGeo(-1), M(bx, by, bz, 0, heading, -dih));
          mMusDark.add(cyl(0.012, 0.012, 0.16, 5), M(bx, by, bz, Math.PI / 2, 0, heading));
        }
        // Fish bowl — the debate on the bridge over the Hao
        const fx = xi0 + 1.7, fz = zi0 + 1.7;
        standBlock(fx, y, fz, 0.8, 0.62);
        mMusCeladon.add(sph(0.36), M(fx, y + 0.90, fz, 0, 0, 0, 1, 0.5, 1));
        mMusGlass.add(sph(0.42), M(fx, y + 1.0, fz, 0, 0, 0, 1, 0.84, 1));
        mMusWingA.add(sph(0.07), M(fx - 0.12, y + 1.11, fz + 0.05, 0, 0.5, 0, 1.8, 0.8, 0.6));
        mMusWingA.add(sph(0.06), M(fx + 0.13, y + 1.10, fz - 0.08, 0, -0.9, 0, 1.8, 0.8, 0.6));
        // The great gourd
        const gx = xi1 - 1.7, gz = zi0 + 1.7;
        standBlock(gx, y, gz, 0.8, 0.62);
        mMusPage.add(sph(0.30), M(gx, y + 0.90, gz));
        mMusPage.add(sph(0.19), M(gx, y + 1.30, gz));
        mMusDark.add(cyl(0.02, 0.03, 0.14, 6), M(gx, y + 1.52, gz, 0, 0, 0.3));
        mMusVelvet.add(torus(0.13, 0.02), M(gx, y + 1.14, gz, Math.PI / 2, 0, 0));
        // Tea table
        const tx = xi0 + 1.7, tz = cz + 3.1;
        lowTable(tx, y, tz, 1.0, 1.0, 0.34, mMusDark);
        mMusCeladon.add(sph(0.13), M(tx, y + 0.49, tz, 0, 0, 0, 1, 0.85, 1));
        mMusCeladon.add(cyl(0.02, 0.03, 0.16, 6), M(tx + 0.15, y + 0.50, tz, 0, 0, -0.9));
        mMusCeladon.add(sph(0.03), M(tx, y + 0.61, tz));
        for (const s2 of [-1, 1]) mMusCeladon.add(cyl(0.045, 0.032, 0.06, 10), M(tx - 0.1, y + 0.40, tz + s2 * 0.3));
        cushion(tx, y, tz - 0.85, mMusBronze); cushion(tx, y, tz + 0.85, mMusBronze);
      } else if (id === 'kant') {
        // Ground-floor study: writing desk, chair & the punctual longcase clock
        const dx = xi1 - 2.3, dz = zi0 + 2.7;
        mMusWood.add(bx3(1.55, 0.07, 0.78), M(dx, y + 0.775, dz));
        for (const sd of [-1, 1]) mMusDark.add(bx3(0.42, 0.74, 0.70), M(dx + sd * 0.52, y + 0.37, dz));
        mMusPage.add(bx3(0.30, 0.012, 0.42), M(dx - 0.1, y + 0.817, dz + 0.05, 0, 0.15, 0));
        mMusPage.add(bx3(0.30, 0.03, 0.42), M(dx + 0.42, y + 0.826, dz, 0, -0.08, 0));
        mMusDark.add(cyl(0.045, 0.055, 0.07, 10), M(dx - 0.42, y + 0.845, dz - 0.18));
        mMusPage.add(cyl(0.006, 0.014, 0.34, 5), M(dx - 0.40, y + 0.99, dz - 0.16, 0.3, 0, -0.35));
        mMusGold.add(cyl(0.07, 0.09, 0.03, 12), M(dx + 0.55, y + 0.825, dz - 0.24));
        mMusGold.add(cyl(0.018, 0.018, 0.2, 8), M(dx + 0.55, y + 0.93, dz - 0.24));
        mMusPage.add(cyl(0.022, 0.022, 0.16, 8), M(dx + 0.55, y + 1.10, dz - 0.24));
        mMusLamp.add(sph(0.03), M(dx + 0.55, y + 1.21, dz - 0.24, 0, 0, 0, 1, 1.6, 1));
        mMusDark.add(bx3(0.46, 0.05, 0.44), M(dx, y + 0.47, dz + 0.80));
        mMusVelvet.add(bx3(0.40, 0.04, 0.38), M(dx, y + 0.51, dz + 0.80));
        mMusDark.add(bx3(0.46, 0.60, 0.05), M(dx, y + 0.80, dz + 1.02));
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) mMusDark.add(bx3(0.05, 0.46, 0.05), M(dx + sx * 0.2, y + 0.23, dz + 0.80 + sz * 0.19));
        const kx = cx - 4.7, kz = zi0 + 0.2;
        mMusDark.add(bx3(0.58, 0.14, 0.40), M(kx, y + 0.07, kz));
        mMusDark.add(bx3(0.44, 1.75, 0.30), M(kx, y + 1.01, kz));
        mMusDark.add(bx3(0.60, 0.56, 0.38), M(kx, y + 2.16, kz));
        mMusGold.add(bx3(0.66, 0.05, 0.44), M(kx, y + 2.465, kz));
        mMusGold.add(sph(0.06), M(kx, y + 2.55, kz));
        mMusGold.add(cyl(0.008, 0.008, 0.7, 5), M(kx, y + 1.30, kz + 0.155));
        mMusGold.add(cyl(0.075, 0.075, 0.015, 16), M(kx, y + 0.95, kz + 0.158, Math.PI / 2, 0, 0));
        wallCanvas(0.44, 0.44, (g, w) => {
          const c = w / 2;
          g.fillStyle = '#f5efe0'; g.beginPath(); g.arc(c, c, c - 4, 0, 7); g.fill();
          g.strokeStyle = '#b9934c'; g.lineWidth = 8; g.beginPath(); g.arc(c, c, c - 6, 0, 7); g.stroke();
          g.strokeStyle = '#1f2937';
          for (let k = 0; k < 12; k++) {
            const a = k * Math.PI / 6;
            g.lineWidth = k % 3 === 0 ? 6 : 3;
            g.beginPath(); g.moveTo(c + Math.sin(a) * (c - 22), c - Math.cos(a) * (c - 22)); g.lineTo(c + Math.sin(a) * (c - 38), c - Math.cos(a) * (c - 38)); g.stroke();
          }
          const hand = (a, len, lw) => { g.lineWidth = lw; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(a) * len, c - Math.cos(a) * len); g.stroke(); };
          hand(Math.PI * 2 * 3.5 / 12, c * 0.48, 8); hand(Math.PI, c * 0.72, 5);
          g.fillStyle = '#b9934c'; g.beginPath(); g.arc(c, c, 8, 0, 7); g.fill();
        }, 256, 256, kx, y + 2.16, kz + 0.196, 0, true);

        // Loft observatory: armillary stand & globe, star chart, the "two things" inscription, telescope, celestial globe
        const fy = y + 5;
        mMusMarble.add(bx3(0.9, 0.12, 0.9), M(cx, fy + 0.06, cz));
        mMusMarble.add(cyl(0.24, 0.30, 0.78, 16), M(cx, fy + 0.51, cz));
        mMusGold.add(cyl(0.34, 0.26, 0.06, 16), M(cx, fy + 0.93, cz));
        mMusGold.add(cyl(0.03, 0.05, 0.5, 8), M(cx, fy + 1.2, cz));
        mMusGold.add(torus(1.06, 0.035), M(cx, fy + 1.9, cz));
        mMusGold.add(cyl(0.018, 0.018, 2.2, 6), M(cx, fy + 1.9, cz, 0, 0, 0.41));
        mMusBlue.add(sph(0.2), M(cx, fy + 1.9, cz));
        const frame = (fx, fyy, fz, w, h, sgn) => {
          mMusGold.add(bx3(0.05, 0.07, w + 0.14), M(fx, fyy + h / 2 + 0.035, fz)); mMusGold.add(bx3(0.05, 0.07, w + 0.14), M(fx, fyy - h / 2 - 0.035, fz));
          for (const s2 of [-1, 1]) mMusGold.add(bx3(0.05, h, 0.07), M(fx, fyy, fz + s2 * (w / 2 + 0.035)));
        };
        wallCanvas(4.4, 2.5, (g, w, h) => {
          const bg = g.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.6);
          bg.addColorStop(0, '#16224a'); bg.addColorStop(1, '#070b1c'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
          const rs = rng(1724);
          for (let k = 0; k < 420; k++) { const r = rs() < 0.07 ? 2.6 : 0.6 + rs() * 1.1; g.fillStyle = `rgba(255,${235 + rs() * 20 | 0},${190 + rs() * 60 | 0},${0.5 + rs() * 0.5})`; g.beginPath(); g.arc(rs() * w, rs() * h, r, 0, 7); g.fill(); }
          g.strokeStyle = 'rgba(201,163,83,.55)'; g.lineWidth = 1.5;
          g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.40, h * 0.40, 0, 0, 7); g.stroke();
          g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.40, h * 0.16, -0.41, 0, 7); g.stroke();
          const cons = [[[150, 150], [215, 120], [280, 140], [330, 200], [300, 265], [230, 250]], [[560, 110], [620, 160], [690, 150], [740, 205], [810, 190]], [[470, 400], [530, 350], [600, 380], [650, 440], [580, 470]], [[820, 380], [870, 330], [930, 360], [900, 430]]];
          g.strokeStyle = 'rgba(186,230,253,.6)'; g.lineWidth = 1.5;
          cons.forEach((pts) => { g.beginPath(); pts.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); pts.forEach((p) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(p[0], p[1], 3.4, 0, 7); g.fill(); }); });
          g.fillStyle = '#dec07c'; g.textAlign = 'center';
          g.font = '600 30px Georgia,serif'; g.fillText('DER BESTIRNTE HIMMEL ÜBER MIR', w / 2, 52);
          g.font = '500 24px "Songti SC","STSong",serif'; g.fillText('头 上 的 星 空', w / 2, h - 30);
        }, 1024, 580, xi0 + 0.05, fy + 2.0, cz + 1.6, Math.PI / 2, false);
        frame(xi0 + 0.06, fy + 2.0, cz + 1.6, 4.4, 2.5);
        wallCanvas(5.7, 2.6, (g, w, h) => {
          g.fillStyle = '#efe6d2'; g.fillRect(0, 0, w, h);
          g.strokeStyle = '#8b6b2e'; g.lineWidth = 5; g.strokeRect(14, 14, w - 28, h - 28);
          g.fillStyle = '#2b2117'; g.textAlign = 'center';
          g.font = 'italic 500 29px Georgia,serif';
          ['Zwei Dinge erfüllen das Gemüt mit immer neuer und zunehmender', 'Bewunderung und Ehrfurcht, je öfter und anhaltender sich das', 'Nachdenken damit beschäftigt: der bestirnte Himmel über mir', 'und das moralische Gesetz in mir.'].forEach((ln, k) => g.fillText(ln, w / 2, 92 + k * 44));
          g.font = '600 31px "Songti SC","STSong",serif'; g.fillStyle = '#7c2d12';
          g.fillText('有两样东西，越是经常而持久地思考，', w / 2, 300); g.fillText('越使心灵充满常新而日增的惊赞与敬畏：', w / 2, 344); g.fillText('我头上的星空，与我心中的道德律。', w / 2, 388);
          g.font = '500 20px Georgia,serif'; g.fillStyle = '#57534e';
          g.fillText('Kritik der praktischen Vernunft (1788), Beschluß', w / 2, 432);
        }, 1024, 466, xi1 - 0.05, fy + 2.0, cz + 1.6, -Math.PI / 2, false);
        frame(xi1 - 0.06, fy + 2.0, cz + 1.6, 5.7, 2.6);
        // Brass refracting telescope on a tripod by the south windows
        const tx = cx + 3.2, tz = zi1 - 2.2;
        for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.3; mMusDark.add(cyl(0.025, 0.035, 1.35, 6), M(tx + Math.cos(a) * 0.3, fy + 0.62, tz + Math.sin(a) * 0.3, Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45)); }
        mMusGold.add(sph(0.07), M(tx, fy + 1.27, tz));
        mMusGold.add(cyl(0.085, 0.06, 1.5, 14), M(tx, fy + 1.42, tz + 0.15, Math.PI / 2 - 0.5, 0, 0));
        mMusDark.add(cyl(0.035, 0.035, 0.18, 10), M(tx, fy + 1.0, tz - 0.6, Math.PI / 2 - 0.5, 0, 0));
        // Celestial globe
        const gx = cx - 3.4, gz = zi1 - 2.2;
        for (let k = 0; k < 3; k++) { const a = k * 2.094; mMusDark.add(cyl(0.03, 0.04, 0.7, 6), M(gx + Math.cos(a) * 0.2, fy + 0.34, gz + Math.sin(a) * 0.2, Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3)); }
        mMusDark.add(torus(0.44, 0.03), M(gx, fy + 0.72, gz, Math.PI / 2, 0, 0));
        mMusBlue.add(sph(0.38), M(gx, fy + 0.86, gz));
        mMusGold.add(torus(0.40, 0.018), M(gx, fy + 0.86, gz, 0, 0, 0.41));
        mMusGold.add(torus(0.385, 0.012), M(gx, fy + 0.86, gz, Math.PI / 2, 0, 0));
      }
    }

    const mTalkWood = new Merger(), mTalkGold = new Merger(), mTalkWhite = new Merger();
    (P.museumExhibits || []).forEach((ME) => {
      const { x, y, z, nZ, wX, eX, isGreekTemple, isTholos, isEastern, isModern, phil } = ME;
      const artStyle = isEastern ? 'eastern' : (isGreekTemple || isTholos) ? 'marble' : isModern ? 'modern' : 'louvre';
      const quoteStyle = isEastern ? 'lacquer' : (isGreekTemple || isTholos) ? 'marble' : isModern ? 'modern' : 'velvet';

      // For Socrates' Open Circular Tholos: build a sleek Pentelic Marble Curved/Segmented Gallery Screen Wall on the North arc!
      if (ME.isSchoolOfAthens) {
        // Mount Plato's museum exhibits cleanly inside the West & East side-aisle gallery walls (cx ± 10.65),
        // keeping the central Bramante nave, Apollo/Athena niches & marble staircase 100% pure!
        mountWallPainting(x - 10.68, y + 2.55, z + 3.0, Math.PI / 2, phil, 'marble');
        mountWallPortrait(x - 10.68, y + 2.55, z - 2.6, Math.PI / 2, phil, 'marble');
        mountWallBookNiche(x + 10.68, y + 1.65, z + 3.0, -Math.PI / 2, phil, true);
        const qMesh = new T.Mesh(new T.PlaneGeometry(3.6, 1.98), new T.MeshBasicMaterial({ map: makeWallQuoteTex(phil, 'marble'), side: T.DoubleSide }));
        qMesh.position.set(x + 10.62, y + 2.55, z - 2.6);
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
        const artY = y + (ME.trimH === 4 ? 2.5 : 2.62);
        mountWallPainting(x - 1.05, artY, nZ, 0, phil, artStyle);
        mountWallPortrait(x + 2.05, artY, nZ, 0, phil, artStyle);

        // 2. WEST INTERIOR WALL: Wikipedia-Grade Museum Biography, Life Timeline & Canonical Quote Wall Panel!
        const qMesh = new T.Mesh(
          new T.PlaneGeometry(4.6, 2.54),
          new T.MeshBasicMaterial({ map: makeWallQuoteTex(phil, quoteStyle), side: T.DoubleSide })
        );
        qMesh.position.set(wX + 0.05, y + 2.32, z - 0.2);
        qMesh.rotation.y = Math.PI / 2;
        group.add(qMesh); made.meshes++;
        mMusGold.add(cyl(0.03, 0.03, 2.2, 8), M(wX + 0.28, y + 3.74, z - 0.2, Math.PI / 2, 0, 0));

        // 3. EAST INTERIOR WALL: Wall-Mounted 3D Floating Magnum Opus Bookshelf with Physical Leather-Bound 3D Books!
        mountWallBookNiche(eX, y + 1.50, z - 0.2, -Math.PI / 2, phil, isModern);
      }

      // 4. VARIED OPEN-FLOOR SCULPTURAL EXHIBITS:
      // (A) Left-Side Glass Museum Vitrine with Open Manuscript on a Velvet Pad
      const xL = x - 2.35, zL = z + 1.15;
      buildVitrine(xL, y, zL, isEastern ? mMusDark : (isGreekTemple || isTholos) ? mMusMarble : mMusWood);
      if (ME.trim) buildGalleryTrim(ME);
      buildThemedInterior(ME);

      // (B) Right-Side Real Sculpted 3D Classical Marble / Antique Bronze Philosopher Portrait Bust on a Fluted Museum Pedestal!
      buildPhilosopherBust(x + 2.35, y, z + 1.15, isEastern || isModern, phil);
      // A small round table and two chairs for the round-table talk (positions match app.js tableOf)
      { const tx = phil.id === 'plato' ? phil.x - 8.4 : x - 3.2, tz = phil.id === 'plato' ? phil.z + 17.2 : z + 3.1;
        mTalkWood.add(cyl(0.55, 0.55, 0.05, 20), M(tx, y + 0.72, tz)); mTalkWood.add(cyl(0.06, 0.09, 0.7, 8), M(tx, y + 0.36, tz)); mTalkWood.add(cyl(0.3, 0.34, 0.04, 14), M(tx, y + 0.02, tz));
        mTalkGold.add(cyl(0.05, 0.07, 0.1, 8), M(tx + 0.12, y + 0.8, tz + 0.1)); mTalkWhite.add(new T.BoxGeometry(0.3, 0.02, 0.22), M(tx - 0.12, y + 0.76, tz - 0.08));
        [-1, 1].forEach((k2) => { const cx = tx + k2 * 0.82; mTalkWood.add(new T.BoxGeometry(0.44, 0.05, 0.44), M(cx, y + 0.44, tz)); mTalkWood.add(new T.BoxGeometry(0.05, 0.6, 0.44), M(cx + k2 * 0.22, y + 0.74, tz));
          [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([dx, dz]) => mTalkWood.add(new T.BoxGeometry(0.05, 0.42, 0.05), M(cx + dx, y + 0.21, tz + dz))); }); }
    });
    mTalkWood.mesh(darkTimberMat); mTalkGold.mesh(goldMat); mTalkWhite.mesh(pentelicMat);

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
    mMusPlaster.mesh(plasterTrimMat);
    mMusCeladon.mesh(celadonMat);
    mMusWingA.mesh(wingAMat);
    mMusWingB.mesh(wingBMat);
    { const gm = mMusGlass.mesh(vitrineGlassMat); if (gm) gm.renderOrder = 5; }

    /* ---------------- 3F. HOLOGRAPHIC CONSOLES (one per hall + the hub in the Thinking Workshop) ---------------- */
    const holoRigs = [];
    (function buildHoloConsoles() {
      const list = P.holoConsoles || [];
      if (!list.length) return;
      const mBody = new Merger(), mGlow = new Merger(), mBeam = new Merger();
      const bodyMat = new T.MeshPhongMaterial({ color: 0x1a2536, specular: 0x8fb4d8, shininess: 60 });
      const glowMat = new T.MeshBasicMaterial({ color: 0x6fe3ff });
      const beamMat = new T.MeshBasicMaterial({ color: 0x46d2ff, transparent: true, opacity: 0.13, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
      const wireMat = new T.LineBasicMaterial({ color: 0x8fe9ff, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false });
      const wireHubMat = new T.LineBasicMaterial({ color: 0xffc46a, transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false });
      const ringMat = new T.MeshBasicMaterial({ color: 0x6fe3ff, transparent: true, opacity: 0.75, blending: T.AdditiveBlending, depthWrite: false });
      const coreMat = new T.MeshBasicMaterial({ color: 0xffb454, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false });
      const icoGeo = new T.EdgesGeometry(new T.IcosahedronGeometry(0.36, 1));
      const octGeo = new T.OctahedronGeometry(0.13, 0);
      const ringGeo = new T.TorusGeometry(0.5, 0.009, 6, 48);
      const labelTex = (text) => {
        const c = document.createElement('canvas'); c.width = 512; c.height = 96;
        const x = c.getContext('2d');
        x.fillStyle = 'rgba(4,14,28,.72)'; x.fillRect(0, 0, 512, 96);
        x.strokeStyle = 'rgba(111,227,255,.8)'; x.lineWidth = 3; x.strokeRect(3, 3, 506, 90);
        x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#dff7ff';
        x.font = `700 38px ${F_SANS}`; x.fillText(text, 256, 50, 480);
        const t = new T.CanvasTexture(c); made.textures++; return t;
      };
      list.forEach((hc, i) => {
        const { x, y, z } = hc, s = hc.hub ? 1.35 : 1;
        mBody.add(cyl(0.62 * s, 0.70 * s, 0.14, 6), M(x, y + 0.07, z));
        mBody.add(cyl(0.26 * s, 0.38 * s, 0.56, 6), M(x, y + 0.42, z));
        mBody.add(cyl(0.56 * s, 0.40 * s, 0.12, 6), M(x, y + 0.76, z));
        mBody.add(new T.BoxGeometry(0.46 * s, 0.03, 0.26), M(x, y + 0.80, z + 0.52 * s, 0.75, 0, 0));
        mGlow.add(new T.BoxGeometry(0.38 * s, 0.012, 0.18), M(x, y + 0.815, z + 0.53 * s, 0.75, 0, 0));
        mGlow.add(torus(0.57 * s, 0.014), M(x, y + 0.825, z, Math.PI / 2, 0, 0));
        mGlow.add(torus(0.66 * s, 0.012), M(x, y + 0.15, z, Math.PI / 2, 0, 0));
        mGlow.add(cyl(0.2 * s, 0.2 * s, 0.02, 20), M(x, y + 0.83, z));
        mBeam.add(new T.CylinderGeometry(0.66 * s, 0.18 * s, 1.15 * s, 28, 1, true), M(x, y + 0.84 + 0.575 * s, z));
        const rig = new T.Group();
        rig.position.set(x, y + 0.84 + 0.72 * s, z);
        rig.scale.setScalar(s);
        const ico = new T.LineSegments(icoGeo, hc.hub ? wireHubMat : wireMat);
        const core = new T.Mesh(octGeo, coreMat);
        const r1 = new T.Mesh(ringGeo, ringMat), r2 = new T.Mesh(ringGeo, ringMat);
        r2.scale.setScalar(0.8);
        rig.add(ico, core, r1, r2);
        group.add(rig); made.meshes += 4;
        const sp = new T.Sprite(new T.SpriteMaterial({ map: labelTex(hc.hub ? '全息操作台 · 全部模型' : '全息操作台'), transparent: true, depthWrite: false }));
        sp.scale.set(1.5 * s, 0.28 * s, 1);
        sp.position.set(x, y + 0.84 + 1.45 * s, z);
        group.add(sp); made.meshes++;
        holoRigs.push({ rig, ico, core, r1, r2, baseY: rig.position.y, ph: i * 1.7 });
      });
      mBody.mesh(bodyMat);
      mGlow.mesh(glowMat);
      const bm = mBeam.mesh(beamMat); if (bm) bm.renderOrder = 4;
    })();

    /* ---------------- 4. SLEEK MUSEUM PORTAL CRYSTAL PLINTHS & WATERWHEELS ---------------- */
    const floatingCrystals = [];
    const octGeo = new T.OctahedronGeometry(0.24, 0);
    const ringGeo = new T.TorusGeometry(0.38, 0.026, 8, 24);
    const mPortalPlinth = new Merger(), mPortalBrass = new Merger();
    (P.philosopherPlaques || []).forEach((item) => {
      const { x, y, z, phil } = item;
      // Sleek, low-profile fluted marble & antique-brass museum plinth (height 0.72m — never blocks the oil painting behind!)
      mPortalPlinth.add(new T.BoxGeometry(0.56, 0.12, 0.56), M(x, y + 0.06, z));
      mPortalPlinth.add(cyl(0.18, 0.22, 0.54, 14), M(x, y + 0.39, z));
      mPortalBrass.add(new T.BoxGeometry(0.48, 0.06, 0.48), M(x, y + 0.69, z));
      const crystal = new T.Mesh(octGeo, crystalMat);
      crystal.position.set(x, y + 1.08, z);
      const halo = new T.Mesh(ringGeo, goldMat);
      halo.position.set(x, y + 1.08, z);
      group.add(crystal, halo);
      floatingCrystals.push({ crystal, halo, baseY: y + 1.08, phase: phil.num * 0.7 });
      made.meshes += 2;
    });
    mPortalPlinth.mesh(pentelicMat);
    mPortalBrass.mesh(goldMat);

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
        // Place the 5 Platonic Solids in an elegant east-side geometry sculpture garden so the front Raphael plaza stays 100% pure!
        const px = plato.x + 15.2;
        const pz = plato.z - 8 + idx * 4.5;
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
        const stepZ = p.id === 'socrates' ? p.z + 9.2 : p.id === 'plato' ? z1 + 1.8 : z1 + 2.8;
        const spreadX = p.id === 'plato' ? 12.8 : 2.6;
        for (const side of [-1, 1]) {
          const ax = p.x + 0.5 + side * spreadX;
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

          // Sculpted Terracotta Urns with Molded Rim & Organic Multi-Cluster Botanical Foliage (no cartoon lollipop spheres!)
          const px = p.x + 0.5 + side * 2.85;
          mTrimStone.add(new T.BoxGeometry(0.58, 0.14, 0.58), M(px, gy + 0.07, z1 + 1.75));
          mTrimTerracotta.add(cyl(0.28, 0.18, 0.46, 14), M(px, gy + 0.37, z1 + 1.75));
          mTrimTerracotta.add(torus(0.28, 0.038), M(px, gy + 0.61, z1 + 1.75, Math.PI / 2));
          // Natural multi-tuft Mediterranean boxwood/olive foliage cluster + subtle floral accents
          mTrimLeaf.add(sph(0.28), M(px, gy + 0.84, z1 + 1.75, 0, 0, 0, 1.1, 0.95, 1.1));
          mTrimLeaf.add(sph(0.21), M(px - 0.16, gy + 0.78, z1 + 1.85));
          mTrimLeaf.add(sph(0.20), M(px + 0.17, gy + 0.82, z1 + 1.66));
          mTrimLeaf.add(sph(0.18), M(px + 0.04, gy + 1.06, z1 + 1.74));
          mTrimFlowerGold.add(sph(0.055), M(px - 0.12, gy + 0.96, z1 + 1.92));
          mTrimFlowerLav.add(sph(0.055), M(px + 0.14, gy + 0.98, z1 + 1.84));

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

    function update(dt, time, cam, night) {
      for (const h of holoRigs) {
        h.rig.position.y = h.baseY + Math.sin(time * 1.1 + h.ph) * 0.04;
        h.ico.rotation.y = time * 0.5 + h.ph; h.ico.rotation.x = Math.sin(time * 0.3 + h.ph) * 0.3;
        h.core.rotation.y = -time * 1.4; h.core.rotation.z = time * 0.9;
        h.r1.rotation.set(Math.PI / 2 + Math.sin(time * 0.7 + h.ph) * 0.5, time * 0.8, 0);
        h.r2.rotation.set(time * 0.6 + h.ph, Math.PI / 2, time * 0.4);
      }
      if (saClouds.length) {
        const op = Math.max(0.06, 0.82 * (1 - (night || 0) * 0.92));
        for (const cm of saClouds) cm.opacity = op;
      }
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
