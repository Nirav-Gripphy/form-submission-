import JsBarcode from "jsbarcode";
import { formatDateTime } from "./global";

// SOLUTION 1: Using ExcelJS (Most Recommended)
// Install: npm install exceljs

// Helper function to generate barcode as buffer
const generateBarcodeBuffer = (text, width = 300, height = 100) => {
  if (!text) return null;

  try {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, text, {
      format: "CODE128",
      width: 2,
      height: height,
      displayValue: true,
      fontSize: 14,
      margin: 10,
      background: "#ffffff",
      lineColor: "#000000",
    });

    // Convert canvas to blob and then to array buffer
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsArrayBuffer(blob);
      }, "image/png");
    });
  } catch (error) {
    console.error("Error generating barcode:", error);
    return null;
  }
};

// ExcelJS Implementation
export const exportToExcelWithExcelJS = async (
  data,
  filename = "registrations-with-barcodes.xlsx",
) => {
  if (!data.length) {
    alert("No data to export");
    return;
  }

  try {
    // Dynamic import of ExcelJS
    const ExcelJS = await import("exceljs");

    // Show loading indicator
    const loadingAlert = document.createElement("div");
    loadingAlert.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <span>Generating barcodes and Excel file...</span>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    loadingAlert.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 20px;
      border-radius: 10px;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;
    document.body.appendChild(loadingAlert);

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Registrations");

    // Define headers
    const headers = [
      "Registration ID",
      "Primary Barcode ID",
      "Name",
      "Phone Number",
      "City",
      "State",
      "Has Husband",
      "Husband Name",
      "Husband Barcode ID",
      "Additional People",
      "Created At",
      "Updated At",
      "Arrival Date",
      "Arrival Time",
      "Arrival Travel Mode",
      "Arrival Train Name",
      "Departure Date",
      "Departure Time",
      "Departure Travel Mode",
      "Departure Train Name",
      "Status",
      "Primary Barcode",
      "Spouse Barcode",
    ];

    // Add headers to worksheet
    worksheet.addRow(headers);

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Set column widths
    worksheet.columns = headers.map((header, index) => ({
      header: header,
      key: header.toLowerCase().replace(/\s+/g, "_"),
      width: index >= headers.length - 2 ? 30 : 15, // Wider for barcode columns
    }));

    // Process data and add rows
    for (let i = 0; i < data.length; i++) {
      const registration = data[i];
      const rowIndex = i + 2; // Excel is 1-indexed, +1 for header

      const isCompleted = registration.registrationStep === 4;
      const statusText = registration.markAsVerified
        ? "Verified"
        : isCompleted
          ? registration.markAsVerified === true
            ? "Verified"
            : "Completed"
          : "Pending";
      // Add row data
      const rowData = [
        registration.registrationId || registration.id,
        registration.primaryBarcodeId || "",
        registration.name || "",
        registration.phoneNumber || "",
        registration.city || "",
        registration.state || "",
        registration.hasHusband ? "Yes" : "No",
        registration.husbandName || "",
        registration.spouseBarcodeId || "",
        registration?.additionalPeople
          ?.map((res) => `${res.name} ( ${res.relation} )`)
          .join(", ") || "",
        registration.createdAt ? formatDateTime(registration.createdAt) : "",
        registration.updatedAt ? formatDateTime(registration.updatedAt) : "",
        registration.arrivalDate || "",
        registration.arrivalTime || "",
        registration.arrivalTravelMode || "",
        (registration.arrivalTrainName =
          registration.arrivalTravelMode.toLowerCase() === "train"
            ? registration.arrivalTrainName || ""
            : ""),
        registration.departureDate || "",
        registration.departureTime || "",
        registration.departureTravelMode || "",
        (registration.departureTrainName =
          registration.departureTravelMode.toLowerCase() === "train"
            ? registration.departureTrainName || ""
            : ""),
        statusText,
        "", // Placeholder for primary barcode
        "", // Placeholder for spouse barcode
      ];

      worksheet.addRow(rowData);
      worksheet.getRow(rowIndex).height = 100; // Set row height for images

      // Generate and add primary barcode
      if (registration.primaryBarcodeId) {
        const primaryBarcodeBuffer = await generateBarcodeBuffer(
          registration.primaryBarcodeId,
        );
        if (primaryBarcodeBuffer) {
          const primaryImageId = workbook.addImage({
            buffer: primaryBarcodeBuffer,
            extension: "png",
          });

          worksheet.addImage(primaryImageId, {
            tl: { col: headers.length - 2, row: rowIndex - 1 }, // Primary barcode column
            ext: { width: 200, height: 100, margin: 10 },
          });
        }
      }

      // Generate and add spouse barcode
      if (registration.spouseBarcodeId) {
        const spouseBarcodeBuffer = await generateBarcodeBuffer(
          registration.spouseBarcodeId,
        );
        if (spouseBarcodeBuffer) {
          const spouseImageId = workbook.addImage({
            buffer: spouseBarcodeBuffer,
            extension: "png",
          });

          worksheet.addImage(spouseImageId, {
            tl: { col: headers.length - 1, row: rowIndex - 1 }, // Spouse barcode column
            ext: { width: 200, height: 100 },
          });
        }
      }
    }

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Remove loading indicator
    document.body.removeChild(loadingAlert);

    alert("Excel file with embedded barcode images exported successfully!");
  } catch (error) {
    console.error("Excel Export Failed:", error);
    alert("Failed to export Excel file. Please try again.");

    const loadingAlert = document.querySelector(
      'div[style*="position: fixed"]',
    );
    if (loadingAlert) {
      document.body.removeChild(loadingAlert);
    }
  }
};

