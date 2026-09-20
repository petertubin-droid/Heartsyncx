import { Post } from '../../../types';
import { LOVE_QUIET_ECONOMICS } from './love-quiet-economics';
import { DATING_FIRST_THREE_DATES } from './dating-first-three-dates';
import { COMM_REPAIR_BEATS_PERFECTION } from './comm-repair-beats-perfection';
import { BREAKUPS_NO_CONTACT_MONTH } from './breakups-no-contact-month';
import { SELFLOVE_SELF_ABANDONMENT } from './selflove-self-abandonment';

// HeartSync long-form corpus — genuinely written editorial pieces, added over
// time in batches. Word target per article: ~2000 words. Never filler.
export const HEARTSYNC_ARTICLES: Post[] = [
  ...LOVE_QUIET_ECONOMICS,
  ...DATING_FIRST_THREE_DATES,
  ...COMM_REPAIR_BEATS_PERFECTION,
  ...BREAKUPS_NO_CONTACT_MONTH,
  ...SELFLOVE_SELF_ABANDONMENT
];
