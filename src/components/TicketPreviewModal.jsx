import React, { useCallback, useEffect, useState } from "react";
import "../styles/TicketPreviewModal.css";

const ZOOM_LEVELS = [1, 1.25, 1.5, 2];

const TicketPreviewModal = ({ preview, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);

  const isPdf = preview?.isPdf;
  const zoom = ZOOM_LEVELS[zoomIndex];

  useEffect(() => {
    if (!preview) return;
    setLoading(true);
    setLoadError(false);
    setZoomIndex(0);
  }, [preview?.url]);

  useEffect(() => {
    if (!preview) return;

    const modalElement = document.getElementById("ticketPreviewModal");
    if (!modalElement || !window.bootstrap?.Modal) return;

    const modal = window.bootstrap.Modal.getOrCreateInstance(modalElement, {
      backdrop: true,
      keyboard: true,
    });
    modal.show();

    const handleHidden = () => onClose?.();
    modalElement.addEventListener("hidden.bs.modal", handleHidden);
    return () => {
      modalElement.removeEventListener("hidden.bs.modal", handleHidden);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onClose clears preview; stable handler from parent
  }, [preview?.url]);

  const handleClose = () => {
    const modalElement = document.getElementById("ticketPreviewModal");
    if (modalElement && window.bootstrap?.Modal) {
      window.bootstrap.Modal.getInstance(modalElement)?.hide();
    }
  };

  const handleLoadSuccess = useCallback(() => {
    setLoading(false);
    setLoadError(false);
  }, []);

  const handleLoadError = useCallback(() => {
    setLoading(false);
    setLoadError(true);
  }, []);

  const cycleZoom = () => {
    setZoomIndex((i) => (i + 1) % ZOOM_LEVELS.length);
  };

  const resetZoom = () => setZoomIndex(0);

  const displayName =
    preview?.fileName || preview?.title || "Ticket";
  const openUrl = preview?.url || "";

  return (
    <div
      className="modal fade"
      id="ticketPreviewModal"
      tabIndex="-1"
      aria-labelledby="ticketPreviewModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content ticket-preview-modal__content">
          <div className="modal-header ticket-preview-modal__header">
            <div className="flex-grow-1 pe-3">
              <h5 className="ticket-preview-modal__title" id="ticketPreviewModalLabel">
                {preview?.title || "Ticket Preview"}
              </h5>
              <div className="ticket-preview-modal__meta">
                <span className="ticket-preview-modal__badge">
                  {isPdf ? (
                    <>
                      <i className="bi bi-file-earmark-pdf me-1" aria-hidden="true" />
                      PDF
                    </>
                  ) : (
                    <>
                      <i className="bi bi-image me-1" aria-hidden="true" />
                      Image
                    </>
                  )}
                </span>
                {preview?.fileName && (
                  <span
                    className="ticket-preview-modal__filename"
                    title={preview.fileName}
                  >
                    {preview.fileName}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close ticket preview"
              onClick={handleClose}
            ></button>
          </div>

          <div className="modal-body ticket-preview-modal__body">
            {!preview ? null : loading && !loadError ? (
              <div className="ticket-preview-modal__loader" aria-live="polite">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading ticket…</span>
                </div>
                <span>Loading preview…</span>
              </div>
            ) : loadError ? (
              <div className="ticket-preview-modal__error">
                <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                <p className="mb-2 fw-medium">Could not load preview</p>
                <p className="small text-muted mb-3">
                  The file may be restricted or unavailable. Open or download it
                  directly instead.
                </p>
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  <a
                    href={openUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    <i className="bi bi-box-arrow-up-right me-1" aria-hidden="true" />
                    Open in new tab
                  </a>
                  <a
                    href={openUrl}
                    download={displayName}
                    className="btn btn-outline-light btn-sm"
                  >
                    <i className="bi bi-download me-1" aria-hidden="true" />
                    Download
                  </a>
                </div>
              </div>
            ) : isPdf ? (
              <div className="ticket-preview-modal__viewer--pdf">
                <div className="ticket-preview-modal__pdf-bar">
                  <i className="bi bi-file-earmark-pdf" aria-hidden="true" />
                  <span className="text-truncate">{displayName}</span>
                </div>
                <iframe
                  src={`${openUrl}#toolbar=1&navpanes=0`}
                  title={preview.title}
                  className="ticket-preview-modal__iframe"
                  onLoad={handleLoadSuccess}
                  onError={handleLoadError}
                />
              </div>
            ) : (
              <>
                <div className="ticket-preview-modal__viewer--image">
                  <img
                    src={openUrl}
                    alt={preview.title}
                    className={`ticket-preview-modal__image ${
                      zoom > 1 ? "is-zoomed" : ""
                    }`}
                    style={{ transform: `scale(${zoom})` }}
                    onLoad={handleLoadSuccess}
                    onError={handleLoadError}
                    onClick={cycleZoom}
                    title="Click to zoom"
                  />
                </div>
                {!loading && (
                  <div className="ticket-preview-modal__toolbar">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() =>
                        setZoomIndex((i) => Math.max(0, i - 1))
                      }
                      disabled={zoomIndex === 0}
                      aria-label="Zoom out"
                    >
                      <i className="bi bi-zoom-out" aria-hidden="true" />
                    </button>
                    <span className="ticket-preview-modal__zoom-label">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() =>
                        setZoomIndex((i) =>
                          Math.min(ZOOM_LEVELS.length - 1, i + 1),
                        )
                      }
                      disabled={zoomIndex === ZOOM_LEVELS.length - 1}
                      aria-label="Zoom in"
                    >
                      <i className="bi bi-zoom-in" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={resetZoom}
                      disabled={zoomIndex === 0}
                    >
                      Fit
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {preview && !loadError && (
            <div className="modal-footer ticket-preview-modal__footer">
              <span className="small text-muted d-none d-sm-inline">
                {isPdf
                  ? "Use the toolbar above the document or open in a new tab."
                  : "Click the image or use zoom controls."}
              </span>
              <div className="ticket-preview-modal__footer-actions ms-sm-auto">
                <a
                  href={openUrl}
                  download={displayName}
                  className="btn btn-outline-secondary btn-sm"
                >
                  <i className="bi bi-download me-1" aria-hidden="true" />
                  Download
                </a>
                <a
                  href={openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  <i className="bi bi-box-arrow-up-right me-1" aria-hidden="true" />
                  Open in new tab
                </a>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleClose}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketPreviewModal;
