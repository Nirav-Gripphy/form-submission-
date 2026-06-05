// components/SpousePassCard.js
import React, { useEffect } from "react";
import JsBarcode from "jsbarcode";

const SpousePassCard = ({ userData, barcodeValue, cardRef }) => {
  const canvasRef = React.useRef(null);

  useEffect(() => {
    if (canvasRef.current && barcodeValue) {
      try {
        JsBarcode(canvasRef.current, barcodeValue, {
          format: "CODE128",
          lineColor: "#000000",
          background: "#ffffff",
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 16,
          margin: 8,
        });
      } catch (e) {
        console.error("SpousePassCard barcode error:", e);
      }
    }
  }, [barcodeValue]);

  return (
    <div
      className="entry-card"
      ref={cardRef}
      data-pdf-target="true"
      style={{ display: "none" }}
    >
      <div className="entry-card-inner">
        <div className="entry-card-header">
          <img
            style={{ width: "60%" }}
            src={`${window.location.origin}/beti-terapanth-ki-logo.png`}
            crossOrigin="anonymous"
            alt="Logo"
            className="logo"
          />
        </div>
        <div className="entry-card-heading">प्रवेश पत्र</div>
        <div className="entry-card-details">
          नाम : {userData?.husbandName}
          <br />
          मोबाइल : {userData?.phoneNumber}
          <br />
          शहर : {userData?.city}, {userData?.state}
        </div>
        {/* canvas instead of svg — html2canvas captures canvas natively */}
        <div className="barcode-container">
          <canvas ref={canvasRef} style={{ maxWidth: "90%", height: "auto" }} />
        </div>
      </div>
    </div>
  );
};

export default SpousePassCard;
