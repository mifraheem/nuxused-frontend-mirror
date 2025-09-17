import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { FiTrash, FiEdit, FiEye } from "react-icons/fi";
import { Buttons } from "../../components";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster";
import TableComponent from "../../components/TableComponent"; // Import reusable TableComponent

const StaffDetails = () => {
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [toaster, setToaster] = useState({ message: "", type: "success" });

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

  const showToast = (message, type = "success") => {
    setToaster({ message, type });
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
      showToast(
        "Failed to fetch staff: " + (error.response?.data?.message || error.message),
        "error"
      );
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [currentPage, pageSize]);

  // Actions
  const confirmDelete = (id) => {
    if (!canDelete) {
      showToast("You do not have permission to delete staff profiles.", "error");
      return;
    }
    if (!isValidId(id)) {
      showToast("Invalid staff ID format.", "error");
      return;
    }

    setToaster({
      message: "Are you sure you want to delete this staff member?",
      type: "confirmation",
      onConfirm: () => deleteStaff(id),
      onCancel: () => showToast("Delete cancelled", "error"),
    });
  };

  const deleteStaff = async (id) => {
    try {
      await axios.delete(`${DELETE_URL}${id}/delete_user/`, {
        headers: authHeaders(),
      });
      showToast("Staff deleted successfully.", "success");
      setStaff((prev) => prev.filter((s) => s.user_id !== id));
      fetchStaff(currentPage, pageSize);
    } catch (error) {
      console.error("Error deleting staff:", error.response?.data || error.message);
      showToast(
        "Failed to delete staff: " + (error.response?.data?.message || error.message),
        "error"
      );
    }
  };

  const updateStaff = async () => {
    if (!selectedStaff?.user_id) {
      showToast("No staff selected.", "error");
      return;
    }
    if (!isValidId(selectedStaff.user_id)) {
      showToast("Invalid user ID format.", "error");
      return;
    }
    if (!selectedStaff.first_name || !selectedStaff.last_name) {
      showToast("First name and last name are required.", "error");
      return;
    }
    if (selectedStaff.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedStaff.email)) {
      showToast("Invalid email format.", "error");
      return;
    }
    if (selectedStaff.phone_number && !/^\d{5,15}$/.test(selectedStaff.phone_number)) {
      showToast("Invalid phone number format.", "error");
      return;
    }
    if (selectedStaff.salary && isNaN(selectedStaff.salary)) {
      showToast("Salary must be a valid number.", "error");
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
        showToast("Staff profile updated successfully.", "success");
        setSelectedStaff((prev) => ({
          ...prev,
          ...response.data.data,
          new_profile_picture: null,
        }));
        fetchStaff();
        setIsEditModalOpen(false);
      } else {
        showToast("Unexpected response status: " + response.status, "error");
      }
    } catch (error) {
      console.error("Error updating staff:", error.response?.data || error.message);
      const errMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message;
      if (error.response?.status === 405) {
        showToast("Server does not allow PATCH requests.", "error");
      } else if (error.response?.status === 404) {
        showToast("Staff profile endpoint not found.", "error");
      } else {
        showToast("Failed to update staff: " + errMsg, "error");
      }
    }
  };

  // Table columns configuration
  const columns = [
    {
      key: "index",
      label: "No.",
      render: (row, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      key: "full_name",
      label: "Full Name",
      render: (row) => `${row.first_name} ${row.last_name}`,
    },
    {
      key: "email",
      label: "Email",
      render: (row) => (
        <span className="block max-w-[220px] truncate" title={row.email}>
          {row.email || "N/A"}
        </span>
      ),
    },
    {
      key: "phone_number",
      label: "Phone",
      render: (row) => row.phone_number || "N/A",
    },
    {
      key: "address",
      label: "Address",
      render: (row) => row.address || "N/A",
    },
    {
      key: "gender",
      label: "Gender",
      render: (row) => (row.gender ? row.gender.charAt(0).toUpperCase() + row.gender.slice(1) : "N/A"),
    },
    {
      key: "registration_no",
      label: "Registration No.",
      render: (row) => row.registration_no || "N/A",
    },
    {
      key: "salary",
      label: "Salary",
      render: (row) => (row.salary != null ? `Rs. ${row.salary}` : "N/A"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          {canView && (
            <FiEye
              className="text-blue-500 cursor-pointer hover:text-blue-700"
              size={18}
              onClick={() => {
                setSelectedStaff(row);
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
                setSelectedStaff(row);
                setIsEditModalOpen(true);
              }}
              title="Edit"
            />
          )}
          {canDelete && (
            <FiTrash
              className="text-red-500 cursor-pointer hover:text-red-700"
              size={18}
              onClick={() => confirmDelete(row.user_id)}
              title="Delete"
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-2 md:p-3">
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={toaster.type === "confirmation" ? 5000 : 3000}
        onClose={() => setToaster({ message: "", type: "success" })}
        onConfirm={toaster.onConfirm}
        onCancel={toaster.onCancel}
      />

      {/* Header bar */}
      <div className="bg-blue-900 text-white rounded-md flex items-center justify-between px-2 py-2 mt-2">
        <h1 className="text-sm md:text-base font-bold">Manage Staff Details</h1>
      </div>

      <div className="mt-2 p-2">
        <Buttons
          data={staff.map((s, index) => ({
            Username: s.username,
            "First Name": s.first_name,
            "Last Name": s.last_name,
            Email: s.email,
            Phone: s.phone_number,
            Salary: s.salary,
          }))}
          filename="Staff_Profiles"
          columns={[
            { label: "Username", key: "Username" },
            { label: "First Name", key: "First Name" },
            { label: "Last Name", key: "Last Name" },
            { label: "Email", key: "Email" },
            { label: "Phone", key: "Phone" },
            { label: "Salary", key: "Salary" },
          ]}
        />

        {/* Table */}
        <div className="overflow-x-auto mt-2">
          {staff.length > 0 ? (
            <TableComponent
              data={staff}
              columns={columns}
              initialSort={{ key: "full_name", direction: "asc" }}
            />
          ) : (
            <div className="border border-gray-300 p-2 text-center text-gray-500 text-sm bg-white rounded-lg shadow-lg">
              No staff profiles added yet.
            </div>
          )}
        </div>

        {/* Pagination */}
        {/* <div className="mt-2">
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
        </div> */}
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-bold">Staff Profile</h2>
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
                  {selectedStaff.profile_picture ? (
                    <img
                      src={`${API}${selectedStaff.profile_picture}`}
                      alt="Profile"
                      className="w-32 h-32 object-cover rounded-full border-4 border-blue-200 shadow-md"
                    />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center rounded-full bg-gray-100 text-gray-400">
                      No Image
                    </div>
                  )}
                  <p className="mt-3 font-semibold text-lg">
                    {selectedStaff.first_name} {selectedStaff.last_name}
                  </p>
                  <p className="text-gray-500 text-sm">{selectedStaff.username || "N/A"}</p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Email</p>
                    <p className="text-base font-medium break-words">{selectedStaff.email || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Phone</p>
                    <p className="text-base font-medium">{selectedStaff.phone_number || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Address</p>
                    <p className="text-base font-medium">{selectedStaff.address || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Date of Birth</p>
                    <p className="text-base font-medium">{selectedStaff.dob || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Gender</p>
                    <p className="text-base font-medium capitalize">{selectedStaff.gender || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Registration No</p>
                    <p className="text-base font-medium">{selectedStaff.registration_no || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Salary</p>
                    <p className="text-base font-medium">
                      {selectedStaff.salary != null ? `Rs. ${selectedStaff.salary}` : "N/A"}
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

      {/* Edit Modal */}
      {isEditModalOpen && selectedStaff && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 px-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-bold">Edit Staff Profile</h2>
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
                  value={selectedStaff.username || ""}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, username: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* First + Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={selectedStaff.first_name || ""}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, first_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={selectedStaff.last_name || ""}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, last_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={selectedStaff.email || ""}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={selectedStaff.phone_number || ""}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, phone_number: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={selectedStaff.address || ""}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* DOB + Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={selectedStaff.dob || ""}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, dob: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                  <select
                    value={selectedStaff.gender || ""}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, gender: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
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
                    value={selectedStaff.registration_no || ""}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, registration_no: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Salary</label>
                  <input
                    type="number"
                    value={selectedStaff.salary || ""}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, salary: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    setSelectedStaff({ ...selectedStaff, new_profile_picture: e.target.files?.[0] })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                />
                <div className="mt-3">
                  {selectedStaff.new_profile_picture ? (
                    <img
                      src={URL.createObjectURL(selectedStaff.new_profile_picture)}
                      alt="Preview"
                      className="w-24 h-24 rounded-full border object-cover shadow-sm"
                    />
                  ) : selectedStaff.profile_picture ? (
                    <img
                      src={`${API}${selectedStaff.profile_picture}`}
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
                onClick={updateStaff}
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

export default StaffDetails;