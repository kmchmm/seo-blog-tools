import { createContext, useEffect, useState } from "react";

interface ContextProps {
  darkMode: boolean;
  setDarkMode: Function;
}

export const DarkModeContext = createContext<ContextProps>({
  darkMode: true,
  setDarkMode: () => {}
});

//@todo: remove any, use proper typing for children
export const Provider = ({ children } : any) => {
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const body = document.querySelector('body');
    if (darkMode) {
      body?.classList.add('dark');
      return;
    }
    body?.classList.remove('dark');
  }, [darkMode])

  return <DarkModeContext.Provider value={{darkMode, setDarkMode}}>{children}</DarkModeContext.Provider>
}

export default DarkModeContext;