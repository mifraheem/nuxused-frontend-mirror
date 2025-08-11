import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { FiTrash, FiEdit, FiEye } from "react-icons/fi";
import { Buttons } from "../../components";

const StudentInfo = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const API = import.meta.env.VITE_SERVER_URL;

  const fetchStudents = async (page = 1, size = pageSize) => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }

      const response = await axios.get(
        `${API}api/auth/users/list_profiles/student/?page=${page}&page_size=${size}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data.data;

      if (Array.isArray(data.results)) {
        setStudents(data.results);
        setCurrentPage(data.current_page);
        setTotalPages(data.total_pages);
        return data.results;
      } else {
        toast.error("Failed to fetch students.");
        return [];
      }
    } catch (error) {
      console.error("Error fetching students:", error.response);
      toast.error(error.response?.data?.message || "Failed to fetch students.");
      return [];
    }
  };


  const updateStudent = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }

      if (!selectedStudent || !selectedStudent.user_id) {
        toast.error("Invalid student selected for update.");
        return;
      }

      const apiUrl = `${API}api/auth/students/${selectedStudent.user_id}/update_student/`;
      const formData = new FormData();

      formData.append("first_name", selectedStudent.first_name || "");
      formData.append("last_name", selectedStudent.last_name || "");
      formData.append("phone_number", selectedStudent.phone_number || "");
      formData.append("address", selectedStudent.address || "");
      formData.append("dob", selectedStudent.dob || "");
      formData.append("gender", selectedStudent.gender || "");
      if (selectedStudent.profile_picture instanceof File) {
        formData.append("profile_picture", selectedStudent.profile_picture);
      }

      const response = await axios.patch(apiUrl, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if ([200, 202].includes(response.status)) {
        toast.success("Student updated successfully.");
        fetchStudents(currentPage, pageSize);
        setIsEditModalOpen(false);
      } else {
        toast.error("Unexpected response from server.");
      }
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error(error.response?.data?.detail || "Failed to update student.");
    }
  };




  const deleteStudent = async (id) => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }

      if (!id) {
        toast.error("Invalid student ID.");
        return;
      }

      console.log("Deleting student with ID:", id);
      console.log("API URL:", `${API}api/auth/users/${id}/delete_user/`);

      const response = await axios.delete(
        `${API}api/auth/users/${id}/delete_user/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Delete response:", response.status, response.data);

      if ([200, 202, 204].includes(response.status)) {
        if (response.status === 202) {
          toast.success("Student deletion scheduled. Will be removed after 10 seconds.");
          setTimeout(() => {
            setStudents((prev) => prev.filter((student) => student.user_id !== id));
            toast.success("Student deleted.");
          }, 10000);
        } else {
          setStudents((prev) => prev.filter((student) => student.user_id !== id));
          toast.success("Student deleted.");
        }
      } else {
        toast.error("Failed to delete student: Unexpected status code.");
      }
    } catch (error) {
      console.error("Error deleting student:", error.response);
      toast.error(error.response?.data?.detail || error.response?.data?.message || "Failed to delete student.");
    }
  };

  const confirmDeleteStudent = (id) => {
    if (!id) {
      toast.error("Invalid student ID.");
      return;
    }

    if (!canDelete) {
      toast.error("🚫 You don’t have permission to delete student profiles.");
      return;
    }

    toast((t) => (
      <div className="text-center">
        <p className="font-semibold">Are you sure you want to delete this student?</p>
        <div className="flex justify-center gap-4 mt-3">
          <button
            onClick={() => {
              deleteStudent(id);
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


  const openViewModal = (student) => {
    if (!student || !student.user_id) {
      toast.error("Invalid student selected.");
      return;
    }
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };

  const openEditModal = (student) => {
    if (!student || !student.user_id) {
      toast.error("Invalid student selected.");
      return;
    }
    setSelectedStudent({ ...student, id: student.user_id });
    setIsEditModalOpen(true);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchStudents(page, pageSize);
    }
  };

  useEffect(() => {
    fetchStudents(1, pageSize);
  }, [pageSize]);

  // Permission checks (near top of component)
  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");

  const canEdit = permissions.includes("users.change_studentprofile");
  const canDelete = permissions.includes("users.delete_studentprofile");


  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <h1 className="bg-blue-900 text-white py-4 px-6 text-xl font-bold rounded-lg mt-6">Manage Student Information</h1>
      <div className="p-6">
        <Buttons
          data={students}
          columns={[
            { label: "ID", key: "user_id" },
            { label: "Username", key: "username" },
            { label: "FirstName", key: "first_name" },
            { label: "LastName", key: "last_name" },
            { label: "Email", key: "email" },
          ]}
          filename="Students_List"
        />
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm bg-white">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="border border-gray-300 px-4 py-2">#</th>
                <th className="border border-gray-300 px-4 py-2">Username</th>
                <th className="border border-gray-300 px-4 py-2">FirstName</th>
                <th className="border border-gray-300 px-4 py-2">LastName</th>
                <th className="border border-gray-300 px-4 py-2">Email</th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.user_id || `student-${index}`}>
                  <td className="border border-gray-300 px-4 py-2">{student.user_id}</td>
                  <td className="border border-gray-300 px-4 py-2">{student.username}</td>
                  <td className="border border-gray-300 px-4 py-2">{student.first_name}</td>
                  <td className="border border-gray-300 px-4 py-2">{student.last_name}</td>
                  <td className="border border-gray-300 px-4 py-2">{student.email}</td>
                  <td className="border border-gray-300 px-4 py-2 flex justify-center gap-3">
                    <FiEye
                      className="text-blue-500 cursor-pointer"
                      onClick={() => openViewModal(student)}
                      title="View Student"
                    />
                    {canEdit && (
                      <FiEdit
                        className="text-green-500 cursor-pointer"
                        onClick={() => openEditModal(student)}
                        title="Edit Student"
                      />
                    )}
                    {canDelete && (
                      <FiTrash
                        className="text-red-500 cursor-pointer"
                        onClick={() => confirmDeleteStudent(student.user_id)}
                        title="Delete Student"
                      />
                    )}
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

        {/* View Modal */}
        {isViewModalOpen && selectedStudent && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 px-4 z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden border border-gray-200">

              {/* Modal Header */}
              <div className="bg-blue-600 text-white py-4 px-6 border-b">
                <h2 className="text-xl font-bold text-center">🎓 Student Details</h2>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <table className="table-auto w-full text-sm text-left border border-gray-200">
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-gray-700 font-medium">Picture</th>
                      <td className="px-4 py-2">
                        {selectedStudent.profile_picture ? (
                          <img
                            src={`${API}${selectedStudent.profile_picture}`}
                            alt="Profile"
                            className="w-24 h-24 object-cover rounded border"
                          />
                        ) : (
                          "N/A"
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th className="px-4 py-2 text-gray-700 w-1/3 font-medium">Username</th>
                      <td className="px-4 py-2 text-gray-800">{selectedStudent.username || "N/A"}</td>
                    </tr>
                    <tr>
                      <th className="px-4 py-2 text-gray-700 font-medium">First Name</th>
                      <td className="px-4 py-2 text-gray-800">{selectedStudent.first_name || "N/A"}</td>
                    </tr>
                    <tr>
                      <th className="px-4 py-2 text-gray-700 font-medium">Last Name</th>
                      <td className="px-4 py-2 text-gray-800">{selectedStudent.last_name || "N/A"}</td>
                    </tr>
                    <tr>
                      <th className="px-4 py-2 text-gray-700 font-medium">Email</th>
                      <td className="px-4 py-2 text-gray-800">{selectedStudent.email || "N/A"}</td>
                    </tr>
                    <tr>
                      <th className="px-4 py-2 text-gray-700 font-medium">Phone</th>
                      <td className="px-4 py-2 text-gray-800">{selectedStudent.phone_number || "N/A"}</td>
                    </tr>
                    <tr>
                      <th className="px-4 py-2 text-gray-700 font-medium">Address</th>
                      <td className="px-4 py-2 text-gray-800">{selectedStudent.address || "N/A"}</td>
                    </tr>
                    <tr>
                      <th className="px-4 py-2 text-gray-700 font-medium">Date of Birth</th>
                      <td className="px-4 py-2 text-gray-800">{selectedStudent.dob || "N/A"}</td>
                    </tr>
                    <tr>
                      <th className="px-4 py-2 text-gray-700 font-medium">Gender</th>
                      <td className="px-4 py-2 text-gray-800 capitalize">{selectedStudent.gender || "N/A"}</td>
                    </tr>
                    <tr>
                      <th className="px-4 py-2 text-gray-700 font-medium">Class</th>
                      <td className="px-4 py-2 text-gray-800">{selectedStudent.class_name || "N/A"}</td>
                    </tr>
                    

                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
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


        {/* Edit Modal */}
        {isEditModalOpen && selectedStudent && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden max-h-[85vh] border border-gray-200">

              {/* Header */}
              <div className="bg-blue-600 text-white text-center py-4 px-6 border-b">
                <h2 className="text-xl font-bold">🎓 Edit Student Profile</h2>
              </div>

              {/* Form Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={selectedStudent.first_name || ""}
                    onChange={(e) => setSelectedStudent({ ...selectedStudent, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={selectedStudent.last_name || ""}
                    onChange={(e) => setSelectedStudent({ ...selectedStudent, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={selectedStudent.phone_number || ""}
                    onChange={(e) => setSelectedStudent({ ...selectedStudent, phone_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={selectedStudent.address || ""}
                    onChange={(e) => setSelectedStudent({ ...selectedStudent, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={selectedStudent.dob || ""}
                    onChange={(e) => setSelectedStudent({ ...selectedStudent, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Profile Picture Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Profile Picture</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      setSelectedStudent({ ...selectedStudent, profile_picture: file });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {selectedStudent.profile_picture && typeof selectedStudent.profile_picture !== "string" && (
                    <img
                      src={URL.createObjectURL(selectedStudent.profile_picture)}
                      alt="Preview"
                      className="w-24 h-24 mt-2 rounded border object-cover"
                    />
                  )}
                  {selectedStudent.profile_picture && typeof selectedStudent.profile_picture === "string" && (
                    <img
                      src={`${API}${selectedStudent.profile_picture}`}
                      alt="Existing"
                      className="w-24 h-24 mt-2 rounded border object-cover"
                    />
                  )}
                </div>


                {/* Gender */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                  <select
                    value={selectedStudent.gender || ""}
                    onChange={(e) => setSelectedStudent({ ...selectedStudent, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end items-center gap-3 px-6 py-4 border-t">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  onClick={updateStudent}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StudentInfo;
