import { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { AI_PARSE_ANALYSIS_TO_TEXT_API_URL } from '../services/constants';

export type SB37AnalysisJSON = {
  name: string;
  sections: {
    heading_level: string;
    heading_text: string;
    issues: { problematic_phrase: string; why: string[]; action: string[] }[];
  }[];
  final_evaluation: {
    comments: string[];
    recommendations: string[];
  };
};

const useParseJsonToText = () => {
  const [result, setResult] = useState<{ success: string; docUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const reset = () => {
    setResult(null);
  };

  const sendRequest = async ({
    analysisJson,
    originalDocUrl,
    originalDocName,
    onSuccess,
  }: {
    analysisJson: SB37AnalysisJSON;
    originalDocUrl: string;
    originalDocName: string;
    onSuccess: () => void;
  }) => {
    setLoading(true);

    try {
      const res = await axios.post(AI_PARSE_ANALYSIS_TO_TEXT_API_URL, {
        analysisJson,
        originalDocName,
        originalDocUrl,
      });
      if (res && res.status === 200) {
        setResult(res.data);
        onSuccess();
      }
    } catch (e) {
      const error = e as AxiosError<{ error: string }>;
      setErrorMessage(error?.response?.data?.error || 'ERROR PARSING DOCUMENT');
    } finally {
      setLoading(false);
    }
  };

  return { result, sendRequest, loading, errorMessage, reset };
};

export default useParseJsonToText;
