# Admin Connection Verification Report

An audit of all active administrative functions in `AdminConsole.tsx` was carried out to guarantee every single controller links back to the central secure database (Firestore and Supabase caches).

## Audited Controls & Outcomes

### 1. General Settings, Title & Taglines
- **Action:** Modifying brand title, descriptions, and CTA labels.
- **Connection:** Proxied immediately to `HeartsyncStore` state. Calls `/api/state` POST during any field change blur or form save.
- **Verification:** Refreshing the browser or loading on another device pulls setting objects from the persistent server disk and Firestore first.

### 2. Article & Publications Manager
- **Action:** Drafting, tagging, editing, or deleting therapeutic relationship columns.
- **Connection:** Triggers direct inserts and updates to the `posts` collection on Supabase/Firestore which in turn updates the blog home grid.
- **Verification:** All listing arrays are dynamically fetched on reload.

### 3. Google AdSense Placements
- **Action:** Altering ca-pub IDs and placement checkboxes.
- **Connection:** Leverages proxied `pn_` settings, fully persisted to the database. Includes synchronous round-trip write/fetch checks on save.
- **Verification:** Ad codes are active on live layouts only if saved and verified in the database.

### 4. Newsletter Broadcast Engine
- **Action:** Crafting email template markup or sending a dynamic broadcast.
- **Connection:** Contacts the server-side `/api/newsletter/send` Resend API, which performs cryptographic verification.
- **Verification:** Unconfigured variables show active setup suggestions.
