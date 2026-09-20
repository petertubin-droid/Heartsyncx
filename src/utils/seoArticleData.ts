export interface FaqItem {
  question: string;
  answer: string;
}

export interface ArticleSeoAdditions {
  faq: FaqItem[];
  takeaways: string[];
}

/**
 * Returns dynamic, high-quality, search-optimized FAQ sets and expert key takeaways
 * matching relationship concerns relevant to the article's slug and title.
 */
export function getArticleSeoData(slug: string, title: string): ArticleSeoAdditions {
  const normSlug = (slug || '').toLowerCase();
  const normTitle = (title || '').toLowerCase();

  // 1. Attachment Theory / Styles
  if (normSlug.includes('attachment') || normTitle.includes('attachment') || normSlug.includes('avoidant') || normSlug.includes('anxiety')) {
    return {
      faq: [
        {
          question: "What is an attachment style and can it be changed?",
          answer: "An attachment style is a relational blueprint formed in early childhood based on your bonding with primary caregivers. While these styles are deeply ingrained, you can cultivate 'earned security' as an adult through mindfulness, somatic practices, self-reflection, and healthy, secure relationships."
        },
        {
          question: "How do the anxious and avoidant attachment styles trigger each other?",
          answer: "This is known as the 'anxious-avoidant trap' or 'pursuer-distancer dynamic.' When the anxious partner senses distance, they pursue for reassurance. The avoidant partner perceives this pursuit as a threat to autonomy and withdraws further, which in turn spikes the anxious partner's panic, creating a self-reinforcing loop."
        },
        {
          question: "What is the first step in healing an insecure attachment style?",
          answer: "The first step is awareness and self-compassion. Recognizing your triggers—such as the urge to cling or the instinct to bolt—without judgment allows you to pause. Pausing gives you the space to regulate your nervous system somatically before responding reactively."
        }
      ],
      takeaways: [
        "Your attachment style is a historical coping mechanism, not a life sentence; 'earned security' is always attainable.",
        "The anxious-avoidant trap is systemic, meaning neither partner is the villain; healing requires co-regulating and changing the dance.",
        "Somatic pausing is the key transition tool to move from emotional reactivity to conscious, secure communication."
      ]
    };
  }

  // 2. Slow Dating & Swipe Burnout
  if (normSlug.includes('dating') || normSlug.includes('swipe') || normSlug.includes('first-date') || normTitle.includes('dating') || normTitle.includes('match')) {
    return {
      faq: [
        {
          question: "What is slow dating and how does it prevent app burnout?",
          answer: "Slow dating is a mindful approach that prioritizes depth, pacing, and presence over volume and instant gratification. By intentionally limiting matches, engaging in longer conversations, and spacing out first dates, you protect your emotional energy and allow authentic connections to unfold."
        },
        {
          question: "How do you reframe a first date to avoid the 'job interview' feel?",
          answer: "Instead of running through a checklist of credentials, focus on mutual presence. Ask open-ended questions about values, passions, and emotional landscapes, rather than career progression. Treat the date as a shared somatic experience—such as taking a walk or exploring a gallery—rather than an interrogation."
        },
        {
          question: "What digital boundaries are essential when early dating?",
          answer: "Set boundaries around screen time and response expectations. Avoid continuous micro-texting throughout the day, which builds a false sense of intimacy. Instead, use texting primarily for logistical planning and save deep emotional disclosure for face-to-face meetings."
        }
      ],
      takeaways: [
        "Mindful dating prioritizes relational depth over swipe volume, protecting your nervous system from burnout.",
        "Transform first dates from a credentials interview into a shared moment of presence and authentic sensory experience.",
        "Digital pacing prevents premature attachment and allows you to evaluate compatibility based on real-world actions."
      ]
    };
  }

  // 3. Somatic Grounding & Co-Regulation
  if (normSlug.includes('somatic') || normSlug.includes('grounding') || normSlug.includes('co-regulation') || normSlug.includes('breath') || normTitle.includes('somatic') || normTitle.includes('body')) {
    return {
      faq: [
        {
          question: "What is somatic grounding in couples connection?",
          answer: "Somatic grounding involves using body-based mindfulness practices—like deep breathing, posture adjustment, and tactile focus—to stabilize the nervous system during relational distress. When partners are grounded, they can exit the fight-or-flight response and access their relational brain."
        },
        {
          question: "What is co-regulation and how does it heal trauma?",
          answer: "Co-regulation is the bi-directional adjustment of nervous systems between two individuals. Through calm voice tones, eye contact, and steady breathing, partners can soothe each other's defensive shields, signaling safety to the primitive brain and healing relational trauma over time."
        },
        {
          question: "How can couples practice somatic grounding during a disagreement?",
          answer: "When a partner feels flooded, call a 'somatic pause.' Sit facing each other, place feet flat on the floor, and take five slow, synchronous breaths together. You can also hold hands to introduce soothing touch, which decreases cortisol and re-establishes a felt sense of safety."
        }
      ],
      takeaways: [
        "Relational healing is bottom-up; you must soothe the nervous system before you can resolve cognitive differences.",
        "Co-regulation is a shared biological shield; a calm tone and steady eye contact physically de-escalates conflict.",
        "A somatic pause during flooding prevents the primitive 'fight-flight-freeze' brain from hijacking constructive conversations."
      ]
    };
  }

  // 4. Conscious Communication & Boundaries
  if (normSlug.includes('boundary') || normSlug.includes('boundaries') || normSlug.includes('communication') || normSlug.includes('fight') || normSlug.includes('conflict') || normTitle.includes('boundar') || normTitle.includes('listening')) {
    return {
      faq: [
        {
          question: "How do you set a relational boundary without being defensive?",
          answer: "A healthy boundary is a statement of your needs and limits, not a criticism of your partner. Frame boundaries using 'I' statements: express what you feel, what you need, and what you will do to take care of yourself, rather than blaming or demanding compliance."
        },
        {
          question: "What is an 'I-statement' upgrade and why is it effective?",
          answer: "An upgraded I-statement moves beyond simple complaint to express vulnerable underlying emotions. Instead of 'I feel ignored when you stay on your phone,' say: 'I feel disconnected and miss your presence when we eat. I'd love if we could keep devices away from the table.'"
        },
        {
          question: "How do boundaries protect intimacy instead of creating distance?",
          answer: "Boundaries define where you end and your partner begins. Without boundaries, partners fall into enmeshment, which breeds resentment and suffocates attraction. Clear boundaries allow both partners to feel safe, respected, and differentiated, which is the fertile soil for deep desire."
        }
      ],
      takeaways: [
        "Relational boundaries are bridges, not walls; they instruct your partner on how to love and respect you safely.",
        "Upgraded I-statements reveal vulnerability instead of criticism, turning defensiveness into compassionate connection.",
        "Differentiation—retaining your individual self within the union—is crucial to maintaining long-term attraction."
      ]
    };
  }

  // 5. Gottman Method / Relationship Science
  if (normSlug.includes('gottman') || normSlug.includes('horsemen') || normSlug.includes('bid') || normSlug.includes('ratio') || normTitle.includes('gottman') || normTitle.includes('trust')) {
    return {
      faq: [
        {
          question: "What are Gottman's 'Four Horsemen' in relationship science?",
          answer: "The Four Horsemen are negative communication styles that predict relationship failure: Criticism (attacking character), Defensiveness (victim-playing), Contempt (moral superiority/mockery), and Stonewalling (withdrawing completely). Contempt is identified as the single greatest predictor of divorce."
        },
        {
          question: "What is an emotional bid and how does it build trust?",
          answer: "An emotional bid is any attempt to connect, share a laugh, or express a feeling. Partners can respond by turning toward (acknowledging and engaging), turning away (ignoring), or turning against (hostility). Consistently turning toward bids builds a robust emotional bank account."
        },
        {
          question: "What is the 'Magic Ratio' in relationship interactions?",
          answer: "Dr. John Gottman's research shows that stable, happy relationships maintain a ratio of at least 5 positive interactions to every 1 negative interaction during conflict. In everyday non-conflict times, that ratio rises to an astonishing 20 to 1."
        }
      ],
      takeaways: [
        "Contempt is highly corrosive to health and longevity; its antidote is cultivating a culture of appreciation and respect.",
        "Trust is not built in major grand gestures, but in the micro-moments of turning toward small, everyday emotional bids.",
        "Maintaining the 5:1 conflict interaction ratio acts as a powerful relational shock absorber during difficult times."
      ]
    };
  }

  // Fallback defaults: general relationship science, couples counseling, and emotional wellness
  return {
    faq: [
      {
        question: "How can couples establish emotional safety in a busy lifestyle?",
        answer: "Establish small, non-negotiable rituals of connection. This can be a 10-minute check-in every morning, a device-free walk after dinner, or a weekly emotional tuning date where you discuss the state of your relationship rather than schedules."
      },
      {
        question: "What is emotional flooding and what should you do when it happens?",
        answer: "Emotional flooding occurs when your nervous system is overwhelmed by stress or conflict, sending your heart rate above 100 BPM. In this state, logical discussion is biologically impossible. You must call a structured break of at least 20 minutes to self-soothe before resuming."
      },
      {
        question: "How does self-growth benefit a long-term relationship?",
        answer: "A relationship is healthiest when both individuals are committed to their own self-actualization. Bringing a growing, curious, and self-reflective self to the union prevents codependency and keeps the relational field vibrant and evolving."
      }
    ],
    takeaways: [
      "Small, consistent rituals of connection are far more therapeutic than occasional grand romantic gestures.",
      "Recognizing emotional flooding and practicing structured time-outs prevents the saying of deeply hurtful words.",
      "Your greatest gift to your relationship is your own ongoing personal growth, self-regulation, and inner harmony."
    ]
  };
}
