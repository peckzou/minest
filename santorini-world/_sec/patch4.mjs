import fs from 'node:fs';
const F = 'santorini-world/app.js';
let s = fs.readFileSync(F, 'utf8');
function rep(a, b) { if (!s.includes(a)) throw new Error('missing: ' + a.slice(0, 70)); s = s.replace(a, b); }
rep("boat: '贡多拉 · 大运河'", "boat: '乘船 · 破火山口'");
rep("toast('贡多拉 ' + (rideIdx + 1)", "toast('船只 ' + (rideIdx + 1)");
rep("{ ic: '🛶', tip: '贡多拉',", "{ ic: '⛵', tip: '乘船',");
rep("      gondola: 'A / D：换一条贡多拉<br>鼠标：环顾四周 · 1-4：切换模式'", "      boat: 'A / D：换一艘船<br>鼠标：环顾四周 · 1-4：切换模式'");
// held blocks
const a = s.indexOf('    HELD.push('), b = s.indexOf('    updateHeld();', a);
s = s.slice(0, a) + `    HELD.push(
      { n: '白灰墙', id: B.PLASTER, c: P(0.97, 0.97, 0.95) }, { n: '象牙白墙', id: B.PLASTER, c: P(0.95, 0.93, 0.88) },
      { n: '赭黄墙', id: B.PLASTER, c: P(0.93, 0.8, 0.55) }, { n: '玫瑰墙', id: B.PLASTER, c: P(0.92, 0.7, 0.58) },
      { n: '蓝穹顶', id: B.DOME, c: P(0.1, 0.42, 0.86) }, { n: '蓝百叶窗', id: B.SHUTTER, c: P(0.1, 0.36, 0.76) },
      { n: '蓝门', id: B.DOOR, c: P(0.1, 0.36, 0.76) }, { n: '白石砖', id: B.STONE, c: P(0.9, 0.88, 0.83) },
      { n: '火山岩', id: B.RUBBLE, c: P(0.3, 0.14, 0.11) }, { n: '风车茅草', id: B.THATCH, c: P(0.46, 0.34, 0.22) },
      { n: '叠石红岩', id: B.ROCK, c: P(0.55, 0.26, 0.17) }, { n: '九重葛', id: B.FLOWER, c: 0 },
      { n: '蓝白遮阳篷', id: B.AWN_B, c: 0 }, { n: '窗（夜亮灯）', id: B.GLASS, c: 0 }, { n: '灯笼', id: B.LAMP, c: 0 }
    );
` + s.slice(b);
rep("const SWATCH = [", "const SWATCH_OLD = [");
rep("$('heldSw').style.background = SWATCH[S.held];", "$('heldSw').style.background = swatchOf(h);");
rep("  function updateHeld()", "  const swatchOf = (h) => { const c = h.c ? world.palette[h.c] : null; if (c) return 'rgb(' + Math.round(c[0] * 255) + ',' + Math.round(c[1] * 255) + ',' + Math.round(c[2] * 255) + ')'; return { 11: '#d0206c', 21: '#2060d0', 9: '#f2d27a', 15: '#ffe9a0' }[h.id] || '#ccc'; };\n  function updateHeld()");
// minimap
rep("if (b === B.SAND || h <= 1) { r = 26; g = 92; bl = 118; }", "if (h <= 11) { const wd = 0.5 + h / 22; r = 8 * wd; g = 78 * wd + 20; bl = 150 * wd + 30; }");
rep("        if (b === B.ROOF) { r = 190 * sh; g = 90 * sh; bl = 60 * sh; }\n        if (b === B.PAVE) { r = 150; g = 146; bl = 138; }", "        if (b === B.DOME) { r = 30; g = 100; bl = 220; }\n        if (b === B.THATCH) { r = 120 * sh; g = 90 * sh; bl = 60 * sh; }");
rep("const sh = 0.62 + Math.min(h, 45) / 45 * 0.5", "const sh = 0.62 + Math.min(h, 70) / 70 * 0.55");
rep("gondolas.forEach", "rideBoats.forEach");
fs.writeFileSync(F, s); console.log('ok');
