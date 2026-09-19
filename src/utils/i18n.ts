// Multi-language Translation Engine for Heartsync SaaS
import { heartsync } from '../store';
export type Language = 
  | 'en' | 'es' | 'de' | 'fr' | 'it' | 'pt' | 'ar' | 'zh' | 'ja' | 'ru' 
  | 'tr' | 'hi' | 'yo' | 'ig' | 'ha' | 'sw' | 'nl' | 'pl' | 'ko' | 'vi' 
  | 'uk' | 'sv' | 'el' | 'he' | 'th' | 'id' | 'fa' | 'no' | 'fi' | 'da' 
  | 'cs' | 'bn' | 'ur';

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    es: string;
    de: string;
    fr: string;
    [lang: string]: string;
  };
}

export const translations: TranslationDictionary = {
  // Navigation
  home: {
    en: 'Home',
    es: 'Inicio',
    de: 'Startseite',
    fr: 'Accueil'
  },
  articles: {
    en: 'Articles',
    es: 'Artículos',
    de: 'Artikel',
    fr: 'Articles'
  },
  categories: {
    en: 'Categories',
    es: 'Categorías',
    de: 'Kategorien',
    fr: 'Catégories'
  },
  faq: {
    en: 'FAQ',
    es: 'Preguntas',
    de: 'FAQ',
    fr: 'FAQ'
  },
  about: {
    en: 'About Care',
    es: 'Acerca de',
    de: 'Über uns',
    fr: 'À propos'
  },
  contact: {
    en: 'Contact Us',
    es: 'Contacto',
    de: 'Kontakt',
    fr: 'Contact'
  },
  newsletter: {
    en: 'Newsletter',
    es: 'Boletín',
    de: 'Rundbrief',
    fr: 'Bulletin'
  },
  adminConsole: {
    en: 'Admin Console',
    es: 'Consola Admin',
    de: 'Admin-Konsole',
    fr: 'Console Admin'
  },
  
  // Hero Section
  heroTitle: {
    en: 'Scientific Frameworks for Romantic Alignment',
    es: 'Modelos Científicos para la Armonía Amorosa',
    de: 'Wissenschaftliche Ansätze für Partnerschaften',
    fr: 'Approches Scientifiques pour l\'Alignement Amoureux'
  },
  heroSubtitle: {
    en: 'Explore relationship psychology, attachment science, and mindful communication to build lasting bonds through empirical emotional analysis.',
    es: 'Explore la psicología de las relaciones, la ciencia del apego y la comunicación consciente para construir vínculos duraderos.',
    de: 'Erforschen Sie Beziehungspsychologie, Bindungsforschung und achtsame Kommunikation für dauerhafte emotionale Verbindungen.',
    fr: 'Explorez la psychologie des relations, la science de l\'attachement et la communication consciente pour bâtir des liens durables.'
  },
  browseBtn: {
    en: 'Explore Wellness Journals',
    es: 'Explorar Publicaciones',
    de: 'Journale Durchsuchen',
    fr: 'Explorer les Journaux'
  },
  readTime: {
    en: 'min read',
    es: 'min de lectura',
    de: 'Minuten Lesezeit',
    fr: 'min de lecture'
  },

  // Interactive AI Relationship Client
  aiBotTitle: {
    en: 'Relationship Alignment AI Assistant',
    es: 'Asistente de IA para Relaciones Personales',
    de: 'KI-Beziehungsassistent',
    fr: 'Assistant IA pour Relations'
  },
  aiBotPromptPlaceholder: {
    en: 'Ask our relationship AI about attachment, boundaries, or connection triggers...',
    es: 'Pregunte a la IA sobre apego, límites o desencadenantes recurrentes...',
    de: 'Fragen Sie unsere KI nach Bindungen, Grenzen oder Mustern...',
    fr: 'Posez vos questions sur l\'attachement, les limites ou les schémas de couple...'
  },
  aiWelcome: {
    en: 'Hello! I am Heartsync’s relationship AI advisor. Tell me about standard relational blocks you are experiencing.',
    es: '¡Hola! Soy la IA de relaciones de Heartsync. Cuénteme sobre los bloqueos relacionales que está experimentando.',
    de: 'Hallo! Ich bin die Beziehungs-KI von Heartsync. Erzählen Sie mir von Ihren Beziehungsherausforderungen.',
    fr: 'Bonjour ! Je suis l\'IA de relation de Heartsync. Parlez-moi des difficultés relationnelles que vous rencontrez.'
  },
  
  // App Support Ticketing
  supportTitle: {
    en: 'Heartsync Care & Help Desk',
    es: 'Soporte y Centro de Ayuda',
    de: 'Heartsync Helpdesk & Support-Schnittstelle',
    fr: 'Support Heartsync & Centre d\'Aide'
  },
  supportSubtitle: {
    en: 'Submit secure tickets regarding premium content locks, billing inquiries, or professional consulting services.',
    es: 'Envíe consultas sobre contenido Premium, facturación o asesoría profesional.',
    de: 'Senden Sie Tickets zu Premium-Inhalten, Abrechnungen oder professioneller Beratung.',
    fr: 'Soumettez des demandes concernant le contenu premium, la facturation ou le conseil professionnel.'
  },

  // Widgets & Miscellaneous
  searchPlaceholder: {
    en: 'Search relationship & love advice...',
    es: 'Buscar consejos amorosos...',
    de: 'Suche nach Beziehungs- & Liebesratschlägen...',
    fr: 'Rechercher des conseils en amour...'
  },
  trendingTitle: {
    en: 'Trending Relationship Guides',
    es: 'Guías de Relaciones del Momento',
    de: 'Beliebte Beziehungsratgeber',
    fr: 'Guides de Relations Tendances'
  },
  commentsTitle: {
    en: 'Community Discussion',
    es: 'Discusión de la Comunidad',
    de: 'Gemeinschaftsdiskussion',
    fr: 'Discussion Communautaire'
  },
  subscribeTitle: {
    en: 'Join Heartsync Weekly Digest',
    es: 'Suscríbase al Resumen de Heartsync',
    de: 'Abonnieren Sie unseren Wochenbericht',
    fr: 'Rejoindre la Lettre d\'Information'
  },
  subscribePlaceholder: {
    en: 'Enter your email address...',
    es: 'Escriba su correo electrónico...',
    de: 'Geben Sie Ihre E-Mail ein...',
    fr: 'Entrez votre adresse e-mail...'
  },
  subscribeBtn: {
    en: 'Join Weekly Digest',
    es: 'Suscribirse',
    de: 'Abonnieren',
    fr: 'S\'abonner'
  },
  newsletterPortal: {
    en: 'Newsletter Portal',
    es: 'Portal del boletín',
    de: 'Newsletter-Portal',
    fr: 'Portail du bulletin'
  },
  receiveSteps: {
    en: 'Receive secure weekly steps...',
    es: 'Reciba pasos semanales seguros...',
    de: 'Erhalten Sie sichere wöchentliche Schritte...',
    fr: 'Recevez des étapes hebdomadaires sécurisées...'
  },
  policyDisclosure: {
    en: 'Heartsync acts as a modern journal of wellness ideas. We integrate non-intrusive placeholders compliant with the Better Ads Standards. Our articles use human-edited material. Consult professional advisors for personal relationship guidance.',
    es: 'Heartsync actúa como un diario moderno de ideas de bienestar. Integramos marcadores de posición no intrusivos que cumplen con los Better Ads Standards. Nuestros artículos utilizan material editado por humanos. Consulte a asesores profesionales para la orientación de relaciones personales.',
    de: 'Heartsync fungiert als modernes Journal für Wellness-Ideen. Wir integrieren nicht-intrusive Platzhalter, die den Better Ads Standards entsprechen. Unsere Artikel verwenden von Menschen editiertes Material. Wenden Sie sich für eine Beziehungsberatung an professionelle Berater.',
    fr: 'Heartsync agit comme un journal moderne d\'idées de bien-être. Nous intégrons des espaces réservés non intrusifs conformes aux Better Ads Standards. Nos articles utilisent du matériel édité par des humains. Consultez des conseillers professionnels pour l\'orientation de relation personnelle.'
  },
  rightsReserved: {
    en: 'All Rights Reserved. Co-powered by DeepMind Antigravity and clean React context interfaces.',
    es: 'Todos los derechos reservados. Co-impulsado por DeepMind Antigravity e interfaces de contexto React limpias.',
    de: 'Alle Rechte vorbehalten. Unterstützt von DeepMind Antigravity und sauberen React-Kontextschnittstellen.',
    fr: 'Tous droits réservés. Co-propulsé par DeepMind Antigravity et des interfaces de contexte React épurées.'
  },
  platform: {
    en: 'Platform',
    es: 'Plataforma',
    de: 'Plattform',
    fr: 'Plateforme'
  },
  legalBoundaries: {
    en: 'Legal Boundaries',
    es: 'Límites Legales',
    de: 'Rechtliche Rahmenbedingungen',
    fr: 'Limites Légales'
  },
  termsOfService: {
    en: 'Terms of Service',
    es: 'Términos de Servicio',
    de: 'Nutzungsbedingungen',
    fr: 'Conditions d\'Utilisation'
  },
  privacyPolicy: {
    en: 'Privacy Policy',
    es: 'Política de Privacidad',
    de: 'Datenschutzrichtlinie',
    fr: 'Politique de Confidentialité'
  },
  cookiePolicy: {
    en: 'Cookie Policy',
    es: 'Política de Cookies',
    de: 'Cookie-Richtlinie',
    fr: 'Politique relative aux Cookies'
  },
  disclaimer: {
    en: 'Disclaimer Statement',
    es: 'Descargo de Responsabilidad',
    de: 'Haftungsausschluss',
    fr: 'Clause de Non-Responsabilité'
  },
  topics: {
    en: 'Topics',
    es: 'Temas',
    de: 'Themen',
    fr: 'Sujets'
  },
  browseAllCategories: {
    en: 'Browse All Categories',
    es: 'Ver Todas las Categorías',
    de: 'Alle Kategorien Durchsuchen',
    fr: 'Parcourir les Catégories'
  },
  successCheck: {
    en: 'Success! Check your welcome message.',
    es: '¡Éxito! Revise su mensaje de bienvenida.',
    de: 'Erfolg! Überprüfen Sie Ihre Willkommensnachricht.',
    fr: 'Succès ! Vérifiez votre message de bienvenue.'
  }
};

export function getTranslation(key: string, lang: Language = 'en'): string {
  if (translations[key]) {
    return translations[key]['en'] || translations[key][lang] || key;
  }
  return key;
}

export const getSavedLanguage = (): Language => {
  return 'en';
};

export const saveLanguage = (_lang: Language): void => {
  try {
    heartsync.setLocalStorage('hs_lang', 'en');
  } catch (e) {}
};

export function isRTL(_lang: Language): boolean {
  return false;
}

export const getEnabledLanguages = (): Language[] => {
  return ['en'];
};

export const setEnabledLanguages = (_langs: Language[]): void => {
  try {
    heartsync.setLocalStorage('hs_enabled_languages', JSON.stringify(['en']));
  } catch (e) {}
};

export const getSiteDefaultLanguage = (): Language => {
  return 'en';
};

export const setSiteDefaultLanguage = (_lang: Language): void => {
  try {
    heartsync.setLocalStorage('hs_default_language', 'en');
  } catch (e) {}
};
