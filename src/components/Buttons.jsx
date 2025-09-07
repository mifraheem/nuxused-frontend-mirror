import React from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const Buttons = ({ data, columns, filename = "data" }) => {
  // Helper function to format data for export
  const formatData = () => {
    return data.map((row) =>
      columns.reduce((acc, col) => {
        acc[col.key] = row[col.key] != null ? row[col.key] : "N/A";
        return acc;
      }, {})
    );
  };

  // Export table to CSV
  const exportToCSV = () => {
    const formattedData = formatData();
    const worksheet = XLSX.utils.json_to_sheet(formattedData, {
      header: columns.map((col) => col.key),
    });
    // Customize header labels
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].v = columns[C].label;
      }
    }
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${filename}.csv`);
  };

  // Export table to Excel
  const exportToExcel = () => {
    const formattedData = formatData();
    const worksheet = XLSX.utils.json_to_sheet(formattedData, {
      header: columns.map((col) => col.key),
    });
    // Customize header labels
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].v = columns[C].label;
      }
    }
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  // Export table to PDF
  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape", // Use landscape for better fit
      unit: "mm",
      format: "a4",
    });
    const tableColumnHeaders = columns.map((col) => col.label);
    const tableRows = data.map((row) =>
      columns.map((col) => (row[col.key] != null ? row[col.key] : "N/A"))
    );

    // Add title
    doc.setFontSize(16);
    doc.text(`Student List - ${new Date().toLocaleDateString()}`, 10, 10);

    // Add table
    doc.autoTable({
      head: [tableColumnHeaders],
      body: tableRows,
      startY: 20,
      theme: "grid", // Add grid lines for clarity
      headStyles: {
        fillColor: [0, 102, 204], // Blue header
        textColor: [255, 255, 255], // White text
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50], // Dark gray text
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245], // Light gray alternate rows
      },
      margin: { top: 15, bottom: 15 },
      styles: {
        cellPadding: 2,
        overflow: "linebreak", // Handle long text by wrapping
        columnWidth: "auto", // Auto-adjust column width
      },
    });

    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 10, doc.internal.pageSize.height - 10, {
        align: "right",
      });
    }

    doc.save(`${filename}.pdf`);
  };

  return (
    <div className="flex justify-end gap-2 p-4">
      <button
        onClick={exportToCSV}
        className="bg-green-900 text-white px-3 py-1 rounded hover:bg-green-800 text-xs"
      >
        CSV
      </button>
      <button
        onClick={exportToExcel}
        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs"
      >
        Excel
      </button>
      <button
        onClick={exportToPDF}
        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs"
      >
        PDF
      </button>
    </div>
  );
};

export default Buttons;