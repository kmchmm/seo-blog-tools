<<<<<<< Updated upstream
// // // import { FC } from 'react';
// // // import clsx from 'clsx';
// // // import { AnalysisWebWorker, AnalysisWorkerWrapper, Paper } from 'yoastseo';
// // // import EnglishResearcher from 'yoastseo/build/languageProcessing/languages/en/Researcher';

=======
// // import { FC } from 'react';
// // import clsx from 'clsx';
// // import { AnalysisWebWorker, AnalysisWorkerWrapper, Paper } from 'yoastseo';
// // import EnglishResearcher from 'yoastseo/build/languageProcessing/languages/en/Researcher';

// <<<<<<< Updated upstream
>>>>>>> Stashed changes
// import { Tabs, TabList, Tab, TabPanel } from 'react-aria-components';
// import YoastIcon from '../../assets/icons/yoast.svg?react';
// import { GoAlert } from 'react-icons/go';
// import { GoChecklist } from 'react-icons/go';
// import { GoLaw } from 'react-icons/go';
// import { GoLink } from 'react-icons/go';
// import { GoSearch } from 'react-icons/go';
// import { Button } from '../Button';
<<<<<<< Updated upstream

// interface LoomProps {
//   text: string;
// }

// const tabHeaderStyle = clsx(
//   'text-xs w-15 text-center cursor-pointer flex flex-col items-center rounded-md p-1',
//   'data-[selected]:text-blue-300 data-[selected]:bg-blue-100/10',
//   'data-[hovered]:text-blue-300',
//   'data-[hovered]:[&>svg]:text-blue-300 data-[selected]:[&>svg]:text-blue-300'
// );
// const svgStyle = 'mb-1 w-4 text-black text-base';

// // // const workerFunction = () => {
// // //   const worker = new AnalysisWebWorker(self, new EnglishResearcher());
// // //   // Any custom registration should be done here (or send messages via postMessage to the wrapper).
// // //   worker.register();
// // // };

// // // export const LoomTabGroup: FC<LoomProps> = ({ text }) => {
// // //   const YoastSEOAnalyze = () => {
// // //     console.log(text);
// // //     const url = new URL('../utils/yoastWorker.ts', import.meta.url);
// // //     const newWorker = new AnalysisWorkerWrapper(
// // //       new Worker(url, {
// // //         type: 'module',
// // //       })
// // //     );

// // //     newWorker
// // //       .initialize({
// // //         logLevel: 'TRACE', // Optional, see https://github.com/pimterry/loglevel#documentation
// // //       })
// // //       .then(() => {
// // //         // The worker has been configured, we can now analyze a Paper.
// // //         const paper = new Paper(text, {
// // //           keyword: 'lawyer',
// // //         });

// // //         return newWorker.analyze(paper);
// // //       })
// // //       .then((results: any) => {
// // //         console.log('Analysis results:');
// // //         console.log(results);
// // //       })
// // //       .catch((error: Error) => {
// // //         console.error('An error occured while analyzing the text:');
// // //         console.error(error);
// // //       });
// // //   };

// // //   return (
// // //     <Tabs className={clsx('min-h-[410px]')}>
// // //       <TabList aria-label="Error List" className="flex gap-1 mb-5">
// // //         <Tab id="Yoast" className={tabHeaderStyle}>
// // //           <YoastIcon className={svgStyle} />
// // //           Yoast
// // //         </Tab>
// // //         <Tab id="SB37" className={tabHeaderStyle}>
// // //           <GoLaw className={svgStyle} />
// // //           SB37
// // //         </Tab>
// // //         <Tab id="Format" className={tabHeaderStyle}>
// // //           <GoAlert className={svgStyle} />
// // //           Format
// // //         </Tab>
// // //         <Tab id="Content" className={tabHeaderStyle}>
// // //           <GoChecklist className={svgStyle} />
// // //           Content
// // //         </Tab>
// // //         <Tab id="Link" className={tabHeaderStyle}>
// // //           <GoLink className={svgStyle} />
// // //           Link
// // //         </Tab>
// // //         <Tab id="Keyword" className={tabHeaderStyle}>
// // //           <GoSearch className={svgStyle} />
// // //           Keyword
// // //         </Tab>
// // //       </TabList>
// // //       <TabPanel id="Yoast">
// // //         <div className="text-center">
// // //           <Button onClick={YoastSEOAnalyze}>Run Yoast SEO Analysis</Button>
// // //         </div>
// // //       </TabPanel>
// // //       <TabPanel id="SB37">SB 37</TabPanel>
// // //       <TabPanel id="Format">Format</TabPanel>
// // //       <TabPanel id="Content">Content</TabPanel>
// // //       <TabPanel id="Link">Link</TabPanel>
// // //       <TabPanel id="Keyword">Keyword</TabPanel>
// // //     </Tabs>
// // //   );
// // // };
=======
// =======
// // import { Tabs, TabList, Tab, TabPanel } from 'react-aria-components';
// // import YoastIcon from '../../assets/icons/yoast.svg?react';
// // import { GoAlert } from 'react-icons/go';
// // import { GoChecklist } from 'react-icons/go';
// // import { GoLaw } from 'react-icons/go';
// // import { GoLink } from 'react-icons/go';
// // import { GoSearch } from 'react-icons/go';
// // import { Button } from '../common';
// >>>>>>> Stashed changes

