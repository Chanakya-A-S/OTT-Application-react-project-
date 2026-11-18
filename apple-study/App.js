import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts } from 'expo-font';
import { Poppins_400Regular } from '@expo-google-fonts/poppins/400Regular';
import { Poppins_500Medium } from '@expo-google-fonts/poppins/500Medium';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { Poppins_800ExtraBold } from '@expo-google-fonts/poppins/800ExtraBold';

import { useStore } from './src/store';
import { ThemeProvider, useTheme } from './src/theme';
import { onAuth } from './src/firebase';
import { startSync, stopSync } from './src/sync';
import { configureNotifications, rescheduleAll, snoozeTask } from './src/notifications';
import { computeStats } from './src/logic';
import TabBar from './src/components/TabBar';
import Celebration from './src/components/Celebration';
import AnimatedSplash from './src/components/AnimatedSplash';

import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import TasksScreen from './src/screens/TasksScreen';
import TimerScreen from './src/screens/TimerScreen';
import NotesScreen from './src/screens/NotesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TaskEditorScreen from './src/screens/TaskEditorScreen';
import NoteEditorScreen from './src/screens/NoteEditorScreen';
import TodoScreen from './src/screens/TodoScreen';
import TimesheetScreen from './src/screens/TimesheetScreen';
import BlockEditorScreen from './src/screens/BlockEditorScreen';
import EditNamesScreen from './src/screens/EditNamesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import RemindersScreen from './src/screens/RemindersScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
export const navRef = createNavigationContainerRef();

function Tabs() {
  return (
    <Tab.Navigator tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Timer" component={TimerScreen} />
      <Tab.Screen name="Notes" component={NotesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const sheet = { presentation: 'transparentModal', animation: 'slide_from_bottom', contentStyle: { backgroundColor: 'transparent' } };

function Root() {
  const c = useTheme();
  const account = useStore((s) => s.account);
  const onboarded = useStore((s) => s.profile.onboarded);
  const needsAuth = !account.uid && !account.guest;

  const navTheme = useMemo(() => {
    const base = c.dark ? DarkTheme : DefaultTheme;
    return { ...base, colors: { ...base.colors, background: c.bg, card: c.card, text: c.text, primary: c.p, border: c.line } };
  }, [c]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(c.bg).catch(() => {});
  }, [c.bg]);

  return (
    <NavigationContainer ref={navRef} theme={navTheme}>
      <StatusBar style={c.dark ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: c.bg } }}>
        {needsAuth ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : !onboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={Tabs} />
            <Stack.Screen name="Todo" component={TodoScreen} />
            <Stack.Screen name="Timesheet" component={TimesheetScreen} />
            <Stack.Screen name="NoteEditor" component={NoteEditorScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Reminders" component={RemindersScreen} />
            <Stack.Screen name="TaskEditor" component={TaskEditorScreen} options={sheet} />
            <Stack.Screen name="BlockEditor" component={BlockEditorScreen} options={sheet} />
            <Stack.Screen name="EditNames" component={EditNamesScreen} options={sheet} />
          </>
        )}
      </Stack.Navigator>
      <Celebration />
    </NavigationContainer>
  );
}

/** Keeps notifications in sync with tasks/settings, and handles taps on notification buttons. */
function useNotificationWiring(ready) {
  useEffect(() => {
    if (!ready) return;
    configureNotifications().catch(() => {});
    let t;
    const run = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const s = useStore.getState();
        if (!s.profile.onboarded) return;
        rescheduleAll({ ...s, activeToday: computeStats(s).activeToday });
      }, 1500);
    };
    run();
    const unsub = useStore.subscribe((s, prev) => {
      if (s.tasks !== prev.tasks || s.settings !== prev.settings || s.profile !== prev.profile || s.sessions !== prev.sessions || s.todos !== prev.todos) run();
    });

    const handle = (resp) => {
      if (!resp) return;
      const data = resp.notification.request.content.data || {};
      const s = useStore.getState();
      const task = data.taskId ? s.tasks.find((x) => x.id === data.taskId) : null;
      if (resp.actionIdentifier === 'snooze' && task) {
        snoozeTask(task, s.subjects, s.profile.buddyName);
        return;
      }
      const go = () => {
        if (!navRef.isReady()) return setTimeout(go, 300);
        if (task) navRef.navigate('Main', { screen: 'Timer', params: { taskId: task.id, subjectId: task.subjectId } });
        else if (data.kind === 'timer') navRef.navigate('Main', { screen: 'Timer' });
      };
      go();
    };
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    try {
      const last = Notifications.getLastNotificationResponse?.();
      if (last) handle(last);
    } catch {}
    return () => {
      clearTimeout(t);
      unsub();
      sub.remove();
    };
  }, [ready]);
}

function useAuthWiring(ready) {
  useEffect(() => {
    if (!ready) return;
    return onAuth((user) => {
      const st = useStore.getState();
      if (user) {
        if (st.account.uid && st.account.uid !== user.uid) st.resetData();
        st.setAccount({ uid: user.uid, email: user.email, guest: false });
        startSync(user.uid);
      } else if (st.account.uid) {
        stopSync();
        st.setAccount({ uid: null, email: null });
      }
    });
  }, [ready]);
}

export default function App() {
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold });
  const hydrated = useStore((s) => s.hydrated);
  const [splashDone, setSplashDone] = useState(false);
  const ready = fontsLoaded && hydrated;
  const endSplash = useCallback(() => setSplashDone(true), []);

  useAuthWiring(ready);
  useNotificationWiring(ready);

  const onLayout = useCallback(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <View style={{ flex: 1 }} onLayout={onLayout}>
          <Root />
          {!splashDone && <AnimatedSplash onDone={endSplash} />}
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
