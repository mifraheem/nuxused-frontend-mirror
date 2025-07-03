import React, { useState } from 'react'

const AdmitSlips = () => {

    const [showCards, setShowCards] = useState(false);

    const handlePrintClick = () => {
        setShowCards(true);
        };

    return (
        <div >
            <div >
                <div >
                    <h1 className="flex justify-start pl-6  text-white font-extrabold space-x-8 my-8 bg-blue-900 py-4 text-xl rounded-sm">
                        Print Admit Crds/Slips
                    </h1>
                </div>
                <div className="p-6 bg-blue-50 rounded-b-md">


                    {/* Selection Table */}
                    <table className="w-full border-collapse border border-gray-300 mb-4 bg-white shadow-md">
                        <thead>
                            <tr className="bg-blue-900 text-white">
                                <th className="border border-gray-300 p-2">Exam</th>
                                <th className="border border-gray-300 p-2">Class</th>
                                <th className="border border-gray-300 p-2">Section</th>
                                <th className="border border-gray-300 p-2">Color</th>
                                <th className="border border-gray-300 p-2">Year</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 p-2">
                                    <select className="w-full p-1 border border-gray-300 rounded">
                                        <option>Exam</option>
                                        <option>Midterm</option>
                                        <option>Final</option>
                                    </select>
                                </td>
                                <td className="border border-gray-300 p-2">
                                    <select className="w-full p-1 border border-gray-300 rounded">
                                        <option>Class</option>
                                        <option>10th</option>
                                        <option>12th</option>
                                    </select>
                                </td>
                                <td className="border border-gray-300 p-2">
                                    <select className="w-full p-1 border border-gray-300 rounded">
                                        <option>Section</option>
                                        <option>A</option>
                                        <option>B</option>
                                    </select>
                                </td>
                                <td className="border border-gray-300 p-2">
                                    <select className="w-full p-1 border border-gray-300 rounded">
                                        <option>Color</option>
                                        <option>Blue</option>
                                        <option>Red</option>
                                    </select>
                                </td>
                                <td className="border border-gray-300 p-2">
                                    <select className="w-full p-1 border border-gray-300 rounded">
                                        <option>Year</option>
                                        <option>2023</option>
                                        <option>2024</option>
                                    </select>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    {/* Print Admit Cards Button */}
                    <div className="flex justify-end mb-4">
                        <button onClick={handlePrintClick} className="bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700">
                            Print Admit Cards
                        </button>
                    </div>
                </div>
            </div>

            {/* Show Print Button and Cards */}
            {showCards && (
                <div className="p-6 bg-blue-50 rounded-b-md">
                    <div className="flex justify-end mb-4">
                        <button className="bg-red-500 text-white px-4 py-2 rounded-md shadow hover:bg-red-700">
                            Print
                        </button>
                    </div>

                    {/* Cards Layout */}
                    <div className="grid grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map((_, index) => (
                            <div key={index} className="bg-white border border-gray-300 rounded-lg shadow-md p-4">
                                <h3 className="text-center font-bold text-lg">Exam Slip</h3>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                                    <div>
                                        <p><strong>Student Name:</strong> John Doe</p>
                                        <p><strong>Roll No:</strong> 12345</p>
                                        <p><strong>Class:</strong> 10th</p>
                                    </div>
                                </div>
                                <table className="w-full mt-4 border border-gray-300 text-sm">
                                    <thead className="bg-gray-200">
                                        <tr>
                                            <th className="border border-gray-300 p-1">Subject</th>
                                            <th className="border border-gray-300 p-1">Date</th>
                                            <th className="border border-gray-300 p-1">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-gray-300 p-1">Mathematics</td>
                                            <td className="border border-gray-300 p-1">10th March</td>
                                            <td className="border border-gray-300 p-1">9:00 AM - 11:00 AM</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-300 p-1">Science</td>
                                            <td className="border border-gray-300 p-1">12th March</td>
                                            <td className="border border-gray-300 p-1">9:00 AM - 11:00 AM</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdmitSlips