import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdEdit, MdDelete } from "react-icons/md";
import { Buttons } from "../../components";
import apiRequest from '../../helpers/apiRequest';
import Select from "react-select";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster";
import TableComponent from "../../components/TableComponent"; // Import reusable TableComponent

const FeeStructures = () => {
    const [feeStructures, setFeeStructures] = useState([]);
    const [classes, setClasses] = useState([]);
    const [feeTypes, setFeeTypes] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [toaster, setToaster] = useState({ message: "", type: "success", onConfirm: null, onCancel: null });

    const [newFeeStructure, setNewFeeStructure] = useState({
        class_assigned_id: "",
        fee_type_id: "",
        amount: "",
        due_date: "",
        is_active: true,
    });

    const [editingStructure, setEditingStructure] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const API = import.meta.env.VITE_SERVER_URL;
    const API_URL = `${API}fee-structures/`;

    const showToast = (message, type = "success", onConfirm = null, onCancel = null) => {
        setToaster({ message, type, onConfirm, onCancel });
    };

    const fetchFeeStructures = async () => {
        try {
            const token = Cookies.get("access_token");
            if (!token) {
                showToast("User is not authenticated.", "error", null, null);
                return;
            }
            const res = await axios.get(`${API_URL}?page=${page}&page_size=${pageSize}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = res.data?.data || {};

            if (Array.isArray(data.results)) {
                setFeeStructures(data.results);
                setTotalPages(data.total_pages || 1);
            } else {
                throw new Error("Unexpected API response");
            }
        } catch (error) {
            console.error("Error fetching fee structures:", error.response?.data || error.message);
            showToast(
                error.response?.data?.message || "Failed to fetch fee structures.",
                "error",
                null,
                null
            );
        }
    };

    const getClasses = async () => {
        try {
            const res = await apiRequest('classes');
            setClasses(res.data.results || res.data);
        } catch (err) {
            console.error('Error fetching classes:', err.response?.data || err.message);
            showToast(
                err.response?.data?.message || "Failed to fetch classes.",
                "error",
                null,
                null
            );
        }
    };

    const getFeeTypes = async () => {
        try {
            const res = await apiRequest('fee-types');
            setFeeTypes(res.data.results || res.data);
        } catch (err) {
            console.error('Error fetching fee types:', err.response?.data || err.message);
            showToast(
                err.response?.data?.message || "Failed to fetch fee types.",
                "error",
                null,
                null
            );
        }
    };

    const handleSaveStructure = async () => {
        if (!newFeeStructure.class_assigned_id || !newFeeStructure.fee_type_id || !newFeeStructure.amount || !newFeeStructure.due_date) {
            showToast("All fields are required.", "error", null, null);
            return;
        }

        try {
            const token = Cookies.get("access_token");
            if (!token) {
                showToast("User is not authenticated.", "error", null, null);
                return;
            }

            if (editingStructure) {
                const res = await axios.put(
                    `${API_URL}${editingStructure.id}/`,
                    { amount: newFeeStructure.amount },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                showToast("Fee structure updated!", "success", null, null);
                setFeeStructures((prev) =>
                    prev.map((f) =>
                        f.id === editingStructure.id ? { ...f, amount: res.data.data.amount } : f
                    )
                );
            } else {
                const res = await axios.post(API_URL, newFeeStructure, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                showToast("Fee structure created!", "success", null, null);
                setFeeStructures((prev) => [...prev, res.data.data]);
            }

            setNewFeeStructure({
                class_assigned_id: "",
                fee_type_id: "",
                amount: "",
                due_date: "",
                is_active: true,
            });
            setEditingStructure(null);
            setShowForm(false);
            fetchFeeStructures(); // Refresh to handle pagination
        } catch (error) {
            console.error("Error saving fee structure:", error.response?.data || error.message);
            showToast(
                error.response?.data?.message || "Failed to save fee structure.",
                "error",
                null,
                null
            );
        }
    };

    const handleDelete = (id) => {
        if (!canDelete) {
            showToast("You do not have permission to delete fee structures.", "error", null, null);
            return;
        }

        showToast(
            "Delete this Fee Structure?",
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
                    showToast("Fee Structure deleted successfully!", "success", null, null);
                    setFeeStructures((prev) => prev.filter((f) => f.id !== id));
                    fetchFeeStructures(); // Refresh to handle pagination
                } catch (error) {
                    console.error("Error deleting fee structure:", error.response?.data || error.message);
                    showToast(
                        error.response?.data?.message || "Failed to delete fee structure.",
                        "error",
                        null,
                        null
                    );
                }
            },
            () => {
                showToast("", "success", null, null); // Clear the toaster
            }
        );
    };

    const handleEdit = (structure) => {
        setEditingStructure(structure);
        setNewFeeStructure({
            class_assigned_id: structure.class_assigned_id,
            fee_type_id: structure.fee_type_id,
            amount: structure.amount,
            due_date: structure.due_date,
            is_active: structure.is_active,
        });
        setShowForm(true);
    };

    useEffect(() => {
        fetchFeeStructures();
        getClasses();
        getFeeTypes();
    }, [page, pageSize]);

    const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
    const canAdd = permissions.includes("users.add_feestructure");
    const canEdit = permissions.includes("users.change_feestructure");
    const canDelete = permissions.includes("users.delete_feestructure");
    const canPerformActions = canEdit || canDelete;

    // Columns for TableComponent
    const tableColumns = [
        {
            key: "index",
            label: "#ID",
            render: (row, index) => (page - 1) * pageSize + index + 1,
        },
        {
            key: "fee_type",
            label: "Fee Type",
            render: (row) => row.fee_type || "N/A",
        },
        {
            key: "class_name",
            label: "Class",
            render: (row) => row.class_name || "N/A",
        },
        {
            key: "class_section",
            label: "Section",
            render: (row) => row.class_section || "N/A",
        },
        {
            key: "class_session",
            label: "Session",
            render: (row) => row.class_session || "N/A",
        },
        {
            key: "amount",
            label: "Amount",
            render: (row) => row.amount ? `$${row.amount}` : "N/A",
        },
        {
            key: "due_date",
            label: "Due Date",
            render: (row) => row.due_date || "N/A",
        },
        {
            key: "is_active",
            label: "Active",
            render: (row) => row.is_active ? "✅" : "❌",
        },
        ...(canPerformActions ? [
            {
                key: "actions",
                label: "Actions",
                render: (row) => (
                    <div className="flex justify-center gap-2">
                        {canEdit && (
                            <MdEdit
                                onClick={() => handleEdit(row)}
                                className="text-yellow-500 cursor-pointer hover:text-yellow-700 transition-colors duration-200"
                                size={18}
                                title="Edit Fee Structure"
                            />
                        )}
                        {canDelete && (
                            <MdDelete
                                onClick={() => handleDelete(row.id)}
                                className="text-red-500 cursor-pointer hover:text-red-700 transition-colors duration-200"
                                size={18}
                                title="Delete Fee Structure"
                            />
                        )}
                    </div>
                ),
            },
        ] : []),
    ];

    // Responsive select styles
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
            zIndex: 20,
        }),
        option: (provided) => ({
            ...provided,
            fontSize: "0.85rem",
            padding: "0.5rem 0.75rem",
            backgroundColor: provided.isSelected ? "#3b82f6" : provided.isFocused ? "#eff6ff" : "white",
            color: provided.isSelected ? "white" : "#1f2937",
        }),
    };

    return (
        <div className="min-h-screen p-4 sm:p-6">
            <Toaster
                message={toaster.message}
                type={toaster.type}
                duration={3000}
                onClose={() => setToaster({ message: "", type: "success", onConfirm: null, onCancel: null })}
                onConfirm={toaster.onConfirm}
                onCancel={toaster.onCancel}
                allowNoDataErrors={true}
            />
            <div className="bg-gradient-to-r from-blue-900 to-blue-900 text-white py-3 px-4 sm:px-6 rounded-xl flex justify-between items-center mt-5 shadow-lg">
                <h1 className="text-lg sm:text-xl font-bold">Manage Fee Structures</h1>
                {canAdd && (
                    <button
                        onClick={() => {
                            setShowForm((prev) => !prev);
                            setEditingStructure(null);
                            setNewFeeStructure({
                                class_assigned_id: "",
                                fee_type_id: "",
                                amount: "",
                                due_date: "",
                                is_active: true,
                            });
                        }}
                        className="flex items-center px-3 py-2 bg-cyan-500 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-600 text-sm sm:text-base transition-colors duration-200"
                    >
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-800 rounded-full mr-2">
                            <span className="text-cyan-400 text-xl font-bold">
                                {showForm ? "-" : "+"}
                            </span>
                        </div>
                        {showForm ? "Close Form" : "Add Fee Structure"}
                    </button>
                )}
            </div>

            <div className="p-4 sm:p-6">
                {showForm && canAdd && (
                    <div className="p-4 sm:p-6 bg-white rounded-xl shadow-md border border-gray-200 max-w-lg mx-auto mb-6">
                        <h2 className="text-lg font-semibold text-blue-900 mb-4">
                            {editingStructure ? "Edit Fee Structure" : "Create New Fee Structure"}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                <Select
                                    value={classes.find(cls => cls.id === newFeeStructure.class_assigned_id) || null}
                                    onChange={(selected) =>
                                        setNewFeeStructure({ ...newFeeStructure, class_assigned_id: selected?.id || "" })
                                    }
                                    options={classes}
                                    getOptionLabel={(cls) => `${cls.class_name} ${cls.section} (${cls.session})`}
                                    getOptionValue={(cls) => cls.id}
                                    placeholder="Select class"
                                    isClearable
                                    styles={selectStyles}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
                                <Select
                                    value={feeTypes.find(ft => ft.id === newFeeStructure.fee_type_id) || null}
                                    onChange={(selected) =>
                                        setNewFeeStructure({ ...newFeeStructure, fee_type_id: selected?.id || "" })
                                    }
                                    options={feeTypes}
                                    getOptionLabel={(ft) => ft.name}
                                    getOptionValue={(ft) => ft.id}
                                    placeholder="Select fee type"
                                    isClearable
                                    styles={selectStyles}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 1000"
                                    value={newFeeStructure.amount}
                                    onChange={(e) =>
                                        setNewFeeStructure({ ...newFeeStructure, amount: parseFloat(e.target.value) || "" })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    value={newFeeStructure.due_date}
                                    onChange={(e) =>
                                        setNewFeeStructure({ ...newFeeStructure, due_date: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="sm:col-span-2 flex items-center mt-2">
                                <input
                                    type="checkbox"
                                    checked={newFeeStructure.is_active}
                                    onChange={(e) =>
                                        setNewFeeStructure({ ...newFeeStructure, is_active: e.target.checked })
                                    }
                                    className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label className="text-sm text-gray-700 font-medium">Mark as Active</label>
                            </div>
                        </div>
                        <div className="mt-4 text-right">
                            <button
                                onClick={handleSaveStructure}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm text-sm transition-colors duration-200"
                            >
                                {editingStructure ? "Update Structure" : "Save Structure"}
                            </button>
                        </div>
                    </div>
                )}

                {feeStructures.length > 0 ? (
                    <div className="mt-1">
                        <div className=" mb-4 gap-3">
                            
                            <Buttons
                                data={feeStructures}
                                columns={[
                                    { label: "School", key: "school" },
                                    { label: "Class", key: "class_name" },
                                    { label: "Section", key: "class_section" },
                                    { label: "Session", key: "class_session" },
                                    { label: "Fee Type", key: "fee_type" },
                                    { label: "Amount", key: "amount" },
                                    { label: "Due Date", key: "due_date" },
                                    { label: "Active", key: "is_active", render: (value) => value ? "Yes" : "No" },
                                ]}
                                filename="FeeStructures"
                            />
                        </div>
                        <div className="overflow-x-auto">
                            <TableComponent
                                data={feeStructures}
                                columns={tableColumns}
                                initialSort={{ key: "fee_type", direction: "asc" }}
                            />
                        </div>
                        {/* <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            onPageChange={(newPage) => {
                                setPage(newPage);
                                fetchFeeStructures();
                            }}
                            onPageSizeChange={(size) => {
                                setPageSize(size);
                                setPage(1);
                                fetchFeeStructures();
                            }}
                            totalItems={feeStructures.length}
                            showPageSizeSelector={true}
                            showPageInfo={true}
                        /> */}
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <p className="text-gray-500 text-lg font-medium">No fee structures available.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeeStructures;