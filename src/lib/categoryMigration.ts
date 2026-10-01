/**
 * categoryMigration - single source of truth for the HeartSync category
 * taxonomy (October 2026 relaunch) and the one-time reshuffle of all
 * historical content into it.
 *
 * Used by BOTH the client (src/store.ts renders any legacy category id
 * through mapCategoryIdToNew) and the server (server.ts runs
 * migrateCategoriesDb once on boot to rewrite the Supabase tables).
 * Keep this module dependency-free so it can load in both runtimes.
 */

export interface CategoryDef {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  featured_image: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
}

/** The ten live categories (2026 taxonomy). */
export const NEW_CATEGORIES: CategoryDef[] = [
  {
    id: 'cat-dating',
    name: 'Dating',
    slug: 'dating',
    description: 'First dates, modern courtship, online dating, and finding someone worth your time.',
    color: '#EC4899',
    icon: 'Flame',
    featured_image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200',
    seo_title: 'Dating Advice - Modern Courtship, First Dates & Intentional Romance',
    seo_description: 'Practical, honest guidance for dating today: first dates, apps, pacing, chemistry, and choosing well.',
    seo_keywords: ['dating', 'first dates', 'online dating', 'romance', 'singles']
  },
  {
    id: 'cat-relationships',
    name: 'Relationships',
    slug: 'relationships',
    description: 'Building healthy partnerships: trust, attachment, fairness, and everyday love.',
    color: '#F43F5E',
    icon: 'Heart',
    featured_image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=1200',
    seo_title: 'Relationships - Expert Guidance for Healthy Partnerships',
    seo_description: 'Research-backed insight on trust, attachment styles, fairness, and what keeps couples strong.',
    seo_keywords: ['relationships', 'partnership', 'trust', 'attachment', 'couples']
  },
  {
    id: 'cat-love-emotions',
    name: 'Love & Emotions',
    slug: 'love-emotions',
    description: 'The inner life of love: feelings, attachment, desire, vulnerability, and emotional regulation.',
    color: '#8B5CF6',
    icon: 'Sparkles',
    featured_image: 'https://images.unsplash.com/photo-1499209974431-9dac3ada00d7?auto=format&fit=crop&q=80&w=1200',
    seo_title: 'Love & Emotions - Feeling, Attachment and the Heart\'s Inner World',
    seo_description: 'Understand the emotional side of love: attachment, vulnerability, anxiety, chemistry, and regulation.',
    seo_keywords: ['love', 'emotions', 'attachment', 'vulnerability', 'emotional wellness']
  },
  {
    id: 'cat-situationships',
    name: 'Situationships',
    slug: 'situationships',
    description: 'The undefined middle ground: talking stages, mixed signals, on-off cycles, and clarity.',
    color: '#6366F1',
    icon: 'HelpCircle',
    featured_image: 'https://images.unsplash.com/photo-1522669070992-467f5952ecb8?auto=format&fit=crop&q=80&w=1200',
    seo_title: 'Situationships - Navigating the Undefined Relationship',
    seo_description: 'Straight talk on situationships, talking stages, mixed signals, and cyclical relationships.',
    seo_keywords: ['situationship', 'talking stage', 'mixed signals', 'on again off again']
  },
  {
    id: 'cat-breakups-healing',
    name: 'Breakups & Healing',
    slug: 'breakups-healing',
    description: 'Heartbreak recovery, no-contact, grief, closure, and rebuilding after a relationship ends.',
    color: '#7C3AED',
    icon: 'HeartCrack',
    featured_image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=1200',
    seo_title: 'Breakups & Healing - Recovering From Heartbreak',
    seo_description: 'Compassionate, practical support for breakups, no-contact, grief, and emotional recovery.',
    seo_keywords: ['breakups', 'heartbreak', 'no contact', 'healing', 'grief', 'moving on']
  },
  {
    id: 'cat-communication',
    name: 'Communication',
    slug: 'communication',
    description: 'Talking, listening, fighting fair, repairing, and being truly heard.',
    color: '#3B82F6',
    icon: 'MessageSquare',
    featured_image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200',
    seo_title: 'Communication - Speak So Your Partner Can Hear You',
    seo_description: 'Tools for healthy dialogue: active listening, conflict repair, apologies, and everyday connection.',
    seo_keywords: ['communication', 'listening', 'conflict resolution', 'apology', 'couples skills']
  },
  {
    id: 'cat-red-flags',
    name: 'Red Flags',
    slug: 'red-flags',
    description: 'Warning signs, manipulation, love bombing, toxicity, and knowing when to walk away.',
    color: '#EF4444',
    icon: 'ShieldAlert',
    featured_image: 'https://images.unsplash.com/photo-1499209974431-9dacce0100d7?auto=format&fit=crop&q=80&w=1200',
    seo_title: 'Red Flags - Recognizing Unhealthy Relationship Patterns',
    seo_description: 'Learn to spot manipulation, love bombing, inconsistency, and toxic dynamics before they cost you.',
    seo_keywords: ['red flags', 'toxic relationships', 'manipulation', 'love bombing', 'warning signs']
  },
  {
    id: 'cat-self-love-growth',
    name: 'Self Love & Growth',
    slug: 'self-love-growth',
    description: 'Boundaries, self-worth, inner work, and becoming someone who chooses well.',
    color: '#059669',
    icon: 'TrendingUp',
    featured_image: 'https://images.unsplash.com/photo-1499209974431-9dac3ada00d7?auto=format&fit=crop&q=80&w=1200',
    seo_title: 'Self Love & Growth - Becoming Your Own Safe Place',
    seo_description: 'Build self-worth, set boundaries without guilt, and grow into secure, self-led love.',
    seo_keywords: ['self love', 'boundaries', 'self-worth', 'personal growth', 'inner work']
  },
  {
    id: 'cat-marriage',
    name: 'Marriage & Long Term Love',
    slug: 'marriage-long-term-love',
    description: 'Keeping long-term love alive: marriage, commitment, mental load, rituals, and the long haul.',
    color: '#06B6D4',
    icon: 'ShieldCheck',
    featured_image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200',
    seo_title: 'Marriage & Long Term Love - Making Commitment Last',
    seo_description: 'Honest guidance for marriage and long-term partnership: commitment, fairness, rituals, and staying close.',
    seo_keywords: ['marriage', 'long term love', 'commitment', 'mental load', 'long distance']
  },
  {
    id: 'cat-questions-advice',
    name: 'Questions & Advice',
    slug: 'questions-advice',
    description: 'Reader questions answered: real situations, straight answers, no hedging.',
    color: '#F59E0B',
    icon: 'MessagesSquare',
    featured_image: 'https://images.unsplash.com/photo-1516387938699-a93567ec168e?auto=format&fit=crop&q=80&w=1200',
    seo_title: 'Questions & Advice - Real Relationship Situations, Answered',
    seo_description: 'Direct answers to real relationship questions: what to do, what it means, and when to leave.',
    seo_keywords: ['relationship advice', 'questions', 'answers', 'advice column']
  }
];

