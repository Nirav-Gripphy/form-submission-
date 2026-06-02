// components/AdditionalPeople.js - Form for additional attendees
import React, { useState } from "react";
import "../styles/AdditionalPeople.css";

const AdditionalPeople = ({ userData, nextStep, prevStep, loading }) => {
  const [localData, setLocalData] = useState({
    additionalPeople: userData.additionalPeople || [],
  });

  const [showForm, setShowForm] = useState(false);
  const [newPerson, setNewPerson] = useState({
    name: "",
    relation: "",
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    if (loading) return;
    const { name, value } = e.target;

    setNewPerson((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validatePersonForm = () => {
    const newErrors = {};

    if (!newPerson.name.trim()) {
      newErrors.name = "नाम आवश्यक है";
    }

    if (!newPerson.relation.trim()) {
      newErrors.relation = "संबंध आवश्यक है";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addPerson = () => {
    if (loading) return;
    if (!validatePersonForm()) return;

    setLocalData((prev) => ({
      additionalPeople: [
        ...prev.additionalPeople,
        { ...newPerson, id: Date.now() },
      ],
    }));

    // Reset the form
    setNewPerson({ name: "", relation: "" });

    // Hide the form after adding
    setShowForm(false);
  };

  const removePerson = (id) => {
    if (loading) return;
    setLocalData((prev) => ({
      additionalPeople: prev.additionalPeople.filter(
        (person) => person.id !== id
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final submission now happens here (old post-payment flow starts next)
    await nextStep({
      additionalPeople: localData.additionalPeople,
      paymentStatus: "completed",
      paymentAmount: userData.hasHusband ? 1000 : 500,
      paymentCompletedAt: new Date(),
    });
  };

  return (
    <div className="additional-people-container">
      <h3 className="form-section-title">Add Guests</h3>
      <p className="additional-info">
        यदि बच्चे और सास-ससुर में से कोई साथ आना चाहें तो सम्बन्ध के साथ उनका
        नामोल्लेख करें।
      </p>

      <form onSubmit={handleSubmit}>
        {!showForm ? (
          <div className="text-center mb-4">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
              disabled={loading}
            >
              <i className="fas fa-plus"></i> Add Guest
            </button>
          </div>
        ) : (
          <div className="add-person-form">
            <div className="form-group">
              <label htmlFor="name" className="isRequired">
                Name/नाम
              </label>
              <input
                type="text"
                className={`form-control ${errors.name ? "is-invalid" : ""} `}
                id="name"
                name="name"
                value={newPerson.name}
                onChange={handleInputChange}
                placeholder="अतिथि का नाम"
                disabled={loading}
              />
              {errors.name && (
                <div className="invalid-feedback">{errors.name}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="relation" className="isRequired">
                Relation/संबंध
              </label>
              {/* <input
                type="text"
                className={`form-control ${
                  errors.relation ? "is-invalid" : ""
                }`}
                id="relation"
                name="relation"
                value={newPerson.relation}
                onChange={handleInputChange}
                placeholder="अतिथि संबंध"
              /> */}

              <select
                className={`form-select ${errors.relation ? "is-invalid" : ""}`}
                aria-label="Default select example"
                id="relation"
                name="relation"
                value={newPerson.relation}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value={""} selected>
                  Select Relation/संबंध
                </option>
                <option value="Mother in Law/सास"> Mother in Law/सास</option>
                <option value="Father in Law /ससुर">Father in Law /ससुर</option>
                <option value="Son/बेटा">Son/बेटा</option>
                <option value="Daughter/बेटी"> Daughter/बेटी</option>
              </select>

              {errors.relation && (
                <div className="invalid-feedback">{errors.relation}</div>
              )}
            </div>

            <div className="form-buttons-inline d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-primary add-person-btn"
                onClick={addPerson}
                disabled={loading}
              >
                <i className="fas fa-plus"></i> Add
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  if (loading) return;
                  setShowForm(false);
                  setNewPerson({ name: "", relation: "" });
                  setErrors({});
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {localData.additionalPeople.length > 0 && (
          <div className="additional-people-list">
            <h4>Guests</h4>
            <ul className="list-group">
              {localData.additionalPeople.map((person) => (
                <li
                  key={person.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <div>
                    <strong>{person.name}</strong> ({person.relation})
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removePerson(person.id)}
                    disabled={loading}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="form-buttons mt-4">
          <button
            type="button"
            className="btn btn-secondary secondry-cutom-btn"
            onClick={prevStep}
            disabled={loading}
          >
            Previous
          </button>
          <button
            type="submit"
            className="btn btn-primary primary-custom-btn"
            disabled={loading}
          >
            {loading ? (
              <span>
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
                <span className="ms-2">Submitting...</span>
              </span>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdditionalPeople;
