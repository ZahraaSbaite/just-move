import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import ProductImage from '@/components/ProductImage'
import { adminListProducts } from '@/lib/api'
import { money } from '@/lib/format'
import { useAsync } from '@/lib/useAsync'
import { btn, input } from './AdminLayout'

export default function Products() {
  const { data, error } = useAsync(adminListProducts, [])
  const [q, setQ] = useState('')

  const list = useMemo(
    () => data?.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())) ?? [],
    [data, q],
  )

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link to="/admin/products/new" className={`${btn} ml-auto`}>Add product</Link>
      </div>
      <input className={`${input} mt-4 max-w-xs`} placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
      {error && <p className="mt-4 text-sale">{error.message}</p>}

      <div className="mt-4 divide-y divide-ink/5 overflow-hidden rounded-xl border border-ink/10 bg-white">
        {list.map((p) => {
          const stock = p.product_variants.reduce((s, v) => s + v.stock, 0)
          const out = p.product_variants.filter((v) => v.stock === 0).length
          return (
            <Link key={p.id} to={`/admin/products/${p.id}`} className="flex items-center gap-4 p-3 text-sm hover:bg-bone/60">
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-bone-2">
                <ProductImage src={p.images[0]} name="" gender={p.gender} className="[&_span]:hidden" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {p.name}
                  {!p.is_active && <span className="ml-2 rounded bg-neutral-200 px-1.5 py-0.5 text-xs text-neutral-600">Hidden</span>}
                  {p.is_featured && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">Featured</span>}
                </p>
                <p className="text-stone capitalize">{p.gender} · {money(p.price)}</p>
              </div>
              <div className="text-right">
                <p className={stock === 0 ? 'font-medium text-sale' : ''}>{stock} in stock</p>
                {out > 0 && stock > 0 && <p className="text-xs text-amber-700">{out} size{out > 1 ? 's' : ''} sold out</p>}
              </div>
            </Link>
          )
        })}
        {data && list.length === 0 && <p className="p-8 text-center text-stone">No products yet.</p>}
        {!data && !error && <p className="p-8 text-center text-stone">Loading…</p>}
      </div>
    </div>
  )
}
