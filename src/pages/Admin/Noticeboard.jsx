import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import { Buttons } from "../../components";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster";
import TableComponent from "../../components/TableComponent"; // Import reusable TableComponent

const Noticeboard = () => {
  const [notices, setNotices] = useState([]);
  const [editingNotice, setEditingNotice] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [newNotice, setNewNotice] = useState({
    title: "",
    description: "",
    announced_for: "all",
  });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [toaster, setToaster] = useState({ message: "", type: "success", onConfirm: null, onCancel: null });

  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}announcements/`;

  const showToast = (message, type = "success", onConfirm = null, onCancel = null) => {
    setToaster({ message, type, onConfirm, onCancel });
  };

  // Fetch notices from the API
  const fetchNotices = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error", null, null);
        return;
      }

      const response = await axios.get(
        `${API_URL}?page=${page}&page_size=${pageSize}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = response.data?.data || {};

      if (Array.isArray(data.results)) {
        setNotices(data.results);
        setTotalPages(data.total_pages || 1);
      } else {
        throw new Error("Unexpected API response format.");
      }
    } catch (error) {
      console.error("Error fetching notices:", error.response?.data || error.message);
      setError("Failed to fetch notices. Please try again later.");
      showToast(
        error.response?.data?.message || "Failed to fetch notices.",
        "error",
        null,
        null
      );
    } finally {
      setLoading(false);
    }
  };

  // Create a new notice
  const handleAddNotice = async () => {
    if (!newNotice.title || !newNotice.description) {
      showToast("All fields are required!", "error", null, null);
      return;
    }

    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error", null, null);
        return;
      }

      const response = await axios.post(
        API_URL,
        { ...newNotice },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 201) {
        showToast("Notice created successfully!", "success", null, null);
        fetchNotices();
        setNewNotice({ title: "", description: "", announced_for: "all" });
        setShowForm(false);
      } else {
        throw new Error("Unexpected server response.");
      }
    } catch (error) {
      console.error("Error creating notice:", error.response?.data || error.message);
      showToast(
        error.response?.data?.message || "Failed to create notice. Please try again.",
        "error",
        null,
        null
      );
    }
  };

  // Delete a notice with confirmation
  const handleDeleteNotice = (id) => {
    if (!canDelete) {
      showToast("You do not have permission to delete announcements.", "error", null, null);
      return;
    }

    showToast(
      "Are you sure you want to delete this notice?",
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
          showToast("Notice deleted successfully!", "success", null, null);
          fetchNotices();
        } catch (error) {
          console.error("Error deleting notice:", error.response?.data || error.message);
          showToast(
            error.response?.data?.message || "Failed to delete notice. Please try again.",
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

  // Handle Edit Notice
  const handleEditNotice = (notice) => {
    setEditingNotice(notice);
    setNewNotice(notice);
    setShowForm(true);
  };

  // Handle View Notice
  const handleViewNotice = (notice) => {
    setSelectedNotice(notice);
  };

  // Update Notice
  const handleUpdateNotice = async () => {
    if (!newNotice.title || !newNotice.description) {
      showToast("All fields are required!", "error", null, null);
      return;
    }

    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error", null, null);
        return;
      }

      const response = await axios.put(
        `${API_URL}${editingNotice.id}/`,
        { ...newNotice },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        showToast("Notice updated successfully!", "success", null, null);
        fetchNotices();
        setShowForm(false);
        setNewNotice({ title: "", description: "", announced_for: "all" });
        setEditingNotice(null);
      } else {
        throw new Error("Failed to update notice");
      }
    } catch (error) {
      console.error("Error updating notice:", error.response?.data || error.message);
      showToast(
        error.response?.data?.message || "Failed to update notice. Please try again.",
        "error",
        null,
        null
      );
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [page, pageSize]);

  // Get permissions from localStorage
  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canAdd = permissions.includes("users.add_announcement");
  const canEdit = permissions.includes("users.change_announcement");
  const canDelete = permissions.includes("users.delete_announcement");
  const canPerformActions = canEdit || canDelete;

  // Columns for TableComponent
  const tableColumns = [
    {
      key: "index",
      label: "ID#",
      render: (row, index) => (page - 1) * pageSize + index + 1,
    },
    {
      key: "title",
      label: "Title",
      render: (row) => row.title || "—",
    },
    {
      key: "description",
      label: "Description",
      render: (row) =>
        row.description?.length > 50
          ? `${row.description.slice(0, 50)}...`
          : row.description || "—",
    },
    {
      key: "announced_for",
      label: "Audience",
      render: (row) => row.announced_for ? row.announced_for.charAt(0).toUpperCase() + row.announced_for.slice(1) : "—",
    },
    ...(canPerformActions ? [{
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => handleViewNotice(row)}
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            title="View Notice"
          >
            <MdVisibility size={18} />
          </button>
          {canEdit && (
            <button
              onClick={() => handleEditNotice(row)}
              className="text-yellow-600 hover:text-yellow-800 transition-colors duration-200"
              title="Edit Notice"
            >
              <MdEdit size={18} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDeleteNotice(row.id)}
              className="text-red-600 hover:text-red-800 transition-colors duration-200"
              title="Delete Notice"
            >
              <MdDelete size={18} />
            </button>
          )}
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={3000}
        onClose={() => setToaster({ message: "", type: "success", onConfirm: null, onCancel: null })}
        onConfirm={toaster.onConfirm}
        onCancel={toaster.onCancel}
        allowNoDataErrors={true}
      />
      <div className="bg-gradient-to-r from-blue-900 to-blue-900 text-white py-3 px-4 sm:px-6 rounded-xl flex justify-between items-center mt-5 shadow-lg">
        <h1 className="text-lg sm:text-xl font-bold">School Noticeboard</h1>
        {canAdd && (
          <button
            onClick={() => {
              setShowForm((prev) => !prev);
              setEditingNotice(null);
              setNewNotice({ title: "", description: "", announced_for: "all" });
            }}
            className="flex items-center px-3 py-2 bg-cyan-500 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-600 text-sm sm:text-base transition-colors duration-200"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-gray-800 rounded-full mr-2">
              <span className="text-cyan-400 text-xl font-bold">
                {showForm ? "-" : "+"}
              </span>
            </div>
            {showForm ? "Close Form" : "Add New Notice"}
          </button>
        )}
      </div>

      <div className="p-4 sm:p-6">
        {/* Notice Form */}
        {(canAdd || canEdit) && showForm && (
          <div className="p-4 sm:p-6 bg-white rounded-xl shadow-md border border-gray-200 max-w-2xl mx-auto mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">
              {editingNotice ? "Edit Notice" : "Create Notice"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Enter notice title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newNotice.title}
                  onChange={(e) =>
                    setNewNotice({ ...newNotice, title: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Announced For
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newNotice.announced_for}
                  onChange={(e) =>
                    setNewNotice({ ...newNotice, announced_for: e.target.value })
                  }
                >
                  <option value="all">All</option>
                  <option value="students">Students</option>
                  <option value="teachers">Teachers</option>
                  <option value="parents">Parents</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Enter notice description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="4"
                  value={newNotice.description}
                  onChange={(e) =>
                    setNewNotice({ ...newNotice, description: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm shadow-sm transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={editingNotice ? handleUpdateNotice : handleAddNotice}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm shadow-sm transition-colors duration-200"
              >
                {editingNotice ? "Update Notice" : "Save Notice"}
              </button>
            </div>
          </div>
        )}
        {/* Data table */}
        {loading ? (
          <p className="text-center text-gray-600 text-lg font-medium mt-10">Loading...</p>
        ) : error ? (
          <p className="text-center text-red-600 text-lg font-medium mt-10">{error}</p>
        ) : notices.length > 0 ? (
          <div className="mt-1">
            <div className=" mb-4 gap-3">
             
              <Buttons
                data={notices.map((n, index) => ({
                  "S.No": (page - 1) * pageSize + index + 1,
                  Title: n.title,
                  Description: n.description,
                  Audience: n.announced_for,
                }))}
                columns={[
                  { label: "S.No", key: "S.No" },
                  { label: "Title", key: "Title" },
                  { label: "Description", key: "Description" },
                  { label: "Audience", key: "Audience" },
                ]}
                filename="Notices_Report"
              />
            </div>
            <div className="overflow-x-auto">
              <TableComponent
                data={notices}
                columns={tableColumns}
                initialSort={{ key: "title", direction: "asc" }}
              />
            </div>
            {/* <Pagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={(newPage) => {
                setPage(newPage);
                fetchNotices();
              }}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
                fetchNotices();
              }}
              totalItems={notices.length}
              showPageSizeSelector={true}
              showPageInfo={true}
            /> */}
          </div>
        ) : (
          <p className="text-center text-gray-600 text-lg font-medium mt-10">No notices available.</p>
        )}
      </div>

      {/* View Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 px-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-50">
              <h2 className="text-lg font-bold text-blue-900">📢 Notice Details</h2>
              <button
                onClick={() => setSelectedNotice(null)}
                className="text-gray-600 hover:text-red-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto max-h-[65vh] space-y-5 text-sm text-gray-700">
              <div>
                <div className="text-gray-600 font-medium">📝 Title</div>
                <div className="mt-1 text-gray-800 font-semibold truncate">
                  {selectedNotice.title || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-gray-600 font-medium">📄 Description</div>
                <div className="mt-1 p-3 bg-gray-100 rounded border border-gray-200 max-h-[150px] overflow-y-auto whitespace-pre-wrap leading-relaxed text-gray-800">
                  {selectedNotice.description || "No description provided."}
                </div>
              </div>
              <div>
                <div className="text-gray-600 font-medium">🎯 Audience</div>
                <div className="mt-1 text-gray-800 capitalize">
                  {selectedNotice.announced_for || "N/A"}
                </div>
              </div>
            </div>
            <div className="flex justify-end px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setSelectedNotice(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium shadow text-sm transition-colors duration-200"
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

export default Noticeboard;