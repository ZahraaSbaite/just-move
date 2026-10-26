import { useMemo, useRef } from 'react'
import { Link } from 'react-router'
import ForYou from '@/components/ForYou'
import Knight from '@/components/Knight'
import ProductCard from '@/components/ProductCard'
import { getCategories, getProducts } from '@/lib/api'
import { BRANCHES, CATEGORY_PHOTOS, INSTAGRAM_MEN, INSTAGRAM_POSTS, PHOTOS } from '@/lib/brand'
import { gsap, useGSAP } from '@/lib/gsap'
import { useAsync } from '@/lib/useAsync'

const CATEGORIES = [
  { slug: 'suits', name: 'Suits', to: '/shop/men?c=suits' },
  { slug: 'blazers', name: 'Blazers', to: '/shop/men?c=blazers' },
  { slug: 'outerwear', name: 'Outerwear', to: '/shop/men?c=outerwear' },
  { slug: 'shirts', name: 'Shirts', to: '/shop/men?c=shirts' },
  { slug: 'knitwear', name: 'Knitwear', to: '/shop/men?c=knitwear' },
  { slug: 'dresses', name: 'Dresses', to: '/shop/women?c=dresses' },
  { slug: 'shoes', name: 'Shoes', to: '/shop/men?c=shoes' },
]

function ArrowUpRight({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2.25">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  )
}

function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  )
}

// Circular "DROP 01" sticker with text running around the edge.
function DropSticker({ className = '' }: { className?: string }) {
  return (
    <div className={`grid place-items-center rounded-full bg-signal text-ink ${className}`}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-[spin-slow_14s_linear_infinite]" aria-hidden>
        <defs>
          <path id="ring" d="M50 50m-37 0a37 37 0 1 1 74 0a37 37 0 1 1-74 0" />
        </defs>
        <text className="fill-current font-heavy text-[11.5px] tracking-[0.12em] uppercase">
          <textPath href="#ring">Drop 01 · Autumn / Winter · Drop 01 ·</textPath>
        </text>
      </svg>
      <Knight solid className="h-9 sm:h-11" />
    </div>
  )
}

