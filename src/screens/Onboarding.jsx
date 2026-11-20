import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, BellRing, HandCoins, Landmark, ShoppingBasket, Smartphone } from 'lucide-react'
import { useStore } from '../store.jsx'
import { Logo } from '../components/ui.jsx'

const floaters = [
  { Icon: BellRing, x: '8%', y: '14%', d: 0 },
  { Icon: ShoppingBasket, x: '76%', y: '10%', d: 0.6 },
  { Icon: HandCoins, x: '80%', y: '38%', d: 1.2 },
  { Icon: Smartphone, x: '6%', y: '40%', d: 0.9 },
  { Icon: Landmark, x: '44%', y: '4%', d: 0.3 },
]

export default function Onboarding() {
  const { finishOnboarding } = useStore()
  const [name, setName] = useState('')
  return (
    <div className="onb">
      <div className="onb-art">
        {floaters.map(({ Icon, x, y, d }, i) => (
          <motion.span
            key={i} className="onb-float" style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
            transition={{ opacity: { delay: 0.2 + d * 0.3 }, scale: { delay: 0.2 + d * 0.3, type: 'spring' }, y: { repeat: Infinity, duration: 3.2, delay: d, ease: 'easeInOut' } }}
          >
            <Icon size={22} />
          </motion.span>
        ))}
        <motion.div className="onb-blob" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 14 }} />
        <motion.div className="onb-logo" initial={{ y: 40, rotate: -12, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 12, delay: 0.15 }}>
          <Logo size={150} />
        </motion.div>
      </div>

      <motion.div className="onb-copy" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, type: 'spring', stiffness: 160, damping: 20 }}>
        <h1>Every rupee,<br />tracked <span className="onb-chip"><ArrowUpRight size={22} /></span><br />automatically</h1>
        <p>Purrse reads your bank &amp; UPI notifications, sorts spends into categories, and keeps tabs on friend loans and EMIs.</p>
        <input className="onb-input" placeholder="What should we call you?" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="onb-actions">
          <button className="link" onClick={() => finishOnboarding(name, true)}>Try with sample data</button>
          <motion.button whileTap={{ scale: 0.92 }} className="onb-go" onClick={() => finishOnboarding(name, false)}>
            <span>Let’s Start</span>
            <span className="onb-go-ic"><ArrowUpRight size={22} /></span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
