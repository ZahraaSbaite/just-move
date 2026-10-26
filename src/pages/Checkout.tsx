import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useCart } from '@/cart/CartContext'
import ProductImage from '@/components/ProductImage'
import { getSettings, placeOrder } from '@/lib/api'
import { CITIES, money, PAYMENT_LABELS } from '@/lib/format'
import { track } from '@/lib/taste'
import { useAsync } from '@/lib/useAsync'
import type { CheckoutCustomer, PaymentMethod } from '@/types'

const field =
  'w-full border border-ink/20 bg-transparent px-4 py-3.5 outline-none transition-colors placeholder:text-stone focus:border-ink'

export default function Checkout() {
  const { lines, subtotal, clear } = useCart()
  const { data: settings } = useAsync(getSettings, [])
  const navigate = useNavigate()

  const [customer, setCustomer] = useState<CheckoutCustomer>({ name: '', phone: '', email: '', city: '', address: '', notes: '' })
  const [method, setMethod] = useState<PaymentMethod>('cod')
  const [reference, setReference] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const deliveryFee =
    settings && settings.free_delivery_over != null && subtotal >= settings.free_delivery_over ? 0 : settings?.delivery_fee ?? 0
  const total = subtotal + deliveryFee

  const set = (k: keyof CheckoutCustomer) => (e: { target: { value: string } }) =>
    setCustomer((c) => ({ ...c, [k]: e.target.value }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (submitting || honeypot) return
    setSubmitting(true)
    setError('')
    try {
      const order = await placeOrder({
        customer,
        items: lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
        payment_method: method,
        payment_reference: method === 'whish' || method === 'omt' ? reference : undefined,
      })
      lines.forEach((l) => track(l.productId, 'purchase'))
      clear()
      navigate(`/order/${order.id}`, { replace: true, state: { orderNumber: order.order_number } })
    } catch (err) {
      setError((err as Error).message || 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (lines.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 pt-16 text-center">
        <p className="font-display text-5xl">Your bag is empty</p>
        <Link to="/" className="text-sm underline underline-offset-4">Continue shopping</Link>
      </div>
    )
  }

  const methods: { id: PaymentMethod; hint: string; disabled?: boolean }[] = [
    { id: 'cod', hint: 'Pay the driver in cash when your order arrives.' },
    { id: 'whish', hint: settings?.whish_number ? `Send ${money(total)} to ${settings.whish_number}, then enter the reference below.` : 'Send the total by Whish, then enter the reference below.' },
    { id: 'omt', hint: settings?.omt_name ? `Send ${money(total)} via OMT to "${settings.omt_name}", then enter the reference below.` : 'Send the total via OMT, then enter the reference below.' },
    { id: 'card', hint: settings?.card_enabled ? 'Visa / Mastercard.' : 'Coming soon.', disabled: !settings?.card_enabled },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-28 pb-24 sm:px-8">
      <h1 className="font-display text-6xl">Checkout</h1>

      <form onSubmit={submit} className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          <fieldset className="space-y-3">
            <legend className="mb-4 text-sm font-medium tracking-wide uppercase">Delivery details</legend>
            <input required autoComplete="name" placeholder="Full name" value={customer.name} onChange={set('name')} className={field} />
            <input required type="tel" inputMode="tel" autoComplete="tel" placeholder="Phone (e.g. 03 123 456)" value={customer.phone} onChange={set('phone')} className={field} />
            <input type="email" autoComplete="email" placeholder="Email (optional)" value={customer.email} onChange={set('email')} className={field} />
            <select required value={customer.city} onChange={set('city')} className={`${field} ${customer.city ? '' : 'text-stone'}`}>
              <option value="" disabled>City / area</option>
              {CITIES.map((c) => <option key={c} value={c} className="text-ink">{c}</option>)}
            </select>
            <textarea required rows={3} autoComplete="street-address" placeholder="Address — street, building, floor, nearby landmark" value={customer.address} onChange={set('address')} className={field} />
            <textarea rows={2} placeholder="Notes for the driver (optional)" value={customer.notes} onChange={set('notes')} className={field} />
            {/* Bots fill every field; humans never see this one. */}
            <input tabIndex={-1} autoComplete="off" aria-hidden value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" name="website" />
          </fieldset>

          <fieldset>
            <legend className="mb-4 text-sm font-medium tracking-wide uppercase">Payment</legend>
            <div className="divide-y divide-ink/10 border border-ink/20">
              {methods.map((m) => (
                <label key={m.id} className={`flex cursor-pointer gap-4 p-4 ${m.disabled ? 'cursor-not-allowed opacity-50' : ''} ${method === m.id ? 'bg-bone-2' : ''}`}>
                  <input type="radio" name="payment" value={m.id} disabled={m.disabled} checked={method === m.id} onChange={() => setMethod(m.id)} className="mt-1 accent-ink" />
                  <div>
                    <p className="text-sm font-medium">{PAYMENT_LABELS[m.id]}</p>
                    <p className="mt-0.5 text-sm text-stone">{m.hint}</p>
                  </div>
                </label>
              ))}
            </div>
            {(method === 'whish' || method === 'omt') && (
              <input required minLength={3} placeholder="Transfer reference number" value={reference} onChange={(e) => setReference(e.target.value)} className={`${field} mt-3`} />
            )}
          </fieldset>
        </div>

        <aside className="h-fit border border-ink/10 bg-bone-2/50 p-6 lg:sticky lg:top-24">
          <h2 className="text-sm font-medium tracking-wide uppercase">Order summary</h2>
          <ul className="mt-5 space-y-4">
            {lines.map((l) => (
              <li key={l.variantId} className="flex gap-3 text-sm">
                <div className="relative h-20 w-15 shrink-0 bg-bone-2">
                  <ProductImage src={l.image} name="" className="[&_span]:hidden" />
                  <span className="absolute -top-2 -right-2 grid h-5 w-5 place-items-center rounded-full bg-ink text-[11px] text-bone">{l.quantity}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{l.name}</p>
                  <p className="text-xs text-stone">{l.size}{l.color && ` · ${l.color}`}</p>
                </div>
                <span className="tabular-nums">{money(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-2 border-t border-ink/10 pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{money(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd className="tabular-nums">{deliveryFee === 0 ? 'Free' : money(deliveryFee)}</dd></div>
            <div className="flex justify-between border-t border-ink/10 pt-3 text-base font-medium"><dt>Total</dt><dd className="tabular-nums">{money(total)}</dd></div>
          </dl>
          {settings?.free_delivery_over != null && deliveryFee > 0 && (
            <p className="mt-3 text-xs text-stone">Free delivery on orders over {money(settings.free_delivery_over)}.</p>
          )}

          {error && <p className="mt-4 text-sm text-sale" role="alert">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !settings}
            className="mt-6 w-full bg-ink py-4 text-sm font-medium tracking-wide text-bone uppercase transition-[background-color,transform] hover:bg-ink-2 active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? 'Placing order…' : `Place order · ${money(total)}`}
          </button>
          <p className="mt-3 text-center text-xs text-stone">We'll call you to confirm before delivery.</p>
        </aside>
      </form>
    </div>
  )
}
