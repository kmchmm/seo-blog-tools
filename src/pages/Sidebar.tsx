import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../assets/css/Home.css'; // For styling the sidebar

const Sidebar: React.FC = () => {
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
    <div className="home-container">
      {/* Only show the button when the sidebar is not open */}
      {!isSidebarOpen && (
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <i className="bx bx-menu"></i>
        </button>
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef} // Attach the ref to the sidebar div
        className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <h2>AK RAKET</h2>
        <ul>
          <li>
            <h3>OCTO TOOLS</h3>
            <ul>
              <li>
                <Link to="/news">
                  <i className="bx bx-news"></i>
                  <span>NEWS Scraper</span>
                </Link>
              </li>
              <li>
                <Link to="/paa">
                  <i className="bx bxl-google"></i>
                  <span>GPAA Scraper</span>
                </Link>
              </li>
              <li>
                <Link to="/gmap">
                  <i className="bx bxs-location-plus"></i>
                  <span>GMAP Scraper</span>
                </Link>
              </li>
            </ul>
          </li>
          <li>
            <h3>SEO TOOLS</h3>
          </li>
          <li>
            <h3>PUBLISHING TOOLS</h3>
          </li>
          <li>
            <h3>HR MANAGEMENT</h3>
          </li>
          <li>
            <h3>EXTENSIONS</h3>
          </li>
          <li>
            <h3>PBN's HQ</h3>
          </li>
          <li>
            <h3>FREE TOOLS</h3>
          </li>
        </ul>
      </div>

      {/* Add overlay when sidebar is open */}
      {isSidebarOpen && <div className="overlay" onClick={toggleSidebar}></div>}
    </div>
  );
};

export default Sidebar;
