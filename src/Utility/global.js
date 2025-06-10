import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../services/firebase";

export const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";

  try {
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);

    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

export const formatDateTime = (timestamp) => {
  if (!timestamp) return "N/A";

  try {
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);

    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Invalid Date";
  }
};

export const moveTempToLive = async () => {
  try {
    console.log(
      "Starting migration from registrations-temp to registrations..."
    );

    // Get all documents from temp collection
    const tempCollectionRef = collection(db, "registrations-temp");
    const tempSnapshot = await getDocs(tempCollectionRef);

    if (tempSnapshot.empty) {
      console.log("No records found in registrations-temp collection");
      return {
        success: true,
        message: "No records to migrate",
        movedCount: 0,
      };
    }

    console.log(`Found ${tempSnapshot.docs.length} records to migrate`);

    // Use batch for better performance and atomicity
    const batch = writeBatch(db);
    const liveCollectionRef = collection(db, "registrations");

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    // Process each document
    for (const tempDoc of tempSnapshot.docs) {
      try {
        const tempData = tempDoc.data();

        // Prepare data for live collection
        const liveData = {
          ...tempData,
          updatedAt: tempData.updatedAt || serverTimestamp(),
        };

        // Add to live collection
        const newDocRef = doc(liveCollectionRef);
        batch.set(newDocRef, liveData);

        // Mark temp document for deletion
        batch.delete(doc(db, "registrations-temp", tempDoc.id));

        successCount++;
      } catch (docError) {
        console.error(`Error processing document ${tempDoc.id}:`, docError);
        failureCount++;
        errors.push({
          docId: tempDoc.id,
          error: docError.message,
        });
      }
    }

    // Execute batch operation
    await batch.commit();

    console.log(`Migration completed successfully!`);
    console.log(`✅ Successfully moved: ${successCount} records`);
    if (failureCount > 0) {
      console.log(`❌ Failed to move: ${failureCount} records`);
      console.log("Errors:", errors);
    }

    return {
      success: true,
      message: `Successfully migrated ${successCount} records from temp to live collection`,
      movedCount: successCount,
      failureCount,
      errors: failureCount > 0 ? errors : null,
    };
  } catch (error) {
    console.error("Error during migration:", error);

    return {
      success: false,
      message: `Migration failed: ${error.message}`,
      movedCount: 0,
      error: error.message,
    };
  }
};
