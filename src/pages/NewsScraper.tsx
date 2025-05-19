import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { IBtnType } from '../types';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import clsx from 'clsx';

const NewsScraper: React.FC = () => {
  const [newsArticles, setNewsArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [keywords, setKeywords] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<string>('a');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(6);

  // AbortController reference for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchNews = async (query: string, timeFilter: string) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError('');
    setNewsArticles([]);

    const isDev = import.meta.env.MODE === 'development';
    const apiUrl = isDev
      ? import.meta.env.VITE_LOCAL_NEWS_API || 'http://localhost:3000/news'
      : import.meta.env.VITE_PROD_NEWS_API || 'http://raket.arashlaw.ph:8001/news';

    try {
      const response = await axios.get(`${apiUrl}/${query}`, {
        headers: {
          'X-Time': timeFilter,
        },
        signal: controller.signal,
      });

      const data = response.data;
      if (data.deta && data.deta.length > 0) {
        const sortedArticles = data.deta.sort((a: any, b: any) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        setNewsArticles(sortedArticles);
      } else {
        setError('No articles found for your search.');
      }
    } catch (err: any) {
      if (axios.isCancel(err) || err.name === 'CanceledError') {
        console.log('Request cancelled.');
      } else {
        console.error('Error fetching news:', err);
        setError('An error occurred while fetching news.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (keywords.trim() === '') {
      setError('Please enter a search keyword.');
      setNewsArticles([]);
    } else {
      setError('');
      setCurrentPage(1);
      fetchNews(keywords, timeFilter);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const indexOfLastArticle = currentPage * itemsPerPage;
  const indexOfFirstArticle = indexOfLastArticle - itemsPerPage;
  const currentArticles = newsArticles.slice(indexOfFirstArticle, indexOfLastArticle);
  const totalPages = Math.ceil(newsArticles.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="flex flex-col items-center w-full pt-4 px-3 bg-white-100 dark:bg-blue-600">
      <h1 className="text-5xl">AK OCTO SCRAPER News</h1>
      <div className="flex justify-between items-center w-full gap-4 flex-row">
        <div className="flex items-center news-search-container w-1/2 gap-4">
          <input
            type="text"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSearch();
            }}
            placeholder="Search for news, keywords...."
          />
          <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
            <option value="a">Any time</option>
            <option value="h">Past Hour</option>
            <option value="d">Past 24 Hours</option>
            <option value="w">Past Week</option>
            <option value="m">Past Month</option>
            <option value="y">Past Year</option>
          </select>
          <Button onClick={handleSearch} disabled={loading} btnType={IBtnType.SEARCH}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
        <div className="w-full flex justify-end items-center">
          <Button
            btnType={IBtnType.PAGINATION}
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="mr-[20px]">
            PREV
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            btnType={IBtnType.PAGINATION}
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="ml-[20px]">
            NEXT
          </Button>
        </div>
      </div>

      {loading && (
        <div className="loading flex flex-col justify-center items-center gap-4">
          <Loading />
          <div className="italic">This may take a while...</div>
        </div>
      )}

      {!loading && newsArticles.length === 0 && error && (
        <p className="text-red-100 text-base text-center font-bold">{error}</p>
      )}

      <div className="news-table-container m-0 p-0">
        <table
          className={clsx(
            'w-full my-[20px] mx-auto border-collapse',
            'table-fixed shadow-[0_4px_6px_rgba(0, 0, 0, 0.1)]'
          )}>
          <thead>
            <tr>
              <th>FEATURED</th>
              <th>Website</th>
              <th className="w-[60%]">TITLE</th>
              <th>URL</th>
              <th>DATE PUBLISHED</th>
            </tr>
          </thead>
          <tbody>
            {currentArticles.map((article, index) => (
              <tr key={index}>
                <td>
                  {article.imageUrl && (
                    <img
                      src={article.imageUrl}
                      alt="article"
                      className="w-[50px] h-[50px]"
                    />
                  )}
                </td>
                <td>{article.website}</td>
                <td className="whitespace-nowrap overflow-hidden text-ellipsis">
                  {article.title}
                </td>
                <td className="news-url-holder">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="!text-yellow-500 hover:!text-blue-100 dark:!text-yellow-100">
                    READ MORE
                  </a>
                </td>
                <td className="!text-center whitespace-nowrap">
                  <div>{article.date}</div>
                  {article.time && (
                    <div className="text-sm text-gray-500 dark:text-gray-200 mt-1">{article.time}</div>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NewsScraper;
