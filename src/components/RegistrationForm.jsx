import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  runTransaction,
} from "firebase/firestore";
import PhoneInput from "./PhoneInput";
import PersonalInfo from "./PersonalInfo";
import ArrivalInfo from "./ArrivalInfo";
import DepartureInfo from "./DepartureInfo";
import AdditionalPeople from "./AdditionalPeople";
import PaymentConfirmation from "./PaymentConfirmation";
import ProgressBar from "./ProgressBar";
import "../styles/RegistrationForm.css";
import { NoRegistation } from "./NoRegistation";
import { clippingParents } from "@popperjs/core";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

const RegistrationForm = ({ db, storage }) => {
  // Registration closing date - Today at 12:00 PM IST for testing
  const REGISTRATION_CLOSE_DATE = new Date("2026-07-03");
  REGISTRATION_CLOSE_DATE.setHours(23, 59, 0, 0); // Set to 12:00 PM today

  const [step, setStep] = useState(0);
  const [isRegistrationClosed, setIsRegistrationClosed] = useState(false);
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
    registrationId: null, // Add this to track the document ID
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userExists, setUserExists] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);

  // Check if registration is closed using IST timezone
  const checkRegistrationStatus = () => {
    // Get current time in IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istTime = new Date(now.getTime() + istOffset);

    // For testing, we're using today at 12:00 PM
    const closeTime = new Date(REGISTRATION_CLOSE_DATE);

    // Convert close time to IST for comparison
    const istCloseTime = new Date(closeTime.getTime() + istOffset);

    setIsRegistrationClosed(istTime > istCloseTime);
  };

  // Check registration status on component mount and every second
  useEffect(() => {
    checkRegistrationStatus();

    // Set up interval to check every second for real-time updates
    const interval = setInterval(checkRegistrationStatus, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

  // Check if user exists in Firebase
  const checkUserExists = async (phoneNumber) => {
    // Don't allow new registrations if closed
    if (isRegistrationClosed) {
      setError("रजिस्ट्रेशन बंद हो गया है।");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: Check in 'registration' collection
      const registrationQuery = query(
        collection(db, "registration-2026"),
        where("phoneNumber", "==", phoneNumber),
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
          registrationId: registrationSnapshot.docs[0].id, // Store the ID
          // Add more fields as per your data model
          ...regData,
          id: registrationSnapshot.docs[0].id,
        });

        setRegistrationId(registrationSnapshot.docs[0].id);
        setUserExists(true);
        setStep(regData?.paymentStatus === "pending" ? 1 : 5); // Step for already registered users
        return;
      }

      // Step 2: Check in 'users' collection
      const userQuery = query(
        collection(db, "users"),
        where("Contact No", "==", Number(phoneNumber)),
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
        setStep(6);
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

  const generateUniqueBarcode = async () => {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const result = await runTransaction(db, async (transaction) => {
          // Reference to the counter document
          const counterRef = doc(db, "counter-2026", "barcodeCounter");

          // Get current counter value
          const counterDoc = await transaction.get(counterRef);

          let nextNumber;
          if (!counterDoc.exists()) {
            // Initialize counter if it doesn't exist
            nextNumber = 1;
            transaction.set(counterRef, {
              count: nextNumber,
              lastUpdated: new Date(),
            });
          } else {
            // Increment the counter atomically
            nextNumber = counterDoc.data().count + 1;
            transaction.update(counterRef, {
              count: nextNumber,
              lastUpdated: new Date(),
            });
          }

          // Format the number with leading zeros
          const formattedNumber = String(nextNumber).padStart(5, "0");

          return {
            primaryBarcodeId: `B-${formattedNumber}`,
            spouseBarcodeId: `D-${formattedNumber}`,
            barcodeNumber: nextNumber,
          };
        });

        return result;
      } catch (error) {
        attempt++;
        console.error(`Barcode generation attempt ${attempt} failed:`, error);

        if (attempt >= maxRetries) {
          // Fallback to timestamp-based barcode if all retries fail
          const timestamp = Date.now();
          const randomSuffix = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0");
          return {
            primaryBarcodeId: `B-${timestamp}-${randomSuffix}`,
            spouseBarcodeId: `D-${timestamp}-${randomSuffix}`,
            barcodeNumber: timestamp,
          };
        }

        // Wait briefly before retry
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
      }
    }
  };

  // Updated user data function with barcode generation
  const updateUserData = async (data) => {
    // First update the local state
    const updatedData = { ...userData, ...data };
    setUserData(updatedData);

    // Only save to database if we're past step 0 (phone verification)
    if (step > 0) {
      try {
        const registrationData = {
          ...updatedData,
          updatedAt: new Date(),
          registrationStep: step,
        };

        if (registrationId) {
          // Update existing registration
          const registrationDocRef = doc(
            db,
            "registration-2026",
            registrationId,
          );
          await updateDoc(registrationDocRef, registrationData);
        } else {
          // Generate unique barcode for new registration
          const barcodeData = await generateUniqueBarcode();

          // Create new registration entry with barcode
          const docRef = await addDoc(collection(db, "registration-2026"), {
            ...registrationData,
            ...barcodeData,
            createdAt: new Date(),
          });

          // Save the registration ID in userData for future updates
          const newRegistrationId = docRef.id;
          setRegistrationId(newRegistrationId);
          setUserData((prevData) => ({
            ...prevData,
            registrationId: newRegistrationId,
            id: newRegistrationId,
            ...barcodeData, // Include barcode data in local state
          }));
        }
      } catch (error) {
        console.error("Error saving registration data:", error);
        setError("डेटा सेव करने में त्रुटि हुई। कृपया पुनः प्रयास करें।");
      }
    }
  };

  // Handle file upload
  const handleFileUpload = async (
    file,
    targetRegistrationId = registrationId,
  ) => {
    if (!file) return null;

    const storageRef = ref(
      storage,
      `registration-2026/${targetRegistrationId}/${file.name}_${Date.now()}`,
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
        },
      );
    });
  };

  const deleteFileByUrl = async (fileURL) => {
    if (!fileURL) return;
    try {
      const fileRef = ref(storage, fileURL);
      await deleteObject(fileRef);
    } catch (deleteError) {
      // Continue flow even if old file is already missing or URL is invalid.
      console.error("Error deleting old ticket file:", deleteError);
    }
  };

  const ensureRegistrationId = async () => {
    if (registrationId) return registrationId;

    const barcodeData = await generateUniqueBarcode();
    const docRef = await addDoc(collection(db, "registration-2026"), {
      ...userData,
      ...barcodeData,
      registrationStep: step,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const newRegistrationId = docRef.id;
    setRegistrationId(newRegistrationId);
    setUserData((prevData) => ({
      ...prevData,
      registrationId: newRegistrationId,
      id: newRegistrationId,
      ...barcodeData,
    }));

    return newRegistrationId;
  };

  // Navigate to next step with optional upload processing
  const nextStep = async (stepData = {}) => {
    try {
      setLoading(true);
      let processedData = { ...stepData };

      if (processedData.arrivalTicketFile) {
        const safeRegistrationId = await ensureRegistrationId();
        await deleteFileByUrl(userData.arrivalTicketURL);
        const downloadURL = await handleFileUpload(
          processedData.arrivalTicketFile,
          safeRegistrationId,
        );
        processedData.arrivalTicketURL = downloadURL;
        processedData.arrivalTicketFileName =
          processedData.arrivalTicketFile.name;
        delete processedData.arrivalTicketFile;
        if (!safeRegistrationId) return;
      }

      if (processedData.departureTicketFile) {
        const safeRegistrationId = await ensureRegistrationId();
        await deleteFileByUrl(userData.departureTicketURL);
        const downloadURL = await handleFileUpload(
          processedData.departureTicketFile,
          safeRegistrationId,
        );
        processedData.departureTicketURL = downloadURL;
        processedData.departureTicketFileName =
          processedData.departureTicketFile.name;
        delete processedData.departureTicketFile;
        if (!safeRegistrationId) return;
      }

      if (processedData.removeArrivalTicket) {
        processedData.arrivalTicketURL = "";
        processedData.arrivalTicketFileName = "";
      }
      delete processedData.removeArrivalTicket;

      if (processedData.removeDepartureTicket) {
        processedData.departureTicketURL = "";
        processedData.departureTicketFileName = "";
      }
      delete processedData.removeDepartureTicket;

      if (Object.keys(processedData).length > 0) {
        await updateUserData(processedData);
      }

      setStep((prevStep) => prevStep + 1);
    } catch (uploadError) {
      console.error("Error in next step:", uploadError);
      setError("टिकट अपलोड करने में त्रुटि हुई। कृपया पुनः प्रयास करें।");
    } finally {
      setLoading(false);
    }
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

  // Registration closed component
  const RegistrationClosed = () => {
    return (
      <div
        className="registration-closed-container"
        style={{ textAlign: "center", padding: "2rem" }}
      >
        <h2
          style={{ color: "#e74c3c", marginBottom: "1rem", fontWeight: "600" }}
        >
          रजिस्ट्रेशन की समय सीमा संपन्न हो चुकी है।
        </h2>
      </div>
    );
  };

  const renderStep = () => {
    // If registration is closed and we're on step 0 (phone input), show closed message
    if (isRegistrationClosed && step === 0) {
      return <RegistrationClosed />;
    }

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
            nextStep={nextStep}
            prevStep={prevStep}
            loading={loading}
          />
        );
      case 2:
        return (
          <ArrivalInfo
            userData={userData}
            updateUserData={updateUserData}
            nextStep={nextStep}
            prevStep={prevStep}
            loading={loading}
          />
        );
      case 3:
        return (
          <DepartureInfo
            userData={userData}
            updateUserData={updateUserData}
            nextStep={nextStep}
            prevStep={prevStep}
            loading={loading}
          />
        );
      case 4:
        return (
          <AdditionalPeople
            userData={userData}
            updateUserData={updateUserData}
            nextStep={nextStep}
            prevStep={prevStep}
            loading={loading}
          />
        );
      case 5:
        return (
          <PaymentConfirmation
            userData={userData}
            updateUserData={updateUserData}
            storage={storage}
            prevStep={prevStep}
            loading={loading}
          />
        );
      case 6:
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
              src="./header-logo.png"
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

          {step > 0 && step !== 6 && !isRegistrationClosed && (
            <ProgressBar currentStep={step} totalSteps={5} />
          )}

          {step === 0 && !isRegistrationClosed && (
            <div className="mt-3 text-center">
              <h4
                className=""
                style={{
                  fontWeight: 600,
                }}
              >
                चतुर्थ सम्मलेन रजिस्ट्रेशन
              </h4>
              <span>1 - 2 अगस्त 2026 </span>
            </div>
          )}

          <div className="form-content">{renderStep()}</div>
        </div>
      </div>
      {step === 0 && !isRegistrationClosed && (
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
            alt="footer_svg"
            style={{ maxWidth: "340px", marginTop: "0px", paddingTop: "0px" }}
          />
        </footer>
      )}
    </>
  );
};

export default RegistrationForm;
