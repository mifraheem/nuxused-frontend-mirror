import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";

const Topbar = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState("");
  const [schoolName, setSchoolName] = useState("School Name");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const API = import.meta.env.VITE_SERVER_URL;
  const SCHOOL_API_URL = `${API}api/schools/`;

  const handleLogout = () => {
    Cookies.remove("access_token");
    Cookies.remove("user_context");
    navigate("/login");
  };

  const fetchSchoolName = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        throw new Error("User is not authenticated.");
      }
      const response = await axios.get(SCHOOL_API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data?.data?.results || [];
      if (data.length > 0 && data[0].school_name) {
        setSchoolName(data[0].school_name);
      } else {
        throw new Error("No school data found.");
      }
    } catch (error) {
      console.error("Error fetching school name:", error.response?.data || error.message);
      setError("Failed to fetch school name.");
      setSchoolName("School Name");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchoolName();
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-wrap justify-between items-center bg-blue-100 px-4 py-4 w-full shadow-sm border-b border-blue-200">
      {/* School Name */}
      <div className="w-full sm:w-auto mb-3 sm:mb-0 text-center sm:text-left">
        {isLoading ? (
          <h1 className="text-xl sm:text-2xl font-extrabold text-blue-900 tracking-wide">
            Loading...
          </h1>
        ) : error ? (
          <h1 className="text-xl sm:text-2xl font-extrabold text-red-600 tracking-wide">
            {error}
          </h1>
        ) : (
          <h1 className="text-xl sm:text-2xl font-extrabold text-blue-900 tracking-wide">
            🏫 {schoolName}
          </h1>
        )}
      </div>

      {/* Time + Logout */}
      <div className="flex flex-wrap gap-3 justify-center sm:justify-end items-center w-full sm:w-auto">
        <div className="px-4 py-1.5 rounded-full shadow-md bg-gradient-to-r from-blue-200 to-blue-100 border border-blue-300 text-blue-900 font-semibold text-sm tracking-wide flex items-center gap-2">
          <i className="pi pi-clock text-base text-blue-700"></i>
          <span className="whitespace-nowrap">{currentTime}</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all duration-200"
        >
          <i className="pi pi-sign-out text-base"></i>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Topbar;