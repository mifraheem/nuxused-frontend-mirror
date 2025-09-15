import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { FiTrash, FiEdit, FiEye } from "react-icons/fi";
import { Buttons } from "../../components";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster"; // Import custom Toaster component

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

  // ✅ safe API base with fallback
  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}api/auth/users/list_profiles/parent/`;
  const UPDATE_URL = `${API}api/auth/update-parent-profile/`;
  const DELETE_URL = `${API}api/auth/users/`;
  const STUDENT_LIST_URL = `${API}api/auth/users/list_profiles/student/`;

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

    if (Array.isArray(parent.linked_students)) {
      parent.linked_students.forEach(student => {
        if (typeof student === 'string') {
          // If it's already a string (profile_id), use it directly
          linkedStudentIds.push(student);
        } else if (student && typeof student === 'object' && student.profile_id) {
          // If it's an object with profile_id, extract the profile_id
          linkedStudentIds.push(student.profile_id);
        } else if (student && typeof student === 'object' && student.name) {
          // If it's an object with name, try to find matching student by name
          const matchedStudent = students.find(s =>
            `${s.first_name} ${s.last_name}`.trim() === student.name.trim()
          );
          if (matchedStudent) {
            linkedStudentIds.push(matchedStudent.profile_id);
          }
        }
      });
    }

    setSelectedParent({
      ...parent,
      children: linkedStudentIds,
    });
    setIsEditModalOpen(true);
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

    // Use the Toaster's built-in confirmation functionality
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

      // Update the parents list by removing the deleted parent
      setParents((prev) => {
        const updated = prev.filter((p) => p.user_id !== id);
        console.log("Parents before delete:", prev.length);
        console.log("Parents after delete:", updated.length);
        return updated;
      });

      showToast("Parent deleted successfully.", "success");

      // Refresh the list to ensure consistency
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
        children: selectedParent.children || [], // API expects "children", not "linked_students"
      };

      console.log("Sending payload:", payload); // Debug log

      const response = await axios.patch(apiUrl, payload, {
        headers: { ...authHeaders(), "Content-Type": "application/json" },
      });

      if (response.status === 200) {
        showToast("Parent updated successfully.", "success");
        fetchParents(); // Refresh the parent list
        setIsEditModalOpen(false);
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
        // If it's a string, find the student by profile_id
        const foundStudent = students.find(s => s.profile_id === student);
        return foundStudent ? `${foundStudent.first_name} ${foundStudent.last_name}`.trim() : student;
      } else if (student && typeof student === 'object') {
        // If it's an object, check for name property or construct from first_name/last_name
        return student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim();
      }
      return student;
    }).join(", ");
  };


  return (
    <div className="p-2 md:p-3 min-h-screen flex-1">
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={toaster.type === "confirmation" ? 10000 : 3000} // Longer duration for confirmations
        onClose={() => setToaster({ message: "", type: "success" })}
        onConfirm={toaster.onConfirm} // Pass the confirm handler
        onCancel={toaster.onCancel}   // Pass the cancel handler
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
            <table className="w-full border-collapse border border-gray-300 bg-white min-w-[500px] shadow-lg">
              <thead className="bg-blue-900 text-white sticky top-0 z-10">
                <tr>
                  <th className="border border-gray-300 p-1 text-center text-xs">No.</th>
                  <th className="border border-gray-300 p-1 text-center text-xs">Full Name</th>
                  <th className="border border-gray-300 p-1 text-center text-xs">Email</th>
                  <th className="border border-gray-300 p-1 text-center text-xs">Phone Number</th>
                  <th className="border border-gray-300 p-1 text-center text-xs">Address</th>
                  <th className="border border-gray-300 p-1 text-center text-xs">Gender</th>
                  <th className="border border-gray-300 p-1 text-center text-xs">Linked Students</th>
                  <th className="border border-gray-300 p-1 text-center text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {parents.length > 0 ? (
                  parents.map((parent, index) => (
                    <tr key={parent.user_id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-1 text-center text-xs">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="border border-gray-300 p-1 text-xs">{parent.first_name} {parent.last_name}</td>
                      <td className="border border-gray-300 p-1 text-xs">{parent.email || "N/A"}</td>
                      <td className="border border-gray-300 p-1 text-xs">{parent.phone_number || "N/A"}</td>
                      <td className="border border-gray-300 p-1 text-xs">{parent.address || "N/A"}</td>
                      <td className="border border-gray-300 p-1 text-xs">{parent.gender || "N/A"}</td>
                      <td className="border border-gray-300 p-1 text-xs">
                        {getLinkedStudentNames(parent.linked_students)}
                      </td>
                      <td className="border border-gray-300 p-1">
                        <div className="flex items-center justify-center gap-2">
                          {canView && (
                            <FiEye
                              className="text-blue-500 cursor-pointer hover:text-blue-700"
                              size={18}
                              onClick={() => openViewModal(parent)}
                            />
                          )}
                          {canEdit && (
                            <FiEdit
                              className="text-yellow-500 cursor-pointer hover:text-yellow-700"
                              size={18}
                              onClick={() => openEditModal(parent)}
                            />
                          )}
                          {canDelete && (
                            <FiTrash
                              className="text-red-500 cursor-pointer hover:text-red-700"
                              size={18}
                              onClick={() => confirmDeleteParent(parent.user_id)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="border border-gray-300 p-2 text-center text-gray-500 text-sm">
                      No parent accounts added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              totalItems={parents.length}
              showPageSizeSelector={true}
              showPageInfo={true}
            />
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
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 overflow-hidden">

            {/* Header */}
            <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-bold">Edit Parent Profile</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[70vh] space-y-4">
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

              {/* Children with checkboxes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Linked Children
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3 bg-gray-50">
                  {students.map((s) => {
                    const isChecked = (selectedParent.children || []).includes(s.profile_id);
                    return (
                      <label
                        key={s.profile_id}
                        className="flex items-start space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            let updated = [...(selectedParent.children || [])];
                            if (e.target.checked) {
                              updated.push(s.profile_id);
                            } else {
                              updated = updated.filter((id) => id !== s.profile_id);
                            }
                            setSelectedParent({ ...selectedParent, children: updated });
                          }}
                          className="mt-1"
                        />
                        <span className="text-sm">
                          <span className="font-semibold">{s.first_name} {s.last_name}</span>{" "}
                          {s.registration_no && (
                            <span className="text-gray-600">(Reg: {s.registration_no})</span>
                          )}{" "}
                          {s.class_name && (
                            <span className="text-blue-700 font-medium">– {s.class_name}</span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
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