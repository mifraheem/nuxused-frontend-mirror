import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { FiTrash, FiEdit, FiEye, FiPlus, FiSearch, FiX } from "react-icons/fi";
import { Buttons } from "../../components";
import Toaster from "../../components/Toaster"; // Import custom Toaster component
import TableComponent from "../../components/TableComponent"; // Import reusable TableComponent

const ParentAccount = () => {
  const [parents, setParents] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [toaster, setToaster] = useState({ message: "", type: "success" });
  const [confirmResolve, setConfirmResolve] = useState(null);

  // Student search states
  const [showStudentSearch, setShowStudentSearch] = useState(false);
  const [searchRegistrationNo, setSearchRegistrationNo] = useState("");
  const [searchedStudent, setSearchedStudent] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [linkedStudentsList, setLinkedStudentsList] = useState([]);

  // ✅ safe API base with fallback
  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}api/auth/users/list_profiles/parent/`;
  const UPDATE_URL = `${API}api/auth/update-parent-profile/`;
  const DELETE_URL = `${API}api/auth/users/`;
  const STUDENT_LIST_URL = `${API}api/auth/users/list_profiles/student/`;
  const STUDENT_SEARCH_URL = `${API}api/auth/search/`;

  // Permissions
  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canView = permissions.includes("users.view_parentprofile");
  const canEdit = permissions.includes("users.change_parentprofile");
  const canDelete =
    permissions.includes("users.delete_parentprofile") &&
    permissions.includes("users.delete_user");

  // Helpers
  const isValidId = (id) => {
    if (!id) return false;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(String(id)) || !isNaN(id) || typeof id === "string";
  };

  const authHeaders = () => {
    const token = Cookies.get("access_token");
    if (!token) throw new Error("Authentication token missing");
    return { Authorization: `Bearer ${token}` };
  };

  const showToast = (message, type = "success") => {
    setToaster({ message, type });
  };

  const confirmToast = (message, parentId) => {
    setToaster({
      message: message,
      type: "confirmation",
      onConfirm: () => {
        console.log("User confirmed delete for ID:", parentId);
        deleteParent(parentId);
        setToaster({ message: "", type: "success" }); // Clear toaster
      },
      onCancel: () => {
        console.log("User cancelled delete");
        setToaster({ message: "", type: "success" }); // Clear toaster
      }
    });
  };

  // Search student by registration number
  const searchStudentByRegistrationNo = async (registrationNo) => {
    if (!registrationNo.trim()) {
      showToast("Please enter a registration number", "error");
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(`${STUDENT_SEARCH_URL}?registration_no=${registrationNo}`, {
        headers: authHeaders(),
      });

      if (response.data && response.data.data && response.data.data.results) {
        const results = response.data.data.results;
        if (results.length > 0) {
          // Get the first result (should be only one for exact registration number match)
          const student = results[0];
          // Transform the API response to match our expected format
          const transformedStudent = {
            profile_id: student.profile_id,
            user_id: student.user_id,
            first_name: student.full_name.split(' ')[0] || '',
            last_name: student.full_name.split(' ').slice(1).join(' ') || '',
            full_name: student.full_name,
            registration_no: student.registration_no,
            school: student.school,
            class_name: student.class_name || '', // May not be in search response
            email: student.email || '', // May not be in search response
            user_type: student.user_type,
            role: student.role
          };
          setSearchedStudent(transformedStudent);
          showToast("Student found successfully", "success");
        } else {
          setSearchedStudent(null);
          showToast("No student found with this registration number", "error");
        }
      } else {
        setSearchedStudent(null);
        showToast("No student found with this registration number", "error");
      }
    } catch (error) {
      console.error("Error searching student:", error);
      setSearchedStudent(null);
      showToast(
        "Failed to search student: " + (error.response?.data?.message || error.message),
        "error"
      );
    } finally {
      setIsSearching(false);
    }
  };

  // Link student to parent
  const linkStudentToParent = (student) => {
    if (!student || !student.profile_id) {
      showToast("Invalid student data", "error");
      return;
    }

    // Check if student is already linked
    const isAlreadyLinked = linkedStudentsList.some(s => s.profile_id === student.profile_id);
    if (isAlreadyLinked) {
      showToast("Student is already linked to this parent", "error");
      return;
    }

    // Add student to linked list
    const updatedList = [...linkedStudentsList, student];
    setLinkedStudentsList(updatedList);

    // Update selected parent's children array
    const childrenIds = updatedList.map(s => s.profile_id);
    setSelectedParent({ ...selectedParent, children: childrenIds });

    // Clear search
    setSearchedStudent(null);
    setSearchRegistrationNo("");
    setShowStudentSearch(false);

    showToast("Student linked successfully", "success");
  };

  // Remove student from linked list
  const removeLinkedStudent = (studentId) => {
    const updatedList = linkedStudentsList.filter(s => s.profile_id !== studentId);
    setLinkedStudentsList(updatedList);

    // Update selected parent's children array
    const childrenIds = updatedList.map(s => s.profile_id);
    setSelectedParent({ ...selectedParent, children: childrenIds });

    showToast("Student unlinked successfully", "success");
  };

  // Fetch parents
  const fetchParents = async (page = currentPage, size = pageSize) => {
    try {
      const res = await axios.get(`${API_URL}?page=${page}&page_size=${size}`, {
        headers: authHeaders(),
      });
      const payload = res.data?.data;
      if (payload?.results) {
        setParents(payload.results);
        setTotalPages(payload.total_pages || 1);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Error fetching parents:", error.response?.data || error.message);
      showToast(
        "Failed to fetch parent accounts: " +
        (error.response?.data?.message || error.message),
        "error"
      );
    }
  };

  // Fetch students
  const fetchStudents = async () => {
    try {
      const res = await axios.get(STUDENT_LIST_URL, { headers: authHeaders() });
      const payload = res.data?.data?.results;
      if (Array.isArray(payload)) {
        setStudents(payload);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Error fetching students:", error.response?.data || error.message);
      showToast(
        "Failed to fetch students: " +
        (error.response?.data?.message || error.message),
        "error"
      );
    }
  };

  useEffect(() => {
    fetchParents();
    fetchStudents();
  }, [currentPage, pageSize]);

  // Actions
  const openViewModal = (parent) => {
    setSelectedParent(parent);
    setIsViewModalOpen(true);
  };

  const openEditModal = (parent) => {
    // Extract profile_ids from linked_students for the multiselect
    const linkedStudentIds = [];
    const linkedStudentsData = [];

    if (Array.isArray(parent.linked_students)) {
      parent.linked_students.forEach(student => {
        if (typeof student === 'string') {
          linkedStudentIds.push(student);
          // Find student data from students array
          const foundStudent = students.find(s => s.profile_id === student);
          if (foundStudent) {
            linkedStudentsData.push(foundStudent);
          }
        } else if (student && typeof student === 'object' && student.profile_id) {
          linkedStudentIds.push(student.profile_id);
          linkedStudentsData.push(student);
        } else if (student && typeof student === 'object' && student.name) {
          const matchedStudent = students.find(s =>
            `${s.first_name} ${s.last_name}`.trim() === student.name.trim()
          );
          if (matchedStudent) {
            linkedStudentIds.push(matchedStudent.profile_id);
            linkedStudentsData.push(matchedStudent);
          }
        }
      });
    }

    setSelectedParent({
      ...parent,
      children: linkedStudentIds,
    });
    setLinkedStudentsList(linkedStudentsData);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setShowStudentSearch(false);
    setSearchedStudent(null);
    setSearchRegistrationNo("");
    setLinkedStudentsList([]);
  };

  const closeViewModal = () => setIsViewModalOpen(false);

  const confirmDeleteParent = async (id) => {
    console.log("Delete clicked for ID:", id); // Debug log

    if (!canDelete) {
      showToast("You do not have permission to delete parent profiles.", "error");
      return;
    }

    if (!isValidId(id)) {
      showToast("Invalid parent ID format.", "error");
      return;
    }

    confirmToast("Are you sure you want to delete this parent? This action cannot be undone.", id);
  };

  const deleteParent = async (id) => {
    console.log("Starting delete for ID:", id);
    try {
      const deleteUrl = `${DELETE_URL}${id}/delete_user/`;
      console.log("Delete URL:", deleteUrl);

      const response = await axios.delete(deleteUrl, {
        headers: authHeaders()
      });

      console.log("Delete response:", response);

      setParents((prev) => {
        const updated = prev.filter((p) => p.user_id !== id);
        console.log("Parents before delete:", prev.length);
        console.log("Parents after delete:", updated.length);
        return updated;
      });

      showToast("Parent deleted successfully.", "success");
      fetchParents();
    } catch (error) {
      console.error("Error deleting parent:", error);
      console.error("Error response:", error.response?.data);

      let errorMessage = "Failed to delete parent: ";
      if (error.response?.status === 404) {
        errorMessage += "Parent not found.";
      } else if (error.response?.status === 403) {
        errorMessage += "Permission denied.";
      } else if (error.response?.status === 400) {
        errorMessage += "Invalid request.";
      } else {
        errorMessage += (error.response?.data?.message || error.message);
      }

      showToast(errorMessage, "error");
    }
  };

  const updateParent = async () => {
    if (!selectedParent?.user_id) {
      showToast("No parent selected.", "error");
      return;
    }

    try {
      const apiUrl = `${UPDATE_URL}${selectedParent.user_id}/update-profile/`;
      const payload = {
        username: selectedParent.username || "",
        first_name: selectedParent.first_name || "",
        last_name: selectedParent.last_name || "",
        phone_number: selectedParent.phone_number || "",
        address: selectedParent.address || "",
        email: selectedParent.email || "",
        dob: selectedParent.dob || null,
        gender: selectedParent.gender || "",
        children: selectedParent.children || [],
      };

      console.log("Sending payload:", payload);

      const response = await axios.patch(apiUrl, payload, {
        headers: { ...authHeaders(), "Content-Type": "application/json" },
      });

      if (response.status === 200) {
        showToast("Parent updated successfully.", "success");
        fetchParents();
        closeEditModal();
      }
    } catch (error) {
      console.error("Error updating parent:", error.response?.data || error.message);
      showToast(
        "Failed to update parent: " +
        (error.response?.data?.message ||
          error.response?.data?.detail ||
          error.message),
        "error"
      );
    }
  };

  // Helper function to get linked student names for display
  const getLinkedStudentNames = (linkedStudents) => {
    if (!Array.isArray(linkedStudents) || linkedStudents.length === 0) {
      return "None";
    }

    return linkedStudents.map(student => {
      if (typeof student === 'string') {
        const foundStudent = students.find(s => s.profile_id === student);
        return foundStudent ? `${foundStudent.first_name} ${foundStudent.last_name}`.trim() : student;
      } else if (student && typeof student === 'object') {
        return student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim();
      }
      return student;
    }).join(", ");
  };

  // Table columns configuration
  const columns = [
    {
      key: "index",
      label: "No.",
      render: (row, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      key: "full_name",
      label: "Full Name",
      render: (row) => `${row.first_name} ${row.last_name}`,
    },
    { key: "email", label: "Email", render: (row) => row.email || "N/A" },
    { key: "phone_number", label: "Phone Number", render: (row) => row.phone_number || "N/A" },
    { key: "address", label: "Address", render: (row) => row.address || "N/A" },
    { key: "gender", label: "Gender", render: (row) => row.gender || "N/A" },
    {
      key: "linked_students",
      label: "Linked Students",
      render: (row) => getLinkedStudentNames(row.linked_students),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          {canView && (
            <FiEye
              className="text-blue-500 cursor-pointer hover:text-blue-700"
              size={18}
              onClick={() => openViewModal(row)}
            />
          )}
          {canEdit && (
            <FiEdit
              className="text-yellow-500 cursor-pointer hover:text-yellow-700"
              size={18}
              onClick={() => openEditModal(row)}
            />
          )}
          {canDelete && (
            <FiTrash
              className="text-red-500 cursor-pointer hover:text-red-700"
              size={18}
              onClick={() => confirmDeleteParent(row.user_id)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-2 md:p-3 min-h-screen flex-1">
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={toaster.type === "confirmation" ? 10000 : 3000}
        onClose={() => setToaster({ message: "", type: "success" })}
        onConfirm={toaster.onConfirm}
        onCancel={toaster.onCancel}
      />

      {/* Header */}
      <div className="bg-blue-900 text-white rounded-md flex items-center justify-between px-2 py-2 mt-2">
        <h1 className="text-sm md:text-base font-bold">Manage Parent Accounts</h1>
      </div>

      {/* Table + Export */}
      <div className="mt-2">
        <div className="rounded-md p-2">
          <Buttons
            data={parents.map((p, index) => ({
              "S.No.": (currentPage - 1) * pageSize + index + 1,
              Username: p.username,
              "First Name": p.first_name,
              "Last Name": p.last_name,
              Email: p.email,
              "Phone Number": p.phone_number,
              Address: p.address,
              "Date of Birth": p.dob,
              Gender: p.gender,
              "Linked Students": getLinkedStudentNames(p.linked_students),
            }))}
            filename="Parent_Accounts"
            columns={[
              { label: "S.No.", key: "S.No." },
              { label: "Username", key: "Username" },
              { label: "First Name", key: "First Name" },
              { label: "Last Name", key: "Last Name" },
              { label: "Email", key: "Email" },
              { label: "Phone Number", key: "Phone Number" },
              { label: "Address", key: "Address" },
              { label: "Date of Birth", key: "Date of Birth" },
              { label: "Gender", key: "Gender" },
              { label: "Linked Students", key: "Linked Students" },
            ]}
          />

          <div className="overflow-x-auto mt-2 max-w-full">
            {parents.length > 0 ? (
              <TableComponent
                data={parents}
                columns={columns}
                initialSort={{ key: "full_name", direction: "asc" }}
              />
            ) : (
              <div className="border border-gray-300 p-2 text-center text-gray-500 text-sm bg-white rounded-lg shadow-lg">
                No parent accounts added yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Modal (compact & scrollable) */}
      {isViewModalOpen && selectedParent && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-bold">Parent Details</h2>
              <button
                onClick={closeViewModal}
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
                  {selectedParent.profile_picture ? (
                    <img
                      src={`${API}${selectedParent.profile_picture}`}
                      alt="Profile"
                      className="w-32 h-32 object-cover rounded-full border-4 border-blue-200 shadow-md"
                    />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center rounded-full bg-gray-100 text-gray-400">
                      No Image
                    </div>
                  )}
                  <p className="mt-3 font-semibold text-lg">
                    {selectedParent.first_name} {selectedParent.last_name}
                  </p>
                  <p className="text-gray-500 text-sm">{selectedParent.username || "N/A"}</p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Phone</p>
                    <p className="text-base font-medium">{selectedParent.phone_number || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Email</p>
                    <p className="text-base font-medium break-words">{selectedParent.email || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Address</p>
                    <p className="text-base font-medium">{selectedParent.address || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Gender</p>
                    <p className="text-base font-medium capitalize">{selectedParent.gender || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border">
                    <p className="text-xs uppercase text-gray-500 font-semibold">Date of Birth</p>
                    <p className="text-base font-medium">{selectedParent.dob || "N/A"}</p>
                  </div>

                  {/* Children Section */}
                  <div className="p-4 bg-gray-50 rounded-lg shadow-sm border sm:col-span-2">
                    <p className="text-xs uppercase text-gray-500 font-semibold mb-2">Children</p>
                    {selectedParent.linked_students && selectedParent.linked_students.length > 0 ? (
                      <div className="space-y-3">
                        {selectedParent.linked_students.map((child, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-white border rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-base font-semibold">{child.name} </p>
                              <p className="text-sm text-gray-500">Reg. No: {child.registration_no || "N/A"}</p>
                            </div>
                            <p className="mt-1 sm:mt-0 text-sm font-medium text-blue-700">
                              {child.class_name || "N/A"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-base font-medium text-gray-500">No linked students</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 py-4 bg-gray-50">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm md:text-base shadow-md"
                onClick={closeViewModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (compact & scrollable) */}
      {isEditModalOpen && selectedParent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 px-4 z-50">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-bold">Edit Parent Profile</h2>
              <button
                onClick={closeEditModal}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[60vh] space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={selectedParent.username || ""}
                  onChange={(e) =>
                    setSelectedParent({ ...selectedParent, username: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* First + Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={selectedParent.first_name || ""}
                    onChange={(e) =>
                      setSelectedParent({ ...selectedParent, first_name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={selectedParent.last_name || ""}
                    onChange={(e) =>
                      setSelectedParent({ ...selectedParent, last_name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Phone + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={selectedParent.phone_number || ""}
                    onChange={(e) =>
                      setSelectedParent({ ...selectedParent, phone_number: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={selectedParent.email || ""}
                    onChange={(e) =>
                      setSelectedParent({ ...selectedParent, email: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={selectedParent.address || ""}
                  onChange={(e) =>
                    setSelectedParent({ ...selectedParent, address: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Gender + DOB */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={selectedParent.gender || ""}
                    onChange={(e) =>
                      setSelectedParent({ ...selectedParent, gender: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={selectedParent.dob || ""}
                    onChange={(e) =>
                      setSelectedParent({ ...selectedParent, dob: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Linked Children Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Linked Children
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowStudentSearch(true)}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md font-medium"
                  >
                    <FiPlus size={14} />
                    Link More Students
                  </button>
                </div>

                {/* Already Linked Students */}
                <div className="space-y-2 mb-4">
                  {linkedStudentsList.length > 0 ? (
                    linkedStudentsList.map((student) => (
                      <div
                        key={student.profile_id}
                        className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim()}
                          </p>
                          <div className="flex gap-4 text-sm text-gray-600">
                            {student.registration_no && (
                              <span>Reg: {student.registration_no}</span>
                            )}
                            {student.class_name && (
                              <span>Class: {student.class_name}</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLinkedStudent(student.profile_id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
                      No students linked yet
                    </div>
                  )}
                </div>

                {/* Student Search Modal */}
                {showStudentSearch && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Search Student</h3>
                        <button
                          onClick={() => {
                            setShowStudentSearch(false);
                            setSearchedStudent(null);
                            setSearchRegistrationNo("");
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <FiX size={20} />
                        </button>
                      </div>

                      {/* Search Input */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Registration Number
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={searchRegistrationNo}
                            onChange={(e) => setSearchRegistrationNo(e.target.value)}
                            placeholder="Enter registration number"
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                searchStudentByRegistrationNo(searchRegistrationNo);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => searchStudentByRegistrationNo(searchRegistrationNo)}
                            disabled={isSearching}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-md text-sm font-medium flex items-center gap-1"
                          >
                            {isSearching ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            ) : (
                              <FiSearch size={16} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Search Result */}
                      {searchedStudent && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Search Result:</h4>
                          <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {searchedStudent.full_name}
                                </p>
                                <div className="text-sm text-gray-600">
                                  <p>Reg: {searchedStudent.registration_no}</p>
                                  {searchedStudent.school && (
                                    <p>School: {searchedStudent.school}</p>
                                  )}
                                  {searchedStudent.class_name && (
                                    <p>Class: {searchedStudent.class_name}</p>
                                  )}
                                  {searchedStudent.email && (
                                    <p>Email: {searchedStudent.email}</p>
                                  )}
                                  <p>Role: {searchedStudent.role}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => linkStudentToParent(searchedStudent)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md font-medium"
                              >
                                Link
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Modal Actions */}
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowStudentSearch(false);
                            setSearchedStudent(null);
                            setSearchRegistrationNo("");
                          }}
                          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md text-sm font-medium"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50">
              <button
                onClick={closeEditModal}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={updateParent}
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

export default ParentAccount;