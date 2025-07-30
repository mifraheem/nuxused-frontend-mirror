import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { MdDelete, MdVisibility } from "react-icons/md";
import { Buttons } from "../../components";
import Select from "react-select"

const FeePayments = () => {
    const [students, setStudents] = useState([]);
    const [studentFees, setStudentFees] = useState([]);
    const [payments, setPayments] = useState([]);
    const [viewModalData, setViewModalData] = useState(null);
    const [formData, setFormData] = useState({
        student_id: "",
        student_fee_id: "",
        amount_paid: "",
        payment_date: "",
        payment_method: "cash",
        reference_number: "",
        discount_amount: "",
        late_fine_amount: "",
    });
    const [showForm, setShowForm] = useState(false);
    const [editingPaymentId, setEditingPaymentId] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const API = import.meta.env.VITE_SERVER_URL;

    const API_URL = `${API}fee-payments/`;
    const STUDENT_FEES_URL = `${API}student-fees/`;

    const getStudents = async () => {
        try {
            const token = Cookies.get("access_token");
            if (!token) {
                throw new Error("No access token found. Please log in.");
            }
            const res = await axios.get(`${API}api/auth/users/list_profiles/student/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Student list response:", res.data);
            setStudents(res.data?.data?.results || []);
        } catch (error) {
            console.error("Error fetching students:", error);
            toast.error("Failed to fetch students.");
        }
    };

    const getStudentFeeById = async (studentId) => {
        try {
            const token = Cookies.get("access_token");
            if (!token) {
                throw new Error("No access token found. Please log in.");
            }
            console.log("Fetching fees for studentId:", studentId);
            const res = await axios.get(`${STUDENT_FEES_URL}${studentId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Fee response:", res.data);
            const result = Array.isArray(res.data.data) ? res.data.data : [];
            setStudentFees(result);
        } catch (error) {
            console.error("Error fetching fees:", error.response?.data);
            toast.error(error.response?.data?.message || "Failed to fetch selected student's fee types.");
            setStudentFees([]);
        }
    };

    const fetchPayments = async () => {
        try {
            const token = Cookies.get("access_token");
            if (!token) {
                throw new Error("No access token found. Please log in.");
            }
            const res = await axios.get(`${API_URL}?page=${page}&page_size=${pageSize}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = res.data?.data || {};
            if (Array.isArray(data.results)) {
                setPayments(data.results);
                setTotalPages(data.total_pages || 1);
            } else {
                throw new Error("Unexpected API response format.");
            }
        } catch (error) {
            console.error("Error fetching payments:", error);
            toast.error("Failed to fetch payment records.");
        }
    };

    const resetForm = () => {
        setFormData({
            student_id: "",
            student_fee_id: "",
            amount_paid: "",
            payment_date: "",
            payment_method: "cash",
            reference_number: "",
            discount_amount: "",
            late_fine_amount: "",
        });
        setEditingPaymentId(null);
        setShowForm(false);
        setStudentFees([]);
    };

    const handleSavePayment = async () => {
        const {
            student_id,
            student_fee_id,
            amount_paid,
            payment_date,
            payment_method,
            reference_number,
            discount_amount,
            late_fine_amount,
        } = formData;

        if (!student_id || !student_fee_id || !amount_paid || !payment_date || !payment_method) {
            toast.error("All required fields are required.");
            return;
        }

        const payload = {
            student_id: parseInt(student_id),
            student_fee_id: parseInt(student_fee_id),
            amount_paid: parseFloat(amount_paid),
            payment_method,
            payment_date,
            discount_amount: discount_amount ? parseFloat(discount_amount) || 0 : 0,
            ...(reference_number?.trim() && { reference_number: reference_number.trim() }),
            late_fine_amount: late_fine_amount ? parseFloat(late_fine_amount) || 0 : 0,
        };

        try {
            const token = Cookies.get("access_token");
            console.log("Sending payment payload:", payload);
            if (editingPaymentId) {
                const res = await axios.put(`${API_URL}${editingPaymentId}/`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success(res.data.message || "Payment updated successfully!");
            } else {
                const res = await axios.post(API_URL, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success(res.data.message || "Payment created successfully!");
            }
            fetchPayments();
            getStudentFeeById(formData.student_id);
            resetForm();
        } catch (error) {
            console.error("Error saving payment:", error.response?.data);
            toast.error(error.response?.data?.message || "Failed to save payment.");
        }
    };

    const handleDelete = (id) => {
        toast.custom((t) => (
            <div className="bg-white p-4 rounded shadow-lg border w-80">
                <p className="text-gray-800 mb-2">Are you sure you want to delete?</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={async () => {
                            try {
                                const token = Cookies.get("access_token");
                                await axios.delete(`${API_URL}${id}/`, {
                                    headers: { Authorization: `Bearer ${token}` },
                                });
                                toast.dismiss(t.id);
                                toast.success("Payment deleted.");
                                fetchPayments();
                            } catch {
                                toast.error("Delete failed.");
                            }
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Yes
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                    >
                        No
                    </button>
                </div>
            </div>
        ));
    };

    useEffect(() => {
        getStudents();
        fetchPayments();
    }, [page, pageSize]);

    const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");

    const canAdd = permissions.includes("users.add_feepayment");
    const canDelete = permissions.includes("users.delete_feepayment");
    const canEdit = permissions.includes("users.change_feepayment");


    return (
        <div className="p-6">
            <Toaster position="top-center" />
            <div className="bg-blue-900 text-white py-2 px-6 rounded-md flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">Manage Fee Payments</h1>
                {canAdd && (
                    <button
                        onClick={() => (showForm ? resetForm() : setShowForm(true))}
                        className="flex items-center px-3 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-500"
                    >
                        <span className="text-xl font-bold mr-2">{showForm ? "-" : "+"}</span>
                        {showForm ? "Close Form" : "Add Payment"}
                    </button>
                )}

            </div>


            {showForm && canAdd && (
                <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 max-w-3xl mx-auto mb-6">
                    <h2 className="text-xl font-semibold text-blue-800 mb-4">
                        {editingPaymentId ? "Update Fee Payment" : "Create Fee Payment"}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Student Dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                            <Select
                                value={students.find(s => s.profile_id === Number(formData.student_id)) || null}
                                onChange={(selected) => {
                                    const id = selected?.profile_id || "";
                                    setFormData({ ...formData, student_id: id, student_fee_id: "", amount_paid: "" });
                                    if (id) getStudentFeeById(id);
                                    else setStudentFees([]);
                                }}
                                options={students}
                                getOptionLabel={(s) => `${s.first_name} ${s.last_name} (ID: ${s.profile_id})`}
                                getOptionValue={(s) => s.profile_id}
                                placeholder="Search or select student"
                                isClearable
                            />
                        </div>

                        {/* Fee Dropdown */}
                        {formData.student_id && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Fee</label>
                                <Select
                                    value={studentFees.find(f => f.id === Number(formData.student_fee_id)) || null}
                                    onChange={(selected) => {
                                        setFormData({
                                            ...formData,
                                            student_fee_id: selected?.id || "",
                                            amount_paid: selected?.net_payable?.toString() || ""
                                        });
                                    }}
                                    options={studentFees.filter(f => !f.is_paid)}
                                    getOptionLabel={(f) => `${f.fee_type} – ${f.net_payable} PKR`}
                                    getOptionValue={(f) => f.id}
                                    placeholder="Search or select fee"
                                    isClearable
                                />
                            </div>
                        )}

                        {/* Amount Paid */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                            <input
                                type="number"
                                value={formData.amount_paid}
                                onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                                placeholder="e.g. 1000"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Payment Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                            <input
                                type="date"
                                value={formData.payment_date}
                                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                            <select
                                value={formData.payment_method}
                                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="cash">Cash</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="easypaisa">Easypaisa</option>
                                <option value="jazzcash">JazzCash</option>
                            </select>
                        </div>

                        {/* Reference Number */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number (Optional)</label>
                            <input
                                type="text"
                                value={formData.reference_number}
                                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                                placeholder="e.g. TXN123456"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Discount Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Amount (Optional)</label>
                            <input
                                type="number"
                                value={formData.discount_amount}
                                onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                                placeholder="e.g. 200"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Late Fine */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Late Fine (Optional)</label>
                            <input
                                type="number"
                                value={formData.late_fine_amount}
                                onChange={(e) => setFormData({ ...formData, late_fine_amount: e.target.value })}
                                placeholder="e.g. 50"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <button
                            onClick={resetForm}
                            className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded-md shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSavePayment}
                            className="bg-green-600 hover:bg-green-800 text-white px-6 py-2 rounded-md shadow-sm"
                        >
                            {editingPaymentId ? "Update Payment" : "Save Payment"}
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-8">
                <Buttons
                    data={payments.map((p) => ({
                        Student: p.student_name,
                        "Fee Type": p.fee_type,
                        Class: p.class_name,
                        Section: p.section,
                        Session: p.session,
                        "Amount Paid": `${p.amount_paid} PKR`,
                        Discount: `${p.applied_discount || 0} PKR`,
                        "Late Fine": `${p.applied_late_fine || 0} PKR`,
                        "Total Paid": `${p.total_paid || 0} PKR`,
                        "Remaining Balance": `${p.remaining_balance || 0} PKR`,
                        "Payment Date": p.payment_date,
                    }))}
                    columns={[
                        { label: "Student", key: "Student" },
                        { label: "Fee Type", key: "Fee Type" },
                        { label: "Class", key: "Class" },
                        { label: "Section", key: "Section" },
                        { label: "Session", key: "Session" },
                        { label: "Amount Paid", key: "Amount Paid" },
                        { label: "Discount", key: "Discount" },
                        { label: "Late Fine", key: "Late Fine" },
                        { label: "Total Paid", key: "Total Paid" },
                        { label: "Remaining Balance", key: "Remaining Balance" },
                        { label: "Payment Date", key: "Payment Date" },
                    ]}
                    filename="Fee_Payment_Records"
                />

                <h2 className="text-lg font-semibold text-white px-4 py-2 rounded-t-lg bg-blue-900">Payment Records</h2>
                <table className="w-full border border-gray-300">
                    <thead className="bg-gray-300">
                        <tr>
                            <th className="border p-2">Student</th>
                            <th className="border p-2">Fee Type</th>
                            <th className="border p-2">Class</th>
                            <th className="border p-2">Section</th>
                            <th className="border p-2">Session</th>
                            <th className="border p-2">Amount Paid</th>
                            <th className="border p-2">Discount</th>
                            <th className="border p-2">Late Fine</th>
                            <th className="border p-2">Status</th>
                            <th className="border p-2">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="bg-white">
                        {payments.length > 0 ? (
                            payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td className="border p-2 text-center">{payment.student_name || "—"}</td>
                                    <td className="border p-2 text-center">{payment.fee_type || "—"}</td>
                                    <td className="border p-2 text-center">{payment.class_name || "—"}</td>
                                    <td className="border p-2 text-center">{payment.section || "—"}</td>
                                    <td className="border p-2 text-center">{payment.session || "—"}</td>
                                    <td className="border p-2 text-center">{payment.amount_paid}</td>
                                    <td className="border p-2 text-center">{payment.applied_discount || 0}</td>
                                    <td className="border p-2 text-center">{payment.applied_late_fine || 0}</td>
                                    <td className="border p-2 text-center">
                                        {payment.is_fully_paid ? "✅ Paid" : "❌ Partial"}
                                    </td>
                                    <td className="border p-2 text-center flex gap-2 justify-center">
                                        <button onClick={() => setViewModalData(payment)} className="text-blue-600 hover:text-blue-800">
                                            <MdVisibility size={20} />
                                        </button>
                                        {/* Optional delete/edit buttons */}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="15" className="border p-4 text-center text-gray-500">
                                    No payment records available.
                                </td>
                            </tr>
                        )}
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

                    {/* Pagination Buttons */}
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

            {viewModalData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-300 p-8">

                        {/* Header */}
                        <div className="border-b pb-4 mb-6">
                            <h3 className="text-2xl font-bold text-center text-blue-700">📄 Fee Payment Details</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm text-gray-700">

                            {/* Student Info */}
                            <div className="col-span-2 font-semibold text-blue-900 border-b pb-2">👤 Student Information</div>
                            <div><span className="font-semibold">Name:</span> {viewModalData.student_name}</div>
                            <div><span className="font-semibold">Fee Type:</span> {viewModalData.fee_type}</div>
                            <div><span className="font-semibold">Class:</span> {viewModalData.class_name || "—"}</div>
                            <div><span className="font-semibold">Section:</span> {viewModalData.section || "—"}</div>
                            <div><span className="font-semibold">Session:</span> {viewModalData.session || "—"}</div>

                            {/* Payment Info */}
                            <div className="col-span-2 font-semibold text-blue-900 border-b pt-5 pb-2">💵 Payment Information</div>
                            <div><span className="font-semibold">Amount Paid:</span> {viewModalData.amount_paid} PKR</div>
                            <div><span className="font-semibold">Discount:</span> {viewModalData.applied_discount || "0"} PKR</div>
                            <div><span className="font-semibold">Late Fine:</span> {viewModalData.applied_late_fine || "0"} PKR</div>
                            <div><span className="font-semibold">Total Paid:</span> {viewModalData.total_paid} PKR</div>
                            <div><span className="font-semibold">Remaining:</span> {viewModalData.remaining_balance} PKR</div>
                            <div><span className="font-semibold">Payment Date:</span> {viewModalData.payment_date || "—"}</div>
                            <div><span className="font-semibold">Payment Method:</span> {viewModalData.payment_method}</div>
                            <div><span className="font-semibold">Reference #:</span> {viewModalData.reference_number || "—"}</div>

                            {/* Status */}
                            <div className="col-span-2 pt-4">
                                <span className="font-semibold">Status:</span>{" "}
                                {viewModalData.is_fully_paid ? (
                                    <span className="text-green-600 font-bold">✅ Fully Paid</span>
                                ) : (
                                    <span className="text-red-600 font-bold">❌ Partial Payment</span>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-8 flex justify-center">
                            <button
                                onClick={() => setViewModalData(null)}
                                className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium shadow hover:bg-blue-700 transition"
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

export default FeePayments;