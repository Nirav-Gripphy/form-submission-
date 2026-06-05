// components/PaymentConfirmation.js
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
import { db } from "../services/firebase";
import JsBarcode from "jsbarcode";
import { PaymentSuccessView } from "./PaymentSuccessView";
import UserPassCard from "./UserPassCard";
import SpousePassCard from "./SpousePassCard";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ─────────────────────────────────────────────
// Shared PDF helper
// ─────────────────────────────────────────────
const generatePassPDF = async (element, filename = "document.pdf") => {
  if (!element) {
    console.error("generatePDF: element is null");
    return;
  }

  const prevStyle = element.getAttribute("style") || "";

  // Reveal element off-screen
  element.style.cssText =
    "display:block !important; visibility:visible !important; position:fixed; left:-9999px; top:0; z-index:-1; background:#fff;";

  await new Promise((resolve) => setTimeout(resolve, 200));
  await document.fonts.ready;

  try {
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      scale: 3,
      logging: false,
      onclone: (clonedDoc) => {
        // Fix transparent SVG barcode backgrounds
        clonedDoc.querySelectorAll("svg rect").forEach((rect) => {
          rect.style.fill = "#ffffff";
        });
        // Make sure cloned element is visible
        clonedDoc.querySelectorAll("[data-pdf-target]").forEach((el) => {
          el.style.cssText =
            "display:block !important; visibility:visible !important;";
        });
      },
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const A4_W = 210;
    const A4_H = 297;

    const ratio = canvas.height / canvas.width;
    const imgW = A4_W;
    const imgH = imgW * ratio;
    const yOffset = Math.max(0, (A4_H - imgH) / 2);

    pdf.addImage(imgData, "PNG", 0, yOffset, imgW, Math.min(imgH, A4_H));
    pdf.save(filename);
  } catch (err) {
    console.error("generatePDF error:", err);
  } finally {
    element.setAttribute("style", prevStyle);
  }
};

// ─── Receipt PDF (uses onclone — no blink) ───────────────────────────────────
const generateReceiptPDF = async (element, filename = "document.pdf") => {
  if (!element) {
    console.error("generatePDF: element is null");
    return;
  }

  await document.fonts.ready;

  try {
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      scale: 2,
      logging: false,
      // onclone gives us a full detached DOM copy — we show it there,
      // the real element on screen is NEVER touched → zero blink
      onclone: (_clonedDoc, clonedElement) => {
        clonedElement.style.cssText =
          "display:block !important; visibility:visible !important; position:static; background:#fff; width:600px; padding:20px; box-sizing:border-box;";
      },
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const A4_W = 210;
    const A4_H = 297;

    const ratio = canvas.height / canvas.width;
    const imgW = A4_W;
    const imgH = imgW * ratio;

    // If content is taller than one page, scale it down to fit
    if (imgH > A4_H) {
      const scale = A4_H / imgH;
      pdf.addImage(imgData, "PNG", 0, 0, imgW * scale, A4_H);
    } else {
      const yOffset = (A4_H - imgH) / 2;
      pdf.addImage(imgData, "PNG", 0, yOffset, imgW, imgH);
    }

    pdf.save(filename);
  } catch (err) {
    console.error("generatePDF error:", err);
  }
};

// ─── Entry Pass PDF (original approach — moves element off-screen) ────────────
// const generatePassPDF = async (element, filename = "document.pdf") => {
//   if (!element) {
//     console.error("generatePassPDF: element is null");
//     return;
//   }

//   const prevStyle = element.getAttribute("style") || "";

//   element.style.cssText =
//     "display:block !important; visibility:visible !important; position:fixed; left:-9999px; top:0; z-index:-1; background:#fff;";

//   await new Promise((resolve) => setTimeout(resolve, 200));
//   await document.fonts.ready;

//   try {
//     const canvas = await html2canvas(element, {
//       useCORS: true,
//       allowTaint: false,
//       backgroundColor: "#ffffff",
//       scale: 3,
//       logging: false,
//       onclone: (clonedDoc) => {
//         clonedDoc.querySelectorAll("svg rect").forEach((rect) => {
//           rect.style.fill = "#ffffff";
//         });
//       },
//     });

//     const imgData = canvas.toDataURL("image/png");
//     const pdf = new jsPDF("p", "mm", "a4");
//     const A4_W = 210;
//     const A4_H = 297;

//     const ratio = canvas.height / canvas.width;
//     const imgH = A4_W * ratio;

//     if (imgH > A4_H) {
//       const scale = A4_H / imgH;
//       pdf.addImage(imgData, "PNG", 0, 0, A4_W * scale, A4_H);
//     } else {
//       pdf.addImage(imgData, "PNG", 0, (A4_H - imgH) / 2, A4_W, imgH);
//     }

