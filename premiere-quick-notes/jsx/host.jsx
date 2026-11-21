/* Quick Notes – ExtendScript side (runs inside Premiere Pro) */

/**
 * Import an image file into the active project, inside a "Quick Notes" bin.
 * Returns "ok" or an error string.
 */
function qnImportFile(path) {
  try {
    if (!app.project) return "No project open";
    var root = app.project.rootItem;
    var bin = null;
    for (var i = 0; i < root.children.numItems; i++) {
      var c = root.children[i];
      if (c && c.name === "Quick Notes" && c.type === 2 /* BIN */) { bin = c; break; }
    }
    if (!bin) bin = root.createBin("Quick Notes");
    var ok = app.project.importFiles([path], true, bin, false);
    return ok ? "ok" : "Import failed";
  } catch (e) {
    return "Error: " + e.toString();
  }
}

/** Returns the current playhead timecode of the active sequence, or "". */
function qnPlayheadTimecode() {
  try {
    var seq = app.project.activeSequence;
    if (!seq) return "";
    var pos = seq.getPlayerPosition();
    var s = seq.getSettings();
    return pos.getFormatted(s.videoFrameRate, s.videoDisplayFormat);
  } catch (e) {
    try { return app.project.activeSequence.getPlayerPosition().seconds.toFixed(2) + "s"; } catch (e2) { return ""; }
  }
}

/** Returns the active sequence's name, or "". */
function qnSequenceName() {
  try { return app.project.activeSequence ? app.project.activeSequence.name : ""; } catch (e) { return ""; }
}
