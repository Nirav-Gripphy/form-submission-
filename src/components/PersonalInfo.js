// components/PersonalInfo.js - Personal information form with enhanced file validation
import React, { useState, useEffect } from "react";

// Add the required CSS styles
const styles = `
  .photo-upload-container {
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
  
  .photo-upload-container.dragging {
    border-color: #3490dc;
    background-color: rgba(52, 144, 220, 0.05);
  }
  
  .photo-upload-container.error {
    border-color: #e3342f;
    background-color: rgba(227, 52, 47, 0.05);
  }
  
  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
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
  
  .upload-requirements {
    color: #999;
    font-size: 12px;
    margin-top: 5px;
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
  
  .file-info {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    padding: 8px 12px;
    margin-top: 8px;
    font-size: 12px;
    color: #6c757d;
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
    name: "",
    city: "",
    state: "",
    hasHusband: false,
    husbandName: "",
    photoFile: null,
    husbandPhotoFile: null,
  });

  useEffect(() => {
    setLocalData({
      name: userData.name || "",
      city: userData.city || "",
      state: userData.state || "",
      hasHusband: userData.hasHusband || false,
      husbandName: userData.husbandName || "",
      photoFile: null,
      husbandPhotoFile: null,
    });
  }, [userData]);

  const [previewImage, setPreviewImage] = useState(userData.photoURL || null);
  const [husbandPreviewImage, setHusbandPreviewImage] = useState(
    userData.husbandPhotoURL || null
  );
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHusbandDragging, setIsHusbandDragging] = useState(false);

  // Enhanced file validation constants
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Enhanced validation function
  const validateFile = (file) => {
    const errors = [];

    // Check if file is an image
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      errors.push("केवल छवि फ़ाइलें अपलोड करें (JPG, PNG, JPEG)");
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      errors.push(
        `फ़ाइल का आकार ${formatFileSize(
          MAX_FILE_SIZE
        )} से कम होना चाहिए। आपकी फ़ाइल: ${formatFileSize(file.size)}`
      );
    }

    // Check if file is empty
    if (file.size === 0) {
      errors.push("फ़ाइल खाली है। कृपया एक वैध छवि चुनें");
    }

    return errors;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!localData.name.trim()) newErrors.name = "नाम आवश्यक है";
    if (!localData.city.trim()) newErrors.city = "शहर आवश्यक है";
    if (!localData.state.trim()) newErrors.state = "राज्य आवश्यक है";

    // Check if either photoFile exists OR photoURL exists in userData
    const hasPhoto = localData.photoFile instanceof File || userData.photoURL;
    if (!hasPhoto) {
      newErrors.photoFile = "फोटो आवश्यक है";
    }

    // If hasHusband is true, check husband name and photo
    if (localData.hasHusband) {
      if (!localData.husbandName.trim()) {
        newErrors.husbandName = "जीवनसाथी का नाम आवश्यक है";
      }

      // Check if either husbandPhotoFile exists OR husbandPhotoURL exists in userData
      const hasHusbandPhoto =
        localData.husbandPhotoFile instanceof File || userData.husbandPhotoURL;
      if (!hasHusbandPhoto) {
        newErrors.husbandPhotoFile = "जीवनसाथी का फोटो आवश्यक है";
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

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file, "user");
    }
  };

  const handleHusbandFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file, "husband");
    }
  };

  const processFile = (file, personType) => {
    const fieldName =
      personType === "husband" ? "husbandPhotoFile" : "photoFile";

    // Enhanced validation
    const validationErrors = validateFile(file);

    if (validationErrors.length > 0) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: validationErrors.join(". "),
      }));
      setLocalData((prev) => ({
        ...prev,
        [fieldName]: null,
      }));
      if (personType === "husband") {
        setHusbandPreviewImage("");
      } else {
        setPreviewImage("");
      }
      return;
    }

    // Clear any previous errors
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });

    // Update local data with the file
    setLocalData((prev) => ({
      ...prev,
      [fieldName]: file,
    }));

    // Create a preview for the selected image
    const reader = new FileReader();
    reader.onloadend = () => {
      if (personType === "husband") {
        setHusbandPreviewImage(reader.result);
      } else {
        setPreviewImage(reader.result);
      }
    };
    reader.onerror = () => {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: "फ़ाइल पढ़ने में त्रुटि। कृपया पुनः प्रयास करें।",
      }));
    };
    reader.readAsDataURL(file);
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
      processFile(e.dataTransfer.files[0], "user");
    }
  };

  const handleHusbandDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHusbandDragging(true);
  };

  const handleHusbandDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHusbandDragging(false);
  };

  const handleHusbandDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHusbandDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], "husband");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setUploading(true);

    try {
      // Process photo upload if there's a NEW file
      let photoURL = userData.photoURL;
      let husbandPhotoURL = userData.husbandPhotoURL;

      // Only upload if there's a new file selected
      if (localData.photoFile) {
        photoURL = await handleFileUpload(localData.photoFile);
      }

      if (localData.hasHusband && localData.husbandPhotoFile) {
        husbandPhotoURL = await handleFileUpload(localData.husbandPhotoFile);
      }

      // Update the user data
      updateUserData({
        name: localData.name,
        city: localData.city,
        state: localData.state,
        photoURL,
        hasHusband: localData.hasHusband,
        husbandName: localData.hasHusband
          ? localData.husbandName || userData.husbandName
          : userData.husbandName || "",
        husbandPhotoURL: localData.hasHusband ? husbandPhotoURL : null,
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

  // Handle remove photo functionality
  const handleRemovePhoto = () => {
    setPreviewImage(null);
    setLocalData((prev) => ({ ...prev, photoFile: null }));
    // Also clear from userData if needed
    updateUserData({ ...userData, photoURL: null });
    // Clear any related errors
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.photoFile;
      return newErrors;
    });
  };

  const handleRemoveHusbandPhoto = () => {
    setHusbandPreviewImage(null);
    setLocalData((prev) => ({ ...prev, husbandPhotoFile: null }));
    // Also clear from userData if needed
    updateUserData({ ...userData, husbandPhotoURL: null });
    // Clear any related errors
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.husbandPhotoFile;
      return newErrors;
    });
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
          <label htmlFor="photo" className="isRequired">
            Photo/फोटो
          </label>

          <div
            className={`photo-upload-container ${
              isDragging ? "dragging" : ""
            } ${errors.photoFile ? "error" : ""}`}
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
                <p className="upload-requirements">
                  केवल छवि फाइलें (JPG, PNG, JPEG) • अधिकतम 5MB
                </p>
                <input
                  type="file"
                  className="file-input"
                  id="photo"
                  accept="image/jpeg,image/jpg,image/png"
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
                {localData.photoFile && (
                  <div className="file-info">
                    फ़ाइल: {localData.photoFile.name}
                  </div>
                )}
                <div className="preview-actions">
                  <button
                    type="button"
                    className="change-photo-btn"
                    onClick={() => {
                      document.getElementById("photo").click();
                    }}
                  >
                    <i
                      className="bi bi-pencil-square"
                      style={{
                        width: "16px",
                      }}
                    />
                    बदलें
                  </button>
                  <button
                    type="button"
                    className="remove-photo-btn"
                    onClick={handleRemovePhoto}
                  >
                    <i
                      className="bi bi-trash"
                      style={{
                        width: "16px",
                      }}
                    />
                    हटाएं
                  </button>
                </div>
                <input
                  type="file"
                  className="file-input hidden"
                  id="photo"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>
          {errors.photoFile && (
            <div className="error-message text-start">{errors.photoFile}</div>
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

            <div className="form-group">
              <label htmlFor="husbandPhoto" className="isRequired">
                Husband Photo/जीवनसाथी का फोटो
              </label>

              <div
                className={`photo-upload-container ${
                  isHusbandDragging ? "dragging" : ""
                } ${errors.husbandPhotoFile ? "error" : ""}`}
                onDragOver={handleHusbandDragOver}
                onDragLeave={handleHusbandDragLeave}
                onDrop={handleHusbandDrop}
              >
                {!husbandPreviewImage ? (
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
                      जीवनसाथी का फोटो अपलोड करने के लिए क्लिक करें या यहां
                      खींचें
                    </p>
                    <p className="upload-requirements">
                      केवल छवि फाइलें (JPG, PNG, JPEG) • अधिकतम 5MB
                    </p>
                    <input
                      type="file"
                      className="file-input"
                      id="husbandPhoto"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleHusbandFileChange}
                    />
                  </div>
                ) : (
                  <div className="preview-container">
                    <img
                      src={husbandPreviewImage}
                      alt="Husband Profile Preview"
                      className="image-preview"
                    />
                    {localData.husbandPhotoFile && (
                      <div className="file-info">
                        फ़ाइल: {localData.husbandPhotoFile.name} • आकार:{" "}
                        {formatFileSize(localData.husbandPhotoFile.size)}
                      </div>
                    )}
                    <div className="preview-actions">
                      <button
                        type="button"
                        className="change-photo-btn"
                        onClick={() => {
                          document.getElementById("husbandPhoto").click();
                        }}
                      >
                        <i
                          className="bi bi-pencil-square"
                          style={{
                            width: "16px",
                          }}
                        />
                        बदलें
                      </button>
                      <button
                        type="button"
                        className="remove-photo-btn"
                        onClick={handleRemoveHusbandPhoto}
                      >
                        <i
                          className="bi bi-trash"
                          style={{
                            width: "16px",
                          }}
                        />
                        हटाएं
                      </button>
                    </div>
                    <input
                      type="file"
                      className="file-input hidden"
                      id="husbandPhoto"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleHusbandFileChange}
                    />
                  </div>
                )}
              </div>
              {errors.husbandPhotoFile && (
                <div className="error-message text-start">
                  {errors.husbandPhotoFile}
                </div>
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
                />
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
