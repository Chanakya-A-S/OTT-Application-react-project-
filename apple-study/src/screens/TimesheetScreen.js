import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, ScrollView, PanResponder, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme, T, shadow } from '../theme';
import { Header, IconBtn, Segmented, Row } from '../components/ui';
import Icon from '../components/Icon';
import { useStore, subjectOf } from '../store';
import { tasksForDay, isDone } from '../logic';
import { dateKey, addDays, prettyDate, hm, snap, dur, nowMin, pad } from '../utils/date';

const HOUR = 64;
const GUTTER = 50;
const SCREEN_W = Dimensions.get('window').width;
const AREA_W = SCREEN_W - 40 - GUTTER;

function layout(items) {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const out = [];
  let cluster = [];
  let clusterEnd = -1;
  const flush = () => {
    const lanes = [];
    cluster.forEach((it) => {
      let lane = lanes.findIndex((end) => end <= it.start);
      if (lane === -1) {
        lane = lanes.length;
        lanes.push(it.end);
      } else lanes[lane] = it.end;
      it.lane = lane;
    });
    cluster.forEach((it) => out.push({ ...it, lanes: lanes.length }));
    cluster = [];
  };
  sorted.forEach((it) => {
    if (it.start >= clusterEnd && cluster.length) flush();
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.end);
  });
  if (cluster.length) flush();
  return out;
}

function Block({ item, selected, editable, onSelect, onCommit, onTap }) {
  const c = useTheme();
  const [drag, setDrag] = useState({ dy: 0, dh: 0 });
  const st = useRef({ mode: null, timer: null, moved: false, selected });
  st.current.selected = selected;
  const props = useRef({ item, onSelect, onCommit, onTap, editable });
  props.current = { item, onSelect, onCommit, onTap, editable };

  const body = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const s = st.current;
        s.moved = false;
        s.mode = null;
        if (!props.current.editable) return;
        if (s.selected) s.mode = 'move';
        else
          s.timer = setTimeout(() => {
            if (s.moved) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            s.mode = 'move';
            props.current.onSelect(props.current.item.key);
          }, 380);
      },
      onPanResponderMove: (e, g) => {
        const s = st.current;
        if (s.mode === 'move') setDrag({ dy: g.dy, dh: 0 });
        else if (Math.abs(g.dy) > 8 || Math.abs(g.dx) > 8) s.moved = true;
      },
      onPanResponderRelease: (e, g) => {
        const s = st.current;
        clearTimeout(s.timer);
        if (s.mode === 'move') {
          const it = props.current.item;
          const len = it.end - it.start;
          const ns = Math.max(0, Math.min(1440 - len, snap(it.start + (g.dy / HOUR) * 60)));
          setDrag({ dy: 0, dh: 0 });
          if (ns !== it.start) props.current.onCommit(it, ns, ns + len);
        } else if (!s.moved) props.current.onTap(props.current.item);
        s.mode = null;
      },
      onPanResponderTerminationRequest: () => st.current.mode !== 'move',
      onPanResponderTerminate: () => {
        clearTimeout(st.current.timer);
        st.current.mode = null;
        setDrag({ dy: 0, dh: 0 });
      },
    })
  ).current;

  const handle = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (e, g) => setDrag({ dy: 0, dh: g.dy }),
      onPanResponderRelease: (e, g) => {
        const it = props.current.item;
        const ne = Math.max(it.start + 15, Math.min(1440, snap(it.end + (g.dy / HOUR) * 60)));
        setDrag({ dy: 0, dh: 0 });
        if (ne !== it.end) props.current.onCommit(it, it.start, ne);
      },
      onPanResponderTerminate: () => setDrag({ dy: 0, dh: 0 }),
    })
  ).current;

  const top = (item.start / 60) * HOUR + drag.dy;
  const height = Math.max(((item.end - item.start) / 60) * HOUR + drag.dh - 3, 22);
  const w = AREA_W / item.lanes;
  const liveStart = Math.max(0, snap(item.start + (drag.dy / HOUR) * 60));
  const liveEnd = drag.dh ? snap(item.end + (drag.dh / HOUR) * 60) : liveStart + (item.end - item.start);
  const solid = selected;
  return (
    <View
      {...body.panHandlers}
      style={[
        {
          position: 'absolute',
          top: top + 1.5,
          left: GUTTER + item.lane * w + 2,
          width: w - 4,
          height,
          borderRadius: 14,
          backgroundColor: solid ? item.color : item.color + (c.dark ? '38' : '24'),
          borderLeftWidth: 4,
          borderLeftColor: item.color,
          paddingHorizontal: 9,
          paddingVertical: height > 40 ? 6 : 2,
          overflow: 'hidden',
          opacity: item.done ? 0.6 : 1,
          zIndex: selected ? 10 : 1,
        },
        selected && { ...shadow(c, true), transform: [{ scale: 1.02 }] },
      ]}
    >
      <T w={700} size={12} color={solid ? '#fff' : c.text} numberOfLines={height > 40 ? 2 : 1} style={{ textDecorationLine: item.done ? 'line-through' : 'none' }}>
        {item.title}
      </T>
      {height > 38 && (
        <T w={500} size={10} color={solid ? '#fff' : c.muted} numberOfLines={1}>
          {item.sub} · {hm(liveStart)}–{hm(liveEnd)}
        </T>
      )}
      {selected && (
        <>
          <View style={{ position: 'absolute', right: 8, top: 8 }}>
            <Icon name="grip" size={16} color="#fff" width={3} />
          </View>
          <View {...handle.panHandlers} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 22, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 34, height: 5, borderRadius: 3, backgroundColor: '#fff' }} />
          </View>
        </>
      )}
    </View>
  );
}

