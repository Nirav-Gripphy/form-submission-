// components/AdditionalPeople.js - Form for additional attendees
import React, { useState } from "react";
import "../styles/AdditionalPeople.css";

const AdditionalPeople = ({ userData, updateUserData, nextStep, prevStep }) => {
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
    setLocalData((prev) => ({
      additionalPeople: prev.additionalPeople.filter(
        (person) => person.id !== id
      ),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Update the user data
    updateUserData({
      additionalPeople: localData.additionalPeople,
    });

    nextStep();
  };

  return (
    <div className="additional-people-container">
      <h3 className="form-section-title">Additional Guests</h3>
      <p className="additional-info">
        If any other family member wishes to accompany them, their name and
        relation (It will be considered confirmed only after the approval of the
        Mahasabha)
      </p>

      <form onSubmit={handleSubmit}>
        {!showForm ? (
          <div className="text-center mb-4">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              <i className="fas fa-plus"></i> Add Guest
            </button>
          </div>
        ) : (
          <div className="add-person-form">
            <div className="form-group">
              <label htmlFor="name">Name/नाम</label>
              <input
                type="text"
                className={`form-control ${errors.name ? "is-invalid" : ""}`}
                id="name"
                name="name"
                value={newPerson.name}
                onChange={handleInputChange}
                placeholder="अतिथि का नाम"
              />
              {errors.name && (
                <div className="invalid-feedback">{errors.name}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="relation">Relation/संबंध</label>
              <input
                type="text"
                className={`form-control ${
                  errors.relation ? "is-invalid" : ""
                }`}
                id="relation"
                name="relation"
                value={newPerson.relation}
                onChange={handleInputChange}
                placeholder="अतिथि संबंध"
              />
              {errors.relation && (
                <div className="invalid-feedback">{errors.relation}</div>
              )}
            </div>

            <div className="form-buttons-inline d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-primary add-person-btn"
                onClick={addPerson}
              >
                <i className="fas fa-plus"></i> Add
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setShowForm(false);
                  setNewPerson({ name: "", relation: "" });
                  setErrors({});
                }}
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

export default AdditionalPeople;
