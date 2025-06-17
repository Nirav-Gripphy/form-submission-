import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

import JsBarcode from "jsbarcode"; // Import JsBarcode library
import UserPassCard from "./UserPassCard";
import SpousePassCard from "./SpousePassCard";
import { formatDateTime } from "../Utility/global";

const DownloadModal = ({ selectedRegistration }) => {
  const handleDownload = (type) => {
    // Add your download logic here based on the type
    // You can implement actual download functionality here
  };
  const [primaryBarcodeData, setPrimaryBarcodeData] = useState("");
  const [spouseBarcodeData, setSpouseBarcodeData] = useState("");
  const receiptRef = useRef(null);
  const primaryBarcodeImageRef = useRef(null);
  const spouseBarcodeImageRef = useRef(null);
  const primaryBarcodeRef = useRef(null);
  const spouseBarcodeRef = useRef(null);

  useEffect(() => {
    if (!selectedRegistration) {
      return;
    }
    // Set primary barcode data if available in userData
    if (selectedRegistration.primaryBarcodeId) {
      setPrimaryBarcodeData(selectedRegistration?.primaryBarcodeId);
    }

    // Set spouse barcode data if user has husband and barcode is available
    if (
      selectedRegistration.hasHusband &&
      selectedRegistration.spouseBarcodeId
    ) {
      setSpouseBarcodeData(selectedRegistration.spouseBarcodeId);
    }
  }, [selectedRegistration]);

  useEffect(() => {
    if (!selectedRegistration) {
      return;
    }
    // Generate primary barcode when barcodeData is available and component is mounted
    if (primaryBarcodeData && primaryBarcodeRef.current) {
      try {
        JsBarcode(primaryBarcodeRef.current, primaryBarcodeData, {
          format: "CODE128",
          lineColor: "#000",
          width: 1.5, // Reduced width
          height: 50, // Reduced height
          displayValue: true,
          fontSize: 12, // Smaller font size
          margin: 5, // Smaller margin
          background: "#fff",
        });
      } catch (error) {
        console.error("Error generating primary barcode:", error);
      }
    }

    // Generate spouse barcode when data is available and user has husband
    if (
      selectedRegistration.hasHusband &&
      spouseBarcodeData &&
      spouseBarcodeRef.current
    ) {
      try {
        JsBarcode(spouseBarcodeRef.current, spouseBarcodeData, {
          format: "CODE128",
          lineColor: "#000",
          width: 1.5,
          height: 50,
          displayValue: true,
          fontSize: 12,
          margin: 5,
          background: "#fff",
        });
      } catch (error) {
        console.error("Error generating spouse barcode:", error);
      }
    }
  }, [
    primaryBarcodeData,
    spouseBarcodeData,
    selectedRegistration,
    spouseBarcodeRef,
    primaryBarcodeRef,
  ]);

  const reactToPrintFn = useReactToPrint({
    contentRef: receiptRef,
  });

  const reactToPrintPrimaryPassFn = useReactToPrint({
    contentRef: primaryBarcodeImageRef,
  });
  const reactToPrintSpousePassFn = useReactToPrint({
    contentRef: spouseBarcodeImageRef,
  });

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
                <div className="row g-2 small text-muted">
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
                      <i className="bi bi-receipt text-white fs-4"></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="card-title mb-1 fw-semibold">
                        Payment Receipt
                      </h6>
                      <p className="card-text text-muted small mb-0">
                        Download your payment receipt with transaction details.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-success btn-sm px-3"
                      onClick={() => reactToPrintFn()}
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
                      <i className="bi bi-card-text text-white fs-4"></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="card-title mb-1 fw-semibold">
                        Event Pass
                      </h6>
                      <p className="card-text text-muted small mb-0">
                        Download your main companion pass with bar code.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm px-3"
                      onClick={() => reactToPrintPrimaryPassFn()}
                    >
                      <i className="bi bi-download me-1"></i>
                      Download
                    </button>
                  </div>
                </div>
              </div>

              {/* Download Pass Husband */}
              {selectedRegistration?.hasHusband && (
                <div className="col-12">
                  <div className="card border-0 bg-light h-100 hover-shadow transition-all">
                    <div className="card-body d-flex align-items-center p-3">
                      <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                        <i className="bi bi-person-plus text-white fs-4"></i>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="card-title mb-1 fw-semibold">
                          Husband Pass
                        </h6>
                        <p className="card-text text-muted small mb-0">
                          Download companion pass for husband with bar code.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-info btn-sm px-3"
                        onClick={() => reactToPrintSpousePassFn()}
                      >
                        <i className="bi bi-download me-1"></i>
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <UserPassCard
        userData={selectedRegistration}
        barcodeRef={primaryBarcodeRef}
        cardRef={primaryBarcodeImageRef}
      />

      {selectedRegistration?.hasHusband && (
        <SpousePassCard
          userData={selectedRegistration}
          barcodeRef={spouseBarcodeRef}
          cardRef={spouseBarcodeImageRef}
        />
      )}

      {selectedRegistration && (
        <ReciptComponent
          receiptRef={receiptRef}
          selectedRegistration={selectedRegistration}
        />
      )}
    </div>
  );
};

export default DownloadModal;

const ReciptComponent = ({ receiptRef, selectedRegistration }) => {
  return (
    <div className="payment-success d-none" ref={receiptRef}>
      <div className="receipt-header">
        <h2>बेटी तेरापंथ की</h2>
        <p>Payment Receipt</p>
      </div>
      <div className="success-icon">
        <i className="fas fa-check-circle"></i>
      </div>
      <h3>पंजीकरण सफल</h3>
      <p>आपका पंजीकरण सफलतापूर्वक हो गया है।</p>
      <div className="registration-details">
        <div className="detail-item">
          <span>नाम:</span>
          <span>{selectedRegistration?.name}</span>
        </div>

        <div className="detail-item">
          <span>मोबाइल:</span>
          <span>{selectedRegistration?.phoneNumber}</span>
        </div>

        <div className="detail-item">
          <span>स्थान:</span>
          <span>
            {selectedRegistration?.city}, {selectedRegistration?.state}
          </span>
        </div>

        {selectedRegistration?.hasHusband && (
          <div className="detail-item">
            <span>जीवनसाथी:</span>
            <span>{selectedRegistration?.husbandName}</span>
          </div>
        )}

        <div className="detail-item">
          <span>आगमन:</span>
          <span>
            {new Date(selectedRegistration?.arrivalDate)?.toDateString()} -{" "}
            {selectedRegistration?.arrivalTime}
          </span>
        </div>

        <div className="detail-item">
          <span>प्रस्थान:</span>
          <span>
            {new Date(selectedRegistration?.departureDate)?.toDateString()} -{" "}
            {selectedRegistration?.departureTime}
          </span>
        </div>

        <div className="detail-item">
          <span> आगमन यात्रा माध्यम:</span>
          <span>{selectedRegistration?.arrivalTravelMode}</span>
        </div>

        <div className="detail-item">
          <span> प्रस्थान यात्रा माध्यम:</span>
          <span>{selectedRegistration?.departureTravelMode}</span>
        </div>

        <div className="detail-item payment-details">
          <span>भुगतान राशि:</span>
          <span>₹ {selectedRegistration?.paymentAmount} </span>
        </div>

        <div className="detail-item">
          <span>भुगतान आईडी:</span>
          <span>{selectedRegistration?.paymentId}</span>
        </div>

        <div className="detail-item">
          <span>दिनांक:</span>
          <span>{formatDateTime(selectedRegistration?.updatedAt)}</span>
        </div>
      </div>
      <div className="additional-info">
        <p className="mb-0">
          कृपया इसे सुरक्षित रखें, सम्मेलन के रजिस्ट्रेशन दौरान यह उपयोगी होगा।
        </p>
      </div>
      <div className="footer-note">
        <p>धन्यवाद!</p>
      </div>
    </div>
  );
};
