import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { parseKey, dateKey, addDays, hm } from './utils/date';
import { subjectOf, live } from './store';

const CH = 'reminders';
const { SchedulableTriggerInputTypes: TT } = Notifications;

export async function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CH, {
      name: 'Study reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: '#E8434B',
    });
  }
  await Notifications.setNotificationCategoryAsync('task', [
    { identifier: 'start', buttonTitle: '▶ Start timer', options: { opensAppToForeground: true } },
    { identifier: 'snooze', buttonTitle: '⏰ Snooze 5m', options: { opensAppToForeground: true } },
  ]);
}

export async function ensurePermission() {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

function taskContent(task, subjects, buddy, lead) {
  const s = subjectOf(subjects, task.subjectId);
  return {
    title: `${s.emoji || '📚'} ${s.name} ${lead ? `starts in ${lead} min` : 'starts now'}`,
    body: `${task.title} · ${hm(task.start)}${task.end != null ? '–' + hm(task.end) : ''}. ${buddy} is ready! 🍎`,
    data: { taskId: task.id, kind: 'task' },
    categoryIdentifier: 'task',
    sound: 'default',
  };
}

let running = Promise.resolve();
/** Cancel and re-create every task reminder + daily nudges. Safe to call often. */
export function rescheduleAll(state) {
  running = running.then(() => doReschedule(state)).catch((e) => console.warn('reschedule', e?.message));
  return running;
}

async function doReschedule({ tasks, subjects, settings, profile, activeToday, exams = [] }) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith('task-') || n.identifier.startsWith('nudge-') || n.identifier.startsWith('exam-'))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return;
  const buddy = profile.buddyName || 'Appy';
  const now = Date.now();

  if (settings.reminders) {
    for (const t of live(tasks)) {
      if (t.start == null || t.reminderMin == null || t.reminderMin < 0) continue;
      const at = t.start - t.reminderMin;
      if (at < 0) continue;
      const hour = Math.floor(at / 60);
      const minute = at % 60;
      const content = taskContent(t, subjects, buddy, t.reminderMin);
      const sched = (suffix, trigger) =>
        Notifications.scheduleNotificationAsync({ identifier: `task-${t.id}-${suffix}`, content, trigger: { ...trigger, channelId: CH } });
      if (t.repeat === 'daily') await sched('d', { type: TT.DAILY, hour, minute });
      else if (t.repeat === 'weekdays') {
        for (let wd = 2; wd <= 6; wd++) await sched('w' + wd, { type: TT.WEEKLY, weekday: wd, hour, minute });
      } else if (t.repeat === 'weekly') {
        await sched('w', { type: TT.WEEKLY, weekday: parseKey(t.date).getDay() + 1, hour, minute });
      } else {
        if ((t.completedDates || []).includes(t.date)) continue;
        const d = parseKey(t.date);
        d.setHours(hour, minute, 0, 0);
        if (d.getTime() > now) await sched('o', { type: TT.DATE, date: d });
      }
    }
  }

  if (settings.reminders) {
    for (const e of live(exams)) {
      const s = subjectOf(subjects, e.subjectId);
      const eve = parseKey(addDays(e.date, -1));
      eve.setHours(18, 0, 0, 0);
      const morn = parseKey(e.date);
      morn.setHours(7, 30, 0, 0);
      const items = [
        [eve, `📅 ${e.title} is tomorrow!`, `Quick revision tonight? ${buddy} believes in you 🍎`, 'eve'],
        [morn, `🍀 ${e.title} today — good luck!`, `You’ve prepared for this. ${buddy} is cheering for you 💪`, 'day'],
      ];
      for (const [d, title, body, k] of items) {
        if (d.getTime() <= now) continue;
        await Notifications.scheduleNotificationAsync({
          identifier: `exam-${e.id}-${k}`,
          content: { title, body, sound: 'default', data: { kind: 'exam', subject: s.name } },
          trigger: { type: TT.DATE, date: d, channelId: CH },
        });
      }
    }
  }

  if (settings.nudges) {
    for (let i = 0; i < 3; i++) {
      const day = addDays(dateKey(), i);
      if (i === 0 && activeToday) continue;
      const d = parseKey(day);
      d.setHours(19, 0, 0, 0);
      if (d.getTime() <= now) continue;
      await Notifications.scheduleNotificationAsync({
        identifier: `nudge-${day}`,
        content: {
          title: `🥺 ${buddy} misses you…`,
          body: 'You haven’t studied today. Just 25 minutes?',
          data: { kind: 'nudge' },
          sound: 'default',
        },
        trigger: { type: TT.DATE, date: d, channelId: CH },
      });
    }
  }
}

export async function scheduleTimerEnd(endAt, title, body) {
  await cancelTimerEnd();
  if (endAt <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({
    identifier: 'timer-end',
    content: { title, body, sound: 'default', data: { kind: 'timer' } },
    trigger: { type: TT.DATE, date: new Date(endAt), channelId: CH },
  });
}
export const cancelTimerEnd = () => Notifications.cancelScheduledNotificationAsync('timer-end').catch(() => {});

export async function snoozeTask(task, subjects, buddy) {
  await Notifications.scheduleNotificationAsync({
    identifier: `snooze-${task.id}-${Date.now()}`,
    content: taskContent(task, subjects, buddy, 0),
    trigger: { type: TT.TIME_INTERVAL, seconds: 300, channelId: CH },
  });
}

export const getScheduled = () => Notifications.getAllScheduledNotificationsAsync();
