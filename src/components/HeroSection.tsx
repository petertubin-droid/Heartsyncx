import React from 'react';
import { Heart, CheckCircle2 } from 'lucide-react';
import { HeroSettings } from '../types';
import { HeartsyncImage } from './LoadingSystem';

interface HeroSectionProps {
  settings?: HeroSettings;
  onNavigate: (tab: string, arg?: string) => void;
}

// Robust color conversion for backdrop filter overlay styling
const hexToRgba = (hex = '#ffffff', alpha = 100) => {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
  } else if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
  }
  return `rgba(255, 255, 255, ${alpha / 100})`;
};

export default function HeroSection({ settings, onNavigate }: HeroSectionProps) {
  if (!settings) return null;

  const {
    title,
    subtitle,
    badge_text,
    primary_cta_text,
    primary_cta_url,
    secondary_cta_text,
    secondary_cta_url,
    trust_indicators = [],
    statistics = [],
    testimonials = [],
    image_url,
    bg_image_url,
    video_url,
    align = 'center',
    bg_color,
    text_color,
    primary_btn_bg,
    primary_btn_text,
    secondary_btn_bg,
    secondary_btn_text,
    overlay_color = '#000000',
    overlay_opacity = 10,
    height = 'lg',
    element_order = ['badge', 'headline', 'description', 'buttons', 'media', 'statistics', 'testimonials'],
    enabled_sections = {
      badge: true,
      headline: true,
      description: true,
      buttons: true,
      statistics: true,
      testimonials: true,
      media: true
    },
    bg_type = 'solid',
    bg_gradient_start,
    bg_gradient_end,
    bg_gradient_angle = '135deg',
    heading_color,
    subheading_color,
    badge_color,
    badge_bg_color,
    stat_card_bg_color,
    stat_card_text_color,
    bg_position = 'Center Center',
    bg_size = 'Cover',
    bg_repeat = 'No Repeat',
    bg_parallax = false,
    content_bg_type = 'transparent',
    content_bg_color = '#ffffff',
    content_bg_opacity = 30
  } = settings;

  // Height padding map
  const heightClasses = {
    sm: 'py-8 sm:py-12',
    md: 'py-12 sm:py-20',
    lg: 'py-16 sm:py-28',
    screen: 'min-h-[75vh] flex flex-col justify-center py-20'
  };

  // Outer section styling
  const sectionStyle: React.CSSProperties = {};

  if (bg_type === 'solid') {
    if (bg_color) sectionStyle.backgroundColor = bg_color;
  } else if (bg_type === 'gradient') {
    const start = bg_gradient_start || bg_color || '#ffffff';
    const end = bg_gradient_end || '#ffe4e6';
    const angle = bg_gradient_angle || '135deg';
    sectionStyle.backgroundImage = `linear-gradient(${angle}, ${start}, ${end})`;
  } else if (bg_type === 'image' || bg_type === 'overlay') {
    if (bg_image_url) {
      sectionStyle.backgroundImage = `url(${bg_image_url})`;
      
      // Position sizing mapping
      const posMap: Record<string, string> = {
        'Center Center': 'center center',
        'Top Center': 'top center',
        'Bottom Center': 'bottom center',
        'Left Center': 'left center',
        'Right Center': 'right center'
      };
      sectionStyle.backgroundPosition = posMap[bg_position] || 'center';

      const sizeMap: Record<string, string> = {
        'Cover': 'cover',
        'Contain': 'contain',
        'Auto': 'auto'
      };
      sectionStyle.backgroundSize = sizeMap[bg_size] || 'cover';

      const repeatMap: Record<string, string> = {
        'No Repeat': 'no-repeat',
        'Repeat': 'repeat',
        'Repeat X': 'repeat-x',
        'Repeat Y': 'repeat-y'
      };
      sectionStyle.backgroundRepeat = repeatMap[bg_repeat] || 'no-repeat';

      if (bg_parallax) {
        sectionStyle.backgroundAttachment = 'fixed';
      }
    } else if (bg_color) {
      sectionStyle.backgroundColor = bg_color;
    }
  }

  // Text colors custom overrides
  const headingStyle: React.CSSProperties = heading_color ? { color: heading_color } : (text_color ? { color: text_color } : {});
  const bodyStyle: React.CSSProperties = subheading_color ? { color: subheading_color } : (text_color ? { color: text_color + 'e0' } : {});
  
  const badgeStyle: React.CSSProperties = {
    color: badge_color || text_color || undefined,
    borderColor: badge_color ? badge_color + '30' : (text_color ? text_color + '30' : undefined),
    backgroundColor: badge_bg_color || (text_color ? text_color + '0a' : undefined)
  };

  // Custom Button Styles
  const primaryBtnStyle: React.CSSProperties = {};
  if (primary_btn_bg) primaryBtnStyle.backgroundColor = primary_btn_bg;
  if (primary_btn_text) primaryBtnStyle.color = primary_btn_text;

  const secondaryBtnStyle: React.CSSProperties = {};
  if (secondary_btn_bg) secondaryBtnStyle.backgroundColor = secondary_btn_bg;
  if (secondary_btn_text) {
    secondaryBtnStyle.color = secondary_btn_text;
    secondaryBtnStyle.borderColor = secondary_btn_text + '30';
  }

  // Content transparent background styles
  const contentBgStyle: React.CSSProperties = {};
  if (content_bg_type === 'solid') {
    contentBgStyle.backgroundColor = content_bg_color || '#ffffff';
    contentBgStyle.padding = '1.75rem';
    contentBgStyle.borderRadius = '1.25rem';
    contentBgStyle.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05)';
  } else if (content_bg_type === 'semi') {
    const c = content_bg_color || '#ffffff';
    const op = content_bg_opacity !== undefined ? content_bg_opacity : 30;
    contentBgStyle.backgroundColor = hexToRgba(c, op);
    contentBgStyle.backdropFilter = 'blur(12px)';
    contentBgStyle.padding = '1.75rem';
    contentBgStyle.borderRadius = '1.25rem';
    contentBgStyle.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.03)';
  }

  // Render individual reorderable components
  const renderBadge = () => {
    if (!enabled_sections?.badge || !badge_text) return null;
    return (
      <div key="badge" className="flex items-center justify-center lg:justify-start">
        <span 
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-[10px] sm:text-xs font-bold font-sans uppercase tracking-[0.12em] leading-none transition-all shadow-sm"
          style={badgeStyle}
        >
          <Heart className="w-3.5 h-3.5 fill-rose-600/10" />
          {badge_text}
        </span>
      </div>
    );
  };

  const renderHeadline = () => {
    if (!enabled_sections?.headline || !title) return null;
    return (
      <h1 
        key="headline" 
        className="font-serif font-black text-3xl sm:text-5xl lg:text-6xl text-zinc-950 dark:text-white leading-[1.12] tracking-tight transition-all"
        style={headingStyle}
      >
        {title}
      </h1>
    );
  };

  const renderDescription = () => {
    if (!enabled_sections?.description || !subtitle) return null;
    return (
      <p 
        key="description" 
        className="font-sans text-sm sm:text-base text-zinc-650 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed transition-all"
        style={bodyStyle}
      >
        {subtitle}
      </p>
    );
  };

  const renderButtons = () => {
    if (!enabled_sections?.buttons) return null;
    const hasPrimary = !!primary_cta_text;
    const hasSecondary = !!secondary_cta_text;
    if (!hasPrimary && !hasSecondary) return null;

    return (
      <div key="buttons" className="pt-2 flex flex-col sm:flex-row justify-center items-center sm:gap-4 gap-3 w-full max-w-md mx-auto">
        {hasPrimary && (
          <button
            onClick={() => onNavigate(primary_cta_url)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#CE2B5E] hover:bg-[#b81d4e] dark:bg-[#CE2B5E] dark:hover:bg-[#b81d4e] text-white font-sans text-sm font-bold shadow-md cursor-pointer hover:scale-103 transition-all flex items-center justify-center gap-1.5"
            style={primaryBtnStyle}
          >
            <span>{primary_cta_text}</span>
            <span className="text-base font-light font-sans">➔</span>
          </button>
        )}
        {hasSecondary && (
          <button
            onClick={() => onNavigate(secondary_cta_url)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-sans text-sm font-bold cursor-pointer hover:scale-103 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all flex items-center justify-center gap-1.5"
            style={secondaryBtnStyle}
          >
            <span>{secondary_cta_text}</span>
            <span className="text-zinc-400 dark:text-zinc-500 font-sans text-xs">🞂</span>
          </button>
        )}
      </div>
    );
  };

  const renderMedia = () => {
    if (!enabled_sections?.media || (!image_url && !video_url)) return null;
    return (
      <div key="media" className="relative group rounded-2xl overflow-hidden shadow-2xl max-w-3xl mx-auto border border-zinc-200/40 dark:border-zinc-800/40 w-full">
        {video_url ? (
          <div className="aspect-video w-full rounded-2xl bg-black flex items-center justify-center relative">
            {video_url.includes('youtube.com') || video_url.includes('youtu.be') ? (
              <iframe 
                src={video_url.replace('watch?v=', 'embed/')} 
                title="Branding Video"
                className="w-full h-full border-none absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video 
                src={video_url} 
                controls 
                poster={image_url}
                className="w-full h-full object-cover rounded-2xl"
              />
            )}
          </div>
        ) : (
          image_url && (
            <div className="relative overflow-hidden aspect-21/9 md:aspect-16/7">
              <HeartsyncImage 
                src={image_url} 
                alt="Website branding banner" 
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </div>
          )
        )}
      </div>
    );
  };

  const renderStatistics = () => {
    if (!enabled_sections?.statistics || !statistics || statistics.length === 0) return null;
    return (
      <div key="statistics" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs md:text-sm text-zinc-500 dark:text-zinc-400 pt-6 font-medium font-sans select-none">
        {statistics.map((stat, idx) => {
          // Add emoji or icon matching standard indicators
          let icon = '•';
          if (idx === 0) icon = '👥';
          if (idx === 1) icon = '📖';
          if (idx === 2) icon = '💖';

          return (
            <React.Fragment key={stat.id}>
              {idx > 0 && <span className="text-zinc-300 dark:text-zinc-700 mx-1">•</span>}
              <div className="flex items-center gap-1.5">
                <span className="text-xs md:text-sm">{icon}</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">{stat.value}</span>
                <span className="text-zinc-400 dark:text-zinc-500 font-normal">{stat.label.toLowerCase()}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const renderTestimonials = () => {
    if (!enabled_sections?.testimonials || !testimonials || testimonials.length === 0) return null;
    return (
      <div key="testimonials" className="pt-6 space-y-4 max-w-3xl mx-auto w-full">
        <div className="h-[1px] bg-zinc-200/50 dark:bg-zinc-800/50 my-2" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testimonials.map((test) => (
            <div 
              key={test.id} 
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 text-left space-y-3.5 shadow-sm transition-all relative"
            >
              <div className="flex items-center gap-1.5 text-rose-500">
                {[1, 2, 3, 4, 5].map(star => (
                  <Heart key={star} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-zinc-650 dark:text-zinc-350 italic font-sans leading-relaxed">
                "{test.text}"
              </p>
              <div className="flex items-center gap-3 pt-1">
                {test.avatar ? (
                  <img src={test.avatar} alt={test.name} className="w-9 h-9 rounded-full object-cover shadow-xs" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-rose-500">
                    {test.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 
                    className="text-xs font-bold font-sans text-zinc-805 dark:text-zinc-105"
                    style={headingStyle}
                  >
                    {test.name}
                  </h4>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-sans mt-0.5">
                    {test.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Center alignment / Single column layout
  const isCentered = align === 'center' || align === 'right';
  const flexAlignment = align === 'right' ? 'items-end text-right' : align === 'left' ? 'items-start text-left' : 'items-center text-center';

  return (
    <section 
      style={sectionStyle}
      className={`relative w-full rounded-3xl overflow-hidden border border-zinc-100/50 dark:border-zinc-800/50 ${heightClasses[height]} transition-all duration-305`}
    >
      {/* Opacity Dark Overlay layer over Background Images */}
      {(bg_type === 'overlay' || (bg_type === 'image' && bg_image_url)) && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none transition-all"
          style={{
            backgroundColor: overlay_color,
            opacity: overlay_opacity / 100
          }}
        />
      )}

      {/* Decorative ambient blurred blobs (used if no background image is set) */}
      {(bg_type === 'solid' || bg_type === 'gradient') && !bg_gradient_start && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60 z-0">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-rose-455/[0.04] dark:bg-rose-955/[0.08] blur-[50px] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fuchsia-455/[0.04] dark:bg-fuchsia-955/[0.08] blur-[50px] rounded-full" />
        </div>
      )}

      {/* Content wrapper */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-12 w-full">
        {align === 'left' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Col: Badges, Headline, Description, CTAs, Trust indicators */}
            <div 
              className="lg:col-span-7 flex flex-col gap-5 text-left items-start"
              style={contentBgStyle}
            >
              {element_order.filter(id => id !== 'media').map((sectionId) => {
                switch (sectionId) {
                  case 'badge': return renderBadge();
                  case 'headline': return renderHeadline();
                  case 'description': return renderDescription();
                  case 'buttons': return renderButtons();
                  case 'statistics': return renderStatistics();
                  case 'testimonials': return renderTestimonials();
                  default: return null;
                }
              })}
              
              {/* Trust indicators row */}
              {trust_indicators && trust_indicators.length > 0 && (
                <div className="flex flex-wrap gap-4 pt-3 text-left">
                  {trust_indicators.map((indicator, index) => (
                    <span key={index} className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 font-sans">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                      {indicator}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right Col: Media component */}
            <div className="lg:col-span-5 w-full">
              {renderMedia()}
            </div>
          </div>
        ) : (
          <div 
            className={`flex flex-col ${flexAlignment} gap-5 w-full max-w-4xl mx-auto`}
            style={contentBgStyle}
          >
            {element_order.map((sectionId) => {
              switch (sectionId) {
                case 'badge': return renderBadge();
                case 'headline': return renderHeadline();
                case 'description': return renderDescription();
                case 'buttons': return renderButtons();
                case 'media': return renderMedia();
                case 'statistics': return renderStatistics();
                case 'testimonials': return renderTestimonials();
                default: return null;
              }
            })}

            {/* Trust indicators row for center/right */}
            {trust_indicators && trust_indicators.length > 0 && (
              <div className="flex flex-wrap justify-center gap-4 pt-3">
                {trust_indicators.map((indicator, index) => (
                  <span key={index} className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 font-sans">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    {indicator}
                    </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
