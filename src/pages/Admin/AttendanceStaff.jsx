import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Select from "react-select";
import * as XLSX from "xlsx";
import { Buttons } from "../../components";
import Toaster from "../../components/Toaster"; // Import custom Toaster component

const API = import.meta.env.VITE_SERVER_URL;
const API_BASE_URL = `${API}staff-attendance/`;
const TEACHERS_API_URL = `${API}api/auth/users/list_profiles/teacher/`;
const SCHOOLS_API_URL = `${API}api/schools/`;

const AttendanceStaff = () => {
    const [loading, setLoading] = useState(false);
    const [teachers, setTeachers] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [showAttendanceTable, setShowAttendanceTable] = useState(false);
    const [showFilterForm, setShowFilterForm] = useState(false);
    const [showExcelOptions, setShowExcelOptions] = useState(false);
    const [attendanceData, setAttendanceData] = useState([]);
    const [showReport, setShowReport] = useState(false);
    const [schools, setSchools] = useState([]);
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
    const [excelData, setExcelData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [rowSubmitting, setRowSubmitting] = useState({});
    const [rowSubmitted, setRowSubmitted] = useState({});
    const [toaster, setToaster] = useState({ message: "", type: "success" });

    // Responsive helpers
    const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : true);
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const totalPages = Math.ceil(attendanceData.length / pageSize);
    const paginatedData = attendanceData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const [filters, setFilters] = useState({
        type: "Daily",
        school: "",
        date: new Date().toISOString().split("T")[0],
        staffId: "",
        startDate: "",
        endDate: "",
        month: "",
        year: new Date().getFullYear(),
    });

    // Remarks dropdown options (same as Excel export)
    const remarksOptions = [
        { value: "On Time", label: "On Time" },
        { value: "Late Reason", label: "Late Reason" },
        { value: "Absent Reason", label: "Absent Reason" },
        { value: "Leave Approved", label: "Leave Approved" },
        { value: "Other", label: "Other" },
    ];

    // Toast helper
    const showToast = (message, type = "success") => {
        setToaster({ message, type });
    };

    // Fetch teachers and schools
    const fetchDropdowns = async () => {
        const token = Cookies.get("access_token");
        if (!token) {
            showToast("Not authenticated", "error");
            return;
        }

        try {
            setLoading(true);
            const [teachersRes, schoolsRes] = await Promise.all([
                axios.get(TEACHERS_API_URL, { headers: { Authorization: `Bearer ${token}` } }).catch((err) => {
                    console.error("Teacher API error:", err.response?.data || err.message);
                    throw new Error("Failed to fetch teachers");
                }),
                axios.get(`${SCHOOLS_API_URL}?page_size=100`, { headers: { Authorization: `Bearer ${token}` } }).catch((err) => {
                    console.error("Schools API error:", err.response?.data || err.message);
                    throw new Error("Failed to fetch schools");
                }),
            ]);

            const teacherData = teachersRes.data?.data?.results || [];
            const schoolData = schoolsRes.data?.data?.results || [];

            console.log("Fetched teachers:", teacherData);
            console.log("Fetched schools:", schoolData);

            // Map school data to expected format: { id, name }
            const formattedSchools = schoolData.map((school) => ({
                id: school.id,
                name: school.school_name,
            }));

            const validTeachers = teacherData.filter((teacher) => {
                const uuid = getTeacherUUID(teacher);
                if (!uuid) {
                    console.warn("Teacher without valid UUID:", teacher);
                    return false;
                }
                return true;
            });

            if (validTeachers.length < teacherData.length) {
                showToast(`${teacherData.length - validTeachers.length} teachers excluded due to missing UUID`, "warning");
            }

            setTeachers(validTeachers);
            setSchools(formattedSchools);

            // Auto-select the first school if available
            if (formattedSchools.length > 0) {
                setSelectedSchool(formattedSchools[0]);
            } else {
                showToast("No schools available", "error");
            }

            if (validTeachers.length === 0) {
                showToast("No valid teachers found", "error");
            }
        } catch (err) {
            console.error("Error fetching dropdowns:", err);
            showToast(`Failed to load data: ${err.message}`, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDropdowns();
    }, []);

    // Enhanced UUID extraction for teachers
    // Enhanced UUID extraction for teachers
    const getTeacherUUID = (teacher = {}) => {
        // backend expects teacher.user_id specifically
        if (teacher.user_id) return teacher.user_id;

        // fallback for debugging
        const possibleUUIDs = [teacher.profile_id, teacher.uuid, teacher.id];
        const uuid = possibleUUIDs.find((id) => id != null && id !== "");
        if (!uuid) console.warn("No valid UUID found for teacher:", teacher);
        return uuid;
    };


    // Get teacher display name
    const getTeacherDisplayName = (teacher = {}) => {
        const firstName = teacher.first_name || "";
        const lastName = teacher.last_name || "";
        const fullName = `${firstName} ${lastName}`.trim();
        return fullName || teacher.username || teacher.name || teacher.email || "Unknown Teacher";
    };

    // Get teacher registration number
    const getTeacherRegistrationNo = (teacher = {}) => {
        return teacher.registration_no || "N/A";
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditAttendance = async (recordId, updatedStatus, updatedRemarks) => {
        const token = Cookies.get("access_token");
        if (!token) return showToast("User is not authenticated.", "error");

        try {
            await axios.patch(
                `${API_BASE_URL}${recordId}/`,
                { status: updatedStatus, remarks: updatedRemarks },
                { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
            );
            showToast("Attendance updated successfully", "success");
            handleFetchAttendance();
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            showToast(`Update failed: ${msg}`, "error");
        }
    };

    const handleMarkAttendance = () => {
        if (!showExcelOptions && !showAttendanceTable) {
            if (!selectedSchool) {
                showToast("No school selected. Please wait for schools to load.", "error");
                return;
            }
            if (teachers.length === 0) {
                showToast("No teachers available. Please check the teacher data.", "error");
                return;
            }
            setShowExcelOptions(true);
            setShowAttendanceTable(false);
            setAttendance([]);
            setExcelData([]);
            setRowSubmitting({});
            setRowSubmitted({});
        } else {
            setShowExcelOptions(false);
            setShowAttendanceTable(false);
            setAttendance([]);
            setExcelData([]);
            setRowSubmitting({});
            setRowSubmitted({});
        }
    };

    const handlePrepareAttendance = async () => {
        if (!selectedSchool) {
            showToast("Please select a school", "error");
            return;
        }

        try {
            setLoading(true);
            const token = Cookies.get("access_token");
            const res = await axios.get(`${API_BASE_URL}?date=${attendanceDate}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const alreadyMarkedIds = res.data?.data?.results?.map((i) => i.staff) || [];
            // Remove school filter since teacher API doesn't include school field
            const filteredTeachers = teachers.filter(
                (t) => !alreadyMarkedIds.includes(getTeacherUUID(t))
            );

            console.log("Filtered teachers for attendance:", filteredTeachers);

            if (filteredTeachers.length === 0) {
                showToast("No unmarked staff found", "error");
                return;
            }

            const initial = filteredTeachers.map((t) => ({
                staff: getTeacherUUID(t),
                staff_info: t,
                school: selectedSchool.id,
                status: "Present",
                remarks: "",
            }));

            setAttendance(initial);
            setShowExcelOptions(false);
            setShowAttendanceTable(true);
        } catch (err) {
            console.error("Error preparing attendance list:", err);
            showToast("Failed to prepare attendance list", "error");
        } finally {
            setLoading(false);
        }
    };

    // Excel Export Function with Remarks Dropdown
    const handleExportExcel = () => {
        if (!selectedSchool || teachers.length === 0) {
            showToast("Please select a school or ensure teachers are loaded", "error");
            return;
        }

        // Remove school filter since teacher API doesn't include school field
        const filteredTeachers = teachers;
        console.log("Teachers for Excel export:", filteredTeachers);

        const excelData = filteredTeachers.map((teacher, index) => ({
            "Registration Number": getTeacherRegistrationNo(teacher),
            "First Name": teacher.first_name || "",
            "Last Name": teacher.last_name || "",
            "Attendance Status": "",
            "Remarks": "",
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();

        // Add dropdown for Remarks column (column E)
        const remarksExcelOptions = ["On Time", "Late Reason", "Absent Reason", "Leave Approved", "Other"];
        ws["!dataValidation"] = [
            {
                type: "list",
                allowBlank: true,
                formula1: `"${remarksExcelOptions.join(",")}"`,
                sqref: `E2:E${filteredTeachers.length + 1}`,
            },
        ];

        // Set column widths
        ws["!cols"] = [
            { width: 20 }, // Registration Number
            { width: 15 }, // First Name
            { width: 15 }, // Last Name
            { width: 18 }, // Attendance Status
            { width: 20 }, // Remarks
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Staff_Attendance");
        const fileName = `Staff_Attendance_${selectedSchool.name}_${attendanceDate}.xlsx`;
        XLSX.writeFile(wb, fileName);
        showToast("Excel file exported successfully", "success");
    };

    // Excel Import Function
    const handleImportExcel = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                console.log("Imported Excel data:", jsonData);

                const processedData = jsonData
                    .map((row) => {
                        const registrationNo = row["Registration Number"];
                        const attendanceStatus = row["Attendance Status"]?.toString().toUpperCase();
                        const matchingTeacher = teachers.find(
                            (teacher) => getTeacherRegistrationNo(teacher) === registrationNo
                        );

                        if (!matchingTeacher) {
                            console.warn(`No matching teacher found for registration number: ${registrationNo}`);
                            return null;
                        }

                        const validStatuses = ["P", "A", "L", "PRESENT", "ABSENT", "LATE", "LEAVE", "HALF-DAY"];
                        let status = "Present";
                        if (validStatuses.includes(attendanceStatus)) {
                            switch (attendanceStatus) {
                                case "P":
                                case "PRESENT":
                                    status = "Present";
                                    break;
                                case "A":
                                case "ABSENT":
                                    status = "Absent";
                                    break;
                                case "L":
                                case "LATE":
                                    status = "Late";
                                    break;
                                case "LEAVE":
                                    status = "Leave";
                                    break;
                                case "HALF-DAY":
                                    status = "Half-day";
                                    break;
                                default:
                                    status = "Present";
                            }
                        }

                        const teacherUUID = getTeacherUUID(matchingTeacher);
                        return {
                            staff: teacherUUID,
                            staff_info: matchingTeacher,
                            school: selectedSchool.id,
                            status,
                            remarks: row["Remarks"] || "",
                        };
                    })
                    .filter((item) => item !== null);

                if (processedData.length === 0) {
                    showToast("No valid data found in Excel file", "error");
                    return;
                }

                if (processedData.length < jsonData.length) {
                    showToast(`${jsonData.length - processedData.length} rows could not be processed`, "warning");
                }

                setExcelData(processedData);
                setAttendance(processedData);
                setShowExcelOptions(false);
                setShowAttendanceTable(true);
                showToast(`${processedData.length} attendance records imported from Excel`, "success");
            } catch (error) {
                console.error("Error importing Excel file:", error);
                showToast("Failed to import Excel file. Please check the format.", "error");
            }
        };

        reader.readAsArrayBuffer(file);
        event.target.value = "";
    };

    const handleAttendanceChange = (index, field, value) => {
        setAttendance((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
        );
    };

    const handleSubmitSingle = async (index) => {
        const token = Cookies.get("access_token");
        if (!token) return showToast("Not authenticated", "error");

        const record = attendance[index];
        const sourceTeacher = record.staff_info || teachers[index] || {};
        const teacherUUID = record.staff || getTeacherUUID(sourceTeacher);
        const displayName = getTeacherDisplayName(sourceTeacher);

        if (!teacherUUID) {
            showToast(`Missing teacher UUID for ${displayName}`, "error");
            return;
        }

        const payload = {
            staff: teacherUUID,
            status: record.status || "Present",
            date: attendanceDate,
            remarks: record.remarks || "",
        };

        try {
            setRowSubmitting((prev) => ({ ...prev, [index]: true }));
            await axios.post(API_BASE_URL, payload, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });
            setRowSubmitted((prev) => ({ ...prev, [index]: true }));
            showToast(`Attendance saved for ${displayName}`, "success");
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message;
            showToast(`Failed to submit for ${displayName}: ${errorMessage}`, "error");
        } finally {
            setRowSubmitting((prev) => ({ ...prev, [index]: false }));
        }
    };

    const handleSaveAttendance = async () => {
        const token = Cookies.get("access_token");
        if (!token) return showToast("Not authenticated", "error");

        const invalidRecords = attendance.filter((record) => !record.staff);
        if (invalidRecords.length > 0) {
            showToast("Please ensure all staff have valid UUIDs", "error");
            return;
        }

        try {
            setLoading(true);
            const promises = attendance.map((entry) => {
                const teacherUUID = entry.staff || getTeacherUUID(entry.staff_info);
                const displayName = getTeacherDisplayName(entry.staff_info);
                if (!teacherUUID) throw new Error(`Missing UUID for teacher: ${displayName}`);

                return axios.post(
                    API_BASE_URL,
                    {
                        staff: teacherUUID,
                        status: entry.status,
                        date: attendanceDate,
                        remarks: entry.remarks || null,
                    },
                    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
                );
            });

            await Promise.all(promises);
            showToast("Attendance saved successfully", "success");
            setShowAttendanceTable(false);
            setShowExcelOptions(false);
            setAttendance([]);
            setExcelData([]);
            setRowSubmitting({});
            setRowSubmitted({});
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            showToast(`Save failed: ${msg}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleFetchAttendance = async () => {
        setLoading(true);
        const params = [];

        if (filters.type === "Daily" && filters.date) params.push(`date=${filters.date}`);
        if (filters.type === "Weekly" && filters.startDate && filters.endDate) {
            params.push(`start_date=${filters.startDate}`);
            params.push(`end_date=${filters.endDate}`);
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
            const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
            const records = res.data?.data?.results || [];
            if (records.length === 0) {
                showToast("No attendance records found", "error");
                setAttendanceData([]);
                setShowReport(false);
            } else {
                setAttendanceData(records);
                setShowReport(true);
            }
        } catch (err) {
            console.error("Error fetching attendance:", err);
            showToast("Failed to fetch attendance", "error");
        } finally {
            setLoading(false);
        }
    };

    const getTeacherName = (staffId) => {
        const teacher = teachers.find((t) => getTeacherUUID(t) === staffId);
        return teacher ? getTeacherDisplayName(teacher) : "Unknown";
    };

    const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
    const canAdd = permissions.includes("users.add_staffattendance");
    const canChange = permissions.includes("users.change_staffattendance");
    const canView = permissions.includes("users.view_staffattendance");
    const canDelete = permissions.includes("users.delete_staffattendance"); // Note: canDelete is defined but not used

    // react-select responsive styles
    const baseFont = isMobile ? "0.85rem" : "0.95rem";
    const compactFont = isMobile ? "0.75rem" : "0.85rem";
    const selectStyles = {
        control: (provided) => ({
            ...provided,
            minHeight: isMobile ? "2.25rem" : "2.5rem",
            fontSize: baseFont,
        }),
        menu: (provided) => ({
            ...provided,
            fontSize: baseFont,
            maxHeight: "220px",
            overflowY: "auto",
        }),
        option: (provided) => ({
            ...provided,
            fontSize: baseFont,
            padding: isMobile ? "0.5rem" : "0.6rem 0.75rem",
        }),
    };
    const tinySelectStyles = {
        ...selectStyles,
        control: (p) => ({
            ...selectStyles.control(p),
            minHeight: isMobile ? "2rem" : "2.25rem",
            fontSize: compactFont,
        }),
        option: (p) => ({
            ...selectStyles.option(p),
            fontSize: compactFont,
        }),
        menu: (p) => ({
            ...selectStyles.menu(p),
            fontSize: compactFont,
        }),
    };

    const pageSizeOptions = [
        { value: 5, label: "5" },
        { value: 10, label: "10" },
        { value: 15, label: "15" },
        { value: 20, label: "20" },
    ];

    return (
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
            <Toaster
                message={toaster.message}
                type={toaster.type}
                duration={3000}
                onClose={() => setToaster({ message: "", type: "success" })}
            />
            <div className="bg-blue-900 text-white py-3 px-4 sm:px-6 rounded-lg shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-center md:text-left">Staff Attendance</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                    {canAdd && (
                        <button
                            onClick={handleMarkAttendance}
                            className="bg-cyan-500 text-white px-4 py-2 rounded-md shadow hover:bg-cyan-700 text-sm sm:text-base"
                        >
                            {showExcelOptions || showAttendanceTable ? "Close Attendance" : "Mark Attendance"}
                        </button>
                    )}
                    {canView && (
                        <button
                            onClick={() => setShowFilterForm((prev) => !prev)}
                            className="bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-700 text-sm sm:text-base"
                        >
                            {showFilterForm ? "Close Report" : "Fetch Attendance"}
                        </button>
                    )}
                </div>
            </div>

            {/* Excel Options */}
            {canAdd && showExcelOptions && !showAttendanceTable && (
                <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-md max-w-full md:max-w-4xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <h2 className="text-lg sm:text-xl font-semibold">
                            Manage Attendance for {selectedSchool?.name}
                        </h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Attendance Date</label>
                            <input
                                type="date"
                                value={attendanceDate}
                                onChange={(e) => setAttendanceDate(e.target.value)}
                                className="w-full border border-gray-300 p-2 rounded-md text-sm"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-blue-800 mb-2">Export Excel Template</h3>
                            <p className="text-sm text-gray-600 mb-3">
                                Download an Excel file with all staff. Mark attendance manually (P for Present, A for Absent).
                            </p>
                            <button
                                onClick={handleExportExcel}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                            >
                                Export Excel Template
                            </button>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-orange-800 mb-2">Import Filled Excel</h3>
                            <p className="text-sm text-gray-600 mb-3">
                                Upload the Excel file after marking attendance to populate the form.
                            </p>
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleImportExcel}
                                className="hidden"
                                id="excel-import"
                            />
                            <label
                                htmlFor="excel-import"
                                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 cursor-pointer text-sm inline-block"
                            >
                                Import Excel File
                            </label>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-purple-800 mb-2">Manual Entry</h3>
                            <p className="text-sm text-gray-600 mb-3">
                                Enter attendance manually in a table format.
                            </p>
                            <button
                                onClick={handlePrepareAttendance}
                                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm"
                            >
                                Manual Entry
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Attendance Table */}
            {canAdd && showAttendanceTable && selectedSchool && (
                <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg sm:text-xl font-semibold">
                            Enter Attendance for {selectedSchool.name} (Date: {attendanceDate})
                        </h2>
                        {excelData.length > 0 && (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                Imported from Excel
                            </span>
                        )}
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {attendance.map((record, index) => {
                            const teacher = record.staff_info || teachers[index] || {};
                            const rowBusy = !!rowSubmitting[index];
                            const done = !!rowSubmitted[index];
                            const displayName = getTeacherDisplayName(teacher);
                            const registrationNo = getTeacherRegistrationNo(teacher);
                            const teacherUUID = record.staff || getTeacherUUID(teacher);

                            return (
                                <div key={teacherUUID || index} className="border rounded-lg p-3 shadow-sm">
                                    <div className="font-semibold text-gray-800 mb-2">
                                        {displayName}
                                        <div className="text-xs text-gray-500 font-normal">
                                            Registration No: {registrationNo} | UUID: {teacherUUID || "Missing"}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Status</label>
                                            <Select
                                                value={{ value: record.status || "Present", label: record.status || "Present" }}
                                                onChange={(selected) => handleAttendanceChange(index, "status", selected?.value || "Present")}
                                                options={[
                                                    { value: "Present", label: "Present" },
                                                    { value: "Late", label: "Late" },
                                                    { value: "Absent", label: "Absent" },
                                                    { value: "Leave", label: "Leave" },
                                                    { value: "Half-day", label: "Half-day" },
                                                ]}
                                                isSearchable={false}
                                                styles={tinySelectStyles}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">Remarks</label>
                                            <Select
                                                value={remarksOptions.find((opt) => opt.value === record.remarks) || null}
                                                onChange={(selected) => handleAttendanceChange(index, "remarks", selected?.value || "")}
                                                options={remarksOptions}
                                                placeholder="Select remark"
                                                isClearable
                                                isSearchable={false}
                                                styles={tinySelectStyles}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            onClick={() => handleSubmitSingle(index)}
                                            disabled={rowBusy || done || !teacherUUID}
                                            className={`px-4 py-2 rounded text-sm text-white ${!teacherUUID
                                                ? "bg-red-600 cursor-not-allowed"
                                                : done
                                                    ? "bg-green-600 cursor-default"
                                                    : rowBusy
                                                        ? "bg-blue-400 cursor-wait"
                                                        : "bg-blue-600 hover:bg-blue-700"
                                                } disabled:opacity-60 disabled:cursor-not-allowed`}
                                            title={!teacherUUID ? "Missing UUID" : done ? "Submitted" : "Submit this staff"}
                                        >
                                            {!teacherUUID ? "No UUID" : done ? "Submitted" : rowBusy ? "Submitting..." : "Submit"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full border border-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border border-gray-200 p-3 text-left text-sm font-medium">S.No</th>
                                    <th className="border border-gray-200 p-3 text-left text-sm font-medium">Registration Number</th>
                                    <th className="border border-gray-200 p-3 text-left text-sm font-medium">First Name</th>
                                    <th className="border border-gray-200 p-3 text-left text-sm font-medium">Last Name</th>
                                    <th className="border border-gray-200 p-3 text-left text-sm font-medium">Status</th>
                                    <th className="border border-gray-200 p-3 text-left text-sm font-medium">Remarks</th>
                                    <th className="border border-gray-200 p-3 text-left text-sm font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.map((record, index) => {
                                    const teacher = record.staff_info || teachers[index] || {};
                                    const rowBusy = !!rowSubmitting[index];
                                    const done = !!rowSubmitted[index];
                                    const displayName = getTeacherDisplayName(teacher);
                                    const registrationNo = getTeacherRegistrationNo(teacher);
                                    const teacherUUID = record.staff || getTeacherUUID(teacher);

                                    return (
                                        <tr key={teacherUUID || index} className="hover:bg-gray-50">
                                            <td className="border border-gray-200 p-3 text-sm">{index + 1}</td>
                                            <td className="border border-gray-200 p-3 text-sm">{registrationNo}</td>
                                            <td className="border border-gray-200 p-3 text-sm">{teacher.first_name || ""}</td>
                                            <td className="border border-gray-200 p-3 text-sm">{teacher.last_name || ""}</td>
                                            <td className="border border-gray-200 p-3">
                                                <Select
                                                    value={{ value: record.status || "Present", label: record.status || "Present" }}
                                                    onChange={(selected) => handleAttendanceChange(index, "status", selected?.value || "Present")}
                                                    options={[
                                                        { value: "Present", label: "Present" },
                                                        { value: "Late", label: "Late" },
                                                        { value: "Absent", label: "Absent" },
                                                        { value: "Leave", label: "Leave" },
                                                        { value: "Half-day", label: "Half-day" },
                                                    ]}
                                                    styles={tinySelectStyles}
                                                    isSearchable={false}
                                                />
                                            </td>
                                            <td className="border border-gray-200 p-3">
                                                <Select
                                                    value={remarksOptions.find((opt) => opt.value === record.remarks) || null}
                                                    onChange={(selected) => handleAttendanceChange(index, "remarks", selected?.value || "")}
                                                    options={remarksOptions}
                                                    placeholder="Select remark"
                                                    isClearable
                                                    isSearchable={false}
                                                    styles={tinySelectStyles}
                                                />
                                            </td>
                                            <td className="border border-gray-200 p-3">
                                                <button
                                                    onClick={() => handleSubmitSingle(index)}
                                                    disabled={rowBusy || done || !teacherUUID}
                                                    className={`px-3 py-1.5 rounded text-sm text-white ${!teacherUUID
                                                        ? "bg-red-600 cursor-not-allowed"
                                                        : done
                                                            ? "bg-green-600 cursor-default"
                                                            : rowBusy
                                                                ? "bg-blue-400 cursor-wait"
                                                                : "bg-blue-600 hover:bg-blue-700"
                                                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                                                    title={!teacherUUID ? "Missing UUID" : done ? "Submitted" : "Submit this row"}
                                                >
                                                    {!teacherUUID ? "No UUID" : done ? "Submitted" : rowBusy ? "Submitting..." : "Submit"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-center">
                        <div className="text-sm text-gray-600">
                            Total Staff: {attendance.length} | Date: {attendanceDate}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowAttendanceTable(false);
                                    setShowExcelOptions(true);
                                    setExcelData([]);
                                }}
                                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
                            >
                                Back to Options
                            </button>
                            <button
                                onClick={handleSaveAttendance}
                                disabled={loading}
                                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Saving Attendance..." : "Save All Attendance"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Filters */}
            {canView && showFilterForm && (
                <div className="bg-white mt-6 p-4 sm:p-6 rounded-lg shadow-md max-w-full md:max-w-4xl mx-auto border border-gray-200">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Generate Attendance Report</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Staff</label>
                            <Select
                                name="staffId"
                                value={teachers.find((t) => getTeacherUUID(t) === filters.staffId) || null}
                                onChange={(selected) => setFilters((prev) => ({ ...prev, staffId: selected ? getTeacherUUID(selected) : "" }))}
                                options={teachers}
                                getOptionLabel={(t) => getTeacherDisplayName(t)}
                                getOptionValue={(t) => getTeacherUUID(t)}
                                placeholder="Select Staff"
                                isClearable
                                styles={selectStyles}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                            <Select
                                name="type"
                                value={["Daily", "Weekly", "Monthly", "Yearly", "Specific"].map((v) => ({ value: v, label: v })).find(
                                    (opt) => opt.value === filters.type
                                )}
                                onChange={(selected) => setFilters((prev) => ({ ...prev, type: selected?.value || "Daily" }))}
                                options={[
                                    { value: "Daily", label: "Daily" },
                                    { value: "Weekly", label: "Weekly" },
                                    { value: "Monthly", label: "Monthly" },
                                    { value: "Yearly", label: "Yearly" },
                                    { value: "Specific", label: "Specific Staff" },
                                ]}
                                placeholder="Select Report Type"
                                styles={selectStyles}
                                isSearchable={false}
                            />
                        </div>
                        {filters.type === "Daily" && (
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
                        {filters.type === "Weekly" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={filters.startDate}
                                        onChange={handleFilterChange}
                                        className="w-full border border-gray-300 p-2 sm:p-3 rounded-md text-sm sm:text-base"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={filters.endDate}
                                        onChange={handleFilterChange}
                                        className="w-full border border-gray-300 p-2 sm:p-3 rounded-md text-sm sm:text-base"
                                    />
                                </div>
                            </div>
                        )}
                        {filters.type === "Monthly" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                                    <Select
                                        name="month"
                                        value={{
                                            value: filters.month,
                                            label: filters.month
                                                ? new Date(0, filters.month - 1).toLocaleString("default", { month: "long" })
                                                : "Select Month",
                                        }}
                                        onChange={(selected) => handleFilterChange({ target: { name: "month", value: selected?.value || "" } })}
                                        options={[...Array(12)].map((_, i) => ({
                                            value: String(i + 1),
                                            label: new Date(0, i).toLocaleString("default", { month: "long" }),
                                        }))}
                                        placeholder="Select Month"
                                        isClearable
                                        styles={selectStyles}
                                    />
                                </div>
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
                            </div>
                        )}
                        {filters.type === "Yearly" && (
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
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 shadow text-sm sm:text-base"
                        >
                            Generate Report
                        </button>
                    </div>
                </div>
            )}

            {/* Report Table */}
            {canView && showReport && attendanceData.length > 0 && (
                <div className="p-4 sm:p-6">
                    <Buttons
                        data={attendanceData.map((item, index) => ({
                            "S.No.": (currentPage - 1) * pageSize + index + 1,
                            // ID: item.staff,
                            Date: item.date,
                            Status: item.status,
                            Remarks: item.remarks || "—",
                        }))}
                        columns={[
                            { label: "S.No.", key: "S.No." },
                            // { label: "ID", key: "ID" },
                            { label: "Date", key: "Date" },
                            { label: "Status", key: "Status" },
                            { label: "Remarks", key: "Remarks" },
                        ]}
                        filename="Staff_Attendance_Report"
                    />

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full border mt-4 bg-white shadow text-sm">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="border p-3 text-left">S.No.</th>
                                    <th className="border p-3 text-left">Date</th>
                                    <th className="border p-3 text-left">Status</th>
                                    {(canChange || canDelete) && <th className="border p-3 text-left">Remarks</th>}
                                    {(canChange || canDelete) && <th className="border p-3 text-left">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="border p-3">{(currentPage - 1) * pageSize + idx + 1}</td>
                                        <td className="border p-3">{item.date}</td>
                                        <td className="border p-3">
                                            <select
                                                value={item.status}
                                                onChange={(e) => {
                                                    const updated = [...attendanceData];
                                                    updated[idx].status = e.target.value;
                                                    setAttendanceData(updated);
                                                }}
                                                className="border px-2 py-1 rounded text-sm"
                                            >
                                                <option>Present</option>
                                                <option>Late</option>
                                                <option>Absent</option>
                                                <option>Leave</option>
                                                <option>Half-day</option>
                                            </select>
                                        </td>
                                        {(canChange || canDelete) && (
                                            <td className="border p-3">
                                                <input
                                                    value={item.remarks || ""}
                                                    onChange={(e) => {
                                                        const updated = [...attendanceData];
                                                        updated[idx].remarks = e.target.value;
                                                        setAttendanceData(updated);
                                                    }}
                                                    className="border px-2 py-1 rounded w-full text-sm"
                                                    placeholder="Remarks..."
                                                />
                                            </td>
                                        )}
                                        {(canChange || canDelete) && (
                                            <td className="border p-3 text-center">
                                                <button
                                                    onClick={() => handleEditAttendance(item.id, item.status, item.remarks)}
                                                    className="bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm"
                                                >
                                                    Update
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden mt-4 space-y-3">
                        {paginatedData.map((item, idx) => (
                            <div key={item.id || idx} className="border rounded-lg p-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="font-semibold text-gray-800">Record #{(currentPage - 1) * pageSize + idx + 1}</div>
                                </div>
                                <div className="mt-2 grid grid-cols-1 gap-1 text-sm">
                                    <div><span className="font-medium">ID:</span> {item.staff}</div>
                                    <div><span className="font-medium">Date:</span> {item.date}</div>
                                    <div><span className="font-medium">Status:</span> {item.status}</div>
                                    {(canChange || canDelete) && (
                                        <div>
                                            <span className="font-medium">Remarks:</span> {item.remarks || "—"}
                                        </div>
                                    )}
                                </div>
                                {(canChange || canDelete) && (
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            onClick={() => handleEditAttendance(item.id, item.status, item.remarks)}
                                            className="bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm"
                                        >
                                            Update
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                                Page Size:
                            </label>
                            <div className="w-28">
                                <Select
                                    value={pageSizeOptions.find((opt) => opt.value === pageSize)}
                                    onChange={(selected) => {
                                        setPageSize(selected?.value || 10);
                                        setCurrentPage(1);
                                    }}
                                    options={pageSizeOptions}
                                    styles={tinySelectStyles}
                                    isSearchable={false}
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-center sm:justify-end gap-1 sm:gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm hover:bg-gray-400 transition-colors"
                            >
                                Prev
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .slice(Math.max(0, Math.min(currentPage - 3, totalPages - 5)), Math.max(5, Math.min(totalPages, currentPage - 3 + 5)))
                                .map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(p)}
                                        className={`px-3 py-1.5 rounded text-xs sm:text-sm transition-colors ${currentPage === p ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 hover:bg-gray-300"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm hover:bg-gray-400 transition-colors"
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

export default AttendanceStaff;