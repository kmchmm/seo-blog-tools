import { CustomHTMLElement } from '../../hooks/useKeywordAnalysis';
import {
  errorLengthStyle,
  perfectLengthStyle,
  warningLengthStyle,
} from '../../pages/Loom';
import { CONSTRAINT, HeadingEntry } from '../../types/loom';
import { textToHtml } from '../../utils/formatter';
import { normalizeKeyword } from '../../utils/keywordWorker';

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

export function getHeadings({
  editMode,
  container,
}: {
  container: CustomHTMLElement;
  editMode: boolean;
}): HeadingEntry[] {
  const html = editMode ? container.currentContent : container.innerHTML;

  const doc = textToHtml(html);
  const children = Array.from(doc.body.children);

  const combinedHeadings: HeadingEntry[] = [];
  let buffer: string[] = [];
  let currentLevel: 'H2' | 'H3' | null = null;

  for (const el of children) {
    const tag = el.tagName?.toUpperCase();

    if (tag === 'H2' || tag === 'H3') {
      const text = el.textContent?.trim();
      if (text) {
        if (!currentLevel) {
          currentLevel = tag as 'H2' | 'H3';
        }
        buffer.push(text);
      }
    } else {
      if (buffer.length > 0 && currentLevel) {
        combinedHeadings.push({
          level: currentLevel,
          text: buffer.join(' '),
        });
        buffer = [];
        currentLevel = null;
      }
    }
  }

  if (buffer.length > 0 && currentLevel) {
    combinedHeadings.push({
      level: currentLevel,
      text: buffer.join(' '),
    });
  }

  return combinedHeadings;
}

export const getHeaderBadgeColor = (percent: number) => {
  if (percent <= 75) return 'green';

  return 'red';
};

export function highlightKeywordsInDiv(
  container: HTMLElement,
  focusKeyword: string,
  alternateKeyword?: string
) {
  if (!container || !focusKeyword.trim()) return;

  const getWordVariants = (word: string): string[] => {
    const base = normalizeKeyword(word);
    const variants = new Set<string>([base]);

    if (!base.endsWith('s')) {
      variants.add(`${base}s`);
      variants.add(`${base}es`);
      if (base.endsWith('y')) {
        variants.add(base.replace(/y$/, 'ies'));
      }
    } else {
      if (base.endsWith('ies')) variants.add(base.replace(/ies$/, 'y'));
      else if (base.endsWith('es')) variants.add(base.replace(/es$/, ''));
      else variants.add(base.replace(/s$/, ''));
    }

    return [...variants];
  };

  const getAllKeywordVariants = (phrase: string): string[][] => {
    return phrase.trim().toLowerCase().split(/\s+/).map(getWordVariants);
  };

  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const buildHighlightRegex = (variants: string[]): RegExp =>
    new RegExp(`\\b(${variants.map(escapeRegex).join('|')})\\b`, 'gi');

  const focusWordVariants = getAllKeywordVariants(focusKeyword);
  const altWordVariants = alternateKeyword?.trim()
    ? getAllKeywordVariants(alternateKeyword)
    : [];

  const elements = container.querySelectorAll('p, h2, h3, h4, h5, h6');

  elements.forEach(el => {
    const originalText = el.textContent || '';
    const sentences = originalText.match(/[^.!?]+[.!?]?/g) || [];

    let newHTML = originalText;

    sentences.forEach(sentence => {
      const normalizedWords = sentence.toLowerCase().split(/\s+/).map(normalizeKeyword);

      const wordSet = new Set(normalizedWords);

      const isMatch = (variants: string[][]) =>
        variants.every(wordForms =>
          wordForms.some(form => wordSet.has(normalizeKeyword(form)))
        );

      const applyHighlight = (sentence: string, variants: string[][], color: string) => {
        let updated = sentence;

        variants.forEach(wordForms => {
          const regex = buildHighlightRegex(wordForms);
          updated = updated.replace(regex, `<mark style="background:${color}">$1</mark>`);
        });

        return updated;
      };

      let updatedSentence = sentence;

      if (isMatch(focusWordVariants)) {
        updatedSentence = applyHighlight(sentence, focusWordVariants, '#00ffff');
      } else if (altWordVariants.length && isMatch(altWordVariants)) {
        updatedSentence = applyHighlight(sentence, altWordVariants, '#00ff00');
      }

      newHTML = newHTML.replace(sentence, updatedSentence);
    });

    if (newHTML !== originalText) {
      el.innerHTML = newHTML;
    }
  });
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
