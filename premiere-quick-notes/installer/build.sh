#!/bin/bash
# Builds both one-click installers into ../dist
#   dist/QuickNotes-Installer-Windows.exe   (needs makensis)
#   dist/QuickNotes-Installer-Mac.zip       (contains a double-click .command)
set -e
cd "$(dirname "$0")/.."
mkdir -p dist

# ---------- Windows ----------
makensis -V2 installer/windows.nsi

# ---------- macOS ----------
PAYLOAD=$(tar -czf - CSXS css js jsx icons index.html .debug | base64 -w0)
CMD="dist/Install Quick Notes.command"
cat > "$CMD" <<'EOF'
#!/bin/bash
# Quick Notes for Premiere Pro – one-click macOS installer
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/com.quicknotes.premiere"
echo "Installing Quick Notes for Premiere Pro..."
for v in 9 10 11 12; do defaults write com.adobe.CSXS.$v PlayerDebugMode 1; done
rm -rf "$DEST" && mkdir -p "$DEST"
sed -n '/^__PAYLOAD__$/,$p' "$0" | tail -n +2 | base64 -D | tar -xzf - -C "$DEST"
if [ -f "$DEST/CSXS/manifest.xml" ]; then
  osascript -e 'display dialog "Quick Notes is installed.\n\nRestart Premiere Pro, then open:\nWindow > Extensions > Quick Notes" buttons {"OK"} default button 1 with title "Quick Notes" with icon note' >/dev/null 2>&1
  echo "Done."
else
  osascript -e 'display dialog "Installation failed." buttons {"OK"} with icon stop' >/dev/null 2>&1
  exit 1
fi
exit 0
__PAYLOAD__
EOF
echo "$PAYLOAD" >> "$CMD"
chmod +x "$CMD"
rm -f dist/QuickNotes-Installer-Mac.zip
(cd dist && zip -qX QuickNotes-Installer-Mac.zip "Install Quick Notes.command" && rm "Install Quick Notes.command")

ls -lh dist
