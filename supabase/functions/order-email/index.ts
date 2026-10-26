// Sends the shop an email for every new order.
// Triggered by a Supabase Database Webhook on INSERT into public.orders.
//
// Secrets (supabase secrets set ...):
//   RESEND_API_KEY   – from resend.com
//   NOTIFY_EMAIL     – where order alerts go (comma-separated for several)
//   FROM_EMAIL       – a sender on a domain verified in Resend, e.g. orders@justmove.lb
//   WEBHOOK_SECRET   – same value as the webhook's "x-webhook-secret" header
//   SITE_URL         – e.g. https://justmove.lb (used for the admin link)

import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on delivery',
  whish: 'Whish Money',
  omt: 'OMT',
  card: 'Card',
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const money = (n: number) => `$${Number(n).toFixed(2)}`

Deno.serve(async (req) => {
  if (req.headers.get('x-webhook-secret') !== Deno.env.get('WEBHOOK_SECRET')) {
    return new Response('unauthorized', { status: 401 })
  }

  const { record } = await req.json()
  if (!record?.id) return new Response('no record', { status: 400 })

  // Totals and items are written after the INSERT fires, inside the same transaction,
  // so re-read the committed order.
  const { data: order, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', record.id)
    .single()
  if (error || !order) return new Response('order not found', { status: 404 })

  const rows = order.order_items
    .map(
      (i: { product_name: string; size: string; color: string; quantity: number; unit_price: number }) =>
        `<tr><td>${esc(i.product_name)}</td><td>${esc(i.size)}${i.color ? ` / ${esc(i.color)}` : ''}</td>` +
        `<td align="center">${i.quantity}</td><td align="right">${money(i.unit_price * i.quantity)}</td></tr>`,
    )
    .join('')

  const html = `
    <h2>New order #${order.order_number}</h2>
    <p><b>${esc(order.customer_name)}</b><br>${esc(order.phone)}<br>${esc(order.city)} — ${esc(order.address)}</p>
    ${order.notes ? `<p><i>Note:</i> ${esc(order.notes)}</p>` : ''}
    <p>Payment: <b>${PAYMENT_LABELS[order.payment_method]}</b>${
      order.payment_reference ? ` — ref <b>${esc(order.payment_reference)}</b> (check before confirming)` : ''
    }</p>
    <table cellpadding="6" style="border-collapse:collapse" border="1">
      <tr><th align="left">Item</th><th align="left">Size</th><th>Qty</th><th align="right">Total</th></tr>
      ${rows}
    </table>
    <p>Subtotal ${money(order.subtotal)} · Delivery ${money(order.delivery_fee)} · <b>Total ${money(order.total)}</b></p>
    <p><a href="${Deno.env.get('SITE_URL') ?? ''}/admin/orders/${order.id}">Open in admin</a></p>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('FROM_EMAIL'),
      to: Deno.env.get('NOTIFY_EMAIL')!.split(',').map((s) => s.trim()),
      subject: `New order #${order.order_number} — ${money(order.total)} — ${order.customer_name}`,
      html,
    }),
  })

  if (!res.ok) return new Response(await res.text(), { status: 502 })
  return new Response('sent')
})
