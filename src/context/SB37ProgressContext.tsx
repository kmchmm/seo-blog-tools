import React, { createContext, use, useEffect, useMemo, useRef, useState } from 'react';
import usePostSB37SingleAnalysis, {
  SB37AnalysisResult,
} from '../hooks/usePostSB37SingleAnalysis';
import { useGetSheetNames, useGetSystemPrompts } from '../hooks';
import {
  AI_PROCESS_DOCUMENT_API_URL,
  AI_PROCESS_SHEET_API_URL,
  AI_MULTIPLE_ASSISTANT_API_URL,
  AI_PROCESS_SHEET_MULTIPLE_ASSISTANT_API_URL,
} from '../services/constants';
import axios, { AxiosError } from 'axios';
import { ToastContext } from './ToastContext';
import { SystemPrompts } from '../hooks/useGetSystemPrompts';
import { promptMap } from './aiAssistant/helpers';

export type SheetInfo = {
  sheetValidDocsCount: number;
  docsTotalWords: number;
};

type BatchMode = 'single' | 'chain-assistant';

type BatchProgressContextType = {
  // batch fields
  formValues: { url: string; sheetName: string };
  batchResult: Record<string, string>;
  loadingSheets: Record<string, boolean>;
  resetBatch: (sheetName: string) => void;
  setFormValues: ({ url, sheetName }: { url: string; sheetName: string }) => void;
  sheetCompleted: Record<string, boolean>;
  sheetCurrentTitle: Record<string, string>;
  sheetErorMessages: Record<string, string>;
  sheetInfo: Record<string, SheetInfo>;
  sheetProgressCount: Record<string, number>;
  startBatch: (
    spreadsheetUrl: string,
    sheetName: string,
    clientId: string,
    mode?: BatchMode
  ) => void;
  updateSheetInfo: (sheetName: string, updates: Partial<SheetInfo>) => void;
  cancelTask: ({
    clientId,
    sheetName,
    isSingleDoc,
    isMultiAssistant,
    mode,
  }: {
    clientId: string;
    sheetName?: string;
    isSingleDoc?: boolean;
    isMultiAssistant?: boolean;
    mode?: BatchMode;
  }) => void;
  sheetCanceling: Record<string, boolean>;
  batchCompletionTime: Record<string, string>;

  // single analysis fields
  analyzeSingleDoc: ({
    clientId,
    docTitle,
    docUrl,
    wordCount,
  }: {
    docUrl: string;
    clientId: string;
    docTitle: string;
    wordCount: number;
  }) => void;
  analyzeMultiAssistantDoc: ({
    docUrl,
    onSuccess,
    clientId,
    docTitle,
    wordCount,
  }: {
    docUrl: string;
    onSuccess: () => void;
    clientId: string;
    docTitle: string;
    wordCount: number;
  }) => void;
  isCompletedSingle: boolean;
  resetSingleAnalysis: () => void;
  setIsCompletedSingle: (value: boolean) => void;
  setUrl: (value: string) => void;
  singleErrorMessage: string;
  singleLoading: boolean;
  singleResult: SB37AnalysisResult | null;
  url: string;
  currentTitleSingle: string;

  //sheetnames
  fetchSheetNames: ({ spreadsheetUrl }: { spreadsheetUrl: string }) => Promise<void>;
  isFetchingSheetNames: boolean;
  resetSheetNames: () => void;
  sheetNames: string[];
  sheetNamesError: string;

  //prompts
  systemPrompts: SystemPrompts[];
  loadingSystemPrompts: boolean;
  errorMessageSystemPrompts: string;
  fetchSystemPrompts: () => void;
  systemPromptObj: Record<
    string,
    {
      systemPrompt: string;
      model: string;
      max_tokens: string;
    }
  >;
};

// eslint-disable-next-line react-refresh/only-export-components
export const Context = createContext<BatchProgressContextType | undefined>(undefined);

