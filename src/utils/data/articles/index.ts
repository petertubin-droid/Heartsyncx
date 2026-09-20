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
