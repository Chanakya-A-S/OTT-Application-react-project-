import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Plus, ArrowDownLeft, ArrowUpRight, HandCoins, Check, Trash2, Undo2 } from 'lucide-react'
import { useStore } from '../store.jsx'
import { Screen, Money, Segmented, Sheet, Field, Progress, Empty, Ring } from '../components/ui.jsx'
import { money, fmtDate, loanStats, toInputDate, fromInputDate } from '../utils.js'

export default function Loans({ go }) {
  const { state } = useStore()
  const [filter, setFilter] = useState('all')
  const [adding, setAdding] = useState(false)
  const [openId, setOpenId] = useState(null)

  const rows = useMemo(() => state.loans.map((l) => ({ ...l, s: loanStats(l) })), [state.loans])
  const toGet = rows.filter((l) => l.direction === 'lent').reduce((a, l) => a + l.s.balance, 0)
  const toPay = rows.filter((l) => l.direction === 'borrowed').reduce((a, l) => a + l.s.balance, 0)
  const shown = rows
    .filter((l) => (filter === 'all' ? true : filter === 'settled' ? l.settled : !l.settled && l.direction === filter))
    .sort((a, b) => a.settled - b.settled || new Date(b.date) - new Date(a.date))
  const open = rows.find((l) => l.id === openId)

  return (
    <Screen className="loans">
      <header className="top center">
        <motion.button whileTap={{ scale: 0.9 }} className="icon-btn" onClick={() => go('home')}><ArrowLeft size={20} /></motion.button>
        <h2>Friend Loans</h2>
        <motion.button whileTap={{ scale: 0.9 }} className="icon-btn accent" onClick={() => setAdding(true)} aria-label="Add loan"><Plus size={20} /></motion.button>
      </header>

      <div className="tiles">
        <motion.div className="tile lime" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <span className="tile-ic"><ArrowDownLeft size={18} /></span>
          <small>You’ll get back</small>
          <Money value={toGet} className="tile-amt" />
          <span className="tile-delta">{rows.filter((l) => l.direction === 'lent' && !l.settled).length} friends</span>
        </motion.div>
        <motion.div className="tile dark" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <span className="tile-ic"><ArrowUpRight size={18} /></span>
          <small>You owe</small>
          <Money value={toPay} className="tile-amt" />
          <span className="tile-delta">{rows.filter((l) => l.direction === 'borrowed' && !l.settled).length} friends</span>
        </motion.div>
      </div>

      <Segmented id="loanf" value={filter} onChange={setFilter} options={[
        { value: 'all', label: 'All' }, { value: 'lent', label: 'I gave' }, { value: 'borrowed', label: 'I took' }, { value: 'settled', label: 'Settled' },
      ]} />

      <section className="card flush">
        {shown.length === 0 ? (
          <Empty icon={HandCoins} title="Nothing here" text="Record money you gave to or took from friends." action={<button className="btn" onClick={() => setAdding(true)}>Add loan</button>} />
        ) : (
          <div className="table-wrap no-drag">
            <table className="table loans-table">
              <thead><tr><th>Friend</th><th>Type</th><th className="r">Balance</th><th className="r">Status</th></tr></thead>
              <motion.tbody layout>
                <AnimatePresence initial={true}>
                  {shown.map((l, i) => (
                    <motion.tr
                      key={l.id} layout onClick={() => setOpenId(l.id)}
                      initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0, transition: { delay: i * 0.04 } }} exit={{ opacity: 0, x: 14 }}
                    >
                      <td>
                        <div className="who"><span className="avatar sm">{l.person[0]}</span><div><strong>{l.person}</strong><small>{fmtDate(l.date)}</small></div></div>
                      </td>
                      <td><span className={`pill ${l.direction}`}>{l.direction === 'lent' ? 'Gave' : 'Took'}</span></td>
                      <td className="r"><strong>{money(l.s.balance)}</strong><small className="of">of {money(l.amount)}</small></td>
                      <td className="r">{l.settled ? <span className="pill done"><Check size={12} /> Settled</span> : isOverdue(l) ? <span className="pill late">Overdue</span> : <span className="pill open">Open</span>}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </motion.tbody>
            </table>
          </div>
        )}
      </section>

      <AddLoanSheet open={adding} onClose={() => setAdding(false)} />
      <LoanDetailSheet loan={open} onClose={() => setOpenId(null)} />
    </Screen>
  )
}

const isOverdue = (l) => !l.settled && l.due && new Date(l.due) < new Date()

function AddLoanSheet({ open, onClose }) {
  const { addLoan } = useStore()
  const [f, setF] = useState({ person: '', direction: 'lent', amount: '', date: toInputDate(new Date()), due: '', note: '' })
  const ok = f.person.trim() && +f.amount > 0
  const save = () => {
    addLoan({ person: f.person.trim(), direction: f.direction, amount: +f.amount, date: fromInputDate(f.date), due: f.due ? fromInputDate(f.due) : null, note: f.note })
    setF({ ...f, person: '', amount: '', note: '', due: '' })
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title="New loan">
      <Segmented id="dir" value={f.direction} onChange={(direction) => setF({ ...f, direction })} options={[{ value: 'lent', label: 'I gave money' }, { value: 'borrowed', label: 'I took money' }]} />
      <Field label="Friend’s name"><input value={f.person} onChange={(e) => setF({ ...f, person: e.target.value })} placeholder="e.g. Rahul" /></Field>
      <Field label="Amount (₹)"><input inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value.replace(/[^0-9.]/g, '') })} placeholder="0" className="big-input" /></Field>
      <div className="row2">
        <Field label="Date"><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Return by (optional)"><input type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></Field>
      </div>
      <Field label="Note"><input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="What was it for?" /></Field>
      <motion.button whileTap={{ scale: 0.97 }} className="btn block" disabled={!ok} onClick={save}>Save loan</motion.button>
    </Sheet>
  )
}

