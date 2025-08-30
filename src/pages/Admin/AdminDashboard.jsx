import React, { useState, useEffect } from "react";
import { FaChalkboardTeacher, FaBook, FaGraduationCap, FaHome, FaBirthdayCake, FaMoneyBillWave } from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import { Link } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";

const AdminDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [showTasks, setShowTasks] = useState(false);
  const [newTask, setNewTask] = useState({ subject: "", description: "" });
  const [userProfile, setUserProfile] = useState(null);
  const [schoolId, setSchoolId] = useState(null);

  // Load tasks from React state instead of localStorage
  useEffect(() => {
    // Remove localStorage dependency as per requirements
    const initialTasks = [];
    setTasks(initialTasks);
  }, []);

  const handleAddTask = () => {
    if (newTask.subject.trim() !== "" && newTask.description.trim() !== "") {
      setTasks([...tasks, newTask]);
      setNewTask({ subject: "", description: "" });
    }
  };

  // Initialize attendance data with empty state
  const [attendanceData, setAttendanceData] = useState({
    labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    datasets: [
      {
        label: "Students",
        data: [0, 0, 0, 0, 0],
        backgroundColor: "#1d72b8",
      },
      {
        label: "Teachers",
        data: [0, 0, 0, 0, 0],
        backgroundColor: "#77abdf",
      },
    ],
  });

  const [counts, setCounts] = useState({
    students: 0,
    teachers: 0,
    subjects: 0,
    classes: 0,
  });

  const API = import.meta.env.VITE_SERVER_URL;

  // Helper function to get dates for the current week
  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + (currentDay === 0 ? -6 : 1)); // Get Monday of current week
    
    const weekDates = [];
    for (let i = 0; i < 5; i++) { // Monday to Friday
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date.toISOString().split('T')[0]); // Format: YYYY-MM-DD
    }
    return weekDates;
  };

  // Helper function to format date to YYYY-MM-DD
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Fetch students for attendance data
  const fetchStudentsForAttendance = async () => {
    try {
      const token = Cookies.get("access_token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const schoolParam = schoolId ? `?school_id=${schoolId}` : '';
      const studentsUrl = `${API}api/auth/users/list_profiles/student/${schoolParam}`;
      
      const res = await axios.get(studentsUrl, config);
      const students = res.data?.data?.results || res.data?.data || [];
      
      return students;
    } catch (err) {
      console.error("❌ Failed to fetch students for attendance:", err);
      return [];
    }
  };

  // Fetch student attendance for a specific date
  const fetchStudentAttendanceForDate = async (date, students) => {
    try {
      const token = Cookies.get("access_token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      let totalPresent = 0;
      
      // If no students, return 0
      if (!students.length) return 0;

      // Fetch attendance for each student (you might want to optimize this with a bulk API if available)
      const attendancePromises = students.slice(0, 10).map(async (student) => { // Limit to first 10 students to avoid too many API calls
        try {
          const studentId = student.profile_id || student.id;
          const res = await axios.get(
            `${API}attendance/student-attendance/?student_id=${studentId}&daily=true&date=${date}`,
            config
          );
          
          const attendanceData = res.data?.data || res.data;
          // Check if student was present on this date
          if (Array.isArray(attendanceData)) {
            return attendanceData.some(record => 
              record.date === date && (record.status === 'present' || record.is_present === true)
            ) ? 1 : 0;
          } else if (attendanceData && (attendanceData.status === 'present' || attendanceData.is_present === true)) {
            return 1;
          }
          return 0;
        } catch (err) {
          console.error(`❌ Error fetching attendance for student ${student.profile_id}:`, err);
          return 0;
        }
      });

      const attendanceResults = await Promise.all(attendancePromises);
      totalPresent = attendanceResults.reduce((sum, present) => sum + present, 0);
      
      // Scale up based on total students if we only sampled a subset
      if (students.length > 10) {
        totalPresent = Math.round((totalPresent / 10) * students.length);
      }
      
      return totalPresent;
    } catch (err) {
      console.error("❌ Error fetching student attendance for date:", date, err);
      return 0;
    }
  };

  // Fetch teacher attendance for a specific date
  const fetchTeacherAttendanceForDate = async (date) => {
    try {
      const token = Cookies.get("access_token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const res = await axios.get(`${API}staff-attendance/?date=${date}`, config);
      const attendanceData = res.data?.data || res.data?.results || res.data || [];
      
      // Count present teachers
      if (Array.isArray(attendanceData)) {
        return attendanceData.filter(record => 
          record.status === 'present' || 
          record.is_present === true ||
          record.attendance_status === 'present'
        ).length;
      }
      
      return 0;
    } catch (err) {
      console.error("❌ Error fetching teacher attendance for date:", date, err);
      return 0;
    }
  };

  // Fetch attendance data for the current week
  const fetchWeeklyAttendanceData = async () => {
    try {
      console.log("🔍 Fetching weekly attendance data...");
      
      const weekDates = getCurrentWeekDates();
      const students = await fetchStudentsForAttendance();
      
      console.log("📅 Week dates:", weekDates);
      console.log("👥 Students count:", students.length);

      // Fetch attendance for each day of the week
      const studentAttendancePromises = weekDates.map(date => 
        fetchStudentAttendanceForDate(date, students)
      );
      
      const teacherAttendancePromises = weekDates.map(date => 
        fetchTeacherAttendanceForDate(date)
      );

      const [studentAttendanceData, teacherAttendanceData] = await Promise.all([
        Promise.all(studentAttendancePromises),
        Promise.all(teacherAttendancePromises)
      ]);

      console.log("📊 Student attendance data:", studentAttendanceData);
      console.log("👨‍🏫 Teacher attendance data:", teacherAttendanceData);

      // Update the chart data
      setAttendanceData({
        labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        datasets: [
          {
            label: "Students Present",
            data: studentAttendanceData,
            backgroundColor: "#1d72b8",
            borderColor: "#1d72b8",
            borderWidth: 1,
          },
          {
            label: "Teachers Present",
            data: teacherAttendanceData,
            backgroundColor: "#77abdf",
            borderColor: "#77abdf",
            borderWidth: 1,
          },
        ],
      });

    } catch (err) {
      console.error("❌ Error fetching weekly attendance data:", err);
      // Keep default empty data if there's an error
    }
  };

  // Fetch current user's profile and school information
  const fetchUserProfile = async () => {
    try {
      const token = Cookies.get("access_token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const res = await axios.get(`${API}api/auth/users/profile/`, config);
      const profile = res.data?.data || res.data;
      
      console.log("🔍 Full API Response:", res.data);
      console.log("🔍 Extracted Profile:", profile);
      
      setUserProfile(profile);
      
      // Try multiple possible field names for UUID school ID
      const userSchoolId = profile.school_id || 
                          profile.school?.id || 
                          profile.school?.uuid ||
                          profile.institution_id || 
                          profile.institution_uuid ||
                          profile.school || 
                          profile.institution ||
                          profile.organization_id ||
                          profile.organization_uuid ||
                          profile.uuid; // In case the profile itself contains school info
      
      console.log("🏫 School UUID Found:", userSchoolId);
      console.log("🔍 Is valid UUID format:", /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userSchoolId));
      console.log("🔍 All profile keys:", Object.keys(profile));
      
      // Only set school ID if it looks like a valid UUID
      if (userSchoolId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userSchoolId)) {
        setSchoolId(userSchoolId);
      } else {
        console.warn("⚠️ No valid UUID found for school ID");
        setSchoolId(null);
      }
      
    } catch (err) {
      console.error("❌ Failed to fetch user profile:", err.response?.data || err.message);
    }
  };

  const fetchCounts = async () => {
    try {
      const token = Cookies.get("access_token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      console.log("🔍 Fetching counts with School UUID:", schoolId);

      // Try different URL patterns for UUID-based APIs
      let studentsUrl, teachersUrl, subjectsUrl, classesUrl;

      if (schoolId) {
        // UUID-specific URL patterns - try these common patterns
        
        // Pattern 1: Query parameter with school_id
        studentsUrl = `${API}api/auth/users/list_profiles/student/?school_id=${schoolId}`;
        teachersUrl = `${API}api/auth/users/list_profiles/teacher/?school_id=${schoolId}`;
        subjectsUrl = `${API}subjects/?school_id=${schoolId}`;
        classesUrl = `${API}classes/?school_id=${schoolId}`;
        
        // Uncomment alternative patterns if the above doesn't work:
        
        // Pattern 2: Query parameter with school_uuid
        // studentsUrl = `${API}api/auth/users/list_profiles/student/?school_uuid=${schoolId}`;
        // teachersUrl = `${API}api/auth/users/list_profiles/teacher/?school_uuid=${schoolId}`;
        // subjectsUrl = `${API}subjects/?school_uuid=${schoolId}`;
        // classesUrl = `${API}classes/?school_uuid=${schoolId}`;
        
        // Pattern 3: Query parameter with institution_id
        // studentsUrl = `${API}api/auth/users/list_profiles/student/?institution_id=${schoolId}`;
        // teachersUrl = `${API}api/auth/users/list_profiles/teacher/?institution_id=${schoolId}`;
        // subjectsUrl = `${API}subjects/?institution_id=${schoolId}`;
        // classesUrl = `${API}classes/?institution_id=${schoolId}`;
        
        // Pattern 4: Path-based UUID routing
        // studentsUrl = `${API}schools/${schoolId}/students/`;
        // teachersUrl = `${API}schools/${schoolId}/teachers/`;
        // subjectsUrl = `${API}schools/${schoolId}/subjects/`;
        // classesUrl = `${API}schools/${schoolId}/classes/`;
        
      } else {
        // Fallback to original URLs if no school UUID
        studentsUrl = `${API}api/auth/users/list_profiles/student/`;
        teachersUrl = `${API}api/auth/users/list_profiles/teacher/`;
        subjectsUrl = `${API}subjects/`;
        classesUrl = `${API}classes/`;
        console.log("⚠️ No school UUID found, fetching all data");
      }

      console.log("🔗 API URLs with UUID:", {
        students: studentsUrl,
        teachers: teachersUrl,
        subjects: subjectsUrl,
        classes: classesUrl
      });

      const [studentsRes, teachersRes, subjectsRes, classesRes] = await Promise.all([
        axios.get(studentsUrl, config).catch(err => {
          console.error("❌ Students API error:", err.response?.data || err.message);
          return { data: { data: { total_items: 0 }, results: [] } };
        }),
        axios.get(teachersUrl, config).catch(err => {
          console.error("❌ Teachers API error:", err.response?.data || err.message);
          return { data: { data: { total_items: 0 }, results: [] } };
        }),
        axios.get(subjectsUrl, config).catch(err => {
          console.error("❌ Subjects API error:", err.response?.data || err.message);
          return { data: { data: { total_items: 0 }, results: [] } };
        }),
        axios.get(classesUrl, config).catch(err => {
          console.error("❌ Classes API error:", err.response?.data || err.message);
          return { data: { data: { total_items: 0 }, results: [] } };
        }),
      ]);

      console.log("📊 API Responses with UUIDs:", {
        students: studentsRes.data,
        teachers: teachersRes.data,
        subjects: subjectsRes.data,
        classes: classesRes.data
      });

      const newCounts = {
        students: studentsRes.data?.data?.total_items || 
                 studentsRes.data?.total_items || 
                 studentsRes.data?.data?.count || 
                 studentsRes.data?.count ||
                 studentsRes.data?.data?.length || 
                 studentsRes.data?.length || 
                 (Array.isArray(studentsRes.data?.data?.results) ? studentsRes.data.data.results.length : 0) ||
                 (Array.isArray(studentsRes.data?.results) ? studentsRes.data.results.length : 0) || 0,
        
        teachers: teachersRes.data?.data?.total_items || 
                 teachersRes.data?.total_items || 
                 teachersRes.data?.data?.count || 
                 teachersRes.data?.count ||
                 teachersRes.data?.data?.length || 
                 teachersRes.data?.length || 
                 (Array.isArray(teachersRes.data?.data?.results) ? teachersRes.data.data.results.length : 0) ||
                 (Array.isArray(teachersRes.data?.results) ? teachersRes.data.results.length : 0) || 0,
        
        subjects: subjectsRes.data?.data?.total_items || 
                 subjectsRes.data?.total_items || 
                 subjectsRes.data?.data?.count || 
                 subjectsRes.data?.count ||
                 subjectsRes.data?.data?.length || 
                 subjectsRes.data?.length || 
                 (Array.isArray(subjectsRes.data?.data?.results) ? subjectsRes.data.data.results.length : 0) ||
                 (Array.isArray(subjectsRes.data?.results) ? subjectsRes.data.results.length : 0) || 0,
        
        classes: classesRes.data?.data?.total_items || 
                classesRes.data?.total_items || 
                classesRes.data?.data?.count || 
                classesRes.data?.count ||
                classesRes.data?.data?.length || 
                classesRes.data?.length || 
                (Array.isArray(classesRes.data?.data?.results) ? classesRes.data.data.results.length : 0) ||
                (Array.isArray(classesRes.data?.results) ? classesRes.data.results.length : 0) || 0,
      };

      console.log("📈 Final Counts with UUID filtering:", newCounts);
      setCounts(newCounts);

    } catch (err) {
      console.error("❌ Error fetching dashboard stats:", err.response?.data || err.message);
      console.error("❌ Full error:", err);
    }
  };

  const [events, setEvents] = useState([]);

  const fetchAnnouncements = async () => {
    try {
      const token = Cookies.get("access_token");
      
      // Add school filter to announcements
      const schoolParam = schoolId ? `&school_id=${schoolId}` : '';
      
      const res = await axios.get(`${API}announcements/?page=1&page_size=3${schoolParam}`, {
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

      // Add school filter to tasks
      const schoolParam = schoolId ? `&school_id=${schoolId}` : '';

      const res = await axios.get(`${API}faculty-tasks/?page=1&page_size=3${schoolParam}`, {
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

    return teacherIds
      .map(id => teachers.find(teacher => teacher.profile_id === id)?.username || "Unknown")
      .join(", ");
  };

  const fetchTeachers = async () => {
    try {
      const token = Cookies.get("access_token");

      // Add school filter to teachers
      const schoolFilter = schoolId ? `?school_id=${schoolId}` : '';

      const res = await axios.get(`${API}api/auth/users/list_profiles/teacher/${schoolFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data?.data?.results || res.data?.data || [];
      setTeachers(data);
    } catch (err) {
      console.error("❌ Failed to fetch teachers:", err.response?.data || err.message);
    }
  };

  // First fetch user profile, then fetch school-specific data
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // When schoolId is available, fetch school-specific data
  useEffect(() => {
    // Always fetch data, with or without school filtering
    fetchCounts();
    fetchAnnouncements();
    fetchTasks();
    fetchTeachers();
    // Fetch real attendance data
    fetchWeeklyAttendanceData();
  }, [schoolId]); // Still depend on schoolId in case it's needed later

  const stats = [
    { title: "Total Students", count: counts.students, icon: <FaGraduationCap className="text-blue-900 text-5xl" /> },
    { title: "Total Employees", count: counts.teachers, icon: <FaChalkboardTeacher className="text-blue-900 text-5xl" /> },
    { title: "Total Course", count: counts.subjects, icon: <FaBook className="text-blue-900 text-5xl" /> },
    { title: "Total Batch", count: counts.classes, icon: <FaHome className="text-blue-900 text-5xl" /> },
  ];

  return (
    <div className="bg-blue-50 min-h-screen p-5">
     

      {/* Display school info if available */}
      {userProfile && userProfile.school_name && (
        <div className="mb-4 p-3 bg-blue-100 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-800">
            📚 {userProfile.school_name} Dashboard
          </h2>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item, index) => (
          <div
            key={index}
            className="shadow-md rounded-md p-6 flex flex-col items-center justify-center bg-blue-300 text-center"
          >
            <div className="text-5xl flex-shrink-0 mb-3">{item.icon}</div>
            <div className="text-md font-bold text-black">{item.title}</div>
            <div className="text-2xl font-bold text-blue-900">{item.count}</div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center space-x-8 my-8 bg-white py-4 rounded-lg">
        <Link to="/admin/weekly-task-manager" className="bg-blue-100 text-blue-500 font-medium px-4 py-2 rounded-full cursor-pointer shadow-inner hover:bg-blue-200">
          Activity
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-4">
        {/* Left Content */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg p-6 shadow-md mb-14 h-96 ">
            <h4 className="text-lg  mb-4 text-blue-900 font-bold">
              Per Day Attendance for Students and Teachers (Current Week)
              {userProfile?.school_name && (
                <span className="text-sm text-gray-600"> - {userProfile.school_name}</span>
              )}
            </h4>
            <Bar
              data={attendanceData}
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                  }
                }
              }}
              height={200}
            />
          </div>
          
          {/* weekly tasks */}
          <div className="bg-white shadow-md rounded-md p-2 mt-2">
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-blue-900">Weekly Tasks for Teachers</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[300px]">
                <thead>
                  <tr>
                    <th className="border-b-2 p-1 text-xs">Task Description</th>
                    <th className="border-b-2 p-1 text-xs">Teacher</th>
                    <th className="border-b-2 p-1 text-xs">Start Date</th>
                    <th className="border-b-2 p-1 text-xs">End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center p-2 text-xs">No tasks assigned yet</td>
                    </tr>
                  ) : (
                    tasks.map((task, index) => (
                      <tr key={index}>
                        <td className="border-b p-1 text-xs">{task.title}</td>
                        <td className="border-b p-1 text-xs">{getTeacherNames(task.teachers)}</td>
                        <td className="border-b p-1 text-xs">{new Date(task.start_date).toLocaleDateString()}</td>
                        <td className="border-b p-1 text-xs">{new Date(task.due_date).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
          <div className="bg-white shadow-md rounded-md mb-2">
            <div className="bg-blue-700 text-white flex justify-between items-center rounded-t-md py-1 px-2">
              <h3 className="text-base sm:text-lg font-bold">Fee Collection Of The Month</h3>
              <span className="text-xs sm:text-sm">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex flex-col sm:flex-row justify-around items-center py-2 px-2">
              <div className="flex flex-col items-center mb-2 sm:mb-0">
                <FaMoneyBillWave className="text-green-700 text-4xl" />
                <span className="text-lg sm:text-xl font-bold">0</span>
                <span className="text-xs sm:text-sm text-gray-500">Amount</span>
              </div>
              <div className="flex flex-col items-center mb-2 sm:mb-0">
                <FaMoneyBillWave className="text-green-700 text-4xl" />
                <span className="text-lg sm:text-xl font-bold">0</span>
                <span className="text-xs sm:text-sm text-gray-500">Discount</span>
              </div>
              <div className="flex flex-col items-center">
                <FaMoneyBillWave className="text-green-700 text-4xl" />
                <span className="text-lg sm:text-xl font-bold">0</span>
                <span className="text-xs sm:text-sm text-gray-500">Fine</span>
              </div>
            </div>
          </div>

          {/* To Do */}
          <div className="bg-white shadow-md rounded-md mb-2">
            <div
              className="bg-blue-600 text-white flex justify-between items-center rounded-t-md py-1 px-2 cursor-pointer"
              onClick={() => setShowTasks(!showTasks)}
            >
              <h3 className="text-base sm:text-lg font-bold">To Do</h3>
              <span className="text-white transform transition-transform duration-300 text-sm" style={{ transform: showTasks ? "rotate(180deg)" : "rotate(0deg)" }}>
                &#9660;
              </span>
            </div>

            <div className="p-2">
              <input
                type="text"
                placeholder="Subject..."
                value={newTask.subject}
                onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                className="w-full bg-gray-100 border border-gray-200 p-1 rounded-md mb-1 text-xs placeholder-gray-400 shadow-inner"
              />
              <textarea
                placeholder="What's in your mind?"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full bg-gray-100 border border-gray-200 p-1 rounded-md h-12 text-xs placeholder-gray-400 shadow-inner"
              ></textarea>
              <button
                onClick={handleAddTask}
                className="mt-1 w-full bg-blue-600 text-white py-1 rounded-md text-xs shadow-md hover:bg-blue-700 transition"
              >
                Add Task
              </button>
            </div>

            {showTasks && tasks.length > 0 && (
              <div className="p-2 bg-gray-50 rounded-b-md">
                <h4 className="text-gray-700 font-semibold mb-1 text-xs">Added Tasks:</h4>
                <ul className="list-disc pl-3 text-xs text-gray-600">
                  {tasks.map((task, index) => (
                    <li key={index} className="mb-1">
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