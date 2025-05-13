import { FC, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Button } from '../components/Button';
import Sweep from '../assets/icons/sweep.svg?react';
import { Editor } from '@tinymce/tinymce-react';
import { Editor as TinyMCEEditor, EditorEvent } from 'tinymce';
import CodeMirror, { ViewUpdate } from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';

import { encode } from 'html-entities';

// export const encodeTagCharacters = (unsafe: string) => {
//   return unsafe
//     .replace(/&/g, '&amp;')
//     .replace(/</g, '&lt;')
//     .replace(/>/g, '&gt;');
// };

// removeTagAttributes
// removeInlineStyles
// removeClassesAndIds
// setNewLinesAndTextIndents

interface handleDescendantProps {
  element: Element,
  encodeSpecialCharacters: boolean,
  removeComments: boolean,
  removeEmptyTags: boolean,
  removeImages: boolean,
  removeLinks: boolean,
  removeSpanTags: boolean,
  removeTables: boolean,
  removeTagAttributes: boolean,
  removeTagsWithOneNbsp: boolean,
  replaceTableTagsWithStructuredDivs: boolean,
  textOnly: string,
}

const tableReplacementClasses = {
  'table' : 'table-head',
  'tr' : 'table-row',
  'th' : 'table-head',
  'td' : 'table-cell',
  'thead' : 'table-head',
  'tbody' : 'table body',
  'tfoot' : 'table-foot'
}

const selfClosingTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

const isNodeEmpty = (node: ChildNode) => {
  if (selfClosingTags.includes(node.nodeName.toLowerCase())) return false;

  if (node.childNodes.length === 0) {
    return true; // Node has no children
  }

  if (!node.textContent || node.textContent === '') {
    return true; // Node's text content is empty or whitespace only
  }
}

const isOneNbsp = (node: ChildNode) => {
  // Node has no children (only text, which is nbsp;) 
  if (node.childNodes.length === 1 &&
    (node.textContent === '\xA0' ||
    node.textContent === ' ')) {
    return true; 
  }

  return false;
}

const recursiveReplace = (str: string, regex: RegExp, replacement: string) => {
  let newStr = str.replace(regex, replacement);
  if (newStr !== str) {
    return recursiveReplace(newStr, regex, replacement);
  }
  return newStr;
}

const getCommentNodeOuterXML = (comment: ChildNode) => {
  const clone = comment.cloneNode();
  const newParent = document.createElement('p');
  newParent.appendChild(clone);
  return newParent.innerHTML;
}

const tableTags = ['table', 'tr', 'th', 'td', 'thead', 'tbody', 'tfoot'];

