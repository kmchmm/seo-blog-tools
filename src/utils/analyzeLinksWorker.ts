interface LinkDetail {
  url: string;
  anchor: string;
  location: string;
}

export function analyzeLinks(htmlString: string): {
  invalidLinks: LinkDetail[];
  missingTrailingSlash: LinkDetail[];
  duplicateLinks: LinkDetail[];
  brokenLinks: LinkDetail[];
  identicalAnchors: LinkDetail[];
  invalidAnchors: LinkDetail[];
  internalLinks: LinkDetail[];
  externalLinks: LinkDetail[];
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const links = Array.from(doc.querySelectorAll('a'));

  const invalidLinks: LinkDetail[] = [];
  const missingTrailingSlash: LinkDetail[] = [];
  const duplicateLinks: LinkDetail[] = [];
  const brokenLinks: LinkDetail[] = []; // You can fill this later using async HEAD/GET
  const identicalAnchors: LinkDetail[] = [];
  const invalidAnchors: LinkDetail[] = [];

  const internalLinks: LinkDetail[] = [];
  const externalLinks: LinkDetail[] = [];

  const linkSet = new Set<string>();
  const anchorMap = new Map<string, LinkDetail[]>();

  const hasTrailingSlash = (url: string) => url.endsWith('/');

  links.forEach((link) => {
    const rawHref = link.getAttribute('href') || '';
    const href = rawHref.trim().replace(/&amp;/g, '&');
    const anchor = (link.textContent || '').trim();
    const heading = link.closest('section')?.querySelector('h1,h2,h3,h4,h5,h6')?.textContent?.trim() || 'Unknown Section';

    const normalizedUrl = href.startsWith('http') ? href : `https://arashlaw.com${href}`;

    const linkDetail: LinkDetail = {
      url: normalizedUrl,
      anchor,
      location: heading,
    };

    // Invalid link detection
    const isInvalidLink = !href || href === '#' || href.startsWith('#');
    if (isInvalidLink) {
      invalidLinks.push(linkDetail);
      return;
    }

    const isInternal = href.startsWith('/') || href.includes('arashlaw.com');

    // Missing trailing slash on internal URLs
    if (isInternal && !hasTrailingSlash(href)) {
      missingTrailingSlash.push(linkDetail);
    }

    // Duplicate link detection
    if (linkSet.has(href)) {
      duplicateLinks.push(linkDetail);
    } else {
      linkSet.add(href);
    }

    // Track anchor text frequency for identical anchors
    if (anchor) {
      if (!anchorMap.has(anchor)) anchorMap.set(anchor, []);
      anchorMap.get(anchor)!.push(linkDetail);
    }

    // Detect invalid anchor text (leading/trailing punctuation or space)
    const hasInvalidWhitespaceOrPunctuation = /^[\s\p{P}]+|[\s\p{P}]+$/u.test(anchor);
    if (anchor && hasInvalidWhitespaceOrPunctuation) {
      invalidAnchors.push(linkDetail);
    }

    // Add to internal/external lists
    if (isInternal) {
      internalLinks.push(linkDetail);
    } else {
      externalLinks.push(linkDetail);
    }
  });

  // Identify identical anchors (same anchor text with different URLs)
  for (const [, linkDetails] of anchorMap.entries()) {
    if (linkDetails.length > 1) {
      const uniqueUrls = new Set(linkDetails.map(ld => ld.url));
      if (uniqueUrls.size > 1) {
        identicalAnchors.push(...linkDetails);
      }
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
    externalLinks,
  };
}
