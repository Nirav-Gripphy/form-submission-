// components/PersonalInfo.js - Personal information form
import React, { useState } from "react";
// import "../styles/PersonalInfo.css";

const PersonalInfo = ({
  userData,
  updateUserData,
  handleFileUpload,
  nextStep,
  prevStep,
}) => {
  const [localData, setLocalData] = useState({
    name: userData.name || "",
    city: userData.city || "",
    state: userData.state || "",
    hasHusband: userData.hasHusband || false,
    husbandName: userData.husbandName || "",
    photoFile: null,
  });

  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!localData.name.trim()) newErrors.name = "नाम आवश्यक है";
    if (!localData.city.trim()) newErrors.city = "शहर आवश्यक है";
    if (!localData.state.trim()) newErrors.state = "राज्य आवश्यक है";
    if (localData.hasHusband && !localData.husbandName.trim()) {
      newErrors.husbandName = "जीवनसाथी का नाम आवश्यक है";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setLocalData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setLocalData((prev) => ({
        ...prev,
        photoFile: e.target.files[0],
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setUploading(true);

    try {
      // Process photo upload if there's a file
      let photoURL = userData.photoURL;

      if (localData.photoFile) {
        photoURL = await handleFileUpload(localData.photoFile);
      }

      // Update the user data
      updateUserData({
        name: localData.name,
        city: localData.city,
        state: localData.state,
        photoURL,
        hasHusband: localData.hasHusband,
        husbandName: localData.hasHusband ? localData.husbandName : "",
      });

      nextStep();
    } catch (error) {
      console.error("Error updating personal info:", error);
      setErrors((prev) => ({
        ...prev,
        general: "अपलोड करते समय त्रुटि हुई। कृपया पुनः प्रयास करें।",
      }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="personal-info-container">
      <h3 className="form-section-title">Personal Info</h3>

      <form onSubmit={handleSubmit}>
        {errors.general && (
          <div className="alert alert-danger">{errors.general}</div>
        )}

        <div className="form-group">
          <label htmlFor="name">Name/नाम</label>
          <input
            type="text"
            className={`form-control ${errors.name ? "is-invalid" : ""}`}
            id="name"
            name="name"
            value={localData.name}
            onChange={handleInputChange}
            placeholder="अपना नाम दर्ज करें"
          />
          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="city">City/शहर</label>
          <input
            type="text"
            className={`form-control ${errors.city ? "is-invalid" : ""}`}
            id="city"
            name="city"
            value={localData.city}
            onChange={handleInputChange}
            placeholder="अपना शहर दर्ज करें"
          />
          {errors.city && <div className="invalid-feedback">{errors.city}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="state">State/राज्य</label>
          <input
            type="text"
            className={`form-control ${errors.state ? "is-invalid" : ""}`}
            id="state"
            name="state"
            value={localData.state}
            onChange={handleInputChange}
            placeholder="अपना राज्य दर्ज करें"
          />
          {errors.state && (
            <div className="invalid-feedback">{errors.state}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="photo">फोटो</label>
          <input
            type="file"
            className="form-control"
            id="photo"
            accept="image/*"
            onChange={handleFileChange}
          />
          {userData.photoURL && (
            <div className="mt-2">
              <img
                src={userData.photoURL}
                alt="Profile"
                className="profile-preview"
                width="100"
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="hasHusband"
              name="hasHusband"
              checked={localData.hasHusband}
              onChange={handleInputChange}
            />
            <label className="form-check-label" htmlFor="hasHusband">
              ⁠Would your husband coming along with you (क्या जीवनसाथी साथ
              आएंगे)
            </label>
          </div>
        </div>

        {localData.hasHusband && (
          <div className="form-group">
            <label htmlFor="husbandName">Husband Name/जीवनसाथी का नाम</label>
            <input
              type="text"
              className={`form-control ${
                errors.husbandName ? "is-invalid" : ""
              }`}
              id="husbandName"
              name="husbandName"
              value={localData.husbandName}
              onChange={handleInputChange}
              placeholder="जीवनसाथी का नाम दर्ज करें"
            />
            {errors.husbandName && (
              <div className="invalid-feedback">{errors.husbandName}</div>
            )}
          </div>
        )}

        <div className="form-buttons">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={prevStep}
          >
            Previous
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={uploading}
          >
            {uploading ? (
              <span>
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
                <span className="ms-2">Loading...</span>
              </span>
            ) : (
              "Next"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonalInfo;
