import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useCart } from '@/cart/CartContext'
import ProductCard from '@/components/ProductCard'
import ProductImage from '@/components/ProductImage'
import { getBoughtTogether, getCategories, getProduct, getProducts } from '@/lib/api'
import { money } from '@/lib/format'
import { recommend } from '@/lib/recommend'
import { getTaste, track } from '@/lib/taste'
import { useAsync } from '@/lib/useAsync'

export default function Product() {
  const { slug = '' } = useParams()
  // Keyed by slug so size/colour choices reset when moving between products.
  return <ProductPage key={slug} slug={slug} />
}

function ProductPage({ slug }: { slug: string }) {
  const { data: product, loading } = useAsync(() => getProduct(slug), [slug])
  const { data: catalog } = useAsync(
    () =>
      product
        ? Promise.all([getProducts({ gender: product.gender }), getCategories(), getBoughtTogether(product.id)])
        : Promise.resolve(null),
    [product?.id],
  )
  const { add, lines } = useCart()

  useEffect(() => {
    if (product) track(product.id, 'view')
  }, [product])

  const recs = useMemo(() => {
    if (!product || !catalog) return null
    const [products, categories, boughtTogether] = catalog
    // Read once rather than subscribing, so this page's own view event doesn't reshuffle the rows.
    const taste = getTaste()
    const inBag = lines.map((l) => l.productId)
    const complete = recommend(products, categories, taste, { mode: 'complete', seed: product, boughtTogether, exclude: inBag, limit: 4 })
    const similar = recommend(products, categories, taste, {
      mode: 'similar',
      seed: product,
      exclude: [...inBag, ...complete.map((p) => p.id)],
      limit: 4,
    })
    return { complete, similar }
  }, [product, catalog, lines])

  const colors = useMemo(
    () => [...new Set(product?.product_variants.map((v) => v.color) ?? [])],
    [product],
  )
  const [pickedColor, setColor] = useState('')
  const [size, setSize] = useState('')
  const [error, setError] = useState('')
  const color = colors.includes(pickedColor) ? pickedColor : (colors[0] ?? '')

  if (loading) {
    return <div className="mx-auto min-h-screen max-w-[1440px] px-4 pt-28 sm:px-8"><div className="aspect-[3/4] max-w-xl animate-pulse bg-bone-2" /></div>
  }
  if (!product) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 pt-16 text-center">
        <p className="font-display text-5xl">Product not found</p>
        <Link to="/" className="text-sm underline underline-offset-4">Back to the shop</Link>
      </div>
    )
  }

  const sizes = product.product_variants.filter((v) => v.color === color)
  const variant = sizes.find((v) => v.size === size)
  const onSale = product.compare_at_price != null && product.compare_at_price > product.price
  const images = product.images.length ? product.images : [null]

  const addToBag = () => {
    if (!variant) return setError('Please choose a size')
    add({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] ?? null,
      size: variant.size,
      color: variant.color,
      price: product.price,
      maxStock: variant.stock,
    })
  }

  return (
    <div className="pt-16">
      <div className="mx-auto grid max-w-[1440px] gap-8 md:grid-cols-[1.3fr_1fr] md:gap-12 md:px-8 md:pt-8">
        {/* Gallery: swipe on mobile, stacked on desktop */}
        <div className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] md:flex-col md:gap-4 md:overflow-visible">
          {images.map((src, i) => (
            <div key={i} className="aspect-[3/4] w-full shrink-0 snap-center bg-bone-2">
              <ProductImage src={src} name={product.name} gender={product.gender} eager={i === 0} />
            </div>
          ))}
        </div>

        <div className="px-4 md:px-0">
          <div className="md:sticky md:top-24">
            <Link to={`/shop/${product.gender}`} className="text-xs tracking-[0.2em] text-stone uppercase hover:text-ink">
              {product.gender}
            </Link>
            <h1 className="mt-2 font-display text-5xl leading-none sm:text-6xl">{product.name}</h1>
            <p className="mt-4 text-lg">
              <span className={onSale ? 'text-sale' : ''}>{money(product.price)}</span>
              {onSale && <span className="ml-2 text-stone line-through">{money(product.compare_at_price!)}</span>}
            </p>

            {colors.length > 1 || colors[0] ? (
              <div className="mt-8">
                <p className="text-sm">Colour: <span className="text-stone">{color}</span></p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setColor(c); setSize(''); setError('') }}
                      className={`border px-4 py-2 text-sm transition-colors ${c === color ? 'border-ink bg-ink text-bone' : 'border-ink/20 hover:border-ink'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-8">
              <p className="text-sm">Size</p>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {sizes.map((v) => (
                  <button
                    key={v.id}
                    disabled={v.stock === 0}
                    onClick={() => { setSize(v.size); setError('') }}
                    className={`relative h-12 border text-sm transition-colors disabled:cursor-not-allowed disabled:text-stone/60 disabled:line-through ${
                      v.size === size ? 'border-ink bg-ink text-bone' : 'border-ink/20 hover:border-ink disabled:hover:border-ink/20'
                    }`}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
              <p className="mt-2 h-5 text-sm" aria-live="polite">
                {error ? (
                  <span className="text-sale">{error}</span>
                ) : variant && variant.stock <= 3 ? (
                  <span className="text-gold">Only {variant.stock} left</span>
                ) : null}
              </p>
            </div>

            <button
              onClick={addToBag}
              disabled={!sizes.some((v) => v.stock > 0)}
              className="mt-4 w-full bg-ink py-4 text-sm font-medium tracking-wide text-bone uppercase transition-[background-color,transform] hover:bg-ink-2 active:scale-[0.99] disabled:bg-stone"
            >
              {sizes.some((v) => v.stock > 0) ? 'Add to bag' : 'Sold out'}
            </button>

            <ul className="mt-6 space-y-1 text-sm text-stone">
              <li>· Cash on delivery all over Lebanon</li>
              <li>· Pay with Whish Money or OMT</li>
            </ul>

            {product.description && (
              <div className="mt-10 border-t border-ink/10 pt-6">
                <h2 className="text-sm font-medium">Details</h2>
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink/80">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {recs && (recs.complete.length > 0 || recs.similar.length > 0) && (
        <div className="mx-auto max-w-[1440px] space-y-20 px-4 py-24 sm:px-8">
          {recs.complete.length > 0 && (
            <section>
              <h2 className="font-display text-4xl sm:text-5xl">Complete the look</h2>
              <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
                {recs.complete.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          )}
          {recs.similar.length > 0 && (
            <section>
              <h2 className="font-display text-4xl sm:text-5xl">You may also like</h2>
              <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
                {recs.similar.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
