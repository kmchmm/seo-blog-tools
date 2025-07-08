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

  const sendSingleAssistantRequest = (docUrl: string, clientId: string) => {
    reset();
    setLoading(true);

    const url = new URL(AI_PROCESS_DOCUMENT_API_URL);
    url.searchParams.set('docUrl', docUrl);
    url.searchParams.set('clientId', clientId);

    const eventSourceInstance = new EventSource(url.toString());
    eventSource = eventSourceInstance;

    eventSourceInstance.addEventListener('progress', event => {
      const data = JSON.parse(event.data);
      setCurrentTitle(data.title);
    });

    eventSourceInstance.addEventListener('complete', event => {
      const data = JSON.parse(event.data);
      setResult({
        reviewOutput: data.reviewOutput,
        completionTime: data.completionTime,
        wordCount: data.wordCount,
        title: data.title,
      });
      setLoading(false);
      eventSourceInstance.close();
    });

    eventSourceInstance.addEventListener('error', event => {
      const messageEvent = event as MessageEvent;

      setLoading(false);
      eventSourceInstance.close();

      if (!messageEvent.data) {
        console.warn('🔌 Connection lost or unexpected error with no message.');
        return; // Don't show error message
      }

      try {
        const data = JSON.parse(messageEvent.data);
        if (data?.message === 'Aborted') {
          return;
        }

        setErrorMessage(
          data?.message || 'Something went wrong while sending server events. Code 1'
        );
      } catch (e) {
        const error =
          e instanceof Error
            ? e.message
            : 'Something went wrong while sending server events. Code 2';
        setErrorMessage(error);
      }
    });
  };

  const sendMultiAssistantRequest = async (
    docUrl: string,
    clientId: string,
    onSuccess?: () => void
  ) => {
    reset();
    setLoading(true);

    try {
      const response = await axios.post(AI_MULTIPLE_ASSISTANT_API_URL, {
        docUrl,
        clientId,
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
    clientId,
    onSuccess,
  }: {
    mode?: 'multi-assistant' | 'single';
    docUrl: string;
    clientId: string;
    onSuccess?: () => void;
  }) => {
    if (mode === 'multi-assistant') {
      await sendMultiAssistantRequest(docUrl, clientId, onSuccess);
    } else {
      sendSingleAssistantRequest(docUrl, clientId);
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
