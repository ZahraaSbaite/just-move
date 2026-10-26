import { useSyncExternalStore } from 'react'
import type { Gender } from '@/types'

// What we know about the shopper, kept on their own device only (localStorage).
// Two sources: what they tell us in the style quiz, and what they do on the site.

export const STYLES = {
  classic: 'Classic',
  modern: 'Modern',
  'smart-casual': 'Smart casual',
  street: 'Street',
  evening: 'Evening',
  statement: 'Statement',
} as const
export type Style = keyof typeof STYLES

export const OCCASIONS = {
  work: 'Work',
  events: 'Weddings & events',
  everyday: 'Everyday',
  'night-out': 'Nights out',
  travel: 'Travel',
} as const
export type Occasion = keyof typeof OCCASIONS

export const AGE_RANGES = ['18–24', '25–34', '35–44', '45+'] as const
export type AgeRange = (typeof AGE_RANGES)[number]

export interface QuizAnswers {
  gender: Gender | 'both' | null
  age: AgeRange | null
  styles: Style[]
  occasions: Occasion[]
}

export type EventType = 'view' | 'add' | 'purchase'
export interface TasteEvent {
  pid: string
  type: EventType
  t: number
}

export interface Taste {
  quiz: QuizAnswers | null
  events: TasteEvent[]
  // Shop pages opened per section — a cheap gender signal before any product is clicked.
  browsed: Record<Gender, number>
  quizDismissed: boolean
}

const KEY = 'justmove.taste.v1'
const MAX_EVENTS = 300
const EMPTY: Taste = { quiz: null, events: [], browsed: { men: 0, women: 0 }, quizDismissed: false }

function load(): Taste {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Taste) } : EMPTY
  } catch {
    return EMPTY
  }
}

let state = load()
const listeners = new Set<() => void>()

function update(fn: (s: Taste) => Taste) {
  state = fn(state)
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage unavailable (private mode) — profile lasts for this visit only
  }
  listeners.forEach((l) => l())
}

export function track(pid: string, type: EventType) {
  update((s) => {
    const last = s.events[s.events.length - 1]
    // Re-renders and quick back/forward shouldn't count as a second view.
    if (type === 'view' && last?.pid === pid && last.type === 'view' && Date.now() - last.t < 30_000) return s
    return { ...s, events: [...s.events, { pid, type, t: Date.now() }].slice(-MAX_EVENTS) }
  })
}

export function trackBrowse(gender: Gender) {
  update((s) => ({ ...s, browsed: { ...s.browsed, [gender]: s.browsed[gender] + 1 } }))
}

export function saveQuiz(quiz: QuizAnswers) {
  update((s) => ({ ...s, quiz }))
}

export function dismissQuiz() {
  update((s) => ({ ...s, quizDismissed: true }))
}

export function resetTaste() {
  update(() => EMPTY)
}

export function getTaste(): Taste {
  return state
}

export function useTaste(): Taste {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}
