import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { MdEdit, MdDelete } from "react-icons/md";
import { Buttons } from '../../components';

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({ subject_name: "", course_code: "" });
  const [editSubject, setEditSubject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const API = import.meta.env.VITE_SERVER_URL;

  const API_URL = `${API}subjects/`;

  const fetchSubjects = async (page = 1, size = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const token = Cookies.get("access_token");
      if (!token) throw new Error("User is not authenticated.");
      const response = await axios.get(`${API_URL}?page=${page}&page_size=${size}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200 && Array.isArray(response.data.data.results)) {
        setSubjects(response.data.data.results);
        setCurrentPage(response.data.data.current_page);
        setTotalPages(response.data.data.total_pages);
      } else {
        throw new Error("Unexpected API response format.");
      }
    } catch (error) {
      console.error("Error fetching subjects:", error.response || error.message);
      setError("Failed to fetch subjects. Please try again later.");
      toast.error("Failed to fetch subjects.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSubject = async () => {
    if (!newSubject.subject_name || !newSubject.course_code) {
      toast.error("All fields are required!");
      return;
    }
    try {
      const token = Cookies.get("access_token");
      if (!token) throw new Error("User is not authenticated.");
      const url = editSubject ? `${API_URL}${editSubject.id}/` : API_URL;
      const method = editSubject ? "put" : "post";
      const response = await axios[method](url, newSubject, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 201 || response.status === 200) {
        toast.success(`Subject ${editSubject ? "updated" : "created"} successfully!`);
        fetchSubjects();
        setNewSubject({ subject_name: "", course_code: "" });
        setEditSubject(null);
        setShowForm(false);
      } else {
        throw new Error("Unexpected server response.");
      }
    } catch (error) {
      console.error("Error saving subject:", error.response || error.message);
      toast.error("Failed to save subject. Please try again.");
    }
  };

  const handleDeleteSubject = (id) => {
    if (!canDelete) {
      toast.error("You do not have permission to delete subjects.");
      return;
    }

    toast((t) => (
      <div>
        <p className="text-gray-600">Are you sure you want to delete this subject?</p>
        <div className="flex justify-end mt-2">
          <button
            onClick={async () => {
              try {
                const token = Cookies.get("access_token");
                if (!token) return toast.error("User is not authenticated.");
                await axios.delete(`${API_URL}${id}/`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Subject deleted successfully!");
                fetchSubjects(currentPage);
                toast.dismiss(t.id);
              } catch (error) {
                console.error("Error deleting subject:", error.response || error.message);
                toast.error("Failed to delete subject.");
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


  useEffect(() => { fetchSubjects(1, pageSize); }, [pageSize]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) fetchSubjects(page, pageSize);
  };

  const columns = [
    { label: "Subject Name", key: "subject_name" },
    { label: "Course Code", key: "course_code" },
  ];

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");

  const canAdd = permissions.includes("users.add_subject");
  const canEdit = permissions.includes("users.change_subject");
  const canDelete = permissions.includes("users.delete_subject");


  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="bg-blue-900 text-white py-2 px-6 rounded-md flex justify-between items-center mt-5">
        <h1 className="text-xl font-bold">Subject Management</h1>
        {canAdd && (
          <button
            onClick={() => {
              setShowForm((prev) => !prev);
              if (showForm) {
                setEditSubject(null);
                setNewSubject({ subject_name: "", course_code: "" });
              }
            }}
            className="flex items-center px-3 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-500 transition"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-black rounded-full mr-3">
              <span className="text-cyan-500 text-xl font-bold">{showForm ? "-" : "+"}</span>
            </div>
            {showForm ? "Close Form" : "Add Subject"}
          </button>
        )}

      </div>

      <div className="p-6">
        {canAdd && showForm && (
          <div className="p-6 bg-blue-50 rounded-md mb-6">
            <h2 className="text-lg font-semibold text-blue-900">{editSubject ? "Edit Subject" : "Create Subject"}</h2>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <input type="text" placeholder="Subject Name" className="p-2 border border-gray-300 rounded w-full" value={newSubject.subject_name} onChange={(e) => setNewSubject({ ...newSubject, subject_name: e.target.value })} />
              <input type="text" placeholder="Course Code" className="p-2 border border-gray-300 rounded w-full" value={newSubject.course_code} onChange={(e) => setNewSubject({ ...newSubject, course_code: e.target.value })} />
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={handleSaveSubject} className="bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-700">{editSubject ? "Update" : "Save"} Subject</button>
            </div>
          </div>
        )}

        {loading ? <p className="text-center text-gray-500">Loading...</p> : error ? <p className="text-center text-red-500">{error}</p> : subjects.length > 0 ? (
          <div className="mt-6">
            <Buttons data={subjects} columns={columns} filename="Subjects" />
            <h2 className="text-lg font-semibold text-white bg-blue-900 px-4 py-2 rounded-t-md">Subjects</h2>
            <table className="w-full border-collapse border border-gray-300 bg-white">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-300 p-2">#ID</th>
                  <th className="border border-gray-300 p-2">Subject Name</th>
                  <th className="border border-gray-300 p-2">Course Code</th>
                  {(canEdit || canDelete) && <th className="border border-gray-300 p-2">Actions</th>}

                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr className="text-center" key={subject.id}>
                    <td className="border border-gray-300 p-2">{subject.id}</td>
                    <td className="border border-gray-300 p-2">{subject.subject_name}</td>
                    <td className="border border-gray-300 p-2">{subject.course_code}</td>
                    {(canEdit || canDelete) &&
                      <td className="border border-gray-300 p-2 flex justify-center">
                        {canEdit && (
                          <MdEdit
                            onClick={() => {
                              setEditSubject(subject);
                              setNewSubject(subject);
                              setShowForm(true);
                            }}
                            className="text-yellow-500 text-2xl cursor-pointer mx-2 hover:text-yellow-700"
                          />
                        )}
                        {canDelete && (
                          <MdDelete
                            onClick={() => handleDeleteSubject(subject.id)}
                            className="text-red-500 text-2xl cursor-pointer mx-2 hover:text-red-700"
                          />
                        )}
                      </td>
                    }
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Page Size:</label>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="border rounded px-2 py-1">
                  {[5, 10, 25, 50].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50">Prev</button>
                {[...Array(totalPages)].map((_, index) => (
                  <button key={index} onClick={() => goToPage(index + 1)} className={`px-3 py-1 rounded ${currentPage === index + 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>{index + 1}</button>
                ))}
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        ) : <p className="text-center text-gray-500">No subjects available.</p>}
      </div>
    </div >
  );
};

export default SubjectManagement;
