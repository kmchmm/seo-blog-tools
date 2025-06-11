import { KeywordAnalysisResult } from '../../hooks/useKeywordAnalysis';
import { Accordion } from '../Accordion';
import { getBadgeColor } from './helpers';

type Props = {
  result: KeywordAnalysisResult | null;
};

const KeywordResultSection = ({ result }: Props) => {
  if (!result) return null;

  const { density, headingAnalysis, keywordCounts, otherKeywords, sectionAnalysis } =
    result || {};
  const { altCount, focusCount } = keywordCounts || {};

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
      {altCount && altCount !== 0 && (
        <p className="flex justify-between items-center">
          <strong>Total Alt Count:</strong>
          <span className="text-blue-200 font-bold">{altCount}</span>
        </p>
      )}

      <Accordion
        header="H2 & H3 Optimization"
        badge={headingAnalysis.percent}
        badgeColor={getBadgeColor(headingAnalysis.percent)}>
        <div className="flex flex-col gap-y-2">
          <ul className="list-disc ml-4">
            {headingAnalysis.headings.map(heading => (
              <li key={heading.text}>
                <p>
                  {heading.level} - {heading.text}{' '}
                  <span className={heading.optimized ? 'text-green-600' : 'text-red-600'}>
                    {heading.optimized ? '✓' : '✗'}
                  </span>
                </p>
              </li>
            ))}
          </ul>

          <p className="text-gray-600 italic">
            {headingAnalysis.optimized} optimized of {headingAnalysis.total} headings
          </p>
        </div>
      </Accordion>

      <Accordion
        header="Per Section Optimization"
        badge={sectionAnalysis.percent}
        badgeColor={getBadgeColor(sectionAnalysis.percent)}>
        {sectionAnalysis.withoutFocus.length > 0 && (
          <div className="mt-2 border border-red-200 rounded bg-red-50 p-3 text-sm">
            <p className="text-red-600 font-medium mb-1 flex items-center gap-1">
              ⚠️ Please make sure each section has the focus keyphrase.
            </p>
          </div>
        )}

        {sectionAnalysis.withoutFocus.length > 0 && (
          <div className="mt-2">
            <p className="text-gray-700 font-medium mb-1">
              Sections without the focus keyphrase:
            </p>
            <ul className="list-disc ml-5 space-y-1">
              {sectionAnalysis.withoutFocus.map((heading, i) => (
                <li key={i}>{heading}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-gray-600 italic mt-2">
          {sectionAnalysis.optimized} optimized of {sectionAnalysis.total} sections
        </p>
      </Accordion>
      <p>
        <strong>Other Keywords</strong>
      </p>

      {otherKeywords.map(otherKeyword => {
        return (
          <Accordion header={otherKeyword.category} key={otherKeyword.category}>
            <ul className="list-disc ml-4 flex flex-col">
              <div className="flex justify-between items-center font-semibold text-sm py-2">
                <p>Keyword</p>
                <p>Count</p>
              </div>
              {otherKeyword.keywords.map(kw => (
                <li key={kw.keyword}>
                  <p className="flex justify-between">
                    {kw.keyword}:
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
