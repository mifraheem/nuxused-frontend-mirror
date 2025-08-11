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

  // Role options for the Select component
  const roleOptions = [
    { value: "", label: "-- Select Role --" },
    { value: "admin", label: "Admin" },
    { value: "staff", label: "Staff" },
    { value: "teacher", label: "Teacher" },
    { value: "student", label: "Student" },
    { value: "parent", label: "Parent" },
  ];

  // Custom styles for react-select to make it responsive
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '40px',
      fontSize: '14px',
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
      '&:hover': {
        borderColor: '#9ca3af'
      },
      '@media (max-width: 640px)': {
        fontSize: '16px', // Prevents zoom on iOS
        minHeight: '44px',
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      fontSize: '14px',
      '@media (max-width: 640px)': {
        fontSize: '14px',
      }
    }),
    singleValue: (provided) => ({
      ...provided,
      fontSize: '14px',
      '@media (max-width: 640px)': {
        fontSize: '14px',
      }
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: '14px',
      padding: '8px 12px',
      '@media (max-width: 640px)': {
        fontSize: '14px',
        padding: '10px 12px',
      }
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      '@media (max-width: 640px)': {
        fontSize: '14px',
      }
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999,
    })
  };

  const handleRegistration = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.email || !formData.password || !formData.role) {
      toast.error("All fields are required!");
      return;
    }

    const API_URL = formData.role === "student" ? API_URLS.student : API_URLS.default;
    const token = Cookies.get("access_token");

    let requestData;
    let headers;

    if (formData.role === "student" || formData.role === "teacher" || formData.role === "staff") {
      requestData = new FormData();
      requestData.append("username", formData.username);
      requestData.append("first_name", formData.first_name);
      requestData.append("last_name", formData.last_name);
      requestData.append("email", formData.email);
      requestData.append("password", formData.password);
      requestData.append("role", formData.role);
      if (formData.profile_picture) {
        requestData.append("profile_picture", formData.profile_picture);
      }

      if (formData.role === "student") {
        requestData.append("class_id", formData.class_id);
        if (formData.parent_email) {
          requestData.append("parent_email", formData.parent_email);
        }
      }

      headers = {
        "Content-Type": "multipart/form-data",
        Authorization: token ? `Bearer ${token}` : "",
      };
    } else {
      requestData = {
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      headers = {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      };
    }

    try {
      const response = await axios.post(API_URL, requestData, { headers });

      if (response.status === 201 || response.status === 200) {
        toast.success("User registered successfully!");
        setFormData({
          username: "",
          first_name: "",
          last_name: "",
          email: "",
          password: "",
          role: "",
          class_id: "",
          parent_email: "",
          profile_picture: null,
        });
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

        setClassOptions(response.data?.data?.results || []);

      } catch (error) {
        console.error("Failed to fetch classes:", error);
        toast.error("Failed to load classes.");
      }
    };

    const fetchParentOptions = async () => {
      try {
        const token = Cookies.get("access_token");
        if (!token) {
          toast.error("User is not authenticated.");
          return;
        }

        const response = await axios.get(`${API}api/auth/users/list_profiles/parent/?page_size=1000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setParentOptions(response.data?.data?.results || []);
      } catch (error) {
        console.error("Failed to fetch parents:", error);
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

  const classOptionsFormatted = (Array.isArray(classOptions) ? classOptions : []).map(cls => ({
    value: cls.id,
    label: `${cls.class_name} - ${cls.section} - ${cls.session}`
  }));

  return (
    <div className="min-h-screen ">
      <Toaster position="top-right" reverseOrder={false} />
      <h1 className="bg-blue-900 text-white py-3 px-4 sm:py-4 sm:px-6 text-lg sm:text-xl font-bold mt-7 rounded-lg">
        Register New User
      </h1>
      <div className="flex flex-col items-center p-4 sm:p-6">
        <div className="w-full max-w-4xl bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-4 sm:mb-6">
            Admin - Register New User
          </h2>
          <form onSubmit={handleRegistration}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Role Selection - Now using react-select */}
              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-gray-700 font-semibold mb-2">Select Role:</label>
                <Select
                  options={roleOptions.filter(option => option.value !== "")}
                  value={roleOptions.find(opt => opt.value === formData.role) || null}
                  onChange={(selectedOption) => {
                    setFormData({ ...formData, role: selectedOption?.value || "" });
                  }}
                  placeholder="-- Select Role --"
                  styles={customSelectStyles}
                  className="basic-single"
                  classNamePrefix="select"
                  isSearchable={false}
                  isClearable
                  menuPortalTarget={document.body}
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Username:</label>
                <input 
                  type="text" 
                  name="username" 
                  value={formData.username} 
                  onChange={handleChange} 
                  required 
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base" 
                  placeholder="Enter username" 
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Email:</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base" 
                  placeholder="Enter email" 
                />
              </div>

              {/* First Name - Conditional */}
              {(formData.role === "staff" || formData.role === "teacher" || formData.role === "parent" || formData.role === "student") && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">First Name:</label>
                  <input 
                    type="text" 
                    name="first_name" 
                    value={formData.first_name} 
                    onChange={handleChange} 
                    required 
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base" 
                    placeholder="Enter first name" 
                  />
                </div>
              )}

              {/* Last Name - Conditional */}
              {(formData.role === "staff" || formData.role === "teacher" || formData.role === "parent" || formData.role === "student") && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Last Name:</label>
                  <input 
                    type="text" 
                    name="last_name" 
                    value={formData.last_name} 
                    onChange={handleChange} 
                    required 
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base" 
                    placeholder="Enter last name" 
                  />
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Password:</label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base" 
                  placeholder="Enter password" 
                />
              </div>

              {/* Profile Picture - Conditional */}
              {(formData.role === "student" || formData.role === "teacher" || formData.role === "staff") && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Profile Picture:</label>
                  <input
                    type="file"
                    name="profile_picture"
                    accept="image/*"
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={(e) =>
                      setFormData({ ...formData, profile_picture: e.target.files[0] })
                    }
                  />
                </div>
              )}

              {/* Class Selection - Student Only */}
              {formData.role === "student" && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Class:</label>
                  <Select
                    options={classOptionsFormatted}
                    value={classOptionsFormatted.find(opt => opt.value === formData.class_id) || null}
                    onChange={(selectedOption) => {
                      setFormData({ ...formData, class_id: selectedOption?.value || "" });
                    }}
                    isClearable
                    placeholder="-- Select Class --"
                    styles={customSelectStyles}
                    className="basic-single"
                    classNamePrefix="select"
                    menuPortalTarget={document.body}
                  />
                </div>
              )}

              {/* Parent Email - Student Only */}
              {formData.role === "student" && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Parent Email:</label>
                  <Select
                    options={parentOptionsMapped}
                    value={parentOptionsMapped.find(opt => opt.value === formData.parent_email) || null}
                    onChange={(selectedOption) =>
                      setFormData({ ...formData, parent_email: selectedOption ? selectedOption.value : "" })
                    }
                    placeholder="Select parent email (optional)"
                    styles={customSelectStyles}
                    className="basic-single"
                    classNamePrefix="select"
                    isSearchable
                    isClearable
                    menuPortalTarget={document.body}
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-2 sm:py-3 px-4 rounded-md shadow-md hover:bg-blue-700 transition-colors duration-200 mt-6 sm:mt-8 text-sm sm:text-base font-semibold"
            >
              Register {formData.role || "User"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminRegistration;