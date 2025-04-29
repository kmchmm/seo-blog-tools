import { createContext, useEffect, useState } from 'react';
import supabase from '../utils/supabaseInit.js';

const LOCAL_STORAGE_USER_KEY = 'ak_ph_user_data';

interface UserData {
  id: number;
  profilegrid_id: number;
  username: string;
  email: string;
  birthdate: string;
  full_name: string;
  nickname: string;
  cover_photo: string;
  profile_picture: string;
  gender: string;
  department: string;
  country: string;
  position: string;
  city: string;
  about_me: string;
  employment: string;
  date_hired: string;
  regularization_date: string;
  date_created: string;
  date_deleted: string;
  active: boolean;
}

const initUserData = {
  id: 0,
  profilegrid_id: 0,
  username: '',
  email: '',
  birthdate: '',
  full_name: '',
  nickname: '',
  cover_photo: '',
  profile_picture: '',
  gender: '',
  department: '',
  country: '',
  position: '',
  city: '',
  about_me: '',
  employment: '',
  date_hired: '',
  regularization_date: '',
  date_created: '',
  date_deleted: '',
  active: false,
};

interface UserContextProps {
  userData: UserData;
  setUserData: Function;
  logout: Function;
  toolsAccess: String[];
  setToolsAccess: Function;
}

interface ToolsResults {
  id: number;
  created_at: string;
  department: string;
  tool_access: {
    access: String[];
  };
}

export const UserContext = createContext<UserContextProps>({
  userData: initUserData,
  setUserData: () => {},
  logout: () => {},
  toolsAccess: [],
  setToolsAccess: () => {},
});

//@todo: remove any, use proper typing for children
export const Provider = ({ children }: any) => {
  const [userData, setUserData] = useState<UserData>(initUserData);
  const [toolsAccess, setToolsAccess] = useState<String[]>([]);

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
          const tools: String[] = (toolsData[0] as ToolsResults)['tool_access']['access'];
          setToolsAccess(tools);
        }

        return;
      }
      setToolsAccess([]);
    } catch (e) {
      setToolsAccess([]);
      console.log('ERROR FETCHING TOOLS ACCESS');
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