export const NEW_CATEGORY_IDS = new Set(NEW_CATEGORIES.map(c => c.id));

/**
 * Legacy category id -> new category id. This covers every id the database
 * has ever held (the 2025 five-niche seeds, the 2026 admin-created cat-1..8
 * set, and the ten-niche NICHES list from the earlier enforcement pass).
 */
const LEGACY_CATEGORY_BASE: Record<string, string> = {
  // 2025 seed taxonomy
  'cat-love-relationships': 'cat-relationships',
  'cat-dating-romance': 'cat-dating',
  'cat-comm-connection': 'cat-communication',
  'cat-problems-breakups': 'cat-breakups-healing',
  'cat-selflove-growth': 'cat-self-love-growth',
  // 2026 admin-created taxonomy
  'cat-1': 'cat-love-emotions',      // Emotional Wellness
  'cat-2': 'cat-relationships',      // Relationship Science
  'cat-3': 'cat-dating',             // Mindful Dating
  'cat-4': 'cat-self-love-growth',   // Self Growth
  'cat-5': 'cat-love-emotions',      // Somatic Healing
  'cat-6': 'cat-communication',     // Conscious Communication
  'cat-7': 'cat-love-emotions',      // Secure Intimacy
  'cat-8': 'cat-self-love-growth',   // Inner Work
  // earlier ten-niche NICHES taxonomy (also matches slugs without cat-)
  'cat-relationship': 'cat-relationships',
  'relationship-advice': 'cat-relationships',
  'dating-tips': 'cat-dating',
  'red-flags-toxic-relationships': 'cat-red-flags',
  'cat-redflags': 'cat-red-flags',
  'cat-breakups': 'cat-breakups-healing',
  'cat-marriage': 'cat-marriage', // kept name, but slug differs; treat as same
  'marriage-commitment': 'cat-marriage',
  'cat-intimacy': 'cat-love-emotions',
  'intimacy-romance': 'cat-love-emotions',
  'cat-growth': 'cat-self-love-growth',
  'personal-growth': 'cat-self-love-growth',
  'cat-family': 'cat-relationships',
  'family-parenting': 'cat-relationships',
  'cat-psychology': 'cat-love-emotions',
  'love-psychology': 'cat-love-emotions',
  // 2024-era v1 slugs
  'love-relationships': 'cat-relationships',
  'dating-romance': 'cat-dating',
  'communication-emotional-connection': 'cat-communication',
  'relationship-problems-breakups': 'cat-breakups-healing',
  'self-love-personal-growth': 'cat-self-love-growth'
};

