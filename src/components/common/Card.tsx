import clsx from 'clsx';
import React from 'react';

type Props = {
  title: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  customClassName?: string;
};

const Card = ({ title, icon, onClick, active = false, customClassName = '' }: Props) => {
  return (
    <button
      className={clsx({
        'flex flex-col gap-y-2 w-fit max-w-[250px] rounded-lg hover:-translate-y-1 items-center justify-center px-4 py-6 cursor-pointer transform duration-300 text-white bg-blue-400  active:bg-blue-200':
          true,
        [customClassName]: true,
        'bg-blue-1000': active,
      })}
      onClick={onClick}>
      <div>{icon}</div>
      <div className="text-lg font-semibold">{title}</div>
    </button>
  );
};

export default Card;
