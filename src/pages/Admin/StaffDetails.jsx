import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { FiTrash, FiEdit, FiEye } from "react-icons/fi";
import { Buttons } from "../../components";

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
  const UPDATE_URL = `${API}api/auth/staff-profile`;

  const fetchStaff = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) return toast.error("User is not authenticated.");

      const response = await axios.get(`${API_URL}?page=${currentPage}&page_size=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && Array.isArray(response.data.data.results)) {
        const formatted = response.data.data.results.map((s) => ({
          id: s.profile_id,
          user_id: s.user_id,
          username: s.username,
          first_name: s.first_name || "N/A",
          last_name: s.last_name || "N/A",
          email: s.email || "N/A",
          phone_number: s.phone_number || "N/A",
          address: s.address || "N/A",
          dob: s.dob || "N/A",
          gender: s.gender || "N/A",
          salary: s.salary || null,
        }));
        setStaff(formatted);
        setTotalPages(response.data.data.total_pages);
      } else {
        toast.error("Unexpected API response format.");
        setStaff([]);
      }
    } catch {
      toast.error("Failed to fetch staff.");
    }
  };

  const confirmDelete = (id) => {
    if (!canDelete) {
      return toast.error("You do not have permission to delete staff.");
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
          >Yes, Delete</button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
          >Cancel</button>
        </div>
      </div>
    ));
  };

  const deleteStaff = async (id) => {
    try {
      const token = Cookies.get("access_token");
      await axios.delete(`${DELETE_URL}${id}/delete_user/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Staff deleted successfully.");
      setStaff((prev) => prev.filter((s) => s.user_id !== id));
    } catch {
      toast.error("Failed to delete staff.");
    }
  };

  const updateStaff = async () => {
    try {
      const token = Cookies.get("access_token");
      const apiUrl = `${UPDATE_URL}/${selectedStaff.user_id}/update/`;
      const updated = {
        first_name: selectedStaff.first_name,
        last_name: selectedStaff.last_name,
        phone_number: selectedStaff.phone_number,
        address: selectedStaff.address,
        dob: selectedStaff.dob,
        gender: selectedStaff.gender,
      };

      const response = await axios.put(apiUrl, updated, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      if (response.status === 200) {
        toast.success("Staff profile updated.");
        fetchStaff();
        setIsEditModalOpen(false);
      } else toast.error("Unexpected response from server.");
    } catch {
      toast.error("Failed to update staff.");
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [currentPage, pageSize]);

  const handlePageChange = (page) => setCurrentPage(page);
  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canView = permissions.includes("users.view_teacherprofile");
  const canEdit = permissions.includes("users.change_staffprofile");
  const canDelete = permissions.includes("users.delete_teacherprofile") && permissions.includes("users.delete_user");

  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <h1 className="bg-blue-900 text-white py-4 px-6 text-xl font-bold">Manage Staff Details</h1>
      <div className="p-6">
        <Buttons />
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm bg-white">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="border px-4 py-2">User ID</th>
                <th className="border px-4 py-2">Username</th>
                <th className="border px-4 py-2">FirstName</th>
                <th className="border px-4 py-2">LastName</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">Phone</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td className="border px-4 py-2">{s.user_id}</td>
                  <td className="border px-4 py-2">{s.username}</td>
                  <td className="border px-4 py-2">{s.first_name}</td>
                  <td className="border px-4 py-2">{s.last_name}</td>
                  <td className="border px-4 py-2">{s.email}</td>
                  <td className="border px-4 py-2">{s.phone_number}</td>
                  <td className="border px-4 py-2 flex justify-center gap-3">
                    {canView && <FiEye className="text-blue-500 cursor-pointer" onClick={() => { setSelectedStaff(s); setIsViewModalOpen(true); }} title="View Staff" />}
                    {canEdit && <FiEdit className="text-green-500 cursor-pointer" onClick={() => { setSelectedStaff(s); setIsEditModalOpen(true); }} title="Edit Staff" />}
                    {canDelete && <FiTrash className="text-red-500 cursor-pointer" onClick={() => confirmDelete(s.user_id)} title="Delete Staff" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* // ✅ View Modal for Staff */}
      {isViewModalOpen && selectedStaff && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden max-h-[85vh] border border-gray-200">
            <div className="bg-blue-600 text-white text-center py-4 px-6 border-b">
              <h2 className="text-xl font-bold">👤 Staff Profile</h2>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] text-sm space-y-4">
              {[
                ["Username", selectedStaff.username],
                ["First Name", selectedStaff.first_name],
                ["Last Name", selectedStaff.last_name],
                ["Email", selectedStaff.email],
                ["Phone", selectedStaff.phone_number],
                ["Address", selectedStaff.address],
                ["Date of Birth", selectedStaff.dob],
                ["Gender", selectedStaff.gender],
                ["Salary", selectedStaff.salary !== null && selectedStaff.salary !== undefined ? `Rs.${selectedStaff.salary}` : "N/A"],
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
              >Close</button>
            </div>
          </div>
        </div>
      )}

{/* // ✅ Edit Modal for Staff */}
      {isEditModalOpen && selectedStaff && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden max-h-[85vh] border border-gray-200">
            <div className="bg-blue-600 text-white text-center py-4 px-6 border-b">
              <h2 className="text-xl font-bold">✏️ Edit Staff Profile</h2>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              {["first_name", "last_name", "phone_number", "address"].map((field, i) => (
                <div key={i}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {field.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </label>
                  <input
                    type="text"
                    value={selectedStaff[field] || ""}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, [field]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}

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
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-md"
              >Cancel</button>
              <button
                onClick={updateStaff}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md"
              >Save</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StaffDetails;
