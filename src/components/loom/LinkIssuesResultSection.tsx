import { useMemo } from 'react';
import { LinkDetail } from '../../types/loom';
import { groupIssuesByType, LinkAnalysisResult } from '../../utils/analyzeLinksWorker';
import { Accordion } from '../Accordion';
import { Alert } from '../common';

type Props = {
  result: LinkAnalysisResult | null;
};

const REQUIRED_LINKS = [
  {
    url: 'https://arashlaw.com/practice-areas/car-accident-lawyers/',
    label: 'Car Accident PA',
  },
];

const LinkIssuesResultSection = ({ result }: Props) => {
  const { externalLinks = [], internalLinks = [], issues = [] } = result || {};

  const groupedIssues = useMemo(() => groupIssuesByType(issues), [issues]);

  const totalLinkIssues = Object.entries(result || {})
    .filter(([key]) => key !== 'internalLinks' && key !== 'externalLinks')
    .reduce((sum, [, arr]) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

  const allLinkURLs = [...internalLinks, ...externalLinks].map(link =>
    typeof link === 'string' ? link : link.url
  );

  const missingCriticalLinks = REQUIRED_LINKS.filter(
    req => !allLinkURLs.includes(req.url)
  );

  const linkErrorMessage =
    totalLinkIssues === 0
      ? '🎉 No link issues found! Good job! '
      : 'Some link issues found! Please review';

  const formatErrorLabel = (label: string) =>
    label.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

  const scrollToLink = (url: string) => {
    try {
      const el = document.querySelector(`a[href="${CSS.escape(url)}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bg-green-100', '!text-white');
        setTimeout(() => el.classList.remove('bg-green-100', '!text-white'), 2000);
      }
    } catch (e) {
      console.warn(`Failed to scroll to link: ${url}`, e);
    }
  };

  const renderGroupedIssues = () =>
    Object.entries(groupedIssues).map(([issueType, details]) => {
    if (issueType === 'No link to Car Accident PA') {
      return null;
    }      
      
    if (issueType === 'No external links') {
        return (
          <li
            key={issueType}
            className="bg-red-50 border border-red-100 p-3 rounded my-2"
          >
            <div className="font-bold mb-1 text-red-100">⚠️ External Links Missing</div>
            <div className="text-sm text-red-100">
              No external links were found in this content. Add at least one relevant external source to improve credibility and SEO.
            </div>
          </li>
        );
      }

      if (issueType === 'No internal links') {
        return (
          <li
            key={issueType}
            className="bg-red-50 border border-red-100 p-3 rounded my-2"
          >
            <div className="font-bold mb-1 text-red-100">⚠️ Internal Links Missing</div>
            <div className="text-sm text-red-100">
              No internal links were found in this content. Add links to other relevant pages within <span className="text-blue-800 underline">arashlaw.com</span> to improve site structure and SEO.
            </div>
          </li>
        );
      }


      if (issueType === 'Duplicate link') {
        const groupedByURL = details.reduce<Record<string, typeof details>>(
          (acc, item) => {
            const key = item.url || '(no url)';
            acc[key] = acc[key] || [];
            acc[key].push(item);
            return acc;
          },
          {}
        );

        return (
          <li key={issueType} className="my-3">
            <strong>{formatErrorLabel(issueType)}</strong>
            <ul className="ml-4 list-decimal space-y-2 py-2">
              {Object.entries(groupedByURL).map(([url, items]) => (
                <li key={url}>
                  <span className="font-bold">URL:</span>{' '}
                  <a
                    href={url}
                    className="underline text-blue-400"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {url}
                  </a>
                  <ul className="ml-4 list-disc space-y-1">
                    {items.map((item, idx) => (
                      <li key={idx}>
                        <span className="font-bold">Anchor:</span>{' '}
                        <span
                          onClick={() => scrollToLink(item.url || '')}
                          className="hover:text-blue-500 p-1 rounded cursor-pointer"
                        >
                          {item.anchor || '(no anchor)'}
                        </span>
                        <br />
                        <span className="font-bold">Location:</span> {item.location}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </li>
        );
      }

      return (
        <li key={issueType}>
          <strong>{formatErrorLabel(issueType)}</strong>
          <ul className="ml-4 list-decimal space-y-1">
            {details.map((detail, idx) => (
              <li key={idx}>
                <span className="font-bold">Anchor:</span>{' '}
                <span
                  onClick={() => scrollToLink(detail.url || '')}
                  className="hover:text-blue-500 p-1 rounded cursor-pointer"
                >
                  {detail.anchor || '(no anchor)'}
                </span>
                <br />
                <span className="font-bold">URL:</span>{' '}
                <a
                  href={detail.url || ''}
                  className="underline text-blue-400"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {detail.url}
                </a>
                <br />
                <span className="font-bold">Location:</span> {detail.location}
                {'errorType' in detail && detail.errorType !== undefined && (
                  <p className="font-bold">
                    Error Code:
                    <span className="font-medium"> {detail.errorType}</span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </li>
      );
    });

  const renderLinksByLocation = (links: LinkDetail[]) => {
    const grouped = links.reduce<Record<string, LinkDetail[]>>((acc, link) => {
      const location = link.location || 'Unknown Section';
      acc[location] = acc[location] || [];
      acc[location].push(link);
      return acc;
    }, {});

    return Object.entries(grouped).map(([location, links]) => (
      <li key={location}>
        <ul className="list-disc list-inside space-y-1">
          {links.map((link, i) => (
            <li
              key={`${location}-${i}`}
              className="text-blue-400 hover:text-blue-950 break-words whitespace-pre-wrap flex flex-col cursor-pointer"
            >
              <span
                onClick={() => scrollToLink(link.url || '')}
                className="before:content-['•'] before:mr-2 font-bold text-black hover:text-blue-500 p-2"
              >
                {link.anchor || '(no anchor)'}
              </span>
              <span className="ml-5"> {link.url}</span>
            </li>
          ))}
        </ul>
      </li>
    ));
  };

  return (
    <div>
      {result && (
        <Alert
          message={linkErrorMessage}
          type={totalLinkIssues > 0 ? 'error' : 'success'}
        />
      )}

      <Accordion
        className="mt-2 text-sm"
        header={
          <div className="flex justify-between items-center w-full text-sm">
            <span>Link & Anchor Text Issues</span>
            {totalLinkIssues > 0 ? (
              <div className="bg-[#f5ecee] w-[40px] text-right rounded-2xl px-2">
                <span className="text-red-100">{totalLinkIssues}</span>
              </div>
            ) : (
              <div className="bg-[#e5f5ea] w-[40px] text-right rounded-2xl px-2">
                <span className="text-green-100">0</span>
              </div>
            )}
          </div>
        }
      >
        {missingCriticalLinks.length > 0 && (
          <div className=" text-red-600 bg-red-50 border border-red-200 rounded p-3 text-sm">
            <ul className="list-inside space-y-1">
              {missingCriticalLinks.map((item, i) => (
                <li key={i}>
                  ⚠️ Link to <strong>{item.label}</strong> Missing <br /> Please add internal link:{' '}
                  <a
                    href={item.url}
                    className="text-blue-800 underline hover:text-blue-300"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.url}
                  </a>
                  <span> to comply with editorial standards.</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <ul className="list-none space-y-2 text-sm text-left">{renderGroupedIssues()}</ul>
      </Accordion>

      <Accordion
        className="mt-2 text-sm"
        header={
          <div className="flex justify-between items-center w-full text-sm">
            <span>Internal Links</span>
            {internalLinks.length > 0 ? (
              <div className="bg-[#e5f5ea] w-[40px] text-right rounded-2xl px-2">
                <span className="text-green-100">{internalLinks.length}</span>
              </div>
            ) : (
              <div className="bg-[#f5ecee] w-[40px] text-right rounded-2xl px-2">
                <span className="text-red-100">0</span>
              </div>
            )}
          </div>
        }
      >
        <ul className="list-none space-y-2 text-sm text-left">
          {renderLinksByLocation(
            internalLinks.filter(l => typeof l !== 'string') as LinkDetail[]
          )}
        </ul>
      </Accordion>

      <Accordion
        className="mt-2 text-sm"
        header={
          <div className="flex justify-between items-center w-full text-sm">
            <span>External Links</span>
            {externalLinks.length > 0 ? (
              <div className="bg-[#e5f5ea] w-[40px] text-right rounded-2xl px-2">
                <span className="text-green-100">{externalLinks.length}</span>
              </div>
            ) : (
              <div className="bg-red-50 w-[40px] text-right rounded-2xl px-2">
                <span className="text-red-100 font-semibold">0</span>
              </div>
            )}
          </div>
        }
      >
        <ul className="list-none space-y-2 text-sm text-left">
          {renderLinksByLocation(
            externalLinks.filter(l => typeof l !== 'string') as LinkDetail[]
          )}
        </ul>
      </Accordion>
    </div>
  );
};

export default LinkIssuesResultSection;
