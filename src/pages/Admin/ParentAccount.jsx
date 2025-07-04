import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { FiTrash, FiEdit, FiEye } from "react-icons/fi";
import { Buttons } from "../../components";

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

  const fetchParents = async () => {
    try {
      const token = Cookies.get("access_token");
      const response = await axios.get(`${API_URL}?page=${currentPage}&page_size=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.data?.results) {
        setParents(response.data.data.results);
        setTotalPages(response.data.data.total_pages);
      }
    } catch (error) {
      toast.error("Failed to fetch parent accounts.");
    }
  };

  const fetchStudents = async () => {
    try {
      const token = Cookies.get("access_token");
      const response = await axios.get(STUDENT_LIST_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.data?.results) {
        setStudents(response.data.data.results);
      }
    } catch (error) {
      toast.error("Failed to fetch students.");
    }
  };

  const confirmDeleteParent = (id) => {
    if (!canDelete) {
      toast.error("🚫 You do not have permission to delete parent profiles.");
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
      await axios.delete(`${API}api/auth/users/${id}/delete_user/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove parent from the current state without refetching
      setParents((prev) => prev.filter((p) => p.user_id !== id));

      toast.success("Parent deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete parent.");
    }
  };


  const openViewModal = (parent) => {
    setSelectedParent(parent);
    setIsViewModalOpen(true);
  };

  const openEditModal = (parent) => {
    const matchedChildren = (parent.linked_students || []).map((name) => {
      const match = students.find((student) => `${student.first_name} ${student.last_name}` === name);
      return match ? match.id : null;
    }).filter(Boolean);

    setSelectedParent({ ...parent, user_id: parent.user_id, children: matchedChildren });
    setIsEditModalOpen(true);
  };

  const closeViewModal = () => setIsViewModalOpen(false);

  const updateParent = async () => {
    try {
      if (!selectedParent?.user_id) {
        toast.error("Invalid parent ID");
        return;
      }
      const token = Cookies.get("access_token");
      const apiUrl = `${UPDATE_URL}${selectedParent.user_id}/`;
      const updatedData = {
        first_name: selectedParent.first_name || "",
        last_name: selectedParent.last_name || "",
        phone_number: selectedParent.phone_number || "",
        address: selectedParent.address || "",
        email: selectedParent.email || "",
        dob: selectedParent.dob || "2000-01-01",
        gender: selectedParent.gender || "Male",
        children: selectedParent.children || [],
      };
      const response = await axios.put(apiUrl, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.status === 200) {
        toast.success("Parent updated successfully.");
        fetchParents();
        setIsEditModalOpen(false);
      } else {
        toast.error("Failed to update parent. Please try again.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update parent.");
    }
  };

  useEffect(() => {
    fetchParents();
    fetchStudents();
  }, [currentPage, pageSize]);

  const handlePageChange = (page) => setCurrentPage(page);
  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  // Get user permissions from localStorage
  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");

  // Permission flags
  const canView = permissions.includes("users.view_parentprofile");
  const canEdit = permissions.includes("users.change_parentprofile");
  const canDelete = permissions.includes("users.delete_parentprofile") && permissions.includes("users.delete_user");


  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <h1 className="bg-blue-900 text-white py-4 px-6 text-xl font-bold">Manage Parent </h1>
      <div className="p-6">
        <Buttons />


        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm bg-white">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="border border-gray-300 px-4 py-2">ID</th>
                <th className="border border-gray-300 px-4 py-2">Username</th>
                <th className="border border-gray-300 px-4 py-2">FirstName</th>
                <th className="border border-gray-300 px-4 py-2">LastName</th>
                <th className="border border-gray-300 px-4 py-2">Email</th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parents.map((parent) => (
                <tr key={parent.id}>
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
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
      {isViewModalOpen && selectedParent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
            {/* ✅ Header */}
            <div className="border-b px-6 py-4 ">
              <h2 className="text-2xl font-bold text-center text-blue-600">
                Parent Details
              </h2>
            </div>

            {/* ✅ Content (Scrollable) */}
            <div className="overflow-y-auto max-h-[55vh] px-6 py-4 space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">First Name:</span>
                <span className="text-gray-600">{selectedParent.first_name || "N/A"}</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">Last Name:</span>
                <span className="text-gray-600">{selectedParent.last_name || "N/A"}</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">Phone Number:</span>
                <span className="text-gray-600">{selectedParent.phone_number || "N/A"}</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">Address:</span>
                <span className="text-gray-600">{selectedParent.address || "N/A"}</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">Email:</span>
                <span className="text-gray-600">{selectedParent.email || "N/A"}</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">Gender:</span>
                <span className="text-gray-600">{selectedParent.gender || "N/A"}</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">Date of Birth:</span>
                <span className="text-gray-600">{selectedParent.dob || "N/A"}</span>
              </div>

              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-700">Children:</span>
                <span className="text-gray-600">
                  {selectedParent.linked_students?.join(", ") || "None"}
                </span>
              </div>
            </div>

            {/* ✅ Footer */}
            <div className="border-t px-6 py-4  flex justify-center">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md shadow-md transition duration-300"
                onClick={closeViewModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ✅ Edit Modal */}
      {isEditModalOpen && selectedParent && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white p-6 rounded-md w-96 max-h-[90vh] overflow-y-auto shadow-lg">
            <h2 className="text-xl font-bold mb-4">Edit Parent</h2>

            {/* First Name */}
            <label className="block text-gray-700 font-medium">First Name</label>
            <input
              type="text"
              value={selectedParent.first_name || ""}
              onChange={(e) =>
                setSelectedParent({ ...selectedParent, first_name: e.target.value })
              }
              className="border w-full p-2 rounded mt-1"
            />

            {/* Last Name */}
            <label className="block text-gray-700 font-medium mt-2">Last Name</label>
            <input
              type="text"
              value={selectedParent.last_name || ""}
              onChange={(e) =>
                setSelectedParent({ ...selectedParent, last_name: e.target.value })
              }
              className="border w-full p-2 rounded mt-1"
            />

            {/* Phone Number */}
            <label className="block text-gray-700 font-medium mt-2">Phone Number</label>
            <input
              type="text"
              value={selectedParent.phone_number || ""}
              onChange={(e) =>
                setSelectedParent({ ...selectedParent, phone_number: e.target.value })
              }
              className="border w-full p-2 rounded mt-1"
            />

            {/* Address */}
            <label className="block text-gray-700 font-medium mt-2">Address</label>
            <input
              type="text"
              value={selectedParent.address || ""}
              onChange={(e) =>
                setSelectedParent({ ...selectedParent, address: e.target.value })
              }
              className="border w-full p-2 rounded mt-1"
            />

            {/* Email */}
            <label className="block text-gray-700 font-medium mt-2">Email</label>
            <input
              type="email"
              value={selectedParent.email || ""}
              onChange={(e) =>
                setSelectedParent({ ...selectedParent, email: e.target.value })
              }
              className="border w-full p-2 rounded mt-1"
            />

            {/* Children (Multi-Select Dropdown) */}
            {/* Children (Multi-Select Dropdown) */}
            <label className="block text-gray-700 font-medium mt-2">
              Select Child(ren)
            </label>
            <div className="relative">
              <select
                multiple
                value={selectedParent.children || []}
                onChange={(e) =>
                  setSelectedParent({
                    ...selectedParent,
                    children: Array.from(e.target.selectedOptions).map((opt) =>
                      parseInt(opt.value) // ✅ Convert to integer
                    ),
                  })
                }
                className="border w-full p-2 rounded mt-1"
                style={{
                  overflowY: "auto",
                  maxHeight: "150px",
                }}
              >
                {students.map((student) => (
                  <option key={student.id} value={student.user_id}>
                    {student.first_name} {student.last_name}
                  </option>
                ))}
              </select>
              <span className="absolute right-2 top-2 text-gray-400 pointer-events-none">
                ▼
              </span>
            </div>




            {/* Gender */}
            <label className="block text-gray-700 font-medium mt-2">Gender</label>
            <select
              value={selectedParent.gender || ""}
              onChange={(e) =>
                setSelectedParent({ ...selectedParent, gender: e.target.value })
              }
              className="border w-full p-2 rounded mt-1"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            {/* Date of Birth */}
            <label className="block text-gray-700 font-medium mt-2">Date of Birth</label>
            <input
              type="date"
              value={selectedParent.dob || ""}
              onChange={(e) =>
                setSelectedParent({ ...selectedParent, dob: e.target.value })
              }
              className="border w-full p-2 rounded mt-1"
            />

            {/* Buttons */}
            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={updateParent}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
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
