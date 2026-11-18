# 🍎 APPLE-STUDY — setup guide

The app works **offline out of the box** (data saved on the phone).
Follow steps 1–3 once to switch on **accounts + cloud sync** (free Firebase "Spark" plan is enough).

---

## 1. Create a Firebase project (5 min)

1. Go to <https://console.firebase.google.com> → **Add project** → name it `apple-study` → you can turn Google Analytics off → **Create**.
2. **Build → Authentication → Get started → Sign-in method** → enable **Email/Password** → Save.
3. **Build → Firestore Database → Create database** → choose a location near you → start in **production mode**.
4. Open the **Rules** tab, replace everything with the contents of [`firestore.rules`](./firestore.rules) and click **Publish**.
   (This makes sure every user can only see their own tasks and notes.)

## 2. Paste your keys into the app

1. In Firebase: ⚙️ **Project settings → General → Your apps → `</>` (Web)** → register an app called `apple-study-web` (no hosting needed).
2. Copy the `firebaseConfig` values it shows and paste them into
   [`src/config/firebaseConfig.js`](./src/config/firebaseConfig.js):

```js
export const firebaseConfig = {
  apiKey: 'AIza…',
  authDomain: 'apple-study-xxxx.firebaseapp.com',
  projectId: 'apple-study-xxxx',
  storageBucket: 'apple-study-xxxx.firebasestorage.app',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:abcdef',
};
```

These web keys are **not secret** — the Firestore rules from step 1 protect the data.

## 3. Rebuild the APK

See **Building the APK** below. After installing, open the app → **Create account** → done.
Data you entered offline is uploaded automatically the first time you sign in.

## 4. (Optional) "Continue with Google"

The Google button only appears once an Android client ID is set.

1. Firebase → Authentication → Sign-in method → enable **Google**.
2. Get the SHA-1 of the signing key: `cd android && ./gradlew signingReport` (the APK is signed with the debug keystore by default).
3. In <https://console.cloud.google.com/apis/credentials> (same project) → **Create credentials → OAuth client ID → Android**,
   package name `com.applestudy.app`, paste the SHA-1.
4. Also copy the **Web client** ID that Firebase created automatically.
5. Put both into `googleClientIds` in `src/config/firebaseConfig.js` and rebuild.

---

## Building the APK

Requirements: Node 20+, JDK 17–21, Android SDK (platform 36, build-tools 36, NDK 27.1.12297006).

```bash
cd apple-study
npm install
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
```

The APK appears at `android/app/build/outputs/apk/release/app-release.apk`.
It is built for 64-bit phones (`arm64-v8a`, i.e. practically every phone since 2017).
For old 32-bit phones add `armeabi-v7a` to `reactNativeArchitectures` in `android/gradle.properties`.

**Alternative — build in the cloud with Expo (no Android SDK needed):**

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

(`eas.json` is included; the `preview` profile produces an installable `.apk`.)

## Installing on your phone

1. Copy `app-release.apk` to the phone (Google Drive, USB, Telegram to yourself…).
2. Tap it → allow **Install unknown apps** for that file manager → Install.
3. On first launch allow **Notifications**. On Android 12+, if reminders arrive late, open
   *Settings → Apps → APPLE-STUDY → Alarms & reminders* and allow it.

## Run it while developing

```bash
npx expo start        # then press "a" with a phone/emulator connected (needs a dev build)
npx expo run:android  # builds and installs a debug build on a connected phone
```
