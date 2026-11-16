# Xmas Tree Wrap-Up

Website for the annual London, Ontario Christmas tree pickup fundraiser in
support of the London Food Bank. Donors give online, book a curbside pickup,
and the site keeps a live count of the remaining pickup spots.

Built with Next.js (hosted on Vercel), Supabase (database) and Stripe
(payments, including Apple Pay and Google Pay).

## What's here

| Path | What it does |
| --- | --- |
| `src/lib/config.ts` | Pickup date, tree cap, donation amounts, tax-receipt threshold, pickup radius. Change these each year. |
| `src/app/page.tsx` | Home page. `TOTAL_RAISED` and `SPONSORS` are at the top of the file. |
| `src/app/register/` | Registration form, address check, donation picker, payment, waitlist and confirmation page. |
| `src/app/api/checkout/` | Reserves pickup spots and creates the Stripe payment. |
| `src/app/api/stripe/webhook/` | Stripe calls this when a payment succeeds. |
| `src/app/admin/` | Password-protected pickup list and CSV export for Dispatch. |
| `supabase/migrations/` | Database tables and the spot-counting rules. |

## Setting up

1. Create a Supabase project and run the SQL in `supabase/migrations/`.
2. Copy `.env.example` to `.env.local` and fill it in. The same variables go
   into Vercel under Project → Settings → Environment Variables.
3. In Stripe, add a webhook endpoint for
   `https://<your-domain>/api/stripe/webhook` listening for
   `payment_intent.succeeded` and `payment_intent.canceled`, and copy its
   signing secret into `STRIPE_WEBHOOK_SECRET`.
4. In Stripe → Settings → Payment method domains, add the site's domain so
   Apple Pay and Google Pay appear.

The site runs without any of these set: the counter shows the cap instead of a
live number, and the payment step says it isn't switched on yet.

## Running locally

```bash
npm install
npm run dev
```

## How the 500-tree cap works

Pressing pay reserves the donor's spots for 20 minutes while the payment goes
through. Paid trees, and unpaid trees still inside that hold, count as taken.
If the payment is never completed the spots are released automatically. The
cap and the hold time live in the `settings` table, so they can be changed
without a redeploy; set `registration_open` to `false` there to close
registration early.
