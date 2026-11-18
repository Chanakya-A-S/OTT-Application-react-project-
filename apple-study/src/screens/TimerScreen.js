import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, ScrollView, Alert, AppState } from 'react-native';
import Svg, { Circle, Line, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme, T, shadow } from '../theme';
import { Screen, Chip, Segmented, Grad, Card, Row, IconBtn, tap } from '../components/ui';
import Icon from '../components/Icon';
import Apple from '../components/Apple';
import { useStore, live, subjectOf } from '../store';
import { tasksForDay, isDone, focusMinutesOn } from '../logic';
import { clock, dateKey, dur, hm, uid } from '../utils/date';
import { scheduleTimerEnd, cancelTimerEnd } from '../notifications';

const MODES = [
  { value: 'focus', label: '🍅 Focus' },
  { value: 'short', label: '☕ Short' },
  { value: 'long', label: '🌙 Long' },
  { value: 'stopwatch', label: '⏱ Watch' },
];
const SIZE = 290;
const R = 104;
const CIRC = 2 * Math.PI * R;

function Dial({ progress, color1, color2, track, tick }) {
  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const a = (i * 6 * Math.PI) / 180;
    const r1 = 126;
    const r2 = i % 5 ? 131 : 136;
    ticks.push(
      <Line
        key={i}
        x1={SIZE / 2 + r1 * Math.sin(a)}
        y1={SIZE / 2 - r1 * Math.cos(a)}
        x2={SIZE / 2 + r2 * Math.sin(a)}
        y2={SIZE / 2 - r2 * Math.cos(a)}
        stroke={tick}
        strokeWidth={i % 5 ? 1 : 2}
        opacity={0.55}
      />
    );
  }
  const p = Math.max(0, Math.min(1, progress));
  const ang = p * 2 * Math.PI;
  return (
    <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
      <Defs>
        <SvgGrad id="tg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={color2} />
          <Stop offset="1" stopColor={color1} />
        </SvgGrad>
      </Defs>
      {ticks}
      <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={track} strokeWidth={16} />
      {p > 0.001 && (
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="url(#tg)"
          strokeWidth={16}
          strokeLinecap="round"
          strokeDasharray={`${CIRC * p} ${CIRC}`}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      )}
      <Circle cx={SIZE / 2 + R * Math.sin(ang)} cy={SIZE / 2 - R * Math.cos(ang)} r={13} fill="#fff" stroke={color1} strokeWidth={3} />
    </Svg>
  );
}

