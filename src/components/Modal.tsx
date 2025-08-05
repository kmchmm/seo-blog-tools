import { FC, ReactNode, useRef } from 'react';
import useOutsideClick from '../hooks/useOutsideClick';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
  height?: string;
  backgroundColor?: string;
  showCloseButton?: boolean; // NEW
  title?: string;
}

export const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  width = '100%',
  height = '100%',
  backgroundColor = '#ffffff',
  showCloseButton = true,
  title = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useOutsideClick(ref as React.RefObject<HTMLElement>, () => {
    onClose();
  });

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
        ref={ref}
        onClick={e => e.stopPropagation()}>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-3xl text-red-500 cursor-pointer z-10">
            &times;
          </button>
        )}
        {title && (
          <p className="text-xl font-bold uppercase pb-4 border-b mb-4">{title}</p>
        )}
        {children}
      </div>
    </div>
  );
};
