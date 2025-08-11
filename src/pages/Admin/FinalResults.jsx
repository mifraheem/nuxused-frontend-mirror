import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { MdVisibility } from "react-icons/md";
import Select from "react-select";
import { Buttons } from "../../components";

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

  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}/final-results/`;

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canView = permissions.includes("users.view_finalresult");

  const fetchResults = async (page = 1, size = pageSize, filters = {}) => {
    try {
      setIsLoading(true);
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
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
      toast.error("Failed to fetch final results. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }
      const response = await axios.get(`${API}/api/auth/users/list_profiles/student/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data.data?.results || [];
      setStudents(data.map(s => ({ value: s.profile_id, label: `${s.first_name} ${s.last_name} (ID: ${s.profile_id})` })));
    } catch (error) {
      console.error("Error fetching students:", error.response || error.message);
      toast.error("Failed to fetch students. Please try again.");
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
      const data = response.data.data?.results || [];
      setClasses(data.map(c => ({ value: c.id, label: `${c.class_name} - ${c.section} (${c.session})` })));
    } catch (error) {
      console.error("Error fetching classes:", error.response || error.message);
      toast.error("Failed to fetch classes. Please try again.");
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
      const data = response.data.results || [];
      setExams(data.map(e => ({ value: e.exam_id, label: e.term_name })));
    } catch (error) {
      console.error("Error fetching exams:", error.response || error.message);
      toast.error("Failed to fetch exams. Please try again.");
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

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) fetchResults(page, pageSize, filter);
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
    <div className="p-2">
      <Toaster position="top-center" />
      <div className="bg-blue-900 text-white py-1 px-2 rounded-md flex justify-between items-center">
        <h1 className="text-lg font-bold">Manage Final Results</h1>
        <div className="relative">
        </div>
      </div>

      <div className="p-2">
        {isLoading ? (
          <p className="text-center text-gray-600 mt-8">Loading...</p>
        ) : (
          <div>
            <Buttons
              data={results.map((res) => ({
                ID: res.id,
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
                { label: "ID", key: "ID" },
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

            <h2 className="text-base font-semibold text-white bg-blue-900 px-2 py-0.5 rounded-t-md">Final Results</h2>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300 text-xs bg-white min-w-[400px]">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border p-0.5 whitespace-nowrap text-center">ID</th>
                    <th className="border p-0.5 whitespace-nowrap text-center">Student</th>
                    <th className="border p-0.5 whitespace-nowrap text-center">Class</th>
                    <th className="border p-0.5 whitespace-nowrap text-center">Term</th>
                    <th className="border p-0.5 whitespace-nowrap text-center">Marks</th>
                    <th className="border p-0.5 whitespace-nowrap text-center">Total</th>
                    <th className="border p-0.5 whitespace-nowrap text-center">%</th>
                    <th className="border p-0.5 whitespace-nowrap text-center">Grade</th>
                    <th className="border p-0.5 whitespace-nowrap text-center">Pending</th>
                    <th className="border p-0.5 whitespace-nowrap text-center">Status</th>
                    {canView && <th className="border p-0.5 whitespace-nowrap text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {results.length > 0 ? (
                    results.map((result) => (
                      <tr key={result.id}>
                        <td className="border p-0.5 text-center whitespace-nowrap">{result.id}</td>
                        <td className="border p-0.5 whitespace-nowrap">{result.student_name}</td>
                        <td className="border p-0.5 whitespace-nowrap">{result.class_name}</td>
                        <td className="border p-0.5 whitespace-nowrap">{result.exam_term}</td>
                        <td className="border p-0.5 text-center whitespace-nowrap">{result.total_marks_obtained}</td>
                        <td className="border p-0.5 text-center whitespace-nowrap">{result.total_marks}</td>
                        <td className="border p-0.5 text-center whitespace-nowrap">{result.percentage}%</td>
                        <td className="border p-0.5 text-center whitespace-nowrap">{result.grade}</td>
                        <td className="border p-0.5 text-center whitespace-nowrap">{result.pending_subjects}</td>
                        <td className="border p-0.5 text-center whitespace-nowrap">
                          <span className={`px-0.5 py-0 text-xs font-semibold ${result.is_complete
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                            }`}>
                            {result.is_complete ? "Complete" : "Incomplete"}
                          </span>
                        </td>
                        {canView && (
                          <td className="border p-0.5 flex justify-center whitespace-nowrap">
                            <button onClick={() => setViewModalData(result)} className="text-blue-600">
                              <MdVisibility />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="12" className="text-center text-gray-500 py-1 whitespace-nowrap">
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center bg-blue-50 p-1 rounded-b-md mt-1">
              <div className="flex items-center gap-1 mb-1 sm:mb-0">
                <label className="text-gray-700 font-semibold text-xs">Page Size:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded-md px-1 py-0 text-xs"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-1 py-0 rounded-md font-semibold text-xs ${currentPage === 1 ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-white hover:bg-gray-100"}`}
                >
                  Prev
                </button>
                <span className="px-1 py-0 bg-blue-600 text-white font-bold rounded-md text-xs">{currentPage}</span>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-1 py-0 rounded-md font-semibold text-xs ${currentPage === totalPages ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-white hover:bg-gray-100"}`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {viewModalData && canView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-2">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm max-h-[70vh] border border-gray-200 p-2 overflow-hidden">
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
                  <span className={`ml-0.5 px-0.5 py-0 rounded-full text-xs font-semibold ${viewModalData.is_complete
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
                className="px-2 py-0.5 bg-blue-700 text-white rounded-full shadow hover:bg-blue-800 text-xs"
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