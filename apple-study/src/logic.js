import { dateKey, parseKey, addDays, diffDays, nowMin } from './utils/date';

export function occursOn(task, day) {
  if (task.deleted) return false;
  const start = task.date || day;
  if (task.repeat === 'daily') return day >= start;
  if (task.repeat === 'weekdays') {
    const wd = parseKey(day).getDay();
    return day >= start && wd >= 1 && wd <= 5;
  }
  if (task.repeat === 'weekly') return day >= start && parseKey(day).getDay() === parseKey(start).getDay();
  return start === day;
}

export const isDone = (task, day) => (task.completedDates || []).includes(day);

export function tasksForDay(tasks, day) {
  return tasks
    .filter((t) => occursOn(t, day))
    .sort((a, b) => (a.start ?? 9999) - (b.start ?? 9999));
}

const sessionDay = (s) => dateKey(new Date(s.start));

export function focusMinutesOn(sessions, day) {
  return sessions
    .filter((s) => !s.deleted && sessionDay(s) === day)
    .reduce((a, s) => a + (s.end - s.start) / 60000, 0);
}

/** Set of day keys with any study activity. */
export function activeDays(tasks, todos, sessions) {
  const set = new Set();
  tasks.forEach((t) => !t.deleted && (t.completedDates || []).forEach((d) => set.add(d)));
  todos.forEach((t) => !t.deleted && t.done && t.doneAt && set.add(dateKey(new Date(t.doneAt))));
  sessions.forEach((s) => !s.deleted && (s.end - s.start) >= 5 * 60000 && set.add(sessionDay(s)));
  return set;
}

export function streakOf(days) {
  let d = dateKey();
  if (!days.has(d)) d = addDays(d, -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function computeStats({ tasks, todos, sessions }) {
  const today = dateKey();
  const todays = tasksForDay(tasks, today);
  const doneToday = todays.filter((t) => isDone(t, today)).length;
  const todosDoneToday = todos.filter((t) => !t.deleted && t.done && t.doneAt && dateKey(new Date(t.doneAt)) === today).length;
  const minutesToday = focusMinutesOn(sessions, today);
  const days = activeDays(tasks, todos, sessions);
  const streak = streakOf(days);
  const sorted = [...days].sort();
  const lastActive = sorted[sorted.length - 1] || null;
  const totalCompletions = tasks.reduce((a, t) => a + (t.deleted ? 0 : (t.completedDates || []).length), 0);
  const totalTodos = todos.filter((t) => !t.deleted && t.done).length;
  const totalMinutes = sessions.reduce((a, s) => a + (s.deleted ? 0 : (s.end - s.start) / 60000), 0);
  const monthPrefix = today.slice(0, 7);
  const monthMinutes = sessions
    .filter((s) => !s.deleted && sessionDay(s).startsWith(monthPrefix))
    .reduce((a, s) => a + (s.end - s.start) / 60000, 0);
  const xp = Math.round(totalCompletions * 20 + totalTodos * 5 + totalMinutes);
  const level = Math.floor(xp / 200) + 1;
  const overdue = todays.filter((t) => !isDone(t, today) && t.end != null && t.end < nowMin()).length;
  return {
    today, todays, doneToday, total: todays.length, todosDoneToday, minutesToday, streak, lastActive,
    totalCompletions, monthMinutes, xp, level, levelProgress: (xp % 200) / 200, overdue,
    activeToday: days.has(today),
  };
}

export const LEVEL_TITLES = ['Seedling', 'Sprout', 'Sapling', 'Learner', 'Achiever', 'Scholar', 'Scholar', 'Expert', 'Expert', 'Master', 'Genius'];
export const levelTitle = (lv) => LEVEL_TITLES[Math.min(lv - 1, LEVEL_TITLES.length - 1)];

/**
 * Buddy mood follows activity:
 * excited – big progress today, happy – some progress, neutral – nothing yet (early),
 * sad – nothing studied today (afternoon onwards / overdue tasks), sleepy – inactive 2+ days.
 */
export function moodOf(st) {
  const hour = new Date().getHours();
  if (st.doneToday + st.todosDoneToday >= 4 || st.minutesToday >= 120) return 'excited';
  if (st.doneToday >= 1 || st.minutesToday >= 20 || st.todosDoneToday >= 2) return 'happy';
  // Only sleepy after real inactivity — a brand-new user starts out ready, not asleep.
  if (st.lastActive && diffDays(st.today, st.lastActive) >= 2) return 'sleepy';
  if (hour >= 14 || st.overdue > 0) return 'sad';
  return 'neutral';
}

export function moodMessage(mood, name, st) {
  const left = Math.max(0, st.total - st.doneToday);
  switch (mood) {
    case 'excited':
      return { title: `${name} is dancing! 💃`, sub: 'You are on fire today — legendary!', bubble: '“We’re unstoppable today!” 🎉' };
    case 'happy':
      return {
        title: `${name} is proud of you!`,
        sub: left ? `${left} more task${left > 1 ? 's' : ''} to make ${name} dance 💃` : 'Everything done — take a break 🌈',
        bubble: '“We’re crushing it today!” 🍎',
      };
    case 'sad':
      return { title: `${name} feels a bit down…`, sub: 'No study yet today. Just 25 minutes?', bubble: '“We haven’t studied today… 🥺”' };
    case 'sleepy':
      return { title: `${name} fell asleep 😴`, sub: 'Wake them up by finishing a task!', bubble: '“Zzz… wake me with a task?” 😴' };
    default:
      return { title: `${name} is ready to learn`, sub: 'Start your first task of the day ✨', bubble: '“Let’s start something small!” 🌱' };
  }
}
