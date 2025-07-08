import React, { createContext, use, useRef, useState } from 'react';
import usePostSB37SingleAnalysis, {
  SB37AnalysisResult,
} from '../hooks/usePostSB37SingleAnalysis';
import { useGetSheetNames } from '../hooks';
import {
  AI_PROCESS_DOCUMENT_API_URL,
  AI_PROCESS_SHEET_API_URL,
} from '../services/constants';
import axios, { AxiosError } from 'axios';
import { ToastContext } from './ToastContext';

export type ProgressItem = {
  row: number;
  title: string;
  docUrl: string;
  status: string;
  error?: string;
  completionTime?: string;
};

export type SheetInfo = {
  sheetValidDocsCount: number;
  docsTotalWords: number;
};

type BatchProgressContextType = {
  // batch fields
  formValues: { url: string; sheetName: string };
  items: Record<string, ProgressItem[]>;
  loadingSheets: Record<string, boolean>;
  resetBatch: (sheetName: string) => void;
  setFormValues: ({ url, sheetName }: { url: string; sheetName: string }) => void;
  sheetCompleted: Record<string, boolean>;
  sheetCurrentTitle: Record<string, string>;
  sheetErorMessages: Record<string, string>;
  sheetInfo: Record<string, SheetInfo>;
  sheetProgressCount: Record<string, number>;
  startBatch: (spreadsheetUrl: string, sheetName: string, clientId: string) => void;
  updateSheetInfo: (sheetName: string, updates: Partial<SheetInfo>) => void;
  cancelTask: ({
    clientId,
    sheetName,
  }: {
    clientId: string;
    sheetName?: string;
    isSingleDoc?: boolean;
  }) => void;
  sheetCanceling: Record<string, boolean>;

  // single analysis fields
  analyzeSingleDoc: (docUrl: string, clientId: string) => void;
  analyzeMultiAssistantDoc: ({
    docUrl,
    onSuccess,
    clientId,
  }: {
    docUrl: string;
    onSuccess: () => void;
    clientId: string;
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
};

// eslint-disable-next-line react-refresh/only-export-components
export const Context = createContext<BatchProgressContextType | undefined>(undefined);

export const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [formValues, setFormValues] = useState({ url: '', sheetName: '' });
  const [items, setItems] = useState<Record<string, ProgressItem[]>>({});

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

  const { showToast } = use(ToastContext);

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

  const analyzeSingleDoc = (docUrl: string, clientId: string) => {
    sendSingleRequest({ docUrl, clientId });
  };

  //TODO
  const analyzeMultiAssistantDoc = ({
    docUrl,
    onSuccess,
    clientId,
  }: {
    docUrl: string;
    onSuccess: () => void;
    clientId: string;
  }) => {
    sendSingleRequest({ mode: 'multi-assistant', docUrl, onSuccess, clientId });
  };

  const startBatch = (spreadsheetUrl: string, sheetName: string, clientId: string) => {
    setItems(prev => ({ ...prev, [sheetName]: [] }));
    setSheetProgressCount(prev => ({ ...prev, [sheetName]: 0 }));
    setSheetCompleted(prev => ({ ...prev, [sheetName]: false }));
    setLoadingSheets(prev => ({ ...prev, [sheetName]: true }));
    setSheetErorMessages(prev => ({ ...prev, [sheetName]: '' }));

    const query = `?spreadsheetUrl=${encodeURIComponent(
      spreadsheetUrl
    )}&sheetName=${encodeURIComponent(sheetName)}&clientId=${clientId}`;

    const eventSource = new EventSource(`${AI_PROCESS_SHEET_API_URL}${query}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = e => {
      const data = JSON.parse(e.data);
      if (data.status === 'processing' && data.title) {
        setSheetCurrentTitle(prev => ({ ...prev, [sheetName]: data.title }));
      }

      if (data.type === 'progress' && data.status === 'success') {
        setSheetProgressCount(prev => ({
          ...prev,
          [sheetName]: (prev[sheetName] || 0) + 1,
        }));
      } else if (data.type === 'complete') {
        setItems(prev => ({ ...prev, [sheetName]: data.results || [] }));
        setLoadingSheets(prev => ({ ...prev, [sheetName]: false }));
        setSheetCompleted(prev => ({ ...prev, [sheetName]: true }));
        showToast(`${data.sheetName} has finished processing.`);
        eventSource.close();
      } else if (data.type === 'error') {
        setSheetErorMessages(prev => ({
          ...prev,
          [sheetName]: data.message || 'Batch failed.',
        }));
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
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setSheetErorMessages(prev => ({
        ...prev,
        [sheetName]: 'Connection error or server closed unexpectedly.',
      }));
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
      eventSource.close();
    };
  };

  const resetBatch = (sheetName: string) => {
    eventSourceRef.current?.close();
    setItems(prev => {
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
  };

  const cancelTask = async ({
    clientId,
    sheetName = '',
    isSingleDoc = false,
  }: {
    clientId: string;
    sheetName?: string;
    isSingleDoc?: boolean;
  }) => {
    try {
      const cancelUrl = isSingleDoc
        ? `${AI_PROCESS_DOCUMENT_API_URL}/process-document/cancel`
        : `${AI_PROCESS_SHEET_API_URL}/process-sheet/cancel`;

      // Update canceling UI state (only for sheet context)
      if (!isSingleDoc && sheetName) {
        setSheetCanceling(prev => ({ ...prev, [sheetName]: true }));
        setLoadingSheets(prev => ({ ...prev, [sheetName]: false }));
      }

      await axios.post(cancelUrl, {
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

  return (
    <Context.Provider
      value={{
        // batch
        items,
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
      }}>
      {children}
    </Context.Provider>
  );
};
