import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import { Buttons } from '../../components';
import Select from 'react-select';
import Pagination from "../../components/Pagination";

const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [newResult, setNewResult] = useState({
    student: "",
    exam: "",
    subject: "",
    marks_obtained: "",
    total_marks: "",
    remarks: ""
  });
  const [editingResult, setEditingResult] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [filter, setFilter] = useState({
    subject: "",
    class_schedule: "",
    exam: ""
  });
  const [filterType, setFilterType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewModalData, setViewModalData] = useState(null);

  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}/student-results/`;

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canAdd = permissions.includes("users.add_studentresult");
  const canEdit = permissions.includes("users.change_studentresult");
  const canDelete = permissions.includes("users.delete_studentresult");
  const canView = permissions.includes("users.view_studentresult");

  const fetchResults = async (page = 1, size = pageSize, filters = {}) => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
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
      toast.error("Failed to fetch results. Please try again.");
    }
  };

  const fetchClasses = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }
      const response = await axios.get(`${API}/classes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const classData = response.data.data?.results || response.data.data || response.data;
      if (Array.isArray(classData)) {
        setClasses(classData.map(cls => ({
          value: cls.id,
          label: ` ${cls.class_name}-${cls.section} (${cls.session})`.trim()
        })));
      } else {
        throw new Error("Unexpected classes API response format.");
      }
    } catch (error) {
      console.error("Error fetching classes:", error.response || error.message);
      toast.error("Failed to fetch classes. Please try again.");
    }
  };

  const fetchStudents = async (classId) => {
    try {
      console.log("Fetching students for classId:", classId);
      if (!classId) {
        console.log("ClassId is undefined, skipping fetchStudents.");
        return;
      }
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }
      const response = await axios.get(`${API}/classes/${classId}/students/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Students API response:", response.data);
      const studentData = response.data.data?.results || response.data.data || response.data;
      if (Array.isArray(studentData)) {
        setStudents(studentData.map(student => ({
          value: student.std_id,
          label: `${student.username} `.trim()
        })));
      } else {
        throw new Error("Unexpected students API response format.");
      }
    } catch (error) {
      console.error("Error fetching students:", error.response || error.message);
      toast.error("Failed to fetch students. Please try again.");
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }
      const response = await axios.get(`${API}/subjects/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subjectData = response.data.data?.results || response.data.data || response.data;
      if (Array.isArray(subjectData)) {
        setSubjects(subjectData.map(subject => ({
          value: subject.id,
          label: subject.subject_name
        })));
      } else {
        throw new Error("Unexpected subjects API response format.");
      }
    } catch (error) {
      console.error("Error fetching subjects:", error.response || error.message);
      toast.error("Failed to fetch subjects. Please try again.");
    }
  };

  const fetchExams = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }

      const response = await axios.get(`${API}/exams/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Exam API raw response:", response.data);

      let examData = [];

      if (Array.isArray(response.data)) {
        examData = response.data;
      } else if (Array.isArray(response.data.data?.results)) {
        examData = response.data.data.results;
      } else if (Array.isArray(response.data.results)) {
        examData = response.data.results;
      } else if (Array.isArray(response.data.data)) {
        examData = response.data.data;
      } else {
        throw new Error("Unexpected exams API response format.");
      }

      setExams(examData.map(exam => ({
        value: exam.exam_id || exam.id,
        label: exam.exam_type || exam.title || exam.name
      })));
    } catch (error) {
      console.error("Error fetching exams:", error.response || error.message);
      toast.error("Failed to fetch exams. Please try again.");
    }
  };

  const handleSaveResult = async () => {
    console.log("New Result State:", newResult);
    const marksObtained = Number(newResult.marks_obtained);
    const totalMarks = Number(newResult.total_marks);

    if (!newResult.student || !newResult.exam || !newResult.subject || isNaN(marksObtained) || marksObtained <= 0 || isNaN(totalMarks) || totalMarks <= 0) {
      toast.error("All fields are required and marks must be valid positive numbers!");
      return;
    }

    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }

      const payload = {
        student: newResult.student,
        exam: newResult.exam,
        subject: newResult.subject,
        marks_obtained: marksObtained,
        total_marks: totalMarks,
        remarks: newResult.remarks || ""
      };

      if (editingResult) {
        const response = await axios.put(`${API_URL}${editingResult.id}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          toast.success("Result updated successfully!");
          setResults((prev) => prev.map((r) => (r.id === editingResult.id ? response.data.data : r)));
          setEditingResult(null);
        } else {
          throw new Error("Failed to update result.");
        }
      } else {
        const response = await axios.post(API_URL, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 201) {
          toast.success("Result created successfully!");
          setResults((prev) => [...prev, response.data.data]);
        } else {
          throw new Error("Failed to create result.");
        }
      }

      setNewResult({ student: "", exam: "", subject: "", marks_obtained: "", total_marks: "", remarks: "" });
      setSelectedClass(null);
      setStudents([]);
      setShowForm(false);
    } catch (error) {
      console.error("Error saving result:", error.response || error.message);
      toast.error(error.response?.data?.message || "Failed to save result. Please try again.");
    }
  };

  const handleDeleteResult = async (id) => {
    if (!canDelete) {
      toast((t) => (
        <div className="text-center font-semibold p-2 bg-red-100 border border-red-400 rounded shadow-md">
          🚫 You do not have permission to delete results.
          <div className="mt-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="mt-1 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      ));
      return;
    }

    toast((t) => (
      <div>
        <p className="text-gray-600 text-xs">Are you sure you want to delete?</p>
        <div className="flex justify-end mt-1">
          <button
            onClick={async () => {
              try {
                const token = Cookies.get("access_token");
                if (!token) {
                  toast.error("User is not authenticated.");
                  return;
                }

                await axios.delete(`${API_URL}${id}/`, {
                  headers: { Authorization: `Bearer ${token}` },
                });

                toast.success("Result deleted successfully!");
                setResults((prev) => prev.filter((r) => r.id !== id));
                toast.dismiss(t.id);
              } catch (error) {
                console.error("Error deleting result:", error.response || error.message);
                toast.error("Failed to delete result. Please try again.");
              }
            }}
            className="bg-red-500 text-white px-2 py-1 rounded shadow text-xs hover:bg-red-700 mr-1"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-500 text-white px-2 py-1 rounded shadow text-xs hover:bg-gray-700"
          >
            No
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const handleEditResult = (result) => {
    console.log("Editing result:", result);
    setEditingResult(result);
    setNewResult({
      student: result.student || "",
      exam: result.exam || "",
      subject: result.subject || "",
      marks_obtained: result.marks_obtained || "",
      total_marks: result.total_marks || "",
      remarks: result.remarks || ""
    });
    const classId = result.student__class_schedule || (result.class_id ? result.class_id : null);
    console.log("Derived classId for fetchStudents:", classId);
    if (classId) {
      setSelectedClass({ value: classId, label: result.class_name });
      fetchStudents(classId);
    } else {
      console.log("No valid classId found, students may not load.");
      setSelectedClass(null);
      setStudents([]);
    }
    setShowForm(true);
  };

  const handleFilterChange = (field, value) => {
    setFilter((prev) => ({ ...prev, [field]: value }));
    fetchResults(1, pageSize, { ...filter, [field]: value });
  };

  const handleCombinedFilter = (subject, class_schedule) => {
    setFilter((prev) => ({ ...prev, subject, class_schedule }));
    fetchResults(1, pageSize, { ...filter, subject, class_schedule });
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) fetchResults(page, pageSize, filter);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchResults(), fetchClasses(), fetchSubjects(), fetchExams()]);
      if (selectedClass) {
        await fetchStudents(selectedClass.value);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [pageSize, selectedClass]);

  const columns = [
    { label: "Student Name", key: "student_name" },
    { label: "Class", key: "class_name" },
    { label: "Exam", key: "exam_term" },
    { label: "Subject", key: "subject_name" },
    { label: "Marks Obtained", key: "marks_obtained" },
    { label: "Total Marks", key: "total_marks" },
    { label: "Grade", key: "grade" },
    { label: "Remarks", key: "remarks" },
  ];

  return (
    <div className="p-2">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="bg-blue-900 text-white py-1 px-2 rounded-md flex justify-between items-center mt-2">
        <h1 className="text-lg font-bold">Manage Student Results</h1>
        <div className="flex gap-2">
          {canAdd && (
            <button
              onClick={() => {
                setShowForm((prev) => !prev);
                setEditingResult(null);
                setNewResult({ student: "", exam: "", subject: "", marks_obtained: "", total_marks: "", remarks: "" });
                setSelectedClass(null);
                setStudents([]);
                setFilterType(null);
                setFilter({ subject: "", class_schedule: "", exam: "" });
              }}
              className="flex items-center px-2 py-1 bg-cyan-400 text-white font-semibold rounded-md shadow-md hover:bg-cyan-500 text-sm"
            >
              <div className="flex items-center justify-center w-6 h-6 bg-black rounded-full mr-1">
                <span className="text-cyan-500 text-base font-bold">{showForm ? "-" : "+"}</span>
              </div>
              {showForm ? "Close Form" : "Add New Result"}
            </button>
          )}
          <div className="relative">
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
              className="bg-cyan-400 hover:bg-cyan-600 text-white font-semibold px-2 py-1 mt-1 rounded shadow-md text-sm"
            >
              {filterType ? "Close Form" : "Filter Data"}
            </button>
            {filterType === "menu" && (
              <div className="absolute right-0 mt-1 w-40 bg-white border rounded shadow-md z-10 text-gray-700">
                <button className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100" onClick={() => { setFilterType(null); fetchResults(); }}>Show All</button>
                <button className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100" onClick={() => setFilterType("subject")}>By Subject</button>
                <button className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100" onClick={() => setFilterType("class")}>By Class</button>
                <button className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100" onClick={() => setFilterType("exam")}>By Exam</button>
                <button className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100" onClick={() => setFilterType("subject_class")}>By Subject & Class</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-md">
          {filterType === "subject" && (
            <div className="mt-2 p-2 border rounded-md bg-white shadow-md max-w-md">
              <h3 className="text-base font-semibold text-blue-800 mb-2">🎓 Filter by Subject</h3>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Select Subject</label>
              <Select
                options={subjects}
                value={subjects.find(s => s.value === filter.subject) || null}
                onChange={(selected) => handleFilterChange("subject", selected ? selected.value : "")}
                placeholder="Select Subject"
                isClearable
                className="w-full text-xs"
              />
              <div className="mt-2 text-right">
                <button
                  onClick={() => { handleFilterChange("subject", ""); setFilterType(null); }}
                  className="bg-blue-600 hover:bg-blue-800 text-white px-3 py-1 rounded-md shadow-sm text-xs"
                >
                  Clear Filter
                </button>
              </div>
            </div>
          )}

          {filterType === "class" && (
            <div className="mt-2 p-2 border rounded-md bg-white shadow-md max-w-md">
              <h3 className="text-base font-semibold text-blue-800 mb-2">🏫 Filter by Class</h3>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Select Class</label>
              <Select
                options={classes}
                value={classes.find(c => c.value === filter.class_schedule) || null}
                onChange={(selected) => handleFilterChange("class_schedule", selected ? selected.value : "")}
                placeholder="Select Class"
                isClearable
                className="w-full text-xs"
              />
              <div className="mt-2 text-right">
                <button
                  onClick={() => { handleFilterChange("class_schedule", ""); setFilterType(null); }}
                  className="bg-blue-600 hover:bg-blue-800 text-white px-3 py-1 rounded-md shadow-sm text-xs"
                >
                  Clear Filter
                </button>
              </div>
            </div>
          )}

          {filterType === "exam" && (
            <div className="mt-2 p-2 border rounded-md bg-white shadow-md max-w-md">
              <h3 className="text-base font-semibold text-blue-800 mb-2">📅 Filter by Exam</h3>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Select Exam</label>
              <Select
                options={exams}
                value={exams.find(e => e.value === filter.exam) || null}
                onChange={(selected) => handleFilterChange("exam", selected ? selected.value : "")}
                placeholder="Select Exam"
                isClearable
                className="w-full text-xs"
              />
              <div className="mt-2 text-right">
                <button
                  onClick={() => { handleFilterChange("exam", ""); setFilterType(null); }}
                  className="bg-blue-600 hover:bg-blue-800 text-white px-3 py-1 rounded-md shadow-sm text-xs"
                >
                  Clear Filter
                </button>
              </div>
            </div>
          )}

          {filterType === "subject_class" && (
            <div className="mt-2 p-2 border rounded-md bg-white shadow-md max-w-lg">
              <h3 className="text-base font-semibold text-blue-800 mb-2">📊 Filter by Subject & Class</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Select Subject</label>
                  <Select
                    options={subjects}
                    value={subjects.find(s => s.value === filter.subject) || null}
                    onChange={(selected) => handleFilterChange("subject", selected ? selected.value : "")}
                    placeholder="Select Subject"
                    isClearable
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Select Class</label>
                  <Select
                    options={classes}
                    value={classes.find(c => c.value === filter.class_schedule) || null}
                    onChange={(selected) => handleFilterChange("class_schedule", selected ? selected.value : "")}
                    placeholder="Select Class"
                    isClearable
                    className="w-full text-xs"
                  />
                </div>
                <div className="sm:col-span-2 text-right mt-2">
                  <button
                    onClick={() => { handleCombinedFilter("", ""); setFilterType(null); }}
                    className="bg-blue-600 hover:bg-blue-800 text-white px-3 py-1 rounded-md shadow-sm text-xs"
                  >
                    Clear Filter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-2">
        {canAdd && showForm && (
          <div className="p-2 bg-white rounded-md shadow-md border border-gray-200 max-w-md mx-auto mb-2">
            <h2 className="text-base font-semibold text-blue-800 mb-2">
              {editingResult ? "Edit Result" : "Create New Result"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Class</label>
                <Select
                  options={classes}
                  value={selectedClass}
                  onChange={(selected) => {
                    setSelectedClass(selected);
                    setNewResult({ ...newResult, student: "" });
                    if (selected) fetchStudents(selected.value);
                    else setStudents([]);
                  }}
                  placeholder="Select Class"
                  isClearable
                  className="w-full text-xs"
                  isDisabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Student</label>
                <Select
                  options={students}
                  value={students.find(s => s.value === newResult.student) || null}
                  onChange={(selected) => setNewResult({ ...newResult, student: selected ? selected.value : "" })}
                  placeholder="Select Student"
                  isClearable
                  isDisabled={!selectedClass || isLoading || students.length === 0}
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Exam</label>
                <Select
                  options={exams}
                  value={exams.find(e => e.value === newResult.exam) || null}
                  onChange={(selected) => setNewResult({ ...newResult, exam: selected ? selected.value : "" })}
                  placeholder="Select Exam"
                  isClearable
                  isDisabled={isLoading}
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Subject</label>
                <Select
                  options={subjects}
                  value={subjects.find(s => s.value === newResult.subject) || null}
                  onChange={(selected) => setNewResult({ ...newResult, subject: selected ? selected.value : "" })}
                  placeholder="Select Subject"
                  isClearable
                  isDisabled={isLoading}
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Marks Obtained</label>
                <input
                  type="number"
                  placeholder="e.g. 106.00"
                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={newResult.marks_obtained}
                  onChange={(e) => setNewResult({ ...newResult, marks_obtained: e.target.value })}
                  min="0"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Total Marks</label>
                <input
                  type="number"
                  placeholder="e.g. 150.00"
                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={newResult.total_marks}
                  onChange={(e) => setNewResult({ ...newResult, total_marks: e.target.value })}
                  min="0"
                  disabled={isLoading}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. DFGHJK"
                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={newResult.remarks}
                  onChange={(e) => setNewResult({ ...newResult, remarks: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="mt-2 text-right">
              <button
                onClick={handleSaveResult}
                className="bg-blue-600 hover:bg-blue-800 text-white font-medium px-3 py-1 rounded-md shadow-sm text-xs transition duration-150"
                disabled={isLoading}
              >
                {editingResult ? "Update Result" : "Save Result"}
              </button>
            </div>
          </div>
        )}

        {results.length > 0 ? (
          <div>
            <Buttons data={results} columns={columns} filename="StudentResults" />
            <h2 className="text-base font-semibold text-white bg-blue-900 px-2 py-0.5 rounded-t-md">Student Results</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 bg-white min-w-[400px]">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-300 p-0.5 text-center text-xs">ID</th>
                    <th className="border border-gray-300 p-0.5 text-center text-xs">Student Name</th>
                    <th className="border border-gray-300 p-0.5 text-center text-xs">Subject</th>
                    <th className="border border-gray-300 p-0.5 text-center text-xs">Marks Obtained</th>
                    <th className="border border-gray-300 p-0.5 text-center text-xs">Total Marks</th>
                    <th className="border border-gray-300 p-0.5 text-center text-xs">Grade</th>
                    <th className="border border-gray-300 p-0.5 text-center text-xs">Remarks</th>
                    {(canEdit || canDelete || canView) && (
                      <th className="border border-gray-300 p-0.5 text-center text-xs">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={result.id}>
                      {/* Sequence number */}
                      <td className="border border-gray-300 p-0.5 text-center text-xs">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      <td className="border border-gray-300 p-0.5 text-xs">{result.student_name}</td>
                      <td className="border border-gray-300 p-0.5 text-xs">{result.subject_name}</td>
                      <td className="border border-gray-300 p-0.5 text-center text-xs">{result.marks_obtained}</td>
                      <td className="border border-gray-300 p-0.5 text-center text-xs">{result.total_marks}</td>
                      <td className="border border-gray-300 p-0.5 text-center text-xs">{result.grade}</td>
                      <td className="border border-gray-300 p-0.5 text-xs">{result.remarks}</td>
                      {(canEdit || canDelete || canView) && (
                        <td className="border border-gray-300 p-0.5 flex justify-center gap-1 text-xs">
                          {canView && (
                            <button onClick={() => setViewModalData(result)} className="text-blue-600">
                              <MdVisibility size={18} />
                            </button>
                          )}
                          {canEdit && (
                            <MdEdit
                              onClick={() => handleEditResult(result)}
                              className="text-yellow-500 cursor-pointer hover:text-yellow-700"
                              size={18}
                            />
                          )}
                          {canDelete && (
                            <MdDelete
                              onClick={() => handleDeleteResult(result.id)}
                              className="text-red-500 cursor-pointer hover:text-red-700"
                              size={18}
                            />
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 text-xs">No results available.</p>
        )}

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

      {viewModalData && canView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-2">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[70vh] border border-gray-200 p-3 overflow-y-auto">
            <div className="mb-3 border-b pb-1">
              <h3 className="text-lg font-bold text-blue-800 text-center">📄 Student Result Details</h3>
            </div>
            <div className="grid grid-cols-1 gap-y-1 text-xs text-gray-700">
              <div className="font-semibold text-blue-900 border-b pb-0.5">👤 Student Information</div>
              <div><span className="font-semibold">Student Name:</span> {viewModalData.student_name}</div>
              <div><span className="font-semibold">Class:</span> {viewModalData.class_name}</div>
              <div><span className="font-semibold">Exam:</span> {viewModalData.exam_term}</div>
              <div><span className="font-semibold">Subject:</span> {viewModalData.subject_name}</div>
              <div className="font-semibold text-blue-900 border-b pt-1 pb-0.5">📋 Result Details</div>
              <div><span className="font-semibold">Marks Obtained:</span> {viewModalData.marks_obtained}</div>
              <div><span className="font-semibold">Total Marks:</span> {viewModalData.total_marks}</div>
              <div><span className="font-semibold">Grade:</span> {viewModalData.grade}</div>
              <div><span className="font-semibold">Remarks:</span> {viewModalData.remarks || "—"}</div>
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