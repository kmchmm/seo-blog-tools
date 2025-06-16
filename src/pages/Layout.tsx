// src/pages/Layout.tsx
import React from 'react';
import Headerbar from './Headerbar';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col">
      <Sidebar />
      <Headerbar />
      <div className="p-4 w-full">
        <Outlet /> {/* This renders the nested routes or page content */}
      </div>
    </div>
  );
};

export default Layout;
