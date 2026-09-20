import { Post, Category } from '../../types';
import { HEARTSYNC_ARTICLES } from './articles/index';

export const MORE_CATEGORIES: Category[] = [
  {
    id: 'cat-love-relationships',
    name: 'Love & Relationships',
    slug: 'love-relationships',
    description: 'Explore the foundations of lasting intimacy, commitment, and mutual emotional support in long-term partnerships.',
    color: '#E11D48',
    icon: 'Heart',
    featured_image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=1200',
    seo_title: 'Love & Relationships — Insights for Deeper Intimacy',
    seo_description: 'Discover research-backed principles for deepening emotional connection, nurturing trust, and building enduring love.',
    seo_keywords: ['love', 'relationships', 'intimacy', 'partnership', 'commitment']
  },
  {
    id: 'cat-dating-romance',
    name: 'Dating & Romance',
    slug: 'dating-romance',
    description: 'Practical guidance for navigating modern romance, intentional dating, early chemistry, and finding compatible partners.',
    color: '#D97706',
    icon: 'Heart',
    featured_image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200',
    seo_title: 'Dating & Romance — Mindful Approaches to Modern Courtship',
    seo_description: 'Learn how to approach dating with clarity, build authentic romance, and recognize early compatibility indicators.',
    seo_keywords: ['dating', 'romance', 'courtship', 'singles', 'chemistry', 'dating advice']
  },
  {
    id: 'cat-comm-connection',
    name: 'Communication & Emotional Connection',
    slug: 'communication-emotional-connection',
    description: 'Master the language of active listening, empathetic dialogue, vulnerability, and resolving conflicts with grace.',
    color: '#2563EB',
    icon: 'MessageCircle',
    featured_image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200',
    seo_title: 'Communication & Emotional Connection — Speak from the Heart',
    seo_description: 'Effective communication tools to help partners express needs, listen deeply, and cultivate lasting emotional closeness.',
    seo_keywords: ['communication', 'emotional connection', 'active listening', 'vulnerability', 'conflict resolution']
  },
  {
    id: 'cat-problems-breakups',
    name: 'Relationship Problems & Breakups',
    slug: 'relationship-problems-breakups',
    description: 'Empathetic strategies for navigating difficult rough patches, boundary challenges, separation, and healing after heartbreak.',
    color: '#7C3AED',
    icon: 'ShieldAlert',
    featured_image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=1200',
    seo_title: 'Relationship Problems & Breakups — Healing and Recovery',
    seo_description: 'Supportive perspectives on working through complex relationship challenges, processing breakups, and restoring inner peace.',
    seo_keywords: ['breakups', 'relationship problems', 'heartbreak', 'healing', 'closure', 'recovery']
  },
  {
    id: 'cat-selflove-growth',
    name: 'Self Love & Personal Growth',
    slug: 'self-love-personal-growth',
    description: 'Nurture self-worth, emotional independence, healthy personal boundaries, and holistic personal development.',
    color: '#059669',
    icon: 'UserCheck',
    featured_image: 'https://images.unsplash.com/photo-1499209974431-9dac3ada00d7?auto=format&fit=crop&q=80&w=1200',
    seo_title: 'Self Love & Personal Growth — Becoming Your Best Self',
    seo_description: 'Inspirational guidance on building self-compassion, emotional resilience, and an authentic relationship with yourself.',
    seo_keywords: ['self love', 'personal growth', 'self care', 'mindfulness', 'emotional resilience']
  }
];

