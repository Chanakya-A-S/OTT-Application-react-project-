import React, { createContext, useContext, useMemo } from 'react';
import { Text, useColorScheme } from 'react-native';
import { useStore } from './store';

export const THEMES = {
  red: {
    label: '🍎 Apple Red',
    light: { p: '#E8434B', p2: '#FF7D6B', bg: '#FFF6F2', soft: '#FFE6E1', line: '#F4E4E0' },
    dark: { p: '#FF5A61', p2: '#FF8A72', bg: '#141016', card: '#211B23', soft: '#33232A', line: '#2F2731' },
  },
  blue: {
    label: '💙 Soft Blue',
    light: { p: '#3D7BF5', p2: '#72A5FF', bg: '#F2F6FF', soft: '#E2ECFF', line: '#E1E8F6' },
    dark: { p: '#5B92FF', p2: '#8AB4FF', bg: '#0F1320', card: '#1A2030', soft: '#1F2B45', line: '#263048' },
  },
  peach: {
    label: '🍑 Peach',
    light: { p: '#F28A2E', p2: '#FFB36B', bg: '#FFF5EC', soft: '#FFE9D3', line: '#F6E4D2' },
    dark: { p: '#FF9A45', p2: '#FFC07F', bg: '#16110D', card: '#241C16', soft: '#3A2A1C', line: '#33281F' },
  },
  lavender: {
    label: '💜 Lavender',
    light: { p: '#8E6CF0', p2: '#B9A0FF', bg: '#F6F2FF', soft: '#ECE5FF', line: '#E7E0F6' },
    dark: { p: '#A78BFF', p2: '#C8B6FF', bg: '#13101C', card: '#1F1A2C', soft: '#2C2342', line: '#2C2640' },
  },
};

function build(themeKey, dark) {
  const t = THEMES[themeKey] || THEMES.red;
  const base = dark ? t.dark : t.light;
  return {
    key: themeKey,
    dark,
    ...base,
    card: base.card || '#FFFFFF',
    text: dark ? '#F6EDEF' : '#2A1A1D',
    muted: dark ? '#9A8F9C' : '#9C8B8E',
    nav: dark ? base.card : '#FFFFFF',
    overlay: 'rgba(20,8,12,0.5)',
    success: '#3DBE8B',
    warn: '#F5A623',
    danger: '#E8434B',
  };
}

const ThemeCtx = createContext(build('red', false));

export function ThemeProvider({ children }) {
  const sys = useColorScheme();
  const mode = useStore((s) => s.settings.mode);
  const theme = useStore((s) => s.settings.theme);
  const dark = mode === 'dark' || (mode === 'system' && sys === 'dark');
  const value = useMemo(() => build(theme, dark), [theme, dark]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);

export const FONTS = {
  400: 'Poppins_400Regular',
  500: 'Poppins_500Medium',
  600: 'Poppins_600SemiBold',
  700: 'Poppins_700Bold',
  800: 'Poppins_800ExtraBold',
};

/** Text that always uses Poppins (Android cannot synthesise weights for custom fonts). */
export function T({ w = 500, size = 14, color, muted, center, style, children, ...rest }) {
  const c = useTheme();
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: FONTS[w] || FONTS[500],
          fontSize: size,
          color: color || (muted ? c.muted : c.text),
          textAlign: center ? 'center' : undefined,
          includeFontPadding: false,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export const shadow = (c, strong) => ({
  shadowColor: c.dark ? '#000' : c.p,
  shadowOpacity: c.dark ? 0.35 : 0.12,
  shadowRadius: strong ? 18 : 12,
  shadowOffset: { width: 0, height: strong ? 10 : 6 },
  elevation: strong ? 8 : 3,
});
