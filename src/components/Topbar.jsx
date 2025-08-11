import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const Topbar = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState("");

  const handleLogout = () => {
    Cookies.remove("access_token");
    Cookies.remove("user_context");
    navigate("/login");
  };

  const userName = Cookies.get("username") || "User";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    else if (hour < 18) return "Good Afternoon";
    else return "Good Evening";
  };

  useEffect(() => {
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
      {/* Greeting */}
      <div className="w-full sm:w-auto mb-3 sm:mb-0 text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-extrabold text-blue-900 tracking-wide">
          👋 {getGreeting()}, <span className="text-blue-800 capitalize">{userName}</span>{" "}
        </h1>
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
