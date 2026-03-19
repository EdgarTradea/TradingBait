import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// IMPORTANT: Replace with your own config from your Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyC_JI1wnKFZWmEMUSwnV5NlpDMV4XSxZZE",
  authDomain: "trade-pulse-6970e.firebaseapp.com",
  projectId: "trade-pulse-6970e",
  storageBucket: "trade-pulse-6970e.firebasestorage.app",
  messagingSenderId: "822810817351",
  appId: "1:822810817351:web:90c4d0c2458c0a6f759262",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
