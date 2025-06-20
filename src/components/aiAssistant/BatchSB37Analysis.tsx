import { useEffect } from 'react';
import { Button, Input } from '../common';
import { FaCircleChevronRight } from 'react-icons/fa6';

import {
  useGetDocumentInfo,
  useGetSheetNames,
  useGetValidRowsInSheet,
  useSB37AnalysisContext,
} from '../../hooks';
import { Loading } from '../Loading';
import { SingleDoc } from '../../hooks/useGetDocumentInfo';
import ProgressBar from '../common/ProgressBar';

const BatchSB37Analysis = () => {
  const {
    formValues,
    setFormValues,
    startBatch,
    isLoading: isBatchLoading,
    errorMessage: batchError,
    progressCount,
    resetBatch,
    currentTitle,
    isCompleted: contextCompleted,
    totalCount,
    setTotalCount,
  } = useSB37AnalysisContext();

  const {
    sendRequest: fetchValidRows,
    result: validRows,
    loading: isValidating,
    errorMessage: validRowsError,
    reset: resetValidRows,
  } = useGetValidRowsInSheet();

  const {
    sendRequest: fetchSheetNames,
    sheetNames,
    loading: isFetchingSheetNames,
    errorMessage: sheetNamesError,
    reset: resetSheetNames,
  } = useGetSheetNames();

  const {
    sendBatchRequest,
    totalBatchWordCount,
    errorMessage: docInfoError,
    loading: isDocInfoLoading,
    reset: resetDocInfo,
  } = useGetDocumentInfo();

  const handleProcessAnother = () => {
    setFormValues({ url: '', sheetName: '' });

    resetBatch();
    resetDocInfo();
    resetSheetNames();
    resetValidRows();
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, url: e.target.value });
  };

  const handleClickNext = () => {
    if (!formValues.url) return;
    fetchSheetNames({ spreadsheetUrl: formValues.url });
  };

  const handleSheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setFormValues({ ...formValues, sheetName: selected });
    fetchValidRows({ spreadsheetUrl: formValues.url, sheetName: selected });
  };

  const handleClickProceed = () => {
    if (!formValues.sheetName) return;
    startBatch(formValues.url, formValues.sheetName);
  };

  useEffect(() => {
    if (validRows && !isValidating) {
      sendBatchRequest(validRows.docs as SingleDoc[]);
      setTotalCount(validRows?.totalDocs || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validRows]);

  const renderSheetSelector = () => (
    <div className="mx-auto max-w-xl w-full">
      <div className="flex gap-5 items-center justify-between">
        <p className="font-semibold">Select Sheet Name:</p>
        <select
          disabled={isBatchLoading}
          value={formValues.sheetName}
          onChange={handleSheetChange}
          className="h-12 px-2 border rounded">
          <option value="" disabled>
            Select a sheet
          </option>
          {sheetNames.map(name => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="w-full flex flex-col gap-y-4 mt-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold flex-1">Valid Documents:</p>
        <div className="text-left w-full flex-1">
          <p
            className={`${isValidating || isDocInfoLoading ? 'bg-gray-500 animate-pulse text-gray-500' : ''}`}>
            {validRows && (!docInfoError || !validRowsError) ? validRows?.totalDocs : 0}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="font-semibold flex-1">Total Word Count:</p>
        <div className="text-left w-full flex-1">
          <p
            className={`${isDocInfoLoading || isValidating ? 'bg-gray-500 animate-pulse text-gray-500' : ''}`}>
            {!docInfoError || !validRowsError ? totalBatchWordCount : 0}
          </p>
        </div>
      </div>
      <div className="self-center w-fit">
        <Button
          className="!bg-blue-200 text-gray-100 border-none"
          onClick={handleClickProceed}
          disabled={
            isBatchLoading || isDocInfoLoading || isValidating || contextCompleted
          }>
          Proceed
        </Button>
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="w-full max-w-xl mx-auto">
      <ProgressBar current={progressCount} total={totalCount || 1} />
      <p className="text-center mt-2 text-sm text-gray-500">
        {progressCount}/{totalCount} completed
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

  const renderCompletion = () => (
    <div className="mt-6 w-full max-w-xl mx-auto flex flex-col items-center gap-4">
      <p className="text-green-600 font-semibold">Batch analysis completed!</p>
      <Button
        className="!bg-blue-200 text-gray-100 border-none px-4 py-2"
        onClick={handleProcessAnother}>
        Process Another Batch
      </Button>
    </div>
  );

  const renderErrors = () => {
    const error = sheetNamesError || validRowsError || batchError || docInfoError;
    return error ? <p className="text-red-600">{error}</p> : null;
  };

  return (
    <>
      <div className="w-full flex items-center gap-x-4 sm:flex-row flex-col">
        <Input
          disabled={isFetchingSheetNames || isBatchLoading || contextCompleted}
          id="ai-assistant-input"
          label="Enter the spreadsheet URL:"
          name="ai-assistant-input"
          onInputChange={handleUrlChange}
          value={formValues.url}
          customClassName="w-full flex items-center sm:flex-row flex-col"
        />
        <button
          type="button"
          disabled={
            isFetchingSheetNames || isBatchLoading || contextCompleted || !formValues.url
          }
          className="cursor-pointer hover:scale-125 transform duration-300 disabled:pointer-events-none"
          onClick={handleClickNext}>
          <FaCircleChevronRight color="blue" size={25} />
        </button>
      </div>

      {renderErrors()}

      {isFetchingSheetNames ? (
        <div className="self-center flex items-center flex-col">
          <Loading />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto flex flex-col">
          {sheetNames.length > 0 && renderSheetSelector()}
          {(validRows || isValidating) && renderStats()}
        </div>
      )}

      {isBatchLoading && (
        <div className="self-center flex items-center flex-col my-2">
          {isBatchLoading && <p>Processing, this could take a while. Please wait...</p>}
        </div>
      )}

      {isBatchLoading && !contextCompleted && renderProgress()}
      {contextCompleted && !isBatchLoading && renderCompletion()}
    </>
  );
};

export default BatchSB37Analysis;
