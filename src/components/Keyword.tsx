import { FC, useRef } from 'react';
import clsx from 'clsx';

interface KeywordProps {
  keyword: string;
  onRemove: Function;
}

export const Keyword:FC<KeywordProps> = ({ keyword, onRemove }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <span className={clsx(
      'text-white bg-gray-600 text-xs font-bold rounded-md px-2 py-1 inline-block'
    )}>
      {keyword}
      <button
        ref={buttonRef}
        className={clsx(
          'rounded-sm text-sm font-black text-black-200 cursor-pointer align-middle',
          'select-none leading-[21px] px-2 py-1 ml-1 border',
          'border-black/0 transition-colors duration-150 ease-in-out ',
          'hover:text-white focus:text-white active:text-white active:border-white'
        )}
        onClick={() => {
          // trigger blur to remove focus (and the style)
          buttonRef.current?.blur();
          onRemove(keyword)
        }}
      >
        X
      </button>
    </span>
  );
};