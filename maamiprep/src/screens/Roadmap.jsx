import { useEffect, useRef, useState } from 'react';
import { TOPIC, daysBetween, today } from '../data/index.js';
import { useStore, setState } from '../store.js';
import { Icon, img, Sheet, Stepper, Chan, Confetti } from '../ui.jsx';
import { planInfo } from './Study.jsx';
import { DAY_MSG, FINAL_MSG } from '../data/chan.js';
import { buzz, chime } from '../native.js';

export const dayMessage = (i, total) => i === total - 1 ? FINAL_MSG : (DAY_MSG[i] || `Day ${i + 1} done! ${total - i - 1} more days. Keep going maami 💪`);

export function DayCelebrate({ day, total, onClose }) {
  const final = day === total - 1;
  useEffect(() => { chime(true); buzz(true); }, []);
  return <div className="overlay" style={{ background: final ? 'linear-gradient(180deg,#FFD86B,#FFF3C9)' : 'radial-gradient(circle at 50% 35%, #E9FFE0, var(--scr) 70%)' }}>
    <Confetti n={final ? 140 : 70} />
    <div className="screen nonav center">
      <div className="row" style={{ justifyContent: 'flex-end' }}><button className="ic" onClick={onClose}><Icon n="x" /></button></div>
      {final ? <img src={img('logo')} alt="Hired!" className="pop" style={{ width: '88%', borderRadius: 30, marginTop: 4 }} />
        : <img src={img(`st_${[0, 6, 8, 3, 13, 17][day % 6]}`)} alt="" className="pop float" style={{ width: 230, borderRadius: 30, marginTop: 10 }} />}
      <h1 className="pop mt16" style={{ animationDelay: '.2s' }}>{final ? 'You did it! 🎉' : `Day ${day + 1} complete!`}</h1>
      <div className="card mt16 pop" style={{ animationDelay: '.35s', fontSize: 17, lineHeight: 1.5, fontWeight: 500 }}>"{dayMessage(day, total)}"<div className="small mut mt8">— Chan</div></div>
      <button className="btn dark mt20" style={{ width: '100%' }} onClick={onClose}>{final ? 'Thank you Chan ❤️' : 'Lets gooo'} <Icon n="arrow-right" s={18} /></button>
    </div></div>;
}

export function PlanSettings({ onClose }) {
  const s = useStore(); const p = s.profile;
  const upd = (k, v) => setState(st => ({ profile: { ...st.profile, [k]: v } }));
  return <Sheet onClose={onClose}>
    <h2 className="mb12">Exam & plan</h2>
    <div className="lbl"><Icon n="calendar" s={14} /> Exam date</div>
    <input type="date" value={p.examDate} min={today()} onChange={e => e.target.value && upd('examDate', e.target.value)} />
    <div className="card row between mt12"><div><b>Plan length</b><div className="small mut">Topics re-split automatically</div></div><Stepper v={p.planDays} set={v => upd('planDays', v)} min={1} max={30} /></div>
    <button className="btn dark mt16" style={{ width: '100%' }} onClick={onClose}>Done</button>
  </Sheet>;
}

