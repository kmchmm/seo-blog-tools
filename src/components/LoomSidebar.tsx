import { FC, useState, useEffect, useContext } from 'react';
import clsx from 'clsx';
import { AnalysisWorkerWrapper, Paper } from "yoastseo";
import { Modal } from '../components/Modal';
import supabase from '../utils/supabaseInit.js';
import { UserContext } from '../context/UserContext';


import { Button } from './Button';
import { Accordion } from './Accordion';
import { Summary } from './Summary';

import {Tabs, TabList, Tab, TabPanel} from 'react-aria-components';
import YoastIcon from '../assets/icons/yoast.svg?react';
import { GoAlert } from "react-icons/go";
import { GoChecklist } from "react-icons/go";
import { GoLaw } from "react-icons/go";
import { GoLink } from "react-icons/go";
import { GoSearch } from "react-icons/go";
import { FaTrash } from 'react-icons/fa';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';


interface LoomProps {
  text: string;
  keyword: string;
  metaTitle: string;
  metaDescription: string;
  onHighlight: (phrases: string[]) => void;
  onRemoveHighlight: () => void;
}

interface AssessmentResult {
  editFieldName : string;
  marks : object[];
  score : number;
  text : string;
  _hasAIFixes : boolean;
  _hasBetaBadge : boolean;
  _hasEditFieldName : boolean;
  _hasJumps : boolean;
  _hasMarks : boolean;
  _hasScore : boolean;
  _identifier : string;
}

const VIOLATION_PHRASES = [
    "no win no fee",
    "no fee guarantee",
    "no fees unless we win",
    "no fees unless they win",
    "don’t get paid unless we win",
    "don’t get paid unless they win",
    "you don’t pay unless we win",
    "you don’t pay unless they win",
    "at no cost",
    "free consultation",
    "free case evaluation",
    "free claim review",
    "cover all costs",
    "without risk",
    "risk free",
    "upfront fee",
    "out of pocket",
    "specialize",
    "specializing",
    "specialist",
    "expert",
    "expertise",
    "ensure",
    "ensuring",
    "make sure",
    "made sure",
    "guarantee",
    "maximize",
    "maximizing",
    "maximum",
    "best",
    "top",
    "top rated",
    "#1",
    "number one",
    "award",
    "award winning",
    "record breaking",
    "record setting",
    "most experienced",
    "most trusted",
    "most successful",
    "most aggressive",
    "most qualified",
    "most knowledgeable",
    "leading",
    "million",
    "multi-million",
    "settlement amount",
    "verdict amount",
    "jury award",
    "jury verdict",
    "750 million",
    "98% success rate",
    "proven track record",
    "proven result",
    "proven record of success",
    "trusted",
    "trusted by thousands",
    "trusted firm",
    "trusted legal team",
    "trusted in the community",
    "respected",
    "trusted attorney",
    "peace of mind",
    "rest assured",
    "you can trust us",
    "you’re in good hands",
    "clients rely on us",
    "give you the best chance",
    "give you an advantage",
    "we win",
    "we consistently win",
    "you’ll get justice",
    "you will win",
    "we always win",
    "always get results",
    "we win because we care",
    "winning is our goal",
    "your case is in good hands",
    "your case is our priority",
    "you deserve justice",
    "you deserve compensation",
    "guaranteed representation",
    "your recovery is our mission",
    "your victory is our goal",
    "our passion is your justice",
    "justice guaranteed",
    "fierce advocacy",
    "relentless representation",
    "aggressive representation",
    "relentless",
    "seasoned attorney",
    "deep experience",
    "thousands helped",
    "helping thousands",
    "thousands of cases won",
    "best bet",
    "stronger strategy",
    "we’re the right choice",
    "results that speak for itself",
    "results speak louder than words",
    "let’s win together",
    "justice that works",
    "justice that delivers",
    "call today for a free consultation",
    "get started today",
    "get started on your case"
];

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

const formatList = (htmlString: string) => {
  const p = document.createElement('p');
  p.innerHTML = htmlString;
  // strip HTML
  const text = p.textContent;
  const textArr = text?.split(':');
  const identifier = textArr?.shift();
  
  p.innerHTML = textArr?.join(':') as string;
  const span = document.createElement('span');
  span.textContent = `${identifier as string} : `;
  p.prepend(span);
  return p.innerHTML;
}


