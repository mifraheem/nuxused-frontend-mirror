import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { MdEdit, MdDelete } from "react-icons/md";
import { Buttons } from "../../components";

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [newClass, setNewClass] = useState({
    class_name: "",
    section: "",
    session: "",
  });
  const [editClass, setEditClass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}classes/`;

  // Fetch classes from the API
  const fetchClasses = async (page = 1, size = pageSize) => {
    setLoading(true);
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }

      const response = await axios.get(`${API_URL}?page=${page}&page_size=${size}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 && Array.isArray(response.data.data.results)) {
        setClasses(response.data.data.results);
        setCurrentPage(response.data.data.current_page);
        setTotalPages(response.data.data.total_pages);
      } else {
        throw new Error("Unexpected API response format.");
      }
    } catch (error) {
      console.error("Error fetching classes:", error.response || error.message);
      toast.error("Failed to fetch classes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchClasses(page, pageSize);
    }
  };

  // Create or Update Class
  const handleSaveClass = async () => {
    if (!newClass.class_name || !newClass.section || !newClass.session) {
      toast.error("All fields are required!");
      return;
    }

    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }

      const url = editClass ? `${API_URL}${editClass.id}/` : API_URL;
      const method = editClass ? "put" : "post";

      const requestData = {
        class_name: newClass.class_name,
        section: newClass.section,
        session: newClass.session,
        students: [],
        is_ended: false
      };

      const response = await axios[method](url, requestData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 201 || response.status === 200) {
        toast.success(`Class ${editClass ? "updated" : "created"} successfully!`);
        fetchClasses();
        setNewClass({ class_name: "", section: "", session: "" });
        setEditClass(null);
        setShowForm(false);
      } else {
        throw new Error("Unexpected server response.");
      }
    } catch (error) {
      console.error("Error saving class:", error.response || error.message);
      toast.error("Failed to save class. Please check your input.");
    }
  };

  const handleDeleteClass = (id) => {
    toast((t) => (
      <div>
        <p className="text-gray-600">Are you sure you want to delete this class?</p>
        <div className="flex justify-end mt-2">
          <button
            onClick={async () => {
              try {
                const token = Cookies.get("access_token");
                if (!token) {
                  toast.error("User is not authenticated.");
                  return;
                }

                await axios.delete(`${API_URL}${id}/`, {
                  headers: { Authorization: `Bearer ${token}` },
                });

                toast.success("Class deleted successfully!");
                fetchClasses(currentPage, pageSize);
                toast.dismiss(t.id);
              } catch (error) {
                console.error("Error deleting class:", error.response || error.message);
                toast.error("Failed to delete class.");
              }
            }}
            className="bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-700 mr-2"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-500 text-white px-3 py-1 rounded shadow hover:bg-gray-700"
          >
            No
          </button>
        </div>
      </div>
    ));
  };

  useEffect(() => {
    fetchClasses(1, pageSize);
  }, [pageSize]);

  const columns = [
    { label: "Class", key: "class_name" },
    { label: "Section", key: "section" },
    { label: "Session", key: "session" },
  ];

  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="bg-blue-900 text-white py-2 px-6 rounded-md flex justify-between items-center mt-5">
        <h1 className="text-xl font-bold">Class Management</h1>
        <button
          onClick={() => {
            setShowForm((prev) => !prev);
            if (showForm) {
              setEditClass(null);
              setNewClass({ class_name: "", section: "", session: "" });
            }
          }}
          className="flex items-center px-3 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-500 transition"
        >
          <div className="flex items-center justify-center w-8 h-8 bg-black rounded-full mr-3">
            <span className="text-cyan-500 text-xl font-bold">{showForm ? "-" : "+"}</span>
          </div>
          {showForm ? "Close Form" : "Add New Class"}
        </button>
      </div>

      <div className="p-6">
        {showForm && (
          <div className="p-6 bg-blue-50 rounded-md mb-6">
            <h2 className="text-lg font-semibold text-blue-900">{editClass ? "Edit Class" : "Create Class"}</h2>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <input
                type="text"
                placeholder="Class Name"
                className="p-2 border border-gray-300 rounded w-full"
                value={newClass.class_name}
                onChange={(e) => setNewClass({ ...newClass, class_name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Section"
                className="p-2 border border-gray-300 rounded w-full"
                value={newClass.section}
                onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
              />
              <input
                type="text"
                placeholder="Session"
                className="p-2 border border-gray-300 rounded w-full"
                value={newClass.session}
                onChange={(e) => setNewClass({ ...newClass, session: e.target.value })}
              />
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSaveClass}
                className="bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-700"
              >
                {editClass ? "Update" : "Save"} Class
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : classes.length > 0 ? (
          <div className="mt-6">
            <Buttons data={classes} columns={columns} filename="Classes" />
            <h2 className="text-lg font-semibold text-white bg-blue-900 px-4 py-2 rounded-t-md">Classes</h2>
            <table className="w-full border-collapse border border-gray-300 bg-white">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-300 p-2">#ID</th>
                  <th className="border border-gray-300 p-2">Class</th>
                  <th className="border border-gray-300 p-2">Section</th>
                  <th className="border border-gray-300 p-2">Session</th>
                  <th className="border border-gray-300 p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => (
                  <tr className="text-center" key={cls.id}>
                    <td className="border border-gray-300 p-2">{cls.id}</td>
                    <td className="border border-gray-300 p-2">{cls.class_name}</td>
                    <td className="border border-gray-300 p-2">{cls.section}</td>
                    <td className="border border-gray-300 p-2">{cls.session}</td>
                    <td className="border border-gray-300 p-2 flex justify-center">
                      <MdEdit
                        onClick={() => {
                          setEditClass(cls);
                          setNewClass({
                            class_name: cls.class_name,
                            section: cls.section,
                            session: cls.session,
                          });
                          setShowForm(true);
                        }}
                        className="text-yellow-500 text-2xl cursor-pointer mx-2 hover:text-yellow-700"
                      />
                      <MdDelete
                        onClick={() => handleDeleteClass(cls.id)}
                        className="text-red-500 text-2xl cursor-pointer mx-2 hover:text-red-700"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Page Size:</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="border rounded px-2 py-1"
                >
                  {[5, 10, 25, 50].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
                >Prev</button>
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToPage(index + 1)}
                    className={`px-3 py-1 rounded ${currentPage === index + 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                  >{index + 1}</button>
                ))}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
                >Next</button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">No classes available.</p>
        )}
      </div>
    </div>
  );
};

export default ClassManagement;