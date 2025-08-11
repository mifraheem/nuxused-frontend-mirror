import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import Cookies from 'js-cookie';
import Select from 'react-select';
import Buttons from '../../components/Buttons';

const API = import.meta.env.VITE_SERVER_URL;
const API_BASE_URL = `${API}attendance/`;
const STUDENTS_API = `${API}api/auth/users/list_profiles/student/`;
const CLASSES_API = `${API}classes/`;
const SUBJECTS_API = `${API}subjects/`;

const AttendanceStd = () => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [showAttendanceTable, setShowAttendanceTable] = useState(false);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [showFilterForm, setShowFilterForm] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [studentOptions, setStudentOptions] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.ceil(attendanceData.length / pageSize);
  const paginatedData = attendanceData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const [formData, setFormData] = useState({
    student: null,
    subject: '',
    class_schedule: '',
    status: 'Present',
    remarks: '',
    date: '',
  });

  const [markedStudentIds, setMarkedStudentIds] = useState([]);
  const [filters, setFilters] = useState({
    type: 'Daily',
    date: '',
    month: '',
    year: '',
    studentId: '',
    classId: '',
  });
  
  const [filteredStudents, setFilteredStudents] = useState([]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    const token = Cookies.get('access_token');
    if (!token) return toast.error('Not authenticated');

    try {
      const [studentsRes, classesRes, subjectsRes] = await Promise.all([
        axios.get(STUDENTS_API, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${CLASSES_API}?page_size=100`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(SUBJECTS_API, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setStudentOptions(studentsRes.data.data.results || []);
      setClassOptions(classesRes.data.data.results || []);
      setSubjectOptions(subjectsRes.data.data.results || []);
    } catch (err) {
      toast.error('Failed to load dropdown data');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClassFilterChange = async (selectedClass) => {
    const classId = selectedClass?.id || '';
    setFilters(prev => ({ ...prev, classId, studentId: '' })); // Clear student selection when class changes
    
    if (classId) {
      try {
        const token = Cookies.get('access_token');
        const res = await axios.get(`${API}classes/${classId}/students/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data?.data?.results || [];
        setFilteredStudents(data);
      } catch (err) {
        toast.error('Failed to load students for selected class.');
        setFilteredStudents([]);
      }
    } else {
      setFilteredStudents([]);
    }
  };

  const handleAttendanceInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMarkAttendance = () => {
    setShowAttendanceForm((prev) => !prev);
    setShowAttendanceTable(false);
    setFormData({ student: null, subject: '', class_schedule: '', status: 'Present', remarks: '', date: '' });
  };

  const handleFetchAttendance = async () => {
    setLoading(true);
    let params = [];
    if (!filters.studentId) {
      toast.error('Student required');
      setLoading(false);
      return;
    }
    params.push(`student_id=${filters.studentId}`);
    if (filters.type === 'Daily' && filters.date) {
      params.push(`daily=true&date=${filters.date}`);
    } else if (filters.type === 'Monthly') {
      params.push(`month=${filters.month}`);
    } else if (filters.type === 'Yearly') {
      params.push(`year=${filters.year}`);
    }

    try {
      const token = Cookies.get('access_token');
      const response = await axios.get(`${API_BASE_URL}?${params.join('&')}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const rawRecords = response.data?.results || [];
      const records = rawRecords.map((entry) => entry.data);

      if (records.length === 0) {
        toast.error('No attendance records found for selected criteria');
        setAttendanceData([]);
        setShowReport(false);
      } else {
        setAttendanceData(records);
        setShowReport(true);
      }
    } catch (err) {
      toast.error('Fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAttendance = async () => {
    const token = Cookies.get('access_token');
    if (!token) return toast.error('Not authenticated');

    const { student, subject, class_schedule, status, remarks, date } = formData;
    const studentId = student?.profile_id || student;

    if (!student || !subject || !class_schedule || !date) return toast.error('All fields are required.');

    try {
      const alreadyMarked = markedStudentIds.includes(parseInt(student?.profile_id || student));
      if (alreadyMarked) return toast.error('This student has already been marked.');

      const res = await axios.post(API_BASE_URL, {
        student: student?.std_id || student,
        subject,
        class_schedule,
        status,
        remarks,
        date
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newRecord = res.data?.data?.data;
      if (newRecord) {
        setAttendanceData(prev => [...prev, newRecord]);
        setShowReport(true);
      }

      toast.success('Attendance submitted');
      setMarkedStudentIds((prev) => [...prev, studentId]);
      setFormData({ student: null, subject: '', class_schedule: '', status: 'Present', remarks: '', date: '' });
    } catch (err) {
      toast.error('Failed to submit');
    }
  };

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canAdd = permissions.includes("users.add_studentattendance");
  const canView = permissions.includes("users.view_studentattendance");

  // Custom styles for react-select
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: '2rem',
      fontSize: '0.875rem',
      '@media (min-width: 640px)': {
        fontSize: '1rem',
      },
    }),
    menu: (provided) => ({
      ...provided,
      fontSize: '0.875rem',
      maxHeight: '200px',
      overflowY: 'auto',
      '@media (min-width: 640px)': {
        fontSize: '1rem',
      },
    }),
    option: (provided) => ({
      ...provided,
      fontSize: '0.875rem',
      padding: '0.5rem',
      '@media (min-width: 640px)': {
        fontSize: '1rem',
        padding: '0.75rem',
      },
    }),
  };

  // Status options for react-select
  const statusOptions = [
    { value: 'Present', label: 'Present' },
    { value: 'Late', label: 'Late' },
    { value: 'Absent', label: 'Absent' },
    { value: 'Leave', label: 'Leave' },
    { value: 'Half-day', label: 'Half-day' },
  ];

  // Report type options for react-select
  const reportTypeOptions = [
    { value: 'Daily', label: 'Daily' },
    { value: 'Monthly', label: 'Monthly' },
    { value: 'Yearly', label: 'Yearly' },
  ];

  // Page size options for react-select
  const pageSizeOptions = [
    { value: 5, label: '5' },
    { value: 10, label: '10' },
    { value: 15, label: '15' },
    { value: 20, label: '20' },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Toaster position="top-center" />
      {/* Header Section */}
      <div className="bg-blue-900 text-white py-3 px-4 sm:px-6 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-lg sm:text-xl font-bold">Student Attendance </h2>
        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
          {canAdd && (
            <button
              onClick={handleMarkAttendance}
              className="bg-cyan-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md shadow hover:bg-cyan-700 w-full sm:w-auto text-sm sm:text-base"
            >
              {showAttendanceForm ? 'Close Attendance' : 'Mark Attendance'}
            </button>
          )}
          {canView && (
            <button
              onClick={() => setShowFilterForm((prev) => !prev)}
              className="bg-green-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md shadow hover:bg-green-700 w-full sm:w-auto text-sm sm:text-base"
            >
              {showFilterForm ? 'Close Report' : 'Fetch Attendance'}
            </button>
          )}
        </div>
      </div>

      {/* Attendance Form */}
      {canAdd && showAttendanceForm && (
        <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-md max-w-full sm:max-w-3xl mx-auto">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Mark Attendance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              name="class_schedule"
              value={classOptions.find(cls => cls.id === parseInt(formData.class_schedule)) || null}
              onChange={async (selected) => {
                const classId = selected?.id || "";
                setFormData({ ...formData, class_schedule: classId });
                if (classId) {
                  try {
                    const token = Cookies.get("access_token");
                    const res = await axios.get(`${API}classes/${classId}/students/`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = res.data?.data?.results || [];
                    setStudents(data);
                  } catch (err) {
                    toast.error("Failed to load students for selected class.");
                    setStudents([]);
                  }
                } else {
                  setStudents([]);
                }
              }}
              options={classOptions}
              getOptionLabel={(cls) => `${cls.class_name} - ${cls.section} (${cls.session})`}
              getOptionValue={(cls) => cls.id}
              placeholder="Select Class"
              isClearable
              styles={selectStyles}
            />
            <Select
              name="student"
              value={formData.student}
              onChange={(selected) => {
                setFormData((prev) => ({ ...prev, student: selected }));
              }}
              options={students.filter(s => !markedStudentIds.includes(s.profile_id))}
              getOptionLabel={(s) => s.username}
              getOptionValue={(s) => s.profile_id}
              placeholder="Select Student"
              isClearable
              styles={selectStyles}
            />
            <Select
              name="subject"
              value={subjectOptions.find(sub => sub.id === parseInt(formData.subject)) || null}
              onChange={(selected) => {
                setFormData({ ...formData, subject: selected?.id || "" });
              }}
              options={subjectOptions}
              getOptionLabel={(sub) => sub.subject_name}
              getOptionValue={(sub) => sub.id}
              placeholder="Select Subject"
              isClearable
              styles={selectStyles}
            />
            <Select
              name="status"
              value={statusOptions.find(opt => opt.value === formData.status) || statusOptions[0]}
              onChange={(selected) => {
                setFormData({ ...formData, status: selected?.value || 'Present' });
              }}
              options={statusOptions}
              placeholder="Select Status"
              styles={selectStyles}
              isSearchable={false}
            />
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleAttendanceInputChange}
              className="border p-2 rounded text-sm sm:text-base"
              required
            />
            <input
              name="remarks"
              placeholder="Remarks"
              value={formData.remarks}
              onChange={handleAttendanceInputChange}
              className="border p-2 rounded text-sm sm:text-base col-span-1 sm:col-span-2"
            />
          </div>
          <div className="mt-4 text-right">
            <button
              onClick={handleSubmitAttendance}
              className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded hover:bg-blue-800 text-sm sm:text-base"
            >
              Submit Attendance
            </button>
          </div>
        </div>
      )}

      {/* Filter Form - All Responsive Dropdowns */}
      {canView && showFilterForm && (
        <div className="bg-white mt-6 p-4 sm:p-6 rounded-lg shadow-md max-w-full sm:max-w-4xl mx-auto border border-gray-200 filter-form">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Generate Attendance Report</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
              <Select
                name="studentId"
                value={studentOptions.find(s => s.profile_id === filters.studentId) || null}
                onChange={(selected) => {
                  setFilters(prev => ({ ...prev, studentId: selected?.profile_id || '' }));
                }}
                options={studentOptions}
                getOptionLabel={(s) => s.username}
                getOptionValue={(s) => s.profile_id}
                placeholder="-- Select Student --"
                isClearable
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <Select
                name="type"
                value={reportTypeOptions.find(opt => opt.value === filters.type) || reportTypeOptions[0]}
                onChange={(selected) => {
                  setFilters(prev => ({ ...prev, type: selected?.value || 'Daily' }));
                }}
                options={reportTypeOptions}
                placeholder="Select Report Type"
                styles={selectStyles}
                isSearchable={false}
              />
            </div>
            {filters.type === 'Daily' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <input
                  type="date"
                  name="date"
                  value={filters.date}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 p-2 sm:p-3 rounded-md text-sm sm:text-base"
                />
              </div>
            )}
            {filters.type === 'Monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month (1-12)</label>
                <input
                  type="number"
                  name="month"
                  min="1"
                  max="12"
                  placeholder="e.g., 5"
                  value={filters.month}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 p-2 sm:p-3 rounded-md text-sm sm:text-base"
                />
              </div>
            )}
            {filters.type === 'Yearly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  name="year"
                  placeholder="e.g., 2024"
                  value={filters.year}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 p-2 sm:p-3 rounded-md text-sm sm:text-base"
                />
              </div>
            )}
          </div>
          <div className="mt-6 text-right">
            <button
              onClick={handleFetchAttendance}
              className="bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md hover:bg-green-700 shadow text-sm sm:text-base"
            >
              Generate Report
            </button>
          </div>
        </div>
      )}

      {/* Attendance Report Table */}
      {canView && showReport && attendanceData.length > 0 && (
        <div className="p-4 sm:p-6">
          <Buttons
            data={attendanceData}
            columns={[
              { label: "Student", key: "student" },
              { label: "Date", key: "date" },
              { label: "Status", key: "status" },
            ]}
            filename="Attendance_Report"
          />
          <div className="overflow-x-auto">
            <table className="w-full border mt-4 bg-white shadow text-sm attendance-table">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border p-2 sm:p-3 text-left">Student</th>
                  <th className="border p-2 sm:p-3 text-left">Date</th>
                  <th className="border p-2 sm:p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50">
                    <td className="border p-2 sm:p-3" data-label="Student">{rec.student}</td>
                    <td className="border p-2 sm:p-3" data-label="Date">{rec.date}</td>
                    <td className="border p-2 sm:p-3" data-label="Status">{rec.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Responsive Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-3 sm:gap-4">
            {/* Page Size Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                Page Size:
              </label>
              <div className="w-24">
                <Select
                  value={pageSizeOptions.find(opt => opt.value === pageSize)}
                  onChange={(selected) => {
                    setPageSize(selected?.value || 10);
                    setCurrentPage(1);
                  }}
                  options={pageSizeOptions}
                  styles={{
                    ...selectStyles,
                    control: (provided) => ({
                      ...provided,
                      minHeight: '1.75rem',
                      fontSize: '0.75rem',
                    }),
                    menu: (provided) => ({
                      ...provided,
                      fontSize: '0.75rem',
                      maxHeight: '120px',
                    }),
                    option: (provided) => ({
                      ...provided,
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                    }),
                  }}
                  isSearchable={false}
                />
              </div>
            </div>

            {/* Pagination Buttons */}
            <div className="flex flex-wrap justify-center sm:justify-end gap-1 sm:gap-2 w-full sm:w-auto">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-1 bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed
                           text-xs sm:text-sm hover:bg-gray-400 transition-colors min-w-[45px] sm:min-w-[50px]"
              >
                Prev
              </button>
              
              {/* Smart pagination for many pages */}
              {totalPages <= 5 ? (
                [...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm min-w-[32px] sm:min-w-[36px] 
                               transition-colors ${
                      currentPage === index + 1
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))
              ) : (
                <>
                  {currentPage > 3 && (
                    <>
                      <button
                        onClick={() => setCurrentPage(1)}
                        className="px-2 sm:px-3 py-1 rounded text-xs sm:text-sm min-w-[32px] sm:min-w-[36px]
                                   bg-gray-200 hover:bg-gray-300 transition-colors"
                      >
                        1
                      </button>
                      {currentPage > 4 && (
                        <span className="px-1 py-1 text-xs sm:text-sm text-gray-500">...</span>
                      )}
                    </>
                  )}
                  
                  {[...Array(Math.min(5, totalPages))].map((_, index) => {
                    let pageNum;
                    if (currentPage <= 3) {
                      pageNum = index + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + index;
                    } else {
                      pageNum = currentPage - 2 + index;
                    }
                    
                    if (pageNum > 0 && pageNum <= totalPages) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm min-w-[32px] sm:min-w-[36px]
                                     transition-colors ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-gray-200 hover:bg-gray-300"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  })}
                  
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && (
                        <span className="px-1 py-1 text-xs sm:text-sm text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-2 sm:px-3 py-1 rounded text-xs sm:text-sm min-w-[32px] sm:min-w-[36px]
                                   bg-gray-200 hover:bg-gray-300 transition-colors"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </>
              )}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-1 bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed
                           text-xs sm:text-sm hover:bg-gray-400 transition-colors min-w-[45px] sm:min-w-[50px]"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceStd;