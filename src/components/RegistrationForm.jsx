import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import PhoneInput from "./PhoneInput";
import PersonalInfo from "./PersonalInfo";
import TravelingInfo from "./TravelingInfo";
import AdditionalPeople from "./AdditionalPeople";
import PaymentConfirmation from "./PaymentConfirmation";
import ProgressBar from "./ProgressBar";
import "../styles/RegistrationForm.css";
import { NoRegistation } from "./NoRegistation";

const RegistrationForm = ({ db, storage }) => {
  const [step, setStep] = useState(0);
  const [userData, setUserData] = useState({
    phoneNumber: "",
    name: "",
    city: "",
    state: "",
    photoURL: "",
    hasHusband: false,
    husbandName: "",
    arrivalDate: "",
    arrivalTime: "",
    arrivalTravelMode: "",
    departureTravelMode: "",
    departureDate: "",
    departureTime: "",
    additionalPeople: [],
    paymentAmount: 500,
    paymentStatus: "pending",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userExists, setUserExists] = useState(false);

  // Check if user exists in Firebase
  const checkUserExists = async (phoneNumber) => {
    setLoading(true);
    setError("");

    try {
      // Step 1: Check in 'registration' collection
      const registrationQuery = query(
        collection(db, "registrations"),
        where("phoneNumber", "==", phoneNumber)
      );
      const registrationSnapshot = await getDocs(registrationQuery);

      if (!registrationSnapshot.empty) {
        const regData = registrationSnapshot.docs[0].data();

        setUserData({
          name: regData.name || "",
          city: regData.city || "",
          state: regData.state || "",
          phoneNumber: regData.phoneNumber || phoneNumber,
          photoURL: regData.photoURL || "",
          // Add more fields as per your data model
          ...regData,
          id: registrationSnapshot.docs[0].id,
        });

        setUserExists(true);
        setStep(4); // Step for already registered users
        return;
      }

      // Step 2: Check in 'users' collection
      const userQuery = query(
        collection(db, "users"),
        where("Contact No", "==", Number(phoneNumber))
      );
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();

        setUserData((prevData) => ({
          ...prevData,
          name: userData.Name || "",
          city: userData.City || "",
          state: userData.State || "",
          phoneNumber,
          photoURL: userData.photoURL || "",
          husbandName: userData[`Husband's Name`],
        }));

        setUserExists(true);
        setStep(1); // Step for partial users
      } else {
        // Step 3: Not found anywhere — redirect
        // const googleFormUrl = process.env.REACT_APP_GOOGLE_FORM;
        // window.location.href = googleFormUrl;
        setStep(5);
        setUserData((prevData) => ({
          phoneNumber,
        }));
      }
    } catch (error) {
      console.error("Error checking user:", error);
      setError("कृपया बाद में पुनः प्रयास करें।");
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!file) return null;

    const storageRef = ref(
      storage,
      `photos/${userData.phoneNumber}_${Date.now()}`
    );
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Progress can be tracked here if needed
        },
        (error) => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        }
      );
    });
  };

  // Update form data
  const updateUserData = (data) => {
    setUserData((prevData) => ({
      ...prevData,
      ...data,
    }));
  };

  // Navigate to next step
  const nextStep = () => {
    setStep((prevStep) => prevStep + 1);
  };

  // Navigate to previous step
  const prevStep = () => {
    setStep((prevStep) => Math.max(0, prevStep - 1));
  };

  // Calculate payment amount based on selections
  useEffect(() => {
    let amount = userData.hasHusband ? 1000 : 500;
    // Add additional people cost if needed
    setUserData((prevData) => ({
      ...prevData,
      paymentAmount: amount,
    }));
  }, [userData.hasHusband]);

  // Render the appropriate form step
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <PhoneInput
            phoneNumber={userData.phoneNumber}
            updateUserData={updateUserData}
            checkUserExists={checkUserExists}
            loading={loading}
            error={error}
          />
        );
      case 1:
        return (
          <PersonalInfo
            userData={userData}
            updateUserData={updateUserData}
            handleFileUpload={handleFileUpload}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 2:
        return (
          <TravelingInfo
            userData={userData}
            updateUserData={updateUserData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <AdditionalPeople
            userData={userData}
            updateUserData={updateUserData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 4:
        return (
          <PaymentConfirmation
            userData={userData}
            updateUserData={updateUserData}
            prevStep={prevStep}
          />
        );
      case 5:
        return (
          <NoRegistation
            userData={userData}
            updateUserData={updateUserData}
            prevStep={prevStep}
          />
        );
      default:
        return (
          <PhoneInput
            phoneNumber={userData.phoneNumber}
            updateUserData={updateUserData}
            checkUserExists={checkUserExists}
            loading={loading}
            error={error}
          />
        );
    }
  };

  return (
    <>
      <div className="registration-container">
        <div className="header">
          <div className="logo-container">
            <img
              src="https://beti-terapanth-ki.griphhy.com/assets/img/bizconnect-logo-new%20(1).png"
              alt="Jain Śvetāmbara Terapanth Mahasabha"
              className="logo"
              style={{
                height: "50px",
                width: "inherit",
              }}
            />
          </div>
        </div>

        <div className="form-card">
          <div className="beti-logo-container">
            <img
              src="./logo-with-star.svg"
              alt="Jain Śvetāmbara Terapanth Mahasabha"
              className="logo"
              style={{
                height: step > 0 ? "80px" : "100%",
                width: "inherit",
              }}
            />
          </div>

          {step > 0 && step !== 5 && (
            <ProgressBar currentStep={step} totalSteps={4} />
          )}

          {step === 0 && (
            <div className="mt-3 text-center">
              <h4
                className=""
                style={{
                  fontWeight: 600,
                }}
              >
                तृतीय सम्मलेन रजिस्ट्रेशन
              </h4>
              <span>26- 27 जुलाई 2025 </span>
            </div>
          )}

          <div className="form-content">{renderStep()}</div>
        </div>
      </div>
      {step === 0 && (
        <footer
          style={{
            position: "absolute",
            width: "100%",
            bottom: "0px",
            zIndex: "1",
            textAlign: "center",
          }}
        >
          <img
            src="./footer.svg"
            style={{ maxWidth: "340px", marginTop: "0px", paddingTop: "0px" }}
          />
        </footer>
      )}
    </>
  );
};

export default RegistrationForm;
