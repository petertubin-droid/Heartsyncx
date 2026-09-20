export interface BoundariesTemplate {
  id: string;
  category: string;
  title: string;
  when: string;
  script: string;
}

// Hand-written boundary scripts: concrete language a reader can actually say,
// adapted to the situation. Every script pairs a clear limit with a stated
// consequence, because a boundary without a consequence is a suggestion.
export const BOUNDARIES_TEMPLATES: BoundariesTemplate[] = [
  {
    id: 'bnd-family-dropin',
    category: 'Family',
    title: 'Unannounced visits from family',
    when: 'A parent or relative shows up whenever they feel like it and expects to be let in.',
    script: `"I love seeing you, and I need you to call before you come over — even an hour's notice works. If I'm not ready for visitors when you arrive, I won't be answering the door, and that's not a rejection; it's me taking care of my own home. Next time, let's plan it so I can actually enjoy your visit."`
  },
  {
    id: 'bnd-parent-advice',
    category: 'Family',
    title: 'Unwanted parenting or life advice',
    when: 'A family member critiques your choices, partner, or parenting every conversation.',
    script: `"I know your advice comes from caring about me. I'm not looking for input on this right now — I need you to trust that I've thought it through. If I want your perspective, I promise I'll ask. If the advice keeps coming, I'm going to change the subject or end the call, because I want us to have a good relationship, not a tense one."`
  },
  {
    id: 'bnd-holiday-split',
    category: 'Family',
    title: 'Holidays being decided for you',
    when: 'Families on both sides assume you will attend, and you end up drained and resentful.',
    script: `"We've decided as a couple what works for us this year, and it isn't up for a family vote. We'd love to see you on the dates we proposed. We understand if that's disappointing, and we're not going to renegotiate each time it comes up."`
  },
  {
    id: 'bnd-ex-contact',
    category: 'Exes & Past',
    title: 'An ex who keeps reaching out',
    when: 'A former partner texts "just to check in" and it destabilizes your peace or your new relationship.',
    script: `"I've realized that staying in contact keeps both of us from moving forward. I'm not going to respond to check-ins anymore. I wish you well, genuinely. Please respect that this is final."`
  },
  {
    id: 'bnd-partner-ex',
    category: 'Exes & Past',
    title: 'Your partner staying in touch with an ex',
    when: 'The ongoing contact with a former partner makes you uncomfortable and your partner dismisses it.',
    script: `"I'm not asking you to be enemies with your ex. I'm telling you the ongoing contact hurts me and I don't want it in our relationship. I need you to decide what you're protecting: that friendship, or our peace. I'll trust what you do next more than what you say."`
  },
  {
    id: 'bnd-phone-privacy',
    category: 'Digital Life',
    title: 'Phone and message checking',
    when: 'A partner goes through your phone, or demands your passwords as "proof" of trust.',
    script: `"I understand anxiety makes you want certainty, but surveillance isn't intimacy — it builds the opposite. My phone stays private, not because I'm hiding anything, but because privacy is how adults stay whole. If you're struggling to trust me, let's talk about that directly, because searching my messages will never fix it."`
  },
  {
    id: 'bnd-work-hours',
    category: 'Digital Life',
    title: 'Work messages at all hours',
    when: 'Your employer or clients expect replies at 10pm and your evenings have disappeared.',
    script: `"I'm committed to doing excellent work during working hours. To do that, I'm offline after [time] and on weekends. If something is genuinely urgent, call me — but for everything else, I'll respond when I'm back online at [time]. You'll get better work from a rested me."`
  },
  {
    id: 'bnd-group-chat',
    category: 'Digital Life',
    title: 'Group chats that never stop',
    when: 'A constant stream of notifications from a group that expects instant participation.',
    script: `"I've turned off notifications for this chat so I can focus during the day. I'll catch up in the evenings. If you need me urgently, text me directly."`
  },
  {
    id: 'bnd-emotional-labor',
    category: 'Partnership',
    title: 'Being the household\'s default therapist',
    when: 'Everyone vents to you, but nobody asks how you are — and you feel responsible for fixing their feelings.',
    script: `"I care about what you're going through, and I've noticed I've become the only person everyone unloads on. I can listen for a bit, but I can't carry this for you, and I'm not going to try to fix it anymore. Have you thought about talking to a professional? That's what they're trained for."`
  },
  {
    id: 'bnd-mental-load',
    category: 'Partnership',
    title: 'Carrying the invisible workload',
    when: 'You manage every household detail and your partner "helps" only when asked, then wants credit.',
    script: `"I need us to split ownership, not tasks. From now on, X is fully yours — the remembering, the planning, and the doing, without me reminding you. I won't chase you or redo it if it's done differently. If it isn't handled by [date], I'm going to assume it isn't a priority for us and act on that information."`
  },
  {
    id: 'bnd-money-boundary',
    category: 'Money',
    title: 'Family or friends borrowing money',
    when: 'Repeated requests for loans that are never repaid and leave you resentful.',
    script: `"I've decided I'm not lending money anymore — to anyone. It has damaged relationships I care about, including ours. I can help in other ways if you're in trouble, but I'm not a lender, and I won't make exceptions, so please don't ask me to."`
  },
  {
    id: 'bnd-friend-time',
    category: 'Friendship',
    title: 'The friend who only surfaces in crisis',
    when: 'A friend disappears for months, then reappears demanding immediate emotional rescue.',
    script: `"I've missed you, and I've also noticed we only talk when something's wrong. I want a friendship with the good parts too. I can give you thirty minutes today, but I'm not able to be your emergency service. If you're in a really bad place, a therapist or a helpline is the right support — I'll help you find one."`
  }
];
