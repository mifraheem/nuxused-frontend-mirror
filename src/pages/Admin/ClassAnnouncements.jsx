import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import Select from "react-select";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster";
import TableComponent from "../../components/TableComponent"; // Import reusable TableComponent

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
    const [toaster, setToaster] = useState({ message: "", type: "success", onConfirm: null, onCancel: null });

    const API = import.meta.env.VITE_SERVER_URL;
    const API_URL = `${API}class-announcements/`;

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
            const url = `${API_URL}?page=${page}&page_size=${pageSize}`;
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
    const showToast = (message, type = "success", onConfirm = null, onCancel = null) => {
        setToaster({ message, type, onConfirm, onCancel });
        if (type !== "confirmation") {
            setTimeout(() => setToaster({ message: "", type: "success", onConfirm: null, onCancel: null }), 3000);
        }
    };

    const handleDelete = (uuid) => {
        if (!canDelete) {
            showToast("You do not have permission to delete announcements.", "error");
            return;
        }

        showToast(
            "Are you sure you want to delete this announcement?",
            "confirmation",
            async () => {
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
                    showToast(
                        `Failed to delete announcement: ${err.response?.data?.message || err.message}`,
                        "error"
                    );
                    console.error("Delete error:", err.response?.data || err.message);
                }
            },
            () => {
                showToast("Delete cancelled", "error");
            }
        );
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
    const canPerformActions = canEdit || canDelete;

    if (!canView) {
        return (
            <div className="p-6 text-center text-red-600 font-semibold">
                🚫 You do not have permission to view class announcements.
            </div>
        );
    }

    // 🔹 Responsive select styles
    const selectStyles = {
        control: (provided) => ({
            ...provided,
            minHeight: "2.25rem",
            fontSize: "0.85rem",
            borderRadius: "0.375rem",
            borderColor: "#d1d5db",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        }),
        menu: (provided) => ({
            ...provided,
            fontSize: "0.85rem",
            maxHeight: "220px",
            overflowY: "auto",
            borderRadius: "0.375rem",
            zIndex: 9999,
        }),
        option: (provided) => ({
            ...provided,
            fontSize: "0.85rem",
            padding: "0.5rem 0.75rem",
            backgroundColor: provided.isSelected ? "#3b82f6" : provided.isFocused ? "#eff6ff" : "white",
            color: provided.isSelected ? "white" : "#1f2937",
        }),
        singleValue: (provided) => ({
            ...provided,
            fontSize: "0.85rem",
        }),
        placeholder: (provided) => ({
            ...provided,
            fontSize: "0.85rem",
            color: "#6b7280",
        }),
    };

    // 🔹 Columns for TableComponent
    const tableColumns = [
        {
            key: "index",
            label: "S.No",
            render: (row, index) => (page - 1) * pageSize + index + 1,
        },
        {
            key: "title",
            label: "Title",
            render: (row) => (
                <span className="block max-w-[150px] truncate" title={row.title}>
                    {row.title || "—"}
                </span>
            ),
        },
        {
            key: "description",
            label: "Description",
            render: (row) => (
                <span className="block max-w-[200px] truncate" title={row.description}>
                    {row.description || "—"}
                </span>
            ),
        },
        {
            key: "teacher_name",
            label: "Teacher",
            render: (row) => row.teacher_name || "N/A",
        },
        {
            key: "school",
            label: "School",
            render: (row) => row.school || "N/A",
        },
        {
            key: "created",
            label: "Created",
            render: (row) => (row.created ? new Date(row.created).toLocaleDateString() : "N/A"),
        },
        ...(canPerformActions ? [{
            key: "actions",
            label: "Actions",
            render: (row) => (
                <div className="flex justify-center gap-2">
                    <button
                        onClick={() => setSelectedItem(row)}
                        className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        title="View"
                    >
                        <MdVisibility size={18} />
                    </button>
                    {canEdit && (
                        <button
                            onClick={() => {
                                setEditingItem(row);
                                setShowForm(true);
                                setNewAnnouncement({
                                    class_schedule: row.class_schedule || "",
                                    title: row.title,
                                    description: row.description,
                                });
                            }}
                            className="text-yellow-600 hover:text-yellow-800 transition-colors duration-200"
                            title="Edit"
                        >
                            <MdEdit size={18} />
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={() => handleDelete(row.uuid)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-200"
                            title="Delete"
                        >
                            <MdDelete size={18} />
                        </button>
                    )}
                </div>
            ),
        }] : []),
    ];

    // 🔹 UI
    return (
        <div className="min-h-screen p-4 sm:p-6 max-w-7xl mx-auto">
            <Toaster
                message={toaster.message}
                type={toaster.type}
                duration={3000}
                onClose={() => setToaster({ message: "", type: "success", onConfirm: null, onCancel: null })}
                onConfirm={toaster.onConfirm}
                onCancel={toaster.onCancel}
            />

            {/* Header */}
            <div className="flex justify-between items-center bg-gradient-to-r from-blue-900 to-blue-900 text-white px-4 sm:px-6 py-3 rounded-xl shadow-lg mb-6">
                <h1 className="text-lg sm:text-xl font-bold">Class Announcements</h1>
                {canAdd && (
                    <button
                        onClick={() => {
                            setShowForm((prev) => !prev);
                            setNewAnnouncement({ class_schedule: "", title: "", description: "" });
                            setEditingItem(null);
                        }}
                        className="flex items-center px-3 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg shadow-md text-white font-semibold text-sm sm:text-base transition-colors duration-200"
                    >
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-800 rounded-full mr-2">
                            <span className="text-cyan-400 text-xl font-bold">{showForm ? "−" : "+"}</span>
                        </div>
                        {showForm ? "Close Form" : "Add Announcement"}
                    </button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-200 mb-6 max-w-2xl mx-auto">
                    <h2 className="text-lg font-semibold text-blue-900 mb-4">
                        {editingItem ? "Edit Announcement" : "Create Announcement"}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Class
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
                                styles={selectStyles}
                                isClearable
                                menuPortalTarget={document.body}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter title"
                                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={newAnnouncement.title}
                                onChange={(e) =>
                                    setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                                }
                            />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                placeholder="Enter description"
                                className="w-full p-2 border border-gray-300 rounded-md text-sm h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm shadow-sm transition-colors duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateOrUpdate}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm shadow-sm transition-colors duration-200"
                        >
                            {editingItem ? "Update" : "Save"}
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600 text-lg">Loading announcements...</span>
                </div>
            ) : announcements.length === 0 ? (
                <div className="text-center text-gray-600 py-8 text-lg font-medium">
                    No announcements found.
                </div>
            ) : (
                <div className="mt-6">
                   
                    <div className="overflow-x-auto">
                        <TableComponent
                            data={announcements}
                            columns={tableColumns}
                            initialSort={{ key: "title", direction: "asc" }}
                        />
                    </div>
                    {/* <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        onPageChange={(newPage) => {
                            setPage(newPage);
                            fetchData();
                        }}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setPage(1);
                            fetchData();
                        }}
                        totalItems={totalItems}
                        showPageSizeSelector={true}
                        showPageInfo={true}
                    /> */}
                </div>
            )}

            {/* Modal View */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b bg-blue-50">
                            <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                                📢 Announcement Details
                            </h2>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors duration-200"
                            >
                                ✕
                            </button>
                        </div>
                        {/* Content in column form */}
                        <div className="px-6 py-5 overflow-y-auto max-h-[60vh] space-y-4 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-600 font-medium">📌 Title</span>
                                <span className="font-semibold text-gray-800 text-right max-w-[60%]">
                                    {selectedItem.title || "—"}
                                </span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-600 font-medium">📝 Description</span>
                                <span className="font-semibold text-gray-800 text-right max-w-[60%]">
                                    {selectedItem.description || "—"}
                                </span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-600 font-medium">👨‍🏫 Teacher</span>
                                <span className="font-semibold text-gray-800 text-right">
                                    {selectedItem.teacher_name || "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-600 font-medium">🏫 School</span>
                                <span className="font-semibold text-gray-800 text-right">
                                    {selectedItem.school || "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-600 font-medium">📅 Created</span>
                                <span className="font-semibold text-gray-800 text-right">
                                    {selectedItem.created
                                        ? new Date(selectedItem.created).toLocaleString()
                                        : "N/A"}
                                </span>
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="flex justify-end px-6 py-4 border-t bg-gray-50">
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg shadow text-sm font-medium transition-colors duration-200"
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