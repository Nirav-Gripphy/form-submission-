const DownloadModal = ({ selectedRegistration }) => {
  const handleDownload = (type) => {
    // Add your download logic here based on the type
    console.log(`Downloading ${type} for registration:`, selectedRegistration);
    // You can implement actual download functionality here
  };

  return (
    <div
      className="modal fade"
      id="downloadModal"
      tabIndex="-1"
      aria-labelledby="downloadModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          {/* Modal Header */}
          <div className="modal-header bg-primary text-white border-0">
            <div className="d-flex align-items-center">
              <i className="bi bi-download me-2 fs-5"></i>
              <h5 className="modal-title fw-bold mb-0" id="downloadModalLabel">
                Download Documents
              </h5>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4">
            {/* Registration Info */}
            {selectedRegistration && (
              <div className="alert alert-light border mb-4">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-person-circle me-2 text-primary"></i>
                  <strong className="text-dark">Selected Registration</strong>
                </div>
                <div className="row g-2 small text-muted">
                  <div className="col-md-6">
                    <strong>ID:</strong> {selectedRegistration.id || "N/A"}
                  </div>
                  <div className="col-md-6">
                    <strong>Name:</strong> {selectedRegistration.name || "N/A"}
                  </div>
                </div>
              </div>
            )}

            {/* Download Options */}
            <div className="row g-3">
              {/* Download Receipt */}
              <div className="col-12">
                <div className="card border-0 bg-light h-100 hover-shadow transition-all">
                  <div className="card-body d-flex align-items-center p-3">
                    <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                      <i className="bi bi-receipt text-success fs-4"></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="card-title mb-1 fw-semibold">
                        Payment Receipt
                      </h6>
                      <p className="card-text text-muted small mb-0">
                        Download your payment receipt with transaction details
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-success btn-sm px-3"
                      onClick={() => handleDownload("receipt")}
                    >
                      <i className="bi bi-download me-1"></i>
                      Download
                    </button>
                  </div>
                </div>
              </div>

              {/* Download Pass */}
              <div className="col-12">
                <div className="card border-0 bg-light h-100 hover-shadow transition-all">
                  <div className="card-body d-flex align-items-center p-3">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                      <i className="bi bi-card-text text-primary fs-4"></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="card-title mb-1 fw-semibold">
                        Event Pass
                      </h6>
                      <p className="card-text text-muted small mb-0">
                        Download your main event pass with QR code
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm px-3"
                      onClick={() => handleDownload("pass")}
                    >
                      <i className="bi bi-download me-1"></i>
                      Download
                    </button>
                  </div>
                </div>
              </div>

              {/* Download Pass Husband */}
              <div className="col-12">
                <div className="card border-0 bg-light h-100 hover-shadow transition-all">
                  <div className="card-body d-flex align-items-center p-3">
                    <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                      <i className="bi bi-person-plus text-info fs-4"></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="card-title mb-1 fw-semibold">
                        Spouse Pass
                      </h6>
                      <p className="card-text text-muted small mb-0">
                        Download companion pass for spouse/partner
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-info btn-sm px-3"
                      onClick={() => handleDownload("pass-husband")}
                    >
                      <i className="bi bi-download me-1"></i>
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-4 p-3 bg-light rounded">
              <div className="d-flex align-items-start">
                <i className="bi bi-info-circle text-primary me-2 mt-1"></i>
                <div className="small text-muted">
                  <strong>Note:</strong> All documents are generated in PDF
                  format. Please ensure you have a PDF reader installed to view
                  the downloaded files.
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer border-0 bg-light">
            <button
              type="button"
              className="btn btn-light border"
              data-bs-dismiss="modal"
            >
              <i className="bi bi-x-circle me-1"></i>
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                handleDownload("receipt");
                handleDownload("pass");
                handleDownload("pass-husband");
              }}
            >
              <i className="bi bi-download me-1"></i>
              Download All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadModal;
