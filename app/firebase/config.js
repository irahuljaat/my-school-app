// firebase/config.js

// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getFirestore, collection, 
    getDocs, 
    setDoc, 
    doc, 
    query, 
    where, 
    Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey:process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get instances of services
export const db = getFirestore(app); // Cloud Firestore Database
export const auth = getAuth(app);     // Authentication Service
export const storage = getStorage(app);
export {  
    app ,
    collection, // <-- Must be exported here
    getDocs, 
    setDoc, 
    doc, 
    query, 
    where, 
    Timestamp 
};

if (typeof window !== 'undefined' && app.name && !app.name.includes('[DEFAULT]')) {
  console.log('Firebase connection verified.');
}