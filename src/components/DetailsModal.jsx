import React, { useState } from "react";
import { formatDate, formatDateTime } from "../Utility/global";

const DetailsModal = ({ selectedRegistration }) => {
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

  return (
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
                      <i className="bi bi-geo-alt me-1" aria-hidden="true"></i>
                      Address:
                    </h6>
                    <address className="mb-0">
                      {selectedRegistration.city}, {selectedRegistration.state}
                    </address>
                  </div>

                  {/* Travel details */}
                  <div className="mb-4">
                    <h6 className="mb-2">
                      <i className="bi bi-calendar me-1" aria-hidden="true"></i>
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
  );
};

export default DetailsModal;