function LoanDetailSheet({ loan, onClose }) {
  const { addRepayment, settleLoan, deleteLoan } = useStore()
  const [amt, setAmt] = useState('')
  if (!loan) return <Sheet open={false} onClose={onClose} />
  const s = loanStats(loan)
  const lent = loan.direction === 'lent'
  return (
    <Sheet open={!!loan} onClose={onClose} title={loan.person}>
      <div className="loan-sum">
        <Ring value={s.pct} size={92} stroke={9}><strong>{Math.round(s.pct * 100)}%</strong></Ring>
        <div>
          <small>{lent ? 'You gave' : 'You took'} on {fmtDate(loan.date)}</small>
          <h3>{money(loan.amount)}</h3>
          <small>{loan.settled ? 'Fully settled 🎉' : `${money(s.balance)} ${lent ? 'left to get back' : 'left to repay'}`}</small>
          {loan.due && <small className={isOverdue(loan) ? 'neg' : ''}>Due {fmtDate(loan.due)}</small>}
        </div>
      </div>
      {loan.note && <p className="note">“{loan.note}”</p>}
      <Progress value={s.pct} />

      {!loan.settled && (
        <div className="repay">
          <input inputMode="decimal" placeholder={`Amount ${lent ? 'received' : 'paid back'}`} value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^0-9.]/g, ''))} />
          <motion.button whileTap={{ scale: 0.95 }} className="btn" disabled={!(+amt > 0)} onClick={() => { addRepayment(loan.id, Math.min(+amt, s.balance), new Date().toISOString()); setAmt('') }}>
            Record
          </motion.button>
        </div>
      )}

      <h5 className="sub">History</h5>
      <div className="history">
        <div className="hist-row"><span className="dot" /> <span>{lent ? 'Gave' : 'Took'} {money(loan.amount)}</span><small>{fmtDate(loan.date)}</small></div>
        <AnimatePresence>
          {loan.repayments.map((r) => (
            <motion.div key={r.id} className="hist-row" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <span className="dot ok" /> <span>{lent ? 'Received' : 'Paid back'} {money(r.amount)}</span><small>{fmtDate(r.date)}</small>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="row2">
        <motion.button whileTap={{ scale: 0.97 }} className="btn ghost" onClick={() => settleLoan(loan.id)}>
          {loan.settled ? <><Undo2 size={16} /> Reopen</> : <><Check size={16} /> Mark settled</>}
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} className="btn danger" onClick={() => { deleteLoan(loan.id); onClose() }}><Trash2 size={16} /> Delete</motion.button>
      </div>
    </Sheet>
  )
}
