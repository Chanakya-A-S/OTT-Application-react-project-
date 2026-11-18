import React, { useMemo, useState } from 'react';
import { View, Pressable, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, T, shadow } from '../theme';
import { Screen, IconBtn, Chip, Grad, Empty, Row, tap } from '../components/ui';
import Icon from '../components/Icon';
import TaskRow from '../components/TaskRow';
import { useStore, live } from '../store';
import { tasksForDay, isDone } from '../logic';
import { dateKey, addDays, parseKey, DAYS, MONTHS_LONG, prettyDate } from '../utils/date';

export default function TasksScreen() {
  const c = useTheme();
  const nav = useNavigation();
  const tasks = useStore((s) => s.tasks);
  const subjectsAll = useStore((s) => s.subjects);
  const toggleTask = useStore((s) => s.toggleTask);
  const remove = useStore((s) => s.remove);
  const [day, setDay] = useState(dateKey());
  const [weekStart, setWeekStart] = useState(() => {
    const d = parseKey(dateKey());
    return addDays(dateKey(), -((d.getDay() + 6) % 7)); // Monday
  });
  const [filter, setFilter] = useState('all');

  const subjects = useMemo(() => live(subjectsAll), [subjectsAll]);
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const list = useMemo(() => tasksForDay(tasks, day).filter((t) => filter === 'all' || t.subjectId === filter), [tasks, day, filter]);
  const done = list.filter((t) => isDone(t, day)).length;
  const sorted = [...list.filter((t) => !isDone(t, day)), ...list.filter((t) => isDone(t, day))];
  const today = dateKey();
  const hasTasks = (d) => tasks.some((t) => !t.deleted && tasksForDay([t], d).length);
  const monthLabel = `${MONTHS_LONG[parseKey(day).getMonth()]} ${parseKey(day).getFullYear()}`;

  const confirmDelete = (t) =>
    Alert.alert('Delete task?', t.repeat !== 'none' ? 'This removes every repeat of this task.' : t.title, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove('tasks', t.id) },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen scroll>
        <Row between style={{ marginTop: 6 }}>
          <View>
            <T w={700} size={24}>
              Study Plan
            </T>
            <T size={12} muted>
              {monthLabel}
            </T>
          </View>
          <Row gap={8}>
            <IconBtn name="cal" onPress={() => nav.navigate('Timesheet', { day })} />
          </Row>
        </Row>

        <Row between style={{ marginTop: 14 }} gap={4}>
          <Pressable onPress={() => setWeekStart(addDays(weekStart, -7))} hitSlop={8}>
            <Icon name="chevL" size={18} color={c.muted} />
          </Pressable>
          {week.map((d) => {
            const on = d === day;
            const dd = parseKey(d);
            return (
              <Pressable
                key={d}
                onPress={() => {
                  tap();
                  setDay(d);
                }}
                style={[
                  { width: 40, paddingVertical: 8, borderRadius: 16, alignItems: 'center', backgroundColor: on ? c.p : c.card },
                  on ? shadow(c, true) : null,
                ]}
              >
                <T w={600} size={10} color={on ? '#fff' : c.muted}>
                  {DAYS[dd.getDay()]}
                </T>
                <T w={700} size={15} color={on ? '#fff' : d === today ? c.p : c.text}>
                  {dd.getDate()}
                </T>
                <View style={{ width: 5, height: 5, borderRadius: 3, marginTop: 2, backgroundColor: hasTasks(d) ? (on ? '#fff' : c.p) : 'transparent' }} />
              </Pressable>
            );
          })}
          <Pressable onPress={() => setWeekStart(addDays(weekStart, 7))} hitSlop={8}>
            <Icon name="chev" size={18} color={c.muted} />
          </Pressable>
        </Row>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 6 }}>
          <Chip label="All" on={filter === 'all'} onPress={() => setFilter('all')} />
          {subjects.map((s) => (
            <Chip key={s.id} label={s.name} dot={s.color} on={filter === s.id} color={s.color} onPress={() => setFilter(filter === s.id ? 'all' : s.id)} />
          ))}
        </ScrollView>

        <Row between style={{ marginTop: 10 }}>
          <T w={700} size={16}>
            {day === today ? 'Today' : prettyDate(day)} · {done}/{list.length} done
          </T>
          {day !== today && (
            <Pressable
              onPress={() => {
                setDay(today);
                const d = parseKey(today);
                setWeekStart(addDays(today, -((d.getDay() + 6) % 7)));
              }}
            >
              <T w={600} size={12} color={c.p}>
                Jump to today
              </T>
            </Pressable>
          )}
        </Row>

        {sorted.length === 0 ? (
          <Empty emoji="📚" title="No study tasks here" sub="Tap + to plan what to study, which subject, and when." />
        ) : (
          sorted.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              day={day}
              subjects={subjectsAll}
              done={isDone(t, day)}
              onToggle={() => toggleTask(t, day)}
              onPress={() => nav.navigate('TaskEditor', { id: t.id, day })}
              onLongPress={() => confirmDelete(t)}
            />
          ))
        )}
        {sorted.length > 0 && (
          <T size={11} muted center style={{ marginTop: 14 }}>
            Tip: long-press a task to delete it
          </T>
        )}
      </Screen>
      <Pressable
        onPress={() => {
          tap();
          nav.navigate('TaskEditor', { day });
        }}
        style={{ position: 'absolute', right: 20, bottom: 110 }}
      >
        <Grad style={[{ width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, shadow(c, true)]}>
          <Icon name="plus" size={26} color="#fff" width={2.6} />
        </Grad>
      </Pressable>
    </View>
  );
}
