import { getHeadings, getSentences, getWordCount } from '../components/loom/helpers';
import { CustomHTMLElement } from '../hooks/useKeywordAnalysis';
import { ContentIssueReport, SameWordStreak, SectionInfo } from '../types/loom';
import { getCleanText, textToHtml } from './formatter';

function contentWorker() {
  self.onmessage = (e: MessageEvent) => {
    let text = e.data;

    // Normalize and clean text
    text = text
      .replace(/\u00A0/g, ' ')
      .replace(/[•–—]/g, '')
      .replace(/[“”‘’]/g, "'")
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Match words with custom rule (includes numbers and hyphenated parts)
    const wordMatches = text.match(
      /\b(?:\d+[-]\d+|\d+|[a-zA-Z]{1,}(?:[-'][a-zA-Z]+)*)\b/g
    );
    const wordCount = wordMatches ? wordMatches.length : 0;

    // Split into sentences and detect same starting word in 3 consecutive sentences
    const sentences = text.split(/(?<=[.?!])\s+/);
    const sameStartWordSequences: { word: string; startIndex: number }[] = [];

    for (let i = 0; i <= sentences.length - 3; i++) {
      const w1 = sentences[i].trim().split(/\s+/)[0]?.toLowerCase();
      const w2 = sentences[i + 1].trim().split(/\s+/)[0]?.toLowerCase();
      const w3 = sentences[i + 2].trim().split(/\s+/)[0]?.toLowerCase();

      if (w1 && w1 === w2 && w2 === w3) {
        sameStartWordSequences.push({ word: w1, startIndex: i });
      }
    }

    self.postMessage({ wordCount, sameStartWordSequences });
  };
}

export const createContentWorker = (): Worker => {
  const code = contentWorker.toString();
  const blob = new Blob([`(${code})()`], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};

export function analyzeContent({
  container,
  editMode,
}: {
  container: CustomHTMLElement;
  editMode: boolean;
}): ContentIssueReport {
  const htmlString = editMode ? container.currentContent : container.innerHTML;
  const doc = textToHtml(htmlString);
  const children = Array.from(doc.body.children);
  const cleanText = getCleanText({ container, editMode, excludeH1: false });
  const totalWordCount = getWordCount(cleanText);
  const over300Sections: SectionInfo[] = [];
  const sameWordStreaks: SameWordStreak[] = [];

  // Collect headings with position info
  const headingPositions: { heading: string; level: string; offset: number }[] = [];
  let charOffset = 0;

  children.forEach(el => {
    if (!el.tagName) return;
    const tag = el.tagName.toUpperCase();
    const text = el.textContent?.trim() || '';

    if (/^H[1-6]$/.test(tag)) {
      headingPositions.push({
        heading: text,
        level: tag,
        offset: charOffset,
      });
    }

    charOffset += (el.textContent || '').length + 1; // +1 for space/newline
  });

  // Identify over-300-word sections
  let currentHeading = '';
  let currentLevel = '';
  let bufferText: string[] = [];

  for (const el of children) {
    if (!el.tagName) continue;
    const tag = el.tagName.toUpperCase();
    const text = el.textContent?.trim() || '';

    if (/^H[1-6]$/.test(tag)) {
      if (bufferText.length > 0) {
        const wordCount = getWordCount(bufferText.join(' '));
        if (wordCount > 300) {
          over300Sections.push({
            level: currentLevel,
            text: currentHeading,
            wordCount,
          });
        }
        bufferText = [];
      }

      currentHeading = text;
      currentLevel = tag;
    } else {
      bufferText.push(text);
    }
  }

  if (bufferText.length > 0) {
    const wordCount = getWordCount(bufferText.join(' '));
    if (wordCount > 300) {
      over300Sections.push({
        level: currentLevel,
        text: currentHeading,
        wordCount,
      });
    }
  }

  // Analyze same word streaks with heading mapping
  const fullText = doc.body.textContent || '';
  const sentences = getSentences(fullText)
    .map(s => s.trim())
    .filter(Boolean);

  let streak: string[] = [];
  let lastWord = '';
  let sentenceOffsets: number[] = [];
  let runningOffset = 0;

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    const firstWord =
      trimmedSentence
        .split(/\s+/)[0]
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, '') || '';
    if (!firstWord) {
      runningOffset += sentence.length + 1;
      continue;
    }

    if (firstWord === lastWord) {
      streak.push(trimmedSentence);
      sentenceOffsets.push(runningOffset);
    } else {
      if (streak.length >= 3) {
        const lastOffset = sentenceOffsets[sentenceOffsets.length - 1] || 0;
        const heading = findNearestHeading(headingPositions, lastOffset);
        sameWordStreaks.push({
          heading: heading?.heading || '',
          sentences: [...streak],
        });
      }
      streak = [trimmedSentence];
      sentenceOffsets = [runningOffset];
      lastWord = firstWord;
    }

    runningOffset += sentence.length + 1; // +1 for the sentence boundary char
  }

  if (streak.length >= 3) {
    const lastOffset = sentenceOffsets[sentenceOffsets.length - 1] || 0;
    const heading = findNearestHeading(headingPositions, lastOffset);
    sameWordStreaks.push({
      heading: heading?.heading || '',
      sentences: [...streak],
    });
  }

  const headings = getHeadings({
    editMode,
    container,
    includeAllHeadings: true,
    withWordCount: true,
  });

  return {
    over300Sections,
    sameWordStreaks,
    headings,
    totalWordCount,
  };
}

// Helper: Find the nearest preceding heading by offset
function findNearestHeading(
  headings: { heading: string; level: string; offset: number }[],
  offset: number
) {
  let nearest = null;

  for (const h of headings) {
    if (h.offset <= offset) {
      if (!nearest || h.offset > nearest.offset) {
        nearest = h;
      }
    }
  }

  return nearest;
}

export function highlightContentIssuesDiv(
  container: CustomHTMLElement,
  over300Sections: { text: string; level: string; wordCount: number }[],
  sameWordStreaks: { heading: string; sentences: string[] }[]
) {
  if (!container) return;

  const highlightSection = (el: Element) => {
    const text = el.textContent?.trim();
    if (!text) return;

    // Check if this heading matches an over-300 section
    const match = over300Sections.find(section => section.text === text);

    if (match) {
      // Highlight heading element
      (el as HTMLElement).style.backgroundColor = '#cccccc';

      // Highlight all siblings until next heading
      let sibling = el.nextElementSibling;
      while (sibling && !/^H[1-6]$/.test(sibling.tagName)) {
        (sibling as HTMLElement).style.backgroundColor = '#cccccc';
        sibling = sibling.nextElementSibling;
      }
    }
  };

  const highlightSameWordSentences = (el: Element) => {
    const text = el.textContent || '';
    let modified = text;

    for (const streak of sameWordStreaks) {
      for (const sentence of streak.sentences) {
        const escaped = sentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'g');
        modified = modified.replace(
          regex,
          match => `<mark class="bg-[#cccccc">${match}</mark>`
        );
      }
    }

    if (modified !== text) {
      el.innerHTML = modified;
    }
  };

  const elements = Array.from(
    container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li')
  );

  elements.forEach(el => {
    if (/^H[1-6]$/.test(el.tagName)) {
      highlightSection(el);
    } else {
      highlightSameWordSentences(el);
    }
  });
}

export function removeHighlight(container: HTMLElement) {
  if (!container) return;

  // Remove background styles
  const highlightedEls = container.querySelectorAll('[style*="background-color"]');
  highlightedEls.forEach(el => {
    (el as HTMLElement).style.backgroundColor = '';
  });

  // Remove <mark> tags but preserve their text
  const markEls = container.querySelectorAll('mark');
  markEls.forEach(mark => {
    const parent = mark.parentNode;
    if (parent) {
      // Replace <mark> with its text content
      parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
    }
  });
}