// unfortunately, we can't use the textContent property
// (should output all the text content within an element, including inside its children)
// because textContent does not include the comments
// (should be included if `remove comments` is not checked)
const handleDescendants = (props: handleDescendantProps) => {
  const {
    element,
    encodeSpecialCharacters,
    removeComments,
    removeEmptyTags,
    removeImages,
    removeLinks,
    removeSpanTags,
    removeTables,
    removeTagAttributes,
    removeTagsWithOneNbsp,
    replaceTableTagsWithStructuredDivs,
  } = props;
  let { textOnly } = props;

  for (const child of element.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      if (removeEmptyTags && isNodeEmpty(child)) {
        child.parentNode?.removeChild(child);
        continue;
      }

      if (removeTagsWithOneNbsp && isOneNbsp(child)) {
        child.parentNode?.removeChild(child);
        continue;
      }

      if (child.nodeName.toLowerCase() === 'img' && removeImages) {
        child.parentNode?.removeChild(child);
        continue;
      }

      if ((child.nodeName.toLowerCase() === 'span' && removeSpanTags) ||
        (child.nodeName.toLowerCase() === 'a' && removeLinks) || 
        (removeTables && tableTags.includes(child.nodeName.toLowerCase()))
      ) {

        textOnly = handleDescendants({
          element: child as Element,
          encodeSpecialCharacters,
          removeComments,
          removeEmptyTags,
          removeImages,
          removeLinks,
          removeSpanTags,
          removeTables,
          removeTagAttributes,
          removeTagsWithOneNbsp,
          replaceTableTagsWithStructuredDivs,
          textOnly,
        });
        const children = Array.from(child.childNodes)
        child.replaceWith(... children)
        continue;
      }

      if (replaceTableTagsWithStructuredDivs &&
        tableTags.includes(child.nodeName.toLowerCase())) {
        
        textOnly = handleDescendants({
          element: child as Element,
          encodeSpecialCharacters,
          removeEmptyTags,
          removeComments,
          removeImages,
          removeLinks,
          removeSpanTags,
          removeTables,
          removeTagAttributes,
          removeTagsWithOneNbsp,
          replaceTableTagsWithStructuredDivs,
          textOnly,
        });
        // need to use createElementNS in order to avoid automatic attribute of xlmns
        // for all top level child of created element (when using document.createElement)
        const newDiv = document.createElementNS('', 'div');
        const classKey = child.nodeName.toLowerCase() as keyof typeof tableReplacementClasses;
        newDiv.setAttribute('class', tableReplacementClasses[classKey])
        newDiv.append(...child.childNodes);
        child.replaceWith(newDiv);

        continue;
      }

      // remove tag attributes
      if (removeTagAttributes) {
        console.log((child as Element).attributes)
        // [...child.attributes].forEach(attr => elem.removeAttribute(attr.name));
      }

      textOnly = handleDescendants({
        element: child as Element,
        encodeSpecialCharacters,
        removeComments,
        removeEmptyTags,
        removeImages,
        removeLinks,
        removeSpanTags,
        removeTables,
        removeTagAttributes,
        removeTagsWithOneNbsp,
        replaceTableTagsWithStructuredDivs,
        textOnly,
      });
    } else if (child.nodeType === Node.TEXT_NODE) {
      if (encodeSpecialCharacters) {
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
        textOnly+= getCommentNodeOuterXML(child);
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
  const [ removeSuccessiveNbsp, setRemoveSuccessiveNbsp ] = useState<boolean>(false);
  const [ removeEmptyTags, setRemoveEmptyTags ] = useState<boolean>(false);
  const [ removeTagsWithOneNbsp, setRemoveTagsWithOneNbsp ] = useState<boolean>(false);
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

      // initial remove of nbsp, useful for removing tags with one nbsp
      if (removeSuccessiveNbsp) {
        newString = recursiveReplace(newString, /(&nbsp;| )+/gm, ' ');
      }

      try {
        const domParser = new DOMParser();
        // we enclose in a parent p tag to make it a valid xml
        const xmlDoc = domParser.parseFromString(`<p>${newString}</p>`, "application/xml");
        const root = xmlDoc.documentElement;
        const textOnly = handleDescendants({
          encodeSpecialCharacters,
          element: root,
          removeComments,
          removeEmptyTags,
          removeImages,
          removeLinks,
          removeSpanTags,
          removeTables,
          removeTagAttributes,
          removeTagsWithOneNbsp,
          replaceTableTagsWithStructuredDivs,
          textOnly: '',
        });

        if (removeAllTags) {
          newString = textOnly;
        } else {
          // get innerHTML of enclosing p tag
          // handle re-encoding of ampersand
          newString = root.innerHTML;
        }
      } catch (e) {
        console.error(e);
      } finally {

      }

      newString = newString
        .replace(/&amp;/g, '&')
        .replace(/&apos;/g, '\'')
        .replace(/&quot;/g, '"');

      // final remove of nbsp
      // useful for when extracting text content (1 nbsp from 1 element and another)
      if (removeSuccessiveNbsp) {
        newString = recursiveReplace(newString, /(&nbsp;| )+/gm, ' ');
      }

      setHtmlString(newString);
    }    
  }

  const onCodeMirrorChange = (value: string, viewUpdate: ViewUpdate) => {
    setHtmlString(value);
  }

  const onTinyMCEChange = (e: EditorEvent<Event>) => {
    if (editorRef.current) {
      setHtmlString(editorRef.current.getContent())
    }
  }

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setContent(htmlString);
    }
  }, [htmlString])

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
              id="removeSuccessiveNbsp"
              checked={removeSuccessiveNbsp}
              onChange={e => {setRemoveSuccessiveNbsp(e.target.checked)}}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="removeSuccessiveNbsp">
              Remove successive &amp;nbsp;
            </label>
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
              id="removeTagsWithOneNbsp"
              checked={removeTagsWithOneNbsp}
              onChange={e => {setRemoveTagsWithOneNbsp(e.target.checked)}}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="removeTagsWithOneNbsp">
              Remove tags
              with one &amp;nbsp;</label>
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
              extended_valid_elements: 'span',
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
