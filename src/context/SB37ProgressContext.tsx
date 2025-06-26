import React, { createContext, useRef, useState } from 'react';
import usePostSB37SingleAnalysis, {
  SB37AnalysisResult,
} from '../hooks/usePostSB37SingleAnalysis';
import { useGetSheetNames } from '../hooks';
import { AI_PROCESS_SHEET_API_URL } from '../services/constants';

type ProgressItem = {
  row: number;
  title: string;
  docUrl: string;
  status: string;
  error?: string;
};

export type SheetInfo = {
  sheetValidDocsCount: number;
  docsTotalWords: number;
};

type BatchProgressContextType = {
  // batch fields
  formValues: { url: string; sheetName: string };
  items: ProgressItem[];
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

// eslint-disable-next-line react-refresh/only-export-components
export const Context = createContext<BatchProgressContextType | undefined>(undefined);

export const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [formValues, setFormValues] = useState({ url: '', sheetName: '' });
  const [items, setItems] = useState<ProgressItem[]>([]);

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

  const startBatch = (spreadsheetUrl: string, sheetName: string) => {
    setItems([]);
    setSheetProgressCount(prev => ({ ...prev, [sheetName]: 0 }));
    setSheetCompleted(prev => ({ ...prev, [sheetName]: false }));
    setLoadingSheets(prev => ({ ...prev, [sheetName]: true }));
    setSheetErorMessages(prev => ({ ...prev, [sheetName]: '' }));

    const query = `?spreadsheetUrl=${encodeURIComponent(
      spreadsheetUrl
    )}&sheetName=${encodeURIComponent(sheetName)}`;

    const eventSource = new EventSource(`${AI_PROCESS_SHEET_API_URL}${query}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = e => {
      const data = JSON.parse(e.data);
      if (data.status === 'processing' && data.title) {
        setSheetCurrentTitle(prev => ({ ...prev, [sheetName]: data.title }));
      }

      if (data.type === 'progress' && data.status === 'success') {
        setItems(prev => [...prev, data]);
        setSheetProgressCount(prev => ({
          ...prev,
          [sheetName]: (prev[sheetName] || 0) + 1,
        }));
      } else if (data.type === 'complete') {
        setItems(data.results || []);
        setLoadingSheets(prev => ({ ...prev, [sheetName]: false }));
        setSheetCompleted(prev => ({ ...prev, [sheetName]: true }));
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
    setItems([]);
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
