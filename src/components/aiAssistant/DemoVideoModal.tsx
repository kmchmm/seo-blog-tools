import React from 'react';
import { Modal } from '../Modal';
import { VIDEO_URL } from '../../services/constants';

interface DemoVideoModalProps {
  open: boolean;
  onClose: () => void;
}

const DemoVideoModal: React.FC<DemoVideoModalProps> = ({ open, onClose }) => {
  return (
    <Modal isOpen={open} onClose={onClose} width="800px" height="500px">
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-semibold mb-4 uppercase">Demo Video</h2>
        <video
          src={VIDEO_URL}
          controls
          className="w-full max-w-2xl rounded shadow"
          style={{ maxHeight: '70vh' }}
          autoPlay>
          Your browser does not support the video tag.
        </video>
      </div>
    </Modal>
  );
};

export default DemoVideoModal;
