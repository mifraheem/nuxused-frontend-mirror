import React, { useState } from 'react'

const StaffCards = () => {
    const [showCards, setShowCards] = useState(false);

    const handleFilter = () => {
        setShowCards(true);
    };
    return (
        <div>
            <div >
                <h1 className="flex justify-start pl-6  text-white font-extrabold space-x-8 my-8 bg-blue-900 py-4 text-xl rounded-sm">
                    Generate Staff ID Cards
                </h1>
            </div>
            <div className="p-6 bg-blue-50 rounded-b-md">
                {/* Table Section with Dropdowns */}
                <table className="w-full border-collapse border border-gray-300 mb-4 bg-white shadow-md">
                    <thead>
                        <tr className="bg-blue-900 text-white">
                            <th className="border border-gray-300 p-2">Type</th>
                            <th className="border border-gray-300 p-2">Staff</th>
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
                                    <option>Mr. Smith</option>
                                    <option>Ms. Johnson</option>
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
                {/* Staff ID Cards */}
                {showCards && (
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="bg-purple-200 p-6 rounded-lg shadow-md border border-gray-300 text-center relative">
                                <div className="border-b-2 border-purple-900 pb-4 mb-4 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-purple-900">High School</h3>
                                    <img src="company-logo.png" alt="Company Logo" className="w-12 h-12" />
                                </div>
                                <img src="staff-photo.png" alt="Staff" className="w-24 h-24 mx-auto rounded-full mb-4" />
                                <h3 className="font-bold text-lg mb-2">SHAWN GARCIA</h3>
                                <span className="bg-white text-black px-3 py-1 rounded-md">Sales</span>
                                <div className="text-left text-sm text-gray-700 mt-4">
                                    <p><strong>ID No:</strong> 1234567890</p>
                                    <p><strong>Email:</strong> hello@reallygreatsite.com</p>
                                    <p><strong>Phone:</strong> +123-456-7890</p>
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

export default StaffCards