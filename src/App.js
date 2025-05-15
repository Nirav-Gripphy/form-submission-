import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import RegistrationForm from "./components/RegistrationForm";
import "bootstrap";
import "./App.css";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCwCRZPsg-oeJnNm6S_7yEYnA2U0hiqGbE",
  authDomain: "beti-terapanth-ki-reg-form.firebaseapp.com",
  projectId: "beti-terapanth-ki-reg-form",
  storageBucket: "beti-terapanth-ki-reg-form.firebasestorage.app",
  messagingSenderId: "401396289015",
  appId: "1:401396289015:web:9a346efc5024b86c82b2f2",
  measurementId: "G-GZ2WTFBCQW",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={<RegistrationForm db={db} storage={storage} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
