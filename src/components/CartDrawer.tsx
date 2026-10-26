import { useLenis } from 'lenis/react'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { useCart } from '@/cart/CartContext'
import ProductImage from '@/components/ProductImage'
import { money } from '@/lib/format'

export default function CartDrawer() {
  const { lines, isOpen, close, subtotal, setQuantity, remove } = useCart()
  const lenis = useLenis()

  useEffect(() => {
    if (isOpen) lenis?.stop()
    else lenis?.start()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, lenis, close])

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isOpen}>
      <div
        onClick={close}
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        role="dialog"
        aria-label="Shopping bag"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-bone shadow-2xl transition-[transform,visibility] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${
          isOpen ? 'visible translate-x-0' : 'invisible translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-ink/10 px-5">
          <h2 className="text-sm font-medium tracking-wide uppercase">Your bag</h2>
          <button onClick={close} className="-mr-2 p-2 text-sm text-stone hover:text-ink">
            Close
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <p className="font-display text-3xl">Your bag is empty</p>
            <div className="flex gap-3">
              <Link to="/shop/men" onClick={close} className="border border-ink px-5 py-3 text-sm hover:bg-ink hover:text-bone">
                Shop men
              </Link>
              <Link to="/shop/women" onClick={close} className="border border-ink px-5 py-3 text-sm hover:bg-ink hover:text-bone">
                Shop women
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto px-5" data-lenis-prevent>
              {lines.map((l) => (
                <li key={l.variantId} className="flex gap-4 py-5">
                  <Link to={`/product/${l.slug}`} onClick={close} className="h-28 w-21 shrink-0 overflow-hidden bg-bone-2">
                    <ProductImage src={l.image} name={l.name} className="[&_span]:text-sm" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{l.name}</span>
                      <span className="tabular-nums">{money(l.price * l.quantity)}</span>
                    </div>
                    <p className="mt-1 text-xs text-stone">
                      {l.size}
                      {l.color && ` · ${l.color}`}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-ink/20">
                        <button
                          className="h-8 w-8 hover:bg-bone-2"
                          aria-label="Decrease quantity"
                          onClick={() => setQuantity(l.variantId, l.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums">{l.quantity}</span>
                        <button
                          className="h-8 w-8 hover:bg-bone-2 disabled:opacity-30"
                          aria-label="Increase quantity"
                          disabled={l.quantity >= Math.min(l.maxStock, 10)}
                          onClick={() => setQuantity(l.variantId, l.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button onClick={() => remove(l.variantId)} className="text-xs text-stone underline-offset-4 hover:underline">
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-ink/10 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="tabular-nums">{money(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-stone">Delivery calculated at checkout. Cash on delivery available.</p>
              <Link
                to="/checkout"
                onClick={close}
                className="mt-4 block bg-ink py-4 text-center text-sm font-medium tracking-wide text-bone uppercase transition-colors hover:bg-ink-2 active:scale-[0.99]"
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
