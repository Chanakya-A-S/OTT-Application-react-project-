import { useState } from 'react';
import { TOPICS, today } from '../data/index.js';
import { useStore, setState, resetAll } from '../store.js';
import { Icon, img, Sheet, Stepper } from '../ui.jsx';
import { NAMES } from '../data/chan.js';
import { PlanSettings } from './Roadmap.jsx';
import { buzz } from '../native.js';

export const STAGES = [
  { pose: 'g_sleep', name: 'Sleepy Starter', at: 0 }, { pose: 'g_desk', name: 'Desk Warrior', at: 15 }, { pose: 'g_headphone', name: 'Focus Mode', at: 35 },
  { pose: 'g_cheer2', name: 'Go-getter', at: 55 }, { pose: 'g_tab', name: 'Almost Topper', at: 80 }, { pose: 'logo', name: 'Hired!', at: 100 },
];
const EXTRA = [{ pose: 'g_think', xp: 50 }, { pose: 'g_med', xp: 120 }, { pose: 'g_laptop', xp: 200 }, { pose: 'g_cheer1', xp: 300 }, { pose: 'g_angry', xp: 400 }];
const BGS = [['Lavender', 'linear-gradient(180deg,#C9BBFF,#F6A6F1)'], ['Peach', 'linear-gradient(180deg,#FFD9A8,#FFB3C7)'], ['Mint', 'linear-gradient(180deg,#BFEAA9,#A9E2F9)'], ['Sky', 'linear-gradient(180deg,#A9C9F9,#C9BBFF)'], ['Gold', 'linear-gradient(180deg,#FFE58A,#FFC27A)']];

