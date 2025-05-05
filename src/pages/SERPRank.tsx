import { FC, useEffect, useState } from 'react';
import axios from 'axios';
import clsx from 'clsx';

import { IBtnType } from '../types';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';

import RefreshScore from '../assets/icons/refresh-score.svg?react';

type RecordType = {
  id: string;
  link?: string;
  keyword: string;
  requested_by: string;
  moz_score?: number;
  ak_score?: number;
};

const SERPRank: FC = () => {
  const [keyword, setKeyword] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [records, setRecords] = useState<RecordType[]>([]);
  const [error, setError] = useState('');

  const fetchRecords = async () => {
    try {
      const response = await axios.get('http://localhost:8015/records');
      setRecords(response.data);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch records:', err);
      setError(err?.response?.data?.error || 'Failed to load records.');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSearch = async () => {
    if (!keyword || !url) {
      alert('Please enter both keyword and URL');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:8015/', {
        keyword,
        requested_by: url,
      });
      await fetchRecords();
    } catch (err: any) {
      console.error('Failed to send request:', err);
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={clsx('flex flex-col w-full pt-4 px-3', 'bg-white-100 dark:bg-blue-600')}>
      <h1 className="text-black-100 dark:text-white-100 text-5xl">AK SERP Checker</h1>
      <h6 className="italic">Our SERPChecker TOOL. (RANKING TOOL)</h6>

      <div className="flex items-center w-full gap-4 flex-row mt-4">
        <div className="flex items-center w-1/2 gap-4">
          <input
            className="!border-gray-700 !w-1/2 border p-2 rounded"
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Enter Keyword"
          />
          <input
            className="!border-gray-700 !w-1/2 border p-2 rounded"
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="URL (Don't put HTTPS — e.g. arashlaw.com)"
          />
          <Button
            onClick={handleSearch}
            disabled={loading}
            btnType={IBtnType.SEARCH}
            className="!bg-black-200 !text-white hover:!bg-black dark:!bg-transparent dark:hover:!bg-yellow-100 dark:hover:!text-black-100">
            {loading ? 'Checking...' : 'Check'}
          </Button>
        </div>
      </div>

      {initialLoading ? (
        <div className="mt-6 flex justify-center w-full">
          <Loading />
        </div>
      ) : error ? (
        <p className="text-red-100 text-base text-center font-bold mt-4">{error}</p>
      ) : records.length === 0 ? (
        <p className="text-center text-gray-700 dark:text-white mt-6">
          No records found. Try submitting a keyword and URL.
        </p>
      ) : (
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
              {records.map(record => (
                <tr key={record.id}>
                  <td className="border border-amber-200">{record.keyword}</td>

                  <td className="border border-amber-200">
                    {(() => {
                      try {
                        const parsed = JSON.parse(record.link || '[]'); // safely parse
                        return parsed[0]?.link || '---'; // get first link from data array
                      } catch {
                        return '---'; // fallback
                      }
                    })()}
                  </td>
                  <td className="border border-amber-200 !text-center">{record.moz_score ?? '---'}</td>
                  <td className="border border-amber-200 !text-center">{record.ak_score ?? '---'}</td>
                  <td className="border border-amber-200">{record.requested_by}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SERPRank;
