import React,{useState} from 'react'

const AccountSummary = () => {
      // State for dropdown selections
  const [type, setType] = useState("Daily");
  const [month, setMonth] = useState("January");
  const [year, setYear] = useState("2025");
  const [showTable, setShowTable] = useState(false);

  const handleFilterData = () => {
    setShowTable(true);
  };

  return (
    <div>
       <div className="bg-blue-900 text-white py-4 px-6 rounded-md mt-5">
        <h1 className="text-xl font-bold">Account Summary Reports</h1>
      </div>
    <div className="bg-blue-50 min-h-screen p-8">
      {/* Header Section */}
     

      {/* Filter Section */}
      <div className="mt-8 bg-white p-6 rounded-md shadow-md flex justify-between items-center">
        <div className="grid grid-cols-3 gap-4">
          {/* Type Dropdown */}
          <div>
            <p className="text-gray-700 font-semibold">Type</p>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-gray-100 px-4 py-2 rounded-md border border-gray-300"
            >
              <option value="Daily">Daily</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>

          {/* Month Dropdown */}
          <div>
            <p className="text-gray-700 font-semibold">Month</p>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full bg-gray-100 px-4 py-2 rounded-md border border-gray-300"
            >
              <option value="January">January</option>
              <option value="February">February</option>
              <option value="March">March</option>
              <option value="April">April</option>
              <option value="May">May</option>
              <option value="June">June</option>
              <option value="July">July</option>
              <option value="August">August</option>
              <option value="September">September</option>
              <option value="October">October</option>
              <option value="November">November</option>
              <option value="December">December</option>
            </select>
          </div>

          {/* Year Dropdown */}
          <div>
            <p className="text-gray-700 font-semibold">Year</p>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full bg-gray-100 px-4 py-2 rounded-md border border-gray-300"
            >
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleFilterData}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-md shadow-md"
        >
          Filter Data
        </button>
      </div>

      {/* Action Buttons */}
      {showTable && (
        <div className='mt-9'>
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
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">Month</th>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Total Income</th>
                  <th className="p-2 border">Total Expense</th>
                  <th className="p-2 border">Profit/Loss</th>
                  <th className="p-2 border">Year</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr
                    key={index}
                    className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50`}
                  >
                    <td className="p-2 border text-center">{index + 1}</td>
                    <td className="p-2 border">{month}</td>
                    <td className="p-2 border">2025-01-{index + 10}</td>
                    <td className="p-2 border">$5000</td>
                    <td className="p-2 border">$3000</td>
                    <td className="p-2 border">$2000</td>
                    <td className="p-2 border">{year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
export default AccountSummary