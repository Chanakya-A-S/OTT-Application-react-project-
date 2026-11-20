import { useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Sun, Moon, MonitorSmartphone, BellRing, Download, Upload, RotateCcw, Target, Camera, Check, ShieldCheck, ChevronRight } from 'lucide-react'
import { useStore } from '../store.jsx'
import { Screen, Segmented, Logo, Avatar } from '../components/ui.jsx'
import { compressImage } from '../utils.js'
import { openNotificationSettings } from '../native.js'

export const ACCENTS = [
  { c: '#b5e550', n: 'Lime' },
  { c: '#7cf05b', n: 'Neon' },
  { c: '#5be3a6', n: 'Mint' },
  { c: '#4fd6ff', n: 'Sky' },
  { c: '#b69cff', n: 'Violet' },
  { c: '#ff8fcf', n: 'Pink' },
  { c: '#ffd84d', n: 'Gold' },
]

export default function Settings({ go, openImport }) {
  const { state, setSettings, setProfile, importAll, resetAll, isNative, notifAccess } = useStore()
  const { settings, profile } = state
  const fileRef = useRef()
  const photoRef = useRef()

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `montra-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  return (
    <Screen>
      <header className="top center">
        <motion.button whileTap={{ scale: 0.9 }} className="icon-btn" onClick={() => go('home')}><ArrowLeft size={20} /></motion.button>
        <h2>Settings</h2>
        <span style={{ width: 44 }} />
      </header>

      <section className="card">
        <h4 className="set-h">Profile</h4>
        <div className="profile-edit">
          <motion.button whileTap={{ scale: 0.94 }} onClick={() => photoRef.current.click()} aria-label="Change profile photo" style={{ position: 'relative' }}>
            <Avatar profile={profile} size={78} />
            <span className="cam-badge"><Camera size={14} /></span>
          </motion.button>
          <input ref={photoRef} type="file" accept="image/*" hidden onChange={async (e) => {
            const f = e.target.files?.[0]
            if (f) setProfile({ photo: await compressImage(f, 400, 0.85) })
            e.target.value = ''
          }} />
          <div style={{ flex: 1 }}>
            <input className="name-input" value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} placeholder="Your name" />
            <div className="row">
              <button className="btn sm" onClick={() => photoRef.current.click()}>{profile.photo ? 'Change photo' : 'Add photo'}</button>
              {profile.photo && <button className="btn sm ghost" onClick={() => setProfile({ photo: null })}>Remove</button>}
            </div>
          </div>
        </div>
        <label className="set-row"><Target size={18} /><span>Monthly budget (₹)</span><input inputMode="numeric" value={settings.budget} onChange={(e) => setSettings({ budget: +e.target.value.replace(/\D/g, '') || 0 })} /></label>
      </section>

      <section className="card">
        <h4 className="set-h">Theme</h4>
        <Segmented id="theme" value={settings.theme} onChange={(theme) => setSettings({ theme })} options={[
          { value: 'light', label: <><Sun size={14} /> Light</> },
          { value: 'dark', label: <><Moon size={14} /> Dark</> },
          { value: 'system', label: <><MonitorSmartphone size={14} /> Auto</> },
        ]} />
      </section>

      <section className="card">
        <h4 className="set-h">Customization</h4>
        <span className="set-sub">Accent colour <small>(Loans always uses orange)</small></span>
        <div className="accent-grid">
          {ACCENTS.map((a) => (
            <motion.button key={a.c} whileTap={{ scale: 0.85 }} title={a.n} aria-label={`${a.n} accent`} className={`accent-dot ${settings.accent === a.c ? 'on' : ''}`} style={{ background: a.c }} onClick={() => setSettings({ accent: a.c })}>
              {settings.accent === a.c && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={16} strokeWidth={3} /></motion.span>}
            </motion.button>
          ))}
        </div>
        <span className="set-sub">Home card style</span>
        <Segmented id="hero" value={settings.heroStyle || 'dark'} onChange={(heroStyle) => setSettings({ heroStyle })} options={[
          { value: 'dark', label: 'Black' },
          { value: 'accent', label: 'Accent' },
        ]} />
      </section>

      <section className="card">
        <h4 className="set-h">Notifications</h4>
        {isNative && (
          <motion.button whileTap={{ scale: 0.98 }} className="access" onClick={openNotificationSettings}>
            <ShieldCheck size={20} className={notifAccess ? 'ok' : ''} />
            <span>Notification access<small className={notifAccess ? 'ok' : ''}>{notifAccess ? 'On, reading bank & UPI alerts' : 'Off, tap to allow'}</small></span>
            <ChevronRight size={18} />
          </motion.button>
        )}
        <div className="set-row">
          <BellRing size={18} />
          <span>Auto-add detected transactions<small>Off = review them in the inbox first</small></span>
          <button className={`switch ${settings.autoAdd ? 'on' : ''}`} onClick={() => setSettings({ autoAdd: !settings.autoAdd })} aria-label="Toggle auto add">
            <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 32 }} />
          </button>
        </div>
        {!isNative && (
          <p className="muted small">
            The Montra Android app reads bank, UPI &amp; wallet notifications (GPay, PhonePe, Paytm, bank SMS) once you allow
            <b> Notification access</b>. In the browser, use <b>Share → Montra</b> or paste them.
          </p>
        )}
        <button className="btn ghost block" onClick={openImport}>Paste notifications manually</button>
      </section>

      <section className="card">
        <h4 className="set-h">Data</h4>
        <button className="set-row btnrow" onClick={exportData}><Download size={18} /><span>Export backup (JSON)</span></button>
        <button className="set-row btnrow" onClick={() => fileRef.current.click()}><Upload size={18} /><span>Restore from backup</span></button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f) try { importAll(JSON.parse(await f.text())) } catch { alert('That file is not a Montra backup.') }
        }} />
        <button className="set-row btnrow neg" onClick={() => confirm('Delete all data on this device?') && resetAll()}><RotateCcw size={18} /><span>Reset everything</span></button>
      </section>

      <section className="card brand">
        <Logo size={48} />
        <div><strong>Montra</strong><small>Your on-device money tracker · v1.0</small></div>
      </section>
    </Screen>
  )
}
