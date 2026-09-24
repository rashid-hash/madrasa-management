// File: lib/firebase/config.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // auth ইম্পোর্ট করা হলো
import { getFirestore } from "firebase/firestore";
// import { getStorage } from "firebase/storage"; // ছবি আপলোডের জন্য লাগলে আনকমেন্ট করবেন

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Next.js-এ ফায়ারবেস যেন বারবার ইনিশিয়ালাইজ না হয়, তার জন্য এই চেকটি জরুরি
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Database এবং Authentication ইনিশিয়ালাইজ করা হলো
const db = getFirestore(app);
const auth = getAuth(app); 

// দুটোই এক্সপোর্ট করা হলো যাতে অন্য ফাইলে ব্যবহার করা যায়
export { db, auth };