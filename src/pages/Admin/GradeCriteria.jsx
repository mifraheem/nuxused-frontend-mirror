import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdEdit, MdDelete } from "react-icons/md";
import { Buttons } from "../../components";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster"; // Import custom Toaster component

const GradeCriteria = () => {
  const [gradeCriteria, setGradeCriteria] = useState([]);
  const [schools, setSchools] = useState([]);
  const [newGradeCriteria, setNewGradeCriteria] = useState({
    school_name: "",
    grade: "",
    min_percentage: "",
    max_percentage: ""
  });
  const [editingGradeCriteria, setEditingGradeCriteria] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [gradeSearch, setGradeSearch] = useState("");
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [toaster, setToaster] = useState({ message: "", type: "success" });

  const API = import.meta.env.VITE_SERVER_URL ;
  const API_URL = `${API}grade-criteria/`;

  // Toast helper
  const showToast = (message, type = "success") => {
    setToaster({ message, type });
  };

  // Confirmation toast for deletion
  const confirmToast = (message) => {
    return new Promise((resolve) => {
      setToaster({
        message,
        type: "confirmation",
        onConfirm: () => {
          setToaster({ message: "", type: "success" });
          resolve(true);
        },
        onCancel: () => {
          setToaster({ message: "", type: "success" });
          resolve(false);
        },
      });
    });
  };

  const fetchGradeCriteria = async (page = 1, size = pageSize) => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
        return;
      }

      const response = await axios.get(`${API_URL}?page=${page}&page_size=${size}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data.data;

      if (Array.isArray(data.results)) {
        setGradeCriteria(data.results);
        setCurrentPage(data.current_page);
        setTotalPages(data.total_pages);
      } else {
        throw new Error("Unexpected API response format.");
      }
    } catch (error) {
      console.error("Error fetching grade criteria:", error.response || error.message);
      showToast("Failed to fetch grade criteria. Please try again.", "error");
    }
  };

  const fetchSchools = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
        return;
      }

      const response = await axios.get(`${API}classes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const classesData = response.data.data?.results || [];
      const uniqueSchools = [...new Set(classesData.map(cls => cls.school))];
      const schoolsArray = uniqueSchools.map((school, index) => ({
        id: index + 1,
        name: school
      }));

      setSchools(schoolsArray);
    } catch (error) {
      console.error("Error fetching schools:", error.response || error.message);
      showToast("Failed to fetch schools. Please try again.", "error");
      setSchools([]);
    }
  };

  const handleSaveGradeCriteria = async () => {
    if (!newGradeCriteria.school_name || !newGradeCriteria.grade || !newGradeCriteria.min_percentage || !newGradeCriteria.max_percentage) {
      showToast("All fields are required!", "error");
      return;
    }

    const minPerc = parseFloat(newGradeCriteria.min_percentage);
    const maxPerc = parseFloat(newGradeCriteria.max_percentage);

    if (minPerc >= maxPerc) {
      showToast("Minimum percentage must be less than maximum percentage!", "error");
      return;
    }

    if (minPerc < 0 || maxPerc > 100) {
      showToast("Percentage must be between 0 and 100!", "error");
      return;
    }

    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
        return;
      }

      if (editingGradeCriteria) {
        const response = await axios.put(`${API_URL}${editingGradeCriteria.id}/`, newGradeCriteria, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          showToast("Grade criteria updated successfully!", "success");
          setGradeCriteria((prev) => prev.map((g) => (g.id === editingGradeCriteria.id ? response.data.data : g)));
          setEditingGradeCriteria(null);
        } else {
          throw new Error("Failed to update grade criteria.");
        }
      } else {
        const response = await axios.post(API_URL, newGradeCriteria, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 201) {
          showToast("Grade criteria created successfully!", "success");
          setGradeCriteria((prev) => [...prev, response.data.data]);
        } else {
          throw new Error("Failed to create grade criteria.");
        }
      }

      setNewGradeCriteria({ school_name: "", grade: "", min_percentage: "", max_percentage: "" });
      setShowForm(false);
      setSchoolSearch("");
      setGradeSearch("");
    } catch (error) {
      console.error("Error saving grade criteria:", error.response || error.message);
      showToast(error.response?.data?.message || "Failed to save grade criteria. Please try again.", "error");
    }
  };

  const handleDeleteGradeCriteria = async (id) => {
    if (!canDelete) {
      showToast("You do not have permission to delete grade criteria.", "error");
      return;
    }

    const confirmed = await confirmToast("Are you sure you want to delete this grade criteria?");
    if (!confirmed) return;

    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
        return;
      }

      await axios.delete(`${API_URL}${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showToast("Grade criteria deleted successfully!", "success");
      setGradeCriteria((prev) => prev.filter((g) => g.id !== id));
    } catch (error) {
      console.error("Error deleting grade criteria:", error.response || error.message);
      showToast("Failed to delete grade criteria. Please try again.", "error");
    }
  };

  const handleEditGradeCriteria = (gradeCriteria) => {
    setEditingGradeCriteria(gradeCriteria);
    setNewGradeCriteria(gradeCriteria);
    setSchoolSearch(gradeCriteria.school_name || "");
    setGradeSearch(gradeCriteria.grade || "");
    setShowForm(true);
  };

  const handleSchoolSelect = (schoolName) => {
    setNewGradeCriteria({ ...newGradeCriteria, school_name: schoolName });
    setSchoolSearch(schoolName);
    setShowSchoolDropdown(false);
  };

  const handleGradeSelect = (grade) => {
    setNewGradeCriteria({ ...newGradeCriteria, grade: grade });
    setGradeSearch(grade);
    setShowGradeDropdown(false);
  };

  const filteredSchools = schools.filter(school =>
    school.name?.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  const gradeOptions = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"];
  const filteredGrades = gradeOptions.filter(grade =>
    grade.toLowerCase().includes(gradeSearch.toLowerCase())
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) fetchGradeCriteria(page, pageSize);
  };

  useEffect(() => {
    fetchGradeCriteria(currentPage, pageSize);
    fetchSchools();
  }, [pageSize]);

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canAdd = permissions.includes("users.add_gradecriteria");
  const canEdit = permissions.includes("users.change_gradecriteria");
  const canDelete = permissions.includes("users.delete_gradecriteria");

  const columns = [
    { label: "Sequence Number", key: "sequence_number" },
    { label: "School Name", key: "school_name" },
    { label: "Grade", key: "grade" },
    { label: "Min Percentage", key: "min_percentage" },
    { label: "Max Percentage", key: "max_percentage" },
  ];

  return (
    <div>
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={3000}
        onClose={() => setToaster({ message: "", type: "success" })}
        onConfirm={toaster.onConfirm}
        onCancel={toaster.onCancel}
      />
      <div className="bg-blue-900 text-white py-2 px-6 rounded-md flex justify-between items-center mt-5">
        <h1 className="text-xl font-bold">Manage Grade Criteria</h1>
        {canAdd && (
          <button
            onClick={() => {
              setShowForm((prev) => !prev);
              setEditingGradeCriteria(null);
              setNewGradeCriteria({ school_name: "", grade: "", min_percentage: "", max_percentage: "" });
              setSchoolSearch("");
              setGradeSearch("");
            }}
            className="flex items-center px-3 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-500 transition"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-black rounded-full mr-3">
              <span className="text-cyan-500 text-xl font-bold">{showForm ? "-" : "+"}</span>
            </div>
            {showForm ? "Close Form" : "Add New Grade Criteria"}
          </button>
        )}
      </div>

      <div className="p-6">
        {canAdd && showForm && (
          <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 max-w-4xl mx-auto mb-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              {editingGradeCriteria ? "Edit Grade Criteria" : "Create New Grade Criteria"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                <input
                  type="text"
                  placeholder="Search and select school..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={schoolSearch}
                  onChange={(e) => {
                    setSchoolSearch(e.target.value);
                    setShowSchoolDropdown(true);
                  }}
                  onFocus={() => setShowSchoolDropdown(true)}
                />
                {showSchoolDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredSchools.length > 0 ? (
                      filteredSchools.map((school) => (
                        <div
                          key={school.id}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleSchoolSelect(school.name || school.school_name)}
                        >
                          {school.name || school.school_name}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500">No schools found</div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <input
                  type="text"
                  placeholder="Search and select grade..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={gradeSearch}
                  onChange={(e) => {
                    setGradeSearch(e.target.value);
                    setShowGradeDropdown(true);
                  }}
                  onFocus={() => setShowGradeDropdown(true)}
                />
                {showGradeDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredGrades.length > 0 ? (
                      filteredGrades.map((grade) => (
                        <div
                          key={grade}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleGradeSelect(grade)}
                        >
                          {grade}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500">No grades found</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Percentage</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g. 80.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={newGradeCriteria.min_percentage}
                  onChange={(e) => setNewGradeCriteria({ ...newGradeCriteria, min_percentage: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Percentage</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g. 90.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={newGradeCriteria.max_percentage}
                  onChange={(e) => setNewGradeCriteria({ ...newGradeCriteria, max_percentage: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={handleSaveGradeCriteria}
                className="bg-blue-600 hover:bg-blue-800 text-white font-medium px-6 py-2 rounded-md shadow-sm transition duration-150"
              >
                {editingGradeCriteria ? "Update Grade Criteria" : "Save Grade Criteria"}
              </button>
            </div>
          </div>
        )}

        {gradeCriteria.length > 0 ? (
          <div className="mt-6">
            <Buttons
              data={gradeCriteria.map((item, index) => ({
                "Sequence Number": (currentPage - 1) * pageSize + index + 1,
                "School Name": item.school_name,
                "Grade": item.grade,
                "Min Percentage": item.min_percentage,
                "Max Percentage": item.max_percentage,
              }))}
              columns={columns}
              filename="Grade_Criteria"
            />
            <h2 className="text-lg font-semibold text-white bg-blue-900 px-4 py-2 rounded-t-md">Grade Criteria</h2>
            <table className="w-full border-collapse border border-gray-300 bg-white">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-300 p-2">No.</th>
                  <th className="border border-gray-300 p-2">School Name</th>
                  <th className="border border-gray-300 p-2">Grade</th>
                  <th className="border border-gray-300 p-2">Min Percentage</th>
                  <th className="border border-gray-300 p-2">Max Percentage</th>
                  {(canEdit || canDelete) && (
                    <th className="border border-gray-300 p-2">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {gradeCriteria.map((criteria, index) => (
                  <tr key={criteria.id}>
                    <td className="border border-gray-300 p-2 text-center">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="border border-gray-300 p-2">{criteria.school_name}</td>
                    <td className="border border-gray-300 p-2 text-center">{criteria.grade}</td>
                    <td className="border border-gray-300 p-2 text-center">{criteria.min_percentage}%</td>
                    <td className="border border-gray-300 p-2 text-center">{criteria.max_percentage}%</td>
                    {(canEdit || canDelete) && (
                      <td className="border border-gray-300 p-2 flex justify-center">
                        {canEdit && (
                          <MdEdit
                            onClick={() => handleEditGradeCriteria(criteria)}
                            className="text-yellow-500 text-2xl cursor-pointer mx-2 hover:text-yellow-700"
                          />
                        )}
                        {canDelete && (
                          <MdDelete
                            onClick={() => handleDeleteGradeCriteria(criteria.id)}
                            className="text-red-500 text-2xl cursor-pointer mx-2 hover:text-red-700"
                          />
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 p-6 bg-gray-50 rounded-lg shadow-md border border-gray-200 max-w-4xl mx-auto text-center">
            <p className="text-gray-500 text-lg font-medium">No grade criteria added yet.</p>
          </div>
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={(page) => {
            setCurrentPage(page);
            fetchGradeCriteria(page, pageSize);
          }}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
            fetchGradeCriteria(1, size);
          }}
          totalItems={gradeCriteria.length}
          showPageSizeSelector={true}
          showPageInfo={true}
        />
      </div>

      {(showSchoolDropdown || showGradeDropdown) && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => {
            setShowSchoolDropdown(false);
            setShowGradeDropdown(false);
          }}
        />
      )}
    </div>
  );
};

export default GradeCriteria;