import React, { useState } from 'react'

const PrintAdmissionForms = () => {
    const [showForms, setShowForms] = useState(false);

    const handleFilter = () => {
        setShowForms(true);
    };

    return (

        <div >
            <div >
                <h1 className="flex justify-start pl-6  text-white font-extrabold space-x-8 my-8 bg-blue-900 py-4 text-xl rounded-sm">
                    Admission Forms
                </h1>
            </div>
            <div className="p-6 bg-blue-50 rounded-b-md">
                {/* Table Section */}
                <table className="w-full border-collapse border border-gray-300 mb-4 bg-white rounded-lg shadow-md">
                    <thead>
                        <tr className="bg-blue-900 text-white">
                            <th className="border border-gray-300 p-2">Type</th>
                            <th className="border border-gray-300 p-2">Class</th>
                            <th className="border border-gray-300 p-2">Section</th>
                            <th className="border border-gray-300 p-2">Color</th>
                            <th className="border border-gray-300 p-2">Year</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-gray-300 p-2">
                                <select className="w-full p-2 border border-gray-300 rounded-md">
                                    <option>General</option>
                                    <option>Science</option>
                                    <option>Commerce</option>
                                </select>
                            </td>
                            <td className="border border-gray-300 p-2">
                                <select className="w-full p-2 border border-gray-300 rounded-md">
                                    <option>Class 1</option>
                                    <option>Class 2</option>
                                    <option>Class 3</option>
                                </select>
                            </td>
                            <td className="border border-gray-300 p-2">
                                <select className="w-full p-2 border border-gray-300 rounded-md">
                                    <option>Section A</option>
                                    <option>Section B</option>
                                    <option>Section C</option>
                                </select>
                            </td>
                            <td className="border border-gray-300 p-2">
                                <select className="w-full p-2 border border-gray-300 rounded-md">
                                    <option>Red</option>
                                    <option>Blue</option>
                                    <option>Green</option>
                                </select>
                            </td>
                            <td className="border border-gray-300 p-2">
                                <select className="w-full p-2 border border-gray-300 rounded-md">
                                    <option>2023</option>
                                    <option>2024</option>
                                    <option>2025</option>
                                </select>
                            </td>
                        </tr>
                    </tbody>
                </table>
                {/* Filter Button */}
                <div className="flex justify-end mb-4">
                    <button onClick={handleFilter} className="bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700">
                        Filter Data
                    </button>
                </div>
                {/* Print Forms Button */}
                {showForms && (
                    <div className="flex justify-end mb-4">
                        <button className="bg-red-500 text-white px-4 py-2 rounded-md shadow hover:bg-red-700">
                            Print Forms
                        </button>
                    </div>
                )}
                {/* Admission Forms */}
                {showForms && (
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="bg-white p-6 rounded-lg shadow-md border border-gray-300 text-center relative">
                                <div className="border-b-2 border-blue-900 pb-4 mb-4">
                                    <h3 className="text-xl font-bold text-blue-900">High School</h3>
                                    <p className="text-sm text-gray-600">Educational & IT Training Academy</p>
                                </div>
                                <h3 className="font-bold text-lg mb-2">Admission Form {item}</h3>
                                <div className="text-left text-sm text-gray-700">
                                    <p><strong>Student's Name:</strong> __________________</p>
                                    <p><strong>Father's Name:</strong> __________________</p>
                                    <p><strong>Class:</strong> __________ <strong>Section:</strong> _____</p>
                                    <p><strong>Birth Date:</strong> __/__/____ <strong>Gender:</strong> ☐ Male ☐ Female</p>
                                    <p><strong>Address:</strong> ______________________________________</p>
                                    <p><strong>Phone:</strong> ____________ <strong>Email:</strong> ____________</p>
                                    <p><strong>Course Name:</strong> ______________________________</p>
                                </div>
                                <div className="border-t-2 border-gray-300 pt-4 mt-4 text-sm text-gray-700">
                                    <p><strong>Declaration:</strong> I hereby declare that I will abide by the rules and regulations of the institution.</p>
                                </div>
                                <div className="flex justify-between mt-4 text-sm">
                                    <p>Student's Signature: ___________</p>
                                    <p>Authorized Signature: ___________</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

    );
}

export default PrintAdmissionForms