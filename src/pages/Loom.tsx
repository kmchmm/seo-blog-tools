/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useMemo, useRef, useState, useEffect } from 'react';
import clsx from 'clsx';
import '../assets/css/Loom.css';

import { Editor } from '@tinymce/tinymce-react';
import { Editor as TinyMCEEditor } from 'tinymce';

import { LoomSidebar } from '../components/loom/LoomSidebar';
import { addHeadingIds } from '../utils/sb37HTMLHelper';
import {
  useContentIssuesAnalysis,
  useFocusKeywordFormValidate,
  useKeywordAnalysis,
  useLinkIssuesAnalysis,
} from '../hooks';
import {
  checkPixelLength,
  highlightKeywordsInDiv,
  removeKeywordHighlights,
} from '../components/loom/helpers';
import {
  DESC_CONSTRAINTS,
  EDITOR_MIN_HEIGHT,
  otherKeywords,
  TITLE_CONSTRAINTS,
} from '../components/loom/contants';
import { CustomHTMLElement } from '../hooks/useKeywordAnalysis';
import { Input } from '../components/common';

import {
  highlightContentIssuesDiv,
  removeContentIssueHighlights,
} from '../utils/contentWorker';
import {
  highlightLinkIssuesInHtml,
  LinkAnalysisResult,
  removeLinkIssueHighlights,
} from '../utils/analyzeLinksWorker';

export const errorLengthStyle = 'bg-red-200';
export const warningLengthStyle = 'bg-yellow-200';
export const perfectLengthStyle = 'bg-green-100';

interface FormatError {
  paragraphIndex: number;
  message?: string;
  start: number;
  end: number;
  errorSubType?: 'leading' | 'trailing';
}

interface ErrorList {
  multipleSpaceErrors: FormatError[];
  emDashErrors: FormatError[];
  leadingTrailingSpaceErrors: FormatError[];
  spaceBeforePunctuationErrors: FormatError[];
  missingPunctuationErrors: FormatError[];
  titleCaseErrors: FormatError[];
}

const TINYMCE_API_KEY = 'nadd9qtgsipyog9sw5zwf88wjx3jqzbpsdfn55jugpzy4tnn';

const minHeightStyle = 'min-h-[450px]';

const modeActive = clsx(
  'bg-black-100 text-white-100',
  'shadow-[inset_0_0px_5px_theme(color-shadow-100),inset_0_1px_8px_0_theme(color-shadow-100)]',
  'dark:bg-yellow-100 dark:text-blue-600 dark:border-blue-600',
  'dark:shadow-[inset_0_0px_5px_theme(color-shadow-200),inset_0_1px_8px_0_theme(color-shadow-200)]'
);



