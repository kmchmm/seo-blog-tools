import { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { AI_GET_SHEET_NAMES_API_URL } from '../services/constants';

const useGetSheetNames = () => {
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const reset = () => {
    setSheetNames([]);
    setLoading(false);
    setErrorMessage('');
  };

  const sendRequest = async ({ spreadsheetUrl }: { spreadsheetUrl: string }) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await axios.post(AI_GET_SHEET_NAMES_API_URL, {
        spreadsheetUrl,
      });
      if (res && res.status === 200) {
        setSheetNames(res.data.sheetNames);
      }
    } catch (e) {
      const error = e as AxiosError<{ error: string }>;
      setErrorMessage(error?.response?.data?.error || 'Error fetching sheet names');
    } finally {
      setLoading(false);
    }
  };

  return { sheetNames, sendRequest, loading, errorMessage, reset };
};

export default useGetSheetNames;
