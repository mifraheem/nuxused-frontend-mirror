import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";

const Topbar = ({ onSearch }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation(); // Get current page path

  const handleLogout = () => {
    // Clear cookies (e.g., access token) for logout
    Cookies.remove("access_token");
    Cookies.remove("user_context");

    console.log("User logged out");
    navigate("/login"); // Redirect to login page
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Call the `onSearch` function passed from the parent page
    if (onSearch) {
      onSearch(value, location.pathname); // Pass search term and current page
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const getProfilePath = () => {
    const role = Cookies.get("user_role");
    console.log("🔍 Role from cookie:", role); // debug

    if (!role || role === "undefined") {
      return "/admin/admin-profile"; // fallback
    }

    if (role.toLowerCase() === "accountant") {
      return "/accountant/accountant-profile";
    }

    return "/admin/admin-profile";
  };




  return (
    <div className="flex justify-around items-center bg-blue-100 px-4 pl-96 py-3 w-full">
      {/* Search Bar */}
      <div className="flex items-center">
        <IconField iconPosition="left">
          <InputIcon className="pi pi-search placeholder-slate-100 text-blue-900 text-xl font-bold pb-7 top-3"></InputIcon>
          <InputText
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search anything you want"
            className="px-16 py-2 rounded-3xl text-sm shadow-md"
          />
        </IconField>
      </div>

      {/* Profile Dropdown */}
      <div className="relative inline-block text-left rounded-2xl px-2">
        <button
          type="button"
          onClick={toggleDropdown}
          className="inline-flex justify-center w-full rounded-md border shadow-inner px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          <i className="pi pi-user mr-2"></i> Profile
          <i
            className={`pi ${dropdownOpen ? "pi-chevron-up" : "pi-chevron-down"
              } ml-2`}
          ></i>
        </button>

        {dropdownOpen && (
          <div
            className="origin-top-right absolute right-0 mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="menu-button"
            tabIndex="-1"
          >
            <div className="py-1" role="none">
              <a
                onClick={() => {
                  const path = getProfilePath();
                  console.log("Navigating to:", path); // debug
                  navigate(path);
                }}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                View Profile
              </a>



              <a
                onClick={handleLogout}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                role="menuitem"
                tabIndex="-1"
                id="menu-item-2"
              >
                Logout
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Topbar;
