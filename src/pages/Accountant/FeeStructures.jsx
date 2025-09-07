import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdEdit, MdDelete } from "react-icons/md";
import { Buttons } from "../../components";
import apiRequest from '../../helpers/apiRequest';
import Select from "react-select";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster";

const FeeStructures = () => {
    const [feeStructures, setFeeStructures] = useState([]);
    const [classes, setClasses] = useState([]);
    const [feeTypes, setFeeTypes] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [toaster, setToaster] = useState({ message: '', type: 'success' });

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

    const showToast = (message, type = 'success') => {
        setToaster({ message, type });
    };

    const fetchFeeStructures = async () => {
        try {
            const token = Cookies.get("access_token");
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
        } catch {
            showToast("Failed to fetch fee structures.", "error");
        }
    };

    const getClasses = async () => {
        try {
            const res = await apiRequest('/classes');
            setClasses(res.data.results || res.data);
        } catch (err) {
            console.error('Error fetching classes:', err);
            showToast("Failed to fetch classes.", "error");
        }
    };

    const getFeeTypes = async () => {
        try {
            const res = await apiRequest('/fee-types');
            setFeeTypes(res.data.results || res.data);
        } catch (err) {
            console.error('Error fetching fee types:', err);
            showToast("Failed to fetch fee types.", "error");
        }
    };

    const handleSaveStructure = async () => {
        if (!newFeeStructure.class_assigned_id || !newFeeStructure.fee_type_id || !newFeeStructure.amount || !newFeeStructure.due_date) {
            showToast("All fields are required.", "error");
            return;
        }

        try {
            const token = Cookies.get("access_token");

            if (editingStructure) {
                const res = await axios.put(
                    `${API_URL}${editingStructure.id}/`,
                    { amount: newFeeStructure.amount },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                showToast("Fee structure updated!", "success");
                setFeeStructures((prev) =>
                    prev.map((f) =>
                        f.id === editingStructure.id ? { ...f, amount: res.data.data.amount } : f
                    )
                );
            } else {
                const res = await axios.post(API_URL, newFeeStructure, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                showToast("Fee structure created!", "success");
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
        } catch {
            showToast("Failed to save fee structure.", "error");
        }
    };

    const handleDelete = (id) => {
        if (!canDelete) {
            showToast("You do not have permission to delete fee structures.", "error");
            return;
        }

        showToast(
            {
                message: "Delete this Fee Structure?",
                type: "confirm",
                onConfirm: async () => {
                    try {
                        const token = Cookies.get("access_token");
                        await axios.delete(`${API_URL}${id}/`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        showToast("Deleted successfully!", "success");
                        setFeeStructures((prev) => prev.filter((f) => f.id !== id));
                    } catch {
                        showToast("Failed to delete.", "error");
                    }
                },
                onCancel: () => setToaster({ message: "", type: "success" })
            },
            "confirm"
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

    const columns = [
        { label: "School", key: "school" },
        { label: "Class", key: "class_name" },
        { label: "Section", key: "class_section" },
        { label: "Session", key: "class_session" },
        { label: "Fee Type", key: "fee_type" },
        { label: "Amount", key: "amount" },
        { label: "Due Date", key: "due_date" },
        { label: "Active", key: "is_active" },
    ];

    const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
    const canAdd = permissions.includes("users.add_feestructure");
    const canEdit = permissions.includes("users.change_feestructure");
    const canDelete = permissions.includes("users.delete_feestructure");
    const canPerformActions = canEdit || canDelete;

    return (
        <div className="p-2">
            <Toaster
                message={toaster.message}
                type={toaster.type}
                duration={3000}
                onClose={() => setToaster({ message: "", type: "success" })}
                onConfirm={toaster.onConfirm}
                onCancel={toaster.onCancel}
            />
            <div className="bg-blue-900 text-white py-1 px-2 rounded-md flex justify-between items-center mt-2">
                <h1 className="text-lg font-bold">Manage Fee Structures</h1>
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
                        className="flex items-center px-2 py-1 bg-cyan-400 text-white font-semibold rounded-md shadow-md hover:bg-cyan-500 text-sm"
                    >
                        <div className="flex items-center justify-center w-6 h-6 bg-black rounded-full mr-1">
                            <span className="text-cyan-500 text-base font-bold">
                                {showForm ? "-" : "+"}
                            </span>
                        </div>
                        {showForm ? "Close Form" : "Add Fee Structure"}
                    </button>
                )}
            </div>

            <div className="p-2">
                {showForm && canAdd && (
                    <div className="p-2 bg-white rounded-md shadow-md border border-gray-200 max-w-lg mx-auto mb-2">
                        <h2 className="text-base font-semibold text-blue-800 mb-2">
                            {editingStructure ? "Edit Fee Structure" : "Create New Fee Structure"}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-0.5">Class</label>
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
                                    className="text-xs"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-0.5">Fee Type</label>
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
                                    className="text-xs"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-0.5">Amount</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 1000"
                                    value={newFeeStructure.amount}
                                    onChange={(e) =>
                                        setNewFeeStructure({ ...newFeeStructure, amount: parseFloat(e.target.value) || "" })
                                    }
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-0.5">Due Date</label>
                                <input
                                    type="date"
                                    value={newFeeStructure.due_date}
                                    onChange={(e) =>
                                        setNewFeeStructure({ ...newFeeStructure, due_date: e.target.value })
                                    }
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="sm:col-span-2 flex items-center mt-1">
                                <input
                                    type="checkbox"
                                    checked={newFeeStructure.is_active}
                                    onChange={(e) =>
                                        setNewFeeStructure({ ...newFeeStructure, is_active: e.target.checked })
                                    }
                                    className="mr-1"
                                />
                                <label className="text-xs text-gray-700 font-medium">Mark as Active</label>
                            </div>
                        </div>
                        <div className="mt-2 text-right">
                            <button
                                onClick={handleSaveStructure}
                                className="bg-blue-600 hover:bg-blue-800 text-white font-medium px-3 py-1 rounded-md shadow-sm text-xs"
                            >
                                {editingStructure ? "Update Structure" : "Save Structure"}
                            </button>
                        </div>
                    </div>
                )}

                {feeStructures.length > 0 ? (
                    <div className="mt-2">
                        <Buttons data={feeStructures} columns={columns} filename="FeeStructures" />
                        <h2 className="text-base font-semibold text-white bg-blue-900 px-2 py-0.5 rounded-t-md">
                            Fee Structures
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300 bg-white min-w-[400px]">
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th className="border border-gray-300 p-0.5 text-center text-xs">#ID</th>
                                        <th className="border border-gray-300 p-0.5 text-center text-xs">Fee Type</th>
                                        <th className="border border-gray-300 p-0.5 text-center text-xs">Class</th>
                                        <th className="border border-gray-300 p-0.5 text-center text-xs">Section</th>
                                        <th className="border border-gray-300 p-0.5 text-center text-xs">Session</th>
                                        <th className="border border-gray-300 p-0.5 text-center text-xs">Amount</th>
                                        <th className="border border-gray-300 p-0.5 text-center text-xs">Due Date</th>
                                        <th className="border border-gray-300 p-0.5 text-center text-xs">Active</th>
                                        {canPerformActions && (
                                            <th className="border border-gray-300 p-0.5 text-center text-xs">Actions</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {feeStructures.map((f, index) => (
                                        <tr key={f.id}>
                                            <td className="border border-gray-300 p-0.5 text-center text-xs">
                                                {(page - 1) * pageSize + index + 1}
                                            </td>
                                            <td className="border border-gray-300 p-0.5 text-xs">{f.fee_type}</td>
                                            <td className="border border-gray-300 p-0.5 text-xs">{f.class_name}</td>
                                            <td className="border border-gray-300 p-0.5 text-xs">{f.class_section}</td>
                                            <td className="border border-gray-300 p-0.5 text-xs">{f.class_session}</td>
                                            <td className="border border-gray-300 p-0.5 text-center text-xs">{f.amount}</td>
                                            <td className="border border-gray-300 p-0.5 text-center text-xs">{f.due_date}</td>
                                            <td className="border border-gray-300 p-0.5 text-center text-xs">
                                                {f.is_active ? "✅" : "❌"}
                                            </td>
                                            {canPerformActions && (
                                                <td className="border border-gray-300 p-0.5 flex justify-center gap-1 text-xs">
                                                    {canEdit && (
                                                        <MdEdit
                                                            onClick={() => handleEdit(f)}
                                                            className="text-yellow-500 cursor-pointer hover:text-yellow-700"
                                                            size={18}
                                                        />
                                                    )}
                                                    {canDelete && (
                                                        <MdDelete
                                                            onClick={() => handleDelete(f.id)}
                                                            className="text-red-500 cursor-pointer hover:text-red-700"
                                                            size={18}
                                                        />
                                                    )}
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
                            onPageChange={(newPage) => setPage(newPage)}
                            onPageSizeChange={(size) => {
                                setPageSize(size);
                                setPage(1);
                            }}
                            totalItems={feeStructures.length}
                            showPageSizeSelector={true}
                            showPageInfo={true}
                        />
                    </div>
                ) : (
                    <p className="text-center text-gray-500 text-xs">No fee structures available.</p>
                )}
            </div>
        </div>
    );
};

export default FeeStructures;