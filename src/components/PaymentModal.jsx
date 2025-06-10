import React from "react";
import { formatDateTime } from "../Utility/global";

const PaymentModal = ({ selectedRegistration }) => {
  // Sub-components for better organization
  const PaymentStatusBadge = React.memo(({ status }) => {
    const statusConfig = {
      completed: { text: "Success", className: "badge bg-success" },
      pending: { text: "Pending", className: "badge bg-warning text-dark" },
      failed: { text: "Failed", className: "badge bg-danger" },
    };

    const config = statusConfig[status] || statusConfig.failed;
    return <span className={config.className}>{config.text}</span>;
  });

  return (
    <div
      className="modal fade"
      id="paymentModal"
      tabIndex="-1"
      aria-labelledby="paymentModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="paymentModalLabel">
              Payment Details
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close modal"
            ></button>
          </div>
          <div className="modal-body">
            {selectedRegistration && (
              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label fw-medium">Payment Status</label>
                  <div>
                    <PaymentStatusBadge
                      status={selectedRegistration.paymentStatus}
                    />
                  </div>
                </div>
                <div className="col-6">
                  <label className="form-label fw-medium">Amount</label>
                  <p className="h5 text-success mb-0">
                    ₹
                    {selectedRegistration.paymentAmount?.toLocaleString(
                      "en-IN"
                    ) || "N/A"}
                  </p>
                </div>
                <div className="col-12">
                  <label className="form-label fw-medium">Payment ID</label>
                  <p className="font-monospace small text-break mb-0">
                    {selectedRegistration.paymentId || "N/A"}
                  </p>
                </div>
                <div className="col-12">
                  <label className="form-label fw-medium">Order ID</label>
                  <p className="font-monospace small text-break mb-0">
                    {selectedRegistration.orderId || "N/A"}
                  </p>
                </div>
                <div className="col-12">
                  <label className="form-label fw-medium">Last Updated</label>
                  <p className="small mb-0">
                    {formatDateTime(selectedRegistration.updatedAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
