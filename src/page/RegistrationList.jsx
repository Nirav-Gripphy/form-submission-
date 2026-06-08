import React, { useEffect, useState, useCallback, useMemo } from "react";
import { db } from "../services/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { formatDateTime } from "../Utility/global";
import { Pagination } from "../components/Pagination";
import DetailsModal from "../components/DetailsModal";
import GuestModal from "../components/GuestModal";
import { exportToExcelWithExcelJS } from "../Utility/exportUtils";
import DownloadModal from "../components/DownloadModal";
import EditGuestsModal from "../components/EditGuestsModal";

// ─── Static data (mirrors registration form) ─────────────────────────────────
const TRAIN_LIST = [
  "अरावली एक्सप्रेस (14702)",
  "रणकपुर एक्सप्रेस (14708)",
  "भुज-बरेली एक्सप्रेस (14322)",
  "रणथंभौर एक्सप्रेस (12465)",
];

const TRAVEL_MODES = ["Train", "Flight", "Car"];

const ARRIVAL_DATES = [
  { value: "2026-07-31", label: "31 जुलाई 2026" },
  { value: "2026-08-01", label: "1 अगस्त 2026" },
];

const DEPARTURE_DATES = [
  { value: "2026-08-01", label: "1 अगस्त 2026" },
  { value: "2026-08-02", label: "2 अगस्त 2026" },
  { value: "2026-08-03", label: "3 अगस्त 2026" },
];

const DEFAULT_FILTERS = {
  arrivalTravelMode: "",
  arrivalTrainName: "",
  arrivalDate: "",
  departureTravelMode: "",
  departureTrainName: "",
  departureDate: "",
  status: "",   // add this
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
const useRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const registrationsRef = collection(db, "registration-2026");
      const registrationsQuery = query(
        registrationsRef,
        orderBy("updatedAt", "desc"),
      );
      const snapshot = await getDocs(registrationsQuery);
      setRegistrations(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
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

const useFilters = (registrations, searchTerm, filters) =>
  useMemo(() => {
    let result = registrations;

    // Text search
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase().trim();
      result = result.filter((r) =>
        [
          r.name,
          r.phoneNumber,
          r.city,
          r.state,
          r.primaryBarcodeId,
          r.husbandName,
        ].some((f) => f && f.toLowerCase().includes(lower)),
      );
    }

    // Arrival travel mode  (field: arrivalTravelMode)
    if (filters.arrivalTravelMode) {
      result = result.filter(
        (r) =>
          r.arrivalTravelMode?.toLowerCase() ===
          filters.arrivalTravelMode.toLowerCase(),
      );
    }

    // Arrival train  (field: arrivalTrainName) — only meaningful when arrivalTravelMode = Train
    if (filters.arrivalTrainName) {
      result = result.filter(
        (r) => r.arrivalTrainName === filters.arrivalTrainName,
      );
    }

    // Arrival date  (field: arrivalDate)
    if (filters.arrivalDate) {
      result = result.filter((r) => r.arrivalDate === filters.arrivalDate);
    }

    // Departure travel mode  (field: departureTravelMode)
    if (filters.departureTravelMode) {
      result = result.filter(
        (r) =>
          r.departureTravelMode?.toLowerCase() ===
          filters.departureTravelMode.toLowerCase(),
      );
    }

    // Departure train  (field: departureTrainName) — only meaningful when departureTravelMode = Train
    if (filters.departureTrainName) {
      result = result.filter(
        (r) => r.departureTrainName === filters.departureTrainName,
      );
    }

    // Departure date  (field: departureDate)
    if (filters.departureDate) {
      result = result.filter((r) => r.departureDate === filters.departureDate);
    }

    // In useFilters, add:
    if (filters.status) {
      result = result.filter((r) =>
        filters.status === "completed"
          ? r.registrationStep === 4
          : r.registrationStep !== 4
      );
    }

    return result;
  }, [registrations, searchTerm, filters]);

const usePagination = (items, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const goToPage = useCallback(
    (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages))),
    [totalPages],
  );
  const goToNextPage = useCallback(
    () => setCurrentPage((p) => Math.min(p + 1, totalPages)),
    [totalPages],
  );
  const goToPrevPage = useCallback(
    () => setCurrentPage((p) => Math.max(p - 1, 1)),
    [],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  return {
    currentItems: items.slice(startIndex, endIndex),
    currentPage,
    totalPages,
    startIndex,
    endIndex: Math.min(endIndex, items.length),
    goToPage,
    goToNextPage,
    goToPrevPage,
  };
};

