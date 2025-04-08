import React, { useState } from 'react';
import axios from 'axios';
import '../assets/css/GMAPScraper.css'; // For styling the sidebar

const GMAPScraper: React.FC = () => {
  const [newsArticles, setNewsArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [keywords, setKeywords] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<string>('a');

  const fetchNews = async (query: string, timeFilter: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`http://localhost:3000/news/${query}`, {
        headers: {
          'X-Time': timeFilter,
        },
      });

      console.log('API Response:', response.data);

      const data = response.data;
      if (data.deta && data.deta.length > 0) {
        setNewsArticles(data.deta);
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
      fetchNews(keywords, timeFilter);
    }
  };

  return (
    <div>
      <h1>AK OCTO SCRAPER Google Maps</h1>
      <div className='gmap-search-container'>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Search for news"
        />
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
        >
          <option value="a">Any</option>
          <option value="h">Past Hour</option>
          <option value="d">Past 24 Hours</option>
          <option value="w">Past Week</option>
          <option value="m">Past Month</option>
          <option value="y">Past Year</option>
        </select>
        <button onClick={handleSearch} disabled={loading} className="news-search-button">
          {loading ? 'Searching...' : 'Request'}
        </button>
      </div>

      {loading && (
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      )}
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
        <table>
          <thead>
            <tr>
              <th>FEATURED</th>
              <th>TITLE</th>
              <th>URL</th>
              <th>DATE PUBLISHED</th>
            </tr>
          </thead>
          <tbody>
            {keywords.trim() !== '' && newsArticles.length === 0 && (
              <tr>
                <td colSpan={4}>No articles found.</td>
              </tr>
            )}
            {newsArticles.length > 0 &&
              newsArticles.map((article, index) => {
                return (
                  <tr key={index}>
                    <td></td>
                    <td>{article.website}</td>
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

export default GMAPScraper;
