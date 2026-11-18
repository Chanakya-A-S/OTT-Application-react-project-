import React, { useEffect, useState } from 'react';
import { View, Image, Pressable, Alert, KeyboardAvoidingView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useTheme, T } from '../theme';
import { Btn, Field, Row } from '../components/ui';
import Icon from '../components/Icon';
import { cloudEnabled, googleEnabled, signIn, signUp, resetPassword, authError, signInWithGoogleIdToken } from '../firebase';
import { googleClientIds } from '../config/firebaseConfig';
import { useStore } from '../store';

WebBrowser.maybeCompleteAuthSession();

function GoogleButton({ onError }) {
  const c = useTheme();
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleClientIds.webClientId || undefined,
    androidClientId: googleClientIds.androidClientId || undefined,
  });
  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token || response.authentication?.idToken;
      if (idToken) signInWithGoogleIdToken(idToken).catch((e) => onError(authError(e)));
    }
  }, [response, onError]);
  return (
    <Pressable
      disabled={!request}
      onPress={() => promptAsync()}
      style={({ pressed }) => ({
        height: 54,
        borderRadius: 18,
        backgroundColor: c.card,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        opacity: pressed ? 0.8 : 1,
        elevation: 2,
      })}
    >
      <T w={800} size={18} color="#4285F4">
        G
      </T>
      <T w={600} size={15}>
        Google
      </T>
    </Pressable>
  );
}

export default function AuthScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const setAccount = useStore((s) => s.setAccount);
  const [mode, setMode] = useState('signin'); // signin | signup | forgot
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr('');
    if (!cloudEnabled) return;
    if (!email.trim()) return setErr('Please enter your email.');
    setBusy(true);
    try {
      if (mode === 'forgot') {
        await resetPassword(email);
        Alert.alert('Check your inbox 📬', 'We sent you a link to reset your password.');
        setMode('signin');
      } else if (mode === 'signup') await signUp(email, pw);
      else await signIn(email, pw);
    } catch (e) {
      setErr(authError(e));
    } finally {
      setBusy(false);
    }
  };

  const title = mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset password' : 'Welcome to';

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <LinearGradient colors={c.dark ? ['#2a1520', c.bg] : ['#FFDCD3', c.bg]} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 420 }} />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center' }}>
            <Image source={require('../../assets/logo.png')} style={{ width: 112, height: 112 }} resizeMode="contain" />
            <T w={600} size={15} muted style={{ marginTop: 14 }}>
              {title}
            </T>
            <T w={800} size={28} style={{ letterSpacing: 0.5 }}>
              APPLE<T w={800} size={28} color={c.p}>·</T>STUDY
            </T>
            <T size={13} muted center style={{ marginTop: 6, lineHeight: 20 }}>
              Your tasks, notes &amp; study buddy,{'\n'}synced across all your devices ☁️
            </T>
          </View>

          {!cloudEnabled && (
            <View style={{ backgroundColor: c.soft, borderRadius: 16, padding: 14, marginTop: 20 }}>
              <T w={600} size={13} color={c.p}>
                ☁️ Cloud sync isn’t set up yet
              </T>
              <T size={12} muted style={{ marginTop: 2 }}>
                Add your Firebase keys (see SETUP.md) to enable accounts. Until then you can use the app offline.
              </T>
            </View>
          )}

          <View style={{ marginTop: 20, opacity: cloudEnabled ? 1 : 0.5 }} pointerEvents={cloudEnabled ? 'auto' : 'none'}>
            <T w={600} size={12} muted style={{ marginLeft: 4, marginBottom: 6 }}>
              Email
            </T>
            <Field icon="mail" placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
            {mode !== 'forgot' && (
              <>
                <T w={600} size={12} muted style={{ marginLeft: 4, marginBottom: 6, marginTop: 12 }}>
                  Password
                </T>
                <Field
                  icon="lock"
                  placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                  value={pw}
                  onChangeText={setPw}
                  secureTextEntry={!show}
                  autoCapitalize="none"
                  right={
                    <Pressable onPress={() => setShow(!show)} hitSlop={10}>
                      <Icon name={show ? 'eyeOff' : 'eye'} size={18} color={c.muted} />
                    </Pressable>
                  }
                />
              </>
            )}
            {mode === 'signin' && (
              <Pressable onPress={() => setMode('forgot')} style={{ alignSelf: 'flex-end', marginTop: 8 }} hitSlop={8}>
                <T w={600} size={12} color={c.p}>
                  Forgot password?
                </T>
              </Pressable>
            )}
            {err ? (
              <T w={500} size={12} color={c.danger} style={{ marginTop: 10 }}>
                {err}
              </T>
            ) : null}
            <Btn
              title={mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}
              onPress={submit}
              loading={busy}
              style={{ marginTop: 16 }}
            />
          </View>

          {mode === 'signin' && googleEnabled && (
            <>
              <Row style={{ marginVertical: 16 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
                <T w={500} size={12} muted>
                  or continue with
                </T>
                <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
              </Row>
              <GoogleButton onError={setErr} />
            </>
          )}

          {cloudEnabled && (
            <Pressable
              onPress={() => {
                setErr('');
                setMode(mode === 'signin' ? 'signup' : 'signin');
              }}
              style={{ alignSelf: 'center', marginTop: 18 }}
              hitSlop={8}
            >
              <T size={13} muted>
                {mode === 'signin' ? 'New here? ' : 'Already have an account? '}
                <T w={700} size={13} color={c.p}>
                  {mode === 'signin' ? 'Create account' : 'Sign in'}
                </T>
              </T>
            </Pressable>
          )}

          <Pressable onPress={() => setAccount({ guest: true })} style={{ alignSelf: 'center', marginTop: 14, padding: 6 }} hitSlop={8}>
            <T w={600} size={12} muted style={{ textDecorationLine: 'underline' }}>
              {cloudEnabled ? 'Skip for now — use offline' : 'Continue offline →'}
            </T>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
