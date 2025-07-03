import React, { useState } from 'react'
import { Buttons } from '../../components';
import Table from '../../components/Table';

const AdmissionRequest = () => {
    const [data] = useState([
        { id: 1, studentName: 'John Doe', fatherName: 'Richard Doe', fatherEmail: 'richard@example.com', contactNo: '123456789', section: 'A', class: '10', status: 'Pending', dateTime: '2024-06-01 10:00 AM' }
      ]);
    
      const columns = ["ID #", "Student Name", "Father Name", "Father Email", "Contact No.", "Section", "Class", "Status", "Date & Time", "Actions"];
    return (
        <div>
            <div >
                <h1 className="flex justify-start pl-6  text-white font-extrabold space-x-8 my-8 bg-blue-900 py-4 text-xl rounded-sm">
                    Manage Admission Request
                </h1>
            </div>
            <div className="p-6 bg-blue-50 rounded-b-md">
                <Buttons />
                <div className="p-6 bg-blue-50 rounded-b-md">
          <Table columns={columns} data={data} 
          ButtonName={"Accept"}
          ButtonName2={"Deny"}/>
        </div>
            </div>
        </div>
    )
}

export default AdmissionRequest