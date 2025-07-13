import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import Select from "react-select";


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
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

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
    try {
      const token = Cookies.get("access_token");
      const response = await axios.get(`${API_URL}?page=${page}&page_size=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { results, total_pages } = response.data.data;
      setTasks(results);
      setTotalPages(total_pages);
    } catch (err) {
      toast.error("Failed to load class tasks.");
    }
  };

  const fetchClassOptions = async () => {
    try {
      const token = Cookies.get("access_token");
      const res = await axios.get(`${API}classes/?page_size=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClassOptions(res.data?.data?.results || []);
    } catch (err) {
      toast.error("Failed to load class list.");
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

      const url = editingTask ? `${API_URL}${editingTask.id}/` : API_URL;
      const method = editingTask ? "put" : "post";

      const response = await axios[method](url, formData, config);

      toast.success(`Task ${editingTask ? "updated" : "created"} successfully`);
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
      fetchTasks();
    } catch (err) {
      toast.error("Failed to save task.");
    }
  };

  const handleEdit = (task) => {
    setNewTask({
      class_schedule: task.class_schedule,
      title: task.title,
      description: task.description,
      start_date: task.start_date.split("T")[0],
      due_date: task.due_date.split("T")[0],
      file: null,
    });
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (!canDelete) {
      toast.error("You do not have permission to delete class tasks.");
      return;
    }

    toast(
      (t) => (
        <div>
          <p className="text-gray-800">Are you sure you want to delete this task?</p>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={async () => {
                try {
                  const token = Cookies.get("access_token");
                  await axios.delete(`${API_URL}${id}/`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  toast.success("Task deleted.");
                  fetchTasks();
                } catch {
                  toast.error("Failed to delete task.");
                }
                toast.dismiss(t.id);
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-md"
            >
              Yes
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-300 text-black px-4 py-2 rounded-md"
            >
              No
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  return (
    <div className="p-6">
      <Toaster />
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
            className="bg-cyan-400 px-4 py-2 rounded shadow hover:bg-cyan-500"
          >
            {showForm ? "Close Form" : "Add Task"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-blue-50 p-6 rounded-md mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              className="w-full"
              isClearable
              placeholder="Select Class"
              options={classOptions}
              getOptionLabel={(cls) => `${cls.class_name} - ${cls.section} (${cls.session})`}
              getOptionValue={(cls) => cls.id}
              value={classOptions.find((cls) => cls.id === parseInt(newTask.class_schedule)) || null}
              onChange={(selected) =>
                setNewTask({ ...newTask, class_schedule: selected?.id || "" })
              }
            />


            <input
              type="text"
              placeholder="Title"
              className="p-2 border rounded"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
            <input
              type="date"
              className="p-2 border rounded"
              value={newTask.start_date}
              onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
            />
            <input
              type="date"
              className="p-2 border rounded"
              value={newTask.due_date}
              onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
            />
            <textarea
              placeholder="Description"
              className="col-span-2 p-2 border rounded"
              rows={3}
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            ></textarea>
            <input type="file" onChange={handleFileChange} className="col-span-2" />
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={handleSave} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              {editingTask ? "Update Task" : "Save Task"}
            </button>
          </div>
        </div>
      )}

      <table className="w-full mt-6 border border-collapse bg-white shadow-sm">
        <thead className="bg-blue-900 text-white">
          <tr>
            <th className="border p-2">#</th>
            <th className="border p-2">Title</th>
            <th className="border p-2">Class Schedule</th>
            <th className="border p-2">Start Date</th>
            <th className="border p-2">Due Date</th>
            <th className="border p-2">File</th>
            {(canEdit || canDelete) && <th className="border p-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td className="border p-2">{task.id}</td>
              <td className="border p-2">{task.title}</td>
              <td className="border p-2">{task.class_schedule}</td>
              <td className="border p-2">{task.start_date?.split("T")[0]}</td>
              <td className="border p-2">{task.due_date?.split("T")[0]}</td>
              <td className="border p-2">
                {task.file ? (
                  <a href={task.file} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    Download
                  </a>
                ) : (
                  "No File"
                )}
              </td>
              {(canEdit || canDelete) && (
                <td className="border p-2 flex gap-2 justify-center">
                  <MdVisibility onClick={() => setSelectedTask(task)} className="text-blue-500 cursor-pointer" size={22} />
                  {canEdit && (
                    <MdEdit onClick={() => handleEdit(task)} className="text-yellow-500 cursor-pointer" size={22} />
                  )}
                  {canDelete && (
                    <MdDelete onClick={() => handleDelete(task.id)} className="text-red-500 cursor-pointer" size={22} />
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center gap-2">
          <label className="font-semibold">Page Size:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="border rounded px-3 py-1"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} className="px-3 py-1 border rounded">
            Prev
          </button>
          <span className="px-3 py-1 bg-blue-600 text-white rounded">{page}</span>
          <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages} className="px-3 py-1 border rounded">
            Next
          </button>
        </div>
      </div>

      {/* View Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 p-6 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-2xl font-bold text-blue-800">📝 Task Overview</h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-500 hover:text-red-600 text-xl font-bold"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-sm text-gray-700">
              <div>
                <span className="font-semibold text-gray-600">📌 Title</span>
                <p className="mt-1">{selectedTask.title}</p>
              </div>

              <div>
                <span className="font-semibold text-gray-600">📆 Start Date</span>
                <p className="mt-1">{selectedTask.start_date}</p>
              </div>

              <div>
                <span className="font-semibold text-gray-600">⏰ Due Date</span>
                <p className="mt-1">{selectedTask.due_date}</p>
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
                <span className="font-semibold text-gray-600">🧾 Description</span>
                <div className="bg-gray-50 p-4 mt-1 rounded-md border text-gray-800 leading-relaxed whitespace-pre-line">
                  {selectedTask.description}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-right">
              <button
                onClick={() => setSelectedTask(null)}
                className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-full font-semibold shadow-sm"
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
