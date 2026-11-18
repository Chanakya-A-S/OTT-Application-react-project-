import React, { useEffect, useRef } from 'react';
import { View, Pressable, TextInput, Animated, KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme, T, shadow, FONTS } from '../theme';
import Icon from './Icon';
import { useStore } from '../store';

export const tap = () => {
  if (useStore.getState().settings.haptics) Haptics.selectionAsync().catch(() => {});
};

export function Screen({ children, scroll, pad = true, contentStyle, bottomSpace = 110, refScroll }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const inner = { paddingTop: insets.top + 6, paddingHorizontal: pad ? 20 : 0 };
  if (scroll)
    return (
      <ScrollView
        ref={refScroll}
        style={{ flex: 1, backgroundColor: c.bg }}
        contentContainerStyle={[inner, { paddingBottom: bottomSpace + insets.bottom }, contentStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  return <View style={[{ flex: 1, backgroundColor: c.bg }, inner, contentStyle]}>{children}</View>;
}

export function Card({ children, style, onPress, onLongPress, flat }) {
  const c = useTheme();
  const s = [{ backgroundColor: c.card, borderRadius: 22 }, !flat && shadow(c), style];
  if (onPress || onLongPress)
    return (
      <Pressable onPress={onPress} onLongPress={onLongPress} style={({ pressed }) => [s, pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] }]}>
        {children}
      </Pressable>
    );
  return <View style={s}>{children}</View>;
}

export function Grad({ children, style, colors, start = { x: 0, y: 0 }, end = { x: 1, y: 1 } }) {
  const c = useTheme();
  return (
    <LinearGradient colors={colors || [c.p, c.p2]} start={start} end={end} style={style}>
      {children}
    </LinearGradient>
  );
}

export function Btn({ title, onPress, icon, style, outline, small, disabled, loading }) {
  const c = useTheme();
  const h = small ? 44 : 54;
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: h }}>
      {icon && <Icon name={icon} size={18} color={outline ? c.p : '#fff'} width={2.4} />}
      <T w={700} size={small ? 14 : 16} color={outline ? c.p : '#fff'}>
        {loading ? 'Please wait…' : title}
      </T>
    </View>
  );
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={() => {
        tap();
        onPress && onPress();
      }}
      style={({ pressed }) => [{ opacity: disabled ? 0.5 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}
    >
      {outline ? (
        <View style={{ borderRadius: 18, borderWidth: 2, borderColor: c.p, backgroundColor: c.card }}>{content}</View>
      ) : (
        <Grad style={[{ borderRadius: 18 }, shadow(c, true)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          {content}
        </Grad>
      )}
    </Pressable>
  );
}

export function IconBtn({ name, onPress, size = 42, color, bg, badge, iconSize = 20, fill }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress && onPress();
      }}
      hitSlop={6}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg || c.card, alignItems: 'center', justifyContent: 'center' },
        shadow(c),
        pressed && { transform: [{ scale: 0.92 }] },
      ]}
    >
      <Icon name={name} size={iconSize} color={color || c.text} fill={fill} />
      {badge ? <View style={{ position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: 5, backgroundColor: c.p, borderWidth: 2, borderColor: bg || c.card }} /> : null}
    </Pressable>
  );
}

export function Chip({ label, on, color, onPress, dot, style, onLongPress, small }) {
  const c = useTheme();
  const bg = on ? color || c.p : c.card;
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress && onPress();
      }}
      onLongPress={onLongPress}
      style={[
        { paddingHorizontal: small ? 11 : 14, height: small ? 32 : 38, borderRadius: 14, backgroundColor: bg, flexDirection: 'row', alignItems: 'center', gap: 6 },
        !on && shadow(c),
        style,
      ]}
    >
      {dot && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: on ? '#fff' : dot }} />}
      <T w={600} size={small ? 12 : 13} color={on ? '#fff' : c.text}>
        {label}
      </T>
    </Pressable>
  );
}

export function Toggle({ value, onChange }) {
  const c = useTheme();
  const x = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(x, { toValue: value ? 1 : 0, useNativeDriver: false, friction: 7 }).start();
  }, [value, x]);
  return (
    <Pressable
      onPress={() => {
        tap();
        onChange(!value);
      }}
      hitSlop={8}
    >
      <Animated.View
        style={{
          width: 46,
          height: 28,
          borderRadius: 14,
          padding: 3,
          backgroundColor: x.interpolate({ inputRange: [0, 1], outputRange: [c.line, c.p] }),
        }}
      >
        <Animated.View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: '#fff',
            elevation: 2,
            transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, 18] }) }],
          }}
        />
      </Animated.View>
    </Pressable>
  );
}

