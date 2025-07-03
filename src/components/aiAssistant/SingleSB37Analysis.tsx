import { useEffect } from 'react';
import { Button, Input } from '../common';
import { FaCircleChevronRight } from 'react-icons/fa6';
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

const { VITE_SECRET_EMAIL } = import.meta.env;

const SingleSB37Analysis = () => {
  const { userData } = useAuth();

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
    if (url) analyzeSingleDoc(url);
  };

  const onSuccess = () => {
    setIsCompletedSingle(true);
  };

  const handleProceedMultiAnalysis = () => {
    if (url) analyzeMultiAssistantDoc({ docUrl: url, onSuccess });
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
    if (reviewOutput) {
      sendRequestParseJsonToText({
        analysisJson: reviewOutput as SB37AnalysisJSON,
        originalDocName: title || singleResult?.title || '',
        originalDocUrl: url,
        onSuccess,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompletedSingle, reviewOutput, singleResult]);

  useEffect(() => {
    if (!singleLoading) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e as any).returnValue =
        'Your progress will be lost. Are you sure you want to leave?';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [singleLoading]);

  return (
    <div className="flex flex-col gap-6">
      {/* URL Input */}
      <div className="w-full flex items-center justify-center gap-x-4 sm:flex-row flex-col">
        <Input
          disabled={isBusy || isCompletedSingle}
          id="ai-assistant-input"
          label="Enter the document URL:"
          name="ai-assistant-input"
          onInputChange={e => setUrl(e.target.value)}
          value={url}
          customClassName="w-full flex items-center sm:flex-row flex-col"
        />
        <button
          type="button"
          disabled={isBusy || isCompletedSingle || !url}
          className="cursor-pointer hover:scale-125 transition-transform disabled:pointer-events-none"
          onClick={handleFetchDocInfo}>
          <FaCircleChevronRight color="blue" size={25} className="sm:flex hidden" />
        </button>
      </div>

      {/* Error */}
      {errorMessage && (
        <p className="text-red-600 text-center font-medium">{errorMessage}</p>
      )}

      {/* Loading */}
      {isBusy && (
        <div className="flex flex-col items-center">
          <Loading />

          <div className="flex flex-col text-center">
            {!loadingDocInfo && (
              <p className="text-sm text-gray-600 mt-2 italic">
                {loadingParsing ? 'Preparing document...' : ' Processing...'} Please wait.
              </p>
            )}
            {singleLoading && (
              <p className="text-sm text-gray-600 mt-2 italic">
                Feel free to use other tools or process another sheet but{' '}
                <strong>DO NOT</strong> refresh the page!{' '}
              </p>
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
