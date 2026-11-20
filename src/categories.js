import {
  ShoppingBasket, UtensilsCrossed, Smartphone, Receipt, Bus, Fuel, ShoppingBag,
  Clapperboard, HeartPulse, Home, Landmark, GraduationCap, Plane, ArrowLeftRight,
  CircleDashed, Wallet, RotateCcw, PiggyBank,
} from 'lucide-react'

// Each category: id, label, icon, colour (used for chart slices + icon tint)
export const EXPENSE_CATEGORIES = [
  { id: 'grocery', label: 'Grocery', icon: ShoppingBasket, color: '#7BC043' },
  { id: 'food', label: 'Food & Dining', icon: UtensilsCrossed, color: '#F4A261' },
  { id: 'recharge', label: 'Recharge', icon: Smartphone, color: '#4EA8DE' },
  { id: 'bills', label: 'Bills & Utilities', icon: Receipt, color: '#9B5DE5' },
  { id: 'transport', label: 'Transport', icon: Bus, color: '#2EC4B6' },
  { id: 'fuel', label: 'Fuel', icon: Fuel, color: '#E76F51' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: '#F15BB5' },
  { id: 'entertainment', label: 'Entertainment', icon: Clapperboard, color: '#FFB703' },
  { id: 'health', label: 'Health', icon: HeartPulse, color: '#EF476F' },
  { id: 'rent', label: 'Rent', icon: Home, color: '#8D99AE' },
  { id: 'emi', label: 'EMI', icon: Landmark, color: '#3A86FF' },
  { id: 'education', label: 'Education', icon: GraduationCap, color: '#06D6A0' },
  { id: 'travel', label: 'Travel', icon: Plane, color: '#00B4D8' },
  { id: 'transfer', label: 'Transfer', icon: ArrowLeftRight, color: '#A0A0A0' },
  { id: 'other', label: 'Other', icon: CircleDashed, color: '#B0B7A4' },
]

export const INCOME_CATEGORIES = [
  { id: 'salary', label: 'Salary', icon: Wallet, color: '#86C232' },
  { id: 'refund', label: 'Refund', icon: RotateCcw, color: '#4EA8DE' },
  { id: 'income', label: 'Other income', icon: PiggyBank, color: '#B5E550' },
]

const ALL = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]
export const getCategory = (id) => ALL.find((c) => c.id === id) || EXPENSE_CATEGORIES.at(-1)

// Keyword rules used to auto-categorise a merchant / notification text.
// Order matters: first match wins.
const RULES = [
  ['emi', /\b(emi|loan a\/?c|bajaj ?fin|home ?credit|nach|ecs)\b/i],
  ['recharge', /\b(recharge|prepaid|jio|airtel|vodafone|\bvi\b|bsnl|dth|tata ?play|sun ?direct)\b/i],
  ['grocery', /\b(grocer|bigbasket|big ?basket|blinkit|zepto|dmart|d-mart|jiomart|more ?retail|reliance ?fresh|instamart|kirana|supermarket|spencer|nature'?s ?basket|milk|dairy)\b/i],
  ['food', /\b(swiggy|zomato|restaurant|cafe|caf[eé]|dominos|domino'?s|pizza|kfc|mcdonald|burger|starbucks|chai|bakery|eatsure|food)\b/i],
  ['fuel', /\b(petrol|diesel|fuel|hpcl|bpcl|iocl|indian ?oil|bharat ?petroleum|shell)\b/i],
  ['transport', /\b(uber|ola|rapido|metro|irctc|redbus|bus|cab|auto|fastag|parking|namma ?yatri)\b/i],
  ['travel', /\b(makemytrip|goibibo|indigo|air ?india|vistara|akasa|spicejet|hotel|oyo|airbnb|cleartrip|ixigo)\b/i],
  ['entertainment', /\b(netflix|hotstar|spotify|prime ?video|youtube|bookmyshow|pvr|inox|sonyliv|zee5|jiocinema|steam|playstation)\b/i],
  ['bills', /\b(electricity|bescom|tneb|mseb|adani ?elec|water ?bill|gas ?bill|broadband|act ?fibernet|postpaid|bill ?pay|billdesk|insurance|lic)\b/i],
  ['health', /\b(pharma|pharmacy|apollo|medplus|1mg|netmeds|hospital|clinic|diagnostic|lab|doctor|practo)\b/i],
  ['rent', /\b(rent|nobroker|landlord|pg ?fee|hostel)\b/i],
  ['education', /\b(school|college|tuition|udemy|coursera|byju|unacademy|fees?)\b/i],
  ['shopping', /\b(amazon|flipkart|myntra|ajio|meesho|nykaa|croma|reliance ?digital|decathlon|ikea|mall|store|mart)\b/i],
  ['salary', /\b(salary|sal ?cr|payroll)\b/i],
  ['refund', /\b(refund|reversal|cashback|reversed)\b/i],
]

export function guessCategory(text, type = 'expense') {
  for (const [id, re] of RULES) {
    if (!re.test(text)) continue
    const isIncomeCat = INCOME_CATEGORIES.some((c) => c.id === id)
    if (type === 'income' && isIncomeCat) return id
    if (type === 'expense' && !isIncomeCat) return id
  }
  if (type === 'income') return 'income'
  if (/\b(upi|imps|neft|transfer|sent to)\b/i.test(text)) return 'transfer'
  return 'other'
}
