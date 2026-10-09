// ai-judge endpoint with a mocked model (no real AI call):  node tools/learning-path/judge-endpoint.test.mjs
process.env.OPENAI_API_KEY = 'test-not-a-real-key';
let sent = null;
globalThis.fetch = async (url, init) => {
  sent = JSON.parse(init.body);
  const results = JSON.parse(sent.messages[1].content).map(x => ({ correct: x.answer.includes('水果') || x.answer === x.expected, partial: false, feedback: '' }));
  return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ results }) } }] }), { status: 200 });
};
const { handle } = await import(new URL('../../api/_minest/core.mjs', import.meta.url).href);
const out = await handle('/ai-judge', { items: [
  { kind: 'meaning', term: 'apple', expected: '苹果', answer: '一种红色的水果' },
  { kind: 'term', term: 'photosynthesis', expected: 'photosynthesis', answer: 'photosynthesis' },
  { kind: 'bogus', term: 'x', expected: 'y', answer: 'z' }
] });
console.log(JSON.stringify(out));
console.log('schema:', sent.response_format && sent.response_format.json_schema.name, '· system prompt has kinds:', /kind "meaning"/.test(sent.messages[0].content));
