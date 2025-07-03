import React, { useState } from 'react'
import { Buttons } from '../../components';

const BirthdayManagement = () => {
    const [data, setData] = useState([
        { id: 1, name: 'John Doe', fatherName: 'Richard Doe', section: 'A', class: '10', dateTime: '2024-06-01 10:00 AM' }
    ]);
    return (
        <div>
            <div >
                <h1 className="flex justify-start pl-6  text-white font-extrabold space-x-8 my-8 bg-blue-900 py-4 text-xl rounded-sm">
                    Birthday Management
                </h1>
            </div>
            <Buttons />
            <div className="p-6 bg-blue-50 rounded-b-md">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm bg-white shadow-md">
                        <thead>
                            <tr className="bg-blue-900 text-white">
                                <th className="border border-gray-300 p-2">ID #</th>
                                <th className="border border-gray-300 p-2">Name</th>
                                <th className="border border-gray-300 p-2">Father Name</th>
                                <th className="border border-gray-300 p-2">Section</th>
                                <th className="border border-gray-300 p-2">Class</th>
                                <th className="border border-gray-300 p-2">Date & Time</th>
                                <th className="border border-gray-300 p-2">SMS</th>
                                <th className="border border-gray-300 p-2">Wish</th>
                                <th className="border border-gray-300 p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row) => (
                                <tr key={row.id} className="text-center">
                                    <td className="border border-gray-300 p-2">{row.id}</td>
                                    <td className="border border-gray-300 p-2">{row.name}</td>
                                    <td className="border border-gray-300 p-2">{row.fatherName}</td>
                                    <td className="border border-gray-300 p-2">{row.section}</td>
                                    <td className="border border-gray-300 p-2">{row.class}</td>
                                    <td className="border border-gray-300 p-2">{row.dateTime}</td>
                                    <td className="border border-gray-300 p-2">
                                        <button className="bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-700">Send SMS</button>
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <button className="bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-700">Send Birthday Card</button>
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <button className="bg-blue-500 text-white px-2 py-1 rounded-md mr-1 hover:bg-blue-700">Edit</button>
                                        <button className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-700">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default BirthdayManagement