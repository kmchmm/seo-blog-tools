import { FC, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const Modal: FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center w-screen h-screen">
      <div className="bg-white p-6 rounded-md w-full h-full max-w-screen max-h-screen overflow-auto shadow-lg relative text-black-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-3xl text-red-500 cursor-pointer z-10">
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};
