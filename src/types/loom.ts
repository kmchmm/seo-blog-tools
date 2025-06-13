import { CustomHTMLElement } from '../hooks/useKeywordAnalysis';

export interface FormatError {
  paragraphIndex: number;
  message?: string;
}

export interface ErrorList {
  multipleSpaceErrors: FormatError[];
  emDashErrors: FormatError[];
  leadingTrailingSpaceErrors: FormatError[];
  spaceBeforePunctuationErrors: FormatError[];
  missingPunctuationErrors: FormatError[];
  titleCaseErrors: FormatError[];
}

export interface LinkDetail {
  url: string;
  anchor?: string;
  location?: string;
}

export interface LinkIssue {
  type: string;
  url: string;
  anchor?: string;
  location?: string;
}

export interface AssessmentResult {
  editFieldName: string;
  marks: object[];
  score: number;
  text: string;
  _hasAIFixes: boolean;
  _hasBetaBadge: boolean;
  _hasEditFieldName: boolean;
  _hasJumps: boolean;
  _hasMarks: boolean;
  _hasScore: boolean;
  _identifier: string;
}

export type LinkErrors = {
  invalidLinks: string[];
  missingTrailingSlash: string[];
  duplicateLinks: string[];
  brokenLinks: string[];
  identicalAnchors: string[];
  invalidAnchors: string[];
  internalLinks: LinkDetail[]; // must be objects, not strings
  externalLinks: string[];
};

export type CustomSearchResult = {
  id: string;
  term: string;
  count: number;
};

export interface CONSTRAINT {
  WARNING: number;
  PERFECT: number;
  MAX: number;
}

export type AnalyzeDocumentInput = {
  container: CustomHTMLElement;
  focusKeyphrase: string;
  altKeyphrase: string;
  otherKeywords: Array<{
    category: string;
    keywords: string[];
  }>;
  editMode: boolean;
};

export type Section = {
  heading: string;
  content: string;
};

export interface HeadingEntry {
  level: 'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6';
  text: string;
  wordCount?: number;
}

export type HeadingWithOptionalCount = HeadingEntry & Partial<{ wordCount: number }>;

export interface SectionInfo {
  level: string;
  text: string;
  wordCount: number;
}

export interface SameWordStreak {
  heading: string;
  sentences: string[];
}

export interface ContentIssueReport {
  over300Sections: SectionInfo[];
  sameWordStreaks: SameWordStreak[];
  headings: HeadingWithOptionalCount[];
  totalWordCount: number;
}
