import React, { useMemo, useRef, useState } from 'react';
import { View, Pressable, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, T, shadow } from '../theme';
import { Screen, Card, IconBtn, Grad, Bar, Row, CheckBox, tap } from '../components/ui';
import Icon from '../components/Icon';
import Apple from '../components/Apple';
import HeartModal from '../components/HeartModal';
import { useStore, live, subjectOf } from '../store';
import { computeStats, moodOf, moodMessage, isDone, dailyQuote } from '../logic';
import { upcomingExams, daysLeftLabel } from './ExamsScreen';
import { longDate, hm, dur, nowMin } from '../utils/date';

function HeartButton({ onPress }) {
  const s = useRef(new Animated.Value(1)).current;
  const press = () => {
    tap();
    Animated.sequence([
      Animated.timing(s, { toValue: 1.35, duration: 120, useNativeDriver: true }),
      Animated.spring(s, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    setTimeout(onPress, 160);
  };
  return (
    <Pressable onPress={press} hitSlop={6}>
      <Animated.View style={{ transform: [{ scale: s }] }}>
        <Grad colors={['#FF5A7A', '#FF8E8E']} style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', elevation: 4 }}>
          <Icon name="heart" size={20} color="#fff" fill="#fff" width={2} />
        </Grad>
      </Animated.View>
    </Pressable>
  );
}

const Stat = ({ emoji, label, value }) => (
  <Row gap={8} style={{ flex: 1, justifyContent: 'center' }}>
    <T size={20}>{emoji}</T>
    <View>
      <T w={500} size={11} muted>
        {label}
      </T>
      <T w={700} size={14}>
        {value}
      </T>
    </View>
  </Row>
);

export default function HomeScreen() {
  const c = useTheme();
  const nav = useNavigation();
  const [heart, setHeart] = useState(false);
  const tasks = useStore((s) => s.tasks);
  const todos = useStore((s) => s.todos);
  const sessions = useStore((s) => s.sessions);
  const subjects = useStore((s) => s.subjects);
  const profile = useStore((s) => s.profile);
  const toggleTask = useStore((s) => s.toggleTask);
  const exams = useStore((s) => s.exams);
  const nextExams = useMemo(() => upcomingExams(exams), [exams]);

  const st = useMemo(() => computeStats({ tasks, todos, sessions }), [tasks, todos, sessions]);
  const mood = moodOf(st);
  const msg = moodMessage(mood, profile.buddyName, st);
  const pending = st.todays.filter((t) => !isDone(t, st.today));
  const todosLeft = live(todos).filter((t) => !t.done && t.list === 'today').length;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const first = pending[0];
  const second = pending[1];
  const now = nowMin();
  const when = (t) => {
    if (t.start == null) return 'Today';
    if (t.start <= now && (t.end ?? t.start + 60) > now) return 'Now';
    if (t.start > now) return `in ${dur(t.start - now)}`;
    return 'Overdue';
  };

  return (
    <Screen scroll>
      <Row between style={{ marginTop: 6 }}>
        <View style={{ flex: 1 }}>
          <T w={500} size={12} muted>
            {longDate()} · {greet}
          </T>
          <T w={700} size={24} numberOfLines={1}>
            Hey, {profile.userName || 'friend'} 👋
          </T>
        </View>
        <Row gap={10}>
          <HeartButton onPress={() => setHeart(true)} />
          <IconBtn name="bell" onPress={() => nav.navigate('Reminders')} badge={pending.length > 0} />
        </Row>
      </Row>

      <Card style={{ flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 8, marginTop: 16 }}>
        <Stat emoji="⏱️" label="studied" value={dur(st.minutesToday)} />
        <Stat emoji="✅" label="tasks" value={`${st.doneToday} / ${st.total}`} />
        <Stat emoji="🔥" label="streak" value={`${st.streak} day${st.streak === 1 ? '' : 's'}`} />
      </Card>

      <Pressable onPress={() => nav.navigate('Profile')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, padding: 12, paddingRight: 16, borderRadius: 22, backgroundColor: c.soft }}>
          <Apple mood={mood} size={64} color={profile.color} accessory={profile.accessory} face={profile.face} />
          <View style={{ flex: 1 }}>
            <T w={700} size={15}>
              {msg.title}
            </T>
            <T w={500} size={11} muted>
              {msg.sub}
            </T>
            <View style={{ marginTop: 8 }}>
              <Bar value={st.total ? st.doneToday / st.total : 0} bg={c.dark ? c.line : '#fff'} />
            </View>
          </View>
        </View>
      </Pressable>

      {nextExams.length > 0 && (
        <Pressable onPress={() => nav.navigate('Exams')}>
          <View style={[{ marginTop: 14, borderRadius: 20, backgroundColor: c.card, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }, shadow(c)]}>
            <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: nextExams[0].left <= 3 ? c.p : c.soft, alignItems: 'center', justifyContent: 'center' }}>
              <T w={800} size={18} color={nextExams[0].left <= 3 ? '#fff' : c.p}>
                {nextExams[0].left === 0 ? '🔥' : nextExams[0].left}
              </T>
            </View>
            <View style={{ flex: 1 }}>
              <T w={500} size={11} muted>
                📅 Next exam{nextExams.length > 1 ? ` · +${nextExams.length - 1} more` : ''}
              </T>
              <T w={700} size={14} numberOfLines={1}>
                {nextExams[0].title}
              </T>
              <T w={600} size={11} color={c.p}>
                {daysLeftLabel(nextExams[0].left)}
                {nextExams[0].left > 1 ? ' to go' : ''}
              </T>
            </View>
            <Icon name="chev" size={18} color={c.muted} />
          </View>
        </Pressable>
      )}

      <Row between style={{ marginTop: 20 }}>
        <Row gap={8}>
          <T w={700} size={17}>
            Up next
          </T>
          <View style={{ backgroundColor: c.p, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 1 }}>
            <T w={700} size={12} color="#fff">
              {pending.length}
            </T>
          </View>
        </Row>
        <Pressable onPress={() => nav.navigate('Tasks')} hitSlop={8}>
          <T w={600} size={13} color={c.p}>
            See all
          </T>
        </Pressable>
      </Row>

      {first ? (
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <Pressable style={{ flex: 1 }} onPress={() => nav.navigate('TaskEditor', { id: first.id })}>
            <Grad style={[{ borderRadius: 24, padding: 16, height: 178 }, shadow(c, true)]}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                <T size={18}>{subjectOf(subjects, first.subjectId).emoji}</T>
              </View>
              <T w={700} size={15} color="#fff" style={{ marginTop: 10 }} numberOfLines={1}>
                {subjectOf(subjects, first.subjectId).name}
              </T>
              <T w={500} size={11} color="#fff" style={{ opacity: 0.92 }} numberOfLines={2}>
                • {first.title}
              </T>
              {first.start != null && (
                <T w={500} size={11} color="#fff" style={{ opacity: 0.92 }}>
                  • {hm(first.start)}
                  {first.end != null ? ` – ${hm(first.end)}` : ''}
                </T>
              )}
              <Row between style={{ position: 'absolute', left: 16, right: 16, bottom: 14 }}>
                <T w={700} size={12} color="#fff">
                  {when(first)}
                </T>
                <Pressable
                  onPress={() => nav.navigate('Timer', { taskId: first.id, subjectId: first.subjectId })}
                  hitSlop={10}
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name="play" size={14} color={c.p} fill={c.p} />
                </Pressable>
              </Row>
            </Grad>
          </Pressable>
          {second ? (
            <Card style={{ flex: 1, padding: 16, height: 178 }} onPress={() => nav.navigate('TaskEditor', { id: second.id })}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: subjectOf(subjects, second.subjectId).color + '22', alignItems: 'center', justifyContent: 'center' }}>
                <T size={18}>{subjectOf(subjects, second.subjectId).emoji}</T>
              </View>
              <T w={700} size={15} style={{ marginTop: 10 }} numberOfLines={1}>
                {subjectOf(subjects, second.subjectId).name}
              </T>
              <T w={500} size={11} muted numberOfLines={2}>
                {second.title}
              </T>
              {second.start != null && (
                <T w={500} size={11} muted>
                  {hm(second.start)}
                  {second.end != null ? ` – ${hm(second.end)}` : ''}
                </T>
              )}
              <Row between style={{ position: 'absolute', left: 16, right: 16, bottom: 14 }}>
                <T w={600} size={12} muted>
                  {when(second)}
                </T>
                <CheckBox done={false} onPress={() => toggleTask(second, st.today)} />
              </Row>
            </Card>
          ) : (
            <Card style={{ flex: 1, padding: 16, height: 178, alignItems: 'center', justifyContent: 'center' }} onPress={() => nav.navigate('TaskEditor', {})}>
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="plus" size={22} color={c.p} width={2.6} />
              </View>
              <T w={600} size={13} style={{ marginTop: 8 }}>
                Add task
              </T>
            </Card>
          )}
        </View>
      ) : (
        <Card style={{ marginTop: 12, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }} onPress={() => nav.navigate('TaskEditor', {})}>
          <T size={34}>{st.total ? '🎉' : '📝'}</T>
          <View style={{ flex: 1 }}>
            <T w={700} size={15}>
              {st.total ? 'All done for today!' : 'Nothing planned yet'}
            </T>
            <T size={12} muted>
              {st.total ? `${profile.buddyName} is so proud. Add more?` : 'Tap to plan what to study and when.'}
            </T>
          </View>
          <Icon name="plus" size={22} color={c.p} />
        </Card>
      )}

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        <Card style={{ flex: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => nav.navigate('Todo')}>
          <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#3DBE8B22', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="list" size={18} color="#3DBE8B" />
          </View>
          <View>
            <T w={700} size={14}>
              To-do
            </T>
            <T size={11} muted>
              {todosLeft} left
            </T>
          </View>
        </Card>
        <Card style={{ flex: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => nav.navigate('Timesheet')}>
          <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#5B8DEF22', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="cal" size={18} color="#5B8DEF" />
          </View>
          <View>
            <T w={700} size={14}>
              Timesheet
            </T>
            <T size={11} muted>
              24h plan
            </T>
          </View>
        </Card>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        <Card style={{ flex: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => nav.navigate('Stats')}>
          <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#9B7BEA22', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chart" size={18} color="#9B7BEA" />
          </View>
          <View>
            <T w={700} size={14}>
              Stats
            </T>
            <T size={11} muted>
              your week
            </T>
          </View>
        </Card>
        <Card style={{ flex: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => nav.navigate('Exams')}>
          <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#F5A62322', alignItems: 'center', justifyContent: 'center' }}>
            <T size={18}>📅</T>
          </View>
          <View>
            <T w={700} size={14}>
              Exams
            </T>
            <T size={11} muted>
              {nextExams.length ? `${nextExams.length} upcoming` : 'add dates'}
            </T>
          </View>
        </Card>
      </View>

      <View style={{ marginTop: 16, padding: 16, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.line }}>
        <T w={600} size={11} color={c.p} style={{ letterSpacing: 0.6 }}>
          💬 {profile.buddyName.toUpperCase()} SAYS
        </T>
        <T w={500} size={14} style={{ marginTop: 4, lineHeight: 21 }}>
          {dailyQuote()}
        </T>
      </View>

      <HeartModal visible={heart} onClose={() => setHeart(false)} />
    </Screen>
  );
}
