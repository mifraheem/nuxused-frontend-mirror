import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import toast, { Toaster } from "react-hot-toast";
import Select from "react-select";
import { Buttons } from "../../components";
import Pagination from "../../components/Pagination";

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
    const [pageSize, setPageSize] = useState(100); // Increased to fetch more announcements
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const API = import.meta.env.VITE_SERVER_URL;
    const API_URL = `${API}class-announcements/`;

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = Cookies.get("access_token");
            if (!token) {
                toast.error("No authentication token found. Please log in again.");
                console.error("No access_token found in Cookies.");
                return;
            }
            console.log("Fetching announcements with URL:", `${API_URL}?page=${page}&page_size=${pageSize}`);
            const res = await axios.get(`${API_URL}?page=${page}&page_size=${pageSize}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Announcements API response:", res.data); // Debug full response
            const results = res.data?.data?.results || res.data?.results || [];
            setAnnouncements(Array.isArray(results) ? results : []);
            setTotalPages(res.data?.data?.total_pages || res.data?.total_pages || 1);
            if (results.length === 0) {
                console.warn("No announcements found in response.");
                toast.info("No announcements available.");
            }
        } catch (err) {
            console.error("Fetch announcements error:", err.response?.data || err.message);
            toast.error(err.response?.data?.message || "Failed to fetch announcements.");
        } finally {
            setLoading(false);
        }
    };

    const fetchClassOptions = async () => {
        try {
            const token = Cookies.get("access_token");
            if (!token) {
                toast.error("No authentication token found. Please log in again.");
                console.error("No access_token found in Cookies.");
                return;
            }
            console.log("Fetching class options with URL:", `${API}classes/?page_size=100`);
            const res = await axios.get(`${API}classes/?page_size=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const classes = res.data?.data?.results || res.data?.results || [];
            console.log("Class options response:", classes); // Debug class options
            setClassOptions(Array.isArray(classes) ? classes : []);
            if (classes.length === 0) {
                console.warn("No classes found in response.");
                toast.warn("No classes available to select.");
            }
        } catch (err) {
            console.error("Fetch classes error:", err.response?.data || err.message);
            toast.error(err.response?.data?.message || "Failed to load classes.");
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

            console.log("Saving announcement with payload:", newAnnouncement); // Debug payload

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
            console.error("Create/Update error:", err.response?.data || err.message);
            toast.error(err.response?.data?.message || "Operation failed.");
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
        } catch (err) {
            console.error("Delete error:", err.response?.data || err.message);
            toast.error(err.response?.data?.message || "Failed to delete.");
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

    // Determine the class ID field based on classOptions structure
    const classIdField = classOptions.length > 0 && classOptions[0].uuid ? "uuid" : "id";

    // Map class_schedule UUID to class name for display
    const getClassName = (classSchedule) => {
        const classOption = classOptions.find((cls) => cls[classIdField] === classSchedule);
        return classOption
            ? `${classOption.class_name || "Unknown"} - ${classOption.section || ""} (${classOption.session || ""})`
            : classSchedule || "N/A";
    };

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
                                    console.log("Selected class:", selected); // Debug selection
                                    setNewAnnouncement((prev) => {
                                        const updated = { ...prev, class_schedule: selected?.[classIdField] || "" };
                                        console.log("Updated newAnnouncement:", updated); // Debug state update
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
                            onClick={() => setShowForm(false)}
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
                <p className="text-center text-gray-600 text-sm mt-4">Loading announcements...</p>
            ) : announcements.length === 0 ? (
                <p className="text-center text-gray-600 text-sm mt-4">No announcements found.</p>
            ) : (
                <>
                    <Buttons
                        data={announcements.map((a) => ({
                            ID: a.id,
                            Title: a.title,
                            Description: a.description,
                            "Class Schedule": getClassName(a.class_schedule),
                        }))}
                        columns={[
                            { label: "ID", key: "ID" },
                            { label: "Title", key: "Title" },
                            { label: "Description", key: "Description" },
                            { label: "Class Schedule", key: "Class Schedule" },
                        ]}
                        filename="Class_Announcements_Report"
                    />
                    <h2 className="text-lg font-semibold text-white bg-blue-900 px-4 py-2 rounded-t-md mt-4">
                        Announcements
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full border bg-white rounded-b-md">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="p-2 border text-xs font-semibold text-gray-700">ID</th>
                                    <th className="p-2 border text-xs font-semibold text-gray-700">Title</th>
                                    <th className="p-2 border text-xs font-semibold text-gray-700">Description</th>
                                    <th className="p-2 border text-xs font-semibold text-gray-700">Class Schedule</th>
                                    {(canEdit || canDelete) && (
                                        <th className="p-2 border text-xs font-semibold text-gray-700">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {announcements.map((a, index) => (
                                    <tr key={a.id} className="hover:bg-gray-50">
                                        {/* Sequence number */}
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
                                            <span className="block max-w-[150px] truncate" title={getClassName(a.class_schedule)}>
                                                {getClassName(a.class_schedule)}
                                            </span>
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
                                                                class_schedule: a.class_schedule,
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
                                                        onClick={() => handleDelete(a.id)}
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
                    fetchData();
                }}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                    fetchData();
                }}
                totalItems={announcements.length}
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
                                <span className="font-semibold text-gray-800">🏫 Class Schedule:</span><br />
                                <span className="ml-1">{getClassName(selectedItem.class_schedule)}</span>
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