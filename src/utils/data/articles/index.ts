import { Post } from '../../../types';
import { LOVE_QUIET_ECONOMICS } from './love-quiet-economics';
import { DATING_FIRST_THREE_DATES } from './dating-first-three-dates';
import { COMM_REPAIR_BEATS_PERFECTION } from './comm-repair-beats-perfection';
import { BREAKUPS_NO_CONTACT_MONTH } from './breakups-no-contact-month';
import { SELFLOVE_SELF_ABANDONMENT } from './selflove-self-abandonment';
import { LOVE_MONEY_FIGHTS } from './love-money-fights';
import { COMM_TURN_TOWARD } from './comm-turn-toward';
import { SELFLOVE_INNER_CRITIC } from './selflove-inner-critic';
import { LOVE_THE_STORY_YOU_TELL } from './love-the-story-you-tell';
import { COMM_THE_SAME_FIGHT_FOREVER } from './comm-the-same-fight-forever';
import { DATING_GREEN_FLAGS } from './dating-green-flags';
import { SELFLOVE_REST_IS_NOT_A_REWARD } from './selflove-rest-is-not-a-reward';

// HeartSync long-form corpus — genuinely written editorial pieces, added over
// time in batches. Word target per article: ~2000 words. Never filler.
export const HEARTSYNC_ARTICLES: Post[] = [
  ...LOVE_QUIET_ECONOMICS,
  ...DATING_FIRST_THREE_DATES,
  ...COMM_REPAIR_BEATS_PERFECTION,
  ...BREAKUPS_NO_CONTACT_MONTH,
  ...SELFLOVE_SELF_ABANDONMENT,
  ...LOVE_MONEY_FIGHTS,
  ...COMM_TURN_TOWARD,
  ...SELFLOVE_INNER_CRITIC,
  ...LOVE_THE_STORY_YOU_TELL,
  ...COMM_THE_SAME_FIGHT_FOREVER,
  ...DATING_GREEN_FLAGS,
  ...SELFLOVE_REST_IS_NOT_A_REWARD
];

// Crawler/sitemap-facing SEO projection of the in-code corpus. Kept lean (no
// article bodies) so the server bundle stays small. Used by server-side meta
// injection and the dynamic sitemap so these articles are fully indexable.
export interface ArticleSeoProjection {
  slug: string;
  title: string;
  excerpt: string;
  publish_date: string;
  featured_image: string;
  read_time: number;
  category_id: string;
  tags: string[];
  seo_title: string;
  seo_description: string;
  keywords: string[];
}

export const HEARTSYNC_ARTICLE_SEO: ArticleSeoProjection[] = HEARTSYNC_ARTICLES.map((p) => ({
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  publish_date: p.publish_date,
  featured_image: p.featured_image || '',
  read_time: p.read_time || 10,
  category_id: p.category_id || '',
  tags: Array.isArray(p.tags) ? [...p.tags] : [],
  seo_title: p.seo_title || p.title,
  seo_description: p.seo_description || p.excerpt,
  keywords: Array.isArray(p.keywords) ? [...p.keywords] : []
}));
