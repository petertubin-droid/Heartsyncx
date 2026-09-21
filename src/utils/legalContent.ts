/**
 * Heartsync legal content  - Privacy Policy, Terms of Service,
 * Editorial & Professional Disclaimer, and Cookie Policy.
 *
 * These are the site's default legal documents, rendered on the
 * /privacy, /terms, /disclaimer and /cookies routes. If an editor
 * publishes a custom page for the same route from the Admin Console,
 * that custom page takes precedence over this content.
 */

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDoc {
  kicker: string;
  title: string;
  updated: string;
  sections: LegalSection[];
}

export const LEGAL_DOCS: Record<'privacy' | 'terms' | 'disclaimer' | 'cookies', LegalDoc> = {
  privacy: {
    kicker: 'Heartsync Legal',
    title: 'Privacy Policy',
    updated: 'September 21, 2026',
    sections: [
      {
        heading: 'Who We Are and What This Policy Covers',
        paragraphs: [
          'Heartsync publishes research-informed writing about relationships, attachment, emotional wellness, and the practical work of building secure connection with other people. We are an editorial publication, not a clinic, and this Privacy Policy explains what information we collect when you read our essays, subscribe to our newsletter, sign in to comment, or purchase a premium membership, and what we do with it.',
          'This policy covers the Heartsync website, our newsletter, our self-assessments and reading tools, and our premium membership area. It does not govern third-party services we link to or embed, such as Google, payment processors, or advertising partners; those organizations publish their own privacy policies, and we encourage you to read them. Where our practices depend on those partners, we say so plainly below.',
        ],
      },
      {
        heading: 'Information We Collect',
        paragraphs: [
          'Account information. If you create an account, we use Google single sign-in, so we receive the name, email address, and profile image you authorize through that flow. We do not request or store your Google password, and we never ask for it. Your email address becomes the identifier for your account, your newsletter subscription, and any premium entitlement.',
          'Reader interactions. Heartsync stores bookmarks, likes, saved articles, quiz responses, and reading preferences locally in your browser where possible. These conveniences belong to your device first; clearing your browser storage removes them. Where a feature requires a server-side record, such as premium membership status or newsletter delivery, only the minimum data needed to make the feature work is stored.',
          'Newsletter data. If you subscribe, we keep your email address, the date you joined, and your subscription source so we can send the weekly digest and honor one-click unsubscribe requests immediately. We track whether emails fail to deliver, because a repeatedly bouncing address is a signal to stop writing to it.',
          'Analytics and measurement. We count pageviews and article engagement in aggregate to understand which essays serve readers. These measurements are not used to build individual behavioral profiles, and we do not sell them. You can find the technical details, including how advertising cookies interplay with measurement, in our Cookie Policy.',
          'Technical records. Like every website, our hosting provider keeps short-lived server logs that include your IP address, browser type, approximate device, the page requested, and the time of the request. These records exist to keep the site secure, diagnose failures, and defend against abuse, and they are routinely rotated out of existence.',
        ],
      },
      {
        heading: 'How We Use Your Information',
        paragraphs: [
          'We use the data described above to deliver the publication you came for: to publish essays, send the newsletter you asked for, keep your place in a reading list, remember your theme and typography preferences between visits, process premium subscriptions, and answer you when you write to us. We also use it to keep the platform safe from spam, scraping, and malicious traffic.',
          'We do not use your information to profile you across third-party websites, and we do not sell, rent, or trade personal data to data brokers. Revenue that keeps this publication running comes from advertising and memberships, and both are governed by the limits described in the advertising section of our Cookie Policy.',
        ],
      },
      {
        heading: 'Legal Bases for Processing',
        paragraphs: [
          'If you are in the United Kingdom, the European Economic Area, or another jurisdiction with comparable law, we process your personal data under the following bases: performance of a contract, when we deliver a newsletter or premium membership you signed up for; legitimate interests, when we keep the site secure, prevent abuse, and measure aggregate readership; consent, when you accept non-essential cookies or personalized advertising; and legal obligation, when regulations require us to retain certain records.',
          'You may withdraw consent at any time through the cookie preferences control on this site, or by unsubscribing from the newsletter. Withdrawing consent does not affect the lawfulness of processing that already happened before you withdrew.',
        ],
      },
      {
        heading: 'How We Share Information',
        paragraphs: [
          'We share data only with the service providers that make the publication work. Our identity and database layer is operated by Supabase, which stores account records. Authentication runs through Google OAuth, subject to Google\u2019s privacy policy. Newsletter delivery, transactional email, and payment processing each run through reputable providers that act on our instructions and are prohibited from using your data for their own purposes.',
          'Advertising partners, including Google AdSense and other programmatic networks we enable, may set cookies subject to the consent choice you made on our cookie banner. When you consent, they may use visit data to show you more relevant advertising on this and other sites; when you decline, they serve non-personalized ads. We do not hand them your name, your email address, or your account record.',
          'We will disclose information when we are legally required to, when it is necessary to protect the rights and safety of our readers or the public, or in connection with a sale or restructuring of the publication, in which case we will notify you before any transfer of your newsletter or account data.',
        ],
      },
      {
        heading: 'International Transfers',
        paragraphs: [
          'Heartsync serves readers worldwide, and the providers we rely on operate data centers in multiple countries. Where your data crosses borders, we rely on the safeguards our providers contractually offer, such as standard contractual clauses, and we select providers that maintain recognized security certifications. If your jurisdiction grants you rights over international transfers, you may ask us which provider countries are involved by writing to us through the Contact page.',
        ],
      },
      {
        heading: 'Data Retention',
        paragraphs: [
          'We keep personal information only as long as it serves a purpose. Account and newsletter records persist until you delete them or unsubscribe. Aggregate analytics are retained as trends, not as records about you. Server logs are rotated on a short cycle. Premium transaction records are kept for the period required by tax and accounting rules, after which they are destroyed.',
          'When you ask us to delete your account, we remove your personal records within thirty days, except where a law requires us to hold on to specific documents, such as receipts, for a defined period.',
        ],
      },
      {
        heading: 'Security',
        paragraphs: [
          'We apply the security practices expected of a modern web publication: encrypted connections, token-based authentication rather than stored passwords, least-privilege access for the small number of people who operate the site, and audit records for administrative actions. No online service can promise perfect security, and we cannot guarantee absolute safety of transmitted data; however, we treat breaches seriously, and if one ever affects you, we will notify you and describe what happened and what we are doing about it.',
        ],
      },
      {
        heading: 'Children',
        paragraphs: [
          'Heartsync writes for adults. Our content discusses intimate relationships, and some of it is candid about topics unsuitable for children. The site is not directed to anyone under sixteen, we do not knowingly collect data from children, and premium memberships require an adult payment method. If you believe a minor has provided us personal information, contact us and we will delete it promptly.',
        ],
      },
      {
        heading: 'Your Rights',
        paragraphs: [
          'Depending on where you live, you may have the right to access the personal data we hold about you, correct it, delete it, export it in a portable format, object to certain processing, and opt out of the sale or sharing of personal information, which we do not engage in anyway. Readers in California may exercise their CCPA rights without discrimination in service quality, and readers in the EEA, the UK, and comparable jurisdictions may lodge a complaint with their supervisory authority.',
          'To exercise any right, write to us from the Contact page. We will verify the request, respond within thirty days, and never charge you for a privacy request. If you want the fastest results, tell us the email address associated with your account or subscription.',
        ],
      },
      {
        heading: 'Changes to This Policy',
        paragraphs: [
          'We review this policy whenever our practices, partners, or obligations change. When we make a material change, we update the review date at the top of this page and, for significant changes affecting your rights, announce it in the newsletter. Continuing to use the site after a change means you accept the updated policy, so we will not bury the changes in quiet edits.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'Questions about privacy deserve a human answer. Reach the editorial team through the Contact page on this site, and we will respond within thirty days.',
        ],
      },
    ],
  },

  terms: {
    kicker: 'Heartsync Legal',
    title: 'Terms of Service',
    updated: 'September 21, 2026',
    sections: [
      {
        heading: 'The Agreement Between You and Heartsync',
        paragraphs: [
          'These Terms of Service are a binding agreement between you and Heartsync, the operator of this website, covering every way you use the publication: browsing essays, subscribing to the newsletter, creating an account, contributing comments, using self-assessments, and holding a premium membership. By using the site, you accept these terms. If you do not accept them, please close the site; there is no partial arrangement in which the reading is welcome but the terms are not.',
          'We may update these terms as the publication grows. When a change is material, we will say so, and the review date at the top of this document will move. If you keep using Heartsync after a change takes effect, you agree to the revised terms.',
        ],
      },
      {
        heading: 'What Heartsync Is',
        paragraphs: [
          'Heartsync publishes essays, guides, and interactive self-reflection tools about relationships, attachment, communication, and emotional wellness. Our writing is educational journalism informed by research, and it is not medical care, psychotherapy, or a substitute for either. Our separate Disclaimer and Privacy Policy pages carry the full details of those promises, and they are incorporated into this agreement by reference.',
        ],
      },
      {
        heading: 'Accounts',
        paragraphs: [
          'You can read almost everything on Heartsync without an account. Creating one, through Google sign-in, adds conveniences like saved articles and premium access. You are responsible for keeping your sign-in credentials secure and for what happens through your account, so do not share it. If you notice activity you did not authorize, tell us and we will help you secure it.',
          'You must be at least sixteen years old to hold an account, and premium memberships require you to be an adult in your jurisdiction with authority over the payment method used. Provide accurate information when we ask for it, and do not impersonate anyone or misrepresent your affiliation to any person or organization.',
        ],
      },
      {
        heading: 'Acceptable Use',
        paragraphs: [
          'You agree not to misuse Heartsync. Concretely: do not scrape, bulk-download, or systematically extract our content or data; do not resell, republish, or syndicate our essays without written permission; do not use our comment areas, contact forms, or newsletter replies to harass, dox, defame, or threaten anyone; do not upload malware, attempt to breach our security, or interfere with the service through automated means; and do not harvest our catalog or user contributions to train commercial machine-learning datasets without our explicit written consent.',
          'We may suspend or terminate access for violations, and where behavior is unlawful or threatening, we cooperate with authorities. Most situations are ordinary human friction, and when that happens we will simply ask you to stop, but the decision on enforcement is ours.',
        ],
      },
      {
        heading: 'Our Content and Your Limited License',
        paragraphs: [
          'The essays, illustrations, assessments, and site design on Heartsync are owned by us and our licensors. You may read, share links to, and quote from them for personal, non-commercial purposes, with attribution and a link. You may not republish whole articles, translate and redistribute them, sell them, or present them as your own work. If you want to license or syndicate our writing, write to the editorial team first; we say yes more often than people expect, but permission has to be asked.',
          'You keep ownership of anything you submit to us, such as a comment or a reply to the newsletter. By submitting it, you grant Heartsync a non-exclusive, worldwide, royalty-free license to host, display, and distribute it in connection with the publication, so that we can actually show it to readers. You promise you have the rights to what you submit, and you understand that comments, once published, may be cached by search engines and readers even if we later remove them.',
        ],
      },
      {
        heading: 'Premium Memberships and Billing',
        paragraphs: [
          'Premium memberships unlock member-only essays, workshops, and tools for the period you select. Memberships renew automatically until you cancel. You can cancel at any time from your account or by writing to us, and cancellation takes effect at the end of the current period, which you have already paid for. Prices may change with notice before your next renewal, and you may cancel rather than accept a new price.',
          'Payments are processed by third-party providers; we do not store your card details. If we ever issue refunds, we issue them to the original payment method. If a technical failure locks you out of something you paid for, contact us and we will make it right.',
        ],
      },
      {
        heading: 'Third-Party Services and Links',
        paragraphs: [
          'We reference books, studies, practitioners, and services we trust, and we run advertising from programmatic networks. Those third parties are responsible for their own content, products, and privacy practices. A link, an ad, or a book recommendation is not an endorsement of a commercial relationship you then enter, and we are not a party to it.',
        ],
      },
      {
        heading: 'Disclaimers and Limitation of Liability',
        paragraphs: [
          'The service is provided as is. We work hard to keep Heartsync accurate, available, and useful, but we do not warrant that it will be uninterrupted, error-free, or continuously suited to your purposes. Our content is educational and reflects our editorial judgment on the date of publication; it may be revised, and it may contain errors despite our best efforts.',
          'To the maximum extent permitted by law, Heartsync and its team are not liable for indirect, incidental, special, or consequential damages arising from your use of the site, and our aggregate liability for any claim is limited to the greater of the amount you paid us in the twelve months before the claim, or one hundred US dollars. Some jurisdictions do not allow certain limitations, in which case those limits apply to you only as far as your law permits.',
          'You agree to indemnify and hold Heartsync harmless from claims, damages, and expenses arising from your violation of these terms or your misuse of the service, to the extent permitted by law.',
        ],
      },
      {
        heading: 'Termination and Availability',
        paragraphs: [
          'You may stop using Heartsync at any time; no explanation owed. We may also restrict or end access for conduct that breaks these terms, for accounts dormant for extended periods, or if we discontinue a feature. We aim to keep the publication running, but features may change, pause, or retire as we learn and grow.',
        ],
      },
      {
        heading: 'Governing Law and Disputes',
        paragraphs: [
          'These terms are governed by the laws of the jurisdiction in which the Heartsync operator is established, without regard to conflict-of-law rules. We would rather fix a problem than litigate one, so before commencing any formal proceeding, please contact us so we have a fair chance to resolve it. If a dispute proceeds, it will be brought in the competent courts of the operator\u2019s jurisdiction, and where consumer protection law of your residence grants you a different forum, that law prevails for you.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'For questions about these terms, licensing, accounts, or billing, write to the editorial team through the Contact page on this site.',
        ],
      },
    ],
  },

  disclaimer: {
    kicker: 'Heartsync Legal',
    title: 'Editorial & Professional Disclaimer',
    updated: 'September 21, 2026',
    sections: [
      {
        heading: 'Why This Page Exists',
        paragraphs: [
          'Heartsync writes candidly about relationships, attachment, conflict, intimacy, and emotional wellness because those subjects matter and deserve more than vague reassurance. But candor creates a risk of confusion: a reader in pain can mistake a well-argued essay for a treatment plan. This page exists to draw that line clearly, so you know exactly what our words are and are not.',
          'In short: everything on Heartsync is educational content created for reflection and general information. Nothing on this site is medical advice, psychotherapy, counseling, diagnosis, or a professional service of any kind. No reader-therapist, doctor-patient, or client-professional relationship is created by reading, subscribing, commenting, or holding a premium membership.',
        ],
      },
      {
        heading: 'Our Content Is Education, Not Treatment',
        paragraphs: [
          'Our essays explain concepts from attachment theory, relationship science, and emotional regulation work, often citing research and the work of clinicians we respect. Explaining an idea is not the same as applying it to your life. A piece about anxious attachment may describe your experience with uncanny accuracy and still be the wrong map for your particular situation, because a professional looking at your whole context might read that situation entirely differently.',
          'Relationships are shaped by history, mental health, culture, safety, and a hundred factors a publication cannot see. Two readers with the same complaint can need opposite responses. That is precisely why general writing cannot substitute for individual care, and why we keep urging you toward qualified professionals whenever the stakes are real.',
        ],
      },
      {
        heading: 'Self-Assessments and Interactive Tools',
        paragraphs: [
          'The quizzes and self-checks on Heartsync, including our attachment-style assessment, are structured reflections, not psychometric instruments. They are designed to help you notice patterns and think in new frameworks; they are not diagnostic tests, they have not been validated for clinical use on you specifically, and their results should never be treated as a label for yourself or a partner.',
          'Likewise, the interactive tools on the site, including the Heartsync Guide assistant, provide general information drawn from our editorial perspective. Their outputs are not personalized professional advice, and they cannot consider your safety, history, or circumstances the way a professional can.',
        ],
      },
      {
        heading: 'If You Are in Crisis',
        paragraphs: [
          'Some of our essays discuss loneliness, betrayal, conflict, and emotional pain. If reading about a topic leaves you feeling unsafe or hopeless, please stop reading and reach toward real help: a licensed therapist, a doctor, or a trusted person in your life. If you are in immediate danger, or you are thinking about harming yourself or someone else, contact your local emergency number immediately.',
          'In the United States, the 988 Suicide and Crisis Lifeline can be reached by calling or texting 988. In the United Kingdom, Samaritans operates at 116 123. In Nigeria, crisis support lines such as the ones maintained by national mental health initiatives are reachable by phone, and your local emergency services are available everywhere. Wherever you are, a crisis line or emergency service in your country exists, and using it is not weakness; it is exactly the kind of self-responsibility our writing hopes to encourage.',
        ],
      },
      {
        heading: 'Accuracy, Currency, and Errors',
        paragraphs: [
          'We research carefully, cite where we can, and revise essays when our understanding changes. But our content reflects editorial judgment as of the date of publication, science in this field evolves, and we are human. We do not warrant that any article is complete, current, or error-free, and we disclaim liability for actions taken, or actions not taken, in reliance on what you read here.',
          'If you believe something we published is wrong, tell us. Corrections are a normal part of editorial work, not an embarrassment to hide.',
        ],
      },
      {
        heading: 'Advertising, Sponsorship, and Affiliate Relationships',
        paragraphs: [
          'Heartsync displays programmatic advertising, including Google AdSense, and may occasionally feature sponsored placements or affiliate links, which earn us a commission when a purchase is made through them. Advertising revenue keeps essays free for readers, and it does not buy influence over what we write: we do not accept payment to review a product favorably, to omit criticism, or to endorse something we would not otherwise mention.',
          'When a specific piece contains sponsored or affiliate material, we say so within that piece. Ads served by networks reflect the network\u2019s judgment and your consent choices, not ours, and we do not control which advertisers appear in a given slot.',
        ],
      },
      {
        heading: 'External Links and Third-Party Resources',
        paragraphs: [
          'We link to books, studies, tools, and organizations because they are useful, not because we vouch for everything on the other end of the link. We are not responsible for the content, availability, accuracy, or privacy practices of third-party websites and services, and following an external link means you are subject to that site\u2019s own terms and policies.',
        ],
      },
      {
        heading: 'Results and Responsibility',
        paragraphs: [
          'The practices we describe, communication scripts, reflection exercises, and boundary work, work differently for different people in different circumstances. We do not promise any particular outcome for your relationship or your emotional life. You remain responsible for your choices, and we encourage you to weigh our general ideas against your own judgment and, where appropriate, the judgment of professionals who know you.',
          'Reading about healthy relationships is a good step. It is not the only step, and it is not a substitute for the rest of what real support looks like. We are glad to be part of your reading life; we should never be the whole of your support system.',
        ],
      },
      {
        heading: 'Illustrative Stories and Examples',
        paragraphs: [
          'When we describe a couple, an argument, or a moment of repair, we are usually drawing on composite or illustrative scenarios. Details are changed, situations are condensed, and identifying circumstances are removed, so any resemblance to a specific person is coincidental and unintentional. Composite examples exist to make a pattern legible, not to describe real, identifiable clients of any practitioner.',
          'Similarly, where we share reader stories or community contributions, they reflect that reader’s experience and opinion, not ours, and publishing them is not a clinical endorsement. Anecdotes are among the weakest forms of evidence in a field that already deals in probabilities, and we try to treat them accordingly, as color rather than proof.',
        ],
      },
      {
        heading: 'Questions',
        paragraphs: [
          'If anything in this disclaimer is unclear, or if you want to ask whether a specific piece applies to your situation, write to the editorial team through the Contact page. We read what readers send, and we take this responsibility seriously.',
        ],
      },
    ],
  },

  cookies: {
    kicker: 'Heartsync Legal',
    title: 'Cookie Policy',
    updated: 'September 21, 2026',
    sections: [
      {
        heading: 'What This Policy Explains',
        paragraphs: [
          'This Cookie Policy describes the cookies and similar browser technologies Heartsync uses, why each one exists, and how you can control them. It is written to be read, not skimmed past a consent banner, because informed consent is the only kind worth having. It works alongside our Privacy Policy, which explains how we handle personal data generally.',
          'A cookie is a small text file a website stores in your browser. Local storage, its close cousin, works similarly and is how Heartsync remembers preferences like your reading theme, font size, and saved articles on your own device. Neither technology can read your files or watch your screen; they store specific values the site itself sets, and your browser shows you everything they contain if you want to look.',
        ],
      },
      {
        heading: 'Strictly Necessary Technologies',
        paragraphs: [
          'Some mechanisms keep the site functioning and secure, and it cannot operate without them. These include the session tokens issued when you sign in with Google, which keep you authenticated between pages; security tokens that protect forms against forgery; and the record of the consent choice you made on our banner, which we store precisely so we can respect your decision on every future visit.',
          'Because these mechanisms are required to deliver the service you request, they are set without asking permission first. This is standard, narrow, and in your interest: signing in is impossible if the sign-in cannot remember you between one page and the next.',
        ],
      },
      {
        heading: 'Functional and Preference Storage',
        paragraphs: [
          'Heartsync remembers your choices locally: light or dark theme, reading preferences, bookmarks, likes, quiz progress, and the articles you have already read. This data lives in your browser\u2019s own storage and does not travel to our servers unless a feature requires it. Clearing your browser storage resets these conveniences, and the site will simply ask again or start fresh.',
        ],
      },
      {
        heading: 'Analytics and Measurement',
        paragraphs: [
          'We count pageviews and aggregate engagement to understand which essays serve readers and when something breaks. Measurement on Heartsync is deliberately coarse: we look at trends across readers, not dossiers about individuals. Where measurement cookies are non-essential, they are governed by the consent you gave, and declining them does not restrict your access to a single article.',
        ],
      },
      {
        heading: 'Advertising Cookies',
        paragraphs: [
          'Heartsync is funded by advertising and memberships. The ads you see come from networks, including Google AdSense and other programmatic partners, and those networks may set their own cookies to cap how often you see an ad, detect invalid traffic, and, when you consent, to personalize advertising based on your visits to this and other sites.',
          'Your consent choice on our banner controls this. If you consent, ad partners may treat your visit data as a signal for more relevant advertising across their networks. If you decline, they serve non-personalized ads, which use your current context, the page you are on, and coarse geography, but not your cross-site behavior. You can change your mind at any time through the Cookie Preferences control on this site, and your new choice takes effect on your next pageview.',
          'You can also opt out of personalized advertising directly with the largest networks, including through Google Ads Settings, and Google\u2019s policies page explains how its advertising products use data. Opting out does not mean fewer ads; it means less relevant ones, which is a trade we respect you making knowingly.',
        ],
      },
      {
        heading: 'Managing Cookies in Your Browser',
        paragraphs: [
          'Every major browser lets you view, block, or delete cookies for a specific site. In Chrome, Firefox, and Safari, the settings panels under Privacy and Security show exactly what each site has stored. Blocking all cookies will break sign-in and preferences on most websites, including ours, so we suggest blocking third-party cookies if you want a strong default, and site-by-site control for specific cases.',
          'Browsers also offer private or incognito windows, which start with clean storage each time. That is a reasonable way to read Heartsync without accumulating local state, at the cost of the site forgetting your preferences.',
        ],
      },
      {
        heading: 'Who Sets Cookies on This Site',
        paragraphs: [
          'First-party storage is set by Heartsync itself and covers your preferences and session. Third-party cookies, when permitted, are set by Google as our identity and advertising partner and by the programmatic networks we enable, each of which publishes its own policies. We do not grant partners permissions beyond the narrow purposes described in this policy, and we review which networks are enabled as the publication\u2019s needs change.',
        ],
      },
      {
        heading: 'How Long Cookies and Local Data Last',
        paragraphs: [
          'Strictly necessary session cookies last as long as your session or sign-in period, typically hours to days, and are renewed automatically while you remain signed in. Your consent record persists so the site can honor your banner choice, and it survives until you change it. Preference storage in your browser, such as theme and saved articles, has no expiry at all; it exists until you clear it or your browser does.',
          'Advertising cookies follow each network’s own lifecycle, which commonly ranges from days to over a year depending on their purpose, such as frequency capping versus long-term interest association. We do not extend those lifetimes ourselves, and networks must honor the non-personalized mode you selected where the request falls outside your consent.',
        ],
      },
      {
        heading: 'Global Privacy Control and Similar Signals',
        paragraphs: [
          'Some browsers and privacy tools send a Global Privacy Control or Do Not Track signal that expresses a standing opt-out preference. Where we or our partners can read and honor such a signal under the rules that apply to you, we do, treating it as a request to decline non-essential and personalized-advertising storage without making you click anything. If you notice the site behaving as though you consented when you have sent such a signal, write to us; mismatches happen, and we want to know about them.',
        ],
      },
      {
        heading: 'Changes to This Policy',
        paragraphs: [
          'When we add or remove an advertising partner, change our measurement approach, or add a feature that uses browser storage in a new way, we will update this page and move the review date at the top. For significant changes affecting your consent, we will ask again through the banner rather than assume your old choice covers something new.',
          'If any part of this policy is unclear, write to us from the Contact page and a person will answer. Consent that cannot be questioned is not consent at all.',
        ],
      },
    ],
  },
};
