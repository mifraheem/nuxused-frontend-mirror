import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { FiTrash, FiEdit, FiEye } from "react-icons/fi";
import { Buttons } from "../../components";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster"; // Import custom Toaster component

const TeacherDetails = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [toaster, setToaster] = useState({ message: "", type: "success" });
  const [confirmResolve, setConfirmResolve] = useState(null);

  const API = import.meta.env.VITE_SERVER_URL ;
  const API_URL = `${API}api/auth/users/list_profiles/teacher/`;
  const DELETE_URL = `${API}api/auth/users/`;
  const UPDATE_URL = `${API}api/auth/update-teacher-profile/`;

  // Permissions
  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canView = permissions.includes("users.view_teacherprofile");
  const canEdit = permissions.includes("users.change_teacherprofile");
  const canDelete =
    permissions.includes("users.delete_teacherprofile") &&
    permissions.includes("users.delete_user");

  const authHeaders = () => {
    const token = Cookies.get("access_token");
    if (!token) throw new Error("Authentication token missing");
    return { Authorization: `Bearer ${token}` };
  };

  const isValidId = (id) => {
    if (!id) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(String(id)) || !isNaN(id) || typeof id === "string";
  };

  const showToast = (message, type = "success") => {
    setToaster({ message, type });
  };

  const confirmToast = (message = "Delete this teacher?") => {
    return new Promise((resolve) => {
      setConfirmResolve(() => resolve); // Store the resolve function
      setToaster({
        message: (
          <div className="flex flex-col gap-4">
            <p className="text-lg font-medium">{message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setToaster({ message: "", type: "success" });
                  resolve(true);
                }}
                className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
              >
                Yes
              </button>
              <button
                onClick={() => {
                  setToaster({ message: "", type: "success" });
                  resolve(false);
                }}
                className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
              >
                No
              </button>
            </div>
          </div>
        ),
        type: "confirmation",
      });
    });
  };

  const fetchTeachers = async (page = currentPage, size = pageSize) => {
    try {
      const response = await axios.get(`${API_URL}?page=${page}&page_size=${size}`, {
        headers: authHeaders(),
      });
      const payload = response.data?.data;
      if (payload?.results) {
        const formatted = payload.results.map((t) => ({
          id: t.profile_id,
          user_id: t.user_id,
          username: t.username || "N/A",
          first_name: t.first_name || "N/A",
          last_name: t.last_name || "N/A",
          email: t.email || "N/A",
          phone_number: t.phone_number || "N/A",
          address: t.address || "N/A",
          dob: t.dob || "N/A",
          gender: t.gender || "N/A",
          salary: t.salary ?? null,
          registration_no: t.registration_no || "N/A",
          profile_picture: t.profile_picture || null,
        }));
        setTeachers(formatted);
        setTotalPages(payload.total_pages || 1);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Error fetching teachers:", error.response?.data || error.message);
      showToast(
        "Failed to fetch teachers: " + (error.response?.data?.message || error.message),
        "error"
      );
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [currentPage, pageSize]);

  const confirmDeleteTeacher = async (id) => {
    if (!canDelete) {
      showToast("You do not have permission to delete teacher profiles.", "error");
      return;
    }
    if (!isValidId(id)) {
      showToast("Invalid teacher ID format.", "error");
      return;
    }

    const ok = await confirmToast("Delete this teacher?");
    if (ok) {
      deleteTeacher(id);
    }
  };

  const deleteTeacher = async (id) => {
    try {
      await axios.delete(`${DELETE_URL}${id}/delete_user/`, { headers: authHeaders() });
      showToast("Teacher deleted successfully.", "success");
      setTeachers((prev) => prev.filter((t) => t.user_id != id));
    } catch (error) {
      console.error("Error deleting teacher:", error.response?.data || error.message);
      showToast(
        "Failed to delete teacher: " + (error.response?.data?.message || error.message),
        "error"
      );
    }
  };

  const openEditModal = (teacher) => {
    setSelectedTeacher(teacher);
    setIsEditModalOpen(true);
  };

  const openViewModal = (teacher) => {
    setSelectedTeacher(teacher);
    setIsViewModalOpen(true);
  };

  const updateTeacher = async () => {
    if (!selectedTeacher?.user_id) {
      showToast("No teacher selected.", "error");
      return;
    }
    if (!isValidId(selectedTeacher.user_id)) {
      showToast("Invalid user ID format.", "error");
      return;
    }
    if (!selectedTeacher.first_name || !selectedTeacher.last_name) {
      showToast("First name and last name are required.", "error");
      return;
    }
    if (selectedTeacher.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedTeacher.email)) {
      showToast("Invalid email format.", "error");
      return;
    }
    if (selectedTeacher.phone_number && !/^\d{7,15}$/.test(selectedTeacher.phone_number)) {
      showToast("Invalid phone number format.", "error");
      return;
    }
    if (selectedTeacher.salary && isNaN(selectedTeacher.salary)) {
      showToast("Salary must be a valid number.", "error");
      return;
    }

    try {
      const apiUrl = `${UPDATE_URL}${selectedTeacher.user_id}/update/`;
      const formData = new FormData();
      formData.append("username", selectedTeacher.username || "");
      formData.append("first_name", selectedTeacher.first_name || "");
      formData.append("last_name", selectedTeacher.last_name || "");
      formData.append("phone_number", selectedTeacher.phone_number || "");
      formData.append("address", selectedTeacher.address || "");
      formData.append("email", selectedTeacher.email || "");
      formData.append("dob", selectedTeacher.dob || "2000-01-01");
      formData.append("gender", selectedTeacher.gender || "");
      formData.append("registration_no", selectedTeacher.registration_no || "");
      formData.append("salary", selectedTeacher.salary || "");
      if (selectedTeacher.new_profile_picture) {
        formData.append("profile_picture", selectedTeacher.new_profile_picture);
      }

      const response = await axios.patch(apiUrl, formData, {
        headers: {
          ...authHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        showToast("Teacher profile updated successfully.", "success");
        setSelectedTeacher((prev) => ({
          ...prev,
          ...response.data.data,
          new_profile_picture: null,
        }));
        fetchTeachers();
        setIsEditModalOpen(false);
      } else {
        showToast("Unexpected response status: " + response.status, "error");
      }
    } catch (error) {
      console.error("Error updating teacher:", error.response?.data || error.message);
      const errMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message;
      if (error.response?.status === 405) {
        showToast("Server does not allow PATCH requests.", "error");
      } else if (error.response?.status === 404) {
        showToast("Teacher profile endpoint not found.", "error");
      } else {
        showToast("Failed to update teacher: " + errMsg, "error");
      }
    }
  };

  return (
    <div className="p-2 md:p-3">
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={toaster.type === "confirmation" ? 5000 : 3000}
        onClose={() => setToaster({ message: "", type: "success" })}
      />

      {/* Header bar (compact) */}
      <div className="bg-blue-900 text-white rounded-md flex items-center justify-between px-2 py-2 mt-2">
        <h1 className="text-sm md:text-base font-bold">Manage Teacher Details</h1>
      </div>

      <div className="mt-2 p-2">
        <Buttons
          data={teachers.map((t, index) => ({
            "Sequence Number": (currentPage - 1) * pageSize + index + 1,
            Username: t.username,
            "First Name": t.first_name,
            "Last Name": t.last_name,
            Email: t.email,
            Phone: t.phone_number,
            Salary: t.salary,
          }))}
          filename="Teacher_Profiles"
          columns={[
            { label: "Sequence Number", key: "Sequence Number" },
            { label: "Username", key: "Username" },
            { label: "First Name", key: "First Name" },
            { label: "Last Name", key: "Last Name" },
            { label: "Email", key: "Email" },
            { label: "Phone", key: "Phone" },
            { label: "Salary", key: "Salary" },
          ]}
        />

        {/* Table with safe horizontal scroll (sidebar open friendly) */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full border-collapse border border-gray-300 bg-white min-w-[700px]">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="border border-gray-300 p-1 text-center text-xs">No.</th>
                <th className="border border-gray-300 p-1 text-center text-xs">First Name</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Last Name</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Email</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Phone</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length > 0 ? (
                teachers.map((t, index) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-1 text-center text-xs">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="border border-gray-300 p-1 text-xs">{t.first_name}</td>
                    <td className="border border-gray-300 p-1 text-xs">{t.last_name}</td>
                    <td className="border border-gray-300 p-1 text-xs">
                      <span className="block max-w-[220px] truncate" title={t.email}>
                        {t.email}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-1 text-xs">{t.phone_number}</td>
                    <td className="border border-gray-300 p-1">
                      <div className="flex items-center justify-center gap-2">
                        {canView && (
                          <FiEye
                            className="text-blue-500 cursor-pointer hover:text-blue-700"
                            size={18}
                            onClick={() => openViewModal(t)}
                            title="View"
                          />
                        )}
                        {canEdit && (
                          <FiEdit
                            className="text-yellow-500 cursor-pointer hover:text-yellow-700"
                            size={18}
                            onClick={() => openEditModal(t)}
                            title="Edit"
                          />
                        )}
                        {canDelete && (
                          <FiTrash
                            className="text-red-500 cursor-pointer hover:text-red-700"
                            size={18}
                            onClick={() => confirmDeleteTeacher(t.user_id)}
                            title="Delete"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="border border-gray-300 p-2 text-center text-gray-500 text-sm"
                  >
                    No teacher profiles added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={(newPage) => {
              setCurrentPage(newPage);
              fetchTeachers(newPage, pageSize);
            }}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
              fetchTeachers(1, size);
            }}
            totalItems={teachers.length}
            showPageSizeSelector={true}
            showPageInfo={true}
          />
        </div>
      </div>

      {/* View Modal (compact & scrollable) */}
      {isViewModalOpen && selectedTeacher && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 px-2 z-50">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl border border-gray-300 overflow-hidden">
            <div className="px-3 py-2 bg-blue-600 text-white">
              <h2 className="text-sm md:text-base font-bold text-center">Teacher Details</h2>
            </div>
            <div className="p-3 overflow-y-auto max-h-[62vh]">
              <table className="w-full text-xs border border-gray-200">
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <th className="px-2 py-1 w-1/3 text-left text-gray-700">Profile Picture</th>
                    <td className="px-2 py-1">
                      {selectedTeacher.profile_picture ? (
                        <img
                          src={`${API}${selectedTeacher.profile_picture}`}
                          alt="Profile"
                          className="w-20 h-20 rounded-full border object-cover"
                        />
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-700">Username</th>
                    <td className="px-2 py-1">{selectedTeacher.username}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-700">First Name</th>
                    <td className="px-2 py-1">{selectedTeacher.first_name}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-700">Last Name</th>
                    <td className="px-2 py-1">{selectedTeacher.last_name}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-700">Email</th>
                    <td className="px-2 py-1">{selectedTeacher.email}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-700">Phone</th>
                    <td className="px-2 py-1">{selectedTeacher.phone_number}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-700">Address</th>
                    <td className="px-2 py-1">{selectedTeacher.address}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-700">Date of Birth</th>
                    <td className="px-2 py-1">{selectedTeacher.dob}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-700">Gender</th>
                    <td className="px-2 py-1 capitalize">{selectedTeacher.gender}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-700">Registration No</th>
                    <td className="px-2 py-1">{selectedTeacher.registration_no}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-700">Salary</th>
                    <td className="px-2 py-1">
                      {selectedTeacher.salary ? `Rs. ${selectedTeacher.salary}` : "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex justify-end px-3 py-2 bg-gray-50">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (compact & scrollable) */}
      {isEditModalOpen && selectedTeacher && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 px-2 z-50">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl border border-gray-300 overflow-hidden">
            <div className="px-3 py-2 bg-blue-600 text-white">
              <h2 className="text-sm md:text-base font-bold text-center">Edit Teacher Profile</h2>
            </div>
            <div className="px-3 py-2 overflow-y-auto max-h-[62vh] space-y-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-0.5">Username</label>
                <input
                  type="text"
                  value={selectedTeacher.username || ""}
                  onChange={(e) =>
                    setSelectedTeacher({ ...selectedTeacher, username: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={selectedTeacher.first_name || ""}
                    onChange={(e) =>
                      setSelectedTeacher({ ...selectedTeacher, first_name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={selectedTeacher.last_name || ""}
                    onChange={(e) =>
                      setSelectedTeacher({ ...selectedTeacher, last_name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={selectedTeacher.phone_number || ""}
                    onChange={(e) =>
                      setSelectedTeacher({ ...selectedTeacher, phone_number: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">Email</label>
                  <input
                    type="email"
                    value={selectedTeacher.email || ""}
                    onChange={(e) =>
                      setSelectedTeacher({ ...selectedTeacher, email: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-0.5">Address</label>
                <input
                  type="text"
                  value={selectedTeacher.address || ""}
                  onChange={(e) =>
                    setSelectedTeacher({ ...selectedTeacher, address: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={selectedTeacher.dob || ""}
                    onChange={(e) =>
                      setSelectedTeacher({ ...selectedTeacher, dob: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                    Gender
                  </label>
                  <select
                    value={selectedTeacher.gender || ""}
                    onChange={(e) =>
                      setSelectedTeacher({ ...selectedTeacher, gender: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                    Registration No
                  </label>
                  <input
                    type="text"
                    value={selectedTeacher.registration_no || ""}
                    onChange={(e) =>
                      setSelectedTeacher({ ...selectedTeacher, registration_no: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">Salary</label>
                  <input
                    type="number"
                    value={selectedTeacher.salary || ""}
                    onChange={(e) =>
                      setSelectedTeacher({ ...selectedTeacher, salary: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                  Profile Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setSelectedTeacher({
                      ...selectedTeacher,
                      new_profile_picture: e.target.files?.[0],
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs bg-white"
                />
                {/* Preview (new or existing) */}
                <div className="mt-2">
                  {selectedTeacher.new_profile_picture ? (
                    <img
                      src={URL.createObjectURL(selectedTeacher.new_profile_picture)}
                      alt="Preview"
                      className="w-20 h-20 rounded-full border object-cover"
                    />
                  ) : selectedTeacher.profile_picture ? (
                    <img
                      src={`${API}${selectedTeacher.profile_picture}`}
                      alt="Current"
                      className="w-20 h-20 rounded-full border object-cover"
                    />
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-3 py-2 bg-gray-50">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-xs"
              >
                Cancel
              </button>
              <button
                onClick={updateTeacher}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDetails;