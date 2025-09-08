import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import Select from "react-select";
import * as XLSX from "xlsx";
import Buttons from "../../components/Buttons";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster"; // Import custom Toaster component

const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showExcelOptions, setShowExcelOptions] = useState(false);
  const [showResultTable, setShowResultTable] = useState(false);
  const [bulkResultData, setBulkResultData] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [rowSubmitting, setRowSubmitting] = useState({});
  const [rowSubmitted, setRowSubmitted] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [viewModalData, setViewModalData] = useState(null);
  const [filter, setFilter] = useState({
    subject: "",
    class_schedule: "",
    exam: "",
  });
  const [filterType, setFilterType] = useState(null);
  const [toaster, setToaster] = useState({ message: "", type: "success" });

  const API = import.meta.env.VITE_SERVER_URL ;
  const API_URL = `${API}/student-results/`;
  const CLASSES_API = `${API}/classes/`;
  const STUDENTS_API = `${API}/api/auth/users/list_profiles/student/`;
  const SUBJECTS_API = `${API}/subjects/`;
  const EXAMS_API = `${API}/exams/`;

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canAdd = permissions.includes("users.add_studentresult");
  const canEdit = permissions.includes("users.change_studentresult");
  const canDelete = permissions.includes("users.delete_studentresult");
  const canView = permissions.includes("users.view_studentresult");

  // Toast helper
  const showToast = (message, type = "success") => {
    setToaster({ message, type });
  };

  // Confirmation toast for deletion
  const confirmToast = (message) => {
    return new Promise((resolve) => {
      setToaster({
        message,
        type: "confirmation",
        onConfirm: () => {
          setToaster({ message: "", type: "success" });
          resolve(true);
        },
        onCancel: () => {
          setToaster({ message: "", type: "success" });
          resolve(false);
        },
      });
    });
  };

  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : true);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const getStudentUUID = (student = {}) => {
    const possibleUUIDs = [
      student.profile_id,
      student.std_id,
      student.profile_uuid,
      student.user_uuid,
      student.uuid,
      student.student_uuid,
      student.user_id,
      student.id,
    ];
    const uuid = possibleUUIDs.find((id) => id != null && id !== "");
    if (!uuid) console.warn("No valid UUID found for student:", student);
    return uuid;
  };

  const getStudentDisplayName = (student = {}) => {
    const firstName = student.first_name || "";
    const lastName = student.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || student.username || student.name || student.email || "Unknown Student";
  };

  const getStudentRegNumber = (student = {}) => {
    return (
      student.registration_no ||
      student.registration_number ||
      student.reg_no ||
      student.student_id ||
      student.std_id ||
      "N/A"
    );
  };

  const fetchResults = async (page = 1, size = pageSize, filters = {}) => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
        return;
      }
      let url = `${API_URL}?page=${page}&page_size=${size}`;
      if (filters.subject) url += `&subject=${filters.subject}`;
      if (filters.class_schedule) url += `&student__class_schedule=${filters.class_schedule}`;
      if (filters.exam) url += `&exam=${filters.exam}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data.data;
      if (Array.isArray(data.results)) {
        setResults(data.results);
        setCurrentPage(data.current_page);
        setTotalPages(data.total_pages);
      } else {
        throw new Error("Unexpected API response format.");
      }
    } catch (error) {
      console.error("Error fetching results:", error.response || error.message);
      showToast("Failed to fetch results. Please try again.", "error");
    }
  };

  const fetchDropdowns = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
        return;
      }
      setIsLoading(true);
      setIsLoadingSubjects(true);
      setIsLoadingExams(true);
      const [classesRes, subjectsRes, examsRes] = await Promise.all([
        axios.get(`${CLASSES_API}?page_size=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(SUBJECTS_API, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(EXAMS_API, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const classData = classesRes.data?.data?.results || classesRes.data.data || classesRes.data;
      const subjectData = subjectsRes.data?.data?.results || subjectsRes.data.data || subjectsRes.data;
      const examData = Array.isArray(examsRes.data)
        ? examsRes.data
        : examsRes.data.data?.results || examsRes.data.results || examsRes.data.data || [];
      setClasses(
        classData.map((cls) => ({
          value: cls.id,
          label: `${cls.class_name} - ${cls.section} (${cls.session})`.trim(),
        }))
      );
      setSubjects(
        subjectData.map((sub) => ({
          value: sub.id,
          label: sub.subject_name,
        }))
      );
      setExams(
        examData.map((exam) => ({
          value: exam.exam_id || exam.id,
          label: exam.exam_type || exam.title || exam.name,
        }))
      );
    } catch (error) {
      console.error("Error fetching dropdowns:", error.response || error.message);
      showToast("Failed to fetch dropdown data. Please try again.", "error");
    } finally {
      setIsLoading(false);
      setIsLoadingSubjects(false);
      setIsLoadingExams(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setIsLoadingStudents(true);
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
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
          showToast("No students with valid UUIDs found. Please check the student data.", "error");
        } else if (validStudents.length < studentData.length) {
          showToast(
            `${studentData.length - validStudents.length} students excluded due to missing UUIDs`,
            "warning"
          );
        }
      } else {
        throw new Error("Unexpected students API response format.");
      }
    } catch (error) {
      console.error("Error fetching students:", error.response || error.message);
      showToast("Failed to fetch students. Please try again.", "error");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleClassSubjectExamSelect = async () => {
    if (!selectedClass || !selectedSubject || !selectedExam) {
      showToast("Please select class, subject, and exam", "error");
      return;
    }

    try {
      setIsLoadingStudents(true);
      await fetchStudents();

      if (students.length === 0) {
        showToast("No valid students found", "error");
        setBulkResultData([]);
        setShowExcelOptions(false);
        return;
      }

      setShowExcelOptions(true);
      setShowResultTable(false);
      setBulkResultData(
        students.map((student) => ({
          student: getStudentUUID(student),
          student_info: student,
          exam: selectedExam.value,
          subject: selectedSubject.value,
          marks_obtained: "",
          total_marks: "",
          remarks: "",
          class_schedule: selectedClass.value,
        }))
      );
    } catch (error) {
      console.error("Error in class/subject/exam selection:", error);
      showToast("Failed to load students.", "error");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleExportExcel = () => {
    if (!selectedClass || !selectedSubject || !selectedExam || students.length === 0) {
      showToast("Please select class, subject, and exam first", "error");
      return;
    }
    const excelData = students.map((student, index) => ({
      "S.No": index + 1,
      "Registration Number": getStudentRegNumber(student),
      "First Name": student.first_name || "",
      "Last Name": student.last_name || "",
      "Marks Obtained": "",
      "Total Marks": "",
      Remarks: "",
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    ws["!cols"] = [
      { width: 8 },
      { width: 20 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    const fileName = `Results_${selectedClass.label}_${selectedSubject.label}_${selectedExam.label}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast("Excel template exported successfully", "success");
  };

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
        const processedData = jsonData
          .map((row) => {
            const regNumber = row["Registration Number"];
            const matchingStudent = students.find(
              (student) => getStudentRegNumber(student) === regNumber
            );
            if (!matchingStudent) {
              console.warn(`No matching student for registration number: ${regNumber}`);
              return null;
            }
            const marksObtained = Number(row["Marks Obtained"]);
            const totalMarks = Number(row["Total Marks"]);
            if (isNaN(marksObtained) || isNaN(totalMarks)) {
              console.warn(`Invalid marks for student: ${regNumber}`);
              return null;
            }
            const studentUUID = getStudentUUID(matchingStudent);
            return {
              student: studentUUID,
              student_info: matchingStudent,
              exam: selectedExam.value,
              subject: selectedSubject.value,
              marks_obtained: marksObtained,
              total_marks: totalMarks,
              remarks: row["Remarks"] || "",
              class_schedule: selectedClass.value,
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
        setBulkResultData(processedData);
        setShowExcelOptions(false);
        setShowResultTable(true);
        showToast(`${processedData.length} result records imported from Excel`, "success");
      } catch (error) {
        console.error("Error importing Excel file:", error);
        showToast("Failed to import Excel file. Please check the format.", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };

  const handleBulkResultChange = (index, field, value) => {
    setBulkResultData((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmitSingle = async (index) => {
    const token = Cookies.get("access_token");
    if (!token) return showToast("Not authenticated", "error");
    const record = bulkResultData[index];
    const sourceStudent = students[index] || record.student_info || {};
    const studentUUID = record.student || getStudentUUID(sourceStudent);
    const displayName = getStudentDisplayName(sourceStudent);
    if (!studentUUID) {
      showToast(`Missing student UUID for ${displayName}`, "error");
      return;
    }
    if (!record.subject || !record.exam || !record.class_schedule) {
      showToast(`Missing required fields for ${displayName}`, "error");
      return;
    }
    const marksObtained = Number(record.marks_obtained);
    const totalMarks = Number(record.total_marks);
    if (isNaN(marksObtained) || isNaN(totalMarks) || marksObtained < 0 || totalMarks <= 0) {
      showToast(`Invalid marks for ${displayName}`, "error");
      return;
    }
    const payload = {
      student: studentUUID,
      exam: record.exam,
      subject: record.subject,
      marks_obtained: marksObtained,
      total_marks: totalMarks,
      remarks: record.remarks || "",
      class_schedule: record.class_schedule,
    };
    try {
      setRowSubmitting((prev) => ({ ...prev, [index]: true }));
      const response = await axios.post(API_URL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRowSubmitted((prev) => ({ ...prev, [index]: true }));
      setResults((prev) => [...prev, response.data.data]);
      showToast(`Result saved for ${displayName}`, "success");
    } catch (err) {
      console.error("Single submit error:", err.response?.data);
      const errorMessage = err.response?.data?.message || err.response?.data?.detail || "Unknown error";
      showToast(`Failed to submit for ${displayName}: ${errorMessage}`, "error");
    } finally {
      setRowSubmitting((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleSubmitBulkResults = async () => {
    const token = Cookies.get("access_token");
    if (!token) return showToast("Not authenticated", "error");
    const invalidRecords = bulkResultData.filter(
      (record) =>
        !record.student ||
        !record.subject ||
        !record.exam ||
        isNaN(Number(record.marks_obtained)) ||
        isNaN(Number(record.total_marks)) ||
        Number(record.total_marks) <= 0
    );
    if (invalidRecords.length > 0) {
      showToast("Please ensure all records have valid data", "error");
      return;
    }
    try {
      setIsLoading(true);
      const promises = bulkResultData.map((record, idx) => {
        const sourceStudent = students[idx] || record.student_info || {};
        const studentUUID = record.student || getStudentUUID(sourceStudent);
        const displayName = getStudentDisplayName(sourceStudent);
        if (!studentUUID) {
          throw new Error(`Missing UUID for student: ${displayName}`);
        }
        const payload = {
          student: studentUUID,
          exam: record.exam,
          subject: record.subject,
          marks_obtained: Number(record.marks_obtained),
          total_marks: Number(record.total_marks),
          remarks: record.remarks || "",
          class_schedule: record.class_schedule,
        };
        return axios
          .post(API_URL, payload, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch((error) => {
            console.error(`Error submitting for ${displayName}:`, error.response?.data);
            throw error;
          });
      });
      const responses = await Promise.all(promises);
      setResults((prev) => [...prev, ...responses.map((res) => res.data.data)]);
      showToast("Bulk results submitted successfully", "success");
      setShowForm(false);
      setShowExcelOptions(false);
      setShowResultTable(false);
      setSelectedClass(null);
      setSelectedSubject(null);
      setSelectedExam(null);
      setBulkResultData([]);
      setExcelData([]);
      setRowSubmitting({});
      setRowSubmitted({});
    } catch (err) {
      console.error("Error submitting bulk results:", err);
      const errorMessage = err.response?.data?.message || err.response?.data?.detail || err.message;
      showToast(`Failed to submit results: ${errorMessage}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditResult = (result) => {
    setShowForm(true);
    setShowExcelOptions(false);
    setShowResultTable(false);
    setSelectedClass(
      classes.find((c) => c.value === result.student__class_schedule) || null
    );
    setSelectedSubject(subjects.find((s) => s.value === result.subject) || null);
    setSelectedExam(exams.find((e) => e.value === result.exam) || null);
    fetchStudents();
    setBulkResultData([
      {
        student: result.student,
        exam: result.exam,
        subject: result.subject,
        marks_obtained: result.marks_obtained,
        total_marks: result.total_marks,
        remarks: result.remarks,
        class_schedule: result.student__class_schedule,
        student_info: { username: result.student_name },
      },
    ]);
  };

  const handleDeleteResult = async (id) => {
    if (!canDelete) {
      showToast("You do not have permission to delete results.", "error");
      return;
    }
    const confirmed = await confirmToast("Are you sure you want to delete this result?");
    if (!confirmed) return;

    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
        return;
      }
      await axios.delete(`${API_URL}${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Result deleted successfully!", "success");
      setResults((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Error deleting result:", error.response || error.message);
      showToast("Failed to delete result. Please try again.", "error");
    }
  };

  const handleFilterChange = (field, value) => {
    setFilter((prev) => ({ ...prev, [field]: value }));
    fetchResults(1, pageSize, { ...filter, [field]: value });
  };

  const handleCombinedFilter = (subject, class_schedule) => {
    setFilter((prev) => ({ ...prev, subject, class_schedule }));
    fetchResults(1, pageSize, { ...filter, subject, class_schedule });
  };

  useEffect(() => {
    fetchDropdowns();
    fetchResults();
  }, [pageSize]);

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

  return (
    <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={3000}
        onClose={() => setToaster({ message: "", type: "success" })}
        onConfirm={toaster.onConfirm}
        onCancel={toaster.onCancel}
      />
      <div className="bg-blue-900 text-white py-3 px-4 sm:px-6 rounded-lg shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-lg sm:text-xl font-bold text-center md:text-left">Manage Student Results</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          {canAdd && (
            <button
              onClick={() => {
                setShowForm((prev) => !prev);
                setShowExcelOptions(false);
                setShowResultTable(false);
                setSelectedClass(null);
                setSelectedSubject(null);
                setSelectedExam(null);
                setBulkResultData([]);
                setExcelData([]);
                setRowSubmitting({});
                setRowSubmitted({});
                setFilterType(null);
                setFilter({ subject: "", class_schedule: "", exam: "" });
              }}
              className="bg-cyan-500 text-white px-4 py-2 rounded-md shadow hover:bg-cyan-700 text-sm sm:text-base"
            >
              {showForm ? "Close Form" : "Add New Result"}
            </button>
          )}
          {canView && (
            <button
              onClick={() => {
                if (filterType) {
                  setFilterType(null);
                  setFilter({ subject: "", class_schedule: "", exam: "" });
                  fetchResults();
                } else {
                  setFilterType("menu");
                }
              }}
              className="bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-700 text-sm sm:text-base"
            >
              {filterType ? "Close Filter" : "Filter Data"}
            </button>
          )}
        </div>
      </div>

      {canAdd && showForm && !showExcelOptions && !showResultTable && (
        <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-md max-w-full md:max-w-4xl mx-auto">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            Select Class, Subject, and Exam for Results
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
              <Select
                name="class_schedule"
                value={selectedClass}
                onChange={setSelectedClass}
                options={classes}
                placeholder="Select Class"
                isClearable
                styles={selectStyles}
                isLoading={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
              <Select
                name="subject"
                value={selectedSubject}
                onChange={setSelectedSubject}
                options={subjects}
                placeholder="Select Subject"
                isClearable
                styles={selectStyles}
                isLoading={isLoadingSubjects}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam</label>
              <Select
                name="exam"
                value={selectedExam}
                onChange={setSelectedExam}
                options={exams}
                placeholder="Select Exam"
                isClearable
                styles={selectStyles}
                isLoading={isLoadingExams}
              />
            </div>
          </div>
          <div className="text-right">
            <button
              onClick={handleClassSubjectExamSelect}
              disabled={!selectedClass || !selectedSubject || !selectedExam || isLoadingStudents}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoadingStudents ? "Loading..." : "Continue"}
            </button>
          </div>
        </div>
      )}

      {canAdd && showForm && showExcelOptions && (
        <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-md max-w-full md:max-w-4xl mx-auto">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            Manage Results for {selectedClass?.label} ({selectedSubject?.label}, {selectedExam?.label})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Export Excel Template</h3>
              <p className="text-sm text-gray-600 mb-3">
                Download an Excel file with students. Fill in marks and remarks manually.
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
                Upload the filled Excel file to populate the result form.
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
                Enter results manually in a table format.
              </p>
              <button
                onClick={() => {
                  setShowResultTable(true);
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
              Instructions: Export template → Fill marks/remarks → Import back or enter manually → Save results
            </p>
          </div>
        </div>
      )}

      {canAdd && showForm && showResultTable && selectedClass && selectedSubject && selectedExam && (
        <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">
              Enter Results for {selectedClass.label} ({selectedSubject.label}, {selectedExam.label})
            </h2>
            {excelData.length > 0 && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                Imported from Excel
              </span>
            )}
          </div>
          <div className="md:hidden space-y-3">
            {bulkResultData.map((record, index) => {
              const student = record.student_info || students[index] || {};
              const rowBusy = !!rowSubmitting[index];
              const done = !!rowSubmitted[index];
              const displayName = getStudentDisplayName(student);
              const regNumber = getStudentRegNumber(student);
              const studentUUID = record.student || getStudentUUID(student);
              return (
                <div
                  key={studentUUID || index}
                  className="border rounded-lg p-3 shadow-sm"
                >
                  <div className="font-semibold text-gray-800 mb-2">
                    {displayName}
                    <div className="text-xs text-gray-500 font-normal">
                      Reg: {regNumber} | UUID: {studentUUID || "Missing"}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Marks Obtained</label>
                      <input
                        type="number"
                        value={record.marks_obtained}
                        onChange={(e) =>
                          handleBulkResultChange(index, "marks_obtained", e.target.value)
                        }
                        className="w-full border border-gray-300 p-2 rounded-md text-sm"
                        placeholder="e.g., 85"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Total Marks</label>
                      <input
                        type="number"
                        value={record.total_marks}
                        onChange={(e) =>
                          handleBulkResultChange(index, "total_marks", e.target.value)
                        }
                        className="w-full border border-gray-300 p-2 rounded-md text-sm"
                        placeholder="e.g., 100"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Remarks</label>
                      <input
                        type="text"
                        value={record.remarks}
                        onChange={(e) =>
                          handleBulkResultChange(index, "remarks", e.target.value)
                        }
                        className="w-full border border-gray-300 p-2 rounded-md text-sm"
                        placeholder="Enter remarks"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleSubmitSingle(index)}
                      disabled={rowBusy || done || !studentUUID}
                      className={`px-4 py-2 rounded text-sm text-white ${!studentUUID
                        ? "bg-red-600 cursor-not-allowed"
                        : done
                          ? "bg-green-600 cursor-default"
                          : rowBusy
                            ? "bg-blue-400 cursor-wait"
                            : "bg-blue-600 hover:bg-blue-700"
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                      title={
                        !studentUUID ? "Missing UUID" : done ? "Submitted" : "Submit this student"
                      }
                    >
                      {!studentUUID
                        ? "No UUID"
                        : done
                          ? "Submitted"
                          : rowBusy
                            ? "Submitting..."
                            : "Submit"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">S.No</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">
                    Registration
                  </th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">
                    Student Name
                  </th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">
                    Marks Obtained
                  </th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">
                    Total Marks
                  </th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">Remarks</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {bulkResultData.map((record, index) => {
                  const student = record.student_info || students[index] || {};
                  const rowBusy = !!rowSubmitting[index];
                  const done = !!rowSubmitted[index];
                  const displayName = getStudentDisplayName(student);
                  const regNumber = getStudentRegNumber(student);
                  const studentUUID = record.student || getStudentUUID(student);
                  return (
                    <tr key={studentUUID || index} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-3 text-sm">{index + 1}</td>
                      <td className="border border-gray-200 p-3 text-sm">{regNumber}</td>
                      <td className="border border-gray-200 p-3 text-sm">{displayName}</td>
                      <td className="border border-gray-200 p-3">
                        <input
                          type="number"
                          value={record.marks_obtained}
                          onChange={(e) =>
                            handleBulkResultChange(index, "marks_obtained", e.target.value)
                          }
                          className="w-full border border-gray-300 p-2 rounded-md text-sm"
                          placeholder="e.g., 85"
                          min="0"
                        />
                      </td>
                      <td className="border border-gray-200 p-3">
                        <input
                          type="number"
                          value={record.total_marks}
                          onChange={(e) =>
                            handleBulkResultChange(index, "total_marks", e.target.value)
                          }
                          className="w-full border border-gray-300 p-2 rounded-md text-sm"
                          placeholder="e.g., 100"
                          min="0"
                        />
                      </td>
                      <td className="border border-gray-200 p-3">
                        <input
                          type="text"
                          value={record.remarks}
                          onChange={(e) =>
                            handleBulkResultChange(index, "remarks", e.target.value)
                          }
                          className="w-full border border-gray-300 p-2 rounded-md text-sm"
                          placeholder="Enter remarks"
                        />
                      </td>
                      <td className="border border-gray-200 p-3">
                        <button
                          onClick={() => handleSubmitSingle(index)}
                          disabled={rowBusy || done || !studentUUID}
                          className={`px-3 py-1.5 rounded text-sm text-white ${!studentUUID
                            ? "bg-red-600 cursor-not-allowed"
                            : done
                              ? "bg-green-600 cursor-default"
                              : rowBusy
                                ? "bg-blue-400 cursor-wait"
                                : "bg-blue-600 hover:bg-blue-700"
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                          title={
                            !studentUUID ? "Missing UUID" : done ? "Submitted" : "Submit this row"
                          }
                        >
                          {!studentUUID
                            ? "No UUID"
                            : done
                              ? "Submitted"
                              : rowBusy
                                ? "Submitting..."
                                : "Submit"}
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
              Total Students: {bulkResultData.length}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResultTable(false);
                  setExcelData([]);
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
              >
                Back to Options
              </button>
              <button
                onClick={handleSubmitBulkResults}
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Saving Results..." : "Save All Results"}
              </button>
            </div>
          </div>
        </div>
      )}

      {canView && !showForm && !showExcelOptions && !showResultTable && results.length === 0 && (
        <div className="mt-6 p-6 bg-gray-50 rounded-lg shadow-md border border-gray-200 max-w-4xl mx-auto text-center">
          <p className="text-gray-500 text-lg font-medium">No student results added yet.</p>
        </div>
      )}

      {canView && results.length > 0 && (
        <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <Buttons
            data={results.map((rec, index) => ({
              ...rec,
              sequence: (currentPage - 1) * pageSize + index + 1,
            }))}
            columns={[
              { label: "S.No", key: "sequence" },
              { label: "Student Name", key: "student_name" },
              { label: "Class", key: "class_name" },
              { label: "Exam", key: "exam_term" },
              { label: "Subject", key: "subject_name" },
              { label: "Marks Obtained", key: "marks_obtained" },
              { label: "Total Marks", key: "total_marks" },
              { label: "Grade", key: "grade" },
              { label: "Remarks", key: "remarks" },
            ]}
            filename="StudentResults"
          />
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">S.No</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">
                    Student Name
                  </th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">Class</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">Exam</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">Subject</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">
                    Marks Obtained
                  </th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">
                    Total Marks
                  </th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">Grade</th>
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">Remarks</th>
                  {(canEdit || canDelete || canView) && (
                    <th className="border border-gray-200 p-3 text-left text-sm font-medium">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 p-3 text-sm">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="border border-gray-200 p-3 text-sm">{result.student_name}</td>
                    <td className="border border-gray-200 p-3 text-sm">{result.class_name}</td>
                    <td className="border border-gray-200 p-3 text-sm">{result.exam_term}</td>
                    <td className="border border-gray-200 p-3 text-sm">{result.subject_name}</td>
                    <td className="border border-gray-200 p-3 text-sm">{result.marks_obtained}</td>
                    <td className="border border-gray-200 p-3 text-sm">{result.total_marks}</td>
                    <td className="border border-gray-200 p-3 text-sm">{result.grade}</td>
                    <td className="border border-gray-200 p-3 text-sm">{result.remarks || "—"}</td>
                    {(canEdit || canDelete || canView) && (
                      <td className="border border-gray-200 p-3 flex gap-2">
                        {canView && (
                          <button
                            onClick={() => setViewModalData(result)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <MdVisibility size={18} />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => handleEditResult(result)}
                            className="text-yellow-500 hover:text-yellow-700"
                          >
                            <MdEdit size={18} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteResult(result.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <MdDelete size={18} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden mt-4 space-y-3">
            {results.map((result, index) => (
              <div key={result.id} className="border rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-800">{result.student_name}</div>
                  <div className="text-xs text-gray-500">
                    #{(currentPage - 1) * pageSize + index + 1}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-1 text-sm">
                  <div>
                    <span className="font-medium">Class:</span> {result.class_name}
                  </div>
                  <div>
                    <span className="font-medium">Exam:</span> {result.exam_term}
                  </div>
                  <div>
                    <span className="font-medium">Subject:</span> {result.subject_name}
                  </div>
                  <div>
                    <span className="font-medium">Marks Obtained:</span> {result.marks_obtained}
                  </div>
                  <div>
                    <span className="font-medium">Total Marks:</span> {result.total_marks}
                  </div>
                  <div>
                    <span className="font-medium">Grade:</span> {result.grade}
                  </div>
                  <div>
                    <span className="font-medium">Remarks:</span> {result.remarks || "—"}
                  </div>
                </div>
                {(canEdit || canDelete || canView) && (
                  <div className="mt-2 flex justify-end gap-2">
                    {canView && (
                      <button
                        onClick={() => setViewModalData(result)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <MdVisibility size={18} />
                      </button>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => handleEditResult(result)}
                        className="text-yellow-500 hover:text-yellow-700"
                      >
                        <MdEdit size={18} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteResult(result.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <MdDelete size={18} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={(page) => {
              setCurrentPage(page);
              fetchResults(page, pageSize);
            }}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
              fetchResults(1, size);
            }}
            totalItems={results.length}
            showPageSizeSelector={true}
            showPageInfo={true}
          />
        </div>
      )}

      {viewModalData && canView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-2">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[70vh] border border-gray-200 p-3 overflow-y-auto">
            <div className="mb-3 border-b pb-1">
              <h3 className="text-lg font-bold text-blue-800 text-center">
                📄 Student Result Details
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-y-1 text-xs text-gray-700">
              <div className="font-semibold text-blue-900 border-b pb-0.5">
                👤 Student Information
              </div>
              <div>
                <span className="font-semibold">Student Name:</span>{" "}
                {viewModalData.student_name}
              </div>
              <div>
                <span className="font-semibold">Class:</span> {viewModalData.class_name}
              </div>
              <div>
                <span className="font-semibold">Exam:</span> {viewModalData.exam_term}
              </div>
              <div>
                <span className="font-semibold">Subject:</span> {viewModalData.subject_name}
              </div>
              <div className="font-semibold text-blue-900 border-b pt-1 pb-0.5">
                📋 Result Details
              </div>
              <div>
                <span className="font-semibold">Marks Obtained:</span>{" "}
                {viewModalData.marks_obtained}
              </div>
              <div>
                <span className="font-semibold">Total Marks:</span> {viewModalData.total_marks}
              </div>
              <div>
                <span className="font-semibold">Grade:</span> {viewModalData.grade}
              </div>
              <div>
                <span className="font-semibold">Remarks:</span>{" "}
                {viewModalData.remarks || "—"}
              </div>
            </div>
            <div className="mt-2 text-center">
              <button
                onClick={() => setViewModalData(null)}
                className="px-3 py-1 bg-blue-700 text-white rounded-full shadow text-xs hover:bg-blue-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResults;