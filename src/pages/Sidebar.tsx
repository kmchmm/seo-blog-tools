import { FC, use, useCallback, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

import { UserContext } from '../context/UserContext';
import MenuIcon from '../assets/icons/menu.svg?react';
import NewsIcon from '../assets/icons/news.svg?react';
import GoogleIcon from '../assets/icons/google.svg?react';
import MapsIcon from '../assets/icons/maps.svg?react';
import JediInsightsIcon from '../assets/icons/insights.svg?react';
import SERPRankIcon from '../assets/icons/serp.svg?react';
import HunterIcon from '../assets/icons/hunter.svg?react';
import P1HarvesterIcon from '../assets/icons/harvester.svg?react';
import GeoTaggerIcon from '../assets/icons/geo-fill.svg?react';
import CrossSite from '../assets/icons/cross-site.svg?react';
import Kompass from '../assets/icons/kompass.svg?react';
import Loom from '../assets/icons/loom.svg?react';
import Chronos from '../assets/icons/chronos.svg?react';
import AKPHub from '../assets/icons/akphub.svg?react';
import ChatWidget from '../assets/icons/chat-widget.svg?react';
import TitleTweak from '../assets/icons/title-tweak.svg?react';
import HTMLCleaner from '../assets/icons/html-cleaner.svg?react';
import DupeKiller from '../assets/icons/dupe-killer.svg?react';

import { TOOLS, TOOL_ROUTES } from '../types';
import { Loading } from '../components/Loading';

interface RaketMenuItemProps extends React.LiHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
}

const sidebarStyle = clsx(
  'fixed top-0 w-[250px] h-full p-0 z-10 overflow-auto',
  'transition-[left] duration-300 ease-ease',
  'bg-white-100 text-black-100',
  'shadow-[0_8px_10px_-5px_theme(color-shadow-200/.20),0_16px_24px_2px_theme(color-shadow-200/.14),0_6px_30px_5px_theme(color-shadow-200/.12)]',
  'dark:bg-blue-600 dark:text-white-100'
);

const menuItemLinkStyle = '[&_a]:flex [&_a]:items-center [&_a]:gap-1';
const menuItemSvgStyle = '[&_svg]:h-6';

