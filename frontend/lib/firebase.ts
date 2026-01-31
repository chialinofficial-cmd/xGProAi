import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAoEHga04IWEB0IeZKYPrKmNp5eDXH_Hyc",
    authDomain: "xgproai-f563a.firebaseapp.com",
    projectId: "xgproai-f563a",
    storageBucket: "xgproai-f563a.firebasestorage.app",
    messagingSenderId: "807453352709",
    appId: "1:807453352709:web:fbc0e463b638a297ba0d6c",
    measurementId: "G-GMVYJ6991E"
};

// Initialize Firebase (prevent multiple instances in Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
