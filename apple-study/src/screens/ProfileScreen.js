import React, { useMemo, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme, T, shadow } from '../theme';
import { Screen, Card, IconBtn, Bar, Row, tap } from '../components/ui';
import Icon from '../components/Icon';
import Apple from '../components/Apple';
import { useStore, APPLE_COLORS } from '../store';
import { computeStats, moodOf, moodMessage, levelTitle } from '../logic';
import { dur } from '../utils/date';

export const ACCESSORIES = [
  { k: '', e: '🚫', label: 'None' },
  { k: 'glasses', e: '👓', label: 'Glasses' },
  { k: 'grad', e: '🎓', label: 'Grad cap' },
  { k: 'headphones', e: '🎧', label: 'Headphones' },
  { k: 'bow', e: '🎀', label: 'Bow' },
  { k: 'cap', e: '🧢', label: 'Cap' },
  { k: 'crown', e: '👑', label: 'Crown', level: 5 },
];

const MOOD_GUIDE = [
  ['excited', '🤩', 'Dancing', '4+ things done or 2h focused today'],
  ['happy', '😊', 'Happy', 'You finished something today'],
  ['neutral', '🙂', 'Ready', 'Morning, nothing done yet'],
  ['sad', '🥺', 'Sad', 'No study yet in the afternoon / overdue tasks'],
  ['sleepy', '😴', 'Sleepy', 'No activity for 2+ days'],
];

