import { HTMLAttributes, useMemo } from 'react';
import clsx from 'clsx';
import { Loading } from '../components/Loading';

const isDev = import.meta.env.MODE === 'development';

interface OctoBitsPanelProps extends HTMLAttributes<HTMLDivElement> {
  recordId: string;
  desc: string;
  requester: string;
  status: string;
  date: string;
  workerId: string;
  showMapResults: Function;
  deleteAkOctobit: Function;
  loading: boolean;
}

export const OctoBitRecord = (octoBitsProps: OctoBitsPanelProps) => {
  const isActive = useMemo(
    () => octoBitsProps.status.toUpperCase() === 'ACTIVE',
    [octoBitsProps.status]
  );

  return (
    <div
      onClick={() => {
        octoBitsProps.showMapResults(
          octoBitsProps.workerId,
          octoBitsProps.recordId,
          octoBitsProps.status.trim().toUpperCase() === 'DONE'
        );
      }}
      className={clsx(
        'p-2 w-full cursor-pointer',
        'ease-in transition-transform duration-200'
      )}>
      <div
        className={clsx(
          'grid text-center p-4 rounded-md border-yellow-100 border',
          isDev
            ? 'grid-cols-[2fr_3fr_3fr_2fr_2fr_1fr]'
            : 'grid-cols-[2fr_3fr_3fr_2fr_2fr]'
        )}>
        <div className="border-r">
          <div>ID</div>
          <div className="font-bold">{octoBitsProps.recordId}</div>
        </div>

        <div className="border-r">
          <div>Description</div>
          <div>{octoBitsProps.desc}</div>
        </div>

        <div className="border-r">
          <div>Order by</div>
          <div className="font-bold">{octoBitsProps.requester}</div>
        </div>

        <div
          className={clsx(
            'font-bold items-center justify-center',
            isActive ? 'block align-middle [&>div]:h-5 [&>div]:w-5' : 'flex'
          )}>
          {isActive ? <Loading /> : octoBitsProps.status}
        </div>

        <div className="font-bold flex items-center justify-center">
          {octoBitsProps.date.split(' ')[0]}
        </div>
        {isDev && (
          <button
            disabled={octoBitsProps.loading}
            className={
              octoBitsProps.loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }
            onClick={async () => {
              octoBitsProps.deleteAkOctobit(octoBitsProps.recordId);
            }}>
            DELETE
          </button>
        )}
      </div>
    </div>
  );
};
