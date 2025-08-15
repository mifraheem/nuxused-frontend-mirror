import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import Select from "react-select";
import { Buttons } from "../../components";
import Pagination from "../../components/Pagination";

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

  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}class-tasks/`;

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
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
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("No authentication token found. Please log in again.");
        console.error("No access_token found in Cookies.");
        return;
      }
      console.log("Fetching tasks with URL:", `${API_URL}?page=${page}&page_size=${pageSize}`);
      const response = await axios.get(`${API_URL}?page=${page}&page_size=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Tasks API response:", response.data);

      // Handle the correct API response structure
      const results = response.data?.data?.results || [];
      setTasks(Array.isArray(results) ? results : []);
      setTotalPages(response.data?.data?.total_pages || 1);
      setTotalItems(response.data?.data?.total_items || 0);

      if (results.length === 0) {
        console.warn("No tasks found in response.");
        toast.info("No tasks available.");
      }
    } catch (err) {
      console.error("Fetch tasks error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to load class tasks.");
    } finally {
      setLoading(false);
    }
  };

  const fetchClassOptions = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("No authentication token found. Please log in again.");
        console.error("No access_token found in Cookies.");
        return;
      }
      console.log("Fetching class options with URL:", `${API}classes/?page_size=100`);
      const res = await axios.get(`${API}classes/?page_size=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const classes = res.data?.data?.results || res.data?.results || [];
      console.log("Class options response:", classes);
      setClassOptions(Array.isArray(classes) ? classes : []);
      if (classes.length === 0) {
        console.warn("No classes found in response.");
        toast.warn("No classes available to select.");
      }
    } catch (err) {
      console.error("Fetch classes error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to load class list.");
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchClassOptions();
  }, [page, pageSize]);

  const handleFileChange = (e) => {
    setNewTask({ ...newTask, file: e.target.files[0] });
  };

  const handleSave = async () => {
    const { class_schedule, title, description, start_date, due_date } = newTask;
    if (!class_schedule || !title || !description || !start_date || !due_date) {
      toast.error("All fields are required.");
      return;
    }

    try {
      const token = Cookies.get("access_token");
      const formData = new FormData();
      formData.append("class_schedule", class_schedule);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("start_date", start_date);
      formData.append("due_date", due_date);
      if (newTask.file) formData.append("file", newTask.file);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      console.log("Saving task with payload:", Object.fromEntries(formData));

      if (editingTask) {
        // Use PATCH for updates
        const response = await axios.patch(`${API_URL}${editingTask.id}/`, formData, config);
        toast.success(response.data?.message || "Task updated successfully");
      } else {
        const response = await axios.post(API_URL, formData, config);
        toast.success(response.data?.message || "Task created successfully");
      }

      setShowForm(false);
      setNewTask({
        class_schedule: "",
        title: "",
        description: "",
        start_date: "",
        due_date: "",
        file: null,
      });
      setEditingTask(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      fetchTasks();
    } catch (err) {
      console.error("Create/Update error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to save task");
    }
  };

  const handleEdit = (task) => {
    setNewTask({
      class_schedule: task.class_schedule,
      title: task.title,
      description: task.description,
      start_date: task.start_date?.split("T")[0] || "",
      due_date: task.due_date?.split("T")[0] || "",
      file: null, // Don't set existing file, let user choose new one if needed
    });
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error("You do not have permission to delete class tasks.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const token = Cookies.get("access_token");
      await axios.delete(`${API_URL}${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Task deleted successfully.");
      fetchTasks();
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to delete task");
    }
  };

  // Determine the class ID field based on classOptions structure
  const classIdField = classOptions.length > 0 && classOptions[0].uuid ? "uuid" : "id";

  // Map class_schedule UUID to class name for display
  const getClassName = (classSchedule) => {
    const classOption = classOptions.find((cls) => cls[classIdField] === classSchedule);
    return classOption
      ? `${classOption.class_name || "Unknown"} - ${classOption.section || ""} (${classOption.session || ""})`
      : classSchedule || "N/A";
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Format datetime for display
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-6">
      <Toaster position="top-center" />
      <div className="flex justify-between items-center bg-blue-900 text-white px-6 py-3 rounded-md">
        <h1 className="text-xl font-bold">Class Task Manager</h1>
        {canAdd && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingTask(null);
              setNewTask({
                class_schedule: "",
                title: "",
                description: "",
                start_date: "",
                due_date: "",
                file: null,
              });
            }}
            className="bg-cyan-400 px-4 py-2 rounded shadow hover:bg-cyan-500 text-xs"
          >
            {showForm ? "Close Form" : "Add Task"}
          </button>
        )}
      </div>

      {showForm && (canAdd || canEdit) && (
        <div className="bg-white p-6 rounded-lg shadow-md mt-4">
          <h2 className="text-lg font-semibold mb-4">
            {editingTask ? "Edit Task" : "Create Task"}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                Class Schedule <span className="text-red-500">*</span>
              </label>
              <Select
                className="text-xs"
                classNamePrefix="react-select"
                isClearable
                placeholder="Select Class"
                options={classOptions}
                getOptionLabel={(cls) => `${cls.class_name || "Unknown"} - ${cls.section || ""} (${cls.session || ""})`}
                getOptionValue={(cls) => cls[classIdField]}
                value={classOptions.find((cls) => cls[classIdField] === newTask.class_schedule) || null}
                onChange={(selected) => {
                  console.log("Selected class:", selected);
                  setNewTask((prev) => {
                    const updated = { ...prev, class_schedule: selected?.[classIdField] || "" };
                    console.log("Updated newTask:", updated);
                    return updated;
                  });
                }}
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
                rows={3}
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              ></textarea>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                Attachment
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="p-2 border rounded w-full text-xs"
              />
              {editingTask && editingTask.file && (
                <p className="text-xs text-gray-500 mt-1">
                  Current file: <a href={editingTask.file} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download</a>
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setEditingTask(null);
                setNewTask({
                  class_schedule: "",
                  title: "",
                  description: "",
                  start_date: "",
                  due_date: "",
                  file: null,
                });
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-xs"
            >
              {editingTask ? "Update Task" : "Save Task"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-600 text-sm mt-4">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p className="text-center text-gray-600 text-sm mt-4">No tasks found.</p>
      ) : (
        <>
          <Buttons
            data={tasks.map((task, index) => ({
              "S.No": (page - 1) * pageSize + index + 1,
              ID: task.id,
              Title: task.title,
              Description: task.description,
              "Class Name": task.class_name || "N/A",
              "Section": task.section_name || "N/A",
              "Session": task.session_name || "N/A",
              "Teacher": task.teacher_name || "N/A",
              "Subject": task.subject || "N/A",
              "Start Date": formatDate(task.start_date),
              "Due Date": formatDate(task.due_date),
              "File": task.file ? "Yes" : "No",
            }))}
            columns={[
              { label: "S.No", key: "S.No" },
              { label: "ID", key: "ID" },
              { label: "Title", key: "Title" },
              { label: "Description", key: "Description" },
              { label: "Class Name", key: "Class Name" },
              { label: "Section", key: "Section" },
              { label: "Session", key: "Session" },
              { label: "Teacher", key: "Teacher" },
              { label: "Subject", key: "Subject" },
              { label: "Start Date", key: "Start Date" },
              { label: "Due Date", key: "Due Date" },
              { label: "File", key: "File" },
            ]}
            filename="Class_Tasks_Report"
          />
          <h2 className="text-lg font-semibold text-white bg-blue-900 px-4 py-2 rounded-t-md mt-4">
            Tasks ({totalItems} total)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border bg-white rounded-b-md shadow-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border p-2 text-xs font-semibold text-gray-700">S.No</th>
                  <th className="border p-2 text-xs font-semibold text-gray-700">Title</th>
                  <th className="border p-2 text-xs font-semibold text-gray-700">Class</th>
                  <th className="border p-2 text-xs font-semibold text-gray-700">Teacher</th>
                  <th className="border p-2 text-xs font-semibold text-gray-700">Subject</th>
                  <th className="border p-2 text-xs font-semibold text-gray-700">Start Date</th>
                  <th className="border p-2 text-xs font-semibold text-gray-700">Due Date</th>
                  <th className="border p-2 text-xs font-semibold text-gray-700">File</th>
                  {(canEdit || canDelete) && (
                    <th className="border p-2 text-xs font-semibold text-gray-700">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, index) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="border p-2 text-xs text-gray-800 text-center">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="border p-2 text-xs text-gray-800">
                      <span className="block max-w-[150px] truncate" title={task.title}>
                        {task.title}
                      </span>
                    </td>
                    <td className="border p-2 text-xs text-gray-800">
                      <span className="block max-w-[120px] truncate" title={`${task.class_name} - ${task.section_name}`}>
                        {task.class_name} - {task.section_name}
                      </span>
                    </td>
                    <td className="border p-2 text-xs text-gray-800">
                      <span className="block max-w-[100px] truncate" title={task.teacher_name}>
                        {task.teacher_name || "N/A"}
                      </span>
                    </td>
                    <td className="border p-2 text-xs text-gray-800">
                      {task.subject || "N/A"}
                    </td>
                    <td className="border p-2 text-xs text-gray-800">
                      {formatDate(task.start_date)}
                    </td>
                    <td className="border p-2 text-xs text-gray-800">
                      {formatDate(task.due_date)}
                    </td>
                    <td className="border p-2 text-xs text-gray-800">
                      {task.file ? (
                        <a
                          href={task.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline hover:text-blue-800"
                        >
                          Download
                        </a>
                      ) : (
                        "No File"
                      )}
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="border p-2 flex gap-2 justify-center text-xs">
                        <MdVisibility
                          onClick={() => setSelectedTask(task)}
                          className="text-blue-500 cursor-pointer hover:text-blue-700"
                          size={20}
                          title="View"
                        />
                        {canEdit && (
                          <MdEdit
                            onClick={() => handleEdit(task)}
                            className="text-yellow-500 cursor-pointer hover:text-yellow-700"
                            size={20}
                            title="Edit"
                          />
                        )}
                        {canDelete && (
                          <MdDelete
                            onClick={() => handleDelete(task.id)}
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
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 p-6 overflow-hidden max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex justify-between items-center border-b pb-4 flex-shrink-0">
              <h2 className="text-2xl font-bold text-blue-800">📝 Task Details</h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-500 hover:text-red-600 text-xl font-bold"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable content */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-sm text-gray-700 overflow-y-auto pr-2 flex-grow">
              <div>
                <span className="font-semibold text-gray-600">📌 Title</span>
                <p className="mt-1 text-gray-800">{selectedTask.title}</p>
              </div>

              <div>
                <span className="font-semibold text-gray-600">🏫 Class</span>
                <p className="mt-1 text-gray-800">{selectedTask.class_name} - {selectedTask.section_name}</p>
              </div>

              <div>
                <span className="font-semibold text-gray-600">📚 Session</span>
                <p className="mt-1 text-gray-800">{selectedTask.session_name || "N/A"}</p>
              </div>

              <div>
                <span className="font-semibold text-gray-600">👨‍🏫 Teacher</span>
                <p className="mt-1 text-gray-800">{selectedTask.teacher_name || "N/A"}</p>
              </div>

              <div>
                <span className="font-semibold text-gray-600">📖 Subject</span>
                <p className="mt-1 text-gray-800">{selectedTask.subject || "N/A"}</p>
              </div>

              <div>
                <span className="font-semibold text-gray-600">🏢 School</span>
                <p className="mt-1 text-gray-800">{selectedTask.school || "N/A"}</p>
              </div>

              <div>
                <span className="font-semibold text-gray-600">📆 Start Date</span>
                <p className="mt-1 text-gray-800">{formatDateTime(selectedTask.start_date)}</p>
              </div>

              <div>
                <span className="font-semibold text-gray-600">⏰ Due Date</span>
                <p className="mt-1 text-gray-800">{formatDateTime(selectedTask.due_date)}</p>
              </div>

              {selectedTask.file && (
                <div className="sm:col-span-2">
                  <span className="font-semibold text-gray-600">📎 Attachment</span>
                  <p className="mt-1">
                    <a
                      href={selectedTask.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Download File
                    </a>
                  </p>
                </div>
              )}

              <div className="sm:col-span-2">
                <span className="font-semibold text-gray-600">📝 Description</span>
                <div className="bg-gray-50 p-4 mt-1 rounded-md border text-gray-800 leading-relaxed whitespace-pre-line">
                  {selectedTask.description}
                </div>
              </div>

              <div className="sm:col-span-2">
                <span className="font-semibold text-gray-600">🆔 Task ID</span>
                <p className="mt-1 font-mono text-xs bg-gray-100 px-2 py-1 rounded">{selectedTask.id}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-right flex-shrink-0">
              <button
                onClick={() => setSelectedTask(null)}
                className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-md font-semibold shadow-sm text-xs"
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