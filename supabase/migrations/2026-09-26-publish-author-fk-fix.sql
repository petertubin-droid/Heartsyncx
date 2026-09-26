-- ============================================================================
-- PUBLISHING FIX (2026-09-26): posts.author_id foreign key repair
-- Incident: "insert or update on table posts violates foreign key constraint"
-- on every article publish.
--
-- Cause: the app hashed non-UUID author ids into FAKE UUIDs before insert
-- (a deterministic FNV hash), but public.posts.author_id is a TEXT foreign
-- key -> public.authors(id). A hashed id can never match a row, so every
-- publish was rejected. Compounding it, the author CRUD wrote author rows
-- to public.profiles (a DIFFERENT table whose id is a UUID FK to
-- auth.users), so author rows never landed in public.authors at all.
--
-- Fix: ids are now passed through as plain text, author CRUD writes to
-- public.authors, and the publish API provisions any missing author row
-- before insert. This migration makes the live database consistent.
-- ============================================================================

-- 1. Guarantee the authors catalog table exists with the expected shape.
CREATE TABLE IF NOT EXISTS public.authors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  bio TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'Author',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Ensure the posts -> authors foreign key exists (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'posts_author_id_fkey'
      AND conrelid = 'public.posts'::regclass
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES public.authors(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Seed the default author (the post editor's built-in fallback) so a
--    fresh install can publish without any author bookkeeping first.
INSERT INTO public.authors (id, name, email, bio, role, is_active)
VALUES (
  'peter-tubin',
  'Peter Tubin',
  'peter-tubin@heartsync.com',
  'Founder and lead writer at Heartsync.',
  'Author',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 4. Repair legacy rows: null out any post author_id that points at nothing
--    (hashed fake UUIDs, old profile UUIDs, deleted author rows) so the FK
--    is satisfied and updates/publishes go through. posts.author_id is
--    nullable by design (ON DELETE SET NULL).
UPDATE public.posts
SET author_id = NULL
WHERE author_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.authors a WHERE a.id = public.posts.author_id
  );

-- 5. Admin write access on the authors catalog (client-side author CRUD
--    and server-side provisioning both rely on admin policies; the
--    blanket "Admin full access" loop covers this, but repeat explicitly
--    in case the live DB predates it).
DROP POLICY IF EXISTS "Admin manage authors" ON public.authors;
CREATE POLICY "Admin manage authors" ON public.authors
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
