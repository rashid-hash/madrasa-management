// File: lib/firebase/config.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// import { getAuth } from "firebase/auth"; // লগইন সিস্টেমের জন্য (যদি লাগে)
// import { getStorage } from "firebase/storage"; // ছবি আপলোডের জন্য (যদি লাগে)

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
const db = getFirestore(app);

// const auth = getAuth(app);
// const storage = getStorage(app);

export { db }; 
// export { db, auth, storage }; // যদি auth ও storage ব্যবহার করেন