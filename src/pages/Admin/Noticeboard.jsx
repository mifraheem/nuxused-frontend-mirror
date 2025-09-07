import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import { Buttons } from "../../components";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster";

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
  const [toaster, setToaster] = useState({ message: '', type: 'success' });

  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}announcements/`;

  const showToast = (message, type = 'success') => {
    setToaster({ message, type });
  };

  // Fetch notices from the API
  const fetchNotices = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = Cookies.get("access_token");
      if (!token) throw new Error("User is not authenticated.");

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
      console.error("Error fetching notices:", error.response || error.message);
      setError("Failed to fetch notices. Please try again later.");
      showToast("Failed to fetch notices.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Create a new notice
  const handleAddNotice = async () => {
    if (!newNotice.title || !newNotice.description) {
      showToast("All fields are required!", "error");
      return;
    }

    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
        return;
      }

      const response = await axios.post(
        API_URL,
        { ...newNotice },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Create Notice Response:", response.data);

      if (response.status === 201) {
        showToast("Notice created successfully!", "success");
        fetchNotices();
        setNewNotice({ title: "", description: "", announced_for: "all" });
        setShowForm(false);
      } else {
        throw new Error("Unexpected server response.");
      }
    } catch (error) {
      console.error("Error creating notice:", error.response || error.message);
      showToast(
        error.response?.data?.message || "Failed to create notice. Please try again.",
        "error"
      );
    }
  };

  // Delete a notice with confirmation
  const handleDeleteNotice = async (id) => {
    if (!canDelete) {
      showToast("You do not have permission to delete announcements.", "error");
      return;
    }

    showToast(
      {
        message: "Are you sure you want to delete this notice?",
        type: "confirm",
        onConfirm: async () => {
          try {
            const token = Cookies.get("access_token");
            if (!token) {
              throw new Error("User is not authenticated.");
            }
            await axios.delete(`${API_URL}${id}/`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            showToast("Notice deleted successfully!", "success");
            setNotices((prevNotices) => prevNotices.filter((notice) => notice.id !== id));
          } catch (error) {
            console.error("Error deleting notice:", error.response || error.message);
            showToast("Failed to delete notice. Please try again.", "error");
          }
        },
        onCancel: () => setToaster({ message: "", type: "success" })
      },
      "confirm"
    );
  };

  // Function to delete notice (called within handleDeleteNotice)
  const deleteNotice = async (id) => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        throw new Error("User is not authenticated.");
      }

      await axios.delete(`${API_URL}${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showToast("Notice deleted successfully!", "success");
      setNotices((prevNotices) => prevNotices.filter((notice) => notice.id !== id));
    } catch (error) {
      console.error("Error deleting notice:", error.response || error.message);
      showToast("Failed to delete notice. Please try again.", "error");
    }
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
      showToast("All fields are required!", "error");
      return;
    }

    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
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
        showToast("Notice updated successfully!", "success");
        fetchNotices();
        setShowForm(false);
        setNewNotice({ title: "", description: "", announced_for: "all" });
        setEditingNotice(null);
      } else {
        throw new Error("Failed to update notice");
      }
    } catch (error) {
      console.error("Error updating notice:", error);
      showToast("Failed to update notice. Please try again.", "error");
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

  return (
    <div>
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={3000}
        onClose={() => setToaster({ message: "", type: "success" })}
        onConfirm={toaster.onConfirm}
        onCancel={toaster.onCancel}
      />
      <div className="bg-blue-900 text-white py-2 px-6 rounded-md flex justify-between items-center mt-5">
        <h1 className="text-xl font-bold">School Noticeboard</h1>
        {canAdd && (
          <button
            onClick={() => {
              setShowForm((prev) => !prev);
              setEditingNotice(null);
              setNewNotice({ title: "", description: "", announced_for: "all" });
            }}
            className="flex items-center px-3 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-500 transition"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-black rounded-full mr-3">
              <span className="text-cyan-500 text-xl font-bold">
                {showForm ? "-" : "+"}
              </span>
            </div>
            {showForm ? "Close Form" : "Add New Notice"}
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Notice Form */}
        {(canAdd || canEdit) && showForm && (
          <div className="p-6 bg-blue-50 rounded-md mb-6">
            <h2 className="text-lg font-semibold text-blue-900">
              {editingNotice ? "Edit Notice" : "Create Notice"}
            </h2>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* Title */}
              <div>
                <label className="block text-gray-600 font-medium mb-1">
                  Title:
                </label>
                <input
                  type="text"
                  placeholder="Title"
                  className="p-2 border border-gray-300 rounded w-full"
                  value={newNotice.title}
                  onChange={(e) =>
                    setNewNotice({ ...newNotice, title: e.target.value })
                  }
                />
              </div>

              {/* Audience */}
              <div>
                <label className="block text-gray-600 font-medium mb-1">
                  Announced For:
                </label>
                <select
                  className="p-2 border border-gray-300 rounded w-full"
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

              {/* Description */}
              <div className="col-span-2">
                <label className="block text-gray-600 font-medium mb-1">
                  Description:
                </label>
                <textarea
                  placeholder="Description"
                  className="p-2 border border-gray-300 rounded w-full"
                  rows="3"
                  value={newNotice.description}
                  onChange={(e) =>
                    setNewNotice({ ...newNotice, description: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md shadow hover:bg-gray-700 mr-2"
              >
                Cancel
              </button>
              <button
                onClick={editingNotice ? handleUpdateNotice : handleAddNotice}
                className="bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-700"
              >
                {editingNotice ? "Update Notice" : "Save Notice"}
              </button>
            </div>
          </div>
        )}
        {/* data table */}
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : notices.length > 0 ? (
          <div className="mt-6">
            <Buttons
              data={notices.map((n) => ({
                ID: n.id,
                Title: n.title,
                Description: n.description,
                Audience: n.announced_for,
              }))}
              columns={[
                { label: "ID", key: "ID" },
                { label: "Title", key: "Title" },
                { label: "Description", key: "Description" },
                { label: "Audience", key: "Audience" },
              ]}
              filename="Notices_Report"
            />

            <h2 className="text-lg font-semibold text-white bg-blue-900 px-4 py-2 rounded-t-md">
              Notices
            </h2>
            <table className="w-full border-collapse border border-gray-300 bg-white">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-300 p-2">ID#</th>
                  <th className="border border-gray-300 p-2">Title</th>
                  <th className="border border-gray-300 p-2">Description</th>
                  <th className="border border-gray-300 p-2">Audience</th>
                  {(canEdit || canDelete) && (
                    <th className="border border-gray-300 p-2">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {notices.map((notice, index) => (
                  <tr key={notice.id}>
                    <td className="border border-gray-300 p-2 text-center">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {notice.title}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {notice.description.length > 50
                        ? `${notice.description.slice(0, 50)}...`
                        : notice.description}
                    </td>
                    <td className="border border-gray-300 p-2 capitalize">
                      {notice.announced_for}
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="border border-gray-300 p-2 flex justify-center gap-2">
                        <MdVisibility
                          onClick={() => handleViewNotice(notice)}
                          className="text-blue-500 text-2xl cursor-pointer hover:text-blue-700"
                        />
                        {canEdit && (
                          <MdEdit
                            onClick={() => handleEditNotice(notice)}
                            className="text-yellow-500 text-2xl cursor-pointer hover:text-yellow-700"
                          />
                        )}
                        {canDelete && (
                          <MdDelete
                            onClick={() => handleDeleteNotice(notice.id)}
                            className="text-red-500 text-2xl cursor-pointer hover:text-red-700"
                          />
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
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
            />
          </div>
        ) : (
          <p className="text-center text-gray-500">No notices available.</p>
        )}
      </div>

      {/* View Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 px-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-300 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-50">
              <h2 className="text-xl font-bold text-blue-700">📢 Notice Details</h2>
              <button
                onClick={() => setSelectedNotice(null)}
                className="text-gray-600 hover:text-red-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto max-h-[65vh] space-y-5 text-sm text-gray-700">
              <div>
                <div className="text-gray-500 font-medium">📝 Title</div>
                <div className="mt-1 text-gray-800 font-semibold truncate">
                  {selectedNotice.title || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-gray-500 font-medium">📄 Description</div>
                <div className="mt-1 p-3 bg-gray-100 rounded border border-gray-300 max-h-[150px] overflow-y-auto whitespace-pre-wrap leading-relaxed text-gray-800">
                  {selectedNotice.description || "No description provided."}
                </div>
              </div>
              <div>
                <div className="text-gray-500 font-medium">🎯 Audience</div>
                <div className="mt-1 text-gray-800 capitalize">
                  {selectedNotice.announced_for || "N/A"}
                </div>
              </div>
            </div>
            <div className="flex justify-end px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setSelectedNotice(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow transition"
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