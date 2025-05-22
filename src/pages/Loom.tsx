import { FC, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';

import { Editor } from '@tinymce/tinymce-react';
import { Editor as TinyMCEEditor, EditorEvent } from 'tinymce';

import { LoomSidebar } from '../components/LoomSidebar';

const errorLengthStyle = 'bg-red-200';
const warningLengthStyle = 'bg-yellow-200';
const perfectLengthStyle = 'bg-green-100';
interface CONSTRAINT {
  WARNING : number,
  PERFECT : number,
  MAX : number
}

const EDITOR_MIN_HEIGHT = 450;
const minHeghtStyle = 'min-h-[450px]';

// based relatively on previous AK Loom tool
const TITLE_CONSTRAINTS: CONSTRAINT = {
  WARNING : 250,
  PERFECT : 350,
  MAX : 510
}

const DESC_CONSTRAINTS: CONSTRAINT = {
  WARNING : 530,
  PERFECT : 1060,
  MAX : 1360
}

const modeActive = clsx(
  'bg-black-100 text-white-100',
  'shadow-[inset_0_0px_5px_theme(color-shadow-100),inset_0_1px_8px_0_theme(color-shadow-100)]',
  'dark:bg-yellow-100 dark:text-blue-600 dark:border-blue-600',
  'dark:shadow-[inset_0_0px_5px_theme(color-shadow-200),inset_0_1px_8px_0_theme(color-shadow-200)]'
);

const  checkPixelLength = (text: string, constraint: CONSTRAINT) => {
  const tempElement = document.createElement('span');
  // tempElement.style.fontFamily = 'Arial, sans-serif';
  tempElement.style.fontSize = '16px';
  tempElement.style.whiteSpace = 'nowrap';
  tempElement.style.visibility = 'hidden';
  tempElement.textContent = text;
  document.body.appendChild(tempElement);
  const pixelWidth = tempElement.offsetWidth;
  console.log(pixelWidth);
  document.body.removeChild(tempElement);

  let indicatorWidth:number = 100;
  if (constraint.MAX > pixelWidth) {
    indicatorWidth = (pixelWidth / constraint.MAX) * 100;
  }

  let titleStyle = errorLengthStyle
  if (constraint.WARNING <= pixelWidth &&
    pixelWidth < constraint.PERFECT) titleStyle = warningLengthStyle;
  if (constraint.PERFECT <= pixelWidth &&
    pixelWidth < constraint.MAX) titleStyle = perfectLengthStyle;

  return {
    style : titleStyle,
    width : {
      width: `${indicatorWidth}%`
    }
  };
}

const Loom: FC = () => {
  const [htmlString, setHtmlString] = useState<string>('');
  const [ title, setTitle ] = useState<string>('');
  const [ description, setDescription ] = useState<string>('');
  const [ focusKeyword, setFocusKeyword ] = useState<string>('');
  const [ alternateEsq, setAlternateEsq ] = useState<string>('');
  const [ editMode, setEditMode ] = useState<boolean>(true);
  const editorRef = useRef<TinyMCEEditor>(null);

  const titleStyle = useMemo(() => 
    checkPixelLength(title, TITLE_CONSTRAINTS)
  , [title])

  const descStyle = useMemo(() => 
    checkPixelLength(description + 20, DESC_CONSTRAINTS)
  , [description])

  const onTinyMCEChange = (e: EditorEvent<Event>) => {
    if (editorRef.current) {
      setHtmlString(editorRef.current.getContent());
    }
  };

  return (
    <div
      className={clsx(
        'flex flex-col items-center w-full pt-4 px-3',
        'bg-white-100 dark:bg-blue-600'
      )}>
      <h1 className="text-black-100 dark:text-white-100 text-5xl">AK Loom</h1>
      <p className="text-left italic self-start">For writers by developers</p>
      
      <section className="w-full py-2 gap-5 flex flex-row mb-5">
        <div className="w-1/2">
          <label>Meta Title</label>
          { (title.length > 0) &&
            <span>
              <label> - {title.length}</label>
              <label>{ title.length > 1 ? ' characters' : ' character'}</label>
            </span>
          }
          <input
            type="text"
            value={title}
            className="w-full! py-2!"
            onChange={e => setTitle(e.target.value)}
          />
          <div className="w-full h-4 bg-gray-400 rounded-md overflow-hidden mb-5">
            <div className={clsx(
              "h-full transition-width duration-600 ease-[ease]",
              titleStyle.style
            )} style={titleStyle.width}></div>
          </div>

          <label>Meta Description</label>
          <span>
            <label> - {description.length + 20} </label>
            <label>characters</label>
          </span>
          <textarea
            value={description}
            placeholder='Meta Description'
            className="w-full min-h-10 h-25 my-2 dark:text-black-200"
            onChange={e => setDescription(e.target.value)}
          />
          <div className="w-full h-4 bg-gray-400 rounded-md overflow-hidden">
            <div className={clsx(
              "h-full transition-width duration-600 ease-[ease]",
              descStyle.style
            )} style={descStyle.width}></div>
          </div>
        </div>
        <div className="w-1/2 flex flex-col">
          <label>Google Appearance Preview</label>
          <div className={clsx(
            'border border-black/17.5 rounded-md p-4 bg-white',
            'flex flex-1 flex-col dark:text-black-200'
          )}>
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
            <div className="w-1/2">
              <label>Focus Keyphrase</label>
              <input
                type="text"
                value={focusKeyword}
                className="w-full! py-2!"
                onChange={e => setFocusKeyword(e.target.value)}
              />
            </div>
            <div className="w-1/2">
              <label>Alternate ESQ</label>
              <input
                type="text"
                value={alternateEsq}
                placeholder="(optional)"
                className="w-full! py-2!"
                onChange={e => setAlternateEsq(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex-row flex justify-end mb-2">
              <span
                className={clsx(
                  'font-medium text-base font-normal leading-[1.5] py-[6px] px-[12px]',
                  'rounded-md border border-black-100 inline-block self-end',
                  'dark:bg-blue-600 dark:border-yellow-100',
                  'transition-colors transition-shadow duration-150 ease-in-out hover:cursor-pointer',
                  'rounded-r-none',
                  editMode ? modeActive : 'bg-white-100 dark:text-yellow-100 '
                )}
                onClick={() => setEditMode(true)}
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
                  !editMode ? modeActive : 'bg-white-100 dark:text-yellow-100 '
                )}
                onClick={() => setEditMode(false)}
            >
              Show Output
            </span>
            </div>
            {/**please note that hidden here is being overwritten by flex when editor is instantiated */}
            <div className={editMode ? 'visible' : 'hidden'}>
              <div id="loomEditorContainer" className="hidden flex-1 w-full mt-6]">
              <Editor
                tinymceScriptSrc="../../tinymce/tinymce.min.js"
                licenseKey="gpl"
                onInit={(_evt, editor) => {
                  editorRef.current = editor;
                  // need to put this in order to avoid flicker of initial editor element (p tag)
                  (document.getElementById('loomEditorContainer') as HTMLElement).style.display =
                    'flex';
                  editor.on('Change', onTinyMCEChange);
                  editor.on('keyup', onTinyMCEChange);
                }}
                initialValue=""
                init={{
                  height: EDITOR_MIN_HEIGHT,
                  width: '100%',
                  menubar: true,
                  promotion: false,
                  // needed especially for nbsp;
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
                    'blocks fontsize | bold italic underline | link image |' +
                    ' alignleft indent outdent | emoticons charmap | removeformat',
                  content_style:
                    'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                }}
              />
              </div>
            </div>
            <div className={clsx(
              'border border-black/17.5 rounded-md p-4 bg-white',
              minHeghtStyle,
              editMode ? 'hidden' : 'visible'
            )}></div>
          </div>
        </div>
        <LoomSidebar
          text={htmlString}
          keyword={focusKeyword}
          metaTitle={title}
          metaDescription={description}
        />
      </section>
    </div>
  );
};

export default Loom;
