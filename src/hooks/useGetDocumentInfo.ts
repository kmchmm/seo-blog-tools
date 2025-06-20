import { useState, useMemo } from 'react';
import axios from 'axios';

type DocInfo = { title: string; wordCount: number };
export type SingleDoc = { title: string; url: string };

const useGetDocumentInfo = () => {
  const [result, setResult] = useState<DocInfo | null>(null);
  const [batchResults, setBatchResults] = useState<DocInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const reset = () => {
    setResult(null);
    setBatchResults([]);
    setLoading(false);
    setErrorMessage('');
  };

  const sendRequest = async ({ docUrl }: { docUrl: string }) => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3000/api/get-doc-info', {
        docUrl,
      });
      if (res && res.status === 200) {
        setResult(res.data);
      }
    } catch (e) {
      const error =
        e instanceof Error ? e.message : 'ERROR FETCHING DOCUMENT INFORMATION';
      setErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  const sendBatchRequest = async (docs: SingleDoc[]) => {
    setLoading(true);
    setBatchResults([]);
    try {
      const results = await Promise.allSettled(
        docs.map(doc =>
          axios
            .post('http://localhost:3000/api/get-doc-info', {
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