// // interface LoomProps {
// //   text: string;
// // }

// // const tabHeaderStyle = clsx(
// //   'text-xs w-15 text-center cursor-pointer flex flex-col items-center rounded-md p-1',
// //   'data-[selected]:text-blue-300 data-[selected]:bg-blue-100/10',
// //   'data-[hovered]:text-blue-300',
// //   'data-[hovered]:[&>svg]:text-blue-300 data-[selected]:[&>svg]:text-blue-300'
// // );
// // const svgStyle = 'mb-1 w-4 text-black text-base';

// // const workerFunction = () => {
// //   const worker = new AnalysisWebWorker(self, new EnglishResearcher());
// //   // Any custom registration should be done here (or send messages via postMessage to the wrapper).
// //   worker.register();
// // };

// // export const LoomTabGroup: FC<LoomProps> = ({ text }) => {
// //   const YoastSEOAnalyze = () => {
// //     console.log(text);
// //     const url = new URL('../utils/yoastWorker.ts', import.meta.url);
// //     const newWorker = new AnalysisWorkerWrapper(
// //       new Worker(url, {
// //         type: 'module',
// //       })
// //     );

// //     newWorker
// //       .initialize({
// //         logLevel: 'TRACE', // Optional, see https://github.com/pimterry/loglevel#documentation
// //       })
// //       .then(() => {
// //         // The worker has been configured, we can now analyze a Paper.
// //         const paper = new Paper(text, {
// //           keyword: 'lawyer',
// //         });

// //         return newWorker.analyze(paper);
// //       })
// //       .then((results: any) => {
// //         console.log('Analysis results:');
// //         console.log(results);
// //       })
// //       .catch((error: Error) => {
// //         console.error('An error occured while analyzing the text:');
// //         console.error(error);
// //       });
// //   };

// //   return (
// //     <Tabs className={clsx('min-h-[410px]')}>
// //       <TabList aria-label="Error List" className="flex gap-1 mb-5">
// //         <Tab id="Yoast" className={tabHeaderStyle}>
// //           <YoastIcon className={svgStyle} />
// //           Yoast
// //         </Tab>
// //         <Tab id="SB37" className={tabHeaderStyle}>
// //           <GoLaw className={svgStyle} />
// //           SB37
// //         </Tab>
// //         <Tab id="Format" className={tabHeaderStyle}>
// //           <GoAlert className={svgStyle} />
// //           Format
// //         </Tab>
// //         <Tab id="Content" className={tabHeaderStyle}>
// //           <GoChecklist className={svgStyle} />
// //           Content
// //         </Tab>
// //         <Tab id="Link" className={tabHeaderStyle}>
// //           <GoLink className={svgStyle} />
// //           Link
// //         </Tab>
// //         <Tab id="Keyword" className={tabHeaderStyle}>
// //           <GoSearch className={svgStyle} />
// //           Keyword
// //         </Tab>
// //       </TabList>
// //       <TabPanel id="Yoast">
// //         <div className="text-center">
// //           <Button onClick={YoastSEOAnalyze}>Run Yoast SEO Analysis</Button>
// //         </div>
// //       </TabPanel>
// //       <TabPanel id="SB37">SB 37</TabPanel>
// //       <TabPanel id="Format">Format</TabPanel>
// //       <TabPanel id="Content">Content</TabPanel>
// //       <TabPanel id="Link">Link</TabPanel>
// //       <TabPanel id="Keyword">Keyword</TabPanel>
// //     </Tabs>
// //   );
// // };
>>>>>>> Stashed changes
