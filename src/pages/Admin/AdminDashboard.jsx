import React, { useState, useEffect } from "react";
import { FaChalkboardTeacher, FaBook, FaGraduationCap, FaHome, FaBirthdayCake, FaMoneyBillWave } from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import { Link } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";


const AdminDashboard = () => {
  const [tasks, setTasks] = useState([]);

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
    setTasks(savedTasks);
  }, []);
  const [showTasks, setShowTasks] = useState(false);
  const [newTask, setNewTask] = useState({ subject: "", description: "" });

  const handleAddTask = () => {
    if (newTask.subject.trim() !== "" && newTask.description.trim() !== "") {
      setTasks([...tasks, newTask]);
      setNewTask({ subject: "", description: "" });
    }
  };
  const attendanceData = {
    labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    datasets: [
      {
        label: "Students",
        data: [90, 85, 80, 70, 75],
        backgroundColor: "#1d72b8",
      },
      {
        label: "Teachers",
        data: [30, 25, 35, 20, 15],
        backgroundColor: "#77abdf",
      },
    ],
  };
  const [counts, setCounts] = useState({
    students: 0,
    teachers: 0,
    subjects: 0,
    classes: 0,
  });
 const API = import.meta.env.VITE_SERVER_URL;
  const fetchCounts = async () => {
    try {
      const token = Cookies.get("access_token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const [studentsRes, teachersRes, subjectsRes, classesRes] = await Promise.all([
        axios.get(`${API}api/auth/users/list_profiles/student/`, config),
        axios.get(`${API}api/auth/users/list_profiles/teacher/`, config),
        axios.get(`${API}subjects/`, config),
        axios.get(`${API}classes/`, config),
      ]);
      setCounts({
        students: studentsRes.data.data.total_items || 0,
        teachers: teachersRes.data.data.total_items || 0,
        subjects: subjectsRes.data.data.total_items || 0,
        classes: classesRes.data.data.total_items || 0,
      });

    } catch (err) {
      console.error(" Error fetching dashboard stats:", err);
    }
  };

  const [events, setEvents] = useState([]);

  const fetchAnnouncements = async () => {
    try {
      const token = Cookies.get("access_token");
      const res = await axios.get(`${API}announcements/?page=1&page_size=3`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data?.data?.results || res.data?.data || [];
      setEvents(data);
    } catch (err) {
      console.error("❌ Failed to load announcements:", err.response?.data || err.message);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = Cookies.get("access_token");

      const res = await axios.get(`${API}faculty-tasks/?page=1&page_size=3`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data?.data?.results || res.data?.data || [];
      setTasks(data);
    } catch (err) {
      console.error("❌ Failed to load weekly tasks:", err.response?.data || err.message);
    }
  };
  const [teachers, setTeachers] = useState([]);
  const getTeacherNames = (teacherIds) => {
    if (!teacherIds?.length) return "N/A";

    // Map teacher IDs to usernames using the teachers state
    return teacherIds
    .map(id => teachers.find(teacher => teacher.profile_id === id)?.username || "Unknown")
    .join(", ");
  }; 

  const fetchTeachers = async () => {
    try {
      const token = Cookies.get("access_token");
  
      const res = await axios.get(`${API}api/auth/users/list_profiles/teacher/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const data = res.data?.data?.results || res.data?.data || [];
      setTeachers(data);
    } catch (err) {
      console.error("❌ Failed to fetch teachers:", err.response?.data || err.message);
    }
  };
  
  useEffect(() => {
    fetchCounts();
    fetchAnnouncements();
    fetchTasks();
    fetchTeachers();
  }, []);
  const stats = [
    { title: "Total Students", count: counts.students, icon: <FaGraduationCap className="text-blue-900 text-5xl" /> },
    { title: "Total Employees", count: counts.teachers, icon: <FaChalkboardTeacher className="text-blue-900 text-5xl" /> },
    { title: "Total Course", count: counts.subjects, icon: <FaBook className="text-blue-900 text-5xl" /> },
    { title: "Total Batch", count: counts.classes, icon: <FaHome className="text-blue-900 text-5xl" /> },
  ];
  return (
    <div className="bg-blue-50 min-h-screen p-5">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((item, index) => (
          <div
            key={index}
            className="shadow-md rounded-md p-6 flex items-center space-x-4 bg-blue-300"
          >
            {item.icon}
            <div>
              <div className="text-md font-bold text-black">{item.title}</div>
              <div className="text-2xl font-bold text-blue-900">{item.count}</div>
            </div>
          </div>
        ))}
      </div>


      {/* Navigation Tabs */}
      <div className="flex justify-center space-x-8 my-8 bg-white py-4 rounded-lg">
        <Link to="/admin/weekly-task-manager" className="bg-blue-100 text-blue-500 font-medium px-4 py-2 rounded-full cursor-pointer shadow-inner hover:bg-blue-200">
          Activity
        </Link>
        {/* <Link to="/admin/view-timetable" className="bg-blue-100 text-blue-500 font-medium px-4 py-2 rounded-full cursor-pointer shadow-inner hover:bg-blue-200">
          Schedule
        </Link>
        <Link to="/admin/reporting" className="bg-blue-100 text-blue-500 font-medium px-4 py-2 rounded-full cursor-pointer shadow-inner hover:bg-blue-200">
          Reports
        </Link> */}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-4">
        {/* Left Content */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg p-6 shadow-md mb-14 h-96 ">
            <h4 className="text-lg  mb-4 text-blue-900 font-bold">
              Per Day Attendance for Students and Teachers
            </h4>
            <Bar
              data={attendanceData}
              options={{ responsive: true, maintainAspectRatio: false }}
              height={200}
            />
          </div>
          {/* weekly tasks */}
          <div className="bg-white shadow-md rounded-md p-4 mt-4">
            <h3 className="text-xl font-bold mb-4 text-blue-900">Weekly Tasks for Teachers</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="border-b-2 p-2">Task Description</th>
                  <th className="border-b-2 p-2">Teacher</th>
                  <th className="border-b-2 p-2">Start Date</th>
                  <th className="border-b-2 p-2">End Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center p-4">No tasks assigned yet</td>
                  </tr>
                ) : (
                  tasks.map((task, index) => (
                    <tr key={index}>
                      <td className="border-b p-2">{task.title}</td>
                      <td className="border-b p-2">{getTeacherNames(task.teachers)}</td>
                      <td className="border-b p-2">{new Date(task.start_date).toLocaleDateString()}</td>
                      <td className="border-b p-2">{new Date(task.due_date).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Content */}
        <div>
          {/* Upcoming Events */}
          <div className="bg-white shadow-md rounded-lg mb-4">
            <div className="bg-blue-900 text-white text-center rounded-t-lg py-2">
              <h3 className="text-lg font-bold uppercase">Upcoming Events</h3>
            </div>
            <ul>
              {events.map((event, index) => (
                <li
                  key={index}
                  className={`flex justify-between items-center px-4 py-3 ${index < events.length - 1 ? "border-b border-gray-200" : ""
                    }`}
                >
                  <span className="text-sm font-medium">{event.title || event.name}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(event.created_at || event.date).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>



          {/* Birthday Today */}
          <div className="bg-white shadow-md rounded-lg mb-4">
            <div className="bg-blue-800 text-white text-center rounded-t-lg py-2">
              <h3 className="text-lg font-bold uppercase">Birthday Today</h3>
            </div>
            <div className="flex justify-around items-center py-4">
              <div className="flex flex-col items-center">
                <FaGraduationCap className="text-blue-900 text-5xl" />
                <span className="text-xl font-bold">0</span>
                <span className="text-sm text-gray-500">Students</span>
              </div>
              <div className="flex flex-col items-center">
                <FaBirthdayCake className="text-pink-700 text-5xl" />

                {/* <img
                  src="https://cdn-icons-png.flaticon.com/512/3523/3523063.png"
                  alt="Cake"
                  className="w-10 h-10 mb-2"
                /> */}
                <span className="text-xl font-bold">-</span>
              </div>
              <div className="flex flex-col items-center">
                <FaChalkboardTeacher className="text-orange-900 text-5xl" />
                <span className="text-xl font-bold">0</span>
                <span className="text-sm text-gray-500">Teachers</span>
              </div>
            </div>
          </div>


          {/* Fee Collection */}
          <div className="bg-white shadow-md rounded-lg mb-4">
            <div className="bg-blue-700 text-white flex justify-between items-center rounded-t-lg py-2 px-4">
              <h3 className="text-lg font-bold">Fee Collection Of The Day</h3>
              <span className="text-sm">0/0/2025</span>
            </div>
            <div className="flex justify-around items-center py-4">
              <div className="flex flex-col items-center">
                <FaMoneyBillWave className="text-green-700 text-5xl" />
                <span className="text-xl font-bold">0</span>
                <span className="text-sm text-gray-500">Amount</span>
              </div>
              <div className="flex flex-col items-center">
                <FaMoneyBillWave className="text-green-700 text-5xl" />
                <span className="text-xl font-bold">0</span>
                <span className="text-sm text-gray-500">Discount</span>
              </div>
              <div className="flex flex-col items-center">
                <FaMoneyBillWave className="text-green-700 text-5xl" />
                <span className="text-xl font-bold">0</span>
                <span className="text-sm text-gray-500">Fine</span>
              </div>
            </div>
          </div>


          {/* To Do */}
          <div className="bg-white shadow-md rounded-lg mb-4">
            {/* Header with Toggle Button */}
            <div
              className="bg-blue-600 text-white flex justify-between items-center rounded-t-lg py-2 px-4 cursor-pointer"
              onClick={() => setShowTasks(!showTasks)}
            >
              <h3 className="text-lg font-bold">To Do</h3>
              <span className="text-white transform transition-transform duration-300" style={{ transform: showTasks ? "rotate(180deg)" : "rotate(0deg)" }}>
                &#9660;
              </span>
            </div>

            {/* Task Input */}
            <div className="p-4">
              <input
                type="text"
                placeholder="Subject..."
                value={newTask.subject}
                onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                className="w-full bg-gray-100 border border-gray-200 p-2 rounded-md mb-4 placeholder-gray-400 shadow-inner"
              />
              <textarea
                placeholder="What’s in your mind?"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full bg-gray-100 border border-gray-200 p-2 rounded-md h-20 placeholder-gray-400 shadow-inner"
              ></textarea>
              <button
                onClick={handleAddTask}
                className="mt-2 w-full bg-blue-600 text-white py-2 rounded-md shadow-md hover:bg-blue-700 transition"
              >
                Add Task
              </button>
            </div>

            {/* Task List (Hidden Until Click) */}
            {showTasks && tasks.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-b-lg">
                <h4 className="text-gray-700 font-semibold mb-2">Added Tasks:</h4>
                <ul className="list-disc pl-5 text-gray-600">
                  {tasks.map((task, index) => (
                    <li key={index} className="mb-2">
                      <strong>{task.subject}:</strong> {task.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
