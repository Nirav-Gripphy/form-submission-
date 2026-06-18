import React, { useState, useEffect, useCallback } from "react";

// ─── Upload styles (same as ArrivalInfo / DepartureInfo) ──────────────────────
const uploadStyles = `
  .etm-upload-container {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
    background-color: #f9f9f9;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
  }
  .etm-upload-container.dragging { border-color: #3490dc; background-color: rgba(52,144,220,0.06); }
  .etm-upload-container.has-error  { border-color: #e3342f; background-color: rgba(227,52,47,0.05); }
  .etm-upload-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 130px; }
  .etm-upload-icon { color: #aaa; margin-bottom: 10px; }
  .etm-upload-text { color: #666; font-size: 13px; margin-bottom: 4px; }
  .etm-upload-hint { color: #aaa; font-size: 11px; }
  .etm-file-input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
  .etm-file-input.hidden { display: none; }
  .etm-preview-img { max-width: 100%; max-height: 200px; display: block; margin: 0 auto; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
  .etm-pdf-preview { border: 1px solid #dee2e6; border-radius: 6px; padding: 16px; background: #fff; display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .etm-preview-actions { display: flex; justify-content: center; gap: 12px; margin-top: 10px; }
  .etm-change-btn, .etm-remove-btn { display: flex; align-items: center; gap: 4px; background: none; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; transition: all 0.2s; }
  .etm-change-btn { color: #3490dc; border: 1px solid #3490dc; }
  .etm-change-btn:hover { background: rgba(52,144,220,0.1); }
  .etm-remove-btn { color: #e3342f; border: 1px solid #e3342f; }
  .etm-remove-btn:hover { background: rgba(227,52,47,0.1); }
  .etm-file-info { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 6px 10px; margin-top: 6px; font-size: 11px; color: #6c757d; }
`;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
];

const TRAVEL_MODES = ["Train", "Flight", "Car"];

const TRAIN_LIST = [
  "अरावली एक्सप्रेस (14702)",
  "रणकपुर एक्सप्रेस (14708)",
  "भुज-बरेली एक्सप्रेस (14322)",
  "रणथंभौर एक्सप्रेस (12465)",
];

const ARRIVAL_DATES = [
  { value: "2026-07-31", label: "31 जुलाई 2026" },
  { value: "2026-08-01", label: "1 अगस्त 2026" },
];

const DEPARTURE_DATES = [
  { value: "2026-08-01", label: "1 अगस्त 2026" },
  { value: "2026-08-02", label: "2 अगस्त 2026" },
  { value: "2026-08-03", label: "3 अगस्त 2026" },
];

// ─── Ticket Upload Widget ─────────────────────────────────────────────────────
/**
 * Props:
 *  inputId        – unique id for <input type="file">
 *  ticketFile     – current File object (new, not yet uploaded)
 *  ticketPreview  – data-URL / existing URL / "pdf"
 *  ticketType     – MIME type string
 *  isDragging     – bool
 *  error          – string | null
 *  disabled       – bool
 *  onFileChange   – (file) => void
 *  onRemove       – () => void
 *  onDragStart    – () => void
 *  onDragEnd      – () => void
 */
