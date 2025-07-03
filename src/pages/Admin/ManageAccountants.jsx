import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { FiTrash, FiEdit, FiEye } from "react-icons/fi";
import { Buttons } from "../../components";
import baseUrl from "../../lib/apiUrl";

const ManageAccountants = () => {
  const [accountants, setAccountants] = useState([]);
  const [selectedAccountant, setSelectedAccountant] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const API = import.meta.env.VITE_SERVER_URL;

  const API_URL = `${API}api/auth/users/list_profiles/accountant/`;
  const DELETE_URL = `${API}api/auth/users/delete_user/`;

  // Fetch Accountants
  const fetchAccountants = async (page = 1, size = pageSize) => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }

      const response = await axios.get(
        `${API_URL}?page=${page}&page_size=${size}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = response.data.data;
      if (data && Array.isArray(data.results)) {
        const updatedData = data.results.map((accountant) => ({
          ...accountant,
          salary:
            accountant.salary !== undefined ? String(accountant.salary) : "0",
        }));

        setAccountants(updatedData);
        setCurrentPage(data.current_page);
        setTotalPages(data.total_pages);
      } else {
        toast.error("Unexpected API response format.");
        setAccountants([]);
      }
    } catch (error) {
      console.error("Failed to fetch accountants:", error);
      toast.error("Failed to fetch accountants.");
    }
  };

  // Delete Accountant with Confirmation
  const confirmDeleteAccountant = (id) => {
    toast(
      (t) => (
        <div>
          <p className="font-semibold">Are you sure you want to delete this accountant?</p>
          <div className="flex justify-between mt-3">
            <button
              onClick={() => {
                deleteAccountant(id);
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
      ),
      { duration: 5000 }
    );
  };

  // Delete Accountant Function
  const deleteAccountant = async (id) => {
    try {
      const token = Cookies.get("access_token");
      await axios.delete(`${API}api/auth/users/${id}/delete_user/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Accountant deleted successfully.");

      // 🔥 FIX: use user_id in filter
      setAccountants((prev) => prev.filter((acc) => acc.user_id !== id));
    } catch (error) {
      console.error("Error deleting accountant:", error);
      toast.error("Failed to delete accountant.");
    }
  };


  // Open Edit Modal
  const openEditModal = (accountant) => {
    setSelectedAccountant({ ...accountant, id: accountant.user_id });
    setIsEditModalOpen(true);
  };

  // ✅ Update Accountant Function - Use user_id instead of id
  const updateAccountant = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }


      // const apiUrl = `${UPDATE_URL}/${selectedAccountant.user_id}/edit_profile/`;
      const apiUrl = `${API}api/auth/accountant-profile/${selectedAccountant.user_id}/update/`;

      const updatedData = {
        first_name: selectedAccountant.first_name || "",
        last_name: selectedAccountant.last_name || "",
        phone_number: selectedAccountant.phone_number || "00000000000",
        salary: selectedAccountant.salary !== undefined
          ? String(selectedAccountant.salary)
          : "0", // ✅ Send salary as string
        address: selectedAccountant.address || "Unknown",
        dob: selectedAccountant.dob || "2000-01-01",
        gender: selectedAccountant.gender || "Male",
      };


      const response = await axios.put(apiUrl, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        toast.success("Accountant updated successfully.");

        setAccountants((prev) =>
          prev.map((acc) =>
            acc.user_id === selectedAccountant.user_id
              ? { ...acc, ...response.data.data }
              : acc
          )
        );

        setIsEditModalOpen(false);
      } else {
        toast.error("Unexpected response from the server.");
      }
    } catch (error) {
      console.error("Error updating accountant:", error);

      if (error.response) {
        console.error("Error Response Data:", error.response.data);
        toast.error(
          error.response.data?.message ||
          "Failed to update accountant. Please check input fields."
        );
      } else {
        toast.error(
          "Failed to connect to the server. Check network or server logs."
        );
      }
    }
  };

  // Open View Modal
  const openViewModal = (accountant) => {
    setSelectedAccountant(accountant);
    setIsViewModalOpen(true);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchStudents(page, pageSize);
    }
  };

  useEffect(() => {
    fetchAccountants(1, pageSize); // reset to first page when size changes
  }, [pageSize]);

  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <h1 className="text-2xl font-bold text-white bg-blue-900 px-6 py-3 rounded-t-md mt-7 shadow-md">
        Manage Accountants
      </h1>
      <div className="rounded-lg p-6 mt-4">
        <Buttons
          data={accountants}
          columns={[
            { label: "ID", key: "id" },
            { label: "Username", key: "username" },
            { label: "FirstName", key: "first_name" },
            { label: "LastName", key: "last_name" },
            { label: "Email", key: "email" },
          ]}
          filename="Accountants_List"
        />
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border border-gray-300 bg-white">
            <thead className="text-xs uppercase bg-blue-900 text-white">
              <tr>
                <th className="px-6 py-3 border border-gray-300">ID</th>
                <th className="px-6 py-3 border border-gray-300">Username</th>
                <th className="px-6 py-3 border border-gray-300">FirstName</th>
                <th className="px-6 py-3 border border-gray-300">LastName</th>
                <th className="px-6 py-3 border border-gray-300">Email</th>
                <th className="px-6 py-3 border border-gray-300">Phone</th>
                <th className="px-6 py-3 border border-gray-300">Salary</th>
                {/* <th className="px-6 py-3 border border-gray-300">Role</th> */}
                <th className="px-6 py-3 border border-gray-300 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accountants.map((accountant, index) => (
                <tr key={accountant.id || accountant.user_id || index}> {/* ✅ Fallback to user_id or index */}
                  <td className="px-6 py-4 border border-gray-300">{accountant.user_id}</td>
                  <td className="px-6 py-4 border border-gray-300">{accountant.username}</td>
                  <td className="px-6 py-4 border border-gray-300">{accountant.first_name}</td>
                  <td className="px-6 py-4 border border-gray-300">{accountant.last_name}</td>
                  <td className="px-6 py-4 border border-gray-300">{accountant.email}</td>
                  <td className="px-6 py-4 border border-gray-300">{accountant.phone_number}</td>
                  <td className="px-6 py-4 border border-gray-300">{accountant.salary}</td>
                  <td className="px-6 py-4  flex gap-4 justify-center">
                    <FiEye className="text-blue-500 cursor-pointer" onClick={() => openViewModal(accountant)} />
                    <FiEdit className="text-green-500 cursor-pointer" onClick={() => openEditModal(accountant)} />
                    <FiTrash className="text-red-500 cursor-pointer" onClick={() => confirmDeleteAccountant(accountant.user_id)} />
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>
              <div className="flex justify-between items-center mt-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Page Size:</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {[5, 10, 25, 50].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => goToPage(index + 1)}
              className={`px-3 py-1 rounded ${currentPage === index + 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedAccountant && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col border border-gray-200">

            {/* 🔥 Modal Header */}
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Accountant Details</h2>
              <button
                className="text-gray-500 hover:text-red-500 text-xl font-semibold transition"
                onClick={() => setIsViewModalOpen(false)}
              >
                ✖
              </button>
            </div>

            {/* 🔥 Modal Content (Scrollable) */}
            <div className="overflow-y-auto flex-grow px-2" style={{ maxHeight: "55vh" }}>
              <div className="space-y-4">
                {/* Username */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Username:</span>
                  <span className="text-gray-800 font-semibold">
                    {selectedAccountant.username || "N/A"}
                  </span>
                </div>

                {/* First Name */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">First Name:</span>
                  <span className="text-gray-800 font-semibold">
                    {selectedAccountant.first_name || "N/A"}
                  </span>
                </div>

                {/* Last Name */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Last Name:</span>
                  <span className="text-gray-800 font-semibold">
                    {selectedAccountant.last_name || "N/A"}
                  </span>
                </div>

                {/* Email */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Email:</span>
                  <span className="text-blue-600 font-semibold">
                    {selectedAccountant.email || "N/A"}
                  </span>
                </div>

                {/* Phone Number */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Phone Number:</span>
                  <span className="text-gray-800 font-semibold">
                    {selectedAccountant.phone_number || "N/A"}
                  </span>
                </div>

                {/* Address */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Address:</span>
                  <span className="text-gray-800 font-semibold">
                    {selectedAccountant.address || "N/A"}
                  </span>
                </div>

                {/* Date of Birth */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Date of Birth:</span>
                  <span className="text-gray-800 font-semibold">
                    {selectedAccountant.dob || "N/A"}
                  </span>
                </div>

                {/* Gender */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Gender:</span>
                  <span className="text-gray-800 font-semibold">
                    {selectedAccountant.gender || "N/A"}
                  </span>
                </div>

                {/* Role */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Role:</span>
                  <span className="text-gray-800 font-semibold">
                    {selectedAccountant.role || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Salary:</span>
                  <span className="text-gray-800 font-semibold">
                    {selectedAccountant.salary || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* 🔥 Modal Footer */}
            <div className="mt-6 flex justify-end">
              <button
                className="bg-blue-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-600 transition"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}




      {/* Edit Modal */}
      {isEditModalOpen && selectedAccountant && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-center">Edit Accountant</h2>

            {/* First Name */}
            <label className="block text-gray-700 font-medium mt-2">First Name</label>
            <input
              className="border p-2 w-full mt-1 rounded"
              type="text"
              value={selectedAccountant.first_name || ""}
              onChange={(e) => setSelectedAccountant({ ...selectedAccountant, first_name: e.target.value })}
            />

            {/* Last Name */}
            <label className="block text-gray-700 font-medium mt-2">Last Name</label>
            <input
              className="border p-2 w-full mt-1 rounded"
              type="text"
              value={selectedAccountant.last_name || ""}
              onChange={(e) => setSelectedAccountant({ ...selectedAccountant, last_name: e.target.value })}
            />

            {/* Phone Number */}
            <label className="block text-gray-700 font-medium mt-2">Phone Number</label>
            <input
              className="border p-2 w-full mt-1 rounded"
              type="text"
              value={selectedAccountant.phone_number || ""}
              onChange={(e) => setSelectedAccountant({ ...selectedAccountant, phone_number: e.target.value })}
            />

            {/* Salary */}
            <label className="block text-gray-700 font-medium mt-2">Salary</label>
            <input
              className="border p-2 w-full mt-1 rounded"
              type="text"
              value={selectedAccountant.salary || ""}
              onChange={(e) =>
                setSelectedAccountant({
                  ...selectedAccountant,
                  salary: e.target.value // ✅ Always handle as string
                })
              }
            />

            {/* Address */}
            <label className="block text-gray-700 font-medium mt-2">Address</label>
            <input
              className="border p-2 w-full mt-1 rounded"
              type="text"
              value={selectedAccountant.address || ""}
              onChange={(e) => setSelectedAccountant({ ...selectedAccountant, address: e.target.value })}
            />

            {/* Date of Birth */}
            <label className="block text-gray-700 font-medium mt-2">Date of Birth</label>
            <input
              className="border p-2 w-full mt-1 rounded"
              type="date"
              value={selectedAccountant.dob || ""}
              onChange={(e) => setSelectedAccountant({ ...selectedAccountant, dob: e.target.value })}
            />

            {/* Gender */}
            <label className="block text-gray-700 font-medium mt-2">Gender</label>
            <select
              className="border p-2 w-full mt-1 rounded"
              value={selectedAccountant.gender || ""}
              onChange={(e) => setSelectedAccountant({ ...selectedAccountant, gender: e.target.value })}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                onClick={updateAccountant}
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

export default ManageAccountants;
