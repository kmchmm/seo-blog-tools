import { CustomHTMLElement } from '../../hooks/useKeywordAnalysis';
import {
  errorLengthStyle,
  perfectLengthStyle,
  warningLengthStyle,
} from '../../pages/Loom';
import { CONSTRAINT, HeadingEntry } from '../../types/loom';
import { textToHtml } from '../../utils/formatter';

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

function normalizeToSingular(word: string): string {
  return word.replace(/ies$/, 'y').replace(/es$/, '').replace(/s$/, '');
}
export function highlightKeywordsInDiv(
  container: HTMLElement,
  focusKeyword: string,
  alternateKeyword?: string
) {
  if (!container || !focusKeyword.trim()) return;

  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const expandVariants = (word: string): string[] => {
    const base = normalizeToSingular(word);
    const forms = [base];
    if (!base.endsWith('s')) {
      forms.push(`${base}s`, `${base}es`);
      if (base.endsWith('y')) forms.push(base.replace(/y$/, 'ies'));
    } else {
      if (base.endsWith('ies')) forms.push(base.replace(/ies$/, 'y'));
      else if (base.endsWith('es')) forms.push(base.replace(/es$/, ''));
      else forms.push(base.replace(/s$/, ''));
    }
    return [...new Set(forms)];
  };

  const buildAllPhraseRegex = (phrase: string): RegExp[] => {
    const words = phrase.trim().toLowerCase().split(/\s+/);
    const variants = words.map(expandVariants);

    const combinations: string[][] = [[]];
    for (const wordVariants of variants) {
      const next: string[][] = [];
      for (const combo of combinations) {
        for (const variant of wordVariants) {
          next.push([...combo, variant]);
        }
      }
      combinations.splice(0, combinations.length, ...next);
    }

    return combinations.map(combo => {
      const pattern = combo.map(escapeRegex).join('[\\s\\-.,]+');
      return new RegExp(`\\b(${pattern})\\b`, 'gi');
    });
  };

  const focusRegexes = buildAllPhraseRegex(focusKeyword);
  const altRegexes = alternateKeyword?.trim()
    ? buildAllPhraseRegex(alternateKeyword)
    : [];

  const allRegexes = { focusRegex: [...focusRegexes], altRegex: [...altRegexes] };

  const elements = container.querySelectorAll('p, h2, h3, h4, h5, h6');

  elements.forEach(el => {
    const originalText = el.textContent || '';
    let modifiedText = originalText;

    allRegexes.focusRegex.forEach(re => {
      modifiedText = modifiedText.replace(re, match => {
        return `<mark class="bg-[#00ffff]">${match}</mark>`;
      });
    });

    if (alternateKeyword) {
      allRegexes.altRegex.forEach(re => {
        modifiedText = modifiedText.replace(re, match => {
          return `<mark class="bg-[#00ff00]">${match}</mark>`;
        });
      });
    }

    if (originalText !== modifiedText) {
      el.innerHTML = modifiedText;
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
