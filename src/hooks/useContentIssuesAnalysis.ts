import { useState } from 'react';
import { analyzeContent } from '../utils/contentWorker';
import { CustomHTMLElement } from './useKeywordAnalysis';
import { ContentIssueReport } from '../types/loom';

const useContentIssuesAnalysis = () => {
  const [result, setResult] = useState<ContentIssueReport | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const runAnalysis = ({
    container,
    editMode,
  }: {
    container: CustomHTMLElement;
    editMode: boolean;
  }) => {
    try {
      const res = analyzeContent({ container, editMode });

      if (res) {
        setResult(res);
        setErrorMessage('');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed analyzing content issues.';
      setErrorMessage(message);
    }
  };

  return { result, errorMessage, runAnalysis };
};

export default useContentIssuesAnalysis;
