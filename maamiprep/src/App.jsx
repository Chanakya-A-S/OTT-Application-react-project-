import { useEffect, useRef, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { useStore, setState } from './store.js';
import { Bg, Nav } from './ui.jsx';
import Study, { TopicView, planInfo } from './screens/Study.jsx';
import Quiz from './screens/Quiz.jsx';
import Roadmap, { DayCelebrate } from './screens/Roadmap.jsx';
import Cards, { refreshFlashNotifs } from './screens/Cards.jsx';
import Profile from './screens/Profile.jsx';
import Timer, { tickTimer } from './screens/Timer.jsx';
import { Splash, Onboarding, Motivation } from './screens/Intro.jsx';

export default function App() {
  const s = useStore();
  const [splash, setSplash] = useState(true);
  const [tab, setTab] = useState('study');
  const [topic, setTopic] = useState(null);
  const [timer, setTimer] = useState(false);
  const [motiv, setMotiv] = useState(false);
  const [preset, setPreset] = useState(null);
  const [celebrate, setCelebrate] = useState(null);
  const scrollRef = useRef(null);

  // timer watcher
  useEffect(() => { const i = setInterval(() => { if (tickTimer()) setTimer(true); }, 1000); return () => clearInterval(i); }, []);
  useEffect(() => { if (s.timer.ringing) setTimer(true); }, []); // eslint-disable-line
  // refresh flash notifications on launch
  useEffect(() => { refreshFlashNotifs(); }, []);

  // day completion celebration
  useEffect(() => {
    if (!s.profile) return;
    const { doneDays } = planInfo(s);
    const day = doneDays.findIndex((d, i) => d && !s.dayShown[`${doneDays.length}:${i}`]);
    if (day >= 0 && celebrate == null) setCelebrate(day);
  }, [s.read, s.profile]); // eslint-disable-line

  // android back button
  const stateRef = useRef();
  stateRef.current = { topic, timer, motiv, tab, celebrate };
  useEffect(() => {
    let h;
    CapApp.addListener('backButton', () => {
      const st = stateRef.current;
      if (st.celebrate != null) return closeCelebrate();
      if (st.motiv) return setMotiv(false);
      if (st.timer) return setTimer(false);
      if (st.topic) return setTopic(null);
      if (st.tab !== 'study') return setTab('study');
      CapApp.minimizeApp();
    }).then(x => { h = x; }).catch(() => {});
    return () => h?.remove();
  }, []); // eslint-disable-line

  const closeCelebrate = () => {
    const { doneDays } = planInfo(s);
    setState(st => ({ dayShown: { ...st.dayShown, [`${doneDays.length}:${stateRef.current.celebrate}`]: true } }));
    setCelebrate(null);
  };
  const go = (t) => { setTopic(null); setTab(t); };
  const openTopic = (id) => { setTopic(id); };
  const startQuiz = (ids) => { setTopic(null); setTab('quiz'); setPreset(ids); };

  if (splash) return <Splash done={() => setSplash(false)} />;
  if (!s.profile) return <div className="app"><Onboarding /></div>;

  let body;
  if (timer) body = <Timer back={() => setTimer(false)} />;
  else if (topic) body = <TopicView id={topic} back={() => setTopic(null)} startQuiz={startQuiz} />;
  else if (tab === 'study') body = <Study openTopic={openTopic} openTimer={() => setTimer(true)} />;
  else if (tab === 'quiz') body = <Quiz preset={preset} clearPreset={() => setPreset(null)} />;
  else if (tab === 'road') body = <Roadmap openTopic={openTopic} />;
  else if (tab === 'cards') body = <Cards />;
  else body = <Profile openTimer={() => setTimer(true)} openMotivation={() => setMotiv(true)} />;

  return <div className="app" ref={scrollRef}>
    <Bg tone={tab === 'road' ? 'green' : tab === 'profile' ? 'warm' : ''} />
    <div key={(timer ? 'timer' : topic || tab)} className="fade" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}>{body}</div>
    {!timer && <Nav tab={tab} go={go} />}
    {motiv && <Motivation onClose={() => setMotiv(false)} onQuiz={() => { setMotiv(false); go('quiz'); }} />}
    {celebrate != null && <DayCelebrate day={celebrate} total={planInfo(s).plan.length} onClose={closeCelebrate} />}
  </div>;
}