/**
 * Title/tag keyword rules, in two tiers:
 *  - STRONG signals always win: the topic is unambiguous from the title/tags
 *    (a breakup post lands in Breakups & Healing regardless of its old bucket).
 *  - WEAK signals are hints: they only apply when the old category id has no
 *    clean legacy mapping, so a dating post tagged 'secure-attachment' stays
 *    in Dating instead of drifting to Love & Emotions.
 */
const STRONG_RULES: { match: RegExp; to: string }[] = [
  { match: /situationship|talking stage|mixed signal|on-again, off-again|on again, off again|cyclical relationship/i, to: 'cat-situationships' },
  { match: /red flag|love bombing|drama triangle|keep you guessing|narciss|manipulat|toxic/i, to: 'cat-red-flags' },
  { match: /breakup|heartbreak|heart break|no.?contact|grieving|moving on|end it well|untangling|moving out/i, to: 'cat-breakups-healing' },
  { match: /long.term love|roommate drift|long.distance|quiet economy|mental load|marriage|anniversar/i, to: 'cat-marriage' },
  { match: /gottman|four horsemen|bids|turn toward|i.?statement|apology|active listening|the fixer|text tone|same fight|emotional flooding|emotional validation|magic ratio/i, to: 'cat-communication' },
  { match: /asking for too much|can.?t love you|like you, but|should i|what to do when|questions? & advice/i, to: 'cat-questions-advice' },
  { match: /digital boundaries|boundar.{0,40}dating|dating.{0,40}boundar/i, to: 'cat-dating' },
  { match: /love languages|neurochem|anxious.?avoidant/i, to: 'cat-love-emotions' }
];

const WEAK_RULES: { match: RegExp; to: string }[] = [
  { match: /boundar|self.love|self.worth|inner critic|inner child|people.pleasing|burnout|solitude|self.abandon|self.trust|earned security|self.sufficient/i, to: 'cat-self-love-growth' },
  { match: /emotional|vulnerab|intimacy|differentiation|co.?regulat|somatic|attachment|anxious|feelings|love/i, to: 'cat-love-emotions' },
  { match: /dating|first date|swipe|slow dating|green flags|spark|compatib|romance|singles/i, to: 'cat-dating' },
  { match: /listen|speak|talk|conflict|fight|repair/i, to: 'cat-communication' }
];

function matchRules(rules: { match: RegExp; to: string }[], t: string, tg: string): string | null {
  for (const rule of rules) {
    if (rule.match.test(t) || rule.match.test(tg)) return rule.to;
  }
  return null;
}

