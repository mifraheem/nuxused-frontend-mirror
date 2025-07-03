import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { MdEdit,MdDelete } from "react-icons/md";
import { Buttons } from "../../components";
import apiRequest from "../../helpers/apiRequest";

const FeeDiscounts = () => {
    const [discounts, setDiscounts] = useState([]);
    const [classes, setClasses] = useState([]);
    const [studentsForClass, setStudentsForClass] = useState([]);
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        class_id: "",
        student_id: "",
        amount: "",
        reason: "",
    });
const API = import.meta.env.VITE_SERVER_URL;

    const API_URL = `${API}fee-discounts/`;

    const fetchDiscounts = async () => {
        try {
            const res = await apiRequest("/fee-discounts/");
            setDiscounts(res.data?.results || []);
        } catch (err) {
            toast.error("Failed to fetch fee discounts.");
            console.error("Fetch discounts error:", err.response?.data || err.message);
        }
    };

    const getClasses = async () => {
        try {
            const res = await apiRequest("/classes/");
            setClasses(res.data?.results || res.data || []);
        } catch (err) {
            toast.error("Failed to fetch classes.");
            console.error("Fetch classes error:", err.response?.data || err.message);
        }
    };

    const handleClassChange = async (classId) => {
        setFormData((prev) => ({ ...prev, class_id: classId, student_id: "" }));
        if (!classId) {
            setStudentsForClass([]);
            return;
        }

        try {
            const res = await apiRequest(`/classes/${classId}/students/`);
            setStudentsForClass(res.data?.results || []);
        } catch (err) {
            toast.error("Failed to load students.");
            console.error("Fetch students error:", err.response?.data || err.message);
            setStudentsForClass([]);
        }
    };

    const handleSaveDiscount = async () => {
        const studentId = parseInt(formData.student_id);
        const amount = parseFloat(formData.amount);
        const reason = formData.reason.trim();

        if (!studentId && !editingDiscount) {
            toast.error("Please select a student.");
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid positive amount.");
            return;
        }
        if (!reason) {
            toast.error("Please provide a reason.");
            return;
        }

        const payload = editingDiscount
            ? { amount: Number(amount.toFixed(2)), reason }
            : { student_id: studentId, amount: Number(amount.toFixed(2)), reason };

        try {
            console.log("Sending payload:", payload); // Debug payload
            if (editingDiscount) {
                await apiRequest(`/fee-discounts/${editingDiscount.id}/`, "PUT", payload);
                toast.success("Discount updated!");
            } else {
                await apiRequest("/fee-discounts/", "POST", payload);
                toast.success("Discount added!");
            }

            setFormData({ class_id: "", student_id: "", amount: "", reason: "" });
            setEditingDiscount(null);
            setShowForm(false);
            setStudentsForClass([]);
            fetchDiscounts();
        } catch (err) {
            const errorMessage =
                err.response?.data?.detail ||
                err.response?.data?.non_field_errors?.[0] ||
                Object.values(err.response?.data || {})[0] ||
                "Failed to save discount.";
            console.error("Save error:", err.response?.data || err.message, err);
            toast.error(errorMessage);
        }
    };

    const handleEdit = async (discount) => {
        setEditingDiscount(discount);
        setFormData({
            class_id: "",
            student_id: discount.student_id,
            amount: discount.amount,
            reason: discount.reason,
        });
        setShowForm(true);
        if (discount.class_id) {
            await handleClassChange(discount.class_id);
        }
    };

    const handleDelete = async (id) => {
        toast(
            (t) => (
                <div>
                    <p className="text-gray-800">Are you sure you want to delete this discount?</p>
                    <div className="flex justify-end mt-2">
                        <button
                            onClick={async () => {
                                try {
                                    await apiRequest(`/fee-discounts/${id}/`, "DELETE");
                                    toast.success("Discount deleted successfully!");
                                    fetchDiscounts();
                                    toast.dismiss(t.id);
                                } catch (err) {
                                    const errorMessage =
                                        err.response?.data?.detail || "Failed to delete discount.";
                                    console.error("Delete error:", err.response?.data || err.message);
                                    toast.error(errorMessage);
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
            ),
            { duration: 5000 }
        );
    };


    useEffect(() => {
        fetchDiscounts();
        getClasses();
    }, []);

    const columns = [
        { label: "Student", key: "student_name" },
        { label: "Amount", key: "amount" },
        { label: "Reason", key: "reason" },
    ];

    return (
        <div>
            <Toaster position="top-center" />
            <div className="bg-blue-900 text-white py-2 px-6 rounded-md flex justify-between items-center mt-5">
                <h1 className="text-xl font-bold">Manage Fee Discounts</h1>
                <button
                    onClick={() => {
                        setShowForm(!showForm);
                        setEditingDiscount(null);
                        setFormData({ class_id: "", student_id: "", amount: "", reason: "" });
                        setStudentsForClass([]);
                    }}
                    className="flex items-center px-3 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-500"
                >
                    <span className="text-xl font-bold mr-2">{showForm ? "-" : "+"}</span>
                    {showForm ? "Close Form" : "Add Discount"}
                </button>
            </div>

            <div className="p-6">
                {showForm && (
                    <div className="p-6 bg-blue-50 rounded-md mb-6">
                        <h2 className="text-lg font-semibold text-blue-900">
                            {editingDiscount ? "Update Discount" : "Create Fee Discount"}
                        </h2>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {!editingDiscount && (
                                <>
                                    <select
                                        value={formData.class_id}
                                        onChange={(e) => handleClassChange(e.target.value)}
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
                                        value={formData.student_id}
                                        onChange={(e) =>
                                            setFormData({ ...formData, student_id: parseInt(e.target.value) })
                                        }
                                        className="p-2 border border-gray-300 rounded"
                                    >
                                        <option value="">Select Student</option>
                                        {studentsForClass.map((s) => (
                                            <option key={s.std_id} value={s.std_id}>
                                                {s.username}
                                            </option>
                                        ))}
                                    </select>
                                </>
                            )}

                            {editingDiscount && (
                                <div className="col-span-2 text-blue-900">
                                    <strong>Student:</strong> {editingDiscount.student_name}
                                </div>
                            )}

                            <input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="Discount Amount"
                                className="p-2 border border-gray-300 rounded"
                                min="0"
                                step="0.01"
                            />
                            <input
                                type="text"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                placeholder="Reason"
                                className="p-2 border border-gray-300 rounded"
                            />
                        </div>
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={handleSaveDiscount}
                                className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-700"
                            >
                                {editingDiscount ? "Update" : "Save"}
                            </button>
                        </div>
                    </div>
                )}

                {discounts.length > 0 ? (
                    <div className="mt-6">
                        <Buttons data={discounts} columns={columns} filename="FeeDiscounts" />
                        <h2 className="text-lg font-semibold text-white bg-blue-900 px-4 py-2 rounded-t-md">
                            Fee Discounts
                        </h2>
                        <table className="w-full border-collapse border border-gray-300 bg-white">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="border border-gray-300 p-2">#ID</th>
                                    <th className="border border-gray-300 p-2">Student</th>
                                    <th className="border border-gray-300 p-2">Amount</th>
                                    <th className="border border-gray-300 p-2">Reason</th>
                                    <th className="border border-gray-300 p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {discounts.map((d) => (
                                    <tr key={d.id}>
                                        <td className="border border-gray-300 p-2 text-center">{d.id}</td>
                                        <td className="border border-gray-300 p-2">{d.student_name}</td>
                                        <td className="border border-gray-300 p-2">{d.amount}</td>
                                        <td className="border border-gray-300 p-2">{d.reason}</td>
                                        <td className="border border-gray-300 p-2 text-center flex gap-2 justify-center">
                                            <MdEdit
                                                onClick={() => handleEdit(d)}
                                                className="text-yellow-500 text-2xl cursor-pointer hover:text-yellow-700"
                                            />
                                            <MdDelete
                                                onClick={() => handleDelete(d.id)}
                                                className="text-red-500 text-2xl cursor-pointer hover:text-red-700"
                                            />

                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500">No fee discounts available.</p>
                )}
            </div>
        </div>
    );
};

export default FeeDiscounts;