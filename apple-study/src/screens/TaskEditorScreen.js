import React, { useMemo, useState } from 'react';
import { View, Pressable, Alert, TextInput } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme, T, FONTS } from '../theme';
import { Sheet, Field, Label, Chip, Btn, Toggle, Row, Card, tap } from '../components/ui';
import Icon from '../components/Icon';
import { useStore, live } from '../store';
import { dateKey, parseKey, prettyDate, hm, nowMin } from '../utils/date';
import { ensurePermission } from '../notifications';

export const SUBJECT_COLORS = ['#5B8DEF', '#9B7BEA', '#3DBE8B', '#F5A623', '#2EC4C4', '#E86A92', '#E8434B', '#8D6E63'];
const EMOJIS = ['📚', '📐', '🔭', '⚗️', '📖', '🧬', '🏛️', '💻', '🌍', '🎨', '🎵', '🧠'];
const REMINDERS = [
  { v: -1, l: 'Off' },
  { v: 0, l: 'At start' },
  { v: 5, l: '5 min' },
  { v: 10, l: '10 min' },
  { v: 15, l: '15 min' },
  { v: 30, l: '30 min' },
  { v: 60, l: '1 hour' },
];
const REPEATS = [
  { v: 'none', l: 'Once' },
  { v: 'daily', l: 'Daily' },
  { v: 'weekdays', l: 'Weekdays' },
  { v: 'weekly', l: 'Weekly' },
];

const toDate = (min) => {
  const d = new Date();
  d.setHours(Math.floor(min / 60), min % 60, 0, 0);
  return d;
};

export function pickTime(min, cb) {
  DateTimePickerAndroid.open({
    value: toDate(min ?? nowMin()),
    mode: 'time',
    is24Hour: true,
    onChange: (e, d) => e.type === 'set' && d && cb(d.getHours() * 60 + d.getMinutes()),
  });
}

function NewSubject({ onDone }) {
  const c = useTheme();
  const upsert = useStore((s) => s.upsert);
  const [name, setName] = useState('');
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  const [emoji, setEmoji] = useState('📚');
  return (
    <Card style={{ padding: 14, marginTop: 10 }}>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Subject name (e.g. Computer Science)"
        placeholderTextColor={c.muted}
        autoFocus
        style={{ fontFamily: FONTS[600], fontSize: 14, color: c.text, paddingVertical: 4 }}
      />
      <Row gap={8} style={{ marginTop: 10, flexWrap: 'wrap' }}>
        {SUBJECT_COLORS.map((col) => (
          <Pressable key={col} onPress={() => setColor(col)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: col, borderWidth: color === col ? 3 : 0, borderColor: c.text }} />
        ))}
      </Row>
      <Row gap={6} style={{ marginTop: 10, flexWrap: 'wrap' }}>
        {EMOJIS.map((e) => (
          <Pressable key={e} onPress={() => setEmoji(e)} style={{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: emoji === e ? c.soft : 'transparent' }}>
            <T size={18}>{e}</T>
          </Pressable>
        ))}
      </Row>
      <Row gap={10} style={{ marginTop: 12 }}>
        <Btn small outline title="Cancel" onPress={() => onDone(null)} style={{ flex: 1 }} />
        <Btn
          small
          title="Add subject"
          disabled={!name.trim()}
          onPress={() => onDone(upsert('subjects', { name: name.trim(), color, emoji }))}
          style={{ flex: 1 }}
        />
      </Row>
    </Card>
  );
}

const Picker = ({ icon, label, onPress, style }) => {
  const c = useTheme();
  return (
    <Pressable onPress={onPress} style={[{ flex: 1 }, style]}>
      <View style={{ backgroundColor: c.card, borderRadius: 16, height: 50, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 2 }}>
        <Icon name={icon} size={16} color={c.muted} />
        <T w={600} size={14}>
          {label}
        </T>
      </View>
    </Pressable>
  );
};

