import { FC, useMemo, useRef, useState, useEffect } from 'react';
import clsx from 'clsx';
import '../assets/css/Loom.css';

import { Editor } from '@tinymce/tinymce-react';
import { Editor as TinyMCEEditor } from 'tinymce';

import { LoomSidebar } from '../components/LoomSidebar';

const errorLengthStyle = 'bg-red-200';
const warningLengthStyle = 'bg-yellow-200';
const perfectLengthStyle = 'bg-green-100';

interface CONSTRAINT {
  WARNING: number;
  PERFECT: number;
  MAX: number;
}

const TINYMCE_API_KEY = 'p964xz9rbfvw8dgzbv2k8vpw3n70suinf499l1nmbl1ajhks';

const addHeadingAnchors = (html: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  let idCounter = 0;
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

  headings.forEach((el) => {
    if (!el.id) {
      el.id = `heading-${idCounter++}`;
    }
  });

  return doc.body.innerHTML;
};

const EDITOR_MIN_HEIGHT = 450;
const minHeightStyle = 'min-h-[450px]';

const TITLE_CONSTRAINTS: CONSTRAINT = {
  WARNING: 250,
  PERFECT: 350,
  MAX: 510,
};

const DESC_CONSTRAINTS: CONSTRAINT = {
  WARNING: 530,
  PERFECT: 1060,
  MAX: 1360,
};

const modeActive = clsx(
  'bg-black-100 text-white-100',
  'shadow-[inset_0_0px_5px_theme(color-shadow-100),inset_0_1px_8px_0_theme(color-shadow-100)]',
  'dark:bg-yellow-100 dark:text-blue-600 dark:border-blue-600',
  'dark:shadow-[inset_0_0px_5px_theme(color-shadow-200),inset_0_1px_8px_0_theme(color-shadow-200)]'
);

const checkPixelLength = (text: string, constraint: CONSTRAINT) => {
  const tempElement = document.createElement('span');
  tempElement.style.fontSize = '16px';
  tempElement.style.whiteSpace = 'nowrap';
  tempElement.style.visibility = 'hidden';
  tempElement.textContent = text;
  document.body.appendChild(tempElement);
  const pixelWidth = tempElement.offsetWidth;
  document.body.removeChild(tempElement);

  let indicatorWidth: number = 100;
  if (constraint.MAX > pixelWidth) {
    indicatorWidth = (pixelWidth / constraint.MAX) * 100;
  }

  let titleStyle = errorLengthStyle;
  if (constraint.WARNING <= pixelWidth && pixelWidth < constraint.PERFECT)
    titleStyle = warningLengthStyle;
  if (constraint.PERFECT <= pixelWidth && pixelWidth < constraint.MAX)
    titleStyle = perfectLengthStyle;

  return {
    style: titleStyle,
    width: {
      width: `${indicatorWidth}%`,
    },
  };
};

