import React from "react";
import "../styles/ProgressBar.css";

const ProgressBar = ({ currentStep, totalSteps }) => {
  const steps = [
    { id: 1, label: "व्यक्तिगत जानकारी" },
    { id: 2, label: "यात्रा की जानकारी" },
    { id: 3, label: "अतिरिक्त अतिथि" },
    { id: 4, label: "भुगतान" },
  ];

  return (
    <div className="progress-container">
      <ul className="progress-steps">
        {steps.map((step) => (
          <li
            key={step.id}
            className={`progress-step ${
              currentStep >= step.id ? "active" : ""
            }`}
          >
            <div className="step-indicator">
              {currentStep > step.id ? (
                <i className="fas fa-check"></i>
              ) : (
                step.id
              )}
            </div>
            <span className="step-label">{step.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProgressBar;
