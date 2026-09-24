"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../lib/firebase/config"; // রিলেটিভ পাথ
import { useAutoSave } from "../../../../hooks/useAutoSave";
import { Student } from "../../../../types/student";
import { Loader2, Save } from "lucide-react";

// ফর্মের ডিফল্ট বা প্রাথমিক কাঠামো
const initialFormState: Omit<Student, 'id' | 'createdAt'> = {
  admissionNumber: "",
  basicInfo: { fullName: "", dob: "", gender: "male", bloodGroup: "" },
  familyInfo: { fatherName: "", motherName: "", guardianPhone: "", guardianRelation: "father" },
  address: { present: "", permanent: "" },
  healthDetails: "",
  academicInfo: { classId: "", sectionId: "", previousInstitute: "" },
  status: "incomplete", // ডিফল্টভাবে অসম্পূর্ণ, ফি দিলে এটি active হবে
};

export default function StudentAdmissionPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  // কাস্টম হুক ব্যবহার করে অটো-সেভ ফর্ম স্টেট
  const { data: formData, setData: setFormData, clearData, isLoaded } = useAutoSave(
    "student_admission_draft",
    initialFormState
  );

  // নেস্টেড অবজেক্ট আপডেট করার জন্য হ্যান্ডলার
  const handleNestedChange = (category: keyof typeof initialFormState, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] as object),
        [field]: value
      }
    }));
  };

  // ফায়ারবেসে ডেটা সেভ করা
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg("");

    try {
      const studentsRef = collection(db, "students");
      await addDoc(studentsRef, {
        ...formData,
        createdAt: serverTimestamp(),
      });
      
      setSuccessMsg("শিক্ষার্থীর তথ্য সফলভাবে সংরক্ষিত হয়েছে!");
      clearData(); // সফল হলে লোকাল স্টোরেজ ক্লিয়ার হবে
    } catch (error) {
      console.error("Error adding student: ", error);
      alert("ডেটা সেভ করতে সমস্যা হয়েছে!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) return <div className="p-8 text-center">ডেটা লোড হচ্ছে...</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-slate-900 px-6 py-4">
        <h2 className="text-xl font-bold text-white">নতুন শিক্ষার্থী ভর্তি</h2>
        <p className="text-slate-300 text-sm mt-1">ফর্ম অসম্পূর্ণ রেখে চলে গেলে ডেটা স্বয়ংক্রিয়ভাবে সেভ থাকবে</p>
      </div>

      {successMsg && (
        <div className="m-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        
        {/* ১. মৌলিক তথ্য */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">মৌলিক তথ্য</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ভর্তি নম্বর / আইডি *</label>
              <input required type="text" className="w-full border rounded-lg px-3 py-2"
                value={formData.admissionNumber}
                onChange={(e) => setFormData({...formData, admissionNumber: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">পূর্ণ নাম *</label>
              <input required type="text" className="w-full border rounded-lg px-3 py-2"
                value={formData.basicInfo.fullName}
                onChange={(e) => handleNestedChange('basicInfo', 'fullName', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">জন্ম তারিখ</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2"
                value={formData.basicInfo.dob}
                onChange={(e) => handleNestedChange('basicInfo', 'dob', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">লিঙ্গ</label>
              <select className="w-full border rounded-lg px-3 py-2"
                value={formData.basicInfo.gender}
                onChange={(e) => handleNestedChange('basicInfo', 'gender', e.target.value)}
              >
                <option value="male">ছাত্র</option>
                <option value="female">ছাত্রী</option>
              </select>
            </div>
          </div>
        </section>

        {/* ২. পারিবারিক ও যোগাযোগের তথ্য */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">পারিবারিক তথ্য</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">পিতার নাম *</label>
              <input required type="text" className="w-full border rounded-lg px-3 py-2"
                value={formData.familyInfo.fatherName}
                onChange={(e) => handleNestedChange('familyInfo', 'fatherName', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">মাতার নাম *</label>
              <input required type="text" className="w-full border rounded-lg px-3 py-2"
                value={formData.familyInfo.motherName}
                onChange={(e) => handleNestedChange('familyInfo', 'motherName', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">অভিভাবকের ফোন নম্বর *</label>
              <input required type="tel" className="w-full border rounded-lg px-3 py-2"
                value={formData.familyInfo.guardianPhone}
                onChange={(e) => handleNestedChange('familyInfo', 'guardianPhone', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* ৩. একাডেমিক তথ্য */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">ভর্তির তথ্য (একাডেমিক)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ভর্তির ক্লাস/বিভাগ *</label>
              <select required className="w-full border rounded-lg px-3 py-2"
                value={formData.academicInfo.classId}
                onChange={(e) => handleNestedChange('academicInfo', 'classId', e.target.value)}
              >
                <option value="">নির্বাচন করুন</option>
                <option value="class-1">মক্তব / নার্সারি</option>
                <option value="class-2">হিফজুল কুরআন</option>
                <option value="class-3">কিতাব বিভাগ (১ম বর্ষ)</option>
              </select>
            </div>
          </div>
        </section>

        <div className="pt-4 border-t flex justify-end gap-4">
          <button type="button" onClick={clearData} className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition">
            ফর্ম মুছুন
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSubmitting ? "সংরক্ষণ হচ্ছে..." : "ভর্তি সম্পন্ন করুন"}
          </button>
        </div>
      </form>
    </div>
  );
}