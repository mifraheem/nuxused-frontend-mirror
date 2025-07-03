import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import Cookies from "js-cookie";
import Select from "react-select";

export function AdminRegistration() {
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "",
    class_id: "",
    parent_email: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const API = import.meta.env.VITE_SERVER_URL;
  const API_URLS = {
    default: `${API}api/auth/users/register_user/`,
    student: `${API}api/auth/students/register_student/`,
  };

  const handleRegistration = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.email || !formData.password || !formData.role) {
      toast.error("All fields are required!");
      return;
    }

    const API_URL = formData.role === "student" ? API_URLS.student : API_URLS.default;
    const requestData = formData.role === "student" ?
      { username: formData.username, first_name: formData.first_name, last_name: formData.last_name, email: formData.email, password: formData.password, class_id: formData.class_id, parent_email: formData.parent_email } :
      { username: formData.username, first_name: formData.first_name, last_name: formData.last_name, email: formData.email, password: formData.password, role: formData.role };

    try {
      const token = Cookies.get("access_token");
      const response = await axios.post(
        API_URL,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (response.status === 201 || response.status === 200) {
        toast.success("User registered successfully!");
        setFormData({ username: "", first_name: "", last_name: "", email: "", password: "", role: "", class_id: "", parent_email: "" });
        window.dispatchEvent(new Event("update_data"));
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed!");
    }
  };

  const [classOptions, setClassOptions] = useState([]);
  const [parentOptions, setParentOptions] = useState([]);

  useEffect(() => {
    const fetchClassOptions = async () => {
      try {
        const token = Cookies.get("access_token");
        if (!token) {
          toast.error("User is not authenticated.");
          return;
        }

        const response = await axios.get(`${API}classes/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setClassOptions(response.data?.data?.results || [])

      } catch (error) {
        console.error("Failed to fetch classes:", error);
        toast.error("Failed to load classes.");
      }
    };

const fetchParentOptions = async () => {
  try {
    const token = Cookies.get("access_token");
    const response = await axios.get(`${API}api/auth/users/list_profiles/parent/?page_size=1000`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setParentOptions(response.data?.data?.results || []);
  } catch (error) {
    toast.error("Failed to load parents.");
  }
};


    fetchClassOptions();
    fetchParentOptions();
  }, [formData.role]);

  const parentOptionsMapped = parentOptions.map((parent) => ({
    value: parent.email,
    label: parent.email,
  }));
  const fetchParentOptions = async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }

      const response = await axios.get(`${API}api/auth/users/list_profiles/parent/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setParentOptions(response.data?.data || []); // ✅ Fix key reference
    } catch (error) {
      console.error("Failed to fetch parents:", error);
      toast.error("Failed to load parents.");
    }
  };

  return (
    <div>
      <Toaster position="top-right" reverseOrder={false} />
      <h1 className="bg-blue-900 text-white py-4 px-6 text-xl font-bold mt-7">
        Register New User
      </h1>
      <div className="flex flex-col items-center p-6">
        <div className="w-full max-w-3xl bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">Admin - Register New User</h2>
          <form onSubmit={handleRegistration}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold">Username:</label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded" placeholder="Enter username" />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold">Email:</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded" placeholder="Enter email" />
              </div>
              {(formData.role === "teacher" || formData.role === "accountant" || formData.role === "parent" || formData.role === "student") && (
                <>
                  <div>
                    <label className="block text-gray-700 font-semibold">First Name:</label>
                    <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded" placeholder="Enter first name" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold">Last Name:</label>
                    <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded" placeholder="Enter last name" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-gray-700 font-semibold">Password:</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded" placeholder="Enter password" />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold">Select Role:</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">-- Select Role --</option>
                  <option value="admin">Admin</option>
                  <option value="accountant">Accountant</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
              {formData.role === "student" && (
                <>
                  <div>
                    <label className="block text-gray-700 font-semibold">Class:</label>
                    <select
                      name="class_id"
                      value={formData.class_id}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      <option value="">-- Select Class --</option>
                      {Array.isArray(classOptions) &&
                        classOptions?.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.class_name} {" - "}{cls.section}{" - "}{cls.session}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* ✅ Dropdown for Parent Email */}
                  <div className="mt-2">
                    <label className="block text-gray-700 font-semibold mb-1">Parent Email:</label>
                    <Select
                      options={parentOptionsMapped}
                      value={parentOptionsMapped.find(opt => opt.value === formData.parent_email)}
                      onChange={(selectedOption) =>
                        setFormData({ ...formData, parent_email: selectedOption.value })
                      }
                      placeholder="Search and select parent email"
                      className="basic-single"
                      classNamePrefix="select"
                      isSearchable
                    />
                  </div>
                </>
              )}
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md shadow-md hover:bg-blue-700 transition mt-4">
              Register {formData.role}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminRegistration;
