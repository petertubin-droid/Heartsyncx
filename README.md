# HeartSync

**Mindful insights for connected hearts.** A premium relationship, emotional-wellness, and dating-advice publishing platform: an editorial front end for readers, a full admin console for the team, and an Express API that serves both.

> Honest platform, honest software. Features either work against real services or clearly report that they are not configured yet. Where a subsystem is intentionally still in-memory or simulated while we finish persisting it, we say so below  - in this codebase, honesty means matching the docs to reality, not claiming perfection.

## Features

**Reader experience**
- Multi-niche article library (love & relationships, dating & romance, communication, breakups, self-love & growth) with categories, authors, related posts, and reactions
- Interactive in-article quizzes generated and scored by Gemini
- AI article generation, translation, and smart content inserts (Gemini)
- High-quality text-to-speech narration (ElevenLabs)
- Newsletter subscription with Resend delivery
- Offline reading via service worker (pre-cached app shell, stale-while-revalidate articles, bookmarked guides)
- GDPR tooling: full data export, account purge, and an append-only audit log
- Localization (English, Spanish, French, German), consent-aware ad slots (AdSense / Monetag / Adsterra), dynamic sitemap + RSS

**Premium & payments**
- Subscription plans with real Stripe Checkout (recurring) and Paystack (period charge) checkout
- Webhooks re-verified against the gateway API before any subscription or payment row is written
- Premium articles and premium categories with ad-unlock or subscription access rules

**Admin console**
- Supabase email/password sign-in; server-side JWT + `profiles.role` verification on every admin API call
- Full CMS: articles, categories, authors, pages, media, menus, site settings, branding, and homepage layout builder
- Newsletter campaign management, comment moderation, feature toggles, quiz manager, monetization settings
- Honest operations panels: integrations show their real configuration state; nothing is reported as "live" unless it is

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express (single server: REST API + static SPA hosting) |
| Database | Supabase (Postgres with row-level security), optional Cloud SQL pools |
| Auth | Supabase Auth (readers + admin), JWT-verified admin middleware |
| AI | Google Gemini (generation, translation, inserts), ElevenLabs (TTS) |
| Payments | Stripe Checkout, Paystack |
| Email | Resend |
| Ads | Google AdSense, Monetag, Adsterra |

## Getting started

```bash
npm install
cp .env.example .env   # fill in the variables below
npm run dev            # Express dev server
```

### Environment variables

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Client-side Supabase connection |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Server-side Supabase connection |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only: records verified paid subscriptions (webhooks). Never expose to the client |
| `GEMINI_API_KEY` | Article generation, translation, inserts, quiz scoring |
| `ELEVENLABS_API_KEY` | Article narration |
| `RESEND_API_KEY` | Newsletter and transactional email |
| `STRIPE_SECRET_KEY` | Stripe Checkout sessions + webhook verification |
| `PAYSTACK_SECRET_KEY` | Paystack transactions + webhook verification |
| `SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD`, `SQL_ADMIN_USER`, `SQL_ADMIN_PASSWORD` | Optional Cloud SQL pools |
| `VITE_ADSENSE_PUBLISHER_ID`, `VITE_SLOT_*` | AdSense slots |
| `PORT` | Server port (default 3000) |

Every integration degrades honestly: without a key, the related feature reports "not configured" instead of simulating success.

## Build & deploy

```bash
npm run build   # vite build (SPA) + esbuild server bundle -> dist/
npm start       # node dist/server.cjs  - serves the API and the SPA on one origin
```

The platform is designed as a **single-origin deployment**: one Express process serves both `dist/` static files and the `/api/*` routes. On Vercel, pair the static frontend with a hosted instance of `dist/server.cjs` (or rewrites that proxy `/api/*` to it)  - a static-only Vercel deploy cannot serve the API.

First-run setup: visit `/admin` and complete the first-admin registration wizard (`/api/setup/register` creates the initial administrator; further sign-ins use Supabase email/password).

## Database

- `supabase/schema.sql` is the canonical schema (RLS enabled on every public table, admin-gated write policies via `is_admin()`, public inserts limited to comments/subscribers/contact messages).
- Apply it to your Supabase project before first launch. There is no in-repo migration runner; treat the file as the source of truth and re-verify live schema state before assuming.

## Project structure

```
├── server.ts              # Express API: 70+ routes (auth, content, AI, payments, webhooks, GDPR)
├── src/
│   ├── App.tsx            # Reader SPA (sections, routing, tabs)
│   ├── store.ts           # Client state store + Supabase sync
│   ├── components/        # Reader UI + AdminConsole, AdminLogin, chat, editor
│   └── utils/             # i18n, offline cache, ads, helpers
├── supabase/schema.sql    # Canonical database schema
└── .github/workflows/     # CI: type-check + production build
```

## Security notes

- Admin routes require a valid Supabase session JWT **and** an admin role in `profiles`  - verified server-side on every request.
- Payment records are written only by gateway-verified webhooks, never by client calls.
- The service-role key belongs in server environment variables only. `site_settings` is readable by the public API, so it must never carry privileged keys.

## Honest limitations (known, tracked, not hidden)

These are real gaps still open on the roadmap (`MUST_FIX.md`), not surprises:

- **GDPR audit log & DSR request store are in-memory** server arrays. They work
  per-process, but a server restart clears them, and they are not yet persisted
  to Supabase. GDPR export/purge endpoints record against this volatile store.
- **Module "install"/toggle is a server-local registry.** The admin module
  system registers state in memory; it does not apply real database migrations.
- **Payments live-mode E2E is unverified.** Gateway webhooks are verified and
  orders use signed download tokens in tests, but no live purchase test
  webhook has been replayed against production.
- The rate limiter trusts `x-forwarded-for` and is per-process (M-01), and the
  CSP still requires `unsafe-inline`/`unsafe-eval` pending an ad-network
  script-inventory decision (M-02).

## Environment contract (secrets)

All credentials are **environment-only**. There are no key fallbacks in code,
and `site_settings` (served publicly by `/api/state`) never stores keys:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`  - client + server connection
  (server may also use `SUPABASE_URL` / `SUPABASE_ANON_KEY`).
- `SUPABASE_SERVICE_ROLE_KEY`  - server-only, privileged writes (payments, admin
  promotion). Never exposed to any client path.
- `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, ad-network secrets, payment gateway
  secrets  - server environment only.
- Historical keys found in `site_settings` are scrubbed by a SQL cleanup block
  in `supabase/schema.sql`; the admin UI stores only non-secret configuration.

## License

Proprietary  - © HeartSync. All rights reserved.