const TicketUpload = React.memo(
  ({
    inputId,
    ticketFile,
    ticketPreview,
    ticketType,
    isDragging,
    error,
    disabled,
    onFileChange,
    onRemove,
    onDragStart,
    onDragEnd,
  }) => (
    <div
      className={[
        "etm-upload-container",
        isDragging ? "dragging" : "",
        error ? "has-error" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        pointerEvents: disabled ? "none" : "auto",
        opacity: disabled ? 0.7 : 1,
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDragStart();
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDragEnd();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDragEnd();
        if (e.dataTransfer.files?.[0]) onFileChange(e.dataTransfer.files[0]);
      }}
    >
      {!ticketPreview ? (
        <div className="etm-upload-placeholder">
          <div className="etm-upload-icon">
            <i className="bi bi-cloud-upload fs-2"></i>
          </div>
          <p className="etm-upload-text">Click or drag to upload ticket</p>
          <p className="etm-upload-hint">JPG, PNG or PDF</p>
          <input
            type="file"
            className="etm-file-input"
            id={inputId}
            accept="image/jpeg,image/jpg,image/png,application/pdf,.pdf"
            onChange={(e) => onFileChange(e.target.files?.[0])}
            disabled={disabled}
          />
        </div>
      ) : (
        <div>
          {ticketType === "application/pdf" ? (
            <div className="etm-pdf-preview">
              <i className="bi bi-file-earmark-pdf fs-2 text-danger"></i>
              <div className="fw-medium small">PDF Ticket</div>
              {ticketFile && (
                <div className="etm-file-info">{ticketFile.name}</div>
              )}
            </div>
          ) : (
            <img src={ticketPreview} alt="Ticket" className="etm-preview-img" />
          )}
          {ticketFile && ticketType !== "application/pdf" && (
            <div className="etm-file-info">{ticketFile.name}</div>
          )}
          <div className="etm-preview-actions">
            <button
              type="button"
              className="etm-change-btn"
              onClick={() => document.getElementById(inputId)?.click()}
              disabled={disabled}
            >
              <i className="bi bi-pencil-square" style={{ width: 14 }} />
              Change
            </button>
            <button
              type="button"
              className="etm-remove-btn"
              onClick={onRemove}
              disabled={disabled}
            >
              <i className="bi bi-trash" style={{ width: 14 }} />
              Remove
            </button>
          </div>
          <input
            type="file"
            className="etm-file-input hidden"
            id={inputId}
            accept="image/jpeg,image/jpg,image/png,application/pdf,.pdf"
            onChange={(e) => onFileChange(e.target.files?.[0])}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  ),
);
TicketUpload.displayName = "TicketUpload";

// ─── useTicketState helper hook ───────────────────────────────────────────────
function useTicketState(existingURL = "") {
  const isPdf = existingURL.toLowerCase().includes(".pdf");
  const initialType = existingURL
    ? isPdf
      ? "application/pdf"
      : "image/url"
    : "";
  const initialPreview = existingURL ? (isPdf ? "pdf" : existingURL) : null;

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initialPreview);
  const [type, setType] = useState(initialType);
  const [isDragging, setIsDragging] = useState(false);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [fileError, setFileError] = useState(null);

  // Reset when existingURL changes (e.g. modal opened for a different registration)
  useEffect(() => {
    const isPdf2 = existingURL.toLowerCase().includes(".pdf");
    setFile(null);
    setPreview(existingURL ? (isPdf2 ? "pdf" : existingURL) : null);
    setType(existingURL ? (isPdf2 ? "application/pdf" : "image/url") : "");
    setIsDragging(false);
    setRemoveExisting(false);
    setFileError(null);
  }, [existingURL]);

  const processFile = useCallback((f) => {
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      setFileError("Only JPG, PNG or PDF files are allowed");
      setFile(null);
      setPreview(null);
      setType("");
      return;
    }
    setFile(f);
    setType(f.type);
    setRemoveExisting(false);
    setFileError(null);
    if (f.type === "application/pdf") {
      setPreview("pdf");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.onerror = () =>
      setFileError("Could not read file. Please try again.");
    reader.readAsDataURL(f);
  }, []);

  const remove = useCallback(() => {
    setFile(null);
    setPreview(null);
    setType("");
    setRemoveExisting(true);
    setFileError(null);
  }, []);

  return {
    file,
    preview,
    type,
    isDragging,
    setIsDragging,
    removeExisting,
    fileError,
    setFileError,
    processFile,
    remove,
  };
}

// ─── EditTravelModal ──────────────────────────────────────────────────────────
/**
 * Drop-in replacement for the existing EditTravelModal in RegistrationList.
 *
 * New onSave signature:
 *   onSave({
 *     arrivalTravelMode, arrivalTrainName, arrivalDate,
 *     arrivalTrainNameOther,
 *     departureTravelMode, departureTrainName, departureDate,
 *     departureTrainNameOther,
 *     // ticket files (File | null)
 *     arrivalTicketFile, removeArrivalTicket,
 *     departureTicketFile, removeDepartureTicket,
 *   })
 *
 * The CALLER (RegistrationList) is responsible for uploading files to Storage
 * exactly as it does in nextStep() — this modal just surfaces the files.
 */
const EditTravelModal = React.memo(
  ({ registration, onSave, onCancel, isSaving }) => {
    /* ── form state ── */
    const [form, setForm] = useState({
      arrivalTravelMode: "",
      arrivalTrainName: "",
      arrivalTrainNameOther: "",
      arrivalDate: "",
      departureTravelMode: "",
      departureTrainName: "",
      departureTrainNameOther: "",
      departureDate: "",
    });
    const [errors, setErrors] = useState({});

    /* ── ticket state via hook ── */
    const arrivalTicket = useTicketState(registration?.arrivalTicketURL ?? "");
    const departureTicket = useTicketState(
      registration?.departureTicketURL ?? "",
    );

    /* ── sync form on open ── */
    useEffect(() => {
      if (!registration) return;
      const hasOtherArrival = registration.arrivalTrainNameOther?.trim();
      const hasOtherDeparture = registration.departureTrainNameOther?.trim();
      setForm({
        arrivalTravelMode: registration.arrivalTravelMode ?? "",
        arrivalTrainName: hasOtherArrival
          ? "__other__"
          : (registration.arrivalTrainName ?? ""),
        arrivalTrainNameOther: registration.arrivalTrainNameOther ?? "",
        arrivalDate: registration.arrivalDate ?? "",
        departureTravelMode: registration.departureTravelMode ?? "",
        departureTrainName: hasOtherDeparture
          ? "__other__"
          : (registration.departureTrainName ?? ""),
        departureTrainNameOther: registration.departureTrainNameOther ?? "",
        departureDate: registration.departureDate ?? "",
      });
      setErrors({});
    }, [registration]);

    const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

    const setArrivalMode = (val) =>
      setForm((p) => ({
        ...p,
        arrivalTravelMode: val,
        arrivalTrainName: "",
        arrivalTrainNameOther: "",
      }));

    const setDepartureMode = (val) =>
      setForm((p) => ({
        ...p,
        departureTravelMode: val,
        departureTrainName: "",
        departureTrainNameOther: "",
      }));

    /* ── validation ── */
    const validate = () => {
      const e = {};
      if (!form.arrivalTravelMode) e.arrivalTravelMode = "Required";
      if (!form.arrivalDate) e.arrivalDate = "Required";
      if (form.arrivalTravelMode === "Train" && !form.arrivalTrainName)
        e.arrivalTrainName = "Select a train";
      if (
        form.arrivalTravelMode === "Train" &&
        form.arrivalTrainName === "__other__" &&
        !form.arrivalTrainNameOther.trim()
      )
        e.arrivalTrainName = "Enter train name";

      // const arrivalNeedsTicket = form.arrivalTravelMode === "Train" || form.arrivalTravelMode === "Flight";
      // if (arrivalNeedsTicket && !arrivalTicket.file && !arrivalTicket.preview)
      //   e.arrivalTicket = "Ticket is required";

      if (!form.departureTravelMode) e.departureTravelMode = "Required";
      if (!form.departureDate) e.departureDate = "Required";
      if (form.departureTravelMode === "Train" && !form.departureTrainName)
        e.departureTrainName = "Select a train";
      if (
        form.departureTravelMode === "Train" &&
        form.departureTrainName === "__other__" &&
        !form.departureTrainNameOther.trim()
      )
        e.departureTrainName = "Enter train name";

      // const departureNeedsTicket = form.departureTravelMode === "Train" || form.departureTravelMode === "Flight";
      // if (departureNeedsTicket && !departureTicket.file && !departureTicket.preview)
      //   e.departureTicket = "Ticket is required";

      setErrors(e);
      return Object.keys(e).length === 0;
    };

    const handleSubmit = () => {
      if (!validate()) return;
      const arrivalNeedsTicket =
        form.arrivalTravelMode === "Train" ||
        form.arrivalTravelMode === "Flight";
      const departureNeedsTicket =
        form.departureTravelMode === "Train" ||
        form.departureTravelMode === "Flight";
      onSave({
        arrivalTravelMode: form.arrivalTravelMode,
        arrivalTrainName:
          form.arrivalTravelMode === "Train"
            ? form.arrivalTrainName === "__other__"
              ? "Others / अन्य"
              : form.arrivalTrainName
            : "",
        arrivalTrainNameOther:
          form.arrivalTravelMode === "Train" &&
          form.arrivalTrainName === "__other__"
            ? form.arrivalTrainNameOther.trim()
            : "",
        arrivalDate: form.arrivalDate,
        departureTravelMode: form.departureTravelMode,
        departureTrainName:
          form.departureTravelMode === "Train"
            ? form.departureTrainName === "__other__"
              ? "Others / अन्य"
              : form.departureTrainName
            : "",
        departureTrainNameOther:
          form.departureTravelMode === "Train" &&
          form.departureTrainName === "__other__"
            ? form.departureTrainNameOther.trim()
            : "",
        departureDate: form.departureDate,
        // ticket payloads
        arrivalTicketFile: arrivalNeedsTicket ? arrivalTicket.file : null,
        removeArrivalTicket: arrivalNeedsTicket
          ? arrivalTicket.removeExisting
          : true,
        departureTicketFile: departureNeedsTicket ? departureTicket.file : null,
        removeDepartureTicket: departureNeedsTicket
          ? departureTicket.removeExisting
          : true,
      });
    };

    if (!registration) return null;

    const isArrivalTrain = form.arrivalTravelMode === "Train";
    const isDepartureTrain = form.departureTravelMode === "Train";
    const arrivalNeedsTicket =
      form.arrivalTravelMode === "Train" || form.arrivalTravelMode === "Flight";
    const departureNeedsTicket =
      form.departureTravelMode === "Train" ||
      form.departureTravelMode === "Flight";

    /* ── layout helpers ── */
    const modeIcons = {
      Train: "bi-train-front",
      Flight: "bi-airplane",
      Car: "bi-car-front",
    };

    const backdropStyle = {
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.52)",
      zIndex: 1055,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    };

    const panelStyle = {
      background: "#fff",
      borderRadius: 16,
      width: "min(680px,100%)",
      maxHeight: "92vh",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      overflow: "hidden",
    };

    const sectionHead = {
      fontSize: "0.68rem",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#6c757d",
      marginBottom: "0.75rem",
    };

    return (
      <div style={backdropStyle} role="dialog" aria-modal="true">
        <style>{uploadStyles}</style>
        <div style={panelStyle}>
          {/* ── Header ── */}
          <div
            className="d-flex align-items-center px-4 py-3 border-bottom"
            style={{ flexShrink: 0 }}
          >
            <div
              className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3 flex-shrink-0"
              style={{ width: 42, height: 42 }}
            >
              <i className="bi bi-train-front-fill text-primary fs-5"></i>
            </div>
            <div className="flex-grow-1 min-width-0">
              <h6 className="mb-0 fw-semibold">Edit Travel Details</h6>
              <small className="text-muted text-truncate d-block">
                {registration.name}
              </small>
            </div>
            <button
              className="btn-close ms-3"
              onClick={onCancel}
              disabled={isSaving}
              aria-label="Close"
            />
          </div>

          {/* ── Scrollable body ── */}
          <div className="px-4 py-3 overflow-auto flex-grow-1">
            {/* ════════ ARRIVAL ════════ */}
            <div
              className="rounded-3 p-3 mb-4"
              style={{ background: "#f0f7ff", border: "1px solid #c8deff" }}
            >
              <p style={sectionHead}>
                <i className="bi bi-box-arrow-in-right me-1"></i>Arrival
              </p>

              {/* Travel mode */}
              <div className="mb-3">
                <label className="form-label small fw-medium mb-1">
                  Travel Mode <span className="text-danger">*</span>
                </label>
                <div className="d-flex gap-2 flex-wrap">
                  {TRAVEL_MODES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`btn btn-sm d-flex align-items-center gap-1 ${form.arrivalTravelMode === m ? "btn-primary" : "btn-outline-secondary"}`}
                      style={{ minWidth: 90 }}
                      onClick={() => setArrivalMode(m)}
                    >
                      <i className={`bi ${modeIcons[m]}`}></i>
                      {m}
                    </button>
                  ))}
                </div>
                {errors.arrivalTravelMode && (
                  <div className="text-danger small mt-1">
                    {errors.arrivalTravelMode}
                  </div>
                )}
              </div>

              {/* Train name */}
              {isArrivalTrain && (
                <div className="mb-3">
                  <label className="form-label small fw-medium mb-1">
                    Train Name <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select form-select-sm ${errors.arrivalTrainName ? "is-invalid" : ""}`}
                    value={form.arrivalTrainName}
                    onChange={(e) => set("arrivalTrainName", e.target.value)}
                  >
                    <option value="">-- Select Train --</option>
                    {TRAIN_LIST.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="__other__">Others / अन्य</option>
                  </select>
                  {form.arrivalTrainName === "__other__" && (
                    <input
                      type="text"
                      className={`form-control form-control-sm mt-2 ${errors.arrivalTrainName ? "is-invalid" : ""}`}
                      placeholder="Enter train name"
                      value={form.arrivalTrainNameOther}
                      onChange={(e) =>
                        set("arrivalTrainNameOther", e.target.value)
                      }
                    />
                  )}
                  {errors.arrivalTrainName && (
                    <div className="invalid-feedback">
                      {errors.arrivalTrainName}
                    </div>
                  )}
                </div>
              )}

              {/* Arrival date */}
              <div className="mb-3">
                <label className="form-label small fw-medium mb-1">
                  Arrival Date <span className="text-danger">*</span>
                </label>
                <div className="d-flex gap-2 flex-wrap">
                  {ARRIVAL_DATES.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      className={`btn btn-sm d-flex align-items-center gap-1 ${form.arrivalDate === d.value ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => set("arrivalDate", d.value)}
                    >
                      <i className="bi bi-calendar2-event"></i>
                      {d.label}
                    </button>
                  ))}
                </div>
                {errors.arrivalDate && (
                  <div className="text-danger small mt-1">
                    {errors.arrivalDate}
                  </div>
                )}
              </div>

              {/* Arrival ticket upload */}
              {arrivalNeedsTicket && (
                <div className="mb-1">
                  <label className="form-label small fw-medium mb-1">
                    Arrival Ticket <span className="text-danger">*</span>
                    <span className="text-muted fw-normal ms-1">
                      (Image / PDF)
                    </span>
                  </label>
                  <TicketUpload
                    inputId="etm-arrival-ticket"
                    ticketFile={arrivalTicket.file}
                    ticketPreview={arrivalTicket.preview}
                    ticketType={arrivalTicket.type}
                    isDragging={arrivalTicket.isDragging}
                    error={errors.arrivalTicket || arrivalTicket.fileError}
                    disabled={isSaving}
                    onFileChange={arrivalTicket.processFile}
                    onRemove={arrivalTicket.remove}
                    onDragStart={() => arrivalTicket.setIsDragging(true)}
                    onDragEnd={() => arrivalTicket.setIsDragging(false)}
                  />
                  {(errors.arrivalTicket || arrivalTicket.fileError) && (
                    <div className="text-danger small mt-1">
                      {errors.arrivalTicket || arrivalTicket.fileError}
                    </div>
                  )}
                  {/* View existing ticket link */}
                  {!arrivalTicket.file &&
                    !arrivalTicket.removeExisting &&
                    registration.arrivalTicketURL && (
                      <div className="mt-1">
                        <a
                          href={registration.arrivalTicketURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="small text-primary text-decoration-none"
                        >
                          <i className="bi bi-eye me-1"></i>View current ticket
                        </a>
                        {registration.arrivalTicketFileName && (
                          <span className="text-muted small ms-2">
                            ({registration.arrivalTicketFileName})
                          </span>
                        )}
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* ════════ DEPARTURE ════════ */}
            <div
              className="rounded-3 p-3"
              style={{ background: "#fff8f0", border: "1px solid #ffd8a0" }}
            >
              <p style={sectionHead}>
                <i className="bi bi-box-arrow-right me-1"></i>Departure
              </p>

              {/* Travel mode */}
              <div className="mb-3">
                <label className="form-label small fw-medium mb-1">
                  Travel Mode <span className="text-danger">*</span>
                </label>
                <div className="d-flex gap-2 flex-wrap">
                  {TRAVEL_MODES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`btn btn-sm d-flex align-items-center gap-1 ${form.departureTravelMode === m ? "btn-warning" : "btn-outline-secondary"}`}
                      style={{ minWidth: 90 }}
                      onClick={() => setDepartureMode(m)}
                    >
                      <i className={`bi ${modeIcons[m]}`}></i>
                      {m}
                    </button>
                  ))}
                </div>
                {errors.departureTravelMode && (
                  <div className="text-danger small mt-1">
                    {errors.departureTravelMode}
                  </div>
                )}
              </div>

              {/* Train name */}
              {isDepartureTrain && (
                <div className="mb-3">
                  <label className="form-label small fw-medium mb-1">
                    Train Name <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select form-select-sm ${errors.departureTrainName ? "is-invalid" : ""}`}
                    value={form.departureTrainName}
                    onChange={(e) => set("departureTrainName", e.target.value)}
                  >
                    <option value="">-- Select Train --</option>
                    {TRAIN_LIST.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="__other__">Others / अन्य</option>
                  </select>
                  {form.departureTrainName === "__other__" && (
                    <input
                      type="text"
                      className={`form-control form-control-sm mt-2 ${errors.departureTrainName ? "is-invalid" : ""}`}
                      placeholder="Enter train name"
                      value={form.departureTrainNameOther}
                      onChange={(e) =>
                        set("departureTrainNameOther", e.target.value)
                      }
                    />
                  )}
                  {errors.departureTrainName && (
                    <div className="invalid-feedback">
                      {errors.departureTrainName}
                    </div>
                  )}
                </div>
              )}

              {/* Departure date */}
              <div className="mb-3">
                <label className="form-label small fw-medium mb-1">
                  Departure Date <span className="text-danger">*</span>
                </label>
                <div className="d-flex gap-2 flex-wrap">
                  {DEPARTURE_DATES.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      className={`btn btn-sm d-flex align-items-center gap-1 ${form.departureDate === d.value ? "btn-warning" : "btn-outline-secondary"}`}
                      onClick={() => set("departureDate", d.value)}
                    >
                      <i className="bi bi-calendar2-event"></i>
                      {d.label}
                    </button>
                  ))}
                </div>
                {errors.departureDate && (
                  <div className="text-danger small mt-1">
                    {errors.departureDate}
                  </div>
                )}
              </div>

              {/* Departure ticket upload */}
              {departureNeedsTicket && (
                <div className="mb-1">
                  <label className="form-label small fw-medium mb-1">
                    Departure Ticket <span className="text-danger">*</span>
                    <span className="text-muted fw-normal ms-1">
                      (Image / PDF)
                    </span>
                  </label>
                  <TicketUpload
                    inputId="etm-departure-ticket"
                    ticketFile={departureTicket.file}
                    ticketPreview={departureTicket.preview}
                    ticketType={departureTicket.type}
                    isDragging={departureTicket.isDragging}
                    error={errors.departureTicket || departureTicket.fileError}
                    disabled={isSaving}
                    onFileChange={departureTicket.processFile}
                    onRemove={departureTicket.remove}
                    onDragStart={() => departureTicket.setIsDragging(true)}
                    onDragEnd={() => departureTicket.setIsDragging(false)}
                  />
                  {(errors.departureTicket || departureTicket.fileError) && (
                    <div className="text-danger small mt-1">
                      {errors.departureTicket || departureTicket.fileError}
                    </div>
                  )}
                  {/* View existing ticket link */}
                  {!departureTicket.file &&
                    !departureTicket.removeExisting &&
                    registration.departureTicketURL && (
                      <div className="mt-1">
                        <a
                          href={registration.departureTicketURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="small text-primary text-decoration-none"
                        >
                          <i className="bi bi-eye me-1"></i>View current ticket
                        </a>
                        {registration.departureTicketFileName && (
                          <span className="text-muted small ms-2">
                            ({registration.departureTicketFileName})
                          </span>
                        )}
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* ── Footer ── */}
          <div
            className="px-4 py-3 border-top d-flex gap-2 justify-content-end"
            style={{ flexShrink: 0 }}
          >
            <button
              className="btn btn-outline-secondary"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                  />
                  Saving…
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle"></i>Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  },
);
EditTravelModal.displayName = "EditTravelModal";

export default EditTravelModal;