// ─── Small helpers ────────────────────────────────────────────────────────────
const UserAvatar = React.memo(({ photoURL, name, size = 40 }) => {
  const [imageError, setImageError] = useState(false);
  if (photoURL && !imageError) {
    return (
      <img
        src={photoURL}
        alt={`${name}'s profile`}
        className="rounded-circle"
        style={{ width: size, height: size, objectFit: "cover" }}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white fw-bold"
      style={{ width: size, height: size }}
    >
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
});

const TravelModeBadge = ({ mode }) => {
  const map = {
    train: { icon: "bi-train-front", cls: "bg-info" },
    flight: { icon: "bi-airplane", cls: "bg-primary" },
    car: { icon: "bi-car-front", cls: "bg-secondary" },
  };
  const { icon, cls } = map[mode?.toLowerCase()] ?? {
    icon: "bi-question-circle",
    cls: "bg-light text-dark",
  };
  return (
    <span
      className={`badge ${cls} bg-opacity-75 d-inline-flex align-items-center gap-1`}
    >
      <i className={`bi ${icon}`}></i>
      {mode || "N/A"}
    </span>
  );
};

// ─── Chip helper ──────────────────────────────────────────────────────────────
const Chip = ({ icon, label, color = "primary", onRemove }) => (
  <span
    className={`badge bg-opacity-10 text-${color} border border-${color} border-opacity-25 d-inline-flex align-items-center gap-1`}
  >
    <i className={`bi ${icon}`}></i>
    {label}
    <button
      className="btn-close ms-1"
      style={{ fontSize: "0.55rem" }}
      onClick={onRemove}
      aria-label={`Remove ${label} filter`}
    />
  </span>
);

// ─── Filter Offcanvas ─────────────────────────────────────────────────────────
const FilterOffcanvas = React.memo(
  ({ filters, onChange, onReset, hasActiveFilters, isOpen, onClose }) => {
    const set = (key, value) => onChange({ ...filters, [key]: value });

    const setArrivalMode = (val) =>
      onChange({ ...filters, arrivalTravelMode: val, arrivalTrainName: "" });
    const setDepartureMode = (val) =>
      onChange({
        ...filters,
        departureTravelMode: val,
        departureTrainName: "",
      });

    const showArrivalTrain = filters.arrivalTravelMode === "Train";
    const showDepartureTrain = filters.departureTravelMode === "Train";

    const chips = [
      filters.arrivalTravelMode && {
        icon: "bi-box-arrow-in-right",
        label: `Arrival: ${filters.arrivalTravelMode}`,
        color: "primary",
        key: "arrivalTravelMode",
      },
      filters.arrivalTrainName && {
        icon: "bi-train-front",
        label: filters.arrivalTrainName,
        color: "info",
        key: "arrivalTrainName",
      },
      filters.arrivalDate && {
        icon: "bi-calendar-event",
        label:
          ARRIVAL_DATES.find((d) => d.value === filters.arrivalDate)?.label ??
          filters.arrivalDate,
        color: "success",
        key: "arrivalDate",
      },
      filters.departureTravelMode && {
        icon: "bi-box-arrow-right",
        label: `Departure: ${filters.departureTravelMode}`,
        color: "primary",
        key: "departureTravelMode",
      },
      filters.departureTrainName && {
        icon: "bi-train-front",
        label: filters.departureTrainName,
        color: "info",
        key: "departureTrainName",
      },
      filters.departureDate && {
        icon: "bi-calendar-event",
        label:
          DEPARTURE_DATES.find((d) => d.value === filters.departureDate)
            ?.label ?? filters.departureDate,
        color: "warning",
        key: "departureDate",
      },
    ].filter(Boolean);

    // Inline styles for the offcanvas (avoids Bootstrap JS dependency for open/close)
    const backdropStyle = {
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
      zIndex: 1040,
      opacity: isOpen ? 1 : 0,
      pointerEvents: isOpen ? "auto" : "none",
      transition: "opacity 0.25s ease",
    };

    const panelStyle = {
      position: "fixed",
      top: 0,
      right: 0,
      width: "min(420px, 95vw)",
      height: "100%",
      backgroundColor: "#fff",
      boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
      zIndex: 1045,
      transform: isOpen ? "translateX(0)" : "translateX(100%)",
      transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
    };

    return (
      <>
        {/* Backdrop */}
        <div style={backdropStyle} onClick={onClose} aria-hidden="true" />

        {/* Panel */}
        <div
          style={panelStyle}
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          {/* ── Header ── */}
          <div
            className="d-flex align-items-center px-4 py-3 border-bottom"
            style={{ flexShrink: 0 }}
          >
            <i className="bi bi-funnel-fill text-primary me-2 fs-5"></i>
            <span className="fw-semibold fs-5">Filters</span>
            {hasActiveFilters && (
              <button
                className="btn btn-link btn-sm text-danger p-0 ms-3 text-decoration-none"
                onClick={onReset}
              >
                <i className="bi bi-x-circle me-1"></i>Clear all
              </button>
            )}
            <button
              className="btn-close ms-auto"
              onClick={onClose}
              aria-label="Close filters"
            />
          </div>

          {/* ── Body ── */}
          <div className="px-4 py-3 flex-grow-1">

            <div className="mb-3">
              <label className="form-label small text-muted mb-1">Status</label>
              <select
                className={`form-select form-select-sm ${filters.status ? "border-primary" : ""}`}
                value={filters.status}
                onChange={(e) => set("status", e.target.value)}
              >
                <option value="">All</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            {/* Active chips */}
            {chips.length > 0 && (
              <div className="d-flex flex-wrap gap-1 mb-4">
                {chips.map((chip) => (
                  <Chip
                    key={chip.key}
                    icon={chip.icon}
                    label={chip.label}
                    color={chip.color}
                    onRemove={() =>
                      chip.key === "arrivalTravelMode"
                        ? onChange({
                          ...filters,
                          arrivalTravelMode: "",
                          arrivalTrainName: "",
                        })
                        : chip.key === "departureTravelMode"
                          ? onChange({
                            ...filters,
                            departureTravelMode: "",
                            departureTrainName: "",
                          })
                          : set(chip.key, "")
                    }
                  />
                ))}
              </div>
            )}

            {/* ── ARRIVAL ── */}
            <p
              className="text-muted small fw-semibold mb-2 text-uppercase"
              style={{ letterSpacing: "0.06em" }}
            >
              <i className="bi bi-box-arrow-in-right me-1"></i>Arrival
            </p>

            <div className="mb-3">
              <label className="form-label small text-muted mb-1">
                Travel Mode
              </label>
              <select
                className={`form-select form-select-sm ${filters.arrivalTravelMode ? "border-primary" : ""}`}
                value={filters.arrivalTravelMode}
                onChange={(e) => setArrivalMode(e.target.value)}
              >
                <option value="">All Modes</option>
                {TRAVEL_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {showArrivalTrain && (
              <div className="mb-3">
                <label className="form-label small text-muted mb-1">
                  Train Name
                </label>
                <select
                  className={`form-select form-select-sm ${filters.arrivalTrainName ? "border-primary" : ""}`}
                  value={filters.arrivalTrainName}
                  onChange={(e) => set("arrivalTrainName", e.target.value)}
                >
                  <option value="">All Trains</option>
                  {TRAIN_LIST.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="form-label small text-muted mb-1">
                Arrival Date
              </label>
              <select
                className={`form-select form-select-sm ${filters.arrivalDate ? "border-primary" : ""}`}
                value={filters.arrivalDate}
                onChange={(e) => set("arrivalDate", e.target.value)}
              >
                <option value="">All Dates</option>
                {ARRIVAL_DATES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <hr />

            {/* ── DEPARTURE ── */}
            <p
              className="text-muted small fw-semibold mb-2 mt-3 text-uppercase"
              style={{ letterSpacing: "0.06em" }}
            >
              <i className="bi bi-box-arrow-right me-1"></i>Departure
            </p>

            <div className="mb-3">
              <label className="form-label small text-muted mb-1">
                Travel Mode
              </label>
              <select
                className={`form-select form-select-sm ${filters.departureTravelMode ? "border-primary" : ""}`}
                value={filters.departureTravelMode}
                onChange={(e) => setDepartureMode(e.target.value)}
              >
                <option value="">All Modes</option>
                {TRAVEL_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {showDepartureTrain && (
              <div className="mb-3">
                <label className="form-label small text-muted mb-1">
                  Train Name
                </label>
                <select
                  className={`form-select form-select-sm ${filters.departureTrainName ? "border-primary" : ""}`}
                  value={filters.departureTrainName}
                  onChange={(e) => set("departureTrainName", e.target.value)}
                >
                  <option value="">All Trains</option>
                  {TRAIN_LIST.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="form-label small text-muted mb-1">
                Departure Date
              </label>
              <select
                className={`form-select form-select-sm ${filters.departureDate ? "border-primary" : ""}`}
                value={filters.departureDate}
                onChange={(e) => set("departureDate", e.target.value)}
              >
                <option value="">All Dates</option>
                {DEPARTURE_DATES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Footer ── */}
          <div
            className="px-4 py-3 border-top d-flex gap-2"
            style={{ flexShrink: 0 }}
          >
            <button className="btn btn-primary flex-grow-1" onClick={onClose}>
              Apply Filters
            </button>
            {hasActiveFilters && (
              <button className="btn btn-outline-danger" onClick={onReset}>
                Reset
              </button>
            )}
          </div>
        </div>
      </>
    );
  },
);
FilterOffcanvas.displayName = "FilterOffcanvas";

// ─── Search + Stats bar ───────────────────────────────────────────────────────
const SearchInput = React.memo(({ value, onChange, totalResults }) => (
  <div className="col-md-6">
    <div className="input-group">
      <span className="input-group-text">
        <i className="bi bi-search"></i>
      </span>
      <input
        type="search"
        className="form-control"
        placeholder="Search by name, phone, city, state, or barcode..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search registrations"
      />
    </div>
    <small className="text-muted mt-1 d-block">
      {totalResults} result{totalResults !== 1 ? "s" : ""} found
    </small>
  </div>
));

const StatsDisplay = React.memo(
  ({ filteredRegistrations, hasActiveFilters, onOpenFilter }) => {
    const totalParticipants = useMemo(
      () =>
        filteredRegistrations.reduce((sum, r) => {
          let n = 1;
          if (r.hasHusband && r.husbandName) n += 1;
          if (r.additionalPeople?.length > 0) n += r.additionalPeople.length;
          return sum + n;
        }, 0),
      [filteredRegistrations],
    );

    return (
      <div className="col-md-6">
        <div className="d-flex gap-2 justify-content-md-end mt-3 mt-md-0 flex-wrap align-items-center">
          {/* Filters trigger */}
          <button
            className="btn btn-outline-primary d-flex align-items-center position-relative"
            type="button"
            onClick={onOpenFilter}
          >
            <i className="bi bi-funnel me-2"></i>
            Filters
            {hasActiveFilters && (
              <span
                className="position-absolute top-0 start-100 translate-middle p-1 bg-danger rounded-circle"
                style={{ width: 10, height: 10 }}
              >
                <span className="visually-hidden">filters active</span>
              </span>
            )}
          </button>

          <div className="bg-primary bg-opacity-10 px-3 py-2 rounded border border-primary border-opacity-25">
            <span className="text-white fw-medium">
              Total Attendees: {totalParticipants}
            </span>
          </div>

          <button
            className="btn btn-success d-flex align-items-center"
            type="button"
            onClick={() =>
              exportToExcelWithExcelJS(
                [...(filteredRegistrations ?? [])].reverse(),
              )
            }
          >
            <i className="bi bi-download me-2"></i>
            Export ({filteredRegistrations.length})
          </button>
        </div>
      </div>
    );
  },
);

const ActionButtons = React.memo(({ registration, onOpenModal }) => (
  <div className="btn-group" role="group">
    <button
      type="button"
      className="btn btn-outline-primary btn-sm"
      onClick={() => onOpenModal(registration, "details")}
      title="View full details"
    >
      <i className="bi bi-eye"></i>
    </button>
    <button
      type="button"
      className="btn btn-outline-dark btn-sm"
      onClick={() => onOpenModal(registration, "download")}
      title="Download receipt"
    >
      <i className="bi bi-download"></i>
    </button>
    {registration.additionalPeople?.length > 0 && (
      <button
        type="button"
        className="btn btn-outline-info btn-sm position-relative"
        onClick={() => onOpenModal(registration, "guests")}
        title={`View ${registration.additionalPeople.length} additional people`}
      >
        <i className="bi bi-people"></i>
        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-info">
          {registration.additionalPeople.length}
        </span>
      </button>
    )}
    {registration.registrationStep === 4 && <button
      type="button"
      className="btn btn-outline-success btn-sm"
      onClick={() => onOpenModal(registration, "editGuests")}
      title="Edit guests & husband"
    >
      <i className="bi bi-pencil-square"></i> {registration.step}
    </button>}
  </div>
));

// ─── Main component ───────────────────────────────────────────────────────────
const RegistrationList = () => {
  const { registrations, loading, error, refetch } = useRegistrations();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const hasActiveFilters = Object.values(filters).some(Boolean);
  const filteredRegistrations = useFilters(registrations, searchTerm, filters);

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

  const handleResetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);
  const handleOpenFilter = useCallback(() => setFilterOpen(true), []);
  const handleCloseFilter = useCallback(() => setFilterOpen(false), []);

  const openModal = useCallback((registration, modalType) => {
    setSelectedRegistration(registration);
    try {
      const el = document.getElementById(`${modalType}Modal`);
      if (el && window.bootstrap?.Modal) new window.bootstrap.Modal(el).show();
    } catch (err) {
      console.error("Error opening modal:", err);
    }
  }, []);

  if (loading) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
          <p className="mt-3 text-muted">Loading registration data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
          <button onClick={refetch} className="btn btn-primary">
            <i className="bi bi-arrow-clockwise me-2"></i>Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100">
      <main className="container-fluid py-4">
        {/* Search + Stats */}
        <div className="card mb-3 shadow-sm">
          <div className="card-body">
            <div className="row align-items-center">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                totalResults={filteredRegistrations.length}
              />
              <StatsDisplay
                filteredRegistrations={filteredRegistrations}
                hasActiveFilters={hasActiveFilters}
                onOpenFilter={handleOpenFilter}
              />
            </div>
          </div>
        </div>

        {/* Filter Offcanvas */}
        <FilterOffcanvas
          filters={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
          isOpen={filterOpen}
          onClose={handleCloseFilter}
        />

        {/* Table */}
        <div className="card shadow-sm">
          <div className="card-body p-0">
            {currentItems.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-funnel display-4 text-muted"></i>
                <h4 className="mt-3 text-muted">No registrations found</h4>
                <p className="text-muted">
                  {searchTerm || hasActiveFilters
                    ? "Try adjusting your search or filters"
                    : "No registration data available"}
                </p>
                {hasActiveFilters && (
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={handleResetFilters}
                  >
                    <i className="bi bi-x-circle me-1"></i>Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Location</th>
                        <th>Barcode ID</th>
                        <th className="d-none d-lg-table-cell">Arrival</th>
                        <th className="d-none d-xl-table-cell">Departure</th>
                        <th className="d-none d-lg-table-cell">Reg. Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((reg, index) => (
                        <tr key={reg.id}>
                          <td className="text-muted">
                            {startIndex + index + 1}
                          </td>

                          {/* Name */}
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="me-3 flex-shrink-0">
                                <UserAvatar
                                  photoURL={reg.photoURL}
                                  name={reg.name}
                                  size={40}
                                />
                              </div>
                              <div>
                                <div className="fw-medium text-truncate">
                                  {reg.name || "N/A"}
                                </div>
                                {reg.hasHusband && reg.husbandName && (
                                  <small className="text-muted d-block">
                                    Husband: {reg.husbandName}
                                  </small>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Phone */}
                          <td>
                            <a
                              href={`tel:${reg.phoneNumber}`}
                              className="text-decoration-none"
                            >
                              {reg.phoneNumber || "N/A"}
                            </a>
                          </td>

                          {/* Location */}
                          <td>
                            <div className="small fw-medium">
                              {reg.city || "N/A"}
                            </div>
                            <div className="small text-muted">
                              {reg.state || "N/A"}
                            </div>
                          </td>

                          {/* Barcode */}
                          <td>
                            <div className="font-monospace small">
                              {reg.primaryBarcodeId || "N/A"}
                            </div>
                            {reg.hasHusband && reg.spouseBarcodeId && (
                              <div className="font-monospace small text-muted">
                                {reg.spouseBarcodeId}
                              </div>
                            )}
                          </td>

                          {/* Arrival summary */}
                          <td className="d-none d-lg-table-cell small">
                            <div className="d-flex flex-column gap-1">
                              <TravelModeBadge mode={reg.arrivalTravelMode} />
                              {reg.arrivalTravelMode === "Train" &&
                                reg.arrivalTrainName && (
                                  <span
                                    className="text-muted"
                                    title={reg.arrivalTrainName}
                                  >
                                    <i className="bi bi-train-front me-1"></i>
                                    <span style={{ fontSize: "0.75rem" }}>
                                      {reg.arrivalTrainName}
                                    </span>
                                  </span>
                                )}
                              {reg.arrivalDate && (
                                <span
                                  className="text-muted"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  <i className="bi bi-calendar2 me-1"></i>
                                  {ARRIVAL_DATES.find(
                                    (d) => d.value === reg.arrivalDate,
                                  )?.label ?? reg.arrivalDate}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Departure summary */}
                          <td className="d-none d-xl-table-cell small">
                            <div className="d-flex flex-column gap-1">
                              <TravelModeBadge mode={reg.departureTravelMode} />
                              {reg.departureTravelMode === "Train" &&
                                reg.departureTrainName && (
                                  <span
                                    className="text-muted"
                                    title={reg.departureTrainName}
                                  >
                                    <i className="bi bi-train-front me-1"></i>
                                    <span style={{ fontSize: "0.75rem" }}>
                                      {reg.departureTrainName}
                                    </span>
                                  </span>
                                )}
                              {reg.departureDate && (
                                <span
                                  className="text-muted"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  <i className="bi bi-calendar2 me-1"></i>
                                  {DEPARTURE_DATES.find(
                                    (d) => d.value === reg.departureDate,
                                  )?.label ?? reg.departureDate}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Reg time */}
                          <td className="d-none d-lg-table-cell small text-muted">
                            {formatDateTime(reg.updatedAt)}
                          </td>

                          <td>
                            <StatusBadge step={reg.registrationStep} />
                          </td>

                          {/* Actions */}
                          <td>
                            {console.log(reg)}
                            <ActionButtons
                              registration={reg}
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

      <DetailsModal
        selectedRegistration={selectedRegistration}
        key="DetailModal"
      />
      <GuestModal
        selectedRegistration={selectedRegistration}
        key="guest_modal"
      />
      <DownloadModal
        selectedRegistration={selectedRegistration}
        key="download_modal"
      />

      <EditGuestsModal
        selectedRegistration={selectedRegistration}
        onSaveSuccess={refetch}   // re-fetches the list after save
        key="edit_guests_modal"
      />

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

UserAvatar.displayName = "UserAvatar";
SearchInput.displayName = "SearchInput";
StatsDisplay.displayName = "StatsDisplay";
ActionButtons.displayName = "ActionButtons";
FilterOffcanvas.displayName = "FilterOffcanvas";

const StatusBadge = ({ step }) => {
  const isCompleted = step === 4;
  return (
    <span className={`badge ${isCompleted ? "bg-success" : "bg-warning text-dark"} d-inline-flex align-items-center gap-1`}>
      <i className={`bi ${isCompleted ? "bi-check-circle-fill" : "bi-clock-fill"}`}></i>
      {isCompleted ? "Completed" : "Pending"}
    </span>
  );
};

export default RegistrationList;