export function CheckBox({ done, onPress, round, size = 26 }) {
  const c = useTheme();
  const s = useRef(new Animated.Value(1)).current;
  const press = () => {
    Animated.sequence([
      Animated.timing(s, { toValue: 0.7, duration: 90, useNativeDriver: true }),
      Animated.spring(s, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }),
    ]).start();
    if (useStore.getState().settings.haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onPress && onPress();
  };
  return (
    <Pressable onPress={press} hitSlop={10}>
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: round ? size / 2 : 9,
          borderWidth: 2,
          borderColor: done ? c.success : c.line,
          backgroundColor: done ? c.success : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: s }],
        }}
      >
        {done && <Icon name="check" size={size * 0.58} color="#fff" width={3.2} />}
      </Animated.View>
    </Pressable>
  );
}

export function Field({ icon, style, inputStyle, multiline, right, ...props }) {
  const c = useTheme();
  return (
    <View
      style={[
        { backgroundColor: c.card, borderRadius: 16, paddingHorizontal: 14, minHeight: 50, flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center', gap: 10 },
        shadow(c),
        style,
      ]}
    >
      {icon && (
        <View style={{ paddingTop: multiline ? 14 : 0 }}>
          <Icon name={icon} size={18} color={c.muted} />
        </View>
      )}
      <TextInput
        placeholderTextColor={c.muted}
        multiline={multiline}
        style={[{ flex: 1, fontFamily: FONTS[500], fontSize: 14, color: c.text, paddingVertical: 12 }, inputStyle]}
        {...props}
      />
      {right}
    </View>
  );
}

export const Label = ({ children, style }) => (
  <T w={600} size={11} muted style={[{ letterSpacing: 0.8, marginTop: 16, marginBottom: 7 }, style]}>
    {children}
  </T>
);

export function Header({ title, right, back = true, onBack }) {
  const nav = useNavigation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 6 }}>
      {back ? <IconBtn name="back" onPress={onBack || (() => nav.goBack())} /> : <View style={{ width: 42 }} />}
      <T w={700} size={17}>
        {title}
      </T>
      {right || <View style={{ width: 42 }} />}
    </View>
  );
}

export function Bar({ value, color, bg, height = 8 }) {
  const c = useTheme();
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(w, { toValue: Math.max(0, Math.min(1, value || 0)), duration: 700, useNativeDriver: false }).start();
  }, [value, w]);
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: bg || c.line, overflow: 'hidden' }}>
      <Animated.View style={{ height, width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }}>
        {color ? (
          <View style={{ flex: 1, backgroundColor: color, borderRadius: height / 2 }} />
        ) : (
          <Grad style={{ flex: 1, borderRadius: height / 2 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        )}
      </Animated.View>
    </View>
  );
}

export function Segmented({ options, value, onChange, style }) {
  const c = useTheme();
  return (
    <View style={[{ flexDirection: 'row', backgroundColor: c.card, borderRadius: 18, padding: 5, gap: 4 }, shadow(c), style]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={{ flex: 1, paddingVertical: 9, borderRadius: 14, alignItems: 'center', backgroundColor: on ? c.soft : 'transparent' }}
          >
            <T w={600} size={12} color={on ? c.p : c.text} numberOfLines={1}>
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Bottom sheet chrome for screens presented as transparent modals. */
export function Sheet({ children, title, onClose, right, maxHeight = '92%' }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const close = onClose || (() => nav.goBack());
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]} onPress={close} />
      <View style={{ backgroundColor: c.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight, paddingBottom: insets.bottom + 12 }}>
        <View style={{ width: 42, height: 5, borderRadius: 3, backgroundColor: c.line, alignSelf: 'center', marginTop: 10 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 }}>
          <T w={700} size={18}>
            {title}
          </T>
          {right || (
            <Pressable onPress={close} hitSlop={10}>
              <T w={600} size={13} muted>
                Cancel
              </T>
            </Pressable>
          )}
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

export function Empty({ emoji = '🍎', title, sub }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 34, gap: 6 }}>
      <T size={42}>{emoji}</T>
      <T w={700} size={15} center>
        {title}
      </T>
      {sub ? (
        <T size={12} muted center style={{ maxWidth: 260 }}>
          {sub}
        </T>
      ) : null}
    </View>
  );
}

export const Row = ({ children, style, gap = 10, between }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap, justifyContent: between ? 'space-between' : undefined }, style]}>{children}</View>
);
