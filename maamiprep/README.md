# MaamiPrep

Offline Android study app for SBI / IBPS Clerk Mains – Current Affairs (Aug–Nov 2026) + Computer Awareness.

- Study (widget topics, notes, hints, IMP tags, favourites, "Flash me", search)
- Quiz & timed Mock (1,200+ questions, unseen-first, achievement animations, Chan reactions)
- Roadmap (customisable exam date & plan days, day messages, Day-final job celebration)
- Flash cards (spaced repetition, own cards, wrong answers, push reminders)
- Profile (character grows with progress, customisation, motivation from Chan)
- Focus timer inside Chan's clock with alarm (works when phone is locked)

## Build
```
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug   # needs Android SDK (sdk.dir in local.properties)
```
APK: `android/app/build/outputs/apk/debug/app-debug.apk`
