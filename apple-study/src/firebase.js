import { initializeApp, getApps } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig, googleClientIds } from './config/firebaseConfig';

export const cloudEnabled = !!firebaseConfig.apiKey;
export const googleEnabled = cloudEnabled && !!googleClientIds.androidClientId;

let app = null;
let auth = null;
let db = null;

if (cloudEnabled) {
  app = getApps()[0] || initializeApp(firebaseConfig);
  try {
    auth = FirebaseAuth.initializeAuth(app, {
      persistence: FirebaseAuth.getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = FirebaseAuth.getAuth(app);
  }
  try {
    db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
    db = getFirestore(app);
  }
}

export { app, auth, db };

const friendly = {
  'auth/invalid-email': 'That email address looks wrong.',
  'auth/missing-password': 'Please enter your password.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/email-already-in-use': 'An account already exists with this email. Try signing in.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/too-many-requests': 'Too many attempts. Please wait a minute and try again.',
  'auth/network-request-failed': 'No internet connection.',
};
export const authError = (e) => friendly[e?.code] || e?.message || 'Something went wrong.';

export const signIn = (email, pw) => FirebaseAuth.signInWithEmailAndPassword(auth, email.trim(), pw);
export const signUp = (email, pw) => FirebaseAuth.createUserWithEmailAndPassword(auth, email.trim(), pw);
export const resetPassword = (email) => FirebaseAuth.sendPasswordResetEmail(auth, email.trim());
export const signInWithGoogleIdToken = (idToken) =>
  FirebaseAuth.signInWithCredential(auth, FirebaseAuth.GoogleAuthProvider.credential(idToken));
export const signOutCloud = () => (auth ? FirebaseAuth.signOut(auth) : Promise.resolve());
export const onAuth = (cb) => (auth ? FirebaseAuth.onAuthStateChanged(auth, cb) : () => {});
