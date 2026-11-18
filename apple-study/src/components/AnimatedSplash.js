import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, T } from '../theme';

/** Opening animation: apple drops & bounces, wiggles, rings ripple out, title slides in, then everything fades. */
export default function AnimatedSplash({ onDone }) {
  const c = useTheme();
  const drop = useRef(new Animated.Value(0)).current;
  const wiggle = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const title = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;
  const sparkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(sparkle, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    ).start();
    Animated.sequence([
      Animated.spring(drop, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(ring, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(wiggle, { toValue: 1, duration: 110, useNativeDriver: true }),
          Animated.timing(wiggle, { toValue: -1, duration: 160, useNativeDriver: true }),
          Animated.timing(wiggle, { toValue: 0.6, duration: 140, useNativeDriver: true }),
          Animated.timing(wiggle, { toValue: 0, duration: 140, useNativeDriver: true }),
        ]),
        Animated.timing(title, { toValue: 1, duration: 600, delay: 150, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(bar, { toValue: 1, duration: 1100, useNativeDriver: false }),
      ]),
      Animated.delay(200),
      Animated.timing(out, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start(() => onDone && onDone());
  }, [drop, wiggle, ring, title, bar, out, sparkle, onDone]);

  const ringStyle = (k, size) => ({
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 2,
    borderColor: c.dark ? '#5a2f3a' : '#F6C6BE',
    opacity: ring.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.9 / k, 0.5 / k] }),
    transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: out, zIndex: 100 }]}>
      <LinearGradient colors={c.dark ? ['#2a1520', '#141016'] : ['#FFE3DC', '#FFF6F2']} style={StyleSheet.absoluteFill} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', justifyContent: 'center', width: 320, height: 320 }}>
          <Animated.View style={ringStyle(1, 250)} />
          <Animated.View style={ringStyle(2, 320)} />
          <Animated.View
            style={{
              transform: [
                { translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-420, 0] }) },
                { scale: drop.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.5, 1.08, 1] }) },
                { rotate: wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] }) },
              ],
            }}
          >
            <Image source={require('../../assets/logo.png')} style={{ width: 170, height: 170 }} resizeMode="contain" />
          </Animated.View>
          <Animated.Text style={{ position: 'absolute', top: 40, right: 60, fontSize: 24, opacity: sparkle }}>✨</Animated.Text>
          <Animated.Text
            style={{ position: 'absolute', bottom: 70, left: 58, fontSize: 18, opacity: sparkle.interpolate({ inputRange: [0, 1], outputRange: [1, 0.2] }) }}
          >
            ✨
          </Animated.Text>
        </View>
        <Animated.View
          style={{ alignItems: 'center', opacity: title, transform: [{ translateY: title.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}
        >
          <T w={800} size={32} style={{ letterSpacing: 1 }}>
            APPLE<T w={800} size={32} color={c.p}>·</T>STUDY
          </T>
          <T w={500} size={14} muted>
            Grow a little smarter every day 🌱
          </T>
        </Animated.View>
        <View style={{ width: 120, height: 6, borderRadius: 3, backgroundColor: c.line, marginTop: 34, overflow: 'hidden' }}>
          <Animated.View style={{ height: 6, backgroundColor: c.p, width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
        </View>
      </View>
    </Animated.View>
  );
}
