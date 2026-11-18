import React, { useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme, T } from '../theme';
import { Sheet, Field, Label, Btn, Row } from '../components/ui';
import Icon from '../components/Icon';
import { useStore } from '../store';
import { hm, dateKey, prettyDate } from '../utils/date';
import { pickTime } from './TaskEditorScreen';

const COLORS = ['#F5A623', '#9C8B8E', '#3DBE8B', '#5B8DEF', '#E86A92', '#9B7BEA', '#2EC4C4', '#E8434B'];
const PRESETS = [
  ['🌅', 'Wake up & exercise'],
  ['🍳', 'Breakfast'],
  ['🏫', 'School / College'],
  ['🍱', 'Lunch break'],
  ['🎮', 'Free time'],
  ['🚶', 'Walk'],
  ['🍽️', 'Dinner'],
  ['😴', 'Sleep'],
];

export default function BlockEditorScreen() {
  const c = useTheme();
  const nav = useNavigation();
  const { params = {} } = useRoute();
  const blocks = useStore((s) => s.blocks);
  const upsert = useStore((s) => s.upsert);
  const remove = useStore((s) => s.remove);
  const existing = params.id ? blocks.find((b) => b.id === params.id) : null;
  const [title, setTitle] = useState(existing?.title || '');
  const [emoji, setEmoji] = useState(existing?.emoji || '🗓️');
  const [color, setColor] = useState(existing?.color || COLORS[0]);
  const [start, setStart] = useState(existing?.start ?? params.start ?? 9 * 60);
  const [end, setEnd] = useState(existing?.end ?? params.end ?? (params.start ?? 9 * 60) + 60);
  const day = existing?.date || params.day || dateKey();

  const save = () => {
    if (!title.trim()) return Alert.alert('Name this block', 'e.g. Lunch break, Gym, School');
    upsert('blocks', { ...(existing || {}), title: title.trim(), emoji, color, start, end: end > start ? end : Math.min(start + 60, 1440), date: day });
    nav.goBack();
  };

  return (
    <Sheet
      title={existing ? 'Edit block' : 'New time block'}
      right={
        existing ? (
          <Pressable
            hitSlop={10}
            onPress={() => {
              remove('blocks', existing.id);
              nav.goBack();
            }}
          >
            <Icon name="trash" size={20} color={c.danger} />
          </Pressable>
        ) : undefined
      }
    >
      <T size={12} muted style={{ marginTop: 4 }}>
        {prettyDate(day)}
      </T>
      {!existing && (
        <Pressable
          onPress={() => {
            nav.goBack();
            nav.navigate('TaskEditor', { day, start, end });
          }}
          style={{ marginTop: 12, backgroundColor: c.soft, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          <T size={20}>📚</T>
          <View style={{ flex: 1 }}>
            <T w={700} size={14} color={c.p}>
              Plan a study task here instead
            </T>
            <T size={11} muted>
              With subject, reminder and completion tracking
            </T>
          </View>
          <Icon name="chev" size={18} color={c.p} />
        </Pressable>
      )}
      <Label>BLOCK NAME</Label>
      <Field placeholder="e.g. Lunch break" value={title} onChangeText={setTitle} />
      <Row gap={8} style={{ flexWrap: 'wrap', marginTop: 10 }}>
        {PRESETS.map(([e, t]) => (
          <Pressable
            key={t}
            onPress={() => {
              setTitle(t);
              setEmoji(e);
            }}
            style={{ backgroundColor: c.card, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <T w={500} size={12}>
              {e} {t}
            </T>
          </Pressable>
        ))}
      </Row>
      <Label>TIME</Label>
      <Row gap={10}>
        {[
          ['Start', start, (m) => { setStart(m); if (end <= m) setEnd(Math.min(m + 60, 1440)); }],
          ['End', end, setEnd],
        ].map(([l, v, set]) => (
          <Pressable key={l} style={{ flex: 1 }} onPress={() => pickTime(v % 1440, set)}>
            <View style={{ backgroundColor: c.card, borderRadius: 16, height: 50, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 2 }}>
              <Icon name="clock" size={16} color={c.muted} />
              <T w={600} size={14}>
                {l} {hm(v)}
              </T>
            </View>
          </Pressable>
        ))}
      </Row>
      <Label>COLOUR</Label>
      <Row gap={10}>
        {COLORS.map((col) => (
          <Pressable key={col} onPress={() => setColor(col)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: col, borderWidth: color === col ? 3 : 0, borderColor: c.text }} />
        ))}
      </Row>
      <Btn title={existing ? 'Save block' : 'Add to timesheet'} onPress={save} style={{ marginTop: 22 }} />
    </Sheet>
  );
}
