import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { MdEdit } from "react-icons/md";
import Select from "react-select";
import { Buttons } from "../../components";

const PromotionRecords = () => {
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [classes, setClasses] = useState([]);

    const API = import.meta.env.VITE_SERVER_URL;
    const API_URL = `${API}/promotion-records/`;

    const fetchClasses = async () => {
        try {
            const token = Cookies.get("access_token");
            const res = await axios.get(`${API}/classes/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = res.data?.data?.results || [];
            setClasses(data.map(c => ({
                value: c.id,
                label: `${c.class_name} - ${c.section} (${c.session})`
            })));
        } catch (err) {
            toast.error("Failed to fetch class options.");
            console.error(err);
        }
    };

    const fetchRecords = async (page = 1) => {
        try {
            setIsLoading(true);
            const token = Cookies.get("access_token");
            const res = await axios.get(`${API_URL}?page=${page}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = res.data.data;
            setRecords(data.results);
            setCurrentPage(data.current_page);
            setTotalPages(data.total_pages);
        } catch (err) {
            toast.error("Failed to fetch promotion records.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditSubmit = async () => {
        try {
            const token = Cookies.get("access_token");
            await axios.put(`${API_URL}${selectedRecord.id}/`, selectedRecord, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Promotion record updated.");
            setEditModalOpen(false);
            fetchRecords(currentPage);
        } catch (err) {
            toast.error("Update failed.");
            console.error(err);
        }
    };

    const handleInputChange = (field, value) => {
        setSelectedRecord(prev => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        fetchRecords();
        fetchClasses();
    }, []);

    return (
        <div className="p-2 min-h-screen">
            <Toaster position="top-center" />
            <div className="bg-blue-900 rounded-md mb-2">
                <h1 className="text-lg sm:text-xl font-bold text-white py-1 px-2">Student Promotion Records</h1>
            </div>

            {isLoading ? (
                <p className="text-center text-gray-600 text-xs">Loading...</p>
            ) : (
                <div className="overflow-x-auto rounded-md shadow-sm">
                    <Buttons
                        data={records}
                        columns={[
                            { label: "ID", key: "id" },
                            { label: "Student", key: "student_name" },
                            { label: "From Class", key: "from_class_name" },
                            { label: "To Class", key: "to_class_name" },
                            { label: "Exam", key: "exam_term" },
                            { label: "Status", key: "status" },
                            { label: "Promoted On", key: "promoted_on" }
                        ]}
                        filename="Promotion_Records"
                    />

                    <table className="w-full text-xs bg-white border-collapse min-w-[400px]">
                        <thead className="bg-blue-900 text-white">
                            <tr>
                                <th className="border p-0.5 text-left">ID</th>
                                <th className="border p-0.5 text-left">Student</th>
                                <th className="border p-0.5 text-left">From Class</th>
                                <th className="border p-0.5 text-left">To Class</th>
                                <th className="border p-0.5 text-left">Exam</th>
                                <th className="border p-0.5 text-left">Status</th>
                                <th className="border p-0.5 text-left">Promoted On</th>
                                <th className="border p-0.5 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(rec => (
                                <tr key={rec.id} className="hover:bg-gray-100">
                                    <td className="border p-0.5 text-center text-xs">{rec.id}</td>
                                    <td className="border p-0.5 text-xs">{rec.student_name}</td>
                                    <td className="border p-0.5 text-xs">{rec.from_class_name}</td>
                                    <td className="border p-0.5 text-xs">
                                        {rec.to_class_name.includes("__str__") ? "—" : rec.to_class_name}
                                    </td>
                                    <td className="border p-0.5 text-xs">{rec.exam_term}</td>
                                    <td className="border p-0.5 text-center">
                                        <span className="px-1 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                            {rec.status}
                                        </span>
                                    </td>
                                    <td className="border p-0.5 text-center text-xs">{rec.promoted_on}</td>
                                    <td className="border p-0.5 text-center">
                                        <button onClick={() => { setSelectedRecord(rec); setEditModalOpen(true); }} className="text-yellow-500 hover:text-yellow-600">
                                            <MdEdit size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {editModalOpen && selectedRecord && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-2">
                    <div className="bg-white rounded-md p-3 w-full max-w-md shadow-xl transition-all duration-300">
                        <h2 className="text-base sm:text-lg font-bold text-blue-900 mb-3 border-b pb-1">✏️ Edit Promotion Record</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                                <label className="block text-gray-700 font-medium mb-0.5">Student ID</label>
                                <input type="number" value={selectedRecord.student} onChange={e => handleInputChange("student", e.target.value)} className="border p-1 w-full rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-0.5">From Class</label>
                                <Select
                                    value={classes.find(c => c.value === selectedRecord.from_class)}
                                    onChange={opt => handleInputChange("from_class", opt.value)}
                                    options={classes}
                                    placeholder="Select From Class..."
                                    isSearchable
                                    className="text-xs"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-0.5">To Class</label>
                                <Select
                                    value={classes.find(c => c.value === selectedRecord.to_class)}
                                    onChange={opt => handleInputChange("to_class", opt.value)}
                                    options={classes}
                                    placeholder="Select To Class..."
                                    isSearchable
                                    className="text-xs"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-0.5">Exam ID</label>
                                <input type="number" value={selectedRecord.exam} onChange={e => handleInputChange("exam", e.target.value)} className="border p-1 w-full rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-0.5">Exam Term</label>
                                <input type="text" value={selectedRecord.exam_term} onChange={e => handleInputChange("exam_term", e.target.value)} className="border p-1 w-full rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-0.5">Status</label>
                                <select value={selectedRecord.status} onChange={e => handleInputChange("status", e.target.value)} className="border p-1 w-full rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="promoted">Promoted</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-gray-700 font-medium mb-0.5">Promoted On</label>
                                <input type="date" value={selectedRecord.promoted_on} onChange={e => handleInputChange("promoted_on", e.target.value)} className="border p-1 w-full rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                        <div className="mt-3 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                            <button onClick={() => setEditModalOpen(false)} className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs hover:bg-gray-300 transition">Cancel</button>
                            <button onClick={handleEditSubmit} className="px-2 py-1 bg-blue-900 text-white rounded text-xs hover:bg-blue-800 transition">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromotionRecords;