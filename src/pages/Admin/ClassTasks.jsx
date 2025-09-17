import React, { useState, useEffect, useContext } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import Cookies from 'js-cookie';
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import Select from "react-select";
import { Buttons } from "../../components";
import Toaster from "../../components/Toaster";
import TableComponent from "../../components/TableComponent"; // Adjust the import path as needed

const ClassTasks = () => {
  const { isSidebarOpen } = useOutletContext();
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
  const [toaster, setToaster] = useState({ message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  // API configuration
  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}class-tasks/`;

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
        return;
      }
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const results = res.data?.results || [];
      if (!Array.isArray(results)) {
        showToast("Invalid API response format.", "error");
        setTasks([]);
        return;
      }
      setTasks(results);
      setTotalItems(res.data?.total_items || results.length);
    } catch (err) {
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
        return;
      }
      const res = await axios.get(`${API}/classes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const classes = res.data?.data?.results || res.data?.results || [];
      setClassOptions(Array.isArray(classes) ? classes : []);
      if (classes.length === 0) {
        showToast("No classes available to select.", "error");
      }
    } catch (err) {
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
      showToast(err.response?.data?.message || "Operation failed.", "error");
    }
  };

  const showToast = (message, type = 'success', onConfirm, onCancel) => {
    setToaster({ message, type, onConfirm, onCancel });
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      showToast("You do not have permission to delete tasks.", "error");
      return;
    }

    showToast(
      "Are you sure you want to delete this task?",
      "confirmation",
      async () => {
        try {
          const token = getAuthToken();
          await axios.delete(`${API_URL}${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showToast("Task deleted successfully!", "success");
          fetchTasks();
        } catch (err) {
          showToast(
            "Failed to delete task: " + (err.response?.data?.message || err.message),
            "error"
          );
        }
      },
      () => {
        showToast("Delete cancelled", "error");
      }
    );
  };

  const handleFileChange = (e) => {
    setNewTask({ ...newTask, file: e.target.files[0] });
  };

  useEffect(() => {
    fetchTasks();
    fetchClassOptions();
  }, []);

  const classIdField = classOptions.length > 0 && classOptions[0].uuid ? "uuid" : "id";

  const getClassName = (classSchedule) => {
    const classOption = classOptions.find((cls) => cls[classIdField] === classSchedule);
    return classOption
      ? `${classOption.class_name || "Unknown"} - ${classOption.section || ""} (${classOption.session || ""})`
      : classSchedule || "N/A";
  };

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

  // Define columns for TableComponent with dynamic widths based on sidebar
  const columns = [
    {
      key: "S.No",
      label: "S.NO",
      render: (_, index) => index + 1,
    },
    {
      key: "Title",
      label: "TITLE",
      render: (row) => (
        <span className={`block truncate ${isSidebarOpen ? 'max-w-[80px] sm:max-w-[120px]' : 'max-w-[120px] sm:max-w-[150px]'}`} title={row.title}>
          {row.title}
        </span>
      ),
    },
    {
      key: "Description",
      label: "DESCRIPTION",
      render: (row) => (
        <span className={`block truncate ${isSidebarOpen ? 'max-w-[100px] sm:max-w-[150px]' : 'max-w-[150px] sm:max-w-[200px]'}`} title={row.description}>
          {row.description.length > 20 ? `${row.description.slice(0, 20)}...` : row.description}
        </span>
      ),
    },
    {
      key: "Start Date",
      label: "START DATE",
      render: (row) => (row.start_date ? new Date(row.start_date).toLocaleDateString() : "N/A"),
    },
    {
      key: "Due Date",
      label: "DUE DATE",
      render: (row) => (row.due_date ? new Date(row.due_date).toLocaleDateString() : "N/A"),
    },
    {
      key: "Teacher Name",
      label: "TEACHER",
      render: (row) => (
        <span className={`block truncate ${isSidebarOpen ? 'max-w-[80px] sm:max-w-[100px]' : 'max-w-[100px] sm:max-w-[120px]'}`} title={row.teacher_name}>
          {row.teacher_name || "N/A"}
        </span>
      ),
    },
    {
      key: "School",
      label: "SCHOOL",
      render: (row) => (
        <span className={`block truncate ${isSidebarOpen ? 'max-w-[80px] sm:max-w-[120px]' : 'max-w-[120px] sm:max-w-[150px]'}`} title={row.school}>
          {row.school || "N/A"}
        </span>
      ),
    },
    ...(canEdit || canDelete
      ? [
          {
            key: "Actions",
            label: "ACTIONS",
            render: (row) => (
              <div className="flex gap-1 justify-center">
                <MdVisibility
                  onClick={() => setSelectedTask(row)}
                  className="text-blue-600 cursor-pointer hover:text-blue-800"
                  size={18}
                  title="View"
                />
                {canEdit && (
                  <MdEdit
                    onClick={() => {
                      setEditingTask(row);
                      setShowForm(true);
                      setNewTask({
                        class_schedule: row.class_schedule || "",
                        title: row.title,
                        description: row.description,
                        start_date: row.start_date?.split("T")[0] || "",
                        due_date: row.due_date?.split("T")[0] || "",
                        file: null,
                      });
                    }}
                    className="text-yellow-500 cursor-pointer hover:text-yellow-700"
                    size={18}
                    title="Edit"
                  />
                )}
                {canDelete && (
                  <MdDelete
                    onClick={() => handleDelete(row.id)}
                    className="text-red-500 cursor-pointer hover:text-red-700"
                    size={18}
                    title="Delete"
                  />
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  // Map tasks data for TableComponent
  const tableData = tasks.map((task, index) => ({
    ...task,
    "S.No": index + 1,
  }));

  return (
    <div className="p-4 sm:p-6 max-w-full">
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={3000}
        onClose={() => setToaster({ message: "", type: "success" })}
        onConfirm={toaster.onConfirm}
        onCancel={toaster.onCancel}
      />

      <div className="flex justify-between items-center bg-blue-900 text-white px-4 sm:px-6 py-3 rounded-md">
        <h1 className="text-lg sm:text-xl font-bold">Class Tasks</h1>
        {canAdd && (
          <button
            onClick={() => {
              setShowForm((prev) => !prev);
              setNewTask({ class_schedule: "", title: "", description: "", start_date: "", due_date: "", file: null });
              setEditingTask(null);
            }}
            className="bg-cyan-400 px-3 sm:px-4 py-2 rounded shadow hover:bg-cyan-500 text-xs sm:text-sm"
          >
            {showForm ? "Close Form" : "Add Task"}
          </button>
        )}
      </div>

      {showForm && (canAdd || canEdit) && (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md my-4">
          <h2 className="text-lg font-semibold mb-4">
            {editingTask ? "Edit Task" : "Create Task"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                Class Schedule <span className="text-red-500">*</span>
              </label>
              <Select
                value={classOptions.find((cls) => cls[classIdField] === newTask.class_schedule) || null}
                onChange={(selected) => {
                  setNewTask({ ...newTask, class_schedule: selected?.[classIdField] || "" });
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
            <div className="col-span-1 sm:col-span-2">
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
            <div className="col-span-1 sm:col-span-2">
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
              className="bg-gray-500 text-white px-3 sm:px-4 py-2 rounded hover:bg-gray-600 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateOrUpdate}
              className="bg-green-500 text-white px-3 sm:px-4 py-2 rounded hover:bg-green-600 text-xs"
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
              "S.No": index + 1,
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
          {/* <h2 className="text-lg font-semibold text-white bg-blue-900 px-4 py-2 rounded-t-md mt-4">
            Tasks ({totalItems} total)
          </h2> */}
          <div className={`max-w-full overflow-x-auto ${isSidebarOpen ? 'pr-4' : ''}`}>
            <TableComponent
              data={tableData}
              columns={columns}
              initialSort={{ key: "S.No", direction: "asc" }}
            />
          </div>
        </>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fadeIn">
            <div className="flex justify-between items-center px-5 py-3 border-b bg-blue-50">
              <h2 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                📋 Task Details
              </h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition"
                aria-label="Close"
              >
                ✖
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto max-h-[65vh] text-sm text-gray-700 space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">📌 Title</span>
                <span className="font-semibold text-gray-800 text-right">{selectedTask.title}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500 block mb-1">📝 Description</span>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-800 leading-relaxed">
                  {selectedTask.description || "—"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-500">📅 Start Date</span>
                  <span className="font-semibold text-gray-800">
                    {selectedTask.start_date ? new Date(selectedTask.start_date).toLocaleDateString() : "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-500">⏰ Due Date</span>
                  <span className="font-semibold text-gray-800">
                    {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">👨‍🏫 Teacher</span>
                <span className="font-semibold text-gray-800">{selectedTask.teacher_name || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">🏫 School</span>
                <span className="font-semibold text-gray-800">{selectedTask.school || "N/A"}</span>
              </div>
              {selectedTask.file && (
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium text-gray-500">📎 Attachment</span>
                  <a
                    href={selectedTask.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm underline"
                  >
                    Download File
                  </a>
                </div>
              )}
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">📅 Created</span>
                <span className="font-semibold text-gray-800">
                  {selectedTask.created ? new Date(selectedTask.created).toLocaleString() : "N/A"}
                </span>
              </div>
            </div>
            <div className="flex justify-end px-5 py-3 border-t bg-gray-50">
              <button
                onClick={() => setSelectedTask(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow text-sm font-medium transition"
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