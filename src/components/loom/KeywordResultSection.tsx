import { KeywordAnalysisResult } from '../../types/loom';
import { Accordion } from '../Accordion';
import { Alert } from '../common';
import { getHeaderBadgeColor } from './helpers';

type Props = {
  result: KeywordAnalysisResult | null;
};

const KeywordResultSection = ({ result }: Props) => {
  if (!result) return null;

  const { density, headingAnalysis, keywordCounts, otherKeywords, sectionAnalysis } =
    result || {};
  const { altCount, focusCount } = keywordCounts || {};
  const { headings, percent, optimized, total } = headingAnalysis || {};
  const {
    optimized: optimizedSections,
    percent: percentSections,
    total: totalSections,
    withoutFocus,
  } = sectionAnalysis || {};

  const scrollToHeading = (headingText: string) => {
    const allHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const target = allHeadings.find(h => h.textContent?.trim() === headingText.trim());

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });

      target.classList.add('bg-black', 'text-white', 'transition-all');

      setTimeout(() => {
        target.classList.remove('bg-black', 'text-white');
      }, 5000);
    }
  };

  const renderHeadingResult = () => {
    if (!headings.length) {
      return <p className="text-gray-600 italic">No H2 or H3 headings found</p>;
    }

    return (
      Array.isArray(headings) &&
      headings.map(heading => (
        <li key={heading.text}>
          <p
            className="cursor-pointer hover:underline"
            onClick={() => scrollToHeading(heading.text)}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                scrollToHeading(heading.text);
              }
            }}>
            {heading.level} - {heading.text}{' '}
            {/* <span className={heading.optimized ? 'text-green-600' : 'text-red-600'}>
              {heading.optimized.toString()}
            </span> */}
          </p>
        </li>
      ))
    );
  };


  const renderHeadingsAlert = () => {
    if (!headings.length) return null;
    if (percent <= 75) {
      return <Alert type="success" message="Keyword optimization in H2 & H3 headings is 75% or below." />;
    }
    return <Alert message="Must be equal to or lower than 75%!" type="error" />;
  };

  return (
    <div className="space-y-3 mt-4">
      <p className="flex justify-between">
        <strong>Total Keyword Count:</strong>
        <span className="text-blue-200 font-bold">{focusCount}</span>
      </p>
      <p className="flex justify-between items-center">
        <strong>Keyword Density:</strong>
        <span className="text-blue-200 font-bold">{density.toFixed(2)}%</span>
      </p>
      {altCount === 0 ? null : (
        <p className="flex justify-between items-center">
          <strong>Total Alt Count:</strong>
          <span className="text-blue-200 font-bold">{altCount}</span>
        </p>
      )}

      <Accordion
        header={<p className="text-sm">H2 & H3 Optimization</p>}
        badge={`${percent}%`}
        badgeColor={getHeaderBadgeColor(percent)}>
        <div className="flex flex-col gap-y-2">
          {renderHeadingsAlert()}
          <ul className="list-disc ml-4">
            {renderHeadingResult()}
          </ul>
           <p className="text-gray-600 italic">
            {optimized} optimized of {total} headings
          </p>
        </div>
      </Accordion>

      <Accordion
        header={<p className="text-sm">Per Section Optimization</p>}
        badge={`${percentSections}%`}
        badgeColor={percentSections === 100 ? 'green' : 'red'}>
        {withoutFocus.length > 0 ? (
          <Alert
            message="Please make sure each section has the focus keyphrase."
            type="error"
          />
        ) : (
          <Alert message="All sections have the focus keyphrase." type="success" />
        )}

        {withoutFocus.length > 0 && (
          <div className="mt-2">
            <p className="text-gray-700 font-extrabold mb-1">
              Sections without the focus keyphrase:
            </p>
            <ul className="list-disc ml-5 space-y-1">
              {withoutFocus.map((heading, i) => (
                <li key={i}>
                  <span
                    className="cursor-pointer text-blue-600 hover:underline"
                    onClick={() => scrollToHeading(heading)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        scrollToHeading(heading);
                      }
                    }}
                  >
                    {heading}
                  </span>
                </li>
              ))}
            </ul>

          </div>
        )}

        <p className="text-gray-600 italic mt-2">
          {optimizedSections} optimized of {totalSections} sections
        </p>
      </Accordion>
      <p>
        <strong>Other Keywords</strong>
      </p>

      {otherKeywords.map(otherKeyword => {
        return (
          <Accordion
            header={<p className="text-sm">{otherKeyword.category}</p>}
            key={otherKeyword.category}>
            <ul className="list-disc ml-4 flex flex-col">
              <div className="flex justify-between items-center font-semibold text-sm py-2">
                <p>Keyword</p>
                <p>Count</p>
              </div>
              {otherKeyword.keywords.map(kw => (
                <li key={kw.keyword}>
                  <p className="flex justify-between">
                    {kw.keyword}
                    <strong
                      className={`text-right ${kw.count > 0 ? 'text-green-500' : 'text-red-600'}`}>
                      {kw.count}
                    </strong>
                  </p>
                </li>
              ))}
            </ul>
          </Accordion>
        );
      })}
    </div>
  );
};

export default KeywordResultSection;
