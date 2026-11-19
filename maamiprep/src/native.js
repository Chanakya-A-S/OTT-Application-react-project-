import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const native = Capacitor.isNativePlatform();

export async function buzz(heavy) {
  try { if (native) await Haptics.impact({ style: heavy ? ImpactStyle.Heavy : ImpactStyle.Light }); else navigator.vibrate?.(heavy ? 120 : 30); } catch { /* ignore */ }
}

export async function askNotif() {
  if (!native) { try { return (await Notification.requestPermission()) === 'granted'; } catch { return false; } }
  try { const p = await LocalNotifications.requestPermissions(); return p.display === 'granted'; } catch { return false; }
}

let channelsMade = false;
async function channels() {
  if (!native || channelsMade) return;
  channelsMade = true;
  try {
    await LocalNotifications.createChannel({ id: 'alarm', name: 'Study timer alarm', importance: 5, sound: 'alarm.wav', vibration: true, visibility: 1 });
    await LocalNotifications.createChannel({ id: 'flash', name: 'Flash cards', importance: 4, vibration: true, visibility: 1 });
  } catch { /* ignore */ }
}

// Timer alarm: id 9000
export async function scheduleAlarm(at, body) {
  if (!native) return;
  await channels();
  try {
    await LocalNotifications.cancel({ notifications: [{ id: 9000 }] });
    await LocalNotifications.schedule({ notifications: [{ id: 9000, title: '⏰ MaamiPrep – Time up!', body, channelId: 'alarm', sound: 'alarm.wav', schedule: { at: new Date(at), allowWhileIdle: true } }] });
  } catch { /* ignore */ }
}
export async function cancelAlarm() { if (!native) return; try { await LocalNotifications.cancel({ notifications: [{ id: 9000 }] }); } catch { /* ignore */ } }

// Flash card reminders: ids 1000..1023
export async function scheduleFlash(cards, everyHours) {
  if (!native) return;
  await channels();
  const ids = Array.from({ length: 24 }, (_, i) => ({ id: 1000 + i }));
  try { await LocalNotifications.cancel({ notifications: ids }); } catch { /* ignore */ }
  if (!cards.length) return;
  const now = Date.now();
  const list = Array.from({ length: 24 }, (_, i) => {
    const c = cards[i % cards.length];
    let at = new Date(now + (i + 1) * everyHours * 3600000);
    // keep reminders between 7 AM and 10 PM
    if (at.getHours() >= 22 || at.getHours() < 7) { at.setHours(at.getHours() >= 22 ? 24 + 7 : 7, 0, 0, 0); }
    return { id: 1000 + i, title: `⚡ Flash card – ${c.topicTitle}`, body: `${c.front}\n👉 ${c.back}`, largeBody: `${c.front}\n\n👉 ${c.back}`, channelId: 'flash', schedule: { at, allowWhileIdle: true } };
  });
  try { await LocalNotifications.schedule({ notifications: list }); } catch { /* ignore */ }
}
export async function cancelFlash() {
  if (!native) return;
  try { await LocalNotifications.cancel({ notifications: Array.from({ length: 24 }, (_, i) => ({ id: 1000 + i })) }); } catch { /* ignore */ }
}

// In-app alarm sound with WebAudio (loops until stopped)
let ctx, loop;
export function startRing() {
  stopRing();
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const beep = () => {
      [0, 0.18, 0.36].forEach(off => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'square'; o.frequency.value = 880 + off * 400;
        g.gain.setValueAtTime(0.0001, ctx.currentTime + off);
        g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + off + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + off + 0.15);
        o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + off); o.stop(ctx.currentTime + off + 0.16);
      });
      navigator.vibrate?.([200, 100, 200]);
    };
    beep(); loop = setInterval(beep, 1000);
  } catch { /* ignore */ }
}
export function stopRing() { if (loop) clearInterval(loop); loop = null; }
export function chime(good = true) {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = good ? [523, 659, 784, 1046] : [392, 330];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = f;
      const t = ctx.currentTime + i * 0.11; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.32);
    });
  } catch { /* ignore */ }
}
