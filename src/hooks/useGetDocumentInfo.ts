import { useState, useMemo } from 'react';
import axios, { AxiosError } from 'axios';
import { AI_GET_DOC_INFO_API_URL } from '../services/constants';

type DocInfo = { title: string; wordCount: number };
export type SingleDoc = { title: string; url: string };

const useGetDocumentInfo = () => {
  const [result, setResult] = useState<DocInfo | null>(null);
  const [batchResults, setBatchResults] = useState<DocInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // const API_BASE_URL =
  //   import.meta.env.MODE === 'development'
  //     ? import.meta.env.VITE_LOCAL_AI_ASSISTANT_API_URL
  //     : import.meta.env.VITE_PROD_AI_ASSISTANT_API_URL;

  const reset = () => {
    setResult(null);
    setBatchResults([]);
    setLoading(false);
    setErrorMessage('');
  };

  const sendRequest = async ({ docUrl }: { docUrl: string }) => {
    setLoading(true);
    try {
      const res = await axios.post(AI_GET_DOC_INFO_API_URL, {
        docUrl,
      });

      if (res && res.status === 200) {
        setResult(res.data);
      }
    } catch (e) {
      const error = e as AxiosError<{ error: string }>;
      console.log(`error`, error);
      setErrorMessage(error?.response?.data?.error as string);
    } finally {
      setLoading(false);
    }
  };

  const sendBatchRequest = async (docs: SingleDoc[]): Promise<DocInfo[]> => {
    setLoading(true);
    setBatchResults([]);
    try {
      const results = await Promise.allSettled(
        docs.map(doc =>
          axios
            .post(AI_GET_DOC_INFO_API_URL, {
              docUrl: doc.url,
            })
            .then(res => ({
              title: doc.title,
              wordCount: res.data.wordCount,
            }))
        )
      );

      const successfulResults = results
        .filter((r): r is PromiseFulfilledResult<DocInfo> => r.status === 'fulfilled')
        .map(r => r.value);

      setBatchResults(successfulResults);
      return successfulResults;
    } catch (e) {
      const error = e instanceof Error ? e.message : 'ERROR FETCHING MULTIPLE DOCUMENTS';
      setErrorMessage(error);
      setBatchResults([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const totalBatchWordCount = useMemo(() => {
    return batchResults.reduce((acc, doc) => acc + (doc.wordCount || 0), 0);
  }, [batchResults]);

  return {
    result,
    batchResults,
    totalBatchWordCount,
    sendRequest,
    sendBatchRequest,
    loading,
    errorMessage,
    reset,
  };
};

export default useGetDocumentInfo;
