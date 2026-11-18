import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Ellipse, Path, Circle, G, Text as SvgText, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { APPLE_COLORS } from '../store';

let counter = 0;
const LIGHTER = { '#E8343E': '#FF6B6B', '#7BC043': '#B4E06A', '#F5B82E': '#FFE07A', '#B36BE0': '#D8A6FF', '#FF7AA8': '#FFB3CF' };
const DARKER = { '#E8343E': '#9E1626', '#7BC043': '#3F7A1C', '#F5B82E': '#B67A0C', '#B36BE0': '#6A2C99', '#FF7AA8': '#C23E70' };

function Eyes({ mood, blink }) {
  const brow = '#3B2218';
  const mouth = '#5A2A22';
  if (mood === 'excited')
    return (
      <G>
        <Path d="M66 112q12-16 24 0M110 112q12-16 24 0" stroke={brow} strokeWidth={5} fill="none" strokeLinecap="round" />
        <Path d="M84 132q16 2 32 0q-2 18-16 18t-16-18z" fill="#7A2430" />
        <Path d="M92 143q8 5 16 0" fill="#FF8A8A" />
        <Path d="M40 70l6 4M156 70l-6 4M150 52l-2 7M50 52l2 7" stroke="#FFD34E" strokeWidth={4} strokeLinecap="round" />
      </G>
    );
  if (mood === 'sleepy')
    return (
      <G>
        <Path d="M66 112q12 8 24 0M110 112q12 8 24 0" stroke={brow} strokeWidth={4.5} fill="none" strokeLinecap="round" />
        <Ellipse cx={100} cy={142} rx={6} ry={5} fill="#7A2430" />
        <SvgText x={146} y={70} fontSize={20} fontWeight="bold" fill="#9C8BB0">z</SvgText>
        <SvgText x={160} y={50} fontSize={15} fontWeight="bold" fill="#9C8BB0">z</SvgText>
      </G>
    );
  if (blink)
    return (
      <G>
        <Path d="M66 110q12 6 24 0M110 110q12 6 24 0" stroke={brow} strokeWidth={4.5} fill="none" strokeLinecap="round" />
        {mood === 'sad' ? (
          <Path d="M88 146q12-10 24 0" stroke={mouth} strokeWidth={4} fill="none" strokeLinecap="round" />
        ) : mood === 'neutral' ? (
          <Path d="M90 140h20" stroke={mouth} strokeWidth={4} strokeLinecap="round" />
        ) : (
          <Path d="M88 138q12 12 24 0" stroke={mouth} strokeWidth={4} fill="none" strokeLinecap="round" />
        )}
      </G>
    );
  if (mood === 'sad')
    return (
      <G>
        <Ellipse cx={78} cy={112} rx={12} ry={14} fill="#fff" />
        <Ellipse cx={122} cy={112} rx={12} ry={14} fill="#fff" />
        <Circle cx={78} cy={116} r={8} fill="#4A2A1E" />
        <Circle cx={122} cy={116} r={8} fill="#4A2A1E" />
        <Circle cx={80} cy={113} r={2.6} fill="#fff" />
        <Circle cx={124} cy={113} r={2.6} fill="#fff" />
        <Path d="M64 96q12-2 22-10M136 96q-12-2-22-10" stroke={brow} strokeWidth={4} fill="none" strokeLinecap="round" />
        <Path d="M88 146q12-10 24 0" stroke={mouth} strokeWidth={4} fill="none" strokeLinecap="round" />
        <Path d="M66 128q-4 8 0 12q4-4 0-12z" fill="#7EC8FF" />
      </G>
    );
  if (mood === 'neutral')
    return (
      <G>
        <Ellipse cx={78} cy={110} rx={11} ry={13} fill="#fff" />
        <Ellipse cx={122} cy={110} rx={11} ry={13} fill="#fff" />
        <Circle cx={78} cy={112} r={7} fill="#4A2A1E" />
        <Circle cx={122} cy={112} r={7} fill="#4A2A1E" />
        <Circle cx={80} cy={109} r={2.4} fill="#fff" />
        <Circle cx={124} cy={109} r={2.4} fill="#fff" />
        <Path d="M90 140h20" stroke={mouth} strokeWidth={4} strokeLinecap="round" />
      </G>
    );
  return (
    <G>
      <Ellipse cx={78} cy={108} rx={13} ry={15} fill="#fff" />
      <Ellipse cx={122} cy={108} rx={13} ry={15} fill="#fff" />
      <Circle cx={80} cy={110} r={9} fill="#4A2A1E" />
      <Circle cx={124} cy={110} r={9} fill="#4A2A1E" />
      <Circle cx={83} cy={106} r={3.2} fill="#fff" />
      <Circle cx={127} cy={106} r={3.2} fill="#fff" />
      <Path d="M64 88q12-8 26-2M110 86q14-6 26 2" stroke={brow} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Path d="M88 138q12 12 24 0" stroke={mouth} strokeWidth={4} fill="none" strokeLinecap="round" />
    </G>
  );
}

