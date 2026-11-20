import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Search } from 'lucide-react'
import { useStore, monthKey } from '../store.jsx'
import { getCategory } from '../categories.js'
import { Screen, TxnRow, listVariants } from '../components/ui.jsx'
import { monthLabel, money } from '../utils.js'

export default function AllTxns({ go, openTxn }) {
  const { state } = useStore()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const usedCats = useMemo(() => [...new Set(state.txns.map((t) => t.category))], [state.txns])

  const groups = useMemo(() => {
    const ql = q.toLowerCase()
    const g = {}
    for (const t of state.txns) {
      if (cat !== 'all' && t.category !== cat) continue
      if (ql && !`${t.merchant} ${t.note} ${getCategory(t.category).label}`.toLowerCase().includes(ql)) continue
      const k = monthKey(t.date)
      g[k] ??= { items: [], spent: 0 }
      g[k].items.push(t)
      if (t.type === 'expense') g[k].spent += t.amount
    }
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]))
  }, [state.txns, q, cat])

  return (
    <Screen>
      <header className="top center">
        <motion.button whileTap={{ scale: 0.9 }} className="icon-btn" onClick={() => go('home')}><ArrowLeft size={20} /></motion.button>
        <h2>Transactions</h2>
        <span style={{ width: 44 }} />
      </header>
      <div className="search"><Search size={18} /><input placeholder="Search merchant, category…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="chips-scroll">
        {['all', ...usedCats].map((c) => (
          <button key={c} className={`mini-chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c === 'all' ? 'All' : getCategory(c).label}</button>
        ))}
      </div>
      {groups.map(([k, g]) => (
        <section className="card" key={k}>
          <div className="card-head"><h4>{monthLabel(k, true)}</h4><strong className="neg">{money(g.spent)}</strong></div>
          <motion.div variants={listVariants} initial="hidden" animate="show" className="txn-list">
            {g.items.slice(0, 60).map((t) => <TxnRow key={t.id} t={t} onClick={() => openTxn(t)} />)}
          </motion.div>
        </section>
      ))}
      {groups.length === 0 && <p className="muted pad center-text">No matching transactions.</p>}
    </Screen>
  )
}
