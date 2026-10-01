/**
 * Category taxonomy migration (October 2026) - regression tests.
 *
 * Covers the three layers that must stay in sync:
 *  1. NEW_CATEGORIES - exactly the ten categories the owner specified
 *  2. mapCategoryIdToNew - legacy ids + content keywords -> new taxonomy
 *  3. migrateCategoriesDb - idempotent read-first DB reshuffle
 */
import { describe, it, expect, vi } from 'vitest';
import {
  NEW_CATEGORIES,
  NEW_CATEGORY_IDS,
  mapCategoryIdToNew,
  migrateCategoriesDb
} from '../../lib/categoryMigration';

const EXPECTED_NAMES = [
  'Dating',
  'Relationships',
  'Love & Emotions',
  'Situationships',
  'Breakups & Healing',
  'Communication',
  'Red Flags',
  'Self Love & Growth',
  'Marriage & Long Term Love',
  'Questions & Advice'
];

const seedLivePosts = [
  { id: 'p1', title: "Situationships Are Not Confusing. They Are Often Comfortable for One Person.", tags: [], category_id: 'cat-love-relationships' },
  { id: 'p2', title: 'Love Bombing: The Seduction of Too Much, Too Soon', tags: ['Red Flags', 'Toxic Patterns'], category_id: 'cat-dating-romance' },
  { id: 'p3', title: 'Slow Dating: The Case for Pacing Intimacy on Purpose', tags: ['Slow Dating'], category_id: 'cat-dating-romance' },
  { id: 'p4', title: 'The No-Contact Month: What Actually Happens, Week by Week', tags: ['Breakups', 'No Contact'], category_id: 'cat-problems-breakups' },
  { id: 'p5', title: "On-Again, Off-Again: The Anatomy of a Cyclical Relationship", tags: ['Cyclical Relationships'], category_id: 'cat-problems-breakups' },
  { id: 'p6', title: 'The Anatomy of a Real Apology (and the Counterfeits That Pass for One)', tags: ['Communication'], category_id: 'cat-comm-connection' },
  { id: 'p7', title: 'The Roommate Drift: How Partners Become Housemates (and the Road Back)', tags: ['Long-Term Love'], category_id: 'cat-love-relationships' },
  { id: 'p8', title: "You're Not Asking for Too Much. You're Asking the Wrong Person.", tags: [], category_id: 'cat-1' },
  { id: 'p9', title: 'Somatic Grounding: Moving Relational Clashes from Mind to Body', tags: ['somatic-healing'], category_id: 'cat-5' },
  { id: 'p10', title: 'Digital Boundaries: Crafting a Sound Communication Rhythm in Early Dating', tags: ['mindful-dating'], category_id: 'cat-3' },
  { id: 'p11', title: 'Boundaries Without Guilt: The Maintenance Guide Most People Never Got', tags: ['Boundaries'], category_id: 'cat-selflove-growth' },
  { id: 'p12', title: "Gottman's Four Horsemen: Reversing Intimacy Erosion in Couples", tags: ['gottman-method'], category_id: 'cat-2' },
  { id: 'p13', title: 'Green Flags: The Unglamorous Signs Someone Is Actually Safe', tags: ['Green Flags'], category_id: 'cat-dating-romance' },
  { id: 'p14', title: "They Like You, But They Still Can't Love You Properly", tags: [], category_id: 'cat-love-relationships' },
  { id: 'p15', title: 'Healing Core Wounds: Taming the Voice of Relational Unworthiness', tags: ['self-acceptance'], category_id: 'cat-8' }
];

