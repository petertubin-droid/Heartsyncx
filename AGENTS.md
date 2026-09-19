# Project Rules & Guidelines

## Permanent Architectural Rules
1. **End-to-End Database & Server Synchronization**: Any new feature added must not only be implemented on the client, but must also be fully connected to the backend server API and persisted in the database (Supabase / Postgres). No local-only mock states or disconnected UI elements.
