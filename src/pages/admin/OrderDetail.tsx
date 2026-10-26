import { useState } from 'react'
import { Link, useParams } from 'react-router'
import ProductImage from '@/components/ProductImage'
import { adminGetOrder, adminUpdateOrder } from '@/lib/api'
import { money, PAYMENT_LABELS, PAYMENT_STATUS_LABELS, STATUS_LABELS } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import type { OrderStatus, PaymentStatus } from '@/types'
import { btn, btnGhost } from './AdminLayout'
import { StatusBadge } from './Orders'

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'confirmed',
  confirmed: 'shipped',
  shipped: 'delivered',
}

export default function OrderDetail() {
  const { id = '' } = useParams()
  const { data: order, error, reload } = useAsync(() => adminGetOrder(id), [id])
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  async function update(patch: { status?: OrderStatus; payment_status?: PaymentStatus }) {
    setBusy(true)
    setActionError('')
    try {
      await adminUpdateOrder(id, patch)
      reload()
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (error) return <p className="text-sale">{error.message}</p>
  if (!order) return <p className="text-stone">Loading…</p>

  const next = NEXT[order.status]
  const phone = order.phone.replace(/^0/, '').replace(/^\+?961/, '')
  const whatsapp = `https://wa.me/961${phone}`

  return (
    <div className="space-y-4">
      <Link to="/admin" className="text-sm text-stone hover:text-ink">← Orders</Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Order #{order.order_number}</h1>
        <StatusBadge status={order.status} />
        <span className="text-sm text-stone">{new Date(order.created_at).toLocaleString('en-GB')}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {next && (
          <button className={btn} disabled={busy} onClick={() => update({ status: next })}>
            Mark as {STATUS_LABELS[next].toLowerCase()}
          </button>
        )}
        {order.status === 'delivered' && order.payment_method === 'cod' && order.payment_status !== 'paid' && (
          <button className={btn} disabled={busy} onClick={() => update({ payment_status: 'paid' })}>Cash collected</button>
        )}
        {order.payment_status === 'awaiting_confirmation' && (
          <button className={btn} disabled={busy} onClick={() => update({ payment_status: 'paid' })}>Transfer received</button>
        )}
        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <button
            className={`${btnGhost} text-sale`}
            disabled={busy}
            onClick={() => confirm('Cancel this order? Items go back into stock.') && update({ status: 'cancelled' })}
          >
            Cancel order
          </button>
        )}
      </div>
      {actionError && <p className="text-sm text-sale">{actionError}</p>}

      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-ink/10 bg-white">
          <ul className="divide-y divide-ink/5">
            {order.order_items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 p-4 text-sm">
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-bone-2">
                  <ProductImage src={i.image} name="" className="[&_span]:hidden" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{i.product_name}</p>
                  <p className="text-stone">Size {i.size}{i.color && ` · ${i.color}`}</p>
                </div>
                <span className="text-stone">{i.quantity} × {money(i.unit_price)}</span>
                <span className="w-20 text-right font-medium tabular-nums">{money(i.unit_price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1 border-t border-ink/10 p-4 text-sm">
            <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-stone">Delivery</dt><dd>{money(order.delivery_fee)}</dd></div>
            <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{money(order.total)}</dd></div>
          </dl>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border border-ink/10 bg-white p-4 text-sm">
            <h2 className="text-xs font-medium tracking-wide text-stone uppercase">Customer</h2>
            <p className="mt-2 font-medium">{order.customer_name}</p>
            <p className="mt-1">
              <a href={`tel:${order.phone}`} className="underline underline-offset-2">{order.phone}</a>
              {' · '}
              <a href={whatsapp} target="_blank" rel="noreferrer" className="underline underline-offset-2">WhatsApp</a>
            </p>
            {order.email && <p className="mt-1 text-stone">{order.email}</p>}
            <p className="mt-3">{order.city}</p>
            <p className="whitespace-pre-line text-stone">{order.address}</p>
            {order.notes && <p className="mt-3 rounded bg-amber-50 p-2">{order.notes}</p>}
          </section>
          <section className="rounded-xl border border-ink/10 bg-white p-4 text-sm">
            <h2 className="text-xs font-medium tracking-wide text-stone uppercase">Payment</h2>
            <p className="mt-2">{PAYMENT_LABELS[order.payment_method]} — {PAYMENT_STATUS_LABELS[order.payment_status]}</p>
            {order.payment_reference && <p className="mt-1">Reference: <span className="font-mono font-medium">{order.payment_reference}</span></p>}
          </section>
        </div>
      </div>
    </div>
  )
}
