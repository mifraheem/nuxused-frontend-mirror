import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { MdDelete } from "react-icons/md";
import { Buttons } from "../../components";
import apiRequest from "../../helpers/apiRequest";

const LatePaymentFines = () => {
    const [fines, setFines] = useState([]);
    const [classes, setClasses] = useState([]);
    const [studentsForClass, setStudentsForClass] = useState([]);
    const [formData, setFormData] = useState({
        class_id: "",
        student_id: "",
        amount: "",
        reason: "",
    });
    const [showForm, setShowForm] = useState(false);


    const fetchFines = async () => {
        try {
            const res = await apiRequest("/late-payment-fines/");
            setFines(res.data?.data?.results || []);
        } catch (err) {
            toast.error("Failed to fetch fines.");
            console.error("Fetch fines error:", err.response?.data || err.message);
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

    const handleSaveFine = async () => {
        const { class_id, student_id, amount, reason } = formData;

        if (!class_id) {
            toast.error("Please select a class.");
            return;
        }
        if (!student_id) {
            toast.error("Please select a student.");
            return;
        }
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            toast.error("Please enter a valid positive amount.");
            return;
        }
        if (!reason.trim()) {
            toast.error("Please provide a reason.");
            return;
        }

        const payload = {
            student_id: Number(student_id),
            amount: Number(parseFloat(amount).toFixed(2)),
            reason: reason.trim(),
        };

        try {
            console.log("Sending payload:", payload); // Debug payload
            await apiRequest("/late-payment-fines/", "POST", payload);
            toast.success("Late payment fine added!");
            setFormData({ class_id: "", student_id: "", amount: "", reason: "" });
            setStudentsForClass([]);
            setShowForm(false);
            fetchFines();
        } catch (err) {
            const errorMessage =
                err.message ||
                Object.entries(err.data || {})
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(", ") ||
                "Failed to save fine.";
            console.error("Save error:", err, err.data);
            toast.error(errorMessage);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this fine?")) return;

        try {
            await apiRequest(`/late-payment-fines/${id}/`, "DELETE");
            toast.success("Fine deleted!");
            fetchFines();
        } catch (err) {
            const errorMessage = err.message || "Failed to delete fine.";
            console.error("Delete error:", err, err.data);
            toast.error(errorMessage);
        }
    };

    useEffect(() => {
        fetchFines();
        getClasses();
    }, []);

    const columns = [
        { label: "Student", key: "student_name" },
        { label: "Amount", key: "amount" },
        { label: "Date", key: "applied_date" },
        { label: "Reason", key: "reason" },
    ];

    return (
        <div>
            <Toaster position="top-center" />
            <div className="bg-blue-900 text-white py-2 px-6 rounded-md flex justify-between items-center mt-5">
                <h1 className="text-xl font-bold">Manage Late Payment Fines</h1>
                <button
                    onClick={() => {
                        setShowForm(!showForm);
                        setFormData({ class_id: "", student_id: "", amount: "", reason: "" });
                        setStudentsForClass([]);
                    }}
                    className="flex items-center px-3 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-500"
                >
                    <span className="text-xl font-bold mr-2">{showForm ? "-" : "+"}</span>
                    {showForm ? "Close Form" : "Add Fine"}
                </button>
            </div>

            <div className="p-6">
                {showForm && (
                    <div className="p-6 bg-blue-50 rounded-md mb-6">
                        <h2 className="text-lg font-semibold text-blue-900">Create Late Payment Fine</h2>
                        <div className="grid grid-cols-2 gap-4 mt-4">
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
                                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                className="p-2 border border-gray-300 rounded"
                            >
                                <option value="">Select Student</option>
                                {studentsForClass.map((s) => (
                                    <option key={s.std_id} value={s.std_id}>
                                        {s.username}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="Fine Amount"
                                className="p-2 border border-gray-300 rounded"
                                min="0"
                                step="0.01"
                            />
                            <input
                                type="text"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                placeholder="Reason"
                                className="col-span-2 p-2 border border-gray-300 rounded"
                            />
                        </div>
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={handleSaveFine}
                                className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                )}

                {fines.length > 0 ? (
                    <div className="mt-6">
                        <Buttons data={fines} columns={columns} filename="LatePaymentFines" />
                        <h2 className="text-lg font-semibold text-white bg-blue-900 px-4 py-2 rounded-t-md">
                            Late Payment Fines
                        </h2>
                        <table className="w-full border-collapse border border-gray-300 bg-white">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="border border-gray-300 p-2">#ID</th>
                                    {columns.map((col) => (
                                        <th key={col.key} className="border border-gray-300 p-2">
                                            {col.label}
                                        </th>
                                    ))}
                                    <th className="border border-gray-300 p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fines.map((f) => (
                                    <tr key={f.id}>
                                        <td className="border border-gray-300 p-2 text-center">{f.id}</td>
                                        {columns.map((col) => (
                                            <td key={col.key} className="border border-gray-300 p-2 text-center">
                                                {String(f[col.key] || "-")}
                                            </td>
                                        ))}
                                        <td className="border border-gray-300 p-2 text-center">
                                            <MdDelete
                                                onClick={() => handleDelete(f.id)}
                                                className="text-red-500 text-2xl cursor-pointer hover:text-red-700"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500">No fines available.</p>
                )}
            </div>
        </div>
    );
};

export default LatePaymentFines;