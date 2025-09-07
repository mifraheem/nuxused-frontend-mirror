import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import { Buttons } from '../../components';
import Select from "react-select";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster";

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
  const [toaster, setToaster] = useState({ message: '', type: 'success' });
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

  const showToast = (message, type = 'success') => {
    setToaster({ message, type });
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
        showToast("No valid teachers found with UUIDs.", "error");
      }
      return normalized;
    } catch (e) {
      console.error("Error fetching teachers:", e.response?.data || e.message);
      showToast(e.response?.data?.message || "Failed to load teachers.", "error");
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
        showToast("Unexpected API response format.", "error");
      }
    } catch (error) {
      console.error("Task fetch error:", error.response?.data || error.message);
      showToast(error.response?.data?.message || "Failed to fetch tasks.", "error");
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
      showToast("All fields are required!", "error");
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
        showToast("Please select a valid teacher.", "error");
        return;
      }
      const teacherUUID = selectedTeacher.value;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(teacherUUID)) {
        showToast("Selected teacher ID is not a valid UUID.", "error");
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
          showToast("Task updated successfully!", "success");
        } else {
          setTasks((prev) => [updatedTask, ...prev]);
          showToast("Task created successfully!", "success");
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
      showToast(errorMessage, "error");
    }
  };

  const handleDeleteTask = (id) => {
    if (!canDelete) {
      showToast("You do not have permission to delete faculty tasks.", "error");
      return;
    }

    showToast(
      {
        message: "Are you sure you want to delete this task?",
        type: "confirm",
        onConfirm: async () => {
          try {
            await axios.delete(`${API_URL}${id}/`, {
              headers: authHeaders(),
            });
            showToast("Task deleted successfully!", "success");
            setTasks((prevTasks) =>
              prevTasks.filter((task) => task.id !== id)
            );
          } catch (error) {
            showToast(error.response?.data?.message || "Failed to delete task.", "error");
          }
        },
        onCancel: () => setToaster({ message: "", type: "success" })
      },
      "confirm"
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

  // No Tasks Empty State Component
  const NoTasksMessage = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border-2 border-dashed border-blue-300 mx-2 mt-4">
      <div className="w-24 h-24 mb-6 text-blue-300">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      </div>
      
      <h3 className="text-xl font-bold text-blue-800 mb-2">No Tasks Yet</h3>
      <p className="text-blue-600 mb-4 max-w-md">
        You haven't created any weekly tasks yet. Start by adding your first task to get organized!
      </p>
      
      {canAdd && (
        <button
          onClick={handleToggleForm}
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
    <div className="p-2">
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={3000}
        onClose={() => setToaster({ message: "", type: "success" })}
        onConfirm={toaster.onConfirm}
        onCancel={toaster.onCancel}
      />
      <div className="bg-blue-900 text-white py-1 px-2 rounded-md flex justify-between items-center mt-2">
        <h1 className="text-lg font-bold">Weekly Task Manager</h1>
        {canAdd && (
          <button
            onClick={handleToggleForm}
            className="flex items-center px-2 py-1 bg-cyan-400 text-white font-semibold rounded-md shadow-md hover:bg-cyan-500 transition text-sm"
          >
            <div className="flex items-center justify-center w-6 h-6 bg-black rounded-full mr-1">
              <span className="text-cyan-500 text-base font-bold">
                {showForm ? "-" : "+"}
              </span>
            </div>
            {showForm ? "Close Form" : "Add New Task"}
          </button>
        )}
      </div>

      {canAdd && showForm && (
        <div className="p-2 mx-2 bg-white border border-gray-200 rounded-lg shadow-md mt-2">
          <h2 className="text-lg font-bold text-blue-800 mb-2">
            {editingTask ? "Edit Task" : "Create New Task"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter task title"
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter task description"
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-0.5">
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
                className="react-select-container text-xs"
                classNamePrefix="react-select"
                isSearchable={true}
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: base => ({ ...base, zIndex: 9999 }),
                  menu: base => ({ ...base, fontSize: '12px' }),
                  option: base => ({ ...base, fontSize: '12px' }),
                  singleValue: base => ({ ...base, fontSize: '12px' }),
                  control: base => ({ ...base, minHeight: '28px', fontSize: '12px' }),
                }}
                noOptionsMessage={() => (isTeachersLoaded && teachers.length === 0 ? "No teachers found" : "Loading teachers...")}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                Upload File (optional)
              </label>
              <input
                type="file"
                className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:outline-none"
                onChange={(e) => setNewTask({ ...newTask, file: e.target.files[0] })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={handleToggleForm}
              className="bg-gray-500 text-white px-2 py-1 rounded-md hover:bg-gray-600 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTask}
              className="bg-green-600 text-white px-3 py-1 rounded-md font-semibold shadow hover:bg-green-700 text-xs"
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading tasks...</span>
        </div>
      ) : (
        <div className="p-2">
          {/* Show no tasks message if tasks array is empty */}
          {tasks.length === 0 ? (
            <NoTasksMessage />
          ) : (
            <>
              <Buttons
                data={tasks.map((task) => ({
                  ID: task.id,
                  Title: task.title,
                  Description: task.description,
                  Teacher: getTeacherNames(task.teachers),
                  "Start Date": task.start_date?.split("T")[0] || "—",
                  "Due Date": task.due_date?.split("T")[0] || "—",
                  File: task.file ? "Attached" : "No File",
                }))}
                columns={[
                  { label: "ID", key: "ID" },
                  { label: "Title", key: "Title" },
                  { label: "Description", key: "Description" },
                  { label: "Teacher", key: "Teacher" },
                  { label: "Start Date", key: "Start Date" },
                  { label: "Due Date", key: "Due Date" },
                  { label: "File", key: "File" },
                ]}
                filename="Weekly_Tasks_Report"
              />

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 bg-white mt-2 min-w-[400px]">
                  <thead className="bg-blue-900 text-white">
                    <tr>
                      <th className="border border-gray-300 p-0.5 text-center text-xs">#</th>
                      <th className="border border-gray-300 p-0.5 text-center text-xs">Title</th>
                      <th className="border border-gray-300 p-0.5 text-center text-xs">Teacher</th>
                      <th className="border border-gray-300 p-0.5 text-center text-xs">Start</th>
                      <th className="border border-gray-300 p-0.5 text-center text-xs">Due</th>
                      <th className="border border-gray-300 p-0.5 text-center text-xs">File</th>
                      {(canEdit || canDelete) && <th className="border border-gray-300 p-0.5 text-center text-xs">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task, index) => (
                      <tr key={task.id}>
                        <td className="border border-gray-300 p-0.5 text-center text-xs">
                          {(page - 1) * pageSize + index + 1}
                        </td>
                        <td className="border border-gray-300 p-0.5 text-xs">
                          <span className="block max-w-[150px] truncate" title={task.title}>
                            {task.title}
                          </span>
                        </td>
                        <td className="border border-gray-300 p-0.5 text-xs">{getTeacherNames(task.teachers)}</td>
                        <td className="border border-gray-300 p-0.5 text-center text-xs">
                          {task.start_date?.split("T")[0] || "N/A"}
                        </td>
                        <td className="border border-gray-300 p-0.5 text-center text-xs">
                          {task.due_date?.split("T")[0] || "N/A"}
                        </td>
                        <td className="border border-gray-300 p-0.5 text-xs">
                          {task.file ? (
                            <a
                              href={task.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline text-xs"
                            >
                              Download
                            </a>
                          ) : "No File"}
                        </td>
                        {(canEdit || canDelete) && (
                          <td className="border border-gray-300 p-0.5 flex justify-center gap-1 text-xs">
                            <MdVisibility
                              onClick={() => handleViewTask(task)}
                              className="text-blue-500 cursor-pointer hover:text-blue-700"
                              size={18}
                            />
                            {canEdit && (
                              <MdEdit
                                onClick={() => handleEditTask(task)}
                                className="text-yellow-500 cursor-pointer hover:text-yellow-700"
                                size={18}
                              />
                            )}
                            {canDelete && (
                              <MdDelete
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-red-500 cursor-pointer hover:text-red-700"
                                size={18}
                              />
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <Pagination
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
              />
            </>
          )}
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-2">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl border border-gray-300 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-blue-50">
              <h2 className="text-sm font-bold text-blue-700">
                📋 {selectedTask.title || "Task Details"}
              </h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-600 hover:text-red-600 text-xl font-bold leading-none"
              >
                &times;
              </button>
            </div>
            <div className="px-3 py-2 overflow-y-auto max-h-[50vh] space-y-2 text-xs text-gray-700">
              <div>
                <div className="text-gray-500 font-medium">📝 Description</div>
                <div className="mt-0.5 text-gray-800">{selectedTask.description || "—"}</div>
              </div>
              <div>
                <div className="text-gray-500 font-medium">👨‍🏫 Teacher</div>
                <div className="mt-0.5 text-gray-800">{getTeacherNames(selectedTask.teachers)}</div>
              </div>
              <div>
                <div className="text-gray-500 font-medium">📅 Start Date</div>
                <div className="mt-0.5 text-gray-800">{selectedTask.start_date?.split("T")[0] || "—"}</div>
              </div>
              <div>
                <div className="text-gray-500 font-medium">⏳ Due Date</div>
                <div className="mt-0.5 text-gray-800">{selectedTask.due_date?.split("T")[0] || "—"}</div>
              </div>
              {selectedTask.file && (
                <div>
                  <div className="text-gray-500 font-medium">📎 Attachment</div>
                  <a
                    href={selectedTask.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 text-blue-600 hover:underline font-medium text-xs"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
            <div className="flex justify-end px-3 py-2 border-t bg-gray-50">
              <button
                onClick={() => setSelectedTask(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-md shadow text-xs"
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