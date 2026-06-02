import React, { useState } from "react";

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

const ArrivalInfo = ({ userData, updateUserData, nextStep, prevStep }) => {
  const [localData, setLocalData] = useState({
    arrivalDate: userData.arrivalDate || "",
    arrivalTime: userData.arrivalTime || "",
    arrivalTravelMode: userData.arrivalTravelMode || "",
    arrivalTrainName: userData.arrivalTrainName || "",
  });
  const [errors, setErrors] = useState({});
  const [arrivalTicketFile, setArrivalTicketFile] = useState(null);
  const [isTicketDragging, setIsTicketDragging] = useState(false);
  const [ticketPreview, setTicketPreview] = useState(null);
  const [ticketType, setTicketType] = useState("");

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const processTicketFile = (file) => {
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, arrivalTicketFile: "केवल JPG, PNG या PDF फ़ाइल अपलोड करें" }));
      setArrivalTicketFile(null);
      setTicketPreview(null);
      setTicketType("");
      return;
    }
    setArrivalTicketFile(file);
    setTicketType(file.type);
    setErrors((prev) => ({ ...prev, arrivalTicketFile: null }));
    if (file.type === "application/pdf") {
      setTicketPreview("pdf");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setTicketPreview(reader.result);
    reader.onerror = () => setErrors((prev) => ({ ...prev, arrivalTicketFile: "फ़ाइल पढ़ने में त्रुटि। कृपया पुनः प्रयास करें।" }));
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!localData.arrivalDate) newErrors.arrivalDate = "आगमन तिथि आवश्यक है";
    if (!localData.arrivalTime) newErrors.arrivalTime = "आगमन समय आवश्यक है";
    if (!localData.arrivalTravelMode) newErrors.arrivalTravelMode = "आगमन यात्रा का माध्यम आवश्यक है";
    if ((localData.arrivalTravelMode === "Flight" || localData.arrivalTravelMode === "Train") && !arrivalTicketFile) {
      newErrors.arrivalTicketFile = "टिकट अपलोड करना आवश्यक है";
    }
    if (localData.arrivalTravelMode === "Train" && !localData.arrivalTrainName) {
      newErrors.arrivalTrainName = "ट्रेन का चयन आवश्यक है";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    updateUserData({
      arrivalDate: localData.arrivalDate,
      arrivalTime: localData.arrivalTime,
      arrivalTravelMode: localData.arrivalTravelMode,
      arrivalTrainName: localData.arrivalTrainName,
      hasArrivalTicket: !!arrivalTicketFile,
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
      <h3 className="form-section-title">Arrival Details</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="arrivalDate" className="isRequired">Arrival Date/आगमन तिथि</label>
          <select className={`form-select ${errors.arrivalDate ? "is-invalid" : ""}`} id="arrivalDate" name="arrivalDate" value={localData.arrivalDate} onChange={handleInputChange}>
            <option value={""}>आगमन तिथि चुनें</option>
            <option value="2026-07-31">31 जुलाई 2026</option>
            <option value="2026-08-01">1 अगस्त 2026</option>
          </select>
          {errors.arrivalDate && <div className="invalid-feedback">{errors.arrivalDate}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="arrivalTime" className="isRequired">Arrival Time/आगमन समय</label>
          <input type="time" className={`form-control ${errors.arrivalTime ? "is-invalid" : ""}`} id="arrivalTime" name="arrivalTime" value={localData.arrivalTime} onChange={handleInputChange} />
          {errors.arrivalTime && <div className="invalid-feedback">{errors.arrivalTime}</div>}
        </div>
        <div className="form-group">
          <label className="isRequired">Arrival Traveling Mode/आगमन यात्रा का माध्यम</label>
          <div className={`travel-mode-options ${errors.arrivalTravelMode ? "is-invalid" : ""}`}>
            {travelModes.map((mode) => (
              <div className="form-check form-check-inline" key={mode.value}>
                <input type="radio" className="form-check-input" id={`Arrival${mode.value}Mode`} name="arrivalTravelMode" value={mode.value} checked={localData.arrivalTravelMode === mode.value} onChange={handleInputChange} />
                <label className="form-check-label" htmlFor={`Arrival${mode.value}Mode`}>{mode.label}</label>
              </div>
            ))}
          </div>
          {errors.arrivalTravelMode && <div className="invalid-feedback">{errors.arrivalTravelMode}</div>}
        </div>
        {(localData.arrivalTravelMode === "Flight" || localData.arrivalTravelMode === "Train") && (
          <>
            <div className="form-group">
              <label htmlFor="arrivalTicket" className="isRequired">Ticket Upload/टिकट अपलोड (Image/PDF)</label>
              <div className={`ticket-upload-container ${isTicketDragging ? "dragging" : ""} ${errors.arrivalTicketFile ? "error" : ""}`}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsTicketDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsTicketDragging(false); }}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsTicketDragging(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) processTicketFile(e.dataTransfer.files[0]); }}
              >
                {!ticketPreview ? (
                  <div className="upload-placeholder">
                    <div className="upload-icon"><i className="bi bi-upload fs-1"></i></div>
                    <p className="upload-text">टिकट अपलोड करने के लिए क्लिक करें या यहां खींचें</p>
                    <p className="upload-requirements">केवल JPG, PNG या PDF फाइलें</p>
                    <input type="file" className="file-input" id="arrivalTicket" accept="image/jpeg,image/jpg,image/png,application/pdf,.pdf" onChange={(e) => processTicketFile(e.target.files?.[0])} />
                  </div>
                ) : (
                  <div className="preview-container">
                    {ticketType === "application/pdf" ? (
                      <div className="pdf-preview"><i className="bi bi-file-earmark-pdf fs-1 text-danger"></i><div className="fw-medium">PDF Ticket Selected</div></div>
                    ) : (
                      <img src={ticketPreview} alt="Ticket Preview" className="image-preview" />
                    )}
                    {arrivalTicketFile && <div className="file-info">फ़ाइल: {arrivalTicketFile.name}</div>}
                    <div className="preview-actions">
                      <button type="button" className="change-photo-btn" onClick={() => document.getElementById("arrivalTicket").click()}><i className="bi bi-pencil-square" style={{ width: "16px" }} />बदलें</button>
                      <button type="button" className="remove-photo-btn" onClick={() => { setArrivalTicketFile(null); setTicketPreview(null); setTicketType(""); setErrors((prev) => ({ ...prev, arrivalTicketFile: null })); }}><i className="bi bi-trash" style={{ width: "16px" }} />हटाएं</button>
                    </div>
                    <input type="file" className="file-input hidden" id="arrivalTicket" accept="image/jpeg,image/jpg,image/png,application/pdf,.pdf" onChange={(e) => processTicketFile(e.target.files?.[0])} />
                  </div>
                )}
              </div>
              {errors.arrivalTicketFile && <div className="error-message text-start">{errors.arrivalTicketFile}</div>}
            </div>
            {localData.arrivalTravelMode === "Train" && (
              <div className="form-group">
                <label htmlFor="arrivalTrainName" className="isRequired">Train Name/ट्रेन का नाम</label>
                <select className={`form-select ${errors.arrivalTrainName ? "is-invalid" : ""}`} id="arrivalTrainName" name="arrivalTrainName" value={localData.arrivalTrainName} onChange={handleInputChange}>
                  <option value={""}>ट्रेन चुनें</option>
                  <option value="अरावली एक्सप्रेस (14702)">अरावली एक्सप्रेस (14702)</option>
                  <option value="रणकपुर एक्सप्रेस (14708)">रणकपुर एक्सप्रेस (14708)</option>
                  <option value="भुज-बरेली एक्सप्रेस (14322)">भुज-बरेली एक्सप्रेस (14322)</option>
                  <option value="रणथंभौर एक्सप्रेस (12465)">रणथंभौर एक्सप्रेस (12465)</option>
                </select>
                {errors.arrivalTrainName && <div className="invalid-feedback">{errors.arrivalTrainName}</div>}
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

export default ArrivalInfo;
