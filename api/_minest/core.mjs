// Minest AI core — the board-building / analysing logic shared by the Mac server
// (minest-ai-server.mjs) and the Vercel function (api/minest/[op].mjs).
// Environment: OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL, OPENROUTER_API_KEY, MINEST_AI_* tuning.
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// 42.0: the board-building manual and the data blocks travel with every request
// (the API keeps no memory between calls).
const aiDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'ai');
// Part A of the guide is for people; the AI gets part B (the rules). It is read on every
// request, so editing the guide takes effect without a restart, and it always comes first in
// the system prompt so the provider can cache that prefix.
const readGuide = () => { try { return readFileSync(join(aiDir, 'minest-board-guide.md'), 'utf8'); } catch (e) { return ''; } };
const loadGuide = () => { const g = readGuide(); const i = g.indexOf('\n## B.'); return i >= 0 ? g.slice(i + 1) : g; };
const guideVersion = () => (readGuide().match(/guide-version:\s*(\d+)/) || [])[1] || '1';
// Cards written for an exact item list are kept in ai/cache and reused: the same list never
// costs a second (slow) request. A new guide-version invalidates them.
const cacheDir = join(aiDir, 'cache');
const cacheKey = (items, block, lang) => createHash('sha1').update(JSON.stringify({ v: guideVersion(), block, lang, items })).digest('hex').slice(0, 16);
const cacheRead = (key) => { try { return JSON.parse(readFileSync(join(cacheDir, key + '.json'), 'utf8')); } catch (e) { return null; } };
const cacheWrite = (key, data) => { try { if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true }); writeFileSync(join(cacheDir, key + '.json'), JSON.stringify(data, null, 1)); } catch (e) {} };
const loadBlocks = () => {
  const blocks = {};
  try {
    for (const f of readdirSync(join(aiDir, 'blocks'))) {
      if (!f.endsWith('.json')) continue;
      const b = JSON.parse(readFileSync(join(aiDir, 'blocks', f), 'utf8'));
      blocks[b.id] = b;
    }
  } catch (e) {}
  return blocks;
};

const apiKey = process.env.OPENAI_API_KEY;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;
// Override with OPENAI_MODEL when the provider group exposes a different model.
const model = process.env.OPENAI_MODEL || 'gpt-6-sol';
const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const openRouterBaseUrl = 'https://openrouter.ai/api/v1';

export const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Minest-Token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8'
};

const boardSchema = {
  type: 'object', additionalProperties: false, required: ['id', 'title', 'columns'],
  properties: {
    id: { type: 'string' }, title: { type: 'string' },
    columns: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'title', 'cards'], properties: {
      id: { type: 'string' }, title: { type: 'string' }, color: { type: 'string' },
      cards: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'title', 'desc', 'checklistItems'], properties: {
        id: { type: 'string' }, title: { type: 'string' }, desc: { type: 'string' },
        checklistItems: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'text', 'done'], properties: { id: { type: 'string' }, text: { type: 'string' }, done: { type: 'boolean' } } } }
      } } }
    } } }
  }
};

export function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    const maxBytes = 18 * 1024 * 1024;
    req.on('data', chunk => {
      if (settled) return;
      size += chunk.length;
      if (size > maxBytes) {
        settled = true;
        reject(Object.assign(new Error('请求过大，请减少附件数量或压缩图片。'), { statusCode: 413 }));
        req.resume();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (settled) return;
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(new Error('invalid JSON')); }
    });
    req.on('error', reject);
  });
}

// Reasoning effort per job (MINEST_AI_EFFORT=off disables it; providers that reject the
// parameter are detected once and it is dropped from then on).
let effortSupported = process.env.MINEST_AI_EFFORT !== 'off';
async function openai(messages, options = {}, requestedModel) {
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
  const { effort, raw, ...rest } = options;
  const body = { model: requestedModel || model, messages, temperature: 0.3, ...rest };
  if (effort && effortSupported) body.reasoning_effort = effort;
  const response = await fetch(baseUrl + '/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      'Accept': raw ? 'text/event-stream' : 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (raw && response.ok) return response;   // streaming: the caller reads the body
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = data?.error?.message || ('OpenAI request failed (' + response.status + ')');
    if (body.reasoning_effort && /reasoning|unsupported|unrecognized|unknown param/i.test(msg)) { effortSupported = false; return openai(messages, { raw, ...rest }, requestedModel); }
    throw new Error(msg);
  }
  return data;
}

