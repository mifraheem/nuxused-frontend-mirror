import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import { Buttons } from "../../components";
import Select from "react-select";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster";

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
  const [userProfile, setUserProfile] = useState(null);
  const [schoolId, setSchoolId] = useState(null);
  const [toaster, setToaster] = useState({ message: '', type: 'success' });

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

  const showToast = (message, type = 'success') => {
    setToaster({ message, type });
  };

  // Fetch current user's profile and school information
  // Inside TimetableManagement component

  const fetchUserProfile = async () => {
    try {
      const config = { headers };
      // First, fetch the user profile
      const profileRes = await axios.get(`${API}api/auth/users/list_profiles/teacher`, config);
      const profile = profileRes.data?.data || profileRes.data;

      console.log("🔍 User Profile:", profile);
      setUserProfile(profile);

      // Try to get school ID from profile first
      let userSchoolId =
        profile.school_id ||
        profile.school?.id ||
        profile.school_uuid ||
        profile.institution_id ||
        profile.institution_uuid ||
        profile.school ||
        profile.institution ||
        profile.organization_id ||
        profile.organization_uuid;

      // If no school ID is found in the profile, fetch from /api/schools/
      if (!userSchoolId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userSchoolId)) {
        console.log("🔄 No valid school ID in profile, fetching from /api/schools/");
        try {
          const schoolRes = await axios.get(`${API}api/schools/`, { headers });
          const schools = schoolRes.data?.data?.results || schoolRes.data?.results || schoolRes.data;

          if (Array.isArray(schools) && schools.length > 0) {
            // Assuming the first school in the list is the relevant one
            // Adjust this logic based on your API response structure
            userSchoolId = schools[0].id || schools[0].uuid || schools[0].school_id;

            console.log("🏫 School ID from /api/schools/:", userSchoolId);

            // Validate UUID format
            if (userSchoolId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userSchoolId)) {
              setSchoolId(userSchoolId);
            } else {
              console.warn("⚠️ Invalid school ID format from /api/schools/:", userSchoolId);
              setSchoolId(null);
              showToast("No valid school ID found in schools API", "error");
            }
          } else {
            console.warn("⚠️ No schools found in /api/schools/ response");
            setSchoolId(null);
            showToast("No schools found for this user", "error");
          }
        } catch (schoolError) {
          console.error("❌ Failed to fetch schools:", schoolError.response?.data || schoolError.message);
          setSchoolId(null);
          showToast("Failed to fetch school information", "error");
        }
      } else {
        console.log("🏫 Valid school ID from profile:", userSchoolId);
        setSchoolId(userSchoolId);
      }
    } catch (err) {
      console.error("❌ Failed to fetch user profile:", err.response?.data || err.message);
      setSchoolId(null);
      showToast("Failed to fetch user profile", "error");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Build URLs with school filtering if available
      const schoolParam = schoolId ? `?school_id=${schoolId}` : '';
      const timetableParam = schoolId ? `&school_id=${schoolId}` : '';

      const [timetableRes, teacherRes, subjectRes, roomRes, classRes] = await Promise.all([
        axios.get(`${API_URL}?page=${page}&page_size=${pageSize}${timetableParam}`, { headers }),
        axios.get(`${API}api/auth/users/list_profiles/teacher/${schoolParam}`, { headers }),
        axios.get(`${API}subjects/${schoolParam}`, { headers }),
        axios.get(`${API}rooms/${schoolParam}`, { headers }),
        axios.get(`${API}classes/${schoolParam}`, { headers }),
      ]);

      const data = timetableRes.data?.data || {};
      console.log("📊 API Responses:", { timetableRes: data, teacherRes: teacherRes.data, subjectRes: subjectRes.data });

      setTimetables(Array.isArray(data.results) ? data.results : []);
      setTotalPages(data.total_pages || 1);

      setTeachers(
        Array.isArray(teacherRes.data?.data?.results)
          ? teacherRes.data.data.results
          : Array.isArray(teacherRes.data?.results)
            ? teacherRes.data.results
            : []
      );

      setSubjects(
        Array.isArray(subjectRes.data?.data?.results)
          ? subjectRes.data.data.results
          : Array.isArray(subjectRes.data?.results)
            ? subjectRes.data.results
            : []
      );

      setRooms(
        Array.isArray(roomRes.data?.data?.results)
          ? roomRes.data.data.results
          : Array.isArray(roomRes.data?.results)
            ? roomRes.data.results
            : []
      );

      setClasses(
        Array.isArray(classRes.data?.data?.results)
          ? classRes.data.data.results
          : Array.isArray(classRes.data?.results)
            ? classRes.data.results
            : []
      );

      console.log("✅ Data loaded:", {
        teachers: teachers.length,
        subjects: subjects.length,
        rooms: rooms.length,
        classes: classes.length
      });

    } catch (error) {
      console.error("❌ Error fetching data:", error);
      showToast("Failed to fetch data", "error");
    } finally {
      setLoading(false);
    }
  };

  // First fetch user profile, then fetch data
  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      showToast("Authentication token not found", "error");
    }
  }, [token]);

  // When schoolId is available, fetch school-specific data
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, page, pageSize, schoolId]);

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

  // ✅ Create or Update Timetable (UUID Version)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const requestData = {
        teacher: formData.teacher, // Keep as UUID string
        subject: formData.subject, // Keep as UUID string
        class_schedule: formData.class_schedule, // Keep as UUID string
        start_time: formData.start_time,
        end_time: formData.end_time,
        room: formData.room, // Keep as UUID string
        days: formData.days || [],
      };

      console.log("📤 Sending UUID Data:", requestData);

      let response;
      if (editingId) {
        response = await axios.put(`${API_URL}${editingId}/`, requestData, { headers });
        showToast("Timetable updated successfully", "success");
      } else {
        response = await axios.post(API_URL, requestData, { headers });
        showToast("Timetable created successfully", "success");
      }

      fetchData();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);
      showToast(`Failed to save timetable: ${error.response?.data?.message || "Invalid input"}`, "error");
    }
  };

  // ✅ Load Data for Editing (UUID Version)
  const handleEdit = (timetable) => {
    console.log("🔧 Editing timetable:", timetable);

    // Find UUIDs based on names
    const selectedTeacher = teachers.find(t => t.username === timetable.teacher_name);
    const selectedSubject = subjects.find(s => s.subject_name === timetable.subject_name);
    const selectedClass = classes.find(c => c.class_name === timetable.class_name);
    const selectedRoom = rooms.find(r => r.room_name === timetable.room_name);

    setFormData({
      teacher: selectedTeacher?.id || selectedTeacher?.profile_id || "",
      subject: selectedSubject?.id || "",
      class_schedule: selectedClass?.id || "",
      room: selectedRoom?.id || "",
      start_time: timetable.start_time || "",
      end_time: timetable.end_time || "",
      days: timetable.days || [],
    });

    console.log("🔧 Form data set:", {
      teacher: selectedTeacher?.id || selectedTeacher?.profile_id,
      subject: selectedSubject?.id,
      class_schedule: selectedClass?.id,
      room: selectedRoom?.id,
    });

    setEditingId(timetable.id);
    setShowForm(true);
  };

  // ✅ Delete with Confirmation
  const handleDelete = (id) => {
    if (!canDelete) {
      showToast("You do not have permission to delete timetables.", "error");
      return;
    }

    showToast(
      {
        message: "Are you sure you want to delete this timetable?",
        type: "confirm",
        onConfirm: async () => {
          try {
            await axios.delete(`${API_URL}${id}/`, { headers });
            showToast("Timetable deleted successfully", "success");
            fetchData();
          } catch (error) {
            showToast("Failed to delete timetable", "error");
            console.error("❌ Error deleting timetable:", error);
          }
        },
        onCancel: () => setToaster({ message: "", type: "success" })
      },
      "confirm"
    );
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

  // ✅ Calculate sequence number based on pagination
  const getSequenceNumber = (index) => {
    return (page - 1) * pageSize + index + 1;
  };

  const columns = [
    { label: "Sr. No.", key: "sequence" }, // Updated column for sequence
    { label: "Teacher", key: "teacher_name" },
    { label: "Subject", key: "subject_name" },
    { label: "Class", key: "class_name" },
    { label: "Start Time", key: "start_time" },
    { label: "End Time", key: "end_time" },
  ];

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canAdd = permissions.includes("users.add_timetable");
  const canEdit = permissions.includes("users.change_timetable");
  const canDelete = permissions.includes("users.delete_timetable");
  const canView = permissions.includes("users.view_timetable");

  return (
    <div>
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={3000}
        onClose={() => setToaster({ message: "", type: "success" })}
        onConfirm={toaster.onConfirm}
        onCancel={toaster.onCancel}
      />

      {/* Header */}
      <div className="bg-blue-900 text-white py-2 px-8 rounded-lg shadow-md flex justify-between items-center mt-5">
        <h1 className="text-2xl font-bold tracking-wide">
          Timetable Management
          {userProfile?.school_name && (
            <span className="text-sm text-blue-200 ml-2">- {userProfile.school_name}</span>
          )}
        </h1>
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
              {/* Teacher - UUID Select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teacher <span className="text-red-500">*</span>
                </label>
                <Select
                  name="teacher"
                  value={teachers.find(t => (t.id || t.profile_id) === formData.teacher) || null}
                  onChange={(selected) => setFormData({ ...formData, teacher: selected?.id || selected?.profile_id || "" })}
                  options={teachers}
                  getOptionLabel={(t) => `${t.first_name} ${t.last_name}`}
                  getOptionValue={(t) => t.id || t.profile_id}
                  placeholder="Search & select teacher"
                  isClearable
                  isSearchable
                />
              </div>

              {/* Subject - UUID Select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <Select
                  name="subject"
                  value={subjects.find(s => s.id === formData.subject) || null}
                  onChange={(selected) => setFormData({ ...formData, subject: selected?.id || "" })}
                  options={subjects}
                  getOptionLabel={(s) => s.subject_name}
                  getOptionValue={(s) => s.id}
                  placeholder="Search & select subject"
                  isClearable
                  isSearchable
                />
              </div>

              {/* Class - UUID Select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Class <span className="text-red-500">*</span>
                </label>
                <Select
                  name="class_schedule"
                  value={classes.find(c => c.id === formData.class_schedule) || null}
                  onChange={(selected) => setFormData({ ...formData, class_schedule: selected?.id || "" })}
                  options={classes}
                  getOptionLabel={(c) => `${c.class_name} - ${c.section || 'N/A'} (${c.session || 'N/A'})`}
                  getOptionValue={(c) => c.id}
                  placeholder="Search & select class"
                  isClearable
                  isSearchable
                />
              </div>

              {/* Room - UUID Select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Room <span className="text-red-500">*</span>
                </label>
                <Select
                  name="room"
                  value={rooms.find(r => r.id === formData.room) || null}
                  onChange={(selected) => setFormData({ ...formData, room: selected?.id || "" })}
                  options={rooms}
                  getOptionLabel={(r) => `${r.room_name} (${r.room_type || 'N/A'})`}
                  getOptionValue={(r) => r.id}
                  placeholder="Search & select room"
                  isClearable
                  isSearchable
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
                  <option value="Saturday">Saturday</option>
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
          <table className="w-full border-collapse border bg-white">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2">Sr. No.</th>
                <th className="border p-2">Teacher</th>
                <th className="border p-2">Subject</th>
                <th className="border p-2">Class</th>
                <th className="border p-2">Start Time</th>
                <th className="border p-2">End Time</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {timetables.map((timetable, index) => (
                <tr className="text-center" key={timetable.id}>
                  <td className="border p-2 font-medium">
                    {getSequenceNumber(index)}
                  </td>
                  <td className="border p-2">{timetable.teacher_name}</td>
                  <td className="border p-2">{timetable.subject_name}</td>
                  <td className="border p-2">{timetable.class_name || "N/A"}</td>
                  <td className="border p-2">{timetable.start_time || "N/A"}</td>
                  <td className="border p-2">{timetable.end_time || "N/A"}</td>
                  <td className="border p-2 flex space-x-2 justify-center">
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
                </tr>
              ))}
            </tbody>
          </table>
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
          totalItems={timetables.length}
          showPageSizeSelector={true}
          showPageInfo={true}
        />

        {/* View Modal */}
        {showModal && selectedTimetable && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-100 to-blue-200">
                <h2 className="text-xl font-bold text-blue-800">📘 Timetable Details</h2>
                <button
                  className="text-gray-600 hover:text-red-500 text-2xl font-bold"
                  onClick={() => setShowModal(false)}
                >
                  &times;
                </button>
              </div>

              <div className="overflow-y-auto max-h-[70vh]">
                <table className="min-w-full text-sm text-gray-700">
                  <tbody className="divide-y divide-gray-200">
                    {[
                      ["🆔 ID", selectedTimetable.id],
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
                        <td className="py-3 px-6 break-all">{value || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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