import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { Bar } from 'react-chartjs-2';
import "chart.js/auto";
import Cookies from 'js-cookie';

const API = import.meta.env.VITE_SERVER_URL;
const API_BASE_URL = `${API}attendance/student-attendance/`;

const AttendanceStd = () => {
  const [students, setStudents] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [showFilterForm, setShowFilterForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [graphData, setGraphData] = useState(null);

  const [filters, setFilters] = useState({
    type: 'Daily',
    className: '',
    date: '',
    month: '',
    year: '',
  });

  const fetchClasses = async () => {
    try {
      const token = Cookies.get('access_token');
      if (!token) {
        toast.error('User is not authenticated.');
        return;
      }

      const response = await axios.get(`${API}classes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(response.data?.data?.results)) {
        const combinedData = response.data.data.results.map((cls) => ({
          id: cls.id,
          name: `${cls.class_name} - ${cls.section} - ${cls.session}`,
        }));

        setClassOptions(combinedData);
      } else {
        toast.error("No classes data available.");
      }
    } catch (error) {
      toast.error(`Failed to load classes: ${error.response?.data?.detail || error.message}`);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFetchAttendance = async () => {
    if (showReport) {
      setShowReport(false);
      setStudents([]);
      setGraphData(null);
      return;
    }

    let params = [];

    if (!studentId) {
      toast.error("Please enter student ID.");
      return;
    }

    params.push(`student_id=${studentId}`);

    if (filters.type === 'Daily' && filters.date) {
      params.push(`daily=true`);
      params.push(`date=${filters.date}`);
    } else if (filters.type === 'Monthly' && filters.month) {
      params.push(`month=${filters.month}`);
    } else if (filters.type === 'Yearly' && filters.year) {
      params.push(`year=${filters.year}`);
    }

    const queryString = params.join("&");
    const url = `${API_BASE_URL}?${queryString}`;

    try {
      const token = Cookies.get('access_token');
      if (!token) {
        toast.error('User is not authenticated.');
        return;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const rawData = response.data?.data?.results;

      if (Array.isArray(rawData)) {
        const records = rawData.map((record) => record.data || record);
        setStudents(records);
        generateGraph(records);
        setShowReport(true);
      } else if (rawData && typeof rawData === 'object') {
        const record = rawData.data || rawData;
        setStudents([record]);
        generateGraph([record]);
        setShowReport(true);
      } else {
        toast.error("Attendance data format is invalid.");
      }
    } catch (error) {
      toast.error(`Failed to load attendance: ${error.response?.data?.detail || error.message}`);
    }
  };

  const generateGraph = (data) => {
    const presentCount = data.filter((item) => item.status === 'Present').length;
    const absentCount = data.filter((item) => item.status === 'Absent').length;
    const lateCount = data.filter((item) => item.status === 'Late').length;

    setGraphData({
      labels: ['Present', 'Absent', 'Late'],
      datasets: [
        {
          label: 'Attendance Status',
          data: [presentCount, absentCount, lateCount],
          backgroundColor: ['#4caf50', '#f44336', '#ff9800'],
        },
      ],
    });
  };

  const toggleFilterForm = () => {
    if (showFilterForm) {
      setShowFilterForm(false);
      setShowReport(false);
      setStudents([]);
      setGraphData(null);
    } else {
      setShowFilterForm(true);
    }
  };

  return (
    <div>
      <Toaster position="top-center" />
      <div className="bg-blue-900 text-white py-4 px-8 mt-5 rounded-lg shadow-md flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Student Attendance Management</h1>
        <button
          onClick={toggleFilterForm}
          className="flex items-center px-4 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-600 transition duration-300"
        >
          {showFilterForm ? 'Close Report' : 'Fetch Attendance'}
        </button>
      </div>

      <div className="p-6">
        {showFilterForm && (
          <div className="bg-white shadow-md rounded-md p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700">Type:</label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="border p-2 rounded-md w-full"
                >
                  <option value="Daily">Daily</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700">Student ID:</label>
                <input
                  type="number"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="border p-2 rounded-md w-full"
                  placeholder="Enter Student ID"
                />
              </div>
              {filters.type === 'Daily' && (
                <div>
                  <label className="block font-medium text-gray-700">Date:</label>
                  <input
                    type="date"
                    name="date"
                    value={filters.date}
                    onChange={handleFilterChange}
                    className="border p-2 rounded-md w-full"
                  />
                </div>
              )}
              {filters.type === 'Monthly' && (
                <div>
                  <label className="block font-medium text-gray-700">Month (1-12):</label>
                  <input
                    type="number"
                    name="month"
                    value={filters.month}
                    onChange={handleFilterChange}
                    className="border p-2 rounded-md w-full"
                    min="1"
                    max="12"
                  />
                </div>
              )}
              {filters.type === 'Yearly' && (
                <div>
                  <label className="block font-medium text-gray-700">Year:</label>
                  <input
                    type="number"
                    name="year"
                    value={filters.year}
                    onChange={handleFilterChange}
                    className="border p-2 rounded-md w-full"
                  />
                </div>
              )}
            </div>
            <button
              onClick={handleFetchAttendance}
              className="bg-green-500 text-white px-4 py-2 rounded-md mt-4 hover:bg-green-700"
            >
              Generate Report
            </button>
          </div>
        )}

        {showReport && students.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 mt-4 bg-white shadow-lg rounded-lg">
              <thead>
                <tr className="bg-blue-800 text-white text-left">
                  <th className="border p-3">Student</th>
                  <th className="border p-3">Class</th>
                  <th className="border p-3">Subject</th>
                  <th className="border p-3">Teacher</th>
                  <th className="border p-3">Date</th>
                  <th className="border p-3">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {students.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-100 transition duration-300">
                    <td className="border p-3">{record.student}</td>
                    <td className="border p-3">{record.class_schedule}</td>
                    <td className="border p-3">{record.subject}</td>
                    <td className="border p-3">{record.teacher}</td>
                    <td className="border p-3">{record.date}</td>
                    <td className="border p-3">{record.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showReport && graphData && (
          <div className="mt-6 flex justify-center">
            <div className="w-80">
              <Bar
                data={graphData}
                options={{
                  maintainAspectRatio: true,
                  responsive: true,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceStd;
