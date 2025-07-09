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
  const DELETE_URL = `${API}api/auth/users/delete_user/`;
  const UPDATE_URL = `${API}api/auth/profile`;

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
      const apiUrl = `${UPDATE_URL}/${selectedStaff.user_id}/edit_profile/`;
      const updated = {
        first_name: selectedStaff.first_name,
        last_name: selectedStaff.last_name,
        phone_number: selectedStaff.phone_number,
        address: selectedStaff.address,
        dob: selectedStaff.dob,
        gender: selectedStaff.gender,
      };

      const response = await axios.patch(apiUrl, updated, {
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
    </div>
  );
};

export default StaffDetails;
