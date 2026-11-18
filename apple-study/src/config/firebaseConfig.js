/**
 * ☁️  Cloud sync setup — paste your Firebase web-app config here.
 * See SETUP.md (step 2) for where to find these values.
 * These keys are not secret: Firestore security rules protect each user's data.
 *
 * While apiKey is empty the app runs in offline mode (data stays on the phone).
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyB1UwxpEXxE3isN6FpnwLCI36W6Ea3IEH4',
  authDomain: 'apple-study-aa789b.firebaseapp.com',
  projectId: 'apple-study-aa789b',
  storageBucket: 'apple-study-aa789b.firebasestorage.app',
  messagingSenderId: '115151837873',
  appId: '1:115151837873:web:8ce7ee65b41eba4d702090',
};

/**
 * Optional — "Continue with Google". Leave empty to hide the Google button.
 * Create OAuth client IDs in Google Cloud Console (see SETUP.md, step 4).
 */
export const googleClientIds = {
  webClientId: '',
  androidClientId: '',
};
