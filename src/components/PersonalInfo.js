import React, { useState, useEffect } from "react";

const PersonalInfo = ({ userData, updateUserData, nextStep }) => {
  const [localData, setLocalData] = useState({
    name: "",
    city: "",
    state: "",
    hasHusband: false,
    husbandName: "",
  });

  useEffect(() => {
    setLocalData({
      name: userData.name || "",
      city: userData.city || "",
      state: userData.state || "",
      hasHusband: userData.hasHusband || false,
      husbandName: userData.husbandName || "",
    });
  }, [userData]);

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!localData.name.trim()) newErrors.name = "नाम आवश्यक है";
    if (!localData.city.trim()) newErrors.city = "शहर आवश्यक है";
    if (!localData.state.trim()) newErrors.state = "राज्य आवश्यक है";

    // If hasHusband is true, check husband name and photo
    if (localData.hasHusband) {
      if (!localData.husbandName.trim()) {
        newErrors.husbandName = "जीवनसाथी का नाम आवश्यक है";
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      updateUserData({
        name: localData.name,
        city: localData.city,
        state: localData.state,
        hasHusband: localData.hasHusband,
        husbandName: localData.hasHusband
          ? localData.husbandName || userData.husbandName
          : userData.husbandName || "",
      });

      nextStep();
    } catch (error) {
      console.error("Error updating personal info:", error);
      setErrors((prev) => ({
        ...prev,
        general: "डेटा सेव करते समय त्रुटि हुई। कृपया पुनः प्रयास करें।",
      }));
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
          <label htmlFor="name" className="isRequired">
            Name/नाम
          </label>
          <input
            type="text"
            className={`form-control ${errors.name ? "is-invalid" : ""}`}
            id="name"
            name="name"
            value={localData.name}
            onChange={handleInputChange}
            readOnly
            placeholder="अपना नाम दर्ज करें"
          />
          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="city" className="isRequired">
            City/शहर
          </label>
          <input
            type="text"
            className={`form-control ${errors.city ? "is-invalid" : ""}`}
            id="city"
            name="city"
            value={localData.city}
            readOnly
            onChange={handleInputChange}
            placeholder="अपना शहर दर्ज करें"
          />
          {errors.city && <div className="invalid-feedback">{errors.city}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="state" className="isRequired">
            State/राज्य
          </label>
          <input
            type="text"
            className={`form-control ${errors.state ? "is-invalid" : ""}`}
            id="state"
            name="state"
            value={localData.state}
            readOnly
            onChange={handleInputChange}
            placeholder="अपना राज्य दर्ज करें"
          />
          {errors.state && (
            <div className="invalid-feedback">{errors.state}</div>
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
            <label className="form-check-label " htmlFor="hasHusband">
              Would your husband coming along with you / क्या जीवनसाथी साथ आएंगे
            </label>
          </div>
        </div>

        {localData.hasHusband && (
          <>
            <div className="form-group">
              <label htmlFor="husbandName" className="isRequired">
                Husband Name/जीवनसाथी का नाम
              </label>
              <input
                type="text"
                className={`form-control ${
                  errors.husbandName ? "is-invalid" : ""
                }`}
                id="husbandName"
                readOnly
                name="husbandName"
                value={localData.husbandName}
                onChange={handleInputChange}
                placeholder="जीवनसाथी का नाम दर्ज करें"
              />
              {errors.husbandName && (
                <div className="invalid-feedback">{errors.husbandName}</div>
              )}
            </div>
          </>
        )}

        <div
          className="form-buttons"
          style={{
            justifyContent: "flex-end",
          }}
        >
          <button type="submit" className="btn btn-primary primary-custom-btn">
            Next / आगे जाएं
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonalInfo;
