import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdVisibility } from "react-icons/md";
import Select from "react-select";
import Buttons from "../../components/Buttons";
import Toaster from "../../components/Toaster";
import TableComponent from "../../components/TableComponent"; // Import the reusable TableComponent

const FinalResults = () => {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [filterType, setFilterType] = useState(null);
  const [filter, setFilter] = useState({ student: "", class_name: "", exam: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [viewModalData, setViewModalData] = useState(null);
  const [toaster, setToaster] = useState({ message: "", type: "success" });

  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}final-results/`;

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canView = permissions.includes("users.view_finalresult");

  // Toast helper
  const showToast = (message, type = "success") => {
    setToaster({ message, type });
  };

  const fetchResults = async (page = 1, size = 10, filters = {}) => {
    try {
      setIsLoading(true);
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
        return;
      }

      let url = `${API_URL}?page=${page}&page_size=${size}`;
      if (filters.student) url += `&student=${filters.student}`;
      if (filters.class_name) url += `&class_name=${filters.class_name}`;
      if (filters.exam) url += `&exam=${filters.exam}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data.data;
      if (Array.isArray(data.results)) {
        setResults(data.results);
      } else {
        throw new Error("Unexpected API response format.");
      }
    } catch (error) {
      console.error("Error fetching results:", error.response || error.message);
      showToast("Failed to fetch final results. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
        return;
      }
      const response = await axios.get(`${API}api/auth/users/list_profiles/student/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data.data?.results || [];
      setStudents(data.map(s => ({ value: s.profile_id, label: `${s.first_name} ${s.last_name} (ID: ${s.profile_id})` })));
    } catch (error) {
      console.error("Error fetching students:", error.response || error.message);
      showToast("Failed to fetch students. Please try again.", "error");
    }
  };

  const fetchClasses = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
        return;
      }
      const response = await axios.get(`${API}classes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data.data?.results || [];
      setClasses(data.map(c => ({ value: c.id, label: `${c.class_name} - ${c.section} (${c.session})` })));
    } catch (error) {
      console.error("Error fetching classes:", error.response || error.message);
      showToast("Failed to fetch classes. Please try again.", "error");
    }
  };

  const fetchExams = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
        return;
      }
      const response = await axios.get(`${API}exams/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data.results || [];
      setExams(data.map(e => ({ value: e.exam_id, label: e.term_name })));
    } catch (error) {
      console.error("Error fetching exams:", error.response || error.message);
      showToast("Failed to fetch exams. Please try again.", "error");
    }
  };

  const handleFilterChange = (field, value) => {
    setFilter(prevFilter => {
      const newFilter = { ...prevFilter, [field]: value };
      fetchResults(1, 10, newFilter);
      return newFilter;
    });
  };

  const handleFilterSubmit = () => {
    fetchResults(1, 10, filter);
    setFilterType(null);
  };

  const selectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: "2rem",
      fontSize: "0.85rem",
    }),
    menu: (provided) => ({
      ...provided,
      fontSize: "0.85rem",
      maxHeight: "200px",
      overflowY: "auto",
    }),
    option: (provided) => ({
      ...provided,
      fontSize: "0.85rem",
      padding: "0.5rem",
    }),
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchResults(), fetchStudents(), fetchClasses(), fetchExams()]);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const columns = [
    { key: "sequence", label: "S.No", render: (row, index) => index + 1 },
    { key: "student_name", label: "Student" },
    { key: "class_name", label: "Class" },
    { key: "exam_term", label: "Term" },
    { key: "total_marks_obtained", label: "Marks" },
    { key: "total_marks", label: "Total" },
    { key: "percentage", label: "%", render: (row) => `${row.percentage}%` },
    { key: "grade", label: "Grade" },
    { key: "pending_subjects", label: "Pending" },
    {
      key: "is_complete",
      label: "Status",
      render: (row) => (
        <span
          className={`px-1 py-0.5 text-xs font-semibold ${
            row.is_complete ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {row.is_complete ? "Complete" : "Incomplete"}
        </span>
      ),
    },
    ...(canView
      ? [
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex justify-center">
                <button
                  onClick={() => setViewModalData(row)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <MdVisibility size={16} />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const tableData = results.map((res, index) => ({
    id: res.id,
    sequence: (index + 1),
    student_name: res.student_name,
    class_name: res.class_name,
    exam_term: res.exam_term,
    total_marks_obtained: res.total_marks_obtained,
    total_marks: res.total_marks,
    percentage: res.percentage,
    grade: res.grade,
    pending_subjects: res.pending_subjects,
    is_complete: res.is_complete,
  }));

  return (
    <div className="p-2 sm:p-4">
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={3000}
        onClose={() => setToaster({ message: "", type: "success" })}
      />
      <div className="bg-blue-900 text-white py-2 px-3 sm:px-4 rounded-md flex flex-col sm:flex-row justify-between items-center gap-2">
        <h1 className="text-lg sm:text-xl font-bold">Manage Final Results</h1>
        {canView && (
          <button
            onClick={() => setFilterType(filterType ? null : "menu")}
            className="bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-700 text-sm sm:text-base"
          >
            {filterType ? "Close Filter" : "Filter Data"}
          </button>
        )}
      </div>

      {canView && filterType === "menu" && (
        <div className="mt-4 bg-white p-4 sm:p-6 rounded-lg shadow-md max-w-full md:max-w-4xl mx-auto">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Filter Final Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
              <Select
                name="student"
                value={students.find(s => s.value === filter.student) || null}
                onChange={(selected) => handleFilterChange("student", selected?.value || "")}
                options={students}
                placeholder="Select Student"
                isClearable
                styles={selectStyles}
                isLoading={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
              <Select
                name="class_name"
                value={classes.find(c => c.value === filter.class_name) || null}
                onChange={(selected) => handleFilterChange("class_name", selected?.value || "")}
                options={classes}
                placeholder="Select Class"
                isClearable
                styles={selectStyles}
                isLoading={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam</label>
              <Select
                name="exam"
                value={exams.find(e => e.value === filter.exam) || null}
                onChange={(selected) => handleFilterChange("exam", selected?.value || "")}
                options={exams}
                placeholder="Select Exam"
                isClearable
                styles={selectStyles}
                isLoading={isLoading}
              />
            </div>
          </div>
          <div className="text-right">
            <button
              onClick={handleFilterSubmit}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      <div className="p-2 sm:p-4">
        {isLoading ? (
          <p className="text-center text-gray-600 mt-8">Loading...</p>
        ) : results.length === 0 && !filterType ? (
          <div className="mt-6 p-6 bg-gray-50 rounded-lg shadow-md border border-gray-200 max-w-4xl mx-auto text-center">
            <p className="text-gray-500 text-lg font-medium">No final results added yet.</p>
          </div>
        ) : (
          <div>
            <Buttons
              data={tableData}
              columns={columns.filter((col) => col.key !== "actions")} // Exclude actions column for export
              filename="Final_Results_Report"
            />
            {/* <h2 className="text-base font-semibold text-white bg-blue-900 px-2 py-1 rounded-t-md">
              Final Results
            </h2> */}
            <TableComponent
              data={tableData}
              columns={columns}
              initialSort={{ key: "sequence", direction: "asc" }}
            />
          </div>
        )}
      </div>

      {viewModalData && canView && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-3">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fadeIn">
            <div className="px-5 py-3 border-b bg-blue-50 text-center">
              <h3 className="text-base font-bold text-blue-800 flex items-center justify-center gap-2">
                📄 Final Result Details
              </h3>
            </div>
            <div className="px-5 py-4 overflow-y-auto max-h-[65vh] text-sm text-gray-700 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-blue-900 border-b pb-1 mb-2">
                  👤 Student Information
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-gray-500 font-medium">Name</span>
                    <span className="font-semibold">{viewModalData.student_name}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-gray-500 font-medium">Class</span>
                    <span className="font-semibold">{viewModalData.class_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Term</span>
                    <span className="font-semibold">{viewModalData.exam_term}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-900 border-b pb-1 mb-2">
                  📋 Result
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-gray-500 font-medium">Marks Obtained</span>
                    <span className="font-semibold text-green-700">{viewModalData.total_marks_obtained}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-gray-500 font-medium">Total Marks</span>
                    <span className="font-semibold">{viewModalData.total_marks}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-gray-500 font-medium">Percentage</span>
                    <span className="font-semibold text-blue-700">{viewModalData.percentage}%</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-gray-500 font-medium">Grade</span>
                    <span className="font-semibold text-purple-700">{viewModalData.grade}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-gray-500 font-medium">Pending Subjects</span>
                    <span className="font-semibold text-red-600">{viewModalData.pending_subjects}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Status</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        viewModalData.is_complete ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {viewModalData.is_complete ? "Complete" : "Incomplete"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Remarks</span>
                    <span className="font-semibold">{viewModalData.remarks || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center px-5 py-3 border-t bg-gray-50">
              <button
                onClick={() => setViewModalData(null)}
                className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg shadow text-sm font-medium transition"
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

export default FinalResults;