const Loom: FC = () => {
  const [htmlString, setHtmlString] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [alternateEsq, setAlternateEsq] = useState('');
  const [editMode, setEditMode] = useState(true);
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const editorRef = useRef<TinyMCEEditor | null>(null);

  const titleStyle = useMemo(() => checkPixelLength(title, TITLE_CONSTRAINTS), [title]);
  const descStyle = useMemo(
    () => checkPixelLength(description, DESC_CONSTRAINTS),
    [description]
  );

  const [, setFormatErrors] = useState<ErrorList | null>(null);
  // const [setFormatErrors] = useState<ErrorList | null>(null);
  // const [linkIssues, setLinkIssues] = useState<LinkIssue[] | null>(null);

  const divRef = useRef<CustomHTMLElement | React.Ref<Editor> | null>(null);
  const handleEditorChange = (content: string) => {
    setHtmlString(content);
  };

  const {
    runLinkAnalysis: runLinkIssuesAnalysis,
    result: linkIssuesResult,
    showHighlights: showLinkIssuesHighlight,
    handleShowHighlightsToggle: handleShowLinkIssuesHighlightToggle,
    loading: loadingAnalyzeLink,
  } = useLinkIssuesAnalysis();

  const {
    results,
    runAnalysis,
    error,
    handleSetKeywordAnalysisError,
    handleHighlightToggle,
    showHighlight: showKeywordHighlight,
  } = useKeywordAnalysis();

  const {
    errorMessage: contentIssuesErrorMessage,
    result: contentIssuesResult,
    runAnalysis: runContentIssues,
    showHighlight: showContentIssuesHighlight,
    handleHighlightToggle: handleContentIssuesHighlightToggle,
  } = useContentIssuesAnalysis();
  const {
    error: errorValidate,
    helperText,
    validate,
    resetError,
  } = useFocusKeywordFormValidate();

  const handleAnalyzeLinkIssues = () => {
    setEditMode(false);
    runLinkIssuesAnalysis(htmlString);
    if (showLinkIssuesHighlight) {
      handleShowLinkIssuesHighlightToggle(true);
    }
  };

  const handleKeywordAnalyze = () => {
    setEditMode(false);
    if (!htmlString) {
      handleSetKeywordAnalysisError('No HTML string found.');
    }
    if (validate(focusKeyword)) {
      runAnalysis({
        altKeyphrase: alternateEsq,
        container: divRef.current as CustomHTMLElement,
        editMode,
        focusKeyphrase: focusKeyword,
        otherKeywords: otherKeywords,
      });

      resetError();
    }
  };

  const onCheckContentIssuesClick = () => {
    setEditMode(false);
    runContentIssues({ container: divRef.current as CustomHTMLElement, editMode });
    if (showContentIssuesHighlight) {
      handleContentIssuesHighlightToggle(true);
    }
  };

  const onLinkIssuesShowHighlightsClick = () => {
    if (!divRef.current) return;
    highlightLinkIssuesInHtml(
      divRef.current as CustomHTMLElement,
      linkIssuesResult as LinkAnalysisResult
    );
  };

  const onLinkIssuesRemoveHighlightClick = () => {
    removeLinkIssueHighlights(divRef.current as CustomHTMLElement);
  };

  const onKeywordShowHighlightClick = () => {
    if (!divRef.current || !focusKeyword) return;
    handleHighlightToggle(true);
    highlightKeywordsInDiv({
      container: divRef.current as CustomHTMLElement,
      focusKeyword,
      alternateKeyword: alternateEsq,
    });
  };

  const onKeywordRemoveHighlightClick = () => {
    if (!divRef.current) return;
    handleHighlightToggle(false);
    removeKeywordHighlights(divRef.current as HTMLElement);
  };

  const onContentIssuesHighlight = () => {
    if (!divRef.current) return;
    handleContentIssuesHighlightToggle(true);
    highlightContentIssuesDiv({
      container: divRef.current as CustomHTMLElement,
      over300Sections: contentIssuesResult?.over300Sections || [],
      sameWordStreaks: contentIssuesResult?.sameWordStreaks || [],
      editMode,
    });
  };

  const removeContentHighlights = () => {
    handleContentIssuesHighlightToggle(false);
    removeContentIssueHighlights(divRef.current as HTMLElement);
  };

  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // const applyHighlights = (html: string, phrases: string[], className: string) => {
  //   const parser = new DOMParser();
  //   const doc = parser.parseFromString(html, 'text/html');

  //   const regex = new RegExp(`\\b(${phrases.map(escapeRegex).join('|')})\\b`, 'gi');

  //   const walk = (node: Node) => {
  //     if (node.nodeType === Node.TEXT_NODE && regex.test(node.nodeValue || '')) {
  //       const tempDiv = document.createElement('div');
  //       tempDiv.innerHTML = (node.nodeValue || '').replace(
  //         regex,
  //         match => `<mark class="highlight-keyword ${className}">${match}</mark>`
  //       );
  //       const fragment = document.createDocumentFragment();
  //       [...tempDiv.childNodes].forEach(n => fragment.appendChild(n));
  //       node.parentNode?.replaceChild(fragment, node);
  //     } else if (node.nodeType === Node.ELEMENT_NODE) {
  //       node.childNodes.forEach(child => walk(child));
  //     }
  //   };

  //   walk(doc.body);
  //   return doc.body.innerHTML;
  // };

  function highlightTextNode(
    node: Text,
    regex: RegExp,
    errorType: string,
    doc: Document
  ) {
    const parent = node.parentNode;
    if (!parent) return;

    const text = node.textContent || '';
    let lastIndex = 0;
    const frag = doc.createDocumentFragment();

    let match;
    while ((match = regex.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      if (before.length > 0) {
        frag.appendChild(doc.createTextNode(before));
      }

      const mark = doc.createElement('mark');
      mark.className = 'highlight-format bg-red-300 text-red-700 rounded-sm px-1';
      mark.title = errorType;
      mark.textContent = match[0];
      frag.appendChild(mark);

      lastIndex = match.index + match[0].length;

      if (match.index === regex.lastIndex) regex.lastIndex++;
    }

    const after = text.slice(lastIndex);
    if (after.length > 0) {
      frag.appendChild(doc.createTextNode(after));
    }

    parent.replaceChild(frag, node);
  }


  function highlightLastWordInTextNode(node: Text, errorType: string, doc: Document) {
    const parent = node.parentNode;
    if (!parent) return;

    const text = node.textContent || '';
    const trimmedText = text.trimEnd();
    const lastWordMatch = trimmedText.match(/(\S+)$/);
    if (!lastWordMatch) return;

    const lastWord = lastWordMatch[1];
    const lastWordIndex = text.lastIndexOf(lastWord);
    if (lastWordIndex === -1) return;

    const frag = doc.createDocumentFragment();

    const before = text.slice(0, lastWordIndex);
    if (before.length > 0) {
      frag.appendChild(doc.createTextNode(before));
    }

    const mark = doc.createElement('mark');
    mark.className = 'highlight-format bg-red-300 text-red-700 rounded-sm px-1';
    mark.title = errorType;
    mark.textContent = lastWord;
    frag.appendChild(mark);

    const after = text.slice(lastWordIndex + lastWord.length);
    if (after.length > 0) {
      frag.appendChild(doc.createTextNode(after));
    }

    parent.replaceChild(frag, node);
  }


  // function highlightAllErrorsInHTML(html: string, formatErrors: ErrorList): string {
  //   if (!formatErrors || typeof formatErrors !== 'object') return html;

  //   const parser = new DOMParser();
  //   const doc = parser.parseFromString(html, 'text/html'); 

  //   const regexMap: Record<string, RegExp> = {
  //     multipleSpaceErrors: /\s{2,}/g,
  //     emDashErrors: /[^ ]—|—[^ ]/g,
  //     spaceBeforePunctuationErrors: /\s+([.,!?;:])/g,
  //   };

  //   const elements = Array.from(doc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6'));

  //   elements.forEach((el, index) => {
  //     // Highlight regex-based errors using highlightTextNode
  //     for (const [errorType, regex] of Object.entries(regexMap)) {
  //       const errorList = (formatErrors as any)[errorType] as FormatError[] | undefined;
  //       if (!errorList || errorList.length === 0) continue;

  //       const matchedErrors = errorList.filter(err => err.paragraphIndex === index);
  //       if (matchedErrors.length === 0) continue;

  //       const treeWalker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  //       let node: Text | null;
  //       while ((node = treeWalker.nextNode() as Text | null)) {
  //         if (regex.test(node.textContent || '')) {
  //           regex.lastIndex = 0;
  //           highlightTextNode(node, regex, errorType, doc);
  //         }
  //       }
  //     }

  //     // Missing punctuation errors: highlight last word if paragraph missing punctuation
  //     const missingPunctuationErrors = (
  //       formatErrors.missingPunctuationErrors || []
  //     ).filter(err => err.paragraphIndex === index);
  //     if (missingPunctuationErrors.length > 0) {
  //       const textContent = el.textContent?.trimEnd() || '';
  //       if (!/[.?!]$/.test(textContent)) {
  //         const textNodes: Text[] = [];
  //         const treeWalker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  //         let node: Text | null;
  //         while ((node = treeWalker.nextNode() as Text | null)) {
  //           textNodes.push(node);
  //         }
  //         for (let i = textNodes.length - 1; i >= 0; i--) {
  //           const nodeText = textNodes[i].textContent?.trimEnd() || '';
  //           if (nodeText.length > 0) {
  //             highlightLastWordInTextNode(textNodes[i], 'Missing punctuation error', doc);
  //             break;
  //           }
  //         }
  //       }
  //     }

  //     // Title case errors: highlight lowercase-start words
  //     const titleErrors =
  //       formatErrors?.titleCaseErrors?.filter(err => err.paragraphIndex === index) ?? [];
  //     if (titleErrors.length > 0) {
  //       const treeWalker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  //       let node: Text | null;
  //       while ((node = treeWalker.nextNode() as Text | null)) {
  //         const words = node.textContent?.split(/(\s+)/) || [];
  //         let changed = false;
  //         const frag = doc.createDocumentFragment();

  //         words.forEach(word => {
  //           if (
  //             word.trim() &&
  //             word[0] === word[0].toLowerCase() &&
  //             /[a-z]/.test(word[0])
  //           ) {
  //             const mark = doc.createElement('mark');
  //             mark.className = 'bg-red-300 text-red-700 rounded-sm px-1';
  //             mark.title = 'Title case error';
  //             mark.textContent = word;
  //             frag.appendChild(mark);
  //             changed = true;
  //           } else {
  //             frag.appendChild(doc.createTextNode(word));
  //           }
  //         });

  //         if (changed) {
  //           node.parentNode?.replaceChild(frag, node);
  //         }
  //       }
  //     }

  //     // === Highlight whole paragraph if it has leading/trailing space errors ===
  //     const leadingTrailingErrors = (
  //       formatErrors.leadingTrailingSpaceErrors || []
  //     ).filter(err => err.paragraphIndex === index);

  //     if (leadingTrailingErrors.length > 0) {
  //       // Wrap entire paragraph text inside one <mark>
  //     const mark = doc.createElement('mark');
  //     mark.className = 'highlight-format bg-red-300 text-red-700 rounded-sm px-1';
  //     mark.title = 'Leading or trailing space error';


  //       while (el.firstChild) {
  //         mark.appendChild(el.firstChild);
  //       }

  //       el.appendChild(mark);
  //     }
  //   });

  //   return doc.body.innerHTML;
  // }

  // useEffect(() => {
  //   console.log('[Editor HTML]', htmlString);
  // }, [htmlString]);

  const highlightPhrases = (phrases: string[]) => {
    if (!divRef.current || !phrases.length) return;

    const container = divRef.current as HTMLElement;

    const regex = new RegExp(`\\b(${phrases.map(escapeRegex).join('|')})\\b`, 'gi');

    const walk = (node: Node) => {
      if (
        node.nodeType === Node.TEXT_NODE &&
        regex.test(node.nodeValue || '') &&
        !node.parentElement?.closest('mark.highlight-keyword')
      ) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = (node.nodeValue || '').replace(
          regex,
          match => `<mark class="highlight-keyword bg-yellow-300">${match}</mark>`
        );
        const fragment = document.createDocumentFragment();
        [...tempDiv.childNodes].forEach(n => fragment.appendChild(n));
        node.parentNode?.replaceChild(fragment, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        node.childNodes.forEach(child => walk(child));
      }
    };

    walk(container);
  };


  const removeHighlights = () => {
    removeMarksByClass('highlight-keyword');
  };

const removeFormatHighlights = () => {
  setHighlightedHtml(null);
  removeMarksByClass('highlight-format');
};


  useEffect(() => {
    if (!editMode) {
      if (showKeywordHighlight) {
        onKeywordShowHighlightClick();
      }
      if (showContentIssuesHighlight) {
        onContentIssuesHighlight();
      }
      if (showLinkIssuesHighlight) {
        onLinkIssuesShowHighlightsClick();
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showContentIssuesHighlight,
    showKeywordHighlight,
    showLinkIssuesHighlight,
    editMode,
  ]);

  function removeMarksByClass(className: string) {
    const container = divRef.current as HTMLElement;
    if (!container) return;

    container.querySelectorAll(`mark.${className}`).forEach(mark => {
      const textNode = document.createTextNode(mark.textContent || '');
      mark.replaceWith(textNode);
    });
  }
  
  return (
    <div
      className={clsx(
        'flex flex-col items-center w-[90%] pt-4 px-3 m-auto pb-10',
        'bg-white-100 dark:bg-blue-600'
      )}>
      <h1 className="text-black-100 dark:text-white-100 text-5xl">AK Loom</h1>
      <p className="text-left italic self-start">For writers by developers</p>

      <div className="dark:!bg-[#f7f8fa] dark:!text-black-200 w-full p-5">
        <section className="w-full py-2 gap-5 flex flex-row mb-5">
          <div className="w-1/2">
            <label>Meta Title</label>
            {title && (
              <span>
                {' '}
                - {title.length} {title.length > 1 ? 'characters' : 'character'}
              </span>
            )}
            <input
              type="text"
              value={title}
              className="!w-full py-2"
              onChange={e => setTitle(e.target.value)}
            />
            <div className="w-full h-4 bg-gray-400 rounded-md overflow-hidden mb-5">
              <div
                className={clsx(
                  'h-full transition-width duration-600 ease-[ease]',
                  titleStyle.style
                )}
                style={titleStyle.width}></div>
            </div>

            <label>Meta Description</label>
            <span> - {description.length} characters</span>
            <textarea
              value={description}
              placeholder="Meta Description"
              className="w-full min-h-10 h-25 my-2 dark:text-black-200"
              onChange={e => setDescription(e.target.value)}
            />
            <div className="w-full h-4 bg-gray-400 rounded-md overflow-hidden">
              <div
                className={clsx(
                  'h-full transition-width duration-600 ease-[ease]',
                  descStyle.style
                )}
                style={descStyle.width}></div>
            </div>
          </div>

          <div className="w-1/2 flex flex-col">
            <label>Google Appearance Preview</label>
            <div className="border border-black/17.5 rounded-md p-4 bg-white flex-1 flex flex-col dark:text-black-200">
              <span>Arash Law</span>
              <cite className="text-[12px] leading-[18px]"></cite>
              <h3 className="text-xl truncate text-blue-1000 leading-[1.2] font-medium">
                {title}
              </h3>
              <span className="text-black-200/75 wrap-break-word">{description}</span>
            </div>
          </div>
        </section>

        <section className="w-full py-2 gap-5 flex flex-row">
          <div className="flex-1 flex flex-col">
            <div className="flex flex-row gap-5 mb-4">
              {/* <div className="w-1/2">
                <label>Focus Keyphrase</label>
                <input
                  required
                  type="text"
                  value={focusKeyword}
                  className="!w-full py-2"
                  onChange={e => setFocusKeyword(e.target.value)}
                />
              </div> */}
              <Input
                id="focus-keyword"
                label="Focus Keyphrase"
                name="focus-keyword"
                onInputChange={e => setFocusKeyword(e.target.value)}
                value={focusKeyword}
                error={errorValidate}
                helperText={helperText || 'Keyphrase is required'}
              />
              <div className="w-1/2">
                <label>Alternate ESQ</label>
                <input
                  type="text"
                  value={alternateEsq}
                  placeholder="(optional)"
                  className="!w-full py-2"
                  onChange={e => setAlternateEsq(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-row flex justify-end mb-2 gap-x-2 sticky top-0 bg-white z-1 p-2">
              <span
                className={clsx(
                  'font-medium text-base py-[6px] px-[12px] cursor-pointer',
                  'rounded-md border',
                  editMode ? modeActive : ''
                )}
                onClick={() => {
                  removeHighlights();
                  setEditMode(true);
                }}>
                Edit
              </span>
              <span
                className={clsx(
                  'font-medium text-base py-[6px] px-[12px] cursor-pointer',
                  'rounded-md border',
                  !editMode ? modeActive : ''
                )}
                onClick={() => {
                  highlightPhrases([focusKeyword, alternateEsq].filter(Boolean));
                  setEditMode(false);
                }}>
                Show Output
              </span>
            </div>

            {editMode ? (
              <Editor
                apiKey={TINYMCE_API_KEY}
                onInit={(_, editor) => (editorRef.current = editor)}
                onEditorChange={handleEditorChange}
                value={htmlString}
                init={{
                  height: EDITOR_MIN_HEIGHT,
                  width: '100%',
                  menubar: true,
                  promotion: false,
                  entity_encoding: 'raw',
                  element_format: 'xhtml',
                  extended_valid_elements: 'span[style|id|name|class]',
                  placeholder: 'Type here...',
                  toolbar_mode: 'floating',
                  plugins: [
                    'anchor',
                    'charmap',
                    'codesample',
                    'emoticons',
                    'image',
                    'link',
                    'media',
                    'searchreplace',
                    'table',
                    'visualblocks',
                    'wordcount',
                  ],
                  toolbar:
                    'blocks fontsize | bold italic underline | link image | alignleft indent outdent | emoticons charmap | removeformat',
                  content_style:
                    'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                }}
                ref={divRef as React.Ref<Editor>}
              />
            ) : (
              <div
                className={clsx(
                  'border border-black/17.5 rounded-md p-4 bg-white',
                  minHeightStyle
                )}>
                {highlightedHtml ? (
                  <div
                    className="prose dark:text-black"
                    dangerouslySetInnerHTML={{ __html: addHeadingIds(highlightedHtml) }}
                    ref={divRef as React.Ref<HTMLDivElement>}
                  />
                ) : (
                  <div
                    className="prose dark:text-black"
                    dangerouslySetInnerHTML={{ __html: addHeadingIds(htmlString) }}
                    ref={divRef as React.Ref<HTMLDivElement>}
                  />
                )}
              </div>
            )}
          </div>

          <div className="sticky top-4 self-start max-h-screen overflow-y-auto">
            <LoomSidebar
              editMode={editMode}
              error={error || helperText}
              keywordAnalysisResult={results}
              handleAnalyze={handleKeywordAnalyze}
              contentIssuesResult={contentIssuesResult}
              contentIssuesErrorMessage={contentIssuesErrorMessage}
              text={htmlString}
              keyword={focusKeyword}
              metaTitle={title}
              metaDescription={description}
              onHighlight={highlightPhrases}
              onRemoveHighlight={removeHighlights}
              onFixAll={newHtml => {
                setHtmlString(newHtml);
                if (editorRef.current) {
                  editorRef.current.setContent(newHtml);
                }
              }}
              onFormatHighlight={errors => {
                if (!errors || typeof errors !== 'object' || Array.isArray(errors)) {
                  console.error('Invalid formatErrors object received:', errors);
                  return;
                }

                if (!divRef.current) return;

                setFormatErrors(errors as ErrorList);

                const container = divRef.current as HTMLElement;
                const regexMap: Record<string, RegExp> = {
                  multipleSpaceErrors: /\s{2,}/g,
                  emDashErrors: /[^ ]—|—[^ ]/g,
                  spaceBeforePunctuationErrors: /\s+([.,!?;:])/g,
                };

                const elements = Array.from(container.querySelectorAll('p, h1, h2, h3, h4, h5, h6'));

                elements.forEach((el, index) => {
                  // Regex-based errors
                  for (const [errorType, regex] of Object.entries(regexMap)) {
                    const errorList = (errors as any)[errorType] as FormatError[] | undefined;
                    if (!errorList?.length) continue;

                    const matches = errorList.filter(err => err.paragraphIndex === index);
                    if (!matches.length) continue;

                    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
                    let node: Text | null;

                    while ((node = walker.nextNode() as Text | null)) {
                      if (
                        !node.textContent?.match(regex) ||
                        node.parentElement?.closest('mark.highlight-format')
                      ) {
                        continue;
                      }

                      regex.lastIndex = 0;
                      highlightTextNode(node, regex, errorType, document);
                    }
                  }

                  // Missing punctuation
                  const miss = errors.missingPunctuationErrors?.filter(e => e.paragraphIndex === index) || [];
                  if (miss.length > 0) {
                    const text = el.textContent?.trimEnd() || '';
                    if (!/[.?!]$/.test(text)) {
                      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
                      const textNodes: Text[] = [];
                      let node: Text | null;
                      while ((node = walker.nextNode() as Text | null)) {
                        if (!node.parentElement?.closest('mark.highlight-format')) {
                          textNodes.push(node);
                        }
                      }
                      for (let i = textNodes.length - 1; i >= 0; i--) {
                        const nodeText = textNodes[i].textContent?.trimEnd() || '';
                        if (nodeText.length > 0) {
                          highlightLastWordInTextNode(textNodes[i], 'Missing punctuation error', document);
                          break;
                        }
                      }
                    }
                  }

                  // Title case errors
                  const titleErrors = errors.titleCaseErrors?.filter(e => e.paragraphIndex === index) || [];
                  if (titleErrors.length > 0) {
                    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
                    let node: Text | null;
                    while ((node = walker.nextNode() as Text | null)) {
                      if (!node.textContent?.trim()) continue;

                      const words = node.textContent.split(/(\s+)/);
                      const frag = document.createDocumentFragment();
                      let changed = false;

                      words.forEach(word => {
                        if (
                          word.trim() &&
                          word[0] === word[0].toLowerCase() &&
                          /[a-z]/.test(word[0]) &&
                          !node.parentElement?.closest('mark.highlight-format')
                        ) {
                          const mark = document.createElement('mark');
                          mark.className = 'highlight-format bg-red-300 text-red-700 rounded-sm px-1';
                          mark.title = 'Title case error';
                          mark.textContent = word;
                          frag.appendChild(mark);
                          changed = true;
                        } else {
                          frag.appendChild(document.createTextNode(word));
                        }
                      });

                      if (changed) {
                        node.parentNode?.replaceChild(frag, node);
                      }
                    }
                  }

                  // Leading/trailing space errors
                  const leadTrailErrors = errors.leadingTrailingSpaceErrors?.filter(e => e.paragraphIndex === index) || [];
                  if (leadTrailErrors.length > 0 && !el.querySelector('mark.highlight-format')) {
                    const mark = document.createElement('mark');
                    mark.className = 'highlight-format bg-red-300 text-red-700 rounded-sm px-1';
                    mark.title = 'Leading or trailing space error';

                    while (el.firstChild) {
                      mark.appendChild(el.firstChild);
                    }

                    el.appendChild(mark);
                  }
                });
              }}


              onRemoveFormatHighlight={removeFormatHighlights}
              onHighlightContent={onContentIssuesHighlight}
              onRemoveContentHighlight={removeContentHighlights}
              onKeywordShowHighlightClick={onKeywordShowHighlightClick}
              onKeywordRemoveHighlightClick={onKeywordRemoveHighlightClick}
              onCheckContentIssuesClick={onCheckContentIssuesClick}
              disableContentIssuesButton={!htmlString}
              onLinkIssues={handleAnalyzeLinkIssues}
              onLinkIssuesShowHighlightsClick={onLinkIssuesShowHighlightsClick}
              onLinkIssuesRemoveHighlightClick={onLinkIssuesRemoveHighlightClick}
              linkIssuesResult={linkIssuesResult}
              loadingAnalyzeLink={loadingAnalyzeLink}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Loom;
