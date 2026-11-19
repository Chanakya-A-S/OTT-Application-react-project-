import { useEffect, useState } from 'react';
import { useStore, setState, getState } from '../store.js';
import { Icon, img, fmt, Stepper, Chan } from '../ui.jsx';
import { scheduleAlarm, cancelAlarm, startRing, stopRing, buzz } from '../native.js';
import { TIMER_DONE, pick } from '../data/chan.js';
import { today } from '../data/index.js';

const MODES = [['focus', 'Focus', 25], ['short', 'Short', 5], ['long', 'Long', 15], ['custom', 'Custom', 45]];

// global watcher – called from App every second
export function tickTimer() {
  const t = getState().timer;
  if (t.running && t.endAt && Date.now() >= t.endAt) {
    const secs = t.mins * 60;
    setState(s => ({ timer: { ...s.timer, running: false, endAt: null, left: 0, ringing: true, line: pick(TIMER_DONE) },
      focusLog: s.timer.mode === 'short' || s.timer.mode === 'long' ? s.focusLog : { ...s.focusLog, [today()]: (s.focusLog[today()] || 0) + secs } }));
    startRing(); buzz(true);
    return true;
  }
  return false;
}

export default function Timer({ back }) {
  const s = useStore(); const t = s.timer; const [, force] = useState(0);
  useEffect(() => { const i = setInterval(() => force(x => x + 1), 250); return () => clearInterval(i); }, []);
  useEffect(() => { if (t.ringing) startRing(); }, []); // eslint-disable-line
  const left = t.running && t.endAt ? Math.max(0, (t.endAt - Date.now()) / 1000) : t.left;
  const setMode = (m, mins) => { if (t.running) return; setState(st => ({ timer: { ...st.timer, mode: m, mins, left: mins * 60, ringing: false } })); };
  const start = () => {
    buzz(); const endAt = Date.now() + (t.left > 0 ? t.left : t.mins * 60) * 1000;
    setState(st => ({ timer: { ...st.timer, running: true, endAt, ringing: false } }));
    scheduleAlarm(endAt, t.mode === 'focus' || t.mode === 'custom' ? 'Focus session done! Take a break – Chan 😏' : 'Break over! Back to study, maami 📚');
  };
  const pause = () => { buzz(); setState(st => ({ timer: { ...st.timer, running: false, left, endAt: null } })); cancelAlarm(); };
  const reset = () => { buzz(); stopRing(); cancelAlarm(); setState(st => ({ timer: { ...st.timer, running: false, endAt: null, left: st.timer.mins * 60, ringing: false } })); };
  const stop = () => { stopRing(); cancelAlarm(); const next = t.mode === 'focus' || t.mode === 'custom' ? ['short', 5] : ['focus', 25]; setState(st => ({ timer: { ...st.timer, ringing: false, mode: next[0], mins: next[1], left: next[1] * 60 } })); };
  const snooze = () => { stopRing(); const endAt = Date.now() + 5 * 60000; setState(st => ({ timer: { ...st.timer, ringing: false, running: true, endAt, mins: 5, mode: 'short' } })); scheduleAlarm(endAt, 'Snooze over! Ezhunthiru maami ⏰'); };
  const focusToday = Math.round((s.focusLog[today()] || 0) / 60);
  const pct = 1 - left / (t.mins * 60);
  return <div className="screen nonav" style={{ background: t.ringing ? 'radial-gradient(circle at 50% 40%,#FFB15C,#FFE7C2 60%,#FFF6E6)' : 'radial-gradient(circle at 50% 35%,#FFE0B8,#E6DEFB 75%)', transition: 'background .5s' }}>
    <div className="hdr"><button className="ic" onClick={() => { if (t.ringing) stop(); back(); }}><Icon n="arrow-left" /></button>
      <div className="hi"><b>Focus timer</b><span>Today: {Math.floor(focusToday / 60)}h {focusToday % 60}m focused</span></div>
      <div className="ic"><Icon n={t.running ? 'volume-2' : 'bell'} /></div></div>
    {t.ringing ? <div className="row" style={{ justifyContent: 'center', gap: 22, color: '#B4560A' }}><Icon n="bell-ring" s={30} className="float" /><Icon n="sparkles" s={26} /><Icon n="bell-ring" s={30} className="float" /></div>
      : <div className="seg mb8">{MODES.map(([m, l, d]) => <button key={m} className={t.mode === m ? 'on' : ''} onClick={() => setMode(m, m === 'custom' ? (t.mode === 'custom' ? t.mins : d) : d)}>{l}{m !== 'custom' && ` ${d}`}</button>)}</div>}
    {t.mode === 'custom' && !t.running && !t.ringing && <div className="row" style={{ justifyContent: 'center' }}><Stepper v={t.mins} set={v => setState(st => ({ timer: { ...st.timer, mins: v, left: v * 60 } }))} min={1} max={180} step={5} suffix="m" /></div>}
    <div className={`clockwrap mt8 ${t.ringing ? 'ring' : ''} ${t.running ? 'run' : ''}`}>
      <img src={img('c_clock')} alt="Chan holding clock" />
      <div className="clockface" style={{ fontSize: 'min(10.5vw, 38px)' }}>{fmt(left)}</div>
    </div>
    <div className="bar light" style={{ width: '70%', margin: '6px auto 0' }}><i style={{ width: `${Math.min(100, pct * 100)}%` }} /></div>
    {t.ringing ? <>
      <div className="mt16"><Chan pose="c_cheer" text={t.line || pick(TIMER_DONE)} /></div>
      <div className="row mt16"><button className="btn light grow" onClick={snooze}>Snooze 5</button><button className="btn dark grow" onClick={stop}>Stop alarm</button></div>
    </> : <div className="row mt16" style={{ justifyContent: 'center', gap: 18 }}>
      <button className="ic" style={{ width: 56, height: 56 }} onClick={reset}><Icon n="rotate-ccw" s={22} /></button>
      <button onClick={t.running ? pause : start} className="tap" style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--ink)', color: '#fff', display: 'grid', placeItems: 'center', boxShadow: '0 8px 20px #0003' }}><Icon n={t.running ? 'pause' : 'play'} s={32} /></button>
      <button className="ic" style={{ width: 56, height: 56 }} onClick={() => { pause(); setMode(t.mode === 'focus' ? 'short' : 'focus', t.mode === 'focus' ? 5 : 25); }}><Icon n="skip-forward" s={22} /></button>
    </div>}
    {!t.ringing && <p className="small mut center mt16">Alarm rings even if the phone is locked. Keep volume on 🔔</p>}
  </div>;
}
