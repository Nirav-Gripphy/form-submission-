import React from "react";

export const NoRegistation = ({ userData }) => {
  return (
    <div className="personal-info-container mt-3">
      <div className="">
        <p>
          आपका यह नंबर ({userData.phoneNumber}) बेटी तेरापंथ की आयाम के मुख्य
          डेटाबेस में रजिस्टर्ड नहीं है। कृपया पहले उसमें रजिस्ट्रेशन करें।
        </p>
        <div className="text-center mt-5">
          <a
            className="btn btn-primary primary-custom-btn m-auto"
            // target="_blank"
            href={process.env.REACT_APP_GOOGLE_FORM}
          >
            Registster Now / रजिस्ट्रेशन करें
          </a>
        </div>
      </div>
    </div>
  );
};
