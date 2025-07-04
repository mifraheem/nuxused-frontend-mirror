import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { MdEdit, MdDelete } from "react-icons/md";
import { Buttons } from "../../components";
import apiRequest from '../../helpers/apiRequest';


const FeeStructures = () => {
    const [feeStructures, setFeeStructures] = useState([]);
    const [classes, setClasses] = useState([]);
    const [feeTypes, setFeeTypes] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

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
            toast.error("Failed to fetch fee structures.");
        }
    };

    const getClasses = async () => {
        try {
            const res = await apiRequest('/classes');
            setClasses(res.data.results || res.data);
        } catch (err) {
            console.error('Error fetching classes:', err);
        }
    };

    const getFeeTypes = async () => {
        try {
            const res = await apiRequest('/fee-types');
            setFeeTypes(res.data.results || res.data);
        } catch (err) {
            console.error('Error fetching fee types:', err);
        }
    };


    const handleSaveStructure = async () => {
        if (!newFeeStructure.class_assigned_id || !newFeeStructure.fee_type_id || !newFeeStructure.amount || !newFeeStructure.due_date) {
            toast.error("All fields are required.");
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
                toast.success("Fee structure updated!");
                setFeeStructures((prev) =>
                    prev.map((f) =>
                        f.id === editingStructure.id ? { ...f, amount: res.data.data.amount } : f
                    )
                );
            } else {
                const res = await axios.post(API_URL, newFeeStructure, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Fee structure created!");
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
            toast.error("Failed to save fee structure.");
        }
    };

    const handleDelete = (id) => {
        if (!canDelete) {
            toast.error("You do not have permission to delete fee structures.");
            return;
        }

        toast((t) => (
            <div>
                <p>Delete this Fee Structure?</p>
                <div className="flex justify-end mt-2">
                    <button
                        onClick={async () => {
                            try {
                                const token = Cookies.get("access_token");
                                await axios.delete(`${API_URL}${id}/`, {
                                    headers: { Authorization: `Bearer ${token}` },
                                });
                                setFeeStructures((prev) => prev.filter((f) => f.id !== id));
                                toast.success("Deleted successfully!");
                                toast.dismiss(t.id);
                            } catch {
                                toast.error("Failed to delete.");
                            }
                        }}
                        className="bg-red-500 text-white px-3 py-1 rounded mr-2"
                    >
                        Yes
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="bg-gray-500 text-white px-3 py-1 rounded"
                    >
                        No
                    </button>
                </div>
            </div>
        ));
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

    const permissions = Cookies.get("permissions")?.split(",") || [];

    const canAdd = permissions.includes("users.add_feestructure");
    const canEdit = permissions.includes("users.change_feestructure");
    const canDelete = permissions.includes("users.delete_feestructure");

    const canPerformActions = canEdit || canDelete;


    return (
        <div>
            <Toaster position="top-center" />
            <div className="bg-blue-900 text-white py-2 px-6 rounded-md flex justify-between items-center mt-5">
                <h1 className="text-xl font-bold">Manage Fee Structures</h1>
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
                        className="flex items-center px-3 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-500"
                    >
                        <div className="flex items-center justify-center w-8 h-8 bg-black rounded-full mr-3">
                            <span className="text-cyan-500 text-xl font-bold">
                                {showForm ? "-" : "+"}
                            </span>
                        </div>
                        {showForm ? "Close Form" : "Add Fee Structure"}
                    </button>
                )}

            </div>

            <div className="p-6">
                {showForm && canAdd && (
                    <div className="p-6 bg-blue-50 rounded-md mb-6">
                        <h2 className="text-lg font-semibold text-blue-900">
                            {editingStructure ? "Edit Fee Structure" : "Create Fee Structure"}
                        </h2>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <select
                                value={newFeeStructure.class_assigned_id}
                                onChange={(e) =>
                                    setNewFeeStructure({ ...newFeeStructure, class_assigned_id: parseInt(e.target.value) })
                                }
                                className="p-2 border border-gray-300 rounded"
                            >
                                <option value="">Select Class</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.class_name} {cls.section}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={newFeeStructure.fee_type_id}
                                onChange={(e) =>
                                    setNewFeeStructure({ ...newFeeStructure, fee_type_id: parseInt(e.target.value) })
                                }
                                className="p-2 border border-gray-300 rounded"
                            >
                                <option value="">Select Fee Type</option>
                                {feeTypes.map((ft) => (
                                    <option key={ft.id} value={ft.id}>
                                        {ft.name}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                placeholder="Amount"
                                value={newFeeStructure.amount}
                                onChange={(e) =>
                                    setNewFeeStructure({ ...newFeeStructure, amount: parseFloat(e.target.value) })
                                }
                                className="p-2 border border-gray-300 rounded"
                            />
                            <input
                                type="date"
                                value={newFeeStructure.due_date}
                                onChange={(e) =>
                                    setNewFeeStructure({ ...newFeeStructure, due_date: e.target.value })
                                }
                                className="p-2 border border-gray-300 rounded"
                            />
                            <label className="col-span-2">
                                <input
                                    type="checkbox"
                                    checked={newFeeStructure.is_active}
                                    onChange={(e) =>
                                        setNewFeeStructure({ ...newFeeStructure, is_active: e.target.checked })
                                    }
                                    className="mr-2"
                                />
                                Active
                            </label>
                        </div>
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={handleSaveStructure}
                                className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-700"
                            >
                                {editingStructure ? "Update" : "Save"}
                            </button>
                        </div>
                    </div>
                )}

                {feeStructures.length > 0 ? (
                    <div className="mt-6">
                        <Buttons data={feeStructures} columns={columns} filename="FeeStructures" />
                        <h2 className="text-lg font-semibold text-white bg-blue-900 px-4 py-2 rounded-t-md">
                            Fee Structures
                        </h2>
                        <table className="w-full border-collapse border border-gray-300 bg-white">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="border border-gray-300 p-2">#ID</th>
                                    <th className="border border-gray-300 p-2">School</th>
                                    <th className="border border-gray-300 p-2">Class</th>
                                    <th className="border border-gray-300 p-2">Section</th>
                                    <th className="border border-gray-300 p-2">Session</th>
                                    <th className="border border-gray-300 p-2">Fee Type</th>
                                    <th className="border border-gray-300 p-2">Amount</th>
                                    <th className="border border-gray-300 p-2">Due Date</th>
                                    <th className="border border-gray-300 p-2">Active</th>
                                    {canPerformActions && (
                                        <th className="border border-gray-300 p-2">Actions</th>
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {feeStructures.map((f) => (
                                    <tr key={f.id}>
                                        <td className="border border-gray-300 p-2 text-center">{f.id}</td>
                                        <td className="border border-gray-300 p-2">{f.school}</td>
                                        <td className="border border-gray-300 p-2">{f.class_name}</td>
                                        <td className="border border-gray-300 p-2">{f.class_section}</td>
                                        <td className="border border-gray-300 p-2">{f.class_session}</td>
                                        <td className="border border-gray-300 p-2">{f.fee_type}</td>
                                        <td className="border border-gray-300 p-2">{f.amount}</td>
                                        <td className="border border-gray-300 p-2">{f.due_date}</td>
                                        <td className="border border-gray-300 p-2 text-center">
                                            {f.is_active ? "✅" : "❌"}
                                        </td>
                                        {canPerformActions && (
                                            <td className="border border-gray-300 p-2 flex justify-center">
                                                {canEdit && (
                                                    <MdEdit
                                                        onClick={() => handleEdit(f)}
                                                        className="text-yellow-500 text-2xl cursor-pointer mx-2 hover:text-yellow-700"
                                                    />
                                                )}
                                                {canDelete && (
                                                    <MdDelete
                                                        onClick={() => handleDelete(f.id)}
                                                        className="text-red-500 text-2xl cursor-pointer mx-2 hover:text-red-700"
                                                    />
                                                )}
                                            </td>
                                        )}

                                    </tr>
                                ))}
                            </tbody>


                        </table>
                        <div className="flex justify-between items-center bg-blue-50 p-4 rounded-b-md mt-2">
                            {/* Page Size Selector */}
                            <div className="flex items-center gap-2">
                                <label className="text-gray-700 font-semibold">Page Size:</label>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="border rounded-md px-3 py-1"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                </select>
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={page === 1}
                                    className={`px-3 py-1 rounded-md font-semibold ${page === 1
                                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                        : "bg-white hover:bg-gray-100"
                                        }`}
                                >
                                    Prev
                                </button>

                                <span className="px-3 py-1 bg-blue-600 text-white font-bold rounded-md">{page}</span>

                                <button
                                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={page === totalPages}
                                    className={`px-3 py-1 rounded-md font-semibold ${page === totalPages
                                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                        : "bg-white hover:bg-gray-100"
                                        }`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-gray-500">No fee structures available.</p>
                )}
            </div>
        </div>
    );
};

export default FeeStructures;
