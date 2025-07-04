/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useState, useEffect, useContext, useCallback } from 'react';
import clsx from 'clsx';
import { AnalysisWorkerWrapper, Paper } from 'yoastseo';
import { Modal } from '../Modal.js';
import supabase from '../../utils/supabaseInit.js';
import { UserContext } from '../../context/UserContext.js';

import { Accordion } from '../Accordion.js';
import { Summary } from '../Summary.js';

import { Tabs, TabList, Tab, TabPanel } from 'react-aria-components';
import YoastWorker from '../../utils/yoastWorker.ts?worker&inline';
import YoastIcon from '../../assets/icons/yoast.svg?react';
import {
  GoAlert,
  GoChecklist,
  GoLaw,
  GoLink,
  GoSearch,
  GoEye,
  GoDotFill,
} from 'react-icons/go';
import { FiEyeOff } from 'react-icons/fi';

import { FaCheckCircle, FaTimesCircle, FaTrash, FaBars } from 'react-icons/fa';
import {
  AssessmentResult,
  ContentIssueReport,
  CustomSearchResult,
  ErrorList,
  FormatError,
  KeywordAnalysisResult,
} from '../../types/loom.js';
// import { VIOLATION_PHRASES } from './contants.js';
import { formatList } from './helpers.js';

import KeywordResultSection from './KeywordResultSection.js';
import { Button, Alert } from '../common';
import ContentIssuesResultSection from './ContentIssuesResultSection.js';
import LinkIssuesResultSection from './LinkIssuesResultSection.js';
import { LinkAnalysisResult } from '../../utils/analyzeLinksWorker.js';
import { groupIssuesByType } from '../../utils/analyzeLinksWorker';
import '../../assets/css/Loom.css';

// import { Paper, AnalysisWorkerWrapper } from 'yoastseo';
// import type { AssessmentResult } from 'yoastseo';
// import EnglishResearcher from 'yoastseo/build/languageProcessing/languages/en/Researcher';

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
  onLinkIssues: () => void;
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
  linkIssuesResult: LinkAnalysisResult | null;
  onLinkIssuesShowHighlightsClick: () => void;
  loadingAnalyzeLink: boolean;
  onLinkIssuesRemoveHighlightClick: () => void;
}

interface DictionaryEntry {
  id: number;
  keyword: string;
  created_by: string;
  deleted_at?: string | null;
  created_at?: string;
  created?: string | null;

  // add other fields if needed
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
  linkIssuesResult,
  onLinkIssuesShowHighlightsClick,
  onLinkIssuesRemoveHighlightClick,
  loadingAnalyzeLink,
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
  // const [violations, setViolations] = useState<string[]>([]);
  // const [violationResults, setViolationResults] = useState<
  //   Record<string, { heading: string; id: string }[]>
  // >({});
  const [violationCheckMessage, setViolationCheckMessage] = useState<{
    type: 'success' | 'error' | null;
    text: string;
  } | null>(null);
  const [highlightActive, setHighlightActive] = useState(false);
  // const [hasCheckedViolations, setHasCheckedViolations] = useState(false);
  const [customSearchTerm, setCustomSearchTerm] = useState('');
  const [customSearchResults, setCustomSearchResults] = useState<CustomSearchResult[]>(
    []
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeHighlights, setActiveHighlights] = useState<string[]>([]);

  const [dictionary, setDictionary] = useState<
    {
      id: number;
      keyword: string;
      created_by: string;
      deleted_at?: string | null;
      created_at?: string;
      created?: string | null;
    }[]
  >([]);

  const [newPhrase, setNewPhrase] = useState('');
  const [addStatus, setAddStatus] = useState<null | 'success' | 'exists' | 'error'>(null);
  const [dictionaryViolations, setDictionaryViolations] = useState<string[]>([]);
  const [dictionaryViolationResults, setDictionaryViolationResults] = useState<
    Record<string, { heading: string; id: string }[]>
  >({});
  const [showResults, setShowResults] = useState(false);

  const [didFixAll, setDidFixAll] = useState(false);
  const [formatHighlightActive, setFormatHighlightActive] = useState(false);

  const [hasLinkChecked, setHasLinkChecked] = useState(false);

  const [hasKeywordChecked, setHasKeywordChecked] = useState(false);

  const [linkHighlightsActive, setLinkHighlightsActive] = useState(false);
  const [contentHighlightsActive, setContentHighlightsActive] = useState(false);
  const [keywordHighlightsActive, setKeywordHighlightsActive] = useState(false);

  // const uniqueViolationHeadings = prepareHeadingsForAccordion(violationResults);
  const uniqueDictionaryHeadings = prepareHeadingsForAccordion(
    dictionaryViolationResults
  );
  const [activeView, setActiveView] = useState('default'); // 'default' or 'trash' SB37 VIEW MODAL

  const rowsPerPage = 6;

  const [currentPage, setCurrentPage] = useState(1); // for active list
  const [currentPageDeleted, setCurrentPageDeleted] = useState(1); // for deleted list

  // Filter and sort active entries (latest added first)
  const filteredDictionary = dictionary
    .filter(entry => entry.deleted_at === null)
    .sort(
      (a, b) =>
        new Date(b.created_at as string).getTime() -
        new Date(a.created_at as string).getTime()
    );

