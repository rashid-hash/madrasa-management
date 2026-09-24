// File: app/dashboard/exams/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../../lib/firebase/config"; // ৪ ধাপ পেছনে
import { ClassInfo } from "../../../../types/class";
import { 
  ArrowLeft, Save, Loader2, CalendarDays, CheckSquare, Square
} from "lucide-react";

export default function CreateExamPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  // ফর্ম স্টেট
  const [name, setName] = useState("");
  const [term, setTerm] = useState("");
  const [examDate, setExamDate] = useState("");
  const [participatingClasses, setParticipatingClasses] = useState<string[]>([]);

  // ডেটাবেস থেকে বিদ্যমান ক্লাসগুলো ফেচ করা
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const q = query(collection(db, "classes"), orderBy("orderIndex", "asc"));
        const snapshot = await getDocs(q);
        const classList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ClassInfo[];
        setClasses(classList);
        
        // ডিফল্টভাবে সব ক্লাস সিলেক্টেড রাখার লজিক (ক্যাটালগ অনুযায়ী স্বয়ংক্রিয় অংশগ্রহণ)
        setParticipatingClasses(classList.map(c => c.id as string));
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, []);

  // ক্লাস সিলেক্ট বা ডিসিলেক্ট করার ফাংশন
  const toggleClassSelection = (classId: string) => {
    setParticipatingClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId) // আনচেক করলে বাদ যাবে
        : [...prev, classId] // চেক করলে যুক্ত হবে
    );
  };

  // ফায়ারবেসে পরীক্ষার ডেটা সেভ করা
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (participatingClasses.length === 0) {
      alert("পরীক্ষায় অংশগ্রহণ করার জন্য অন্তত একটি ক্লাস নির্বাচন করুন!");
      return;
    }
    
    setIsSubmitting(true);

    try {
      const examData = {
        name,
        term,
        examDate,
        status: "upcoming", // নতুন পরীক্ষা ডিফল্টভাবে 'upcoming' বা আসন্ন থাকে
        isResultPublished: false, // ডিফল্ট ফলাফল অপ্রকাশিত[cite: 1]
        participatingClasses,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "exams"), examData);
      
      // সেভ হওয়ার পর পরীক্ষার ড্যাশবোর্ডে রিডাইরেক্ট করা
      router.push("/dashboard/exams");
      
    } catch (error) {
      alert("পরীক্ষা তৈরি করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* হেডার ও ব্যাক বাটন */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarDays size={24} className="text-blue-600" />
            নতুন পরীক্ষা তৈরি করুন
          </h1>
          <p className="text-gray-500 text-sm mt-1">পরীক্ষার নাম, ধরন এবং অংশগ্রহণকারী ক্লাস নির্বাচন করুন</p>
        </div>
        <Link 
          href="/dashboard/exams"
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 bg-white px-4 py-2 rounded-lg border shadow-sm transition"
        >
          <ArrowLeft size={18} />
          ফিরে যান
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ১. পরীক্ষার সাধারণ তথ্য */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-5">
            মৌলিক তথ্য
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">পরীক্ষার নাম *</label>
              <input 
                required type="text" placeholder="উদাঃ অর্ধ-বার্ষিক পরীক্ষা ২০২৬"
                className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={name} onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">পরীক্ষার ধরন (Term) *</label>
              <select 
                required className="w-full border rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={term} onChange={(e) => setTerm(e.target.value)}
              >
                <option value="">নির্বাচন করুন</option>
                <option value="সাময়িক / টিউটোরিয়াল">সাময়িক / টিউটোরিয়াল</option>
                <option value="অর্ধ-বার্ষিক">অর্ধ-বার্ষিক পরীক্ষা (Half-Yearly)</option>
                <option value="বার্ষিক">বার্ষিক পরীক্ষা (Annual)</option>
                <option value="মডেল টেস্ট">মডেল টেস্ট</option>
                <option value="কেন্দ্রীয় পরীক্ষা">কেন্দ্রীয় পরীক্ষা (Board/Wifaq)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">শুরুর তারিখ *</label>
              <input 
                required type="date"
                className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={examDate} onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ২. অংশগ্রহণকারী ক্লাস নির্বাচন */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between border-b pb-3 mb-5">
            <h3 className="text-lg font-bold text-gray-800">
              অংশগ্রহণকারী ক্লাসসমূহ[cite: 1]
            </h3>
            <div className="text-sm text-gray-500">
              নির্বাচিত ক্লাস: <strong className="text-blue-600">{participatingClasses.length}</strong>
            </div>
          </div>
          
          {loadingClasses ? (
            <div className="text-center py-6 text-gray-500">ক্লাসের তালিকা লোড হচ্ছে...</div>
          ) : classes.length === 0 ? (
            <div className="text-center py-6 text-red-500 bg-red-50 rounded-lg border border-red-100">
              কোনো ক্লাস পাওয়া যায়নি। আগে ক্লাস তৈরি করুন।
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {classes.map((cls) => {
                const isSelected = participatingClasses.includes(cls.id as string);
                return (
                  <div 
                    key={cls.id}
                    onClick={() => toggleClassSelection(cls.id as string)}
                    className={`cursor-pointer flex items-start gap-3 p-3 rounded-lg border transition ${
                      isSelected ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <div className={`mt-0.5 ${isSelected ? "text-blue-600" : "text-gray-400"}`}>
                      {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${isSelected ? "text-blue-900" : "text-gray-700"}`}>
                        {cls.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{cls.department} বিভাগ</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* সাবমিট বাটন */}
        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={isSubmitting || loadingClasses}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:bg-blue-400 font-bold shadow-md"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSubmitting ? "তৈরি হচ্ছে..." : "পরীক্ষা তৈরি করুন"}
          </button>
        </div>
      </form>
    </div>
  );
}