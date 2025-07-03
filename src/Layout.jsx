import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Topbar from './components/Topbar';

const Layout = () => {
  return (
    <div className="flex  w-screen h-screen overflow-x-hidden">
      <div className="flex-shrink-0">
        <Navbar />
      </div>
      <div className="flex-grow flex flex-col">
        <div className=''>
          <Topbar />
        </div>
        <div className="flex-grow ml-64 bg-blue-50">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
