import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdEdit } from "react-icons/md";
import Select from "react-select";
import { Buttons } from "../../components";
import Toaster from "../../components/Toaster";
import TableComponent from "../../components/TableComponent"; // Import reusable TableComponent

const PromotionRecords = () => {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [toaster, setToaster] = useState({ message: "", type: "success" });

  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}/promotion-records/`;

  const showToast = (message, type = "success") => {
    setToaster({ message, type });
  };

  const fetchClasses = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
        return;
      }
      const res = await axios.get(`${API}/classes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.data?.results || [];
      setClasses(
        data.map((c) => ({
          value: c.id,
          label: `${c.class_name} - ${c.section} (${c.session})`,
        }))
      );
    } catch (err) {
      showToast("Failed to fetch class options.", "error");
      console.error(err);
    }
  };

  const fetchRecords = async (page = 1, size = pageSize) => {
    try {
      setIsLoading(true);
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
        return;
      }
      const res = await axios.get(`${API_URL}?page=${page}&page_size=${size}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.data;
      setRecords(data.results);
      setCurrentPage(data.current_page);
      setTotalPages(data.total_pages);
    } catch (err) {
      showToast("Failed to fetch promotion records.", "error");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
        return;
      }
      await axios.put(`${API_URL}${selectedRecord.id}/`, selectedRecord, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Promotion record updated.", "success");
      setEditModalOpen(false);
      fetchRecords(currentPage);
    } catch (err) {
      showToast("Update failed.", "error");
      console.error(err);
    }
  };

  const handleInputChange = (field, value) => {
    setSelectedRecord((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    fetchRecords();
    fetchClasses();
  }, [pageSize]);

  // Table columns configuration
  const columns = [
    {
      key: "index",
      label: "ID",
      render: (row, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      key: "student_name",
      label: "Student",
      render: (row) => row.student_name || "N/A",
    },
    {
      key: "from_class_name",
      label: "From Class",
      render: (row) => row.from_class_name || "N/A",
    },
    {
      key: "to_class_name",
      label: "To Class",
      render: (row) => (row.to_class_name.includes("__str__") ? "—" : row.to_class_name || "N/A"),
    },
    {
      key: "exam_term",
      label: "Exam",
      render: (row) => row.exam_term || "N/A",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className="px-1 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          {row.status || "N/A"}
        </span>
      ),
    },
    {
      key: "promoted_on",
      label: "Promoted On",
      render: (row) => row.promoted_on || "N/A",
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <button
          onClick={() => {
            setSelectedRecord(row);
            setEditModalOpen(true);
          }}
          className="text-yellow-500 hover:text-yellow-600"
        >
          <MdEdit size={18} />
        </button>
      ),
    },
  ];

  return (
    <div className="p-2 min-h-screen">
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={3000}
        onClose={() => setToaster({ message: "", type: "success" })}
      />
      <div className="bg-blue-900 rounded-md mb-2">
        <h1 className="text-lg sm:text-xl font-bold text-white py-1 px-2">Student Promotion Records</h1>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-600 text-xs">Loading...</p>
      ) : records.length === 0 ? (
        <p className="text-center text-gray-600 text-xs">No promotion records added yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md">
          <Buttons
            data={records}
            columns={[
              { label: "Student", key: "student_name" },
              { label: "From Class", key: "from_class_name" },
              { label: "To Class", key: "to_class_name" },
              { label: "Exam", key: "exam_term" },
              { label: "Status", key: "status" },
              { label: "Promoted On", key: "promoted_on" },
            ]}
            filename="Promotion_Records"
          />

          <TableComponent
            data={records}
            columns={columns}
            initialSort={{ key: "student_name", direction: "asc" }}
          />

          {/* Pagination controls */}
          {/* <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Page Size:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  fetchRecords(1, Number(e.target.value));
                }}
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
                onClick={() => {
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                    fetchRecords(currentPage - 1, pageSize);
                  }
                }}
                disabled={currentPage === 1}
                className="px-2 py-1 bg-gray-200 rounded text-xs disabled:opacity-50"
              >
                Prev
              </button>
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentPage(idx + 1);
                    fetchRecords(idx + 1, pageSize);
                  }}
                  className={`px-2 py-1 rounded text-xs ${
                    currentPage === idx + 1 ? "bg-blue-600 text-white" : "bg-gray-200"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => {
                  if (currentPage < totalPages) {
                    setCurrentPage(currentPage + 1);
                    fetchRecords(currentPage + 1, pageSize);
                  }
                }}
                disabled={currentPage === totalPages}
                className="px-2 py-1 bg-gray-200 rounded text-xs disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div> */}
        </div>
      )}

      {editModalOpen && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-2">
          <div className="bg-white rounded-md p-3 w-full max-w-md shadow-xl transition-all duration-300">
            <h2 className="text-base sm:text-lg font-bold text-blue-900 mb-3 border-b pb-1">
              ✏️ Edit Promotion Record
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-0.5">Student ID</label>
                <input
                  type="number"
                  value={selectedRecord.student}
                  onChange={(e) => handleInputChange("student", e.target.value)}
                  className="border p-1 w-full rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-0.5">From Class</label>
                <Select
                  value={classes.find((c) => c.value === selectedRecord.from_class)}
                  onChange={(opt) => handleInputChange("from_class", opt.value)}
                  options={classes}
                  placeholder="Select From Class..."
                  isSearchable
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-0.5">To Class</label>
                <Select
                  value={classes.find((c) => c.value === selectedRecord.to_class)}
                  onChange={(opt) => handleInputChange("to_class", opt.value)}
                  options={classes}
                  placeholder="Select To Class..."
                  isSearchable
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-0.5">Exam ID</label>
                <input
                  type="number"
                  value={selectedRecord.exam}
                  onChange={(e) => handleInputChange("exam", e.target.value)}
                  className="border p-1 w-full rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-0.5">Exam Term</label>
                <input
                  type="text"
                  value={selectedRecord.exam_term}
                  onChange={(e) => handleInputChange("exam_term", e.target.value)}
                  className="border p-1 w-full rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-0.5">Status</label>
                <select
                  value={selectedRecord.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="border p-1 w-full rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="promoted">Promoted</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-gray-700 font-medium mb-0.5">Promoted On</label>
                <input
                  type="date"
                  value={selectedRecord.promoted_on}
                  onChange={(e) => handleInputChange("promoted_on", e.target.value)}
                  className="border p-1 w-full rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-3 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-2 py-1 bg-blue-900 text-white rounded text-xs hover:bg-blue-800 transition"
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

export default PromotionRecords;