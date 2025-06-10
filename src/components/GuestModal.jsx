import React from "react";

const GuestModal = ({ selectedRegistration }) => {
  return (
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
                {selectedRegistration.additionalPeople.map((person, index) => (
                  <div key={person.id || index} className="col-12">
                    <div className="card">
                      <div className="card-body py-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="card-title mb-1">{person.name}</h6>
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
                ))}
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
  );
};

export default GuestModal;