export default function TaskEditorScreen() {
  const c = useTheme();
  const nav = useNavigation();
  const { params = {} } = useRoute();
  const tasks = useStore((s) => s.tasks);
  const subjectsAll = useStore((s) => s.subjects);
  const settings = useStore((s) => s.settings);
  const upsert = useStore((s) => s.upsert);
  const remove = useStore((s) => s.remove);
  const existing = params.id ? tasks.find((t) => t.id === params.id) : null;
  const subjects = useMemo(() => live(subjectsAll), [subjectsAll]);

  const defStart = params.start ?? Math.min(Math.ceil((nowMin() + 1) / 30) * 30, 22 * 60);
  const [title, setTitle] = useState(existing?.title || '');
  const [subjectId, setSubjectId] = useState(existing?.subjectId || params.subjectId || subjects[0]?.id);
  const [date, setDate] = useState(existing?.date || params.day || dateKey());
  const [hasTime, setHasTime] = useState(existing ? existing.start != null : true);
  const [start, setStart] = useState(existing?.start ?? defStart);
  const [end, setEnd] = useState(existing?.end ?? (params.end ?? defStart + 60));
  const [priority, setPriority] = useState(existing?.priority || 'medium');
  const [reminderMin, setReminderMin] = useState(existing ? existing.reminderMin ?? -1 : settings.defaultReminder);
  const [repeat, setRepeat] = useState(existing?.repeat || 'none');
  const [inTimesheet, setInTimesheet] = useState(existing ? existing.inTimesheet !== false : true);
  const [details, setDetails] = useState(existing?.details || '');
  const [adding, setAdding] = useState(false);

  const save = async () => {
    if (!title.trim()) return Alert.alert('What will you study?', 'Give the task a short title.');
    const s = hasTime ? start : null;
    let e = hasTime ? end : null;
    if (hasTime && e <= s) e = Math.min(s + 60, 24 * 60 - 1);
    upsert('tasks', {
      ...(existing || { completedDates: [] }),
      title: title.trim(),
      subjectId,
      date,
      start: s,
      end: e,
      priority,
      reminderMin: hasTime ? reminderMin : -1,
      repeat,
      inTimesheet,
      details,
    });
    if (hasTime && reminderMin >= 0) await ensurePermission().catch(() => {});
    nav.goBack();
  };

  const del = () =>
    Alert.alert('Delete task?', existing.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          remove('tasks', existing.id);
          nav.goBack();
        },
      },
    ]);

  const deleteSubject = (s) =>
    Alert.alert(`Remove “${s.name}”?`, 'Tasks keep working but show as General.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove('subjects', s.id) },
    ]);

  return (
    <Sheet
      title={existing ? 'Edit study task' : 'New study task'}
      right={
        existing ? (
          <Pressable onPress={del} hitSlop={10}>
            <Icon name="trash" size={20} color={c.danger} />
          </Pressable>
        ) : undefined
      }
    >
      <Label>WHAT TO STUDY</Label>
      <Field icon="edit" placeholder="e.g. Thermodynamics — 1st law" value={title} onChangeText={setTitle} autoFocus={!existing} />

      <Label>SUBJECT</Label>
      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        {subjects.map((s) => (
          <Chip
            key={s.id}
            label={`${s.emoji || ''} ${s.name}`}
            on={subjectId === s.id}
            color={s.color}
            dot={subjectId === s.id ? undefined : s.color}
            onPress={() => setSubjectId(s.id)}
            onLongPress={() => deleteSubject(s)}
            small
          />
        ))}
        <Chip label="+ New" small onPress={() => setAdding(true)} />
      </Row>
      {adding && (
        <NewSubject
          onDone={(s) => {
            setAdding(false);
            if (s) setSubjectId(s.id);
          }}
        />
      )}

      <Label>DATE</Label>
      <Picker
        icon="cal"
        label={`${prettyDate(date)}${date === dateKey() ? ' · Today' : ''}`}
        onPress={() =>
          DateTimePickerAndroid.open({ value: parseKey(date), mode: 'date', onChange: (e, d) => e.type === 'set' && d && setDate(dateKey(d)) })
        }
      />

      <Row between style={{ marginTop: 16, marginBottom: 7 }}>
        <T w={600} size={11} muted style={{ letterSpacing: 0.8 }}>
          TIME
        </T>
        <Row gap={8}>
          <T size={12} muted>
            Set a time
          </T>
          <Toggle value={hasTime} onChange={setHasTime} />
        </Row>
      </Row>
      {hasTime && (
        <Row gap={10}>
          <Picker icon="clock" label={`Start ${hm(start)}`} onPress={() => pickTime(start, (m) => { setStart(m); if (end <= m) setEnd(Math.min(m + 60, 1439)); })} />
          <Picker icon="clock" label={`End ${hm(end)}`} onPress={() => pickTime(end, setEnd)} />
        </Row>
      )}

      <Label>PRIORITY</Label>
      <Row gap={8}>
        {[
          ['low', 'Low', '#2E9E72'],
          ['medium', 'Medium', '#D48A00'],
          ['high', 'High', '#E8434B'],
        ].map(([k, l, col]) => (
          <Pressable
            key={k}
            onPress={() => {
              tap();
              setPriority(k);
            }}
            style={{ flex: 1, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: priority === k ? col + '22' : c.card, borderWidth: 2, borderColor: priority === k ? col : 'transparent' }}
          >
            <T w={600} size={13} color={priority === k ? col : c.text}>
              {l}
            </T>
          </Pressable>
        ))}
      </Row>

      {hasTime && (
        <>
          <Label>REMINDER 🔔</Label>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {REMINDERS.map((r) => (
              <Chip key={r.v} label={r.l} small on={reminderMin === r.v} onPress={() => setReminderMin(r.v)} />
            ))}
          </Row>
        </>
      )}

      <Label>REPEAT</Label>
      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        {REPEATS.map((r) => (
          <Chip key={r.v} label={r.l} small on={repeat === r.v} onPress={() => setRepeat(r.v)} />
        ))}
      </Row>

      <Card style={{ marginTop: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <T w={600} size={14}>
          📍 Show on timesheet
        </T>
        <Toggle value={inTimesheet} onChange={setInTimesheet} />
      </Card>

      <Label>NOTES (OPTIONAL)</Label>
      <Field placeholder="Pages, chapters, links…" value={details} onChangeText={setDetails} multiline inputStyle={{ minHeight: 60 }} />

      <Btn title={existing ? 'Save changes' : 'Add task'} onPress={save} style={{ marginTop: 20 }} />
      {existing && (
        <Btn
          outline
          icon="play"
          title="Start focus timer"
          onPress={() => {
            nav.goBack();
            nav.navigate('Main', { screen: 'Timer', params: { taskId: existing.id, subjectId: existing.subjectId } });
          }}
          style={{ marginTop: 10 }}
        />
      )}
    </Sheet>
  );
}
