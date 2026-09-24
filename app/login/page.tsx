"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // লগইন হওয়ার পর ইউজারের রোল চেক করা
      const userDocRef = doc(db, "users", userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const roleId = userDoc.data().roleId;
        
        // রোল অনুযায়ী রিডাইরেক্ট লজিক
        if (roleId === "superadmin" || roleId === "admin") {
          router.push("/admin/dashboard");
        } else if (roleId === "teacher") {
          router.push("/teacher/dashboard");
        } else if (roleId === "accountant") {
          router.push("/accountant/dashboard");
        } else {
          router.push("/dashboard"); // ডিফল্ট ড্যাশবোর্ড
        }
      } else {
        setError("ইউজারের ডেটাবেস রেকর্ড পাওয়া যায়নি।");
      }
    } catch (err: any) {
      setError("ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">মাদ্রাসা প্যানেল লগইন</h2>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">ইমেইল</label>
            <input 
              type="email" 
              required
              className="w-full border rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">পাসওয়ার্ড</label>
            <input 
              type="password" 
              required
              className="w-full border rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 transition"
          >
            {loading ? "অপেক্ষা করুন..." : "লগইন করুন"}
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm text-blue-600">
          <a href="/login/forgot-password">পাসওয়ার্ড ভুলে গেছেন?</a>
        </div>
      </div>
    </div>
  );
}