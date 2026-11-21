/* Quick Notes – panel logic (CEP / Chromium) */
(function () {
  "use strict";

  // ---------- Environment ----------
  var nodeRequire = typeof window.cep_node !== "undefined" ? window.cep_node.require
    : (typeof require === "function" ? require : null);
  var fs = null, path = null, os = null, cp = null;
  try { if (nodeRequire) { fs = nodeRequire("fs"); path = nodeRequire("path"); os = nodeRequire("os"); cp = nodeRequire("child_process"); } } catch (e) { fs = null; }

  var inPremiere = !!(window.__adobe_cep__);
  function evalScript(script, cb) {
    if (!inPremiere) { if (cb) cb(""); return; }
    window.__adobe_cep__.evalScript(script, cb || function () {});
  }

  var DATA_DIR = fs ? path.join(os.homedir(), ".premiere-quick-notes") : null;
  var DATA_FILE = DATA_DIR ? path.join(DATA_DIR, "notes.json") : null;
  var IMG_DIR = DATA_DIR ? path.join(DATA_DIR, "images") : null;
  var LS_KEY = "quick-notes-v1";

  // ---------- State ----------
  var notes = [];          // { id, text, images: [dataURL], pinned, created, updated }
  var pending = [];        // images in composer
  var query = "";

  var $ = function (id) { return document.getElementById(id); };
  var input = $("input"), tray = $("tray"), list = $("list"), composer = $("composer");

  // ---------- Storage ----------
  function load() {
    try {
      if (fs && fs.existsSync(DATA_FILE)) notes = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      else notes = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch (e) { notes = []; }
    if (!Array.isArray(notes)) notes = [];
  }
  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      var json = JSON.stringify(notes);
      try {
        if (fs) {
          if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
          fs.writeFileSync(DATA_FILE, json, "utf8");
        } else {
          localStorage.setItem(LS_KEY, json);
        }
      } catch (e) { toast("Couldn't save notes (storage full?)", true); }
    }, 150);
  }

  // ---------- Helpers ----------
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function esc(s) { return s.replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function timeAgo(t) {
    var s = Math.floor((Date.now() - t) / 1000);
    if (s < 45) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    var d = new Date(t);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  function formatText(text) {
    var html = esc(text);
    // highlight timecodes like 00:01:23:12 or 01:23
    html = html.replace(/\b(\d{1,2}[:;]\d{2}[:;]\d{2}(?:[:;]\d{2})?)\b/g, '<span class="tc">$1</span>');
    if (query) {
      var q = esc(query).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      html = html.replace(new RegExp("(" + q + ")(?![^<]*>)", "gi"), "<mark>$1</mark>");
    }
    return html;
  }
  function bump() { var c = $("count"); c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); setTimeout(function () { c.classList.remove("bump"); }, 300); }

  function toast(msg, isErr) {
    document.querySelectorAll(".toast.simple").forEach(function (o) { o.remove(); });
    var t = document.createElement("div");
    t.className = "toast simple" + (isErr ? " err" : "");
    t.innerHTML = '<span class="dot"></span>' + esc(msg);
    $("toasts").appendChild(t);
    setTimeout(function () { t.classList.add("out"); setTimeout(function () { t.remove(); }, 300); }, 1800);
  }

  function ripple(btn, e) {
    var r = btn.getBoundingClientRect(), d = Math.max(r.width, r.height);
    var s = document.createElement("span");
    s.className = "ripple";
    s.style.width = s.style.height = d + "px";
    s.style.left = (e.clientX - r.left - d / 2) + "px";
    s.style.top = (e.clientY - r.top - d / 2) + "px";
    btn.appendChild(s);
    setTimeout(function () { s.remove(); }, 600);
  }

  var ICON = {
    copy: '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M8 3h11v13h-2V5H8zM5 7h10v14H5zm1.7 1.7v10.6h6.6V8.7z"/></svg>',
    edit: '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="m15.6 4.2 4.2 4.2L9 19.2H4.8V15zm0 2.4-8.9 8.9v1.8h1.8l8.9-8.9z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M9 3h6l1 2h4v1.7H4V5h4zm-3 5h12l-1 13H7zm1.8 1.7.8 9.6h6.8l.8-9.6z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M14 3l7 7-2.5.6-3.6 3.6.6 4.3-1.5 1.5-3.8-3.8L5 21l-1-1 4.8-5.2L5 11l1.5-1.5 4.3.6 3.6-3.6z"/></svg>',
    importBin: '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M3 6h7l2 2h9v12H3zm8.2 4v4.2L9.4 12.4l-1.2 1.2 3.8 3.8 3.8-3.8-1.2-1.2-1.8 1.8V10z"/></svg>',
    save: '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M11.2 3h1.6v10.1l3.6-3.6 1.2 1.2L12 16.3l-5.6-5.6 1.2-1.2 3.6 3.6zM4 19h16v2H4z"/></svg>'
  };

  // ---------- Rendering ----------
  function sorted() {
    return notes.slice().sort(function (a, b) {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
      return b.created - a.created;
    });
  }

  function render() {
    var q = query.toLowerCase();
    var items = sorted().filter(function (n) { return !q || (n.text || "").toLowerCase().indexOf(q) !== -1; });
    list.innerHTML = "";
    items.forEach(function (n, i) { list.appendChild(noteEl(n, i)); });
    $("count").textContent = notes.length;
    document.querySelector(".app").classList.toggle("is-empty", notes.length === 0);
  }

  function noteEl(n, i) {
    var el = document.createElement("article");
    el.className = "note" + (n.pinned ? " pinned" : "");
    el.dataset.id = n.id;
    el.style.animationDelay = Math.min(i * 35, 300) + "ms";

    var imgs = (n.images || []).map(function (src, k) {
      return '<div class="img-card" data-k="' + k + '"><img src="' + src + '" alt="" />' +
        '<div class="img-actions">' +
        '<button class="icon-btn" data-act="copy-img" title="Copy image">' + ICON.copy + '</button>' +
        (inPremiere && fs ? '<button class="icon-btn" data-act="import-img" title="Import into project bin">' + ICON.importBin + '</button>' : '') +
        (fs ? '<button class="icon-btn" data-act="save-img" title="Save image to disk">' + ICON.save + '</button>' : '') +
        '</div></div>';
    }).join("");

    el.innerHTML =
      '<div class="note-text" title="Double-click to edit">' + formatText(n.text || "") + '</div>' +
      (imgs ? '<div class="note-images">' + imgs + '</div>' : '') +
      '<div class="note-foot">' +
        '<span class="note-meta">' + timeAgo(n.created) + (n.updated && n.updated !== n.created ? " · edited" : "") +
        (n.images && n.images.length ? " · " + n.images.length + " img" : "") + '</span>' +
        '<button class="icon-btn ' + (n.pinned ? "on" : "") + '" data-act="pin" title="' + (n.pinned ? "Unpin" : "Pin to top") + '">' + ICON.pin + '</button>' +
        '<button class="icon-btn" data-act="edit" title="Edit">' + ICON.edit + '</button>' +
        '<button class="icon-btn" data-act="copy" title="Copy text">' + ICON.copy + '</button>' +
        '<button class="icon-btn danger" data-act="delete" title="Delete">' + ICON.trash + '</button>' +
      '</div>';
    return el;
  }

  // ---------- Composer ----------
  function addPendingImage(dataUrl) {
    pending.push(dataUrl);
    renderTray();
  }
  function renderTray() {
    tray.innerHTML = "";
    pending.forEach(function (src, i) {
      var t = document.createElement("div");
      t.className = "thumb";
      t.innerHTML = '<img src="' + src + '" alt="" /><button title="Remove">✕</button>';
      t.querySelector("button").onclick = function () { pending.splice(i, 1); renderTray(); };
      tray.appendChild(t);
    });
  }
  function readImageFile(file) {
    var r = new FileReader();
    r.onload = function () { addPendingImage(r.result); };
    r.readAsDataURL(file);
  }

  function addNote() {
    var text = input.value.replace(/\s+$/, "");
    if (!text && !pending.length) { composer.classList.remove("flash"); void composer.offsetWidth; composer.classList.add("flash"); input.focus(); return; }
    var now = Date.now();
    notes.push({ id: uid(), text: text, images: pending.slice(), pinned: false, created: now, updated: now });
    input.value = ""; pending = []; renderTray(); autoGrow();
    save(); render(); bump();
    list.scrollTop = 0;
    toast("Note added");
  }

  function autoGrow() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 180) + "px"; }

  // ---------- Clipboard ----------
  function copyText(text) {
    var ok = false;
    var ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    ta.remove();
    if (!ok && navigator.clipboard) { navigator.clipboard.writeText(text); ok = true; }
    return ok;
  }

  function dataUrlToPngBlob(dataUrl) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var c = document.createElement("canvas");
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext("2d").drawImage(img, 0, 0);
        c.toBlob(function (b) { b ? resolve(b) : reject(new Error("toBlob failed")); }, "image/png");
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  function writeTempPng(blob) {
    return blob.arrayBuffer().then(function (buf) {
      var file = path.join(os.tmpdir(), "quicknote-" + uid() + ".png");
      fs.writeFileSync(file, Buffer.from(buf));
      return file;
    });
  }

  function nativeCopyImage(file) {
    return new Promise(function (resolve, reject) {
      var cmd, args;
      if (process.platform === "darwin") {
        cmd = "osascript";
        args = ["-e", 'set the clipboard to (read (POSIX file "' + file.replace(/"/g, '\\"') + '") as «class PNGf»)'];
      } else if (process.platform === "win32") {
        cmd = "powershell";
        args = ["-NoProfile", "-STA", "-Command",
          "Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; " +
          "[System.Windows.Forms.Clipboard]::SetImage([System.Drawing.Image]::FromFile('" + file.replace(/'/g, "''") + "'))"];
      } else { reject(new Error("unsupported")); return; }
      cp.execFile(cmd, args, { windowsHide: true }, function (err) { err ? reject(err) : resolve(); });
    });
  }

  function copyImage(dataUrl) {
    return dataUrlToPngBlob(dataUrl).then(function (blob) {
      // 1) Modern async clipboard API
      var tryApi = (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write)
        ? navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
        : Promise.reject(new Error("no api"));
      // 2) Fallback: OS-native clipboard via Node
      return tryApi.catch(function () {
        if (!fs || !cp) throw new Error("Clipboard not available");
        return writeTempPng(blob).then(nativeCopyImage);
      });
    });
  }

  // ---------- Premiere actions ----------
  function saveImageToDisk(dataUrl) {
    return dataUrlToPngBlob(dataUrl).then(function (blob) {
      return blob.arrayBuffer().then(function (buf) {
        if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });
        var file = path.join(IMG_DIR, "note-" + new Date().toISOString().replace(/[:.]/g, "-") + ".png");
        fs.writeFileSync(file, Buffer.from(buf));
        return file;
      });
    });
  }

  function insertTimecode() {
    if (!inPremiere) { toast("Open in Premiere to grab timecode", true); return; }
    evalScript("qnPlayheadTimecode()", function (tc) {
      if (!tc || tc === "EvalScript error.") { toast("No active sequence", true); return; }
      var s = input.selectionStart, e = input.selectionEnd, v = input.value;
      var ins = tc + " — ";
      input.value = v.slice(0, s) + ins + v.slice(e);
      input.focus(); input.selectionStart = input.selectionEnd = s + ins.length;
      autoGrow();
    });
  }

  // ---------- Note interactions ----------
  function findNote(id) { for (var i = 0; i < notes.length; i++) if (notes[i].id === id) return notes[i]; return null; }

  function startEdit(el, n) {
    var textEl = el.querySelector(".note-text");
    if (!textEl || el.querySelector(".note-edit")) return;
    var ta = document.createElement("textarea");
    ta.className = "note-edit";
    ta.value = n.text || "";
    textEl.replaceWith(ta);
    ta.style.height = Math.max(60, ta.scrollHeight + 4) + "px";
    ta.focus(); ta.selectionStart = ta.selectionEnd = ta.value.length;
    var done = false;
    function finish(commit) {
      if (done) return; done = true;
      if (commit && ta.value !== n.text) { n.text = ta.value.replace(/\s+$/, ""); n.updated = Date.now(); save(); toast("Note updated"); }
      render();
    }
    ta.addEventListener("blur", function () { finish(true); });
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); finish(false); }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); finish(true); }
    });
    ta.addEventListener("paste", function (e) {
      var files = imageFilesFrom(e.clipboardData);
      if (!files.length) return;
      e.preventDefault();
      files.forEach(function (f) {
        var r = new FileReader();
        r.onload = function () { n.images = (n.images || []).concat(r.result); n.updated = Date.now(); save(); toast("Image added to note"); };
        r.readAsDataURL(f);
      });
    });
  }

  list.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act]");
    var el = e.target.closest(".note");
    if (!el) return;
    var n = findNote(el.dataset.id);
    if (!n) return;

    if (!btn) {
      if (e.target.tagName === "IMG") openLightbox(e.target.src);
      return;
    }
    var act = btn.dataset.act;
    var card = btn.closest(".img-card");
    var imgSrc = card ? n.images[+card.dataset.k] : null;

    if (act === "copy") {
      if (!n.text) {
        if (n.images && n.images.length) { act = "copy-img"; imgSrc = n.images[0]; }
        else return;
      } else {
        copyText(n.text) ? (flashNote(el), toast("Copied to clipboard")) : toast("Copy failed", true);
        return;
      }
    }
    if (act === "copy-img") {
      copyImage(imgSrc).then(function () { flashNote(el); toast("Image copied"); })
        .catch(function () { toast("Couldn't copy image", true); });
    } else if (act === "edit") {
      startEdit(el, n);
    } else if (act === "pin") {
      n.pinned = !n.pinned; save(); render();
      toast(n.pinned ? "Pinned" : "Unpinned");
    } else if (act === "delete") {
      el.style.maxHeight = el.offsetHeight + "px";
      el.classList.add("removing");
      setTimeout(function () { el.style.maxHeight = "0px"; el.style.paddingTop = el.style.paddingBottom = "0px"; el.style.marginBottom = "-8px"; }, 180);
      setTimeout(function () {
        var removed = n, idx = notes.indexOf(n);
        notes.splice(idx, 1); save(); render(); bump();
        undoToast(function () { notes.splice(idx, 0, removed); save(); render(); bump(); });
      }, 480);
    } else if (act === "save-img") {
      saveImageToDisk(imgSrc).then(function (f) { toast("Saved to " + path.basename(f)); })
        .catch(function () { toast("Couldn't save image", true); });
    } else if (act === "import-img") {
      saveImageToDisk(imgSrc).then(function (f) {
        evalScript("qnImportFile(" + JSON.stringify(f) + ")", function (res) {
          res === "ok" ? toast("Imported to \"Quick Notes\" bin") : toast(res || "Import failed", true);
        });
      }).catch(function () { toast("Couldn't import image", true); });
    }
  });

  list.addEventListener("dblclick", function (e) {
    var t = e.target.closest(".note-text");
    if (!t) return;
    var el = t.closest(".note"), n = findNote(el.dataset.id);
    if (n) startEdit(el, n);
  });

  function flashNote(el) { el.classList.remove("copied"); void el.offsetWidth; el.classList.add("copied"); }

  function undoToast(onUndo) {
    var t = document.createElement("div");
    t.className = "toast err";
    t.style.pointerEvents = "auto";
    t.innerHTML = '<span class="dot"></span>Note deleted <button style="margin-left:6px;background:none;border:0;color:var(--accent-2);font-weight:700;padding:0">Undo</button>';
    var gone = false;
    t.querySelector("button").onclick = function () { if (gone) return; gone = true; onUndo(); close(); };
    function close() { t.classList.add("out"); setTimeout(function () { t.remove(); }, 300); }
    $("toasts").appendChild(t);
    setTimeout(function () { if (!gone) { gone = true; close(); } }, 4000);
  }

  // ---------- Lightbox ----------
  function openLightbox(src) { $("lightboxImg").src = src; $("lightbox").classList.add("open"); }
  $("lightbox").addEventListener("click", function () { this.classList.remove("open"); });

  // ---------- Paste / drop ----------
  function imageFilesFrom(dt) {
    var out = [];
    if (!dt) return out;
    if (dt.items) {
      for (var i = 0; i < dt.items.length; i++) {
        var it = dt.items[i];
        if (it.kind === "file" && it.type.indexOf("image/") === 0) { var f = it.getAsFile(); if (f) out.push(f); }
      }
    }
    if (!out.length && dt.files) {
      for (var j = 0; j < dt.files.length; j++) if (dt.files[j].type.indexOf("image/") === 0) out.push(dt.files[j]);
    }
    return out;
  }

  document.addEventListener("paste", function (e) {
    if (e.target.classList && e.target.classList.contains("note-edit")) return; // handled in startEdit
    if (e.target.id === "search") return;
    var files = imageFilesFrom(e.clipboardData);
    if (files.length) {
      e.preventDefault();
      files.forEach(readImageFile);
      composer.classList.remove("flash"); void composer.offsetWidth; composer.classList.add("flash");
      return;
    }
    // Text pasted while focus is outside the composer → route it in.
    if (e.target !== input) {
      var text = e.clipboardData && e.clipboardData.getData("text/plain");
      if (text) { e.preventDefault(); input.value += (input.value ? "\n" : "") + text; input.focus(); autoGrow(); }
    }
  });

  var dragDepth = 0;
  composer.addEventListener("dragenter", function (e) { e.preventDefault(); dragDepth++; composer.classList.add("dragging"); });
  composer.addEventListener("dragover", function (e) { e.preventDefault(); });
  composer.addEventListener("dragleave", function () { if (--dragDepth <= 0) { dragDepth = 0; composer.classList.remove("dragging"); } });
  composer.addEventListener("drop", function (e) {
    e.preventDefault(); dragDepth = 0; composer.classList.remove("dragging");
    imageFilesFrom(e.dataTransfer).forEach(readImageFile);
  });
  // stop the panel from navigating to dropped files elsewhere
  document.addEventListener("dragover", function (e) { e.preventDefault(); });
  document.addEventListener("drop", function (e) { e.preventDefault(); });

  // ---------- Wiring ----------
  $("btnAdd").addEventListener("click", function (e) { ripple(this, e); addNote(); });
  $("btnTimecode").addEventListener("click", insertTimecode);
  $("btnImage").addEventListener("click", function () { $("fileInput").click(); });
  $("fileInput").addEventListener("change", function () { Array.prototype.forEach.call(this.files, readImageFile); this.value = ""; });
  input.addEventListener("input", autoGrow);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); addNote(); }
  });
  $("search").addEventListener("input", function () { query = this.value.trim(); render(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") $("lightbox").classList.remove("open");
  });

  // Make sure Premiere hands Ctrl/Cmd+C / V / X / A / Z to the panel.
  if (inPremiere && window.__adobe_cep__.registerKeyEventsInterest) {
    var keys = [];
    // Windows virtual key codes: A C V X Z (+ Enter)
    [65, 67, 86, 88, 90, 13].forEach(function (k) { keys.push({ keyCode: k, ctrlKey: true }); });
    // macOS virtual key codes: A=0 Z=6 X=7 C=8 V=9 Return=36
    [0, 6, 7, 8, 9, 36].forEach(function (k) { keys.push({ keyCode: k, metaKey: true }); });
    try { window.__adobe_cep__.registerKeyEventsInterest(JSON.stringify(keys)); } catch (e) {}
  }

  // Refresh relative times every minute
  setInterval(function () {
    if (document.querySelector(".note-edit")) return;
    document.querySelectorAll(".note").forEach(function (el) {
      var n = findNote(el.dataset.id), m = el.querySelector(".note-meta");
      if (n && m) m.textContent = timeAgo(n.created) + (n.updated && n.updated !== n.created ? " · edited" : "") + (n.images && n.images.length ? " · " + n.images.length + " img" : "");
    });
  }, 60000);

  load();
  render();
  setTimeout(function () { input.focus(); }, 300);
})();
