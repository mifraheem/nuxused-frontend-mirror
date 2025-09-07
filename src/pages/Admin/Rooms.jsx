import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdEdit, MdDelete } from "react-icons/md";
import Select from "react-select";
import Toaster from "../../components/Toaster"; // Import custom Toaster component
import { Buttons } from '../../components';
import Pagination from "../../components/Pagination";

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState({ room_name: "", room_type: "room" });
  const [editingRoom, setEditingRoom] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toaster, setToaster] = useState({ message: "", type: "success" });
  const [confirmResolve, setConfirmResolve] = useState(null);

  const API = import.meta.env.VITE_SERVER_URL;
  const API_URL = `${API}rooms/`;

  const showToast = (message, type = "success") => {
    setToaster({ message, type });
  };

  const confirmToast = (message = "Are you sure you want to delete?") => {
    return new Promise((resolve) => {
      setConfirmResolve(() => resolve); // Store the resolve function
      setToaster({
        message: (
          <div className="flex flex-col gap-4">
            <p className="text-lg font-medium">{message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setToaster({ message: "", type: "success" });
                  resolve(true);
                }}
                className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
              >
                Yes
              </button>
              <button
                onClick={() => {
                  setToaster({ message: "", type: "success" });
                  resolve(false);
                }}
                className="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
              >
                No
              </button>
            </div>
          </div>
        ),
        type: "confirmation",
      });
    });
  };

  const fetchRooms = async (page = 1, size = pageSize) => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
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
      console.error("Error fetching rooms:", error.response || error.message);
      showToast("Failed to fetch rooms. Please try again.", "error");
    }
  };

  const handleSaveRoom = async () => {
    if (!newRoom.room_name) {
      showToast("Room name is required!", "error");
      return;
    }

    try {
      const token = Cookies.get("access_token");
      if (!token) {
        showToast("User is not authenticated.", "error");
        return;
      }

      if (editingRoom) {
        const response = await axios.put(`${API_URL}${editingRoom.id}/`, newRoom, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          showToast("Room updated successfully!", "success");
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
          showToast("Room created successfully!", "success");
          setRooms((prev) => [...prev, response.data.data]);
        } else {
          throw new Error("Failed to create room.");
        }
      }

      setNewRoom({ room_name: "", room_type: "room" });
      setShowForm(false);
    } catch (error) {
      console.error("Error saving room:", error.response || error.message);
      showToast(error.response?.data?.message || "Failed to save room. Please try again.", "error");
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!canDelete) {
      showToast(
        <div className="text-center font-semibold p-4 bg-red-100 border border-red-400 rounded shadow-md">
          🚫 You do not have permission to delete rooms.
          <div className="mt-3">
            <button
              onClick={() => setToaster({ message: "", type: "success" })}
              className="mt-2 px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>,
        "error"
      );
      return;
    }

    const ok = await confirmToast("Are you sure you want to delete?");
    if (ok) {
      try {
        const token = Cookies.get("access_token");
        if (!token) {
          showToast("User is not authenticated.", "error");
          return;
        }

        await axios.delete(`${API_URL}${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        showToast("Room deleted successfully!", "success");
        setRooms((prev) => prev.filter((r) => r.id !== id));
      } catch (error) {
        console.error("Error deleting room:", error.response || error.message);
        showToast("Failed to delete room. Please try again.", "error");
      }
    }
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

  const columns = [
    { label: "Room Name", key: "room_name" },
    { label: "Room Type", key: "room_type" },
  ];

  const roomTypeOptions = [
    { value: 'room', label: 'Room' },
    { value: 'lab', label: 'Lab' },
    { value: 'hall', label: 'Hall' },
  ];

  const pageSizeOptions = [
    { value: 5, label: '5' },
    { value: 10, label: '10' },
    { value: 25, label: '25' },
    { value: 50, label: '50' },
  ];

  const selectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: '2rem',
      fontSize: '0.875rem',
      '@media (min-width: 640px)': {
        fontSize: '1rem',
      },
    }),
    menu: (provided) => ({
      ...provided,
      fontSize: '0.875rem',
      maxHeight: '200px',
      overflowY: 'auto',
      '@media (min-width: 640px)': {
        fontSize: '1rem',
      },
    }),
    option: (provided) => ({
      ...provided,
      fontSize: '0.875rem',
      padding: '0.5rem',
      '@media (min-width: 640px)': {
        fontSize: '1rem',
        padding: '0.75rem',
      },
    }),
  };

  const paginationSelectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: '1.75rem',
      fontSize: '0.75rem',
      width: '60px',
    }),
    menu: (provided) => ({
      ...provided,
      fontSize: '0.75rem',
      maxHeight: '120px',
      width: '60px',
    }),
    option: (provided) => ({
      ...provided,
      fontSize: '0.75rem',
      padding: '0.25rem 0.5rem',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: '2px',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
  };

  return (
    <div>
      <Toaster
        message={toaster.message}
        type={toaster.type}
        duration={3000}
        onClose={() => setToaster({ message: "", type: "success" })}
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
                  value={roomTypeOptions.find(option => option.value === newRoom.room_type)}
                  onChange={(selected) => setNewRoom({ ...newRoom, room_type: selected?.value || 'room' })}
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
          <div className="mt-6">
            <Buttons data={rooms} columns={columns} filename="Rooms" />
            <h2 className="text-lg font-semibold text-white bg-blue-900 px-4 py-2 rounded-t-md">Rooms</h2>
            <table className="w-full border-collapse border border-gray-300 bg-white">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-300 p-2">#ID</th>
                  <th className="border border-gray-300 p-2">Room Name</th>
                  <th className="border border-gray-300 p-2">Room Type</th>
                  {(canEdit || canDelete) && (
                    <th className="border border-gray-300 p-2">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rooms.map((room, index) => (
                  <tr key={room.id}>
                    <td className="border border-gray-300 p-2 text-center">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="border border-gray-300 p-2">{room.room_name}</td>
                    <td className="border border-gray-300 p-2 text-center">{room.room_type}</td>
                    {(canEdit || canDelete) && (
                      <td className="border border-gray-300 p-2 flex justify-center">
                        {canEdit && (
                          <MdEdit
                            onClick={() => handleEditRoom(room)}
                            className="text-yellow-500 text-2xl cursor-pointer mx-2 hover:text-yellow-700"
                          />
                        )}
                        {canDelete && (
                          <MdDelete
                            onClick={() => handleDeleteRoom(room.id)}
                            className="text-red-500 text-2xl cursor-pointer mx-2 hover:text-red-700"
                          />
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500">No rooms added yet.</p>
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={goToPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
            fetchRooms(1, size);
          }}
          totalItems={rooms.length}
          showPageSizeSelector={true}
          showPageInfo={true}
        />
      </div>
    </div>
  );
};

export default Rooms;