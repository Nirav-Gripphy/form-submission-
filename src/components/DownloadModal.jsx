import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import UserPassCard from "./UserPassCard";
import SpousePassCard from "./SpousePassCard";
import { formatDateTime } from "../Utility/global";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ─── Receipt PDF (onclone — zero blink, d-none never removed) ────────────────
const generateReceiptPDF = async (element, filename = "document.pdf") => {
  if (!element) {
    console.error("generateReceiptPDF: element is null");
    return;
  }

  await document.fonts.ready;

  try {
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      scale: 3,
      logging: false,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.querySelector("[data-pdf-capture]");
        if (clonedEl) {
          clonedEl.style.cssText =
            "display:block !important; visibility:visible !important; " +
            "position:static !important; opacity:1 !important; " +
            "width:680px; background:#fff; padding:24px; box-sizing:border-box;";
        }
        clonedDoc.querySelectorAll("svg rect").forEach((rect) => {
          rect.style.fill = "#ffffff";
        });
      },
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const A4_W = 210;
    const A4_H = 297;

    const ratio = canvas.height / canvas.width;
    const imgH = A4_W * ratio;

    if (imgH > A4_H) {
      const scale = A4_H / imgH;
      pdf.addImage(imgData, "PNG", 0, 0, A4_W * scale, A4_H);
    } else {
      pdf.addImage(imgData, "PNG", 0, (A4_H - imgH) / 2, A4_W, imgH);
    }

    pdf.save(filename);
  } catch (err) {
    console.error("generateReceiptPDF error:", err);
  }
};

