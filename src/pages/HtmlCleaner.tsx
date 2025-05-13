import { FC, useRef, useState } from 'react';
import clsx from 'clsx';
import { Button } from '../components/Button';
import Sweep from '../assets/icons/sweep.svg?react';
import { Editor } from '@tinymce/tinymce-react';
import { Editor as TinyMCEEditor, EditorEvent } from 'tinymce';
import CodeMirror, { ViewUpdate } from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';

import { decode, encode } from 'html-entities';
import { text } from 'stream/consumers';

// export const encodeTagCharacters = (unsafe: string) => {
//   return unsafe
//     .replace(/&/g, '&amp;')
//     .replace(/</g, '&lt;')
//     .replace(/>/g, '&gt;');
// };

// unfortunately, we can't use the textContent property
// (should output all the text content within an element, including inside its children)
// because textContent does not include the comments
// (should be included if `remove comments` is not checked)
const handleDescendants = (
  element: Element,
  textOnly: string,
  isEncode: boolean,
  removeComments: boolean
) => {
  for (const child of element.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      console.log(child)
      console.log(child.nodeName);
      textOnly = handleDescendants(child as Element, textOnly, isEncode, removeComments);
    } else if (child.nodeType === Node.TEXT_NODE) {
      if (isEncode) {
        const encoded = encode(child.nodeValue, {
          mode: 'nonAscii'
        });
        child.nodeValue = encoded;
        textOnly += encoded;
      } else {
        textOnly += child.nodeValue;
      }
    } else if (child.nodeType === Node.COMMENT_NODE) {
      if (removeComments) {
        child.parentNode?.removeChild(child);
      } else {
        textOnly+= child.nodeValue;
      }
    }
    else if (child.nodeType === Node.CDATA_SECTION_NODE) {
      textOnly+= child.nodeValue;
    }    
  }

  return textOnly;
};

