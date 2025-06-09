import { useEffect } from "react";

const TermsAndConditions = () => {
  useEffect(() => {
    // Function to handle smooth scrolling to section based on URL hash
    const scrollToSection = () => {
      const hash = window.location.hash;
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
        }
      }
    };

    // Scroll on component mount
    scrollToSection();

    // Listen for hash changes
    const handleHashChange = () => {
      scrollToSection();
    };

    window.addEventListener("hashchange", handleHashChange);

    // Cleanup event listener
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return (
    <div>
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
                height: "80px",
                width: "inherit",
              }}
            />
          </div>

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

          <div
            className="terms-content"
            style={{ padding: "20px", textAlign: "left" }}
          >
            {/* Terms and Conditions Section */}
            <div
              id="terms-conditions"
              className="terms-section"
              style={{ marginBottom: "40px", paddingTop: "20px" }}
            >
              <h3
                style={{
                  color: "#333",
                  marginBottom: "20px",
                  borderBottom: "2px solid #c41e3a",
                  paddingBottom: "10px",
                }}
              >
                Terms and Conditions
              </h3>

              <div style={{ marginBottom: "20px" }}>
                <h5 style={{ color: "#c41e3a", marginBottom: "10px" }}>
                  1. Registration and Participation
                </h5>
                <p
                  style={{
                    lineHeight: "1.6",
                    color: "#555",
                    marginBottom: "10px",
                  }}
                >
                  By registering for the "Beti Terapanth Ki" 3rd Convention, you
                  agree to abide by all terms and conditions set forth by the
                  Jain Shwetambar Terapanth Mahasabha.
                </p>
                <p
                  style={{
                    lineHeight: "1.6",
                    color: "#555",
                    marginBottom: "15px",
                  }}
                >
                  All participants must provide accurate and complete
                  information during registration. False or misleading
                  information may result in cancellation of registration without
                  refund.
                </p>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h5 style={{ color: "#c41e3a", marginBottom: "10px" }}>
                  2. Event Schedule and Changes
                </h5>
                <p
                  style={{
                    lineHeight: "1.6",
                    color: "#555",
                    marginBottom: "10px",
                  }}
                >
                  The event is scheduled for July 26-27, 2025. The organizers
                  reserve the right to modify the event schedule, venue, or
                  format due to unforeseen circumstances.
                </p>
                <p
                  style={{
                    lineHeight: "1.6",
                    color: "#555",
                    marginBottom: "15px",
                  }}
                >
                  Participants will be notified of any significant changes
                  through registered phone numbers.
                </p>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h5 style={{ color: "#c41e3a", marginBottom: "10px" }}>
                  3. Code of Conduct
                </h5>
                <p
                  style={{
                    lineHeight: "1.6",
                    color: "#555",
                    marginBottom: "10px",
                  }}
                >
                  All participants are expected to maintain decorum and respect
                  the values of the Jain community throughout the event.
                </p>
                <p
                  style={{
                    lineHeight: "1.6",
                    color: "#555",
                    marginBottom: "15px",
                  }}
                >
                  Any inappropriate behavior may result in immediate removal
                  from the event premises without refund.
                </p>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h5 style={{ color: "#c41e3a", marginBottom: "10px" }}>
                  4. Liability
                </h5>
                <p
                  style={{
                    lineHeight: "1.6",
                    color: "#555",
                    marginBottom: "15px",
                  }}
                >
                  The Jain Shwetambar Terapanth Mahasabha shall not be held
                  liable for any personal injury, loss, or damage to personal
                  property during the event. Participants attend at their own
                  risk.
                </p>
              </div>
            </div>

            {/* Privacy Policy Section */}
            <div
              id="privacy-policy"
              className="privacy-section"
              style={{ marginBottom: "40px", paddingTop: "20px" }}
            >
              <h3
                style={{
                  color: "#333",
                  marginBottom: "20px",
                  borderBottom: "2px solid #c41e3a",
                  paddingBottom: "10px",
                }}
              >
                Privacy Policy
              </h3>

              <div style={{ marginBottom: "20px" }}>
                <h5 style={{ color: "#c41e3a", marginBottom: "10px" }}>
                  Information Collection
                </h5>
                <p
                  style={{
                    lineHeight: "1.6",
                    color: "#555",
                    marginBottom: "10px",
                  }}
                >
                  We collect personal information including name, phone number,
                  city, state and payment details solely for registration and
                  event management purposes.
                </p>
                <p
                  style={{
                    lineHeight: "1.6",
                    color: "#555",
                    marginBottom: "15px",
                  }}
                >
                  All payment processing is handled securely through Razorpay,
                  and we do not store your payment card details on our servers.
                </p>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h5 style={{ color: "#c41e3a", marginBottom: "10px" }}>
                  Information Usage
                </h5>
                <p
                  style={{
                    lineHeight: "1.6",
                    color: "#555",
                    marginBottom: "10px",
                  }}
                >
                  Your personal information will be used exclusively for:
                </p>
                <ul
                  style={{
                    color: "#555",
                    paddingLeft: "20px",
                    marginBottom: "15px",
                  }}
                >
                  <li style={{ marginBottom: "5px" }}>
                    Event registration confirmation
                  </li>
                  <li style={{ marginBottom: "5px" }}>
                    Communication regarding event updates
                  </li>
                  <li style={{ marginBottom: "5px" }}>
                    Issuing certificates or acknowledgments
                  </li>
                  <li style={{ marginBottom: "5px" }}>
                    Future event notifications (with your consent)
                  </li>
                </ul>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h5 style={{ color: "#c41e3a", marginBottom: "10px" }}>
                  Data Protection
                </h5>
                <p
                  style={{
                    lineHeight: "1.6",
                    color: "#555",
                    marginBottom: "10px",
                  }}
                >
                  We implement appropriate security measures to protect your
                  personal information from unauthorized access, alteration,
                  disclosure, or destruction.
                </p>
                <p
                  style={{
                    lineHeight: "1.6",
                    color: "#555",
                    marginBottom: "15px",
                  }}
                >
                  Your information will not be shared with third parties except
                  as necessary for event management or as required by law.
                </p>
              </div>
            </div>

            {/* Cancellation/Refund Policy Section */}
            <div
              id="cancellation-policy"
              className="cancellation-section"
              style={{ marginBottom: "40px", paddingTop: "20px" }}
            >
              <h3
                style={{
                  color: "#333",
                  marginBottom: "20px",
                  borderBottom: "2px solid #c41e3a",
                  paddingBottom: "10px",
                }}
              >
                Cancellation/Refund Policy
              </h3>

              <div
                style={{
                  backgroundColor: "#ffebee",
                  border: "2px solid #c41e3a",
                  borderRadius: "8px",
                  padding: "20px",
                  marginBottom: "20px",
                }}
              >
                <h4
                  style={{
                    color: "#c41e3a",
                    marginBottom: "15px",
                    textAlign: "center",
                  }}
                >
                  🚫 NO REFUND POLICY
                </h4>
                <p
                  style={{
                    lineHeight: "1.6",
                    color: "#333",
                    marginBottom: "10px",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  All registration fees are NON-REFUNDABLE under any
                  circumstances.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer
        style={{
          textAlign: "center",
        }}
      >
        <img
          src="./footer.svg"
          alt="footer_svg"
          style={{ maxWidth: "100%", marginTop: "0px", paddingTop: "0px" }}
        />
      </footer>
    </div>
  );
};

export default TermsAndConditions;
