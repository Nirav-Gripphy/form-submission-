// components/TravelingInfo.js - Travel information form
import React, { useState, useEffect } from "react";
// import "../styles/TravelingInfo.css";

const TravelingInfo = ({ userData, updateUserData, nextStep, prevStep }) => {
  const [localData, setLocalData] = useState({
    arrivalDate: userData.arrivalDate || "",
    arrivalTime: userData.arrivalTime || "",
    arrivalTravelMode: userData.arrivalTravelMode || "",
    departureTravelMode: userData.departureTravelMode || "",
    departureDate: userData.departureDate || "",
    departureTime: userData.departureTime || "",
  });

  const [errors, setErrors] = useState({});
  const [minDepartureDate, setMinDepartureDate] = useState("");
  const [minDepartureTime, setMinDepartureTime] = useState("");

  // Get today's date in YYYY-MM-DD format for minimum arrival date
  const today = new Date().toISOString().split("T")[0];

  // Update min departure date when arrival date changes
  useEffect(() => {
    if (localData.arrivalDate) {
      setMinDepartureDate(localData.arrivalDate);

      // If departure date is earlier than arrival date, update it
      if (
        localData.departureDate &&
        localData.departureDate < localData.arrivalDate
      ) {
        setLocalData((prev) => ({
          ...prev,
          departureDate: localData.arrivalDate,
        }));
      }

      // If same day, check and set minimum departure time
      updateMinDepartureTime();
    }
  }, [localData.arrivalDate, localData.arrivalTime]);

  // Update departure time validation when dates change
  useEffect(() => {
    updateMinDepartureTime();
  }, [localData.departureDate]);

  const updateMinDepartureTime = () => {
    // If arrival and departure dates are the same, departure time should be after arrival time
    if (
      localData.arrivalDate &&
      localData.departureDate &&
      localData.arrivalDate === localData.departureDate &&
      localData.arrivalTime
    ) {
      setMinDepartureTime(localData.arrivalTime);

      // If current departure time is earlier than arrival time, clear it
      if (
        localData.departureTime &&
        localData.departureTime <= localData.arrivalTime
      ) {
        setLocalData((prev) => ({
          ...prev,
          departureTime: "",
        }));
      }
    } else {
      setMinDepartureTime("");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic required field validation
    if (!localData.arrivalDate) newErrors.arrivalDate = "आगमन तिथि आवश्यक है";
    if (!localData.arrivalTime) newErrors.arrivalTime = "आगमन समय आवश्यक है";
    if (!localData.departureDate)
      newErrors.departureDate = "प्रस्थान तिथि आवश्यक है";
    if (!localData.departureTime)
      newErrors.departureTime = "प्रस्थान समय आवश्यक है";
    if (!localData.arrivalTravelMode)
      newErrors.arrivalTravelMode = "आगमन यात्रा का माध्यम आवश्यक है";

    if (!localData.departureTravelMode)
      newErrors.departureTravelMode = "प्रस्थान यात्रा का माध्यम आवश्यक है";

    // Date-time logical validation
    if (localData.arrivalDate && localData.departureDate) {
      // Check if departure date is before arrival date
      if (localData.departureDate < localData.arrivalDate) {
        newErrors.departureDate =
          "प्रस्थान तिथि आगमन तिथि से पहले नहीं हो सकती";
      }
      // If same day, check if departure time is after arrival time
      else if (
        localData.departureDate === localData.arrivalDate &&
        localData.arrivalTime &&
        localData.departureTime
      ) {
        if (localData.departureTime <= localData.arrivalTime) {
          newErrors.departureTime =
            "एक ही दिन पर, प्रस्थान समय आगमन समय के बाद होना चाहिए";
        }
      }
    }

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
      arrivalTravelMode: localData.arrivalTravelMode,
      departureDate: localData.departureDate,
      departureTime: localData.departureTime,
      departureTravelMode: localData.departureTravelMode,
    });

    nextStep();
  };

  const travelModes = [
    { value: "Flight", label: "Flight/विमान" },
    { value: "Train", label: "Train/रेल" },
    { value: "Car", label: "Car/कार" },
  ];

  return (
    <div className="traveling-info-container">
      <h3 className="form-section-title">Traveling Details</h3>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="arrivalDate" className="isRequired">
            Arrival Date/आगमन तिथि
          </label>
          {/* <input
            type="date"
            className={`form-control ${errors.arrivalDate ? "is-invalid" : ""}`}
            id="arrivalDate"
            name="arrivalDate"
            value={localData.arrivalDate}
            onChange={handleInputChange}
            // min={today} // Cannot select past dates
          /> */}
          <select
            className={`form-select ${errors.arrivalDate ? "is-invalid" : ""}`}
            id="arrivalDate"
            name="arrivalDate"
            aria-label="Default select example"
            value={localData.arrivalDate}
            onChange={handleInputChange}
          >
            <option value={""} selected>
              आगमन तिथि चुनें
            </option>
            <option value="2025-07-25"> ⁠25 जुलाई 2025</option>
            <option value="2025-07-26">26 जुलाई 2025</option>
          </select>

          {errors.arrivalDate && (
            <div className="invalid-feedback">{errors.arrivalDate}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="arrivalTime" className="isRequired">
            Arrival Time/आगमन समय
          </label>
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
          <label className="isRequired">
            Arrival Traveling Mode/आगमन यात्रा का माध्यम
          </label>
          <div
            className={`travel-mode-options  ${
              errors.arrivalTravelMode ? "is-invalid" : ""
            }`}
          >
            {travelModes.map((mode) => (
              <div className="form-check form-check-inline" key={mode.value}>
                <input
                  type="radio"
                  className="form-check-input"
                  id={`Arrival${mode.value}Mode`}
                  name="arrivalTravelMode"
                  value={mode.value}
                  checked={localData.arrivalTravelMode === mode.value}
                  onChange={handleInputChange}
                />
                <label
                  className="form-check-label"
                  htmlFor={`${mode.value}Mode`}
                >
                  {mode.label}
                </label>
              </div>
            ))}
          </div>
          {errors.arrivalTravelMode && (
            <div className="invalid-feedback">{errors.arrivalTravelMode}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="departureDate" className="isRequired">
            Departure Date/प्रस्थान तिथि
          </label>
          {/* <input
            type="date"
            className={`form-control ${
              errors.departureDate ? "is-invalid" : ""
            }`}
            id="departureDate"
            name="departureDate"
            value={localData.departureDate}
            onChange={handleInputChange}
            min={minDepartureDate || today} // Can't be earlier than arrival date or today
          /> */}

          <select
            className={`form-select ${
              errors.departureDate ? "is-invalid" : ""
            }`}
            aria-label="Default select example"
            id="departureDate"
            name="departureDate"
            value={localData.departureDate}
            onChange={handleInputChange}
          >
            <option value={""} selected>
              प्रस्थान तिथि चुनें
            </option>
            <option value="2025-07-26"> ⁠26 जुलाई 2025</option>
            <option value="2025-07-27"> ⁠27 जुलाई 2025</option>
            <option value="2025-07-28">28 जुलाई 2025</option>
          </select>
          {errors.departureDate && (
            <div className="invalid-feedback">{errors.departureDate}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="departureTime" className="isRequired">
            Departure Time/प्रस्थान समय
          </label>
          <input
            type="time"
            className={`form-control ${
              errors.departureTime ? "is-invalid" : ""
            }`}
            id="departureTime"
            name="departureTime"
            value={localData.departureTime}
            onChange={handleInputChange}
            min={minDepartureTime} // Only restricts if on same day as arrival
          />
          {errors.departureTime && (
            <div className="invalid-feedback">{errors.departureTime}</div>
          )}
        </div>

        <div className="form-group">
          <label className="isRequired">
            Departure Traveling Mode/प्रस्थान यात्रा का माध्यम
          </label>
          <div
            className={`travel-mode-options  ${
              errors.departureTravelMode ? "is-invalid" : ""
            }`}
          >
            {travelModes.map((mode) => (
              <div className="form-check form-check-inline" key={mode.value}>
                <input
                  type="radio"
                  className="form-check-input"
                  id={`Departure${mode.value}Mode`}
                  name="departureTravelMode"
                  value={mode.value}
                  checked={localData.departureTravelMode === mode.value}
                  onChange={handleInputChange}
                />
                <label
                  className="form-check-label"
                  htmlFor={`${mode.value}Mode`}
                >
                  {mode.label}
                </label>
              </div>
            ))}
          </div>
          {errors.departureTravelMode && (
            <div className="invalid-feedback">{errors.departureTravelMode}</div>
          )}
        </div>

        <div className="form-buttons">
          <button
            type="button"
            className="btn btn-secondary secondry-cutom-btn"
            onClick={prevStep}
          >
            Previous
          </button>
          <button type="submit" className="btn btn-primary primary-custom-btn">
            Next
          </button>
        </div>
      </form>
    </div>
  );
};

export default TravelingInfo;
