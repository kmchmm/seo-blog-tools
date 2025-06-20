import React, { createContext, useRef, useState } from 'react';
import usePostSB37SingleAnalysis, {
  SB37AnalysisResult,
} from '../hooks/usePostSB37SingleAnalysis';

type ProgressItem = {
  row: number;
  title: string;
  docUrl: string;
  status: string;
  error?: string;
};

type BatchProgressContextType = {
  // batch fields
  setFormValues: ({ url, sheetName }: { url: string; sheetName: string }) => void;
  formValues: { url: string; sheetName: string };
  items: ProgressItem[];
  currentTitle: string;
  isLoading: boolean;
  isCompleted: boolean;
  progressCount: number;
  totalCount: number;
  errorMessage: string;
  startBatch: (spreadsheetUrl: string, sheetName: string) => void;
  resetBatch: () => void;
  setTotalCount: (value: number) => void;

  // single analysis fields
  url: string;
  setIsCompletedSingle: (value: boolean) => void;
  setUrl: (value: string) => void;
  singleResult: SB37AnalysisResult | null;
  singleLoading: boolean;
  singleErrorMessage: string;
  analyzeSingleDoc: (docUrl: string) => void;
  resetSingleAnalysis: () => void;
  isCompletedSingle: boolean;
};

// eslint-disable-next-line react-refresh/only-export-components
export const Context = createContext<BatchProgressContextType | undefined>(undefined);

export const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [formValues, setFormValues] = useState({ url: '', sheetName: '' });
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [currentTitle, setCurrentTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

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

  const analyzeSingleDoc = (docUrl: string) => {
    sendSingleRequest(docUrl);
  };

  const startBatch = (spreadsheetUrl: string, sheetName: string) => {
    setItems([]);
    setProgressCount(0);
    setIsLoading(true);
    setErrorMessage('');
    setIsCompleted(false);

    const query = `?spreadsheetUrl=${encodeURIComponent(
      spreadsheetUrl
    )}&sheetName=${encodeURIComponent(sheetName)}`;

    const eventSource = new EventSource(
      `http://localhost:8022/api/process-sheet-progress${query}`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = e => {
      const data = JSON.parse(e.data);
      if (data.status === 'processing' && data.title) {
        setCurrentTitle(data.title);
      }

      if (data.type === 'progress' && data.status === 'success') {
        setItems(prev => [...prev, data]);
        setProgressCount(prev => prev + 1);
      } else if (data.type === 'complete') {
        setItems(data.results || []);
        setIsLoading(false);
        setIsCompleted(true);
        eventSource.close();
      } else if (data.type === 'error') {
        setErrorMessage(data.message || 'Batch failed.');
        setIsLoading(false);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setErrorMessage('Connection error or server closed unexpectedly.');
      setIsLoading(false);
      eventSource.close();
    };
  };

  const resetBatch = () => {
    eventSourceRef.current?.close();
    setItems([]);
    setCurrentTitle('');
    setIsLoading(false);
    setIsCompleted(false);
    setProgressCount(0);
    setTotalCount(0);
    setErrorMessage('');
  };

  return (
    <Context.Provider
      value={{
        // batch
        items,
        currentTitle,
        isLoading,
        isCompleted,
        progressCount,
        totalCount,
        errorMessage,
        startBatch,
        resetBatch,
        setTotalCount,
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
      }}>
      {children}
    </Context.Provider>
  );
};
