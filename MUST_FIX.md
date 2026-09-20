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
- [x] H-08: DONE (2026-09-20) — decision: the serverless model wins; every durable
      store now lives in Supabase, applied live to Hearty (pdtibsfasvicjptqirro) and
      verified with smoke tests:
      - GDPR engine: gdpr_audit_log / gdpr_dsr_requests / diagnostic_results tables
        (RLS admin-gated, service-role writes) replace the three in-memory stores;
        diagnostics GET/DELETE are now admin-only (was a public privacy hole).
      - Page views: POST /api/analytics calls the SECURITY DEFINER RPC log_page_view()
        (atomic per-day/per-path upsert; live-verified 1 -> 2). The old handler
        incremented a cache object whose sync silently dropped it, so counts reset on
        every cold start and the analytics table stayed empty. App.tsx now sends the
        page-view beacon; AnalyticsPanel reads the new admin GET /api/analytics/summary.
      - Feature Manager: feature_modules table (id + JSONB state) replaces the
        module-scope SERVER_MODULES_STORE array; install/toggle/update/rollback/uninstall
        all persist.
      - Remaining in-memory state is intentionally per-instance and non-durable:
        rate limiter + advice rate buckets (throttles, M-01 deferred), TTS cache and the
        site-state read cache (caches with DB sync). Cold starts now lose nothing that
        matters: user data, GDPR records, analytics and module installs all survive.

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
- [x] DONE (2026-09-20, commit 6c76e24 + today's audit): no hardcoded Supabase
      URL/anon key anywhere in src/ (DEFAULT_SETTINGS uses empty strings; only a
      UI input placeholder remains). Config is env-first, then server-supplied
      site_settings via /api/state; the LocalStorage auto-migrate block is gone.
- [x] DONE (2026-09-20): ALL client creation unified through
      createSupabaseClient() in src/lib/supabaseConfig.ts (the shared
      dependency-free config module) — store boot client, server
      getSupabaseClient, adminAuthMiddleware verify client, getAdminDbClient,
      getServiceRoleSupabase, and the subscription-mirror user-scoped client
      (6 call sites). Same cleaning rules for every client; user-scoped
      variants get the global Authorization header in one place. Verified with
      a fresh vite build (chunk split unchanged) + suite 186/186.
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

- [x] DONE (2026-09-20): boot payload fully projected. Posts ship list-only
      (per-article body via public GET /api/posts/:slug + ensureArticleContent);
      subscribers ship (email, source, subscribed_at) only; comments ship public
      columns only — author_email (PII) is projected out at the query AND
      stripped at state assembly (defense in depth, regression-tested), and
      the admin state-sync upsert omits the column when absent so stored
      emails can never be blanked. pages.content stays by design (reader tabs
      render it directly; table is bounded ~16 rows). audit_logs/payments
      remain capped. Remaining ~20 tables are small config/domain tables —
      pagination deferred until any of them grows unbounded.
- [x] DONE (2026-09-20): AdminConsole split out of the reader bundle via
      React.lazy + Suspense (own chunk, ~1.16 MB / 270 KB gzip) — it only
      downloads when an admin opens the admin tab. Reader bundle dropped to
      ~1.70 MB / 488 KB gzip. Verified in a real vite build (AdminConsole-*.js
      emitted as a separate dynamic chunk).
- [x] DONE (2026-09-20): double boot fetch eliminated. /api/state (fresh from
      Supabase with a 15s TTL) is the single boot fetch — initSupabaseConnection
      no longer fires a redundant full-table syncWithSupabase() on top of it.
      syncWithSupabase stays for explicit re-syncs (admin login refresh).
      Bonus: realtime postgres-change events (which arrive in bursts) now
      debounced to one trailing /api/state refresh instead of one per event.
- [x] DONE (2026-09-20): posts projected to list columns everywhere — the
      server boot state (POST_LIST_COLUMNS), the client store's direct sync,
      and all existing list consumers (sitemap/RSS) were already projected.
      Per-article bodies load lazily via GET /api/posts/:slug (public,
      published-only) + store.ensureArticleContent; reader open and the admin
      quiz-generator flow both enrich on demand. 3 new route tests.

## PHASE 6 — SEO / PWA / a11y

- [x] DONE (2026-09-20): canonical/OG URLs, robots.txt, sitemap.xml,
      sitemap-images, and RSS all already derive from the request host at
      runtime (no hardcoded heartsyncxhub.vercel.app in served responses).
      Outbound-email links (footer CTA + unsubscribe) now flow through
      getPublicSiteUrl() — env-driven (PUBLIC_SITE_URL). OWNER DECISION
      SETTLED (2026-09-20): the canonical public domain is
      https://heartsyncxhub.vercel.app (owner-confirmed) — the
      getPublicSiteUrl() default now matches, as does the sitemap fallback.
      Recommended (not required): still set PUBLIC_SITE_URL/SITE_URL in the
      Vercel env so preview deploys stay consistent. Email from-address
      (editorial@heartsync.com) still open.
- [x] DONE (2026-09-20): accessibility pass. New src/utils/a11y.ts implements the
      WAI-ARIA dialog pattern (Escape closes, Tab/Shift+Tab trapped, focus lands
      inside on open, focus restored to the invoker on close) via a shared
      useDialogA11y hook. Applied to: the article image lightbox (NEW
      ImageLightbox.tsx — the lightboxImage state existed since the original
      build but nothing ever rendered it, so clicking article images did
      nothing despite the zoom cursor) and the CookieBanner preferences modal
      (previously aria-modal without Escape/trap; MobileMenu already had its
      own). Form label audit: all 28 reader-facing inputs now have accessible
      names — purchase forms got real <label htmlFor> associations (span
      pseudo-labels), comment/newsletter/LiveChat/LoveVault inputs got
      aria-labels, SubscriptionPage got id+htmlFor pairs for its 10 inputs.
      Contrast: 15 previously-UNDEFINED theme color steps (zinc-450 used 53x,
      zinc-550 18x, zinc-750 23x, zinc-905 4x, plus 11 single-use typos) were
      silently resolving to inherited colors — all defined now; zinc-450 maps
      to zinc-500 (not 400) because zinc-400 on white is ~2.9:1 and fails WCAG
      AA for the small caption text using it. 5 new tests (lightbox dialog
      contract + cookie-modal Escape). Suite 192/192, tsc clean.
- [x] DONE (2026-09-20): SW cache versions are stamped automatically at build
      time. public/sw.js carries a __SW_VERSION__ placeholder; new
      scripts/stamp-sw-version.mjs (wired into the npm build chain before the
      sitemap step) replaces it with the deploy commit sha (VERCEL_GIT_COMMIT_SHA)
      or a local build timestamp. Every deploy publishes fresh cache names, so
      the browser's byte-compare triggers the SW update and the existing
      activation cleanup deletes the old-version caches — no manual bumping.
      Unstamped file (raw dev serve) falls back to a 'dev' version safely.

## PHASE 7 — Documentation honesty

- [x] DONE (2026-09-20): README rewritten to match reality — the blanket
      "no mock integrations" claim replaced with a precise honesty statement,
      plus an explicit "Honest limitations" section (GDPR store in-memory,
      module registry server-local, payments live-E2E unverified, M-01/M-02)
      and an "Environment contract" section (all keys env-only, no code
      fallbacks, site_settings never stores keys, schema.sql scrub block).
      AGENTS.md rule 1 now names the two legacy in-memory stores instead of
      implying everything is persisted.

## Known findings intentionally deferred (from the forensic audit)

- M-01: rate limiter trusts spoofable `x-forwarded-for` (needs a durable store first).
- M-02: CSP still allows `unsafe-inline`/`unsafe-eval`; CORS defaults to an AI Studio
  dev origin (needs an ad-network/script-inventory decision before tightening).
- H-09: subscriptions/payments must never be serialized into public GET /api/state —
  currently empty only because RLS blocks anon reads; enforce explicitly in Phase 3.
