import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/types'

export const money = (n: number) =>
  `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cod: 'Cash on delivery',
  whish: 'Whish Money',
  omt: 'OMT',
  card: 'Card',
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'New',
  confirmed: 'Confirmed',
  shipped: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  awaiting_confirmation: 'Check transfer',
  paid: 'Paid',
  refunded: 'Refunded',
}

export const CITIES = [
  'Beirut',
  'Dahieh',
  'Jdeideh',
  'Metn',
  'Baabda',
  'Aley',
  'Chouf',
  'Keserwan / Jounieh',
  'Jbeil',
  'Batroun',
  'Tripoli',
  'Koura',
  'Zgharta',
  'Akkar',
  'Saida',
  'Tyre',
  'Nabatieh',
  'Zahle',
  'Bekaa',
  'Baalbek',
]

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
