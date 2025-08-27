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
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showClassSelection, setShowClassSelection] = useState(false);
  const [bulkAttendanceData, setBulkAttendanceData] = useState([]);

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
    // Priority order for UUID extraction - updated to include std_id
    const possibleUUIDs = [
      student.std_id,        // Added for your API response structure
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

      console.log('Fetched student data:', studentData); // Debug log

      // Validate students have UUIDs
      const validStudents = studentData.filter(student => {
        const uuid = getStudentUUID(student);
        if (!uuid) {
          console.warn('Student without valid UUID:', student);
          return false;
        }
        return true;
      });

      console.log('Valid students after filtering:', validStudents); // Debug log

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
        
        // Validate filtered students have UUIDs
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
      setBulkAttendanceData([]);
      setRowSubmitting({});
      setRowSubmitted({});
    } else {
      setShowClassSelection(false);
      setShowAttendanceForm(false);
      setShowAttendanceTable(false);
      setSelectedClass(null);
      setBulkAttendanceData([]);
      setRowSubmitting({});
      setRowSubmitted({});
    }
  };

  const handleClassSelect = async (selectedClass) => {
    if (!selectedClass) {
      setShowAttendanceTable(false);
      setStudents([]);
      setBulkAttendanceData([]);
      setSelectedClass(null);
      setRowSubmitting({});
      setRowSubmitted({});
      return;
    }

    setSelectedClass(selectedClass);
    setIsLoadingStudents(true);

    try {
      const token = Cookies.get('access_token');
      const res = await axios.get(`${API}classes/${selectedClass.id}/students/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.data?.results || res.data.results || [];
      
      // Validate students and filter out those without UUIDs
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
        setShowAttendanceTable(false);
        return;
      }

      if (validStudents.length < data.length) {
        toast.warning(`${data.length - validStudents.length} students excluded due to missing UUID`);
      }
      
      setStudents(validStudents);
      
      // Initialize attendance data with proper UUID mapping
      const initialAttendanceData = validStudents.map(student => {
        const studentUUID = getStudentUUID(student);
        return {
          student: studentUUID,
          student_uuid: studentUUID, // Explicitly set student_uuid
          subject: '',
          class_schedule: selectedClass.id,
          status: 'Present',
          remarks: '',
          student_info: student // Keep reference to full student object for display
        };
      });
      
      setBulkAttendanceData(initialAttendanceData);
      setShowAttendanceTable(true);
      setRowSubmitting({});
      setRowSubmitted({});
    } catch (err) {
      console.error('Error fetching students for class:', err);
      if (err.response?.status === 404) {
        toast.error('Class student endpoint not found. Showing all students.');
        const validStudents = studentOptions.filter(student => getStudentUUID(student));
        setStudents(validStudents);
        const initialAttendanceData = validStudents.map(student => {
          const studentUUID = getStudentUUID(student);
          return {
            student: studentUUID,
            student_uuid: studentUUID,
            subject: '',
            class_schedule: selectedClass.id,
            status: 'Present',
            remarks: '',
            student_info: student
          };
        });
        setBulkAttendanceData(initialAttendanceData);
        setShowAttendanceTable(true);
      } else {
        toast.error('Failed to load students for selected class.');
        setStudents([]);
        setBulkAttendanceData([]);
      }
    } finally {
      setIsLoadingStudents(false);
    }
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
    const sourceStudent = students[index] || {};
    
    // Double-check UUID extraction
    const studentUUID = record?.student_uuid || record?.student || getStudentUUID(sourceStudent);
    const displayName = getStudentDisplayName(sourceStudent);

    // Validate required fields
    if (!studentUUID) {
      toast.error(`Missing student UUID for ${displayName}`);
      return;
    }

    if (!record?.subject) {
      toast.error(`Select subject for ${displayName}`);
      return;
    }

    // Prepare payload with explicit UUID fields
    const payload = {
      student: studentUUID,
      student_uuid: studentUUID, // Explicitly include student_uuid
      subject: record.subject,
      class_schedule: record.class_schedule,
      status: record.status || 'Present',
      remarks: record.remarks || '',
      date: new Date().toISOString().split('T')[0],
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

    // Validate all records have required fields
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
      const currentDate = new Date().toISOString().split('T')[0];
      
      const promises = bulkAttendanceData.map((record, idx) => {
        const sourceStudent = students[idx] || {};
        const studentUUID = record.student_uuid || record.student || getStudentUUID(sourceStudent);
        const displayName = getStudentDisplayName(sourceStudent);

        if (!studentUUID) {
          throw new Error(`Missing UUID for student: ${displayName}`);
        }

        const payload = {
          student: studentUUID,
          student_uuid: studentUUID, // Explicitly include student_uuid
          subject: record.subject,
          class_schedule: record.class_schedule,
          status: record.status || 'Present',
          remarks: record.remarks || '',
          date: currentDate
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
      setSelectedClass(null);
      setBulkAttendanceData([]);
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

      {/* Class Selection */}
      {canAdd && showAttendanceForm && showClassSelection && (
        <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-md max-w-full md:max-w-2xl mx-auto">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Select Class for Attendance</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
              <Select
                name="class_schedule"
                value={selectedClass}
                onChange={handleClassSelect}
                options={classOptions}
                getOptionLabel={(cls) => `${cls.class_name} - ${cls.section} (${cls.session})`}
                getOptionValue={(cls) => cls.id}
                placeholder="Select Class"
                isClearable
                styles={selectStyles}
                isLoading={isLoadingStudents}
              />
            </div>
          </div>
        </div>
      )}

      {/* Attendance: Responsive (cards on mobile, table on md+) */}
      {canAdd && showAttendanceForm && showAttendanceTable && selectedClass && (
        <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            Mark Attendance for {selectedClass.class_name} - {selectedClass.section} ({selectedClass.session})
          </h2>

          {/* Cards (mobile) */}
          <div className="md:hidden space-y-3">
            {students.map((student, index) => {
              const row = bulkAttendanceData[index] || {};
              const rowBusy = !!rowSubmitting[index];
              const done = !!rowSubmitted[index];
              const displayName = getStudentDisplayName(student);
              const studentUUID = getStudentUUID(student);
              
              return (
                <div
                  key={studentUUID || student.std_id || index}
                  className="border rounded-lg p-3 shadow-sm"
                >
                  <div className="font-semibold text-gray-800 mb-2">
                    {displayName}
                    <div className="text-xs text-gray-500 font-normal">
                      UUID: {studentUUID || 'Missing'}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Subject</label>
                      <Select
                        value={
                          subjectOptions.find(sub => {
                            const val = sub.uuid || sub.id || sub.subject_id;
                            return val === row.subject;
                          }) || null
                        }
                        onChange={(selected) => {
                          const val = selected?.uuid || selected?.id || selected?.subject_id || '';
                          handleBulkAttendanceChange(index, 'subject', val);
                        }}
                        options={subjectOptions}
                        getOptionLabel={(sub) => sub.subject_name || sub.name}
                        getOptionValue={(sub) => sub.uuid || sub.id || sub.subject_id}
                        placeholder="Select Subject"
                        isClearable
                        styles={tinySelectStyles}
                        isLoading={isLoadingSubjects}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Status</label>
                      <Select
                        value={{ value: row.status || 'Present', label: row.status || 'Present' }}
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
                      <input
                        type="text"
                        placeholder="Remarks"
                        value={row.remarks || ''}
                        onChange={(e) => {
                          handleBulkAttendanceChange(index, 'remarks', e.target.value);
                        }}
                        className="w-full border border-gray-300 p-2 rounded text-sm"
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
                      {!studentUUID ? 'No UUID ✗' : done ? 'Submitted ✓' : rowBusy ? 'Submitting…' : 'Submit'}
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
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">Student Name</th>
                  {/* <th className="border border-gray-200 p-3 text-left text-sm font-medium">UUID</th> */}
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">Subject</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">Status</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">Remarks</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => {
                  const rowBusy = !!rowSubmitting[index];
                  const done = !!rowSubmitted[index];
                  const row = bulkAttendanceData[index] || {};
                  const displayName = getStudentDisplayName(student);
                  const studentUUID = getStudentUUID(student);
                  
                  return (
                    <tr key={studentUUID || student.std_id || index} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-3 text-sm">
                        {displayName}
                      </td>
                      {/* <td className="border border-gray-200 p-3 text-xs text-gray-600">
                        {studentUUID || 'Missing'}
                      </td> */}
                      <td className="border border-gray-200 p-3">
                        <Select
                          value={
                            subjectOptions.find(sub => {
                              const val = sub.uuid || sub.id || sub.subject_id;
                              return val === row.subject;
                            }) || null
                          }
                          onChange={(selected) => {
                            const val = selected?.uuid || selected?.id || selected?.subject_id || '';
                            handleBulkAttendanceChange(index, 'subject', val);
                          }}
                          options={subjectOptions}
                          getOptionLabel={(sub) => sub.subject_name || sub.name}
                          getOptionValue={(sub) => sub.uuid || sub.id || sub.subject_id}
                          placeholder="Select Subject"
                          isClearable
                          styles={tinySelectStyles}
                          isLoading={isLoadingSubjects}
                        />
                      </td>
                      <td className="border border-gray-200 p-3">
                        <Select
                          value={{ value: row.status || 'Present', label: row.status || 'Present' }}
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
                        <input
                          type="text"
                          placeholder="Remarks"
                          value={row.remarks || ''}
                          onChange={(e) => {
                            handleBulkAttendanceChange(index, 'remarks', e.target.value);
                          }}
                          className="w-full border border-gray-300 p-2 rounded text-sm"
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
                          {!studentUUID ? 'No UUID ✗' : done ? 'Submitted ✓' : rowBusy ? 'Submitting…' : 'Submit'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
            <button
              onClick={handleSubmitBulkAttendance}
              disabled={loading}
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded hover:bg-blue-800 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit All'}
            </button>
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
                value={['Daily','Monthly','Yearly'].map(v=>({value:v,label:v})).find(opt => opt.value === filters.type)}
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

      {/* Report Table (kept scrollable; already responsive) */}
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
              {Array.from({length: totalPages}, (_,i)=>i+1).slice(
                Math.max(0, Math.min(currentPage-3, totalPages-5)),
                Math.max(5, Math.min(totalPages, (currentPage-3)+5))
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