import React from 'react'
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { Outlet } from 'react-router-dom';

const Section = () => {
    return (
        <div className="flex  w-screen h-screen overflow-x-hidden">
          <div className="flex-shrink-0">
            <Sidebar/>
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
    

export default Section