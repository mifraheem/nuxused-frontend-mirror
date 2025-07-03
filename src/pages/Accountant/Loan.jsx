import React, { useState } from "react";

const Loan = () => {
  // State to manage table rows
  const [rows, setRows] = useState([
    { id: 1, teacher: "Teacher 1", requested: "$1000", approved: "$800", installments: "10", repaid: "$400", remaining: "$400", status: "Approved", date: "2025-01-29 10:00 AM" },
  ]);

  // Function to add a new row
  const addNewRow = () => {
    const newRow = {
      id: rows.length + 1,
      teacher: `Teacher ${rows.length + 1}`,
      requested: "$1000",
      approved: "$800",
      installments: "10",
      repaid: "$400",
      remaining: "$400",
      status: "Pending",
      date: "2025-01-29 10:00 AM",
    };
    setRows([...rows, newRow]);
  };

  return (
    <div>
      <div className="bg-blue-900 text-white py-2 px-6 rounded-md flex justify-between items-center mt-5">
        <h1 className="text-xl font-bold">Loan Applications</h1>
        <button
          onClick={addNewRow}
          className="flex items-center px-3 py-2 bg-cyan-400 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-500 transition"
        >
          <div className="flex items-center justify-center w-8 h-8 bg-black rounded-full mr-3">
            <span className="text-cyan-500 text-xl font-bold">+</span>
          </div>
          Add new applications
        </button>
      </div>
      <div className="bg-blue-50 min-h-screen p-8">
        {/* Action Buttons */}
        <div className="flex justify-end mt-4 space-x-4">
          <button className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">CSV</button>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">Print</button>
          <button className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">Excel</button>
          <button className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">PDF</button>
        </div>

        {/* Table Section */}
        <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full border-collapse border border-gray-200 text-sm">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="p-2 border">ID #</th>
                <th className="p-2 border">Teacher</th>
                <th className="p-2 border">Requested amount</th>
                <th className="p-2 border">Approved amount</th>
                <th className="p-2 border">Installments</th>
                <th className="p-2 border">Repaid amount</th>
                <th className="p-2 border">Remaining amount</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Date & Time</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={index}
                  className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50`}
                >
                  <td className="p-2 border text-center">{row.id}</td>
                  <td className="p-2 border">{row.teacher}</td>
                  <td className="p-2 border">{row.requested}</td>
                  <td className="p-2 border">{row.approved}</td>
                  <td className="p-2 border">{row.installments}</td>
                  <td className="p-2 border">{row.repaid}</td>
                  <td className="p-2 border">{row.remaining}</td>
                  <td className="p-2 border">
                    <select
                      value={row.status}
                      className="w-full p-1 rounded border border-gray-300"
                      onChange={(e) =>
                        setRows(
                          rows.map((r, i) =>
                            i === index ? { ...r, status: e.target.value } : r
                          )
                        )
                      }
                    >
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="p-2 border">{row.date}</td>
                  <td className="p-2 border">
                    <select
                      className="w-full p-1 rounded border border-gray-300"
                      onChange={(e) => console.log(`${e.target.value} clicked for row ${row.id}`)}
                    >
                      <option value="Edit">Edit</option>
                      <option value="Delete">Delete</option>
                      <option value="View">View</option>
                    </select>
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

export default Loan;
