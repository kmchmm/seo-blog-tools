/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useState, useEffect, useContext } from 'react';
import clsx from 'clsx';
import { AnalysisWorkerWrapper, Paper } from 'yoastseo';
import { Modal } from '../Modal.js';
import supabase from '../../utils/supabaseInit.js';
import { UserContext } from '../../context/UserContext.js';
import { analyzeLinks } from '../../utils/analyzeLinksWorker.js';

import { Accordion } from '../Accordion.js';
import { Summary } from '../Summary.js';

import { Tabs, TabList, Tab, TabPanel } from 'react-aria-components';
import YoastIcon from '../../assets/icons/yoast.svg?react';
import { GoAlert, GoChecklist, GoLaw, GoLink, GoSearch, GoEye, GoDotFill } from 'react-icons/go';
import { FiEyeOff } from 'react-icons/fi';

import { FaCheckCircle, FaTimesCircle, FaTrash } from 'react-icons/fa';
import {
  AssessmentResult,
  ContentIssueReport,
  CustomSearchResult,
  ErrorList,
  FormatError,
  KeywordAnalysisResult,
  LinkDetail,
  LinkErrors,
  LinkIssue,
} from '../../types/loom.js';
import { VIOLATION_PHRASES } from './contants.js';
import { formatList } from './helpers.js';

import KeywordResultSection from './KeywordResultSection.js';
import { Button, Alert } from '../common';
import ContentIssuesResultSection from './ContentIssuesResultSection.js';

interface LoomProps {
  text: string;
  keyword: string;
  metaTitle: string;
  metaDescription: string;
  onHighlight: (phrases: string[]) => void;
  onRemoveHighlight: () => void;
  onFixAll: (newHtml: string) => void;
  onFormatHighlight: (errors: ErrorList) => void;
  onRemoveFormatHighlight: () => void;
  onHighlightContent: () => void;
  onRemoveContentHighlight: () => void;
  onLinkIssues?: (issues: LinkIssue[]) => void;
  handleAnalyze: () => void;
  keywordAnalysisResult: KeywordAnalysisResult | null;
  error: string | null;
  onKeywordShowHighlightClick: () => void;
  onKeywordRemoveHighlightClick: () => void;
  onCheckContentIssuesClick: () => void;
  editMode: boolean;
  contentIssuesResult: ContentIssueReport | null;
  contentIssuesErrorMessage: string;
  disableContentIssuesButton?: boolean;
}

const tabHeaderStyle = clsx(
  'text-xs w-15 text-center cursor-pointer flex flex-col items-center rounded-md p-1',
  'data-[selected]:text-blue-300 data-[selected]:bg-blue-100/10',
  'data-[hovered]:text-blue-300',
  'data-[hovered]:[&>svg]:text-blue-300 data-[selected]:[&>svg]:text-blue-300'
);
const svgStyle = 'mb-1 w-4 text-black text-base';

const resultsHeaderStyle = 'font-bold text-left mt-4';

const errorListStyle = 'text-left list-none [&>span]:text-red-200';
const passListStyle = 'text-left list-none [&>span]:text-green-100';

// const groupLinksByLocation = (links: LinkDetail[]) => {
//   return links.reduce((acc, link) => {
//     if (!acc[link.location]) acc[link.location] = [];
//     acc[link.location].push(link);
//     return acc;
//   }, {} as Record<string, LinkDetail[]>);
// };

// const panels = [
//   { id: "Format", label: "Check For Formatting Errors" },
//   { id: "Content", label: "Check For Content Issues" },
// ];

