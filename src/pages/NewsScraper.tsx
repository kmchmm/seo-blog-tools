import React, { useState } from 'react';
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
  const [timeFilter, setTimeFilter] = useState<string>('a'); // Default to 'Any time'

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(6);

  const fetchNews = async (query: string, timeFilter: string) => {
    setLoading(true);
    setError('');
    setNewsArticles([]);  // Clear previous articles when searching for new ones

    try {
      const response = await axios.get(`http://localhost:3000/news/${query}`, {
        headers: {
          'X-Time': timeFilter, // Pass the time filter as a header
        },
      });

      console.log('API Response:', response.data);

      const data = response.data;
      if (data.deta && data.deta.length > 0) {
        // Sort articles by date in descending order
        const sortedArticles = data.deta.sort((a: any, b: any) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;  // Sort in descending order
        });
        setNewsArticles(sortedArticles);
      } else {
        setError('No articles found for your search.');
      }
    } catch (err) {
      console.error('Error during API call:', err);
      setError('An error occurred while fetching news.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (keywords.trim() === '') {
      setError('Please enter a search keyword.');
      setNewsArticles([]); // Clear any previous articles
    } else {
      setError(''); // Clear previous error if any
      setCurrentPage(1); // Reset to the first page
      fetchNews(keywords, timeFilter);
    }
  };

  // Calculate the current items to display based on pagination
  const indexOfLastArticle = currentPage * itemsPerPage;
  const indexOfFirstArticle = indexOfLastArticle - itemsPerPage;
  const currentArticles = newsArticles.slice(indexOfFirstArticle, indexOfLastArticle);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Pagination buttons (Previous / Next)
  const totalPages = Math.ceil(newsArticles.length / itemsPerPage);

  return (
    <div className="flex flex-col items-center w-full">
      <h1>AK OCTO SCRAPER NEWS</h1>
      <div className="flex justify-between items-center w-full gap-4 flex-row">
        <div className="flex items-center news-search-container w-1/2 gap-4">
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Search for news, keywords...."
          />
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="a">Any time</option>
            <option value="h">Past Hour</option>
            <option value="d">Past 24 Hours</option>
            <option value="w">Past Week</option>
            <option value="m">Past Month</option>
            <option value="y">Past Year</option>
          </select>
          <Button onClick={handleSearch} disabled={loading} >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
        <div>
          {/* Pagination controls */}
          <div className="w-full">
            <Button 
              btnType={IBtnType.PAGINATION}
              onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}
              className='mr-[20px]'
            >
              PREV
            </Button>
            <span>Page {currentPage} of {totalPages}</span>
            <Button
              btnType={IBtnType.PAGINATION}
              onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}
              className='ml-[20px]'
            >
              NEXT
            </Button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading">
          <Loading />
        </div>
      )}
      
      {/* Only show "No articles found" after search is complete and no articles are available */}
      {!loading && newsArticles.length === 0 && error &&
        <p className="text-red-100 text-base text-center font-bold">
          {error}
        </p>
      }

      <div className="news-table-container m-0 p-0">
        <table className={clsx(
          'w-full my-[20px] mx-auto border-collapse',
          'table-fixed shadow-[0_4px_6px_rgba(0, 0, 0, 0.1)]'
        )}>
          <thead>
            <tr>
              <th>FEATURED</th>
              <th className="w-[60%]">TITLE</th>
              <th>URL</th>
              <th>DATE PUBLISHED</th>
            </tr>
          </thead>
          <tbody>
            {currentArticles.length > 0 &&
              currentArticles.map((article, index) => {
                return (
                  <tr key={index}>
                    <td>
                      {article.imageUrl && <img src={article.imageUrl} alt="article" style={{ width: '50px', height: '50px' }} />}
                    </td>
                    <td className="whitespace-nowrap overflow-hidden text-ellipsis">{article.title}</td>
                    <td className="news-url-holder">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        READ MORE
                      </a>
                    </td>
                    <td>{article.date}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NewsScraper;
