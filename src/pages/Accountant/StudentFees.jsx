import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import Select from "react-select";
import Pagination from "../../components/Pagination";
import Toaster from "../../components/Toaster";

const StudentFees = () => {
    const [fees, setFees] = useState([]);
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewModalData, setViewModalData] = useState(null);
    const [filterType, setFilterType] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [studentFeeDetails, setStudentFeeDetails] = useState([]);
    const [editModal, setEditModal] = useState(false);
    const [editData, setEditData] = useState({ id: null, is_paid: false, payment_date: "" });
    const [toaster, setToaster] = useState({ message: '', type: 'success' });

    const API = import.meta.env.VITE_SERVER_URL;

    const getToken = () => Cookies.get("access_token");

    const showToast = (message, type = 'success') => {
        setToaster({ message, type });
    };

    const fetchFees = async (query = "") => {
        try {
            setLoading(true);
            const res = await axios.get(
                `${API}student-fees/${query}${query.includes("?") ? "&" : "?"}page=${page}&page_size=${pageSize}`,
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            const data = res.data?.data || {};
            setFees(Array.isArray(data.results) ? data.results : []);
            setTotalPages(data.total_pages || 1);
        } catch {
            showToast("Failed to fetch student fees", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await axios.get(`${API}classes/`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            const data = res.data?.data?.results || res.data?.data || [];
            setClasses(data);
        } catch {
            showToast("Failed to load classes", "error");
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await axios.get(`${API}api/auth/users/list_profiles/student/`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            const data = res.data?.data?.results || [];
            setStudents(data);
        } catch {
            showToast("Failed to load students", "error");
        }
    };

    const handleFilter = () => {
        let query = "";
        if (filterType === "id" && selectedStudentId) {
            query = `?student_id=${selectedStudentId}`;
        } else if (filterType === "class" && selectedClass) {
            query = `?class=${selectedClass.id}`;
        } else if (filterType === "class_status" && selectedClass && selectedStatus !== "") {
            query = `?class=${selectedClass.id}&paid=${selectedStatus}`;
        }
        setPage(1);
        fetchFees(query);
    };

    const fetchStudentFeeDetails = async (id) => {
        try {
            const token = Cookies.get("access_token");
            const res = await axios.get(`${API}student-fees/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const dataArray = res.data?.data || [];
            setStudentFeeDetails(Array.isArray(dataArray) ? dataArray : []);
        } catch (err) {
            console.error("Failed to fetch:", err);
            showToast("Could not fetch student fee records", "error");
            setStudentFeeDetails([]);
        }
    };

    const handleEdit = (fee) => {
        setEditData({
            id: fee.id,
            is_paid: fee.is_paid,
            payment_date: fee.payment_date || "",
        });
        setEditModal(true);
    };

    const handleEditSubmit = async () => {
        try {
            const token = Cookies.get("access_token");
            await axios.patch(`${API}student-fees/${editData.id}/`, {
                is_paid: editData.is_paid,
                payment_date: editData.payment_date || null,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast("Fee updated successfully", "success");
            setEditModal(false);
            filterType === "id"
                ? fetchStudentFeeDetails(selectedStudentId)
                : fetchFees();
        } catch (err) {
            console.error(err);
            showToast("Failed to update fee", "error");
        }
    };

    useEffect(() => {
        fetchClasses();
        fetchStudents();
    }, []);

    useEffect(() => {
        fetchFees();
    }, [page, pageSize]);

    const permissions = JSON.parse(localStorage.getItem("user_permissions") || "[]");
    const canView = permissions.includes("users.view_studentfee");
    const canEdit = permissions.includes("users.change_studentfee");
    const canDelete = permissions.includes("users.delete_studentfee");

    return (
        <div className="p-4">
            <Toaster
                message={toaster.message}
                type={toaster.type}
                duration={3000}
                onClose={() => setToaster({ message: "", type: "success" })}
                onConfirm={toaster.onConfirm}
                onCancel={toaster.onCancel}
            />
            <div className="bg-blue-900 text-white py-3 px-6 rounded-md flex justify-between items-center">
                <h1 className="text-xl font-bold">Manage Student Fee</h1>
                <div className="relative">
                    <button
                        className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-4 py-2 rounded"
                        onClick={() => setFilterType((prev) => (prev ? null : "menu"))}
                    >
                        Filter Data
                    </button>
                    {filterType === "menu" && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border rounded shadow-md z-10 text-gray-700">
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => setFilterType("id")}>Filter by Student ID</button>
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => setFilterType("class")}>Filter by Class</button>
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => setFilterType("class_status")}>Filter by Class & Status</button>
                            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => { setFilterType(null); fetchFees(); }}>Show All</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Filter forms */}
            <div className="flex justify-center">
                <div className="p-6 w-full max-w-xl">
                    {filterType === "id" && (
                        <div className="mt-6 p-4 border rounded-lg bg-white shadow-md max-w-xl">
                            <h3 className="text-lg font-semibold text-blue-800 mb-4">🎓 Filter by Student</h3>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                            <Select
                                options={students}
                                getOptionLabel={(s) => `${s.first_name} ${s.last_name} (ID: ${s.profile_id})`}
                                getOptionValue={(s) => s.profile_id}
                                value={students.find(s => s.profile_id === selectedStudentId) || null}
                                onChange={(selected) => {
                                    if (selected) {
                                        setSelectedStudentId(selected.profile_id);
                                        setSelectedStudent(selected);
                                        fetchStudentFeeDetails(selected.profile_id);
                                    } else {
                                        setSelectedStudentId(null);
                                        setStudentFeeDetails([]);
                                    }
                                }}
                                placeholder="Search or select student"
                                isClearable
                            />
                            <div className="mt-4 text-right">
                                <button
                                    onClick={handleFilter}
                                    className="bg-blue-600 hover:bg-blue-800 text-white px-6 py-2 rounded-md shadow-sm"
                                >
                                    Apply Filter
                                </button>
                            </div>
                        </div>
                    )}

                    {filterType === "class" && (
                        <div className="mt-6 p-4 border rounded-lg bg-white shadow-sm max-w-xl">
                            <h3 className="text-lg font-semibold text-blue-800 mb-4">🏫 Filter by Class</h3>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                            <Select
                                options={classes}
                                getOptionLabel={(c) => `${c.class_name} ${c.section} (${c.session})`}
                                getOptionValue={(c) => c.id}
                                onChange={(val) => setSelectedClass(val)}
                                placeholder="Search or select class"
                                isClearable
                            />
                            <div className="mt-4 text-right">
                                <button onClick={handleFilter} className="bg-blue-600 hover:bg-blue-800 text-white px-6 py-2 rounded-md shadow-sm">
                                    Apply Filter
                                </button>
                            </div>
                        </div>
                    )}

                    {filterType === "class_status" && (
                        <div className="mt-6 p-4 border rounded-lg bg-white shadow-sm max-w-3xl">
                            <h3 className="text-lg font-semibold text-blue-800 mb-4">📊 Filter by Class & Status</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                                    <Select
                                        options={classes}
                                        getOptionLabel={(c) => `${c.class_name} ${c.section} (${c.session})`}
                                        getOptionValue={(c) => c.id}
                                        onChange={(val) => setSelectedClass(val)}
                                        placeholder="Search or select class"
                                        isClearable
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Status</label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Status</option>
                                        <option value="true">✅ Paid</option>
                                        <option value="false">❌ Pending</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2 text-right mt-4">
                                    <button onClick={handleFilter} className="bg-blue-600 hover:bg-blue-800 text-white px-6 py-2 rounded-md shadow-sm">
                                        Apply Filter
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="p-6">
                {loading ? (
                    <p className="text-center text-gray-600 mt-10">Loading...</p>
                ) : (
                    <table className="w-full mt-4 border border-gray-300 text-sm bg-white">
                        <thead className="bg-blue-900 text-white">
                            <tr>
                                <th className="border p-2">Student</th>
                                <th className="border p-2">Fee Type</th>
                                <th className="border p-2">Net Payable</th>
                                <th className="border p-2">Status</th>
                                <th className="border p-2">Payment Date</th>
                                {(canView || canEdit || canDelete) && <th className="border p-2">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {(filterType === "id" ? studentFeeDetails : fees).length > 0 ? (
                                (filterType === "id" ? studentFeeDetails : fees).map((fee) => (
                                    <tr key={fee.id} className={!fee.is_paid ? "bg-red-50" : ""}>
                                        <td className="border p-2">{fee.student_name}</td>
                                        <td className="border p-2">{fee.fee_type}</td>
                                        <td className="border p-2">{fee.net_payable}</td>
                                        <td className="border p-2 text-center">{fee.is_paid ? "✅ Paid" : "❌ Pending"}</td>
                                        <td className="border p-2">{fee.payment_date || "—"}</td>
                                        {(canView || canEdit || canDelete) && (
                                            <td className="border p-2 flex justify-center gap-2">
                                                {canView && (
                                                    <button onClick={() => setViewModalData(fee)} className="text-blue-600">
                                                        <MdVisibility />
                                                    </button>
                                                )}
                                                {canEdit && (
                                                    <button onClick={() => handleEdit(fee)} className="text-green-600">
                                                        <MdEdit />
                                                    </button>
                                                )}
                                                {/* {canDelete && (
                                                    <button onClick={() => handleDelete(fee.id)} className="text-red-600">
                                                        <MdDelete />
                                                    </button>
                                                )} */}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center text-gray-500 py-4">
                                        No records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    onPageChange={(newPage) => setPage(newPage)}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(1);
                    }}
                    totalItems={(filterType === "id" ? studentFeeDetails : fees).length}
                    showPageSizeSelector={true}
                    showPageInfo={true}
                />
            </div>

            {/* Edit Modal */}
            {editModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 border border-gray-200">
                        <div className="mb-6 border-b pb-3">
                            <h2 className="text-2xl font-bold text-center text-blue-800">📝 Edit Fee Record</h2>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Paid Status</label>
                                <select
                                    value={editData.is_paid}
                                    onChange={(e) => setEditData({ ...editData, is_paid: e.target.value === "true" })}
                                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="false">❌ Pending</option>
                                    <option value="true">✅ Paid</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Payment Date</label>
                                <input
                                    type="date"
                                    value={editData.payment_date}
                                    onChange={(e) => setEditData({ ...editData, payment_date: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setEditModal(false)}
                                className="px-5 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-md transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditSubmit}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {viewModalData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] border border-gray-200 p-6 overflow-hidden">
                        <div className="overflow-y-auto max-h-[70vh] pr-2">
                            <div className="mb-6 border-b pb-3">
                                <h3 className="text-2xl font-bold text-blue-800 text-center">📄 Student Fee Details</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                                <div className="col-span-2 font-semibold text-blue-900 border-b pb-1">👤 Student Information</div>
                                <div><span className="font-semibold">Name:</span> {viewModalData.student_name}</div>
                                <div><span className="font-semibold">Class:</span> {viewModalData.class_name}</div>
                                <div><span className="font-semibold">Section:</span> {viewModalData.section}</div>
                                <div><span className="font-semibold">Session:</span> {viewModalData.session}</div>
                                <div className="col-span-2 font-semibold text-blue-900 border-b pt-4 pb-1">💰 Fee Details</div>
                                <div><span className="font-semibold">Fee Type:</span> {viewModalData.fee_type}</div>
                                <div><span className="font-semibold">Net Payable:</span> {viewModalData.net_payable} PKR</div>
                                <div><span className="font-semibold">Discount:</span> {viewModalData.total_discount || 0} PKR</div>
                                <div><span className="font-semibold">Late Fine:</span> {viewModalData.late_fine || 0} PKR</div>
                                <div className="col-span-2 font-semibold text-blue-900 border-b pt-4 pb-1">📆 Payment Information</div>
                                <div><span className="font-semibold">Status:</span> {
                                    viewModalData.is_paid
                                        ? <span className="text-green-600 font-semibold">✅ Paid</span>
                                        : <span className="text-red-600 font-semibold">❌ Pending</span>
                                }</div>
                                <div><span className="font-semibold">Payment Date:</span> {viewModalData.payment_date || "—"}</div>
                            </div>
                        </div>
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setViewModalData(null)}
                                className="px-6 py-2 bg-blue-700 text-white rounded-full shadow hover:bg-blue-800 transition"
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

export default StudentFees;