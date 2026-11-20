import { guessCategory } from './categories.js'

/*
 * Parses bank / UPI / wallet notification or SMS text into a transaction.
 * Works with the common Indian bank formats, e.g.
 *   "Rs.450.00 debited from A/c XX1234 on 12-11-26 to VPA swiggy@icici. UPI Ref 6312..."
 *   "INR 2,000 credited to your a/c XX9921 by NEFT from ACME PVT LTD (Salary)"
 *   "You paid ₹199 to Jio Prepaid using Google Pay"
 *   "Spent Rs 1,250 on HDFC Bank Card x4321 at DMART on 2026-11-02"
 * Returns null when no amount could be found.
 */

const AMOUNT_RE = /(?:₹|rs\.?|inr|rupees)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i
const AMOUNT_AFTER_RE = /([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:₹|rs\.?|inr|rupees)\b/i

const DEBIT_RE = /\b(debited|debit|spent|paid|sent|withdrawn|withdrawal|purchase|deducted|txn of|payment of|transferred to|dr\b)/i
const CREDIT_RE = /\b(credited|credit|received|deposited|refund|cashback|added to|cr\b)/i
const SKIP_RE = /\b(otp|one time password|is due|due on|minimum amount due|will be debited|request(ed)? (money|payment)|collect request)\b/i

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }

function parseDate(text) {
  let m = text.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/)
  if (m) return mk(+m[1], +m[2] - 1, +m[3])
  m = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/)
  if (m) return mk(fixYear(+m[3]), +m[2] - 1, +m[1])
  m = text.match(/\b(\d{1,2})[-\s]?([A-Za-z]{3})[a-z]*[-\s,]?\s?(\d{2,4})\b/)
  if (m && MONTHS[m[2].toLowerCase()] !== undefined) return mk(fixYear(+m[3]), MONTHS[m[2].toLowerCase()], +m[1])
  return null
}
const fixYear = (y) => (y < 100 ? 2000 + y : y)
function mk(y, mo, d) {
  const now = new Date()
  const dt = new Date(y, mo, d, now.getHours(), now.getMinutes())
  if (isNaN(dt) || mo > 11 || d > 31 || dt > new Date(now.getTime() + 864e5)) return null
  return dt
}

function cleanName(s) {
  return s
    .replace(/@[a-z0-9.\-_]+/i, '') // drop the UPI handle domain
    .replace(/[._]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 4)
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toUpperCase()))
    .join(' ')
}

function parseMerchant(text) {
  const patterns = [
    /\b(?:to|at)\s+vpa\s+([a-z0-9.\-_]+@[a-z]+)/i,
    /\bInfo[:\s-]+(?:UPI\/)?(?:[A-Z]+\/)?(?:\d+\/)?([A-Za-z][A-Za-z0-9 &.\-]{2,30})/i,
    /\b(?:paid|sent)\s+(?:₹|rs\.?|inr)?\s*[0-9,.]*\s*to\s+([A-Za-z][A-Za-z0-9 &.@\-_']{1,40}?)(?=\s+(?:on|using|via|from|ref|upi|for)\b|[.,]|$)/i,
    /\b(?:at|to)\s+([A-Za-z][A-Za-z0-9 &.@\-_']{1,40}?)(?=\s+(?:on|using|via|from|ref|upi|for|avl|bal|txn)\b|[.,;]|$)/i,
    /\bfrom\s+([A-Za-z][A-Za-z0-9 &.@\-_']{1,40}?)(?=\s+(?:on|using|via|ref|upi|for|avl|bal)\b|[.,;()]|$)/i,
    /\bby\s+([A-Za-z][A-Za-z0-9 &.@\-_']{1,40}?)(?=\s+(?:on|using|via|ref|for|avl|bal)\b|[.,;()]|$)/i,
    /\bfor\s+([A-Za-z][A-Za-z0-9 &.\-_']{2,40}?)(?=\s+(?:on|using|via|ref|avl|bal)\b|[.,;()]|$)/i,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (!m) continue
    const name = m[1].trim()
    if (/^(?:(?:your|a\/?c|ac|account|card|xx\w*|rs|inr|upi|neft|imps)\b|\d)/i.test(name)) continue
    return cleanName(name)
  }
  return null
}

export function parseNotification(raw, fallbackDate) {
  const text = String(raw || '').replace(/\s+/g, ' ').trim()
  if (!text || SKIP_RE.test(text)) return null
  const am = text.match(AMOUNT_RE) || text.match(AMOUNT_AFTER_RE)
  if (!am) return null
  const amount = parseFloat(am[1].replace(/,/g, ''))
  if (!amount || amount <= 0) return null

  const debitIdx = text.search(DEBIT_RE)
  const creditIdx = text.search(CREDIT_RE)
  let type = 'expense'
  if (creditIdx >= 0 && (debitIdx < 0 || creditIdx < debitIdx)) type = 'income'

  const merchant = parseMerchant(text) || (type === 'income' ? 'Money received' : 'Payment')
  const account = (text.match(/(?:a\/?c|acct|account|card)[^0-9x*]{0,12}[x*]*\s?(\d{3,4})\b/i) || [])[1] || null
  const bank = (text.match(/\b(HDFC|ICICI|SBI|Axis|Kotak|Yes Bank|IDFC|PNB|BOB|Canara|IndusInd|Federal|Paytm|PhonePe|Google Pay|GPay|Amazon Pay)\b/i) || [])[1] || null

  const bankName = bank && (bank.length <= 5 ? bank.toUpperCase() : bank)
  return {
    type,
    amount,
    merchant,
    category: guessCategory(`${merchant} ${text}`, type),
    date: (parseDate(text) || (fallbackDate ? new Date(fallbackDate) : new Date())).toISOString(),
    account,
    bank: bankName,
    raw: text,
  }
}

export const SAMPLE_NOTIFICATIONS = [
  'Rs.349.00 debited from A/c XX1234 on 20-11-26 to VPA swiggy@icici. UPI Ref 631245890. Not you? Call 1800...',
  'You paid ₹239 to Jio Prepaid using Google Pay. UPI transaction ID 4521789',
  'Spent Rs 1,862.50 on HDFC Bank Card x4321 at DMART on 2026-11-19. Avl bal Rs 42,110',
  'INR 500 credited to your a/c XX1234 by UPI from RAHUL SHARMA on 19-Nov-26. Ref 77812',
]
