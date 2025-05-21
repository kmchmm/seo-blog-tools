import { FC, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Sweep from '../assets/icons/sweep.svg?react';
import { Editor } from '@tinymce/tinymce-react';
import { Editor as TinyMCEEditor } from 'tinymce';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { encode } from 'html-entities';
import { html_beautify, HTMLBeautifyOptions } from 'js-beautify';

import { Button } from '../components/Button';

interface handleDescendantProps {
  element: Element;
  encodeSpecialCharacters: boolean;
  removeClassesAndIds: boolean;
  removeComments: boolean;
  removeEmptyTags: boolean;
  removeImages: boolean;
  removeInlineStyles: boolean;
  removeLinks: boolean;
  removeSpanTags: boolean;
  removeTables: boolean;
  removeTagAttributes: boolean;
  removeTagsWithOneNbsp: boolean;
  replaceTableTagsWithStructuredDivs: boolean;
  setNewLinesAndTextIndents: boolean;
  textOnly: string;
}

const tableReplacementClasses = {
  table: 'table-head',
  tr: 'table-row',
  th: 'table-head',
  td: 'table-cell',
  thead: 'table-head',
  tbody: 'table body',
  tfoot: 'table-foot',
};

const jsBeautifierOptions = {
  indent_size: '4',
  indent_char: ' ',
  max_preserve_newlines: '5',
  preserve_newlines: true,
  keep_array_indentation: false,
  break_chained_methods: false,
  indent_scripts: 'normal',
  brace_style: 'none',
  space_before_conditional: true,
  unescape_strings: false,
  jslint_happy: false,
  end_with_newline: false,
  wrap_line_length: '0',
  indent_inner_html: false,
  comma_first: false,
  e4x: false,
  indent_empty_lines: false,
};

const selfClosingTags = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
];

const isNodeEmpty = (node: ChildNode) => {
  if (selfClosingTags.includes(node.nodeName.toLowerCase())) return false;

  if (node.childNodes.length === 0) {
    return true; // Node has no children
  }

  if (!node.textContent || node.textContent.trim() === '') {
    return true; // Node's text content is empty or whitespace only
  }
};

const isOneNbsp = (node: ChildNode) => {
  // Node has no other children (only text, which is nbsp;)
  if (
    node.childNodes.length === 1 &&
    (node.textContent === '\xA0' || node.textContent === ' ')
  ) {
    return true;
  }

  return false;
};

const recursiveReplace = (str: string, regex: RegExp, replacement: string) => {
  let newStr = str.replace(regex, replacement);
  if (newStr !== str) {
    return recursiveReplace(newStr, regex, replacement);
  }
  return newStr;
};

// we do this to include the actual comment tags (<!--)
// as textContent only includes the actual text inside,
// and no outerHTML/outerXML for the child
const getCommentNodeOuterXML = (comment: ChildNode) => {
  const clone = comment.cloneNode();
  const newParent = document.createElement('p');
  newParent.appendChild(clone);
  return newParent.innerHTML;
};

const tableTags = ['table', 'tr', 'th', 'td', 'thead', 'tbody', 'tfoot'];

