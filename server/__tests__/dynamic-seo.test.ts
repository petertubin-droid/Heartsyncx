// Regression tests for the crawler-accessibility repair (Sep 27, 2026).
//
// Every dynamic route used to serve BOTH the shell's static SEO defaults
// AND the injected per-route tags: two canonicals (the homepage one first),
// two descriptions, two complete OG/Twitter sets. Crawlers honoring the
// first occurrence saw every article declare itself a duplicate of the
// homepage, and social previews showed the generic site card. The
// noscript/articleBody work makes the article text itself readable by
// non-JavaScript agents (AI crawlers, social fetchers, text browsers).
// @vitest-environment node
import './env-setup';
import { describe, it, expect } from 'vitest';
import { stripShellSeoTags, markdownToPlainHtml } from '../../server';

const SHELL = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Heartsync  - Mindful Insights for Connected Hearts</title>
    <meta name="description" content="Evidence-based relationship advice." />
    <link rel="canonical" href="https://heartsyncx.netlify.app/" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <meta property="og:url" content="https://heartsyncx.netlify.app/" />
    <meta property="og:title" content="Heartsync" />
    <meta property="og:image" content="https://heartsyncx.netlify.app/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Heartsync" />
    <meta name="twitter:image" content="https://heartsyncx.netlify.app/og-image.png" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

describe('stripShellSeoTags (one canonical, one description, one OG set per page)', () => {
  it('removes the shell description, homepage canonical and all og:/twitter: tags', () => {
    const out = stripShellSeoTags(SHELL);
    expect(out).not.toContain('<meta name="description"');
    expect(out).not.toContain('rel="canonical"');
    expect(out).not.toContain('<meta property="og:');
    expect(out).not.toContain('<meta name="twitter:');
  });

  it('keeps every non-SEO tag (title, icons, viewport, charset, body)', () => {
    const out = stripShellSeoTags(SHELL);
    expect(out).toContain('<title>Heartsync');
    expect(out).toContain('<link rel="icon" href="/favicon.ico"');
    expect(out).toContain('<meta name="viewport"');
    expect(out).toContain('<meta charset="UTF-8"');
    expect(out).toContain('<div id="root">');
  });

  it('produces exactly one of each SEO tag in the real strip-then-inject order', () => {
    // handleDynamicHtml strips the shell FIRST, then injects the per-route
    // block - the final page must carry each tag exactly once.
    const page = stripShellSeoTags(SHELL).replace(
      '</head>',
      `    <meta name="description" content="Article desc" />
    <link rel="canonical" href="https://heartsyncx.netlify.app/article/some-slug" />
    <meta property="og:title" content="An Article" />`
    );
    expect(page.match(/<meta name="description"/g)).toHaveLength(1);
    expect(page.match(/rel="canonical"/g)).toHaveLength(1);
    expect(page.match(/<meta property="og:title"/g)).toHaveLength(1);
    expect(page).toContain('/article/some-slug" />');
    // No homepage canonical survives anywhere on the article page.
    expect(page).not.toContain('<link rel="canonical" href="https://heartsyncx.netlify.app/"');
  });

  it('is a no-op on a shell without SEO defaults', () => {
    const bare = '<html><head><title>t</title></head><body></body></html>';
    expect(stripShellSeoTags(bare)).toBe(bare);
  });
});

describe('markdownToPlainHtml (server-rendered article text for non-JS agents)', () => {
  it('converts headings, bold, links and blockquotes to plain escaped paragraphs', () => {
    const out = markdownToPlainHtml(
      '## The First Move\n\nYou say **goodbye** and *leave*. See [the guide](https://example.com) for more.\n\n> Courage is not the absence of pain.',
      'How to End It Well'
    );
    expect(out).toContain('<h1>How to End It Well</h1>');
    expect(out).toContain('<p>The First Move</p>');
    expect(out).toContain('You say goodbye and leave.');
    expect(out).toContain('See the guide for more.');
    expect(out).toContain('<p>Courage is not the absence of pain.</p>');
    expect(out).not.toContain('##');
    expect(out).not.toContain('**');
    expect(out).not.toContain('<a ');
    expect(out).not.toContain('href');
  });

  it('escapes HTML entities so raw markdown can never inject markup', () => {
    const out = markdownToPlainHtml('A <script>alert(1)</script> and & sign', 'T');
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
    expect(out).toContain('&amp;');
  });

  it('drops image markdown but keeps alt-free text intact', () => {
    const out = markdownToPlainHtml('Before\n\n![Cover photo](https://img.example/x.jpg)\n\nAfter', 'T');
    expect(out).not.toContain('img.example');
    expect(out).toContain('<p>Before</p>');
    expect(out).toContain('<p>After</p>');
  });
});
