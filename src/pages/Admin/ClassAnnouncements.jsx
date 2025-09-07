import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import Select from "react-select";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster";

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
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    const [toaster, setToaster] = useState({ message: "", type: "success" });

    const API = import.meta.env.VITE_SERVER_URL;
    const API_URL = `${API}class-announcements/`;

    const showToast = (message, type = "success") => {
        setToaster({ message, type });
        setTimeout(() => setToaster({ message: "", type: "success" }), 3000);
    };

    // 🔹 Fetch classes for class_schedule dropdown
    const fetchClasses = async () => {
        try {
            const token = Cookies.get("access_token");
            if (!token) {
                showToast("No authentication token found.", "error");
                return;
            }
            const res = await axios.get(`${API}classes/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Classes API response:", res.data); // Debug log
            const results = res.data?.results || res.data?.data?.results || [];
            setClassOptions(Array.isArray(results) ? results : []);
        } catch (err) {
            console.error("Fetch classes error:", err.response?.data || err.message);
            showToast("Failed to load classes.", "error");
        }
    };

    // 🔹 Fetch announcements
    const fetchData = async () => {
        setLoading(true);
        try {
            const token = Cookies.get("access_token");
            if (!token) {
                showToast("No authentication token found.", "error");
                setLoading(false);
                return;
            }
            const url = `${API_URL}`;
            console.log("Fetching announcements from:", url); // Debug log
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            console.log("Announcements API response:", res.data); // Debug log
            const results = res.data?.results || [];
            setAnnouncements(Array.isArray(results) ? results : []);
            setTotalPages(res.data?.total_pages || 1);
            setTotalItems(res.data?.total_items || 0);
        } catch (err) {
            console.error("Fetch announcements error:", err.response?.data || err.message);
            showToast(`Failed to fetch announcements: ${err.message}`, "error");
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Create or update announcement
    const handleCreateOrUpdate = async () => {
        if (!newAnnouncement.title || !newAnnouncement.description) {
            showToast("Title and Description are required!", "error");
            return;
        }
        try {
            const token = Cookies.get("access_token");
            if (!token) {
                showToast("No authentication token found.", "error");
                return;
            }
            const config = { headers: { Authorization: `Bearer ${token}` } };
            console.log("Submitting announcement:", newAnnouncement); // Debug log
            if (editingItem) {
                await axios.patch(`${API_URL}${editingItem.uuid}/`, newAnnouncement, config);
                showToast("Announcement updated successfully!", "success");
            } else {
                await axios.post(API_URL, newAnnouncement, config);
                showToast("Announcement created successfully!", "success");
            }
            fetchData();
            setShowForm(false);
            setNewAnnouncement({ class_schedule: "", title: "", description: "" });
            setEditingItem(null);
        } catch (err) {
            console.error("Create/Update error:", err.response?.data || err.message);
            showToast(`Operation failed: ${err.message}`, "error");
        }
    };

    // 🔹 Delete announcement
    const handleDelete = async (uuid) => {
        try {
            const token = Cookies.get("access_token");
            if (!token) {
                showToast("No authentication token found.", "error");
                return;
            }
            await axios.delete(`${API_URL}${uuid}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            showToast("Announcement deleted successfully!", "success");
            fetchData();
        } catch (err) {
            console.error("Delete error:", err.response?.data || err.message);
            showToast(`Failed to delete announcement: ${err.message}`, "error");
        }
    };

    // 🔹 Effects
    useEffect(() => {
        fetchClasses();
        fetchData();
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

    // 🔹 UI
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <Toaster
                message={toaster.message}
                type={toaster.type}
                duration={3000}
                onClose={() => setToaster({ message: "", type: "success" })}
            />

            {/* Header */}
            <div className="flex justify-between items-center bg-blue-900 text-white px-6 py-3 rounded-md shadow-md mb-6">
                <h1 className="text-xl font-bold">Class Announcements</h1>
                {canAdd && (
                    <button
                        onClick={() => {
                            setShowForm((prev) => !prev);
                            setNewAnnouncement({ class_schedule: "", title: "", description: "" });
                            setEditingItem(null);
                        }}
                        className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg shadow-md text-white font-semibold text-sm"
                    >
                        {showForm ? "Close Form" : "Add Announcement"}
                    </button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-lg font-semibold mb-4">
                        {editingItem ? "Edit Announcement" : "Create Announcement"}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Class (optional)
                            </label>
                            <Select
                                value={classOptions.find((cls) => cls.id === newAnnouncement.class_schedule) || null}
                                onChange={(selected) =>
                                    setNewAnnouncement((prev) => ({
                                        ...prev,
                                        class_schedule: selected?.id || "",
                                    }))
                                }
                                options={classOptions}
                                getOptionLabel={(cls) => `${cls.class_name} - ${cls.section} (${cls.session})`}
                                getOptionValue={(cls) => cls.id}
                                placeholder="Select Class"
                                className="w-full"
                                isClearable
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter title"
                                className="p-2 border rounded w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={newAnnouncement.title}
                                onChange={(e) =>
                                    setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                                }
                            />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                placeholder="Enter description"
                                className="p-2 border rounded w-full text-sm h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={newAnnouncement.description}
                                onChange={(e) =>
                                    setNewAnnouncement({ ...newAnnouncement, description: e.target.value })
                                }
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            onClick={() => {
                                setShowForm(false);
                                setEditingItem(null);
                                setNewAnnouncement({ class_schedule: "", title: "", description: "" });
                            }}
                            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateOrUpdate}
                            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 text-sm"
                        >
                            {editingItem ? "Update" : "Save"}
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading announcements...</span>
                </div>
            ) : announcements.length === 0 ? (
                <div className="text-center text-gray-600 py-8">No announcements found.</div>
            ) : (
                <>
                    <h2 className="text-lg font-semibold text-white bg-blue-900 px-4 py-2 rounded-t-md">
                        Announcements ({totalItems} total)
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full bg-white rounded-b-md shadow-md">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3 border-b text-sm font-semibold text-gray-700">S.No</th>
                                    <th className="p-3 border-b text-sm font-semibold text-gray-700">Title</th>
                                    <th className="p-3 border-b text-sm font-semibold text-gray-700">Description</th>
                                    <th className="p-3 border-b text-sm font-semibold text-gray-700">Teacher</th>
                                    <th className="p-3 border-b text-sm font-semibold text-gray-700">School</th>
                                    <th className="p-3 border-b text-sm font-semibold text-gray-700">Created</th>
                                    {(canEdit || canDelete) && (
                                        <th className="p-3 border-b text-sm font-semibold text-gray-700">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {announcements.map((a, index) => (
                                    <tr key={a.uuid} className="hover:bg-gray-50 transition-all duration-150">
                                        <td className="p-3 border-b text-sm text-center">{(page - 1) * pageSize + index + 1}</td>
                                        <td className="p-3 border-b text-sm text-center truncate max-w-[150px]">{a.title}</td>
                                        <td className="p-3 border-b text-sm text-left truncate max-w-[200px]">{a.description}</td>
                                        <td className="p-3 border-b text-sm text-center truncate max-w-[150px]">{a.teacher_name || "N/A"}</td>
                                        <td className="p-3 border-b text-sm text-center truncate max-w-[150px]">{a.school || "N/A"}</td>
                                        <td className="p-3 border-b text-sm text-center truncate max-w-[120px]">
                                            {a.created ? new Date(a.created).toLocaleDateString() : "N/A"}
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="p-3 border-b text-sm text-center">
                                                <div className="flex gap-2 justify-center">
                                                    <MdVisibility
                                                        onClick={() => setSelectedItem(a)}
                                                        className="text-blue-600 cursor-pointer hover:text-blue-800"
                                                        size={20}
                                                        title="View"
                                                    />
                                                    {canEdit && (
                                                        <MdEdit
                                                            onClick={() => {
                                                                setEditingItem(a);
                                                                setShowForm(true);
                                                                setNewAnnouncement({
                                                                    class_schedule: a.class_schedule || "",
                                                                    title: a.title,
                                                                    description: a.description,
                                                                });
                                                            }}
                                                            className="text-yellow-500 cursor-pointer hover:text-yellow-700"
                                                            size={20}
                                                            title="Edit"
                                                        />
                                                    )}
                                                    {canDelete && (
                                                        <MdDelete
                                                            onClick={() => handleDelete(a.uuid)}
                                                            className="text-red-500 cursor-pointer hover:text-red-700"
                                                            size={20}
                                                            title="Delete"
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setPage(1);
                        }}
                        totalItems={totalItems}
                        showPageSizeSelector={true}
                        showPageInfo={true}
                    />
                </>
            )}

            {/* Modal View */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h2 className="text-xl font-bold text-blue-800">📢 Announcement Details</h2>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="text-gray-500 hover:text-red-600 text-lg font-semibold"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="mt-5 space-y-4 text-sm text-gray-700">
                            <p>
                                <b>Title:</b> {selectedItem.title}
                            </p>
                            <p>
                                <b>Description:</b> {selectedItem.description}
                            </p>
                            <p>
                                <b>Teacher:</b> {selectedItem.teacher_name || "N/A"}
                            </p>
                            <p>
                                <b>School:</b> {selectedItem.school || "N/A"}
                            </p>
                            <p>
                                <b>Created:</b>{" "}
                                {selectedItem.created ? new Date(selectedItem.created).toLocaleString() : "N/A"}
                            </p>
                            <p>
                                <b>UUID:</b> {selectedItem.uuid}
                            </p>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 text-sm"
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