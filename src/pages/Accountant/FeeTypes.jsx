import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { MdEdit, MdDelete } from "react-icons/md";
import { Buttons } from "../../components";
import Pagination from "../../components/Pagination";

const FeeTypes = () => {
  const [feeTypes, setFeeTypes] = useState([]);
  const [newFeeType, setNewFeeType] = useState({ name: "", description: "" });
  const [editingFeeType, setEditingFeeType] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const API = import.meta.env.VITE_SERVER_URL;

  const API_URL = `${API}fee-types/`;

  const fetchFeeTypes = async () => {
    try {
      const token = Cookies.get("access_token");
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
      toast.error("Failed to fetch fee types.");
    }
  };

  const handleSaveFeeType = async () => {
    if (!newFeeType.name || !newFeeType.description) {
      toast.error("Name and Description are required.");
      return;
    }

    try {
      const token = Cookies.get("access_token");

      if (editingFeeType) {
        const response = await axios.put(
          `${API_URL}${editingFeeType.id}/`,
          newFeeType,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Fee Type updated!");
        setFeeTypes((prev) =>
          prev.map((f) =>
            f.id === editingFeeType.id ? response.data.data : f
          )
        );
      } else {
        const response = await axios.post(API_URL, newFeeType, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Fee Type created!");
        setFeeTypes((prev) => [...prev, response.data.data]);
      }

      setNewFeeType({ name: "", description: "" });
      setEditingFeeType(null);
      setShowForm(false);
    } catch (error) {
      toast.error("Failed to save fee type.");
    }
  };

  const handleDeleteFeeType = async (id) => {
    if (!canDelete) {
      toast.error("You do not have permission to delete fee types.");
      return;
    }

    toast((t) => (
      <div>
        <p>Delete this Fee Type?</p>
        <div className="flex justify-end mt-2">
          <button
            onClick={async () => {
              try {
                const token = Cookies.get("access_token");
                await axios.delete(`${API_URL}${id}/`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Deleted!");
                setFeeTypes((prev) => prev.filter((f) => f.id !== id));
                toast.dismiss(t.id);
              } catch {
                toast.error("Failed to delete.");
              }
            }}
            className="bg-red-500 text-white px-3 py-1 rounded shadow mr-2"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-500 text-white px-3 py-1 rounded shadow"
          >
            No
          </button>
        </div>
      </div>
    ));
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



  const columns = [
    { label: "Name", key: "name" },
    { label: "Description", key: "description" },
  ];

  const [permissions, setPermissions] = useState([]);
  const canAdd = permissions.includes("users.add_feetype");
  const canEdit = permissions.includes("users.change_feetype");
  const canDelete = permissions.includes("users.delete_feetype");
  const canPerformActions = canEdit || canDelete;


  return (
    <div>
      <Toaster position="top-center" />
      <div className="bg-blue-900 text-white py-2 px-6 rounded-md flex justify-between items-center mt-5">
        <h1 className="text-xl font-bold">Manage Fee Types</h1>
        {canAdd && (
          <button
            onClick={() => {
              setShowForm((prev) => !prev);
              setEditingFeeType(null);
              setNewFeeType({ name: "", description: "" });
            }}
            className="flex items-center px-3 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-500 transition"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-black rounded-full mr-3">
              <span className="text-cyan-500 text-xl font-bold">
                {showForm ? "-" : "+"}
              </span>
            </div>
            {showForm ? "Close Form" : "Add Fee Type"}
          </button>
        )}

      </div>

      <div className="p-6">
        {showForm && (
          <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 max-w-xl mx-auto mb-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Optional description"
                  value={newFeeType.description}
                  onChange={(e) => setNewFeeType({ ...newFeeType, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {canAdd || canEdit ? (
              <div className="mt-6 text-right">
                <button
                  onClick={handleSaveFeeType}
                  className="bg-blue-600 hover:bg-blue-800 text-white font-medium px-6 py-2 rounded-md shadow-sm transition duration-150"
                >
                  {editingFeeType ? "Update Fee Type" : "Save Fee Type"}
                </button>
              </div>
            ) : null}
          </div>
        )}


        {feeTypes.length > 0 ? (
          <div className="mt-6">
            <Buttons data={feeTypes} columns={columns} filename="Fee Types" />
            <h2 className="text-lg font-semibold text-white bg-blue-900 px-4 py-2 rounded-t-md">
              Fee Types
            </h2>
            <table className="w-full border-collapse border border-gray-300 bg-white">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-300 p-2">#ID</th>
                  <th className="border border-gray-300 p-2">Name</th>
                  <th className="border border-gray-300 p-2">Description</th>
                  {canPerformActions && (
                    <th className="border border-gray-300 p-2">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {feeTypes.map((f) => (
                  <tr key={f.id}>
                    <td className="border border-gray-300 p-2 text-center">
                      {f.id}
                    </td>
                    <td className="border border-gray-300 p-2">{f.name}</td>
                    <td className="border border-gray-300 p-2">{f.description}</td>
                    {canPerformActions && (
                      <td className="border border-gray-300 p-2 flex justify-center">
                        {canEdit && (
                          <MdEdit
                            onClick={() => handleEditFeeType(f)}
                            className="text-yellow-500 text-2xl cursor-pointer mx-2 hover:text-yellow-700"
                          />
                        )}
                        {canDelete && (
                          <MdDelete
                            onClick={() => handleDeleteFeeType(f.id)}
                            className="text-red-500 text-2xl cursor-pointer mx-2 hover:text-red-700"
                          />
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
           <Pagination
                     currentPage={page}
                     totalPages={totalPages}
                     pageSize={pageSize}
                     onPageChange={(newPage) => {
                       setPage(newPage);
                       fetchData(newPage, pageSize);
                     }}
                     onPageSizeChange={(size) => {
                       setPageSize(size);
                       setPage(1);
                       fetchData(1, size);
                     }}
                     totalItems={feeTypes.length}
                     showPageSizeSelector={true}
                     showPageInfo={true}
                   />
          </div>
        ) : (
          <p className="text-center text-gray-500">No fee types available.</p>
        )}
      </div>
    </div>
  );
};

export default FeeTypes;
