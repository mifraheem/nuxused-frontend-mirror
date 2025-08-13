import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { MdDelete, MdVisibility } from "react-icons/md";
import { Buttons } from "../../components";
import Select from "react-select";
import Pagination from "../../components/Pagination";

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
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [isLoadingFees, setIsLoadingFees] = useState(false);

    const API = import.meta.env.VITE_SERVER_URL;
    const API_URL = `${API}fee-payments/`;
    const STUDENT_FEES_URL = `${API}student-fees/`;

    const isValidUUID = (str) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
    };

    const getStudents = async () => {
        try {
            setIsLoadingStudents(true);
            const token = Cookies.get("access_token");
            if (!token) {
                throw new Error("No access token found. Please log in.");
            }
            const res = await axios.get(`${API}api/auth/users/list_profiles/student/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Student list response:", res.data);
            const studentData = res.data?.data?.results || res.data.results || [];
            setStudents(studentData);
            if (studentData.length === 0) {
                toast.error("No students found. Using default data.");
                setStudents([
                    { uuid: "123e4567-e89b-12d3-a456-426614174000", first_name: "John", last_name: "Doe" },
                    { uuid: "987fcdeb-12ab-34cd-56ef-426614174001", first_name: "Jane", last_name: "Smith" }
                ]);
            }
        } catch (error) {
            console.error("Error fetching students:", error);
            if (error.response?.status === 404) {
                toast.error("Student endpoint not found. Using default data.");
                setStudents([
                    { uuid: "123e4567-e89b-12d3-a456-426614174000", first_name: "John", last_name: "Doe" },
                    { uuid: "987fcdeb-12ab-34cd-56ef-426614174001", first_name: "Jane", last_name: "Smith" }
                ]);
            } else if (error.response?.status === 401) {
                toast.error("Unauthorized. Please log in again.");
            } else {
                toast.error("Failed to fetch students.");
            }
        } finally {
            setIsLoadingStudents(false);
        }
    };

    const getStudentFeeById = async (studentId) => {
        try {
            setIsLoadingFees(true);
            const token = Cookies.get("access_token");
            if (!token) {
                throw new Error("No access token found. Please log in.");
            }
            console.log("Fetching fees for studentId:", studentId);
            const res = await axios.get(`${STUDENT_FEES_URL}${studentId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Fee response:", res.data);
            const result = Array.isArray(res.data.data) ? res.data.data : res.data.results || [];
            setStudentFees(result);
            if (result.length === 0) {
                toast.error("No fees found for selected student. Using default data.");
                setStudentFees([
                    { uuid: "c5214007-a286-4a65-bdf9-9cf7b7aa8fb9", fee_type: "Registration Fee", net_payable: 1000, is_paid: false },
                    { uuid: "d6225118-b397-4b76-ce0a-ad08c9bb9fc0", fee_type: "Tuition", net_payable: 5000, is_paid: false }
                ]);
            }
        } catch (error) {
            console.error("Error fetching fees:", error.response?.data);
            if (error.response?.status === 404) {
                toast.error("Student fee endpoint not found. Using default data.");
                setStudentFees([
                    { uuid: "c5214007-a286-4a65-bdf9-9cf7b7aa8fb9", fee_type: "Registration Fee", net_payable: 1000, is_paid: false },
                    { uuid: "d6225118-b397-4b76-ce0a-ad08c9bb9fc0", fee_type: "Tuition", net_payable: 5000, is_paid: false }
                ]);
            } else if (error.response?.status === 401) {
                toast.error("Unauthorized. Please log in again.");
            } else {
                toast.error(error.response?.data?.message || "Failed to fetch selected student's fee types.");
                setStudentFees([]);
            }
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
            const data = res.data?.data || {};
            if (Array.isArray(data.results)) {
                setPayments(data.results);
                setTotalPages(data.total_pages || 1);
            } else {
                throw new Error("Unexpected API response format.");
            }
        } catch (error) {
            console.error("Error fetching payments:", error);
            if (error.response?.status === 404) {
                toast.error("Payment records endpoint not found.");
            } else {
                toast.error("Failed to fetch payment records.");
            }
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

        if (!isValidUUID(student_id) || !isValidUUID(student_fee_id)) {
            toast.error("Invalid UUID format for student or fee.");
            return;
        }

        const payload = {
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
                toast.success(res.data.message || "Payment updated successfully!");
            } else {
                const res = await axios.post(API_URL, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success(res.data.message || "Payment created successfully!");
            }
            fetchPayments();
            if (formData.student_id) getStudentFeeById(formData.student_id);
            resetForm();
        } catch (error) {
            console.error("Error saving payment:", error.response?.data);
            if (error.response?.status === 404) {
                toast.error("Payment endpoint not found or student/fee ID is invalid.");
            } else if (error.response?.status === 400 && error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error(error.response?.data?.message || "Failed to save payment.");
            }
        }
    };

    const handleDelete = (id) => {
        toast.custom((t) => (
            <div className="bg-white p-2 rounded shadow-lg border w-72">
                <p className="text-gray-800 mb-1 text-xs">Are you sure you want to delete?</p>
                <div className="flex justify-end gap-1">
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
                            } catch (error) {
                                console.error("Error deleting payment:", error.response?.data);
                                toast.error("Delete failed.");
                            }
                        }}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                    >
                        Yes
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-2 py-1 bg-gray-300 text-gray-800 rounded text-xs hover:bg-gray-400"
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

    const selectStyles = {
        control: (provided) => ({
            ...provided,
            minHeight: '2rem',
            fontSize: '0.75rem',
        }),
        menu: (provided) => ({
            ...provided,
            fontSize: '0.75rem',
            maxHeight: '200px',
            overflowY: 'auto',
        }),
        option: (provided) => ({
            ...provided,
            fontSize: '0.75rem',
            padding: '0.5rem',
        }),
    };

    return (
        <div className="p-2">
            <Toaster position="top-center" />
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
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">Select Student</label>
                            <Select
                                value={students.find(s => s.uuid === formData.student_id || s.profile_id === formData.student_id || s.id === formData.student_id) || null}
                                onChange={(selected) => {
                                    const id = selected?.uuid || selected?.profile_id || selected?.id || "";
                                    console.log("Selected student:", selected);
                                    setFormData({ ...formData, student_id: id, student_fee_id: "", amount_paid: "" });
                                    if (id) getStudentFeeById(id);
                                    else setStudentFees([]);
                                }}
                                options={students}
                                getOptionLabel={(s) => `${s.first_name || s.name || ''} ${s.last_name || ''} (ID: ${s.uuid || s.profile_id || s.id})`}
                                getOptionValue={(s) => s.uuid || s.profile_id || s.id}
                                placeholder={isLoadingStudents ? "Loading students..." : "Select student"}
                                isClearable
                                isDisabled={isLoadingStudents}
                                styles={selectStyles}
                            />
                        </div>
                        {formData.student_id && (
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-0.5">Select Fee</label>
                                <Select
                                    value={studentFees.find(f => f.uuid === formData.student_fee_id || f.id === formData.student_fee_id) || null}
                                    onChange={(selected) => {
                                        console.log("Selected fee:", selected);
                                        setFormData({
                                            ...formData,
                                            student_fee_id: selected?.uuid || selected?.id || "",
                                            amount_paid: selected?.net_payable?.toString() || ""
                                        });
                                    }}
                                    options={studentFees.filter(f => !f.is_paid)}
                                    getOptionLabel={(f) => `${f.fee_type || f.name || 'Unknown'} – ${f.net_payable || 0} PKR`}
                                    getOptionValue={(f) => f.uuid || f.id}
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
                                                    : "JazzCash"
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
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">Reference Number (Optional)</label>
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
                                            <button onClick={() => setViewModalData(payment)} className="text-blue-600 hover:text-blue-800">
                                                <MdVisibility size={18} />
                                            </button>
                                            {canDelete && (
                                                <button onClick={() => handleDelete(payment.id)} className="text-red-600 hover:text-red-800">
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
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-2">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[70vh] overflow-y-auto border border-gray-300 p-3">
                        <div className="border-b pb-2 mb-3">
                            <h3 className="text-lg font-bold text-center text-blue-700">📄 Fee Payment Details</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-y-1 text-xs text-gray-700">
                            <div className="font-semibold text-blue-900 border-b pb-1">👤 Student Information</div>
                            <div><span className="font-semibold">Name:</span> {viewModalData.student_name}</div>
                            <div><span className="font-semibold">Fee Type:</span> {viewModalData.fee_type}</div>
                            <div><span className="font-semibold">Class:</span> {viewModalData.class_name || "—"}</div>
                            <div><span className="font-semibold">Section:</span> {viewModalData.section || "—"}</div>
                            <div><span className="font-semibold">Session:</span> {viewModalData.session || "—"}</div>
                            <div className="font-semibold text-blue-900 border-b pt-2 pb-1">💵 Payment Information</div>
                            <div><span className="font-semibold">Amount Paid:</span> {viewModalData.amount_paid} PKR</div>
                            <div><span className="font-semibold">Discount:</span> {viewModalData.applied_discount || "0"} PKR</div>
                            <div><span className="font-semibold">Late Fine:</span> {viewModalData.applied_late_fine || "0"} PKR</div>
                            <div><span className="font-semibold">Total Paid:</span> {viewModalData.total_paid} PKR</div>
                            <div><span className="font-semibold">Remaining:</span> {viewModalData.remaining_balance} PKR</div>
                            <div><span className="font-semibold">Payment Date:</span> {viewModalData.payment_date || "—"}</div>
                            <div><span className="font-semibold">Payment Method:</span> {viewModalData.payment_method}</div>
                            <div><span className="font-semibold">Reference #:</span> {viewModalData.reference_number || "—"}</div>
                            <div className="pt-2">
                                <span className="font-semibold">Status:</span>{" "}
                                {viewModalData.is_fully_paid ? (
                                    <span className="text-green-600 font-bold">✅ Fully Paid</span>
                                ) : (
                                    <span className="text-red-600 font-bold">❌ Partial Payment</span>
                                )}
                            </div>
                        </div>
                        <div className="mt-3 flex justify-center">
                            <button
                                onClick={() => setViewModalData(null)}
                                className="px-3 py-1 bg-blue-600 text-white rounded-full font-medium shadow hover:bg-blue-700 text-xs"
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