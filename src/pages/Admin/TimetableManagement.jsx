import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import { Buttons } from "../../components";
import Select from "react-select";

const TimetableManagement = () => {
  const [timetables, setTimetables] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    teacher: "",
    subject: "",
    class_schedule: "",
    start_time: "",
    end_time: "",
    room: "",
    days: [],
  });

  const API = import.meta.env.VITE_SERVER_URL;

  const API_URL = `${API}timetables/`;
  const token = Cookies.get("access_token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchData = async () => {
    setLoading(true);
    try {
      const [timetableRes, teacherRes, subjectRes, roomRes, classRes] = await Promise.all([
        axios.get(`${API_URL}?page=${page}&page_size=${pageSize}`, { headers }),
        axios.get(`${API}api/auth/users/list_profiles/teacher/`, { headers }),
        axios.get(`${API}subjects/`, { headers }),
        axios.get(`${API}rooms/`, { headers }),
        axios.get(`${API}classes/`, { headers }),
      ]);

      const data = timetableRes.data?.data || {};

      setTimetables(Array.isArray(data.results) ? data.results : []);
      setTotalPages(data.total_pages || 1);

      setTeachers(
        Array.isArray(teacherRes.data?.data?.results)
          ? teacherRes.data.data.results
          : []
      );

      console.log("👨‍🏫 Teachers Loaded:", teacherRes.data?.data);

      setSubjects(
        Array.isArray(subjectRes.data?.data?.results)
          ? subjectRes.data.data.results
          : []
      );

      setRooms(
        Array.isArray(roomRes.data?.data?.results)
          ? roomRes.data.data.results
          : []
      );

      setClasses(
        Array.isArray(classRes.data?.data?.results)
          ? classRes.data.data.results
          : []
      );

    } catch (error) {
      console.error("❌ Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (token) {
      fetchData();
    } else {
      toast.error("Authentication token not found");
    }
  }, [token]);

  // ✅ Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle Multi-Select for Days
  const handleDaysChange = (e) => {
    const selectedDays = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData((prev) => ({ ...prev, days: selectedDays }));
  };

  // ✅ Create or Update Timetable
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const requestData = {
        teacher: parseInt(formData.teacher), // ✅ Now using teacher.profile_id
        subject: parseInt(formData.subject), // Convert to integer
        class_schedule: parseInt(formData.class_schedule), // Convert to integer
        start_time: formData.start_time,
        end_time: formData.end_time,
        room: parseInt(formData.room), // Convert to integer
        days: formData.days || [],
      };

      console.log("📤 Sending Data:", requestData);

      let response;
      if (editingId) {
        response = await axios.put(`${API_URL}${editingId}/`, requestData, { headers });
        toast.success("Timetable updated successfully");
      } else {
        response = await axios.post(API_URL, requestData, { headers });
        toast.success("Timetable created successfully");
      }

      fetchData();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);
      toast.error(`Failed to save timetable: ${error.response?.data?.message || "Invalid input"}`);
    }
  };




  // ✅ Load Data for Editing
  const handleEdit = (timetable) => {
    setFormData({
      teacher: teachers.find(t => t.profile_id === timetable.teacher)?.profile_id?.toString() || "",
      subject: subjects.find(s => s.subject_name === timetable.subject_name)?.id.toString() || "",
      class_schedule: classes.find(c => c.class_name === timetable.class_name)?.id.toString() || "",
      room: rooms.find(r => r.room_name === timetable.room_name)?.id.toString() || "",
      start_time: timetable.start_time || "",
      end_time: timetable.end_time || "",
      days: timetable.days || [],
    });

    setEditingId(timetable.id);
    setShowForm(true);
  };




  // ✅ Delete with Confirmation
  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error("You do not have permission to delete timetables.");
      return;
    }

    toast((t) => (
      <div>
        <p className="text-gray-600">Are you sure you want to delete this timetable?</p>
        <div className="flex justify-end mt-2">
          <button
            onClick={async () => {
              try {
                await axios.delete(`${API_URL}${id}/`, { headers });
                toast.success("Timetable deleted successfully");
                fetchData();
                toast.dismiss(t.id);
              } catch (error) {
                toast.error("Failed to delete timetable");
              }
            }}
            className="bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-700 mr-2"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-500 text-white px-3 py-1 rounded shadow hover:bg-gray-700"
          >
            No
          </button>
        </div>
      </div>
    ));
  };


  // ✅ View Details in Modal
  const handleView = (timetable) => {
    setSelectedTimetable(timetable);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedTimetable(null);
  };

  // ✅ Reset Form
  const resetForm = () => {
    setFormData({
      teacher: "",
      subject: "",
      class_schedule: "",
      start_time: "",
      end_time: "",
      room: "",
      days: [],
    });
    setEditingId(null);
  };
  const columns = [
    { label: "ID", key: "id" },
    { label: "Teacher", key: "teacher_name" },
    { label: "Subject", key: "subject_name" },
    { label: "Class", key: "class_name" },
    { label: "Start Time", key: "start_time" },
    { label: "End Time", key: "end_time" },
  ];

  useEffect(() => {
    if (token) {
      fetchData();
    } else {
      toast.error("Authentication token not found");
    }
  }, [token, page, pageSize]);

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");

  const canAdd = permissions.includes("users.add_timetable");
  const canEdit = permissions.includes("users.change_timetable");
  const canDelete = permissions.includes("users.delete_timetable");
  const canView = permissions.includes("users.view_timetable");


  return (
    <div >
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-blue-900 text-white py-2 px-8 rounded-lg shadow-md flex justify-between items-center mt-5">
        <h1 className="text-2xl font-bold tracking-wide">Timetable Management</h1>
        {canAdd && (
          <button
            onClick={() => {
              setShowForm((prev) => !prev);
              resetForm();
            }}
            className="flex items-center px-4 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-600 transition duration-300"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-black rounded-full mr-2">
              <span className="text-cyan-500 text-xl font-bold">+</span>
            </div>
            {showForm ? "Cancel" : "Add Timetable"}
          </button>
        )}


      </div>

      <div className="p-6">
        {/* Form */}
        {canAdd && showForm && (
          <form
            onSubmit={handleSubmit}
            className="max-w-5xl mx-auto mt-10 bg-white border border-gray-200 rounded-2xl shadow-lg px-10 py-8"
          >
            <h2 className="text-3xl font-bold text-blue-800 mb-8 text-center">
              {editingId ? "Edit Timetable" : "Add New Timetable"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Teacher */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teacher <span className="text-red-500">*</span>
                </label>
                <Select
                  name="teacher"
                  value={teachers.find(t => t.profile_id == formData.teacher) || null}
                  onChange={(selected) => setFormData({ ...formData, teacher: selected?.profile_id || "" })}
                  options={teachers}
                  getOptionLabel={(t) => t.username}
                  getOptionValue={(t) => t.profile_id}
                  placeholder="Search & select teacher"
                  isClearable
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <Select
                  name="subject"
                  value={subjects.find(s => s.id == formData.subject) || null}
                  onChange={(selected) => setFormData({ ...formData, subject: selected?.id || "" })}
                  options={subjects}
                  getOptionLabel={(s) => s.subject_name}
                  getOptionValue={(s) => s.id}
                  placeholder="Search & select subject"
                  isClearable
                />
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Class <span className="text-red-500">*</span>
                </label>
                <Select
                  name="class_schedule"
                  value={classes.find(c => c.id == formData.class_schedule) || null}
                  onChange={(selected) => setFormData({ ...formData, class_schedule: selected?.id || "" })}
                  options={classes}
                  getOptionLabel={(c) => `${c.class_name} - ${c.section} (${c.session})`}
                  getOptionValue={(c) => c.id}
                  placeholder="Search & select class"
                  isClearable
                />
              </div>

              {/* Room */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Room <span className="text-red-500">*</span>
                </label>
                <Select
                  name="room"
                  value={rooms.find(r => r.id == formData.room) || null}
                  onChange={(selected) => setFormData({ ...formData, room: selected?.id || "" })}
                  options={rooms}
                  getOptionLabel={(r) => r.room_name}
                  getOptionValue={(r) => r.id}
                  placeholder="Search & select room"
                  isClearable
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Days */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Days <span className="text-red-500">*</span>
                </label>
                <select
                  multiple
                  value={formData.days}
                  onChange={handleDaysChange}
                  required
                  className="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none h-32"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                </select>
                <p className="text-gray-500 text-xs mt-1">
                  Hold <strong>Ctrl</strong> (or <strong>Cmd</strong> on Mac) to select multiple days.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-10">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-2 rounded-lg shadow-md transition duration-200"
              >
                {editingId ? "Update Timetable" : "Save Timetable"}
              </button>
            </div>
          </form>
        )}





        {/* Table */}
        <Buttons data={timetables} columns={columns} filename="Timetables" />

        <h2 className="text-lg font-semibold text-white bg-blue-900 px-4 py-2 rounded-t-md">
          Timetable
        </h2>
        {canView && (
          <table className="w-full  border-collapse border bg-white">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2">#ID</th>
                <th className="border p-2">Teacher</th>
                <th className="border p-2">Subject</th>
                <th className="border p-2">Class</th>
                <th className="border p-2">Start Time</th>
                <th className="border p-2">End Time</th>
                {(canEdit || canDelete) && <th className="border p-2">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {timetables.map((timetable) => (
                <tr className="text-center" key={timetable.id}>
                  {/* #ID */}
                  <td className="border p-2">{timetable.id}</td>
                  {/* Teacher */}
                  <td className="border p-2">{timetable.teacher_name}</td>

                  {/* Subject */}
                  <td className="border p-2">{timetable.subject_name}</td>

                  {/* Class */}
                  <td className="border p-2">{timetable.class_name || "N/A"}</td>

                  {/* Start Time */}
                  <td className="border p-2">{timetable.start_time || "N/A"}</td>

                  {/* End Time */}
                  <td className="border p-2">{timetable.end_time || "N/A"}</td>

                  {/* Actions */}
                  {(canEdit || canDelete) && (
                    <td className="border p-2 flex space-x-2 justify-center">
                      {/* Edit Button */}
                      <MdVisibility
                        onClick={() => handleView(timetable)}
                        className="text-blue-500 cursor-pointer"
                      />
                      {canEdit && (
                        <MdEdit
                          onClick={() => handleEdit(timetable)}
                          className="text-yellow-500 text-2xl cursor-pointer hover:text-yellow-700"
                        />
                      )}
                      {canDelete && (
                        <MdDelete
                          onClick={() => handleDelete(timetable.id)}
                          className="text-red-500 text-2xl cursor-pointer hover:text-red-700"
                        />
                      )}

                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {/* Pagination Section Below Table */}
        <div className="flex justify-between items-center bg-blue-50 p-4 rounded-b-md">
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
              className={`px-3 py-1 rounded-md font-semibold ${page === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-gray-100'
                }`}
            >
              Prev
            </button>

            <span className="px-3 py-1 bg-blue-600 text-white font-bold rounded-md">{page}</span>

            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className={`px-3 py-1 rounded-md font-semibold ${page === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-gray-100'
                }`}
            >
              Next
            </button>
          </div>
        </div>

        {/* View Modal */}
        {showModal && selectedTimetable && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">

              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-100 to-blue-200">
                <h2 className="text-xl font-bold text-blue-800">📘 Timetable Details</h2>
                <button
                  className="text-gray-600 hover:text-red-500 text-2xl font-bold"
                  onClick={() => setShowModal(false)}
                >
                  &times;
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto max-h-[70vh]">
                <table className="min-w-full text-sm text-gray-700">
                  <tbody className="divide-y divide-gray-200">
                    {[
                      ["👨‍🏫 Teacher", selectedTimetable.teacher_name],
                      ["📘 Subject", selectedTimetable.subject_name],
                      ["🏫 Class", selectedTimetable.class_name],
                      ["🏷️ Section", selectedTimetable.section],
                      ["📆 Session", selectedTimetable.session],
                      ["🏢 Room", selectedTimetable.room_name],
                      ["🕘 Start Time", selectedTimetable.start_time],
                      ["🕒 End Time", selectedTimetable.end_time],
                      ["📅 Days", selectedTimetable.days?.join(", ") || "N/A"],
                    ].map(([label, value], idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-3 px-6 font-semibold bg-gray-50 w-1/3">{label}</td>
                        <td className="py-3 px-6">{value || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t bg-gray-50 text-right">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg transition duration-200"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}



      </div>
    </div>
  );
};

export default TimetableManagement;
