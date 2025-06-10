import React, { useState } from "react";
import {
  collection,
  getDocs,
  writeBatch,
  doc,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/firebase";

const BarcodeUpdater = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [totalDocuments, setTotalDocuments] = useState(0);

  // Collection name - update this to match your collection
  const COLLECTION_NAME = "registrations";

  // Add log entry
  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { message, type, timestamp }]);
    console.log(`[${timestamp}] ${message}`);
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    setProgress(0);
  };

  // Fetch and preview changes
  const previewChanges = async () => {
    setIsLoading(true);
    clearLogs();

    try {
      addLog("Starting preview of barcode changes...");

      // Create query to get documents ordered by registration date
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy("registrationDate", "asc")
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        addLog("No documents found in the collection.", "warning");
        setIsLoading(false);
        return;
      }

      const preview = [];
      let documentCounter = 1;

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const newPrimaryBarcodeId = `B-${documentCounter
          .toString()
          .padStart(4, "0")}`;
        const newSpouseBarcodeId = data.hasHusband
          ? `D-${documentCounter.toString().padStart(4, "0")}`
          : null;

        preview.push({
          id: docSnapshot.id,
          name: data.name || "Unknown",
          currentPrimary: data.primaryBarcodeId || "None",
          newPrimary: newPrimaryBarcodeId,
          currentSpouse: data.spouseBarcodeId || "None",
          newSpouse: newSpouseBarcodeId || "N/A",
          hasHusband: data.hasHusband || false,
        });

        documentCounter++;
      });

      setPreviewData(preview);
      setTotalDocuments(preview.length);
      setShowPreview(true);
      addLog(`Preview generated for ${preview.length} documents.`, "success");
    } catch (error) {
      addLog(`Error generating preview: ${error.message}`, "error");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update barcode IDs
  const updateBarcodeIds = async () => {
    setIsLoading(true);
    setProgress(0);
    clearLogs();

    try {
      addLog("Starting barcode ID update process...");

      // Create query to get documents ordered by registration date
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy("registrationDate", "asc")
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        addLog("No documents found in the collection.", "warning");
        setIsLoading(false);
        return;
      }

      addLog(`Found ${snapshot.size} documents to process.`);

      // Process documents in batches (Firestore limit is 500 operations per batch)
      const batchSize = 500;
      const batches = [];
      let currentBatch = writeBatch(db);
      let operationCount = 0;
      let documentCounter = 1;
      let processedCount = 0;

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const docRef = doc(db, COLLECTION_NAME, docSnapshot.id);

        // Generate new barcode IDs
        const primaryBarcodeId = `B-${documentCounter
          .toString()
          .padStart(4, "0")}`;
        let spouseBarcodeId = null;

        if (data.hasHusband === true) {
          spouseBarcodeId = `D-${documentCounter.toString().padStart(4, "0")}`;
        }

        // Prepare update data
        const updateData = {
          primaryBarcodeId: primaryBarcodeId,
          // updatedAt: serverTimestamp(),
        };

        if (spouseBarcodeId) {
          updateData.spouseBarcodeId = spouseBarcodeId;
        }

        // Add to batch
        currentBatch.update(docRef, updateData);
        operationCount++;

        // If batch is full, save it and start new one
        if (operationCount === batchSize) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          operationCount = 0;
        }

        documentCounter++;
      });

      // Add the last batch if it has operations
      if (operationCount > 0) {
        batches.push(currentBatch);
      }

      // Execute all batches
      addLog(`Executing ${batches.length} batch(es)...`);

      for (let i = 0; i < batches.length; i++) {
        try {
          await batches[i].commit();
          processedCount +=
            i === batches.length - 1 ? operationCount : batchSize;
          setProgress((processedCount / snapshot.size) * 100);
          addLog(`Batch ${i + 1}/${batches.length} completed successfully`);
        } catch (error) {
          addLog(`Error executing batch ${i + 1}: ${error.message}`, "error");
          throw error;
        }
      }

      addLog("All barcode IDs updated successfully!", "success");
      addLog(`Total documents processed: ${documentCounter - 1}`, "success");
      setProgress(100);
    } catch (error) {
      addLog(`Error updating barcode IDs: ${error.message}`, "error");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Barcode ID Updater
      </h1>

      {/* Controls */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={previewChanges}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Loading..." : "Preview Changes"}
        </button>

        <button
          onClick={updateBarcodeIds}
          disabled={isLoading}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Updating..." : "Update Barcode IDs"}
        </button>

        <button
          onClick={clearLogs}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Clear Logs
        </button>
      </div>

      {/* Progress Bar */}
      {isLoading && progress > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Preview Table */}
      {showPreview && previewData.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Preview of Changes ({totalDocuments} documents)
          </h2>
          <div className="overflow-x-auto max-h-96 border rounded-lg">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Current Primary
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    New Primary
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Current Spouse
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    New Spouse
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Has Husband
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {previewData.map((item, index) => (
                  <tr
                    key={item.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {item.currentPrimary}
                    </td>
                    <td className="px-4 py-2 text-sm text-green-600 font-medium">
                      {item.newPrimary}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {item.currentSpouse}
                    </td>
                    <td className="px-4 py-2 text-sm text-green-600 font-medium">
                      {item.newSpouse}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {item.hasHusband ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Logs</h2>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No logs yet. Click "Preview Changes" or "Update Barcode IDs" to
              start.
            </p>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`text-sm p-2 rounded ${
                  log.type === "error"
                    ? "bg-red-100 text-red-800"
                    : log.type === "success"
                    ? "bg-green-100 text-green-800"
                    : log.type === "warning"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <span className="font-mono text-xs text-gray-500">
                  [{log.timestamp}]
                </span>{" "}
                {log.message}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          Instructions:
        </h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
          <li>First, click "Preview Changes" to see what will be updated</li>
          <li>Review the preview table to ensure the changes look correct</li>
          <li>Click "Update Barcode IDs" to execute the changes</li>
          <li>Monitor the progress and logs for any issues</li>
        </ol>
        <p className="mt-2 text-xs text-blue-600">
          <strong>Note:</strong> Make sure to update the COLLECTION_NAME
          variable in the code to match your actual collection name.
        </p>
      </div>
    </div>
  );
};

export default BarcodeUpdater;
