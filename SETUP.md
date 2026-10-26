# Just Move store — setup

The site runs right away in **demo mode** (sample products, no real orders):

```bash
npm install
npm run dev        # http://localhost:5173
```

To take real orders, do the steps below once.

## 1. Database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com). Pick the **Frankfurt (eu-central-1)** region, the closest to Lebanon.
2. Open **SQL Editor**, paste all of `supabase/migrations/0001_store.sql`, and click **Run**.
3. Go to **Project Settings → API**. Copy `.env.example` to `.env` and fill in:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
4. Restart `npm run dev`. The "Demo mode" badge disappears.

The free plan easily handles 100+ orders a day. Once you're live, upgrade to **Pro ($25/month)** for daily backups of your orders.

## 2. Staff accounts

1. **Authentication → Sign In / Providers → Email**: turn **off** "Allow new users to sign up" (staff accounts are created by you only).
2. **Authentication → Users → Add user**: enter the staff email and password.
3. In the **SQL Editor**, make them an admin:
   ```sql
   insert into admins (user_id) select id from auth.users where email = 'staff@example.com';
   ```
4. Sign in at `/admin`.

## 3. Store settings and products

- `/admin/settings`: delivery fee, free-delivery threshold, your **Whish number** and **OMT name** (shown to customers at checkout).
- `/admin/products → Add product`: name, Men/Women, category, price, photos, then **Add sizes** to create the size × colour grid and enter stock for each.
- Home page photos for the Men / Women tiles: put two portrait photos in `public/` and set `HERO_MEN` / `HERO_WOMEN` in `src/lib/brand.ts`. Branch addresses and map links are in the same file.

## 4. Order emails

1. Create an account at [resend.com](https://resend.com) and verify your domain (e.g. `justmove.lb`).
2. Install the [Supabase CLI](https://supabase.com/docs/guides/cli), then:
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase secrets set RESEND_API_KEY=re_xxx NOTIFY_EMAIL=you@example.com FROM_EMAIL=orders@justmove.lb WEBHOOK_SECRET=<any long random text> SITE_URL=https://justmove.lb
   supabase functions deploy order-email --no-verify-jwt
   ```
3. In the dashboard: **Database → Webhooks → Create**
   - Table `orders`, event **Insert**
   - Type **Supabase Edge Functions** → `order-email`
   - HTTP header `x-webhook-secret` = the same `WEBHOOK_SECRET`

## 5. Go live (Vercel)

1. Push this folder to a GitHub repo.
2. On [vercel.com](https://vercel.com): **Add New → Project**, import the repo, and add the two `VITE_SUPABASE_*` variables.
3. Add your domain under **Settings → Domains**. Put the link in your Instagram bio.

Place a test order from your phone and walk it through the admin (confirm → out for delivery → delivered → cash collected) before announcing.

## How orders work

| Customer pays with | What happens |
|---|---|
| Cash on delivery | Order arrives as **New**. Call to confirm, then move it along. After delivery, press **Cash collected**. |
| Whish / OMT | Customer sends the money and types the reference number. The order shows **Check transfer**. Once you see the money, press **Transfer received**. |
| Card | Shown as "Coming soon" until a card gateway is connected. |

- Stock goes down the moment an order is placed, so two people can't buy the last piece.
- **Cancel order** puts the items back in stock.
- Prices are always taken from the database, never from the customer's browser.
- The admin order list updates live, with no refresh needed.

## Card payments (later)

Card payment needs a merchant account with a gateway that works with Lebanese businesses (for example Areeba, or the e-commerce gateway offered by your bank). Once you have the merchant credentials, the gateway gets connected and `card_enabled` is turned on in `store_settings`.
