import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Plus, ImagePlus, CalendarClock, Check, Trash2, Camera } from 'lucide-react'
import { useStore, monthKey } from '../store.jsx'
import { Screen, Money, Sheet, Field, Ring, Empty, listVariants, itemVariants } from '../components/ui.jsx'
import { money, fmtDate, emiStats, compressImage, toInputDate, MONTHS } from '../utils.js'

const COLORS = ['#B5E550', '#FF8A3D', '#4EA8DE', '#F15BB5', '#9B5DE5', '#2EC4B6']

export default function Emi({ go }) {
  const { state } = useStore()
  const [adding, setAdding] = useState(false)
  const [openId, setOpenId] = useState(null)
  const list = state.emis.map((e) => ({ e, s: emiStats(e) }))
  const monthly = list.filter((x) => x.s.remaining > 0).reduce((a, x) => a + x.e.amount, 0)
  const outstanding = list.reduce((a, x) => a + x.s.left, 0)
  const open = state.emis.find((e) => e.id === openId)

  return (
    <Screen>
      <header className="top center">
        <motion.button whileTap={{ scale: 0.9 }} className="icon-btn" onClick={() => go('home')}><ArrowLeft size={20} /></motion.button>
        <h2>EMI Tracker</h2>
        <motion.button whileTap={{ scale: 0.9 }} className="icon-btn accent" onClick={() => setAdding(true)} aria-label="Add EMI"><Plus size={20} /></motion.button>
      </header>

      <div className="tiles">
        <motion.div className="tile lime" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <small>Monthly EMIs</small>
          <Money value={monthly} className="tile-amt" />
          <span className="tile-delta">{list.filter((x) => x.s.remaining > 0).length} active</span>
        </motion.div>
        <motion.div className="tile dark" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <small>Outstanding</small>
          <Money value={outstanding} className="tile-amt" />
          <span className="tile-delta">across all loans</span>
        </motion.div>
      </div>

      {list.length === 0 ? (
        <section className="card"><Empty icon={CalendarClock} title="No EMIs yet" text="Add a phone, bike or home loan EMI and attach a photo of the bill or product." action={<button className="btn" onClick={() => setAdding(true)}>Add EMI</button>} /></section>
      ) : (
        <motion.div className="emi-list" variants={listVariants} initial="hidden" animate="show">
          {list.map(({ e, s }) => (
            <motion.button layout variants={itemVariants} key={e.id} className="emi-card" style={{ '--emi': e.color }} onClick={() => setOpenId(e.id)} whileTap={{ scale: 0.98 }}>
              <div className="emi-thumb">
                {e.image ? <img src={e.image} alt="" /> : <ImagePlus size={22} />}
              </div>
              <div className="emi-mid">
                <strong>{e.name}</strong>
                <small>{e.lender}</small>
                <div className="emi-meta">
                  <span>{money(e.amount)}/mo</span>
                  {s.next ? <span className={s.daysLeft < 0 ? 'late' : ''}>{s.daysLeft < 0 ? `Overdue ${-s.daysLeft}d` : s.daysLeft === 0 ? 'Due today' : `Due in ${s.daysLeft}d`}</span> : <span className="ok">Closed ✓</span>}
                </div>
              </div>
              <Ring value={s.pct} size={58} stroke={6} color={e.color}><small className="ring-txt">{s.paidCount}/{e.tenure}</small></Ring>
            </motion.button>
          ))}
        </motion.div>
      )}

      <EmiFormSheet open={adding} onClose={() => setAdding(false)} />
      <EmiDetailSheet emi={open} onClose={() => setOpenId(null)} />
    </Screen>
  )
}

function ImagePicker({ value, onChange }) {
  const ref = useRef()
  const [busy, setBusy] = useState(false)
  return (
    <div className="img-pick no-drag" onClick={() => ref.current.click()}>
      <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0]
        if (!f) return
        setBusy(true)
        try { onChange(await compressImage(f)) } finally { setBusy(false); e.target.value = '' }
      }} />
      <AnimatePresence mode="wait">
        {value ? (
          <motion.img key={value.slice(-24)} src={value} alt="EMI attachment" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} />
        ) : (
          <motion.div key="ph" className="img-ph" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {busy ? <span className="spinner" /> : <Camera size={26} />}
            <span>Upload photo of bill / product</span>
          </motion.div>
        )}
      </AnimatePresence>
      {value && <span className="img-change">Change photo</span>}
    </div>
  )
}

