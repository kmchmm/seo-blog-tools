import { Loading } from '../Loading';

type Props = {
  current: number;
  total: number;
  withLoading?: boolean;
};

const ProgressBar = ({ current, total, withLoading = false }: Props) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className=" flex items-center gap-x-2">
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className="bg-green-500 h-4 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {withLoading && <Loading size="sm" />}
    </div>
  );
};

export default ProgressBar;
