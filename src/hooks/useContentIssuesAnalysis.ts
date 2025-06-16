import { useState } from 'react';
import { analyzeContent } from '../utils/contentWorker';
import { CustomHTMLElement } from './useKeywordAnalysis';
import { ContentIssueReport } from '../types/loom';

const useContentIssuesAnalysis = () => {
  const [result, setResult] = useState<ContentIssueReport | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showHighlight, setShowHighlight] = useState(false);

  const handleHighlightToggle = (value: boolean) => {
    setShowHighlight(value);
  };

  const runAnalysis = async ({
    container,
    editMode,
  }: {
    container: CustomHTMLElement;
    editMode: boolean;
  }) => {
    if (!container) {
      setErrorMessage('No document content available for analysis.');
      return;
    }
    try {
      const res = analyzeContent({ container, editMode });

      if (res) {
        setResult(res);
        setErrorMessage('');
        setShowHighlight(true);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed analyzing content issues.';
      setErrorMessage(message);
      setShowHighlight(false);
    }
  };

  return { result, errorMessage, runAnalysis, showHighlight, handleHighlightToggle };
};

export default useContentIssuesAnalysis;
