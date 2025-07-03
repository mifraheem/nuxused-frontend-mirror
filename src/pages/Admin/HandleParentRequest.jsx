import React,{useState} from 'react'
import { Buttons } from '../../components';

const HandleParentRequest = () => {
    const [data, setData] = useState([
        { id: 1, request: 'Change Contact Info', status: 'Pending', dateTime: '2024-06-01 10:00 AM' }
    ]);
    return (
        <div>
            <div className="bg-blue-900 text-white py-2 px-6 rounded-md flex justify-between items-center mt-5">
                <h1 className="text-xl font-bold">Handle Parent's Requests</h1>
                <button

                    className="flex items-center px-3 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-500 transition"
                >
                    <div className="flex items-center justify-center w-8 h-8 bg-black rounded-full mr-3">
                        <span className="text-cyan-500 text-xl font-bold">+</span>
                    </div>
                    Add New Request
                </button>
            </div>
            <div className="p-6 bg-blue-50 rounded-b-md">
                <Buttons/>
                <div className="overflow-x-auto shadow-md">
                    <table className="w-full border-collapse border border-gray-300 text-sm bg-white">
                        <thead>
                            <tr className="bg-blue-900 text-white">
                                <th className="border border-gray-300 p-2">ID #</th>
                                <th className="border border-gray-300 p-2">Request</th>
                                <th className="border border-gray-300 p-2">Status</th>
                                <th className="border border-gray-300 p-2">Date & Time</th>
                                <th className="border border-gray-300 p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row) => (
                                <tr key={row.id} className="text-center">
                                    <td className="border border-gray-300 p-2">{row.id}</td>
                                    <td className="border border-gray-300 p-2">{row.request}</td>
                                    <td className="border border-gray-300 p-2">{row.status}</td>
                                    <td className="border border-gray-300 p-2">{row.dateTime}</td>
                                    <td className="border border-gray-300 p-2">
                                        <button className="bg-green-500 text-white px-2 py-1 rounded-md mr-1 hover:bg-green-700">Accept</button>
                                        <button className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-700">Deny</button>
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

export default HandleParentRequest