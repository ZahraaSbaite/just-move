import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  adminDeleteProduct,
  adminGetProduct,
  adminSaveProduct,
  adminUploadImage,
  getCategories,
  type ProductDraft,
  type VariantDraft,
} from '@/lib/api'
import { slugify } from '@/lib/format'
import { STYLES, type Style } from '@/lib/taste'
import { useAsync } from '@/lib/useAsync'
import { btn, btnGhost, input } from './AdminLayout'

const EMPTY: ProductDraft = {
  name: '',
  slug: '',
  description: '',
  gender: 'men',
  category_id: null,
  price: 0,
  compare_at_price: null,
  images: [],
  is_active: true,
  is_featured: false,
  styles: [],
  product_variants: [],
}

const SIZE_PRESETS = {
  'Suit (46–54)': ['46', '48', '50', '52', '54'],
  'S–XXL': ['S', 'M', 'L', 'XL', 'XXL'],
  'XS–L': ['XS', 'S', 'M', 'L'],
  'Waist (30–38)': ['30', '32', '34', '36', '38'],
  'Shoes (40–45)': ['40', '41', '42', '43', '44', '45'],
  'One size': ['One size'],
}

export default function ProductEdit() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { data: categories } = useAsync(getCategories, [])
  const [draft, setDraft] = useState<ProductDraft>(EMPTY)
  const [loaded, setLoaded] = useState(isNew)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(0)
  const [error, setError] = useState('')

  // Quick builder for size × colour grid.
  const [preset, setPreset] = useState<keyof typeof SIZE_PRESETS>('S–XXL')
  const [newColors, setNewColors] = useState('')

  useEffect(() => {
    if (isNew || !id) return
    adminGetProduct(id)
      .then(({ id: _id, created_at: _c, ...p }) => {
        setDraft(p)
        setLoaded(true)
      })
      .catch((e: Error) => setError(e.message))
  }, [id, isNew])

  const set = <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const setVariant = (i: number, patch: Partial<VariantDraft>) =>
    set('product_variants', draft.product_variants.map((v, j) => (j === i ? { ...v, ...patch } : v)))

  function addGrid() {
    const colors = newColors.split(',').map((c) => c.trim()).filter(Boolean)
    const rows = (colors.length ? colors : ['']).flatMap((color) =>
      SIZE_PRESETS[preset].map((size) => ({ size, color, stock: 0 })),
    )
    const existing = new Set(draft.product_variants.map((v) => `${v.size}|${v.color}`))
    set('product_variants', [...draft.product_variants, ...rows.filter((r) => !existing.has(`${r.size}|${r.color}`))])
    setNewColors('')
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return
    setUploading(files.length)
    setError('')
    try {
      const urls = await Promise.all([...files].map(adminUploadImage))
      setDraft((d) => ({ ...d, images: [...d.images, ...urls] }))
    } catch (e) {
      setError(`Upload failed: ${(e as Error).message}`)
    } finally {
      setUploading(0)
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!draft.product_variants.length) return setError('Add at least one size')
    const keys = draft.product_variants.map((v) => `${v.size.trim()}|${v.color.trim()}`)
    if (new Set(keys).size !== keys.length) return setError('The same size + colour appears twice')
    setBusy(true)
    setError('')
    try {
      const savedId = await adminSaveProduct(isNew ? null : id!, {
        ...draft,
        slug: draft.slug || slugify(draft.name),
        product_variants: draft.product_variants.map((v) => ({ ...v, size: v.size.trim(), color: v.color.trim() })),
      })
      if (isNew) navigate(`/admin/products/${savedId}`, { replace: true })
      else navigate('/admin/products')
    } catch (err) {
      const msg = (err as Error).message
      setError(msg.includes('products_slug_key') ? 'Another product already uses this URL name — change it.' : msg)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!confirm('Delete this product? Past orders keep their details. To hide it instead, untick "Visible in store".')) return
    try {
      await adminDeleteProduct(id!)
      navigate('/admin/products')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (!loaded) return <p className="text-stone">{error || 'Loading…'}</p>

  const label = 'mb-1 block text-xs font-medium text-stone'
  const totalStock = draft.product_variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)

  return (
    <form onSubmit={save} className="space-y-4 pb-24">
      <Link to="/admin/products" className="text-sm text-stone hover:text-ink">← Products</Link>
      <h1 className="text-2xl font-semibold">{isNew ? 'New product' : draft.name}</h1>

      <section className="grid gap-4 rounded-xl border border-ink/10 bg-white p-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={label}>Name</label>
          <input className={input} required value={draft.name} onChange={(e) => {
            const name = e.target.value
            setDraft((d) => ({ ...d, name, slug: isNew ? slugify(name) : d.slug }))
          }} />
        </div>
        <div>
          <label className={label}>Section</label>
          <select className={input} value={draft.gender} onChange={(e) => set('gender', e.target.value as 'men' | 'women')}>
            <option value="men">Men</option>
            <option value="women">Women</option>
          </select>
        </div>
        <div>
          <label className={label}>Category</label>
          <select className={input} value={draft.category_id ?? ''} onChange={(e) => set('category_id', e.target.value || null)}>
            <option value="">—</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Price ($)</label>
          <input className={input} type="number" min={0} step="0.01" required value={draft.price || ''} onChange={(e) => set('price', Number(e.target.value))} />
        </div>
        <div>
          <label className={label}>Was price ($) — fill to show a sale</label>
          <input className={input} type="number" min={0} step="0.01" value={draft.compare_at_price ?? ''} onChange={(e) => set('compare_at_price', e.target.value ? Number(e.target.value) : null)} />
        </div>
        <div className="md:col-span-2">
          <label className={label}>Description</label>
          <textarea className={input} rows={4} value={draft.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <span className={label}>Style — used to recommend this piece to the right customers</span>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(STYLES) as [Style, string][]).map(([v, l]) => {
              const on = draft.styles.includes(v)
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set('styles', on ? draft.styles.filter((s) => s !== v) : [...draft.styles, v])}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${on ? 'border-ink bg-ink text-bone' : 'border-ink/20 hover:border-ink'}`}
                >
                  {l}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <label className={label}>URL name</label>
          <input className={input} required pattern="[a-z0-9\-]+" value={draft.slug} onChange={(e) => set('slug', slugify(e.target.value))} />
        </div>
        <div className="flex items-end gap-6 pb-2.5 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" className="accent-ink" checked={draft.is_active} onChange={(e) => set('is_active', e.target.checked)} /> Visible in store</label>
          <label className="flex items-center gap-2"><input type="checkbox" className="accent-ink" checked={draft.is_featured} onChange={(e) => set('is_featured', e.target.checked)} /> Show in “New in”</label>
        </div>
      </section>

      <section className="rounded-xl border border-ink/10 bg-white p-4">
        <h2 className="font-medium">Photos</h2>
        <p className="text-sm text-stone">First photo is the main one. Portrait (3:4) photos look best.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {draft.images.map((src, i) => (
            <div key={src} className="group relative h-32 w-24 overflow-hidden rounded bg-bone-2">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/70 p-1 text-xs text-bone opacity-0 group-hover:opacity-100 max-md:opacity-100">
                <button type="button" disabled={i === 0} onClick={() => set('images', [src, ...draft.images.filter((s) => s !== src)])} className="disabled:opacity-30">Main</button>
                <button type="button" onClick={() => set('images', draft.images.filter((s) => s !== src))}>Remove</button>
              </div>
            </div>
          ))}
          <label className="grid h-32 w-24 cursor-pointer place-items-center rounded border border-dashed border-ink/30 text-center text-xs text-stone hover:border-ink">
            {uploading ? `Uploading ${uploading}…` : '+ Add photos'}
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { upload(e.target.files); e.target.value = '' }} />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-ink/10 bg-white p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-medium">Sizes & stock</h2>
          <span className="text-sm text-stone">{totalStock} pieces total</span>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-bone/60 p-3">
          <div>
            <label className={label}>Sizes</label>
            <select className={input} value={preset} onChange={(e) => setPreset(e.target.value as keyof typeof SIZE_PRESETS)}>
              {Object.keys(SIZE_PRESETS).map((k) => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div className="min-w-48 flex-1">
            <label className={label}>Colours (comma separated, optional)</label>
            <input className={input} placeholder="Navy, Black" value={newColors} onChange={(e) => setNewColors(e.target.value)} />
          </div>
          <button type="button" className={btnGhost} onClick={addGrid}>Add sizes</button>
        </div>

        {draft.product_variants.length > 0 && (
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs text-stone">
              <tr><th className="py-2 font-medium">Size</th><th className="py-2 font-medium">Colour</th><th className="py-2 font-medium">Stock</th><th /></tr>
            </thead>
            <tbody>
              {draft.product_variants.map((v, i) => (
                <tr key={v.id ?? `new-${i}`}>
                  <td className="py-1 pr-2"><input className={input} required value={v.size} onChange={(e) => setVariant(i, { size: e.target.value })} /></td>
                  <td className="py-1 pr-2"><input className={input} value={v.color} onChange={(e) => setVariant(i, { color: e.target.value })} /></td>
                  <td className="w-28 py-1 pr-2"><input className={input} type="number" min={0} required value={v.stock} onChange={(e) => setVariant(i, { stock: Math.max(0, Number(e.target.value)) })} /></td>
                  <td className="w-10 text-right">
                    <button type="button" aria-label="Remove size" className="p-2 text-stone hover:text-sale" onClick={() => set('product_variants', draft.product_variants.filter((_, j) => j !== i))}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-ink/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          {error && <p className="flex-1 text-sm text-sale">{error}</p>}
          {!isNew && <button type="button" className={`${btnGhost} text-sale`} onClick={remove}>Delete</button>}
          <button className={`${btn} ml-auto`} disabled={busy || uploading > 0}>{busy ? 'Saving…' : 'Save product'}</button>
        </div>
      </div>
    </form>
  )
}
