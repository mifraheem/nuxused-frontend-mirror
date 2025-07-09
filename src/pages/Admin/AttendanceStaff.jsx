import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
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
        date: new Date().toISOString().split("T")[0],
        staffId: "",
        startDate: "",
        endDate: "",
        month: "",
        year: new Date().getFullYear(),
    });

    const fetchTeachers = async () => {
        try {
            const token = Cookies.get("access_token");
            if (!token) return toast.error("User is not authenticated.");
            const res = await axios.get(TEACHERS_API_URL, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTeachers(res.data?.data.results || []);
        } catch (err) {
            console.error("Error fetching teachers:", err);
            toast.error("Failed to load teachers");
        }
    };

    useEffect(() => { fetchTeachers(); }, []);

    const handleEditAttendance = async (recordId, updatedStatus, updatedRemarks) => {
        const token = Cookies.get("access_token");
        if (!token) return toast.error("User is not authenticated.");

        try {
            const res = await axios.patch(`${API_BASE_URL}${recordId}/`, {
                status: updatedStatus,
                remarks: updatedRemarks,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            toast.success("Attendance updated successfully");
            handleFetchAttendance();
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            toast.error(`Update failed: ${msg}`);
        }
    };

    const handleAttendanceChange = (index, status) => {
        const updated = [...attendance];
        updated[index].status = status;
        setAttendance(updated);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleMarkAttendance = async () => {
        const token = Cookies.get("access_token");
        if (!token) return toast.error("User is not authenticated.");

        const today = new Date().toISOString().slice(0, 10);

        try {
            const res = await axios.get(`${API_BASE_URL}?date=${today}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const alreadyMarkedIds = res.data?.data?.results?.map(i => i.staff) || [];
            const initial = teachers.filter(t => !alreadyMarkedIds.includes(t.user_id)).map(t => ({
                staff: t.user_id,
                staffName: t.username,
                department: filters.department,
                status: "Present",
            }));
            if (initial.length === 0) return toast("All staff have already marked attendance for today.");
            setAttendance(initial);
            setShowAttendanceTable(true);
        } catch (err) {
            console.error("Error preparing attendance list:", err);
            toast.error("Failed to prepare attendance list");
        }
    };


    const handleSaveAttendance = async () => {
        const token = Cookies.get("access_token");
        if (!token) return toast.error("User is not authenticated.");

        const payload = attendance.map(entry => ({
            staff: parseInt(entry.staff),
            status: entry.status,
            date: filters.date || new Date().toISOString().slice(0, 10),
            remarks: entry.remarks || null,
        }));

        const results = await Promise.allSettled(payload.map(async data => {
            try {
                await axios.post(API_BASE_URL, data, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
            } catch (err) {
                const msg = err.response?.data?.message || err.message;
                toast.error(`Staff ${data.staff}: ${msg}`);
            }
        }));

        setShowAttendanceTable(false);
        setAttendance([]);
    };

    const formatDate = (date) => new Date(date).toISOString().slice(0, 10);

    const handleFetchAttendance = async () => {
        setLoading(true);
        const params = [];

        if (filters.type === "Daily" && filters.date) params.push(`date=${filters.date}`);
        if (filters.type === "Weekly" && filters.startDate && filters.endDate) {
            params.push(`start_date=${formatDate(filters.startDate)}`);
            params.push(`end_date=${formatDate(filters.endDate)}`);
        }
        if (filters.type === "Monthly" && filters.month && filters.year) {
            params.push(`month=${filters.month}`);
            params.push(`year=${filters.year}`);
        }
        if (filters.type === "Yearly" && filters.year) params.push(`year=${filters.year}`);
        if (filters.type === "Specific" && filters.staffId) params.push(`staff=${filters.staffId}`);

        const url = `${API_BASE_URL}?${params.join("&")}`;

        try {
            const token = Cookies.get("access_token");
            if (!token) return toast.error("User is not authenticated.");
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAttendanceData(res.data?.data?.results || []);
            setShowReport(true);
        } catch (err) {
            console.error("Error fetching attendance:", err);
            toast.error("Failed to fetch attendance");
        } finally {
            setLoading(false);
        }
    };

    const toggleFilterForm = () => {
        if (showFilterForm) {
            setShowFilterForm(false);
            setShowReport(false);
            setAttendanceData([]);
        } else setShowFilterForm(true);
    };

    const getTeacherName = (staffId) => {
        const teacher = teachers.find((t) => t.user_id === staffId);
        return teacher ? teacher.username : "Unknown";
    };

    const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");

    const canAdd = permissions.includes("users.add_staffattendance");
    const canChange = permissions.includes("users.change_staffattendance");
    const canDelete = permissions.includes("users.delete_staffattendance");
    const canView = permissions.includes("users.view_staffattendance");

    return (
        <div>
            <Toaster position="top-center" />
            <div className="bg-blue-900 text-white py-2 px-8 rounded-lg shadow-md flex justify-between items-center mt-5">
                <h1 className="text-2xl font-bold">Staff Attendance Management</h1>
                <div className="flex gap-4">
                    {canAdd && (
                        <button onClick={handleMarkAttendance} className="bg-cyan-500 hover:bg-cyan-700 text-white px-4 py-2 rounded shadow">
                            + Mark Attendance
                        </button>
                    )}
                    {canView && (
                        <button onClick={toggleFilterForm} className="bg-cyan-500 hover:bg-cyan-700 text-white px-4 py-2 rounded shadow">
                            📥 {showFilterForm ? "Close Report" : "Fetch Attendance"}
                        </button>
                    )}
                </div>

            </div>

            <div className="p-6">
                {canAdd && showAttendanceTable && (
                    <>
                        <table className="w-full mt-4 border shadow bg-white">
                            <thead className="bg-blue-900 text-white">
                                <tr>
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
                                                onChange={(e) => handleAttendanceChange(index, e.target.value)}
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
                        <div className="flex justify-center mt-4">
                            <button onClick={handleSaveAttendance} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700">Save Attendance</button>
                        </div>
                    </>
                )}

                {canView && showFilterForm && (
                    <div className="bg-white shadow-md rounded-md p-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 font-medium">Type:</label>
                                <select name="type" value={filters.type} onChange={handleFilterChange} className="border p-2 rounded-md w-full">
                                    <option value="Daily">Daily</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Yearly">Yearly</option>
                                    <option value="Specific">Specific Staff</option>
                                </select>
                            </div>
                            {filters.type === "Daily" && (
                                <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="border p-2 rounded-md w-full" />
                            )}
                            {filters.type === "Weekly" && (
                                <>
                                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="border p-2 rounded-md w-full" />
                                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="border p-2 rounded-md w-full" />
                                </>
                            )}
                            {filters.type === "Monthly" && (
                                <>
                                    <select name="month" value={filters.month} onChange={handleFilterChange} className="border p-2 rounded-md w-full">
                                        <option value="">Select Month</option>
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i + 1} value={String(i + 1)}>{new Date(0, i).toLocaleString("default", { month: "long" })}</option>
                                        ))}
                                    </select>
                                    <input type="number" name="year" value={filters.year} onChange={handleFilterChange} className="border p-2 rounded-md w-full" />
                                </>
                            )}
                            {filters.type === "Yearly" && (
                                <input type="number" name="year" value={filters.year} onChange={handleFilterChange} className="border p-2 rounded-md w-full" />
                            )}
                            {filters.type === "Specific" && (
                                <select name="staffId" value={filters.staffId} onChange={handleFilterChange} className="border p-2 rounded-md w-full">
                                    <option value="">Select Teacher</option>
                                    {teachers.map(t => (
                                        <option key={t.profile_id} value={t.profile_id}>{t.username}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <button onClick={handleFetchAttendance} className="bg-green-500 text-white px-4 py-2 rounded-md mt-4 hover:bg-green-700">Generate Report</button>
                    </div>
                )}



                {canView && showReport && attendanceData.length > 0 && (
                    <table className="w-full mt-4 border bg-white shadow-md">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="border p-2">ID</th>
                                <th className="border p-2">Teacher</th>
                                <th className="border p-2">Date</th>
                                <th className="border p-2">Status</th>
                                {(canChange || canDelete) &&
                                    <th className="border p-2">Remarks</th>
                                }
                                {(canChange || canDelete) &&
                                    <th className="border p-2">Actions</th>
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {attendanceData.map((item, idx) => (
                                <tr key={item.id}>
                                    <td className="border p-2">{item.staff}</td>
                                    <td className="border p-2">{getTeacherName(item.staff)}</td>
                                    <td className="border p-2">{item.date}</td>
                                    <td className="border p-2">
                                        <select
                                            value={item.status}
                                            onChange={(e) => {
                                                const updated = [...attendanceData];
                                                updated[idx].status = e.target.value;
                                                setAttendanceData(updated);
                                            }}
                                            className="border px-2 py-1 rounded"
                                        >
                                            <option>Present</option>
                                            <option>Late</option>
                                            <option>Absent</option>
                                            <option>Leave</option>
                                            <option>Half-day</option>
                                        </select>
                                    </td>
                                    {(canChange || canDelete) &&
                                        <td className="border p-2">
                                            <input
                                                value={item.remarks || ""}
                                                onChange={(e) => {
                                                    const updated = [...attendanceData];
                                                    updated[idx].remarks = e.target.value;
                                                    setAttendanceData(updated);
                                                }}
                                                className="border px-2 py-1 rounded w-full"
                                                placeholder="Remarks..."
                                            />
                                        </td>
                                    }
                                    {(canChange || canDelete) &&
                                        <td className="border p-2 text-center">
                                            <button
                                                onClick={() => handleEditAttendance(item.id, item.status, item.remarks)}
                                                className="bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded"
                                            >
                                                Update
                                            </button>
                                        </td>
                                    }
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <Buttons />
            </div>
        </div>
    );
};

export default AttendanceStaff;