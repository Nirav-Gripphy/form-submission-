// components/PaymentConfirmation.js - Payment details and confirmation
import { useState, useRef, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import "../styles/PaymentConfirmation.css";
import { loadScript } from "../helper/loadScript";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import { db } from "../services/firebase";
import JsBarcode from "jsbarcode"; // Import JsBarcode library
import { PaymentSuccessView } from "./PaymentSuccessView";
import UserPassCard from "./UserPassCard";
import SpousePassCard from "./SpousePassCard";

const PaymentConfirmation = ({ userData, updateUserData, prevStep }) => {
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [error, setError] = useState("");
  const [registrationId, setRegistrationId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [primaryBarcodeData, setPrimaryBarcodeData] = useState("");
  const [spouseBarcodeData, setSpouseBarcodeData] = useState("");
  const receiptRef = useRef(null);
  const primaryBarcodeImageRef = useRef(null);
  const spouseBarcodeImageRef = useRef(null);
  const primaryBarcodeRef = useRef(null);
  const primaryBarcodePrintRef = useRef(null);
  const spouseBarcodeRef = useRef(null);
  const spouseBarcodePrintRef = useRef(null);

  useEffect(() => {
    if (userData.paymentStatus === "completed") {
      setPaymentSuccess(true);
      setPaymentId(userData.paymentId);
      setOrderId(userData.orderId);
      setRegistrationId(userData.id);

      // Set primary barcode data if available in userData
      if (userData.primaryBarcodeId) {
        setPrimaryBarcodeData(userData?.primaryBarcodeId);
      }

      // Set spouse barcode data if user has husband and barcode is available
      if (userData.hasHusband && userData.spouseBarcodeId) {
        setSpouseBarcodeData(userData.spouseBarcodeId);
      }
    }
  }, [userData]);

  useEffect(() => {
    // Generate primary barcode when barcodeData is available and component is mounted
    if (primaryBarcodeData && primaryBarcodeRef.current) {
      try {
        JsBarcode(primaryBarcodeRef.current, primaryBarcodeData, {
          format: "CODE128",
          lineColor: "#000",
          width: 1.5, // Reduced width
          height: 50, // Reduced height
          displayValue: true,
          fontSize: 12, // Smaller font size
          margin: 5, // Smaller margin
          background: "#fff",
        });
        JsBarcode(primaryBarcodePrintRef.current, primaryBarcodeData, {
          format: "CODE128",
          lineColor: "#000",
          width: 1.5, // Reduced width
          height: 50, // Reduced height
          displayValue: true,
          fontSize: 12, // Smaller font size
          margin: 5, // Smaller margin
          background: "#fff",
        });
      } catch (error) {
        console.error("Error generating primary barcode:", error);
      }
    }

    // Generate spouse barcode when data is available and user has husband
    if (userData.hasHusband && spouseBarcodeData && spouseBarcodeRef.current) {
      try {
        JsBarcode(spouseBarcodeRef.current, spouseBarcodeData, {
          format: "CODE128",
          lineColor: "#000",
          width: 1.5,
          height: 50,
          displayValue: true,
          fontSize: 12,
          margin: 5,
          background: "#fff",
        });
        JsBarcode(spouseBarcodePrintRef.current, spouseBarcodeData, {
          format: "CODE128",
          lineColor: "#000",
          width: 1.5,
          height: 50,
          displayValue: true,
          fontSize: 12,
          margin: 5,
          background: "#fff",
        });
      } catch (error) {
        console.error("Error generating spouse barcode:", error);
      }
    }
  }, [
    primaryBarcodeData,
    spouseBarcodeData,
    userData.hasHusband,
    paymentSuccess,
    spouseBarcodeRef,
    primaryBarcodeRef,
  ]);

  const reactToPrintFn = useReactToPrint({
    contentRef: receiptRef,
  });

  const reactToPrintPrimaryPassFn = useReactToPrint({
    contentRef: primaryBarcodeImageRef,
  });
  const reactToPrintSpousePassFn = useReactToPrint({
    contentRef: spouseBarcodeImageRef,
  });

  // Function to get the next barcode number from Firebase
  const getNextBarcodeNumber = async () => {
    try {
      // Query to get the latest registration with a barcode
      const registrationsRef = collection(db, "registrations");
      const q = query(
        registrationsRef,
        where("primaryBarcodeId", ">=", "B-"), // Look for barcodes starting with B-
        orderBy("primaryBarcodeId", "desc"), // Order by barcode ID in descending order
        limit(1) // Get only the latest one
      );

      const querySnapshot = await getDocs(q);

      // Default starting number if no barcodes exist yet
      let nextNumber = 1;

      if (!querySnapshot.empty) {
        // Get the latest barcode ID
        const latestDoc = querySnapshot.docs[0];
        const latestBarcodeId = latestDoc.data().primaryBarcodeId;

        // Extract the number part (after "B-")
        const numberPart = latestBarcodeId.split("-")[1];
        // Convert to number and increment
        nextNumber = parseInt(numberPart, 10) + 1;
      }

      // Format the number with leading zeros (e.g. 00001)
      const formattedNumber = String(nextNumber).padStart(5, "0");

      return {
        primaryBarcodeId: `B-${formattedNumber}`,
        spouseBarcodeId: `D-${formattedNumber}`,
      };
    } catch (error) {
      console.error("Error getting next barcode number:", error);
      // Fallback to default format with timestamp if there's an error
      const timestamp = Date.now();
      return {
        primaryBarcodeId: `B-${timestamp}`,
        spouseBarcodeId: `D-${timestamp}`,
      };
    }
  };

  // Calculate payment amount based on user data
  const calculateAmount = () => {
    let amount = userData.hasHusband ? 1000 : 500;
    // You could add additional cost calculations here if needed
    return amount;
  };

  const saveRegistration = async (paymentDetails = {}, barcodeData = {}) => {
    try {
      // Generate attendee count for barcode
      const attendeeCount = userData.hasHusband ? "2" : "1";

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
        arrivalTravelMode: userData.arrivalTravelMode,
        departureDate: userData.departureDate,
        departureTime: userData.departureTime,
        departureTravelMode: userData.departureTravelMode,
        additionalPeople: userData.additionalPeople,
        paymentAmount: calculateAmount(),
        paymentStatus: paymentDetails.status || "failed",
        paymentId: paymentDetails.paymentId || "",
        orderId: paymentDetails.orderId || "",
        attendeeCount: attendeeCount,
        primaryBarcodeId: barcodeData.primaryBarcodeId || "",
        updatedAt: new Date(),
      };

      // Add spouse barcode ID if user has husband
      if (userData.hasHusband) {
        registrationData.spouseBarcodeId = barcodeData.spouseBarcodeId || "";
      }

      // Add registrationDate only for new records
      if (!registrationId) {
        registrationData.registrationDate = new Date();
      }

      let regId = registrationId;

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

      // Get next barcode numbers
      const barcodeData = await getNextBarcodeNumber();

      // Save/update registration in Firebase with the barcode data
      const regId = await saveRegistration(
        {
          status: "completed",
          paymentId: paymentDetails.razorpayPaymentId,
          orderId: paymentDetails.razorpayOrderId,
        },
        barcodeData
      );

      setPaymentId(paymentDetails.razorpayPaymentId);
      setOrderId(paymentDetails.razorpayOrderId);
      setPaymentSuccess(true);
      setPaymentFailed(false);

      // Set barcode data for display
      setPrimaryBarcodeData(barcodeData.primaryBarcodeId);
      if (userData.hasHusband) {
        setSpouseBarcodeData(barcodeData.spouseBarcodeId);
      }

      // Update the payment status and user data
      const updatedData = {
        paymentStatus: "completed",
        paymentAmount: calculateAmount(),
        paymentId: paymentDetails.razorpayPaymentId,
        orderId: paymentDetails.razorpayOrderId,
        id: regId,
        primaryBarcodeId: barcodeData.primaryBarcodeId,
      };

      // Add spouse barcode ID if exists
      if (userData.hasHusband) {
        updatedData.spouseBarcodeId = barcodeData.spouseBarcodeId;
      }

      updateUserData(updatedData);
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
          <PaymentSuccessView
            receiptRef={receiptRef}
            userData={userData}
            reactToPrintFn={reactToPrintFn}
            primaryBarcodeRef={primaryBarcodeRef}
            reactToPrintSpousePassFn={reactToPrintSpousePassFn}
            reactToPrintPrimaryPassFn={reactToPrintPrimaryPassFn}
            paymentId={paymentId}
            primaryBarcodeData={primaryBarcodeData}
            spouseBarcodeRef={spouseBarcodeRef}
            spouseBarcodeData={spouseBarcodeData}
            primaryBarcodeImageRef={primaryBarcodeImageRef}
            spouseBarcodeImageRef={spouseBarcodeImageRef}
            primaryBarcodePrintRef={primaryBarcodePrintRef}
            spouseBarcodePrintRef={spouseBarcodePrintRef}
          />
        </div>

        <UserPassCard
          userData={userData}
          barcodeRef={primaryBarcodePrintRef}
          cardRef={primaryBarcodeImageRef}
        />

        {userData.hasHusband && (
          <SpousePassCard
            userData={userData}
            barcodeRef={spouseBarcodePrintRef}
            cardRef={spouseBarcodeImageRef}
          />
        )}
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
