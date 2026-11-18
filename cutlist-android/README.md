# Cutlist (Android)

Tracks video editing jobs: client, fee and payments received, due date, and the final video output link.

- `Cutlist.apk`: ready-to-install build (Android 7.0+).
- `assets/index.html`: the app screen. Jobs are stored on the phone (localStorage); use Back up / Restore to move them.
- `src/`, `res/`, `AndroidManifest.xml`: WebView wrapper.

Built with Android build-tools 34 (aapt2, d8, zipalign, apksigner) against android-34. The signing keystore is not stored in this repository.
