import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import Cookies from 'js-cookie';
import Select from 'react-select';
import Buttons from '../../components/Buttons';
import * as XLSX from 'xlsx';

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
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showClassSelection, setShowClassSelection] = useState(false);
  const [bulkAttendanceData, setBulkAttendanceData] = useState([]);

  // New states for Excel functionality
  const [showExcelOptions, setShowExcelOptions] = useState(false);
  const [excelData, setExcelData] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  // responsive helpers
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
  const [rowSubmitting, setRowSubmitting] = useState({});
  const [rowSubmitted, setRowSubmitted] = useState({});

  // Enhanced UUID extraction function with better fallback logic
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

  // Enhanced function to get student display name
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
      toast.error('Not authenticated');
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
        toast.warning(`${studentData.length - validStudents.length} students excluded due to missing UUID`);
      }

      setStudentOptions(validStudents);
      setStudents(validStudents);
      setClassOptions(classData);
      setSubjectOptions(subjectData);
    } catch (err) {
      console.error('Error fetching dropdowns:', err);
      if (err.response?.status === 404 && err.config?.url?.includes(SUBJECTS_API)) {
        toast.error('Subjects endpoint not found. Using default subjects.');
        setSubjectOptions([
          { id: 1, subject_name: 'Mathematics' },
          { id: 2, subject_name: 'English' },
          { id: 3, subject_name: 'Science' }
        ]);
      } else if (err.response?.status === 401) {
        toast.error('Unauthorized. Please log in again.');
      } else {
        toast.error('Failed to load dropdown data');
      }
    } finally {
      setIsLoadingSubjects(false);
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
          toast.error('Class student endpoint not found. Showing all students.');
          setFilteredStudents(studentOptions);
        } else {
          toast.error('Failed to load students for selected class.');
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
      setShowClassSelection(true);
      setShowAttendanceForm(true);
      setShowAttendanceTable(false);
      setSelectedClass(null);
      setSelectedSubject(null);
      setBulkAttendanceData([]);
      setRowSubmitting({});
      setRowSubmitted({});
      setShowExcelOptions(false);
      setExcelData([]);
    } else {
      setShowClassSelection(false);
      setShowAttendanceForm(false);
      setShowAttendanceTable(false);
      setSelectedClass(null);
      setSelectedSubject(null);
      setBulkAttendanceData([]);
      setRowSubmitting({});
      setRowSubmitted({});
      setShowExcelOptions(false);
      setExcelData([]);
    }
  };

  const handleClassSubjectSelect = async () => {
    if (!selectedClass || !selectedSubject) {
      toast.error('Please select both class and subject');
      return;
    }

    setIsLoadingStudents(true);

    try {
      const token = Cookies.get('access_token');
      const res = await axios.get(`${API}classes/${selectedClass.id}/students/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.data?.results || res.data.results || [];

      const validStudents = data.filter(student => {
        const uuid = getStudentUUID(student);
        if (!uuid) {
          console.warn('Student in class without valid UUID:', student);
          return false;
        }
        return true;
      });

      if (validStudents.length === 0) {
        toast.error('No valid students found in this class');
        setStudents([]);
        setBulkAttendanceData([]);
        setShowExcelOptions(false);
        return;
      }

      if (validStudents.length < data.length) {
        toast.warning(`${data.length - validStudents.length} students excluded due to missing UUID`);
      }

      setStudents(validStudents);
      setShowExcelOptions(true);
      setShowAttendanceTable(false);

    } catch (err) {
      console.error('Error fetching students for class:', err);
      if (err.response?.status === 404) {
        toast.error('Class student endpoint not found. Showing all students.');
        const validStudents = studentOptions.filter(student => getStudentUUID(student));
        setStudents(validStudents);
        setShowExcelOptions(true);
      } else {
        toast.error('Failed to load students for selected class.');
        setStudents([]);
      }
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Excel Export Function
  const handleExportExcel = () => {
    if (!selectedClass || !selectedSubject || students.length === 0) {
      toast.error('Please select class and subject first');
      return;
    }

    const excelData = students.map((student, index) => ({
      'S.No': index + 1,
      'Registration Number': getStudentRegNumber(student),
      'First Name': student.first_name || '', // Ensure first_name is accessed
      'Last Name': student.last_name || '',   // Ensure last_name is accessed
      'Attendance Status': '', // Default to Present
      'Remarks': ''
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();

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

    toast.success('Excel file exported successfully');
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

        // Validate and process the imported data
        const processedData = jsonData.map((row, index) => {
          const regNumber = row['Registration Number'];
          const attendanceStatus = row['Attendance Status']?.toString().toUpperCase();

          // Find matching student by registration number
          const matchingStudent = students.find(student =>
            getStudentRegNumber(student) === regNumber
          );

          if (!matchingStudent) {
            console.warn(`No matching student found for registration number: ${regNumber}`);
            return null;
          }

          // Validate attendance status
          const validStatuses = ['P', 'A', 'L', 'PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'HALF-DAY'];
          let status = 'Present'; // default

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

          return {
            student: studentUUID,
            student_uuid: studentUUID,
            subject: subjectId,
            class_schedule: selectedClass.id,
            status: status,
            remarks: row['Remarks'] || '',
            student_info: matchingStudent,
            originalRow: row
          };
        }).filter(item => item !== null);

        if (processedData.length === 0) {
          toast.error('No valid data found in Excel file');
          return;
        }

        if (processedData.length < jsonData.length) {
          toast.warning(`${jsonData.length - processedData.length} rows could not be processed`);
        }

        setExcelData(processedData);
        setBulkAttendanceData(processedData);
        setShowAttendanceTable(true);
        toast.success(`${processedData.length} attendance records imported from Excel`);

      } catch (error) {
        console.error('Error importing Excel file:', error);
        toast.error('Failed to import Excel file. Please check the format.');
      }
    };

    reader.readAsArrayBuffer(file);
    // Clear the file input
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
    if (!token) return toast.error('Not authenticated');

    const record = bulkAttendanceData[index];
    const sourceStudent = students[index] || record.student_info || {};

    const studentUUID = record?.student_uuid || record?.student || getStudentUUID(sourceStudent);
    const displayName = getStudentDisplayName(sourceStudent);

    if (!studentUUID) {
      toast.error(`Missing student UUID for ${displayName}`);
      return;
    }

    if (!record?.subject) {
      toast.error(`Select subject for ${displayName}`);
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
      toast.success(`Attendance saved for ${displayName}`);
    } catch (err) {
      console.error('Single submit error:', err);
      console.error('Error response:', err.response?.data);

      const errorMessage = err.response?.data?.message || err.response?.data?.detail || 'Unknown error';
      toast.error(`Failed to submit for ${displayName}: ${errorMessage}`);
    } finally {
      setRowSubmitting(prev => ({ ...prev, [index]: false }));
    }
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
      console.error('Error fetching attendance:', err);
      toast.error('Fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBulkAttendance = async () => {
    const token = Cookies.get('access_token');
    if (!token) return toast.error('Not authenticated');

    const invalidRecords = bulkAttendanceData.filter(record =>
      !record.subject || !record.student_uuid || !record.student
    );

    if (invalidRecords.length > 0) {
      toast.error('Please ensure all students have subject selected and valid UUID');
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
      toast.success('Bulk attendance submitted successfully');

      // Reset form
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
      toast.error(`Failed to submit attendance: ${errorMessage}`);
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
    option: (provided, state) => ({
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
      <Toaster position="top-center" />
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
      {canAdd && showAttendanceForm && showClassSelection && (
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
      {canAdd && showAttendanceForm && showExcelOptions && (
        <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-md max-w-full md:max-w-4xl mx-auto">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            Excel Attendance for {selectedClass?.class_name} - {selectedClass?.section} ({selectedSubject?.subject_name})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Step 1: Export Excel Template</h3>
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
              <h3 className="font-semibold text-orange-800 mb-2">Step 2: Import Filled Excel</h3>
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
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">
              Instructions: Export template → Fill attendance manually → Import back → Save attendance
            </p>
          </div>
        </div>
      )}

      {/* Attendance Table (from imported Excel or manual entry) */}
      {canAdd && showAttendanceForm && showAttendanceTable && selectedClass && selectedSubject && (
        <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">
              Review Attendance for {selectedClass.class_name} - {selectedClass.section} ({selectedSubject.subject_name})
            </h2>
            {excelData.length > 0 && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                Imported from Excel
              </span>
            )}
          </div>

          {/* Cards (mobile) */}
          <div className="md:hidden space-y-3">
            {bulkAttendanceData.map((record, index) => {
              const student = record.student_info || students[index] || {};
              const rowBusy = !!rowSubmitting[index];
              const done = !!rowSubmitted[index];
              const displayName = getStudentDisplayName(student);
              const regNumber = getStudentRegNumber(student);
              const studentUUID = record.student_uuid || getStudentUUID(student);

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
                        onChange={(selected) => {
                          handleBulkAttendanceChange(index, 'status', selected?.value || 'Present');
                        }}
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
                        value={{ value: record.remarks || '', label: record.remarks || 'Select Remark' }}
                        onChange={(selected) => {
                          handleBulkAttendanceChange(index, 'remarks', selected?.value || '');
                        }}
                        options={[
                          { value: 'Present', label: 'Present' },
                          { value: 'Absent', label: 'Absent' },
                          { value: 'Late', label: 'Late' },
                          { value: 'Leave', label: 'Leave' },
                          { value: 'Half-day', label: 'Half-day' },
                        ]}
                        isSearchable={false}
                        styles={tinySelectStyles}
                        placeholder="Select Remark"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleSubmitSingle(index)}
                      disabled={rowBusy || done || !studentUUID}
                      className={`px-4 py-2 rounded text-sm text-white ${!studentUUID
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

          {/* Table (desktop) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">S.No</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">Registration</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">Student Name</th>
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
                  const studentUUID = record.student_uuid || getStudentUUID(student);

                  return (
                    <tr key={studentUUID || index} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-3 text-sm">
                        {index + 1}
                      </td>
                      <td className="border border-gray-200 p-3 text-sm">
                        {regNumber}
                      </td>
                      <td className="border border-gray-200 p-3 text-sm">
                        {displayName}
                      </td>
                      <td className="border border-gray-200 p-3">
                        <Select
                          value={{ value: record.status || 'Present', label: record.status || 'Present' }}
                          onChange={(selected) => {
                            handleBulkAttendanceChange(index, 'status', selected?.value || 'Present');
                          }}
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
                          value={{ value: record.remarks || '', label: record.remarks || 'Select Remark' }}
                          onChange={(selected) => {
                            handleBulkAttendanceChange(index, 'remarks', selected?.value || '');
                          }}
                          options={[
                            { value: 'Present', label: 'Present' },
                            { value: 'Absent', label: 'Absent' },
                            { value: 'Late', label: 'Late' },
                            { value: 'Leave', label: 'Leave' },
                            { value: 'Half-day', label: 'Half-day' },
                          ]}
                          styles={tinySelectStyles}
                          isSearchable={false}
                          placeholder="Select Remark"
                        />
                      </td>
                      <td className="border border-gray-200 p-3">
                        <button
                          onClick={() => handleSubmitSingle(index)}
                          disabled={rowBusy || done || !studentUUID}
                          className={`px-3 py-1.5 rounded text-sm text-white ${!studentUUID
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
                  setExcelData([]);
                  setBulkAttendanceData([]);
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
              ...rec,
              sequence: (currentPage - 1) * pageSize + index + 1
            }))}
            columns={[
              { label: "S.No", key: "sequence" },
              { label: "Student", key: "student" },
              { label: "Date", key: "date" },
              { label: "Status", key: "status" },
            ]}
            filename="Attendance_Report"
          />

          {/* desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border mt-4 bg-white shadow text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border p-3 text-left">S.No</th>
                  <th className="border p-3 text-left">Student</th>
                  <th className="border p-3 text-left">Date</th>
                  <th className="border p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((rec, index) => (
                  <tr key={rec.id} className="hover:bg-gray-50">
                    <td className="border p-3">{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="border p-3">{rec.student}</td>
                    <td className="border p-3">{rec.date}</td>
                    <td className="border p-3">{rec.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* mobile cards */}
          <div className="md:hidden mt-4 space-y-3">
            {paginatedData.map((rec, index) => (
              <div key={rec.id || index} className="border rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-800">{rec.student}</div>
                  <div className="text-xs text-gray-500">#{(currentPage - 1) * pageSize + index + 1}</div>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-1 text-sm">
                  <div><span className="font-medium">Date:</span> {rec.date}</div>
                  <div><span className="font-medium">Status:</span> {rec.status}</div>
                </div>
              </div>
            ))}
          </div>

          {/* pagination controls */}
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
                  className={`px-3 py-1.5 rounded text-xs sm:text-sm transition-colors ${currentPage === p ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 hover:bg-gray-300"
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