interface LinkDetail {
  url: string;
  anchor: string;
  location: string;
}

export function analyzeLinks(htmlString: string): {
  invalidLinks: string[];
  missingTrailingSlash: string[];
  duplicateLinks: string[];
  brokenLinks: string[];
  identicalAnchors: string[];
  invalidAnchors: string[];
  internalLinks: LinkDetail[];
  externalLinks: string[];
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const links = Array.from(doc.querySelectorAll('a'));

  const invalidLinks: string[] = [];
  const missingTrailingSlash: string[] = [];
  const duplicateLinks: string[] = [];
  const brokenLinks: string[] = []; // Stubbed — async fetch check required
  const identicalAnchors: string[] = [];
  const invalidAnchors: string[] = [];

  const internalLinks: LinkDetail[] = [];
  const externalLinks: Set<string> = new Set();

  const linkSet: Set<string> = new Set();
  const anchorTexts: Record<string, number> = {};

  const hasTrailingSlash = (url: string) =>
    url.endsWith('/') || url.includes('.') || url.includes('?') || url.includes('#');

  links.forEach((link) => {
    const href = link.getAttribute('href')?.trim() || '';
    const anchor = link.textContent?.trim() || '';
    const heading = link.closest('section')?.querySelector('h1,h2,h3,h4,h5,h6')?.textContent?.trim() || '';

    const isInternal = href.startsWith('/') || href.startsWith('https://arashlaw.com');

    // 1. Invalid links
    if (!href || href === '#') {
      invalidLinks.push(href || '(empty)');
    }

    // 2. Missing trailing slash for internal URLs
    if (href && isInternal && !hasTrailingSlash(href)) {
      missingTrailingSlash.push(href);
    }

    // 3. Duplicate links
    if (linkSet.has(href)) {
      duplicateLinks.push(href);
    } else {
      linkSet.add(href);
    }

    // 4. Identical anchor texts
    if (anchor) {
      anchorTexts[anchor] = (anchorTexts[anchor] || 0) + 1;
    }

    // 5. Invalid anchor text
    const hasInvalidWhitespaceOrPunctuation = /^[\s\p{P}]+|[\s\p{P}]+$/u.test(anchor);
    if (anchor && hasInvalidWhitespaceOrPunctuation) {
      invalidAnchors.push(anchor);
    }

    // 6. Internal/external classification
    if (isInternal && href) {
      const normalized = href.startsWith('http') ? href : `https://arashlaw.com${href}`;
      internalLinks.push({
        url: normalized,
        anchor,
        location: heading || 'Unknown Section',
      });
    } else if (href.startsWith('http')) {
      externalLinks.add(href);
    }
  });

  for (const [text, count] of Object.entries(anchorTexts)) {
    if (count > 1) {
      identicalAnchors.push(text);
    }
  }

  return {
    invalidLinks,
    missingTrailingSlash,
    duplicateLinks,
    brokenLinks,
    identicalAnchors,
    invalidAnchors,
    internalLinks,
    externalLinks: Array.from(externalLinks),
  };
}
