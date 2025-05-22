import { FC, useState } from 'react';
import clsx from 'clsx';
import { AnalysisWorkerWrapper, Paper } from "yoastseo";

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

interface LoomProps {
  text : string;
  keyword : string;
  metaTitle : string;
  metaDescription : string;
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

export const LoomSidebar: FC<LoomProps> = ({
  text,
  keyword,
  metaDescription,
  metaTitle,
}) => {

  const [ showSummary, setShowSummary ] = useState<boolean>(false);
  const [readabilityProblems, setReadabilityProblems] = useState<AssessmentResult[]>([])
  const [readabilityAchievements, setReadabilityAchievements] = useState<AssessmentResult[]>([])
  const [seoProblems, setSEOProblems] = useState<AssessmentResult[]>([])
  const [seoAchievements, setSEOAchievements] = useState<AssessmentResult[]>([])

  const yoastSEOAnalyze = () => {
    const url = new URL('../utils/yoastWorker.ts', import.meta.url);
    const newWorker = new AnalysisWorkerWrapper( new Worker( url, {
        type: "module",        
      } ));

    newWorker.initialize( {
        logLevel: "TRACE", // Optional, see https://github.com/pimterry/loglevel#documentation
    } ).then( () => {
        // The worker has been configured, we can now analyze a Paper.
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
                <Button onClick={yoastSEOAnalyze}>Run Yoast SEO Analysis</Button>

                <h6 className={resultsHeaderStyle}>YOAST SEO ANALYSIS</h6>
                <Accordion header="Problems" className='mb-2'>
                  {seoProblems.map((result: AssessmentResult) => {
                    return <li
                      className={errorListStyle}
                      /* we use this to add as HTML, no worries though,
                      as text was properly sanitized in formatList*/
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
              SB 37
            </TabPanel>

            <TabPanel id="Format">
              Format
            </TabPanel>

            <TabPanel id="Content">
              Content
            </TabPanel>

            <TabPanel id="Link">
              Link
            </TabPanel>

            <TabPanel id="Keyword">
              Keyword
            </TabPanel>
          </Tabs>
        }
      </section>
    </div>
  );
};