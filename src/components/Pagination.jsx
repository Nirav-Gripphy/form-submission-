import React from "react";

export const Pagination = ({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  onGoToPage,
  onGoToNext,
  onGoToPrev,
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
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

  return (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 border-top bg-light">
      <div className="text-muted text-nowrap small">
        Showing {startIndex + 1} to {endIndex} of {totalItems} results
      </div>
      <nav aria-label="Registration list pagination">
        <ul className="pagination mb-0">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={onGoToPrev}
              disabled={currentPage === 1}
              aria-label="Go to previous page"
            >
              <i className="bi bi-chevron-left" aria-hidden="true"></i>
            </button>
          </li>

          {getVisiblePages().map((page, index) => (
            <li
              key={index}
              className={`page-item ${page === currentPage ? "active" : ""} ${
                page === "..." ? "disabled" : ""
              }`}
            >
              {page === "..." ? (
                <span className="page-link">...</span>
              ) : (
                <button
                  className="page-link"
                  onClick={() => onGoToPage(page)}
                  aria-label={`Go to page ${page}`}
                  aria-current={page === currentPage ? "page" : undefined}
                >
                  {page}
                </button>
              )}
            </li>
          ))}

          <li
            className={`page-item ${
              currentPage === totalPages ? "disabled" : ""
            }`}
          >
            <button
              className="page-link"
              onClick={onGoToNext}
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
            >
              <i className="bi bi-chevron-right" aria-hidden="true"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};
