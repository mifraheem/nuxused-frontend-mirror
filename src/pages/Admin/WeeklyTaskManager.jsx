import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import { Buttons } from '../../components';
import Select from "react-select";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster";
import TableComponent from "../../components/TableComponent"; // Import reusable TableComponent

const WeeklyTaskManager = () => {
  const [showModal, setShowModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    start_date: "",
    due_date: "",
    file: null,
    teacher: "",
  });
  const [isTeachersLoaded, setIsTeachersLoaded] = useState(false);
  const [toaster, setToaster] = useState({ message: "", type: "success", onConfirm: null, onCancel: null });
  const [isLoading, setIsLoading] = useState(true);

  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}faculty-tasks/`;
  const TEACHER_API_URL = `${API}api/auth/users/list_profiles/teacher/`;

  const authHeaders = () => {
    const token = Cookies.get("access_token");
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const showToast = (message, type = "success", onConfirm = null, onCancel = null) => {
    setToaster({ message, type, onConfirm, onCancel });
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(TEACHER_API_URL, { headers: authHeaders() });
      const list = res.data?.data?.results || [];
      console.log("Raw teachers data:", list);

      const normalized = list
        .map(t => {
          const teacherUUID = t.profile_id;
          const teacherLabel =
            `${t.first_name || ''} ${t.last_name || ''}`.trim() ||
            t.username ||
            t.email ||
            `Teacher ${teacherUUID?.substring(0, 8)}` ||
            "Unknown";

          console.log("Teacher mapping:", {
            original: t,
            uuid: teacherUUID,
            label: teacherLabel,
            isValidUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teacherUUID),
          });

          return {
            value: teacherUUID?.toString(),
            label: teacherLabel,
            originalData: t,
          };
        })
        .filter(t => t.value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t.value));

      console.log("Normalized teachers:", normalized);
      setTeachers(normalized);
      setIsTeachersLoaded(true);
      if (normalized.length === 0) {
        showToast("No valid teachers found with UUIDs.", "error", null, null);
      }
      return normalized;
    } catch (e) {
      console.error("Error fetching teachers:", e.response?.data || e.message);
      showToast(e.response?.data?.message || "Failed to load teachers.", "error", null, null);
      setIsTeachersLoaded(true);
      return [];
    }
  };

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}?page=${page}&page_size=${pageSize}`, {
        headers: authHeaders(),
      });
      if (response.status === 200 && response.data.data) {
        const { results, total_pages } = response.data.data;
        console.log("Fetched tasks:", results);
        setTasks(Array.isArray(results) ? results : []);
        setTotalPages(total_pages || 1);
      } else {
        showToast("Unexpected API response format.", "error", null, null);
      }
    } catch (error) {
      console.error("Task fetch error:", error.response?.data || error.message);
      showToast(error.response?.data?.message || "Failed to fetch tasks.", "error", null, null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setNewTask((prev) => ({ ...prev, file: e.target.files[0] }));
  };

  const handleSaveTask = async () => {
    if (!newTask.title || !newTask.description || !newTask.start_date || !newTask.due_date || !newTask.teacher) {
      showToast("All fields are required!", "error", null, null);
      return;
    }

    try {
      const isEditing = !!editingTask;
      const url = isEditing ? `${API_URL}${editingTask}/` : API_URL;
      const headers = authHeaders();

      const formatDate = (dateString) => {
        if (!dateString) return "";
        const [yyyy, mm, dd] = dateString.split("-");
        return `${yyyy}-${mm}-${dd}T00:00:00+05:00`;
      };

      const selectedTeacher = teachers.find(t => t.value === newTask.teacher);
      if (!selectedTeacher?.value) {
        showToast("Please select a valid teacher.", "error", null, null);
        return;
      }
      const teacherUUID = selectedTeacher.value;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(teacherUUID)) {
        showToast("Selected teacher ID is not a valid UUID.", "error", null, null);
        console.error("Invalid teacher UUID:", teacherUUID, selectedTeacher);
        return;
      }

      console.log(`${isEditing ? 'Updating' : 'Creating'} task with teacher UUID:`, teacherUUID);

      let response;
      if (newTask.file instanceof File) {
        const formData = new FormData();
        formData.append("title", newTask.title);
        formData.append("description", newTask.description);
        formData.append("start_date", formatDate(newTask.start_date));
        formData.append("due_date", formatDate(newTask.due_date));
        formData.append("teachers", teacherUUID);
        formData.append("file", newTask.file);

        console.log("FormData contents:");
        for (let [key, value] of formData.entries()) {
          console.log(`${key}:`, value);
        }

        response = await axios({
          method: isEditing ? "patch" : "post",
          url,
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data",
          },
          data: formData,
        });
      } else {
        const json = {
          title: newTask.title,
          description: newTask.description,
          start_date: formatDate(newTask.start_date),
          due_date: formatDate(newTask.due_date),
          teachers: [teacherUUID],
        };

        console.log("JSON payload:", json);

        response = await axios({
          method: isEditing ? "patch" : "post",
          url,
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          data: json,
        });
      }

      console.log("API Response:", response.data);

      if ([200, 201].includes(response.status)) {
        const updatedTask = response.data.data;
        if (isEditing) {
          setTasks((prev) =>
            prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
          );
          showToast("Task updated successfully!", "success", null, null);
        } else {
          setTasks((prev) => [updatedTask, ...prev]);
          showToast("Task created successfully!", "success", null, null);
        }
        await fetchTasks();
      }

      setShowForm(false);
      setEditingTask(null);
      setNewTask({
        title: "",
        description: "",
        start_date: "",
        due_date: "",
        file: null,
        teacher: "",
      });
    } catch (error) {
      console.error("Task save error:", error.response?.data || error.message);
      console.error("Response status:", error.response?.status);
      if (error.response?.data?.data?.errors) {
        console.error("Validation errors:", error.response.data.data.errors);
        Object.keys(error.response.data.data.errors).forEach(field => {
          console.error(`Field '${field}' error:`, error.response.data.data.errors[field]);
        });
      }
      const errorMessage =
        error.response?.data?.data?.errors?.teachers?.[0] ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to save task.";
      showToast(errorMessage, "error", null, null);
    }
  };

  const handleDeleteTask = (id) => {
    if (!canDelete) {
      showToast("You do not have permission to delete faculty tasks.", "error", null, null);
      return;
    }

    showToast(
      "Are you sure you want to delete this task?",
      "confirmation",
      async () => {
        try {
          const token = Cookies.get("access_token");
          if (!token) {
            showToast("User is not authenticated.", "error", null, null);
            return;
          }
          await axios.delete(`${API_URL}${id}/`, {
            headers: authHeaders(),
          });
          showToast("Task deleted successfully!", "success", null, null);
          fetchTasks();
        } catch (error) {
          console.error("Error deleting task:", error.response?.data || error.message);
          showToast(
            error.response?.data?.message || "Failed to delete task.",
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

  const handleEditTask = (task) => {
    console.log("Editing task:", task);
    setEditingTask(task.id);
    setShowForm(true);
    const taskTeacherUUID = task.teachers?.[0] || "";
    console.log("Task teacher UUID:", taskTeacherUUID);
    setNewTask({
      title: task.title || "",
      description: task.description || "",
      start_date: task.start_date?.split("T")[0] || "",
      due_date: task.due_date?.split("T")[0] || "",
      file: null,
      teacher: taskTeacherUUID,
    });
  };

  const getTeacherNames = (teacherIds) => {
    if (!teacherIds?.length) return "N/A";
    if (!isTeachersLoaded) return "Loading...";
    const names = teacherIds
      .map(id => {
        const teacher = teachers.find(t => t.value === id);
        if (!teacher) {
          console.warn(`No teacher found for UUID: ${id}`);
          return `Unknown (${id.substring(0, 8)}...)`;
        }
        return teacher.label;
      })
      .filter(name => !name.startsWith("Unknown"));
    return names.length > 0 ? names.join(", ") : "Unknown";
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
  };

  const handleToggleForm = () => {
    setShowForm((prev) => !prev);
    setEditingTask(null);
    setNewTask({
      title: "",
      description: "",
      start_date: "",
      due_date: "",
      file: null,
      teacher: "",
    });
  };

  useEffect(() => {
    fetchTeachers().then(() => fetchTasks());
  }, [page, pageSize]);

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canAdd = permissions.includes("users.add_facultytask");
  const canEdit = permissions.includes("users.change_facultytask");
  const canDelete = permissions.includes("users.delete_facultytask");
  const canPerformActions = canEdit || canDelete;

  // Columns for TableComponent
  const tableColumns = [
    {
      key: "index",
      label: "#",
      render: (row, index) => (page - 1) * pageSize + index + 1,
    },
    {
      key: "title",
      label: "Title",
      render: (row) => (
        <span className="block max-w-[150px] truncate" title={row.title}>
          {row.title || "—"}
        </span>
      ),
    },
    {
      key: "teacher",
      label: "Teacher",
      render: (row) => getTeacherNames(row.teachers) || "—",
    },
    {
      key: "start_date",
      label: "Start",
      render: (row) => row.start_date?.split("T")[0] || "—",
    },
    {
      key: "due_date",
      label: "Due",
      render: (row) => row.due_date?.split("T")[0] || "—",
    },
    {
      key: "file",
      label: "File",
      render: (row) =>
        row.file ? (
          <a
            href={row.file}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Download
          </a>
        ) : "No File",
    },
    ...(canPerformActions ? [{
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => handleViewTask(row)}
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            title="View Task"
          >
            <MdVisibility size={18} />
          </button>
          {canEdit && (
            <button
              onClick={() => handleEditTask(row)}
              className="text-yellow-600 hover:text-yellow-800 transition-colors duration-200"
              title="Edit Task"
            >
              <MdEdit size={18} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDeleteTask(row.id)}
              className="text-red-600 hover:text-red-800 transition-colors duration-200"
              title="Delete Task"
            >
              <MdDelete size={18} />
          </button>
          )}
        </div>
      ),
    }] : []),
  ];

  // No Tasks Empty State Component
  const NoTasksMessage = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-xl border border-gray-200 shadow-md mx-2 mt-4">
      <div className="w-24 h-24 mb-6 text-blue-300">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10,9 9,9 8,9" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-blue-900 mb-2">No Tasks Yet</h3>
      <p className="text-gray-600 mb-4 max-w-md">
        You haven't created any weekly tasks yet. Start by adding your first task to get organized!
      </p>
      {canAdd && (
        <button
          onClick={handleToggleForm}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 text-sm transition-colors duration-200"
        >
          <div className="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full mr-2">
            <span className="text-white text-base font-bold">+</span>
          </div>
          Create Your First Task
        </button>
      )}
    </div>
  );

  // Responsive select styles
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: "2.25rem",
      fontSize: "0.85rem",
      borderRadius: "0.375rem",
      borderColor: "#d1d5db",
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    }),
    menu: (provided) => ({
      ...provided,
      fontSize: "0.85rem",
      maxHeight: "220px",
      overflowY: "auto",
      borderRadius: "0.375rem",
      zIndex: 9999,
    }),
    option: (provided) => ({
      ...provided,
      fontSize: "0.85rem",
      padding: "0.5rem 0.75rem",
      backgroundColor: provided.isSelected ? "#3b82f6" : provided.isFocused ? "#eff6ff" : "white",
      color: provided.isSelected ? "white" : "#1f2937",
    }),
    singleValue: (provided) => ({
      ...provided,
      fontSize: "0.85rem",
    }),
    placeholder: (provided) => ({
      ...provided,
      fontSize: "0.85rem",
      color: "#6b7280",
    }),
  };

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
        <h1 className="text-lg sm:text-xl font-bold">Weekly Task Manager</h1>
        {canAdd && (
          <button
            onClick={handleToggleForm}
            className="flex items-center px-3 py-2 bg-cyan-500 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-600 text-sm sm:text-base transition-colors duration-200"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-gray-800 rounded-full mr-2">
              <span className="text-cyan-400 text-xl font-bold">
                {showForm ? "-" : "+"}
              </span>
            </div>
            {showForm ? "Close Form" : "Add New Task"}
          </button>
        )}
      </div>

      {canAdd && showForm && (
        <div className="p-4 sm:p-6  bg-white border border-gray-200 rounded-xl shadow-md mt-6 max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-blue-900 mb-4">
            {editingTask ? "Edit Task" : "Create New Task"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter task title"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter task description"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teacher <span className="text-red-500">*</span>
              </label>
              <Select
                name="teacher"
                options={teachers}
                value={teachers.find(o => o.value === newTask.teacher) || null}
                onChange={(opt) => {
                  const selectedUUID = opt?.value || "";
                  console.log("Selected teacher:", opt);
                  setNewTask(p => ({ ...p, teacher: selectedUUID }));
                }}
                placeholder={isTeachersLoaded ? "Select teacher" : "Loading teachers..."}
                isClearable
                isDisabled={!isTeachersLoaded}
                styles={selectStyles}
                isSearchable={true}
                menuPortalTarget={document.body}
                noOptionsMessage={() => (isTeachersLoaded && teachers.length === 0 ? "No teachers found" : "Loading teachers...")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newTask.start_date}
                onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload File (optional)
              </label>
              <input
                type="file"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => setNewTask({ ...newTask, file: e.target.files[0] })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleToggleForm}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm shadow-sm transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTask}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-200"
              disabled={!isTeachersLoaded}
            >
              {editingTask ? "Update Task" : "Save Task"}
            </button>
          </div>
        </div>
      )}

      {/* Show loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600 text-lg">Loading tasks...</span>
        </div>
      ) : (
        <div className="p-4 sm:p-6">
          {/* Show no tasks message if tasks array is empty */}
          {tasks.length === 0 ? (
            <NoTasksMessage />
          ) : (
            <>
              <div className=" mb-4 gap-3">
                {/* <h2 className="text-lg font-semibold text-white px-4 py-2 rounded-t-lg bg-blue-900">
                  Weekly Tasks
                </h2> */}
                <Buttons
                  data={tasks.map((task, index) => ({
                    "S.No": (page - 1) * pageSize + index + 1,
                    Title: task.title,
                    Description: task.description,
                    Teacher: getTeacherNames(task.teachers),
                    "Start Date": task.start_date?.split("T")[0] || "—",
                    "Due Date": task.due_date?.split("T")[0] || "—",
                    File: task.file ? "Attached" : "No File",
                  }))}
                  columns={[
                    { label: "S.No", key: "S.No" },
                    { label: "Title", key: "Title" },
                    { label: "Description", key: "Description" },
                    { label: "Teacher", key: "Teacher" },
                    { label: "Start Date", key: "Start Date" },
                    { label: "Due Date", key: "Due Date" },
                    { label: "File", key: "File" },
                  ]}
                  filename="Weekly_Tasks_Report"
                />
              </div>
              <div className="overflow-x-auto">
                <TableComponent
                  data={tasks}
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
                  fetchTasks();
                }}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                  fetchTasks();
                }}
                totalItems={tasks.length}
                showPageSizeSelector={true}
                showPageInfo={true}
              /> */}
            </>
          )}
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-50">
              <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                📋 {selectedTask.title || "Task Details"}
              </h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors duration-200"
              >
                &times;
              </button>
            </div>
            {/* Content in column form */}
            <div className="px-6 py-5 overflow-y-auto max-h-[60vh] space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600 font-medium">📝 Description</span>
                <span className="font-semibold text-gray-800 text-right max-w-[60%]">
                  {selectedTask.description || "—"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600 font-medium">👨‍🏫 Teacher</span>
                <span className="font-semibold text-gray-800 text-right">
                  {getTeacherNames(selectedTask.teachers)}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600 font-medium">📅 Start Date</span>
                <span className="font-semibold text-gray-800 text-right">
                  {selectedTask.start_date?.split("T")[0] || "—"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600 font-medium">⏳ Due Date</span>
                <span className="font-semibold text-gray-800 text-right">
                  {selectedTask.due_date?.split("T")[0] || "—"}
                </span>
              </div>
              {selectedTask.file && (
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600 font-medium">📎 Attachment</span>
                  <a
                    href={selectedTask.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium text-sm"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="flex justify-end px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setSelectedTask(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg shadow text-sm font-medium transition-colors duration-200"
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

export default WeeklyTaskManager;