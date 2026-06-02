import React, { useState, useEffect } from "react";

const uploadStyles = `
  .ticket-upload-container {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    margin-bottom: 5px;
    background-color: #f9f9f9;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
  }
  .ticket-upload-container.dragging { border-color: #3490dc; background-color: rgba(52, 144, 220, 0.05); }
  .ticket-upload-container.error { border-color: #e3342f; background-color: rgba(227, 52, 47, 0.05); }
  .upload-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 180px; }
  .upload-icon { color: #777; margin-bottom: 15px; }
  .upload-text { color: #666; margin-bottom: 10px; font-size: 14px; }
  .upload-requirements { color: #999; font-size: 12px; margin-top: 5px; }
  .file-input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
  .hidden { display: none; }
  .preview-container { position: relative; overflow: hidden; }
  .image-preview { max-width: 100%; max-height: 280px; display: block; margin: 0 auto; border-radius: 4px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
  .pdf-preview { border: 1px solid #dee2e6; border-radius: 6px; padding: 20px; background: #fff; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .preview-actions { display: flex; justify-content: center; gap: 15px; margin-top: 12px; }
  .change-photo-btn,.remove-photo-btn { display: flex; align-items: center; gap: 5px; background: none; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 14px; transition: all 0.2s ease; }
  .change-photo-btn { color: #3490dc; border: 1px solid #3490dc; }
  .change-photo-btn:hover { background-color: rgba(52, 144, 220, 0.1); }
  .remove-photo-btn { color: #e3342f; border: 1px solid #e3342f; }
  .remove-photo-btn:hover { background-color: rgba(227, 52, 47, 0.1); }
  .error-message { color: #e3342f; font-size: 14px; margin-top: 5px; }
  .file-info { background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 8px 12px; margin-top: 8px; font-size: 12px; color: #6c757d; }
`;

