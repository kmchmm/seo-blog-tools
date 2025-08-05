import { FC, use, useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import ReactSwitch from 'react-switch';
import { DarkModeContext } from '../context/DarkModeContext';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

const ANON_INITIAL = 'u';
const lightModeStyle = 'border-black-100 text-black-100';
const darkModeStyle = 'dark:border-yellow-100 dark:text-white-100';

const rippleEffectStyle = `animate-ripple duration-50
  ease-in-out transform-[scale(0)] opacity-100`;

const profileBoxShadow =
  'shadow-[0_5px_5px_-3px_theme(color-shadow-200/.20),0_8px_10px_1px_theme(color-shadow-200/.14),0_3px_14px_2px_theme(color-shadow-200/.12)]';

const Headerbar: FC = () => {
  const { darkMode, setSaveDarkMode } = use(DarkModeContext);
  const { userData } = use(UserContext);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [initials, setInitials] = useState<string>(ANON_INITIAL);
  const navigate = useNavigate();

  const handleSwitched = useCallback(() => {
    setSaveDarkMode(!darkMode);
  }, [darkMode, setSaveDarkMode]);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      profileMenuRef.current &&
      profileButtonRef.current &&
      !profileMenuRef.current.contains(event.target as Node) &&
      !profileButtonRef.current.contains(event.target as Node)
    ) {
      document.removeEventListener('mousedown', handleClickOutside);
      setShowProfileMenu(false);
    }
  };

  const onLogClick = (event: React.MouseEvent<HTMLLIElement>) => {
    // if has data-href, hide menu then navigate
    const dataHref = (event.target as HTMLLabelElement).getAttribute('data-href');
    if (dataHref) {
      document.removeEventListener('mousedown', handleClickOutside);
      setShowProfileMenu(false);
      navigate(dataHref);
    }
  };

  const handleTooltip = useCallback(() => {
    if (!showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    setShowProfileMenu(!showProfileMenu);
  }, [showProfileMenu]);

  useEffect(() => {
    if (userData.nickname) {
      setInitials(userData.nickname.substring(0, 1));
      return;
    }

    setInitials(ANON_INITIAL);
  }, [userData]);

  useEffect(() => {
    // Cleanup the event listener when the component unmounts
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex p-3 flex-col justify-center bg-white-100 dark:bg-blue-600">
      <div
        className={clsx(
          'h-22 flex flex-row items-center p-4 rounded-md border-1 ',
          lightModeStyle,
          darkModeStyle
        )}>
        <h2 className="ml-10 text-3xl">
          Hello, {userData.full_name ? userData.full_name : 'guest'}
        </h2>
        <div className="ml-auto">
          <ReactSwitch
            className="top-1"
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
            ref={profileButtonRef}
            onClick={handleTooltip}>
            <div
              className={clsx(
                'flex relative justify-center items-center',
                'w-[40px] h-[40px] bg-gray-200 rounded-[50%] font-(family-name:--roboto-font)'
              )}>
              {initials}
            </div>
            <span
              className={clsx(
                'absolute pointer-events-none w-full h-full',
                'rounded-[50%] bg-shadow-200/20',
                rippleEffectStyle
              )}></span>
          </button>
        </div>

        <div
          className={clsx(
            'absolute top-20 right-5 bg-white-100 transform-none',
            'origin-[10px 0px] min-w-[16px] min-h-[16px] rounded-sm',
            'max-w-[calc(100%-32px)] max-h-[calc(100%-32px)]',
            'transition-[visibility,opacity,transform] duration-[200ms,207ms,138ms]',
            'ease-[cubic-bezier(0.4,0,0.2,1),cubic-bezier(0.4,0,0.2,1),cubic-bezier(0.4,0,0.2,1)]',
            'w-[120px] text-center',
            profileBoxShadow,
            showProfileMenu ? 'opacity-100' : 'invisible opacity-0'
          )}
          ref={profileMenuRef}>
          <ul className="py-3 px-0">
            <li
              className={clsx(
                'relative inline-flex items-center justify-center overflow-hidden',
                'underline text-blue-300 hover:bg-shadow-200/8',
                'cursor-pointer select-none active:[&_span]:transform-[scale(2)]',
                '!no-underline text-gray-800 !tracking-widest font-black'
              )}
              onClick={onLogClick}>
              {userData.id ? (
                <label
                  className="cursor-pointer py-2 px-4"
                  data-href="/logout"
                  tabIndex={0}
                  role="link">
                  Sign Out
                </label>
              ) : (
                <label
                  className="cursor-pointer py-2 px-4"
                  data-href="/login"
                  tabIndex={0}
                  role="link">
                  Sign In
                </label>
              )}

              <span
                className={clsx(
                  'absolute pointer-events-none w-full h-full',
                  'rounded-[50%] bg-blue-300/20',
                  rippleEffectStyle
                )}></span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Headerbar;
