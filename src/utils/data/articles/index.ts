import { Post } from '../../../types.js';
import { LOVE_QUIET_ECONOMICS } from './love-quiet-economics.js';
import { DATING_FIRST_THREE_DATES } from './dating-first-three-dates.js';
import { COMM_REPAIR_BEATS_PERFECTION } from './comm-repair-beats-perfection.js';
import { BREAKUPS_NO_CONTACT_MONTH } from './breakups-no-contact-month.js';
import { SELFLOVE_SELF_ABANDONMENT } from './selflove-self-abandonment.js';
import { LOVE_MONEY_FIGHTS } from './love-money-fights.js';
import { COMM_TURN_TOWARD } from './comm-turn-toward.js';
import { SELFLOVE_INNER_CRITIC } from './selflove-inner-critic.js';
import { LOVE_THE_STORY_YOU_TELL } from './love-the-story-you-tell.js';
import { COMM_THE_SAME_FIGHT_FOREVER } from './comm-the-same-fight-forever.js';
import { DATING_GREEN_FLAGS } from './dating-green-flags.js';
import { SELFLOVE_REST_IS_NOT_A_REWARD } from './selflove-rest-is-not-a-reward.js';
import { COMM_LISTEN_DONT_FIX } from './comm-listen-dont-fix.js';
import { COMM_ANATOMY_APOLOGY } from './comm-anatomy-apology.js';
import { COMM_DIGITAL_TONE } from './comm-digital-tone.js';
import { LOVE_ROOMMATE_DRIFT } from './love-roommate-drift.js';
import { LOVE_LONG_DISTANCE_MATH } from './love-long-distance-math.js';
import { LOVE_ANXIOUS_AVOIDANT_DANCE } from './love-anxious-avoidant-dance.js';
import { DATING_SLOW_DATING } from './dating-slow-dating.js';
import { DATING_LOVE_BOMBING } from './dating-love-bombing.js';
import { DATING_AFTER_BREAKUP } from './dating-after-breakup.js';
import { BREAKUPS_END_IT_WELL } from './breakups-end-it-well.js';
import { BREAKUPS_ON_OFF_CYCLE } from './breakups-on-off-cycle.js';
import { BREAKUPS_UNTANGLING } from './breakups-untangling.js';
import { SELFLOVE_BOUNDARIES_GUILT } from './selflove-boundaries-guilt.js';
import { SELFLOVE_REBUILD_SELF_TRUST } from './selflove-rebuild-self-trust.js';
import { SELFLOVE_SOLITUDE_VS_LONELINESS } from './selflove-solitude-vs-loneliness.js';
import { COMM_RITUALS_OF_CONNECTION } from './comm-rituals-of-connection.js';
import { BREAKUPS_GRIEVING_SOMEONE_ALIVE } from './breakups-grieving-someone-alive.js';
import { LOVE_LANGUAGES_HONESTLY } from './love-languages-honestly.js';

// HeartSync long-form corpus  - genuinely written editorial pieces, added over
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
