import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, TrendingDown, TrendingUp } from 'lucide-react'
import { useStore, monthKey } from '../store.jsx'
import { getCategory } from '../categories.js'
import { Screen, Money, CatIcon, listVariants, itemVariants, Segmented } from '../components/ui.jsx'
import { lastMonths, monthLabel, money, compact } from '../utils.js'

export default function Stats({ go }) {
  const { state } = useStore()
  const [range, setRange] = useState(6)
  const months = useMemo(() => lastMonths(range === 12 ? 12 : 6), [range])
  const [sel, setSel] = useState(monthKey(new Date()))

  const byMonth = useMemo(() => {
    const m = {}
    for (const t of state.txns) {
      const k = monthKey(t.date)
      m[k] ??= { spent: 0, income: 0, cats: {}, count: 0 }
      if (t.type === 'expense') { m[k].spent += t.amount; m[k].cats[t.category] = (m[k].cats[t.category] || 0) + t.amount; m[k].count++ } else m[k].income += t.amount
    }
    return m
  }, [state.txns])

  const cur = byMonth[sel] || { spent: 0, income: 0, cats: {}, count: 0 }
  const selIdx = months.indexOf(sel)
  const prevKey = monthKey(new Date(+sel.slice(0, 4), +sel.slice(5) - 2, 1))
  const prev = byMonth[prevKey]?.spent || 0
  const change = prev ? ((cur.spent - prev) / prev) * 100 : 0
  const max = Math.max(1, ...months.map((k) => byMonth[k]?.spent || 0))
  const cats = Object.entries(cur.cats).sort((a, b) => b[1] - a[1])
  const allMonths = Object.keys(byMonth).sort().reverse()

  return (
    <Screen>
      <header className="top center">
        <motion.button whileTap={{ scale: 0.9 }} className="icon-btn" onClick={() => go('home')}><ArrowLeft size={20} /></motion.button>
        <h2>Statistics</h2>
        <span style={{ width: 44 }} />
      </header>

      <Segmented id="range" value={range} onChange={setRange} options={[{ value: 6, label: '6 months' }, { value: 12, label: '12 months' }]} />

      <div className="tiles">
        <motion.div className="tile lime" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <small>Spent · {monthLabel(sel, true)}</small>
          <Money value={cur.spent} className="tile-amt" />
          {prev > 0 && <span className="tile-delta">{change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{Math.abs(change).toFixed(0)}% vs {monthLabel(prevKey)}</span>}
        </motion.div>
        <motion.div className="tile dark" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <small>Income</small>
          <Money value={cur.income} className="tile-amt" />
          <span className="tile-delta">Saved {compact(Math.max(0, cur.income - cur.spent))}</span>
        </motion.div>
      </div>

      <section className="card">
        <div className="card-head"><h4>Monthly spend</h4><small className="muted">Tap a bar</small></div>
        <div className={`bars n${months.length}`}>
          {months.map((k, i) => {
            const v = byMonth[k]?.spent || 0
            const on = k === sel
            return (
              <button key={k} className={`bar ${on ? 'on' : ''}`} onClick={() => setSel(k)}>
                <AnimatePresence>
                  {on && (
                    <motion.span className="bar-tip" initial={{ opacity: 0, y: 6, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.8 }}>
                      {compact(v)}
                    </motion.span>
                  )}
                </AnimatePresence>
                <div className="bar-track">
                  <motion.div className="bar-fill" initial={{ height: 0 }} animate={{ height: `${(v / max) * 100}%` }} transition={{ type: 'spring', stiffness: 90, damping: 16, delay: i * 0.05 }} />
                </div>
                <small>{monthLabel(k)}</small>
              </button>
            )
          })}
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h4>By category</h4><small className="muted">{cur.count} spends</small></div>
        {cats.length === 0 ? <p className="muted pad">No spends in {monthLabel(sel, true)}.</p> : (
          <>
            <Donut key={sel} data={cats} total={cur.spent} />
            <motion.div variants={listVariants} initial="hidden" animate="show" key={`l${sel}`} className="cat-list">
              {cats.map(([id, amt]) => {
                const c = getCategory(id)
                return (
                  <motion.div variants={itemVariants} key={id} className="cat-row">
                    <CatIcon id={id} size={38} />
                    <div className="cat-row-mid">
                      <div className="cat-row-top"><strong>{c.label}</strong><strong>{money(amt)}</strong></div>
                      <div className="mini-track"><motion.div style={{ background: c.color }} initial={{ width: 0 }} animate={{ width: `${(amt / cats[0][1]) * 100}%` }} transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.2 }} /></div>
                    </div>
                    <small className="pct">{((amt / cur.spent) * 100).toFixed(0)}%</small>
                  </motion.div>
                )
              })}
            </motion.div>
          </>
        )}
      </section>

      <section className="card">
        <div className="card-head"><h4>Every month’s total</h4></div>
        <div className="table-wrap no-drag">
          <table className="table">
            <thead><tr><th>Month</th><th>Spent</th><th>Income</th><th>Net</th></tr></thead>
            <tbody>
              {allMonths.map((k) => {
                const m = byMonth[k]
                const net = m.income - m.spent
                return (
                  <tr key={k} className={k === sel ? 'sel' : ''} onClick={() => months.includes(k) && setSel(k)}>
                    <td>{monthLabel(k, true)}</td>
                    <td>{money(m.spent)}</td>
                    <td className="pos">{money(m.income)}</td>
                    <td className={net >= 0 ? 'pos' : 'neg'}>{net >= 0 ? '+' : '-'}{money(Math.abs(net))}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
      {selIdx < 0 && null}
    </Screen>
  )
}

function Donut({ data, total }) {
  const size = 180, stroke = 26, r = (size - stroke) / 2, c = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="donut">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        {data.map(([id, amt], i) => {
          const frac = amt / total
          const gap = data.length > 1 ? 0.006 : 0
          const len = Math.max(0, frac - gap) * c
          const off = acc * c
          acc += frac
          return (
            <motion.circle
              key={id} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={getCategory(id).color} strokeWidth={stroke}
              strokeDasharray={`${len} ${c}`} initial={{ strokeDashoffset: -off + len, opacity: 0 }} animate={{ strokeDashoffset: -off, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.1 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              style={{ rotate: -90, transformOrigin: '50% 50%' }}
            />
          )
        })}
      </svg>
      <div className="donut-in"><small>Total</small><Money value={total} className="donut-amt" /></div>
    </div>
  )
}
