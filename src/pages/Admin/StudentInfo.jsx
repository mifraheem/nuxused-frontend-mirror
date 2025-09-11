import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { FiTrash, FiEdit, FiEye } from "react-icons/fi";
import Buttons from "../../components/Buttons"; // Adjust the import path as needed
import Toaster from "../../components/Toaster"; // Import custom Toaster component

const StudentInfo = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toaster, setToaster] = useState({ message: "", type: "success" });
  const [confirmResolve, setConfirmResolve] = useState(null);

  const API = import.meta.env.VITE_SERVER_URL;

  // Permissions
  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canView = permissions.includes("users.view_studentprofile");
  const canEdit = permissions.includes("users.change_studentprofile");
  const canDelete = permissions.includes("users.delete_studentprofile");

  const authHeaders = () => {
    const token = Cookies.get("access_token");
    if (!token) throw new Error("User is not authenticated.");
    return { Authorization: `Bearer ${token}` };
  };

  const showToast = (message, type = "success") => {
    setToaster({ message, type });
  };

  const confirmToast = (message = "Delete this student?") => {
    return new Promise((resolve) => {
      setConfirmResolve(() => resolve); // Store the resolve function
      setToaster({
        message: (
          <div className="flex flex-col gap-4">
            <p className="text-lg font-medium">{message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setToaster({ message: "", type: "success" });
                  resolve(true);
                }}
                className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
              >
                Yes
              </button>
              <button
                onClick={() => {
                  setToaster({ message: "", type: "success" });
                  resolve(false);
                }}
                className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
              >
                No
              </button>
            </div>
          </div>
        ),
        type: "confirmation",
      });
    });
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
        showToast("Failed to fetch students.", "error");
        return [];
      }
    } catch (error) {
      console.error("Error fetching students:", error.response || error.message);
      showToast(error.response?.data?.message || "Failed to fetch students.", "error");
      return [];
    }
  };

  useEffect(() => {
    fetchStudents(1, pageSize);
  }, [pageSize]);

  const updateStudent = async () => {
    try {
      if (!selectedStudent || !selectedStudent.user_id) {
        showToast("Invalid student selected for update.", "error");
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
        showToast("Student updated successfully.", "success");
        fetchStudents(currentPage, pageSize);
        setIsEditModalOpen(false);
      } else {
        showToast("Unexpected response from server.", "error");
      }
    } catch (error) {
      console.error("Error updating student:", error);
      showToast(error.response?.data?.detail || "Failed to update student.", "error");
    }
  };

  const deleteStudent = async (id) => {
    try {
      if (!id) {
        showToast("Invalid student ID.", "error");
        return;
      }

      const response = await axios.delete(
        `${API}api/auth/users/${id}/delete_user/`,
        { headers: authHeaders() }
      );

      if ([200, 202, 204].includes(response.status)) {
        if (response.status === 202) {
          showToast("Student deletion scheduled. Will be removed after 10 seconds.", "success");
          setTimeout(() => {
            setStudents((prev) => prev.filter((s) => s.user_id !== id));
            showToast("Student deleted.", "success");
          }, 10000);
        } else {
          setStudents((prev) => prev.filter((s) => s.user_id !== id));
          showToast("Student deleted.", "success");
        }
      } else {
        showToast("Failed to delete student: Unexpected status code.", "error");
      }
    } catch (error) {
      console.error("Error deleting student:", error.response || error.message);
      showToast(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Failed to delete student.",
        "error"
      );
    }
  };

  const confirmDeleteStudent = async (id) => {
    if (!id) {
      showToast("Invalid student ID.", "error");
      return;
    }
    if (!canDelete) {
      showToast("You don’t have permission to delete student profiles.", "error");
      return;
    }

    const ok = await confirmToast("Delete this student?");
    if (ok) {
      deleteStudent(id);
    }
  };

  const openViewModal = (student) => {
    if (!student || !student.user_id) {
      showToast("Invalid student selected.", "error");
      return;
    }
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };

  const openEditModal = (student) => {
    if (!student || !student.user_id) {
      showToast("Invalid student selected.", "error");
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
    <div className="p-2 md:p-3 relative">
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={toaster.type === "confirmation" ? 5000 : 3000}
        onClose={() => setToaster({ message: "", type: "success" })}
      />

      {/* Header bar */}
      <div className="bg-blue-900 text-white rounded-md flex items-center justify-between px-2 py-2 mt-2">
        <h1 className="text-sm md:text-base font-bold">Manage Student Information</h1>
      </div>

      <div className="mt-2 p-2">
        <Buttons
          data={students}
          columns={[
            { label: "Username", key: "username" },
            { label: "First Name", key: "first_name" },
            { label: "Last Name", key: "last_name" },
            { label: "Email", key: "email" },
            { label: "Phone Number", key: "phone_number" },
            { label: "Address", key: "address" },
            { label: "Date of Birth", key: "dob" },
            { label: "Gender", key: "gender" },
            { label: "Registration No", key: "registration_no" },
            { label: "Class Name", key: "class_name" },
          ]}
          filename="Students_List"
        />

        {/* Table */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full border-collapse border border-gray-300 bg-white min-w-[500px] shadow-lg">
            <thead className="bg-blue-900 text-white sticky top-0 z-10">
              <tr>
                <th className="border border-gray-300 p-1 text-center text-xs">No.</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Full Name</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Phone</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Gender</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Registration No</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Class</th>
                <th className="border border-gray-300 p-1 text-center text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.user_id || `student-${index}`} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-1 text-center text-xs">
                    {index + 1 + (currentPage - 1) * pageSize}
                  </td>
                  <td className="border border-gray-300 p-1 text-xs">{student.first_name} {student.last_name}</td>
                  <td className="border border-gray-300 p-1 text-xs">
                    <span className="block max-w-[150px] truncate" title={student.phone_number}>
                      {student.phone_number || "N/A"}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-1 text-xs capitalize">{student.gender || "N/A"}</td>
                  <td className="border border-gray-300 p-1 text-xs">{student.registration_no || "N/A"}</td>
                  <td className="border border-gray-300 p-1 text-xs">{student.class_name || "N/A"}</td>
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
                  <td colSpan={12} className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                    No students added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
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
                className={`px-2 py-1 rounded text-xs ${currentPage === idx + 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
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

      {/* View Modal */}
      {isViewModalOpen && selectedStudent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 px-4 z-50">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl border border-gray-200 overflow-hidden">

            {/* Header */}
            <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-bold">Student Details</h2>
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
                  {selectedStudent.profile_picture ? (
                    <img
                      src={
                        typeof selectedStudent.profile_picture === "string"
                          ? `${API}${selectedStudent.profile_picture}`
                          : URL.createObjectURL(selectedStudent.profile_picture)
                      }
                      alt="Profile"
                      className="w-32 h-32 object-cover rounded-full border-4 border-blue-200 shadow-md"
                    />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center rounded-full bg-gray-100 text-gray-400">
                      No Image
                    </div>
                  )}
                  <p className="mt-3 font-semibold text-lg">
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </p>
                  <p className="text-gray-500 text-sm">{selectedStudent.class_name || "N/A"}</p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                  {/* Example Info Card */}
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Username</p>
                    <p className="text-base font-medium">{selectedStudent.username || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Email</p>
                    <p className="text-base font-medium break-words">{selectedStudent.email || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Phone</p>
                    <p className="text-base font-medium">{selectedStudent.phone_number || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Address</p>
                    <p className="text-base font-medium">{selectedStudent.address || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Date of Birth</p>
                    <p className="text-base font-medium">{selectedStudent.dob || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Gender</p>
                    <p className="text-base font-medium capitalize">{selectedStudent.gender || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Registration No</p>
                    <p className="text-base font-medium">{selectedStudent.registration_no || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Class</p>
                    <p className="text-base font-medium">{selectedStudent.class_name || "N/A"}</p>
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
      {isEditModalOpen && selectedStudent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 px-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 overflow-hidden">

            {/* Header */}
            <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-bold">Edit Student Profile</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[70vh] space-y-4">

              {/* First Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={selectedStudent.first_name || ""}
                  onChange={(e) =>
                    setSelectedStudent({ ...selectedStudent, first_name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={selectedStudent.last_name || ""}
                  onChange={(e) =>
                    setSelectedStudent({ ...selectedStudent, last_name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Phone & Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={selectedStudent.phone_number || ""}
                    onChange={(e) =>
                      setSelectedStudent({ ...selectedStudent, phone_number: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={selectedStudent.address || ""}
                    onChange={(e) =>
                      setSelectedStudent({ ...selectedStudent, address: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Date of Birth & Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={selectedStudent.dob || ""}
                    onChange={(e) =>
                      setSelectedStudent({ ...selectedStudent, dob: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={selectedStudent.gender || ""}
                    onChange={(e) =>
                      setSelectedStudent({ ...selectedStudent, gender: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Profile Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setSelectedStudent({ ...selectedStudent, profile_picture: file });
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                />
                {selectedStudent.profile_picture && typeof selectedStudent.profile_picture !== "string" && (
                  <img
                    src={URL.createObjectURL(selectedStudent.profile_picture)}
                    alt="Preview"
                    className="w-24 h-24 mt-3 rounded-lg border object-cover shadow-sm"
                  />
                )}
                {selectedStudent.profile_picture && typeof selectedStudent.profile_picture === "string" && (
                  <img
                    src={`${API}${selectedStudent.profile_picture}`}
                    alt="Existing"
                    className="w-24 h-24 mt-3 rounded-lg border object-cover shadow-sm"
                  />
                )}
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
                onClick={updateStudent}
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

export default StudentInfo;