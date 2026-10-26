import { Link } from 'react-router'
import { BRANCHES, INSTAGRAM_MEN, INSTAGRAM_WOMEN } from '@/lib/brand'

export default function Footer() {
  return (
    <footer className="overflow-hidden bg-ink text-bone">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-4 pt-20 pb-12 sm:px-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <p className="max-w-xs font-heavy text-3xl leading-[0.95] uppercase">
          Delivery anywhere in Lebanon<span className="text-signal">.</span>{' '}
          <span className="text-bone/40">Pay cash when it arrives.</span>
        </p>
        <div>
          <h4 className="text-sm text-bone/50">Shop</h4>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            <li><Link to="/shop/men" className="transition-colors hover:text-gold">Men</Link></li>
            <li><Link to="/shop/women" className="transition-colors hover:text-gold">Women</Link></li>
            <li><Link to="/stores" className="transition-colors hover:text-gold">Our stores</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm text-bone/50">Stores</h4>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            {BRANCHES.map((b) => (
              <li key={b.name}>
                <a href={b.map} target="_blank" rel="noreferrer" className="transition-colors hover:text-gold">{b.name}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm text-bone/50">Follow</h4>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            <li><a href={INSTAGRAM_MEN} target="_blank" rel="noreferrer" className="transition-colors hover:text-gold">@justmove.lb</a></li>
            <li><a href={INSTAGRAM_WOMEN} target="_blank" rel="noreferrer" className="transition-colors hover:text-gold">@justmove_women</a></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 border-t border-bone/10 px-4 py-6 text-xs text-bone/50 sm:flex-row sm:justify-between sm:px-8">
        <span>© {new Date().getFullYear()} Just Move, Beirut</span>
        <span>Prices in USD</span>
      </div>
    </footer>
  )
}
