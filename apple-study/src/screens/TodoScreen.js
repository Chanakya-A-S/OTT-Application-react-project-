import React, { useMemo, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useTheme, T, shadow } from '../theme';
import { Screen, Header, Card, Grad, Bar, Chip, Field, CheckBox, Empty, Row } from '../components/ui';
import Icon from '../components/Icon';
import Apple from '../components/Apple';
import { useStore, live } from '../store';
import { dateKey } from '../utils/date';

const LISTS = [
  { v: 'today', l: 'Today' },
  { v: 'week', l: 'This week' },
  { v: 'someday', l: 'Someday' },
];
const EMOJI_HINTS = [
  [/buy|shop|order/i, '🛒'],
  [/print|paper|pdf/i, '📄'],
  [/library|book|read/i, '📚'],
  [/mail|email|message|call/i, '✉️'],
  [/charge|battery/i, '🔋'],
  [/lab|bag|pack/i, '🎒'],
  [/exam|test|quiz/i, '📝'],
  [/pay|fee|money/i, '💰'],
];
const guessEmoji = (t) => (EMOJI_HINTS.find(([r]) => r.test(t)) || [, ''])[1];

export default function TodoScreen() {
  const c = useTheme();
  const todosAll = useStore((s) => s.todos);
  const upsert = useStore((s) => s.upsert);
  const remove = useStore((s) => s.remove);
  const toggleTodo = useStore((s) => s.toggleTodo);
  const profile = useStore((s) => s.profile);
  const [list, setList] = useState('today');
  const [text, setText] = useState('');

  const todos = useMemo(() => live(todosAll), [todosAll]);
  const items = todos
    .filter((t) => (t.list || 'today') === list)
    .filter((t) => !t.done || !t.doneAt || dateKey(new Date(t.doneAt)) === dateKey() || list !== 'today')
    .sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0) || (a.createdAt || 0) - (b.createdAt || 0));
  const done = items.filter((t) => t.done).length;
  const pct = items.length ? done / items.length : 0;

  const add = () => {
    const t = text.trim();
    if (!t) return;
    upsert('todos', { text: t, list, emoji: guessEmoji(t), done: false });
    setText('');
  };
  const clearDone = () =>
    Alert.alert('Clear completed?', `${done} finished item${done === 1 ? '' : 's'} will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => items.filter((t) => t.done).forEach((t) => remove('todos', t.id)) },
    ]);

  return (
    <Screen scroll bottomSpace={40}>
      <Header
        title="To-do"
        right={
          done ? (
            <Pressable onPress={clearDone} hitSlop={8} style={{ width: 42, alignItems: 'flex-end' }}>
              <Icon name="trash" size={20} color={c.muted} />
            </Pressable>
          ) : undefined
        }
      />
      <Grad style={[{ borderRadius: 24, padding: 18, marginTop: 12, overflow: 'hidden' }, shadow(c, true)]}>
        <T w={600} size={13} color="#fff" style={{ opacity: 0.9 }}>
          {LISTS.find((l) => l.v === list).l}’s progress
        </T>
        <T w={700} size={30} color="#fff">
          {done} / {items.length}
        </T>
        <View style={{ width: '58%', marginTop: 6 }}>
          <Bar value={pct} color="#fff" bg="rgba(255,255,255,0.3)" />
        </View>
        <View style={{ position: 'absolute', right: 6, bottom: -16 }}>
          <Apple mood={pct >= 1 && items.length ? 'excited' : pct > 0 ? 'happy' : 'neutral'} size={100} color={profile.color} />
        </View>
      </Grad>

      <Row gap={8} style={{ marginTop: 16 }}>
        {LISTS.map((l) => (
          <Chip key={l.v} label={l.l} on={list === l.v} onPress={() => setList(l.v)} />
        ))}
      </Row>

      <Field
        icon="plus"
        placeholder="Add a quick to-do…"
        value={text}
        onChangeText={setText}
        onSubmitEditing={add}
        returnKeyType="done"
        submitBehavior="submit"
        style={{ marginTop: 14 }}
        right={
          text.trim() ? (
            <Pressable onPress={add} hitSlop={8}>
              <T w={700} size={13} color={c.p}>
                Add
              </T>
            </Pressable>
          ) : null
        }
      />

      {items.length === 0 ? (
        <Empty emoji="✨" title="Nothing here" sub="Add small things to remember — books, printouts, emails." />
      ) : (
        <Card style={{ marginTop: 14, paddingHorizontal: 16, paddingVertical: 4 }}>
          {items.map((t, i) => (
            <Pressable
              key={t.id}
              onLongPress={() =>
                Alert.alert('Delete to-do?', t.text, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => remove('todos', t.id) },
                ])
              }
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: c.line }}
            >
              <CheckBox round done={t.done} onPress={() => toggleTodo(t)} />
              <T w={500} size={14} style={{ flex: 1, textDecorationLine: t.done ? 'line-through' : 'none', color: t.done ? c.muted : c.text }}>
                {t.text}
              </T>
              {t.emoji ? <T size={15}>{t.emoji}</T> : null}
            </Pressable>
          ))}
        </Card>
      )}
      {items.length > 0 && (
        <T size={11} muted center style={{ marginTop: 12 }}>
          Long-press an item to delete it
        </T>
      )}
    </Screen>
  );
}
