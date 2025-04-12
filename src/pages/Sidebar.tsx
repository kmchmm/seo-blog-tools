import { FC, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

import MenuIcon from "../assets/icons/menu.svg?react";
import NewsIcon from "../assets/icons/news.svg?react";
import GoogleIcon from "../assets/icons/google.svg?react";
import MapsIcon from "../assets/icons/maps.svg?react";
import JediInsightsIcon from "../assets/icons/insights.svg?react";
import SERPRankIcon from "../assets/icons/serp.svg?react";
import HunterIcon from "../assets/icons/hunter.svg?react";
import P1HarvesterIcon from "../assets/icons/harvester.svg?react";

interface RaketMenuItemProps extends React.LiHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
}

const sidebarStyle = clsx(
  'fixed top-0 w-[250px] h-full p-0 z-10',
  'transition-[left] duration-300 ease-ease',
  'bg-white-100 text-black-100',
  'dark:bg-blue-600 dark:text-white-100');

const menuItemLinkStyle = '[&_a]:flex [&_a]:items-center [&_a]:gap-1';
const menuItemSvgStyle = '[&_svg]:h-6';

const RaketMenuItem = (itemProps: RaketMenuItemProps) => {
  const { children } = itemProps;

  return (
    <li className={clsx(
      'p-1 rounded-md',
      'transition-all duration-200 ease-in-out',
      'hover:bg-yellow-100',
      'dark:[&_svg]:fill-white-100',
      menuItemSvgStyle,
      menuItemLinkStyle
    )}>
      {children}
    </li>
  )
}

const Sidebar: FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null); // Create a reference for the sidebar

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
            'top-9 left-7 p-2 cursor-pointer z-10 rounded-[50%] hover:bg-black/4'
          )}
          onClick={toggleSidebar}
        >
          <MenuIcon className="w-6" />
        </button>
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef} // Attach the ref to the sidebar div
        className={clsx(
          isSidebarOpen ? 'left-0' : '-left-[350px]',
          sidebarStyle  
        )}>
        <h2 className='p-2 font-bold text-3xl mb-3'>
          <Link to="/">
            <span>AK RAKET</span>
          </Link>
        </h2>
        <ul>
          <li>
            <h3 className="p-1 dark:text-yellow-100">OCTO TOOLS</h3>
            <ul className="p-2">
              <RaketMenuItem>
                <Link to="/scrape/news">
                  <NewsIcon />
                  <span>NEWS Scraper</span>
                </Link>
              </RaketMenuItem>
              <RaketMenuItem>
                <Link to="/scrape/paa">
                  <GoogleIcon />
                  <span>GPAA Scraper</span>
                </Link>
              </RaketMenuItem>
              <RaketMenuItem>
                <Link to="/scrape/gmap">
                  <MapsIcon />
                  <span>GMAP Scraper</span>
                </Link>
              </RaketMenuItem>
            </ul>
          </li>
          <li>
            <h3 className="p-1 dark:text-yellow-100">SEO TOOLS</h3>
            <ul className="p-2">
              <RaketMenuItem>
                <Link to="/seo/jedi-insights">
                  <JediInsightsIcon />
                  <span>Jedi Insights</span>
                </Link>
              </RaketMenuItem>
              <RaketMenuItem>
                <Link to="/seo/serp-checker">
                  <SERPRankIcon />
                  <span>SERP Rank</span>
                </Link>
              </RaketMenuItem>
              <RaketMenuItem>
                <Link to="/seo/hunter">
                  <HunterIcon />
                  <span>Hunter</span>
                </Link>
              </RaketMenuItem>
              <RaketMenuItem>
                <Link to="/seo/harvester">
                  <P1HarvesterIcon />
                  <span>P1 Harvester</span>
                </Link>
              </RaketMenuItem>
            </ul>
          </li>
          <li>
            <h3 className="p-1 dark:text-yellow-100">PUBLISHING TOOLS</h3>
          </li>
          <li>
            <h3 className="p-1 dark:text-yellow-100">HR MANAGEMENT</h3>
          </li>
          <li>
            <h3 className="p-1 dark:text-yellow-100">EXTENSIONS</h3>
          </li>
          <li>
            <h3 className="p-1 dark:text-yellow-100">PBN's HQ</h3>
          </li>
          <li>
            <h3 className="p-1 dark:text-yellow-100">FREE TOOLS</h3>
          </li>
        </ul>
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
          'transition-opacity duration-225 ease-[cubic-bezier(0.4,0,0.2,1)]',
        )}
      ></div>
    </div>
  );
};

export default Sidebar;
