import { useCallback, useMemo, useState } from 'react'
import { useCart } from '@/cart/CartContext'
import ProductCard from '@/components/ProductCard'
import StyleQuiz from '@/components/StyleQuiz'
import { hasSignals, recommend } from '@/lib/recommend'
import { dismissQuiz, useTaste } from '@/lib/taste'
import type { Category, Product } from '@/types'

// Home page "Picked for you". Before we know anything, it invites the shopper to take the
// style quiz; once they've answered or browsed a little, it shows their picks.
export default function ForYou({
  products,
  categories,
  alreadyShown,
}: {
  products: Product[]
  categories: Category[]
  alreadyShown: string[]
}) {
  const taste = useTaste()
  const { lines } = useCart()
  const [quizOpen, setQuizOpen] = useState(false)
  const closeQuiz = useCallback(() => setQuizOpen(false), [])

  const picks = useMemo(() => {
    if (!hasSignals(taste)) return []
    const inBag = lines.map((l) => l.productId)
    const run = (exclude: string[]) => recommend(products, categories, taste, { mode: 'for-you', exclude, limit: 4 })
    // Prefer pieces not already on the page; fall back if that leaves too few.
    const fresh = run([...inBag, ...alreadyShown])
    return fresh.length === 4 ? fresh : run(inBag)
  }, [products, categories, taste, lines, alreadyShown])

  const quiz = <StyleQuiz open={quizOpen} onClose={closeQuiz} />

  if (!picks.length) {
    if (taste.quizDismissed || hasSignals(taste)) return quiz
    return (
      <section className="border-y border-ink/10 bg-bone-2/60 px-4 py-8 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-heavy text-2xl uppercase sm:text-3xl">Not sure where to start<span className="text-signal">?</span></p>
            <p className="mt-1 text-sm text-stone">Answer four quick questions and we'll pick pieces that fit your style.</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={dismissQuiz} className="text-sm text-stone underline-offset-4 hover:text-ink hover:underline">No thanks</button>
            <button onClick={() => setQuizOpen(true)} className="bg-ink px-5 py-3.5 text-sm font-medium text-bone transition-transform duration-300 active:scale-[0.97]">
              Find my style
            </button>
          </div>
        </div>
        {quiz}
      </section>
    )
  }

  return (
    <section className="bg-bone px-4 pb-20 sm:px-8 sm:pb-28">
      <div className="flex items-end justify-between gap-6 border-t border-ink/10 pt-16 sm:pt-20">
        <h2 className="font-heavy text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.9] uppercase">
          Picked for you<span className="text-signal">.</span>
        </h2>
        <button onClick={() => setQuizOpen(true)} className="pb-1 text-sm underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
          {taste.quiz ? 'Edit my style' : 'Tune my picks'}
        </button>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-4 lg:grid-cols-4">
        {picks.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
      {quiz}
    </section>
  )
}
