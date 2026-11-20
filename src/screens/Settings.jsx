import { useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Sun, Moon, MonitorSmartphone, BellRing, Download, Upload, RotateCcw, Target, User } from 'lucide-react'
import { useStore } from '../store.jsx'
import { Screen, Segmented, Logo } from '../components/ui.jsx'

export default function Settings({ go, openImport }) {
  const { state, setSettings, setProfile, importAll, resetAll } = useStore()
  const { settings, profile } = state
  const fileRef = useRef()

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `purrse-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  return (
    <Screen>
      <header className="top center">
        <motion.button whileTap={{ scale: 0.9 }} className="icon-btn" onClick={() => go('home')}><ArrowLeft size={20} /></motion.button>
        <h2>Settings</h2>
        <span style={{ width: 44 }} />
      </header>

      <section className="card brand">
        <Logo size={56} />
        <div><strong>Purrse</strong><small>Your on-device money tracker</small></div>
      </section>

      <section className="card">
        <h4 className="set-h">Appearance</h4>
        <Segmented id="theme" value={settings.theme} onChange={(theme) => setSettings({ theme })} options={[
          { value: 'light', label: <><Sun size={14} /> Light</> },
          { value: 'dark', label: <><Moon size={14} /> Dark</> },
          { value: 'system', label: <><MonitorSmartphone size={14} /> Auto</> },
        ]} />
      </section>

      <section className="card">
        <h4 className="set-h">Profile &amp; budget</h4>
        <label className="set-row"><User size={18} /><span>Name</span><input value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} /></label>
        <label className="set-row"><Target size={18} /><span>Monthly budget (₹)</span><input inputMode="numeric" value={settings.budget} onChange={(e) => setSettings({ budget: +e.target.value.replace(/\D/g, '') || 0 })} /></label>
      </section>

      <section className="card">
        <h4 className="set-h">Notifications</h4>
        <div className="set-row">
          <BellRing size={18} />
          <span>Auto-add detected transactions<small>Off = review them in the inbox first</small></span>
          <button className={`switch ${settings.autoAdd ? 'on' : ''}`} onClick={() => setSettings({ autoAdd: !settings.autoAdd })} aria-label="Toggle auto add">
            <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 32 }} />
          </button>
        </div>
        <p className="muted small">
          On Android, the Purrse app reads bank, UPI &amp; wallet notifications (GPay, PhonePe, Paytm, bank SMS) once you allow
          <b> Notification access</b>. In the browser, use <b>Share → Purrse</b> or paste them.
        </p>
        <button className="btn ghost block" onClick={openImport}>Paste notifications now</button>
      </section>

      <section className="card">
        <h4 className="set-h">Data</h4>
        <button className="set-row btnrow" onClick={exportData}><Download size={18} /><span>Export backup (JSON)</span></button>
        <button className="set-row btnrow" onClick={() => fileRef.current.click()}><Upload size={18} /><span>Restore from backup</span></button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f) try { importAll(JSON.parse(await f.text())) } catch { alert('That file is not a Purrse backup.') }
        }} />
        <button className="set-row btnrow neg" onClick={() => confirm('Delete all data on this device?') && resetAll()}><RotateCcw size={18} /><span>Reset everything</span></button>
      </section>
    </Screen>
  )
}