// unfortunately, we can't use the textContent property
// (should output all the text content within an element, including inside its children)
// because textContent does not include the comments
// (should be included if `remove comments` is not checked)
const handleDescendants = (props: handleDescendantProps) => {
  const {
    element,
    encodeSpecialCharacters,
    removeClassesAndIds,
    removeComments,
    removeEmptyTags,
    removeImages,
    removeInlineStyles,
    removeLinks,
    removeSpanTags,
    removeTables,
    removeTagAttributes,
    removeTagsWithOneNbsp,
    replaceTableTagsWithStructuredDivs,
    setNewLinesAndTextIndents,
  } = props;
  // textOnly functions as our accumulator for all textContent
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

      if (
        (child.nodeName.toLowerCase() === 'span' && removeSpanTags) ||
        (child.nodeName.toLowerCase() === 'a' && removeLinks) ||
        (removeTables && tableTags.includes(child.nodeName.toLowerCase()))
      ) {
        textOnly = handleDescendants({
          element: child as Element,
          encodeSpecialCharacters,
          removeClassesAndIds,
          removeComments,
          removeEmptyTags,
          removeImages,
          removeInlineStyles,
          removeLinks,
          removeSpanTags,
          removeTables,
          removeTagAttributes,
          removeTagsWithOneNbsp,
          replaceTableTagsWithStructuredDivs,
          setNewLinesAndTextIndents,
          textOnly,
        });
        // remove child node and relocate its children into the parent
        const children = Array.from(child.childNodes);
        child.replaceWith(...children);
        continue;
      }

      if (
        replaceTableTagsWithStructuredDivs &&
        tableTags.includes(child.nodeName.toLowerCase())
      ) {
        textOnly = handleDescendants({
          element: child as Element,
          encodeSpecialCharacters,
          removeClassesAndIds,
          removeComments,
          removeEmptyTags,
          removeImages,
          removeInlineStyles,
          removeLinks,
          removeSpanTags,
          removeTables,
          removeTagAttributes,
          removeTagsWithOneNbsp,
          replaceTableTagsWithStructuredDivs,
          setNewLinesAndTextIndents,
          textOnly,
        });
        // need to use createElementNS in order to avoid automatic attribute of xlmns
        // for all top level child of created element (when using document.createElement)
        const newDiv = document.createElementNS('', 'div');
        if (!removeTagAttributes && !removeClassesAndIds) {
          const classKey =
            child.nodeName.toLowerCase() as keyof typeof tableReplacementClasses;
          newDiv.setAttribute('class', tableReplacementClasses[classKey]);
        }
        newDiv.append(...child.childNodes);
        child.replaceWith(newDiv);

        continue;
      }

      // remove tag attributes
      if (removeTagAttributes) {
        const childAttributes = [...(child as Element).attributes];
        childAttributes.forEach(attr => {
          const nodeName = child.nodeName.toLowerCase();
          // only strip if not img[src] or a[href]
          if (
            !(nodeName === 'img' && attr.name === 'src') &&
            !(nodeName === 'a' && attr.name === 'href')
          )
            (child as Element).removeAttribute(attr.name);
        });
        // remove classes and IDs
      } else {
        if (removeClassesAndIds || removeInlineStyles) {
          if (removeClassesAndIds) {
            (child as Element).removeAttribute('class');
            (child as Element).removeAttribute('id');
          }
          if (removeInlineStyles) {
            (child as Element).removeAttribute('style');
          }
        }
      }

      textOnly = handleDescendants({
        element: child as Element,
        encodeSpecialCharacters,
        removeClassesAndIds,
        removeComments,
        removeEmptyTags,
        removeImages,
        removeInlineStyles,
        removeLinks,
        removeSpanTags,
        removeTables,
        removeTagAttributes,
        removeTagsWithOneNbsp,
        replaceTableTagsWithStructuredDivs,
        setNewLinesAndTextIndents,
        textOnly,
      });
    } else if (child.nodeType === Node.TEXT_NODE) {
      if (encodeSpecialCharacters) {
        const encoded = encode(child.nodeValue, {
          mode: 'nonAscii',
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
        textOnly += getCommentNodeOuterXML(child);
      }
    } else if (child.nodeType === Node.CDATA_SECTION_NODE) {
      textOnly += child.nodeValue;
    }
  }

  return textOnly;
};

