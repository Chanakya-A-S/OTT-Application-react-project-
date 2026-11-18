import React from 'react';
import { View } from 'react-native';
import { useTheme, T } from '../theme';
import { Card, CheckBox, Row } from './ui';
import Icon from './Icon';
import { subjectOf } from '../store';
import { hm } from '../utils/date';

export const PRIORITY = {
  high: { label: 'High', fg: '#E8434B', bg: '#FFE1E1' },
  medium: { label: 'Med', fg: '#D48A00', bg: '#FFF1D9' },
  low: { label: 'Low', fg: '#2E9E72', bg: '#E3F6EE' },
};

export default function TaskRow({ task, day, subjects, done, onToggle, onPress, onLongPress }) {
  const c = useTheme();
  const s = subjectOf(subjects, task.subjectId);
  const pr = PRIORITY[task.priority] || PRIORITY.medium;
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, marginTop: 10, opacity: done ? 0.6 : 1 }} onPress={onPress} onLongPress={onLongPress}>
      <View style={{ width: 5, alignSelf: 'stretch', borderRadius: 3, backgroundColor: s.color }} />
      <View style={{ flex: 1 }}>
        <Row gap={6}>
          <T w={600} size={11} color={s.color}>
            {s.emoji} {s.name}
          </T>
          <View style={{ backgroundColor: c.dark ? pr.fg + '33' : pr.bg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 1 }}>
            <T w={600} size={10} color={pr.fg}>
              {pr.label}
            </T>
          </View>
          {task.repeat && task.repeat !== 'none' ? (
            <T size={10} muted>
              🔁 {task.repeat}
            </T>
          ) : null}
        </Row>
        <T w={600} size={14} style={{ marginTop: 2, textDecorationLine: done ? 'line-through' : 'none' }} numberOfLines={2}>
          {task.title}
        </T>
        {task.start != null && (
          <Row gap={4} style={{ marginTop: 3 }}>
            <Icon name="clock" size={12} color={c.muted} />
            <T size={11} muted>
              {hm(task.start)}
              {task.end != null ? ` – ${hm(task.end)}` : ''}
            </T>
            {task.reminderMin != null && task.reminderMin >= 0 ? (
              <>
                <View style={{ width: 6 }} />
                <Icon name="bell" size={12} color={c.muted} />
                <T size={11} muted>
                  {task.reminderMin ? `${task.reminderMin} min before` : 'at start'}
                </T>
              </>
            ) : null}
          </Row>
        )}
      </View>
      <CheckBox done={done} onPress={onToggle} />
    </Card>
  );
}
