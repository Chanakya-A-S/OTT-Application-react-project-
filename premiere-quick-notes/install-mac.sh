#!/bin/bash
# Installs the Quick Notes panel for Premiere Pro on macOS.
set -e
SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/com.quicknotes.premiere"

# Allow unsigned extensions (CSXS 9 – 12)
for v in 9 10 11 12; do
  defaults write com.adobe.CSXS.$v PlayerDebugMode 1
done

rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$SRC/CSXS" "$SRC/css" "$SRC/js" "$SRC/jsx" "$SRC/icons" "$SRC/index.html" "$SRC/.debug" "$DEST/"

echo "Installed to: $DEST"
echo "Restart Premiere Pro, then open Window > Extensions > Quick Notes"
