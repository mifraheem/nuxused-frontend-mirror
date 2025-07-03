import React from 'react'
import { useState } from 'react';

const FeeCalculation = () => {
    const [receiptVisible, setReceiptVisible] = useState(false);

    const handleCalculate = () => {
      setReceiptVisible(true);
    };
  
    return (
      <div className="bg-blue-50 min-h-screen flex flex-col items-center py-6">
        <div className="bg-blue-900 text-white w-full p-4 text-xl font-bold text-start rounded-md">
          Family Fee Calculation
        </div>
        
        <div className="mt-6 w-full max-w-md">
          <label className="block mb-2 text-gray-700">Search using Father ID Card number</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Type father ID card number here..." 
              className="border border-gray-300 rounded-lg px-4 py-2 w-full"
            />
            <button onClick={handleCalculate} className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Calculate
            </button>
          </div>
        </div>
        
        {receiptVisible && (
          <div className="mt-6 bg-white shadow-lg rounded-lg p-6 w-full max-w-lg">
            {/* <h3 className="text-red-600 font-bold">After Clicking the calculate button the receipt shows:</h3> */}
            <div className="border p-4 rounded-lg mt-4 bg-gray-50 text-center">
              <div className="text-lg font-semibold">School name</div>
              <div className="text-gray-600">Current Address of School</div>
              <div className="text-sm text-gray-500">Print Date & Time: 01/01/2025, 1:40</div>
              <table className="w-full mt-4 border">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-2 py-1">Sn.</th>
                    <th className="border px-2 py-1">Student Name</th>
                    <th className="border px-2 py-1">Amount</th>
                    <th className="border px-2 py-1">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-2 py-1">1</td>
                    <td className="border px-2 py-1">ABC</td>
                    <td className="border px-2 py-1">Rs. 4000</td>
                    <td className="border px-2 py-1">Rs. 4000</td>
                  </tr>
                  <tr>
                    <td className="border px-2 py-1">2</td>
                    <td className="border px-2 py-1">ABC</td>
                    <td className="border px-2 py-1">Rs. 4000</td>
                    <td className="border px-2 py-1">Rs. 3000</td>
                  </tr>
                </tbody>
              </table>
              <div className="bg-yellow-300 text-black font-bold px-4 py-2 rounded mt-2">Unpaid Fee: Rs. 1000</div>
              <div className="border-t mt-4 pt-2">
                <p>Due Date: 12/1/2025</p>
                <p>Grand total before due date Rs. 7000</p>
                <p>Grand total after due date Rs. 1000</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pl-16">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Print</button>
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Pay All</button>
              <button className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-600">Partial Payment</button>
            </div>
          </div>
        )}
      </div>
    );
}

export default FeeCalculation