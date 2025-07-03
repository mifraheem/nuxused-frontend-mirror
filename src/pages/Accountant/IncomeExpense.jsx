import React from 'react'

const IncomeExpense = () => {
    return (
        <div>
            <div className="bg-blue-900 text-white py-4 px-6 rounded-md flex justify-between items-center mt-5">
            <h1 className="text-xl font-bold">Income/Expense Report</h1>
          </div>
        <div className="bg-blue-50 min-h-screen p-8">
          {/* Header Section */}
          
    
          {/* Action Buttons */}
          <div className="flex justify-end mt-4 space-x-4">
            <button className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
              CSV
            </button>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
              Print
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
              Excel
            </button>
            <button className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
              PDF
            </button>
          </div>
    
          {/* Table Section */}
          <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="p-2 border">ID #</th>
                  <th className="p-2 border">Teacher</th>
                  <th className="p-2 border">Income Generated</th>
                  <th className="p-2 border">Total Expense</th>
                  <th className="p-2 border">Month</th>
                  <th className="p-2 border">Loss</th>
                  <th className="p-2 border">Profit</th>
                  <th className="p-2 border">Date & Time</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Example Row */}
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr
                    key={index}
                    className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50`}
                  >
                    <td className="p-2 border text-center">{index + 1}</td>
                    <td className="p-2 border">Teacher {index + 1}</td>
                    <td className="p-2 border">$2000</td>
                    <td className="p-2 border">$1500</td>
                    <td className="p-2 border">January</td>
                    <td className="p-2 border">$500</td>
                    <td className="p-2 border">$500</td>
                    <td className="p-2 border">2025-01-29 10:00 AM</td>
                    <td className="p-2 border">
                      <select className="w-full p-1 rounded border border-gray-300">
                        <option value="View">View</option>
                        <option value="Edit">Edit</option>
                        <option value="Delete">Delete</option>
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
}

export default IncomeExpense