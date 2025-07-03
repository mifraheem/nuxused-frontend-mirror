import React from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const Buttons = ({ data, columns, filename = "data" }) => {
  // Export table to CSV
  const exportToCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${filename}.csv`);
  };

  // Export table to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  // Export table to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumnHeaders = columns.map((col) => col.label);
    const tableRows = data.map((row) => columns.map((col) => row[col.key] || ""));

    // doc.text("Table Data", 14, 15); // Title for the PDF
    doc.autoTable({
      head: [tableColumnHeaders],
      body: tableRows,
    });
    doc.save(`${filename}.pdf`);
  };

  // Print the table
//   const printTable = () => {
//     const table = document.getElementById("data-table");
//     if (!table) return;

//     const newWindow = window.open("", "_blank");
//     newWindow.document.write("<html><head><title>Print Table</title></head><body>");
//     newWindow.document.write(table.outerHTML);
//     newWindow.document.write("</body></html>");
//     newWindow.document.close();
//     newWindow.print();
//   };

  return (
    <div className="flex justify-end gap-2 p-4">
      <button onClick={exportToCSV} className="bg-green-900 text-white px-3 py-1 rounded">
        CSV
      </button>
      {/* <button onClick={printTable} className="bg-blue-400 text-white px-3 py-1 rounded">
        Print
      </button> */}
      <button onClick={exportToExcel} className="bg-green-600 text-white px-3 py-1 rounded">
        Excel
      </button>
      <button onClick={exportToPDF} className="bg-red-500 text-white px-3 py-1 rounded">
        PDF
      </button>
    </div>
  );
};

export default Buttons;