export default function Home() {
  const root = useRef<HTMLDivElement>(null)
  const { data: products } = useAsync(() => getProducts(), [])
  const { data: categories } = useAsync(getCategories, [])

  const drop = useMemo(() => products?.filter((p) => p.is_featured).slice(0, 8) ?? [], [products])
  const dropIds = useMemo(() => drop.map((p) => p.id), [drop])
  const counts = useMemo(() => {
    const bySlug: Record<string, number> = {}
    for (const c of categories ?? []) bySlug[c.slug] = products?.filter((p) => p.category_id === c.id).length ?? 0
    return bySlug
  }, [categories, products])

  // Hero intro + "words drift apart" on scroll. Runs once.
  useGSAP(
    () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
        tl.from('[data-word]', { yPercent: 105, duration: 1.3, stagger: 0.12 })
          .from('[data-hero-photo]', { clipPath: 'inset(50% 50% 50% 50%)', duration: 1.4, ease: 'expo.inOut' }, 0.15)
          .from('[data-hero-photo] img', { scale: 1.4, duration: 1.8 }, 0.15)
          .from('[data-sticker]', { scale: 0, rotate: -90, duration: 1, ease: 'back.out(1.7)' }, 0.9)
          .from('[data-cta]', { yPercent: 100, duration: 1, stagger: 0.08 }, 0.7)

        const scrub = { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true }
        gsap.to('[data-word-left]', { xPercent: -35, ease: 'none', scrollTrigger: scrub })
        gsap.to('[data-word-right]', { xPercent: 35, ease: 'none', scrollTrigger: scrub })
        gsap.to('[data-hero-photo]', { yPercent: 25, scale: 0.9, ease: 'none', scrollTrigger: scrub })
      })
    },
    { scope: root },
  )

  // Scroll sections. Rebuilt cleanly once products render.
  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('[data-rise]').forEach((el) => {
          gsap.from(el, { yPercent: 100, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } })
        })
        gsap.utils.toArray<HTMLElement>('[data-zoom]').forEach((el) => {
          gsap.fromTo(el, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } })
        })
      })
    },
    { scope: root, dependencies: [drop.length], revertOnUpdate: true },
  )

  return (
    <div ref={root} className="overflow-x-clip">
      {/* ── Hero ── */}
      <section data-hero className="relative flex h-svh min-h-[640px] flex-col overflow-hidden bg-ink text-bone">
        <div className="relative flex flex-1 flex-col justify-between px-4 pt-20 pb-4 sm:px-8">
          <div className="flex items-start justify-between">
            <h1 className="sr-only">Just Move — menswear and womenswear, Beirut</h1>
            <div aria-hidden data-word-left className="relative z-10 overflow-hidden">
              <span data-word className="block font-heavy text-[clamp(7rem,30vw,26rem)] leading-[0.82] tracking-[-0.01em] uppercase">
                Just
              </span>
            </div>
            <p className="mt-3 hidden max-w-[16rem] text-right text-sm leading-snug text-bone/60 md:block">
              Suits, coats and street-ready tailoring. Beirut, Lebanon. Delivery anywhere in LB, cash on arrival.
            </p>
          </div>

          <div aria-hidden data-word-right className="relative z-20 self-end overflow-hidden">
            <span data-word className="block font-heavy text-[clamp(7rem,30vw,26rem)] leading-[0.82] tracking-[-0.01em] uppercase">
              Move<span className="text-signal">.</span>
            </span>
          </div>

          <div className="absolute top-1/2 left-1/2 z-0 w-[min(64vw,20rem)] -translate-x-1/2 -translate-y-1/2 md:w-[min(28vw,24rem)]">
            <div data-hero-photo className="aspect-[863/900] overflow-hidden">
              <img
                src="/logo-mark-foil.png"
                alt="Just Move logo: a gold knight beside a fallen king"
                fetchPriority="high"
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <Link
            to="/shop/men"
            data-sticker
            aria-label="Shop the new drop"
            className="absolute top-[22%] right-[8%] z-30 sm:right-[24%]"
          >
            <DropSticker className="relative h-24 w-24 transition-transform duration-300 hover:scale-110 sm:h-32 sm:w-32" />
          </Link>
        </div>

        <div className="grid grid-cols-2 border-t border-bone/15">
          {[
            ['/shop/men', 'Shop men'],
            ['/shop/women', 'Shop women'],
          ].map(([to, label], i) => (
            <div key={to} className={`overflow-hidden ${i ? 'border-l border-bone/15' : ''}`}>
              <Link
                data-cta
                to={to}
                className="group relative flex items-center justify-between overflow-hidden px-4 py-5 font-heavy text-2xl uppercase sm:px-8 sm:py-7 sm:text-4xl"
              >
                <span className="absolute inset-0 origin-bottom scale-y-0 bg-signal transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)] group-hover:scale-y-100" />
                <span className="relative transition-colors duration-300 group-hover:text-ink">{label}</span>
                <ArrowUpRight className="relative h-6 w-6 transition-[transform,color] duration-300 group-hover:rotate-45 group-hover:text-ink sm:h-8 sm:w-8" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── The Drop ── */}
      <section className="bg-bone px-4 py-20 sm:px-8 sm:py-28">
        <div className="flex items-end justify-between gap-6">
          <div className="overflow-hidden">
            <h2 data-rise className="font-heavy text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.9] uppercase">
              The drop<span className="text-signal">.</span>
            </h2>
          </div>
          <Link to="/shop/men" className="group flex items-center gap-2 pb-1 text-sm">
            See everything <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-4 lg:grid-cols-4">
          {drop.map((p, i) => (
            <div key={p.id}>
              <p className="mb-2 text-xs text-stone tabular-nums">{String(i + 1).padStart(2, '0')}</p>
              <ProductCard product={p} />
            </div>
          ))}
          {!products && Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse bg-bone-2" />)}
        </div>
      </section>

      {products && categories && <ForYou products={products} categories={categories} alreadyShown={dropIds} />}

      {/* ── Categories ── */}
      <section className="bg-ink py-16 text-bone sm:py-24">
        <div className="px-4 sm:px-8">
          <p className="text-sm text-bone/50">Shop by category</p>
        </div>
        <ul className="mt-6">
          {CATEGORIES.map((c, i) => (
            <li key={c.slug} className="border-t border-bone/15 last:border-b">
              <Link
                to={c.to}
                className="group flex items-center gap-4 px-4 py-4 transition-colors duration-300 hover:bg-signal hover:text-ink sm:px-8"
              >
                <span className="w-8 shrink-0 text-xs text-bone/40 tabular-nums transition-colors group-hover:text-ink/60">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <img src={CATEGORY_PHOTOS[c.slug]} alt="" loading="lazy" className="h-12 w-9 shrink-0 object-cover md:hidden" />
                <span className="font-heavy text-[clamp(1.75rem,3.5vw,3rem)] leading-none uppercase transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] md:group-hover:translate-x-3">
                  {c.name}
                </span>
                <span className="ml-auto shrink-0 text-sm whitespace-nowrap text-bone/40 tabular-nums transition-colors group-hover:text-ink">
                  {counts[c.slug] != null ? `${counts[c.slug]} ${counts[c.slug] === 1 ? 'item' : 'items'}` : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Men / Women ── */}
      <section className="grid bg-ink md:grid-cols-2">
        {[
          { to: '/shop/men', label: 'Men', img: PHOTOS.men, alt: 'Two men in leather jackets and wide trousers' },
          { to: '/shop/women', label: 'Women', img: PHOTOS.women, alt: 'Woman in a check blazer' },
        ].map((t) => (
          <Link key={t.to} to={t.to} className="group relative h-[70svh] overflow-hidden md:h-[85svh]">
            <img data-zoom src={t.img} alt={t.alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-700 group-hover:brightness-75" />
            <div className="absolute inset-0 bg-linear-to-t from-ink/60 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-bone sm:p-8">
              <span className="font-heavy text-[clamp(2.75rem,5vw,4.5rem)] leading-[0.9] uppercase">{t.label}</span>
              <span className="mb-1 grid h-11 w-11 place-items-center rounded-full bg-bone text-ink transition-[background-color,transform] duration-300 group-hover:rotate-45 group-hover:bg-signal sm:h-14 sm:w-14">
                <ArrowUpRight className="h-5 w-5" />
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* ── Tagline + Instagram feed ── */}
      <section className="bg-ink py-20 text-bone sm:py-28">
        <div className="flex flex-col gap-8 px-4 sm:px-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Knight className="h-16" />
            <div className="mt-6 overflow-hidden">
              <p data-rise className="max-w-3xl font-heavy text-[clamp(2.25rem,5vw,4.5rem)] leading-[0.95] uppercase">
                If there is a will, <span className="text-signal">there is a way.</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-4 md:items-end">
            <p className="text-sm text-bone/60">
              376K following · {BRANCHES.length} stores · New drops land on Instagram first
            </p>
            <a
              href={INSTAGRAM_MEN}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 self-start bg-signal px-5 py-3.5 text-sm font-medium text-ink transition-transform duration-300 active:scale-[0.97] md:self-end"
            >
              Follow @justmove.lb <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
            </a>
          </div>
        </div>

        <ul className="mt-12 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:scroll-px-8 sm:px-8 lg:grid lg:grid-cols-6 lg:overflow-visible">
          {INSTAGRAM_POSTS.map((src, i) => (
            <li key={src} className="w-[42vw] shrink-0 snap-start sm:w-[28vw] lg:w-auto">
              <a
                href={INSTAGRAM_MEN}
                target="_blank"
                rel="noreferrer"
                className="group relative block aspect-[9/16] overflow-hidden bg-ink-2"
                aria-label={`Just Move Instagram post ${i + 1}`}
              >
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-105" />
                <span className="absolute inset-0 grid place-items-center bg-ink/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <Knight className="h-12" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Stores ── */}
      <section className="mx-auto max-w-[1600px] px-4 py-24 sm:px-8 md:py-32">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-5xl leading-none sm:text-7xl">Visit us</h2>
          <a href={INSTAGRAM_MEN} target="_blank" rel="noreferrer" className="text-sm underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
            @justmove.lb
          </a>
        </div>
        <ul className="mt-12 border-t border-ink/15">
          {BRANCHES.map((b, i) => (
            <li key={b.name}>
              <a href={b.map} target="_blank" rel="noreferrer" className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-ink/15 py-6 sm:gap-8 sm:py-8">
                <span className="w-8 text-sm text-stone tabular-nums">0{i + 1}</span>
                <div className="flex min-w-0 items-center gap-6">
                  <div className="hidden h-20 w-0 shrink-0 overflow-hidden transition-[width] duration-500 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:w-28 md:block">
                    <img src={b.photo} alt="" loading="lazy" className="h-20 w-28 max-w-none object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-3xl leading-tight sm:text-5xl">{b.name}</p>
                    <p className="mt-1 text-sm text-stone">{b.area}</p>
                  </div>
                </div>
                <span className="flex items-center gap-2 text-sm">
                  <span className="hidden sm:inline">Directions</span>
                  <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
