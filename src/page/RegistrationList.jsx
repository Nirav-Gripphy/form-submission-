import React, { useEffect, useState, useCallback, useMemo } from "react";
import { db } from "../services/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

// Custom hooks for better separation of concerns
const useRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const registrationsRef = collection(db, "registrations");
      const registrationsQuery = query(
        registrationsRef,
        orderBy("updatedAt", "desc")
      );

      const snapshot = await getDocs(registrationsQuery);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setRegistrations(data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load registration data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  return { registrations, loading, error, refetch: fetchRegistrations };
};

const useSearch = (registrations, searchTerm) => {
  return useMemo(() => {
    if (!searchTerm.trim()) return registrations;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return registrations.filter((registration) => {
      const searchableFields = [
        registration.name,
        registration.phoneNumber,
        registration.city,
        registration.state,
        registration.primaryBarcodeId,
        registration.husbandName,
      ];

      return searchableFields.some(
        (field) => field && field.toLowerCase().includes(lowerSearchTerm)
      );
    });
  }, [registrations, searchTerm]);
};

const usePagination = (items, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  const goToPage = useCallback(
    (page) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages]
  );

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  // Reset to first page when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  return {
    currentItems,
    currentPage,
    totalPages,
    startIndex,
    endIndex: Math.min(endIndex, items.length),
    goToPage,
    goToNextPage,
    goToPrevPage,
  };
};

// Utility functions
const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";

  try {
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);

    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

const formatDateTime = (timestamp) => {
  if (!timestamp) return "N/A";

  try {
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);

    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Invalid Date";
  }
};

// Sub-components for better organization
const PaymentStatusBadge = React.memo(({ status }) => {
  const statusConfig = {
    completed: { text: "Success", className: "badge bg-success" },
    pending: { text: "Pending", className: "badge bg-warning text-dark" },
    failed: { text: "Failed", className: "badge bg-danger" },
  };

  const config = statusConfig[status] || statusConfig.failed;
  return <span className={config.className}>{config.text}</span>;
});

const UserAvatar = React.memo(({ photoURL, name, size = 40 }) => {
  const [imageError, setImageError] = useState(false);

  if (photoURL && !imageError) {
    return (
      <img
        src={photoURL}
        alt={`${name}'s profile`}
        className="rounded-circle"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: "cover",
        }}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white fw-bold"
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-label={`Avatar for ${name}`}
    >
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
});

const SearchInput = React.memo(({ value, onChange, totalResults }) => (
  <div className="col-md-8">
    <div className="input-group">
      <span className="input-group-text" aria-label="Search icon">
        <i className="bi bi-search" aria-hidden="true"></i>
      </span>
      <input
        type="search"
        className="form-control"
        placeholder="Search by name, phone, city, state, or barcode..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search registrations"
        aria-describedby="search-results-count"
      />
    </div>
    <small id="search-results-count" className="text-muted mt-1 d-block">
      {totalResults} result{totalResults !== 1 ? "s" : ""} found
    </small>
  </div>
));

const StatsDisplay = React.memo(({ filteredRegistrations }) => {
  const stats = useMemo(() => {
    const total = filteredRegistrations.length;
    const completed = filteredRegistrations.filter(
      (r) => r.paymentStatus === "completed"
    ).length;
    const pending = filteredRegistrations.filter(
      (r) => r.paymentStatus === "pending"
    ).length;

    return { total, completed, pending };
  }, [filteredRegistrations]);

  return (
    <div className="col-md-4">
      <div className="d-flex gap-2 justify-content-md-end mt-3 mt-md-0 flex-wrap">
        <div className="bg-primary bg-opacity-10 px-3 py-2 rounded border border-primary border-opacity-25">
          <span className="text-white fw-medium">Total: {stats.total}</span>
        </div>
        {/* <div className="bg-success bg-opacity-10 px-3 py-2 rounded border border-success border-opacity-25">
          <span className="text-success fw-medium">
            Paid: {stats.completed}
          </span>
        </div>
        <div className="bg-warning bg-opacity-10 px-3 py-2 rounded border border-warning border-opacity-25">
          <span className="text-warning fw-medium">
            Pending: {stats.pending}
          </span>
        </div> */}
      </div>
    </div>
  );
});

