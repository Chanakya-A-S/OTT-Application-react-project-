import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BellRing, Trash2 } from 'lucide-react'
import { useStore } from '../store.jsx'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, guessCategory, getCategory } from '../categories.js'
import { Sheet, Keypad, Segmented, CatIcon, Field } from '../components/ui.jsx'
import { money, toInputDate, fromInputDate, fmtDay } from '../utils.js'

export function CategoryGrid({ type, value, onChange }) {
  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  return (
    <div className="cat-grid no-drag">
      {cats.map((c) => (
        <motion.button key={c.id} whileTap={{ scale: 0.9 }} className={`cat-pick ${value === c.id ? 'on' : ''}`} onClick={() => onChange(c.id)}>
          <CatIcon id={c.id} size={36} />
          <small>{c.label.split(' ')[0]}</small>
        </motion.button>
      ))}
    </div>
  )
}

export function AddTxnSheet({ open, onClose, onImport }) {
  const { addTxn } = useStore()
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('0')
  const [step, setStep] = useState(0)
  const [cat, setCat] = useState('grocery')
  const [catTouched, setCatTouched] = useState(false)
  const [merchant, setMerchant] = useState('')
  const [date, setDate] = useState(toInputDate(new Date()))

  useEffect(() => { if (open) { setAmount('0'); setStep(0); setMerchant(''); setCatTouched(false); setDate(toInputDate(new Date())) } }, [open])
  useEffect(() => { setCat(type === 'income' ? 'salary' : 'grocery'); setCatTouched(false) }, [type])
  // auto-pick a category while the user types the merchant name
  useEffect(() => { if (!catTouched && merchant.length > 2) { const g = guessCategory(merchant, type); if (!['other', 'transfer', 'income'].includes(g)) setCat(g) } }, [merchant, type, catTouched])

  const save = () => {
    addTxn({ type, amount: +amount, category: cat, merchant: merchant.trim() || getCategory(cat).label, date: fromInputDate(date), note: '' })
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={step === 0 ? 'Add transaction' : 'Details'} actions={
      <motion.button whileTap={{ scale: 0.92 }} className="chip-btn" onClick={onImport}><BellRing size={14} /> From notification</motion.button>
    }>
      {step === 0 ? (
        <motion.div key="s0" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Segmented id="type" value={type} onChange={setType} options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]} />
          <div className="amount-display">
            <motion.span key={amount} initial={{ y: 6, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} className={type}>₹{Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}{amount.endsWith('.') ? '.' : ''}</motion.span>
            <span className="caret" />
          </div>
          <Keypad value={amount} onChange={(v) => setAmount(v || '0')} />
          <motion.button whileTap={{ scale: 0.97 }} className="btn block dark" disabled={!(+amount > 0)} onClick={() => setStep(1)}>Continue</motion.button>
        </motion.div>
      ) : (
        <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="amount-mini"><span className={type}>{type === 'income' ? '+' : '-'}{money(+amount, true)}</span><button className="link" onClick={() => setStep(0)}>Edit</button></div>
          <Field label={type === 'income' ? 'From' : 'Paid to'}><input autoFocus value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder={type === 'income' ? 'Employer, friend…' : 'Swiggy, DMart, Jio…'} /></Field>
          <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <span className="field-label">Category</span>
          <CategoryGrid type={type} value={cat} onChange={(c) => { setCat(c); setCatTouched(true) }} />
          <motion.button whileTap={{ scale: 0.97 }} className="btn block" onClick={save}>Save {type}</motion.button>
        </motion.div>
      )}
    </Sheet>
  )
}

export function TxnDetailSheet({ txn, onClose }) {
  const { state, updateTxn, deleteTxn } = useStore()
  const t = txn && state.txns.find((x) => x.id === txn.id)
  if (!t) return <Sheet open={false} onClose={onClose} />
  return (
    <Sheet open onClose={onClose} title="Transaction">
      <div className="txn-hero">
        <CatIcon id={t.category} size={56} />
        <div>
          <strong>{t.merchant}</strong>
          <small>{fmtDay(t.date)} {t.note && `· ${t.note}`}</small>
        </div>
        <span className={`txn-amt big ${t.type}`}>{t.type === 'income' ? '+' : '-'}{money(t.amount, true)}</span>
      </div>
      {t.raw && <p className="raw"><BellRing size={14} /> {t.raw}</p>}
      <span className="field-label">Category (tap to change)</span>
      <CategoryGrid type={t.type} value={t.category} onChange={(category) => updateTxn(t.id, { category })} />
      <motion.button whileTap={{ scale: 0.97 }} className="btn danger block" onClick={() => { deleteTxn(t.id); onClose() }}><Trash2 size={16} /> Delete</motion.button>
    </Sheet>
  )
}
