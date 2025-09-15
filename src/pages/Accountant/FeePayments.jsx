import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdDelete, MdVisibility } from "react-icons/md";
import { Buttons } from "../../components";
import Select from "react-select";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster"; // Import the provided Toaster component

const FeePayments = () => {
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [studentFees, setStudentFees] = useState([]);
    const [payments, setPayments] = useState([]);
    const [viewModalData, setViewModalData] = useState(null);
    const [formData, setFormData] = useState({
        class_id: "",
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
    const [isLoadingClasses, setIsLoadingClasses] = useState(false);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [isLoadingFees, setIsLoadingFees] = useState(false);
    const [toaster, setToaster] = useState({ message: "", type: "success", onConfirm: null, onCancel: null });

    const API = import.meta.env.VITE_SERVER_URL;
    const API_URL = `${API}fee-payments/`;
    const CLASSES_URL = `${API}classes/`;

    const showToast = (message, type = "success", onConfirm = null, onCancel = null) => {
        setToaster({ message, type, onConfirm, onCancel });
    };

    const isValidUUID = (str) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
    };

    const getClasses = async () => {
        try {
            setIsLoadingClasses(true);
            const token = Cookies.get("access_token");
            if (!token) {
                throw new Error("No access token found. Please log in.");
            }
            console.log("Fetching classes from:", CLASSES_URL);
            const res = await axios.get(CLASSES_URL, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Classes response:", res.data);
            const classData = res.data?.data?.results || res.data.results || res.data || [];
            setClasses(classData);
            console.log("Classes set:", classData);
            if (classData.length === 0) {
                showToast("No classes found in the backend.", "error", null, null);
            }
        } catch (error) {
            console.error("Error fetching classes:", error.response?.data || error.message);
            showToast(
                error.response?.data?.message || "Failed to fetch classes from backend.",
                "error",
                null,
                null
            );
            setClasses([]);
        } finally {
            setIsLoadingClasses(false);
        }
    };

    const getStudents = async (classId) => {
        if (!classId) {
            setStudents([]);
            return;
        }
        try {
            setIsLoadingStudents(true);
            const token = Cookies.get("access_token");
            if (!token) {
                throw new Error("No access token found. Please log in.");
            }
            const url = `${API}classes/${classId}/students/`;
            console.log("Fetching students from:", url);
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Students response:", res.data);
            const studentData = res.data?.data?.results || res.data.results || res.data || [];
            setStudents(studentData);
            console.log("Students set:", studentData);
            if (studentData.length === 0) {
                showToast("No students found for this class.", "error", null, null);
            }
        } catch (error) {
            console.error("Error fetching students:", error.response?.data || error.message);
            showToast(
                error.response?.data?.message || "Failed to fetch students for this class.",
                "error",
                null,
                null
            );
            setStudents([]);
        } finally {
            setIsLoadingStudents(false);
        }
    };

    const getStudentFeeById = async (studentId) => {
        if (!studentId) {
            setStudentFees([]);
            return;
        }
        try {
            setIsLoadingFees(true);
            const token = Cookies.get("access_token");
            if (!token) {
                throw new Error("No access token found. Please log in.");
            }
            const url = `${API}student-fees/${studentId}/by-student/`;
            console.log("Fetching fees from:", url);
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Fee response:", res.data);
            const result = res.data?.data || [];
            setStudentFees(result);
            console.log("Fees set:", result);
            if (result.length === 0) {
                showToast("No fees found for selected student.", "error", null, null);
            }
        } catch (error) {
            console.error("Error fetching fees:", error.response?.data || error.message);
            showToast(
                error.response?.data?.message || "Failed to fetch selected student's fee types.",
                "error",
                null,
                null
            );
            setStudentFees([]);
        } finally {
            setIsLoadingFees(false);
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
            console.log("Payments response:", res.data);
            const data = res.data?.data || res.data || {};
            if (Array.isArray(data.results)) {
                setPayments(data.results);
                setTotalPages(data.total_pages || 1);
            } else {
                throw new Error("Unexpected API response format.");
            }
        } catch (error) {
            console.error("Error fetching payments:", error.response?.data || error.message);
            showToast(
                error.response?.data?.message || "Failed to fetch payment records from backend.",
                "error",
                null,
                null
            );
        }
    };

    const resetForm = () => {
        setFormData({
            class_id: "",
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
        setStudents([]);
    };

    const handleSavePayment = async () => {
        const {
            class_id,
            student_id,
            student_fee_id,
            amount_paid,
            payment_date,
            payment_method,
            reference_number,
            discount_amount,
            late_fine_amount,
        } = formData;

        if (!class_id || !student_id || !student_fee_id || !amount_paid || !payment_date || !payment_method) {
            showToast("All required fields are required, including class.", "error", null, null);
            return;
        }

        if (!isValidUUID(class_id) || !isValidUUID(student_id) || !isValidUUID(student_fee_id)) {
            showToast("Invalid UUID format for class, student, or fee.", "error", null, null);
            return;
        }

        const payload = {
            class_id,
            student_id,
            student_fee_id,
            amount_paid: parseFloat(amount_paid),
            payment_method,
            payment_date,
            ...(reference_number?.trim() && { reference_number: reference_number.trim() }),
            ...(discount_amount ? { discount_amount: parseFloat(discount_amount) } : {}),
            ...(late_fine_amount ? { late_fine_amount: parseFloat(late_fine_amount) } : {}),
        };

        try {
            const token = Cookies.get("access_token");
            if (!token) {
                throw new Error("No access token found. Please log in.");
            }
            console.log("Form data before submission:", formData);
            console.log("Sending payment payload:", payload);
            if (editingPaymentId) {
                const res = await axios.put(`${API_URL}${editingPaymentId}/`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                showToast(res.data.message || "Payment updated successfully!", "success", null, null);
            } else {
                const res = await axios.post(API_URL, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                showToast(res.data.message || "Payment created successfully!", "success", null, null);
            }
            fetchPayments();
            if (formData.student_id) getStudentFeeById(formData.student_id);
            resetForm();
        } catch (error) {
            console.error("Error saving payment:", error.response?.data || error.message);
            if (error.response?.status === 400 && error.response?.data?.message) {
                showToast(error.response.data.message, "error", null, null);
            } else {
                showToast(error.response?.data?.message || "Failed to save payment.", "error", null, null);
            }
        }
    };

    const handleDelete = (id) => {
        if (!canDelete) {
            showToast("You do not have permission to delete fee payments.", "error", null, null);
            return;
        }

        showToast(
            "Are you sure you want to delete this payment?",
            "confirmation",
            async () => {
                try {
                    const token = Cookies.get("access_token");
                    if (!token) {
                        throw new Error("No access token found. Please log in.");
                    }
                    await axios.delete(`${API_URL}${id}/`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    showToast("Payment deleted successfully.", "success", null, null);
                    fetchPayments();
                } catch (error) {
                    console.error("Error deleting payment:", error.response?.data || error.message);
                    showToast(
                        error.response?.data?.message || "Failed to delete payment.",
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

    useEffect(() => {
        getClasses();
        fetchPayments();
        console.log("Classes state after fetch:", classes);
    }, [page, pageSize]);

    const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
    const canAdd = permissions.includes("users.add_feepayment");
    const canDelete = permissions.includes("users.delete_feepayment");
    const canEdit = permissions.includes("users.change_feepayment");

    const selectStyles = {
        control: (provided) => ({
            ...provided,
            minHeight: "2rem",
            fontSize: "0.75rem",
        }),
        menu: (provided) => ({
            ...provided,
            fontSize: "0.75rem",
            maxHeight: "200px",
            overflowY: "auto",
        }),
        option: (provided) => ({
            ...provided,
            fontSize: "0.75rem",
            padding: "0.5rem",
        }),
    };

    return (
        <div className="p-2">
            <Toaster
                message={toaster.message}
                type={toaster.type}
                duration={3000}
                onClose={() => setToaster({ message: "", type: "success", onConfirm: null, onCancel: null })}
                onConfirm={toaster.onConfirm}
                onCancel={toaster.onCancel}
                allowNoDataErrors={true}
            />
            <div className="bg-blue-900 text-white py-1 px-2 rounded-md flex justify-between items-center mt-2">
                <h1 className="text-lg font-bold">Manage Fee Payments</h1>
                {canAdd && (
                    <button
                        onClick={() => (showForm ? resetForm() : setShowForm(true))}
                        className="flex items-center px-2 py-1 bg-cyan-400 text-white font-semibold rounded-md shadow-md hover:bg-cyan-500 text-sm"
                    >
                        <span className="text-base font-bold mr-1">{showForm ? "-" : "+"}</span>
                        {showForm ? "Close Form" : "Add Payment"}
                    </button>
                )}
            </div>

            {showForm && canAdd && (
                <div className="p-2 bg-white rounded-md shadow-md border border-gray-200 max-w-2xl mx-auto mb-2">
                    <h2 className="text-base font-semibold text-blue-800 mb-2">
                        {editingPaymentId ? "Update Fee Payment" : "Create Fee Payment"}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">Select Class</label>
                            <Select
                                value={classes.find((c) => (c.id || c.uuid) === formData.class_id) || null}
                                onChange={(selected) => {
                                    const id = selected?.id || selected?.uuid || selected?.class_id || "";
                                    console.log("Selected class:", selected);
                                    setFormData({
                                        ...formData,
                                        class_id: id,
                                        student_id: "",
                                        student_fee_id: "",
                                        amount_paid: "",
                                    });
                                    setStudentFees([]);
                                    getStudents(id);
                                }}
                                options={classes}
                                getOptionLabel={(c) =>
                                    `${c.name || c.class_name || "Unknown"}` +
                                    `${c.session ? ` - ${c.session}` : ""}` +
                                    `${c.section ? ` - ${c.section}` : ""}`
                                }
                                getOptionValue={(c) => c.id || c.uuid || c.class_id}
                                placeholder={isLoadingClasses ? "Loading classes..." : "Select class"}
                                isClearable
                                isDisabled={isLoadingClasses}
                                styles={selectStyles}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">Select Student</label>
                            <Select
                                value={students.find((s) => s.std_id === formData.student_id) || null}
                                onChange={(selected) => {
                                    const id = selected?.std_id || "";
                                    console.log("Selected student:", selected);
                                    console.log("Setting student_id to:", id);
                                    setFormData({
                                        ...formData,
                                        student_id: id,
                                        student_fee_id: "",
                                        amount_paid: "",
                                    });
                                    if (id) getStudentFeeById(id);
                                    else setStudentFees([]);
                                }}
                                options={students}
                                getOptionLabel={(s) => s.username || s.name || `${s.first_name || ""} ${s.last_name || ""}`.trim() || "Unknown"}
                                getOptionValue={(s) => s.std_id}
                                placeholder={
                                    isLoadingStudents
                                        ? "Loading students..."
                                        : formData.class_id
                                            ? "Select student"
                                            : "Select a class first"
                                }
                                isClearable
                                isDisabled={isLoadingStudents || !formData.class_id}
                                styles={selectStyles}
                            />
                        </div>
                        {formData.student_id && (
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-0.5">Select Fee</label>
                                <Select
                                    value={studentFees.find((f) => f.id === formData.student_fee_id) || null}
                                    onChange={(selected) => {
                                        console.log("Selected fee:", selected);
                                        setFormData({
                                            ...formData,
                                            student_fee_id: selected?.id || "",
                                            amount_paid: selected?.net_payable?.toString() || "",
                                        });
                                    }}
                                    options={studentFees.filter((f) => !f.is_paid)}
                                    getOptionLabel={(f) => `${f.fee_type || "Unknown"} – ${f.net_payable || 0} PKR`}
                                    getOptionValue={(f) => f.id}
                                    placeholder={isLoadingFees ? "Loading fees..." : "Select fee"}
                                    isClearable
                                    isDisabled={isLoadingFees}
                                    styles={selectStyles}
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">Amount Paid</label>
                            <input
                                type="number"
                                value={formData.amount_paid}
                                onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                                placeholder="e.g. 1000"
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">Payment Date</label>
                            <input
                                type="date"
                                value={formData.payment_date}
                                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">Payment Method</label>
                            <Select
                                value={{
                                    value: formData.payment_method,
                                    label:
                                        formData.payment_method === "cash"
                                            ? "Cash"
                                            : formData.payment_method === "bank_transfer"
                                                ? "Bank Transfer"
                                                : formData.payment_method === "easypaisa"
                                                    ? "Easypaisa"
                                                    : "JazzCash",
                                }}
                                onChange={(selected) => {
                                    setFormData({ ...formData, payment_method: selected?.value || "cash" });
                                }}
                                options={[
                                    { value: "cash", label: "Cash" },
                                    { value: "bank_transfer", label: "Bank Transfer" },
                                    { value: "easypaisa", label: "Easypaisa" },
                                    { value: "jazzcash", label: "JazzCash" },
                                ]}
                                placeholder="Select method"
                                isClearable
                                styles={selectStyles}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">
                                Reference Number (Optional)
                            </label>
                            <input
                                type="text"
                                value={formData.reference_number}
                                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                                placeholder="e.g. TXN123456"
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">Discount Amount (Optional)</label>
                            <input
                                type="number"
                                value={formData.discount_amount}
                                onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                                placeholder="e.g. 200"
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">Late Fine (Optional)</label>
                            <input
                                type="number"
                                value={formData.late_fine_amount}
                                onChange={(e) => setFormData({ ...formData, late_fine_amount: e.target.value })}
                                placeholder="e.g. 50"
                                className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="mt-2 flex justify-end gap-1">
                        <button
                            onClick={resetForm}
                            className="bg-gray-500 hover:bg-gray-700 text-white px-2 py-1 rounded-md text-xs shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSavePayment}
                            className="bg-green-600 hover:bg-green-800 text-white px-3 py-1 rounded-md text-xs shadow-sm"
                        >
                            {editingPaymentId ? "Update Payment" : "Save Payment"}
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-2">
                <Buttons
                    data={payments.map((p, index) => ({
                        Sequence: (page - 1) * pageSize + index + 1,
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
                        { label: "S.No", key: "Sequence" },
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

                <h2 className="text-base font-semibold text-white px-2 py-0.5 rounded-t-md bg-blue-900">Payment Records</h2>
                <div className="overflow-x-auto">
                    <table className="w-full border border-gray-300 min-w-[400px]">
                        <thead className="bg-gray-300">
                            <tr>
                                <th className="border p-0.5 text-center text-xs">S.No</th>
                                <th className="border p-0.5 text-center text-xs">Student</th>
                                <th className="border p-0.5 text-center text-xs">Fee Type</th>
                                <th className="border p-0.5 text-center text-xs">Class</th>
                                <th className="border p-0.5 text-center text-xs">Section</th>
                                <th className="border p-0.5 text-center text-xs">Session</th>
                                <th className="border p-0.5 text-center text-xs">Amount Paid</th>
                                <th className="border p-0.5 text-center text-xs">Status</th>
                                <th className="border p-0.5 text-center text-xs">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {payments.length > 0 ? (
                                payments.map((payment, index) => (
                                    <tr key={payment.id}>
                                        <td className="border p-0.5 text-center text-xs">{(page - 1) * pageSize + index + 1}</td>
                                        <td className="border p-0.5 text-center text-xs">{payment.student_name || "—"}</td>
                                        <td className="border p-0.5 text-center text-xs">{payment.fee_type || "—"}</td>
                                        <td className="border p-0.5 text-center text-xs">{payment.class_name || "—"}</td>
                                        <td className="border p-0.5 text-center text-xs">{payment.section || "—"}</td>
                                        <td className="border p-0.5 text-center text-xs">{payment.session || "—"}</td>
                                        <td className="border p-0.5 text-center text-xs">{payment.amount_paid}</td>
                                        <td className="border p-0.5 text-center text-xs">
                                            {payment.is_fully_paid ? "✅ Paid" : "❌ Partial"}
                                        </td>
                                        <td className="border p-0.5 text-center flex gap-1 justify-center text-xs">
                                            <button
                                                onClick={() => setViewModalData(payment)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <MdVisibility size={18} />
                                            </button>
                                            {canDelete && (
                                                <button
                                                    onClick={() => handleDelete(payment.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <MdDelete size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" className="border p-1 text-center text-gray-500 text-xs">
                                        No payment records available.
                                    </td>
                                </tr>
                            )}
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
                    totalItems={payments.length}
                    showPageSizeSelector={true}
                    showPageInfo={true}
                />
            </div>

            {viewModalData && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-3">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto border border-gray-200 p-5 animate-fadeIn">
                        {/* Header */}
                        <div className="border-b pb-3 mb-4 text-center">
                            <h3 className="text-xl font-bold text-blue-700 flex items-center justify-center gap-2">
                                📄 Fee Payment Details
                            </h3>
                        </div>

                        {/* Student Information */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-blue-900 border-b pb-1">
                                👤 Student Information
                            </h4>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm text-gray-700">
                                <div><span className="font-medium">Name:</span> {viewModalData.student_name}</div>
                                <div><span className="font-medium">Fee Type:</span> {viewModalData.fee_type}</div>
                                <div><span className="font-medium">Class:</span> {viewModalData.class_name || "—"}</div>
                                <div><span className="font-medium">Section:</span> {viewModalData.section || "—"}</div>
                                <div><span className="font-medium">Session:</span> {viewModalData.session || "—"}</div>
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div className="space-y-2 mt-4">
                            <h4 className="text-sm font-semibold text-blue-900 border-b pb-1">
                                💵 Payment Information
                            </h4>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm text-gray-700">
                                <div><span className="font-medium">Amount Paid:</span> {viewModalData.amount_paid} PKR</div>
                                <div><span className="font-medium">Discount:</span> {viewModalData.applied_discount || "0"} PKR</div>
                                <div><span className="font-medium">Late Fine:</span> {viewModalData.applied_late_fine || "0"} PKR</div>
                                <div><span className="font-medium">Total Paid:</span> {viewModalData.total_paid} PKR</div>
                                <div><span className="font-medium">Remaining:</span> {viewModalData.remaining_balance} PKR</div>
                                <div><span className="font-medium">Payment Date:</span> {viewModalData.payment_date || "—"}</div>
                                <div><span className="font-medium">Method:</span> {viewModalData.payment_method}</div>
                                <div><span className="font-medium">Reference #:</span> {viewModalData.reference_number || "—"}</div>
                            </div>
                            <div className="pt-2">
                                <span className="font-medium">Status:</span>{" "}
                                {viewModalData.is_fully_paid ? (
                                    <span className="text-green-600 font-bold">✅ Fully Paid</span>
                                ) : (
                                    <span className="text-red-600 font-bold">❌ Partial Payment</span>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-5 flex justify-center">
                            <button
                                onClick={() => setViewModalData(null)}
                                className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium shadow hover:bg-blue-700 transition-all text-sm"
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