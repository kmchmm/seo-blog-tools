import { FC } from 'react';
import { IBtnType } from '../types';
import { Button } from '../components/Button';
import clsx from 'clsx';

import RefreshScore from '../assets/icons/refresh-score.svg?react';

const SERPRank: FC = () => {
  return (
    <div
      className={clsx('flex flex-col w-full pt-4 px-3', 'bg-white-100 dark:bg-blue-600')}>
      <h1 className="text-black-100 dark:text-white-100 text-5xl">AK SERP Checker</h1>
      <h6 className="italic">Our SERPChecker TOOL. (RANKING TOOL)</h6>
      <div className="flex items-center w-full gap-4 flex-row">
        <div className="flex items-center w-1/2 gap-4">
          <input
            className="!border-gray-700 !w-1/2"
            type="text"
            // value={keywords}
            // onChange={(e) => setKeywords(e.target.value)}
            placeholder="Enter Keyword"
            // onKeyDown={(e) => {
            // // if (e.key === 'Enter') handleSearch();
            // }}
          />
          <input
            className="!border-gray-700 !w-1/2"
            type="text"
            // value={keywords}
            // onChange={(e) => setKeywords(e.target.value)}
            placeholder="URL (Don't put HTTPs: e.g. arashlaw.com"
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
            {'Check'}
          </Button>
        </div>
      </div>

      <div className="paa-table-container m-0 p-0 w-full">
        <table
          className={clsx(
            'w-full my-[20px] mx-auto border-collapse',
            'table-fixed shadow-[0_4px_6px_rgba(0, 0, 0, 0.1)]'
          )}>
          <thead>
            <tr>
              <th className="w-1/4 border border-amber-200">Keyword</th>
              <th className="w-1/2 border border-amber-200">Link</th>
              <th className="w-[150px] !text-center border border-amber-200">MOZ</th>
              <th className="w-[150px] !text-center border border-amber-200">AK</th>
              <th className="w-1/3 border border-amber-200">Requested By</th>
              <th className="w-[120px] border border-amber-200 !text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-amber-200">Test</td>
              <td className="border border-amber-200">Test</td>
              <td className="border border-amber-200 !text-center">00</td>
              <td className="border border-amber-200 !text-center ">00</td>
              <td className="border border-amber-200">Test</td>
              <td className="border border-amber-200 !text-center">
                <div className="relative group inline-block">
                  <Button className="p-2 bg-transparent border !border-transparent hover:!border-yellow-100 rounded cursor-pointer hover:!bg-transparent hover:!shadow-none">
                    <RefreshScore className="w-6 h-6 !text-black-200 dark:!text-white" />
                  </Button>

                  <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition">
                    Refresh Score
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SERPRank;
