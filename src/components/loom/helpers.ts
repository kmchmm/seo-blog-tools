import { CustomHTMLElement } from '../../hooks/useKeywordAnalysis';
import {
  errorLengthStyle,
  perfectLengthStyle,
  warningLengthStyle,
} from '../../pages/Loom';
import { CONSTRAINT, HeadingEntry } from '../../types/loom';

export const formatList = (htmlString: string) => {
  const p = document.createElement('p');
  p.innerHTML = htmlString;
  // strip HTML
  const text = p.textContent;
  const textArr = text?.split(':');
  const identifier = textArr?.shift();

  p.innerHTML = textArr?.join(':') as string;
  const span = document.createElement('span');
  span.textContent = `${identifier as string} : `;
  p.prepend(span);
  return p.innerHTML;
};

export const checkPixelLength = (text: string, constraint: CONSTRAINT) => {
  const temp = document.createElement('span');
  temp.style.fontSize = '16px';
  temp.style.whiteSpace = 'nowrap';
  temp.style.visibility = 'hidden';
  temp.textContent = text;
  document.body.appendChild(temp);
  const width = temp.offsetWidth;
  document.body.removeChild(temp);

  const indicatorWidth = constraint.MAX > width ? (width / constraint.MAX) * 100 : 100;

  let style = errorLengthStyle;
  if (width >= constraint.WARNING && width < constraint.PERFECT)
    style = warningLengthStyle;
  if (width >= constraint.PERFECT && width < constraint.MAX) style = perfectLengthStyle;

  return { style, width: { width: `${indicatorWidth}%` } };
};

export function getHeadings({
  editMode,
  container,
}: {
  container: CustomHTMLElement;
  editMode: boolean;
}): HeadingEntry[] {
  let html = '';
  if (editMode) {
    html = container.currentContent;
  } else {
    html = container.innerHTML;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const headings = Array.from(doc.querySelectorAll('h2, h3'));

  return headings.map(h => ({
    level: h.tagName as 'H2' | 'H3',
    text: h.textContent?.trim() || '',
  }));
}

export const getBadgeColor = (percent: number) => {
  if (percent >= 70) return 'green';
  if (percent >= 50) return 'gray';
  return 'red';
};

function normalizeToSingular(word: string): string {
  return word.replace(/ies$/, 'y').replace(/es$/, '').replace(/s$/, '');
}

export function highlightKeywordsInDiv(
  container: HTMLElement,
  focusKeyword: string,
  alternateKeyword?: string
) {
  if (!container || !focusKeyword.trim()) return;

  const buildPattern = (keyword: string) => {
    const base = normalizeToSingular(keyword.trim().toLowerCase());
    return `(${base}|${base}s|${base}es|${base.replace(/y$/, 'ies')})`;
  };

  const patterns: string[] = [];

  if (focusKeyword.trim()) patterns.push(buildPattern(focusKeyword));
  if (alternateKeyword?.trim()) patterns.push(buildPattern(alternateKeyword));

  const regex = new RegExp(`\\b(${patterns.join('|')})\\b`, 'gi');

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue;
      if (!text || !regex.test(text)) return;

      const span = document.createElement('span');
      span.innerHTML = text.replace(regex, `<mark class="bg-yellow-200">$&</mark>`);
      node.parentNode?.replaceChild(span, node);
    } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'SCRIPT') {
      Array.from(node.childNodes).forEach(walk);
    }
  };

  walk(container);
}

export function removeKeywordHighlights(container: HTMLElement) {
  if (!container) return;

  // Replace all <mark> elements with just their inner text
  const marks = container.querySelectorAll('mark');

  marks.forEach(mark => {
    const parent = mark.parentNode;
    if (!parent) return;

    const text = document.createTextNode(mark.textContent || '');
    parent.replaceChild(text, mark);
  });
}
