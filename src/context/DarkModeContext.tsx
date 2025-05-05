import { createContext, useEffect, useState } from 'react';

const LOCAL_STORAGE_DARKMODE_KEY = 'ak_ph_dark_mode';

interface ContextProps {
  darkMode: boolean;
  setSaveDarkMode: Function;
}

export const DarkModeContext = createContext<ContextProps>({
  darkMode: false,
  setSaveDarkMode: () => {},
});

//@todo: remove any, use proper typing for children
export const Provider = ({ children }: any) => {
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // we expose a different function from setDarkMode
  // to avoid re-setting to local storage from initial get
  const setSaveDarkMode = (saveDarkMode: boolean) => {
    localStorage.setItem(LOCAL_STORAGE_DARKMODE_KEY, String(saveDarkMode));
    setDarkMode(saveDarkMode);
  };

  useEffect(() => {
    const body = document.querySelector('body');

    if (darkMode) {
      body?.classList.add('dark');
      return;
    }
    body?.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem(LOCAL_STORAGE_DARKMODE_KEY);
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === 'true');
    }
  }, []);

  return (
    <DarkModeContext value={{ darkMode, setSaveDarkMode }}>{children}</DarkModeContext>
  );
};

export default DarkModeContext;
