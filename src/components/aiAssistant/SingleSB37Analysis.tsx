import { use, useEffect } from 'react';
import { Button } from '../common';
import {
  useAuth,
  useGetDocumentInfo,
  useParseJsonToText,
  useSB37AnalysisContext,
} from '../../hooks';
import { Loading } from '../Loading';
import DocPreview from './DocPreview';
import { SB37AnalysisJSON } from '../../hooks/useParseJsonToText';
import { getEstimatedTime } from './helpers';
import { formatSecondsString } from '../../utils/formatter';
import InputSection from './InputSection';
import { ToastContext } from '../../context/ToastContext';

const { VITE_SECRET_EMAIL } = import.meta.env;

const SingleSB37Analysis = () => {
  const { userData } = useAuth();
  const { id: clientId } = userData || {};
  const {
    url,
    setUrl,
    isCompletedSingle,
    setIsCompletedSingle,
    analyzeSingleDoc,
    analyzeMultiAssistantDoc,
    singleErrorMessage,
    resetSingleAnalysis,
    singleLoading,
    singleResult,
    currentTitleSingle,
    cancelTask,
  } = useSB37AnalysisContext();

  const {
    sendRequest: sendRequestParseJsonToText,
    loading: loadingParsing,
    result: parseResult,
    errorMessage: errorMessageParse,
    reset: resetParse,
  } = useParseJsonToText();

  const {
    sendRequest: sendRequestGetDocInfo,
    loading: loadingDocInfo,
    result: docInfoResult,
    errorMessage: errorMessageDocInfo,
    reset: resetDocInfo,
  } = useGetDocumentInfo();

  const { title, wordCount } = docInfoResult || {};
  const { completionTime, reviewOutput, doc_url } = singleResult || {};

  const { showToast } = use(ToastContext);

  const isBusy = singleLoading || loadingParsing || loadingDocInfo;
  const errorMessage = singleErrorMessage || errorMessageDocInfo || errorMessageParse;

  const estimatedTime = getEstimatedTime(wordCount || 0);
  const handleReset = () => {
    setUrl('');
    setIsCompletedSingle(false);
    resetSingleAnalysis();
    resetDocInfo();
    resetParse();
  };

  const handleFetchDocInfo = () => {
    if (url) sendRequestGetDocInfo({ docUrl: url });
  };

  const handleProceedAnalysis = () => {
    if (url) {
      showToast(`SB37 analysis started for ${title}.`);
      analyzeSingleDoc({
        clientId: `${clientId}`,
        docTitle: title || '',
        docUrl: url,
        wordCount: wordCount || 0,
      });
    }
  };

  const onCancelClick = () => {
    showToast(`Analysis cancelled for ${title}.`);
    cancelTask({ clientId: `${clientId}`, isSingleDoc: true });
  };

  const onSuccess = () => {
    setIsCompletedSingle(true);
  };

  const handleProceedMultiAnalysis = () => {
    if (url)
      analyzeMultiAssistantDoc({
        docUrl: url,
        onSuccess,
        clientId: `${clientId}`,
        docTitle: title || '',
        wordCount: wordCount || 0,
      });
  };

  const renderPreview = () => {
    if (!parseResult?.docUrl && !doc_url) {
      return null;
    }

    return (
      <div className="w-full max-w-2xl mx-auto">
        <DocPreview docUrl={parseResult?.docUrl || (doc_url as string)} />
      </div>
    );
  };

  useEffect(() => {
    if (!reviewOutput) return;

    sendRequestParseJsonToText({
      analysisJson: reviewOutput as SB37AnalysisJSON,
      originalDocName: title || singleResult?.title || '',
      originalDocUrl: url,
      onSuccess,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewOutput]);

  return (
    <div className="flex flex-col gap-6">
      {/* URL Input */}
      <InputSection
        label="Enter the document URL:"
        disabled={isBusy || isCompletedSingle}
        handleClickNext={handleFetchDocInfo}
        onInputChange={e => setUrl(e.target.value)}
        value={url}
      />

      {/* Error */}
      {errorMessage && (
        <p className="text-red-600 text-center font-medium">{errorMessage}</p>
      )}

      {/* Loading */}
      {isBusy && (
        <div className="flex flex-col items-center gap-y-2">
          <Loading />
          {singleLoading && (
            <Button
              onClick={onCancelClick}
              className="!bg-red-200 text-white border-none">
              Cancel
            </Button>
          )}
          <div className="flex flex-col text-center">
            {!loadingDocInfo && (
              <p className="text-sm text-gray-600 mt-2 italic">
                {loadingParsing ? (
                  'Preparing document...'
                ) : (
                  <>
                    Processing <strong>{currentTitleSingle}</strong>... Please wait.
                  </>
                )}
              </p>
            )}
            {singleLoading && (
              <>
                <p className="text-sm text-gray-600 mt-2 italic">
                  Feel free to use other tools or process another sheet but{' '}
                  <strong>DO NOT</strong> refresh the page!{' '}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Result */}
      {!isBusy && (docInfoResult || singleResult) && (
        <div className="w-full flex flex-col gap-6">
          {/* Preview */}
          {renderPreview()}
          {/* Metadata */}
          <div className="w-full max-w-lg mx-auto flex flex-col gap-3 text-lg">
            <div className="flex justify-between">
              <span className="font-semibold">Title:</span>
              <span>{title || singleResult?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Word Count:</span>
              <span>{wordCount || singleResult?.wordCount}</span>
            </div>
            {completionTime ? (
              <div className="flex justify-between">
                <span className="font-semibold">Completion Time:</span>
                <span>{formatSecondsString(completionTime)}</span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="font-semibold">Estimated Time:</span>
                <span>{estimatedTime}s</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4 mt-4">
            {isCompletedSingle ? (
              <>
                <a
                  href={parseResult?.docUrl || doc_url}
                  target="_blank"
                  rel="noopener noreferrer">
                  <Button className="!bg-transparent !text-gray-900 border-none">
                    Get Google Doc URL
                  </Button>
                </a>
                <Button
                  onClick={handleReset}
                  className="!bg-blue-200 text-white border-none">
                  Process Another Document
                </Button>
              </>
            ) : (
              <div className="flex gap-x-2">
                <Button
                  onClick={handleProceedAnalysis}
                  className="!bg-blue-200 text-white border-none"
                  disabled={singleLoading || loadingParsing}>
                  Proceed with Single Analysis
                </Button>
                {userData.email.toLowerCase() === VITE_SECRET_EMAIL && (
                  <Button
                    onClick={handleProceedMultiAnalysis}
                    className="!bg-blue-200 text-white border-none"
                    disabled={singleLoading || loadingParsing}>
                    Proceed with Multi-Assistant Analysis
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleSB37Analysis;
