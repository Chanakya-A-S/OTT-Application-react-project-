import React from 'react';
import { View, Pressable, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useTheme, T, THEMES, shadow } from '../theme';
import { Screen, Header, Card, Segmented, Toggle, Label, Chip, Row, Btn, tap } from '../components/ui';
import Icon from '../components/Icon';
import { useStore } from '../store';
import { cloudEnabled, signOutCloud } from '../firebase';
import { stopSync } from '../sync';
import { ensurePermission } from '../notifications';

function ThemeCard({ k, on, onPress }) {
  const c = useTheme();
  const t = THEMES[k];
  const pal = c.dark ? t.dark : t.light;
  return (
    <Pressable onPress={onPress} style={{ width: '48%' }}>
      <View style={[{ backgroundColor: c.card, borderRadius: 20, padding: 10, borderWidth: 3, borderColor: on ? c.p : 'transparent' }, shadow(c)]}>
        <View style={{ height: 70, borderRadius: 14, backgroundColor: pal.bg, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', left: 10, top: 10, width: 44, height: 50, borderRadius: 12, backgroundColor: pal.p }} />
          <View style={{ position: 'absolute', left: 62, top: 14, right: 10, height: 8, borderRadius: 4, backgroundColor: pal.line }} />
          <View style={{ position: 'absolute', left: 62, top: 30, width: 40, height: 8, borderRadius: 4, backgroundColor: pal.line }} />
          <View style={{ position: 'absolute', right: 10, bottom: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: pal.p2 }} />
        </View>
        <Row between style={{ marginTop: 8 }}>
          <T w={600} size={13}>
            {t.label}
          </T>
          {on && (
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: c.success, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={12} color="#fff" width={3} />
            </View>
          )}
        </Row>
      </View>
    </Pressable>
  );
}

const Stepper = ({ label, value, onChange, min, max, step = 5 }) => {
  const c = useTheme();
  return (
    <Row between style={{ paddingVertical: 10 }}>
      <T w={600} size={14}>
        {label}
      </T>
      <Row gap={12}>
        <Pressable onPress={() => (tap(), onChange(Math.max(min, value - step)))} hitSlop={8} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' }}>
          <T w={700} size={16} color={c.p}>
            −
          </T>
        </Pressable>
        <T w={700} size={14} style={{ minWidth: 52, textAlign: 'center' }}>
          {value} min
        </T>
        <Pressable onPress={() => (tap(), onChange(Math.min(max, value + step)))} hitSlop={8} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' }}>
          <T w={700} size={16} color={c.p}>
            +
          </T>
        </Pressable>
      </Row>
    </Row>
  );
};

const ToggleRow = ({ label, sub, value, onChange, last }) => {
  const c = useTheme();
  return (
    <Row between style={{ paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line }}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <T w={600} size={14}>
          {label}
        </T>
        {sub ? (
          <T size={11} muted>
            {sub}
          </T>
        ) : null}
      </View>
      <Toggle value={value} onChange={onChange} />
    </Row>
  );
};

export default function SettingsScreen() {
  const c = useTheme();
  const settings = useStore((s) => s.settings);
  const set = useStore((s) => s.setSettings);
  const account = useStore((s) => s.account);
  const profile = useStore((s) => s.profile);

  const test = async () => {
    if (!(await ensurePermission())) return Alert.alert('Notifications are off', 'Enable notifications for APPLE-STUDY in Android settings.', [{ text: 'Cancel' }, { text: 'Open settings', onPress: () => Linking.openSettings() }]);
    await Notifications.scheduleNotificationAsync({
      content: { title: `🍎 Hi from ${profile.buddyName}!`, body: 'Reminders are working. Time to study? 📚', sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: 'reminders' },
    });
    Alert.alert('Test sent', 'You’ll get a notification in 3 seconds.');
  };

  const signOut = () =>
    Alert.alert(account.guest ? 'Leave offline mode?' : 'Sign out?', account.guest ? 'This will erase the data saved on this phone.' : 'Your data stays safe in the cloud. It will be removed from this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: account.guest ? 'Erase & exit' : 'Sign out',
        style: 'destructive',
        onPress: async () => {
          stopSync();
          await signOutCloud().catch(() => {});
          await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
          useStore.getState().resetData();
        },
      },
    ]);

  return (
    <Screen scroll bottomSpace={40}>
      <Header title="Settings" />

      <Label>MODE</Label>
      <Segmented
        value={settings.mode}
        onChange={(v) => set({ mode: v })}
        options={[
          { value: 'light', label: '☀️ Light' },
          { value: 'dark', label: '🌙 Dark' },
          { value: 'system', label: '📱 System' },
        ]}
      />
      <Label>COLOUR THEME</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 }}>
        {Object.keys(THEMES).map((k) => (
          <ThemeCard key={k} k={k} on={settings.theme === k} onPress={() => (tap(), set({ theme: k }))} />
        ))}
      </View>

      <Label>FOCUS TIMER</Label>
      <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
        <Stepper label="🍅 Focus" value={settings.focusMin} min={5} max={120} onChange={(v) => set({ focusMin: v })} />
        <Stepper label="☕ Short break" value={settings.shortMin} min={1} max={30} step={1} onChange={(v) => set({ shortMin: v })} />
        <Stepper label="🌙 Long break" value={settings.longMin} min={5} max={60} onChange={(v) => set({ longMin: v })} />
      </Card>

      <Label>NOTIFICATIONS</Label>
      <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
        <ToggleRow label="🔔 Task reminders" sub="Before each study task starts" value={settings.reminders} onChange={(v) => set({ reminders: v })} />
        <ToggleRow label={`🥺 ${profile.buddyName}’s nudges`} sub="7 PM reminder on days you haven’t studied" value={settings.nudges} onChange={(v) => set({ nudges: v })} last />
      </Card>
      <T w={600} size={12} muted style={{ marginTop: 12, marginBottom: 6 }}>
        Default reminder for new tasks
      </T>
      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        {[0, 5, 10, 15, 30].map((m) => (
          <Chip key={m} small label={m ? `${m} min` : 'At start'} on={settings.defaultReminder === m} onPress={() => set({ defaultReminder: m })} />
        ))}
      </Row>
      <Btn small outline icon="bell" title="Send a test notification" onPress={test} style={{ marginTop: 12 }} />

      <Label>FEEL</Label>
      <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
        <ToggleRow label="🎉 Celebration animations" value={settings.animations} onChange={(v) => set({ animations: v })} />
        <ToggleRow label="📳 Haptic feedback" value={settings.haptics} onChange={(v) => set({ haptics: v })} last />
      </Card>

      <Label>ACCOUNT</Label>
      <Card style={{ padding: 16 }}>
        <Row gap={12}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="cloud" size={20} color={c.p} />
          </View>
          <View style={{ flex: 1 }}>
            <T w={600} size={14}>
              {account.uid ? 'Cloud sync is on ☁️' : 'Offline mode'}
            </T>
            <T size={11} muted numberOfLines={1}>
              {account.uid ? account.email || 'Signed in' : cloudEnabled ? 'Sign in to back up and sync your data' : 'Add Firebase keys to enable sync (see SETUP.md)'}
            </T>
          </View>
        </Row>
        {account.guest && cloudEnabled && (
          <Btn small title="Sign in to back up & sync" icon="cloud" style={{ marginTop: 14 }} onPress={() => useStore.getState().setAccount({ guest: false })} />
        )}
        <Pressable onPress={signOut} style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="logout" size={18} color={c.danger} />
          <T w={600} size={14} color={c.danger}>
            {account.guest ? 'Erase all data on this phone' : 'Sign out'}
          </T>
        </Pressable>
      </Card>
      <T size={11} muted center style={{ marginTop: 20 }}>
        APPLE-STUDY v1.0 · made with 🍎 for Chan &amp; Subha
      </T>
    </Screen>
  );
}