export default function TimesheetScreen() {
  const c = useTheme();
  const nav = useNavigation();
  const { params = {} } = useRoute();
  const insets = useSafeAreaInsets();
  const tasks = useStore((s) => s.tasks);
  const blocks = useStore((s) => s.blocks);
  const sessions = useStore((s) => s.sessions);
  const subjects = useStore((s) => s.subjects);
  const upsert = useStore((s) => s.upsert);
  const [day, setDay] = useState(params.day || dateKey());
  const [view, setView] = useState('plan');
  const [selected, setSelected] = useState(null);
  const [now, setNow] = useState(nowMin());
  const scroll = useRef(null);

  useEffect(() => {
    const i = setInterval(() => setNow(nowMin()), 60000);
    return () => clearInterval(i);
  }, []);
  useEffect(() => {
    const h = day === dateKey() ? Math.max(0, Math.floor(nowMin() / 60) - 1) : 7;
    setTimeout(() => scroll.current?.scrollTo({ y: h * HOUR, animated: false }), 50);
  }, [day]);

  const plan = useMemo(() => {
    const ts = tasksForDay(tasks, day)
      .filter((t) => t.start != null && t.inTimesheet !== false)
      .map((t) => {
        const s = subjectOf(subjects, t.subjectId);
        return { key: 'task:' + t.id, kind: 'task', ref: t, title: t.title, sub: s.name, color: s.color, start: t.start, end: Math.max(t.end ?? t.start + 60, t.start + 15), done: isDone(t, day) };
      });
    const bs = blocks
      .filter((b) => !b.deleted && b.date === day)
      .map((b) => ({ key: 'block:' + b.id, kind: 'block', ref: b, title: `${b.emoji || ''} ${b.title}`.trim(), sub: 'Routine', color: b.color, start: b.start, end: b.end }));
    return layout([...ts, ...bs]);
  }, [tasks, blocks, subjects, day]);

  const actual = useMemo(() => {
    const items = sessions
      .filter((s) => !s.deleted && dateKey(new Date(s.start)) === day)
      .map((s) => {
        const d0 = new Date(s.start);
        const sj = subjectOf(subjects, s.subjectId);
        const tk = s.taskId ? tasks.find((t) => t.id === s.taskId) : null;
        const start = d0.getHours() * 60 + d0.getMinutes();
        return { key: 'sess:' + s.id, kind: 'session', ref: s, title: tk ? tk.title : `${sj.emoji} ${sj.name}`, sub: dur((s.end - s.start) / 60000), color: sj.color, start, end: Math.max(start + 15, start + Math.round((s.end - s.start) / 60000)) };
      });
    return layout(items);
  }, [sessions, subjects, tasks, day]);

  const items = view === 'plan' ? plan : actual;
  const plannedMin = plan.reduce((a, i) => a + (i.kind === 'task' ? i.end - i.start : 0), 0);
  const trackedMin = sessions.filter((s) => !s.deleted && dateKey(new Date(s.start)) === day).reduce((a, s) => a + (s.end - s.start) / 60000, 0);

  const commit = (it, start, end) => {
    if (it.kind === 'task') upsert('tasks', { ...it.ref, start, end });
    else if (it.kind === 'block') upsert('blocks', { ...it.ref, start, end });
    Haptics.selectionAsync().catch(() => {});
  };
  const open = (it) => {
    if (selected) return setSelected(null);
    if (it.kind === 'task') nav.navigate('TaskEditor', { id: it.ref.id, day });
    else if (it.kind === 'block') nav.navigate('BlockEditor', { id: it.ref.id });
  };
  const tapGrid = (e) => {
    if (selected) return setSelected(null);
    if (view !== 'plan') return;
    const start = Math.min(snap((e.nativeEvent.locationY / HOUR) * 60, 30), 1380);
    nav.navigate('BlockEditor', { day, start, end: start + 60 });
  };
  const selItem = plan.find((p) => p.key === selected);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + 6 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Header
          title="Timesheet"
          right={<IconBtn name="plus" onPress={() => nav.navigate('BlockEditor', { day, start: Math.min(Math.ceil(nowMin() / 60) * 60, 1380), end: Math.min(Math.ceil(nowMin() / 60) * 60 + 60, 1440) })} />}
        />
        <Row between style={{ marginTop: 10 }} gap={8}>
          <Row gap={6} style={{ flex: 1 }}>
            <Pressable onPress={() => setDay(addDays(day, -1))} hitSlop={10}>
              <Icon name="chevL" size={20} color={c.muted} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <T w={700} size={16} numberOfLines={1}>
                {day === dateKey() ? 'Today' : prettyDate(day)}
              </T>
              <T size={10} muted numberOfLines={1}>
                Planned {dur(plannedMin)} · Tracked {dur(trackedMin)}
              </T>
            </View>
            <Pressable onPress={() => setDay(addDays(day, 1))} hitSlop={10}>
              <Icon name="chev" size={20} color={c.muted} />
            </Pressable>
          </Row>
          <Segmented
            options={[
              { value: 'plan', label: 'Plan' },
              { value: 'actual', label: 'Actual' },
            ]}
            value={view}
            onChange={(v) => {
              setSelected(null);
              setView(v);
            }}
            style={{ width: 128 }}
          />
        </Row>
      </View>

      <ScrollView ref={scroll} style={{ flex: 1, marginTop: 12 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} scrollEnabled={!selected}>
        <View style={{ height: 24 * HOUR + 10, marginTop: 8 }}>
          <Pressable onPress={tapGrid} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
            {Array.from({ length: 25 }, (_, h) => (
              <View key={h} style={{ position: 'absolute', top: h * HOUR - 8, height: 16, left: 0, right: 0, flexDirection: 'row', alignItems: 'center' }}>
                <T w={600} size={10} muted style={{ width: GUTTER - 6 }}>
                  {pad(h % 24)}:00
                </T>
                <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
              </View>
            ))}
          </Pressable>
          {items.map((it) => (
            <Block
              key={it.key + (view === 'plan' ? it.start + '-' + it.end : '')}
              item={it}
              editable={view === 'plan'}
              selected={selected === it.key}
              onSelect={setSelected}
              onCommit={commit}
              onTap={open}
            />
          ))}
          {day === dateKey() && (
            <View pointerEvents="none" style={{ position: 'absolute', top: (now / 60) * HOUR, left: GUTTER - 6, right: 0, flexDirection: 'row', alignItems: 'center', zIndex: 20 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.p }} />
              <View style={{ flex: 1, height: 2, backgroundColor: c.p }} />
            </View>
          )}
          {items.length === 0 && (
            <View pointerEvents="none" style={{ position: 'absolute', top: 8 * HOUR + 10, left: GUTTER, right: 0, alignItems: 'center' }}>
              <T w={600} size={13} muted center>
                {view === 'plan' ? 'Tap any hour to add a block 🗓️\nTasks with a time appear here automatically' : 'No tracked sessions — use the Focus Timer ⏱️'}
              </T>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 16 }}>
        <View style={{ backgroundColor: c.dark ? '#2A2230' : '#2A1A1D', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <T w={600} size={12} color="#fff" style={{ flex: 1 }} numberOfLines={2}>
            {selItem ? `Moving “${selItem.title}” · ${hm(selItem.start)}–${hm(selItem.end)}` : view === 'plan' ? 'Long-press a block to drag it · tap to edit' : 'Sessions logged by the Focus Timer'}
          </T>
          {selItem ? (
            <Pressable onPress={() => setSelected(null)} hitSlop={10}>
              <T w={700} size={13} color="#FF8A72">
                Done
              </T>
            </Pressable>
          ) : (
            <T w={700} size={11} color="#FF8A72">
              Snap 15m
            </T>
          )}
        </View>
      </View>
    </View>
  );
}
