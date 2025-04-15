import React, { FC, use, useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';

import ReactSwitch from 'react-switch';
import { DarkModeContext } from '../context/DarkModeContext';
import { UserContext } from '../context/UserContext';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';

const ANON_INITIAL = 'u';
const lightModeStyle = 'border-black-100 text-black-100';
const darkModeStyle = 'dark:border-yellow-100 dark:text-white-100';

interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  children ?: React.ReactNode
}

const rippleEffectStyle = `animate-ripple duration-250
  ease-linear transform-[scale(0)]`;
const profileBoxShadow = 'shadow-[0_5px_5px_-3px_theme(color-shadow-200/.20),0_8px_10px_1px_theme(color-shadow-200/.14),0_3px_14px_2px_theme(color-shadow-200/.12)]';

const ProfileMenu = ({ children } :TooltipProps) => {
  return createPortal(
    <div
      style={{
        position: "absolute",
        top: "50px",
        left: "100px",
        background: "black",
        color: "white",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

const Headerbar: FC = () => {
  const { darkMode, setDarkMode } = use(DarkModeContext);
  const { userData } = use(UserContext);
  const [ showProfileMenu, setShowProfileMenu ] = useState<boolean>(false);
  const [ initials, setInitials ] = useState<string>(ANON_INITIAL);

  const handleSwitched = useCallback(() => {
    setDarkMode(!darkMode);
  }, [darkMode, setDarkMode]);

  const handleTooltip = useCallback(() => {
    setShowProfileMenu(!showProfileMenu)
  }, [showProfileMenu])

  useEffect(() => {
    console.log('USER')
    console.log(userData);
    if (userData.nickname) {
      setInitials(userData.nickname)
      return;
    }

    setInitials(ANON_INITIAL);
  }, [userData])


  return (
    <div className="flex p-3 flex-col justify-center bg-white-100 dark:bg-blue-600">
      <div
        className={clsx(
          'h-22 flex flex-row items-center p-4 rounded-md border-1 ',
          lightModeStyle,
          darkModeStyle
        )}>
        <h2 className="ml-10 text-3xl">Hello {userData.nickname}</h2>
        <div className="ml-auto">
          <ReactSwitch
            className='top-1'
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
          <button
            className={clsx(
              'relative inline-flex items-center justify-center',
              'text-center rounded-[50%]',
              ' text-xl text-white-100 p-2 box-border cursor-pointer capitalize',
              'hover:bg-shadow-200/4 active:[&_span]:transform-[scale(1)]'
            )}
            onClick={handleTooltip}
          >
            <div className={clsx(
              'flex relative justify-center items-center',
              'w-[40px] h-[40px] bg-gray-200 rounded-[50%] font-(family-name:--roboto-font)'
            )}>
              { initials }
            </div>
            <span className={clsx(
              'absolute pointer-events-none w-full h-full',
              'rounded-[50%] bg-shadow-200/20',
              rippleEffectStyle
            )}></span>
          </button>

        </div>

        {showProfileMenu && <div className={clsx(
          'absolute top-20 right-5 bg-white-100 opacity-100 transform-none',
          'origin-[10px 0px] min-w-[16px] min-h-[16px] rounded-sm',
          'max-w-[calc(100%-32px)] max-h-[calc(100%-32px)]',
          'transition-[opacity,transform] duration-[207ms, 138ms]',
          'ease-[cubic-bezier(0.4,0,0.2,1),cubic-bezier(0.4,0,0.2,1)]',
          profileBoxShadow
        )}>
          <ul className="py-3 px-0">
            <li className={clsx(
              'relative inline-flex items-center justify-center overflow-hidden',
              'py-2 px-4 underline text-blue-300 hover:bg-shadow-200/4',
              'select-none active:[&_span]:transform-[scale(2)]'
            )}>
              <Link to="/logout">
                <span>Logout</span>
              </Link>
              <span className={clsx(
                  'absolute pointer-events-none w-full h-full',
                  'rounded-[50%] bg-blue-300/20',
                  rippleEffectStyle
                )}></span>
            </li>
          </ul>  
        </div>}
      </div>
    </div>
  );
};

export default Headerbar;
