// exportUtils.js - Create this as a separate utility file
import { formatDateTime } from "../Utility/global";

export const exportToCSV = (data, filename = "registrations-export.csv") => {
  if (!data.length) {
    alert("No data to export");
    return;
  }

  try {
    // Convert Firebase data to CSV format
    const csvData = data.map((registration) => ({
      "Registration ID": registration.registrationId || registration.id,
      "Primary Barcode ID": registration.primaryBarcodeId || "",
      Name: registration.name || "",
      "Phone Number": registration.phoneNumber || "",
      City: registration.city || "",
      State: registration.state || "",
      "Has Husband": registration.hasHusband ? "Yes" : "No",
      "Husband Name": registration.husbandName || "",
      "Husband Barcode ID": registration.spouseBarcodeId || "",
      "Additional People":
        registration?.additionalPeople
          ?.map((res) => `${res.name} ( ${res.relation} )`)
          ?.join(", ") || "",
      "Created At": registration.createdAt
        ? formatDateTime(registration.createdAt)
        : "",
      "Updated At": registration.updatedAt
        ? formatDateTime(registration.updatedAt)
        : "",
      "Photo URL": registration.photoURL || "",
      "Husband Photo URL": registration.husbandPhotoURL || "",

      "Arrival Date": registration.arrivalDate || "",
      "Arrival Time": registration.arrivalTime || "",
      "Arrival Travel Mode": registration.arrivalTravelMode || "",
      "Departure Date": registration.departureDate || "",
      "Departure Time": registration.departureTime || "",
      "Departure Travel Mode": registration.departureTravelMode || "",

      "Payment Status": registration.paymentStatus || "",
      "Payment Amount": registration.paymentAmount || "",
      "Payment ID": registration.paymentId || "",
      "Order ID": registration.orderId || "",
    }));

    // Convert to CSV string
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Handle values that might contain commas or quotes
            if (
              typeof value === "string" &&
              (value.includes(",") ||
                value.includes('"') ||
                value.includes("\n"))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(",")
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    alert();
  }
};