function starPath(cx, cy, R, r) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r : R;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    d += (i ? 'L' : 'M') + (cx + rad * Math.cos(a)).toFixed(1) + ' ' + (cy + rad * Math.sin(a)).toFixed(1);
  }
  return d + 'Z';
}

/** Items worn on the face; everything else goes on the head. */
export const FACE_ITEMS = ['glasses', 'sunglasses'];

function Accessory({ name }) {
  switch (name) {
    case 'glasses':
      return (
        <G fill="none" stroke="#2A1A1D" strokeWidth={4}>
          <Circle cx={78} cy={110} r={19} />
          <Circle cx={122} cy={110} r={19} />
          <Path d="M97 108h6M59 104l-14-4M141 104l14-4" />
        </G>
      );
    case 'grad':
      return (
        <G>
          <Path d="M100 18 46 38l54 20 54-20z" fill="#2A1A1D" />
          <Path d="M70 48v14q30 14 60 0V48l-30 11z" fill="#3A2A2D" />
          <Path d="M150 40v26" stroke="#FFC93C" strokeWidth={3} />
          <Circle cx={150} cy={68} r={5} fill="#FFC93C" />
        </G>
      );
    case 'headphones':
      return (
        <G>
          <Path d="M30 110q0-80 70-80t70 80" fill="none" stroke="#3A3F58" strokeWidth={9} />
          <Rect x={18} y={98} width={24} height={40} rx={11} fill="#5B8DEF" />
          <Rect x={158} y={98} width={24} height={40} rx={11} fill="#5B8DEF" />
        </G>
      );
    case 'bow':
      return (
        <G>
          <Path d="M118 40l-22 10 22 12zM146 40l22 10-22 12z" fill="#FF7AB6" />
          <Circle cx={132} cy={50} r={7} fill="#FF4F98" />
        </G>
      );
    case 'cap':
      return (
        <G>
          <Path d="M44 66q56-56 112 0z" fill="#3DBE8B" />
          <Path d="M150 62q30 0 36 10l-40 2z" fill="#2E9E72" />
        </G>
      );
    case 'crown':
      return (
        <G>
          <Path d="M66 56 60 22l22 18 18-26 18 26 22-18-6 34z" fill="#FFC93C" stroke="#E0A400" strokeWidth={3} strokeLinejoin="round" />
          <Circle cx={100} cy={40} r={4} fill="#E8434B" />
        </G>
      );
    case 'sunglasses':
      return (
        <G>
          <Rect x={54} y={96} width={42} height={28} rx={12} fill="#1E1A24" />
          <Rect x={104} y={96} width={42} height={28} rx={12} fill="#1E1A24" />
          <Path d="M96 105h8M54 104l-12-5M146 104l12-5" stroke="#1E1A24" strokeWidth={4} strokeLinecap="round" />
          <Path d="M62 103l12-2M112 103l12-2" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.55} />
        </G>
      );
    case 'beanie':
      return (
        <G>
          <Path d="M42 78Q44 24 100 22Q156 24 158 78Z" fill="#E86A92" />
          <Path d="M70 32v38M100 24v46M130 32v38" stroke="#D24F7A" strokeWidth={3} opacity={0.6} />
          <Rect x={36} y={64} width={128} height={22} rx={11} fill="#C93F6C" />
          <Circle cx={100} cy={18} r={13} fill="#FFF3F6" />
        </G>
      );
    case 'flower':
      return (
        <G>
          {[0, 72, 144, 216, 288].map((a) => (
            <Circle key={a} cx={60 + 10 * Math.cos((a * Math.PI) / 180)} cy={50 + 10 * Math.sin((a * Math.PI) / 180)} r={8} fill="#FF8FB8" />
          ))}
          <Circle cx={60} cy={50} r={6} fill="#FFD34E" />
          {[0, 90, 180, 270].map((a) => (
            <Circle key={'b' + a} cx={140 + 7 * Math.cos((a * Math.PI) / 180)} cy={56 + 7 * Math.sin((a * Math.PI) / 180)} r={5.5} fill="#B9A0FF" />
          ))}
          <Circle cx={140} cy={56} r={4} fill="#FFD34E" />
          <Path d="M44 64q18-10 34-12M122 58q12 2 30 10" stroke="#4CAF50" strokeWidth={3} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'star':
      return (
        <G>
          <Path d={starPath(146, 62, 16, 7)} fill="#FFC93C" stroke="#E0A400" strokeWidth={2} strokeLinejoin="round" />
          <Circle cx={141} cy={58} r={2.5} fill="#fff" opacity={0.8} />
        </G>
      );
    case 'halo':
      return (
        <G>
          <Ellipse cx={100} cy={16} rx={46} ry={10} fill="none" stroke="#FFE38A" strokeWidth={9} opacity={0.5} />
          <Ellipse cx={100} cy={16} rx={46} ry={10} fill="none" stroke="#FFC93C" strokeWidth={5} />
        </G>
      );
    default:
      return null;
  }
}

