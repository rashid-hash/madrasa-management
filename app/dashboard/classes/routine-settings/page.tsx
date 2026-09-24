// File: app/dashboard/classes/routine-settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../lib/firebase/config"; // ৪ ধাপ পেছনে
import { 
  ArrowLeft, Save, Loader2, Clock, PlusCircle, Trash2, CheckCircle2, AlertCircle
} from "lucide-react";

// পিরিয়ডের ইন্টারফেস
interface PeriodSetting {
  id: string;
  name: string; // যেমন: "১ম পিরিয়ড" বা "টিফিন বিরতি"
  startTime: string; // যেমন: "08:00"
  endTime: string; // যেমন: "08:45"
  isBreak: boolean; // বিরতি কিনা তা চিহ্নিত করার জন্য
}

export default function RoutineSettingsPage() {
  const [periods, setPeriods] = useState<PeriodSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // ফায়ারবেস থেকে আগের সেভ করা সেটিংস ফেচ করা
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "routine");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().periods) {
          setPeriods(docSnap.data().periods);
        } else {
          // ডিফল্ট কিছু পিরিয়ড দিয়ে দেওয়া
          setPeriods([
            { id: "p1", name: "১ম পিরিয়ড", startTime: "08:00", endTime: "08:45", isBreak: false },
            { id: "p2", name: "২য় পিরিয়ড", startTime: "08:45", endTime: "09:30", isBreak: false },
            { id: "p3", name: "টিফিন ও বিরতি", startTime: "09:30", endTime: "10:00", isBreak: true },
          ]);
        }
      } catch (error) {
        console.error("Error fetching routine settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // নতুন পিরিয়ড বা বিরতি যোগ করা
  const addPeriod = (isBreak: boolean) => {
    const newId = `p${Date.now()}`;
    const newName = isBreak ? "নতুন বিরতি" : `${periods.filter(p => !p.isBreak).length + 1}ম পিরিয়ড`;
    setPeriods([...periods, { id: newId, name: newName, startTime: "", endTime: "", isBreak }]);
  };

  // পিরিয়ড রিমুভ করা
  const removePeriod = (id: string) => {
    setPeriods(periods.filter(p => p.id !== id));
  };

  // পিরিয়ডের ডেটা আপডেট করা
  const updatePeriod = (id: string, field: keyof PeriodSetting, value: string | boolean) => {
    setPeriods(periods.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  // ফায়ারবেসে সেটিংস সেভ করা
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg("");

    try {
      const docRef = doc(db, "settings", "routine");
      await setDoc(docRef, { 
        periods,
        updatedAt: serverTimestamp() 
      }, { merge: true });

      setSuccessMsg("রুটিনের সময়সূচি সফলভাবে সংরক্ষিত হয়েছে!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      alert("সেটিংস সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">সেটিংস লোড হচ্ছে...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* হেডার ও ব্যাক বাটন */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Clock size={24} className="text-blue-600" />
            রুটিন ও পিরিয়ড সেটিংস
          </h1>
          <p className="text-gray-500 text-sm mt-1">প্রতিদিনের ক্লাস ও বিরতির সময় একবার নির্ধারণ করুন</p>
        </div>
        <Link 
          href="/dashboard/classes"
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 bg-white px-4 py-2 rounded-lg border shadow-sm transition"
        >
          <ArrowLeft size={18} />
          তালিকায় ফিরে যান
        </Link>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2 font-medium shadow-sm">
          <CheckCircle2 size={20} />
          {successMsg}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 text-sm text-blue-800">
        <AlertCircle size={20} className="shrink-0 mt-0.5" />
        <p>
          <strong>নির্দেশনা:</strong> এখানে আপনি যে কয়টি পিরিয়ড এবং সময় সেট করবেন, তা আপনার প্রতিষ্ঠানের সমস্ত ক্লাস ও শাখার রুটিনে স্বয়ংক্রিয়ভাবে অ্যাপ্লাই হয়ে যাবে। পিরিয়ডের নাম ও সময় নিখুঁতভাবে বসান।
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        
        {/* পিরিয়ডের তালিকা */}
        <div className="space-y-4">
          {periods.map((period, index) => (
            <div 
              key={period.id} 
              className={`flex flex-col md:flex-row items-center gap-4 p-4 rounded-lg border relative group
                ${period.isBreak ? "bg-orange-50/50 border-orange-100" : "bg-slate-50 border-slate-200"}
              `}
            >
              <div className="w-full md:w-1/3">
                <label className="block text-xs font-medium text-gray-500 mb-1">পিরিয়ড/বিরতির নাম</label>
                <input 
                  type="text" required
                  className={`w-full border rounded-lg px-3 py-2 text-sm font-bold
                    ${period.isBreak ? "text-orange-700 bg-white border-orange-200" : "text-gray-800"}
                  `}
                  value={period.name}
                  onChange={(e) => updatePeriod(period.id, "name", e.target.value)}
                />
              </div>
              
              <div className="w-full md:w-1/4">
                <label className="block text-xs font-medium text-gray-500 mb-1">শুরুর সময়</label>
                <input 
                  type="time" required
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  value={period.startTime}
                  onChange={(e) => updatePeriod(period.id, "startTime", e.target.value)}
                />
              </div>

              <div className="w-full md:w-1/4">
                <label className="block text-xs font-medium text-gray-500 mb-1">শেষের সময়</label>
                <input 
                  type="time" required
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  value={period.endTime}
                  onChange={(e) => updatePeriod(period.id, "endTime", e.target.value)}
                />
              </div>

              <div className="w-full md:w-auto md:flex-1 flex justify-end">
                <button 
                  type="button" 
                  onClick={() => removePeriod(period.id)} 
                  className="text-red-400 hover:text-red-600 p-2 bg-white rounded-lg border hover:bg-red-50 transition" 
                  title="মুছে ফেলুন"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* নতুন যোগ করার বাটনগুলো */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t">
          <button 
            type="button" 
            onClick={() => addPeriod(false)} 
            className="flex items-center gap-1.5 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium transition border border-blue-200"
          >
            <PlusCircle size={16} /> ক্লাস পিরিয়ড যোগ করুন
          </button>
          
          <button 
            type="button" 
            onClick={() => addPeriod(true)} 
            className="flex items-center gap-1.5 text-sm text-orange-700 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-lg font-medium transition border border-orange-200"
          >
            <PlusCircle size={16} /> টিফিন/বিরতি যোগ করুন
          </button>
        </div>

        {/* সাবমিট বাটন */}
        <div className="flex justify-end pt-6">
          <button 
            type="submit" 
            disabled={isSaving || periods.length === 0}
            className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition disabled:bg-slate-500 font-bold shadow-md"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? "সংরক্ষণ হচ্ছে..." : "সময়সূচি সেভ করুন"}
          </button>
        </div>
      </form>
    </div>
  );
}