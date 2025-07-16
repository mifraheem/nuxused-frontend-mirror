import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import 'primeicons/primeicons.css';
import { FaUserTie } from 'react-icons/fa';
import logo from '/school-logo.png';



const Sidebar = () => {
    const [activeTab, setActiveTab] = useState(null);

    const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
    const toggleTab = (tab) => {
        setActiveTab(activeTab === tab ? null : tab);
    };

    return (
        <div className="flex min-h-screen text-sm">
            <div className="w-64 bg-blue-900 text-white flex flex-col rounded-md fixed top-0 left-0 h-screen overflow-y-auto no-scrollbar">
                <div className="px-6 py-4 flex items-center border-b border-blue-700">
                    <img src={logo} alt="Acadian Logo" className="w-16 h-16 mr-2 " />
                    <span className="font-bold text-2xl">Acadian</span>
                </div>
                <nav className="flex-1 px-4 py-4">
                    <ul className="space-y-2">
                        <li>
                            <Link to="/admin" className="flex items-center px-4 py-2 hover:bg-blue-700 rounded-lg">
                                <i className="pi pi-home mr-2"></i> Home
                            </Link>
                        </li>

                        {permissions.includes("users.add_user") && (
                            <li>
                                <Link to="/admin/registration" className="flex items-center px-4 py-2 hover:bg-blue-700 rounded-lg">
                                    <i className="pi pi-user-plus mr-2"></i> Registration
                                </Link>
                            </li>
                        )}

                        {/* <li>
                            <Link
                                to="/admin/accountants-management"
                                className="flex items-center px-4 py-2 rounded-md hover:bg-blue-700 transition"
                            >
                                <FaUserTie className="text-lg mr-3" />
                                Manage Accountants
                            </Link>
                        </li> */}

                        {/* Rooms, Class, Subject */}
                        {permissions.includes("users.view_room") && (

                            <li>
                                <Link to="/admin/rooms-management" className="flex items-center px-4 py-2 hover:bg-blue-700 rounded-lg">
                                    <i className="pi pi-building mr-2"></i> Rooms Management
                                </Link>
                            </li>
                        )}
                        {permissions.includes("users.view_classname") && (

                            <li>
                                <Link to="/admin/class-management" className="flex items-center px-4 py-2 hover:bg-blue-700 rounded-lg">
                                    <i className="pi pi-table mr-2"></i> Class Management
                                </Link>
                            </li>
                        )}
                        {permissions.includes("users.view_subject") && (

                            <li>
                                <Link to="/admin/subject-management" className="flex items-center px-4 py-2 hover:bg-blue-700 rounded-lg">
                                    <i className="pi pi-book mr-2"></i> Subject Management
                                </Link>
                            </li>
                        )}

                        {/* Student Management */}
                        {permissions.includes("users.view_studentprofile") && (

                            <li>
                                <button onClick={() => toggleTab('student')} className="flex items-center w-full px-4 py-2 hover:bg-blue-700 rounded-lg">
                                    <i className="pi pi-users mr-2"></i> Student Management
                                    <i className={`pi ${activeTab === 'student' ? 'pi-chevron-up' : 'pi-chevron-down'} ml-auto`}></i>
                                </button>
                                {activeTab === 'student' && (
                                    <ul className="ml-6 mt-2 space-y-2">
                                        <li><Link to="/admin/manage-student-information" className="block px-4 py-2 hover:bg-blue-700 rounded-lg">Student Information</Link></li>
                                        <li><Link to="/admin/generate-student-id-cards" className="block px-4 py-2 hover:bg-blue-700 rounded-lg">Student ID Cards</Link></li>
                                        <li><Link to="/admin/promotion-records" className="block px-4 py-2 hover:bg-blue-700 rounded-lg">Student Promotion</Link></li>
                                    </ul>
                                )}
                            </li>
                        )}

                        {/* Parent Management */}
                        {permissions.includes("users.view_parentprofile") && (

                            <li>
                                <button onClick={() => toggleTab('parent')} className="flex items-center w-full px-4 py-2 hover:bg-blue-700 rounded-lg">
                                    <i className="pi pi-user mr-2"></i> Parent Management
                                    <i className={`pi ${activeTab === 'parent' ? 'pi-chevron-up' : 'pi-chevron-down'} ml-auto`}></i>
                                </button>
                                {activeTab === 'parent' && (
                                    <ul className="ml-6 mt-2 space-y-2">
                                        <li><Link to="/admin/manage-parent-account" className="block px-4 py-2 hover:bg-blue-700 rounded-lg">Manage Parent</Link></li>
                                    </ul>
                                )}
                            </li>
                        )}

                        {/* Teacher Management */}
                        {permissions.includes("users.view_teacherprofile") && (

                            <li>
                                <button onClick={() => toggleTab('teacher')} className="flex items-center w-full px-4 py-2 hover:bg-blue-700 rounded-lg">
                                    <i className="pi pi-id-card mr-2"></i> Teacher Management
                                    <i className={`pi ${activeTab === 'teacher' ? 'pi-chevron-up' : 'pi-chevron-down'} ml-auto`}></i>
                                </button>
                                {activeTab === 'teacher' && (
                                    <ul className="ml-6 mt-2 space-y-2">
                                        <li><Link to="/admin/manage-teacher-details" className="block px-4 py-2 hover:bg-blue-700 rounded-lg">Manage Teacher Details</Link></li>
                                        <li><Link to="/admin/generate-teacher-id-cards" className="block px-4 py-2 hover:bg-blue-700 rounded-lg">Teacher ID Cards</Link></li>
                                    </ul>
                                )}
                            </li>
                        )}
                        {/* Staff Management */}
                        {permissions.includes("users.view_staffprofile") && (

                            <li>
                                <button onClick={() => toggleTab('staff')} className="flex items-center w-full px-4 py-2 hover:bg-blue-700 rounded-lg">
                                    <i className="pi pi-id-card mr-2"></i> Staff Management
                                    <i className={`pi ${activeTab === 'staff' ? 'pi-chevron-up' : 'pi-chevron-down'} ml-auto`}></i>
                                </button>
                                {activeTab === 'staff' && (
                                    <ul className="ml-6 mt-2 space-y-2">
                                        <li><Link to="/admin/manage-staff-details" className="block px-4 py-2 hover:bg-blue-700 rounded-lg">Manage Staff Details</Link></li>
                                        <li><Link to="/admin/generate-staff-id-cards" className="block px-4 py-2 hover:bg-blue-700 rounded-lg">Staff ID Cards</Link></li>
                                    </ul>
                                )}
                            </li>
                        )}

                        {/* Attendance */}
                        {(permissions.includes("users.view_studentattendance") || permissions.includes("users.view_staffattendance")) && (
                            <li>
                                <button onClick={() => toggleTab('attendance')} className="flex items-center w-full px-4 py-2 hover:bg-blue-700 rounded-lg">
                                    <i className="pi pi-calendar mr-2"></i> Manage Attendance
                                    <i className={`pi ${activeTab === 'attendance' ? 'pi-chevron-up' : 'pi-chevron-down'} ml-auto`}></i>
                                </button>

                                {activeTab === 'attendance' && (
                                    <ul className="ml-6 mt-2 space-y-2">
                                        {permissions.includes("users.view_studentattendance") && (
                                            <li>
                                                <Link to="/admin/track-students-attendance" className="block px-4 py-2 hover:bg-blue-700 rounded-lg">
                                                    Student Attendance
                                                </Link>
                                            </li>
                                        )}
                                        {permissions.includes("users.view_staffattendance") && (
                                            <li>
                                                <Link to="/admin/track-staff-attendance" className="block px-4 py-2 hover:bg-blue-700 rounded-lg">
                                                    Staff Attendance
                                                </Link>
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </li>
                        )}
                        {/* Grade Criteria */}
                        {permissions.includes("users.view_gradecriteria") && (
                            <li>
                                <Link to="/admin/grade-criteria" className="flex items-center px-4 py-2 hover:bg-blue-700 rounded-lg">
                                    <i className="pi pi-percentage mr-2"></i> Grade Criteria
                                </Link>
                            </li>
                        )}
                        {/* Student Results */}
                        {(permissions.includes("users.view_finalresult") || permissions.includes("users.view_result")) && (
                            <li>
                                <button
                                    onClick={() => toggleTab('results')}
                                    className="flex items-center w-full px-4 py-2 hover:bg-blue-700 rounded-lg"
                                >
                                    <i className="pi pi-check-square mr-2"></i> Results
                                    <i className={`pi ${activeTab === 'results' ? 'pi-chevron-up' : 'pi-chevron-down'} ml-auto`}></i>
                                </button>

                                {activeTab === 'results' && (
                                    <ul className="ml-6 mt-2 space-y-2">
                                        {permissions.includes("users.view_studentresult") && (
                                            <li>
                                                <Link
                                                    to="/admin/student-results"
                                                    className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                                                >
                                                    Student Results
                                                </Link>
                                            </li>
                                        )}
                                        {permissions.includes("users.view_finalresult") && (
                                            <li>
                                                <Link
                                                    to="/admin/final-results"
                                                    className="block px-4 py-2 hover:bg-blue-700 rounded-lg"
                                                >
                                                    Final Result
                                                </Link>
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </li>
                        )}



                        {/* Exam */}
                        {permissions.includes("users.view_exam") && (

                            <li>
                                <button onClick={() => toggleTab('exam')} className="flex items-center w-full px-4 py-2 hover:bg-blue-700 rounded-lg">
                                    <i className="pi pi-pencil mr-2"></i> Exam Management
                                    <i className={`pi ${activeTab === 'exam' ? 'pi-chevron-up' : 'pi-chevron-down'} ml-auto`}></i>
                                </button>
                                {activeTab === 'exam' && (
                                    <ul className="ml-6 mt-2 space-y-2">
                                        <li><Link to="/admin/create-exam" className="block px-4 py-2 hover:bg-blue-700 rounded-lg">Create Exam</Link></li>
                                    </ul>
                                )}
                            </li>
                        )}

                        {/* Timetable */}
                        {permissions.includes("users.view_timetable") && (

                            <li>
                                <button onClick={() => toggleTab('timetable')} className="flex items-center w-full px-4 py-2 hover:bg-blue-700 rounded-lg">
                                    <i className="pi pi-calendar mr-2"></i> Timetable
                                    <i className={`pi ${activeTab === 'timetable' ? 'pi-chevron-up' : 'pi-chevron-down'} ml-auto`}></i>
                                </button>
                                {activeTab === 'timetable' && (
                                    <ul className="ml-6 mt-2 space-y-2">
                                        <li><Link to="/admin/manage-timetable" className="block px-4 py-2 hover:bg-blue-700 rounded-lg">Manage Timetable</Link></li>
                                    </ul>
                                )}
                            </li>
                        )}

                        {/* 🔹 Merged Accountant Section - Manage Fee */}
                        {permissions.includes("users.view_feetype") && (

                            <li>
                                <button onClick={() => toggleTab('feePayments')} className="flex items-center w-full px-4 py-2 hover:bg-blue-700 rounded-lg">
                                    <i className="pi pi-wallet mr-2"></i> Manage Fee
                                    <i className={`pi ${activeTab === 'feePayments' ? 'pi-chevron-up' : 'pi-chevron-down'} ml-auto`}></i>
                                </button>
                                {activeTab === 'feePayments' && (
                                    <ul className="ml-6 mt-2 space-y-2">
                                        <li><Link to="/admin/fee-type" className="block px-4 py-2 hover:bg-blue-700 rounded-lg">Fee Types</Link></li>
                                        <li><Link to="/admin/fee-structure" className="block px-4 py-2 hover:bg-blue-700 rounded-lg">Fee Structure</Link></li>
                                        <li><Link to="/admin/fee-payment" className="block px-4 py-2 hover:bg-blue-700 rounded-lg">Fee Payment</Link></li>
                                        <li><Link to="/admin/student-fee" className="block px-4 py-2 hover:bg-blue-700 rounded-lg">Student Fee</Link></li>
                                    </ul>
                                )}
                            </li>
                        )}


                        {/* 🔹 Merged Accountant Section - Manage Salary */}
                        {permissions.includes("users.change_staffprofile") && (

                            <li>
                                <button onClick={() => toggleTab('staffSalary')} className="flex items-center w-full px-4 py-2 hover:bg-blue-700 rounded-lg">
                                    <i className="pi pi-user mr-2"></i> Manage Salary
                                    <i className={`pi ${activeTab === 'staffSalary' ? 'pi-chevron-up' : 'pi-chevron-down'} ml-auto`}></i>
                                </button>
                                {activeTab === 'staffSalary' && (
                                    <ul className="ml-6 mt-2 space-y-2">
                                        <li><Link to="/admin/staff-salary" className="block px-4 py-2 hover:bg-blue-700 rounded-lg">Generate Staff Salary</Link></li>
                                    </ul>
                                )}
                            </li>
                        )}


                        {/* Other Admin Items */}
                        {permissions.includes("users.view_announcement") && (

                            <li><Link to="/admin/noticeboard" className="block px-4 py-2 hover:bg-blue-700 rounded-lg"><i className="pi pi-book mr-2"></i> School Noticeboard</Link></li>
                        )}
                        {permissions.includes("users.view_facultytask") && (

                            <li><Link to="/admin/weekly-task-manager" className="block px-4 py-2 hover:bg-blue-700 rounded-lg"><i className="pi pi-cog mr-2"></i> Task Manager</Link></li>
                        )}
                        {permissions.includes("users.view_classannouncement") && (
                            <li>
                                <Link to="/admin/class-announcements" className="block px-4 py-2 hover:bg-blue-700 rounded-lg">
                                    <i className="pi pi-bell mr-2"></i> Class Announcements
                                </Link>
                            </li>
                        )}

                        {permissions.includes("users.view_classtask") && (
                            <li>
                                <Link to="/admin/class-tasks" className="block px-4 py-2 hover:bg-blue-700 rounded-lg">
                                    <i className="pi pi-list mr-2"></i> Class Tasks
                                </Link>
                            </li>
                        )}

                    </ul>
                </nav>
            </div>
        </div>
    );
};

export default Sidebar;
