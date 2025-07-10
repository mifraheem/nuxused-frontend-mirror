import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import Select from "react-select";

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

    const API = import.meta.env.VITE_SERVER_URL;

    const getToken = () => Cookies.get("access_token");

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
            toast.error("Failed to fetch student fees");
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
            toast.error("Failed to load classes");
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
            toast.error("Failed to load students");
        }
    };

    const handleFilter = () => {
        let query = "";
        if (filterType === "id" && selectedStudent) {
            query = `?student_id=${selectedStudent.profile_id}`;
        } else if (filterType === "class" && selectedClass) {
            query = `?class=${selectedClass.id}`;
        } else if (filterType === "class_status" && selectedClass && selectedStatus !== "") {
            query = `?class=${selectedClass.id}&paid=${selectedStatus}`;
        }
        setPage(1);
        fetchFees(query);
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
            <Toaster position="top-center" />
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
                <div className="p-6   w-full max-w-xl ">
            {filterType === "id" && (
                <div className="mt-6 p-4 border rounded-lg bg-white shadow-md max-w-xl">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">🎓 Filter by Student</h3>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                    <Select
                        options={students}
                        getOptionLabel={(s) => `${s.first_name} ${s.last_name} (ID: ${s.profile_id})`}
                        getOptionValue={(s) => s.profile_id}
                        onChange={(val) => setSelectedStudent(val)}
                        placeholder="Search or select student"
                        isClearable
                    />
                    <div className="mt-4 text-right">
                        <button onClick={handleFilter} className="bg-blue-600 hover:bg-blue-800 text-white px-6 py-2 rounded-md shadow-sm">
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
                            {fees.length > 0 ? fees.map((fee) => (
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
                                            {canDelete && (
                                                <button onClick={() => handleDelete(fee.id)} className="text-red-600">
                                                    <MdDelete />
                                                </button>
                                            )}
                                        </td>
                                    )}

                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="text-center text-gray-500 py-4">No records found.</td>
                                </tr>
                            )}
                        </tbody>

                    </table>
                )}
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
                            className={`px-3 py-1 rounded-md font-semibold ${page === 1 ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-white hover:bg-gray-100"
                                }`}
                        >
                            Prev
                        </button>

                        <span className="px-3 py-1 bg-blue-600 text-white font-bold rounded-md">{page}</span>

                        <button
                            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={page === totalPages}
                            className={`px-3 py-1 rounded-md font-semibold ${page === totalPages ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-white hover:bg-gray-100"
                                }`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {/* {editModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-blue-800 text-center">Edit Fee Record</h2>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-1">Paid Status</label>
                            <select
                                value={editData.is_paid}
                                onChange={(e) => setEditData({ ...editData, is_paid: e.target.value === "true" })}
                                className="w-full p-2 border border-gray-300 rounded"
                            >
                                <option value="false">❌ Pending</option>
                                <option value="true">✅ Paid</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-1">Payment Date</label>
                            <input
                                type="date"
                                value={editData.payment_date}
                                onChange={(e) => setEditData({ ...editData, payment_date: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditModal(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                            <button onClick={handleEditSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">Update</button>
                        </div>
                    </div>
                </div>
            )} */}
            {viewModalData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] border border-gray-200 p-6 overflow-hidden">
                        <div className="overflow-y-auto max-h-[70vh] pr-2">
                            <div className="mb-6 border-b pb-3">
                                <h3 className="text-2xl font-bold text-blue-800 text-center">📄 Student Fee Details</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                                {/* Student Info */}
                                <div className="col-span-2 font-semibold text-blue-900 border-b pb-1">👤 Student Information</div>
                                <div><span className="font-semibold">Name:</span> {viewModalData.student_name}</div>
                                <div><span className="font-semibold">Class:</span> {viewModalData.class_name}</div>
                                <div><span className="font-semibold">Section:</span> {viewModalData.section}</div>
                                <div><span className="font-semibold">Session:</span> {viewModalData.session}</div>

                                {/* Fee Info */}
                                <div className="col-span-2 font-semibold text-blue-900 border-b pt-4 pb-1">💰 Fee Details</div>
                                <div><span className="font-semibold">Fee Type:</span> {viewModalData.fee_type}</div>
                                <div><span className="font-semibold">Net Payable:</span> {viewModalData.net_payable} PKR</div>
                                <div><span className="font-semibold">Discount:</span> {viewModalData.total_discount || 0} PKR</div>
                                <div><span className="font-semibold">Late Fine:</span> {viewModalData.late_fine || 0} PKR</div>

                                {/* Payment Info */}
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
