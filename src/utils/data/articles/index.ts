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
import { COMM_LISTEN_DONT_FIX } from './comm-listen-dont-fix';
import { COMM_ANATOMY_APOLOGY } from './comm-anatomy-apology';
import { COMM_DIGITAL_TONE } from './comm-digital-tone';
import { LOVE_ROOMMATE_DRIFT } from './love-roommate-drift';
import { LOVE_LONG_DISTANCE_MATH } from './love-long-distance-math';
import { LOVE_ANXIOUS_AVOIDANT_DANCE } from './love-anxious-avoidant-dance';
import { DATING_SLOW_DATING } from './dating-slow-dating';
import { DATING_LOVE_BOMBING } from './dating-love-bombing';
import { DATING_AFTER_BREAKUP } from './dating-after-breakup';
import { BREAKUPS_END_IT_WELL } from './breakups-end-it-well';
import { BREAKUPS_ON_OFF_CYCLE } from './breakups-on-off-cycle';
import { BREAKUPS_UNTANGLING } from './breakups-untangling';
import { SELFLOVE_BOUNDARIES_GUILT } from './selflove-boundaries-guilt';
import { SELFLOVE_REBUILD_SELF_TRUST } from './selflove-rebuild-self-trust';
import { SELFLOVE_SOLITUDE_VS_LONELINESS } from './selflove-solitude-vs-loneliness';
import { COMM_RITUALS_OF_CONNECTION } from './comm-rituals-of-connection';
import { BREAKUPS_GRIEVING_SOMEONE_ALIVE } from './breakups-grieving-someone-alive';
import { LOVE_LANGUAGES_HONESTLY } from './love-languages-honestly';

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
  ...SELFLOVE_REST_IS_NOT_A_REWARD,
  ...COMM_LISTEN_DONT_FIX,
  ...COMM_ANATOMY_APOLOGY,
  ...COMM_DIGITAL_TONE,
  ...LOVE_ROOMMATE_DRIFT,
  ...LOVE_LONG_DISTANCE_MATH,
  ...LOVE_ANXIOUS_AVOIDANT_DANCE,
  ...DATING_SLOW_DATING,
  ...DATING_LOVE_BOMBING,
  ...DATING_AFTER_BREAKUP,
  ...BREAKUPS_END_IT_WELL,
  ...BREAKUPS_ON_OFF_CYCLE,
  ...BREAKUPS_UNTANGLING,
  ...SELFLOVE_BOUNDARIES_GUILT,
  ...SELFLOVE_REBUILD_SELF_TRUST,
  ...SELFLOVE_SOLITUDE_VS_LONELINESS,
  ...COMM_RITUALS_OF_CONNECTION,
  ...BREAKUPS_GRIEVING_SOMEONE_ALIVE,
  ...LOVE_LANGUAGES_HONESTLY
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
