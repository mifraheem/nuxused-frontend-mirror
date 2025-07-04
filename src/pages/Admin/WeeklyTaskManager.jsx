import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import { Buttons } from '../../components';


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
    teacher: "", // ✅ Added teacher field
  });

  const API = import.meta.env.VITE_SERVER_URL;

  const API_URL = `${API}faculty-tasks/`;
  const TEACHER_API_URL = `${API}api/auth/users/list_profiles/teacher/`;

  // Fetch tasks from the API
  const fetchTasks = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }

      const response = await axios.get(`${API_URL}?page=${page}&page_size=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Fetch Tasks Response:", response.data);

      if (response.status === 200 && response.data.data) {
        const { results, total_pages } = response.data.data;
        setTasks(Array.isArray(results) ? results : []);
        setTotalPages(total_pages || 1);
      } else {
        toast.error("Unexpected API response format.");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error(error.response?.data?.message || "Failed to fetch tasks. Please try again.");
    }
  };







  // Handle input change in modal fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file input
  const handleFileChange = (e) => {
    setNewTask((prev) => ({ ...prev, file: e.target.files[0] }));
  };

  // Save a new task
  // Save a new task or update existing one
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

      // ✅ Format date to yyyy-mm-dd (HTML form accepts this)
      const formatDate = (dateString) => {
        if (!dateString) return "";
        const [yyyy, mm, dd] = dateString.split("-");
        return `${yyyy}-${mm}-${dd}`;
      };

      // ✅ Get teacher's profile ID
      const selectedTeacher = teachers.find(t => t.user_id === parseInt(newTask.teacher));
      if (!selectedTeacher?.profile_id) {
        toast.error("Please select a valid teacher.");
        return;
      }
      const teacherProfileId = parseInt(selectedTeacher.profile_id);

      let response;

      if (newTask.file) {
        // ✅ Use FormData if there's a file
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
        // ✅ JSON fallback if no file
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

      // ✅ Reset form
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


  // Delete a task
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

    // Map teacher IDs to usernames using the teachers state
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
    });
  };
  const fetchTeachers = async () => {
    try {
      const token = Cookies.get("access_token");
      console.log("Access Token:", token);

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

      console.log("Teachers Response:", response.data);

      // ✅ Extract from the correct structure
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

  const permissions = JSON.parse(localStorage.getItem("permissions") || "[]");

  const canAdd = permissions.includes("users.add_facultytask");
  const canEdit = permissions.includes("users.change_facultytask");
  const canDelete = permissions.includes("users.delete_facultytask");


  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      {/* Header and Add Task Button */}
      <div className="bg-blue-900 text-white py-2 px-6 rounded-md flex justify-between items-center mt-5">
        <h1 className="text-xl font-bold">Weekly Task Manager</h1>
        {canAdd && (
          <button
            onClick={handleToggleForm}
            className="flex items-center px-3 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-500 transition"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-black rounded-full mr-3">
              <span className="text-cyan-500 text-xl font-bold">
                {showForm ? "-" : "+"}
              </span>
            </div>
            {showForm ? "Close Form" : "Add New Task"}
          </button>
        )}

      </div>

      {/* ✅ Form Logic */}
      {canAdd && showForm && (
        <div className="p-6 bg-blue-50 rounded-md mb-6">
          <h2 className="text-lg font-semibold text-blue-900">
            {editingTask ? "Edit Task" : "Create Task"}
          </h2>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Task Title */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Task Title
              </label>
              <input
                type="text"
                placeholder="Enter Task Title"
                className="p-2 border border-gray-300 rounded w-full"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder="Enter Description"
                className="p-2 border border-gray-300 rounded w-full"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
              />
            </div>
            <select
              name="teacher"
              value={newTask.teacher}
              onChange={handleInputChange}
              className="p-2 border border-gray-300 rounded w-full"
            >
              <option value="">Select Teacher</option>
              {Array.isArray(teachers) && teachers.map((teacher) => (
                <option key={teacher.user_id} value={teacher.user_id}>
                  {teacher.username}
                </option>
              ))}

            </select>


            {/* Start Date */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="p-2 border border-gray-300 rounded w-full"
                value={newTask.start_date}
                onChange={(e) =>
                  setNewTask({ ...newTask, start_date: e.target.value })
                }
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Due Date
              </label>
              <input
                type="date"
                className="p-2 border border-gray-300 rounded w-full"
                value={newTask.due_date}
                onChange={(e) =>
                  setNewTask({ ...newTask, due_date: e.target.value })
                }
              />
            </div>

            {/* File Upload */}
            <div className="col-span-2">
              <label className="block text-gray-700 font-medium mb-1">
                Upload File
              </label>
              <input
                type="file"
                className="p-2 border border-gray-300 rounded w-full"
                onChange={(e) =>
                  setNewTask({ ...newTask, file: e.target.files[0] })
                }
              />
            </div>
          </div>
          {/* ✅ Buttons */}
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded-md shadow hover:bg-gray-700 mr-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTask}
              className="bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-700"
            >
              {editingTask ? "Update Task" : "Save Task"}
            </button>
          </div>
        </div>
      )}
      {/* Tasks Table */}
      <div className="p-6">
        <Buttons />
        <table className="w-full border-collapse border border-gray-300 bg-white mt-4 shadow-md">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="border border-gray-300 p-2">#</th>
              <th className="border border-gray-300 p-2">Task Title</th>
              <th className="border border-gray-300 p-2">Teacher</th>
              <th className="border border-gray-300 p-2">Start Date</th>
              <th className="border border-gray-300 p-2">Due Date</th>
              <th className="border border-gray-300 p-2">File</th>
              {(canEdit || canDelete) && <th className="border border-gray-300 p-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, index) => (
              <tr key={task.id}>
                <td className="border border-gray-300 p-2">{task.id}</td>
                <td className="border border-gray-300 p-2">{task.title}</td>
                <td className="border border-gray-300 p-2">{getTeacherNames(task.teachers)}</td>
                <td className="border border-gray-300 p-2">
                  {task.start_date?.split("T")[0] || "N/A"}
                </td>
                <td className="border border-gray-300 p-2">
                  {task.due_date?.split("T")[0] || "N/A"}
                </td>
                <td className="border border-gray-300 p-2">
                  {task.file ? (
                    <a
                      href={task.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Download File
                    </a>
                  ) : (
                    "No File"
                  )}
                </td>
                {(canEdit || canDelete) && (
                  <td className="border border-gray-300 p-2 flex justify-center gap-2">
                    <MdVisibility
                      onClick={() => handleViewTask(task)}
                      className="text-blue-500 cursor-pointer hover:text-blue-700"
                      size={24}
                    />
                    {canEdit && (
                      <MdEdit
                        onClick={() => handleEditTask(task)}
                        className="text-yellow-500 text-2xl cursor-pointer hover:text-yellow-700"
                      />
                    )}
                    {canDelete && (
                      <MdDelete
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-500 text-2xl cursor-pointer hover:text-red-700"
                      />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>

        </table>
        <div className="flex justify-between items-center bg-blue-50 p-4 rounded-b-md mt-2">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <label className="text-gray-700 font-semibold">Page Size:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="border rounded-md px-3 py-1"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          {/* Pagination Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className={`px-3 py-1 rounded-md font-semibold ${page === 1
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-white hover:bg-gray-100"
                }`}
            >
              Prev
            </button>

            <span className="px-3 py-1 bg-blue-600 text-white font-bold rounded-md">{page}</span>

            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className={`px-3 py-1 rounded-md font-semibold ${page === totalPages
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-white hover:bg-gray-100"
                }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* // ✅ View Task Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden border border-gray-300">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-2xl font-bold text-blue-600">
                {selectedTask.title || "Task Details"}
              </h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-500 hover:text-gray-700 text-lg font-bold"
              >
                ✖
              </button>
            </div>

            {/* Modal Content (Scrollable) */}
            <div className="overflow-y-auto flex-grow mt-4 px-2" style={{ maxHeight: "60vh" }}>
              <div className="space-y-4">
                {/* Description */}
                <div className="flex justify-between border-b pb-2">
                  <span className="font-semibold text-gray-700">Description:</span>
                  <span className="text-gray-600">
                    {selectedTask.description || "N/A"}
                  </span>
                </div>

                {/* Start Date */}
                <div className="flex justify-between border-b pb-2">
                  <span className="font-semibold text-gray-700">Start Date:</span>
                  <span className="text-gray-600">
                    {selectedTask.start_date || "N/A"}
                  </span>
                </div>

                {/* Due Date */}
                <div className="flex justify-between border-b pb-2">
                  <span className="font-semibold text-gray-700">Due Date:</span>
                  <span className="text-gray-600">
                    {selectedTask.due_date || "N/A"}
                  </span>
                </div>

                {/* File */}
                {selectedTask.file && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold text-gray-700">File:</span>
                    <a
                      href={selectedTask.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline hover:text-blue-700"
                    >
                      Download File
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
                className="bg-blue-500 text-white px-5 py-2 rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
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