  const totalPages = Math.ceil(filteredDictionary.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredDictionary.slice(startIndex, startIndex + rowsPerPage);

  const [archivedDictionary, setArchivedDictionary] = useState<DictionaryEntry[]>([]);

  useEffect(() => {
    const deleted = dictionary
      .filter(entry => entry.deleted_at !== null)
      .sort(
        (a, b) => new Date(b.deleted_at!).getTime() - new Date(a.deleted_at!).getTime()
      );
    setArchivedDictionary(deleted);
  }, [dictionary]);

  const totalPagesForDeleted = Math.ceil(archivedDictionary.length / rowsPerPage);
  const startIndexDeleted = (currentPageDeleted - 1) * rowsPerPage;
  const deletedEntries = archivedDictionary.slice(
    startIndexDeleted,
    startIndexDeleted + rowsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [filteredDictionary, totalPages]);

  useEffect(() => {
    if (currentPageDeleted > totalPagesForDeleted) {
      setCurrentPageDeleted(totalPagesForDeleted || 1);
    }
  }, [archivedDictionary, totalPagesForDeleted]);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

  const hasErrors = Object.values(formatErrors).some(arr => arr.length > 0);

  ////////////////////////////////////////////////////////
  ////////////////YOAST  TOOL/////////////////////////////
  ////////////////////////////////////////////////////////
  const yoastSEOAnalyze = () => {
    const newWorker = new AnalysisWorkerWrapper(new YoastWorker());

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

  // const checkForStaticViolations = () => {
  //   const allMatches: string[] = [];
  //   const lowerText = text.toLowerCase();

  //   for (const phrase of VIOLATION_PHRASES) {
  //     const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  //     const regex = new RegExp(`\\b${escapedPhrase}\\b`, 'gi');
  //     const matches = lowerText.match(regex);

  //     if (matches) {
  //       for (let i = 0; i < matches.length; i++) {
  //         allMatches.push(phrase);
  //       }
  //     }
  //   }

  //   setViolations(allMatches);
  //   setHighlightActive(true);
  //   setHasCheckedViolations(true);

  //   const uniquePhrases = [...new Set(allMatches)];
  //   const mappedResults = mapViolationsToHeadings(text, uniquePhrases);
  //   setViolationResults(mappedResults);

  //   return allMatches;
  // };

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();

        const id = target.getAttribute('href')!.substring(1);
        const el = document.getElementById(id);

        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });

          el.classList.remove('anchor-highlight-fade'); // Reset if still fading
          el.classList.add('anchor-highlight-pulse');

