import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import baseUrl from "../../lib/apiUrl";
import { Toaster } from "react-hot-toast";


const StaffSalary = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [salary, setSalary] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const API = import.meta.env.VITE_SERVER_URL;

  // ✅ Fetch List of Teachers
  // ✅ Inside fetchTeachers()
  const fetchTeachers = async () => {
    try {
      const token = Cookies.get("access_token");

      if (!token) {
        toast.error("Authentication token missing");
        return;
      }

      const response = await axios.get(`${API}api/auth/users/list_profiles/teacher/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const teacherList = response.data?.data?.results || response.data?.data || [];

      if (Array.isArray(teacherList)) {
        setTeachers(teacherList);
      } else {
        console.warn("Teacher list format unexpected:", response.data);
        setTeachers([]);
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      console.error("❌ Error fetching teachers:", msg);
      toast.error("Failed to fetch teacher details");
    }
  };


  // ✅ Select Teacher for Editing
  const selectTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setSalary(teacher.salary || "0");
    setIsEditModalOpen(true);
  };

  // ✅ Update Salary for Selected Teacher
// ✅ Update Salary for Selected Teacher
const updateSalary = async () => {
  if (!selectedTeacher?.user_id) return;

  try {
    const token = Cookies.get("access_token");
    const apiUrl = `${API}api/auth/update-teacher-profile/${selectedTeacher.user_id}/update/`;

    const updatedData = {
      salary: salary !== "" ? String(salary) : "0",
    };

    const response = await axios.put(apiUrl, updatedData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 200) {
      const wasEmptyBefore = !selectedTeacher.salary || selectedTeacher.salary === "0";
      toast.success(
        wasEmptyBefore ? "Salary added successfully" : "Salary updated successfully"
      );

      // Update local state
      setTeachers((prev) =>
        prev.map((teacher) =>
          teacher.user_id === selectedTeacher.user_id
            ? { ...teacher, salary }
            : teacher
        )
      );

      setIsEditModalOpen(false);
    } else {
      toast.error("⚠️ Unexpected response status: " + response.status);
    }
  } catch (error) {
    console.error("❌ Error updating salary:", error);
    const errMsg =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message;
    toast.error("Failed to update salary: " + errMsg);
  }
};


  

  useEffect(() => {
    fetchTeachers();
  }, []);

  if (teachers.length === 0) {
    return <div className="text-center text-gray-500">Loading teachers...</div>;
  }

  return (
    <div className="p-6">
      <Toaster position="top-center" reverseOrder={false} />

      {/* ✅ Header */}
      <div className="bg-blue-900 text-white px-6 py-4 rounded-md shadow-md">
        <h1 className="text-xl font-bold">Teacher List</h1>
      </div>

      {/* ✅ Teacher List */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {teachers.map((teacher) => (
          <div
            key={teacher.user_id}
            className="bg-white shadow-md rounded-md p-4 border border-gray-200"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600 font-medium">
                  {teacher.first_name} {teacher.last_name}
                </p>
                <p className="text-gray-400 text-sm">
                  Phone: {teacher.phone_number}
                </p>
                <p className="text-gray-400 text-sm">
                  Salary: ₨ {teacher.salary || "N/A"}
                </p>
              </div>
              <button
                onClick={() => selectTeacher(teacher)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Edit Salary
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Edit Modal */}
      {isEditModalOpen && selectedTeacher && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">
              Edit Salary for {selectedTeacher.first_name}{" "}
              {selectedTeacher.last_name}
            </h2>

            {/* Salary Input */}
            <label className="block text-gray-700 font-medium">Salary</label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="border p-2 w-full rounded mt-1"
            />

            {/* Modal Buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={updateSalary}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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

export default StaffSalary;