function EmiFormSheet({ open, onClose }) {
  const { addEmi } = useStore()
  const blank = { name: '', lender: '', amount: '', tenure: '12', startDate: toInputDate(new Date()), dueDay: '5', image: null, color: COLORS[0], paidSoFar: '0' }
  const [f, setF] = useState(blank)
  const ok = f.name.trim() && +f.amount > 0 && +f.tenure > 0
  const save = () => {
    const [y, m] = f.startDate.split('-').map(Number)
    const paid = []
    for (let i = 0; i < Math.min(+f.paidSoFar || 0, +f.tenure); i++) paid.push(monthKey(new Date(y, m - 1 + i, 1)))
    addEmi({ name: f.name.trim(), lender: f.lender.trim() || 'Lender', amount: +f.amount, tenure: +f.tenure, startDate: new Date(y, m - 1, +f.dueDay || 5).toISOString(), dueDay: +f.dueDay || 5, image: f.image, color: f.color, paid })
    setF(blank)
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title="New EMI">
      <ImagePicker value={f.image} onChange={(image) => setF({ ...f, image })} />
      <div className="row2">
        <Field label="What is it?"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="iPhone, Bike…" /></Field>
        <Field label="Lender / Bank"><input value={f.lender} onChange={(e) => setF({ ...f, lender: e.target.value })} placeholder="HDFC, Bajaj…" /></Field>
      </div>
      <div className="row2">
        <Field label="EMI amount (₹)"><input inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value.replace(/[^0-9.]/g, '') })} placeholder="0" /></Field>
        <Field label="Tenure (months)"><input inputMode="numeric" value={f.tenure} onChange={(e) => setF({ ...f, tenure: e.target.value.replace(/\D/g, '') })} /></Field>
      </div>
      <div className="row3">
        <Field label="First EMI"><input type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></Field>
        <Field label="Due day"><input inputMode="numeric" value={f.dueDay} onChange={(e) => setF({ ...f, dueDay: e.target.value.replace(/\D/g, '').slice(0, 2) })} /></Field>
        <Field label="Already paid"><input inputMode="numeric" value={f.paidSoFar} onChange={(e) => setF({ ...f, paidSoFar: e.target.value.replace(/\D/g, '') })} /></Field>
      </div>
      <div className="swatches">
        {COLORS.map((c) => (
          <motion.button key={c} whileTap={{ scale: 0.85 }} className={`swatch ${f.color === c ? 'on' : ''}`} style={{ background: c }} onClick={() => setF({ ...f, color: c })} />
        ))}
      </div>
      {+f.amount > 0 && +f.tenure > 0 && <p className="muted">Total payable: <strong>{money(+f.amount * +f.tenure)}</strong></p>}
      <motion.button whileTap={{ scale: 0.97 }} className="btn block" disabled={!ok} onClick={save}>Save EMI</motion.button>
    </Sheet>
  )
}

function EmiDetailSheet({ emi, onClose }) {
  const { updateEmi, toggleEmiMonth, deleteEmi } = useStore()
  if (!emi) return <Sheet open={false} onClose={onClose} />
  const s = emiStats(emi)
  const start = new Date(emi.startDate)
  const months = Array.from({ length: emi.tenure }, (_, i) => new Date(start.getFullYear(), start.getMonth() + i, 1))
  return (
    <Sheet open onClose={onClose} title={emi.name}>
      <ImagePicker value={emi.image} onChange={(image) => updateEmi(emi.id, { image })} />
      <div className="emi-detail-stats">
        <div><small>Monthly</small><strong>{money(emi.amount)}</strong></div>
        <div><small>Paid</small><strong className="pos">{money(s.paidAmount)}</strong></div>
        <div><small>Remaining</small><strong>{money(s.left)}</strong></div>
      </div>
      <p className="muted">{emi.lender} · {s.paidCount} of {emi.tenure} paid · ends {MONTHS[s.end.getMonth()]} {s.end.getFullYear()}</p>

      {s.next && (
        <motion.button whileTap={{ scale: 0.97 }} className="btn block" onClick={() => toggleEmiMonth(emi.id, s.next.mk)}>
          <Check size={18} /> Mark {MONTHS[s.next.date.getMonth()]} EMI as paid
        </motion.button>
      )}

      <h5 className="sub">Payment schedule <small className="muted">(tap to toggle)</small></h5>
      <div className="months-grid">
        {months.map((d) => {
          const mk = monthKey(d)
          const paid = emi.paid.includes(mk)
          return (
            <motion.button key={mk} whileTap={{ scale: 0.88 }} className={`mcell ${paid ? 'paid' : ''} ${mk === monthKey(new Date()) ? 'now' : ''}`} style={{ '--emi': emi.color }} onClick={() => toggleEmiMonth(emi.id, mk)}>
              <AnimatePresence>{paid && <motion.span className="mcell-bg" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} />}</AnimatePresence>
              <span className="mcell-t">{MONTHS[d.getMonth()]}</span>
              <small className="mcell-y">{String(d.getFullYear()).slice(2)}</small>
            </motion.button>
          )
        })}
      </div>
      <p className="muted small">Marking a month paid also logs it as an <b>EMI</b> expense for that month. Started {fmtDate(emi.startDate)}.</p>
      <motion.button whileTap={{ scale: 0.97 }} className="btn danger block" onClick={() => { deleteEmi(emi.id); onClose() }}><Trash2 size={16} /> Delete EMI</motion.button>
    </Sheet>
  )
}
