# Payments Feature Environment Setup

Payments now uses the **same default project env keys** as the rest of the app.

## Required variables

Add these to `.env.local`:

- `DATABASE_URL`
- `PRIVATE_SERVICE_ROLE_KEY`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Notes

- Use your payments Supabase project values for the keys above.
- Use the **Supabase pooler transaction URI** (`...pooler.supabase.com:6543/...`) for `DATABASE_URL`.
