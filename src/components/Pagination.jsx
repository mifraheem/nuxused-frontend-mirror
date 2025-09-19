import React from 'react';
import Select from 'react-select';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50],
  showPageSizeSelector = true,
  showPageInfo = false,
  totalItems = 0,
  className = "",
}) => {
  const pageSizeSelectOptions = pageSizeOptions.map(size => ({
    value: size,
    label: size.toString(),
  }));

  const paginationSelectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: '1.75rem',
      fontSize: '0.75rem',
      width: '60px',
      border: '1px solid #d1d5db',
      '&:hover': {
        borderColor: '#9ca3af',
      },
    }),
    menu: (provided) => ({
      ...provided,
      fontSize: '0.75rem',
      maxHeight: '120px',
      width: '60px',
      zIndex: 9999,
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999, // Ensure portal menu is above other elements
    }),
    option: (provided) => ({
      ...provided,
      fontSize: '0.75rem',
      padding: '0.25rem 0.5rem',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: '2px',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 6px',
    }),
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (selected) => {
    const newSize = selected?.value || pageSize;
    if (newSize !== pageSize) {
      onPageSizeChange(newSize);
    }
  };

  if (totalPages === 0) return null;

  const renderPageNumbers = () => {
    if (totalPages <= 5) {
      return [...Array(totalPages)].map((_, index) => (
        <button
          key={index}
          onClick={() => handlePageChange(index + 1)}
          className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm min-w-[32px] sm:min-w-[36px] 
                     transition-colors ${
            currentPage === index + 1
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          {index + 1}
        </button>
      ));
    }

    const pages = [];
    if (currentPage > 3) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-2 sm:px-3 py-1 rounded text-xs sm:text-sm min-w-[32px] sm:min-w-[36px]
                     bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          1
        </button>
      );

      if (currentPage > 4) {
        pages.push(
          <span key="ellipsis1" className="px-1 py-1 text-xs sm:text-sm text-gray-500">
            ...
          </span>
        );
      }
    }

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm min-w-[32px] sm:min-w-[36px]
                     transition-colors ${
            currentPage === i
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          {i}
        </button>
      );
    }

    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        pages.push(
          <span key="ellipsis2" className="px-1 py-1 text-xs sm:text-sm text-gray-500">
            ...
          </span>
        );
      }

      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-2 sm:px-3 py-1 rounded text-xs sm:text-sm min-w-[32px] sm:min-w-[36px]
                     bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-3 sm:gap-4 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
              Page Size:
            </label>
            <div className="w-16">
              <Select
                value={pageSizeSelectOptions.find(opt => opt.value === pageSize)}
                onChange={handlePageSizeChange}
                options={pageSizeSelectOptions}
                styles={paginationSelectStyles}
                isSearchable={false}
                menuPlacement="auto"
                menuPortalTarget={document.body} // Render menu in a portal
                menuShouldBlockScroll={true} // Optional: Prevent scrolling
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center sm:justify-end gap-1 sm:gap-2 w-full sm:w-auto">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 sm:px-3 py-1 bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed
                     text-xs sm:text-sm hover:bg-gray-400 transition-colors min-w-[45px] sm:min-w-[50px]"
        >
          Prev
        </button>

        {renderPageNumbers()}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 sm:px-3 py-1 bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed
                     text-xs sm:text-sm hover:bg-gray-400 transition-colors min-w-[45px] sm:min-w-[50px]"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;