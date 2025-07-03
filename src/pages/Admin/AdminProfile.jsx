import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";

const AdminProfile = () => {
  const [admin, setAdmin] = useState({
    profile_id: null,
    user_id: null,
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    address: "",
    dob: "",
    gender: "",
    profile_picture: null,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const API_URL = "http://127.0.0.1:8000/api/auth/users/list_profiles/admin/";
  const UPDATE_URL = "http://127.0.0.1:8000/api/auth/profile";

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const token = Cookies.get("access_token");
        const response = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const result = response.data?.data?.results?.[0];
        if (result) {
          setAdmin({
            profile_id: result.profile_id,
            user_id: result.user_id,
            username: result.username || "",
            first_name: result.first_name || "",
            last_name: result.last_name || "",
            email: result.email || "",
            phone_number: result.phone_number || "",
            address: result.address || "",
            dob: result.dob || "",
            gender: result.gender || "",
            profile_picture: result.profile_picture || null,
          });
          setPreviewImage(result.profile_picture);
        } else {
          toast.error("Admin profile not found.");
        }
      } catch (err) {
        toast.error("Failed to fetch admin profile.");
      }
    };

    fetchAdminProfile();
  }, []);

  const handleInputChange = (e) => {
    setAdmin({ ...admin, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setAdmin({ ...admin, profile_picture: file });
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    try {
      const token = Cookies.get("access_token");
  
      const formData = new FormData();
      formData.append("first_name", admin.first_name || "");
      formData.append("last_name", admin.last_name || "");
      formData.append("phone_number", admin.phone_number || "");
      formData.append("address", admin.address || "");
      formData.append("dob", admin.dob || "");
      formData.append("gender", admin.gender || "");
  
      if (admin.profile_picture instanceof File) {
        formData.append("profile_picture", admin.profile_picture);
      }
  
      const response = await axios.patch(
        `${UPDATE_URL}/${admin.user_id}/edit_profile/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      if (response.status === 200) {
        toast.success("✅ Profile updated successfully!");
        setIsEditing(false);
      } else {
        toast.error(`⚠️ Unexpected server response: ${response.status}`);
      }
    } catch (err) {
      console.error("❌ Backend error:", err.response?.data || err.message);
      toast.error(
        `❌ Failed to update profile: ${
          err.response?.data?.message || "Invalid input or server error"
        }`
      );
    }
  };
  

  return (
    <div className="flex flex-col items-center p-8">
      <Toaster position="top-center" />
      <div className="w-full max-w-3xl bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">Admin Profile</h2>

        {/* Profile Picture */}
        <div className="flex justify-center mb-6">
          <img
            src={previewImage || "/default-avatar.png"}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border"
          />
        </div>

        {isEditing && (
          <div className="mb-4 text-center">
            <input type="file" accept="image/*" onChange={handleImageChange} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-semibold">Username:</label>
            <input
              type="text"
              name="username"
              value={admin.username}
              disabled
              className="w-full p-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold">Email:</label>
            <input
              type="email"
              name="email"
              value={admin.email}
              disabled
              className="w-full p-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold">First Name:</label>
            <input
              type="text"
              name="first_name"
              value={admin.first_name}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full p-2 border border-gray-300 rounded ${!isEditing ? "bg-gray-100 cursor-not-allowed" : ""}`}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold">Last Name:</label>
            <input
              type="text"
              name="last_name"
              value={admin.last_name}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full p-2 border border-gray-300 rounded ${!isEditing ? "bg-gray-100 cursor-not-allowed" : ""}`}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold">Phone Number:</label>
            <input
              type="text"
              name="phone_number"
              value={admin.phone_number}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full p-2 border border-gray-300 rounded ${!isEditing ? "bg-gray-100 cursor-not-allowed" : ""}`}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold">Date of Birth:</label>
            <input
              type="date"
              name="dob"
              value={admin.dob}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full p-2 border border-gray-300 rounded ${!isEditing ? "bg-gray-100 cursor-not-allowed" : ""}`}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-gray-700 font-semibold">Address:</label>
            <input
              type="text"
              name="address"
              value={admin.address}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full p-2 border border-gray-300 rounded ${!isEditing ? "bg-gray-100 cursor-not-allowed" : ""}`}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-gray-700 font-semibold">Gender:</label>
            <select
              name="gender"
              value={admin.gender}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full p-2 border border-gray-300 rounded ${!isEditing ? "bg-gray-100 cursor-not-allowed" : ""}`}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end mt-6">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md shadow hover:bg-gray-700 mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-700"
              >
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