// ─── Entry Pass PDF (forces visibility, re-renders canvas barcode, restores) ──
const generatePassPDF = async (element, filename = "document.pdf") => {
  if (!element) {
    console.error("generatePassPDF: element is null");
    return;
  }

  await document.fonts.ready;

  // Force full visibility so browser can paint the canvas
  const prevStyle = element.getAttribute("style") || "";
  element.style.cssText =
    "display:block !important; visibility:visible !important; " +
    "position:fixed !important; left:-9999px !important; top:0 !important; " +
    "z-index:-1 !important; width:600px;";

  // Two frames: one for layout, one for canvas paint
  await new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(r)),
  );
  await document.fonts.ready;

  // Re-run JsBarcode on the canvas using the stamped data-barcode-value
  const canvasEl = element.querySelector("canvas");
  if (canvasEl) {
    const barcodeValue = canvasEl.getAttribute("data-barcode-value");
    if (barcodeValue) {
      try {
        JsBarcode(canvasEl, barcodeValue, {
          format: "CODE128",
          lineColor: "#000000",
          background: "#ffffff",
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 16,
          margin: 8,
        });
      } catch (e) {
        console.error("Barcode re-render error:", e);
      }
    }
  }

  try {
    const captured = await html2canvas(element, {
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      scale: 5,
      logging: false,
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll("svg rect").forEach((rect) => {
          rect.style.fill = "#ffffff";
        });
      },
    });

    const imgData = captured.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const A4_W = 210;
    const A4_H = 297;

    const ratio = captured.height / captured.width;
    const imgH = A4_W * ratio;

    if (imgH > A4_H) {
      const scale = A4_H / imgH;
      pdf.addImage(imgData, "PNG", 0, 0, A4_W * scale, A4_H);
    } else {
      pdf.addImage(imgData, "PNG", 0, (A4_H - imgH) / 2, A4_W, imgH);
    }

    pdf.save(filename);
  } catch (err) {
    console.error("generatePassPDF error:", err);
  } finally {
    // Always restore the original hidden state
    element.setAttribute("style", prevStyle);
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────
const DownloadModal = ({ selectedRegistration }) => {
  const [primaryBarcodeData, setPrimaryBarcodeData] = useState("");
  const [spouseBarcodeData, setSpouseBarcodeData] = useState("");

  const receiptRef = useRef(null);
  const primaryBarcodeImageRef = useRef(null);
  const spouseBarcodeImageRef = useRef(null);
  const primaryBarcodeRef = useRef(null);
  const spouseBarcodeRef = useRef(null);

  useEffect(() => {
    if (!selectedRegistration) return;

    if (selectedRegistration.primaryBarcodeId) {
      setPrimaryBarcodeData(selectedRegistration.primaryBarcodeId);
    }
    if (
      selectedRegistration.hasHusband &&
      selectedRegistration.spouseBarcodeId
    ) {
      setSpouseBarcodeData(selectedRegistration.spouseBarcodeId);
    }
  }, [selectedRegistration]);

  useEffect(() => {
    if (!selectedRegistration) return;

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

    if (primaryBarcodeData && primaryBarcodeRef.current) {
      try {
        JsBarcode(primaryBarcodeRef.current, primaryBarcodeData, opts);
      } catch (error) {
        console.error("Error generating primary barcode:", error);
      }
    }

    if (
      selectedRegistration.hasHusband &&
      spouseBarcodeData &&
      spouseBarcodeRef.current
    ) {
      try {
        JsBarcode(spouseBarcodeRef.current, spouseBarcodeData, opts);
      } catch (error) {
        console.error("Error generating spouse barcode:", error);
      }
    }

    // Stamp barcode values onto the canvas elements inside each pass card
    // so generatePassPDF can re-render them after forcing visibility
    if (primaryBarcodeImageRef.current) {
      const c = primaryBarcodeImageRef.current.querySelector("canvas");
      if (c) c.setAttribute("data-barcode-value", primaryBarcodeData);
    }
    if (spouseBarcodeImageRef.current) {
      const c = spouseBarcodeImageRef.current.querySelector("canvas");
      if (c) c.setAttribute("data-barcode-value", spouseBarcodeData);
    }
  }, [
    primaryBarcodeData,
    spouseBarcodeData,
    selectedRegistration,
    spouseBarcodeRef,
    primaryBarcodeRef,
  ]);

  // ── PDF handlers ─────────────────────────────
  const reactToPrintFn = async () => {
    await generateReceiptPDF(receiptRef.current, "receipt.pdf");
  };

  const reactToPrintPrimaryPassFn = async () => {
    await generatePassPDF(
      primaryBarcodeImageRef.current,
      "entry-pass-beti.pdf",
    );
  };

  const reactToPrintSpousePassFn = async () => {
    await generatePassPDF(
      spouseBarcodeImageRef.current,
      "entry-pass-damaad.pdf",
    );
  };

  return (
    <div
      className="modal fade"
      id="downloadModal"
      tabIndex="-1"
      aria-labelledby="downloadModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          {/* Modal Header */}
          <div className="modal-header bg-primary text-white border-0">
            <div className="d-flex align-items-center">
              <i className="bi bi-download me-2 fs-5"></i>
              <h5 className="modal-title fw-bold mb-0" id="downloadModalLabel">
                Download Documents
              </h5>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4">
            {selectedRegistration && (
              <div className="alert alert-light border mb-4">
                <div className="row g-2 small text-muted">
                  <div className="col-md-6">
                    <strong>Name:</strong> {selectedRegistration.name || "N/A"}
                  </div>
                </div>
              </div>
            )}

            <div className="row g-3">
              {/* Receipt */}
              <div className="col-12">
                <div className="card border-0 bg-light h-100 hover-shadow transition-all">
                  <div className="card-body d-flex align-items-center p-3">
                    <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                      <i className="bi bi-receipt text-white fs-4"></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="card-title mb-1 fw-semibold">
                        Registration Receipt
                      </h6>
                      <p className="card-text text-muted small mb-0">
                        Download your registration receipt.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-success btn-sm px-3"
                      onClick={reactToPrintFn}
                    >
                      <i className="bi bi-download me-1"></i>
                      Download
                    </button>
                  </div>
                </div>
              </div>

              {/* Primary Pass */}
              <div className="col-12">
                <div className="card border-0 bg-light h-100 hover-shadow transition-all">
                  <div className="card-body d-flex align-items-center p-3">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                      <i className="bi bi-card-text text-white fs-4"></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="card-title mb-1 fw-semibold">
                        Event Pass
                      </h6>
                      <p className="card-text text-muted small mb-0">
                        Download your main companion pass with bar code.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm px-3"
                      onClick={reactToPrintPrimaryPassFn}
                    >
                      <i className="bi bi-download me-1"></i>
                      Download
                    </button>
                  </div>
                </div>
              </div>

              {/* Spouse Pass */}
              {selectedRegistration?.hasHusband && (
                <div className="col-12">
                  <div className="card border-0 bg-light h-100 hover-shadow transition-all">
                    <div className="card-body d-flex align-items-center p-3">
                      <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                        <i className="bi bi-person-plus text-white fs-4"></i>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="card-title mb-1 fw-semibold">
                          Husband Pass
                        </h6>
                        <p className="card-text text-muted small mb-0">
                          Download companion pass for husband with bar code.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-info btn-sm px-3"
                        onClick={reactToPrintSpousePassFn}
                      >
                        <i className="bi bi-download me-1"></i>
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pass cards — display:none set inside components, generatePassPDF forces visibility at capture time */}
      <UserPassCard
        userData={selectedRegistration}
        barcodeRef={primaryBarcodeRef}
        cardRef={primaryBarcodeImageRef}
      />

      {selectedRegistration?.hasHusband && (
        <SpousePassCard
          userData={selectedRegistration}
          barcodeRef={spouseBarcodeRef}
          cardRef={spouseBarcodeImageRef}
        />
      )}

      {/* Receipt — stays d-none, revealed only inside onclone */}
      {selectedRegistration && (
        <ReciptComponent
          receiptRef={receiptRef}
          selectedRegistration={selectedRegistration}
        />
      )}
    </div>
  );
};

export default DownloadModal;

// ─── Receipt Component ────────────────────────────────────────────────────────
const ReciptComponent = ({ receiptRef, selectedRegistration }) => {
  const formatTrainName = (trainName, trainNameOther) => {
    if (!trainName) return "";
    if (trainName === "Others / अन्य" && trainNameOther) {
      return `${trainName} (${trainNameOther})`;
    }
    return trainName;
  };

  return (
    <div className="payment-success d-none" ref={receiptRef} data-pdf-capture>
      <div className="receipt-header">
        <h2>बेटी तेरापंथ की</h2>
        <p>Registration Receipt</p>
      </div>
      <div className="success-icon">
        <i className="fas fa-check-circle"></i>
      </div>
      <h3>पंजीकरण सफल</h3>
      <p>आपका पंजीकरण सफलतापूर्वक हो गया है।</p>
      <div className="registration-details">
        <div className="detail-item">
          <span>नाम:</span>
          <span>{selectedRegistration?.name}</span>
        </div>
        <div className="detail-item">
          <span>मोबाइल:</span>
          <span>{selectedRegistration?.phoneNumber}</span>
        </div>
        <div className="detail-item">
          <span>स्थान:</span>
          <span>
            {selectedRegistration?.city}, {selectedRegistration?.state}
          </span>
        </div>
        {selectedRegistration?.hasHusband && (
          <div className="detail-item">
            <span>जीवनसाथी:</span>
            <span>{selectedRegistration?.husbandName}</span>
          </div>
        )}
        <div className="detail-item">
          <span>आगमन:</span>
          <span>
            {new Date(selectedRegistration?.arrivalDate)?.toDateString()} -{" "}
            {selectedRegistration?.arrivalTime}
          </span>
        </div>
        <div className="detail-item">
          <span>प्रस्थान:</span>
          <span>
            {new Date(selectedRegistration?.departureDate)?.toDateString()} -{" "}
            {selectedRegistration?.departureTime}
          </span>
        </div>
        <div className="detail-item">
          <span>आगमन यात्रा माध्यम:</span>
          <span>{selectedRegistration?.arrivalTravelMode}</span>
        </div>
        {selectedRegistration?.arrivalTravelMode === "Train" &&
          selectedRegistration?.arrivalTrainName && (
            <div className="detail-item">
              <span>आगमन ट्रेन:</span>
              <span>
                {formatTrainName(
                  selectedRegistration?.arrivalTrainName,
                  selectedRegistration?.arrivalTrainNameOther,
                )}
              </span>
            </div>
          )}
        <div className="detail-item">
          <span>प्रस्थान यात्रा माध्यम:</span>
          <span>{selectedRegistration?.departureTravelMode}</span>
        </div>
        {selectedRegistration?.departureTravelMode === "Train" &&
          selectedRegistration?.departureTrainName && (
            <div className="detail-item">
              <span>प्रस्थान ट्रेन:</span>
              <span>
                {formatTrainName(
                  selectedRegistration?.departureTrainName,
                  selectedRegistration?.departureTrainNameOther,
                )}
              </span>
            </div>
          )}
        <div className="detail-item">
          <span>दिनांक:</span>
          <span>{formatDateTime(selectedRegistration?.updatedAt)}</span>
        </div>
      </div>
      <div className="additional-info">
        <p className="mb-0">
          कृपया इसे सुरक्षित रखें, सम्मेलन के रजिस्ट्रेशन दौरान यह उपयोगी होगा।
        </p>
      </div>
      <div className="footer-note">
        <p>धन्यवाद!</p>
      </div>
    </div>
  );
};