export default function ProfileScreen() {
  const c = useTheme();
  const nav = useNavigation();
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const setSettings = useStore((s) => s.setSettings);
  const tasks = useStore((s) => s.tasks);
  const todos = useStore((s) => s.todos);
  const sessions = useStore((s) => s.sessions);
  const [preview, setPreview] = useState(null);

  const st = useMemo(() => computeStats({ tasks, todos, sessions }), [tasks, todos, sessions]);
  const realMood = moodOf(st);
  const mood = preview || realMood;
  const msg = moodMessage(mood, profile.buddyName, st);
  const sad = mood === 'sad' || mood === 'sleepy';

  return (
    <Screen scroll>
      <Row between style={{ marginTop: 6 }}>
        <T w={700} size={24}>
          Profile
        </T>
        <Row gap={10}>
          <IconBtn name={c.dark ? 'sun' : 'moon'} onPress={() => setSettings({ mode: c.dark ? 'light' : 'dark' })} />
          <IconBtn name="settings" onPress={() => nav.navigate('Settings')} />
        </Row>
      </Row>

      <View style={{ marginTop: 12, borderRadius: 30, overflow: 'hidden' }}>
        <LinearGradient
          colors={sad ? (c.dark ? ['#2a2433', c.card] : ['#E4E6F2', c.bg]) : c.dark ? ['#3a2430', c.card] : [c.soft, c.bg]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ height: 280, alignItems: 'center', justifyContent: 'center' }}
        >
          {sad ? (
            <>
              <T size={24} style={{ position: 'absolute', top: 18, left: 30, opacity: 0.6 }}>☁️</T>
              <T size={16} style={{ position: 'absolute', top: 36, right: 44, opacity: 0.5 }}>💧</T>
            </>
          ) : (
            <>
              <T size={18} style={{ position: 'absolute', top: 22, left: 34 }}>✨</T>
              <T size={22} style={{ position: 'absolute', top: 40, right: 40 }}>💖</T>
              <T size={14} style={{ position: 'absolute', bottom: 74, left: 40 }}>⭐</T>
            </>
          )}
          <Apple mood={mood} size={176} color={profile.color} accessory={profile.accessory} />
          <View style={[{ backgroundColor: c.card, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, marginTop: -4 }, shadow(c)]}>
            <T w={600} size={13}>
              {msg.bubble}
            </T>
          </View>
        </LinearGradient>
      </View>

      <Pressable onPress={() => nav.navigate('EditNames')} style={{ alignSelf: 'center', marginTop: 12 }} hitSlop={8}>
        <Row gap={8}>
          <T w={700} size={20}>
            {profile.buddyName}
          </T>
          <Icon name="edit" size={15} color={c.muted} />
          <View style={{ backgroundColor: c.soft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
            <T w={600} size={11} color={c.p}>
              Lv {st.level} · {levelTitle(st.level)}
            </T>
          </View>
        </Row>
      </Pressable>
      <T size={12} muted center style={{ marginTop: 2 }}>
        {profile.userName}’s study buddy · {st.xp} XP
      </T>
      <View style={{ marginTop: 8, paddingHorizontal: 40 }}>
        <Bar value={st.levelProgress} />
        <T size={10} muted center style={{ marginTop: 4 }}>
          {200 - (st.xp % 200)} XP to level {st.level + 1}
        </T>
      </View>

      <Row gap={10} style={{ marginTop: 14 }}>
        {[
          ['🔥', `${st.streak}`, 'day streak'],
          ['⏱️', dur(st.monthMinutes), 'this month'],
          ['🏆', `${st.totalCompletions}`, 'tasks done'],
        ].map(([e, v, l]) => (
          <Card key={l} style={{ flex: 1, padding: 10, alignItems: 'center' }}>
            <T size={18}>{e}</T>
            <T w={700} size={15}>
              {v}
            </T>
            <T size={10} muted>
              {l}
            </T>
          </Card>
        ))}
      </Row>

      <T w={700} size={16} style={{ marginTop: 20 }}>
        Customize
      </T>
      <T w={600} size={11} muted style={{ marginTop: 10, letterSpacing: 0.6 }}>
        COLOUR
      </T>
      <Row gap={12} style={{ marginTop: 8 }}>
        {Object.entries(APPLE_COLORS).map(([k, v]) => (
          <Pressable
            key={k}
            onPress={() => {
              tap();
              setProfile({ color: k });
            }}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: v, borderWidth: profile.color === k ? 3 : 0, borderColor: c.text }}
          />
        ))}
      </Row>
      <T w={600} size={11} muted style={{ marginTop: 14, letterSpacing: 0.6 }}>
        ACCESSORY
      </T>
      <Row gap={10} style={{ marginTop: 8, flexWrap: 'wrap' }}>
        {ACCESSORIES.map((a) => {
          const locked = a.level && st.level < a.level;
          const on = (profile.accessory || '') === a.k;
          return (
            <Pressable
              key={a.label}
              onPress={() => {
                if (locked) return Alert.alert('Locked 🔒', `Reach level ${a.level} to unlock the ${a.label}!`);
                tap();
                setProfile({ accessory: a.k });
              }}
              style={[
                { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.soft : c.card, borderWidth: 2, borderColor: on ? c.p : 'transparent', opacity: locked ? 0.45 : 1 },
                shadow(c),
              ]}
            >
              <T size={20}>{locked ? '🔒' : a.e}</T>
            </Pressable>
          );
        })}
      </Row>

      <T w={700} size={16} style={{ marginTop: 22 }}>
        How {profile.buddyName} feels
      </T>
      <T size={11} muted>
        Tap a mood to preview it
      </T>
      <Card style={{ marginTop: 10, paddingVertical: 4, paddingHorizontal: 14 }}>
        {MOOD_GUIDE.map(([k, e, l, d], i) => (
          <Pressable
            key={k}
            onPress={() => setPreview(preview === k ? null : k)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: i < MOOD_GUIDE.length - 1 ? 1 : 0, borderBottomColor: c.line }}
          >
            <T size={20}>{e}</T>
            <View style={{ flex: 1 }}>
              <T w={600} size={13} color={k === realMood ? c.p : c.text}>
                {l}
                {k === realMood ? '  ← now' : ''}
              </T>
              <T size={11} muted>
                {d}
              </T>
            </View>
            {preview === k && <Icon name="eye" size={16} color={c.p} />}
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}
