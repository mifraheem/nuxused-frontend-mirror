import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdEdit, MdDelete } from "react-icons/md";
import Select from "react-select";
import Toaster from "../../components/Toaster";
import { Buttons } from "../../components";
import Pagination from "../../components/Pagination";
import TableComponent from "../../components/TableComponent"; // Import reusable TableComponent

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState({ room_name: "", room_type: "room" });
  const [editingRoom, setEditingRoom] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toaster, setToaster] = useState({ message: "", type: "success", onConfirm: null, onCancel: null });

  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}rooms/`;

  const showToast = (message, type = "success", onConfirm = null, onCancel = null) => {
    setToaster({ message, type, onConfirm, onCancel });
  };

  const fetchRooms = async (page = 1, size = pageSize) => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error", null, null);
        return;
      }

      const response = await axios.get(`${API_URL}?page=${page}&page_size=${size}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data.data;

      if (Array.isArray(data.results)) {
        setRooms(data.results);
        setCurrentPage(data.current_page);
        setTotalPages(data.total_pages);
      } else {
        throw new Error("Unexpected API response format.");
      }
    } catch (error) {
      console.error("Error fetching rooms:", error.response?.data || error.message);
      showToast(
        error.response?.data?.message || "Failed to fetch rooms. Please try again.",
        "error",
        null,
        null
      );
    }
  };

  const handleSaveRoom = async () => {
    if (!newRoom.room_name) {
      showToast("Room name is required!", "error", null, null);
      return;
    }

    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error", null, null);
        return;
      }

      if (editingRoom) {
        const response = await axios.put(`${API_URL}${editingRoom.id}/`, newRoom, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          showToast("Room updated successfully!", "success", null, null);
          setRooms((prev) => prev.map((r) => (r.id === editingRoom.id ? response.data.data : r)));
          setEditingRoom(null);
        } else {
          throw new Error("Failed to update room.");
        }
      } else {
        const response = await axios.post(API_URL, newRoom, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 201) {
          showToast("Room created successfully!", "success", null, null);
          setRooms((prev) => [...prev, response.data.data]);
        } else {
          throw new Error("Failed to create room.");
        }
      }

      setNewRoom({ room_name: "", room_type: "room" });
      setShowForm(false);
    } catch (error) {
      console.error("Error saving room:", error.response?.data || error.message);
      showToast(
        error.response?.data?.message || "Failed to save room. Please try again.",
        "error",
        null,
        null
      );
    }
  };

  const handleDeleteRoom = (id) => {
    if (!canDelete) {
      showToast("You do not have permission to delete rooms.", "error", null, null);
      return;
    }

    showToast(
      "Are you sure you want to delete this room?",
      "confirmation",
      async () => {
        try {
          const token = Cookies.get("access_token");
          if (!token) {
            showToast("User is not authenticated.", "error", null, null);
            return;
          }

          await axios.delete(`${API_URL}${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          showToast("Room deleted successfully!", "success", null, null);
          setRooms((prev) => prev.filter((r) => r.id !== id));
          fetchRooms(currentPage, pageSize);
        } catch (error) {
          console.error("Error deleting room:", error.response?.data || error.message);
          showToast(
            error.response?.data?.message || "Failed to delete room. Please try again.",
            "error",
            null,
            null
          );
        }
      },
      () => {
        showToast("", "success", null, null);
      }
    );
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setNewRoom(room);
    setShowForm(true);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) fetchRooms(page, pageSize);
  };

  useEffect(() => {
    fetchRooms(currentPage, pageSize);
  }, [pageSize]);

  const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
  const canAdd = permissions.includes("users.add_room");
  const canEdit = permissions.includes("users.change_room");
  const canDelete = permissions.includes("users.delete_room");

  // Table columns configuration
  const columns = [
    {
      key: "index",
      label: "#ID",
      render: (row, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      key: "room_name",
      label: "Room Name",
      render: (row) => row.room_name || "N/A",
    },
    {
      key: "room_type",
      label: "Room Type",
      render: (row) => row.room_type || "N/A",
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex justify-center space-x-2">
          {canEdit && (
            <MdEdit
              onClick={() => handleEditRoom(row)}
              className="text-yellow-500 text-2xl cursor-pointer hover:text-yellow-700"
            />
          )}
          {canDelete && (
            <MdDelete
              onClick={() => handleDeleteRoom(row.id)}
              className="text-red-500 text-2xl cursor-pointer hover:text-red-700"
            />
          )}
        </div>
      ),
    },
  ];

  const roomTypeOptions = [
    { value: "room", label: "Room" },
    { value: "lab", label: "Lab" },
    { value: "hall", label: "Hall" },
  ];

  const pageSizeOptions = [
    { value: 5, label: "5" },
    { value: 10, label: "10" },
    { value: 25, label: "25" },
    { value: 50, label: "50" },
  ];

  const selectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: "2rem",
      fontSize: "0.875rem",
      "@media (min-width: 640px)": {
        fontSize: "1rem",
      },
    }),
    menu: (provided) => ({
      ...provided,
      fontSize: "0.875rem",
      maxHeight: "200px",
      overflowY: "auto",
      "@media (min-width: 640px)": {
        fontSize: "1rem",
      },
    }),
    option: (provided) => ({
      ...provided,
      fontSize: "0.875rem",
      padding: "0.5rem",
      "@media (min-width: 640px)": {
        fontSize: "1rem",
        padding: "0.75rem",
      },
    }),
  };

  const paginationSelectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: "1.75rem",
      fontSize: "0.75rem",
      width: "60px",
    }),
    menu: (provided) => ({
      ...provided,
      fontSize: "0.75rem",
      maxHeight: "120px",
      width: "60px",
    }),
    option: (provided) => ({
      ...provided,
      fontSize: "0.75rem",
      padding: "0.25rem 0.5rem",
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: "2px",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
  };

  return (
    <div>
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={3000}
        onClose={() => setToaster({ message: "", type: "success", onConfirm: null, onCancel: null })}
        onConfirm={toaster.onConfirm}
        onCancel={toaster.onCancel}
        allowNoDataErrors={true}
      />
      <div className="bg-blue-900 text-white py-2 px-6 rounded-md flex justify-between items-center mt-5">
        <h1 className="text-xl font-bold">Manage Rooms</h1>
        {canAdd && (
          <button
            onClick={() => {
              setShowForm((prev) => !prev);
              setEditingRoom(null);
              setNewRoom({ room_name: "", room_type: "room" });
            }}
            className="flex items-center px-3 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-500 transition"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-black rounded-full mr-3">
              <span className="text-cyan-500 text-xl font-bold">{showForm ? "-" : "+"}</span>
            </div>
            {showForm ? "Close Form" : "Add New Room"}
          </button>
        )}
      </div>

      <div className="p-6">
        {canAdd && showForm && (
          <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 max-w-xl mx-auto mb-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              {editingRoom ? "Edit Room" : "Create New Room"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                <input
                  type="text"
                  placeholder="e.g. Room A-101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={newRoom.room_name}
                  onChange={(e) => setNewRoom({ ...newRoom, room_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                <Select
                  value={roomTypeOptions.find((option) => option.value === newRoom.room_type)}
                  onChange={(selected) => setNewRoom({ ...newRoom, room_type: selected?.value || "room" })}
                  options={roomTypeOptions}
                  styles={selectStyles}
                  isSearchable={false}
                  placeholder="Select Room Type"
                />
              </div>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={handleSaveRoom}
                className="bg-blue-600 hover:bg-blue-800 text-white font-medium px-6 py-2 rounded-md shadow-sm transition duration-150"
              >
                {editingRoom ? "Update Room" : "Save Room"}
              </button>
            </div>
          </div>
        )}

        {rooms.length > 0 ? (
          <div className="mt-1">
            <Buttons data={rooms} columns={columns.slice(0, -1)} filename="Rooms" />
            <div className="overflow-x-auto">
              <TableComponent
                data={rooms}
                columns={columns}
                initialSort={{ key: "room_name", direction: "asc" }}
              />
            </div>
            
          </div>
        ) : (
          <p className="text-center text-gray-500">No rooms added yet.</p>
        )}
      </div>
    </div>
  );
};

export default Rooms;