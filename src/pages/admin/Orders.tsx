import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { adminListOrders, adminOrderStats, ORDERS_PAGE_SIZE } from '@/lib/api'
import { money, PAYMENT_LABELS, PAYMENT_STATUS_LABELS, STATUS_LABELS } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import { useAsync } from '@/lib/useAsync'
import type { OrderStatus } from '@/types'
import { btnGhost, input } from './AdminLayout'

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-blue-100 text-blue-900',
  shipped: 'bg-violet-100 text-violet-900',
  delivered: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-neutral-200 text-neutral-600',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>{STATUS_LABELS[status]}</span>
}

export default function Orders() {
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') ?? 'pending') as OrderStatus | 'all'
  const page = Number(params.get('page') ?? 0)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, loading, error, reload } = useAsync(() => adminListOrders({ status, search: query, page }), [status, query, page])
  const { data: stats, reload: reloadStats } = useAsync(adminOrderStats, [])

  // New orders show up without refreshing the page.
  useEffect(() => {
    if (!supabase) return
    const channel = supabase
      .channel('orders-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        reload()
        reloadStats()
      })
      .subscribe()
    return () => {
      supabase!.removeChannel(channel)
    }
  }, [reload, reloadStats])

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params)
    next.set(k, v)
    if (k !== 'page') next.delete('page')
    setParams(next)
  }

  const pages = data ? Math.ceil(data.count / ORDERS_PAGE_SIZE) : 0

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Orders today', stats?.today ?? '–'],
          ['Revenue today', stats ? money(stats.revenue) : '–'],
          ['New (today)', stats?.pending ?? '–'],
          ['Transfers to check', stats?.checkTransfer ?? '–'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-ink/10 bg-white p-4">
            <p className="text-xs text-stone">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex gap-1 overflow-x-auto">
          {(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setParam('status', s)}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${status === s ? 'bg-ink text-bone' : 'bg-white hover:bg-bone-2'}`}
            >
              {s === 'all' ? 'All' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <input className={`${input} md:ml-auto md:max-w-xs`} placeholder="Search #order, phone or name" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && <p className="mt-6 text-sale">{error.message}</p>}

      <div className="mt-4 overflow-hidden rounded-xl border border-ink/10 bg-white">
        <table className="w-full text-sm">
          <thead className="hidden border-b border-ink/10 text-left text-xs text-stone md:table-header-group">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {data?.orders.map((o) => (
              <tr key={o.id} className="relative block hover:bg-bone/60 md:table-row">
                <td className="block px-4 pt-3 md:table-cell md:py-3">
                  <Link to={`/admin/orders/${o.id}`} className="font-medium after:absolute after:inset-0">#{o.order_number}</Link>
                  <p className="text-xs text-stone">{new Date(o.created_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</p>
                </td>
                <td className="block px-4 md:table-cell md:py-3">
                  <p>{o.customer_name}</p>
                  <p className="text-xs text-stone">{o.phone} · {o.city}</p>
                </td>
                <td className="block px-4 text-stone md:table-cell md:py-3">{o.order_items.reduce((s, i) => s + i.quantity, 0)} pcs</td>
                <td className="block px-4 md:table-cell md:py-3">
                  <p>{PAYMENT_LABELS[o.payment_method]}</p>
                  {o.payment_status !== 'unpaid' && (
                    <p className={`text-xs ${o.payment_status === 'awaiting_confirmation' ? 'font-medium text-amber-700' : 'text-stone'}`}>
                      {PAYMENT_STATUS_LABELS[o.payment_status]}
                    </p>
                  )}
                </td>
                <td className="inline-block px-4 pb-3 md:table-cell md:py-3"><StatusBadge status={o.status} /></td>
                <td className="absolute top-3 right-4 font-medium tabular-nums md:static md:table-cell md:px-4 md:py-3 md:text-right">{money(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && !data && <p className="p-8 text-center text-stone">Loading…</p>}
        {data && data.orders.length === 0 && <p className="p-8 text-center text-stone">No orders here.</p>}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <button className={btnGhost} disabled={page === 0} onClick={() => setParam('page', String(page - 1))}>Previous</button>
          <span className="text-stone">Page {page + 1} of {pages}</span>
          <button className={btnGhost} disabled={page + 1 >= pages} onClick={() => setParam('page', String(page + 1))}>Next</button>
        </div>
      )}
    </div>
  )
}
