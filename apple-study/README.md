# 🍎 APPLE-STUDY

A cute study planner for Android, built with **React Native + Expo (SDK 54)**.

| | |
|---|---|
| 🏠 **Home** | Greeting, today's stats (time studied · tasks done · streak), buddy mood card, *Up next* tasks, quick links to To-do & Timesheet, and the ❤️ button (**Chan ❤️ Subha** surprise with floating hearts) |
| 📚 **Tasks** | Study planner: what to study, subject, date, start/end time, priority, reminder, repeat (once / daily / weekdays / weekly). Week strip + subject filters. Completing a task plays a confetti celebration |
| ⏱ **Timer** | Pomodoro focus / short / long break + stopwatch, linked to a subject or task. Sessions are logged to the timesheet automatically and a notification fires when a session ends |
| 📝 **Notes** | Masonry notes with search, subjects, pinning and colours. Editor mixes text, checklists and **images** (gallery or camera) |
| ✅ **To-do** | Quick checklists for Today / This week / Someday with a progress card |
| 🗓 **Timesheet** | 24-hour day view. Tasks with a time appear automatically; add routine blocks (lunch, gym…). **Long-press a block to drag it, pull the handle to resize** (snaps to 15 min). *Actual* view shows tracked focus sessions |
| 🍎 **Profile** | Your buddy (rename it, change colour, add glasses / grad cap / headphones / bow / cap / crown). Its mood follows your activity: 🤩 dancing → 😊 happy → 🙂 ready → 🥺 sad (no study yet) → 😴 sleepy (2+ idle days). XP, levels and streaks |
| ⚙️ **Settings** | Light / Dark / System mode, 4 colour themes (Apple Red, Soft Blue, Peach, Lavender), timer lengths, reminder defaults, nudges, haptics, account |
| 🔔 **Notifications** | Reminders before each task (with *Start timer* / *Snooze 5m* buttons), timer-finished alerts, and a gentle 7 PM nudge on days you haven't studied |
| ☁️ **Cloud sync** | Email (and optional Google) login with Firebase; everything syncs across devices. Works fully offline too |

Animated opening splash (apple drop, bounce & wiggle), Poppins font throughout.

## Setup & building

See **[SETUP.md](./SETUP.md)** — Firebase keys, building the APK, installing on your phone.

## Project layout

```
App.js                    navigation, splash, auth/notification wiring
src/theme.js              colour themes (light/dark) + Poppins text component
src/store.js              app data (zustand, persisted on the phone)
src/logic.js              schedules, streaks, XP, buddy mood rules
src/sync.js               Firestore cloud sync (newest change wins)
src/notifications.js      reminders, nudges, timer alerts
src/components/           Apple character, celebration, heart surprise, UI kit…
src/screens/              one file per screen
src/config/firebaseConfig.js   ← paste your Firebase keys here
```
