import React, { useState } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { Buttons } from '../../components';

const ReportingPage = () => {
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedReport, setSelectedReport] = useState('');
    const [showReport, setShowReport] = useState(false);

    const handleGenerateReport = () => {
        setShowReport(true);
    };

    const classes = ["Class One", "Class Two", "Class Three"];
    const sections = ["Section A", "Section B", "Section C"];
    const reports = ["Attendance Report", "Exam Performance", "Fee Status"];

    // Example Data for Charts
    const barChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [
            {
                label: 'Attendance Percentage',
                data: [95, 85, 80, 92, 88],
                backgroundColor: 'blue',
            },
        ],
    };

    const pieChartData = {
        labels: ['Paid', 'Pending'],
        datasets: [
            {
                data: [75, 25],
                backgroundColor: ['blue', 'grey'],
            },
        ],
    };

    return (
        <div >
            <h1 className="flex justify-start pl-6 text-white font-extrabold my-8 bg-blue-900 py-4 text-xl rounded-sm">
                School Reporting Dashboard
            </h1>
            <div className='p-7'>
            {/* Filter Section */}
            <div className="p-6 bg-blue-50 rounded-md">
                <div className="grid grid-cols-3 gap-4">
                    {/* Class Dropdown */}
                    <select
                        className="p-2 border border-gray-300 rounded w-full"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <option>Select Class</option>
                        {classes.map((cls, idx) => (
                            <option key={idx} value={cls}>{cls}</option>
                        ))}
                    </select>

                    {/* Section Dropdown */}
                    <select
                        className="p-2 border border-gray-300 rounded w-full"
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                    >
                        <option>Select Section</option>
                        {sections.map((sec, idx) => (
                            <option key={idx} value={sec}>{sec}</option>
                        ))}
                    </select>

                    {/* Report Type Dropdown */}
                    <select
                        className="p-2 border border-gray-300 rounded w-full"
                        value={selectedReport}
                        onChange={(e) => setSelectedReport(e.target.value)}
                    >
                        <option>Select Report Type</option>
                        {reports.map((report, idx) => (
                            <option key={idx} value={report}>{report}</option>
                        ))}
                    </select>
                </div>

                {/* Generate Report Button */}
                <div className="flex justify-end mt-4">
                    <button
                        onClick={handleGenerateReport}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700"
                    >
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Report Section */}
            {showReport && (
                <div className="mt-6">
                    <h2 className="text-lg font-semibold text-white bg-blue-900 px-4 py-2 rounded-t-md">
                        {selectedReport} - {selectedClass} {selectedSection}
                    </h2>
                    <div className="p-6 bg-white rounded-b-md shadow-md">
                        {/* Charts Section */}
                        {selectedReport === "Attendance Report" && (
                            <div className="flex justify-around">
                                <div className="w-1/2">
                                    <Bar data={barChartData} />
                                </div>
                            </div>
                        )}

                        {selectedReport === "Exam Performance" && (
                            <div className="flex justify-around">
                                <div className="w-1/2">
                                    <Line data={barChartData} />
                                </div>
                            </div>
                        )}

                        {selectedReport === "Fee Status" && (
                            <div className="flex justify-around">
                                <div className="w-1/3">
                                    <Pie data={pieChartData} />
                                </div>
                            </div>
                        )}

                        {/* Export Buttons */}
                        <Buttons/>
                        {/* Table Report */}
                        <table className="w-full border-collapse border border-gray-300 mt-6">
                            <thead className="bg-blue-900 text-white">
                                <tr>
                                    <th className="border border-gray-300 p-2">#</th>
                                    <th className="border border-gray-300 p-2">Student Name</th>
                                    <th className="border border-gray-300 p-2">Roll Number</th>
                                    <th className="border border-gray-300 p-2">{selectedReport === "Fee Status" ? "Fee Status" : "Marks"}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-gray-300 p-2">1</td>
                                    <td className="border border-gray-300 p-2">John Doe</td>
                                    <td className="border border-gray-300 p-2">12345</td>
                                    <td className="border border-gray-300 p-2">
                                        {selectedReport === "Fee Status" ? "Paid" : "85"}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 p-2">2</td>
                                    <td className="border border-gray-300 p-2">Jane Smith</td>
                                    <td className="border border-gray-300 p-2">67890</td>
                                    <td className="border border-gray-300 p-2">
                                        {selectedReport === "Fee Status" ? "Pending" : "92"}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default ReportingPage;
