import { FC } from 'react';
import clsx from 'clsx';

const P1Harvester: FC = () => {
  return (
    <div className={clsx(
      'flex flex-col items-center w-full pt-4 px-3',
      'bg-white-100 dark:bg-blue-600'
    )}>
      <h1 className="text-black-100 dark:text-white-100">
        AK P1 Harvester
      </h1>
    </div>
  );
};

export default P1Harvester;