import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import 'primeicons/primeicons.css';
import logo from '/school-logo.png';

const Sidebar = ({ isSidebarOpen, toggleSidebar, activeTab, setActiveTab }) => {
    const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
    const location = useLocation();

    const toggleTab = (tab) => {
        setActiveTab(activeTab === tab ? null : tab);
    };

    useEffect(() => {
        if (!isSidebarOpen) {
            setActiveTab(null);
        }
    }, [isSidebarOpen]);

    // Handle clicking outside the sidebar on mobile to close it
    const handleOverlayClick = () => {
        if (isSidebarOpen) {
            toggleSidebar();
        }
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
          fixed top-0 left-0 h-screen overflow-y-auto no-scrollbar transition-all duration-300 z-40
          bg-blue-900 text-white
          ${isSidebarOpen ? 'w-full sm:w-64' : 'w-16'}
          sm:flex sm:flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
        `}
            >
                {/* Header with Logo and Toggle Button */}
                <div className="relative flex items-center justify-between sm:justify-center px-4 py-3 sm:py-4 border-b border-blue-700">
                    {isSidebarOpen && (
                        <>
                            <div className="flex items-center">
                                <img
                                    src={logo}
                                    alt="Logo"
                                    className="w-10 h-10 sm:w-12 sm:h-12 mr-2"
                                />
                                <span className="font-bold text-lg sm:text-xl">Acadian</span>
                            </div>
                        </>
                    )}
                    <button
                        onClick={toggleSidebar}
                        className={`
              p-1.5 sm:p-1 px-2 sm:px-2 rounded-full shadow-md hover:bg-blue-300 transition-all duration-200 text-blue-900 bg-white
              ${isSidebarOpen ? 'sm:absolute sm:-right-3 sm:top-4 sm:mr-5' : 'flex items-center justify-center w-full'}
            `}
                    >
                        <i className="pi pi-bars text-base sm:text-lg"></i>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-2 py-4">
                    <ul className="space-y-2">
                        <SidebarLink
                            to="/admin"
                            icon="pi pi-home"
                            label="Home"
                            currentPath={location.pathname}
                            isSidebarOpen={isSidebarOpen}
                        />
                        {permissions.includes("business.view_subscription") && (
                            <SidebarLink
                                to="/admin/subscription"
                                icon="pi pi-credit-card"
                                label="Subscription"
                                currentPath={location.pathname}
                                isSidebarOpen={isSidebarOpen}
                            />
                        )}
                        {permissions.includes("users.add_user") && (
                            <SidebarLink
                                to="/admin/registration"
                                icon="pi pi-user-plus"
                                label="Registration"
                                currentPath={location.pathname}
                                isSidebarOpen={isSidebarOpen}
                            />
                        )}
                        {permissions.includes("users.view_studentprofile") && (
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
                                ]}
                                currentPath={location.pathname}
                                isSidebarOpen={isSidebarOpen}
                            />
                        )}
                        {permissions.includes("users.view_parentprofile") && (
                            <SidebarLink
                                to="/admin/manage-parent-account"
                                icon="pi pi-user"
                                label="Parent"
                                currentPath={location.pathname}
                                isSidebarOpen={isSidebarOpen}
                            />
                        )}

                        {permissions.includes("users.view_teacherprofile") && (
                            <SidebarDropdown
                                label="Teachers"
                                icon="pi pi-id-card"
                                tabKey="teacher"
                                activeTab={activeTab}
                                toggleTab={toggleTab}
                                items={[
                                    { to: "/admin/manage-teacher-details", label: "Teacher Information" },
                                    { to: "/admin/generate-teacher-id-cards", label: "Teacher ID Cards" },
                                ]}
                                currentPath={location.pathname}
                                isSidebarOpen={isSidebarOpen}
                            />
                        )}
                        {permissions.includes("users.view_staffprofile") && (
                            <SidebarDropdown
                                label="Staff"
                                icon="pi pi-id-card"
                                tabKey="staff"
                                activeTab={activeTab}
                                toggleTab={toggleTab}
                                items={[
                                    { to: "/admin/manage-staff-details", label: "Manage Staff Details" },
                                    { to: "/admin/generate-staff-id-cards", label: "Staff ID Cards" },
                                ]}
                                currentPath={location.pathname}
                                isSidebarOpen={isSidebarOpen}
                            />
                        )}
                        {(permissions.includes("auth.view_permission") ||
                            permissions.includes("users.view_groupclasspermission")) && (
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
                                    ].filter(Boolean)}
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                        {permissions.includes("users.view_room") && (
                            <SidebarLink
                                to="/admin/rooms-management"
                                icon="pi pi-building"
                                label="Rooms"
                                currentPath={location.pathname}
                                isSidebarOpen={isSidebarOpen}
                            />
                        )}
                        {permissions.includes("users.view_classname") && (
                            <SidebarLink
                                to="/admin/class-management"
                                icon="pi pi-table"
                                label="Classes"
                                currentPath={location.pathname}
                                isSidebarOpen={isSidebarOpen}
                            />
                        )}
                        {permissions.includes("users.view_subject") && (
                            <SidebarLink
                                to="/admin/subject-management"
                                icon="pi pi-book"
                                label="Subjects"
                                currentPath={location.pathname}
                                isSidebarOpen={isSidebarOpen}
                            />
                        )}
                        {permissions.includes("users.view_timetable") && (
                            <SidebarLink
                                to="/admin/manage-timetable"
                                icon="pi pi-calendar"
                                label="Timetable"
                                currentPath={location.pathname}
                                isSidebarOpen={isSidebarOpen}
                            />
                        )}

                        {(permissions.includes("users.view_studentattendance") ||
                            permissions.includes("users.view_staffattendance")) && (
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
                                    ].filter(item => item !== null)}
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}
                        {permissions.includes("users.view_exam") && (
                            <SidebarLink
                                to="/admin/create-exam"
                                icon="pi pi-pencil"
                                label="Exam/Datesheet"
                                currentPath={location.pathname}
                                isSidebarOpen={isSidebarOpen}
                            />
                        )}
                        {permissions.includes("users.view_gradecriteria") && (
                            <SidebarLink
                                to="/admin/grade-criteria"
                                icon="pi pi-chart-line"
                                label="Grade Criteria"
                                currentPath={location.pathname}
                                isSidebarOpen={isSidebarOpen}
                            />
                        )}
                        {(permissions.includes("users.view_finalresult") ||
                            permissions.includes("users.view_result")) && (
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
                                    ].filter(item => item !== null)}
                                    currentPath={location.pathname}
                                    isSidebarOpen={isSidebarOpen}
                                />
                            )}




                        {permissions.includes("users.view_feetype") && (
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
                                ]}
                                currentPath={location.pathname}
                                isSidebarOpen={isSidebarOpen}
                            />
                        )}
                        {permissions.includes("users.view_announcement") && (
                            <SidebarLink
                                to="/admin/noticeboard"
                                icon="pi pi-bell"
                                label="School Announcement"
                                currentPath={location.pathname}
                                isSidebarOpen={isSidebarOpen}
                            />
                        )}
                        {permissions.includes("users.view_facultytask") && (
                            <SidebarLink
                                to="/admin/weekly-task-manager"
                                icon="pi pi-briefcase"
                                label="Faculty Tasks"
                                currentPath={location.pathname}
                                isSidebarOpen={isSidebarOpen}
                            />
                        )}
                        {permissions.includes("users.view_classannouncement") && (
                            <SidebarLink
                                to="/admin/class-announcements"
                                icon="pi pi-bell"
                                label="Class Announcements"
                                currentPath={location.pathname}
                                isSidebarOpen={isSidebarOpen}
                            />
                        )}
                        {permissions.includes("users.view_classtask") && (
                            <SidebarLink
                                to="/admin/class-tasks"
                                icon="pi pi-list"
                                label="Class Tasks"
                                currentPath={location.pathname}
                                isSidebarOpen={isSidebarOpen}
                            />
                        )}
                    </ul>
                </nav>
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