const Loom: FC = () => {
  const [htmlString, setHtmlString] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [focusKeyword, setFocusKeyword] = useState<string>('');
  const [alternateEsq, setAlternateEsq] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(true);
  const editorRef = useRef<TinyMCEEditor>(null);
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  const titleStyle = useMemo(() => checkPixelLength(title, TITLE_CONSTRAINTS), [title]);
  const descStyle = useMemo(() => checkPixelLength(description, DESC_CONSTRAINTS), [description]);

  
  const highlightPhrases = (phrases: string[]) => {
    if (!htmlString) return;

    // Remove previous highlights
    let baseHtml = htmlString.replace(/<mark class="bg-yellow-200">(.*?)<\/mark>/gi, '$1');

    // Filter out empty phrases
    const validPhrases = phrases.filter(Boolean).map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (validPhrases.length === 0) {
      setHighlightedHtml(null);
      return;
    }

    // Build a single regex to highlight all phrases
    const regex = new RegExp(`\\b(${validPhrases.join('|')})\\b`, 'gi');

    // Use a DOM parser to avoid breaking HTML structure
    const parser = new DOMParser();
    const doc = parser.parseFromString(baseHtml, 'text/html');

    const walk = (node: ChildNode) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent!;
        if (regex.test(text)) {
          const span = document.createElement('mark');
          span.className = 'bg-yellow-200';

          // Replace matching words with <mark> inside a fragment
          const replaced = text.replace(regex, (match) => `<mark class="bg-yellow-200">${match}</mark>`);

          // Parse replaced HTML fragment and insert in place of text node
          const frag = document.createRange().createContextualFragment(replaced);
          node.replaceWith(frag);
        }
      } else {
        node.childNodes.forEach(walk);
      }
    };

    doc.body.childNodes.forEach(walk);

    setHighlightedHtml(doc.body.innerHTML);
  };

  useEffect(() => {
    if (!editMode) {
      highlightPhrases([focusKeyword, alternateEsq]);
    } else {
      removeHighlights();
    }
  }, [focusKeyword, alternateEsq, editMode]);

  const removeHighlights = () => {
    setHighlightedHtml(null);
  };

  return (
    <div className={clsx('flex flex-col items-center w-full pt-4 px-3', 'bg-white-100 dark:bg-blue-600')}>
      <h1 className="text-black-100 dark:text-white-100 text-5xl">AK Loom</h1>
      <p className="text-left italic self-start">For writers by developers</p>

      <section className="w-full py-2 gap-5 flex flex-row mb-5">
        <div className="w-1/2">
          <label>Meta Title</label>
          {title.length > 0 && (
            <span>
              <label> - {title.length}</label>
              <label>{title.length > 1 ? ' characters' : ' character'}</label>
            </span>
          )}
          <input type="text" value={title} className="w-full! py-2!" onChange={(e) => setTitle(e.target.value)} />
          <div className="w-full h-4 bg-gray-400 rounded-md overflow-hidden mb-5">
            <div className={clsx('h-full transition-width duration-600 ease-[ease]', titleStyle.style)} style={titleStyle.width}></div>
          </div>

          <label>Meta Description</label>
          <span>
            <label> - {description.length} </label>
            <label>characters</label>
          </span>
          <textarea
            value={description}
            placeholder="Meta Description"
            className="w-full min-h-10 h-25 my-2 dark:text-black-200"
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="w-full h-4 bg-gray-400 rounded-md overflow-hidden">
            <div className={clsx('h-full transition-width duration-600 ease-[ease]', descStyle.style)} style={descStyle.width}></div>
          </div>
        </div>

        <div className="w-1/2 flex flex-col">
          <label>Google Appearance Preview</label>
          <div className={clsx('border border-black/17.5 rounded-md p-4 bg-white', 'flex flex-1 flex-col dark:text-black-200')}>
            <span>Arash Law</span>
            <cite className="text-[12px] leading-[18px]"></cite>
            <h3 className="text-xl truncate text-blue-1000 leading-[1.2] font-medium">{title}</h3>
            <span className="text-black-200/75 wrap-break-word">{description}</span>
          </div>
        </div>
      </section>

      <section className="w-full py-2 gap-5 flex flex-row">
        <div className="flex-1 flex flex-col">
          <div className="flex flex-row gap-5 mb-4">
            <div className="w-1/2">
              <label>Focus Keyphrase</label>
              <input
                type="text"
                value={focusKeyword}
                className="w-full! py-2!"
                onChange={(e) => setFocusKeyword(e.target.value)}
              />
            </div>
            <div className="w-1/2">
              <label>Alternate ESQ</label>
              <input
                type="text"
                value={alternateEsq}
                placeholder="(optional)"
                className="w-full! py-2!"
                onChange={(e) => setAlternateEsq(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-row flex justify-end mb-2">
            <span
              className={clsx(
                'font-medium text-base font-normal leading-[1.5] py-[6px] px-[12px]',
                'rounded-md border border-black-100 inline-block self-end',
                'dark:bg-blue-600 dark:border-yellow-100',
                'transition-colors transition-shadow duration-150 ease-in-out hover:cursor-pointer',
                'rounded-r-none',
                editMode ? modeActive : 'bg-white-100 dark:text-yellow-100'
              )}
              onClick={() => {
                removeHighlights();
                setEditMode(true);
              }}
            >
              Edit
            </span>

            <span
              className={clsx(
                'font-medium text-base font-normal leading-[1.5] py-[6px] px-[12px]',
                'rounded-md border border-black-100 inline-block self-end',
                'dark:bg-blue-600 dark:border-yellow-100',
                'transition-colors transition-shadow duration-150 ease-in-out hover:cursor-pointer',
                'rounded-l-none',
                !editMode ? modeActive : 'bg-white-100 dark:text-yellow-100'
              )}
              onClick={() => {
                highlightPhrases([focusKeyword, alternateEsq].filter(Boolean));
                setEditMode(false);
              }}
            >
              Show Output
            </span>
          </div>

          <div className={editMode ? 'visible' : 'hidden'}>
            {editMode && (
              <Editor
                apiKey={TINYMCE_API_KEY}
                onInit={(_evt, editor) => {
                  editorRef.current = editor;
                }}
                onEditorChange={(content) => setHtmlString(content)}
                initialValue={htmlString}
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
                  plugins: ['anchor', 'charmap', 'codesample', 'emoticons', 'image', 'link', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount'],
                  toolbar: 'blocks fontsize | bold italic underline | link image | alignleft indent outdent | emoticons charmap | removeformat',
                  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                }}
              />
            )}
          </div>

          <div className={clsx('border border-black/17.5 rounded-md p-4 bg-white', minHeightStyle, editMode ? 'hidden' : 'visible')}>
            {!editMode && (
              <div className="prose dark:text-black"
                dangerouslySetInnerHTML={{
                  __html: addHeadingAnchors(highlightedHtml ? highlightedHtml : htmlString),
                }}
              />


            )}
          </div>
        </div>
          <div className="sticky top-4 self-start max-h-screen overflow-y-auto">
            <LoomSidebar
              text={htmlString}
              keyword={focusKeyword}
              metaTitle={title}
              metaDescription={description}
              onHighlight={highlightPhrases}
              onRemoveHighlight={removeHighlights}
            />
          </div>
      </section>
    </div>
  );
};

export default Loom;
