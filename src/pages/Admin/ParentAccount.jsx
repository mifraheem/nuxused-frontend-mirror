import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { FiTrash, FiEdit, FiEye } from "react-icons/fi";
import { Buttons } from "../../components";
import Pagination from "../../components/Pagination";

const ParentAccount = () => {
  const [parents, setParents] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}api/auth/users/list_profiles/parent/`;
  const UPDATE_URL = `${API}api/auth/update-parent-profile/`;
  const DELETE_URL = `${API}api/auth/users/delete_user/`;
  const STUDENT_LIST_URL = `${API}api/auth/users/list_profiles/student/`;

  const isValidId = (id) => {
    if (!id) return false;
    // Allow integers or strings that can be parsed as integers
    return !isNaN(id) || typeof id === 'string';
  };

  const fetchParents = async (page = currentPage, size = pageSize) => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        throw new Error("Authentication token missing");
      }
      const response = await axios.get(`${API_URL}?page=${page}&page_size=${size}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Parent list response:", response.data);
      if (response.data?.data?.results) {
        const parentList = response.data.data.results;
        parentList.forEach((parent, index) => {
          console.log(`Parent ${index + 1} user_id:`, parent.user_id, `Valid ID:`, isValidId(parent.user_id));
        });
        setParents(parentList);
        setTotalPages(response.data.data.total_pages || 1);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Error fetching parents:", error.response?.data);
      toast.error("Failed to fetch parent accounts: " + (error.response?.data?.message || error.message));
    }
  };

  const fetchStudents = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        throw new Error("Authentication token missing");
      }
      const response = await axios.get(STUDENT_LIST_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Student list response:", response.data);
      if (response.data?.data?.results) {
        const studentList = response.data.data.results;
        studentList.forEach((student, index) => {
          console.log(`Student ${index + 1} user_id:`, student.user_id, `Valid ID:`, isValidId(student.user_id));
        });
        setStudents(studentList);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Error fetching students:", error.response?.data);
      toast.error("Failed to fetch students: " + (error.response?.data?.message || error.message));
    }
  };

  const confirmDeleteParent = (id) => {
    if (!canDelete) {
      toast.error("🚫 You do not have permission to delete parent profiles.");
      return;
    }

    console.log("Confirm delete parent ID:", id);
    if (!isValidId(id)) {
      toast.error("Invalid parent ID format.");
      return;
    }

    toast((t) => (
      <div className="text-center">
        <p className="font-semibold">Are you sure you want to delete this parent?</p>
        <div className="flex justify-center mt-3 gap-4">
          <button
            onClick={() => {
              deleteParent(id);
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

  const deleteParent = async (id) => {
    try {
      const token = Cookies.get("access_token");
      console.log("Deleting parent with ID:", id);
      await axios.delete(`${DELETE_URL}${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setParents((prev) => prev.filter((p) => p.user_id != id));
      toast.success("Parent deleted successfully.");
    } catch (error) {
      console.error("Error deleting parent:", error.response?.data);
      toast.error("Failed to delete parent: " + (error.response?.data?.message || error.message));
    }
  };

  const openViewModal = (parent) => {
    console.log("Opening view modal for parent:", parent);
    setSelectedParent(parent);
    setIsViewModalOpen(true);
  };

  const openEditModal = (parent) => {
    console.log("Opening edit modal for parent:", parent);
    const matchedChildren = (parent.linked_students || []).map((name) => {
      const match = students.find((student) => `${student.first_name} ${student.last_name}` === name);
      return match ? match.user_id : null;
    }).filter(Boolean);

    setSelectedParent({ ...parent, user_id: parent.user_id, children: matchedChildren });
    setIsEditModalOpen(true);
  };

  const closeViewModal = () => setIsViewModalOpen(false);

  const updateParent = async () => {
    if (!selectedParent?.user_id) {
      toast.error("No parent selected.");
      console.log("No user_id in selectedParent:", selectedParent);
      return;
    }

    console.log("Selected parent user_id:", selectedParent.user_id, "Valid ID:", isValidId(selectedParent.user_id));
    if (!isValidId(selectedParent.user_id)) {
      toast.error("Invalid user ID format. Must be a valid integer or string.");
      return;
    }

    if (!selectedParent.first_name || !selectedParent.last_name) {
      toast.error("First name and last name are required.");
      return;
    }

    if (selectedParent.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedParent.email)) {
      toast.error("Invalid email format.");
      return;
    }

    if (selectedParent.phone_number && !/^\d{7,15}$/.test(selectedParent.phone_number)) {
      toast.error("Invalid phone number format.");
      return;
    }

    if (selectedParent.children?.some((id) => !isValidId(id))) {
      toast.error("One or more child IDs are invalid.");
      return;
    }

    try {
      const token = Cookies.get("access_token");
      if (!token) {
        throw new Error("Authentication token missing");
      }

      const apiUrl = `${UPDATE_URL}${selectedParent.user_id}/update-profile/`;
      const updatedData = {
        username: selectedParent.username || "",
        first_name: selectedParent.first_name || "",
        last_name: selectedParent.last_name || "",
        phone_number: selectedParent.phone_number || "",
        address: selectedParent.address || "",
        email: selectedParent.email || "",
        dob: selectedParent.dob || "2000-01-01",
        gender: selectedParent.gender || "",
        children: selectedParent.children || [],
      };

      console.log("Updating parent with payload:", updatedData, "to URL:", apiUrl);

      const response = await axios.patch(apiUrl, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Update parent response:", response.data);

      if (response.status === 200) {
        toast.success("Parent updated successfully.");
        setSelectedParent((prev) => ({
          ...prev,
          ...updatedData,
          linked_students: response.data.data?.linked_students || prev.linked_students || [],
        }));
        fetchParents();
        setIsEditModalOpen(false);
      } else {
        toast.error("Unexpected response status: " + response.status);
      }
    } catch (error) {
      console.error("Error updating parent:", error.response?.data);
      const errMsg = error.response?.data?.message || error.response?.data?.error || error.response?.data?.detail || error.message;
      if (error.response?.status === 405) {
        toast.error("Server does not allow PATCH requests. Contact backend team to enable PATCH or use another method.");
      } else if (error.response?.status === 404) {
        toast.error("Parent profile endpoint not found. Please check the user ID or API configuration.");
      } else {
        toast.error("Failed to update parent: " + errMsg);
      }
    }
  };

  useEffect(() => {
    fetchParents();
    fetchStudents();
  }, [currentPage, pageSize]);

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canView = permissions.includes("users.view_parentprofile");
  const canEdit = permissions.includes("users.change_parentprofile");
  const canDelete = permissions.includes("users.delete_parentprofile") && permissions.includes("users.delete_user");

  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <h1 className="bg-blue-900 text-white py-4 px-6 text-xl font-bold rounded-lg mt-6">Manage Parent Accounts</h1>
      <div className="p-6">
        <Buttons
          data={parents.map((parent) => ({
            "User ID": parent.user_id,
            Username: parent.username,
            "First Name": parent.first_name,
            "Last Name": parent.last_name,
            Email: parent.email,
          }))}
          filename="Parent_Accounts"
          columns={[
            { label: "User ID", key: "User ID" },
            { label: "Username", key: "Username" },
            { label: "First Name", key: "First Name" },
            { label: "Last Name", key: "Last Name" },
            { label: "Email", key: "Email" },
          ]}
        />

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm bg-white">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="border border-gray-300 px-4 py-2">ID</th>
                <th className="border border-gray-300 px-4 py-2">Username</th>
                <th className="border border-gray-300 px-4 py-2">First Name</th>
                <th className="border border-gray-300 px-4 py-2">Last Name</th>
                <th className="border border-gray-300 px-4 py-2">Email</th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parents.length > 0 ? (
                parents.map((parent) => (
                  <tr key={parent.user_id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{parent.user_id}</td>
                    <td className="border border-gray-300 px-4 py-2">{parent.username}</td>
                    <td className="border border-gray-300 px-4 py-2">{parent.first_name}</td>
                    <td className="border border-gray-300 px-4 py-2">{parent.last_name}</td>
                    <td className="border border-gray-300 px-4 py-2">{parent.email}</td>
                    <td className="border border-gray-300 px-4 py-2 flex justify-center gap-3">
                      {canView && (
                        <FiEye
                          className="text-blue-500 cursor-pointer"
                          onClick={() => openViewModal(parent)}
                          title="View Parent"
                        />
                      )}
                      {canEdit && (
                        <FiEdit
                          className="text-green-500 cursor-pointer"
                          onClick={() => openEditModal(parent)}
                          title="Edit Parent"
                        />
                      )}
                      {canDelete && (
                        <FiTrash
                          className="text-red-500 cursor-pointer"
                          onClick={() => confirmDeleteParent(parent.user_id)}
                          title="Delete Parent"
                        />
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                    No parent accounts available.
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

      {/* View Modal */}
      {isViewModalOpen && selectedParent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden border border-gray-200">
            <div className="bg-blue-600 text-white text-center py-4 px-6 border-b">
              <h2 className="text-xl font-bold">👨‍👩‍👧‍👦 Parent Details</h2>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <table className="table-auto w-full text-sm text-left border border-gray-200">
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700 w-1/3">First Name</th>
                    <td className="px-4 py-2 text-gray-800">{selectedParent.first_name || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700">Last Name</th>
                    <td className="px-4 py-2 text-gray-800">{selectedParent.last_name || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700">Phone Number</th>
                    <td className="px-4 py-2 text-gray-800">{selectedParent.phone_number || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700">Email</th>
                    <td className="px-4 py-2 text-gray-800">{selectedParent.email || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700">Address</th>
                    <td className="px-4 py-2 text-gray-800">{selectedParent.address || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700">Gender</th>
                    <td className="px-4 py-2 text-gray-800 capitalize">{selectedParent.gender || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700">Date of Birth</th>
                    <td className="px-4 py-2 text-gray-800">{selectedParent.dob || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-700">Children</th>
                    <td className="px-4 py-2 text-gray-800">
                      {selectedParent.linked_students?.length > 0
                        ? selectedParent.linked_students.join(", ")
                        : "None"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex justify-center py-4 border-t">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md transition duration-200"
                onClick={closeViewModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedParent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden max-h-[85vh] border border-gray-200">
            <div className="bg-blue-600 text-white text-center py-4 px-6 border-b">
              <h2 className="text-xl font-bold">👨‍👩‍👧 Edit Parent Profile</h2>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={selectedParent.username || ""}
                  onChange={(e) => setSelectedParent({ ...selectedParent, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={selectedParent.first_name || ""}
                  onChange={(e) => setSelectedParent({ ...selectedParent, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={selectedParent.last_name || ""}
                  onChange={(e) => setSelectedParent({ ...selectedParent, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={selectedParent.phone_number || ""}
                  onChange={(e) => setSelectedParent({ ...selectedParent, phone_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={selectedParent.address || ""}
                  onChange={(e) => setSelectedParent({ ...selectedParent, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={selectedParent.email || ""}
                  onChange={(e) => setSelectedParent({ ...selectedParent, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Select Child(ren)</label>
                <select
                  multiple
                  value={selectedParent.children || []}
                  onChange={(e) =>
                    setSelectedParent({
                      ...selectedParent,
                      children: Array.from(e.target.selectedOptions).map((opt) => opt.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ maxHeight: "150px", overflowY: "auto" }}
                >
                  {students.map((student) => (
                    <option key={student.user_id} value={student.user_id}>
                      {student.first_name} {student.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                <select
                  value={selectedParent.gender || ""}
                  onChange={(e) => setSelectedParent({ ...selectedParent, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={selectedParent.dob || ""}
                  onChange={(e) => setSelectedParent({ ...selectedParent, dob: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                onClick={updateParent}
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

export default ParentAccount;