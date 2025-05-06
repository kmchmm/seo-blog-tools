import { FC, KeyboardEvent, use, useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import clsx from 'clsx';

import pb from '../utils/pocketbaseInit.js';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { UserContext } from '../context/UserContext';
import { ToastContext } from '../context/ToastContext';
import Download from '../assets/icons/download.svg?react';

const AK_SERPER_COLLECTION = 'ak_serper';
const AK_OCTOBITS_COLLECTION = 'ak_octobits';

interface resultData {
  title: string;
  link: string;
  description: string;
  content: string;
}

interface harvesterRecord {
  id: string;
  worker_id: string;
  keyword: string;
  collectionId: string;
  collectionName: string;
  results: {
    data: resultData[]
  };  
  status: string;
  requested_by: string;
  created: string;
  updated: string;
}

const isDev = import.meta.env.MODE === 'development';

const apiUrl = isDev
  ? import.meta.env.VITE_LOCAL_P1_HARVESTER_API_URL
  : import.meta.env.VITE_PROD_P1_HARVESTER_API_URL;

const customLoadingStyle = '[&>div]:h-5 [&>div]:w-5 [&>div]:mt-[2px]'

const formatDate = (dateString: string) => {
  // const d = new Date(dateString);
  // let month = '' + (d.getMonth() + 1);
  // let day = '' + d.getDate();
  // const year = d.getFullYear();

  // if (month.length < 2) 
  //   month = '0' + month;
  // if (day.length < 2) 
  //   day = '0' + day;

  // return [year, month, day].join('-');
  return new Date(dateString).toLocaleDateString('en-CA');
}

// automatically remove request from list
const deleteFromCollection = (collection: harvesterRecord[], recordId: string) => {
  const newCollection = [...collection];
  const indexOfDeleted = newCollection.findIndex(octoBit => {
    return octoBit.id === recordId;
  });
  newCollection.splice(indexOfDeleted, 1);
  return newCollection;
};

const P1Harvester: FC = () => {
  const [harvesterResults, setHarvesterResults] = useState<harvesterRecord[]>([]);
  const [keywords, setKeywords] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { userData } = use(UserContext);
  const { showToast } = use(ToastContext);  

  const p1Harvest = useCallback(
    async (keywords: string) => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.post(
          apiUrl,
          {
            keyword: keywords,
            requested_by: userData.full_name,
          },
          {}
        );

        const data = response.data;
        showToast(data.message);
        setLoading(false);
      } catch (err) {
        console.error('Error during API call:', err);
        setError('An error occurred while fetching results.');
        setLoading(false);
      } finally {
      }
    },
    [userData]
  );

  const handleSubmit = () => {
    if (keywords.trim() === '') {
      setError('Please enter a search keyword.');
    } else {
      setError('');
      p1Harvest(keywords);
    }
  }

  const inputKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  }

  // we put the click handler on the tbody to minimize mosue event bindings
  const downloadCSV = (event: React.MouseEvent) => {
    const eventTarget = event.target as HTMLElement;
    // check if button or descendant of button
    const btnTarget = eventTarget.closest('button[data-recordid]');
    if (!btnTarget) return;
    const recordId = btnTarget.getAttribute('data-recordid');
    // find record
    const recordToDownload = harvesterResults.find(record => record.id === recordId);
    if (!recordToDownload) return;

    // get csv content
    let csv = 'title,link,description,content\n';
    const recordResults = recordToDownload.results?.data;
    for (let index = 0; index < recordResults.length; index++) {
      const element = recordResults[index] as unknown as resultData;
      csv += '"' + element.title + '","' + element.link + '","' +
        element.description + '","' + element.content + '"' + '\n';
    }

    // simulate download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    a.download = `${recordToDownload.keyword.split(' ').join('-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const fetchHarvesterResults = async () => {
    const collection = await pb.collection(AK_SERPER_COLLECTION).getList(1, 50, {
      sort: '-created',
    });
    const collectionItems = collection['items'];
    // `as unknown as` - essential in this line to typecast into harvesterRecord :'( 
    setHarvesterResults(collectionItems as unknown as harvesterRecord[]);
  }

  useEffect(() => {
    fetchHarvesterResults();
  }, [])

  useEffect(() => {
    // globally disable auto cancellation
    pb.autoCancellation(false);
    // subscribe to SSE from pocketbase,
    pb.realtime.subscribe(AK_SERPER_COLLECTION, async e => {
      // scraping is completed
      if (e.action === 'update') {
          // a previous request (not current one) was completed
          // search in collection, then update in state
          const newCollection = [...harvesterResults];
          const indexOfUpdated = newCollection.findIndex(octoBit => {
            return octoBit.id === e.record.id;
          });
          newCollection[indexOfUpdated] = e.record;
          setHarvesterResults(newCollection);

        return;
      }

      // add in collection
      if (e.action === 'create') {
        const newOctoBitResults = [...harvesterResults];
        newOctoBitResults.unshift(e.record);
        setHarvesterResults(newOctoBitResults);
        return;
      }

      // delete in collection
      if (e.action === 'delete') {
        const newCollection = deleteFromCollection(harvesterResults, e.record.id);
        setHarvesterResults(newCollection);
        return;
      }
    });

    return () => {
      pb.realtime.unsubscribe(AK_SERPER_COLLECTION);
    };
  }, [harvesterResults])

  return (
    <div
      className={clsx(
        'flex flex-col items-center w-full pt-4 px-3',
        'bg-white-100 dark:bg-blue-600'
      )}>
      <h1 className="text-black-100 dark:text-white-100 text-5xl">AK P1 Harvester</h1>
      <p className="text-left italic self-start">You're one Google SERP 1 Page Power-Up</p>

      <div className="flex justify-between items-center w-full gap-4 flex-row">
        <div className="flex items-center w-1/2 gap-4">
          <input
            type="text"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            onKeyDown={inputKeyDown}
          />
          <Button
            className={clsx(
              loading ? 'h-[38px]' : '',
              customLoadingStyle
            )}
            onClick={handleSubmit}
            disabled={loading
          }>
            {loading ? <Loading /> : 'Submit'}
          </Button>
        </div>
        {!loading && error && (
          <p className="text-red-100 text-base text-center font-bold">{error}</p>
        )}
      </div>
      <table
        id="mapResults"
        className={clsx(
          'w-full my-[20px] mx-auto border-collapse',
          'table-fixed shadow-[0_4px_6px_rgba(0, 0, 0, 0.1)]'
        )}>
        <thead>
          <tr>
            <th>Keywords</th>
            <th className="w-25">Status</th>
            <th className="w-50">Requested Date</th>
            <th className="w-75">Requested by</th>
            <th className="w-25">Actions</th>
          </tr>
        </thead>
        <tbody onClick={downloadCSV}>
          { harvesterResults.map((record: harvesterRecord) => 
            <tr key={record.id}>
              <td>{record.keyword}</td>
              <td className={clsx(
                'capitalize',
                record.status === 'pending' ? '[&>div]:h-5 [&>div]:w-5' : ''
              )}>{record.status === 'pending' ? <Loading /> : record.status}</td>
              <td>{formatDate(record.created)}</td>
              <td>{record.requested_by}</td>
              <td className="dark:[&_svg]:fill-yellow-100">
                <button
                  disabled={record.status.toLowerCase()!=='done'}
                  className={record.status.toLowerCase()!=='done' ?
                    'cursor-disabled' : 'cursor-pointer'
                  }
                  data-recordid={record.id}
                >
                  <Download className="h-8" />
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default P1Harvester;
