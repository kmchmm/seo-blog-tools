import { useCallback, useEffect } from 'react';
import { Button, Input } from '../common';
import { FaCircleChevronRight } from 'react-icons/fa6';

import {
  useGetDocumentInfo,
  useGetValidRowsInSheet,
  useSB37AnalysisContext,
} from '../../hooks';
import { Loading } from '../Loading';
import { SingleDoc } from '../../hooks/useGetDocumentInfo';
import ProgressBar from '../common/ProgressBar';
import { SheetInfo } from '../../context/SB37ProgressContext';

const BatchSB37Analysis = () => {
  const {
    formValues,
    setFormValues,
    startBatch,
    loadingSheets,
    sheetErorMessages,
    sheetProgressCount,
    resetBatch,
    sheetCurrentTitle,
    sheetCompleted,
    sheetInfo,
    updateSheetInfo,
    sheetNames,
    fetchSheetNames,
    isFetchingSheetNames,
    sheetNamesError,
    resetSheetNames,
  } = useSB37AnalysisContext();
  const { sheetName, url } = formValues || {};
  const isSheetProcessing = loadingSheets[sheetName] ? loadingSheets[sheetName] : false;

  const {
    sendRequest: fetchValidRows,
    result: validRows,
    loading: isValidating,
    errorMessage: validRowsError,
    reset: resetValidRows,
    handleResetErrorMessage,
  } = useGetValidRowsInSheet();

  const {
    sendBatchRequest,
    errorMessage: docInfoError,
    loading: isDocInfoLoading,
    reset: resetDocInfo,
  } = useGetDocumentInfo();

  const handleProcessAnother = () => {
    setFormValues({ url: '', sheetName: '' });
    resetBatch(sheetName);
    resetDocInfo();
    resetSheetNames();
    resetValidRows();
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, url: e.target.value });
  };

  const handleClickNext = () => {
    if (!url) return;
    fetchSheetNames({ spreadsheetUrl: url });
  };

  const handleSheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setFormValues({ ...formValues, sheetName: selected });

    if (!sheetInfo[selected]) {
      fetchValidRows({ spreadsheetUrl: url, sheetName: selected });
    }
    if (validRowsError) {
      handleResetErrorMessage();
    }
  };

  const handleClickProceed = () => {
    if (!sheetName) return;
    startBatch(url, sheetName);
  };

  const handleSheetUpdate = useCallback(
    (sheetName: string, updates: Partial<SheetInfo>) => {
      updateSheetInfo(sheetName, updates);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sheetName]
  );

  useEffect(() => {
    if (validRows && !isValidating) {
      (async () => {
        const results = await sendBatchRequest(validRows.docs as SingleDoc[]);
        const totalWords = results.reduce((acc, cur) => acc + (cur.wordCount || 0), 0);

        handleSheetUpdate(sheetName, {
          sheetValidDocsCount: validRows.totalDocs,
          docsTotalWords: totalWords,
        });
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validRows]);

  useEffect(() => {
    if (sheetCompleted[sheetName]) {
      handleSheetUpdate(sheetName, {
        sheetValidDocsCount: 0,
        docsTotalWords: 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetCompleted[sheetName]]);

  const renderSheetSelector = () => (
    <div className="mx-auto max-w-xl w-full">
      <div className="flex gap-5 items-center justify-between">
        <p className="font-semibold">Select Sheet Name:</p>
        <select
          value={sheetName}
          onChange={handleSheetChange}
          className="h-12 px-2 border rounded w-full bg-red-100">
          <option value="" disabled>
            Select a sheet
          </option>
          {sheetNames.map(name => (
            <option key={name} value={name}>
              {name} {loadingSheets[name] ? '(Processing...)' : ''}
              {sheetCompleted[name] && ' ✅'}
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
            {sheetInfo[formValues.sheetName]?.sheetValidDocsCount &&
            (!docInfoError || !validRowsError)
              ? sheetInfo[formValues.sheetName]?.sheetValidDocsCount
              : 0}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="font-semibold flex-1">Total Word Count:</p>
        <div className="text-left w-full flex-1">
          <p
            className={`${isDocInfoLoading || isValidating ? 'bg-gray-500 animate-pulse text-gray-500' : ''}`}>
            {sheetInfo[formValues.sheetName]?.docsTotalWords &&
            (!docInfoError || !validRowsError)
              ? sheetInfo[formValues.sheetName]?.docsTotalWords
              : 0}
          </p>
        </div>
      </div>
      <div className="self-center w-fit">
        <Button
          className="!bg-blue-200 text-gray-100 border-none"
          onClick={handleClickProceed}
          disabled={
            isSheetProcessing ||
            isDocInfoLoading ||
            isValidating ||
            sheetCompleted[sheetName] ||
            Boolean(sheetNamesError) ||
            sheetInfo[sheetName].sheetValidDocsCount === 0
          }>
          Proceed
        </Button>
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="w-full max-w-xl mx-auto">
      <ProgressBar
        current={sheetProgressCount[sheetName]}
        total={sheetInfo[formValues.sheetName]?.sheetValidDocsCount || 1}
      />
      <p className="text-center mt-2 text-sm text-gray-500">
        {sheetProgressCount[sheetName]}/
        {sheetInfo[formValues.sheetName]?.sheetValidDocsCount} completed
      </p>
      {sheetCurrentTitle[sheetName] && (
        <div className="flex items-center gap-x-2 justify-center">
          <p className="text-center mt-1 text-sm italic text-gray-600">
            Currently processing:{' '}
            <span className="font-semibold">{sheetCurrentTitle[sheetName]}</span>
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

  const renderErrors = (sheetName: string) => {
    const isActive = sheetErorMessages[sheetName];
    const error =
      validRowsError ||
      (isActive && (sheetNamesError || sheetErorMessages[sheetName] || docInfoError));

    return error ? <p className="text-red-600">{error}</p> : null;
  };

  return (
    <>
      <div className="w-full flex items-center gap-x-4 sm:flex-row flex-col">
        <Input
          disabled={
            isFetchingSheetNames || isSheetProcessing || sheetCompleted[sheetName]
          }
          id="ai-assistant-input"
          label="Enter the spreadsheet URL:"
          name="ai-assistant-input"
          onInputChange={handleUrlChange}
          value={url}
          customClassName="w-full flex items-center sm:flex-row flex-col"
        />
        <button
          type="button"
          disabled={
            isFetchingSheetNames || isSheetProcessing || sheetCompleted[sheetName] || !url
          }
          className="cursor-pointer hover:scale-125 transform duration-300 disabled:pointer-events-none"
          onClick={handleClickNext}>
          <FaCircleChevronRight color="blue" size={25} />
        </button>
      </div>

      {renderErrors(sheetName)}

      {isFetchingSheetNames ? (
        <div className="self-center flex items-center flex-col">
          <Loading />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto flex flex-col">
          {sheetNames.length > 0 && renderSheetSelector()}
          {(sheetInfo[sheetName] || isValidating || isDocInfoLoading) && renderStats()}
        </div>
      )}

      {isSheetProcessing && (
        <div className="self-center flex items-center flex-col my-2">
          {isSheetProcessing && (
            <p>Processing, this could take a while. Please wait...</p>
          )}
        </div>
      )}

      {isSheetProcessing && !sheetCompleted[sheetName] && renderProgress()}
      {sheetCompleted[sheetName] && !loadingSheets[sheetName] && renderCompletion()}
    </>
  );
};

export default BatchSB37Analysis;
