// src/pages/Layout.tsx
import React from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  return (
    <div style={layoutStyle}>
      <Sidebar />
      <div style={contentStyle}>
        <Outlet /> {/* This renders the nested routes or page content */}
      </div>
    </div>
  );
};

const layoutStyle: React.CSSProperties = {
  display: 'flex',
};

const contentStyle: React.CSSProperties = {
  padding: '0px',
  width: '100%', // Adjust the content area width
};

export default Layout;
