import { useEffect, useState } from 'react';
import { IoDocumentTextOutline, IoDocumentsOutline } from 'react-icons/io5';
import { Card } from '../components/common';
import SingleSB37Analysis from '../components/aiAssistant/SingleSB37Analysis';
import BatchSB37Analysis from '../components/aiAssistant/BatchSB37Analysis';
import { useAuth, useSB37AnalysisContext } from '../hooks';
import { AI_PROCESS_SHEET_API_URL } from '../services/constants';

const AI_ASSISTANT_TYPES = [
  { title: 'SB37 Analysis - Per Document', icon: <IoDocumentTextOutline size={45} /> },
  { title: 'SB37 Analysis - By Batch', icon: <IoDocumentsOutline size={45} /> },
];

const AiAssistantPage = () => {
  const [activeCard, setActiveCard] = useState(AI_ASSISTANT_TYPES[0].title);
  const { userData } = useAuth();
  const { id: clientId } = userData || {};
  const { loadingSheets, singleLoading } = useSB37AnalysisContext();

  const renderCards = () => {
    if (activeCard === 'SB37 Analysis - Per Document') {
      return <SingleSB37Analysis />;
    }
    if (activeCard === 'SB37 Analysis - By Batch') {
      return <BatchSB37Analysis />;
    }
  };

  useEffect(() => {
    const hasActiveSheets = Object.values(loadingSheets).some(Boolean);
    if (!hasActiveSheets || !clientId) return;

    const isPageReload = () => {
      const navEntry = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      return navEntry?.type === 'reload';
    };

    const handleBeforeUnload = () => {
      if (isPageReload()) {
        navigator.sendBeacon(
          `${AI_PROCESS_SHEET_API_URL}/intent-to-reload`,
          JSON.stringify({ clientId: `${clientId}` })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [loadingSheets, clientId, singleLoading]);

  return (
    <div className="w-full h-full max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex gap-6 justify-center flex-wrap">
        {AI_ASSISTANT_TYPES.map(type => (
          <Card
            key={type.title}
            icon={type.icon}
            title={type.title}
            onClick={() => setActiveCard(type.title)}
            active={activeCard === type.title}
          />
        ))}
      </div>

      <div className="w-full rounded-lg shadow-xl flex flex-col p-8 dark:bg-gray-100 bg-gray-200/10 text-gray-900">
        <div className="text-center font-bold text-2xl">{activeCard}</div>
        {renderCards()}
      </div>
    </div>
  );
};

export default AiAssistantPage;
