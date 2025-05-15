// components/TravelingInfo.js - Travel information form
import React, { useState } from "react";
// import "../styles/TravelingInfo.css";

const TravelingInfo = ({ userData, updateUserData, nextStep, prevStep }) => {
  const [localData, setLocalData] = useState({
    arrivalDate: userData.arrivalDate || "",
    arrivalTime: userData.arrivalTime || "",
    travelMode: userData.travelMode || "train",
    departureDate: userData.departureDate || "",
    departureTime: userData.departureTime || "",
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!localData.arrivalDate) newErrors.arrivalDate = "आगमन तिथि आवश्यक है";
    if (!localData.arrivalTime) newErrors.arrivalTime = "आगमन समय आवश्यक है";
    if (!localData.departureDate)
      newErrors.departureDate = "प्रस्थान तिथि आवश्यक है";
    if (!localData.departureTime)
      newErrors.departureTime = "प्रस्थान समय आवश्यक है";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setLocalData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Update the user data
    updateUserData({
      arrivalDate: localData.arrivalDate,
      arrivalTime: localData.arrivalTime,
      travelMode: localData.travelMode,
      departureDate: localData.departureDate,
      departureTime: localData.departureTime,
    });

    nextStep();
  };

  return (
    <div className="traveling-info-container">
      <h3 className="form-section-title">Traveling Details</h3>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="arrivalDate"> ⁠Arrival Date/आगमन तिथि</label>
          <input
            type="date"
            className={`form-control ${errors.arrivalDate ? "is-invalid" : ""}`}
            id="arrivalDate"
            name="arrivalDate"
            value={localData.arrivalDate}
            onChange={handleInputChange}
          />
          {errors.arrivalDate && (
            <div className="invalid-feedback">{errors.arrivalDate}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="arrivalTime">Arrival Time/आगमन समय</label>
          <input
            type="time"
            className={`form-control ${errors.arrivalTime ? "is-invalid" : ""}`}
            id="arrivalTime"
            name="arrivalTime"
            value={localData.arrivalTime}
            onChange={handleInputChange}
          />
          {errors.arrivalTime && (
            <div className="invalid-feedback">{errors.arrivalTime}</div>
          )}
        </div>

        <div className="form-group">
          <label>Traveling Mode/यात्रा का माध्यम</label>
          <div className="travel-mode-options">
            <div className="form-check form-check-inline">
              <input
                type="radio"
                className="form-check-input"
                id="flightMode"
                name="travelMode"
                value="flight"
                checked={localData.travelMode === "flight"}
                onChange={handleInputChange}
              />
              <label className="form-check-label" htmlFor="flightMode">
                Flight/विमान
              </label>
            </div>

            <div className="form-check form-check-inline">
              <input
                type="radio"
                className="form-check-input"
                id="trainMode"
                name="travelMode"
                value="train"
                checked={localData.travelMode === "train"}
                onChange={handleInputChange}
              />
              <label className="form-check-label" htmlFor="trainMode">
                Train/रेल
              </label>
            </div>

            <div className="form-check form-check-inline">
              <input
                type="radio"
                className="form-check-input"
                id="carMode"
                name="travelMode"
                value="car"
                checked={localData.travelMode === "car"}
                onChange={handleInputChange}
              />
              <label className="form-check-label" htmlFor="carMode">
                Car/कार
              </label>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="departureDate">Departure Date/प्रस्थान तिथि</label>
          <input
            type="date"
            className={`form-control ${
              errors.departureDate ? "is-invalid" : ""
            }`}
            id="departureDate"
            name="departureDate"
            value={localData.departureDate}
            onChange={handleInputChange}
          />
          {errors.departureDate && (
            <div className="invalid-feedback">{errors.departureDate}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="departureTime"> Departure Time/प्रस्थान समय</label>
          <input
            type="time"
            className={`form-control ${
              errors.departureTime ? "is-invalid" : ""
            }`}
            id="departureTime"
            name="departureTime"
            value={localData.departureTime}
            onChange={handleInputChange}
          />
          {errors.departureTime && (
            <div className="invalid-feedback">{errors.departureTime}</div>
          )}
        </div>

        <div className="form-buttons">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={prevStep}
          >
            Previous
          </button>
          <button type="submit" className="btn btn-primary">
            Next
          </button>
        </div>
      </form>
    </div>
  );
};

export default TravelingInfo;
