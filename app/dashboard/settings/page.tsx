// File: app/dashboard/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase/config";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Save, 
  Loader2, 
  CheckCircle2,
  Settings as SettingsIcon
} from "lucide-react";

export default function GeneralSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // সেটিংসের স্টেট
  const [formData, setFormData] = useState({
    instituteName: "",
    address: "",
    phone: "",
    email: "",
    establishedYear: "",
    currentSession: "" // যেমন: ২০২৬-২০২৭
  });

  // পেজ লোড হলে ডেটাবেস থেকে বিদ্যমান সেটিংস আনা
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setFormData(docSnap.data() as any);
        } else {
          // যদি ডেটা না থাকে, তবে ডিফল্ট কিছু ডেটা সেট করা
          setFormData({
            instituteName: "মাদ্রাসাতুল উলুম আল-ইসলামিয়া",
            address: "১২৩, ইসলামপুর রোড, ঢাকা-১১০০",
            phone: "০১৭১২-৩৪৫৬৭৮",
            email: "info@madrasa.com",
            establishedYear: "২০১০",
            currentSession: "২০২৬-২০২৭"
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // ইনপুট হ্যান্ডলার
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ফায়ারবেসে সেটিংস সেভ করা
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg("");

    try {
      const docRef = doc(db, "settings", "general");
      await setDoc(docRef, {
        ...formData,
        updatedAt: serverTimestamp()
      }, { merge: true }); // merge: true দিলে আগের ডেটা মুছে যায় না, শুধু আপডেট হয়

      setSuccessMsg("প্রতিষ্ঠানের সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      alert("সেটিংস সেভ করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-medium">সেটিংস লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* হেডার */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon size={24} className="text-slate-700" />
          সাধারণ সেটিংস
        </h1>
        <p className="text-gray-500 text-sm mt-1">প্রতিষ্ঠানের মৌলিক তথ্য এবং শিক্ষাবর্ষ আপডেট করুন</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2 font-medium shadow-sm">
          <CheckCircle2 size={20} />
          {successMsg}
        </div>
      )}

      {/* সেটিংস ফর্ম */}
      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        <div className="p-6 border-b border-gray-100 bg-slate-50">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <Building2 size={20} className="text-blue-600" />
            প্রতিষ্ঠানের প্রোফাইল
          </h3>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* প্রতিষ্ঠানের নাম */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">প্রতিষ্ঠানের নাম *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 size={18} className="text-gray-400" />
                </div>
                <input 
                  type="text" required name="instituteName"
                  className="w-full border rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={formData.instituteName} onChange={handleChange}
                />
              </div>
            </div>

            {/* ঠিকানা */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">সম্পূর্ণ ঠিকানা *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin size={18} className="text-gray-400" />
                </div>
                <input 
                  type="text" required name="address"
                  className="w-full border rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={formData.address} onChange={handleChange}
                />
              </div>
            </div>

            {/* ফোন নম্বর */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">যোগাযোগের নম্বর *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone size={18} className="text-gray-400" />
                </div>
                <input 
                  type="text" required name="phone"
                  className="w-full border rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={formData.phone} onChange={handleChange}
                />
              </div>
            </div>

            {/* ইমেইল */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল ঠিকানা (ঐচ্ছিক)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input 
                  type="email" name="email"
                  className="w-full border rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={formData.email} onChange={handleChange}
                />
              </div>
            </div>

            {/* প্রতিষ্ঠার সাল */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">প্রতিষ্ঠার সাল</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 size={18} className="text-gray-400" />
                </div>
                <input 
                  type="text" name="establishedYear" placeholder="যেমন: ২০১০"
                  className="w-full border rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={formData.establishedYear} onChange={handleChange}
                />
              </div>
            </div>

            {/* বর্তমান শিক্ষাবর্ষ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">বর্তমান শিক্ষাবর্ষ (Session) *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar size={18} className="text-gray-400" />
                </div>
                <input 
                  type="text" required name="currentSession" placeholder="যেমন: ২০২৬-২০২৭"
                  className="w-full border rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition font-bold text-blue-700 bg-blue-50"
                  value={formData.currentSession} onChange={handleChange}
                />
              </div>
            </div>

          </div>
        </div>

        {/* সেভ বাটন */}
        <div className="p-6 bg-slate-50 border-t border-gray-100 flex justify-end">
          <button 
            type="submit" 
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition disabled:bg-slate-500 font-bold shadow-md"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? "সংরক্ষণ হচ্ছে..." : "সেটিংস আপডেট করুন"}
          </button>
        </div>
      </form>
    </div>
  );
}