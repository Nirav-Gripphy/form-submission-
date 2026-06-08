import React, { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "../services/firebase";
import { doc, updateDoc, Timestamp } from "firebase/firestore";

const RELATIONS = [
    "Mother in Law/सास",
    "Father in Law/ससुर",
    "Son/बेटा",
    "Daughter/बेटी",
];

const EditGuestsModal = ({ selectedRegistration, onSaveSuccess }) => {
    const [hasHusband, setHasHusband] = useState(false);
    const [husbandName, setHusbandName] = useState("");
    const [guests, setGuests] = useState([]);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // ── Track initial values to detect changes ────────────────────────────────
    const [initial, setInitial] = useState({ hasHusband: false, husbandName: "", guests: [] });

    useEffect(() => {
        if (!selectedRegistration) return;
        const initHasHusband = !!selectedRegistration.hasHusband;
        const initHusbandName = selectedRegistration.husbandName || "";
        const initGuests = (selectedRegistration.additionalPeople || []).map((g) => ({
            _key: String(g.id ?? Math.random()),
            id: g.id ?? Date.now(),
            name: g.name || "",
            relation: g.relation || "",
        }));

        setHasHusband(initHasHusband);
        setHusbandName(initHusbandName);
        setGuests(initGuests);
        setInitial({ hasHusband: initHasHusband, husbandName: initHusbandName, guests: initGuests });
        setErrors({});
        setSaveError(null);
        setSaveSuccess(false);
    }, [selectedRegistration]);

    // ── Dirty check — true only if something changed ──────────────────────────
    const isDirty = useMemo(() => {
        if (hasHusband !== initial.hasHusband) return true;
        if (husbandName.trim() !== initial.husbandName.trim()) return true;
        if (guests.length !== initial.guests.length) return true;
        return guests.some((g, i) => {
            const orig = initial.guests[i];
            return !orig || g.name.trim() !== orig.name.trim() || g.relation !== orig.relation;
        });
    }, [hasHusband, husbandName, guests, initial]);

    // ── Husband handlers ──────────────────────────────────────────────────────
    const toggleHusband = (checked) => {
        setHasHusband(checked);
        if (!checked) setHusbandName("");
        setErrors((p) => { const n = { ...p }; delete n.husbandName; return n; });
    };

    const handleHusbandName = (val) => {
        setHusbandName(val);
        setErrors((p) => { const n = { ...p }; delete n.husbandName; return n; });
    };

    // ── Guest handlers ────────────────────────────────────────────────────────
    const handleAddGuest = () => {
        const key = String(Date.now() + Math.random());
        setGuests((p) => [...p, { _key: key, id: Date.now(), name: "", relation: "" }]);
    };

    const handleGuestChange = useCallback((key, field, value) => {
        setGuests((p) => p.map((g) => g._key === key ? { ...g, [field]: value } : g));
        setErrors((p) => { const n = { ...p }; delete n[`${key}_${field}`]; return n; });
    }, []);

    const handleRemoveGuest = useCallback((key) => {
        setGuests((p) => p.filter((g) => g._key !== key));
        setErrors((p) => {
            const n = { ...p };
            Object.keys(n).forEach((k) => { if (k.startsWith(`${key}_`)) delete n[k]; });
            return n;
        });
    }, []);

    // ── Validation ────────────────────────────────────────────────────────────
    const validate = () => {
        const errs = {};
        if (hasHusband && !husbandName.trim()) errs.husbandName = "Husband name is required.";
        guests.forEach((g) => {
            if (!g.name.trim()) errs[`${g._key}_name`] = "Name is required.";
            if (!g.relation) errs[`${g._key}_relation`] = "Relation is required.";
        });
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ── Save to Firestore ─────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!selectedRegistration?.id) return;
        if (!validate()) return;
        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);
        try {
            await updateDoc(doc(db, "registration-2026", selectedRegistration.id), {
                hasHusband,
                husbandName: hasHusband ? husbandName.trim() : "",
                additionalPeople: guests.map(({ id, name, relation }) => ({
                    id,
                    name: name.trim(),
                    relation,
                })),
                updatedAt: Timestamp.now(),
            });
            setSaveSuccess(true);
            if (onSaveSuccess) onSaveSuccess();
            // Update initial to current so button hides again after save
            setInitial({ hasHusband, husbandName: husbandName.trim(), guests: [...guests] });

            const modalElement = document.getElementById("close_edit_guest_modal");
            if (modalElement) modalElement.click();
        } catch (err) {
            console.error(err);
            setSaveError("Failed to save changes. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="modal fade"
            id="editGuestsModal"
            tabIndex="-1"
            aria-labelledby="editGuestsModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-md modal-dialog-scrollable">
                <div className="modal-content">

                    {/* ── Header ── */}
                    <div className="modal-header">
                        <div>
                            <h5 className="modal-title fw-semibold" id="editGuestsModalLabel">
                                <i className="bi bi-pencil-square text-primary me-2"></i>
                                Edit Guests & Husband
                            </h5>
                            {selectedRegistration && (
                                <small className="text-muted">
                                    {selectedRegistration.name} — {selectedRegistration.primaryBarcodeId}
                                </small>
                            )}
                        </div>
                        <button
                            type="button"
                            id="close_edit_guest_modal"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close modal"
                        />
                    </div>

                    {/* ── Body ── */}
                    <div className="modal-body">

                        {saveSuccess && (
                            <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-3">
                                <i className="bi bi-check-circle-fill"></i>
                                Changes saved successfully!
                            </div>
                        )}
                        {saveError && (
                            <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3">
                                <i className="bi bi-exclamation-triangle-fill"></i>
                                {saveError}
                            </div>
                        )}

                        {/* ── Husband ── */}
                        <p className="text-muted small fw-semibold text-uppercase mb-3" style={{ letterSpacing: "0.06em" }}>
                            <i className="bi bi-person-hearts text-primary me-1"></i> Husband
                        </p>

                        <div className="form-check form-switch mb-3">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="hasHusbandToggle"
                                checked={hasHusband}
                                onChange={(e) => toggleHusband(e.target.checked)}
                            />
                            <label className="form-check-label fw-medium" htmlFor="hasHusbandToggle">
                                {hasHusband ? "Husband registered" : "No husband registered"}
                            </label>
                        </div>

                        {hasHusband && (
                            <div className="mb-3">
                                <label className="form-label small fw-medium">
                                    Husband Name <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.husbandName ? "is-invalid" : ""}`}
                                    placeholder="Enter husband's full name"
                                    value={husbandName}
                                    onChange={(e) => handleHusbandName(e.target.value)}
                                />
                                {errors.husbandName && (
                                    <div className="invalid-feedback">{errors.husbandName}</div>
                                )}
                            </div>
                        )}

                        {!hasHusband && (
                            <div className="alert alert-warning py-2 small">
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                Disabling this will clear the husband's name from the record.
                            </div>
                        )}

                        <hr />

                        {/* ── Additional Guests ── */}
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <p className="text-muted small fw-semibold text-uppercase mb-0" style={{ letterSpacing: "0.06em" }}>
                                <i className="bi bi-people text-primary me-1"></i>
                                Additional Guests
                                {guests.length > 0 && (
                                    <span className="badge bg-primary ms-2">{guests.length}</span>
                                )}
                            </p>
                            <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={handleAddGuest}
                            >
                                <i className="bi bi-plus-lg me-1"></i>Add Guest
                            </button>
                        </div>

                        {guests.length === 0 ? (
                            <div className="text-center py-4">
                                <i className="bi bi-people display-6 text-muted" aria-hidden="true"></i>
                                <p className="text-muted mt-2 mb-2 small">No additional guests added.</p>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={handleAddGuest}
                                >
                                    <i className="bi bi-plus me-1"></i>Add First Guest
                                </button>
                            </div>
                        ) : (
                            <div className="row g-2">
                                {guests.map((guest, index) => (
                                    <div key={guest._key} className="col-12">
                                        <div className="card">
                                            <div className="card-body py-3">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <span className="small fw-semibold text-primary">
                                                        <i className="bi bi-person-fill me-1"></i>
                                                        Guest {index + 1}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger btn-sm"
                                                        onClick={() => handleRemoveGuest(guest._key)}
                                                    >
                                                        <i className="bi bi-trash3 me-1"></i>Remove
                                                    </button>
                                                </div>

                                                <div className="mb-2">
                                                    <label className="form-label small fw-medium mb-1">
                                                        Name / नाम <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className={`form-control form-control-sm ${errors[`${guest._key}_name`] ? "is-invalid" : ""}`}
                                                        placeholder="अतिथि का नाम"
                                                        value={guest.name}
                                                        onChange={(e) => handleGuestChange(guest._key, "name", e.target.value)}
                                                    />
                                                    {errors[`${guest._key}_name`] && (
                                                        <div className="invalid-feedback">{errors[`${guest._key}_name`]}</div>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="form-label small fw-medium mb-1">
                                                        Relation / संबंध <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        className={`form-select form-select-sm ${errors[`${guest._key}_relation`] ? "is-invalid" : ""}`}
                                                        value={guest.relation}
                                                        onChange={(e) => handleGuestChange(guest._key, "relation", e.target.value)}
                                                    >
                                                        <option value="">Select Relation / संबंध</option>
                                                        {RELATIONS.map((r) => (
                                                            <option key={r} value={r}>{r}</option>
                                                        ))}
                                                    </select>
                                                    {errors[`${guest._key}_relation`] && (
                                                        <div className="invalid-feedback">{errors[`${guest._key}_relation`]}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div className="col-12">
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary btn-sm w-100"
                                        onClick={handleAddGuest}
                                    >
                                        <i className="bi bi-plus-circle me-1"></i>Add Another Guest
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <div className="modal-footer">
                        <small className="text-muted me-auto">
                            Fields marked <span className="text-danger">*</span> are required.
                        </small>
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            data-bs-dismiss="modal"
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        {/* Save button — only visible when something has changed */}
                        {isDirty && (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Saving…
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-floppy2-fill me-2"></i>Save Changes
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EditGuestsModal;