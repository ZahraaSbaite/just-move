import { useLenis } from 'lenis/react'
import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Link, Outlet, Route, Routes, useLocation } from 'react-router'
import { CartProvider } from '@/cart/CartContext'
import CartDrawer from '@/components/CartDrawer'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { ScrollTrigger } from '@/lib/gsap'
import { isDemo } from '@/lib/supabase'
import Checkout from '@/pages/Checkout'
import Home from '@/pages/Home'
import OrderConfirmation from '@/pages/OrderConfirmation'
import Product from '@/pages/Product'
import Shop from '@/pages/Shop'
import Stores from '@/pages/Stores'

// Admin code is only downloaded by staff who open /admin.
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminOrders = lazy(() => import('@/pages/admin/Orders'))
const AdminOrderDetail = lazy(() => import('@/pages/admin/OrderDetail'))
const AdminProducts = lazy(() => import('@/pages/admin/Products'))
const AdminProductEdit = lazy(() => import('@/pages/admin/ProductEdit'))
const AdminSettings = lazy(() => import('@/pages/admin/Settings'))

function ScrollToTop() {
  const { pathname } = useLocation()
  const lenis = useLenis()
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true })
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [pathname, lenis])
  return null
}

function StoreLayout() {
  return (
    <>
      {isDemo && (
        <div className="fixed bottom-3 left-3 z-30 rounded-full bg-ink/90 px-3 py-1.5 text-xs text-bone">
          Demo mode — sample products
        </div>
      )}
      <div className="grain" aria-hidden />
      <Header />
      <main id="main" className="min-h-screen">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </>
  )
}

function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 pt-16 text-center">
      <p className="font-display text-7xl">Page not found</p>
      <Link to="/" className="text-sm underline underline-offset-4">Back to the shop</Link>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <ScrollToTop />
        <Suspense fallback={null}>
          <Routes>
            <Route element={<StoreLayout />}>
              <Route index element={<Home />} />
              <Route path="shop/:gender" element={<Shop />} />
              <Route path="product/:slug" element={<Product />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="order/:id" element={<OrderConfirmation />} />
              <Route path="stores" element={<Stores />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminOrders />} />
              <Route path="orders/:id" element={<AdminOrderDetail />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/:id" element={<AdminProductEdit />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Routes>
        </Suspense>
      </CartProvider>
    </BrowserRouter>
  )
}
