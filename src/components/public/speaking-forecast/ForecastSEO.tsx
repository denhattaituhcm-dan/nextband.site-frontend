import { useEffect } from 'react';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface ArticleMetadata {
  headline: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
}

interface ForecastSEOProps {
  title: string;
  description: string;
  canonicalUrl: string;
  noIndex?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  article?: ArticleMetadata;
  faqs?: Array<{ question: string; answer: string }>;
}

export function ForecastSEO({
  title,
  description,
  canonicalUrl,
  noIndex = false,
  breadcrumbs = [],
  article,
  faqs,
}: ForecastSEOProps) {
  useEffect(() => {
    // 1. Title
    const formattedTitle = title.includes('ARIS') ? title : `${title} — ARIS IELTS`;
    document.title = formattedTitle;

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // 3. Meta Robots (index/noindex)
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute(
      'content',
      noIndex ? 'noindex, follow' : 'index, follow, max-image-preview:large'
    );

    // 4. Canonical Link
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonicalUrl);

    // 5. OpenGraph Tags
    const setMetaTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    setMetaTag('og:title', formattedTitle);
    setMetaTag('og:description', description);
    setMetaTag('og:url', canonicalUrl);
    setMetaTag('og:type', article ? 'article' : 'website');
    setMetaTag('og:site_name', 'ARIS IELTS');

    // 6. JSON-LD Structured Data
    const jsonLdElements: HTMLScriptElement[] = [];

    // A. WebPage & Organization
    const webPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: formattedTitle,
      description,
      url: canonicalUrl,
      publisher: {
        '@type': 'EducationalOrganization',
        name: 'ARIS IELTS Academic Institution',
        url: 'https://nextband.site',
      },
    };

    const webPageScript = document.createElement('script');
    webPageScript.type = 'application/ld+json';
    webPageScript.text = JSON.stringify(webPageSchema);
    document.head.appendChild(webPageScript);
    jsonLdElements.push(webPageScript);

    // B. BreadcrumbList Schema
    if (breadcrumbs.length > 0) {
      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      };

      const breadcrumbScript = document.createElement('script');
      breadcrumbScript.type = 'application/ld+json';
      breadcrumbScript.text = JSON.stringify(breadcrumbSchema);
      document.head.appendChild(breadcrumbScript);
      jsonLdElements.push(breadcrumbScript);
    }

    // C. Article Schema (if applicable)
    if (article) {
      const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.headline,
        description,
        mainEntityOfPage: canonicalUrl,
        author: {
          '@type': 'Organization',
          name: article.authorName || 'ARIS Academic Board',
        },
        publisher: {
          '@type': 'Organization',
          name: 'ARIS IELTS',
        },
        datePublished: article.datePublished || new Date().toISOString(),
        dateModified: article.dateModified || new Date().toISOString(),
      };

      const articleScript = document.createElement('script');
      articleScript.type = 'application/ld+json';
      articleScript.text = JSON.stringify(articleSchema);
      document.head.appendChild(articleScript);
      jsonLdElements.push(articleScript);
    }

    // D. FAQPage Schema (Only if real FAQs are present on page)
    if (faqs && faqs.length > 0) {
      const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      };

      const faqScript = document.createElement('script');
      faqScript.type = 'application/ld+json';
      faqScript.text = JSON.stringify(faqSchema);
      document.head.appendChild(faqScript);
      jsonLdElements.push(faqScript);
    }

    // Cleanup injected JSON-LD scripts on unmount
    return () => {
      jsonLdElements.forEach((script) => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    };
  }, [title, description, canonicalUrl, noIndex, breadcrumbs, article, faqs]);

  return null;
}
