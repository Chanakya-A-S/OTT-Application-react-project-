import React, { useState } from 'react';
import { View, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, T } from '../theme';
import { Btn, Field, Label, Chip, Row } from '../components/ui';
import Apple from '../components/Apple';
import { useStore, live, APPLE_COLORS } from '../store';
import { dateKey, nowMin, uid } from '../utils/date';
import { ensurePermission } from '../notifications';

export const BUDDY_IDEAS = ['Appy', 'Pippin', 'Cherry', 'Mr. Crunch', 'Ruby'];

function seedExamples() {
  const s = useStore.getState();
  if (live(s.tasks).length || live(s.todos).length || live(s.notes).length) return;
  const today = dateKey();
  const base = Math.min(Math.max(Math.ceil(nowMin() / 60) * 60, 8 * 60), 20 * 60);
  s.upsert('tasks', { title: 'Revise chapter 1 notes', subjectId: 'maths', date: today, start: base, end: base + 60, priority: 'high', reminderMin: 10, repeat: 'none', completedDates: [], inTimesheet: true });
  s.upsert('tasks', { title: 'Practice 10 numericals', subjectId: 'physics', date: today, start: base + 90, end: base + 150, priority: 'medium', reminderMin: 10, repeat: 'none', completedDates: [], inTimesheet: true });
  s.upsert('todos', { text: 'Buy a new notebook', list: 'today', emoji: '🛒', done: false });
  s.upsert('todos', { text: 'Charge calculator', list: 'today', emoji: '🔋', done: false });
  s.upsert('notes', {
    title: 'Welcome to your notes 🍎',
    subjectId: null,
    pinned: true,
    blocks: [
      { id: uid(), type: 'text', text: 'Write anything here — formulas, summaries, ideas.' },
      { id: uid(), type: 'check', text: 'Tap the image button to add a photo of your textbook', done: false },
      { id: uid(), type: 'check', text: 'Pin important notes to keep them on top', done: true },
    ],
  });
}

export default function OnboardingScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const [name, setName] = useState(profile.userName || '');
  const [buddy, setBuddy] = useState(profile.buddyName || 'Appy');
  const [color, setColor] = useState(profile.color || 'red');

  const done = async () => {
    setProfile({ userName: name.trim() || 'Friend', buddyName: buddy.trim() || 'Appy', color, onboarded: true });
    seedExamples();
    await ensurePermission().catch(() => {});
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: insets.top + 30, paddingBottom: insets.bottom + 30 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center' }}>
          <Apple mood="excited" size={150} color={color} face="glasses" />
          <T w={700} size={24} center style={{ marginTop: 10 }}>
            Let’s get to know you!
          </T>
          <T size={13} muted center>
            Your study buddy grows happier as you make progress.
          </T>
        </View>
        <Label>YOUR NAME</Label>
        <Field icon="user" placeholder="e.g. Chan" value={name} onChangeText={setName} autoFocus />
        <Label>NAME YOUR BUDDY</Label>
        <Field icon="heart" placeholder="Appy" value={buddy} onChangeText={setBuddy} />
        <Row style={{ flexWrap: 'wrap', marginTop: 10 }} gap={8}>
          {BUDDY_IDEAS.map((n) => (
            <Chip key={n} label={n} small on={buddy === n} onPress={() => setBuddy(n)} />
          ))}
        </Row>
        <Label>BUDDY COLOUR</Label>
        <Row gap={12}>
          {Object.entries(APPLE_COLORS).map(([k, v]) => (
            <Chip key={k} label="" style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: v, borderWidth: color === k ? 3 : 0, borderColor: c.text, paddingHorizontal: 0 }} onPress={() => setColor(k)} />
          ))}
        </Row>
        <Btn title="Let’s study! 🍎" onPress={done} style={{ marginTop: 28 }} />
        <T size={11} muted center style={{ marginTop: 10 }}>
          We’ll add a couple of example tasks so you can see how it works.
        </T>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
