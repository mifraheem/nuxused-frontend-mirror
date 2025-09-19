import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  UserCheck,
  Briefcase,
  Edit2,
  Save,
  X,
  Phone,
  MapPin,
  Calendar,
  Upload,
  Lock,
} from "lucide-react";
import Cookies from "js-cookie";

// Utility function to handle API errors
const handleApiError = (setError, navigate) => (err) => {
  const message =
    err.response?.data?.message ||
    err.message ||
    "An unexpected error occurred. Please try again later.";
  setError(message);
  console.error("API Error:", err);
  if (err.response?.status === 401) {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    Cookies.remove("user_role");
    Cookies.remove("username");
    localStorage.removeItem("user_permissions");
    navigate("/login");
  }
};

// API base URL
const API_BASE_URL = import.meta.env.VITE_SERVER_URL;

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    profile_id: null,
    user_id: "",
    username: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    address: "",
    email: "",
    dob: "",
    gender: "",
    role: "",
    profile_picture: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState(null);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      const accessToken = Cookies.get("access_token");
      if (!accessToken) {
        setError("You are not authenticated. Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}api/auth/users/my-profile/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `HTTP ${res.status}: ${text.startsWith("<!") ? "Received HTML instead of JSON" : text}`
          );
        }

        const data = await res.json();
        console.log("API Response:", data); // Debug log
        if (data.status !== 200) {
          throw new Error(data.message || "Failed to fetch profile");
        }

        setUser({
          profile_id: data.data.profile_id || null,
          user_id: data.data.user_id || "",
          username: data.data.username || "",
          first_name: data.data.first_name || "",
          last_name: data.data.last_name || "",
          phone_number: data.data.phone_number || "",
          address: data.data.address || "",
          email: data.data.email || "",
          dob: data.data.dob || "",
          gender: data.data.gender || "",
          role: data.data.role || "",
          profile_picture: data.data.profile_picture || "https://via.placeholder.com/150",
        });
      } catch (err) {
        handleApiError(setError, navigate)(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  // Handle input changes for profile form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  // Handle profile picture upload
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser((prev) => ({ ...prev, profile_picture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle password input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle profile form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const accessToken = Cookies.get("access_token");
    if (!accessToken) {
      setError("You are not authenticated. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("first_name", user.first_name);
      formData.append("last_name", user.last_name);
      formData.append("phone_number", user.phone_number);
      formData.append("address", user.address);
      formData.append("email", user.email);
      formData.append("dob", user.dob);
      formData.append("gender", user.gender);
      formData.append("role", user.role);
      if (profilePictureFile) {
        formData.append("profile_picture", profilePictureFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/users/my-profile/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${text.startsWith("<!") ? "Received HTML instead of JSON" : text}`
        );
      }

      const data = await response.json();
      if (data.status !== 200) {
        throw new Error(data.message || "Failed to update profile");
      }

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setError("");
      setProfilePictureFile(null);
    } catch (err) {
      handleApiError(setError, navigate)(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { current_password, new_password, confirm_password } = passwordData;

    // Client-side validation
    if (!current_password || !new_password || !confirm_password) {
      setError("All password fields are required.");
      return;
    }
    if (new_password !== confirm_password) {
      setError("New password and confirm password do not match.");
      return;
    }
    if (new_password.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    const accessToken = Cookies.get("access_token");
    if (!accessToken) {
      setError("You are not authenticated. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users/change-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          current_password,
          new_password,
          confirm_password,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${text.startsWith("<!") ? "Received HTML instead of JSON" : text}`
        );
      }

      const data = await response.json();
      if (data.status !== 200) {
        throw new Error(data.message || "Failed to change password");
      }

      setSuccess("Password changed successfully!");
      setIsChangingPassword(false);
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
      setError("");
    } catch (err) {
      handleApiError(setError, navigate)(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center px-6 mt-10">
      <div className="w-full max-w-5xl grid md:grid-cols-3 gap-6">
        {/* Left Sidebar Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center sticky top-6 h-fit">
          <div className="relative">
            <img
              src={user.profile_picture || "https://via.placeholder.com/150"}
              alt="Profile"
              className="h-28 w-28 rounded-full border-2 border-blue-600 shadow-md object-cover"
            />
            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer shadow-md">
                <Upload size={14} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureChange}
                  disabled={isLoading}
                />
              </label>
            )}
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-800">
            {user.first_name} {user.last_name}
          </h2>

          <div className="mt-6 flex flex-col gap-2 w-full">
            {isEditing ? (
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
                disabled={isLoading}
              >
                <X size={14} /> Cancel
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm"
                  disabled={isLoading}
                >
                  <Edit2 size={14} /> Edit Profile
                </button>
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm"
                  disabled={isLoading}
                >
                  <Lock size={14} /> Change Password
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Content */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-lg p-6">
          {/* Alerts Section */}
          {error && (
            <div
              className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center gap-2 text-sm"
              role="alert"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div
              className="mb-4 p-3 bg-green-100 text-green-700 rounded-md flex items-center gap-2 text-sm"
              role="alert"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {success}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center mb-4">
              <svg
                className="animate-spin h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}

          {isChangingPassword ? (
            <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 gap-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Change Password
              </h3>
              <div>
                <label className="block text-sm text-gray-600">Current Password</label>
                <input
                  type="password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">New Password</label>
                <input
                  type="password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Confirm Password</label>
                <input
                  type="password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-md bg-green-600 text-white hover:bg-green-700 text-sm"
                  disabled={isLoading}
                >
                  <Save size={14} /> Save Password
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
                  disabled={isLoading}
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            </form>
          ) : isEditing ? (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username */}
              <div>
                <label className="block text-sm text-gray-600">Username</label>
                <input
                  name="username"
                  value={user.username}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md text-sm bg-gray-100 text-gray-500"
                  disabled
                />
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm text-gray-600">First Name</label>
                <input
                  name="first_name"
                  value={user.first_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm text-gray-600">Last Name</label>
                <input
                  name="last_name"
                  value={user.last_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-gray-600">Email</label>
                <input
                  type="email"
                  name="email"
                  value={user.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm text-gray-600">Phone</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={user.phone_number || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600">Address</label>
                <textarea
                  name="address"
                  value={user.address || ""}
                  onChange={handleInputChange}
                  rows="2"
                  className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm text-gray-600">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={user.dob || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm text-gray-600">Gender</label>
                <select
                  name="gender"
                  value={user.gender || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>





              {/* Save Button */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-md bg-green-600 text-white hover:bg-green-700 text-sm"
                  disabled={isLoading}
                >
                  <Save size={14} /> Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Personal Info
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <InfoRow icon={<User />} label="Username" value={user.username} />
                  <InfoRow
                    icon={<User />}
                    label="Full Name"
                    value={`${user.first_name || ""} ${user.last_name || ""}`.trim()}
                  />
                  <InfoRow icon={<Calendar />} label="Date of Birth" value={user.dob} />
                  <InfoRow icon={<UserCheck />} label="Gender" value={user.gender} />
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Contact Info
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <InfoRow icon={<Mail />} label="Email" value={user.email} />
                  <InfoRow icon={<Phone />} label="Phone" value={user.phone_number} />
                  <InfoRow icon={<MapPin />} label="Address" value={user.address} />
                </div>
              </div>

              {/* Account Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Account Info
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <InfoRow icon={<Briefcase />} label="Role" value={user.role} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable InfoRow component
const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <span className="text-blue-600">{icon}</span>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-800">
        {value || "Not specified"}
      </p>
    </div>
  </div>
);

export default ProfilePage;