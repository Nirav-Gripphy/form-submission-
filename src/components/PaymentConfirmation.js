// components/PaymentConfirmation.js - Payment details and confirmation
import React, { useState, useRef } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import "../styles/PaymentConfirmation.css";
import { loadScript } from "../helper/loadScript";
import { generate15DigitNumber } from "../helper/generate15DigitNumber";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import { db } from "../services/firebase";

const PaymentConfirmation = ({ userData, updateUserData, prevStep }) => {
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [error, setError] = useState("");
  const [registrationId, setRegistrationId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [orderId, setOrderId] = useState("");
  const receiptRef = useRef(null);

  const reactToPrintFn = useReactToPrint({
    contentRef: receiptRef,
  });

  // Calculate payment amount based on user data
  const calculateAmount = () => {
    let amount = userData.hasHusband ? 1000 : 500;
    // You could add additional cost calculations here if needed
    return amount;
  };

  const saveRegistration = async (paymentDetails = {}) => {
    try {
      // Registration data to save/update
      const registrationData = {
        phoneNumber: userData.phoneNumber,
        name: userData.name,
        city: userData.city,
        state: userData.state,
        photoURL: userData.photoURL,
        hasHusband: userData.hasHusband,
        husbandName: userData.husbandName,
        arrivalDate: userData.arrivalDate,
        arrivalTime: userData.arrivalTime,
        travelMode: userData.travelMode,
        departureDate: userData.departureDate,
        departureTime: userData.departureTime,
        additionalPeople: userData.additionalPeople,
        paymentAmount: calculateAmount(),
        paymentStatus: paymentDetails.status || "failed",
        paymentId: paymentDetails.paymentId || "",
        orderId: paymentDetails.orderId || "",
        updatedAt: new Date(),
      };

      // Add registrationDate only for new records
      if (!registrationId) {
        registrationData.registrationDate = new Date();
      }

      let regId = registrationId;

      console.log("regId --------->", regId);

      if (regId) {
        // Update the existing failed registration
        console.log("Updating existing registration:", regId);
        const registrationDocRef = doc(db, "registrations", regId);
        await updateDoc(registrationDocRef, registrationData);
      } else {
        // Create a new registration
        console.log("Creating new registration");
        const registrationRef = await addDoc(
          collection(db, "registrations"),
          registrationData
        );
        regId = registrationRef.id;
        // Store the registration ID in state for potential retries
        setRegistrationId(regId);
      }

      return regId;
    } catch (error) {
      console.error("Error saving/updating registration:", error);
      throw error;
    }
  };

  const handlePaymentSuccess = async (paymentDetails) => {
    try {
      console.log("Payment success with registrationId:", registrationId);
      // Save/update registration in Firebase
      const regId = await saveRegistration({
        status: "completed",
        paymentId: paymentDetails.razorpayPaymentId,
        orderId: paymentDetails.razorpayOrderId,
      });

      setPaymentId(paymentDetails.razorpayPaymentId);
      setOrderId(paymentDetails.razorpayOrderId);
      setPaymentSuccess(true);
      setPaymentFailed(false);

      // Update the payment status
      updateUserData({
        paymentStatus: "completed",
        paymentAmount: calculateAmount(),
        paymentId: paymentDetails.razorpayPaymentId,
        orderId: paymentDetails.razorpayOrderId,
      });
    } catch (error) {
      console.error("Error processing successful payment:", error);
      setPaymentFailed(true);
      setError(
        "भुगतान सफल हुआ, लेकिन पंजीकरण की प्रक्रिया में त्रुटि हुई। कृपया संपर्क करें।"
      );
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentFailure = async (error) => {
    setProcessing(false);
    setPaymentFailed(true);
    setPaymentSuccess(false);

    try {
      console.log("Payment failed with registrationId:", registrationId);
      // Save/update registration but mark as failed
      await saveRegistration({
        status: "failed",
      });
      // Note: We don't need to setRegistrationId here anymore as it's set in saveRegistration
    } catch (saveError) {
      console.error("Error saving failed payment registration:", saveError);
    }

    setError(
      `भुगतान असफल: ${error.description || error.message || "अज्ञात त्रुटि"}`
    );
  };

  const displayRazorpay = async () => {
    setProcessing(true);
    setError("");

    const res = await loadScript(
      "https://checkout.razorpay.com/v1/checkout.js"
    );

    if (!res) {
      setProcessing(false);
      setPaymentFailed(true);
      setError("Razorpay SDK failed to load. Are you online?");
      return;
    }

    const amount = calculateAmount() * 100;

    try {
      const response = await axios.post(
        "https://beti-terapanth-ki.griphhy.com/razorpay-order-api.php",
        {
          amount: amount,
          currency: "INR",
        }
      );

      if (response?.data) {
        const order_id = response?.data?.id;
        // Getting the order details back
        const { name, phoneNumber } = userData;

        const options = {
          key: process.env.REACT_APP_RAZORPAY_API_KEY,
          amount: amount,
          currency: "INR",
          name: "BETI TERAPANTH KI Registration",
          description: "Registration Payment",
          //   image: { logo },
          order_id: order_id,
          handler: async function (response) {
            const paymentDetails = {
              orderCreationId: order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            };
            await handlePaymentSuccess(paymentDetails);
          },
          prefill: {
            name: name,
            email: "",
            contact: phoneNumber,
          },
          notes: {
            address: "Beti Terapanth Ki Office",
          },
          theme: {
            color: "#61dafb",
          },
          modal: {
            ondismiss: function () {
              setProcessing(false);
            },
          },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.on("payment.failed", function (response) {
          handlePaymentFailure(response.error);
        });
        paymentObject.open();
      }
    } catch (error) {
      console.error(error);
      handlePaymentFailure(error);
    }
  };

  // Payment Success View
  const PaymentSuccessView = () => (
    <div className="payment-success" ref={receiptRef}>
      <div className="receipt-header">
        <h2>BETI TERAPANTH KI</h2>
        <p>Payment Receipt</p>
      </div>

      <div className="success-icon">
        <i className="fas fa-check-circle"></i>
      </div>

      <h3>पंजीकरण सफल!</h3>
      <p>आपका पंजीकरण सफलतापूर्वक हो गया है।</p>

      <div className="registration-details">
        <div className="detail-item">
          <span>पंजीकरण आईडी:</span>
          <span>{registrationId}</span>
        </div>

        <div className="detail-item">
          <span>नाम:</span>
          <span>{userData.name}</span>
        </div>

        <div className="detail-item">
          <span>मोबाइल:</span>
          <span>{userData.phoneNumber}</span>
        </div>

        <div className="detail-item">
          <span>स्थान:</span>
          <span>
            {userData.city}, {userData.state}
          </span>
        </div>

        {userData.hasHusband && (
          <div className="detail-item">
            <span>जीवनसाथी:</span>
            <span>{userData.husbandName}</span>
          </div>
        )}

        <div className="detail-item">
          <span>आगमन:</span>
          <span>
            {userData.arrivalDate} - {userData.arrivalTime}
          </span>
        </div>

        <div className="detail-item">
          <span>प्रस्थान:</span>
          <span>
            {userData.departureDate} - {userData.departureTime}
          </span>
        </div>

        <div className="detail-item">
          <span>यात्रा माध्यम:</span>
          <span>{userData.travelMode}</span>
        </div>

        <div className="detail-item payment-details">
          <span>भुगतान राशि:</span>
          <span>₹{calculateAmount()}</span>
        </div>

        <div className="detail-item">
          <span>भुगतान आईडी:</span>
          <span>{paymentId}</span>
        </div>

        <div className="detail-item">
          <span>ऑर्डर आईडी:</span>
          <span>{orderId}</span>
        </div>

        <div className="detail-item">
          <span>दिनांक:</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <div className="additional-info">
        <p>कृपया इस पंजीकरण आईडी को सहेज कर रखें।</p>
        <p>महत्वपूर्ण अपडेट्स के लिए अपने मोबाइल फोन पर नज़र रखें।</p>
      </div>

      <div className="footer-note">
        <p>धन्यवाद!</p>
      </div>
    </div>
  );

  // Payment Failed View
  const PaymentFailedView = () => (
    <div className="payment-failed">
      <div className="failed-icon">
        <i className="fas fa-times-circle"></i>
      </div>

      <h3>भुगतान असफल</h3>
      <p>{error}</p>

      {registrationId && (
        <div className="failed-registration-id">
          <p>
            पंजीकरण संदर्भ आईडी: <strong>{registrationId}</strong>
          </p>
          <p>कृपया समस्या के समाधान के लिए इस आईडी का उल्लेख करें।</p>
        </div>
      )}

      <div className="retry-options">
        <p>कृपया पुनः प्रयास करें या वैकल्पिक भुगतान विधि का उपयोग करें।</p>
        <button
          className="btn btn-primary retry-btn"
          onClick={() => {
            // Just clear error and payment failed state, but KEEP the registrationId
            setPaymentFailed(false);
            setError("");
            // No need to reset registrationId here
          }}
        >
          पुनः प्रयास करें
        </button>

        <p className="contact-support">
          समस्या बनी रहने पर कृपया हमसे संपर्क करें:{" "}
          <strong>support@betiterapanthki.org</strong>
        </p>
      </div>
    </div>
  );

  // Render based on payment state
  if (paymentSuccess) {
    return (
      <div className="payment-result-container">
        <div ref={receiptRef}>
          <PaymentSuccessView />
        </div>
        <div className="download-options">
          <button
            className="btn btn-primary download-btn"
            onClick={reactToPrintFn}
          >
            <i className="fas fa-download"></i> रसीद डाउनलोड करें
          </button>
          <button
            className="btn btn-secondary done-btn"
            onClick={() => {
              // Additional action if needed when done
              // For example, redirect to home or profile page
              updateUserData({
                name: "",
                phoneNumber: "",
                city: "",
                state: "",
                photoURL: "",
                hasHusband: false,
                husbandName: "",
                arrivalDate: "",
                arrivalTime: "",
                travelMode: "",
                departureDate: "",
                departureTime: "",
                additionalPeople: [],
                paymentStatus: "",
                paymentAmount: 0,
                paymentId: "",
                orderId: "",
              });
              window.location.reload();
            }}
          >
            पूर्ण
          </button>
        </div>
      </div>
    );
  }

  if (paymentFailed) {
    return <PaymentFailedView />;
  }

  // Default payment form view
  return (
    <div className="payment-container">
      <h3 className="form-section-title">Payment Details</h3>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="payment-summary">
        <div className="summary-item">
          <span>Name/नाम:</span>
          <span>{userData.name}</span>
        </div>

        <div className="summary-item">
          <span>M. No/मोबाइल:</span>
          <span>{userData.phoneNumber}</span>
        </div>

        <div className="summary-item">
          <span>Place/स्थान:</span>
          <span>{[userData?.city, userData?.state].join(", ")}</span>
        </div>

        {userData.hasHusband && (
          <div className="summary-item">
            <span>जीवनसाथी:</span>
            <span>{userData.husbandName}</span>
          </div>
        )}

        <div className="summary-item payment-amount">
          <span>कुल राशि:</span>
          <span>₹{calculateAmount()}</span>
        </div>

        <div className="payment-details">
          <h4>Payment Details</h4>
          <p>
            <strong>Single Registration/एकल पंजीकरण:</strong> ₹500
            <br />
            <strong>With Spouse/जीवनसाथी के साथ:</strong> ₹1000
          </p>
        </div>
      </div>

      <div className="form-buttons">
        <button
          type="button"
          className="btn btn-secondary secondry-cutom-btn"
          onClick={prevStep}
          disabled={processing}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn-success primary-custom-btn"
          onClick={displayRazorpay}
          disabled={processing}
        >
          {processing ? (
            <span>
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
              <span className="ms-2">Loading...</span>
            </span>
          ) : (
            `Pay Amount - ₹${calculateAmount()}`
          )}
        </button>
      </div>
    </div>
  );
};

export default PaymentConfirmation;
