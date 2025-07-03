import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import Cookies from "js-cookie";
import { Buttons } from "../../components";

const API = import.meta.env.VITE_SERVER_URL;
const API_BASE_URL = `${API}staff-attendance/`;
const TEACHERS_API_URL = `${API}api/auth/users/list_profiles/teacher/`;

const AttendanceStaff = () => {
    const [loading, setLoading] = useState(false);
    const [teachers, setTeachers] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [showAttendanceTable, setShowAttendanceTable] = useState(false);
    const [showFilterForm, setShowFilterForm] = useState(false);
    const [attendanceData, setAttendanceData] = useState([]);
    const [showReport, setShowReport] = useState(false);
    const [filters, setFilters] = useState({
        type: "Daily",
        department: "Teaching",
        date: "",
        staffId: "",
        startDate: "",
        endDate: "",
        month: "",
        year: "",
    });
    const [filteredData, setFilteredData] = useState([]);
    const [graphData, setGraphData] = useState(null);

    // Fetch teachers from the API
    const fetchTeachers = async () => {
        try {

            const token = Cookies.get("access_token");
            if (!token) {
                toast.error("User is not authenticated.");
                return;
            }
            const response = await axios.get(TEACHERS_API_URL, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTeachers(response.data?.data.results || []);
        } catch (error) {
            console.error("Failed to fetch teachers:", error);
            toast.error("Failed to load teachers");
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    //  Handle attendance status change
    const handleAttendanceChange = (index, status) => {
        const updatedAttendance = [...attendance];
        updatedAttendance[index].status = status;
        setAttendance(updatedAttendance);
    };

    //  Handle form change
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    //  Mark Attendance - Show Attendance Table
    //  Toggle Attendance Table
    const handleMarkAttendance = async () => {
        const token = Cookies.get("access_token");
        if (!token) {
            toast.error("User is not authenticated.");
            return;
        }

        const today = new Date().toISOString().slice(0, 10);

        try {
            const response = await axios.get(`${API_BASE_URL}?date=${today}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Get list of user_ids who already marked attendance
            const alreadyMarkedUserIds = (response.data?.data?.results || []).map(
                (item) => item.staff // assuming this is user_id
            );

            const initialAttendance = teachers
                .filter((teacher) => !alreadyMarkedUserIds.includes(teacher.user_id))
                .map((teacher) => ({
                    staff: teacher.user_id, // user_id, not profile_id
                    staffName: teacher.username,
                    department: filters.department,
                    status: "Present",
                }));

            if (initialAttendance.length === 0) {
                toast("All staff have already marked attendance for today.");
                return;
            }

            setAttendance(initialAttendance);
            setShowAttendanceTable(true);
        } catch (error) {
            console.error("❌ Failed to check already marked attendance:", error);
            toast.error("Failed to prepare attendance list");
        }
    };



    //  Save Attendance - Save Data to API
    const handleSaveAttendance = async () => {
        const token = Cookies.get("access_token");

        if (!token) {
            toast.error("User is not authenticated.");
            return;
        }

        const payload = attendance.map((entry) => ({
            staff: parseInt(entry.staff),
            status: entry.status,
            date: filters.date || new Date().toISOString().slice(0, 10),
            remarks: entry.remarks || null,
        }));

        console.log("📤 Payload:", payload);

        const results = await Promise.allSettled(
            payload.map(async (data) => {
                console.log("Submitting:", data);
                try {
                    const response = await axios.post(API_BASE_URL, data, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    });
                    console.log("✅ Response:", response.data);
                } catch (error) {
                    const errMsg = error.response?.data?.message || error.message;
                    console.error(`❌ Staff ${data.staff} failed:`, errMsg);
                    toast.error(`Staff ${data.staff}: ${errMsg}`);
                }
            })
        );

        setShowAttendanceTable(false);
        setAttendance([]);
    };





    //  Fetch Attendance Data
    const handleFetchAttendance = async () => {
        setLoading(true);
        let params = [];

        if (filters.type === "Daily" && filters.date) {
            params.push(`date=${filters.date}`);

        }
        if (filters.type === "Weekly" && filters.startDate && filters.endDate) {
            params.push(`start_date=${formatDate(filters.startDate)}`);
            params.push(`end_date=${formatDate(filters.endDate)}`);
        }
        if (filters.type === "Monthly" && filters.month && filters.year) {
            params.push(`month=${filters.month}`);
            params.push(`year=${filters.year}`);
        }
        if (filters.type === "Yearly" && filters.year) {
            params.push(`year=${filters.year}`);
        }
        if (filters.type === "Specific" && filters.staffId) {
            params.push(`staff=${filters.staffId}`);
        }

        const queryString = params.join("&");
        const url = `${API_BASE_URL}?${queryString}`;

        try {
            const token = Cookies.get("access_token");
            if (!token) {
                toast.error("User is not authenticated.");
                return;
            }

            console.log("📥 Fetching from:", url);
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("✅ Response:", response.data);
            setAttendanceData(response.data?.data?.results || []);
            generateGraph(response.data?.data?.results || []);
            setShowReport(true);
        } catch (error) {
            console.error("❌ Failed to fetch attendance:", error);
            toast.error("Failed to fetch attendance");
        } finally {
            setLoading(false);
        }
    };



    //  Toggle Filter Form
    const toggleFilterForm = () => {
        if (showFilterForm) {
            //  If form is showing, hide form and report
            setShowFilterForm(false);
            setShowReport(false);
            setAttendanceData([]);
            setGraphData(null);
        } else {
            setShowFilterForm(true);
        }
    };






    //  Generate Graph Data
    const generateGraph = (data) => {
        const presentCount = data.filter((item) => item.status === "Present").length;
        const absentCount = data.filter((item) => item.status === "Absent").length;
        const lateCount = data.filter((item) => item.status === "Late").length;
        const leaveCount = data.filter((item) => item.status === "Leave").length;
        const halfDayCount = data.filter((item) => item.status === "Half-day").length;

        setGraphData({
            labels: ["Present", "Absent", "Late", "Leave", "Half-day"],
            datasets: [
                {
                    label: "Attendance Status",
                    data: [presentCount, absentCount, lateCount, leaveCount, halfDayCount],
                    backgroundColor: ["#4caf50", "#f44336", "#ff9800", "#2196f3", "#9c27b0"],
                },
            ],
        });
    };

    // ✅ Map Teacher ID to Teacher Name
    const getTeacherName = (staffId) => {
        const teacher = teachers.find((t) => t.user_id === staffId);
        return teacher ? teacher.username : "Unknown";
    };

    return (
        <div >
            <Toaster position="top-center" />

            {/*  Header */}
            <div className="bg-blue-900 text-white py-2 px-8 rounded-lg shadow-md flex justify-between items-center mt-5">
                <h1 className="text-2xl font-bold tracking-wide">Staff Attendance Management</h1>

                <div className="flex items-center space-x-4">
                    {/*  Mark Attendance Button */}
                    <button
                        onClick={handleMarkAttendance}
                        className="flex items-center px-4 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-600 transition duration-300"
                    >
                        <div className="flex items-center justify-center w-8 h-8 bg-black rounded-full mr-2">
                            <span className="text-cyan-500 text-xl font-bold">+</span>
                        </div>
                        Mark Attendance
                    </button>

                    {/*  Fetch Attendance Button */}
                    <button
                        onClick={toggleFilterForm}
                        className="flex items-center px-4 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-600 transition duration-300"
                    >
                        <div className="flex items-center justify-center w-8 h-8 bg-black rounded-full mr-2">
                            <span className="text-cyan-500 text-xl font-bold">📥</span>
                        </div>
                        {showFilterForm ? "Close Report" : "Fetch Attendance"}
                    </button>
                </div>
            </div>

            <div className="p-6">

                {/*  Attendance Table */}
                {showAttendanceTable && (
                    <>
                        <table className="w-full border-collapse border border-gray-300 mt-4 bg-white shadow-md">
                            <thead>
                                <tr className="bg-blue-900 text-white">
                                    <th className="border p-2">#</th>
                                    <th className="border p-2">Staff Name</th>
                                    <th className="border p-2">Department</th>
                                    <th className="border p-2">Attendance Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.map((entry, index) => (
                                    <tr key={index}>
                                        <td className="border p-2">{entry.staff}</td>
                                        <td className="border p-2">{entry.staffName}</td>
                                        <td className="border p-2">{entry.department}</td>
                                        <td className="border p-2">
                                            <select
                                                value={entry.status}
                                                onChange={(e) =>
                                                    handleAttendanceChange(index, e.target.value)
                                                }
                                                className="border p-2 w-full"
                                            >
                                                <option value="Present">Present</option>
                                                <option value="Late">Late</option>
                                                <option value="Absent">Absent</option>
                                                <option value="Leave">Leave</option>
                                                <option value="Half-day">Half-day</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/*  Save Button */}
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={handleSaveAttendance}
                                className="bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-700"
                            >
                                Save Attendance
                            </button>
                        </div>
                    </>
                )}

                {/*  Filter Form */}
                {showFilterForm && (
                    <div className="bg-white shadow-md rounded-md p-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Type */}
                            <div>
                                <label className="block font-medium text-gray-700">Type:</label>
                                <select
                                    name="type"
                                    value={filters.type}
                                    onChange={handleFilterChange}
                                    className="border p-2 rounded-md w-full"
                                >
                                    <option value="">Select Type</option>
                                    <option value="Daily">Daily</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Yearly">Yearly</option>
                                    <option value="Specific">Specific Staff</option>
                                </select>
                            </div>

                            {/* Date for Daily */}
                            {filters.type === "Daily" && (
                                <input
                                    type="date"
                                    name="date"
                                    value={filters.date}
                                    onChange={handleFilterChange}
                                    className="border p-2 rounded-md"
                                />
                            )}

                            {filters.type === "Monthly" && (
                                <>
                                    <div>
                                        <label className="block font-medium text-gray-700">Month:</label>
                                        <select
                                            name="month"
                                            value={filters.month}
                                            onChange={handleFilterChange}
                                            className="border p-2 rounded-md w-full"
                                        >
                                            <option value="">Select Month</option>
                                            {[...Array(12)].map((_, i) => (
                                                <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                                                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
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
                                </>
                            )}

                            {/* Teacher dropdown for Specific Staff */}
                            {filters.type === "Specific" && (
                                <select
                                    name="staffId"
                                    value={filters.staffId}
                                    onChange={handleFilterChange}
                                    className="border p-2 rounded-md"
                                >
                                    <option value="">Select Teacher</option>
                                    {teachers.map((teacher) => (
                                        <option key={teacher.profile_id} value={teacher.profile_id}>
                                            {teacher.username}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/*  Generate Report Button */}
                        <button
                            onClick={handleFetchAttendance}
                            className="bg-green-500 text-white px-4 py-2 rounded-md mt-4 hover:bg-green-700"
                        >
                            Generate Report
                        </button>
                    </div>
                )}

                <Buttons/>
                {/*  Data Table */}
                {showReport && attendanceData.length > 0 && (
                    <table className="w-full border-collapse border mt-4 bg-white shadow-md">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="border p-2">ID</th>
                                <th className="border p-2">Teacher Name</th>
                                {filters.type !== "Specific" && <th className="border p-2">Date</th>}
                                <th className="border p-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendanceData.map((item) => (
                                <tr key={item.id}>
                                    {/* ✅ Show Staff ID */}
                                    <td className="border p-2">{item.staff}</td>

                                    {/* ✅ Show Teacher Name instead of ID */}
                                    <td className="border p-2">{getTeacherName(item.staff)}</td>

                                    {/* ✅ Show Date */}
                                    {filters.type !== "Specific" && (
                                        <td className="border p-2">{item.date}</td>
                                    )}

                                    {/* ✅ Show Status */}
                                    <td className="border p-2">{item.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/*  Graph */}
                {showReport && graphData && (
                    <div className="mt-6 flex justify-center">
                        <div className="w-full md:w-1/2 lg:w-1/3">
                            <Bar
                                data={graphData}
                                options={{
                                    maintainAspectRatio: false,
                                    responsive: true,
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                        },
                                    },
                                    plugins: {
                                        legend: {
                                            display: true,
                                            position: "top",
                                        },
                                    },
                                }}
                                height={180}
                                width={300}
                            />
                        </div>
                    </div>
                )}


            </div>



        </div>
    );
};


export default AttendanceStaff;
