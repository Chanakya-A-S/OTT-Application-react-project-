import { Capacitor, registerPlugin } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'

export const isNative = Capacitor.isNativePlatform()
const Notif = isNative ? registerPlugin('MontraNotifications') : null

/** Whether Android "Notification access" is granted (always false on the web). */
export async function notificationAccess() {
  if (!Notif) return false
  try { return (await Notif.isEnabled()).enabled } catch { return false }
}
export const openNotificationSettings = () => Notif?.openSettings()

/**
 * Feeds every captured bank/UPI notification into `ingest(text, meta)`.
 * Pulls the queue collected while the app was closed, listens live while open,
 * and re-pulls whenever the app comes back to the foreground.
 */
export function startNotificationSync(ingest, onAccessChange) {
  if (!Notif) return () => {}
  const drain = async () => {
    try {
      const { items } = await Notif.drain()
      items.forEach((i) => ingest(i.text, { app: i.app, time: i.time }))
    } catch { /* ignore */ }
    onAccessChange?.(await notificationAccess())
  }
  drain()
  const live = Notif.addListener('notification', (i) => { ingest(i.text, { app: i.app, time: i.time }); Notif.drain() })
  const resume = CapApp.addListener('resume', drain)
  return () => { live.then((h) => h.remove()); resume.then((h) => h.remove()) }
}

/** Android hardware back button: run `handler`; if it returns false, minimise the app. */
export function onBackButton(handler) {
  if (!isNative) return () => {}
  const h = CapApp.addListener('backButton', () => { if (!handler()) CapApp.minimizeApp() })
  return () => h.then((x) => x.remove())
}
