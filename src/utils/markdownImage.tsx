import React from 'react';

/**
 * Interface representing custom markdown image attributes.
 */
export interface MarkdownImageAttrs {
  alt: string;
  caption: string;
  align: 'left' | 'center' | 'right';
  width: 'full' | 'wide' | 'medium' | 'small' | string;
  height: string;
  lazy: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  linkUrl?: string;
  openInNewTab?: boolean;
  credit?: string;
  // Advanced Visual Editing Attributes
  aspectRatio?: string;     // e.g. 'auto', '1/1', '16/9', '4/3', '2/3', '21/9'
  objectFit?: string;       // e.g. 'contain', 'cover', 'fill', 'none'
  grayscale?: number;       // grayscale percentage (0 - 100)
  sepia?: number;           // sepia percentage (0 - 100)
  blur?: number;            // blur width in px (0 - 10)
  brightness?: number;      // filter percentage (50 - 200)
  contrast?: number;        // filter percentage (50 - 200)
  saturation?: number;      // filter percentage (0 - 200)
  hueRotate?: number;       // rotation degrees (0 - 360)
  rotate?: number;          // transform rotation degrees (0, 90, 180, 270)
  flipH?: boolean;          // horizontal mirror transformation
  flipV?: boolean;          // vertical mirror transformation
  borderColor?: string;     // border tint color identifier
  borderStyle?: string;     // border style (solid, dashed, dotted)
  shadowType?: string;      // shadow depth profile
}

/**
 * Preprocesses markdown text to extract curly-braces annotations following images,
 * and compiles them into a standard markdown title format `![alt](url "ATTRS:{...}")`.
 * This prevents curly-braces syntax from leaking as plain text in standard markdown parsers.
 */
