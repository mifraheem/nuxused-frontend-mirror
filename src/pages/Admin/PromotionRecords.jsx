import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import { MdEdit, MdVisibility } from "react-icons/md";
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
        <div className="p-4 bg-gray-50 min-h-screen">
            <Toaster position="top-center" />
            <div className="bg-blue-900 rounded">

                <h1 className="text-2xl font-bold text-white mb-6   py-2 px-3">Student Promotion Records</h1>
            </div>
            {isLoading ? (
                <p className="text-center text-gray-600">Loading...</p>
            ) : (
                <div className="overflow-x-auto shadow-sm rounded-lg">
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


                    <table className="w-full border-collapse bg-white text-sm">
                        <thead className="bg-blue-900 text-white">
                            <tr>
                                <th className="border p-3 text-left">ID</th>
                                <th className="border p-3 text-left">Student</th>
                                <th className="border p-3 text-left">From Class</th>
                                <th className="border p-3 text-left">To Class</th>
                                <th className="border p-3 text-left">Exam</th>
                                <th className="border p-3 text-left">Status</th>
                                <th className="border p-3 text-left">Promoted On</th>
                                <th className="border p-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(rec => (
                                <tr key={rec.id} className="hover:bg-gray-100 transition-colors">
                                    <td className="border p-3 text-center">{rec.id}</td>
                                    <td className="border p-3">{rec.student_name}</td>
                                    <td className="border p-3">{rec.from_class_name}</td>
                                    <td className="border p-3">
                                        {rec.to_class_name.includes("__str__") ? "—" : rec.to_class_name}
                                    </td>
                                    <td className="border p-3">{rec.exam_term}</td>
                                    <td className="border p-3 text-center">
                                        <span className="px-2 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                            {rec.status}
                                        </span>
                                    </td>
                                    <td className="border p-3 text-center">{rec.promoted_on}</td>
                                    <td className="border p-3 text-center">
                                        <button onClick={() => { setSelectedRecord(rec); setEditModalOpen(true); }} className="text-yellow-500 hover:text-yellow-600 transition-colors"><MdEdit size={20} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {editModalOpen && selectedRecord && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl transform transition-all duration-300">
                        <h2 className="text-xl font-bold text-blue-900 mb-5 border-b-2 border-blue-300 pb-2">✏️ Edit Promotion Record</h2>
                        <div className="grid grid-cols-2 gap-6 text-sm">
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Student ID</label>
                                <input type="number" value={selectedRecord.student} onChange={e => handleInputChange("student", e.target.value)} className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">From Class ID</label>
                                <Select
                                    value={classes.find(c => c.value === selectedRecord.from_class)}
                                    onChange={opt => handleInputChange("from_class", opt.value)}
                                    options={classes}
                                    placeholder="Select From Class..."
                                    isSearchable
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">To Class ID</label>
                                <Select
                                    value={classes.find(c => c.value === selectedRecord.to_class)}
                                    onChange={opt => handleInputChange("to_class", opt.value)}
                                    options={classes}
                                    placeholder="Select To Class..."
                                    isSearchable
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Exam ID</label>
                                <input type="number" value={selectedRecord.exam} onChange={e => handleInputChange("exam", e.target.value)} className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Exam Term</label>
                                <input type="text" value={selectedRecord.exam_term} onChange={e => handleInputChange("exam_term", e.target.value)} className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Status</label>
                                <select value={selectedRecord.status} onChange={e => handleInputChange("status", e.target.value)} className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="promoted">Promoted</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-gray-700 font-medium mb-1">Promoted On</label>
                                <input type="date" value={selectedRecord.promoted_on} onChange={e => handleInputChange("promoted_on", e.target.value)} className="border border-gray-300 p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end space-x-4">
                            <button onClick={() => setEditModalOpen(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">Cancel</button>
                            <button onClick={handleEditSubmit} className="px-6 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromotionRecords;