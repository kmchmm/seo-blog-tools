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
                    rel="noopener noreferrer">
                    {url}
                  </a>
                  <ul className="ml-4 list-disc space-y-1">
                    {items.map((item, idx) => (
                      <li key={idx}>
                        <span className="font-bold">Anchor:</span>{' '}
                        <span
                          onClick={() => scrollToLink(item.url || '')}
                          className="hover:bg-green-100 hover:text-white p-1 rounded cursor-pointer">
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
          <ul className="ml-4 list-disc space-y-1">
            {details.map((detail, idx) => (
              <li key={idx}>
                <span className="font-bold">Anchor:</span>{' '}
                <span
                  onClick={() => scrollToLink(detail.url || '')}
                  className="hover:bg-green-100 hover:text-white p-1 rounded cursor-pointer">
                  {detail.anchor || '(no anchor)'}
                </span>
                <br />
                <span className="font-bold">URL:</span>{' '}
                <a
                  href={detail.url || ''}
                  className="underline text-blue-400"
                  target="_blank"
                  rel="noopener noreferrer">
                  {detail.url}
                </a>
                <br />
                <span className="font-bold">Location:</span> {detail.location}
                {'errorType' in detail && detail.errorType !== undefined && (
                  <p className="font-bold">
                    Error Code:<span className="font-medium"> {detail.errorType}</span>
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
              className="text-blue-400 hover:text-blue-950 break-words whitespace-pre-wrap flex flex-col cursor-pointer">
              <span
                onClick={() => scrollToLink(link.url || '')}
                className="before:content-['•'] before:mr-2 font-bold text-black hover:bg-green-100 hover:text-white p-2">
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
        header={<div className="flex justify-between">Link & Anchor Text Issues</div>}
        badge={totalLinkIssues}
        badgeColor={totalLinkIssues > 0 ? 'red' : 'green'}>
        {missingCriticalLinks.length > 0 && (
          <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded p-3 text-sm">
            <strong className="block mb-1">⚠️ ALERT:</strong>
            <ul className="list-disc list-inside space-y-1">
              {missingCriticalLinks.map((item, i) => (
                <li key={i}>
                  No link to <strong>{item.label}</strong>. Please add:{' '}
                  <a
                    href={item.url}
                    className="text-blue-800 underline hover:text-blue-300"
                    target="_blank"
                    rel="noopener noreferrer">
                    {item.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <ul className="list-none space-y-2 text-sm text-left">{renderGroupedIssues()}</ul>
      </Accordion>

      <Accordion
        className="mt-2 text-sm"
        header={<div className="flex justify-between">Internal Links</div>}
        badge={internalLinks.length}
        badgeColor={internalLinks.length > 0 ? 'green' : 'red'}>
        <ul className="list-none space-y-2 text-sm text-left">
          {renderLinksByLocation(
            internalLinks.filter(l => typeof l !== 'string') as LinkDetail[]
          )}
        </ul>
      </Accordion>

      <Accordion
        className="mt-2 text-sm"
        header={<div className="flex justify-between">External Links</div>}
        badge={externalLinks.length}
        badgeColor={externalLinks.length > 0 ? 'green' : 'red'}>
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
