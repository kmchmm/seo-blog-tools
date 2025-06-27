/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useRef, useState } from 'react';
import usePostSB37SingleAnalysis, {
  SB37AnalysisResult,
} from '../hooks/usePostSB37SingleAnalysis';
import { useGetSheetNames } from '../hooks';
import { AI_PROCESS_SHEET_API_URL } from '../services/constants';
import axios, { AxiosError } from 'axios';

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
  startBatch: (spreadsheetUrl: string, sheetName: string) => void;
  updateSheetInfo: (sheetName: string, updates: Partial<SheetInfo>) => void;

  // single analysis fields
  analyzeSingleDoc: (docUrl: string) => void;
  isCompletedSingle: boolean;
  resetSingleAnalysis: () => void;
  setIsCompletedSingle: (value: boolean) => void;
  setUrl: (value: string) => void;
  singleErrorMessage: string;
  singleLoading: boolean;
  singleResult: SB37AnalysisResult | null;
  url: string;

  //sheetnames
  fetchSheetNames: ({ spreadsheetUrl }: { spreadsheetUrl: string }) => Promise<void>;
  isFetchingSheetNames: boolean;
  resetSheetNames: () => void;
  sheetNames: string[];
  sheetNamesError: string;
};

interface BatchResponse {
  status: 'progress' | 'complete' | 'error';
  message?: string;
  results?: any[];
  progress?: any[];
}

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

  const [sheetInfo, setSheetInfo] = useState<Record<string, SheetInfo>>({});
  const [sheetErorMessages, setSheetErorMessages] = useState<Record<string, string>>({});

  const [url, setUrl] = useState('');
  const [isCompletedSingle, setIsCompletedSingle] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const {
    sendRequest: sendSingleRequest,
    loading: singleLoading,
    result: singleResult,
    errorMessage: singleErrorMessage,
    reset: resetSingleAnalysis,
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

  const analyzeSingleDoc = (docUrl: string) => {
    sendSingleRequest(docUrl);
  };

  const startBatch = async (spreadsheetUrl: string, sheetName: string) => {
    setItems(prev => ({ ...prev, [sheetName]: [] }));
    setSheetProgressCount(prev => ({ ...prev, [sheetName]: 0 }));
    setSheetCompleted(prev => ({ ...prev, [sheetName]: false }));
    setLoadingSheets(prev => ({ ...prev, [sheetName]: true }));
    setSheetErorMessages(prev => ({ ...prev, [sheetName]: '' }));

    const query = `?spreadsheetUrl=${encodeURIComponent(
      spreadsheetUrl
    )}&sheetName=${encodeURIComponent(sheetName)}`;

    const poll = async (): Promise<void> => {
      try {
        const res = await axios.get<BatchResponse>(`${AI_PROCESS_SHEET_API_URL}${query}`);
        const data = res.data;

        if (data.status === 'error') {
          setSheetErorMessages(prev => ({
            ...prev,
            [sheetName]: data.message || 'Batch failed.',
          }));
          setLoadingSheets(prev => ({ ...prev, [sheetName]: false }));
          return;
        }

        if (data.status === 'complete') {
          setItems(prev => ({ ...prev, [sheetName]: data.results || [] }));
          setLoadingSheets(prev => ({ ...prev, [sheetName]: false }));
          setSheetCompleted(prev => ({ ...prev, [sheetName]: true }));
          return;
        }

        if (data.progress) {
          setItems(prev => ({ ...prev, [sheetName]: data.progress || [] }));
          setSheetProgressCount(prev => ({
            ...prev,
            [sheetName]: data?.progress?.length || 0,
          }));
        }

        // Continue polling
        setTimeout(poll, 3000);
      } catch (err) {
        const error = err as AxiosError<{ error: string }>;
        setSheetErorMessages(prev => ({
          ...prev,
          [sheetName]:
            error?.response?.data.error ||
            'Connection error or server closed unexpectedly.',
        }));
        setLoadingSheets(prev => ({ ...prev, [sheetName]: false }));
      }
    };

    poll();
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

        // single
        url,
        setUrl,
        setIsCompletedSingle,
        singleResult,
        singleLoading,
        singleErrorMessage,
        analyzeSingleDoc,
        resetSingleAnalysis,
        isCompletedSingle,

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
