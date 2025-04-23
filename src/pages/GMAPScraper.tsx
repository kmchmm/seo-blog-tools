import { FC, use, useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import clsx from 'clsx';

import pb from '../utils/pocketbaseInit.js';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { UserContext } from '../context/UserContext';

const COUNTIES = [
  'alameda',
  'amador',
  'butte',
  'calaveras',
  'contra costa',
  'el dorado',
  'fresno',
  'humboldt',
  'imperial',
  'kern',
  'kings',
  'los angeles',
  'madera',
  'marin',
  'mendocino',
  'merced',
  'monterey',
  'napa',
  'nevada',
  'orange',
  'placer',
  'riverside',
  'sacramento',
  'san bernardino',
  'san diego',
  'san francisco',
  'san joaquin',
  'san luis obispo',
  'san mateo',
  'santa barbara',
  'santa clara',
  'santa cruz',
  'shasta',
  'solano',
  'sonoma',
  'stanislaus',
  'sutter',
  'tehama',
  'tulare',
  'tuolumne',
  'ventura',
  'yolo',
];

interface scrapeData {
  address: string;
  county: string;
  details: string;
  phone_number: string;
  rating: string;
  rating_count: string;
  title: string;
  type: string;
  website: string;
}

interface scrapeRecord {
  collectionId: string;
  collectionName: string;
  created: string;
  id: string;
  keyword: string;
  requested_by: string;
  updated: string;
  worker_id: string;
  scraped_data: scrapeData;
}

interface scrapeMsg {
  action: string;
  record: scrapeRecord;
}

const GMAPScraper: FC = () => {
  const [mapResults, setMapResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [keywords, setKeywords] = useState<string>('');
  const [location, setLocation] = useState<string>('any');
  const fetchWorkerId = useRef<string>('');
  const currentResults = useRef<any[]>([]);
  const { userData } = use(UserContext);

  const receiveResults = useCallback((e: scrapeMsg) => {
    if (e.record.worker_id === fetchWorkerId.current) {
      const newResult = [...currentResults.current];
      newResult.push(e.record.scraped_data);

      currentResults.current = [...new Set(newResult)];

      setMapResults(currentResults.current);
    }
  }, []);

  const fetchMaps = useCallback(
    async (keywords: string) => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.post(
          `http://localhost:8003`,
          {
            keyword: keywords,
            requested_by: userData.full_name,
          },
          {}
        );

        const data = response.data;
        fetchWorkerId.current = data.worker_id;
        pb.realtime.unsubscribe('gmaps_requests');
        pb.realtime.subscribe('gmaps_requests', receiveResults);
      } catch (err) {
        console.error('Error during API call:', err);
        setError('An error occurred while fetching results.');
        setLoading(false);
      } finally {
      }
    },
    [receiveResults, userData]
  );

  const handleSearch = () => {
    if (keywords.trim() === '') {
      setError('Please enter a search keyword.');
      currentResults.current = [];
      setMapResults([]); // Clear any previous articles
    } else {
      setError(''); // Clear previous error if any
      currentResults.current = [];
      setMapResults([]);
      fetchMaps(keywords);
    }
  };

  const inputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  useEffect(() => {
    pb.autoCancellation(false);
    pb.realtime.subscribe('ak_octobits', async e => {
      if (e.action === 'update' && e.record.worker_id === fetchWorkerId.current) {
        // unsubscribe
        pb.realtime.unsubscribe('gmaps_requests');
        // fetch complete collection
        const collection = await pb.collection('gmaps_requests').getFullList({
          filter: `worker_id="${fetchWorkerId.current}"`,
        });

        const totalResult = collection.map(result => result.scraped_data);
        setMapResults(totalResult);
        setLoading(false);
      }
    });

    return () => {
      pb.realtime.unsubscribe('gmaps_requests');
      pb.realtime.unsubscribe('ak_octobits');
    };
  }, []);

  return (
    <div
      className={clsx(
        'flex flex-col items-center w-full pt-4 px-3',
        'bg-white-100 dark:bg-blue-600'
      )}>
      <h1 className="text-black-100 dark:text-white-100 text-5xl">
        AK OCTO SCRAPER Google Maps
      </h1>
      <div className="flex justify-between items-center w-full gap-4 flex-row">
        <div className="flex items-center news-search-container w-1/2 gap-4">
          <input
            type="text"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            onKeyDown={inputKeyDown}
            placeholder="Keywords, Phrases, Sentences"
          />
          <select value={location} onChange={e => setLocation(e.target.value)}>
            <option value="any" key="any">
              Any
            </option>
            {COUNTIES.map(county => (
              <option value={county} key={county}>
                {county.toUpperCase()}
              </option>
            ))}
          </select>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Request'}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="loading">
          <Loading />
        </div>
      )}

      {!loading && error && (
        <p className="text-red-100 text-base text-center font-bold">{error}</p>
      )}

      <div className="m-0 p-0">
        <table
          className={clsx(
            'w-full my-[20px] mx-auto border-collapse',
            'table-fixed shadow-[0_4px_6px_rgba(0, 0, 0, 0.1)]'
          )}>
          <thead>
            <tr>
              <th>TITLE</th>
              <th>TYPE</th>
              <th>ADDRESS</th>
              <th>COUNTY</th>
              <th>PHONE NUMBER</th>
              <th>RATING</th>
              <th>WEBSITE</th>
            </tr>
          </thead>
          <tbody>
            {!loading && keywords.trim() !== '' && mapResults.length === 0 && (
              <tr>
                <td colSpan={4}>No results found.</td>
              </tr>
            )}
            {mapResults.length > 0 &&
              mapResults.map((result) => {
                return location === 'any' || location === result.county ? (
                  <tr key={`${result.title}_${result.website}`}>
                    <td>{result.title}</td>
                    <td>{result.type}</td>
                    <td>{result.address}</td>
                    <td className="capitalize">{result.county}</td>
                    <td>{result.phone_number}</td>
                    <td>
                      {result.rating} {result.rating_count}
                    </td>
                    <td>
                      <a href={result.website} target="_blank" rel="noopener noreferrer">
                        {result.website}
                      </a>
                    </td>
                  </tr>
                ) : null;
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GMAPScraper;
