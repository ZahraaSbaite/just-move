export type Gender = 'men' | 'women'
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentMethod = 'cod' | 'whish' | 'omt' | 'card'
export type PaymentStatus = 'unpaid' | 'awaiting_confirmation' | 'paid' | 'refunded'

export interface Category {
  id: string
  name: string
  slug: string
  sort: number
}

export interface Variant {
  id: string
  product_id: string
  size: string
  color: string
  stock: number
  sort: number
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  gender: Gender
  category_id: string | null
  price: number
  compare_at_price: number | null
  images: string[]
  is_active: boolean
  is_featured: boolean
  styles: string[]
  created_at: string
  product_variants: Variant[]
}

export interface StoreSettings {
  delivery_fee: number
  free_delivery_over: number | null
  whish_number: string
  omt_name: string
  card_enabled: boolean
}

export interface OrderItem {
  id?: string
  product_name: string
  size: string
  color: string
  image: string | null
  unit_price: number
  quantity: number
}

export interface Order {
  id: string
  order_number: number
  customer_name: string
  phone: string
  email: string | null
  city: string
  address: string
  notes: string | null
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  payment_reference: string | null
  status: OrderStatus
  subtotal: number
  delivery_fee: number
  total: number
  created_at: string
  order_items: OrderItem[]
}

export interface CheckoutCustomer {
  name: string
  phone: string
  email: string
  city: string
  address: string
  notes: string
}
