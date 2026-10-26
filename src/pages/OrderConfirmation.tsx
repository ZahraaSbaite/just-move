import { Link, useLocation, useParams } from 'react-router'
import SplitText from '@/components/SplitText'
import { getOrder } from '@/lib/api'
import { money, PAYMENT_LABELS, STATUS_LABELS } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'

export default function OrderConfirmation() {
  const { id = '' } = useParams()
  const { state } = useLocation() as { state: { orderNumber?: number } | null }
  const { data: order, loading } = useAsync(() => getOrder(id), [id])
  const number = order?.order_number ?? state?.orderNumber

  return (
    <div className="mx-auto max-w-2xl px-4 pt-32 pb-24 text-center sm:px-8">
      <p className="text-xs tracking-[0.3em] text-stone uppercase">{number ? `Order #${number}` : 'Order received'}</p>
      <SplitText text="Thank you" tag="h1" trigger="load" effect="rise" mask className="mt-4 font-display text-7xl sm:text-8xl" />
      <p className="mx-auto mt-6 max-w-md text-ink/70">
        We've received your order and will call you shortly to confirm delivery.
        {order?.payment_status === 'awaiting_confirmation' && ' We\'ll check your transfer and confirm it.'}
      </p>

      {loading && <div className="mx-auto mt-12 h-40 max-w-md animate-pulse bg-bone-2" />}

      {order && (
        <div className="mx-auto mt-12 max-w-md border border-ink/10 p-6 text-left text-sm">
          <ul className="space-y-2">
            {order.order_items.map((i, idx) => (
              <li key={idx} className="flex justify-between gap-4">
                <span>{i.quantity} × {i.product_name} <span className="text-stone">({i.size}{i.color && ` · ${i.color}`})</span></span>
                <span className="tabular-nums">{money(i.unit_price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-ink/10 pt-4">
            <div className="flex justify-between"><dt>Delivery</dt><dd>{Number(order.delivery_fee) === 0 ? 'Free' : money(order.delivery_fee)}</dd></div>
            <div className="flex justify-between font-medium"><dt>Total</dt><dd>{money(order.total)}</dd></div>
            <div className="flex justify-between text-stone"><dt>Payment</dt><dd>{PAYMENT_LABELS[order.payment_method]}</dd></div>
            <div className="flex justify-between text-stone"><dt>Status</dt><dd>{STATUS_LABELS[order.status]}</dd></div>
          </dl>
        </div>
      )}

      <Link to="/" className="mt-12 inline-block bg-ink px-8 py-4 text-sm font-medium tracking-wide text-bone uppercase hover:bg-ink-2">
        Continue shopping
      </Link>
    </div>
  )
}
