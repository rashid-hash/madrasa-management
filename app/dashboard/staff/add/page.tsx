"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../lib/firebase/config"; // ৪ ধাপ পেছনে
import { Staff } from "../../../../types/staff";
import { Loader2, Save, UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";

// ফর্মের ডিফল্ট কাঠামো
const initialFormState: Omit<Staff, 'id' | 'createdAt'> = {
  employeeId: "",
  personalInfo: {
    fullName: "",
    phone: "",
    email: "",
    designation: "",
    joinDate: new Date().toISOString().split('T')[0], // আজকের তারিখ ডিফল্ট
  },
  salaryInfo: {
    basicSalary: 0,
    currentStatus: "paid", // নতুন স্টাফের কোনো বকেয়া নেই, তাই ডিফল্ট 'paid'
  },
  status: "active",
};

export default function AddStaffPage() {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // নেস্টেড অবজেক্ট আপডেট করার হ্যান্ডলার
  const handlePersonalInfoChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }));
  };

  // ফায়ারবেসে স্টাফের ডেটা সেভ করা
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg("");

    try {
      const staffsRef = collection(db, "staffs");
      await addDoc(staffsRef, {
        ...formData,
        createdAt: serverTimestamp(),
      });
      
      setSuccessMsg("নতুন স্টাফের তথ্য সফলভাবে সংরক্ষিত হয়েছে!");
      setFormData(initialFormState); // সফল হলে ফর্ম রিসেট
    } catch (error) {
      console.error("Error adding staff: ", error);
      alert("ডেটা সেভ করতে সমস্যা হয়েছে! ইন্টারনেট কানেকশন চেক করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* হেডার ও ব্যাক বাটন */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">নতুন স্টাফ যুক্ত করুন</h1>
          <p className="text-gray-500 text-sm mt-1">শিক্ষক, কর্মকর্তা বা কর্মচারীর প্রোফাইল তৈরি করুন</p>
        </div>
        <Link 
          href="/dashboard/staff"
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 bg-white px-4 py-2 rounded-lg border shadow-sm transition"
        >
          <ArrowLeft size={18} />
          তালিকায় ফিরে যান
        </Link>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2 font-medium shadow-sm">
          <UserPlus size={20} />
          {successMsg}
        </div>
      )}

      {/* মূল ফর্ম */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {/* ১. ব্যক্তিগত তথ্য */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">ব্যক্তিগত ও যোগাযোগের তথ্য</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পূর্ণ নাম *</label>
                <input 
                  required type="text" 
                  placeholder="উদাঃ আব্দুর রহমান"
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  value={formData.personalInfo.fullName}
                  onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ফোন নম্বর *</label>
                <input 
                  required type="tel" 
                  placeholder="০১৭১২-৩৪৫৬৭৮"
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  value={formData.personalInfo.phone}
                  onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল ঠিকানা (ঐচ্ছিক)</label>
                <input 
                  type="email" 
                  placeholder="example@email.com"
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  value={formData.personalInfo.email}
                  onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* ২. চাকরি ও বেতনের তথ্য */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">চাকরি ও বেতনের তথ্য</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">স্টাফ আইডি *</label>
                <input 
                  required type="text" 
                  placeholder="উদাঃ EMP-001"
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono uppercase"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value.toUpperCase()})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পদবি (Designation) *</label>
                <input 
                  required type="text" 
                  placeholder="উদাঃ সিনিয়র শিক্ষক / হিসাবরক্ষক"
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  value={formData.personalInfo.designation}
                  onChange={(e) => handlePersonalInfoChange('designation', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">যোগদানের তারিখ *</label>
                <input 
                  required type="date" 
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  value={formData.personalInfo.joinDate}
                  onChange={(e) => handlePersonalInfoChange('joinDate', e.target.value)}
                />
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <label className="block text-sm font-bold text-blue-800 mb-1">নির্ধারিত মাসিক মূল বেতন (টাকা) *</label>
                <input 
                  required type="number" min="0"
                  placeholder="উদাঃ ১৫০০০"
                  className="w-full border border-blue-200 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-medium text-gray-900"
                  value={formData.salaryInfo.basicSalary || ""}
                  onChange={(e) => setFormData({
                    ...formData, 
                    salaryInfo: { ...formData.salaryInfo, basicSalary: Number(e.target.value) }
                  })}
                />
                <p className="text-xs text-blue-600 mt-2">এই বেতনটি প্রতি মাসে পেরোল করার সময় ডিফল্ট হিসেবে আসবে।</p>
              </div>
            </div>
          </section>

          {/* সাবমিট বাটন */}
          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 font-medium shadow-sm"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {isSubmitting ? "সংরক্ষণ হচ্ছে..." : "স্টাফ যুক্ত করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}