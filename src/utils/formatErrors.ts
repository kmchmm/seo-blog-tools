
export interface Paragraph {
  text: string;
  heading?: string | null;
}

export interface FormattingError {
  paraIndex: number;
  sentence: string;
  paragraphIndex: number;
  heading: string;
  //  errorSubType?: 'leading' | 'trailing' | string;
}

export interface ErrorList {
  multipleSpaceErrors: FormattingError[];
  emDashErrors: FormattingError[];
  titleCaseErrors: FormattingError[];
  // leadingTrailingSpaceErrors: FormattingError[];
  spaceBeforePunctuationErrors: FormattingError[];
  missingPunctuationErrors: FormattingError[];
  consecutivePunctuationErrors: FormattingError[];
}

onmessage = (e) => {
  const paragraphs: Paragraph[] = e.data;
  const result = checkDocumentForErrorsFull(paragraphs);
  postMessage(result);
};

function checkDocumentForErrorsFull(paragraphs: Paragraph[]): ErrorList {
  const errorList: ErrorList = {
    multipleSpaceErrors: [],
    emDashErrors: [],
    titleCaseErrors: [],
    // leadingTrailingSpaceErrors: [],
    spaceBeforePunctuationErrors: [],
    missingPunctuationErrors: [],
    consecutivePunctuationErrors: [],
  };

  for (let i = 0; i < paragraphs.length; i++) {
    const { text, heading } = paragraphs[i];
    if (!text) continue;

    errorList.multipleSpaceErrors.push(...checkMultipleSpaces(text, i, paragraphs));
    errorList.emDashErrors.push(...checkEmDashSpacing(text, i, paragraphs));
    errorList.titleCaseErrors.push(...checkHeadingTitleCase(text, heading ?? null, i)); 
    // errorList.leadingTrailingSpaceErrors.push(...checkLeadingTrailingSpaces(text, i, paragraphs));
    errorList.spaceBeforePunctuationErrors.push(...checkSpaceBeforePunctuation(text, i, paragraphs));
    errorList.missingPunctuationErrors.push(...checkMissingPunctuation(text, heading ?? null, i, paragraphs));
    errorList.consecutivePunctuationErrors.push(...checkConsecutivePunctuation(text, i, paragraphs)); 
  }

  return errorList;
}

function checkMultipleSpaces(text: string, i: number, paragraphs: Paragraph[]): FormattingError[] {
  const errors: FormattingError[] = [];
  const regex = /[ \u00A0]{2,}/g; 
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    console.log(`Found multiple spaces at index ${match.index} in paragraph ${i}`); 
    errors.push({
      paraIndex: i + 1,
      sentence: getSurroundingSentence(text, match.index),
      paragraphIndex: i,
      heading: getNearestHeading(paragraphs, i),
    });
  }

  return errors;
}

function checkEmDashSpacing(text: string, i: number, paragraphs: Paragraph[]) {
  const errors: FormattingError[] = [];
  // Match em dash NOT surrounded by a single space on both sides
  const regex = /(?<! )—(?! )|(?<! )—|—(?! )/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    errors.push({
      paraIndex: i + 1,
      sentence: getSurroundingSentence(text, match.index),
      paragraphIndex: i,
      heading: getNearestHeading(paragraphs, i),
    });
  }
  return errors;
}

function checkHeadingTitleCase(text: string, heading: string | null, i: number) {
  const errors: FormattingError[] = [];
  if (heading && heading !== "NORMAL" && text.trim() !== "") {
    if (!isStrictTitleCase(text)) {
      errors.push({
        paraIndex: i + 1,
        sentence: text,
        paragraphIndex: i,
        heading: text,
      });
    }
  }
  return errors;
}

// function checkLeadingTrailingSpaces(text: string, i: number, paragraphs: Paragraph[]) {
//   const errors: FormattingError[] = [];
//   const leadingMatch = /^\s+/.exec(text);
//   const trailingMatch = /\s+$/.exec(text);

