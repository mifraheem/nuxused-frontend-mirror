import React from 'react'
import { FeeForm } from '../../components';

const AdmitBulk = () => {

    const fields = [
        {
            id: 'section', label: 'Section', type: 'select', options: [
                { value: 'A', label: 'A' },
                { value: 'B', label: 'B' },
                { value: 'C', label: 'C' }
            ]
        },
        {
            id: 'class', label: 'Class', type: 'select', options: [
                { value: '1', label: 'Class 1' },
                { value: '2', label: 'Class 2' },
                { value: '3', label: 'Class 3' }
            ]
        },
        { id: 'file', label: 'Choose file', type: 'file' },
    ];

    const handleSubmit = () => {
        alert('Bulk admission successful!');
    };

    return (
        <div>
            <div >
                <h1 className="flex justify-start pl-6  text-white font-extrabold space-x-8 my-8 bg-blue-900 py-4 text-xl rounded-sm">
                    Admit Bulk
                </h1>
            </div>
            <FeeForm
                fields={fields}
                onSubmit={handleSubmit}
                buttonText="Add" />
        </div>
    );
}

export default AdmitBulk