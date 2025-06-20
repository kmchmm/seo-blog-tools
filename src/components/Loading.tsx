import clsx from 'clsx';
import React from 'react';

type LoadingProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export const Loading: React.FC<LoadingProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-[20px] h-[20px] border-[2px]',
    md: 'w-[40px] h-[40px] border-[4px]',
    lg: 'w-[60px] h-[60px] border-[6px]',
  };

  return (
    <div
      className={clsx(
        'border-solid border-gray-100 border-t-blue-100 rounded-[50%] animate-spin inline-block',
        sizeClasses[size],
        className
      )}
    />
  );
};
