import React, { useEffect } from "react";

const AboutUs = () => {
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
            className="about-content"
            style={{ padding: "20px", textAlign: "left" }}
          >
            <div
              id="about-event"
              className="about-section"
              style={{ marginBottom: "30px", paddingTop: "20px" }}
            >
              <h3 style={{ color: "#333", marginBottom: "15px" }}>
                About the Event
              </h3>
              <p
                style={{
                  lineHeight: "1.6",
                  color: "#555",
                  marginBottom: "15px",
                }}
              >
                Organized by the Jain Shwetambar Terapanth Mahasabha, the "Beti
                Terapanth Ki" 3rd Convention is a significant community event
                dedicated to empowering our daughters and honoring their
                achievements.
              </p>
              <p
                style={{
                  lineHeight: "1.6",
                  color: "#555",
                  marginBottom: "15px",
                }}
              >
                The event will include inspirational sessions and will recognize
                women who have excelled in various fields, celebrating their
                contributions and inspiring future generations.
              </p>
            </div>

            <div
              id="registration"
              className="pricing-section"
              style={{ marginBottom: "30px", paddingTop: "20px" }}
            >
              <h3 style={{ color: "#333", marginBottom: "15px" }}>
                Registration Fees
              </h3>
              <div
                className="pricing-cards"
                style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}
              >
                <div
                  className="pricing-card"
                  style={{
                    border: "2px solid #c41e3a",
                    borderRadius: "10px",
                    padding: "20px",
                    flex: "1",
                    minWidth: "250px",
                    textAlign: "center",
                  }}
                >
                  <h4 style={{ color: "#c41e3a", marginBottom: "10px" }}>
                    Individual Registration
                  </h4>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#333",
                      marginBottom: "10px",
                    }}
                  >
                    ₹500
                  </div>
                  <p style={{ color: "#666", fontSize: "14px" }}>
                    For single participant registration
                  </p>
                </div>

                <div
                  className="pricing-card"
                  style={{
                    border: "2px solid #c41e3a",
                    borderRadius: "10px",
                    padding: "20px",
                    flex: "1",
                    minWidth: "250px",
                    textAlign: "center",
                  }}
                >
                  <h4 style={{ color: "#c41e3a", marginBottom: "10px" }}>
                    Couple Registration
                  </h4>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#333",
                      marginBottom: "10px",
                    }}
                  >
                    ₹1000
                  </div>
                  <p style={{ color: "#666", fontSize: "14px" }}>
                    Joint registration for husband and wife
                  </p>
                </div>
              </div>

              <div
                id="payment-details"
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                }}
              >
                <h5 style={{ color: "#333", marginBottom: "10px" }}>
                  Payment Details
                </h5>
                <p
                  style={{
                    color: "#666",
                    fontSize: "14px",
                    marginBottom: "5px",
                  }}
                >
                  • All payments are securely processed through Razorpay
                </p>
                <p
                  style={{
                    color: "#666",
                    fontSize: "14px",
                    marginBottom: "5px",
                  }}
                >
                  • Acceptable payment methods: Credit Card, Debit Card, Net
                  Banking, and UPI
                </p>
              </div>
            </div>

            <div
              id="contact"
              className="contact-section"
              style={{ paddingTop: "20px" }}
            >
              <h3 style={{ color: "#333", marginBottom: "15px" }}>
                Contact Us
              </h3>
              <div
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "20px",
                  borderRadius: "8px",
                }}
              >
                <p style={{ marginBottom: "10px", color: "#555" }}>
                  <strong>Email:</strong> info@jstmahasabha.org
                </p>
                <p style={{ marginBottom: "10px", color: "#555" }}>
                  <strong>Phone:</strong> +91 70444 47777
                </p>

                <p style={{ color: "#555" }}>
                  <strong>Event Dates:</strong> 26th–27th July, 2025
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

export default AboutUs;
