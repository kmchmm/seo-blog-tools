import { FC, use, useCallback } from 'react';
import ReactSwitch from 'react-switch';
import { DarkModeContext } from '../context/DarkModeContext';

const Headerbar: FC = () => {
  const { darkMode, setDarkMode } = use(DarkModeContext);

  const handleSwitched = useCallback(() => {
    setDarkMode(!darkMode);
  }, [darkMode, setDarkMode]);

  return (
    <div className="flex p-3 flex-col justify-center bg-white-100">
      <div className="border-1 border-black-100 rounded-md text-black-100 h-22 flex flex-row items-center p-4">
        <div className="ml-auto">
          <ReactSwitch
            uncheckedIcon={false}
            checkedIcon={false}
            onChange={handleSwitched}
            checked={darkMode}
            height={16}
            width={36}
            handleDiameter={22}
            onColor="#84b5e6"
            offColor="#091A31"
            offHandleColor="#ffffff"
            onHandleColor="#1976d2"
          />
        </div>
      </div>
    </div>
  );
};

export default Headerbar;