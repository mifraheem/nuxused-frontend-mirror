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

  // Permissions (align with other pages)
  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canView = permissions.includes("users.view_studentprofile");
  const canEdit = permissions.includes("users.change_studentprofile");
  const canDelete = permissions.includes("users.delete_studentprofile");

  const authHeaders = () => {
    const token = Cookies.get("access_token");
    if (!token) throw new Error("User is not authenticated.");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchStudents = async (page = 1, size = pageSize) => {
    try {
      const response = await axios.get(
        `${API}api/auth/users/list_profiles/student/?page=${page}&page_size=${size}`,
        { headers: authHeaders() }
      );

      const data = response.data?.data;
      if (Array.isArray(data?.results)) {
        setStudents(data.results);
        setCurrentPage(data.current_page || page);
        setTotalPages(data.total_pages || 1);
        return data.results;
      } else {
        toast.error("Failed to fetch students.");
        return [];
      }
    } catch (error) {
      console.error("Error fetching students:", error.response || error.message);
      toast.error(error.response?.data?.message || "Failed to fetch students.");
      return [];
    }
  };

  useEffect(() => {
    fetchStudents(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize]);

  const updateStudent = async () => {
    try {
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
          ...authHeaders(),
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
      if (!id) {
        toast.error("Invalid student ID.");
        return;
      }

      const response = await axios.delete(
        `${API}api/auth/users/${id}/delete_user/`,
        { headers: authHeaders() }
      );

      if ([200, 202, 204].includes(response.status)) {
        if (response.status === 202) {
          toast.success("Student deletion scheduled. Will be removed after 10 seconds.");
          setTimeout(() => {
            setStudents((prev) => prev.filter((s) => s.user_id !== id));
            toast.success("Student deleted.");
          }, 10000);
        } else {
          setStudents((prev) => prev.filter((s) => s.user_id !== id));
          toast.success("Student deleted.");
        }
      } else {
        toast.error("Failed to delete student: Unexpected status code.");
      }
    } catch (error) {
      console.error("Error deleting student:", error.response || error.message);
      toast.error(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          "Failed to delete student."
      );
    }
  };

  const confirmDeleteStudent = (id) => {
    if (!id) {
      toast.error("Invalid student ID.");
      return;
    }
    if (!canDelete) {
      toast.error("You don’t have permission to delete student profiles.");
      return;
    }

    toast(
      (t) => (
        <div className="text-center">
          <p className="font-semibold">Delete this student?</p>
          <div className="flex justify-center gap-2 mt-2">
            <button
              onClick={() => {
                deleteStudent(id);
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

  return (
    <div className="p-2 md:p-3">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Header bar (compact, survives narrow widths like WTM) */}
      <div className="bg-blue-900 text-white rounded-md flex items-center justify-between px-2 py-2 mt-2">
        <h1 className="text-sm md:text-base font-bold">Manage Student Information</h1>
      </div>

      <div className="mt-2 p-2">
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

        {/* Scroll container ensures layout stays intact when sidebar is open */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full border-collapse border border-gray-300 bg-white min-w-[650px]">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="border border-gray-300 p-1 text-center text-xs">#</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Username</th>
                <th className="border border-gray-300 p-1 text-center text-xs">First Name</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Last Name</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Email</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.user_id || `student-${index}`} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-1 text-center text-xs">
                    <span className="inline-block max-w-[120px] truncate" title={student.user_id}>
                      {student.user_id}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-1 text-xs">
                    <span className="block max-w-[160px] truncate" title={student.username}>
                      {student.username}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-1 text-xs">{student.first_name}</td>
                  <td className="border border-gray-300 p-1 text-xs">{student.last_name}</td>
                  <td className="border border-gray-300 p-1 text-xs">
                    <span className="block max-w-[220px] truncate" title={student.email}>
                      {student.email}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-1">
                    <div className="flex items-center justify-center gap-2">
                      {canView && (
                        <FiEye
                          className="text-blue-500 cursor-pointer hover:text-blue-700"
                          size={18}
                          onClick={() => openViewModal(student)}
                          title="View"
                        />
                      )}
                      {canEdit && (
                        <FiEdit
                          className="text-yellow-500 cursor-pointer hover:text-yellow-700"
                          size={18}
                          onClick={() => openEditModal(student)}
                          title="Edit"
                        />
                      )}
                      {canDelete && (
                        <FiTrash
                          className="text-red-500 cursor-pointer hover:text-red-700"
                          size={18}
                          onClick={() => confirmDeleteStudent(student.user_id)}
                          title="Delete"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="border border-gray-300 p-2 text-center text-gray-500 text-sm"
                  >
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls (compact & responsive) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-700">Page Size:</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white"
            >
              {[5, 10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2 py-1 bg-gray-200 rounded text-xs disabled:opacity-50"
            >
              Prev
            </button>
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToPage(idx + 1)}
                className={`px-2 py-1 rounded text-xs ${
                  currentPage === idx + 1 ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
              >
                {idx + 1}
              </button>
            ))}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 bg-gray-200 rounded text-xs disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View Modal (compact & scrollable) */}
      {isViewModalOpen && selectedStudent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 px-2 z-50">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl border border-gray-300 overflow-hidden">
            <div className="px-3 py-2 bg-blue-600 text-white">
              <h2 className="text-sm md:text-base font-bold text-center">Student Details</h2>
            </div>
            <div className="p-3 overflow-y-auto max-h-[60vh]">
              <table className="w-full text-xs border border-gray-200">
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-700 w-1/3">Picture</th>
                    <td className="px-2 py-1">
                      {selectedStudent.profile_picture ? (
                        <img
                          src={
                            typeof selectedStudent.profile_picture === "string"
                              ? `${API}${selectedStudent.profile_picture}`
                              : URL.createObjectURL(selectedStudent.profile_picture)
                          }
                          alt="Profile"
                          className="w-20 h-20 object-cover rounded border"
                        />
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-700">Username</th>
                    <td className="px-2 py-1">{selectedStudent.username || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-700">First Name</th>
                    <td className="px-2 py-1">{selectedStudent.first_name || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-700">Last Name</th>
                    <td className="px-2 py-1">{selectedStudent.last_name || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-700">Email</th>
                    <td className="px-2 py-1">{selectedStudent.email || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-700">Phone</th>
                    <td className="px-2 py-1">{selectedStudent.phone_number || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-700">Address</th>
                    <td className="px-2 py-1">{selectedStudent.address || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-700">Date of Birth</th>
                    <td className="px-2 py-1">{selectedStudent.dob || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-700">Gender</th>
                    <td className="px-2 py-1 capitalize">{selectedStudent.gender || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-left text-gray-700">Class</th>
                    <td className="px-2 py-1">{selectedStudent.class_name || "N/A"}</td>
                  </tr>
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
      {isEditModalOpen && selectedStudent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 px-2 z-50">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl border border-gray-300 overflow-hidden">
            <div className="px-3 py-2 bg-blue-600 text-white">
              <h2 className="text-sm md:text-base font-bold text-center">Edit Student Profile</h2>
            </div>

            <div className="px-3 py-2 overflow-y-auto max-h-[62vh] space-y-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                  First Name
                </label>
                <input
                  type="text"
                  value={selectedStudent.first_name || ""}
                  onChange={(e) =>
                    setSelectedStudent({ ...selectedStudent, first_name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                  Last Name
                </label>
                <input
                  type="text"
                  value={selectedStudent.last_name || ""}
                  onChange={(e) =>
                    setSelectedStudent({ ...selectedStudent, last_name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={selectedStudent.phone_number || ""}
                  onChange={(e) =>
                    setSelectedStudent({ ...selectedStudent, phone_number: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                  Address
                </label>
                <input
                  type="text"
                  value={selectedStudent.address || ""}
                  onChange={(e) =>
                    setSelectedStudent({ ...selectedStudent, address: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={selectedStudent.dob || ""}
                    onChange={(e) =>
                      setSelectedStudent({ ...selectedStudent, dob: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                    Gender
                  </label>
                  <select
                    value={selectedStudent.gender || ""}
                    onChange={(e) =>
                      setSelectedStudent({ ...selectedStudent, gender: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                  Profile Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setSelectedStudent({ ...selectedStudent, profile_picture: file });
                  }}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs bg-white"
                />
                {selectedStudent.profile_picture && typeof selectedStudent.profile_picture !== "string" && (
                  <img
                    src={URL.createObjectURL(selectedStudent.profile_picture)}
                    alt="Preview"
                    className="w-20 h-20 mt-2 rounded border object-cover"
                  />
                )}
                {selectedStudent.profile_picture && typeof selectedStudent.profile_picture === "string" && (
                  <img
                    src={`${API}${selectedStudent.profile_picture}`}
                    alt="Existing"
                    className="w-20 h-20 mt-2 rounded border object-cover"
                  />
                )}
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
                onClick={updateStudent}
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

export default StudentInfo;
