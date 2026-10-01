import { Post, Category } from '../../types';
import { NEW_CATEGORIES } from '../../lib/categoryMigration';
import { HEARTSYNC_ARTICLES } from './articles/index';

export const MORE_CATEGORIES: Category[] = NEW_CATEGORIES.map(c => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  description: c.description,
  color: c.color,
  icon: c.icon,
  featured_image: c.featured_image,
  seo_title: c.seo_title,
  seo_description: c.seo_description,
  seo_keywords: c.seo_keywords
}));

export const MORE_POSTS: Post[] = [
  // PERF (2026-09-24): seed article BODIES are stripped from the client
  // bundle. The DB is the source of truth and every article body is fetched
  // on demand via GET /api/posts/:slug (and cached by the Service Worker),
  // so the 30 seed bodies shipping to every visitor on every page were ~350KB
  // of dead weight. Metadata (title/slug/excerpt/category) is kept so the
  // boot state still renders the full library instantly.
  ...HEARTSYNC_ARTICLES.map((a) => {
    const { content: _content, ...meta } = a as any;
    return { ...meta, content: '' } as Post; // '' is falsy: page fetches body on demand
  }),

  {
    id: 'post-1',
    title: 'The Art of Mindful Love: Cultivating Lasting Intimacy in Modern Relationships',
    slug: 'art-of-mindful-love-cultivating-lasting-intimacy',
    excerpt: 'True intimacy is not a static destination, but a ongoing practice of presence, emotional attunement, and gentle curiosity between two evolving partners.',
        in_article_inserts: {
      insight: { id: 'insight', title: 'Key Insight', enabled: true, placementPercent: 12, content: "\"To be loved is to be seen. To be mindfully loved is to feel that your internal world matters deeply to the person sitting across from you.\"" },
      reflection: { id: 'reflection', title: 'Pause & Reflect', enabled: true, placementPercent: 50, content: "Where does the pattern in \"The Art of Mindful Love: Cultivating Lasting Intimacy in Modern Relationships\" show up in your own relationship this week? Name one concrete moment, either out loud or on paper." },
      tip: { id: 'tip', title: 'Practice Tip', enabled: true, placementPercent: 75, content: "What am I feeling right now in my body?" }
    },

    content: '', // PERF: body fetched on demand from GET /api/posts/:slug
    status: 'published',
    publish_date: new Date().toISOString(),
    featured_image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=1200',
    read_time: 6,
    category_id: 'cat-relationships',
    author_id: '',
    tags: ['Love', 'Intimacy', 'Mindfulness', 'Relationships'],
    likes: 0,
    reactions: { love: 0, insightful: 0, support: 0, warmth: 0 },
    views: 0,
    seo_title: 'The Art of Mindful Love: Cultivating Lasting Intimacy',
    seo_description: 'Discover how mindful presence, empathetic communication, and conscious repair build enduring intimacy in modern relationships.',
    keywords: ['mindful love', 'relationship intimacy', 'emotional presence', 'relationship advice'],
    allow_comments: true
  },
  {
    id: 'post-2',
    title: 'Navigating Modern Dating: How to Move from Chemistry to Compatible Connection',
    slug: 'navigating-modern-dating-chemistry-to-compatibility',
    excerpt: 'While initial spark and electric chemistry can feel intoxicating, long-term romantic fulfillment depends on underlying values alignment and mutual emotional maturity.',
        in_article_inserts: {
      insight: { id: 'insight', title: 'Key Insight', enabled: true, placementPercent: 12, content: "Modern dating apps and speed-of-light romantic options have made it easier than ever to meet new people. Yet, many singles find themselves stuck in a frustrating loop of rapid excitement followed by abrupt disappointment." },
      reflection: { id: 'reflection', title: 'Pause & Reflect', enabled: true, placementPercent: 50, content: "Where does the pattern in \"Navigating Modern Dating: How to Move from Chemistry to Compatible Connection\" show up in your own relationship this week? Name one concrete moment, either out loud or on paper." }
    },

    content: '', // PERF: body fetched on demand from GET /api/posts/:slug
    status: 'published',
    publish_date: new Date().toISOString(),
    featured_image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200',
    read_time: 5,
    category_id: 'cat-dating',
    author_id: '',
    tags: ['Dating', 'Romance', 'Compatibility', 'Single Life'],
    likes: 0,
    reactions: { love: 0, insightful: 0, support: 0, warmth: 0 },
    views: 0,
    seo_title: 'Navigating Modern Dating: Chemistry vs Compatibility',
    seo_description: 'Learn how to differentiate romantic chemistry from true compatibility to build healthy, lasting dating relationships.',
    keywords: ['dating advice', 'chemistry vs compatibility', 'modern dating', 'finding love'],
    allow_comments: true
  },
  {
    id: 'post-3',
    title: 'Breaking the Silence: How Active Listening & Emotional Vulnerability Transform Partnerships',
    slug: 'breaking-silence-active-listening-emotional-vulnerability',
    excerpt: 'Effective communication in relationships goes far beyond speaking clearly - it requires creating a safe, non-judgmental space where both partners feel truly heard.',
        in_article_inserts: {
      insight: { id: 'insight', title: 'Key Insight', enabled: true, placementPercent: 12, content: "Most relationship disputes are rarely about the superficial topic on the surface - whether that is unwashed dishes, busy schedules, or weekend plans. At their core, most conflicts center around deeper underlying emotional questions: *\"Do you see me? Do my feelings matter to you? Am I safe with you?\"*" },
      reflection: { id: 'reflection', title: 'Pause & Reflect', enabled: true, placementPercent: 50, content: "Where does the pattern in \"Breaking the Silence: How Active Listening & Emotional Vulnerability Transform Partnerships\" show up in your own relationship this week? Name one concrete moment, either out loud or on paper." },
      tip: { id: 'tip', title: 'Practice Tip', enabled: true, placementPercent: 75, content: "You slow down the dialogue." }
    },

    content: '', // PERF: body fetched on demand from GET /api/posts/:slug
    status: 'published',
    publish_date: new Date().toISOString(),
    featured_image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200',
    read_time: 7,
    category_id: 'cat-communication',
    author_id: '',
    tags: ['Communication', 'Active Listening', 'Vulnerability', 'Relationships'],
    likes: 0,
    reactions: { love: 0, insightful: 0, support: 0, warmth: 0 },
    views: 0,
    seo_title: 'Active Listening & Emotional Vulnerability in Partnerships',
    seo_description: 'Discover how active listening techniques and authentic emotional vulnerability strengthen connection and resolve conflict.',
    keywords: ['relationship communication', 'active listening', 'vulnerability', 'conflict resolution'],
    allow_comments: true
  },
  {
    id: 'post-4',
    title: 'Healing After Heartbreak: Rebuilding Trust, Boundaries, and Emotional Clarity',
    slug: 'healing-after-heartbreak-rebuilding-trust-boundaries',
    excerpt: 'The end of a relationship can feel like an emotional earthquake, but with self-compassion and intentional boundary setting, it becomes a powerful doorway to self-discovery.',
        in_article_inserts: {
      insight: { id: 'insight', title: 'Key Insight', enabled: true, placementPercent: 12, content: "Heartbreak is one of the most intense emotional experiences a human can navigate. Whether a breakup was long in the making or unexpected, the loss of a shared future alters your daily rhythms, sense of identity, and emotional landscape." },
      reflection: { id: 'reflection', title: 'Pause & Reflect', enabled: true, placementPercent: 50, content: "Where does the pattern in \"Healing After Heartbreak: Rebuilding Trust, Boundaries, and Emotional Clarity\" show up in your own relationship this week? Name one concrete moment, either out loud or on paper." },
      tip: { id: 'tip', title: 'Practice Tip', enabled: true, placementPercent: 75, content: "Reconnect with Old Passions: Revisit hobbies, creative projects, or interests you may have put aside." }
    },

    content: '', // PERF: body fetched on demand from GET /api/posts/:slug
    status: 'published',
    publish_date: new Date().toISOString(),
    featured_image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=1200',
    read_time: 6,
    category_id: 'cat-breakups-healing',
    author_id: '',
    tags: ['Breakups', 'Heartbreak', 'Healing', 'Self Care'],
    likes: 0,
    reactions: { love: 0, insightful: 0, support: 0, warmth: 0 },
    views: 0,
    seo_title: 'Healing After Heartbreak: Rebuilding Boundaries & Clarity',
    seo_description: 'Empathetic guidance on processing breakup grief, establishing healthy boundaries, and regaining personal strength.',
    keywords: ['breakup healing', 'recovering from heartbreak', 'emotional boundaries', 'moving on'],
    allow_comments: true
  },
  {
    id: 'post-5',
    title: 'Self-Love as the Foundation: Unlocking Healthy Attachment and Personal Fulfillment',
    slug: 'self-love-foundation-healthy-attachment-personal-fulfillment',
    excerpt: 'The quality of your relationship with yourself sets the blueprint for every relationship you build with others. Discover how self-compassion transforms attachment patterns.',
        in_article_inserts: {
      insight: { id: 'insight', title: 'Key Insight', enabled: true, placementPercent: 12, content: "We often look outward for validation, comfort, and security, placing the weight of our emotional stability onto romantic partners. However, true security begins within." },
      reflection: { id: 'reflection', title: 'Pause & Reflect', enabled: true, placementPercent: 50, content: "Where does the pattern in \"Self-Love as the Foundation: Unlocking Healthy Attachment and Personal Fulfillment\" show up in your own relationship this week? Name one concrete moment, either out loud or on paper." }
    },

    content: '', // PERF: body fetched on demand from GET /api/posts/:slug
    status: 'published',
    publish_date: new Date().toISOString(),
    featured_image: 'https://images.unsplash.com/photo-1499209974431-9dac3ada00d7?auto=format&fit=crop&q=80&w=1200',
    read_time: 5,
    category_id: 'cat-self-love-growth',
    author_id: '',
    tags: ['Self Love', 'Personal Growth', 'Attachment Styles', 'Mental Wellness'],
    likes: 0,
    reactions: { love: 0, insightful: 0, support: 0, warmth: 0 },
    views: 0,
    seo_title: 'Self-Love as the Foundation for Healthy Attachment',
    seo_description: 'Explore how self-compassion and inner security build healthy relationship attachment styles and personal fulfillment.',
    keywords: ['self love', 'personal growth', 'attachment styles', 'self compassion'],
    allow_comments: true
  }
];
