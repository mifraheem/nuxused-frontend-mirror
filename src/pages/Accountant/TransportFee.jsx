import React from 'react'
import { FeeForm } from '../../components'

const TransportFee = () => {
    const fields = [
        { id: "routeName", label: "Route Name", type: "text" },
        {
            id: "feeType", label: "Fee Type", type: "select", options: [
                { value: "monthly", label: "Monthly Transport Fee" },
                { value: "annual", label: "Annual Transport Fee" },
            ]
        },
        {
            id: "feeMonth", label: "Fee Month", type: "select", options: [
                { value: "january", label: "January" },
                { value: "february", label: "February" },
                { value: "march", label: "March" },
            ]
        },
        { id: "amount", label: "Amount", type: "text" },
        { id: "dueDate", label: "Due Date", type: "date" },
    ];

    return (
        <div className='bg-blue-50'>
            <div>
                <h1 className="flex justify-start pl-6  text-white font-extrabold space-x-8 my-8 bg-blue-900 py-4 text-xl rounded-sm">
                    Generate Transport Fee
                </h1>
            </div>

            <div>
                <FeeForm
                    //   title="Transport Fee Form"
                    fields={fields}
                    onSubmit={() => alert("Transport Fee Generated!")}
                    buttonText="Generate Fee"
                />
            </div>
        </div>
    );
};

export default TransportFee