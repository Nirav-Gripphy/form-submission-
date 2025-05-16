import React, { useState } from "react";
import "../styles/PhoneInput.css";

const PhoneInput = ({
  phoneNumber,
  updateUserData,
  checkUserExists,
  loading,
  error,
}) => {
  const [localPhone, setLocalPhone] = useState(phoneNumber || "");
  const [inputError, setInputError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!localPhone || localPhone.length !== 10) {
      setInputError("Please enter valid mobile number.");
      return;
    }

    // Check if user exists in Firebase
    checkUserExists(localPhone);
  };

  return (
    <div className="phone-input-container">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="tel"
            className="form-control phone-input"
            placeholder="Enter Phone Number"
            value={localPhone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setLocalPhone(value);
              setInputError("");
            }}
            maxLength={10}
          />
          {inputError && <div className="error-message">{inputError}</div>}
          {error && <div className="error-message">{error}</div>}
        </div>

        <button
          type="submit"
          className="btn btn-primary check-registration-btn out"
          disabled={loading}
        >
          {loading ? (
            <span>
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
              <span className="ms-2">Loading</span>
            </span>
          ) : (
            "Next"
          )}
        </button>
      </form>
    </div>
  );
};

export default PhoneInput;