describe('NEW_CATEGORIES', () => {
  it('contains exactly the ten owner-specified categories, in order', () => {
    expect(NEW_CATEGORIES.map(c => c.name)).toEqual(EXPECTED_NAMES);
  });

  it('has unique ids and slugs', () => {
    const ids = NEW_CATEGORIES.map(c => c.id);
    const slugs = NEW_CATEGORIES.map(c => c.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every category is fully populated for rendering + SEO', () => {
    for (const c of NEW_CATEGORIES) {
      expect(c.description.length).toBeGreaterThan(20);
      expect(c.seo_title.length).toBeGreaterThan(10);
      expect(c.seo_description.length).toBeGreaterThan(20);
      expect(c.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(c.featured_image).toMatch(/^https:\/\//);
      expect(c.seo_keywords.length).toBeGreaterThan(2);
    }
  });
});

describe('mapCategoryIdToNew', () => {
  it('passes through current taxonomy ids unchanged', () => {
    for (const id of NEW_CATEGORY_IDS) {
      expect(mapCategoryIdToNew(id)).toBe(id);
    }
  });

  it('maps every legacy id the database has ever held into the new taxonomy', () => {
    const legacyIds = [
      'cat-love-relationships', 'cat-dating-romance', 'cat-comm-connection',
      'cat-problems-breakups', 'cat-selflove-growth',
      'cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5', 'cat-6', 'cat-7', 'cat-8',
      'cat-relationship', 'cat-redflags', 'cat-breakups', 'cat-intimacy',
      'cat-growth', 'cat-family', 'cat-psychology',
      'relationship-advice', 'love-relationships', 'dating-tips'
    ];
    for (const id of legacyIds) {
      expect(NEW_CATEGORY_IDS.has(mapCategoryIdToNew(id))).toBe(true);
    }
  });

  it('reshuffles content by title/tags into the owner taxonomy', () => {
    const expectMap: Record<string, string> = {
      p1: 'cat-situationships',      // explicit situationship post
      p2: 'cat-red-flags',          // love bombing
      p3: 'cat-dating',             // slow dating
      p4: 'cat-breakups-healing',   // no-contact
      p5: 'cat-situationships',     // on-again off-again
      p6: 'cat-communication',      // apology
      p7: 'cat-marriage',           // roommate drift -> long term love
      p8: 'cat-questions-advice',   // advice column voice
      p9: 'cat-love-emotions',      // somatic regulation
      p10: 'cat-dating',            // early-dating boundaries stay in Dating
      p11: 'cat-self-love-growth',  // boundaries
      p12: 'cat-communication',    // four horsemen / gottman
      p13: 'cat-dating',            // green flags are dating vetting
      p14: 'cat-questions-advice',  // advice column voice
      p15: 'cat-self-love-growth'   // inner work
    };
    for (const post of seedLivePosts) {
      expect(mapCategoryIdToNew(post.category_id, post.title, post.tags)).toBe(expectMap[post.id]);
    }
  });

  it('never returns a legacy or unknown id', () => {
    expect(mapCategoryIdToNew('cat-1', 'Emotional Wellness', [])).not.toBe('cat-1');
    expect(mapCategoryIdToNew('totally-unknown-id', 'Whatever', [])).toBe('cat-relationships');
    expect(mapCategoryIdToNew('')).toBe('cat-relationships');
  });
});

describe('migrateCategoriesDb', () => {
  function makeFakeDb(posts: any[], categories: any[], shouldWrite = true) {
    const updates: any[] = [];
    const upserts: any[] = [];
    const deletes: any[] = [];
    const db = {
      from(table: string) {
        return {
          select: vi.fn(async () => ({ data: table === 'posts' ? posts : categories, error: null })),
          upsert: vi.fn(async (row: any) => {
            if (!shouldWrite) return { data: null, error: { message: 'upsert denied' } };
            upserts.push(row);
            return { data: null, error: null };
          }),
          update: vi.fn((patch: any) => ({
            eq: vi.fn(async (_col: string, val: any) => {
              updates.push({ ...patch, id: val });
              return { data: null, error: null };
            })
          })),
          delete: vi.fn(() => ({
            in: vi.fn(async (_col: string, ids: string[]) => {
              deletes.push(...ids);
              return { data: null, error: null };
            })
          }))
        };
      }
    };
    return { db, updates, upserts, deletes };
  }

  it('reassigns legacy posts, keeps clean posts, deletes legacy categories, upserts all ten', async () => {
    const { db, updates, deletes, upserts } = makeFakeDb(
      [
        { id: 'legacy-post', title: 'Slow Dating', tags: [], category_id: 'cat-dating-romance' },
        { id: 'clean-post', title: 'An Apology', tags: [], category_id: 'cat-communication' }
      ],
      [
        { id: 'cat-dating-romance' },
        { id: 'cat-communication' }
      ]
    );
    const result = await migrateCategoriesDb(db as any);
    expect(result.categoriesUpserted).toBe(10);
    expect(result.postsReassigned).toBe(1);
    expect(updates[0]).toEqual({ id: 'legacy-post', category_id: 'cat-dating' });
    expect(result.legacyCategoriesDeleted).toBe(1);
    expect(deletes).toEqual(['cat-dating-romance']);
  });

  it('is a no-op write when the DB already matches the new taxonomy', async () => {
    const { db, updates, deletes } = makeFakeDb(
      [{ id: 'p', title: 'Slow Dating', tags: [], category_id: 'cat-dating' }],
      NEW_CATEGORIES.map(c => ({ id: c.id }))
    );
    const result = await migrateCategoriesDb(db as any);
    expect(result.postsReassigned).toBe(0);
    expect(result.legacyCategoriesDeleted).toBe(0);
    expect(updates).toEqual([]);
    expect(deletes).toEqual([]);
  });

  it('surfaces write errors instead of failing silently', async () => {
    const { db } = makeFakeDb([{ id: 'p', title: 'Slow Dating', tags: [], category_id: 'cat-dating-romance' }], [], false);
    await expect(migrateCategoriesDb(db as any)).rejects.toThrow(/upsert denied/);
  });
});
