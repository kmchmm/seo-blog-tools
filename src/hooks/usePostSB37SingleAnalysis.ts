import { useState } from 'react';
import { SB37AnalysisJSON } from './useParseJsonToText';
import {
  AI_MULTIPLE_ASSISTANT_API_URL,
  AI_PROCESS_DOCUMENT_API_URL,
} from '../services/constants';
import axios, { AxiosError } from 'axios';

export type SB37AnalysisResult = {
  reviewOutput: SB37AnalysisJSON;
  completionTime: string;
  wordCount: number;
  title: string;
  doc_url?: string;
};

const usePostSB37Analysis = () => {
  const [result, setResult] = useState<SB37AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const reset = () => {
    setResult(null);
    setLoading(false);
    setErrorMessage('');
  };

  const sendSingleAssistantRequest = async (docUrl: string) => {
    setLoading(true);
    setErrorMessage('');
    setResult(null);

    try {
      const response = await axios.post(`${AI_PROCESS_DOCUMENT_API_URL}`, {
        docUrl,
      });

      const data = response.data;

      if (data.type === 'complete') {
        setResult({
          reviewOutput: data.reviewOutput,
          completionTime: data.completionTime,
          wordCount: data.wordCount,
          title: data.title,
        });
      } else if (data.type === 'error') {
        setErrorMessage(data.message || 'Unexpected error');
      } else {
        setErrorMessage('Unexpected response type');
      }
    } catch (e) {
      const error = e as AxiosError<{ error: string }>;
      console.error('Request failed:', error);
      setErrorMessage(error.response?.data?.error || 'Network or server error');
    } finally {
      setLoading(false);
    }
  };

  const sendMultiAssistantRequest = async (docUrl: string, onSuccess?: () => void) => {
    try {
      const result = await axios.post(AI_MULTIPLE_ASSISTANT_API_URL, {
        docUrl,
      });

      if (result && result.status === 200) {
        setResult(result.data);
        if (onSuccess) onSuccess();
      }
    } catch (e) {
      const error = e as AxiosError<{ error: string }>;
      const { message } = error || {};
      setErrorMessage(message || 'Something went wrong. Code 1');
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async ({
    mode = 'single',
    docUrl,
    onSuccess,
  }: {
    mode?: 'multi-assistant' | 'single';
    docUrl: string;
    onSuccess?: () => void;
  }) => {
    reset();
    setLoading(true);

    if (mode === 'multi-assistant') {
      await sendMultiAssistantRequest(docUrl, onSuccess);
    } else {
      sendSingleAssistantRequest(docUrl);
    }
  };

  return { sendRequest, loading, result, errorMessage, reset };
};

export default usePostSB37Analysis;
