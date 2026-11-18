import React, { useMemo, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme, T, shadow } from '../theme';
import { Screen, Header, Card, IconBtn, Empty, Row, Sheet, Label, Field, Chip, Btn } from '../components/ui';
import Icon from '../components/Icon';
import { useStore, live, subjectOf } from '../store';
import { dateKey, diffDays, parseKey, prettyDate, addDays } from '../utils/date';

export const daysLeftLabel = (d) => (d === 0 ? 'Today!' : d === 1 ? 'Tomorrow' : d < 0 ? 'Done' : `${d} days`);

export function upcomingExams(exams) {
  const today = dateKey();
  return live(exams)
    .map((e) => ({ ...e, left: diffDays(e.date, today) }))
    .filter((e) => e.left >= 0)
    .sort((a, b) => a.left - b.left);
}

export default function ExamsScreen() {
  const c = useTheme();
  const nav = useNavigation();
  const exams = useStore((s) => s.exams);
  const subjects = useStore((s) => s.subjects);
  const remove = useStore((s) => s.remove);
  const today = dateKey();
  const list = useMemo(() => live(exams).map((e) => ({ ...e, left: diffDays(e.date, today) })).sort((a, b) => (a.left < 0) - (b.left < 0) || Math.abs(a.left) - Math.abs(b.left)), [exams, today]);

  return (
    <Screen scroll bottomSpace={40}>
      <Header title="Exam countdown" right={<IconBtn name="plus" onPress={() => nav.navigate('ExamEditor', {})} />} />
      <T size={12} muted style={{ marginTop: 8 }}>
        You’ll get a reminder the evening before and on the morning of each exam.
      </T>
      {list.length === 0 && <Empty emoji="📅" title="No exams added" sub="Add your exam dates and watch the countdown on Home." />}
      {list.map((e) => {
        const s = subjectOf(subjects, e.subjectId);
        const past = e.left < 0;
        const urgent = e.left >= 0 && e.left <= 3;
        return (
          <Card
            key={e.id}
            style={{ marginTop: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, opacity: past ? 0.55 : 1 }}
            onPress={() => nav.navigate('ExamEditor', { id: e.id })}
            onLongPress={() =>
              Alert.alert('Delete exam?', e.title, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => remove('exams', e.id) },
              ])
            }
          >
            <View style={{ width: 62, height: 62, borderRadius: 18, backgroundColor: urgent ? c.p : s.color + '22', alignItems: 'center', justifyContent: 'center' }}>
              <T w={800} size={past ? 14 : 22} color={urgent ? '#fff' : s.color}>
                {past ? '✓' : e.left === 0 ? '🔥' : e.left}
              </T>
              {!past && e.left > 0 && (
                <T w={600} size={9} color={urgent ? '#fff' : s.color}>
                  {e.left === 1 ? 'DAY' : 'DAYS'}
                </T>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <T w={700} size={15} numberOfLines={1}>
                {e.title}
              </T>
              <T w={500} size={12} color={s.color}>
                {s.emoji} {s.name}
              </T>
              <T size={11} muted>
                {prettyDate(e.date)} · {past ? 'finished' : daysLeftLabel(e.left) + (e.left > 1 ? ' left' : '')}
              </T>
            </View>
            <Icon name="chev" size={18} color={c.muted} />
          </Card>
        );
      })}
      {list.length > 0 && (
        <T size={11} muted center style={{ marginTop: 14 }}>
          Long-press an exam to delete it
        </T>
      )}
    </Screen>
  );
}

export function ExamEditorScreen() {
  const c = useTheme();
  const nav = useNavigation();
  const { params = {} } = useRoute();
  const exams = useStore((s) => s.exams);
  const subjectsAll = useStore((s) => s.subjects);
  const upsert = useStore((s) => s.upsert);
  const remove = useStore((s) => s.remove);
  const existing = params.id ? exams.find((e) => e.id === params.id) : null;
  const subjects = useMemo(() => live(subjectsAll), [subjectsAll]);
  const [title, setTitle] = useState(existing?.title || '');
  const [subjectId, setSubjectId] = useState(existing?.subjectId || subjects[0]?.id);
  const [date, setDate] = useState(existing?.date || addDays(dateKey(), 14));

  const save = () => {
    const s = subjectOf(subjectsAll, subjectId);
    upsert('exams', { ...(existing || {}), title: title.trim() || `${s.name} exam`, subjectId, date });
    nav.goBack();
  };

  return (
    <Sheet
      title={existing ? 'Edit exam' : 'Add exam'}
      right={
        existing ? (
          <Pressable
            hitSlop={10}
            onPress={() => {
              remove('exams', existing.id);
              nav.goBack();
            }}
          >
            <Icon name="trash" size={20} color={c.danger} />
          </Pressable>
        ) : undefined
      }
    >
      <Label>EXAM NAME</Label>
      <Field icon="edit" placeholder="e.g. Maths final / Unit test 2" value={title} onChangeText={setTitle} />
      <Label>SUBJECT</Label>
      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        {subjects.map((s) => (
          <Chip key={s.id} small label={`${s.emoji} ${s.name}`} on={subjectId === s.id} color={s.color} dot={subjectId === s.id ? undefined : s.color} onPress={() => setSubjectId(s.id)} />
        ))}
      </Row>
      <Label>DATE</Label>
      <Pressable
        onPress={() =>
          DateTimePickerAndroid.open({ value: parseKey(date), mode: 'date', minimumDate: new Date(), onChange: (e, d) => e.type === 'set' && d && setDate(dateKey(d)) })
        }
      >
        <View style={[{ backgroundColor: c.card, borderRadius: 16, height: 50, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }, shadow(c)]}>
          <Icon name="cal" size={16} color={c.muted} />
          <T w={600} size={14}>
            {prettyDate(date)} · {daysLeftLabel(diffDays(date, dateKey()))}
          </T>
        </View>
      </Pressable>
      <Btn title={existing ? 'Save exam' : 'Add exam'} onPress={save} style={{ marginTop: 22 }} />
    </Sheet>
  );
}
