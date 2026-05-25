# Feature Implementation Rules for FRO Admin Web

## Purpose

This file defines how new admin features must be implemented inside this SvelteKit project while it is still being developed inside the larger Flutter/Supabase workspace.

The goal is to keep the existing web app skeleton stable, isolate new feature work, and allow the new payment/dispute admin features to use the real Supabase project without breaking existing sandbox-based dashboard code.

---

## Core rule

Do **not** restructure the existing SvelteKit app.

New work must be isolated inside feature-specific dashboard directories and shared feature-specific library folders.

Only change existing shared files when absolutely necessary.

---

## Feature boundaries

There are two planned feature areas:

1. Payment, escrow, payout, and reconciliation monitoring
2. Dispute and report case management

They must be isolated under separate route directories.

### Payments feature routes

All payment feature routes must live under:

```txt
src/routes/dashboard/payments/
```

Allowed examples:

```txt
src/routes/dashboard/payments/+page.server.ts
src/routes/dashboard/payments/+page.svelte
src/routes/dashboard/payments/transactions/+page.server.ts
src/routes/dashboard/payments/transactions/[range]/+page.server.ts
src/routes/dashboard/payments/transactions/[range]/+page.svelte
src/routes/dashboard/payments/transactions/[range]/columns.ts
src/routes/dashboard/payments/escrow/+page.server.ts
src/routes/dashboard/payments/escrow/[range]/+page.server.ts
src/routes/dashboard/payments/escrow/[range]/+page.svelte
src/routes/dashboard/payments/payouts/+page.server.ts
src/routes/dashboard/payments/payouts/+page.svelte
src/routes/dashboard/payments/bookings/[id]/+page.server.ts
src/routes/dashboard/payments/bookings/[id]/+page.svelte
src/routes/dashboard/payments/reconciliation/+page.server.ts
src/routes/dashboard/payments/reconciliation/+page.svelte
```

### Disputes feature routes

All dispute feature routes must live under:

```txt
src/routes/dashboard/disputes/
```

Allowed examples:

```txt
src/routes/dashboard/disputes/+page.server.ts
src/routes/dashboard/disputes/+page.svelte
src/routes/dashboard/disputes/cases/[id]/+page.server.ts
src/routes/dashboard/disputes/cases/[id]/+page.svelte
src/routes/dashboard/disputes/evidence/[id]/+page.server.ts
src/routes/dashboard/disputes/evidence/[id]/+page.svelte
```

---

## Shared feature code boundaries

If feature-specific reusable code is needed, place it under:

```txt
src/lib/features/payments/
src/lib/features/disputes/
```

Examples:

```txt
src/lib/features/payments/payment-status.ts
src/lib/features/payments/escrow-state.ts
src/lib/features/payments/payment-queries.server.ts
src/lib/features/payments/payment-types.ts
src/lib/features/disputes/dispute-status.ts
src/lib/features/disputes/dispute-queries.server.ts
src/lib/features/disputes/dispute-types.ts
```

Avoid placing feature-specific business logic directly in global/shared component folders unless it is truly reusable by the rest of the dashboard.

---

## Files that may be changed outside feature directories

Changes outside the feature directories should be minimal.

Allowed exceptions:

### 1. Drizzle schema

Allowed file:

```txt
src/lib/server/db/schema.ts
```

Reason:

The payment and dispute features need accurate table/view definitions for the live Supabase schema.

### 2. Sidebar navigation

Allowed file:

```txt
src/lib/components/app-sidebar.svelte
```

Reason:

The dashboard needs links to:

```txt
/dashboard/payments
/dashboard/disputes
```

Only add navigation entries. Do not redesign the sidebar.

### 3. Environment helpers

Allowed files if needed:

```txt
src/lib/server/db/index.ts
src/lib/server/feature-db.ts
src/lib/server/real-project-db.ts
src/app.d.ts
```

Reason:

The existing dashboard may continue using sandbox DB variables while the new payment/dispute features may need to read from the real Supabase project.

Any helper added for this must be additive and must not break existing DB behavior.

### 4. Existing shared UI components

Allowed only when absolutely necessary:

```txt
src/lib/components/Table/*
src/lib/components/ui/*
```

Rule:

Prefer wrapping/reusing existing components from feature routes instead of modifying shared components.

---

## Environment separation rule

The current web project may already use sandbox variables for existing dashboard pages. Do not break them.

New payment/dispute features may use a separate real-project database connection if required.

### Existing/default variables

Keep existing variables working for current app code:

```env
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_PUBLISHABLE_KEY=
PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
PRIVATE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

These may continue pointing to the sandbox project while testing existing pages.

### New real-project variables for payment/dispute features

If the new features need to query the real Supabase project while existing code remains on sandbox, use separate variables:

```env
REAL_SUPABASE_URL=
REAL_SUPABASE_PUBLISHABLE_KEY=
REAL_SUPABASE_SERVICE_ROLE_KEY=
REAL_DATABASE_URL=
```

Optional public real-project variables should only be added if client-side access is truly required:

```env
PUBLIC_REAL_SUPABASE_URL=
PUBLIC_REAL_SUPABASE_PUBLISHABLE_KEY=
```

For payment/admin features, prefer server-side access using `REAL_DATABASE_URL` or `REAL_SUPABASE_SERVICE_ROLE_KEY`.

Never expose service-role keys to client-side code.

---

## Database connection rule

Existing dashboard pages should continue using the current DB client unless intentionally migrated.

New payment/dispute server loaders may use a separate real-project DB client, for example:

```txt
src/lib/server/real-db/index.ts
```

That client should read:

```txt
REAL_DATABASE_URL
```

and should not replace the existing `src/lib/server/db/index.ts` unless the whole app is intentionally moved to the real DB.

---

## Implementation style

Follow current project conventions:

- SvelteKit route loaders in `+page.server.ts`
- Svelte pages in `+page.svelte`
- table column definitions in `columns.ts`
- existing `DataTable`
- existing `FilterMenu`
- existing `DateMonth`
- existing shadcn-svelte UI components
- Drizzle for server-side DB reads where practical

Do not introduce a new UI framework or large state-management pattern for these features.

---

## Payment feature safety rule

The first payment implementation must be read-only.

Do not add admin actions that mutate money state until explicit approval.

Forbidden in phase 1:

- refund execution
- capture retry
- cancel PaymentIntent action
- provider wallet adjustment
- hold/release funds
- payout retry
- manual ledger insert/update/delete

Allowed in phase 1:

- list payments
- list escrow positions
- list provider payouts
- show booking payment details
- show ledger entries
- show Stripe webhook evidence
- show reconciliation warnings

---

## Dispute feature safety rule

The first dispute implementation should also be read-only or limited to non-money case-management actions.

Any action that affects refunds, holds, provider balances, booking payment status, or ledger entries must be implemented only after payment actions are designed and audited.

---

## Handoff rule

When the feature is ready to move to the real admin web GitHub repo:

1. Copy the contents of this web app root, not the parent Flutter repo.
2. Preserve this file.
3. Preserve any feature folders under:
   - `src/routes/dashboard/payments/`
   - `src/routes/dashboard/disputes/`
   - `src/lib/features/payments/`
   - `src/lib/features/disputes/`
4. Configure production env variables in the deployment platform.

---

## Summary

Feature work must be isolated.

Use:

```txt
src/routes/dashboard/payments/
src/routes/dashboard/disputes/
src/lib/features/payments/
src/lib/features/disputes/
```

Only modify global app files when necessary for schema, navigation, or environment separation.

Keep existing sandbox variables working, and use `REAL_*` variables for new real-project payment/dispute reads when needed.
