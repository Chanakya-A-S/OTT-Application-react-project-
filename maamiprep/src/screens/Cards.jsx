import { useMemo, useState, useEffect } from 'react';
import { BASE_CARDS, TOPIC, shuffle } from '../data/index.js';
import { useStore, setState, getState } from '../store.js';
import { Icon, Imp, Sheet, Stepper, Toggle, Chan, img } from '../ui.jsx';
import { askNotif, scheduleFlash, cancelFlash, buzz } from '../native.js';

export function allCards(s) {
  const wrong = Object.entries(s.wrong).map(([id, w]) => ({ id: 'w:' + id, topic: w.topic, front: w.q, back: w.a, imp: TOPIC[w.topic]?.imp, kind: 'wrong' }));
  return [...s.myCards, ...wrong, ...BASE_CARDS];
}
export async function refreshFlashNotifs() {
  const s = getState();
  if (!s.flash.notif) { cancelFlash(); return; }
  const cards = allCards(s);
  const pri = shuffle([...s.myCards, ...cards.filter(c => c.kind === 'wrong'), ...shuffle(cards.filter(c => c.imp)).slice(0, 40)]).map(c => ({ ...c, topicTitle: TOPIC[c.topic]?.title || 'MaamiPrep' }));
  await scheduleFlash(pri.slice(0, 24), s.flash.every);
}

function FlashSettings({ onClose }) {
  const s = useStore(); const f = s.flash;
  const [front, setFront] = useState(''); const [back, setBack] = useState('');
  const upd = (k, v) => { setState(st => ({ flash: { ...st.flash, [k]: v } })); setTimeout(refreshFlashNotifs, 50); };
  return <Sheet onClose={onClose}>
    <h2 className="mb12">Flash card settings</h2>
    <div className="card row between mb12"><div><b>Cards per day</b><div className="small mut">Daily review size</div></div><Stepper v={f.perDay} set={v => upd('perDay', v)} min={5} max={200} step={5} /></div>
    <div className="card row between mb12"><div><b>Push notifications</b><div className="small mut">A card pops up on your phone</div></div>
      <Toggle on={f.notif} set={async v => { if (v && !(await askNotif())) { alert('Please allow notifications for MaamiPrep in phone settings.'); return; } upd('notif', v); }} /></div>
    <div className="card row between mb12" style={{ opacity: f.notif ? 1 : .5 }}><div><b>Every</b><div className="small mut">7 AM – 10 PM only</div></div><Stepper v={f.every} set={v => upd('every', v)} min={1} max={12} suffix="h" /></div>
    <div className="lbl mt16"><Icon n="plus" s={14} /> Add your own card</div>
    <input placeholder="Front (question)" value={front} onChange={e => setFront(e.target.value)} style={{ width: '100%', border: 0, borderRadius: 14, padding: 12, marginBottom: 8 }} />
    <input placeholder="Back (answer)" value={back} onChange={e => setBack(e.target.value)} style={{ width: '100%', border: 0, borderRadius: 14, padding: 12 }} />
    <button className="btn dark mt12" style={{ width: '100%' }} disabled={!front.trim() || !back.trim()} onClick={() => { setState(st => ({ myCards: [...st.myCards, { id: 'my:custom:' + Date.now(), topic: 'custom', front: front.trim(), back: back.trim(), kind: 'mine' }] })); setFront(''); setBack(''); buzz(); }}>Add card</button>
  </Sheet>;
}

