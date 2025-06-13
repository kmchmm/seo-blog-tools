import { FC } from 'react';
import clsx from 'clsx';

export const Summary: FC = ({}) => {
  return (
    <section
      className={clsx(
        'bg-white-100 border border-black/17.5 rounded-md p-4 bg-white min-h-[410px]'
      )}></section>
  );
};
