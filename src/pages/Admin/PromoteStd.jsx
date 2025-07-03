import React, { useState, useEffect } from "react";
import { Buttons } from "../../components";

const PromoteStd = () => {
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);

  // Load students and parents from localStorage
  useEffect(() => {
    const savedStudents = JSON.parse(localStorage.getItem("students")) || [];
    const savedParents = JSON.parse(localStorage.getItem("parents")) || [];
    setStudents(savedStudents);
    setParents(savedParents);
  }, []);

  // Save updated students to localStorage
  const saveToLocalStorage = (updatedStudents) => {
    localStorage.setItem("students", JSON.stringify(updatedStudents));
    setStudents(updatedStudents);
  };

  // Handle Promote (increment student class)
  const handlePromote = (index) => {
    let updatedStudents = [...students];
    let student = updatedStudents[index];

    let currentClass = parseInt(student.studentClass);
    if (!isNaN(currentClass)) {
      student.studentClass = (currentClass + 1).toString();
    }

    student.status = "Promoted";
    updatedStudents[index] = student;
    saveToLocalStorage(updatedStudents);
  };

  // Handle Transfer (change section)
  const handleTransfer = (index) => {
    let updatedStudents = [...students];
    let student = updatedStudents[index];

    student.section = student.section === "A" ? "B" : "A";
    student.status = "Transferred";
    updatedStudents[index] = student;
    saveToLocalStorage(updatedStudents);
  };

  // Get Parent Name & Email by Parent ID
  const getParentDetails = (parentId) => {
    const parent = parents.find((p) => p.id === parseInt(parentId));
    return parent ? { name: parent.fatherName, email: parent.fatherEmail } : { name: "N/A", email: "N/A" };
  };

  // Function to render status with color coding
  const getStatusBadge = (status) => {
    const statusColors = {
      Promoted: "bg-green-500",
      Transferred: "bg-yellow-500",
      Active: "bg-blue-500",
    };
    return (
      <span className={`text-white text-xs font-semibold px-3 py-1 rounded-md ${statusColors[status] || "bg-gray-500"}`}>
        {status}
      </span>
    );
  };

  // Define table columns with proper headers
  const columns = [
    "ID #",
    "Student Name",
    "Father Name",
    "Father Email",
    "Contact No.",
    "Class",
    "Section",
    "Status",
    "Actions",
  ];

  return (
    <div >
      <h1 className="text-xl font-bold text-white bg-blue-900 px-6 py-3 rounded-t-md mt-7">Promote/Transfer Students</h1>
      <div className="p-6   rounded-b-md">
        <Buttons />
        <div className="overflow-x-auto shadow-md">
          <table className="w-full border-collapse border border-gray-300 text-sm bg-white ">
            <thead>
              <tr className="bg-blue-900 text-white text-left">
                {columns.map((col, index) => (
                  <th key={index} className="border border-gray-300 p-3">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center p-4 text-gray-500">
                    No students available for promotion or transfer
                  </td>
                </tr>
              ) : (
                students.map((student, index) => {
                  const parentDetails = getParentDetails(student.parentId);
                  return (
                    <tr key={student.id} className="text-left hover:bg-gray-100">
                      <td className="border border-gray-300 p-3">{student.id}</td>
                      <td className="border border-gray-300 p-3">{student.studentName}</td>
                      <td className="border border-gray-300 p-3">{parentDetails.name}</td>
                      <td className="border border-gray-300 p-3">{parentDetails.email}</td>
                      <td className="border border-gray-300 p-3">{student.contactNo}</td>
                      <td className="border border-gray-300 p-3">{student.studentClass}</td>
                      <td className="border border-gray-300 p-3">{student.section}</td>
                      <td className="border border-gray-300 p-3">{getStatusBadge(student.status)}</td>
                      <td className="border border-gray-300 p-3 flex gap-2">
                        <button
                          onClick={() => handlePromote(index)}
                          className="bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-700"
                        >
                          Promote
                        </button>
                        <button
                          onClick={() => handleTransfer(index)}
                          className="bg-yellow-500 text-white px-2 py-1 rounded-md hover:bg-yellow-700"
                        >
                          Transfer
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PromoteStd;
