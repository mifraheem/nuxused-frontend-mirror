import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import Cookies from 'js-cookie';
import { Buttons } from '../../components';

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

  const [formData, setFormData] = useState({
    student: '',
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
  });

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

  const handleAttendanceInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMarkAttendance = () => {
    setShowAttendanceForm((prev) => !prev);
    setShowAttendanceTable(false);
    setFormData({ student: '', subject: '', class_schedule: '', status: 'Present', remarks: '', date: '' });
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
    if (!student || !subject || !class_schedule || !date) return toast.error('All fields are required.');

    try {
      const alreadyMarked = markedStudentIds.includes(parseInt(student));
      if (alreadyMarked) return toast.error('This student has already been marked.');

      await axios.post(API_BASE_URL, { student, subject, class_schedule, status, remarks, date }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Attendance submitted');
      setMarkedStudentIds((prev) => [...prev, parseInt(student)]);
      setFormData({ student: '', subject: '', class_schedule: '', status: 'Present', remarks: '', date: '' });
    } catch (err) {
      toast.error('Failed to submit');
    }
  };

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canAdd = permissions.includes("users.add_studentattendance");
  const canView = permissions.includes("users.view_studentattendance");

  return (
    <div>
      <Toaster position="top-center" />
      <div className="bg-blue-900 text-white py-2 px-8 mt-5 rounded-lg shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold">Student Attendance Management</h1>
        <div className="space-x-4">
          {canAdd && (
            <button
              onClick={handleMarkAttendance}
              className="bg-cyan-500 text-white px-4 py-2 rounded-md shadow hover:bg-cyan-700"
            >
              {showAttendanceForm ? 'Close Attendance' : 'Mark Attendance'}
            </button>
          )}

          {canView && (
            <button
              onClick={() => setShowFilterForm((prev) => !prev)}
              className="bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-700"
            >
              {showFilterForm ? 'Close Report' : 'Fetch Attendance'}
            </button>
          )}
        </div>
      </div>

      {canAdd && showAttendanceForm && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Mark Attendance</h2>
          <div className="grid grid-cols-2 gap-4">
            <select name="student" value={formData.student} onChange={handleAttendanceInputChange} className="border p-2 rounded">
              <option value="">Select Student</option>
              {studentOptions.filter((s) => !markedStudentIds.includes(s.profile_id)).map((s) => (
                <option key={s.profile_id} value={s.profile_id}>{s.username}</option>
              ))}
            </select>

            <select name="subject" value={formData.subject} onChange={handleAttendanceInputChange} className="border p-2 rounded">
              <option value="">Select Subject</option>
              {subjectOptions.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.subject_name}</option>
              ))}
            </select>

            <select name="class_schedule" value={formData.class_schedule} onChange={handleAttendanceInputChange} className="border p-2 rounded">
              <option value="">Select Class Schedule</option>
              {classOptions.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.class_name} - {cls.section} ({cls.session})</option>
              ))}
            </select>

            <select name="status" value={formData.status} onChange={handleAttendanceInputChange} className="border p-2 rounded">
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="Leave">Leave</option>
              <option value="Half-day">Half-day</option>
            </select>

            <input type="date" name="date" value={formData.date} onChange={handleAttendanceInputChange} className="border p-2 rounded" required />
            <input name="remarks" placeholder="Remarks" value={formData.remarks} onChange={handleAttendanceInputChange} className="border p-2 rounded col-span-2" />
          </div>
          <div className="mt-4 text-right">
            <button onClick={handleSubmitAttendance} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-800">
              Submit Attendance
            </button>
          </div>
        </div>
      )}

      {canView && showFilterForm && (
        <div className="bg-white mt-6 p-6 rounded-lg shadow-md max-w-4xl mx-auto border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Generate Attendance Report</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
              <select name="studentId" value={filters.studentId} onChange={handleFilterChange} className="w-full border border-gray-300 p-2 rounded-md">
                <option value="">-- Select Student --</option>
                {studentOptions.map((s) => (
                  <option key={s.profile_id} value={s.profile_id}>{s.username}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select name="type" value={filters.type} onChange={handleFilterChange} className="w-full border border-gray-300 p-2 rounded-md">
                <option value="Daily">Daily</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            {filters.type === 'Daily' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="w-full border border-gray-300 p-2 rounded-md" />
              </div>
            )}

            {filters.type === 'Monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month (1-12)</label>
                <input type="number" name="month" min="1" max="12" placeholder="e.g., 5" value={filters.month} onChange={handleFilterChange} className="w-full border border-gray-300 p-2 rounded-md" />
              </div>
            )}

            {filters.type === 'Yearly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input type="number" name="year" placeholder="e.g., 2024" value={filters.year} onChange={handleFilterChange} className="w-full border border-gray-300 p-2 rounded-md" />
              </div>
            )}
          </div>
          <div className="mt-6 text-right">
            <button onClick={handleFetchAttendance} className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 shadow">
              Generate Report
            </button>
          </div>
        </div>
      )}

      {canView && showReport && attendanceData.length > 0 && (
        <div className="p-4">
          <table className="w-full border mt-4 bg-white shadow">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2">Student</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((rec) => (
                <tr key={rec.id}>
                  <td className="border p-2">{rec.student}</td>
                  <td className="border p-2">{rec.date}</td>
                  <td className="border p-2">{rec.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Buttons />
        </div>
      )}
    </div>
  );
};

export default AttendanceStd;
