import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Correct import for Firestore

const firebaseConfig = {
  apiKey: "AIzaSyCbvJlvzveLYa-DoU9qxzC1lh91T0L0JF8",
  authDomain: "chat-app-ae251.firebaseapp.com", 
  projectId: "chat-app-ae251",
  storageBucket: "chat-app-ae251.appspot.com",
  messagingSenderId: "569656834476",
  appId: "1:569656834476:web:7a3434dfa609adfb0a6209",
  measurementId: "G-8VY622636E",
};

// ✅ Avoid reinitializing Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);  // Ensure Firestore is used, not Realtime Database