const prettifyXML = (xml: String) => {
  let pad = 0;
  const padding = '\u0020'.repeat(4); // set desired indent size here

  xml = xml.replace(/(\r\n|\n|\r)/gm, '\u0020').replace(/>\s+</g, '><');
  xml = xml.replace(/(>)(<)(\/*)/g, '$1\r\n$2$3');

  return xml
    .split('\r\n')
    // .map((node, index) => {
    .map((node) => {
      //XML elements now split into lines
      let indent = 0;
      if (node.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (node.match(/^<\/\w/) && pad > 0) {
        pad -= 1;
      } else if (node.match(/^<[\w^>]*[^\/]>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }
      pad += indent;
      return padding.repeat(pad - indent) + node;
    })
    .join('\r\n');
};

const HtmlCleaner: FC = () => {
  const [htmlString, setHtmlString] = useState<string>('');
  const editorRef = useRef<TinyMCEEditor>(null);
  const [removeTagAttributes, setRemoveTagAttributes] = useState<boolean>(false);
  const [removeInlineStyles, setRemoveInlineStyles] = useState<boolean>(false);
  const [removeClassesAndIds, setRemoveClassesAndIds] = useState<boolean>(false);
  const [removeAllTags, setRemoveAllTags] = useState<boolean>(false);
  const [removeSuccessiveNbsp, setRemoveSuccessiveNbsp] = useState<boolean>(false);
  const [removeEmptyTags, setRemoveEmptyTags] = useState<boolean>(false);
  const [removeTagsWithOneNbsp, setRemoveTagsWithOneNbsp] = useState<boolean>(false);
  const [removeSpanTags, setRemoveSpanTags] = useState<boolean>(false);
  const [removeImages, setRemoveImages] = useState<boolean>(false);
  const [removeLinks, setRemoveLinks] = useState<boolean>(false);
  const [removeTables, setRemoveTables] = useState<boolean>(false);
  const [removeComments, setRemoveComments] = useState<boolean>(false);
  const [replaceTableTagsWithStructuredDivs, setReplaceTableTagsWithStructuredDivs] =
    useState<boolean>(false);
  const [encodeSpecialCharacters, setEncodeSpecialCharacters] = useState<boolean>(false);
  const [setNewLinesAndTextIndents, setSetNewLinesAndTextIndents] =
    useState<boolean>(false);

  const applyCleaningSettings = () => {
    if (editorRef.current) {
      let newString = editorRef.current.getContent();

      try {
        const domParser = new DOMParser();
        // we enclose in a parent p tag to make it a valid xml
        const xmlDoc = domParser.parseFromString(
          `<p>${newString}</p>`,
          'application/xml'
        );
        const root = xmlDoc.documentElement;
        const textOnly = handleDescendants({
          encodeSpecialCharacters,
          element: root,
          removeClassesAndIds,
          removeComments,
          removeEmptyTags,
          removeImages,
          removeInlineStyles,
          removeLinks,
          removeSpanTags,
          removeTables,
          removeTagAttributes,
          removeTagsWithOneNbsp,
          replaceTableTagsWithStructuredDivs,
          setNewLinesAndTextIndents,
          textOnly: '',
        });

        if (removeAllTags) {
          newString = textOnly;
        } else {
          // get innerHTML of enclosing p tag
          newString = root.innerHTML;
        }
      } catch (e) {
        console.error(e);
      } finally {
      }

      // handle re-encoding of ampersand
      newString = newString
        .replace(/&amp;/g, '&')
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"');

      // useful for when extracting text content (1 nbsp from 1 element and another)
      if (removeSuccessiveNbsp) {
        newString = recursiveReplace(newString, /(&nbsp;| | ){2,}/gm, ' ');
      }

      if (setNewLinesAndTextIndents) {
        // first handles `inline` tags such as span, em, strong, etc
        newString = prettifyXML(newString);
        // this pretty much handles everything else
        newString = html_beautify(
          newString,
          jsBeautifierOptions as unknown as HTMLBeautifyOptions
        );
      }
      setHtmlString(newString);
    }
  };

  // const onCodeMirrorChange = (value: string, viewUpdate: ViewUpdate) => {
  const onCodeMirrorChange = (value: string) => {
    setHtmlString(value);
  };

  // const onTinyMCEChange = (e: EditorEvent<Event>) => {
  const onTinyMCEChange = () => {
    if (editorRef.current) {
      setHtmlString(editorRef.current.getContent());
    }
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setContent(htmlString);
    }
  }, [htmlString]);

  return (
    <div
      className={clsx(
        'flex flex-col items-center w-full pt-4 px-3',
        'bg-white-100 dark:bg-blue-600'
      )}>
      <h1 className="text-black-100 dark:text-white-100 text-5xl">HTML Cleaner</h1>
      <p className="text-left italic self-start">You know what it is</p>

      <section className="w-full my-6 p-2">
        <label className="mb-2">Cleaning Options:</label>
        <div className="font-(family-name:--roboto-font) grid grid-cols-3">
          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeTagAttributes"
              checked={removeTagAttributes}
              onChange={e => {
                setRemoveTagAttributes(e.target.checked);
              }}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="removeTagAttributes">
              Remove tag attributes
            </label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeInlineStyles"
              checked={removeInlineStyles}
              onChange={e => {
                setRemoveInlineStyles(e.target.checked);
              }}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="removeInlineStyles">
              Remove inline styles
            </label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeClassesAndIds"
              checked={removeClassesAndIds}
              onChange={e => {
                setRemoveClassesAndIds(e.target.checked);
              }}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="removeClassesAndIds">
              Remove classes and IDs
            </label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeAllTags"
              checked={removeAllTags}
              onChange={e => {
                setRemoveAllTags(e.target.checked);
              }}
            />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="removeAllTags">
              Remove all Tags
            </label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeSuccessiveNbsp"
              checked={removeSuccessiveNbsp}
              onChange={e => {
                setRemoveSuccessiveNbsp(e.target.checked);
              }}
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
              onChange={e => {
                setRemoveEmptyTags(e.target.checked);
              }}
            />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="removeEmptyTags">
              Remove empty tags
            </label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeTagsWithOneNbsp"
              checked={removeTagsWithOneNbsp}
              onChange={e => {
                setRemoveTagsWithOneNbsp(e.target.checked);
              }}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="removeTagsWithOneNbsp">
              Remove tags with one &amp;nbsp;
            </label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeSpanTags"
              checked={removeSpanTags}
              onChange={e => {
                setRemoveSpanTags(e.target.checked);
              }}
            />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="removeSpanTags">
              Remove span tags
            </label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeImages"
              checked={removeImages}
              onChange={e => {
                setRemoveImages(e.target.checked);
              }}
            />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="removeImages">
              Remove Images
            </label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeLinks"
              checked={removeLinks}
              onChange={e => {
                setRemoveLinks(e.target.checked);
              }}
            />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="removeLinks">
              Remove Links
            </label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeTables"
              checked={removeTables}
              onChange={e => {
                setRemoveTables(e.target.checked);
              }}
            />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="removeTables">
              Remove tables
            </label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="removeComments"
              checked={removeComments}
              onChange={e => {
                setRemoveComments(e.target.checked);
              }}
            />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="removeComments">
              Remove comments
            </label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="replaceTableTagsWithStructuredDivs"
              checked={replaceTableTagsWithStructuredDivs}
              onChange={e => {
                setReplaceTableTagsWithStructuredDivs(e.target.checked);
              }}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="replaceTableTagsWithStructuredDivs">
              Replace table tags with structured divs
            </label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="encodeSpecialCharacters"
              checked={encodeSpecialCharacters}
              onChange={e => {
                setEncodeSpecialCharacters(e.target.checked);
              }}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="encodeSpecialCharacters">
              Encode special characters
            </label>
          </div>

          <div>
            <input
              className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle"
              type="checkbox"
              id="setNewLinesAndTextIndents"
              checked={setNewLinesAndTextIndents}
              onChange={e => {
                setSetNewLinesAndTextIndents(e.target.checked);
              }}
            />
            <label
              className="mr-4 cursor-pointer align-middle"
              htmlFor="setNewLinesAndTextIndents">
              Set new lines and text indents
            </label>
          </div>
        </div>
      </section>

      {/**please note that hidden here is being overwritten by flex when editor is instantiated */}
      <section id="editorContainer" className="hidden w-full py-2 gap-5">
        <div className="w-1/2">
          <Editor
            tinymceScriptSrc="../../tinymce/tinymce.min.js"
            licenseKey="gpl"
            onInit={(_evt, editor) => {
              editorRef.current = editor;
              // need to put this in order to avoid flicker of initial editor element (p tag)
              (document.getElementById('editorContainer') as HTMLElement).style.display =
                'flex';
              editor.on('Change', onTinyMCEChange);
              editor.on('keyup', onTinyMCEChange);
            }}
            initialValue=""
            init={{
              height: 450,
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
        <div className="w-1/2 [&_.cm-editor]:bg-white">
          <CodeMirror
            value={htmlString}
            height="400px"
            extensions={[html()]}
            placeholder="Paste your html string here"
            onChange={onCodeMirrorChange}
          />
          <Button
            className={clsx(
              'justify-self-end flex hover:[&_svg]:fill-white-100 mt-2',
              'dark:[&_svg]:fill-yellow-100 dark:hover:[&_svg]:fill-blue-600'
            )}
            onClick={applyCleaningSettings}>
            <Sweep className="w-6" />
            Sweep
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HtmlCleaner;
