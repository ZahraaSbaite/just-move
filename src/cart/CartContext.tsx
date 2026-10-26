import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { track } from '@/lib/taste'

export interface CartLine {
  variantId: string
  productId: string
  slug: string
  name: string
  image: string | null
  size: string
  color: string
  price: number
  quantity: number
  maxStock: number
}

interface CartValue {
  lines: CartLine[]
  count: number
  subtotal: number
  isOpen: boolean
  open: () => void
  close: () => void
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void
  setQuantity: (variantId: string, quantity: number) => void
  remove: (variantId: string) => void
  clear: () => void
}

const CartContext = createContext<CartValue | null>(null)
const STORAGE_KEY = 'justmove.cart.v1'

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartLine[]) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(load)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      // storage unavailable (private mode) — cart still works for this visit
    }
  }, [lines])

  const add = useCallback<CartValue['add']>((line, quantity = 1) => {
    track(line.productId, 'add')
    setLines((prev) => {
      const existing = prev.find((l) => l.variantId === line.variantId)
      if (existing) {
        return prev.map((l) =>
          l.variantId === line.variantId
            ? { ...l, ...line, quantity: Math.min(l.quantity + quantity, line.maxStock, 10) }
            : l,
        )
      }
      return [...prev, { ...line, quantity: Math.min(quantity, line.maxStock, 10) }]
    })
    setIsOpen(true)
  }, [])

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(quantity, l.maxStock, 10) } : l))
        .filter((l) => l.quantity > 0),
    )
  }, [])

  const remove = useCallback((variantId: string) => {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId))
  }, [])

  const value = useMemo<CartValue>(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      subtotal: lines.reduce((s, l) => s + l.price * l.quantity, 0),
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      add,
      setQuantity,
      remove,
      clear: () => setLines([]),
    }),
    [lines, isOpen, add, setQuantity, remove],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