export function streak(s) {
  let n = 0; const d = new Date();
  const k = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  const active = (x) => (s.quizLog[k(x)] || 0) + (s.mockLog[k(x)] || 0) + (s.focusLog[k(x)] || 0) > 0;
  if (!active(d)) d.setDate(d.getDate() - 1);
  while (active(d)) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function Settings({ onClose }) {
  const s = useStore(); const p = s.profile; const [plan, setPlan] = useState(false);
  const upd = (k, v) => setState(st => ({ profile: { ...st.profile, [k]: v } }));
  return <Sheet onClose={onClose}>
    <h2 className="mb12">Settings</h2>
    <div className="lbl">Profile name</div>
    <div className="row wrap" style={{ gap: 6 }}>{NAMES.map(n => <button key={n} className="chip tap" style={{ padding: '9px 14px', fontWeight: 600, background: p.name === n ? 'var(--ink)' : '#fff', color: p.name === n ? '#fff' : 'inherit' }} onClick={() => upd('name', n)}>{n}</button>)}</div>
    <div className="lbl mt16">Daily goals</div>
    <div className="card row between mb8"><b>Quizzes / day</b><Stepper v={p.goalQuiz} set={v => upd('goalQuiz', v)} min={0} max={30} /></div>
    <div className="card row between mb8"><b>Mocks / day</b><Stepper v={p.goalMock} set={v => upd('goalMock', v)} min={0} max={10} /></div>
    <button className="listrow mt8" onClick={() => setPlan(true)}><Icon n="calendar" /><span className="grow">Exam date & plan length</span><Icon n="chevron-right" s={18} /></button>
    <button className="listrow" style={{ color: 'var(--bad)' }} onClick={() => { if (confirm('Erase all progress and start again?')) { resetAll(); } }}><Icon n="trash-2" /><span className="grow">Reset everything</span></button>
    <p className="tiny mut center mt12">MaamiPrep · made with ❤️ by Chan · works fully offline</p>
    {plan && <PlanSettings onClose={() => setPlan(false)} />}
  </Sheet>;
}

export default function Profile({ openTimer, openMotivation }) {
  const s = useStore(); const p = s.profile; const [set, setSet] = useState(false); const [cust, setCust] = useState(false);
  const pct = Math.round(TOPICS.filter(t => s.read[t.id]).length / TOPICS.length * 100);
  const stage = [...STAGES].reverse().find(x => pct >= x.at); const lvl = STAGES.indexOf(stage) + 1;
  const pose = p.pose && (STAGES.some(x => x.pose === p.pose && pct >= x.at) || EXTRA.some(x => x.pose === p.pose && s.xp >= x.xp)) ? p.pose : stage.pose;
  const bg = BGS.find(b => b[0] === p.bg)?.[1] || BGS[0][1];
  const focus = Math.round((s.focusLog[today()] || 0) / 60);
  return <div className="screen" style={{ padding: 0 }}>
    <div style={{ position: 'relative', height: '50vh', minHeight: 360, background: bg, borderRadius: '0 0 40px 40px', overflow: 'hidden' }} className="fade">
      <div style={{ position: 'absolute', bottom: -80, left: '50%', transform: 'translateX(-50%)', width: 330, height: 330, borderRadius: '50%', background: '#ffffff55' }} className="breathe" />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: pose === 'logo' ? 20 : 8, top: '22%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', padding: '0 4%' }}>
        <img key={pose} src={img(pose)} alt="" className="pop" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', borderRadius: pose === 'logo' ? 30 : 0 }} /></div>
      <div style={{ position: 'absolute', top: 'calc(18px + var(--safe-t))', left: 18 }}>
        <div style={{ fontSize: 30, fontWeight: 800 }}>{p.name}</div>
        <span className="chip" style={{ background: '#fff', marginTop: 4 }}><Icon n="award" s={13} /> Lv {lvl} · {stage.name}</span>
        <div className="small" style={{ marginTop: 6, fontWeight: 600 }}>{s.xp} XP · {pct}% syllabus</div>
      </div>
      <button className="ic" style={{ position: 'absolute', top: 'calc(18px + var(--safe-t))', right: 18 }} onClick={() => setSet(true)}><Icon n="settings-2" /></button>
      <button className="chip tap" style={{ position: 'absolute', bottom: 16, right: 16, background: '#fff', fontWeight: 600, padding: '8px 12px' }} onClick={() => setCust(true)}><Icon n="palette" s={14} /> Customize</button>
    </div>
    <div style={{ padding: '14px 18px calc(110px + var(--safe-b))' }}>
      <div className="grid2" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div className="stat c-org pop"><b>{s.quizLog[today()] || 0}/{p.goalQuiz}</b><p>Quiz today</p></div>
        <div className="stat c-pnk pop" style={{ animationDelay: '.05s' }}><b>{s.mockLog[today()] || 0}/{p.goalMock}</b><p>Mock today</p></div>
        <div className="stat c-grn pop" style={{ animationDelay: '.1s' }}><b><Icon n="flame" s={18} />{streak(s)}</b><p>Day streak</p></div>
        <div className="stat c-blu pop" style={{ animationDelay: '.15s' }}><b>{focus}m</b><p>Focus today</p></div>
        <div className="stat c-white pop" style={{ animationDelay: '.2s' }}><b>{Object.keys(s.favs).length}</b><p>Favourites</p></div>
        <div className="stat c-pur pop" style={{ animationDelay: '.25s' }}><b>{s.myCards.length}</b><p>My cards</p></div>
      </div>
      <div className="lbl mt16">Level progress</div>
      <div className="bar light"><i style={{ width: pct + '%' }} /></div>
      <div className="row between tiny mut mt8">{STAGES.map((x, i) => <span key={i} style={{ fontWeight: pct >= x.at ? 700 : 400, color: pct >= x.at ? 'var(--ink)' : undefined }}>Lv{i + 1}</span>)}</div>
      <button className="btn light mt16" style={{ width: '100%' }} onClick={openTimer}><Icon n="timer" s={18} /> Start focus timer</button>
      <button className="btn dark mt8" style={{ width: '100%' }} onClick={() => { buzz(); openMotivation(); }}><img src={img('c_thumb')} alt="" style={{ height: 30, background: '#fff', borderRadius: '50%' }} /> Need motivation?</button>
    </div>
    {set && <Settings onClose={() => setSet(false)} />}
    {cust && <Sheet onClose={() => setCust(false)}>
      <h2 className="mb12">Customize</h2>
      <div className="lbl">Backdrop</div>
      <div className="row wrap" style={{ gap: 8 }}>{BGS.map(([n, g]) => <button key={n} onClick={() => setState(st => ({ profile: { ...st.profile, bg: n } }))} style={{ width: 54, height: 54, borderRadius: 18, background: g, outline: p.bg === n || (!p.bg && n === 'Lavender') ? '3px solid var(--ink)' : 'none' }} aria-label={n} />)}</div>
      <div className="lbl mt16">Pose (unlock by progress & XP)</div>
      <div className="grid2" style={{ gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        <button className="card center tiny" style={{ padding: 6, outline: !p.pose ? '3px solid var(--ink)' : 'none' }} onClick={() => setState(st => ({ profile: { ...st.profile, pose: null } }))}><Icon n="sparkles" s={28} /><div>Auto</div></button>
        {[...STAGES.map(x => ({ pose: x.pose, ok: pct >= x.at, need: `${x.at}%` })), ...EXTRA.map(x => ({ pose: x.pose, ok: s.xp >= x.xp, need: `${x.xp} XP` }))].map(x =>
          <button key={x.pose} className="card center tiny" disabled={!x.ok} style={{ padding: 6, outline: p.pose === x.pose ? '3px solid var(--ink)' : 'none', opacity: x.ok ? 1 : .45 }} onClick={() => setState(st => ({ profile: { ...st.profile, pose: x.pose } }))}>
            <img src={img(x.pose)} alt="" style={{ height: 58, maxWidth: '100%', objectFit: 'contain', filter: x.ok ? 'none' : 'grayscale(1)' }} /><div>{x.ok ? '✓' : <><Icon n="lock" s={10} /> {x.need}</>}</div></button>)}
      </div>
    </Sheet>}
  </div>;
}
