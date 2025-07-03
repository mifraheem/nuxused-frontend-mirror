import React from 'react'
import { Buttons } from '../../components';

const FamilyCredits = () => {
    const data = [
        { id: "01" },
        { id: "02" },
        { id: "03" },
        { id: "04" },
        { id: "06" },
        { id: "07" },
        { id: "08" },
        { id: "09" },
        { id: "10" },
        { id: "11" },
        { id: "12" },
        { id: "13" },
        { id: "14" },
        { id: "15" },
        { id: "16" },
        { id: "17" },
      ];
  return (
    <div className='bg-blue-50'>
         <div>
                <h1 className="flex justify-start pl-6  text-white font-extrabold space-x-8 my-8 bg-blue-900 py-4 text-xl rounded-sm">
                    Handle Family Credits
                </h1>
            </div>
            <Buttons/>
            <div className="overflow-x-auto bg-white rounded-b-lg shadow-lg ml-8 mr-8 rounded-xl mb-4 pt-5">
        {/* Export Buttons */}
          

        {/* Table */}
        <table className="ml-5 border-collapse  mb-8">
          <thead>
            <tr className="bg-[#dcebf8] text-left">
              <th className="px-4 py-2 border">Parent ID</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Phone</th>
              <th className="px-4 py-2 border">ID Card No.</th>
              <th className="px-4 py-2 border">Available Credit</th>
              <th className="px-4 py-2 border">Update Credit</th>
              <th className="px-4 py-2 border">Childs</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="even:bg-gray-100">
                <td className="px-4 py-2 border">{item.id}</td>
                <td className="px-4 py-2 border"></td>
                <td className="px-4 py-2 border"></td>
                <td className="px-4 py-2 border"></td>
                <td className="px-4 py-2 border"></td>
                <td className="px-4 py-2 border"></td>
                <td className="px-4 py-2 border">
                  <button className="bg-[#103873] text-white px-4 py-1 rounded">
                    Update
                  </button>
                </td>
                <td className="px-4 py-2 border">
                  <button className="bg-[#103873] text-white px-4 py-1 rounded">
                    Connected
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default FamilyCredits