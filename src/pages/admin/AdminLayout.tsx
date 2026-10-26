import type { Session } from '@supabase/supabase-js'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import { supabase } from '@/lib/supabase'

export const input = 'w-full rounded-md border border-ink/15 bg-white px-3 py-2.5 outline-none focus:border-ink'
export const btn = 'rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-bone hover:bg-ink-2 disabled:opacity-50'
export const btnGhost = 'rounded-md border border-ink/15 bg-white px-4 py-2.5 text-sm hover:border-ink disabled:opacity-50'

export default function AdminLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [isAdmin, setIsAdmin] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) return setIsAdmin(undefined)
    supabase.rpc('is_admin').then(({ data }) => setIsAdmin(Boolean(data)))
  }, [session])

  if (!supabase) {
    return (
      <Shell>
        <div className="mx-auto max-w-lg py-24 text-center">
          <h1 className="text-2xl font-semibold">Admin needs Supabase</h1>
          <p className="mt-3 text-stone">The store is running in demo mode. Follow SETUP.md to connect your Supabase project, then come back here.</p>
          <Link to="/" className={`${btn} mt-6 inline-block`}>Back to store</Link>
        </div>
      </Shell>
    )
  }

  if (session === undefined) return <Shell><p className="py-24 text-center text-stone">Loading…</p></Shell>
  if (!session) return <Shell><Login /></Shell>
  if (isAdmin === undefined) return <Shell><p className="py-24 text-center text-stone">Checking access…</p></Shell>
  if (!isAdmin) {
    return (
      <Shell>
        <div className="mx-auto max-w-md py-24 text-center">
          <h1 className="text-xl font-semibold">No admin access</h1>
          <p className="mt-2 text-stone">{session.user.email} isn't an admin. Add this account in Supabase (see SETUP.md).</p>
          <button className={`${btnGhost} mt-6`} onClick={() => supabase!.auth.signOut()}>Sign out</button>
        </div>
      </Shell>
    )
  }

  return (
    <Shell
      nav={
        <>
          {[
            ['/admin', 'Orders'],
            ['/admin/products', 'Products'],
            ['/admin/settings', 'Settings'],
          ].map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) => `rounded-md px-3 py-1.5 text-sm ${isActive ? 'bg-ink text-bone' : 'hover:bg-bone-2'}`}
            >
              {label}
            </NavLink>
          ))}
          <button className="ml-auto text-sm text-stone hover:text-ink" onClick={() => supabase!.auth.signOut()}>
            Sign out
          </button>
        </>
      }
    >
      <Outlet />
    </Shell>
  )
}

function Shell({ children, nav }: { children: React.ReactNode; nav?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f6f3] font-sans">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 overflow-x-auto px-4">
          <Link to="/" className="mr-4 shrink-0 text-sm font-semibold tracking-[0.2em] uppercase">Just Move</Link>
          {nav}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase!.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-16 max-w-sm space-y-3 rounded-xl border border-ink/10 bg-white p-6">
      <h1 className="text-lg font-semibold">Staff sign in</h1>
      <input className={input} type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className={input} type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <p className="text-sm text-sale">{error}</p>}
      <button className={`${btn} w-full`} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  )
}