export function preprocessMarkdownImages(md: string): string {
  if (!md) return '';

  // Matches markdown image tags: ![alt](url "optional-title") followed optionally by space and {attrs}
  const pattern = /!\[([^\]]*)\]\(([^'")\s]+)(?:\s+['"]([^'"]*)['"])?\)(?:\s*\{([^}]+)\})?/g;

  return md.replace(pattern, (match, altText, url, existingTitle, curlyAttrs) => {
    let alt = altText || '';
    let caption = '';
    let align: 'left' | 'center' | 'right' = 'center';
    let width: 'full' | 'wide' | 'medium' | 'small' | string = 'medium';
    let height = '';
    let lazy = true;
    let rounded: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' = '2xl';
    let linkUrl = '';
    let openInNewTab = false;
    let credit = '';

    // Advanced visual styles defaults
    let aspectRatio = 'auto';
    let objectFit = 'contain';
    let grayscale = 0;
    let sepia = 0;
    let blur = 0;
    let brightness = 100;
    let contrast = 100;
    let saturation = 100;
    let hueRotate = 0;
    let rotate = 0;
    let flipH = false;
    let flipV = false;
    let borderColor = 'none';
    let borderStyle = 'none';
    let shadowType = 'none';

    // 1. Parse existing title legacy / attributes
    if (existingTitle) {
      if (existingTitle.includes('#align-')) {
        const parts = existingTitle.split('#align-');
        caption = parts[0].trim();
        const alignVal = parts[1].trim();
        if (['left', 'center', 'right'].includes(alignVal)) {
          align = alignVal as any;
        } else if (alignVal === 'full') {
          align = 'center';
          width = 'full';
        }
      } else if (existingTitle.startsWith('ATTRS:')) {
        try {
          let jsonStr = existingTitle.substring(6);
          if (jsonStr.includes('%') || jsonStr.includes('%22')) {
            try {
              jsonStr = decodeURIComponent(jsonStr);
            } catch (_) {}
          }
          const parsed = JSON.parse(jsonStr);
          if (parsed.alt) alt = parsed.alt;
          if (parsed.caption) caption = parsed.caption;
          if (parsed.align) {
            if (parsed.align === 'full') {
              align = 'center';
              width = 'full';
            } else {
              align = parsed.align;
            }
          }
          if (parsed.width) width = parsed.width;
          if (parsed.height) height = parsed.height;
          if (parsed.lazy !== undefined) lazy = parsed.lazy;
          if (parsed.rounded) rounded = parsed.rounded;
          if (parsed.linkUrl) linkUrl = parsed.linkUrl;
          if (parsed.openInNewTab !== undefined) openInNewTab = parsed.openInNewTab;
          if (parsed.credit) credit = parsed.credit;

          if (parsed.aspectRatio) aspectRatio = parsed.aspectRatio;
          if (parsed.objectFit) objectFit = parsed.objectFit;
          if (parsed.grayscale !== undefined) grayscale = Number(parsed.grayscale);
          if (parsed.sepia !== undefined) sepia = Number(parsed.sepia);
          if (parsed.blur !== undefined) blur = Number(parsed.blur);
          if (parsed.brightness !== undefined) brightness = Number(parsed.brightness);
          if (parsed.contrast !== undefined) contrast = Number(parsed.contrast);
          if (parsed.saturation !== undefined) saturation = Number(parsed.saturation);
          if (parsed.hueRotate !== undefined) hueRotate = Number(parsed.hueRotate);
          if (parsed.rotate !== undefined) rotate = Number(parsed.rotate);
          if (parsed.flipH !== undefined) flipH = parsed.flipH === true || parsed.flipH === 'true';
          if (parsed.flipV !== undefined) flipV = parsed.flipV === true || parsed.flipV === 'true';
          if (parsed.borderColor) borderColor = parsed.borderColor;
          if (parsed.borderStyle) borderStyle = parsed.borderStyle;
          if (parsed.shadowType) shadowType = parsed.shadowType;
        } catch (_) {}
      } else {
        caption = existingTitle;
      }
    }

    // 2. Parse trailing curly braces {key="val" ...} attributes
    if (curlyAttrs) {
      const attrRegex = /(\w+)\s*=\s*"([^"]*)"/g;
      let m;
      while ((m = attrRegex.exec(curlyAttrs)) !== null) {
        const key = m[1];
        const val = m[2];
        if (key === 'alt') {
          alt = val;
        } else if (key === 'caption') {
          caption = val;
        } else if (key === 'align' || key === 'alignment') {
          if (['left', 'center', 'right'].includes(val)) {
            align = val as any;
          } else if (val === 'full') {
            align = 'center';
            width = 'full';
          }
        } else if (key === 'width') {
          width = val;
        } else if (key === 'height') {
          height = val;
        } else if (key === 'lazy') {
          lazy = val === 'true';
        } else if (key === 'rounded') {
          if (['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'].includes(val)) {
            rounded = val as any;
          }
        } else if (key === 'linkUrl' || key === 'link_url') {
          linkUrl = val;
        } else if (key === 'openInNewTab' || key === 'open_in_new_tab') {
          openInNewTab = val === 'true';
        } else if (key === 'credit') {
          credit = val;
        } else if (key === 'aspectRatio') {
          aspectRatio = val;
        } else if (key === 'objectFit') {
          objectFit = val;
        } else if (key === 'grayscale') {
          grayscale = Number(val) || 0;
        } else if (key === 'sepia') {
          sepia = Number(val) || 0;
        } else if (key === 'blur') {
          blur = Number(val) || 0;
        } else if (key === 'brightness') {
          brightness = Number(val) || 100;
        } else if (key === 'contrast') {
          contrast = Number(val) || 100;
        } else if (key === 'saturation') {
          saturation = Number(val) || 100;
        } else if (key === 'hueRotate') {
          hueRotate = Number(val) || 0;
        } else if (key === 'rotate') {
          rotate = Number(val) || 0;
        } else if (key === 'flipH') {
          flipH = val === 'true';
        } else if (key === 'flipV') {
          flipV = val === 'true';
        } else if (key === 'borderColor') {
          borderColor = val;
        } else if (key === 'borderStyle') {
          borderStyle = val;
        } else if (key === 'shadowType') {
          shadowType = val;
        }
      }
    }

    const packed: MarkdownImageAttrs = { 
      alt, 
      caption, 
      align, 
      width, 
      height, 
      lazy, 
      rounded, 
      linkUrl, 
      openInNewTab, 
      credit,
      aspectRatio,
      objectFit,
      grayscale,
      sepia,
      blur,
      brightness,
      contrast,
      saturation,
      hueRotate,
      rotate,
      flipH,
      flipV,
      borderColor,
      borderStyle,
      shadowType
    };
    const serialized = `ATTRS:${encodeURIComponent(JSON.stringify(packed))}`;
    return `![${alt}](${url} "${serialized}")`;
  });
}

