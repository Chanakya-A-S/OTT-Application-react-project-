import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ClipboardPaste, Check, X, Inbox, Sparkles } from 'lucide-react'
import { useStore } from '../store.jsx'
import { parseNotification, SAMPLE_NOTIFICATIONS } from '../parser.js'
import { getCategory } from '../categories.js'
import { Sheet, CatIcon, Empty } from '../components/ui.jsx'
import { CategoryGrid } from './AddTxn.jsx'
import { money, fmtDay } from '../utils.js'

/** Paste / share one or more notifications; each line or paragraph is parsed live. */
export function ImportSheet({ text, onClose }) {
  const { addTxn } = useStore()
  const open = text !== null
  const [value, setValue] = useState('')
  const [overrides, setOverrides] = useState({})
  const [editing, setEditing] = useState(null)
  useEffect(() => { if (open) { setValue(text || ''); setOverrides({}); setEditing(null) } }, [open, text])

  const parsed = useMemo(
    () => value.split(/\n\s*\n|\n(?=\S)/).map((s) => s.trim()).filter(Boolean).map((s, i) => ({ i, p: parseNotification(s), s })),
    [value],
  )
  const good = parsed.filter((x) => x.p)

  const paste = async () => {
    try { const t = await navigator.clipboard.readText(); if (t) setValue((v) => (v ? v + '\n' : '') + t) } catch { /* permission denied */ }
  }
  const save = () => {
    good.forEach(({ i, p }) => addTxn({ ...p, ...overrides[i], note: [p.bank, p.account && `••${p.account}`].filter(Boolean).join(' '), source: 'notification' }))
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Import from notifications">
      <p className="muted small">Paste bank SMS / UPI notifications (one per line), or share them to Montra from Android. They’re read on-device.</p>
      <textarea className="paste" rows={4} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Rs.349.00 debited from A/c XX1234 to VPA swiggy@icici…" />
      <div className="row2">
        <motion.button whileTap={{ scale: 0.95 }} className="btn ghost" onClick={paste}><ClipboardPaste size={16} /> Paste</motion.button>
        <motion.button whileTap={{ scale: 0.95 }} className="btn ghost" onClick={() => setValue(SAMPLE_NOTIFICATIONS.join('\n'))}><Sparkles size={16} /> Try samples</motion.button>
      </div>

      <AnimatePresence>
        {parsed.map(({ i, p, s }) => {
          const cat = overrides[i]?.category || p?.category
          return (
            <motion.div key={s} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className={`parsed ${p ? '' : 'bad'}`}>
              {p ? (
                <>
                  <button className="parsed-row" onClick={() => setEditing(editing === i ? null : i)}>
                    <CatIcon id={cat} size={40} />
                    <div className="txn-mid"><strong>{p.merchant}</strong><small>{getCategory(cat).label} · {fmtDay(p.date)} {p.bank && `· ${p.bank}`}</small></div>
                    <span className={`txn-amt ${p.type}`}>{p.type === 'income' ? '+' : '-'}{money(p.amount, true)}</span>
                  </button>
                  <AnimatePresence>
                    {editing === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                        <CategoryGrid type={p.type} value={cat} onChange={(category) => setOverrides({ ...overrides, [i]: { category } })} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : <small>Couldn’t find an amount in: “{s.slice(0, 60)}…”</small>}
            </motion.div>
          )
        })}
      </AnimatePresence>

      <motion.button whileTap={{ scale: 0.97 }} className="btn block" disabled={!good.length} onClick={save}>
        Add {good.length || ''} transaction{good.length === 1 ? '' : 's'}
      </motion.button>
    </Sheet>
  )
}

/** Notifications captured automatically (via the Android bridge) awaiting review. */
export function InboxSheet({ open, onClose, onImport }) {
  const { state, acceptInbox, dismissInbox } = useStore()
  const [cats, setCats] = useState({})
  return (
    <Sheet open={open} onClose={onClose} title="Detected from notifications" actions={<button className="chip-btn" onClick={onImport}>+ Paste</button>}>
      {state.inbox.length === 0 ? (
        <Empty icon={Inbox} title="All caught up" text="New bank & UPI notifications will show up here automatically." />
      ) : (
        <div className="inbox-list">
          <AnimatePresence>
            {state.inbox.map((n) => {
              const cat = cats[n.id] || n.category
              return (
                <motion.div key={n.id} layout className="inbox-item" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 80, transition: { duration: 0.25 } }}>
                  <div className="parsed-row">
                    <CatIcon id={cat} size={40} />
                    <div className="txn-mid"><strong>{n.merchant}</strong><small>{n.app || n.bank || 'Notification'} · {fmtDay(n.receivedAt || n.date)}</small></div>
                    <span className={`txn-amt ${n.type}`}>{n.type === 'income' ? '+' : '-'}{money(n.amount, true)}</span>
                  </div>
                  <p className="raw">{n.raw}</p>
                  <div className="cat-inline no-drag">
                    {['grocery', 'food', 'recharge', 'bills', 'transport', 'shopping', 'other'].filter((c) => n.type === 'expense').map((c) => (
                      <button key={c} className={`mini-chip ${cat === c ? 'on' : ''}`} onClick={() => setCats({ ...cats, [n.id]: c })}>{getCategory(c).label.split(' ')[0]}</button>
                    ))}
                  </div>
                  <div className="row2">
                    <motion.button whileTap={{ scale: 0.95 }} className="btn ghost" onClick={() => dismissInbox(n.id)}><X size={16} /> Ignore</motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} className="btn" onClick={() => acceptInbox(n.id, { category: cat })}><Check size={16} /> Add</motion.button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </Sheet>
  )
}
