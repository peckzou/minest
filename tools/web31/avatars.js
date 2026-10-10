  // Minest Live avatars — 50 cute characters in a ClassDojo-like style: a round, chunky head, flat colours with a soft
  // light from the top left, big shiny eyes, rosy cheeks. Ocean animals, zoo animals and a few friendly monsters.
  // The ids are the old ones (monster-sunny … monster-night, monster-09 … monster-50), so saved avatars stay.
  var MNAV = (function () {
    var DK = '#2b2140';
    function c(x, y, r, f, ex) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '"' + (ex || '') + '/>'; }
    function e(x, y, rx, ry, f, rot, ex) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '"' + (rot ? ' transform="rotate(' + rot + ' ' + x + ' ' + y + ')"' : '') + (ex || '') + '/>'; }
    function p(d, f, ex) { return '<path d="' + d + '" fill="' + f + '"' + (ex || '') + '/>'; }
    function s(d, col, w) { return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + (w || 2.6) + '" stroke-linecap="round" stroke-linejoin="round"/>'; }
    function eye(x, y, k) { k = k || 1; return e(x, y, 4.4 * k, 5.2 * k, DK) + c(x + 1.5 * k, y - 2 * k, 1.7 * k, '#fff') + c(x - 1.3 * k, y + 1.9 * k, 0.8 * k, '#fff'); }
    function eyes(y, dx, k) { return eye(50 - dx, y, k) + eye(50 + dx, y, k); }
    function happy(y, dx) { return s('M' + (50 - dx - 4.5) + ' ' + y + ' q4.5 -4.5 9 0', DK, 2.8) + s('M' + (50 + dx - 4.5) + ' ' + y + ' q4.5 -4.5 9 0', DK, 2.8); }
    function cheeks(y, dx, col) { return e(50 - dx, y, 5, 3.2, col || '#ff7fa3', 0, ' opacity=".5"') + e(50 + dx, y, 5, 3.2, col || '#ff7fa3', 0, ' opacity=".5"'); }
    function smile(y, w) { w = w || 5; return s('M' + (50 - w) + ' ' + y + ' q' + w + ' ' + (w * 0.85) + ' ' + (2 * w) + ' 0', DK, 2.6); }
    function wm(y) { return s('M44 ' + y + ' q3 3.4 6 0 q3 3.4 6 0', DK, 2.4); }
    function open(y, w, h) { w = w || 6; h = h || 6; return p('M' + (50 - w) + ' ' + y + ' q' + w + ' ' + (h * 1.9) + ' ' + (2 * w) + ' 0 z', '#7a2440') + e(50, y + h * 0.62, w * 0.55, h * 0.36, '#ff7b9c'); }
    function mirror(svg) { return '<g transform="translate(100 0) scale(-1 1)">' + svg + '</g>'; }
    function both(svg) { return svg + mirror(svg); }
    function ring(n, R, r, col, cx, cy) { var o = ''; for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2; o += c((cx || 50) + Math.cos(a) * R, (cy || 56) + Math.sin(a) * R, r, col); } return o; }
    function spikes(n, r0, r1, col) { var o = ''; for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2, b = 0.18; o += p('M' + (50 + Math.cos(a - b) * r0) + ' ' + (56 + Math.sin(a - b) * r0) + ' L' + (50 + Math.cos(a) * r1) + ' ' + (56 + Math.sin(a) * r1) + ' L' + (50 + Math.cos(a + b) * r0) + ' ' + (56 + Math.sin(a + b) * r0) + ' Z', col, ' stroke="' + col + '" stroke-width="2" stroke-linejoin="round"'); } return o; }
    function star(R, r) { var d = ''; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; d += (i ? ' L' : 'M') + (50 + Math.cos(a) * q).toFixed(1) + ' ' + (57 + Math.sin(a) * q).toFixed(1); } return d + ' Z'; }
    function shade(hex, k) { var n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255; function f(v) { return Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); } return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1); }

    // each: [id, name, colour, back (behind the head), front (on the head), head (optional, its own shape)] — G = the head's fill
    var L = [
      ['monster-sunny', 'Sea Otter', '#a9724b', both(c(25, 33, 8, '#7c4f30') + c(25, 33, 4, '#e2b48c')),
        e(50, 68, 21, 15, '#f3dcc0') + eyes(54, 12) + e(50, 62, 5, 3.6, DK) + wm(67) + both(c(39, 68, 1.1, DK) + c(36, 65, 1.1, DK)) + cheeks(65, 21)],
      ['monster-berry', 'Penguin', '#334155', '',
        p('M50 40C38 32 22 44 26 62C29 80 42 86 50 86C58 86 71 80 74 62C78 44 62 32 50 40Z', '#fff') + eyes(56, 10) + p('M44 64L56 64L50 71Z', '#fb923c') + cheeks(66, 17)],
      ['monster-mint', 'Sea Turtle', '#86d99b', '',
        p('M18 52C18 30 34 18 50 18C66 18 82 30 82 52C70 45 30 45 18 52Z', '#2f855a') + s('M38 30L45 25L55 25L62 30L58 40L42 40Z', '#1f6b45', 2) + s('M28 44L38 30M72 44L62 30M42 40L40 46M58 40L60 46', '#1f6b45', 2) + eyes(59, 11) + smile(69, 5) + cheeks(67, 20)],
      ['monster-sky', 'Dolphin', '#5aa9e6', p('M52 27C56 12 66 7 73 9C67 15 64 23 64 31Z', '#3b82c4'),
        e(50, 72, 15, 10, '#cde7fb') + eyes(53, 12) + s('M41 72q9 6 18 0', '#2b6a9e', 2.4) + c(50, 31, 2, '#2b6a9e') + cheeks(64, 21)],
      ['monster-lilac', 'Bunny', '#efe3ff', e(38, 22, 8, 20, '#e3d0fb', -10) + e(62, 22, 8, 20, '#e3d0fb', 10) + e(38, 24, 4, 13, '#fbb6ce', -10) + e(62, 24, 4, 13, '#fbb6ce', 10),
        eyes(55, 11) + p('M47 63h6l-3 3.5z', '#f472b6') + wm(67) + '<rect x="47.5" y="69" width="5" height="4.5" rx="1" fill="#fff" stroke="#d8c7ee" stroke-width=".6"/>' + cheeks(64, 20)],
      ['monster-coral', 'Fox', '#f97316', both(p('M22 40L18 11L43 27Z', '#ea580c') + p('M21 19L18 11L27 16Z', DK)),
        p('M18 60C26 58 40 62 50 74C60 62 74 58 82 60C80 78 66 88 50 88C34 88 20 78 18 60Z', '#fff7ed') + eyes(54, 12) + e(50, 71, 4.5, 3.2, DK) + smile(76, 3.5) + cheeks(65, 22)],
      ['monster-lime', 'Panda', '#f8fafc', both(c(24, 30, 9, DK)),
        e(38, 55, 8, 10, DK, -25) + e(62, 55, 8, 10, DK, 25) + both(c(39, 55, 3.8, '#fff') + c(39.6, 55.6, 2, DK) + c(40.4, 54.2, .8, '#fff')) + e(50, 66, 4.5, 3.2, DK) + wm(70) + cheeks(69, 23)],
      ['monster-night', 'Lion', '#fbbf24', c(50, 56, 38, '#ea580c') + ring(14, 37, 9, '#ea580c') + both(c(29, 31, 7, '#f59e0b')),
        e(50, 69, 14, 10, '#fde68a') + eyes(54, 11) + p('M45 64h10l-5 5z', '#7c2d12') + wm(71) + cheeks(64, 18), c(50, 57, 29, 'G')],
      ['monster-09', 'Seal', '#94a3b8', '',
        e(43, 67, 8, 6.5, '#e2e8f0') + e(57, 67, 8, 6.5, '#e2e8f0') + e(50, 62, 4.5, 3.2, DK) + eyes(52, 12, 1.1) + both(c(41, 67, 1, '#64748b') + c(39, 70, 1, '#64748b')) + s('M47 74q3 2 6 0', DK, 2) + c(30, 40, 2.2, '#7b8ba1') + c(68, 35, 2.6, '#7b8ba1') + c(74, 46, 1.8, '#7b8ba1') + cheeks(61, 23)],
      ['monster-10', 'Clownfish', '#fb923c', p('M40 28Q50 8 63 26Z', '#f97316', ' stroke="' + DK + '" stroke-width="1.6"') + p('M80 56Q97 45 93 67Z', '#f97316', ' stroke="' + DK + '" stroke-width="1.6"'),
        p('M29 30Q37 56 29 84Q20 76 18 56Q20 38 29 30Z', '#fff', ' stroke="' + DK + '" stroke-width="1.6"') + p('M66 27Q74 56 66 85L58 85Q66 56 58 27Z', '#fff', ' stroke="' + DK + '" stroke-width="1.6"') + eye(42, 52) + eye(52, 52) + c(47, 67, 3, '#7a2440') + e(38, 62, 4, 2.6, '#ff7fa3', 0, ' opacity=".5"'), e(50, 56, 33, 30, 'G')],
      ['monster-11', 'Walrus', '#b07a5a', '',
        p('M43 71L45 89L48 72Z', '#fffaf0') + p('M57 71L55 89L52 72Z', '#fffaf0') + e(42, 66, 10, 8, '#d9a77f') + e(58, 66, 10, 8, '#d9a77f') + e(50, 60, 4.5, 3, DK) + both(c(40, 66, 1, '#7c4f30') + c(38, 69, 1, '#7c4f30') + c(43, 70, 1, '#7c4f30')) + eyes(49, 12) + cheeks(57, 23)],
      ['monster-12', 'Starfish', '#f472b6', '',
        c(50, 40, 2, '#fbcfe8') + c(30, 50, 2, '#fbcfe8') + c(70, 50, 2, '#fbcfe8') + c(38, 76, 2, '#fbcfe8') + c(62, 76, 2, '#fbcfe8') + eyes(55, 8, .9) + smile(64, 4) + cheeks(62, 14),
        p(star(42, 21), 'G', ' stroke="G" stroke-width="10" stroke-linejoin="round"')],
      ['monster-13', 'Axolotl', '#f9a8d4', both(s('M24 46Q12 40 8 31', '#ec4899', 6) + s('M21 56Q10 56 4 54', '#ec4899', 6) + s('M24 66Q12 70 9 79', '#ec4899', 6) + c(8, 31, 3.6, '#f472b6') + c(4, 54, 3.6, '#f472b6') + c(9, 79, 3.6, '#f472b6')),
        eyes(54, 14, .9) + s('M38 65Q50 73 62 65', DK, 2.6) + cheeks(63, 23), e(50, 58, 30, 27, 'G')],
      ['monster-14', 'Narwhal', '#7dd3fc', p('M47 26L50 1L53 26Z', '#fde68a') + s('M48 20l4-2M48.5 14l3-1.5M49 8l2-1', '#d4a72c', 1.5),
        eyes(56, 11) + smile(67, 5) + c(31, 44, 2, '#4fb0e0') + c(68, 38, 2.4, '#4fb0e0') + c(73, 50, 1.6, '#4fb0e0') + cheeks(65, 21)],
      ['monster-15', 'Jellyfish', '#c4b5fd', s('M32 64q-5 10 1 18q5 6-1 12', '#a78bfa', 4) + s('M41 66q-4 10 1 17q4 6 0 11', '#a78bfa', 4) + s('M50 66q-3 10 1 18q3 6 0 10', '#a78bfa', 4) + s('M59 66q-4 10 1 17q4 6 0 11', '#a78bfa', 4) + s('M68 64q-5 10 1 18q5 6-1 12', '#a78bfa', 4),
        eyes(48, 11) + smile(57, 4) + cheeks(55, 21) + c(37, 33, 2.6, 'rgba(255,255,255,.55)') + c(62, 30, 1.8, 'rgba(255,255,255,.55)'),
        p('M18 64C18 34 32 22 50 22C68 22 82 34 82 64Q75 70 66 64Q58 70 50 64Q42 70 34 64Q25 70 18 64Z', 'G')],
      ['monster-16', 'Seahorse', '#facc15', p('M38 28l4-11l4 9l4-11l4 11l4-9l3 11Z', '#f59e0b') + e(80, 62, 13, 6.5, '#fbbf24') + c(92, 62, 3, '#f59e0b'),
        eyes(53, 10) + smile(64, 4) + s('M30 76q20 9 40 0', '#eab308', 2) + s('M33 82q17 7 34 0', '#eab308', 2) + cheeks(62, 19)],
      ['monster-17', 'Pufferfish', '#fde047', spikes(16, 28, 41, '#eab308'),
        e(50, 69, 22, 14, '#fef9c3') + eyes(52, 12, 1.15) + c(50, 70, 3.4, '#7a2440') + cheeks(62, 22)],
      ['monster-18', 'Blue Whale', '#3b82f6', s('M50 27Q46 16 39 14', '#93c5fd', 3) + s('M50 27Q54 16 61 14', '#93c5fd', 3) + c(50, 21, 2.6, '#bfdbfe'),
        p('M15 63Q50 93 85 63Q77 85 50 89Q23 85 15 63Z', '#bfdbfe') + s('M30 76q20 7 40 0M36 82q14 5 28 0', '#93c5fd', 1.6) + eyes(54, 14) + smile(64, 6) + cheeks(63, 25), e(50, 58, 36, 31, 'G')],
      ['monster-19', 'Octopus', '#fb7185', e(28, 83, 7, 9, '#f43f5e', 20) + e(42, 88, 7, 9, '#f43f5e', 8) + e(58, 88, 7, 9, '#f43f5e', -8) + e(72, 83, 7, 9, '#f43f5e', -20),
        c(36, 31, 3, '#fda4af') + c(60, 28, 2.2, '#fda4af') + c(68, 40, 2.6, '#fda4af') + eyes(53, 11) + smile(64, 5) + cheeks(61, 20), e(50, 51, 31, 32, 'G')],
      ['monster-20', 'Shark', '#94a3b8', p('M44 27C50 8 60 3 67 5C61 11 58 19 58 29Z', '#64748b'),
        p('M19 62Q50 92 81 62Q75 85 50 89Q25 85 19 62Z', '#f1f5f9') + s('M36 68Q50 78 64 68', DK, 2.4) + p('M40 70.5l2.5 4l2.5-3.2ZM47.5 73l2.5 4l2.5-4ZM55 71.3l2.5 3.2l2.5-4Z', '#fff', ' stroke="#cbd5e1" stroke-width=".6"') + eyes(52, 13) + s('M24 50q-2 4 0 8M28 48q-2 5 0 10', '#64748b', 1.8) + cheeks(62, 23)],
      ['monster-21', 'Crab', '#ef4444', s('M40 34L36 17', '#dc2626', 4) + s('M60 34L64 17', '#dc2626', 4) + both(p('M20 48C5 46 3 30 13 25L20 34L12 37C14 43 20 43 22 41Z', '#dc2626')),
        c(36, 15, 6.5, '#fff') + eye(36, 15.5, .72) + c(64, 15, 6.5, '#fff') + eye(64, 15.5, .72) + s('M38 64Q50 74 62 64', DK, 2.6) + cheeks(61, 20) + c(32, 72, 1.8, '#fca5a5') + c(68, 72, 1.8, '#fca5a5'), e(50, 58, 31, 27, 'G')],
      ['monster-22', 'Koala', '#9ca3af', both(c(20, 36, 14, '#9ca3af') + c(20, 36, 8, '#f1f5f9')),
        e(50, 62, 7, 9, '#3f3f46') + c(48, 58, 1.6, 'rgba(255,255,255,.35)') + eyes(52, 15) + s('M46 75q4 3 8 0', DK, 2) + cheeks(67, 21)],
      ['monster-23', 'Giraffe', '#fcd34d', s('M40 29L37 12', '#b45309', 4) + c(37, 11, 4, '#92400e') + s('M60 29L63 12', '#b45309', 4) + c(63, 11, 4, '#92400e') + e(19, 41, 9, 5, '#fbbf24', -25) + e(81, 41, 9, 5, '#fbbf24', 25),
        c(30, 41, 4, '#d97706') + c(67, 34, 5, '#d97706') + c(74, 50, 3.4, '#d97706') + c(38, 30, 2.6, '#d97706') + e(50, 70, 16, 11, '#fde68a') + c(45, 68, 1.6, '#92400e') + c(55, 68, 1.6, '#92400e') + eyes(54, 12) + smile(75, 4) + cheeks(64, 23)],
      ['monster-24', 'Red Panda', '#ea580c', both(p('M20 40L22 15L42 28Z', '#c2410c') + p('M25 34L26 21L36 28Z', '#fff7ed')),
        e(50, 70, 15, 11, '#fff7ed') + both(e(38, 44, 5, 3, '#fff7ed') + s('M37 60Q35 68 39 75', '#7c2d12', 3)) + eyes(54, 12) + e(50, 66, 4, 3, DK) + smile(72, 3.5)],
      ['monster-25', 'Polar Bear', '#f1f5f9', both(c(26, 30, 8, '#e2e8f0') + c(26, 30, 4, '#cbd5e1')),
        e(50, 68, 15, 11, '#fff', 0, ' stroke="#e2e8f0" stroke-width="1.2"') + e(50, 64, 5, 3.6, DK) + wm(70) + eyes(54, 12) + cheeks(64, 23)],
      ['monster-26', 'Zebra', '#f8fafc', p('M37 27L41 14L46 25L50 11L54 25L59 14L63 27Z', DK) + both(e(26, 31, 6, 11, '#f8fafc', -30) + e(24, 25, 3.4, 5, DK, -30)),
        both(s('M20 46q8 3 11 11M19 58q7 1 10 7M36 30q4 4 4 11', DK, 3.2)) + e(50, 72, 16, 12, '#a1a1aa') + c(45, 72, 1.9, DK) + c(55, 72, 1.9, DK) + eyes(54, 12) + s('M46 79q4 2 8 0', DK, 2)],
      ['monster-27', 'Capybara', '#b98b5e', both(c(28, 31, 5, '#8b5e34')) + c(50, 23, 7, '#fb923c') + p('M50 16q4-5 8-2q-4 3-8 2Z', '#22c55e'),
        e(50, 70, 17, 12, '#a0714a') + e(45, 66, 2, 1.4, DK) + e(55, 66, 2, 1.4, DK) + s('M33 52q5 3 10 0M57 52q5 3 10 0', DK, 2.6) + s('M46 76q4 2 8 0', DK, 2) + cheeks(60, 22),
        '<rect x="20" y="27" width="60" height="60" rx="27" fill="G"/>'],
      ['monster-28', 'Flamingo', '#f9a8d4', p('M48 26q-6-10 2-17q2 8 6 4q0 8-4 13Z', '#f472b6'),
        p('M46 62Q58 58 62 70Q60 80 52 80Q56 72 46 68Z', '#fde4f0') + p('M56 77Q60 75 62 70Q61 80 52 80Z', DK) + eyes(52, 12) + cheeks(63, 22)],
      ['monster-29', 'Puppy', '#f5d0a9', '',
        e(23, 54, 9, 19, '#a16207', 15) + e(77, 54, 9, 19, '#a16207', -15) + e(62, 49, 9, 8, '#d6a26a') + eyes(52, 11) + e(50, 62, 5, 3.6, DK) + s('M44 66q3 3 6 0q3 3 6 0', DK, 2.4) + e(50, 72, 4, 5, '#fb7185') + cheeks(64, 20)],
      ['monster-30', 'Kitten', '#fdba74', both(p('M20 42L22 13L44 30Z', '#fb923c') + p('M25 36L26 21L37 29Z', '#fbcfe8')),
        s('M44 30l2 8M50 28v9M56 30l-2 8', '#ea580c', 2.6) + eyes(54, 12) + p('M47.5 62h5l-2.5 3z', '#f472b6') + wm(66) + both(s('M18 61L34 63M18 67L34 66', '#9a3412', 1.4)) + cheeks(67, 21)],
      ['monster-31', 'Owl', '#8b5e3c', both(p('M22 34L20 13L37 28Z', '#6b4423')),
        c(38, 52, 12, '#f5e6d3') + c(62, 52, 12, '#f5e6d3') + eye(38, 52, 1.3) + eye(62, 52, 1.3) + p('M46 61L54 61L50 69Z', '#f59e0b') + s('M36 78q4 4 8 0M48 80q4 4 8 0M44 73q4 4 8 0', '#6b4423', 1.8)],
      ['monster-32', 'Tiger', '#fb923c', both(c(26, 31, 8, '#fb923c') + c(26, 31, 4, '#fff7ed')),
        s('M50 25v9M43 27l3 7M57 27l-3 7', DK, 3) + both(s('M19 52h8M20 60h7', DK, 3)) + e(43, 70, 8, 6, '#fff7ed') + e(57, 70, 8, 6, '#fff7ed') + p('M46 63h8l-4 4z', '#f472b6') + eyes(53, 12) + s('M46 74q4 3 8 0', DK, 2)],
      ['monster-33', 'Hippo', '#c4b5fd', both(c(28, 28, 6, '#a78bfa')),
        e(50, 72, 24, 15, '#ddd6fe') + e(42, 68, 2.4, 3, '#7c3aed') + e(58, 68, 2.4, 3, '#7c3aed') + eyes(46, 12) + s('M40 78q10 6 20 0', DK, 2.4) + cheeks(56, 24), e(50, 56, 32, 30, 'G')],
      ['monster-34', 'Elephant', '#93c5fd', both(e(15, 52, 16, 20, '#7cb4f0') + e(15, 52, 10, 14, '#fbcfe8')),
        s('M50 60Q50 80 58 82Q63 82 62 77', '#7cb4f0', 10) + eyes(51, 13) + cheeks(62, 22)],
      ['monster-35', 'Sloth', '#d6c3a5', '',
        e(50, 58, 25, 20, '#f5ebdc') + e(38, 56, 8, 5, '#6b4f35', 25) + e(62, 56, 8, 5, '#6b4f35', -25) + c(39, 55, 2.6, DK) + c(61, 55, 2.6, DK) + c(40, 54, 1, '#fff') + c(62, 54, 1, '#fff') + e(50, 64, 4, 3, DK) + smile(70, 5)],
      ['monster-36', 'Frog', '#4ade80', both(c(34, 37, 12, 'G') + c(34, 36, 8, '#fff') + eye(34, 37, .9)),
        s('M30 67Q50 81 70 67', DK, 2.8) + cheeks(67, 27, '#f472b6') + c(46, 57, 1.2, DK) + c(54, 57, 1.2, DK), e(50, 62, 33, 26, 'G')],
      ['monster-37', 'Hamster', '#fcd9a8', both(c(28, 30, 7, '#f4b183') + c(28, 30, 3.6, '#fbcfe8')),
        e(30, 68, 12, 10, '#fff7ed') + e(70, 68, 12, 10, '#fff7ed') + eyes(54, 12) + c(50, 63, 2.6, '#f472b6') + wm(66) + '<rect x="47.8" y="68.6" width="4.4" height="4" rx="1" fill="#fff" stroke="#e8d3b6" stroke-width=".6"/>' + cheeks(66, 22)],
      ['monster-38', 'Raccoon', '#9ca3af', both(p('M22 38L24 15L42 28Z', '#6b7280') + p('M26 33L27 21L36 28Z', '#f3f4f6')),
        both(e(36, 42, 6, 2.5, '#f3f4f6')) + p('M19 52Q30 42 44 50Q50 54 56 50Q70 42 81 52Q76 63 62 60Q50 58 38 60Q24 63 19 52Z', DK) + c(36, 53, 6, '#fff') + eye(36, 53, .85) + c(64, 53, 6, '#fff') + eye(64, 53, .85) + e(50, 70, 13, 9, '#f3f4f6') + e(50, 66, 4, 3, DK) + smile(72, 3.5)],
      // the monsters (Monsters, Inc. spirit — furry, horned, one-eyed, all friendly)
      ['monster-39', 'Big Blue', '#60a5fa', both(p('M30 30Q23 16 31 11Q32 22 38 26Z', '#e9d5ff')),
        c(30, 43, 5, '#a78bfa') + c(70, 40, 4, '#a78bfa') + c(26, 66, 3.6, '#a78bfa') + c(73, 68, 5, '#a78bfa') + c(58, 30, 3, '#a78bfa') + eyes(52, 11) + p('M36 64Q50 82 64 64Z', '#3b0764') + p('M40 64.5l3 4.2l3-4.2ZM54 64.5l3 4.2l3-4.2Z', '#fff') + cheeks(62, 22)],
      ['monster-40', 'One-Eye Green', '#84cc16', both(p('M33 29L29 15L41 24Z', '#f8fafc')),
        c(50, 50, 15, '#fff') + c(50, 51, 9, '#22c55e') + c(50, 51, 5, DK) + c(53, 47.5, 2.4, '#fff') + s('M34 70Q50 83 66 70', DK, 3) + cheeks(70, 24), e(50, 58, 33, 31, 'G')],
      ['monster-41', 'Purple Slug', '#a855f7', both(s('M41 30L34 12', '#7e22ce', 3) + c(34, 11, 4.4, '#f0abfc')),
        eye(40, 54) + eye(60, 54) + both(p('M35 51q5-7 10 0Z', '#9333ea')) + smile(67, 6) + cheeks(64, 21),
        p('M17 84C17 42 30 27 50 27C70 27 83 42 83 84Z', 'G')],
      ['monster-42', 'Pink Fluff', '#f9a8d4', ring(16, 31, 8, '#f9a8d4') + p('M58 24l8-6v12zM74 24l-8-6v12z', '#a78bfa') + c(66, 24, 3, '#c4b5fd'),
        eyes(53, 11, 1.1) + open(64, 6, 6) + cheeks(62, 21, '#ec4899')],
      ['monster-43', 'Yellow Spiky', '#facc15', p('M26 34L30 15L38 30L44 11L50 28L56 11L62 30L70 15L74 34Z', '#f59e0b'),
        eye(38, 54, .9) + eye(50, 47, .9) + eye(62, 54, .9) + smile(67, 6) + cheeks(65, 22)],
      ['monster-44', 'Orange Two-Horn', '#fb923c', both(s('M31 34Q18 26 22 14Q28 11 29 19', '#fde68a', 6)),
        both(c(33, 63, 1.2, '#c2410c') + c(36, 66, 1.2, '#c2410c') + c(31, 67, 1.2, '#c2410c')) + eyes(53, 11) + smile(66, 7) + p('M53 67.5l2 5l2-5Z', '#fff')],
      ['monster-45', 'Teal Tentacle', '#2dd4bf', s('M40 29q-5-10 2-17', '#0d9488', 5) + s('M50 26q0-12 6-16', '#0d9488', 5) + s('M60 29q5-10-2-17', '#0d9488', 5),
        c(50, 52, 12.5, '#fff') + eye(50, 52, 1.45) + smile(69, 5) + cheeks(66, 23)],
      ['monster-46', 'Red Fuzzy', '#f87171', ring(18, 31, 7, '#f87171') + both(p('M34 25L31 13L40 21Z', '#fff7ed')),
        eyes(53, 12, 1.15) + open(65, 5, 5) + cheeks(63, 22, '#dc2626')],
      ['monster-47', 'Lime Antenna', '#a3e635', both(s('M42 29L37 12', DK, 2.6) + c(37, 10, 5, '#fde047') + c(37, 10, 8, 'rgba(253,224,71,.35)')),
        eyes(54, 11) + smile(66, 6) + '<rect x="48" y="69" width="4" height="4.2" rx=".8" fill="#fff"/>' + cheeks(64, 22)],
      ['monster-48', 'Lavender Three-Eye', '#c4b5fd', both(p('M32 28L30 16L39 25Z', '#7c3aed')),
        eye(38, 57) + eye(62, 57) + eye(50, 43) + open(67, 6, 6) + cheeks(68, 23)],
      ['monster-49', 'Cloud Puff', '#e0f2fe', '',
        happy(57, 10) + smile(65, 3) + cheeks(63, 19, '#f9a8d4'),
        c(31, 61, 18, 'G') + c(50, 47, 22, 'G') + c(69, 61, 18, 'G') + c(50, 67, 22, 'G')],
      ['monster-50', 'Stripey Snaggletooth', '#8b5cf6', both(p('M28 32L24 13L38 26Z', '#fde68a')),
        both(s('M20 46q8-2 12 4M22 66q8-2 10 4', '#6d28d9', 4)) + eyes(52, 11) + smile(68, 7) + p('M45 70.5l2 6l2-6Z', '#fff') + cheeks(64, 23)]
    ];
    // outfits, drawn over any avatar (the head is about 33 across, its top near y 23, the eyes near y 54)
    var WEAR = [
      ['party', 'Party Hat', 20, p('M39 27L50 1L61 27Z', '#a78bfa') + s('M44 19l9-4M42 24l14-6M47 12l5-2', '#f9a8d4', 2.4) + c(50, 2, 4.4, '#f9a8d4')],
      ['bow', 'Bow', 20, '<g transform="translate(16 2)">' + p('M50 22L35 13L35 31Z', '#f472b6') + p('M50 22L65 13L65 31Z', '#f472b6') + c(50, 22, 4.4, '#ec4899') + '</g>'],
      ['flower', 'Flower', 20, ring(6, 5.4, 4.2, '#fde047', 68, 24) + c(68, 24, 3.6, '#f97316')],
      ['beanie', 'Beanie', 25, p('M27 31Q27 8 50 8Q73 8 73 31Z', '#38bdf8') + s('M36 14v14M44 10v18M52 10v18M60 12v16', '#7dd3fc', 2) + '<rect x="25" y="26" width="50" height="8" rx="4" fill="#0ea5e9"/>' + c(50, 7, 5.4, '#f0f9ff')],
      ['glasses', 'Glasses', 25, '<circle cx="39" cy="54" r="8" fill="rgba(255,255,255,.18)" stroke="#1f2937" stroke-width="2.4"/><circle cx="61" cy="54" r="8" fill="rgba(255,255,255,.18)" stroke="#1f2937" stroke-width="2.4"/>' + s('M47 53q3-2 6 0M31 52l-9-3M69 52l9-3', '#1f2937', 2.4)],
      ['shades', 'Sunglasses', 35, '<rect x="28" y="47" width="20" height="13" rx="5.5" fill="#111827"/><rect x="52" y="47" width="20" height="13" rx="5.5" fill="#111827"/>' + s('M48 51h4M28 50l-7-2M72 50l7-2', '#111827', 2.6) + p('M31 50l6 0-4 6z', 'rgba(255,255,255,.35)') + p('M55 50l6 0-4 6z', 'rgba(255,255,255,.35)')],
      ['phones', 'Headphones', 40, s('M18 54Q18 15 50 15Q82 15 82 54', '#334155', 5) + '<rect x="11" y="45" width="11" height="19" rx="5.5" fill="#ef4444"/><rect x="78" y="45" width="11" height="19" rx="5.5" fill="#ef4444"/>'],
      ['tophat', 'Top Hat', 50, '<rect x="37" y="2" width="26" height="22" rx="3" fill="#1f2937"/><rect x="37" y="15" width="26" height="5" fill="#ef4444"/><rect x="27" y="22" width="46" height="6" rx="3" fill="#111827"/>'],
      ['crown', 'Crown', 60, p('M33 25L36 9L44 18L50 5L56 18L64 9L67 25Z', '#facc15', ' stroke="#f59e0b" stroke-width="1.4" stroke-linejoin="round"') + '<rect x="33" y="22" width="34" height="7" rx="2.5" fill="#f59e0b"/>' + c(50, 25.5, 2.2, '#ef4444') + c(40, 25.5, 1.6, '#38bdf8') + c(60, 25.5, 1.6, '#22c55e')],
      ['pirate', 'Pirate Hat', 60, p('M22 29Q50 -2 78 29Q50 22 22 29Z', '#1f2937') + c(50, 17, 4.4, '#f8fafc') + s('M45 23l10-3M45 20l10 3', '#f8fafc', 1.6)],
      ['grad', 'Grad Cap', 80, '<rect x="38" y="20" width="24" height="9" rx="2" fill="#1f2937"/>' + p('M22 19L50 8L78 19L50 30Z', '#111827') + s('M50 19L71 22V34', '#facc15', 1.8) + c(71, 35, 2.6, '#facc15')],
      ['halo', 'Halo', 100, '<ellipse cx="50" cy="12" rx="18" ry="5" fill="none" stroke="#fef08a" stroke-width="5" opacity=".45"/><ellipse cx="50" cy="12" rx="18" ry="5" fill="none" stroke="#fde047" stroke-width="2.6"/>']
    ];
    var WBY = {}; WEAR.forEach(function (w) { WBY[w[0]] = w; });
    var BY = {}; L.forEach(function (a) { BY[a[0]] = a; });
    function svg(id, wear) {
      var a = BY[String(id)] || L[0], gid = 'mnav-' + a[0], G = 'url(#' + gid + ')', col = a[2];
      var headSvg = (a[5] || c(50, 56, 33, 'G')).replace(/"G"/g, '"' + G + '"');
      return '<svg class="mlv-monster" viewBox="0 0 100 100" role="img" aria-label="' + a[1] + '"><defs><radialGradient id="' + gid + '" cx=".36" cy=".3" r=".85"><stop offset="0" stop-color="' + shade(col, .28) + '"/><stop offset=".62" stop-color="' + col + '"/><stop offset="1" stop-color="' + shade(col, -.14) + '"/></radialGradient></defs>' +
        e(50, 95, 24, 3.4, 'rgba(25,18,55,.2)') + a[3].replace(/"G"/g, '"' + G + '"') + headSvg + p('M29 37q9-13 25-11q-15 4-22 16z', 'rgba(255,255,255,.3)') + a[4] + (wear && WBY[wear] ? WBY[wear][3] : '') + '</svg>';
    }
    var names = {}; L.forEach(function (a) { names[a[0]] = a[1]; });
    return { svg: svg, names: names, ids: L.map(function (a) { return a[0]; }), wear: WEAR.map(function (w) { return { id: w[0], name: w[1], cost: w[2] }; }) };
  })();
