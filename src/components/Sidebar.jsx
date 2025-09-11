import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import 'primeicons/primeicons.css';
import logo from '/school-logo.png';

const Sidebar = ({ isSidebarOpen, toggleSidebar, activeTab, setActiveTab }) => {
    const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');

    const toggleTab = (tab) => {
        setActiveTab(activeTab === tab ? null : tab);
    };

    useEffect(() => {
        if (!isSidebarOpen) {
            setActiveTab(null);
            setSearchQuery('');
        }
    }, [isSidebarOpen]);

    // Handle clicking outside the sidebar on mobile to close it
    const handleOverlayClick = () => {
        if (isSidebarOpen) {
            toggleSidebar();
        }
    };

    // Filter sidebar items based on search query
    const filterItems = (label, items = []) => {
        const lowerQuery = searchQuery.toLowerCase();
        return label.toLowerCase().includes(lowerQuery) ||
            items.some(item => item.label.toLowerCase().includes(lowerQuery));
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 sm:hidden"
                    onClick={handleOverlayClick}
                ></div>
            )}

            {/* Sidebar */}
            <div
                className={`
                    fixed top-0 left-0 h-screen transition-all duration-300 z-40
                    bg-blue-900 text-white
                    ${isSidebarOpen ? 'w-full sm:w-64' : 'w-16'}
                    sm:flex sm:flex-col
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
                `}
            >
                {/* Header with Logo or Hamburger */}
                <div className="relative flex items-center justify-between px-4 py-3 sm:py-4 border-b border-blue-700 bg-blue-900">
                    {isSidebarOpen ? (
                        <div className="flex items-center">
                            <img
                                src={logo}
                                alt="Logo"
                                className="w-8 h-8 sm:w-10 sm:h-10 mr-2"
                            />
                            <span className="font-bold text-white text-lg sm:text-xl">Acadian</span>
                        </div>
                    ) : (
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-full shadow-md hover:bg-blue-300 transition-all duration-200 text-blue-900 bg-white w-full flex justify-center"
                        >
                            <i className="pi pi-bars text-base sm:text-lg"></i>
                        </button>
                    )}
                    {isSidebarOpen && (
                        <button
                            onClick={toggleSidebar}
                            className="ml-4 p-2 rounded-full shadow-md hover:bg-blue-300 transition-all duration-200 text-blue-900 bg-white"
                        >
                            <i className="pi pi-bars text-base sm:text-lg"></i>
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                {isSidebarOpen && (
                    <div className="px-4 py-2 border-b border-blue-700 bg-blue-900">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-blue-800 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}

                {/* Scrollable Navigation */}
                <div
                    className="flex-1 overflow-y-auto"
                    style={{
                        scrollbarWidth: 'none', /* Firefox */
                        msOverflowStyle: 'none', /* IE and Edge */
                    }}
                >
                    <style>
                        {`
                            div::-webkit-scrollbar {
                                display: none; /* Chrome, Safari, Opera */
                            }
                        `}
                    </style>
                    <nav className="px-2 py-4">
                        <ul className="space-y-2">
                            {(!searchQuery || filterItems("Home")) && (
                                <SidebarLink
                                    to="/admin"
                                    icon="pi pi-home"
                                    label="Home"
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}

                            {permissions.includes("users.add_user") && (!searchQuery || filterItems("Registration")) && (
                                <SidebarLink
                                    to="/admin/registration"
                                    icon="pi pi-user-plus"
                                    label="Registration"
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                            {permissions.includes("users.view_studentprofile") && (!searchQuery || filterItems("Students", [
                                { label: "Student Information" },
                                { label: "Student ID Cards" },
                                { label: "Student Promotion" }
                            ])) && (
                                <SidebarDropdown
                                    label="Students"
                                    icon="pi pi-users"
                                    tabKey="student"
                                    activeTab={activeTab}
                                    toggleTab={toggleTab}
                                    items={[
                                        { to: "/admin/manage-student-information", label: "Student Information" },
                                        { to: "/admin/generate-student-id-cards", label: "Student ID Cards" },
                                        { to: "/admin/promotion-records", label: "Student Promotion" },
                                    ].filter(item => !searchQuery || item.label.toLowerCase().includes(searchQuery.toLowerCase()))}
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                            {permissions.includes("users.view_parentprofile") && (!searchQuery || filterItems("Parent")) && (
                                <SidebarLink
                                    to="/admin/manage-parent-account"
                                    icon="pi pi-user"
                                    label="Parent"
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                            {permissions.includes("users.view_teacherprofile") && (!searchQuery || filterItems("Teachers", [
                                { label: "Teacher Information" },
                                { label: "Teacher ID Cards" }
                            ])) && (
                                <SidebarDropdown
                                    label="Teachers"
                                    icon="pi pi-id-card"
                                    tabKey="teacher"
                                    activeTab={activeTab}
                                    toggleTab={toggleTab}
                                    items={[
                                        { to: "/admin/manage-teacher-details", label: "Teacher Information" },
                                        { to: "/admin/generate-teacher-id-cards", label: "Teacher ID Cards" },
                                    ].filter(item => !searchQuery || item.label.toLowerCase().includes(searchQuery.toLowerCase()))}
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                            {permissions.includes("users.view_staffprofile") && (!searchQuery || filterItems("Staff", [
                                { label: "Manage Staff Details" },
                                { label: "Staff ID Cards" }
                            ])) && (
                                <SidebarDropdown
                                    label="Staff"
                                    icon="pi pi-id-card"
                                    tabKey="staff"
                                    activeTab={activeTab}
                                    toggleTab={toggleTab}
                                    items={[
                                        { to: "/admin/manage-staff-details", label: "Manage Staff Details" },
                                        { to: "/admin/generate-staff-id-cards", label: "Staff ID Cards" },
                                    ].filter(item => !searchQuery || item.label.toLowerCase().includes(searchQuery.toLowerCase()))}
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                            {permissions.includes("users.view_timetable") && (!searchQuery || filterItems("Timetable")) && (
                                <SidebarLink
                                    to="/admin/manage-timetable"
                                    icon="pi pi-calendar"
                                    label="Timetable"
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                            {permissions.includes("users.view_room") && (!searchQuery || filterItems("Rooms")) && (
                                <SidebarLink
                                    to="/admin/rooms-management"
                                    icon="pi pi-building"
                                    label="Rooms"
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                            {permissions.includes("users.view_classname") && (!searchQuery || filterItems("Classes")) && (
                                <SidebarLink
                                    to="/admin/class-management"
                                    icon="pi pi-table"
                                    label="Classes"
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                            {permissions.includes("users.view_subject") && (!searchQuery || filterItems("Subjects")) && (
                                <SidebarLink
                                    to="/admin/subject-management"
                                    icon="pi pi-book"
                                    label="Subjects"
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                            {(permissions.includes("users.view_studentattendance") ||
                                permissions.includes("users.view_staffattendance")) && (!searchQuery || filterItems("Attendance", [
                                    { label: "Attendance Report" },
                                    { label: "Staff Attendance" }
                                ])) && (
                                <SidebarDropdown
                                    label="Attendance"
                                    icon="pi pi-calendar"
                                    tabKey="attendance"
                                    activeTab={activeTab}
                                    toggleTab={toggleTab}
                                    items={[
                                        permissions.includes("users.view_studentattendance")
                                            ? { to: "/admin/track-students-attendance", label: "Attendance Report" }
                                            : null,
                                        permissions.includes("users.view_staffattendance")
                                            ? { to: "/admin/track-staff-attendance", label: "Staff Attendance" }
                                            : null,
                                    ].filter(item => item !== null && (!searchQuery || item.label.toLowerCase().includes(searchQuery.toLowerCase())))}
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                            {permissions.includes("users.view_feetype") && (!searchQuery || filterItems("Fee", [
                                { label: "Fee Types" },
                                { label: "Fee Structure" },
                                { label: "Fee Payment" },
                                { label: "Student Fee" }
                            ])) && (
                                <SidebarDropdown
                                    label="Fee"
                                    icon="pi pi-wallet"
                                    tabKey="feePayments"
                                    activeTab={activeTab}
                                    toggleTab={toggleTab}
                                    items={[
                                        { to: "/admin/fee-type", label: "Fee Types" },
                                        { to: "/admin/fee-structure", label: "Fee Structure" },
                                        { to: "/admin/fee-payment", label: "Fee Payment" },
                                        { to: "/admin/student-fee", label: "Student Fee" },
                                    ].filter(item => !searchQuery || item.label.toLowerCase().includes(searchQuery.toLowerCase()))}
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                            {permissions.includes("users.view_announcement") && (!searchQuery || filterItems("School Announcement")) && (
                                <SidebarLink
                                    to="/admin/noticeboard"
                                    icon="pi pi-bell"
                                    label="School Announcement"
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                            {permissions.includes("users.view_facultytask") && (!searchQuery || filterItems("Faculty Tasks")) && (
                                <SidebarLink
                                    to="/admin/weekly-task-manager"
                                    icon="pi pi-briefcase"
                                    label="Faculty Tasks"
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                            {permissions.includes("users.view_classannouncement") && (!searchQuery || filterItems("Class Announcements")) && (
                                <SidebarLink
                                    to="/admin/class-announcements"
                                    icon="pi pi-bell"
                                    label="Class Announcements"
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                            {permissions.includes("users.view_classtask") && (!searchQuery || filterItems("Class Tasks")) && (
                                <SidebarLink
                                    to="/admin/class-tasks"
                                    icon="pi pi-list"
                                    label="Class Tasks"
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                            {permissions.includes("users.view_exam") && (!searchQuery || filterItems("Exam/Datesheet")) && (
                                <SidebarLink
                                    to="/admin/create-exam"
                                    icon="pi pi-pencil"
                                    label="Exam/Datesheet"
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                            {(permissions.includes("users.view_finalresult") ||
                                permissions.includes("users.view_result")) && (!searchQuery || filterItems("Results", [
                                    { label: "Student Results" },
                                    { label: "Final Result" }
                                ])) && (
                                <SidebarDropdown
                                    label="Results"
                                    icon="pi pi-check-square"
                                    tabKey="results"
                                    activeTab={activeTab}
                                    toggleTab={toggleTab}
                                    items={[
                                        permissions.includes("users.view_studentresult")
                                            ? { to: "/admin/student-results", label: "Student Results" }
                                            : null,
                                        permissions.includes("users.view_finalresult")
                                            ? { to: "/admin/final-results", label: "Final Result" }
                                            : null,
                                    ].filter(item => item !== null && (!searchQuery || item.label.toLowerCase().includes(searchQuery.toLowerCase())))}
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                            {permissions.includes("users.view_gradecriteria") && (!searchQuery || filterItems("Grade Criteria")) && (
                                <SidebarLink
                                    to="/admin/grade-criteria"
                                    icon="pi pi-chart-line"
                                    label="Grade Criteria"
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                            {(permissions.includes("auth.view_permission") ||
                                permissions.includes("users.view_groupclasspermission")) && (!searchQuery || filterItems("Administration", [
                                    { label: "Role Permissions" },
                                    { label: "Class Permissions" }
                                ])) && (
                                <SidebarDropdown
                                    label="Administration"
                                    icon="pi pi-cog"
                                    tabKey="administration"
                                    activeTab={activeTab}
                                    toggleTab={toggleTab}
                                    items={[
                                        permissions.includes("auth.view_permission")
                                            ? { to: "/admin/permissions", label: "Role Permissions" }
                                            : null,
                                        permissions.includes("users.view_groupclasspermission")
                                            ? { to: "/admin/group-class-permissions", label: "Class Permissions" }
                                            : null,
                                    ].filter(item => item !== null && (!searchQuery || item.label.toLowerCase().includes(searchQuery.toLowerCase())))}
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                            {permissions.includes("business.view_subscription") && (!searchQuery || filterItems("Subscription")) && (
                                <SidebarLink
                                    to="/admin/subscription"
                                    icon="pi pi-credit-card"
                                    label="Subscription"
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                        </ul>
                    </nav>
                </div>
            </div>
        </>
    );
};

const SidebarLink = ({ to, icon, label, currentPath, isSidebarOpen }) => (
    <li>
        <Link
            to={to}
            className={`
                flex items-center px-3 sm:px-4 py-2 rounded-lg transition-all duration-200
                hover:bg-blue-700 text-sm sm:text-base
                ${currentPath === to ? 'bg-blue-800 font-semibold' : ''}
            `}
            title={!isSidebarOpen ? label : ''}
        >
            <i className={`${icon} ${isSidebarOpen ? 'mr-2 sm:mr-3' : 'mx-auto'} text-base sm:text-lg`}></i>
            {isSidebarOpen && <span>{label}</span>}
        </Link>
    </li>
);

const SidebarDropdown = ({ label, icon, tabKey, activeTab, toggleTab, items, currentPath, isSidebarOpen }) => (
    <li>
        <button
            onClick={() => isSidebarOpen && toggleTab(tabKey)}
            className={`
                flex items-center w-full px-3 sm:px-4 py-2 rounded-lg transition-all duration-200
                hover:bg-blue-700 text-sm sm:text-base
                ${!isSidebarOpen ? 'cursor-default' : ''}
            `}
            title={!isSidebarOpen ? label : ''}
        >
            <i className={`${icon} ${isSidebarOpen ? 'mr-2 sm:mr-3' : 'mx-auto'} text-base sm:text-lg`}></i>
            {isSidebarOpen && <span>{label}</span>}
            {isSidebarOpen && (
                <i
                    className={`pi ${activeTab === tabKey ? 'pi-chevron-up' : 'pi-chevron-down'} ml-auto text-sm sm:text-base`}
                ></i>
            )}
        </button>
        {isSidebarOpen && activeTab === tabKey && (
            <ul className="ml-4 sm:ml-6 mt-1 sm:mt-2 space-y-1 sm:space-y-2">
                {items.map((item, idx) => (
                    <li key={idx}>
                        <Link
                            to={item.to}
                            className={`
                                block px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200
                                hover:bg-blue-700 text-xs sm:text-sm
                                ${currentPath === item.to ? 'bg-blue-800 font-semibold' : ''}
                            `}
                        >
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ul>
        )}
    </li>
);

export default Sidebar;