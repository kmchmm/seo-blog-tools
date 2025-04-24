import { FC, KeyboardEvent, use, useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import clsx from 'clsx';

import pb from '../utils/pocketbaseInit.js';
import { scrapeData, modifiedScrapeData } from '../types.js';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { OctoBitRecord } from '../components/OctoBitRecord';
import { MapRecord } from '../components/MapRecord';
import { UserContext } from '../context/UserContext';
import BackArrow from '../assets/icons/back.svg?react';

const isDev = import.meta.env.MODE === 'development';
const apiUrl = isDev
  ? import.meta.env.VITE_LOCAL_GMAPS_API_URL
  : import.meta.env.VITE_PROD_GMAPS_API_URL;

const GMAPS_TOOL = 'AK OCTO GMAPS SCRAPER';
const GMAPS_REQUESTS_COLLECTION = 'gmaps_requests';
const AK_OCTOBITS_COLLECTION = 'ak_octobits';
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

interface octoBitsRecord {
  collectionId: string;
  collectionName: string;
  created: string;
  id: string;
  job: string;
  job_requested_by: string;
  message: string;
  status: string;
  tool: string;
  updated: string;
  worker_id: string;
}

enum IGMap {
  COLLECTION = 'collection',
  SPEC = 'spec',
}

type gmapMode = IGMap;

const deleteFromCollection = (collection: octoBitsRecord[], recordId: string) => {
  const newCollection = [...collection];
  const indexOfDeleted = newCollection.findIndex(octoBit => {
    return octoBit.id === recordId;
  });
  newCollection.splice(indexOfDeleted, 1);
  return newCollection;
};

const GMAPScraper: FC = () => {
  const [mapResults, setMapResults] = useState<modifiedScrapeData[]>([]);
  const [octoBitsResults, setOctoBitsResults] = useState<octoBitsRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [keywords, setKeywords] = useState<string>('');
  const [location, setLocation] = useState<string>('any');
  const [mode, setMode] = useState<gmapMode>(IGMap.COLLECTION);
  const fetchWorkerId = useRef<string>('');
  const currentResults = useRef<modifiedScrapeData[]>([]);
  const { userData } = use(UserContext);

  const receiveResults = useCallback((e: scrapeMsg) => {
    if (e.record.worker_id === fetchWorkerId.current) {
      const newResult = [...currentResults.current];
      newResult.push({ ...e.record.scraped_data, id: e.record.id });

      currentResults.current = [...new Set(newResult)];

      setMapResults(currentResults.current);
    }
  }, []);

  const fetchCompleteCollection = async () => {
    // fetch complete collection
    const collection = await pb.collection(GMAPS_REQUESTS_COLLECTION).getFullList({
      filter: `worker_id="${fetchWorkerId.current}"`,
    });

    const totalResult = collection.map(result => {
      return { ...result.scraped_data, id: result.id };
    });
    setMapResults(totalResult);
    setLoading(false);
  };

  const showMapResults = useCallback(
    (worker_id: string, isDone: boolean) => {
      setLoading(true);
      setError('');
      setMapResults([]);
      setMode(IGMap.SPEC);
      fetchWorkerId.current = worker_id;
      pb.realtime.unsubscribe(GMAPS_REQUESTS_COLLECTION);
      if (isDone) {
        fetchCompleteCollection();
      } else {
        pb.realtime.subscribe(GMAPS_REQUESTS_COLLECTION, receiveResults);
      }
    },
    [receiveResults]
  );

  const fetchMaps = useCallback(
    async (keywords: string, location: string) => {
      setLoading(true);
      setError('');
      setMode(IGMap.SPEC);
      const locationString = location === 'any' ? '' : location;
      try {
        const response = await axios.post(
          apiUrl,
          {
            keyword: `${keywords} ${locationString}`,
            requested_by: userData.full_name,
          },
          {}
        );

        const data = response.data;
        fetchWorkerId.current = data.worker_id;
        pb.realtime.unsubscribe(GMAPS_REQUESTS_COLLECTION);
        pb.realtime.subscribe(GMAPS_REQUESTS_COLLECTION, receiveResults);
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
      fetchMaps(keywords, location);
    }
  };

  const inputKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const deleteAkOctobit = useCallback(
    async (recordId: string) => {
      setLoading(true);
      await pb.collection(AK_OCTOBITS_COLLECTION).delete(recordId);
      const newOctobits = deleteFromCollection(octoBitsResults, recordId);
      setOctoBitsResults(newOctobits);
      setLoading(false);
    },
    [mapResults]
  );

  const deleteGMapRequest = useCallback(
    async (recordId: string) => {
      setLoading(true);
      await pb.collection(GMAPS_REQUESTS_COLLECTION).delete(recordId);
      const newMapResults = [...mapResults];
      const indexOfDeleted = newMapResults.findIndex(mapRequest => {
        return mapRequest.id === recordId;
      });
      newMapResults.splice(indexOfDeleted, 1);
      setMapResults(newMapResults);
      setLoading(false);
    },
    [mapResults]
  );

  const deleteAllMapRequests = useCallback(async () => {
    setLoading(true);
    for (let x = 0; x < mapResults.length; x++) {
      const element = mapResults[x];
      await pb.collection(GMAPS_REQUESTS_COLLECTION).delete(element.id);
    }
    setMapResults([]);
    setLoading(false);
  }, [mapResults]);

  useEffect(() => {
    pb.autoCancellation(false);
    pb.realtime.subscribe(AK_OCTOBITS_COLLECTION, async e => {
      console.log(e);
      if (e.tool !== GMAPS_TOOL) return;
      if (e.action === 'update') {
        if (e.record.worker_id === fetchWorkerId.current) {
          pb.realtime.unsubscribe(GMAPS_REQUESTS_COLLECTION);
          fetchCompleteCollection();
        } else {
          // search in collection, then update in state
          const newCollection = [...octoBitsResults];
          const indexOfUpdated = newCollection.findIndex(octoBit => {
            return octoBit.id === e.record.id;
          });
          newCollection[indexOfUpdated] = e.record;
          setOctoBitsResults(newCollection);
        }
        return;
      }

      // add in collection
      if (e.action === 'create') {
        const newOctoBitResults = [...octoBitsResults];
        newOctoBitResults.unshift(e.record);
        setOctoBitsResults(newOctoBitResults);
        return;
      }

      // delete in collection
      if (e.action === 'delete') {
        const newCollection = deleteFromCollection(octoBitsResults, e.record.id);
        setOctoBitsResults(newCollection);
        return;
      }
    });

    return () => {
      pb.realtime.unsubscribe(GMAPS_REQUESTS_COLLECTION);
      pb.realtime.unsubscribe(AK_OCTOBITS_COLLECTION);
    };
  }, [octoBitsResults]);

  const fetchCollections = async () => {
    const collection = await pb.collection(AK_OCTOBITS_COLLECTION).getList(1, 50, {
      sort: '-created',
      filter: `tool="${GMAPS_TOOL}"`,
    });
    const collectionItems = collection['items'];
    setOctoBitsResults(collectionItems as octoBitsRecord[]);
    setLoading(false);
  };

  useEffect(() => {
    if (mode === IGMap.COLLECTION) {
      pb.realtime.unsubscribe(GMAPS_REQUESTS_COLLECTION);
      fetchCollections();
    }
  }, [mode]);

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
        <div>
          <Loading />
        </div>
      )}

      {!loading && error && (
        <p className="text-red-100 text-base text-center font-bold">{error}</p>
      )}

      {mode === IGMap.SPEC && (
        <div className="m-0 p-0">
          <div className="flex justify-between">
            <button
              title="Back to GMAP Scraper"
              className="fill-yellow-100 cursor-pointer w-10"
              onClick={() => setMode(IGMap.COLLECTION)}>
              <BackArrow />
            </button>
            <Button disabled={loading}>Export as CSV</Button>
          </div>
          <table
            className={clsx(
              'w-full my-[20px] mx-auto border-collapse',
              'table-fixed shadow-[0_4px_6px_rgba(0, 0, 0, 0.1)]'
            )}>
            <thead>
              <tr>
                <th>TITLE</th>
                <th>TYPE</th>
                <th>COUNTY</th>
                <th>ADDRESS</th>
                <th>CONTACT</th>
                <th>DETAILS</th>
                <th>WEBSITE</th>
                {isDev && (
                  <th>
                    <button
                      disabled={loading}
                      className={
                        loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                      }
                      onClick={deleteAllMapRequests}>
                      DELETE ALL
                    </button>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {!loading && keywords.trim() !== '' && mapResults.length === 0 && (
                <tr>
                  <td colSpan={4}>No results found.</td>
                </tr>
              )}
              {mapResults.length > 0 &&
                mapResults.map(result => {
                  return (
                    <MapRecord
                      key={`${result.title}_${result.address}`}
                      id={result.id}
                      title={result.title}
                      address={result.address}
                      type={result.type}
                      county={result.county}
                      phone_number={result.phone_number}
                      details={result.details}
                      website={result.website}
                      rating={result.rating}
                      rating_count={result.rating_count}
                      loading={loading}
                      deleteGMapRequest={deleteGMapRequest}
                    />
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {mode === IGMap.COLLECTION &&
        octoBitsResults.map(octoBitResult => {
          return (
            <OctoBitRecord
              recordId={octoBitResult.id}
              desc={octoBitResult.job}
              requester={octoBitResult.job_requested_by}
              status={octoBitResult.status}
              date={octoBitResult.created}
              workerId={octoBitResult.worker_id}
              showMapResults={showMapResults}
              key={octoBitResult.id}
              deleteAkOctobit={deleteAkOctobit}
              loading={loading}
            />
          );
        })}
    </div>
  );
};

export default GMAPScraper;
