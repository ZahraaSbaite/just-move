import { useLenis } from 'lenis/react'
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { useCart } from '@/cart/CartContext'
import Knight from '@/components/Knight'

const NAV = [
  { to: '/shop/men', label: 'Men' },
  { to: '/shop/women', label: 'Women' },
  { to: '/stores', label: 'Stores' },
]

export default function Header() {
  const { count, open } = useCart()
  const { pathname } = useLocation()
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [hidden, setHidden] = useState(false)
  const [overHero, setOverHero] = useState(true)
  const menuOpen = menuFor === pathname // closes itself on navigation

  // Hide on scroll down, reveal on scroll up; go transparent while over the home hero.
  useLenis(({ scroll, direction }) => {
    setHidden(scroll > 160 && direction === 1)
    setOverHero(scroll < window.innerHeight - 80)
  })

  const clear = pathname === '/' && overHero && !menuOpen

  return (
    <>
      <a href="#main" className="sr-only z-[70] bg-ink px-4 py-2 text-bone focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-[transform,background-color,color,border-color] duration-500 ${
          hidden && !menuOpen ? '-translate-y-full' : ''
        } ${clear ? 'border-b border-transparent text-bone' : 'border-b border-ink/10 bg-bone/90 text-ink backdrop-blur-md'}`}
      >
        <div className="mx-auto grid h-16 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-8">
          <nav className="hidden gap-8 text-[15px] md:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `relative py-1 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-current after:transition-transform after:duration-300 ${
                    isActive ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <button
            className="-ml-2 justify-self-start p-2 md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuFor(menuOpen ? null : pathname)}
          >
            <div className="flex w-6 flex-col gap-1.5">
              <span className={`h-px bg-current transition-transform duration-300 ${menuOpen ? 'translate-y-[3.5px] rotate-45' : ''}`} />
              <span className={`h-px bg-current transition-transform duration-300 ${menuOpen ? '-translate-y-[3.5px] -rotate-45' : ''}`} />
            </div>
          </button>

          <Link to="/" className="flex items-center gap-2.5" aria-label="Just Move home">
            <span className="text-[15px] font-semibold tracking-[0.32em]">JUST</span>
            <Knight className="-mt-1 h-8" />
            <span className="text-[15px] font-semibold tracking-[0.32em]">MOVE</span>
          </Link>

          <button onClick={open} className="group -mr-2 flex items-center gap-2 justify-self-end p-2 text-[15px]" aria-label={`Bag, ${count} items`}>
            <span className="hidden sm:inline">Bag</span>
            <span
              className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs tabular-nums transition-transform duration-300 group-hover:scale-110 ${
                clear ? 'bg-bone text-ink' : 'bg-ink text-bone'
              }`}
            >
              {count}
            </span>
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-30 bg-bone pt-16 transition-[opacity,visibility] duration-300 md:hidden ${
          menuOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <nav className="flex flex-col px-4 pt-8">
          {NAV.map((n, i) => (
            <Link
              key={n.to}
              to={n.to}
              style={{ transitionDelay: menuOpen ? `${80 + i * 50}ms` : '0ms' }}
              className={`flex items-baseline justify-between border-b border-ink/10 py-5 font-display text-5xl transition-[opacity,transform] duration-500 ${
                menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
            >
              {n.label}
              <span className="font-sans text-sm text-stone">0{i + 1}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