async function openrouter(messages, options = {}, requestedModel) {
  if (!openRouterApiKey) throw new Error('OPENROUTER_API_KEY is not configured');
  const modelSlug = String(requestedModel || '').trim();
  if (!modelSlug) throw new Error('OpenRouter model slug is required');
  const response = await fetch(openRouterBaseUrl + '/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + openRouterApiKey,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://minest.app',
      'X-Title': 'Minest'
    },
    body: JSON.stringify((({ effort, raw, ...rest }) => ({ model: modelSlug, messages, temperature: 0.3, ...rest }))(options))
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'OpenRouter request failed');
  return data;
}

function outputText(data) { return data?.choices?.[0]?.message?.content || ''; }

// ---------------------------------------------------------------------------
// 42.0 board pipeline: plan (blueprint) → expand (each list, in chunks) → the
// client assembles the board. Strict JSON schemas keep the output machine-safe.
// ---------------------------------------------------------------------------
const str = { type: 'string' };
const planSchema = {
  type: 'object', additionalProperties: false, required: ['title', 'summary', 'routine', 'lists'],
  properties: {
    title: str, summary: str, routine: str,
    lists: { type: 'array', items: { type: 'object', additionalProperties: false,
      required: ['title', 'color', 'block', 'purpose', 'dataset', 'items', 'groupSize', 'cardCount'],
      properties: {
        title: str, color: str, purpose: str,
        block: { type: 'string', enum: ['flashcard', 'qa', 'task', 'tracker', 'flow'] },
        dataset: str,                       // "dolch-220:primer" when a data block supplies the items, else ""
        items: { type: 'array', items: str },   // explicit items when there is no data block
        groupSize: { type: 'integer' },     // fold every N cards into one set (0 = no folding)
        cardCount: { type: 'integer' }      // for task lists without items: how many cards to write
      } } }
  }
};
const cardsSchema = {
  type: 'object', additionalProperties: false, required: ['cards'],
  properties: { cards: { type: 'array', items: { type: 'object', additionalProperties: false,
    required: ['title', 'desc', 'checklist', 'labels'],
    properties: { title: str, desc: str, checklist: { type: 'array', items: str }, labels: { type: 'array', items: str } } } } }
};
const multiSchema = {
  type: 'object', additionalProperties: false, required: ['lists'],
  properties: { lists: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['list', 'cards'],
    properties: { list: { type: 'integer' }, cards: cardsSchema.properties.cards } } } }
};
// how each building block is written (mirrors guide B3) and its fixed checklist
const BLOCK_RULES = {
  flashcard: 'title = the item itself. desc line 1 = a short example sentence using the item; line 2 = a hint in the user language (meaning; a reading or memory tip only when useful). checklist: leave empty.',
  qa: 'title = the question (≤ 40 characters). desc line 1 = the answer, short and exact; line 2 = why, or a worked example with numbers. checklist: leave empty.',
  task: 'title = verb + object. desc = how to do it + the success criteria. checklist = 2–5 concrete, observable steps.',
  tracker: 'title = what is tracked and when (e.g. "Week 1 reading"). desc = the rule. checklist = one tick per day or item.',
  flow: 'Same as flashcard.'
};
const CHECKLISTS = {
  flashcard: { zh: ['读 3 遍', '拼写', '用它说一句话'], en: ['Read it 3 times', 'Spell it', 'Use it in a sentence'] },
  flow: { zh: ['读 3 遍', '拼写', '用它说一句话'], en: ['Read it 3 times', 'Spell it', 'Use it in a sentence'] },
  qa: { zh: ['先说出答案', '翻面核对', '讲给别人听'], en: ['Say the answer first', 'Flip and check', 'Explain it to someone'] }
};
// 41.30 Analyze Board: the AI reads an existing board and proposes operations Minest can apply
const analysisSchema = {
  type: 'object', additionalProperties: false, required: ['summary', 'insights', 'priorities', 'create', 'today', 'cleanup'],
  properties: {
    summary: str,
    insights: { type: 'array', items: str },
    priorities: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['cardId', 'priority', 'reason'],
      properties: { cardId: str, priority: { type: 'string', enum: ['high', 'medium', 'low'] }, reason: str } } },
    create: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['listId', 'title', 'desc', 'reason'],
      properties: { listId: str, title: str, desc: str, reason: str } } },
    today: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['cardId', 'reason'], properties: { cardId: str, reason: str } } },
    cleanup: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['kind', 'cardIds', 'suggestion', 'action', 'moveToListId'],
      properties: { kind: { type: 'string', enum: ['duplicate', 'overdue', 'misplaced', 'stale', 'empty'] }, cardIds: { type: 'array', items: str }, suggestion: str,
        action: { type: 'string', enum: ['archive_extras', 'move', 'reschedule', 'mark_done', 'none'] }, moveToListId: str } } }
  }
};
const analyzeRole = `

## Your role now: analyse an EXISTING board and propose operations
You receive a compact JSON snapshot of the learner's board (lists → cards; card fields: id, t = front title, d = back (shortened), done, p = priority, m = mastery 1–5,
lb = labels, due = due date, pr = latest pronunciation score, ck = checklist done/total, st = inside a folded set) and stats Minest computed exactly.
Return:
- summary: 2–4 sentences in the user's language (Simplified Chinese unless the board is clearly English-only). Use the exact numbers from the stats — never recount.
- insights: 3–6 short findings (where work piles up, which list lags, weak spots: low mastery, low pronunciation, review labels, overdue).
- today: 3–7 cards to do today — not done, favouring overdue / due soon, high priority, review label, low mastery or pronunciation, and the earliest unfinished part of the learning order. One short reason each.
- priorities: only cards whose priority SHOULD CHANGE (max 10), with a reason.
- create: cards that are clearly missing (max 5), each in an existing listId, real content, no placeholders.
- cleanup: duplicates (same or near-same titles → archive_extras; put the one to KEEP first in cardIds), overdue unfinished (reschedule or mark_done),
  misplaced cards (move, with moveToListId), stale or empty cards. Leave the array empty when the board is clean.
Use ONLY card ids and list ids that appear in the snapshot. Keep card titles in their original language. moveToListId = "" unless action is move.`;
const jsonOut = (name, schema, maxTokens, effort) => ({ max_tokens: maxTokens, effort, response_format: { type: 'json_schema', json_schema: { name, strict: true, schema } } });
const EFFORT = { chat: process.env.MINEST_AI_EFFORT_CHAT || 'low', plan: process.env.MINEST_AI_EFFORT_PLAN || 'medium', cards: process.env.MINEST_AI_EFFORT_CARDS || 'low' };
// Each request has a ~20 s fixed cost on relay services, so a list is written in as few
// requests as possible: up to 60 cards per request, split evenly (52 → 52, 70 → 35 + 35).
const CHUNK = Math.max(10, Number(process.env.MINEST_AI_CHUNK || 60));
const chatRole = `\n\n## Your role now: the chat step\nFollow B10 exactly. Ask everything that is missing in ONE message (max 4 questions, each with a suggested default), never more than 2 rounds of questions, then end with the \`\`\`brief block. Reply in the user's language. Markdown is rendered. Never write the cards in the chat.`;
const datasetCatalog = (blocks) => Object.values(blocks).map(b => `- ${b.id}: ${b.title} — ` + b.groups.map(g => `${b.id}:${g.id} "${g.title}" (${g.items.length} items)`).join('; ')).join('\n');
function resolveItems(blocks, list) {
  const [bid, gid] = String(list.dataset || '').split(':');
  const b = blocks[bid];
  if (b && gid) { const g = b.groups.find(x => x.id === gid); if (g) return { items: g.items.slice(), exact: true }; }
  if (b && !gid) return { items: b.groups.flatMap(g => g.items), exact: true };
  return { items: (list.items || []).map(String).filter(Boolean), exact: (list.items || []).length > 0 };
}
// Relay services cap parallel requests per user ("Concurrency limit exceeded"), so every
// model call goes through one queue (MINEST_AI_CONCURRENCY, default 2) and busy / rate-limit
// answers are retried with backoff instead of failing a whole list.
const maxParallel = Math.max(1, Number(process.env.MINEST_AI_CONCURRENCY || 2));
let running = 0; const waiting = [];
const acquire = () => new Promise(r => { if (running < maxParallel) { running++; r(); } else waiting.push(r); });
const release = () => { const next = waiting.shift(); if (next) next(); else running--; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function callModel(input, messages, options) {
  for (let attempt = 0; ; attempt++) {
    await acquire();
    try { return input.provider === 'openrouter' ? await openrouter(messages, options, input.model) : await openai(messages, options, input.modelName); }
    catch (e) {
      if (attempt >= 4 || !/concurren|rate limit|too many|overloaded|retry later|429|503|timeout/i.test(e.message || '')) throw e;
    } finally { release(); }
    await sleep(2000 * 2 ** attempt + Math.random() * 1000);
  }
}
async function mapLimit(arr, limit, fn) {
  const out = new Array(arr.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, async () => { while (i < arr.length) { const k = i++; out[k] = await fn(arr[k], k); } }));
  return out;
}

