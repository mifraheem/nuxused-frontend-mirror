import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { FiTrash, FiEdit, FiEye } from "react-icons/fi";
import { Buttons } from "../../components";
import Pagination from "../../components/Pagination";

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
  const UPDATE_URL = `${API}api/auth/update-teacher-profile/`;

  const isValidId = (id) => {
    if (!id) return false;
    return !isNaN(id) || typeof id === 'string';
  };

  const fetchTeachers = async (page = currentPage, size = pageSize) => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        throw new Error("Authentication token missing");
      }
      const response = await axios.get(`${API_URL}?page=${page}&page_size=${size}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Teacher list response:", response.data);
      if (response.data?.data?.results) {
        const formattedData = response.data.data.results.map((teacher, index) => {
          console.log(`Teacher ${index + 1} user_id:`, teacher.user_id, `Valid ID:`, isValidId(teacher.user_id));
          return {
            id: teacher.profile_id,
            user_id: teacher.user_id,
            username: teacher.username || "N/A",
            first_name: teacher.first_name || "N/A",
            last_name: teacher.last_name || "N/A",
            email: teacher.email || "N/A",
            phone_number: teacher.phone_number || "N/A",
            address: teacher.address || "N/A",
            dob: teacher.dob || "N/A",
            gender: teacher.gender || "N/A",
            salary: teacher.salary || null,
            registration_no: teacher.registration_no || "N/A",
            profile_picture: teacher.profile_picture || null,
          };
        });
        setTeachers(formattedData);
        setTotalPages(response.data.data.total_pages || 1);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Error fetching teachers:", error.response?.data);
      toast.error("Failed to fetch teachers: " + (error.response?.data?.message || error.message));
    }
  };

  const confirmDeleteTeacher = (id) => {
    if (!canDelete) {
      toast.error("🚫 You do not have permission to delete teacher profiles.");
      return;
    }

    console.log("Confirm delete teacher ID:", id);
    if (!isValidId(id)) {
      toast.error("Invalid teacher ID format.");
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
      console.log("Deleting teacher with ID:", id);
      await axios.delete(`${DELETE_URL}${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Teacher deleted successfully.");
      setTeachers((prev) => prev.filter((teacher) => teacher.user_id != id));
    } catch (error) {
      console.error("Error deleting teacher:", error.response?.data);
      toast.error("Failed to delete teacher: " + (error.response?.data?.message || error.message));
    }
  };

  const openEditModal = (teacher) => {
    console.log("Opening edit modal for teacher:", teacher);
    setSelectedTeacher(teacher);
    setIsEditModalOpen(true);
  };

  const openViewModal = (teacher) => {
    console.log("Opening view modal for teacher:", teacher);
    setSelectedTeacher(teacher);
    setIsViewModalOpen(true);
  };

  const updateTeacher = async () => {
    if (!selectedTeacher?.user_id) {
      toast.error("No teacher selected.");
      console.log("No user_id in selectedTeacher:", selectedTeacher);
      return;
    }

    console.log("Selected teacher user_id:", selectedTeacher.user_id, "Valid ID:", isValidId(selectedTeacher.user_id));
    if (!isValidId(selectedTeacher.user_id)) {
      toast.error("Invalid user ID format. Must be a valid integer or string.");
      return;
    }

    if (!selectedTeacher.first_name || !selectedTeacher.last_name) {
      toast.error("First name and last name are required.");
      return;
    }

    if (selectedTeacher.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedTeacher.email)) {
      toast.error("Invalid email format.");
      return;
    }

    if (selectedTeacher.phone_number && !/^\d{7,15}$/.test(selectedTeacher.phone_number)) {
      toast.error("Invalid phone number format.");
      return;
    }

    if (selectedTeacher.salary && isNaN(selectedTeacher.salary)) {
      toast.error("Salary must be a valid number.");
      return;
    }

    try {
      const token = Cookies.get("access_token");
      if (!token) {
        throw new Error("Authentication token missing");
      }

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

      console.log("Updating teacher with payload:", [...formData.entries()], "to URL:", apiUrl);

      const response = await axios.patch(apiUrl, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Update teacher response:", response.data);

      if (response.status === 200) {
        toast.success("Teacher profile updated successfully.");
        setSelectedTeacher((prev) => ({
          ...prev,
          ...response.data.data,
          new_profile_picture: null, // Reset file input
        }));
        fetchTeachers();
        setIsEditModalOpen(false);
      } else {
        toast.error("Unexpected response status: " + response.status);
      }
    } catch (error) {
      console.error("Error updating teacher:", error.response?.data);
      const errMsg = error.response?.data?.message || error.response?.data?.error || error.response?.data?.detail || error.message;
      if (error.response?.status === 405) {
        toast.error("Server does not allow PATCH requests. Contact backend team to enable PATCH or use another method.");
      } else if (error.response?.status === 404) {
        toast.error("Teacher profile endpoint not found. Please check the user ID or API configuration.");
      } else {
        toast.error("Failed to update teacher: " + errMsg);
      }
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [currentPage, pageSize]);

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canView = permissions.includes("users.view_teacherprofile");
  const canEdit = permissions.includes("users.change_teacherprofile");
  const canDelete = permissions.includes("users.delete_teacherprofile") && permissions.includes("users.delete_user");

  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <h1 className="bg-blue-900 text-white py-4 px-6 text-xl font-bold rounded-lg mt-6 mx-6">Manage Teacher Details</h1>
      <div className="p-6">
        <Buttons
          data={teachers}
          filename="Teacher_Profiles"
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
                <th className="border border-gray-300 px-4 py-2">User ID</th>
                <th className="border border-gray-300 px-4 py-2">First Name</th>
                <th className="border border-gray-300 px-4 py-2">Last Name</th>
                <th className="border border-gray-300 px-4 py-2">Email</th>
                <th className="border border-gray-300 px-4 py-2">Phone</th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{teacher.user_id}</td>
                    <td className="border border-gray-300 px-4 py-2">{teacher.first_name}</td>
                    <td className="border border-gray-300 px-4 py-2">{teacher.last_name}</td>
                    <td className="border border-gray-300 px-4 py-2">{teacher.email}</td>
                    <td className="border border-gray-300 px-4 py-2">{teacher.phone_number}</td>
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
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                    No teacher profiles available.
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

      {isViewModalOpen && selectedTeacher && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden border border-gray-200">
            <div className="bg-blue-600 text-white text-center py-4 px-6 border-b">
              <h2 className="text-xl font-bold">👤 Teacher Details</h2>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <table className="table-auto w-full text-sm text-left border border-gray-200">
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700 w-1/3">Profile Picture</th>
                    <td className="px-4 py-2 text-gray-800">
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
                    <th className="px-4 py-2 font-medium text-gray-700">Username</th>
                    <td className="px-4 py-2 text-gray-800">{selectedTeacher.username}</td>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700">First Name</th>
                    <td className="px-4 py-2 text-gray-800">{selectedTeacher.first_name}</td>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700">Last Name</th>
                    <td className="px-4 py-2 text-gray-800">{selectedTeacher.last_name}</td>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700">Email</th>
                    <td className="px-4 py-2 text-gray-800">{selectedTeacher.email}</td>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700">Phone</th>
                    <td className="px-4 py-2 text-gray-800">{selectedTeacher.phone_number}</td>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700">Address</th>
                    <td className="px-4 py-2 text-gray-800">{selectedTeacher.address}</td>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700">Date of Birth</th>
                    <td className="px-4 py-2 text-gray-800">{selectedTeacher.dob}</td>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700">Gender</th>
                    <td className="px-4 py-2 text-gray-800 capitalize">{selectedTeacher.gender}</td>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700">Registration No</th>
                    <td className="px-4 py-2 text-gray-800">{selectedTeacher.registration_no}</td>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700">Salary</th>
                    <td className="px-4 py-2 text-gray-800">
                      {selectedTeacher.salary ? `Rs. ${selectedTeacher.salary}` : "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex justify-center py-4 border-t">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md transition duration-200"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedTeacher && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden max-h-[85vh] border border-gray-200">
            <div className="bg-blue-600 text-white text-center py-4 px-6 border-b">
              <h2 className="text-xl font-bold">✏️ Edit Teacher Profile</h2>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={selectedTeacher.username || ""}
                  onChange={(e) => setSelectedTeacher({ ...selectedTeacher, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={selectedTeacher.first_name || ""}
                  onChange={(e) => setSelectedTeacher({ ...selectedTeacher, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={selectedTeacher.last_name || ""}
                  onChange={(e) => setSelectedTeacher({ ...selectedTeacher, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={selectedTeacher.phone_number || ""}
                  onChange={(e) => setSelectedTeacher({ ...selectedTeacher, phone_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={selectedTeacher.address || ""}
                  onChange={(e) => setSelectedTeacher({ ...selectedTeacher, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={selectedTeacher.email || ""}
                  onChange={(e) => setSelectedTeacher({ ...selectedTeacher, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={selectedTeacher.dob || ""}
                  onChange={(e) => setSelectedTeacher({ ...selectedTeacher, dob: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                <select
                  value={selectedTeacher.gender || ""}
                  onChange={(e) => setSelectedTeacher({ ...selectedTeacher, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  value={selectedTeacher.registration_no || ""}
                  onChange={(e) => setSelectedTeacher({ ...selectedTeacher, registration_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Salary</label>
                <input
                  type="number"
                  value={selectedTeacher.salary || ""}
                  onChange={(e) => setSelectedTeacher({ ...selectedTeacher, salary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedTeacher({ ...selectedTeacher, new_profile_picture: e.target.files[0] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-end items-center gap-3 px-6 py-4 border-t">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition"
              >
                Cancel
              </button>
              <button
                onClick={updateTeacher}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition"
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