//   if (leadingMatch && text.trim() !== '') {
//     errors.push({
//       paraIndex: i + 1,
//       sentence: getSurroundingSentence(text, leadingMatch.index + leadingMatch[0].length),
//       paragraphIndex: i,
//       heading: getNearestHeading(paragraphs, i),
//       errorSubType: 'leading',
//     });
//   }
//   if (trailingMatch && text.trim() !== '') {
//     errors.push({
//       paraIndex: i + 1,
//       sentence: getSurroundingSentence(text, trailingMatch.index),
//       paragraphIndex: i,
//       heading: getNearestHeading(paragraphs, i),
//       errorSubType: 'trailing',
//     });
//   }
//   return errors;
// }


function checkMissingPunctuation(
  text: string,
  heading: string | null,
  i: number,
  paragraphs: Paragraph[]
): FormattingError[] {
  const errors: FormattingError[] = [];
  const trimmed = text.trim();

  const isHeading = heading && heading !== "NORMAL" && heading !== "LIST";
  if (isHeading) return errors;

  const isList = heading === "LIST";
  if (isList) return errors; // Skip all lists

  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount <= 4) return errors;

  const looksLikeList = /^[A-Z][^.!?]{3,50}$/.test(trimmed);
  if (looksLikeList) return errors;

  if (/[:：]$/.test(trimmed)) return errors;

  // Updated: skip if it contains *any* link
  const containsLink = /(https?:\/\/[^\s)]+|www\.[^\s)]+)/.test(trimmed);
  if (containsLink) return errors;

  if (!/[.?!]$/.test(trimmed)) {
    errors.push({
      paraIndex: i + 1,
      sentence: text,
      paragraphIndex: i,
      heading: getNearestHeading(paragraphs, i),
    });
  }

  return errors;
}




function checkSpaceBeforePunctuation(text: string, i: number, paragraphs: Paragraph[]) {
  const errors: FormattingError[] = [];
  const regex = / [\.,;:!?]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    errors.push({
      paraIndex: i + 1,
      sentence: getSurroundingSentence(text, match.index),
      paragraphIndex: i,
      heading: getNearestHeading(paragraphs, i),
    });
  }
  return errors;
}

function checkConsecutivePunctuation(text: string, i: number, paragraphs: Paragraph[]): FormattingError[] {
  const errors: FormattingError[] = [];

  // Match consecutive punctuation characters except ', ", (, )
  const regex = /([.!?,;:])\1+/g;

  let match;
  while ((match = regex.exec(text)) !== null) {
    // Only consider matches that do not include quotes or parentheses
    const badPunctuation = match[0];
    if (!/['"()]/.test(badPunctuation)) {
      errors.push({
        paraIndex: i + 1,
        sentence: getSurroundingSentence(text, match.index),
        paragraphIndex: i,
        heading: getNearestHeading(paragraphs, i),
      });
    }
  }

  return errors;
}


// === Helpers ===

function getNearestHeading(paragraphs: Paragraph[], index: number): string {
  for (let i = index; i >= 0; i--) {
    const para = paragraphs[i];
    if (para.heading && para.heading !== "NORMAL" && para.text.trim() !== '') {
      return para.text.trim();
    }
  }
  return '';
}

function isStrictTitleCase(text: string): boolean {
  const cleanedText = text.replace(/[^A-Za-z\s]/g, "");
  const words = cleanedText.trim().split(/\s+/);
  return words.every((word) => /^[A-Z]/.test(word));
}

function getSurroundingSentence(text: string, index: number): string {
  const before = text.slice(0, index);
  const after = text.slice(index);
  const start = Math.max(before.lastIndexOf('.'), before.lastIndexOf('\n'), 0);
  const end = after.indexOf('.') !== -1 ? index + after.indexOf('.') + 1 : text.length;
  return text.slice(start, end).trim();
}
