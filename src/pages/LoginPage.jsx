import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primeicons/primeicons.css";
import image from "/login-image.jpg";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import Cookies from "js-cookie";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const API = import.meta.env.VITE_SERVER_URL;

  // API URL
  const API_URL = `${API}api/auth/login/`;

  const handleLogin = async () => {
  if (!username || !password) {
    toast.error("Username and password are required!");
    return;
  }

  try {
    const response = await axios.post(API_URL, {
      username,
      password,
    });

    const { access, refresh, role: userRole, permissions } = response.data.data;

    if (!permissions || permissions.length === 0) {
      toast.error("You are not authorized to access the system.");
      return;
    }

    // Store tokens and role in cookies
    Cookies.set("access_token", access, { expires: 7, secure: true, sameSite: "Strict" });
    Cookies.set("refresh_token", refresh, { expires: 7, secure: true, sameSite: "Strict" });
    Cookies.set("user_role", userRole, { expires: 7, secure: true, sameSite: "Strict" });
    Cookies.set("username", username, { expires: 7, secure: true, sameSite: "Strict" });

    // Store permissions in localStorage
    localStorage.setItem("user_permissions", JSON.stringify(permissions));

    toast.success("Login successful! Redirecting...");

    // Redirect to a universal dashboard
    setTimeout(() => {
      navigate("/admin"); // or "/home"
    }, 500);
  } catch (err) {
    console.error("Login Error:", err);
    toast.error("Login failed. Please check your credentials.");
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
              />
              <i className="pi pi-lock absolute right-4 top-3 text-gray-400"></i>
            </div>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-blue-950 text-white py-2 px-4 rounded-full text-lg hover:bg-blue-800 transition-all"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