export default function Roadmap({ openTopic }) {
  const s = useStore(); const p = s.profile; const { plan, doneDays, cur } = planInfo(s);
  const [open, setOpen] = useState(null); const [edit, setEdit] = useState(false);
  const N = plan.length; const W = 360, gap = 150, H = N * gap + 230;
  const pts = plan.map((_, i) => ({ x: 180 + 110 * Math.sin(i * 1.25 + 0.6), y: H - 110 - i * gap }));
  const goal = { x: 180 + 80 * Math.sin(N * 1.25 + 0.6), y: H - 110 - N * gap + 30 };
  const all = [...pts, goal];
  let d = `M ${all[0].x} ${all[0].y}`;
  for (let i = 1; i < all.length; i++) { const a = all[i - 1], b = all[i]; const my = (a.y + b.y) / 2; d += ` C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`; }
  const scroller = useRef(null);
  useEffect(() => { const el = scroller.current?.closest('.screen'); if (el) el.scrollTop = Math.max(0, pts[cur].y - 380); }, [cur]); // eslint-disable-line
  const left = Math.max(0, daysBetween(today(), p.examDate));
  const xPct = (x) => `${x / W * 100}%`;
  return <div className="screen" style={{ background: 'transparent' }}>
    <div className="hdr"><div><h2>Road to the Job</h2>
      <button className="small mut row" style={{ gap: 4 }} onClick={() => setEdit(true)}><Icon n="calendar" s={13} /> Exam {new Date(p.examDate + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {left} days left · {N}-day plan <Icon n="pencil" s={12} /></button></div>
      <button className="ic" onClick={() => setEdit(true)}><Icon n="sliders-horizontal" /></button></div>
    <div className="row mb8" style={{ gap: 8 }}>
      <div className="stat c-grn grow"><b>{doneDays.filter(Boolean).length}/{N}</b><p>Days done</p></div>
      <div className="stat c-white grow"><b>{Object.values(s.read).filter(Boolean).length}</b><p>Topics done</p></div>
    </div>
    <div className="road" ref={scroller} style={{ height: H }}>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
        <path d={d} stroke="#fff" strokeWidth="30" fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path d={d} stroke="#C9B9FF" strokeWidth="4" strokeDasharray="8 10" fill="none" vectorEffect="non-scaling-stroke"><animate attributeName="stroke-dashoffset" from="0" to="-36" dur="1.5s" repeatCount="indefinite" /></path>
      </svg>
      <div style={{ position: 'absolute', left: xPct(goal.x), top: goal.y, transform: 'translate(-50%,-80%)', textAlign: 'center' }} className="float">
        <img src={img(doneDays.every(Boolean) ? 'logo' : 'g_tab')} style={{ height: 100, borderRadius: doneDays.every(Boolean) ? 20 : 0 }} alt="" />
        <div className="chip" style={{ background: '#fff', fontWeight: 700 }}><Icon n="briefcase" s={13} /> Government Job!</div>
      </div>
      {pts.map((pt, i) => {
        const st = doneDays[i] ? 'done' : i === cur ? 'cur' : 'lock';
        const rightSide = pt.x < 180;
        return <div key={i}>
          <button className={`node ${st} pop`} style={{ left: xPct(pt.x), top: pt.y, animationDelay: i * 0.06 + 's' }} onClick={() => { buzz(); setOpen(i); }}>
            {doneDays[i] ? <Icon n="check" s={24} /> : i + 1}</button>
          <div className="ntag" style={{ top: pt.y, ...(rightSide ? { left: `calc(${xPct(pt.x)} + 42px)` } : { right: `calc(${100 - pt.x / W * 100}% + 42px)` }) }}>
            Day {i + 1}: {plan[i].slice(0, 2).map(id => TOPIC[id].title.split(' ')[0]).join(' · ')}{plan[i].length > 2 ? ` +${plan[i].length - 2}` : ''}</div>
        </div>;
      })}
      <img className="walker" src={img(doneDays.every(Boolean) ? 'g_cheer2' : 'g_cheer1')} alt="" style={{ left: xPct(pts[cur].x), top: pts[cur].y - 30 }} />
    </div>
    {open != null && <Sheet onClose={() => setOpen(null)}>
      <div className="row between mb12"><h2>Day {open + 1}</h2>{doneDays[open] && <span className="chip c-grn"><Icon n="check" s={13} /> Completed</span>}</div>
      {doneDays[open] && <div className="mb12"><Chan pose="c_cheer" text={dayMessage(open, N)} /></div>}
      {plan[open].map(id => { const t = TOPIC[id]; return <div key={id} className="listrow">
        <button className={`check ${s.read[id] ? 'on' : ''}`} onClick={() => { buzz(); setState(st => ({ read: { ...st.read, [id]: !st.read[id] } })); }}>{s.read[id] && <Icon n="check" s={16} />}</button>
        <button className="grow" style={{ textAlign: 'left' }} onClick={() => { setOpen(null); openTopic(id); }}><b style={{ fontSize: 14 }}>{t.title}</b><div className="tiny mut">{t.sec === 'ca' ? 'Current Affairs' : 'Computer'} · {t.notes.length} notes{t.imp ? ' · IMP' : ''}</div></button>
        <Icon n="chevron-right" s={18} /></div>; })}
      <p className="tiny mut center mt8">Tick a topic after studying it, or score 60%+ in its quiz.</p>
    </Sheet>}
    {edit && <PlanSettings onClose={() => setEdit(false)} />}
  </div>;
}
