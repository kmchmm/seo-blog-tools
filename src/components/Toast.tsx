import React, { FC, useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: FC<ToastProps> = ({ message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed right-4 top-30 z-50 bg-green-500 text-white px-7 py-2 rounded shadow-lg animate-slide-in">
      {message}
    </div>
  );
};
