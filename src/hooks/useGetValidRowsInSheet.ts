import { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { SingleDoc } from './useGetDocumentInfo';
import { AI_GET_VALID_ROWS_API_URL } from '../services/constants';

type DocRowsItems = {
  totalDocs: number;
  docs: SingleDoc[];
};

const useGetValidRowsInSheet = () => {
  const [result, setResult] = useState<DocRowsItems | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // const API_BASE_URL =
  //   import.meta.env.MODE === 'development'
  //     ? import.meta.env.VITE_LOCAL_AI_ASSISTANT_API_URL
  //     : import.meta.env.VITE_PROD_AI_ASSISTANT_API_URL;

  const reset = () => {
    setResult(null);
    setLoading(false);
    setErrorMessage('');
  };

  const handleResetErrorMessage = () => {
    setErrorMessage('');
  };

  const sendRequest = async ({
    spreadsheetUrl,
    sheetName,
  }: {
    spreadsheetUrl: string;
    sheetName: string;
  }) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await axios.post(AI_GET_VALID_ROWS_API_URL, {
        spreadsheetUrl,
        sheetName,
      });
      if (res && res.status === 200) {
        setResult(res.data);
      }
    } catch (e) {
      const error = e as AxiosError<{ error: string }>;
      setErrorMessage(error?.response?.data?.error || 'Error fetching documents.');
    } finally {
      setLoading(false);
    }
  };

  return { result, sendRequest, loading, errorMessage, reset, handleResetErrorMessage };
};

export default useGetValidRowsInSheet;
