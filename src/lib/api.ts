import { demoCategories, demoProducts, demoSettings } from '@/lib/demo-data'
import { supabase } from '@/lib/supabase'
import type {
  Category,
  CheckoutCustomer,
  Gender,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  StoreSettings,
} from '@/types'

const PRODUCT_SELECT = '*, product_variants(*)'

const sortVariants = (p: Product): Product => ({
  ...p,
  styles: p.styles ?? [], // older databases without 0002_recommendations.sql
  product_variants: [...p.product_variants].sort((a, b) => a.sort - b.sort),
})

// ─── Storefront ─────────────────────────────────────────────────────────────

export async function getSettings(): Promise<StoreSettings> {
  if (!supabase) return demoSettings
  const { data, error } = await supabase.from('store_settings').select('*').single()
  if (error) throw error
  return data
}

export async function getCategories(): Promise<Category[]> {
  if (!supabase) return demoCategories
  const { data, error } = await supabase.from('categories').select('*').order('sort')
  if (error) throw error
  return data
}

export async function getProducts(opts: { gender?: Gender; featured?: boolean; limit?: number } = {}) {
  if (!supabase) {
    let list = demoProducts
    if (opts.gender) list = list.filter((p) => p.gender === opts.gender)
    if (opts.featured) list = list.filter((p) => p.is_featured)
    return list.slice(0, opts.limit ?? list.length)
  }
  let q = supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (opts.gender) q = q.eq('gender', opts.gender)
  if (opts.featured) q = q.eq('is_featured', true)
  if (opts.limit) q = q.limit(opts.limit)
  const { data, error } = await q
  if (error) throw error
  return (data as Product[]).map(sortVariants)
}

export async function getProduct(slug: string): Promise<Product | null> {
  if (!supabase) return demoProducts.find((p) => p.slug === slug) ?? null
  const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).eq('slug', slug).maybeSingle()
  if (error) throw error
  return data ? sortVariants(data as Product) : null
}

// Product ids most often ordered together with this one. Empty in demo mode or before
// 0002_recommendations.sql is applied — recommendations still work without it.
export async function getBoughtTogether(productId: string): Promise<string[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('bought_together', { p_product_id: productId })
  if (error) return []
  return (data as { product_id: string }[]).map((r) => r.product_id)
}

export async function placeOrder(input: {
  customer: CheckoutCustomer
  items: { variant_id: string; quantity: number }[]
  payment_method: PaymentMethod
  payment_reference?: string
}): Promise<{ id: string; order_number: number }> {
  if (!supabase) {
    await new Promise((r) => setTimeout(r, 600))
    return { id: 'demo', order_number: 1001 }
  }
  const { data, error } = await supabase.rpc('place_order', {
    p_customer: input.customer,
    p_items: input.items,
    p_payment_method: input.payment_method,
    p_payment_reference: input.payment_reference ?? null,
  })
  if (error) throw new Error(error.message)
  return data[0]
}

export async function getOrder(id: string): Promise<Order | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('get_order', { p_id: id })
  if (error) throw error
  return data ? ({ ...data, order_items: data.items } as Order) : null
}

// ─── Admin ──────────────────────────────────────────────────────────────────

function db() {
  if (!supabase) throw new Error('Connect Supabase to use the admin panel')
  return supabase
}

export const ORDERS_PAGE_SIZE = 30

export async function adminListOrders(opts: { status: OrderStatus | 'all'; search: string; page: number }) {
  let q = db()
    .from('orders')
    .select('*, order_items(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(opts.page * ORDERS_PAGE_SIZE, opts.page * ORDERS_PAGE_SIZE + ORDERS_PAGE_SIZE - 1)
  if (opts.status !== 'all') q = q.eq('status', opts.status)
  const s = opts.search.trim().replace(/[,()%]/g, '')
  if (s) {
    const n = Number(s.replace('#', ''))
    q = Number.isInteger(n) && n > 0 && s.length <= 6
      ? q.eq('order_number', n)
      : q.or(`phone.ilike.%${s}%,customer_name.ilike.%${s}%`)
  }
  const { data, error, count } = await q
  if (error) throw error
  return { orders: data as Order[], count: count ?? 0 }
}

export async function adminGetOrder(id: string) {
  const { data, error } = await db().from('orders').select('*, order_items(*)').eq('id', id).single()
  if (error) throw error
  return data as Order
}

export async function adminUpdateOrder(id: string, patch: { status?: OrderStatus; payment_status?: PaymentStatus }) {
  const { error } = await db().from('orders').update(patch).eq('id', id)
  if (error) throw error
}

export async function adminOrderStats() {
  const since = new Date()
  since.setHours(0, 0, 0, 0)
  const { data, error } = await db()
    .from('orders')
    .select('total, status, payment_status')
    .gte('created_at', since.toISOString())
  if (error) throw error
  const live = data.filter((o) => o.status !== 'cancelled')
  return {
    today: live.length,
    revenue: live.reduce((s, o) => s + Number(o.total), 0),
    pending: data.filter((o) => o.status === 'pending').length,
    checkTransfer: data.filter((o) => o.payment_status === 'awaiting_confirmation').length,
  }
}

export async function adminListProducts() {
  const { data, error } = await db().from('products').select(PRODUCT_SELECT).order('created_at', { ascending: false })
  if (error) throw error
  return (data as Product[]).map(sortVariants)
}

export async function adminGetProduct(id: string) {
  const { data, error } = await db().from('products').select(PRODUCT_SELECT).eq('id', id).single()
  if (error) throw error
  return sortVariants(data as Product)
}

export type VariantDraft = { id?: string; size: string; color: string; stock: number }
export type ProductDraft = Omit<Product, 'id' | 'created_at' | 'product_variants'> & {
  product_variants: VariantDraft[]
}

export async function adminSaveProduct(id: string | null, draft: ProductDraft) {
  const { product_variants, ...fields } = draft
  const client = db()

  const { data, error } = id
    ? await client.from('products').update(fields).eq('id', id).select('id').single()
    : await client.from('products').insert(fields).select('id').single()
  if (error) throw error
  const productId = data.id as string

  // Remove variants that were deleted in the form, then update/insert the rest.
  const keep = product_variants.filter((v) => v.id).map((v) => v.id!)
  const del = client.from('product_variants').delete().eq('product_id', productId)
  const { error: delError } = keep.length ? await del.not('id', 'in', `(${keep.join(',')})`) : await del
  if (delError) throw delError

  const rows = product_variants.map((v, i) => ({ ...v, product_id: productId, sort: i }))
  const existing = rows.filter((r) => r.id)
  const fresh = rows.filter((r) => !r.id).map(({ id: _id, ...r }) => r)
  if (existing.length) {
    const { error: e } = await client.from('product_variants').upsert(existing)
    if (e) throw e
  }
  if (fresh.length) {
    const { error: e } = await client.from('product_variants').insert(fresh)
    if (e) throw e
  }
  return productId
}

export async function adminDeleteProduct(id: string) {
  const { error } = await db().from('products').delete().eq('id', id)
  if (error) throw error
}

export async function adminUploadImage(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`
  const client = db()
  const { error } = await client.storage.from('product-images').upload(path, file, { cacheControl: '31536000' })
  if (error) throw error
  return client.storage.from('product-images').getPublicUrl(path).data.publicUrl
}

export async function adminSaveSettings(s: StoreSettings) {
  const { error } = await db()
    .from('store_settings')
    .update({ ...s, updated_at: new Date().toISOString() })
    .eq('id', true)
  if (error) throw error
}
