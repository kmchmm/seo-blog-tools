import { useState } from 'react';
import {
  analyzeDocument,
  analyzeHeadings,
  analyzeSections,
} from '../utils/keywordWorker';

export type KeywordAnalysisResult = {
  density: number;
  totalKeywordCount: number;
  keywordCounts: {
    focusCount: number;
    altCount: number;
    total: number;
  };
  headingAnalysis: ReturnType<typeof analyzeHeadings>;
  sectionAnalysis: ReturnType<typeof analyzeSections>;
  otherKeywords: Array<{
    category: string;
    keywords: Array<{
      keyword: string;
      count: number;
    }>;
  }>;
  focusKeyphrase: string;
  altKeyphrase: string;
};

export interface CustomHTMLElement extends HTMLElement {
  currentContent: string;
}

const useKeywordAnalysis = () => {
  const [results, setResults] = useState<KeywordAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = ({
    container,
    focusKeyphrase,
    altKeyphrase,
    otherKeywords,
    editMode,
  }: {
    container: CustomHTMLElement | null;
    focusKeyphrase: string;
    altKeyphrase: string;
    otherKeywords: { category: string; keywords: string[] }[];
    editMode: boolean;
  }) => {
    if (!container) {
      setError('No document content available for analysis.');
      return;
    }

    try {
      const result = analyzeDocument({
        container,
        focusKeyphrase,
        altKeyphrase,
        otherKeywords,
        editMode,
      });

      setResults(result);
      setError(null);
    } catch (e) {
      console.error('Keyword analysis failed:', e);
      setError('Something went wrong during analysis. Please try again.');
    }
  };

  return { results, runAnalysis, error };
};

export default useKeywordAnalysis;
