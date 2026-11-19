import { useMemo, useState } from 'react';
import { TOPICS, TOPIC, noteToCard, buildPlan, daysBetween, today } from '../data/index.js';
import { useStore, setState } from '../store.js';
import { Icon, Imp, img, Chan } from '../ui.jsx';
import { buzz } from '../native.js';

export function planInfo(s) {
  const p = s.profile; const plan = buildPlan(p.planDays);
  const doneDays = plan.map(d => d.every(id => s.read[id]));
  let cur = doneDays.findIndex(d => !d); if (cur < 0) cur = plan.length - 1;
  return { plan, doneDays, cur, allDone: doneDays.every(Boolean) };
}

function NoteText({ text }) {
  // render "Ctrl+X" combos as key caps
  const parts = text.split(/((?:Ctrl|Alt|Shift|Win)(?:\+[\w;=`$%<>[\]/]+)+|F\d{1,2}\b)/g);
  return parts.map((p, i) => /^(Ctrl|Alt|Shift|Win)\+|^F\d/.test(p) ? p.split('+').map((k, j) => <span key={i + '-' + j} className="k">{k}</span>) : p);
}

export function NoteCard({ t, n, idx }) {
  const s = useStore();
  const key = `${t.id}:${idx}`;
  const fav = !!s.favs[key];
  const card = noteToCard(t, n, idx);
  const flashed = s.myCards.some(c => c.id === card.id);
  return <div className="note pop" style={{ animationDelay: idx * 0.05 + 's' }}>
    <h5><span>{n.h}</span>{n.imp && <Imp label="ASKED" />}</h5>
    {n.pts && <ul>{n.pts.map((p, i) => <li key={i}><NoteText text={p} /></li>)}</ul>}
    {n.table && <table><tbody>{n.table.map((r, i) => <tr key={i}><td><NoteText text={r[0]} /></td><td>{r[1]}</td></tr>)}</tbody></table>}
    {n.hint && <div className="hint"><Icon n="lightbulb" s={16} /><span><b>Hint:</b> {n.hint}</span></div>}
    <div className="acts">
      <button className={`fav ${fav ? 'on' : ''}`} onClick={() => { buzz(); setState(st => { const f = { ...st.favs }; if (fav) delete f[key]; else f[key] = true; return { favs: f }; }); }}>
        <Icon n="heart" s={15} fill={fav ? '#fff' : 'none'} /> {fav ? 'Saved' : 'Favourite'}</button>
      <button className={`flashme ${flashed ? 'on' : ''}`} onClick={() => { buzz(); setState(st => ({ myCards: flashed ? st.myCards.filter(c => c.id !== card.id) : [...st.myCards, card] })); }}>
        <Icon n={flashed ? 'check' : 'zap'} s={15} /> {flashed ? 'In flash cards' : 'Flash me'}</button>
    </div>
  </div>;
}

export function TopicView({ id, back, startQuiz }) {
  const t = TOPIC[id]; const s = useStore(); const done = !!s.read[id];
  return <div className="screen">
    <div className="hdr"><button className="ic" onClick={back}><Icon n="arrow-left" /></button>
      <div className="hi"><b>{t.title}</b><span>{t.sec === 'ca' ? 'Current Affairs' : 'Computer Awareness'} · {t.notes.length} notes</span></div>
      <div className={`ic c-${t.color}`}><Icon n={t.icon} /></div></div>
    {t.imp && <div className="hint mb12" style={{ background: '#FFE3E3' }}><Icon n="flame" s={16} /><span><b>Frequently asked</b> in SBI/IBPS Clerk Mains – don't skip!</span></div>}
    {t.notes.map((n, i) => <NoteCard key={i} t={t} n={n} idx={i} />)}
    {t.sec === 'ca' && <p className="tiny mut center mb12">Collected from news & exam-prep sources (Nov 2026). Double-check numbers with RBI/PIB before the exam.</p>}
    <div className="row mt8">
      <button className="btn light grow" onClick={() => startQuiz([id])}><Icon n="circle-help" s={18} /> Quiz this</button>
      <button className={`btn grow ${done ? 'light' : 'dark'}`} onClick={() => { buzz(true); setState(st => ({ read: { ...st.read, [id]: !done }, xp: st.xp + (done ? 0 : 10) })); }}>
        <Icon n={done ? 'rotate-ccw' : 'check-circle-2'} s={18} /> {done ? 'Mark not done' : 'Mark done'}</button>
    </div>
  </div>;
}

export default function Study({ openTopic, openTimer }) {
  const s = useStore(); const [sec, setSec] = useState('ca'); const [q, setQ] = useState('');
  const p = s.profile; const { plan, cur } = planInfo(s);
  const dayTopics = plan[cur]; const dayDone = dayTopics.filter(id => s.read[id]).length;
  const left = Math.max(0, daysBetween(today(), p.examDate));
  const list = TOPICS.filter(t => t.sec === sec);
  const results = useMemo(() => {
    if (q.trim().length < 2) return [];
    const k = q.toLowerCase(); const out = [];
    TOPICS.forEach(t => t.notes.forEach((n, i) => {
      const txt = [n.h, ...(n.pts || []), ...(n.table || []).flat(), n.hint || ''].join(' ');
      const at = txt.toLowerCase().indexOf(k);
      if (at >= 0) out.push({ t, i, snip: txt.slice(Math.max(0, at - 30), at + 70) });
    }));
    return out.slice(0, 40);
  }, [q]);
  const favList = Object.keys(s.favs).map(k => { const [tid, i] = k.split(':'); return TOPIC[tid] && { t: TOPIC[tid], i: +i }; }).filter(Boolean);
  const hour = new Date().getHours();
  return <div className="screen">
    <div className="hdr">
      <div className="av" />
      <div className="hi"><b>{hour < 12 ? 'Good morning' : hour < 17 ? 'Hello' : 'Good evening'}, {p.name}</b>
        <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {left} day{left === 1 ? '' : 's'} to exam</span></div>
      <button className="ic" onClick={openTimer}><Icon n="timer" /></button>
    </div>

    <div className="search"><Icon n="search" s={18} /><input placeholder="Search all notes…" value={q} onChange={e => setQ(e.target.value)} />{q && <button onClick={() => setQ('')}><Icon n="x" s={18} /></button>}</div>
    {q.trim().length >= 2 ? <div>
      <div className="lbl">{results.length} results</div>
      {results.map((r, k) => <button key={k} className="listrow pop" style={{ animationDelay: k * 0.02 + 's' }} onClick={() => openTopic(r.t.id)}>
        <div className={`ic sm c-${r.t.color}`}><Icon n={r.t.icon} s={16} /></div>
        <div className="grow"><b style={{ fontSize: 14 }}>{r.t.title}</b><div className="small mut">…{r.snip}…</div></div></button>)}
      {!results.length && <div className="empty"><img src={img('c_book')} alt="" /><p>Chan searched everywhere. Nothing. Try another word 🤷‍♂️</p></div>}
    </div> : <>
      <div className="hero c-pur pop">
        <h1>Today's<br />target</h1>
        <p style={{ fontSize: 13, marginTop: 6, maxWidth: '58%' }}>Day {cur + 1} · {dayTopics.slice(0, 3).map(id => TOPIC[id].title.split(' ')[0]).join(' + ')}{dayTopics.length > 3 ? ' …' : ''}</p>
        <div className="bar mt12" style={{ width: '56%' }}><i style={{ width: `${dayDone / dayTopics.length * 100}%` }} /></div>
        <p className="tiny" style={{ marginTop: 5 }}>{dayDone} / {dayTopics.length} topics · {(s.quizLog[today()] || 0)}/{p.goalQuiz} quizzes</p>
        <img src={img('g_desk')} className="sway" alt="" style={{ height: 150 }} />
      </div>
      <div className="seg mt16 mb12">
        <button className={sec === 'ca' ? 'on' : ''} onClick={() => setSec('ca')}>Current Affairs</button>
        <button className={sec === 'comp' ? 'on' : ''} onClick={() => setSec('comp')}>Computer</button>
        <button className={sec === 'fav' ? 'on' : ''} onClick={() => setSec('fav')}><Icon n="heart" s={14} /> {favList.length}</button>
      </div>
      {sec === 'fav' ? <div>
        {favList.length ? favList.map(({ t, i }) => <div key={t.id + i}><div className="lbl"><Icon n={t.icon} s={13} /> {t.title}</div><NoteCard t={t} n={t.notes[i]} idx={i} /></div>)
          : <Chan pose="c_present" text="Favourites empty-a irukku. Note-la ♥ press pannu, inga varum. Simple 😌" />}
      </div> :
        <div className="grid2">{list.map((t, i) => {
          const tall = i % 5 === 0;
          return <button key={t.id} className={`tile c-${t.color} pop tap ${s.read[t.id] ? 'done' : ''}`} style={{ gridRow: tall ? 'span 2' : undefined, animationDelay: i * 0.04 + 's', minHeight: tall ? 268 : 128 }} onClick={() => openTopic(t.id)}>
            <div className="row wrap" style={{ gap: 5 }}><span className="chip">{t.notes.length} notes</span>{t.imp && <Imp />}</div>
            <h4>{t.title}</h4><p>{t.blurb}</p>
            <div className="tic" style={tall ? { bottom: 40 } : null}><Icon n={t.icon} s={tall ? 54 : 28} /></div>
            {tall && <div className="prog">{s.read[t.id] ? 'Done ✓' : 'Tap to study'}</div>}
          </button>;
        })}</div>}
    </>}
  </div>;
}
