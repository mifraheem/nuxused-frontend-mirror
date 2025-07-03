import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";

const StudentFees = () => {
    const [fees, setFees] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    // const [editModal, setEditModal] = useState(false);
    // const [editData, setEditData] = useState({ id: null, is_paid: false, payment_date: "" });
    const [viewModalData, setViewModalData] = useState(null);


    // filter controls
    const [showClassDropdown, setShowClassDropdown] = useState(false);
    const [showClassStatusDropdown, setShowClassStatusDropdown] = useState(false);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);


    const API = import.meta.env.VITE_SERVER_URL;


    const getToken = () => Cookies.get("access_token");

    const fetchFees = async (query = "") => {
        try {
            setLoading(true);
            const res = await axios.get(`${API}student-fees/${query}${query.includes('?') ? '&' : '?'}page=${page}&page_size=${pageSize}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
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
            const res = await axios.get(`$${API}classes/`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            const data = res.data?.data?.results || res.data?.data || []; // ✅ Handle all cases
            setClasses(data);
        } catch {
            toast.error("Failed to load classes");
        }
    };


    const handleDelete = (id) => {
        toast((t) => (
            <span>
                Confirm delete?
                <div className="mt-2 flex gap-2 justify-center">
                    <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={() => confirmDelete(id, t.id)}>Yes</button>
                    <button className="bg-gray-300 px-3 py-1 rounded" onClick={() => toast.dismiss(t.id)}>No</button>
                </div>
            </span>
        ), { position: "top-center" });
    };

    const confirmDelete = async (id, toastId) => {
        try {
            await axios.delete(`${API}student-fees/${id}/`, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            toast.dismiss(toastId);
            toast.success("Deleted successfully");
            setFees(prev => prev.filter(fee => fee.student_profile_id !== profileId));
        } catch {
            toast.error("Delete failed");
        }
    };

    // const handleEdit = (item) => {
    //     setEditData({
    //         id: item.student_profile_id, // ✅ correct ID expected by backend
    //         is_paid: item.is_paid,
    //         payment_date: item.payment_date || "",
    //     });

    //     setEditModal(true);
    // };

    // const handleEditSubmit = async () => {
    //     try {
    //         await axios.patch(`${API_BASE}/student-fees/${editData.id}/`, {
    //             is_paid: editData.is_paid,
    //             payment_date: editData.payment_date,
    //         }, {
    //             headers: { Authorization: `Bearer ${getToken()}` },
    //         });
    //         toast.success("Updated successfully");
    //         setEditModal(false);
    //         fetchFees();
    //     } catch {
    //         toast.error("Update failed");
    //     }
    // };

    const handleClassFilter = () => {
        if (!selectedClass) return toast.error("Please select a class");
        fetchFees(`?class=${selectedClass}`);
    };

    const handleClassStatusFilter = () => {
        if (!selectedClass || !selectedStatus) {
            return toast.error("Select both class and status");
        }
        fetchFees(`?class=${selectedClass}&paid=${selectedStatus}`);
    };

    useEffect(() => {
        fetchFees();
        fetchClasses();
    }, [page, pageSize]);


    return (
        <div>
            <Toaster position="top-center" />
            <div className="bg-blue-900 text-white py-3 px-6 rounded-md flex justify-between items-center mt-5">
                <h1 className="text-xl font-bold">Manage Student Fee</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setShowClassDropdown(!showClassDropdown);
                            setShowClassStatusDropdown(false);
                        }}
                        className="bg-cyan-400 hover:bg-cyan-500 text-white font-semibold px-4 py-2 rounded"
                    >
                        Filter by Class
                    </button>
                    <button
                        onClick={() => {
                            setShowClassStatusDropdown(!showClassStatusDropdown);
                            setShowClassDropdown(false);
                        }}
                        className="bg-cyan-400 hover:bg-cyan-500 text-white font-semibold px-4 py-2 rounded"
                    >
                        Filter by Class & Status
                    </button>
                </div>
            </div>

            {/* Filter dropdowns */}
            {showClassDropdown && (
                <div className="p-4 flex gap-2 items-center">
                    <select
                        className="p-2 border rounded"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option value="">Select Class</option>
                        {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                                {cls.class_name} {cls.section}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleClassFilter}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Apply
                    </button>
                </div>
            )}

            {showClassStatusDropdown && (
                <div className="p-4 flex gap-2 items-center">
                    <select
                        className="p-2 border rounded"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option value="">Select Class</option>
                        {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                                {cls.class_name} {cls.section}
                            </option>
                        ))}
                    </select>
                    <select
                        className="p-2 border rounded"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <option value="">Select Status</option>
                        <option value="true">✅ Paid</option>
                        <option value="false">❌ Pending</option>
                    </select>
                    <button
                        onClick={handleClassStatusFilter}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Apply
                    </button>
                </div>
            )}

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
                                <th className="border p-2">Actions</th>
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
                                    <td className="border p-2 flex justify-center gap-2">
                                        <button onClick={() => setViewModalData(fee)} className="text-blue-600"><MdVisibility /></button>
                                        {/* <button onClick={() => handleEdit(fee)} className="text-green-600"><MdEdit /></button> */}
                                        <button onClick={() => handleDelete(fee.id)} className="text-red-600"><MdDelete /></button>
                                    </td>
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