// SOLUTION 2: Using react-excel-export with canvas images
// Install: npm install react-excel-export

export const exportToExcelWithReactExcel = async (
  data,
  filename = "registrations-with-barcodes.xlsx",
) => {
  if (!data.length) {
    alert("No data to export");
    return;
  }

  try {
    // Dynamic import
    const { ExcelFile, ExcelSheet } = await import("react-excel-export");

    // Process data with barcode generation
    const processedData = await Promise.all(
      data.map(async (registration) => {
        const primaryBarcode = generateBarcodeImage(
          registration.primaryBarcodeId || registration.id,
        );
        const spouseBarcode = registration.spouseBarcodeId
          ? generateBarcodeImage(registration.spouseBarcodeId)
          : null;

        return {
          registrationId: registration.registrationId || registration.id,
          primaryBarcodeId: registration.primaryBarcodeId || "",
          name: registration.name || "",
          phoneNumber: registration.phoneNumber || "",
          city: registration.city || "",
          state: registration.state || "",
          hasHusband: registration.hasHusband ? "Yes" : "No",
          husbandName: registration.husbandName || "",
          husbandBarcodeId: registration.spouseBarcodeId || "",
          additionalPeople:
            registration?.additionalPeople
              ?.map((res) => `${res.name} ( ${res.relation} )`)
              .join(", ") || "",
          createdAt: registration.createdAt
            ? formatDateTime(registration.createdAt)
            : "",
          updatedAt: registration.updatedAt
            ? formatDateTime(registration.updatedAt)
            : "",
          photoURL: registration.photoURL || "",
          husbandPhotoURL: registration.husbandPhotoURL || "",
          arrivalDate: registration.arrivalDate || "",
          arrivalTime: registration.arrivalTime || "",
          arrivalTravelMode: registration.arrivalTravelMode || "",
          arrivalTrainName: registration.arrivalTrainName || "",
          departureDate: registration.departureDate || "",
          departureTime: registration.departureTime || "",
          departureTravelMode: registration.departureTravelMode || "",
          departureTrainName: registration.departureTrainName || "",
          primaryBarcode: primaryBarcode || "",
          spouseBarcode: spouseBarcode || "",
        };
      }),
    );

    // Create Excel file component
    const ExcelComponent = () => (
      <ExcelFile filename={filename} element={<button>Download</button>}>
        <ExcelSheet data={processedData} name="Registrations">
          {/* Define columns */}
        </ExcelSheet>
      </ExcelFile>
    );

    // Trigger download
    const tempDiv = document.createElement("div");
    tempDiv.style.visibility = "hidden";
    document.body.appendChild(tempDiv);

    // Use React to render and trigger download
    const { createRoot } = await import("react-dom/client");
    const root = createRoot(tempDiv);
    root.render(<ExcelComponent />);

    setTimeout(() => {
      document.body.removeChild(tempDiv);
    }, 1000);
  } catch (error) {
    console.error("Excel Export Failed:", error);
    alert("Failed to export Excel file. Please try again.");
  }
};

// SOLUTION 3: Using file-saver and canvas approach
// Install: npm install file-saver

const generateBarcodeImage = (text, width = 300, height = 80) => {
  if (!text) return null;

  try {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, text, {
      format: "CODE128",
      width: 2,
      height: height,
      displayValue: true,
      fontSize: 14,
      margin: 10,
      background: "#ffffff",
      lineColor: "#000000",
    });
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Error generating barcode:", error);
    return null;
  }
};

// Keep the original CSV export function
export const exportToCSV = (data, filename = "registrations-export.csv") => {
  if (!data.length) {
    alert("No data to export");
    return;
  }

  try {
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
      "Arrival Train Name": registration.arrivalTrainName || "",
      "Departure Date": registration.departureDate || "",
      "Departure Time": registration.departureTime || "",
      "Departure Travel Mode": registration.departureTravelMode || "",
      "Departure Train Name": registration.departureTrainName || "",
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
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
          .join(","),
      ),
    ].join("\n");

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
    console.error("CSV Export Failed:", error);
    alert("Failed to export CSV. Please try again.");
  }
};
