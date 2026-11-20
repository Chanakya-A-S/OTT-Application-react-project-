import { AnimatePresence, motion } from 'framer-motion'
import { Delete } from 'lucide-react'
import { getCategory } from '../categories.js'
import { fmtDay, money, useCountUp } from '../utils.js'

export function Logo({ size = 40 }) {
  // App mark (cat head with a rising bar chart) – rendered from public/icon-512.png
  return <img src="/icon-512.png" width={size} height={size} alt="Purrse" className="logo" style={{ borderRadius: size * 0.28 }} />
}

export function Money({ value, className, dec }) {
  const v = useCountUp(value)
  return <span className={className}>{money(v, dec)}</span>
}

export function Screen({ children, className = '' }) {
  return (
    <motion.main
      className={`screen ${className}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
    >
      {children}
    </motion.main>
  )
}

export const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
}
export const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 26 } },
}

export function Sheet({ open, onClose, title, children, actions }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="sheet-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="sheet-backdrop" onClick={onClose} />
          <motion.div
            className="sheet"
            role="dialog"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => { if (i.offset.y > 110 || i.velocity.y > 600) onClose() }}
          >
            <div className="sheet-grip" />
            {title && (
              <div className="sheet-head">
                <h3>{title}</h3>
                {actions}
              </div>
            )}
            <div className="sheet-body" onPointerDownCapture={(e) => e.target.closest('input,textarea,select,.no-drag') && e.stopPropagation()}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function CatIcon({ id, size = 44 }) {
  const c = getCategory(id)
  const Icon = c.icon
  return (
    <span className="cat-icon" style={{ '--c': c.color, width: size, height: size }}>
      <Icon size={size * 0.46} strokeWidth={2} />
    </span>
  )
}

export function TxnRow({ t, onClick }) {
  const c = getCategory(t.category)
  return (
    <motion.button layout variants={itemVariants} className="txn" onClick={onClick} whileTap={{ scale: 0.98 }}>
      <CatIcon id={t.category} />
      <div className="txn-mid">
        <strong>{t.merchant}</strong>
        <small>
          {c.label} · {fmtDay(t.date)}
          {t.source === 'notification' && <span className="tag">auto</span>}
        </small>
      </div>
      <span className={`txn-amt ${t.type}`}>{t.type === 'income' ? '+' : '-'}{money(t.amount, true)}</span>
    </motion.button>
  )
}

export function Segmented({ options, value, onChange, id }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {value === o.value && <motion.span layoutId={`seg-${id}`} className="seg-pill" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
          <span className="seg-label">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

export function Keypad({ value, onChange }) {
  const press = (k) => {
    if (k === 'del') return onChange(value.slice(0, -1))
    if (k === '.' && value.includes('.')) return
    if (value.includes('.') && value.split('.')[1].length >= 2) return
    if (value.replace('.', '').length >= 9) return
    onChange(value === '0' && k !== '.' ? k : value + k)
  }
  return (
    <div className="keypad">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'].map((k) => (
        <motion.button key={k} whileTap={{ scale: 0.9 }} className="key" onClick={() => press(k)}>
          {k === 'del' ? <Delete size={20} /> : k}
        </motion.button>
      ))}
    </div>
  )
}

export function Progress({ value, color }) {
  return (
    <div className="progress">
      <motion.div
        className="progress-fill"
        style={color ? { background: color } : undefined}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
        transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.15 }}
      />
    </div>
  )
}

export function Ring({ value, size = 64, stroke = 7, children, color = 'var(--accent)' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--track)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          style={{ rotate: -90, transformOrigin: '50% 50%' }}
        />
      </svg>
      <div className="ring-in">{children}</div>
    </div>
  )
}

export function Empty({ icon: Icon, title, text, action }) {
  return (
    <motion.div className="empty" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
      <span className="empty-icon"><Icon size={26} /></span>
      <strong>{title}</strong>
      <p>{text}</p>
      {action}
    </motion.div>
  )
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}
