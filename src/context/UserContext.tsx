import { createContext, FC, PropsWithChildren, useEffect, useState } from 'react';
import supabase from '../utils/supabaseInit.js';
import { initialState, initUserData } from './auth/initialState.js';
import { ToolsResults, UserData } from './auth/types.js';

const LOCAL_STORAGE_USER_KEY = 'ak_ph_user_data';

// eslint-disable-next-line react-refresh/only-export-components
export const UserContext = createContext(initialState);

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type ProviderProps = {};

export const Provider: FC<PropsWithChildren<ProviderProps>> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>(initUserData);
  const [toolsAccess, setToolsAccess] = useState<string[]>([]);

  const logout = () => {
    setUserData(initUserData);
    setToolsAccess([]);
  };

  useEffect(() => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (savedData) {
      try {
        const userData = JSON.parse(savedData);
        if (userData.id) setUserData(userData);
      } catch (e) {
        console.log('ERROR PARSING SAVED USER DATA');
        console.log(e);
      }
    }
  }, []);

  const fetchTools = async (department: string) => {
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
      const error = e instanceof Error ? e.message : 'RROR FETCHING TOOLS ACCESS';
      setToolsAccess([]);
      console.log(error);
    }
  };

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userData));
    fetchTools(userData.department);
  }, [userData]);

  return (
    <UserContext
      value={{
        userData,
        setUserData,
        logout,
        toolsAccess,
        setToolsAccess,
      }}>
      {children}
    </UserContext>
  );
};

export default UserContext;
