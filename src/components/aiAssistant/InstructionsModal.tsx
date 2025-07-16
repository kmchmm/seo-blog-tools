import React from 'react';
import { Modal } from '../Modal';

type Props = {
  open: boolean;
  onClose: () => void;
  renderContent: () => React.ReactNode;
  title: string;
};

const InstructionsModal = ({ open, onClose, renderContent, title }: Props) => {
  return (
    <Modal isOpen={open} onClose={onClose} height="" width="800px">
      <div className="flex flex-col">
        <div className="uppercase text-2xl font-semibold">{title}</div>
        <div>{renderContent()}</div>
      </div>
    </Modal>
  );
};

export default InstructionsModal;
