import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Home as HomeIcon, BarChart3, Plus, HandCoins, CalendarClock } from 'lucide-react'
import { StoreProvider, useStore } from './store.jsx'
import Onboarding from './screens/Onboarding.jsx'
import Home from './screens/Home.jsx'
import Stats from './screens/Stats.jsx'
import Loans from './screens/Loans.jsx'
import Emi from './screens/Emi.jsx'
import Settings from './screens/Settings.jsx'
import AllTxns from './screens/AllTxns.jsx'
import { AddTxnSheet, TxnDetailSheet } from './screens/AddTxn.jsx'
import { ImportSheet, InboxSheet } from './screens/Import.jsx'
import { onBackButton } from './native.js'

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}

const TABS = [
  { id: 'home', icon: HomeIcon, label: 'Home' },
  { id: 'stats', icon: BarChart3, label: 'Stats' },
  { id: 'add', icon: Plus, label: 'Add' },
  { id: 'loans', icon: HandCoins, label: 'Loans' },
  { id: 'emi', icon: CalendarClock, label: 'EMI' },
]

function useTheme(pref) {
  const [sys, setSys] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const fn = (e) => setSys(e.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  const dark = pref === 'dark' || (pref === 'system' && sys)
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0d0f0c' : '#eef1e9')
  }, [dark])
  return dark
}

function Shell() {
  const { state } = useStore()
  const [tab, setTab] = useState(() => new URLSearchParams(location.search).get('tab') || 'home')
  const [addOpen, setAddOpen] = useState(false)
  const [importText, setImportText] = useState(null)
  const [inboxOpen, setInboxOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const dark = useTheme(state.settings.theme)

  // Loans section switches the whole app to the orange theme; elsewhere the user's chosen accent
  useEffect(() => {
    const root = document.documentElement
    root.dataset.accent = tab === 'loans' ? 'orange' : 'green'
    if (tab === 'loans') { root.style.removeProperty('--accent'); root.style.removeProperty('--accent-soft'); return }
    const a = state.settings.accent || '#b5e550'
    root.style.setProperty('--accent', a)
    root.style.setProperty('--accent-soft', `color-mix(in srgb, ${a} ${dark ? 18 : 28}%, ${dark ? '#161913' : '#ffffff'})`)
  }, [tab, state.settings.accent, dark])
  useEffect(() => { document.documentElement.dataset.hero = state.settings.heroStyle || 'dark' }, [state.settings.heroStyle])

  // Android back button: close sheets first, then go back to Home, then minimise
  useEffect(() => onBackButton(() => {
    if (detail) { setDetail(null); return true }
    if (importText !== null) { setImportText(null); return true }
    if (inboxOpen) { setInboxOpen(false); return true }
    if (addOpen) { setAddOpen(false); return true }
    if (tab !== 'home') { setTab('home'); return true }
    return false
  }), [detail, importText, inboxOpen, addOpen, tab])

  // Android "Share → Montra" (PWA share target) or deep links: /?text=...
  useEffect(() => {
    const p = new URLSearchParams(location.search)
    const shared = p.get('text') || p.get('title')
    if (shared && state.onboarded) {
      setImportText(shared)
      history.replaceState(null, '', location.pathname)
    }
    if (p.get('sheet') === 'add') setAddOpen(true)
    if (p.get('sheet') === 'inbox') setInboxOpen(true)
    if (p.get('sheet') === 'import') setImportText('')
  }, [state.onboarded])

  if (!state.onboarded) return <Onboarding />

  const go = (id) => (id === 'add' ? setAddOpen(true) : setTab(id))
  const ctx = { go, openAdd: () => setAddOpen(true), openImport: () => setImportText(''), openInbox: () => setInboxOpen(true), openTxn: setDetail }

  return (
    <div className="app">
      <AnimatePresence mode="wait">
        {tab === 'home' && <Home key="home" {...ctx} />}
        {tab === 'stats' && <Stats key="stats" {...ctx} />}
        {tab === 'loans' && <Loans key="loans" {...ctx} />}
        {tab === 'emi' && <Emi key="emi" {...ctx} />}
        {tab === 'settings' && <Settings key="settings" {...ctx} />}
        {tab === 'txns' && <AllTxns key="txns" {...ctx} />}
      </AnimatePresence>

      <nav className="nav">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          if (t.id === 'add')
            return (
              <motion.button key={t.id} className="nav-add" whileTap={{ scale: 0.88, rotate: 90 }} onClick={() => go('add')} aria-label="Add transaction">
                <Icon size={24} strokeWidth={2.6} />
              </motion.button>
            )
          return (
            <motion.button key={t.id} className={`nav-btn ${active ? 'on' : ''}`} whileTap={{ scale: 0.88 }} onClick={() => go(t.id)} aria-label={t.label}>
              {active && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
              <Icon size={20} />
              <AnimatePresence>
                {active && (
                  <motion.span className="nav-label" initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }}>
                    {t.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </nav>

      <AddTxnSheet open={addOpen} onClose={() => setAddOpen(false)} onImport={() => { setAddOpen(false); setImportText('') }} />
      <ImportSheet text={importText} onClose={() => setImportText(null)} />
      <InboxSheet open={inboxOpen} onClose={() => setInboxOpen(false)} onImport={() => { setInboxOpen(false); setImportText('') }} />
      <TxnDetailSheet txn={detail} onClose={() => setDetail(null)} />
    </div>
  )
}