/**
 * Custom renderer for markdown image tags parsed through preprocessMarkdownImages.
 */
export const MarkdownImageElement = ({ src, alt, title }: { src?: string; alt?: string; title?: string }) => {
  let finalAlt = alt || '';
  let caption = '';
  let align: 'left' | 'center' | 'right' = 'center';
  let width: 'full' | 'wide' | 'medium' | 'small' | string = 'medium';
  let height = '';
  let lazy = true;
  let rounded: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' = '2xl';
  let linkUrl = '';
  let openInNewTab = false;
  let credit = '';

  // Advanced styling variables with defaults
  let initialAspectRatio = 'auto';
  let initialObjectFit = 'cover';
  let initialGrayscale = 0;
  let initialSepia = 0;
  let initialBlur = 0;
  let initialBrightness = 100;
  let initialContrast = 100;
  let initialSaturation = 100;
  let initialHueRotate = 0;
  let initialRotate = 0;
  let initialFlipH = false;
  let initialFlipV = false;
  let borderColor = 'none';
  let borderStyle = 'solid';
  let shadowType = 'none';

  if (title && title.startsWith('ATTRS:')) {
    try {
      let jsonStr = title.substring(6);
      if (jsonStr.includes('%') || jsonStr.includes('%22')) {
        try {
          jsonStr = decodeURIComponent(jsonStr);
        } catch (_) {}
      }
      const parsed = JSON.parse(jsonStr);
      if (parsed.alt) finalAlt = parsed.alt;
      if (parsed.caption) caption = parsed.caption;
      if (parsed.align) {
        if (parsed.align === 'full') {
          align = 'center';
          width = 'full';
        } else {
          align = parsed.align;
        }
      }
      if (parsed.width) width = parsed.width;
      if (parsed.height) height = parsed.height;
      if (parsed.lazy !== undefined) lazy = parsed.lazy;
      if (parsed.rounded) rounded = parsed.rounded;
      if (parsed.linkUrl) linkUrl = parsed.linkUrl;
      if (parsed.openInNewTab !== undefined) openInNewTab = parsed.openInNewTab;
      if (parsed.credit) credit = parsed.credit;

      if (parsed.aspectRatio) initialAspectRatio = parsed.aspectRatio;
      if (parsed.objectFit) initialObjectFit = parsed.objectFit;
      if (parsed.grayscale !== undefined) initialGrayscale = Number(parsed.grayscale);
      if (parsed.sepia !== undefined) initialSepia = Number(parsed.sepia);
      if (parsed.blur !== undefined) initialBlur = Number(parsed.blur);
      if (parsed.brightness !== undefined) initialBrightness = Number(parsed.brightness);
      if (parsed.contrast !== undefined) initialContrast = Number(parsed.contrast);
      if (parsed.saturation !== undefined) initialSaturation = Number(parsed.saturation);
      if (parsed.hueRotate !== undefined) initialHueRotate = Number(parsed.hueRotate);
      if (parsed.rotate !== undefined) initialRotate = Number(parsed.rotate);
      if (parsed.flipH !== undefined) initialFlipH = parsed.flipH === true || parsed.flipH === 'true';
      if (parsed.flipV !== undefined) initialFlipV = parsed.flipV === true || parsed.flipV === 'true';
      if (parsed.borderColor) borderColor = parsed.borderColor;
      if (parsed.borderStyle) borderStyle = parsed.borderStyle;
      if (parsed.shadowType) shadowType = parsed.shadowType;
    } catch (_) {}
  } else if (title && title.includes('#align-')) {
    const parts = title.split('#align-');
    caption = parts[0].trim();
    const alignVal = parts[1].trim();
    if (['left', 'center', 'right'].includes(alignVal)) {
      align = alignVal as any;
    } else if (alignVal === 'full') {
      align = 'center';
      width = 'full';
    }
  } else if (title) {
    caption = title;
  }

  // Real-time interactivity states as requested by key upgrades
  const [aspectRatio, setAspectRatio] = React.useState(initialAspectRatio);
  const [objectFit, setObjectFit] = React.useState(initialObjectFit);
  const [imageWidth, setImageWidth] = React.useState(width);
  const [grayscale, setGrayscale] = React.useState(initialGrayscale);
  const [sepia, setSepia] = React.useState(initialSepia);
  const [blur, setBlur] = React.useState(initialBlur);
  const [brightness, setBrightness] = React.useState(initialBrightness);
  const [contrast, setContrast] = React.useState(initialContrast);
  const [saturation, setSaturation] = React.useState(initialSaturation);
  const [hueRotate, setHueRotate] = React.useState(initialHueRotate);
  const [rotate, setRotate] = React.useState(initialRotate);
  const [flipH, setFlipH] = React.useState(initialFlipH);
  const [flipV, setFlipV] = React.useState(initialFlipV);
  
  // Interface triggers
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [lightboxZoom, setLightboxZoom] = React.useState(1.0);

  // Set up responsive classes according to alignment and width
  let wrapperClass = 'w-full my-6 clear-both flex flex-col items-center';
  let imgClass = 'w-full transition-all duration-300';

  // 1. Alignments
  if (align === 'left') {
    wrapperClass = 'md:float-left md:mr-6 md:mb-4 md:max-w-[45%] my-4 clear-left flex flex-col items-start';
  } else if (align === 'right') {
    wrapperClass = 'md:float-right md:ml-6 md:mb-4 md:max-w-[45%] my-4 clear-right flex flex-col items-end';
  } else {
    wrapperClass = 'w-full flex flex-col items-center justify-center my-6 clear-both';
  }

  // 2. Width Options
  let maxWClass = 'max-w-2xl'; // default: medium
  if (imageWidth === 'full') {
    maxWClass = 'max-w-full w-full';
  } else if (imageWidth === 'wide') {
    maxWClass = 'max-w-4xl w-full';
  } else if (imageWidth === 'medium') {
    maxWClass = 'max-w-2xl w-full';
  } else if (imageWidth === 'small') {
    maxWClass = 'max-w-md w-full';
  }

  // 3. Rounded Options
  let roundedClass = 'rounded-2xl';
  if (rounded === 'none') roundedClass = 'rounded-none';
  else if (rounded === 'sm') roundedClass = 'rounded-sm';
  else if (rounded === 'md') roundedClass = 'rounded-md';
  else if (rounded === 'lg') roundedClass = 'rounded-lg';
  else if (rounded === 'xl') roundedClass = 'rounded-xl';
  else if (rounded === '2xl') roundedClass = 'rounded-2xl';
  else if (rounded === 'full') roundedClass = 'rounded-full';

  // 4. Custom borders
  let borderBorderClass = 'border border-zinc-150 dark:border-zinc-800';
  if (borderColor && borderColor !== 'none' && borderStyle && borderStyle !== 'none') {
    let styleClass = 'border-solid';
    if (borderStyle === 'dashed') styleClass = 'border-dashed';
    if (borderStyle === 'dotted') styleClass = 'border-dotted';

    let colorClass = 'border-rose-500';
    if (borderColor === 'zinc') colorClass = 'border-zinc-300 dark:border-zinc-700';
    else if (borderColor === 'amber') colorClass = 'border-amber-500';
    else if (borderColor === 'indigo') colorClass = 'border-indigo-500';
    else if (borderColor === 'rose') colorClass = 'border-rose-500';
    else if (borderColor === 'emerald') colorClass = 'border-emerald-500';
    else if (borderColor === 'slate') colorClass = 'border-slate-800 dark:border-slate-300';

    borderBorderClass = `border-4 ${styleClass} ${colorClass}`;
  }

  // 5. Custom shadows
  let customShadowClass = 'shadow-xs';
  if (shadowType === 'none') customShadowClass = '';
  else if (shadowType === 'sm') customShadowClass = 'shadow-xs';
  else if (shadowType === 'md') customShadowClass = 'shadow-md';
  else if (shadowType === 'lg') customShadowClass = 'shadow-xl';
  else if (shadowType === 'xl') customShadowClass = 'shadow-2xl';
  else if (shadowType === 'glow') customShadowClass = 'shadow-[0_0_15px_rgba(244,63,94,0.4)]';

  imgClass += ` ${roundedClass} ${borderBorderClass} ${customShadowClass}`;

  // Custom styling block for filters, transforms, aspect ratio, fit and dimension styles
  const customStyle: React.CSSProperties = {
    maxWidth: '100%',
  };
  
  if (aspectRatio && aspectRatio !== 'auto') {
    customStyle.aspectRatio = aspectRatio;
  }
  
  if (objectFit) {
    customStyle.objectFit = objectFit as any;
  }

  // Build Filters
  const filters: string[] = [];
  if (grayscale > 0) filters.push(`grayscale(${grayscale}%)`);
  if (sepia > 0) filters.push(`sepia(${sepia}%)`);
  if (blur > 0) filters.push(`blur(${blur}px)`);
  if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
  if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
  if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
  if (hueRotate > 0) filters.push(`hue-rotate(${hueRotate}deg)`);

  if (filters.length > 0) {
    customStyle.filter = filters.join(' ');
  }

  // Build Transforms
  const transforms: string[] = [];
  if (rotate) {
    transforms.push(`rotate(${rotate}deg)`);
  }
  if (flipH) transforms.push('scaleX(-1)');
  if (flipV) transforms.push('scaleY(-1)');

  if (transforms.length > 0) {
    customStyle.transform = transforms.join(' ');
  }

  if (imageWidth && !['full', 'wide', 'medium', 'small'].includes(imageWidth)) {
    customStyle.width = imageWidth.endsWith('%') || imageWidth.endsWith('px') ? imageWidth : `${imageWidth}px`;
  }
  if (height) {
    customStyle.height = height.endsWith('%') || height.endsWith('px') ? height : `${height}px`;
  }

  // Security: Sanitize URL, only allow safe protocols
  const sanitizedUrl = (src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/') || src.startsWith('data:') || src.startsWith('blob:'))) ? src : '';

  const imgElement = (
    <img
      src={sanitizedUrl}
      alt={finalAlt}
      loading={lazy ? 'lazy' : 'eager'}
      referrerPolicy="no-referrer"
      className={imgClass}
      style={customStyle}
    />
  );

  let captionText = caption && caption.trim();
  if (!captionText && finalAlt && finalAlt.trim()) {
    captionText = finalAlt.trim();
  }
  const creditText = credit && credit.trim();

  // Reset helper
  const resetEditingParams = () => {
    setAspectRatio(initialAspectRatio);
    setObjectFit(initialObjectFit);
    setImageWidth(width);
    setGrayscale(initialGrayscale);
    setSepia(initialSepia);
    setBlur(initialBlur);
    setBrightness(initialBrightness);
    setContrast(initialContrast);
    setSaturation(initialSaturation);
    setRotate(initialRotate);
    setFlipH(initialFlipH);
    setFlipV(initialFlipV);
  };

  return (
    <figure className={`article-image ${wrapperClass} ${maxWClass} group relative select-none p-1.5 border border-zinc-100/10 dark:border-zinc-850/50 rounded-3xl bg-zinc-50/5 hover:bg-zinc-150/15 dark:hover:bg-zinc-800/20 transition-colors`}>
      
      {/* Visual Tuning Overlay Badges */}
      <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          type="button"
          onClick={() => setIsEditorOpen(!isEditorOpen)}
          title="Adjust/Resize image representation options"
          className="p-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-200 border border-zinc-200/50 dark:border-zinc-850 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-500 shadow-md transition-all cursor-pointer text-[10px] font-bold flex items-center gap-1.5"
        >
          <span>📐 Presenter Tools</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setLightboxZoom(1.0);
            setIsLightboxOpen(true);
          }}
          title="Zoom to fullscreen preview"
          className="p-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-200 border border-zinc-200/50 dark:border-zinc-850 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-500 shadow-md transition-all cursor-pointer leading-none text-xs"
        >
          🔍 Fullscreen
        </button>
      </div>

      <div className="w-full relative overflow-hidden rounded-inherit flex justify-center">
        {linkUrl && !isEditorOpen ? (
          <a
            href={linkUrl}
            target={openInNewTab ? '_blank' : undefined}
            rel={openInNewTab ? 'noopener noreferrer' : 'noopener'}
            className="block cursor-pointer hover:opacity-95 transition-opacity w-full flex justify-center"
          >
            {imgElement}
          </a>
        ) : (
          <div 
            onClick={() => {
              if (!isEditorOpen) {
                setLightboxZoom(1.0);
                setIsLightboxOpen(true);
              }
            }}
            className={!isEditorOpen ? "cursor-zoom-in w-full flex justify-center" : "w-full flex justify-center"}
          >
            {imgElement}
          </div>
        )}
      </div>

      {/* Dynamic Editing Panel Inline Drawer */}
      {isEditorOpen && (
        <div className="w-full mt-4 p-4.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl space-y-4 shadow-inner text-xs font-sans text-zinc-650 dark:text-zinc-350">
          <div className="flex justify-between items-center border-b dark:border-zinc-800 pb-2">
            <span className="font-bold text-rose-500 font-mono tracking-wider block uppercase text-[10px]">🎨 Asset Aspect Ratio & Style Presets</span>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={resetEditingParams}
                className="text-[9px] font-bold uppercase tracking-wider text-rose-500 hover:underline"
              >
                Reset Image Adjustments
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 hover:text-rose-500"
              >
                Dismiss
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Dimensions Control Column */}
            <div className="space-y-3">
              {/* Aspect Ratio Picker */}
              <div>
                <span className="text-[10px] font-bold block mb-1.5 uppercase text-zinc-400 tracking-wider">Image Aspect Ratio Changer</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Auto', value: 'auto' },
                    { label: '1:1 Square', value: '1/1' },
                    { label: '16:9 Cinema', value: '16/9' },
                    { label: '4:3 Standard', value: '4/3' },
                    { label: '2:3 Portrait', value: '2/3' },
                    { label: '21:9 Widescreen', value: '21/9' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAspectRatio(opt.value)}
                      className={`px-2 py-1 rounded-lg text-[9px] font-sans font-bold cursor-pointer transition-colors ${
                        aspectRatio === opt.value
                          ? 'bg-rose-500 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border border-zinc-200/40 hover:bg-zinc-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stretch Mode controls */}
              <div>
                <span className="text-[10px] font-bold block mb-1.5 uppercase text-zinc-400 tracking-wider">Object Stretch fit parameters</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setObjectFit('cover')}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold cursor-pointer transition-colors border ${
                      objectFit === 'cover'
                        ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-450'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    Crop & Fill Center (Cover)
                  </button>
                  <button
                    type="button"
                    onClick={() => setObjectFit('fill')}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold cursor-pointer transition-colors border ${
                      objectFit === 'fill'
                        ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-450'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    Fully Stretch To Contain (Fill)
                  </button>
                </div>
              </div>

              {/* Resizer Width Options */}
              <div>
                <span className="text-[10px] font-bold block mb-1.5 uppercase text-zinc-400 tracking-wider">Representation Width Scale</span>
                <div className="flex gap-1.5">
                  {[
                    { label: 'Small Box', value: 'small' },
                    { label: 'Medium Card', value: 'medium' },
                    { label: 'Editorial Wide', value: 'wide' },
                    { label: 'Full Bleed Screen', value: 'full' }
                  ].map(wOpt => (
                    <button
                      key={wOpt.value}
                      type="button"
                      onClick={() => setImageWidth(wOpt.value)}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold cursor-pointer transition-colors border ${
                        imageWidth === wOpt.value
                          ? 'bg-zinc-850 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent font-extrabold'
                          : 'bg-transparent border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      {wOpt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Editing filters Column */}
            <div className="space-y-3 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
              <span className="text-[10px] font-bold block uppercase text-rose-500 font-mono pb-1 border-b dark:border-zinc-900">Fine Tune Creative Filters</span>
              
              <div className="grid grid-cols-2 gap-3.5 pt-1.5">
                {/* Vintage Grayscale filter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider text-zinc-400">
                    <span>Grayscale</span>
                    <span>{grayscale}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={grayscale}
                    onChange={(e) => setGrayscale(Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer text-xs"
                  />
                </div>

                {/* Cozy Sepia filter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider text-zinc-400">
                    <span>Sepia Tint</span>
                    <span>{sepia}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sepia}
                    onChange={(e) => setSepia(Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>

                {/* Picture Brightness filter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider text-zinc-400">
                    <span>Brightness</span>
                    <span>{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="180"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>

                {/* Saturation filter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider text-zinc-400">
                    <span>Contrast</span>
                    <span>{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="180"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>

                {/* Micro rotation */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider text-zinc-400">
                    <span>Rotation</span>
                    <span>{rotate}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={rotate}
                    onChange={(e) => setRotate(Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>

                {/* Flip Toggles */}
                <div className="flex items-center gap-2 pt-2 justify-between">
                  <button
                    type="button"
                    onClick={() => setFlipH(!flipH)}
                    className={`p-1.5 rounded-lg border text-[8px] font-bold flex-1 text-center cursor-pointer ${
                      flipH ? 'border-rose-500 bg-rose-500/10 text-rose-500' : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    Flip H
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipV(!flipV)}
                    className={`p-1.5 rounded-lg border text-[8px] font-bold flex-1 text-center cursor-pointer ${
                      flipV ? 'border-rose-500 bg-rose-500/10 text-rose-500' : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    Flip V
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {(captionText || creditText) && (
        <figcaption className="text-zinc-500 dark:text-zinc-400 text-xs font-sans mt-2.5 max-w-full leading-normal tracking-tight text-center px-4 py-1 border-t border-dashed border-zinc-150/40 dark:border-zinc-800/40">
          {captionText && <span className="caption-text block font-medium text-zinc-600 dark:text-zinc-300 mb-0.5">{captionText}</span>}
          {creditText && (
            <span className="text-[10px] text-zinc-405 dark:text-zinc-500 uppercase tracking-widest font-mono block mt-1">
              Source: {creditText}
            </span>
          )}
        </figcaption>
      )}

      {/* Lightbox / Zoom Modal Portal Overlay */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-1000 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 font-sans select-none">
          {/* Header toolbar */}
          <div className="w-full max-w-6xl flex justify-between items-center text-zinc-400 py-3 px-4 border-b border-zinc-850">
            <div className="text-xs">
              <span className="font-extrabold uppercase tracking-wide text-rose-500 block">Editorial presentation spotlight</span>
              <p className="text-[10px] text-zinc-500 mt-0.5">{captionText || finalAlt || 'High definition zoom resolution rendering'}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Zoom Size:</span>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={lightboxZoom}
                  onChange={(e) => setLightboxZoom(Number(e.target.value))}
                  className="w-24 bg-zinc-800 accent-rose-500 cursor-pointer h-1 rounded"
                />
                <span className="text-[10px] font-mono font-bold text-rose-500 bg-zinc-900 border border-zinc-800 py-0.5 px-1.5 rounded">{Math.round(lightboxZoom * 100)}%</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLightboxZoom(1.0);
                  setIsLightboxOpen(false);
                }}
                className="p-1 px-2.5 text-xs text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer transition-all font-bold"
              >
                ✖ Close Preview
              </button>
            </div>
          </div>

          {/* Main lightbox stage */}
          <div 
            onClick={() => setIsLightboxOpen(false)}
            className="flex-1 w-full max-w-6xl flex items-center justify-center overflow-auto cursor-zoom-out p-10"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative transition-transform duration-200" 
              style={{ transform: `scale(${lightboxZoom})`, maxWidth: '90vw', maxHeight: '75vh' }}
            >
              <img
                src={sanitizedUrl}
                alt={finalAlt}
                className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl transition-all border-2 border-zinc-850"
                style={customStyle}
                referrerPolicy="no-referrer"
              />
              {captionText && (
                <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/80 backdrop-blur-md rounded-xl text-zinc-100 text-[11px] text-center uppercase tracking-normal select-text border border-zinc-800">
                  <span className="font-bold block text-rose-500 mb-0.5">{captionText}</span>
                  {creditText && <span className="text-[9px] font-mono text-zinc-400 block tracking-widest mt-0.5">Asset Credit: {creditText}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </figure>
  );
};
