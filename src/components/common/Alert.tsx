import React from 'react';
import clsx from 'clsx';

type AlertType = 'error' | 'warning' | 'success' | 'info';

interface AlertProps {
  type?: AlertType;
  message: string;
  className?: string;
  icon?: React.ReactNode;
}

const Alert = ({ type = 'info', message, className, icon }: AlertProps) => {
  const baseStyle = 'mt-2 border rounded p-2 text-md flex items-center gap-2 mb-2';

  const typeStyles: Record<AlertType, string> = {
    error: 'border-red-200 bg-red-50 text-red-600',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-700',
    success: 'border-green-200 bg-green-50 text-green-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
  };

  const icons: Record<AlertType, string> = {
    error: '⚠️',
    warning: '⚠️',
    success: '🎉',
    info: 'ℹ️',
  };

  return (
    <div className={clsx(baseStyle, typeStyles[type], className)}>
      <span>{icon ?? icons[type]}</span>
      <p className="font-medium text-sm">{message}</p>
    </div>
  );
};

export default Alert;