export async function handle(path, input) {
  if (path.endsWith('/ai/openrouter-test')) {
    const requestedModel = String(input.model || '').trim();
    const data = await openrouter([{ role: 'user', content: 'Say hello' }], { max_tokens: 80 }, requestedModel);
    return { provider: 'openrouter', model: requestedModel, reply: outputText(data) };
  }
  const attachmentContext = (input.attachments || []).filter(a => a && typeof a.text === 'string').map(a => `\n\n[Attached file: ${String(a.name || 'text file').slice(0, 160)}]\n${a.text.slice(0, 50000)}`).join('');
  const imageParts = (input.attachments || []).filter(a => a && typeof a.data === 'string' && /^data:image\/(png|jpeg|webp|gif);base64,/i.test(a.data)).map(a => ({ type: 'image_url', image_url: { url: a.data } }));
  // the conversation so far (the client sends its last turns), so replies and boards keep context
  const history = (Array.isArray(input.history) ? input.history : []).slice(-20)
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && m.text.trim())
    .map(m => ({ role: m.role, content: m.text.slice(0, 8000) }));
  if (path.endsWith('/ai-diagnose')) {
    // Is this a real, capable GPT? Probes with fixed answers + what the API itself reports.
    const probes = [
      { q: 'What is 17 × 23? Reply with only the number.', ok: t => /\b391\b/.test(t) },
      { q: 'How many times does the letter r appear in the word "strawberry"? Reply with only the number.', ok: t => /\b3\b/.test(t) },
      { q: 'Alice is taller than Bob. Bob is taller than Carol. Who is the shortest? Reply with one name.', ok: t => /carol/i.test(t) },
      { q: 'Reverse the letters of the word "minest". Reply with only the result.', ok: t => /tsenim/i.test(t) },
      { q: '小明有 3 个苹果，又买了 2 袋，每袋 4 个，然后吃掉 1 个。他现在有几个苹果？只回答数字。', ok: t => /\b10\b|十/.test(t) }
    ];
    const t0 = Date.now();
    const results = await mapLimit(probes, 5, async (p) => {
      const s0 = Date.now();
      try {
        const d = await callModel(input, [{ role: 'user', content: p.q }], { max_tokens: 60 });
        const a = outputText(d).trim();
        return { q: p.q, answer: a.slice(0, 80), pass: p.ok(a), ms: Date.now() - s0, model: d.model || '', usage: d.usage || null };
      } catch (e) { return { q: p.q, answer: 'ERROR: ' + e.message, pass: false, ms: Date.now() - s0 }; }
    });
    let structured = false, selfReport = '';
    try {
      const d = await callModel(input, [{ role: 'user', content: 'Return n = 7 and ok = true.' }], jsonOut('probe', { type: 'object', additionalProperties: false, required: ['ok', 'n'], properties: { ok: { type: 'boolean' }, n: { type: 'integer' } } }, 40));
      const j = JSON.parse(outputText(d)); structured = j.ok === true && j.n === 7;
    } catch (e) {}
    try { selfReport = outputText(await callModel(input, [{ role: 'user', content: 'Which model are you, exactly? One short line.' }], { max_tokens: 40 })).trim(); } catch (e) {}
    return { endpoint: input.provider === 'openrouter' ? 'openrouter.ai' : new URL(baseUrl).host, requestedModel: input.provider === 'openrouter' ? input.model : (input.modelName || model),
      reportedModels: [...new Set(results.map(r => r.model).filter(Boolean))], passed: results.filter(r => r.pass).length, total: results.length,
      structuredOutput: structured, selfReport, totalMs: Date.now() - t0, results };
  }
  if (path.endsWith('/ai-plan')) {
    const blocks = loadBlocks();
    const userContent = [{ type: 'text', text: String(input.prompt || '') + attachmentContext }, ...imageParts];
    const sys = loadGuide() + '\n\n## Data blocks available (exact, authoritative item lists)\n' + (datasetCatalog(blocks) || '(none)') +
      '\n\n## Your task now\nDesign the BLUEPRINT of the board the user agreed on in this conversation. Do not write the cards yet.\n' +
      '- When a data block covers the content, set `dataset` to "<block>:<group>" and leave `items` empty — the exact items are filled in by Minest.\n' +
      '- Put items in `items` only when they are fixed and known (the user\'s file, a named word list not in the data blocks). When the AI writes the content (exam questions, concepts, tasks), leave `items` empty and set `cardCount` — sized with guide B5 (≤ 40 per list).\n' +
      '- `groupSize`: 8–10 for flashcard and qa lists larger than 12 cards, else 0.\n' +
      '- `routine`: the daily study routine for the "How to use this board" card (in the user\'s language, Markdown list).\n' +
      '- Keep 3–7 lists, ordered easiest/earliest first, with colours from the guide.\n' +
      '- If the conversation contains a ```brief block, it is the agreed spec: follow it exactly (latest version wins).';
    const lang = /[\u4e00-\u9fff]/.test(JSON.stringify(input.history || []) + String(input.prompt || '')) ? 'zh' : 'en';
    // fill in what Minest knows exactly: counts from the data blocks
    const finish = (plan) => {
      plan.lists = (plan.lists || []).map(l => { const r = resolveItems(blocks, l);
        return { ...l, resolvedCount: r.items.length || l.cardCount || 0, exact: r.exact, cached: !!(r.items.length && cacheRead(cacheKey(r.items, l.block, lang))) }; });
      plan.lang = lang;
      return plan;
    };
    if (input.variants === 2) {
      // 41.31: two genuinely different outlines in one request — the learner picks A or B,
      // or asks for two new ones (the approaches already turned down are listed in `avoid`)
      const avoid = (Array.isArray(input.avoid) ? input.avoid : []).filter(Boolean).slice(-8);
      const twoSys = sys + '\n- Return TWO alternative blueprints, A and B, that organise the board in clearly different ways (e.g. by level vs by week, by topic vs by skill, flashcards vs question cards). Both must respect the agreed brief.' +
        '\n- `approach`: one short line in the user\'s language saying how this blueprint is organised and who it suits.' +
        (avoid.length ? '\n- The learner already turned down these approaches — do NOT repeat them: ' + avoid.map(a => '「' + a + '」').join('；') : '');
      const twoSchema = { type: 'object', additionalProperties: false, required: ['plans'], properties: { plans: { type: 'array', items: {
        ...planSchema, required: [...planSchema.required, 'approach'], properties: { ...planSchema.properties, approach: str } } } } };
      const data2 = await callModel(input, [{ role: 'system', content: twoSys }, ...history, { role: 'user', content: userContent }], jsonOut('minest_plans', twoSchema, 7000, EFFORT.plan));
      // outlines without lists are not outlines (the model sometimes answers with a question) —
      // keep only real ones; with none left, fall through to a single outline
      const plans = (JSON.parse(outputText(data2)).plans || []).filter(p => Array.isArray(p.lists) && p.lists.length).slice(0, 2).map(finish);
      if (plans.length) return { plans };
    }
    const data = await callModel(input, [{ role: 'system', content: sys }, ...history, { role: 'user', content: userContent }], jsonOut('minest_plan', planSchema, 4000, EFFORT.plan));
    return { plan: finish(JSON.parse(outputText(data))) };
  }
  if (path.endsWith('/ai-expand')) {
    // Write the cards of one list (input.list) or of several (input.lists → { results }).
    // Every request costs ~20 s before the first card on relay services, so small lists are
    // packed into one request (up to CHUNK cards) and big lists are split evenly. Data-block /
    // explicit items are authoritative: the AI only writes backs and steps, and the result is
    // checked against the items. Finished exact lists are cached in ai/cache.
    const blocks = loadBlocks();
    const many = Array.isArray(input.lists);
    const lists = many ? input.lists : [input.list || {}];
    const lang = input.lang || 'zh';
    const jobs = lists.map(list => {
      const { items } = resolveItems(blocks, list);
      const key = items.length ? cacheKey(items, list.block, lang) : '';
      const hit = key && !input.fresh ? cacheRead(key) : null;
      const count = items.length || Math.max(1, Math.min(40, list.cardCount || 8));
      return { list, items, key, count, hit: hit && Array.isArray(hit.cards) && hit.cards.length === items.length ? hit : null, got: [] };
    });
    // pieces → bins (one request each)
    const bins = []; let open = null;
    jobs.forEach((job, j) => {
      if (job.hit) return;
      if (job.items.length > CHUNK) {
        const n = Math.ceil(job.items.length / CHUNK);
        for (let k = 0; k < n; k++) bins.push([{ j, items: job.items.slice(Math.round(k * job.items.length / n), Math.round((k + 1) * job.items.length / n)) }]);
        return;
      }
      const size = job.count;
      if (!open || open.size + size > CHUNK) { open = { size: 0, pieces: [] }; bins.push(open.pieces); }
      open.size += size; open.pieces.push({ j, items: job.items.length ? job.items : null, count: size });
    });
    const ctx = `Board: ${input.boardTitle || ''}\nBoard summary: ${input.summary || ''}\nUser language for instructions: ${lang}`;
    const writeBin = async (pieces) => {
      const ask = pieces.map((pc, n) => {
        const l = jobs[pc.j].list;
        const what = pc.items
          ? `Write exactly one card for each of these ${pc.items.length} items, in this order, card title EXACTLY equal to the item:\n${JSON.stringify(pc.items)}`
          : `Write ${pc.count} cards (no duplicates, real content only).`;
        return `### list ${n}: "${l.title}" — ${l.purpose || ''}\nBuilding block: ${l.block}. Rules: ${BLOCK_RULES[l.block] || BLOCK_RULES.flashcard}\n${what}`;
      }).join('\n\n') + '\n\nUse one identical desc layout for all cards of the same building block (other parts of the board are written in parallel and must look the same). Return every list above, with `list` = its number.';
      const total = pieces.reduce((t, pc) => t + (pc.items ? pc.items.length : pc.count), 0);
      const data = await callModel(input, [{ role: 'system', content: loadGuide() + '\n\n## Your task now\nWrite the cards of the agreed board, list by list.\n' + ctx }, ...history.slice(-6), { role: 'user', content: ask }],
        jsonOut('minest_lists', multiSchema, Math.min(16000, 800 + 220 * total), EFFORT.cards));
      const out = JSON.parse(outputText(data)).lists || [];
      out.forEach(o => { const pc = pieces[o.list]; if (pc && Array.isArray(o.cards)) jobs[pc.j].got.push(...o.cards); });
    };
    await mapLimit(bins, 4, writeBin);   // callModel's queue enforces the provider's limit
    const zw = /[​-‍﻿]/g;
    const results = jobs.map(job => {
      if (job.hit) return { cards: job.hit.cards, cached: true, checked: { expected: job.items.length, returned: job.items.length, matched: job.items.length, filled: 0 } };
      const { list, items, got } = job;
      let cards, missing = 0;
      if (items.length) {
        // exactly the items, in order: match by title, fill anything the model dropped
        const byTitle = new Map(); got.forEach(c => { const k = String(c.title || '').trim().toLowerCase(); if (!byTitle.has(k)) byTitle.set(k, c); });
        cards = items.map(it => { const c = byTitle.get(String(it).trim().toLowerCase()); if (!c) missing++; return c ? { ...c, title: it } : { title: it, desc: '', checklist: [], labels: [] }; });
      } else {
        const seen = new Set(); cards = got.filter(c => { const k = String(c.title || '').trim().toLowerCase(); if (!k || seen.has(k)) return false; seen.add(k); return true; });
      }
      // one look for the whole board: fixed recall steps for flashcards and question cards
      const cl = (CHECKLISTS[list.block] || {})[lang === 'en' ? 'en' : 'zh'];
      cards = cards.map(c => ({ ...c, title: String(c.title).replace(zw, ''), desc: String(c.desc || '').replace(zw, ''), checklist: cl || (c.checklist || []).map(t => String(t).replace(zw, '')) }));
      if (items.length && !missing) cacheWrite(job.key, { title: list.title, block: list.block, lang, items, cards });
      return { cards, checked: { expected: items.length || job.count, returned: got.length, matched: (items.length || cards.length) - missing, filled: missing } };
    });
    return many ? { results, requests: bins.length } : { ...results[0], requests: bins.length };
  }
  if (path.endsWith('/ai-analyze')) {
    const board = input.board || {}, stats = input.stats || {};
    const cardIds = new Set(), listIds = new Set();
    (board.lists || []).forEach(l => { listIds.add(l.id); (l.cards || []).forEach(c => cardIds.add(c.id)); });
    const data = await callModel(input, [
      { role: 'system', content: loadGuide() + analyzeRole },
      { role: 'user', content: 'Today: ' + (input.today || '') + '\nStats: ' + JSON.stringify(stats) + '\nBoard: ' + JSON.stringify(board) }
    ], jsonOut('minest_analysis', analysisSchema, 6000, EFFORT.plan));
    const a = JSON.parse(outputText(data));
    // nothing may point at a card or list that does not exist
    a.priorities = (a.priorities || []).filter(x => cardIds.has(x.cardId));
    a.today = (a.today || []).filter(x => cardIds.has(x.cardId));
    a.create = (a.create || []).filter(x => listIds.has(x.listId) && String(x.title || '').trim());
    a.cleanup = (a.cleanup || []).map(g => ({ ...g, cardIds: (g.cardIds || []).filter(id => cardIds.has(id)) }))
      .filter(g => g.cardIds.length && (g.action !== 'move' || listIds.has(g.moveToListId)));
    return { analysis: a, model: data.model || '' };
  }
  if (path.endsWith('/ai-chat') || path.endsWith('/ai-chat-stream')) {
    if (input.mode === 'voice' || input.mode === 'pet_voice') {
      const voiceSystem = input.system || 'You are Minest AI Pet, an instant voice companion. Always reply directly and naturally in 1-2 short sentences (under 25 words). Do not do internal reasoning or chain-of-thought. If user speaks Chinese or mixed English/Chinese (code-switching), reply in fluent Chinese smoothly incorporating technical terms. If user speaks English, reply in English.';
      const messages = [{ role: 'system', content: voiceSystem }, ...history, { role: 'user', content: String(input.prompt || '') }];
      if (path.endsWith('/ai-chat-stream')) return { __stream: messages };
      const data = await callModel(input, messages, { max_tokens: 80, effort: 'low' });
      return { reply: outputText(data) };
    }
    const userContent = [{ type: 'text', text: String(input.prompt || '') + attachmentContext }, ...imageParts];
    const messages = [{ role: 'system', content: loadGuide() + '\n\n## Data blocks available\n' + (datasetCatalog(loadBlocks()) || '(none)') + chatRole }, ...history, { role: 'user', content: userContent }];
    if (path.endsWith('/ai-chat-stream')) return { __stream: messages };
    const data = await callModel(input, messages, { max_tokens: 1500, effort: EFFORT.chat });
    return { reply: outputText(data) };
  }
  if (path.endsWith('/ai-board')) {
    const userContent = [{ type: 'text', text: String(input.prompt || '') + attachmentContext }, ...imageParts];
    const messages = [{ role: 'system', content: 'Convert the request into a useful Minest board, using everything agreed in the conversation. Choose meaningful lists, cards, descriptions, and checklists. Do not use generic placeholder names. Return only the board object.' }, ...history, { role: 'user', content: userContent }];
    const options = { max_tokens: 3000, response_format: { type: 'json_schema', json_schema: { name: 'minest_board', strict: true, schema: boardSchema } } };
    const data = input.provider === 'openrouter'
      ? await openrouter(messages, options, input.model)
      : await openai(messages, options, input.modelName);
    return { board: JSON.parse(outputText(data)) };
  }
  throw new Error('unknown endpoint');
}

