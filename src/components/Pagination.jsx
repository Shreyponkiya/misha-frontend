import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showFirstLast = true,
  showInfo = true,
  className = "",
}) => {
  // Generate page numbers to display
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  // Calculate item range for current page
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageClick = (page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  // Always render pagination controls, even if there's only one page
  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white rounded-lg border-t border-gray-200 ${className}`}
    >
      {/* Items info */}
      {showInfo && (
        <div className="flex items-center text-sm text-gray-700 mb-4 sm:mb-0">
          <span>
            Showing <span className="font-medium">{startItem}</span> to{" "}
            <span className="font-medium">{endItem}</span> of{" "}
            <span className="font-medium">{totalItems}</span> results
          </span>
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex items-center space-x-1">
        {/* First page */}
        {showFirstLast && (
          <button
            onClick={() => handlePageClick(1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-md ${
              currentPage === 1
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        )}

        {/* Previous page */}
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-md ${
            currentPage === 1
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100"
          }`}
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {visiblePages.length > 0 ? (
            visiblePages.map((page, index) => (
              <React.Fragment key={index}>
                {page === "..." ? (
                  <span className="px-3 py-2 text-gray-500">...</span>
                ) : (
                  <button
                    onClick={() => handlePageClick(page)}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      page === currentPage
                        ? "bg-blue-100 text-gray-800"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))
          ) : (
            <button className="px-3 py-2 rounded-md text-sm font-medium bg-blue-100 text-gray-800">
              1
            </button>
          )}
        </div>

        {/* Next page */}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-md ${
            currentPage === totalPages
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100"
          }`}
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last page */}
        {showFirstLast && (
          <button
            onClick={() => handlePageClick(totalPages)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-md ${
              currentPage === totalPages
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Pagination;
