import { useState } from 'react';
import { ContentIssueReport } from '../../types/loom';
import { Alert } from '../common';
import { Accordion } from '../Accordion';
import { PiDotOutlineFill } from 'react-icons/pi';

type Props = {
  result: ContentIssueReport | null;
  errorMessage: string;
};

const ContentIssuesResultSection = ({ result, errorMessage }: Props) => {
  const [showHeadings, setShowHeadings] = useState(false);
  const { headings, over300Sections, sameWordStreaks, totalWordCount } = result || {};
  const error = errorMessage || 'Content issues found! Please review';
  if (!result) return null;

  const toggleHeadingDetails = () => {
    setShowHeadings(prev => !prev);
  };

  const renderAlert = () => {
    if (
      (over300Sections && over300Sections?.length > 0) ||
      (sameWordStreaks && sameWordStreaks?.length > 0)
    ) {
      return <Alert message={error} type="error" />;
    }
    return <Alert message="No content issues found! Good job! " type="success" />;
  };

  return (
    <div className="space-y-3 mt-4">
      {renderAlert()}
      <p className="flex justify-between">
        <strong>Total Word Count:</strong>
        <span className="text-blue-200 font-bold">{totalWordCount}</span>
      </p>
      <div>
        <p className="flex justify-between">
          <strong>Total Headings:</strong>
          <span className="text-blue-200 font-bold">{headings?.length}</span>
        </p>
        <button
          className="underline text-sm text-blue-200 cursor-pointer"
          type="button"
          onClick={toggleHeadingDetails}>
          {showHeadings ? 'Hide' : 'Show'} details
        </button>
      </div>
      {showHeadings ? (
        <div>
          <div className="flex justify-between items-start text-base font-semibold pb-2">
            <p>Heading</p>
            <p>Word Count</p>
          </div>
          <ul className="list-disc ml-4 space-y-1">
            {headings?.map(heading => {
              return (
                <li key={heading.text} className="">
                  <div className="flex w-full  justify-between items-start">
                    <p className="w-3/4">{heading.text}</p>
                    <p className="w-1/4 text-right">{heading.wordCount}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {over300Sections && (
        <Accordion
          header="Sections With Over 300 Words"
          badge={over300Sections?.length}
          badgeColor={over300Sections?.length > 0 ? 'red' : 'green'}>
          {over300Sections.length > 0 && (
            <div className="mt-2">
              <ul className="mx-2 space-y-3 text-sm">
                {over300Sections.map(section => (
                  <li key={section.text}>
                    <p className="font-bold">
                      {section.level} - {section.text}
                    </p>
                    <div className="flex items-center">
                      <PiDotOutlineFill />
                      <p>Word count: {section.wordCount}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Accordion>
      )}
      {sameWordStreaks && (
        <Accordion
          header="Same Word At The Start Of Three Consecutive Sentences"
          badge={sameWordStreaks.length}
          badgeColor={sameWordStreaks.length > 0 ? 'red' : 'green'}>
          {sameWordStreaks.length > 0 && (
            <div className="mt-2">
              <ul className="mx-2 space-y-3 text-sm">
                {sameWordStreaks.map((section, idx) => (
                  <li key={`${section.heading}-${idx}`}>
                    <p className="font-bold mb-1">{section.heading}</p>
                    <p className="leading-relaxed">
                      {section.sentences.map((sentence, sIdx) => {
                        const words = sentence.split(/\s+/);
                        const firstWord = words[0];
                        const rest = words.slice(1).join(' ');
                        return (
                          <span key={sIdx}>
                            <mark className="bg-[#f9cb9c] rounded px-1">{firstWord}</mark>{' '}
                            {rest}{' '}
                          </span>
                        );
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Accordion>
      )}
    </div>
  );
};

export default ContentIssuesResultSection;
