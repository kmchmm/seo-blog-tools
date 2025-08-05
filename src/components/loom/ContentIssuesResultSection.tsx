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

  const onHeaderItemClick = (headingText: string) => {
    const allHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const target = allHeadings.find(h => h.textContent?.trim() === headingText.trim());

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });

      target.classList.add(
        'bg-black',
        'text-white',
        'transition-all',
        'relative',
        'z-[999]'
      );
      setTimeout(() => {
        target.classList.remove('bg-black', 'text-white', 'relative', 'z-[999]');
      }, 5000);
    }
  };

  const renderAlert = () => {
    if (
      (over300Sections && over300Sections.length > 0) ||
      (sameWordStreaks && sameWordStreaks.length > 0)
    ) {
      return <Alert message={error} type="error" />;
    }
    return <Alert message="🎉 No content issues found! Good job!" type="success" />;
  };

  return (
    <div className="space-y-3 mt-4">
      <div className="w-full flex justify-center">
        <span className="!w-full">{renderAlert()}</span>
      </div>

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
          onClick={toggleHeadingDetails}
        >
          {showHeadings ? 'Hide' : 'View'} Details
        </button>
      </div>

      {showHeadings && (
        <div className="space-y-4 mt-2 text-sm">
          <div className="flex justify-between items-start font-semibold pb-2">
            <p>Heading</p>
            <p>Word Count</p>
          </div>

          <ul className="space-y-2 ml-2">
            {headings?.map((heading, ) => (
              <li key={heading.text} className="flex justify-between items-start">
                <button
                  type="button"
                  onClick={() => onHeaderItemClick(heading.text)}
                  className="text-left text-blue-600 hover:underline cursor-pointer w-3/4"
                >
                  {heading.level.toUpperCase()} - {heading.text}
                </button>
                <span
                  className={`w-1/4 text-right font-medium ${
                    (heading.wordCount ?? 0) > 300 ? 'text-red-500' : ''
                  }`}
                >
                  {heading.wordCount}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {over300Sections && (
        <Accordion
          className="mt-2 text-sm"
          header={
            <div className="flex justify-between items-center w-full text-sm">
              <span>Sections With Over 300 Words</span>
              {over300Sections.length > 0 ? (
                <div className="bg-[#f5ecee] w-[40px] text-right rounded-2xl px-2">
                  <span className="text-red-100">{over300Sections.length}</span>
                </div>
              ) : (
                <div className="bg-[#e5f5ea] w-[40px] text-right rounded-2xl px-2">
                  <span className="text-green-100">0</span>
                </div>
              )}
            </div>
          }
        >
          {over300Sections.length > 0 ? (
            <div className="mt-2 space-y-3 text-sm">
              <ul className="mx-2 space-y-3 text-sm">
                {over300Sections.map(section => (
                  <li key={section.text}>
                    <button
                      type="button"
                      onClick={() => onHeaderItemClick(section.text)}
                      className="font-bold text-blue-600 hover:underline cursor-pointer text-left"
                    >
                      {section.level.toUpperCase()} - {section.text}
                    </button>
                    <div className="flex items-center mt-1">
                      <PiDotOutlineFill />
                      <p className="ml-1">Word count: {section.wordCount}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="italic text-gray-600 text-xs">
              No sections with over 300 words. Rawr
            </p>
          )}
        </Accordion>
      )}

      {sameWordStreaks && (
        <Accordion
          className="mt-2 text-sm"
          header={
            <div className="flex justify-between items-center w-full text-sm">
              <span>Same Starting Word In {'>'}=3 Consecutive Sentences</span>
              {sameWordStreaks.length > 0 ? (
                <div className="bg-[#f5ecee] w-[50px] text-right rounded-2xl px-2">
                  <span className="text-red-100">{sameWordStreaks.length}</span>
                </div>
              ) : (
                <div className="bg-[#e5f5ea] w-[50px] text-right rounded-2xl px-2">
                  <span className="text-green-100">0</span>
                </div>
              )}
            </div>
          }
        >
          {sameWordStreaks.length > 0 ? (
            <div className="mt-2">
              <ul className="mx-2 space-y-3 text-sm">
                {sameWordStreaks.map((section, idx) => (
                  <li key={`${section.heading}-${idx}`}>
                    <button
                      type="button"
                      onClick={() => onHeaderItemClick(section.heading)}
                      className="font-bold text-blue-600 hover:underline cursor-pointer text-left mb-1"
                    >
                      {section.heading}
                    </button>
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
          ) : (
            <p className="italic text-gray-600 text-xs">
              No same word at the start of three consecutive sentences. Rawr
            </p>
          )}
        </Accordion>
      )}
    </div>
  );
};

export default ContentIssuesResultSection;
