import { useEffect, useState } from 'react';
import { setState, getState } from '../store.js';
import { Icon, img, Chan, Stepper, Confetti } from '../ui.jsx';
import { NAMES, NAME_LINE, MOTIVATION, CHAN_POSES, pick } from '../data/chan.js';
import { today } from '../data/index.js';
import { buzz } from '../native.js';

export function Splash({ done }) {
  const [out, setOut] = useState(false);
  useEffect(() => { const a = setTimeout(() => setOut(true), 1900); const b = setTimeout(done, 2400); return () => { clearTimeout(a); clearTimeout(b); }; }, []); // eslint-disable-line
  return <div className={`splash ${out ? 'out' : ''}`}>
    <Icon n="sparkles" s={28} className="spark" style={{ top: '16%', left: '14%' }} />
    <Icon n="star" s={22} className="spark" style={{ top: '22%', right: '16%', animationDelay: '.4s' }} />
    <Icon n="party-popper" s={24} className="spark" style={{ top: '52%', right: '12%', animationDelay: '.8s' }} />
    <Icon n="sparkles" s={20} className="spark" style={{ top: '58%', left: '12%', animationDelay: '1.1s' }} />
    <div className="logo"><img src={img('logo')} alt="MaamiPrep" /></div>
    <div className="title">Maami<span style={{ color: 'var(--acc)' }}>Prep</span></div>
    <div className="mut pop" style={{ animationDelay: '.7s', marginTop: 4 }}>SBI / IBPS Clerk Mains · CA + Computer</div>
  </div>;
}

export function Onboarding() {
  const [step, setStep] = useState(0); const [name, setName] = useState('Subha');
  const d = new Date(); d.setDate(d.getDate() + 7);
  const [exam, setExam] = useState(d.toISOString().slice(0, 10)); const [days, setDays] = useState(7);
  const [gq, setGq] = useState(3); const [gm, setGm] = useState(1);
  const finish = () => { buzz(true); setState({ profile: { name, examDate: exam, planDays: days, goalQuiz: gq, goalMock: gm, bg: 'Lavender', pose: null } }); };
  return <div className="screen nonav" style={{ background: 'linear-gradient(180deg,#E6DEFB,#F6F5F9 55%)', display: 'flex', flexDirection: 'column' }}>
    <div className="dots">{[0, 1, 2].map(i => <i key={i} className={step === i ? 'on' : ''} />)}</div>
    {step === 0 && <div className="fade grow">
      <h1>Who's studying<br />today?</h1>
      <p className="mut mt8 mb12">Pick once. You can change it later in Settings.</p>
      {NAMES.map((n, i) => <button key={n} className={`name pop ${name === n ? 'on' : ''}`} style={{ animationDelay: i * 0.06 + 's' }} onClick={() => { buzz(); setName(n); }}>{n}<span className="rad" /></button>)}
      <div className="mt12"><Chan pose="c_thumb" text={NAME_LINE[name]} /></div>
    </div>}
    {step === 1 && <div className="fade grow">
      <h1>When's the<br />big day, {name}?</h1>
      <div className="card mt16"><div className="lbl"><Icon n="calendar" s={14} /> Exam date</div><input type="date" value={exam} min={today()} onChange={e => e.target.value && setExam(e.target.value)} /></div>
      <div className="card row between mt12"><div><b>Study plan length</b><div className="small mut">37 topics split across days</div></div><Stepper v={days} set={setDays} min={1} max={30} suffix="d" /></div>
      <div className="mt16"><Chan pose="c_present" text={`${days} days plan. Daily oru target. Mudicha Day message varum, ennoda special 😉`} /></div>
    </div>}
    {step === 2 && <div className="fade grow">
      <h1>Daily goal</h1>
      <p className="mut mt8">How many quizzes & mocks every day?</p>
      <div className="card row between mt16"><div><b>Quizzes / day</b><div className="small mut">Short topic quizzes</div></div><Stepper v={gq} set={setGq} min={0} max={30} /></div>
      <div className="card row between mt12"><div><b>Mock tests / day</b><div className="small mut">Timed, full-length</div></div><Stepper v={gm} set={setGm} min={0} max={10} /></div>
      <div className="mt16 center"><img src={img('g_cheer1')} alt="" className="float" style={{ height: 200 }} /></div>
    </div>}
    <div className="row mt16">
      {step > 0 && <button className="btn light" onClick={() => setStep(step - 1)}><Icon n="arrow-left" s={18} /></button>}
      <button className="btn dark grow" onClick={() => step < 2 ? setStep(step + 1) : finish()}>{step < 2 ? <>Continue <Icon n="arrow-right" s={18} /></> : <>Start my plan <Icon n="rocket" s={18} /></>}</button>
    </div>
  </div>;
}

export function Motivation({ onClose, onQuiz }) {
  const next = () => {
    let bag = getState().motivBag;
    if (!bag.length) bag = MOTIVATION.map((_, i) => i).sort(() => Math.random() - 0.5);
    const [i, ...rest] = bag; setState({ motivBag: rest });
    return { text: MOTIVATION[i], pose: pick(CHAN_POSES) };
  };
  const [m, setM] = useState(next);
  return <div className="overlay" style={{ background: 'linear-gradient(180deg,#E6DEFB,#FFF3D6)' }} onClick={() => { buzz(); setM(next()); }}>
    <div className="screen nonav" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card pop" key={m.text} style={{ borderRadius: '26px 26px 6px 26px', fontSize: 17, lineHeight: 1.5, fontWeight: 500, marginTop: 30 }}>"{m.text}"
        <div className="row between small mut mt12"><span>— Chan</span><span className="row" style={{ gap: 4 }}><Icon n="refresh-cw" s={12} /> Tap anywhere for another</span></div></div>
      <div className="grow" style={{ position: 'relative', minHeight: 300 }}>
        <img src={img('g_think')} alt="" className="pop" style={{ position: 'absolute', bottom: 0, left: 0, height: '62%' }} />
        <img key={m.pose} src={img(m.pose)} alt="Chan" style={{ position: 'absolute', bottom: 0, right: 0, height: '78%', maxWidth: '62%', objectFit: 'contain', animation: 'chanIn .7s cubic-bezier(.2,1.5,.4,1) both' }} />
      </div>
      <div className="row mt12" onClick={e => e.stopPropagation()}>
        <button className="btn light grow" onClick={onClose}>Close</button>
        <button className="btn org grow" onClick={onQuiz}><Icon n="zap" s={16} /> Take a quiz</button>
      </div>
    </div>
    <Confetti n={14} />
  </div>;
}
