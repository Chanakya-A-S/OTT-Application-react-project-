import React, { useMemo, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme, T, shadow } from '../theme';
import { Screen, Card, IconBtn, Bar, Row, Segmented, Btn, tap } from '../components/ui';
import Icon from '../components/Icon';
import Apple, { AppleSvg } from '../components/Apple';
import { useStore, APPLE_COLORS } from '../store';
import { computeStats, moodOf, moodMessage, levelTitle } from '../logic';
import { dur } from '../utils/date';

// Wardrobe: head items and face items can be combined. `level` = unlock level.
export const WARDROBE = {
  head: [
    { k: '', e: '🚫', label: 'None' },
    { k: 'cap', e: '🧢', label: 'Cap' },
    { k: 'bow', e: '🎀', label: 'Bow' },
    { k: 'headphones', e: '🎧', label: 'Headphones' },
    { k: 'grad', e: '🎓', label: 'Grad cap', level: 2 },
    { k: 'flower', e: '🌸', label: 'Flowers', level: 2 },
    { k: 'beanie', e: '🧶', label: 'Beanie', level: 3 },
    { k: 'star', e: '⭐', label: 'Star clip', level: 4 },
    { k: 'crown', e: '👑', label: 'Crown', level: 5 },
    { k: 'halo', e: '😇', label: 'Halo', level: 7 },
  ],
  face: [
    { k: '', e: '🚫', label: 'None' },
    { k: 'glasses', e: '👓', label: 'Glasses' },
    { k: 'sunglasses', e: '🕶️', label: 'Shades', level: 3 },
  ],
};


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
  const [slot, setSlot] = useState('head');

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
          <Apple mood={mood} size={176} color={profile.color} accessory={profile.accessory} face={profile.face} />
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
      <Row between style={{ marginTop: 16 }}>
        <T w={600} size={11} muted style={{ letterSpacing: 0.6 }}>
          WARDROBE
        </T>
        <T w={600} size={11} color={c.p}>
          {[...WARDROBE.head, ...WARDROBE.face].filter((a) => a.k && !(a.level > st.level)).length}/
          {WARDROBE.head.length + WARDROBE.face.length - 2} unlocked
        </T>
      </Row>
      <Segmented
        style={{ marginTop: 8 }}
        value={slot}
        onChange={setSlot}
        options={[
          { value: 'head', label: '🎩 Head' },
          { value: 'face', label: '👓 Face' },
        ]}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginTop: 12 }}>
        {WARDROBE[slot].map((a) => {
          const locked = a.level > st.level;
          const key = slot === 'head' ? 'accessory' : 'face';
          const on = (profile[key] || '') === a.k;
          return (
            <Pressable
              key={a.label}
              onPress={() => {
                if (locked) return Alert.alert('Locked 🔒', `Reach level ${a.level} to unlock the ${a.label}! Finish tasks and focus sessions to earn XP.`);
                tap();
                setProfile({ [key]: a.k });
              }}
              style={[
                { width: '31.5%', borderRadius: 18, paddingTop: 8, paddingBottom: 8, alignItems: 'center', backgroundColor: on ? c.soft : c.card, borderWidth: 2, borderColor: on ? c.p : 'transparent' },
                shadow(c),
              ]}
            >
              <View style={{ opacity: locked ? 0.35 : 1 }}>
                <AppleSvg
                  mood="happy"
                  size={70}
                  color={profile.color}
                  accessory={slot === 'head' ? a.k : profile.accessory}
                  face={slot === 'face' ? a.k : profile.face}
                />
              </View>
              {locked && (
                <View style={{ position: 'absolute', top: 26, alignSelf: 'center', backgroundColor: c.dark ? '#000a' : '#2A1A1Dcc', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <T w={700} size={11} color="#fff">
                    🔒 Lv {a.level}
                  </T>
                </View>
              )}
              <T w={600} size={11} color={on ? c.p : locked ? c.muted : c.text} style={{ marginTop: 2 }}>
                {a.e} {a.label}
              </T>
              {on && (
                <View style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: c.p, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={11} color="#fff" width={3.2} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      <Btn
        small
        outline
        title="🎲 Surprise me — random outfit"
        style={{ marginTop: 12 }}
        onPress={() => {
          const pick = (list) => {
            const ok = list.filter((a) => !(a.level > st.level));
            return ok[Math.floor(Math.random() * ok.length)].k;
          };
          const colors = Object.keys(APPLE_COLORS);
          setProfile({ accessory: pick(WARDROBE.head), face: pick(WARDROBE.face), color: colors[Math.floor(Math.random() * colors.length)] });
        }}
      />

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
