import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { FiTrash, FiEdit, FiEye } from "react-icons/fi";
import { Buttons } from "../../components";

const TeacherDetails = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const API = import.meta.env.VITE_SERVER_URL;

  const API_URL = `${API}api/auth/users/list_profiles/teacher/`;
  const DELETE_URL = `${API}api/auth/users/delete_user/`;
  const UPDATE_URL = `${API}api/auth/profile`;

  const fetchTeachers = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }

      const response = await axios.get(`${API_URL}?page=${currentPage}&page_size=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && Array.isArray(response.data.data.results)) {
        const formattedData = response.data.data.results.map((teacher) => ({
          id: teacher.profile_id,
          user_id: teacher.user_id,
          username: teacher.username,
          first_name: teacher.first_name || "N/A",
          last_name: teacher.last_name || "N/A",
          email: teacher.email || "N/A",
          phone_number: teacher.phone_number || "N/A",
          address: teacher.address || "N/A",
          dob: teacher.dob || "N/A",
          gender: teacher.gender || "N/A",
          salary: teacher.salary || null,
        }));

        setTeachers(formattedData);
        setTotalPages(response.data.data.total_pages);
      } else {
        toast.error("Unexpected API response format.");
        setTeachers([]);
      }
    } catch (error) {
      toast.error("Failed to fetch teachers.");
    }
  };

  const confirmDeleteTeacher = (id) => {
    if (!canDelete) {
      toast((t) => (
        <div className="text-center font-semibold p-4 bg-red-100 border border-red-400 rounded shadow-md">
          🚫 You do not have permission to delete teacher profiles.
          <div className="mt-3">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="mt-2 px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      ));
      return;
    }

    toast((t) => (
      <div className="text-center">
        <p className="font-semibold">Are you sure you want to delete this teacher?</p>
        <div className="flex justify-center gap-4 mt-3">
          <button
            onClick={() => {
              deleteTeacher(id);
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



  const deleteTeacher = async (id) => {
    try {
      const token = Cookies.get("access_token");
      await axios.delete(`${API}api/auth/users/${id}/delete_user/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Teacher deleted successfully.");
      setTeachers((prev) => prev.filter((teacher) => teacher.user_id !== id));
    } catch (error) {
      toast.error("Failed to delete teacher.");
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
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }

      const apiUrl = `${UPDATE_URL}/${selectedTeacher.user_id}/edit_profile/`;
      const updatedData = {
        first_name: selectedTeacher.first_name,
        last_name: selectedTeacher.last_name,
        phone_number: selectedTeacher.phone_number,
        address: selectedTeacher.address,
        dob: selectedTeacher.dob,
        gender: selectedTeacher.gender,
      };

      const response = await axios.patch(apiUrl, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        toast.success("Teacher profile updated successfully.");
        fetchTeachers();
        setIsEditModalOpen(false);
      } else {
        toast.error("Unexpected response from server.");
      }
    } catch (error) {
      toast.error("Failed to update teacher.");
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [currentPage, pageSize]);

  const handlePageChange = (page) => setCurrentPage(page);
  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");

  const canView = permissions.includes("users.view_teacherprofile");
  const canEdit = permissions.includes("users.change_teacherprofile");
  const canDelete = permissions.includes("users.delete_teacherprofile") && permissions.includes("users.delete_user");

  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <h1 className="bg-blue-900 text-white py-4 px-6 text-xl font-bold">Manage Teacher Details</h1>
      <div className="p-6">
        <Buttons />
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm bg-white">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="border border-gray-300 px-4 py-2">User ID</th>
                <th className="border border-gray-300 px-4 py-2">Username</th>
                <th className="border border-gray-300 px-4 py-2">FirstName</th>
                <th className="border border-gray-300 px-4 py-2">LastName</th>
                <th className="border border-gray-300 px-4 py-2">Email</th>
                <th className="border border-gray-300 px-4 py-2">Phone</th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td className="border border-gray-300 px-4 py-2">{teacher.user_id}</td>
                  <td className="border border-gray-300 px-4 py-2">{teacher.username || "N/A"}</td>
                  <td className="border border-gray-300 px-4 py-2">{teacher.first_name || "N/A"}</td>
                  <td className="border border-gray-300 px-4 py-2">{teacher.last_name || "N/A"}</td>
                  <td className="border border-gray-300 px-4 py-2">{teacher.email || "N/A"}</td>
                  <td className="border border-gray-300 px-4 py-2">{teacher.phone_number || "N/A"}</td>
                  <td className="border border-gray-300 px-4 py-2 flex justify-center gap-3">
                    {canView && (
                      <FiEye
                        className="text-blue-500 cursor-pointer"
                        onClick={() => openViewModal(teacher)}
                        title="View Teacher"
                      />
                    )}
                    {canEdit && (
                      <FiEdit
                        className="text-green-500 cursor-pointer"
                        onClick={() => openEditModal(teacher)}
                        title="Edit Teacher"
                      />
                    )}
                    {canDelete && (
                      <FiTrash
                        className="text-red-500 cursor-pointer"
                        onClick={() => confirmDeleteTeacher(teacher.user_id)}
                        title="Delete Teacher"
                      />
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Below Table */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center">
            <label className="mr-2 font-semibold text-gray-700">Page Size:</label>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="border px-2 py-1 rounded"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-300 text-gray-700 disabled:opacity-50"
            >
              Prev
            </button>

            {[...Array(totalPages).keys()].map((pageNum) => (
              <button
                key={pageNum + 1}
                onClick={() => handlePageChange(pageNum + 1)}
                className={`px-3 py-1 rounded ${currentPage === pageNum + 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-black"
                  }`}
              >
                {pageNum + 1}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-gray-300 text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ✅ View Modal */}
      {isViewModalOpen && selectedTeacher && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-center mb-4 text-blue-600 border-b pb-2">
              Teacher Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">Username:</span>
                <span className="text-gray-600">{selectedTeacher.username || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">First Name:</span>
                <span className="text-gray-600">{selectedTeacher.first_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">Last Name:</span>
                <span className="text-gray-600">{selectedTeacher.last_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">Email:</span>
                <span className="text-gray-600">{selectedTeacher.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">Phone Number:</span>
                <span className="text-gray-600">{selectedTeacher.phone_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">Address:</span>
                <span className="text-gray-600">{selectedTeacher.address || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">Date of Birth:</span>
                <span className="text-gray-600">{selectedTeacher.dob || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">Gender:</span>
                <span className="text-gray-600">{selectedTeacher.gender || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">Salary:</span>
                <span className="text-gray-600">{selectedTeacher.salary ? `Rs.${selectedTeacher.salary}` : 'N/A'}</span>
              </div>
            </div>
            <div className="flex justify-center mt-6">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md shadow-md transition duration-300"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ✅ Edit Modal */}
      {isEditModalOpen && selectedTeacher && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-center">Edit Teacher</h2>

            <label className="block text-gray-700 font-medium mt-2">First Name</label>
            <input
              className="border p-2 w-full mt-1 rounded"
              type="text"
              value={selectedTeacher.first_name || ""}
              onChange={(e) => setSelectedTeacher({ ...selectedTeacher, first_name: e.target.value })}
            />

            <label className="block text-gray-700 font-medium mt-2">Last Name</label>
            <input
              className="border p-2 w-full mt-1 rounded"
              type="text"
              value={selectedTeacher.last_name || ""}
              onChange={(e) => setSelectedTeacher({ ...selectedTeacher, last_name: e.target.value })}
            />
            {/* Phone Number */}
            <label className="block text-gray-700 font-medium mt-2">Phone Number</label>
            <input
              className="border p-2 w-full mt-1 rounded"
              type="text"
              value={selectedTeacher.phone_number || ""}
              onChange={(e) => setSelectedTeacher({ ...selectedTeacher, phone_number: e.target.value })}
            />

            {/* Address */}
            <label className="block text-gray-700 font-medium mt-2">Address</label>
            <input
              className="border p-2 w-full mt-1 rounded"
              type="text"
              value={selectedTeacher.address || ""}
              onChange={(e) => setSelectedTeacher({ ...selectedTeacher, address: e.target.value })}
            />

            {/* Date of Birth */}
            <label className="block text-gray-700 font-medium mt-2">Date of Birth</label>
            <input
              className="border p-2 w-full mt-1 rounded"
              type="date"
              value={selectedTeacher.dob || ""}
              onChange={(e) => setSelectedTeacher({ ...selectedTeacher, dob: e.target.value })}
            />

            {/* Gender Dropdown */}
            <label className="block text-gray-700 font-medium mt-2">Gender</label>
            <select
              className="border p-2 w-full mt-1 rounded"
              value={selectedTeacher.gender || ""}
              onChange={(e) => setSelectedTeacher({ ...selectedTeacher, gender: e.target.value })}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <div className="flex justify-end gap-2 mt-4">
              <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600" onClick={updateTeacher}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDetails;
