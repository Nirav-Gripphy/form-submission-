import React, { useEffect, useState, useCallback, useMemo } from "react";
import { db } from "../services/firebase";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { formatDate, formatDateTime, moveTempToLive } from "../Utility/global";
import { Pagination } from "../components/Pagination";
import DetailsModal from "../components/DetailsModal";
import PaymentModal from "../components/PaymentModal";
import GuestModal from "../components/GuestModal";

// Custom hooks for better separation of concerns
const useRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const registrationsRef = collection(db, "registrations-local");
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
    const totalRegistrations = filteredRegistrations.length;

    // Calculate total participants (including spouses)
    const totalParticipants = filteredRegistrations.reduce(
      (sum, registration) => {
        let participantCount = 1; // Main registrant

        // Add spouse if registered with husband
        if (registration.hasHusband && registration.husbandName) {
          participantCount += 1;
        }

        // // Add additional people
        // if (registration.additionalPeople?.length > 0) {
        //   participantCount += registration.additionalPeople.length;
        // }

        return sum + participantCount;
      },
      0
    );

    const completed = filteredRegistrations.filter(
      (r) => r.paymentStatus === "completed"
    ).length;

    const pending = filteredRegistrations.filter(
      (r) => r.paymentStatus === "pending"
    ).length;

    return { totalRegistrations, totalParticipants, completed, pending };
  }, [filteredRegistrations]);

  return (
    <div className="col-md-4">
      <div className="d-flex gap-2 justify-content-md-end mt-3 mt-md-0 flex-wrap">
        <div className="bg-primary bg-opacity-10 px-3 py-2 rounded border border-primary border-opacity-25">
          <span className="text-white fw-medium">
            Total Participants: {stats.totalParticipants}
          </span>
        </div>
        {/* <div
          onClick={() => {
            moveTempToLive();
          }}
          className="bg-primary bg-opacity-10 px-3 py-2 rounded border border-primary border-opacity-25"
        >
          <span className="text-white fw-medium">Move Temp to Live</span>
        </div> */}
      </div>
    </div>
  );
});

const TabNavigation = React.memo(
  ({ activeTab, onTabChange, successCount, pendingCount }) => (
    <div className="card mb-4 shadow-sm">
      <div className="card-body">
        <ul
          className="nav nav-tabs card-header-tabs"
          id="registrationTabs"
          role="tablist"
        >
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === "success" ? "active" : ""}`}
              id="success-tab"
              type="button"
              role="tab"
              aria-controls="success"
              aria-selected={activeTab === "success"}
              onClick={() => onTabChange("success")}
            >
              Success
              <span className="badge bg-success ms-2">{successCount}</span>
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === "pending" ? "active" : ""}`}
              id="pending-tab"
              type="button"
              role="tab"
              aria-controls="pending"
              aria-selected={activeTab === "pending"}
              onClick={() => onTabChange("pending")}
            >
              Pending
              <span className="badge bg-warning text-dark ms-2">
                {pendingCount}
              </span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
);

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

// Main component
const RegistrationList = () => {
  const { registrations, loading, error, refetch } = useRegistrations();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [activeTab, setActiveTab] = useState("success");

  // Filter registrations by payment status based on active tab
  const statusFilteredRegistrations = useMemo(() => {
    const targetStatus = activeTab === "success" ? "completed" : "pending";
    return registrations.filter(
      (registration) => registration.paymentStatus === targetStatus
    );
  }, [registrations, activeTab]);

  // Apply search filter to status-filtered registrations
  const filteredRegistrations = useSearch(
    statusFilteredRegistrations,
    searchTerm
  );

  // Calculate counts for tabs
  const successCount = useMemo(
    () => registrations.filter((r) => r.paymentStatus === "completed").length,
    [registrations]
  );

  const pendingCount = useMemo(
    () => registrations.filter((r) => r.paymentStatus === "pending").length,
    [registrations]
  );

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

  // Reset search when tab changes
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setSearchTerm(""); // Clear search when switching tabs
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

      {/* Main Content */}
      <main className="container-fluid py-4">
        {/* Tab Navigation */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          successCount={successCount}
          pendingCount={pendingCount}
        />

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
                <h4 className="mt-3 text-muted">
                  No {activeTab} registrations found
                </h4>
                <p className="text-muted">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : `No ${activeTab} registration data available`}
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
      <DetailsModal
        selectedRegistration={selectedRegistration}
        key={"DetailModal"}
      />

      {/* Payment Modal */}
      <PaymentModal
        selectedRegistration={selectedRegistration}
        key={"payment_modal"}
      />

      {/* Guest Modal */}
      <GuestModal
        selectedRegistration={selectedRegistration}
        key={"guest_modal"}
      />

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
TabNavigation.displayName = "TabNavigation";
ActionButtons.displayName = "ActionButtons";
Pagination.displayName = "Pagination";

export default RegistrationList;
