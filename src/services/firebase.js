// Firebase Integration Service
// services/firebase.js

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Function to check if user exists
export const checkUserByPhone = async (phoneNumber) => {
  try {
    const userQuery = query(
      collection(db, "users"),
      where("phoneNumber", "==", phoneNumber)
    );
    const querySnapshot = await getDocs(userQuery);

    if (!querySnapshot.empty) {
      return {
        exists: true,
        userData: querySnapshot.docs[0].data(),
        userId: querySnapshot.docs[0].id,
      };
    }

    return { exists: false };
  } catch (error) {
    console.error("Error checking user:", error);
    throw error;
  }
};

// Function to create or update user
export const saveUser = async (userData) => {
  try {
    const { exists, userId } = await checkUserByPhone(userData.phoneNumber);

    if (exists) {
      // Update existing user
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        name: userData.name,
        city: userData.city,
        state: userData.state,
        photoURL: userData.photoURL || null,
        updatedAt: new Date(),
      });
      return userId;
    } else {
      // Create new user
      const userRef = await addDoc(collection(db, "users"), {
        phoneNumber: userData.phoneNumber,
        name: userData.name,
        city: userData.city,
        state: userData.state,
        photoURL: userData.photoURL || null,
        createdAt: new Date(),
      });
      return userRef.id;
    }
  } catch (error) {
    console.error("Error saving user:", error);
    throw error;
  }
};

// Function to upload file to Firebase Storage
export const uploadFile = async (file, path) => {
  if (!file) return null;

  try {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Progress can be tracked here
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        }
      );
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Function to save registration
export const saveRegistration = async (registrationData) => {
  try {
    // Save or update user first
    const userId = await saveUser({
      phoneNumber: registrationData.phoneNumber,
      name: registrationData.name,
      city: registrationData.city,
      state: registrationData.state,
      photoURL: registrationData.photoURL,
    });

    // Create registration
    const regData = {
      userId,
      ...registrationData,
      registrationDate: new Date(),
    };

    const registrationRef = await addDoc(
      collection(db, "registrations"),
      regData
    );
    return registrationRef.id;
  } catch (error) {
    console.error("Error saving registration:", error);
    throw error;
  }
};

export { db, storage };
export default app;
