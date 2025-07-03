import React from 'react'

const SmsHistory = () => {
    return (
        <div>
            <div className="bg-blue-900 text-white py-4 px-6 rounded-md flex justify-between items-center mt-5">
            <h1 className="text-xl font-bold">SMS History</h1>
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
          <div className="mt-6 bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">Messages</th>
                  <th className="p-2 border">To</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Date & Time</th>
                  <th className="p-2 border">Resend</th>
                </tr>
              </thead>
              <tbody>
                {/* Example Rows */}
                {Array.from({ length: 20 }).map((_, index) => (
                  <tr
                    key={index}
                    className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50`}
                  >
                    <td className="p-2 border text-center">{index + 1}</td>
                    <td className="p-2 border flex items-center">
                      <span className="mr-2 text-blue-500">✉️</span>
                      Tomorrow is the holiday from the school.
                    </td>
                    <td className="p-2 border">03130881161</td>
                    <td className="p-2 border text-green-500 text-center">✔️</td>
                    <td className="p-2 border">2/1/2025, 11:02</td>
                    <td className="p-2 border text-center">
                      <button className="text-red-500 hover:text-red-600">🔁</button>
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

export default SmsHistory