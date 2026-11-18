import React, { useEffect, useRef } from 'react';
import { View, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, T } from '../theme';
import Icon from './Icon';
import { tap } from './ui';

const META = { Home: 'home', Tasks: 'tasks', Timer: 'timer', Notes: 'notes', Profile: 'user' };

function Item({ route, focused, onPress }) {
  const c = useTheme();
  const s = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(s, { toValue: focused ? 1 : 0, friction: 6, useNativeDriver: true }).start();
  }, [focused, s]);
  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center', paddingTop: 10 }} hitSlop={4}>
      <Animated.View style={{ transform: [{ translateY: s.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }, { scale: s.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }}>
        <Icon name={META[route.name]} size={24} color={focused ? c.p : c.muted} width={focused ? 2.4 : 2} />
      </Animated.View>
      <T w={600} size={11} color={focused ? c.p : c.muted} style={{ marginTop: 3 }}>
        {route.name}
      </T>
      <Animated.View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: c.p, marginTop: 3, opacity: s, transform: [{ scale: s }] }} />
    </Pressable>
  );
}

export default function TabBar({ state, navigation }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: c.nav,
        borderTopWidth: 1,
        borderTopColor: c.line,
        paddingBottom: Math.max(insets.bottom, 8),
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        elevation: 16,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
      }}
    >
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        return (
          <Item
            key={route.key}
            route={route}
            focused={focused}
            onPress={() => {
              tap();
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
            }}
          />
        );
      })}
    </View>
  );
}
