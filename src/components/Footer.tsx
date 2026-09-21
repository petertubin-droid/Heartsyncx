import React, { useState } from 'react';
import { heartsync } from '../store';
import { Heart, Send, CheckCircle2, AlertCircle, Mail, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { Language, getTranslation } from '../utils/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FooterProps {
  onNavigate: (tab: string, arg?: string) => void;
  siteSettings: typeof heartsync.site_settings;
  lang: Language;
}

export default function Footer({ onNavigate, siteSettings, lang = 'en' }: FooterProps) {
  const [email, setEmail] = useState('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessStatus(false);

    if (!email || !email.includes('@')) {
      setErrorStatus('Please provide a valid, functional email address.');
      return;
    }

    const success = heartsync.subscribeNewsletter(email, 'footer');
    if (success) {
      setSuccessStatus(true);
      setEmail('');
    } else {
      setErrorStatus(`You are already connected to ${siteSettings.site_name || 'Heartsync'} newsletters!`);
    }
  };

  const footerStyleSet = siteSettings.footer_style || 'luxury';

  let footerBgClass = "w-full border-t relative overflow-hidden transition-colors duration-300 dark:border-rose-500/20 dark:shadow-[0_-8px_30px_-14px_rgba(244,63,94,0.15)] ";
  let titleClass = "text-xs font-bold uppercase tracking-widest text-zinc-100 font-mono";
  let textClass = "text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400";
  let descClass = "text-zinc-400";
  let subBg = "bg-zinc-900/60 border border-zinc-800";
  let botBg = "border-t border-zinc-900 bg-zinc-950/85";
  let rightReservedClass = "text-zinc-650";

  if (footerStyleSet === 'luxury') {
    footerBgClass += "bg-zinc-950 text-zinc-100 border-rose-950/40";
    titleClass = "text-xs font-bold uppercase tracking-widest text-zinc-100 font-mono";
    textClass = "text-zinc-400 hover:text-rose-400";
    descClass = "text-zinc-400 text-xs font-sans leading-relaxed max-w-sm";
    subBg = "bg-zinc-900/60 border border-zinc-800";
    botBg = "border-t border-zinc-900 bg-zinc-950/85";
  } else if (footerStyleSet === 'cream') {
    footerBgClass += "bg-[#FAF7F2] text-zinc-800 border-[#E8DFC2]";
    titleClass = "text-xs font-bold uppercase tracking-widest text-zinc-900 font-sans block border-b border-[#E8DFC2]/60 pb-1.5";
    textClass = "text-zinc-600 hover:text-rose-600";
    descClass = "text-zinc-600 text-xs font-sans leading-relaxed max-w-sm";
    subBg = "bg-[#F3EFE9] border border-[#E8DFC2]/80";
    botBg = "border-t border-[#E8DFC2] bg-[#FAF7F2]";
  } else if (footerStyleSet === 'minimalist') {
    footerBgClass += "bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-250/60 dark:border-zinc-900";
    titleClass = "text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-sans block";
    textClass = "text-zinc-500 hover:text-rose-500 dark:text-zinc-400 dark:hover:text-rose-400";
    descClass = "text-zinc-500 dark:text-zinc-400 text-xs font-sans leading-relaxed max-w-sm";
    subBg = "bg-zinc-100/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800";
    botBg = "border-t border-zinc-150 dark:border-zinc-900/50 bg-white/50 dark:bg-zinc-950/85";
  } else if (footerStyleSet === 'triple') {
    footerBgClass += "bg-gradient-to-tr from-zinc-900 to-zinc-950 text-zinc-200 border-zinc-850";
    titleClass = "text-sm font-serif font-extrabold text-zinc-100 tracking-tight block";
    textClass = "text-zinc-450 hover:text-rose-400";
    descClass = "text-zinc-400 text-xs font-sans leading-relaxed max-w-sm";
    subBg = "bg-zinc-800/40 border border-zinc-700/80";
    botBg = "border-t border-zinc-800 bg-zinc-950/90";
  }

  const logoColorTheme = footerStyleSet === 'cream' ? 'text-zinc-900' : 'bg-gradient-to-r from-rose-400 via-rose-300 to-fuchsia-400 bg-clip-text text-transparent';

  const layoutWidthSetting = siteSettings.layout_width || 'contained';
  const footerContainerClass = layoutWidthSetting === 'wide'
    ? 'w-full px-6 py-12 lg:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 relative z-10'
    : 'max-w-[1536px] mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 relative z-10';

  return (
    <footer className={footerBgClass}>
      
      {/* Absolute decorative glow background */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-rose-900/10 to-fuchsia-950/15 blur-[40px] rounded-full pointer-events-none opacity-40" />

      {/* Main Footer Container */}
      <div className={footerContainerClass}>
        
        {/* Brand Core Column */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
            {siteSettings.logo_url ? (
              <img 
                src={siteSettings.logo_url} 
                alt={siteSettings.site_name || 'Heartsync'} 
                className="w-8 h-8 rounded-lg object-cover shadow-md"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-fuchsia-500 flex items-center justify-center text-white">
                <Heart className="w-4.5 h-4.5" fill="white" />
              </div>
            )}
            <span className={`font-sans font-bold text-lg tracking-tight ${logoColorTheme}`}>
              {siteSettings.site_name || 'Heartsync'}
            </span>
          </div>
          <p className={`${descClass} text-xs font-sans leading-relaxed max-w-sm`}>
            {siteSettings.site_description || `${siteSettings.site_name || 'Heartsync'} is a premium, research-driven emotional wellness hub exploring attachment psychology, trauma-informed intimacy resolution, modern dating dynamics, and human alignment.`}
          </p>
          
          {/* Newsletter signup form inside brand stack */}
          <div className={`${subBg} p-4 sm:p-5 rounded-2xl space-y-3.5 max-w-sm dark:border-rose-500/10 dark:shadow-[0_0_15px_rgba(244,63,94,0.05)]`}>
            <div className={`flex items-center gap-1.5 text-xs ${footerStyleSet === 'cream' ? 'text-zinc-800' : 'text-rose-300'} font-sans font-medium`}>
              <Mail className="w-4 h-4" />
              <span>{siteSettings.site_name || 'Heartsync'} {getTranslation('newsletterPortal', lang)}</span>
            </div>
            <form onSubmit={handleSubscribe} className="flex gap-2 items-center">
              <Input 
                type="email" 
                placeholder={getTranslation('receiveSteps', lang)} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-xs dark:bg-zinc-950/80 border-zinc-800 focus-visible:ring-rose-500"
              />
              <Button 
                type="submit"
                size="sm"
                className="bg-rose-500 hover:bg-rose-600 text-white cursor-pointer h-9 shrink-0 px-3"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
            {errorStatus && (
              <div className="flex items-center gap-1 text-[10px] text-rose-400 font-sans">
                <AlertCircle className="w-3 h-3 text-rose-300 shrink-0" />
                <span>{errorStatus}</span>
              </div>
            )}
            {successStatus && (
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-sans">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{getTranslation('successCheck', lang)}</span>
              </div>
            )}
          </div>

          {/* Social Media Follow Icons */}
          {(() => {
            const facebookUrl = siteSettings.social_facebook_url || siteSettings.social_links?.facebook;
            const twitterUrl = siteSettings.social_twitter_url || siteSettings.social_links?.twitter;
            const instagramUrl = siteSettings.social_instagram_url || siteSettings.social_links?.instagram;
            const linkedinUrl = siteSettings.social_linkedin_url || (siteSettings.social_links as any)?.linkedin;
            const youtubeUrl = siteSettings.social_youtube_url || (siteSettings.social_links as any)?.youtube;

            const hasSocial = facebookUrl || twitterUrl || instagramUrl || linkedinUrl || youtubeUrl;
            if (!hasSocial) return null;

            return (
              <div className="flex items-center gap-3 pt-2 flex-wrap">
                {facebookUrl && (
                  <a 
                    href={facebookUrl} 
                    target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-900/50 hover:bg-rose-500 hover:text-white hover:border-transparent text-zinc-400 border border-zinc-800/80 transition-all cursor-pointer shadow-xs md:w-9 md:h-9"
                    title="Follow on Facebook"
                  >
                    <Facebook className="w-4 h-4 md:w-4.5 md:h-4.5" />
                  </a>
                )}
                {twitterUrl && (
                  <a 
                    href={twitterUrl} 
                    target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-900/50 hover:bg-rose-500 hover:text-white hover:border-transparent text-zinc-400 border border-zinc-800/80 transition-all cursor-pointer shadow-xs md:w-9 md:h-9"
                    title="Follow on Twitter / X"
                  >
                    <Twitter className="w-4 h-4 md:w-4.5 md:h-4.5" />
                  </a>
                )}
                {instagramUrl && (
                  <a 
                    href={instagramUrl} 
                    target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-900/50 hover:bg-rose-500 hover:text-white hover:border-transparent text-zinc-400 border border-zinc-800/80 transition-all cursor-pointer shadow-xs md:w-9 md:h-9"
                    title="Follow on Instagram"
                  >
                    <Instagram className="w-4 h-4 md:w-4.5 md:h-4.5" />
                  </a>
                )}
                {linkedinUrl && (
                  <a 
                    href={linkedinUrl} 
                    target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-900/50 hover:bg-rose-500 hover:text-white hover:border-transparent text-zinc-400 border border-zinc-800/80 transition-all cursor-pointer shadow-xs md:w-9 md:h-9"
                    title="Connect on LinkedIn"
                  >
                    <Linkedin className="w-4 h-4 md:w-5 md:h-5" />
                  </a>
                )}
                {youtubeUrl && (
                  <a 
                    href={youtubeUrl} 
                    target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-900/50 hover:bg-rose-500 hover:text-white hover:border-transparent text-zinc-400 border border-zinc-800/80 transition-all cursor-pointer shadow-xs md:w-9 md:h-9"
                    title="Subscribe on YouTube"
                  >
                    <Youtube className="w-4 h-4 md:w-5 md:h-5" />
                  </a>
                )}
              </div>
            );
          })()}
        </div>

        {/* Column 2, 3, 4: Dynamic/Configurable Footer Sections */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8 relative">

          {/* TOPICS SECTION */}
          <div className="space-y-4">
            <h4 className={`${titleClass}`}>
              {getTranslation('topics', lang)}
            </h4>
            <ul className="space-y-2.5 font-sans text-xs">
              {(heartsync.categories && heartsync.categories.length > 0
                ? heartsync.categories
                : [
                    { id: 'cat-1', name: 'Emotional Wellness', slug: 'emotional-wellness' },
                    { id: 'cat-2', name: 'Relationship Science', slug: 'relationship-science' },
                    { id: 'cat-3', name: 'Mindful Dating', slug: 'mindful-dating' },
                    { id: 'cat-4', name: 'Self Growth', slug: 'self-growth' }
                  ]
              ).map((cat, idx) => (
                <li key={cat.id || idx}>
                  <button 
                    type="button"
                    onClick={() => onNavigate('category', cat.slug)}
                    className={`${textClass} text-left transition-colors cursor-pointer`}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* PLATFORM SECTION */}
          <div className="space-y-4">
            <h4 className={`${titleClass}`}>
              {getTranslation('platform', lang)}
            </h4>
            <ul className="space-y-2.5 font-sans text-xs">
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate('subscription')}
                  className="text-rose-500 font-semibold hover:text-rose-600 text-left transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
                  <span>Premium Membership</span>
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate('faq')}
                  className={`${textClass} text-left transition-colors cursor-pointer`}
                >
                  Help & FAQ
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate('advertise')}
                  className={`${textClass} text-left transition-colors cursor-pointer`}
                >
                  Advertise With Us
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate('about')}
                  className={`${textClass} text-left transition-colors cursor-pointer`}
                >
                  About {siteSettings.site_name || 'Heartsync'}
                </button>
              </li>
            </ul>
          </div>

          {/* LEGAL BOUNDARIES SECTION */}
          <div className="space-y-4">
            <h4 className={`${titleClass}`}>
              {getTranslation('legalBoundaries', lang)}
            </h4>
            <ul className="space-y-2.5 font-sans text-xs">
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate('terms')}
                  className={`${textClass} text-left transition-colors cursor-pointer`}
                >
                  {getTranslation('termsOfService', lang)}
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate('privacy')}
                  className={`${textClass} text-left transition-colors cursor-pointer`}
                >
                  {getTranslation('privacyPolicy', lang)}
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate('cookies')}
                  className={`${textClass} text-left transition-colors cursor-pointer`}
                >
                  {getTranslation('cookiePolicy', lang)}
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => onNavigate('disclaimer')}
                  className={`${textClass} text-left transition-colors cursor-pointer`}
                >
                  {getTranslation('disclaimer', lang)}
                </button>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* AdSense Compliance Disclosures and Copyright panel */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-rose-500/40 to-transparent dark:opacity-60 opacity-30" aria-hidden="true" />

      <div className={`${botBg} py-6 px-6 transition-colors duration-300`}>
        <div className={layoutWidthSetting === 'wide' ? "w-full flex flex-col lg:flex-row items-center justify-between gap-4" : "max-w-[1536px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-4"}>
          
          <div className="space-y-1 text-center lg:text-left">
            <p className={`text-[10px] font-sans ${footerStyleSet === 'cream' ? 'text-zinc-500' : 'text-zinc-500'} max-w-3xl leading-relaxed`}>
              <strong>Professional Disclaimer</strong>: The educational content, relationship assessments, and mindfulness exercises shared on {siteSettings.site_name || 'Heartsync'} are crafted for informational and self-reflective guide purposes only. Our publications do not constitute formal medical treatment or professional counseling. If you find yourself in crisis or severe distress, please seek support from a certified medical adviser, family practitioner, or professional counselor.
            </p>
            <p className={`text-[10px] font-sans ${footerStyleSet === 'cream' ? 'text-zinc-500' : 'text-zinc-650'} mt-1`}>
              {siteSettings.site_copyright_text ? siteSettings.site_copyright_text : `© ${new Date().getFullYear()} ${siteSettings.site_name || 'Heartsync'} Inc. ${getTranslation('rightsReserved', lang)}`}
            </p>
          </div>



        </div>
      </div>
    </footer>
  );
}
