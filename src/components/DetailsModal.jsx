import React, { useCallback, useEffect, useRef, useState } from "react";
import { formatDate, formatDateTime } from "../Utility/global";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const isPdfTicket = (url, fileName) => {
  const value = `${fileName || ""} ${url || ""}`.toLowerCase();
  return (
    value.includes(".pdf") ||
    value.includes("application%2Fpdf") ||
    value.includes("application/pdf")
  );
};

const ZOOM_LEVELS = [1, 1.25, 1.5, 2];

/* ─────────────────────────────────────────────
   Ticket Preview Modal
───────────────────────────────────────────── */
const TicketPreviewModal = ({ preview, onClose }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  const modalRef = useRef(null);
  const imgRef = useRef(null);

  const isPdf = preview?.isPdf;
  const zoom = ZOOM_LEVELS[zoomIndex];
  const displayName = preview?.fileName || preview?.title || "Ticket";
  const openUrl = preview?.url || "";

  /* Reset state on each new preview */
  useEffect(() => {
    if (!preview) return;
    setImgLoaded(false);
    setLoadError(false);
    setZoomIndex(0);

    // If image is already cached the onLoad won't re-fire, so check after a tick
    if (!preview.isPdf) {
      const timer = setTimeout(() => {
        if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
          setImgLoaded(true);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [preview?.url]);

  /* Bootstrap modal lifecycle */
  useEffect(() => {
    if (!preview) return;
    const el = modalRef.current;
    if (!el || !window.bootstrap?.Modal) return;

    const modal = window.bootstrap.Modal.getOrCreateInstance(el, {
      backdrop: true,
      keyboard: true,
    });
    modal.show();

    const handleHidden = () => onClose?.();
    el.addEventListener("hidden.bs.modal", handleHidden);
    return () => el.removeEventListener("hidden.bs.modal", handleHidden);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview?.url]);

  const handleClose = () => {
    const el = modalRef.current;
    if (el && window.bootstrap?.Modal) {
      window.bootstrap.Modal.getInstance(el)?.hide();
    }
  };

  const handleImgLoad = useCallback(() => {
    setImgLoaded(true);
    setLoadError(false);
  }, []);

  const handleImgError = useCallback(() => {
    setImgLoaded(false);
    setLoadError(true);
  }, []);

  // For PDF we treat it as loaded immediately (iframe handles its own loading)
  const isPdfLoading = false;
  const isImgLoading = !isPdf && !imgLoaded && !loadError;

  return (
    <div
      ref={modalRef}
      className="modal fade"
      id="ticketPreviewModal"
      tabIndex="-1"
      aria-labelledby="ticketPreviewModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable tpm-dialog">
        <div className="modal-content tpm-content">

          {/* ── Header ── */}
          <div className="tpm-header">
            <div className="tpm-header-left">
              <div className="tpm-type-badge">
                {isPdf
                  ? <><i className="bi bi-file-earmark-pdf" /> PDF</>
                  : <><i className="bi bi-image" /> Image</>
                }
              </div>
              <div className="tpm-header-text">
                <h5 className="tpm-title" id="ticketPreviewModalLabel">
                  {preview?.title || "Ticket Preview"}
                </h5>
                {preview?.fileName && (
                  <span className="tpm-filename" title={preview.fileName}>
                    {preview.fileName}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="tpm-close"
              aria-label="Close ticket preview"
              onClick={handleClose}
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="tpm-body">
            {/* Loading state */}
            {isImgLoading && !loadError && (
              <div className="tpm-loader">
                <div className="tpm-spinner" />
                <span>Loading preview…</span>
              </div>
            )}

            {/* Error state */}
            {loadError && (
              <div className="tpm-error">
                <div className="tpm-error-icon">
                  <i className="bi bi-exclamation-triangle-fill" />
                </div>
                <p className="tpm-error-title">Preview unavailable</p>
                <p className="tpm-error-sub">
                  The file may be restricted or the URL has expired.
                </p>
                <div className="tpm-error-actions">
                  <a href={openUrl} target="_blank" rel="noopener noreferrer" className="tpm-btn tpm-btn--primary">
                    <i className="bi bi-box-arrow-up-right" /> Open in new tab
                  </a>
                  <a href={openUrl} download={displayName} className="tpm-btn tpm-btn--ghost">
                    <i className="bi bi-download" /> Download
                  </a>
                </div>
              </div>
            )}

            {/* PDF viewer */}
            {!loadError && isPdf && (
              <div className="tpm-pdf-wrap">
                <div className="tpm-pdf-topbar">
                  <i className="bi bi-file-earmark-pdf tpm-pdf-icon" />
                  <span className="tpm-pdf-name">{displayName}</span>
                </div>
                <iframe
                  src={`${openUrl}#toolbar=1&navpanes=0`}
                  title={preview?.title}
                  className="tpm-iframe"
                />
              </div>
            )}

            {/* Image viewer */}
            {!loadError && !isPdf && (
              <div className={`tpm-img-wrap ${imgLoaded ? "is-loaded" : ""}`}>
                <img
                  ref={imgRef}
                  src={openUrl}
                  alt={preview?.title}
                  className="tpm-img"
                  style={{ transform: `scale(${zoom})` }}
                  onLoad={handleImgLoad}
                  onError={handleImgError}
                  onClick={() => setZoomIndex((i) => (i + 1) % ZOOM_LEVELS.length)}
                  title={zoom > 1 ? "Click to zoom out" : "Click to zoom in"}
                  draggable={false}
                />
              </div>
            )}
          </div>

          {/* ── Toolbar (images only) ── */}
          {!isPdf && imgLoaded && !loadError && (
            <div className="tpm-toolbar">
              <button
                className="tpm-tool-btn"
                onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
                disabled={zoomIndex === 0}
                aria-label="Zoom out"
                title="Zoom out"
              >
                <i className="bi bi-zoom-out" />
              </button>
              <span className="tpm-zoom-pct">{Math.round(zoom * 100)}%</span>
              <button
                className="tpm-tool-btn"
                onClick={() => setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
                disabled={zoomIndex === ZOOM_LEVELS.length - 1}
                aria-label="Zoom in"
                title="Zoom in"
              >
                <i className="bi bi-zoom-in" />
              </button>
              <div className="tpm-tool-divider" />
              <button
                className="tpm-tool-btn"
                onClick={() => setZoomIndex(0)}
                disabled={zoomIndex === 0}
                title="Reset zoom"
              >
                Fit
              </button>
            </div>
          )}

          {/* ── Footer ── */}
          {preview && !loadError && (
            <div className="tpm-footer">
              <span className="tpm-footer-hint">
                {isPdf ? "Use browser toolbar · or open in a new tab" : "Click image to zoom"}
              </span>
              <div className="tpm-footer-actions">
                <a href={openUrl} download={displayName} className="tpm-btn tpm-btn--ghost">
                  <i className="bi bi-download" /> Download
                </a>
                <a href={openUrl} target="_blank" rel="noopener noreferrer" className="tpm-btn tpm-btn--primary">
                  <i className="bi bi-box-arrow-up-right" /> Open
                </a>
                <button type="button" className="tpm-btn tpm-btn--muted" onClick={handleClose}>
                  Close
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Scoped styles ── */}
      <style>{`
        #ticketPreviewModal { z-index: 1065; }

        .tpm-dialog {
          max-width: min(900px, 95vw);
        }

        .tpm-content {
          border: none;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.2);
          background: #16181d;
        }

        /* Header */
        .tpm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #1a2332 0%, #1e2d45 100%);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        .tpm-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .tpm-type-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          white-space: nowrap;
          background: rgba(99, 179, 237, 0.15);
          color: #63b3ed;
          border: 1px solid rgba(99, 179, 237, 0.25);
        }

        .tpm-type-badge .bi-file-earmark-pdf { color: #fc8181; }
        .tpm-type-badge .bi { font-size: 0.75rem; }

        .tpm-header-text {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .tpm-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #e2e8f0;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tpm-filename {
          font-size: 0.72rem;
          color: #718096;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 300px;
        }

        .tpm-close {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #a0aec0;
          cursor: pointer;
          transition: all 0.15s;
          font-size: 0.9rem;
        }
        .tpm-close:hover { background: rgba(255,255,255,0.12); color: #e2e8f0; }

        /* Body */
        .tpm-body {
          position: relative;
          min-height: 340px;
          max-height: calc(100vh - 240px);
          background: #0f1117;
          overflow: hidden;
          display: flex;
          align-items: stretch;
        }

        /* Loader */
        .tpm-loader {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          background: #0f1117;
          color: #718096;
          font-size: 0.875rem;
          z-index: 3;
        }

        .tpm-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(99,179,237,0.15);
          border-top-color: #63b3ed;
          border-radius: 50%;
          animation: tpmSpin 0.7s linear infinite;
        }

        @keyframes tpmSpin { to { transform: rotate(360deg); } }

        /* Error */
        .tpm-error {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          text-align: center;
        }

        .tpm-error-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(252,129,129,0.1);
          border: 1px solid rgba(252,129,129,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          color: #fc8181;
          margin-bottom: 16px;
        }

        .tpm-error-title {
          font-size: 1rem;
          font-weight: 600;
          color: #e2e8f0;
          margin: 0 0 8px;
        }

        .tpm-error-sub {
          font-size: 0.8rem;
          color: #718096;
          margin: 0 0 20px;
          max-width: 280px;
        }

        .tpm-error-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* PDF */
        .tpm-pdf-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .tpm-pdf-topbar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #1a1f2e;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          font-size: 0.82rem;
          color: #a0aec0;
        }

        .tpm-pdf-icon { color: #fc8181; font-size: 1.1rem; }

        .tpm-pdf-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tpm-iframe {
          flex: 1;
          width: 100%;
          min-height: 460px;
          border: none;
          background: #fff;
        }

        /* Image viewer */
        .tpm-img-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          overflow: auto;
          min-height: 340px;
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .tpm-img-wrap.is-loaded { opacity: 1; }

        .tpm-img {
          max-width: 100%;
          max-height: calc(100vh - 300px);
          object-fit: contain;
          border-radius: 6px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          transform-origin: center;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
          cursor: zoom-in;
          user-select: none;
        }

        /* Toolbar */
        .tpm-toolbar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 16px;
          background: #1a1f2e;
          border-top: 1px solid rgba(255,255,255,0.07);
        }

        .tpm-tool-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 7px;
          color: #a0aec0;
          cursor: pointer;
          transition: all 0.15s;
          font-size: 0.85rem;
        }

        .tpm-tool-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.1);
          color: #e2e8f0;
        }

        .tpm-tool-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .tpm-tool-btn:not(.bi) { width: auto; padding: 0 10px; font-size: 0.75rem; font-weight: 600; }

        .tpm-zoom-pct {
          font-size: 0.78rem;
          font-weight: 600;
          color: #63b3ed;
          min-width: 44px;
          text-align: center;
          font-variant-numeric: tabular-nums;
        }

        .tpm-tool-divider {
          width: 1px;
          height: 20px;
          background: rgba(255,255,255,0.1);
          margin: 0 4px;
        }

        /* Footer */
        .tpm-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          padding: 12px 20px;
          background: #16181d;
          border-top: 1px solid rgba(255,255,255,0.07);
        }

        .tpm-footer-hint {
          font-size: 0.75rem;
          color: #4a5568;
        }

        .tpm-footer-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-left: auto;
        }

        /* Buttons */
        .tpm-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .tpm-btn--primary {
          background: #2b6cb0;
          color: #fff;
        }
        .tpm-btn--primary:hover { background: #2c5282; color: #fff; }

        .tpm-btn--ghost {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: #a0aec0;
        }
        .tpm-btn--ghost:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }

        .tpm-btn--muted {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #718096;
        }
        .tpm-btn--muted:hover { background: rgba(255,255,255,0.08); color: #a0aec0; }

        /* Responsive */
        @media (max-width: 576px) {
          .tpm-footer { flex-direction: column; align-items: stretch; }
          .tpm-footer-actions { justify-content: stretch; }
          .tpm-btn { justify-content: center; flex: 1; }
          .tpm-filename { display: none; }
        }
      `}</style>
    </div>
  );
};

/* ─────────────────────────────────────────────
   User Avatar
───────────────────────────────────────────── */
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
      aria-label={`Avatar for ${name}`}
    >
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
});

/* ─────────────────────────────────────────────
   Main DetailsModal
───────────────────────────────────────────── */
const DetailsModal = ({ selectedRegistration }) => {
  const [ticketPreview, setTicketPreview] = useState(null);

  useEffect(() => {
    setTicketPreview(null);
  }, [selectedRegistration?.id]);

  const closeTicketPreview = useCallback(() => setTicketPreview(null), []);

  const openTicketPreview = (url, title, fileName) => {
    if (!url) return;
    setTicketPreview({ url, title, isPdf: isPdfTicket(url, fileName), fileName: fileName || "" });
  };

  const formatTrainName = (trainName, trainNameOther) => {
    if (!trainName) return "";
    if (trainName === "Others / अन्य" && trainNameOther) return `${trainName} (${trainNameOther})`;
    return trainName;
  };

  const ticketItems = [
    {
      key: "arrival",
      label: "Arrival Ticket",
      url: selectedRegistration?.arrivalTicketURL,
      fileName: selectedRegistration?.arrivalTicketFileName,
      show: !!selectedRegistration?.arrivalTicketURL,
    },
    {
      key: "departure",
      label: "Departure Ticket",
      url: selectedRegistration?.departureTicketURL,
      fileName: selectedRegistration?.departureTicketFileName,
      show: !!selectedRegistration?.departureTicketURL,
    },
  ].filter((item) => item.show);

  return (
    <>
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
              />
            </div>

            <div className="modal-body">
              {selectedRegistration && (
                <div className="row g-4">
                  {/* ── Left column ── */}
                  <div className="col-md-6">
                    <div className="d-flex align-items-center mb-4">
                      <UserAvatar
                        photoURL={selectedRegistration.photoURL}
                        name={selectedRegistration.name}
                        size={60}
                      />
                      <div className="ms-3">
                        <h5 className="mb-1">{selectedRegistration.name}</h5>
                        <p className="text-muted mb-0">
                          <i className="bi bi-telephone me-1" aria-hidden="true" />
                          <a href={`tel:${selectedRegistration.phoneNumber}`} className="text-decoration-none">
                            {selectedRegistration.phoneNumber}
                          </a>
                        </p>
                      </div>
                    </div>

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
                            <p className="fw-medium mb-1">{selectedRegistration.husbandName}</p>
                            <small className="text-muted font-monospace">
                              ID: {selectedRegistration.spouseBarcodeId}
                            </small>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="border-top pt-3">
                      <h6 className="mb-3">
                        Additional People ({selectedRegistration.additionalPeople?.length || 0}):
                      </h6>
                      {selectedRegistration.additionalPeople?.length > 0 ? (
                        <div className="row g-2">
                          {selectedRegistration.additionalPeople.map((person, index) => (
                            <div key={person.id || index} className="col-12">
                              <div className="card card-body py-2">
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <div className="fw-medium">{person.name}</div>
                                    <small className="text-muted">{person.relation}</small>
                                  </div>
                                  <span className="badge bg-secondary">#{index + 1}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-3 text-muted">
                          <i className="bi bi-people display-6" aria-hidden="true" />
                          <p className="mt-2 mb-0">No additional people</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Right column ── */}
                  <div className="col-md-6">
                    <div className="mb-4">
                      <h6 className="mb-2">
                        <i className="bi bi-geo-alt me-1" aria-hidden="true" />
                        Address:
                      </h6>
                      <address className="mb-0">
                        {selectedRegistration.city}, {selectedRegistration.state}
                      </address>
                    </div>

                    <div className="mb-4">
                      <h6 className="mb-2">
                        <i className="bi bi-calendar me-1" aria-hidden="true" />
                        Travel Details:
                      </h6>
                      <div className="small">
                        <div className="row g-2">
                          <div className="col-6">
                            <strong>Arrival:</strong><br />
                            {formatDate(selectedRegistration.arrivalDate)}<br />
                            <small className="text-muted">{selectedRegistration.arrivalTime}</small><br />
                            <small className="text-muted">via {selectedRegistration.arrivalTravelMode}</small>
                          </div>
                          <div className="col-6">
                            <strong>Departure:</strong><br />
                            {formatDate(selectedRegistration.departureDate)}<br />
                            <small className="text-muted">{selectedRegistration.departureTime}</small><br />
                            <small className="text-muted">via {selectedRegistration.departureTravelMode}</small>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Ticket links ── */}
                    {ticketItems.length > 0 && (
                      <div className="mb-4">
                        <h6 className="mb-2">
                          <i className="bi bi-ticket-perforated me-1" aria-hidden="true" />
                          Uploaded Tickets:
                        </h6>
                        <div className="d-flex flex-column gap-1">
                          {ticketItems.map((ticket) => (
                            <button
                              key={ticket.key}
                              type="button"
                              className="btn btn-link btn-sm p-0 text-start text-decoration-none d-flex align-items-center gap-2"
                              style={{ width: "fit-content" }}
                              onClick={() => openTicketPreview(ticket.url, ticket.label, ticket.fileName)}
                              aria-label={`Preview ${ticket.label}`}
                            >
                              <i
                                className={`bi ${
                                  isPdfTicket(ticket.url, ticket.fileName)
                                    ? "bi-file-earmark-pdf text-danger"
                                    : "bi-image text-primary"
                                }`}
                              />
                              <span>{ticket.label}</span>
                              <i className="bi bi-eye text-muted" style={{ fontSize: "0.75rem" }} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Registration meta */}
                    <div>
                      <h6 className="mb-2">Registration Details:</h6>
                      <div className="small">
                        {selectedRegistration.arrivalTravelMode === "Train" &&
                          selectedRegistration.arrivalTrainName && (
                            <p className="mb-1">
                              <strong>Arrival Train:</strong>{" "}
                              {formatTrainName(
                                selectedRegistration.arrivalTrainName,
                                selectedRegistration.arrivalTrainNameOther,
                              )}
                            </p>
                          )}
                        {selectedRegistration.departureTravelMode === "Train" &&
                          selectedRegistration.departureTrainName && (
                            <p className="mb-1">
                              <strong>Departure Train:</strong>{" "}
                              {formatTrainName(
                                selectedRegistration.departureTrainName,
                                selectedRegistration.departureTrainNameOther,
                              )}
                            </p>
                          )}
                        <p className="mb-1">
                          <strong>Barcode ID:</strong>
                          <span className="font-monospace ms-1">{selectedRegistration.primaryBarcodeId}</span>
                        </p>
                        <p className="mb-1">
                          <strong>Total Attendees:</strong> {selectedRegistration.attendeeCount}
                        </p>
                        <p className="mb-0">
                          <strong>Registration Date:</strong>{" "}
                          {formatDateTime(selectedRegistration.registrationDate)}
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

      <TicketPreviewModal preview={ticketPreview} onClose={closeTicketPreview} />
    </>
  );
};

export default DetailsModal;