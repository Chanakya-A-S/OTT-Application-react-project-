import { useEffect, useRef, useState } from 'react'

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })
const inr0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
export const money = (n, dec = false) => `₹${(dec ? inr : inr0).format(Math.round((n || 0) * 100) / 100)}`
export const compact = (n) => (n >= 1e5 ? `₹${(n / 1e5).toFixed(n >= 1e6 ? 0 : 1)}L` : n >= 1e3 ? `₹${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k` : `₹${Math.round(n)}`)

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const fmtDate = (d) => {
  const x = new Date(d)
  return `${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`
}
export const fmtDay = (d) => {
  const x = new Date(d)
  const today = new Date()
  const y = new Date(today.getTime() - 864e5)
  const same = (a, b) => a.toDateString() === b.toDateString()
  const time = x.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  if (same(x, today)) return `Today · ${time}`
  if (same(x, y)) return `Yesterday · ${time}`
  return `${x.getDate()} ${MONTHS[x.getMonth()]} · ${time}`
}
export const monthLabel = (mk, long = false) => {
  const [y, m] = mk.split('-').map(Number)
  return `${(long ? MONTHS_LONG : MONTHS)[m - 1]}${long ? ` ${y}` : ''}`
}
export const toInputDate = (d) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
export const fromInputDate = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  const now = new Date()
  return new Date(y, m - 1, d, now.getHours(), now.getMinutes()).toISOString()
}

export function lastMonths(n, from = new Date()) {
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(from.getFullYear(), from.getMonth() - i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

/** Smoothly animates a number towards `value` (ease-out cubic). */
export function useCountUp(value, duration = 900) {
  const [shown, setShown] = useState(value)
  const from = useRef(0)
  useEffect(() => {
    const start = performance.now()
    const a = from.current
    let raf
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration)
      const e = 1 - Math.pow(1 - p, 3)
      const v = a + (value - a) * e
      setShown(v)
      if (p < 1) raf = requestAnimationFrame(tick)
      else from.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); from.current = value }
  }, [value, duration])
  return shown
}

/** Downscale an uploaded image to keep storage small. */
export function compressImage(file, max = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * scale)
        c.height = Math.round(img.height * scale)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export function emiStats(emi, now = new Date()) {
  const start = new Date(emi.startDate)
  const paidCount = emi.paid.length
  const remaining = Math.max(0, emi.tenure - paidCount)
  const total = emi.amount * emi.tenure
  // next due = first unpaid month from start
  let next = null
  for (let i = 0; i < emi.tenure; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, Math.min(emi.dueDay || start.getDate(), 28))
    const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!emi.paid.includes(mk)) { next = { date: d, mk }; break }
  }
  const daysLeft = next ? Math.ceil((next.date - now) / 864e5) : null
  const end = new Date(start.getFullYear(), start.getMonth() + emi.tenure - 1, emi.dueDay || 5)
  return { paidCount, remaining, total, paidAmount: paidCount * emi.amount, left: remaining * emi.amount, next, daysLeft, end, pct: paidCount / emi.tenure }
}

export function loanStats(l) {
  const paid = l.repayments.reduce((a, r) => a + r.amount, 0)
  const balance = l.settled ? 0 : Math.max(0, l.amount - paid)
  return { paid, balance, pct: l.settled ? 1 : Math.min(1, paid / l.amount) }
}
