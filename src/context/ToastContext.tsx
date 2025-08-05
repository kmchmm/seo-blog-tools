import { createContext, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { hasChildren } from '../types';
import clsx from 'clsx';

const TOAST_DURATION = 5000;

interface ContextProps {
  showToast: Function;
}

export const ToastContext = createContext<ContextProps>({
  showToast: () => {},
});

export const Provider = ({ children }: hasChildren) => {
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const toastimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = (message: string) => {
    if (!showToast) return;
    setToastMessage(message);
    setToastVisible(true);
    toastimeout.current = setTimeout(() => {
      setToastVisible(false);
    }, TOAST_DURATION);
  };

  useEffect(() => {
    return () => {
      clearTimeout(toastimeout.current);
    };
  }, []);

  return (
    <ToastContext value={{ showToast }}>
      {createPortal(
        <div
          className={clsx(
            'fixed py-2 px-4 top-6 right-6 text-white bg-black-300 rounded-md',
            'shadow-[0_3px_5px_-1px_rgba(0,0,0,0.2),0_6px_10px_0_rgba(0,0,0,0.14),0_1px_18px_0_rgba(0,0,0,0.12)]',
            'transition-all duration-500 ',
            toastVisible ? 'opacity-100' : 'hidden opacity-0'
          )}>
          {toastMessage}
        </div>,
        document.body
      )}
      {children}
    </ToastContext>
  );
};
