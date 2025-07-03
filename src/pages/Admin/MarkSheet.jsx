import React,{useState} from 'react'
import { Buttons } from '../../components';

const MarkSheet = () => {
    const [showMarkSheets, setShowMarkSheets] = useState(false);

    const handleFilterClick = () => {
        setShowMarkSheets(true);
    };
    return (
        <div>
            <div>
                
                <div >
                    <h1 className="flex justify-start pl-6  text-white font-extrabold space-x-8 my-8 bg-blue-900 py-4 text-xl rounded-sm">
                        View Mark Sheets
                    </h1>
                </div>
                    <div className="px-6 pt-6 bg-blue-50 rounded-b-md">
                        {/* Selection Table with Dropdowns */}
                        <table className="w-full border-collapse border border-gray-300 mb-4 bg-white shadow-md">
                            <thead>
                                <tr className="bg-blue-900 text-white">
                                    <th className="border border-gray-300 p-2">Class</th>
                                    <th className="border border-gray-300 p-2">Subject</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-gray-300 p-2">
                                        <select className="w-full p-1 border border-gray-300 rounded">
                                            <option>Select Class</option>
                                            <option>10th</option>
                                            <option>12th</option>
                                        </select>
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <select className="w-full p-1 border border-gray-300 rounded">
                                            <option>Select Subject</option>
                                            <option>Mathematics</option>
                                            <option>Science</option>
                                        </select>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        {/* Print Admit Cards Button */}
                    <div className="flex justify-end mb-4">
                        <button onClick={handleFilterClick} className="bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700">
                            Filter Data
                        </button>
                    </div>
                    </div>
                </div>
            <div className="px-6 pb-6 bg-blue-50 rounded-b-md">
                {/* Show Mark Sheets Table */}
                {showMarkSheets && (
                    <div className="mt-6 w-full max-w-5xl ml-7">
                        <Buttons/>
                        {/* <div className="flex justify-end mb-4">
                            <button className="bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-700">
                                Print
                            </button>
                        </div> */}

                        {/* Mark Sheet Table */}
                        <table className="w-full border-collapse border border-gray-300 bg-white mb-4 shadow-md">
                            <thead className="bg-blue-900 text-white">
                                <tr>
                                    <th className="border border-gray-300 p-2">#</th>
                                    <th className="border border-gray-300 p-2">Student Name</th>
                                    <th className="border border-gray-300 p-2">Roll Number</th>
                                    <th className="border border-gray-300 p-2">Class</th>
                                    <th className="border border-gray-300 p-2">Subject</th>
                                    <th className="border border-gray-300 p-2">Marks</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-gray-300 p-2">1</td>
                                    <td className="border border-gray-300 p-2">John Doe</td>
                                    <td className="border border-gray-300 p-2">12345</td>
                                    <td className="border border-gray-300 p-2">10th</td>
                                    <td className="border border-gray-300 p-2">Mathematics</td>
                                    <td className="border border-gray-300 p-2">85</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 p-2">1</td>
                                    <td className="border border-gray-300 p-2">John Doe</td>
                                    <td className="border border-gray-300 p-2">12345</td>
                                    <td className="border border-gray-300 p-2">10th</td>
                                    <td className="border border-gray-300 p-2">Mathematics</td>
                                    <td className="border border-gray-300 p-2">85</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 p-2">1</td>
                                    <td className="border border-gray-300 p-2">John Doe</td>
                                    <td className="border border-gray-300 p-2">12345</td>
                                    <td className="border border-gray-300 p-2">10th</td>
                                    <td className="border border-gray-300 p-2">Mathematics</td>
                                    <td className="border border-gray-300 p-2">85</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 p-2">1</td>
                                    <td className="border border-gray-300 p-2">John Doe</td>
                                    <td className="border border-gray-300 p-2">12345</td>
                                    <td className="border border-gray-300 p-2">10th</td>
                                    <td className="border border-gray-300 p-2">Mathematics</td>
                                    <td className="border border-gray-300 p-2">85</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MarkSheet