          // Start fading out after delay
          setTimeout(() => {
            el.classList.remove('anchor-highlight-pulse');
            el.classList.add('anchor-highlight-fade');

            // Fully remove after fade completes
            setTimeout(() => {
              el.classList.remove('anchor-highlight-fade');
            }, 1000); // match fade duration
          }, 2500); // how long highlight stays
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  const checkForDictionaryViolations = () => {
    const allMatches: string[] = [];

    for (const item of dictionary) {
      const phrase = item.keyword;
      const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedPhrase}\\b`, 'gi');
      const matches = text.match(regex);

      if (matches) {
        for (const match of matches) {
          allMatches.push(match); // preserve original casing
        }
      }
    }

    setDictionaryViolations(allMatches);
    setHighlightActive(true);

    const uniquePhrases = [...new Set(allMatches.map(m => m.toLowerCase()))];
    const mappedResults = mapViolationsToHeadings(text, uniquePhrases);
    setDictionaryViolationResults(mappedResults);

    return allMatches;
  };

  // Helper to flatten, sort and dedupe headings by their 'id' or 'heading'
  function prepareHeadingsForAccordion(violationResults: Record<string, any[]>) {
    const allHeadings = Object.values(violationResults).flat();

    allHeadings.sort((a, b) => {
      if ('position' in a && 'position' in b) {
        return a.position - b.position;
      }
      return a.heading?.localeCompare(b.heading ?? '') ?? 0;
    });

    const seen = new Set();
    const uniqueHeadings = [];

    for (const h of allHeadings) {
      const key = h.heading || h.id || JSON.stringify(h); // Ensure a key is always defined
      if (!seen.has(key)) {
        seen.add(key);
        uniqueHeadings.push(h);
      }
    }

    return uniqueHeadings;
  }

  const checkForViolations = () => {
    const dictionaryMatches = checkForDictionaryViolations();
    const totalMatches = dictionaryMatches.length;

    if (totalMatches === 0) {
      setViolationCheckMessage({
        type: 'success',
        text: '🎉 No potential violations found! Good job',
      });
    } else {
      setViolationCheckMessage({
        type: 'error',
        text: '⚠️ Potential violations found. Please review carefully',
      });
    }
  };

  useEffect(() => {
    const fetchDictionary = async () => {
      const { data, error } = await supabase
        .from('loom_dictionary')
        .select('id, keyword, created_by')
        .is('deleted_at', null); // ✅ Only fetch active keywords

      if (!error && data) {
        setDictionary(data);
      } else {
        console.error('Failed to load dictionary', error);
      }
    };

    fetchDictionary();
  }, []);

  const getVisiblePages = (
    currentPage: number,
    totalPages: number,
    maxVisible: number = 5
  ) => {
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = startPage + maxVisible - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

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
      .select('id, keyword, created_by, deleted_at');

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
    const { error } = await supabase
      .from('loom_dictionary')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Failed to delete phrase:', error.message);
    } else {
      setDictionary(prev =>
        prev.map(entry =>
          entry.id === id ? { ...entry, deleted_at: new Date().toISOString() } : entry
        )
      );
      setStatusMessage('Phrase successfully archived.');
    }
  };
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [currentPage, totalPages]);

  const handlePermanentDelete = async (id: number) => {
    const { error } = await supabase.from('loom_dictionary').delete().eq('id', id);

    if (error) {
      console.error('Failed to permanently delete:', error);
      alert('Failed to delete entry. Please try again.');
    } else {
      setArchivedDictionary(prev => prev.filter(item => item.id !== id));
      setStatusMessage('Phrase permanently deleted.');

      if (deletedEntries.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 5000); // 5000ms = 5 seconds

      return () => clearTimeout(timer); // cleanup
    }
  }, [statusMessage]);

  useEffect(() => {
    const now = new Date();

    archivedDictionary.forEach(entry => {
      const deletedAt = new Date(entry.deleted_at as string);
      const diffDays = (now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays > 30) {
        handlePermanentDelete(entry.id);
      }
    });
  }, [archivedDictionary]);

  // MINUTE TEST
  //   useEffect(() => {
  //   const now = new Date();

  //   archivedDictionary.forEach(entry => {
  //     if (!entry.deleted_at) return;

  //     const deletedAt = new Date(entry.deleted_at);
  //     const diffMinutes = (now.getTime() - deletedAt.getTime()) / (1000 * 60);

  //     if (diffMinutes > 1) {
  //       handlePermanentDelete(entry.id);
  //     }
  //   });
  // }, [archivedDictionary]);

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
  const runFormatCheck = useCallback(() => {
    const worker = new Worker(new URL('../../utils/formatErrors.ts', import.meta.url), {
      type: 'module',
    });

    const parser = new DOMParser();
    const preprocessed = text.replace(/<br\s*\/?>/gi, '\n');
    const doc = parser.parseFromString(preprocessed, 'text/html');

    let headingIndex = 0;

    const paragraphs = Array.from(
      doc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6')
    ).map(el => {
      const htmlEl = el as HTMLElement;
      const tag = htmlEl.tagName.toUpperCase();

      let headingId: string | null = null;
      if (tag.startsWith('H')) {
        headingId = htmlEl.id || `heading-${headingIndex++}`;
        htmlEl.id = headingId; // Ensure ID exists
      }

      return {
        text: htmlEl.innerText || '',
        heading: tag.startsWith('H') ? tag : null,
        id: headingId,
      };
    });

    worker.onmessage = e => {
      setFormatErrors(e.data);
      worker.terminate();
    };

    worker.postMessage(paragraphs);
  }, [text]);

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
                      className="font-bold cursor-pointer hover:text-blue-500 text-sm"
                      onClick={() => {
                        handleHeaderClick(type);
                        if (err.heading) scrollToHeading(err.heading);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleHeaderClick(type);
                          if (err.heading) scrollToHeading(err.heading);
                        }
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

    const isHeading = (tag: string) => /^H[1-6]$/.test(tag.toUpperCase());

    function normalizeTextContent(text: string) {
      return text
        .replace(/\u00A0/g, ' ') // non-breaking space to normal
        .replace(/ {2,}/g, ' ') // multiple spaces to one
        .replace(/\s*—\s*/g, ' — ') // spacing around em dash
        .replace(/ ([.,;:!?])/g, '$1'); // no space before punctuation
    }

    function fixTextNodes(element: HTMLElement | Node) {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

      const textNodes: Text[] = [];
      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        if (node.nodeValue) {
          textNodes.push(node);
        }
      }

      textNodes.forEach((node, index) => {
        let value = node.nodeValue ?? '';

        value = normalizeTextContent(value);

        if (
          index > 0 &&
          textNodes[index - 1].nodeValue?.endsWith(' ') &&
          value.startsWith(' ')
        ) {
          value = value.replace(/^ /, '');
        }

        node.nodeValue = value;
      });

      for (const node of textNodes) {
        if (node.nodeValue && node.nodeValue.trim().length > 0) {
          node.nodeValue = node.nodeValue.replace(/^ +/, '');
          break;
        }
      }

      for (let i = textNodes.length - 1; i >= 0; i--) {
        const node = textNodes[i];
        if (node.nodeValue && node.nodeValue.trim().length > 0) {
          node.nodeValue = node.nodeValue.replace(/ +$/, '');
          break;
        }
      }
    }

    const blocks = Array.from(doc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6'));

    blocks.forEach(el => {
      fixTextNodes(el);

      if (isHeading(el.tagName)) {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
        while (walker.nextNode()) {
          const node = walker.currentNode as Text;
          if (node.nodeValue) {
            node.nodeValue = toTitleCase(node.nodeValue);
          }
        }
      }
    });

    const updatedHtml = doc.body.innerHTML;
    onFixAll(updatedHtml);

    const formatParagraphs = blocks.map(el => {
      const rawText = (el as HTMLElement).innerText;

      const normalizedText = rawText
        .replace(/\u00A0/g, ' ')
        .replace(/ {2,}/g, ' ')
        .replace(/\s*—\s*/g, ' — ')
        .replace(/ ([.,;:!?])/g, '$1')
        .trim(); // This trim is fine for analysis, not DOM

      return {
        text: normalizedText,
        heading: isHeading(el.tagName) ? el.tagName.toUpperCase() : null,
      };
    });

    const worker = new Worker(new URL('../../utils/formatErrors.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = e => {
      setFormatErrors(e.data);
      worker.terminate();
    };

    worker.postMessage(formatParagraphs);
  };

  useEffect(() => {
    if (didFixAll) {
      runFormatCheck();
      setDidFixAll(false);
    }
  }, [didFixAll, text, runFormatCheck]);

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
    onLinkIssues();
    setHasLinkChecked(true);
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
    if (!error) return <Alert message="Click 'Analyze Keywords' again" type="info" />;
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
  };

  return (
    <div className="w-[350px] min-h-[500px]">
      <Button
        onClick={() => {
          runAllChecks();
          setShowSummary('summary');
          setHasRunChecks(true);
        }}
        className="w-full mb-4">
        Run All Checks
      </Button>
      <section
        className={clsx(
          'border border-black/17.5 rounded-md pb-4 px-4 bg-white',
          'flex flex-1 flex-col'
        )}>
        {/* <Button className="self-center">Export Full Report</Button> */}{' '}
        {/*TO BE ADDED*/}
        <div className={clsx('justify-between flex', 'mx-[-16px] mb-4')}>
          <a
            onClick={() => setShowSummary('summary')}
            className={`w-full text-center cursor-pointer font-bold p-2 ${
              showSummary === 'summary'
                ? ''
                : 'border border-y-black/17.5 border-r-black/17.5 border-l-0 hover:bg-black-200 hover:text-white bg-[#e4e4eb]'
            }`}>
            Summary
          </a>

          <a
            onClick={() => setShowSummary('tools')}
            className={`w-full text-center cursor-pointer font-bold p-2 ${
              showSummary === 'tools'
                ? ''
                : 'border border-y-black/17.5 border-l-black/17.5 border-r-0 hover:bg-black-200 hover:text-white bg-[#e4e4eb]'
            }`}>
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
              internalLinksCount={linkIssuesResult?.internalLinks?.length || 0}
              externalLinksCount={linkIssuesResult?.externalLinks?.length || 0}
            />
            {/* <div className="w-full border border-b-black-200"></div> */}
            {(contentIssuesResult?.totalWordCount ?? 0) > 0 && (
              <ul>
                {/* YOAST */}
                <li className="border border-black/20 p-2 rounded-md">
                  <div className="flex justify-between">
                    <span className="font-bold">Yoast SEO</span>
                    <FiEyeOff className="text-gray-200" />
                  </div>
                  <ul className="text-sm">
                    <li>
                      <h6 className="font-bold text-xs mt-2">YOAST SEO ANALYSIS</h6>
                      <ul>
                        <li className="flex justify-between">
                          <span className="flex justify-between item-center gap-2">
                            <GoDotFill className="text-red-500 mt-0.5" />
                            <span>Problems</span>
                          </span>
                          <span>{seoProblems.length}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="flex justify-between item-center gap-2">
                            <GoDotFill className="text-green-500 mt-0.5" />
                            <span>Good Results</span>
                          </span>
                          <span>{seoAchievements.length}</span>
                        </li>
                      </ul>
                    </li>
                    <li className="mt-2">
                      <h6 className="font-bold text-xs mt-2 ">
                        YOAST READABILITY ANALYSIS
                      </h6>
                      <ul>
                        <li className="flex justify-between">
                          <span className="flex justify-between item-center gap-2">
                            <GoDotFill className="text-red-500 mt-0.5" />
                            <span>Problems</span>
                          </span>
                          <span>{readabilityProblems.length}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="flex justify-between item-center gap-2">
                            <GoDotFill className="text-green-500 mt-0.5" />
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
                            new Set([
                              ...activeHighlights,
                              // ...violations,
                              ...dictionaryViolations,
                            ])
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
                          // violations.length === 0 &&
                          dictionaryViolations.length === 0
                            ? 'text-yellow-200 mt-1'
                            : 'text-yellow-200 mt-1'
                        }
                      />
                      <span>
                        {/* {violations.length === 0 && dictionaryViolations.length === 0 */}
                        {dictionaryViolations.length === 0
                          ? 'No potential SB37 violations found.'
                          : `Potential SB37 violations found in ${
                              // Object.keys(violationResults).length +
                              Object.keys(dictionaryViolationResults).length
                            } section(s).`}
                      </span>
                    </li>
                  </ul>
                </li>

                {/* FORMATTING */}
                <li className="border border-black/20 p-2 mt-2 rounded-md">
                  <div className="flex justify-between">
                    <span className="font-bold">FORMATTING</span>
                    {formatHighlightActive ? (
                      <GoEye
                        title="Remove Highlights"
                        className="text-gray-500 cursor-pointer"
                        onClick={() => {
                          onRemoveFormatHighlight();
                          setFormatHighlightActive(false);
                        }}
                      />
                    ) : (
                      <FiEyeOff
                        title="Show Highlights"
                        className="text-gray-500 cursor-pointer"
                        onClick={() => {
                          handleHighlightFormatErrors();
                          setFormatHighlightActive(true);
                        }}
                      />
                    )}
                  </div>
                  <ul className="text-sm">
                    {[
                      {
                        label: 'Multiple spaces',
                        count: formatErrors.multipleSpaceErrors.length,
                      },
                      {
                        label: 'Em dash issues',
                        count: formatErrors.emDashErrors.length,
                      },
                      {
                        label: 'Lowercase in headings',
                        count: formatErrors.titleCaseErrors.length,
                      },
                      {
                        label: 'Leading/trailing spaces',
                        count: formatErrors.leadingTrailingSpaceErrors.length,
                      },
                      {
                        label: 'Space before punctuation',
                        count: formatErrors.spaceBeforePunctuationErrors.length,
                      },
                      {
                        label: 'Missing punctuation',
                        count: formatErrors.missingPunctuationErrors.length,
                      },
                    ].map(({ label, count }, idx) => (
                      <li key={idx} className="flex justify-between mt-2">
                        <div className="flex items-center gap-2">
                          {contentIssuesResult && (
                            <GoDotFill
                              className={count > 0 ? 'text-red-500' : 'text-green-500'}
                            />
                          )}
                          <span>
                            {count > 0 ? `${label} found` : `No ${label.toLowerCase()}`}
                          </span>
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
                          (!text || !contentIssuesResult || editMode) &&
                            'opacity-50 cursor-not-allowed',
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
                          (!text || !contentIssuesResult || editMode) &&
                            'opacity-50 cursor-not-allowed'
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
                    {linkHighlightsActive ? (
                      <FiEyeOff
                        onClick={() => {
                          if (!text || !linkIssuesResult || editMode) return;
                          onLinkIssuesShowHighlightsClick();
                          setLinkHighlightsActive(false);
                        }}
                        title="Show Highlights"
                        className={clsx(
                          'text-gray-500 cursor-pointer transition-colors',
                          (!text || !linkIssuesResult || editMode) &&
                            'opacity-50 cursor-not-allowed',
                          'text-blue-500' // highlight when active
                        )}
                      />
                    ) : (
                      <GoEye
                        onClick={() => {
                          if (!text || !linkIssuesResult || editMode) return;
                          onLinkIssuesRemoveHighlightClick();
                          setLinkHighlightsActive(true);
                        }}
                        title="Remove Highlights"
                        className={clsx(
                          'text-gray-500 cursor-pointer transition-colors',
                          (!text || !linkIssuesResult || editMode) &&
                            'opacity-50 cursor-not-allowed'
                        )}
                      />
                    )}
                  </div>
                  {linkIssuesResult && (
                    <ul className="text-sm mt-2">
                      {Object.entries(
                        groupIssuesByType(linkIssuesResult.issues || [])
                      ).map(([key, issues]) => {
                        const count = issues.length;
                        const hasIssues = count > 0;

                        return (
                          <li key={key} className="flex justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <GoDotFill
                                className={hasIssues ? 'text-red-500' : 'text-green-500'}
                              />
                              <span className="capitalize">{key}:</span>
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
                      <FiEyeOff
                        onClick={() => {
                          if (!text || !keywordAnalysisResult || editMode) return;
                          onShowHighlightClick();
                          setKeywordHighlightsActive(false);
                        }}
                        title="Show Highlights"
                        className={clsx(
                          'text-gray-500 cursor-pointer transition-colors',
                          (!text || !keywordAnalysisResult || editMode) &&
                            'opacity-50 cursor-not-allowed',
                          'text-blue-500'
                        )}
                      />
                    ) : (
                      <GoEye
                        onClick={() => {
                          if (!text || !keywordAnalysisResult || editMode) return;
                          onKeywordRemoveHighlightClick();
                          setKeywordHighlightsActive(true);
                        }}
                        title="Remove Highlights"
                        className={clsx(
                          'text-gray-500 cursor-pointer transition-colors',
                          (!text || !keywordAnalysisResult || editMode) &&
                            'opacity-50 cursor-not-allowed'
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
                                  ? 'text-[#0ff3f5]'
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
                                  ? 'text-[#00ff00]'
                                  : 'text-red-500'
                              }
                            />
                            <span>
                              {keywordAnalysisResult.keywordCounts.altCount > 0
                                ? 'Alt ESQ keyword found'
                                : 'Alt ESQ keyword missing'}
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

                        {/* H2/H3 Optimization */}
                        <li className="mt-4 flex">
                          <p className=" flex justify-between w-full">
                            <span className="flex items-center gap-2">
                              <GoDotFill
                                className={
                                  keywordAnalysisResult.headingAnalysis.percent <= 75
                                    ? 'text-green-500'
                                    : 'text-red-500'
                                }
                              />
                              <span className="">H2 & H3 Optimization: </span>
                            </span>
                            <span>{keywordAnalysisResult.headingAnalysis.percent}%</span>
                          </p>
                        </li>

                        {/* Section Optimization */}
                        <li className="mt-4 flex">
                          <p className=" flex justify-between w-full">
                            <span className="flex items-center gap-2">
                              <GoDotFill
                                className={
                                  keywordAnalysisResult.sectionAnalysis.percent === 100
                                    ? 'text-green-500'
                                    : 'text-red-500'
                                }
                              />
                              <span>Per Section Optimization: </span>
                            </span>
                            <span>{keywordAnalysisResult.sectionAnalysis.percent}%</span>
                          </p>
                        </li>

                        {/* Secondary Keywords */}
                        {keywordAnalysisResult.otherKeywords.some(
                          c => c.category === 'Secondary Keywords'
                        ) && (
                          <li className="mt-4">
                            <p className="font-semibold mb-1">Other Keywords</p>
                            {keywordAnalysisResult.otherKeywords
                              .filter(
                                category => category.category === 'Secondary Keywords'
                              )
                              .map(category => (
                                <div key={category.category} className="mb-2">
                                  <p className="underline">{category.category}</p>
                                  <ul className="ml-4">
                                    {category.keywords.map(kw => (
                                      <li
                                        key={kw.keyword}
                                        className="flex justify-between text-sm">
                                        <span>{kw.keyword}</span>
                                        <span
                                          className={
                                            kw.count > 0
                                              ? 'text-green-600'
                                              : 'text-red-600'
                                          }>
                                          {kw.count}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                          </li>
                        )}
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
                    disabled={
                      // violations.length === 0 && dictionaryViolations.length === 0
                      dictionaryViolations.length === 0
                    }
                    onClick={() => {
                      const updated = Array.from(
                        new Set([
                          ...activeHighlights,
                          // ...violations,
                          ...dictionaryViolations,
                        ])
                      );
                      setActiveHighlights(updated);
                      onHighlight(updated);
                      setHighlightActive(true);
                    }}>
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
                {violationCheckMessage && (
                  <div
                    className={clsx(
                      'mt-3 p-3 rounded text-sm flex items-center gap-2 mb-5',
                      violationCheckMessage.type === 'success'
                        ? 'bg-[#e6f6e9] text-green-100'
                        : 'bg-[#faeaea] text-red-600'
                    )}>
                    <span>{violationCheckMessage.text}</span>
                  </div>
                )}

                {/* <Accordion
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
                        {uniqueViolationHeadings.map(({ id, heading }) => (
                          <li key={id ?? heading}>
                            <a href={`#${id}`} className="text-black font-bold hover:underline">
                              {heading}
                            </a>
                          </li>
                        ))}

                      </ul>
                      <div className="text-sm text-gray-500 italic">
                        {`Matched ${violations.length} total phrase occurrences across ${Object.keys(violationResults).length} unique phrases.`}
                      </div>
                    </div>
                  )}
                </Accordion> */}

                <Accordion
                  header={
                    <div className="flex justify-between items-center w-full text-sm">
                      <span className="text-sm">Potential Violations</span>
                      {/* {hasCheckedViolations && */}
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
                      {/* // } */}
                    </div>
                  }
                  className="border mb-2">
                  {dictionaryViolations.length === 0 ? (
                    <div className="flex justify-between">
                      <span>No potential SB37 violations found!</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Potential SB37 violations found in:</span>
                      </div>
                      <ul className="list-disc pl-4 space-y-2">
                        {uniqueDictionaryHeadings.map(({ id, heading }) => (
                          <li key={id ?? heading}>
                            <a
                              href={`#${id}`}
                              className="text-black font-bold hover:underline">
                              {heading}
                            </a>
                          </li>
                        ))}
                      </ul>
                      <div className="text-sm text-gray-500 italic">
                        {`Matched ${dictionaryViolations.length} total phrase occurrences across ${Object.keys(dictionaryViolationResults).length} unique phrases.`}
                      </div>
                    </div>
                  )}
                </Accordion>

                {/* <Accordion
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
                        {uniqueDictionaryHeadings.map(({ id, heading }) => (
                          <li key={id ?? heading}>
                            <a href={`#${id}`} className="text-black font-bold hover:underline">
                              {heading}
                            </a>
                          </li>
                        ))}
                      </ul>
                      <div className="text-sm text-gray-500 italic">
                        {`Matched ${dictionaryViolations.length} total phrase occurrences across ${Object.keys(dictionaryViolationResults).length} unique dictionary phrases.`}
                      </div>
                    </div>
                  )}
                </Accordion> */}
              </div>

              <div className="mb-3">
                <h5 className="dark:!text-black !font-bold">
                  Check for additional words/phrases:
                </h5>
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
                  className={clsx(
                    'w-full !bg-white border !border-black-200 rounded-none text-black',
                    'hover:!bg-black-200 hover:text-white hover:shadow-none',
                    'dark:hover:shadow-none dark:!text-black-200 dark:hover:!text-white',
                    customSearchTerm.trim()
                      ? ''
                      : 'opacity-50 cursor-not-allowed pointer-events-none'
                  )}
                  onClick={handleCustomSearch}
                  disabled={customSearchTerm.trim().length === 0}>
                  Search Now
                </Button>

                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={handleAddOpenModal}
                    className="w-full border !border-black-200 !text-white hover:!bg-black-200 hover:text-white rounded-none !bg-[#6B7280] hover:shadow-none dark:hover:shadow-none  dark:hover:!text-white">
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
                        <div className="flex justify-between items-center">
                          <h2 className="!text-left text-white text-2xl font-extrabold w-full">
                            {activeView === 'default'
                              ? 'Added Potential Violations'
                              : 'Deleted Potential Violations'}
                          </h2>

                          <div className="relative w-full">
                            <input
                              type="text"
                              placeholder="Search for Keyword"
                              className="!w-full"
                            />

                            <GoSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                          </div>
                        </div>

                        {statusMessage && (
                          <div className="mt-2 text-sm text-green-400 font-semibold">
                            {statusMessage}
                          </div>
                        )}

                        <div className="flex justify-between items-baseline">
                          <div className="w-[50px] flex flex-col gap-5 items-center">
                            {/* View Potential Violations */}
                            <div
                              onClick={() => setActiveView('default')}
                              className={clsx(
                                'group relative p-2 rounded-md cursor-pointer transition-all duration-200',
                                activeView === 'default'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-transparent hover:bg-white text-white/60 hover:text-black-200'
                              )}>
                              <FaBars className="text-2xl" />
                              <span className="absolute left-[110%] top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-black text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                                View Potential Violations
                              </span>
                            </div>

                            {/* Trash */}
                            <div
                              onClick={() => setActiveView('trash')}
                              className={clsx(
                                'group relative p-2 rounded-md cursor-pointer transition-all duration-200',
                                activeView === 'trash'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-transparent hover:bg-white text-white/60 hover:text-black-200'
                              )}>
                              <FaTrash className="text-2xl" />
                              <span className="absolute left-[110%] top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-black text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                                Archived Potential Violations
                              </span>
                            </div>
                          </div>

                          <div className="flex-1 px-5">
                            {activeView === 'default' && (
                              <>
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
                                    {paginatedData.length === 0 ? (
                                      <tr>
                                        <td
                                          colSpan={3}
                                          className="text-center text-white">
                                          No entries found.
                                        </td>
                                      </tr>
                                    ) : (
                                      paginatedData.map(entry => (
                                        <tr key={entry.id}>
                                          <td className="px-4 py-2 !text-white">
                                            {entry.keyword}
                                          </td>
                                          <td className="px-4 py-2 !text-white">
                                            {entry.created_by}
                                          </td>
                                          <td className="px-4 py-2 !text-white">
                                            <FaTrash
                                              className="text-white hover:text-red-500 cursor-pointer"
                                              onClick={() => {
                                                if (
                                                  confirm(
                                                    `Move phrase "${entry.keyword}" to trash?`
                                                  )
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

                                {/* Pagination Controls for default view */}
                                {totalPages > 1 && (
                                  <div className="flex justify-center mt-4 gap-2">
                                    <button
                                      onClick={() =>
                                        setCurrentPage(prev => Math.max(prev - 1, 1))
                                      }
                                      disabled={currentPage === 1}
                                      className="px-3 py-1 text-white border border-yellow-100 rounded disabled:opacity-50 cursor-pointer hover:bg-yellow-100 hover:text-black-200">
                                      Prev
                                    </button>

                                    {getVisiblePages(currentPage, totalPages).map(
                                      page => (
                                        <button
                                          key={page}
                                          onClick={() => setCurrentPage(page)}
                                          className={clsx(
                                            'px-3 py-1 cursor-pointer hover:bg-white hover:text-black-200',
                                            currentPage === page
                                              ? 'bg-yellow-100 text-black'
                                              : 'text-white border-white'
                                          )}>
                                          {page}
                                        </button>
                                      )
                                    )}

                                    <button
                                      onClick={() =>
                                        setCurrentPage(prev =>
                                          Math.min(prev + 1, totalPages)
                                        )
                                      }
                                      disabled={currentPage === totalPages}
                                      className="px-3 py-1 text-white border border-yellow-100 rounded disabled:opacity-50 cursor-pointer hover:bg-yellow-100 hover:text-black-200">
                                      Next
                                    </button>
                                  </div>
                                )}
                              </>
                            )}

                            {activeView === 'trash' && (
                              <>
                                <table
                                  className={clsx(
                                    'w-full my-[20px] mx-auto border-collapse',
                                    'table-fixed shadow-[0_4px_6px_rgba(0, 0, 0, 0.1)]'
                                  )}>
                                  <thead>
                                    <tr>
                                      <th>Keyword</th>
                                      <th>Added By</th>
                                      <th>Days Left</th>
                                      <th className="w-[80px]"></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {deletedEntries.length === 0 ? (
                                      <tr>
                                        <td
                                          colSpan={4}
                                          className="text-center text-white">
                                          No deleted entries found.
                                        </td>
                                      </tr>
                                    ) : (
                                      deletedEntries.map(entry => {
                                        const deletedAt = new Date(
                                          entry.deleted_at as string
                                        );
                                        const now = new Date();
                                        const diffDays =
                                          30 -
                                          Math.floor(
                                            (now.getTime() - deletedAt.getTime()) /
                                              (1000 * 60 * 60 * 24)
                                          );

                                        return (
                                          <tr key={entry.id}>
                                            <td className="px-4 py-2 !text-white">
                                              {entry.keyword}
                                            </td>
                                            <td className="px-4 py-2 !text-white">
                                              {entry.created_by}
                                            </td>
                                            <td className="px-4 py-2 !text-white">
                                              {diffDays} days left
                                            </td>
                                            <td className="px-4 py-2 !text-white">
                                              <FaTrash
                                                className="text-white hover:text-red-500 cursor-pointer"
                                                onClick={() => {
                                                  if (
                                                    confirm(
                                                      `Permanently delete phrase "${entry.keyword}"?`
                                                    )
                                                  ) {
                                                    handlePermanentDelete(entry.id);
                                                  }
                                                }}
                                              />
                                            </td>
                                          </tr>
                                        );
                                      })
                                    )}
                                  </tbody>
                                </table>

                                {/* Pagination Controls for trash view */}
                                {totalPagesForDeleted > 1 && (
                                  <div className="flex justify-center mt-4 gap-2">
                                    <button
                                      onClick={() =>
                                        setCurrentPageDeleted(prev =>
                                          Math.max(prev - 1, 1)
                                        )
                                      }
                                      disabled={currentPageDeleted === 1}
                                      className="px-3 py-1 text-white border border-yellow-100 rounded disabled:opacity-50 cursor-pointer hover:bg-yellow-100 hover:text-black-200">
                                      Prev
                                    </button>

                                    {getVisiblePages(
                                      currentPageDeleted,
                                      totalPagesForDeleted
                                    ).map(page => (
                                      <button
                                        key={page}
                                        onClick={() => setCurrentPageDeleted(page)}
                                        className={clsx(
                                          'px-3 py-1 cursor-pointer hover:bg-white hover:text-black-200',
                                          currentPageDeleted === page
                                            ? 'bg-yellow-100 text-black'
                                            : 'text-white border-white'
                                        )}>
                                        {page}
                                      </button>
                                    ))}

                                    <button
                                      onClick={() =>
                                        setCurrentPageDeleted(prev =>
                                          Math.min(prev + 1, totalPagesForDeleted)
                                        )
                                      }
                                      disabled={
                                        currentPageDeleted === totalPagesForDeleted
                                      }
                                      className="px-3 py-1 text-white border border-yellow-100 rounded disabled:opacity-50 cursor-pointer hover:bg-yellow-100 hover:text-black-200">
                                      Next
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            onClick={handleViewCloseModal}
                            className="border border-white cursor-pointer py-2 px-7 hover:bg-red-100 hover:border-red-100 text-white mt-5">
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
                    setFormatHighlightActive(false);
                  }}>
                  Remove Highlights
                </Button>
              </div>
              {showResults && (
                <>
                  <div
                    className={`mb-4 p-4 rounded ${hasErrors ? 'bg-[#faeaea] text-red-600' : 'bg-[#e6f6e9] !text-green-100'}`}>
                    {!hasErrors ? (
                      <h6 className="!text-center">
                        🎉 No formatting errors found! Good job!
                      </h6>
                    ) : (
                      <div className="w-full flex justify-center flex-col">
                        {formatErrors.missingPunctuationErrors.length > 0 &&
                        formatErrors.multipleSpaceErrors.length === 0 &&
                        formatErrors.emDashErrors.length === 0 &&
                        formatErrors.leadingTrailingSpaceErrors.length === 0 &&
                        formatErrors.spaceBeforePunctuationErrors.length === 0 &&
                        formatErrors.titleCaseErrors.length === 0 ? (
                          <h6 className="!text-center !text-sm text-red-600">
                            ⚠️ Missing Punctuation errors, fix manually
                          </h6>
                        ) : (
                          <>
                            <h6 className="!text-center !text-sm text-red-600">
                              ⚠️ Formatting Errors found! Please fix
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
                          const handleClick = () => {
                            if (err.heading) scrollToHeading(err.heading);
                          };

                          return (
                            <li key={idx} className="list-disc font-bold text-sm">
                              {err.heading && err.sentence !== err.heading ? (
                                <>
                                  <div
                                    className="font-bold cursor-pointer hover:text-blue-500 text-sm"
                                    onClick={handleClick}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter' || e.key === ' ')
                                        handleClick();
                                    }}>
                                    {err.heading}
                                  </div>
                                  <ul className="pl-3 mt-2 ">
                                    <li
                                      className="list-disc cursor-pointer hover:text-blue-500"
                                      dangerouslySetInnerHTML={{ __html: highlighted }}
                                      onClick={handleClick}
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter' || e.key === ' ')
                                          handleClick();
                                      }}
                                    />
                                  </ul>
                                </>
                              ) : (
                                <span
                                  className="cursor-pointer hover:text-blue-500"
                                  dangerouslySetInnerHTML={{ __html: highlighted }}
                                  onClick={handleClick}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') handleClick();
                                  }}
                                />
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
                disabled={!text}
                onClick={handleAnalyzeLink}
                className="w-full !bg-[#2563ea] flex items-center justify-center hover:!bg-blue-1000 text-white border-0 hover:shadow-none rounded-none dark:hover:shadow-none dark:!text-white">
                {loadingAnalyzeLink ? 'Analyzing links...' : ' Analyze Links'}
              </Button>
              <div className="flex mt-5 gap-2 mb-1">
                <Button
                  disabled={!linkIssuesResult}
                  className="w-1/2 text-sm !bg-white text-black !border-black-200 border rounded-none hover:shadow-none hover:!bg-black-200 hover:text-white dark:hover:shadow-none dark:!text-black-200 dark:hover:!text-white"
                  onClick={onLinkIssuesShowHighlightsClick}>
                  Show Highlights
                </Button>
                <Button
                  disabled={!linkIssuesResult}
                  className="w-1/2 text-sm !bg-[#EF4444] border-[#EF4444]  text-white border hover:!bg-red-700 hover:!border-red-700 rounded-none hover:shadow-none dark:hover:shadow-none dark:!text-white"
                  onClick={onLinkIssuesRemoveHighlightClick}>
                  Remove Highlights
                </Button>
              </div>

              {hasLinkChecked && (
                <>
                  {linkIssuesResult && (
                    <LinkIssuesResultSection result={linkIssuesResult} />
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
                  {error && <Alert message={error} type="error" />}
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
