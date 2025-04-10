import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/css/PAAScraper.css'; // For styling the sidebar

const PAAScraper: React.FC = () => {
  const [paaQuestions, setPaaQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [keywords, setKeywords] = useState<string>('');

  // Function to simulate an API call for debugging purposes
  const fetchPaaQuestions = async (query: string) => {
    setLoading(true);
    setError('');
    try {
      const url = `http://localhost:3000/paa/${encodeURIComponent(query)}`; // backend route
      console.log(`Requesting: ${url}`);

      const response = await axios.get(url);
      console.log('API Response:', response.data); // Log full response to check the format

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setPaaQuestions(response.data);
      } else {
        setError('No People Also Ask questions found for your search term.');
        setPaaQuestions([]); // Clear the questions in case no results
      }
    } catch (err) {
      console.error('Error during API call:', err);

      if (err.response && err.response.status === 404) {
        setError('No People Also Ask questions found for your search term.');
      } else {
        setError('An error occurred while fetching People Also Ask questions.');
      }
      setPaaQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (keywords.trim() === '') {
      setError('Please enter a search keyword.');
      setPaaQuestions([]); // Clear questions if no keyword
    } else {
      setError('');
      setPaaQuestions([]); // Clear previous questions
      fetchPaaQuestions(keywords); // Call the function to fetch new questions
    }
  };

  useEffect(() => {
    // Test with static data to check if rendering is working
    // Remove this after confirming that rendering is correct
  }, []);

  return (
    <div>
      <h1>Google People Also Ask Scraper</h1>
      <div className="paa-search-container">
        <input
          type="text"
          value={keywords}
          onChange={e => setKeywords(e.target.value)}
          placeholder="Enter keywords"
        />
        <button onClick={handleSearch} disabled={loading} className="news-search-button">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {loading && (
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
        {paaQuestions.length === 0 && !loading && !error && (
          <p>No People Also Ask questions found. Try a different search.</p>
        )}

        {paaQuestions.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Title</th>
              </tr>
            </thead>
            <tbody>
              {paaQuestions.map((question, index) => (
                <tr key={index}>
                  <td>Google</td>
                  <td>{question}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PAAScraper;
