import { useEffect, useMemo } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router'
import ProductCard from '@/components/ProductCard'
import { getCategories, getProducts } from '@/lib/api'
import { trackBrowse } from '@/lib/taste'
import { useAsync } from '@/lib/useAsync'
import type { Gender } from '@/types'

const SORTS = {
  new: 'Newest',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
} as const
type Sort = keyof typeof SORTS

export default function Shop() {
  const { gender } = useParams<{ gender: Gender }>()
  const [params, setParams] = useSearchParams()
  const category = params.get('c') ?? ''
  const sort = (params.get('sort') as Sort) in SORTS ? (params.get('sort') as Sort) : 'new'

  const valid = gender === 'men' || gender === 'women'
  const { data: products, loading, error } = useAsync(
    () => (valid ? getProducts({ gender }) : Promise.resolve([])),
    [gender],
  )
  const { data: categories } = useAsync(getCategories, [])

  useEffect(() => {
    if (valid) trackBrowse(gender)
  }, [gender, valid])

  // Only show categories that have products for this gender.
  const visibleCategories = useMemo(
    () => categories?.filter((c) => products?.some((p) => p.category_id === c.id)) ?? [],
    [categories, products],
  )

  const list = useMemo(() => {
    let l = products ?? []
    if (category) {
      const cat = categories?.find((c) => c.slug === category)
      l = l.filter((p) => p.category_id === cat?.id)
    }
    if (sort === 'price-asc') l = [...l].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') l = [...l].sort((a, b) => b.price - a.price)
    return l
  }, [products, categories, category, sort])

  if (!valid) return <Navigate to="/shop/men" replace />

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true, preventScrollReset: true })
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-28 pb-24 sm:px-8">
      <div className="flex items-end justify-between gap-6">
        <h1 className="font-display text-7xl leading-none capitalize sm:text-9xl">{gender}</h1>
        {!loading && <p className="pb-2 text-sm text-stone tabular-nums">{list.length} pieces</p>}
      </div>

      <div className="sticky top-0 z-10 -mx-4 mt-8 flex items-center gap-4 border-y border-ink/10 bg-bone/90 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="-my-1 flex flex-1 gap-2 overflow-x-auto py-1 [scrollbar-width:none]">
          {[{ slug: '', name: 'All' }, ...visibleCategories].map((c) => (
            <button
              key={c.slug}
              onClick={() => set('c', c.slug)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
                category === c.slug ? 'border-ink bg-ink text-bone' : 'border-ink/20 hover:border-ink'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => set('sort', e.target.value === 'new' ? '' : e.target.value)}
          className="shrink-0 bg-transparent text-sm outline-none"
          aria-label="Sort products"
        >
          {Object.entries(SORTS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {error && <p className="mt-10 text-sale">Couldn't load products. Please refresh the page.</p>}

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse bg-bone-2" />)
          : list.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>

      {!loading && !error && list.length === 0 && (
        <p className="mt-16 text-center text-stone">Nothing here yet — check back soon.</p>
      )}
    </div>
  )
}
