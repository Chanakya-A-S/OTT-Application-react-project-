import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uid, dateKey } from './utils/date';

export const SYNCED = ['subjects', 'tasks', 'todos', 'notes', 'sessions', 'blocks', 'exams'];

export const DEFAULT_SUBJECTS = [
  { id: 'maths', name: 'Maths', color: '#5B8DEF', emoji: '📐' },
  { id: 'physics', name: 'Physics', color: '#9B7BEA', emoji: '🔭' },
  { id: 'chemistry', name: 'Chemistry', color: '#3DBE8B', emoji: '⚗️' },
  { id: 'english', name: 'English', color: '#F5A623', emoji: '📖' },
  { id: 'biology', name: 'Biology', color: '#2EC4C4', emoji: '🧬' },
  { id: 'history', name: 'History', color: '#E86A92', emoji: '🏛️' },
].map((s) => ({ ...s, updatedAt: 1 }));

export const APPLE_COLORS = {
  red: '#E8343E',
  green: '#7BC043',
  yellow: '#F5B82E',
  purple: '#B36BE0',
  pink: '#FF7AA8',
};

const initialData = () => ({
  profile: { userName: '', buddyName: 'Appy', color: 'red', accessory: '', face: 'glasses', onboarded: false, updatedAt: 0 },
  subjects: DEFAULT_SUBJECTS,
  tasks: [],
  todos: [],
  notes: [],
  sessions: [],
  blocks: [],
  exams: [],
  timer: { mode: 'focus', running: false, startedAt: null, accumulated: 0, subjectId: 'maths', taskId: null, round: 1 },
});

// The sync layer registers itself here so the store does not import Firebase.
let sink = null;
export const setSyncSink = (fn) => {
  sink = fn;
};
const push = (col, item) => sink && sink(col, item);

export const useStore = create(
  persist(
    (set, get) => ({
      hydrated: false,
      account: { uid: null, email: null, guest: false },
      settings: {
        mode: 'system',
        theme: 'red',
        reminders: true,
        nudges: true,
        animations: true,
        haptics: true,
        focusMin: 25,
        shortMin: 5,
        longMin: 15,
        defaultReminder: 10,
        updatedAt: 0,
      },
      celebration: null,
      ...initialData(),

      setAccount: (a) => set({ account: { ...get().account, ...a } }),

      upsert: (col, item) => {
        const it = { ...item, id: item.id || uid(), updatedAt: Date.now() };
        if (!it.createdAt) it.createdAt = it.updatedAt;
        set({ [col]: [...get()[col].filter((x) => x.id !== it.id), it] });
        push(col, it);
        return it;
      },
      remove: (col, id) => {
        const cur = get()[col].find((x) => x.id === id);
        if (!cur) return;
        const it = { ...cur, deleted: true, updatedAt: Date.now() };
        set({ [col]: [...get()[col].filter((x) => x.id !== id), it] });
        push(col, it);
      },
      /** Merge items that came from the cloud; newest updatedAt wins. Returns local items the cloud is missing/older on. */
      mergeRemote: (col, remote) => {
        const local = get()[col];
        const map = new Map(local.map((x) => [x.id, x]));
        const remoteIds = new Map(remote.map((x) => [x.id, x]));
        let changed = false;
        for (const r of remote) {
          const l = map.get(r.id);
          if (!l || (r.updatedAt || 0) > (l.updatedAt || 0)) {
            map.set(r.id, r);
            changed = true;
          }
        }
        if (changed) set({ [col]: [...map.values()] });
        return local.filter((l) => {
          const r = remoteIds.get(l.id);
          return !r || (l.updatedAt || 0) > (r.updatedAt || 0);
        });
      },
      setProfile: (patch, fromRemote) => {
        const p = { ...get().profile, ...patch, updatedAt: fromRemote ? patch.updatedAt : Date.now() };
        set({ profile: p });
        if (!fromRemote) push('meta', { id: 'profile', ...p });
      },
      setSettings: (patch, fromRemote) => {
        const s = { ...get().settings, ...patch, updatedAt: fromRemote ? patch.updatedAt : Date.now() };
        set({ settings: s });
        if (!fromRemote) push('meta', { id: 'settings', ...s });
      },

      /** Toggle completion of a task occurrence. Returns true when it became completed. */
      toggleTask: (task, day = dateKey()) => {
        const done = (task.completedDates || []).includes(day);
        const completedDates = done
          ? task.completedDates.filter((d) => d !== day)
          : [...(task.completedDates || []), day];
        get().upsert('tasks', { ...task, completedDates, completedAt: done ? task.completedAt : Date.now() });
        if (!done) get().celebrate({ title: task.title, kind: 'task' });
        return !done;
      },
      toggleTodo: (todo) => {
        const done = !todo.done;
        get().upsert('todos', { ...todo, done, doneAt: done ? Date.now() : null });
        if (done) get().celebrate({ title: todo.text, kind: 'todo', small: true });
      },
      celebrate: (c) => set({ celebration: { ...c, at: Date.now() } }),
      clearCelebration: () => set({ celebration: null }),

      setTimer: (patch) => set({ timer: { ...get().timer, ...patch } }),

      resetData: () => set({ ...initialData(), account: { uid: null, email: null, guest: false } }),
    }),
    {
      name: 'apple-study-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => {
        const { celebration, hydrated, ...rest } = s;
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function'));
      },
      onRehydrateStorage: () => () => {
        // v1.0 had one accessory slot; glasses now live in the separate face slot.
        const p = useStore.getState().profile;
        if (p && p.face === undefined) {
          const isFace = ['glasses', 'sunglasses'].includes(p.accessory);
          useStore.setState({ profile: { ...p, face: isFace ? p.accessory : '', accessory: isFace ? '' : p.accessory || '' } });
        }
        useStore.setState({ hydrated: true });
      },
    }
  )
);

/** Live (non-deleted) items of a collection. */
export const live = (arr) => arr.filter((x) => !x.deleted);

export const subjectOf = (subjects, id) =>
  subjects.find((s) => s.id === id && !s.deleted) || { id: 'none', name: 'General', color: '#9C8B8E', emoji: '📌' };
