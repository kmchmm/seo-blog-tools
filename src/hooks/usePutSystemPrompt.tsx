import { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { AI_ASSISTANT_SYSTEM_PROMPTS_URL } from '../services/constants';

export interface UpdatePayload {
  promptId: string;
  sheetName?: string;
  updates: {
    systemPrompt?: string;
    model?: string;
    max_tokens?: string;
  };
}

const usePutSystemPrompt = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const sendRequest = async ({
    payload,
    onSuccess,
  }: {
    payload: UpdatePayload;
    onSuccess: (message: string) => void;
  }) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await axios.put(AI_ASSISTANT_SYSTEM_PROMPTS_URL, payload);
      if (res && res.status === 200) {
        onSuccess(res.data.message);
      }
    } catch (e) {
      const error = e as AxiosError<{ error: string }>;
      setErrorMessage(error?.response?.data?.error || 'Error updating system prompt');
    } finally {
      setLoading(false);
    }
  };

  return { sendRequest, loading, errorMessage };
};

export default usePutSystemPrompt;
