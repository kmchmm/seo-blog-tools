import clsx from 'clsx';

export const Loading = () => {
  return (
    <div
      className={clsx(
        'border-[4px] border-solid border-gray-100 border-t-blue-100 rounded-[50%]',
        'animate-spin w-[40px] h-[40px] inline-block mt-[10px]'
      )}></div>
  );
};
