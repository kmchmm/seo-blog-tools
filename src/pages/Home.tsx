import { FC } from 'react';
import clsx from 'clsx';

const Home: FC = () => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center w-full pt-4 px-3',
        'bg-white-100 dark:bg-blue-600'
      )}>
      <h1 className="text-black-100 dark:text-white-100 text-5xl">Dashboard</h1>
    </div>
  );
};

export default Home;
