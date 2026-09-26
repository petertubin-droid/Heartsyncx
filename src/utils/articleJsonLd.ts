/**
 * Article structured data (JSON-LD) builder.
 *
 * Commercial-readiness gap (2026-09-26 audit): the article pages had no
 * NewsArticle/FAQPage structured data, so Google could not render rich
 * results for the site's core content. Pure function - the ArticlePage
 * effect injects the returned graph as <script type="application/ld+json">.
 */
export interface JsonLdFaqItem {
  question: string;
  answer: string;
}

export interface ArticleJsonLdParams {
  article: Record<string, any>;
  siteName: string;
  siteUrl: string;
  logoUrl: string;
  faq: JsonLdFaqItem[];
}

const stripHtml = (s: unknown): string =>
  String(s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim();

export function buildArticleJsonLd(params: ArticleJsonLdParams): Record<string, any> | null {
  const { article, siteName, siteUrl, logoUrl, faq } = params;
  if (!article || !article.title) return null;

  const url = `${siteUrl.replace(/\/$/, '')}/article/${article.slug || article.id}`;
  const image = article.featured_image || undefined;
  const excerpt = stripHtml(article.excerpt).slice(0, 300);
  const authorName =
    stripHtml(article.author_name) ||
    (typeof article.author === 'string' ? article.author : '') ||
    siteName;
  const published = article.publish_date ? new Date(article.publish_date).toISOString() : undefined;
  const modified = article.updated_date || article.publish_date;

  const newsArticle: Record<string, any> = {
    '@type': 'NewsArticle',
    headline: String(article.title).slice(0, 110),
    ...(excerpt ? { description: excerpt } : {}),
    ...(image ? { image: [image] } : {}),
    ...(published ? { datePublished: published } : {}),
    ...(modified ? { dateModified: new Date(modified).toISOString() } : {}),
    author: { '@type': 'Person', name: authorName },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: { '@type': 'ImageObject', url: logoUrl },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  const graph: Record<string, any>[] = [newsArticle];

  const validFaq = (faq || [])
    .filter((f) => f && f.question && f.answer)
    .slice(0, 12)
    .map((f) => ({
      '@type': 'Question',
      name: stripHtml(f.question),
      acceptedAnswer: { '@type': 'Answer', text: stripHtml(f.answer) },
    }));

  if (validFaq.length > 0) {
    graph.push({ '@type': 'FAQPage', mainEntity: validFaq });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}
