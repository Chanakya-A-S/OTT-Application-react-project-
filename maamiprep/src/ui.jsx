import { icons } from 'lucide-react';
import { useMemo } from 'react';

const pascal = (s) => s.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('');
export function Icon({ n, s = 20, ...p }) {
  const C = icons[pascal(n)] || icons.Circle;
  return <C size={s} {...p} />;
}

export const img = (n) => `/img/${n}.webp`;

export function Bg({ tone = '' }) { return <div className={`bg ${tone}`}><i /><i /><i /></div>; }

const TABS = [['study', 'book-open', 'Study'], ['quiz', 'circle-help', 'Quiz'], ['road', 'map', 'Roadmap'], ['cards', 'layers', 'Cards'], ['profile', 'user-round', 'Profile']];
export function Nav({ tab, go }) {
  return <nav className="nav">{TABS.map(([id, ic, l]) => (
    <button key={id} className={tab === id ? 'on' : ''} onClick={() => go(id)} aria-label={l}>
      <Icon n={ic} s={tab === id ? 20 : 24} />{tab === id && <small>{l}</small>}
    </button>))}</nav>;
}

export function Chan({ text, pose = 'c_thumb', style, h = 96 }) {
  return <div className="chan" style={style} key={text}>
    <img src={img(pose)} style={{ height: h }} alt="Chan" />
    <div className="bub"><b><Icon n="message-circle" s={12} /> CHAN</b>{text}</div>
  </div>;
}

export function Imp({ label = 'IMP' }) { return <span className="imp"><Icon n="star" s={10} fill="#fff" /> {label}</span>; }

export function Confetti({ n = 70 }) {
  const bits = useMemo(() => Array.from({ length: n }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 0.8, dur: 2 + Math.random() * 1.8,
    bg: ['#7C5CFF', '#FFBE5C', '#F6A6F1', '#A9C9F9', '#BFEAA9', '#FF5C5C'][i % 6], r: Math.random() * 360,
  })), [n]);
  return <div className="confetti">{bits.map((b, i) => <i key={i} style={{ left: b.left + '%', background: b.bg, animationDelay: b.delay + 's', animationDuration: b.dur + 's', transform: `rotate(${b.r}deg)` }} />)}</div>;
}

export function Sheet({ onClose, children }) {
  return <div className="overlay dim" onClick={onClose}><div className="sheet" onClick={e => e.stopPropagation()}><div className="grab" />{children}</div></div>;
}
export function Toggle({ on, set }) { return <button className={`tog ${on ? 'on' : ''}`} onClick={() => set(!on)}><i /></button>; }
export function Stepper({ v, set, min = 1, max = 99, step = 1, suffix = '' }) {
  return <div className="step">
    <button onClick={() => set(Math.max(min, v - step))}><Icon n="minus" s={18} /></button>
    <b>{v}{suffix}</b>
    <button onClick={() => set(Math.min(max, v + step))}><Icon n="plus" s={18} /></button>
  </div>;
}
export const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