// Chat replies are streamed (text appears while the model writes), which matters on slow relays.
// Wire format to the app: server-sent events `data: {"t": "<text so far>"}`, then `data: {"done": true}`.
export async function streamChat(res, input, messages) {
  const isVoice = input.mode === 'voice' || input.mode === 'pet_voice';
  const voiceMaxTokens = isVoice ? 80 : 1500;
  const voiceEffort = isVoice ? 'low' : EFFORT.chat;
  const sse = {
    ...headers,
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'X-Accel-Buffering': 'no'
  };
  if (input.provider === 'openrouter') {   // no streaming path for OpenRouter here: send the whole reply once
    const data = await openrouter(messages, { max_tokens: voiceMaxTokens }, input.model);
    res.writeHead(200, sse); res.write('data: ' + JSON.stringify({ t: outputText(data) }) + '\n\n'); return res.end('data: {"done":true}\n\n');
  }
  let upstream;
  for (let attempt = 0; ; attempt++) {
    await acquire();
    try { upstream = await openai(messages, { max_tokens: voiceMaxTokens, effort: voiceEffort, stream: true, raw: true }, input.modelName); break; }
    catch (e) { release(); if (attempt >= 4 || !/concurren|rate limit|too many|overloaded|retry later|429|503|timeout/i.test(e.message || '')) throw e; }
    await sleep(2000 * 2 ** attempt + Math.random() * 1000);
  }
  try {
    res.writeHead(200, sse);
    // Send headers and a comment immediately so relays establish the stream
    // without waiting for the first model token. The client ignores comments.
    if (typeof res.flushHeaders === 'function') res.flushHeaders();
    res.write(': stream-ready\n\n');
    const type = upstream.headers.get('content-type') || '';
    if (!/event-stream/.test(type)) {   // provider ignored stream:true
      const data = await upstream.json().catch(() => ({}));
      res.write('data: ' + JSON.stringify({ t: outputText(data) }) + '\n\n'); return res.end('data: {"done":true}\n\n');
    }
    const decoder = new TextDecoder(); let buf = '', text = '', last = 0;
    for await (const chunk of upstream.body) {
      buf += decoder.decode(chunk, { stream: true });
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') continue;
        try { const d = JSON.parse(payload); text += d?.choices?.[0]?.delta?.content || ''; } catch (e) {}
      }
      if (text.length !== last) { last = text.length; res.write('data: ' + JSON.stringify({ t: text }) + '\n\n'); }
    }
    // A provider may end the body without a trailing newline. Flush the
    // decoder and parse that final SSE record so the last token is preserved.
    buf += decoder.decode();
    const tail = buf.trim();
    if (tail.startsWith('data:')) {
      const payload = tail.slice(5).trim();
      if (payload !== '[DONE]') {
        try { const d = JSON.parse(payload); text += d?.choices?.[0]?.delta?.content || ''; } catch (e) {}
      }
      if (text.length !== last) { last = text.length; res.write('data: ' + JSON.stringify({ t: text }) + '\n\n'); }
    }
    res.end('data: {"done":true}\n\n');
  } finally { release(); }
}
