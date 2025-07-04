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

const usePostSB37SingleAnalysis = () => {
  const [result, setResult] = useState<SB37AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');

  let eventSource: EventSource | null = null;

  const reset = () => {
    setResult(null);
    setLoading(false);
    setErrorMessage('');
    setCurrentTitle('');
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };

  const sendSingleAssistantRequest = (docUrl: string) => {
    reset();
    setLoading(true);

    // Replace with your actual SSE endpoint
    const url = new URL(AI_PROCESS_DOCUMENT_API_URL);
    url.searchParams.set('docUrl', docUrl);

    const eventSource = new EventSource(url.toString());

    eventSource.addEventListener('progress', event => {
      const data = JSON.parse(event.data);
      setCurrentTitle(data.title);
    });

    eventSource.addEventListener('complete', event => {
      const data = JSON.parse(event.data);
      setResult({
        reviewOutput: data.reviewOutput,
        completionTime: data.completionTime,
        wordCount: data.wordCount,
        title: data.title,
      });
      setLoading(false);
      eventSource.close();
    });

    eventSource.addEventListener('error', event => {
      console.error('SSE error', event);
      setLoading(false);
      setErrorMessage('Something went wrong while sending server events.');
      eventSource.close();
    });
  };

  const sendMultiAssistantRequest = async (docUrl: string, onSuccess?: () => void) => {
    reset();
    setLoading(true);

    try {
      const response = await axios.post(AI_MULTIPLE_ASSISTANT_API_URL, {
        docUrl,
      });

      if (response.status === 200) {
        setResult(response.data);
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
    if (mode === 'multi-assistant') {
      await sendMultiAssistantRequest(docUrl, onSuccess);
    } else {
      sendSingleAssistantRequest(docUrl);
    }
  };

  return {
    sendRequest,
    loading,
    result,
    errorMessage,
    reset,
    currentTitle,
  };
};

export default usePostSB37SingleAnalysis;
