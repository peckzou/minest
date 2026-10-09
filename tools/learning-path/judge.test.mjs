// Learning Path voice quiz · local judging, read from the iPhone page itself:
//   node tools/learning-path/judge.test.mjs [iPhoneX.Y.html]
// "right" answers must be accepted locally (or left to the AI as "unsure" — counted separately);
// "wrong" answers must never be accepted.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const page = process.argv[2] || fs.readdirSync(repo).filter(f => /^iPhone\d+\.\d+\.html$/.test(f))
  .sort((a, b) => { const v = f => f.match(/(\d+)\.(\d+)/).slice(1).map(Number); const [a1, a2] = v(a), [b1, b2] = v(b); return a1 - b1 || a2 - b2; }).pop();
const html = fs.readFileSync(path.join(repo, page), 'utf8');
const at = html.indexOf('var judge = (function() {');
const end = html.indexOf('})();', at) + 5;
const judge = new Function(html.slice(at, end) + '\nreturn judge;')();
console.log('judge from ' + page);

// [kind, expected (card back / term), spoken answer as recognised, should be right?]
const C = [
  ['meaning', '苹果', '苹果', 1], ['meaning', '苹果', '是苹果吧', 1], ['meaning', 'n. 苹果', '苹果。', 1],
  ['meaning', '继承；遗传', '继承', 1], ['meaning', '继承；遗传', '遗传', 1], ['meaning', '继承；遗传', '就是继承的意思', 1],
  ['meaning', '光合作用', '光合作用', 1], ['meaning', '光合作用', '光和作用', 1], ['meaning', '图书馆', '图书馆', 1],
  ['meaning', '美丽的；漂亮的', '漂亮', 1], ['meaning', '美丽的；漂亮的', '美丽', 1], ['meaning', 'adj. 重要的', '重要', 1],
  ['meaning', '环境', '环境', 1], ['meaning', '经验；经历', '经历', 1], ['meaning', '决定', '做决定', 1],
  ['meaning', '温度', '温度', 1], ['meaning', '温度', '問度', 0], ['meaning', '朋友', '好朋友', 1],
  ['meaning', '实验', '做实验', 1], ['meaning', '科学家', '科学家', 1], ['meaning', '政府', '政府', 1],
  ['meaning', '移民', '移民', 1], ['meaning', '民主', '民主', 1], ['meaning', '蒸发', '蒸发', 1],
  ['meaning', '蒸发', '凝结', 0], ['meaning', '苹果', '香蕉', 0], ['meaning', '继承；遗传', '发明', 0],
  ['meaning', '光合作用', '呼吸作用', 0], ['meaning', '图书馆', '书店', 0], ['meaning', '重要的', '不知道', 0],
  ['meaning', '环境', '', 0], ['meaning', '温度', '天气', 0], ['meaning', '朋友', '敌人', 0],
  ['meaning', 'the process plants use to make food from sunlight', 'plants make food from sunlight', 1],
  ['meaning', 'a large body of salt water', 'salt water body that is very large', 1], ['meaning', 'a large body of salt water', 'a kind of mountain', 0],
  ['term', 'photosynthesis', 'photosynthesis', 1], ['term', 'photosynthesis', 'photo synthesis', 1], ['term', 'evaporation', 'evaporations', 1],
  ['term', 'democracy', 'democracy', 1], ['term', 'democracy', 'monarchy', 0], ['term', 'library', 'librery', 1], ['term', 'library', 'bakery', 0],
  ['term', 'condensation', 'condensation.', 1], ['spell', 'apple', 'a p p l e', 1], ['spell', 'apple', 'A, P, P, L, E', 1], ['spell', 'apple', 'a p l e', 0],
  ['spell', 'library', 'l i b r a r y', 1], ['spell', 'library', 'l i b r e r y', 0], ['meaning', '苹果', '一种红色的水果', 1]
];
let rightOk = 0, rightUnsure = 0, rightMiss = [], wrongBad = [], rights = 0, wrongs = 0;
for (const [k, e, a, should] of C) {
  const v = judge.local(k, e, a);
  if (should) { rights++; if (v === 'correct') rightOk++; else if (v === 'unsure') rightUnsure++; else rightMiss.push(`${k} ${e} ← "${a}" → ${v}`); }
  else { wrongs++; if (v === 'correct') wrongBad.push(`${k} ${e} ← "${a}" accepted`); }
}
const zh = C.filter(c => c[0] === 'meaning' && /[一-鿿]/.test(c[1]));
const zhRight = zh.filter(c => c[3]).length, zhOk = zh.filter(c => c[3] && judge.local(c[0], c[1], c[2]) === 'correct').length;
console.log(`${C.length} answers · right ones accepted locally ${rightOk}/${rights}, left to AI ${rightUnsure}, rejected ${rightMiss.length}`);
console.log(`wrong ones accepted by mistake: ${wrongBad.length}/${wrongs}`);
console.log(`Chinese meanings: ${zhOk}/${zhRight} accepted locally (${Math.round(100 * zhOk / zhRight)}%)`);
rightMiss.forEach(x => console.log('  ✗ rejected: ' + x)); wrongBad.forEach(x => console.log('  ✗ ' + x));
const pass = !wrongBad.length && !rightMiss.length && (rightOk + rightUnsure) / rights >= 0.9 && zhOk / zhRight >= 0.9;
console.log(pass ? 'all passed' : 'FAILED'); process.exit(pass ? 0 : 1);
