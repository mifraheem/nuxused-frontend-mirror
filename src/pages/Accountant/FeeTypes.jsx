import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdEdit, MdDelete } from "react-icons/md";
import { Buttons } from "../../components";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster";
import TableComponent from "../../components/TableComponent"; // Import reusable TableComponent

const FeeTypes = () => {
  const [feeTypes, setFeeTypes] = useState([]);
  const [newFeeType, setNewFeeType] = useState({ name: "", description: "" });
  const [editingFeeType, setEditingFeeType] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [toaster, setToaster] = useState({ message: "", type: "success", onConfirm: null, onCancel: null });

  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}fee-types/`;

  const showToast = (message, type = "success", onConfirm = null, onCancel = null) => {
    setToaster({ message, type, onConfirm, onCancel });
  };

  const fetchFeeTypes = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error", null, null);
        return;
      }
      const response = await axios.get(`${API_URL}?page=${page}&page_size=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data?.data || {};

      if (Array.isArray(data.results)) {
        setFeeTypes(data.results);
        setTotalPages(data.total_pages || 1);
      } else {
        throw new Error("Unexpected API response format.");
      }
    } catch (error) {
      console.error("Error fetching fee types:", error.response?.data || error.message);
      showToast(
        error.response?.data?.message || "Failed to fetch fee types.",
        "error",
        null,
        null
      );
    }
  };

  const handleSaveFeeType = async () => {
    if (!newFeeType.name || !newFeeType.description) {
      showToast("Name and Description are required.", "error", null, null);
      return;
    }

    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error", null, null);
        return;
      }

      if (editingFeeType) {
        const response = await axios.put(
          `${API_URL}${editingFeeType.id}/`,
          newFeeType,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        showToast("Fee Type updated!", "success", null, null);
        setFeeTypes((prev) =>
          prev.map((f) =>
            f.id === editingFeeType.id ? response.data.data : f
          )
        );
      } else {
        const response = await axios.post(API_URL, newFeeType, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast("Fee Type created!", "success", null, null);
        setFeeTypes((prev) => [...prev, response.data.data]);
      }

      setNewFeeType({ name: "", description: "" });
      setEditingFeeType(null);
      setShowForm(false);
      fetchFeeTypes(); // Refresh to handle pagination
    } catch (error) {
      console.error("Error saving fee type:", error.response?.data || error.message);
      showToast(
        error.response?.data?.message || "Failed to save fee type.",
        "error",
        null,
        null
      );
    }
  };

  const handleDeleteFeeType = (id) => {
    if (!canDelete) {
      showToast("You do not have permission to delete fee types.", "error", null, null);
      return;
    }

    showToast(
      "Delete this Fee Type?",
      "confirmation",
      async () => {
        try {
          const token = Cookies.get("access_token");
          if (!token) {
            showToast("User is not authenticated.", "error", null, null);
            return;
          }
          await axios.delete(`${API_URL}${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showToast("Fee Type deleted successfully!", "success", null, null);
          setFeeTypes((prev) => prev.filter((f) => f.id !== id));
          fetchFeeTypes(); // Refresh to handle pagination
        } catch (error) {
          console.error("Error deleting fee type:", error.response?.data || error.message);
          showToast(
            error.response?.data?.message || "Failed to delete fee type.",
            "error",
            null,
            null
          );
        }
      },
      () => {
        showToast("", "success", null, null); // Clear the toaster
      }
    );
  };

  const handleEditFeeType = (feeType) => {
    setEditingFeeType(feeType);
    setNewFeeType(feeType);
    setShowForm(true);
  };

  useEffect(() => {
    fetchFeeTypes();
    try {
      const perms = JSON.parse(localStorage.getItem("user_permissions") || "[]");
      setPermissions(perms);
    } catch (e) {
      setPermissions([]);
    }
  }, [page, pageSize]);

  const [permissions, setPermissions] = useState([]);
  const canAdd = permissions.includes("users.add_feetype");
  const canEdit = permissions.includes("users.change_feetype");
  const canDelete = permissions.includes("users.delete_feetype");
  const canPerformActions = canEdit || canDelete;

  // Columns for TableComponent
  const columns = [
    {
      key: "index",
      label: "#ID",
      render: (row, index) => (page - 1) * pageSize + index + 1,
    },
    {
      key: "name",
      label: "Name",
      render: (row) => row.name || "N/A",
    },
    {
      key: "description",
      label: "Description",
      render: (row) => row.description || "N/A",
    },
    ...(canPerformActions
      ? [
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex justify-center items-center gap-2">
                {canEdit && (
                  <MdEdit
                    onClick={() => handleEditFeeType(row)}
                    className="text-yellow-500 text-xl cursor-pointer hover:text-yellow-700 transition-colors duration-200"
                    title="Edit Fee Type"
                  />
                )}
                {canDelete && (
                  <MdDelete
                    onClick={() => handleDeleteFeeType(row.id)}
                    className="text-red-500 text-xl cursor-pointer hover:text-red-700 transition-colors duration-200"
                    title="Delete Fee Type"
                  />
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen">
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={3000}
        onClose={() => setToaster({ message: "", type: "success", onConfirm: null, onCancel: null })}
        onConfirm={toaster.onConfirm}
        onCancel={toaster.onCancel}
        allowNoDataErrors={true}
      />
      <div className="bg-gradient-to-r from-blue-900 to-blue-900 text-white py-3 px-6 rounded-xl flex justify-between items-center mt-5 shadow-lg">
        <h1 className="text-xl font-bold">Manage Fee Types</h1>
        {canAdd && (
          <button
            onClick={() => {
              setShowForm((prev) => !prev);
              setEditingFeeType(null);
              setNewFeeType({ name: "", description: "" });
            }}
            className="flex items-center px-3 py-2 bg-cyan-500 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-600 transition-colors duration-200"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-gray-800 rounded-full mr-3">
              <span className="text-cyan-400 text-xl font-bold">
                {showForm ? "-" : "+"}
              </span>
            </div>
            {showForm ? "Close Form" : "Add Fee Type"}
          </button>
        )}
      </div>

      <div className="p-4 sm:p-6">
        {showForm && (
          <div className="p-4 sm:p-6 bg-white rounded-xl shadow-md border border-gray-200 max-w-xl mx-auto mb-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              {editingFeeType ? "Edit Fee Type" : "Create New Fee Type"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Admission Fee"
                  value={newFeeType.name}
                  onChange={(e) => setNewFeeType({ ...newFeeType, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Optional description"
                  value={newFeeType.description}
                  onChange={(e) => setNewFeeType({ ...newFeeType, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            {canAdd || canEdit ? (
              <div className="mt-6 text-right">
                <button
                  onClick={handleSaveFeeType}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-lg shadow-sm transition-colors duration-200"
                >
                  {editingFeeType ? "Update Fee Type" : "Save Fee Type"}
                </button>
              </div>
            ) : null}
          </div>
        )}

        {feeTypes.length > 0 ? (
          <div className="mt-1">
            <div className=" mb-4">
              
              <Buttons
                data={feeTypes}
                columns={[
                  { label: "Name", key: "name" },
                  { label: "Description", key: "description" },
                ]}
                filename="Fee_Types"
              />
            </div>
            <div className="overflow-x-auto">
              <TableComponent
                data={feeTypes}
                columns={columns}
                initialSort={{ key: "name", direction: "asc" }}
              />
            </div>
            {/* <Pagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={(newPage) => {
                setPage(newPage);
                fetchFeeTypes();
              }}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
                fetchFeeTypes();
              }}
              totalItems={feeTypes.length}
              showPageSizeSelector={true}
              showPageInfo={true}
            /> */}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 text-lg font-medium">No fee types available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeeTypes;