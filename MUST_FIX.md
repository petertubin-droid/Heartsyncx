# MUST_FIX — HeartSync XHub Remediation Roadmap

Living document. Phases 1 and 2 are COMPLETE (see git history: "security(phase-1)" and
"phase-2" commits). Everything below REMAINS and must be executed before the platform
can be considered production-ready.

## IMMEDIATE — ACTION REQUIRED OUTSIDE THE REPO (BLOCKER)

The security and persistence fixes in Phases 1-2 change `supabase/schema.sql`, but the
live Supabase project has NOT been migrated. **Until this runs, the database-side fixes
(signup role hardening, PII column grants, engagement RPC, integration tables, TTS
columns, secret scrub) are NOT active in production.**

Run the updated `supabase/schema.sql` against the live project (SQL editor or
`supabase db push`). It is idempotent (`IF NOT EXISTS` / `CREATE OR REPLACE` /
`ADD COLUMN IF NOT EXISTS`). Verify afterwards:
- [ ] `public.handle_new_user()` sets `role = 'user'` (no client metadata trust)
- [ ] `is_admin()` role list matches the JS `ADMIN_ROLES` list (incl. 'Super Admin')
- [ ] `profiles.email` NOT selectable by `anon` (test with the anon key)
- [ ] `site_settings` has the new `ads_*`, `tts_*`, `raw_settings`, `ad_slots` columns
- [ ] `integration_settings` / `integration_logs` match the key/value model
- [ ] `increment_post_engagement(...)` RPC exists and increments likes/views/reactions
- [ ] `digital_products` + `digital_product_orders` tables, their RLS policies, and
      the `digital_product_download(p_token)` RPC exist (anon can redeem by token only)
- [ ] a test purchase webhook creates an order with a working download token
- [ ] `user_settings` has the "Users insert own settings" policy
- [ ] storage bucket upload policies require `is_admin()`
- [ ] no legacy API key values remain in `site_settings` (secret-cleanup DO block ran)
- [ ] any manually-created admin from the broken wizard era has a valid role value
      (lowercase `admin`), and no stray `Admin`-cased users hold privileges

## PHASE 2 (remaining items)

- [x] M-08: DONE — /api/subscribe now persists directly to the subscribers table
      (email UNIQUE); duplicates resolve to idempotent success and welcome emails
      fire only for genuinely new subscribers.
- [x] H-06: DONE — digital products fully DB-backed (digital_products +
      digital_product_orders, admin CRUD, webhook-only order fulfilment, token
      download RPC). The fake seed products and dead heartsync.app URLs are gone;
      the catalog starts empty. Pending: real signed storage URLs when products
      are created (file_url currently admin-supplied).
- [ ] H-08: hosting model decision — the backend still assumes a long-lived process
      (in-memory GDPR store, module store, analytics, rate limiter) but deploys as one
      30s serverless function. Either move all in-memory stores to Supabase tables, or
      deploy to a long-lived single-origin host as the README prescribes. Analytics
      currently resets on every cold start (per-instance counters).

## PHASE 3 — Missing tests (no product changes)

- [ ] Server route tests: auth matrix per route (401/403 for anon, success for admin),
      webhook gateway re-verification, state sync sanitization.
- [ ] RLS/policy tests: signup trigger role, profiles column grants, engagement RPC
      (likes/views/reactions via anon), subscribers insert.
- [ ] Admin flow tests: setup wizard promotion (service role), admin settings save,
      integrations save/read round-trip.
- [ ] Checkout E2E: /api/subscriptions/checkout -> gateway -> webhook -> subscription row.
      (`npm test` now runs in CI; the suite currently covers frontend only.)

## PHASE 4 — Architecture / duplication

- [ ] Collapse ad config to a single source (env vars vs site_settings vs store.ts
      code templates currently duplicate AdSense slots/publisher ids).
- [ ] Remove the hardcoded Supabase URL + anon key fallback in `src/store.ts`
      (env-only configuration).
- [ ] Unify Supabase client creation (store.ts, server getSupabaseClient,
      getAdminDbClient, service-role) into one module.
- [ ] Remove dead code: pg-pool branches (`getPgPool` always returns null — delete the
      whole Cloud SQL path + SQL_* env group), `tuneSupabaseDatabase` no-op,
      unused routes (`/api/gemini/run-ai-feature`, `generate-page`, `summarize` if no
      caller), `public/_redirects`.
- [ ] After live-DB verification: drop or archive ~35 unreferenced tables (legacy
      `users`, `rss_*`, `ai_*`, `api_keys`, `api_logs`, `invoices`, `transactions`,
      `premium_access`, `dashboard_stats`, `reading_statistics`, `testimonials`,
      `banners`, `navigation`, `footer`, `seo_settings`, `ai_settings`,
      `rewarded_unlock_*`, `email_history/events`, etc.) and the duplicate
      `heartsync-media` storage bucket.
- [ ] Category visibility: remove the hardcoded `VALID_RELATIONSHIP_SLUGS` whitelist in
      `src/store.ts` or make it admin-configurable (it hides DB categories).

## PHASE 5 — Performance

- [ ] `GET /api/state` loads ~22 tables incl. full article bodies; add field
      projection / pagination.
- [ ] Split the 16k-line AdminConsole out of the reader bundle (lazy import).
- [ ] Avoid the double boot fetch (client loads /api/state AND direct Supabase sync).
- [ ] `posts.select('*')` in list views — project only list columns.

## PHASE 6 — SEO / PWA / a11y

- [ ] Derive canonical/OG origin from the request host instead of hardcoding
      `heartsyncxhub.vercel.app`; reconcile with `heartsync.app` used in emails.
- [ ] Accessibility pass: focus traps in modals/lightbox, form label audit, contrast.
- [ ] Service worker cache-version bump process (currently manual `v2` constants).

## PHASE 7 — Documentation honesty

- [ ] Update README/AGENTS docs: they claim "no fake integrations" while (until
      Phases 2-3 land fully) the GDPR store is in-memory and module "migrations" are
      simulated logs. Rewrite docs to match reality.
- [ ] Document the env contract (keys are env-only; site_settings never stores keys).

## Known findings intentionally deferred (from the forensic audit)

- M-01: rate limiter trusts spoofable `x-forwarded-for` (needs a durable store first).
- M-02: CSP still allows `unsafe-inline`/`unsafe-eval`; CORS defaults to an AI Studio
  dev origin (needs an ad-network/script-inventory decision before tightening).
- H-09: subscriptions/payments must never be serialized into public GET /api/state —
  currently empty only because RLS blocks anon reads; enforce explicitly in Phase 3.
