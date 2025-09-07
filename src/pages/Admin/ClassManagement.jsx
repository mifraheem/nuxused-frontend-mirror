import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdEdit, MdDelete } from "react-icons/md";
import { Buttons } from "../../components";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster"; // Import custom Toaster component

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [newClass, setNewClass] = useState({
    class_name: "",
    section: "",
    session: "",
  });
  const [editClass, setEditClass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toaster, setToaster] = useState({ message: "", type: "success" });
  const [confirmResolve, setConfirmResolve] = useState(null);

  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}classes/`;

  const showToast = (message, type = "success") => {
    setToaster({ message, type });
  };

  const confirmToast = (message = "Are you sure you want to delete this class?") => {
    return new Promise((resolve) => {
      setConfirmResolve(() => resolve); // Store the resolve function
      setToaster({
        message: (
          <div className="flex flex-col gap-4">
            <p className="text-lg font-medium">{message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setToaster({ message: "", type: "success" });
                  resolve(true);
                }}
                className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
              >
                Yes
              </button>
              <button
                onClick={() => {
                  setToaster({ message: "", type: "success" });
                  resolve(false);
                }}
                className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
              >
                No
              </button>
            </div>
          </div>
        ),
        type: "confirmation",
      });
    });
  };

  const fetchClasses = async (page = 1, size = pageSize) => {
    setLoading(true);
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
        return;
      }

      const response = await axios.get(`${API_URL}?page=${page}&page_size=${size}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 && Array.isArray(response.data.data.results)) {
        setClasses(response.data.data.results);
        setCurrentPage(response.data.data.current_page);
        setTotalPages(response.data.data.total_pages);
      } else {
        throw new Error("Unexpected API response format.");
      }
    } catch (error) {
      console.error("Error fetching classes:", error.response || error.message);
      showToast("Failed to fetch classes. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchClasses(page, pageSize);
    }
  };

  const handleSaveClass = async () => {
    if (!newClass.class_name || !newClass.section || !newClass.session) {
      showToast("All fields are required!", "error");
      return;
    }

    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
        return;
      }

      const url = editClass ? `${API_URL}${editClass.id}/` : API_URL;
      const method = editClass ? "put" : "post";

      const requestData = {
        class_name: newClass.class_name,
        section: newClass.section,
        session: newClass.session,
        students: [],
        is_ended: false
      };

      const response = await axios[method](url, requestData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 201 || response.status === 200) {
        showToast(`Class ${editClass ? "updated" : "created"} successfully!`, "success");
        fetchClasses();
        setNewClass({ class_name: "", section: "", session: "" });
        setEditClass(null);
        setShowForm(false);
      } else {
        throw new Error("Unexpected server response.");
      }
    } catch (error) {
      console.error("Error saving class:", error.response || error.message);
      showToast("Failed to save class. Please check your input.", "error");
    }
  };

  const handleDeleteClass = async (id) => {
    if (!canDelete) {
      showToast(
        <div className="text-center font-semibold p-4 bg-red-100 border border-red-400 rounded shadow-md">
          🚫 You do not have permission to delete classes.
          <div className="mt-3">
            <button
              onClick={() => setToaster({ message: "", type: "success" })}
              className="mt-2 px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>,
        "error"
      );
      return;
    }

    const ok = await confirmToast("Are you sure you want to delete this class?");
    if (ok) {
      try {
        const token = Cookies.get("access_token");
        if (!token) {
          showToast("User is not authenticated.", "error");
          return;
        }

        await axios.delete(`${API_URL}${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        showToast("Class deleted successfully!", "success");
        fetchClasses(currentPage, pageSize);
      } catch (error) {
        console.error("Error deleting class:", error.response || error.message);
        showToast("Failed to delete class.", "error");
      }
    }
  };

  useEffect(() => {
    fetchClasses(1, pageSize);
  }, [pageSize]);

  const columns = [
    { label: "Class", key: "class_name" },
    { label: "Section", key: "section" },
    { label: "Session", key: "session" },
  ];

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canAdd = permissions.includes("users.add_classname");
  const canEdit = permissions.includes("users.change_classname");
  const canDelete = permissions.includes("users.delete_classname");
  const canView = permissions.includes("users.view_classname");

  return (
    <div>
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={3000}
        onClose={() => setToaster({ message: "", type: "success" })}
      />
      <div className="bg-blue-900 text-white py-2 px-6 rounded-md flex justify-between items-center mt-5">
        <h1 className="text-xl font-bold">Class Management</h1>
        {canAdd && (
          <button
            onClick={() => {
              setShowForm((prev) => !prev);
              if (showForm) {
                setEditClass(null);
                setNewClass({ class_name: "", section: "", session: "" });
              }
            }}
            className="flex items-center px-3 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-500 transition"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-black rounded-full mr-3">
              <span className="text-cyan-500 text-xl font-bold">{showForm ? "-" : "+"}</span>
            </div>
            {showForm ? "Close Form" : "Add New Class"}
          </button>
        )}
      </div>

      <div className="p-6">
        {showForm && (
          <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 max-w-xl mx-auto mb-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              {editClass ? "Edit Class Details" : "Create New Class"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                <input
                  type="text"
                  placeholder="e.g. 10th"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newClass.class_name}
                  onChange={(e) => setNewClass({ ...newClass, class_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <input
                  type="text"
                  placeholder="e.g. A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newClass.section}
                  onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                <input
                  type="text"
                  placeholder="e.g. 2024-2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newClass.session}
                  onChange={(e) => setNewClass({ ...newClass, session: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={handleSaveClass}
                className="bg-blue-600 hover:bg-blue-800 text-white font-medium px-6 py-2 rounded-md shadow-sm transition duration-150"
              >
                {editClass ? "Update Class" : "Save Class"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : canView && classes.length > 0 ? (
          <div className="mt-6">
            <Buttons data={classes} columns={columns} filename="Classes" />
            <h2 className="text-lg font-semibold text-white bg-blue-900 px-4 py-2 rounded-t-md">Classes</h2>
            <table className="w-full border-collapse border border-gray-300 bg-white">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-300 p-2">#ID</th>
                  <th className="border border-gray-300 p-2">Class</th>
                  <th className="border border-gray-300 p-2">Section</th>
                  <th className="border border-gray-300 p-2">Session</th>
                  {(canEdit || canDelete) && (
                    <th className="border border-gray-300 p-2">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {classes.map((cls, index) => (
                  <tr className="text-center" key={cls.id}>
                    <td className="border border-gray-300 p-2">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="border border-gray-300 p-2">{cls.class_name}</td>
                    <td className="border border-gray-300 p-2">{cls.section}</td>
                    <td className="border border-gray-300 p-2">{cls.session}</td>
                    {(canEdit || canDelete) && (
                      <td className="border border-gray-300 p-2 flex justify-center">
                        {canEdit && (
                          <MdEdit
                            onClick={() => {
                              setEditClass(cls);
                              setNewClass({
                                class_name: cls.class_name,
                                section: cls.section,
                                session: cls.session,
                              });
                              setShowForm(true);
                            }}
                            className="text-yellow-500 text-2xl cursor-pointer mx-2 hover:text-yellow-700"
                          />
                        )}
                        {canDelete && (
                          <MdDelete
                            onClick={() => handleDeleteClass(cls.id)}
                            className="text-red-500 text-2xl cursor-pointer mx-2 hover:text-red-700"
                          />
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={goToPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
                fetchClasses(1, size);
              }}
              totalItems={classes.length}
              showPageSizeSelector={true}
              showPageInfo={true}
            />
          </div>
        ) : canView ? (
          <p className="text-center text-gray-500">No classes added yet.</p>
        ) : (
          <p className="text-center text-red-500">You do not have permission to view classes.</p>
        )}
      </div>
    </div>
  );
};

export default ClassManagement;