// components/PersonalInfo.js - Personal information form
import React, { useState, useEffect } from "react";
// import "../styles/PersonalInfo.css";

// Add the required CSS styles
const styles = `
  .photo-upload-container {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    margin-bottom: 15px;
    background-color: #f9f9f9;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
  }
  
  .photo-upload-container.dragging {
    border-color: #3490dc;
    background-color: rgba(52, 144, 220, 0.05);
  }
  
  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 150px;
  }
  
  .upload-icon {
    color: #777;
    margin-bottom: 15px;
  }
  
  .upload-text {
    color: #666;
    margin-bottom: 10px;
    font-size: 14px;
  }
  
  .file-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
  
  .hidden {
    display: none;
  }
  
  .preview-container {
    position: relative;
    overflow: hidden;
  }
  
  .image-preview {
    max-width: 100%;
    max-height: 300px;
    display: block;
    margin: 0 auto;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  
  .preview-actions {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 12px;
  }
  
  .change-photo-btn,
  .remove-photo-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  
  .change-photo-btn {
    color: #3490dc;
    border: 1px solid #3490dc;
  }
  
  .change-photo-btn:hover {
    background-color: rgba(52, 144, 220, 0.1);
  }
  
  .remove-photo-btn {
    color: #e3342f;
    border: 1px solid #e3342f;
  }
  
  .remove-photo-btn:hover {
    background-color: rgba(227, 52, 47, 0.1);
  }
  
  .error-message {
    color: #e3342f;
    font-size: 14px;
    margin-top: 5px;
  }
`;

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

  const [previewImage, setPreviewImage] = useState(userData.photoURL || null);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file) => {
    // Validate file is an image
    if (!file.type.match("image.*")) {
      setErrors((prev) => ({
        ...prev,
        photo: "कृपया केवल छवि फ़ाइलें अपलोड करें (jpg, png, gif, etc.)",
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        photo: "छवि 5MB से कम होनी चाहिए",
      }));
      return;
    }

    setLocalData((prev) => ({
      ...prev,
      photoFile: file,
    }));

    // Create a preview for the selected image
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    // Clear any previous errors
    if (errors.photo) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.photo;
        return newErrors;
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
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
      <style>{styles}</style>
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
            onChange={handleInputChange}
            placeholder="अपना राज्य दर्ज करें"
          />
          {errors.state && (
            <div className="invalid-feedback">{errors.state}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="photo">फोटो</label>

          <div
            className={`photo-upload-container ${isDragging ? "dragging" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {!previewImage ? (
              <div className="upload-placeholder">
                <div className="upload-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                    <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z" />
                  </svg>
                </div>
                <p className="upload-text">
                  फोटो अपलोड करने के लिए क्लिक करें या यहां खींचें
                </p>
                <input
                  type="file"
                  className="file-input"
                  id="photo"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="preview-container">
                <img
                  src={previewImage}
                  alt="Profile Preview"
                  className="image-preview"
                />
                <div className="preview-actions">
                  <button
                    type="button"
                    className="change-photo-btn"
                    onClick={() => {
                      document.getElementById("photo").click();
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                      <path
                        fillRule="evenodd"
                        d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"
                      />
                    </svg>
                    बदलें
                  </button>
                  <button
                    type="button"
                    className="remove-photo-btn"
                    onClick={() => {
                      setPreviewImage(null);
                      setLocalData((prev) => ({ ...prev, photoFile: null }));
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z" />
                      <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z" />
                    </svg>
                    हटाएं
                  </button>
                </div>
                <input
                  type="file"
                  className="file-input hidden"
                  id="photo"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>
          {errors.photo && <div className="error-message">{errors.photo}</div>}
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
              ⁠Would your husband coming along with you (क्या जीवनसाथी साथ
              आएंगे)
            </label>
          </div>
        </div>

        {localData.hasHusband && (
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
            className="btn btn-secondary secondry-cutom-btn"
            onClick={prevStep}
          >
            Previous
          </button>
          <button
            type="submit"
            className="btn btn-primary primary-custom-btn"
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
