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

  const isValidId = (id) => {
    if (!id) return false;
    return !isNaN(id) || typeof id === 'string';
  };

  const fetchStaff = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        throw new Error("Authentication token missing");
      }
      const response = await axios.get(`${API_URL}?page=${currentPage}&page_size=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Staff list response:", response.data);
      if (response.data?.data?.results) {
        const formatted = response.data.data.results.map((s, index) => {
          console.log(`Staff ${index + 1} user_id:`, s.user_id, `Valid ID:`, isValidId(s.user_id));
          return {
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
            salary: s.salary || null,
            registration_no: s.registration_no || "N/A",
            profile_picture: s.profile_picture || null,
          };
        });
        setStaff(formatted);
        setTotalPages(response.data.data.total_pages || 1);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Error fetching staff:", error.response?.data);
      toast.error("Failed to fetch staff: " + (error.response?.data?.message || error.message));
    }
  };

  const confirmDelete = (id) => {
    if (!canDelete) {
      toast.error("You do not have permission to delete staff profiles.");
      return;
    }

    console.log("Confirm delete staff ID:", id);
    if (!isValidId(id)) {
      toast.error("Invalid staff ID format.");
      return;
    }

    toast((t) => (
      <div className="text-center">
        <p className="font-semibold">Are you sure you want to delete this staff member?</p>
        <div className="flex justify-center gap-4 mt-3">
          <button
            onClick={() => {
              deleteStaff(id);
              toast.dismiss(t.id);
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Yes, Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const deleteStaff = async (id) => {
    try {
      const token = Cookies.get("access_token");
      console.log("Deleting staff with ID:", id);
      await axios.delete(`${DELETE_URL}${id}/delete_user/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Staff deleted successfully.");
      setStaff((prev) => prev.filter((s) => s.user_id != id));
    } catch (error) {
      console.error("Error deleting staff:", error.response?.data);
      toast.error("Failed to delete staff: " + (error.response?.data?.message || error.message));
    }
  };

  const updateStaff = async () => {
    if (!selectedStaff?.user_id) {
      toast.error("No staff selected.");
      console.log("No user_id in selectedStaff:", selectedStaff);
      return;
    }

    console.log("Selected staff user_id:", selectedStaff.user_id, "Valid ID:", isValidId(selectedStaff.user_id));
    if (!isValidId(selectedStaff.user_id)) {
      toast.error("Invalid user ID format. Must be a valid integer or string.");
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
      const token = Cookies.get("access_token");
      if (!token) {
        throw new Error("Authentication token missing");
      }

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

      console.log("Updating staff with payload:", [...formData.entries()], "to URL:", apiUrl);

      const response = await axios.patch(apiUrl, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Update staff response:", response.data);

      if (response.status === 200) {
        toast.success("Staff profile updated successfully.");
        setSelectedStaff((prev) => ({
          ...prev,
          ...response.data.data,
          new_profile_picture: null, // Reset file input
        }));
        fetchStaff();
        setIsEditModalOpen(false);
      } else {
        toast.error("Unexpected response status: " + response.status);
      }
    } catch (error) {
      console.error("Error updating staff:", error.response?.data);
      const errMsg = error.response?.data?.message || error.response?.data?.error || error.response?.data?.detail || error.message;
      if (error.response?.status === 405) {
        toast.error("Server does not allow PATCH requests. Contact backend team to enable PATCH or use another method.");
      } else if (error.response?.status === 404) {
        toast.error("Staff profile endpoint not found. Please check the user ID or API configuration.");
      } else {
        toast.error("Failed to update staff: " + errMsg);
      }
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [currentPage, pageSize]);

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canView = permissions.includes("users.view_staffprofile");
  const canEdit = permissions.includes("users.change_staffprofile");
  const canDelete = permissions.includes("users.delete_staffprofile") && permissions.includes("users.delete_user");

  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <h1 className="bg-blue-900 text-white py-4 px-6 text-xl font-bold rounded-lg mx-6 mt-6">Manage Staff Details</h1>
      <div className="p-6">
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

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm bg-white">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="border px-4 py-2">User ID</th>
                <th className="border px-4 py-2">First Name</th>
                <th className="border px-4 py-2">Last Name</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">Phone</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.length > 0 ? (
                staff.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{s.user_id}</td>
                    <td className="border px-4 py-2">{s.first_name}</td>
                    <td className="border px-4 py-2">{s.last_name}</td>
                    <td className="border px-4 py-2">{s.email}</td>
                    <td className="border px-4 py-2">{s.phone_number}</td>
                    <td className="border px-4 py-2 flex justify-center gap-3">
                      {canView && (
                        <FiEye
                          className="text-blue-500 cursor-pointer"
                          onClick={() => {
                            setSelectedStaff(s);
                            setIsViewModalOpen(true);
                          }}
                          title="View Staff"
                        />
                      )}
                      {canEdit && (
                        <FiEdit
                          className="text-green-500 cursor-pointer"
                          onClick={() => {
                            setSelectedStaff(s);
                            setIsEditModalOpen(true);
                          }}
                          title="Edit Staff"
                        />
                      )}
                      {canDelete && (
                        <FiTrash
                          className="text-red-500 cursor-pointer"
                          onClick={() => confirmDelete(s.user_id)}
                          title="Delete Staff"
                        />
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="border px-4 py-2 text-center text-gray-500">
                    No staff profiles available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={(newPage) => {
            setCurrentPage(newPage);
            fetchStaff();
          }}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
            fetchStaff();
          }}
          totalItems={staff.length}
          showPageSizeSelector={true}
          showPageInfo={true}
        />
      </div>

      {isViewModalOpen && selectedStaff && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden max-h-[85vh] border border-gray-200">
            <div className="bg-blue-600 text-white text-center py-4 px-6 border-b">
              <h2 className="text-xl font-bold">👤 Staff Profile</h2>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] text-sm space-y-4">
              {selectedStaff.profile_picture && (
                <div className="flex justify-center mb-4">
                  <img
                    src={`${API}${selectedStaff.profile_picture}`}
                    alt="Profile"
                    className="w-28 h-28 rounded-full border object-cover shadow"
                  />
                </div>
              )}
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
                ["Salary", selectedStaff.salary !== null && selectedStaff.salary !== undefined ? `Rs. ${selectedStaff.salary}` : "N/A"],
              ].map(([label, value], i) => (
                <div key={i} className="flex justify-between border-b pb-1">
                  <span className="font-semibold text-gray-700">{label}:</span>
                  <span className="text-gray-600">{value || "N/A"}</span>
                </div>
              ))}
            </div>
            <div className="border-t px-6 py-4 flex justify-center">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md shadow-md"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedStaff && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden max-h-[85vh] border border-gray-200">
            <div className="bg-blue-600 text-white text-center py-4 px-6 border-b">
              <h2 className="text-xl font-bold">✏️ Edit Staff Profile</h2>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={selectedStaff.username || ""}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={selectedStaff.first_name || ""}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={selectedStaff.last_name || ""}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={selectedStaff.email || ""}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={selectedStaff.phone_number || ""}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, phone_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={selectedStaff.address || ""}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={selectedStaff.dob || ""}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, dob: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                <select
                  value={selectedStaff.gender || ""}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Registration No</label>
                <input
                  type="text"
                  value={selectedStaff.registration_no || ""}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, registration_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Salary</label>
                <input
                  type="number"
                  value={selectedStaff.salary || ""}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, salary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, new_profile_picture: e.target.files[0] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={updateStaff}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md"
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