const ActionButtons = React.memo(({ registration, onOpenModal }) => (
  <div className="btn-group" role="group" aria-label="Registration actions">
    <button
      type="button"
      className="btn btn-outline-primary btn-sm"
      onClick={() => onOpenModal(registration, "details")}
      title="View full details"
      aria-label={`View details for ${registration.name}`}
    >
      <i className="bi bi-eye" aria-hidden="true"></i>
    </button>
    <button
      type="button"
      className="btn btn-outline-success btn-sm"
      onClick={() => onOpenModal(registration, "payment")}
      title="View payment details"
      aria-label={`View payment details for ${registration.name}`}
    >
      <i className="bi bi-credit-card" aria-hidden="true"></i>
    </button>
    {registration.additionalPeople?.length > 0 && (
      <button
        type="button"
        className="btn btn-outline-info btn-sm position-relative"
        onClick={() => onOpenModal(registration, "guests")}
        title={`View ${registration.additionalPeople.length} additional people`}
        aria-label={`View ${registration.additionalPeople.length} additional people for ${registration.name}`}
      >
        <i className="bi bi-people" aria-hidden="true"></i>
        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-info">
          {registration.additionalPeople.length}
          <span className="visually-hidden">additional people</span>
        </span>
      </button>
    )}
  </div>
));

