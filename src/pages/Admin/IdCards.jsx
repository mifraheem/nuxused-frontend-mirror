import React, { useState } from 'react'

const IdCards = () => {
    const [showCards, setShowCards] = useState(false);

    const handleFilter = () => {
        setShowCards(true);
    };
    return (
        <div>
            <div >
                <h1 className="flex justify-start pl-6  text-white font-extrabold space-x-8 my-8 bg-blue-900 py-4 text-xl rounded-sm">
                    Generate ID Cards
                </h1>
            </div>
            <div className="p-6 bg-blue-50 rounded-b-md">
                {/* Table Section with Dropdowns */}
                <table className="w-full border-collapse border border-gray-300 mb-4 bg-white shadow-md">
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
                                    <option>ID Card</option>
                                    <option>Library Card</option>
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
                {/* Print Cards Button */}
                {showCards && (
                    <div className="flex justify-end mb-4">
                        <button className="bg-red-500 text-white px-4 py-2 rounded-md shadow hover:bg-red-700">
                            Print ID Cards
                        </button>
                    </div>
                )}
                {/* ID Cards */}
                {showCards && (
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="bg-white p-6 rounded-lg shadow-md border border-gray-300 text-center relative">
                                <div className="border-b-2 border-blue-900 pb-4 mb-4 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-blue-900">High School</h3>
                                    <img src="school-logo.png" alt="School Logo" className="w-12 h-12" />
                                </div>
                                <img src="student-photo.png" alt="Student" className="w-24 h-24 mx-auto rounded-full mb-4" />
                                <h3 className="font-bold text-lg mb-2">Student Card</h3>
                                <div className="text-left text-sm text-gray-700">
                                    <p><strong>Name:</strong> Lars Peeters</p>
                                    <p><strong>ID:</strong> 123-456-7890</p>
                                    <p><strong>D.O.B:</strong> 7/09/2000</p>
                                    <p><strong>Address:</strong> 123 Anywhere St., Any City</p>
                                </div>
                                <div className="mt-4">
                                    <img src="barcode.png" alt="Barcode" className="w-full h-8" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default IdCards