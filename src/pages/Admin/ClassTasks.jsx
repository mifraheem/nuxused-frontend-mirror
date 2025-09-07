import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from 'js-cookie'; // Import js-cookie
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import Select from "react-select";
import { Buttons } from "../../components";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster";// Your custom toaster

const ClassTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    class_schedule: "",
    title: "",
    description: "",
    start_date: "",
    due_date: "",
    file: null,
  });
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [classOptions, setClassOptions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  // Custom Toaster state
  const [toaster, setToaster] = useState({ message: '', type: 'success' });

  // API configuration
  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}class-tasks/`;

  // Custom toast function
  const showToast = (message, type = 'success') => {
    setToaster({ message, type });
  };

  // Get permissions and auth token
  const getAuthToken = () => {
    try {
      const token = Cookies.get('access_token');
      if (!token) {
        console.error("No access_token found in cookies.");
        return null;
      }
      return token;
    } catch (error) {
      console.error("Error accessing cookies:", error);
      return null;
    }
  };

  const getPermissions = () => {
    try {
      return JSON.parse(localStorage.getItem("user_permissions") || "[]");
    } catch (error) {
      return ["users.add_classtask", "users.change_classtask", "users.delete_classtask", "users.view_classtask"];
    }
  };

  const permissions = getPermissions();
  const canAdd = permissions.includes("users.add_classtask");
  const canEdit = permissions.includes("users.change_classtask");
  const canDelete = permissions.includes("users.delete_classtask");
  const canView = permissions.includes("users.view_classtask");

  if (!canView) {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">
        🚫 You do not have permission to view class tasks.
      </div>
    );
  }

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        showToast("No authentication token found. Please log in again.", "error");
        console.error("No access_token found in localStorage.");
        return;
      }
      const url = `${API_URL}`;
      console.log("Fetching tasks with URL:", url);
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Tasks API response:", res.data);

      const results = res.data?.results || [];
      if (!Array.isArray(results)) {
        console.error("API response 'results' is not an array:", results);
        showToast("Invalid API response format.", "error");
        setTasks([]);
        return;
      }
      setTasks(results);
      console.log("Updated tasks state:", results);
      setTotalPages(res.data?.total_pages || 1);
      setTotalItems(res.data?.total_items || 0);

      if (results.length === 0) {
        console.warn("No tasks found in response.");
      }
    } catch (err) {
      console.error("Fetch tasks error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers,
      });
      showToast(
        err.response?.data?.message || `Failed to fetch tasks: ${err.message}`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchClassOptions = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        showToast("No authentication token found. Please log in again.", "error");
        console.error("No access_token found in localStorage.");
        return;
      }
      console.log("Fetching class options with URL:", `${API}classes/`);
      const res = await axios.get(`${API}/classes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const classes = res.data?.data?.results || res.data?.results || [];
      console.log("Class options response:", classes);
      setClassOptions(Array.isArray(classes) ? classes : []);
      if (classes.length === 0) {
        console.warn("No classes found in response.");
        showToast("No classes available to select.", "error");
      }
    } catch (err) {
      console.error("Fetch classes error:", err.response?.data || err.message);
      showToast(err.response?.data?.message || "Failed to load classes.", "error");
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!newTask.title || !newTask.description || !newTask.class_schedule || !newTask.start_date || !newTask.due_date) {
      showToast("All fields are required!", "error");
      return;
    }

    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append("class_schedule", newTask.class_schedule);
      formData.append("title", newTask.title);
      formData.append("description", newTask.description);
      formData.append("start_date", newTask.start_date);
      formData.append("due_date", newTask.due_date);
      if (newTask.file) formData.append("file", newTask.file);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      console.log("Saving task with payload:", newTask);

      if (editingTask) {
        await axios.patch(`${API_URL}${editingTask.id}/`, formData, config);
        showToast("Task updated successfully!", "success");
      } else {
        await axios.post(API_URL, formData, config);
        showToast("Task created successfully!", "success");
      }

      fetchTasks();
      setShowForm(false);
      setNewTask({ class_schedule: "", title: "", description: "", start_date: "", due_date: "", file: null });
      setEditingTask(null);
    } catch (err) {
      console.error("Create/Update error:", err.response?.data || err.message);
      showToast(err.response?.data?.message || "Operation failed.", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      showToast("You do not have permission to delete tasks.", "error");
      return;
    }

    // Using custom confirmation toast
    showToast(
      {
        message: "Are you sure you want to delete this task?",
        type: "confirm",
        onConfirm: async () => {
          try {
            const token = getAuthToken();
            await axios.delete(`${API_URL}${id}/`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            showToast("Task deleted successfully!", "success");
            fetchTasks();
          } catch (err) {
            console.error("Delete error:", err.response?.data || err.message);
            showToast(err.response?.data?.message || "Failed to delete task.", "error");
          }
        },
        onCancel: () => setToaster({ message: "", type: "success" })
      },
      "confirmation"
    );
  };

  const handleFileChange = (e) => {
    setNewTask({ ...newTask, file: e.target.files[0] });
  };

  useEffect(() => {
    fetchTasks();
    fetchClassOptions();
  }, [page, pageSize]);

  // Determine the class ID field based on classOptions structure
  const classIdField = classOptions.length > 0 && classOptions[0].uuid ? "uuid" : "id";

  // Map class_schedule ID to class name for display
  const getClassName = (classSchedule) => {
    const classOption = classOptions.find((cls) => cls[classIdField] === classSchedule);
    return classOption
      ? `${classOption.class_name || "Unknown"} - ${classOption.section || ""} (${classOption.session || ""})`
      : classSchedule || "N/A";
  };

  // No Tasks Empty State Component
  const NoTasksMessage = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border-2 border-dashed border-blue-300 mx-2 mt-4">
      <div className="w-24 h-24 mb-6 text-blue-300">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-blue-800 mb-2">No Tasks Yet</h3>
      <p className="text-blue-600 mb-4 max-w-md">
        No class tasks have been created yet. Start by adding your first task to keep students engaged!
      </p>

      {canAdd && (
        <button
          onClick={() => {
            setShowForm(true);
            setNewTask({ class_schedule: "", title: "", description: "", start_date: "", due_date: "", file: null });
            setEditingTask(null);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
        >
          <div className="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full mr-2">
            <span className="text-white text-base font-bold">+</span>
          </div>
          Create Your First Task
        </button>
      )}
    </div>
  );

  return (
    <div className="p-6">
      {/* Custom Toaster */}
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={3000}
        onClose={() => setToaster({ message: "", type: "success" })}
        onConfirm={toaster.onConfirm}
        onCancel={toaster.onCancel}
      />

      <div className="flex justify-between items-center bg-blue-900 text-white px-6 py-3 rounded-md">
        <h1 className="text-xl font-bold">Class Tasks</h1>
        {canAdd && (
          <button
            onClick={() => {
              setShowForm((prev) => !prev);
              setNewTask({ class_schedule: "", title: "", description: "", start_date: "", due_date: "", file: null });
              setEditingTask(null);
            }}
            className="bg-cyan-400 px-4 py-2 rounded shadow hover:bg-cyan-500 text-xs"
          >
            {showForm ? "Close Form" : "Add Task"}
          </button>
        )}
      </div>

      {showForm && (canAdd || canEdit) && (
        <div className="bg-white p-6 rounded-lg shadow-md my-4">
          <h2 className="text-lg font-semibold mb-4">
            {editingTask ? "Edit Task" : "Create Task"}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                Class Schedule <span className="text-red-500">*</span>
              </label>
              <Select
                value={classOptions.find((cls) => cls[classIdField] === newTask.class_schedule) || null}
                onChange={(selected) => {
                  console.log("Selected class:", selected);
                  setNewTask((prev) => {
                    const updated = { ...prev, class_schedule: selected?.[classIdField] || "" };
                    console.log("Updated newTask:", updated);
                    return updated;
                  });
                }}
                options={classOptions}
                getOptionLabel={(cls) => `${cls.class_name || "Unknown"} - ${cls.section || ""} (${cls.session || ""})`}
                getOptionValue={(cls) => cls[classIdField]}
                placeholder="Select Class"
                isClearable
                className="text-xs"
                classNamePrefix="react-select"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Title"
                className="p-2 border rounded w-full text-xs"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="p-2 border rounded w-full text-xs"
                value={newTask.start_date}
                onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="p-2 border rounded w-full text-xs"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Description"
                className="p-2 border rounded w-full text-xs"
                value={newTask.description}
                rows={4}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              ></textarea>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                Attachment (Optional)
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="p-2 border rounded w-full text-xs"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setEditingTask(null);
                setNewTask({ class_schedule: "", title: "", description: "", start_date: "", due_date: "", file: null });
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateOrUpdate}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-xs"
            >
              {editingTask ? "Update" : "Save"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading tasks...</span>
        </div>
      ) : tasks.length === 0 ? (
        <NoTasksMessage />
      ) : (
        <>
          <Buttons
            data={tasks.map((t, index) => ({
              "S.No": (page - 1) * pageSize + index + 1,
              ID: t.id,
              Title: t.title,
              Description: t.description,
              "Start Date": t.start_date ? new Date(t.start_date).toLocaleDateString() : "N/A",
              "Due Date": t.due_date ? new Date(t.due_date).toLocaleDateString() : "N/A",
              "Teacher Name": t.teacher_name || "N/A",
              School: t.school || "N/A",
              "Created Date": t.created ? new Date(t.created).toLocaleDateString() : "N/A",
            }))}
            columns={[
              { label: "S.No", key: "S.No" },
              { label: "ID", key: "ID" },
              { label: "Title", key: "Title" },
              { label: "Description", key: "Description" },
              { label: "Start Date", key: "Start Date" },
              { label: "Due Date", key: "Due Date" },
              { label: "Teacher Name", key: "Teacher Name" },
              { label: "School", key: "School" },
              { label: "Created Date", key: "Created Date" },
            ]}
            filename="Class_Tasks_Report"
          />
          <h2 className="text-lg font-semibold text-white bg-blue-900 px-4 py-2 rounded-t-md mt-4">
            Tasks ({totalItems} total)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border bg-white rounded-b-md">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 border text-xs font-semibold text-gray-700">S.No</th>
                  <th className="p-2 border text-xs font-semibold text-gray-700">Title</th>
                  <th className="p-2 border text-xs font-semibold text-gray-700">Description</th>
                  <th className="p-2 border text-xs font-semibold text-gray-700">Start Date</th>
                  <th className="p-2 border text-xs font-semibold text-gray-700">Due Date</th>
                  <th className="p-2 border text-xs font-semibold text-gray-700">Teacher</th>
                  <th className="p-2 border text-xs font-semibold text-gray-700">School</th>
                  {(canEdit || canDelete) && (
                    <th className="p-2 border text-xs font-semibold text-gray-700">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, index) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="p-2 border text-xs text-gray-800 text-center">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="p-2 border text-xs text-gray-800">
                      <span className="block max-w-[150px] truncate" title={t.title}>
                        {t.title}
                      </span>
                    </td>
                    <td className="p-2 border text-xs text-gray-800">
                      <span className="block max-w-[200px] truncate" title={t.description}>
                        {t.description.length > 50 ? `${t.description.slice(0, 50)}...` : t.description}
                      </span>
                    </td>
                    <td className="p-2 border text-xs text-gray-800">
                      {t.start_date ? new Date(t.start_date).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="p-2 border text-xs text-gray-800">
                      {t.due_date ? new Date(t.due_date).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="p-2 border text-xs text-gray-800">
                      <span className="block max-w-[120px] truncate" title={t.teacher_name}>
                        {t.teacher_name || "N/A"}
                      </span>
                    </td>
                    <td className="p-2 border text-xs text-gray-800">
                      <span className="block max-w-[150px] truncate" title={t.school}>
                        {t.school || "N/A"}
                      </span>
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="p-2 border flex gap-2 justify-center text-xs">
                        <MdVisibility
                          onClick={() => setSelectedTask(t)}
                          className="text-blue-600 cursor-pointer hover:text-blue-800"
                          size={20}
                          title="View"
                        />
                        {canEdit && (
                          <MdEdit
                            onClick={() => {
                              setEditingTask(t);
                              setShowForm(true);
                              setNewTask({
                                class_schedule: t.class_schedule || "",
                                title: t.title,
                                description: t.description,
                                start_date: t.start_date?.split("T")[0] || "",
                                due_date: t.due_date?.split("T")[0] || "",
                                file: null,
                              });
                            }}
                            className="text-yellow-500 cursor-pointer hover:text-yellow-700"
                            size={20}
                            title="Edit"
                          />
                        )}
                        {canDelete && (
                          <MdDelete
                            onClick={() => handleDelete(t.id)}
                            className="text-red-500 cursor-pointer hover:text-red-700"
                            size={20}
                            title="Delete"
                          />
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={(newPage) => {
          setPage(newPage);
        }}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        totalItems={totalItems}
        showPageSizeSelector={true}
        showPageInfo={true}
      />

      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-xl font-bold text-blue-800">📋 Task Details</h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-500 hover:text-red-600 text-lg font-semibold"
                aria-label="Close"
              >
                ✖
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm text-gray-700">
              <div>
                <span className="font-semibold text-gray-800">📌 Title:</span><br />
                <span className="ml-1">{selectedTask.title}</span>
              </div>

              <div>
                <span className="font-semibold text-gray-800">📝 Description:</span>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mt-1 text-gray-800">
                  {selectedTask.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-gray-800">📅 Start Date:</span><br />
                  <span className="ml-1">{selectedTask.start_date ? new Date(selectedTask.start_date).toLocaleDateString() : "N/A"}</span>
                </div>

                <div>
                  <span className="font-semibold text-gray-800">⏰ Due Date:</span><br />
                  <span className="ml-1">{selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : "N/A"}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-gray-800">👨‍🏫 Teacher:</span><br />
                <span className="ml-1">{selectedTask.teacher_name || "N/A"}</span>
              </div>

              <div>
                <span className="font-semibold text-gray-800">🏫 School:</span><br />
                <span className="ml-1">{selectedTask.school || "N/A"}</span>
              </div>

              {selectedTask.file && (
                <div>
                  <span className="font-semibold text-gray-800">📎 Attachment:</span><br />
                  <a
                    href={selectedTask.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-blue-600 hover:text-blue-800 underline"
                  >
                    Download File
                  </a>
                </div>
              )}

              <div>
                <span className="font-semibold text-gray-800">📅 Created:</span><br />
                <span className="ml-1">{selectedTask.created ? new Date(selectedTask.created).toLocaleString() : "N/A"}</span>
              </div>

              <div>
                <span className="font-semibold text-gray-800">🆔 ID:</span><br />
                <span className="ml-1 font-mono text-xs bg-gray-100 px-2 py-1 rounded">{selectedTask.id}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md shadow text-xs"
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

export default ClassTasks;