export function AppleSvg({ mood = 'happy', size = 120, accessory, face, color = 'red', blink }) {
  const idRef = useRef(null);
  if (idRef.current === null) idRef.current = 'ap' + counter++;
  const id = idRef.current;
  const base = APPLE_COLORS[color] || color || APPLE_COLORS.red;
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id={id} cx="35%" cy="30%" r="80%">
          <Stop offset="0" stopColor={LIGHTER[base] || '#FF6B6B'} />
          <Stop offset="0.55" stopColor={base} />
          <Stop offset="1" stopColor={DARKER[base] || '#9E1626'} />
        </RadialGradient>
        <RadialGradient id={id + 'f'} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFC9A8" stopOpacity={0.95} />
          <Stop offset="1" stopColor="#FFC9A8" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={100} cy={190} rx={56} ry={7} fill="#000" opacity={0.1} />
      <Path
        d="M100 56 C 70 34, 22 40, 22 98 C 22 152, 60 186, 82 184 C 92 183, 95 179, 100 179 C 105 179, 108 183, 118 184 C 140 186, 178 152, 178 98 C 178 40, 130 34, 100 56 Z"
        fill={`url(#${id})`}
      />
      <Ellipse cx={100} cy={122} rx={58} ry={52} fill={`url(#${id}f)`} />
      <Path d="M98 58q-2-22 8-34" stroke="#6B3A1F" strokeWidth={7} fill="none" strokeLinecap="round" />
      <Path d="M106 36q22-26 54-14q-18 30-54 14z" fill="#4CAF50" />
      <Path d="M108 35q22-8 46-12" stroke="#2E7D32" strokeWidth={2} fill="none" />
      <Ellipse cx={56} cy={78} rx={10} ry={18} fill="#fff" opacity={0.35} transform="rotate(25 56 78)" />
      <Ellipse cx={66} cy={132} rx={11} ry={6} fill="#FF6B7A" opacity={0.55} />
      <Ellipse cx={134} cy={132} rx={11} ry={6} fill="#FF6B7A" opacity={0.55} />
      <Eyes mood={mood} blink={blink} />
      <Accessory name={face} />
      <Accessory name={accessory} />
    </Svg>
  );
}

/** Animated buddy: idles according to mood, blinks, jumps when tapped. */
export default function Apple({ mood = 'happy', size = 120, accessory, face, color, animate = true, onPress, interactive = true }) {
  const loop = useRef(new Animated.Value(0)).current;
  const jump = useRef(new Animated.Value(0)).current;
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (!animate) return;
    const speed = { excited: 420, happy: 1100, neutral: 1500, sad: 2200, sleepy: 2600 }[mood] || 1400;
    loop.setValue(0);
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(loop, { toValue: 1, duration: speed, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(loop, { toValue: 0, duration: speed, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    a.start();
    return () => a.stop();
  }, [mood, animate, loop]);

  useEffect(() => {
    if (!animate || mood === 'sleepy' || mood === 'excited') return;
    let t;
    const tick = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        tick();
      }, 2600 + Math.random() * 2400);
    };
    tick();
    return () => clearTimeout(t);
  }, [mood, animate]);

  const amp = { excited: -14, happy: -6, neutral: -3, sad: 2, sleepy: 0 }[mood] ?? -4;
  const translateY = Animated.add(
    loop.interpolate({ inputRange: [0, 1], outputRange: [0, amp * (size / 120)] }),
    jump.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.28] })
  );
  const scaleY = loop.interpolate({ inputRange: [0, 1], outputRange: mood === 'sleepy' ? [1, 1.04] : [1, mood === 'excited' ? 0.97 : 1.015] });
  const rotate = loop.interpolate({
    inputRange: [0, 1],
    outputRange: mood === 'excited' ? ['-6deg', '6deg'] : mood === 'sad' ? ['-2deg', '2deg'] : ['0deg', '0deg'],
  });
  const spin = jump.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-10deg'] });

  const doJump = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.sequence([
      Animated.timing(jump, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(jump, { toValue: 0, friction: 3.5, tension: 120, useNativeDriver: true }),
    ]).start();
    onPress && onPress();
  };

  const body = (
    <Animated.View style={{ transform: [{ translateY }, { rotate }, { rotate: spin }, { scaleY }] }}>
      <AppleSvg mood={mood} size={size} accessory={accessory} face={face} color={color} blink={blink} />
    </Animated.View>
  );
  if (!interactive) return body;
  return (
    <Pressable onPress={doJump} hitSlop={6}>
      {body}
    </Pressable>
  );
}
