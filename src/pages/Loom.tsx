import { FC, useRef, useState } from 'react';
import clsx from 'clsx';

import { Editor } from '@tinymce/tinymce-react';
import { Editor as TinyMCEEditor, EditorEvent } from 'tinymce';

import { Button } from '../components/Button';

const Loom: FC = () => {
  const [tab, setTab] = useState<string>('');
  const [htmlString, setHtmlString] = useState<string>('');
  const editorRef = useRef<TinyMCEEditor>(null);

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
      <Button className="my-6 self-start" >Run Checks</Button>
      
      <section className="w-full py-2 gap-5 flex flex-row">
        <div className="w-1/2 min-h-[450px] rounded-md border"></div>
        <div id="editorContainer" className="w-1/2 mt-[-2px]">
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
              // we use 452 to counteract with the 2px border
              height: 452,
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
      </section>
    </div>
  );
};

export default Loom;
