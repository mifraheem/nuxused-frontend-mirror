import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdEdit, MdDelete } from "react-icons/md";
import { Buttons } from "../../components";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster";
import TableComponent from "../../components/TableComponent"; // Import reusable TableComponent

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({ subject_name: "", course_code: "" });
  const [editSubject, setEditSubject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toaster, setToaster] = useState({ message: "", type: "success", onConfirm: null, onCancel: null });

  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}subjects/`;

  const showToast = (message, type = "success", onConfirm = null, onCancel = null) => {
    setToaster({ message, type, onConfirm, onCancel });
  };

  const fetchSubjects = async (page = 1, size = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error", null, null);
        return;
      }
      const response = await axios.get(`${API_URL}?page=${page}&page_size=${size}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200 && Array.isArray(response.data.data.results)) {
        setSubjects(response.data.data.results);
        setCurrentPage(response.data.data.current_page);
        setTotalPages(response.data.data.total_pages);
      } else {
        throw new Error("Unexpected API response format.");
      }
    } catch (error) {
      console.error("Error fetching subjects:", error.response?.data || error.message);
      setError("Failed to fetch subjects. Please try again later.");
      showToast(
        error.response?.data?.message || "Failed to fetch subjects.",
        "error",
        null,
        null
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSubject = async () => {
    if (!newSubject.subject_name || !newSubject.course_code) {
      showToast("All fields are required!", "error", null, null);
      return;
    }
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error", null, null);
        return;
      }
      const url = editSubject ? `${API_URL}${editSubject.id}/` : API_URL;
      const method = editSubject ? "put" : "post";
      const response = await axios[method](url, newSubject, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 201 || response.status === 200) {
        showToast(`Subject ${editSubject ? "updated" : "created"} successfully!`, "success", null, null);
        fetchSubjects(currentPage, pageSize);
        setNewSubject({ subject_name: "", course_code: "" });
        setEditSubject(null);
        setShowForm(false);
      } else {
        throw new Error("Unexpected server response.");
      }
    } catch (error) {
      console.error("Error saving subject:", error.response?.data || error.message);
      showToast(
        error.response?.data?.message || "Failed to save subject. Please try again.",
        "error",
        null,
        null
      );
    }
  };

  const handleDeleteSubject = (id) => {
    if (!canDelete) {
      showToast("You do not have permission to delete subjects.", "error", null, null);
      return;
    }

    showToast(
      "Are you sure you want to delete this subject?",
      "confirmation",
      async () => {
        try {
          const token = Cookies.get("access_token");
          if (!token) {
            showToast("User is not authenticated.", "error", null, null);
            return;
          }
          await axios.delete(`${API_URL}${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showToast("Subject deleted successfully!", "success", null, null);
          fetchSubjects(currentPage, pageSize);
        } catch (error) {
          console.error("Error deleting subject:", error.response?.data || error.message);
          showToast(
            error.response?.data?.message || "Failed to delete subject. Please try again.",
            "error",
            null,
            null
          );
        }
      },
      () => {
        showToast("", "success", null, null);
      }
    );
  };

  useEffect(() => {
    fetchSubjects(1, pageSize);
  }, [pageSize]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) fetchSubjects(page, pageSize);
  };

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canAdd = permissions.includes("users.add_subject");
  const canEdit = permissions.includes("users.change_subject");
  const canDelete = permissions.includes("users.delete_subject");
  const canView = permissions.includes("users.view_subject");

  // Table columns configuration
  const columns = [
    {
      key: "index",
      label: "#ID",
      render: (row, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      key: "subject_name",
      label: "Subject Name",
      render: (row) => row.subject_name || "N/A",
    },
    {
      key: "course_code",
      label: "Course Code",
      render: (row) => row.course_code || "N/A",
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex justify-center space-x-2">
          {canEdit && (
            <MdEdit
              onClick={() => {
                setEditSubject(row);
                setNewSubject({ subject_name: row.subject_name, course_code: row.course_code });
                setShowForm(true);
              }}
              className="text-yellow-500 text-2xl cursor-pointer hover:text-yellow-700"
            />
          )}
          {canDelete && (
            <MdDelete
              onClick={() => handleDeleteSubject(row.id)}
              className="text-red-500 text-2xl cursor-pointer hover:text-red-700"
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={3000}
        onClose={() => setToaster({ message: "", type: "success", onConfirm: null, onCancel: null })}
        onConfirm={toaster.onConfirm}
        onCancel={toaster.onCancel}
        allowNoDataErrors={true}
      />
      <div className="bg-blue-900 text-white py-2 px-6 rounded-md flex justify-between items-center mt-5">
        <h1 className="text-xl font-bold">Subject Management</h1>
        {canAdd && (
          <button
            onClick={() => {
              setShowForm((prev) => !prev);
              if (showForm) {
                setEditSubject(null);
                setNewSubject({ subject_name: "", course_code: "" });
              }
            }}
            className="flex items-center px-3 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-500 transition"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-black rounded-full mr-3">
              <span className="text-cyan-500 text-xl font-bold">{showForm ? "-" : "+"}</span>
            </div>
            {showForm ? "Close Form" : "Add Subject"}
          </button>
        )}
      </div>

      <div className="p-6">
        {canAdd && showForm && (
          <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 max-w-xl mx-auto mb-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              {editSubject ? "Edit Subject Details" : "Create New Subject"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newSubject.subject_name}
                  onChange={(e) => setNewSubject({ ...newSubject, subject_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                <input
                  type="text"
                  placeholder="e.g. MATH-101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newSubject.course_code}
                  onChange={(e) => setNewSubject({ ...newSubject, course_code: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={handleSaveSubject}
                className="bg-blue-600 hover:bg-blue-800 text-white font-medium px-6 py-2 rounded-md shadow-sm transition duration-150"
              >
                {editSubject ? "Update Subject" : "Save Subject"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : canView && subjects.length > 0 ? (
          <div className="mt-1">
            <Buttons data={subjects} columns={columns.slice(0, -1)} filename="Subjects" />
            {/* <h2 className="text-lg font-semibold text-white bg-blue-900 px-4 py-2 rounded-t-md">Subjects</h2> */}
            <div className="overflow-x-auto">
              <TableComponent
                data={subjects}
                columns={columns}
                initialSort={{ key: "subject_name", direction: "asc" }}
              />
            </div>
           
          </div>
        ) : canView ? (
          <p className="text-center text-gray-500">No subjects added yet.</p>
        ) : (
          <p className="text-center text-red-500">You do not have permission to view subjects.</p>
        )}
      </div>
    </div>
  );
};

export default SubjectManagement;