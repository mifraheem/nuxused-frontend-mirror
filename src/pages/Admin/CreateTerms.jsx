import React, { useState } from 'react'
import { Buttons } from '../../components';

const CreateTerms = () => {
    const [terms, setTerms] = useState([]);
    return (
        <div>
            <div className="bg-blue-900 text-white py-2 px-6 rounded-md flex justify-between items-center mt-5">
                <h1 className="text-xl font-bold">Create Terms</h1>
                <button

                    className="flex items-center px-3 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-500 transition"
                >
                    <div className="flex items-center justify-center w-8 h-8 bg-black rounded-full mr-3">
                        <span className="text-cyan-500 text-xl font-bold">+</span>
                    </div>
                    Create New Terms
                </button>
            </div>
            <div className="p-6 bg-blue-50 rounded-b-md">
                <Buttons />
                {/* Terms Table */}
                <table className="w-full border-collapse border border-gray-300 mb-4 bg-white shadow-md">
                    <thead>
                        <tr className="bg-blue-900 text-white">
                            <th className="border border-gray-300 p-2">#</th>
                            <th className="border border-gray-300 p-2">Term Name</th>
                            <th className="border border-gray-300 p-2">Start Date</th>
                            <th className="border border-gray-300 p-2">End Date</th>
                            <th className="border border-gray-300 p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {terms.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center p-4">No terms available</td>
                            </tr>
                        ) : (
                            terms.map((term, index) => (
                                <tr key={index} className="text-center">
                                    <td className="border border-gray-300 p-2">{index + 1}</td>
                                    <td className="border border-gray-300 p-2">{term.name}</td>
                                    <td className="border border-gray-300 p-2">{term.startDate}</td>
                                    <td className="border border-gray-300 p-2">{term.endDate}</td>
                                    <td className="border border-gray-300 p-2">
                                        <button className="bg-green-500 text-white px-2 py-1 rounded-md mr-1 hover:bg-green-700">Edit</button>
                                        <button className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-700">Delete</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default CreateTerms