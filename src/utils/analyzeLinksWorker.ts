import { CustomHTMLElement } from '../hooks/useKeywordAnalysis';
import { LinkIssue } from '../types/loom';

export interface LinkEntry {
  anchor: string;
  url: string;
  heading: string | null;
}

export interface IssueEntry {
  issueType: string;
  anchor: string | null;
  url: string | null;
  heading: string | null;
  globalAlert: boolean;
  errorType?: number | 'CORS ERROR';
}

export interface LinkAnalysisResult {
  internalLinks: LinkEntry[];
  externalLinks: LinkEntry[];
  issues: IssueEntry[];
}

export async function analyzeLinks(html: string): Promise<LinkAnalysisResult> {
  const internalLinks: LinkEntry[] = [];
  const externalLinks: LinkEntry[] = [];
  const issues: IssueEntry[] = [];

  const seenUrls = new Map<string, { anchor: string; heading: string | null }[]>();
  const seenAnchors = new Map<string, { url: string; heading: string | null }[]>();
  let foundCarAccidentPA = false;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function getNearestHeading(element: Element): string | null {
    let el: Element | null = element;
    while (el) {
      let prev = el.previousElementSibling;
      while (prev) {
        if (/^H[1-6]$/.test(prev.tagName)) {
          return prev.textContent?.trim() || null;
        }
        prev = prev.previousElementSibling;
      }
      el = el.parentElement;
    }
    return null;
  }

  const links = Array.from(doc.querySelectorAll('a[href]'));

  links.forEach(link => {
    const url = link.getAttribute('href')!;
    const anchorText = link.textContent || '';
    const heading = getNearestHeading(link);

    if (
      url === 'https://arashlaw.com/practice-areas/car-accident-lawyers/' ||
      url === 'https://arashlaw.com/practice-areas/car-accident-lawyers'
    ) {
      foundCarAccidentPA = true;
    }

    const entry: LinkEntry = { anchor: anchorText, url, heading };

    const isInternal = url.includes('arashlaw.com');

    if (isInternal) {
      internalLinks.push(entry);
      if (!url.endsWith('/')) {
        issues.push({
          issueType: 'Missing trailing slash',
          anchor: anchorText,
          url,
          heading,
          globalAlert: false,
        });
      }
    } else {
      externalLinks.push(entry);
    }

    if (!seenUrls.has(url)) seenUrls.set(url, []);
    seenUrls.get(url)!.push({ anchor: anchorText, heading });

    if (!seenAnchors.has(anchorText)) seenAnchors.set(anchorText, []);
    seenAnchors.get(anchorText)!.push({ url, heading });

    if (url.includes('#')) {
      issues.push({
        issueType: 'Invalid link',
        anchor: anchorText,
        url,
        heading,
        globalAlert: false,
      });
    }

    if (anchorText[0] === ' ') {
      issues.push({
        issueType: 'Space at beginning or end of anchor text',
        anchor: anchorText,
        url,
        heading,
        globalAlert: false,
      });
    }
  });

  seenUrls.forEach((arr, url) => {
    if (arr.length > 1) {
      arr.forEach(info => {
        issues.push({
          issueType: 'Duplicate link',
          anchor: info.anchor,
          url,
          heading: info.heading,
          globalAlert: false,
        });
      });
    }
  });

  seenAnchors.forEach((arr, anchorText) => {
    if (arr.length > 1) {
      const uniqueUrls = new Set(arr.map(a => a.url));
      if (uniqueUrls.size > 1) {
        arr.forEach(info => {
          issues.push({
            issueType: 'Identical anchor',
            anchor: anchorText,
            url: info.url,
            heading: info.heading,
            globalAlert: false,
          });
        });
      }
    }
  });

  if (internalLinks.length === 0) {
    issues.push({
      issueType: 'No internal links',
      anchor: null,
      url: null,
      heading: null,
      globalAlert: true,
    });
  }

  if (externalLinks.length === 0) {
    issues.push({
      issueType: 'No external links',
      anchor: null,
      url: null,
      heading: null,
      globalAlert: true,
    });
  }

  if (!foundCarAccidentPA) {
    issues.push({
      issueType: 'No link to Car Accident PA',
      anchor: null,
      url: 'https://arashlaw.com/practice-areas/car-accident-lawyers/',
      heading: null,
      globalAlert: true,
    });
  }

  return { internalLinks, externalLinks, issues };
}

export function highlightLinkIssuesInHtml(
  container: CustomHTMLElement,
  analysisResult: LinkAnalysisResult
): void {
  const urlToTypes = new Map<string, Set<string>>();

  const normalizeUrl = (url: string): string => url.replace(/\/$/, '').toLowerCase();

  const addToMap = (type: string, links: LinkIssue[]) => {
    for (const link of links) {
      const normUrl = normalizeUrl(link.url || '');
      if (!urlToTypes.has(normUrl)) {
        urlToTypes.set(normUrl, new Set());
      }
      urlToTypes.get(normUrl)!.add(type);
    }
  };

  addToMap('issues', analysisResult.issues);
  addToMap('internalLinks', analysisResult.internalLinks);
  addToMap('externalLinks', analysisResult.externalLinks);

  const links = container.querySelectorAll<HTMLAnchorElement>('a[href]');

  links.forEach((link, index) => {
    const hrefRaw = link.getAttribute('href');
    if (!hrefRaw) return;

    const href = normalizeUrl(
      hrefRaw.startsWith('http') ? hrefRaw : `https://arashlaw.com${hrefRaw}`
    );

    const types = urlToTypes.get(href);
    if (!types) return;
    console.log(`href`, href);
    // Add unique ID for reference
    link.setAttribute('id', `link-issue-${index}`);

    // Add red underline if there's any issue
    if (types.has('issues')) {
      link.style.textDecoration = 'underline';
      link.style.textDecorationColor = 'red';
      link.style.textDecorationThickness = '2px';
      link.style.textUnderlineOffset = '3px';
    }
  });
}

export function removeLinkIssueHighlights(container: CustomHTMLElement): void {
  (container.querySelectorAll('a[id^="link-issue-"]') as NodeListOf<HTMLElement>).forEach(
    link => {
      link.removeAttribute('id');
      link.style.textDecoration = '';
      link.style.textDecorationColor = '';
      link.style.textDecorationThickness = '';
      link.style.textUnderlineOffset = '';
    }
  );
}

export function groupIssuesByType(issues: IssueEntry[]): Record<string, LinkIssue[]> {
  const grouped: Record<string, LinkIssue[]> = {};

  issues.forEach(issue => {
    const { issueType, url = '', anchor = '', heading = '', errorType } = issue;

    if (!grouped[issueType]) {
      grouped[issueType] = [];
    }

    grouped[issueType].push({
      url,
      anchor,
      location: heading || '',
      errorType: errorType,
    });
  });

  return grouped;
}
