import { useEffect, useRef, useState } from 'react';
import { TOPICS, TOPIC, pickQuestions, today } from '../data/index.js';
import { useStore, setState, getState, bump } from '../store.js';
import { Icon, Chan, Confetti, img, Toggle, fmt, Imp } from '../ui.jsx';
import { WRONG, RIGHT, LOW_SCORE, pick, CHAN_POSES } from '../data/chan.js';
import { buzz, chime } from '../native.js';

const L = ['A', 'B', 'C', 'D'];

function markSeen(qs) { const t = Date.now(); setState(s => { const seen = { ...s.seen }; qs.forEach(q => { seen[q.id] = t; }); return { seen }; }); }
function addWrong(q) { setState(s => ({ wrong: { ...s.wrong, [q.id]: { q: q.q, a: q.a, topic: q.topic } } })); }
function clearWrong(q) { setState(s => { if (!s.wrong[q.id]) return {}; const w = { ...s.wrong }; delete w[q.id]; return { wrong: w }; }); }

function Result({ title, score, total, extra, onReview, onAgain, onClose, mock }) {
  const pct = total ? Math.round(score / total * 100) : 0;
  const badge = pct >= 90 ? ['Gold Badge!', 'medal', 'g_cheer2', '#FFD86B'] : pct >= 75 ? ['Silver Star!', 'star', 'g_cheer1', '#E3E8F4'] : pct >= 50 ? ['Bronze Boost!', 'award', 'g_shy', '#F8D9BF'] : ['Keep going!', 'sprout', 'g_sad', '#E6DEFB'];
  useEffect(() => { chime(pct >= 50); buzz(true); }, []); // eslint-disable-line
  return <div className="overlay" style={{ background: `radial-gradient(circle at 50% 30%, ${badge[3]}, var(--scr) 70%)` }}>
    {pct >= 50 && <Confetti n={pct >= 90 ? 110 : 60} />}
    <div className="screen nonav" style={{ textAlign: 'center' }}>
      <div className="row" style={{ justifyContent: 'flex-end' }}><button className="ic" onClick={onClose}><Icon n="x" /></button></div>
      <img src={img(badge[2])} alt="" className="pop float" style={{ height: 230 }} />
      <h1 className="pop" style={{ animationDelay: '.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>{badge[0]} <Icon n={badge[1]} s={30} /></h1>
      <p className="mut mt8">{title}</p>
      <div className="card mt16 row pop" style={{ justifyContent: 'space-around', animationDelay: '.35s' }}>
        <div><b style={{ fontSize: 24 }}>{pct}%</b><p className="small mut">Score</p></div>
        <div><b style={{ fontSize: 24 }}>{mock ? score.toFixed(2) : score}/{total}</b><p className="small mut">{mock ? 'Marks' : 'Correct'}</p></div>
        <div><b style={{ fontSize: 24 }}>+{Math.max(5, Math.round(pct / 2))}</b><p className="small mut">XP</p></div>
      </div>
      {extra}
      <div className="mt12" style={{ textAlign: 'left' }}><Chan pose={pct >= 50 ? 'c_cheer' : 'c_help'} text={pct >= 90 ? 'Enna maami, topper aagita pola! Treat confirm 🎉' : pct >= 50 ? pick(RIGHT) + ' Wrong answers flash cards la pottachu.' : pick(LOW_SCORE)} /></div>
      <div className="row mt16"><button className="btn light grow" onClick={onReview}><Icon n="list-checks" s={18} /> Review</button><button className="btn dark grow" onClick={onAgain}>Next {mock ? 'mock' : 'quiz'} <Icon n="arrow-right" s={18} /></button></div>
    </div></div>;
}

function Review({ qs, ans, onClose }) {
  return <div className="overlay" style={{ background: 'var(--scr)' }}><div className="screen nonav">
    <div className="hdr"><button className="ic" onClick={onClose}><Icon n="arrow-left" /></button><div className="hi"><b>Review answers</b></div><div style={{ width: 46 }} /></div>
    {qs.map((q, i) => { const a = ans[i]; const ok = a === q.a; return <div key={i} className="note">
      <h5><span>{i + 1}. {q.q}</span><Icon n={a == null ? 'minus-circle' : ok ? 'check-circle-2' : 'x-circle'} s={20} color={a == null ? '#999' : ok ? '#3BB273' : '#E5484D'} /></h5>
      {a != null && !ok && <p className="small" style={{ color: 'var(--bad)' }}>Your answer: {a}</p>}
      <p className="small" style={{ color: 'var(--ok)', fontWeight: 600 }}>Correct: {q.a}</p>
      {q.e && <div className="hint"><Icon n="lightbulb" s={15} /><span>{q.e}</span></div>}
    </div>; })}
  </div></div>;
}

function QuizRun({ qs, title, onDone, onExit }) {
  const [i, setI] = useState(0); const [ans, setAns] = useState({}); const [line, setLine] = useState(null);
  const q = qs[i]; const chosen = ans[i];
  const choose = (o) => {
    if (chosen != null) return;
    const ok = o === q.a; setAns(a => ({ ...a, [i]: o })); buzz(!ok);
    if (ok) { clearWrong(q); if (Math.random() < 0.45) setLine({ t: pick(RIGHT), p: pick(['c_thumb', 'c_dance', 'c_cheer']) }); else setLine(null); }
    else { addWrong(q); setLine({ t: pick(WRONG), p: pick(['c_book', 'c_present', 'c_teach']) }); }
  };
  const next = () => { setLine(null); if (i + 1 < qs.length) setI(i + 1); else onDone(ans); };
  const correct = Object.entries(ans).filter(([k, v]) => qs[k].a === v).length;
  return <div className="overlay" style={{ background: 'var(--scr)' }}><div className="screen nonav">
    <div className="row between mb8"><button className="ic sm" onClick={onExit}><Icon n="x" s={18} /></button>
      <span className="chip c-blu" style={{ maxWidth: 190, overflow: 'hidden', whiteSpace: 'nowrap' }}>{TOPIC[q.topic]?.title.split(' (')[0]} · {i + 1}/{qs.length}</span>
      <span className="row" style={{ gap: 4, fontWeight: 700 }}><Icon n="flame" s={16} /> {correct}</span></div>
    <div className="bar light mb12"><i style={{ width: `${(i + (chosen != null)) / qs.length * 100}%` }} /></div>
    <div className="qbox pop" key={'q' + i}>{q.imp && <div className="mb8"><Imp label="IMP" /></div>}{q.q}</div>
    {q.shown.map((o, k) => {
      const cls = chosen == null ? '' : o === q.a ? 'ok' : o === chosen ? 'bad shake' : '';
      return <button key={i + o} className={`opt pop ${cls}`} style={{ animationDelay: k * 0.05 + 's' }} onClick={() => choose(o)}><b>{L[k]}</b>{o}</button>;
    })}
    {chosen != null && <>
      {q.e && <div className="hint pop"><Icon n="lightbulb" s={16} /><span>{q.e}</span></div>}
      {line && <div className="mt12"><Chan text={line.t} pose={line.p} h={86} /></div>}
      <button className="btn dark mt16" style={{ width: '100%' }} onClick={next}>{i + 1 < qs.length ? 'Next' : 'See result'} <Icon n="arrow-right" s={18} /></button>
    </>}
  </div></div>;
}

function MockRun({ qs, mins, neg, onDone, onExit }) {
  const [i, setI] = useState(0); const [ans, setAns] = useState({}); const [pal, setPal] = useState(false);
  const end = useRef(Date.now() + mins * 60000); const [left, setLeft] = useState(mins * 60);
  const doneRef = useRef(false);
  const submit = () => { if (doneRef.current) return; doneRef.current = true; onDone(ans, mins * 60 - Math.max(0, left)); };
  useEffect(() => { const t = setInterval(() => { const l = Math.round((end.current - Date.now()) / 1000); setLeft(l); if (l <= 0) submit(); }, 500); return () => clearInterval(t); }); // eslint-disable-line
  const q = qs[i]; const answered = Object.keys(ans).length;
  return <div className="overlay" style={{ background: 'var(--scr)' }}><div className="screen nonav">
    <div className="row between mb8"><button className="ic sm" onClick={() => { if (confirm('Exit mock? Progress will be lost.')) onExit(); }}><Icon n="x" s={18} /></button>
      <span className="chip c-blu">Mock · Q {i + 1}/{qs.length}</span>
      <span className={`timerpill ${left < 60 ? 'low' : ''}`}><Icon n="timer" s={15} /> {fmt(Math.max(0, left))}</span></div>
    <div className="bar light mb12"><i style={{ width: `${answered / qs.length * 100}%` }} /></div>
    <div className="qbox fade" key={'m' + i}>{q.q}</div>
    {q.shown.map((o, k) => <button key={i + o} className={`opt ${ans[i] === o ? 'sel' : ''}`} onClick={() => { buzz(); setAns(a => { const n = { ...a }; if (n[i] === o) delete n[i]; else n[i] = o; return n; }); }}><b>{L[k]}</b>{o}</button>)}
    <div className="row mt12">
      <button className="btn light grow" disabled={i === 0} onClick={() => setI(i - 1)}><Icon n="chevron-left" s={18} /> Prev</button>
      <button className="btn light" onClick={() => setPal(!pal)}><Icon n="layout-grid" s={18} /></button>
      {i + 1 < qs.length ? <button className="btn dark grow" onClick={() => setI(i + 1)}>Next <Icon n="chevron-right" s={18} /></button>
        : <button className="btn org grow" onClick={() => { if (confirm(`Submit? ${qs.length - answered} unanswered.`)) submit(); }}>Submit</button>}
    </div>
    {pal && <div className="card mt12 pop"><div className="row between mb8"><b className="small">{answered} answered · {qs.length - answered} left</b>{neg && <span className="tiny mut">−0.25 per wrong</span>}</div>
      <div className="palette">{qs.map((_, k) => <button key={k} className={`${ans[k] != null ? 'ans' : ''} ${k === i ? 'cur' : ''}`} onClick={() => { setI(k); setPal(false); }}>{k + 1}</button>)}</div>
      <button className="btn org mt12" style={{ width: '100%' }} onClick={() => { if (confirm(`Submit? ${qs.length - answered} unanswered.`)) submit(); }}>Submit mock</button></div>}
  </div></div>;
}

export default function Quiz({ preset, clearPreset }) {
  const s = useStore(); const [mode, setMode] = useState('quiz');
  const [sel, setSel] = useState('all-ca'); const [n, setN] = useState(10);
  const [run, setRun] = useState(null); const [res, setRes] = useState(null); const [rev, setRev] = useState(null);
  const p = s.profile; const m = s.mock;
  const qDone = s.quizLog[today()] || 0, mDone = s.mockLog[today()] || 0;

  const startQuiz = (topicIds, opts = {}) => {
    const qs = pickQuestions(topicIds, n, getState().seen, opts);
    if (!qs.length) { alert('No questions here yet!'); return; }
    markSeen(qs); setRun({ kind: 'quiz', qs, title: opts.title || 'Quiz' });
  };
  useEffect(() => { if (preset) { setMode('quiz'); startQuiz(preset, { title: TOPIC[preset[0]]?.title }); clearPreset(); } }, [preset]); // eslint-disable-line

  const go = () => {
    if (sel === 'all-ca') return startQuiz(TOPICS.filter(t => t.sec === 'ca').map(t => t.id), { title: 'Current Affairs mix' });
    if (sel === 'all-comp') return startQuiz(TOPICS.filter(t => t.sec === 'comp').map(t => t.id), { title: 'Computer mix' });
    if (sel === 'imp') return startQuiz(null, { impOnly: true, title: 'IMP only' });
    if (sel === 'wrong') return startQuiz(null, { ids: Object.keys(s.wrong), title: 'My wrong questions' });
    return startQuiz([sel], { title: TOPIC[sel].title });
  };
  const startMock = () => {
    let ids = TOPICS.filter(t => (m.ca && t.sec === 'ca') || (m.comp && t.sec === 'comp')).map(t => t.id);
    if (!ids.length) ids = null;
    const qs = pickQuestions(ids, m.n, getState().seen, { impOnly: m.impOnly, ids: m.wrongOnly ? Object.keys(s.wrong) : undefined });
    if (!qs.length) { alert('No questions for these settings.'); return; }
    markSeen(qs); setRun({ kind: 'mock', qs, mins: m.min, neg: m.neg });
  };
  const finish = (ans, used) => {
    const qs = run.qs; const correct = qs.filter((q, i) => ans[i] === q.a).length; const wrong = qs.filter((q, i) => ans[i] != null && ans[i] !== q.a).length;
    if (run.kind === 'mock') qs.forEach((q, i) => { if (ans[i] != null && ans[i] !== q.a) addWrong(q); else if (ans[i] === q.a) clearWrong(q); });
    const score = run.kind === 'mock' ? correct - (run.neg ? wrong * 0.25 : 0) : correct;
    const pct = Math.round(Math.max(0, score) / qs.length * 100);
    bump(run.kind === 'mock' ? 'mockLog' : 'quizLog');
    // a good topic quiz marks the topic done
    const topicIds = [...new Set(qs.map(q => q.topic))];
    setState(st => ({ xp: st.xp + Math.max(5, Math.round(pct / 2)), history: [{ d: Date.now(), kind: run.kind, title: run.title || 'Mock test', pct }, ...st.history].slice(0, 30),
      read: topicIds.length === 1 && pct >= 60 ? { ...st.read, [topicIds[0]]: true } : st.read }));
    setRes({ ...run, ans, score, correct, wrong, used });
    setRun(null);
  };

  return <div className="screen">
    <div className="seg mt8 mb16"><button className={mode === 'quiz' ? 'on' : ''} onClick={() => setMode('quiz')}><Icon n="circle-help" s={15} /> Quiz</button><button className={mode === 'mock' ? 'on' : ''} onClick={() => setMode('mock')}><Icon n="timer" s={15} /> Mock</button></div>
    <div className="lbl">Today's goal</div>
    <div className="row mb16">
      <div className="stat c-org grow pop"><b>{qDone}/{p.goalQuiz} {qDone >= p.goalQuiz && <Icon n="check-circle-2" s={18} />}</b><p>Quizzes</p></div>
      <div className="stat c-pnk grow pop" style={{ animationDelay: '.05s' }}><b>{mDone}/{p.goalMock} {mDone >= p.goalMock && <Icon n="check-circle-2" s={18} />}</b><p>Mocks ({m.min} min)</p></div>
      <div className="stat c-blu grow pop" style={{ animationDelay: '.1s' }}><b>{Object.keys(s.wrong).length}</b><p>To fix</p></div>
    </div>

    {mode === 'quiz' ? <>
      <div className="lbl">Choose a set</div>
      <div className="row wrap" style={{ gap: 8 }}>
        {[['all-ca', 'CA mix', 'newspaper'], ['all-comp', 'Computer mix', 'monitor'], ['imp', 'IMP only', 'flame'], ['wrong', `My wrong (${Object.keys(s.wrong).length})`, 'rotate-ccw']].map(([id, l, ic]) =>
          <button key={id} className={`chip tap ${sel === id ? 'c-pur' : ''}`} style={{ padding: '9px 13px', fontWeight: 600, background: sel === id ? undefined : '#fff' }} onClick={() => setSel(id)}><Icon n={ic} s={14} /> {l}</button>)}
      </div>
      <div className="lbl mt16">Or one topic</div>
      <div className="row wrap" style={{ gap: 6 }}>
        {TOPICS.map(t => <button key={t.id} className={`chip tap ${sel === t.id ? `c-${t.color === 'white' ? 'pur' : t.color}` : ''}`} style={{ background: sel === t.id ? undefined : '#fff', padding: '7px 11px', outline: sel === t.id ? '2px solid var(--ink)' : 'none' }} onClick={() => setSel(t.id)}>{t.title.split(' (')[0]}</button>)}
      </div>
      <div className="lbl mt16">Questions</div>
      <div className="seg">{[5, 10, 20, 30].map(k => <button key={k} className={n === k ? 'on' : ''} onClick={() => setN(k)}>{k}</button>)}</div>
      <button className="btn dark mt16" style={{ width: '100%' }} onClick={go}>Start quiz <Icon n="play" s={16} /></button>
      <div className="mt16"><Chan pose="c_book" text="Questions every time shuffle aagum, already paatha questions last-ku pogum. Cheat panna mudiyathu 😏" /></div>
    </> : <>
      <div className="card mb12"><div className="lbl"><Icon n="list-ordered" s={14} /> Questions</div>
        <div className="row between"><b style={{ fontSize: 28 }}>{m.n}</b><span className="small mut">10 – 200</span></div>
        <input type="range" min={10} max={200} step={5} value={m.n} onChange={e => setState(st => ({ mock: { ...st.mock, n: +e.target.value } }))} /></div>
      <div className="card mb12"><div className="lbl"><Icon n="timer" s={14} /> Time limit</div>
        <div className="row between"><b style={{ fontSize: 28 }}>{m.min} min</b><span className="small mut">5 – 120</span></div>
        <input type="range" min={5} max={120} step={5} value={m.min} onChange={e => setState(st => ({ mock: { ...st.mock, min: +e.target.value } }))} /></div>
      <div className="card mb12"><div className="lbl"><Icon n="layout-grid" s={14} /> Sections</div>
        <div className="row wrap" style={{ gap: 6 }}>{[['ca', 'Current Affairs'], ['comp', 'Computer'], ['impOnly', 'IMP only'], ['wrongOnly', 'My wrong Qs']].map(([k, l]) =>
          <button key={k} className="chip tap" style={{ padding: '8px 12px', fontWeight: 600, background: m[k] ? 'var(--ink)' : '#f0eef7', color: m[k] ? '#fff' : 'inherit' }} onClick={() => setState(st => ({ mock: { ...st.mock, [k]: !st.mock[k] } }))}>{m[k] && <Icon n="check" s={12} />} {l}</button>)}</div></div>
      <div className="card row between mb12"><span>Negative marking (−0.25)</span><Toggle on={m.neg} set={v => setState(st => ({ mock: { ...st.mock, neg: v } }))} /></div>
      <Chan pose="c_present" text={`${m.n} questions, ${m.min} minutes. Phone-la Instagram open panna timer pause aagathu, FYI 😌`} />
      <button className="btn dark mt16" style={{ width: '100%' }} onClick={startMock}>Start mock <Icon n="play" s={16} /></button>
    </>}

    {s.history.length > 0 && <><div className="lbl mt20">Recent</div>
      {s.history.slice(0, 5).map((h, k) => <div key={k} className="listrow"><div className={`ic sm ${h.kind === 'mock' ? 'c-pnk' : 'c-org'}`}><Icon n={h.kind === 'mock' ? 'timer' : 'circle-help'} s={16} /></div>
        <div className="grow"><b style={{ fontSize: 14 }}>{h.title}</b><div className="tiny mut">{new Date(h.d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div></div><b>{h.pct}%</b></div>)}</>}

    {run?.kind === 'quiz' && <QuizRun qs={run.qs} title={run.title} onDone={finish} onExit={() => setRun(null)} />}
    {run?.kind === 'mock' && <MockRun qs={run.qs} mins={run.mins} neg={run.neg} onDone={finish} onExit={() => setRun(null)} />}
    {res && !rev && <Result title={res.kind === 'mock' ? `Mock · ${res.qs.length} Qs · ${fmt(res.used || 0)} used` : res.title} score={res.kind === 'mock' ? Math.max(0, res.score) : res.correct} total={res.qs.length} mock={res.kind === 'mock'}
      extra={res.kind === 'mock' && <div className="row mt12" style={{ gap: 8 }}><div className="stat c-grn grow"><b>{res.correct}</b><p>Correct</p></div><div className="stat grow" style={{ background: '#FDECEC' }}><b>{res.wrong}</b><p>Wrong</p></div><div className="stat c-white grow"><b>{res.qs.length - res.correct - res.wrong}</b><p>Skipped</p></div></div>}
      onReview={() => setRev(res)} onClose={() => setRes(null)} onAgain={() => { setRes(null); res.kind === 'mock' ? startMock() : go(); }} />}
    {rev && <Review qs={rev.qs} ans={rev.ans} onClose={() => setRev(null)} />}
  </div>;
}
export { CHAN_POSES };
