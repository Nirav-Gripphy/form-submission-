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
                {isPdf ? (
                  <>
                    <i className="bi bi-file-earmark-pdf" /> PDF
                  </>
                ) : (
                  <>
                    <i className="bi bi-image" /> Image
                  </>
                )}
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
                  <a
                    href={openUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tpm-btn tpm-btn--primary"
                  >
                    <i className="bi bi-box-arrow-up-right" /> Open in new tab
                  </a>
                  <a
                    href={openUrl}
                    download={displayName}
                    className="tpm-btn tpm-btn--ghost"
                  >
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
                  onClick={() =>
                    setZoomIndex((i) => (i + 1) % ZOOM_LEVELS.length)
                  }
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
                onClick={() =>
                  setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))
                }
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
          {/* {preview && !loadError && (
            <div className="tpm-footer">
              <span className="tpm-footer-hint">
                {isPdf
                  ? "Use browser toolbar · or open in a new tab"
                  : "Click image to zoom"}
              </span>
              <div className="tpm-footer-actions">
                <a
                  href={openUrl}
                  download={displayName}
                  className="tpm-btn tpm-btn--ghost"
                >
                  <i className="bi bi-download" /> Download
                </a>
                <a
                  href={openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tpm-btn tpm-btn--primary"
                >
                  <i className="bi bi-box-arrow-up-right" /> Open
                </a>
                <button
                  type="button"
                  className="tpm-btn tpm-btn--muted"
                  onClick={handleClose}
                >
                  Close
                </button>
              </div>
            </div>
          )} */}
        </div>
      </div>

      {/* ── Scoped styles ── */}
      <style>{`
        #ticketPreviewModal { z-index: 1065; }

        .tpm-dialog {
          max-width: min(860px, 95vw);
        }

        .tpm-content {
          border: none;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
          background: #fff;
        }

        /* Header */
        .tpm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 20px;
          background: #fff;
          border-bottom: 1px solid #f0f0f0;
        }

        .tpm-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .tpm-type-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          white-space: nowrap;
          background: #f4f4f5;
          color: #71717a;
          border: 1px solid #e4e4e7;
          flex-shrink: 0;
        }

        .tpm-type-badge .bi-file-earmark-pdf { color: #ef4444; }
        .tpm-type-badge .bi-image { color: #3b82f6; }
        .tpm-type-badge .bi { font-size: 0.7rem; }

        .tpm-header-text {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .tpm-title {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: #18181b;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tpm-filename {
          font-size: 0.7rem;
          color: #a1a1aa;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 320px;
        }

        .tpm-close {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: #a1a1aa;
          cursor: pointer;
          transition: all 0.12s;
          font-size: 0.85rem;
        }
        .tpm-close:hover { background: #f4f4f5; color: #18181b; }

        /* Body */
        .tpm-body {
          position: relative;
          min-height: 320px;
          max-height: calc(100vh - 220px);
          background: #fafafa;
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
          gap: 12px;
          background: #fafafa;
          color: #a1a1aa;
          font-size: 0.82rem;
          z-index: 3;
        }

        .tpm-spinner {
          width: 28px;
          height: 28px;
          border: 2px solid #e4e4e7;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: tpmSpin 0.65s linear infinite;
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
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #fef2f2;
          border: 1px solid #fecaca;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          color: #ef4444;
          margin-bottom: 14px;
        }

        .tpm-error-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #18181b;
          margin: 0 0 6px;
        }

        .tpm-error-sub {
          font-size: 0.78rem;
          color: #a1a1aa;
          margin: 0 0 18px;
          max-width: 280px;
        }

        .tpm-error-actions {
          display: flex;
          gap: 8px;
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
          padding: 8px 16px;
          background: #fff;
          border-bottom: 1px solid #f0f0f0;
          font-size: 0.78rem;
          color: #71717a;
        }

        .tpm-pdf-icon { color: #ef4444; font-size: 1rem; }

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
          padding: 20px;
          overflow: auto;
          min-height: 320px;
          opacity: 0;
          transition: opacity 0.2s ease;
          background: #fafafa;
        }

        .tpm-img-wrap.is-loaded { opacity: 1; }

        .tpm-img {
          max-width: 100%;
          max-height: calc(100vh - 280px);
          object-fit: contain;
          border-radius: 4px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.1);
          transform-origin: center;
          transition: transform 0.18s ease;
          cursor: zoom-in;
          user-select: none;
        }

        /* Toolbar */
        .tpm-toolbar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px 16px;
          background: #fff;
          border-top: 1px solid #f0f0f0;
        }

        .tpm-tool-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background: transparent;
          border: 1px solid #e4e4e7;
          border-radius: 6px;
          color: #71717a;
          cursor: pointer;
          transition: all 0.12s;
          font-size: 0.82rem;
        }

        .tpm-tool-btn:hover:not(:disabled) {
          background: #f4f4f5;
          color: #18181b;
          border-color: #d4d4d8;
        }

        .tpm-tool-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .tpm-tool-btn:not(.bi) { width: auto; padding: 0 10px; font-size: 0.72rem; font-weight: 600; }

        .tpm-zoom-pct {
          font-size: 0.75rem;
          font-weight: 600;
          color: #3b82f6;
          min-width: 40px;
          text-align: center;
          font-variant-numeric: tabular-nums;
        }

        .tpm-tool-divider {
          width: 1px;
          height: 18px;
          background: #e4e4e7;
          margin: 0 4px;
        }

        /* Footer */
        .tpm-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          padding: 10px 16px;
          background: #fff;
          border-top: 1px solid #f0f0f0;
        }

        .tpm-footer-hint {
          font-size: 0.72rem;
          color: #a1a1aa;
        }

        .tpm-footer-actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-left: auto;
        }

        /* Buttons */
        .tpm-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.12s;
          white-space: nowrap;
          border: 1px solid transparent;
        }

        .tpm-btn--primary {
          background: #18181b;
          color: #fff;
          border-color: #18181b;
        }
        .tpm-btn--primary:hover { background: #27272a; color: #fff; }

        .tpm-btn--ghost {
          background: #fff;
          border-color: #e4e4e7;
          color: #52525b;
        }
        .tpm-btn--ghost:hover { background: #f4f4f5; color: #18181b; border-color: #d4d4d8; }

        .tpm-btn--muted {
          background: #f4f4f5;
          border-color: #f4f4f5;
          color: #71717a;
        }
        .tpm-btn--muted:hover { background: #e4e4e7; color: #3f3f46; }

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
    setTicketPreview({
      url,
      title,
      isPdf: isPdfTicket(url, fileName),
      fileName: fileName || "",
    });
  };

  const formatTrainName = (trainName, trainNameOther) => {
    if (!trainName) return "";
    if (trainName === "Others / अन्य" && trainNameOther)
      return `${trainName} (${trainNameOther})`;
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
                          <i
                            className="bi bi-telephone me-1"
                            aria-hidden="true"
                          />
                          <a
                            href={`tel:${selectedRegistration.phoneNumber}`}
                            className="text-decoration-none"
                          >
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
                            ),
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-3 text-muted">
                          <i
                            className="bi bi-people display-6"
                            aria-hidden="true"
                          />
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
                        {selectedRegistration.city},{" "}
                        {selectedRegistration.state}
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

                    {/* ── Ticket links ── */}
                    {ticketItems.length > 0 && (
                      <div className="mb-4">
                        <h6 className="mb-2">
                          <i
                            className="bi bi-ticket-perforated me-1"
                            aria-hidden="true"
                          />
                          Uploaded Tickets:
                        </h6>
                        <div className="d-flex flex-column gap-1">
                          {ticketItems.map((ticket) => (
                            <button
                              key={ticket.key}
                              type="button"
                              className="btn btn-link btn-sm p-0 text-start text-decoration-none d-flex align-items-center gap-2"
                              style={{ width: "fit-content" }}
                              onClick={() =>
                                openTicketPreview(
                                  ticket.url,
                                  ticket.label,
                                  ticket.fileName,
                                )
                              }
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
                              <i
                                className="bi bi-eye text-muted"
                                style={{ fontSize: "0.75rem" }}
                              />
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
                            selectedRegistration.registrationDate,
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

      <TicketPreviewModal
        preview={ticketPreview}
        onClose={closeTicketPreview}
      />
    </>
  );
};

export default DetailsModal;
