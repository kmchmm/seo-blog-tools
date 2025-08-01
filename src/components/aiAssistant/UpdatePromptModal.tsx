import { Button, Input, SelectInput } from '../common';
import { Modal } from '../Modal';
import { SystemPrompts } from '../../hooks/useGetSystemPrompts';
import { useState } from 'react';
import ConfirmModal from '../common/ConfirmModal';

type Props = {
  closeModal: () => void;
  open: boolean;
  selectedPrompt: SystemPrompts | null;
  handleInputChange: (field: keyof SystemPrompts, value: string) => void;
  modelOptions: { label: string; value: string }[];
  loading: boolean;
  handleSubmit: () => void;
};

const UpdatePromptModal = ({
  closeModal,
  open,
  selectedPrompt,
  handleInputChange,
  modelOptions,
  loading,
  handleSubmit,
}: Props) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleClickSave = () => {
    setShowConfirmModal(true);
  };

  const handleClose = () => {
    setShowConfirmModal(false);
  };

  return (
    <Modal
      isOpen={open}
      onClose={closeModal}
      width="80vw"
      height="90vh"
      title="Edit prompt">
      {selectedPrompt && (
        <div className="space-y-2 flex-1 flex flex-col">
          <Input
            label="Prompt ID"
            name="promptId"
            id="promptId"
            value={selectedPrompt.promptId}
            onInputChange={e => handleInputChange('promptId', e.target.value)}
            disabled
          />

          <div className="w-full flex flex-col gap-y-2">
            <label htmlFor="systemPrompt" className="text-base font-medium">
              System Prompt
            </label>
            <textarea
              id="systemPrompt"
              value={selectedPrompt.systemPrompt}
              onChange={e => handleInputChange('systemPrompt', e.target.value)}
              className="w-full p-2 border rounded"
              rows={18}
            />
          </div>
          <div className="flex gap-x-4">
            <SelectInput
              id="model"
              label="Model"
              name="model"
              options={modelOptions}
              value={selectedPrompt.model}
              onChange={e => handleInputChange('model', e.target.value)}
            />

            <Input
              label="Max Tokens"
              name="max_token"
              id="max_token"
              value={selectedPrompt.max_token}
              onInputChange={e => handleInputChange('max_token', e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={closeModal}
              disabled={loading}
              className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 cursor-pointer disabled:pointer-events-none">
              Cancel
            </button>

            <Button disabled={loading} onClick={handleClickSave}>
              Save
            </Button>
          </div>
        </div>
      )}
      <ConfirmModal
        message="Are you sure you want to save these changes?"
        onYesClick={handleSubmit}
        open={showConfirmModal}
        title="Are you sure?"
        toggle={handleClose}
        loading={loading}
        noText="Cancel"
        yesText="Yes, Confirm"
      />
    </Modal>
  );
};

export default UpdatePromptModal;
