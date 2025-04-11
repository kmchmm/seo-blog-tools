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
    console.log('DARK MODE!!!', darkMode)
  }, [darkMode])

  return <DarkModeContext.Provider value={{darkMode, setDarkMode}}>{children}</DarkModeContext.Provider>
}

export default DarkModeContext;