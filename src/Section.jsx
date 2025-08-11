import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { Outlet } from 'react-router-dom';

const Section = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState(null);

    return (
        <div className="flex w-screen h-screen overflow-hidden relative">
            {/* Sidebar */}
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            {/* Main Content */}
            <div
                className={`flex-grow flex flex-col transition-all duration-300 ease-in-out ${
                    isSidebarOpen ? 'ml-64' : 'ml-16'
                }`}
            >
                {/* Topbar */}
                <div>
                    <Topbar />
                </div>

                {/* Page Content */}
                <div className="flex-grow bg-blue-50 overflow-y-auto px-4 py-2">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Section;