import { useState } from 'react';
import axios, { AxiosError } from 'axios';
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

  const reset = () => {
    setResult(null);
    setLoading(false);
    setErrorMessage('');
  };

  const sendRequest = async (docUrl: string) => {
    reset();
    setLoading(true);

    try {
      const res = await axios.get(`${AI_PROCESS_DOCUMENT_API_URL}`, {
        params: { docUrl },
      });

      const data = res.data;

      if (data.type === 'complete') {
        const { reviewOutput, completionTime, wordCount, title } = data;
        setResult({ reviewOutput, completionTime, wordCount, title });
      } else if (data.type === 'error') {
        setErrorMessage(data.message || 'Unexpected error');
      }
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      setErrorMessage(error?.response?.data?.error || 'Network or server error');
    } finally {
      setLoading(false);
    }
  };

  return { sendRequest, loading, result, errorMessage, reset };
};

export default usePostSB37SingleAnalysis;