const Sidebar: FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toolsAccess, loadingGetTools } = use(UserContext);
  const sidebarRef = useRef<HTMLDivElement>(null); // Create a reference for the sidebar

  const RaketMenuItem = (itemProps: RaketMenuItemProps) => {
    const { children } = itemProps;

    return (
      <li
        onClick={() => setIsSidebarOpen(false)}
        className={clsx(
          'p-1 rounded-md',
          'transition-all duration-200 ease-in-out',
          'hover:bg-yellow-100',
          'dark:[&_svg]:fill-white-100',
          menuItemSvgStyle,
          menuItemLinkStyle
        )}>
        {children}
      </li>
    );
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close the sidebar if the click is outside the sidebar
  const handleClickOutside = (event: MouseEvent) => {
    if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
      setIsSidebarOpen(false);
    }
  };

  // fix: elements behind sidebar are getting tab focus
  const trapTabFocus = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      const focusableEls = (sidebarRef.current as HTMLDivElement).querySelectorAll('a');

      const firstFocusableEl = focusableEls[0];
      const lastFocusableEl = focusableEls[focusableEls.length - 1];

      if (event.shiftKey) {
        /* shift + tab */ if (document.activeElement === firstFocusableEl) {
          lastFocusableEl.focus();
          event.preventDefault();
        }
      } /* tab */ else {
        if (document.activeElement === lastFocusableEl) {
          firstFocusableEl.focus();
          event.preventDefault();
        }
      }
      return;
    }
    if (event.key === 'Escape') {
      setIsSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isSidebarOpen) {
      document.addEventListener('keydown', trapTabFocus);
    } else {
      document.removeEventListener('keydown', trapTabFocus);
    }

    return () => {
      document.removeEventListener('keydown', trapTabFocus);
    };
  }, [isSidebarOpen, trapTabFocus]);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isSidebarOpen]);

  const renderListContent = () => {
    if (loadingGetTools) {
      return (
        <div className="text-center">
          <Loading />
        </div>
      );
    }

    return (
      <ul>
        <li>
          <h3 className="p-1 dark:text-yellow-100">OCTO TOOLS</h3>
          <ul className="p-2">
            {toolsAccess.includes(TOOLS.NEWS) && (
              <RaketMenuItem>
                <Link tabIndex={isSidebarOpen ? 0 : -1} to={TOOL_ROUTES.NEWS}>
                  <NewsIcon />
                  <span>NEWS Scraper</span>
                </Link>
              </RaketMenuItem>
            )}
            {toolsAccess.includes(TOOLS.PAA) && (
              <RaketMenuItem>
                <Link tabIndex={isSidebarOpen ? 0 : -1} to={TOOL_ROUTES.PAA}>
                  <GoogleIcon />
                  <span>GPAA Scraper</span>
                </Link>
              </RaketMenuItem>
            )}
            {toolsAccess.includes(TOOLS.GMAP) && (
              <RaketMenuItem>
                <Link tabIndex={isSidebarOpen ? 0 : -1} to={TOOL_ROUTES.GMAP}>
                  <MapsIcon />
                  <span>GMAP Scraper</span>
                </Link>
              </RaketMenuItem>
            )}
          </ul>
        </li>
        <li>
          <h3 className="p-1 dark:text-yellow-100">SEO TOOLS</h3>
          <ul className="p-2">
            {toolsAccess.includes(TOOLS.JEDI_INSIGHTS) && (
              <RaketMenuItem>
                <Link tabIndex={isSidebarOpen ? 0 : -1} to={TOOL_ROUTES.JEDI_INSIGHTS}>
                  <JediInsightsIcon />
                  <span>Jedi Insights</span>
                </Link>
              </RaketMenuItem>
            )}
            {toolsAccess.includes(TOOLS.SERP_RANK) && (
              <RaketMenuItem>
                <Link tabIndex={isSidebarOpen ? 0 : -1} to={TOOL_ROUTES.SERP_RANK}>
                  <SERPRankIcon />
                  <span>SERP Rank</span>
                </Link>
              </RaketMenuItem>
            )}
            {toolsAccess.includes(TOOLS.HUNTER) && (
              <RaketMenuItem>
                <Link tabIndex={isSidebarOpen ? 0 : -1} to={TOOL_ROUTES.HUNTER}>
                  <HunterIcon />
                  <span>Hunter</span>
                </Link>
              </RaketMenuItem>
            )}
            {toolsAccess.includes(TOOLS.HARVESTER) && (
              <RaketMenuItem>
                <Link tabIndex={isSidebarOpen ? 0 : -1} to={TOOL_ROUTES.HARVESTER}>
                  <P1HarvesterIcon />
                  <span>P1 Harvester</span>
                </Link>
              </RaketMenuItem>
            )}

            <RaketMenuItem>
              <Link tabIndex={isSidebarOpen ? 0 : -1} to={TOOL_ROUTES.GEO_TAGGER}>
                <GeoTaggerIcon />
                <span>Geo Tagger</span>
              </Link>
            </RaketMenuItem>
          </ul>
        </li>
        <li>
          <h3 className="p-1 dark:text-yellow-100">PUBLISHING TOOLS</h3>
          <ul className="p-2">
            {toolsAccess.includes(TOOLS.CROSS_SITE_POSTING) && (
              <RaketMenuItem>
                <Link
                  tabIndex={isSidebarOpen ? 0 : -1}
                  to={TOOL_ROUTES.CROSS_SITE_POSTING}>
                  <CrossSite />
                  <span>CrossSite Poster</span>
                </Link>
              </RaketMenuItem>
            )}
            {toolsAccess.includes(TOOLS.KOMPASS) && (
              <RaketMenuItem>
                <Link tabIndex={isSidebarOpen ? 0 : -1} to={TOOL_ROUTES.KOMPASS}>
                  <Kompass />
                  <span>Kompass</span>
                </Link>
              </RaketMenuItem>
            )}
            {toolsAccess.includes(TOOLS.LOOM) && (
              <RaketMenuItem>
                <Link tabIndex={isSidebarOpen ? 0 : -1} to={TOOL_ROUTES.LOOM}>
                  <Loom />
                  <span>Loom</span>
                </Link>
              </RaketMenuItem>
            )}
            <RaketMenuItem>
              <Link tabIndex={isSidebarOpen ? 0 : -1} to={TOOL_ROUTES.AI_ASSISTANT}>
                <Loom />
                <span>BINI</span>
              </Link>
            </RaketMenuItem>
            <RaketMenuItem>
              <Link tabIndex={isSidebarOpen ? 0 : -1} to={TOOL_ROUTES.BLOG_ANALYSIS}>
                <Loom />
                <span>Blog Optimization</span>
              </Link>
            </RaketMenuItem>
          </ul>
        </li>
        <li>
          <h3 className="p-1 dark:text-yellow-100">HR MANAGEMENT</h3>
          <ul className="p-2">
            {toolsAccess.includes(TOOLS.CHRONOS) && (
              <RaketMenuItem>
                <Link tabIndex={isSidebarOpen ? 0 : -1} to={TOOL_ROUTES.CHRONOS}>
                  <Chronos />
                  <span>Chronos</span>
                </Link>
              </RaketMenuItem>
            )}
            {toolsAccess.includes(TOOLS.MONITORING) && (
              <RaketMenuItem>
                <Link tabIndex={isSidebarOpen ? 0 : -1} to={TOOL_ROUTES.MONITORING}>
                  <AKPHub />
                  <span>AKPHub Monitoring</span>
                </Link>
              </RaketMenuItem>
            )}
          </ul>
        </li>
        <li>
          <h3 className="p-1 dark:text-yellow-100">EXTENSIONS</h3>
          <ul className="p-2">
            {toolsAccess.includes(TOOLS.CHAT) && (
              <RaketMenuItem>
                <Link tabIndex={isSidebarOpen ? 0 : -1} to={TOOL_ROUTES.CHAT}>
                  <ChatWidget />
                  <span>CHAT WIDGET</span>
                </Link>
              </RaketMenuItem>
            )}
          </ul>
        </li>
        <li>
          <h3 className="p-1 dark:text-yellow-100">PBN's HQ</h3>
          <ul className="p-2"></ul>
        </li>
        <li>
          <h3 className="p-1 dark:text-yellow-100">FREE TOOLS</h3>
          <ul className="p-2">
            <RaketMenuItem>
              <Link tabIndex={isSidebarOpen ? 0 : -1} to={TOOL_ROUTES.TITLE_TWEAK}>
                <TitleTweak />
                <span>Title Tweak</span>
              </Link>
            </RaketMenuItem>
            <RaketMenuItem>
              <Link tabIndex={isSidebarOpen ? 0 : -1} to={TOOL_ROUTES.HTML_CLEANER}>
                <HTMLCleaner />
                <span>HTML Cleaner</span>
              </Link>
            </RaketMenuItem>
            <RaketMenuItem>
              <Link tabIndex={isSidebarOpen ? 0 : -1} to={TOOL_ROUTES.DUPE_KILLER}>
                <DupeKiller />
                <span>Dupe Killer</span>
              </Link>
            </RaketMenuItem>
          </ul>
        </li>
      </ul>
    );
  };

  useEffect(() => {
    // Add event listener for click outside the sidebar
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup the event listener when the component unmounts
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []); // Empty dependency array means it runs only once on mount and unmount

  return (
    <div className="flex relative">
      {/* Only show the button when the sidebar is not open */}
      {!isSidebarOpen && (
        <button
          className={clsx(
            'sidebar-toggle',
            'absolute flex justify-around flex-column dark:[&_svg]:fill-white-100',
            'transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]',
            'top-9 left-7 p-2 cursor-pointer z-10 rounded-[50%] hover:bg-black/4',
            'hover:bg-shadow-200/4 active:[&_span]:transform-[scale(1)]'
          )}
          onClick={toggleSidebar}>
          <MenuIcon className="w-6" />
          <span
            className={clsx(
              'absolute pointer-events-none w-full h-full rounded-[50%]',
              'bg-shadow-200/20 top-0',
              'animate-ripple duration-200 ease-linear transform-[scale(0)]'
            )}></span>
        </button>
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef} // Attach the ref to the sidebar div
        className={clsx(isSidebarOpen ? 'left-0' : '-left-[350px]', sidebarStyle)}>
        <h2 className="p-2 font-bold text-3xl mb-3">
          <Link tabIndex={isSidebarOpen ? 0 : -1} to="/">
            <span>AK RAKET</span>
          </Link>
        </h2>
        {renderListContent()}
      </div>

      {/* Add overlay when sidebar is open
          We opted to use opacity instead of unmount in order to show proper transition
          which can be done on unmount, but a bit more complex
      */}
      <div
        className={clsx(
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
          'fixed top-0 left-0 w-full h-full',
          'backdrop-blur-xs z-9 bg-black/50',
          'transition-opacity duration-225 ease-[cubic-bezier(0.4,0,0.2,1)]'
        )}></div>
    </div>
  );
};

export default Sidebar;
