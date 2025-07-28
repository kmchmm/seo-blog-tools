import React, { use, useMemo, useState } from 'react';
import { SystemPrompts } from '../../hooks/useGetSystemPrompts';
import { Loading } from '../Loading';
import { usePutSystemPrompt } from '../../hooks';

import { ToastContext } from '../../context/ToastContext';
import { getModels } from './helpers';
import UpdatePromptModal from './UpdatePromptModal';

interface Props {
  prompts: SystemPrompts[];
  loading: boolean;
  fetchSystemPrompts: () => void;
}

const aiAssistants = ['Claude', 'Gemini'];

export const FetchPrompts: React.FC<Props> = ({
  prompts,
  loading,
  fetchSystemPrompts,
}) => {
  const [selectedAI, setSelectedAI] = useState('claude');
  const [selectedPrompt, setSelectedPrompt] = useState<SystemPrompts | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { showToast } = use(ToastContext);
  const { sendRequest, loading: loadingSubmit, errorMessage } = usePutSystemPrompt();
  const filteredPrompts = useMemo(() => {
    return (
      prompts &&
      prompts.filter(prompt =>
        prompt.promptId.toLowerCase().includes(selectedAI.toLowerCase())
      )
    );
  }, [selectedAI, prompts]);

  const modelOptions = useMemo(() => {
    return getModels(selectedAI);
  }, [selectedAI]);

  const openModal = (prompt: SystemPrompts) => {
    setSelectedPrompt(prompt);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedPrompt(null);
    setIsModalOpen(false);
  };

  const handleInputChange = (field: keyof SystemPrompts, value: string) => {
    if (selectedPrompt) {
      setSelectedPrompt({ ...selectedPrompt, [field]: value });
    }
  };

  const onSuccess = (message: string) => {
    showToast(message);
    closeModal();
    fetchSystemPrompts();
  };

  const handleSubmit = () => {
    const payload = {
      promptId: selectedPrompt?.promptId || '',
      updates: {
        systemPrompt: selectedPrompt?.systemPrompt,
        model: selectedPrompt?.model,
        max_tokens: selectedPrompt?.max_token,
      },
    };

    sendRequest({ payload, onSuccess });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center">
        <Loading size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {errorMessage && <p className="text-red-600 italic mt-2">{errorMessage}</p>}
      <div className="flex gap-2 mb-4 justify-center">
        {aiAssistants.map(assistant => (
          <button
            key={assistant}
            onClick={() => setSelectedAI(assistant.toLowerCase())}
            className={`px-4 py-2 rounded border cursor-pointer ${
              selectedAI.toLowerCase() === assistant.toLowerCase()
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-black'
            } `}>
            {assistant}
          </button>
        ))}
      </div>
      {filteredPrompts.map((prompt, idx) => (
        <div
          key={idx}
          className="border p-4 rounded shadow-sm flex justify-between items-center sm:flex-row flex-col">
          <div className="flex-1">
            <p>
              <strong>ID:</strong> {prompt.promptId}
            </p>
            <p className="line-clamp-3 overflow-hidden text-ellipsis">
              <strong>Model:</strong> {prompt.systemPrompt}
            </p>
            <p>
              <strong>Model:</strong> {prompt.model}
            </p>
            <p>
              <strong>Max Tokens:</strong> {prompt.max_token}
            </p>
          </div>
          <button
            onClick={() => openModal(prompt)}
            className="bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer dark:hover:bg-blue-50 dark:hover:text-gray-800 w-fit">
            Edit
          </button>
        </div>
      ))}
      <UpdatePromptModal
        closeModal={closeModal}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        loading={loadingSubmit}
        modelOptions={modelOptions}
        selectedPrompt={selectedPrompt}
        open={isModalOpen}
      />
    </div>
  );
};
