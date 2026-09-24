"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("আপনার ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।");
    } catch (err) {
      setMessage("একটি ত্রুটি হয়েছে। ইমেইলটি সঠিক কিনা যাচাই করুন।");
    }
  };

  return (
    // ... লগইন পেজের মতই একটি সিম্পল UI যেখানে শুধু ইমেইল ইনপুট থাকবে ...
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">পাসওয়ার্ড পুনরুদ্ধার</h2>
        {message && <p className="mb-4 text-sm text-green-600">{message}</p>}
        <form onSubmit={handleReset}>
          <input 
            type="email" 
            placeholder="আপনার ইমেইল লিখুন"
            className="w-full border rounded px-3 py-2 mb-4"
            value={email} onChange={(e) => setEmail(e.target.value)} required 
          />
          <button type="submit" className="w-full bg-blue-600 text-white rounded py-2">
            রিসেট লিংক পাঠান
          </button>
        </form>
      </div>
    </div>
  );
}