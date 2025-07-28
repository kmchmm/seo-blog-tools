import { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { AI_ASSISTANT_SYSTEM_PROMPTS_URL } from '../services/constants';

export interface SystemPrompts {
  promptId: string;
  systemPrompt: string;
  model: string;
  max_token: string;
}

const useGetSystemPrompts = () => {
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompts[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const sendRequest = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await axios.get(AI_ASSISTANT_SYSTEM_PROMPTS_URL);
      if (res && res.status === 200) {
        setSystemPrompts(res.data.prompts);
      }
    } catch (e) {
      const error = e as AxiosError<{ error: string }>;
      setErrorMessage(error?.response?.data?.error || 'Error fetching system prompts');
    } finally {
      setLoading(false);
    }
  };

  return { systemPrompts, sendRequest, loading, errorMessage };
};

export default useGetSystemPrompts;
