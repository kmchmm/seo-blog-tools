import { HTMLAttributes } from 'react';
import clsx from 'clsx';

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
  return (
    <div
      onClick={() => {
        octoBitsProps.showMapResults(
          octoBitsProps.workerId,
          octoBitsProps.status.trim().toUpperCase() === 'DONE'
        );
      }}
      className={clsx(
        'p-2 w-full cursor-pointer hover:scale-115',
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

        <div className="font-bold flex items-center justify-center">
          {octoBitsProps.status}
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
