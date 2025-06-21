import ProgressBar from '../common/ProgressBar';
import { Loading } from '../Loading';

type Props = {
  currentProgress: number;
  currentTitle: string;
  validDocCount: number;
};

const ProgressSection = ({ currentProgress, currentTitle, validDocCount }: Props) => {
  return (
    <div className="w-full max-w-xl mx-auto">
      <ProgressBar current={currentProgress} total={validDocCount || 1} />
      <p className="text-center mt-2 text-sm text-gray-500">
        {currentProgress}/{validDocCount} completed
      </p>
      {currentTitle && (
        <div className="flex items-center gap-x-2 justify-center">
          <p className="text-center mt-1 text-sm italic text-gray-600">
            Currently processing: <span className="font-semibold">{currentTitle}</span>
          </p>
          <Loading size="sm" />
        </div>
      )}
    </div>
  );
};

export default ProgressSection;
