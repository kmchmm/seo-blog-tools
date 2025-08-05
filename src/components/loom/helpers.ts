import { CustomHTMLElement } from '../../hooks/useKeywordAnalysis';
import {
  errorLengthStyle,
  perfectLengthStyle,
  warningLengthStyle,
} from '../../pages/Loom';
import { CONSTRAINT, HeadingEntry, HeadingWithOptionalCount } from '../../types/loom';
import { textToHtml } from '../../utils/formatter';
// import { normalizeKeyword, normalizeTextToWords } from '../../utils/keywordWorker';
import { normalizeTextToWords } from '../../utils/keywordWorker';

// Normalize URLs for matching
export const normalizeUrl = (url: string): string => {
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `https://arashlaw.com${url}`;
  return url;
};

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

// --- Word Count + Density ---
export function getWordCount(text: string): number {
  return normalizeTextToWords(text).length;
}

export function getKeywordDensity(text: string, totalKeywordCount: number): number {
  const totalWords = getWordCount(text);
  return totalWords === 0 ? 0 : (totalKeywordCount / totalWords) * 100;
}

export const getSentences = (text: string) => {
  const sentences = text.match(/[^.!?]+[.!?]?/g) || [];
  return sentences;
};

export function createHeadingEntry(
  level: string,
  buffer: string[],
  contentBuffer: string[],
  withWordCount: boolean
): HeadingWithOptionalCount {
  const text = buffer.join(' ');
  const wordCount = withWordCount ? getWordCount(contentBuffer.join(' ')) : undefined;

  const entry: HeadingWithOptionalCount = {
    level: level as HeadingEntry['level'],
    text,
  };

  if (wordCount !== undefined) {
    entry.wordCount = wordCount;
  }

  return entry;
}

export function isTargetHeading(tag: string, includeAllHeadings: boolean): boolean {
  return includeAllHeadings ? /^H[1-6]$/.test(tag) : tag === 'H2' || tag === 'H3';
}

export function getHeadings({
  editMode,
  container,
  includeAllHeadings = false,
  withWordCount = false,
}: {
  container: CustomHTMLElement;
  editMode: boolean;
  includeAllHeadings?: boolean;
  withWordCount?: boolean;
}): HeadingWithOptionalCount[] {
  const html = editMode ? container.currentContent : container.innerHTML;
  const doc = textToHtml(html);
  const children = Array.from(doc.body.children);

  const combinedHeadings: HeadingWithOptionalCount[] = [];
  let buffer: string[] = [];
  let contentBuffer: string[] = [];
  let currentLevel: string | null = null;

  for (const el of children) {
    if (!el.tagName) continue;
    const tag = el.tagName.toUpperCase();

    if (isTargetHeading(tag, includeAllHeadings)) {
      const text = el.textContent?.trim();
      if (!text) continue;

      if (currentLevel === tag && contentBuffer.length === 0) {
        buffer.push(text);
      } else {
        if (buffer.length > 0 && currentLevel) {
          combinedHeadings.push(
            createHeadingEntry(currentLevel, buffer, contentBuffer, withWordCount)
          );
        }
        buffer = [text];
        contentBuffer = [];
        currentLevel = tag;
      }
    } else {
      const contentText = el.textContent?.trim();
      if (contentText) {
        contentBuffer.push(contentText);
      }
    }
  }

  if (buffer.length > 0 && currentLevel) {
    combinedHeadings.push(
      createHeadingEntry(currentLevel, buffer, contentBuffer, withWordCount)
    );
  }

  return combinedHeadings;
}

export const getHeaderBadgeColor = (percent: number) => {
  if (percent <= 75) return 'green';

  return 'red';
};

export function highlightKeywordsInDiv({
  container,
  focusKeyword,
  alternateKeyword,
}: {
  container: HTMLElement;
  focusKeyword: string;
  alternateKeyword?: string;
}) {
  if (!container || !focusKeyword.trim()) return;

  const normalize = (str: string) => str.trim().toLowerCase();
  const escapeRegex = (str: string) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const focusWords = normalize(focusKeyword).split(/\s+/).filter(Boolean);
  const altWords = alternateKeyword ? normalize(alternateKeyword).split(/\s+/) : [];

  const keywordMap = new Map<string, string>();
  focusWords.forEach(word => keywordMap.set(word, '#00ffff')); 
  altWords.forEach(word => {
    if (!keywordMap.has(word)) {
      keywordMap.set(word, '#00ff00'); 
    }
  });


  const allKeywords = [...new Set([...focusWords, ...altWords])];
  if (allKeywords.length === 0) return;

  const keywordRegex = new RegExp(
    `\\b(${allKeywords.map(escapeRegex).join('|')})\\b`,
    'gi'
  );

  // Walk all text nodes recursively
  const walkAndHighlight = (node: Node) => {
    if (
      node.nodeType === Node.TEXT_NODE &&
      node.nodeValue?.trim() &&
      node.parentElement &&
      !node.parentElement.closest('.highlight-keyword, .link-highlight, .content-highlight')
    ) {
      const text = node.nodeValue;
      let hasMatch = false;

      const replaced = text.replace(keywordRegex, match => {
        const color = keywordMap.get(normalize(match));
        if (!color) return match;
        hasMatch = true;
        return `<mark class="highlight-keyword" style="background:${color}">${match}</mark>`;
      });

      if (hasMatch) {
        const span = document.createElement('span');
        span.innerHTML = replaced;
        (node as ChildNode).replaceWith(...span.childNodes);
      }
    } else {
      node.childNodes.forEach(child => walkAndHighlight(child));
    }
  };

  walkAndHighlight(container);
}


export function removeKeywordHighlights(container: HTMLElement) {
  if (!container) return;

  // Remove only marks added by our function
  const marks = container.querySelectorAll('mark.highlight-keyword');

  marks.forEach(mark => {
    const parent = mark.parentNode;
    if (!parent) return;

    const text = document.createTextNode(mark.textContent || '');
    parent.replaceChild(text, mark);
  });
}

export function highlightTextNode(node: Text, regex: RegExp, color: string) {
  const parent = node.parentElement;
  if (!parent) return;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = node.textContent!.replace(
    regex,
    `<mark style="background:${color}">$1</mark>`
  );

  // Replace the text node with its marked-up equivalent
  while (tempDiv.firstChild) {
    parent.insertBefore(tempDiv.firstChild, node);
  }
  parent.removeChild(node);
}