//     pdf.save(filename);
//   } catch (err) {
//     console.error("generatePassPDF error:", err);
//   } finally {
//     element.setAttribute("style", prevStyle);
//   }
// };

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
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

  // ── Refs ─────────────────────────────────────
  // receiptContentRef  → wraps ONLY the printable receipt content (no buttons)
  const receiptContentRef = useRef(null);
  const primaryBarcodeImageRef = useRef(null); // UserPassCard root
  const spouseBarcodeImageRef = useRef(null); // SpousePassCard root
  const primaryBarcodeRef = useRef(null); // SVG in success view
  const primaryBarcodePrintRef = useRef(null); // SVG in UserPassCard
  const spouseBarcodeRef = useRef(null); // SVG in success view
  const spouseBarcodePrintRef = useRef(null); // SVG in SpousePassCard

  // ── Restore on mount ─────────────────────────
  useEffect(() => {
    if (userData.paymentStatus === "completed") {
      setPaymentSuccess(true);
      setPaymentId(userData.paymentId);
      setOrderId(userData.orderId);
      if (userData.primaryBarcodeId)
        setPrimaryBarcodeData(userData.primaryBarcodeId);
      if (userData.hasHusband && userData.spouseBarcodeId)
        setSpouseBarcodeData(userData.spouseBarcodeId);
    }
    setRegistrationId(userData.id);
  }, [userData]);

  // ── Generate barcodes ────────────────────────
  useEffect(() => {
    const opts = {
      format: "CODE128",
      lineColor: "#000",
      width: 1.5,
      height: 50,
      displayValue: true,
      fontSize: 12,
      margin: 5,
      background: "#fff",
    };

    if (primaryBarcodeData) {
      [primaryBarcodeRef, primaryBarcodePrintRef].forEach((ref) => {
        if (ref.current) {
          try {
            JsBarcode(ref.current, primaryBarcodeData, opts);
          } catch (e) {
            console.error("Primary barcode error:", e);
          }
        }
      });
    }

    if (userData.hasHusband && spouseBarcodeData) {
      [spouseBarcodeRef, spouseBarcodePrintRef].forEach((ref) => {
        if (ref.current) {
          try {
            JsBarcode(ref.current, spouseBarcodeData, opts);
          } catch (e) {
            console.error("Spouse barcode error:", e);
          }
        }
      });
    }
  }, [
    primaryBarcodeData,
    spouseBarcodeData,
    userData.hasHusband,
    paymentSuccess,
  ]);

  // ── PDF handlers ─────────────────────────────

  // 1. Receipt
  const reactToPrintFn = async () => {
    await generateReceiptPDF(receiptContentRef.current, "receipt.pdf");
  };

  // 2. Primary entry pass — barcode rendered by UserPassCard into <canvas>
  const reactToPrintPrimaryPassFn = async () => {
    await generatePassPDF(primaryBarcodeImageRef.current, "entry-pass-beti.pdf");
  };

  // 3. Spouse entry pass — barcode rendered by SpousePassCard into <canvas>
  const reactToPrintSpousePassFn = async () => {
    await generatePassPDF(spouseBarcodeImageRef.current, "entry-pass-damaad.pdf");
  };

  // ── Firebase helpers ─────────────────────────
  const calculateAmount = () => (userData.hasHusband ? 1000 : 500);

  const saveRegistration = async (paymentDetails = {}, barcodeData = {}) => {
    try {
      const registrationData = {
        phoneNumber: userData.phoneNumber,
        name: userData.name,
        city: userData.city,
        state: userData.state,
        photoURL: userData.photoURL,
        husbandPhotoURL: userData.husbandPhotoURL,
        hasHusband: userData.hasHusband,
        husbandName: userData.husbandName,
        arrivalDate: userData.arrivalDate,
        arrivalTime: userData.arrivalTime,
        arrivalTravelMode: userData.arrivalTravelMode,
        arrivalTrainName: userData.arrivalTrainName,
        arrivalTrainNameOther: userData.arrivalTrainNameOther,
        departureDate: userData.departureDate,
        departureTime: userData.departureTime,
        departureTravelMode: userData.departureTravelMode,
        departureTrainName: userData.departureTrainName,
        departureTrainNameOther: userData.departureTrainNameOther,
        additionalPeople: userData.additionalPeople,
        paymentAmount: calculateAmount(),
        paymentStatus: paymentDetails.status || "failed",
        paymentId: paymentDetails.paymentId || "",
        orderId: paymentDetails.orderId || "",
        attendeeCount: userData.hasHusband ? "2" : "1",
        primaryBarcodeId: barcodeData.primaryBarcodeId || "",
        spouseBarcodeId: userData.hasHusband
          ? barcodeData.spouseBarcodeId || ""
          : "",
        updatedAt: new Date(),
      };

      if (!registrationId) registrationData.registrationDate = new Date();

      let regId = registrationId;
      if (regId) {
        await updateDoc(doc(db, "registration-2026", regId), registrationData);
      } else {
        const ref = await addDoc(
          collection(db, "registration-2026"),
          registrationData,
        );
        regId = ref.id;
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
      const barcodeData = {
        primaryBarcodeId: userData.primaryBarcodeId,
        spouseBarcodeId: userData.spouseBarcodeId,
      };

      const regId = await saveRegistration(
        {
          status: "completed",
          paymentId: paymentDetails.razorpayPaymentId,
          orderId: paymentDetails.razorpayOrderId,
        },
        barcodeData,
      );

      setPaymentId(paymentDetails.razorpayPaymentId);
      setOrderId(paymentDetails.razorpayOrderId);
      setPaymentSuccess(true);
      setPaymentFailed(false);
      setPrimaryBarcodeData(userData.primaryBarcodeId);
      if (userData.hasHusband) setSpouseBarcodeData(userData.spouseBarcodeId);
    } catch (error) {
      console.error("Error processing payment:", error);
      setPaymentFailed(true);
      setError(
        "भुगतान सफल हुआ, लेकिन पंजीकरण की प्रक्रिया में त्रुटि हुई। कृपया संपर्क करें।",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentFailure = (error) => {
    setProcessing(false);
    setPaymentFailed(true);
    setPaymentSuccess(false);
    setError(
      `भुगतान असफल: ${error.description || error.message || "अज्ञात त्रुटि"}`,
    );
  };

  const displayRazorpay = async () => {
    setProcessing(true);
    setError("");

    const res = await loadScript(
      "https://checkout.razorpay.com/v1/checkout.js",
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
        { amount, currency: "INR" },
      );

      if (response?.data) {
        const order_id = response.data.id;
        const { name, phoneNumber } = userData;

        const options = {
          key: process.env.REACT_APP_RAZORPAY_API_KEY,
          amount,
          currency: "INR",
          name: "BETI TERAPANTH KI Registration",
          description: "Registration Payment",
          method: {
            card: true,
            netbanking: true,
            wallet: true,
            upi: true,
            emi: false,
            paylater: false,
          },
          config: {
            display: {
              blocks: {
                utib: {
                  name: "UPI",
                  instruments: [
                    { method: "upi", flows: ["collect", "intent"] },
                  ],
                },
                banks: {
                  name: "Other Payment Methods",
                  instruments: [
                    { method: "card" },
                    { method: "netbanking" },
                    { method: "wallet" },
                  ],
                },
              },
              hide: [{ method: "upi", flows: ["qr"] }],
              sequence: ["block.utib", "block.banks"],
              preferences: { show_default_blocks: false },
            },
          },
          order_id,
          handler: async (response) => {
            await handlePaymentSuccess({
              orderCreationId: order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
          },
          prefill: { name, email: "", contact: phoneNumber },
          notes: { address: "Beti Terapanth Ki Office" },
          theme: { color: "#61dafb" },
          modal: { ondismiss: () => setProcessing(false) },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.on("payment.failed", (r) =>
          handlePaymentFailure(r.error),
        );
        paymentObject.open();
      }
    } catch (error) {
      handlePaymentFailure(error);
    }
  };

  // ── Payment Failed View ──────────────────────
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
            setPaymentFailed(false);
            setError("");
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

  // ── Render ───────────────────────────────────
  if (paymentSuccess) {
    return (
      <div className="payment-result-container">
        <PaymentSuccessView
          receiptContentRef={receiptContentRef} // ← renamed prop
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

        {/* Pass cards — canvas barcode rendered inside each component via useEffect */}
        <UserPassCard
          userData={userData}
          barcodeValue={primaryBarcodeData}
          cardRef={primaryBarcodeImageRef}
        />
        {userData.hasHusband && (
          <SpousePassCard
            userData={userData}
            barcodeValue={spouseBarcodeData}
            cardRef={spouseBarcodeImageRef}
          />
        )}
      </div>
    );
  }

  if (paymentFailed) return <PaymentFailedView />;

  return (
    <div className="payment-container">
      <h3 className="form-section-title">Payment Details</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="payment-summary">
        <div className="summary-item">
          <span>Name:</span>
          <span>{userData.name}</span>
        </div>
        <div className="summary-item">
          <span>Mobile:</span>
          <span>{userData.phoneNumber}</span>
        </div>
        <div className="summary-item">
          <span>City:</span>
          <span>{[userData?.city, userData?.state].join(", ")}</span>
        </div>
        {userData.hasHusband && (
          <div className="summary-item">
            <span>Husband:</span>
            <span>{userData.husbandName}</span>
          </div>
        )}
        <div className="summary-item payment-amount">
          <span>Total Amount:</span>
          <span>₹{calculateAmount()}</span>
        </div>
        <div className="payment-details">
          <h4>Payment Details</h4>
          <p>
            <strong>Single Registration:</strong> ₹500
            <br />
            <strong>With Husband:</strong> ₹1000
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
          Back / पीछे जाएं
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
