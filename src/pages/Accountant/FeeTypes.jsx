import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { MdEdit, MdDelete } from "react-icons/md";
import { Buttons } from "../../components";

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
  }, [page, pageSize]);

  const columns = [
    { label: "Name", key: "name" },
    { label: "Description", key: "description" },
  ];

  return (
    <div>
      <Toaster position="top-center" />
      <div className="bg-blue-900 text-white py-2 px-6 rounded-md flex justify-between items-center mt-5">
        <h1 className="text-xl font-bold">Manage Fee Types</h1>
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
      </div>

      <div className="p-6">
        {showForm && (
          <div className="p-6 bg-blue-50 rounded-md mb-6">
            <h2 className="text-lg font-semibold text-blue-900">
              {editingFeeType ? "Edit Fee Type" : "Create Fee Type"}
            </h2>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <input
                type="text"
                placeholder="Name"
                value={newFeeType.name}
                onChange={(e) =>
                  setNewFeeType({ ...newFeeType, name: e.target.value })
                }
                className="p-2 border border-gray-300 rounded w-full"
              />
              <input
                type="text"
                placeholder="Description"
                value={newFeeType.description}
                onChange={(e) =>
                  setNewFeeType({ ...newFeeType, description: e.target.value })
                }
                className="p-2 border border-gray-300 rounded w-full"
              />
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSaveFeeType}
                className="bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-700"
              >
                {editingFeeType ? "Update" : "Save"}
              </button>
            </div>
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
                  <th className="border border-gray-300 p-2">Actions</th>
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
                    <td className="border border-gray-300 p-2 flex justify-center">
                      <MdEdit
                        onClick={() => handleEditFeeType(f)}
                        className="text-yellow-500 text-2xl cursor-pointer mx-2 hover:text-yellow-700"
                      />
                      <MdDelete
                        onClick={() => handleDeleteFeeType(f.id)}
                        className="text-red-500 text-2xl cursor-pointer mx-2 hover:text-red-700"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-b-md mt-2">
              {/* Page Size Selector */}
              <div className="flex items-center gap-2">
                <label className="text-gray-700 font-semibold">Page Size:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border rounded-md px-3 py-1"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              {/* Pagination Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className={`px-3 py-1 rounded-md font-semibold ${page === 1
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-white hover:bg-gray-100"
                    }`}
                >
                  Prev
                </button>

                <span className="px-3 py-1 bg-blue-600 text-white font-bold rounded-md">{page}</span>

                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className={`px-3 py-1 rounded-md font-semibold ${page === totalPages
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-white hover:bg-gray-100"
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">No fee types available.</p>
        )}
      </div>
    </div>
  );
};

export default FeeTypes;
