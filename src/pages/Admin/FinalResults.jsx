import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdVisibility } from "react-icons/md";
import Select from "react-select";
import Buttons from "../../components/Buttons";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster"; // Import custom Toaster component

const FinalResults = () => {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterType, setFilterType] = useState(null);
  const [filter, setFilter] = useState({ student: "", class_name: "", exam: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [viewModalData, setViewModalData] = useState(null);
  const [toaster, setToaster] = useState({ message: "", type: "success" });

  const API = import.meta.env.VITE_SERVER_URL ;
  const API_URL = `${API}/final-results/`;

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canView = permissions.includes("users.view_finalresult");

  // Toast helper
  const showToast = (message, type = "success") => {
    setToaster({ message, type });
  };

  const fetchResults = async (page = 1, size = pageSize, filters = {}) => {
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

      console.log("API Request URL:", url); // Debug log to check the URL
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
      const response = await axios.get(`${API}/api/auth/users/list_profiles/student/`, {
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
      const response = await axios.get(`${API}/classes/`, {
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
      const response = await axios.get(`${API}/exams/`, {
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
      setCurrentPage(1);
      fetchResults(1, pageSize, newFilter);
      return newFilter;
    });
  };

  const handleFilterSubmit = () => {
    fetchResults(1, pageSize, filter);
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
  }, [pageSize]);

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
              data={results.map((res, index) => ({
                Sequence: (currentPage - 1) * pageSize + index + 1,
                // ID: res.id,
                Student: res.student_name,
                Class: res.class_name,
                Exam: res.exam_term,
                "Marks Obtained": res.total_marks_obtained,
                "Total Marks": res.total_marks,
                Percentage: `${res.percentage}%`,
                Grade: res.grade,
                "Pending Subjects": res.pending_subjects,
                Status: res.is_complete ? "Complete" : "Incomplete",
              }))}
              columns={[
                { label: "S.No", key: "Sequence" },
                // { label: "ID", key: "ID" },
                { label: "Student", key: "Student" },
                { label: "Class", key: "Class" },
                { label: "Exam", key: "Exam" },
                { label: "Marks Obtained", key: "Marks Obtained" },
                { label: "Total Marks", key: "Total Marks" },
                { label: "Percentage", key: "Percentage" },
                { label: "Grade", key: "Grade" },
                { label: "Pending Subjects", key: "Pending Subjects" },
                { label: "Status", key: "Status" },
              ]}
              filename="Final_Results_Report"
            />

            <h2 className="text-base font-semibold text-white bg-blue-900 px-2 py-1 rounded-t-md">Final Results</h2>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300 text-xs bg-white min-w-[400px]">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border p-1 whitespace-nowrap text-center">S.No</th>
                    <th className="border p-1 whitespace-nowrap text-center">Student</th>
                    <th className="border p-1 whitespace-nowrap text-center">Class</th>
                    <th className="border p-1 whitespace-nowrap text-center">Term</th>
                    <th className="border p-1 whitespace-nowrap text-center">Marks</th>
                    <th className="border p-1 whitespace-nowrap text-center">Total</th>
                    <th className="border p-1 whitespace-nowrap text-center">%</th>
                    <th className="border p-1 whitespace-nowrap text-center">Grade</th>
                    <th className="border p-1 whitespace-nowrap text-center">Pending</th>
                    <th className="border p-1 whitespace-nowrap text-center">Status</th>
                    {canView && <th className="border p-1 whitespace-nowrap text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={result.id}>
                      <td className="border p-1 text-center whitespace-nowrap">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="border p-1 whitespace-nowrap">{result.student_name}</td>
                      <td className="border p-1 whitespace-nowrap">{result.class_name}</td>
                      <td className="border p-1 whitespace-nowrap">{result.exam_term}</td>
                      <td className="border p-1 text-center whitespace-nowrap">{result.total_marks_obtained}</td>
                      <td className="border p-1 text-center whitespace-nowrap">{result.total_marks}</td>
                      <td className="border p-1 text-center whitespace-nowrap">{result.percentage}%</td>
                      <td className="border p-1 text-center whitespace-nowrap">{result.grade}</td>
                      <td className="border p-1 text-center whitespace-nowrap">{result.pending_subjects}</td>
                      <td className="border p-1 text-center whitespace-nowrap">
                        <span className={`px-1 py-0.5 text-xs font-semibold ${result.is_complete
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                          }`}>
                          {result.is_complete ? "Complete" : "Incomplete"}
                        </span>
                      </td>
                      {canView && (
                        <td className="border p-1 flex justify-center whitespace-nowrap">
                          <button onClick={() => setViewModalData(result)} className="text-blue-600 hover:text-blue-800">
                            <MdVisibility size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={(page) => {
                setCurrentPage(page);
                fetchResults(page, pageSize, filter);
              }}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
                fetchResults(1, size, filter);
              }}
              totalItems={results.length}
              showPageSizeSelector={true}
              showPageInfo={true}
            />
          </div>
        )}
      </div>

      {viewModalData && canView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-2">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm max-h-[70vh] border border-gray-200 p-3 overflow-hidden">
            <div className="overflow-y-auto max-h-[60vh] pr-1">
              <div className="mb-2 border-b pb-1">
                <h3 className="text-sm font-bold text-blue-800 text-center">📄 Final Result Details</h3>
              </div>
              <div className="grid grid-cols-1 gap-1 text-xs text-gray-700">
                <div className="col-span-1 font-semibold text-blue-900 border-b pb-0.5">👤 Student Info</div>
                <div><span className="font-semibold">ID:</span> {viewModalData.student}</div>
                <div><span className="font-semibold">Name:</span> {viewModalData.student_name}</div>
                <div><span className="font-semibold">Class:</span> {viewModalData.class_name}</div>
                <div><span className="font-semibold">Exam ID:</span> {viewModalData.exam}</div>
                <div><span className="font-semibold">Term:</span> {viewModalData.exam_term}</div>
                <div className="col-span-1 font-semibold text-blue-900 border-b pt-1 pb-0.5">📋 Result</div>
                <div><span className="font-semibold">Marks:</span> {viewModalData.total_marks_obtained}</div>
                <div><span className="font-semibold">Total:</span> {viewModalData.total_marks}</div>
                <div><span className="font-semibold">%</span> {viewModalData.percentage}%</div>
                <div><span className="font-semibold">Grade:</span> {viewModalData.grade}</div>
                <div><span className="font-semibold">Pending:</span> {viewModalData.pending_subjects}</div>
                <div><span className="font-semibold">Status:</span>
                  <span className={`ml-0.5 px-1 py-0.5 rounded-full text-xs font-semibold ${viewModalData.is_complete
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                    }`}>
                    {viewModalData.is_complete ? "Complete" : "Incomplete"}
                  </span>
                </div>
                <div className="col-span-1"><span className="font-semibold">Remarks:</span> {viewModalData.remarks || "—"}</div>
              </div>
            </div>
            <div className="mt-2 text-center">
              <button
                onClick={() => setViewModalData(null)}
                className="px-3 py-1 bg-blue-700 text-white rounded-full shadow hover:bg-blue-800 text-xs"
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