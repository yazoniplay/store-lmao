# Velora production setup

The repo now contains the production backend layer for Supabase + Stripe.

## Supabase
1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. Create your admin user in Authentication.
4. Disable public sign-ups after creating the admin account.
5. Put the project URL and publishable/anon key into `velora-config.js`.

Supabase's browser client uses the project URL and publishable/anon key. The service-role key must stay server-side.

## Stripe / Edge Functions
Set these Supabase secrets:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

Deploy:
- `supabase functions deploy create-checkout`
- `supabase functions deploy stripe-webhook`

Create a Stripe webhook for:
`https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-webhook`

Listen for:
`checkout.session.completed`

The webhook must have JWT verification disabled, which is already set in `supabase/config.toml`.

## Important
Do not commit Stripe secrets or the Supabase service-role key to GitHub. The frontend only gets the public Supabase key.

Until `velora-config.js` is filled in, Velora automatically stays in local development mode.
