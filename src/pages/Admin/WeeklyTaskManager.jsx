import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import { Buttons } from '../../components';
import Select from "react-select";
import Pagination from "../../components/Pagination";

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

  const API = import.meta.env.VITE_SERVER_URL;

  const API_URL = `${API}faculty-tasks/`;
  const TEACHER_API_URL = `${API}api/auth/users/list_profiles/teacher/`;

  const fetchTasks = async () => {
    try {
      const token = Cookies.get("access_token");
      const response = await axios.get(`${API_URL}?page=${page}&page_size=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 && response.data.data) {
        const { results, total_pages } = response.data.data;
        setTasks(Array.isArray(results) ? results : []);
        setTotalPages(total_pages || 1);
      } else {
        toast.error("Unexpected API response format.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch tasks.");
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
    if (!newTask.title || !newTask.description || !newTask.start_date || !newTask.due_date) {
      toast.error("All fields are required!");
      return;
    }

    try {
      const token = Cookies.get("access_token");
      const isEditing = !!editingTask;
      const url = isEditing ? `${API_URL}${editingTask.id}/` : API_URL;

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const formatDate = (dateString) => {
        if (!dateString) return "";
        const [yyyy, mm, dd] = dateString.split("-");
        return `${yyyy}-${mm}-${dd}`;
      };

      const selectedTeacher = teachers.find(t => t.user_id === parseInt(newTask.teacher));
      if (!selectedTeacher?.profile_id) {
        toast.error("Please select a valid teacher.");
        return;
      }
      const teacherProfileId = parseInt(selectedTeacher.profile_id);

      let response;

      if (newTask.file) {
        const formData = new FormData();
        formData.append("title", newTask.title);
        formData.append("description", newTask.description);
        formData.append("start_date", formatDate(newTask.start_date));
        formData.append("due_date", formatDate(newTask.due_date));
        formData.append("teachers", teacherProfileId);
        formData.append("file", newTask.file);

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
          teachers: [teacherProfileId],
        };

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

      if ([200, 201].includes(response.status)) {
        const updatedTask = response.data.data;
        setTasks((prev) =>
          isEditing
            ? prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
            : [...prev, updatedTask]
        );
        toast.success(isEditing ? "Task updated successfully!" : "Task created successfully!");
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
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to save task."
      );
    }
  };

  const handleDeleteTask = (id) => {
    if (!canDelete) {
      toast.error("You do not have permission to delete faculty tasks.");
      return;
    }

    toast(
      (t) => (
        <div>
          <p className="text-gray-800">Are you sure you want to delete this task?</p>
          <div className="flex justify-end mt-2 gap-2">
            <button
              onClick={async () => {
                try {
                  const token = Cookies.get("access_token");
                  await axios.delete(`${API_URL}${id}/`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });

                  toast.success("Task deleted successfully!");
                  setTasks((prevTasks) =>
                    prevTasks.filter((task) => task.id !== id)
                  );
                } catch (error) {
                  console.error("Error deleting task:", error);
                  toast.error("Failed to delete task.");
                }

                toast.dismiss(t.id);
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Yes
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400"
            >
              No
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  const handleEditTask = (task) => {
    setNewTask({
      title: task.title || "",
      description: task.description || "",
      start_date: task.start_date?.split("T")[0] || "",
      due_date: task.due_date?.split("T")[0] || "",
      file: null,
      teacher: task.teachers?.[0] || "",
    });

    setEditingTask({ id: task.id, ...task });
    setShowForm(true);
  };

  const getTeacherNames = (teacherIds) => {
    if (!teacherIds?.length) return "N/A";
    return teacherIds
      .map(id => teachers.find(teacher => teacher.profile_id === id)?.username || "Unknown")
      .join(", ");
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

  const fetchTeachers = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }

      const response = await axios.get(TEACHER_API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        },
      });

      const teacherList = response.data?.data?.results || [];
      if (!Array.isArray(teacherList)) {
        throw new Error("Invalid response format for teachers");
      }

      setTeachers(teacherList);
    } catch (error) {
      console.error("Failed to fetch teachers:", error.response || error.message);
      toast.error(
        error.response?.data?.message || "Failed to load teachers. Please try again."
      );
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchTeachers();
  }, [page, pageSize]);

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canAdd = permissions.includes("users.add_facultytask");
  const canEdit = permissions.includes("users.change_facultytask");
  const canDelete = permissions.includes("users.delete_facultytask");

  return (
    <div className="p-2">
      <Toaster position="top-center" reverseOrder={false} />
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
                value={teachers.find(t => t.user_id == newTask.teacher) || null}
                onChange={(selected) =>
                  setNewTask({ ...newTask, teacher: selected?.user_id || "" })
                }
                options={teachers}
                getOptionLabel={(t) => t.username}
                getOptionValue={(t) => t.user_id}
                placeholder="Select teacher"
                isClearable
                className="react-select-container text-xs"
                classNamePrefix="react-select"
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
              onClick={() => setShowForm(false)}
              className="bg-gray-500 text-white px-2 py-1 rounded-md hover:bg-gray-600 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTask}
              className="bg-green-600 text-white px-3 py-1 rounded-md font-semibold shadow hover:bg-green-700 text-xs"
            >
              {editingTask ? "Update Task" : "Save Task"}
            </button>
          </div>
        </div>
      )}

      <div className="p-2">
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
                  <td className="border border-gray-300 p-0.5 text-center text-xs">{task.id}</td>
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
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          totalItems={tasks.length}
          showPageSizeSelector={true}
          showPageInfo={true}
        />
      </div>

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