/**
 * Map any historical, deleted, or unaligned category id to the current
 * taxonomy. Content-based keyword rules are consulted first; the legacy
 * base table is the fallback; unknown ids land in Relationships.
 */
export function mapCategoryIdToNew(oldCatId: string, title?: string, tags?: string[]): string {
  const normOld = (oldCatId || '').toLowerCase().trim();
  if (!normOld) return 'cat-relationships';
  if (NEW_CATEGORY_IDS.has(normOld)) return normOld;

  const t = (title || '').toLowerCase();
  const tg = (tags || []).map(x => String(x).toLowerCase()).join(' ');

  // 1. Strong content signals always win
  const strong = (t || tg) ? matchRules(STRONG_RULES, t, tg) : null;
  if (strong) return strong;

  // 2. A clean legacy mapping outranks weak hints
  if (LEGACY_CATEGORY_BASE[normOld]) return LEGACY_CATEGORY_BASE[normOld];

  // 3. Weak hints only for ids with no clean legacy mapping
  const weak = (t || tg) ? matchRules(WEAK_RULES, t, tg) : null;
  if (weak) return weak;

  // Unknown/blank id: fall back to Relationships.
  return 'cat-relationships';
}

/**
 * Server-side one-time reshuffle of the Supabase tables:
 *  1. upsert the ten new categories
 *  2. re-point every post's category_id via mapCategoryIdToNew
 *  3. delete legacy category rows no longer in use
 * Idempotent: runs as a no-op once the DB already matches the new taxonomy.
 * `supabase` is any client with .from() access (server admin client).
 */
export async function migrateCategoriesDb(supabase: any): Promise<{ categoriesUpserted: number; postsReassigned: number; legacyCategoriesDeleted: number }> {
  if (!supabase) return { categoriesUpserted: 0, postsReassigned: 0, legacyCategoriesDeleted: 0 };

  // Read first: compute exactly what needs to change so repeat runs are
  // read-only no-ops (the migration is invoked on every server cold start).
  const { data: posts, error: postsErr } = await supabase
    .from('posts')
    .select('id, title, category_id, tags');
  if (postsErr) throw new Error(`Post fetch failed: ${postsErr.message}`);

  const postUpdates: { id: string; category_id: string }[] = [];
  for (const post of posts || []) {
    const target = mapCategoryIdToNew(post.category_id, post.title, post.tags);
    if (post.category_id !== target) postUpdates.push({ id: post.id, category_id: target });
  }

  // 1. Upsert the new taxonomy (keeps names/SEO/descriptions fresh)
  for (const cat of NEW_CATEGORIES) {
    const { error } = await supabase
      .from('categories')
      .upsert({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        color: cat.color,
        icon: cat.icon,
        featured_image: cat.featured_image,
        seo_title: cat.seo_title,
        seo_description: cat.seo_description,
        seo_keywords: cat.seo_keywords
      }, { onConflict: 'id' });
    if (error) throw new Error(`Category upsert failed for ${cat.name}: ${error.message}`);
  }

  // 2. Reassign posts that still point at legacy categories
  for (const upd of postUpdates) {
    const { error } = await supabase.from('posts').update({ category_id: upd.category_id }).eq('id', upd.id);
    if (error) throw new Error(`Post reassign failed (${upd.id}): ${error.message}`);
  }

  // 3. Delete legacy categories (rows outside the new taxonomy)
  let legacyCategoriesDeleted = 0;
  const { data: cats, error: catsErr } = await supabase.from('categories').select('id');
  if (catsErr) throw new Error(`Category fetch failed: ${catsErr.message}`);
  if (cats && cats.length > 0) {
    const legacyIds = cats.map((c: any) => c.id).filter((id: string) => !NEW_CATEGORY_IDS.has(id));
    if (legacyIds.length > 0) {
      const { error } = await supabase.from('categories').delete().in('id', legacyIds);
      if (error) throw new Error(`Legacy category delete failed: ${error.message}`);
      legacyCategoriesDeleted = legacyIds.length;
    }
  }

  return { categoriesUpserted: NEW_CATEGORIES.length, postsReassigned: postUpdates.length, legacyCategoriesDeleted };
}
