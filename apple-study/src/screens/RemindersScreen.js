import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme, T } from '../theme';
import { Screen, Header, Card, Empty, Row, Btn } from '../components/ui';
import Icon from '../components/Icon';
import { getScheduled, ensurePermission } from '../notifications';

const when = (n) => {
  const t = n.trigger || {};
  const pad = (x) => String(x).padStart(2, '0');
  const days = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (t.type === 'daily') return `Every day · ${pad(t.hour)}:${pad(t.minute)}`;
  if (t.type === 'weekly') return `Every ${days[t.weekday]} · ${pad(t.hour)}:${pad(t.minute)}`;
  const v = t.value || t.date || (t.dateComponents && null);
  if (v) {
    const d = new Date(v);
    return `${d.toDateString().slice(0, 10)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  if (t.seconds) return `in ${Math.round(t.seconds / 60)} min`;
  return 'Scheduled';
};
const sortKey = (n) => {
  const t = n.trigger || {};
  if (t.value || t.date) return new Date(t.value || t.date).getTime();
  return Date.now() + 1e12;
};

export default function RemindersScreen() {
  const c = useTheme();
  const nav = useNavigation();
  const [list, setList] = useState(null);
  const [granted, setGranted] = useState(true);

  useFocusEffect(
    useCallback(() => {
      getScheduled()
        .then((l) => setList(l.sort((a, b) => sortKey(a) - sortKey(b))))
        .catch(() => setList([]));
    }, [])
  );

  return (
    <Screen scroll bottomSpace={40}>
      <Header title="Reminders" />
      {!granted && (
        <Card style={{ padding: 14, marginTop: 10 }}>
          <T w={600} size={13}>Notifications are blocked</T>
        </Card>
      )}
      <T size={12} muted style={{ marginTop: 10 }}>
        Upcoming notifications on this phone. Reminders are created from tasks that have a time and a reminder set.
      </T>
      {list && list.length === 0 && <Empty emoji="🔕" title="No reminders scheduled" sub="Add a study task with a time and reminder, or allow notifications." />}
      {(list || []).map((n) => (
        <Card key={n.identifier} style={{ padding: 14, marginTop: 10, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={n.identifier.startsWith('nudge') ? 'heart' : n.identifier.startsWith('timer') ? 'timer' : 'bell'} size={18} color={c.p} />
          </View>
          <View style={{ flex: 1 }}>
            <T w={600} size={13} numberOfLines={1}>
              {n.content.title}
            </T>
            <T size={11} muted numberOfLines={1}>
              {n.content.body}
            </T>
            <Row gap={4} style={{ marginTop: 3 }}>
              <Icon name="clock" size={11} color={c.p} />
              <T w={600} size={11} color={c.p}>
                {when(n)}
              </T>
            </Row>
          </View>
        </Card>
      ))}
      <Btn
        small
        outline
        title="Allow notifications"
        icon="bell"
        style={{ marginTop: 18 }}
        onPress={async () => setGranted(await ensurePermission())}
      />
      <Btn small title="Plan a new task" icon="plus" style={{ marginTop: 10 }} onPress={() => nav.navigate('TaskEditor', {})} />
    </Screen>
  );
}
