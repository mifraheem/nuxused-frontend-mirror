import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";

const AccountantProfile = () => {
  const [accountant, setAccountant] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    address: "",
    dob: "",
    gender: "",
  });

  const [isEditing, setIsEditing] = useState(false);
const API = import.meta.env.VITE_SERVER_URL;

  const API_URL = `${API}api/auth/accountant/update-self/`;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = Cookies.get("access_token");
        const response = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAccountant(response.data.data);
      } catch (err) {
        toast.error("Failed to fetch profile");
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setAccountant({ ...accountant, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const token = Cookies.get("access_token");

      const payload = {
        first_name: accountant.first_name,
        last_name: accountant.last_name,
        phone_number: accountant.phone_number,
        address: accountant.address,
        dob: accountant.dob,
        gender: accountant.gender,
      };

      const response = await axios.put(API_URL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
      }
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6 mt-8">
      <Toaster position="top-center" />
      <h1 className="text-2xl font-bold text-blue-900 mb-4">Accountant Profile</h1>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 font-semibold">Username:</label>
          <input
            type="text"
            name="username"
            value={accountant.username}
            disabled
            className="w-full p-2 border border-gray-300 rounded bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold">Email:</label>
          <input
            type="email"
            name="email"
            value={accountant.email}
            disabled
            className="w-full p-2 border border-gray-300 rounded bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold">First Name:</label>
          <input
            type="text"
            name="first_name"
            value={accountant.first_name}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full p-2 border border-gray-300 rounded ${!isEditing ? "bg-gray-100" : ""}`}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold">Last Name:</label>
          <input
            type="text"
            name="last_name"
            value={accountant.last_name}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full p-2 border border-gray-300 rounded ${!isEditing ? "bg-gray-100" : ""}`}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold">Phone Number:</label>
          <input
            type="text"
            name="phone_number"
            value={accountant.phone_number}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full p-2 border border-gray-300 rounded ${!isEditing ? "bg-gray-100" : ""}`}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold">Date of Birth:</label>
          <input
            type="date"
            name="dob"
            value={accountant.dob}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full p-2 border border-gray-300 rounded ${!isEditing ? "bg-gray-100" : ""}`}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold">Gender:</label>
          <select
            name="gender"
            value={accountant.gender}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full p-2 border border-gray-300 rounded ${!isEditing ? "bg-gray-100" : ""}`}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold">Address:</label>
          <input
            type="text"
            name="address"
            value={accountant.address}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full p-2 border border-gray-300 rounded ${!isEditing ? "bg-gray-100" : ""}`}
          />
        </div>
      </div>

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
              onClick={handleSave}
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
  );
};

export default AccountantProfile;
