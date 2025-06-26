import { useEffect } from 'react';
import { Button, Input } from '../common';
import { FaCircleChevronRight } from 'react-icons/fa6';
import {
  useGetDocumentInfo,
  useParseJsonToText,
  useSB37AnalysisContext,
} from '../../hooks';
import { Loading } from '../Loading';
import DocPreview from './DocPreview';
import { SB37AnalysisJSON } from '../../hooks/useParseJsonToText';

const SingleSB37Analysis = () => {
  const {
    url,
    setUrl,
    isCompletedSingle,
    setIsCompletedSingle,
    analyzeSingleDoc,
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
  console.log(`errorMessageDocInfo`, errorMessageDocInfo);
  const { title, wordCount } = docInfoResult || {};
  const { completionTime, reviewOutput } = singleResult || {};

  const isBusy = singleLoading || loadingParsing || loadingDocInfo;
  const errorMessage = singleErrorMessage || errorMessageDocInfo || errorMessageParse;

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
          {singleLoading && (
            <p className="text-sm text-gray-600 mt-2">Processing... Please wait.</p>
          )}
        </div>
      )}

      {/* Result */}
      {!isBusy && (docInfoResult || singleResult) && (
        <div className="w-full flex flex-col gap-6">
          {/* Preview */}
          {parseResult?.docUrl && (
            <div className="w-full max-w-2xl mx-auto">
              <DocPreview docUrl={parseResult.docUrl} />
            </div>
          )}

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
            {completionTime && (
              <div className="flex justify-between">
                <span className="font-semibold">Completion Time:</span>
                <span>{completionTime}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4 mt-4">
            {isCompletedSingle ? (
              <>
                <a href={parseResult?.docUrl} target="_blank" rel="noopener noreferrer">
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
              <Button
                onClick={handleProceedAnalysis}
                className="!bg-blue-200 text-white border-none"
                disabled={singleLoading || loadingParsing}>
                Proceed
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleSB37Analysis;
