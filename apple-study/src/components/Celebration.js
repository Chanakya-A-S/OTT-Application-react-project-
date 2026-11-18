import React, { useEffect, useMemo, useRef } from 'react';
import { View, Animated, Easing, Dimensions, Modal, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme, T } from '../theme';
import { useStore } from '../store';
import { computeStats } from '../logic';
import Apple from './Apple';
import Icon from './Icon';
import { Btn } from './ui';

const { width: W, height: H } = Dimensions.get('window');
const COLORS = ['#E8434B', '#FFC93C', '#5B8DEF', '#3DBE8B', '#B36BE0', '#FF8A72', '#2EC4C4'];

export function Confetti({ count = 60, run }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.random() * W,
        drift: (Math.random() - 0.5) * 160,
        delay: Math.random() * 400,
        dur: 1700 + Math.random() * 1300,
        rot: Math.random() * 720 - 360,
        size: 6 + Math.random() * 8,
        round: i % 3 === 0,
        color: COLORS[i % COLORS.length],
        v: new Animated.Value(0),
      })),
    [count, run]
  );
  useEffect(() => {
    pieces.forEach((p) =>
      Animated.timing(p.v, { toValue: 1, duration: p.dur, delay: p.delay, easing: Easing.out(Easing.quad), useNativeDriver: true }).start()
    );
  }, [pieces]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: -20,
            width: p.size,
            height: p.round ? p.size : p.size * 1.8,
            borderRadius: p.round ? p.size : 2,
            backgroundColor: p.color,
            opacity: p.v.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, H * 0.95] }) },
              { translateX: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
              { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rot}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

/** Full-screen "Task complete!" party, driven by store.celebration. */
export default function Celebration() {
  const c = useTheme();
  const cel = useStore((s) => s.celebration);
  const clear = useStore((s) => s.clearCelebration);
  const profile = useStore((s) => s.profile);
  const animations = useStore((s) => s.settings.animations);
  const pop = useRef(new Animated.Value(0)).current;
  const check = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  const small = cel?.small;
  useEffect(() => {
    if (!cel) return;
    if (useStore.getState().settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (small || !animations) {
      const t = setTimeout(clear, small ? 1600 : 1200);
      if (small) {
        pop.setValue(0);
        Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: true }).start();
      }
      return () => clearTimeout(t);
    }
    pop.setValue(0);
    check.setValue(0);
    spin.setValue(0);
    Animated.parallel([
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
      Animated.sequence([Animated.delay(250), Animated.spring(check, { toValue: 1, friction: 4, useNativeDriver: true })]),
      Animated.sequence([
        Animated.delay(150),
        Animated.timing(spin, { toValue: 1, duration: 700, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      ]),
    ]).start();
  }, [cel, small, animations, clear, pop, check, spin]);

  if (!cel) return null;

  if (small || !animations) {
    return (
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 120 }]}>
        <Animated.View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: c.dark ? '#2A2230' : '#2A1A1D',
            paddingHorizontal: 18,
            paddingVertical: 12,
            borderRadius: 20,
            opacity: pop,
            transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
          }}
        >
          <T size={20}>{cel.kind === 'timer' ? '🍅' : '🎉'}</T>
          <T w={600} size={14} color="#fff">
            {cel.text || (cel.kind === 'task' ? `Task complete! +20 XP` : `Done! ${profile.buddyName} is happy · +5 XP`)}
          </T>
        </Animated.View>
      </View>
    );
  }

  const st = computeStats(useStore.getState());
  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={clear}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: c.dark ? 'rgba(10,6,10,0.88)' : 'rgba(255,246,242,0.92)' }]} onPress={clear} />
      <Confetti run={cel.at} />
      <View pointerEvents="box-none" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Animated.View
          style={{
            transform: [
              { scale: pop },
              { translateY: spin.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -60, 0] }) },
              { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
            ],
          }}
        >
          <Apple mood="excited" size={190} accessory="grad" color={profile.color} interactive={false} />
        </Animated.View>
        <Animated.View
          style={{
            position: 'absolute',
            top: '42%',
            right: '24%',
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#3DBE8B',
            borderWidth: 5,
            borderColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: check }],
          }}
        >
          <Icon name="check" size={26} color="#fff" width={3.4} />
        </Animated.View>
        <Animated.View style={{ alignItems: 'center', opacity: pop, marginTop: 10 }}>
          <T w={700} size={28}>
            Task complete!
          </T>
          <T w={500} size={14} muted center numberOfLines={2} style={{ marginTop: 2 }}>
            {cel.title} ✓{'\n'}+20 XP · {profile.buddyName} is dancing 💃
          </T>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            <View style={{ backgroundColor: c.card, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 }}>
              <T w={600} size={13}>🔥 Streak {st.streak} day{st.streak === 1 ? '' : 's'}</T>
            </View>
            <View style={{ backgroundColor: c.card, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 }}>
              <T w={600} size={13}>⭐ {st.doneToday}/{st.total} today</T>
            </View>
          </View>
          <Btn title="Yay! Keep going →" onPress={clear} style={{ marginTop: 24, width: 230 }} />
        </Animated.View>
      </View>
    </Modal>
  );
}
