import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { MdEdit, MdDelete } from "react-icons/md";
import { Buttons } from '../../components';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState({ room_name: "", room_type: "room" });
  const [editingRoom, setEditingRoom] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const API = import.meta.env.VITE_SERVER_URL;

  const API_URL = `${API}rooms/`;

  const fetchRooms = async (page = 1, size = pageSize) => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
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
      toast.error("Failed to fetch rooms. Please try again.");
    }
  };

  const handleSaveRoom = async () => {
    if (!newRoom.room_name) {
      toast.error("Room name is required!");
      return;
    }

    try {
      const token = Cookies.get("access_token");
      if (!token) {
        toast.error("User is not authenticated.");
        return;
      }

      if (editingRoom) {
        const response = await axios.put(`${API_URL}${editingRoom.id}/`, newRoom, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          toast.success("Room updated successfully!");
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
          toast.success("Room created successfully!");
          setRooms((prev) => [...prev, response.data.data]);
        } else {
          throw new Error("Failed to create room.");
        }
      }

      setNewRoom({ room_name: "", room_type: "room" });
      setShowForm(false);
    } catch (error) {
      console.error("Error saving room:", error.response || error.message);
      toast.error(error.response?.data?.message || "Failed to save room. Please try again.");
    }
  };

  const handleDeleteRoom = async (id) => {
    toast((t) => (
      <div>
        <p className="text-grey-600">Are you sure you want to delete?</p>
        <div className="flex justify-end mt-2">
          <button
            onClick={async () => {
              try {
                const token = Cookies.get("access_token");
                if (!token) {
                  toast.error("User is not authenticated.");
                  return;
                }

                await axios.delete(`${API_URL}${id}/`, {
                  headers: { Authorization: `Bearer ${token}` },
                });

                toast.success("Room deleted successfully!");
                setRooms((prev) => prev.filter((r) => r.id !== id));
                toast.dismiss(t.id);
              } catch (error) {
                console.error("Error deleting room:", error.response || error.message);
                toast.error("Failed to delete room. Please try again.");
              }
            }}
            className="bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-700 mr-2"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-500 text-white px-3 py-1 rounded shadow hover:bg-gray-700"
          >
            No
          </button>
        </div>
      </div>
    ), { duration: 5000 });
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

  const columns = [
    { label: "Room Name", key: "room_name" },
    { label: "Room Type", key: "room_type" },
  ];

  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="bg-blue-900 text-white py-2 px-6 rounded-md flex justify-between items-center mt-5">
        <h1 className="text-xl font-bold">Manage Rooms</h1>
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
      </div>

      <div className="p-6">
        {showForm && (
          <div className="p-6 bg-blue-50 rounded-md mb-6">
            <h2 className="text-lg font-semibold text-blue-900">{editingRoom ? "Edit Room" : "Create Room"}</h2>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <input
                type="text"
                placeholder="Room Name"
                className="p-2 border border-gray-300 rounded w-full"
                value={newRoom.room_name}
                onChange={(e) => setNewRoom({ ...newRoom, room_name: e.target.value })}
              />
              <select
                className="p-2 border border-gray-300 rounded w-full"
                value={newRoom.room_type}
                onChange={(e) => setNewRoom({ ...newRoom, room_type: e.target.value })}
              >
                <option value="room">Room</option>
                <option value="lab">Lab</option>
                <option value="hall">Hall</option>
              </select>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSaveRoom}
                className="bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-700"
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
                  <th className="border border-gray-300 p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id}>
                    <td className="border border-gray-300 p-2 text-center">{room.id}</td>
                    <td className="border border-gray-300 p-2">{room.room_name}</td>
                    <td className="border border-gray-300 p-2 text-center">{room.room_type}</td>
                    <td className="border border-gray-300 p-2 flex justify-center">
                      <MdEdit
                        onClick={() => handleEditRoom(room)}
                        className="text-yellow-500 text-2xl cursor-pointer mx-2 hover:text-yellow-700"
                      />
                      <MdDelete
                        onClick={() => handleDeleteRoom(room.id)}
                        className="text-red-500 text-2xl cursor-pointer mx-2 hover:text-red-700"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500">No rooms available.</p>
        )}

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Page Size:</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              {[5, 10, 25, 50].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
            >
              Prev
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => goToPage(index + 1)}
                className={`px-3 py-1 rounded ${currentPage === index + 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rooms;