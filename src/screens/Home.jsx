import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Bell, Settings2, Plus, BellRing, HandCoins, CalendarClock, ChevronRight, TrendingDown, TrendingUp, Sparkles, ReceiptText } from 'lucide-react'
import { useStore, monthKey } from '../store.jsx'
import { openNotificationSettings } from '../native.js'
import { getCategory } from '../categories.js'
import { Screen, Money, Avatar, TxnRow, listVariants, itemVariants, CatIcon, Progress, Empty } from '../components/ui.jsx'
import { MONTHS_LONG, money, emiStats, loanStats, compact } from '../utils.js'

export default function Home({ go, openAdd, openImport, openInbox, openTxn }) {
  const { state, isNative, notifAccess } = useStore()
  const { txns, inbox, emis, loans, profile, settings } = state
  const now = new Date()
  const mk = monthKey(now)
  const prevMk = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1))

  const { spent, income, prevSpent, cats } = useMemo(() => {
    let spent = 0, income = 0, prevSpent = 0
    const cats = {}
    for (const t of txns) {
      const k = monthKey(t.date)
      if (k === mk) {
        if (t.type === 'expense') { spent += t.amount; cats[t.category] = (cats[t.category] || 0) + t.amount } else income += t.amount
      } else if (k === prevMk && t.type === 'expense') prevSpent += t.amount
    }
    return { spent, income, prevSpent, cats: Object.entries(cats).sort((a, b) => b[1] - a[1]) }
  }, [txns, mk, prevMk])

  const change = prevSpent ? ((spent - prevSpent) / prevSpent) * 100 : 0
  const nextEmi = emis.map((e) => ({ e, s: emiStats(e) })).filter((x) => x.s.next).sort((a, b) => a.s.next.date - b.s.next.date)[0]
  const toGet = loans.filter((l) => l.direction === 'lent').reduce((a, l) => a + loanStats(l).balance, 0)
  const toPay = loans.filter((l) => l.direction === 'borrowed').reduce((a, l) => a + loanStats(l).balance, 0)

  return (
    <Screen>
      <header className="top">
        <div className="hello">
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => go('settings')} aria-label="Profile"><Avatar profile={profile} /></motion.button>
          <div>
            <small>Hello, {profile.name}</small>
            <h2>Welcome back 👋</h2>
          </div>
        </div>
        <div className="top-actions">
          <motion.button whileTap={{ scale: 0.9 }} className="icon-btn" onClick={openInbox} aria-label="Notifications">
            <Bell size={20} />
            {inbox.length > 0 && <motion.span className="badge" initial={{ scale: 0 }} animate={{ scale: 1 }}>{inbox.length}</motion.span>}
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} className="icon-btn" onClick={() => go('settings')} aria-label="Settings">
            <Settings2 size={20} />
          </motion.button>
        </div>
      </header>

      <motion.section className="hero" initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.05 }}>
        <div className="hero-pattern" />
        <div className="hero-top">
          <span className="hero-chip">{MONTHS_LONG[now.getMonth()]} spending</span>
          <motion.span className="hero-star" animate={{ rotate: [0, 90, 0], scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}><Sparkles size={22} /></motion.span>
        </div>
        <Money value={spent} className="hero-amt" />
        <div className="hero-change">
          {prevSpent > 0 && (
            <span className={change > 0 ? 'up' : 'down'}>
              {change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {Math.abs(change).toFixed(0)}% vs last month
            </span>
          )}
        </div>
        <div className="hero-budget">
          <div className="hero-budget-row"><span>Budget</span><span>{money(spent)} / {money(settings.budget)}</span></div>
          <Progress value={spent / (settings.budget || 1)} color={spent > settings.budget ? '#FF6B5B' : undefined} />
        </div>
        <div className="hero-foot">
          <div><small>Income</small><strong className="pos">+{compact(income)}</strong></div>
          <div><small>To receive</small><strong>{compact(toGet)}</strong></div>
          <div><small>To pay</small><strong>{compact(toPay)}</strong></div>
        </div>
      </motion.section>

      {isNative && !notifAccess && (
        <motion.button className="inbox-banner warn" onClick={openNotificationSettings} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.98 }}>
          <span className="pulse"><BellRing size={18} /></span>
          <div><strong>Turn on auto-tracking</strong><small>Allow Notification access so Montra can read bank &amp; UPI alerts</small></div>
          <ChevronRight size={18} />
        </motion.button>
      )}

      {inbox.length > 0 && (
        <motion.button className="inbox-banner" onClick={openInbox} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileTap={{ scale: 0.98 }}>
          <span className="pulse"><BellRing size={18} /></span>
          <div><strong>{inbox.length} new from notifications</strong><small>Tap to review &amp; add</small></div>
          <ChevronRight size={18} />
        </motion.button>
      )}

      <motion.div className="quick" variants={listVariants} initial="hidden" animate="show">
        {[
          { label: 'Add', icon: Plus, fn: openAdd, hl: true },
          { label: 'Import', icon: BellRing, fn: openImport },
          { label: 'Loans', icon: HandCoins, fn: () => go('loans') },
          { label: 'EMI', icon: CalendarClock, fn: () => go('emi') },
        ].map((q) => (
          <motion.button key={q.label} variants={itemVariants} whileTap={{ scale: 0.9 }} className={`quick-btn ${q.hl ? 'hl' : ''}`} onClick={q.fn}>
            <q.icon size={22} />
            <span>{q.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {cats.length > 0 && (
        <section className="card">
          <div className="card-head"><h4>Where it went</h4><button className="see" onClick={() => go('stats')}>Stats <ChevronRight size={14} /></button></div>
          <motion.div className="cat-scroll" variants={listVariants} initial="hidden" animate="show">
            {cats.map(([id, amt]) => (
              <motion.div key={id} variants={itemVariants} className="cat-chip" onClick={() => go('stats')}>
                <CatIcon id={id} size={38} />
                <small>{getCategory(id).label}</small>
                <strong>{compact(amt)}</strong>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {nextEmi && (
        <motion.button className="emi-mini" onClick={() => go('emi')} whileTap={{ scale: 0.98 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="emi-mini-ic"><CalendarClock size={20} /></span>
          <div>
            <small>Next EMI · {nextEmi.e.name}</small>
            <strong>{money(nextEmi.e.amount)} {nextEmi.s.daysLeft < 0 ? <em className="late">overdue</em> : <em>in {nextEmi.s.daysLeft} days</em>}</strong>
          </div>
          <ChevronRight size={18} />
        </motion.button>
      )}

      <section className="card">
        <div className="card-head"><h4>Recent activity</h4><button className="see" onClick={() => go('txns')}>See all <ChevronRight size={14} /></button></div>
        {txns.length === 0 ? (
          <Empty icon={ReceiptText} title="No transactions yet" text="Add one manually or import from a bank notification." action={<button className="btn" onClick={openImport}>Import notification</button>} />
        ) : (
          <motion.div variants={listVariants} initial="hidden" animate="show" className="txn-list">
            {txns.slice(0, 7).map((t) => <TxnRow key={t.id} t={t} onClick={() => openTxn(t)} />)}
          </motion.div>
        )}
      </section>
    </Screen>
  )
}
