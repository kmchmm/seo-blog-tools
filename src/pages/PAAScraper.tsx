import React, { useState } from 'react';
import axios from 'axios';
import { IBtnType } from '../types';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import clsx from 'clsx';

const PAAScraper: React.FC = () => {
  const [paaQuestions, setPaaQuestions] = useState<string[]>([]);  // Store all fetched questions
  const [displayedQuestions, setDisplayedQuestions] = useState<string[]>([]);  // Store questions to display
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [keywords, setKeywords] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);  // Track the current page of questions

  // Fetch PAA questions from the backend
  const fetchPaaQuestions = async (query: string, append = false, page = 1) => {
    setLoading(true);
    setError('');
    try {
      // Use proper format for the URL with query and page separated
      const url = `http://localhost:8002/paa/${encodeURIComponent(query)}/${page}`;
      const response = await axios.get(url);
  
      if (response.data && Array.isArray(response.data.questions) && response.data.questions.length > 0) {
        const newQuestions = response.data.questions;
  
        // If we're appending, add the new questions to the existing ones
        setPaaQuestions(prev =>
          append
            ? Array.from(new Set([...prev, ...newQuestions])) // Avoid duplicates
            : newQuestions
        );
        
        // Only update displayed questions if not appending (initial load), otherwise, keep appending
        setDisplayedQuestions(prev => append ? [...prev, ...newQuestions] : newQuestions.slice(0, 4)); // Display the first 4 questions
      } else {
        setError(response.data.message || 'No People Also Ask questions found.');
        if (!append) setPaaQuestions([]);  // Reset all questions if it's the first time search
      }
    } catch (err: any) {
      console.error('API call error:', err);
      setError('Network error or CORS issue. Please check the server.');
      if (!append) setPaaQuestions([]);  // Reset all questions if error occurs
    } finally {
      setLoading(false);
    }
  };
  
  // Trigger search when the user clicks the search button
  const handleSearch = () => {
    if (keywords.trim() === '') {
      setError('Please enter a search keyword.');
      setPaaQuestions([]);
    } else {
      setError('');
      setPaaQuestions([]); // Reset PAA questions
      setDisplayedQuestions([]); // Reset displayed questions
      setCurrentPage(1);  // Reset to page 1 when searching
      fetchPaaQuestions(keywords);  // Fetch questions for the first time
    }
  };

  // Fetch more questions when the "Generate More Questions" button is clicked
  const handleGenerateMore = () => {
    if (paaQuestions.length === 0) return;

    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);

    // Fetch more questions from the next page
    fetchPaaQuestions(keywords, true, nextPage);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <h1 className="text-5xl">Google People Also Ask Scraper</h1>

      <div className="flex justify-between items-center w-full gap-4 flex-row">
        <div className="flex items-center news-search-container w-1/2 gap-4">
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Enter keywords"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
          />
          <Button onClick={handleSearch} disabled={loading} btnType={IBtnType.SEARCH}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="loading">
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
              <th>Source</th>
              <th>Question</th>
            </tr>
          </thead>
          <tbody>
            {displayedQuestions.length > 0 ? (
              displayedQuestions.map((question, index) => (
                <tr key={index}>
                  <td>Google</td>
                  <td>{question}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="text-center py-4 text-gray-500 italic">
                  {!loading ? 'No People Also Ask questions to show. Try a search above.' : ''}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {paaQuestions.length > 0 && !loading && (
        <Button onClick={handleGenerateMore} disabled={loading} btnType={IBtnType.GENERATE}>
          {loading ? 'Generating...' : 'Generate More Questions'}
        </Button>
      )}
    </div>
  );
};

export default PAAScraper;
