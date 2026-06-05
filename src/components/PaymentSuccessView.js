import { useState } from "react";

export const PaymentSuccessView = ({
  receiptContentRef, // ← used for receipt PDF (content only, no buttons)
  userData,
  reactToPrintFn,
  primaryBarcodeRef,
  reactToPrintSpousePassFn,
  reactToPrintPrimaryPassFn,
  paymentId,
  primaryBarcodeData,
  spouseBarcodeRef,
  spouseBarcodeData,
  primaryBarcodeImageRef,
  spouseBarcodeImageRef,
  primaryBarcodePrintRef,
  spouseBarcodePrintRef,
}) => {
  const calculateAmount = () => (userData.hasHusband ? 1000 : 500);

  const formatTrainName = (trainName, trainNameOther) => {
    if (!trainName) return "";
    if (trainName === "Others / अन्य" && trainNameOther)
      return `${trainName} (${trainNameOther})`;
    return trainName;
  };

  return (
    <div className="payment-success">
      {/* ── Header & success icon — always visible, NOT in receipt PDF ── */}
      <div className="receipt-header">
        <h2>बेटी तेरापंथ की</h2>
      </div>
      <div className="success-icon">
        <i className="fas fa-check-circle"></i>
      </div>
      <h3>पंजीकरण सफल</h3>
      <p>आपका पंजीकरण सफलतापूर्वक हो गया है।</p>

      {/* ── Download receipt button — hidden in PDF via id="hideOnPrint" ── */}
      <div className="download-options" id="hideOnPrint">
        <button
          className="btn btn-primary download-btn primary-custom-btn"
          onClick={reactToPrintFn}
        >
          <i className="fas fa-download"></i> रसीद डाउनलोड करें
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          receiptContentRef wraps ONLY the printable content below.
          Buttons and barcode sections are OUTSIDE this ref.
      ───────────────────────────────────────────────────────────────── */}
      <div
        ref={receiptContentRef}
        data-pdf-target="true"
        style={{ background: "#fff", padding: "20px" }}
      >
        {/* Organisation name at top of receipt */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "16px",
            borderBottom: "2px solid #f0f0f0",
            paddingBottom: "12px",
          }}
        >
          <h2 style={{ margin: 0, color: "#3c3c3c" }}>बेटी तेरापंथ की</h2>
          <p style={{ margin: "4px 0 0", color: "#555" }}>पंजीकरण रसीद</p>
        </div>

        {/* Registration details */}
        <div className="registration-details">
          <div className="detail-item">
            <span>नाम:</span>
            <span>{userData.name}</span>
          </div>
          <div className="detail-item">
            <span>मोबाइल:</span>
            <span>{userData.phoneNumber}</span>
          </div>
          <div className="detail-item">
            <span>स्थान:</span>
            <span>
              {userData.city}, {userData.state}
            </span>
          </div>

          {userData.hasHusband && (
            <div className="detail-item">
              <span>जीवनसाथी:</span>
              <span>{userData.husbandName}</span>
            </div>
          )}

          <div className="detail-item">
            <span>आगमन:</span>
            <span>
              {new Date(userData?.arrivalDate)?.toDateString()} -{" "}
              {userData.arrivalTime}
            </span>
          </div>
          <div className="detail-item">
            <span>प्रस्थान:</span>
            <span>
              {new Date(userData?.departureDate)?.toDateString()} -{" "}
              {userData.departureTime}
            </span>
          </div>

          <div className="detail-item">
            <span>आगमन यात्रा माध्यम:</span>
            <span>{userData.arrivalTravelMode}</span>
          </div>
          {userData.arrivalTravelMode === "Train" &&
            userData.arrivalTrainName && (
              <div className="detail-item">
                <span>आगमन ट्रेन:</span>
                <span>
                  {formatTrainName(
                    userData.arrivalTrainName,
                    userData.arrivalTrainNameOther,
                  )}
                </span>
              </div>
            )}

          <div className="detail-item">
            <span>प्रस्थान यात्रा माध्यम:</span>
            <span>{userData.departureTravelMode}</span>
          </div>
          {userData.departureTravelMode === "Train" &&
            userData.departureTrainName && (
              <div className="detail-item">
                <span>प्रस्थान ट्रेन:</span>
                <span>
                  {formatTrainName(
                    userData.departureTrainName,
                    userData.departureTrainNameOther,
                  )}
                </span>
              </div>
            )}

          <div className="detail-item">
            <span>दिनांक:</span>
            <span>{new Date().toDateString()}</span>
          </div>

          {/* Barcode IDs in receipt */}
          {primaryBarcodeData && (
            <div className="detail-item">
              <span>प्रवेश पत्र (बेटी):</span>
              <span>{primaryBarcodeData}</span>
            </div>
          )}
          {userData.hasHusband && spouseBarcodeData && (
            <div className="detail-item">
              <span>प्रवेश पत्र (दामाद):</span>
              <span>{spouseBarcodeData}</span>
            </div>
          )}
        </div>

        <div className="additional-info">
          <p className="mb-0">
            कृपया इसे सुरक्षित रखें, सम्मेलन के रजिस्ट्रेशन दौरान यह उपयोगी
            होगा।
          </p>
        </div>
        <div className="footer-note">
          <p>धन्यवाद!</p>
        </div>
      </div>
      {/* ── End of receipt content ── */}

      {/* ── Primary (Beti) barcode section — outside receipt ref ── */}
      <div className="barcode-section" id="hideOnPrint">
        <h4>प्रवेश पत्र : बेटी</h4>
        <div className="barcode-container">
          <svg ref={primaryBarcodeRef} className="barcode-svg"></svg>
        </div>
        <div className="barcode-info">
          <p>नाम: {userData.name}</p>
          <p>मोबाइल: {userData.phoneNumber}</p>
          <p>शहर: {userData.city}</p>
          <p>राज्य: {userData.state}</p>
          <p>बारकोड: {primaryBarcodeData}</p>
          <p>जीवनसाथी के साथ: {userData.hasHusband ? "हाँ" : "नहीं"}</p>
        </div>
        <button
          className="btn btn-outline-primary barcode-download-btn primary-custom-btn"
          onClick={reactToPrintPrimaryPassFn}
        >
          <i className="fas fa-qrcode"></i> प्रवेश पत्र डाउनलोड करें
        </button>
        <span style={{ fontSize: "10px", display: "block", marginTop: "8px" }}>
          कृपया इसे सुरक्षित रखें, सम्मेलन के दौरान यह उपयोगी होगा।
        </span>
      </div>

      {/* ── Spouse (Damaad) barcode section ── */}
      {userData.hasHusband && (
        <div
          className="barcode-section spouse-barcode-section"
          id="hideOnPrint"
        >
          <h4>प्रवेश पत्र : दामाद</h4>
          <div className="barcode-container">
            <svg ref={spouseBarcodeRef} className="barcode-svg"></svg>
          </div>
          <div className="barcode-info">
            <p>नाम: {userData.husbandName}</p>
            <p>मोबाइल: {userData.phoneNumber}</p>
            <p>शहर: {userData.city}</p>
            <p>राज्य: {userData.state}</p>
            <p>बारकोड: {spouseBarcodeData}</p>
          </div>
          <button
            className="btn btn-outline-primary barcode-download-btn primary-custom-btn"
            onClick={reactToPrintSpousePassFn}
          >
            <i className="fas fa-qrcode"></i> प्रवेश पत्र डाउनलोड करें
          </button>
          <span
            style={{ fontSize: "10px", display: "block", marginTop: "8px" }}
          >
            कृपया इसे सुरक्षित रखें, सम्मेलन के दौरान यह उपयोगी होगा।
          </span>
        </div>
      )}
    </div>
  );
};