const HtmlCleaner: FC = () => {
  const [ htmlString, setHtmlString ] = useState<string>('')
  const editorRef = useRef<TinyMCEEditor>(null);
  const [ removeTagAttributes, setRemoveTagAttributes ] = useState<boolean>(false);
  const [ removeInlineStyles, setRemoveInlineStyles ] = useState<boolean>(false);
  const [ removeClassesAndIds, setRemoveClassesAndIds ] = useState<boolean>(false);
  const [ removeAllTags, setRemoveAllTags ] = useState<boolean>(false);
  const [ removeSuccessiveNbps, setRemoveSuccessiveNbps ] = useState<boolean>(false);
  const [ removeEmptyTags, setRemoveEmptyTags ] = useState<boolean>(false);
  const [ removeTagsWithOneNbps, setRemoveTagsWithOneNbps ] = useState<boolean>(false);
  const [ removeSpanTags, setRemoveSpanTags ] = useState<boolean>(false);
  const [ removeImages, setRemoveImages ] = useState<boolean>(false);
  const [ removeLinks, setRemoveLinks ] = useState<boolean>(false);
  const [ removeTables, setRemoveTables ] = useState<boolean>(false);
  const [ removeComments, setRemoveComments ] = useState<boolean>(false);
  const [
    replaceTableTagsWithStructuredDivs,
    setReplaceTableTagsWithStructuredDivs
  ] = useState<boolean>(false);
  const [ encodeSpecialCharacters, setEncodeSpecialCharacters ] = useState<boolean>(true);
  const [ setNewLinesAndTextIndents, setSetNewLinesAndTextIndents ] = useState<boolean>(false);

  const log = () => {
    if (editorRef.current) {
      console.log(editorRef.current.getContent());
    }
  };

  const applyCleaningSettings = () => {
    if (editorRef.current) {
      let newString = editorRef.current.getContent()

      try {
        const domParser = new DOMParser();
        // we enclose in a parent p tag to make it a valid xml
        const xmlDoc = domParser.parseFromString(`<p>${newString}</p>`, "application/xml");
        const root = xmlDoc.documentElement;
        console.log(newString);
        // console.log(' - - - - ')
        // console.log(root);
        // console.log(root.textContent)
        const textOnly = handleDescendants(root, '', encodeSpecialCharacters, removeComments);

        if (removeAllTags) {
          newString = textOnly;
        } else {
          // get innerHTML of enclosing p tag
          // handle re-encoding of ampersand
          newString = root.innerHTML
            .replace(/&amp;/g, '&')
            .replace(/&apos;/g, '\'')
            .replace(/&quot;/g, '"');
        }
      } catch (e) {
        console.error(e);
      } finally {

      }

      setHtmlString(newString);
    }    
  }

  const onCodeMirrorChange = (value: string, viewUpdate: ViewUpdate) => {
    if (editorRef.current) {
      editorRef.current.setContent(value);
    }
  }

  const onTinyMCEChange = (e: EditorEvent<Event>) => {
    if (editorRef.current) {
      setHtmlString(editorRef.current.getContent())
    }
  }

  return (
    <div
      className={clsx(
        'flex flex-col items-center w-full pt-4 px-3',
        'bg-white-100 dark:bg-blue-600'
      )}>
      <h1 className="text-black-100 dark:text-white-100 text-5xl">HTML Cleaner</h1>
      <p className="text-left italic self-start">You know what it is</p>

      <section className="w-full my-6 p-2">
        <label className="mb-2" >Cleaning Options:</label>
        <div className="font-(family-name:--roboto-font) grid grid-cols-3">
          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeTagAttributes"
              checked={removeTagAttributes}
              onChange={e => {setRemoveTagAttributes(e.target.checked)}}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="removeTagAttributes">
              Remove tag
              attributes</label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeInlineStyles"
              checked={removeInlineStyles}
              onChange={e => {setRemoveInlineStyles(e.target.checked)}}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="removeInlineStyles">
              Remove inline
              styles</label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeClassesAndIds"
              checked={removeClassesAndIds}
              onChange={e => {setRemoveClassesAndIds(e.target.checked)}}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="removeClassesAndIds">
              Remove classes
              and IDs</label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeAllTags"
              checked={removeAllTags}
              onChange={e => {setRemoveAllTags(e.target.checked)}}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="removeAllTags">
              Remove all
              Tags</label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeSuccessiveNbps"
              checked={removeSuccessiveNbps}
              onChange={e => {setRemoveSuccessiveNbps(e.target.checked)}}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="removeSuccessiveNbps">
              Remove successive
              &nbps;</label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeEmptyTags"
              checked={removeEmptyTags}
              onChange={e => {setRemoveEmptyTags(e.target.checked)}}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="removeEmptyTags">
              Remove empty
              tags</label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeTagsWithOneNbps"
              checked={removeTagsWithOneNbps}
              onChange={e => {setRemoveTagsWithOneNbps(e.target.checked)}}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="removeTagsWithOneNbps">
              Remove tags
              with one &nbps;</label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeSpanTags"
              checked={removeSpanTags}
              onChange={e => {setRemoveSpanTags(e.target.checked)}}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="removeSpanTags">
              Remove span
              tags</label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeImages"
              checked={removeImages}
              onChange={e => {setRemoveImages(e.target.checked)}}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="removeImages">
              Remove Images
            </label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeLinks"
              checked={removeLinks}
              onChange={e => {setRemoveLinks(e.target.checked)}}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="removeLinks">
              Remove Links
            </label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeTables"
              checked={removeTables}
              onChange={e => {setRemoveTables(e.target.checked)}}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="removeTables">
              Remove tables
            </label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeComments"
              checked={removeComments}
              onChange={e => {setRemoveComments(e.target.checked)}}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="removeComments">
              Remove comments
            </label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="replaceTableTagsWithStructuredDivs"
              checked={replaceTableTagsWithStructuredDivs}
              onChange={e => {setReplaceTableTagsWithStructuredDivs(e.target.checked)}}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="replaceTableTagsWithStructuredDivs">
              Replace table
              tags with structured divs</label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="encodeSpecialCharacters"
              checked={encodeSpecialCharacters}
              onChange={e => {setEncodeSpecialCharacters(e.target.checked)}}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="encodeSpecialCharacters">
              Encode special
              characters</label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="setNewLinesAndTextIndents"
              checked={setNewLinesAndTextIndents}
              onChange={e => {setSetNewLinesAndTextIndents(e.target.checked)}}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="setNewLinesAndTextIndents">
              Set new
              lines and text indents</label>
          </div>
        </div>
      </section>

      { /**please note that hidden here is being overwritten by flex when editor is instantiated */ }
      <section id="editorContainer" className="hidden w-full py-2 gap-5">
        <div className="w-1/2">
          <Editor
            tinymceScriptSrc='../../tinymce/tinymce.min.js'
            licenseKey='gpl'
            onInit={(_evt, editor) => {
              editorRef.current = editor;
              // need to put this in order to avoid flicker of initial editor element (p tag)
              (document.getElementById('editorContainer') as HTMLElement)
                .style.display = 'flex';
              editor.on('Change', onTinyMCEChange);
              editor.on('keyup', onTinyMCEChange);
            }}
            initialValue=''
            init={{
              height: 450,
              menubar: true,
              promotion: false,
              // needed especially for nbsp;
              entity_encoding: 'raw',
              element_format: 'xhtml',
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
                'wordcount'
              ],
              toolbar: 'blocks fontsize | bold italic underline | link image |' +
                ' alignleft indent outdent | emoticons charmap | removeformat',
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
            }}
          />
        </div>
        <div className="w-1/2 [&_.cm-editor]:bg-white">
          <CodeMirror
            value={htmlString}
            height="400px"
            extensions={[html()]}
            placeholder="Paste your html string here"
            onChange={onCodeMirrorChange} />
          <Button
          className={clsx(
            'justify-self-end flex hover:[&_svg]:fill-white-100 mt-2',
            'dark:[&_svg]:fill-yellow-100 dark:hover:[&_svg]:fill-blue-600'
          )}
          onClick={applyCleaningSettings}
        >
          <Sweep className='w-6'/>Sweep
        </Button>
        </div>
      </section>
    </div>
  );
};

export default HtmlCleaner;
