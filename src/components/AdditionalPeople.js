// components/AdditionalPeople.js - Form for additional attendees
import React, { useState } from "react";
import "../styles/AdditionalPeople.css";

const AdditionalPeople = ({ userData, updateUserData, nextStep, prevStep }) => {
  const [localData, setLocalData] = useState({
    additionalPeople: userData.additionalPeople || [],
  });

  const [newPerson, setNewPerson] = useState({
    name: "",
    relation: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setNewPerson((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addPerson = () => {
    if (!newPerson.name || !newPerson.relation) return;

    setLocalData((prev) => ({
      additionalPeople: [
        ...prev.additionalPeople,
        { ...newPerson, id: Date.now() },
      ],
    }));

    // Reset the form
    setNewPerson({ name: "", relation: "" });
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
      <h3 className="form-section-title">Other guests</h3>
      <p className="additional-info">
        If any other family member wishes to accompany them, their name and
        relation (It will be considered confirmed only after the approval of the
        Mahasabha)
      </p>

      <form onSubmit={handleSubmit}>
        <div className="add-person-form">
          <div className="form-group">
            <label htmlFor="name">Name/नाम</label>
            <input
              type="text"
              className="form-control"
              id="name"
              name="name"
              value={newPerson.name}
              onChange={handleInputChange}
              placeholder="Guest name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="relation">Relation/संबंध</label>
            <input
              type="text"
              className="form-control"
              id="relation"
              name="relation"
              value={newPerson.relation}
              onChange={handleInputChange}
              placeholder="Guest relation"
            />
          </div>

          <button
            type="button"
            className="btn btn-outline-primary add-person-btn"
            onClick={addPerson}
            disabled={!newPerson.name || !newPerson.relation}
          >
            <i className="fas fa-plus"></i> Add
          </button>
        </div>

        {localData.additionalPeople.length > 0 && (
          <div className="additional-people-list">
            <h4>Extra Guests</h4>
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

export default AdditionalPeople;