export default function Cards() {
  const s = useStore(); const [tab, setTab] = useState('all'); const [flip, setFlip] = useState(false); const [out, setOut] = useState(false); const [set, setSet] = useState(false);
  const [round, setRound] = useState(0);
  const cards = useMemo(() => allCards(s), [s.myCards, s.wrong]); // eslint-disable-line
  const deck = useMemo(() => {
    const now = Date.now();
    let list = cards.filter(c => tab === 'all' ? true : tab === 'mine' ? c.kind === 'mine' : tab === 'wrong' ? c.kind === 'wrong' : c.imp);
    const st = getState().cardState;
    list = list.filter(c => !st[c.id] || st[c.id].due <= now);
    const pri = (c) => (c.kind === 'mine' ? 0 : c.kind === 'wrong' ? 1 : c.imp ? 2 : 3);
    list = shuffle(list).sort((a, b) => pri(a) - pri(b));
    return tab === 'all' ? list.slice(0, s.flash.perDay) : list;
  }, [tab, cards, round, s.flash.perDay]); // eslint-disable-line
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); setFlip(false); }, [deck]);
  const c = deck[idx];
  const rate = (r) => {
    buzz(); const st = s.cardState[c.id] || { ivl: 0 };
    const ivl = r === 'again' ? 0 : r === 'hard' ? Math.max(1, st.ivl) : Math.max(2, Math.round((st.ivl || 1) * 2.5));
    const due = r === 'again' ? Date.now() + 60000 : Date.now() + ivl * 86400000;
    setOut(true);
    setTimeout(() => { setState(x => ({ cardState: { ...x.cardState, [c.id]: { ivl, due } } })); setOut(false); setFlip(false); setIdx(i => i + 1); }, 330);
  };
  return <div className="screen">
    <div className="hdr"><div><h2>Flash cards</h2><div className="small mut">{deck.length - idx > 0 ? `${deck.length - idx} left today` : 'All done for now'} · {s.myCards.length} added by you</div></div>
      <button className="ic" onClick={() => setSet(true)}><Icon n="settings-2" /></button></div>
    <div className="seg mb16">{[['all', 'All', null], ['mine', 'Mine', 'zap'], ['wrong', 'Wrong', 'x'], ['imp', 'IMP', 'star']].map(([id, l, ic]) =>
      <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{l}{ic && <Icon n={ic} s={13} />}</button>)}</div>
    {c ? <>
      <div className="deck">
        <div className="back1" /><div className="back2" />
        <div className={`fcard ${flip ? 'flip' : ''} ${out ? 'swipe-out' : ''}`} key={c.id + idx} onClick={() => { buzz(); setFlip(!flip); }}>
          <div className="front pop">
            <div className="row between"><span className="chip">{TOPIC[c.topic]?.title.split(' (')[0] || 'My card'}</span>{c.imp && <Imp />}{c.kind === 'wrong' && <span className="chip" style={{ background: '#FDECEC' }}>Got wrong</span>}</div>
            <div className="txt" style={{ fontSize: c.front.length > 70 ? 19 : 24 }}>{c.front}{c.kind === 'base' ? '?' : ''}</div>
            <div className="center small row" style={{ justifyContent: 'center' }}>Tap to flip <Icon n="refresh-cw" s={13} /></div>
          </div>
          <div className="backside">
            <div className="lbl">Answer</div>
            <div className="ans" style={{ whiteSpace: 'pre-line', fontSize: c.back.length > 80 ? 15 : 20, textAlign: c.back.length > 80 ? 'left' : 'center' }}>{c.back}</div>
            <div className="center small mut">How well did you know it?</div>
          </div>
        </div>
      </div>
      <div className="row mt20" style={{ gap: 8 }}>
        <button className="btn grow" style={{ background: '#FFE3E3' }} onClick={() => rate('again')}><Icon n="rotate-ccw" s={15} /> Again</button>
        <button className="btn grow" style={{ background: '#FFF1D6' }} onClick={() => rate('hard')}><Icon n="gauge" s={15} /> Hard</button>
        <button className="btn grow" style={{ background: '#DDF5E5' }} onClick={() => rate('good')}><Icon n="check" s={15} /> Got it</button>
      </div>
    </> : <div className="empty pop"><img src={img('g_med')} alt="" style={{ height: 190 }} />
      <h3>Deck clear!</h3><p className="mt8">{tab === 'mine' ? 'Use "Flash me" on any note to add cards here.' : tab === 'wrong' ? 'No wrong answers pending. Sema!' : 'Come back later – cards return when due.'}</p>
      <button className="btn light mt16" onClick={() => { setState({ cardState: {} }); setRound(r => r + 1); }} style={{ margin: '16px auto 0' }}><Icon n="refresh-cw" s={16} /> Reset & review all</button></div>}
    <div className="card row between mt16" onClick={() => setSet(true)}>
      <span className="row small" style={{ gap: 6 }}><Icon n="bell" s={15} /> {s.flash.notif ? <>Reminder every <b>{s.flash.every} hrs</b></> : 'Reminders off'} · <b>{s.flash.perDay}</b>/day</span>
      <Toggle on={s.flash.notif} set={() => setSet(true)} /></div>
    {!c && <div className="mt12"><Chan pose="c_med" text="Spaced repetition: 'Got it' na late-a varum, 'Again' na udane varum. Brain-ku gym 🧠" /></div>}
    {set && <FlashSettings onClose={() => setSet(false)} />}
  </div>;
}
