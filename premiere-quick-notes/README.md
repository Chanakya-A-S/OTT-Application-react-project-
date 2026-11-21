# Quick Notes — Premiere Pro panel

A small, animated notes panel for Premiere Pro. Paste text or images, copy them back out, and keep editing notes right next to your timeline.

## Features
- **Paste anything:** text or images (Ctrl/Cmd + V), drag and drop, or pick an image file
- **Copy back out:** copy a note's text or any image to the clipboard with one click
- **Edit in place:** double-click a note (or click ✎). Ctrl/Cmd + Enter saves, Esc cancels
- **Timecode stamp:** the ⏱ button inserts the playhead timecode of the active sequence. Timecodes are highlighted in notes
- **Import to project:** send a pasted image straight into a `Quick Notes` bin
- **Pin, search, delete with undo**
- Notes are saved to `~/.premiere-quick-notes/notes.json`, so they survive restarts

## Install (one click)
Download the installer for your computer from the `dist/` folder:

- **Windows:** `QuickNotes-Installer-Windows.exe`. Double-click it. No admin rights are needed. If SmartScreen warns you, click **More info → Run anyway**.
- **macOS:** `QuickNotes-Installer-Mac.zip`. Unzip it, then double-click **Install Quick Notes.command**. If macOS blocks it, right-click it and choose **Open → Open**.

Then restart Premiere Pro and open **Window → Extensions → Quick Notes**.

The installer enables `PlayerDebugMode`, which lets Premiere load unsigned panels, and copies the panel into the CEP extensions folder. On Windows you can uninstall it from **Settings → Apps**.

To rebuild the installers, run `installer/build.sh` (needs `makensis`).

## Structure
```
CSXS/manifest.xml   panel definition (Premiere Pro 2020+)
index.html          UI
css/style.css       styling and animations
js/main.js          panel logic (clipboard, storage, paste)
jsx/host.jsx        ExtendScript (timecode, import to bin)
```
