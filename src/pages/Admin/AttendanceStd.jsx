import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Select from 'react-select';
import Buttons from '../../components/Buttons';
import * as XLSX from 'xlsx';
import Toaster from '../../components/Toaster'; // Import custom Toaster component

const API = import.meta.env.VITE_SERVER_URL ;
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
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showClassSelection, setShowClassSelection] = useState(false);
  const [bulkAttendanceData, setBulkAttendanceData] = useState([]);
  const [showExcelOptions, setShowExcelOptions] = useState(false);
  const [excelData, setExcelData] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [rowSubmitting, setRowSubmitting] = useState({});
  const [rowSubmitted, setRowSubmitted] = useState({});
  const [toaster, setToaster] = useState({ message: "", type: "success" });

  // Responsive helpers
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : true);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const totalPages = Math.ceil(attendanceData.length / pageSize);
  const paginatedData = attendanceData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const [formData, setFormData] = useState({
    student: null,
    student_uuid: '',
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

  // Remarks dropdown options
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

  // Enhanced UUID extraction function
  const getStudentUUID = (student = {}) => {
    const possibleUUIDs = [
      student.std_id,
      student.profile_uuid,
      student.user_uuid,
      student.uuid,
      student.student_uuid,
      student.profile_id,
      student.user_id,
      student.id
    ];
    const uuid = possibleUUIDs.find(id => id != null && id !== '');
    if (!uuid) {
      console.warn('No valid UUID found for student:', student);
    }
    return uuid;
  };

  // Get student display name
  const getStudentDisplayName = (student = {}) => {
    const firstName = student.first_name || '';
    const lastName = student.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || student.username || student.name || student.email || 'Unknown Student';
  };

  // Get student registration number
  const getStudentRegNumber = (student = {}) => {
    return student.registration_no || student.registration_number || student.reg_no || student.student_id || student.std_id || 'N/A';
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    const token = Cookies.get('access_token');
    if (!token) {
      showToast('Not authenticated', 'error');
      return;
    }

    try {
      setIsLoadingSubjects(true);
      const [studentsRes, classesRes, subjectsRes] = await Promise.all([
        axios.get(STUDENTS_API, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${CLASSES_API}?page_size=100`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(SUBJECTS_API, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const studentData = studentsRes.data?.data?.results || [];
      const classData = classesRes.data?.data?.results || [];
      const subjectData = subjectsRes.data?.data?.results || [];

      console.log('Fetched student data:', studentData);

      const validStudents = studentData.filter(student => {
        const uuid = getStudentUUID(student);
        if (!uuid) {
          console.warn('Student without valid UUID:', student);
          return false;
        }
        return true;
      });

      console.log('Valid students after filtering:', validStudents);

      if (validStudents.length < studentData.length) {
        showToast(`${studentData.length - validStudents.length} students excluded due to missing UUID`, 'warning');
      }

      setStudentOptions(validStudents);
      setStudents(validStudents);
      setClassOptions(classData);
      setSubjectOptions(subjectData);
    } catch (err) {
      console.error('Error fetching dropdowns:', err);
      if (err.response?.status === 404 && err.config?.url?.includes(SUBJECTS_API)) {
        showToast('Subjects endpoint not found. Using default subjects.', 'error');
        setSubjectOptions([
          { id: 1, subject_name: 'Mathematics' },
          { id: 2, subject_name: 'English' },
          { id: 3, subject_name: 'Science' }
        ]);
      } else if (err.response?.status === 401) {
        showToast('Unauthorized. Please log in again.', 'error');
      } else {
        showToast('Failed to load dropdown data', 'error');
      }
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setIsLoadingStudents(true);
      const token = Cookies.get('access_token');
      if (!token) {
        showToast('User is not authenticated.', 'error');
        return;
      }
      const response = await axios.get(STUDENTS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const studentData = response.data.data?.results || response.data.data || response.data;
      if (Array.isArray(studentData)) {
        const validStudents = studentData.filter((student) => {
          const uuid = getStudentUUID(student);
          if (!uuid) {
            console.warn(`Student excluded due to missing UUID:`, student);
            return false;
          }
          return true;
        });
        setStudents(validStudents);
        if (validStudents.length === 0 && studentData.length > 0) {
          showToast("No students with valid UUIDs found. Please check the student data.", 'error');
        } else if (validStudents.length < studentData.length) {
          showToast(
            `${studentData.length - validStudents.length} students excluded due to missing UUIDs`,
            'warning'
          );
        }
      } else {
        throw new Error("Unexpected students API response format.");
      }
    } catch (error) {
      console.error("Error fetching students:", error.response || error.message);
      showToast("Failed to fetch students. Please try again.", 'error');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClassFilterChange = async (selectedClass) => {
    const classId = selectedClass?.id || '';
    setFilters(prev => ({ ...prev, classId, studentId: '' }));

    if (classId) {
      try {
        const token = Cookies.get('access_token');
        const res = await axios.get(`${API}classes/${classId}/students/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data?.data?.results || res.data.results || [];
        const validStudents = data.filter(student => {
          const uuid = getStudentUUID(student);
          if (!uuid) {
            console.warn('Filtered student without valid UUID:', student);
            return false;
          }
          return true;
        });
        setFilteredStudents(validStudents);
      } catch (err) {
        console.error('Error fetching filtered students:', err);
        if (err.response?.status === 404) {
          showToast('Class student endpoint not found. Showing all students.', 'error');
          setFilteredStudents(studentOptions);
        } else {
          showToast('Failed to load students for selected class.', 'error');
          setFilteredStudents([]);
        }
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
    if (!showAttendanceForm) {
      setShowAttendanceForm(true);
      setShowClassSelection(true);
      setShowExcelOptions(false);
      setShowAttendanceTable(false);
      setSelectedClass(null);
      setSelectedSubject(null);
      setBulkAttendanceData([]);
      setRowSubmitting({});
      setRowSubmitted({});
      setExcelData([]);
    } else {
      setShowAttendanceForm(false);
      setShowClassSelection(false);
      setShowExcelOptions(false);
      setShowAttendanceTable(false);
      setSelectedClass(null);
      setSelectedSubject(null);
      setBulkAttendanceData([]);
      setRowSubmitting({});
      setRowSubmitted({});
      setExcelData([]);
    }
  };

  const handleClassSubjectSelect = async () => {
    if (!selectedClass || !selectedSubject) {
      showToast('Please select both class and subject', 'error');
      return;
    }

    try {
      setIsLoadingStudents(true);
      await fetchStudents();

      if (students.length === 0) {
        showToast("No valid students found", 'error');
        setBulkAttendanceData([]);
        setShowExcelOptions(false);
        return;
      }

      setShowClassSelection(false);
      setShowExcelOptions(true);
      setShowAttendanceTable(false);
      setBulkAttendanceData(
        students.map((student) => ({
          student: getStudentUUID(student),
          student_info: student,
          subject: selectedSubject?.uuid || selectedSubject?.id || selectedSubject?.subject_id,
          class_schedule: selectedClass.id,
          status: 'Present',
          remarks: '',
        }))
      );
    } catch (error) {
      console.error("Error in class/subject selection:", error);
      showToast("Failed to load students.", 'error');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Excel Export Function with Remarks Dropdown
  const handleExportExcel = () => {
    if (!selectedClass || !selectedSubject || students.length === 0) {
      showToast('Please select class and subject first', 'error');
      return;
    }

    const excelData = students.map((student, index) => ({
      'S.No': index + 1,
      'Registration Number': getStudentRegNumber(student),
      'First Name': student.first_name || '',
      'Last Name': student.last_name || '',
      'Attendance Status': '',
      'Remarks': ''
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();

    // Add dropdown for Remarks column (column F)
    const remarksExcelOptions = ["On Time", "Late Reason", "Absent Reason", "Leave Approved", "Other"];
    ws['!dataValidation'] = [
      {
        type: "list",
        allowBlank: true,
        formula1: `"${remarksExcelOptions.join(",")}"`,
        sqref: `F2:F${students.length + 1}`,
      },
    ];

    // Set column widths
    ws['!cols'] = [
      { width: 8 },  // S.No
      { width: 20 }, // Registration Number
      { width: 15 }, // First Name
      { width: 15 }, // Last Name
      { width: 18 }, // Attendance Status
      { width: 20 }  // Remarks
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    const fileName = `Attendance_${selectedClass.class_name}_${selectedClass.section}_${selectedSubject.subject_name}_${attendanceDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast('Excel file exported successfully', 'success');
  };

  // Excel Import Function
  const handleImportExcel = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log('Imported Excel data:', jsonData);

        const processedData = jsonData.map((row, index) => {
          const regNumber = row['Registration Number'];
          const attendanceStatus = row['Attendance Status']?.toString().toUpperCase();
          const matchingStudent = students.find(student =>
            getStudentRegNumber(student) === regNumber
          );

          if (!matchingStudent) {
            console.warn(`No matching student found for registration number: ${regNumber}`);
            return null;
          }

          const validStatuses = ['P', 'A', 'L', 'PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'HALF-DAY'];
          let status = 'Present';
          if (validStatuses.includes(attendanceStatus)) {
            switch (attendanceStatus) {
              case 'P':
              case 'PRESENT':
                status = 'Present';
                break;
              case 'A':
              case 'ABSENT':
                status = 'Absent';
                break;
              case 'L':
              case 'LATE':
                status = 'Late';
                break;
              case 'LEAVE':
                status = 'Leave';
                break;
              case 'HALF-DAY':
                status = 'Half-day';
                break;
              default:
                status = 'Present';
            }
          }

          const studentUUID = getStudentUUID(matchingStudent);
          const subjectId = selectedSubject?.uuid || selectedSubject?.id || selectedSubject?.subject_id;
          const remarks = remarksOptions.some(opt => opt.value === row['Remarks'])
            ? row['Remarks']
            : '';

          return {
            student: studentUUID,
            student_uuid: studentUUID,
            subject: subjectId,
            class_schedule: selectedClass.id,
            status: status,
            remarks: remarks,
            student_info: matchingStudent,
            originalRow: row
          };
        }).filter(item => item !== null);

        if (processedData.length === 0) {
          showToast('No valid data found in Excel file', 'error');
          return;
        }

        if (processedData.length < jsonData.length) {
          showToast(`${jsonData.length - processedData.length} rows could not be processed`, 'warning');
        }

        setExcelData(processedData);
        setBulkAttendanceData(processedData);
        setShowExcelOptions(false);
        setShowAttendanceTable(true);
        showToast(`${processedData.length} attendance records imported from Excel`, 'success');
      } catch (error) {
        console.error('Error importing Excel file:', error);
        showToast('Failed to import Excel file. Please check the format.', 'error');
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const handleBulkAttendanceChange = (index, field, value) => {
    setBulkAttendanceData(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmitSingle = async (index) => {
    const token = Cookies.get('access_token');
    if (!token) return showToast('Not authenticated', 'error');

    const record = bulkAttendanceData[index];
    const sourceStudent = students[index] || record.student_info || {};
    const studentUUID = record?.student_uuid || record?.student || getStudentUUID(sourceStudent);
    const displayName = getStudentDisplayName(sourceStudent);

    if (!studentUUID) {
      showToast(`Missing student UUID for ${displayName}`, 'error');
      return;
    }

    if (!record?.subject) {
      showToast(`Select subject for ${displayName}`, 'error');
      return;
    }

    const payload = {
      student: studentUUID,
      student_uuid: studentUUID,
      subject: record.subject,
      class_schedule: record.class_schedule,
      status: record.status || 'Present',
      remarks: record.remarks || '',
      date: attendanceDate,
    };

    console.log('Submitting single attendance:', {
      student: displayName,
      uuid: studentUUID,
      payload
    });

    try {
      setRowSubmitting(prev => ({ ...prev, [index]: true }));
      const response = await axios.post(API_BASE_URL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Single submission response:', response.data);
      setRowSubmitted(prev => ({ ...prev, [index]: true }));
      showToast(`Attendance saved for ${displayName}`, 'success');
    } catch (err) {
      console.error('Single submit error:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.response?.data?.detail || 'Unknown error';
      showToast(`Failed to submit for ${displayName}: ${errorMessage}`, 'error');
    } finally {
      setRowSubmitting(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleFetchAttendance = async () => {
    setLoading(true);
    let params = [];
    if (!filters.studentId) {
      showToast('Student required', 'error');
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
        showToast('No attendance records found for selected criteria', 'error');
        setAttendanceData([]);
        setShowReport(false);
      } else {
        setAttendanceData(records);
        setShowReport(true);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      showToast('Fetch failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBulkAttendance = async () => {
    const token = Cookies.get('access_token');
    if (!token) return showToast('Not authenticated', 'error');

    const invalidRecords = bulkAttendanceData.filter(record =>
      !record.subject || !record.student_uuid || !record.student
    );

    if (invalidRecords.length > 0) {
      showToast('Please ensure all students have subject selected and valid UUID', 'error');
      console.warn('Invalid records:', invalidRecords);
      return;
    }

    try {
      setLoading(true);
      const promises = bulkAttendanceData.map((record, idx) => {
        const sourceStudent = students[idx] || record.student_info || {};
        const studentUUID = record.student_uuid || record.student || getStudentUUID(sourceStudent);
        const displayName = getStudentDisplayName(sourceStudent);

        if (!studentUUID) {
          throw new Error(`Missing UUID for student: ${displayName}`);
        }

        const payload = {
          student: studentUUID,
          student_uuid: studentUUID,
          subject: record.subject,
          class_schedule: record.class_schedule,
          status: record.status || 'Present',
          remarks: record.remarks || '',
          date: attendanceDate
        };

        console.log(`Bulk submission for ${displayName}:`, payload);
        return axios.post(API_BASE_URL, payload, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(error => {
          console.error(`Error submitting for ${displayName}:`, error.response?.data);
          throw error;
        });
      });

      await Promise.all(promises);
      showToast('Bulk attendance submitted successfully', 'success');
      setShowAttendanceForm(false);
      setShowAttendanceTable(false);
      setShowClassSelection(false);
      setShowExcelOptions(false);
      setSelectedClass(null);
      setSelectedSubject(null);
      setBulkAttendanceData([]);
      setExcelData([]);
      setRowSubmitting({});
      setRowSubmitted({});
    } catch (err) {
      console.error('Error submitting bulk attendance:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.detail || err.message;
      showToast(`Failed to submit attendance: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canAdd = permissions.includes("users.add_studentattendance");
  const canView = permissions.includes("users.view_studentattendance");

  // react-select responsive styles
  const baseFont = isMobile ? '0.85rem' : '0.95rem';
  const compactFont = isMobile ? '0.75rem' : '0.85rem';
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: isMobile ? '2.25rem' : '2.5rem',
      fontSize: baseFont,
    }),
    menu: (provided) => ({
      ...provided,
      fontSize: baseFont,
      maxHeight: '220px',
      overflowY: 'auto',
    }),
    option: (provided) => ({
      ...provided,
      fontSize: baseFont,
      padding: isMobile ? '0.5rem' : '0.6rem 0.75rem',
    }),
  };
  const tinySelectStyles = {
    ...selectStyles,
    control: (p) => ({
      ...selectStyles.control(p),
      minHeight: isMobile ? '2rem' : '2.25rem',
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
    { value: 5, label: '5' },
    { value: 10, label: '10' },
    { value: 15, label: '15' },
    { value: 20, label: '20' },
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
        <h2 className="text-lg sm:text-xl font-bold text-center md:text-left">Student Attendance</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          {canAdd && (
            <button
              onClick={handleMarkAttendance}
              className="bg-cyan-500 text-white px-4 py-2 rounded-md shadow hover:bg-cyan-700 text-sm sm:text-base"
            >
              {showAttendanceForm ? 'Close Attendance' : 'Mark Attendance'}
            </button>
          )}
          {canView && (
            <button
              onClick={() => setShowFilterForm((prev) => !prev)}
              className="bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-700 text-sm sm:text-base"
            >
              {showFilterForm ? 'Close Report' : 'Fetch Attendance'}
            </button>
          )}
        </div>
      </div>

      {/* Class and Subject Selection */}
      {canAdd && showAttendanceForm && showClassSelection && !showExcelOptions && !showAttendanceTable && (
        <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-md max-w-full md:max-w-4xl mx-auto">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Select Class and Subject for Attendance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
              <Select
                name="class_schedule"
                value={selectedClass}
                onChange={setSelectedClass}
                options={classOptions}
                getOptionLabel={(cls) => `${cls.class_name} - ${cls.section} (${cls.session})`}
                getOptionValue={(cls) => cls.id}
                placeholder="Select Class"
                isClearable
                styles={selectStyles}
                isLoading={isLoadingStudents}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
              <Select
                name="subject"
                value={selectedSubject}
                onChange={setSelectedSubject}
                options={subjectOptions}
                getOptionLabel={(sub) => sub.subject_name || sub.name}
                getOptionValue={(sub) => sub.uuid || sub.id || sub.subject_id}
                placeholder="Select Subject"
                isClearable
                styles={selectStyles}
                isLoading={isLoadingSubjects}
              />
            </div>
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
          <div className="text-right">
            <button
              onClick={handleClassSubjectSelect}
              disabled={!selectedClass || !selectedSubject}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Excel Options */}
      {canAdd && showAttendanceForm && showExcelOptions && !showAttendanceTable && (
        <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-md max-w-full md:max-w-4xl mx-auto">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            Manage Attendance for {selectedClass?.class_name} - {selectedClass?.section} ({selectedSubject?.subject_name})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Export Excel Template</h3>
              <p className="text-sm text-gray-600 mb-3">
                Download an Excel file with all students. Mark attendance manually (P for Present, A for Absent).
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
                Upload the Excel file after marking attendance to automatically populate the form.
              </p>
              <div>
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
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">Manual Entry</h3>
              <p className="text-sm text-gray-600 mb-3">
                Enter attendance manually in a table format.
              </p>
              <button
                onClick={() => {
                  setShowAttendanceTable(true);
                  setShowExcelOptions(false);
                  setExcelData([]);
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm"
              >
                Manual Entry
              </button>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">
              Instructions: Export template → Fill attendance manually → Import back or enter manually → Save attendance
            </p>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      {canAdd && showAttendanceForm && showAttendanceTable && selectedClass && selectedSubject && (
        <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">
              Enter Attendance for {selectedClass.label || `${selectedClass.class_name} - ${selectedClass.section}`} ({selectedSubject.label || selectedSubject.subject_name})
            </h2>
            {excelData.length > 0 && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                Imported from Excel
              </span>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {bulkAttendanceData.map((record, index) => {
              const student = record.student_info || students[index] || {};
              const rowBusy = !!rowSubmitting[index];
              const done = !!rowSubmitted[index];
              const displayName = getStudentDisplayName(student);
              const regNumber = getStudentRegNumber(student);
              const studentUUID = record.student_uuid || record.student || getStudentUUID(student);

              return (
                <div
                  key={studentUUID || index}
                  className="border rounded-lg p-3 shadow-sm"
                >
                  <div className="font-semibold text-gray-800 mb-2">
                    {displayName}
                    <div className="text-xs text-gray-500 font-normal">
                      Reg: {regNumber} | UUID: {studentUUID || 'Missing'}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Status</label>
                      <Select
                        value={{ value: record.status || 'Present', label: record.status || 'Present' }}
                        onChange={(selected) => handleBulkAttendanceChange(index, 'status', selected?.value || 'Present')}
                        options={[
                          { value: 'Present', label: 'Present' },
                          { value: 'Late', label: 'Late' },
                          { value: 'Absent', label: 'Absent' },
                          { value: 'Leave', label: 'Leave' },
                          { value: 'Half-day', label: 'Half-day' },
                        ]}
                        isSearchable={false}
                        styles={tinySelectStyles}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Remarks</label>
                      <Select
                        value={remarksOptions.find((opt) => opt.value === record.remarks) || null}
                        onChange={(selected) => handleBulkAttendanceChange(index, 'remarks', selected?.value || '')}
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
                      disabled={rowBusy || done || !studentUUID}
                      className={`px-4 py-2 rounded text-sm text-white ${
                        !studentUUID
                          ? 'bg-red-600 cursor-not-allowed'
                          : done
                          ? 'bg-green-600 cursor-default'
                          : rowBusy
                          ? 'bg-blue-400 cursor-wait'
                          : 'bg-blue-600 hover:bg-blue-700'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                      title={!studentUUID ? 'Missing UUID' : done ? 'Submitted' : 'Submit this student'}
                    >
                      {!studentUUID ? 'No UUID' : done ? 'Submitted' : rowBusy ? 'Submitting...' : 'Submit'}
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
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">Registration</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">First Name</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">Last Name</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">Status</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">Remarks</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {bulkAttendanceData.map((record, index) => {
                  const student = record.student_info || students[index] || {};
                  const rowBusy = !!rowSubmitting[index];
                  const done = !!rowSubmitted[index];
                  const displayName = getStudentDisplayName(student);
                  const regNumber = getStudentRegNumber(student);
                  const studentUUID = record.student_uuid || record.student || getStudentUUID(student);

                  return (
                    <tr key={studentUUID || index} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-3 text-sm">{index + 1}</td>
                      <td className="border border-gray-200 p-3 text-sm">{regNumber}</td>
                      <td className="border border-gray-200 p-3 text-sm">{student.first_name || ''}</td>
                      <td className="border border-gray-200 p-3 text-sm">{student.last_name || ''}</td>
                      <td className="border border-gray-200 p-3">
                        <Select
                          value={{ value: record.status || 'Present', label: record.status || 'Present' }}
                          onChange={(selected) => handleBulkAttendanceChange(index, 'status', selected?.value || 'Present')}
                          options={[
                            { value: 'Present', label: 'Present' },
                            { value: 'Late', label: 'Late' },
                            { value: 'Absent', label: 'Absent' },
                            { value: 'Leave', label: 'Leave' },
                            { value: 'Half-day', label: 'Half-day' },
                          ]}
                          styles={tinySelectStyles}
                          isSearchable={false}
                        />
                      </td>
                      <td className="border border-gray-200 p-3">
                        <Select
                          value={remarksOptions.find((opt) => opt.value === record.remarks) || null}
                          onChange={(selected) => handleBulkAttendanceChange(index, 'remarks', selected?.value || '')}
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
                          disabled={rowBusy || done || !studentUUID}
                          className={`px-3 py-1.5 rounded text-sm text-white ${
                            !studentUUID
                              ? 'bg-red-600 cursor-not-allowed'
                              : done
                              ? 'bg-green-600 cursor-default'
                              : rowBusy
                              ? 'bg-blue-400 cursor-wait'
                              : 'bg-blue-600 hover:bg-blue-700'
                          } disabled:opacity-60 disabled:cursor-not-allowed`}
                          title={!studentUUID ? 'Missing UUID' : done ? 'Submitted' : 'Submit this row'}
                        >
                          {!studentUUID ? 'No UUID' : done ? 'Submitted' : rowBusy ? 'Submitting...' : 'Submit'}
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
              Total Students: {bulkAttendanceData.length} | Date: {attendanceDate}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAttendanceTable(false);
                  setShowExcelOptions(true);
                  setExcelData([]);
                  setBulkAttendanceData(
                    students.map((student) => ({
                      student: getStudentUUID(student),
                      student_info: student,
                      subject: selectedSubject?.uuid || selectedSubject?.id || selectedSubject?.subject_id,
                      class_schedule: selectedClass.id,
                      status: 'Present',
                      remarks: '',
                    }))
                  );
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
              >
                Back to Options
              </button>
              <button
                onClick={handleSubmitBulkAttendance}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving Attendance...' : 'Save All Attendance'}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
              <Select
                name="studentId"
                value={studentOptions.find(s => {
                  const studentId = s.std_id || s.profile_id || s.id;
                  return studentId === filters.studentId;
                }) || null}
                onChange={(selected) => {
                  const studentId = selected?.std_id || selected?.profile_id || selected?.id || '';
                  setFilters(prev => ({ ...prev, studentId }));
                }}
                options={studentOptions}
                getOptionLabel={(s) => {
                  const displayName = getStudentDisplayName(s);
                  const uuid = getStudentUUID(s);
                  return `${displayName} (${uuid})`;
                }}
                getOptionValue={(s) => s.std_id || s.profile_id || s.id}
                placeholder="-- Select Student --"
                isClearable
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <Select
                name="type"
                value={['Daily', 'Monthly', 'Yearly'].map(v => ({ value: v, label: v })).find(opt => opt.value === filters.type)}
                onChange={(selected) => {
                  setFilters(prev => ({ ...prev, type: selected?.value || 'Daily' }));
                }}
                options={[
                  { value: 'Daily', label: 'Daily' },
                  { value: 'Monthly', label: 'Monthly' },
                  { value: 'Yearly', label: 'Yearly' },
                ]}
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
            data={attendanceData.map((rec, index) => ({
              "Sequence Number": (currentPage - 1) * pageSize + index + 1,
              Date: rec.date,
              Status: rec.status,
            }))}
            columns={[
              { label: "Sequence Number", key: "Sequence Number" },
              { label: "Date", key: "Date" },
              { label: "Status", key: "Status" },
            ]}
            filename="Attendance_Report"
          />
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border mt-4 bg-white shadow text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border p-3 text-left">Sequence Number</th>
                  <th className="border p-3 text-left">Date</th>
                  <th className="border p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((rec, index) => (
                  <tr key={rec.id || index} className="hover:bg-gray-50">
                    <td className="border p-3">{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="border p-3">{rec.date}</td>
                    <td className="border p-3">{rec.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden mt-4 space-y-3">
            {paginatedData.map((rec, index) => (
              <div key={rec.id || index} className="border rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-800">Record #{(currentPage - 1) * pageSize + index + 1}</div>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-1 text-sm">
                  <div><span className="font-medium">Date:</span> {rec.date}</div>
                  <div><span className="font-medium">Status:</span> {rec.status}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-3 sm:gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                Page Size:
              </label>
              <div className="w-28">
                <Select
                  value={pageSizeOptions.find(opt => opt.value === pageSize)}
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
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm hover:bg-gray-400 transition-colors"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                Math.max(0, Math.min(currentPage - 3, totalPages - 5)),
                Math.max(5, Math.min(totalPages, (currentPage - 3) + 5))
              ).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-3 py-1.5 rounded text-xs sm:text-sm transition-colors ${
                    currentPage === p ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

export default AttendanceStd;