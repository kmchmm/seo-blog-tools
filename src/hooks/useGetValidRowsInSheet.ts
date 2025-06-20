import { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { SingleDoc } from './useGetDocumentInfo';

type DocRowsItems = {
  totalDocs: number;
  docs: SingleDoc[];
};

const useGetValidRowsInSheet = () => {
  const [result, setResult] = useState<DocRowsItems | null>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const reset = () => {
    setResult(null);
    setLoading(false);
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
      const res = await axios.post('http://localhost:3000/api/get-sheet-rows', {
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

  return { result, sendRequest, loading, errorMessage, reset };
};

export default useGetValidRowsInSheet;
