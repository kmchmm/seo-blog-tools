import { useState, useRef } from 'react';
import { SB37AnalysisJSON } from './useParseJsonToText';

export type SB37AnalysisResult = {
  reviewOutput: SB37AnalysisJSON;
  completionTime: string;
  wordCount: number;
  title: string;
};

const usePostSB37SingleAnalysis = () => {
  const [result, setResult] = useState<SB37AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);

  const reset = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setResult(null);
    setLoading(false);
    setErrorMessage('');
  };

  const sendRequest = (docUrl: string) => {
    reset(); // clear any prior state
    setLoading(true);

    const eventSource = new EventSource(
      `http://localhost:8022/api/check-doc-progress?docUrl=${encodeURIComponent(docUrl)}`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = event => {
      const data = JSON.parse(event.data);

      if (data.type === 'start') {
        console.log('Started processing', data.docUrl);
      } else if (data.type === 'complete') {
        const { reviewOutput, completionTime, wordCount, title } = data;
        setResult({ reviewOutput, completionTime, wordCount, title });
        setLoading(false);
        eventSource.close();
        eventSourceRef.current = null;
      } else if (data.type === 'error') {
        setErrorMessage(data.message || 'Unexpected error');
        setLoading(false);
        eventSource.close();
        eventSourceRef.current = null;
      }
    };

    eventSource.onerror = () => {
      setErrorMessage('Connection error or server closed unexpectedly');
      setLoading(false);
      eventSource.close();
      eventSourceRef.current = null;
    };
  };

  return { sendRequest, loading, result, errorMessage, reset };
};

export default usePostSB37SingleAnalysis;
