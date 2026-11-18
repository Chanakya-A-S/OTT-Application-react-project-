import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, T } from '../theme';
import { Sheet, Field, Label, Chip, Btn, Row } from '../components/ui';
import Apple from '../components/Apple';
import { useStore } from '../store';
import { BUDDY_IDEAS } from './OnboardingScreen';

export default function EditNamesScreen() {
  const c = useTheme();
  const nav = useNavigation();
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const [name, setName] = useState(profile.userName || '');
  const [buddy, setBuddy] = useState(profile.buddyName || 'Appy');

  const save = () => {
    setProfile({ userName: name.trim() || profile.userName, buddyName: buddy.trim() || 'Appy' });
    nav.goBack();
  };

  return (
    <Sheet title="Edit names">
      <Row gap={14} style={{ marginTop: 16 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' }}>
          <T size={30}>🧑‍🎓</T>
        </View>
        <View style={{ flex: 1 }}>
          <Label style={{ marginTop: 0 }}>YOUR NAME</Label>
          <Field placeholder="Your name" value={name} onChangeText={setName} autoFocus />
        </View>
      </Row>
      <T size={11} muted style={{ marginTop: 6, marginLeft: 78 }}>
        Shown in “Hey, {name || 'you'} 👋” and greetings
      </T>
      <Row gap={14} style={{ marginTop: 16 }}>
        <Apple mood="happy" size={64} color={profile.color} accessory={profile.accessory} face={profile.face} />
        <View style={{ flex: 1 }}>
          <Label style={{ marginTop: 0 }}>BUDDY NAME</Label>
          <Field placeholder="Appy" value={buddy} onChangeText={setBuddy} />
        </View>
      </Row>
      <Row gap={8} style={{ marginTop: 12, flexWrap: 'wrap' }}>
        <T size={12} muted>
          Ideas:
        </T>
        {BUDDY_IDEAS.map((n) => (
          <Chip key={n} label={n} small on={buddy === n} onPress={() => setBuddy(n)} />
        ))}
      </Row>
      <Btn title="Save" onPress={save} style={{ marginTop: 22 }} />
    </Sheet>
  );
}
