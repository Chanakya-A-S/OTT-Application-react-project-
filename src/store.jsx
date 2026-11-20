import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { get, set } from 'idb-keyval'
import { parseNotification } from './parser.js'

const KEY = 'purrse-state-v1'
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const monthKey = (d) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`
}

const EMPTY = {
  onboarded: false,
  profile: { name: 'Friend' },
  settings: { theme: 'system', autoAdd: false, budget: 40000 },
  txns: [],
  loans: [],
  emis: [],
  inbox: [], // notifications detected but not yet confirmed
}

const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

export function StoreProvider({ children }) {
  const [state, setState] = useState(null)
  const ready = state !== null
  const saveTimer = useRef()

  useEffect(() => {
    get(KEY)
      .then((s) => setState(s ? { ...EMPTY, ...s, settings: { ...EMPTY.settings, ...s.settings } } : EMPTY))
      .catch(() => setState(EMPTY))
  }, [])

  useEffect(() => {
    if (!ready) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => set(KEY, state).catch(console.error), 250)
  }, [state, ready])

  const update = useCallback((fn) => setState((s) => ({ ...s, ...fn(s) })), [])

  const actions = useMemo(() => ({
    finishOnboarding: (name, withSample) =>
      update(() => ({ ...(withSample ? sampleData() : {}), onboarded: true, profile: { name: name || 'Friend' } })),
    setSettings: (patch) => update((s) => ({ settings: { ...s.settings, ...patch } })),
    setProfile: (patch) => update((s) => ({ profile: { ...s.profile, ...patch } })),

    addTxn: (t) => update((s) => ({ txns: [{ id: uid(), source: 'manual', ...t }, ...s.txns] })),
    updateTxn: (id, patch) => update((s) => ({ txns: s.txns.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
    deleteTxn: (id) => update((s) => ({ txns: s.txns.filter((t) => t.id !== id) })),

    // Notification pipeline -------------------------------------------------
    ingestNotification: (text, meta = {}) => {
      const parsed = parseNotification(text)
      if (!parsed) return null
      const item = { id: uid(), ...parsed, app: meta.app || null, receivedAt: new Date().toISOString() }
      update((s) => {
        // de-dupe identical notifications (same raw text)
        if (s.inbox.some((i) => i.raw === item.raw) || s.txns.some((t) => t.raw === item.raw)) return {}
        if (s.settings.autoAdd) return { txns: [toTxn(item), ...s.txns] }
        return { inbox: [item, ...s.inbox] }
      })
      return item
    },
    acceptInbox: (id, patch = {}) =>
      update((s) => {
        const item = s.inbox.find((i) => i.id === id)
        if (!item) return {}
        return { inbox: s.inbox.filter((i) => i.id !== id), txns: [toTxn({ ...item, ...patch }), ...s.txns] }
      }),
    dismissInbox: (id) => update((s) => ({ inbox: s.inbox.filter((i) => i.id !== id) })),

    // Loans -----------------------------------------------------------------
    addLoan: (l) => update((s) => ({ loans: [{ id: uid(), repayments: [], settled: false, ...l }, ...s.loans] })),
    addRepayment: (loanId, amount, date) =>
      update((s) => ({
        loans: s.loans.map((l) => {
          if (l.id !== loanId) return l
          const repayments = [...l.repayments, { id: uid(), amount, date }]
          const paid = repayments.reduce((a, r) => a + r.amount, 0)
          return { ...l, repayments, settled: paid >= l.amount }
        }),
      })),
    settleLoan: (loanId) => update((s) => ({ loans: s.loans.map((l) => (l.id === loanId ? { ...l, settled: !l.settled } : l)) })),
    deleteLoan: (id) => update((s) => ({ loans: s.loans.filter((l) => l.id !== id) })),

    // EMIs ------------------------------------------------------------------
    addEmi: (e) => update((s) => ({ emis: [{ id: uid(), paid: [], ...e }, ...s.emis] })),
    updateEmi: (id, patch) => update((s) => ({ emis: s.emis.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
    deleteEmi: (id) => update((s) => ({ emis: s.emis.filter((e) => e.id !== id) })),
    toggleEmiMonth: (id, mk, alsoLogExpense = true) =>
      update((s) => {
        const emi = s.emis.find((e) => e.id === id)
        if (!emi) return {}
        const isPaid = emi.paid.includes(mk)
        const emis = s.emis.map((e) =>
          e.id === id ? { ...e, paid: isPaid ? e.paid.filter((m) => m !== mk) : [...e.paid, mk].sort() } : e,
        )
        let txns = s.txns
        const tag = `emi:${id}:${mk}`
        if (isPaid) txns = txns.filter((t) => t.emiTag !== tag)
        else if (alsoLogExpense) {
          const [y, m] = mk.split('-').map(Number)
          const day = Math.min(emi.dueDay || 5, 28)
          txns = [{ id: uid(), type: 'expense', amount: emi.amount, category: 'emi', merchant: `${emi.name} EMI`, note: emi.lender, date: new Date(y, m - 1, day, 10).toISOString(), source: 'emi', emiTag: tag }, ...txns]
        }
        return { emis, txns }
      }),

    importAll: (data) => update(() => ({ ...EMPTY, ...data, onboarded: true })),
    resetAll: () => update(() => ({ ...EMPTY })),
  }), [update])

  // Native bridge: an Android wrapper (NotificationListenerService) can call
  //   window.dispatchEvent(new CustomEvent('purrse:notification', { detail: { text, app } }))
  // or window.PurrseBridge.push(text, app). Every bank/UPI notification is then parsed automatically.
  useEffect(() => {
    if (!ready) return
    const onEvt = (e) => actions.ingestNotification(e.detail?.text, e.detail || {})
    window.addEventListener('purrse:notification', onEvt)
    window.PurrseBridge = { push: (text, app) => actions.ingestNotification(text, { app }) }
    const queued = window.__purrseQueue || []
    queued.forEach(([t, a]) => actions.ingestNotification(t, { app: a }))
    window.__purrseQueue = []
    return () => window.removeEventListener('purrse:notification', onEvt)
  }, [ready, actions])

  if (!ready) return null
  return <Ctx.Provider value={{ state, ...actions }}>{children}</Ctx.Provider>
}

function toTxn(item) {
  return {
    id: uid(), type: item.type, amount: item.amount, category: item.category, merchant: item.merchant,
    note: [item.bank, item.account && `••${item.account}`].filter(Boolean).join(' '),
    date: item.date, source: 'notification', raw: item.raw,
  }
}

// ---------------------------------------------------------------------------
// Sample data so the app looks alive on first run (optional at onboarding)
function sampleData() {
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const now = new Date()
  const txns = []
  const pool = [
    ['grocery', ['BigBasket', 'Blinkit', 'DMart', 'Zepto'], 300, 2400, 5],
    ['food', ['Swiggy', 'Zomato', 'Starbucks', 'Chai Point'], 120, 900, 7],
    ['recharge', ['Jio Prepaid', 'Airtel Postpaid', 'Tata Play DTH'], 199, 799, 2],
    ['bills', ['BESCOM Electricity', 'ACT Fibernet', 'Water Bill'], 400, 2200, 2],
    ['transport', ['Uber', 'Rapido', 'Namma Metro', 'Ola'], 40, 450, 5],
    ['fuel', ['HPCL Petrol', 'Indian Oil'], 500, 2000, 2],
    ['shopping', ['Amazon', 'Myntra', 'Flipkart'], 400, 4500, 2],
    ['entertainment', ['Netflix', 'BookMyShow', 'Spotify'], 119, 899, 2],
    ['health', ['Apollo Pharmacy', '1mg'], 150, 1400, 1],
  ]
  for (let mBack = 6; mBack >= 0; mBack--) {
    const base = new Date(now.getFullYear(), now.getMonth() - mBack, 1)
    const maxDay = mBack === 0 ? now.getDate() : new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()
    txns.push({ id: uid(), type: 'income', amount: 85000, category: 'salary', merchant: 'ACME Technologies', note: 'Salary', date: new Date(base.getFullYear(), base.getMonth(), 1, 9).toISOString(), source: 'notification' })
    txns.push({ id: uid(), type: 'expense', amount: 18000, category: 'rent', merchant: 'House Rent', note: 'Landlord', date: new Date(base.getFullYear(), base.getMonth(), Math.min(3, maxDay), 11).toISOString(), source: 'manual' })
    for (const [cat, names, min, max, count] of pool) {
      const n = Math.max(1, Math.round(count * (0.6 + rnd() * 0.8) * (mBack === 0 ? maxDay / 30 : 1)))
      for (let i = 0; i < n; i++) {
        const day = 1 + Math.floor(rnd() * maxDay)
        txns.push({
          id: uid(), type: 'expense', category: cat, merchant: names[Math.floor(rnd() * names.length)],
          amount: Math.round(min + rnd() * (max - min)), note: rnd() > 0.5 ? 'HDFC ••4321' : 'UPI',
          date: new Date(base.getFullYear(), base.getMonth(), day, 8 + Math.floor(rnd() * 13), Math.floor(rnd() * 60)).toISOString(),
          source: rnd() > 0.3 ? 'notification' : 'manual',
        })
      }
    }
  }
  txns.sort((a, b) => new Date(b.date) - new Date(a.date))

  const d = (daysAgo) => new Date(now.getTime() - daysAgo * 864e5).toISOString()
  const loans = [
    { id: uid(), person: 'Rahul Sharma', direction: 'lent', amount: 5000, date: d(42), due: d(-10), note: 'Bike repair', settled: false, repayments: [{ id: uid(), amount: 2000, date: d(20) }] },
    { id: uid(), person: 'Priya Nair', direction: 'borrowed', amount: 12000, date: d(60), due: d(-25), note: 'Laptop advance', settled: false, repayments: [{ id: uid(), amount: 4000, date: d(30) }, { id: uid(), amount: 3000, date: d(5) }] },
    { id: uid(), person: 'Arjun K', direction: 'lent', amount: 1500, date: d(15), due: d(-3), note: 'Concert tickets', settled: false, repayments: [] },
    { id: uid(), person: 'Sneha Reddy', direction: 'lent', amount: 3000, date: d(90), note: 'Trip share', settled: true, repayments: [{ id: uid(), amount: 3000, date: d(70) }] },
    { id: uid(), person: 'Vikram', direction: 'borrowed', amount: 2500, date: d(8), due: d(-20), note: 'Dinner + cab', settled: false, repayments: [] },
  ]

  const mk = (back) => monthKey(new Date(now.getFullYear(), now.getMonth() - back, 1))
  const emis = [
    { id: uid(), name: 'iPhone 16', lender: 'Bajaj Finserv', amount: 6658, tenure: 12, startDate: new Date(now.getFullYear(), now.getMonth() - 4, 5).toISOString(), dueDay: 5, paid: [mk(4), mk(3), mk(2), mk(1), mk(0)], image: null, color: '#B5E550' },
    { id: uid(), name: 'Bike Loan', lender: 'HDFC Bank', amount: 4250, tenure: 24, startDate: new Date(now.getFullYear(), now.getMonth() - 9, 10).toISOString(), dueDay: 10, paid: [mk(9), mk(8), mk(7), mk(6), mk(5), mk(4), mk(3), mk(2), mk(1), mk(0)], image: null, color: '#FF8A3D' },
    { id: uid(), name: 'Washing Machine', lender: 'Home Credit', amount: 2199, tenure: 9, startDate: new Date(now.getFullYear(), now.getMonth() - 2, 15).toISOString(), dueDay: 15, paid: [mk(2), mk(1)], image: null, color: '#4EA8DE' },
  ]

  const inbox = [
    { id: uid(), type: 'expense', amount: 349, merchant: 'Swiggy', category: 'food', date: d(0.05), bank: 'ICICI', account: '1234', raw: 'Rs.349.00 debited from A/c XX1234 to VPA swiggy@icici. UPI Ref 631245890', app: 'Messages', receivedAt: d(0.05) },
    { id: uid(), type: 'expense', amount: 239, merchant: 'Jio Prepaid', category: 'recharge', date: d(0.2), bank: 'Google Pay', account: null, raw: 'You paid ₹239 to Jio Prepaid using Google Pay', app: 'Google Pay', receivedAt: d(0.2) },
  ]

  return { txns, loans, emis, inbox, settings: { ...EMPTY.settings } }
}
