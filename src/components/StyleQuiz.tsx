import { useLenis } from 'lenis/react'
import { useEffect, useState } from 'react'
import {
  AGE_RANGES,
  OCCASIONS,
  STYLES,
  getTaste,
  resetTaste,
  saveQuiz,
  type Occasion,
  type QuizAnswers,
  type Style,
} from '@/lib/taste'

const EMPTY: QuizAnswers = { gender: null, age: null, styles: [], occasions: [] }

const chip = (on: boolean) =>
  `border px-4 py-2.5 text-sm transition-colors ${on ? 'border-ink bg-ink text-bone' : 'border-ink/20 hover:border-ink'}`

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

export default function StyleQuiz({ open, onClose }: { open: boolean; onClose: () => void }) {
  const lenis = useLenis()
  const [answers, setAnswers] = useState<QuizAnswers>(() => getTaste().quiz ?? EMPTY)

  // Start from the saved answers each time the modal opens.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setAnswers(getTaste().quiz ?? EMPTY)
  }

  useEffect(() => {
    if (!open) return
    lenis?.stop()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      lenis?.start()
      window.removeEventListener('keydown', onKey)
    }
  }, [open, lenis, onClose])

  const set = <K extends keyof QuizAnswers>(k: K, v: QuizAnswers[K]) => setAnswers((a) => ({ ...a, [k]: v }))
  const canSave = answers.gender != null || answers.styles.length > 0 || answers.occasions.length > 0

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-title"
        className={`absolute inset-x-0 bottom-0 flex max-h-[92svh] flex-col bg-bone shadow-2xl transition-[transform,visibility] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[86svh] sm:w-[min(40rem,calc(100vw-4rem))] sm:-translate-x-1/2 ${
          open ? 'visible translate-y-0 sm:-translate-y-1/2' : 'invisible translate-y-full sm:translate-y-[-40%] sm:opacity-0'
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 px-5 py-4 sm:px-8 sm:py-6">
          <div>
            <h2 id="quiz-title" className="font-heavy text-3xl uppercase sm:text-4xl">Your style<span className="text-signal">.</span></h2>
            <p className="mt-1 text-sm text-stone">Four quick questions so we can pick pieces for you. All optional.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="-mr-2 p-2 text-xl leading-none">✕</button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6 sm:px-8" data-lenis-prevent>
          <fieldset>
            <legend className="mb-3 text-sm font-medium">I'm shopping for</legend>
            <div className="flex flex-wrap gap-2">
              {([['men', 'Men'], ['women', 'Women'], ['both', 'Both']] as const).map(([v, l]) => (
                <button key={v} type="button" aria-pressed={answers.gender === v} className={chip(answers.gender === v)}
                  onClick={() => set('gender', answers.gender === v ? null : v)}>{l}</button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-medium">Age</legend>
            <div className="flex flex-wrap gap-2">
              {AGE_RANGES.map((a) => (
                <button key={a} type="button" aria-pressed={answers.age === a} className={chip(answers.age === a)}
                  onClick={() => set('age', answers.age === a ? null : a)}>{a}</button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-medium">Styles you like <span className="text-stone">— pick any</span></legend>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(STYLES) as [Style, string][]).map(([v, l]) => (
                <button key={v} type="button" aria-pressed={answers.styles.includes(v)} className={chip(answers.styles.includes(v))}
                  onClick={() => set('styles', toggle(answers.styles, v))}>{l}</button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-medium">What you dress for <span className="text-stone">— pick any</span></legend>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(OCCASIONS) as [Occasion, string][]).map(([v, l]) => (
                <button key={v} type="button" aria-pressed={answers.occasions.includes(v)} className={chip(answers.occasions.includes(v))}
                  onClick={() => set('occasions', toggle(answers.occasions, v))}>{l}</button>
              ))}
            </div>
          </fieldset>

          <p className="text-xs leading-relaxed text-stone">
            Saved on this device only, along with the pieces you look at, so we can suggest things you'll like.{' '}
            <button type="button" className="underline underline-offset-2 hover:text-ink" onClick={() => { resetTaste(); onClose() }}>
              Clear my style profile
            </button>
          </p>
        </div>

        <div className="border-t border-ink/10 px-5 py-4 sm:px-8">
          <button
            disabled={!canSave}
            onClick={() => { saveQuiz(answers); onClose() }}
            className="w-full bg-ink py-4 text-sm font-medium tracking-wide text-bone uppercase transition-[background-color,transform] hover:bg-ink-2 active:scale-[0.99] disabled:bg-stone"
          >
            Show my picks
          </button>
        </div>
      </div>
    </div>
  )
}