export const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [formValues, setFormValues] = useState({ url: '', sheetName: '' });
  const [batchResult, setBatchResult] = useState<Record<string, string>>({});
  const [batchCompletionTime, setBatchCompletionTime] = useState<Record<string, string>>(
    {}
  );

  const [sheetCurrentTitle, setSheetCurrentTitle] = useState<Record<string, string>>({});

  const [loadingSheets, setLoadingSheets] = useState<Record<string, boolean>>({});
  const [sheetCompleted, setSheetCompleted] = useState<Record<string, boolean>>({});
  const [sheetProgressCount, setSheetProgressCount] = useState<Record<string, number>>(
    {}
  );
  const [sheetCanceling, setSheetCanceling] = useState<Record<string, boolean>>({});

  const [sheetInfo, setSheetInfo] = useState<Record<string, SheetInfo>>({});
  const [sheetErorMessages, setSheetErorMessages] = useState<Record<string, string>>({});

  const [url, setUrl] = useState('');
  const [isCompletedSingle, setIsCompletedSingle] = useState(false);

  const {
    loading: loadingSystemPrompts,
    sendRequest: fetchSystemPrompts,
    systemPrompts,
    errorMessage: errorMessageSystemPrompts,
  } = useGetSystemPrompts();

  const { showToast } = use(ToastContext);

  const systemPromptObj = useMemo(() => {
    return promptMap({ prompts: systemPrompts || [] });
  }, [systemPrompts]);

  const eventSourceRef = useRef<EventSource | null>(null);
  const {
    sendRequest: sendSingleRequest,
    loading: singleLoading,
    result: singleResult,
    errorMessage: singleErrorMessage,
    reset: resetSingleAnalysis,
    currentTitle: currentTitleSingle,
  } = usePostSB37SingleAnalysis();

  const {
    sendRequest: fetchSheetNames,
    sheetNames,
    loading: isFetchingSheetNames,
    errorMessage: sheetNamesError,
    reset: resetSheetNames,
  } = useGetSheetNames();

  const updateSheetInfo = (sheetName: string, updates: Partial<SheetInfo>) => {
    setSheetInfo(prev => ({
      ...prev,
      [sheetName]: {
        ...prev[sheetName],
        ...updates,
      },
    }));
  };

  const analyzeSingleDoc = ({
    clientId,
    docTitle,
    docUrl,
    wordCount,
  }: {
    docUrl: string;
    clientId: string;
    docTitle: string;
    wordCount: number;
  }) => {
    sendSingleRequest({ docUrl, clientId, docTitle, wordCount });
  };

  const analyzeMultiAssistantDoc = ({
    docUrl,
    onSuccess,
    clientId,
    docTitle,
    wordCount,
  }: {
    docUrl: string;
    onSuccess: () => void;
    clientId: string;
    docTitle: string;
    wordCount: number;
  }) => {
    sendSingleRequest({
      mode: 'multi-assistant',
      docUrl,
      onSuccess,
      clientId,
      docTitle,
      wordCount,
    });
  };

  const startBatch = (
    spreadsheetUrl: string,
    sheetName: string,
    clientId: string,
    mode: BatchMode = 'single'
  ) => {
    setBatchCompletionTime(prev => ({ ...prev, [sheetName]: '' }));
    setBatchResult(prev => ({ ...prev, [sheetName]: '' }));
    setSheetProgressCount(prev => ({ ...prev, [sheetName]: 0 }));
    setSheetCompleted(prev => ({ ...prev, [sheetName]: false }));
    setLoadingSheets(prev => ({ ...prev, [sheetName]: true }));
    setSheetErorMessages(prev => ({ ...prev, [sheetName]: '' }));

    const API_URL =
      mode === 'chain-assistant'
        ? AI_PROCESS_SHEET_MULTIPLE_ASSISTANT_API_URL
        : AI_PROCESS_SHEET_API_URL;

    const query = `?spreadsheetUrl=${encodeURIComponent(
      spreadsheetUrl
    )}&sheetName=${encodeURIComponent(sheetName)}&clientId=${clientId}`;

    const eventSource = new EventSource(`${API_URL}${query}`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('progress', e => {
      const data = JSON.parse(e.data);

      switch (data.stage) {
        case 'scanning':
          // Initial scanning phase
          break;

        case 'processing':
          // Update current document being processed
          if (data.title) {
            setSheetCurrentTitle(prev => ({ ...prev, [sheetName]: data.title }));
          }
          break;

        case 'complete':
          // Increment progress count when a document is completed
          if (data.status === 'success' && data.resultDocUrl) {
            setSheetProgressCount(prev => ({
              ...prev,
              [sheetName]: (prev[sheetName] || 0) + 1,
            }));
          }
          break;

        case 'error':
          // Handle individual document errors
          if (data.rowNumber) {
            console.warn(`Document error for row ${data.rowNumber}:`, data.message);
          }
          break;

        case 'final':
          // Handle final batch completion
          if (data.status === 'success') {
            setBatchResult(prev => ({
              ...prev,
              [sheetName]: data.spreadsheetUrl || spreadsheetUrl,
            }));
            setLoadingSheets(prev => ({ ...prev, [sheetName]: false }));
            setSheetCompleted(prev => ({ ...prev, [sheetName]: true }));
            setBatchCompletionTime(prev => ({
              ...prev,
              [sheetName]: data.completionTime || '',
            }));
            showToast(
              `${sheetName} has finished processing. ${data.processed} documents processed.`
            );
            eventSource.close();
          }
          break;

        default:
          // Legacy handling for older event formats
          if (data.status === 'success' && !data.stage) {
            setBatchResult(prev => ({
              ...prev,
              [sheetName]: data.spreadsheetUrl || spreadsheetUrl,
            }));
            setLoadingSheets(prev => ({ ...prev, [sheetName]: false }));
            setSheetCompleted(prev => ({ ...prev, [sheetName]: true }));
            setBatchCompletionTime(prev => ({
              ...prev,
              [sheetName]: data.completionTime || '',
            }));
            showToast(`${sheetName} has finished processing.`);
            eventSource.close();
          }
      }
    });

    // Handle error events - this catches actual EventSource errors, not data errors
    eventSource.onerror = e => {
      console.error('EventSource error:', e);

      // Only show error if the connection wasn't intentionally closed
      if (eventSource.readyState === EventSource.CLOSED) {
        // Check if we have completion state first
        const hasCompleted = sheetCompleted[sheetName];
        if (!hasCompleted) {
          setSheetErorMessages(prev => ({
            ...prev,
            [sheetName]: 'Connection lost unexpectedly.',
          }));
          setLoadingSheets(prev => ({ ...prev, [sheetName]: false }));
          setSheetProgressCount(prev => {
            const copy = { ...prev };
            delete copy[sheetName];
            return copy;
          });
        }
      }
      eventSource.close();
    };

    // Handle server-sent error events
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventSource.addEventListener('error', (e: any) => {
      try {
        const data = e.data ? JSON.parse(e.data) : {};
        if (data.message === 'Aborted') {
          setSheetErorMessages(prev => ({
            ...prev,
            [sheetName]: 'Processing was cancelled.',
          }));
        } else {
          setSheetErorMessages(prev => ({
            ...prev,
            [sheetName]: data.message || 'Processing error occurred.',
          }));
        }

        setLoadingSheets(prev => ({ ...prev, [sheetName]: false }));
        setSheetProgressCount(prev => {
          const copy = { ...prev };
          delete copy[sheetName];
          return copy;
        });
        setSheetCompleted(prev => {
          const copy = { ...prev };
          delete copy[sheetName];
          return copy;
        });
      } catch (err) {
        console.error('Error parsing error event:', err);
        setSheetErorMessages(prev => ({
          ...prev,
          [sheetName]: 'Processing error occurred.',
        }));
        setLoadingSheets(prev => ({ ...prev, [sheetName]: false }));
      } finally {
        eventSource.close();
      }
    });
  };

  const resetBatch = (sheetName: string) => {
    eventSourceRef.current?.close();
    setBatchResult(prev => {
      const updated = { ...prev };
      delete updated[sheetName];
      return updated;
    });
    setSheetCurrentTitle(prev => {
      const updated = { ...prev };
      delete updated[sheetName];
      return updated;
    });
    setSheetErorMessages(prev => {
      const updated = { ...prev };
      delete updated[sheetName];
      return updated;
    });
    setSheetInfo(prev => {
      const updated = { ...prev };
      delete updated[sheetName];
      return updated;
    });

    setLoadingSheets(prev => {
      const updated = { ...prev };
      delete updated[sheetName];
      return updated;
    });
    setSheetProgressCount(prev => {
      const copy = { ...prev };
      delete copy[sheetName];
      return copy;
    });

    setSheetCompleted(prev => {
      const copy = { ...prev };
      delete copy[sheetName];
      return copy;
    });
    setBatchCompletionTime(prev => {
      const copy = { ...prev };
      delete copy[sheetName];
      return copy;
    });
  };

  const cancelTask = async ({
    clientId,
    sheetName = '',
    isSingleDoc = false,
    isMultiAssistant = false,
  }: {
    clientId: string;
    sheetName?: string;
    isSingleDoc?: boolean;
    isMultiAssistant?: boolean;
    mode?: BatchMode;
  }) => {
    try {
      let cancelUrl = '';
      if (isSingleDoc) {
        cancelUrl = isMultiAssistant
          ? AI_MULTIPLE_ASSISTANT_API_URL
          : AI_PROCESS_DOCUMENT_API_URL;
      } else {
        cancelUrl = isMultiAssistant
          ? AI_PROCESS_SHEET_MULTIPLE_ASSISTANT_API_URL
          : AI_PROCESS_SHEET_API_URL;
      }

      // Update canceling UI state (only for sheet context)
      if (!isSingleDoc && sheetName) {
        setSheetCanceling(prev => ({ ...prev, [sheetName]: true }));
        setLoadingSheets(prev => ({ ...prev, [sheetName]: false }));
      }

      await axios.post(`${cancelUrl}`, {
        clientId,
        ...(sheetName ? { sheetName } : {}),
      });

      // Close any active EventSource
      eventSourceRef.current?.close();
    } catch (err) {
      const errorMessage = err as AxiosError<{ error: string }>;
      console.warn('Cancellation request failed:', errorMessage.response?.data?.error);
    } finally {
      if (!isSingleDoc && sheetName) {
        setSheetCanceling(prev => ({ ...prev, [sheetName]: false }));
      }
    }
  };

  useEffect(() => {
    fetchSystemPrompts();
  }, []);

  return (
    <Context.Provider
      value={{
        // batch
        batchResult,
        sheetCurrentTitle,
        loadingSheets,
        sheetCompleted,
        sheetProgressCount,
        sheetInfo,
        sheetErorMessages,
        startBatch,
        resetBatch,
        updateSheetInfo,
        setFormValues,
        formValues,
        cancelTask,
        sheetCanceling,
        batchCompletionTime,

        // single
        url,
        setUrl,
        setIsCompletedSingle,
        singleResult,
        singleLoading,
        singleErrorMessage,
        analyzeSingleDoc,
        analyzeMultiAssistantDoc,
        resetSingleAnalysis,
        isCompletedSingle,
        currentTitleSingle,

        //sheetnames
        fetchSheetNames,
        sheetNames,
        isFetchingSheetNames,
        sheetNamesError,
        resetSheetNames,

        //prompts
        systemPrompts,
        loadingSystemPrompts,
        errorMessageSystemPrompts,
        fetchSystemPrompts,
        systemPromptObj,
      }}>
      {children}
    </Context.Provider>
  );
};
