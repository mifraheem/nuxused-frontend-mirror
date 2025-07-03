import React, { useState } from 'react';
import { Buttons } from '../../components';

const ViewTimetable = () => {
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [showTimetable, setShowTimetable] = useState(false);
    const [editing, setEditing] = useState(false);
    const [timetable, setTimetable] = useState({
        "Class One - Section A": {
            "MONDAY": { time: "08:00 AM - 10:00 AM", teacher: "Mr. Smith", subject: "Mathematics" },
            "TUESDAY": { time: "10:00 AM - 12:00 PM", teacher: "Ms. Johnson", subject: "Science" },
            "WEDNESDAY": { time: "01:00 PM - 03:00 PM", teacher: "Dr. Brown", subject: "English" },
        },
        "Class Two - Section B": {
            "MONDAY": { time: "09:00 AM - 11:00 AM", teacher: "Prof. Williams", subject: "History" },
            "TUESDAY": { time: "11:00 AM - 01:00 PM", teacher: "Mr. Smith", subject: "Mathematics" },
        }
    });

    const handleFilterClick = () => {
        setShowTimetable(true);
    };

    const handleEditClick = () => {
        setEditing(!editing);
    };

    const handleInputChange = (day, field, value) => {
        setTimetable(prev => ({
            ...prev,
            [`${selectedClass} - ${selectedSection}`]: {
                ...prev[`${selectedClass} - ${selectedSection}`],
                [day]: {
                    ...prev[`${selectedClass} - ${selectedSection}`][day],
                    [field]: value
                }
            }
        }));
    };

    const classes = ["Class One", "Class Two", "Class Three"];
    const sections = ["Section A", "Section B", "Section C"];
    const timeSlots = ["08:00 AM - 10:00 AM", "10:00 AM - 12:00 PM", "01:00 PM - 03:00 PM", "03:00 PM - 05:00 PM"];
    const teachers = ["Mr. Smith", "Ms. Johnson", "Dr. Brown", "Prof. Williams"];
    const subjects = ["Mathematics", "Science", "English", "History"];

    return (
        <div>
            <h1 className="flex justify-start pl-6 text-white font-extrabold my-8 bg-blue-900 py-4 text-xl rounded-sm">
                View & Edit Timetable
            </h1>

            <div className="p-6 bg-blue-50 rounded-b-md">
                {/* Selection Dropdowns */}
                <table className="w-full border-collapse border border-gray-300 mb-4 bg-white shadow-md">
                    <thead>
                        <tr className="bg-blue-900 text-white">
                            <th className="border border-gray-300 p-2">Class</th>
                            <th className="border border-gray-300 p-2">Section</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-gray-300 p-2">
                                <select
                                    className="w-full p-1 border border-gray-300 rounded"
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                >
                                    <option>Select Class</option>
                                    {classes.map((cls, idx) => (
                                        <option key={idx} value={cls}>{cls}</option>
                                    ))}
                                </select>
                            </td>
                            <td className="border border-gray-300 p-2">
                                <select
                                    className="w-full p-1 border border-gray-300 rounded"
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                >
                                    <option>Select Section</option>
                                    {sections.map((sec, idx) => (
                                        <option key={idx} value={sec}>{sec}</option>
                                    ))}
                                </select>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Filter Data Button */}
                <div className="flex justify-end mb-4">
                    <button
                        onClick={handleFilterClick}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700"
                    >
                        Filter Data
                    </button>
                </div>
            </div>

            {/* Show Timetable */}
            {showTimetable && selectedClass && selectedSection && (
                <div className="mt-6 w-full max-w-5xl px-7">
                    <Buttons/>
                    <div className="bg-blue-900 text-white px-4 py-2 rounded-t-md font-semibold">
                        Timetable For {selectedClass} - {selectedSection}
                    </div>
                    <table className="w-full border-collapse border border-gray-300 bg-white shadow-md">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="border border-gray-300 p-2">Day</th>
                                <th className="border border-gray-300 p-2">Time</th>
                                <th className="border border-gray-300 p-2">Teacher</th>
                                <th className="border border-gray-300 p-2">Subject</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(timetable[`${selectedClass} - ${selectedSection}`] || {}).map((day, index) => (
                                <tr key={index}>
                                    <td className="border border-gray-300 p-2">{day}</td>

                                    {/* Editable Time Dropdown */}
                                    <td className="border border-gray-300 p-2">
                                        {editing ? (
                                            <select
                                                className="w-full p-1 border border-gray-300 rounded"
                                                value={timetable[`${selectedClass} - ${selectedSection}`][day]?.time}
                                                onChange={(e) => handleInputChange(day, 'time', e.target.value)}
                                            >
                                                {timeSlots.map((slot, idx) => (
                                                    <option key={idx} value={slot}>{slot}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            timetable[`${selectedClass} - ${selectedSection}`][day]?.time
                                        )}
                                    </td>

                                    {/* Editable Teacher Dropdown */}
                                    <td className="border border-gray-300 p-2">
                                        {editing ? (
                                            <select
                                                className="w-full p-1 border border-gray-300 rounded"
                                                value={timetable[`${selectedClass} - ${selectedSection}`][day]?.teacher}
                                                onChange={(e) => handleInputChange(day, 'teacher', e.target.value)}
                                            >
                                                {teachers.map((teacher, idx) => (
                                                    <option key={idx} value={teacher}>{teacher}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            timetable[`${selectedClass} - ${selectedSection}`][day]?.teacher
                                        )}
                                    </td>

                                    {/* Editable Subject Dropdown */}
                                    <td className="border border-gray-300 p-2">
                                        {editing ? (
                                            <select
                                                className="w-full p-1 border border-gray-300 rounded"
                                                value={timetable[`${selectedClass} - ${selectedSection}`][day]?.subject}
                                                onChange={(e) => handleInputChange(day, 'subject', e.target.value)}
                                            >
                                                {subjects.map((subject, idx) => (
                                                    <option key={idx} value={subject}>{subject}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            timetable[`${selectedClass} - ${selectedSection}`][day]?.subject
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Edit & Save Button */}
                    <div className="flex justify-end mt-4 mb-7">
                        <button
                            onClick={handleEditClick}
                            className={`px-4 py-2 rounded-md shadow ${editing ? "bg-green-500 hover:bg-green-700 text-white" : "bg-yellow-500 hover:bg-yellow-700 text-white"}`}
                        >
                            {editing ? "Save Changes" : "Edit Timetable"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewTimetable;
