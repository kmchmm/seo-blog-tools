import { Button } from '../common';

type Props = {
  loading: boolean;
  totalDocWords: number;
  errorMessage: boolean;
  disableButton: boolean;
  handleClickProceed: () => void;
  sheetValidDocsCount: number;
};

const StatsSection = ({
  loading,
  totalDocWords,
  errorMessage,
  disableButton,
  handleClickProceed,
  sheetValidDocsCount,
}: Props) => {
  return (
    <div className="w-full flex flex-col gap-y-4 mt-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold flex-1">Valid Documents:</p>
        <div className="text-left w-full flex-1">
          <p className={`${loading ? 'bg-gray-500 animate-pulse text-gray-500' : ''}`}>
            {sheetValidDocsCount && !errorMessage ? sheetValidDocsCount : 0}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="font-semibold flex-1">Total Word Count:</p>
        <div className="text-left w-full flex-1">
          <p className={`${loading ? 'bg-gray-500 animate-pulse text-gray-500' : ''}`}>
            {totalDocWords && !errorMessage ? totalDocWords : 0}
          </p>
        </div>
      </div>
      <div className="self-center w-fit">
        <Button
          className="!bg-blue-200 text-gray-100 border-none"
          onClick={handleClickProceed}
          disabled={disableButton}>
          Proceed
        </Button>
      </div>
    </div>
  );
};

export default StatsSection;
