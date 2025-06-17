import { useState } from 'react';
import { analyzeLinks, LinkAnalysisResult } from '../utils/analyzeLinksWorker';

function useLinkIssuesAnalysis() {
  const [result, setResult] = useState<LinkAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);

  const handleShowHighlightsToggle = (value: boolean) => {
    setShowHighlights(value);
  };

  const runLinkAnalysis = async (text: string) => {
    if (!text) return;
    setLoading(true);
    try {
      const res = await analyzeLinks(text);

      setResult(res);
      setShowHighlights(true);
    } catch (error) {
      console.error('Error during link analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    result,
    showHighlights,
    runLinkAnalysis,
    handleShowHighlightsToggle,
    loading,
  };
}

export default useLinkIssuesAnalysis;
