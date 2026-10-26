import { useEffect, useState, type FormEvent } from 'react'
import { adminSaveSettings, getSettings } from '@/lib/api'
import type { StoreSettings } from '@/types'
import { btn, input } from './AdminLayout'

export default function Settings() {
  const [s, setS] = useState<StoreSettings | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    getSettings().then(({ delivery_fee, free_delivery_over, whish_number, omt_name, card_enabled }) =>
      setS({ delivery_fee, free_delivery_over, whish_number, omt_name, card_enabled }),
    )
  }, [])

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!s) return
    setMsg('')
    try {
      await adminSaveSettings(s)
      setMsg('Saved')
    } catch (err) {
      setMsg((err as Error).message)
    }
  }

  if (!s) return <p className="text-stone">Loading…</p>
  const label = 'mb-1 block text-xs font-medium text-stone'

  return (
    <form onSubmit={save} className="max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <section className="space-y-4 rounded-xl border border-ink/10 bg-white p-4">
        <div>
          <label className={label}>Delivery fee ($)</label>
          <input className={input} type="number" min={0} step="0.5" required value={s.delivery_fee} onChange={(e) => setS({ ...s, delivery_fee: Number(e.target.value) })} />
        </div>
        <div>
          <label className={label}>Free delivery on orders over ($) — leave empty for never</label>
          <input className={input} type="number" min={0} value={s.free_delivery_over ?? ''} onChange={(e) => setS({ ...s, free_delivery_over: e.target.value ? Number(e.target.value) : null })} />
        </div>
        <div>
          <label className={label}>Whish Money number shown at checkout</label>
          <input className={input} value={s.whish_number} onChange={(e) => setS({ ...s, whish_number: e.target.value })} />
        </div>
        <div>
          <label className={label}>OMT receiver name shown at checkout</label>
          <input className={input} value={s.omt_name} onChange={(e) => setS({ ...s, omt_name: e.target.value })} />
        </div>
        <p className="text-xs text-stone">Card payment stays off until a payment gateway is connected (see SETUP.md).</p>
      </section>
      <div className="flex items-center gap-3">
        <button className={btn}>Save</button>
        {msg && <span className="text-sm text-stone">{msg}</span>}
      </div>
    </form>
  )
}
