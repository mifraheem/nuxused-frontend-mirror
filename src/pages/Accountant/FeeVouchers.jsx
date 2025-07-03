import React, { useState } from "react";

export const FeeVouchers = () => {
  const [type, setType] = useState("Three copies");
  const [section, setSection] = useState("A");
  const [classLevel, setClassLevel] = useState("Two");
  const [color, setColor] = useState("Black & White");
  const [month, setMonth] = useState("January");
  const [showVouchers, setShowVouchers] = useState(false);

  const handlePrintVouchers = () => {
    setShowVouchers(true);
  };

  return (
    <div>
      <div className="bg-blue-900 text-white w-full p-4 text-xl font-bold text-start rounded-md mt-5">
      Print Fee Vouchers
        </div>
    <div className="p-6">

      <div className="bg-white p-4 mt-4 shadow-md rounded-lg">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-blue-800 text-white">
              <th className="border p-3">Type</th>
              <th className="border p-3">Section</th>
              <th className="border p-3">Class</th>
              <th className="border p-3">Color</th>
              <th className="border p-3">Month</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-3">
                <select
                  className="w-full border p-2 rounded"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option>Three copies</option>
                  <option>Single copy</option>
                  <option>Duplicate</option>
                </select>
              </td>
              <td className="border p-3">
                <select
                  className="w-full border p-2 rounded"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                >
                  <option>A</option>
                  <option>B</option>
                  <option>C</option>
                </select>
              </td>
              <td className="border p-3">
                <select
                  className="w-full border p-2 rounded"
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                >
                  <option>One</option>
                  <option>Two</option>
                  <option>Three</option>
                  <option>Four</option>
                </select>
              </td>
              <td className="border p-3">
                <select
                  className="w-full border p-2 rounded"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                >
                  <option>Black & White</option>
                  <option>Colored</option>
                </select>
              </td>
              <td className="border p-3">
                <select
                  className="w-full border p-2 rounded"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                >
                  <option>January</option>
                  <option>February</option>
                  <option>March</option>
                  <option>April</option>
                  <option>May</option>
                  <option>June</option>
                  <option>July</option>
                  <option>August</option>
                  <option>September</option>
                  <option>October</option>
                  <option>November</option>
                  <option>December</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 flex justify-between">
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
            Filter Data
          </button>
         
        </div>
      </div>
      <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition mt-5 text-end"
            onClick={handlePrintVouchers}
          >
            Print Vouchers
          </button>

      {/* Voucher Display Section (Only shows when 'Print Vouchers' is clicked) */}
      {showVouchers && (
        <div className="mt-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-4 shadow-md rounded-lg border border-gray-300">
              <h3 className="text-lg font-semibold text-gray-700">Student Fee Voucher</h3>
              <div className="mt-2 text-gray-600">
                <p><strong>Name:</strong> John Doe</p>
                <p><strong>Class:</strong> {classLevel} - {section}</p>
                <p><strong>Month:</strong> {month}</p>
                <p><strong>Amount:</strong> $200</p>
              </div>
            </div>

            <div className="bg-white p-4 shadow-md rounded-lg border border-gray-300">
              <h3 className="text-lg font-semibold text-gray-700">Student Fee Voucher</h3>
              <div className="mt-2 text-gray-600">
                <p><strong>Name:</strong> Jane Smith</p>
                <p><strong>Class:</strong> {classLevel} - {section}</p>
                <p><strong>Month:</strong> {month}</p>
                <p><strong>Amount:</strong> $200</p>
              </div>
            </div>

            <div className="bg-white p-4 shadow-md rounded-lg border border-gray-300">
              <h3 className="text-lg font-semibold text-gray-700">Student Fee Voucher</h3>
              <div className="mt-2 text-gray-600">
                <p><strong>Name:</strong> Michael Johnson</p>
                <p><strong>Class:</strong> {classLevel} - {section}</p>
                <p><strong>Month:</strong> {month}</p>
                <p><strong>Amount:</strong> $200</p>
              </div>
            </div>
          </div>

          {/* Single Download Button for All Vouchers */}
          <div className="mt-6 flex justify-center">
            <button className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 transition">
              Download All Vouchers
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};
