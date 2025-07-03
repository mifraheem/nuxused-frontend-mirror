import React from "react";

const Table = ({ columns, data, ButtonName, ButtonName2, onActionClick }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm bg-white">
                <thead>
                    <tr className="bg-blue-900 text-white">
                        {columns.map((col, index) => (
                            <th key={index} className="border border-gray-300 p-2">{col}</th>
                        ))}
                        <th className="border border-gray-300 p-2">Actions</th> 
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex} className="text-center">
                            {Object.values(row).map((cell, cellIndex) => (
                                <td key={cellIndex} className="border border-gray-300 p-2">{cell}</td>
                            ))}
                            <td className="border border-gray-300 p-2">
                                <button
                                    className="bg-green-500 text-white px-2 py-1 rounded-md mr-1 hover:bg-green-700"
                                    onClick={() => onActionClick(rowIndex, "promote")}
                                >
                                    {ButtonName}
                                </button>
                                <button
                                    className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-700"
                                    onClick={() => onActionClick(rowIndex, "transfer")}
                                >
                                    {ButtonName2}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
