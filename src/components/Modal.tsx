import { FC, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
  height?: string;
  backgroundColor?: string;
  showCloseButton?: boolean; // NEW
}

export const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  width = '100%',
  height = '100%',
  backgroundColor = '#ffffff',
  showCloseButton = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center w-screen h-screen">
      <div
        className="p-6 rounded-md shadow-lg relative overflow-auto"
        style={{
          width,
          height,
          maxWidth: '100vw',
          maxHeight: '100vh',
          backgroundColor,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-3xl text-red-500 cursor-pointer z-10"
          >
            &times;
          </button>
        )}
        {children}
      </div>
    </div>
  );
};
