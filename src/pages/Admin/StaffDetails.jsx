import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { FiTrash, FiEdit, FiEye } from "react-icons/fi";
import { Buttons } from "../../components";
import Pagination from "../../components/Pagination";

const StaffDetails = () => {
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}api/auth/users/list_profiles/staff/`;
  const DELETE_URL = `${API}api/auth/users/`;
  const UPDATE_URL = `${API}api/auth/staff-profile/`;

  // Permissions
  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canView = permissions.includes("users.view_staffprofile");
  const canEdit = permissions.includes("users.change_staffprofile");
  const canDelete =
    permissions.includes("users.delete_staffprofile") &&
    permissions.includes("users.delete_user");

  // Helpers
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

  // Fetch
  const fetchStaff = async (page = currentPage, size = pageSize) => {
    try {
      const response = await axios.get(`${API_URL}?page=${page}&page_size=${size}`, {
        headers: authHeaders(),
      });
      const payload = response.data?.data;
      if (payload?.results) {
        const formatted = payload.results.map((s) => ({
          id: s.profile_id,
          user_id: s.user_id,
          username: s.username || "N/A",
          first_name: s.first_name || "N/A",
          last_name: s.last_name || "N/A",
          email: s.email || "N/A",
          phone_number: s.phone_number || "N/A",
          address: s.address || "N/A",
          dob: s.dob || "N/A",
          gender: s.gender || "N/A",
          salary: s.salary ?? null,
          registration_no: s.registration_no || "N/A",
          profile_picture: s.profile_picture || null,
        }));
        setStaff(formatted);
        setTotalPages(payload.total_pages || 1);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Error fetching staff:", error.response?.data || error.message);
      toast.error("Failed to fetch staff: " + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  // Actions
  const confirmDelete = (id) => {
    if (!canDelete) {
      toast.error("You do not have permission to delete staff profiles.");
      return;
    }
    if (!isValidId(id)) {
      toast.error("Invalid staff ID format.");
      return;
    }

    toast(
      (t) => (
        <div className="text-center">
          <p className="font-semibold">Delete this staff member?</p>
          <div className="flex justify-center gap-2 mt-2">
            <button
              onClick={() => {
                deleteStaff(id);
                toast.dismiss(t.id);
              }}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
            >
              Yes
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-300 text-black px-3 py-1 rounded hover:bg-gray-400 text-sm"
            >
              No
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  const deleteStaff = async (id) => {
    try {
      await axios.delete(`${DELETE_URL}${id}/delete_user/`, {
        headers: authHeaders(),
      });
      toast.success("Staff deleted successfully.");
      setStaff((prev) => prev.filter((s) => s.user_id != id));
    } catch (error) {
      console.error("Error deleting staff:", error.response?.data || error.message);
      toast.error("Failed to delete staff: " + (error.response?.data?.message || error.message));
    }
  };

  const updateStaff = async () => {
    if (!selectedStaff?.user_id) {
      toast.error("No staff selected.");
      return;
    }
    if (!isValidId(selectedStaff.user_id)) {
      toast.error("Invalid user ID format.");
      return;
    }
    if (!selectedStaff.first_name || !selectedStaff.last_name) {
      toast.error("First name and last name are required.");
      return;
    }
    if (selectedStaff.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedStaff.email)) {
      toast.error("Invalid email format.");
      return;
    }
    if (selectedStaff.phone_number && !/^\d{5,15}$/.test(selectedStaff.phone_number)) {
      toast.error("Invalid phone number format.");
      return;
    }
    if (selectedStaff.salary && isNaN(selectedStaff.salary)) {
      toast.error("Salary must be a valid number.");
      return;
    }

    try {
      const apiUrl = `${UPDATE_URL}${selectedStaff.user_id}/update/`;
      const formData = new FormData();
      formData.append("username", selectedStaff.username || "");
      formData.append("first_name", selectedStaff.first_name || "");
      formData.append("last_name", selectedStaff.last_name || "");
      formData.append("phone_number", selectedStaff.phone_number || "");
      formData.append("address", selectedStaff.address || "");
      formData.append("email", selectedStaff.email || "");
      formData.append("dob", selectedStaff.dob || "2000-01-01");
      formData.append("gender", selectedStaff.gender || "");
      formData.append("registration_no", selectedStaff.registration_no || "");
      formData.append("salary", selectedStaff.salary || "");
      if (selectedStaff.new_profile_picture) {
        formData.append("profile_picture", selectedStaff.new_profile_picture);
      }

      const response = await axios.patch(apiUrl, formData, {
        headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        toast.success("Staff profile updated successfully.");
        setSelectedStaff((prev) => ({
          ...prev,
          ...response.data.data,
          new_profile_picture: null,
        }));
        fetchStaff();
        setIsEditModalOpen(false);
      } else {
        toast.error("Unexpected response status: " + response.status);
      }
    } catch (error) {
      console.error("Error updating staff:", error.response?.data || error.message);
      const errMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message;
      if (error.response?.status === 405) {
        toast.error("Server does not allow PATCH requests.");
      } else if (error.response?.status === 404) {
        toast.error("Staff profile endpoint not found.");
      } else {
        toast.error("Failed to update staff: " + errMsg);
      }
    }
  };

  // UI
  return (
    <div className="p-2 md:p-3">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Header bar (compact) */}
      <div className="bg-blue-900 text-white rounded-md flex items-center justify-between px-2 py-2 mt-2">
        <h1 className="text-sm md:text-base font-bold">Manage Staff Details</h1>
      </div>

      <div className="mt-2 p-2">
        <Buttons
          data={staff}
          filename="Staff_Profiles"
          columns={[
            { label: "User ID", key: "user_id" },
            { label: "Username", key: "username" },
            { label: "First Name", key: "first_name" },
            { label: "Last Name", key: "last_name" },
            { label: "Email", key: "email" },
            { label: "Phone", key: "phone_number" },
            { label: "Salary", key: "salary" },
          ]}
        />

        {/* Table with safe horizontal scroll */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full border-collapse border border-gray-300 bg-white min-w-[700px]">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="border border-gray-300 p-1 text-center text-xs">User ID</th>
                <th className="border border-gray-300 p-1 text-center text-xs">First Name</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Last Name</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Email</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Phone</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.length > 0 ? (
                staff.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-1 text-xs">
                      <span className="block max-w-[160px] truncate" title={s.user_id}>
                        {s.user_id}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-1 text-xs">{s.first_name}</td>
                    <td className="border border-gray-300 p-1 text-xs">{s.last_name}</td>
                    <td className="border border-gray-300 p-1 text-xs">
                      <span className="block max-w-[220px] truncate" title={s.email}>
                        {s.email}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-1 text-xs">{s.phone_number}</td>
                    <td className="border border-gray-300 p-1">
                      <div className="flex items-center justify-center gap-2">
                        {canView && (
                          <FiEye
                            className="text-blue-500 cursor-pointer hover:text-blue-700"
                            size={18}
                            onClick={() => {
                              setSelectedStaff(s);
                              setIsViewModalOpen(true);
                            }}
                            title="View"
                          />
                        )}
                        {canEdit && (
                          <FiEdit
                            className="text-yellow-500 cursor-pointer hover:text-yellow-700"
                            size={18}
                            onClick={() => {
                              setSelectedStaff(s);
                              setIsEditModalOpen(true);
                            }}
                            title="Edit"
                          />
                        )}
                        {canDelete && (
                          <FiTrash
                            className="text-red-500 cursor-pointer hover:text-red-700"
                            size={18}
                            onClick={() => confirmDelete(s.user_id)}
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
                    No staff profiles available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={(newPage) => {
              setCurrentPage(newPage);
              fetchStaff(newPage, pageSize);
            }}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
              fetchStaff(1, size);
            }}
            totalItems={staff.length}
            showPageSizeSelector={true}
            showPageInfo={true}
          />
        </div>
      </div>

      {/* View Modal (compact & scrollable) */}
      {isViewModalOpen && selectedStaff && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 px-2 z-50">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl border border-gray-300 overflow-hidden">
            <div className="px-3 py-2 bg-blue-600 text-white">
              <h2 className="text-sm md:text-base font-bold text-center">Staff Profile</h2>
            </div>
            <div className="p-3 overflow-y-auto max-h-[62vh]">
              {selectedStaff.profile_picture && (
                <div className="flex justify-center mb-3">
                  <img
                    src={`${API}${selectedStaff.profile_picture}`}
                    alt="Profile"
                    className="w-20 h-20 rounded-full border object-cover"
                  />
                </div>
              )}
              <table className="w-full text-xs border border-gray-200">
                <tbody className="divide-y divide-gray-100">
                  {[
                    ["Username", selectedStaff.username],
                    ["First Name", selectedStaff.first_name],
                    ["Last Name", selectedStaff.last_name],
                    ["Email", selectedStaff.email],
                    ["Phone", selectedStaff.phone_number],
                    ["Address", selectedStaff.address],
                    ["Date of Birth", selectedStaff.dob],
                    ["Gender", selectedStaff.gender],
                    ["Registration No", selectedStaff.registration_no],
                    [
                      "Salary",
                      selectedStaff.salary != null ? `Rs. ${selectedStaff.salary}` : "N/A",
                    ],
                  ].map(([label, val], i) => (
                    <tr key={i}>
                      <th className="px-2 py-1 text-left text-gray-700 w-1/3">{label}</th>
                      <td className="px-2 py-1">{val || "N/A"}</td>
                    </tr>
                  ))}
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
      {isEditModalOpen && selectedStaff && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 px-2 z-50">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl border border-gray-300 overflow-hidden">
            <div className="px-3 py-2 bg-blue-600 text-white">
              <h2 className="text-sm md:text-base font-bold text-center">Edit Staff Profile</h2>
            </div>
            <div className="px-3 py-2 overflow-y-auto max-h-[62vh] space-y-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-0.5">Username</label>
                <input
                  type="text"
                  value={selectedStaff.username || ""}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, username: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">First Name</label>
                  <input
                    type="text"
                    value={selectedStaff.first_name || ""}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, first_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">Last Name</label>
                  <input
                    type="text"
                    value={selectedStaff.last_name || ""}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, last_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">Email</label>
                  <input
                    type="email"
                    value={selectedStaff.email || ""}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">Phone Number</label>
                  <input
                    type="text"
                    value={selectedStaff.phone_number || ""}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, phone_number: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-0.5">Address</label>
                <input
                  type="text"
                  value={selectedStaff.address || ""}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">Date of Birth</label>
                  <input
                    type="date"
                    value={selectedStaff.dob || ""}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, dob: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">Gender</label>
                  <select
                    value={selectedStaff.gender || ""}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, gender: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">Registration No</label>
                  <input
                    type="text"
                    value={selectedStaff.registration_no || ""}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, registration_no: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">Salary</label>
                  <input
                    type="number"
                    value={selectedStaff.salary || ""}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, salary: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-0.5">Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setSelectedStaff({
                      ...selectedStaff,
                      new_profile_picture: e.target.files?.[0],
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs bg-white"
                />
                <div className="mt-2">
                  {selectedStaff.new_profile_picture ? (
                    <img
                      src={URL.createObjectURL(selectedStaff.new_profile_picture)}
                      alt="Preview"
                      className="w-20 h-20 rounded-full border object-cover"
                    />
                  ) : selectedStaff.profile_picture ? (
                    <img
                      src={`${API}${selectedStaff.profile_picture}`}
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
                onClick={updateStaff}
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

export default StaffDetails;
