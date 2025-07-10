import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import toast, { Toaster } from "react-hot-toast";
import Select from "react-select";


const ClassAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [classOptions, setClassOptions] = useState([]);

    const [newAnnouncement, setNewAnnouncement] = useState({
        class_schedule: "",
        title: "",
        description: "",
    });
    const [showForm, setShowForm] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const API = import.meta.env.VITE_SERVER_URL;
    const API_URL = `${API}class-announcements/`;



    const fetchData = async () => {
        setLoading(true);
        try {
            const token = Cookies.get("access_token");
            const res = await axios.get(`${API_URL}?page=${page}&page_size=${pageSize}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAnnouncements(res.data?.data?.results || []);
            setTotalPages(res.data?.data?.total_pages || 1);
        } catch (err) {
            toast.error("Failed to fetch announcements.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdate = async () => {
        if (!newAnnouncement.title || !newAnnouncement.description || !newAnnouncement.class_schedule) {
            toast.error("All fields are required!");
            return;
        }

        try {
            const token = Cookies.get("access_token");
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (editingItem) {
                await axios.put(`${API_URL}${editingItem.id}/`, newAnnouncement, config);
                toast.success("Announcement updated!");
            } else {
                await axios.post(API_URL, newAnnouncement, config);
                toast.success("Announcement created!");
            }

            fetchData();
            setShowForm(false);
            setNewAnnouncement({ class_schedule: "", title: "", description: "" });
            setEditingItem(null);
        } catch (err) {
            toast.error("Operation failed.");
        }
    };

    const handleDelete = async (id) => {
        if (!canDelete) {
            toast.error("No permission to delete.");
            return;
        }

        try {
            const token = Cookies.get("access_token");
            await axios.delete(`${API_URL}${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Announcement deleted.");
            fetchData();
        } catch {
            toast.error("Failed to delete.");
        }
    };

    const fetchClassOptions = async () => {
        try {
            const token = Cookies.get("access_token");
            const res = await axios.get(`${API}classes/?page_size=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setClassOptions(res.data?.data?.results || []);
        } catch (err) {
            toast.error("Failed to load classes.");
        }
    };
    useEffect(() => {
        fetchData();
        fetchClassOptions();
    }, [page, pageSize]);

    const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");

    const canAdd = permissions.includes("users.add_classannouncement");
    const canEdit = permissions.includes("users.change_classannouncement");
    const canDelete = permissions.includes("users.delete_classannouncement");
    const canView = permissions.includes("users.view_classannouncement");

    if (!canView) {
        return (
            <div className="p-6 text-center text-red-600 font-semibold">
                🚫 You do not have permission to view class announcements.
            </div>
        );
    }



    return (
        <div className="p-6">
            <Toaster position="top-center" />
            <div className="flex justify-between items-center bg-blue-900 text-white px-6 py-3 rounded-md">
                <h1 className="text-xl font-bold">Class Announcements</h1>
                {canAdd && (
                    <button
                        onClick={() => {
                            setShowForm((prev) => !prev);
                            setNewAnnouncement({ class_schedule: "", title: "", description: "" });
                            setEditingItem(null);
                        }}
                        className="bg-cyan-400 px-4 py-2 rounded shadow hover:bg-cyan-500"
                    >
                        {showForm ? "Close Form" : "Add Announcement"}
                    </button>
                )}
            </div>

            {showForm && (canAdd || canEdit) && (
                <div className="bg-blue-50 p-6 rounded my-4">
                    <h2 className="text-lg font-semibold mb-4">
                        {editingItem ? "Edit Announcement" : "Create Announcement"}
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            value={classOptions.find((cls) => cls.id === parseInt(newAnnouncement.class_schedule)) || null}
                            onChange={(selected) =>
                                setNewAnnouncement({ ...newAnnouncement, class_schedule: selected?.id || "" })
                            }
                            options={classOptions}
                            getOptionLabel={(cls) => `${cls.class_name} - ${cls.section} (${cls.session})`}
                            getOptionValue={(cls) => cls.id}
                            placeholder="Select Class"
                            isClearable
                            className="p-2 border rounded bg-white"
                        />


                        <input
                            type="text"
                            placeholder="Title"
                            className="p-2 border rounded"
                            value={newAnnouncement.title}
                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                        />
                        <textarea
                            placeholder="Description"
                            className="p-2 border rounded col-span-2"
                            value={newAnnouncement.description}
                            rows={4}
                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, description: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleCreateOrUpdate}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                            {editingItem ? "Update" : "Save"}
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <p>Loading...</p>
            ) : (
                <table className="w-full border mt-6 bg-white">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="p-2 border">ID</th>
                            <th className="p-2 border">Title</th>
                            <th className="p-2 border">Description</th>
                            <th className="p-2 border">Class Schedule</th>
                            {(canEdit || canDelete) && <th className="p-2 border">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {announcements.map((a) => (
                            <tr key={a.id}>
                                <td className="p-2 border">{a.id}</td>
                                <td className="p-2 border">{a.title}</td>
                                <td className="p-2 border">
                                    {a.description.length > 50 ? `${a.description.slice(0, 50)}...` : a.description}
                                </td>
                                <td className="p-2 border">{a.class_schedule}</td>
                                {(canEdit || canDelete) && (
                                    <td className="p-2 border flex gap-2 justify-center">
                                        <MdVisibility
                                            onClick={() => setSelectedItem(a)}
                                            className="text-blue-600 text-2xl cursor-pointer"
                                        />
                                        {canEdit && (
                                            <MdEdit
                                                onClick={() => {
                                                    setEditingItem(a);
                                                    setShowForm(true);
                                                    setNewAnnouncement({
                                                        class_schedule: a.class_schedule,
                                                        title: a.title,
                                                        description: a.description,
                                                    });
                                                }}
                                                className="text-yellow-500 text-2xl cursor-pointer"
                                            />
                                        )}
                                        {canDelete && (
                                            <MdDelete
                                                onClick={() => handleDelete(a.id)}
                                                className="text-red-500 text-2xl cursor-pointer"
                                            />
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-2">
                    <label className="font-semibold">Page Size:</label>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                        }}
                        className="border rounded px-3 py-1"
                    >
                        <option value={1}>1</option>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1 rounded border disabled:opacity-50"
                    >
                        Prev
                    </button>
                    <span className="px-3 py-1 bg-blue-600 text-white rounded">{page}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                        className="px-3 py-1 rounded border disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* View Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white p-6 rounded-lg w-full max-w-lg border shadow">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h2 className="text-xl font-semibold">Announcement Details</h2>
                            <button onClick={() => setSelectedItem(null)}>✖</button>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div>
                                <strong>Title:</strong> {selectedItem.title}
                            </div>
                            <div>
                                <strong>Description:</strong>
                                <div className="bg-gray-50 p-2 border mt-1 rounded">{selectedItem.description}</div>
                            </div>
                            <div>
                                <strong>Class Schedule:</strong> {selectedItem.class_schedule}
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="bg-blue-500 text-white px-4 py-2 rounded"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassAnnouncements;
