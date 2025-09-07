import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import Select from "react-select";
import { Buttons } from "../../components";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster"; // Your custom toaster

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
    const [pageSize, setPageSize] = useState(100);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    // Custom Toaster state
    const [toaster, setToaster] = useState({ message: '', type: 'success' });

    const API = import.meta.env.VITE_SERVER_URL;
    const API_URL = `${API}class-announcements/`;

    // Custom toast function
    const showToast = (message, type = 'success') => {
        setToaster({ message, type });
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = Cookies.get("access_token");
            if (!token) {
                showToast("No authentication token found. Please log in again.", "error");
                console.error("No access_token found in Cookies.");
                return;
            }
            console.log("Fetching announcements with URL:", `${API_URL}?page=${page}&page_size=${pageSize}`);
            const res = await axios.get(`${API_URL}?page=${page}&page_size=${pageSize}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Announcements API response:", res.data);
            
            // Handle the API response structure
            const results = res.data?.results || [];
            setAnnouncements(Array.isArray(results) ? results : []);
            setTotalPages(res.data?.total_pages || 1);
            setTotalItems(res.data?.total_items || 0);
            
            if (results.length === 0) {
                console.warn("No announcements found in response.");
                // Don't show toast for empty results on initial load
            }
        } catch (err) {
            console.error("Fetch announcements error:", err.response?.data || err.message);
            showToast(err.response?.data?.message || "Failed to fetch announcements.", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchClassOptions = async () => {
        try {
            const token = Cookies.get("access_token");
            if (!token) {
                showToast("No authentication token found. Please log in again.", "error");
                console.error("No access_token found in Cookies.");
                return;
            }
            console.log("Fetching class options with URL:", `${API}classes/?page_size=100`);
            const res = await axios.get(`${API}classes/?page_size=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const classes = res.data?.data?.results || res.data?.results || [];
            console.log("Class options response:", classes);
            setClassOptions(Array.isArray(classes) ? classes : []);
            if (classes.length === 0) {
                console.warn("No classes found in response.");
                showToast("No classes available to select.", "error");
            }
        } catch (err) {
            console.error("Fetch classes error:", err.response?.data || err.message);
            showToast(err.response?.data?.message || "Failed to load classes.", "error");
        }
    };

    const handleCreateOrUpdate = async () => {
        if (!newAnnouncement.title || !newAnnouncement.description || !newAnnouncement.class_schedule) {
            showToast("All fields are required!", "error");
            return;
        }

        try {
            const token = Cookies.get("access_token");
            const config = { headers: { Authorization: `Bearer ${token}` } };

            console.log("Saving announcement with payload:", newAnnouncement);

            if (editingItem) {
                // Use PATCH for updates and use uuid instead of id
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
            showToast(err.response?.data?.message || "Operation failed.", "error");
        }
    };

    const handleDelete = async (uuid) => {
        if (!canDelete) {
            showToast("You do not have permission to delete announcements.", "error");
            return;
        }

        // Using custom confirmation toast
        showToast(
            {
                message: "Are you sure you want to delete this announcement?",
                type: "confirm",
                onConfirm: async () => {
                    try {
                        const token = Cookies.get("access_token");
                        await axios.delete(`${API_URL}${uuid}/`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        showToast("Announcement deleted successfully!", "success");
                        fetchData();
                    } catch (err) {
                        console.error("Delete error:", err.response?.data || err.message);
                        showToast(err.response?.data?.message || "Failed to delete announcement.", "error");
                    }
                },
                onCancel: () => setToaster({ message: "", type: "success" })
            },
            "confirmation"
        );
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

    // Determine the class ID field based on classOptions structure
    const classIdField = classOptions.length > 0 && classOptions[0].uuid ? "uuid" : "id";

    // Map class_schedule UUID to class name for display
    const getClassName = (classSchedule) => {
        const classOption = classOptions.find((cls) => cls[classIdField] === classSchedule);
        return classOption
            ? `${classOption.class_name || "Unknown"} - ${classOption.section || ""} (${classOption.session || ""})`
            : classSchedule || "N/A";
    };

    // No Announcements Empty State Component
    const NoAnnouncementsMessage = () => (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border-2 border-dashed border-blue-300 mx-2 mt-4">
            <div className="w-24 h-24 mb-6 text-blue-300">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            </div>
            
            <h3 className="text-xl font-bold text-blue-800 mb-2">No Announcements Yet</h3>
            <p className="text-blue-600 mb-4 max-w-md">
                No class announcements have been created yet. Start by adding your first announcement to keep everyone informed!
            </p>
            
            {canAdd && (
                <button
                    onClick={() => {
                        setShowForm(true);
                        setNewAnnouncement({ class_schedule: "", title: "", description: "" });
                        setEditingItem(null);
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
                >
                    <div className="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full mr-2">
                        <span className="text-white text-base font-bold">+</span>
                    </div>
                    Create Your First Announcement
                </button>
            )}
        </div>
    );

    return (
        <div className="p-6">
            {/* Custom Toaster */}
            <Toaster
                message={toaster.message}
                type={toaster.type}
                duration={3000}
                onClose={() => setToaster({ message: "", type: "success" })}
                onConfirm={toaster.onConfirm}
                onCancel={toaster.onCancel}
            />
            
            <div className="flex justify-between items-center bg-blue-900 text-white px-6 py-3 rounded-md">
                <h1 className="text-xl font-bold">Class Announcements</h1>
                {canAdd && (
                    <button
                        onClick={() => {
                            setShowForm((prev) => !prev);
                            setNewAnnouncement({ class_schedule: "", title: "", description: "" });
                            setEditingItem(null);
                        }}
                        className="bg-cyan-400 px-4 py-2 rounded shadow hover:bg-cyan-500 text-xs"
                    >
                        {showForm ? "Close Form" : "Add Announcement"}
                    </button>
                )}
            </div>

            {showForm && (canAdd || canEdit) && (
                <div className="bg-white p-6 rounded-lg shadow-md my-4">
                    <h2 className="text-lg font-semibold mb-4">
                        {editingItem ? "Edit Announcement" : "Create Announcement"}
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                                Class Schedule <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={classOptions.find((cls) => cls[classIdField] === newAnnouncement.class_schedule) || null}
                                onChange={(selected) => {
                                    console.log("Selected class:", selected);
                                    setNewAnnouncement((prev) => {
                                        const updated = { ...prev, class_schedule: selected?.[classIdField] || "" };
                                        console.log("Updated newAnnouncement:", updated);
                                        return updated;
                                    });
                                }}
                                options={classOptions}
                                getOptionLabel={(cls) => `${cls.class_name || "Unknown"} - ${cls.section || ""} (${cls.session || ""})`}
                                getOptionValue={(cls) => cls[classIdField]}
                                placeholder="Select Class"
                                isClearable
                                className="text-xs"
                                classNamePrefix="react-select"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Title"
                                className="p-2 border rounded w-full text-xs"
                                value={newAnnouncement.title}
                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                placeholder="Description"
                                className="p-2 border rounded w-full text-xs"
                                value={newAnnouncement.description}
                                rows={4}
                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, description: e.target.value })}
                            ></textarea>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            onClick={() => {
                                setShowForm(false);
                                setEditingItem(null);
                                setNewAnnouncement({ class_schedule: "", title: "", description: "" });
                            }}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-xs"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateOrUpdate}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-xs"
                        >
                            {editingItem ? "Update" : "Save"}
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading announcements...</span>
                </div>
            ) : announcements.length === 0 ? (
                <NoAnnouncementsMessage />
            ) : (
                <>
                    <Buttons
                        data={announcements.map((a, index) => ({
                            "S.No": (page - 1) * pageSize + index + 1,
                            UUID: a.uuid,
                            Title: a.title,
                            Description: a.description,
                            "Teacher Name": a.teacher_name || "N/A",
                            School: a.school || "N/A",
                            "Created Date": a.created ? new Date(a.created).toLocaleDateString() : "N/A",
                        }))}
                        columns={[
                            { label: "S.No", key: "S.No" },
                            { label: "UUID", key: "UUID" },
                            { label: "Title", key: "Title" },
                            { label: "Description", key: "Description" },
                            { label: "Teacher Name", key: "Teacher Name" },
                            { label: "School", key: "School" },
                            { label: "Created Date", key: "Created Date" },
                        ]}
                        filename="Class_Announcements_Report"
                    />
                    <h2 className="text-lg font-semibold text-white bg-blue-900 px-4 py-2 rounded-t-md mt-4">
                        Announcements ({totalItems} total)
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full border bg-white rounded-b-md">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="p-2 border text-xs font-semibold text-gray-700">S.No</th>
                                    <th className="p-2 border text-xs font-semibold text-gray-700">Title</th>
                                    <th className="p-2 border text-xs font-semibold text-gray-700">Description</th>
                                    <th className="p-2 border text-xs font-semibold text-gray-700">Teacher</th>
                                    <th className="p-2 border text-xs font-semibold text-gray-700">School</th>
                                    <th className="p-2 border text-xs font-semibold text-gray-700">Created</th>
                                    {(canEdit || canDelete) && (
                                        <th className="p-2 border text-xs font-semibold text-gray-700">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {announcements.map((a, index) => (
                                    <tr key={a.uuid} className="hover:bg-gray-50">
                                        <td className="p-2 border text-xs text-gray-800 text-center">
                                            {(page - 1) * pageSize + index + 1}
                                        </td>
                                        <td className="p-2 border text-xs text-gray-800">
                                            <span className="block max-w-[150px] truncate" title={a.title}>
                                                {a.title}
                                            </span>
                                        </td>
                                        <td className="p-2 border text-xs text-gray-800">
                                            <span className="block max-w-[200px] truncate" title={a.description}>
                                                {a.description.length > 50 ? `${a.description.slice(0, 50)}...` : a.description}
                                            </span>
                                        </td>
                                        <td className="p-2 border text-xs text-gray-800">
                                            <span className="block max-w-[120px] truncate" title={a.teacher_name}>
                                                {a.teacher_name || "N/A"}
                                            </span>
                                        </td>
                                        <td className="p-2 border text-xs text-gray-800">
                                            <span className="block max-w-[150px] truncate" title={a.school}>
                                                {a.school || "N/A"}
                                            </span>
                                        </td>
                                        <td className="p-2 border text-xs text-gray-800">
                                            {a.created ? new Date(a.created).toLocaleDateString() : "N/A"}
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td className="p-2 border flex gap-2 justify-center text-xs">
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
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={(newPage) => {
                    setPage(newPage);
                }}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
                totalItems={totalItems}
                showPageSizeSelector={true}
                showPageInfo={true}
            />

            {selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h2 className="text-xl font-bold text-blue-800">📢 Announcement Details</h2>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="text-gray-500 hover:text-red-600 text-lg font-semibold"
                                aria-label="Close"
                            >
                                ✖
                            </button>
                        </div>

                        <div className="mt-5 space-y-4 text-sm text-gray-700">
                            <div>
                                <span className="font-semibold text-gray-800">📌 Title:</span><br />
                                <span className="ml-1">{selectedItem.title}</span>
                            </div>

                            <div>
                                <span className="font-semibold text-gray-800">📝 Description:</span>
                                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mt-1 text-gray-800">
                                    {selectedItem.description}
                                </div>
                            </div>

                            <div>
                                <span className="font-semibold text-gray-800">👨‍🏫 Teacher:</span><br />
                                <span className="ml-1">{selectedItem.teacher_name || "N/A"}</span>
                            </div>

                            <div>
                                <span className="font-semibold text-gray-800">🏫 School:</span><br />
                                <span className="ml-1">{selectedItem.school || "N/A"}</span>
                            </div>

                            <div>
                                <span className="font-semibold text-gray-800">📅 Created:</span><br />
                                <span className="ml-1">{selectedItem.created ? new Date(selectedItem.created).toLocaleString() : "N/A"}</span>
                            </div>

                            <div>
                                <span className="font-semibold text-gray-800">🆔 UUID:</span><br />
                                <span className="ml-1 font-mono text-xs bg-gray-100 px-2 py-1 rounded">{selectedItem.uuid}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md shadow text-xs"
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