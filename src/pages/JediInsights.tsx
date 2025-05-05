import { FC, useEffect, useState } from 'react';
import axios from 'axios';
import { IBtnType } from '../types';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { Modal } from '../components/Modal';
import clsx from 'clsx';

import StackedLine from '../assets/icons/stacked-line.svg?react';
import RefreshScore from '../assets/icons/refresh-score.svg?react';
import Archive from '../assets/icons/archive.svg?react';
import WincherYellowBullet from '../assets/icons/wincher-yellow-circle.svg?react';
import WincherRedBullet from '../assets/icons/wincher-red-circle.svg?react';
import WincherGreenBullet from '../assets/icons/wincher-green-circle.svg?react';

import Moz from '../assets/images/moz-logo.png';
import Wincher from '../assets/images/wincher-logo.png';

interface Insight {
  id: string;
  url: string;
  keywords: string;
  moz_result: string | any;
  wincher_result: string | any;
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
  const [filteredInsights, setFilteredInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [searchField, setSearchField] = useState('url');
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(6);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

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

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      const filtered = insights.filter(item =>
        item[searchField]?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredInsights(filtered);
      setCurrentPage(1);
      setLoading(false);
    }, 300);
  };

  const fetchInsights = async () => {
    try {
      const response = await axios.get('http://localhost:8011/insights');
      const reversed = response.data.reverse();
      const nonArchived = reversed.filter(item => item.status !== 'archived');
      setInsights(nonArchived);
      setFilteredInsights(nonArchived);
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
  const currentInsights = filteredInsights.slice(indexOfFirstInsight, indexOfLastInsight);
  const totalPages = Math.ceil(filteredInsights.length / itemsPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleViewResult = (insight: Insight) => {
    setSelectedInsight(insight);
    setIsModalOpen(true);
  };

  const handleArchive = async (id: string) => {
    setArchivingId(id);
    try {
      await axios.patch(`http://localhost:8011/archive/${id}`);
      await fetchInsights(); // refresh the list to reflect the change
    } catch (error) {
      console.error('Error archiving insight:', error);
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <div
      className={clsx('flex flex-col w-full pt-4 px-3', 'bg-white-100 dark:bg-blue-600')}>
      <h1 className="text-black-100 dark:text-white-100 text-5xl">AK Jedi Insights</h1>
      <h6 className="italic">Combined On-Page SEO Checker from Wincher and MOZ</h6>

      <div className="flex justify-center items-center w-full gap-4 flex-row mt-4">
        <div className="flex items-center justify-center w-1/2 gap-4">
          <input
            className="!border-gray-500 border p-2 rounded"
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="http://example.org"
          />
          <input
            className="!border-gray-500 border p-2 rounded"
            type="text"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            placeholder="Enter keywords"
          />
          <Button
            btnType={IBtnType.SEARCH}
            onClick={handleAnalyze}
            disabled={loading}
            className="!bg-black-200 !text-white hover:!bg-black dark:!bg-transparent dark:hover:!bg-yellow-100 dark:hover:!text-black-100">
            {'Analyze'}
          </Button>
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <div className="flex items-center w-1/2 gap-4">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search URL / Keywords / Requested By"
            className="input-style !border-gray-500 border p-2 rounded"
            onKeyDown={e => {
              if (e.key === 'Enter') handleSearch();
            }}
          />
          <select
            value={searchField}
            onChange={e => setSearchField(e.target.value)}
            className="cursor-pointer border p-2 rounded !border-black-200">
            <option value="url">URL</option>
            <option value="keywords">Keyword</option>
            <option value="requested_by">Requested By</option>
          </select>
          <Button
            btnType={IBtnType.SEARCH}
            onClick={handleSearch}
            className="!bg-black-200 !text-white hover:!bg-black dark:!bg-transparent dark:hover:!bg-yellow-100 dark:hover:!text-black-100">
            {loading ? 'Searching...' : 'Search'}
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
              <th className="w-1/2 border border-black-200 dark:border-amber-200 ">
                Page
              </th>
              <th className="w-1/3 border border-black-200 dark:border-amber-200">
                Keywords
              </th>
              <th className="w-[120px] !text-center border border-black-200 dark:border-amber-200">
                MOZ
              </th>
              <th className="w-[120px] !text-center border border-black-200 dark:border-amber-200">
                WINCHER
              </th>
              <th className="w-1/5 border border-black-200 dark:border-amber-200">
                Requested By
              </th>
              <th className="w-1/5 border border-black-200 dark:border-amber-200"></th>
            </tr>
          </thead>
          <tbody>
            {currentInsights.map((item, index) => {
              const moz =
                typeof item.moz_result === 'string'
                  ? tryParseJson<any>(item.moz_result)
                  : item.moz_result;
              const wincher =
                typeof item.wincher_result === 'string'
                  ? tryParseJson<any>(item.wincher_result)
                  : item.wincher_result;

              return (
                <tr key={index}>
                  <td className="border border-gray-500 dark:border-amber-200">
                    <a
                      href={item.url}
                      className="!text-black-200 hover:!text-blue-800 underline underline-offset-4 dark:!text-white dark:hover:!text-yellow-100">
                      {item.url}
                    </a>
                  </td>
                  <td className="border border-gray-500 dark:border-amber-200">
                    {item.keywords}
                  </td>
                  <td className="border border-gray-500 dark:border-amber-200 !text-center font-extrabold text-2xl">
                    {item.moz_status === 'pending'
                      ? 'Pending'
                      : moz?.page_score
                        ? `${moz.page_score}`
                        : '---'}
                  </td>
                  <td className="border border-gray-500 dark:border-amber-200 !text-center font-extrabold text-2xl">
                    {item.wincher_status === 'pending'
                      ? 'Pending'
                      : wincher?.page_score
                        ? `${wincher.page_score}`
                        : '---'}
                  </td>
                  <td className="border border-gray-500 dark:border-amber-200">
                    {item.requested_by}
                  </td>
                  <td className="border border-gray-500 dark:border-amber-200 text-center flex justify-center">
                    <div className="relative group inline-block">
                      <Button
                        onClick={() => handleViewResult(item)}
                        className="p-2 !bg-transparent border !border-transparent hover:!border-black-200 dark:hover:!border-yellow-100 rounded cursor-pointer hover:!bg-transparent hover:shadow-none">
                        <StackedLine className="w-6 h-6 text-black-200 dark:text-white" />
                      </Button>
                      <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition">
                        View Result
                      </span>
                    </div>

                    <div className="relative group inline-block">
                      <Button
                        onClick={async () => {
                          try {
                            const response = await axios.post('http://localhost:8012/', {
                              id: item.id,
                              fullname,
                            });
                            alert(response.data.message);
                            await fetchInsights(); // Refresh data after re-run
                          } catch (err) {
                            alert('Failed to refresh score');
                            console.error(err);
                          }
                        }}
                        className="p-2 !bg-transparent border !border-transparent hover:!border-black-200 dark:hover:!border-yellow-100 rounded cursor-pointer hover:!bg-transparent hover:shadow-none">
                        <RefreshScore className="w-6 h-6 text-black-200 dark:text-white" />
                      </Button>
                      <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition">
                        Refresh Score
                      </span>
                    </div>

                    <div className="relative group inline-block">
                      <Button
                        onClick={() => handleArchive(item.id)}
                        disabled={archivingId === item.id}
                        className="p-2 !bg-transparent border !border-transparent hover:!border-black-200 dark:hover:!border-yellow-100 rounded cursor-pointer hover:!bg-transparent hover:shadow-none">
                        {archivingId === item.id ? (
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            Archiving...
                          </span>
                        ) : (
                          <Archive className="w-6 h-6 text-black-200 dark:text-white" />
                        )}
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

      {selectedInsight && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <h2 className="text-xl font-bold mb-4 !text-left">ON-Page Results</h2>
          <hr />

          <div className="flex justify-between gap-4 mt-4 text-center">
            {/* MOZ Section */}
            <div className="w-1/2">
              <div className="mt-4 mb-4 flex justify-center">
                <img src={Moz} alt="Moz Logo" className="w-[180px]" />
              </div>

              {(() => {
                const moz =
                  typeof selectedInsight.moz_result === 'string'
                    ? tryParseJson<any>(selectedInsight.moz_result)
                    : selectedInsight.moz_result;

                const {
                  helping_factor,
                  hurting_factor,
                  keyword_locations,
                  keywords_count,
                } = moz || {};

                return (
                  <>
                    <h1 className="!font-extrabold text-5xl">PAGE SCORE</h1>
                    <div className="text-3xl !mt-7">
                      <p className="!font-extrabold !text-4xl">
                        {moz?.page_score ?? '---'}
                      </p>
                    </div>

                    <div className="flex justify-around text-3xl mt-7">
                      <div>
                        <h3>Helping Factor</h3>
                        <p className="font-bold">{helping_factor ?? 'N/A'}</p>
                      </div>
                      <div>
                        <h3>Hurting Factor</h3>
                        <p className="font-bold">{hurting_factor ?? 'N/A'}</p>
                      </div>
                    </div>

                    <div className="mt-7">
                      <div className="border border-black-200 p-4">
                        <h2 className="text-2xl text-left">Keyword Locations</h2>
                      </div>
                      <div className="flex justify-between text-center text-lg font-medium">
                        <span className="border-l border-b border-black-200 p-2 w-full first:border-l last:border-r">
                          <strong>Keyword Count:</strong> {keywords_count}
                        </span>
                        {['body', 'img', 'meta', 'title', 'url'].map(key => (
                          <span
                            key={key}
                            className="border-l border-b border-black-200 p-2 w-full first:border-l last:border-r">
                            <strong>
                              {key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()}
                            </strong>
                            <br />
                            {keyword_locations?.[key] ?? '0'}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between mt-7 gap-5">
                      <div className="p-4 border border-black-200 w-full">
                        <h3 className="text-2xl">Hurting Factors</h3>
                        <p className="text-lg">{hurting_factor ?? 'N/A'}</p>
                      </div>
                      <div className="p-4 border border-black-200 w-full">
                        <h3 className="text-2xl">Helping Factors</h3>
                        <p className="text-lg">{helping_factor ?? 'N/A'}</p>
                      </div>
                      <div className="p-4 border border-black-200 w-full">
                        <h3 className="text-2xl">Overall Factors</h3>
                        <p className="text-lg">
                          {(helping_factor ?? 0) + (hurting_factor ?? 0)}
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* WINCHER Section */}
            <div className="w-1/2 p-6 rounded !text-black-200 text-left">
              <div className="mt-4 mb-4 flex justify-center">
                <img src={Wincher} alt="Wincher Logo" className="w-[150px]" />
              </div>

              <WincherDetails wincherData={selectedInsight.wincher_result} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const WincherDetails: FC<{ wincherData: any }> = ({ wincherData }) => {
  const wincher =
    typeof wincherData === 'string' ? tryParseJson<any>(wincherData) : wincherData;

  const { page_score, seo_opportunities = [] } = wincher || {};

  const passedResults = seo_opportunities.filter(
    (item: any) => item?.grade === 'PERFECT'
  );
  const nonPassedResults = seo_opportunities.filter(
    (item: any) => item?.grade !== 'PERFECT'
  );

  const sortedNonPassedResults = nonPassedResults.sort((a: any, b: any) => {
    if (a.grade === 'GOOD' && b.grade !== 'GOOD') return -1;
    if (a.grade !== 'GOOD' && b.grade === 'GOOD') return 1;
    return 0;
  });

  const [openIndexes, setOpenIndexes] = useState<Record<string, boolean>>({});

  const toggleAccordion = (key: string) => {
    setOpenIndexes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <h1 className="text-5xl !text-center !font-extrabold">PAGE SCORE</h1>
      <div className="text-3xl !mt-7">
        <p className="!font-extrabold !text-4xl !text-center">{page_score ?? '---'}</p>
      </div>

      {/* SEO Opportunities */}
      <div className="mt-10">
        <div className="pl-4 pr-4 border border-white rounded">
          <h2 className="text-2xl mb-2 !text-left">SEO Opportunities</h2>
          {sortedNonPassedResults.length > 0 ? (
            <ul className="list-none">
              {sortedNonPassedResults.map((item: any, i: number) => {
                const key = `non-passed-${i}`;
                const isOpen = openIndexes[key];

                return (
                  <li
                    key={key}
                    className="border border-black-200 rounded mb-5 pr-2 pl-2">
                    <button
                      className="flex items-center w-full text-left font-bold focus:outline-none cursor-pointer p-2"
                      onClick={() => toggleAccordion(key)}>
                      {item?.grade === 'GOOD' ? (
                        <WincherYellowBullet className="w-[20px] mr-2" />
                      ) : (
                        <WincherRedBullet className="w-[20px] mr-2" />
                      )}
                      <span className="text-lg">{item.title}</span>
                      <span className="ml-auto text-sm">{isOpen ? '▲' : '▼'}</span>
                    </button>

                    {isOpen && (
                      <div className="ml-2 w-[98%] animate-fade-in ">
                        <div className="text-base mb-2">{item.best_practice}</div>

                        {[
                          ...(item.ratings || []),
                          ...(item.best_practice_ratings || []),
                          ...(item.additional_ratings || []),
                        ].map((rating: any, idx: number) => (
                          <div
                            key={idx}
                            className="text-xs mb-3 border border-black-200 p-1 rounded w-full">
                            <div className="flex items-center text-base">
                              <span>
                                {rating.score} / {rating.max_score}
                              </span>
                              <span className="ml-2">{rating.rating_type}</span>
                            </div>
                            <div className="text-base w-full">
                              {rating.rating_comment}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm italic">No SEO opportunities found.</p>
          )}
        </div>
      </div>

      {/* Passed Results */}
      <div className="mt-0">
        <div className="pl-4 pr-4 border border-white rounded">
          <h2 className="text-2xl mb-2 !text-left">Passed Results</h2>
          {passedResults.length > 0 ? (
            <ul className="list-none">
              {passedResults.map((item: any, i: number) => {
                const key = `passed-${i}`;
                const isOpen = openIndexes[key];

                return (
                  <li
                    key={key}
                    className="border border-black-200 rounded mb-3 pl-2 pr-2">
                    <button
                      className="flex items-center w-full text-left font-bold focus:outline-none cursor-pointer p-2"
                      onClick={() => toggleAccordion(key)}>
                      <WincherGreenBullet className="w-[20px] mr-2" />
                      <span className="text-lg">{item.title}</span>
                      <span className="ml-auto text-sm">{isOpen ? '▲' : '▼'}</span>
                    </button>

                    {isOpen && (
                      <div className="ml-2 w-[98%] animate-fade-in">
                        <div className="text-base mb-2">{item.best_practice}</div>
                        {(item.ratings || []).map((rating: any, idx: number) => (
                          <div
                            key={idx}
                            className="text-xs mb-3 border border-black-200 p-1 rounded w-full">
                            <div className="flex items-center text-base">
                              <span>
                                {rating.score} / {rating.max_score}
                              </span>
                              <span className="ml-2">{rating.rating_type}</span>
                            </div>
                            <div className="text-base w-full">
                              {rating.rating_comment}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm italic">No Passed results found.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default JediInsights;
