import { useState } from "react";

// Payment Success View
export const PaymentSuccessView = ({
  receiptRef,
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
  // Calculate payment amount based on user data
  const calculateAmount = () => {
    let amount = userData.hasHusband ? 2 : 1;
    // You could add additional cost calculations here if needed
    return amount;
  };

  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);

  const handleReceiptPrint = () => {
    setIsPrintingReceipt(true); // Hide barcode sections

    // Small delay to ensure state update renders before printing
    setTimeout(() => {
      reactToPrintFn(); // Call the original print function

      // Reset state after printing
      setTimeout(() => {
        setIsPrintingReceipt(false);
      }, 100);
    }, 10);
  };

  return (
    <>
      <div className="">
        <div className="payment-success" ref={receiptRef}>
          <div className="receipt-header">
            <h2>बेटी तेरापंथ की</h2>
            <p>Payment Receipt</p>
          </div>
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h3>पंजीकरण सफल</h3>
          <p>आपका पंजीकरण सफलतापूर्वक हो गया है।</p>
          <div className="download-options" id="hideOnPrint">
            <button
              className="btn btn-primary download-btn primary-custom-btn"
              onClick={handleReceiptPrint}
            >
              <i className="fas fa-download"></i> रसीद डाउनलोड करें
            </button>
          </div>
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
              <span> आगमन यात्रा माध्यम:</span>
              <span>{userData.arrivalTravelMode}</span>
            </div>

            <div className="detail-item">
              <span> प्रस्थान यात्रा माध्यम:</span>
              <span>{userData.departureTravelMode}</span>
            </div>

            <div className="detail-item payment-details">
              <span>भुगतान राशि:</span>
              <span>₹{calculateAmount()}</span>
            </div>

            <div className="detail-item">
              <span>भुगतान आईडी:</span>
              <span>{paymentId}</span>
            </div>

            <div className="detail-item">
              <span>दिनांक:</span>
              <span>{new Date().toDateString()}</span>
            </div>
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
          {/* Primary Barcode Section */}
          <div className="barcode-section" id="hideOnPrint">
            <h4>प्रवेश पत्र : बेटी</h4>
            <div className="barcode-container" id="hideOnPrint">
              <svg ref={primaryBarcodeRef} className="barcode-svg"></svg>
            </div>
            <div className="barcode-info">
              <p>नाम: {userData.name}</p>
              <p>मोबाइल: {userData.phoneNumber}</p>
              <p>शहर: {userData.city}</p>
              <p>राज्य: {userData.state}</p>
              <p>राज्य: {userData.state}</p>
              <p>बारकोड: {primaryBarcodeData}</p>
              <p>`जीवनसाथी के साथ: {userData.hasHusband ? "हाँ" : "नहीं"}</p>
            </div>
            <button
              className="btn btn-outline-primary barcode-download-btn primary-custom-btn"
              onClick={reactToPrintPrimaryPassFn}
              id="hideOnPrint"
            >
              <i className="fas fa-qrcode"></i> प्रवेश पत्र डाउनलोड करें
            </button>

            <span
              style={{
                fontSize: "10px",
              }}
            >
              कृपया इसे सुरक्षित रखें, सम्मेलन के दौरान यह उपयोगी होगा।
            </span>
          </div>
          {/* Spouse Barcode Section - Only show if user has spouse */}
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
                // onClick={() =>
                //   downloadBarcode(spouseBarcodeRef, userData.spouseBarcodeId)
                // }
                onClick={reactToPrintSpousePassFn}
                id="hideOnPrint"
              >
                <i className="fas fa-qrcode"></i> प्रवेश पत्र डाउनलोड करें
              </button>
              <span
                style={{
                  fontSize: "10px",
                }}
              >
                कृपया इसे सुरक्षित रखें, सम्मेलन के दौरान यह उपयोगी होगा।
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
