/**
 * ☁️  Cloud sync setup — paste your Firebase web-app config here.
 * See SETUP.md (step 2) for where to find these values.
 * These keys are not secret: Firestore security rules protect each user's data.
 *
 * While apiKey is empty the app runs in offline mode (data stays on the phone).
 */
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

/**
 * Optional — "Continue with Google". Leave empty to hide the Google button.
 * Create OAuth client IDs in Google Cloud Console (see SETUP.md, step 4).
 */
export const googleClientIds = {
  webClientId: '',
  androidClientId: '',
};
