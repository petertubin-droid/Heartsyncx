# MUST_FIX — HeartSync XHub Remediation Roadmap

Living document. Phases 1 and 2 are COMPLETE (see git history: "security(phase-1)" and
"phase-2" commits). Everything below REMAINS and must be executed before the platform
can be considered production-ready.

## IMMEDIATE — ACTION REQUIRED OUTSIDE THE REPO (BLOCKER)

**DONE (2026-09-20): the live project (`pdtibsfasvicjptqirro`, Hearty) HAS been
migrated.** `supabase/schema.sql` was run end-to-end against production. Along the way
the schema gained: a "LEGACY LIVE-DB RECONCILIATION" section (idempotent
`ADD COLUMN IF NOT EXISTS` for drifted pre-existing tables, placed BEFORE the seed
section so seeds see reconciled shapes), uuid-typed `payments.subscription_id`
FK + uuid-PK-safe seeds (live `seo_settings`/`ai_settings`/`plans` have UUID PKs and
`seo_settings` has NOT NULL `entity_type`/`entity_id`), and uuid-vs-text policy
predicate fixes (live `subscriptions`/`user_settings` use uuid `user_id`).

Post-migration verification (all checked live):
- [x] `public.handle_new_user()` sets `role = 'user'` (no client metadata trust)
- [x] `is_admin()` role list matches the JS `ADMIN_ROLES` list (incl. 'Super Admin')
- [x] `profiles.email` NOT selectable by `anon` — REST test with the anon key:
      `?select=email` => 401 permission denied; `?select=id,full_name` => 200
- [x] `site_settings` has the new `ads_*`, `tts_*`, `raw_settings`, `ad_slots` columns
- [x] `integration_settings` / `integration_logs` match the key/value model
      (`key`/`value`/`is_sensitive` added alongside legacy columns)
- [x] `increment_post_engagement(...)` RPC exists and increments likes/views/reactions
- [x] `digital_products` + `digital_product_orders` tables + RLS policies exist and
      the `digital_product_download(p_token)` RPC exists (anon can redeem by token only)
- [ ] a test purchase webhook creates an order with a working download token
      (deferred: E2E requires a live gateway key — see Phase 3 checkout E2E)
- [x] `user_settings` has the "Users insert own settings" policy
- [x] storage bucket upload policies require `is_admin()` (with_check verified)
- [x] no legacy API key values remain in `site_settings` (secret-cleanup DO block ran;
      `extra_api_keys` = `{}`, `elevenlabs_api_key`/`recaptcha` cleared, `metadata` = `{}`)
- [x] admin role hygiene: only lowercase `admin` x1 (owner) + `subscriber` x2 in
      profiles; `admin_users` contains exactly the owner; no stray `Admin`-cased users

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

## PHASE 3 — Missing tests

- [x] Server route tests: DONE — `server/__tests__/server-security.test.ts` runs the
      real Express app on an ephemeral port with mocked Supabase: 21-route auth
      matrix (401 anon / 403 non-admin / admin admitted), suspended-admin block,
      public-route contract, state-sync sanitization end-to-end, subscribe
      idempotency, download-token RPC, integrations error surfacing, honest
      setup-wizard 503, plus source/schema regression locks. Also caught and fixed
      a real bug: stripSecretFields now drops secret-named fields of ANY type
      (arrays like extra_api_keys previously slipped through).
- [x] RLS/policy tests: DONE as schema-source contract tests (trigger role
      hardcode, is_admin vocabulary, profiles column grants, engagement RPC
      guards, digital-product policies, subscribers UNIQUE). Live RLS behavior is
      verified by the post-migration checklist above (requires the live DB).
- [x] Admin flow tests: DONE — admin settings save, integrations save/read with
      error surfacing, service-role honesty. Setup-wizard live promotion test runs
      after migration when SUPABASE_SERVICE_ROLE_KEY is present.
- [ ] Checkout E2E: /api/subscriptions/checkout -> gateway -> webhook ->
      subscription row. Requires live gateway keys; do after migration + keys.

## PHASE 4 — Architecture / duplication

- [x] DONE (2026-09-20): ad config collapsed to a single source. The production
      publisher ID (ca-pub-3404100134534192) now lives ONLY in site_settings
      (migrated into the live DB — identical value the old code fallback served,
      so live behavior unchanged). server getAdsenseConfig has NO hardcoded
      fallback anymore (honest absence when unconfigured) and the dist-HTML swap
      is guarded on a non-empty ID. AdminConsole ad-provider/auto-script templates
      now use the admin-configured adsense_client_id dynamically; the stale
      hardcoded pub-7483921098483921 in code templates is gone.
- [ ] Remove the hardcoded Supabase URL + anon key fallback in `src/store.ts`
      (env-only configuration).
- [ ] Unify Supabase client creation (store.ts, server getSupabaseClient,
      getAdminDbClient, service-role) into one module.
- [x] DONE (2026-09-20): dead code removed. The whole Cloud SQL path is gone:
      `getPgPool`/`getAdminPgPool`/`decoratePoolWithRetry`, the `pg` import and
      dependency (lockfile pruned), the 9 call-site `if (pool) {direct SQL} else
      {Supabase}` branches (only the live Supabase path remains — behavior
      identical since pool was always null), `tuneSupabaseDatabase`, the unused
      routes `/api/gemini/summarize`, `/api/gemini/run-ai-feature`,
      `/api/gemini/generate-page` (verified zero callers), and
      `public/_redirects` (Vercel rewrites in vercel.json cover it).
      server.ts shrank ~950 net lines. tsc clean, suite green.
- [x] DONE (2026-09-20): 42 unreferenced tables dropped from the live DB
      (legacy `users`, `rss_*`, `ai_*`, `api_keys`, `api_logs`, `invoices`,
      `transactions`, `premium_access`, `dashboard_stats`, `reading_statistics`,
      `testimonials`, `banners`, `navigation`, `footer`, `seo_settings`,
      `ai_settings`, `rewarded_unlock_*`, `email_history/events`,
      `featured_posts`, `trending_posts`, `notifications`, `contact_messages`,
      `cookie_preferences`, `search_index`, etc.). Verified zero app/server/SQL-sync
      references first (word-boundary scan + false-positive triage); all dropped
      RESTRICT (no hidden dependents; the `users` FKs all point at `auth.users`).
      80 -> 38 tables. The orphaned `handle_new_user_signup()` (client-metadata
      role trust, unattached) and dead `create_notification()` were dropped too.
      The duplicate `heartsync-media` bucket is deleted (Storage API) and its
      policies tightened to `bucket_id = 'media'`. Non-empty dropped-table rows
      (featured_posts x2, trending_posts x2, seo/ai singleton seeds) are archived
      at `supabase/archive/2026-09-20-phase4-dropped-tables.json`. schema.sql was
      scrubbed of all dropped-table DDL (77 statements), gained DROP POLICY guards
      for the last 2 unguarded CREATE POLICYs, and now reruns idempotently
      against the live DB. `user_settings` + `user_sessions` KEPT (server.ts
      account-merge writes both).
- [x] DONE (2026-09-20): hardcoded `VALID_RELATIONSHIP_SLUGS` whitelist removed.
      It was a live bug: none of the 8 real DB categories (emotional-wellness,
      relationship-science, mindful-dating, self-growth, somatic-healing,
      conscious-communication, secure-intimacy, inner-work) matched the
      10 hardcoded slugs, so the client Supabase sync dropped EVERY category.
      The DB is now the single source of truth for category visibility.

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
