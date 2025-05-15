// components/PaymentConfirmation.js - Payment details and confirmation
import React, { useState } from "react";
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

const PaymentConfirmation = ({ userData, updateUserData, prevStep }) => {
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState("");
  const [registrationId, setRegistrationId] = useState("");

  // Calculate payment amount based on user data
  const calculateAmount = () => {
    let amount = userData.hasHusband ? 1000 : 500;
    // You could add additional cost calculations here if needed
    return amount;
  };

  const saveRegistration = async (db) => {
    try {
      // Check if user already exists
      //   const userQuery = query(
      //     collection(db, "users"),
      //     where("phoneNumber", "==", userData.phoneNumber)
      //   );
      //   const querySnapshot = await getDocs(userQuery);

      //   let userId;

      //   if (!querySnapshot.empty) {
      //     // Update existing user
      //     userId = querySnapshot.docs[0].id;
      //     const userRef = doc(db, "users", userId);
      //     await updateDoc(userRef, {
      //       name: userData.name,
      //       city: userData.city,
      //       state: userData.state,
      //       photoURL: userData.photoURL,
      //     });
      //   } else {
      //     // Create new user
      //     const userDocRef = await addDoc(collection(db, "users"), {
      //       phoneNumber: userData.phoneNumber,
      //       name: userData.name,
      //       city: userData.city,
      //       state: userData.state,
      //       photoURL: userData.photoURL,
      //       createdAt: new Date(),
      //     });
      //     userId = userDocRef.id;
      //   }

      // Save registration data
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
        paymentStatus: "completed",
        registrationDate: new Date(),
      };

      const registrationRef = await addDoc(
        collection(db, "registrations"),
        registrationData
      );
      return registrationRef.id;
    } catch (error) {
      console.error("Error saving registration:", error);
      throw error;
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    setError("");

    try {
      // In a real application, you would integrate with a payment gateway here
      // For demo purposes, we'll simulate a successful payment

      // Mock payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Save registration to Firebase
      const regId = await saveRegistration(window.db); // Assuming db is available from context or props

      setRegistrationId(regId);
      setPaymentSuccess(true);

      // Update the payment status
      updateUserData({
        paymentStatus: "completed",
        paymentAmount: calculateAmount(),
      });
    } catch (error) {
      console.error("Payment failed:", error);
      setError("भुगतान की प्रक्रिया में त्रुटि हुई। कृपया पुनः प्रयास करें।");
    } finally {
      setProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="payment-success">
        <div className="success-icon">
          <i className="fas fa-check-circle"></i>
        </div>
        <h3>पंजीकरण सफल!</h3>
        <p>आपका पंजीकरण सफलतापूर्वक हो गया है।</p>
        <p>
          पंजीकरण आईडी: <strong>{registrationId}</strong>
        </p>
        <p>
          भुगतान राशि: <strong>₹{calculateAmount()}</strong>
        </p>
        <div className="additional-info">
          <p>कृपया इस पंजीकरण आईडी को सहेज कर रखें।</p>
          <p>महत्वपूर्ण अपडेट्स के लिए अपने मोबाइल फोन पर नज़र रखें।</p>
        </div>
      </div>
    );
  }

  const displayRazorpay = async () => {
    const res = await loadScript(
      "https://checkout.razorpay.com/v1/checkout.js"
    );

    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    // // creating a new order
    // const result = await axios.post("http://localhost:5000/payment/orders");

    // if (!result) {
    //   alert("Server error. Are you online?");
    //   return;
    // }

    const order_id = "order_" + Math.random().toString(36).substring(2, 15);
    // Getting the order details back
    const { name, phoneNumber } = userData;

    const options = {
      key: "rzp_test_M2ThxjylDPAQQ5", // Enter the Key ID generated from the Dashboard
      amount: calculateAmount(),
      currency: "INR",
      name: "Soumya Corp.",
      description: "Test Transaction",
      //   image: { logo },
      order_id: "order_QVDmIm1xiKuD6V",
      handler: async function (response) {
        const data = {
          orderCreationId: order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
        };

        console.log("Hererererere", response, data);

        // const result = await axios.post(
        //   "http://localhost:5000/payment/success",
        //   data
        // );

        alert("Success ");
      },
      prefill: {
        name: name,
        email: "",
        contact: phoneNumber,
      },
      notes: {
        address: "Soumya Dey Corporate Office",
      },
      theme: {
        color: "#61dafb",
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

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
          <span>Location/शहर:</span>
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
          className="btn btn-secondary"
          onClick={prevStep}
          disabled={processing}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn-success payment-btn"
          onClick={displayRazorpay}
          //   onClick={handlePayment}
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
