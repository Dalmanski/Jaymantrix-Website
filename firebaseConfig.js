// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB1ml6EDtwonifxSb1WDgBvXr3vcv6vAMo",
  authDomain: "jaymantrix-website.firebaseapp.com",
  projectId: "jaymantrix-website",
  storageBucket: "jaymantrix-website.firebasestorage.app",
  messagingSenderId: "574310941646",
  appId: "1:574310941646:web:a2cfb699c4af340d57a19f",
  measurementId: "G-XCRXV87937"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

if (typeof window !== 'undefined') {
  window.firebaseApp = app;
  window.firebaseDb = db;
}

export { app, analytics, db };