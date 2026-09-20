# Project Rules & Guidelines

## Permanent Architectural Rules
1. **End-to-End Database & Server Synchronization**: Any new feature added must not only be implemented on the client, but must also be fully connected to the backend server API and persisted in the database (Supabase / Postgres). No new local-only mock states or disconnected UI elements. (Legacy exception, tracked in MUST_FIX.md: the GDPR audit/DSR store and the admin module registry are still in-memory server arrays; do not add more such gaps, and do not claim they are persisted.)
