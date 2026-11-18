import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useTheme, T } from '../theme';
import { Screen, Header, Card, Row, Segmented, tap } from '../components/ui';
import { useStore, live, subjectOf } from '../store';
import { computeStats, focusMinutesOn } from '../logic';
import { dateKey, addDays, parseKey, DAYS, dur } from '../utils/date';

const CHART_H = 150;

/** Single-series bar chart: focus minutes per day. Tap a bar to read its value. */
function BarChart({ days, values, todayKey }) {
  const c = useTheme();
  const [sel, setSel] = useState(null);
  const max = Math.max(60, ...values);
  const nice = Math.ceil(max / 60) * 60; // round axis to whole hours
  const ticks = [0, nice / 2, nice];
  return (
    <View>
      <View style={{ height: CHART_H, flexDirection: 'row', marginTop: 18 }}>
        <View style={{ width: 34, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 6 }}>
          {[...ticks].reverse().map((t) => (
            <T key={t} w={500} size={9} muted style={{ marginVertical: -6 }}>
              {t >= 60 ? `${t / 60}h` : `${t}m`}
            </T>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          {ticks.map((t) => (
            <View key={t} style={{ position: 'absolute', left: 0, right: 0, bottom: (t / nice) * CHART_H, height: 1, backgroundColor: c.line, opacity: t === 0 ? 1 : 0.6 }} />
          ))}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end' }}>
            {values.map((v, i) => {
              const h = v > 0 ? Math.max(4, (v / nice) * CHART_H) : 0;
              const on = sel === i;
              const isToday = days[i] === todayKey;
              return (
                <Pressable
                  key={days[i]}
                  onPress={() => {
                    tap();
                    setSel(on ? null : i);
                  }}
                  style={{ flex: 1, height: CHART_H, justifyContent: 'flex-end', alignItems: 'center' }}
                  hitSlop={4}
                >
                  {on && (
                    <View style={{ position: 'absolute', bottom: h + 6, backgroundColor: c.dark ? '#2A2230' : '#2A1A1D', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, zIndex: 5 }}>
                      <T w={700} size={10} color="#fff" numberOfLines={1}>
                        {dur(v)}
                      </T>
                    </View>
                  )}
                  <View
                    style={{
                      width: 18,
                      height: h,
                      backgroundColor: c.p,
                      opacity: sel == null || on ? (isToday ? 1 : 0.75) : 0.35,
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4,
                    }}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginLeft: 34, marginTop: 6 }}>
        {days.map((d) => (
          <T key={d} w={d === todayKey ? 700 : 500} size={10} color={d === todayKey ? c.text : c.muted} center style={{ flex: 1 }}>
            {d === todayKey ? 'Today' : DAYS[parseKey(d).getDay()]}
          </T>
        ))}
      </View>
    </View>
  );
}

const Tile = ({ label, value, sub }) => (
  <Card style={{ flex: 1, padding: 14 }}>
    <T w={500} size={11} muted>
      {label}
    </T>
    <T w={700} size={20} style={{ marginTop: 2 }}>
      {value}
    </T>
    {sub ? (
      <T size={10} muted>
        {sub}
      </T>
    ) : null}
  </Card>
);

export default function StatsScreen() {
  const c = useTheme();
  const tasks = useStore((s) => s.tasks);
  const todos = useStore((s) => s.todos);
  const sessions = useStore((s) => s.sessions);
  const subjects = useStore((s) => s.subjects);
  const [range, setRange] = useState(7);

  const today = dateKey();
  const data = useMemo(() => {
    const days = Array.from({ length: range }, (_, i) => addDays(today, i - range + 1));
    const mins = days.map((d) => Math.round(focusMinutesOn(sessions, d)));
    const done = days.map((d) => tasks.reduce((a, t) => a + (!t.deleted && (t.completedDates || []).includes(d) ? 1 : 0), 0));
    const inRange = sessions.filter((s) => !s.deleted && days.includes(dateKey(new Date(s.start))));
    const bySubject = {};
    inRange.forEach((s) => (bySubject[s.subjectId] = (bySubject[s.subjectId] || 0) + (s.end - s.start) / 60000));
    const subj = Object.entries(bySubject)
      .map(([id, m]) => ({ s: subjectOf(subjects, id), m }))
      .sort((a, b) => b.m - a.m);
    const total = mins.reduce((a, b) => a + b, 0);
    const best = mins.indexOf(Math.max(...mins));
    return { days, mins, done, subj, total, best, tasksDone: done.reduce((a, b) => a + b, 0), activeDays: mins.filter((m) => m > 0).length };
  }, [range, sessions, tasks, subjects, today]);
  const st = useMemo(() => computeStats({ tasks, todos, sessions }), [tasks, todos, sessions]);
  const maxSubj = data.subj[0]?.m || 1;

  return (
    <Screen scroll bottomSpace={40}>
      <Header title="Your progress" />
      <Segmented
        style={{ marginTop: 12 }}
        value={range}
        onChange={setRange}
        options={[
          { value: 7, label: 'Last 7 days' },
          { value: 14, label: 'Last 14 days' },
        ]}
      />
      <Row gap={10} style={{ marginTop: 14 }}>
        <Tile label="Focus time" value={dur(data.total)} sub={`avg ${dur(data.total / range)} / day`} />
        <Tile label="Tasks done" value={`${data.tasksDone}`} sub={`${data.activeDays} active day${data.activeDays === 1 ? '' : 's'}`} />
      </Row>
      <Row gap={10} style={{ marginTop: 10 }}>
        <Tile label="Current streak" value={`🔥 ${st.streak}`} sub="days in a row" />
        <Tile label="Best day" value={data.mins[data.best] ? (data.days[data.best] === today ? 'Today' : DAYS[parseKey(data.days[data.best]).getDay()]) : '—'} sub={data.mins[data.best] ? dur(data.mins[data.best]) : 'no sessions yet'} />
      </Row>

      <Card style={{ marginTop: 14, padding: 16 }}>
        <T w={700} size={15}>
          Focus minutes per day
        </T>
        <T size={11} muted style={{ marginBottom: 14 }}>
          From the Focus Timer · tap a bar for its value
        </T>
        <BarChart days={data.days} values={data.mins} todayKey={today} />
      </Card>

      <Card style={{ marginTop: 14, padding: 16 }}>
        <T w={700} size={15}>
          Time by subject
        </T>
        {data.subj.length === 0 ? (
          <T size={12} muted style={{ marginTop: 8 }}>
            No focus sessions in this period yet. Start the timer to see your subject split 🍅
          </T>
        ) : (
          data.subj.map(({ s, m }) => (
            <View key={s.id} style={{ marginTop: 12 }}>
              <Row between>
                <T w={600} size={13}>
                  {s.emoji} {s.name}
                </T>
                <T w={600} size={12} muted>
                  {dur(m)} · {Math.round((m / data.total) * 100) || 0}%
                </T>
              </Row>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: c.line, marginTop: 6, overflow: 'hidden' }}>
                <View style={{ width: `${(m / maxSubj) * 100}%`, height: 8, borderRadius: 4, backgroundColor: s.color }} />
              </View>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}
