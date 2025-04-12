import { FC, use, useCallback } from 'react';
import clsx from 'clsx';

import ReactSwitch from 'react-switch';
import { DarkModeContext } from '../context/DarkModeContext';

const lightModeStyle = 'border-black-100 text-black-100';
const darkModeStyle = 'dark:border-yellow-100 dark:text-white-100';

const Headerbar: FC = () => {
  const { darkMode, setDarkMode } = use(DarkModeContext);

  const handleSwitched = useCallback(() => {
    setDarkMode(!darkMode);
  }, [darkMode, setDarkMode]);

  return (
    <div className="flex p-3 flex-col justify-center bg-white-100 dark:bg-blue-600">
      <div
        className={clsx(
          'h-22 flex flex-row items-center p-4 rounded-md border-1 ',
          lightModeStyle,
          darkModeStyle
        )}>
        <h2 className="ml-10 text-3xl">Hello</h2>
        <div className="ml-auto">
          <ReactSwitch
            uncheckedIcon={false}
            checkedIcon={false}
            onChange={handleSwitched}
            checked={darkMode}
            height={16}
            width={36}
            handleDiameter={22}
            offColor="#84b5e6"
            onColor="#060f1d"
            onHandleColor="#ffffff"
            offHandleColor="#1976d2"
          />
        </div>
      </div>
    </div>
  );
};

export default Headerbar;
