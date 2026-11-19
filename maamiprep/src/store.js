import { useEffect, useState, useCallback } from 'react';
import { today } from './data/index.js';

const KEY = 'maamiprep:v1';
const DEFAULT = {
  profile: null, // {name, examDate, planDays, goalQuiz, goalMock, bg, pose}
  mock: { n: 50, min: 35, ca: true, comp: true, impOnly: false, wrongOnly: false, neg: true },
  flash: { perDay: 20, every: 3, notif: false },
  favs: {},          // noteKey -> true
  myCards: [],       // user flash cards
  wrong: {},         // qid -> {q, a, topic}
  cardState: {},     // cardId -> {due, ivl}
  read: {},          // topicId -> true (marked done)
  seen: {},          // qid -> ts
  quizLog: {},       // date -> count
  mockLog: {},       // date -> count
  focusLog: {},      // date -> seconds
  xp: 0,
  dayShown: {},      // day index -> true (celebration shown)
  motivBag: [],      // remaining motivation indexes
  history: [],       // recent quiz/mock results
  timer: { mode: 'focus', mins: 25, endAt: null, left: 25 * 60, running: false },
};

function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); return s ? { ...DEFAULT, ...s } : DEFAULT; } catch { return DEFAULT; }
}
let state = load();
const subs = new Set();
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } }

export function getState() { return state; }
export function setState(fn) {
  const patch = typeof fn === 'function' ? fn(state) : fn;
  state = { ...state, ...patch };
  save();
  subs.forEach(f => f(state));
}
export function useStore() {
  const [s, set] = useState(state);
  useEffect(() => { subs.add(set); return () => subs.delete(set); }, []);
  return s;
}
export const bump = (logKey, n = 1) => setState(s => ({ [logKey]: { ...s[logKey], [today()]: (s[logKey][today()] || 0) + n } }));
export function useToggle(init = false) { const [v, s] = useState(init); return [v, useCallback(() => s(x => !x), [])]; }
export function resetAll() { localStorage.removeItem(KEY); state = DEFAULT; subs.forEach(f => f(state)); }
