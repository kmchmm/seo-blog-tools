import { FC } from 'react';
import clsx from 'clsx';
import { Button } from '../components/Button';
import Sweep from '../assets/icons/sweep.svg?react';

const HtmlCleaner: FC = () => {
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
            <input className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle" type="checkbox" id="removeTagAttributes" />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="removeTagAttributes">Remove tag attributes</label>
          </div>

          <div>
            <input className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle" type="checkbox" id="removeInlineStyles" />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="removeInlineStyles">Remove inline styles</label>
          </div>

          <div>
            <input className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle" type="checkbox" id="removeClassesAndIds" />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="removeClassesAndIds">Remove classes and IDs</label>
          </div>

          <div>
            <input className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle" type="checkbox" id="removeAllTags" />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="removeAllTags">Remove all Tags</label>
          </div>

          <div>
            <input className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle" type="checkbox" id="removeSuccessiveNbps" />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="removeSuccessiveNbps">Remove successive &nbps;</label>
          </div>

          <div>
            <input className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle" type="checkbox" id="removeEmptyTags" />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="removeEmptyTags">Remove empty tags</label>
          </div>

          <div>
            <input className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle" type="checkbox" id="removeTagsWithOneNbps" />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="removeTagsWithOneNbps">Remove tags with one &nbps;</label>
          </div>

          <div>
            <input className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle" type="checkbox" id="removeSpanTags" />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="removeSpanTags">Remove span tags</label>
          </div>

          <div>
            <input className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle" type="checkbox" id="removeImages" />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="removeImages">Remove Images</label>
          </div>

          <div>
            <input className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle" type="checkbox" id="removeLinks" />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="removeLinks">Remove Links</label>
          </div>

          <div>
            <input className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle" type="checkbox" id="removeTables" />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="removeTables">Remove tables</label>
          </div>

          <div>
            <input className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle" type="checkbox" id="removeComments" />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="removeComments">Remove comments</label>
          </div>

          <div>
            <input className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle" type="checkbox" id="removeTableTagsWithStructuredDivs" />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="removeTableTagsWithStructuredDivs">Remove table tags with structured divs</label>
          </div>

          <div>
            <input className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle" type="checkbox" id="encodeSpecialCharacters" />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="encodeSpecialCharacters">Encode special characters</label>
          </div>

          <div>
            <input className="m-2 ml-0 cursor-pointer h-5 w-5 align-middle" type="checkbox" id="setNewLinesAndTextIndents" />
            <label className="mr-4 cursor-pointer align-middle" htmlFor="setNewLinesAndTextIndents">Set new lines and text indents</label>
          </div>
        </div>
      </section>

      <Button className="self-start flex hover:[&_svg]:fill-white-100 dark:[&_svg]:fill-yellow-100 dark:hover:[&_svg]:fill-blue-600" ><Sweep/>Sweep</Button>
    </div>
  );
};

export default HtmlCleaner;
