// components/SpousePassCard.js
import React from "react";

const SpousePassCard = ({ userData, barcodeRef, cardRef }) => {
  return (
    <div className="entry-card d-none" ref={cardRef}>
      <div className="entry-card-inner">
        <div className="entry-card-header">
          <img
            style={{ width: "60%" }}
            src="./beti-terapanth-ki-logo.png"
            alt="Logo"
            className="logo"
          />
        </div>
        <div className="entry-card-heading">प्रवेश पत्र</div>
        <div className="entry-card-details">
          नाम : {userData.husbandName}
          <br />
          मोबाइल : {userData.phoneNumber}
          <br />
          शहर : {userData.city}
          <br />
          राज्य : {userData.state}
        </div>
        <div className="barcode-container">
          <svg id="barcode" ref={barcodeRef} className="barcode-svg"></svg>
        </div>
      </div>
    </div>
  );
};

export default SpousePassCard;
