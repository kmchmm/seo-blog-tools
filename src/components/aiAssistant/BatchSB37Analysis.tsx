import React, { use, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../common';
import { IoMdRefresh } from 'react-icons/io';

import {
  useAuth,
  useGetDocumentInfo,
  useGetValidRowsInSheet,
  useSB37AnalysisContext,
} from '../../hooks';
import { Loading } from '../Loading';
import { SingleDoc } from '../../hooks/useGetDocumentInfo';
import { SheetInfo } from '../../context/SB37ProgressContext';
import ProgressBar from '../common/ProgressBar';
import { getEstimatedTime } from './helpers';
import { formatSecondsString } from '../../utils/formatter';
import { ToastContext } from '../../context/ToastContext';
import InputSection from './InputSection';
import InstructionsModal from './InstructionsModal';
import FAQModal from './FAQModal';
import { steps } from './constants';
import DemoVideoModal from './DemoVideoModal';

const { VITE_SECRET_EMAIL } = import.meta.env;

const BatchSB37Analysis = () => {
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showInstruction, setShowInstruction] = useState(false);
  const [showDemoVideoModal, setShowDemoVideoModal] = useState(false);
  const { showToast } = use(ToastContext);
  const { userData } = useAuth();
  const { id: clientId } = userData;
  const {
    formValues,
    setFormValues,
    startBatch,
    loadingSheets,
    sheetErorMessages,
    resetBatch,
    sheetCurrentTitle,
    sheetCompleted,
    sheetInfo,
    updateSheetInfo,
    sheetNames,
    fetchSheetNames,
    isFetchingSheetNames,
    sheetNamesError,
    sheetProgressCount,
    cancelTask,
    sheetCanceling,
    batchCompletionTime,
  } = useSB37AnalysisContext();
  const { sheetName, url } = formValues || {};

  const isSheetProcessing = loadingSheets[sheetName] ? loadingSheets[sheetName] : false;
  const hasActiveSheets = Object.values(loadingSheets).some(Boolean);

  const {
    sendRequest: fetchValidRows,
    result: validRows,
    loading: isValidating,
    errorMessage: validRowsError,
    handleResetErrorMessage,
  } = useGetValidRowsInSheet();

  const {
    sendBatchRequest,
    errorMessage: docInfoError,
    loading: isDocInfoLoading,
  } = useGetDocumentInfo();

  const estimatedTime = useMemo(() => {
    if (!sheetInfo[sheetName]) return;
    return getEstimatedTime(sheetInfo[sheetName].docsTotalWords || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetInfo[sheetName]]);

  const completionTime = useMemo(() => {
    if (!batchCompletionTime[sheetName]) return;
    const timeString = batchCompletionTime[sheetName].split(' ');

    return timeString[0] || 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchCompletionTime[sheetName]]);

  const refetchValidRows = () => {
    fetchValidRows({ spreadsheetUrl: url, sheetName });
  };

  const handleProcessAnother = () => {
    resetBatch(sheetName);
    setShowInstruction(true);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, url: e.target.value });
  };

  const handleClickNext = () => {
    if (!url) return;
    if (validRowsError) {
      handleResetErrorMessage();
    }
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
    setShowInstruction(false);
  };

  const handleClickProceed = () => {
    if (!sheetName) return;
    showToast(`SB37 batch analysis started for ${sheetName}.`);
    startBatch(url, sheetName, `${clientId}`);
  };

  const handleClickProceedMultiAssistant = () => {
    if (!sheetName) return;
    showToast(`SB37 batch analysis started for ${sheetName}.`);
    startBatch(url, sheetName, `${clientId}`, 'chain-assistant');
  };

  const handleSheetUpdate = useCallback(
    (sheetName: string, updates: Partial<SheetInfo>) => {
      updateSheetInfo(sheetName, updates);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sheetName]
  );

  const onCancelClick = () => {
    showToast(`Batch analysis cancelled for ${sheetName}.`);
    cancelTask({ clientId: `${clientId}`, sheetName });
  };

  const handleClickViewInstructions = () => {
    setShowInstructionsModal(true);
  };

  const handleCloseViewInstructions = () => {
    setShowInstructionsModal(false);
  };

  const handleClickFAQ = () => {
    setShowFAQModal(true);
  };

  const handleCloseFAQ = () => {
    setShowFAQModal(false);
  };

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
      fetchValidRows({ spreadsheetUrl: url, sheetName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetCompleted[sheetName]]);

  const renderInstructionModalContent = () => (
    <ul className="list-decimal p-6">
      {steps.batchAnalysis.map(step => (
        <li className="mb-2" key={step.id}>
          {step.step}
          {step.listItem && (
            <ul className="list-disc max-w-md mx-auto ml-6 mt-2">
              {step.listItem.map((li, idx) => (
                <li key={`${step.id}-subitem-${idx}`}>{li}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );

  const renderSheetSelector = () => (
    <div className="mx-auto max-w-xl w-full">
      <div className="flex gap-5 items-center justify-between">
        <p className="font-semibold">Select Sheet Name:</p>
        <select
          value={sheetName}
          onChange={handleSheetChange}
          disabled={isDocInfoLoading || isValidating}
          className="h-12 px-2 border rounded w-full cursor-pointer">
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
        {sheetName && !isValidating && !isDocInfoLoading && !isSheetProcessing && (
          <button onClick={refetchValidRows} className="cursor-pointer">
            <IoMdRefresh size={25} />
          </button>
        )}
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
      <div className="flex items-center justify-between">
        <p className="font-semibold flex-1">Estimated Completion Time:</p>
        <div className="text-left w-full flex-1">
          <p
            className={`${isValidating || isDocInfoLoading ? 'bg-gray-500 animate-pulse text-gray-500' : ''}`}>
            {estimatedTime ? estimatedTime : ''}s
          </p>
        </div>
      </div>

      <div className="self-center w-fit flex gap-x-2">
        {!isSheetProcessing ? (
          <>
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
              Proceed with Batch Analysis
            </Button>
            {userData.email.toLowerCase() === VITE_SECRET_EMAIL && (
              <Button
                onClick={handleClickProceedMultiAssistant}
                className="!bg-blue-200 text-white border-none"
                disabled={
                  isSheetProcessing ||
                  isDocInfoLoading ||
                  isValidating ||
                  sheetCompleted[sheetName] ||
                  Boolean(sheetNamesError) ||
                  sheetInfo[sheetName].sheetValidDocsCount === 0
                }>
                Proceed with Multi-Assistant Batch Analysis
              </Button>
            )}
          </>
        ) : (
          <Button
            onClick={onCancelClick}
            disabled={sheetCanceling[sheetName]}
            className="!bg-red-200 text-white border-none">
            Cancel
          </Button>
        )}
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
      {isSheetProcessing && (
        <div className="flex items-center flex-col gap-x-2 justify-center text-center mt-1 text-sm italic text-gray-600">
          <p className="">
            Feel free to use other tools or process another sheet but{' '}
            <strong>DO NOT</strong> refresh the page!{' '}
          </p>
          <div className="flex items-center gap-x-2">
            <p>
              Currently processing:{' '}
              <span className="font-semibold">{sheetCurrentTitle[sheetName]}</span>
            </p>
            <Loading size="sm" />
          </div>
        </div>
      )}
    </div>
  );

  const renderCompletion = () => (
    <div className="mt-6 w-full max-w-lg mx-auto flex flex-col items-center gap-4">
      <p className="text-green-600 font-semibold">Batch analysis completed!</p>
      {completionTime && (
        <p className="font-semibold flex w-full justify-between px-4">
          Completion Time:
          <span>{formatSecondsString(`${completionTime}`)}</span>
        </p>
      )}
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
      <InputSection
        label="Enter the spreadsheet URL:"
        disabled={
          isDocInfoLoading || isSheetProcessing || isValidating || hasActiveSheets
        }
        handleClickNext={handleClickNext}
        onInputChange={handleUrlChange}
        value={formValues.url}
      />
      {showInstruction && (
        <div className="text-center">
          <p className="italic text-gray-600 text-sm">
            Select another worksheet{' '}
            {!hasActiveSheets && <span>or Enter new spreadsheet URL</span>}
          </p>
        </div>
      )}

      {renderErrors(sheetName)}

      {isFetchingSheetNames ? (
        <div className="self-center flex items-center flex-col">
          <Loading />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto flex flex-col">
          {sheetNames.length > 0 && renderSheetSelector()}
          {(sheetInfo[sheetName] || isValidating || isDocInfoLoading) &&
            !sheetCompleted[sheetName] &&
            renderStats()}
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
      <div className="flex justify-start gap-x-4 mt-6">
        <button
          className="underline cursor-pointer hover:text-blue-400"
          onClick={handleClickViewInstructions}>
          View Instructions
        </button>
        <button
          className="underline cursor-pointer hover:text-blue-400"
          onClick={handleClickFAQ}>
          FAQ
        </button>
        <button
          className="underline cursor-pointer hover:text-blue-400"
          onClick={() => setShowDemoVideoModal(true)}>
          Watch Demo Video
        </button>
      </div>
      <InstructionsModal
        title="Steps for Batch Analysis"
        onClose={handleCloseViewInstructions}
        open={showInstructionsModal}
        renderContent={renderInstructionModalContent}
      />
      <FAQModal onClose={handleCloseFAQ} open={showFAQModal} />
      <DemoVideoModal
        open={showDemoVideoModal}
        onClose={() => setShowDemoVideoModal(false)}
      />
    </>
  );
};

export default BatchSB37Analysis;
