import { FC, useEffect, useState } from 'react';
import axios from 'axios';
import { IBtnType } from '../types';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import clsx from 'clsx';

import StackedLine from '../assets/icons/stacked-line.svg?react';
import RefreshScore from '../assets/icons/refresh-score.svg?react';
import Archive from '../assets/icons/archive.svg?react';

interface Insight {
  id: string;
  url: string;
  keywords: string;
  moz_result: string;
  wincher_result: string;
  moz_status: string;
  wincher_status: string;
  status: string;
  requested_by: string;
  created: string;
}

function tryParseJson<T>(str: string): T | null {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

const JediInsights: FC = () => {
  const [url, setUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [fullname, setFullname] = useState('John Doe');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(6);

  const handleAnalyze = async () => {
    if (!url || !keywords) {
      alert('Please enter both URL and keywords');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:8011/', {
        url,
        keywords,
        fullname,
      });

      alert(response.data.message);
      await fetchInsights();
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await axios.get('http://localhost:8011/insights');
      setInsights(response.data);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to load insights.');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const indexOfLastInsight = currentPage * itemsPerPage;
  const indexOfFirstInsight = indexOfLastInsight - itemsPerPage;
  const currentInsights = insights.slice(indexOfFirstInsight, indexOfLastInsight);
  const totalPages = Math.ceil(insights.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className={clsx('flex flex-col w-full pt-4 px-3', 'bg-white-100 dark:bg-blue-600')}>
      <h1 className="text-black-100 dark:text-white-100 text-5xl">AK Jedi Insights</h1>
      <h6 className="italic">Combined On-Page SEO Checker from Wincher and MOZ</h6>

      <div className="flex justify-center items-center w-full gap-4 flex-row mt-4">
        <div className="flex items-center justify-center w-1/2 gap-4">
          <input
            className="!border-gray-500 border p-2 rounded"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://example.org"
          />
          <input
            className="!border-gray-500 border p-2 rounded"
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Enter keywords"
          />
          <Button
            btnType={IBtnType.SEARCH}
            onClick={handleAnalyze}
            disabled={loading}
            className="!bg-black-200 !text-white hover:!bg-black dark:!bg-transparent dark:hover:!bg-yellow-100 dark:hover:!text-black-100">
            {loading ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <div className="flex items-center w-1/2 gap-4">
          <input
            className="!border-gray-500 border p-2 rounded"
            type="text"
            placeholder="Search URL"
          />
          <Button
            btnType={IBtnType.SEARCH}
            className="!bg-black-200 !text-white hover:!bg-black dark:!bg-transparent dark:hover:!bg-yellow-100 dark:hover:!text-black-100">
            {'Search'}
          </Button>
        </div>
        <div className="flex justify-between items-center">
          <Button
            btnType={IBtnType.PAGINATION}
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="mr-4">
            Prev
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            btnType={IBtnType.PAGINATION}
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="ml-4">
            Next
          </Button>
        </div>
      </div>

      {initialLoading && (
        <div className="mt-6 flex justify-center w-full">
          <Loading />
        </div>
      )}
      {!loading && error && (
        <p className="text-red-100 text-base text-center font-bold mt-4">{error}</p>
      )}

        <div className="paa-table-container m-0 p-0 w-full">
          <table
            className={clsx(
              'w-full my-[20px] mx-auto border-collapse',
              'table-fixed shadow-[0_4px_6px_rgba(0, 0, 0, 0.1)]'
            )}>
            <thead>
              <tr>
                <th className="w-1/2 border border-black-200 dark:border-amber-200 ">Page</th>
                <th className="w-1/3 border border-black-200 dark:border-amber-200">Keywords</th>
                <th className="w-[120px] !text-center border border-black-200 dark:border-amber-200">MOZ</th>
                <th className="w-[120px] !text-center border border-black-200 dark:border-amber-200">WINCHER</th>
                <th className="w-1/5 border border-black-200 dark:border-amber-200">Requested By</th>
                <th className="w-1/5 border border-black-200 dark:border-amber-200"></th>
              </tr>
            </thead>
            <tbody>
              {currentInsights.map((item, index) => {
                const moz = tryParseJson<any>(item.moz_result);
                const wincher = tryParseJson<any>(item.wincher_result);

                return (
                  <tr key={index}>
                    <td className="border border-gray-500 dark:border-amber-200">
                      <a href={item.url} className="!text-black-200 hover:!text-blue-800 !underline !underline-offset-4 dark:!text-white dark:hover:!text-yellow-100">{item.url}</a>
                    </td>
                    <td className="border border-gray-500 dark:border-amber-200">{item.keywords}</td>
                    <td className="border border-gray-500 dark:border-amber-200 !text-center">
                      {item.moz_status === 'pending'
                        ? 'Pending'
                        : moz?.page_score
                          ? `${moz.page_score}%`
                          : 'N/A'}
                    </td>
                    <td className="border border-gray-500 dark:border-amber-200 !text-center">
                      {item.wincher_status === 'pending'
                        ? 'Pending'
                        : wincher?.page_score
                          ? `${wincher.page_score}%`
                          : 'N/A'}
                    </td>
                    <td className="border border-gray-500 dark:border-amber-200">{item.requested_by}</td>
                    <td className="border border-gray-500 dark:border-amber-200 !text-center">
                      <div className="relative group inline-block">
                        <Button className="p-2 bg-transparent border !border-transparent hover:!border-black-200 dark:hover:!border-yellow-100 rounded cursor-pointer hover:!bg-transparent hover:!shadow-none">
                          <StackedLine className="w-6 h-6 !text-black-200 dark:!text-white" />
                        </Button>
                        <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition">
                          View Result
                        </span>
                      </div>

                      <div className="relative group inline-block">
                        <Button className="p-2 bg-transparent border !border-transparent hover:!border-black-200 dark:hover:!border-yellow-100 rounded cursor-pointer hover:!bg-transparent hover:!shadow-none">
                          <RefreshScore className="w-6 h-6 !text-black-200 dark:!text-white" />
                        </Button>
                        <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition">
                          Refresh Score
                        </span>
                      </div>

                      <div className="relative group inline-block">
                        <Button className="p-2 bg-transparent border !border-transparent hover:!border-black-200 dark:hover:!border-yellow-100 rounded cursor-pointer hover:!bg-transparent hover:!shadow-none">
                          <Archive className="w-6 h-6 !text-black-200 dark:!text-white" />
                        </Button>
                        <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition">
                          Archive
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
    </div>
  );
};

export default JediInsights;
