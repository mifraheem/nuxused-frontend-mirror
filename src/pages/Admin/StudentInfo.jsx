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
      } else {
        toast.error("Failed to fetch students.");
      }
    } catch (error) {
      console.error("Error fetching students:", error.response);
      toast.error(error.response?.data?.message || "Failed to fetch students.");
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

      const apiUrl = `${API}api/auth/profile/${selectedStudent.user_id}/edit_profile/`;
      const updatedData = {
        first_name: selectedStudent.first_name || "",
        last_name: selectedStudent.last_name || "",
        phone_number: selectedStudent.phone_number ? String(selectedStudent.phone_number) : "00000000000",
        address: selectedStudent.address || "Not Provided",
        dob: selectedStudent.dob ? selectedStudent.dob : "2000-01-01",
        gender: selectedStudent.gender || "Male",
        class_name: selectedStudent.class_name || "Unknown",
      };

      const response = await axios.patch(apiUrl, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        toast.success("Student updated successfully.");
        fetchStudents(currentPage, pageSize);
        setIsEditModalOpen(false);
      } else {
        toast.error("Unexpected response from server.");
      }
    } catch (error) {
      console.error("Error updating student:", error.response);
      toast.error(error.response?.data?.message || "Failed to update student.");
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
    toast((t) => (
      <div>
        <p className="font-semibold">Are you sure you want to delete this student?</p>
        <div className="flex justify-between mt-3">
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

  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <h1 className="bg-blue-900 text-white py-4 px-6 text-xl font-bold">Manage Student Information</h1>
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
                    <FiEye className="text-blue-500 cursor-pointer" onClick={() => openViewModal(student)} />
                    <FiEdit className="text-green-500 cursor-pointer" onClick={() => openEditModal(student)} />
                    <FiTrash className="text-red-500 cursor-pointer" onClick={() => confirmDeleteStudent(student.user_id)} />
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
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 px-4">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h2 className="text-xl font-bold text-gray-700">Student Details</h2>
                <button
                  className="text-gray-500 hover:text-gray-700 text-lg font-bold"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  ✖
                </button>
              </div>

              {/* Modal Content (Scrollable) */}
              <div className="overflow-y-auto flex-grow px-2" style={{ maxHeight: "55vh" }}>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Username:</span>
                    <span className="text-gray-800">{selectedStudent.username || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">First Name:</span>
                    <span className="text-gray-800">{selectedStudent.first_name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Last Name:</span>
                    <span className="text-gray-800">{selectedStudent.last_name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Email:</span>
                    <span className="text-gray-800">{selectedStudent.email || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Phone Number:</span>
                    <span className="text-gray-800">{selectedStudent.phone_number || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Address:</span>
                    <span className="text-gray-800">{selectedStudent.address || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Date of Birth:</span>
                    <span className="text-gray-800">{selectedStudent.dob || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Gender:</span>
                    <span className="text-gray-800">{selectedStudent.gender || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Class Name:</span>
                    <span className="text-gray-800">{selectedStudent.class_name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Role:</span>
                    <span className="text-gray-800">{selectedStudent.role || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-4 text-right">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-center">Edit Student</h2>

              <label className="block text-gray-700 font-medium mt-2">First Name</label>
              <input
                className="border p-2 w-full mt-1 rounded"
                type="text"
                value={selectedStudent.first_name || ""}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, first_name: e.target.value })}
              />

              <label className="block text-gray-700 font-medium mt-2">Last Name</label>
              <input
                className="border p-2 w-full mt-1 rounded"
                type="text"
                value={selectedStudent.last_name || ""}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, last_name: e.target.value })}
              />

              <label className="block text-gray-700 font-medium mt-2">Phone Number</label>
              <input
                className="border p-2 w-full mt-1 rounded"
                type="text"
                value={selectedStudent.phone_number || ""}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, phone_number: e.target.value })}
              />

              <label className="block text-gray-700 font-medium mt-2">Address</label>
              <input
                className="border p-2 w-full mt-1 rounded"
                type="text"
                value={selectedStudent.address || ""}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, address: e.target.value })}
              />

              <label className="block text-gray-700 font-medium mt-2">Date of Birth</label>
              <input
                className="border p-2 w-full mt-1 rounded"
                type="date"
                value={selectedStudent.dob || ""}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, dob: e.target.value })}
              />

              <label className="block text-gray-700 font-medium mt-2">Gender</label>
              <select
                className="border p-2 w-full mt-1 rounded"
                value={selectedStudent.gender || ""}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, gender: e.target.value })}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  onClick={updateStudent}
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
