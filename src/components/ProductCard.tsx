import { Link } from 'react-router'
import ProductImage from '@/components/ProductImage'
import { money } from '@/lib/format'
import type { Product } from '@/types'

export default function ProductCard({ product }: { product: Product }) {
  const inStock = product.product_variants.some((v) => v.stock > 0)
  const onSale = product.compare_at_price != null && product.compare_at_price > product.price
  const colors = [...new Set(product.product_variants.map((v) => v.color).filter(Boolean))]

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-bone-2">
        <ProductImage
          src={product.images[0]}
          name={product.name}
          gender={product.gender}
          className="transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.04]"
        />
        {product.images[1] && (
          <img
            src={product.images[1]}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {onSale && (
            <span className="bg-bone px-2 py-1 text-xs font-medium text-sale">
              −{Math.round((1 - product.price / product.compare_at_price!) * 100)}%
            </span>
          )}
          {!inStock && <span className="bg-ink px-2 py-1 text-xs font-medium text-bone">Sold out</span>}
        </div>
        <span className="absolute inset-x-3 bottom-3 translate-y-2 bg-bone/90 py-2.5 text-center text-xs font-medium opacity-0 backdrop-blur transition-[opacity,transform] duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-md:hidden">
          {inStock ? 'View sizes' : 'Sold out'}
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-medium sm:truncate">{product.name}</h3>
          {colors.length > 1 && <p className="mt-0.5 text-xs text-stone">{colors.length} colours</p>}
        </div>
        <div className="shrink-0 text-[15px] tabular-nums sm:order-last sm:text-right">
          <span className={onSale ? 'text-sale' : ''}>{money(product.price)}</span>
          {onSale && <span className="ml-1.5 text-stone line-through">{money(product.compare_at_price!)}</span>}
        </div>
      </div>
    </Link>
  )
}
