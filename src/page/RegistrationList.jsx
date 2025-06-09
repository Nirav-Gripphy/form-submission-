import React from "react";

const RegistrationList = () => {
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

export default RegistrationList;
