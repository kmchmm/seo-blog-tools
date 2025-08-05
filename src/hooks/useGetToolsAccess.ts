import { useState } from 'react';
import supabase from '../utils/supabaseInit';
import { ToolsResults } from '../context/auth/types';

const useGetToolsAccess = () => {
  const [toolsAccess, setToolsAccess] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSetToolsAccess = (tools: string[]) => {
    setToolsAccess(tools);
  };

  const sendRequest = async (department: string) => {
    setLoading(true);
    try {
      if (department) {
        const toolsResult = await supabase
          .from('department_access')
          .select('*')
          .eq('department', department.toLowerCase().replace(/\s+/g, '-'));

        const toolsData = toolsResult?.data;
        if (toolsData && toolsData[0]) {
          const tools: string[] = (toolsData[0] as ToolsResults)['tool_access']['access'];
          setToolsAccess(tools);
        }
        return;
      }
      setToolsAccess([]);
    } catch (e) {
      const error = e instanceof Error ? e.message : 'ERROR FETCHING TOOLS ACCESS';
      setToolsAccess([]);
      setErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };
  return { toolsAccess, sendRequest, loading, errorMessage, handleSetToolsAccess };
};

export default useGetToolsAccess;
