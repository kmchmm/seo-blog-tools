import { useState, useCallback } from 'react';
import { LinkIssue } from '../types/loom';
import { analyzeLinks, LinkAnalysisResult } from '../utils/analyzeLinksWorker';

function useLinkIssuesAnalysis({
  onLinkIssues,
}: {
  onLinkIssues?: (issues: LinkIssue[]) => void;
}) {
  const [result, setResult] = useState<LinkAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);

  const handleShowHighlightsToggle = (value: boolean) => {
    setShowHighlights(value);
  };

  const runLinkAnalysis = useCallback(
    async (text: string) => {
      if (!text) return;
      setLoading(true);
      try {
        const res = await analyzeLinks(text);
        console.log('analyzeLinks result:', res);

        setResult(res);

        if (typeof onLinkIssues === 'function') {
          const issues: LinkIssue[] = [];

          Object.entries(res).forEach(([type, details]) => {
            console.log(`Type: ${type}, Details:`, details);
            if (Array.isArray(details)) {
              details.forEach(entry => {
                if (typeof entry === 'string') {
                  issues.push({ type, url: entry });
                } else {
                  issues.push({ type, url: entry.url, anchor: entry.anchor });
                }
              });
            }
          });

          onLinkIssues(issues);
        }

        setShowHighlights(true);
      } catch (error) {
        console.error('Error during link analysis:', error);
      } finally {
        setLoading(false);
      }
    },
    [onLinkIssues]
  );

  return {
    result,
    showHighlights,
    runLinkAnalysis,
    handleShowHighlightsToggle,
    loading,
  };
}

export default useLinkIssuesAnalysis;