export const LoomSidebar: FC<LoomProps> = ({
  text,
  keyword,
  metaDescription,
  metaTitle,
  onHighlight,
  onRemoveHighlight,
  onFormatHighlight,
  onRemoveFormatHighlight,
  onFixAll,
  onHighlightContent,
  onRemoveContentHighlight,
  onLinkIssues,
  handleAnalyze,
  keywordAnalysisResult,
  error,
  onKeywordShowHighlightClick,
  onKeywordRemoveHighlightClick,
  onCheckContentIssuesClick,
  editMode,
  contentIssuesErrorMessage,
  contentIssuesResult,
  disableContentIssuesButton = false,
}) => {

  const { userData } = useContext(UserContext);
  const [hasRunChecks, setHasRunChecks] = useState(false);
  const [showSummary, setShowSummary] = useState<'summary' | 'tools'>('tools');
  const [readabilityProblems, setReadabilityProblems] = useState<AssessmentResult[]>([]);
  const [readabilityAchievements, setReadabilityAchievements] = useState<
    AssessmentResult[]
  >([]);
  const [seoProblems, setSEOProblems] = useState<AssessmentResult[]>([]);
  const [seoAchievements, setSEOAchievements] = useState<AssessmentResult[]>([]);
  const [violations, setViolations] = useState<string[]>([]);
  const [violationResults, setViolationResults] = useState<
    Record<string, { heading: string; id: string }[]>
  >({});
  const [highlightActive, setHighlightActive] = useState(false);
  const [hasCheckedViolations, setHasCheckedViolations] = useState(false);
  const [customSearchTerm, setCustomSearchTerm] = useState('');
  const [customSearchResults, setCustomSearchResults] = useState<CustomSearchResult[]>(
    []
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeHighlights, setActiveHighlights] = useState<string[]>([]);

  const [dictionary, setDictionary] = useState<
    { id: number; keyword: string; created_by: string }[]
  >([]);
  const [newPhrase, setNewPhrase] = useState('');
  const [addStatus, setAddStatus] = useState<null | 'success' | 'exists' | 'error'>(null);
  const [dictionaryViolations, setDictionaryViolations] = useState<string[]>([]);
  const [dictionaryViolationResults, setDictionaryViolationResults] = useState<
    Record<string, { heading: string; id: string }[]>
  >({});
  const [showResults, setShowResults] = useState(false);

  const [hasLinkChecked, setHasLinkChecked] = useState(false);
  const [linkShowResults, setLinkShowResults] = useState(false);

  const [hasKeywordChecked, setHasKeywordChecked] = useState(false);

  const [contentHighlightsActive, setContentHighlightsActive] = useState(false);
  const [keywordHighlightsActive, setKeywordHighlightsActive] = useState(false);


  // const [loading, setLoading] = useState(false);
  const [loading] = useState(false);

  type ErrorList = {
    multipleSpaceErrors: any[];
    emDashErrors: any[];
    titleCaseErrors: any[];
    leadingTrailingSpaceErrors: any[];
    spaceBeforePunctuationErrors: any[];
    missingPunctuationErrors: any[];
  };

  const [formatErrors, setFormatErrors] = useState<ErrorList>({
    multipleSpaceErrors: [],
    emDashErrors: [],
    titleCaseErrors: [],
    leadingTrailingSpaceErrors: [],
    spaceBeforePunctuationErrors: [],
    missingPunctuationErrors: [],
  });

  const [linkErrors, setLinkErrors] = useState<LinkErrors | null>(null);

  const hasErrors = Object.values(formatErrors).some(arr => arr.length > 0);

  ////////////////////////////////////////////////////////
  ////////////////YOAST  TOOL/////////////////////////////
  ////////////////////////////////////////////////////////
  const yoastSEOAnalyze = () => {
    const url = new URL('../../utils/yoastWorker.ts', import.meta.url);
    const newWorker = new AnalysisWorkerWrapper(
      new Worker(url, {
        type: 'module',
      })
    );

    newWorker
      .initialize({
        logLevel: 'TRACE',
      })
      .then(() => {
        const paper = new Paper(text, {
          keyword,
          title: metaTitle,
          description: metaDescription,
        });

        return newWorker.analyze(paper);
      })
      .then((results: any) => {
        const readabilityResult = results.result.readability.results;
        const goodReadability: AssessmentResult[] = [];
        const badReadability: AssessmentResult[] = [];
        const goodSEO: AssessmentResult[] = [];
        const badSEO: AssessmentResult[] = [];

        readabilityResult.forEach((result: AssessmentResult) => {
          if (result.score > 6) {
            goodReadability.push(result);
          } else if (result.score > 0) {
            badReadability.push(result);
          }
        });

        const seoResult = results.result.seo[''].results;
        seoResult.forEach((result: AssessmentResult) => {
          if (result.score > 6) {
            goodSEO.push(result);
          } else if (result.score > 0) {
            badSEO.push(result);
          }
        });

        setReadabilityProblems(badReadability);
        setReadabilityAchievements(goodReadability);
        setSEOProblems(badSEO);
        setSEOAchievements(goodSEO);
      })
      .catch((error: Error) => {
        console.error('An error occured while analyzing the text:');
        console.error(error);
      });
  };

  ////////////////////////////////////////////////////////
  //////////////////SB37 TOOL/////////////////////////////
  ////////////////////////////////////////////////////////
  const checkForStaticViolations = () => {
    const allMatches: string[] = [];
    const lowerText = text.toLowerCase();

    for (const phrase of VIOLATION_PHRASES) {
      const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedPhrase}\\b`, 'gi');
      const matches = lowerText.match(regex);

      if (matches) {
        for (let i = 0; i < matches.length; i++) {
          allMatches.push(phrase);
        }
      }
    }

    setViolations(allMatches);
    setHighlightActive(true);
    setHasCheckedViolations(true);

    const uniquePhrases = [...new Set(allMatches)];
    const mappedResults = mapViolationsToHeadings(text, uniquePhrases);
    setViolationResults(mappedResults);

    return allMatches;
  };

  const checkForDictionaryViolations = () => {
    const allMatches: string[] = [];
    const lowerText = text.toLowerCase();

    for (const item of dictionary) {
      const phrase = item.keyword.toLowerCase();
      const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedPhrase}\\b`, 'gi');
      const matches = lowerText.match(regex);

      if (matches) {
        for (let i = 0; i < matches.length; i++) {
          allMatches.push(phrase);
        }
      }
    }

    setDictionaryViolations(allMatches);
    setHighlightActive(true);

    const uniquePhrases = [...new Set(allMatches)];
    const mappedResults = mapViolationsToHeadings(text, uniquePhrases);
    setDictionaryViolationResults(mappedResults);

    return allMatches;
  };

  const checkForViolations = () => {
    checkForStaticViolations();
    checkForDictionaryViolations();
  };

  useEffect(() => {
    const fetchDictionary = async () => {
      const { data, error } = await supabase
        .from('loom_dictionary')
        .select('id, keyword, created_by');

      if (!error && data) {
        setDictionary(data);
      } else {
        console.error('Failed to load dictionary', error);
      }
    };

    fetchDictionary();
  }, []);

  const mapViolationsToHeadings = (text: string, violations: string[]) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const bodyText = doc.body.textContent || '';
    const headingElements = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));

    const headingMap: { index: number; tag: string; text: string; id: string }[] = [];

    headingElements.forEach((el, i) => {
      const textContent = el.textContent?.trim() ?? '';
      if (textContent) {
        const id = `heading-${i}`;
        el.setAttribute('id', id);
        headingMap.push({
          index: bodyText.indexOf(textContent),
          tag: el.tagName.toLowerCase(),
          text: textContent,
          id,
        });
      }
    });

    const results: Record<string, { heading: string; id: string }[]> = {};

    violations.forEach(phrase => {
      const phraseRegex = new RegExp(
        `\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'gi'
      );
      let match: RegExpExecArray | null;
      while ((match = phraseRegex.exec(bodyText.toLowerCase())) !== null) {
        const matchIndex = match.index;

        const closestHeading = [...headingMap]
          .reverse()
          .find(heading => heading.index <= matchIndex);

        if (closestHeading) {
          if (!results[phrase]) results[phrase] = [];
          const isAlreadyAdded = results[phrase].some(h => h.id === closestHeading.id);
          if (!isAlreadyAdded) {
            results[phrase].push({
              heading: closestHeading.text,
              id: closestHeading.id,
            });
          }
        }
      }
    });

    return results;
  };

  const handleAddOpenModal = () => {
    setIsAddModalOpen(true);
  };

  const handleAddCloseModal = () => {
    setIsAddModalOpen(false);
  };

  const handleViewOpenModal = () => {
    setIsViewModalOpen(true);
  };

  const handleViewCloseModal = () => {
    setIsViewModalOpen(false);
  };

  const fetchDictionary = async () => {
    const { data, error } = await supabase
      .from('loom_dictionary')
      .select('id, keyword, created_by');

    if (!error) setDictionary(data || []);
  };

  useEffect(() => {
    if (isViewModalOpen) {
      fetchDictionary();
    }
  }, [isViewModalOpen]);

  const handleAddPhrase = async () => {
    const phrase = newPhrase.trim().toLowerCase();

    if (!phrase) return;

    const { data: existing, error: existError } = await supabase
      .from('loom_dictionary')
      .select('keyword')
      .ilike('keyword', phrase);

    if (existError) {
      console.error(existError);
      setAddStatus('error');
      return;
    }

    if (existing && existing.length > 0) {
      setAddStatus('exists');
      return;
    }

    const { error } = await supabase.from('loom_dictionary').insert({
      keyword: phrase,
      created_by: userData.full_name || 'Unknown User',
    });

    if (error) {
      setAddStatus('error');
    } else {
      setAddStatus('success');
      setNewPhrase('');
      fetchDictionary();
    }
  };

  const handleDeletePhrase = async (id: number) => {
    const { error } = await supabase.from('loom_dictionary').delete().eq('id', id);

    if (error) {
      console.error('Failed to delete phrase:', error.message);
    } else {
      setDictionary(prev => prev.filter(entry => entry.id !== id));
    }
  };

  const handleCustomSearch = () => {
    const term = customSearchTerm.trim().toLowerCase();
    if (!term) return;

    if (customSearchResults.some(res => res.term.toLowerCase() === term)) return;

    const regex = new RegExp(
      `\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'gi'
    );
    const matches = text.match(regex);
    const matchCount = matches ? matches.length : 0;

    setCustomSearchResults(prev => [
      ...prev,
      {
        id: crypto.randomUUID(), // or use any unique ID generator
        term: customSearchTerm,
        count: matchCount,
      },
    ]);

    if (matchCount > 0) {
      setHighlightActive(true);
      onHighlight([customSearchTerm]);
    } else {
      setHighlightActive(false);
    }

    setCustomSearchTerm('');
  };

  ////////////////////////////////////////////////////////
  //////////////FORMAT QA TOOL////////////////////////////
  ////////////////////////////////////////////////////////
  const runFormatCheck = () => {
    const worker = new Worker(new URL('../../utils/formatErrors.ts', import.meta.url), {
      type: 'module',
    });

    const parser = new DOMParser();
    const preprocessed = text.replace(/<br\s*\/?>/gi, '\n');
    const doc = parser.parseFromString(preprocessed, 'text/html');

    const paragraphs = Array.from(
      doc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6')
    ).map(el => {
      const htmlEl = el as HTMLElement; // Cast to access innerText
      return {
        text: htmlEl.innerText || '',
        heading: htmlEl.tagName.toUpperCase().startsWith('H')
          ? htmlEl.tagName.toUpperCase()
          : null,
      };
    });

    worker.onmessage = e => {
      setFormatErrors(e.data);
      worker.terminate();
    };

    worker.postMessage(paragraphs);
  };

  type ErrorKey = keyof ErrorList;

  function isErrorKey(key: string): key is ErrorKey {
    return [
      'multipleSpaceErrors',
      'emDashErrors',
      'titleCaseErrors',
      'leadingTrailingSpaceErrors',
      'spaceBeforePunctuationErrors',
      'missingPunctuationErrors',
    ].includes(key);
  }

  const renderErrorList = (
    errors: { heading?: string; sentence: string }[],
    regex: RegExp,
    type: string
  ) => {
    const handleHeaderClick = (type: string) => {
      // Optional: highlight all sentences under this error type
      const phrasesToHighlight: FormatError[] = isErrorKey(type)
        ? formatErrors[type]
        : [];
      onHighlight(phrasesToHighlight.map((e: any) => e.sentence));
      setHighlightActive(true);
    };

    if (errors.length > 0) {
      return (
        <ul className="text-xs space-y-1">
          {errors.map((err, idx) => {
            const highlighted = err.sentence.replace(regex, match => {
              return `<mark class="bg-red-300 text-red-700 rounded-sm px-1">${match}</mark>`;
            });

            return (
              <li key={idx}>
                {err.heading && err.sentence !== err.heading ? (
                  <>
                    <div
                      className="font-bold cursor-pointer hover:text-blue-500"
                      onClick={() => handleHeaderClick(type)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') handleHeaderClick(type);
                      }}>
                      {err.heading}
                    </div>
                    <ul className="pl-3 mt-2">
                      <li
                        className="list-disc"
                        dangerouslySetInnerHTML={{ __html: highlighted }}
                      />
                    </ul>
                  </>
                ) : (
                  <span dangerouslySetInnerHTML={{ __html: highlighted }} />
                )}
              </li>
            );
          })}
        </ul>
      );
    }

    const noIssuesMessages: Record<string, string> = {
      multipleSpaceErrors: 'No multiple spaces. Rawr',
      emDashErrors: 'No em dash issues. Rawr',
      leadingTrailingSpaceErrors: 'No leading/trailing spaces. Rawr',
      spaceBeforePunctuationErrors: 'No space before punctuation. Rawr',
      missingPunctuationErrors: 'No missing punctuation. Rawr',
    };

    return (
      <p className="text-gray-500 italic">
        {noIssuesMessages[type] || 'No issues found.'}
      </p>
    );
  };

  // function getAllErrorSentences(formatErrors: Record<string, { sentence: string }[]>): string[] {
  //   const allSentences: string[] = [];

  //   Object.values(formatErrors).forEach(errorArray => {
  //     errorArray.forEach(error => {
  //       if (error.sentence) {
  //         allSentences.push(error.sentence.trim());
  //       }
  //     });
  //   });

  //   return allSentences;
  // }

  const handleHighlightFormatErrors = () => {
    onFormatHighlight(formatErrors);
    setHighlightActive(true);
  };

  const highlightTitleCaseErrorsStrict = (sentence: string) => {
    return sentence
      .split(/\s+/)
      .map(word => {
        // Check if the first character is lowercase (ignores punctuation)
        const firstChar = word.charAt(0);
        if (firstChar === firstChar.toLowerCase() && /[a-z]/.test(firstChar)) {
          return `<mark class="bg-red-300 text-red-700 rounded-sm px-1">${word}</mark>`;
        }
        return word;
      })
      .join(' ');
  };

  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .replace(/\b\w+/g, word => word.charAt(0).toUpperCase() + word.slice(1));
  };

  const handleFixAll = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    const paragraphs = Array.from(doc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6'));
    paragraphs.forEach(el => {
      let fixedText = el.textContent || '';
      const tagName = el.tagName.toUpperCase();

      // Fix multiple spaces
      fixedText = fixedText.replace(/[ \u00A0]{2,}/g, ' ');

      // Fix em dash spacing
      fixedText = fixedText.replace(/ ?— ?/g, ' — ');

      // Fix leading/trailing spaces
      fixedText = fixedText.trim();

      // Fix space before punctuation
      fixedText = fixedText.replace(/ ([.,;:!?])/g, '$1');

      // Title Case Headings
      if (tagName.startsWith('H')) {
        fixedText = toTitleCase(fixedText);
      }

      el.textContent = fixedText;
    });

    onFixAll(doc.body.innerHTML);
  };

  ////////////////////////////////////////////////////////
  //////////////CONTENT QA TOOL///////////////////////////
  ////////////////////////////////////////////////////////

  const checkContentIssues = () => {
    onCheckContentIssuesClick();
  };

  ////////////////////////////////////////////////////////
  ///////////////LINK QA TOOL/////////////////////////////
  ////////////////////////////////////////////////////////

  const handleAnalyzeLink = () => {
    checkAnalyzeLink();
    setHasLinkChecked(true);
  };

  const checkAnalyzeLink = async () => {
    if (!text) return;

    const result = await analyzeLinks(text);
    console.log('analyzeLinks result:', result);

    setLinkErrors(result);

    if (typeof onLinkIssues === 'function') {
      const issues: LinkIssue[] = [];

      Object.entries(result).forEach(([type, details]) => {
        console.log(`Type: ${type}, Details:`, details);
        if (Array.isArray(details)) {
          details.forEach(entry => {
            if (typeof entry === 'string') {
              issues.push({ type, url: entry });
            } else {
              issues.push({ type, url: entry.url, anchor: entry.anchor });
            }
          });
        }
      });

      onLinkIssues(issues);
    }

    setLinkShowResults(true);
  };

  const formatErrorLabel = (label: string) =>
    label.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

  const totalLinkAndAnchorIssues = linkErrors
    ? Object.entries(linkErrors)
        .filter(([key]) => key !== 'internalLinks' && key !== 'externalLinks')
        .reduce((sum, [, arr]) => sum + arr.length, 0)
    : 0;

  const totalLinkErrors = linkErrors
    ? Object.entries(linkErrors)
        .filter(([key]) => key !== 'internalLinks' && key !== 'externalLinks')
        .reduce((sum, [, arr]) => sum + arr.length, 0)
    : 0;

  const linkErrorMessage =
    totalLinkErrors === 0
      ? 'No link issues found! Good job! 🎉'
      : 'Some link issues found! Please review.⚠️';

  const scrollToLink = (url: string) => {
    try {
      const el = document.querySelector(`a[href="${CSS.escape(url)}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bg-green-100', '!text-white');
        setTimeout(() => {
          el.classList.remove('bg-green-100', '!text-white');
        }, 2000);
      }
    } catch (e) {
      console.warn(`Failed to scroll to link: ${url}`, e);
    }
  };

  ////////////////////////////////////////////////////////
  /////////////////KEYWORD QA TOOL////////////////////////
  ////////////////////////////////////////////////////////

  const checkAnalyzeKeyword = () => {
    handleAnalyze();
  };

  // const keywordErrorMessage =
  // totalContentErrors === 0
  //   ? 'No keyword issues found! Good job! 🎉'
  //   : `Analysis was cancelled or failed.`;

  const handleAnalyzeKeyword = () => {
    checkAnalyzeKeyword();
    setHasKeywordChecked(true);
  };

  const onShowHighlightClick = () => {
    onKeywordShowHighlightClick();
  };

  const renderKeywordAlert = () => {
    if (!keyword) {
      return <Alert message="Enter keyphrase to analyze" type="info" />;
    }
    if (keywordAnalysisResult?.focusKeyphrase === keyword) {
      return <Alert message="Done analyzing" type="success" />;
    }
    if (!error) return <Alert message="Click 'Analyze Keywords again" type="info" />;
  };
/////////////////////////////////////////
///////////RUN ALL CHECKS////////////////
/////////////////////////////////////////
const runAllChecks = () => {
 yoastSEOAnalyze();
 checkForViolations();
 runFormatCheck();
 setShowResults(true);
 checkContentIssues();
 handleAnalyzeLink();
 handleAnalyzeKeyword();
}


  return (
    <div className="w-[350px] min-h-[500px]">
      <Button 
        onClick={() => {
        runAllChecks(); 
        setShowSummary('summary'); 
        setHasRunChecks(true);
        }}
      className="w-full mb-4">Run All Checks</Button>
      <section
        className={clsx(
          'border border-black/17.5 rounded-md pb-4 px-4 bg-white',
          'flex flex-1 flex-col'
        )}>
        {/* <Button className="self-center">Export Full Report</Button> */} {/*TO BE ADDED*/}
        <div
          className={clsx(
            'justify-between flex',
            'mx-[-16px] mb-4'
          )}>
          <a
            onClick={() => setShowSummary('summary')}
            className={`w-full text-center cursor-pointer font-bold p-2 ${
              showSummary === 'summary' ? '' : 'border border-y-black/17.5 border-r-black/17.5 border-l-0 hover:bg-black-200 hover:text-white bg-[#e4e4eb]'
            }`}
          >
            Summary
          </a>

          <a
            onClick={() => setShowSummary('tools')}
            className={`w-full text-center cursor-pointer font-bold p-2 ${
              showSummary === 'tools' ? '' : 'border border-y-black/17.5 border-l-black/17.5 border-r-0 hover:bg-black-200 hover:text-white bg-[#e4e4eb]'
            }`}
          >
            Tools
          </a>
        </div>
        {hasRunChecks && showSummary === 'summary' && (
          <div>
            <Summary
              totalWordCount={contentIssuesResult?.totalWordCount ?? null}              
              keywordCounts={keywordAnalysisResult?.keywordCounts.focusCount ?? null}
              keywordDensity={keywordAnalysisResult?.density.toFixed(2) ?? null}
              alternateEsqCount={keywordAnalysisResult?.keywordCounts.altCount ?? 0}
              headingsCount={contentIssuesResult?.headings?.length ?? 0}
              internalLinksCount={linkErrors?.internalLinks?.length || 0}
              externalLinksCount={linkErrors?.externalLinks?.length || 0}
            />
            {/* <div className="w-full border border-b-black-200"></div> */}
           {(contentIssuesResult?.totalWordCount ?? 0) > 0 && (
            <ul>
              {/* YOAST */}
              <li className="border border-black/20 p-2 rounded-md">
                <div className="flex justify-between">
                  <span className="font-bold">Yoast SEO</span>
                  <FiEyeOff className="text-gray-200"/>
                </div>
                <ul className="text-sm">
                  <li>
                    <h6 className="font-bold text-xs mt-2">YOAST SEO ANALYSIS</h6>
                    <ul>
                      <li className="flex justify-between">
                        <span className='flex justify-between item-center gap-2'>
                          <GoDotFill className="text-red-500 mt-0.5"/>
                          <span>Problems</span>
                        </span>
                        <span>{seoProblems.length}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className='flex justify-between item-center gap-2'>
                          <GoDotFill className="text-green-500 mt-0.5"/>
                          <span>Good Results</span>
                        </span>
                        <span>{seoAchievements.length}</span>
                      </li>
                    </ul>
                  </li>
                  <li className="mt-2">
                    <h6 className="font-bold text-xs mt-2 ">YOAST READABILITY ANALYSIS</h6>
                    <ul>
                      <li className="flex justify-between">
                        <span className='flex justify-between item-center gap-2'>
                          <GoDotFill className="text-red-500 mt-0.5"/>
                          <span>Problems</span>
                        </span>
                        <span>{readabilityProblems.length}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className='flex justify-between item-center gap-2'>
                          <GoDotFill className="text-green-500 mt-0.5"/>
                          <span>Good Results</span>
                        </span>
                        <span>{readabilityAchievements.length}</span>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>


              {/* SB37 */}
              <li className="border border-black/20 p-2 mt-2 rounded-md">
                <div className="flex justify-between">
                  <span className="font-bold">SB37</span>
                  {highlightActive ? (
                    <GoEye
                      title="Remove Highlights"
                      className="text-gray-500 cursor-pointer"
                      onClick={() => {
                        onRemoveHighlight();
                        setActiveHighlights([]);
                        setHighlightActive(false);
                      }}
                    />
                  ) : (
                    <FiEyeOff
                      title="Show Highlights"
                      className="text-gray-500 cursor-pointer"
                      onClick={() => {
                        const updated = Array.from(
                          new Set([...activeHighlights, ...violations, ...dictionaryViolations])
                        );
                        setActiveHighlights(updated);
                        onHighlight(updated);
                        setHighlightActive(true);
                      }}
                    />
                  )}
                </div>
                <ul className="text-sm mt-2">
                  <li className="flex items-start gap-2 mt-2">
                    <GoDotFill
                      className={
                        violations.length === 0 && dictionaryViolations.length === 0
                          ? 'text-yellow-200 mt-1'
                          : 'text-yellow-200 mt-1'
                      }
                    />
                    <span>
                      {violations.length === 0 && dictionaryViolations.length === 0
                        ? 'No potential SB37 violations found.'
                        : `Potential SB37 violations found in ${
                            Object.keys(violationResults).length + Object.keys(dictionaryViolationResults).length
                          } section(s).`}
                    </span>
                  </li>
                </ul>
              </li>

              {/* FORMATTING */}
              <li className="border border-black/20 p-2 mt-2 rounded-md">
                <div className="flex justify-between">
                  <span className="font-bold">FORMATTING</span>
                  {highlightActive ? (
                    <GoEye
                      title="Remove Highlights"
                      className="text-gray-500 cursor-pointer"
                      onClick={() => {
                        onRemoveFormatHighlight();
                        setHighlightActive(false);
                      }}
                    />
                  ) : (
                    <FiEyeOff
                      title="Show Highlights"
                      className="text-gray-500 cursor-pointer"
                      onClick={() => {
                        handleHighlightFormatErrors();
                        setHighlightActive(true);
                      }}
                    />
                  )}
                </div>
                <ul className="text-sm">
                  {[
                    {
                      label: 'Multiple spaces',
                      count: formatErrors.multipleSpaceErrors.length
                    },
                    {
                      label: 'Em dash issues',
                      count: formatErrors.emDashErrors.length
                    },
                    {
                      label: 'Lowercase in headings',
                      count: formatErrors.titleCaseErrors.length
                    },
                    {
                      label: 'Leading/trailing spaces',
                      count: formatErrors.leadingTrailingSpaceErrors.length
                    },
                    {
                      label: 'Space before punctuation',
                      count: formatErrors.spaceBeforePunctuationErrors.length
                    },
                    {
                      label: 'Missing punctuation',
                      count: formatErrors.missingPunctuationErrors.length
                    }
                  ].map(({ label, count }, idx) => (
                    <li key={idx} className="flex justify-between mt-2">
                      <div className="flex items-center gap-2">
                        {contentIssuesResult && (
                          <GoDotFill
                            className={
                              count > 0 ? 'text-red-500' : 'text-green-500'
                            }
                          />
                        )}
                        <span>{count > 0 ? `${label} found` : `No ${label.toLowerCase()}`}</span>
                      </div>
                      <span>{count}</span>
                    </li>
                  ))}
                </ul>
              </li>

              {/* CONTENT */}
            <li className="border border-black/20 p-2 mt-2 rounded-md">
              <div className="flex justify-between">
                <span className="font-bold">Content</span>

              {contentHighlightsActive ? (
                <GoEye
                  onClick={() => {
                    if (!text || !contentIssuesResult || editMode) return;
                    onRemoveContentHighlight();
                    setContentHighlightsActive(false);
                  }}
                  title="Remove Highlights"
                  className={clsx(
                    'text-gray-500 cursor-pointer transition-colors',
                    (!text || !contentIssuesResult || editMode) && 'opacity-50 cursor-not-allowed',
                    'text-blue-500' // highlight when active
                  )}
                />
              ) : (
                <FiEyeOff
                  onClick={() => {
                    if (!text || !contentIssuesResult || editMode) return;
                    onHighlightContent();
                    setContentHighlightsActive(true);
                  }}
                  title="Show Highlights"
                  className={clsx(
                    'text-gray-500 cursor-pointer transition-colors',
                    (!text || !contentIssuesResult || editMode) && 'opacity-50 cursor-not-allowed'
                  )}
                />
              )}

              </div>
              <ul className="text-sm">
                <li className="flex justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <GoDotFill className="!text-gray-200" />
                    <span>Total Word Count:</span>
                  </div>
                  <span>{contentIssuesResult?.totalWordCount}</span>
                </li>

                <li className="flex justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {contentIssuesResult && (
                      <GoDotFill
                        className={
                          (contentIssuesResult?.over300Sections?.length ?? 0) > 0
                            ? 'text-gray-600'
                            : 'text-gray-600'
                        }
                      />
                    )}
                    <span>
                      {(contentIssuesResult?.over300Sections?.length ?? 0) > 0
                        ? 'Some sections have over 300 words'
                        : 'All sections are under 300 words'}
                    </span>
                  </div>
                  {(contentIssuesResult?.over300Sections?.length ?? 0) > 0 && (
                    <span>{contentIssuesResult?.over300Sections.length}</span>
                  )}
                </li>

                <li className="flex justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {contentIssuesResult && (
                      <GoDotFill
                        className={
                          (contentIssuesResult?.sameWordStreaks?.length ?? 0) > 0
                            ? 'text-[#fbc795]'
                            : 'text-[#fbc795]'
                        }
                      />
                    )}
                    <span>
                      {(contentIssuesResult?.sameWordStreaks?.length ?? 0) > 0
                        ? 'Repeated sentence starts'
                        : 'No repeated sentence starts'}
                    </span>
                  </div>
                  {(contentIssuesResult?.sameWordStreaks?.length ?? 0) > 0 && (
                    <span>{contentIssuesResult?.sameWordStreaks.length}</span>
                  )}
                </li>
              </ul>
            </li>


              {/* LINKS */}
              <li className="border border-black/20 p-2 mt-2 rounded-md">
                <div className="flex justify-between">
                  <span className="font-bold">Links</span>
                  <GoEye className="text-gray-500" />
                </div>
                {linkErrors && (
                  <ul className="text-sm">
                    {(
                      [
                        'invalidLinks',
                        'missingTrailingSlash',
                        'duplicateLinks',
                        'brokenLinks',
                        'identicalAnchors',
                        'invalidAnchors',
                      ] as (keyof typeof linkErrors)[]
                    ).map((key) => {
                      const count = Array.isArray(linkErrors[key]) ? linkErrors[key].length : 0;
                      const hasIssues = count > 0;

                      return (
                        <li key={key} className="flex justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <GoDotFill className={hasIssues ? 'text-red-500' : 'text-green-500'} />
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                          </div>
                          <span>{count}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}

              </li>

              {/* KEYWORDS */}
              <li className="border border-black/20 p-2 mt-2 rounded-md">
                <div className="flex justify-between">
                  <span className="font-bold">Keywords</span>
                  {keywordHighlightsActive ? (
                    <GoEye
                      onClick={() => {
                        if (!text || !keywordAnalysisResult || editMode) return;
                        onRemoveContentHighlight();
                        setKeywordHighlightsActive(false);
                      }}
                      title="Remove Highlights"
                      className={clsx(
                        'text-gray-500 cursor-pointer transition-colors',
                        (!text || !keywordAnalysisResult || editMode) && 'opacity-50 cursor-not-allowed',
                        'text-blue-500'
                      )}
                    />
                  ) : (
                    <FiEyeOff
                      onClick={() => {
                        if (!text || !keywordAnalysisResult || editMode) return;
                        onHighlightContent();
                        setKeywordHighlightsActive(true);
                      }}
                      title="Show Highlights"
                      className={clsx(
                        'text-gray-500 cursor-pointer transition-colors',
                        (!text || !keywordAnalysisResult || editMode) && 'opacity-50 cursor-not-allowed'
                      )}
                    />
                  )}
                </div>

                <ul className="text-sm">
                  {keywordAnalysisResult && !error && (
                    <>
                      {/* Focus Keyword Count */}
                      <li className="flex justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <GoDotFill
                            className={
                              keywordAnalysisResult.keywordCounts.focusCount > 0
                                ? 'text-green-500'
                                : 'text-red-500'
                            }
                          />
                          <span>
                            {keywordAnalysisResult.keywordCounts.focusCount > 0
                              ? 'Focus keyword found'
                              : 'Focus keyword missing'}
                          </span>
                        </div>
                        <span>{keywordAnalysisResult.keywordCounts.focusCount}</span>
                      </li>

                      {/* Alt Keyword Count */}
                      <li className="flex justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <GoDotFill
                            className={
                              keywordAnalysisResult.keywordCounts.altCount > 0
                                ? 'text-green-500'
                                : 'text-red-500'
                            }
                          />
                          <span>
                            {keywordAnalysisResult.keywordCounts.altCount > 0
                              ? 'Alternate keyword found'
                              : 'Alternate keyword missing'}
                          </span>
                        </div>
                        <span>{keywordAnalysisResult.keywordCounts.altCount}</span>
                      </li>

                      {/* Total Keyword Density */}
                      <li className="flex justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <GoDotFill
                            className={
                              keywordAnalysisResult.density > 2.5
                                ? 'text-red-500'
                                : 'text-green-500'
                            }
                          />
                          <span>Keyword density</span>
                        </div>
                        <span>{keywordAnalysisResult.density.toFixed(2)}%</span>
                      </li>
                    </>
                  )}
                </ul>
              </li>

            </ul>
            )}
          </div>
        )}

        {showSummary === 'tools' && (
          <Tabs className={clsx('min-h-[410px]')}>
            <TabList
              aria-label="Error List"
              className="flex gap-1 mb-5 dark:!text-black-200">
              <Tab id="Yoast" className={tabHeaderStyle}>
                <YoastIcon className={svgStyle} />
                Yoast
              </Tab>
              <Tab id="SB37" className={tabHeaderStyle}>
                <GoLaw className={svgStyle} />
                SB37
              </Tab>
              <Tab id="Format" className={tabHeaderStyle}>
                <GoAlert className={svgStyle} />
                Format
              </Tab>
              <Tab id="Content" className={tabHeaderStyle}>
                <GoChecklist className={svgStyle} />
                Content
              </Tab>
              <Tab id="Link" className={tabHeaderStyle}>
                <GoLink className={svgStyle} />
                Link
              </Tab>
              <Tab id="Keyword" className={tabHeaderStyle}>
                <GoSearch className={svgStyle} />
                Keyword
              </Tab>
            </TabList>

            <TabPanel id="Yoast">
              <div className="text-center dark:!text-black">
                <Button
                  className="w-full !bg-[#2563ea] hover:!bg-blue-1000 text-white dark:!text-white border-0 hover:shadow-none dark:hover:shadow-none rounded-none"
                  onClick={yoastSEOAnalyze}>
                  Run Yoast SEO Analysis
                </Button>

                <h6 className={resultsHeaderStyle}>YOAST SEO ANALYSIS</h6>
                <Accordion header="Problems" className="mb-2 text-sm">
                  {seoProblems.map((result: AssessmentResult, index: number) => (
                    <li
                      key={`seo-problem-${index}`}
                      className={errorListStyle}
                      dangerouslySetInnerHTML={{
                        __html: formatList(result.text),
                      }}
                    />
                  ))}
                </Accordion>
                <Accordion header="Good results" className="text-sm">
                  {seoAchievements.map((result: AssessmentResult, index: number) => (
                    <li
                      key={`seo-good-${index}`}
                      className={passListStyle}
                      dangerouslySetInnerHTML={{
                        __html: formatList(result.text),
                      }}
                    />
                  ))}
                </Accordion>
                <h6 className={resultsHeaderStyle}>YOAST READABILITY ANALYSIS</h6>
                <Accordion header="Problems" className="mb-2 text-sm">
                  {readabilityProblems.map((result: AssessmentResult, index: number) => (
                    <li
                      key={`readability-problem-${index}`}
                      className={errorListStyle}
                      dangerouslySetInnerHTML={{
                        __html: formatList(result.text),
                      }}
                    />
                  ))}
                </Accordion>
                <Accordion header="Good results" className="text-sm">
                  {readabilityAchievements.map(
                    (result: AssessmentResult, index: number) => (
                      <li
                        key={`readability-problem-${index}`}
                        className={passListStyle}
                        dangerouslySetInnerHTML={{
                          __html: formatList(result.text),
                        }}
                      />
                    )
                  )}
                </Accordion>
              </div>
            </TabPanel>

            <TabPanel id="SB37">
              <div className="mb-5 dark:!text-black">
                <Button
                  className="w-full !bg-[#2563ea] hover:!bg-blue-1000 text-white dark:!text-white border-0 hover:shadow-none rounded-none dark:hover:shadow-none"
                  onClick={checkForViolations}>
                  Check For Potential Violations
                </Button>

                <div className="flex mt-5 gap-2 mb-1">
                  <Button
                    className="w-full text-sm !bg-white text-black !border-black-200 border rounded-none hover:shadow-none hover:!bg-black-200 hover:text-white dark:hover:shadow-none dark:!text-black-200 dark:hover:!text-white"
                    disabled={violations.length === 0 && dictionaryViolations.length === 0}
                    onClick={() => {
                      const updated = Array.from(
                        new Set([...activeHighlights, ...violations, ...dictionaryViolations])
                      );
                      setActiveHighlights(updated);
                      onHighlight(updated);
                      setHighlightActive(true);
                    }}
                  >
                    Show All Highlights
                  </Button>
                  
                  <Button
                    className="w-full text-sm !bg-[#EF4444] border-[#EF4444]  text-white border hover:!bg-red-700 hover:!border-red-700 rounded-none hover:shadow-none dark:hover:shadow-none dark:!text-white"
                    disabled={!highlightActive}
                    onClick={() => {
                      onRemoveHighlight();
                      setActiveHighlights([]);
                      setHighlightActive(true);
                    }}>
                    Remove Highlights
                  </Button>
                </div>
              </div>

              <div className="mb-4 dark:!text-black">
                <h4 className="mb-2 font-semibold">Results:</h4>

                <Accordion
                  header={
                    <div className="flex justify-between items-center w-full text-sm">
                      <span className="text-sm">Potential Violations</span>
                      {hasCheckedViolations &&
                        (violations.length > 0 ? (
                          <div className="bg-[#f5ecee] w-[40px] text-right rounded-2xl px-2">
                            <span className="text-red-100">{violations.length}</span>
                          </div>
                        ) : (
                          <div className="bg-[#e5f5ea] w-[40px] text-right rounded-2xl px-2">
                            <span className="text-green-100">0</span>
                          </div>
                        ))}
                    </div>
                  }
                  className="border mb-2">
                  {violations.length === 0 ? (
                    <div className="flex justify-between">
                      <span>No potential SB37 violations found!</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Potential SB37 violations found in:</span>
                      </div>
                      <ul className="list-disc pl-4 space-y-2">
                        {Object.entries(violationResults).map(([, headings], index) =>
                          headings.map((headingInfo, i) => (
                            <li key={`${index}-${i}`}>
                              <a
                                href={`#${headingInfo.id}`}
                                className="text-black font-bold hover:underline">
                                {headingInfo.heading}
                              </a>
                            </li>
                          ))
                        )}
                      </ul>
                      <div className="text-sm text-gray-500">
                        {`Matched ${violations.length} total phrase occurrences across ${Object.keys(violationResults).length} unique phrases.`}
                      </div>
                    </div>
                  )}
                </Accordion>

                <Accordion
                  header={
                    <div className="flex justify-between items-center w-full text-sm">
                      <span className="text-sm">Potential Violations (Dictionary)</span>
                      {dictionaryViolations.length > 0 ? (
                        <div className="bg-[#f5ecee] w-[40px] text-right rounded-2xl px-2">
                          <span className="text-red-100">
                            {dictionaryViolations.length}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-[#e5f5ea] w-[40px] text-right rounded-2xl px-2">
                          <span className="text-green-100">0</span>
                        </div>
                      )}
                    </div>
                  }
                  className="border mb-2">
                  {dictionaryViolations.length === 0 ? (
                    <div className="flex justify-between">
                      <span>No dictionary violations found!</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Potential dictionary violations found in:</span>
                      </div>
                      <ul className="list-disc pl-4 space-y-2">
                        {Object.entries(dictionaryViolationResults).map(
                          ([, headings], index) =>
                            headings.map((headingInfo, i) => (
                              <li key={`${index}-${i}`}>
                                <a
                                  href={`#${headingInfo.id}`}
                                  className="text-black font-bold hover:underline">
                                  {headingInfo.heading}
                                </a>
                              </li>
                            ))
                        )}
                      </ul>
                      <div className="text-sm text-gray-500">
                        {`Matched ${dictionaryViolations.length} total phrase occurrences across ${Object.keys(dictionaryViolationResults).length} unique dictionary phrases.`}
                      </div>
                    </div>
                  )}
                </Accordion>
              </div>

              <div className="mb-3">
                <h5 className="dark:!text-black">Check for additional words/phrases:</h5>
                <div className="relative mb-1">
                  <input
                    type="text"
                    placeholder="Search"
                    className="!w-full"
                    value={customSearchTerm}
                    onChange={e => setCustomSearchTerm(e.target.value)}
                  />

                  <GoSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                </div>

                {customSearchResults.some(result => result.count > 0) && (
                  <div className="mt-1 mb-2">
                    <div className="flex justify-between font-extrabold p-2 bg-gray-300 dark:!text-black-200">
                      Search Results:
                    </div>
                    {customSearchResults.map(({ term, count, id }, index) => (
                      <div key={index} className="py-1 border-b border-gray-200">
                        {count > 0 ? (
                          <a
                            href={`#${id ?? term.replace(/\s+/g, '-').toLowerCase()}`}
                            className="text-blue-600 font-bold hover:underline cursor-pointer flex justify-between hover:bg-gray-100 px-2"
                            onClick={() => onHighlight([term])}>
                            <strong>{term}</strong> <span>{count}</span>
                          </a>
                        ) : (
                          <span className="text-gray-500 line-through px-2">
                            <strong>{term}</strong> – No matches found.
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                  <Button
                    className="w-full !bg-white border !border-black-200 hover:!bg-black-200 hover:text-white rounded-none  text-black hover:shadow-none dark:hover:shadow-none dark:!text-black-200 dark:hover:!text-white"
                    onClick={handleCustomSearch}>
                    Search Now
                  </Button>

                <div className="flex gap-2 mt-3">

                  <Button
                    onClick={handleAddOpenModal}
                    className="w-full border !border-black-200 text-white hover:!bg-black-200 hover:text-white rounded-none !bg-[#6B7280] hover:shadow-none dark:hover:shadow-none dark:!text-black-200 dark:hover:!text-white">
                    Add to Dictionary
                  </Button>

                  {isAddModalOpen && (
                    <Modal
                      isOpen={isAddModalOpen}
                      onClose={() => setIsAddModalOpen(false)}
                      width="700px"
                      height="auto"
                      backgroundColor="#0a1a31"
                      showCloseButton={false}>
                      <div className="w-full h-full">
                        <div>
                          {addStatus === 'success' && (
                            <div className="text-green-500 mt-2 bg-green-900/20 p-2 flex items-center gap-2">
                              <span>Added to the dictionary!</span>
                              <span>
                                <FaCheckCircle className="text-green-500" />
                              </span>
                            </div>
                          )}
                          {addStatus === 'exists' && (
                            <div className=" mt-2 p-2 bg-red-300 text-red-100 flex items-center gap-2">
                              <span>Phrase already exists in the dictionary.</span>
                              <span>
                                <FaTimesCircle className="text-red-500" />
                              </span>{' '}
                            </div>
                          )}
                          {addStatus === 'error' && (
                            <div className="text-red-500 bg-red-300 mt-2 p-2 flex items-center gap-2">
                              <span>Error adding phrase. Try again.</span>
                              <span>
                                <FaTimesCircle className="text-red-500" />
                              </span>
                            </div>
                          )}
                          <input
                            type="text"
                            placeholder="Potential Violation"
                            className="!w-full mb-2"
                            value={newPhrase}
                            onChange={e => {
                              setNewPhrase(e.target.value);
                              setAddStatus(null);
                            }}
                          />
                          <button
                            onClick={handleAddPhrase}
                            className="bg-blue-200 hover:bg-blue-1000 text-white font-extrabold w-full p-2 cursor-pointer">
                            Add Potential Violation
                          </button>
                        </div>
                        <div className="flex justify-end mt-5">
                          <button
                            onClick={handleAddCloseModal}
                            className="border border-white cursor-pointer py-2 px-7 hover:bg-red-100 hover:border-red-100 text-white">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </Modal>
                  )}
                <Button
                  onClick={handleViewOpenModal}
                  className="w-full !bg-[#6B7280] hover:!bg-black-200 text-white border-0 rounded-none  hover:shadow-none dark:!text-white dark:hover:shadow-none  dark:hover:!text-white">
                  View Dictionary
                </Button>
                {isViewModalOpen && (
                  <Modal
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    width="1200px"
                    height="auto"
                    backgroundColor="#0a1a31"
                    showCloseButton={false}>
                    <div className="w-full h-full">
                      <h2 className="!text-left text-white text-2xl font-extrabold">
                        Added Potential Violations
                      </h2>
                      <div>
                        <table
                          className={clsx(
                            'w-full my-[20px] mx-auto border-collapse',
                            'table-fixed shadow-[0_4px_6px_rgba(0, 0, 0, 0.1)]'
                          )}>
                          <thead>
                            <tr>
                              <th>Keyword</th>
                              <th>Added By</th>
                              <th className="w-[80px]"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {dictionary.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="text-center">
                                  No entries found.
                                </td>
                              </tr>
                            ) : (
                              dictionary.map((entry, index) => (
                                <tr key={index}>
                                  <td className=" px-4 py-2 !text-white">
                                    {entry.keyword}
                                  </td>
                                  <td className=" px-4 py-2 !text-white">
                                    {entry.created_by}
                                  </td>
                                  <td className=" px-4 py-2 !text-white">
                                    <FaTrash
                                      className="text-white hover:text-red-500 cursor-pointer"
                                      onClick={() => {
                                        if (
                                          confirm(`Delete phrase "${entry.keyword}"?`)
                                        ) {
                                          handleDeletePhrase(entry.id);
                                        }
                                      }}
                                    />
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={handleViewCloseModal}
                          className="border border-white cursor-pointer py-2 px-7 hover:bg-red-100 hover:border-red-100 text-white">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </Modal>
                )}
                </div>

              </div>
            </TabPanel>

            <TabPanel id="Format">
              <Button
                onClick={() => {
                  runFormatCheck();
                  setShowResults(true);
                }}
                className="w-full !bg-[#2563ea] hover:!bg-blue-1000 text-white border-0 hover:shadow-none rounded-none dark:hover:shadow-none dark:!text-white">
                {loading ? 'Checking...' : 'Check For Formatting Errors'}
              </Button>

              <div className="flex mt-5 gap-2 mb-2">
                <Button
                  className="w-1/2 text-sm !bg-white text-black !border-black-200 border rounded-none hover:shadow-none hover:!bg-black-200 hover:text-white dark:hover:shadow-none dark:!text-black-200 dark:hover:!text-white"
                  onClick={() => handleHighlightFormatErrors()}>
                  Show Highlights
                </Button>

                <Button
                  className="w-1/2 text-sm !bg-[#EF4444] border-[#EF4444] text-white border hover:!bg-red-700 hover:!border-red-700 rounded-none hover:shadow-none dark:hover:shadow-none dark:!text-white"
                  onClick={() => {
                    onRemoveFormatHighlight();
                    setHighlightActive(false);
                  }}>
                  Remove Highlights
                </Button>
              </div>
              {showResults && (
                <>
                  <div
                    className={`mb-4 p-4 rounded ${hasErrors ? 'bg-[#faeaea] text-red-600' : 'bg-[#e6f6e9] !text-green-100'}`}>
                    {!hasErrors ? (
                      <h6 className="!text-center">No formatting errors found! Good job! 🎉</h6>
                    ) : (
                      <div className="w-full flex justify-center flex-col">
                        {formatErrors.missingPunctuationErrors.length > 0 &&
                        formatErrors.multipleSpaceErrors.length === 0 &&
                        formatErrors.emDashErrors.length === 0 &&
                        formatErrors.leadingTrailingSpaceErrors.length === 0 &&
                        formatErrors.spaceBeforePunctuationErrors.length === 0 &&
                        formatErrors.titleCaseErrors.length === 0 ? (
                          <h6 className="!text-center !text-sm text-red-600">
                            Missing Punctuation errors, fix manually ⚠️
                          </h6>
                        ) : (
                          <>
                            <h6 className="!text-center !text-sm text-red-600">
                              Formatting Errors found! Please fix ⚠️
                            </h6>
                            <Button
                              onClick={handleFixAll}
                              className="w-full my-0 border-0 mt-3 !px-5 rounded-sm !bg-red-100 !text-white !shadow-none hover:!bg-red-600">
                              Fix All
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <Accordion
                    header={
                      <div className="flex justify-between items-center w-full text-sm">
                        <span>Multiple Spaces</span>
                        {showResults &&
                          (formatErrors.multipleSpaceErrors.length > 0 ? (
                            <div className="bg-[#f5ecee] w-[40px] text-right rounded-2xl px-2">
                              <span className="text-red-100">
                                {formatErrors.multipleSpaceErrors.length}
                              </span>
                            </div>
                          ) : (
                            <div className="bg-[#e5f5ea] w-[40px] text-right rounded-2xl px-2">
                              <span className="text-green-100">0</span>
                            </div>
                          ))}
                      </div>
                    }
                    className="mb-2 text-sm border dark:border-black-200 dark:!text-black-200">
                    {renderErrorList(
                      formatErrors.multipleSpaceErrors,
                      /\s{2,}/g,
                      'multipleSpaceErrors'
                    )}
                  </Accordion>

                  <Accordion
                    header={
                      <div className="flex justify-between items-center w-full text-sm">
                        <span>Em Dash Issues</span>
                        {showResults &&
                          (formatErrors.emDashErrors.length > 0 ? (
                            <div className="bg-[#f5ecee] w-[40px] text-right rounded-2xl px-2">
                              <span className="text-red-100">
                                {formatErrors.emDashErrors.length}
                              </span>
                            </div>
                          ) : (
                            <div className="bg-[#e5f5ea] w-[40px] text-right rounded-2xl px-2">
                              <span className="text-green-100">0</span>
                            </div>
                          ))}
                      </div>
                    }
                    className="mb-2 text-sm dark:!text-black-200">
                    {renderErrorList(
                      formatErrors.emDashErrors,
                      /[^ ]—|—[^ ]/g,
                      'emDashErrors'
                    )}
                  </Accordion>

                  <Accordion
                    header={
                      <div className="flex justify-between items-center w-full text-sm">
                        <span>Lowercase in Heading</span>
                        {showResults &&
                          (formatErrors.titleCaseErrors.length > 0 ? (
                            <div className="bg-[#f5ecee] w-[40px] text-right rounded-2xl px-2">
                              <span className="text-red-100">
                                {formatErrors.titleCaseErrors.length}
                              </span>
                            </div>
                          ) : (
                            <div className="bg-[#e5f5ea] w-[40px] text-right rounded-2xl px-2">
                              <span className="text-green-100">0</span>
                            </div>
                          ))}
                      </div>
                    }
                    className="mb-2 text-sm dark:!text-black-200">
                    {formatErrors.titleCaseErrors.length > 0 ? (
                      <ul className="text-xs space-y-1 pl-3">
                        {formatErrors.titleCaseErrors.map((err, idx) => {
                          const highlighted = highlightTitleCaseErrorsStrict(
                            err.sentence
                          );
                          return (
                            <li key={idx} className="list-disc">
                              {err.heading && err.sentence !== err.heading ? (
                                <>
                                  <div className="font-bold">{err.heading}</div>
                                  <ul className="pl-3 mt-2">
                                    <li
                                      className="list-disc"
                                      dangerouslySetInnerHTML={{ __html: highlighted }}
                                    />
                                  </ul>
                                </>
                              ) : (
                                <span dangerouslySetInnerHTML={{ __html: highlighted }} />
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic">
                        No lowercase in heading. Rawr
                      </p>
                    )}
                  </Accordion>

                  <Accordion
                    header={
                      <div className="flex justify-between items-center w-full text-sm">
                        <span>Leading/Trailing Spaces</span>
                        {showResults &&
                          (formatErrors.leadingTrailingSpaceErrors.length > 0 ? (
                            <div className="bg-[#f5ecee] w-[40px] text-right rounded-2xl px-2">
                              <span className="text-red-100">
                                {formatErrors.leadingTrailingSpaceErrors.length}
                              </span>
                            </div>
                          ) : (
                            <div className="bg-[#e5f5ea] w-[40px] text-right rounded-2xl px-2">
                              <span className="text-green-100">0</span>
                            </div>
                          ))}
                      </div>
                    }
                    className="mb-2 text-sm dark:!text-black-200">
                    {renderErrorList(
                      formatErrors.leadingTrailingSpaceErrors,
                      /^\s+|\s+$/g,
                      'leadingTrailingSpaceErrors'
                    )}
                  </Accordion>

                  <Accordion
                    header={
                      <div className="flex justify-between items-center w-full text-sm">
                        <span>Space before Punctuation</span>
                        {showResults &&
                          (formatErrors.spaceBeforePunctuationErrors.length > 0 ? (
                            <div className="bg-[#f5ecee] w-[40px] text-right rounded-2xl px-2">
                              <span className="text-red-100">
                                {formatErrors.spaceBeforePunctuationErrors.length}
                              </span>
                            </div>
                          ) : (
                            <div className="bg-[#e5f5ea] w-[40px] text-right rounded-2xl px-2">
                              <span className="text-green-100">0</span>
                            </div>
                          ))}
                      </div>
                    }
                    className="mb-2 text-sm dark:!text-black-200">
                    {renderErrorList(
                      formatErrors.spaceBeforePunctuationErrors,
                      /\s+([.,!?;:])/g,
                      'spaceBeforePunctuationErrors'
                    )}
                  </Accordion>

                  <Accordion
                    header={
                      <div className="flex justify-between items-center w-full text-sm">
                        <span>Missing Punctuation</span>
                        {showResults &&
                          (formatErrors.missingPunctuationErrors.length > 0 ? (
                            <div className="bg-[#f5ecee] w-[40px] text-right rounded-2xl px-2">
                              <span className="text-red-100">
                                {formatErrors.missingPunctuationErrors.length}
                              </span>
                            </div>
                          ) : (
                            <div className="bg-[#e5f5ea] w-[40px] text-right rounded-2xl px-2">
                              <span className="text-green-100">0</span>
                            </div>
                          ))}
                      </div>
                    }
                    className="mb-2 text-sm dark:!text-black-200">
                    {renderErrorList(
                      formatErrors.missingPunctuationErrors,
                      /[^.?!]$/g,
                      'missingPunctuationErrors'
                    )}
                  </Accordion>
                </>
              )}
            </TabPanel>

            <TabPanel id="Content">
              <Button
                disabled={!text || disableContentIssuesButton}
                onClick={checkContentIssues}
                className="w-full !bg-[#2563ea] hover:!bg-blue-1000 text-white border-0 hover:shadow-none rounded-none dark:hover:shadow-none dark:!text-white">
                Check For Content Issues
              </Button>
              <div className="flex mt-5 gap-2 mb-1">
                <Button
                  disabled={!text || !contentIssuesResult || editMode}
                  onClick={onHighlightContent}
                  className="w-1/2 text-sm !bg-white text-black !border-black-200 border rounded-none hover:shadow-none hover:!bg-black-200 hover:text-white dark:hover:shadow-none dark:!text-black-200 dark:hover:!text-white">
                  Show Highlights
                </Button>
                <Button
                  disabled={!text || !contentIssuesResult || editMode}
                  onClick={onRemoveContentHighlight}
                  className="w-1/2 text-sm !bg-[#EF4444] border-[#EF4444]  text-white border hover:!bg-red-700 hover:!border-red-700 rounded-none hover:shadow-none dark:hover:shadow-none dark:!text-white">
                  Remove Highlights
                </Button>
              </div>

              {contentIssuesResult && (
                <ContentIssuesResultSection
                  result={contentIssuesResult}
                  errorMessage={contentIssuesErrorMessage}
                />
              )}
            </TabPanel>

            <TabPanel id="Link">
              <Button
                onClick={handleAnalyzeLink}
                className="w-full !bg-[#2563ea] hover:!bg-blue-1000 text-white border-0 hover:shadow-none rounded-none dark:hover:shadow-none dark:!text-white">
                Analyze Links
              </Button>
              <div className="flex mt-5 gap-2 mb-1">
                <Button className="w-1/2 text-sm !bg-white text-black !border-black-200 border rounded-none hover:shadow-none hover:!bg-black-200 hover:text-white dark:hover:shadow-none dark:!text-black-200 dark:hover:!text-white">
                  Show Highlights
                </Button>
                <Button className="w-1/2 text-sm !bg-[#EF4444] border-[#EF4444]  text-white border hover:!bg-red-700 hover:!border-red-700 rounded-none hover:shadow-none dark:hover:shadow-none dark:!text-white">
                  Remove Highlights
                </Button>
              </div>

              {hasLinkChecked && (
                <>
                  <div
                    className={`my-4 text-sm font-medium py-4 text-center ${totalLinkErrors === 0 ? '!bg-[#e6f6e9] !text-green-100' : 'bg-[#faeaea] text-red-600'}`}>
                    {linkErrorMessage}
                  </div>

                  {linkErrors && (
                    <div>
                      <Accordion
                        className="mt-2"
                        header={
                          <div className="flex items-center justify-between w-full text-sm">
                            <span>Link & Anchor Text Issues</span>
                            {linkShowResults && (
                              <div
                                className={`w-[40px] text-right rounded-2xl px-2 ${
                                  totalLinkAndAnchorIssues > 0
                                    ? 'bg-[#f5ecee] text-red-100'
                                    : 'bg-[#e5f5ea] !text-green-100'
                                }`}>
                                {totalLinkAndAnchorIssues}
                              </div>
                            )}
                          </div>
                        }>
                        {(() => {
                          const requiredLinks = [
                            {
                              url: 'https://arashlaw.com/practice-areas/car-accident-lawyers/',
                              label: 'Car Accident PA',
                            },
                          ];

                          const allLinkURLs = linkErrors
                            ? [
                                ...(linkErrors.internalLinks || []),
                                ...(linkErrors.externalLinks || []),
                              ].map(link => (typeof link === 'string' ? link : link.url))
                            : [];

                          const missingCriticalLinks = requiredLinks.filter(
                            req => !allLinkURLs.includes(req.url)
                          );

                          return (
                            <>
                              {missingCriticalLinks.length > 0 && (
                                <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded p-3 text-sm">
                                  <strong className="block mb-1">⚠️ ALERT:</strong>
                                  <ul className="list-disc list-inside space-y-1">
                                    {missingCriticalLinks.map((item, i) => (
                                      <li key={`missing-${i}`}>
                                        No link to <strong>{item.label}</strong>. Please
                                        add:{' '}
                                        <a
                                          href={item.url}
                                          className="!text-blue-800 underline hover:!text-blue-300"
                                          target="_blank"
                                          rel="noopener noreferrer">
                                          {item.url}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          );
                        })()}

                        <ul className="text-left list-none list-inside space-y-3 text-sm">
                          {linkErrors &&
                            Object.entries(linkErrors).map(([key, value]) => {
                              const isErrorType = [
                                'invalidLinks',
                                'missingTrailingSlash',
                                'duplicateLinks',
                                'brokenLinks',
                                'identicalAnchors',
                                'invalidAnchors',
                              ].includes(key);

                              if (!isErrorType || !Array.isArray(value)) return null;

                              // Group errors by location
                              const groupedByLocation = (value as LinkDetail[]).reduce(
                                (acc, link) => {
                                  const loc = link.location || 'Unknown Section';
                                  if (!acc[loc]) acc[loc] = [];
                                  acc[loc].push(link);
                                  return acc;
                                },
                                {} as Record<string, LinkDetail[]>
                              );

                              return (
                                <li key={key}>
                                  <strong>
                                    {formatErrorLabel(key)} ({value.length}):
                                  </strong>
                                  {value.length === 0 ? (
                                    <div className="text-gray-500 italic">
                                      No issues found for this type.
                                    </div>
                                  ) : (
                                    <ul className="mt-1 space-y-3 pl-5">
                                      {Object.entries(groupedByLocation).map(
                                        ([location, links]) => (
                                          <li key={location}>
                                            <ul className="list-disc list-inside space-y-1">
                                              {links.map((link, i) => (
                                                <li
                                                  key={`${key}-${location}-${i}`}
                                                  className="text-blue-400 no-underline hover:text-blue-950 break-words whitespace-pre-wrap text-left w-full cursor-pointer flex flex-col">
                                                  <span
                                                    onClick={() => scrollToLink(link.url)}
                                                    className="before:content-['•'] before:mr-2 before:text-black hover:before:text-white font-bold !text-black-100 mr-1 !no-underline cursor-pointer hover:bg-green-100 hover:!text-white p-2 list-disc">
                                                    {link.anchor || '(no anchor)'}
                                                  </span>
                                                  <span>— {link.url}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  )}
                                </li>
                              );
                            })}
                        </ul>
                      </Accordion>

                      <Accordion
                        className="mt-2"
                        header={
                          <div className="flex items-center justify-between w-full text-sm">
                            <span>Internal Links</span>
                            {linkShowResults && (
                              <div
                                className={`w-[40px] text-right rounded-2xl px-2 ${
                                  (linkErrors?.internalLinks?.length || 0) > 0
                                    ? 'bg-[#e5f5ea]'
                                    : 'bg-[#e5f5ea]'
                                }`}>
                                {linkErrors?.internalLinks?.length || 0}
                              </div>
                            )}
                          </div>
                        }>
                        <ul className="!text-left list-none list-inside space-y-2 text-sm">
                          {Array.isArray(linkErrors?.internalLinks) &&
                            linkErrors.internalLinks
                              .filter(l => typeof l !== 'string')
                              .reduce(
                                (grouped: Record<string, LinkDetail[]>, link: any) => {
                                  const location = link.location || '';
                                  if (!grouped[location]) grouped[location] = [];
                                  grouped[location].push(link);
                                  return grouped;
                                },
                                {} as Record<string, LinkDetail[]>
                              ) &&
                            Object.entries(
                              linkErrors.internalLinks
                                .filter(l => typeof l !== 'string')
                                .reduce(
                                  (grouped: Record<string, LinkDetail[]>, link: any) => {
                                    const location = link.location || 'Unknown Section';
                                    if (!grouped[location]) grouped[location] = [];
                                    grouped[location].push(link);
                                    return grouped;
                                  },
                                  {} as Record<string, LinkDetail[]>
                                )
                            ).map(([location, links]) => (
                              <li key={location}>
                                <ul className="!list-disc list-inside space-y-1">
                                  {links.map((link, i) => (
                                    <li
                                      key={`${location}-${i}`}
                                      className="text-blue-400 no-underline hover:text-blue-950 break-words whitespace-pre-wrap text-left w-full cursor-pointer flex flex-col">
                                      <span
                                        onClick={() => scrollToLink(link.url)}
                                        className="before:content-['•'] before:mr-2 before:text-black hover:before:text-white font-bold !text-black-100 mr-1 !no-underline cursor-pointer hover:bg-green-100 hover:!text-white p-2">
                                        {link.anchor || '(no anchor)'}
                                      </span>
                                      <span>— {link.url}</span>
                                    </li>
                                  ))}
                                </ul>
                              </li>
                            ))}
                        </ul>
                      </Accordion>

                      <Accordion
                        className="mt-2"
                        header={
                          <div className="flex items-center justify-between w-full text-sm">
                            <span>External Links</span>
                            {linkShowResults && (
                              <div
                                className={`w-[40px] text-right rounded-2xl px-2 ${
                                  (linkErrors?.externalLinks?.length || 0) > 0
                                    ? 'bg-[#e5f5ea]'
                                    : 'bg-[#e5f5ea]'
                                }`}>
                                {linkErrors?.externalLinks?.length || 0}
                              </div>
                            )}
                          </div>
                        }>
                        <ul className="!text-left list-none list-inside space-y-2 text-sm">
                          {Array.isArray(linkErrors?.externalLinks) &&
                            linkErrors.externalLinks
                              .filter(l => typeof l !== 'string')
                              .reduce(
                                (grouped: Record<string, LinkDetail[]>, link: any) => {
                                  const location = link.location || 'Unknown Section';
                                  if (!grouped[location]) grouped[location] = [];
                                  grouped[location].push(link);
                                  return grouped;
                                },
                                {} as Record<string, LinkDetail[]>
                              ) &&
                            Object.entries(
                              linkErrors.externalLinks
                                .filter(l => typeof l !== 'string')
                                .reduce(
                                  (grouped: Record<string, LinkDetail[]>, link: any) => {
                                    const location = link.location || 'Unknown Section';
                                    if (!grouped[location]) grouped[location] = [];
                                    grouped[location].push(link);
                                    return grouped;
                                  },
                                  {} as Record<string, LinkDetail[]>
                                )
                            ).map(([location, links]) => (
                              <li key={location}>
                                <ul className="!list-disc list-inside space-y-1">
                                  {links.map((link, i) => (
                                    <li
                                      key={`${location}-external-${i}`}
                                      className="text-blue-400 no-underline hover:text-blue-950 break-words whitespace-pre-wrap text-left w-full cursor-pointer flex flex-col">
                                      <span
                                        onClick={() => scrollToLink(link.url)}
                                        className="before:content-['•'] before:mr-2 before:text-black hover:before:text-white font-bold !text-black-100 mr-1 !no-underline cursor-pointer hover:bg-green-100 hover:!text-white p-2">
                                        {link.anchor || '(no anchor)'}
                                      </span>
                                      <span>— {link.url}</span>
                                    </li>
                                  ))}
                                </ul>
                              </li>
                            ))}
                        </ul>
                      </Accordion>
                    </div>
                  )}
                </>
              )}
            </TabPanel>

            <TabPanel id="Keyword" className="flex-1">
              <Button
                disabled={!keyword || !text}
                onClick={handleAnalyzeKeyword}
                className="w-full !bg-[#2563ea] hover:!bg-blue-1000 text-white border-0 hover:shadow-none rounded-none dark:hover:shadow-none dark:!text-white">
                Analyze Keywords
              </Button>
              <div className="flex mt-5 gap-2 mb-1">
                <Button
                  disabled={!keywordAnalysisResult || editMode}
                  className="w-1/2 text-sm  !bg-white  text-black !border-black-200 border rounded-none hover:shadow-none hover:!bg-black-200 hover:text-white dark:hover:shadow-none dark:!text-black-200 dark:hover:!text-white"
                  onClick={onShowHighlightClick}>
                  Show Highlights
                </Button>
                <Button
                  disabled={!keywordAnalysisResult || editMode}
                  className="w-1/2 text-sm !bg-[#EF4444] border-[#EF4444]  text-white border hover:!bg-red-700 hover:!border-red-700 rounded-none hover:shadow-none dark:hover:shadow-none dark:!text-white"
                  onClick={onKeywordRemoveHighlightClick}>
                  Remove Highlights
                </Button>
              </div>

              {hasKeywordChecked && (
                <div>
                  {error && <Alert message={error || linkErrorMessage} type="error" />}
                  {renderKeywordAlert()}
                  {keywordAnalysisResult && !error && (
                    <div className="">
                      <KeywordResultSection result={keywordAnalysisResult} />
                    </div>
                  )}
                </div>
              )}
            </TabPanel>
          </Tabs>
        )}
      </section>
    </div>
  );
};
