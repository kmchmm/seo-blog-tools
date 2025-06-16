import { getHeadings, getKeywordDensity, getSentences } from '../components/loom/helpers';
import { CustomHTMLElement, KeywordAnalysisResult } from '../hooks/useKeywordAnalysis';
import { AnalyzeDocumentInput, Section } from '../types/loom';
import { getCleanText, textToHtml } from './formatter';

// --- Normalization Utilities ---
export function normalizeEsqKeyword(keyword: string): string {
  return keyword.replace(/\bESQ\b/gi, '(lawyer|attorney|lawyers|attorneys|esq)');
}

export function normalizeKeyword(word: string): string {
  return word
    .toLowerCase()
    .replace(/'s$/, '')
    .replace(/ies$/, 'y')
    .replace(/([^aeiou])es$/, '$1')
    .replace(/([^s])s$/, '$1')
    .replace(/[^a-z0-9]/g, '');
}

export function normalizeTextToWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, '')
    .split(/\s+/)
    .map(normalizeKeyword)
    .filter(Boolean);
}

// --- Keyword Matching Core ---
function countForKeyphrase(text: string, focusKeyphrase: string): number {
  if (!focusKeyphrase.trim()) return 0;

  const keyphraseWords = normalizeTextToWords(focusKeyphrase);
  if (keyphraseWords.length === 0) return 0;

  const sentences = getSentences(text);
  let matchCount = 0;

  for (const sentence of sentences) {
    const sentenceWords = normalizeTextToWords(sentence);
    const wordSet = new Set(sentenceWords);

    const allWordsMatch = keyphraseWords.every(word => wordSet.has(word));

    if (allWordsMatch) {
      matchCount++;
    }
  }

  return matchCount;
}

// --- Updated Function (Excludes H1s) ---
export function countKeywordMatchesFromHtml({
  container,
  editMode,
  focusKeyphrase,
  altKeyphrase,
}: {
  container: CustomHTMLElement;
  focusKeyphrase: string;
  editMode: boolean;
  altKeyphrase?: string;
}) {
  const cleanText = getCleanText({ container, editMode });
  const focus = countForKeyphrase(cleanText, focusKeyphrase);
  const alt = altKeyphrase ? countForKeyphrase(cleanText, altKeyphrase) : 0;

  return {
    focusCount: focus,
    altCount: alt,
    total: focus + alt,
  };
}

// --- Headings Analysis ---
export function analyzeHeadings({
  container,
  focusKeyphrase,
  altKeyphrase,
  editMode,
}: {
  container: CustomHTMLElement;
  focusKeyphrase: string;
  altKeyphrase?: string;
  editMode: boolean;
}) {
  const headings = getHeadings({ container, editMode });

  const locationTerms = ['county', 'counties', 'city', 'cities'];

  const normalizePhrase = (phrase: string = '') =>
    phrase
      .toLowerCase()
      .split(/\s+/)
      .map(normalizeKeyword)
      .filter(word => word && !locationTerms.includes(word));

  const focusWords = normalizePhrase(focusKeyphrase);
  const altWords = normalizePhrase(altKeyphrase);

  let total = 0;
  let optimized = 0;
  const headingsData: {
    level: string;
    text: string;
    optimized: boolean;
  }[] = [];

  const seen = new Set<string>(); // dedup by tag+text

  for (const el of headings) {
    const rawText = el.text || '';
    const level = el.level;
    const normalizedWords = normalizeTextToWords(rawText).filter(
      w => !locationTerms.includes(w)
    );
    const wordSet = new Set(normalizedWords);

    const isMatch =
      (focusWords.length && focusWords.every(w => wordSet.has(w))) ||
      (altWords.length && altWords.every(w => wordSet.has(w)));

    const key = `${level}_${rawText}`;
    if (!seen.has(key)) {
      seen.add(key);
      headingsData.push({
        level,
        text: rawText,
        optimized: Boolean(isMatch),
      });
      total++;
      if (isMatch) optimized++;
    }
  }

  return {
    total,
    optimized,
    percent: total > 0 ? Math.round((optimized / total) * 100) : 0,
    headings: headingsData,
  };
}

// --- Section Optimization ---
const getTextContent = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
  if (node.nodeType === Node.ELEMENT_NODE) {
    return Array.from(node.childNodes).map(getTextContent).join(' ');
  }
  return '';
};

