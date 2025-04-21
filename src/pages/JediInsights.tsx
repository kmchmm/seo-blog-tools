import { FC } from 'react';
import { IBtnType } from '../types';
import { Button } from '../components/Button';
// import { Loading } from '../components/Loading';
import clsx from 'clsx';

const JediInsights: FC = () => {
  return (
    <div
      className={clsx('flex flex-col w-full pt-4 px-3', 'bg-white-100 dark:bg-blue-600')}>
      <h1 className="text-black-100 dark:text-white-100 text-5xl">AK Jedi Insights</h1>
      <h6 className="italic">Combined On-Page SEO Checker from Wincher and MOZ</h6>
      <div className="flex justify-center items-center w-full gap-4 flex-row">
        <div className="flex items-center justify-center w-1/2 gap-4">
          <input
            className="!border-gray-700"
            type="text"
            // value={keywords}
            // onChange={(e) => setKeywords(e.target.value)}
            placeholder="http://example.org"
            // onKeyDown={(e) => {
            // // if (e.key === 'Enter') handleSearch();
            // }}
          />
          <input
            className="!border-gray-700"
            type="text"
            // value={keywords}
            // onChange={(e) => setKeywords(e.target.value)}
            placeholder="Enter keywords"
            // onKeyDown={(e) => {
            // // if (e.key === 'Enter') handleSearch();
            // }}
          />
          {/* <Button onClick={handleSearch} disabled={loading} btnType={IBtnType.SEARCH}>
            {loading ? 'Searching...' : 'Search'}
          </Button> */}
          <Button
            btnType={IBtnType.SEARCH}
            className="!bg-black-200 !text-white hover:!bg-black dark:!bg-transparent dark:hover:!bg-yellow-100 dark:hover:!text-black-100">
            {'Analyze'}
          </Button>
        </div>
      </div>

      <div className="flex items-center w-1/2 gap-4 mt-5">
        <input
          className="!border-gray-700"
          type="text"
          // value={keywords}
          // onChange={(e) => setKeywords(e.target.value)}
          placeholder="Search URL"
          // onKeyDown={(e) => {
          // // if (e.key === 'Enter') handleSearch();
          // }}
        />
        <Button
          btnType={IBtnType.SEARCH}
          className="!bg-black-200 !text-white hover:!bg-black dark:!bg-transparent dark:hover:!bg-yellow-100 dark:hover:!text-black-100">
          {'Search'}
        </Button>
      </div>

      <div className="paa-table-container m-0 p-0 w-full">
        <table
          className={clsx(
            'w-full my-[20px] mx-auto border-collapse',
            'table-fixed shadow-[0_4px_6px_rgba(0, 0, 0, 0.1)]'
          )}>
          <thead>
            <tr>
              <th className="w-1/2 border border-amber-200">Page</th>
              <th className="w-1/3 border border-amber-200">Keywords</th>
              <th className="w-[120px] !text-center border border-amber-200">MOZ</th>
              <th className="w-[120px] !text-center border border-amber-200">WINCHER</th>
              <th className="w-1/5 border border-amber-200">Requested By</th>
              <th className="w-1/5 border border-amber-200"></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-amber-200">Test</td>
              <td className="border border-amber-200">Test</td>
              <td className="border border-amber-200 !text-center">00</td>
              <td className="border border-amber-200 !text-center ">00</td>
              <td className="border border-amber-200">Test</td>
              <td className="border border-amber-200">Test</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JediInsights;