export default function TimerScreen() {
  const c = useTheme();
  const nav = useNavigation();
  const route = useRoute();
  const timer = useStore((s) => s.timer);
  const setTimer = useStore((s) => s.setTimer);
  const settings = useStore((s) => s.settings);
  const subjectsAll = useStore((s) => s.subjects);
  const tasks = useStore((s) => s.tasks);
  const sessions = useStore((s) => s.sessions);
  const profile = useStore((s) => s.profile);
  const [now, setNow] = useState(Date.now());
  const finishing = useRef(false);

  const subjects = useMemo(() => live(subjectsAll), [subjectsAll]);
  const today = dateKey();
  const task = timer.taskId ? tasks.find((t) => t.id === timer.taskId && !t.deleted) : null;
  const subject = subjectOf(subjectsAll, timer.subjectId);
  const todaysTasks = useMemo(
    () => tasksForDay(tasks, today).filter((t) => !isDone(t, today) && t.subjectId === timer.subjectId),
    [tasks, today, timer.subjectId]
  );

  const duration = timer.mode === 'stopwatch' ? null : (timer.mode === 'focus' ? settings.focusMin : timer.mode === 'short' ? settings.shortMin : settings.longMin) * 60000;
  const elapsed = timer.accumulated + (timer.running && timer.startedAt ? now - timer.startedAt : 0);
  const remaining = duration ? duration - elapsed : null;

  // Apply params coming from Home / task editor ("start timer for this task").
  useFocusEffect(
    useCallback(() => {
      const p = route.params;
      if (p && (p.taskId || p.subjectId)) {
        const st = useStore.getState().timer;
        if (!st.running && st.accumulated === 0) setTimer({ taskId: p.taskId || null, subjectId: p.subjectId || st.subjectId, mode: 'focus' });
        nav.setParams({ taskId: undefined, subjectId: undefined });
      }
    }, [route.params, setTimer, nav])
  );

  const finish = useCallback(
    (auto) => {
      if (finishing.current) return;
      finishing.current = true;
      const st = useStore.getState();
      const t = st.timer;
      const el = t.accumulated + (t.running && t.startedAt ? Date.now() - t.startedAt : 0);
      const capped = t.mode === 'stopwatch' ? el : Math.min(el, duration || el);
      cancelTimerEnd();
      const studied = t.mode === 'focus' || t.mode === 'stopwatch';
      if (studied && capped >= 60000) {
        const end = Date.now();
        st.upsert('sessions', { id: uid(), subjectId: t.subjectId, taskId: t.taskId, start: end - capped, end, mode: t.mode });
        st.celebrate({ small: true, kind: 'timer', text: `${dur(capped / 60000)} focused! ${st.profile.buddyName} is proud 🍅` });
      }
      if (st.settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      let next = t.mode;
      let round = t.round || 1;
      if (auto && t.mode === 'focus') {
        next = round % 4 === 0 ? 'long' : 'short';
        round += 1;
      } else if (auto && (t.mode === 'short' || t.mode === 'long')) next = 'focus';
      setTimer({ running: false, startedAt: null, accumulated: 0, mode: next, round });
      if (studied && t.taskId && capped >= 60000) {
        const tk = st.tasks.find((x) => x.id === t.taskId);
        if (tk && !isDone(tk, dateKey()))
          setTimeout(
            () =>
              Alert.alert('Finished this task?', tk.title, [
                { text: 'Not yet', style: 'cancel' },
                { text: 'Yes, done! 🎉', onPress: () => useStore.getState().toggleTask(tk, dateKey()) },
              ]),
            1700
          );
      }
      setTimeout(() => (finishing.current = false), 300);
    },
    [duration, setTimer]
  );

  useEffect(() => {
    if (!timer.running) return;
    const i = setInterval(() => setNow(Date.now()), 500);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && setNow(Date.now()));
    return () => {
      clearInterval(i);
      sub.remove();
    };
  }, [timer.running]);

  useEffect(() => {
    if (timer.running && remaining != null && remaining <= 0) finish(true);
  }, [timer.running, remaining, finish]);

  const start = () => {
    tap();
    const startedAt = Date.now();
    setNow(startedAt);
    setTimer({ running: true, startedAt });
    if (duration) {
      const end = startedAt + (duration - timer.accumulated);
      const isFocus = timer.mode === 'focus';
      scheduleTimerEnd(
        end,
        isFocus ? '🍅 Focus session complete!' : '☕ Break is over',
        isFocus ? `Great job! ${profile.buddyName} says take a short break.` : `Ready for the next round? ${profile.buddyName} is waiting 🍎`
      );
    }
  };
  const pause = () => {
    tap();
    setTimer({ running: false, startedAt: null, accumulated: elapsed });
    cancelTimerEnd();
  };
  const reset = () => {
    tap();
    setTimer({ running: false, startedAt: null, accumulated: 0 });
    cancelTimerEnd();
  };
  const changeMode = (m) => {
    if (m === timer.mode) return;
    const go = () => {
      cancelTimerEnd();
      setTimer({ mode: m, running: false, startedAt: null, accumulated: 0 });
    };
    if (elapsed > 5000) Alert.alert('Switch mode?', 'The current timer will be reset.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Switch', onPress: go }]);
    else go();
  };

  const progress = duration ? elapsed / duration : (elapsed % 3600000) / 3600000;
  const isBreak = timer.mode === 'short' || timer.mode === 'long';
  const mood = timer.running ? (isBreak ? 'excited' : 'happy') : elapsed > 0 ? 'neutral' : 'happy';
  const todaySessions = sessions.filter((s) => !s.deleted && dateKey(new Date(s.start)) === today).sort((a, b) => b.start - a.start);
  const focusedToday = focusMinutesOn(sessions, today);
  const label = { focus: `FOCUS · ${settings.focusMin} MIN`, short: `SHORT BREAK · ${settings.shortMin} MIN`, long: `LONG BREAK · ${settings.longMin} MIN`, stopwatch: 'STOPWATCH' }[timer.mode];

  return (
    <Screen scroll>
      <Row between style={{ marginTop: 6 }}>
        <View style={{ width: 42 }} />
        <T w={700} size={17}>
          Focus Timer
        </T>
        <IconBtn name="settings" onPress={() => nav.navigate('Settings')} />
      </Row>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 6 }}>
        {subjects.map((s) => (
          <Chip
            key={s.id}
            label={`${s.emoji || ''} ${s.name}`}
            dot={timer.subjectId === s.id ? undefined : s.color}
            on={timer.subjectId === s.id}
            color={s.color}
            onPress={() => !timer.running && setTimer({ subjectId: s.id, taskId: null })}
          />
        ))}
      </ScrollView>

      {task ? (
        <Row gap={6} style={{ justifyContent: 'center', marginTop: 8 }}>
          <T size={13} muted numberOfLines={1} style={{ maxWidth: 240 }}>
            <T w={700} size={13}>
              {task.title}
            </T>{' '}
            · round {timer.round || 1}
          </T>
          {!timer.running && (
            <Pressable onPress={() => setTimer({ taskId: null })} hitSlop={8}>
              <Icon name="x" size={14} color={c.muted} />
            </Pressable>
          )}
        </Row>
      ) : todaysTasks.length && !timer.running ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 6 }}>
          <T size={12} muted style={{ alignSelf: 'center' }}>
            Link a task:
          </T>
          {todaysTasks.map((t) => (
            <Chip key={t.id} small label={t.title.length > 22 ? t.title.slice(0, 22) + '…' : t.title} onPress={() => setTimer({ taskId: t.id })} />
          ))}
        </ScrollView>
      ) : (
        <T size={13} muted center style={{ marginTop: 8 }}>
          {subject.name} · round {timer.round || 1}
        </T>
      )}

      <View style={{ width: SIZE, height: SIZE, alignSelf: 'center', marginTop: 4, alignItems: 'center', justifyContent: 'center' }}>
        <Dial progress={progress} color1={isBreak ? '#3DBE8B' : c.p} color2={isBreak ? '#8BE0B9' : c.p2} track={c.soft} tick={c.muted} />
        <View style={[{ width: 166, height: 166, borderRadius: 83, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }, shadow(c)]}>
          <Apple mood={mood} size={46} color={profile.color} accessory={timer.running && !isBreak ? 'headphones' : profile.accessory} face={profile.face} />
          <T w={700} size={36} style={{ letterSpacing: -1, marginTop: 2 }}>
            {clock(remaining != null ? Math.max(remaining, 0) : elapsed)}
          </T>
          <T w={600} size={10} muted>
            {label}
          </T>
        </View>
      </View>

      <Segmented options={MODES} value={timer.mode} onChange={changeMode} style={{ marginTop: 6 }} />

      <Row gap={22} style={{ justifyContent: 'center', marginTop: 18 }}>
        <IconBtn name="reset" size={54} onPress={reset} />
        <Pressable onPress={timer.running ? pause : start}>
          <Grad colors={isBreak ? ['#3DBE8B', '#6FD3A6'] : undefined} style={[{ width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center' }, shadow(c, true)]}>
            <Icon name={timer.running ? 'pause' : 'play'} size={28} color="#fff" width={3.2} fill={timer.running ? 'none' : '#fff'} />
          </Grad>
        </Pressable>
        <IconBtn name={timer.mode === 'stopwatch' ? 'stop' : 'check'} size={54} onPress={() => elapsed > 0 && finish(timer.mode !== 'stopwatch')} />
      </Row>
      <T size={11} muted center style={{ marginTop: 10 }}>
        ✓ finishes the session early and logs it to your timesheet
      </T>

      <Row between style={{ marginTop: 22 }}>
        <T w={700} size={16}>
          Today’s sessions
        </T>
        <T w={600} size={13} color={c.p}>
          {dur(focusedToday)} focused
        </T>
      </Row>
      {todaySessions.length === 0 ? (
        <Card style={{ padding: 16, marginTop: 10 }}>
          <T size={13} muted center>
            No sessions yet — press play and {profile.buddyName} will cheer you on 🎧
          </T>
        </Card>
      ) : (
        todaySessions.slice(0, 8).map((s) => {
          const sj = subjectOf(subjectsAll, s.subjectId);
          const tk = s.taskId ? tasks.find((t) => t.id === s.taskId) : null;
          const d0 = new Date(s.start);
          const d1 = new Date(s.end);
          return (
            <Card key={s.id} style={{ padding: 12, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: sj.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                <T size={16}>{sj.emoji}</T>
              </View>
              <View style={{ flex: 1 }}>
                <T w={600} size={13} numberOfLines={1}>
                  {tk ? tk.title : sj.name}
                </T>
                <T size={11} muted>
                  {hm(d0.getHours() * 60 + d0.getMinutes())} – {hm(d1.getHours() * 60 + d1.getMinutes())}
                </T>
              </View>
              <T w={700} size={13} color={sj.color}>
                {dur((s.end - s.start) / 60000)}
              </T>
            </Card>
          );
        })
      )}
    </Screen>
  );
}