export function checkSectionsWithoutFocus(
  containerElement: CustomHTMLElement,
  focusKeyphrase: string,
  editMode: boolean
): string[] {
  const sections: Section[] = [];
  let children;

  if (editMode) {
    const html = containerElement.currentContent;
    const doc = textToHtml(html);
    children = Array.from(doc.body.children);
  } else {
    children = Array.from(containerElement.children);
  }

  let currentSection: Section = { heading: '', content: '' };

  children.forEach((el: Element) => {
    const tag = el.tagName?.toUpperCase();
    const text = getTextContent(el).trim();

    if (/^H[1-6]$/.test(tag) && tag !== 'H6') {
      if (currentSection.heading && currentSection.content.trim()) {
        sections.push(currentSection);
      }
      currentSection = {
        heading: text,
        content: '',
      };
    } else {
      currentSection.content += ' ' + text;
    }
  });

  // Push the last section
  if (currentSection.heading && currentSection.content.trim()) {
    sections.push(currentSection);
  }

  const focusWords = normalizeTextToWords(focusKeyphrase);

  const sectionHeadingsWithoutFocus = sections
    .filter(section => {
      const sectionWords = new Set(normalizeTextToWords(section.content));
      return !focusWords.every(word => sectionWords.has(word));
    })
    .map(section => section.heading);

  return sectionHeadingsWithoutFocus;
}

export function analyzeSections({
  container,
  focusKeyphrase,
  editMode,
}: {
  container: CustomHTMLElement;
  focusKeyphrase: string;
  editMode: boolean;
}) {
  const sections: { heading: string; content: string }[] = [];

  let elements;
  if (editMode) {
    const html = container.currentContent;
    const doc = textToHtml(html);
    elements = Array.from(doc.body.children);
  } else {
    elements = Array.from(container.children);
  }

  let currentHeading = '';
  let buffer = '';
  for (const el of elements as Element[]) {
    const tag = el.tagName;

    if (['H2', 'H3', 'H4', 'H5', 'H6'].includes(tag)) {
      if (currentHeading && buffer.trim()) {
        sections.push({ heading: currentHeading, content: buffer });
      }

      currentHeading = el.textContent || '';
      buffer = '';

      if (tag === 'H6') {
        sections.push({ heading: currentHeading, content: buffer });
        currentHeading = '';
        buffer = '';
      }
    } else {
      buffer += ' ' + (el.textContent || '');
    }
  }

  if (currentHeading && buffer.trim()) {
    sections.push({ heading: currentHeading, content: buffer });
  }

  const focusWords = normalizeTextToWords(focusKeyphrase).filter(Boolean);

  const isSectionOptimized = (content: string): boolean => {
    const sentences = content.match(/[^.!?]+[.!?]?/g) || [];
    return sentences.some(sentence => {
      const words = new Set(normalizeTextToWords(sentence));
      return focusWords.every(w => words.has(w));
    });
  };

  const unoptimized = sections.filter(section => {
    if (!section.content.trim()) return false;
    return !isSectionOptimized(section.content);
  });

  const optimized = sections.filter(section => {
    if (!section.content.trim()) return false;
    return isSectionOptimized(section.content);
  });

  return {
    total: sections.length,
    optimized: sections.length - unoptimized.length,
    percent:
      sections.length > 0
        ? Math.round(((sections.length - unoptimized.length) / sections.length) * 100)
        : 0,
    withoutFocus: unoptimized.map(s => s.heading),
    withFocus: optimized.map(s => s.heading),
  };
}

// --- General Keyword Matching (for "Other Keywords", etc.) ---
export function countMultipleKeywordOccurrences(
  text: string,
  keywords: string[]
): Array<{ keyword: string; count: number }> {
  return keywords.map(keyword => {
    const regexPattern = normalizeEsqKeyword(keyword.toLowerCase().trim());
    const regex = new RegExp(regexPattern, 'gi');
    const matches = text.match(regex);

    return {
      keyword,
      count: matches ? matches.length : 0,
    };
  });
}

export function analyzeDocument({
  container,
  focusKeyphrase,
  altKeyphrase,
  otherKeywords,
  editMode,
}: AnalyzeDocumentInput): KeywordAnalysisResult {
  const plainText = getCleanText({ container, editMode });

  const keywordCounts = countKeywordMatchesFromHtml({
    container,
    focusKeyphrase,
    altKeyphrase,
    editMode,
  });
  const density = getKeywordDensity(plainText, keywordCounts.focusCount);
  const headingAnalysis = analyzeHeadings({
    container,
    editMode,
    focusKeyphrase,
    altKeyphrase,
  });
  const sectionAnalysis = analyzeSections({
    container,
    focusKeyphrase,
    editMode,
  });

  // 🟢 Grouped keyword check by category
  const categorizedKeywords = otherKeywords.map(({ category, keywords }) => {
    const results = keywords.map(keyword => {
      const pattern = keyword.replace(
        /\bESQ\b/gi,
        '(lawyer|attorney|lawyers|attorneys|esq)'
      );
      const regex = new RegExp(pattern, 'gi');
      const matches = plainText.match(regex);
      return {
        keyword,
        count: matches?.length || 0,
      };
    });

    return {
      category,
      keywords: results,
    };
  });

  return {
    focusKeyphrase,
    altKeyphrase,
    density,
    totalKeywordCount: keywordCounts.total,
    keywordCounts,
    headingAnalysis,
    sectionAnalysis,
    otherKeywords: categorizedKeywords,
  };
}