const Pagination = React.memo(
  ({
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
  }
);

// Main component
const RegistrationList = () => {
  const { registrations, loading, error, refetch } = useRegistrations();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegistration, setSelectedRegistration] = useState(null);

  const filteredRegistrations = useSearch(registrations, searchTerm);
  const {
    currentItems,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    goToNextPage,
    goToPrevPage,
  } = usePagination(filteredRegistrations, 10);

  const openModal = useCallback((registration, modalType) => {
    setSelectedRegistration(registration);
    const modalId = `${modalType}Modal`;

    // Improved modal handling with error checking
    try {
      const modalElement = document.getElementById(modalId);
      if (modalElement && window.bootstrap?.Modal) {
        const modal = new window.bootstrap.Modal(modalElement);
        modal.show();
      }
    } catch (err) {
      console.error("Error opening modal:", err);
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading registrations...</span>
          </div>
          <p className="mt-3 text-muted">Loading registration data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="alert alert-danger" role="alert">
            <i
              className="bi bi-exclamation-triangle-fill me-2"
              aria-hidden="true"
            ></i>
            {error}
          </div>
          <button
            onClick={refetch}
            className="btn btn-primary"
            aria-label="Retry loading registrations"
          >
            <i className="bi bi-arrow-clockwise me-2" aria-hidden="true"></i>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100">
      {/* Header */}

      <div className="container">
        <div className="header">
          <div className="logo-container">
            <img
              src="./header-logo.png"
              alt="Jain Śvetāmbara Terapanth Mahasabha"
              className="logo"
              style={{
                height: "50px",
                width: "inherit",
              }}
            />
          </div>
        </div>
      </div>

      <div className="form-card">
        <div className="beti-logo-container">
          <img
            src="./logo-with-star.svg"
            alt="Jain Śvetāmbara Terapanth Mahasabha"
            className="logo"
            style={{
              height: "80px",
              width: "inherit",
            }}
          />
        </div>

        <div className="mt-3 text-center">
          <h4
            className=""
            style={{
              fontWeight: 600,
            }}
          >
            तृतीय सम्मलेन रजिस्ट्रेशन
          </h4>
          <span>26- 27 जुलाई 2025 </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="container-fluid py-4">
        {/* Search and Stats */}
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <div className="row align-items-center">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                totalResults={filteredRegistrations.length}
              />
              <StatsDisplay filteredRegistrations={filteredRegistrations} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card shadow-sm">
          <div className="card-body p-0">
            {currentItems.length === 0 ? (
              <div className="text-center py-5">
                <i
                  className="bi bi-search display-4 text-muted"
                  aria-hidden="true"
                ></i>
                <h4 className="mt-3 text-muted">No registrations found</h4>
                <p className="text-muted">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "No registration data available"}
                </p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover mb-0" role="table">
                    <thead className="table-light">
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">Name</th>
                        <th scope="col">Phone</th>
                        <th scope="col">Location</th>
                        <th scope="col">Barcode ID</th>
                        <th scope="col" className="d-none d-lg-table-cell">
                          Registration Time
                        </th>
                        <th scope="col">Payment Status</th>
                        <th scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((registration, index) => (
                        <tr key={registration.id}>
                          <td className="text-muted">
                            {startIndex + index + 1}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="me-3 flex-shrink-0">
                                <UserAvatar
                                  photoURL={registration.photoURL}
                                  name={registration.name}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="fw-medium text-truncate">
                                  {registration.name || "N/A"}
                                </div>
                                {registration.hasHusband &&
                                  registration.husbandName && (
                                    <small className="text-muted text-truncate d-block">
                                      Husband: {registration.husbandName}
                                    </small>
                                  )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <a
                              href={`tel:${registration.phoneNumber}`}
                              className="text-decoration-none"
                              aria-label={`Call ${registration.phoneNumber}`}
                            >
                              {registration.phoneNumber || "N/A"}
                            </a>
                          </td>
                          <td>
                            <div className="small">
                              <div className="fw-medium">
                                {registration.city || "N/A"}
                              </div>
                              <div className="text-muted">
                                {registration.state || "N/A"}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="font-monospace small">
                              <div>
                                {registration.primaryBarcodeId || "N/A"}
                              </div>
                              {registration.spouseBarcodeId && (
                                <div className="text-muted">
                                  {registration.spouseBarcodeId}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="d-none d-lg-table-cell small">
                            {formatDateTime(registration.updatedAt)}
                          </td>
                          <td>
                            <PaymentStatusBadge
                              status={registration.paymentStatus}
                            />
                          </td>
                          <td>
                            <ActionButtons
                              registration={registration}
                              onOpenModal={openModal}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalItems={filteredRegistrations.length}
                  onGoToPage={goToPage}
                  onGoToNext={goToNextPage}
                  onGoToPrev={goToPrevPage}
                />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modals would go here - keeping the existing modal structure but with improved accessibility */}
      {/* Details Modal */}
      <div
        className="modal fade"
        id="detailsModal"
        tabIndex="-1"
        aria-labelledby="detailsModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="detailsModalLabel">
                Registration Details
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close modal"
              ></button>
            </div>
            <div className="modal-body">
              {selectedRegistration && (
                <div className="row g-4">
                  <div className="col-md-6">
                    {/* Primary registrant info */}
                    <div className="d-flex align-items-center mb-4">
                      <UserAvatar
                        photoURL={selectedRegistration.photoURL}
                        name={selectedRegistration.name}
                        size={60}
                      />
                      <div className="ms-3">
                        <h5 className="mb-1">{selectedRegistration.name}</h5>
                        <p className="text-muted mb-0">
                          <i
                            className="bi bi-telephone me-1"
                            aria-hidden="true"
                          ></i>
                          <a
                            href={`tel:${selectedRegistration.phoneNumber}`}
                            className="text-decoration-none"
                          >
                            {selectedRegistration.phoneNumber}
                          </a>
                        </p>
                      </div>
                    </div>

                    {/* Spouse info */}
                    {selectedRegistration.hasHusband && (
                      <div className="border-top pt-3 mb-4">
                        <h6 className="mb-2">Husband Details:</h6>
                        <div className="d-flex align-items-center">
                          <UserAvatar
                            photoURL={selectedRegistration.husbandPhotoURL}
                            name={selectedRegistration.husbandName}
                            size={50}
                          />
                          <div className="ms-3">
                            <p className="fw-medium mb-1">
                              {selectedRegistration.husbandName}
                            </p>
                            <small className="text-muted font-monospace">
                              ID: {selectedRegistration.spouseBarcodeId}
                            </small>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional people */}
                    <div className="border-top pt-3">
                      <h6 className="mb-3">
                        Additional People (
                        {selectedRegistration.additionalPeople?.length || 0}):
                      </h6>
                      {selectedRegistration.additionalPeople?.length > 0 ? (
                        <div className="row g-2">
                          {selectedRegistration.additionalPeople.map(
                            (person, index) => (
                              <div key={person.id || index} className="col-12">
                                <div className="card card-body py-2">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <div className="fw-medium">
                                        {person.name}
                                      </div>
                                      <small className="text-muted">
                                        {person.relation}
                                      </small>
                                    </div>
                                    <span className="badge bg-secondary">
                                      #{index + 1}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-3 text-muted">
                          <i
                            className="bi bi-people display-6"
                            aria-hidden="true"
                          ></i>
                          <p className="mt-2 mb-0">No additional people</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    {/* Address */}
                    <div className="mb-4">
                      <h6 className="mb-2">
                        <i
                          className="bi bi-geo-alt me-1"
                          aria-hidden="true"
                        ></i>
                        Address:
                      </h6>
                      <address className="mb-0">
                        {selectedRegistration.city},{" "}
                        {selectedRegistration.state}
                      </address>
                    </div>

                    {/* Travel details */}
                    <div className="mb-4">
                      <h6 className="mb-2">
                        <i
                          className="bi bi-calendar me-1"
                          aria-hidden="true"
                        ></i>
                        Travel Details:
                      </h6>
                      <div className="small">
                        <div className="row g-2">
                          <div className="col-6">
                            <strong>Arrival:</strong>
                            <br />
                            {formatDate(selectedRegistration.arrivalDate)}
                            <br />
                            <small className="text-muted">
                              {selectedRegistration.arrivalTime}
                            </small>
                            <br />
                            <small className="text-muted">
                              via {selectedRegistration.arrivalTravelMode}
                            </small>
                          </div>
                          <div className="col-6">
                            <strong>Departure:</strong>
                            <br />
                            {formatDate(selectedRegistration.departureDate)}
                            <br />
                            <small className="text-muted">
                              {selectedRegistration.departureTime}
                            </small>
                            <br />
                            <small className="text-muted">
                              via {selectedRegistration.departureTravelMode}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Registration details */}
                    <div>
                      <h6 className="mb-2">Registration Details:</h6>
                      <div className="small">
                        <p className="mb-1">
                          <strong>Barcode ID:</strong>
                          <span className="font-monospace ms-1">
                            {selectedRegistration.primaryBarcodeId}
                          </span>
                        </p>
                        <p className="mb-1">
                          <strong>Total Attendees:</strong>{" "}
                          {selectedRegistration.attendeeCount}
                        </p>
                        <p className="mb-0">
                          <strong>Registration Date:</strong>{" "}
                          {formatDateTime(
                            selectedRegistration.registrationDate
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <div
        className="modal fade"
        id="paymentModal"
        tabIndex="-1"
        aria-labelledby="paymentModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="paymentModalLabel">
                Payment Details
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close modal"
              ></button>
            </div>
            <div className="modal-body">
              {selectedRegistration && (
                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label fw-medium">
                      Payment Status
                    </label>
                    <div>
                      <PaymentStatusBadge
                        status={selectedRegistration.paymentStatus}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-medium">Amount</label>
                    <p className="h5 text-success mb-0">
                      ₹
                      {selectedRegistration.paymentAmount?.toLocaleString(
                        "en-IN"
                      ) || "N/A"}
                    </p>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-medium">Payment ID</label>
                    <p className="font-monospace small text-break mb-0">
                      {selectedRegistration.paymentId || "N/A"}
                    </p>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-medium">Order ID</label>
                    <p className="font-monospace small text-break mb-0">
                      {selectedRegistration.orderId || "N/A"}
                    </p>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-medium">Last Updated</label>
                    <p className="small mb-0">
                      {formatDateTime(selectedRegistration.updatedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Guest Modal */}
      <div
        className="modal fade"
        id="guestsModal"
        tabIndex="-1"
        aria-labelledby="guestsModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="guestsModalLabel">
                Additional People
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close modal"
              ></button>
            </div>
            <div className="modal-body">
              {selectedRegistration?.additionalPeople?.length > 0 ? (
                <div className="row g-2">
                  {selectedRegistration.additionalPeople.map(
                    (person, index) => (
                      <div key={person.id || index} className="col-12">
                        <div className="card">
                          <div className="card-body py-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="card-title mb-1">
                                  {person.name}
                                </h6>
                                <p className="card-text text-muted small mb-0">
                                  {person.relation}
                                </p>
                              </div>
                              <span className="badge bg-secondary">
                                #{index + 1}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i
                    className="bi bi-people display-6 text-muted"
                    aria-hidden="true"
                  ></i>
                  <p className="text-muted mt-2 mb-0">No additional people</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 mt-5">
        <img
          src="./footer.svg"
          alt="Conference footer logo"
          className="img-fluid"
          loading="lazy"
          style={{ maxHeight: "60px" }}
        />
      </footer>
    </div>
  );
};

// Set display names for better debugging
PaymentStatusBadge.displayName = "PaymentStatusBadge";
UserAvatar.displayName = "UserAvatar";
SearchInput.displayName = "SearchInput";
StatsDisplay.displayName = "StatsDisplay";
ActionButtons.displayName = "ActionButtons";
Pagination.displayName = "Pagination";

export default RegistrationList;
