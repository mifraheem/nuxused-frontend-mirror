import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdDelete, MdVisibility } from "react-icons/md";
import { Buttons } from "../../components";
import Select from "react-select";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster";
import TableComponent from "../../components/TableComponent"; // Import reusable TableComponent

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
            const res = await axios.get(CLASSES_URL, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const classData = res.data?.data?.results || res.data.results || res.data || [];
            setClasses(classData);
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
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const studentData = res.data?.data?.results || res.data.results || res.data || [];
            setStudents(studentData);
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
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const result = res.data?.data || [];
            setStudentFees(result);
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
    }, [page, pageSize]);

    const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
    const canAdd = permissions.includes("users.add_feepayment");
    const canDelete = permissions.includes("users.delete_feepayment");
    const canEdit = permissions.includes("users.change_feepayment");

    // Columns for TableComponent
    const tableColumns = [
        {
            key: "index",
            label: "S.No",
            render: (row, index) => (page - 1) * pageSize + index + 1,
        },
        {
            key: "student_name",
            label: "Student",
            render: (row) => row.student_name || "—",
        },
        {
            key: "fee_type",
            label: "Fee Type",
            render: (row) => row.fee_type || "—",
        },
        {
            key: "class_name",
            label: "Class",
            render: (row) => row.class_name || "—",
        },
        {
            key: "section",
            label: "Section",
            render: (row) => row.section || "—",
        },
        {
            key: "session",
            label: "Session",
            render: (row) => row.session || "—",
        },
        {
            key: "amount_paid",
            label: "Amount Paid",
            render: (row) => row.amount_paid ? `${row.amount_paid} PKR` : "—",
        },
        {
            key: "is_fully_paid",
            label: "Status",
            render: (row) => row.is_fully_paid ? "✅ Paid" : "❌ Partial",
        },
        {
            key: "actions",
            label: "Actions",
            render: (row) => (
                <div className="flex justify-center gap-2">
                    <button
                        onClick={() => setViewModalData(row)}
                        className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        title="View Details"
                    >
                        <MdVisibility size={18} />
                    </button>
                    {canDelete && (
                        <button
                            onClick={() => handleDelete(row.id)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-200"
                            title="Delete Payment"
                        >
                            <MdDelete size={18} />
                        </button>
                    )}
                </div>
            ),
        },
    ];

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
                <h1 className="text-lg sm:text-xl font-bold">Manage Fee Payments</h1>
                {canAdd && (
                    <button
                        onClick={() => (showForm ? resetForm() : setShowForm(true))}
                        className="flex items-center px-3 py-2 bg-cyan-500 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-600 text-sm sm:text-base transition-colors duration-200"
                    >
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-800 rounded-full mr-2">
                            <span className="text-cyan-400 text-xl font-bold">
                                {showForm ? "-" : "+"}
                            </span>
                        </div>
                        {showForm ? "Close Form" : "Add Payment"}
                    </button>
                )}
            </div>

            {showForm && canAdd && (
                <div className="p-4 sm:p-6 bg-white rounded-xl shadow-md border border-gray-200 max-w-2xl mx-auto mb-6">
                    <h2 className="text-lg font-semibold text-blue-900 mb-4">
                        {editingPaymentId ? "Update Fee Payment" : "Create Fee Payment"}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                            <Select
                                value={classes.find((c) => (c.id || c.uuid) === formData.class_id) || null}
                                onChange={(selected) => {
                                    const id = selected?.id || selected?.uuid || selected?.class_id || "";
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                            <Select
                                value={students.find((s) => s.std_id === formData.student_id) || null}
                                onChange={(selected) => {
                                    const id = selected?.std_id || "";
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Fee</label>
                                <Select
                                    value={studentFees.find((f) => f.id === formData.student_fee_id) || null}
                                    onChange={(selected) => {
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                            <input
                                type="number"
                                value={formData.amount_paid}
                                onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                                placeholder="e.g. 1000"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                            <input
                                type="date"
                                value={formData.payment_date}
                                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reference Number (Optional)
                            </label>
                            <input
                                type="text"
                                value={formData.reference_number}
                                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                                placeholder="e.g. TXN123456"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Amount (Optional)</label>
                            <input
                                type="number"
                                value={formData.discount_amount}
                                onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                                placeholder="e.g. 200"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Late Fine (Optional)</label>
                            <input
                                type="number"
                                value={formData.late_fine_amount}
                                onChange={(e) => setFormData({ ...formData, late_fine_amount: e.target.value })}
                                placeholder="e.g. 50"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            onClick={resetForm}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm shadow-sm transition-colors duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSavePayment}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm shadow-sm transition-colors duration-200"
                        >
                            {editingPaymentId ? "Update Payment" : "Save Payment"}
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-6">
                <div className=" mb-4 gap-3">
                    {/* <h2 className="text-lg font-semibold text-white px-4 py-2 rounded-t-lg bg-blue-900">
                        Payment Records
                    </h2> */}
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
                </div>
                <div className="overflow-x-auto">
                    <TableComponent
                        data={payments}
                        columns={tableColumns}
                        initialSort={{ key: "student_name", direction: "asc" }}
                    />
                </div>
                {/* <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    onPageChange={(newPage) => {
                        setPage(newPage);
                        fetchPayments();
                    }}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(1);
                        fetchPayments();
                    }}
                    totalItems={payments.length}
                    showPageSizeSelector={true}
                    showPageInfo={true}
                /> */}
            </div>

            {viewModalData && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto border border-gray-200 p-6 animate-fadeIn">
                        <div className="border-b pb-3 mb-4 text-center">
                            <h3 className="text-xl font-bold text-blue-900 flex items-center justify-center gap-2">
                                📄 Fee Payment Details
                            </h3>
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-blue-900 border-b pb-1">
                                👤 Student Information
                            </h4>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-gray-700">
                                <div><span className="font-medium">Name:</span> {viewModalData.student_name}</div>
                                <div><span className="font-medium">Fee Type:</span> {viewModalData.fee_type}</div>
                                <div><span className="font-medium">Class:</span> {viewModalData.class_name || "—"}</div>
                                <div><span className="font-medium">Section:</span> {viewModalData.section || "—"}</div>
                                <div><span className="font-medium">Session:</span> {viewModalData.session || "—"}</div>
                            </div>
                        </div>
                        <div className="space-y-3 mt-4">
                            <h4 className="text-sm font-semibold text-blue-900 border-b pb-1">
                                💵 Payment Information
                            </h4>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-gray-700">
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
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={() => setViewModalData(null)}
                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium shadow hover:bg-indigo-700 transition-colors duration-200 text-sm"
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