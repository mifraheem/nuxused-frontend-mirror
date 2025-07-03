import React, { useState } from "react";
import { Buttons } from '../../components';

const ViewOnlineClasses = () => {
    const [classes, setClasses] = useState([
        { id: 1, topic: "Mathematics", startTime: "10:00 AM", password: "1234", class: "10th", section: "A", date: "2024-02-01", timing: "1hr", createdBy: "Teacher A" },
        { id: 2, topic: "Science", startTime: "12:00 PM", password: "5678", class: "12th", section: "B", date: "2024-02-02", timing: "2hr", createdBy: "Teacher B" }
    ]);

    const handleDeleteClass = (id) => {
        setClasses(classes.filter((cls) => cls.id !== id));
    };

    return (
        <div >
            <h1 className="text-white font-extrabold my-8 bg-blue-900 py-4 px-6 text-xl rounded-sm">
                View Online Classes
            </h1>
            <div className="p-6">
                {/* Classes Table */}
                <Buttons/>
                <div className="w-full  p-4 rounded-md ">
                    <table className="w-full border-collapse border border-gray-300 bg-white shadow-md">
                        <thead className="bg-blue-900 text-white">
                            <tr>
                                <th className="border border-gray-300 p-2">#</th>
                                <th className="border border-gray-300 p-2">Class Topic</th>
                                <th className="border border-gray-300 p-2">Start Time</th>
                                <th className="border border-gray-300 p-2">Password</th>
                                <th className="border border-gray-300 p-2">Class</th>
                                <th className="border border-gray-300 p-2">Section</th>
                                <th className="border border-gray-300 p-2">Date</th>
                                <th className="border border-gray-300 p-2">Timing</th>
                                <th className="border border-gray-300 p-2">Created By</th>
                                <th className="border border-gray-300 p-2">Options</th>
                                <th className="border border-gray-300 p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.map((cls, index) => (
                                <tr key={cls.id}>
                                    <td className="border border-gray-300 p-2">{index + 1}</td>
                                    <td className="border border-gray-300 p-2">{cls.topic}</td>
                                    <td className="border border-gray-300 p-2">{cls.startTime}</td>
                                    <td className="border border-gray-300 p-2">{cls.password}</td>
                                    <td className="border border-gray-300 p-2">{cls.class}</td>
                                    <td className="border border-gray-300 p-2">{cls.section}</td>
                                    <td className="border border-gray-300 p-2">{cls.date}</td>
                                    <td className="border border-gray-300 p-2">{cls.timing}</td>
                                    <td className="border border-gray-300 p-2">{cls.createdBy}</td>
                                    <td className="border border-gray-300 p-2">
                                        <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-700">
                                            Join Class
                                        </button>
                                    </td>
                                    <td className="border border-gray-300 p-2">
                                        <button onClick={() => handleDeleteClass(cls.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ViewOnlineClasses;