export const MORE_POSTS: Post[] = [
  ...HEARTSYNC_ARTICLES,

  {
    id: 'post-1',
    title: 'The Art of Mindful Love: Cultivating Lasting Intimacy in Modern Relationships',
    slug: 'art-of-mindful-love-cultivating-lasting-intimacy',
    excerpt: 'True intimacy is not a static destination, but a ongoing practice of presence, emotional attunement, and gentle curiosity between two evolving partners.',
    content: `
# The Art of Mindful Love: Cultivating Lasting Intimacy in Modern Relationships

In our fast-paced modern world, relationships are frequently subjected to intense schedules, digital distractions, and implicit pressures to remain constantly productive. Amidst this flurry of everyday demands, romantic partnerships can easily shift from sanctuary to logistics management.

Mindful love offers a grounded, intentional alternative. Rather than expecting passion to remain self-sustaining without nourishment, mindful love treats relationship vitality as a garden requiring daily, deliberate attunement.

---

## 1. The Core Pillar: Emotional Presence

To love mindfully means showing up fully in the present moment with your partner. It requires putting down devices during conversation, making steady eye contact, and offering unhurried presence.

> "To be loved is to be seen. To be mindfully loved is to feel that your internal world matters deeply to the person sitting across from you."

When partners practice emotional presence, small everyday interactions transform into opportunities for deep bonding. A simple morning check-in becomes a moment of true resonance rather than a transactional routine.

---

## 2. Differentiating Reactivity from Response

In long-term relationships, triggers inevitably surface. When old emotional wounds are bumped into, the habitual reaction is defensive self-protection—whether through stonewalling, criticism, or withdrawal.

Mindfulness creates a crucial pause between stimulus and response. In that brief space, you can ask yourself:
* *What am I feeling right now in my body?*
* *Is my current impulse serving connection or self-defense?*
* *How can I express my need without attacking my partner's character?*

By choosing curious inquiry over reflexive defense, conflict shifts from a destructive battle into a constructive dialogue.

---

## 3. Embracing the Cycle of Rupture and Repair

No couple avoids misunderstandings. Research consistently demonstrates that the hallmark of resilient relationships is not the total absence of conflict, but the swiftness and sincerity of **repair**.

A healthy repair attempt does not require perfection; it requires humility. Acknowledging your contribution to a tense moment ("I notice I raised my voice earlier, and I am sorry for reacting defensively") re-establishes emotional safety faster than any grand gesture.

---

## Practical Daily Exercise: The 5-Minute Presence Ritual

1. Sit comfortably facing one another in a quiet space without phones or ambient distractions.
2. Hold hands gently and maintain soft, non-judgmental eye contact for two minutes while breathing together.
3. Take turns sharing one thing you genuinely appreciate about your partner today and one feeling you are holding.
4. Close with a warm, lingering hug before transitioning back to your evening routines.
    `,
    status: 'published',
    publish_date: new Date().toISOString(),
    featured_image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=1200',
    read_time: 6,
    category_id: 'cat-love-relationships',
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
    content: `
# Navigating Modern Dating: How to Move from Chemistry to Compatible Connection

Modern dating apps and speed-of-light romantic options have made it easier than ever to meet new people. Yet, many singles find themselves stuck in a frustrating loop of rapid excitement followed by abrupt disappointment.

The key to breaking this cycle lies in understanding the critical distinction between **chemistry** and **compatibility**.

---

## Understanding the Chemistry Trap

Chemistry is the visceral, physical, and emotional spark you feel with someone. It is often fueled by novelty, mutual attraction, or even familiar emotional patterns from our past. While chemistry is exciting and delightful, it is not an accurate predictor of relationship longevity.

High chemistry without shared values often leads to turbulent, high-anxiety dynamics where intense highs are matched by deep insecurities.

---

## Defining Genuine Compatibility

Compatibility, on the other hand, is the functional alignment of how two people live, communicate, and envision their futures. It asks practical, foundational questions:

1. **Lifestyle Alignment:** Do our routines, energy levels, and social needs complement each other?
2. **Emotional Maturity:** How does this person handle stress, disappointment, and boundary setting?
3. **Core Values:** Are we aligned on fundamental issues like family, finance, integrity, and personal ambition?

---

## 3 Mindful Dating Principles for Finding Lasting Love

### 1. Date with Emotional Clarity
Before embarking on new dates, gain clarity on your non-negotiable core values versus minor preferences. Knowing what genuinely matters prevents you from overlooking red flags solely because someone is charming.

### 2. Pacing over Urgency
Resist the urge to rush into intense emotional reliance after just two or three dates. Allow relationship trust to be earned gradually over time through consistent action and reliable behavior.

### 3. Honor Your Internal Boundaries
Pay close attention to how your body feels after spending time with someone. Do you feel calm, grounded, and respected? Or do you feel anxious, hyper-vigilant, and second-guessing your worth? Your body often recognizes incompatibility before your mind rationalizes it away.
    `,
    status: 'published',
    publish_date: new Date().toISOString(),
    featured_image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200',
    read_time: 5,
    category_id: 'cat-dating-romance',
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
    excerpt: 'Effective communication in relationships goes far beyond speaking clearly—it requires creating a safe, non-judgmental space where both partners feel truly heard.',
    content: `
# Breaking the Silence: How Active Listening & Emotional Vulnerability Transform Partnerships

Most relationship disputes are rarely about the superficial topic on the surface—whether that is unwashed dishes, busy schedules, or weekend plans. At their core, most conflicts center around deeper underlying emotional questions: *"Do you see me? Do my feelings matter to you? Am I safe with you?"*

Mastering communication requires shifting from defending your position to understanding your partner's emotional reality.

---

## The Power of Active Listening

Active listening is the practice of hearing your partner's words with the primary goal of comprehension rather than rebuttal. In typical conversations, people often prepare their response while the other person is still speaking.

When you practice active listening:
* You slow down the dialogue.
* You mirror back what you heard to verify accuracy ("What I hear you saying is that you felt overwhelmed when I was late. Is that right?").
* You validate their underlying emotion even if you view the situation differently.

---

## Unlocking Vulnerability

Vulnerability is often mistaken for weakness, but in romantic partnerships, it is the primary bridge to deep intimacy. Vulnerability means sharing your genuine fears, needs, and softer emotions rather than armor-plating them behind anger or passive-aggressive sarcasm.

Instead of saying: *"You never care about my schedule!"* (Defensive Attack)  
Try saying: *"I felt disappointed when our dinner plans changed because I was really looking forward to connecting with you tonight."* (Vulnerable Need)

---

## 4 Communication Habits to Build Today

1. **Avoid Universal Absolute Words:** Eliminate phrases like "you always" or "you never" from your conflict vocabulary.
2. **Use "I" Statements:** Frame expressions around your experience and feelings rather than accusing statements about your partner.
3. **Take Intentional Time-outs:** If emotional heat rises above a productive level, politely request a 20-minute break to regulate your nervous system before resuming.
4. **Express Daily Gratitude:** Acknowledge small acts of kindness daily to reinforce a culture of appreciation and warmth.
    `,
    status: 'published',
    publish_date: new Date().toISOString(),
    featured_image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200',
    read_time: 7,
    category_id: 'cat-comm-connection',
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
    content: `
# Healing After Heartbreak: Rebuilding Trust, Boundaries, and Emotional Clarity

Heartbreak is one of the most intense emotional experiences a human can navigate. Whether a breakup was long in the making or unexpected, the loss of a shared future alters your daily rhythms, sense of identity, and emotional landscape.

Healing from heartbreak is neither linear nor instantaneous, but it is entirely achievable when approached with self-compassion and healthy emotional boundaries.

---

## 1. Honoring the Full Spectrum of Grief

Breakups trigger genuine grief. You are not only mourning the loss of a person's presence in your daily life, but also the loss of shared dreams, habits, and future expectations.

Allow yourself to experience the natural emotional waves—sadness, anger, confusion, and longing—without judging yourself for having them. Trying to rush or suppress these feelings often prolongs emotional pain.

---

## 2. The Sanctuary of No Contact & Clear Boundaries

In the immediate aftermath of a breakup, maintaining continuous contact often keeps emotional wounds raw and prevents true emotional processing.

Establishing clear boundaries—such as taking a break from social media monitoring, unfollowing or muting profiles, and limiting texting—is not an act of hostility. It is an essential act of self-preservation that gives your brain space to adapt to the new reality.

---

## 3. Reclaiming Your Independent Sense of Self

Relationships naturally involve blending lives. When a partnership ends, it offers a sacred invitation to reclaim lost pieces of your identity:

* **Reconnect with Old Passions:** Revisit hobbies, creative projects, or interests you may have put aside.
* **Nurture Your Support Network:** Spend quality time with trusted friends and family members who make you feel grounded and loved.
* **Create New Daily Routines:** Design a morning and evening routine that is entirely tailored to your wellbeing and comfort.

---

## Moving Forward with Wisdom

Heartbreak teaches us profound lessons about what we need, what we can tolerate, and how we love. As the acute pain softens into quiet reflection, you will find that you have built greater emotional resilience and a clearer understanding of your true self.
    `,
    status: 'published',
    publish_date: new Date().toISOString(),
    featured_image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=1200',
    read_time: 6,
    category_id: 'cat-problems-breakups',
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
    content: `
# Self-Love as the Foundation: Unlocking Healthy Attachment and Personal Fulfillment

We often look outward for validation, comfort, and security, placing the weight of our emotional stability onto romantic partners. However, true security begins within.

When you cultivate deep self-love and self-acceptance, you transform from a place of emotional lack into a place of abundance—allowing you to choose partners out of genuine connection rather than fear of loneliness.

---

## What True Self-Love Really Means

Self-love is often confused with surface-level pampering, such as spa days or indulgence. While those can be enjoyable, authentic self-love is a deeply transformative internal commitment:

1. **Self-Compassion:** Treating yourself with gentle kindness when you make mistakes rather than harsh self-criticism.
2. **Healthy Boundaries:** Saying "no" to commitments or relationships that drain your peace and integrity.
3. **Honoring Your Needs:** Prioritizing sleep, movement, emotional reflection, and healthy nutrition as daily non-negotiables.

---

## How Self-Love Transforms Attachment Styles

If you lean toward anxious attachment, you may worry about abandonment and constantly seek external reassurance. Practicing self-love teaches you how to **self-soothe** and offer yourself the validation you long for.

If you lean toward avoidant attachment, self-love helps you acknowledge your emotional needs safely, making it easier to open up to others without feeling suffocated.

---

## 3 Daily Practices for Cultivating Internal Security

### 1. The Inner Dialogue Audit
Notice how you talk to yourself throughout the day. When you make a mistake, ask: *"Would I speak to a dear friend in this tone?"* Consciously reframe critical self-talk into supportive encouragement.

### 2. Daily Boundary Check-ins
Before agreeing to new requests, pause and check in with your energy. Ensure that your "yes" to others is not a secret "no" to your own wellbeing.

### 3. Celebrate Small Personal Wins
Keep a daily journal logging three things you did well or appreciated about yourself today. Over time, this rewires your focus toward your inherent worth.
    `,
    status: 'published',
    publish_date: new Date().toISOString(),
    featured_image: 'https://images.unsplash.com/photo-1499209974431-9dac3ada00d7?auto=format&fit=crop&q=80&w=1200',
    read_time: 5,
    category_id: 'cat-selflove-growth',
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
