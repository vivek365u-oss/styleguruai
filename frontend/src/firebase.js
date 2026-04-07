import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDDW9fSoKxoLlH3MJSRNAuD3c-Qnak7rSw",
  authDomain: "tonefit-44fc2.firebaseapp.com",
  projectId: "tonefit-44fc2",
  storageBucket: "tonefit-44fc2.firebasestorage.app",
  messagingSenderId: "382677564269",
  appId: "1:382677564269:web:d8bf5abd28dd7f544db864"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = typeof window !== 'undefined' ? initializeAnalytics(app, {
  config: {
    send_page_view: true,
    allow_ad_personalization_signals: false
  }
}) : null;
export const googleProvider = new GoogleAuthProvider();