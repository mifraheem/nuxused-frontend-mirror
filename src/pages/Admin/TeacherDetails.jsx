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

  const API = import.meta.env.VITE_SERVER_URL;
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

  // const confirmToast = (message = "Delete this teacher?") => {
  //   return new Promise((resolve) => {
  //     setConfirmResolve(() => resolve); // Store the resolve function
  //     setToaster({
  //       message: (
  //         <div className="flex flex-col gap-4">
  //           <p className="text-lg font-medium">{message}</p>
  //           <div className="flex justify-end gap-2">
  //             <button
  //               onClick={() => {
  //                 setToaster({ message: "", type: "success" });
  //                 resolve(true);
  //               }}
  //               className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
  //             >
  //               Yes
  //             </button>
  //             <button
  //               onClick={() => {
  //                 setToaster({ message: "", type: "success" });
  //                 resolve(false);
  //               }}
  //               className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
  //             >
  //               No
  //             </button>
  //           </div>
  //         </div>
  //       ),
  //       type: "confirmation",
  //     });
  //   });
  // };

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

const confirmDeleteTeacher = (id) => {
  if (!canDelete) {
    showToast("You do not have permission to delete teacher profiles.", "error");
    return;
  }
  if (!isValidId(id)) {
    showToast("Invalid teacher ID format.", "error");
    return;
  }

  setToaster({
    message: "Are you sure you want to delete this teacher?",
    type: "confirmation",
    onConfirm: async () => {
      await deleteTeacher(id); // Call deleteTeacher directly
    },
    onCancel: () => {
      showToast("Delete cancelled", "error");
    },
  });
};

const deleteTeacher = async (id) => {
  try {
    await axios.delete(`${DELETE_URL}${id}/delete_user/`, { headers: authHeaders() });
    setTeachers((prev) => prev.filter((t) => t.user_id !== id));
    showToast("Teacher deleted successfully.", "success");
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
        duration={3000}
        // duration={toaster.type === "confirmation" ? 5000 : 3000}
        onClose={() => setToaster({ message: "", type: "success" })}
        onConfirm={toaster.onConfirm}
        onCancel={toaster.onCancel}
      />


      {/* Header bar (compact) */}
      <div className="bg-blue-900 text-white rounded-md flex items-center justify-between px-2 py-2 mt-2">
        <h1 className="text-sm md:text-base font-bold">Manage Teacher Details</h1>
      </div>

      <div className="mt-2 p-2">
        <Buttons
          data={teachers.map((t, index) => ({
            // "S.No": (page - 1) * pageSize + index + 1,
            Username: t.username,
            "First Name": t.first_name,
            "Last Name": t.last_name,
            Email: t.email,
            Phone: t.phone_number,
            Salary: t.salary,
          }))}
          filename="Teacher_Profiles"
          columns={[
            // { label: "S.No", key: "S.No" },
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
                <th className="border border-gray-300 p-1 text-center text-xs">Full Name</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Email</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Phone</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Address</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Gender</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Registration No.</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Salary</th>
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
                    <td className="border border-gray-300 p-1 text-xs">{t.first_name} {t.last_name}</td>
                    <td className="border border-gray-300 p-1 text-xs">
                      <span className="block max-w-[220px] truncate" title={t.email}>
                        {t.email}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-1 text-xs">{t.phone_number}</td>
                    <td className="border border-gray-300 p-1 text-xs">{t.address}</td>
                    <td className="border border-gray-300 p-1 text-xs">{t.gender}</td>
                    <td className="border border-gray-300 p-1 text-xs">{t.registration_no}</td>
                    <td className="border border-gray-300 p-1 text-xs">{t.salary}</td>
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 overflow-hidden">

            {/* Header */}
            <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-bold">Teacher Details</h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="flex flex-col md:flex-row gap-6 items-center">

                {/* Profile Picture */}
                <div className="flex flex-col items-center">
                  {selectedTeacher.profile_picture ? (
                    <img
                      src={`${API}${selectedTeacher.profile_picture}`}
                      alt="Profile"
                      className="w-32 h-32 object-cover rounded-full border-4 border-blue-200 shadow-md"
                    />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center rounded-full bg-gray-100 text-gray-400">
                      No Image
                    </div>
                  )}
                  <p className="mt-3 font-semibold text-lg">
                    {selectedTeacher.first_name} {selectedTeacher.last_name}
                  </p>
                  <p className="text-gray-500 text-sm">{selectedTeacher.username || "N/A"}</p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Email</p>
                    <p className="text-base font-medium break-words">{selectedTeacher.email || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Phone</p>
                    <p className="text-base font-medium">{selectedTeacher.phone_number || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Address</p>
                    <p className="text-base font-medium">{selectedTeacher.address || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Date of Birth</p>
                    <p className="text-base font-medium">{selectedTeacher.dob || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Gender</p>
                    <p className="text-base font-medium capitalize">{selectedTeacher.gender || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Registration No</p>
                    <p className="text-base font-medium">{selectedTeacher.registration_no || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Salary</p>
                    <p className="text-base font-medium">
                      {selectedTeacher.salary ? `Rs. ${selectedTeacher.salary}` : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 py-4 bg-gray-50">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm md:text-base shadow-md"
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 px-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 overflow-hidden">

            {/* Header */}
            <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-bold">Edit Teacher Profile</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[70vh] space-y-4">

              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={selectedTeacher.username || ""}
                  onChange={(e) =>
                    setSelectedTeacher({ ...selectedTeacher, username: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* First + Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={selectedTeacher.first_name || ""}
                    onChange={(e) =>
                      setSelectedTeacher({ ...selectedTeacher, first_name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={selectedTeacher.last_name || ""}
                    onChange={(e) =>
                      setSelectedTeacher({ ...selectedTeacher, last_name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Phone + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={selectedTeacher.phone_number || ""}
                    onChange={(e) =>
                      setSelectedTeacher({ ...selectedTeacher, phone_number: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={selectedTeacher.email || ""}
                    onChange={(e) =>
                      setSelectedTeacher({ ...selectedTeacher, email: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={selectedTeacher.address || ""}
                  onChange={(e) =>
                    setSelectedTeacher({ ...selectedTeacher, address: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* DOB + Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={selectedTeacher.dob || ""}
                    onChange={(e) =>
                      setSelectedTeacher({ ...selectedTeacher, dob: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                  <select
                    value={selectedTeacher.gender || ""}
                    onChange={(e) =>
                      setSelectedTeacher({ ...selectedTeacher, gender: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Registration No + Salary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Registration No</label>
                  <input
                    type="text"
                    value={selectedTeacher.registration_no || ""}
                    onChange={(e) =>
                      setSelectedTeacher({ ...selectedTeacher, registration_no: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Salary</label>
                  <input
                    type="number"
                    value={selectedTeacher.salary || ""}
                    onChange={(e) =>
                      setSelectedTeacher({ ...selectedTeacher, salary: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setSelectedTeacher({
                      ...selectedTeacher,
                      new_profile_picture: e.target.files?.[0],
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                />

                {/* Preview */}
                <div className="mt-3">
                  {selectedTeacher.new_profile_picture ? (
                    <img
                      src={URL.createObjectURL(selectedTeacher.new_profile_picture)}
                      alt="Preview"
                      className="w-24 h-24 rounded-full border object-cover shadow-sm"
                    />
                  ) : selectedTeacher.profile_picture ? (
                    <img
                      src={`${API}${selectedTeacher.profile_picture}`}
                      alt="Current"
                      className="w-24 h-24 rounded-full border object-cover shadow-sm"
                    />
                  ) : null}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={updateTeacher}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-semibold shadow-md"
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