const DepartureInfo = ({ userData, updateUserData, nextStep, prevStep }) => {
  const [localData, setLocalData] = useState({
    departureDate: userData.departureDate || "",
    departureTime: userData.departureTime || "",
    departureTravelMode: userData.departureTravelMode || "",
    departureTrainName: userData.departureTrainName || "",
  });
  const [errors, setErrors] = useState({});
  const [minDepartureTime, setMinDepartureTime] = useState("");
  const [departureTicketFile, setDepartureTicketFile] = useState(null);
  const [isDepartureTicketDragging, setIsDepartureTicketDragging] = useState(false);
  const [departureTicketPreview, setDepartureTicketPreview] = useState(null);
  const [departureTicketType, setDepartureTicketType] = useState("");

  const ALLOWED_TICKET_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
  ];

  useEffect(() => {
    if (
      userData.arrivalDate &&
      localData.departureDate &&
      userData.arrivalDate === localData.departureDate &&
      userData.arrivalTime
    ) {
      setMinDepartureTime(userData.arrivalTime);
      if (localData.departureTime && localData.departureTime <= userData.arrivalTime) {
        setLocalData((prev) => ({ ...prev, departureTime: "" }));
      }
    } else {
      setMinDepartureTime("");
    }
  }, [userData.arrivalDate, userData.arrivalTime, localData.departureDate, localData.departureTime]);

  const validateForm = () => {
    const newErrors = {};
    if (!localData.departureDate) newErrors.departureDate = "प्रस्थान तिथि आवश्यक है";
    if (!localData.departureTime) newErrors.departureTime = "प्रस्थान समय आवश्यक है";
    if (!localData.departureTravelMode) newErrors.departureTravelMode = "प्रस्थान यात्रा का माध्यम आवश्यक है";

    if (userData.arrivalDate && localData.departureDate) {
      if (localData.departureDate < userData.arrivalDate) {
        newErrors.departureDate = "प्रस्थान तिथि आगमन तिथि से पहले नहीं हो सकती";
      } else if (
        localData.departureDate === userData.arrivalDate &&
        userData.arrivalTime &&
        localData.departureTime &&
        localData.departureTime <= userData.arrivalTime
      ) {
        newErrors.departureTime = "एक ही दिन पर, प्रस्थान समय आगमन समय के बाद होना चाहिए";
      }
    }

    const isFlightOrTrain = localData.departureTravelMode === "Flight" || localData.departureTravelMode === "Train";
    if (isFlightOrTrain && !departureTicketFile) {
      newErrors.departureTicketFile = "टिकट अपलोड करना आवश्यक है";
    }
    if (localData.departureTravelMode === "Train" && !localData.departureTrainName) {
      newErrors.departureTrainName = "ट्रेन का चयन आवश्यक है";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const processDepartureTicketFile = (file) => {
    if (!file) return;
    if (!ALLOWED_TICKET_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, departureTicketFile: "केवल JPG, PNG या PDF फ़ाइल अपलोड करें" }));
      setDepartureTicketFile(null);
      setDepartureTicketPreview(null);
      setDepartureTicketType("");
      return;
    }

    setDepartureTicketFile(file);
    setDepartureTicketType(file.type);
    setErrors((prev) => ({ ...prev, departureTicketFile: null }));

    if (file.type === "application/pdf") {
      setDepartureTicketPreview("pdf");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setDepartureTicketPreview(reader.result);
    reader.onerror = () => setErrors((prev) => ({ ...prev, departureTicketFile: "फ़ाइल पढ़ने में त्रुटि। कृपया पुनः प्रयास करें।" }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    updateUserData({
      departureDate: localData.departureDate,
      departureTime: localData.departureTime,
      departureTravelMode: localData.departureTravelMode,
      departureTrainName: localData.departureTrainName,
      hasDepartureTicket: !!departureTicketFile,
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
      <style>{uploadStyles}</style>
      <h3 className="form-section-title">Departure Details</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="departureDate" className="isRequired">Departure Date/प्रस्थान तिथि</label>
          <select className={`form-select ${errors.departureDate ? "is-invalid" : ""}`} id="departureDate" name="departureDate" value={localData.departureDate} onChange={handleInputChange}>
            <option value={""}>प्रस्थान तिथि चुनें</option>
            <option value="2026-08-01">1 अगस्त 2026</option>
            <option value="2026-08-02">2 अगस्त 2026</option>
            <option value="2026-08-03">3 अगस्त 2026</option>
          </select>
          {errors.departureDate && <div className="invalid-feedback">{errors.departureDate}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="departureTime" className="isRequired">Departure Time/प्रस्थान समय</label>
          <input type="time" className={`form-control ${errors.departureTime ? "is-invalid" : ""}`} id="departureTime" name="departureTime" value={localData.departureTime} onChange={handleInputChange} min={minDepartureTime} />
          {errors.departureTime && <div className="invalid-feedback">{errors.departureTime}</div>}
        </div>

        <div className="form-group">
          <label className="isRequired">Departure Traveling Mode/प्रस्थान यात्रा का माध्यम</label>
          <div className={`travel-mode-options ${errors.departureTravelMode ? "is-invalid" : ""}`}>
            {travelModes.map((mode) => (
              <div className="form-check form-check-inline" key={mode.value}>
                <input type="radio" className="form-check-input" id={`Departure${mode.value}Mode`} name="departureTravelMode" value={mode.value} checked={localData.departureTravelMode === mode.value} onChange={handleInputChange} />
                <label className="form-check-label" htmlFor={`Departure${mode.value}Mode`}>{mode.label}</label>
              </div>
            ))}
          </div>
          {errors.departureTravelMode && <div className="invalid-feedback">{errors.departureTravelMode}</div>}
        </div>

        {(localData.departureTravelMode === "Flight" || localData.departureTravelMode === "Train") && (
          <>
            <div className="form-group">
              <label htmlFor="departureTicket" className="isRequired">Departure Ticket Upload/प्रस्थान टिकट अपलोड (Image/PDF)</label>
              <div
                className={`ticket-upload-container ${isDepartureTicketDragging ? "dragging" : ""} ${errors.departureTicketFile ? "error" : ""}`}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDepartureTicketDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDepartureTicketDragging(false); }}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsDepartureTicketDragging(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) processDepartureTicketFile(e.dataTransfer.files[0]); }}
              >
                {!departureTicketPreview ? (
                  <div className="upload-placeholder">
                    <div className="upload-icon"><i className="bi bi-upload fs-1"></i></div>
                    <p className="upload-text">प्रस्थान टिकट अपलोड करने के लिए क्लिक करें या यहां खींचें</p>
                    <p className="upload-requirements">केवल JPG, PNG या PDF फाइलें</p>
                    <input type="file" className="file-input" id="departureTicket" accept="image/jpeg,image/jpg,image/png,application/pdf,.pdf" onChange={(e) => processDepartureTicketFile(e.target.files?.[0])} />
                  </div>
                ) : (
                  <div className="preview-container">
                    {departureTicketType === "application/pdf" ? (
                      <div className="pdf-preview"><i className="bi bi-file-earmark-pdf fs-1 text-danger"></i><div className="fw-medium">PDF Ticket Selected</div></div>
                    ) : (
                      <img src={departureTicketPreview} alt="Departure Ticket Preview" className="image-preview" />
                    )}
                    {departureTicketFile && <div className="file-info">फ़ाइल: {departureTicketFile.name}</div>}
                    <div className="preview-actions">
                      <button type="button" className="change-photo-btn" onClick={() => document.getElementById("departureTicket").click()}><i className="bi bi-pencil-square" style={{ width: "16px" }} />बदलें</button>
                      <button type="button" className="remove-photo-btn" onClick={() => { setDepartureTicketFile(null); setDepartureTicketPreview(null); setDepartureTicketType(""); setErrors((prev) => ({ ...prev, departureTicketFile: null })); }}><i className="bi bi-trash" style={{ width: "16px" }} />हटाएं</button>
                    </div>
                    <input type="file" className="file-input hidden" id="departureTicket" accept="image/jpeg,image/jpg,image/png,application/pdf,.pdf" onChange={(e) => processDepartureTicketFile(e.target.files?.[0])} />
                  </div>
                )}
              </div>
              {errors.departureTicketFile && <div className="error-message text-start">{errors.departureTicketFile}</div>}
            </div>

            {localData.departureTravelMode === "Train" && (
              <div className="form-group">
                <label htmlFor="departureTrainName" className="isRequired">Departure Train Name/प्रस्थान ट्रेन का नाम</label>
                <select className={`form-select ${errors.departureTrainName ? "is-invalid" : ""}`} id="departureTrainName" name="departureTrainName" value={localData.departureTrainName} onChange={handleInputChange}>
                  <option value={""}>ट्रेन चुनें</option>
                  <option value="यशवंतपुर बीकानेर एक्सप्रेस (16588)">यशवंतपुर बीकानेर एक्सप्रेस (16588)</option>
                  <option value="भुज-बरेली एक्सप्रेस (14321)">भुज-बरेली एक्सप्रेस (14321)</option>
                  <option value="बीकानेर - इंदौर महामना एक्सप्रेस (19334)">बीकानेर - इंदौर महामना एक्सप्रेस (19334)</option>
                </select>
                {errors.departureTrainName && <div className="invalid-feedback">{errors.departureTrainName}</div>}
              </div>
            )}
          </>
        )}

        <div className="form-buttons">
          <button type="button" className="btn btn-secondary secondry-cutom-btn" onClick={prevStep}>Previous</button>
          <button type="submit" className="btn btn-primary primary-custom-btn">Next</button>
        </div>
      </form>
    </div>
  );
};

export default DepartureInfo;
