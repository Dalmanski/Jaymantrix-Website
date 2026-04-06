// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const apiKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_firebase_apiKey)
  ? import.meta.env.VITE_firebase_apiKey
  : undefined;

if (!apiKey) {
  throw new Error('firebase_apiKey is not set. Please set VITE_firebase_apiKey in your .env file.');
}

const firebaseConfig = {
  apiKey,
  authDomain: "jaymantrix-website.firebaseapp.com",
  projectId: "jaymantrix-website",
  storageBucket: "jaymantrix-website.firebasestorage.app",
  messagingSenderId: "574310941646",
  appId: "1:574310941646:web:a2cfb699c4af340d57a19f",
  measurementId: "G-XCRXV87937"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

if (typeof window !== 'undefined') {
  window.firebaseApp = app;
  window.firebaseDb = db;
  window.firebaseAuth = auth;
}

export { app, analytics, db, auth };