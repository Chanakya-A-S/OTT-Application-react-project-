import { collection, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useStore, setSyncSink, SYNCED } from './store';
import { ensureLocalImage, readImageBase64 } from './images';

/**
 * Firestore layout (per user):
 *   users/{uid}/{subjects|tasks|todos|notes|sessions|blocks}/{id}
 *   users/{uid}/meta/{profile|settings}
 *   users/{uid}/images/{imageId}   { data: base64 jpeg }
 * Local store is the source of truth; each change is pushed, remote changes are merged (newest wins).
 */
let unsubs = [];
let currentUid = null;

const clean = (o) => JSON.parse(JSON.stringify(o));

async function pushItem(col, item) {
  if (!currentUid || !db) return;
  try {
    await setDoc(doc(db, 'users', currentUid, col, item.id), clean(item));
    if (col === 'notes' && !item.deleted) await pushNoteImages(item);
  } catch (e) {
    console.warn('sync push failed', col, e?.message);
  }
}

async function pushNoteImages(note) {
  for (const b of note.blocks || []) {
    if (b.type !== 'image' || !b.imageId) continue;
    const ref = doc(db, 'users', currentUid, 'images', b.imageId);
    const snap = await getDoc(ref);
    if (snap.exists()) continue;
    const data = await readImageBase64(b.imageId);
    if (data && data.length < 950000) await setDoc(ref, { data });
  }
}

async function pullNoteImages(notes) {
  for (const n of notes) {
    for (const b of n.blocks || []) {
      if (b.type !== 'image' || !b.imageId) continue;
      await ensureLocalImage(b.imageId, async () => {
        const snap = await getDoc(doc(db, 'users', currentUid, 'images', b.imageId));
        return snap.exists() ? snap.data().data : null;
      });
    }
  }
}

export function startSync(uid) {
  stopSync();
  if (!db || !uid) return;
  currentUid = uid;
  setSyncSink((col, item) => pushItem(col, item));
  const st = useStore.getState;

  SYNCED.forEach((col) => {
    let first = true;
    const u = onSnapshot(
      collection(db, 'users', uid, col),
      (snap) => {
        const remote = snap.docs.map((d) => d.data());
        const missing = st().mergeRemote(col, remote);
        if (col === 'notes') pullNoteImages(remote.filter((n) => !n.deleted));
        if (first) {
          first = false;
          missing.forEach((it) => pushItem(col, it));
        }
      },
      (e) => console.warn('sync listen failed', col, e?.message)
    );
    unsubs.push(u);
  });

  ['profile', 'settings'].forEach((key) => {
    let first = true;
    const u = onSnapshot(doc(db, 'users', uid, 'meta', key), (snap) => {
      const local = st()[key];
      const remote = snap.exists() ? snap.data() : null;
      if (remote && (remote.updatedAt || 0) > (local.updatedAt || 0)) {
        const { id, ...rest } = remote;
        key === 'profile' ? st().setProfile(rest, true) : st().setSettings(rest, true);
      } else if (first && (!remote || (local.updatedAt || 0) > (remote.updatedAt || 0))) {
        pushItem('meta', { id: key, ...local });
      }
      first = false;
    });
    unsubs.push(u);
  });
}

export function stopSync() {
  unsubs.forEach((u) => u());
  unsubs = [];
  currentUid = null;
  setSyncSink(null);
}
