import { createContext, FC, PropsWithChildren, useEffect, useState } from 'react';
import { initialState, initUserData } from './auth/initialState.js';
import { UserData } from './auth/types.js';
import useGetToolsAccess from '../hooks/useGetToolsAccess.js';

const LOCAL_STORAGE_USER_KEY = 'ak_ph_user_data';

// eslint-disable-next-line react-refresh/only-export-components
export const UserContext = createContext(initialState);

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type ProviderProps = {};

export const Provider: FC<PropsWithChildren<ProviderProps>> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>(initUserData);

  const {
    sendRequest,
    toolsAccess,
    handleSetToolsAccess,
    errorMessage,
    loading: loadingGetTools,
  } = useGetToolsAccess();

  const logout = () => {
    setUserData(initUserData);
    handleSetToolsAccess([]);
  };

  useEffect(() => {
    if (errorMessage) {
      console.log(`errorMessage`, errorMessage);
    }
  }, [errorMessage]);

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

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userData));
    sendRequest(userData.department);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  return (
    <UserContext
      value={{
        userData,
        setUserData,
        logout,
        toolsAccess,
        handleSetToolsAccess,
        loadingGetTools,
      }}>
      {children}
    </UserContext>
  );
};

export default UserContext;