const panels = [
  { id: "Format", label: "Check For Formatting Errors" },
  { id: "Content", label: "Check For Content Issues" },
];

export const LoomSidebar: FC<LoomProps> = ({
  text,
  keyword,
  metaDescription,
  metaTitle,
  onHighlight,
  onRemoveHighlight
}) => {

  const { userData } = useContext(UserContext);  const [ showSummary, setShowSummary ] = useState<boolean>(false);
  const [readabilityProblems, setReadabilityProblems] = useState<AssessmentResult[]>([])
  const [readabilityAchievements, setReadabilityAchievements] = useState<AssessmentResult[]>([])
  const [seoProblems, setSEOProblems] = useState<AssessmentResult[]>([])
  const [seoAchievements, setSEOAchievements] = useState<AssessmentResult[]>([])
  const [violations, setViolations] = useState<string[]>([]);
  const [violationResults, setViolationResults] = useState<Record<string, { heading: string, id: string }[]>>({});
  const [highlightActive, setHighlightActive] = useState(false);
  const [hasCheckedViolations, setHasCheckedViolations] = useState(false);
  const [customSearchTerm, setCustomSearchTerm] = useState('');
  const [customSearchResults, setCustomSearchResults] = useState<{ term: string; count: number }[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [dictionary, setDictionary] = useState<{ id: number; keyword: string; created_by: string }[]>([]);
  const [newPhrase, setNewPhrase] = useState('');
  const [addStatus, setAddStatus] = useState<null | 'success' | 'exists' | 'error'>(null);
  const [dictionaryViolations, setDictionaryViolations] = useState<string[]>([]);
  const [dictionaryViolationResults, setDictionaryViolationResults] = useState<Record<string, { heading: string, id: string }[]>>({});



  const yoastSEOAnalyze = () => {
    const url = new URL('../utils/yoastWorker.ts', import.meta.url);
    const newWorker = new AnalysisWorkerWrapper( new Worker( url, {
        type: "module",        
      } ));

    newWorker.initialize( {
        logLevel: "TRACE", 
    } ).then( () => {
       
        const paper = new Paper(text, {
          keyword, 
          title: metaTitle,
          description: metaDescription
        });

        return newWorker.analyze( paper );
    } ).then( ( results:any ) => {
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
        })

        const seoResult = results.result.seo[""].results;
        seoResult.forEach((result: AssessmentResult) => {
          if (result.score > 6) {
            goodSEO.push(result);
          } else if (result.score > 0) {
            badSEO.push(result);
          }
        })

        setReadabilityProblems(badReadability);
        setReadabilityAchievements(goodReadability);
        setSEOProblems(badSEO);
        setSEOAchievements(goodSEO);
    } ).catch( ( error: Error ) => {
        console.error( 'An error occured while analyzing the text:' );
        console.error( error );
    } );
  }

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

    // useEffect(() => {
    //   const foundViolations = checkForViolations();
    //   console.log("Found violations:", foundViolations);
    // }, [text]);

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

    violations.forEach((phrase) => {
      const phraseRegex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      let match: RegExpExecArray | null;
      while ((match = phraseRegex.exec(bodyText.toLowerCase())) !== null) {
        const matchIndex = match.index;

        const closestHeading = [...headingMap]
          .reverse()
          .find((heading) => heading.index <= matchIndex);

        if (closestHeading) {
          if (!results[phrase]) results[phrase] = [];
          const isAlreadyAdded = results[phrase].some((h) => h.id === closestHeading.id);
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
      setDictionary((prev) => prev.filter((entry) => entry.id !== id));
    }
  };



  const handleCustomSearch = () => {
    const term = customSearchTerm.trim().toLowerCase();
    if (!term) return;

    if (customSearchResults.some((res) => res.term.toLowerCase() === term)) return;

    const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = text.match(regex);
    const matchCount = matches ? matches.length : 0;

    setCustomSearchResults((prev) => [
      ...prev,
      { term: customSearchTerm, count: matchCount },
    ]);

    if (matchCount > 0) {
      setHighlightActive(true);
      onHighlight([customSearchTerm]);
    } else {
      setHighlightActive(false);
    }

    setCustomSearchTerm('');
  };




  return (
    <div className="w-[350px] min-h-[500px]">
      <Button className="w-full mb-4" >Run All Checks</Button>
      <section className={clsx(
        'border border-black/17.5 rounded-md p-4 bg-white',
        'flex flex-1 flex-col'
      )}>
        <Button className="self-center">Export Full Report</Button>
        <div className={clsx(
          'justify-between flex border-b px-4 pb-5 border-black/17.5',
          'mx-[-16px] mb-4'
        )}>
          <label className="font-bold">Summary</label>
          <a
            className="cursor-pointer text-blue-300 select-none"
            onClick={() => setShowSummary(!showSummary)}
          >Show/Hide</a>
        </div>
        {showSummary && <Summary />}
        {!showSummary && 
          <Tabs className={clsx(
            'min-h-[410px]'
          )}>
            <TabList
              aria-label="Error List"
              className="flex gap-1 mb-5"
            >
              <Tab id="Yoast" className={tabHeaderStyle}>
                <YoastIcon className={svgStyle}/>Yoast
              </Tab>
              <Tab id="SB37" className={tabHeaderStyle}>
                <GoLaw className={svgStyle}/>SB37
              </Tab>
              <Tab id="Format" className={tabHeaderStyle}>
                <GoAlert className={svgStyle}/>Format
              </Tab>
              <Tab id="Content" className={tabHeaderStyle}>
                <GoChecklist className={svgStyle}/>Content
              </Tab>
              <Tab id="Link" className={tabHeaderStyle}>
                <GoLink className={svgStyle}/>Link
              </Tab>
              <Tab id="Keyword" className={tabHeaderStyle}>
                <GoSearch className={svgStyle}/>Keyword
              </Tab>
            </TabList>

            <TabPanel id="Yoast">
              <div className="text-center">
                <Button className="w-full !bg-[#2563ea] hover:!bg-blue-1000 text-white border-0 hover:shadow-none rounded-none" onClick={yoastSEOAnalyze}>Run Yoast SEO Analysis</Button>

                <h6 className={resultsHeaderStyle}>YOAST SEO ANALYSIS</h6>
                <Accordion header="Problems" className='mb-2'>
                  {seoProblems.map((result: AssessmentResult) => {
                    return <li
                      className={errorListStyle}
                      
                      dangerouslySetInnerHTML={{__html:formatList(result.text)}}>
                    </li>;
                  })}
                </Accordion>
                <Accordion header="Good results" >
                  {seoAchievements.map((result: AssessmentResult) => {
                    return <li
                      className={passListStyle}
                      dangerouslySetInnerHTML={{__html:formatList(result.text)}}>
                    </li>;
                  })}
                </Accordion>

                <h6 className={resultsHeaderStyle}>YOAST READABILITY ANALYSIS</h6>
                <Accordion header="Problems" className='mb-2' >
                  {readabilityProblems.map((result: AssessmentResult) => {
                    return <li
                      className={errorListStyle}
                      dangerouslySetInnerHTML={{__html:formatList(result.text)}}>
                    </li>;
                  })}
                </Accordion>
                <Accordion header="Good results" >
                  {readabilityAchievements.map((result: AssessmentResult) => {
                    return <li
                      className={passListStyle}
                      dangerouslySetInnerHTML={{__html:formatList(result.text)}}>
                    </li>;
                  })}
                </Accordion>
              </div>
            </TabPanel>

            <TabPanel id="SB37">
              <div className="mb-5">
                <Button className="w-full !bg-[#2563ea] hover:!bg-blue-1000 text-white border-0 hover:shadow-none rounded-none" onClick={checkForViolations}>
                  Check For Potential Violations
                </Button>

                <div className="flex mt-5 gap-2 mb-1">
                  <Button                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq                                                                 
                    className="w-1/2 text-sm  !bg-white  text-black !border-black-200 border rounded-none hover:shadow-none hover:!bg-black-200 hover:text-white"
                    disabled={!highlightActive}
                    onClick={() => {
                      onHighlight(violations);
                    }}
                  >
                    Show Highlights
                  </Button>
                  <Button
                    className="!bg-white text-sm w-1/2 text-black border !border-black-200 hover:!bg-black-200 hover:text-white rounded-none hover:shadow-none"
                    disabled={dictionaryViolations.length === 0}   
                    onClick={() => {
                      onHighlight(dictionaryViolations);  
                      setHighlightActive(true);            
                    }}
                  >
                    Dict Highlights
                  </Button>
                </div>
                  <Button
                    className="w-full text-sm !bg-[#EF4444] border-[#EF4444]  text-white border hover:!bg-red-700 hover:!border-red-700 rounded-none hover:shadow-none"
                    disabled={!highlightActive}
                    onClick={() => {
                      onRemoveHighlight();
                      setHighlightActive(false);
                    }}
                  >
                    Remove Highlights
                  </Button>
              </div>

              <div className="mb-4">
                <h4 className="mb-2 font-semibold">Results:</h4>

                <Accordion
                  header={
                    <div className="flex justify-between items-center w-full">
                      <span>Potential Violations</span>
                      {hasCheckedViolations && (
                        violations.length > 0 ? (
                          <div className="bg-[#f5ecee] w-[40px] text-right rounded-2xl px-2">
                            <span className="text-red-100">{violations.length}</span>
                          </div>
                        ) : (
                          <div className="bg-[#e5f5ea] w-[40px] text-right rounded-2xl px-2">
                            <span className="text-green-100">0</span>
                          </div>
                        )
                      )}
                    </div>
                  }
                  className="border mb-2"
                >
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
                                className="text-black font-bold hover:underline"
                              >
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
                    <div className="flex justify-between items-center w-full">
                      <span className="text-sm">Potential Violations (Dictionary)</span>
                      {dictionaryViolations.length > 0 ? (
                        <div className="bg-[#f5ecee] w-[40px] text-right rounded-2xl px-2">
                          <span className="text-red-100">{dictionaryViolations.length}</span>
                        </div>
                      ) : (
                        <div className="bg-[#e5f5ea] w-[40px] text-right rounded-2xl px-2">
                          <span className="text-green-100">0</span>
                        </div>
                      )}
                    </div>
                  }
                  className="border mb-2"
                >
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
                        {Object.entries(dictionaryViolationResults).map(([, headings], index) =>
                          headings.map((headingInfo, i) => (
                            <li key={`${index}-${i}`}>
                              <a
                                href={`#${headingInfo.id}`}
                                className="text-black font-bold hover:underline"
                              >
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
                <h5>Check for additional words/phrases:</h5>
                <div className="relative mb-1">
                  <input
                    type="text"
                    placeholder="Search"
                    className="!w-full"
                    value={customSearchTerm}
                    onChange={(e) => setCustomSearchTerm(e.target.value)}
                  />

                  <GoSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                </div>

                {customSearchResults.some(result => result.count > 0) && (
                  <div className="mt-1 mb-2">
                    <div className="flex justify-between font-extrabold p-2 bg-gray-300">Search Results:</div>
                    {customSearchResults.map(({ term, count, id }, index) => (
                      <div key={index} className="py-1 border-b border-gray-200">
                        {count > 0 ? (
                          <a
                            href={`#${id ?? term.replace(/\s+/g, '-').toLowerCase()}`}
                            className="text-blue-600 font-bold hover:underline cursor-pointer flex justify-between hover:bg-gray-100 px-2"
                            onClick={() => onHighlight([term])}
                          >
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



                <div className="flex gap-2 mb-3">
                  <Button
                    className="w-full !bg-white border !border-black-200 hover:!bg-black-200 hover:text-white rounded-none  text-black hover:shadow-none"
                    onClick={handleCustomSearch}
                  >
                    Search Now
                  </Button>

                  <Button onClick={handleAddOpenModal} className="w-full border !border-black-200 hover:!bg-black-200 hover:text-white rounded-none !bg-white text-black hover:shadow-none">
                    Add to Dictionary
                  </Button>
                    
                  {isAddModalOpen && (
                  <Modal 
                    isOpen={isAddModalOpen}  
                    onClose={() => setIsAddModalOpen(false)}
                    width="700px"
                    height="auto"
                    backgroundColor="#0a1a31"
                    showCloseButton={false}
                    >
                      <div className="w-full h-full">
                        <div>
                          {addStatus === 'success' && (
                            <div className="text-green-500 mt-2 bg-green-900/20 p-2 flex items-center gap-2">
                              <span>Added to the dictionary!</span>
                              <span><FaCheckCircle className="text-green-500" /></span>
                            </div>
                          )}
                          {addStatus === 'exists' && (
                            <div className=" mt-2 p-2 bg-red-300 text-red-100 flex items-center gap-2">
                              <span>Phrase already exists in the dictionary.</span><span><FaTimesCircle className="text-red-500" /></span> </div>
                          )}
                          {addStatus === 'error' && (
                            <div className="text-red-500 bg-red-300 mt-2 p-2 flex items-center gap-2">
                              <span>Error adding phrase. Try again.</span>
                              <span><FaTimesCircle className="text-red-500" /></span>
                              </div>
                          )}
                          <input
                            type="text"
                            placeholder="Potential Violation"
                            className="!w-full mb-2"
                            value={newPhrase}
                            onChange={(e) => {
                              setNewPhrase(e.target.value);
                              setAddStatus(null); 
                            }}
                          />
                          <button
                            onClick={handleAddPhrase}
                            className="bg-blue-200 hover:bg-blue-1000 text-white font-extrabold w-full p-2 cursor-pointer"
                          >
                            Add Potential Violation
                          </button>

                        </div>
                        <div className="flex justify-end mt-5">
                          <button onClick={handleAddCloseModal} className="border border-white cursor-pointer py-2 px-7 hover:bg-red-100 hover:border-red-100 text-white">Cancel</button>
                        </div>                  
                      </div>

                    </Modal>
                  )}
                </div>

                <Button onClick={handleViewOpenModal} className="w-full !bg-[#6B7280] hover:!bg-black-200 text-white border-0 rounded-none  hover:shadow-none">
                  View Dictionary
                </Button>
                {isViewModalOpen && (
                  <Modal 
                    isOpen={isViewModalOpen}  
                    onClose={() => setIsViewModalOpen(false)}
                    width="1200px"
                    height="auto"
                    backgroundColor="#0a1a31"
                    showCloseButton={false}
                    >
                      <div className="w-full h-full">
                        <h2 className="!text-left text-white text-2xl font-extrabold">Added Potential Violations</h2>
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
                                  <tr><td colSpan={3} className="text-center">No entries found.</td></tr>
                                ) : (
                                  dictionary.map((entry, index) => (
                                    <tr key={index}>
                                      <td className=" px-4 py-2 !text-white">{entry.keyword}</td>
                                      <td className=" px-4 py-2 !text-white">{entry.created_by}</td>
                                      <td className=" px-4 py-2 !text-white">
                                        <FaTrash className="text-white hover:text-red-500 cursor-pointer"
                                        onClick={() => {
                                            if (confirm(`Delete phrase "${entry.keyword}"?`)) {
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
                          <button onClick={handleViewCloseModal} className="border border-white cursor-pointer py-2 px-7 hover:bg-red-100 hover:border-red-100 text-white">Cancel</button>
                        </div>                  
                      </div>
                    </Modal>
                  )}
              </div>
            </TabPanel>


            <TabPanel id="Format">
                <Button className="w-full !bg-[#2563ea] hover:!bg-blue-1000 text-white border-0 hover:shadow-none rounded-none" >
                  Check For Formatting Errors
                </Button>
            </TabPanel>

            <TabPanel id="Content">
                <Button className="w-full !bg-[#2563ea] hover:!bg-blue-1000 text-white border-0 hover:shadow-none rounded-none" >
                  Check For Content Issues
                </Button>
            </TabPanel>

            <TabPanel id="Link">
                <Button className="w-full !bg-[#2563ea] hover:!bg-blue-1000 text-white border-0 hover:shadow-none rounded-none" >
                  Analyze Links
                </Button>
            </TabPanel>

            <TabPanel id="Keyword">
                <Button className="w-full !bg-[#2563ea] hover:!bg-blue-1000 text-white border-0 hover:shadow-none rounded-none" >
                  Analyze Keywords
                </Button>
            </TabPanel>
          </Tabs>
        }
      </section>

    </div>
  );
};