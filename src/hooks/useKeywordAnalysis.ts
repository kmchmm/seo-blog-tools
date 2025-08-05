import { useState } from 'react';
import { analyzeDocument } from '../utils/keywordWorker';
import { KeywordAnalysisResult } from '../types/loom';

export interface CustomHTMLElement extends HTMLElement {
  currentContent: string;
}

const useKeywordAnalysis = () => {
  const [results, setResults] = useState<KeywordAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHighlight, setShowHighlight] = useState(false);

  const handleHighlightToggle = (value: boolean) => {
    setShowHighlight(value);
  };

  const handleSetKeywordAnalysisError = (message: string) => {
    setError(message);
  };

  const runAnalysis = async ({
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

      if (result) {
        setResults(result);
        setError(null);
        setShowHighlight(true);
      }
    } catch (e) {
      console.error('Keyword analysis failed:', e);
      setError('Something went wrong during analysis. Please try again.');
      setShowHighlight(false);
    }
  };

  return {
    results,
    runAnalysis,
    error,
    handleSetKeywordAnalysisError,
    showHighlight,
    handleHighlightToggle,
  };
};

export default useKeywordAnalysis;
