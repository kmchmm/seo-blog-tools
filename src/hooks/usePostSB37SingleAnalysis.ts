import { useState } from 'react';
import { SB37AnalysisJSON } from './useParseJsonToText';
import { AI_PROCESS_DOCUMENT_API_URL } from '../services/constants';

export type SB37AnalysisResult = {
  reviewOutput: SB37AnalysisJSON;
  completionTime: string;
  wordCount: number;
  title: string;
};

  // const API_BASE_URL =
  //   import.meta.env.MODE === 'development'
  //     ? import.meta.env.VITE_LOCAL_AI_ASSISTANT_API_URL
  //     : import.meta.env.VITE_PROD_AI_ASSISTANT_API_URL;

const usePostSB37SingleAnalysis = () => {
  const [result, setResult] = useState<SB37AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(null);

  const reset = () => {
    setResult(null);
    setLoading(false);
    setErrorMessage('');
    if (wsInstance?.readyState === WebSocket.OPEN) {
      wsInstance.close();
    }
  };

  const sendRequest = (docUrl: string) => {
    reset();
    setLoading(true);

    const ws = new WebSocket(AI_PROCESS_DOCUMENT_API_URL);

    ws.onopen = () => {
      ws.send(JSON.stringify({ docUrl }));
    };

    ws.onmessage = event => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'start':
          console.log('🟡 Processing started');
          break;
        case 'complete':
          setResult({
            reviewOutput: data.reviewOutput,
            completionTime: data.completionTime,
            wordCount: data.wordCount,
            title: data.title,
          });
          setLoading(false);
          ws.close();
          break;
        case 'error':
          setErrorMessage(data.message || 'Unexpected error');
          setLoading(false);
          ws.close();
          break;
      }
    };

    ws.onerror = () => {
      setErrorMessage('WebSocket error occurred.');
      setLoading(false);
      ws.close();
    };

    ws.onclose = () => {
      console.log('🔴 WebSocket closed');
    };

    setWsInstance(ws);
  };

  return { sendRequest, loading, result, errorMessage, reset };
};

export default usePostSB37SingleAnalysis;
