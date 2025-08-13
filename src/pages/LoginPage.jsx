import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { ProgressSpinner } from "primereact/progressspinner";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primeicons/primeicons.css";
import image from "/login-image.jpg";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import Cookies from "js-cookie";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // New loading state

  const navigate = useNavigate();

  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}api/auth/login/`;

  const handleLogin = async () => {
    if (!username || !password) {
      toast.error("Username and password are required!");
      return;
    }

    setLoading(true); // Start loader
    try {
      console.log("Attempting login with payload:", { username }); // Debug payload
      const response = await axios.post(API_URL, {
        username,
        password,
      });

      console.log("Login API response:", response.data); // Debug full response

      const { access, refresh, role: userRole, permissions } = response.data.data;

      if (!access || !refresh) {
        toast.error("Invalid token data received from server.");
        setLoading(false); // Stop loader
        return;
      }

      if (!permissions || permissions.length === 0) {
        toast.error("You are not authorized to access the system.");
        setLoading(false); // Stop loader
        return;
      }

      // Store tokens and role in cookies
      Cookies.set("access_token", access, { expires: 7, secure: true, sameSite: "Strict" });
      Cookies.set("refresh_token", refresh, { expires: 7, secure: true, sameSite: "Strict" });
      Cookies.set("user_role", userRole, { expires: 7, secure: true, sameSite: "Strict" });
      Cookies.set("username", username, { expires: 7, secure: true, sameSite: "Strict" });

      // Store permissions in localStorage
      localStorage.setItem("user_permissions", JSON.stringify(permissions));

      // Debug stored data
      console.log("Stored access_token:", Cookies.get("access_token"));
      console.log("Stored user_role:", Cookies.get("user_role"));
      console.log("Stored permissions:", JSON.parse(localStorage.getItem("user_permissions") || "[]"));

      toast.success("Login successful! Redirecting...");

      // Redirect to dashboard
      setTimeout(() => {
        navigate("/admin");
        setLoading(false); // Stop loader after redirect
      }, 500);
    } catch (err) {
      console.error("Login Error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Login failed. Please check your credentials.");
      setLoading(false); // Stop loader on error
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-5 bg-slate-50">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="bg-white rounded-3xl shadow-md p-10 flex flex-col lg:flex-row items-center w-full max-w-4xl">
        <div className="w-full lg:w-1/2 flex justify-center mb-6 lg:mb-0">
          <img src={image} alt="Login illustration" className="w-3/4 max-w-sm" />
        </div>

        <div className="w-full lg:w-1/2">
          <h1 className="text-xl font-extrabold text-center mb-6 text-blue-950">Login</h1>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-medium" htmlFor="username">
              Username or Email
            </label>
            <div className="relative">
              <InputText
                id="username"
                className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Username or Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading} // Disable input during loading
              />
              <i className="pi pi-user absolute right-4 top-3 text-gray-400"></i>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-medium" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <InputText
                id="password"
                className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading} // Disable input during loading
              />
              <i className="pi pi-lock absolute right-4 top-3 text-gray-400"></i>
            </div>
          </div>

          <button
            onClick={handleLogin}
            className={`w-full bg-blue-950 text-white py-2 px-4 rounded-full text-lg transition-all ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-800"
            }`}
            disabled={loading} // Disable button during loading
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <ProgressSpinner style={{ width: "24px", height: "24px" }} strokeWidth="8" fill="transparent" animationDuration=".5s" />
                <span className="ml-2">Logging in...</span>
              </div>
            ) : (
              "Login"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}