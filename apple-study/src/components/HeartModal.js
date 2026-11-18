import React, { useEffect, useMemo, useRef } from 'react';
import { View, Animated, Easing, Dimensions, Modal, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { T } from '../theme';
import { useStore } from '../store';
import Apple from './Apple';
import { Btn } from './ui';

const { width: W, height: H } = Dimensions.get('window');

function FloatingHearts({ run }) {
  const hearts = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        x: Math.random() * (W - 30),
        size: 14 + Math.random() * 26,
        delay: Math.random() * 2200,
        dur: 3200 + Math.random() * 2600,
        sway: (Math.random() - 0.5) * 70,
        e: ['❤️', '💗', '💖', '💕'][i % 4],
        v: new Animated.Value(0),
      })),
    [run]
  );
  useEffect(() => {
    const anims = hearts.map((h) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(h.delay),
          Animated.timing(h.v, { toValue: 1, duration: h.dur, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(h.v, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [hearts]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {hearts.map((h, i) => (
        <Animated.Text
          key={i}
          style={{
            position: 'absolute',
            left: h.x,
            top: H,
            fontSize: h.size,
            opacity: h.v.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 0.9, 0.7, 0] }),
            transform: [
              { translateY: h.v.interpolate({ inputRange: [0, 1], outputRange: [0, -H - 60] }) },
              { translateX: h.v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, h.sway, 0] }) },
              { scale: h.v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1.1, 0.9] }) },
            ],
          }}
        >
          {h.e}
        </Animated.Text>
      ))}
    </View>
  );
}

/** The ❤️ surprise: "Chan ❤️ Subha" */
export default function HeartModal({ visible, onClose }) {
  const color = useStore((s) => s.profile.color);
  const pop = useRef(new Animated.Value(0)).current;
  const beat = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }).start();
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(beat, { toValue: 1.3, duration: 180, useNativeDriver: true }),
        Animated.timing(beat, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(beat, { toValue: 1.2, duration: 160, useNativeDriver: true }),
        Animated.timing(beat, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    b.start();
    return () => b.stop();
  }, [visible, pop, beat]);

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <LinearGradient colors={['#FFD6DE', '#FFE9E3', '#FFF6F2']} style={StyleSheet.absoluteFill} />
      <FloatingHearts run={visible} />
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View pointerEvents="box-none" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={{
            backgroundColor: '#fff',
            borderRadius: 34,
            paddingVertical: 30,
            paddingHorizontal: 22,
            width: 300,
            alignItems: 'center',
            elevation: 14,
            shadowColor: '#E8435A',
            shadowOpacity: 0.3,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 16 },
            opacity: pop,
            transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
          }}
        >
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Apple mood="happy" size={92} color={color} interactive={false} />
            <Apple mood="happy" size={92} accessory="bow" color="pink" interactive={false} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <T w={700} size={34} color="#2A1A1D">
              Chan
            </T>
            <Animated.Text style={{ fontSize: 36, transform: [{ scale: beat }] }}>❤️</Animated.Text>
            <T w={700} size={34} color="#2A1A1D">
              Subha
            </T>
          </View>
          <T w={500} size={14} color="#9C8B8E" style={{ marginTop: 6 }}>
            Chan says! I Love You 💖
          </T>
          <Btn title="Aww, close 💕" onPress={onClose} style={{ marginTop: 20, width: 200 }} />
        </Animated.View>
      </View>
    </Modal>
  );
}
