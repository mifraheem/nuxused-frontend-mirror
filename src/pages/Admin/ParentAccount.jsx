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

  // Permissions (same pattern as other pages)
  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canView = permissions.includes("users.view_parentprofile");
  const canEdit = permissions.includes("users.change_parentprofile");
  const canDelete =
    permissions.includes("users.delete_parentprofile") &&
    permissions.includes("users.delete_user");

  // ------ Helpers ------
  const isValidId = (id) => {
    if (!id) return false;
    // Accept UUIDs, integers, and numeric strings.
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(String(id)) || !isNaN(id) || typeof id === "string";
  };

  const authHeaders = () => {
    const token = Cookies.get("access_token");
    if (!token) throw new Error("Authentication token missing");
    return { Authorization: `Bearer ${token}` };
  };

  // ------ Data Fetch ------
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
      toast.error(
        "Failed to fetch parent accounts: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

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
      toast.error(
        "Failed to fetch students: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  useEffect(() => {
    fetchParents();
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  // ------ Actions ------
  const openViewModal = (parent) => {
    setSelectedParent(parent);
    setIsViewModalOpen(true);
  };

  const openEditModal = (parent) => {
    // Map names -> user_ids for children so the multiselect holds ids
    const matchedChildren = (parent.linked_students || [])
      .map((name) => {
        const match = students.find(
          (s) => `${s.first_name} ${s.last_name}`.trim() === name
        );
        return match ? match.user_id : null;
      })
      .filter(Boolean);

    setSelectedParent({ ...parent, user_id: parent.user_id, children: matchedChildren });
    setIsEditModalOpen(true);
  };

  const closeViewModal = () => setIsViewModalOpen(false);

  const confirmDeleteParent = (id) => {
    if (!canDelete) {
      toast.error("You do not have permission to delete parent profiles.");
      return;
    }
    if (!isValidId(id)) {
      toast.error("Invalid parent ID format.");
      return;
    }

    toast(
      (t) => (
        <div className="text-center">
          <p className="font-semibold">Delete this parent?</p>
          <div className="flex justify-center mt-2 gap-2">
            <button
              onClick={() => {
                deleteParent(id);
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

  const deleteParent = async (id) => {
    try {
      await axios.delete(`${DELETE_URL}${id}/`, { headers: authHeaders() });
      setParents((prev) => prev.filter((p) => p.user_id != id));
      toast.success("Parent deleted successfully.");
    } catch (error) {
      console.error("Error deleting parent:", error.response?.data || error.message);
      toast.error(
        "Failed to delete parent: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const updateParent = async () => {
    if (!selectedParent?.user_id) {
      toast.error("No parent selected.");
      return;
    }
    if (!isValidId(selectedParent.user_id)) {
      toast.error("Invalid user ID format.");
      return;
    }
    if (!selectedParent.first_name || !selectedParent.last_name) {
      toast.error("First name and last name are required.");
      return;
    }
    if (
      selectedParent.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedParent.email)
    ) {
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
      const apiUrl = `${UPDATE_URL}${selectedParent.user_id}/update-profile/`;
      const payload = {
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

      const response = await axios.patch(apiUrl, payload, {
        headers: { ...authHeaders(), "Content-Type": "application/json" },
      });

      if (response.status === 200) {
        toast.success("Parent updated successfully.");
        setSelectedParent((prev) => ({
          ...prev,
          ...payload,
          linked_students:
            response.data?.data?.linked_students ||
            prev?.linked_students ||
            [],
        }));
        fetchParents();
        setIsEditModalOpen(false);
      } else {
        toast.error("Unexpected response status: " + response.status);
      }
    } catch (error) {
      console.error("Error updating parent:", error.response?.data || error.message);
      const errMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.message;
      if (error.response?.status === 405) {
        toast.error(
          "Server does not allow PATCH requests. Contact backend team to enable PATCH or use another method."
        );
      } else if (error.response?.status === 404) {
        toast.error(
          "Parent profile endpoint not found. Please check the user ID or API configuration."
        );
      } else {
        toast.error("Failed to update parent: " + errMsg);
      }
    }
  };

  // ------ UI ------
  return (
    <div className="p-2 md:p-3">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Header bar (compact, survives narrow widths when sidebar is open) */}
      <div className="bg-blue-900 text-white rounded-md flex items-center justify-between px-2 py-2 mt-2">
        <h1 className="text-sm md:text-base font-bold">Manage Parent Accounts</h1>
        {/* Right area left intentionally blank for future actions to align with WeeklyTaskManager header */}
      </div>

      {/* Export Buttons + Table */}
      <div className="mt-2">
        <div className="  rounded-md  p-2">
          <Buttons
            data={parents.map((p) => ({
              "User ID": p.user_id,
              Username: p.username,
              "First Name": p.first_name,
              "Last Name": p.last_name,
              Email: p.email,
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

          {/* Scroll container ensures layout stays intact even with sidebar open */}
          <div className="overflow-x-auto mt-2">
            <table className="w-full border-collapse border border-gray-300 bg-white min-w-[600px]">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="border border-gray-300 p-1 text-center text-xs">ID</th>
                  <th className="border border-gray-300 p-1 text-center text-xs">Username</th>
                  <th className="border border-gray-300 p-1 text-center text-xs">First Name</th>
                  <th className="border border-gray-300 p-1 text-center text-xs">Last Name</th>
                  <th className="border border-gray-300 p-1 text-center text-xs">Email</th>
                  <th className="border border-gray-300 p-1 text-center text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {parents.length > 0 ? (
                  parents.map((parent) => (
                    <tr key={parent.user_id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-1 text-center text-xs">
                        <span className="inline-block max-w-[120px] truncate" title={parent.user_id}>
                          {parent.user_id}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-1 text-xs">
                        <span className="block max-w-[160px] truncate" title={parent.username}>
                          {parent.username}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-1 text-xs">{parent.first_name}</td>
                      <td className="border border-gray-300 p-1 text-xs">{parent.last_name}</td>
                      <td className="border border-gray-300 p-1 text-xs">
                        <span className="block max-w-[200px] truncate" title={parent.email}>
                          {parent.email}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-1">
                        <div className="flex items-center justify-center gap-2">
                          {canView && (
                            <FiEye
                              className="text-blue-500 cursor-pointer hover:text-blue-700"
                              size={18}
                              onClick={() => openViewModal(parent)}
                              title="View"
                            />
                          )}
                          {canEdit && (
                            <FiEdit
                              className="text-yellow-500 cursor-pointer hover:text-yellow-700"
                              size={18}
                              onClick={() => openEditModal(parent)}
                              title="Edit"
                            />
                          )}
                          {canDelete && (
                            <FiTrash
                              className="text-red-500 cursor-pointer hover:text-red-700"
                              size={18}
                              onClick={() => confirmDeleteParent(parent.user_id)}
                              title="Delete"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="border border-gray-300 p-2 text-center text-gray-500 text-sm"
                    >
                      No parent accounts available.
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-2">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl border border-gray-300 overflow-hidden">
            <div className="px-3 py-2 bg-blue-600 text-white">
              <h2 className="text-sm md:text-base font-bold">Parent Details</h2>
            </div>
            <div className="px-3 py-2 overflow-y-auto max-h-[55vh]">
              <table className="w-full text-xs border border-gray-200">
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <th className="px-2 py-1 text-gray-700 text-left w-1/3">First Name</th>
                    <td className="px-2 py-1">{selectedParent.first_name || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-gray-700 text-left">Last Name</th>
                    <td className="px-2 py-1">{selectedParent.last_name || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-gray-700 text-left">Phone</th>
                    <td className="px-2 py-1">{selectedParent.phone_number || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-gray-700 text-left">Email</th>
                    <td className="px-2 py-1">{selectedParent.email || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-gray-700 text-left">Address</th>
                    <td className="px-2 py-1">{selectedParent.address || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-gray-700 text-left">Gender</th>
                    <td className="px-2 py-1 capitalize">{selectedParent.gender || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-gray-700 text-left">DOB</th>
                    <td className="px-2 py-1">{selectedParent.dob || "N/A"}</td>
                  </tr>
                  <tr>
                    <th className="px-2 py-1 text-gray-700 text-left">Children</th>
                    <td className="px-2 py-1">
                      {selectedParent.linked_students?.length
                        ? selectedParent.linked_students.join(", ")
                        : "None"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex justify-end px-3 py-2 bg-gray-50">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-xs"
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-2">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl border border-gray-300 overflow-hidden">
            <div className="px-3 py-2 bg-blue-600 text-white">
              <h2 className="text-sm md:text-base font-bold">Edit Parent Profile</h2>
            </div>

            <div className="px-3 py-2 overflow-y-auto max-h-[62vh] space-y-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                  Username
                </label>
                <input
                  type="text"
                  value={selectedParent.username || ""}
                  onChange={(e) =>
                    setSelectedParent({ ...selectedParent, username: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={selectedParent.first_name || ""}
                    onChange={(e) =>
                      setSelectedParent({ ...selectedParent, first_name: e.target.value })
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
                    value={selectedParent.last_name || ""}
                    onChange={(e) =>
                      setSelectedParent({ ...selectedParent, last_name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={selectedParent.phone_number || ""}
                    onChange={(e) =>
                      setSelectedParent({
                        ...selectedParent,
                        phone_number: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={selectedParent.email || ""}
                    onChange={(e) =>
                      setSelectedParent({ ...selectedParent, email: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                  Address
                </label>
                <input
                  type="text"
                  value={selectedParent.address || ""}
                  onChange={(e) =>
                    setSelectedParent({ ...selectedParent, address: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                    Gender
                  </label>
                  <select
                    value={selectedParent.gender || ""}
                    onChange={(e) =>
                      setSelectedParent({ ...selectedParent, gender: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={selectedParent.dob || ""}
                    onChange={(e) =>
                      setSelectedParent({ ...selectedParent, dob: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Children multiselect (kept native for simplicity & zero deps) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                  Select Child(ren)
                </label>
                <select
                  multiple
                  value={selectedParent.children || []}
                  onChange={(e) =>
                    setSelectedParent({
                      ...selectedParent,
                      children: Array.from(e.target.selectedOptions).map((opt) => opt.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  style={{ maxHeight: "150px", overflowY: "auto" }}
                >
                  {students.map((s) => (
                    <option key={s.user_id} value={s.user_id}>
                      {(s.first_name || "").trim()} {(s.last_name || "").trim()}
                    </option>
                  ))}
                </select>
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
                onClick={updateParent}
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

export default ParentAccount;
