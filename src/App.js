import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegistrationForm from "./components/RegistrationForm";
import "bootstrap";
import "./App.css";
import { db, storage } from "./services/firebase";
import AboutUs from "./page/AboutUs";
import TermsAndConditions from "./page/TermsAndConditions ";

// Your Firebase configuration
// const firebaseConfig = {
//   apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
//   authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.REACT_APP_FIREBASE_APP_ID,
//   measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);
// const storage = getStorage(app);

function App() {
  return (
    <Router
    // basename="/registration2025"
    >
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={<RegistrationForm db={db} storage={storage} />}
          />{" "}
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/policy" element={<TermsAndConditions />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
