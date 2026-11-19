import { caNews } from './ca_news.js';
import { caStatic } from './ca_static.js';
import { comp } from './comp.js';

export const TOPICS = [
  ...caNews.map(t => ({ ...t, sec: 'ca' })),
  ...caStatic.map(t => ({ ...t, sec: 'ca' })),
  ...comp.map(t => ({ ...t, sec: 'comp' })),
];
export const TOPIC = Object.fromEntries(TOPICS.map(t => [t.id, t]));

export const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uniq = (a) => [...new Set(a)];

// ---------- question bank ----------
const MONTH = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i;
export function kind(a) {
  if (/^(Ctrl|Alt|Shift|Win|F\d)/.test(a)) return 'key';
  if (/%/.test(a)) return 'pct';
  if (/[₹$€£]|crore|lakh|billion|million|trillion/i.test(a)) return 'money';
  if (/^\d{1,2}(st|nd|rd|th)?\s/.test(a) && MONTH.test(a) || /^\d{4}$/.test(a) || /^(January|February|March|April|May|June|July|August|September|October|November|December)\b/.test(a)) return 'date';
  if (/^(Section|Article)\b/.test(a)) return 'law';
  if (/^\.\w+$/.test(a)) return 'ext';
  if (/^[\d.,/–\- ]+(st|nd|rd|th|bits?|bit|GB|MB|TB|days?|-bit)?$/i.test(a) || /^\d/.test(a)) return 'num';
  if (/^[A-Z0-9&\-/]{2,8}$/.test(a)) return 'acr';
  return a.split(' ').length > 6 ? 'long' : 'text';
}
function buildBank() {
  const bank = [];
  const byKind = {};
  TOPICS.forEach(t => (t.facts || []).forEach(f => { const k = t.sec + kind(f[1]); (byKind[k] = byKind[k] || []).push(f[1]); }));
  for (const t of TOPICS) {
    (t.qs || []).forEach((q, i) => bank.push({ id: `${t.id}:q${i}`, topic: t.id, q: q[0], opts: q[1], a: q[1][q[2]], e: q[3], imp: t.imp }));
    const facts = t.facts || [];
    const answers = uniq(facts.map(f => f[1]));
    const prompts = facts.map(f => f[0]);
    facts.forEach(([p, ans], i) => {
      const k = kind(ans);
      // similar prompts first ("Currency of…", "HQ of…"), then same topic + same kind, then section + kind
      const pre = p.split(' ').slice(0, 2).join(' ');
      const sib = uniq(facts.filter(f => f[0] !== p && f[0].startsWith(pre) && f[1] !== ans).map(f => f[1]));
      let pool = shuffle(sib);
      if (pool.length < 3) pool = uniq([...pool, ...shuffle(answers.filter(a => a !== ans && kind(a) === k))]);
      if (pool.length < 3) pool = uniq([...pool, ...shuffle((byKind[t.sec + k] || []).filter(a => a !== ans))]);
      if (pool.length < 3) pool = uniq([...pool, ...shuffle(answers.filter(a => a !== ans))]);
      const d = pool.slice(0, 3);
      if (d.length === 3) bank.push({ id: `${t.id}:f${i}`, topic: t.id, q: `${p}?`, opts: [ans, ...d], a: ans, e: `${p} → ${ans}`, imp: t.imp });
      // reverse form – only when the answer is a short, unique "name"
      if (ans.length <= 34 && answers.filter(a => a === ans).length === 1 && facts.filter(f => f[1] === ans).length === 1 && prompts.length >= 4) {
        const dp = shuffle(prompts.filter(x => x !== p)).slice(0, 3);
        bank.push({ id: `${t.id}:r${i}`, topic: t.id, q: `"${ans}" is the correct answer for:`, opts: [p, ...dp], a: p, e: `${p} → ${ans}`, imp: t.imp });
      }
    });
  }
  return bank;
}
export const BANK = buildBank();

// pick n questions from topics, preferring unseen, then least recently seen
export function pickQuestions(topicIds, n, seen = {}, opts = {}) {
  let pool = BANK.filter(q => !topicIds || topicIds.includes(q.topic));
  if (opts.impOnly) pool = pool.filter(q => q.imp);
  if (opts.ids) pool = BANK.filter(q => opts.ids.includes(q.id));
  const unseen = shuffle(pool.filter(q => !seen[q.id]));
  const old = pool.filter(q => seen[q.id]).sort((a, b) => seen[a.id] - seen[b.id]);
  return [...unseen, ...old].slice(0, n).map(q => ({ ...q, shown: shuffle(q.opts) }));
}

// ---------- flash cards ----------
export const BASE_CARDS = TOPICS.flatMap(t => (t.facts || []).map((f, i) => ({ id: `fc:${t.id}:${i}`, topic: t.id, front: f[0], back: f[1], imp: t.imp, kind: 'base' })));

export function noteToCard(t, n, idx) {
  const back = n.table ? n.table.map(r => `${r[0]} – ${r[1]}`).join('\n') : (n.pts || []).join('\n');
  return { id: `my:${t.id}:${idx}`, topic: t.id, front: `${t.title}: ${n.h}`, back, imp: !!n.imp, kind: 'mine' };
}

// ---------- roadmap ----------
export function buildPlan(days) {
  const ca = TOPICS.filter(t => t.sec === 'ca').sort((a, b) => (b.imp - a.imp));
  const cp = TOPICS.filter(t => t.sec === 'comp').sort((a, b) => (b.imp - a.imp));
  const plan = Array.from({ length: days }, () => []);
  ca.forEach((t, i) => plan[i % days].push(t.id));
  cp.forEach((t, i) => plan[(days - 1 - (i % days))].push(t.id));
  return plan;
}

export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
