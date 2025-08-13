import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";

const StaffSalary = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [salary, setSalary] = useState("");

  const API = import.meta.env.VITE_SERVER_URL;

  const isValidUUID = (str) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const fetchAllProfiles = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("Authentication token missing");
        return;
      }

      const [teacherRes, staffRes] = await Promise.all([
        axios.get(`${API}api/auth/users/list_profiles/teacher/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}api/auth/users/list_profiles/staff/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const teacherList = teacherRes.data?.data?.results || teacherRes.data?.data || [];
      const staffList = staffRes.data?.data?.results || staffRes.data?.data || [];

      const combinedList = [...teacherList, ...staffList];
      console.log("Combined teacher/staff list:", combinedList);
      setTeachers(combinedList);

      if (combinedList.length === 0) {
        toast.error("No teachers or staff found.");
      }
    } catch (error) {
      console.error("❌ Error fetching staff or teacher profiles:", error.response?.data);
      const msg = error.response?.data?.message || error.message;
      toast.error("Failed to fetch staff/teacher profiles: " + msg);
    }
  };

  const updateSalary = async () => {
    if (!selectedTeacher?.user_id) {
      toast.error("No teacher selected.");
      return;
    }

    if (!isValidUUID(selectedTeacher.user_id)) {
      toast.error("Invalid user ID format.");
      return;
    }

    if (salary === "" || isNaN(parseFloat(salary)) || parseFloat(salary) < 0) {
      toast.error("Please enter a valid salary amount.");
      return;
    }

    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("Authentication token missing");
        return;
      }

      const endpointBase = selectedTeacher.role === "teacher" ? "update-teacher-profile" : "staff-profile";
      const apiUrl = `${API}api/auth/${endpointBase}/${selectedTeacher.user_id}/update/`;

      const updatedData = {
        salary: parseFloat(salary).toFixed(2),
      };

      console.log("Updating salary with payload:", updatedData, "to URL:", apiUrl);

      const response = await axios.put(apiUrl, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Update salary response:", response.data);

      if (response.status === 200) {
        const wasEmptyBefore = !selectedTeacher.salary || selectedTeacher.salary === "0" || selectedTeacher.salary === "0.00";
        toast.success(wasEmptyBefore ? "Salary added successfully" : "Salary updated successfully");

        setTeachers((prev) =>
          prev.map((teacher) =>
            teacher.user_id === selectedTeacher.user_id
              ? { ...teacher, salary: parseFloat(salary).toFixed(2) }
              : teacher
          )
        );

        setIsEditModalOpen(false);
        setSelectedTeacher(null);
        setSalary("");
      } else {
        toast.error("⚠️ Unexpected response status: " + response.status);
      }
    } catch (error) {
      console.error("❌ Error updating salary:", error.response?.data);
      const errMsg = error.response?.data?.message || error.response?.data?.error || error.response?.data?.detail || error.message;
      if (error.response?.status === 405 && errMsg.includes("Method \"PUT\" not allowed")) {
        toast.error("Server does not allow PUT requests. Contact backend team to enable PUT method.");
      } else if (error.response?.status === 404) {
        toast.error("Profile endpoint not found. Please check the user ID or API configuration.");
      } else {
        toast.error("Failed to update salary: " + errMsg);
      }
    }
  };

  const openAddSalaryModal = (teacher) => {
    setSelectedTeacher(teacher);
    setIsAdding(true);
    setSalary("");
    setIsEditModalOpen(true);
  };

  const selectTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setIsAdding(false);
    setSalary(teacher.salary || "");
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    fetchAllProfiles();
  }, []);

  if (teachers.length === 0) {
    return <div className="text-center text-gray-500">Loading teachers...</div>;
  }

  return (
    <div className="p-6">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Header */}
      <div className="bg-blue-900 text-white px-6 py-4 rounded-md shadow-md">
        <h1 className="text-xl font-bold">Teacher & Staff Salary Management</h1>
      </div>

      {/* Teacher/Staff List */}
      <div className="mt-6 p-4 bg-white rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-bold text-blue-800 mb-4">Salary Management</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm border">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Role</th>
                <th className="px-4 py-2 border">Phone</th>
                <th className="px-4 py-2 border">Salary</th>
                <th className="px-4 py-2 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.user_id} className="hover:bg-gray-50 transition">
                  <td className="border px-4 py-2 font-medium text-gray-700">
                    {teacher.first_name} {teacher.last_name}
                  </td>
                  <td className="border px-4 py-2 text-gray-600">{teacher.role}</td>
                  <td className="border px-4 py-2 text-gray-600">{teacher.phone_number || "N/A"}</td>
                  <td className="border px-4 py-2 text-gray-600">₨ {teacher.salary || "N/A"}</td>
                  <td className="border px-4 py-2 text-center space-x-2">
                    <button
                      onClick={() => openAddSalaryModal(teacher)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Add Salary
                    </button>
                    <button
                      onClick={() => selectTeacher(teacher)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Edit Salary
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Add Salary Modal */}
      {isEditModalOpen && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-blue-800 mb-4 text-center">
              {isAdding ? "Add Salary" : "Edit Salary"} – {selectedTeacher.first_name} {selectedTeacher.last_name}
            </h2>

            <label className="block text-sm font-medium text-gray-700 mb-1">Salary (₨)</label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 50000"
              min="0"
            />

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedTeacher(null);
                  setSalary("");
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={updateSalary}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm"
              >
                {isAdding ? "Add" : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffSalary;